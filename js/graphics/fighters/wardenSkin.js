// ═══════════════════════════════════════════════════════════════════════════
// THE WARDEN (Minecraft: The Deep Dark) — Upright Minimalist Pixel Art Skin
// Adheres strictly to:
// - Rule 11: Prohibition of shadowBlur CPU filters
// - Rule 19: Upright Minimalist Manga Aesthetic
// - Rule 20: Canonical Symmetrical Hands (±r * 0.82, +r * 0.38)
// - Rule 22: Dedicated Hair/Head Asset Model (Assets/model/warden/warden-hair.png)
// - Rule 24: Universal Character Body Model (Toji Baseline Standard, r = 30)
// - Rule 32: Universal Character Black Outline Standard (#0E0F14)
// ═══════════════════════════════════════════════════════════════════════════

import { state } from '../../core/state.js';
import { getHandSize } from '../../core/config.js';
import { drawPixelHand } from '../renderers/fighterRenderer.js';

let _wardenHairImage = null;
let _wardenHairImageLoading = false;

export function _getWardenHairImage() {
  if (_wardenHairImage && _wardenHairImage.complete && _wardenHairImage.naturalWidth > 0) {
    return _wardenHairImage;
  }
  if (!_wardenHairImageLoading && typeof Image !== 'undefined') {
    _wardenHairImageLoading = true;
    const img = new Image();
    img.onload = () => {
      _wardenHairImage = img;
      _wardenHairImageLoading = false;
    };
    img.onerror = (e) => {
      console.warn('Failed to load Warden sculk horns at Assets/model/warden/warden-hair.png', e);
      _wardenHairImageLoading = false;
    };
    img.src = 'Assets/model/warden/warden-hair.png?v=2';
    _wardenHairImage = img;
  }
  return _wardenHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getWardenHairImage();
}

/**
 * Draws The Warden's 16-bit Sculk Antenna Horns (Rule 22).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} r
 * @param {boolean} [facingLeft=false]
 */
export function _drawWardenHair(ctx, r, facingLeft = false) {
  const hairImg = _getWardenHairImage();
  if (hairImg && hairImg.complete && hairImg.naturalWidth > 0) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const custom = (typeof state !== 'undefined' && state.skinCustomizations?.warden) || {};
    const wMult = custom.widthScale ?? 1.0;
    const hMult = custom.heightScale ?? 1.0;
    const offX = custom.offsetX ?? 0;
    const offY = custom.offsetY ?? 0;
    const rot = custom.angleOffset ?? 0;
    const flipX = custom.flipX ? -1 : 1;
    const flipY = custom.flipY ? -1 : 1;

    // warden-hair.png (1024x1024) Authentic 16-bit Minecraft Sculk Sensor Antennas:
    // Visible Bounding Box: X [49, 974] (width 926, center 511.5)
    //                       Y [262, 749] (height 488, top apex 262)
    // Calibrated to sprout from upper temples of head dome:
    const targetHairWidth = r * 3.30 * wMult;
    const targetHairHeight = r * 1.75 * hMult;
    const scaleX = targetHairWidth / 926;
    const scaleY = targetHairHeight / 488;
    const drawW = 1024 * scaleX;
    const drawH = 1024 * scaleY;
    const drawX = -511.5 * scaleX + offX;
    const drawY = -r * 1.58 - 262 * scaleY + offY;

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
 * Offscreen cached procedural pixel-art body (Rule 24 Toji Standard).
 */
let _cachedWardenBodyCanvas = null;
let _cachedWardenBodyR = 0;

function _renderWardenPixelBodyToCanvas(destCtx, r) {
  destCtx.save();
  destCtx.imageSmoothingEnabled = false;
  // Rule 24 (Toji Standard): center the 1:1 buffer so negative grid coords are not clipped
  destCtx.clearRect(0, 0, destCtx.canvas.width, destCtx.canvas.height);
  destCtx.translate(destCtx.canvas.width / 2, destCtx.canvas.height / 2);

  const P = 2.0;
  const steps = Math.ceil((r + P) / P);
  const effectiveR = r - 0.2;

  // Authentic Minecraft Deep Dark Palette
  const OUTLINE = '#0E0F14';
  const SCULK_VOID = '#020608';
  const SCULK_DARK = '#051318';
  const SCULK_BASE = '#092128';
  const SCULK_MID = '#0E313B';
  const SCULK_LIGHT = '#144452';
  const SCULK_CYAN = '#00F5D4';
  const SCULK_CYAN_DIM = '#0C9486';
  const BONE_LIGHT = '#E5DEC9';
  const BONE_MID = '#C4BCA2';
  const BONE_DARK = '#7A735E';

  function sculkNoise(gx, gy) {
    const n = Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  for (let gy = -steps; gy <= steps; gy++) {
    for (let gx = -steps; gx <= steps; gx++) {
      const rx = gx * P;
      const ry = gy * P;
      const dist = Math.hypot(rx, ry);
      if (dist > effectiveR) continue;

      // Rule 24: 4-Neighbor manga ink outline test
      const isBorder =
        Math.hypot((gx + 1) * P, ry) > effectiveR ||
        Math.hypot((gx - 1) * P, ry) > effectiveR ||
        Math.hypot(rx, (gy + 1) * P) > effectiveR ||
        Math.hypot(rx, (gy - 1) * P) > effectiveR;

      if (isBorder) {
        destCtx.fillStyle = OUTLINE;
        destCtx.fillRect(rx - P / 2, ry - P / 2, P, P);
        continue;
      }

      const absRx = Math.abs(rx);
      const noise = sculkNoise(gx, gy);

      // ── ZONE 1: Head & Gaping Sculk Maw (ry < r * 0.24) ──
      if (ry < r * 0.24) {
        // Gaping Sculk Maw (-r * 0.04 <= ry < r * 0.22 and absRx < r * 0.52)
        if (ry >= -r * 0.04 && ry < r * 0.22 && absRx < r * 0.52) {
          const isTeethRow = (ry < 0) || (ry >= r * 0.16 && absRx > r * 0.18);
          if (isTeethRow && ((Math.round(absRx / P)) % 2 === 0)) {
            destCtx.fillStyle = SCULK_MID;
          } else {
            destCtx.fillStyle = SCULK_VOID;
          }
        }
        // Forehead & Crown Sculk Dome with authentic sculk catalyst cyan speckles
        else {
          if (ry < -r * 0.10 && noise > 0.65) {
            destCtx.fillStyle = (noise > 0.85) ? SCULK_CYAN : SCULK_CYAN_DIM;
          } else {
            destCtx.fillStyle = (noise > 0.5) ? SCULK_MID : SCULK_BASE;
          }
        }
      }
      // ── ZONE 2: Shoulders & Ribcage (r * 0.24 <= ry < r * 0.78) ──
      else if (ry < r * 0.78) {
        // Shoulder Bone Plates on outer flanks (ry < r * 0.54 and absRx >= r * 0.52)
        if (absRx >= r * 0.52 && ry < r * 0.54) {
          const boneChance = (r * 0.54 - ry) / (r * 0.30);
          if (noise < boneChance * 0.85) {
            destCtx.fillStyle = (noise > 0.4) ? BONE_LIGHT : BONE_MID;
          } else {
            destCtx.fillStyle = (noise > 0.5) ? SCULK_BASE : SCULK_DARK;
          }
        }
        // 4 Horizontal Bone Rib Pairs (absRx >= r * 0.16 and absRx < r * 0.52)
        else if (absRx >= r * 0.16 && absRx < r * 0.52) {
          const ribY = ry - r * 0.26;
          const ribIndex = Math.floor(ribY / (P * 2.1));
          const isRibRow = (ribIndex % 2 === 0);

          if (isRibRow && ribIndex >= 0 && ribIndex <= 6) {
            destCtx.fillStyle = (ribIndex === 0 || (Math.floor(ribY) % 4 === 0)) ? BONE_LIGHT : BONE_MID;
          } else {
            destCtx.fillStyle = SCULK_DARK;
          }
        }
        // Central Soul Cavity (absRx < r * 0.16)
        else {
          if (noise > 0.52) {
            destCtx.fillStyle = (noise > 0.78) ? SCULK_CYAN : SCULK_CYAN_DIM;
          } else {
            destCtx.fillStyle = SCULK_VOID;
          }
        }
      }
      // ── ZONE 3: Abdomen & Lower Garment (ry >= r * 0.78) ──
      else {
        if (noise > 0.86) {
          destCtx.fillStyle = SCULK_CYAN_DIM;
        } else {
          destCtx.fillStyle = (noise > 0.5) ? SCULK_BASE : SCULK_DARK;
        }
      }

      destCtx.fillRect(rx - P / 2, ry - P / 2, P, P);
    }
  }

  destCtx.restore();
}

function drawWardenPixelBody(ctx, r) {
  const intR = Math.round(r);
  const P = 2.0;
  const steps = Math.ceil((intR + P) / P);
  const size = (steps * 2 + 1) * P;

  if (!_cachedWardenBodyCanvas || _cachedWardenBodyR !== intR) {
    if (!_cachedWardenBodyCanvas) {
      _cachedWardenBodyCanvas = document.createElement('canvas');
    }
    _cachedWardenBodyCanvas.width = size;
    _cachedWardenBodyCanvas.height = size;
    const cctx = _cachedWardenBodyCanvas.getContext('2d');
    _renderWardenPixelBodyToCanvas(cctx, intR);
    _cachedWardenBodyR = intR;
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(_cachedWardenBodyCanvas, -size / 2, -size / 2);
  ctx.restore();
}

/**
 * Main Skin Renderer for The Warden (Rule 32 compliant world-space entry).
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} fighter
 */
export function drawWardenSkin(ctx, fighter) {
  const r = fighter.r || 30;

  ctx.save();
  ctx.translate(fighter.x || 0, (fighter.y || 0) - (fighter.z || 0));

  // 1. Orientation & Mirroring (Strictly Upright POV - Zero Body Rotation)
  const angle = fighter._isStudioDummy
    ? (fighter.gunAngle ?? 0)
    : (fighter._isWinnerReveal ? 0 : (fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0)));
  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  const facingLeft = Math.abs(normAngle) > Math.PI / 2;

  if (facingLeft && !fighter.isSpinning) {
    ctx.scale(-1, 1);
  }

  // 2. Procedural Pixel-Art Body (Rule 24 Toji Standard)
  drawWardenPixelBody(ctx, r);

  // 3. Dynamic Pulsing Soul Cavity (Ribcage Souls)
  // Subtle ambient glow & discrete pixel soul embers trapped inside the chest cavity
  const anger = fighter.anger || 0;
  const isEnraged = Boolean(fighter.isEnraged || anger >= 100);
  const pulsePhase = (Date.now() / (isEnraged ? 140 : 380)) % 1;
  const heartGlow = Math.sin(pulsePhase * Math.PI);
  const coreAlpha = 0.35 + heartGlow * 0.55;

  ctx.save();
  // Discrete pulsing soul ember blocks in the central rib cavity (preserves bone ribs!)
  for (let i = 0; i < 6; i++) {
    const sy = r * 0.30 + (i % 3) * (r * 0.14) + Math.sin(pulsePhase * Math.PI * 2 + i) * 1.5;
    const sx = (i % 2 === 0 ? -1 : 1) * (r * 0.05);
    const sz = (i % 2 === 0) ? 3.0 : 2.5;

    ctx.fillStyle = (isEnraged || i % 2 === 0)
      ? `rgba(0, 245, 212, ${coreAlpha})`
      : `rgba(12, 148, 134, ${coreAlpha * 0.8})`;
    ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
  }
  ctx.restore();

  // 4. Enraged Sculk Aura Wisps (Rule 11 compliant flat/translucent fills)
  if (isEnraged && !fighter._isSilhouettePass) {
    ctx.save();
    const auraTime = Date.now() / 180;
    for (let i = 0; i < 4; i++) {
      const aAng = auraTime + (i * Math.PI / 2);
      const aDist = r + 4 + Math.sin(auraTime * 2 + i) * 3;
      const ax = Math.cos(aAng) * aDist;
      const ay = Math.sin(aAng) * (aDist * 0.85);
      ctx.beginPath();
      ctx.arc(ax, ay, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 245, 212, 0.45)';
      ctx.fill();
    }
    ctx.restore();
  }

  // 5. Mandatory Universal Character Black Outline Standard (Rule 32)
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();
  ctx.restore();

  // 6. Sculk Antenna Horns (Rule 22)
  _drawWardenHair(ctx, r, facingLeft);

  // 7. Canonical Symmetrical Hands (Rule 20) — Warden Sculk & Bone Claw Fists
  const handRadius = getHandSize ? getHandSize(r * 0.30, fighter) : r * 0.30;
  const SCULK_FIST_BASE = '#092128';
  const BONE_CLAW = '#E5DEC9';
  const SCULK_CYAN = '#00F5D4';
  const OUTLINE = '#0E0F14';

  for (const hx of [-r * 0.82, r * 0.82]) {
    ctx.save();
    ctx.translate(hx, r * 0.38);

    // Sculk fist base circle
    ctx.beginPath();
    ctx.arc(0, 0, handRadius, 0, Math.PI * 2);
    ctx.fillStyle = SCULK_FIST_BASE;
    ctx.fill();
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    // Ivory bone claws on upper knuckle rim
    ctx.beginPath();
    ctx.arc(0, -handRadius * 0.30, handRadius * 0.58, Math.PI, Math.PI * 2);
    ctx.fillStyle = BONE_CLAW;
    ctx.fill();

    // Glowing cyan soul knuckle
    ctx.beginPath();
    ctx.arc(0, handRadius * 0.20, handRadius * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = isEnraged ? '#FFFFFF' : SCULK_CYAN;
    ctx.fill();

    ctx.restore();
  }

  // 8. Status Overlays
  if (typeof fighter.drawStatusOverlays === 'function') {
    fighter.drawStatusOverlays(ctx, r);
  }

  ctx.restore();
}
