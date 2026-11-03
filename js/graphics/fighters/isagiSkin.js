// ─────────────────────────────────────────────
// ISAGI YOICHI FIGHTER SKIN & BODY MODEL
// Striker #11 — Blue Lock Series
// Adheres strictly to:
// - Rule 24: Universal Character Body Model & Scale (Toji Reference Standard, r = 25)
// - Rule 22: Hair & Head Asset Model Import (Assets/model/isagi/isagi-hair.png)
// - Rule 20: Canonical Default Hand Positioning (±r * 0.82, +r * 0.38)
// - Rule 11: Prohibition of shadowBlur CPU filters
// - Rule 19: Upright Minimalist Manga Aesthetic
// ─────────────────────────────────────────────

import { getHandSize } from '../../core/config.js';
import { state } from '../../core/state.js';
import { drawPixelHand } from '../renderers/fighterRenderer.js';

let _isagiHairImage = null;
let _isagiHairImageLoading = false;

export function _getIsagiHairImage() {
  if (_isagiHairImage && _isagiHairImage.complete && _isagiHairImage.naturalWidth > 0) {
    return _isagiHairImage;
  }
  if (!_isagiHairImageLoading && typeof Image !== 'undefined') {
    _isagiHairImageLoading = true;
    const img = new Image();
    img.onload = () => {
      _isagiHairImage = img;
      _isagiHairImageLoading = false;
    };
    img.onerror = (e) => {
      console.warn('Failed to load Isagi hair image at Assets/model/isagi/isagi-hair.png', e);
      _isagiHairImageLoading = false;
    };
    img.src = 'Assets/model/isagi/isagi-hair.png?v=1';
    _isagiHairImage = img;
  }
  return _isagiHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getIsagiHairImage();
}

/**
 * Draws Isagi's dark spiky anime hair from Assets/model/isagi/isagi-hair.png (Rule 22 & Rule 24).
 * Calibrated using the true bounding box of the hair asset so volume matches the Toji Standard.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} r - Character body radius
 * @param {boolean} [facingLeft=false]
 */
export function _drawIsagiHair(ctx, r, facingLeft = false) {
  const hairImg = _getIsagiHairImage();
  if (hairImg && hairImg.complete && hairImg.naturalWidth > 0) {
    ctx.save();
    ctx.imageSmoothingEnabled = false; // Nearest-neighbor scaling for crisp pixel art fidelity (Rule 19)

    const custom = (typeof state !== 'undefined' && state.skinCustomizations?.isagi) || {};
    const wMult = custom.widthScale ?? 1.0;
    const hMult = custom.heightScale ?? 1.0;
    const offX = custom.offsetX ?? 0;
    const offY = custom.offsetY ?? 0;
    const rot = custom.angleOffset ?? 0;
    const flipX = custom.flipX ? -1 : 1;
    const flipY = custom.flipY ? -1 : 1;

    // isagi-hair.png (1024x1024). True visible hair bounding box:
    // X: [161, 852] (width 692, horizontal center at 506.5)
    // Y: [17, 823] (height 807, top crown apex at 17)
    // Calibrated to seamlessly frame the upper circle matching the Toji Reference Standard (Rule 24):
    // targetHairWidth = r * 3.20 (~80px wide), targetHairHeight = r * 2.25 (~56px tall)
    const targetHairWidth = r * 3.20 * wMult;
    const targetHairHeight = r * 2.25 * hMult;
    const scaleX = targetHairWidth / 692;
    const scaleY = targetHairHeight / 807;
    const drawW = 1024 * scaleX;
    const drawH = 1024 * scaleY;
    const drawX = -506.5 * scaleX + offX;
    const drawY = -r * 1.32 - 17 * scaleY + offY;

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
}

/**
 * Procedural Pixel-Art Body Buffer Cache (Rule 24 Toji Standard).
 */
let _cachedIsagiBodyCanvas = null;
let _cachedIsagiBodyR = 0;

function _renderIsagiPixelBodyToCanvas(destCtx, r) {
  destCtx.save();
  destCtx.imageSmoothingEnabled = false;
  destCtx.translate(destCtx.canvas.width / 2, destCtx.canvas.height / 2);
  const P = 2.0;
  const steps = Math.ceil((r + P) / P);

  // 100% 4-Way Symmetrical Circular Pixel Body Fill & Outer Border
  for (let gy = -steps; gy <= steps; gy++) {
    for (let gx = -steps; gx <= steps; gx++) {
      const rx = gx * P;
      const ry = gy * P;
      const dist = Math.hypot(rx, ry);
      if (dist > r) continue;

      const px = rx - P / 2;
      const py = ry - P / 2;

      // 4-neighbor boundary test for crisp 1-pixel outer manga ink outline (#0E0F14)
      const isBorder = (
        Math.hypot((gx + 1) * P, gy * P) > r ||
        Math.hypot((gx - 1) * P, gy * P) > r ||
        Math.hypot(gx * P, (gy + 1) * P) > r ||
        Math.hypot(gx * P, (gy - 1) * P) > r
      );

      if (isBorder) {
        destCtx.fillStyle = '#0E0F14';
        destCtx.fillRect(px, py, P, P);
        continue;
      }

      // ──────────────────────────────────────────
      // ZONE 1: Face & Cheeks Dome (ry < r * 0.28)
      // ──────────────────────────────────────────
      if (ry < r * 0.28) {
        let col = '#FFF0DE'; // Clean anime fair skin
        if (Math.abs(rx) > r * 0.72) {
          col = '#E8BD9B'; // Cheek contour
        }
        destCtx.fillStyle = col;
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────
      // ZONE 2: Blue Lock Jersey & Bodysuit (r * 0.28 <= ry < r * 0.68)
      // ──────────────────────────────────────────
      else if (ry < r * 0.68) {
        // High collar rim
        if (ry < r * 0.34 && Math.abs(rx) <= r * 0.46) {
          destCtx.fillStyle = '#141720'; // Clean collar rim
        }
        // Electric Cyan Piping Stripes on shoulders/sides
        else if (Math.abs(rx) >= r * 0.62 && Math.abs(rx) <= r * 0.78) {
          destCtx.fillStyle = '#00F0FF'; // Blue Lock Electric Cyan Piping
        }
        // Center #11 Jersey Motif Accent
        else if (ry >= r * 0.44 && ry <= r * 0.58 && Math.abs(rx) <= r * 0.22) {
          // #11 digit bars
          if (Math.abs(rx - P * 1.5) < P * 0.8 || Math.abs(rx + P * 1.5) < P * 0.8) {
            destCtx.fillStyle = '#FFFFFF'; // Clean white jersey numbers
          } else {
            destCtx.fillStyle = '#1E293B';
          }
        }
        // Bodysuit main fabric (Luminance separation Y >= 24 against #0E0F14 outer ink border - Rule 24)
        else {
          destCtx.fillStyle = '#242E42'; // Rich athletic navy compression suit
        }
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────
      // ZONE 3: Waistband / Seam (r * 0.68 <= ry < r * 0.78)
      // ──────────────────────────────────────────
      else if (ry < r * 0.78) {
        if (Math.abs(rx) <= r * 0.30) {
          destCtx.fillStyle = '#00F0FF'; // Center cyan waist clip
        } else {
          destCtx.fillStyle = '#182030'; // Athletic waistband
        }
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────
      // ZONE 4: Athletic Shorts (ry >= r * 0.78)
      // ──────────────────────────────────────────
      else {
        // Center fly seam
        if (Math.abs(rx) < P * 0.6) {
          destCtx.fillStyle = '#0E0F14';
        } else if (Math.abs(rx) >= r * 0.66) {
          destCtx.fillStyle = '#00F0FF'; // Shorts side trim
        } else {
          destCtx.fillStyle = '#28354A'; // Dark slate shorts fabric (Y >= 24)
        }
        destCtx.fillRect(px, py, P, P);
      }
    }
  }

  destCtx.restore();
}

/**
 * Draws the cached Isagi procedural body.
 */
function drawIsagiPixelBody(ctx, r) {
  const intR = Math.round(r);
  const P = 2.0;
  const steps = Math.ceil((intR + P) / P);
  const size = (steps * 2 + 1) * P;

  if (!_cachedIsagiBodyCanvas || _cachedIsagiBodyR !== intR) {
    if (!_cachedIsagiBodyCanvas) {
      _cachedIsagiBodyCanvas = document.createElement('canvas');
    }
    _cachedIsagiBodyCanvas.width = size;
    _cachedIsagiBodyCanvas.height = size;
    const cctx = _cachedIsagiBodyCanvas.getContext('2d');
    _renderIsagiPixelBodyToCanvas(cctx, intR);
    _cachedIsagiBodyR = intR;
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(_cachedIsagiBodyCanvas, -size / 2, -size / 2);
  ctx.restore();
}

/**
 * Main Skin Renderer for Isagi Yoichi
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} fighter
 */
export function drawIsagiSkin(ctx, fighter) {
  const r = fighter.r || 25;

  ctx.save();
  ctx.translate(fighter.x, fighter.y);

  // 1. Orientation & Mirroring (Strictly Upright POV - Zero Body Rotation)
  const angle = fighter._isWinnerReveal ? 0 : (fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0));
  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  const facingLeft = Math.abs(normAngle) > Math.PI / 2;

  // Stays strictly upright with ZERO body rotation (no ctx.rotate); flips horizontally when facing left
  if (facingLeft && !fighter.isSpinning) {
    ctx.scale(-1, 1);
  }

  // 2. Procedural Pixel-Art Body (Rule 24 Toji Standard)
  drawIsagiPixelBody(ctx, r);

  // 3. Metavision Puzzle Eyes / Flow Glint Overlay
  const isMetavisionActive = fighter.isFlowStateActive || fighter.isDirectVolleyWindingUp;
  if (isMetavisionActive) {
    ctx.save();
    // Glowing cyan/green puzzle eye reflection
    const eyeY = -r * 0.05;
    const eyeSpacing = r * 0.32;
    const eyeColor = fighter.isDirectVolleyWindingUp ? '#00FF88' : '#00F0FF';

    // Left eye
    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = eyeColor;
    ctx.fill();

    // Right eye
    ctx.beginPath();
    ctx.arc(eyeSpacing, eyeY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = eyeColor;
    ctx.fill();

    // Subtle eye glow ring (Rule 11 compliant - no shadowBlur)
    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeY, 4.5, 0, Math.PI * 2);
    ctx.arc(eyeSpacing, eyeY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.fill();

    ctx.restore();
  }

  // 4. Hair Asset Overlay (Rule 22)
  _drawIsagiHair(ctx, r, facingLeft);

  // 5. Canonical Default Model Hands (Rule 20)
  // Symmetrical lower-flank placement on front layer overlapping body edge
  const handRadius = getHandSize ? getHandSize(r * 0.30) : r * 0.30;
  const skinColor = '#FFF0DE';

  // Left Hand: (x: -r * 0.82, y: +r * 0.38)
  drawPixelHand(ctx, -r * 0.82, r * 0.38, handRadius, skinColor, '#0E0F14');

  // Right Hand: (x: +r * 0.82, y: +r * 0.38)
  drawPixelHand(ctx, r * 0.82, r * 0.38, handRadius, skinColor, '#0E0F14');

  // 6. Status Overlays (Stun, Freeze, etc.)
  if (typeof fighter.drawStatusOverlays === 'function') {
    fighter.drawStatusOverlays(ctx, r);
  }

  ctx.restore();
}

/**
 * Renders Isagi's Ghost Model Afterimage for Metavision Slip.
 */
export function drawIsagiGhostSkin(ctx, x, y, angle = 0, r = 25, alpha = 0.5) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);

  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  const facingLeft = Math.abs(normAngle) > Math.PI / 2;
  // Stays strictly upright with ZERO body rotation
  if (facingLeft) {
    ctx.scale(-1, 1);
  }

  // Draw body
  drawIsagiPixelBody(ctx, r);
  _drawIsagiHair(ctx, r, facingLeft);

  ctx.restore();
}
