// ═══════════════════════════════════════════════════════════════════════════
// KAIZO KNIGHT (Deltarune Kaizo Mod v2.3.3) — Upright Minimalist Pixel Skin
// Adheres strictly to:
// - Rule 11: Zero shadowBlur CPU filters
// - Rule 22: Dedicated Hair/Antler Asset Import (Assets/model/kaizo_knight/KaizoKnight-hair.png)
// - Rule 24: Universal Character Body Model & Scale Standard (Zero Loose Hands on Body)
// - Rule 32: Universal Character Black Outline Standard (#0E0F14) & World-Space Translation
// - Rule 35: 100% Pre-Baked Offscreen Canvas Quad Blitting
// ═══════════════════════════════════════════════════════════════════════════

import { state } from '../../core/state.js';

let _kkHairImage = null;
let _kkHairImageLoading = false;

/**
 * Loads and caches Kaizo Knight's #86A2FF-rimmed horned antler crown (Rule 22).
 * @returns {HTMLImageElement|null}
 */
export function _getKaizoKnightHairImage() {
  if (_kkHairImage && _kkHairImage.complete && _kkHairImage.naturalWidth > 0) {
    return _kkHairImage;
  }
  if (!_kkHairImageLoading && typeof Image !== 'undefined') {
    _kkHairImageLoading = true;
    const img = new Image();
    img.onload = () => {
      _kkHairImage = img;
      _kkHairImageLoading = false;
    };
    img.onerror = (e) => {
      console.warn('Failed to load Kaizo Knight antlers at Assets/model/kaizo_knight/KaizoKnight-hair.png', e);
      _kkHairImageLoading = false;
    };
    img.src = 'Assets/model/kaizo_knight/KaizoKnight-hair.png?v=1';
    _kkHairImage = img;
  }
  return _kkHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getKaizoKnightHairImage();
}

/**
 * Draws Kaizo Knight's radiant periwinkle-rimmed antler crown above the faceplate (Rule 22).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} r
 * @param {boolean} [facingLeft=false]
 */
export function _drawKaizoKnightHair(ctx, r, facingLeft = false) {
  const hairImg = _getKaizoKnightHairImage();
  if (!hairImg || !hairImg.complete || hairImg.naturalWidth <= 0) return;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const custom = (typeof state !== 'undefined' && state.skinCustomizations?.kaizo_knight) || {};
  const wMult = custom.widthScale ?? 1.0;
  const hMult = custom.heightScale ?? 1.0;
  const offX = custom.offsetX ?? 0;
  const offY = custom.offsetY ?? 0;
  const rot = custom.angleOffset ?? 0;
  const flipX = custom.flipX ? -1 : 1;
  const flipY = custom.flipY ? -1 : 1;

  const drawW = r * 2.38 * wMult;
  const drawH = r * 1.22 * hMult;
  const drawX = -drawW * 0.5 + offX;
  const drawY = -r * 1.48 + offY;

  if (rot !== 0 || flipX !== 1 || flipY !== 1) {
    ctx.translate(drawX + drawW / 2, drawY + drawH / 2);
    if (rot !== 0) ctx.rotate(rot);
    if (flipX !== 1 || flipY !== 1) ctx.scale(flipX, flipY);
    ctx.drawImage(hairImg, -drawW / 2, -drawH / 2, drawW, drawH);
  } else {
    ctx.drawImage(hairImg, drawX, drawY, drawW, drawH);
  }

  ctx.restore();
}

let _cachedKkBodyCanvas = null;
let _cachedKkBodyR = 0;
let _cachedKkPauldronCanvas = null;
let _cachedKkPauldronR = 0;

/**
 * Pre-renders symmetrical sharp flared Kaizo shoulder pauldrons with #86A2FF electric outline (Rule 35).
 */
function _renderKaizoKnightPauldronsToCanvas(destCtx, r) {
  destCtx.save();
  destCtx.imageSmoothingEnabled = false;
  destCtx.clearRect(0, 0, destCtx.canvas.width, destCtx.canvas.height);
  destCtx.translate(destCtx.canvas.width / 2, destCtx.canvas.height / 2);

  const P = 2.0;
  const maxX = Math.ceil((r * 1.66) / P);
  const maxY = Math.ceil((r * 0.54) / P);

  const inPauldronShape = (px, py) => {
    const ax = Math.abs(px);
    if (ax < r * 0.72 || ax > r * 1.52) return false;
    const t = (ax - r * 0.72) / (r * 0.80);
    const topY = r * (0.02 - 0.22 * t);
    const botY = r * (0.34 - 0.50 * Math.pow(t, 0.86));
    return py >= topY && py <= botY;
  };

  for (let gy = -maxY; gy <= maxY; gy++) {
    for (let gx = -maxX; gx <= maxX; gx++) {
      const px = gx * P;
      const py = gy * P;
      if (!inPauldronShape(px, py)) continue;

      const isOuter =
        !inPauldronShape((gx + 1) * P, py) ||
        !inPauldronShape((gx - 1) * P, py) ||
        !inPauldronShape(px, (gy + 1) * P) ||
        !inPauldronShape(px, (gy - 1) * P);

      const inCircleRoot = Math.hypot(px, py) <= r * 0.96;
      destCtx.fillStyle = (isOuter && !inCircleRoot) ? '#86A2FF' : '#0A0B10';
      destCtx.fillRect(px - P / 2, py - P / 2, P, P);
    }
  }

  destCtx.restore();
}

export function drawKaizoKnightPauldrons(ctx, r) {
  if (typeof document === 'undefined') return;
  const intR = Math.round(r);
  if (!_cachedKkPauldronCanvas || _cachedKkPauldronR !== intR) {
    const P = 2.0;
    const stepsX = Math.ceil((intR * 1.72) / P);
    const stepsY = Math.ceil((intR * 0.58) / P);
    const w = (stepsX * 2 + 1) * P;
    const h = (stepsY * 2 + 1) * P;
    _cachedKkPauldronCanvas = document.createElement('canvas');
    _cachedKkPauldronCanvas.width = w;
    _cachedKkPauldronCanvas.height = h;
    const pctx = _cachedKkPauldronCanvas.getContext('2d');
    _renderKaizoKnightPauldronsToCanvas(pctx, intR);
    _cachedKkPauldronR = intR;
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    _cachedKkPauldronCanvas,
    -_cachedKkPauldronCanvas.width / 2,
    -_cachedKkPauldronCanvas.height / 2
  );
  ctx.restore();
}

/**
 * Pre-renders Kaizo Knight's pitch-black armor body with exact #86A2FF Kaizo rim,
 * pure white radiant V-visor/collar, twin chest glints, skeletal chevrons & mantle slit.
 * Contains zero loose hands on the neutral body circle (Rule 24).
 */
function _renderKaizoKnightPixelBodyToCanvas(destCtx, r) {
  destCtx.save();
  destCtx.imageSmoothingEnabled = false;
  destCtx.clearRect(0, 0, destCtx.canvas.width, destCtx.canvas.height);
  destCtx.translate(destCtx.canvas.width / 2, destCtx.canvas.height / 2);

  const P = 2.0;
  const steps = Math.ceil((r + P) / P);

  const isCircleEdge = (gx, gy) => {
    const px = gx * P;
    const py = gy * P;
    if (Math.hypot(px, py) > r) return false;
    return (
      Math.hypot((gx + 1) * P, py) > r ||
      Math.hypot((gx - 1) * P, py) > r ||
      Math.hypot(px, (gy + 1) * P) > r ||
      Math.hypot(px, (gy - 1) * P) > r
    );
  };

  for (let gy = -steps; gy <= steps; gy++) {
    for (let gx = -steps; gx <= steps; gx++) {
      const px = gx * P;
      const py = gy * P;
      const dist = Math.hypot(px, py);
      if (dist > r) continue;

      if (isCircleEdge(gx, gy)) {
        destCtx.fillStyle = '#0E0F14'; // Rule 24 / Rule 32 outer ink outline
        destCtx.fillRect(px - P / 2, py - P / 2, P, P);
        continue;
      }

      const ny = py / r;
      const nx = px / r;

      const touchesEdge =
        isCircleEdge(gx + 1, gy) ||
        isCircleEdge(gx - 1, gy) ||
        isCircleEdge(gx, gy + 1) ||
        isCircleEdge(gx, gy - 1);

      let col = '#0A0B10'; // Deep obsidian armor core

      if (touchesEdge) {
        const inPauldronJoin = Math.abs(nx) > 0.74 && ny >= 0.00 && ny <= 0.34;
        const underCrownCap = ny < -0.58 && Math.abs(nx) < 0.78;
        if (!inPauldronJoin && !underCrownCap) {
          col = '#86A2FF'; // Canonical Kaizo electric periwinkle rim (#86A2FF)
        }
      } else if (ny < -0.10) {
        // Zone 1: Clean obsidian helm dome with subtle central #86A2FF forehead vertical glint
        if (Math.abs(px) < 0.5 && ny >= -0.44 && ny <= -0.22) {
          col = '#86A2FF';
        }
      } else if (ny < 0.42) {
        // Zone 2: Razor-crisp V-shaped radiant white & #86A2FF visor + twin collarbone stars
        if (Math.abs(nx) <= 0.48) {
          const vLineY = 0.14 - Math.abs(nx) * 0.54;
          if (Math.abs(ny - vLineY) <= 0.045) {
            col = '#FFFFFF';
          } else if (Math.abs(ny - (vLineY - 0.055)) <= 0.032) {
            col = '#86A2FF';
          }
        }
        const dotX = Math.round((r * 0.34) / P) * P;
        const dotY = Math.round((r * 0.25) / P) * P;
        if (Math.abs(Math.abs(px) - dotX) < 0.5 && Math.abs(py - dotY) < 0.5) {
          col = '#FFFFFF';
        }
      } else if (ny < 0.66) {
        // Zone 3: Skeletal rib chevrons alternating white & #86A2FF
        if (Math.abs(nx) >= 0.28 && Math.abs(nx) <= 0.58) {
          const ribY = 0.48 + (0.58 - Math.abs(nx)) * 0.22;
          if (Math.abs(ny - ribY) <= 0.042) {
            col = Math.abs(nx) > 0.44 ? '#86A2FF' : '#FFFFFF';
          }
        }
      } else {
        // Zone 4: Pitch-black lower mantle with crisp glowing vertical slit
        if (Math.abs(px) < 0.5 && ny >= 0.64 && ny <= 0.86) {
          col = ny > 0.76 ? '#86A2FF' : '#FFFFFF';
        }
      }

      destCtx.fillStyle = col;
      destCtx.fillRect(px - P / 2, py - P / 2, P, P);
    }
  }

  destCtx.restore();
}

export function drawKaizoKnightPixelBody(ctx, r) {
  if (typeof document === 'undefined') {
    _renderKaizoKnightPixelBodyToCanvas(ctx, r);
    return;
  }

  const intR = Math.round(r);
  if (!_cachedKkBodyCanvas || _cachedKkBodyR !== intR) {
    const P = 2.0;
    const steps = Math.ceil((intR + P) / P);
    const size = (steps * 2 + 1) * P;
    _cachedKkBodyCanvas = document.createElement('canvas');
    _cachedKkBodyCanvas.width = size;
    _cachedKkBodyCanvas.height = size;
    const cctx = _cachedKkBodyCanvas.getContext('2d');
    _renderKaizoKnightPixelBodyToCanvas(cctx, intR);
    _cachedKkBodyR = intR;
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const size = _cachedKkBodyCanvas.width;
  ctx.drawImage(_cachedKkBodyCanvas, -size / 2, -size / 2);
  ctx.restore();
}

/**
 * Renders Kaizo Knight skin in world space (Rule 32, Rule 24, Rule 35).
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} fighter
 */
export function drawKaizoKnightSkin(ctx, fighter) {
  const r = fighter.r || 25;
  const zOffset = fighter.z || 0;
  const shakeAmt = fighter.parryShakeTimer > 0
    ? Math.sin(fighter.parryShakeTimer * 1.9) * 3.4 * Math.min(1, fighter.parryShakeTimer / 8)
    : 0;

  ctx.save();
  ctx.translate(fighter.x + shakeAmt, fighter.y - zOffset);

  const angle = fighter._isWinnerReveal
    ? 0
    : (fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0));
  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  ctx.rotate(angle);

  const facingLeft = Math.abs(normAngle) > Math.PI / 2;
  if (facingLeft && !fighter.isSpinning) {
    ctx.scale(1, -1);
  }

  // Prismatic Kaizo Aura during Ultimate / Hypernova / Skill 1 charge (strictly skipped on Silhouette pass!)
  if (!fighter._isSilhouettePass && (fighter.isRoaringDeltaActive || fighter.isHypernovaCasting || fighter.isSkill1Channeling)) {
    const pulse = 0.24 + 0.14 * Math.sin((fighter._vfxTick || 0) * 0.42);
    const auraStroke = fighter.isRoaringDeltaActive
      ? `rgba(255, 30, 77, ${Math.min(0.92, pulse * 2.1).toFixed(2)})`
      : `rgba(134, 162, 255, ${Math.min(0.92, pulse * 2.0).toFixed(2)})`;
    const auraFill = fighter.isRoaringDeltaActive
      ? `rgba(255, 30, 77, ${(pulse * 0.65).toFixed(2)})`
      : `rgba(134, 162, 255, ${(pulse * 0.55).toFixed(2)})`;

    ctx.fillStyle = auraFill;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.36, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = auraStroke;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  // Layer 1: Pre-baked Pixel Body Circle (Rule 24 & Rule 35)
  drawKaizoKnightPixelBody(ctx, r);

  // Layer 1.5: Mandatory Universal Character Black Outline Ring (Rule 32)
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();
  ctx.restore();

  // Layer 1.8: Flared Obsidian & #86A2FF Shoulder Pauldrons (Rule 35)
  drawKaizoKnightPauldrons(ctx, r);

  // Layer 2: Horned Kaizo Antler Crown (Rule 22)
  _drawKaizoKnightHair(ctx, r, facingLeft);

  // Layer 2.5: Parry White/Blue Flash Overlay
  if (!fighter._isSilhouettePass && fighter.parryWhiteFlashTimer > 0) {
    const flashAlpha = Math.min(0.88, (fighter.parryWhiteFlashTimer / 6) * 0.80);
    ctx.fillStyle = `rgba(134, 162, 255, ${(flashAlpha * 0.50).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(0, 0, r + 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, ${flashAlpha.toFixed(2)})`;
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }

  if (typeof fighter.drawStatusOverlays === 'function') {
    fighter.drawStatusOverlays(ctx, r);
  }

  ctx.restore();
}

const _KAIZO_RGB_TINTS = ['#86A2FF', '#38BDF8', '#FF1E4D', '#C084FC'];

/**
 * Renders Kaizo Knight prismatic `rgbafterimages` echo (Rule 35).
 */
export function drawKaizoKnightGhostSkin(ctx, x, y, angle = 0, r = 25, alpha = 0.42, tintIndex = 0) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);

  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  const facingLeft = Math.abs(normAngle) > Math.PI / 2;
  ctx.rotate(angle);
  if (facingLeft) {
    ctx.scale(1, -1);
  }

  drawKaizoKnightPixelBody(ctx, r);
  drawKaizoKnightPauldrons(ctx, r);
  _drawKaizoKnightHair(ctx, r, facingLeft);

  const tintColor = _KAIZO_RGB_TINTS[Math.abs(tintIndex) % _KAIZO_RGB_TINTS.length];
  ctx.strokeStyle = tintColor;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.08, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}
