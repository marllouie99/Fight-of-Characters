// ─────────────────────────────────────────────
// BITMAP DAMAGE FONT ENGINE (Rule 35 Mobile Standard)
// Pre-bakes combat number glyphs (0-9, +, -, !, %, CRIT, KO, etc.)
// into an offscreen canvas atlas, completely eliminating CPU font
// rasterization (ctx.fillText / ctx.strokeText) during 60 FPS combat.
// ─────────────────────────────────────────────

const CHARS = '0123456789+-.,!%x/KOCRITDGMWSPLNE';
const GLYPH_WIDTH = 22;
const GLYPH_HEIGHT = 28;
const GLYPH_SPACING = 16; // Kerning advance

const PALETTES = {
  white: { fill: '#FFFFFF', stroke: '#0E0F14' },
  crit: { fill: '#FF3B30', stroke: '#0E0F14' },
  gold: { fill: '#FFCC00', stroke: '#0E0F14' },
  heal: { fill: '#00FF66', stroke: '#0E0F14' },
  cyan: { fill: '#00E5FF', stroke: '#0E0F14' },
  purple: { fill: '#B366FF', stroke: '#0E0F14' },
  orange: { fill: '#FF6600', stroke: '#0E0F14' },
  gray: { fill: '#A0AEC0', stroke: '#0E0F14' }
};

let _atlasCanvas = null;
let _charMap = null; // char -> { x, y, w, h }
let _isAtlasReady = false;

function _getPaletteKey(colorStr, isCrit) {
  if (isCrit) return 'crit';
  if (!colorStr) return 'white';
  const c = String(colorStr).toLowerCase();

  if (c.includes('ff3b30') || c.includes('ff4500') || c.includes('dc2626') || c.includes('red')) return 'crit';
  if (c.includes('00ff66') || c.includes('00ff88') || c.includes('00ff00') || c.includes('4ade80') || c.includes('10b981') || c.includes('green')) return 'heal';
  if (c.includes('ffd700') || c.includes('ffcc00') || c.includes('f59e0b') || c.includes('yellow') || c.includes('gold')) return 'gold';
  if (c.includes('00e5ff') || c.includes('00f0ff') || c.includes('00eaff') || c.includes('cyan') || c.includes('38bdf8')) return 'cyan';
  if (c.includes('b366ff') || c.includes('c084fc') || c.includes('a855f7') || c.includes('purple') || c.includes('violet')) return 'purple';
  if (c.includes('ff6600') || c.includes('orange')) return 'orange';
  if (c.includes('a0aec0') || c.includes('94a3b8') || c.includes('gray') || c.includes('grey')) return 'gray';

  return 'white';
}

/**
 * Initializes and bakes the damage font atlas once into an offscreen canvas.
 */
export function initBitmapDamageFont() {
  if (_isAtlasReady || typeof document === 'undefined') return;

  const paletteKeys = Object.keys(PALETTES);
  const atlasWidth = CHARS.length * GLYPH_WIDTH;
  const atlasHeight = paletteKeys.length * GLYPH_HEIGHT;

  _atlasCanvas = document.createElement('canvas');
  _atlasCanvas.width = atlasWidth;
  _atlasCanvas.height = atlasHeight;
  const ctx = _atlasCanvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;
  ctx.font = '900 20px "Arial Black", "Impact", "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'miter';
  ctx.miterLimit = 2;

  _charMap = new Map();

  for (let pIdx = 0; pIdx < paletteKeys.length; pIdx++) {
    const pKey = paletteKeys[pIdx];
    const palette = PALETTES[pKey];
    const rowY = pIdx * GLYPH_HEIGHT;

    for (let cIdx = 0; cIdx < CHARS.length; cIdx++) {
      const char = CHARS[cIdx];
      const colX = cIdx * GLYPH_WIDTH;
      const centerX = colX + GLYPH_WIDTH / 2;
      const centerY = rowY + GLYPH_HEIGHT / 2 + 1;

      // Stroke pass
      ctx.strokeStyle = palette.stroke;
      ctx.strokeText(char, centerX, centerY);

      // Fill pass
      ctx.fillStyle = palette.fill;
      ctx.fillText(char, centerX, centerY);

      if (pIdx === 0) {
        _charMap.set(char, colX);
      }
    }
  }

  _isAtlasReady = true;
}

/**
 * Checks whether the text can be rendered via pre-baked bitmap font quads.
 * @param {string} text
 * @returns {boolean}
 */
export function canRenderBitmapCombatText(text) {
  if (!_isAtlasReady || !text || typeof text !== 'string') return false;
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
  if (!_isAtlasReady) {
    initBitmapDamageFont();
  }
  if (!_isAtlasReady || !text || typeof text !== 'string') return false;

  const upperText = text.toUpperCase();
  // Validate characters
  for (let i = 0; i < upperText.length; i++) {
    const ch = upperText[i];
    if (ch === ' ') continue;
    if (!_charMap.has(ch)) return false; // Contains unbaked character - trigger fallback
  }

  const pKey = _getPaletteKey(color, isCrit);
  const paletteKeys = Object.keys(PALETTES);
  const rowIdx = paletteKeys.indexOf(pKey);
  const sy = (rowIdx !== -1 ? rowIdx : 0) * GLYPH_HEIGHT;

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
      _atlasCanvas,
      sx, sy, GLYPH_WIDTH, GLYPH_HEIGHT,
      startX, startY, renderW, renderH
    );
    startX += charAdvance;
  }

  ctx.imageSmoothingEnabled = prevSmoothing;
  return true;
}
