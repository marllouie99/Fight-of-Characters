// ─────────────────────────────────────────────────────────────────────────────
// DANTE FIGHTER SKIN (Rule 22, Rule 24, Rule 35)
// Canonical Toji/Sukuna/Gojo Proportions + 1:1 Offscreen Canvas Cache
// ─────────────────────────────────────────────────────────────────────────────

import { state } from '../../core/state.js';
import { CONFIG } from '../../core/config.js';
import { drawDanteDevilWings, drawDanteWeaponsAndSlashVFX } from '../weapons/danteWeaponGraphics.js';

let _danteHairImage = null;
let _danteHairLoading = false;
let _danteDevilHairImage = null;
let _danteDevilHairLoading = false;

export function _getDanteHairImage() {
  if (_danteHairImage && _danteHairImage.complete && _danteHairImage.naturalWidth > 0) {
    return _danteHairImage;
  }
  if (!_danteHairLoading && typeof Image !== 'undefined') {
    _danteHairLoading = true;
    const img = new Image();
    img.onload = () => {
      _danteHairImage = img;
      _danteHairLoading = false;
    };
    img.onerror = (e) => {
      console.warn('Failed to load Dante hair at Assets/model/dante/Dante-hair.png', e);
      _danteHairLoading = false;
    };
    img.src = (typeof CONFIG !== 'undefined' && CONFIG.dante?.assets?.hair) || 'Assets/model/dante/Dante-hair.png';
    _danteHairImage = img;
  }
  return _danteHairImage;
}

export function _getDanteDevilHairImage() {
  if (_danteDevilHairImage && _danteDevilHairImage.complete && _danteDevilHairImage.naturalWidth > 0) {
    return _danteDevilHairImage;
  }
  if (!_danteDevilHairLoading && typeof Image !== 'undefined') {
    _danteDevilHairLoading = true;
    const img = new Image();
    img.onload = () => {
      _danteDevilHairImage = img;
      _danteDevilHairLoading = false;
    };
    img.onerror = (e) => {
      console.warn('Failed to load Dante devil hair at Assets/model/dante/Dante-devil-hair.png', e);
      _danteDevilHairLoading = false;
    };
    img.src = (typeof CONFIG !== 'undefined' && CONFIG.dante?.assets?.devilHair) || 'Assets/model/dante/Dante-devil-hair.png';
    _danteDevilHairImage = img;
  }
  return _danteDevilHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getDanteHairImage();
  _getDanteDevilHairImage();
}

export function _drawDanteHair(ctx, r, facingLeft = false, isDevilForm = false) {
  const devilImg = isDevilForm ? _getDanteDevilHairImage() : null;
  const useDevilCrown = Boolean(isDevilForm && devilImg && devilImg.complete && devilImg.naturalWidth > 0);
  const hairImg = useDevilCrown ? devilImg : _getDanteHairImage();
  if (!hairImg || !hairImg.complete || hairImg.naturalWidth <= 0) return;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const custom = (typeof state !== 'undefined' && ((useDevilCrown && state.skinCustomizations?.dante_devil) || state.skinCustomizations?.dante)) || {};
  const wMult = custom.widthScale ?? 1.0;
  const hMult = custom.heightScale ?? 1.0;
  const offX = custom.offsetX ?? 0;
  const offY = custom.offsetY ?? 0;
  const rot = custom.angleOffset ?? 0;
  const flipX = custom.flipX ? -1 : 1;
  const flipY = custom.flipY ? -1 : 1;

  // Base Assets/model/dante/Dante-hair.png (1024x1024): visW=897, visH=920, centerX=511.5, topY=52
  // Devil Assets/model/dante/Dante-devil-hair.png (1024x1024): visW=987, visH=842, centerX=511.5, topY=76
  const visW = useDevilCrown ? 987 : 897;
  const visH = useDevilCrown ? 842 : 920;
  const topY = useDevilCrown ? 76 : 52;
  const centerX = 511.5;
  const crownOffset = useDevilCrown ? 1.80 : 1.44;
  const targetHairWidth = r * (useDevilCrown ? 3.15 : 3.04) * wMult;
  const targetHairHeight = r * (useDevilCrown ? 2.55 : 2.10) * hMult;
  const scaleX = targetHairWidth / visW;
  const scaleY = targetHairHeight / visH;
  const drawW = 1024 * scaleX;
  const drawH = 1024 * scaleY;
  const drawX = -centerX * scaleX + offX;
  const drawY = -r * crownOffset - topY * scaleY + offY;

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

function _renderDantePixelBody(destCtx, r, isDT = false) {
  destCtx.save();
  destCtx.imageSmoothingEnabled = false;
  destCtx.translate(destCtx.canvas.width / 2, destCtx.canvas.height / 2);

  const P = 2.0;
  const steps = Math.ceil((r + P) / P);

  // All clothing colors have luminance Y >= 24 for clear separation from #0E0F14 outline (Rule 24)
  const C = {
    outline: '#0E0F14',
    skinBase: isDT ? '#2A2736' : '#FEDBC0',
    skinHighlight: isDT ? '#3D384F' : '#FFF0E2',
    skinShadow: isDT ? '#1E1B28' : '#E9B796',
    coatBase: isDT ? '#991B1B' : '#B91C1C',
    coatHighlight: isDT ? '#EF4444' : '#DC2626',
    coatShadow: isDT ? '#6B1414' : '#7F1D1D',
    vestBase: '#2A2F3D',
    vestVein: isDT ? '#F87171' : '#3B4254',
    buckleSilver: '#CBD5E1',
    belt: '#3A1D24',
    pants: '#2B303E',
    pantsSeam: '#1F2430',
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
        // Zone 1: Pure faceless head dome (Rule 24)
        if (absNx > 0.72) destCtx.fillStyle = C.skinShadow;
        else if (absNx < 0.25 && ny < 0.05) destCtx.fillStyle = C.skinHighlight;
        else destCtx.fillStyle = C.skinBase;
      } else if (ny < 0.67) {
        // Zone 2: Red DMC Trench Coat flanking dark undershirt & silver chest strap
        if (absNx < 0.24) {
          destCtx.fillStyle = (Math.abs(gx) <= 0 && ny > 0.36) ? C.vestVein : C.vestBase;
        } else if (ny < 0.42 && absNx < 0.42) {
          destCtx.fillStyle = C.coatHighlight;
        } else if (Math.abs(absNx - 0.30) < 0.09 && Math.abs(ny - 0.50) < 0.07) {
          destCtx.fillStyle = C.buckleSilver;
        } else if (absNx > 0.72) {
          destCtx.fillStyle = C.coatShadow;
        } else {
          destCtx.fillStyle = C.coatBase;
        }
      } else if (ny < 0.78) {
        // Zone 3: Gunfighter Belt & Silver Buckle
        destCtx.fillStyle = (Math.abs(gx) <= 1) ? C.buckleSilver : C.belt;
      } else {
        // Zone 4: Dark trousers (Y >= 24)
        destCtx.fillStyle = (gx === 0) ? C.pantsSeam : C.pants;
      }
      destCtx.fillRect(px, py, P, P);
    }
  }
  destCtx.restore();
}

export function drawDantePixelBody(ctx, r, isDT = false) {
  const intR = Math.max(10, Math.round(r));
  if (typeof document === 'undefined') {
    _renderDantePixelBody(ctx, intR, isDT);
    return;
  }
  const key = `${intR}_${isDT ? 1 : 0}`;
  let cached = _bodyCache.get(key);
  if (!cached) {
    const P = 2.0;
    const steps = Math.ceil((intR + P) / P);
    const size = (steps * 2 + 1) * P;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    _renderDantePixelBody(canvas.getContext('2d'), intR, isDT);
    cached = { canvas, size };
    _bodyCache.set(key, cached);
  }
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cached.canvas, -cached.size / 2, -cached.size / 2);
  ctx.restore();
}

export function drawDanteSkin(ctx, fighter) {
  const r = fighter.r || (CONFIG?.dante?.r || 25);
  const isDT = Boolean(fighter.isDevilTrigger);
  const isPodium = Boolean(fighter._isWinnerReveal);
  const angle = isPodium ? 0 : (fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0));
  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  const facingLeft = Math.abs(normAngle) > Math.PI / 2;

  ctx.save();
  ctx.translate(fighter.x || 0, (fighter.y || 0) - (fighter.z || 0));
  ctx.rotate(angle);
  if (facingLeft) ctx.scale(1, -1);

  const txTimer = fighter._dtTransformTimer || 0;
  const txMax = Math.max(1, fighter._dtTransformMaxTimer || 54);
  const txP = txTimer > 0 ? Math.max(0, Math.min(1, 1 - txTimer / txMax)) : 1;

  // Sin Devil Trigger obsidian magma-veined wings behind body (bursts open at volcanic breakout txP >= 0.36)
  if (isDT && !isPodium && !fighter.hideWings && (txTimer <= 0 || txP >= 0.36)) {
    let wingOpen = 0.44;
    if (txTimer > 0) {
      if (txP < 0.78) wingOpen = 0.38 + Math.sin(((txP - 0.36) / 0.42) * (Math.PI / 2)) * 0.67;
      else wingOpen = 1.05 - ((txP - 0.78) / 0.22) * 0.61;
    }
    drawDanteDevilWings(ctx, r, wingOpen, (typeof state !== 'undefined' && state.frameCount) || 0);
  }

  // Layer 1: Pre-baked Pixel Body (Rule 35)
  drawDantePixelBody(ctx, r, isDT);

  // Brief molten incandescent demonic shell shimmer before volcanic breakout (FINALSMASH2 F24-F36)
  if (txTimer > 0 && txP < 0.38 && !fighter._isSilhouettePass) {
    const pulse = Math.sin((txP / 0.38) * Math.PI);
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1, r - 1.5), 0, Math.PI * 2);
    ctx.fillStyle = txP < 0.22 ? `rgba(255, 255, 255, ${(0.34 * pulse).toFixed(2)})` : `rgba(239, 68, 68, ${(0.42 * pulse).toFixed(2)})`;
    ctx.fill();
    ctx.restore();
  }

  // Layer 2: Silver-White Hair / Sin Devil Trigger Horned Crown Asset (Rule 22)
  const useDevilCrown = isDT && (txTimer <= 0 || txP >= 0.36);
  _drawDanteHair(ctx, r, facingLeft, useDevilCrown);

  // Layer 3: Rebellion + Ebony & Ivory Weapons & Canonical Lower-Flank Hands (Rule 20)
  if (!isPodium && !fighter._isSilhouettePass && !fighter._suppressWeaponsInSilhouettePass && !fighter.hideWeapon) {
    drawDanteWeaponsAndSlashVFX(ctx, fighter, r, facingLeft);
  }

  ctx.restore();
}
