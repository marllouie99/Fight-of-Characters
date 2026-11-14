// ═══════════════════════════════════════════════════════════════════════════
// MINECRAFT BLOCKY EXPLOSION RENDERER (Rule 35 Pre-Baked Offscreen Quads)
// Matches authentic Minecraft crescent smoke puffs, upper dark-grey smoke balls,
// scattered pixelated white starburst motes, and rising ember/flame flecks.
// Strictly zero per-frame pixel loops, zero shadowBlur, zero cobweb radial lines.
// ═══════════════════════════════════════════════════════════════════════════

const CRESCENT_STAGES = 8;
const SMOKE_STAGES = 4;
const STAR_VARIANTS = 3;

let _crescentCache = null;
let _darkSmokeCache = null;
let _starburstCache = null;
let _emberCache = null;

function _createOffscreenCanvas(w, h) {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

/**
 * Deterministic hash in [0, 1) for crisp, flicker-free pixel noise during one-time cache baking.
 */
function _pixelHash(x, y, seed) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

/**
 * Bakes 8 progressive Minecraft crescent smoke puff stages onto 40x40 offscreen canvases (20x20 grid, P=2).
 * Orientation in local sprite space: outer curved ridge faces -Y (upward / outward when rotated).
 */
function _bakeCrescentPuffs() {
  const P = 2;
  const grid = 20;
  const size = grid * P;
  const stages = [];

  for (let s = 0; s < CRESCENT_STAGES; s++) {
    const off = _createOffscreenCanvas(size, size);
    if (!off) {
      stages.push(null);
      continue;
    }
    const { canvas, ctx } = off;
    const t = s / (CRESCENT_STAGES - 1); // 0.0 -> 1.0
    const cx = 9.5;
    const cy = 9.5;
    const outerR = 8.8 - t * 0.4;
    // Inner bite starts tiny/absent at stage 0, then carves a curving crescent upward & asymmetrically
    const biteActive = s >= 1;
    const biteR = biteActive ? (2.6 + t * 5.8) : 0;
    const biteCx = cx + (s % 2 === 0 ? -0.9 : 0.9) * t * 1.4;
    const biteCy = cy + 3.4 - t * 2.2;

    for (let gy = 0; gy < grid; gy++) {
      for (let gx = 0; gx < grid; gx++) {
        const dx = gx - cx;
        const dy = gy - cy;
        const dOuter = Math.hypot(dx, dy);
        if (dOuter > outerR + (_pixelHash(gx, gy, s + 1) - 0.5) * 0.65) continue;

        if (biteActive) {
          const dBite = Math.hypot(gx - biteCx, gy - biteCy);
          const notchJitter = (_pixelHash(gx, gy, s + 19) - 0.5) * 0.8;
          if (dBite < biteR + notchJitter) continue;
        }

        // Break into detached pixel flecks in late dissipation stages (s >= 6)
        if (s >= 6 && _pixelHash(gx, gy, s + 53) < (s - 5) * 0.24) continue;

        // Shading gradient from bright white outer ridge (-Y) to medium/ash grey inner underside
        const ridgeBias = (-dy / Math.max(1, outerR)) * 0.5 + 0.5; // 1 near outer ridge, 0 near inner curl
        const shadeNoise = (_pixelHash(gx, gy, s + 91) - 0.5) * 0.16;
        const lum = ridgeBias - t * 0.36 + shadeNoise;

        if (lum > 0.68) ctx.fillStyle = '#FFFFFF';
        else if (lum > 0.46) ctx.fillStyle = '#F3F4F6';
        else if (lum > 0.28) ctx.fillStyle = '#D1D5DB';
        else if (lum > 0.12) ctx.fillStyle = '#9CA3AF';
        else ctx.fillStyle = '#737373';

        ctx.fillRect(gx * P, gy * P, P, P);
      }
    }
    stages.push(canvas);
  }
  return stages;
}

/**
 * Bakes 4 darker grey Minecraft rising smoke spheres (seen at top center of reference).
 */
function _bakeDarkSmokePuffs() {
  const P = 2;
  const grid = 14;
  const size = grid * P;
  const stages = [];

  for (let s = 0; s < SMOKE_STAGES; s++) {
    const off = _createOffscreenCanvas(size, size);
    if (!off) {
      stages.push(null);
      continue;
    }
    const { canvas, ctx } = off;
    const cx = 6.5;
    const cy = 6.5;
    const r = 5.6 - s * 0.45;
    const holeR = s >= 2 ? (1.4 + (s - 2) * 1.4) : 0;

    for (let gy = 0; gy < grid; gy++) {
      for (let gx = 0; gx < grid; gx++) {
        const dx = gx - cx;
        const dy = gy - cy;
        const d = Math.hypot(dx, dy);
        if (d > r + (_pixelHash(gx, gy, s + 101) - 0.5) * 0.5) continue;
        if (holeR > 0 && Math.hypot(gx - (cx - 0.5), gy - (cy + 0.8)) < holeR) continue;
        if (s === 3 && _pixelHash(gx, gy, 77) < 0.25) continue;

        const topLight = -dy / Math.max(1, r);
        if (topLight > 0.32 && s === 0) ctx.fillStyle = '#D4D4D8';
        else if (topLight > 0.05) ctx.fillStyle = '#A3A3A3';
        else if (topLight > -0.35) ctx.fillStyle = '#737373';
        else ctx.fillStyle = '#525252';

        ctx.fillRect(gx * P, gy * P, P, P);
      }
    }
    stages.push(canvas);
  }
  return stages;
}

/**
 * Bakes 3 chunky Minecraft white starburst / cross-spark motes onto 22x22 offscreen canvases.
 */
function _bakeStarburstSprites() {
  const P = 2;
  const patterns = [
    // Variant 0: Classic dense 9x9 Minecraft white explosion starburst
    [
      '....#....',
      '.#..#..#.',
      '..#.#.#..',
      '...###...',
      '#########',
      '...###...',
      '..#.#.#..',
      '.#..#..#.',
      '....#....'
    ],
    // Variant 1: Crisp 7x7 sharp cross star
    [
      '...#...',
      '.#.#.#.',
      '..###..',
      '###.###',
      '..###..',
      '.#.#.#.',
      '...#...'
    ],
    // Variant 2: Scattered burst fleck cluster
    [
      '..#...#..',
      '....#....',
      '.#..#..#.',
      '...###...',
      '#.##.##.#',
      '...###...',
      '.#..#..#.',
      '....#....',
      '..#...#..'
    ]
  ];

  return patterns.map((rows, vIdx) => {
    const g = rows.length;
    const size = g * P;
    const off = _createOffscreenCanvas(size, size);
    if (!off) return null;
    const { canvas, ctx } = off;
    const half = (g - 1) * 0.5;
    for (let gy = 0; gy < g; gy++) {
      for (let gx = 0; gx < g; gx++) {
        if (rows[gy][gx] !== '#') continue;
        const d = Math.hypot(gx - half, gy - half);
        ctx.fillStyle = d <= 1.8 ? '#FFFFFF' : (vIdx === 2 && d > 3.2 ? '#E5E7EB' : '#FFFFFF');
        ctx.fillRect(gx * P, gy * P, P, P);
      }
    }
    return canvas;
  });
}

/**
 * Bakes pixelated rising flame/ember specks for default, charged (electric blue), and end-crystal (amethyst) themes.
 */
function _bakeEmberSprites() {
  const palettes = {
    default: ['#FFFFFF', '#FDE047', '#FB923C', '#EA580C'],
    charged: ['#FFFFFF', '#E0F2FE', '#38BDF8', '#0284C7'],
    crystal: ['#FFFFFF', '#F5D0FE', '#E879F9', '#C026D3']
  };
  const cache = {};
  const P = 2;

  for (const [key, cols] of Object.entries(palettes)) {
    const off = _createOffscreenCanvas(6 * P, 8 * P);
    if (!off) {
      cache[key] = null;
      continue;
    }
    const { canvas, ctx } = off;
    const grid = [
      '..3...',
      '..23..',
      '.212..',
      '.1012.',
      '.2013.',
      '..123.',
      '..23..',
      '...3..'
    ];
    for (let gy = 0; gy < grid.length; gy++) {
      for (let gx = 0; gx < grid[gy].length; gx++) {
        const ch = grid[gy][gx];
        if (ch === '.') continue;
        ctx.fillStyle = cols[Number(ch)] || cols[2];
        ctx.fillRect(gx * P, gy * P, P, P);
      }
    }
    cache[key] = canvas;
  }
  return cache;
}

function _ensureSpritesBaked() {
  if (!_crescentCache) _crescentCache = _bakeCrescentPuffs();
  if (!_darkSmokeCache) _darkSmokeCache = _bakeDarkSmokePuffs();
  if (!_starburstCache) _starburstCache = _bakeStarburstSprites();
  if (!_emberCache) _emberCache = _bakeEmberSprites();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  _ensureSpritesBaked();
}

// Pre-seeded deterministic layouts matching the layered dome silhouette in the reference
const OUTER_CRESCENT_RING = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2 + (i % 2 === 0 ? 0.08 : -0.07);
  return {
    angle,
    radiusMult: 0.72 + (i % 3) * 0.11,
    sizeMult: 0.34 + (i % 4) * 0.045,
    delay: (i % 3) * 0.035,
    rotOffset: (i % 2 === 0 ? 0.18 : -0.18),
    flipX: i % 2 === 1
  };
});

const MID_DOME_PUFFS = Array.from({ length: 9 }, (_, i) => {
  const angle = (i / 9) * Math.PI * 2 + 0.35;
  return {
    angle,
    radiusMult: 0.36 + (i % 3) * 0.10,
    liftBias: 0.14 + (i % 3) * 0.06,
    sizeMult: 0.36 + (i % 3) * 0.05,
    delay: 0.04 + (i % 2) * 0.04,
    rotOffset: (i % 2 === 0 ? -0.35 : 0.35),
    flipX: i % 2 === 0
  };
});

const UPPER_SMOKE_COLUMN = [
  { ox: 0.00, oy: -0.26, driftY: -0.58, sizeMult: 0.36, delay: 0.02 },
  { ox: -0.18, oy: -0.22, driftY: -0.46, sizeMult: 0.30, delay: 0.06 },
  { ox: 0.19, oy: -0.20, driftY: -0.44, sizeMult: 0.28, delay: 0.08 },
  { ox: -0.08, oy: -0.40, driftY: -0.78, sizeMult: 0.24, delay: 0.12 },
  { ox: 0.11, oy: -0.44, driftY: -0.82, sizeMult: 0.22, delay: 0.15 },
  { ox: -0.26, oy: -0.36, driftY: -0.68, sizeMult: 0.16, delay: 0.18 },
  { ox: 0.28, oy: -0.34, driftY: -0.66, sizeMult: 0.15, delay: 0.20 }
];

const STARBURST_LAYOUT = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2 + i * 0.41;
  return {
    angle,
    radiusMult: 0.44 + (i % 5) * 0.14,
    sizeMult: 0.11 + (i % 3) * 0.035,
    variant: i % STAR_VARIANTS,
    delay: (i % 4) * 0.05,
    ySquash: 0.88
  };
});

const EMBER_LAYOUT = Array.from({ length: 10 }, (_, i) => ({
  ox: ((i % 5) - 2) * 0.11 + (i % 2 === 0 ? 0.03 : -0.03),
  startY: -0.04 - (i % 3) * 0.08,
  riseY: -0.62 - (i % 4) * 0.16,
  swayX: (i % 2 === 0 ? 1 : -1) * 0.06,
  sizeMult: 0.09 + (i % 3) * 0.025,
  delay: (i % 4) * 0.045
}));

function _drawPuffList(ctx, list, radius, p, isMidDome) {
  for (let i = 0; i < list.length; i++) {
    const puff = list[i];
    if (p < puff.delay) continue;
    const lp = Math.min(1.0, (p - puff.delay) / Math.max(0.01, 1.0 - puff.delay));
    const stageIdx = Math.min(CRESCENT_STAGES - 1, Math.floor(lp * CRESCENT_STAGES));
    const sprite = _crescentCache[stageIdx];
    if (!sprite || !(sprite.width > 0)) continue;

    const travelP = Math.pow(lp, 0.56);
    const dist = radius * puff.radiusMult * travelP;
    const px = Math.cos(puff.angle) * dist;
    const py = Math.sin(puff.angle) * dist * 0.88 - (isMidDome ? radius * puff.liftBias * (0.3 + lp * 0.7) : 0);
    const drawS = radius * puff.sizeMult * (0.72 + Math.sin(Math.min(1, lp * 1.4) * Math.PI * 0.5) * 0.45);
    const alpha = lp < 0.72 ? 0.96 : Math.max(0, (1.0 - lp) / 0.28 * 0.96);
    if (alpha <= 0.02) continue;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(px, py);
    ctx.rotate(puff.angle + Math.PI * 0.5 + puff.rotOffset);
    if (puff.flipX) ctx.scale(-1, 1);
    ctx.drawImage(sprite, -drawS * 0.5, -drawS * 0.5, drawS, drawS);
    ctx.restore();
  }
}

function _drawUpperSmokeAndEmbers(ctx, radius, p, emberTheme) {
  // Darker grey rising Minecraft smoke spheres above the blast dome
  for (let i = 0; i < UPPER_SMOKE_COLUMN.length; i++) {
    const orb = UPPER_SMOKE_COLUMN[i];
    if (p < orb.delay) continue;
    const lp = Math.min(1.0, (p - orb.delay) / Math.max(0.01, 1.0 - orb.delay));
    const stageIdx = Math.min(SMOKE_STAGES - 1, Math.floor(lp * SMOKE_STAGES));
    const sprite = _darkSmokeCache[stageIdx];
    if (!sprite || !(sprite.width > 0)) continue;

    const ease = Math.pow(lp, 0.65);
    const ox = orb.ox * radius * (0.5 + ease * 0.65);
    const oy = orb.oy * radius + orb.driftY * radius * ease * 0.55;
    const drawS = radius * orb.sizeMult * (0.7 + ease * 0.5);
    const alpha = lp < 0.68 ? 0.88 : Math.max(0, (1.0 - lp) / 0.32 * 0.88);
    if (alpha <= 0.02) continue;

    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, ox - drawS * 0.5, oy - drawS * 0.5, drawS, drawS);
  }

  // Rising pixelated flame/ember flecks
  const emberSprite = _emberCache[emberTheme] || _emberCache.default;
  if (emberSprite && emberSprite.width > 0) {
    for (let i = 0; i < EMBER_LAYOUT.length; i++) {
      const em = EMBER_LAYOUT[i];
      if (p < em.delay) continue;
      const lp = Math.min(1.0, (p - em.delay) / Math.max(0.01, 1.0 - em.delay));
      const ex = (em.ox + Math.sin(lp * 7 + i) * em.swayX) * radius;
      const ey = (em.startY + em.riseY * Math.pow(lp, 0.72)) * radius;
      const ew = radius * em.sizeMult;
      const eh = ew * 1.35;
      const alpha = lp < 0.65 ? 0.95 : Math.max(0, (1.0 - lp) / 0.35 * 0.95);
      if (alpha <= 0.02) continue;

      ctx.globalAlpha = alpha;
      ctx.drawImage(emberSprite, ex - ew * 0.5, ey - eh * 0.5, ew, eh);
    }
  }
}

function _drawStarburstMotes(ctx, radius, p, isCharged, isEndCrystal) {
  for (let i = 0; i < STARBURST_LAYOUT.length; i++) {
    const star = STARBURST_LAYOUT[i];
    if (p < star.delay) continue;
    const lp = Math.min(1.0, (p - star.delay) / Math.max(0.01, 1.0 - star.delay));
    const sprite = _starburstCache[star.variant] || _starburstCache[0];
    if (!sprite || !(sprite.width > 0)) continue;

    const dist = radius * star.radiusMult * (0.28 + Math.pow(lp, 0.58) * 0.78);
    const sx = Math.cos(star.angle) * dist;
    const sy = Math.sin(star.angle) * dist * star.ySquash;
    const drawS = radius * star.sizeMult * (1.1 - lp * 0.35);
    const alpha = lp < 0.60 ? 0.98 : Math.max(0, (1.0 - lp) / 0.40 * 0.98);
    if (alpha <= 0.02 || drawS <= 1) continue;

    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, sx - drawS * 0.5, sy - drawS * 0.5, drawS, drawS);
  }

  // Brief bright core pixel flash in the first 22% of the detonation
  if (p < 0.22) {
    const coreAlpha = (1.0 - p / 0.22) * 0.85;
    const coreR = Math.round(radius * (0.34 + p * 0.8));
    ctx.globalAlpha = coreAlpha;
    ctx.fillStyle = isCharged ? '#BAE6FD' : (isEndCrystal ? '#F5D0FE' : '#FFFFFF');
    ctx.fillRect(-coreR * 0.5, -coreR * 0.5, coreR, coreR);
  }
}

/**
 * Shared Core Renderer for Authentic 16-bit Minecraft Explosions.
 * Used by both ParticleSystem (`drawMinecraftExplosion`) and Creeper (`drawCreeperExplosion`).
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number, radius?: number, p: number, isCharged?: boolean, isEndCrystal?: boolean, alpha?: number }} opts
 */
export function drawMinecraftExplosionCore(ctx, opts) {
  if (!ctx || !opts) return;
  const p = Math.max(0, Math.min(1.0, Number(opts.p) || 0));
  if (p >= 1.0) return;

  _ensureSpritesBaked();
  const radius = Math.max(24, Number(opts.radius) || 125);
  const isCharged = Boolean(opts.isCharged);
  const isEndCrystal = Boolean(opts.isEndCrystal);
  const masterAlpha = opts.alpha !== undefined ? Math.max(0, Math.min(1.0, opts.alpha)) : 1.0;
  if (masterAlpha <= 0.01) return;

  const emberTheme = isCharged ? 'charged' : (isEndCrystal ? 'crystal' : 'default');

  ctx.save();
  ctx.translate(opts.x, opts.y);
  ctx.imageSmoothingEnabled = false;

  // 1. Expanding outer crescent dome (Minecraft iconic white/grey curved puffs)
  if (_crescentCache) {
    _drawPuffList(ctx, OUTER_CRESCENT_RING, radius, p, false);
    _drawPuffList(ctx, MID_DOME_PUFFS, radius, p, true);
  }

  // 2. Darker grey rising smoke column & rising pixel embers
  if (_darkSmokeCache && _emberCache) {
    _drawUpperSmokeAndEmbers(ctx, radius, p, emberTheme);
  }

  // 3. White pixelated starburst motes & initial blast core
  if (_starburstCache) {
    _drawStarburstMotes(ctx, radius, p, isCharged, isEndCrystal);
  }

  ctx.restore();
}

/**
 * ParticleSystem adapter for `type === 'minecraftExplosion'`.
 */
export function drawMinecraftExplosion(ctx, effect) {
  if (!ctx || !effect || effect.life <= 0) return;
  const p = Math.max(0, Math.min(1.0, 1.0 - effect.life));
  drawMinecraftExplosionCore(ctx, {
    x: effect.x,
    y: effect.y,
    radius: effect.targetSize || effect.size || 125,
    p,
    isCharged: Boolean(effect.isCharged),
    isEndCrystal: Boolean(effect.isEndCrystal)
  });
}
