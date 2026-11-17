// ───────────────────────────────────────────────────────────────────────────
// Vergil — Son of Sparda Skin & Body Model
// Canonical Manga Ink Standard (Rules 11, 22, 24, 32, 35)
// - 1:1 Offscreen Canvas Buffer Caching per (radius, form)
// - Zone 1..4 Vertical Proportions (Base DMC Coat & Seed of Sparda Devil Trigger)
// - Layer 2 Calibrated Silver Hair Overlay (Assets/model/vergil/Vergil-hair.png)
// - Zero Hands on Neutral Body (Weapons-Only Hand Anchoring)
// ───────────────────────────────────────────────────────────────────────────

import { state } from '../../core/state.js';
import { CONFIG } from '../../core/config.js';

let _vergilHairImage = null;
let _vergilHairLoading = false;

export function _getVergilHairImage() {
  if (_vergilHairImage && _vergilHairImage.complete && _vergilHairImage.naturalWidth > 0) {
    return _vergilHairImage;
  }
  const hairSrc = CONFIG.vergil?.assets?.hair || 'Assets/model/vergil/Vergil-hair.png';
  if (!_vergilHairLoading && typeof Image !== 'undefined') {
    _vergilHairLoading = true;
    const img = new Image();
    img.onload = () => { _vergilHairImage = img; _vergilHairLoading = false; };
    img.onerror = () => { _vergilHairLoading = false; };
    img.src = `${hairSrc}?v=2`;
    _vergilHairImage = img;
  }
  return _vergilHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getVergilHairImage();
}

/**
 * Draws Vergil's calibrated silver pixel-art hair overlay (Assets/model/vergil/Vergil-hair.png).
 */
export function _drawVergilHair(ctx, r, facingLeft = false, formLevel = 0) {
  const hairImg = _getVergilHairImage();
  if (!hairImg || !hairImg.complete || (hairImg.naturalWidth <= 0 && hairImg.width <= 0)) return;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const custom = (typeof state !== 'undefined' && state.skinCustomizations?.vergil) || {};
  const wMult = custom.widthScale ?? 1.0;
  const hMult = custom.heightScale ?? 1.0;
  const offX = custom.offsetX ?? 0;
  const offY = custom.offsetY ?? 0;
  const rot = custom.angleOffset ?? 0;
  const flipX = custom.flipX ? -1 : 1;
  const flipY = custom.flipY ? -1 : 1;

  // Calibrated from exact bbox of front-facing Assets/model/vergil/Vergil-hair.png (1024x1024):
  // visW=738, visH=630, centerX=512.0, topY=66
  const targetHairWidth = r * 2.66 * wMult;
  const targetHairHeight = r * 1.88 * hMult;
  const scaleX = targetHairWidth / 738;
  const scaleY = targetHairHeight / 630;
  const drawW = 1024 * scaleX;
  const drawH = 1024 * scaleY;
  const drawX = -512.0 * scaleX + offX;
  const drawY = -r * 1.38 - 66 * scaleY + offY;

  if (rot !== 0 || flipX !== 1 || flipY !== 1) {
    ctx.translate(drawX + drawW / 2, drawY + drawH / 2);
    if (rot !== 0) ctx.rotate(rot);
    if (flipX !== 1 || flipY !== 1) ctx.scale(flipX, flipY);
    ctx.drawImage(hairImg, -drawW / 2, -drawH / 2, drawW, drawH);
  } else {
    ctx.drawImage(hairImg, drawX, drawY, drawW, drawH);
  }

  // Seed of Sparda (Devil Trigger / SDT Form): Slept demon crown horns & glowing third-crest
  if (formLevel >= 1) {
    // Swept obsidian-azure demon horns flanking temple crown
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * r * 0.42, -r * 0.72);
      ctx.lineTo(side * r * 1.05, -r * 1.36);
      ctx.lineTo(side * r * 0.68, -r * 0.56);
      ctx.closePath();
      ctx.fillStyle = '#312E81';
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#0E0F14';
      ctx.stroke();

      // Inner neon-cyan vein along horn ridge
      ctx.beginPath();
      ctx.moveTo(side * r * 0.52, -r * 0.74);
      ctx.lineTo(side * r * 0.94, -r * 1.24);
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = '#38BDF8';
      ctx.stroke();
    }

    // Glowing Sin Devil Trigger forehead diamond crest
    const cy = -r * 0.40;
    ctx.beginPath();
    ctx.moveTo(0, cy - 4.2);
    ctx.lineTo(3.4, cy);
    ctx.lineTo(0, cy + 4.2);
    ctx.lineTo(-3.4, cy);
    ctx.closePath();
    ctx.fillStyle = '#E0F2FE';
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#E11D48';
    ctx.stroke();
  }

  ctx.restore();
}

const _cachedVergilBodies = new Map();

function _renderVergilPixelBodyToCanvas(destCtx, r, formLevel = 0) {
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
      let col = '#FADCCB';

      if (formLevel >= 1) {
        // ── Seed of Sparda / Sin Devil Trigger Form ──
        if (ny < 0.28) {
          // Demonized pale slate-violet face dome (Rule 24: clean faceless dome)
          col = '#D6D8F0';
          if (ny < -0.25 && absNx < 0.45) col = '#EEF2FF';
          else if (absNx > 0.60) col = '#A3A8CE';
        } else if (ny < 0.66) {
          // High demonic armored coat with crimson/cobalt vents & glowing cyan core
          const collarHeight = 0.28 + Math.max(0, 0.28 - absNx * 0.42) * 0.22;
          if (absNx < 0.10) {
            col = (ny > 0.36 && ny < 0.60) ? '#38BDF8' : '#E0F2FE'; // SDT glowing cyan chest core
          } else if (absNx < 0.20) {
            col = '#991B1B'; // Crimson Sparda rib trim
          } else if (ny < collarHeight) {
            col = '#1E3A8A'; // Glowing cobalt high collar edge
          } else if (absNx > 0.56) {
            col = '#3B2B54'; // Armored obsidian shoulder pauldrons
          } else {
            col = ((Math.floor(ry / P) + Math.floor(Math.abs(rx) / P)) % 5 === 0) ? '#4338CA' : '#2E2344';
          }
        } else if (ny < 0.78) {
          // Sparda Devil Trigger armored waist belt
          col = absNx < 0.16 ? '#E11D48' : '#1F2937';
          if (absNx >= 0.16 && ny > 0.68 && ny < 0.74) col = '#38BDF8';
        } else {
          // Lower Sin Devil Trigger greaves (luminance >= 24)
          col = absNx < 0.06 ? '#0E0F14' : (absNx < 0.35 ? '#2D2744' : '#242038');
        }
      } else {
        // ── Base Form: Son of Sparda Coat & Vest ──
        if (ny < 0.30) {
          // Zone 1: Pure Fair Face Dome (Rule 24 — zero eyes/mouth/baked hair)
          col = '#FADCCB';
          if (ny < -0.25 && absNx < 0.45) col = '#FFF2E8';
          else if (absNx > 0.62) col = '#E4BA9E';
        } else if (ny < 0.65) {
          // Zone 2: Signature DMC Dark Cobalt Coat + Blue-Silver Vest + Gold Trim
          const collarV = 0.30 + (1 - Math.min(1, absNx / 0.45)) * 0.16;
          if (absNx < 0.08) {
            // Center necktie / cravat placket
            col = ny < 0.46 ? '#E2E8F0' : '#1E40AF';
          } else if (absNx < 0.18) {
            // Inner blue brocade vest
            col = (ny < 0.38) ? '#38BDF8' : '#1E3A8A';
          } else if (absNx < 0.27 && ny < collarV + 0.12) {
            // Gold-silver lapel piping
            col = ny < 0.42 ? '#FACC15' : '#64748B';
          } else if (ny < 0.38 && absNx < 0.56) {
            // Upturned high collar rim
            col = '#334155';
          } else {
            // Deep navy-slate Son of Sparda coat (luminance well above 24)
            col = ((gx + gy) % 6 === 0 && absNx > 0.40) ? '#2C3C54' : '#232F44';
          }
        } else if (ny < 0.78) {
          // Zone 3: Coat Waist Belt & Metallic Silver Clasp Buckle
          if (absNx < 0.16 && ny > 0.67 && ny < 0.76) {
            col = absNx < 0.08 ? '#E2E8F0' : '#94A3B8';
          } else {
            col = '#334155';
          }
        } else {
          // Zone 4: Dark Charcoal Trousers & Center Seam
          col = absNx < 0.06 ? '#0E0F14' : (absNx < 0.36 ? '#2B3447' : '#222A3A');
        }
      }

      destCtx.fillStyle = col;
      destCtx.fillRect(px, py, P, P);
    }
  }

  destCtx.restore();
}

export function drawVergilPixelBody(ctx, r, formLevel = 0) {
  const intR = Math.max(10, Math.round(r));
  const fKey = `${intR}_${formLevel >= 1 ? 1 : 0}`;
  let cached = _cachedVergilBodies.get(fKey);

  if (!cached && typeof document !== 'undefined') {
    const P = 2.0;
    const steps = Math.ceil((intR + P) / P);
    const size = (steps * 2 + 1) * P;
    cached = document.createElement('canvas');
    cached.width = size;
    cached.height = size;
    const cctx = cached.getContext('2d');
    _renderVergilPixelBodyToCanvas(cctx, intR, formLevel);
    _cachedVergilBodies.set(fKey, cached);
  }

  if (!cached) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const size = cached.width;
  ctx.drawImage(cached, -size / 2, -size / 2);
  ctx.restore();
}

function _getParryShakeX(fighter) {
  const t = fighter?.parryShakeTimer || 0;
  return t > 0 ? Math.sin(t * 1.9) * 3.2 * Math.min(1, t / 8) : 0;
}

/**
 * Main Skin Renderer for Vergil (Rule 24 & 32 World-Space Contract)
 */
export function drawVergilSkin(ctx, fighter) {
  const r = fighter.r || 30;
  const formLevel = fighter.vergilForm || 0;
  const shakeX = !fighter._isSilhouettePass ? _getParryShakeX(fighter) : 0;

  ctx.save();
  ctx.translate((fighter.x || 0) + shakeX, (fighter.y || 0) - (fighter.z || 0));

  const angle = fighter._isWinnerReveal ? 0 : (fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0));
  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  const facingLeft = Math.abs(normAngle) > Math.PI / 2;
  const standUpright = Boolean(
    fighter.jceState?.active &&
    (fighter.jceState.phase === 'charge' || fighter.jceState.phase === 'slash' || fighter.jceState.phase === 'shatter')
  );
  ctx.rotate(standUpright ? (facingLeft ? Math.PI : 0) : angle);
  if (facingLeft && !fighter.isSpinning) {
    ctx.scale(1, -1);
  }

  // Layer 1: Pre-baked Pixel Body Circle
  drawVergilPixelBody(ctx, r, formLevel);

  // Layer 2: Calibrated Silver Hair Overlay (+ Seed of Sparda horns)
  _drawVergilHair(ctx, r, facingLeft, formLevel);

  // Layer 2.5: Roaring Knight-style Parry White Flash Overlay
  if (!fighter._isSilhouettePass && (fighter.parryWhiteFlashTimer || 0) > 0) {
    const flashAlpha = Math.min(0.85, (fighter.parryWhiteFlashTimer / 6) * 0.78);
    ctx.fillStyle = `rgba(255, 255, 255, ${(flashAlpha * 0.55).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(0, 0, r + 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, ${flashAlpha.toFixed(2)})`;
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }

  // Rule 32: Crisp Outer Black Outline
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
 * Spectral Ghost / Doppelganger Mirror Clone Renderer (State 1220 & Trick/Rapid Slash afterimages)
 */
export function drawVergilGhostSkin(ctx, x, y, angle = 0, r = 30, alpha = 0.45, formLevel = 0, isDoppelganger = false) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);

  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  const facingLeft = Math.abs(normAngle) > Math.PI / 2;
  ctx.rotate(angle);
  if (facingLeft) ctx.scale(1, -1);

  drawVergilPixelBody(ctx, r, formLevel);
  _drawVergilHair(ctx, r, facingLeft, formLevel);

  // Doppelganger azure spectral aura wash inside body outline
  if (isDoppelganger) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.34)';
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.lineWidth = isDoppelganger ? 2.4 : 2.0;
  ctx.strokeStyle = formLevel >= 1 ? 'rgba(225, 29, 72, 0.92)' : 'rgba(56, 189, 248, 0.92)';
  ctx.stroke();

  ctx.restore();
}
