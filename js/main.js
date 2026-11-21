import {
  TOTAL_STAGES,
  DIFFICULTIES,
  BIOMES,
  STATUS_INFO,
  FINAL_BOSSES,
  CONSUMABLES,
  RELICS
} from './data.js';
import {
  generateRolledRoster,
  getHeroSkill,
  estimateHitDamage,
  createNewRun,
  choosePath,
  executeCombatAction,
  selectReward,
  restAtCamp,
  buyShopItem,
  leaveCamp,
  resolveEventChoice,
  continueFromEvent
} from './engine.js';
import { RoomNetwork } from './network.js';
import { getSpriteSvg, getBiomeSceneSvg, isFloatingSprite } from './sprites.js';
import { sceneRenderer } from './webgl_scene.js';

// === APP STATE ===
let gameState = null;
let selectedMode = 'solo'; // 'solo' | 'local' | 'online'
let selectedDifficulty = 'normal'; // 'easy' | 'normal' | 'hard'
let lobbySeed = Math.floor(Math.random() * 9000000) + 100000;
let p1Class = 'knight';
let p2Class = 'wizard';
let armedAction = null; // { kind: 'SKILL'|'ITEM', id: string, targetType: string }
let pendingCombatSnap = null;
let pendingVfxHint = null;

const el = (id) => document.getElementById(id);

function snapshotCombatState() {
  if (!gameState || gameState.phase !== 'COMBAT' || !gameState.combat) return null;
  return {
    round: gameState.combat.round,
    activeHeroIdx: gameState.combat.activeHeroIdx,
    heroes: gameState.party.map((h) => ({ uid: h.uid, hp: h.hp, shield: h.shield })),
    enemies: gameState.combat.enemies.map((e) => ({ uid: e.uid, hp: e.hp, shield: e.shield }))
  };
}

function inferSkillVfxKind(skill) {
  if (!skill) return 'physical';
  if (skill.enemyStatus && skill.enemyStatus.id === 'burn') return 'fire';
  if (skill.damageType === 'nature') return 'nature';
  if (skill.damageType === 'magic') return 'magic';
  if (skill.damageType === 'support') {
    return skill.healAmount || skill.partyHeal || skill.revivePct ? 'heal' : 'shield';
  }
  return 'physical';
}

// === NETWORK ===
const network = new RoomNetwork({
  onStatusChange(text, info) {
    renderNetworkStatus(text, info);
  },
  onGuestJoined(guestName) {
    el('p2-name').value = guestName;
    if (gameState && gameState.mode === 'online') {
      gameState.players.p2Name = guestName;
      network.sendWelcome(network.guestPeerId, gameState, getLobbyConfig());
      render();
    } else {
      network.sendWelcome(network.guestPeerId, null, getLobbyConfig());
    }
  },
  onGuestClass(classId) {
    if (network.role !== 'host') return;
    p2Class = classId;
    network.broadcastLobbyConfig(getLobbyConfig());
    renderLobby();
  },
  onJoined(hostName, remoteState, lobbyCfg) {
    el('p1-name').value = hostName;
    if (lobbyCfg) applyLobbyConfig(lobbyCfg);
    if (remoteState) {
      gameState = remoteState;
      enterGameView();
      render();
    } else {
      renderLobby();
    }
  },
  onLobbySync(packet) {
    if (packet.hostName) el('p1-name').value = packet.hostName;
    if (packet.lobbyConfig) applyLobbyConfig(packet.lobbyConfig);
    renderLobby();
  },
  onStateSync(remoteState) {
    if (!remoteState) return;
    pendingCombatSnap = snapshotCombatState();
    gameState = remoteState;
    armedAction = null;
    enterGameView();
    render();
  },
  onActionIntent(action) {
    if (network.role !== 'host' || !gameState) return;
    applyAuthorizedAction(action, 2);
  },
  onRejected(reason) {
    const box = el('network-status');
    box.className = 'pill pill-crimson';
    box.textContent = `Rejected: ${reason}`;
    updateOnlineButtons();
  },
  onPeerLeft(who) {
    if (gameState) {
      gameState.log.unshift({
        id: `disc_${Date.now()}`,
        prefix: '[Network]',
        text: `${who} disconnected from the room.`,
        tone: 'system'
      });
      render();
    }
  }
});

window.addEventListener('beforeunload', () => {
  network.disconnect();
});

function getLobbyConfig() {
  return {
    difficulty: selectedDifficulty,
    seed: lobbySeed,
    p1Class,
    p2Class
  };
}

function applyLobbyConfig(cfg) {
  if (cfg.difficulty && DIFFICULTIES[cfg.difficulty]) selectedDifficulty = cfg.difficulty;
  if (cfg.seed) {
    lobbySeed = cfg.seed;
    el('run-seed').value = String(lobbySeed);
  }
  if (cfg.p1Class) p1Class = cfg.p1Class;
  if (cfg.p2Class) p2Class = cfg.p2Class;
}

// === LOBBY ===
function initLobby() {
  el('brand-emblem').innerHTML = getSpriteSvg('brand', 40);
  el('run-seed').value = String(lobbySeed);
  document.body.dataset.biome = 'plains';
  bindLobbyEvents();
  renderLobby();
}

function renderLobby() {
  el('mode-tabs').querySelectorAll('.mode-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.mode === selectedMode);
  });

  const isGuest = selectedMode === 'online' && network.role === 'guest';

  el('diff-tabs').querySelectorAll('.mode-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.diff === selectedDifficulty);
    t.disabled = isGuest;
  });
  el('diff-summary').textContent = DIFFICULTIES[selectedDifficulty].summary;

  el('p2-name-row').classList.toggle('hidden', selectedMode === 'solo');
  el('online-panel').classList.toggle('hidden', selectedMode !== 'online');
  el('btn-roll-seed').disabled = isGuest;
  el('run-seed').disabled = isGuest;

  const rolledRoster = generateRolledRoster(lobbySeed, selectedDifficulty);
  const byId = Object.fromEntries(rolledRoster.map((c) => [c.id, c]));

  const summaryBox = el('chosen-summary');
  if (selectedMode === 'solo') {
    const c1 = byId[p1Class];
    summaryBox.innerHTML = `<strong>Solo Hero:</strong> ${c1.title} — ${c1.name} (HP ${c1.maxHp}, MP ${c1.maxMp}, ATK ${c1.atk}, DEF ${c1.def})`;
  } else {
    const c1 = byId[p1Class];
    const c2 = byId[p2Class];
    summaryBox.innerHTML = `
      <div><strong>Player 1 Class:</strong> <span style="color:var(--gold)">${c1.title} (${c1.name})</span></div>
      <div><strong>Player 2 Class:</strong> <span style="color:#8ce0a3">${c2.title} (${c2.name})</span></div>
    `;
  }

  renderClassCards(rolledRoster);

  el('btn-start-game').disabled = isGuest;
  if (isGuest) {
    el('start-hint').textContent = 'Connected as Player 2 — pick your class on the right and wait for Host to start.';
    el('class-pick-hint').textContent = 'Click any class card to choose for Player 2';
  } else if (selectedMode === 'online') {
    el('start-hint').textContent = 'Host picks Player 1 class; Player 2 picks their own class once joined.';
    el('class-pick-hint').textContent = 'Select Player 1 class (synced with Player 2)';
  } else if (selectedMode === 'local') {
    el('start-hint').textContent = 'Both players share this screen, each controlling their 1 chosen hero.';
    el('class-pick-hint').textContent = 'Use the P1 / P2 buttons on each card to pick 1 class per player';
  } else {
    el('start-hint').textContent = 'Every seed rolls different hero stats, skill numbers, stage paths & boss.';
    el('class-pick-hint').textContent = 'Click a class card to play that hero solo';
  }

  updateOnlineButtons();
}

function renderClassCards(rolledRoster) {
  const container = el('roster-preview-grid');
  const isGuest = selectedMode === 'online' && network.role === 'guest';
  const isHostOnline = selectedMode === 'online' && network.role !== 'guest';

  container.innerHTML = rolledRoster
    .map((h) => {
      const isP1 = p1Class === h.id;
      const isP2 = selectedMode !== 'solo' && p2Class === h.id;
      const selClass =
        isP1 && isP2 ? 'selected-both' : isP1 ? 'selected-p1' : isP2 ? 'selected-p2' : '';

      const basicHtml = h.basicSkills
        .map((sid) => {
          const s = h.skillData[sid];
          return `<li><strong>${s.name}</strong> (${s.mpCost} MP): ${s.description}</li>`;
        })
        .join('');

      let buttonsHtml = '';
      if (selectedMode === 'solo') {
        buttonsHtml = `<button class="btn btn-small ${isP1 ? 'btn-primary' : ''}" data-pick-p1="${h.id}">${isP1 ? 'Selected Hero' : 'Choose Class'}</button>`;
      } else if (selectedMode === 'local') {
        buttonsHtml = `
          <div style="display:flex;gap:6px;">
            <button class="btn btn-small ${isP1 ? 'btn-primary' : ''}" style="flex:1" data-pick-p1="${h.id}">
              ${isP1 ? '✓ Player 1' : 'Set P1'}
            </button>
            <button class="btn btn-small ${isP2 ? 'btn-emerald' : ''}" style="flex:1" data-pick-p2="${h.id}">
              ${isP2 ? '✓ Player 2' : 'Set P2'}
            </button>
          </div>
        `;
      } else if (isGuest) {
        buttonsHtml = `<button class="btn btn-small ${isP2 ? 'btn-emerald' : ''}" data-pick-p2="${h.id}">${isP2 ? '✓ Your Class (P2)' : 'Choose for P2'}</button>`;
      } else if (isHostOnline) {
        buttonsHtml = `<button class="btn btn-small ${isP1 ? 'btn-primary' : ''}" data-pick-p1="${h.id}">${isP1 ? '✓ Your Class (P1)' : 'Choose for P1'}</button>`;
      }

      const badges = [];
      if (isP1) badges.push('<span class="pill pill-gold" style="font-size:0.72rem;padding:1px 6px;">P1</span>');
      if (isP2) badges.push('<span class="pill pill-emerald" style="font-size:0.72rem;padding:1px 6px;">P2</span>');

      return `
        <div class="roster-card ${selClass}" style="border-top: 3px solid ${h.accent}">
          <div>
            <div class="roster-card-head">
              <div class="sprite-frame sprite-alive">${getSpriteSvg(h.id, 64)}</div>
              <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:4px;">
                  <h4>${h.title}</h4>
                  <div style="display:flex;gap:4px;">${badges.join('')}</div>
                </div>
                <div style="font-size:0.85rem;">${h.name}</div>
                <div class="roster-role">${h.role}</div>
              </div>
            </div>
            <div class="hero-stats-line" style="margin-top:6px;">
              <span>HP <strong>${h.maxHp}</strong></span>
              <span>MP <strong>${h.maxMp}</strong></span>
              <span>ATK <strong>${h.atk}</strong></span>
              <span>DEF <strong>${h.def}</strong></span>
            </div>
            <ul class="skill-mini-list" style="margin-top:6px;">${basicHtml}</ul>
          </div>
          ${buttonsHtml}
        </div>
      `;
    })
    .join('');

  container.querySelectorAll('[data-pick-p1]').forEach((btn) => {
    btn.addEventListener('click', () => {
      p1Class = btn.dataset.pickP1;
      if (selectedMode === 'online' && network.role === 'host') {
        network.broadcastLobbyConfig(getLobbyConfig());
      }
      renderLobby();
    });
  });

  container.querySelectorAll('[data-pick-p2]').forEach((btn) => {
    btn.addEventListener('click', () => {
      p2Class = btn.dataset.pickP2;
      if (selectedMode === 'online' && network.role === 'guest') {
        network.sendGuestClassChoice(p2Class);
      }
      renderLobby();
    });
  });
}

function updateOnlineButtons() {
  const active = Boolean(network.role);
  el('btn-host-room').disabled = active;
  el('btn-join-room').disabled = active;
  el('room-code').disabled = active;
  el('btn-leave-room').classList.toggle('hidden', !active);
}

function renderNetworkStatus(text, info) {
  const box = el('network-status');
  box.className = info && info.connected ? 'pill pill-emerald' : 'pill';
  box.textContent = `Status: ${text}`;
  updateOnlineButtons();
  renderLobby();
}

function bindLobbyEvents() {
  el('mode-tabs').querySelectorAll('.mode-tab').forEach((tab) => {
    tab.addEventListener('click', async () => {
      if (network.role) await network.disconnect();
      selectedMode = tab.dataset.mode;
      renderLobby();
    });
  });

  el('diff-tabs').querySelectorAll('.mode-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (selectedMode === 'online' && network.role === 'guest') return;
      selectedDifficulty = tab.dataset.diff;
      if (selectedMode === 'online' && network.role === 'host') {
        network.broadcastLobbyConfig(getLobbyConfig());
      }
      renderLobby();
    });
  });

  el('btn-roll-seed').addEventListener('click', () => {
    lobbySeed = Math.floor(Math.random() * 9000000) + 100000;
    el('run-seed').value = String(lobbySeed);
    if (selectedMode === 'online' && network.role === 'host') {
      network.broadcastLobbyConfig(getLobbyConfig());
    }
    renderLobby();
  });

  el('run-seed').addEventListener('change', () => {
    const parsed = parseInt(el('run-seed').value.trim(), 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      lobbySeed = parsed;
    } else {
      el('run-seed').value = String(lobbySeed);
    }
    if (selectedMode === 'online' && network.role === 'host') {
      network.broadcastLobbyConfig(getLobbyConfig());
    }
    renderLobby();
  });

  el('btn-gen-code').addEventListener('click', () => {
    const words = ['IRON', 'WYRM', 'OAK', 'ASH', 'CROWN', 'RUNE', 'KEEP', 'FIRE'];
    const w = words[Math.floor(Math.random() * words.length)];
    const n = Math.floor(Math.random() * 90) + 10;
    el('room-code').value = `${w}${n}`;
  });

  el('btn-host-room').addEventListener('click', async () => {
    const code = el('room-code').value.trim() || 'IRON77';
    el('room-code').value = code.toUpperCase();
    await network.hostRoom(code, el('p1-name').value);
    renderLobby();
  });

  el('btn-join-room').addEventListener('click', async () => {
    const code = el('room-code').value.trim() || 'IRON77';
    el('room-code').value = code.toUpperCase();
    await network.joinRoom(code, el('p2-name').value);
    renderLobby();
  });

  el('btn-leave-room').addEventListener('click', async () => {
    await network.disconnect();
    renderNetworkStatus('Disconnected', network.getInfo());
  });

  el('btn-start-game').addEventListener('click', async () => {
    if (selectedMode === 'online' && network.role !== 'host') {
      const code = el('room-code').value.trim() || 'IRON77';
      await network.hostRoom(code, el('p1-name').value);
    }

    const parsed = parseInt(el('run-seed').value.trim(), 10);
    lobbySeed = Number.isFinite(parsed) && parsed > 0 ? parsed : Math.floor(Math.random() * 9000000) + 100000;
    el('run-seed').value = String(lobbySeed);

    gameState = createNewRun({
      seed: lobbySeed,
      mode: selectedMode,
      difficulty: selectedDifficulty,
      p1Name: el('p1-name').value.trim() || 'Player 1',
      p2Name: network.guestName || el('p2-name').value.trim() || 'Player 2',
      p1Class,
      p2Class
    });

    armedAction = null;
    pendingCombatSnap = null;

    if (selectedMode === 'online' && network.role === 'host') {
      network.broadcastState(gameState);
    }

    enterGameView();
    render();
  });

  el('btn-back-lobby').addEventListener('click', () => {
    gameState = null;
    armedAction = null;
    pendingCombatSnap = null;
    document.body.dataset.biome = 'plains';
    el('game-view').classList.add('hidden');
    el('lobby-view').classList.remove('hidden');
    el('btn-back-lobby').classList.add('hidden');
    el('room-pill').classList.add('hidden');
    el('diff-pill').classList.add('hidden');
    el('mode-pill').textContent = 'Lobby Setup';
    renderLobby();
  });
}

function enterGameView() {
  el('lobby-view').classList.add('hidden');
  el('game-view').classList.remove('hidden');
  el('btn-back-lobby').classList.remove('hidden');
}

// === DISPATCH ACTIONS ===
function getLocalSlot() {
  if (!gameState) return 1;
  if (gameState.mode === 'solo') return 1;
  if (gameState.mode === 'local') return null;
  return network.role === 'guest' ? 2 : 1;
}

function dispatchAction(action) {
  if (!gameState) return;
  if (gameState.mode === 'online' && network.role === 'guest') {
    network.sendActionIntent(action);
    return;
  }
  const actorSlot = gameState.mode === 'online' ? 1 : action.actorSlot || 1;
  applyAuthorizedAction(action, actorSlot);
}

function applyAuthorizedAction(action, actorSlot) {
  if (!gameState) return;

  if (action.type === 'COMBAT_ACTION') {
    const hero = gameState.party[action.heroIndex];
    if (!hero) return;
    if (gameState.mode === 'online' && hero.owner !== actorSlot) return;
    pendingCombatSnap = snapshotCombatState();
    if (action.payload.kind === 'SKILL') {
      const sk = getHeroSkill(hero, action.payload.skillId);
      pendingVfxHint = inferSkillVfxKind(sk);
    } else if (action.payload.kind === 'DEFEND') {
      pendingVfxHint = 'shield';
    } else {
      pendingVfxHint = 'heal';
    }
    executeCombatAction(gameState, action.payload);
    armedAction = null;
  } else if (action.type === 'CHOOSE_PATH') {
    if (gameState.mode === 'online' && network.connected) {
      if (actorSlot === 1) gameState.votes.p1 = action.pathUid;
      else gameState.votes.p2 = action.pathUid;
      if (gameState.votes.p1 && gameState.votes.p1 === gameState.votes.p2) {
        choosePath(gameState, action.pathUid);
      } else if (action.force && actorSlot === 1) {
        choosePath(gameState, action.pathUid);
      }
    } else {
      choosePath(gameState, action.pathUid);
    }
  } else if (action.type === 'SELECT_REWARD') {
    if (gameState.mode === 'online' && network.connected) {
      if (actorSlot === 1) gameState.votes.p1 = action.rewardUid;
      else gameState.votes.p2 = action.rewardUid;
      if (gameState.votes.p1 && gameState.votes.p1 === gameState.votes.p2) {
        selectReward(gameState, action.rewardUid);
      } else if (action.force && actorSlot === 1) {
        selectReward(gameState, action.rewardUid);
      }
    } else {
      selectReward(gameState, action.rewardUid);
    }
  } else if (action.type === 'REST_CAMP') {
    restAtCamp(gameState, action.option);
  } else if (action.type === 'BUY_ITEM') {
    buyShopItem(gameState, action.uid);
  } else if (action.type === 'LEAVE_CAMP') {
    if (gameState.mode === 'online' && network.connected) {
      if (actorSlot === 1) gameState.campReady.p1 = !gameState.campReady.p1;
      else gameState.campReady.p2 = !gameState.campReady.p2;
      if ((gameState.campReady.p1 && gameState.campReady.p2) || (action.force && actorSlot === 1)) {
        leaveCamp(gameState);
      }
    } else {
      leaveCamp(gameState);
    }
  } else if (action.type === 'EVENT_CHOICE') {
    if (gameState.mode === 'online' && network.connected) {
      if (actorSlot === 1) gameState.votes.p1 = action.choiceId;
      else gameState.votes.p2 = action.choiceId;
      if (gameState.votes.p1 && gameState.votes.p1 === gameState.votes.p2) {
        resolveEventChoice(gameState, action.choiceId);
      } else if (action.force && actorSlot === 1) {
        resolveEventChoice(gameState, action.choiceId);
      }
    } else {
      resolveEventChoice(gameState, action.choiceId);
    }
  } else if (action.type === 'CONTINUE_EVENT') {
    continueFromEvent(gameState);
  } else if (action.type === 'NEW_RUN') {
    if (gameState.mode === 'online' && actorSlot !== 1) return;
    const newSeed = Math.floor(Math.random() * 9000000) + 100000;
    lobbySeed = newSeed;
    gameState = createNewRun({
      seed: newSeed,
      mode: gameState.mode,
      difficulty: gameState.difficulty,
      p1Name: gameState.players.p1Name,
      p2Name: gameState.players.p2Name,
      p1Class: gameState.players.p1Class,
      p2Class: gameState.players.p2Class
    });
    armedAction = null;
    pendingCombatSnap = null;
  }

  if (gameState.mode === 'online' && network.role === 'host') {
    network.broadcastState(gameState);
  }
  render();
}

// === RENDERING ===
function render() {
  if (!gameState) return;
  document.body.dataset.biome = gameState.currentBiome || 'plains';
  renderHeaderAndStageBar();
  renderPartyGrid();
  renderSidebar();
  renderViewport();

  if (pendingCombatSnap && gameState.phase === 'COMBAT') {
    applyCombatAnimations(pendingCombatSnap);
  }
  pendingCombatSnap = null;
  pendingVfxHint = null;
}

function renderWebGLBannerHtml(biomeId, labelOverride = null) {
  const b = BIOMES[biomeId] || BIOMES.plains;
  return `
    <div class="webgl-banner-stage">
      <div class="webgl-canvas-host" id="webgl-stage-host"></div>
      <div class="biome-overlay">
        <div class="biome-title">${labelOverride || b.name}</div>
        <div class="biome-sub">${b.badge} &bull; ${b.subtitle}</div>
      </div>
    </div>
  `;
}

function mountWebGLStage(biomeId) {
  const host = el('webgl-stage-host');
  if (host) {
    sceneRenderer.mount(host, biomeId || 'plains');
  }
}

function renderHeaderAndStageBar() {
  const modeLabel =
    gameState.mode === 'solo'
      ? '1 Player Solo'
      : gameState.mode === 'local'
        ? '2 Players (Local)'
        : `2 Players Online (${network.role === 'host' ? 'Host P1' : 'Guest P2'})`;
  el('mode-pill').textContent = modeLabel;

  const diff = DIFFICULTIES[gameState.difficulty] || DIFFICULTIES.normal;
  const diffPill = el('diff-pill');
  diffPill.classList.remove('hidden');
  diffPill.textContent = `Difficulty: ${diff.label}`;
  diffPill.className =
    diff.id === 'easy' ? 'pill pill-emerald' : diff.id === 'hard' ? 'pill pill-crimson' : 'pill pill-azure';

  const roomPill = el('room-pill');
  if (gameState.mode === 'online') {
    roomPill.classList.remove('hidden');
    const info = network.getInfo();
    roomPill.textContent = `Room ${info.roomCode} (${info.playerCount}/2)`;
    roomPill.className = info.connected ? 'pill pill-emerald' : 'pill pill-gold';
  } else {
    roomPill.classList.add('hidden');
  }

  el('stage-label').textContent =
    gameState.stage >= TOTAL_STAGES
      ? `Stage ${TOTAL_STAGES} / ${TOTAL_STAGES} — FINAL BOSS`
      : `Stage ${gameState.stage} / ${TOTAL_STAGES}`;
  el('seed-label').textContent = `Seed #${gameState.seed}`;
  el('gold-label').textContent = `${gameState.gold} Gold`;

  const boss = FINAL_BOSSES.find((b) => b.id === gameState.finalBossId);
  el('boss-rumor-label').textContent = `Final Boss: ${boss ? boss.name.split(',')[0] : 'Unknown'}`;

  const nodesHtml = [];
  for (let s = 1; s <= TOTAL_STAGES; s++) {
    const isBoss = s === TOTAL_STAGES;
    const cls =
      s < gameState.stage || gameState.phase === 'VICTORY'
        ? 'done'
        : s === gameState.stage
          ? 'current'
          : '';
    nodesHtml.push(`<span class="stage-node ${cls} ${isBoss ? 'boss' : ''}">${isBoss ? 'BOSS' : s}</span>`);
  }
  el('stage-nodes').innerHTML = nodesHtml.join('');

  const turnBanner = el('turn-banner');
  if (gameState.phase === 'COMBAT' && gameState.combat) {
    const activeHero = gameState.party[gameState.combat.activeHeroIdx];
    const ownerTag = gameState.mode === 'solo' ? '' : ` [Player ${activeHero.owner}]`;
    turnBanner.textContent = `Round ${gameState.combat.round} — Active: ${activeHero.name}${ownerTag}`;
  } else {
    turnBanner.textContent = `Phase: ${gameState.phase.replace('_', ' ')}`;
  }
}

function renderStatusTags(statuses) {
  if (!statuses || statuses.length === 0) return '';
  return `<div class="status-row">${statuses
    .map((s) => {
      const info = STATUS_INFO[s.id] || { short: s.id, type: 'buff', desc: '' };
      return `<span class="status-tag ${info.type}" title="${info.desc}">${info.short} (${s.duration}t)</span>`;
    })
    .join('')}</div>`;
}

function renderPartyGrid() {
  const activeIdx =
    gameState.phase === 'COMBAT' && gameState.combat ? gameState.combat.activeHeroIdx : -1;

  el('party-grid').innerHTML = gameState.party
    .map((h, idx) => {
      const hpPct = Math.round((h.hp / h.maxHp) * 100);
      const mpPct = Math.round((h.mp / h.maxMp) * 100);
      const isActive = idx === activeIdx;
      const isDead = h.hp <= 0;
      const ownerBadge =
        gameState.mode === 'solo' ? '' : `<span class="pill" style="font-size:0.72rem;padding:1px 6px;">P${h.owner}</span>`;

      return `
        <div class="hero-card ${isActive ? 'active-turn' : ''} ${isDead ? 'dead' : ''}" style="border-top: 3px solid ${h.accent}">
          <div class="sprite-frame ${isDead ? 'sprite-dead' : 'sprite-alive'}">${getSpriteSvg(h.id, 56)}</div>
          <div style="flex:1;min-width:0;">
            <div class="unit-head" style="margin-bottom:4px;">
              <div>
                <div style="font-weight:bold;color:var(--gold);font-size:0.95rem;">${h.name}</div>
                <div class="muted" style="font-size:0.76rem;">${h.title}</div>
              </div>
              ${ownerBadge}
            </div>
            <div class="bar-wrap">
              <div class="bar-label">
                <span>HP ${h.hp}/${h.maxHp}${h.shield > 0 ? ` (+${h.shield} Shd)` : ''}</span>
                <span>${isDead ? 'FALLEN' : `${hpPct}%`}</span>
              </div>
              <div class="bar-track"><div class="bar-fill bar-hp" style="width:${hpPct}%"></div></div>
            </div>
            <div class="bar-wrap">
              <div class="bar-label"><span>MP ${h.mp}/${h.maxMp}</span><span>${mpPct}%</span></div>
              <div class="bar-track"><div class="bar-fill bar-mp" style="width:${mpPct}%"></div></div>
            </div>
            <div class="hero-stats-line">
              <span>ATK ${h.atk}</span>
              <span>DEF ${h.def}</span>
              <span>Skills ${h.skills.length}</span>
            </div>
            ${renderStatusTags(h.statuses)}
          </div>
        </div>
      `;
    })
    .join('');
}

function renderSidebar() {
  const canUseItemsNow =
    gameState.phase === 'COMBAT' &&
    gameState.combat &&
    canActForHero(gameState.party[gameState.combat.activeHeroIdx]);

  const totalQty = gameState.inventory.reduce((acc, i) => acc + i.qty, 0);
  el('item-count-label').textContent = `${totalQty} item${totalQty === 1 ? '' : 's'}`;

  if (gameState.inventory.length === 0) {
    el('inventory-list').innerHTML = '<div class="muted">Satchel is empty.</div>';
  } else {
    el('inventory-list').innerHTML = gameState.inventory
      .map((entry) => {
        const item = CONSUMABLES.find((c) => c.id === entry.id);
        if (!item) return '';
        return `
          <div class="item-row">
            <div>
              <strong>${item.name}</strong> &times;${entry.qty}
              <div class="muted" style="font-size:0.76rem;">${item.description}</div>
            </div>
            ${
              canUseItemsNow
                ? `<button class="btn btn-small btn-emerald" data-use-item="${item.id}">Use</button>`
                : ''
            }
          </div>
        `;
      })
      .join('');

    el('inventory-list').querySelectorAll('[data-use-item]').forEach((btn) => {
      const itemId = btn.dataset.useItem;
      const item = CONSUMABLES.find((c) => c.id === itemId);
      btn.addEventListener('click', () => onTriggerItem(itemId));
      btn.addEventListener('mouseenter', () => {
        if (item && !armedAction) {
          updateTargetHighlights({ kind: 'ITEM', id: itemId, targetType: item.targetType });
        }
      });
      btn.addEventListener('mouseleave', () => {
        if (!armedAction) updateTargetHighlights(null);
      });
    });
  }

  el('relic-count-label').textContent = `${gameState.relics.length} relic${gameState.relics.length === 1 ? '' : 's'}`;
  if (gameState.relics.length === 0) {
    el('relic-list').innerHTML = '<div class="muted">No relics claimed yet.</div>';
  } else {
    el('relic-list').innerHTML = gameState.relics
      .map((rid) => {
        const r = RELICS.find((x) => x.id === rid);
        if (!r) return '';
        return `
          <div class="item-row">
            <div>
              <strong style="color:var(--gold)">${r.name}</strong>
              <div class="muted" style="font-size:0.76rem;">${r.description}</div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  el('chronicle-log').innerHTML = gameState.log
    .map((entry) => `<div class="log-entry log-${entry.tone}"><strong>${entry.prefix}</strong> ${entry.text}</div>`)
    .join('');
}

function canActForHero(hero) {
  if (!hero || hero.hp <= 0) return false;
  if (gameState.mode !== 'online') return true;
  return hero.owner === getLocalSlot();
}

function renderViewport() {
  const vp = el('stage-viewport');
  if (gameState.phase === 'PATH_SELECT') renderPathSelect(vp);
  else if (gameState.phase === 'COMBAT') renderCombat(vp);
  else if (gameState.phase === 'REWARD') renderReward(vp);
  else if (gameState.phase === 'CAMP') renderCamp(vp);
  else if (gameState.phase === 'EVENT') renderEvent(vp);
  else if (gameState.phase === 'EVENT_RESULT') renderEventResult(vp);
  else if (gameState.phase === 'VICTORY' || gameState.phase === 'DEFEAT') renderEndScreen(vp);
}

// === PATH SELECTION ===
function renderVoteBadges(uid) {
  if (gameState.mode !== 'online' || !network.connected) return '';
  const badges = [];
  if (gameState.votes.p1 === uid) badges.push('<span class="pill pill-gold">P1 Choice</span>');
  if (gameState.votes.p2 === uid) badges.push('<span class="pill pill-emerald">P2 Choice</span>');
  return `<div class="vote-row">${badges.join('')}</div>`;
}

function renderPathSelect(vp) {
  const isCoopOnline = gameState.mode === 'online' && network.connected;
  const sub = isCoopOnline
    ? 'Online Co-op: Both players pick the same path to advance (Host may confirm).'
    : 'Stage paths and biomes are randomized — choose where to march next.';

  vp.innerHTML = `
    <div class="panel-header">
      <h2>Stage ${gameState.stage} — Choose Your Path</h2>
      <span class="muted">${sub}</span>
    </div>
    <div class="paths-grid">
      ${gameState.paths
        .map((p) => {
          const typeClass = `type-${p.kind.toLowerCase()}`;
          const b = BIOMES[p.biomeId] || BIOMES.plains;
          return `
            <div class="path-card ${typeClass}">
              <div>
                <div class="biome-banner-mini">
                  ${getBiomeSceneSvg(b.id)}
                  <div class="biome-overlay">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                      <span class="path-badge">${p.badge}</span>
                      <span class="pill" style="font-size:0.7rem;padding:1px 6px;">${b.badge}</span>
                    </div>
                  </div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px;">
                  <div>
                    <h3>${p.title}</h3>
                    <div class="muted" style="font-size:0.76rem;color:#c9b492;">${b.name}</div>
                  </div>
                  <div class="sprite-frame sprite-alive">${getSpriteSvg(p.kind, 42)}</div>
                </div>
                <p class="muted" style="margin:6px 0;">${p.desc}</p>
                <div style="font-size:0.82rem;color:var(--text-main);margin-bottom:4px;">${p.preview}</div>
                <div style="font-size:0.8rem;color:var(--gold);">${p.rewardHint}</div>
              </div>
              <div>
                ${renderVoteBadges(p.uid)}
                <div style="display:flex;gap:6px;margin-top:8px;">
                  <button class="btn btn-primary" style="flex:1;" data-choose-path="${p.uid}">
                    Enter ${b.badge}
                  </button>
                  ${
                    isCoopOnline && network.role === 'host' && gameState.votes.p1 !== gameState.votes.p2
                      ? `<button class="btn btn-small" data-force-path="${p.uid}" title="Host override">Confirm</button>`
                      : ''
                  }
                </div>
              </div>
            </div>
          `;
        })
        .join('')}
    </div>
  `;

  vp.querySelectorAll('[data-choose-path]').forEach((btn) => {
    btn.addEventListener('click', () => {
      dispatchAction({ type: 'CHOOSE_PATH', pathUid: btn.dataset.choosePath, force: false });
    });
  });
  vp.querySelectorAll('[data-force-path]').forEach((btn) => {
    btn.addEventListener('click', () => {
      dispatchAction({ type: 'CHOOSE_PATH', pathUid: btn.dataset.forcePath, force: true });
    });
  });
}

// === WEBGL SCENIC COMBAT STAGE ===
function getTargetLabelInfo(targetType) {
  switch (targetType) {
    case 'enemy':
      return { text: 'Target: 1 Enemy', cls: 'enemy' };
    case 'enemy_splash':
      return { text: 'Target: 1 Enemy + Splash', cls: 'enemy' };
    case 'all_enemies':
      return { text: 'Target: All Enemies', cls: 'enemy' };
    case 'ally':
      return { text: 'Target: 1 Living Ally', cls: 'ally' };
    case 'ally_or_dead':
      return { text: 'Target: Any Ally (Even Fallen)', cls: 'ally' };
    case 'all_allies':
      return { text: 'Target: All Allies', cls: 'ally' };
    default:
      return { text: 'Target: Self', cls: 'ally' };
  }
}

function renderCombat(vp) {
  const combat = gameState.combat;
  const activeHero = gameState.party[combat.activeHeroIdx];
  const canControl = canActForHero(activeHero);
  const biome = BIOMES[gameState.currentBiome] || BIOMES.plains;

  const enemySpriteSize = combat.enemies.length >= 3 ? 74 : 88;

  const heroesStageHtml = gameState.party
    .map((h, idx) => {
      const hpPct = Math.round((h.hp / h.maxHp) * 100);
      const mpPct = Math.round((h.mp / h.maxMp) * 100);
      const isDead = h.hp <= 0;
      const isActive = idx === combat.activeHeroIdx;
      const spriteCls = isDead ? 'sprite-dead' : 'sprite-alive';
      return `
        <div class="unit-pedestal ${isActive ? 'active-turn' : ''} ${isDead ? 'dead' : ''}" data-battle-hero-idx="${idx}">
          <div class="target-overlay"><span class="target-float-tag"></span></div>
          ${isActive ? '<div class="pedestal-top-tag">★ ACTIVE TURN</div>' : ''}
          <div class="pedestal-sprite-wrap ${spriteCls}">
            ${getSpriteSvg(h.id, 90)}
            <div class="ground-shadow"></div>
          </div>
          <div class="pedestal-plate">
            <div class="unit-head">
              <strong style="color:var(--gold);font-size:0.86rem;">${h.name}</strong>
              ${gameState.mode !== 'solo' ? `<span class="pill" style="font-size:0.65rem;padding:0 4px;">P${h.owner}</span>` : ''}
            </div>
            <div class="bar-wrap">
              <div class="bar-label">
                <span>HP ${h.hp}/${h.maxHp}${h.shield > 0 ? ` (+${h.shield})` : ''}</span>
                <span>${isDead ? 'FALLEN' : `${hpPct}%`}</span>
              </div>
              <div class="bar-track"><div class="bar-fill bar-hp" style="width:${hpPct}%"></div></div>
            </div>
            <div class="bar-wrap">
              <div class="bar-label"><span>MP ${h.mp}/${h.maxMp}</span><span>${mpPct}%</span></div>
              <div class="bar-track"><div class="bar-fill bar-mp" style="width:${mpPct}%"></div></div>
            </div>
            ${renderStatusTags(h.statuses)}
          </div>
        </div>
      `;
    })
    .join('');

  const enemiesStageHtml = combat.enemies
    .map((e, idx) => {
      const hpPct = Math.round((e.hp / e.maxHp) * 100);
      const isDead = e.hp <= 0;
      const intent = e.currentIntent;
      const spriteCls = isDead
        ? 'sprite-dead'
        : isFloatingSprite(e.icon)
          ? 'sprite-hover'
          : 'sprite-alive';
      const sz = e.isBoss ? 116 : enemySpriteSize;
      return `
        <div class="unit-pedestal ${e.isBoss ? 'boss-unit' : ''} ${isDead ? 'dead' : ''}" data-battle-enemy-idx="${idx}">
          <div class="target-overlay"><span class="target-float-tag"></span></div>
          ${
            !isDead && intent
              ? `<div class="pedestal-top-tag intent" title="${intent.description}">Next: ${intent.name}</div>`
              : ''
          }
          <div class="pedestal-sprite-wrap ${spriteCls}">
            ${getSpriteSvg(e.icon, sz)}
            <div class="ground-shadow"></div>
          </div>
          <div class="pedestal-plate">
            <div class="unit-head">
              <strong style="color:${e.isBoss ? '#ff9d9d' : 'var(--gold)'};font-size:0.84rem;">${e.name}</strong>
              <span style="font-size:0.68rem;color:var(--text-muted);">A:${e.atk} D:${e.def}</span>
            </div>
            <div class="bar-wrap">
              <div class="bar-label">
                <span>HP ${e.hp}/${e.maxHp}${e.shield > 0 ? ` (+${e.shield})` : ''}</span>
                <span>${isDead ? 'SLAIN' : `${hpPct}%`}</span>
              </div>
              <div class="bar-track"><div class="bar-fill bar-hp" style="width:${hpPct}%"></div></div>
            </div>
            ${renderStatusTags(e.statuses)}
          </div>
        </div>
      `;
    })
    .join('');

  let actionHtml = '';
  if (!canControl) {
    actionHtml = `
      <div class="action-box">
        <strong>Waiting for Player ${activeHero.owner}</strong> to command <strong>${activeHero.name}</strong> (${activeHero.title})...
      </div>
    `;
  } else {
    const skillsHtml = activeHero.skills
      .map((sid) => {
        const s = getHeroSkill(activeHero, sid);
        const enoughMp = activeHero.mp >= s.mpCost;
        const isArmed = armedAction && armedAction.kind === 'SKILL' && armedAction.id === s.id;
        const tInfo = getTargetLabelInfo(s.targetType);
        return `
          <button class="skill-btn ${isArmed ? 'selected' : ''}" data-skill-id="${s.id}" ${enoughMp ? '' : 'disabled'}>
            <div class="skill-top">
              <span>${s.name}</span>
              <span>${s.mpCost} MP</span>
            </div>
            <span class="skill-target-tag ${tInfo.cls}">${tInfo.text}</span>
            <div class="skill-desc">${s.description}</div>
          </button>
        `;
      })
      .join('');

    const targetPromptHtml = armedAction ? buildTargetStripHtml(armedAction) : '';

    actionHtml = `
      <div class="action-box">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <strong style="color:var(--gold);font-size:1.05rem;">Commanding: ${activeHero.name}</strong>
            <span class="muted"> (${activeHero.title} &bull; ${activeHero.mp}/${activeHero.maxMp} MP &bull; Hover or click a skill to highlight targets)</span>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-small" id="btn-defend-focus">Defend &amp; Focus (+12 Shield, +8 MP)</button>
            ${armedAction ? `<button class="btn btn-small btn-crimson" id="btn-cancel-armed">Cancel Targeting</button>` : ''}
          </div>
        </div>
        <div class="skills-grid">${skillsHtml}</div>
        ${targetPromptHtml}
      </div>
    `;
  }

  vp.innerHTML = `
    <div class="panel-header">
      <h2>${combat.isBoss ? 'FINAL BOSS BATTLE' : combat.isElite ? 'Elite Encounter' : 'Monster Battle'} — Round ${combat.round}</h2>
      <span class="muted">${armedAction ? 'Click a pulsing target on the battlefield!' : 'Hover any skill to highlight valid targets.'}</span>
    </div>
    <div class="webgl-battle-stage">
      <div class="webgl-canvas-host" id="webgl-stage-host"></div>
      <div class="stage-top-hud">
        <div>
          <div class="biome-title">${biome.name}</div>
          <div class="biome-sub">${biome.badge} &bull; ${biome.subtitle}</div>
        </div>
        <span class="pill pill-gold">WebGL Scenic Battlefield</span>
      </div>
      <div class="stage-ground-row">
        <div class="stage-heroes-side">${heroesStageHtml}</div>
        <div class="stage-enemies-side">${enemiesStageHtml}</div>
      </div>
    </div>
    ${actionHtml}
  `;

  mountWebGLStage(biome.id);

  vp.querySelectorAll('[data-battle-enemy-idx]').forEach((card) => {
    card.addEventListener('click', () => {
      if (!canControl || !armedAction) return;
      const idx = parseInt(card.dataset.battleEnemyIdx, 10);
      if (combat.enemies[idx].hp <= 0) return;
      if (armedAction.targetType === 'enemy' || armedAction.targetType === 'enemy_splash') {
        executeArmedOnTarget(idx);
      }
    });
  });

  vp.querySelectorAll('[data-battle-hero-idx]').forEach((card) => {
    card.addEventListener('click', () => {
      if (!canControl || !armedAction) return;
      const idx = parseInt(card.dataset.battleHeroIdx, 10);
      const targetHero = gameState.party[idx];
      if (!targetHero) return;
      if (
        (armedAction.targetType === 'ally' && targetHero.hp > 0) ||
        armedAction.targetType === 'ally_or_dead'
      ) {
        executeArmedOnTarget(idx);
      }
    });
  });

  if (canControl) {
    const defBtn = el('btn-defend-focus');
    if (defBtn) {
      defBtn.addEventListener('click', () => {
        dispatchAction({
          type: 'COMBAT_ACTION',
          heroIndex: combat.activeHeroIdx,
          payload: { kind: 'DEFEND', heroIndex: combat.activeHeroIdx }
        });
      });
    }

    const cancelBtn = el('btn-cancel-armed');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        armedAction = null;
        renderViewport();
      });
    }

    vp.querySelectorAll('[data-skill-id]').forEach((btn) => {
      const skillId = btn.dataset.skillId;
      const skill = getHeroSkill(activeHero, skillId);
      btn.addEventListener('click', () => onTriggerSkill(skillId));
      btn.addEventListener('mouseenter', () => {
        if (!armedAction && !btn.disabled) {
          updateTargetHighlights({ kind: 'SKILL', id: skillId, targetType: skill.targetType });
        }
      });
      btn.addEventListener('mouseleave', () => {
        if (!armedAction) updateTargetHighlights(null);
      });
    });

    vp.querySelectorAll('[data-target-enemy]').forEach((btn) => {
      btn.addEventListener('click', () => executeArmedOnTarget(parseInt(btn.dataset.targetEnemy, 10)));
    });
    vp.querySelectorAll('[data-target-ally]').forEach((btn) => {
      btn.addEventListener('click', () => executeArmedOnTarget(parseInt(btn.dataset.targetAlly, 10)));
    });
  }

  updateTargetHighlights(armedAction);
}

function spawnPopup(cardEl, text, cls) {
  if (!cardEl) return;
  const pop = document.createElement('div');
  pop.className = `combat-popup ${cls}`;
  pop.textContent = text;
  cardEl.appendChild(pop);
  setTimeout(() => {
    if (pop.parentNode) pop.parentNode.removeChild(pop);
  }, 1200);
}

function applyCombatAnimations(prevSnap) {
  const vp = el('stage-viewport');
  const combat = gameState.combat;
  if (!combat || !prevSnap) return;

  const roundAdvanced = combat.round > prevSnap.round;

  if (prevSnap.activeHeroIdx >= 0) {
    const actorWrap = vp.querySelector(`[data-battle-hero-idx="${prevSnap.activeHeroIdx}"] .pedestal-sprite-wrap`);
    if (actorWrap) actorWrap.classList.add('anim-lunge-right');
  }

  if (roundAdvanced) {
    combat.enemies.forEach((e, idx) => {
      if (e.hp > 0) {
        const eWrap = vp.querySelector(`[data-battle-enemy-idx="${idx}"] .pedestal-sprite-wrap`);
        if (eWrap) eWrap.classList.add('anim-lunge-left');
      }
    });
  }

  gameState.party.forEach((h, idx) => {
    const prev = prevSnap.heroes.find((p) => p.uid === h.uid);
    if (!prev) return;
    const card = vp.querySelector(`[data-battle-hero-idx="${idx}"]`);
    const wrap = card && card.querySelector('.pedestal-sprite-wrap');
    if (!card) return;

    const hpDiff = h.hp - prev.hp;
    const shdDiff = h.shield - prev.shield;
    const normX = gameState.party.length === 1 ? 0.2 : 0.14 + idx * 0.14;

    if (hpDiff < 0) {
      if (wrap) wrap.classList.add('anim-hit');
      spawnPopup(card, `${hpDiff} HP`, 'dmg');
      sceneRenderer.triggerVfx('enemy', normX, 0.65);
    } else if (hpDiff > 0) {
      if (wrap) wrap.classList.add('anim-heal');
      spawnPopup(card, `+${hpDiff} HP`, 'heal');
      sceneRenderer.triggerVfx('heal', normX, 0.65);
    } else if (shdDiff > 0) {
      if (wrap) wrap.classList.add('anim-heal');
      spawnPopup(card, `+${shdDiff} SHIELD`, 'shield');
      sceneRenderer.triggerVfx('shield', normX, 0.65);
    }
  });

  const eTotal = combat.enemies.length;
  combat.enemies.forEach((e, idx) => {
    const prev = prevSnap.enemies.find((p) => p.uid === e.uid);
    if (!prev) return;
    const card = vp.querySelector(`[data-battle-enemy-idx="${idx}"]`);
    const wrap = card && card.querySelector('.pedestal-sprite-wrap');
    if (!card) return;

    const hpDiff = e.hp - prev.hp;
    const shdDiff = e.shield - prev.shield;
    const normX = eTotal === 1 ? 0.78 : 0.56 + (idx / Math.max(1, eTotal - 1)) * 0.34;

    if (hpDiff < 0) {
      if (wrap) wrap.classList.add('anim-hit');
      spawnPopup(card, `${hpDiff} DMG`, 'dmg');
      sceneRenderer.triggerVfx(pendingVfxHint || 'physical', normX, 0.65);
    } else if (shdDiff < 0 && hpDiff === 0) {
      if (wrap) wrap.classList.add('anim-hit');
      spawnPopup(card, `${shdDiff} SHIELD`, 'dmg');
      sceneRenderer.triggerVfx(pendingVfxHint || 'physical', normX, 0.65);
    } else if (hpDiff > 0) {
      if (wrap) wrap.classList.add('anim-heal');
      spawnPopup(card, `+${hpDiff} HP`, 'heal');
    } else if (shdDiff > 0) {
      spawnPopup(card, `+${shdDiff} SHIELD`, 'shield');
    }
  });
}

/**
 * Zero-layout-shift targeting highlights using absolutely positioned overlays on each pedestal.
 */
function updateTargetHighlights(action) {
  if (!gameState || gameState.phase !== 'COMBAT' || !gameState.combat) return;
  const combat = gameState.combat;
  const activeHero = gameState.party[combat.activeHeroIdx];
  const vp = el('stage-viewport');

  const enemyCards = vp.querySelectorAll('[data-battle-enemy-idx]');
  const heroCards = vp.querySelectorAll('[data-battle-hero-idx]');

  if (!action) {
    enemyCards.forEach((c) => c.classList.remove('targetable-enemy', 'not-targetable'));
    heroCards.forEach((c) => c.classList.remove('targetable-ally', 'not-targetable'));
    return;
  }

  const skill = action.kind === 'SKILL' ? getHeroSkill(activeHero, action.id) : null;
  const item = action.kind === 'ITEM' ? CONSUMABLES.find((c) => c.id === action.id) : null;
  const tt = action.targetType;
  const isClickArmed = Boolean(armedAction);

  enemyCards.forEach((c) => {
    const idx = parseInt(c.dataset.battleEnemyIdx, 10);
    const enemy = combat.enemies[idx];
    const tagEl = c.querySelector('.target-float-tag');
    c.classList.remove('targetable-enemy', 'not-targetable');

    if (enemy.hp <= 0) return;

    const validEnemy = tt === 'enemy' || tt === 'enemy_splash' || tt === 'all_enemies';
    if (validEnemy) {
      c.classList.add('targetable-enemy');
      let previewText = '';
      if (skill && skill.damageMult) {
        const est = estimateHitDamage(activeHero, enemy, activeHero.atk * skill.damageMult, skill.ignoreDefPct || 0);
        previewText =
          tt === 'enemy_splash'
            ? `~${est} / ${estimateHitDamage(activeHero, enemy, activeHero.atk * (skill.splashMult || 0.7), skill.ignoreDefPct || 0)} DMG`
            : `~${est} DMG`;
      } else if (item && item.effect.aoeDamage) {
        previewText = `~${estimateHitDamage(activeHero, enemy, item.effect.aoeDamage, 0.4)} DMG`;
      }
      if (tagEl) {
        tagEl.className = 'target-float-tag enemy';
        const prefix = isClickArmed && (tt === 'enemy' || tt === 'enemy_splash') ? '🎯 CLICK' : '🎯 TARGET';
        tagEl.textContent = `${prefix}${previewText ? ` (${previewText})` : ''}`;
      }
    } else {
      c.classList.add('not-targetable');
    }
  });

  heroCards.forEach((c) => {
    const idx = parseInt(c.dataset.battleHeroIdx, 10);
    const hero = gameState.party[idx];
    const tagEl = c.querySelector('.target-float-tag');
    c.classList.remove('targetable-ally', 'not-targetable');

    let validHero = false;
    if (tt === 'self' && idx === combat.activeHeroIdx && hero.hp > 0) validHero = true;
    else if (tt === 'all_allies' && hero.hp > 0) validHero = true;
    else if (tt === 'ally' && hero.hp > 0) validHero = true;
    else if (tt === 'ally_or_dead') validHero = true;

    if (validHero) {
      c.classList.add('targetable-ally');
      let note = '';
      if (skill) {
        if (hero.hp <= 0 && skill.revivePct) note = `Revive ${Math.round(hero.maxHp * skill.revivePct)} HP`;
        else if (skill.healAmount) note = `+${skill.healAmount} HP`;
        else if (skill.restoreMp) note = `+${skill.restoreMp} MP`;
        else if (skill.selfShield) note = `+${skill.selfShield} Shd`;
        else if (skill.partyShield) note = `+${skill.partyShield} Shd`;
        else if (skill.partyHeal) note = `+${skill.partyHeal} HP`;
      } else if (item) {
        if (hero.hp <= 0 && item.effect.revivePct) note = `Revive ${Math.round(hero.maxHp * item.effect.revivePct)} HP`;
        else if (item.effect.heal) note = `+${item.effect.heal} HP`;
        else if (item.effect.restoreMp) note = `+${item.effect.restoreMp} MP`;
        else if (item.effect.partyShield) note = `+${item.effect.partyShield} Shd`;
        else if (item.effect.partyHeal) note = `+${item.effect.partyHeal} HP`;
      }
      if (tagEl) {
        tagEl.className = 'target-float-tag ally';
        const prefix = isClickArmed && (tt === 'ally' || tt === 'ally_or_dead') ? '🎯 CLICK' : '🎯 TARGET';
        tagEl.textContent = `${prefix}${note ? ` (${note})` : ''}`;
      }
    } else {
      c.classList.add('not-targetable');
    }
  });
}

function buildTargetStripHtml(action) {
  const combat = gameState.combat;
  const activeHero = gameState.party[combat.activeHeroIdx];
  const label =
    action.kind === 'SKILL'
      ? getHeroSkill(activeHero, action.id).name
      : CONSUMABLES.find((c) => c.id === action.id)?.name;

  if (action.targetType === 'enemy' || action.targetType === 'enemy_splash') {
    const btns = combat.enemies
      .map((e, i) =>
        e.hp > 0
          ? `<button class="btn btn-small btn-crimson" data-target-enemy="${i}">🎯 ${e.name} (${e.hp}/${e.maxHp} HP)</button>`
          : ''
      )
      .join('');
    return `<div class="target-strip"><strong>Select Target for ${label} (or click pulsing enemy on the terrain):</strong> ${btns}</div>`;
  }

  if (action.targetType === 'ally' || action.targetType === 'ally_or_dead') {
    const allowDead = action.targetType === 'ally_or_dead';
    const btns = gameState.party
      .map((h, i) => {
        if (h.hp <= 0 && !allowDead) return '';
        const statusLabel = h.hp <= 0 ? 'FALLEN' : `${h.hp}/${h.maxHp} HP`;
        return `<button class="btn btn-small btn-emerald" data-target-ally="${i}">🎯 ${h.name} (${statusLabel})</button>`;
      })
      .join('');
    return `<div class="target-strip"><strong>Select Ally for ${label} (or click pulsing hero on the terrain):</strong> ${btns}</div>`;
  }

  return '';
}

function onTriggerSkill(skillId) {
  const combat = gameState.combat;
  const activeHero = gameState.party[combat.activeHeroIdx];
  const skill = getHeroSkill(activeHero, skillId);
  if (!skill || !combat) return;

  if (
    skill.targetType === 'self' ||
    skill.targetType === 'all_enemies' ||
    skill.targetType === 'all_allies'
  ) {
    dispatchAction({
      type: 'COMBAT_ACTION',
      heroIndex: combat.activeHeroIdx,
      payload: { kind: 'SKILL', heroIndex: combat.activeHeroIdx, skillId, targetIndex: 0 }
    });
    return;
  }

  if (skill.targetType === 'enemy' || skill.targetType === 'enemy_splash') {
    const aliveIndices = combat.enemies.map((e, i) => (e.hp > 0 ? i : -1)).filter((i) => i !== -1);
    if (aliveIndices.length === 1) {
      dispatchAction({
        type: 'COMBAT_ACTION',
        heroIndex: combat.activeHeroIdx,
        payload: { kind: 'SKILL', heroIndex: combat.activeHeroIdx, skillId, targetIndex: aliveIndices[0] }
      });
      return;
    }
  }

  if (skill.targetType === 'ally' || skill.targetType === 'ally_or_dead') {
    const validAllies = gameState.party
      .map((h, i) => (skill.targetType === 'ally_or_dead' || h.hp > 0 ? i : -1))
      .filter((i) => i !== -1);
    if (validAllies.length === 1) {
      dispatchAction({
        type: 'COMBAT_ACTION',
        heroIndex: combat.activeHeroIdx,
        payload: { kind: 'SKILL', heroIndex: combat.activeHeroIdx, skillId, targetIndex: validAllies[0] }
      });
      return;
    }
  }

  armedAction = { kind: 'SKILL', id: skillId, targetType: skill.targetType };
  renderViewport();
}

function onTriggerItem(itemId) {
  const combat = gameState.combat;
  const item = CONSUMABLES.find((c) => c.id === itemId);
  if (!item || !combat) return;

  if (item.targetType === 'all_allies' || item.targetType === 'all_enemies') {
    dispatchAction({
      type: 'COMBAT_ACTION',
      heroIndex: combat.activeHeroIdx,
      payload: { kind: 'ITEM', heroIndex: combat.activeHeroIdx, itemId, targetIndex: 0 }
    });
    return;
  }

  if (item.targetType === 'ally' || item.targetType === 'ally_or_dead') {
    const validAllies = gameState.party
      .map((h, i) => (item.targetType === 'ally_or_dead' || h.hp > 0 ? i : -1))
      .filter((i) => i !== -1);
    if (validAllies.length === 1) {
      dispatchAction({
        type: 'COMBAT_ACTION',
        heroIndex: combat.activeHeroIdx,
        payload: { kind: 'ITEM', heroIndex: combat.activeHeroIdx, itemId, targetIndex: validAllies[0] }
      });
      return;
    }
  }

  armedAction = { kind: 'ITEM', id: itemId, targetType: item.targetType };
  renderViewport();
}

function executeArmedOnTarget(targetIndex) {
  if (!armedAction || !gameState.combat) return;
  const combat = gameState.combat;
  dispatchAction({
    type: 'COMBAT_ACTION',
    heroIndex: combat.activeHeroIdx,
    payload: {
      kind: armedAction.kind,
      heroIndex: combat.activeHeroIdx,
      skillId: armedAction.kind === 'SKILL' ? armedAction.id : undefined,
      itemId: armedAction.kind === 'ITEM' ? armedAction.id : undefined,
      targetIndex
    }
  });
}

// === REWARDS ===
function renderReward(vp) {
  const isCoopOnline = gameState.mode === 'online' && network.connected;
  vp.innerHTML = `
    <div class="panel-header">
      <h2>Victory Spoils — Choose One Reward</h2>
      <span class="muted">${isCoopOnline ? 'Both players vote to claim a spoil.' : 'Pick one reward before marching onward.'}</span>
    </div>
    ${renderWebGLBannerHtml(gameState.currentBiome, 'Victory Spoils')}
    <div class="rewards-grid">
      ${gameState.rewardChoices
        .map(
          (r) => `
          <div class="reward-card">
            <div>
              <span class="path-badge">${r.kind}</span>
              <h3 style="color:var(--gold);margin-bottom:4px;">${r.title}</h3>
              <div style="font-size:0.84rem;margin-bottom:6px;">${r.subtitle}</div>
              <p class="muted">${r.desc}</p>
            </div>
            <div>
              ${renderVoteBadges(r.uid)}
              <div style="display:flex;gap:6px;margin-top:8px;">
                <button class="btn btn-primary" style="flex:1;" data-pick-reward="${r.uid}">Claim Reward</button>
                ${
                  isCoopOnline && network.role === 'host' && gameState.votes.p1 !== gameState.votes.p2
                    ? `<button class="btn btn-small" data-force-reward="${r.uid}">Confirm</button>`
                    : ''
                }
              </div>
            </div>
          </div>
        `
        )
        .join('')}
    </div>
  `;
  mountWebGLStage(gameState.currentBiome);

  vp.querySelectorAll('[data-pick-reward]').forEach((btn) => {
    btn.addEventListener('click', () => {
      dispatchAction({ type: 'SELECT_REWARD', rewardUid: btn.dataset.pickReward, force: false });
    });
  });
  vp.querySelectorAll('[data-force-reward]').forEach((btn) => {
    btn.addEventListener('click', () => {
      dispatchAction({ type: 'SELECT_REWARD', rewardUid: btn.dataset.forceReward, force: true });
    });
  });
}

// === CAMP / TAVERN & MERCHANT ===
function renderCamp(vp) {
  const camp = gameState.camp;
  const diff = DIFFICULTIES[gameState.difficulty] || DIFFICULTIES.normal;
  const restPct = Math.round(diff.campRestPct * 100);
  const isCoopOnline = gameState.mode === 'online' && network.connected;
  const localSlot = getLocalSlot();
  const isLocalReady = localSlot === 1 ? gameState.campReady.p1 : gameState.campReady.p2;

  const restHtml = camp.rested
    ? `<div class="pill pill-emerald" style="margin-bottom:14px;">Rest Complete: ${camp.restSummary}</div>`
    : `
      <div class="camp-actions">
        <button class="btn btn-emerald" data-rest="hearth">
          Rest at the Hearth (+${restPct}% HP/MP, Revive Fallen)
        </button>
        <button class="btn btn-primary" data-rest="train">
          Spar &amp; Meditate (+12 Max HP, +8 Max MP, +2 ATK)
        </button>
      </div>
    `;

  const shopHtml = camp.shopItems
    .map((item) => {
      const canBuy = !item.sold && gameState.gold >= item.price;
      return `
        <div class="shop-item">
          <div>
            <strong style="color:var(--gold);">${item.name}</strong>
            <div class="muted" style="margin:4px 0;">${item.desc}</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span class="pill pill-gold">${item.price} Gold</span>
            <button class="btn btn-small ${item.sold ? '' : 'btn-primary'}"
                    data-buy-item="${item.uid}"
                    ${canBuy ? '' : 'disabled'}>
              ${item.sold ? 'Sold' : 'Buy'}
            </button>
          </div>
        </div>
      `;
    })
    .join('');

  vp.innerHTML = `
    <div class="panel-header">
      <h2>Tavern &amp; Sanctuary Merchant</h2>
      <span class="pill pill-gold">Treasury: ${gameState.gold} Gold</span>
    </div>
    ${renderWebGLBannerHtml('tavern')}
    ${restHtml}
    <h3 style="color:var(--gold);margin-bottom:8px;">Merchant's Goods</h3>
    <div class="shop-grid">${shopHtml}</div>
    <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
      <div class="muted">
        ${
          isCoopOnline
            ? `Ready check: P1 ${gameState.campReady.p1 ? 'Ready' : 'Browsing'} | P2 ${gameState.campReady.p2 ? 'Ready' : 'Browsing'}`
            : 'Take time to prepare before moving to the next stage.'
        }
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary" id="btn-leave-camp">
          ${isCoopOnline ? (isLocalReady ? 'Waiting for Partner (Click to Cancel)' : 'Ready to Continue') : 'Continue Expedition'}
        </button>
        ${
          isCoopOnline && network.role === 'host'
            ? `<button class="btn btn-small" id="btn-force-leave-camp">Advance Now</button>`
            : ''
        }
      </div>
    </div>
  `;
  mountWebGLStage('tavern');

  vp.querySelectorAll('[data-rest]').forEach((btn) => {
    btn.addEventListener('click', () => dispatchAction({ type: 'REST_CAMP', option: btn.dataset.rest }));
  });
  vp.querySelectorAll('[data-buy-item]').forEach((btn) => {
    btn.addEventListener('click', () => dispatchAction({ type: 'BUY_ITEM', uid: btn.dataset.buyItem }));
  });
  el('btn-leave-camp').addEventListener('click', () => dispatchAction({ type: 'LEAVE_CAMP', force: false }));
  const forceBtn = el('btn-force-leave-camp');
  if (forceBtn) {
    forceBtn.addEventListener('click', () => dispatchAction({ type: 'LEAVE_CAMP', force: true }));
  }
}

// === DECISION EVENTS ===
function renderEvent(vp) {
  const ev = gameState.event;
  const isCoopOnline = gameState.mode === 'online' && network.connected;

  vp.innerHTML = `
    <div class="panel-header">
      <h2>Decision Event: ${ev.title}</h2>
      <span class="muted">${isCoopOnline ? 'Both players must agree on the decision.' : 'Make your choice.'}</span>
    </div>
    ${renderWebGLBannerHtml(gameState.currentBiome, ev.title)}
    <div class="event-story">${ev.description}</div>
    <div class="event-choices">
      ${ev.choices
        .map(
          (c) => `
          <div class="event-choice">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
              <div>
                <strong style="color:var(--gold);">${c.label}</strong>
                <div class="muted">${c.hint}</div>
              </div>
              <div style="display:flex;gap:6px;align-items:center;">
                ${renderVoteBadges(c.id)}
                <button class="btn btn-primary" data-event-choice="${c.id}">Choose</button>
                ${
                  isCoopOnline && network.role === 'host' && gameState.votes.p1 !== gameState.votes.p2
                    ? `<button class="btn btn-small" data-force-event="${c.id}">Confirm</button>`
                    : ''
                }
              </div>
            </div>
          </div>
        `
        )
        .join('')}
    </div>
  `;
  mountWebGLStage(gameState.currentBiome);

  vp.querySelectorAll('[data-event-choice]').forEach((btn) => {
    btn.addEventListener('click', () => {
      dispatchAction({ type: 'EVENT_CHOICE', choiceId: btn.dataset.eventChoice, force: false });
    });
  });
  vp.querySelectorAll('[data-force-event]').forEach((btn) => {
    btn.addEventListener('click', () => {
      dispatchAction({ type: 'EVENT_CHOICE', choiceId: btn.dataset.forceEvent, force: true });
    });
  });
}

function renderEventResult(vp) {
  const ev = gameState.event;
  const triggersFight = ev.pendingCombatIds && ev.pendingCombatIds.length > 0;

  vp.innerHTML = `
    <div class="panel-header">
      <h2>${ev.title} — Outcome</h2>
    </div>
    ${renderWebGLBannerHtml(gameState.currentBiome, ev.title)}
    <div class="event-story">${ev.outcomeText}</div>
    <button class="btn ${triggersFight ? 'btn-crimson' : 'btn-primary'}" id="btn-continue-event">
      ${triggersFight ? 'Draw Weapons &amp; Fight!' : 'Continue Expedition'}
    </button>
  `;
  mountWebGLStage(gameState.currentBiome);

  el('btn-continue-event').addEventListener('click', () => {
    dispatchAction({ type: 'CONTINUE_EVENT' });
  });
}

// === VICTORY / DEFEAT ===
function renderEndScreen(vp) {
  const won = gameState.phase === 'VICTORY';
  const s = gameState.stats;
  const canRestart = !(gameState.mode === 'online' && network.role === 'guest');

  vp.innerHTML = `
    <div class="panel-header">
      <h2 style="color:${won ? 'var(--gold)' : '#f28b8b'}">
        ${won ? 'VICTORY — The Realm Is Saved!' : 'DEFEAT — The Expedition Has Fallen'}
      </h2>
      <span class="pill pill-gold">Seed #${gameState.seed}</span>
    </div>
    ${renderWebGLBannerHtml(won ? 'plains' : 'boss', won ? 'Dawn Over the Emerald Plains' : 'Fallen in the Frontier')}
    <p style="margin-bottom:12px;">
      ${
        won
          ? 'Your champion(s) vanquished the Final Boss and emerged triumphant!'
          : `Fallen at Stage ${gameState.stage} of ${TOTAL_STAGES}. Roll a new run and try again!`
      }
    </p>
    <div class="end-summary-grid">
      <div class="stat-box"><div class="num">${gameState.stage}/${TOTAL_STAGES}</div><div class="muted">Stage Reached</div></div>
      <div class="stat-box"><div class="num">${s.battlesWon}</div><div class="muted">Battles Won</div></div>
      <div class="stat-box"><div class="num">${s.enemiesSlain}</div><div class="muted">Monsters Slain</div></div>
      <div class="stat-box"><div class="num">${s.damageDealt}</div><div class="muted">Damage Dealt</div></div>
      <div class="stat-box"><div class="num">${s.healingDone}</div><div class="muted">HP Restored</div></div>
      <div class="stat-box"><div class="num">${s.goldEarned}g</div><div class="muted">Gold Earned</div></div>
    </div>
    <button class="btn btn-primary" id="btn-new-run" ${canRestart ? '' : 'disabled'}>
      ${canRestart ? 'Start New Randomized Run' : 'Waiting for Host to Start New Run...'}
    </button>
  `;
  mountWebGLStage(won ? 'plains' : 'boss');

  const restartBtn = el('btn-new-run');
  if (restartBtn && canRestart) {
    restartBtn.addEventListener('click', () => dispatchAction({ type: 'NEW_RUN' }));
  }
}

initLobby();
