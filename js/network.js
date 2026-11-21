import { MAX_PLAYERS } from './data.js';

const APP_ID = 'velala-medieval-roguelite-v2';

/**
 * Dual-transport serverless 2-player room networking:
 * 1) Trystero (WebRTC over public Nostr relays) for remote play across browsers/devices.
 * 2) BroadcastChannel for instant local multi-tab testing or offline 2-tab play.
 * Strictly enforces MAX_PLAYERS = 2 (1 Host + 1 Guest). Any 3rd peer is rejected.
 */
export class RoomNetwork {
  constructor(callbacks) {
    this.callbacks = callbacks || {};
    this.peerId = this.generatePeerId();
    this.role = null; // 'host' | 'guest'
    this.roomCode = '';
    this.playerName = 'Adventurer';
    this.guestPeerId = null;
    this.guestName = null;
    this.hostPeerId = null;
    this.hostName = null;
    this.connected = false;
    this.statusText = 'Not connected';

    this.bc = null;
    this.trysteroRoom = null;
    this.sendTrystero = null;
    this.seenMessageIds = new Set();
    this.heartbeatTimer = null;
  }

  generatePeerId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID().slice(0, 12);
    }
    return Math.random().toString(36).slice(2, 14);
  }

  async hostRoom(roomCode, playerName) {
    await this.disconnect();
    this.role = 'host';
    this.roomCode = roomCode.trim().toUpperCase();
    this.playerName = playerName.trim() || 'Player 1';
    this.guestPeerId = null;
    this.guestName = null;
    this.connected = false;
    this.updateStatus(`Hosting room ${this.roomCode} (1/2 players — waiting for Player 2...)`);
    await this.setupTransports();
  }

  async joinRoom(roomCode, playerName) {
    await this.disconnect();
    this.role = 'guest';
    this.roomCode = roomCode.trim().toUpperCase();
    this.playerName = playerName.trim() || 'Player 2';
    this.guestPeerId = null;
    this.hostPeerId = null;
    this.connected = false;
    this.updateStatus(`Searching for room ${this.roomCode}...`);

    await this.setupTransports();
    this.sendHello();

    this.heartbeatTimer = setInterval(() => {
      if (!this.connected && this.role === 'guest') {
        this.sendHello();
      } else if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    }, 1600);
  }

  async setupTransports() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.bc = new BroadcastChannel(`velala_room_${this.roomCode}`);
      this.bc.onmessage = (event) => {
        if (event && event.data) {
          this.handleIncoming(event.data);
        }
      };
    }

    try {
      const mod = await Promise.race([
        import('https://esm.sh/trystero/nostr'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Trystero timeout')), 6000))
      ]);
      if (mod && typeof mod.joinRoom === 'function') {
        this.trysteroRoom = mod.joinRoom({ appId: APP_ID }, this.roomCode);
        const [sendPacket, onPacket] = this.trysteroRoom.makeAction('game_pkt');
        this.sendTrystero = sendPacket;
        onPacket((data) => this.handleIncoming(data));
        this.trysteroRoom.onPeerJoin(() => {
          if (this.role === 'guest' && !this.connected) this.sendHello();
        });
      }
    } catch (err) {
      if (this.callbacks.onLog) {
        this.callbacks.onLog(`WebRTC relay unavailable (${err.message}). Local multi-tab channel active.`);
      }
    }
  }

  sendRaw(payload) {
    const packet = {
      ...payload,
      msgId: `${this.peerId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      senderId: this.peerId,
      roomCode: this.roomCode
    };
    if (this.bc) {
      try {
        this.bc.postMessage(packet);
      } catch (_) {}
    }
    if (this.sendTrystero) {
      try {
        this.sendTrystero(packet);
      } catch (_) {}
    }
  }

  sendHello() {
    this.sendRaw({ type: 'HELLO', playerName: this.playerName });
  }

  sendWelcome(targetPeerId, stateSnapshot, lobbyConfig) {
    this.sendRaw({
      type: 'WELCOME',
      targetPeerId,
      hostName: this.playerName,
      guestName: this.guestName,
      lobbyConfig,
      state: stateSnapshot
    });
  }

  sendRoomFull(targetPeerId) {
    this.sendRaw({
      type: 'ROOM_FULL',
      targetPeerId,
      reason: `Room ${this.roomCode} already has ${MAX_PLAYERS}/${MAX_PLAYERS} players.`
    });
  }

  broadcastLobbyConfig(lobbyConfig) {
    if (this.role !== 'host') return;
    this.sendRaw({
      type: 'LOBBY_SYNC',
      hostName: this.playerName,
      guestName: this.guestName,
      lobbyConfig
    });
  }

  sendGuestClassChoice(classId) {
    if (this.role !== 'guest') return;
    this.sendRaw({ type: 'GUEST_CLASS', classId });
  }

  broadcastState(stateSnapshot) {
    if (this.role !== 'host') return;
    this.sendRaw({
      type: 'STATE_SYNC',
      hostName: this.playerName,
      guestName: this.guestName,
      state: stateSnapshot
    });
  }

  sendActionIntent(action) {
    if (this.role !== 'guest') return;
    this.sendRaw({ type: 'ACTION_INTENT', action });
  }

  handleIncoming(packet) {
    if (!packet || packet.senderId === this.peerId) return;
    if (packet.roomCode !== this.roomCode) return;
    if (packet.msgId && this.seenMessageIds.has(packet.msgId)) return;
    if (packet.msgId) {
      this.seenMessageIds.add(packet.msgId);
      if (this.seenMessageIds.size > 400) {
        this.seenMessageIds.delete(this.seenMessageIds.values().next().value);
      }
    }

    if (this.role === 'host') {
      if (packet.type === 'HELLO') {
        if (this.guestPeerId && this.guestPeerId !== packet.senderId) {
          this.sendRoomFull(packet.senderId);
          return;
        }
        this.guestPeerId = packet.senderId;
        this.guestName = (packet.playerName || 'Player 2').slice(0, 24);
        this.connected = true;
        this.updateStatus(`Room ${this.roomCode}: 2/2 Players Connected (${this.playerName} & ${this.guestName})`);
        if (this.callbacks.onGuestJoined) this.callbacks.onGuestJoined(this.guestName, this.guestPeerId);
      } else if (packet.type === 'GUEST_CLASS') {
        if (packet.senderId !== this.guestPeerId) return;
        if (this.callbacks.onGuestClass) this.callbacks.onGuestClass(packet.classId);
      } else if (packet.type === 'ACTION_INTENT') {
        if (packet.senderId !== this.guestPeerId) return;
        if (this.callbacks.onActionIntent) this.callbacks.onActionIntent(packet.action);
      } else if (packet.type === 'LEAVE') {
        if (packet.senderId === this.guestPeerId) {
          this.guestPeerId = null;
          this.guestName = null;
          this.connected = false;
          this.updateStatus(`Room ${this.roomCode}: Player 2 left (1/2 players — waiting...)`);
          if (this.callbacks.onPeerLeft) this.callbacks.onPeerLeft('Player 2');
        }
      }
      return;
    }

    if (this.role === 'guest') {
      if (packet.type === 'ROOM_FULL' && packet.targetPeerId === this.peerId) {
        const reason = packet.reason || 'Room is full (2/2 players).';
        this.disconnect();
        this.updateStatus(reason);
        if (this.callbacks.onRejected) this.callbacks.onRejected(reason);
        return;
      }
      if (packet.type === 'WELCOME' && packet.targetPeerId === this.peerId) {
        this.hostPeerId = packet.senderId;
        this.hostName = packet.hostName || 'Player 1';
        this.connected = true;
        if (this.heartbeatTimer) {
          clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = null;
        }
        this.updateStatus(`Joined Room ${this.roomCode}: 2/2 Players (${this.hostName} & ${this.playerName})`);
        if (this.callbacks.onJoined) this.callbacks.onJoined(this.hostName, packet.state, packet.lobbyConfig);
        return;
      }
      if (packet.type === 'LOBBY_SYNC' && (!this.hostPeerId || packet.senderId === this.hostPeerId)) {
        if (this.callbacks.onLobbySync) this.callbacks.onLobbySync(packet);
        return;
      }
      if (packet.type === 'STATE_SYNC' && (!this.hostPeerId || packet.senderId === this.hostPeerId)) {
        if (this.callbacks.onStateSync) this.callbacks.onStateSync(packet.state);
        return;
      }
      if (packet.type === 'LEAVE' && packet.senderId === this.hostPeerId) {
        this.connected = false;
        this.updateStatus(`Host closed room ${this.roomCode}.`);
        if (this.callbacks.onPeerLeft) this.callbacks.onPeerLeft('Host');
      }
    }
  }

  updateStatus(text) {
    this.statusText = text;
    if (this.callbacks.onStatusChange) this.callbacks.onStatusChange(text, this.getInfo());
  }

  getInfo() {
    return {
      role: this.role,
      roomCode: this.roomCode,
      connected: this.connected,
      playerCount: this.role ? (this.connected ? 2 : 1) : 1,
      maxPlayers: MAX_PLAYERS,
      hostName: this.role === 'host' ? this.playerName : this.hostName,
      guestName: this.role === 'host' ? this.guestName : this.playerName,
      statusText: this.statusText
    };
  }

  async disconnect() {
    if (this.role && (this.bc || this.sendTrystero)) {
      this.sendRaw({ type: 'LEAVE' });
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.bc) {
      try { this.bc.close(); } catch (_) {}
      this.bc = null;
    }
    if (this.trysteroRoom) {
      try { await this.trysteroRoom.leave(); } catch (_) {}
      this.trysteroRoom = null;
    }
    this.sendTrystero = null;
    this.role = null;
    this.connected = false;
    this.guestPeerId = null;
    this.guestName = null;
    this.hostPeerId = null;
    this.hostName = null;
  }
}
