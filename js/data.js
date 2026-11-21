export const TOTAL_STAGES = 8;
export const MAX_PLAYERS = 2;

export const BIOMES = {
  plains: {
    id: 'plains',
    name: 'Emerald Wind-Plains',
    subtitle: 'Sunlit Rolling Frontier Steppe',
    badge: 'Open Plains'
  },
  forest: {
    id: 'forest',
    name: 'Whispering Eldergrove',
    subtitle: 'Moonlit Ancient Woodland',
    badge: 'Ancient Forest'
  },
  dungeon: {
    id: 'dungeon',
    name: 'Catacombs of Irondeep',
    subtitle: 'Torchlit Subterranean Vault',
    badge: 'Stone Dungeon'
  },
  ruins: {
    id: 'ruins',
    name: 'Sunken Abbey of Saint Vael',
    subtitle: 'Shattered Gothic Cloister',
    badge: 'Gothic Ruins'
  },
  swamp: {
    id: 'swamp',
    name: 'Blightmire Fen',
    subtitle: 'Lantern-Lit Cursed Marsh',
    badge: 'Cursed Marsh'
  },
  tavern: {
    id: 'tavern',
    name: 'The Golden Flagon Inn',
    subtitle: 'Warm Timber & Hearth Tavern',
    badge: 'Medieval Tavern'
  },
  boss: {
    id: 'boss',
    name: 'Throne of Ash & Cinder',
    subtitle: 'Obsidian Citadel of the Dread Crown',
    badge: 'Boss Citadel'
  }
};

export const WILD_BIOMES = ['plains', 'forest', 'dungeon', 'ruins', 'swamp'];

export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    label: 'Easy',
    summary: 'Heroes +25% HP / +15% ATK & DEF, Enemies 0.72x HP / 0.75x ATK, 75 Starting Gold, 65% Camp Rest',
    heroHpMult: 1.25,
    heroMpMult: 1.2,
    heroAtkMult: 1.15,
    heroDefMult: 1.15,
    enemyHpMult: 0.72,
    enemyAtkMult: 0.75,
    enemyDefAdd: -2,
    eliteChance: 0.15,
    startGold: 75,
    startHealing: 3,
    startMana: 2,
    combatGoldMult: 1.3,
    campRestPct: 0.65,
    shopPriceMult: 0.75,
    eventDmgMult: 0.65
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    summary: 'Balanced stats (1.0x), 50 Starting Gold, 45% Camp Rest, Standard Enemy Scaling',
    heroHpMult: 1.0,
    heroMpMult: 1.0,
    heroAtkMult: 1.0,
    heroDefMult: 1.0,
    enemyHpMult: 1.0,
    enemyAtkMult: 1.0,
    enemyDefAdd: 0,
    eliteChance: 0.3,
    startGold: 50,
    startHealing: 2,
    startMana: 1,
    combatGoldMult: 1.0,
    campRestPct: 0.45,
    shopPriceMult: 1.0,
    eventDmgMult: 1.0
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    summary: 'Enemies 1.35x HP / 1.30x ATK / +3 DEF, Higher Elites, 30 Starting Gold, 30% Camp Rest, +30% Shop Prices',
    heroHpMult: 0.95,
    heroMpMult: 1.0,
    heroAtkMult: 0.95,
    heroDefMult: 0.95,
    enemyHpMult: 1.35,
    enemyAtkMult: 1.3,
    enemyDefAdd: 3,
    eliteChance: 0.45,
    startGold: 30,
    startHealing: 1,
    startMana: 1,
    combatGoldMult: 1.1,
    campRestPct: 0.3,
    shopPriceMult: 1.3,
    eventDmgMult: 1.4
  }
};

export const STATUS_INFO = {
  stun: { id: 'stun', name: 'Stunned', type: 'debuff', short: 'STUN', desc: 'Cannot act on its next turn.' },
  weakened: { id: 'weakened', name: 'Weakened', type: 'debuff', short: 'WEAK', desc: 'Deals reduced attack damage.' },
  vulnerable: { id: 'vulnerable', name: 'Vulnerable', type: 'debuff', short: 'VULN', desc: 'Takes 25% more damage from all hits.' },
  burn: { id: 'burn', name: 'Burn', type: 'debuff', short: 'BURN', desc: 'Takes fire damage at end of round.' },
  poison: { id: 'poison', name: 'Poison', type: 'debuff', short: 'PSN', desc: 'Takes venom damage at end of round.' },
  bleed: { id: 'bleed', name: 'Bleed', type: 'debuff', short: 'BLD', desc: 'Takes bleed damage at end of round.' },
  taunt: { id: 'taunt', name: 'Taunt', type: 'buff', short: 'TAUNT', desc: 'Draws single-target enemy attacks.' },
  inspired: { id: 'inspired', name: 'Inspired', type: 'buff', short: 'INSP', desc: 'Deals increased attack damage.' },
  fortified: { id: 'fortified', name: 'Fortified', type: 'buff', short: 'FORT', desc: 'Increased Defense against hits.' },
  regeneration: { id: 'regeneration', name: 'Regen', type: 'buff', short: 'REGEN', desc: 'Restores HP at end of round.' },
  thorns: { id: 'thorns', name: 'Thorns', type: 'buff', short: 'THRN', desc: 'Reflects damage back to attackers.' }
};

export const SKILLS = {
  // === KNIGHT ===
  iron_slash: {
    id: 'iron_slash',
    heroId: 'knight',
    name: 'Iron Slash',
    mpCost: 0,
    targetType: 'enemy',
    damageType: 'physical',
    damageMult: 1.05,
    ignoreDefPct: 0
  },
  shield_bash: {
    id: 'shield_bash',
    heroId: 'knight',
    name: 'Shield Bash',
    mpCost: 10,
    targetType: 'enemy',
    damageType: 'physical',
    damageMult: 0.85,
    ignoreDefPct: 0,
    stunOrWeaken: true
  },
  aegis_guard: {
    id: 'aegis_guard',
    heroId: 'knight',
    name: 'Aegis Guard',
    mpCost: 12,
    targetType: 'self',
    damageType: 'support',
    selfShield: 26,
    partyShield: 12,
    selfStatus: { id: 'taunt', duration: 2, potency: 1 }
  },
  valiant_cleave: {
    id: 'valiant_cleave',
    heroId: 'knight',
    name: 'Valiant Cleave',
    mpCost: 14,
    targetType: 'all_enemies',
    damageType: 'physical',
    damageMult: 0.98,
    selfShield: 12
  },
  holy_judgement: {
    id: 'holy_judgement',
    heroId: 'knight',
    name: 'Holy Judgement',
    mpCost: 16,
    targetType: 'enemy',
    damageType: 'physical',
    damageMult: 1.55,
    ignoreDefPct: 0.3,
    selfHeal: 25
  },
  unbreakable_bulwark: {
    id: 'unbreakable_bulwark',
    heroId: 'knight',
    name: 'Unbreakable Bulwark',
    mpCost: 18,
    targetType: 'all_allies',
    damageType: 'support',
    partyShield: 26,
    partyStatus: { id: 'fortified', duration: 2, potency: 0.35 }
  },

  // === WIZARD ===
  arcane_bolt: {
    id: 'arcane_bolt',
    heroId: 'wizard',
    name: 'Arcane Bolt',
    mpCost: 0,
    targetType: 'enemy',
    damageType: 'magic',
    damageMult: 1.08,
    ignoreDefPct: 0.5
  },
  fireball: {
    id: 'fireball',
    heroId: 'wizard',
    name: 'Fireball',
    mpCost: 18,
    targetType: 'all_enemies',
    damageType: 'magic',
    damageMult: 0.9,
    ignoreDefPct: 0.25,
    enemyStatus: { id: 'burn', duration: 2, potency: 8 }
  },
  mana_conduit: {
    id: 'mana_conduit',
    heroId: 'wizard',
    name: 'Mana Conduit',
    mpCost: 8,
    targetType: 'ally',
    damageType: 'support',
    restoreMp: 24,
    targetShield: 16
  },
  chain_lightning: {
    id: 'chain_lightning',
    heroId: 'wizard',
    name: 'Chain Lightning',
    mpCost: 16,
    targetType: 'enemy_splash',
    damageType: 'magic',
    damageMult: 1.2,
    splashMult: 0.72,
    ignoreDefPct: 0.35,
    enemyStatus: { id: 'vulnerable', duration: 2, potency: 0.25 }
  },
  frost_nova: {
    id: 'frost_nova',
    heroId: 'wizard',
    name: 'Frost Nova',
    mpCost: 15,
    targetType: 'all_enemies',
    damageType: 'magic',
    damageMult: 0.84,
    ignoreDefPct: 0.3,
    enemyStatus: { id: 'weakened', duration: 2, potency: 0.3 }
  },
  meteor_storm: {
    id: 'meteor_storm',
    heroId: 'wizard',
    name: 'Meteor Storm',
    mpCost: 26,
    targetType: 'all_enemies',
    damageType: 'magic',
    damageMult: 1.5,
    ignoreDefPct: 0.35,
    enemyStatus: { id: 'burn', duration: 2, potency: 11 }
  },

  // === DRAGON TAMER ===
  wyrm_lance: {
    id: 'wyrm_lance',
    heroId: 'dragon_tamer',
    name: 'Wyrm-Lance Thrust',
    mpCost: 0,
    targetType: 'enemy',
    damageType: 'physical',
    damageMult: 1.08,
    ignoreDefPct: 0.4
  },
  drakes_breath: {
    id: 'drakes_breath',
    heroId: 'dragon_tamer',
    name: "Drake's Breath",
    mpCost: 14,
    targetType: 'all_enemies',
    damageType: 'magic',
    damageMult: 0.8,
    ignoreDefPct: 0.2,
    enemyStatus: { id: 'burn', duration: 2, potency: 10 }
  },
  draconic_roar: {
    id: 'draconic_roar',
    heroId: 'dragon_tamer',
    name: 'Draconic Roar',
    mpCost: 12,
    targetType: 'all_allies',
    damageType: 'support',
    partyStatus: { id: 'inspired', duration: 2, potency: 0.3 }
  },
  wyvern_dive: {
    id: 'wyvern_dive',
    heroId: 'dragon_tamer',
    name: 'Wyvern Dive',
    mpCost: 15,
    targetType: 'enemy',
    damageType: 'physical',
    damageMult: 1.52,
    ignoreDefPct: 0.25,
    enemyStatus: { id: 'bleed', duration: 3, potency: 10 }
  },
  dragonscale_ward: {
    id: 'dragonscale_ward',
    heroId: 'dragon_tamer',
    name: 'Dragonscale Ward',
    mpCost: 16,
    targetType: 'all_allies',
    damageType: 'support',
    partyShield: 18,
    partyStatus: { id: 'thorns', duration: 2, potency: 8 }
  },
  inferno_fang: {
    id: 'inferno_fang',
    heroId: 'dragon_tamer',
    name: 'Inferno Fang',
    mpCost: 20,
    targetType: 'enemy',
    damageType: 'magic',
    damageMult: 1.48,
    ignoreDefPct: 0.3,
    enemyStatus: { id: 'burn', duration: 3, potency: 16 }
  },

  // === DRUID ===
  thorn_whip: {
    id: 'thorn_whip',
    heroId: 'druid',
    name: 'Thorn Whip',
    mpCost: 0,
    targetType: 'enemy',
    damageType: 'nature',
    damageMult: 0.94,
    ignoreDefPct: 0.2,
    enemyStatus: { id: 'poison', duration: 3, potency: 9 }
  },
  rejuvenating_bloom: {
    id: 'rejuvenating_bloom',
    heroId: 'druid',
    name: 'Rejuvenating Bloom',
    mpCost: 15,
    targetType: 'ally',
    damageType: 'support',
    healAmount: 40,
    cleanse: true
  },
  barkskin_blessing: {
    id: 'barkskin_blessing',
    heroId: 'druid',
    name: 'Barkskin Blessing',
    mpCost: 16,
    targetType: 'all_allies',
    damageType: 'support',
    partyStatuses: [
      { id: 'regeneration', duration: 2, potency: 12 },
      { id: 'fortified', duration: 2, potency: 0.35 }
    ]
  },
  wrath_of_the_forest: {
    id: 'wrath_of_the_forest',
    heroId: 'druid',
    name: 'Wrath of the Forest',
    mpCost: 16,
    targetType: 'all_enemies',
    damageType: 'nature',
    damageMult: 0.84,
    ignoreDefPct: 0.25,
    enemyStatus: { id: 'poison', duration: 3, potency: 9 }
  },
  sylvan_sanctuary: {
    id: 'sylvan_sanctuary',
    heroId: 'druid',
    name: 'Sylvan Sanctuary',
    mpCost: 20,
    targetType: 'all_allies',
    damageType: 'support',
    partyHeal: 30,
    partyStatus: { id: 'regeneration', duration: 2, potency: 9 }
  },
  natures_rebirth: {
    id: 'natures_rebirth',
    heroId: 'druid',
    name: "Nature's Rebirth",
    mpCost: 22,
    targetType: 'ally_or_dead',
    damageType: 'support',
    revivePct: 0.5,
    healAmount: 65,
    cleanse: true
  }
};

export const STARTER_HEROES = [
  {
    id: 'knight',
    name: 'Ser Roland',
    title: 'The Knight',
    role: 'Frontline Tank & Striker',
    maxHp: 140,
    maxMp: 40,
    atk: 20,
    def: 15,
    accent: '#c89b3c',
    basicSkills: ['iron_slash', 'shield_bash', 'aegis_guard'],
    learnableSkills: ['valiant_cleave', 'holy_judgement', 'unbreakable_bulwark']
  },
  {
    id: 'wizard',
    name: 'Archmage Lyra',
    title: 'The Wizard',
    role: 'Arcane Burst & AoE Caster',
    maxHp: 98,
    maxMp: 75,
    atk: 26,
    def: 8,
    accent: '#4a85b5',
    basicSkills: ['arcane_bolt', 'fireball', 'mana_conduit'],
    learnableSkills: ['chain_lightning', 'frost_nova', 'meteor_storm']
  },
  {
    id: 'dragon_tamer',
    name: 'Kaelen & Ignis',
    title: 'The Dragon Tamer',
    role: 'Hybrid Lancer & Wyrm Commander',
    maxHp: 118,
    maxMp: 50,
    atk: 23,
    def: 11,
    accent: '#c95632',
    basicSkills: ['wyrm_lance', 'drakes_breath', 'draconic_roar'],
    learnableSkills: ['wyvern_dive', 'dragonscale_ward', 'inferno_fang']
  },
  {
    id: 'druid',
    name: 'Sylvara of the Grove',
    title: 'The Druid',
    role: 'Nature Healer & Poisoner',
    maxHp: 110,
    maxMp: 65,
    atk: 19,
    def: 10,
    accent: '#4b9460',
    basicSkills: ['thorn_whip', 'rejuvenating_bloom', 'barkskin_blessing'],
    learnableSkills: ['wrath_of_the_forest', 'sylvan_sanctuary', 'natures_rebirth']
  }
];

export const MONSTERS = [
  {
    id: 'goblin_cutthroat',
    name: 'Goblin Cutthroat',
    tier: 1,
    icon: 'goblin',
    maxHp: 44,
    atk: 11,
    def: 3,
    goldMin: 16,
    goldMax: 24,
    intents: [
      { name: 'Rusty Shiv', type: 'attack', mult: 1.0, description: 'Strikes a single hero.' },
      { name: 'Ragged Slash', type: 'attack', mult: 0.85, status: { id: 'bleed', duration: 2, potency: 4 }, description: 'Deals damage + Bleed (4/t).' }
    ]
  },
  {
    id: 'mire_slime',
    name: 'Blighted Mire Slime',
    tier: 1,
    icon: 'slime',
    maxHp: 52,
    atk: 9,
    def: 5,
    goldMin: 15,
    goldMax: 22,
    intents: [
      { name: 'Acid Splash', type: 'aoe', mult: 0.75, description: 'Splashes all heroes.' },
      { name: 'Toxic Spore', type: 'attack', mult: 0.85, status: { id: 'poison', duration: 2, potency: 5 }, description: 'Damages + Poison (5/t).' }
    ]
  },
  {
    id: 'skeleton_halberdier',
    name: 'Risen Halberdier',
    tier: 1,
    icon: 'skeleton',
    maxHp: 50,
    atk: 12,
    def: 6,
    goldMin: 18,
    goldMax: 28,
    intents: [
      { name: 'Bone Cleave', type: 'attack', mult: 1.05, description: 'Heavy strike at one hero.' },
      { name: 'Phalanx Brace', type: 'buff', shield: 14, status: { id: 'fortified', duration: 2, potency: 0.35 }, description: 'Gains 14 Shield & Fortified.' }
    ]
  },
  {
    id: 'dire_wolf',
    name: 'Shadowmane Wolf',
    tier: 1,
    icon: 'beast',
    maxHp: 46,
    atk: 13,
    def: 3,
    goldMin: 16,
    goldMax: 25,
    intents: [
      { name: 'Savage Bite', type: 'attack', mult: 1.0, status: { id: 'vulnerable', duration: 2, potency: 0.25 }, description: 'Bites + Vulnerable (2t).' },
      { name: 'Pack Howl', type: 'buff', teamStatus: { id: 'inspired', duration: 2, potency: 0.3 }, description: 'Inspires all enemies (+30% ATK).' }
    ]
  },
  {
    id: 'bandit_warlord',
    name: 'Ironclad Marauder',
    tier: 2,
    icon: 'marauder',
    maxHp: 82,
    atk: 16,
    def: 8,
    goldMin: 28,
    goldMax: 42,
    intents: [
      { name: 'Crushing Flail', type: 'attack', mult: 1.15, description: 'Heavy blow to one hero.' },
      { name: 'Whirlwind Axe', type: 'aoe', mult: 0.8, description: 'Sweeps the entire party.' },
      { name: 'Iron Stance', type: 'buff', shield: 20, status: { id: 'thorns', duration: 2, potency: 5 }, description: 'Gains 20 Shield & Thorns.' }
    ]
  },
  {
    id: 'blood_cultist',
    name: 'Crimson Ritualist',
    tier: 2,
    icon: 'cultist',
    maxHp: 72,
    atk: 17,
    def: 5,
    goldMin: 26,
    goldMax: 38,
    intents: [
      { name: 'Hex Bolt', type: 'attack', mult: 1.05, status: { id: 'weakened', duration: 2, potency: 0.3 }, description: 'Curses + Weakened (2t).' },
      { name: 'Hellfire Chant', type: 'aoe', mult: 0.75, status: { id: 'burn', duration: 2, potency: 6 }, description: 'AoE fire + Burn (6/t).' }
    ]
  },
  {
    id: 'stone_gargoyle',
    name: 'Cathedral Gargoyle',
    tier: 2,
    icon: 'gargoyle',
    maxHp: 88,
    atk: 15,
    def: 10,
    goldMin: 30,
    goldMax: 44,
    intents: [
      { name: 'Granite Slam', type: 'attack', mult: 1.15, description: 'Crushing stone strike.' },
      { name: 'Petrified Shell', type: 'buff', shield: 22, heal: 12, description: 'Heals 12 HP & gains 22 Shield.' }
    ]
  },
  {
    id: 'plague_wraith',
    name: 'Ashen Wraith',
    tier: 2,
    icon: 'wraith',
    maxHp: 76,
    atk: 18,
    def: 6,
    goldMin: 28,
    goldMax: 40,
    intents: [
      { name: 'Soul Drain', type: 'attack', mult: 1.0, healSelfPct: 0.45, description: 'Damages and drains life.' },
      { name: 'Miasma Wave', type: 'aoe', mult: 0.75, status: { id: 'poison', duration: 2, potency: 6 }, description: 'AoE + Poison (6/t).' }
    ]
  },
  {
    id: 'dread_knight',
    name: 'Oathbreaker Dread Knight',
    tier: 3,
    icon: 'dread_knight',
    maxHp: 125,
    atk: 21,
    def: 11,
    goldMin: 42,
    goldMax: 60,
    intents: [
      { name: 'Executioner Blade', type: 'attack', mult: 1.2, status: { id: 'bleed', duration: 2, potency: 8 }, description: 'Heavy strike + Bleed (8/t).' },
      { name: 'Unholy Aegis', type: 'buff', shield: 26, teamStatus: { id: 'fortified', duration: 2, potency: 0.35 }, description: 'Shields self & Fortifies foes.' },
      { name: 'Abyssal Cleave', type: 'aoe', mult: 0.85, description: 'Cleaves all heroes.' }
    ]
  },
  {
    id: 'abyssal_wyvern',
    name: 'Cinderwing Wyvern',
    tier: 3,
    icon: 'wyvern',
    maxHp: 118,
    atk: 22,
    def: 9,
    goldMin: 44,
    goldMax: 62,
    intents: [
      { name: 'Scorching Breath', type: 'aoe', mult: 0.82, status: { id: 'burn', duration: 2, potency: 8 }, description: 'AoE fire + Burn (8/t).' },
      { name: 'Talon Rend', type: 'attack', mult: 1.18, status: { id: 'vulnerable', duration: 2, potency: 0.25 }, description: 'Heavy rend + Vulnerable.' }
    ]
  },
  {
    id: 'arch_necromancer',
    name: 'Barrow Arch-Necromancer',
    tier: 3,
    icon: 'cultist',
    maxHp: 108,
    atk: 20,
    def: 7,
    goldMin: 40,
    goldMax: 58,
    intents: [
      { name: 'Withering Curse', type: 'aoe', mult: 0.8, status: { id: 'weakened', duration: 2, potency: 0.3 }, description: 'Damages & Weakens all heroes.' },
      { name: 'Necrotic Bolt', type: 'attack', mult: 1.2, healSelfPct: 0.35, description: 'Heavy dark bolt + life siphon.' }
    ]
  }
];

export const FINAL_BOSSES = [
  {
    id: 'malakor',
    name: 'Malakor, the Abyssal Dreadwyrm',
    title: 'Ancient Tyrant of the Ash Throne',
    icon: 'boss_dragon',
    isBoss: true,
    maxHp: 340,
    atk: 23,
    def: 11,
    goldMin: 150,
    goldMax: 200,
    intents: [
      { name: 'Abyssal Claw', type: 'attack', mult: 1.2, status: { id: 'vulnerable', duration: 2, potency: 0.25 }, description: 'Crushing strike + Vulnerable (2t).' },
      { name: 'Cinder Cataclysm', type: 'aoe', mult: 0.85, status: { id: 'burn', duration: 2, potency: 9 }, description: 'Scorches all heroes + Burn (9/t).' },
      { name: 'Obsidian Scales', type: 'buff', shield: 32, status: { id: 'thorns', duration: 2, potency: 7 }, description: 'Gains 32 Shield & Thorns (7 dmg).' },
      { name: 'Dreadwyrm Roar', type: 'aoe', mult: 0.78, status: { id: 'weakened', duration: 2, potency: 0.3 }, description: 'Shakes the hall, Weakening heroes.' }
    ]
  },
  {
    id: 'vaelen',
    name: 'Vaelen, the Undying Lich King',
    title: 'Sovereign of the Frozen Crypt',
    icon: 'boss_lich',
    isBoss: true,
    maxHp: 320,
    atk: 22,
    def: 9,
    goldMin: 150,
    goldMax: 200,
    intents: [
      { name: 'Soul Harvest', type: 'aoe', mult: 0.82, healSelfPct: 0.3, description: 'Drains life from all heroes.' },
      { name: 'Deathcoil Lance', type: 'attack', mult: 1.25, status: { id: 'poison', duration: 3, potency: 9 }, description: 'Piercing curse + Blight (9/t).' },
      { name: 'Phylactery Ward', type: 'buff', shield: 36, status: { id: 'inspired', duration: 2, potency: 0.3 }, description: 'Gains 36 Shield & Inspired (+30% ATK).' },
      { name: 'Raise Ossuary Guard', type: 'summon', summonId: 'skeleton_halberdier', shield: 16, description: 'Summons a Risen Halberdier & gains 16 Shield.' }
    ]
  },
  {
    id: 'aurelius',
    name: 'Aurelius, the Fallen Sun-Emperor',
    title: 'Usurper of the Shattered Crown',
    icon: 'boss_emperor',
    isBoss: true,
    maxHp: 360,
    atk: 24,
    def: 12,
    goldMin: 150,
    goldMax: 200,
    intents: [
      { name: 'Solar Greatsword', type: 'attack', mult: 1.22, status: { id: 'bleed', duration: 2, potency: 9 }, description: 'Brutal slash + Bleed (9/t).' },
      { name: 'Searing Verdict', type: 'aoe', mult: 0.88, description: 'Sweeping golden wave hits all heroes.' },
      { name: 'Imperial Bastion', type: 'buff', shield: 30, status: { id: 'fortified', duration: 2, potency: 0.35 }, description: 'Gains 30 Shield & Fortified (+35% DEF).' },
      { name: 'Edict of Ruin', type: 'attack', mult: 1.32, status: { id: 'burn', duration: 2, potency: 9 }, description: 'Radiant judgement + Burn (9/t).' }
    ]
  }
];

export const CONSUMABLES = [
  { id: 'healing_draught', name: 'Crimson Healing Draught', price: 25, targetType: 'ally', description: 'Restore 45 HP to one living hero.', effect: { heal: 45 } },
  { id: 'mana_elixir', name: 'Azure Mana Elixir', price: 24, targetType: 'ally', description: 'Restore 30 MP to one living hero.', effect: { restoreMp: 30 } },
  { id: 'phoenix_feather', name: 'Phoenix Ash Feather', price: 55, targetType: 'ally_or_dead', description: 'Revive fallen hero at 60% HP, or heal 60 HP & cleanse.', effect: { revivePct: 0.6, heal: 60, cleanse: true } },
  { id: 'fire_flask', name: 'Alchemist Fire Flask', price: 30, targetType: 'all_enemies', description: 'Throw at all enemies for 28 fire dmg + Burn (8/t, 2t).', effect: { aoeDamage: 28, status: { id: 'burn', duration: 2, potency: 8 } } },
  { id: 'iron_tonic', name: 'Ironbark Tonic', price: 28, targetType: 'all_allies', description: 'Grant living heroes 20 Shield & Fortified (+35% DEF, 2t).', effect: { partyShield: 20, partyStatus: { id: 'fortified', duration: 2, potency: 0.35 } } },
  { id: 'antidote_herbs', name: 'Sylvan Antidote Satchel', price: 22, targetType: 'all_allies', description: 'Cleanse negative statuses and heal 15 HP.', effect: { partyHeal: 15, partyCleanse: true } }
];

export const RELICS = [
  { id: 'sunstone_pendant', name: 'Sunstone Pendant', price: 70, description: 'Heroes gain +18 Max HP and heal 18 HP immediately.', bonus: { maxHp: 18 } },
  { id: 'arcane_grimoire', name: 'Ancient Arcane Grimoire', price: 72, description: 'Heroes gain +14 Max MP and +3 ATK.', bonus: { maxMp: 14, atk: 3 } },
  { id: 'ironbound_buckler', name: 'Ironbound Banneret', price: 68, description: 'Heroes gain +3 DEF and start battle with 12 Shield.', bonus: { def: 3, startShield: 12 } },
  { id: 'obsidian_whetstone', name: 'Obsidian Whetstone', price: 75, description: 'Heroes gain +4 ATK.', bonus: { atk: 4 } },
  { id: 'wyrm_scale_cloak', name: 'Wyrmscale Cloak', price: 74, description: 'Heroes gain +14 Max HP and +2 DEF.', bonus: { maxHp: 14, def: 2 } },
  { id: 'emerald_heartwood', name: 'Emerald Heartwood', price: 78, description: 'Restore 8 HP & 5 MP after every combat victory.', bonus: { postCombatHeal: 8, postCombatMp: 5 } },
  { id: 'merchants_coinpurse', name: 'Gilded Tax Ledger', price: 60, description: 'Earn +25% bonus Gold from all combat victories.', bonus: { goldPct: 0.25 } },
  { id: 'warlords_banner', name: "Warlord's Warhorn", price: 82, description: 'Start every combat with Inspired (+30% ATK) for 1 turn.', bonus: { startInspired: true } }
];

export const PATH_FLAVOR = {
  combat: [
    { title: 'Ambush in the Thornwood', desc: 'Rusted blades glint behind gnarled oaks. Defeat the monsters for gold, relics, or skill scrolls.' },
    { title: 'The Broken Watchtower', desc: 'Feral beasts and dark patrols prowl the crumbling battlements. Fight for spoils and renown.' },
    { title: 'Cursed Causeway', desc: 'Mist coils over ancient flagstones where foes await travelers. Victory grants gold and loot.' },
    { title: 'Ashen Garrison Ruins', desc: 'A hostile warband has claimed this outpost. Vanquish them to claim their chest.' },
    { title: 'The Sunken Barrow', desc: 'Restless foes guard forgotten relics beneath the moss. Strike them down for rich rewards.' }
  ],
  elite: [
    { title: 'Blood-Stained Arena (Elite)', desc: 'A formidable champion leads fierce monsters here. High danger, greater Gold and rich spoils!' },
    { title: 'Executioner Crossing (Elite)', desc: 'An empowered elite patrol blocks the pass. Triumph yields bonus Gold and rare treasures.' }
  ],
  camp: [
    { title: 'The Hearth & Flagons Tavern', desc: 'A warm roadside tavern free of monsters. Rest up, train your skills, and buy wares from the barkeep.' },
    { title: 'Moonlit Pilgrim Camp', desc: 'An empty clearing with crackling embers and a wandering peddler selling potions and relics.' },
    { title: 'Silverbrook Crossroads Inn', desc: 'No foes lurk here. Mend your wounds, sharpen your weapons, and trade coin for gear.' }
  ],
  event: [
    { title: 'Mystery of the Crossroads', desc: 'A strange encounter blocks the road ahead. You must make a fateful decision.' },
    { title: 'The Whispering Landmark', desc: 'An enigmatic stranger or ancient monument demands a choice of courage, coin, or sacrifice.' },
    { title: 'Fateful Omen Trail', desc: 'Signs of forgotten magic linger here. Choose wisely—fortune or peril awaits.' }
  ]
};

export const DECISION_EVENTS = [
  {
    id: 'cursed_reliquary',
    title: 'The Chained Reliquary',
    description: 'Inside a ruined abbey sits an iron reliquary bound in silver chains. Faint golden light pulses through its keyhole while dark whispers echo.',
    choices: [
      { id: 'smash_lock', label: 'Smash the Chains (Gain 1 Relic, lose HP)', hint: '+1 Random Relic, take injury' },
      { id: 'pray_altar', label: 'Purify the Altar (Heal HP & +12 MP)', hint: 'Safe recovery' },
      { id: 'salvage_silver', label: 'Pry Off the Silver Chains (+50 Gold)', hint: '+50 Gold' }
    ]
  },
  {
    id: 'wounded_knight',
    title: 'The Fallen Royal Courier',
    description: 'A battered royal courier leans against a milestone, clutching a sealed wax dispatch and a pouch of supplies.',
    choices: [
      { id: 'tend_wounds', label: 'Spend 25 Gold for Bandages (Learn a New Skill!)', hint: '-25 Gold, +1 Skill Scroll' },
      { id: 'escort_rest', label: 'Share Camp Rations (+10 Max HP)', hint: '+10 Max HP' },
      { id: 'claim_pouch', label: 'Take His Satchel (+45 Gold & 1 Healing Draught)', hint: '+45 Gold & Potion' }
    ]
  },
  {
    id: 'alchemist_wager',
    title: 'The Traveling Alchemist',
    description: 'A hooded alchemist offers two unmarked crystal phials over a bubbling brazier. "Coin for certainty, or drink for glory!"',
    choices: [
      { id: 'drink_crimson', label: 'Drink the Unlabeled Crimson Phial (Chance +4 ATK or hurt)', hint: 'High risk, permanent ATK or hurt' },
      { id: 'buy_bundle', label: 'Pay 30 Gold for Safe Elixirs (+2 Consumables)', hint: '-30 Gold, +2 Potions' },
      { id: 'decline', label: 'Politely Decline & Move On (+15 MP)', hint: 'Recover 15 MP' }
    ]
  },
  {
    id: 'whispering_obelisk',
    title: 'The Whispering Obelisk',
    description: 'Runes carved in obsidian hum with forgotten arcane power. Touching them could awaken hidden mastery—or draw nearby predators.',
    choices: [
      { id: 'study_runes', label: 'Channel the Runes (Learn a New Skill, -15 MP)', hint: 'New Skill' },
      { id: 'offer_blood', label: 'Offer Vitality (Lose HP for +1 Random Relic)', hint: 'Trade HP for Relic' },
      { id: 'shatter_stone', label: 'Shatter the Dark Stone (Surprise Fight for Bonus Loot!)', hint: 'Triggers Combat + Bonus Gold' }
    ]
  },
  {
    id: 'blackbridge_toll',
    title: 'The Toll of Blackbridge',
    description: 'Armored mercenaries block the narrow stone bridge, demanding tribute to pass without bloodshed.',
    choices: [
      { id: 'pay_toll', label: 'Pay the Toll (-35 Gold, Safe Passage)', hint: '-35 Gold' },
      { id: 'intimidate', label: 'Draw Steel & Charge! (Fight the Bridge Guards)', hint: 'Combat for Gold & Loot' },
      { id: 'ford_river', label: 'Wade Through the Freezing Ford (Lose HP, +25 Gold)', hint: 'Take cold damage, +25 Gold' }
    ]
  },
  {
    id: 'dragons_clutch',
    title: 'The Abandoned Wyrm Nest',
    description: 'High on a basalt ledge sits a warm nest containing shed dragonscales and a single flickering emberstone.',
    choices: [
      { id: 'harvest_scales', label: 'Gather Wyrmscales (+2 DEF)', hint: 'Permanent +2 DEF' },
      { id: 'absorb_ember', label: 'Absorb the Emberstone (+2 ATK)', hint: 'Permanent +2 ATK' },
      { id: 'take_hoard', label: 'Search the Gold Hoard (+65 Gold)', hint: '+65 Gold' }
    ]
  },
  {
    id: 'forgotten_armory',
    title: 'The Sunken Armory',
    description: 'Behind a collapsed wall lies an ancient royal cache untouched since the last war.',
    choices: [
      { id: 'take_relic', label: 'Claim the Masterwork Banner (+1 Random Relic)', hint: '+1 Random Relic' },
      { id: 'temper_arms', label: 'Sharpen & Reinforce Gear (+2 ATK & +12 Max HP)', hint: '+2 ATK & +12 Max HP' },
      { id: 'pack_supplies', label: 'Gather Flasks & Herbs (+2 Random Consumables)', hint: '+2 Consumables' }
    ]
  },
  {
    id: 'sacred_grove',
    title: 'The Moonwell of Eldergrove',
    description: 'A sacred silver pool glistens peacefully beneath ancient weeping willows.',
    choices: [
      { id: 'bathe_waters', label: 'Drink from the Moonwell (Full HP & MP restore)', hint: 'Full Restore' },
      { id: 'bless_weapons', label: 'Anoint Weapons in Silver (+3 ATK)', hint: '+3 ATK' },
      { id: 'harvest_herbs', label: 'Gather Moonpetals (+1 Phoenix Feather & +1 Antidote)', hint: '+2 Support Items' }
    ]
  },
  {
    id: 'gambling_tavern',
    title: 'The Crooked Dice Tavern',
    description: 'Lanterns swing above an isolated roadside tavern where cutthroats wager gold and rare scrolls on bone dice.',
    choices: [
      { id: 'wager_gold', label: 'Wager 40 Gold on the Crown Die (60% win 100g & Relic)', hint: 'High-stakes gamble' },
      { id: 'arm_wrestle', label: 'Challenge the Champion (+35 Gold, lose small HP)', hint: 'Test of brawn' },
      { id: 'buy_meal', label: 'Buy a Warm Stew (-15 Gold, Heal 35 HP & 20 MP)', hint: 'Cheap tavern rest' }
    ]
  },
  {
    id: 'arcane_library',
    title: 'The Ruined Scriptorium',
    description: 'Tattered spellbooks float faintly inside a shattered tower ward with potent battle techniques inscribed.',
    choices: [
      { id: 'decipher_tome', label: 'Decipher a Combat Tome (Learn 1 New Skill)', hint: '+1 Skill Scroll' },
      { id: 'siphon_ward', label: 'Siphon the Tower Ward (+15 Max MP)', hint: '+15 Max MP' },
      { id: 'loot_scrolls', label: 'Sell Rare Parchments (+55 Gold)', hint: '+55 Gold' }
    ]
  },
  {
    id: 'pilgrim_caravan',
    title: 'Stranded Pilgrim Caravan',
    description: 'A merchant wagon sits with a broken axle while shadows gather in the nearby treeline.',
    choices: [
      { id: 'guard_wagon', label: 'Fend Off the Lurkers (Fight Monsters for +40 Bonus Gold)', hint: 'Combat + Bonus 40 Gold' },
      { id: 'help_repair', label: 'Help Repair the Axle (+30 Gold & +1 Healing Draught)', hint: 'Quick reward' },
      { id: 'trade_secrets', label: 'Exchange Trail Maps (+1 Random Consumable & +15 MP)', hint: '+Item & MP' }
    ]
  },
  {
    id: 'dark_pact_shrine',
    title: 'Shrine of the Crimson Pact',
    description: 'A dark marble basin whispers promises of immense power in exchange for life force.',
    choices: [
      { id: 'blood_power', label: 'Pledge Vitality (Sacrifice HP for +4 ATK & 1 Relic)', hint: 'Lose HP -> +4 ATK + Relic' },
      { id: 'gold_tribute', label: 'Toss 50 Gold into the Basin (+18 Max HP & +2 DEF)', hint: '-50 Gold -> Tank stats' },
      { id: 'destroy_idol', label: 'Topple the Dark Idol (+45 Gold & +18 HP heal)', hint: 'Righteous reward' }
    ]
  }
];
