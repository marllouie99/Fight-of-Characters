// ═══════════════════════════════════════════════════════════════════════════
// THE ROARING KNIGHT (Deltarune Chapter 3) — Upright Minimalist Pixel Skin
// Adheres strictly to:
// - Rule 11: Zero shadowBlur CPU filters
// - Rule 22: Dedicated Hair/Helmet Asset Import (RoaringKnight-hair.png)
// - Rule 24: Universal Character Body Model & Scale Standard (Toji Baseline, Zero Loose Hands)
// - Rule 32: Universal Character Black Outline Standard (#0E0F14) & World-Space Translation
// - Rule 35: 100% Pre-Baked Offscreen Canvas Quad Blitting
// ═══════════════════════════════════════════════════════════════════════════

import { state } from '../../core/state.js';

let _rkHairImage = null;
let _rkHairImageLoading = false;

/**
 * Loads and caches The Roaring Knight's horned crown helmet asset (Rule 22).
 * @returns {HTMLImageElement|null}
 */
export function _getRoaringKnightHairImage() {
  if (_rkHairImage && _rkHairImage.complete && _rkHairImage.naturalWidth > 0) {
    return _rkHairImage;
  }
  if (!_rkHairImageLoading && typeof Image !== 'undefined') {
    _rkHairImageLoading = true;
    const img = new Image();
    img.onload = () => {
      _rkHairImage = img;
      _rkHairImageLoading = false;
    };
    img.onerror = (e) => {
      console.warn('Failed to load Roaring Knight antlers at Assets/model/roaring_knight/RoaringKnight-hair.png', e);
      _rkHairImageLoading = false;
    };
    img.src = 'Assets/model/roaring_knight/RoaringKnight-hair.png?v=2';
    _rkHairImage = img;
  }
  return _rkHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getRoaringKnightHairImage();
}

/**
 * Draws The Roaring Knight's horned antler crown above the circle faceplate (Rule 22).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} r
 * @param {boolean} [facingLeft=false]
 */
export function _drawRoaringKnightHair(ctx, r, facingLeft = false) {
  const hairImg = _getRoaringKnightHairImage();
  if (!hairImg || !hairImg.complete || hairImg.naturalWidth <= 0) return;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const custom = (typeof state !== 'undefined' && state.skinCustomizations?.roaring_knight) || {};
  const wMult = custom.widthScale ?? 1.0;
  const hMult = custom.heightScale ?? 1.0;
  const offX = custom.offsetX ?? 0;
  const offY = custom.offsetY ?? 0;
  const rot = custom.angleOffset ?? 0;
  const flipX = custom.flipX ? -1 : 1;
  const flipY = custom.flipY ? -1 : 1;

  // RoaringKnight-hair.png (156x76): sharp white-outlined antlers & center crown peak
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

let _cachedRkBodyCanvas = null;
let _cachedRkBodyR = 0;
let _cachedRkPauldronCanvas = null;
let _cachedRkPauldronR = 0;

/**
 * Pre-renders symmetrical sharp flared shoulder pauldrons (Deltarune Ch.3 silhouette)
 * anchored cleanly outside the circular upper torso flanks (Rule 35).
 */
function _renderRoaringKnightPauldronsToCanvas(destCtx, r) {
  destCtx.save();
  destCtx.imageSmoothingEnabled = false;
  destCtx.clearRect(0, 0, destCtx.canvas.width, destCtx.canvas.height);
  destCtx.translate(destCtx.canvas.width / 2, destCtx.canvas.height / 2);

  const P = 2.0;
  const maxX = Math.ceil((r * 1.62) / P);
  const maxY = Math.ceil((r * 0.50) / P);

  const inPauldronShape = (px, py) => {
    const ax = Math.abs(px);
    if (ax < r * 0.72 || ax > r * 1.46) return false;
    const t = (ax - r * 0.72) / (r * 0.74); // 0 at circle flank -> 1 at sharp upward-angled wingtip
    const topY = r * (0.04 - 0.18 * t); // Sweeps diagonally upward-outward to sharp tip (-0.14r)
    const botY = r * (0.34 - 0.46 * Math.pow(t, 0.88)); // Tapers cleanly up to sharp tip (-0.12r)
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

      // Inside white pixel border -> pitch-black core (skip vertical root seam inside circle body)
      const inCircleRoot = Math.hypot(px, py) <= r * 0.96;
      destCtx.fillStyle = (isOuter && !inCircleRoot) ? '#FFFFFF' : '#0A0B10';
      destCtx.fillRect(px - P / 2, py - P / 2, P, P);
    }
  }

  destCtx.restore();
}

/**
 * Draws the cached pointed shoulder pauldron spikes behind/hugging the circle shoulders (Rule 35).
 */
export function drawRoaringKnightPauldrons(ctx, r) {
  if (typeof document === 'undefined') return;
  const intR = Math.round(r);
  if (!_cachedRkPauldronCanvas || _cachedRkPauldronR !== intR) {
    const P = 2.0;
    const stepsX = Math.ceil((intR * 1.68) / P);
    const stepsY = Math.ceil((intR * 0.56) / P);
    const w = (stepsX * 2 + 1) * P;
    const h = (stepsY * 2 + 1) * P;
    _cachedRkPauldronCanvas = document.createElement('canvas');
    _cachedRkPauldronCanvas.width = w;
    _cachedRkPauldronCanvas.height = h;
    const pctx = _cachedRkPauldronCanvas.getContext('2d');
    _renderRoaringKnightPauldronsToCanvas(pctx, intR);
    _cachedRkPauldronR = intR;
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    _cachedRkPauldronCanvas,
    -_cachedRkPauldronCanvas.width / 2,
    -_cachedRkPauldronCanvas.height / 2
  );
  ctx.restore();
}

/**
 * Pre-renders The Roaring Knight's obsidian shadow silhouette with razor-sharp white pixel
 * outline & Deltarune Ch.3 chest V-collar, twin dots, rib notches & core slit onto a 1:1 circle buffer.
 * Contains zero loose hands on the neutral body circle (Rule 24).
 */
function _renderRoaringKnightPixelBodyToCanvas(destCtx, r) {
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
        destCtx.fillStyle = '#0E0F14'; // Rule 24 / Rule 32 outer ink border
        destCtx.fillRect(px - P / 2, py - P / 2, P, P);
        continue;
      }

      const ny = py / r;
      const nx = px / r;

      // Crisp 1-pixel pure white interior rim contour matching Deltarune Ch.3 sprite outline
      const touchesEdge =
        isCircleEdge(gx + 1, gy) ||
        isCircleEdge(gx - 1, gy) ||
        isCircleEdge(gx, gy + 1) ||
        isCircleEdge(gx, gy - 1);

      let col = '#0A0B10'; // Deep pitch-black void armor core

      if (touchesEdge) {
        // Leave clean black junction where shoulder pauldrons & top antlers join body smoothly
        const inPauldronJoin = Math.abs(nx) > 0.74 && ny >= 0.00 && ny <= 0.32;
        const underCrownCap = ny < -0.58 && Math.abs(nx) < 0.78;
        if (!inPauldronJoin && !underCrownCap) {
          col = '#FFFFFF';
        }
      } else if (ny < -0.10) {
        // Zone 1: Clean pitch-black armored helm dome beneath antlers
      } else if (ny < 0.42) {
        // Zone 2: Razor-crisp 1px Deltarune Ch.3 V-shaped white visor/collar + twin chest dots
        if (Math.abs(nx) <= 0.46) {
          const vLineY = 0.14 - Math.abs(nx) * 0.54;
          if (Math.abs(ny - vLineY) <= 0.045) {
            col = '#FFFFFF';
          }
        }
        // Single crisp white collarbone pixel dot on each side beneath V-collar
        const dotX = Math.round((r * 0.34) / P) * P;
        const dotY = Math.round((r * 0.25) / P) * P;
        if (Math.abs(Math.abs(px) - dotX) < 0.5 && Math.abs(py - dotY) < 0.5) {
          col = '#FFFFFF';
        }
      } else if (ny < 0.66) {
        // Zone 3: Crisp 1px pinched skeletal rib/waist white chevrons (Zero red stripe)
        if (Math.abs(nx) >= 0.30 && Math.abs(nx) <= 0.58) {
          const ribY = 0.48 + (0.58 - Math.abs(nx)) * 0.22;
          if (Math.abs(ny - ribY) <= 0.042) {
            col = '#FFFFFF';
          }
        }
      } else {
        // Zone 4: Pitch-black lower cape/armor with razor-thin 1px vertical white center slit
        if (Math.abs(px) < 0.5 && ny >= 0.64 && ny <= 0.86) {
          col = '#FFFFFF';
        }
      }

      destCtx.fillStyle = col;
      destCtx.fillRect(px - P / 2, py - P / 2, P, P);
    }
  }

  destCtx.restore();
}

/**
 * Draws the cached Roaring Knight pixel-art body quad (Rule 35).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} r
 */
export function drawRoaringKnightPixelBody(ctx, r) {
  if (typeof document === 'undefined') {
    _renderRoaringKnightPixelBodyToCanvas(ctx, r);
    return;
  }

  const intR = Math.round(r);
  if (!_cachedRkBodyCanvas || _cachedRkBodyR !== intR) {
    const P = 2.0;
    const steps = Math.ceil((intR + P) / P);
    const size = (steps * 2 + 1) * P;
    _cachedRkBodyCanvas = document.createElement('canvas');
    _cachedRkBodyCanvas.width = size;
    _cachedRkBodyCanvas.height = size;
    const cctx = _cachedRkBodyCanvas.getContext('2d');
    _renderRoaringKnightPixelBodyToCanvas(cctx, intR);
    _cachedRkBodyR = intR;
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const size = _cachedRkBodyCanvas.width;
  ctx.drawImage(_cachedRkBodyCanvas, -size / 2, -size / 2);
  ctx.restore();
}

/**
 * Renders The Roaring Knight skin in world space (Rule 32 & Rule 24).
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} fighter
 */
export function drawRoaringKnightSkin(ctx, fighter) {
  const r = fighter.r || 25;
  const zOffset = fighter.z || 0;

  ctx.save();
  ctx.translate(fighter.x, fighter.y - zOffset);

  const angle = fighter._isWinnerReveal
    ? 0
    : (fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0));
  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  ctx.rotate(angle);

  const facingLeft = Math.abs(normAngle) > Math.PI / 2;
  if (facingLeft && !fighter.isSpinning) {
    ctx.scale(1, -1);
  }

  // Stark Monochrome Shadow/White Aura during Roaring Swoon charge or Falling Swords channel (Zero shadowBlur)
  if (fighter.isSwoonChanneling || fighter.isFallingSwordsCasting) {
    const pulse = 0.22 + 0.14 * Math.sin((fighter._vfxTick || 0) * 0.35);
    ctx.fillStyle = fighter.isSwoonChanneling
      ? `rgba(10, 11, 16, ${pulse.toFixed(2)})`
      : `rgba(235, 235, 235, ${(pulse * 0.80).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.32, 0, Math.PI * 2);
    ctx.fill();

    if (fighter.isSwoonChanneling) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.9, pulse * 1.9).toFixed(2)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.32, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Layer 1: Pre-baked Pixel Body Circle (Rule 24 & Rule 35)
  drawRoaringKnightPixelBody(ctx, r);

  // Layer 1.8: Flared Shadow Knight Shoulder Pauldrons (Rule 35)
  drawRoaringKnightPauldrons(ctx, r);

  // Layer 2: Horned Antler Crown (Rule 22)
  _drawRoaringKnightHair(ctx, r, facingLeft);

  if (typeof fighter.drawStatusOverlays === 'function') {
    fighter.drawStatusOverlays(ctx, r);
  }

  ctx.restore();
}

/**
 * Renders translucent Shadow Mantle dash afterimage echo (Rule 35).
 */
export function drawRoaringKnightGhostSkin(ctx, x, y, angle = 0, r = 25, alpha = 0.4) {
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

  drawRoaringKnightPixelBody(ctx, r);
  drawRoaringKnightPauldrons(ctx, r);
  _drawRoaringKnightHair(ctx, r, facingLeft);
  ctx.restore();
}
