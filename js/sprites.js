/**
 * Static & animated medieval SVG sprites and panoramic biome scenes.
 */
export function getSpriteSvg(kind, size = 84) {
  const wrap = (inner, vb = '0 0 64 64') =>
    `<svg width="${size}" height="${size}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision">${inner}</svg>`;

  switch (kind) {
    case 'brand':
      return wrap(`
        <path d="M12 48L52 16M44 14h10v10M52 48L12 16M10 14h10v10" stroke="#c0c8d2" stroke-width="4" stroke-linecap="round"/>
        <path d="M16 40h32l4-16-10 7-10-13-10 13-10-7 4 16z" fill="#e0b256" stroke="#5a3b12" stroke-width="2.5"/>
        <rect x="16" y="42" width="32" height="6" rx="1" fill="#b8842e" stroke="#5a3b12" stroke-width="2"/>
        <circle cx="32" cy="31" r="3" fill="#d93838"/>
      `);

    case 'knight':
      return wrap(`
        <path d="M27 6c8-3 15 2 14 9-5-2-9-2-14-1V6z" fill="#c24242" stroke="#5a1919" stroke-width="1.8"/>
        <path d="M16 34c0-5 7-8 16-8s16 3 16 8v20H16V34z" fill="#6f7b87" stroke="#2c3138" stroke-width="2.2"/>
        <path d="M11 32c0-4 5-6 10-5l2 10-12 2v-7zM53 32c0-4-5-6-10-5l-2 10 12 2v-7z" fill="#8f9aa6" stroke="#2c3138" stroke-width="2"/>
        <rect x="22" y="13" width="20" height="17" rx="6" fill="#9aa5b1" stroke="#2c3138" stroke-width="2.2"/>
        <rect x="25" y="20" width="14" height="3.5" fill="#181b20"/>
        <path d="M32 13v17" stroke="#d4a24c" stroke-width="2"/>
        <path d="M9 12l4-4 4 4v26h-8V12z" fill="#dce3eb" stroke="#2c3138" stroke-width="1.8"/>
        <rect x="7" y="37" width="12" height="3.5" fill="#d4a24c" stroke="#5a3b12" stroke-width="1.5"/>
        <rect x="11" y="40.5" width="4" height="8" fill="#6e4220"/>
        <path d="M37 29h19v13c0 8-9.5 14-9.5 14S37 50 37 42V29z" fill="#2c4870" stroke="#d4a24c" stroke-width="2.4"/>
        <path d="M46.5 32v18M40 39h13" stroke="#d4a24c" stroke-width="3"/>
      `);

    case 'wizard':
      return wrap(`
        <circle cx="49" cy="18" r="7" fill="#3a7ab8" opacity="0.35"/>
        <path d="M18 56L24 30h16l6 26H18z" fill="#274772" stroke="#13233a" stroke-width="2.2"/>
        <path d="M27 30l5 26 5-26" fill="#38649c"/>
        <circle cx="32" cy="24" r="7" fill="#e6c49e" stroke="#5e4126" stroke-width="1.8"/>
        <path d="M26 26c2 6 10 6 12 0l-6 11-6-11z" fill="#d9dfe6" stroke="#7c8794" stroke-width="1.4"/>
        <path d="M15 21h34l-8-4-9-13-9 13-8 4z" fill="#1e365c" stroke="#d4a24c" stroke-width="2"/>
        <path d="M32 9l1.5 3.5 3.5 1.5-3.5 1.5L32 19l-1.5-3.5L27 14l3.5-1.5L32 9z" fill="#ffd97d"/>
        <path d="M49 22v34" stroke="#6c4524" stroke-width="3.5" stroke-linecap="round"/>
        <polygon points="49,10 54,18 49,24 44,18" fill="#6ed0ff" stroke="#d4f3ff" stroke-width="1.6"/>
        <circle cx="15" cy="37" r="4.5" fill="#68c6ff" stroke="#e0f6ff" stroke-width="1.5"/>
      `);

    case 'dragon_tamer':
      return wrap(`
        <path d="M40 24c6-7 16-8 19-2-3 4-7 5-10 4 4 4 7 9 3 13-4 2-9-2-12-7z" fill="#c9402b" stroke="#4f140b" stroke-width="1.8"/>
        <path d="M44 17l7-9 4 9-6 4z" fill="#e67e35" stroke="#4f140b" stroke-width="1.6"/>
        <circle cx="52" cy="21" r="1.6" fill="#ffe169"/>
        <path d="M56 23l5-2-2 4z" fill="#ffae33"/>
        <path d="M15 56l4-24h18l4 24H15z" fill="#702820" stroke="#2d0e0a" stroke-width="2.2"/>
        <path d="M19 32l8 12 10-12" fill="#a83b28"/>
        <path d="M13 33c2-5 7-6 11-3l-2 9-9-2v-4z" fill="#c76428" stroke="#3b1709" stroke-width="1.8"/>
        <circle cx="28" cy="22" r="7.5" fill="#deb892" stroke="#4f331c" stroke-width="1.8"/>
        <path d="M19 19l5-9 4 5 4-5 5 9c-5-2-13-2-18 0z" fill="#9c2e1f" stroke="#d4a24c" stroke-width="1.8"/>
        <path d="M10 56V14" stroke="#5e3a1e" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M10 5l5 12H5L10 5z" fill="#dce3ea" stroke="#2c3138" stroke-width="1.8"/>
      `);

    case 'druid':
      return wrap(`
        <path d="M24 14c-6-2-9-7-8-11M20 11l-4 3M40 14c6-2 9-7 8-11M44 11l4 3" stroke="#8b6239" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M16 56l5-26h22l5 26H16z" fill="#2c633b" stroke="#13301c" stroke-width="2.2"/>
        <path d="M22 30l10 14 10-14" fill="#448c55"/>
        <path d="M21 22c0-7 5-11 11-11s11 4 11 11v7H21v-7z" fill="#234f2f" stroke="#13301c" stroke-width="2"/>
        <circle cx="32" cy="22" r="6" fill="#e5c7a3"/>
        <circle cx="30" cy="21" r="1.2" fill="#1e3b24"/>
        <circle cx="34" cy="21" r="1.2" fill="#1e3b24"/>
        <path d="M50 56V20c0-4 4-6 6-3" fill="none" stroke="#6c4524" stroke-width="3.4" stroke-linecap="round"/>
        <circle cx="50" cy="18" r="4.5" fill="#5ce082" stroke="#1c5c2e" stroke-width="1.6"/>
        <path d="M12 38c0-5 5-8 9-6-1 5-4 8-9 6z" fill="#63cf7d" stroke="#1a4f28" stroke-width="1.5"/>
      `);

    case 'elf_archer':
      return wrap(`
        <!-- Quiver -->
        <path d="M16 14l7-4 5 18-7 3z" fill="#6e4220" stroke="#2e190a" stroke-width="1.6"/>
        <path d="M16 12l-2-5M20 11l-1-6" stroke="#d4a24c" stroke-width="2"/>
        <!-- Forest Cloak & Tunic -->
        <path d="M16 56l5-26h20l5 26H16z" fill="#235733" stroke="#102b18" stroke-width="2.2"/>
        <path d="M24 30l7 16 7-16" fill="#3a854e"/>
        <!-- Elven Ears & Face -->
        <path d="M15 21l8-2-3 6zM47 21l-8-2 3 6z" fill="#f0cfa8" stroke="#6b4b2b" stroke-width="1.4"/>
        <circle cx="31" cy="23" r="7" fill="#f0cfa8" stroke="#6b4b2b" stroke-width="1.6"/>
        <path d="M22 18c2-6 14-8 17 0-5-2-12-2-17 0z" fill="#e6c453" stroke="#755a14" stroke-width="1.5"/>
        <!-- Yew Longbow & Emerald Arrow -->
        <path d="M46 10c10 12 10 30 0 44" fill="none" stroke="#b87e3a" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M46 11v42" stroke="#dcd3c2" stroke-width="1.4"/>
        <path d="M30 33h24M49 29l7 4-7 4" stroke="#74f295" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      `);

    case 'vampire':
      return wrap(`
        <!-- High Crimson Cape -->
        <path d="M10 22l12-10h20l12 10-6 34H16L10 22z" fill="#4f121d" stroke="#1c0509" stroke-width="2.2"/>
        <path d="M20 56l4-26h16l4 26H20z" fill="#1f1b24" stroke="#9e2a3b" stroke-width="1.8"/>
        <!-- Pale Face & Fangs -->
        <circle cx="32" cy="22" r="7.5" fill="#e3dce8" stroke="#3c2f47" stroke-width="1.8"/>
        <path d="M25 18c2-5 12-5 14 0l-3-4-4 3-4-3z" fill="#18151f"/>
        <circle cx="29" cy="21" r="1.5" fill="#ff3355"/><circle cx="35" cy="21" r="1.5" fill="#ff3355"/>
        <path d="M29 26l1 2.5M35 26l-1 2.5" stroke="#ffffff" stroke-width="1.5"/>
        <!-- Floating Blood Orb & Silver Rapier -->
        <circle cx="13" cy="36" r="5" fill="#d92145" stroke="#ff9cb0" stroke-width="1.6"/>
        <path d="M49 52V14M44 43h10" stroke="#cfd8e3" stroke-width="2.6" stroke-linecap="round"/>
      `);

    case 'werewolf':
      return wrap(`
        <!-- Muscular Fur Torso -->
        <path d="M13 56l5-25h28l5 25H13z" fill="#4f4842" stroke="#1f1b17" stroke-width="2.2"/>
        <path d="M21 31l11 16 11-16" fill="#6b6259"/>
        <path d="M20 35l24 14M44 35L20 49" stroke="#7d4a26" stroke-width="3.5"/>
        <!-- Wolf Head & Ears -->
        <path d="M19 19l4-12 7 7h4l7-7 4 12-6 13H25l-6-13z" fill="#635a52" stroke="#1f1b17" stroke-width="2.2"/>
        <circle cx="27" cy="21" r="2" fill="#ffae33"/><circle cx="37" cy="21" r="2" fill="#ffae33"/>
        <path d="M28 29l4 3 4-3" fill="#211c19"/>
        <!-- Claws -->
        <path d="M8 38l8-4M8 43l8-3M56 38l-8-4M56 43l-8-3" stroke="#e8e2d5" stroke-width="2.6" stroke-linecap="round"/>
      `);

    case 'treant':
      return wrap(`
        <path d="M22 56l3-24h14l3 24H22z" fill="#593a20" stroke="#26170b" stroke-width="2.2"/>
        <path d="M12 36l12-6M52 36l-12-6" stroke="#593a20" stroke-width="4.5" stroke-linecap="round"/>
        <circle cx="32" cy="22" r="14" fill="#2e6b3a" stroke="#13361a" stroke-width="2"/>
        <circle cx="22" cy="18" r="8" fill="#3c8549"/>
        <circle cx="42" cy="18" r="8" fill="#3c8549"/>
        <circle cx="27" cy="36" r="2.2" fill="#8cff9f"/><circle cx="37" cy="36" r="2.2" fill="#8cff9f"/>
      `);

    case 'goblin':
      return wrap(`
        <path d="M12 24l10 4-6 7zM52 24l-10 4 6 7z" fill="#5b8a42" stroke="#223b16" stroke-width="2"/>
        <path d="M19 56l4-20h18l4 20H19z" fill="#5c422c" stroke="#291c11" stroke-width="2"/>
        <circle cx="32" cy="25" r="11" fill="#6ca34f" stroke="#223b16" stroke-width="2.2"/>
        <circle cx="27" cy="24" r="2.5" fill="#ffe159"/><circle cx="37" cy="24" r="2.5" fill="#ffe159"/>
        <path d="M27 31h10" stroke="#223b16" stroke-width="2"/>
        <path d="M46 36l11-12 3 4-11 11z" fill="#a8b2bd" stroke="#2c3138" stroke-width="1.6"/>
      `);

    case 'slime':
      return wrap(`
        <path d="M10 48c0-18 8-30 22-30s22 12 22 30c0 6-44 6-44 0z" fill="#4aa860" stroke="#1a4d26" stroke-width="2.4"/>
        <path d="M18 44c0-10 5-18 14-18s14 8 14 18" fill="#68d17e" opacity="0.6"/>
        <circle cx="25" cy="37" r="3" fill="#132e1a"/><circle cx="39" cy="37" r="3" fill="#132e1a"/>
        <circle cx="20" cy="28" r="2.5" fill="#b4f5bf"/><circle cx="43" cy="25" r="2" fill="#b4f5bf"/>
      `);

    case 'skeleton':
      return wrap(`
        <path d="M20 56l3-21h18l3 21H20z" fill="#4d443d" stroke="#1e1915" stroke-width="2"/>
        <path d="M26 39h12M26 44h12M26 49h12" stroke="#d8d1c5" stroke-width="2.2"/>
        <circle cx="32" cy="22" r="10.5" fill="#e2dacb" stroke="#3b332b" stroke-width="2.2"/>
        <circle cx="28" cy="21" r="2.6" fill="#1b1512"/><circle cx="36" cy="21" r="2.6" fill="#1b1512"/>
        <path d="M28 29h8" stroke="#3b332b" stroke-width="2"/>
        <path d="M51 12v44M45 18h12l-6-8-6 8z" fill="#9da7b2" stroke="#2b3036" stroke-width="2"/>
      `);

    case 'beast':
      return wrap(`
        <path d="M16 20l6-11 8 8h8l8-8 4 12-5 15H21L16 20z" fill="#4f5661" stroke="#1b1f24" stroke-width="2.2"/>
        <path d="M18 36h28l4 20H14l4-20z" fill="#3a404a" stroke="#1b1f24" stroke-width="2"/>
        <circle cx="26" cy="23" r="2.4" fill="#ff5e5e"/><circle cx="38" cy="23" r="2.4" fill="#ff5e5e"/>
        <path d="M27 31l5 4 5-4" fill="#e8e2d5" stroke="#1b1f24" stroke-width="1.5"/>
      `);

    case 'marauder':
      return wrap(`
        <path d="M14 56l4-24h28l4 24H14z" fill="#634029" stroke="#26160c" stroke-width="2.2"/>
        <rect x="21" y="12" width="22" height="19" rx="4" fill="#6e7780" stroke="#22262b" stroke-width="2.2"/>
        <path d="M14 14l7 4M50 14l-7 4" stroke="#dcd3c2" stroke-width="3.5" stroke-linecap="round"/>
        <rect x="25" y="20" width="14" height="3.5" fill="#ff6647"/>
        <path d="M8 24c0-7 8-10 11-5l-4 14-7-3v-6z" fill="#95a0ab" stroke="#22262b" stroke-width="2"/>
      `);

    case 'cultist':
      return wrap(`
        <path d="M16 56l6-28h20l6 28H16z" fill="#6e1e2b" stroke="#29090f" stroke-width="2.2"/>
        <path d="M20 26l12-18 12 18c-5 4-19 4-24 0z" fill="#4a121c" stroke="#d4a24c" stroke-width="1.8"/>
        <circle cx="28" cy="23" r="2.2" fill="#ff8f66"/><circle cx="36" cy="23" r="2.2" fill="#ff8f66"/>
        <path d="M51 56V20" stroke="#3b261d" stroke-width="3"/>
        <circle cx="51" cy="17" r="5" fill="#d9385a" stroke="#ffb3c1" stroke-width="1.6"/>
      `);

    case 'gargoyle':
      return wrap(`
        <path d="M6 18l16 8-4 14-12-8zM58 18l-16 8 4 14 12-8z" fill="#5e656e" stroke="#23272b" stroke-width="2"/>
        <path d="M20 56l3-24h18l3 24H20z" fill="#777f8a" stroke="#23272b" stroke-width="2.2"/>
        <path d="M21 16l4-7 7 5 7-5 4 7v14H21V16z" fill="#89929e" stroke="#23272b" stroke-width="2"/>
        <circle cx="27" cy="22" r="2.2" fill="#ffd25a"/><circle cx="37" cy="22" r="2.2" fill="#ffd25a"/>
      `);

    case 'wraith':
      return wrap(`
        <path d="M18 55c4-7 2-18 6-27 3-7 13-7 16 0 4 9 2 20 6 27l-7-4-7 5-7-5-7 4z" fill="#3b4d5e" stroke="#18222b" stroke-width="2.2"/>
        <path d="M22 25c0-8 4-13 10-13s10 5 10 13v8H22v-8z" fill="#212d38"/>
        <circle cx="28" cy="23" r="2.5" fill="#7dffce"/><circle cx="36" cy="23" r="2.5" fill="#7dffce"/>
      `);

    case 'dread_knight':
      return wrap(`
        <path d="M17 12l6-7 4 7M47 12l-6-7-4 7" fill="#a83232" stroke="#360d0d" stroke-width="1.8"/>
        <path d="M14 56l5-24h26l5 24H14z" fill="#2d2b36" stroke="#c24242" stroke-width="2.2"/>
        <rect x="21" y="13" width="22" height="18" rx="4" fill="#3a3847" stroke="#c24242" stroke-width="2"/>
        <rect x="25" y="20" width="14" height="3" fill="#ff3b3b"/>
        <path d="M8 10h6v32H8z" fill="#7a8491" stroke="#181920" stroke-width="2"/>
      `);

    case 'wyvern':
    case 'boss_dragon':
      return wrap(`
        <path d="M4 16l22 10-6 18L4 32zM60 16L38 26l6 18 16-12z" fill="#781d18" stroke="#2e0907" stroke-width="2.2"/>
        <path d="M20 56l5-26h14l5 26H20z" fill="#9c2920" stroke="#2e0907" stroke-width="2.2"/>
        <path d="M27 32h10l-2 22h-6z" fill="#d98a3b"/>
        <path d="M18 12l6-8 4 8h8l4-8 6 8-4 17H22L18 12z" fill="#b83227" stroke="#ffd269" stroke-width="2"/>
        <circle cx="27" cy="20" r="2.5" fill="#ffe159"/><circle cx="37" cy="20" r="2.5" fill="#ffe159"/>
        <path d="M27 28l5 3 5-3" stroke="#ffe7a8" stroke-width="2"/>
      `);

    case 'boss_lich':
      return wrap(`
        <circle cx="32" cy="22" r="18" fill="#5e3294" opacity="0.28"/>
        <path d="M13 56l7-30h24l7 30H13z" fill="#2c2247" stroke="#b388ff" stroke-width="2.2"/>
        <path d="M22 14l4-8 6 5 6-5 4 8v16H22V14z" fill="#d8d2e8" stroke="#423266" stroke-width="2.2"/>
        <circle cx="27" cy="21" r="2.8" fill="#63f5ff"/><circle cx="37" cy="21" r="2.8" fill="#63f5ff"/>
        <path d="M53 56V14" stroke="#4a3869" stroke-width="3.2"/>
        <circle cx="53" cy="12" r="5.5" fill="#63f5ff" stroke="#ffffff" stroke-width="1.6"/>
      `);

    case 'boss_emperor':
      return wrap(`
        <path d="M10 24l12 6-4 26h28l-4-26 12-6-6 32H16z" fill="#701c1c" stroke="#d4a24c" stroke-width="2"/>
        <path d="M18 13l5-8 9 6 9-6 5 8v17H18V13z" fill="#d4a24c" stroke="#593a0b" stroke-width="2.2"/>
        <rect x="24" y="21" width="16" height="3.5" fill="#ff4747"/>
        <path d="M7 8h6v38H7z" fill="#ffd97d" stroke="#593a0b" stroke-width="2"/>
      `);

    case 'COMBAT':
      return wrap(`
        <path d="M12 50L48 14M40 12h10v10M52 50L16 14M14 22V12h10" stroke="#d95b5b" stroke-width="4.5" stroke-linecap="round"/>
        <circle cx="32" cy="32" r="7" fill="#541f1f" stroke="#d4a24c" stroke-width="2"/>
      `);

    case 'CAMP':
      return wrap(`
        <path d="M32 10c7 9 12 15 12 23a12 12 0 1 1-24 0c0-8 5-14 12-23z" fill="#e67e35" stroke="#852b0e" stroke-width="2"/>
        <path d="M32 20c4 5 6 9 6 14a6 6 0 1 1-12 0c0-5 2-9 6-14z" fill="#ffe169"/>
        <path d="M12 52l40-8M12 44l40 8" stroke="#7d4b24" stroke-width="5" stroke-linecap="round"/>
      `);

    case 'EVENT':
      return wrap(`
        <path d="M32 10v42M16 18h32M22 52h20" stroke="#d4a24c" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M10 34l6-16 6 16a6 6 0 0 1-12 0zM42 34l6-16 6 16a6 6 0 0 1-12 0z" fill="#70489c" stroke="#d9bdf7" stroke-width="2"/>
      `);

    default:
      return wrap(`
        <circle cx="32" cy="32" r="20" fill="#634832" stroke="#d4a24c" stroke-width="2.5"/>
        <circle cx="25" cy="28" r="3" fill="#ff7373"/><circle cx="39" cy="28" r="3" fill="#ff7373"/>
      `);
  }
}

export function isFloatingSprite(iconKind) {
  return ['wraith', 'wyvern', 'boss_dragon', 'boss_lich'].includes(iconKind);
}

/**
 * Illustrated panoramic biome backdrops with CSS-animated fireflies, torches, mist & embers.
 */
export function getBiomeSceneSvg(biomeId) {
  const wrap = (inner) =>
    `<svg class="biome-svg" viewBox="0 0 800 210" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  switch (biomeId) {
    case 'plains':
      return wrap(`
        <defs>
          <linearGradient id="skyPlains" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1b2c4c"/>
            <stop offset="55%" stop-color="#6b4e4e"/>
            <stop offset="100%" stop-color="#c98548"/>
          </linearGradient>
        </defs>
        <rect width="800" height="210" fill="url(#skyPlains)"/>
        <circle cx="580" cy="64" r="30" fill="#ffe18c" opacity="0.9"/>
        <circle cx="580" cy="64" r="52" fill="#ffbb5c" opacity="0.22"/>
        <path d="M0 140 L120 96 L245 135 L410 88 L590 132 L720 94 L800 128 L800 210 L0 210 Z" fill="#2c3342"/>
        <path d="M0 155 Q220 132 450 150 T800 142 L800 210 L0 210 Z" fill="#274a23"/>
        <rect y="162" width="800" height="48" fill="#356327"/>
        <ellipse class="anim-mist" cx="260" cy="48" rx="75" ry="14" fill="#ffe4bf" opacity="0.24"/>
        <circle class="anim-firefly" cx="160" cy="145" r="2.5" fill="#ffe587"/>
        <circle class="anim-firefly ff-delay-1" cx="460" cy="138" r="2.5" fill="#ffe587"/>
        <circle class="anim-firefly ff-delay-2" cx="670" cy="152" r="2.5" fill="#ffe587"/>
      `);

    case 'forest':
      return wrap(`
        <defs>
          <linearGradient id="skyForest" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0b1b15"/>
            <stop offset="100%" stop-color="#193827"/>
          </linearGradient>
        </defs>
        <rect width="800" height="210" fill="url(#skyForest)"/>
        <circle cx="640" cy="48" r="26" fill="#dfeedc" opacity="0.88"/>
        <circle cx="640" cy="48" r="44" fill="#9bd8a6" opacity="0.16"/>
        <!-- Moonbeams -->
        <polygon points="620,60 440,210 530,210" fill="#8fd69f" opacity="0.08"/>
        <polygon points="650,60 680,210 770,210" fill="#8fd69f" opacity="0.06"/>
        <!-- Distant Hills & Pines -->
        <path d="M0 155 Q180 110 380 150 T800 140 L800 210 L0 210 Z" fill="#12291c"/>
        <path d="M60 155 L90 78 L120 155 Z M150 158 L178 90 L205 158 Z M460 152 L495 72 L530 152 Z M700 152 L735 76 L770 152 Z" fill="#0f2318"/>
        <!-- Ancient Oaks -->
        <path d="M0 0 H55 L42 210 H0 Z" fill="#231912"/>
        <path d="M745 0 H800 V210 H756 Z" fill="#231912"/>
        <circle cx="52" cy="36" r="56" fill="#183d25"/>
        <circle cx="745" cy="40" r="62" fill="#183d25"/>
        <path d="M220 210 V95 L252 60 M220 120 L185 88" stroke="#2c2017" stroke-width="14" fill="none" stroke-linecap="round"/>
        <circle cx="222" cy="58" r="58" fill="#1d492d" opacity="0.9"/>
        <!-- Mossy Ground & Stones -->
        <rect y="168" width="800" height="42" fill="#17331e"/>
        <ellipse cx="320" cy="186" rx="28" ry="10" fill="#3a4c42"/>
        <ellipse cx="520" cy="192" rx="34" ry="9" fill="#35463c"/>
        <!-- Fireflies -->
        <circle class="anim-firefly" cx="140" cy="130" r="3" fill="#e6ff7d"/>
        <circle class="anim-firefly ff-delay-1" cx="290" cy="105" r="2.5" fill="#b4ff8a"/>
        <circle class="anim-firefly ff-delay-2" cx="445" cy="140" r="3" fill="#e6ff7d"/>
        <circle class="anim-firefly ff-delay-1" cx="595" cy="115" r="2.5" fill="#c7ff99"/>
        <circle class="anim-firefly ff-delay-2" cx="690" cy="148" r="3" fill="#e6ff7d"/>
      `);

    case 'dungeon':
      return wrap(`
        <rect width="800" height="210" fill="#141118"/>
        <!-- Stone Masonry -->
        <g stroke="#2a2430" stroke-width="2" fill="#1c1822">
          <rect x="0" y="0" width="800" height="165"/>
          <path d="M0 40 H800 M0 82 H800 M0 124 H800"/>
          <path d="M90 0 V40 M230 0 V40 M410 0 V40 M570 0 V40 M710 0 V40"/>
          <path d="M160 40 V82 M320 40 V82 M490 40 V82 M640 40 V82"/>
        </g>
        <!-- Vault Arches & Iron Portcullis -->
        <path d="M70 165 V68 A95 62 0 0 1 260 68 V165 Z" fill="#0d0b10" stroke="#3d3647" stroke-width="6"/>
        <path d="M540 165 V68 A95 62 0 0 1 730 68 V165 Z" fill="#0d0b10" stroke="#3d3647" stroke-width="6"/>
        <path d="M330 165 V55 A70 50 0 0 1 470 55 V165 Z" fill="#09080c" stroke="#474052" stroke-width="6"/>
        <g stroke="#505864" stroke-width="3">
          <path d="M355 40 V165 M380 28 V165 M405 26 V165 M430 30 V165 M450 46 V165"/>
          <path d="M330 78 H470 M330 122 H470"/>
        </g>
        <!-- Wall Torches with Glow -->
        <circle class="anim-flicker" cx="295" cy="78" r="46" fill="#ff8c2b" opacity="0.16"/>
        <circle class="anim-flicker" cx="505" cy="78" r="46" fill="#ff8c2b" opacity="0.16"/>
        <rect x="291" y="88" width="8" height="24" fill="#4f351e"/>
        <rect x="501" y="88" width="8" height="24" fill="#4f351e"/>
        <path class="anim-flicker" d="M295 62c8 10 9 19 0 27c-9-8-8-17 0-27z" fill="#ff8822"/>
        <path class="anim-flicker" d="M295 70c4 6 4 11 0 17c-4-6-4-11 0-17z" fill="#ffe169"/>
        <path class="anim-flicker" d="M505 62c8 10 9 19 0 27c-9-8-8-17 0-27z" fill="#ff8822"/>
        <path class="anim-flicker" d="M505 70c4 6 4 11 0 17c-4-6-4-11 0-17z" fill="#ffe169"/>
        <!-- Flagstone Floor -->
        <rect y="165" width="800" height="45" fill="#231f29"/>
        <path d="M0 185 H800 M120 165 L100 210 M280 165 L270 210 M460 165 L470 210 M660 165 L680 210" stroke="#36303f" stroke-width="2"/>
      `);

    case 'ruins':
      return wrap(`
        <defs>
          <linearGradient id="skyRuins" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0d1324"/>
            <stop offset="100%" stop-color="#1e2b47"/>
          </linearGradient>
        </defs>
        <rect width="800" height="210" fill="url(#skyRuins)"/>
        <circle cx="400" cy="56" r="30" fill="#cddcff" opacity="0.82"/>
        <!-- Broken Gothic Arches -->
        <path d="M80 172 V50 Q120 20 155 58 V172 Z" fill="#272e3d" stroke="#445069" stroke-width="3"/>
        <path d="M645 172 V42 Q695 16 730 62 V172 Z" fill="#272e3d" stroke="#445069" stroke-width="3"/>
        <!-- Shattered Pillars & Stained Glass -->
        <rect x="260" y="96" width="30" height="76" fill="#2f3747"/>
        <polygon points="260,96 275,78 290,96" fill="#2f3747"/>
        <rect x="510" y="84" width="32" height="88" fill="#2f3747"/>
        <circle cx="400" cy="112" r="38" fill="#151b2b" stroke="#4d5c78" stroke-width="5"/>
        <circle cx="400" cy="112" r="26" fill="#3a63a8" opacity="0.45"/>
        <path d="M400 84 V140 M372 112 H428" stroke="#6d82a8" stroke-width="2"/>
        <!-- Mist & Cobblestone -->
        <rect y="170" width="800" height="40" fill="#1c2230"/>
        <ellipse class="anim-mist" cx="220" cy="176" rx="150" ry="14" fill="#9fb9eb" opacity="0.16"/>
        <ellipse class="anim-mist ff-delay-1" cx="590" cy="180" rx="170" ry="14" fill="#9fb9eb" opacity="0.14"/>
      `);

    case 'swamp':
      return wrap(`
        <rect width="800" height="210" fill="#101c18"/>
        <circle cx="170" cy="48" r="22" fill="#b4d9bd" opacity="0.65"/>
        <!-- Twisted Willows -->
        <path d="M90 175 C95 110 60 80 40 30 M90 110 C125 90 140 60 165 40" stroke="#242b22" stroke-width="14" fill="none"/>
        <path d="M680 175 C675 100 715 70 740 25 M680 110 C640 85 615 55 590 42" stroke="#242b22" stroke-width="14" fill="none"/>
        <!-- Hanging Moss -->
        <path d="M55 52 V108 M115 62 V124 M150 48 V105 M620 55 V118 M705 55 V122" stroke="#365c42" stroke-width="4" stroke-dasharray="4 3"/>
        <!-- Witch Lantern Posts -->
        <path d="M300 175 V105 H322 M515 175 V110 H495" stroke="#382c21" stroke-width="5" fill="none"/>
        <circle class="anim-flicker" cx="322" cy="116" r="24" fill="#6effb4" opacity="0.2"/>
        <circle class="anim-flicker" cx="322" cy="116" r="6" fill="#9affcb"/>
        <circle class="anim-flicker" cx="495" cy="121" r="24" fill="#c07dff" opacity="0.2"/>
        <circle class="anim-flicker" cx="495" cy="121" r="6" fill="#dfbdff"/>
        <!-- Bog Waters -->
        <rect y="170" width="800" height="40" fill="#172c24"/>
        <ellipse class="anim-mist" cx="400" cy="184" rx="220" ry="12" fill="#63b88f" opacity="0.16"/>
      `);

    case 'tavern':
      return wrap(`
        <rect width="800" height="210" fill="#24160d"/>
        <!-- Timber Beams -->
        <rect x="0" y="0" width="800" height="20" fill="#3b2314"/>
        <rect x="75" y="0" width="20" height="170" fill="#3b2314"/>
        <rect x="705" y="0" width="20" height="170" fill="#3b2314"/>
        <!-- Stone Hearth Fireplace -->
        <path d="M310 170 V78 Q400 48 490 78 V170 Z" fill="#473c35" stroke="#241c17" stroke-width="4"/>
        <rect x="342" y="102" width="116" height="68" rx="18" fill="#140c08"/>
        <circle class="anim-flicker" cx="400" cy="142" r="62" fill="#ff942b" opacity="0.22"/>
        <path class="anim-flicker" d="M372 168 C372 132 390 112 400 102 C412 118 428 134 428 168 Z" fill="#e85b1c"/>
        <path class="anim-flicker" d="M385 168 C387 142 396 128 400 120 C407 132 415 144 415 168 Z" fill="#ffd95e"/>
        <!-- Hanging Lanterns & Ale Barrels -->
        <path d="M200 20 V68 M600 20 V68" stroke="#5e646b" stroke-width="3"/>
        <circle class="anim-flicker" cx="200" cy="76" r="14" fill="#ffc44d" opacity="0.75"/>
        <circle class="anim-flicker" cx="600" cy="76" r="14" fill="#ffc44d" opacity="0.75"/>
        <rect x="130" y="128" width="54" height="42" rx="6" fill="#59351c" stroke="#2b1709" stroke-width="2"/>
        <rect x="615" y="128" width="54" height="42" rx="6" fill="#59351c" stroke="#2b1709" stroke-width="2"/>
        <!-- Warm Plank Floor -->
        <rect y="170" width="800" height="40" fill="#342012"/>
      `);

    case 'boss':
    default:
      return wrap(`
        <defs>
          <linearGradient id="skyBoss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1f080a"/>
            <stop offset="100%" stop-color="#3c1111"/>
          </linearGradient>
        </defs>
        <rect width="800" height="210" fill="url(#skyBoss)"/>
        <!-- Blood Moon -->
        <circle cx="400" cy="64" r="42" fill="#c93636" opacity="0.82"/>
        <circle cx="400" cy="64" r="64" fill="#ff4747" opacity="0.16"/>
        <!-- Jagged Obsidian Pillars -->
        <polygon points="40,175 65,30 110,45 120,175" fill="#170b0d" stroke="#47181c" stroke-width="2"/>
        <polygon points="180,175 198,65 232,75 245,175" fill="#1c0d10"/>
        <polygon points="555,175 568,75 602,65 620,175" fill="#1c0d10"/>
        <polygon points="680,175 690,45 735,30 760,175" fill="#170b0d" stroke="#47181c" stroke-width="2"/>
        <!-- Lava Cracks on Floor -->
        <rect y="170" width="800" height="40" fill="#1b0d0e"/>
        <path d="M80 185 L210 176 L350 194 L500 178 L710 192" stroke="#ff6326" stroke-width="4" fill="none"/>
        <!-- Rising Cinders -->
        <circle class="anim-ember" cx="150" cy="160" r="3" fill="#ff9e3d"/>
        <circle class="anim-ember ff-delay-1" cx="310" cy="175" r="2.5" fill="#ff5e2b"/>
        <circle class="anim-ember ff-delay-2" cx="490" cy="165" r="3" fill="#ffd257"/>
        <circle class="anim-ember ff-delay-1" cx="650" cy="170" r="2.5" fill="#ff7c36"/>
      `);
  }
}
