// ───────────────────────────────────────────────────────────────────────────
// CAROL HOLIDAY (Deltarune — "Resolve") Frost Katana, Daggers, Snowflakes & VFX
// Adheres strictly to:
// - Rule 11: Zero ctx.shadowBlur
// - Rule 15: Double-tapered crescent slash & tail-to-tip recovery eraser wipe
// - Rule 20: Canonical lower-flank hands (±r*0.82, +r*0.38), never above head
// - Rule 26: Clean staggered concentric shockwave ripples (zero cobwebs)
// - Rule 30: 5-phase melee kinematics, arm linkages & leading-edge lock
// - Rule 35: Pre-baked offscreen radial glows & integer nearest-neighbor sprites
// ───────────────────────────────────────────────────────────────────────────

import { state } from '../../core/state.js';
import { drawPixelHand } from '../renderers/fighterRenderer.js';

const _spriteCache = {};
let _spritePreloaded = false;

export function _preloadCarolWeaponSprites() {
  if (_spritePreloaded || typeof Image === 'undefined') return;
  _spritePreloaded = true;
  const manifest = {
    katana: 'Assets/model/carol/Carol-katana.png?v=1',
    dagger: 'Assets/model/carol/Carol-dagger.png?v=1',
    dagger2: 'Assets/model/carol/Carol-dagger-2.png?v=1',
    dagger3: 'Assets/model/carol/Carol-dagger-3.png?v=1',
    dagger4: 'Assets/model/carol/Carol-dagger-4.png?v=1',
    dagger5: 'Assets/model/carol/Carol-dagger-5.png?v=1',
    dagger6: 'Assets/model/carol/Carol-dagger-6.png?v=1',
    dagger7: 'Assets/model/carol/Carol-dagger-7.png?v=1',
    dagger8: 'Assets/model/carol/Carol-dagger-8.png?v=1',
    daggerTrail: 'Assets/model/carol/Carol-dagger-trail.png?v=1',
    daggerAim: 'Assets/model/carol/Carol-dagger-aim.png?v=1',
    knifeDmg: 'Assets/model/carol/Carol-knife-dmg.png?v=1',
    snowflake: 'Assets/model/carol/Carol-snowflake.png?v=1',
    snowflakeAura: 'Assets/model/carol/Carol-snowflake-aura.png?v=1',
    icicle: 'Assets/model/carol/Carol-icicle.png?v=1',
    icicle2: 'Assets/model/carol/Carol-icicle-2.png?v=1',
    icicle3: 'Assets/model/carol/Carol-icicle-3.png?v=1',
    icicle4: 'Assets/model/carol/Carol-icicle-4.png?v=1',
    icicle5: 'Assets/model/carol/Carol-icicle-5.png?v=1',
    slashLine: 'Assets/model/carol/Carol-slash-line.png?v=1',
    quickBeam: 'Assets/model/carol/Carol-quick-beam.png?v=1',
    quickArc1: 'Assets/model/carol/Carol-quick-arc-1.png?v=1',
    quickArc2: 'Assets/model/carol/Carol-quick-arc-2.png?v=1',
    quickArc: 'Assets/model/carol/Carol-quick-arc.png?v=1',
    quickArc4: 'Assets/model/carol/Carol-quick-arc-4.png?v=1',
    fractalBeam: 'Assets/model/carol/Carol-fractal-beam.png?v=1',
    fractalRing: 'Assets/model/carol/Carol-fractal-ring.png?v=1',
    fractalFlash: 'Assets/model/carol/Carol-fractal-flash.png?v=1',
    fractalCore: 'Assets/model/carol/Carol-fractal-core.png?v=1',
    fractalStreak: 'Assets/model/carol/Carol-fractal-streak.png?v=1',
    blizzardSnow: 'Assets/model/carol/Carol-blizzard-snow.png?v=1',
    permafrostScreen: 'Assets/model/carol/Carol-permafrost-screen.png?v=1',
    cspell1: 'Assets/model/carol/Carol-cspell-1.png?v=1',
    cspell2: 'Assets/model/carol/Carol-cspell-2.png?v=1',
    cspell3: 'Assets/model/carol/Carol-cspell-3.png?v=1',
    cspell4: 'Assets/model/carol/Carol-cspell-4.png?v=1',
    cspell5: 'Assets/model/carol/Carol-cspell-5.png?v=1',
  };
  for (const [key, src] of Object.entries(manifest)) {
    const img = new Image();
    img.src = src;
    _spriteCache[key] = img;
  }
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _preloadCarolWeaponSprites();
}

function _getReadySprite(key) {
  _preloadCarolWeaponSprites();
  const img = _spriteCache[key];
  return (img && img.complete && img.naturalWidth > 0) ? img : null;
}

const _glowCache = new Map();
function _getPrebakedGlow(colorHex) {
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

function _uploadWarmTexture(targetCtx, drawable) {
  if (!targetCtx || typeof targetCtx.drawImage !== 'function' || !drawable) return;
  try {
    targetCtx.save();
    targetCtx.globalAlpha = 0.001;
    targetCtx.drawImage(drawable, 0, 0, 1, 1, -20, -20, 1, 1);
  } catch (_) {
    // Ignore headless/unloaded bitmap edge
  } finally {
    targetCtx.restore();
  }
}

export function prewarmCarolVfx(targetCtx = null) {
  _preloadCarolWeaponSprites();
  let warmed = 0;
  for (const hex of ['#38BDF8', '#BAE6FD', '#7DD3FC', '#6366F1']) {
    const glow = _getPrebakedGlow(hex);
    if (glow) {
      _uploadWarmTexture(targetCtx, glow);
      warmed++;
    }
  }
  for (const img of Object.values(_spriteCache)) {
    if (img && img.complete && img.naturalWidth > 0) {
      _uploadWarmTexture(targetCtx, img);
      warmed++;
    }
  }
  return warmed;
}

export function getCarolVfxCacheCounts() {
  return {
    glows: _glowCache.size,
    sprites: Object.keys(_spriteCache).length,
  };
}

/**
 * Computes Rule 30 5-phase katana swing rotation + Deltarune Resolve active cast animations
 * (`upslash`, `downslash`, `flurry`, `sheath`, `point`, `spell`).
 */
export function computeCarolSwordKinematics(fighter) {
  if (!fighter) {
    return {
      isSwinging: false, weaponRot: -0.22, lunge: 0, offY: 0,
      tremorX: 0, tremorY: 0, slashActive: false, startAngle: 0, endAngle: 0, alpha: 0,
    };
  }

  if (!fighter.swordSwingTimer || fighter.swordSwingTimer <= 0) {
    const ct = fighter.castAnimTimer || 0;
    const cm = Math.max(1, fighter.castAnimMax || 24);
    const mode = fighter.castAnimType;
    if (ct > 0 && mode) {
      const elapsed = cm - ct;
      const prog = Math.max(0, Math.min(1, elapsed / cm));
      if (mode === 'flurry' || mode === 'upslash' || mode === 'downslash') {
        const beatLen = mode === 'flurry' ? 8 : Math.max(5, cm);
        const beatIdx = Math.floor(elapsed / beatLen);
        const bp = (elapsed % beatLen) / beatLen;
        const dir = mode === 'upslash' ? -1 : (mode === 'downslash' ? 1 : (beatIdx % 2 === 0 ? -1 : 1));
        const coil = dir * -1.82;
        const lock = dir * 1.62;
        const whip = Math.pow(Math.min(1, bp / 0.55), 2.1);
        const rot = bp < 0.55 ? coil + (lock - coil) * whip : lock * Math.max(0, 1 - (bp - 0.55) / 0.45);
        const wipeP = bp > 0.55 ? (bp - 0.55) / 0.45 : 0;
        return {
          isSwinging: true,
          isCastFlurry: true,
          weaponRot: rot,
          lunge: bp < 0.55 ? (-4 + 20 * whip) : (16 * (1 - wipeP)),
          offY: dir * 8 * Math.sin(bp * Math.PI),
          tremorX: 0,
          tremorY: 0,
          slashActive: true,
          startAngle: bp < 0.55 ? coil : (coil + (lock - coil) * wipeP),
          endAngle: bp < 0.55 ? rot : lock,
          alpha: bp < 0.55 ? 0.96 : (1 - wipeP) * 0.90,
        };
      }
      if (mode === 'stance') {
        // Resolve 0:55-0:59.5 casting stance: dark katana held cleanly forward-angled at waist height
        const sway = Math.sin(elapsed * 0.28) * 1.5;
        return {
          isSwinging: false,
          castPose: 'stance',
          weaponRot: -0.06,
          lunge: 4 + sway,
          offY: 0,
          tremorX: 0,
          tremorY: 0,
          slashActive: false,
          startAngle: 0,
          endAngle: 0,
          alpha: 0,
          glint: 0.35 + 0.25 * Math.sin(elapsed * 0.4),
        };
      }
      if (mode === 'sheath') {
        // Resolve Carol_Sheath1..8: draws blade smoothly along lower waist then flashes crisp iaijutsu glint
        const snapPhase = prog < 0.55 ? Math.sin((prog / 0.55) * Math.PI * 0.5) : 1 - ((prog - 0.55) / 0.45);
        return {
          isSwinging: false,
          castPose: 'sheath',
          weaponRot: -0.08 - 0.14 * snapPhase,
          lunge: -10 * snapPhase,
          offY: 2 * snapPhase,
          tremorX: 0,
          tremorY: 0,
          slashActive: false,
          startAngle: 0,
          endAngle: 0,
          alpha: 0,
          glint: Math.max(0, 1 - Math.abs(prog - 0.55) * 4.5),
        };
      }
      if (mode === 'point') {
        // Resolve Carol_Point: katana tucked back in off-hand while front casting hand points forward
        const hold = Math.sin(Math.min(1, prog * 3.5) * Math.PI * 0.5) * Math.min(1, (1 - prog) * 3.2 + 0.2);
        return {
          isSwinging: false,
          castPose: 'point',
          weaponRot: Math.PI - 0.14,
          lunge: 0,
          offY: 0,
          tremorX: 0,
          tremorY: 0,
          slashActive: false,
          startAngle: 0,
          endAngle: 0,
          alpha: 0,
          pointAmount: Math.max(0, Math.min(1, hold)),
        };
      }
      if (mode === 'spell') {
        // Resolve Carol_Sheath1..3 spell hold (`Carol_Heal` / `PERMAFROST` channel)
        const pulse = 0.5 + 0.5 * Math.sin(elapsed * 0.35);
        return {
          isSwinging: false,
          castPose: 'spell',
          weaponRot: -0.08,
          lunge: -5,
          offY: -2 * pulse,
          tremorX: 0,
          tremorY: 0,
          slashActive: false,
          startAngle: 0,
          endAngle: 0,
          alpha: 0,
          glint: 0.45 + 0.4 * pulse,
        };
      }
    }

    return {
      isSwinging: false,
      weaponRot: -0.22,
      lunge: 0,
      offY: 0,
      tremorX: 0,
      tremorY: 0,
      slashActive: false,
      startAngle: 0,
      endAngle: 0,
      alpha: 0,
    };
  }

  const totalF = Math.max(1, fighter.swordSwingMax || 35);
  const elapsed = totalF - fighter.swordSwingTimer;
  const liftF = fighter.swordSwingLiftFrames || 8;
  const holdF = fighter.swordSwingHoldFrames || 3;
  const strikeF = fighter.swordSwingStrikeFrames || 6;
  const lockF = fighter.swordSwingImpactLockFrames || 6;
  const recF = Math.max(1, totalF - (liftF + holdF + strikeF + lockF));

  const isUpSlash = (fighter.swordComboStep || 1) === 1;
  const dir = isUpSlash ? -1 : 1; // Hit 1 = Upward Rising Slash, Hit 2 = Downward Frost Cleave
  const coilAngle = dir * -1.45;
  const lockAngle = dir * 1.18;

  const holdEnd = liftF + holdF;
  const strikeEnd = holdEnd + strikeF;
  const lockEnd = strikeEnd + lockF;

  let weaponRot = 0;
  let lunge = 0;
  let offY = 0;
  let tremorX = 0;
  let tremorY = 0;
  let slashActive = false;
  let startAngle = coilAngle;
  let endAngle = lockAngle;
  let alpha = 0;

  if (elapsed < liftF) {
    const wp = elapsed / Math.max(1, liftF);
    const ease = Math.sin(wp * Math.PI * 0.5);
    weaponRot = coilAngle * ease;
    lunge = -8 * ease;
    offY = -dir * 6 * ease;
  } else if (elapsed < holdEnd) {
    weaponRot = coilAngle;
    lunge = -8;
    offY = -dir * 6;
  } else if (elapsed < strikeEnd) {
    const sp = (elapsed - holdEnd) / Math.max(1, strikeF);
    const whip = Math.pow(sp, 2.35);
    weaponRot = coilAngle + (lockAngle - coilAngle) * whip;
    lunge = -8 + 26 * whip;
    offY = -dir * 6 + dir * 16 * whip;
    slashActive = true;
    startAngle = coilAngle;
    endAngle = weaponRot; // Rule 30: 1:1 leading-edge lock to blade tip
    alpha = Math.min(1, 0.35 + sp * 0.65);
  } else if (elapsed < lockEnd) {
    const pp = (elapsed - strikeEnd) / Math.max(1, lockF);
    const amp = (1 - pp) * 1.6;
    weaponRot = lockAngle;
    lunge = 18;
    offY = dir * 10;
    tremorX = (Math.sin(elapsed * 29.3) * 0.5) * amp;
    tremorY = (Math.cos(elapsed * 37.1) * 0.5) * amp;
    slashActive = true;
    startAngle = coilAngle;
    endAngle = lockAngle;
    alpha = 0.92;
  } else {
    const rp = Math.min(1, (elapsed - lockEnd) / recF);
    const settle = Math.pow(1 - rp, 1.8);
    const spring = Math.sin(rp * Math.PI * 2.2) * Math.exp(-rp * 4.2);
    weaponRot = lockAngle * settle - (dir * 0.24 * spring);
    lunge = 18 * settle - 5 * spring;
    offY = dir * 10 * settle - dir * 3 * spring;
    if (rp < 0.72) {
      const wipeP = Math.pow(rp / 0.72, 1.4);
      slashActive = true;
      startAngle = coilAngle + (lockAngle - coilAngle) * wipeP; // Rule 15 tail-to-tip wipe
      endAngle = lockAngle;
      alpha = (1 - wipeP) * 0.85;
    }
  }

  return { isSwinging: true, weaponRot, lunge, offY, tremorX, tremorY, slashActive, startAngle, endAngle, alpha };
}

function _drawKatanaSprite(ctx, bladeLen, customW = 1, customL = 1) {
  const img = _getReadySprite('katana');
  const w = bladeLen * 1.15 * customL;
  const h = 19 * customW;
  if (img) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -w * 0.22, -h * 0.5, w, h);
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.fillStyle = '#1A4B7C';
  ctx.strokeStyle = '#0E0F14';
  ctx.lineWidth = 1.6;
  ctx.fillRect(0, -3, bladeLen, 6);
  ctx.strokeRect(0, -3, bladeLen, 6);
  ctx.fillStyle = '#BAE6FD';
  ctx.fillRect(4, -1, bladeLen - 6, 3);
  ctx.fillStyle = '#7CE8FF';
  ctx.fillRect(-3, -7, 4, 14);
  ctx.restore();
}

function _drawFrostCrescentRibbon(ctx, r, kin, bladeLen) {
  if (!kin.slashActive || kin.alpha <= 0.02) return;
  const sweep = kin.endAngle - kin.startAngle;
  if (Math.abs(sweep) < 0.06) return;

  const innerR = kin.isCastFlurry ? r * 0.72 : r * 0.82;
  const outerR = kin.isCastFlurry
    ? Math.max(r * 2.45, r * 0.85 + bladeLen + 14)
    : (r * 0.82 + bladeLen + 5); // Rule 30: wrap 4-5px beyond tip
  const steps = 16;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, kin.alpha));

  // Outer icy cyan crescent body
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = kin.startAngle + sweep * t;
    const taper = Math.pow(Math.sin(t * Math.PI), 1.05) * (0.35 + 0.65 * t);
    const rad = innerR + (outerR - innerR) * (0.45 + 0.55 * taper);
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const a = kin.startAngle + sweep * t;
    const rad = innerR + (outerR - innerR) * (kin.isCastFlurry ? 0.14 : 0.22);
    ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = kin.isCastFlurry ? 'rgba(56, 189, 248, 0.82)' : 'rgba(56, 189, 248, 0.72)';
  ctx.fill();

  if (kin.isCastFlurry) {
    // Bold snow-white inner crescent & frosted cloud puffs along the Resolve 1:00.0 swing
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = kin.startAngle + sweep * t;
      const taper = Math.pow(Math.sin(t * Math.PI), 1.15) * (0.35 + 0.65 * t);
      const rad = innerR + (outerR - innerR) * (0.40 + 0.44 * taper);
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const a = kin.startAngle + sweep * t;
      const rad = innerR + (outerR - innerR) * 0.22;
      ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(240, 249, 255, 0.94)';
    ctx.fill();

    // Bursting icy splash puffs along outer edge
    const puffDots = [0.22, 0.45, 0.68, 0.86];
    for (let k = 0; k < puffDots.length; k++) {
      const pt = puffDots[k];
      const pa = kin.startAngle + sweep * pt;
      const pr = outerR * (0.95 + (k % 2) * 0.12);
      const px = Math.cos(pa) * pr;
      const py = Math.sin(pa) * pr;
      ctx.fillStyle = k % 2 === 0 ? 'rgba(186, 230, 253, 0.80)' : 'rgba(240, 249, 255, 0.88)';
      ctx.beginPath();
      ctx.arc(px, py, 6 + (k % 2) * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Hot snow-white cutting edge streak
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = kin.startAngle + sweep * t;
    const rad = outerR - 3;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = '#F0F9FF';
  ctx.lineWidth = kin.isCastFlurry ? 3.6 : 2.6;
  ctx.stroke();
  ctx.restore();
}

/**
 * Renders Carol's Frost Katana, canonical lower-flank hands (Dante radius r * 0.30) & slash ribbon.
 * Rule 20 & Rule 30: Strictly lower-torso hemisphere anchors without attached arm bars.
 */
export function drawCarolKatanaAndSlashVFX(ctx, fighter) {
  if (!fighter) return;
  const r = fighter.r || fighter.radius || 25;
  const custom = state.weaponCustomizations?.carol || {};
  const scale = custom.scale ?? 1.0;
  const wScale = custom.widthScale ?? 1.0;
  const lScale = custom.lengthScale ?? 1.0;
  const offX = custom.offsetX ?? 0;
  const offY = custom.offsetY ?? 0;
  const angOff = custom.angleOffset ?? 0;

  const baseAngle = fighter.swordSwingTimer > 0
    ? (fighter.swordSlashAngle ?? fighter.gunAngle ?? 0)
    : (fighter._isWinnerReveal ? 0 : (fighter.gunAngle || 0));
  const normAngle = Math.atan2(Math.sin(baseAngle), Math.cos(baseAngle));
  const facingLeft = Math.abs(normAngle) > Math.PI / 2;

  const kin = computeCarolSwordKinematics(fighter);
  const handR = r * 0.30; // Canonical Dante hand size standard (r * 0.30, without getHandSize 1.4x multiplier)
  const bladeLen = r * 1.95 * scale;

  ctx.save();
  ctx.translate((fighter.x || 0) + kin.tremorX + offX, (fighter.y || 0) - (fighter.z || 0) + kin.tremorY + offY);
  ctx.rotate(baseAngle + angOff);
  if (facingLeft) {
    ctx.scale(1, -1);
  }

  // Slash crescent rendered in blade swing plane
  if (kin.slashActive) {
    ctx.save();
    ctx.translate(kin.lunge * 0.45, Math.max(0, r * 0.34 + kin.offY * 0.3));
    _drawFrostCrescentRibbon(ctx, r, kin, bladeLen);
    ctx.restore();
  }

  // Canonical lower-flank anchors (strictly y >= +0.30r per Rule 20!)
  const isPointPose = kin.castPose === 'point';
  const pointExt = isPointPose ? (kin.pointAmount || 1) * (r * 0.44) : 0;
  const rightHandX = r * 0.82 + kin.lunge + pointExt;
  const rightHandY = Math.max(r * 0.32, r * 0.42 + kin.offY * 0.35);
  const leftHandX = kin.castPose === 'sheath'
    ? (r * 0.12)
    : (-r * 0.82 + kin.lunge * 0.25);
  const leftHandY = Math.max(r * 0.32, r * 0.38);

  if (isPointPose) {
    // Resolve Carol_Point: katana tucked back in off-hand while front hand points outward with frost flare
    ctx.save();
    ctx.translate(leftHandX, leftHandY);
    ctx.rotate(kin.weaponRot);
    _drawKatanaSprite(ctx, bladeLen, wScale, lScale);
    drawPixelHand(ctx, 0, 0, handR, '#E8DEC8', '#0E0F14');
    ctx.restore();

    const pGlow = _getPrebakedGlow('#38BDF8');
    if (pGlow) {
      ctx.save();
      ctx.globalAlpha = 0.45 + 0.35 * (kin.pointAmount || 1);
      ctx.drawImage(pGlow, rightHandX - 18, rightHandY - 18, 36, 36);
      ctx.restore();
    }
    drawPixelHand(ctx, rightHandX, rightHandY, handR, '#E8DEC8', '#0E0F14');
  } else {
    // Off-hand resting/scabbard hand (back flank)
    drawPixelHand(ctx, leftHandX, leftHandY, handR, '#E8DEC8', '#0E0F14');

    // Main-hand Frost Katana + grip hand (front flank)
    ctx.save();
    ctx.translate(rightHandX, rightHandY);
    ctx.rotate(kin.weaponRot);
    _drawKatanaSprite(ctx, bladeLen, wScale, lScale);
    if ((kin.glint || 0) > 0.05) {
      const gSize = 10 * kin.glint;
      ctx.fillStyle = '#F0F9FF';
      ctx.globalAlpha = Math.min(1, kin.glint);
      ctx.beginPath();
      ctx.moveTo(0, -gSize);
      ctx.lineTo(2.4, -2.4);
      ctx.lineTo(gSize, 0);
      ctx.lineTo(2.4, 2.4);
      ctx.lineTo(0, gSize);
      ctx.lineTo(-2.4, 2.4);
      ctx.lineTo(-gSize, 0);
      ctx.lineTo(-2.4, -2.4);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    drawPixelHand(ctx, 0, 0, handR, '#E8DEC8', '#0E0F14');
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws the swirling pale-blue/white frosted mist vortex beneath Carol (`0:55.0` cast stance & `1:00.0` burst).
 * Zero shadowBlur / per-frame gradient allocations (Rules 11 & 35).
 */
export function drawCarolCastMist(ctx, fighter) {
  if (!fighter || !(fighter.castMistTimer > 0)) return;
  const maxT = Math.max(1, fighter.castMistMax || 48);
  const ratio = Math.max(0, Math.min(1, fighter.castMistTimer / maxT));
  const x = fighter.x || 0;
  const y = (fighter.y || 0) - (fighter.z || 0);
  const r = fighter.r || fighter.radius || 25;
  const t = fighter._vfxTick || 0;

  ctx.save();
  ctx.globalAlpha = Math.min(0.85, ratio * 1.4);
  const glow = _getPrebakedGlow('#BAE6FD');
  if (glow) {
    ctx.save();
    ctx.globalAlpha *= 0.45;
    ctx.drawImage(glow, x - r * 2.2, y + r * 0.1, r * 4.4, r * 1.6);
    ctx.restore();
  }

  for (let i = 0; i < 6; i++) {
    const phase = (t * 0.09 + i * 1.05);
    const ox = Math.cos(phase) * (r * (0.45 + (i % 3) * 0.38));
    const oy = r * 0.88 + Math.sin(phase * 1.3) * (r * 0.18);
    const rx = r * (0.55 - (i % 2) * 0.16);
    const ry = r * 0.20;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(186, 230, 253, 0.56)' : 'rgba(240, 249, 255, 0.72)';
    ctx.beginPath();
    ctx.ellipse(x + ox, y + oy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draws expanding Resolve `Cspell1..5` additive magic crests behind Carol during `PERMAFROST` & `Carol_Heal`.
 */
export function drawCarolSpellPulses(ctx, rings = []) {
  if (!rings || rings.length === 0) return;
  const keys = ['cspell1', 'cspell2', 'cspell3', 'cspell4', 'cspell5'];
  for (let i = 0; i < rings.length; i++) {
    const rg = rings[i];
    if (!rg || rg.life <= 0) continue;
    const maxL = Math.max(1, rg.maxLife || 18);
    const p = 1 - rg.life / maxL;
    const alpha = rg.life < maxL * 0.45 ? rg.life / (maxL * 0.45) : 1.0;
    const frameIdx = Math.min(4, Math.floor(p * 5));
    const img = _getReadySprite(keys[frameIdx]);
    const scale = 1.65 + p * 0.75;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.88));
    ctx.translate(rg.x || 0, rg.y || 0);
    if (img && img.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = false;
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, -w * 0.5, -h * 0.5 + 16, w, h);
    } else {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 14, 22 * scale * 0.5, 7 * scale * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * Weapon Studio / Weapon Index preview helper for Carol Holiday.
 */
export function drawCarolWeaponPreview(ctx, x = 0, y = 0, angle = 0, r = 25, opts = {}) {
  const dummy = {
    x,
    y,
    z: 0,
    r,
    gunAngle: angle,
    swordSwingTimer: 0,
    _isWinnerReveal: Boolean(opts.isPreview),
  };
  drawCarolKatanaAndSlashVFX(ctx, dummy);
}

/**
 * Draws an orbiting/firing Frost Antler Dagger (`Carol-dagger.png`..`Carol-dagger-8.png` + `Carol-dagger-aim.png` reticle).
 */
export function drawCarolFrostDagger(ctx, d) {
  if (!d) return;
  const baseAlpha = d.alpha !== undefined ? d.alpha : 1.0;
  const fadeAlpha = d.stuckTimer > 0
    ? Math.max(0, Math.min(1, d.stuckTimer / 12))
    : Math.max(0, Math.min(1, baseAlpha));
  if (fadeAlpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = fadeAlpha;
  ctx.translate(d.x, d.y);
  ctx.rotate(d.angle || 0);

  // Resolve attacks//Dagger_Hailstorm costume 10 (`aim` flare beam expanding 0 -> 500% then fading)
  if ((d.reticleTimer || 0) > 0) {
    const retMax = Math.max(1, d.reticleMax || 14);
    const rp = 1 - d.reticleTimer / retMax;
    const retScaleX = 0.25 + rp * 2.2;
    const retAlpha = rp < 0.5 ? 1.0 : Math.max(0, 1 - (rp - 0.5) * 2.0);
    const aimImg = _getReadySprite('daggerAim');
    ctx.save();
    ctx.globalAlpha *= retAlpha * 0.92;
    if (aimImg) {
      ctx.drawImage(aimImg, 8, -3, 360 * retScaleX, 6);
    } else {
      ctx.fillStyle = '#BAE6FD';
      ctx.fillRect(8, -1.5, 360 * retScaleX, 3);
    }
    ctx.restore();
  } else if (d.aimTimer > 0 && d.stage === 'hold') {
    const p = 1 - d.aimTimer / Math.max(1, d.aimMax || 20);
    ctx.save();
    ctx.strokeStyle = `rgba(186, 230, 253, ${0.28 + 0.45 * p})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(300, 0);
    ctx.stroke();
    ctx.restore();
  }

  const glow = _getPrebakedGlow('#38BDF8');
  if (glow) {
    ctx.save();
    ctx.globalAlpha *= (d.stuckTimer > 0 ? 0.65 : 0.42);
    ctx.drawImage(glow, -24, -18, 48, 36);
    ctx.restore();
  }

  const daggerKeys = ['dagger', 'dagger2', 'dagger3', 'dagger4', 'dagger5', 'dagger6', 'dagger7', 'dagger8'];
  let daggerFrameIdx = 7;
  if (d.spinIdx !== undefined && d.spinIdx < 8) {
    daggerFrameIdx = Math.max(0, Math.min(7, d.spinIdx));
  } else if (d.aimTimer > 0) {
    const spinProg = Math.max(0, Math.min(0.999, 1 - d.aimTimer / Math.max(1, d.aimMax || 20)));
    daggerFrameIdx = Math.floor(spinProg * 8);
  }
  const img = _getReadySprite(daggerKeys[daggerFrameIdx]) || _getReadySprite('dagger');
  if (img) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -22, -9, 44, 18);
  } else {
    ctx.fillStyle = '#BAE6FD';
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-16, -3, 32, 6);
    ctx.strokeRect(-16, -3, 32, 6);
  }
  ctx.restore();
}

/**
 * Draws Resolve Dagger_Hailstorm `knifeDMG` + `effect` beams (`Carol-knife-dmg.png` + tiled `Carol-dagger-trail.png`)
 * tiled across native 517px chunks (zero horizontal distortion across both 450px vertical & 1400px horizontal arenas).
 */
export function drawCarolDaggerTrails(ctx, trails = [], arena = null) {
  if (!trails || trails.length === 0) return;
  const img = _getReadySprite('daggerTrail');
  const dmgImg = _getReadySprite('knifeDmg');

  ctx.save();
  if (arena && arena.width > 0 && arena.height > 0) {
    ctx.beginPath();
    ctx.rect(arena.x, arena.y, arena.width, arena.height);
    ctx.clip();
  }

  const natW = (img && img.naturalWidth > 0) ? img.naturalWidth : 517;
  const natH = (img && img.naturalHeight > 0) ? img.naturalHeight : 29;

  for (let i = 0; i < trails.length; i++) {
    const tr = trails[i];
    const alpha = Math.max(0, Math.min(1, tr.timer / Math.max(1, tr.maxTimer || 18)));
    const len = tr.length || 520;
    const h = 28 * (0.45 + 0.55 * alpha);

    ctx.save();
    ctx.globalAlpha = alpha * 0.92;
    ctx.translate(tr.x, tr.y);
    ctx.rotate(tr.angle || 0);
    if (img) {
      ctx.imageSmoothingEnabled = false;
      for (let ox = 0; ox < len; ox += natW) {
        const segW = Math.min(natW, len - ox);
        const srcW = Math.max(1, Math.round((segW / natW) * natW));
        ctx.drawImage(img, 0, 0, srcW, natH, ox, -h * 0.5, segW, h);
      }
    }
    if (dmgImg) {
      ctx.drawImage(dmgImg, 0, -3.2 * alpha, len, 6.4 * alpha);
    } else {
      ctx.fillStyle = 'rgba(240, 249, 255, 0.78)';
      ctx.fillRect(0, -2.5 * alpha, len, 5 * alpha);
    }
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Draws Resolve Frost_Gale Snowflake (`Carol-snowflake.png`) with `Flake2` bloom aura (`Carol-snowflake-aura.png`).
 */
export function drawCarolFrostGale(ctx, gale) {
  if (!gale) return;
  const scale = gale.scale || 1.0;
  const alpha = gale.alpha !== undefined ? gale.alpha : Math.min(1, (gale.life || 20) / 10);

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.translate(gale.x, gale.y);
  ctx.scale(scale, scale);

  const glow = _getPrebakedGlow('#38BDF8');
  if (glow) {
    ctx.save();
    ctx.globalAlpha *= 0.55;
    ctx.drawImage(glow, -40, -40, 80, 80);
    ctx.restore();
  }

  // Resolve Flake2 pulsing crystal halo right before 6+6 hexagonal detonation
  const auraImg = _getReadySprite('snowflakeAura');
  if (auraImg && (gale.fuseRatio || 0) > 0) {
    const f = Math.max(0, Math.min(1, gale.fuseRatio));
    const auraScale = 0.72 + f * 0.85;
    ctx.save();
    ctx.globalAlpha *= 0.35 + f * 0.65;
    ctx.imageSmoothingEnabled = false;
    const w = 64 * auraScale;
    ctx.drawImage(auraImg, -w * 0.5, -w * 0.5, w, w);
    ctx.restore();
  }

  const img = _getReadySprite('snowflake');
  if (img) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -28, -28, 56, 56);
  } else {
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(-Math.cos(a) * 24, -Math.sin(a) * 24);
      ctx.lineTo(Math.cos(a) * 24, Math.sin(a) * 24);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * Draws an animated Resolve `splitbullet` Icicle Shard cycling all 5 crystal rotation sprites (`Carol-icicle`..`5`).
 */
export function drawCarolIcicleShard(ctx, shard) {
  if (!shard) return;
  const sc = shard.scale || 1.0;
  ctx.save();
  if (shard.alpha !== undefined) ctx.globalAlpha = Math.max(0, Math.min(1, shard.alpha));
  ctx.translate(shard.x, shard.y);
  ctx.rotate(shard.angle || 0);
  ctx.scale(sc, sc);

  const shardKeys = ['icicle', 'icicle2', 'icicle3', 'icicle4', 'icicle5'];
  const frameIdx = Math.floor(((shard.animTick || 0) / 4)) % shardKeys.length;
  const img = _getReadySprite(shardKeys[frameIdx]) || _getReadySprite('icicle');
  if (img) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -12, -8, 24, 16);
  } else {
    ctx.fillStyle = '#7DD3FC';
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-8, -5);
    ctx.lineTo(-8, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draws a single glowing neon Fractal / Split Frost Line (`Carol-slash-line.png`).
 */
export function drawCarolIceSplitLine(ctx, split) {
  if (!split || (split.delayTimer || 0) > 0) return;
  const len = split.length || 640;
  ctx.save();
  ctx.translate(split.cx, split.cy);
  ctx.rotate(split.angle || 0);

  if (split.warnTimer > 0) {
    const p = 1 - split.warnTimer / Math.max(1, split.warnMax || 20);
    // Resolve stretch_setStretch(0 -> 1500) during initial 10 frames before locking width
    const stretchFrac = split.useStretch ? Math.min(1, 0.15 + p * 2.2) : 1.0;
    const drawLen = len * stretchFrac;
    const thinFactor = split.useStretch ? Math.max(0.28, 1.0 - Math.max(0, p - 0.35) * 0.72) : 1.0;

    if (split.isRapidSlash) {
      // Exact Resolve Quick_Slash (`Carol-quick-beam.png` cobalt beam + dark inner core channel)
      const qBeam = _getReadySprite('quickBeam');
      const bw = 34 * (0.45 + 0.55 * p) * thinFactor;
      ctx.globalAlpha = split.isFrozenWait ? 0.92 : (0.55 + 0.40 * p);
      if (qBeam) {
        ctx.drawImage(qBeam, -drawLen * 0.5, -bw * 0.5, drawLen, bw);
      } else {
        ctx.fillStyle = 'rgba(37, 99, 235, 0.65)';
        ctx.fillRect(-drawLen * 0.5, -bw * 0.45, drawLen, bw * 0.90);
      }
      // Crisp dark midnight center ribbon matching Quick_Slash effect2
      ctx.fillStyle = `rgba(6, 10, 24, ${0.72 + 0.22 * p})`;
      ctx.fillRect(-drawLen * 0.5, -bw * 0.14, drawLen, bw * 0.28);
    } else if (split.isFractal) {
      // Exact Resolve Ice_Slash (`xeltallivclipblend_setBlend2(additive)` electric-blue glow + crisp pure-white core)
      const glowW = (14.0 + p * 3.0) * thinFactor;
      const midW = (7.5 + p * 1.5) * thinFactor;
      const coreW = 2.6 + p * 1.1;

      ctx.strokeStyle = `rgba(0, 118, 255, ${0.38 + 0.34 * p})`;
      ctx.lineWidth = glowW;
      ctx.beginPath();
      ctx.moveTo(-drawLen * 0.5, 0);
      ctx.lineTo(drawLen * 0.5, 0);
      ctx.stroke();

      ctx.strokeStyle = `rgba(56, 189, 248, ${0.68 + 0.24 * p})`;
      ctx.lineWidth = midW;
      ctx.beginPath();
      ctx.moveTo(-drawLen * 0.5, 0);
      ctx.lineTo(drawLen * 0.5, 0);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.92 + 0.08 * p})`;
      ctx.lineWidth = coreW;
      ctx.beginPath();
      ctx.moveTo(-drawLen * 0.5, 0);
      ctx.lineTo(drawLen * 0.5, 0);
      ctx.stroke();
    } else {
      ctx.strokeStyle = `rgba(186, 230, 253, ${0.42 + 0.55 * p})`;
      ctx.lineWidth = 2.2 + p * 2.2;
      ctx.beginPath();
      ctx.moveTo(-drawLen * 0.5, 0);
      ctx.lineTo(drawLen * 0.5, 0);
      ctx.stroke();
    }
  } else if (split.activeTimer > 0) {
    const a = split.activeTimer / Math.max(1, split.activeMax || 16);
    const w = (split.width || 34) * (0.45 + 0.55 * a);
    ctx.globalAlpha = Math.max(0, Math.min(1, a));

    if (split.isRapidSlash) {
      const qBeam = _getReadySprite('quickBeam');
      const arcKeys = ['quickArc1', 'quickArc2', 'quickArc', 'quickArc4'];
      const arcProg = Math.max(0, Math.min(0.999, 1 - split.activeTimer / Math.max(1, split.activeMax || 15)));
      const qArc = _getReadySprite(arcKeys[Math.floor(arcProg * 4)]) || _getReadySprite('quickArc');
      const dmgBeam = _getReadySprite('knifeDmg');
      if (qBeam) {
        ctx.drawImage(qBeam, -len * 0.5, -w * 0.6, len, w * 1.2);
      } else {
        ctx.fillStyle = 'rgba(37, 99, 235, 0.65)';
        ctx.fillRect(-len * 0.5, -w * 0.5, len, w);
      }
      if (dmgBeam) {
        ctx.drawImage(dmgBeam, -len * 0.5, -w * 0.16, len, w * 0.32);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-len * 0.5, -w * 0.14, len, w * 0.28);
      }
      if (qArc) {
        ctx.imageSmoothingEnabled = false;
        const arcH = Math.max(20, (qArc.naturalHeight || 25) * 1.05);
        const arcW = Math.max(140, (qArc.naturalWidth || 187));
        ctx.drawImage(qArc, -arcW * 0.5, -arcH * 0.5, arcW, arcH);
      }
    } else {
      ctx.fillStyle = split.isFractal ? 'rgba(56, 189, 248, 0.72)' : 'rgba(56, 189, 248, 0.48)';
      ctx.fillRect(-len * 0.5, -w * (split.isFractal ? 0.85 : 0.65), len, w * (split.isFractal ? 1.7 : 1.3));
      ctx.fillStyle = split.isFractal ? 'rgba(186, 230, 253, 0.85)' : 'rgba(56, 189, 248, 0.58)';
      ctx.fillRect(-len * 0.5, -w * 0.48, len, w * 0.96);
      const img = _getReadySprite('slashLine');
      if (img && !split.isFractal) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, -len * 0.5, -w * 0.42, len, w * 0.84);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-len * 0.5, -w * (split.isFractal ? 0.30 : 0.22), len, w * (split.isFractal ? 0.60 : 0.44));
      }
    }
  }
  ctx.restore();
}

/**
 * Draws Resolve Ice_Slash detonation VFX (`effect1` pulse ring, `effect4` shrinking core,
 * `effect3` wide blade flash & `effect5` 8 directional streak sparks shooting along cut axis).
 */
export function drawCarolFractalBursts(ctx, bursts = [], arena = null) {
  if (!bursts || bursts.length === 0) return;
  const ringImg = _getReadySprite('fractalRing');
  const coreImg = _getReadySprite('fractalCore');
  const flashImg = _getReadySprite('fractalFlash');
  const streakImg = _getReadySprite('fractalStreak');

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < bursts.length; i++) {
    const b = bursts[i];
    if (!b || b.life <= 0) continue;
    const maxLife = Math.max(1, b.maxLife || 14);
    const p = 1 - b.life / maxLife;
    const alpha = Math.max(0, Math.min(1, b.life / Math.max(1, maxLife * 0.55)));

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.globalAlpha = alpha;

    if (b.kind === 'ring') {
      // Resolve costume 1 (effect1): scales 0 -> 150% then fades
      const sz = 24 + p * 92;
      if (ringImg) {
        ctx.drawImage(ringImg, -sz * 0.5, -sz * 0.5, sz, sz);
      } else {
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, sz * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (b.kind === 'streak') {
      // Resolve costume 7 (effect5): long razor slash VFX streak flying all the way across the screen (`0 / 180 deg`)
      ctx.rotate(b.angle || 0);
      const scaleY = Math.max(0.18, 1 - p * 0.82);
      const streakLen = b.len || 220;
      if (streakImg) {
        ctx.drawImage(streakImg, -streakLen * 0.25, -4.5 * scaleY, streakLen, 9 * scaleY);
      } else {
        ctx.fillStyle = '#BAE6FD';
        ctx.fillRect(-streakLen * 0.25, -2.5 * scaleY, streakLen, 5 * scaleY);
      }
    } else {
      // Resolve costume 5 + 6 (effect3 inside arena + effect4 full-screen spanning razor flash)
      ctx.rotate(b.angle || 0);
      const len = b.length || 860;
      const coreH = 26 * Math.max(0.1, 1 - p * 0.85);
      const flashScale = Math.max(0.12, 1 - p * 0.85);
      if (flashImg) {
        ctx.save();
        ctx.globalAlpha = alpha * 0.65;
        ctx.drawImage(flashImg, -len * 0.35, -38 * flashScale, len * 0.7, 76 * flashScale);
        ctx.restore();
      }
      if (coreImg) {
        ctx.drawImage(coreImg, -len * 0.5, -coreH * 0.5, len, coreH);
      } else {
        ctx.fillStyle = '#BAE6FD';
        ctx.fillRect(-len * 0.5, -coreH * 0.35, len, coreH * 0.7);
      }
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws all Ice Split & Fractal Star Web beams clipped inside the arena box
 * using additive Resolve intersection luminescence (natural white-blue node blooms without fake diamond stamps).
 */
export function drawCarolIceSplitLines(ctx, splits, arena = null) {
  if (!splits || splits.length === 0) return;

  ctx.save();
  if (arena && arena.width > 0 && arena.height > 0) {
    ctx.beginPath();
    ctx.rect(arena.x, arena.y, arena.width, arena.height);
    ctx.clip();
  }
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < splits.length; i++) {
    drawCarolIceSplitLine(ctx, splits[i]);
  }

  ctx.restore();
}

/**
 * Draws Carol_Heal (Cspell) protective cyan frost barrier ring around Carol.
 */
export function drawCarolCryoMendAura(ctx, fighter) {
  if (!fighter || !(fighter.healBannerTimer > 0)) return;
  const maxF = Math.max(1, fighter.healBannerMax || 36);
  const p = 1 - fighter.healBannerTimer / maxF;
  const alpha = Math.sin(p * Math.PI);
  const r = (fighter.r || 25) * (1.35 + p * 0.35);

  ctx.save();
  ctx.translate(fighter.x || 0, (fighter.y || 0) - (fighter.z || 0));
  const glow = _getPrebakedGlow('#38BDF8');
  if (glow) {
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.65));
    ctx.drawImage(glow, -r * 1.4, -r * 1.4, r * 2.8, r * 2.8);
  }
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.9));
  ctx.strokeStyle = '#BAE6FD';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws Aqua Soul Heatbar chill gauge on opponents affected by Permafrost hypothermia.
 */
export function drawCarolAquaHeatbarChill(ctx, aquaChilledTargets) {
  if (!aquaChilledTargets || aquaChilledTargets.size === 0) return;
  for (const [target, info] of aquaChilledTargets.entries()) {
    if (!target || target.hp <= 0 || target.dead || target.isDead || !info || info.timer <= 0) continue;
    const r = target.r || target.radius || 25;
    const x = target.x || 0;
    const y = (target.y || 0) - (target.z || 0);
    const ratio = Math.max(0, Math.min(1, info.timer / Math.max(1, info.maxTimer || 150)));
    const barW = r * 1.4;
    const barH = 4;

    ctx.save();
    ctx.globalAlpha = Math.min(0.92, ratio + 0.25);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#0E0F14';
    ctx.fillRect(x - barW * 0.5 - 1, y + r + 8, barW + 2, barH + 2);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(x - barW * 0.5, y + r + 9, barW * ratio, barH);
    ctx.restore();
  }
}

/**
 * Draws Resolve Permafrost storm horizontal snow streaks (`Carol-blizzard-snow.png`),
 * `whole screen` ice veil (`Carol-permafrost-screen.png`) & Rule 26 concentric ripples.
 */
export function drawCarolPermafrostVFX(ctx, fighter, ripples = [], snowDrops = [], arena = null) {
  if (fighter && fighter.isPermafrostActive && arena) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(arena.x, arena.y, arena.width, arena.height);
    ctx.clip();

    ctx.fillStyle = fighter.permafrostFreezeHold > 0
      ? 'rgba(14, 116, 144, 0.24)'
      : 'rgba(14, 116, 144, 0.14)';
    ctx.fillRect(arena.x, arena.y, arena.width, arena.height);

    const screenImg = _getReadySprite('permafrostScreen');
    const screenAlpha = Math.max(0, Math.min(1, fighter.permafrostScreenAlpha ?? 0.25));
    if (screenImg && screenAlpha > 0.01) {
      ctx.globalAlpha = screenAlpha * 0.42;
      ctx.drawImage(screenImg, arena.x, arena.y, arena.width, arena.height);
    }

    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.60)';
    ctx.lineWidth = 3.0;
    ctx.strokeRect(arena.x + 2, arena.y + 2, arena.width - 4, arena.height - 4);
    ctx.restore();
  }

  if (snowDrops && snowDrops.length > 0) {
    const snowImg = _getReadySprite('blizzardSnow');
    ctx.save();
    if (arena && arena.width > 0 && arena.height > 0) {
      ctx.beginPath();
      ctx.rect(arena.x, arena.y, arena.width, arena.height);
      ctx.clip();
    }
    for (let i = 0; i < snowDrops.length; i++) {
      const s = snowDrops[i];
      const sz = s.size || 6;
      ctx.globalAlpha = Math.max(0, Math.min(1, s.life / Math.max(1, s.maxLife || 30))) * 0.85;
      if (snowImg) {
        ctx.drawImage(snowImg, s.x - sz * 0.5, s.y - sz * 0.5, sz, sz);
      } else {
        ctx.fillStyle = '#E0F2FE';
        ctx.fillRect(Math.round(s.x), Math.round(s.y), sz, sz);
      }
    }
    ctx.restore();
  }

  if (!ripples || ripples.length === 0) return;
  for (let i = 0; i < ripples.length; i++) {
    const sw = ripples[i];
    const progress = 1 - Math.max(0, sw.life / Math.max(1, sw.maxLife || 28));
    const offsets = [0.0, 0.14, 0.28];
    ctx.save();
    for (let k = 0; k < offsets.length; k++) {
      const lp = (progress - offsets[k]) / (1 - offsets[k]);
      if (lp <= 0 || lp >= 1) continue;
      const rad = (sw.maxRadius || 210) * Math.pow(lp, 0.65);
      const alpha = Math.min(1, lp / 0.10) * Math.pow(1 - lp, 1.25);

      ctx.beginPath();
      ctx.arc(sw.x, sw.y, rad, 0, Math.PI * 2);
      if (k === 0) {
        ctx.fillStyle = `rgba(56, 189, 248, ${0.18 * alpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(240, 249, 255, ${0.90 * alpha})`;
        ctx.lineWidth = 3.2;
      } else if (k === 1) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.82 * alpha})`;
        ctx.lineWidth = 2.4;
      } else {
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.72 * alpha})`;
        ctx.lineWidth = 2.0;
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}
