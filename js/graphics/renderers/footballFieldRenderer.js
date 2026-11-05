// ─────────────────────────────────────────────
// FOOTBALL FIELD ARENA FLOOR RENDERER — AUTHENTIC 8-BIT RETRO EDITION
// Classic 8-bit Championship Football Pitch & NES / Famicom Soccer Style
// Features 8-bit stepped pixel chalk markings, discrete dithered lawn turf bands,
// blocky pixel center circle, kickoff dot, 8-bit penalty boxes & arcs,
// goal mouths with pixel netting and solid posts, and zero confetti/flags.
// Fully compliant with Rule 11 (No shadowBlur), Rule 24/28, and Rule 0.3.
// ─────────────────────────────────────────────

import { state } from '../../core/state.js';
import { CONFIG } from '../../core/config.js';
import { ARENA_TILE_COUNT } from '../../systems/arenaTileGrid.js';

// Discrete 8-bit pixel pitch unit
const P = 2.0;
const snap = (v) => Math.round(v / P) * P;

// ─────────────────────────────────────────────
// AUTHENTIC 8-BIT PIXEL DRAWING HELPERS
// ─────────────────────────────────────────────

function _pixelRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(snap(x), snap(y), snap(w), snap(h));
}

function _draw8BitHLine(ctx, x, y, len, thick, color) {
  ctx.fillStyle = color;
  ctx.fillRect(snap(x), snap(y), snap(len), snap(thick));
}

function _draw8BitVLine(ctx, x, y, len, thick, color) {
  ctx.fillStyle = color;
  ctx.fillRect(snap(x), snap(y), snap(thick), snap(len));
}

function _draw8BitBox(ctx, x, y, w, h, color, thick = 2) {
  x = snap(x);
  y = snap(y);
  w = snap(w);
  h = snap(h);
  thick = snap(thick);
  _draw8BitHLine(ctx, x, y, w, thick, color);                     // Top
  _draw8BitHLine(ctx, x, y + h - thick, w, thick, color);         // Bottom
  _draw8BitVLine(ctx, x, y, h, thick, color);                     // Left
  _draw8BitVLine(ctx, x + w - thick, y, h, thick, color);         // Right
}

/**
 * Draws an authentic 8-bit stepped pixel circle or arc using stepped discrete rasterization.
 */
function _draw8BitPixelArc(ctx, cx, cy, r, startAngle, endAngle, color, thick = 2) {
  ctx.fillStyle = color;
  cx = snap(cx);
  cy = snap(cy);
  r = snap(r);
  thick = snap(thick);

  const numSteps = Math.max(48, Math.ceil(r * 4));
  const angleSpan = endAngle >= startAngle ? (endAngle - startAngle) : (Math.PI * 2 - (startAngle - endAngle));
  const dAngle = angleSpan / numSteps;

  const drawn = new Set();
  for (let i = 0; i <= numSteps; i++) {
    const a = startAngle + i * dAngle;
    const px = snap(cx + Math.cos(a) * r);
    const py = snap(cy + Math.sin(a) * r);
    const key = `${px}_${py}`;
    if (!drawn.has(key)) {
      drawn.add(key);
      ctx.fillRect(px, py, thick, thick);
    }
  }
}

/**
 * Draws 8-bit goal mouth posts and retro cross-stitch netting.
 */
function _draw8BitGoalMouthAndNet(ctx, goalX, cy, goalH, isLeft, isDark = false) {
  const netW = snap(10);
  const x = isLeft ? snap(goalX - netW) : snap(goalX);
  const topY = snap(cy - goalH / 2);
  const botY = snap(cy + goalH / 2);

  // 1. 8-Bit Pixel Cross-Stitch Netting
  const netColor = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.28)';
  ctx.fillStyle = netColor;
  for (let ny = topY; ny < botY; ny += 4) {
    for (let nx = x; nx < x + netW; nx += 4) {
      if ((nx + ny) % 8 === 0) {
        ctx.fillRect(nx, ny, 2, 2);
      }
    }
  }

  // 2. 8-Bit Net Tension Cord
  const cordX = isLeft ? x : (x + netW - 2);
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.70)';
  ctx.fillRect(cordX, topY, 2, botY - topY);

  // 3. Sturdy 8-Bit Goal Posts (Blocky 6x6 pixel posts with shadow & highlight)
  const drawPost = (py) => {
    // Under-shadow
    ctx.fillStyle = isDark ? '#021808' : '#083010';
    ctx.fillRect(snap(goalX) - 1, py, 6, 6);
    // Solid white steel face
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(snap(goalX) - 1, py - 2, 6, 6);
    // 8-bit specular pixel glint
    ctx.fillStyle = isDark ? '#E0F2FE' : '#CBD5E1';
    ctx.fillRect(snap(goalX), py - 1, 2, 2);
  };

  drawPost(topY);
  drawPost(botY);
}

/**
 * Draws 8-bit dashed technical dugout zones outside the touchline boundary.
 */
function _draw8BitTechnicalArea(ctx, x, y, w, h, isDark = false) {
  x = snap(x);
  y = snap(y);
  w = snap(w);
  h = snap(h);
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.50)';

  // Stepped pixel dashes (4px on, 4px off)
  for (let dx = x; dx < x + w; dx += 8) {
    ctx.fillRect(dx, y, 4, 2);
    ctx.fillRect(dx, y + h - 2, 4, 2);
  }
  for (let dy = y; dy < y + h; dy += 8) {
    ctx.fillRect(x, dy, 2, 4);
    ctx.fillRect(x + w - 2, dy, 2, 4);
  }
}

// ─────────────────────────────────────────────
// CORE PROCEDURAL 8-BIT FOOTBALL FIELD RENDERER
// ─────────────────────────────────────────────

/**
 * Renders the 8-bit Championship Football Field / Retro Stadium onto the provided canvas.
 */
export function _renderFootballFieldFloor(oc, width, height, cols, rows, cellW, cellH, isDark = false) {
  // ─────────────────────────────────────────────
  // 1. 8-BIT TURF PALETTE (NES / FAMICOM RETRO SPORTS PALETTE)
  // ─────────────────────────────────────────────
  // Light Mode: NES World Cup / Kunio-kun Soccer vibrant turf
  // Dark Mode: 8-Bit Night Match under floodlights
  const turfUnderlay   = isDark ? '#041c0a' : '#105224'; // Solid base underlay
  const turfBandA      = isDark ? '#0c4e20' : '#1fa838'; // 8-bit Light Emerald Band
  const turfBandB      = isDark ? '#073816' : '#16842c'; // 8-bit Deep Stadium Band
  const turfStriationA = isDark ? '#0f5825' : '#26b840'; // Stepped roller cut
  const turfStriationB = isDark ? '#052a11' : '#127024';

  const chalkColor     = isDark ? '#E6FFF5' : '#FFFFFF'; // Pure solid 8-bit white
  const chalkThick     = 2;                             // Crisp 2px 8-bit pixel line weight

  // Fill outer underlay to guarantee zero transparent gaps or seams
  _pixelRect(oc, 0, 0, width, height, turfUnderlay);

  // ─────────────────────────────────────────────
  // 2. 8-BIT ALTERNATING MOWED LAWN BANDS & DITHER SEAMS
  // ─────────────────────────────────────────────
  for (let c = 0; c < cols; c++) {
    const bx = snap(c * cellW);
    const bw = snap((c + 1) * cellW) - bx;
    const isLightBand = (c % 2 === 0);
    const bandBg = isLightBand ? turfBandA : turfBandB;
    const bandHi = isLightBand ? turfStriationA : turfStriationB;

    // Fill vertical 8-bit lawn band
    _pixelRect(oc, bx, 0, bw, height, bandBg);

    // Discrete 8-bit roller cut striations (2px lines every 10px)
    const stripeGap = 10;
    for (let sx = bx + 4; sx < bx + bw - 4; sx += stripeGap) {
      _pixelRect(oc, sx, 0, 2, height, bandHi);
    }

    // Authentic 8-bit dither tooth boundary between lawn bands
    if (c < cols - 1) {
      const ditherX = snap((c + 1) * cellW);
      oc.fillStyle = isLightBand ? turfBandB : turfBandA;
      for (let dy = 0; dy < height; dy += 8) {
        oc.fillRect(ditherX - 2, dy, 2, 4);
      }
    }
  }

  // ─────────────────────────────────────────────
  // 3. 8-BIT NIGHT STADIUM FLOODLIGHT STEPPED ILLUMINATION (DARK MODE)
  // ─────────────────────────────────────────────
  if (isDark) {
    oc.save();
    const midX = snap(width / 2);
    const midY = snap(height / 2);

    // Outer perimeter stadium shade
    oc.fillStyle = 'rgba(2, 10, 5, 0.28)';
    oc.fillRect(0, 0, width, height);

    // Mid stepped 8-bit floodlight zone
    oc.fillStyle = 'rgba(52, 211, 153, 0.05)';
    const midW = snap(width * 0.76);
    const midH = snap(height * 0.76);
    oc.fillRect(snap(midX - midW / 2), snap(midY - midH / 2), midW, midH);

    // Core stepped 8-bit floodlight zone
    oc.fillStyle = 'rgba(167, 243, 208, 0.08)';
    const coreW = snap(width * 0.44);
    const coreH = snap(height * 0.44);
    oc.fillRect(snap(midX - coreW / 2), snap(midY - coreH / 2), coreW, coreH);
    oc.restore();
  }

  // ─────────────────────────────────────────────
  // 4. 8-BIT REGULATION PITCH CHALK MARKINGS
  // ─────────────────────────────────────────────
  // Run-off margin outside touchline boundary
  const pad = Math.max(12, snap(Math.min(width, height) * 0.035));
  const touchX = pad;
  const touchY = pad;
  const touchW = snap(width - pad * 2);
  const touchH = snap(height - pad * 2);

  const cx = snap(width / 2);
  const cy = snap(height / 2);

  // 4.1 Outer Boundary Touchline & Goal Lines (Stepped 8-Bit Box)
  _draw8BitBox(oc, touchX, touchY, touchW, touchH, chalkColor, chalkThick);

  // 4.2 Vertical Halfway Line
  _draw8BitVLine(oc, cx - 1, touchY, touchH, chalkThick, chalkColor);

  // 4.3 8-Bit Center Circle & Solid Kickoff Dot
  const circleR = snap(Math.min(touchW, touchH) * 0.175);
  _draw8BitPixelArc(oc, cx, cy, circleR, 0, Math.PI * 2, chalkColor, chalkThick);

  // Solid 8-Bit Kickoff Spot (6x6 pixel block with 2x2 green core hole)
  oc.fillStyle = chalkColor;
  oc.fillRect(cx - 3, cy - 3, 6, 6);
  oc.fillStyle = isDark ? turfBandA : turfBandB;
  oc.fillRect(cx - 1, cy - 1, 2, 2);

  // 4.4 Left Penalty Box (18-Yard) & 6-Yard Box
  const penW = snap(touchW * 0.19);
  const penH = snap(touchH * 0.52);
  const penY = snap(cy - penH / 2);

  // Left 18-yard 3-sided box (top, right, bottom)
  _draw8BitHLine(oc, touchX, penY, penW, chalkThick, chalkColor);
  _draw8BitVLine(oc, touchX + penW - chalkThick, penY, penH, chalkThick, chalkColor);
  _draw8BitHLine(oc, touchX, penY + penH - chalkThick, penW, chalkThick, chalkColor);

  // Left 6-yard goal area box
  const goalBoxW = snap(touchW * 0.075);
  const goalBoxH = snap(touchH * 0.26);
  const goalBoxY = snap(cy - goalBoxH / 2);

  _draw8BitHLine(oc, touchX, goalBoxY, goalBoxW, chalkThick, chalkColor);
  _draw8BitVLine(oc, touchX + goalBoxW - chalkThick, goalBoxY, goalBoxH, chalkThick, chalkColor);
  _draw8BitHLine(oc, touchX, goalBoxY + goalBoxH - chalkThick, goalBoxW, chalkThick, chalkColor);

  // Left Penalty Spot (4x4 solid white block) & 8-Bit Stepped Penalty Arc ("the D")
  const spotOffset = snap(penW * 0.62);
  const leftSpotX = touchX + spotOffset;
  oc.fillStyle = chalkColor;
  oc.fillRect(leftSpotX - 2, cy - 2, 4, 4);

  // Left Penalty Arc facing center circle
  const arcR = snap(circleR * 0.55);
  _draw8BitPixelArc(oc, leftSpotX, cy, arcR, -0.75, 0.75, chalkColor, chalkThick);

  // Left Goal Mouth & 8-Bit Netting
  _draw8BitGoalMouthAndNet(oc, touchX, cy, goalBoxH, true, isDark);

  // 4.5 Right Penalty Box (18-Yard) & 6-Yard Box
  const rightPenX = touchX + touchW - penW;
  _draw8BitHLine(oc, rightPenX, penY, penW, chalkThick, chalkColor);
  _draw8BitVLine(oc, rightPenX, penY, penH, chalkThick, chalkColor);
  _draw8BitHLine(oc, rightPenX, penY + penH - chalkThick, penW, chalkThick, chalkColor);

  // Right 6-yard goal area box
  const rightGoalBoxX = touchX + touchW - goalBoxW;
  _draw8BitHLine(oc, rightGoalBoxX, goalBoxY, goalBoxW, chalkThick, chalkColor);
  _draw8BitVLine(oc, rightGoalBoxX, goalBoxY, goalBoxH, chalkThick, chalkColor);
  _draw8BitHLine(oc, rightGoalBoxX, goalBoxY + goalBoxH - chalkThick, goalBoxW, chalkThick, chalkColor);

  // Right Penalty Spot & Arc
  const rightSpotX = touchX + touchW - spotOffset;
  oc.fillStyle = chalkColor;
  oc.fillRect(rightSpotX - 2, cy - 2, 4, 4);
  _draw8BitPixelArc(oc, rightSpotX, cy, arcR, Math.PI - 0.75, Math.PI + 0.75, chalkColor, chalkThick);

  // Right Goal Mouth & 8-Bit Netting
  _draw8BitGoalMouthAndNet(oc, touchX + touchW, cy, goalBoxH, false, isDark);

  // 4.6 8-Bit Corner Kick Arcs (Stepped quarter circles at all 4 corners)
  const cornerR = snap(Math.min(touchW, touchH) * 0.04);
  _draw8BitPixelArc(oc, touchX, touchY, cornerR, 0, Math.PI / 2, chalkColor, chalkThick);                        // Top-Left
  _draw8BitPixelArc(oc, touchX + touchW, touchY, cornerR, Math.PI / 2, Math.PI, chalkColor, chalkThick);         // Top-Right
  _draw8BitPixelArc(oc, touchX, touchY + touchH, cornerR, -Math.PI / 2, 0, chalkColor, chalkThick);              // Bottom-Left
  _draw8BitPixelArc(oc, touchX + touchW, touchY + touchH, cornerR, Math.PI, Math.PI * 1.5, chalkColor, chalkThick); // Bottom-Right

  // 4.7 8-Bit Technical Dugout Areas (Outside touchline margin)
  if (touchY >= 8) {
    const dugoutW = snap(penW * 0.90);
    const dugoutH = Math.max(4, snap(touchY * 0.55));
    const dugoutY = 2;
    _draw8BitTechnicalArea(oc, touchX + 16, dugoutY, dugoutW, dugoutH, isDark);                    // Team A Dugout
    _draw8BitTechnicalArea(oc, touchX + touchW - 16 - dugoutW, dugoutY, dugoutW, dugoutH, isDark); // Team B Dugout
  }
}

// ─────────────────────────────────────────────
// PROCEDURAL OFFSCREEN CANVAS CACHE GENERATOR
// ─────────────────────────────────────────────

/**
 * Retrieves or builds a cached offscreen canvas containing the 8-bit Football Field.
 *
 * @param {object} arena - Battle arena bounding dimensions { width, height, shape }
 * @param {boolean} [isDark=false] - Whether night stadium mode is active
 * @param {number} [fBleed=0] - Bleed margin around the arena perimeter
 * @returns {HTMLCanvasElement|null}
 */
export function getOrCreateFootballFieldFloorCanvas(arena, isDark = false, fBleed = 0) {
  if (typeof document === 'undefined') return null;

  const width = Math.max(64, Math.ceil(arena.width + fBleed * 2));
  const height = Math.max(64, Math.ceil(arena.height + fBleed * 2));
  const shape = arena.shape || 'rect';
  const isClassicLayout = typeof CONFIG !== 'undefined' && CONFIG.hudLayoutStyle === 'classic';
  const key = `football_field_8bit_${width}_${height}_${shape}_${isDark ? 'dark' : 'light'}_${isClassicLayout ? 'classic' : 'duel'}_v3`;

  if (!state._arenaFloorCanvasCache) {
    state._arenaFloorCanvasCache = {};
  }
  if (state._arenaFloorCanvasCache[key]) {
    return state._arenaFloorCanvasCache[key];
  }
  if (state._footballFieldFloorCanvas && state._footballFieldFloorCanvas._key === key) {
    return state._footballFieldFloorCanvas;
  }

  const offCanvas = document.createElement('canvas');
  offCanvas.width = width;
  offCanvas.height = height;
  const oc = offCanvas.getContext('2d');
  if (!oc) return null;

  oc.imageSmoothingEnabled = false;

  const cols = ARENA_TILE_COUNT;
  const rows = ARENA_TILE_COUNT;
  const cellW = width / cols;
  const cellH = height / rows;

  _renderFootballFieldFloor(oc, width, height, cols, rows, cellW, cellH, isDark);

  offCanvas._key = key;
  state._footballFieldFloorCanvas = offCanvas;
  state._arenaFloorCanvasCache[key] = offCanvas;
  return offCanvas;
}
