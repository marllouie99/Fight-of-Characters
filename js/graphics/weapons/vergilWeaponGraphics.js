// ───────────────────────────────────────────────────────────────────────────
// Vergil — Yamato, Summoned Swords, Doppelganger & Judgment Cut End VFX
// Uses extracted MUGEN VFX strips (Assets/effects/vergil/) paired with 60 FPS Canvas 2D shaders.
//
// Adheres strictly to:
// - Rule 11: Zero ctx.shadowBlur / shadowColor
// - Rule 15: Double-tapered crescent blade slash + recovery tail-to-tip wipe
// - Rule 16: 4-point filled needle speed lines on Rapid Slash & Trick dashes
// - Rule 20: Weapon & hand anchored dynamically cleanly via shoulder/arm segments
// - Rule 26: Sequential water-ripple concentric shockwaves (zero radial spokes)
// - Rule 30: 5-phase melee swing kinematics & impact lock tremor
// - Rule 35: Lazy VFX asset loading & pre-baked offscreen radial glow quads
// ───────────────────────────────────────────────────────────────────────────

import { drawPixelHand } from '../renderers/fighterRenderer.js';
import { state } from '../../core/state.js';
import { vergilConfig } from '../../configs/characters/vergilConfig.js';
import { drawVergilGhostSkin } from '../fighters/vergilSkin.js';

// ── Lazy Cached 8-Bit Yamato Weapon Sprite (Rule 35) ──
let _vergilWeaponImage = null;
let _vergilWeaponLoading = false;

export function _getVergilWeaponImage() {
  if (_vergilWeaponImage && _vergilWeaponImage.complete && (_vergilWeaponImage.naturalWidth > 0 || _vergilWeaponImage.width > 0)) {
    return _vergilWeaponImage;
  }
  const src = vergilConfig.assets?.weapon || 'Assets/model/vergil/Vergil-weapon.png';
  if (!_vergilWeaponLoading && typeof Image !== 'undefined') {
    _vergilWeaponLoading = true;
    const img = new Image();
    img.onload = () => { _vergilWeaponImage = img; _vergilWeaponLoading = false; };
    img.onerror = () => { _vergilWeaponLoading = false; };
    img.src = src;
    _vergilWeaponImage = img;
  }
  return _vergilWeaponImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getVergilWeaponImage();
}

// ── Lazy Cached VFX Sprite Strips (Rule 35) ──
const _vfxImages = new Map();
function _getVergilVfxImage(key) {
  if (_vfxImages.has(key)) {
    const img = _vfxImages.get(key);
    return (img && img.complete && (img.naturalWidth > 0 || img.width > 0)) ? img : null;
  }
  const src = vergilConfig.vfxAssets?.[key];
  if (!src || typeof Image === 'undefined') return null;
  const img = new Image();
  img.src = src;
  _vfxImages.set(key, img);
  return (img.complete && (img.naturalWidth > 0 || img.width > 0)) ? img : null;
}

// ── Pre-Baked Offscreen Radial Glow Quads (Rule 35: Zero Per-Frame Gradients) ──
const _glowCache = new Map();
function _getPrebakedGlow(colorKey, innerRgba, midRgba) {
  if (_glowCache.has(colorKey)) return _glowCache.get(colorKey);
  if (typeof document === 'undefined') return null;
  const size = 128;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  if (!g) return null;
  const half = size / 2;
  const grad = g.createRadialGradient(half, half, 2, half, half, half);
  grad.addColorStop(0.0, innerRgba);
  grad.addColorStop(0.45, midRgba);
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  _glowCache.set(colorKey, c);
  return c;
}

const _PREWARM_GLOW_SPECS = [
  ['cobalt_aura', 'rgba(56, 189, 248, 0.36)', 'rgba(37, 99, 235, 0.14)'],
  ['sparda_aura', 'rgba(225, 29, 72, 0.36)', 'rgba(56, 189, 248, 0.16)'],
  ['judgment_sphere', 'rgba(186, 230, 253, 0.90)', 'rgba(37, 99, 235, 0.42)'],
  ['summoned_sword', 'rgba(125, 211, 252, 0.88)', 'rgba(29, 78, 216, 0.34)'],
  ['mirage_edge', 'rgba(56, 189, 248, 0.85)', 'rgba(30, 64, 175, 0.36)'],
  ['crimson_burst', 'rgba(244, 63, 94, 0.92)', 'rgba(56, 189, 248, 0.35)'],
  ['doppel_portal', 'rgba(56, 189, 248, 0.85)', 'rgba(59, 130, 246, 0.34)'],
  ['jce_flash', 'rgba(224, 242, 254, 0.95)', 'rgba(56, 189, 248, 0.48)'],
];

/**
 * Pre-warms Vergil's radial glow quads & VFX strips right before Round 1 (Rule 35).
 */
export function prewarmVergilVfxAssets(targetCtx = null) {
  if (typeof window === 'undefined' || typeof Image === 'undefined') return 0;
  for (const [colorKey, innerRgba, midRgba] of _PREWARM_GLOW_SPECS) {
    _getPrebakedGlow(colorKey, innerRgba, midRgba);
  }
  let warmedCount = 0;
  const weaponImg = _getVergilWeaponImage();
  if (weaponImg) {
    warmedCount++;
    if (targetCtx && typeof targetCtx.drawImage === 'function') {
      try {
        targetCtx.save();
        targetCtx.globalAlpha = 0.001;
        targetCtx.drawImage(weaponImg, 0, 0, 1, 1, -10, -10, 1, 1);
        targetCtx.restore();
      } catch (e) {
        try { targetCtx.restore(); } catch (_) {}
      }
    }
  }
  for (const key of Object.keys(vergilConfig.vfxAssets || {})) {
    const img = _getVergilVfxImage(key);
    warmedCount++;
    if (img && targetCtx && typeof targetCtx.drawImage === 'function') {
      try {
        targetCtx.save();
        targetCtx.globalAlpha = 0.001;
        targetCtx.drawImage(img, 0, 0, 1, 1, -10, -10, 1, 1);
        targetCtx.restore();
      } catch (e) {
        try { targetCtx.restore(); } catch (_) {}
      }
    }
  }
  return warmedCount;
}

function _drawGlowQuad(ctx, x, y, radius, colorKey, innerRgba, midRgba, alpha = 1.0) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  const glow = _getPrebakedGlow(colorKey, innerRgba, midRgba);
  if (!glow) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.drawImage(glow, x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

function _drawSpriteStripFrame(ctx, imgKey, frameCount, progress, x, y, drawW, drawH, alpha = 1.0, rotation = 0, srcCrop = null) {
  const img = _getVergilVfxImage(imgKey);
  if (!img || alpha <= 0.01) return false;
  const w = img.naturalWidth || img.width || 0;
  const h = img.naturalHeight || img.height || 0;
  if (w <= 0 || h <= 0) return false;
  const cellW = Math.floor(w / frameCount);
  if (cellW <= 0) return false;
  const fIdx = Math.max(0, Math.min(frameCount - 1, Math.floor(progress * frameCount)));

  const sx = fIdx * cellW + (srcCrop ? Math.round(cellW * srcCrop.x) : 0);
  const sy = srcCrop ? Math.round(h * srcCrop.y) : 0;
  const sw = srcCrop ? Math.max(1, Math.round(cellW * srcCrop.w)) : cellW;
  const sh = srcCrop ? Math.max(1, Math.round(h * srcCrop.h)) : h;

  ctx.save();
  ctx.translate(x, y);
  if (rotation !== 0) ctx.rotate(rotation);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.drawImage(img, sx, sy, sw, sh, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
  return true;
}

/**
 * Rule 26: Sequential Water-Ripple Shockwave Rings (zero radial spoke meshes).
 */
function _drawConcentricShockwave(ctx, x, y, maxR, progress, strokeColor, washRgba, waveCount = 3) {
  const clampP = Math.max(0, Math.min(1, progress));
  ctx.save();
  for (let k = 0; k < waveCount; k++) {
    const tOffset = k * 0.14;
    if (clampP <= tOffset) continue;
    const lp = Math.min(1, (clampP - tOffset) / Math.max(0.15, 1 - tOffset));
    const waveR = maxR * Math.pow(lp, 0.62);
    const popIn = Math.min(1, lp / 0.10);
    const fadeOut = Math.pow(Math.max(0, 1 - lp), 1.25);
    const waveAlpha = popIn * fadeOut;
    if (waveAlpha <= 0.02 || waveR <= 1) continue;

    ctx.beginPath();
    ctx.arc(x, y, waveR, 0, Math.PI * 2);
    ctx.fillStyle = washRgba;
    ctx.globalAlpha = waveAlpha * 0.22;
    ctx.fill();

    ctx.lineWidth = Math.max(1.2, (3.4 - k * 0.7) * fadeOut);
    ctx.strokeStyle = strokeColor;
    ctx.globalAlpha = waveAlpha * 0.85;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draws a single tapered razor dimensional cut seam across two points (0 ctx.shadowBlur).
 */
function _drawRazorScreenSlashSeam(ctx, x1, y1, x2, y2, thickness, alpha, coreColor = '#FFFFFF', haloColor = '#38BDF8') {
  if (alpha <= 0.02) return;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len <= 2) return;
  const nx = -dy / len;
  const ny = dx / len;
  const mx = (x1 + x2) * 0.5;
  const my = (y1 + y2) * 0.5;

  ctx.save();
  // Outer electric cyan glow seam (tapered needle polygon)
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.62));
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(mx + nx * (thickness * 2.3), my + ny * (thickness * 2.3));
  ctx.lineTo(x2, y2);
  ctx.lineTo(mx - nx * (thickness * 2.3), my - ny * (thickness * 2.3));
  ctx.closePath();
  ctx.fillStyle = haloColor;
  ctx.fill();

  // Sharp bright white dimensional tear core
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(mx + nx * thickness, my + ny * thickness);
  ctx.lineTo(x2, y2);
  ctx.lineTo(mx - nx * thickness, my - ny * thickness);
  ctx.closePath();
  ctx.fillStyle = coreColor;
  ctx.fill();
  ctx.restore();
}
function _getSwordSwingOffsets(fighter) {
  const dir = fighter.swordSwingDir || 1;
  const p = Math.max(0, Math.min(1, fighter.swordSwingPhaseProgress || 0));
  const phase = fighter.swordSwingPhase || 'idle';
  const comboStep = (fighter.swordComboStep || 0) % 4;
  const stepBias = comboStep === 1 ? -0.18 : (comboStep === 2 ? 0.22 : (comboStep === 3 ? -0.28 : 0));
  const tick = fighter._vfxTick || 0;

  let angleOff = dir * (-1.35 + stepBias);
  let lunge = 0;
  let offY = 0;
  let offHandLunge = 0;
  let offHandOffY = 0;
  let reachScale = 1.0;

  if (!fighter.isSlashing || phase === 'idle') {
    const jce = fighter.jceState;
    if ((jce && jce.active) || (fighter.rapidSlashTimer || 0) > 0) {
      const jPhase = jce?.phase || 'dash';
      if (jPhase === 'windup') {
        const wTot = Math.max(1, jce?.windupTicks || 12);
        const wp = 1 - Math.max(0, Math.min(1, (jce?.phaseTimer || 0) / wTot));
        const coil = 1 - Math.pow(1 - wp, 2);
        // Clean waist-level horizontal iai draw crouch: coils hand in to hip, aligns blade level
        return {
          angleOff: -0.18 + 0.24 * coil,
          lunge: -9.5 * coil,
          offY: 2.5 * coil,
          offHandLunge: 2.2 * coil,
          offHandOffY: 0.8 * coil,
          reachScale: 1.0,
          phase: 'rapidWindup',
          p: wp,
        };
      }
      if (jPhase === 'dash' || (fighter.rapidSlashTimer || 0) > 0) {
        const dashTot = Math.max(1, jce?.dashTicks || 18);
        const dp = 1 - Math.max(0, Math.min(1, (jce?.phaseTimer ?? fighter.rapidSlashTimer ?? 0) / dashTot));
        const snap = 1 - Math.pow(1 - dp, 2.2);
        // Continuous forward snap straight out of the windup waist draw
        return {
          angleOff: 0.06 + 0.34 * snap,
          lunge: -9.5 * (1 - snap) + 6.5 * snap,
          offY: 2.5 * (1 - snap),
          offHandLunge: 2.2 * (1 - snap) - 3.0 * snap,
          offHandOffY: 0.8 * (1 - snap),
          reachScale: 1.0 + 0.12 * snap,
          phase: 'rapidDash',
          p: dp,
        };
      }
      if (jPhase === 'charge' || jPhase === 'slash' || jPhase === 'shatter') {
        const cp = (jPhase === 'charge')
          ? (1 - Math.max(0, Math.min(1, (jce.phaseTimer || 0) / Math.max(1, jce.chargeTicks || 20))))
          : 1.0;
        const slideP = Math.min(1, cp / 0.82);
        const clickFlash = (jPhase === 'charge' && cp >= 0.80)
          ? Math.sin(((cp - 0.80) / 0.20) * Math.PI)
          : 0;
        return {
          angleOff: -0.20,
          lunge: 0,
          offY: 0,
          offHandLunge: 0,
          offHandOffY: 0,
          reachScale: 1.0,
          phase: jPhase === 'charge' ? 'jceSheathing' : 'jceSheathed',
          p: slideP,
          clickFlash,
        };
      }
    }

    if ((fighter.barrageSlashTimer || 0) > 0) {
      const maxT = Math.max(1, fighter.barrageSlashMax || 7);
      const bp = Math.max(0.08, Math.min(1, 1 - ((fighter.barrageSlashTimer - 0.5) / maxT)));
      const center = fighter.barrageCutCenter || 0;
      const cDir = fighter.barrageCutDir || 1;
      const halfSweep = 1.05;
      const startA = center - cDir * halfSweep;
      const endA = center + cDir * halfSweep;
      const snap = bp < 0.48 ? (1 - Math.pow(1 - (bp / 0.48), 2.5)) : 1.0;
      const curAngle = startA + (endA - startA) * snap;
      return {
        angleOff: curAngle,
        lunge: Math.cos(curAngle) * 4.5,
        offY: Math.sin(curAngle) * 4.5,
        offHandLunge: 0,
        offHandOffY: 0,
        reachScale: 1.0 + 0.14 * Math.sin(Math.min(1, bp / 0.55) * Math.PI),
        phase: 'barrageSlash',
        p: bp,
        startSweep: startA,
        endSweep: endA,
      };
    }

    if ((fighter.blockPoseTimer || 0) > 0) {
      const stance = (fighter.parryStanceIndex || 0) % 3;
      const hitMax = Math.max(1, fighter.parryHitAnimMaxFrames || 18);
      const hitP = Math.max(0, Math.min(1, (fighter.parryHitAnimTimer || 0) / hitMax));
      const kick = Math.sin(hitP * Math.PI);
      // Match Roaring Knight's 3-stance parry kick angles while keeping hand anchored safely on lower flank
      if (stance === 1) {
        return {
          angleOff: -1.62 - 0.28 * kick,
          lunge: -4.5 * kick,
          offY: -2.0 * kick,
          offHandLunge: -1.5 * kick,
          offHandOffY: 1.0 * kick,
          reachScale: 1.0,
          phase: 'parry',
          p: hitP,
        };
      }
      if (stance === 2) {
        return {
          angleOff: 1.85 + 0.24 * kick,
          lunge: -4.0 * kick,
          offY: 1.5 * kick,
          offHandLunge: -1.5 * kick,
          offHandOffY: 1.0 * kick,
          reachScale: 1.0,
          phase: 'parry',
          p: hitP,
        };
      }
      return {
        angleOff: 1.48 + 0.26 * kick,
        lunge: -4.5 * kick,
        offY: 2.0 * kick,
        offHandLunge: -1.5 * kick,
        offHandOffY: 1.0 * kick,
        reachScale: 1.0,
        phase: 'parry',
        p: hitP,
      };
    }

    // Calm samurai idle poise & smooth velocity-swept dash posture (no noisy stride jitter)
    const speed = fighter._isWinnerReveal ? 0 : Math.hypot(fighter.vx || 0, fighter.vy || 0);
    const moveBlend = Math.min(1, speed / 5.0);
    const breath = Math.sin(tick * 0.06);

    return {
      angleOff: -0.18 + breath * 0.025 + 0.16 * moveBlend,
      lunge: -2.2 * moveBlend,
      offY: breath * 0.7 + 1.2 * moveBlend,
      offHandLunge: 0,
      offHandOffY: breath * 0.5,
      reachScale: 1.0,
      phase: 'idle',
      p: 0,
    };
  }
  if (phase === 'lift') {
    const ease = 1 - Math.pow(1 - p, 2);
    angleOff = dir * (-1.55 - 0.35 * ease + stepBias);
    lunge = -6 * ease;
    offY = -4 * ease * dir;
  } else if (phase === 'hold') {
    angleOff = dir * (-1.90 + stepBias);
    lunge = -6;
    offY = -4 * dir;
  } else if (phase === 'strike') {
    const whip = Math.pow(p, 0.58);
    angleOff = dir * (-1.90 + 3.45 * whip + stepBias);
    lunge = -6 + 22 * Math.sin(whip * Math.PI * 0.5);
    offY = (-4 + 7 * whip) * dir;
    reachScale = 1.0 + 0.14 * Math.sin(p * Math.PI);
  } else if (phase === 'impactLock') {
    const tremor = Math.sin(p * Math.PI * 10) * 0.04 * (1 - p);
    angleOff = dir * (1.55 + tremor + stepBias);
    lunge = 16;
    offY = 3 * dir;
    reachScale = 1.06;
  } else if (phase === 'recovery') {
    const damp = Math.sin(p * Math.PI * 2.1) * Math.exp(-p * 4.0) * 0.15;
    angleOff = (dir * 1.55) * (1 - p) + (-0.18) * p + damp;
    lunge = 16 * (1 - p);
    offY = 3 * dir * (1 - p);
  }

  return { angleOff, lunge, offY, offHandLunge, offHandOffY, reachScale, phase, p };
}

/**
 * Draws a single Yamato blade silhouette in local grip-at-origin (+X outward) coordinates.
 */
function _drawYamatoKatanaShape(ctx, r, reachScale = 1.0, formLevel = 0, isGhost = false) {
  if (!isGhost) {
    const weaponImg = _getVergilWeaponImage();
    if (weaponImg && weaponImg.complete && (weaponImg.naturalWidth > 0 || weaponImg.width > 0)) {
      const custom = (typeof state !== 'undefined' && state.weaponCustomizations?.vergil) || {};
      const cScale = custom.scale ?? 1.0;
      const cLen = custom.lengthScale ?? 1.0;
      const cWid = custom.widthScale ?? 1.0;
      const cOffX = custom.offsetX ?? 0;
      const cOffY = custom.offsetY ?? 0;
      const cAng = custom.angleOffset ?? 0;
      // Assets/model/vergil/Vergil-weapon.png (1178x140): handle x=4..354 centered at (195, 66), tsuba at x=354, tip at x=1173
      // Leaves room for a natural two-handed tsuka grip with gold pommel behind & gold tsuba clear ahead
      const baseScale = (r * 2.28 * reachScale) / 819.0;

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (cOffX !== 0 || cOffY !== 0) ctx.translate(cOffX, cOffY);
      if (cAng !== 0) ctx.rotate(cAng);
      ctx.scale(baseScale * cScale * cLen, baseScale * cScale * cWid);
      ctx.drawImage(weaponImg, -195, -66);
      ctx.restore();
      return;
    }
  }

  const bladeLen = r * 2.08 * reachScale;
  const handleLen = r * 0.44;
  const spineColor = isGhost ? '#38BDF8' : '#E2E8F0';
  const edgeColor = isGhost ? '#BAE6FD' : '#FFFFFF';
  const guardColor = formLevel >= 1 ? '#E11D48' : '#FACC15';

  // Tsuka (wrapped hilt behind grip)
  ctx.beginPath();
  ctx.rect(-handleLen, -2.4, handleLen + 2, 4.8);
  ctx.fillStyle = isGhost ? '#1E3A8A' : '#F1F5F9';
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();

  // Diamond tsuka-ito wrap ticks
  ctx.strokeStyle = isGhost ? '#38BDF8' : '#1E293B';
  ctx.lineWidth = 1.0;
  for (let hx = -handleLen + 3; hx < -1; hx += 3.8) {
    ctx.beginPath();
    ctx.moveTo(hx, -2.0);
    ctx.lineTo(hx + 2, 2.0);
    ctx.stroke();
  }

  // Ornate octagonal/oval Tsuba (gold or crimson Sparda)
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(0, -6.0, 3.6, 12.0, 1.5) : ctx.rect(0, -6.0, 3.6, 12.0);
  ctx.fillStyle = guardColor;
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();

  // Gently curved Yamato blade
  ctx.beginPath();
  ctx.moveTo(3.5, -2.6);
  ctx.quadraticCurveTo(bladeLen * 0.55, -3.5, bladeLen, -1.2);
  ctx.lineTo(bladeLen + 5.5, 0.5);
  ctx.quadraticCurveTo(bladeLen * 0.55, 1.8, 3.5, 1.9);
  ctx.closePath();
  ctx.fillStyle = spineColor;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();

  // Razor edge sheen
  ctx.beginPath();
  ctx.moveTo(5, 0.8);
  ctx.quadraticCurveTo(bladeLen * 0.55, 1.1, bladeLen + 3.5, 0.4);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = edgeColor;
  ctx.stroke();
}

/**
 * Rule 15: Double-tapered crescent slash + recovery tail-to-tip wipe.
 */
function _drawYamatoCrescentSlash(ctx, r, fighter, swing) {
  const phase = swing.phase;
  if (phase !== 'strike' && phase !== 'impactLock' && phase !== 'recovery' && phase !== 'barrageSlash') return;

  const dir = fighter.swordSwingDir || 1;
  const slashRadius = r * 2.38 * (swing.reachScale || 1.0);
  const startSweep = phase === 'barrageSlash' ? (swing.startSweep ?? -1.05) : (-1.75 * dir);
  const endSweep = phase === 'barrageSlash' ? (swing.endSweep ?? 1.05) : (1.55 * dir);

  let t0 = 0;
  let t1 = 1;
  let alpha = 0.92;

  if (phase === 'barrageSlash') {
    if (swing.p < 0.50) {
      const whip = Math.min(1, swing.p / 0.48);
      t1 = Math.max(0.12, whip);
      t0 = Math.max(0, t1 - 0.85);
      alpha = 0.94;
    } else {
      const wipe = (swing.p - 0.50) / 0.50;
      t0 = 0.15 + 0.85 * Math.pow(wipe, 0.72);
      t1 = 1.0;
      alpha = 0.78 * Math.pow(1 - wipe, 1.35);
    }
  } else if (phase === 'strike') {
    const whip = Math.pow(swing.p, 0.62);
    t1 = Math.max(0.08, whip);
    t0 = Math.max(0, t1 - 0.88);
    alpha = 0.95;
  } else if (phase === 'impactLock') {
    t0 = 0.08;
    t1 = 1.0;
    alpha = 0.86 - swing.p * 0.18;
  } else if (phase === 'recovery') {
    const recP = swing.p;
    t0 = 0.10 + 0.90 * Math.pow(recP, 0.72);
    t1 = 1.0;
    alpha = 0.68 * Math.pow(1 - recP, 1.4);
  }

  if (t1 - t0 <= 0.04 || alpha <= 0.03) return;

  const segs = 22;
  const maxThick = r * 0.48;
  const outerPts = [];
  const innerPts = [];

  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const t = t0 + (t1 - t0) * u;
    const a = startSweep + (endSweep - startSweep) * t;
    const taper = Math.pow(Math.sin(u * Math.PI), 1.15) * (0.28 + 0.72 * u);
    const thick = maxThick * taper;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    outerPts.push([ca * (slashRadius + thick * 0.45), sa * (slashRadius + thick * 0.45)]);
    innerPts.push([ca * (slashRadius - thick * 0.55), sa * (slashRadius - thick * 0.55)]);
  }

  const isSparda = (fighter.vergilForm || 0) >= 1;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.beginPath();
  ctx.moveTo(outerPts[0][0], outerPts[0][1]);
  for (let i = 1; i < outerPts.length; i++) ctx.lineTo(outerPts[i][0], outerPts[i][1]);
  for (let i = innerPts.length - 1; i >= 0; i--) ctx.lineTo(innerPts[i][0], innerPts[i][1]);
  ctx.closePath();
  ctx.fillStyle = isSparda ? '#F43F5E' : '#38BDF8';
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#E0F2FE';
  ctx.stroke();

  // Inner hot-white cutting streak
  ctx.beginPath();
  for (let i = 0; i <= segs; i++) {
    const mx = (outerPts[i][0] * 0.65 + innerPts[i][0] * 0.35);
    const my = (outerPts[i][1] * 0.65 + innerPts[i][1] * 0.35);
    if (i === 0) ctx.moveTo(mx, my);
    else ctx.lineTo(mx, my);
  }
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws Vergil's canonical two-handed tsuka grip along local sword +X (Rule 20).
 */
function _drawYamatoTwoHandGrip(ctx, r, skinHand, hideFront = false, hideBack = false) {
  if (!hideBack) {
    drawPixelHand(ctx, -r * 0.30, 0, r * 0.21, skinHand, '#0E0F14');
  }
  if (!hideFront) {
    drawPixelHand(ctx, r * 0.14, 0, r * 0.23, skinHand, '#0E0F14');
  }
}

/**
 * Weapon Studio / Weapon Index standalone preview renderer for Vergil's Yamato katana.
 */
export function drawVergilWeaponPreview(ctx, x = 0, y = 0, angle = 0, r = 28, opts = {}) {
  ctx.save();
  ctx.translate(x, y);
  if (angle !== 0) ctx.rotate(angle);
  _drawYamatoKatanaShape(ctx, r, 1.0, 0, false);
  if (opts.showHands) {
    _drawYamatoTwoHandGrip(ctx, r, '#FADCCB', false, false);
  }
  ctx.restore();
}

/**
 * Draws Vergil's dynamic coat sleeves, hands gripping Yamato, scabbard, and 5-phase cleave arc.
 * Also renders his spectral Doppelganger mirror strike if active.
 */
export function drawVergilBladeAndSlashVFX(ctx, fighter) {
  if (!fighter || fighter.hideWeapon) return;
  const r = fighter.r || 30;
  const parryShakeT = fighter?.parryShakeTimer || 0;
  const shakeX = (!fighter._isSilhouettePass && parryShakeT > 0) ? Math.sin(parryShakeT * 1.9) * 3.2 * Math.min(1, parryShakeT / 8) : 0;
  const x = (fighter.x || 0) + shakeX;
  const y = (fighter.y || 0) - (fighter.z || 0);
  const aim = fighter._isWinnerReveal ? 0 : (fighter.gunAngle ?? fighter.angle ?? 0);
  const normAim = Math.atan2(Math.sin(aim), Math.cos(aim));
  const facingLeft = Math.abs(normAim) > Math.PI / 2;
  const standUpright = Boolean(
    fighter.jceState?.active &&
    (fighter.jceState.phase === 'charge' || fighter.jceState.phase === 'slash' || fighter.jceState.phase === 'shatter')
  );
  const formLevel = fighter.vergilForm || 0;
  const swing = _getSwordSwingOffsets(fighter);

  const skinHand = formLevel >= 1 ? '#CBD5E1' : '#FADCCB';
  const sleeveColor = formLevel >= 1 ? '#2E2344' : '#232F44';
  const scabbardColor = formLevel >= 1 ? '#312E81' : '#1E293B';

  // Match drawVergilSkin & aizenWeaponGraphics root transform (upright centered during JCE Noto finisher)
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(standUpright ? (facingLeft ? Math.PI : 0) : aim);
  if (facingLeft && !fighter.isSpinning) {
    ctx.scale(1, -1);
  }

  const scabbardRot = 0.08;
  const isSheathingScene = swing.phase === 'jceSheathing' || swing.phase === 'jceSheathed';

  // Vertical Centered Re-Sheathing Geometry (x = 0 midline, y strictly >= 0.30r)
  const vMouthY = r * 1.15;
  const vEase = 1 - Math.pow(1 - (swing.p || 0), 2);
  const vTsubaY = vMouthY - 1.5 - r * 0.36 * (1 - vEase);
  const vGripY = Math.max(r * 0.30, vTsubaY - r * 0.44);
  const vSheathHandX = -r * 0.22;
  const vSheathHandY = vMouthY - r * 0.06;

  const handX = isSheathingScene ? 0 : (r * 0.88 + (swing.lunge || 0));
  const handY = isSheathingScene ? vGripY : Math.max(r * 0.32, r * 0.46 + (swing.offY || 0) * 0.45);

  // Coat Sleeve Linkages
  if (!fighter._isSilhouettePass) {
    const drawCoatSleeve = (sx, sy, ex, ey) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo((sx + ex) * 0.52, (sy + ey) * 0.52 + 2.5);
      ctx.lineTo(ex, ey);
      ctx.lineWidth = Math.max(5.5, r * 0.24);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0E0F14';
      ctx.stroke();
      ctx.lineWidth = Math.max(3.6, r * 0.16);
      ctx.strokeStyle = sleeveColor;
      ctx.stroke();
      ctx.restore();
    };

    if (isSheathingScene) {
      drawCoatSleeve(-r * 0.46, r * 0.36, vSheathHandX, vSheathHandY);
      drawCoatSleeve(r * 0.48, r * 0.34, handX, handY);
    } else {
      const cosA = Math.cos(swing.angleOff);
      const sinA = Math.sin(swing.angleOff);
      const rearHandX = handX - cosA * (r * 0.30);
      const rearHandY = Math.max(r * 0.30, handY - sinA * (r * 0.30));
      const leadHandX = handX + cosA * (r * 0.14);
      const leadHandY = Math.max(r * 0.30, handY + sinA * (r * 0.14));
      drawCoatSleeve(-r * 0.46, r * 0.36, rearHandX, rearHandY);
      drawCoatSleeve(r * 0.48, r * 0.34, leadHandX, leadHandY);
    }
  }

  if (isSheathingScene) {
    // 1. Vertical centered Yamato sliding straight down into vMouthY along x = 0 midline
    ctx.save();
    ctx.beginPath();
    ctx.rect(-r * 2.0, -r * 3.0, r * 4.0, vMouthY + r * 3.0);
    ctx.clip();
    ctx.translate(0, vGripY);
    ctx.rotate(Math.PI / 2); // Blade points vertically downward (+Y) into scabbard; hilt extends upward (-Y)
    _drawYamatoKatanaShape(ctx, r, 1.0, formLevel, false);
    ctx.restore();

    // 2. Vertical Scabbard right down center midline (y: vMouthY .. vMouthY + r*1.25)
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-2.4, vMouthY, 4.8, r * 1.25, 2) : ctx.rect(-2.4, vMouthY, 4.8, r * 1.25);
    ctx.fillStyle = scabbardColor;
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = '#0E0F14';
    ctx.stroke();

    // Gold koiguchi scabbard mouth collar
    ctx.beginPath();
    ctx.rect(-3.2, vMouthY - 1.0, 6.4, 3.0);
    ctx.fillStyle = formLevel >= 1 ? '#E11D48' : '#FACC15';
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#0E0F14';
    ctx.stroke();

    // Crisp *CLICK!* star flash right at (0, vMouthY) when tsuba snaps shut
    if ((swing.clickFlash || 0) > 0.05) {
      const cf = swing.clickFlash;
      _drawGlowQuad(ctx, 0, vMouthY, r * 0.78 * cf, 'jce_flash', 'rgba(224, 242, 254, 0.95)', 'rgba(56, 189, 248, 0.48)', cf);
      const spike = r * 0.62 * cf;
      ctx.beginPath();
      ctx.moveTo(-spike * 1.4, vMouthY);
      ctx.lineTo(0, vMouthY - 2.4 * cf);
      ctx.lineTo(spike * 1.4, vMouthY);
      ctx.lineTo(0, vMouthY + 2.4 * cf);
      ctx.closePath();
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }

    // Two hands cleanly aligned vertically: left steadies sheath collar, right slides hilt shut
    if (!fighter.hideHands) {
      drawPixelHand(ctx, vSheathHandX, vSheathHandY, r * 0.21, skinHand, '#0E0F14');
      if (!fighter.hideFrontHand) {
        drawPixelHand(ctx, handX, handY, r * 0.23, skinHand, '#0E0F14');
      }
    }
    ctx.restore();
    return;
  }

  // Scabbard worn belted back along lower-left hip flank (never overlapping sword hilt)
  ctx.save();
  ctx.rotate(scabbardRot);
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(-r * 1.15, r * 0.44, r * 1.38, 4.4, 2) : ctx.rect(-r * 1.15, r * 0.44, r * 1.38, 4.4);
  ctx.fillStyle = scabbardColor;
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();
  ctx.restore();

  // Double-Tapered Crescent Slash Arc aligned to body forward aim vector (Rule 15)
  _drawYamatoCrescentSlash(ctx, r, fighter, swing);

  // Active extracted MUGEN cleave sprite during strike/impactLock or random-angle barrage cut
  if ((fighter.isSlashing && (swing.phase === 'strike' || swing.phase === 'impactLock')) ||
      (swing.phase === 'barrageSlash' && swing.p < 0.60)) {
    const isBarrage = swing.phase === 'barrageSlash';
    const isRapid = fighter.rapidSlashTimer > 0;
    const cleaveKey = (isBarrage || isRapid) ? 'yamatoCleave' : 'crescentWave';
    const cleaveFrames = cleaveKey === 'yamatoCleave' ? 4 : 5;
    const cleaveAng = isBarrage ? ((swing.startSweep + swing.endSweep) * 0.5) : swing.angleOff;
    const cleaveP = isBarrage ? Math.min(1, swing.p / 0.60) : (swing.phase === 'impactLock' ? 0.85 : swing.p);
    _drawSpriteStripFrame(
      ctx,
      cleaveKey,
      cleaveFrames,
      cleaveP,
      Math.cos(cleaveAng) * r * 1.45,
      Math.sin(cleaveAng) * r * 1.45,
      r * 3.1,
      r * 3.1,
      0.86,
      cleaveAng
    );
  }

  // Yamato Katana anchored cleanly at lower-flank grip + Two-Handed Tsuka Grip (Rule 20)
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(swing.angleOff);
  _drawYamatoKatanaShape(ctx, r, swing.reachScale || 1.0, formLevel, false);
  if (swing.phase === 'rapidWindup' && swing.p > 0.65) {
    const gp = Math.sin(((swing.p - 0.65) / 0.35) * Math.PI);
    _drawGlowQuad(ctx, r * 0.44, 0, r * 0.52, 'jce_flash', 'rgba(224, 242, 254, 0.95)', 'rgba(56, 189, 248, 0.48)', gp);
  } else if ((fighter.parryHitAnimTimer || 0) > 6) {
    const gp = 1 - ((fighter.parryHitAnimTimer - 6) / 14);
    _drawSpriteStripFrame(ctx, 'crossGlint', 6, gp, r * 0.95, 0, r * 1.9, r * 1.9, 0.95, 0);
  }
  if (!fighter.hideHands) {
    _drawYamatoTwoHandGrip(ctx, r, skinHand, Boolean(fighter.hideFrontHand), Boolean(fighter.hideBackHand));
  }
  ctx.restore();

  ctx.restore();
}

/**
 * Draws Seed of Sparda aura, Doppelganger Clone, Trick afterimages & Rapid Slash Speed Lines (Rule 16).
 */
export function drawVergilAuraAndMobilityVFX(ctx, fighter, vfxTick = 0) {
  const r = fighter.r || 30;
  const parryShakeT = fighter?.parryShakeTimer || 0;
  const shakeX = (!fighter._isSilhouettePass && parryShakeT > 0) ? Math.sin(parryShakeT * 1.9) * 3.2 * Math.min(1, parryShakeT / 8) : 0;
  const x = (fighter.x || 0) + shakeX;
  const y = (fighter.y || 0) - (fighter.z || 0);
  const aim = fighter._isWinnerReveal ? 0 : (fighter.gunAngle ?? fighter.angle ?? 0);
  const formLevel = fighter.vergilForm || 0;

  // 1. Trick Teleport / Rapid Slash Ghost Afterimages
  if (Array.isArray(fighter.afterimages)) {
    for (let i = 0; i < fighter.afterimages.length; i++) {
      const g = fighter.afterimages[i];
      drawVergilGhostSkin(ctx, g.x, g.y, g.angle, r, (g.alpha || 0.4) * 0.65, formLevel, false);
    }
  }

  // 2. Seed of Sparda / Devil Trigger Continuous Aura (MUGEN State 900/2551)
  if (formLevel >= 1) {
    const auraKey = 'sparda_aura';
    _drawGlowQuad(ctx, x, y, r * 2.25, auraKey, 'rgba(225, 29, 72, 0.36)', 'rgba(56, 189, 248, 0.16)', 0.72);
    const p = (vfxTick % 36) / 36;
    _drawSpriteStripFrame(ctx, 'spardaAura', 6, p, x, y - r * 0.25, r * 3.1, r * 3.4, 0.68, 0);
  } else if ((fighter.concentrationGauge || 0) >= 60) {
    _drawGlowQuad(ctx, x, y, r * 1.9, 'cobalt_aura', 'rgba(56, 189, 248, 0.36)', 'rgba(37, 99, 235, 0.14)', 0.48);
  }

  // 3. Transformation Awakening Flash
  if ((fighter.formTransformVfxTimer || 0) > 0) {
    const p = Math.max(0, Math.min(1, 1 - fighter.formTransformVfxTimer / 28));
    _drawSpriteStripFrame(ctx, 'crimsonBurst', 8, p, x, y, r * 5.2, r * 5.2, 0.92, 0);
    _drawConcentricShockwave(ctx, x, y, r * 4.8, p, '#E11D48', 'rgba(56, 189, 248, 0.24)', 3);
  }

  // 3b. Rapid Slash Windup Subtle Aura Charge
  if (fighter.jceState?.active && fighter.jceState.phase === 'windup') {
    const wTot = Math.max(1, fighter.jceState.windupTicks || 12);
    const wp = 1 - Math.max(0, Math.min(1, (fighter.jceState.phaseTimer || 0) / wTot));
    _drawGlowQuad(
      ctx,
      x,
      y,
      r * (1.45 + 0.35 * wp),
      formLevel >= 1 ? 'sparda_aura' : 'cobalt_aura',
      formLevel >= 1 ? 'rgba(225, 29, 72, 0.36)' : 'rgba(56, 189, 248, 0.40)',
      'rgba(37, 99, 235, 0.14)',
      0.35 + 0.40 * wp
    );
  }

  // 4. Rapid Slash / Trick Dash 4-Point Needle Speed Lines (Rule 16)
  if ((fighter.rapidSlashTimer || 0) > 0 || (fighter.shunpoVfxTimer || 0) > 0) {
    const dashAng = fighter.rapidSlashTimer > 0 ? (fighter.skillCastAngle ?? aim) : (fighter.trickAngle ?? aim);
    const cosA = Math.cos(dashAng);
    const sinA = Math.sin(dashAng);
    const perpX = -sinA;
    const perpY = cosA;
    const colors = formLevel >= 1
      ? ['#E11D48', '#38BDF8', '#FFFFFF', '#0E0F14']
      : ['#38BDF8', '#60A5FA', '#FFFFFF', '#0E0F14'];

    ctx.save();
    for (let i = 0; i < 8; i++) {
      const seed = (i * 0.37) % 1;
      const lateral = ((i / 7) - 0.5) * 2.0 * (r * 1.35);
      const backOffset = r * 0.6 + ((vfxTick * 9 + i * 19) % 42);
      const len = r * (1.2 + seed * 1.3);
      const thick = 1.0 + (i % 3) * 0.5;
      const tailX = x - cosA * (backOffset + len) + perpX * lateral;
      const tailY = y - sinA * (backOffset + len) + perpY * lateral;
      const headX = x - cosA * backOffset + perpX * lateral;
      const headY = y - sinA * backOffset + perpY * lateral;
      const midX = (tailX + headX) * 0.5;
      const midY = (tailY + headY) * 0.5;

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(midX + perpX * thick, midY + perpY * thick);
      ctx.lineTo(headX, headY);
      ctx.lineTo(midX - perpX * thick, midY - perpY * thick);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
    }
    ctx.restore();

    if (fighter.rapidSlashTimer > 0) {
      const rp = Math.max(0, Math.min(1, 1 - fighter.rapidSlashTimer / 16));
      _drawSpriteStripFrame(ctx, 'rapidSlash', 8, rp, x - cosA * r * 0.8, y - sinA * r * 0.8, r * 5.2, r * 2.6, 0.88, dashAng);
    } else {
      const tp = Math.max(0, Math.min(1, 1 - fighter.shunpoVfxTimer / 14));
      _drawSpriteStripFrame(ctx, 'trickWarp', 8, tp, x - cosA * r * 0.7, y - sinA * r * 0.7, r * 3.8, r * 2.8, 0.85, dashAng);
    }
  }

  // 5. Doppelganger Clone (State 1200 / Helper 1220: spectral azure Vergil mirroring behind root)
  if ((fighter.doppelgangerTimer || 0) > 0) {
    const cloneAng = Math.atan2(Math.sin(aim), Math.cos(aim));
    const cloneFacingLeft = Math.abs(cloneAng) > Math.PI / 2;
    const dx = x - Math.cos(cloneAng) * (r * 1.45);
    const dy = y - Math.sin(cloneAng) * (r * 1.45);
    const fade = Math.min(1, fighter.doppelgangerTimer / 20);
    drawVergilGhostSkin(ctx, dx, dy, cloneAng, r * 0.94, 0.58 * fade, formLevel, true);

    // Doppelganger mirrors Yamato swing aligned with its ghost body transform
    ctx.save();
    ctx.globalAlpha = 0.65 * fade;
    ctx.translate(dx, dy);
    ctx.rotate(cloneAng);
    if (cloneFacingLeft) ctx.scale(1, -1);
    const swing = _getSwordSwingOffsets(fighter);
    const dHandX = (r * 0.82) + (swing.lunge || 0) * 0.5;
    const dHandY = Math.max(r * 0.32, (r * 0.48) + (swing.offY || 0) * 0.45);
    ctx.translate(dHandX, dHandY);
    ctx.rotate(swing.angleOff);
    _drawYamatoKatanaShape(ctx, r * 0.94, swing.reachScale || 1.0, formLevel, true);
    ctx.restore();
  }
}

/**
 * Draws Orbiting 6-Sword Ring, Homing Blistering Swords, Mirage Edge Boomerang,
 * Heavy Sword Rain, Judgment Cut Spheres, and Judgment Cut End Dimension Shatter.
 */
export function drawVergilCombatVFX(ctx, fighter, vfxTick = 0) {
  const r = fighter.r || 30;
  const x = fighter.x || 0;
  const y = (fighter.y || 0) - (fighter.z || 0);

  // 1. Orbiting 6 Summoned Swords Ring (MUGEN State 360 / 1120)
  const swordScale = vergilConfig.summonedSwordScale ?? 1.60;
  if (Array.isArray(fighter.orbitingSwords) && fighter.orbitingSwords.length > 0) {
    for (let i = 0; i < fighter.orbitingSwords.length; i++) {
      const sw = fighter.orbitingSwords[i];
      const sx = x + Math.cos(sw.angle) * sw.orbitR;
      const sy = y + Math.sin(sw.angle) * sw.orbitR;
      const pointAngle = sw.aimAngle !== undefined ? sw.aimAngle : sw.angle + Math.PI / 2;
      _drawGlowQuad(ctx, sx, sy, 14 * swordScale, 'summoned_sword', 'rgba(125, 211, 252, 0.88)', 'rgba(29, 78, 216, 0.34)', 0.72);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(pointAngle);
      ctx.scale(swordScale, swordScale);
      // Spectral blue Phantom Sword needle polygon
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.lineTo(-3.5, -3.5);
      ctx.lineTo(-10, 0);
      ctx.lineTo(-3.5, 3.5);
      ctx.closePath();
      ctx.fillStyle = '#E0F2FE';
      ctx.fill();
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = '#0284C7';
      ctx.stroke();
      ctx.restore();
    }
  }

  // 2. Fired Projectiles: Homing Phantom Blades & Mirage Edge Boomerang (State 535)
  if (Array.isArray(fighter.vergilProjectiles)) {
    for (let i = 0; i < fighter.vergilProjectiles.length; i++) {
      const proj = fighter.vergilProjectiles[i];
      const ang = Math.atan2(proj.vy || 0, proj.vx || 1);
      if (proj.kind === 'mirage_boomerang') {
        const spin = (vfxTick * 0.45) + i;
        const size = (proj.r || 24) * 3.0;
        _drawGlowQuad(ctx, proj.x, proj.y, size * 0.65, 'mirage_edge', 'rgba(56, 189, 248, 0.85)', 'rgba(30, 64, 175, 0.36)', 0.85);
        const drew = _drawSpriteStripFrame(ctx, 'mirageVortex', 5, (vfxTick % 15) / 15, proj.x, proj.y, size, size, 0.92, spin);
        if (!drew) {
          ctx.save();
          ctx.translate(proj.x, proj.y);
          ctx.rotate(spin);
          ctx.beginPath();
          ctx.ellipse(0, 0, proj.r || 22, 6, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#38BDF8';
          ctx.fill();
          ctx.restore();
        }
      } else {
        // Homing / Blistering Summoned Sword Bolt
        const boltP = ((proj.age || 0) % 16) / 16;
        const pScale = proj.scale ?? swordScale;
        const spriteSize = 38 * pScale;
        _drawGlowQuad(ctx, proj.x, proj.y, 18 * pScale, 'summoned_sword', 'rgba(125, 211, 252, 0.88)', 'rgba(29, 78, 216, 0.34)', 0.82);
        const drew = _drawSpriteStripFrame(ctx, 'summonedSword', 8, boltP, proj.x, proj.y, spriteSize, spriteSize, 0.92, ang - Math.PI / 2);
        if (!drew) {
          ctx.save();
          ctx.translate(proj.x, proj.y);
          ctx.rotate(ang);
          ctx.scale(pScale, pScale);
          ctx.beginPath();
          ctx.moveTo(14, 0);
          ctx.lineTo(-6, -3.5);
          ctx.lineTo(-10, 0);
          ctx.lineTo(-6, 3.5);
          ctx.closePath();
          ctx.fillStyle = '#BAE6FD';
          ctx.fill();
          ctx.restore();
        }
      }
    }
  }

  // 3. Transient World VFX (Judgment Cut Spheres, Heavy Rain Strikes, Rapid Slashes, Portal, JCE)
  if (Array.isArray(fighter.activeVisualEffects)) {
    for (let i = 0; i < fighter.activeVisualEffects.length; i++) {
      const fx = fighter.activeVisualEffects[i];
      const p = Math.max(0, Math.min(1, 1 - (fx.timer / (fx.maxTimer || 20))));
      const alpha = Math.max(0, Math.min(1, Math.sin(p * Math.PI) * 1.15));

      if (fx.kind === 'judgmentCutSphere') {
        const rad = fx.radius || 68;
        _drawGlowQuad(ctx, fx.x, fx.y, rad * 1.25, 'judgment_sphere', 'rgba(186, 230, 253, 0.90)', 'rgba(37, 99, 235, 0.42)', alpha * 0.9);
        _drawSpriteStripFrame(ctx, 'judgmentSphere', 8, p, fx.x, fx.y, rad * 2.4, rad * 2.4, alpha, fx.rotation || 0);
        // Clean interior slash cuts inside sphere
        ctx.save();
        ctx.globalAlpha = alpha * 0.9;
        for (let c = 0; c < 4; c++) {
          const sa = (fx.rotation || 0) + c * 0.85;
          const sr = rad * (0.65 + (c % 2) * 0.25);
          ctx.beginPath();
          ctx.moveTo(fx.x - Math.cos(sa) * sr, fx.y - Math.sin(sa) * sr);
          ctx.lineTo(fx.x + Math.cos(sa) * sr, fx.y + Math.sin(sa) * sr);
          ctx.lineWidth = c % 2 === 0 ? 2.4 : 1.5;
          ctx.strokeStyle = c % 2 === 0 ? '#FFFFFF' : '#38BDF8';
          ctx.stroke();
        }
        ctx.restore();
        _drawConcentricShockwave(ctx, fx.x, fx.y, rad * 1.35, p, '#38BDF8', 'rgba(56, 189, 248, 0.22)', 2);
      } else if (fx.kind === 'swordRainStrike') {
        const rad = fx.radius || 48;
        _drawGlowQuad(ctx, fx.x, fx.y, rad, 'summoned_sword', 'rgba(125, 211, 252, 0.88)', 'rgba(29, 78, 216, 0.34)', alpha);
        _drawSpriteStripFrame(ctx, 'swordRain', 8, p, fx.x, fx.y - 16, rad * 2.2, rad * 2.2, alpha, 0);
        // Falling phantom sword impact spike
        ctx.save();
        ctx.globalAlpha = alpha;
        const dropY = fx.y - (1 - Math.min(1, p * 2.5)) * 55;
        ctx.beginPath();
        ctx.moveTo(fx.x, dropY + 14);
        ctx.lineTo(fx.x - 4, dropY - 12);
        ctx.lineTo(fx.x, dropY - 18);
        ctx.lineTo(fx.x + 4, dropY - 12);
        ctx.closePath();
        ctx.fillStyle = '#E0F2FE';
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = '#0284C7';
        ctx.stroke();
        ctx.restore();
      } else if (fx.kind === 'doppelPortal') {
        const rad = fx.radius || 58;
        _drawGlowQuad(ctx, fx.x, fx.y, rad * 1.4, 'doppel_portal', 'rgba(56, 189, 248, 0.85)', 'rgba(59, 130, 246, 0.34)', alpha);
        _drawSpriteStripFrame(ctx, 'doppelgangerPortal', 8, p, fx.x, fx.y, rad * 2.3, rad * 2.3, alpha, 0);
      } else if (fx.kind === 'miniJceFlurry') {
        const rad = fx.radius || 64;
        const cx = (fx.trackTarget && fx.trackTarget.x !== undefined) ? fx.trackTarget.x : fx.x;
        const cy = (fx.trackTarget && fx.trackTarget.y !== undefined) ? fx.trackTarget.y : fx.y;
        const elapsedTicks = Math.max(0, (fx.maxTimer || 22) - (fx.timer || 0));

        ctx.save();
        // Clip strictly around just the target body zone (never occupies the arena, zero glass shatter)
        ctx.beginPath();
        ctx.arc(cx, cy, rad * 1.32, 0, Math.PI * 2);
        ctx.clip();

        if (Array.isArray(fx.cuts)) {
          for (let c = 0; c < fx.cuts.length; c++) {
            const cut = fx.cuts[c];
            const cutAge = elapsedTicks - (cut.delay || 0);
            const dur = cut.dur || 11;
            if (cutAge < 0 || cutAge > dur) continue;

            const ca = Math.cos(cut.ang);
            const sa = Math.sin(cut.ang);
            const segLen = cut.len || rad * 1.9;
            const halfLen = segLen * 0.5;
            const mx = cx + (cut.ox || 0);
            const my = cy + (cut.oy || 0);
            const startX = mx - ca * halfLen;
            const startY = my - sa * halfLen;

            // 3-stage animated slice: whip travel across target -> slit hold -> tail-to-tip zip wipe
            const travelDur = Math.max(2.0, dur * 0.32);
            const closeStart = Math.max(travelDur + 1.0, dur * 0.62);
            const tipT = Math.min(1, 1 - Math.pow(Math.max(0, 1 - (cutAge + 0.5) / travelDur), 2));
            const tailT = cutAge > closeStart ? Math.pow(Math.min(1, (cutAge - closeStart) / (dur - closeStart)), 1.35) : 0;
            if (tipT - tailT <= 0.04) continue;

            const x1 = startX + ca * segLen * tailT;
            const y1 = startY + sa * segLen * tailT;
            const x2 = startX + ca * segLen * tipT;
            const y2 = startY + sa * segLen * tipT;
            const cutAlpha = cutAge > closeStart ? Math.max(0.15, 1 - tailT * 0.85) : 1.0;

            _drawRazorScreenSlashSeam(ctx, x1, y1, x2, y2, cut.thickness || 1.9, cutAlpha, '#FFFFFF', cut.halo || '#38BDF8');

            // Animated Yamato slash sprite progression aligned smoothly at square aspect (+0.43 compensates baked slant)
            const stripSize = segLen * 1.32;
            _drawSpriteStripFrame(ctx, 'screenSlash', 8, cutAge / dur, mx, my, stripSize, stripSize, cutAlpha * 0.96, cut.ang + 0.43);

            // Moving leading tip spark glint while the blade zips across the target
            if (cutAge <= travelDur + 1.0) {
              _drawSpriteStripFrame(ctx, 'crossGlint', 6, Math.min(1, cutAge / (travelDur + 1.0)), x2, y2, rad * 1.05, rad * 1.05, 0.96, cut.ang);
            }
          }
        }
        ctx.restore();
      } else if (fx.kind === 'yamatoParryBurst') {
        const rad = fx.radius || 56;
        const isSparda = (fighter.vergilForm || 0) >= 1;
        _drawGlowQuad(
          ctx,
          fx.x,
          fx.y,
          rad * 1.15,
          isSparda ? 'crimson_burst' : 'judgment_sphere',
          isSparda ? 'rgba(244, 63, 94, 0.92)' : 'rgba(186, 230, 253, 0.92)',
          isSparda ? 'rgba(56, 189, 248, 0.35)' : 'rgba(37, 99, 235, 0.42)',
          alpha * 0.92
        );
        _drawSpriteStripFrame(ctx, 'crossGlint', 6, p, fx.x, fx.y, rad * 2.1, rad * 2.1, alpha, fx.angle || 0);
        _drawSpriteStripFrame(ctx, 'yamatoCleave', 4, Math.min(1, p * 1.25), fx.x, fx.y, rad * 2.3, rad * 2.3, alpha * 0.88, (fx.angle || 0) + 1.25);
        _drawConcentricShockwave(ctx, fx.x, fx.y, rad * 1.45, p, isSparda ? '#FB7185' : '#BAE6FD', 'rgba(56, 189, 248, 0.28)', 2);
      } else if (fx.kind === 'slashEruption') {
        const rad = fx.radius || 54;
        _drawSpriteStripFrame(ctx, 'slashEruption', 7, p, fx.x, fx.y, rad * 2.4, rad * 2.4, alpha, fx.rotation || 0);
        _drawSpriteStripFrame(ctx, 'crossGlint', 6, p, fx.x, fx.y, rad * 1.6, rad * 1.6, alpha, fx.rotation || 0);
      } else if (fx.kind === 'screenSlashLine') {
        const len = fx.length || 380;
        const ang = fx.angle || 0;
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        const extendP = Math.min(1, p * 3.2);
        const x1 = fx.x - ca * len * 0.5 * extendP;
        const y1 = fx.y - sa * len * 0.5 * extendP;
        const x2 = fx.x + ca * len * 0.5 * extendP;
        const y2 = fx.y + sa * len * 0.5 * extendP;
        _drawRazorScreenSlashSeam(ctx, x1, y1, x2, y2, fx.thickness || 2.8, alpha, '#FFFFFF', fx.haloColor || '#38BDF8');
        _drawSpriteStripFrame(ctx, 'screenSlash', 8, p, fx.x, fx.y, len * 0.95, 110, alpha * 0.95, ang);
      } else if (fx.kind === 'dimensionShatterBurst') {
        const aW = fx.arenaW || ((fx.radius || 240) * 1.45);
        const aH = fx.arenaH || ((fx.radius || 240) * 1.45);
        const aX = fx.arenaX ?? (fx.x - aW * 0.5);
        const aY = fx.arenaY ?? (fx.y - aH * 0.5);
        const rad = Math.max(fx.radius || 240, Math.hypot(aW, aH) * 0.56);
        const shatterAlpha = p < 0.72
          ? Math.min(1, 0.85 + p * 0.25)
          : Math.max(0, (1 - p) / 0.28);

        ctx.save();
        ctx.beginPath();
        ctx.rect(aX, aY, aW, aH);
        ctx.clip();
        _drawGlowQuad(ctx, fx.x, fx.y, rad * 1.25, 'jce_flash', 'rgba(224, 242, 254, 0.95)', 'rgba(56, 189, 248, 0.48)', shatterAlpha * 0.92);
        // Crop internal transparent padding from each 128x128 cell (glass pane occupies x=10..117, y=23..103)
        // so shattered glass spans 100% corner-to-corner across the entire arena box
        _drawSpriteStripFrame(
          ctx,
          'dimensionShatter',
          6,
          p,
          aX + aW * 0.5,
          aY + aH * 0.5,
          aW + 4,
          aH + 4,
          shatterAlpha * 0.98,
          0,
          { x: 10 / 128, y: 23 / 128, w: 108 / 128, h: 81 / 128 }
        );
        _drawConcentricShockwave(ctx, fx.x, fx.y, rad * 1.12, p, '#BAE6FD', 'rgba(56, 189, 248, 0.30)', 4);
        ctx.restore();
      }
    }
  }

  // 4. Judgment Cut End Active Stasis Domain & Whole-Arena Rapid Slashes (State 3000 -> 3004)
  if (fighter.jceState && fighter.jceState.active && fighter.jceState.phase !== 'dash') {
    const jce = fighter.jceState;
    const total = jce.chargeTicks + jce.slashTicks + jce.shatterTicks;
    const elapsed = total - (jce.timer || 0);
    const dimAlpha = jce.phase === 'shatter'
      ? Math.max(0, Math.min(0.74, (jce.timer / Math.max(1, jce.shatterTicks)) * 0.74))
      : Math.min(0.72, (elapsed / Math.max(1, jce.chargeTicks)) * 0.72);

    const aW = jce.arenaW ?? 450;
    const aH = jce.arenaH ?? 450;
    const aX = jce.arenaX ?? (jce.cx - aW * 0.5);
    const aY = jce.arenaY ?? (jce.cy - aH * 0.5);

    ctx.save();
    // Clip cleanly to the entire arena rectangle so Judgment Cut End occupies 100% of the arena box
    ctx.beginPath();
    ctx.rect(aX, aY, aW, aH);
    ctx.clip();

    // Whole-arena dimensional blackout & subtle cyan pressure wash
    ctx.fillStyle = `rgba(4, 8, 24, ${dimAlpha.toFixed(3)})`;
    ctx.fillRect(aX, aY, aW, aH);

    // Whole-arena perimeter glow seam
    ctx.lineWidth = 3.0;
    ctx.strokeStyle = jce.phase === 'shatter' ? '#FFFFFF' : '#38BDF8';
    ctx.strokeRect(aX + 1.5, aY + 1.5, Math.max(1, aW - 3), Math.max(1, aH - 3));

    // Persistent Whole-Arena Rapid Crisscross Slash Seams (MUGEN State 3002 -> 3004)
    if (Array.isArray(jce.screenCuts)) {
      const cutFade = jce.phase === 'shatter' ? Math.max(0, jce.phaseTimer / Math.max(1, jce.shatterTicks)) : 1.0;
      for (let i = 0; i < jce.screenCuts.length; i++) {
        const cut = jce.screenCuts[i];
        const ageP = Math.min(1, (cut.age || 0) / 5);
        const sx2 = cut.x1 + (cut.x2 - cut.x1) * ageP;
        const sy2 = cut.y1 + (cut.y2 - cut.y1) * ageP;
        const seamAlpha = cutFade * (0.78 + 0.22 * Math.sin(vfxTick * 0.6 + i));
        _drawRazorScreenSlashSeam(ctx, cut.x1, cut.y1, sx2, sy2, cut.thickness || 2.6, seamAlpha, '#FFFFFF', cut.halo || '#38BDF8');

        if ((cut.age || 0) < 12) {
          const midX = (cut.x1 + cut.x2) * 0.5;
          const midY = (cut.y1 + cut.y2) * 0.5;
          const segLen = Math.hypot(cut.x2 - cut.x1, cut.y2 - cut.y1);
          const ang = Math.atan2(cut.y2 - cut.y1, cut.x2 - cut.x1);
          _drawSpriteStripFrame(ctx, 'screenSlash', 8, (cut.age || 0) / 12, midX, midY, segLen * 0.92, 110, 0.94 * cutFade, ang);
        }
      }
    }

    if (jce.phase === 'slash') {
      _drawSpriteStripFrame(ctx, 'crossGlint', 6, (vfxTick % 10) / 10, aX + aW * 0.5, aY + aH * 0.5, aW * 0.85, aH * 0.85, 0.85, vfxTick * 0.22);
    }
    ctx.restore();
  }

  // 5. Roaring Knight-style Parry Block Stars & Clash Arcs
  const parryVfx = fighter?.activeParryBlockVfx;
  if (Array.isArray(parryVfx) && parryVfx.length > 0) {
    for (let i = 0; i < parryVfx.length; i++) {
      const fx = parryVfx[i];
      const alpha = Math.max(0, Math.min(1, (fx.life || 0) / Math.max(1, fx.maxLife || 14)));
      if (alpha <= 0.01) continue;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(fx.x, fx.y);

      if (fx.kind === 'clash_arc') {
        ctx.rotate(fx.angle || 0);
        const radius = fx.radius || 32;
        const spread = 0.72 * (1 - 0.35 * (1 - alpha));
        ctx.strokeStyle = '#0A0B10';
        ctx.lineWidth = 4.5 * alpha;
        ctx.beginPath();
        ctx.arc(0, 0, radius, -spread, spread);
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.4 * alpha;
        ctx.beginPath();
        ctx.arc(0, 0, radius, -spread, spread);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      // 4-point block star spark matching Roaring Knight obj_block_vfx
      const s = (fx.size || 8) * (0.55 + 0.65 * alpha);
      const inner = s * 0.28;
      ctx.rotate(fx.angle || 0);
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#0A0B10';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(inner, -inner);
      ctx.lineTo(s, 0);
      ctx.lineTo(inner, inner);
      ctx.lineTo(0, s);
      ctx.lineTo(-inner, inner);
      ctx.lineTo(-s, 0);
      ctx.lineTo(-inner, -inner);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
}
