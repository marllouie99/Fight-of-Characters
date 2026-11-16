// ───────────────────────────────────────────────────────────────────────────
// Sōsuke Aizen — Fighter Skin & Body Model
// Canonical Manga Ink Standard (Rules 11, 22, 24, 32, 35)
// - 1:1 Offscreen Canvas Buffer Caching per (radius, form)
// - Zone 1..4 Vertical Proportions (Base Hueco Mundo / Hōgyoku / Final Form)
// - Layer 2 Hair Overlay (Assets/model/aizen/Aizen-hair.png & Aizen-final-hair.png)
// - Zero Hands on Neutral Body (Weapons-Only Hand Anchoring)
// ───────────────────────────────────────────────────────────────────────────

import { state } from '../../core/state.js';
import { CONFIG } from '../../core/config.js';

let _aizenHairImage = null;
let _aizenHairLoading = false;
let _aizenFinalHairImage = null;
let _aizenFinalHairLoading = false;

export function _getAizenHairImage() {
  if (_aizenHairImage && _aizenHairImage.complete && _aizenHairImage.naturalWidth > 0) {
    return _aizenHairImage;
  }
  const hairSrc = CONFIG.aizen?.assets?.hair || 'Assets/model/aizen/Aizen-hair.png';
  if (!_aizenHairLoading && typeof Image !== 'undefined') {
    _aizenHairLoading = true;
    const img = new Image();
    img.onload = () => { _aizenHairImage = img; _aizenHairLoading = false; };
    img.onerror = () => { _aizenHairLoading = false; };
    img.src = `${hairSrc}?v=1`;
    _aizenHairImage = img;
  }
  return _aizenHairImage;
}

export function _getAizenFinalHairImage() {
  return _getAizenHairImage();
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getAizenHairImage();
}

/**
 * Draws Aizen's calibrated pixel-art hair overlay (Assets/model/aizen/Aizen-hair.png).
 */
export function _drawAizenHair(ctx, r, facingLeft = false, formLevel = 0) {
  const hairImg = _getAizenHairImage();
  if (!hairImg || !hairImg.complete || (hairImg.naturalWidth <= 0 && hairImg.width <= 0)) return;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const custom = (typeof state !== 'undefined' && state.skinCustomizations?.aizen) || {};
  const wMult = custom.widthScale ?? 1.0;
  const hMult = custom.heightScale ?? 1.0;
  const offX = custom.offsetX ?? 0;
  const offY = custom.offsetY ?? 0;
  const rot = custom.angleOffset ?? 0;
  const flipX = custom.flipX ? -1 : 1;
  const flipY = custom.flipY ? -1 : 1;

  // Calibrated from exact bbox of Assets/model/aizen/Aizen-hair.png (1024x1024):
  // visW=860, visH=800, centerX=512, topY=112
  const targetHairWidth = r * 2.76 * wMult;
  const targetHairHeight = r * 2.15 * hMult;
  const scaleX = targetHairWidth / 860;
  const scaleY = targetHairHeight / 800;
  const drawW = 1024 * scaleX;
  const drawH = 1024 * scaleY;
  const drawX = -512 * scaleX + offX;
  const drawY = -r * 1.28 - 112 * scaleY + offY;

  if (rot !== 0 || flipX !== 1 || flipY !== 1) {
    ctx.translate(drawX + drawW / 2, drawY + drawH / 2);
    if (rot !== 0) ctx.rotate(rot);
    if (flipX !== 1 || flipY !== 1) ctx.scale(flipX, flipY);
    ctx.drawImage(hairImg, -drawW / 2, -drawH / 2, drawW, drawH);
  } else {
    ctx.drawImage(hairImg, drawX, drawY, drawW, drawH);
  }

  // Final Form: Glowing third-eye Hōgyoku forehead diamond crest
  if (formLevel >= 2) {
    const cy = -r * 0.44;
    ctx.beginPath();
    ctx.moveTo(0, cy - 4.5);
    ctx.lineTo(3.5, cy);
    ctx.lineTo(0, cy + 4.5);
    ctx.lineTo(-3.5, cy);
    ctx.closePath();
    ctx.fillStyle = '#E0F2FE';
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#7C3AED';
    ctx.stroke();
  }
  ctx.restore();
}

const _cachedAizenBodies = new Map();

function _renderAizenPixelBodyToCanvas(destCtx, r, formLevel = 0) {
  destCtx.save();
  destCtx.imageSmoothingEnabled = false;
  destCtx.translate(destCtx.canvas.width / 2, destCtx.canvas.height / 2);

  const P = 2.0;
  const steps = Math.ceil((r + P) / P);

  for (let gy = -steps; gy <= steps; gy++) {
    for (let gx = -steps; gx <= steps; gx++) {
      const rx = gx * P;
      const ry = gy * P;
      if (Math.hypot(rx, ry) > r) continue;

      const px = rx - P / 2;
      const py = ry - P / 2;
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

      const ny = ry / r;
      const nx = rx / r;
      const absNx = Math.abs(nx);
      let col = '#FEDBC0';

      // ZONE 1: Faceless Anime Head Dome (ny < 0.30)
      if (ny < 0.30) {
        if (formLevel >= 2) {
          // Final Form pale transcendent skin + hollow cheek markings
          col = absNx >= 0.65 && ny > -0.05 ? '#3B1D5E' : (absNx >= 0.52 ? '#DDD6FE' : '#F3E8FF');
        } else if (formLevel === 1) {
          col = absNx >= 0.56 ? '#E2D8D5' : (absNx < 0.32 && ny < 0.08 && (gx + gy) % 4 === 0 ? '#FFFFFF' : '#F6EFEA');
        } else {
          col = absNx >= 0.55 ? '#E9B796' : (absNx < 0.35 && ny > -0.22 && ny < 0.10 && (gx + gy) % 4 === 0 ? '#FFF0E2' : '#FEDBC0');
        }
      }
      // ZONE 2: High-Collar Coat / Chrysalis Robe / Carapace (0.30 <= ny < 0.64)
      else if (ny < 0.64) {
        if (formLevel === 0) {
          // Base Hueco Mundo White Arrancar Coat + Dark Violet Collar Placket
          if (ny < 0.38 && absNx < 0.62) {
            col = absNx < 0.16 ? '#2E2246' : '#FFFFFF';
          } else if (absNx < 0.12) {
            col = '#2E2246'; // Center dark zipper seam
          } else if (absNx > 0.72) {
            col = '#C4C0CE'; // Outer coat shadow
          } else {
            col = '#EAE8F0';
          }
        } else if (formLevel === 1) {
          // Hōgyoku Fusion Porcelain Coat + Glowing Violet Hōgyoku Core
          const coreDist = Math.hypot(rx, ry - r * 0.48);
          if (coreDist <= r * 0.13) {
            col = coreDist <= r * 0.07 ? '#E9D5FF' : '#9333EA';
          } else if (coreDist <= r * 0.17) {
            col = '#0E0F14';
          } else if (ny < 0.38 && absNx < 0.58) {
            col = '#FFFFFF';
          } else {
            col = absNx > 0.72 ? '#CBD5E1' : '#F8FAFC';
          }
        } else {
          // Final Form Obsidian-Violet Carapace + Crimson-Violet Hōgyoku Core
          const coreDist = Math.hypot(rx, ry - r * 0.48);
          if (coreDist <= r * 0.15) {
            col = coreDist <= r * 0.08 ? '#FDA4AF' : '#E11D48';
          } else if (coreDist <= r * 0.20) {
            col = '#0E0F14';
          } else if (absNx < 0.22) {
            col = '#4C1D95';
          } else {
            col = absNx > 0.68 ? '#24163A' : '#321E52';
          }
        }
      }
      // ZONE 3: Sash / Obi / Carapace Waistband (0.64 <= ny < 0.78)
      else if (ny < 0.78) {
        if (formLevel === 0) {
          col = absNx < 0.20 ? '#5B21B6' : '#3B2667';
        } else if (formLevel === 1) {
          col = absNx < 0.22 ? '#7C3AED' : '#4C1D95';
        } else {
          col = absNx < 0.24 ? '#BE123C' : '#3B1D5E';
        }
      }
      // ZONE 4: Lower Hakama / Transcendent Robe (ny >= 0.78)
      else {
        if (formLevel >= 2) {
          col = (absNx <= 0.08 || absNx >= 0.52) ? '#201432' : '#321E4E';
        } else {
          col = absNx <= 0.07 ? '#4C1D95' : (absNx >= 0.56 ? '#B8B4C8' : '#DCD8E8');
        }
      }

      destCtx.fillStyle = col;
      destCtx.fillRect(px, py, P, P);
    }
  }

  destCtx.restore();
}

/**
 * Draws Aizen's pre-baked offscreen pixel body (Rule 35).
 */
export function drawAizenPixelBody(ctx, r, formLevel = 0) {
  const intR = Math.round(r);
  const fKey = `${intR}_${formLevel}`;
  if (typeof document === 'undefined') {
    _renderAizenPixelBodyToCanvas(ctx, intR, formLevel);
    return;
  }

  let cached = _cachedAizenBodies.get(fKey);
  if (!cached) {
    const P = 2.0;
    const steps = Math.ceil((intR + P) / P);
    const size = (steps * 2 + 1) * P;
    cached = document.createElement('canvas');
    cached.width = size;
    cached.height = size;
    const cctx = cached.getContext('2d');
    _renderAizenPixelBodyToCanvas(cctx, intR, formLevel);
    _cachedAizenBodies.set(fKey, cached);
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const size = cached.width;
  ctx.drawImage(cached, -size / 2, -size / 2);
  ctx.restore();
}

/**
 * Main Skin Renderer for Sōsuke Aizen (Rule 24 & 32 World-Space Contract)
 */
export function drawAizenSkin(ctx, fighter) {
  const r = fighter.r || 30;
  const formLevel = fighter.aizenForm || 0;

  ctx.save();
  ctx.translate(fighter.x || 0, (fighter.y || 0) - (fighter.z || 0));

  const angle = fighter._isWinnerReveal ? 0 : (fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0));
  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  ctx.rotate(angle);

  const facingLeft = Math.abs(normAngle) > Math.PI / 2;
  if (facingLeft && !fighter.isSpinning) {
    ctx.scale(1, -1);
  }

  // Layer 1: Pre-baked Pixel Body Circle (Base / Hōgyoku / Final Form)
  drawAizenPixelBody(ctx, r, formLevel);

  // Layer 2: Calibrated Hair Asset Overlay
  _drawAizenHair(ctx, r, facingLeft, formLevel);

  // Layer 1.5 / 32: Crisp Outer Black Outline
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();

  if (typeof fighter.drawStatusOverlays === 'function' && !fighter._isSilhouettePass) {
    fighter.drawStatusOverlays(ctx, r);
  }

  ctx.restore();
}

/**
 * Ghost / Mirage Afterimage Renderer for Shunpo & Kyōka Suigetsu
 */
export function drawAizenGhostSkin(ctx, x, y, angle = 0, r = 30, alpha = 0.45, formLevel = 0) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);

  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  const facingLeft = Math.abs(normAngle) > Math.PI / 2;
  ctx.rotate(angle);
  if (facingLeft) ctx.scale(1, -1);

  drawAizenPixelBody(ctx, r, formLevel);
  _drawAizenHair(ctx, r, facingLeft, formLevel);

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = formLevel >= 2 ? 'rgba(251, 113, 133, 0.9)' : 'rgba(192, 132, 252, 0.9)';
  ctx.stroke();

  ctx.restore();
}
