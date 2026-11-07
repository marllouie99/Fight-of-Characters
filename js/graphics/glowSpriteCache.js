// ─────────────────────────────────────────────────────────────────────────────
// PRE-BAKED RADIAL GLOW SPRITE CACHE (Rule 35 — Mobile 60 FPS Standard)
// Replaces per-frame ctx.createRadialGradient() shader/LUT allocations in
// high-frequency particle, projectile, and aura loops with cached 128×128
// offscreen <canvas> quads blitted via ctx.drawImage.
// ─────────────────────────────────────────────────────────────────────────────

const _glowCache = new Map();
const MAX_GLOW_CACHE_SIZE = 64;
const GLOW_SPRITE_SIZE = 128;

/**
 * Returns (and caches) a 128×128 offscreen <canvas> containing a radial gradient
 * matching the provided color stops.
 * @param {Array<[number, string]>} stops - Array of [offset, colorString] pairs
 * @returns {HTMLCanvasElement|null}
 */
export function getCachedRadialGlowCanvas(stops) {
  if (typeof document === 'undefined' || !Array.isArray(stops) || stops.length === 0) {
    return null;
  }

  let key = '';
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    if (!s) continue;
    key += `${s[0]}:${s[1]}|`;
  }

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
 * Blits a pre-baked radial glow sprite centered at (x, y) with radius `r`.
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

  const sprite = getCachedRadialGlowCanvas(stops);
  if (sprite && sprite !== ctx.canvas) {
    ctx.save();
    if (alpha < 0.999) {
      ctx.globalAlpha *= alpha;
    }
    const d = r * 2;
    ctx.drawImage(sprite, x - r, y - r, d, d);
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
