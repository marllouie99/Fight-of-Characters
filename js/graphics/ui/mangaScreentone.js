// ─────────────────────────────────────────────────────────────────────────────
// MANGA SCREENTONE (HALFTONE) RENDERER
// ─────────────────────────────────────────────────────────────────────────────
// Signature detail of the black & white manga menu theme: printed halftone
// dots on a 45° lattice, the way manga pages shade without grey ink.
//
// Rule 35 (Mobile 60 FPS): every dot is baked ONCE into an offscreen canvas.
// The live render loop only ever issues a single fillRect (pattern) or a single
// drawImage (vignette overlay) per call. No per-frame arc/fillRect dot loops.
// ─────────────────────────────────────────────────────────────────────────────

const _tileCache = new Map();          // key -> tile canvas
const _patternCache = new WeakMap();   // ctx -> Map(key -> CanvasPattern)
const _overlayCache = new Map();       // key -> full-size baked overlay canvas

function _canMakeCanvas() {
  return typeof document !== 'undefined' && typeof document.createElement === 'function';
}

function _makeCanvas(w, h) {
  if (!_canMakeCanvas()) return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const cctx = typeof c.getContext === 'function' ? c.getContext('2d') : null;
  if (!cctx || typeof cctx.arc !== 'function') return null;
  return { canvas: c, ctx: cctx };
}

function _dot(cctx, x, y, r) {
  if (r <= 0.05) return;
  cctx.moveTo(x + r, y);
  cctx.arc(x, y, r, 0, Math.PI * 2);
}

/**
 * Bakes one repeatable 45° halftone tile: dots on the four corners + the center.
 * Corner dots are drawn whole and clipped by the tile edge, so tiles seam perfectly.
 */
function _getTile(spacing, radius, color) {
  const key = `${spacing}|${radius}|${color}`;
  if (_tileCache.has(key)) return _tileCache.get(key);

  const made = _makeCanvas(spacing, spacing);
  if (!made) return null;
  const { canvas, ctx: t } = made;
  t.fillStyle = color;
  t.beginPath();
  _dot(t, 0, 0, radius);
  _dot(t, spacing, 0, radius);
  _dot(t, 0, spacing, radius);
  _dot(t, spacing, spacing, radius);
  _dot(t, spacing / 2, spacing / 2, radius);
  t.fill();

  _tileCache.set(key, canvas);
  return canvas;
}

/**
 * Returns a cached repeating screentone CanvasPattern for the given context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ spacing?: number, radius?: number, color?: string }} [opts]
 * @returns {CanvasPattern|null}
 */
export function getScreentonePattern(ctx, { spacing = 8, radius = 1, color = '#FFFFFF' } = {}) {
  if (!ctx || typeof ctx.createPattern !== 'function') return null;
  const key = `${spacing}|${radius}|${color}`;

  let perCtx = _patternCache.get(ctx);
  if (!perCtx) {
    perCtx = new Map();
    _patternCache.set(ctx, perCtx);
  }
  if (perCtx.has(key)) return perCtx.get(key);

  const tile = _getTile(spacing, radius, color);
  const pattern = tile ? ctx.createPattern(tile, 'repeat') : null;
  perCtx.set(key, pattern);
  return pattern;
}

/**
 * Fills a rectangle with a flat screentone texture (single fillRect).
 * Falls back to nothing when canvases are unavailable (headless tests).
 */
export function fillScreentone(ctx, x, y, w, h, opts) {
  const pattern = getScreentonePattern(ctx, opts);
  if (!pattern) return;
  ctx.save();
  ctx.fillStyle = pattern;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/**
 * Bakes a full-size modal dim overlay: a flat black wash plus black halftone
 * dots that grow from tiny at the center to fully merged at the corners
 * (a printed manga vignette). Cached per size, so it is built once.
 */
function _getVignetteOverlay(w, h, baseAlpha) {
  const key = `${w}x${h}|${baseAlpha}`;
  if (_overlayCache.has(key)) return _overlayCache.get(key);

  const made = _makeCanvas(w, h);
  if (!made) {
    _overlayCache.set(key, null);
    return null;
  }
  const { canvas, ctx: o } = made;

  // Flat wash keeps the modal legible regardless of what is underneath
  o.fillStyle = `rgba(0, 0, 0, ${baseAlpha})`;
  o.fillRect(0, 0, w, h);

  // Halftone vignette: 45° lattice, dot radius scales with distance from center
  const spacing = 8;
  const cx = w / 2;
  const cy = h / 2;
  const maxDist = Math.hypot(cx, cy);
  const minR = 0.5;
  const maxR = spacing * 0.72; // neighbours overlap near the corners -> solid ink

  o.fillStyle = '#000000';
  o.beginPath();
  for (let row = 0, py = 0; py <= h + spacing; row++, py += spacing / 2) {
    const offset = (row % 2) * (spacing / 2);
    for (let px = offset; px <= w + spacing; px += spacing) {
      const t = Math.hypot(px - cx, py - cy) / maxDist;
      const eased = t * t * (3 - 2 * t); // smoothstep: quiet center, dense edges
      _dot(o, px, py, minR + (maxR - minR) * eased);
    }
  }
  o.fill();

  _overlayCache.set(key, canvas);
  return canvas;
}

/**
 * Draws the manga screentone modal backdrop over the whole canvas in one
 * drawImage call. Falls back to a flat black wash when baking is unavailable.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w canvas width
 * @param {number} h canvas height
 * @param {number} [baseAlpha=0.72] opacity of the flat wash under the dots
 */
export function drawScreentoneModalBackdrop(ctx, w, h, baseAlpha = 0.72) {
  if (!ctx) return;
  const overlay = _getVignetteOverlay(Math.round(w), Math.round(h), baseAlpha);
  ctx.save();
  if (overlay && typeof ctx.drawImage === 'function') {
    ctx.drawImage(overlay, 0, 0, w, h);
  } else {
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.92, baseAlpha + 0.14)})`;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

/**
 * Pre-warms the modal overlay for a canvas size (call behind a loading curtain
 * or on entering the select screen) so the first modal open never stalls.
 */
export function prewarmScreentone(w, h, baseAlpha = 0.72) {
  _getVignetteOverlay(Math.round(w), Math.round(h), baseAlpha);
}

