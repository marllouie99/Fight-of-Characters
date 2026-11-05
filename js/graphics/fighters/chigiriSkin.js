// ─────────────────────────────────────────────
// CHIGIRI FIGHTER SKIN & PIXEL ART GRAPHICS
// Hyoma Chigiri — Striker #44 & The Red Panther (Blue Lock)
// Strictly adheres to Repository Art Standards:
// - Rule 24: Canonical Manga Ink Trio Reference Standard (Toji, Sukuna, Gojo)
//   - Discrete pixel grid (P = 2.0px) with 1:1 offscreen cached canvas
//   - 4-neighbor attached boundary shell test for solid #0E0F14 manga ink outline
//   - 4 Vertical Proportion Zones (Zone 1 Face Dome, Zone 2 Upper Clothe, Zone 3 Cinch, Zone 4 Shorts)
//   - Zero hands on neutral body; weapon/fist drawn only during active strikes
// - Rule 22: Mandatory Dedicated Hair Asset Model Loading
// - Rule 20: Canonical Default Hand Positioning (±r * 0.82, +r * 0.38)
// - Rule 11: Prohibition of shadowBlur CPU filters
// - Rule 19: Upright Minimalist Manga Aesthetic & Toji Rotation Pipeline
// ─────────────────────────────────────────────

import { getHandSize } from '../../core/config.js';
import { state } from '../../core/state.js';
import { drawPixelHand } from '../renderers/fighterRenderer.js';

let _chigiriHairImage = null;
let _chigiriHairImageLoading = false;

export function _getChigiriHairImage() {
  if (_chigiriHairImage && _chigiriHairImage.complete && _chigiriHairImage.naturalWidth > 0) {
    return _chigiriHairImage;
  }
  if (!_chigiriHairImageLoading && typeof Image !== 'undefined') {
    _chigiriHairImageLoading = true;
    const img = new Image();
    img.onload = () => {
      _chigiriHairImage = img;
      _chigiriHairImageLoading = false;
    };
    img.onerror = () => {
      // Fallback to lowercase hyphenated asset path with cache-buster
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        _chigiriHairImage = fallbackImg;
        _chigiriHairImageLoading = false;
      };
      fallbackImg.onerror = () => {
        console.warn('Failed to load Chigiri hair image at Assets/model/chigiri/Chigiri_hair.png and chigiri-hair.png');
        _chigiriHairImageLoading = false;
      };
      fallbackImg.src = 'Assets/model/chigiri/chigiri-hair.png?v=4';
    };
    img.src = 'Assets/model/chigiri/Chigiri_hair.png?v=4';
    _chigiriHairImage = img;
  }
  return _chigiriHairImage;
}

// Proactive eager initialization in browser environment
if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getChigiriHairImage();
}

/**
 * Renders Chigiri's iconic crimson-rose hair with signature side braid and aerodynamic silhouette.
 * Adheres strictly to Rule 22 and Rule 24.
 */
export function _drawChigiriHair(ctx, r, facingLeft = false) {
  const hairImg = _getChigiriHairImage();
  if (hairImg && hairImg.complete && hairImg.naturalWidth > 0) {
    ctx.save();
    ctx.imageSmoothingEnabled = false; // Nearest-neighbor scaling for crisp pixel art fidelity (Rule 19)

    const custom = (typeof state !== 'undefined' && state.skinCustomizations?.chigiri) || {};
    const wMult = custom.widthScale ?? 1.0;
    const hMult = custom.heightScale ?? 1.0;
    const offX = custom.offsetX ?? 0;
    const offY = custom.offsetY ?? 0;
    const rot = custom.angleOffset ?? 0;
    const flipX = custom.flipX ? -1 : 1;
    const flipY = custom.flipY ? -1 : 1;

    // Chigiri_hair.png (1536x1024, 32-bit transparent RGBA). True visible hair bounding box:
    // X: [281, 1222] (visible width 942, face opening centered at X = 772)
    // Y: [0, 1023] (visible height 1024, crown apex at Y = 0)
    // Calibrated to align face cavity with Zone 1 Face Dome & expose Zone 2 Jersey (Rule 24 Manga Ink Standard):
    const targetHairWidth = r * 2.65 * wMult;
    const targetHairHeight = r * 2.45 * hMult;
    const scaleX = targetHairWidth / 942;
    const scaleY = targetHairHeight / 1024;
    const drawW = 1536 * scaleX;
    const drawH = 1024 * scaleY;
    const drawX = -772 * scaleX + offX;
    const drawY = -r * 1.85 + offY;

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
 * Draws Chigiri's hand/fist in clean pixel art style with anime fair skin tone (Rule 20 / Toji Standard).
 */
export function drawChigiriFist(ctx, x, y, radius, skinColor = '#FFF0DE', fighter = null, isBack = false) {
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
 *   Zone 1 (ry < r * 0.30): Clean anime fair skin face dome with side cheek contour
 *   Zone 2 (r * 0.30 <= ry < r * 0.68): High collar rim + Blue Lock athletic jersey & #44 motif
 *   Zone 3 (r * 0.68 <= ry < r * 0.78): Center Rose-Pink waist clip + athletic waistband
 *   Zone 4 (ry >= r * 0.78): Athletic slate shorts with rose-red hem trim
 */
function _renderChigiriPixelBodyToCanvas(destCtx, r) {
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
        let col = '#FEDBC0'; // Warm fair skin base tone

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
        // Subtle Crimson Rose V-neck inner dip
        else if (ry >= r * 0.33 && ry <= r * 0.37 && Math.abs(rx) <= P * 0.8) {
          destCtx.fillStyle = '#EC4899';
        }
        // Center seam placket
        else if (Math.abs(rx) <= P * 0.5 && ry >= r * 0.38) {
          destCtx.fillStyle = '#141C2B';
        }
        // Left chest subtle #44 jersey number markings (clean white digit stripes)
        else if (ry >= r * 0.42 && ry <= r * 0.52 && rx >= -r * 0.34 && rx <= -r * 0.12 &&
                 (Math.abs(rx - Math.round(-r * 0.28 / P) * P) < P * 0.6 || Math.abs(rx - Math.round(-r * 0.18 / P) * P) < P * 0.6)) {
          destCtx.fillStyle = '#FFFFFF';
        }
        // Shoulder highlight band (gives the upper torso full-width athletic volume)
        else if (ry < r * 0.42 && Math.abs(rx) >= r * 0.52) {
          destCtx.fillStyle = '#3A4D72';
        }
        // Pectoral / chest highlights
        else if (Math.abs(rx) >= r * 0.14 && Math.abs(rx) <= r * 0.38 && ry >= r * 0.40 && ry <= r * 0.52) {
          destCtx.fillStyle = '#425A84';
        }
        // Lower shirt seam shadow
        else if (ry > r * 0.60) {
          destCtx.fillStyle = '#222E46';
        }
        // Main bodysuit fabric (Blue Lock rich athletic navy, Y >= 28 against #0E0F14 outer ink border)
        else {
          destCtx.fillStyle = '#30426A';
        }
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────
      // ZONE 3: Waistband & Cinch (r * 0.68 <= ry < r * 0.78 - Toji Baseline)
      // ──────────────────────────────────────────
      else if (ry < r * 0.78) {
        if (Math.abs(rx) <= P * 0.8 && ry >= r * 0.70 && ry <= r * 0.75) {
          destCtx.fillStyle = '#EC4899'; // Center rose-pink Blue Lock geometric clip
        } else if (ry < r * 0.72) {
          destCtx.fillStyle = '#32425E'; // Upper waistband highlight
        } else {
          destCtx.fillStyle = '#1C2536'; // Athletic waistband
        }
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────
      // ZONE 4: Athletic Shorts (Lower Clothe: ry >= r * 0.78 - Toji Baseline)
      // ──────────────────────────────────────────
      else {
        // Center inseam / fly crease
        if (Math.abs(rx) <= P * 0.5 && ry <= r * 0.84) {
          destCtx.fillStyle = '#1E283A';
        }
        // Shorts hem rose-pink trim (horizontal, full width)
        else if (ry >= r * 0.90) {
          destCtx.fillStyle = '#EC4899';
        }
        // Deep fold pleat shadow
        else if (Math.abs(rx) >= r * 0.30 && Math.abs(rx) <= r * 0.40) {
          destCtx.fillStyle = '#26344A';
        }
        // Fold crease highlight
        else if (ry < r * 0.86 && Math.abs(rx) < r * 0.50) {
          destCtx.fillStyle = '#465D86';
        }
        // Slate athletic shorts fabric (High Luminance Y >= 28 against #0E0F14 outer ink border)
        else {
          destCtx.fillStyle = '#344666';
        }
        destCtx.fillRect(px, py, P, P);
      }
    }
  }

  destCtx.restore();
}

let _cachedChigiriBodyCanvas = null;
let _cachedChigiriBodyR = null;

export function drawChigiriPixelBody(ctx, r) {
  if (typeof document === 'undefined') return;

  const intR = Math.round(r);
  if (!_cachedChigiriBodyCanvas || _cachedChigiriBodyR !== intR) {
    const P = 2.0;
    const steps = Math.ceil((intR + P) / P);
    const size = (steps * 2 + 1) * P;
    _cachedChigiriBodyCanvas = document.createElement('canvas');
    _cachedChigiriBodyCanvas.width = size;
    _cachedChigiriBodyCanvas.height = size;
    const cctx = _cachedChigiriBodyCanvas.getContext('2d');
    _renderChigiriPixelBodyToCanvas(cctx, intR);
    _cachedChigiriBodyR = intR;
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const size = _cachedChigiriBodyCanvas.width;
  ctx.drawImage(_cachedChigiriBodyCanvas, -size / 2, -size / 2);
  ctx.restore();
}

/**
 * Main Skin Renderer for Hyoma Chigiri.
 * Strictly adheres to Rule 19, Rule 20, Rule 21, Rule 22, and Rule 24.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} fighter
 */
export function drawChigiriSkin(ctx, fighter) {
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

  // 2. Procedural Pixel-Art Body (Rule 24 Standard)
  drawChigiriPixelBody(ctx, r);

  // 3. Hair Asset Overlay (Rule 22)
  _drawChigiriHair(ctx, r, facingLeft);

  // 4. Status Overlays (Stun, Freeze, etc.)
  if (typeof fighter.drawStatusOverlays === 'function') {
    fighter.drawStatusOverlays(ctx, r);
  }

  ctx.restore();
}

/**
 * Renders Chigiri's Ghost Model Afterimage with translucent rose-red aerodynamic sprint energy.
 */
export function drawChigiriGhostSkin(ctx, x, y, angle = 0, r = 25, alpha = 0.5) {
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

  drawChigiriPixelBody(ctx, r);
  _drawChigiriHair(ctx, r, facingLeft);

  ctx.restore();
}
