// ─────────────────────────────────────────────────────────────────────────────
// PRE-BAKED RADIAL GLOW SPRITE CACHE & SHARED ATLAS (Rule 35 & Section 5.14)
// Replaces per-frame ctx.createRadialGradient() shader/LUT allocations in
// high-frequency particle, projectile, and aura loops with pre-baked 128×128
// quads packed into a single 1024×1024 shared offscreen Sprite Atlas <canvas>
// (8×8 grid = 64 slots) to eliminate per-sprite GPU texture binding switches.
// ─────────────────────────────────────────────────────────────────────────────

const _glowCache = new Map();
const _atlasSlotMap = new Map();
const MAX_GLOW_CACHE_SIZE = 64;
const GLOW_SPRITE_SIZE = 128;
const ATLAS_GRID_COLS = 8; // 8 × 8 = 64 slots (1024 × 1024 shared texture atlas)
const ATLAS_SIZE = GLOW_SPRITE_SIZE * ATLAS_GRID_COLS;

let _sharedAtlasCanvas = null;
let _sharedAtlasCtx = null;
let _nextAtlasSlot = 0;

function _ensureSharedAtlas() {
  if (_sharedAtlasCanvas && _sharedAtlasCtx) return true;
  if (typeof document === 'undefined') return false;
  const c = document.createElement('canvas');
  if (!c) return false;
  c.width = ATLAS_SIZE;
  c.height = ATLAS_SIZE;
  const gCtx = c.getContext('2d');
  if (!gCtx) return false;
  _sharedAtlasCanvas = c;
  _sharedAtlasCtx = gCtx;
  return true;
}

function _buildStopsKey(stops, innerRatio = 0) {
  let key = innerRatio > 0 ? `ir:${Math.round(innerRatio * 100)}|` : '';
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    if (!s) continue;
    key += `${s[0]}:${s[1]}|`;
  }
  return key;
}

/**
 * Returns (and caches) a slot `{ sx, sy, sw, sh }` inside the shared 1024×1024
 * glow sprite atlas `<canvas>` (Section 5.14 single-texture atlas packing).
 * Supports optional `innerRatio` for radial vignettes and donut-style glow rings.
 * @param {Array<[number, string]>} stops
 * @param {number} [innerRatio=0] - Inner radius ratio (0 to 1) for concentric halos / vignettes
 * @returns {{ canvas: HTMLCanvasElement, sx: number, sy: number, sw: number, sh: number }|null}
 */
export function getCachedRadialGlowAtlasSlot(stops, innerRatio = 0) {
  if (!Array.isArray(stops) || stops.length === 0 || !_ensureSharedAtlas()) {
    return null;
  }

  const key = _buildStopsKey(stops, innerRatio);
  let slot = _atlasSlotMap.get(key);
  if (slot) return slot;

  let slotIndex;
  if (_atlasSlotMap.size >= MAX_GLOW_CACHE_SIZE) {
    const oldestKey = _atlasSlotMap.keys().next().value;
    const oldSlot = _atlasSlotMap.get(oldestKey);
    _atlasSlotMap.delete(oldestKey);
    slotIndex = oldSlot ? oldSlot.slotIndex : (_nextAtlasSlot++ % MAX_GLOW_CACHE_SIZE);
  } else {
    slotIndex = _nextAtlasSlot++ % MAX_GLOW_CACHE_SIZE;
  }

  const col = slotIndex % ATLAS_GRID_COLS;
  const row = Math.floor(slotIndex / ATLAS_GRID_COLS);
  const sx = col * GLOW_SPRITE_SIZE;
  const sy = row * GLOW_SPRITE_SIZE;
  const half = GLOW_SPRITE_SIZE / 2;
  const cx = sx + half;
  const cy = sy + half;

  _sharedAtlasCtx.clearRect(sx, sy, GLOW_SPRITE_SIZE, GLOW_SPRITE_SIZE);
  const r0 = innerRatio > 0 ? Math.max(0, Math.min(half - 1, half * innerRatio)) : 0;
  const grad = _sharedAtlasCtx.createRadialGradient(cx, cy, r0, cx, cy, half);
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    if (s && s.length >= 2) {
      grad.addColorStop(s[0], s[1]);
    }
  }
  _sharedAtlasCtx.fillStyle = grad;
  _sharedAtlasCtx.fillRect(sx, sy, GLOW_SPRITE_SIZE, GLOW_SPRITE_SIZE);

  slot = {
    canvas: _sharedAtlasCanvas,
    slotIndex,
    sx,
    sy,
    sw: GLOW_SPRITE_SIZE,
    sh: GLOW_SPRITE_SIZE
  };
  _atlasSlotMap.set(key, slot);
  return slot;
}

/**
 * Returns (and caches) a standalone 128×128 offscreen <canvas> containing a radial gradient
 * matching the provided color stops.
 * @param {Array<[number, string]>} stops - Array of [offset, colorString] pairs
 * @returns {HTMLCanvasElement|null}
 */
export function getCachedRadialGlowCanvas(stops) {
  if (typeof document === 'undefined' || !Array.isArray(stops) || stops.length === 0) {
    return null;
  }

  const key = _buildStopsKey(stops);
  let cached = _glowCache.get(key);
  if (cached) return cached;

  const c = document.createElement('canvas');
  c.width = GLOW_SPRITE_SIZE;
  c.height = GLOW_SPRITE_SIZE;
  const gCtx = c.getContext('2d');
  if (!gCtx) return null;

  const half = GLOW_SPRITE_SIZE / 2;
  const grad = gCtx.createRadialGradient(half, half, 0, half, half, half);
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    if (s && s.length >= 2) {
      grad.addColorStop(s[0], s[1]);
    }
  }
  gCtx.fillStyle = grad;
  gCtx.fillRect(0, 0, GLOW_SPRITE_SIZE, GLOW_SPRITE_SIZE);

  if (_glowCache.size >= MAX_GLOW_CACHE_SIZE) {
    const oldestKey = _glowCache.keys().next().value;
    _glowCache.delete(oldestKey);
  }
  _glowCache.set(key, c);
  return c;
}

/**
 * Blits a pre-baked radial glow sprite from the shared 1024×1024 texture atlas
 * centered at (x, y) with radius `r`.
 * Supports optional `innerRatio` for donut halos and vignettes.
 * Falls back to direct arc + radialGradient in headless environments.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} r - Outer radius
 * @param {Array<[number, string]>} stops - Color stop pairs [[0, 'rgba(...)'], [1, 'rgba(...)']]
 * @param {number} [alpha=1.0] - Optional multiplier for globalAlpha
 * @param {number} [innerRatio=0] - Optional inner radius fraction (0.0 to 1.0)
 */
export function drawCachedRadialGlow(ctx, x, y, r, stops, alpha = 1.0, innerRatio = 0) {
  if (!ctx || r <= 0 || alpha <= 0.005) return;

  const slot = getCachedRadialGlowAtlasSlot(stops, innerRatio);
  if (slot && slot.canvas && slot.canvas !== ctx.canvas) {
    ctx.save();
    if (alpha < 0.999) {
      ctx.globalAlpha *= alpha;
    }
    const d = r * 2;
    ctx.drawImage(slot.canvas, slot.sx, slot.sy, slot.sw, slot.sh, x - r, y - r, d, d);
    ctx.restore();
    return;
  }

  // Fallback for headless test mocks where createElement('canvas') returns ctx.canvas
  ctx.save();
  if (alpha < 0.999) {
    ctx.globalAlpha *= alpha;
  }
  const r0 = innerRatio > 0 ? r * innerRatio : 0;
  const grad = ctx.createRadialGradient(x, y, r0, x, y, r);
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    if (s && s.length >= 2) {
      grad.addColorStop(s[0], s[1]);
    }
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Draws a pre-baked radial domain halo or atmospheric vignette.
 * Uses the cached 1024×1024 atlas quad instead of per-frame createRadialGradient,
 * eliminating shader recompilation and LUT generation on mobile tile-based GPUs.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} r - Outer radius
 * @param {Array<[number, string]>} stops - Color stop pairs
 * @param {number} [alpha=1.0] - Opacity
 * @param {number} [innerRatio=0] - Inner radius fraction (e.g. 0.15 to 0.35)
 */
export function drawCachedDomainHalo(ctx, cx, cy, r, stops, alpha = 1.0, innerRatio = 0) {
  drawCachedRadialGlow(ctx, cx, cy, r, stops, alpha, innerRatio);
}

// ─────────────────────────────────────────────────────────────────────────────
// PRE-DEFINED CANONICAL DOMAIN COLOR STOPS (Eliminates per-frame array allocations)
// ─────────────────────────────────────────────────────────────────────────────

export const MAHITO_NEBULA_STOPS = Object.freeze([
  [0, 'rgba(217, 70, 239, 0.50)'],
  [0.25, 'rgba(147, 51, 234, 0.35)'],
  [0.55, 'rgba(88, 28, 135, 0.25)'],
  [0.85, 'rgba(26, 3, 40, 0.15)'],
  [1, 'rgba(4, 0, 8, 0.0)']
]);

export const MAHITO_VIGNETTE_STOPS = Object.freeze([
  [0.00, 'rgba(20, 2, 28, 0.08)'],
  [0.35, 'rgba(14, 1, 22, 0.32)'],
  [0.65, 'rgba(8, 0, 14, 0.62)'],
  [0.85, 'rgba(4, 0, 8, 0.82)'],
  [1.00, 'rgba(2, 0, 4, 0.94)']
]);

export const RUBBICK_EMERALD_NEBULA_STOPS = Object.freeze([
  [0, 'rgba(0, 255, 100, 0.45)'],
  [0.3, 'rgba(0, 180, 70, 0.30)'],
  [0.65, 'rgba(0, 60, 25, 0.20)'],
  [1, 'rgba(1, 17, 6, 0.0)']
]);

export const YUTA_NEBULA_STOPS = Object.freeze([
  [0, 'rgba(193, 0, 70, 0.50)'],
  [0.25, 'rgba(151, 3, 54, 0.35)'],
  [0.55, 'rgba(107, 8, 53, 0.25)'],
  [0.85, 'rgba(53, 7, 25, 0.15)'],
  [1, 'rgba(8, 8, 8, 0.0)']
]);

export const YUTA_VIGNETTE_STOPS = Object.freeze([
  [0.00, 'rgba(0, 0, 0, 0.0)'],
  [0.60, 'rgba(24, 4, 18, 0.15)'],
  [1.00, 'rgba(8, 8, 8, 0.55)']
]);

export const YUTA_VIGNETTE_TOJI_STOPS = Object.freeze([
  [0.00, 'rgba(0, 0, 0, 0.0)'],
  [0.60, 'rgba(24, 4, 18, 0.08)'],
  [1.00, 'rgba(8, 8, 8, 0.35)']
]);

export const RIKA_SURGE_STOPS = Object.freeze([
  [0, 'rgba(255, 20, 147, 0.85)'],
  [0.3, 'rgba(138, 43, 226, 0.55)'],
  [0.6, 'rgba(75, 0, 130, 0.25)'],
  [1, 'rgba(0, 0, 0, 0)']
]);

export const TOJI_SHADOW_STOPS = Object.freeze([
  [0, 'rgba(0, 0, 0, 0.75)'],
  [0.35, 'rgba(0, 0, 0, 0.85)'],
  [1.0, '#000000']
]);

export const TOJI_SHADOW_YUTA_STOPS = Object.freeze([
  [0, 'rgba(0, 0, 0, 0.45)'],
  [0.35, 'rgba(0, 0, 0, 0.65)'],
  [1.0, 'rgba(0, 0, 0, 0.85)']
]);

export const TOJI_VIGNETTE_STOPS = Object.freeze([
  [0.00, 'rgba(0, 0, 0, 0.0)'],
  [0.65, 'rgba(0, 0, 0, 0.45)'],
  [1.00, 'rgba(0, 0, 0, 0.95)']
]);

export const TOJI_VIGNETTE_YUTA_STOPS = Object.freeze([
  [0.00, 'rgba(0, 0, 0, 0.0)'],
  [0.65, 'rgba(0, 0, 0, 0.25)'],
  [1.00, 'rgba(0, 0, 0, 0.65)']
]);

export const SUKUNA_WATER_VIGNETTE_STOPS = Object.freeze([
  [0.0, 'rgba(0, 0, 0, 0)'],
  [0.6, 'rgba(0, 0, 0, 0.15)'],
  [1.0, 'rgba(0, 0, 0, 0.40)']
]);
