// ───────────────────────────────────────────────────────────────────────────
// JEVIL (Deltarune Ch.1) Weapon, Devilsknife, Suit Bullets & Chaos VFX
// Adheres strictly to:
// - Rule 11: Zero ctx.shadowBlur
// - Rule 15: Double-tapered crescent slash + recovery eraser wipe
// - Rule 20: Canonical single-source hand gripping Devilsknife hilt
// - Rule 26: Sequential staggered concentric shockwave ripples
// - Rule 30: 5-Phase Melee Swing Kinematics + Connected Arm Linkages
// - Rule 35: Pre-baked offscreen radial glows & integer imageSmoothing=false
// ───────────────────────────────────────────────────────────────────────────

import { getHandSize } from '../../core/config.js';
import { state } from '../../core/state.js';
import { drawPixelHand } from '../renderers/fighterRenderer.js';

const _jevilSprites = {};
let _jevilPreloaded = false;

export function _preloadJevilWeaponSprites() {
  if (_jevilPreloaded || typeof Image === 'undefined') return;
  _jevilPreloaded = true;
  const manifest = {
    devilsknife: 'Assets/model/jevil/Devilsknife.png?v=1',
    spade: 'Assets/model/jevil/BulletSpade.png?v=1',
    club: 'Assets/model/jevil/BulletClub.png?v=1',
    diamond: 'Assets/model/jevil/BulletDiamond.png?v=1',
    heart: 'Assets/model/jevil/BulletHeart.png?v=1',
    bombSpade: 'Assets/model/jevil/BombSpade.png?v=1',
    bombClub: 'Assets/model/jevil/BombClub.png?v=1',
    bombDiamond: 'Assets/model/jevil/BombDiamond.png?v=1',
    bombHeart: 'Assets/model/jevil/BombHeart.png?v=1',
    merryGoRound: 'Assets/model/jevil/BulletMerryGoRound.png?v=1',
  };
  for (const [k, src] of Object.entries(manifest)) {
    const img = new Image();
    img.src = src;
    _jevilSprites[k] = img;
  }
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _preloadJevilWeaponSprites();
}

function _getReady(key) {
  _preloadJevilWeaponSprites();
  const img = _jevilSprites[key];
  return (img && img.complete && img.naturalWidth > 0) ? img : null;
}

const _glowCache = new Map();
function _getGlow(colorHex) {
  if (typeof document === 'undefined') return null;
  if (_glowCache.has(colorHex)) return _glowCache.get(colorHex);
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const gctx = c.getContext('2d');
  if (gctx) {
    const grad = gctx.createRadialGradient(48, 48, 4, 48, 48, 46);
    grad.addColorStop(0, colorHex);
    grad.addColorStop(0.45, colorHex + '66');
    grad.addColorStop(1, colorHex + '00');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 96, 96);
  }
  _glowCache.set(colorHex, c);
  return c;
}

function _getSwingOffsets(fighter) {
  if (!fighter || !fighter.isMeleeSwinging) {
    return { lunge: 0, offY: 0, bladeRot: 0, swingArcSign: 1, showSlash: false, slashP: 0, recoveryP: 0 };
  }
  const phase = fighter.meleePhase || 0;
  const p = Math.min(1, Math.max(0, fighter.meleePhaseProgress || 0));
  const flip = fighter.meleeComboFlip ? -1 : 1;
  if (phase === 1) {
    return { lunge: -6 * p, offY: -8 * p * flip, bladeRot: -1.45 * p * flip, swingArcSign: flip, showSlash: false, slashP: 0, recoveryP: 0 };
  }
  if (phase === 2) {
    return { lunge: -6, offY: -8 * flip, bladeRot: -1.45 * flip, swingArcSign: flip, showSlash: false, slashP: 0, recoveryP: 0 };
  }
  if (phase === 3) {
    const ease = 1 - Math.pow(1 - p, 2.2);
    return { lunge: -6 + 20 * ease, offY: (-8 + 16 * ease) * flip, bladeRot: (-1.45 + 3.05 * ease) * flip, swingArcSign: flip, showSlash: true, slashP: ease, recoveryP: 0 };
  }
  if (phase === 4) {
    const shake = Math.sin(p * Math.PI * 6) * 1.4;
    return { lunge: 14 + shake, offY: 8 * flip, bladeRot: 1.60 * flip, swingArcSign: flip, showSlash: true, slashP: 1, recoveryP: 0 };
  }
  const damp = 1 - p + Math.sin(p * Math.PI * 2.2) * Math.exp(-p * 4.2) * 0.25;
  return { lunge: 14 * damp, offY: 8 * flip * damp, bladeRot: 1.60 * flip * damp, swingArcSign: flip, showSlash: true, slashP: 1, recoveryP: p };
}

/**
 * Draws Jevil's Devilsknife scythe held by canonical single-source right hand (Rule 20/30).
 */
export function drawJevilDevilsknife(ctx, x, y, angle, r = 25, fighter = null, opts = {}) {
  const custom = state.weaponCustomizations?.jevil || {};
  const scale = custom.scale ?? 1.15;
  const wScale = custom.widthScale ?? 1.0;
  const lScale = custom.lengthScale ?? 1.0;
  const offX = custom.offsetX ?? 0;
  const offY = custom.offsetY ?? 0;
  const angOff = custom.angleOffset ?? 0;

  const swing = _getSwingOffsets(fighter);
  const handR = getHandSize(r * 0.28);
  const isFacingLeft = !opts.isPreview && Math.abs(angle) > Math.PI / 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (isFacingLeft) ctx.scale(1, -1);

  // Rule 15 Double-Tapered Crescent Cleave Arc during Phase 3-5
  if (swing.showSlash) {
    _drawDevilsknifeCrescentArc(ctx, r, swing.swingArcSign, swing.slashP, swing.recoveryP);
  }

  // Canonical Right Hand Grip Anchor (+r*0.82, +r*0.38) + Lunge Offset
  const gripX = r * 0.82 + swing.lunge + offX;
  const gripY = r * 0.38 + swing.offY + offY;

  // Dynamic Connected Jester Arm Segment from Shoulder Flank (Rule 30)
  if (!opts.isPreview) {
    const shX = r * 0.56;
    const shY = r * 0.24;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = handR * 1.45;
    ctx.beginPath();
    ctx.moveTo(shX, shY);
    ctx.lineTo(gripX, gripY);
    ctx.stroke();

    ctx.strokeStyle = '#201E2E';
    ctx.lineWidth = handR * 0.92;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(gripX, gripY);
  ctx.rotate(swing.bladeRot + angOff);

  const knife = _getReady('devilsknife');
  const drawW = 54 * scale * wScale;
  const drawH = 50 * scale * lScale;
  if (knife) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // Align scythe shaft bottom cleanly into the canonical grip hand
    ctx.drawImage(knife, -drawW * 0.42, -drawH * 0.86, drawW, drawH);
    ctx.restore();
  } else {
    ctx.save();
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(4, -36 * scale);
    ctx.stroke();
    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  // Canonical Hand Drawn Directly Over Weapon Hilt (Rule 20)
  drawPixelHand(ctx, 0, 0, handR, '#B8C4E0', '#0E0F14', 1.7);
  ctx.restore();

  ctx.restore();
}

export function drawJevilWeaponPreview(ctx, x = 0, y = 0, angle = 0, r = 25, opts = {}) {
  drawJevilDevilsknife(ctx, x, y, angle, r, null, { ...opts, isPreview: true });
}

function _drawDevilsknifeCrescentArc(ctx, r, arcSign, slashP, recoveryP) {
  const startA = -1.25 * arcSign;
  const endA = 1.15 * arcSign;
  const wipeTailA = startA + (endA - startA) * Math.pow(recoveryP, 1.4);
  const headA = startA + (endA - startA) * slashP;
  if (Math.abs(headA - wipeTailA) < 0.04) return;

  const rad = r * 2.15;
  const steps = 16;
  const maxThick = 16 * (1 - recoveryP * 0.65);

  ctx.save();
  for (const layer of [
    { color: 'rgba(168, 85, 247, 0.72)', scale: 1.0 },
    { color: 'rgba(250, 204, 21, 0.85)', scale: 0.48 },
    { color: '#FFFFFF', scale: 0.24 },
  ]) {
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = wipeTailA + (headA - wipeTailA) * t;
      const taper = Math.pow(Math.sin(t * Math.PI), 1.15) * (0.3 + 0.7 * t);
      const rr = rad + maxThick * layer.scale * taper * 0.5;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const a = wipeTailA + (headA - wipeTailA) * t;
      const taper = Math.pow(Math.sin(t * Math.PI), 1.15) * (0.3 + 0.7 * t);
      const rr = rad - maxThick * layer.scale * taper * 0.5;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = layer.color;
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draws Chaos Suit Bullets (Spade, Club, Diamond, Heart).
 */
export function drawJevilSuitBullet(ctx, b) {
  if (!b) return;
  const img = _getReady(b.suit || 'spade');

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.angle || 0);
  if (img) {
    const s = b.scale || 0.78;
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -w * 0.5, -h * 0.5, w, h);
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draws Flashing Chaos Suit Bombs (46x23 2-frame sprite strips).
 */
export function drawJevilSuitBomb(ctx, bomb) {
  if (!bomb) return;
  const keyMap = { spade: 'bombSpade', club: 'bombClub', diamond: 'bombDiamond', heart: 'bombHeart' };
  const sheet = _getReady(keyMap[bomb.suit] || 'bombSpade');
  const frameIdx = (Math.floor((bomb.age || 0) / 4) % 2);

  ctx.save();
  ctx.translate(bomb.x, bomb.y);
  const pulse = 1 + Math.sin((bomb.age || 0) * 0.4) * 0.08;
  ctx.scale(pulse, pulse);

  const glow = _getGlow('#A855F7');
  if (glow) {
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.drawImage(glow, -28, -28, 56, 56);
    ctx.restore();
  }

  if (sheet) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, frameIdx * 23, 0, 23, 23, -15, -15, 30, 30);
  } else {
    ctx.fillStyle = frameIdx === 0 ? '#A855F7' : '#FACC15';
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draws Spinning Devilsknife Scythes (Skill 1 Carousel & Final Chaos Crimson Scythes).
 */
export function drawJevilSpinningScythe(ctx, sc) {
  if (!sc) return;
  const knife = _getReady('devilsknife');
  const size = sc.size || 56;

  ctx.save();
  ctx.translate(sc.x, sc.y);
  ctx.rotate(sc.spinAngle || 0);

  if (sc.crimson) {
    const glow = _getGlow('#FF1E4D');
    if (glow) {
      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.drawImage(glow, -size * 0.8, -size * 0.8, size * 1.6, size * 1.6);
      ctx.restore();
    }
  }

  if (knife) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(knife, -size * 0.5, -size * 0.5, size, size);
  } else {
    ctx.fillStyle = sc.crimson ? '#FF1E4D' : '#A855F7';
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 2.0;
    ctx.fillRect(-size * 0.35, -8, size * 0.7, 16);
    ctx.strokeRect(-size * 0.35, -8, size * 0.7, 16);
  }
  ctx.restore();
}

/**
 * Draws Merry-Go-Round Carousel Horses/Ducks (3 x 36x29 frames) with golden carousel pole.
 */
export function drawJevilMerryGoRound(ctx, item) {
  if (!item) return;
  const sheet = _getReady('merryGoRound');
  const frameIdx = (item.frameIdx || 0) % 3;

  ctx.save();
  ctx.translate(item.x, item.y);

  // Golden brass carousel pole behind sprite
  ctx.strokeStyle = '#0E0F14';
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(0, 26);
  ctx.stroke();
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  if (item.vx < 0) ctx.scale(-1, 1);

  if (sheet) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, frameIdx * 36, 0, 36, 29, -22, -18, 44, 36);
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 2.0;
    ctx.fillRect(-16, -12, 32, 24);
    ctx.strokeRect(-16, -12, 32, 24);
  }
  ctx.restore();
}

/**
 * Draws Rule 26 Sequential Staggered Concentric Shockwaves for Final Chaos.
 */
export function drawJevilFinalChaosRipples(ctx, ripples) {
  if (!Array.isArray(ripples) || ripples.length === 0) return;
  const offsets = [0.0, 0.14, 0.28];
  const colors = ['#FFFFFF', '#FF1E4D', '#A855F7'];

  ctx.save();
  for (const r of ripples) {
    const p = 1 - r.life / Math.max(1, r.maxLife);
    for (let k = 0; k < offsets.length; k++) {
      const lp = (p - offsets[k]) / (1 - offsets[k]);
      if (lp <= 0 || lp >= 1) continue;
      const rad = r.maxRadius * Math.pow(lp, 0.65);
      const fadeOut = Math.pow(1 - lp, 1.25);
      const popIn = lp < 0.08 ? (lp / 0.08) : 1;
      ctx.globalAlpha = fadeOut * popIn * 0.85;
      ctx.strokeStyle = colors[k];
      ctx.lineWidth = Math.max(1.2, (4.4 - k * 0.9) * (1 - lp * 0.55));
      ctx.beginPath();
      ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
      ctx.stroke();
      if (k === 1) {
        ctx.fillStyle = `rgba(168, 85, 247, ${0.15 * fadeOut})`;
        ctx.fill();
      }
    }
  }
  ctx.restore();
}
