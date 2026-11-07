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

function _buildStopsKey(stops) {
  let key = '';
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
 * @param {Array<[number, string]>} stops
 * @returns {{ canvas: HTMLCanvasElement, sx: number, sy: number, sw: number, sh: number }|null}
 */
export function getCachedRadialGlowAtlasSlot(stops) {
  if (!Array.isArray(stops) || stops.length === 0 || !_ensureSharedAtlas()) {
    return null;
  }

  const key = _buildStopsKey(stops);
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
  const grad = _sharedAtlasCtx.createRadialGradient(cx, cy, 0, cx, cy, half);
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
 * Falls back to direct arc + radialGradient in headless environments.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} r - Outer radius
 * @param {Array<[number, string]>} stops - Color stop pairs [[0, 'rgba(...)'], [1, 'rgba(...)']]
 * @param {number} [alpha=1.0] - Optional multiplier for globalAlpha
 */
export function drawCachedRadialGlow(ctx, x, y, r, stops, alpha = 1.0) {
  if (!ctx || r <= 0 || alpha <= 0.005) return;

  const slot = getCachedRadialGlowAtlasSlot(stops);
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
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
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
