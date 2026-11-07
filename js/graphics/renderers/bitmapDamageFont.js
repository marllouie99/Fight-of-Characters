// ─────────────────────────────────────────────
// BITMAP DAMAGE FONT ENGINE (Rule 35 Mobile Standard)
// Pre-bakes combat number glyphs (0-9, +, -, !, %, CRIT, KO, etc.)
// into offscreen canvas strips keyed by exact fighter theme color,
// completely eliminating CPU font rasterization during 60 FPS mobile combat
// while preserving 100% of character color identity.
// ─────────────────────────────────────────────

const CHARS = '0123456789+-.,!%x/KOCRITDGMWSPLNE';
const GLYPH_WIDTH = 22;
const GLYPH_HEIGHT = 28;
const GLYPH_SPACING = 16; // Kerning advance

const _charMap = new Map();
for (let i = 0; i < CHARS.length; i++) {
  _charMap.set(CHARS[i], i * GLYPH_WIDTH);
}

const _colorStripCache = new Map();
const MAX_COLOR_STRIP_CACHE = 64;

function _getColorStrip(fillColor, strokeColor = '#0E0F14') {
  if (typeof document === 'undefined') return null;
  const key = `${fillColor}_${strokeColor}`;
  let strip = _colorStripCache.get(key);
  if (strip) return strip;

  const atlasWidth = CHARS.length * GLYPH_WIDTH;
  const atlasHeight = GLYPH_HEIGHT;
  strip = document.createElement('canvas');
  strip.width = atlasWidth;
  strip.height = atlasHeight;
  const ctx = strip.getContext('2d', { willReadFrequently: false });
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = false;
  ctx.font = '700 18px "Silkscreen", "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'miter';
  ctx.miterLimit = 2;

  for (let cIdx = 0; cIdx < CHARS.length; cIdx++) {
    const char = CHARS[cIdx];
    const colX = cIdx * GLYPH_WIDTH;
    const centerX = colX + GLYPH_WIDTH / 2;
    const centerY = GLYPH_HEIGHT / 2 + 1;

    // Stroke pass
    ctx.strokeStyle = strokeColor;
    ctx.strokeText(char, centerX, centerY);

    // Fill pass
    ctx.fillStyle = fillColor;
    ctx.fillText(char, centerX, centerY);
  }

  if (_colorStripCache.size >= MAX_COLOR_STRIP_CACHE) {
    _colorStripCache.delete(_colorStripCache.keys().next().value);
  }
  _colorStripCache.set(key, strip);
  return strip;
}

/**
 * Initializes and warms common damage font palettes.
 */
export function initBitmapDamageFont() {
  if (typeof document === 'undefined') return;
  _getColorStrip('#FFFFFF');
  _getColorStrip('#FF3B30');
  _getColorStrip('#00FF66');
  _getColorStrip('#FFCC00');
}

/**
 * Checks whether the text can be rendered via pre-baked bitmap font quads.
 * @param {string} text
 * @returns {boolean}
 */
export function canRenderBitmapCombatText(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toUpperCase();
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === ' ') continue;
    if (!_charMap.has(ch)) return false;
  }
  return true;
}

/**
 * Renders combat text using pre-baked offscreen canvas quads.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {string} color
 * @param {boolean} isCrit
 * @param {number} [scale=1.0]
 * @returns {boolean} True if rendered via bitmap font quads, false if fallback needed.
 */
export function drawBitmapCombatText(ctx, text, x, y, color, isCrit, scale = 1.0) {
  if (!text || typeof text !== 'string') return false;

  const upperText = text.toUpperCase();
  for (let i = 0; i < upperText.length; i++) {
    const ch = upperText[i];
    if (ch === ' ') continue;
    if (!_charMap.has(ch)) return false; // Unbaked character - trigger fallback
  }

  const fillColor = isCrit ? '#FF3B30' : (color || '#FFFFFF');
  const strip = _getColorStrip(fillColor, '#0E0F14');
  if (!strip) return false;

  const charAdvance = GLYPH_SPACING * scale;
  const totalWidth = upperText.length * charAdvance;
  let startX = x - totalWidth / 2;
  const startY = y - (GLYPH_HEIGHT * scale) / 2;

  const prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;

  const renderW = GLYPH_WIDTH * scale;
  const renderH = GLYPH_HEIGHT * scale;

  for (let i = 0; i < upperText.length; i++) {
    const ch = upperText[i];
    if (ch === ' ') {
      startX += charAdvance * 0.7;
      continue;
    }
    const sx = _charMap.get(ch) || 0;
    ctx.drawImage(
      strip,
      sx, 0, GLYPH_WIDTH, GLYPH_HEIGHT,
      startX, startY, renderW, renderH
    );
    startX += charAdvance;
  }

  ctx.imageSmoothingEnabled = prevSmoothing;
  return true;
}
