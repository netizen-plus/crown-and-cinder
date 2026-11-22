import { MAX_PLAYERS } from './data.js';

const PEER_PREFIX = 'velala-crown-cinder-room-';
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' }
];

/**
 * Dual-transport 2-player room networking:
 * 1) PeerJS (WebRTC DataChannel via PeerJS cloud signaling) for remote play across browsers/devices.
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
    this.peer = null;
    this.peerConnections = new Map(); // remotePeerId -> DataConnection
    this.seenMessageIds = new Set();
    this.heartbeatTimer = null;
    this.retryTimer = null;
  }

  generatePeerId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID().slice(0, 12);
    }
    return Math.random().toString(36).slice(2, 14);
  }

  getHostSignalId() {
    return `${PEER_PREFIX}${this.roomCode}`;
  }

  async hostRoom(roomCode, playerName) {
    await this.disconnect();
    this.role = 'host';
    this.roomCode = roomCode.trim().toUpperCase();
    this.playerName = playerName.trim() || 'Player 1';
    this.guestPeerId = null;
    this.guestName = null;
    this.connected = false;
    this.updateStatus(`Connecting to signaling server for room ${this.roomCode}...`);
    this.setupBroadcastChannel();
    this.setupPeerHost();
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

    this.setupBroadcastChannel();
    this.setupPeerGuest();
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

  setupBroadcastChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.bc = new BroadcastChannel(`velala_room_${this.roomCode}`);
      this.bc.onmessage = (event) => {
        if (event && event.data) {
          this.handleIncoming(event.data);
        }
      };
    }
  }

  setupPeerHost() {
    if (typeof window === 'undefined' || typeof window.Peer !== 'function') {
      this.updateStatus(`P2P library failed to load (local multi-tab only).`);
      return;
    }

    const peer = new window.Peer(this.getHostSignalId(), {
      config: { iceServers: ICE_SERVERS }
    });
    this.peer = peer;

    peer.on('open', () => {
      if (this.peer !== peer || this.role !== 'host') return;
      if (!this.connected) {
        this.updateStatus(`Hosting room ${this.roomCode} (1/2 players — waiting for Player 2...)`);
      }
    });

    peer.on('connection', (conn) => {
      if (this.peer !== peer || this.role !== 'host') return;
      this.attachPeerConnection(conn);
    });

    peer.on('error', (err) => {
      if (this.peer !== peer) return;
      if (err && err.type === 'unavailable-id') {
        this.updateStatus(`Room ${this.roomCode} is already taken! Click "Random Code" and Host again.`);
        return;
      }
      this.updateStatus(`P2P Host error (${err?.type || err?.message || 'unknown'}).`);
    });
  }

  setupPeerGuest() {
    if (typeof window === 'undefined' || typeof window.Peer !== 'function') {
      this.updateStatus(`P2P library failed to load (local multi-tab only).`);
      return;
    }

    const peer = new window.Peer({
      config: { iceServers: ICE_SERVERS }
    });
    this.peer = peer;

    const connectToHost = () => {
      if (this.peer !== peer || this.role !== 'guest' || this.connected) return;
      if (!peer.open || peer.destroyed) return;
      const hostId = this.getHostSignalId();
      if (this.peerConnections.has(hostId)) return;

      const conn = peer.connect(hostId, { reliable: true });
      this.attachPeerConnection(conn);
    };

    peer.on('open', () => {
      if (this.peer !== peer || this.role !== 'guest') return;
      connectToHost();
      this.retryTimer = setInterval(() => {
        if (this.connected || this.role !== 'guest' || this.peer !== peer) {
          clearInterval(this.retryTimer);
          this.retryTimer = null;
          return;
        }
        connectToHost();
      }, 2500);
    });

    peer.on('error', (err) => {
      if (this.peer !== peer) return;
      if (err && err.type === 'peer-unavailable') {
        // Host may still be starting or room code doesn't exist yet; retry loop will try again.
        this.peerConnections.delete(this.getHostSignalId());
        if (!this.connected) {
          this.updateStatus(`Searching for room ${this.roomCode} (waiting for Host)...`);
        }
        return;
      }
      this.updateStatus(`P2P Guest error (${err?.type || err?.message || 'unknown'}).`);
    });
  }

  attachPeerConnection(conn) {
    if (!conn) return;
    this.peerConnections.set(conn.peer, conn);

    conn.on('open', () => {
      if (this.role === 'guest' && !this.connected) {
        this.sendHello();
      }
    });

    conn.on('data', (data) => {
      if (data) this.handleIncoming(data);
    });

    conn.on('close', () => {
      this.peerConnections.delete(conn.peer);
    });

    conn.on('error', () => {
      this.peerConnections.delete(conn.peer);
    });
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
    for (const conn of this.peerConnections.values()) {
      if (conn.open) {
        try {
          conn.send(packet);
        } catch (_) {}
      }
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
        if (this.retryTimer) {
          clearInterval(this.retryTimer);
          this.retryTimer = null;
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
    if (this.role && (this.bc || this.peerConnections.size > 0)) {
      this.sendRaw({ type: 'LEAVE' });
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.bc) {
      try { this.bc.close(); } catch (_) {}
      this.bc = null;
    }
    for (const conn of this.peerConnections.values()) {
      try { conn.close(); } catch (_) {}
    }
    this.peerConnections.clear();
    if (this.peer) {
      try { this.peer.destroy(); } catch (_) {}
      this.peer = null;
    }
    this.role = null;
    this.connected = false;
    this.guestPeerId = null;
    this.guestName = null;
    this.hostPeerId = null;
    this.hostName = null;
  }
}
