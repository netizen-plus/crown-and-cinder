/**
 * Persistent WebGL fragment-shader biome renderer + 2D particle/VFX overlay.
 * Reuses a single WebGL context across renders to prevent context exhaustion.
 */
const BIOME_INDEX = {
  plains: 0.0,
  forest: 1.0,
  dungeon: 2.0,
  ruins: 3.0,
  swamp: 4.0,
  tavern: 5.0,
  boss: 6.0
};

const VERT_SRC = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_biome;
uniform float u_flash;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / max(u_res.y, 1.0);
  float horizon = 0.44;
  vec3 col = vec3(0.08, 0.06, 0.05);

  if (u_biome < 0.5) {
    // === 0: PLAINS (Emerald Wind-Plains) ===
    vec3 skyTop = vec3(0.11, 0.17, 0.31);
    vec3 skyMid = vec3(0.36, 0.32, 0.34);
    vec3 skyHor = vec3(0.76, 0.52, 0.28);
    vec3 sky = mix(skyHor, mix(skyMid, skyTop, smoothstep(0.55, 1.0, uv.y)), smoothstep(horizon, 0.95, uv.y));

    // Setting golden sun
    vec2 sunPos = vec2(0.72 * aspect, 0.66);
    float dSun = length(vec2(uv.x * aspect, uv.y) - sunPos);
    sky += vec3(1.0, 0.72, 0.32) * exp(-dSun * 6.5) * 0.75;
    sky += vec3(1.0, 0.9, 0.65) * smoothstep(0.075, 0.045, dSun) * 0.7;

    // Drifting clouds
    float cl = fbm(vec2(uv.x * 3.8 - u_time * 0.04, uv.y * 5.0));
    sky = mix(sky, vec3(0.88, 0.72, 0.54), smoothstep(0.54, 0.8, cl) * smoothstep(0.45, 0.75, uv.y) * 0.38);

    // Distant mountains & rolling hills
    float mtn = horizon + 0.09 + 0.07 * sin(uv.x * 5.2 + 0.4) + 0.04 * fbm(vec2(uv.x * 9.0, 1.2));
    float hill = horizon + 0.02 + 0.03 * sin(uv.x * 4.0 + 2.1);
    if (uv.y < mtn && uv.y >= hill) sky = vec3(0.16, 0.20, 0.25);

    if (uv.y < horizon + 0.025) {
      float depth = max(0.03, (horizon + 0.03) - uv.y);
      float wx = (uv.x - 0.5) / depth;
      float wz = 1.0 / depth;
      float wave = sin(wx * 2.2 + wz * 0.6 - u_time * 2.4) * 0.5 + 0.5;
      float patchN = fbm(vec2(wx * 0.8, wz * 0.35));
      vec3 grassDark = vec3(0.08, 0.20, 0.09);
      vec3 grassLight = vec3(0.22, 0.37, 0.14);
      vec3 ground = mix(grassDark, grassLight, 0.35 + 0.45 * patchN + 0.2 * wave);
      // Warm sun reflection on grass
      ground += vec3(0.25, 0.17, 0.05) * smoothstep(0.45, 0.0, abs(uv.x - 0.72)) * (1.0 - depth * 1.4);
      col = mix(ground, vec3(0.55, 0.42, 0.24), smoothstep(0.08, 0.0, depth) * 0.45);
    } else {
      col = sky;
    }
  } else if (u_biome < 1.5) {
    // === 1: FOREST (Whispering Eldergrove) ===
    vec3 sky = mix(vec3(0.08, 0.20, 0.14), vec3(0.03, 0.08, 0.07), smoothstep(horizon, 1.0, uv.y));
    vec2 moonPos = vec2(0.76 * aspect, 0.76);
    float dMoon = length(vec2(uv.x * aspect, uv.y) - moonPos);
    sky += vec3(0.65, 0.92, 0.75) * exp(-dMoon * 8.0) * 0.55;
    sky += vec3(0.88, 0.98, 0.9) * smoothstep(0.055, 0.04, dMoon);

    // Volumetric moonbeams
    float beam1 = smoothstep(0.22, 0.0, abs((uv.x - 0.72) + (uv.y - 0.76) * 0.45));
    float beam2 = smoothstep(0.18, 0.0, abs((uv.x - 0.38) + (uv.y - 0.85) * 0.45));
    sky += vec3(0.26, 0.55, 0.36) * (beam1 * 0.16 + beam2 * 0.11);

    // Tree silhouettes
    float treeBand = fbm(vec2(uv.x * 16.0, 2.0));
    float canopy = smoothstep(0.46, 0.54, treeBand);
    if (uv.y > horizon && uv.y < 0.85) {
      sky = mix(sky, vec3(0.04, 0.10, 0.06), canopy * 0.65);
    }

    if (uv.y < horizon) {
      float depth = max(0.03, horizon - uv.y);
      float wx = (uv.x - 0.5) / depth;
      float wz = 1.0 / depth;
      float moss = fbm(vec2(wx * 1.4, wz * 0.4));
      vec3 floorCol = mix(vec3(0.05, 0.13, 0.07), vec3(0.13, 0.27, 0.13), moss);
      floorCol += vec3(0.12, 0.26, 0.16) * beam1 * 0.55;
      col = mix(floorCol, vec3(0.09, 0.19, 0.14), smoothstep(0.08, 0.0, depth) * 0.55);
    } else {
      col = sky;
    }
  } else if (u_biome < 2.5) {
    // === 2: DUNGEON (Catacombs of Irondeep) ===
    float flicker = 0.88 + 0.12 * sin(u_time * 8.5) * cos(u_time * 5.1);
    vec2 t1 = vec2(0.26 * aspect, 0.62);
    vec2 t2 = vec2(0.74 * aspect, 0.62);
    vec2 pA = vec2(uv.x * aspect, uv.y);
    float g1 = exp(-length(pA - t1) * 4.2) * flicker;
    float g2 = exp(-length(pA - t2) * 4.2) * flicker;

    if (uv.y >= horizon) {
      // Stone masonry bricks
      vec2 brick = vec2(uv.x * 12.0 + step(1.0, mod(uv.y * 10.0, 2.0)) * 0.5, uv.y * 10.0);
      float mortar = smoothstep(0.04, 0.09, fract(brick.x)) * smoothstep(0.05, 0.11, fract(brick.y));
      float stoneN = hash(floor(brick)) * 0.06;
      vec3 wall = mix(vec3(0.05, 0.04, 0.06), vec3(0.14, 0.12, 0.16) + stoneN, mortar);

      // Center iron gate arch
      float archDist = length(vec2((uv.x - 0.5) * 1.6, max(0.0, uv.y - 0.55)));
      if (archDist < 0.24 && uv.y > horizon) {
        float bars = smoothstep(0.12, 0.2, abs(fract(uv.x * 28.0) - 0.5));
        wall = mix(vec3(0.03, 0.03, 0.04), vec3(0.16, 0.17, 0.20), 1.0 - bars);
      }

      wall += vec3(0.95, 0.45, 0.12) * (g1 + g2) * 0.65;
      // Torch flame cores
      float f1 = exp(-length((pA - t1) * vec2(2.2, 1.2)) * 22.0);
      float f2 = exp(-length((pA - t2) * vec2(2.2, 1.2)) * 22.0);
      wall += vec3(1.0, 0.85, 0.35) * (f1 + f2) * 1.2;
      col = wall;
    } else {
      float depth = max(0.03, horizon - uv.y);
      float wx = (uv.x - 0.5) / depth;
      float wz = 1.0 / depth;
      float tile = smoothstep(0.04, 0.09, fract(wx * 1.2)) * smoothstep(0.04, 0.09, fract(wz * 0.35));
      vec3 flr = mix(vec3(0.05, 0.04, 0.06), vec3(0.16, 0.14, 0.18), tile);
      float flrGlow = exp(-abs(uv.x - 0.26) * 4.5) + exp(-abs(uv.x - 0.74) * 4.5);
      flr += vec3(0.6, 0.28, 0.08) * flrGlow * flicker * (0.45 - depth);
      col = mix(flr, vec3(0.04, 0.03, 0.05), smoothstep(0.06, 0.0, depth) * 0.65);
    }
  } else if (u_biome < 3.5) {
    // === 3: RUINS (Sunken Abbey) ===
    vec3 sky = mix(vec3(0.12, 0.17, 0.29), vec3(0.04, 0.06, 0.13), smoothstep(horizon, 1.0, uv.y));
    vec2 moon = vec2(0.5 * aspect, 0.72);
    float dM = length(vec2(uv.x * aspect, uv.y) - moon);
    sky += vec3(0.55, 0.72, 1.0) * exp(-dM * 7.0) * 0.6;
    sky += vec3(0.85, 0.92, 1.0) * smoothstep(0.06, 0.045, dM);

    // Pillars on left and right
    float pillars = step(abs(uv.x - 0.16), 0.04) + step(abs(uv.x - 0.84), 0.04);
    if (uv.y > horizon && uv.y < 0.88 && pillars > 0.5) {
      sky = vec3(0.14, 0.16, 0.22);
    }

    if (uv.y < horizon) {
      float depth = max(0.03, horizon - uv.y);
      float wx = (uv.x - 0.5) / depth;
      float wz = 1.0 / depth;
      float cobble = smoothstep(0.07, 0.14, fract(wx * 1.8)) * smoothstep(0.07, 0.14, fract(wz * 0.45));
      float mist = fbm(vec2(uv.x * 4.0 + u_time * 0.08, uv.y * 6.0));
      vec3 flr = mix(vec3(0.08, 0.10, 0.15), vec3(0.18, 0.21, 0.28), cobble);
      flr = mix(flr, vec3(0.45, 0.58, 0.82), mist * 0.28);
      col = flr;
    } else {
      col = sky;
    }
  } else if (u_biome < 4.5) {
    // === 4: SWAMP (Blightmire Fen) ===
    vec3 sky = mix(vec3(0.09, 0.19, 0.16), vec3(0.04, 0.08, 0.08), smoothstep(horizon, 1.0, uv.y));
    float wisp1 = exp(-length(vec2(uv.x * aspect, uv.y) - vec2(0.32 * aspect, 0.58 + 0.03 * sin(u_time * 1.7))) * 9.0);
    float wisp2 = exp(-length(vec2(uv.x * aspect, uv.y) - vec2(0.68 * aspect, 0.56 + 0.03 * cos(u_time * 1.4))) * 9.0);
    sky += vec3(0.3, 0.95, 0.65) * wisp1 * 0.75 + vec3(0.65, 0.4, 0.95) * wisp2 * 0.75;

    if (uv.y < horizon) {
      float depth = max(0.03, horizon - uv.y);
      float wz = 1.0 / depth;
      float ripple = sin(wz * 1.2 - u_time * 2.0 + sin(uv.x * 18.0)) * 0.5 + 0.5;
      float fog = fbm(vec2(uv.x * 5.0 - u_time * 0.06, uv.y * 8.0));
      vec3 bog = mix(vec3(0.05, 0.11, 0.09), vec3(0.11, 0.24, 0.19), ripple * 0.45 + fog * 0.45);
      bog += vec3(0.15, 0.5, 0.35) * exp(-abs(uv.x - 0.32) * 5.0) * 0.35;
      bog += vec3(0.35, 0.2, 0.5) * exp(-abs(uv.x - 0.68) * 5.0) * 0.35;
      col = bog;
    } else {
      col = sky;
    }
  } else if (u_biome < 5.5) {
    // === 5: TAVERN (Golden Flagon Inn) ===
    float hearthGlow = 0.86 + 0.14 * sin(u_time * 7.5);
    if (uv.y >= horizon) {
      vec3 timber = vec3(0.16, 0.09, 0.05);
      float beam = step(abs(fract(uv.x * 4.0) - 0.5), 0.04) + step(uv.y, 0.93) * step(0.88, uv.y);
      vec3 wall = mix(vec3(0.22, 0.14, 0.09), timber, min(1.0, beam));
      float fire = exp(-length(vec2(uv.x - 0.5, uv.y - 0.52) * vec2(1.4, 2.0)) * 4.5) * hearthGlow;
      wall += vec3(1.0, 0.52, 0.14) * fire * 0.85;
      col = wall;
    } else {
      float depth = max(0.03, horizon - uv.y);
      float wx = (uv.x - 0.5) / depth;
      float plank = smoothstep(0.04, 0.08, fract(wx * 1.4));
      vec3 wood = mix(vec3(0.11, 0.06, 0.03), vec3(0.24, 0.14, 0.07), plank);
      wood += vec3(0.55, 0.28, 0.08) * exp(-abs(uv.x - 0.5) * 3.2) * hearthGlow * (0.5 - depth);
      col = wood;
    }
  } else {
    // === 6: BOSS (Throne of Ash & Cinder) ===
    vec3 sky = mix(vec3(0.32, 0.07, 0.07), vec3(0.08, 0.02, 0.03), smoothstep(horizon, 1.0, uv.y));
    vec2 moon = vec2(0.5 * aspect, 0.72);
    float dM = length(vec2(uv.x * aspect, uv.y) - moon);
    sky += vec3(1.0, 0.22, 0.15) * exp(-dM * 5.2) * 0.75;
    sky += vec3(1.0, 0.55, 0.4) * smoothstep(0.085, 0.065, dM) * 0.9;

    // Jagged obsidian spires
    float spires = step(abs(uv.x - 0.14), 0.045) + step(abs(uv.x - 0.86), 0.045);
    if (uv.y > horizon && uv.y < 0.9 && spires > 0.5) sky = vec3(0.06, 0.02, 0.03);

    if (uv.y < horizon) {
      float depth = max(0.03, horizon - uv.y);
      float wx = (uv.x - 0.5) / depth;
      float wz = 1.0 / depth;
      float crackN = fbm(vec2(wx * 1.1, wz * 0.45));
      float lava = smoothstep(0.07, 0.0, abs(crackN - 0.5)) * (0.75 + 0.25 * sin(u_time * 3.0 + wz));
      vec3 basalt = mix(vec3(0.07, 0.03, 0.04), vec3(0.14, 0.07, 0.07), crackN);
      basalt += vec3(1.0, 0.36, 0.08) * lava * 1.3;
      col = basalt;
    } else {
      col = sky;
    }
  }

  // Vignette + combat impact flash
  float vig = smoothstep(1.15, 0.35, length(uv - vec2(0.5, 0.5)));
  col *= (0.72 + 0.28 * vig);
  col += vec3(0.35, 0.26, 0.18) * u_flash;
  gl_FragColor = vec4(col, 1.0);
}
`;

export class WebGLBattleScene {
  constructor() {
    this.hostEl = null;
    this.bgCanvas = document.createElement('canvas');
    this.fxCanvas = document.createElement('canvas');
    this.bgCanvas.className = 'webgl-bg-canvas';
    this.fxCanvas.className = 'webgl-fx-canvas';

    this.gl = null;
    this.program = null;
    this.uniforms = {};
    this.fxCtx = this.fxCanvas.getContext('2d');

    this.biomeId = 'plains';
    this.flash = 0.0;
    this.particles = [];
    this.ambient = [];
    this.slashes = [];
    this.rafId = null;
    this.startTime = performance.now();
    this.lastFrame = this.startTime;

    this.initWebGL();
    this.seedAmbient();
  }

  initWebGL() {
    const gl =
      this.bgCanvas.getContext('webgl', { alpha: false, antialias: false }) ||
      this.bgCanvas.getContext('experimental-webgl', { alpha: false });
    if (!gl) return;

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    this.gl = gl;
    this.program = prog;
    this.uniforms = {
      res: gl.getUniformLocation(prog, 'u_res'),
      time: gl.getUniformLocation(prog, 'u_time'),
      biome: gl.getUniformLocation(prog, 'u_biome'),
      flash: gl.getUniformLocation(prog, 'u_flash')
    };
  }

  mount(hostEl, biomeId) {
    if (!hostEl) return;
    if (this.biomeId !== biomeId) {
      this.biomeId = biomeId || 'plains';
      this.seedAmbient();
    }
    this.hostEl = hostEl;
    if (this.bgCanvas.parentNode !== hostEl) {
      hostEl.innerHTML = '';
      hostEl.appendChild(this.bgCanvas);
      hostEl.appendChild(this.fxCanvas);
    }
    this.resize();
    if (!this.rafId) {
      this.rafId = requestAnimationFrame((ts) => this.loop(ts));
    }
  }

  resize() {
    if (!this.hostEl) return;
    const w = Math.max(320, this.hostEl.clientWidth || 800);
    const h = Math.max(200, this.hostEl.clientHeight || 420);
    if (this.bgCanvas.width !== w || this.bgCanvas.height !== h) {
      this.bgCanvas.width = w;
      this.bgCanvas.height = h;
      this.fxCanvas.width = w;
      this.fxCanvas.height = h;
      if (this.gl) this.gl.viewport(0, 0, w, h);
    }
  }

  seedAmbient() {
    this.ambient = [];
    for (let i = 0; i < 32; i++) {
      this.ambient.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.04,
        vy: -0.02 - Math.random() * 0.04,
        r: 1.5 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  triggerVfx(kind, normX = 0.72, normY = 0.62) {
    const palette = {
      physical: ['#ffe39c', '#ffffff', '#ff9e59'],
      magic: ['#66d4ff', '#d4f5ff', '#7d7dff'],
      fire: ['#ff6a2b', '#ffd059', '#ff3b1f'],
      nature: ['#69f093', '#c8ffd8', '#38b55d'],
      heal: ['#6ef79f', '#fff3a8', '#b8ffd2'],
      shield: ['#75c3ff', '#ffe28a', '#d4ecff'],
      enemy: ['#ff4747', '#ff9c66', '#ffd1d1']
    };
    const cols = palette[kind] || palette.physical;
    this.flash = kind === 'heal' || kind === 'shield' ? 0.25 : 0.45;

    for (let i = 0; i < 24; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 0.08 + Math.random() * 0.26;
      this.particles.push({
        x: normX,
        y: normY,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 0.05,
        life: 0.55 + Math.random() * 0.4,
        maxLife: 0.95,
        r: 2.5 + Math.random() * 4.5,
        color: cols[i % cols.length]
      });
    }

    if (kind === 'physical' || kind === 'enemy' || kind === 'fire' || kind === 'magic') {
      this.slashes.push({
        x: normX,
        y: normY,
        life: 0.36,
        maxLife: 0.36,
        color: cols[0],
        angle: (Math.random() - 0.5) * 0.9 - 0.5
      });
    }
  }

  loop(ts) {
    const dt = Math.min(0.05, (ts - this.lastFrame) / 1000);
    this.lastFrame = ts;
    const elapsed = (ts - this.startTime) / 1000;

    if (this.hostEl && this.hostEl.isConnected) {
      this.resize();
      this.drawWebGL(elapsed);
      this.drawFxOverlay(dt, elapsed);
      this.flash = Math.max(0.0, this.flash - dt * 1.4);
    }

    this.rafId = requestAnimationFrame((nextTs) => this.loop(nextTs));
  }

  drawWebGL(elapsed) {
    if (this.gl && this.program) {
      const gl = this.gl;
      gl.useProgram(this.program);
      gl.uniform2f(this.uniforms.res, this.bgCanvas.width, this.bgCanvas.height);
      gl.uniform1f(this.uniforms.time, elapsed);
      gl.uniform1f(this.uniforms.biome, BIOME_INDEX[this.biomeId] ?? 0.0);
      gl.uniform1f(this.uniforms.flash, this.flash);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } else {
      // Graceful Canvas2D fallback if WebGL is disabled
      const ctx = this.bgCanvas.getContext('2d');
      if (!ctx) return;
      const w = this.bgCanvas.width;
      const h = this.bgCanvas.height;
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#182438');
      grad.addColorStop(0.55, '#3b3328');
      grad.addColorStop(1, '#19301a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  }

  drawFxOverlay(dt, elapsed) {
    const ctx = this.fxCtx;
    if (!ctx) return;
    const w = this.fxCanvas.width;
    const h = this.fxCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // Ambient biome motes
    const biomeColor =
      this.biomeId === 'plains'
        ? 'rgba(255, 224, 130, 0.65)'
        : this.biomeId === 'forest'
          ? 'rgba(170, 255, 145, 0.75)'
          : this.biomeId === 'swamp'
            ? 'rgba(120, 255, 195, 0.65)'
            : this.biomeId === 'ruins'
              ? 'rgba(175, 210, 255, 0.55)'
              : 'rgba(255, 155, 70, 0.72)';

    for (const m of this.ambient) {
      if (this.biomeId === 'plains') {
        m.x += 0.055 * dt;
        m.y += Math.sin(elapsed * 2.0 + m.phase) * 0.015 * dt;
      } else if (this.biomeId === 'forest' || this.biomeId === 'swamp') {
        m.x += Math.sin(elapsed * 1.2 + m.phase) * 0.025 * dt;
        m.y += Math.cos(elapsed * 1.4 + m.phase) * 0.02 * dt;
      } else {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
      }
      if (m.x > 1.05) m.x = -0.05;
      if (m.x < -0.05) m.x = 1.05;
      if (m.y < -0.05) m.y = 1.05;
      if (m.y > 1.05) m.y = -0.05;

      const alpha = 0.45 + 0.45 * Math.sin(elapsed * 3.0 + m.phase);
      ctx.globalAlpha = Math.max(0.15, alpha);
      ctx.fillStyle = biomeColor;
      ctx.beginPath();
      ctx.arc(m.x * w, m.y * h, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Combat slash arcs
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.slashes.splice(i, 1);
        continue;
      }
      const p = s.life / s.maxLife;
      ctx.save();
      ctx.translate(s.x * w, s.y * h);
      ctx.rotate(s.angle);
      ctx.globalAlpha = p;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 4 * p + 1;
      ctx.beginPath();
      ctx.arc(0, 0, 56 * (1.15 - p * 0.4), -0.9, 0.9);
      ctx.stroke();
      ctx.restore();
    }

    // Combat burst particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 0.25 * dt;
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x * w, pt.y * h, pt.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }
}

export const sceneRenderer = new WebGLBattleScene();
