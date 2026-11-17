// ─────────────────────────────────────────────
// HAJIME KASHIMO FIGHTER SKIN (Rule 22 & Rule 24)
// Canonical Toji/Sukuna/Gojo Proportions + 1:1 Offscreen Canvas Cache
// ─────────────────────────────────────────────

import { state } from '../../core/state.js';
import { CONFIG } from '../../core/config.js';
import { drawKashimoStaffAndSlashVFX } from '../weapons/kashimoWeaponGraphics.js';

let _kashimoHairImage = null;
let _kashimoHairLoading = false;

export function _getKashimoHairImage() {
  if (_kashimoHairImage && _kashimoHairImage.complete && _kashimoHairImage.naturalWidth > 0) {
    return _kashimoHairImage;
  }
  if (!_kashimoHairLoading && typeof Image !== 'undefined') {
    _kashimoHairLoading = true;
    const img = new Image();
    img.onload = () => {
      _kashimoHairImage = img;
      _kashimoHairLoading = false;
    };
    img.onerror = (e) => {
      console.warn('Failed to load Kashimo hair at Assets/model/kashimo/Kashimo-hair.png', e);
      _kashimoHairLoading = false;
    };
    img.src = 'Assets/model/kashimo/Kashimo-hair.png';
    _kashimoHairImage = img;
  }
  return _kashimoHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getKashimoHairImage();
}

export function _drawKashimoHair(ctx, r, facingLeft = false) {
  const hairImg = _getKashimoHairImage();
  if (!hairImg || !hairImg.complete || hairImg.naturalWidth <= 0) return;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const custom = (typeof state !== 'undefined' && state.skinCustomizations?.kashimo) || {};
  const wMult = custom.widthScale ?? 1.0;
  const hMult = custom.heightScale ?? 1.0;
  const offX = custom.offsetX ?? 0;
  const offY = custom.offsetY ?? 0;
  const rot = custom.angleOffset ?? 0;
  const flipX = custom.flipX ? -1 : 1;
  const flipY = custom.flipY ? -1 : 1;

  // Assets/model/kashimo/Kashimo-hair.png (1024x1024), visible box x:[51..982] (932), y:[61..901] (841)
  const targetHairWidth = r * 3.05 * wMult;
  const targetHairHeight = r * 2.15 * hMult;
  const scaleX = targetHairWidth / 932;
  const scaleY = targetHairHeight / 841;
  const drawW = 1024 * scaleX;
  const drawH = 1024 * scaleY;
  const drawX = -516.5 * scaleX + offX;
  const drawY = -r * 1.48 - 61 * scaleY + offY;

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

const _bodyCache = new Map();

function _renderKashimoPixelBody(destCtx, r, isAmber = false) {
  destCtx.save();
  destCtx.imageSmoothingEnabled = false;
  destCtx.translate(destCtx.canvas.width / 2, destCtx.canvas.height / 2);

  const P = 2.0;
  const steps = Math.ceil((r + P) / P);

  const C = {
    outline: '#0E0F14',
    skinBase: isAmber ? '#EFE9FF' : '#FEDBC0',
    skinHighlight: '#FFF0E2',
    skinShadow: isAmber ? '#C7B8FF' : '#E9B796',
    collar: isAmber ? '#2E1F4D' : '#262D3D',
    collarLight: isAmber ? '#4C3380' : '#3A455E',
    robeBase: isAmber ? '#2D264A' : '#CBD5E1',
    robeHighlight: isAmber ? '#433875' : '#E2E8F0',
    robeShadow: isAmber ? '#1E1933' : '#94A3B8',
    lightningAccent: isAmber ? '#C084FC' : '#38BDF8',
    belt: '#1E2433',
    pants: '#2A3244',
    pantsSeam: '#1B202C',
  };

  for (let gy = -steps; gy <= steps; gy++) {
    for (let gx = -steps; gx <= steps; gx++) {
      const rx = gx * P;
      const ry = gy * P;
      const dist = Math.hypot(rx, ry);
      if (dist > r) continue;

      const isBorder = (
        Math.hypot((gx + 1) * P, gy * P) > r ||
        Math.hypot((gx - 1) * P, gy * P) > r ||
        Math.hypot(gx * P, (gy + 1) * P) > r ||
        Math.hypot(gx * P, (gy - 1) * P) > r
      );

      const px = rx - P / 2;
      const py = ry - P / 2;
      if (isBorder) {
        destCtx.fillStyle = C.outline;
        destCtx.fillRect(px, py, P, P);
        continue;
      }

      const ny = ry / r;
      const absNx = Math.abs(rx / r);

      if (ny < 0.30) {
        // Zone 1: Pure faceless head dome
        if (absNx > 0.72) destCtx.fillStyle = C.skinShadow;
        else if (absNx < 0.25 && ny < 0.05) destCtx.fillStyle = C.skinHighlight;
        else destCtx.fillStyle = C.skinBase;
      } else if (ny < 0.68) {
        // Zone 2: High collar scarf + JJK haori robe + cyan lightning trim
        if (ny < 0.42) {
          destCtx.fillStyle = (Math.abs(gx) % 3 === 0) ? C.collarLight : C.collar;
        } else if (gx === 0) {
          destCtx.fillStyle = C.lightningAccent;
        } else if (absNx > 0.70) {
          destCtx.fillStyle = C.robeShadow;
        } else if (absNx < 0.30) {
          destCtx.fillStyle = C.robeHighlight;
        } else {
          destCtx.fillStyle = C.robeBase;
        }
      } else if (ny < 0.78) {
        // Zone 3: Obi belt + lightning cord knot
        destCtx.fillStyle = (Math.abs(gx) <= 1) ? C.lightningAccent : C.belt;
      } else {
        // Zone 4: Hakama trousers (Y >= 24)
        destCtx.fillStyle = (gx === 0) ? C.pantsSeam : C.pants;
      }
      destCtx.fillRect(px, py, P, P);
    }
  }
  destCtx.restore();
}

export function drawKashimoPixelBody(ctx, r, isAmber = false) {
  const intR = Math.max(10, Math.round(r));
  if (typeof document === 'undefined') {
    _renderKashimoPixelBody(ctx, intR, isAmber);
    return;
  }
  const key = `${intR}_${isAmber ? 1 : 0}`;
  let cached = _bodyCache.get(key);
  if (!cached) {
    const P = 2.0;
    const steps = Math.ceil((intR + P) / P);
    const size = (steps * 2 + 1) * P;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    _renderKashimoPixelBody(canvas.getContext('2d'), intR, isAmber);
    cached = { canvas, size };
    _bodyCache.set(key, cached);
  }
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cached.canvas, -cached.size / 2, -cached.size / 2);
  ctx.restore();
}

export function drawKashimoSkin(ctx, fighter) {
  const r = fighter.r || (CONFIG?.kashimo?.r || 25);
  const isAmber = Boolean(fighter.isAmberForm);
  const isPodium = Boolean(fighter._isWinnerReveal);
  const angle = isPodium ? 0 : (fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0));
  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  const facingLeft = Math.abs(normAngle) > Math.PI / 2;

  ctx.save();
  ctx.translate(fighter.x || 0, (fighter.y || 0) - (fighter.z || 0));
  ctx.rotate(angle);
  if (facingLeft) ctx.scale(1, -1);

  // Layer 1: Pre-baked Pixel Body
  drawKashimoPixelBody(ctx, r, isAmber);

  // Layer 2: Authentic Hair Overlay
  _drawKashimoHair(ctx, r, facingLeft);

  // Layer 1.5: Mandatory 2.0px #0E0F14 outer black outline (Rule 32)
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();

  if (typeof fighter.drawStatusOverlays === 'function' && !fighter._isSilhouettePass) {
    fighter.drawStatusOverlays(ctx, r);
  }

  // Layer 3: Nyoi Staff + Canonical Weapon-Anchored Hand (Rule 20)
  const hideWeapons = Boolean(fighter._suppressWeaponsInSilhouettePass || fighter.hideWeapon || (typeof state !== 'undefined' && state.showSkinOnly));
  if (!hideWeapons) {
    drawKashimoStaffAndSlashVFX(ctx, fighter, r, facingLeft);
  }

  ctx.restore();
}
