import {
  TOTAL_STAGES,
  DIFFICULTIES,
  BIOMES,
  WILD_BIOMES,
  STARTER_HEROES,
  SKILLS,
  STATUS_INFO,
  MONSTERS,
  FINAL_BOSSES,
  CONSUMABLES,
  RELICS,
  PATH_FLAVOR,
  DECISION_EVENTS
} from './data.js';

// === DETERMINISTIC SEEDED PRNG (Mulberry32) ===
export function nextRand(state) {
  let t = (state.rngState += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function createRng(seed) {
  const s = { rngState: (seed >>> 0) || 1 };
  return {
    rand: () => nextRand(s),
    range: (min, max) => min + nextRand(s) * (max - min),
    int: (min, max) => Math.floor(nextRand(s) * (max - min + 1)) + min
  };
}

export function randInt(state, min, max) {
  return Math.floor(nextRand(state) * (max - min + 1)) + min;
}

export function pick(state, arr) {
  return arr[Math.floor(nextRand(state) * arr.length)];
}

export function shuffle(state, arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand(state) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function addLog(state, text, tone = 'system') {
  const roundPrefix = state.combat ? `[S${state.stage}·R${state.combat.round}]` : `[Stage ${state.stage}]`;
  state.log.unshift({
    id: `${state.version}_${state.log.length}`,
    prefix: roundPrefix,
    text,
    tone
  });
  if (state.log.length > 80) state.log.length = 80;
}

// === SKILL DESCRIPTION FORMATTER & RANDOMIZED CLASS STAT/SKILL ROLLER ===
export function formatSkillDescription(s) {
  const parts = [];
  if (s.damageMult) {
    const pct = Math.round(s.damageMult * 100);
    const targetTxt =
      s.targetType === 'all_enemies'
        ? 'all enemies'
        : s.targetType === 'enemy_splash'
          ? `primary target (${Math.round((s.splashMult || 0.7) * 100)}% splash)`
          : 'one enemy';
    let dmgStr = `Deal ${pct}% ATK ${s.damageType} dmg to ${targetTxt}`;
    if (s.ignoreDefPct) dmgStr += ` (ignores ${Math.round(s.ignoreDefPct * 100)}% DEF)`;
    parts.push(dmgStr);
  }
  if (s.stunOrWeaken) {
    parts.push('Stun (1t) or Weaken (-30% ATK, 2t)');
  }
  if (s.enemyStatus) {
    const st = STATUS_INFO[s.enemyStatus.id];
    const pot = s.enemyStatus.potency > 1 ? `${s.enemyStatus.potency} dmg/t` : `${Math.round(s.enemyStatus.potency * 100)}%`;
    parts.push(`inflict ${st.name} (${pot}, ${s.enemyStatus.duration}t)`);
  }
  if (s.selfHeal) parts.push(`heal self ${s.selfHeal} HP`);
  if (s.selfShield) parts.push(`gain ${s.selfShield} Shield`);
  if (s.selfStatus) {
    const st = STATUS_INFO[s.selfStatus.id];
    parts.push(`gain ${st.name} (${s.selfStatus.duration}t)`);
  }
  if (s.revivePct && s.healAmount) {
    parts.push(`Revive fallen ally (${Math.round(s.revivePct * 100)}% HP) or heal ${s.healAmount} HP`);
  } else if (s.healAmount) {
    parts.push(`Heal target ${s.healAmount} HP`);
  }
  if (s.restoreMp) parts.push(`Restore ${s.restoreMp} MP`);
  if (s.targetShield) parts.push(`grant ${s.targetShield} Shield`);
  if (s.cleanse) parts.push('cleanse debuffs');
  if (s.partyHeal) parts.push(`Heal party ${s.partyHeal} HP`);
  if (s.partyShield) parts.push(`grant party ${s.partyShield} Shield`);
  if (s.partyStatus) {
    const st = STATUS_INFO[s.partyStatus.id];
    const extra =
      s.partyStatus.potency > 1
        ? `${s.partyStatus.potency}/t`
        : `${Math.round(s.partyStatus.potency * 100)}%`;
    parts.push(`${st.name} (${extra}, ${s.partyStatus.duration}t)`);
  }
  if (s.partyStatuses) {
    for (const ps of s.partyStatuses) {
      const st = STATUS_INFO[ps.id];
      const extra = ps.potency > 1 ? `${ps.potency}/t` : `${Math.round(ps.potency * 100)}%`;
      parts.push(`${st.name} (${extra}, ${ps.duration}t)`);
    }
  }
  return parts.join('; ') + '.';
}

function rollSkillVariant(rng, baseSkill) {
  const s = JSON.parse(JSON.stringify(baseSkill));
  if (s.mpCost > 0) {
    s.mpCost = Math.max(4, Math.round(s.mpCost * rng.range(0.78, 1.22)));
  }
  if (s.damageMult) {
    s.damageMult = Number((s.damageMult * rng.range(0.82, 1.24)).toFixed(2));
  }
  if (s.splashMult) {
    s.splashMult = Number((s.splashMult * rng.range(0.82, 1.24)).toFixed(2));
  }
  if (s.selfShield) s.selfShield = Math.max(6, Math.round(s.selfShield * rng.range(0.75, 1.3)));
  if (s.partyShield) s.partyShield = Math.max(6, Math.round(s.partyShield * rng.range(0.75, 1.3)));
  if (s.targetShield) s.targetShield = Math.max(6, Math.round(s.targetShield * rng.range(0.75, 1.3)));
  if (s.healAmount) s.healAmount = Math.max(12, Math.round(s.healAmount * rng.range(0.78, 1.28)));
  if (s.partyHeal) s.partyHeal = Math.max(10, Math.round(s.partyHeal * rng.range(0.78, 1.28)));
  if (s.selfHeal) s.selfHeal = Math.max(10, Math.round(s.selfHeal * rng.range(0.78, 1.28)));
  if (s.restoreMp) s.restoreMp = Math.max(10, Math.round(s.restoreMp * rng.range(0.78, 1.28)));

  const rollStatusPotency = (st) => {
    if (!st || !st.potency) return;
    if (st.potency > 1) {
      st.potency = Math.max(3, Math.round(st.potency * rng.range(0.72, 1.32)));
    } else if (st.id !== 'taunt') {
      st.potency = Number((st.potency * rng.range(0.85, 1.2)).toFixed(2));
    }
  };
  rollStatusPotency(s.enemyStatus);
  rollStatusPotency(s.partyStatus);
  if (s.partyStatuses) s.partyStatuses.forEach(rollStatusPotency);

  s.description = formatSkillDescription(s);
  return s;
}

/**
 * Generates randomized base stats and randomized skill numbers for all 4 classes
 * from (seed, difficultyId) so Lobby preview and actual run stay 100% identical.
 */
export function generateRolledRoster(seed, difficultyId = 'normal') {
  const diff = DIFFICULTIES[difficultyId] || DIFFICULTIES.normal;
  const rng = createRng((seed ^ 0x9e3779b9) >>> 0);

  return STARTER_HEROES.map((tpl) => {
    const maxHp = Math.max(55, Math.round(tpl.maxHp * rng.range(0.84, 1.18) * diff.heroHpMult));
    const maxMp = Math.max(20, Math.round(tpl.maxMp * rng.range(0.82, 1.2) * diff.heroMpMult));
    const atk = Math.max(10, Math.round(tpl.atk * rng.range(0.8, 1.22) * diff.heroAtkMult));
    const def = Math.max(3, Math.round(tpl.def * rng.range(0.75, 1.25) * diff.heroDefMult));

    const skillData = {};
    for (const sid of [...tpl.basicSkills, ...tpl.learnableSkills]) {
      skillData[sid] = rollSkillVariant(rng, SKILLS[sid]);
    }

    return {
      ...tpl,
      maxHp,
      maxMp,
      atk,
      def,
      skillData
    };
  });
}

function getDiff(state) {
  return DIFFICULTIES[state.difficulty] || DIFFICULTIES.normal;
}

export function getHeroSkill(hero, skillId) {
  return (hero && hero.skillData && hero.skillData[skillId]) || SKILLS[skillId];
}

// === CREATE NEW RUN ===
export function createNewRun({
  seed = Math.floor(Math.random() * 9000000) + 100000,
  mode = 'solo',
  difficulty = 'normal',
  p1Name = 'Player 1',
  p2Name = 'Player 2',
  p1Class = 'knight',
  p2Class = 'wizard'
}) {
  const diff = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;
  const roster = generateRolledRoster(seed, diff.id);
  const byId = Object.fromEntries(roster.map((r) => [r.id, r]));

  const makeHeroInstance = (classId, owner, duplicateName) => {
    const tpl = byId[classId] || roster[0];
    return {
      uid: `hero_${owner}_${tpl.id}`,
      id: tpl.id,
      name: duplicateName ? `${tpl.name} (P${owner})` : tpl.name,
      title: tpl.title,
      role: tpl.role,
      accent: tpl.accent,
      owner,
      maxHp: tpl.maxHp,
      hp: tpl.maxHp,
      maxMp: tpl.maxMp,
      mp: tpl.maxMp,
      atk: tpl.atk,
      def: tpl.def,
      shield: 0,
      skills: [...tpl.basicSkills],
      learnableSkills: [...tpl.learnableSkills],
      skillData: JSON.parse(JSON.stringify(tpl.skillData)),
      statuses: []
    };
  };

  const isTwoPlayer = mode === 'local' || mode === 'online';
  const sameClass = isTwoPlayer && p1Class === p2Class;
  const party = isTwoPlayer
    ? [makeHeroInstance(p1Class, 1, sameClass), makeHeroInstance(p2Class, 2, sameClass)]
    : [makeHeroInstance(p1Class, 1, false)];

  const inventory = [];
  if (diff.startHealing > 0) inventory.push({ id: 'healing_draught', qty: diff.startHealing });
  if (diff.startMana > 0) inventory.push({ id: 'mana_elixir', qty: diff.startMana });

  const state = {
    seed,
    rngState: seed >>> 0,
    mode,
    difficulty: diff.id,
    players: {
      p1Name: p1Name || 'Player 1',
      p2Name: isTwoPlayer ? p2Name || 'Player 2' : '',
      p1Class,
      p2Class
    },
    stage: 1,
    totalStages: TOTAL_STAGES,
    phase: 'PATH_SELECT',
    currentBiome: 'plains',
    finalBossId: '',
    gold: diff.startGold,
    party,
    inventory,
    relics: [],
    usedEvents: [],
    paths: [],
    chosenPath: null,
    combat: null,
    rewardChoices: null,
    camp: null,
    event: null,
    votes: { p1: null, p2: null },
    campReady: { p1: false, p2: false },
    log: [],
    stats: {
      battlesWon: 0,
      enemiesSlain: 0,
      campsVisited: 0,
      eventsResolved: 0,
      goldEarned: diff.startGold,
      damageDealt: 0,
      healingDone: 0
    },
    version: 1
  };

  const boss = pick(state, FINAL_BOSSES);
  state.finalBossId = boss.id;

  addLog(
    state,
    `Expedition started (${diff.label} Difficulty, Seed #${seed}). Party: ${party.map((h) => `${h.name} [${h.title}]`).join(' & ')}.`,
    'system'
  );
  generateStagePaths(state);
  return state;
}

// === STATUS & RELIC HELPERS ===
function hasRelic(state, relicId) {
  return state.relics.includes(relicId);
}

function getStatus(unit, statusId) {
  return unit.statuses.find((s) => s.id === statusId);
}

function applyStatus(unit, status) {
  if (!status || unit.hp <= 0) return;
  const existing = getStatus(unit, status.id);
  if (existing) {
    existing.duration = Math.max(existing.duration, status.duration);
    existing.potency = Math.max(existing.potency || 0, status.potency || 0);
  } else {
    unit.statuses.push({
      id: status.id,
      duration: status.duration,
      potency: status.potency || 0
    });
  }
}

function removeStatus(unit, statusId) {
  unit.statuses = unit.statuses.filter((s) => s.id !== statusId);
}

function cleanseDebuffs(unit) {
  unit.statuses = unit.statuses.filter((s) => {
    const info = STATUS_INFO[s.id];
    return !info || info.type !== 'debuff';
  });
}

export function addConsumable(state, itemId, qty = 1) {
  const existing = state.inventory.find((i) => i.id === itemId);
  if (existing) existing.qty += qty;
  else state.inventory.push({ id: itemId, qty });
}

export function grantRelic(state, relicId) {
  if (state.relics.includes(relicId)) return false;
  const relic = RELICS.find((r) => r.id === relicId);
  if (!relic) return false;
  state.relics.push(relicId);
  const b = relic.bonus || {};
  for (const h of state.party) {
    if (b.maxHp) {
      h.maxHp += b.maxHp;
      if (h.hp > 0) h.hp = Math.min(h.maxHp, h.hp + b.maxHp);
    }
    if (b.maxMp) {
      h.maxMp += b.maxMp;
      if (h.hp > 0) h.mp = Math.min(h.maxMp, h.mp + b.maxMp);
    }
    if (b.atk) h.atk += b.atk;
    if (b.def) h.def += b.def;
  }
  return true;
}

function getUnownedRelic(state) {
  const pool = RELICS.filter((r) => !state.relics.includes(r.id));
  return pool.length > 0 ? pick(state, pool) : null;
}

function getRandomUnlearnedSkill(state) {
  const candidates = [];
  for (const h of state.party) {
    const learnPool = h.learnableSkills || [];
    for (const skillId of learnPool) {
      if (!h.skills.includes(skillId)) {
        candidates.push({ heroUid: h.uid, heroId: h.id, heroName: h.name, skillId, skill: getHeroSkill(h, skillId) });
      }
    }
  }
  return candidates.length > 0 ? pick(state, candidates) : null;
}

export function learnSkillForHero(state, heroUidOrId, skillId) {
  const hero =
    state.party.find((h) => h.uid === heroUidOrId) ||
    state.party.find((h) => h.id === heroUidOrId && !h.skills.includes(skillId));
  if (!hero || hero.skills.includes(skillId)) return false;
  hero.skills.push(skillId);
  return true;
}

// === FULLY RANDOMIZED STAGE PATH GENERATION ===
function generateEnemyPack(state, stage, isElite) {
  const tier = stage <= 3 ? 1 : stage <= 5 ? 2 : 3;
  const pool = MONSTERS.filter((m) => m.tier === tier);
  const lowerPool = tier > 1 ? MONSTERS.filter((m) => m.tier === tier - 1) : pool;

  const isSolo = state.party.length === 1;
  const count = isSolo
    ? isElite
      ? stage >= 4 ? 2 : 1
      : stage >= 5 && nextRand(state) < 0.45 ? 2 : 1
    : isElite
      ? stage <= 2 ? 2 : randInt(state, 2, 3)
      : stage === 1 ? randInt(state, 1, 2) : randInt(state, 2, 3);

  const chosenIds = [];
  for (let i = 0; i < count; i++) {
    const useMain = i === 0 || nextRand(state) < 0.7;
    const m = pick(state, useMain ? pool : lowerPool);
    chosenIds.push(m.id);
  }
  return chosenIds;
}

export function generateStagePaths(state) {
  const diff = getDiff(state);
  const usedTitles = new Set();
  const usedEventsInStage = new Set();
  const paths = [];

  for (let slot = 0; slot < 3; slot++) {
    const roll = nextRand(state);
    const kind = roll < 0.45 ? 'COMBAT' : roll < 0.72 ? 'CAMP' : 'EVENT';

    if (kind === 'COMBAT') {
      const isElite = state.stage >= 2 && nextRand(state) < diff.eliteChance;
      const enemyIds = generateEnemyPack(state, state.stage, isElite);
      const enemyNames = enemyIds.map((id) => MONSTERS.find((m) => m.id === id)?.name || id);
      const flavorPool = (isElite ? PATH_FLAVOR.elite : PATH_FLAVOR.combat).filter(
        (f) => !usedTitles.has(f.title)
      );
      const flavor = pick(state, flavorPool.length > 0 ? flavorPool : PATH_FLAVOR.combat);
      usedTitles.add(flavor.title);
      const biomeId = pick(state, WILD_BIOMES);

      paths.push({
        uid: `path_${state.stage}_${slot}_combat`,
        kind: 'COMBAT',
        biomeId,
        biomeName: BIOMES[biomeId].name,
        badge: isElite ? 'Elite Monster Battle' : 'Monster Battle',
        title: flavor.title,
        desc: flavor.desc,
        rewardHint: isElite ? 'High Gold + Skill / Relic / Loot' : 'Gold + Skill / Relic / Loot',
        preview: `Foes: ${enemyNames.join(', ')}`,
        isElite,
        enemyIds
      });
    } else if (kind === 'CAMP') {
      const flavorPool = PATH_FLAVOR.camp.filter((f) => !usedTitles.has(f.title));
      const flavor = pick(state, flavorPool.length > 0 ? flavorPool : PATH_FLAVOR.camp);
      usedTitles.add(flavor.title);

      paths.push({
        uid: `path_${state.stage}_${slot}_camp`,
        kind: 'CAMP',
        biomeId: 'tavern',
        biomeName: BIOMES.tavern.name,
        badge: 'Tavern / Safe Haven',
        title: flavor.title,
        desc: flavor.desc,
        rewardHint: `Rest (${Math.round(diff.campRestPct * 100)}% HP/MP) & Buy Items`,
        preview: 'No monsters — Safe rest & merchant'
      });
    } else {
      let availableEvents = DECISION_EVENTS.filter(
        (e) => !state.usedEvents.includes(e.id) && !usedEventsInStage.has(e.id)
      );
      if (availableEvents.length === 0) {
        availableEvents = DECISION_EVENTS.filter((e) => !usedEventsInStage.has(e.id));
      }
      if (availableEvents.length === 0) availableEvents = DECISION_EVENTS;
      const eventObj = pick(state, availableEvents);
      usedEventsInStage.add(eventObj.id);

      const flavorPool = PATH_FLAVOR.event.filter((f) => !usedTitles.has(f.title));
      const flavor = pick(state, flavorPool.length > 0 ? flavorPool : PATH_FLAVOR.event);
      usedTitles.add(flavor.title);
      const biomeId = pick(state, WILD_BIOMES);

      paths.push({
        uid: `path_${state.stage}_${slot}_event`,
        kind: 'EVENT',
        biomeId,
        biomeName: BIOMES[biomeId].name,
        badge: 'Fateful Choice',
        title: flavor.title,
        desc: flavor.desc,
        rewardHint: 'Make a decision with unknown consequences',
        preview: `Encounter: ${eventObj.title}`,
        eventId: eventObj.id
      });
    }
  }

  state.paths = paths;
  state.votes = { p1: null, p2: null };
  state.campReady = { p1: false, p2: false };
}

export function choosePath(state, pathUid) {
  if (state.phase !== 'PATH_SELECT') return;
  const path = state.paths.find((p) => p.uid === pathUid);
  if (!path) return;
  state.chosenPath = path;
  if (path.biomeId) state.currentBiome = path.biomeId;
  state.votes = { p1: null, p2: null };

  if (path.kind === 'COMBAT') {
    startCombatFromIds(state, path.enemyIds, {
      isElite: path.isElite,
      isBoss: false,
      bonusGold: path.isElite ? 28 : 0
    });
  } else if (path.kind === 'CAMP') {
    enterCamp(state);
  } else if (path.kind === 'EVENT') {
    enterEvent(state, path.eventId);
  }
  state.version += 1;
}

// === COMBAT ENGINE ===
function instantiateEnemy(state, template, { isElite = false, stageScale = 1, slotIdx = 0 } = {}) {
  const diff = getDiff(state);
  const partyBossScale = template.isBoss ? (state.party.length === 1 ? 0.62 : 1.0) : 1.0;
  const variance = 0.94 + nextRand(state) * 0.12;
  const eliteMult = isElite ? 1.25 : 1;

  const maxHp = Math.max(
    18,
    Math.round(template.maxHp * variance * eliteMult * stageScale * diff.enemyHpMult * partyBossScale)
  );
  const atk = Math.max(
    5,
    Math.round(template.atk * (isElite ? 1.12 : 1) * diff.enemyAtkMult)
  );
  const def = Math.max(0, template.def + (isElite ? 2 : 0) + diff.enemyDefAdd);
  const intentIndex = randInt(state, 0, template.intents.length - 1);

  return {
    uid: `enemy_s${state.stage}_i${slotIdx}_${template.id}_${Math.floor(nextRand(state) * 100000)}`,
    id: template.id,
    name: isElite && !template.isBoss ? `Elite ${template.name}` : template.name,
    title: template.title || '',
    icon: template.icon,
    isBoss: Boolean(template.isBoss),
    isElite,
    maxHp,
    hp: maxHp,
    atk,
    def,
    shield: 0,
    goldMin: Math.round(template.goldMin * (isElite ? 1.45 : 1)),
    goldMax: Math.round(template.goldMax * (isElite ? 1.45 : 1)),
    statuses: [],
    intents: template.intents,
    intentIndex,
    currentIntent: template.intents[intentIndex]
  };
}

export function startCombatFromIds(state, enemyIds, { isElite = false, isBoss = false, bonusGold = 0 } = {}) {
  const enemies = enemyIds.map((id, idx) => {
    const tpl = isBoss
      ? FINAL_BOSSES.find((b) => b.id === id)
      : MONSTERS.find((m) => m.id === id);
    const enemy = instantiateEnemy(state, tpl, {
      isElite: isElite && idx === 0,
      stageScale: isBoss ? 1 : 1 + (state.stage - 1) * 0.05,
      slotIdx: idx
    });
    if (enemyIds.filter((e) => e === id).length > 1 && !enemy.isBoss) {
      enemy.name = `${enemy.name} #${idx + 1}`;
    }
    return enemy;
  });

  for (const h of state.party) {
    h.shield = 0;
    h.statuses = [];
    if (h.hp > 0) {
      if (hasRelic(state, 'ironbound_buckler')) h.shield += 12;
      if (hasRelic(state, 'warlords_banner')) applyStatus(h, { id: 'inspired', duration: 1, potency: 0.3 });
    }
  }

  const firstHeroIdx = state.party.findIndex((h) => h.hp > 0);
  state.phase = 'COMBAT';
  state.combat = {
    round: 1,
    isBoss,
    isElite,
    bonusGold: bonusGold || 0,
    enemies,
    activeHeroIdx: firstHeroIdx
  };

  if (isBoss) {
    addLog(state, `FINAL BOSS ENCOUNTER: ${enemies[0].name} blocks your path!`, 'damage');
  } else {
    addLog(state, `Combat begins against ${enemies.map((e) => e.name).join(', ')}!`, 'damage');
  }
}

export function estimateHitDamage(attacker, target, rawAmount, ignoreDefPct = 0) {
  let mult = 1;
  if (attacker) {
    const insp = attacker.statuses && attacker.statuses.find((s) => s.id === 'inspired');
    const weak = attacker.statuses && attacker.statuses.find((s) => s.id === 'weakened');
    if (insp) mult *= 1 + (insp.potency || 0.3);
    if (weak) mult *= 1 - (weak.potency || 0.3);
  }
  const vuln = target.statuses && target.statuses.find((s) => s.id === 'vulnerable');
  if (vuln) mult *= 1.25;
  const fort = target.statuses && target.statuses.find((s) => s.id === 'fortified');
  const effDef = target.def * (fort ? 1 + (fort.potency || 0.35) : 1) * (1 - ignoreDefPct);
  return Math.max(4, Math.round(rawAmount * mult - effDef * 0.65));
}

function dealDamage(state, attacker, target, rawAmount, { ignoreDefPct = 0, isDirectAttack = false } = {}) {
  if (target.hp <= 0) return 0;
  const dmg = estimateHitDamage(attacker, target, rawAmount, ignoreDefPct);

  const blocked = Math.min(target.shield, dmg);
  target.shield -= blocked;
  target.hp = Math.max(0, target.hp - (dmg - blocked));

  if (attacker && attacker.skills) state.stats.damageDealt += dmg;

  if (isDirectAttack && attacker && attacker.hp > 0) {
    const thorns = getStatus(target, 'thorns');
    if (thorns && thorns.potency > 0) {
      const refl = thorns.potency;
      const aBlocked = Math.min(attacker.shield, refl);
      attacker.shield -= aBlocked;
      attacker.hp = Math.max(0, attacker.hp - (refl - aBlocked));
      addLog(state, `${target.name}'s Thorns reflect ${refl} damage back at ${attacker.name}!`, 'damage');
    }
  }
  return dmg;
}

function healUnit(state, unit, amount, isHero = true) {
  if (unit.hp <= 0) return 0;
  const before = unit.hp;
  unit.hp = Math.min(unit.maxHp, unit.hp + amount);
  const actual = unit.hp - before;
  if (isHero) state.stats.healingDone += actual;
  return actual;
}

export function executeCombatAction(state, action) {
  if (state.phase !== 'COMBAT' || !state.combat) return;
  const combat = state.combat;
  const hero = state.party[combat.activeHeroIdx];
  if (!hero || hero.hp <= 0 || action.heroIndex !== combat.activeHeroIdx) return;

  if (action.kind === 'DEFEND') {
    hero.shield += 12;
    const mpBefore = hero.mp;
    hero.mp = Math.min(hero.maxMp, hero.mp + 8);
    addLog(state, `${hero.name} braces and focuses (+12 Shield, +${hero.mp - mpBefore} MP).`, 'system');
  } else if (action.kind === 'SKILL') {
    const skill = getHeroSkill(hero, action.skillId);
    if (!skill || !hero.skills.includes(skill.id) || hero.mp < skill.mpCost) return;

    hero.mp -= skill.mpCost;
    const livingEnemies = combat.enemies.filter((e) => e.hp > 0);
    const livingHeroes = state.party.filter((h) => h.hp > 0);

    if (skill.targetType === 'enemy') {
      const target = combat.enemies[action.targetIndex] || livingEnemies[0];
      if (!target || target.hp <= 0) return;
      const dmg = dealDamage(state, hero, target, hero.atk * skill.damageMult, {
        ignoreDefPct: skill.ignoreDefPct || 0,
        isDirectAttack: skill.damageType === 'physical'
      });
      let extra = '';
      if (skill.stunOrWeaken && target.hp > 0) {
        if (!target.isBoss && nextRand(state) < 0.75) {
          applyStatus(target, { id: 'stun', duration: 1, potency: 1 });
          extra = ' and Stunned them';
        } else {
          applyStatus(target, { id: 'weakened', duration: 2, potency: 0.3 });
          extra = ' and Weakened them';
        }
      }
      if (skill.enemyStatus && target.hp > 0) {
        applyStatus(target, skill.enemyStatus);
        extra += ` (${STATUS_INFO[skill.enemyStatus.id].name})`;
      }
      if (skill.selfHeal) {
        const healed = healUnit(state, hero, skill.selfHeal, true);
        extra += `, healing self for ${healed} HP`;
      }
      addLog(state, `${hero.name} used ${skill.name} on ${target.name} for ${dmg} dmg${extra}.`, 'damage');
    } else if (skill.targetType === 'enemy_splash') {
      const primary = combat.enemies[action.targetIndex] || livingEnemies[0];
      if (!primary || primary.hp <= 0) return;
      const parts = [];
      for (const e of livingEnemies) {
        const mult = e.uid === primary.uid ? skill.damageMult : skill.splashMult;
        const dmg = dealDamage(state, hero, e, hero.atk * mult, { ignoreDefPct: skill.ignoreDefPct || 0 });
        if (skill.enemyStatus && e.hp > 0) applyStatus(e, skill.enemyStatus);
        parts.push(`${e.name} (${dmg})`);
      }
      addLog(state, `${hero.name} cast ${skill.name}: ${parts.join(', ')}.`, 'damage');
    } else if (skill.targetType === 'all_enemies') {
      const parts = [];
      for (const e of livingEnemies) {
        const dmg = dealDamage(state, hero, e, hero.atk * skill.damageMult, {
          ignoreDefPct: skill.ignoreDefPct || 0,
          isDirectAttack: skill.damageType === 'physical'
        });
        if (skill.enemyStatus && e.hp > 0) applyStatus(e, skill.enemyStatus);
        parts.push(`${e.name} (${dmg})`);
      }
      if (skill.selfShield) hero.shield += skill.selfShield;
      addLog(state, `${hero.name} unleashed ${skill.name} hitting ${parts.join(', ')}.`, 'damage');
    } else if (skill.targetType === 'self') {
      if (skill.selfShield) hero.shield += skill.selfShield;
      if (skill.selfStatus) applyStatus(hero, skill.selfStatus);
      if (skill.partyShield) {
        for (const ally of livingHeroes) {
          if (ally.uid !== hero.uid) ally.shield += skill.partyShield;
        }
      }
      addLog(state, `${hero.name} activated ${skill.name}!`, 'heal');
    } else if (skill.targetType === 'ally' || skill.targetType === 'ally_or_dead') {
      const target = state.party[action.targetIndex] || hero;
      if (target.hp <= 0 && skill.targetType !== 'ally_or_dead') return;
      if (target.hp <= 0 && skill.revivePct) {
        target.hp = Math.max(1, Math.round(target.maxHp * skill.revivePct));
        target.statuses = [];
        state.stats.healingDone += target.hp;
        addLog(state, `${hero.name} used ${skill.name} to revive ${target.name} with ${target.hp} HP!`, 'heal');
      } else {
        let msg = `${hero.name} used ${skill.name} on ${target.name}`;
        if (skill.healAmount) msg += ` (+${healUnit(state, target, skill.healAmount, true)} HP)`;
        if (skill.restoreMp) {
          const beforeMp = target.mp;
          target.mp = Math.min(target.maxMp, target.mp + skill.restoreMp);
          msg += ` (+${target.mp - beforeMp} MP)`;
        }
        if (skill.targetShield) {
          target.shield += skill.targetShield;
          msg += ` (+${skill.targetShield} Shield)`;
        }
        if (skill.cleanse) {
          cleanseDebuffs(target);
          msg += ' [Cleansed]';
        }
        addLog(state, `${msg}.`, 'heal');
      }
    } else if (skill.targetType === 'all_allies') {
      for (const ally of livingHeroes) {
        if (skill.partyShield) ally.shield += skill.partyShield;
        if (skill.partyHeal) healUnit(state, ally, skill.partyHeal, true);
        if (skill.partyStatus) applyStatus(ally, skill.partyStatus);
        if (skill.partyStatuses) skill.partyStatuses.forEach((st) => applyStatus(ally, st));
      }
      addLog(state, `${hero.name} cast ${skill.name}!`, 'heal');
    }
  } else if (action.kind === 'ITEM') {
    const invEntry = state.inventory.find((i) => i.id === action.itemId && i.qty > 0);
    const item = CONSUMABLES.find((c) => c.id === action.itemId);
    if (!invEntry || !item) return;

    const eff = item.effect;
    if (item.targetType === 'ally' || item.targetType === 'ally_or_dead') {
      const target = state.party[action.targetIndex] || hero;
      if (target.hp <= 0 && item.targetType !== 'ally_or_dead') return;
      if (target.hp <= 0 && eff.revivePct) {
        target.hp = Math.max(1, Math.round(target.maxHp * eff.revivePct));
        target.statuses = [];
        addLog(state, `${hero.name} used ${item.name} to revive ${target.name} (${target.hp} HP)!`, 'heal');
      } else {
        const details = [];
        if (eff.heal) details.push(`+${healUnit(state, target, eff.heal, true)} HP`);
        if (eff.restoreMp) {
          const beforeMp = target.mp;
          target.mp = Math.min(target.maxMp, target.mp + eff.restoreMp);
          details.push(`+${target.mp - beforeMp} MP`);
        }
        if (eff.cleanse) {
          cleanseDebuffs(target);
          details.push('Cleansed');
        }
        addLog(state, `${hero.name} used ${item.name} on ${target.name} (${details.join(', ')}).`, 'heal');
      }
    } else if (item.targetType === 'all_allies') {
      for (const ally of state.party.filter((h) => h.hp > 0)) {
        if (eff.partyHeal) healUnit(state, ally, eff.partyHeal, true);
        if (eff.partyShield) ally.shield += eff.partyShield;
        if (eff.partyCleanse) cleanseDebuffs(ally);
        if (eff.partyStatus) applyStatus(ally, eff.partyStatus);
      }
      addLog(state, `${hero.name} used ${item.name}!`, 'heal');
    } else if (item.targetType === 'all_enemies') {
      for (const e of combat.enemies.filter((m) => m.hp > 0)) {
        const dmg = dealDamage(state, hero, e, eff.aoeDamage, { ignoreDefPct: 0.4 });
        if (eff.status && e.hp > 0) applyStatus(e, eff.status);
        addLog(state, `${item.name} scorched ${e.name} for ${dmg} dmg!`, 'damage');
      }
    }

    invEntry.qty -= 1;
    state.inventory = state.inventory.filter((i) => i.qty > 0);
  }

  if (combat.enemies.every((e) => e.hp <= 0)) {
    handleCombatVictory(state);
    state.version += 1;
    return;
  }
  if (state.party.every((h) => h.hp <= 0)) {
    state.phase = 'DEFEAT';
    addLog(state, 'Your champion(s) have fallen. The expedition ends in darkness.', 'damage');
    state.version += 1;
    return;
  }

  advanceCombatTurn(state);
  state.version += 1;
}

function advanceCombatTurn(state) {
  const combat = state.combat;
  let safety = 0;

  while (safety < 12) {
    safety++;
    let nextIdx = -1;
    for (let i = combat.activeHeroIdx + 1; i < state.party.length; i++) {
      const h = state.party[i];
      if (h.hp <= 0) continue;
      if (getStatus(h, 'stun')) {
        h.shield = 0;
        removeStatus(h, 'stun');
        addLog(state, `${h.name} is Stunned and skips their turn!`, 'damage');
        combat.activeHeroIdx = i;
        continue;
      }
      nextIdx = i;
      break;
    }

    if (nextIdx !== -1) {
      state.party[nextIdx].shield = 0;
      combat.activeHeroIdx = nextIdx;
      return;
    }

    runEnemyPhase(state);
    if (state.phase !== 'COMBAT') return;
    runEndOfRound(state);
    if (state.phase !== 'COMBAT') return;

    combat.round += 1;
    combat.activeHeroIdx = -1;
  }
}

function runEnemyPhase(state) {
  const combat = state.combat;
  for (const enemy of [...combat.enemies]) {
    if (enemy.hp <= 0) continue;

    if (getStatus(enemy, 'stun')) {
      enemy.shield = 0;
      removeStatus(enemy, 'stun');
      addLog(state, `${enemy.name} is Stunned and misses their turn!`, 'system');
      enemy.intentIndex = (enemy.intentIndex + 1) % enemy.intents.length;
      enemy.currentIntent = enemy.intents[enemy.intentIndex];
      continue;
    }

    enemy.shield = 0;
    const intent = enemy.currentIntent;
    const livingHeroes = state.party.filter((h) => h.hp > 0);
    if (livingHeroes.length === 0) break;

    if (intent.type === 'attack') {
      const taunters = livingHeroes.filter((h) => getStatus(h, 'taunt'));
      const target = pick(state, taunters.length > 0 ? taunters : livingHeroes);
      const dmg = dealDamage(state, enemy, target, enemy.atk * (intent.mult || 1), { isDirectAttack: true });
      if (intent.status && target.hp > 0) applyStatus(target, intent.status);
      if (intent.healSelfPct && enemy.hp > 0) {
        healUnit(state, enemy, Math.max(4, Math.round(dmg * intent.healSelfPct)), false);
      }
      addLog(state, `${enemy.name} used ${intent.name} on ${target.name} for ${dmg} dmg!`, 'damage');
    } else if (intent.type === 'aoe') {
      const hits = [];
      let totalDmg = 0;
      for (const h of livingHeroes) {
        const dmg = dealDamage(state, enemy, h, enemy.atk * (intent.mult || 0.75), { isDirectAttack: false });
        totalDmg += dmg;
        if (intent.status && h.hp > 0) applyStatus(h, intent.status);
        hits.push(`${h.name} (${dmg})`);
      }
      if (intent.healSelfPct && enemy.hp > 0) {
        healUnit(state, enemy, Math.max(5, Math.round(totalDmg * intent.healSelfPct * 0.5)), false);
      }
      addLog(state, `${enemy.name} unleashed ${intent.name}: ${hits.join(', ')}!`, 'damage');
    } else if (intent.type === 'buff') {
      if (intent.shield) enemy.shield += intent.shield;
      if (intent.heal) healUnit(state, enemy, intent.heal, false);
      if (intent.status) applyStatus(enemy, intent.status);
      if (intent.teamStatus) {
        for (const allyEnemy of combat.enemies.filter((e) => e.hp > 0)) applyStatus(allyEnemy, intent.teamStatus);
      }
      addLog(state, `${enemy.name} used ${intent.name}!`, 'system');
    } else if (intent.type === 'summon') {
      if (intent.shield) enemy.shield += intent.shield;
      if (combat.enemies.filter((e) => e.hp > 0).length < 3) {
        const tpl = MONSTERS.find((m) => m.id === intent.summonId) || MONSTERS[2];
        const summoned = instantiateEnemy(state, tpl, { stageScale: 1.05 });
        combat.enemies.push(summoned);
        addLog(state, `${enemy.name} cast ${intent.name} and summoned ${summoned.name}!`, 'damage');
      } else {
        enemy.shield += 18;
        addLog(state, `${enemy.name} reinforced its wards (+18 Shield).`, 'system');
      }
    }

    if (state.party.every((h) => h.hp <= 0)) {
      state.phase = 'DEFEAT';
      addLog(state, 'Your heroes have fallen! Darkness claims the realm.', 'damage');
      return;
    }
    if (combat.enemies.every((e) => e.hp <= 0)) {
      handleCombatVictory(state);
      return;
    }

    enemy.intentIndex = (enemy.intentIndex + 1) % enemy.intents.length;
    enemy.currentIntent = enemy.intents[enemy.intentIndex];
  }
}

function tickUnitStatuses(state, unit, isHero) {
  if (unit.hp <= 0) return;
  for (const s of [...unit.statuses]) {
    if (s.id === 'burn' || s.id === 'poison' || s.id === 'bleed') {
      const dmg = s.potency || 6;
      unit.hp = Math.max(0, unit.hp - dmg);
      addLog(state, `${unit.name} takes ${dmg} ${STATUS_INFO[s.id].name} damage.`, 'damage');
      if (unit.hp <= 0) break;
    } else if (s.id === 'regeneration') {
      const healed = healUnit(state, unit, s.potency || 10, isHero);
      if (healed > 0) addLog(state, `${unit.name} regenerates ${healed} HP.`, 'heal');
    }
  }
  if (unit.hp > 0) {
    for (const s of unit.statuses) if (s.id !== 'stun') s.duration -= 1;
    unit.statuses = unit.statuses.filter((s) => s.duration > 0);
  } else {
    unit.statuses = [];
  }
}

function runEndOfRound(state) {
  const combat = state.combat;
  for (const h of state.party) tickUnitStatuses(state, h, true);
  for (const e of combat.enemies) tickUnitStatuses(state, e, false);

  if (combat.enemies.every((e) => e.hp <= 0)) {
    handleCombatVictory(state);
    return;
  }
  if (state.party.every((h) => h.hp <= 0)) {
    state.phase = 'DEFEAT';
    addLog(state, 'The party succumbed to their wounds.', 'damage');
  }
}

function handleCombatVictory(state) {
  const combat = state.combat;
  const diff = getDiff(state);
  let baseGold = combat.bonusGold || 0;
  for (const e of combat.enemies) baseGold += randInt(state, e.goldMin, e.goldMax);
  const goldMult = (hasRelic(state, 'merchants_coinpurse') ? 1.25 : 1) * diff.combatGoldMult;
  const totalGold = Math.round(baseGold * goldMult);

  state.gold += totalGold;
  state.stats.goldEarned += totalGold;
  state.stats.battlesWon += 1;
  state.stats.enemiesSlain += combat.enemies.length;

  for (const h of state.party) {
    h.shield = 0;
    h.statuses = [];
    if (h.hp > 0 && hasRelic(state, 'emerald_heartwood')) {
      healUnit(state, h, 8, true);
      h.mp = Math.min(h.maxMp, h.mp + 5);
    }
  }

  if (combat.isBoss || state.stage >= TOTAL_STAGES) {
    state.phase = 'VICTORY';
    addLog(state, `VICTORY! ${combat.enemies[0].name} has been vanquished! (+${totalGold} Gold)`, 'loot');
    return;
  }

  addLog(state, `Battle won! Found ${totalGold} Gold. Choose your spoil of war.`, 'loot');

  const rewards = [];
  const skillCand = getRandomUnlearnedSkill(state);
  if (skillCand) {
    const sk = skillCand.skill;
    rewards.push({
      uid: `rew_skill_${state.stage}`,
      kind: 'SKILL',
      title: `Skill Scroll: ${sk.name}`,
      subtitle: `For ${skillCand.heroName} (${sk.mpCost} MP)`,
      desc: sk.description,
      heroUid: skillCand.heroUid,
      skillId: sk.id
    });
  } else {
    rewards.push({
      uid: `rew_train_${state.stage}`,
      kind: 'STAT_BOOST',
      title: 'Tome of Mastery',
      subtitle: 'All skills learned!',
      desc: 'Heroes gain +14 Max HP, +10 Max MP, and +3 ATK.'
    });
  }

  const relic = getUnownedRelic(state);
  if (relic) {
    rewards.push({
      uid: `rew_relic_${state.stage}`,
      kind: 'RELIC',
      title: `Relic: ${relic.name}`,
      subtitle: 'Permanent Relic',
      desc: relic.description,
      relicId: relic.id
    });
  } else {
    rewards.push({
      uid: `rew_gold_${state.stage}`,
      kind: 'GOLD_CACHE',
      title: 'Royal Bullion Chest',
      subtitle: '+65 Gold',
      desc: 'Add 65 Gold to the treasury.',
      amount: 65
    });
  }

  const item1 = pick(state, CONSUMABLES);
  const item2 = pick(state, CONSUMABLES);
  rewards.push({
    uid: `rew_items_${state.stage}`,
    kind: 'SUPPLIES',
    title: 'Spoils Satchel & Coin',
    subtitle: '+25 Gold & 2 Consumables',
    desc: `Gain ${item1.name}, ${item2.name}, and 25 Gold.`,
    items: [item1.id, item2.id],
    gold: 25
  });

  state.rewardChoices = rewards;
  state.phase = 'REWARD';
  state.votes = { p1: null, p2: null };
}

export function selectReward(state, rewardUid) {
  if (state.phase !== 'REWARD' || !state.rewardChoices) return;
  const rew = state.rewardChoices.find((r) => r.uid === rewardUid);
  if (!rew) return;

  if (rew.kind === 'SKILL') {
    learnSkillForHero(state, rew.heroUid, rew.skillId);
    addLog(state, `Learned new skill: ${rew.title} (${rew.subtitle})!`, 'loot');
  } else if (rew.kind === 'STAT_BOOST') {
    for (const h of state.party) {
      h.maxHp += 14;
      h.maxMp += 10;
      h.atk += 3;
      if (h.hp > 0) {
        h.hp = Math.min(h.maxHp, h.hp + 14);
        h.mp = Math.min(h.maxMp, h.mp + 10);
      }
    }
    addLog(state, 'Studied the Tome of Mastery (+14 Max HP, +10 Max MP, +3 ATK).', 'loot');
  } else if (rew.kind === 'RELIC') {
    grantRelic(state, rew.relicId);
    addLog(state, `Claimed Relic: ${rew.title}!`, 'loot');
  } else if (rew.kind === 'GOLD_CACHE') {
    state.gold += rew.amount;
    state.stats.goldEarned += rew.amount;
    addLog(state, `Claimed ${rew.amount} Gold from the Royal Bullion Chest!`, 'loot');
  } else if (rew.kind === 'SUPPLIES') {
    for (const id of rew.items) addConsumable(state, id, 1);
    state.gold += rew.gold;
    state.stats.goldEarned += rew.gold;
    addLog(state, `Collected ${rew.desc}`, 'loot');
  }

  state.combat = null;
  state.rewardChoices = null;
  advanceToNextStage(state);
  state.version += 1;
}

// === CAMP / TAVERN & MERCHANT ===
function enterCamp(state) {
  state.phase = 'CAMP';
  const diff = getDiff(state);
  const priceOf = (p) => Math.max(8, Math.round(p * diff.shopPriceMult));
  const shopItems = [];

  const shuffledConsumables = shuffle(state, CONSUMABLES);
  for (let i = 0; i < 2; i++) {
    const c = shuffledConsumables[i];
    shopItems.push({
      uid: `shop_c_${state.stage}_${i}`,
      kind: 'consumable',
      itemId: c.id,
      name: c.name,
      desc: c.description,
      price: priceOf(c.price),
      sold: false
    });
  }

  const relic = getUnownedRelic(state);
  if (relic) {
    shopItems.push({
      uid: `shop_r_${state.stage}`,
      kind: 'relic',
      itemId: relic.id,
      name: `Relic: ${relic.name}`,
      desc: relic.description,
      price: priceOf(relic.price),
      sold: false
    });
  }

  const skillCand = getRandomUnlearnedSkill(state);
  if (skillCand) {
    const sk = skillCand.skill;
    shopItems.push({
      uid: `shop_s_${state.stage}`,
      kind: 'skill',
      itemId: sk.id,
      heroUid: skillCand.heroUid,
      name: `Scroll: ${sk.name} (${skillCand.heroName})`,
      desc: `${sk.mpCost} MP — ${sk.description}`,
      price: priceOf(55),
      sold: false
    });
  }

  state.camp = { rested: false, restSummary: null, shopItems };
  state.campReady = { p1: false, p2: false };
  addLog(state, 'Arrived at a safe Tavern / Sanctuary. Rest or trade with the merchant.', 'heal');
}

export function restAtCamp(state, option) {
  if (state.phase !== 'CAMP' || !state.camp || state.camp.rested) return;
  const diff = getDiff(state);

  if (option === 'hearth') {
    let revived = 0;
    const pct = diff.campRestPct;
    for (const h of state.party) {
      if (h.hp <= 0) {
        h.hp = Math.max(1, Math.round(h.maxHp * Math.max(0.25, pct * 0.65)));
        h.mp = Math.round(h.maxMp * pct);
        revived++;
      } else {
        healUnit(state, h, Math.round(h.maxHp * pct), true);
        h.mp = Math.min(h.maxMp, h.mp + Math.round(h.maxMp * pct));
      }
      h.statuses = [];
    }
    state.camp.restSummary = `Restored ${Math.round(pct * 100)}% HP & MP${revived > 0 ? ` and revived ${revived} fallen hero` : ''}.`;
    addLog(state, `Rested at the Hearth: ${state.camp.restSummary}`, 'heal');
  } else if (option === 'train') {
    for (const h of state.party) {
      h.maxHp += 12;
      h.maxMp += 8;
      h.atk += 2;
      if (h.hp > 0) {
        h.hp = Math.min(h.maxHp, h.hp + 12);
        h.mp = Math.min(h.maxMp, h.mp + 8);
      }
    }
    state.camp.restSummary = 'Trained vigorously (+12 Max HP, +8 Max MP, +2 ATK).';
    addLog(state, state.camp.restSummary, 'heal');
  }

  state.camp.rested = true;
  state.version += 1;
}

export function buyShopItem(state, uid) {
  if (state.phase !== 'CAMP' || !state.camp) return;
  const offer = state.camp.shopItems.find((s) => s.uid === uid);
  if (!offer || offer.sold || state.gold < offer.price) return;

  state.gold -= offer.price;
  offer.sold = true;

  if (offer.kind === 'consumable') {
    addConsumable(state, offer.itemId, 1);
    addLog(state, `Bought ${offer.name} for ${offer.price} Gold.`, 'loot');
  } else if (offer.kind === 'relic') {
    grantRelic(state, offer.itemId);
    addLog(state, `Bought ${offer.name} for ${offer.price} Gold!`, 'loot');
  } else if (offer.kind === 'skill') {
    learnSkillForHero(state, offer.heroUid, offer.itemId);
    addLog(state, `Bought & learned ${offer.name} for ${offer.price} Gold!`, 'loot');
  }
  state.version += 1;
}

export function leaveCamp(state) {
  if (state.phase !== 'CAMP') return;
  state.camp = null;
  state.campReady = { p1: false, p2: false };
  state.stats.campsVisited += 1;
  advanceToNextStage(state);
  state.version += 1;
}

// === DECISION EVENTS ===
function enterEvent(state, eventId) {
  const ev = DECISION_EVENTS.find((e) => e.id === eventId) || pick(state, DECISION_EVENTS);
  if (!state.usedEvents.includes(ev.id)) state.usedEvents.push(ev.id);
  state.phase = 'EVENT';
  state.event = {
    eventId: ev.id,
    title: ev.title,
    description: ev.description,
    choices: ev.choices,
    outcomeText: null,
    pendingCombatIds: null,
    pendingBonusGold: 0
  };
  state.votes = { p1: null, p2: null };
  addLog(state, `Encountered Event: ${ev.title}.`, 'event');
}

function hurtParty(state, baseAmount) {
  const diff = getDiff(state);
  const dmg = Math.max(1, Math.round(baseAmount * diff.eventDmgMult));
  for (const h of state.party) {
    if (h.hp > 0) h.hp = Math.max(1, h.hp - dmg);
  }
  return dmg;
}

function grantRandomRelicOrGold(state, fallbackGold = 55) {
  const r = getUnownedRelic(state);
  if (r) {
    grantRelic(state, r.id);
    return `Obtained Relic: ${r.name} (${r.description})`;
  }
  state.gold += fallbackGold;
  state.stats.goldEarned += fallbackGold;
  return `Obtained ${fallbackGold} Gold.`;
}

function grantRandomSkillOrStat(state) {
  const cand = getRandomUnlearnedSkill(state);
  if (cand) {
    learnSkillForHero(state, cand.heroUid, cand.skillId);
    return `${cand.heroName} learned a new skill: ${cand.skill.name}!`;
  }
  for (const h of state.party) {
    h.atk += 2;
    h.maxMp += 10;
  }
  return 'All skills already learned — gained +2 ATK & +10 Max MP instead!';
}

export function resolveEventChoice(state, choiceId) {
  if (state.phase !== 'EVENT' || !state.event) return;
  const evId = state.event.eventId;
  let outcomeText = '';
  let pendingCombatIds = null;
  let pendingBonusGold = 0;

  if (evId === 'cursed_reliquary') {
    if (choiceId === 'smash_lock') {
      const dmg = hurtParty(state, 14);
      outcomeText = `Iron splinters fly (-${dmg} HP). ${grantRandomRelicOrGold(state)}`;
    } else if (choiceId === 'pray_altar') {
      for (const h of state.party) {
        if (h.hp > 0) {
          healUnit(state, h, 26, true);
          h.mp = Math.min(h.maxMp, h.mp + 12);
        }
      }
      outcomeText = 'Warm silver light mends your wounds (+26 HP & +12 MP).';
    } else {
      state.gold += 50;
      state.stats.goldEarned += 50;
      outcomeText = 'You pry away the heavy silver chains and pocket 50 Gold.';
    }
  } else if (evId === 'wounded_knight') {
    if (choiceId === 'tend_wounds') {
      if (state.gold >= 25) {
        state.gold -= 25;
        outcomeText = `Spent 25 Gold on clean bandages. In gratitude, the courier teaches: ${grantRandomSkillOrStat(state)}`;
      } else {
        for (const h of state.party) if (h.hp > 0) h.mp = Math.min(h.maxMp, h.mp + 10);
        outcomeText = 'Lacked 25 Gold — shared water before parting (+10 MP).';
      }
    } else if (choiceId === 'escort_rest') {
      for (const h of state.party) {
        h.maxHp += 10;
        if (h.hp > 0) h.hp = Math.min(h.maxHp, h.hp + 10);
      }
      outcomeText = 'Sharing rations lifts your spirits (+10 Max HP).';
    } else {
      state.gold += 45;
      state.stats.goldEarned += 45;
      addConsumable(state, 'healing_draught', 1);
      outcomeText = 'Recovered 45 Gold and a Crimson Healing Draught.';
    }
  } else if (evId === 'alchemist_wager') {
    if (choiceId === 'drink_crimson') {
      if (nextRand(state) < 0.55) {
        for (const h of state.party) h.atk += 4;
        outcomeText = 'Liquid fire courses through your veins! Permanently gained +4 ATK!';
      } else {
        const dmg = hurtParty(state, 18);
        outcomeText = `Bitter venom! Lost ${dmg} HP.`;
      }
    } else if (choiceId === 'buy_bundle') {
      if (state.gold >= 30) {
        state.gold -= 30;
        const c1 = pick(state, CONSUMABLES);
        const c2 = pick(state, CONSUMABLES);
        addConsumable(state, c1.id, 1);
        addConsumable(state, c2.id, 1);
        outcomeText = `Paid 30 Gold and received ${c1.name} and ${c2.name}.`;
      } else {
        outcomeText = 'Insufficient Gold (30g needed). The alchemist vanishes.';
      }
    } else {
      for (const h of state.party) if (h.hp > 0) h.mp = Math.min(h.maxMp, h.mp + 15);
      outcomeText = 'Your restraint steadies the mind (+15 MP).';
    }
  } else if (evId === 'whispering_obelisk') {
    if (choiceId === 'study_runes') {
      for (const h of state.party) h.mp = Math.max(0, h.mp - 15);
      outcomeText = `The runes drain 15 MP, yet reveal ancient secrets: ${grantRandomSkillOrStat(state)}`;
    } else if (choiceId === 'offer_blood') {
      const dmg = hurtParty(state, 18);
      outcomeText = `The obelisk drinks your vitality (-${dmg} HP) and yields: ${grantRandomRelicOrGold(state)}`;
    } else {
      pendingCombatIds = generateEnemyPack(state, Math.min(7, state.stage + 1), true);
      pendingBonusGold = 45;
      outcomeText = 'Shattering the obelisk awakens its guardians! (+45 Bonus Gold on victory)';
    }
  } else if (evId === 'blackbridge_toll') {
    if (choiceId === 'pay_toll') {
      const paid = Math.min(state.gold, 35);
      state.gold -= paid;
      outcomeText = `Paid ${paid} Gold to the bridge captain and crossed undisturbed.`;
    } else if (choiceId === 'intimidate') {
      pendingCombatIds = generateEnemyPack(state, state.stage, false);
      pendingBonusGold = 35;
      outcomeText = 'The mercenaries raise their halberds! (+35 Bonus Gold on victory)';
    } else {
      const dmg = hurtParty(state, 12);
      state.gold += 25;
      state.stats.goldEarned += 25;
      outcomeText = `The icy river bites (-${dmg} HP), yet you spot a sunken purse with 25 Gold!`;
    }
  } else if (evId === 'dragons_clutch') {
    if (choiceId === 'harvest_scales') {
      for (const h of state.party) h.def += 2;
      outcomeText = 'Reinforced armor with shed dragonscales (+2 DEF).';
    } else if (choiceId === 'absorb_ember') {
      for (const h of state.party) h.atk += 2;
      outcomeText = 'Absorbed the emberstone warmth (+2 ATK).';
    } else {
      state.gold += 65;
      state.stats.goldEarned += 65;
      outcomeText = 'Beneath charred bones you unearth 65 Gold!';
    }
  } else if (evId === 'forgotten_armory') {
    if (choiceId === 'take_relic') {
      outcomeText = grantRandomRelicOrGold(state);
    } else if (choiceId === 'temper_arms') {
      for (const h of state.party) {
        h.atk += 2;
        h.maxHp += 12;
        if (h.hp > 0) h.hp = Math.min(h.maxHp, h.hp + 12);
      }
      outcomeText = 'Reforged blades and armor (+2 ATK & +12 Max HP).';
    } else {
      const c1 = pick(state, CONSUMABLES);
      const c2 = pick(state, CONSUMABLES);
      addConsumable(state, c1.id, 1);
      addConsumable(state, c2.id, 1);
      outcomeText = `Packed ${c1.name} and ${c2.name} from the crates.`;
    }
  } else if (evId === 'sacred_grove') {
    if (choiceId === 'bathe_waters') {
      for (const h of state.party) {
        h.hp = h.maxHp;
        h.mp = h.maxMp;
        h.statuses = [];
      }
      outcomeText = 'Silver moonwaters restore full HP & MP!';
    } else if (choiceId === 'bless_weapons') {
      for (const h of state.party) h.atk += 3;
      outcomeText = 'Moonlight gleams upon your weapons (+3 ATK).';
    } else {
      addConsumable(state, 'phoenix_feather', 1);
      addConsumable(state, 'antidote_herbs', 1);
      outcomeText = 'Gathered a Phoenix Ash Feather and Sylvan Antidote Satchel.';
    }
  } else if (evId === 'gambling_tavern') {
    if (choiceId === 'wager_gold') {
      if (state.gold < 40) {
        outcomeText = 'You lacked 40 Gold to wager and quietly left the table.';
      } else if (nextRand(state) < 0.6) {
        state.gold += 60;
        state.stats.goldEarned += 100;
        outcomeText = `Crown sixes! Won 100 Gold (+60 net) and: ${grantRandomRelicOrGold(state, 35)}`;
      } else {
        state.gold -= 40;
        outcomeText = 'Snake eyes... Lost your 40 Gold wager.';
      }
    } else if (choiceId === 'arm_wrestle') {
      state.gold += 35;
      state.stats.goldEarned += 35;
      const dmg = hurtParty(state, 10);
      outcomeText = `Slammed the champion’s gauntlet down (+35 Gold, -${dmg} HP bruise)!`;
    } else {
      const cost = Math.min(state.gold, 15);
      state.gold -= cost;
      for (const h of state.party) {
        if (h.hp > 0) {
          healUnit(state, h, 35, true);
          h.mp = Math.min(h.maxMp, h.mp + 20);
        }
      }
      outcomeText = `Spent ${cost} Gold on hearty stew (+35 HP & +20 MP).`;
    }
  } else if (evId === 'arcane_library') {
    if (choiceId === 'decipher_tome') {
      outcomeText = grantRandomSkillOrStat(state);
    } else if (choiceId === 'siphon_ward') {
      for (const h of state.party) {
        h.maxMp += 15;
        if (h.hp > 0) h.mp = Math.min(h.maxMp, h.mp + 15);
      }
      outcomeText = 'Arcane currents surge into you (+15 Max MP).';
    } else {
      state.gold += 55;
      state.stats.goldEarned += 55;
      outcomeText = 'Bound pristine vellum manuscripts worth 55 Gold.';
    }
  } else if (evId === 'pilgrim_caravan') {
    if (choiceId === 'guard_wagon') {
      pendingCombatIds = generateEnemyPack(state, state.stage, false);
      pendingBonusGold = 40;
      outcomeText = 'Shadows leap from the treeline! (+40 Bonus Gold on victory)';
    } else if (choiceId === 'help_repair') {
      state.gold += 30;
      state.stats.goldEarned += 30;
      addConsumable(state, 'healing_draught', 1);
      outcomeText = 'Grateful pilgrims gift 30 Gold and a Crimson Healing Draught.';
    } else {
      const c = pick(state, CONSUMABLES);
      addConsumable(state, c.id, 1);
      for (const h of state.party) if (h.hp > 0) h.mp = Math.min(h.maxMp, h.mp + 15);
      outcomeText = `Received ${c.name} and restored +15 MP.`;
    }
  } else if (evId === 'dark_pact_shrine') {
    if (choiceId === 'blood_power') {
      const dmg = hurtParty(state, 22);
      for (const h of state.party) h.atk += 4;
      outcomeText = `Darkness empowers your blades (-${dmg} HP, +4 ATK)! ${grantRandomRelicOrGold(state)}`;
    } else if (choiceId === 'gold_tribute') {
      if (state.gold >= 50) {
        state.gold -= 50;
        for (const h of state.party) {
          h.maxHp += 18;
          h.def += 2;
          if (h.hp > 0) h.hp = Math.min(h.maxHp, h.hp + 18);
        }
        outcomeText = 'Gold melts into dark blessing (+18 Max HP & +2 DEF).';
      } else {
        outcomeText = 'Lacked 50 Gold. The shrine remains silent.';
      }
    } else {
      state.gold += 45;
      state.stats.goldEarned += 45;
      for (const h of state.party) if (h.hp > 0) healUnit(state, h, 18, true);
      outcomeText = 'Shattered the cursed idol (+45 Gold & +18 HP)!';
    }
  }

  state.event.outcomeText = outcomeText;
  state.event.pendingCombatIds = pendingCombatIds;
  state.event.pendingBonusGold = pendingBonusGold;
  state.stats.eventsResolved += 1;
  state.phase = 'EVENT_RESULT';
  state.votes = { p1: null, p2: null };
  addLog(state, outcomeText, 'event');
  state.version += 1;
}

export function continueFromEvent(state) {
  if (state.phase !== 'EVENT_RESULT' || !state.event) return;
  const ev = state.event;
  state.event = null;
  if (ev.pendingCombatIds && ev.pendingCombatIds.length > 0) {
    startCombatFromIds(state, ev.pendingCombatIds, {
      isElite: false,
      isBoss: false,
      bonusGold: ev.pendingBonusGold || 0
    });
  } else {
    advanceToNextStage(state);
  }
  state.version += 1;
}

function advanceToNextStage(state) {
  state.stage += 1;
  state.chosenPath = null;
  state.votes = { p1: null, p2: null };

  if (state.stage >= TOTAL_STAGES) {
    state.stage = TOTAL_STAGES;
    state.currentBiome = 'boss';
    startCombatFromIds(state, [state.finalBossId], {
      isElite: false,
      isBoss: true,
      bonusGold: 0
    });
  } else {
    state.phase = 'PATH_SELECT';
    state.currentBiome = pick(state, WILD_BIOMES);
    generateStagePaths(state);
    addLog(state, `Arrived at Stage ${state.stage} of ${TOTAL_STAGES}. Choose your path.`, 'system');
  }
}
