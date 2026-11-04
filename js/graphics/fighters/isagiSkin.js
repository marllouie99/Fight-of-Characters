// ─────────────────────────────────────────────
// ISAGI YOICHI FIGHTER SKIN & BODY MODEL
// Striker #11 — Blue Lock Series
// Adheres strictly to:
// - Rule 24: Universal Character Body Model & Scale (Toji Reference Standard, r = 25)
// - Rule 22: Hair & Head Asset Model Import (Assets/model/isagi/isagi-hair.png)
// - Rule 20: Canonical Default Hand Positioning (±r * 0.82, +r * 0.38)
// - Rule 11: Prohibition of shadowBlur CPU filters
// - Rule 19: Upright Minimalist Manga Aesthetic & Toji Rotation Pipeline
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
    img.src = 'Assets/model/isagi/isagi-hair.png?v=3';
    _isagiHairImage = img;
  }
  return _isagiHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getIsagiHairImage();
}

/**
 * Draws Isagi's dark spiky anime hair from Assets/model/isagi/isagi-hair.png (Rule 22 & Rule 24).
 * Calibrated using the true bounding box of the hair asset matching the Toji Reference Standard.
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
    // X: [158, 861] (width 704, horizontal center at 509.5)
    // Y: [153, 901] (content height 749, sprout apex at 153, dome apex at 230)
    // Calibrated to seamlessly frame the upper circle matching Toji Reference Standard (Rule 24):
    const targetHairWidth = r * 3.15 * wMult;
    const targetHairHeight = r * 2.05 * hMult;
    const scaleX = targetHairWidth / 704;
    const scaleY = targetHairHeight / 749;
    const drawW = 1024 * scaleX;
    const drawH = 1024 * scaleY;
    const drawX = -509.5 * scaleX + offX;
    const drawY = -r * 1.38 - 153 * scaleY + offY;

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
 * Draws Isagi's hand/fist in clean pixel art style with anime fair skin tone (Rule 20 / Toji Standard).
 */
export function drawIsagiFist(ctx, x, y, radius, skinColor = '#FFF0DE', fighter = null, isBack = false) {
  ctx.save();
  ctx.translate(x, y);
  drawPixelHand(ctx, 0, 0, radius, skinColor, '#0E0F14');
  ctx.restore();
}

/**
 * Procedural Pixel Art Render Function (Renders once to offscreen cache).
 * Strictly adheres to Toji Reference Standard (Rule 24):
 * - Fixed discrete grid unit P = 2.0px with integer coordinate snapping
 * - 4-neighbor attached boundary shell test for solid #0E0F14 manga ink outline
 * - Vertical Proportion Zones:
 *   Zone 1 (ry < r * 0.28): Clean anime fair skin face dome with side cheek contour
 *   Zone 2 (r * 0.28 <= ry < r * 0.64): High collar rim + Blue Lock athletic compression jersey & #11 motif
 *   Zone 3 (r * 0.64 <= ry < r * 0.78): Center Ego Cyan waist clip + athletic waistband
 *   Zone 4 (ry >= r * 0.78): Athletic slate shorts with side cyan trim & center seam
 */
function _renderIsagiPixelBodyToCanvas(destCtx, r) {
  destCtx.save();
  destCtx.imageSmoothingEnabled = false;
  destCtx.translate(destCtx.canvas.width / 2, destCtx.canvas.height / 2);
  const P = 2.0;
  const steps = Math.ceil((r + P) / P);

  // 100% 4-Way Symmetrical Circular Pixel Body Fill & Outer Border (Toji Standard)
  for (let gy = -steps; gy <= steps; gy++) {
    for (let gx = -steps; gx <= steps; gx++) {
      const rx = gx * P;
      const ry = gy * P;
      const dist = Math.hypot(rx, ry);
      if (dist > r) continue;

      const px = rx - P / 2;
      const py = ry - P / 2;

      // 4-neighbor boundary test for clean 1-pixel outer manga ink outline (#0E0F14 - Rule 24)
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
      // ZONE 1: Pure Anime Fair Skin Face Dome (ry < r * 0.30 - Toji Baseline)
      // ──────────────────────────────────────────
      if (ry < r * 0.30) {
        let col = '#FEDBC0'; // Warm fair skin base tone (1:1 with Gojo, Sukuna, Yuta)

        // Subtle cheek / side contour
        if (Math.abs(rx) > r * 0.58) {
          col = ((gx + gy) % 2 === 0) ? '#E9B796' : '#FEDBC0';
          if (Math.abs(rx) > r * 0.72) {
            col = '#D89F7C';
          }
        }
        // Soft center forehead highlight
        else if (Math.abs(rx) < r * 0.35 && ry > -r * 0.25 && ry < r * 0.10) {
          if ((gx + gy) % 4 === 0) {
            col = '#FFF0E2';
          }
        }

        destCtx.fillStyle = col;
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────
      // ZONE 2: Blue Lock Jersey & Bodysuit (Upper Clothe: r * 0.30 <= ry < r * 0.68)
      // ──────────────────────────────────────────
      else if (ry < r * 0.68) {
        // High collar rim hugging the neck border
        if (ry < r * 0.35 && Math.abs(rx) <= r * 0.48) {
          destCtx.fillStyle = '#10141E'; // Dark high collar rim
        }
        // Subtle Electric Cyan V-neck inner dip
        else if (ry >= r * 0.33 && ry <= r * 0.37 && Math.abs(rx) <= P * 0.8) {
          destCtx.fillStyle = '#00F0FF';
        }
        // Center seam placket
        else if (Math.abs(rx) <= P * 0.5 && ry >= r * 0.38) {
          destCtx.fillStyle = '#141C2B';
        }
        // Left chest subtle #11 jersey number markings (clean white digit stripes, no box background!)
        else if (ry >= r * 0.42 && ry <= r * 0.52 && rx >= -r * 0.32 && rx <= -r * 0.14 && (Math.abs(rx - Math.round(-r * 0.26 / P) * P) < P * 0.6 || Math.abs(rx - Math.round(-r * 0.18 / P) * P) < P * 0.6)) {
          destCtx.fillStyle = '#FFFFFF';
        }
        // Flank athletic Electric Cyan racing stripes
        else if (Math.abs(rx) >= r * 0.70 && Math.abs(rx) <= r * 0.82) {
          destCtx.fillStyle = '#00F0FF';
        }
        // Pectoral / chest highlights
        else if (Math.abs(rx) >= r * 0.14 && Math.abs(rx) <= r * 0.38 && ry >= r * 0.40 && ry <= r * 0.52) {
          destCtx.fillStyle = '#3A4D6E';
        }
        // Lower shirt seam shadow
        else if (ry > r * 0.60) {
          destCtx.fillStyle = '#1A2332';
        }
        // Main bodysuit fabric (Rich athletic navy, luminance Y >= 28 against #0E0F14 outer ink border - Rule 24)
        else {
          destCtx.fillStyle = '#27344C';
        }
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────
      // ZONE 3: Waistband & Cinch (r * 0.68 <= ry < r * 0.78 - Toji Baseline)
      // ──────────────────────────────────────────
      else if (ry < r * 0.78) {
        if (Math.abs(rx) <= P * 0.8 && ry >= r * 0.70 && ry <= r * 0.75) {
          destCtx.fillStyle = '#00F0FF'; // Center cyan Blue Lock geometric clip
        } else if (ry < r * 0.72) {
          destCtx.fillStyle = '#32425E'; // Upper waistband highlight
        } else {
          destCtx.fillStyle = '#1C2536'; // Athletic waistband
        }
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────
      // ZONE 4: Athletic Shorts (Lower Clothe: ry >= r * 0.78 - Toji Baseline)
      // High-contrast slate fabric with continuous hem (Inseam stops at 0.84r, NEVER bleeds into bottom border)
      // ──────────────────────────────────────────
      else {
        // Center inseam / fly crease: strictly bounded to [0.78r, 0.84r], soft dark navy (NEVER #0E0F14!)
        if (Math.abs(rx) <= P * 0.5 && ry <= r * 0.84) {
          destCtx.fillStyle = '#1E283A';
        }
        // Shorts side cyan racing stripes
        else if (Math.abs(rx) >= r * 0.70) {
          destCtx.fillStyle = '#00F0FF';
        }
        // Deep fold pleat shadow
        else if (Math.abs(rx) >= r * 0.30 && Math.abs(rx) <= r * 0.40) {
          destCtx.fillStyle = '#26344A';
        }
        // Fold crease highlight
        else if (ry < r * 0.86 && Math.abs(rx) < r * 0.50) {
          destCtx.fillStyle = '#465D86';
        }
        // Slate athletic shorts fabric (High Luminance Y >= 28 against #0E0F14 outer ink border - Rule 24)
        else {
          destCtx.fillStyle = '#344666';
        }
        destCtx.fillRect(px, py, P, P);
      }
    }
  }

  destCtx.restore();
}

/**
 * Draws the cached Isagi procedural body with 1:1 offscreen canvas caching (Toji Reference Standard).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} r - Character body radius
 */
let _cachedIsagiBodyCanvas = null;
let _cachedIsagiBodyR = 0;

export function drawIsagiPixelBody(ctx, r) {
  if (typeof document === 'undefined') {
    // Node environment fallback (Toji Standard)
    _renderIsagiPixelBodyToCanvas(ctx, r);
    return;
  }

  const intR = Math.round(r);
  if (!_cachedIsagiBodyCanvas || _cachedIsagiBodyR !== intR) {
    const P = 2.0;
    const steps = Math.ceil((intR + P) / P);
    const size = (steps * 2 + 1) * P;
    _cachedIsagiBodyCanvas = document.createElement('canvas');
    _cachedIsagiBodyCanvas.width = size;
    _cachedIsagiBodyCanvas.height = size;
    const cctx = _cachedIsagiBodyCanvas.getContext('2d');
    _renderIsagiPixelBodyToCanvas(cctx, intR);
    _cachedIsagiBodyR = intR;
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const size = _cachedIsagiBodyCanvas.width;
  ctx.drawImage(_cachedIsagiBodyCanvas, -size / 2, -size / 2);
  ctx.restore();
}

/**
 * Main Skin Renderer for Isagi Yoichi (Exact Toji Reference Standard Architecture - Rule 24)
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} fighter
 */
export function drawIsagiSkin(ctx, fighter) {
  const r = fighter.r || 25;

  ctx.save();
  ctx.translate(fighter.x, fighter.y - (fighter.z || 0));

  // 1. Orientation & Mirroring (Rule 19 Upright POV - Exact Toji Reference Pipeline)
  const angle = fighter._isWinnerReveal ? 0 : (fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0));
  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  ctx.rotate(angle);

  const facingLeft = Math.abs(normAngle) > Math.PI / 2;
  if (facingLeft && !fighter.isSpinning) {
    ctx.scale(1, -1);
  }

  // 2. Procedural Pixel-Art Body (Rule 24 Toji Standard)
  drawIsagiPixelBody(ctx, r);

  // 3. Hair Asset Overlay (Rule 22)
  _drawIsagiHair(ctx, r, facingLeft);

  // 4. Metavision Puzzle Eyes Overlay (Active only during Flow State or Direct Volley Windup)
  const isMetavisionActive = Boolean(fighter.isFlowStateActive || fighter.isDirectVolleyWindingUp);
  if (isMetavisionActive) {
    ctx.save();
    const eyeY = -r * 0.06;
    const eyeSpacing = r * 0.30;
    const eyeColor = fighter.isDirectVolleyWindingUp ? '#00FF88' : '#00F0FF';

    // Left eye puzzle glint
    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeY, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = eyeColor;
    ctx.fill();

    // Right eye puzzle glint
    ctx.beginPath();
    ctx.arc(eyeSpacing, eyeY, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = eyeColor;
    ctx.fill();

    // Subtle glow (Rule 11 compliant: transparent concentric discs, no shadowBlur)
    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeY, 4.2, 0, Math.PI * 2);
    ctx.arc(eyeSpacing, eyeY, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = fighter.isDirectVolleyWindingUp ? 'rgba(0, 255, 136, 0.35)' : 'rgba(0, 240, 255, 0.35)';
    ctx.fill();

    ctx.restore();
  }

  // 5. Status Overlays (Stun, Freeze, etc.)
  if (typeof fighter.drawStatusOverlays === 'function') {
    fighter.drawStatusOverlays(ctx, r);
  }

  ctx.restore();
}

/**
 * Renders Isagi's Ghost Model Afterimage for Metavision Slip (Toji Reference Standard).
 */
export function drawIsagiGhostSkin(ctx, x, y, angle = 0, r = 25, alpha = 0.5) {
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

  // Draw procedural pixel body & hair
  drawIsagiPixelBody(ctx, r);
  _drawIsagiHair(ctx, r, facingLeft);

  ctx.restore();
}
