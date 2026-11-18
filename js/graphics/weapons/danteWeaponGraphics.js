// ─────────────────────────────────────────────────────────────────────────────
// DANTE WEAPON & MUGEN VFX RENDERER (Rule 11, Rule 15, Rule 20, Rule 35)
// Rebellion Greatsword + Ebony & Ivory Dual Pistols + Extracted MUGEN Strips
// ─────────────────────────────────────────────────────────────────────────────

import { CONFIG } from '../../core/config.js';
import { state } from '../../core/state.js';
import { drawPixelHand } from '../renderers/fighterRenderer.js';

const DANTE_WEAPON_SPECS = {
  rebellion: 'Assets/model/dante/Dante-rebellion.png',
  devilSword: 'Assets/model/dante/Dante-devil-sword.png',
  ebony: 'Assets/model/dante/Dante-ebony.png',
  ivory: 'Assets/model/dante/Dante-ivory.png',
};

const _weaponCache = new Map();

export function _getDanteWeaponImage(key) {
  const src = DANTE_WEAPON_SPECS[key];
  if (!src) return null;
  let entry = _weaponCache.get(key);
  if (entry) return (entry.loaded && entry.img.naturalWidth > 0) ? entry.img : null;
  if (typeof Image === 'undefined') return null;

  const img = new Image();
  entry = { img, loaded: false, src };
  img.onload = () => { entry.loaded = true; };
  img.src = src;
  _weaponCache.set(key, entry);
  return (img.complete && img.naturalWidth > 0) ? img : null;
}

const DANTE_VFX_SPECS = {
  slashArc: { src: 'Assets/effects/dante/dante-slash-arc.png', frames: 4, cw: 206, ch: 130 },
  roundTrip: { src: 'Assets/effects/dante/dante-round-trip.png', frames: 1, cw: 110, ch: 45 },
  roundTripWhirl: { src: 'Assets/effects/dante/dante-round-trip-whirl.png', frames: 8, cw: 128, ch: 128 },
  driveWave: { src: 'Assets/effects/dante/dante-drive-wave.png', frames: 6, cw: 158, ch: 180 },
  jackpotBeam: { src: 'Assets/effects/dante/dante-jackpot-beam.png', frames: 2, cw: 197, ch: 71 },
  rocket: { src: 'Assets/effects/dante/dante-rocket.png', frames: 1, cw: 87, ch: 31 },
  explosion: { src: 'Assets/effects/dante/dante-explosion.png', frames: 11, cw: 58, ch: 58 },
  dtTornado: { src: 'Assets/effects/dante/dante-dt-tornado.png', frames: 7, cw: 270, ch: 255 },
  dtAura: { src: 'Assets/effects/dante/dante-dt-aura.png', frames: 12, cw: 128, ch: 96 },
  spotDodge: { src: 'Assets/effects/dante/dante-spot-dodge.png', frames: 8, cw: 128, ch: 128 },
  weaponVanish: { src: 'Assets/effects/dante/dante-weapon-vanish.png', frames: 8, cw: 128, ch: 128 },
  dtStingerThrust: { src: 'Assets/model/dante/dt-stinger-thrust/dt-stinger-thrust-b.png', frames: 12, cw: 256, ch: 256 },
  dtTransform: { src: 'Assets/model/dante/dt-transform/dt-transform-b.png', frames: 12, cw: 256, ch: 256 },
  dtJudgmentExplosion: { src: 'Assets/model/dante/dt-judgment-explosion/dt-judgment-explosion-b.png', frames: 12, cw: 256, ch: 256 },
};

const _vfxCache = new Map();

function _getVfxEntry(key) {
  const spec = DANTE_VFX_SPECS[key];
  if (!spec) return null;
  let entry = _vfxCache.get(key);
  if (entry) return entry;
  if (typeof Image === 'undefined') return null;

  const img = new Image();
  entry = { img, loaded: false, ...spec };
  img.onload = () => { entry.loaded = true; };
  img.src = spec.src;
  _vfxCache.set(key, entry);
  return entry;
}

export function preloadDanteVfx() {
  for (const k of Object.keys(DANTE_VFX_SPECS)) _getVfxEntry(k);
  for (const wk of Object.keys(DANTE_WEAPON_SPECS)) _getDanteWeaponImage(wk);
}

export function getDanteVfxEntries() {
  preloadDanteVfx();
  const entries = Object.keys(DANTE_VFX_SPECS).map(k => _vfxCache.get(k)).filter(Boolean);
  for (const wk of Object.keys(DANTE_WEAPON_SPECS)) {
    const we = _weaponCache.get(wk);
    if (we) entries.push(we);
  }
  return entries;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  preloadDanteVfx();
}

function _isVfxDisabled() {
  if (typeof CONFIG !== 'undefined' && CONFIG.enableVfx === false) return true;
  if (typeof state !== 'undefined' && (state.performanceMode || (state.qualityLevel && state.qualityLevel < 0.5))) return true;
  return false;
}

function _drawPistolShape(ctx, r, scale, isIvory = false) {
  const gunImg = _getDanteWeaponImage(isIvory ? 'ivory' : 'ebony');
  if (gunImg) {
    // Assets/model/dante/Dante-ebony.png / Dante-ivory.png (320x165): grip at (62, 102), muzzle tip at x=319
    const custom = (typeof state !== 'undefined' && state.weaponCustomizations?.dante) || {};
    const cLen = custom.lengthScale ?? 1.0;
    const cWid = custom.widthScale ?? 1.0;
    const baseScale = ((r || 25) * 1.18 * scale) / 258.0;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.scale(baseScale * cLen, baseScale * cWid);
    ctx.drawImage(gunImg, -62, -102);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.scale(scale, scale);
  ctx.fillStyle = '#0E0F14';
  ctx.fillRect(-4, -5.5, 22, 7);
  ctx.fillRect(-3, -1, 7, 10);
  ctx.fillStyle = isIvory ? '#F1F5F9' : '#334155';
  ctx.fillRect(-3, -4.5, 19.5, 5);
  ctx.fillRect(-2, 0, 5, 7.8);
  ctx.fillStyle = isIvory ? '#CBD5E1' : '#94A3B8';
  ctx.fillRect(0, -3.5, 15, 1.8);
  ctx.restore();
}

function _drawRebellionShape(ctx, r, scale, isDT = false) {
  const rebImg = (isDT && _getDanteWeaponImage('devilSword')) || _getDanteWeaponImage('rebellion');
  if (rebImg) {
    // Dante-rebellion.png & Dante-devil-sword.png (560x140): handle grip center (92, 70), tip x=559
    const custom = (typeof state !== 'undefined' && state.weaponCustomizations?.dante) || {};
    const cLen = custom.lengthScale ?? 1.0;
    const cWid = custom.widthScale ?? 1.0;
    const baseScale = (r * 2.48 * scale) / 468.0;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.scale(baseScale * cLen, baseScale * cWid);
    ctx.drawImage(rebImg, -92, -70);
    ctx.restore();
    return;
  }

  const bladeLen = r * 2.15 * scale;
  ctx.save();
  // Dark ink outline (Rule 11 / 24 silhouette crispness)
  ctx.fillStyle = '#0E0F14';
  ctx.fillRect(-r * 0.42 - 1.5, -3.5, bladeLen + r * 0.42 + 4, 7);
  // Pommel & grip
  ctx.fillStyle = '#475569';
  ctx.fillRect(-r * 0.42, -2, r * 0.42, 4);
  // Iconic ribcage crossguard
  ctx.fillStyle = isDT ? '#EF4444' : '#94A3B8';
  ctx.fillRect(-2, -10.5 * scale, 7, 21 * scale);
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(-0.5, -8.5 * scale, 4, 17 * scale);
  // Broad fuller greatsword blade + notched spear tip
  ctx.fillStyle = isDT ? '#FCA5A5' : '#CBD5E1';
  ctx.beginPath();
  ctx.moveTo(4, -5.2 * scale);
  ctx.lineTo(bladeLen - 9, -4.8 * scale);
  ctx.lineTo(bladeLen + 3, 0);
  ctx.lineTo(bladeLen - 9, 4.8 * scale);
  ctx.lineTo(4, 5.2 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0E0F14';
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();

  // Blood crimson fuller ridge
  ctx.fillStyle = isDT ? '#EF4444' : '#64748B';
  ctx.fillRect(6, -1.3 * scale, bladeLen * 0.72, 2.6 * scale);
  ctx.restore();
}

function _computeDanteMeleeKinematics(fighter, r) {
  const dtTx = fighter._dtTransformTimer || 0;
  if (dtTx > 0 && !(fighter._jackpotTimer > 0) && !(fighter._jackpotFireTimer > 0)) {
    const maxT = Math.max(1, fighter._dtTransformMaxTimer || 54);
    const p = 1 - Math.max(0, Math.min(1, dtTx / maxT));
    // FINALSMASH2.webp F15-F35: chest-cross blade pierce -> F36-F87: volcanic arm-spread ascension
    if (p < 0.36) {
      const cp = Math.sin((p / 0.36) * (Math.PI / 2));
      return {
        active: false, moveType: 'dt_transform_coil', p, phase: 1,
        chargeLevel: cp,
        swingAngle: -0.32 - 1.15 * cp,
        lungeX: -r * 0.42 * cp,
        offY: -r * 0.12 * cp,
        offHandLunge: r * 0.34 * cp,
        offHandOffY: -r * 0.10 * cp,
        tremorX: (Math.random() - 0.5) * 1.4 * cp,
        tremorY: (Math.random() - 0.5) * 1.2 * cp,
        scaleX: 1, scaleY: 1,
        arcStart: 0, arcEnd: 0, arcAlpha: 0, stabCount: 0,
      };
    }
    const sp = Math.min(1, (p - 0.36) / 0.64);
    const flare = Math.sin(Math.min(1, sp * 1.6) * (Math.PI / 2));
    return {
      active: false, moveType: 'dt_transform_ascend', p, phase: 4,
      isTransformSpread: true,
      swingAngle: 0,
      lungeX: r * 0.18 * flare,
      offY: -r * 0.08 * flare,
      offHandLunge: -r * 0.16 * flare,
      offHandOffY: -r * 0.08 * flare,
      tremorX: (Math.random() - 0.5) * 0.8 * (1 - sp),
      tremorY: 0,
      scaleX: 1, scaleY: 1,
      arcStart: 0, arcEnd: 0, arcAlpha: 0, stabCount: 0,
    };
  }

  if (fighter._judgmentState?.active) {
    const jst = fighter._judgmentState;
    const isFlurry = jst.phase === 'flurry';
    const spin = isFlurry ? ((jst.flurryMax - jst.timer) * 0.85) : 0;
    return {
      active: false, moveType: isFlurry ? 'sdt_judgment_flurry' : 'sdt_judgment_finisher',
      p: 0.5, phase: isFlurry ? 3 : 2,
      chargeLevel: isFlurry ? 0.5 : 1.0,
      swingAngle: isFlurry ? (-1.5 + Math.sin(spin) * 1.8) : -1.55,
      lungeX: isFlurry ? r * 0.34 : -r * 0.20,
      offY: isFlurry ? Math.cos(spin) * r * 0.16 : -r * 0.14,
      tremorX: (Math.random() - 0.5) * 1.8,
      tremorY: (Math.random() - 0.5) * 1.8,
      scaleX: 1.08, scaleY: 1.0,
      arcStart: 0, arcEnd: 0, arcAlpha: 0, stabCount: 0,
    };
  }
  if (fighter._sinStingerState?.active) {
    return {
      active: true, moveType: 'sin_stinger', p: 0.5, phase: 4,
      swingAngle: 0, lungeX: r * 0.45, offY: 0, bladeThrust: r * 1.65,
      thrustCycle: 6, thrustPulse: 1.0,
      tremorX: (Math.random() - 0.5) * 1.6, tremorY: 0,
      scaleX: 1.15, scaleY: 0.94,
      arcStart: 0, arcEnd: 0, arcAlpha: 0.95, stabCount: 1, isFinisher: true,
    };
  }
  if (fighter._sdtComboState?.active) {
    const st = fighter._sdtComboState;
    const sp = 1 - Math.max(0, Math.min(1, st.timer / Math.max(1, st.maxTimer || 32)));
    const sweepA = st.stage === 2 ? (-Math.PI + sp * Math.PI * 3.5) : (st.stage === 1 ? (1.8 - ((sp - 0.33) / 0.34) * 3.6) : (-1.8 + (sp / 0.33) * 3.6));
    return {
      active: true, moveType: st.stage === 2 ? 'sdt_sweep360' : 'sdt_cleave',
      p: sp, phase: 3,
      swingAngle: sweepA, lungeX: r * 0.36, offY: 0,
      tremorX: (Math.random() - 0.5) * 1.2, tremorY: 0,
      scaleX: 1.14, scaleY: 1.0,
      arcStart: sweepA - 1.35, arcEnd: sweepA + 0.35, arcAlpha: 0.94, stabCount: 0,
    };
  }

  const rt = fighter._roundTripEntity;
  if (rt && rt.phase === 'charge') {
    const p = 1 - Math.max(0, Math.min(1, (rt.chargeTimer || 0) / Math.max(1, rt.chargeMax || 16)));
    // FORWARDTHROW.gif F03-F39: coil across torso -> raise glowing blade behind shoulder
    const ease = Math.sin(p * (Math.PI / 2));
    return {
      active: false, moveType: 'side_special_charge', p, phase: 1,
      chargeLevel: p,
      swingAngle: -0.32 - 1.98 * ease,
      lungeX: -r * 0.28 * ease,
      offY: -r * (0.04 + 0.14 * ease),
      tremorX: (Math.random() - 0.5) * 1.6 * p,
      tremorY: (Math.random() - 0.5) * 1.6 * p,
      scaleX: 1.0, scaleY: 1.0,
      arcStart: 0, arcEnd: 0, arcAlpha: 0, stabCount: 0,
    };
  }
  if ((fighter._roundTripThrowTimer || 0) > 0) {
    const tp = Math.max(0, Math.min(1, fighter._roundTripThrowTimer / 12));
    // FORWARDTHROW.gif F40-F43: extended throwing follow-through arm whip
    return {
      active: false, moveType: 'side_special_throw', p: 1 - tp, phase: 3,
      swingAngle: 0.45 * tp,
      lungeX: r * 0.36 * tp,
      offY: r * 0.08 * tp,
      tremorX: 0, tremorY: 0, scaleX: 1, scaleY: 1,
      arcStart: 0, arcEnd: 0, arcAlpha: 0, stabCount: 0,
    };
  }
  if ((fighter._roundTripCatchTimer || 0) > 0) {
    const cp = Math.max(0, Math.min(1, fighter._roundTripCatchTimer / 10));
    return {
      active: false, moveType: 'side_special_catch', p: 1 - cp, phase: 5,
      catchFlash: cp,
      swingAngle: -0.32 - 0.52 * cp,
      lungeX: -r * 0.20 * cp,
      offY: r * 0.06 * cp,
      tremorX: 0, tremorY: 0, scaleX: 1 + 0.14 * cp, scaleY: 1 + 0.14 * cp,
      arcStart: 0, arcEnd: 0, arcAlpha: 0, stabCount: 0,
    };
  }

  const swingT = fighter.slashSwingTimer || 0;
  const maxT = Math.max(1, fighter.slashSwingMaxTimer || 36);
  const moveType = fighter.slashMoveType || 'cleave_right';
  if (swingT <= 0) {
    return {
      active: false, moveType, p: 0, phase: 0,
      swingAngle: -0.32, lungeX: 0, offY: 0,
      tremorX: 0, tremorY: 0, scaleX: 1, scaleY: 1,
      arcStart: 0, arcEnd: 0, arcAlpha: 0, stabCount: 0
    };
  }

  const p = 1 - Math.max(0, Math.min(1, swingT / maxT));
  const isDT = Boolean(fighter.isDevilTrigger);

  // Stage 3: Million Stab — Rapid piercing stabs (0.12..0.50) -> Wind-Up Coil (0.50..0.67) -> Explosive Thrust Finisher (0.67..0.91)
  if (moveType === 'million_stab') {
    const dtMult = isDT ? 1.32 : 1.0;
    if (p < 0.12) {
      const wp = Math.sin((p / 0.12) * (Math.PI / 2));
      return {
        active: true, moveType, p, phase: 1,
        swingAngle: -0.05 * wp, lungeX: -r * (isDT ? 0.30 : 0.24) * wp, offY: r * 0.06 * wp,
        bladeThrust: -r * 0.12 * wp, thrustCycle: 0, thrustPulse: 0,
        tremorX: 0, tremorY: 0, scaleX: 1, scaleY: 1,
        arcStart: 0, arcEnd: 0, arcAlpha: 0, stabCount: 0
      };
    }
    if (p < 0.50) {
      const sp = (p - 0.12) / 0.38;
      const cycle = sp * 6.0;
      const cycleIdx = Math.floor(cycle);
      const localT = cycle - cycleIdx;
      const jab = localT < 0.35 ? (localT / 0.35) : Math.pow(1 - (localT - 0.35) / 0.65, 1.4);
      const fanAngles = [0.0, -0.10, 0.09, -0.07, 0.11, -0.04];
      const fanOffsetsY = [0, -0.18, 0.16, -0.10, 0.20, -0.06];
      const ang = (fanAngles[cycleIdx % fanAngles.length] || 0) * (isDT ? 1.25 : 1.0);
      const laneY = (fanOffsetsY[cycleIdx % fanOffsetsY.length] || 0) * r * (isDT ? 1.20 : 1.0);
      return {
        active: true, moveType, p, phase: 3,
        swingAngle: ang,
        lungeX: r * (-0.14 + 0.48 * jab * dtMult),
        offY: laneY * 0.55,
        bladeThrust: r * (0.10 + 0.52 * jab) * dtMult,
        thrustCycle: cycleIdx,
        thrustPulse: jab,
        tremorX: (Math.random() - 0.5) * (isDT ? 1.8 : 1.4),
        tremorY: (Math.random() - 0.5) * 1.2,
        scaleX: 1.0 + (isDT ? 0.18 : 0.12) * jab, scaleY: 1.0 - 0.06 * jab,
        arcStart: 0, arcEnd: 0, arcAlpha: 0.96, stabCount: 4
      };
    }
    if (p < 0.67) {
      // Hip-Coil Wind-Up: pull hand & Rebellion straight back to hip while keeping tip aimed forward
      const cp = (p - 0.50) / 0.17;
      const coilEase = Math.sin(cp * (Math.PI / 2));
      const backPull = isDT ? -0.56 : -0.44;
      const bladePull = isDT ? -0.74 : -0.60;
      return {
        active: true, moveType, p, phase: 2,
        chargeLevel: isDT ? coilEase : 0,
        swingAngle: 0,
        lungeX: r * backPull * coilEase,
        offY: r * 0.10 * coilEase,
        bladeThrust: r * bladePull * coilEase,
        thrustCycle: 6,
        thrustPulse: coilEase,
        tremorX: (Math.random() - 0.5) * (isDT ? 1.5 : 1.0) * coilEase,
        tremorY: (Math.random() - 0.5) * 1.0 * coilEase,
        scaleX: 1.0 - 0.06 * coilEase, scaleY: 1.0 + 0.06 * coilEase,
        arcStart: 0, arcEnd: 0, arcAlpha: 0, stabCount: 0
      };
    }
    if (p < 0.91) {
      // Explosive Straight Forward Thrust Finisher (FORWARDTILT3.webp F1-F15 Devil Stinger in DT)
      const fp = (p - 0.67) / 0.24;
      const snapWin = isDT ? 0.14 : 0.20;
      const snap = fp < snapWin ? Math.pow(fp / snapWin, isDT ? 0.45 : 0.55) : 1.0;
      const easeOut = 1 - Math.max(0, (fp - snapWin) / (1 - snapWin)) * (isDT ? 0.22 : 0.35);
      const startLunge = isDT ? -0.56 : -0.44;
      const spanLunge = isDT ? 1.15 : 0.88;
      const startBlade = isDT ? -0.74 : -0.60;
      const spanBlade = isDT ? 2.48 : 1.85;
      return {
        active: true, moveType, p, phase: 4,
        finisherProgress: fp,
        swingAngle: 0,
        lungeX: r * (startLunge + spanLunge * snap),
        offY: 0,
        bladeThrust: r * (startBlade + spanBlade * snap),
        thrustCycle: 6,
        thrustPulse: easeOut,
        tremorX: (Math.random() - 0.5) * (isDT ? 2.0 : 1.6) * easeOut,
        tremorY: 0,
        scaleX: isDT ? 1.12 : 1.0, scaleY: 1.0,
        arcStart: 0, arcEnd: 0, arcAlpha: 0.98 * easeOut, stabCount: 1, isFinisher: true
      };
    }
    const rp = (p - 0.91) / 0.09;
    const settle = Math.pow(1 - rp, 1.8);
    return {
      active: true, moveType, p, phase: 5,
      swingAngle: -0.32 * (1 - settle),
      lungeX: r * (isDT ? 0.59 : 0.44) * settle, offY: 0,
      bladeThrust: r * (isDT ? 1.74 : 1.25) * settle, thrustCycle: 6, thrustPulse: 0,
      tremorX: 0, tremorY: 0, scaleX: 1, scaleY: 1,
      arcStart: 0, arcEnd: 0, arcAlpha: (1 - rp) * 0.40, stabCount: 0
    };
  }

  // Stage 1 (Wide Right Cleave), Stage 2 (Chained Reverse Cleave), Stage 4 (High Time Uppercut)
  // Per melee-attack-animator Section 1.1 Rule 4: Stages 1 & 2 hold their exaggerated follow-through lock
  // without snapping back to neutral so the next stage chains directly from the previous apex!
  const isReverse = moveType === 'cleave_return';
  const isHighTime = moveType === 'high_time';
  const startAng = isHighTime ? 1.88 : (isReverse ? 1.78 : -1.75);
  const lockAng = isHighTime ? -1.96 : (isReverse ? -1.74 : 1.78);
  const coilX = isReverse ? r * 0.10 : -r * 0.28;
  const coilY = isHighTime ? r * 0.20 : (isReverse ? r * 0.14 : -r * 0.12);
  const apexX = isHighTime ? r * 0.36 : r * 0.34;
  const apexY = isHighTime ? -r * 0.12 : (isReverse ? -r * 0.10 : r * 0.16);

  if (p < 0.24) {
    // Phase 1-2: Anticipation Lift / Coil + Poised Hold
    const wp = Math.min(1, p / 0.18);
    const ease = Math.sin(wp * (Math.PI / 2));
    const entryAng = isReverse ? 1.78 : (isHighTime ? 0.10 : -0.32);
    return {
      active: true, moveType, p, phase: p < 0.18 ? 1 : 2,
      swingAngle: entryAng + (startAng - entryAng) * ease,
      lungeX: coilX * ease, offY: coilY * ease,
      tremorX: 0, tremorY: 0, scaleX: 1, scaleY: 1,
      arcStart: startAng, arcEnd: startAng, arcAlpha: 0, stabCount: 0
    };
  }
  if (p < 0.52) {
    // Phase 3: Hypersonic Whip Strike (Exponential acceleration across ~200° arc)
    const sp = (p - 0.24) / 0.28;
    const whip = Math.pow(sp, 2.25);
    const curAng = startAng + (lockAng - startAng) * whip;
    return {
      active: true, moveType, p, phase: 3,
      swingAngle: curAng,
      lungeX: coilX + (apexX - coilX) * whip,
      offY: coilY + (apexY - coilY) * whip,
      tremorX: 0, tremorY: 0,
      scaleX: isHighTime ? 1.15 : 1.06,
      scaleY: isHighTime ? 0.85 : 1.0,
      arcStart: startAng, arcEnd: curAng, arcAlpha: 0.96, stabCount: 0
    };
  }
  if (!isHighTime || p < 0.72) {
    // Phase 4: Exaggerated One-Handed Follow-Through Impact Lock (Stages 1 & 2 stay locked into next stage!)
    const rp = Math.max(0, (p - 0.52) / 0.48);
    const tailErase = 1 - Math.pow(1 - rp, 1.4);
    return {
      active: true, moveType, p, phase: 4,
      swingAngle: lockAng,
      lungeX: apexX, offY: apexY,
      tremorX: (Math.random() - 0.5) * 2.0 * (1 - rp * 0.6),
      tremorY: (Math.random() - 0.5) * 2.0 * (1 - rp * 0.6),
      scaleX: isHighTime ? 1.12 : 1.04,
      scaleY: isHighTime ? 0.88 : 1.0,
      arcStart: startAng + (lockAng - startAng) * (rp * 0.65 * tailErase),
      arcEnd: lockAng,
      arcAlpha: Math.max(0.18, 0.92 * (1 - rp * 0.75)),
      stabCount: 0
    };
  }

  // Phase 5 (Stage 4 High Time Finale only): Weighted Damped Harmonic Recovery + Rule 15 Eraser Wipe
  const rp = (p - 0.72) / 0.28;
  const settleEase = Math.pow(1 - rp, 1.8);
  const springWave = Math.sin(rp * Math.PI * 2.2) * Math.exp(-rp * 4.2);
  const tailErase = 1 - Math.pow(1 - rp, 1.4);
  return {
    active: true, moveType, p, phase: 5,
    swingAngle: -0.32 + (lockAng + 0.32) * settleEase - 0.14 * springWave,
    lungeX: apexX * settleEase - r * 0.10 * springWave,
    offY: apexY * settleEase,
    tremorX: 0, tremorY: 0, scaleX: 1, scaleY: 1,
    arcStart: startAng + (lockAng - startAng) * tailErase,
    arcEnd: lockAng,
    arcAlpha: Math.max(0, (1 - rp) * 0.78),
    stabCount: 0
  };
}

/**
 * Rule 15: Double-tapered crescent slash ribbon locked to Rebellion tip radius (r * 2.48 * scale).
 */
function _drawRebellionCrescentRibbon(ctx, r, kin, scale, isDT) {
  if (kin.arcAlpha <= 0.02 || Math.abs(kin.arcEnd - kin.arcStart) < 0.08) return;
  const steps = 18;
  const outerR = r * (kin.moveType === 'high_time' ? 2.58 : 2.48) * scale;
  const maxThick = r * (kin.moveType === 'high_time' ? 0.76 : 0.62) * scale;

  ctx.save();
  ctx.globalAlpha = kin.arcAlpha;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = kin.arcStart + (kin.arcEnd - kin.arcStart) * t;
    ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const a = kin.arcStart + (kin.arcEnd - kin.arcStart) * t;
    const taper = Math.pow(Math.sin(t * Math.PI), 1.15) * (0.3 + 0.7 * t);
    const innerR = Math.max(r * 0.35, outerR - maxThick * taper);
    ctx.lineTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
  }
  ctx.closePath();
  ctx.fillStyle = isDT ? '#EF4444' : '#DC2626';
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();

  // Inner hot silver-white core ribbon
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = kin.arcStart + (kin.arcEnd - kin.arcStart) * t;
    ctx.lineTo(Math.cos(a) * (outerR - 2.5), Math.sin(a) * (outerR - 2.5));
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const a = kin.arcStart + (kin.arcEnd - kin.arcStart) * t;
    const taper = Math.pow(Math.sin(t * Math.PI), 1.15) * (0.3 + 0.7 * t);
    const innerR = Math.max(r * 0.48, outerR - maxThick * 0.44 * taper);
    ctx.lineTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
  }
  ctx.closePath();
  ctx.fillStyle = '#FFE4E6';
  ctx.fill();
  ctx.restore();
}

/**
 * Draws piercing thrust lance cones + Mach thrust rings for Million Stab & Thrust Finisher.
 */
function _drawMillionStabFlurryVFX(ctx, r, kin, scale, isDT) {
  if (kin.stabCount <= 0 || kin.arcAlpha <= 0.02) return;
  const thrustOff = kin.bladeThrust || 0;

  if (kin.isFinisher) {
    const startD = r * 0.35 + thrustOff * 0.35;
    const endD = r * (isDT ? 4.85 : 3.85) * scale + thrustOff * (isDT ? 0.65 : 0.5);
    const midD = startD + (endD - startD) * 0.38;
    const pulse = kin.thrustPulse ?? 1.0;
    const hasDtStingerSprite = isDT && _isEntryReady(_getVfxEntry('dtStingerThrust'));

    ctx.save();
    // 1. Expanding elliptical Mach thrust rings around the piercing lance
    const ringCount = isDT ? 3 : 2;
    for (let ring = 0; ring < ringCount; ring++) {
      const rx = (5 + ring * 4) * (1.2 - pulse * 0.2) * (isDT ? 1.25 : 1.0);
      const ry = (15 + ring * 8) * (1.3 - pulse * 0.3) * (isDT ? 1.32 : 1.0);
      const ringX = startD + r * (0.85 + ring * 0.72);
      ctx.globalAlpha = (0.82 - ring * 0.22) * kin.arcAlpha;
      ctx.strokeStyle = ring === 0 ? '#FFFFFF' : (isDT ? (ring === 1 ? '#EF4444' : '#FEF08A') : '#EF4444');
      ctx.lineWidth = ring === 0 ? 2.6 : 2.0;
      ctx.beginPath();
      ctx.ellipse(ringX, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Heavy crimson-white piercing lance spearhead (skipped in DT when dtStingerThrust sprite is active to avoid overlay)
    if (!hasDtStingerSprite) {
      const halfBase = isDT ? 9.5 : 6.5;
      const halfMid = isDT ? 13.5 : 9.0;
      ctx.globalAlpha = 0.96 * kin.arcAlpha;
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(startD, -halfBase);
      ctx.lineTo(midD, -halfMid);
      ctx.lineTo(endD, 0);
      ctx.lineTo(midD, halfMid);
      ctx.lineTo(startD, halfBase);
      ctx.closePath();
      ctx.fill();

      if (isDT) {
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.moveTo(startD + 2, -5.0);
        ctx.lineTo(midD, -7.2);
        ctx.lineTo(endD * 0.97, 0);
        ctx.lineTo(midD, 7.2);
        ctx.lineTo(startD + 2, 5.0);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(startD + 4, isDT ? -3.4 : -2.5);
      ctx.lineTo(midD, isDT ? -5.0 : -4.0);
      ctx.lineTo(endD * 0.94, 0);
      ctx.lineTo(midD, isDT ? 5.0 : 4.0);
      ctx.lineTo(startD + 4, isDT ? 3.4 : 2.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // Rapid-fire multi-lane piercing thrust spears + Mach thrust rings
  const lenBoost = isDT ? 1.24 : 1.0;
  const lanes = [
    { ang: 0.0, y: 0, len: 3.15 * lenBoost },
    { ang: -0.09, y: -r * 0.28, len: 2.85 * lenBoost },
    { ang: 0.09, y: r * 0.26, len: 2.95 * lenBoost },
    { ang: -0.04, y: r * 0.12, len: 2.65 * lenBoost },
  ];
  const activeIdx = (kin.thrustCycle || 0) % lanes.length;
  const jab = kin.thrustPulse ?? 0.6;

  ctx.save();
  for (let i = 0; i < lanes.length; i++) {
    const isPrimary = i === activeIdx;
    const lane = lanes[i];
    const startD = r * 0.45 + (isPrimary ? thrustOff * 0.65 : r * 0.20);
    const endD = r * lane.len * scale + (isPrimary ? thrustOff * 0.7 : 0);
    const halfBase = isPrimary ? 5.2 : 2.6;

    ctx.save();
    ctx.translate(0, lane.y);
    ctx.rotate(lane.ang + kin.swingAngle * 0.4);

    // Tapered piercing thrust spearhead
    ctx.globalAlpha = (isPrimary ? 0.95 : 0.42) * kin.arcAlpha;
    ctx.fillStyle = isPrimary ? (isDT ? '#FEF08A' : '#EF4444') : '#DC2626';
    ctx.beginPath();
    ctx.moveTo(startD, -halfBase);
    ctx.lineTo(endD, 0);
    ctx.lineTo(startD, halfBase);
    ctx.closePath();
    ctx.fill();

    // Hot white piercing core on active thrust
    if (isPrimary) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(startD + 4, -2.2);
      ctx.lineTo(endD * 0.92, 0);
      ctx.lineTo(startD + 4, 2.2);
      ctx.closePath();
      ctx.fill();

      // Crisp Mach thrust ring popping around the active jab
      ctx.globalAlpha = 0.75 * jab * kin.arcAlpha;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(startD + r * 0.95, 0, 3.5, 9.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Clamps a floating hand position around its canonical lower-torso anchor so
 * spring-inertia physics feel weighty and impactful without ever stretching away.
 */
function _clampHandOrbit(x, y, anchorX, anchorY, maxDist, minY) {
  const dx = x - anchorX;
  const dy = y - anchorY;
  const dist = Math.hypot(dx, dy);
  let cx = x;
  let cy = y;
  if (dist > maxDist && dist > 0.001) {
    const s = maxDist / dist;
    cx = anchorX + dx * s;
    cy = anchorY + dy * s;
  }
  return { x: cx, y: Math.max(minY, cy) };
}

/**
 * Updates damped spring-inertia hand physics for Dante's main & off-hand fists
 * (reacts to movement velocity, combat swing whip/recoil, and subtle idle poise).
 */
function _stepDanteHandPhysics(fighter, r, targetMainX, targetMainY, targetOffX, targetOffY, targetSwingAngle) {
  const frameNow = (typeof state !== 'undefined' && state.frameCount !== undefined) ? state.frameCount : 0;
  if (!fighter._danteHandPhys) {
    fighter._danteHandPhys = {
      mx: targetMainX, my: targetMainY, mvx: 0, mvy: 0,
      ox: targetOffX, oy: targetOffY, ovx: 0, ovy: 0,
      angLag: 0, angVel: 0,
      lastFrame: frameNow - 1,
    };
  }
  const p = fighter._danteHandPhys;
  if (p.lastFrame !== frameNow) {
    p.lastFrame = frameNow;
    const ang = fighter.gunAngle || 0;
    const cosA = Math.cos(ang);
    const sinA = Math.sin(ang);
    const vx = fighter.vx || 0;
    const vy = fighter.vy || 0;
    const localVx = vx * cosA + vy * sinA;
    const localVy = -vx * sinA + vy * cosA;
    const lagX = Math.max(-r * 0.14, Math.min(r * 0.14, -localVx * 0.65));
    const lagY = Math.max(-r * 0.10, Math.min(r * 0.10, -localVy * 0.55));

    // Snappy under-damped spring for weighty follow-through & punchy recoil
    const k = 0.28;
    const damp = 0.68;
    p.mvx = (p.mvx + ((targetMainX + lagX) - p.mx) * k) * damp;
    p.mvy = (p.mvy + ((targetMainY + lagY) - p.my) * k) * damp;
    p.mx += p.mvx;
    p.my += p.mvy;

    p.ovx = (p.ovx + ((targetOffX + lagX * 0.85) - p.ox) * k) * damp;
    p.ovy = (p.ovy + ((targetOffY + lagY * 0.85) - p.oy) * k) * damp;
    p.ox += p.ovx;
    p.oy += p.ovy;

    // Subtle sword wrist-lag driven by hand acceleration
    const targetLag = Math.max(-0.22, Math.min(0.22, -p.mvx * 0.028));
    p.angVel = (p.angVel + (targetLag - p.angLag) * 0.30) * 0.66;
    p.angLag += p.angVel;
  }
  return p;
}

function _computeDanteGunKinematics(fighter, r, firingGuns) {
  if (!firingGuns) {
    return {
      mainOffX: 0, mainOffY: 0, mainRot: 0,
      offOffX: 0, offOffY: 0, offRot: -0.10,
      ebonyT: 0, ivoryT: 0, directDrive: false,
    };
  }
  const t = ((typeof state !== 'undefined' && state.frameCount) || 0) * 0.24;
  const ebonyT = fighter._ebonyRecoilTimer || 0;
  const ivoryT = fighter._ivoryRecoilTimer || 0;
  const jackpotActive = (fighter._jackpotTimer || 0) > 0 || (fighter._jackpotFireTimer || 0) > 0;
  const jackpotTremor = (fighter._jackpotFireTimer || 0) > 0 ? (Math.random() - 0.5) * 2.2 : 0;

  // Alternating Gunslinger punch-out / draw-back cadence & snappy recoil kick + barrel climb
  const eRec = Math.max(0, Math.min(1, ebonyT / 10));
  const iRec = Math.max(0, Math.min(1, ivoryT / 10));
  const eClimb = eRec > 0 ? Math.sin(Math.pow(eRec, 0.72) * Math.PI * 0.85) : 0;
  const iClimb = iRec > 0 ? Math.sin(Math.pow(iRec, 0.72) * Math.PI * 0.85) : 0;

  const isEbonyLead = ((fighter._gunShotIndex || 0) % 2) === 1;
  const altLead = (ebonyT > 0 || ivoryT > 0) ? (isEbonyLead ? 1 : -1) : Math.sin(t * 0.65);

  const swayY = Math.sin(t) * (r * 0.06);
  const swayRot = Math.sin(t * 0.85) * 0.11;

  const mainForward = jackpotActive ? r * 0.24 : r * (0.12 + 0.10 * altLead);
  const mainKick = -r * 0.34 * eRec * eRec;
  const mainOffX = mainForward + mainKick + jackpotTremor;
  const mainOffY = swayY - r * 0.10 * eClimb + (jackpotActive ? -r * 0.06 : 0);
  const mainRot = (jackpotActive ? 0 : swayRot) - 0.48 * eClimb;

  const offForward = jackpotActive ? r * 0.38 : r * (0.28 - 0.10 * altLead);
  const offKick = -r * 0.34 * iRec * iRec;
  const offOffX = offForward + offKick + jackpotTremor;
  const offOffY = -swayY - r * 0.10 * iClimb + (jackpotActive ? -r * 0.06 : 0);
  const offRot = (jackpotActive ? -0.02 : -0.10 - swayRot) - 0.48 * iClimb;

  return {
    mainOffX, mainOffY, mainRot,
    offOffX, offOffY, offRot,
    ebonyT, ivoryT,
    directDrive: ebonyT > 0 || ivoryT > 0 || jackpotActive,
  };
}

function _drawDanteGunChargeAura(ctx, r, scale = 1.0) {
  const frameNow = (typeof state !== 'undefined' && state.frameCount !== undefined) ? state.frameCount : 0;
  const pulse = 0.78 + 0.22 * Math.sin(frameNow * 0.45);
  const muzzleX = r * 1.02 * scale;
  const muzzleY = -r * 0.14 * scale;
  const rad = r * 0.18 * scale * pulse;
  ctx.save();
  ctx.translate(muzzleX, muzzleY);
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = '#0E0F14';
  ctx.fillRect(-rad - 1.5, -rad - 1.5, rad * 2 + 3, rad * 2 + 3);
  ctx.fillStyle = '#EF4444';
  ctx.fillRect(-rad, -rad, rad * 2, rad * 2);
  ctx.fillStyle = '#FBBF24';
  ctx.fillRect(-rad * 0.55, -rad * 0.55, rad * 1.1, rad * 1.1);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-rad * 0.25, -rad * 0.25, rad * 0.5, rad * 0.5);
  ctx.restore();
}

function _drawDanteGunMuzzleFlash(ctx, r, timer, scale = 1.0, isDT = false) {
  if (isDT) _drawDanteGunChargeAura(ctx, r, scale);
  if (!timer || timer < 2) return;
  const dtBoost = isDT ? 1.38 : 1.0;
  const muzzleX = r * 1.02 * scale;
  const muzzleY = -r * 0.14 * scale;
  ctx.save();
  ctx.translate(muzzleX, muzzleY);
  if (timer >= 6) {
    const p = (timer - 5) / 5;
    const len = r * (0.36 + 0.28 * p) * scale * dtBoost;
    const rad = r * (0.16 + 0.10 * p) * scale * dtBoost;
    // 16-bit crimson/gold 4-point muzzle blast (Rule 35 zero shadowBlur)
    ctx.fillStyle = '#0E0F14';
    ctx.fillRect(-2, -rad - 1.5, len + 4, rad * 2 + 3);
    ctx.fillRect(len * 0.18 - 1.5, -rad * 1.45 - 1.5, rad * 1.2 + 3, rad * 2.9 + 3);
    ctx.fillStyle = isDT ? '#DC2626' : '#F97316';
    ctx.fillRect(0, -rad, len, rad * 2);
    ctx.fillRect(len * 0.22, -rad * 1.35, rad * 1.1, rad * 2.7);
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(1, -rad * 0.65, len * 0.72, rad * 1.3);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(1, -rad * 0.35, len * 0.42, rad * 0.7);
    if (isDT) {
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(len * 0.32, 0, rad * 0.48, rad * 1.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    // Rising 16-bit post-shot gunsmoke pixel wisps
    const sp = 1 - timer / 6;
    const sy = -r * 0.22 * sp;
    ctx.globalAlpha = Math.max(0.15, (1 - sp) * 0.85);
    ctx.fillStyle = '#0E0F14';
    ctx.fillRect(2 + sp * 6, sy - 2, 6, 5);
    ctx.fillStyle = isDT ? '#FCA5A5' : '#E2E8F0';
    ctx.fillRect(3 + sp * 6, sy - 1, 4, 3);
  }
  ctx.restore();
}

/**
 * Draws Dante's Rebellion greatsword + Ebony & Ivory anchored strictly at canonical
 * lower-torso flanks with weighty hand spring-inertia physics (zero stretched hands, Rule 20 compliant).
 */
function _computeWeaponSwitchEnvelope(fighter) {
  const switchTimer = fighter._weaponSwitchTimer || 0;
  const switchMax = Math.max(1, fighter._weaponSwitchMaxTimer || 14);
  const isSwitchingIn = switchTimer > 0;
  const swP = isSwitchingIn ? Math.max(0, Math.min(1, 1 - switchTimer / switchMax)) : 1;
  const swEase = 1 - Math.pow(1 - swP, 3);
  const swPop = !isSwitchingIn
    ? 1
    : (swP < 0.72 ? 0.56 + 0.50 * (swP / 0.72) : 1.06 - 0.06 * ((swP - 0.72) / 0.28));
  const swAlpha = isSwitchingIn ? (0.25 + 0.75 * swEase) : 1.0;
  return { isSwitchingIn, swEase, swPop, swAlpha };
}

function _computeDanteHandTargets(fighter, r, custom, kin, gunKin, firingGuns) {
  const idleT = ((typeof state !== 'undefined' && state.frameCount) || 0) * 0.10;
  const idleBob = (kin.active || firingGuns) ? 0 : Math.sin(idleT) * (r * 0.04);

  const anchorMainX = r * 0.82 + (custom.offsetX || 0);
  const anchorMainY = r * 0.38 + (custom.offsetY || 0);
  const anchorOffX = -r * 0.82;
  const anchorOffY = r * 0.38;

  const rawMainX = anchorMainX + (firingGuns ? gunKin.mainOffX : (kin.lungeX + kin.tremorX));
  const rawMainY = Math.max(r * 0.24, anchorMainY + (firingGuns ? gunKin.mainOffY : (kin.offY + kin.tremorY + idleBob)));

  const offRecoilX = kin.active && !firingGuns
    ? (kin.isFinisher ? -r * 0.26 : -kin.lungeX * 0.45)
    : (kin.offHandLunge || 0);
  const offCounterY = kin.active && !firingGuns
    ? -kin.offY * 0.40
    : ((kin.offHandOffY || 0) - idleBob * 0.7);
  const rawOffX = anchorOffX + (firingGuns ? gunKin.offOffX : offRecoilX);
  const rawOffY = Math.max(r * 0.24, anchorOffY + (firingGuns ? gunKin.offOffY : offCounterY));

  const phys = _stepDanteHandPhysics(fighter, r, rawMainX, rawMainY, rawOffX, rawOffY, kin.swingAngle);
  const isMillionJab = kin.active && kin.moveType === 'million_stab';
  const useDirect = isMillionJab || gunKin.directDrive || Boolean(kin.offHandLunge) || Boolean(kin.isTransformSpread);

  return {
    phys,
    isMillionJab,
    mainPos: _clampHandOrbit(useDirect ? rawMainX : phys.mx, useDirect ? rawMainY : phys.my, anchorMainX, anchorMainY, r * 0.44, r * 0.24),
    offPos: _clampHandOrbit(useDirect ? rawOffX : phys.ox, useDirect ? rawOffY : phys.oy, anchorOffX, anchorOffY, r * 0.48, r * 0.24),
  };
}

function _drawDanteOffHandWeapon(ctx, fighter, r, scale, skinTone, handRadius, offPos, gunKin, swEnv, firingGuns) {
  ctx.save();
  ctx.translate(offPos.x, offPos.y);
  if (firingGuns) {
    ctx.save();
    if (swEnv.isSwitchingIn) {
      ctx.translate(r * 0.24 * (1 - swEnv.swEase), r * 0.14 * (1 - swEnv.swEase));
      ctx.rotate(gunKin.offRot + 1.25 * (1 - swEnv.swEase));
      ctx.scale(swEnv.swPop, swEnv.swPop);
      ctx.globalAlpha = swEnv.swAlpha;
    } else {
      ctx.rotate(gunKin.offRot);
    }
    _drawPistolShape(ctx, r, scale * 0.88, true);
    _drawDanteGunMuzzleFlash(ctx, r, gunKin.ivoryT, scale * 0.88, Boolean(fighter.isDevilTrigger));
    ctx.restore();
  }
  if (!fighter.hideHands) {
    drawPixelHand(ctx, 0, 0, handRadius, skinTone, '#0E0F14');
  }
  ctx.restore();
}

function _drawRebellionChargeGlow(ctx, r, scale, chargeLevel) {
  if (!chargeLevel || chargeLevel <= 0.02) return;
  const bladeLen = r * 2.25 * scale;
  const pulse = 0.72 + 0.28 * Math.sin(chargeLevel * Math.PI * 6);
  ctx.save();
  ctx.globalAlpha = Math.min(0.92, chargeLevel * 0.88 * pulse);
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.ellipse(bladeLen * 0.56, 0, bladeLen * 0.46, r * 0.24 * scale * pulse, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.ellipse(bladeLen * 0.65, 0, bladeLen * 0.34, r * 0.09 * scale * pulse, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function _drawDanteMainHandWeapon(ctx, fighter, r, custom, scale, skinTone, handRadius, targets, kin, gunKin, swEnv, firingGuns, isDevilVisual = false) {
  const isDT = Boolean(isDevilVisual);
  const isBladeThrown = Boolean(fighter._roundTripEntity && fighter._roundTripEntity.phase !== 'charge');
  const hideMainWeapon = isBladeThrown || Boolean(kin.isTransformSpread);

  ctx.save();
  ctx.translate(targets.mainPos.x, targets.mainPos.y);
  if (firingGuns && !kin.isTransformSpread) {
    ctx.save();
    if (swEnv.isSwitchingIn) {
      ctx.translate(-r * 0.24 * (1 - swEnv.swEase), r * 0.14 * (1 - swEnv.swEase));
      ctx.rotate(gunKin.mainRot - 1.35 * (1 - swEnv.swEase));
      ctx.scale(swEnv.swPop, swEnv.swPop);
      ctx.globalAlpha = swEnv.swAlpha;
    } else {
      ctx.rotate(gunKin.mainRot);
    }
    _drawPistolShape(ctx, r, scale * 0.92, false);
    _drawDanteGunMuzzleFlash(ctx, r, gunKin.ebonyT, scale * 0.92, isDT);
    ctx.restore();
  } else if (!hideMainWeapon) {
    ctx.save();
    if (swEnv.isSwitchingIn) {
      ctx.translate(-r * 0.26 * (1 - swEnv.swEase), -r * 0.16 * (1 - swEnv.swEase));
      ctx.rotate(-1.10 * (1 - swEnv.swEase));
      ctx.scale(swEnv.swPop, swEnv.swPop);
      ctx.globalAlpha = swEnv.swAlpha;
    }
    ctx.rotate(kin.swingAngle + (targets.isMillionJab ? 0 : targets.phys.angLag) + (custom.angleOffset || 0));
    ctx.scale(kin.scaleX || 1, kin.scaleY || 1);
    if (kin.bladeThrust) {
      ctx.save();
      ctx.translate(kin.bladeThrust, 0);
      _drawRebellionShape(ctx, r, scale, isDT);
      if (kin.chargeLevel > 0) _drawRebellionChargeGlow(ctx, r, scale, kin.chargeLevel);
      ctx.restore();
    } else {
      _drawRebellionShape(ctx, r, scale, isDT);
      if (kin.chargeLevel > 0) _drawRebellionChargeGlow(ctx, r, scale, kin.chargeLevel);
    }
    ctx.restore();
  }
  if ((kin.catchFlash || 0) > 0.05) {
    ctx.save();
    ctx.globalAlpha = kin.catchFlash * 0.85;
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(0, 0, handRadius * (1.2 + kin.catchFlash * 0.8), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (!fighter.hideHands && !fighter.hideFrontHand) {
    drawPixelHand(ctx, 0, 0, handRadius, skinTone, '#0E0F14');
  }
  ctx.restore();
}

export function drawDanteWeaponsAndSlashVFX(ctx, fighter, r, facingLeft = false) {
  if (!ctx || !fighter) return;
  const custom = (typeof state !== 'undefined' && state.weaponCustomizations?.dante) || {};
  const scale = custom.scale ?? 1.0;
  const handRadius = r * 0.30;
  const isDT = Boolean(fighter.isDevilTrigger);
  const txTimer = fighter._dtTransformTimer || 0;
  const txMax = Math.max(1, fighter._dtTransformMaxTimer || 54);
  const txP = txTimer > 0 ? Math.max(0, Math.min(1, 1 - txTimer / txMax)) : 1;
  const isDevilVisual = isDT && (txTimer <= 0 || txP >= 0.36);
  const skinTone = isDevilVisual ? '#3E354C' : '#FEDBC0';

  const kin = _computeDanteMeleeKinematics(fighter, r);
  const firingGuns = !kin.isTransformSpread && (
    (fighter._gunVisualTimer || 0) > 0 ||
    Boolean(fighter._roundTripEntity && (fighter._roundTripEntity.phase === 'spin' || fighter._roundTripEntity.phase === 'return')) ||
    (fighter._jackpotTimer || 0) > 0 ||
    (fighter._jackpotFireTimer || 0) > 0
  );
  const gunKin = _computeDanteGunKinematics(fighter, r, firingGuns);
  const swEnv = _computeWeaponSwitchEnvelope(fighter);
  const targets = _computeDanteHandTargets(fighter, r, custom, kin, gunKin, firingGuns);

  _drawDanteOffHandWeapon(ctx, fighter, r, scale, skinTone, handRadius, targets.offPos, gunKin, swEnv, firingGuns);

  if (kin.active && !firingGuns) {
    ctx.save();
    ctx.translate(targets.mainPos.x, targets.mainPos.y);
    if (kin.moveType === 'million_stab') {
      _drawMillionStabFlurryVFX(ctx, r, kin, scale, isDT);
    } else {
      _drawRebellionCrescentRibbon(ctx, r, kin, scale, isDT);
    }
    ctx.restore();
  }

  _drawDanteMainHandWeapon(ctx, fighter, r, custom, scale, skinTone, handRadius, targets, kin, gunKin, swEnv, firingGuns, isDevilVisual);
}

export function drawDanteWeaponPreview(ctx, x, y, angle, r) {
  const custom = (typeof state !== 'undefined' && state.weaponCustomizations?.dante) || {};
  const part = (typeof state !== 'undefined' && state.studioDanteWeaponPart) || 'rebellion';
  const scale = custom.scale ?? 1.0;

  ctx.save();
  ctx.translate((x || 0) + (custom.offsetX || 0), (y || 0) + (custom.offsetY || 0));
  ctx.rotate((angle || 0) + (custom.angleOffset || 0));
  if (part === 'ebony') {
    _drawPistolShape(ctx, r, scale * 1.15, false);
  } else if (part === 'ivory') {
    _drawPistolShape(ctx, r, scale * 1.15, true);
  } else if (part === 'devil_sword') {
    _drawRebellionShape(ctx, r, scale, true);
  } else {
    _drawRebellionShape(ctx, r, scale, false);
  }
  ctx.restore();
}

function _isEntryReady(entry) {
  return Boolean(entry && entry.img && (entry.loaded || entry.img.complete) && entry.img.naturalWidth > 0);
}

export function drawDanteDtAura(ctx, x, y, r, alpha = 0.86) {
  if (!ctx || _isVfxDisabled()) return false;
  const entry = _getVfxEntry('dtAura');
  if (!_isEntryReady(entry)) return false;
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const frameIdx = Math.floor(now / 55) % entry.frames;
  const w = Math.max(88, r * 3.35);
  const h = Math.max(72, r * 2.65);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  ctx.drawImage(entry.img, frameIdx * entry.cw, 0, entry.cw, entry.ch, x - w * 0.5, y - h * 0.5, w, h);
  ctx.restore();
  return true;
}

export function drawDanteJackpotBeam(ctx, x, y, angle, length, width) {
  if (!ctx || _isVfxDisabled()) return false;
  const entry = _getVfxEntry('jackpotBeam');
  if (!_isEntryReady(entry)) return false;
  const frameIdx = Math.floor(Date.now() / 40) % entry.frames;
  const drawH = Math.max(54, width * 1.48);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  ctx.rotate(angle || 0);
  ctx.drawImage(entry.img, frameIdx * entry.cw, 0, entry.cw, entry.ch, 0, -drawH * 0.5, length, drawH);
  ctx.restore();
  return true;
}

export function drawDanteSprite(ctx, key, x, y, angle, w, h, frameIdx = 0, alpha = 1.0) {
  if (!ctx || _isVfxDisabled()) return false;
  const entry = _getVfxEntry(key);
  if (!_isEntryReady(entry)) return false;
  const safeFrame = Math.max(0, Math.min(entry.frames - 1, frameIdx));
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  if (angle) ctx.rotate(angle);
  ctx.drawImage(entry.img, safeFrame * entry.cw, 0, entry.cw, entry.ch, -w * 0.5, -h * 0.5, w, h);
  ctx.restore();
  return true;
}

// ── Rule 35 Pre-Baked 16-Bit Pixel Bullet Tracer & Concentric Shockwave Caches ──
let _danteBulletCanvas = null;
let _danteCritBulletCanvas = null;
let _danteChargeBulletCanvas = null;
let _danteChargeCritBulletCanvas = null;
const _danteShockwaveRingCache = new Map();

function _bakeDanteChargeBulletCanvas(isCrit = false) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = isCrit ? 48 : 44;
  c.height = isCrit ? 20 : 18;
  const bctx = c.getContext('2d');
  if (!bctx) return null;
  bctx.imageSmoothingEnabled = false;
  const w = c.width;
  const h = c.height;
  // Crisp #0E0F14 manga ink sheath
  bctx.fillStyle = '#0E0F14';
  bctx.fillRect(6, 2, w - 10, h - 4);
  bctx.fillRect(2, 4, w - 4, h - 8);
  // Demonic DT crimson-gold plasma shell
  bctx.fillStyle = '#DC2626';
  bctx.fillRect(4, 6, 16, h - 12);
  bctx.fillStyle = '#EF4444';
  bctx.fillRect(8, 4, w - 16, h - 8);
  bctx.fillStyle = isCrit ? '#FBBF24' : '#F59E0B';
  bctx.fillRect(14, 6, w - 20, h - 12);
  // White-hot charged nose & lance tip
  bctx.fillStyle = '#FFFFFF';
  bctx.fillRect(w - 16, 6, 12, h - 12);
  bctx.fillRect(w - 8, 4, 4, h - 8);
  return c;
}

function _getDanteBulletCanvas(isCrit = false, isChargeShot = false) {
  if (isChargeShot) {
    if (isCrit) {
      if (!_danteChargeCritBulletCanvas) _danteChargeCritBulletCanvas = _bakeDanteChargeBulletCanvas(true);
      return _danteChargeCritBulletCanvas;
    }
    if (!_danteChargeBulletCanvas) _danteChargeBulletCanvas = _bakeDanteChargeBulletCanvas(false);
    return _danteChargeBulletCanvas;
  }
  if (isCrit) {
    if (_danteCritBulletCanvas) return _danteCritBulletCanvas;
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 36;
    c.height = 14;
    const bctx = c.getContext('2d');
    if (!bctx) return null;
    bctx.imageSmoothingEnabled = false;
    // 16-bit critical round: dark ink outline, blazing crimson tail, gold-white core
    bctx.fillStyle = '#0E0F14';
    bctx.fillRect(4, 2, 28, 10);
    bctx.fillRect(2, 4, 32, 6);
    bctx.fillStyle = '#EF4444';
    bctx.fillRect(4, 4, 12, 6);
    bctx.fillStyle = '#FBBF24';
    bctx.fillRect(14, 4, 12, 6);
    bctx.fillStyle = '#FFFFFF';
    bctx.fillRect(22, 4, 10, 6);
    _danteCritBulletCanvas = c;
    return c;
  }
  if (_danteBulletCanvas) return _danteBulletCanvas;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 12;
  const bctx = c.getContext('2d');
  if (!bctx) return null;
  bctx.imageSmoothingEnabled = false;
  // 16-bit stepped pixel tracer on a 2x2 grid with #0E0F14 ink outline
  // Outer ink border
  bctx.fillStyle = '#0E0F14';
  bctx.fillRect(4, 2, 24, 8);
  bctx.fillRect(2, 4, 28, 4);
  // Crimson tail wake
  bctx.fillStyle = '#DC2626';
  bctx.fillRect(4, 4, 8, 4);
  // Golden brass body
  bctx.fillStyle = '#F59E0B';
  bctx.fillRect(10, 4, 14, 4);
  bctx.fillStyle = '#FDE047';
  bctx.fillRect(14, 4, 10, 2);
  // White-hot leading nose
  bctx.fillStyle = '#FFFFFF';
  bctx.fillRect(22, 4, 6, 4);
  _danteBulletCanvas = c;
  return c;
}

function _getDanteShockwaveRingCanvas(color = '#EF4444') {
  let cached = _danteShockwaveRingCache.get(color);
  if (cached) return cached;
  if (typeof document === 'undefined') return null;
  const size = 96;
  const P = 2;
  const steps = size / P;
  const half = steps / 2;
  const rOuter = half - 2;
  const rInner = rOuter - 3.2;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const rctx = c.getContext('2d');
  if (!rctx) return null;
  rctx.imageSmoothingEnabled = false;

  for (let gy = 0; gy < steps; gy++) {
    for (let gx = 0; gx < steps; gx++) {
      const dx = gx - half + 0.5;
      const dy = gy - half + 0.5;
      const d = Math.hypot(dx, dy);
      if (d > rOuter + 1.1) continue;
      if (d >= rOuter - 0.9) {
        rctx.fillStyle = '#0E0F14';
        rctx.fillRect(gx * P, gy * P, P, P);
      } else if (d >= rInner + 1.0) {
        rctx.fillStyle = color;
        rctx.fillRect(gx * P, gy * P, P, P);
      } else if (d >= rInner) {
        rctx.fillStyle = '#FEF08A';
        rctx.fillRect(gx * P, gy * P, P, P);
      } else if (d >= rInner - 1.0) {
        rctx.fillStyle = '#0E0F14';
        rctx.fillRect(gx * P, gy * P, P, P);
      } else {
        // Rule 26: Expanding translucent interior wash
        rctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
        rctx.fillRect(gx * P, gy * P, P, P);
      }
    }
  }
  _danteShockwaveRingCache.set(color, c);
  return c;
}

export function drawDantePixelBullet(ctx, b) {
  if (!ctx || !b) return;
  const isCrit = Boolean(b.isCrit);
  const isCharge = Boolean(b.isChargeShot);
  const cached = _getDanteBulletCanvas(isCrit, isCharge);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(b.x, b.y);
  ctx.rotate(b.angle || 0);
  if (isCharge) {
    // Trailing demonic energy ember pips behind charged round
    ctx.fillStyle = '#0E0F14';
    ctx.fillRect(-33, -4, 6, 8);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(-32, -3, 4, 6);
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(-26, -2, 4, 4);
  }
  if (cached) {
    if (isCharge) {
      const cw = isCrit ? 48 : 44;
      const ch = isCrit ? 20 : 18;
      ctx.drawImage(cached, -cw * 0.56, -ch * 0.5, cw, ch);
    } else if (isCrit) {
      ctx.drawImage(cached, -20, -7, 36, 14);
    } else {
      ctx.drawImage(cached, -18, -6, 32, 12);
    }
  } else {
    const len = isCharge ? 30 : 22;
    const th = isCharge ? 10 : 6;
    ctx.fillStyle = '#0E0F14';
    ctx.fillRect(-len * 0.55, -th * 0.5, len, th);
    ctx.fillStyle = (isCharge || isCrit) ? '#EF4444' : '#F59E0B';
    ctx.fillRect(-len * 0.45, -th * 0.35, len * 0.82, th * 0.7);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-2, -1.5, 10, 3);
  }
  ctx.restore();
}

export function drawDantePixelShockwaves(ctx, shockwaves) {
  if (!ctx || !Array.isArray(shockwaves) || shockwaves.length === 0 || _isVfxDisabled()) return;
  for (let i = 0; i < shockwaves.length; i++) {
    const sw = shockwaves[i];
    const p = 1 - Math.max(0, sw.life) / Math.max(1, sw.maxLife);
    const ringCanvas = _getDanteShockwaveRingCanvas(sw.color || '#EF4444');
    // Rule 26: Sequential staggered concentric ripple rings, zero spoke meshes
    for (let k = 0; k < 2; k++) {
      const lp = (p - k * 0.14) / (1 - k * 0.14);
      if (lp <= 0 || lp >= 1) continue;
      const rk = Math.round((sw.maxR * Math.pow(lp, 0.72)) / 2) * 2;
      if (rk < 4) continue;
      const alpha = Math.pow(1 - lp, 1.25) * 0.78;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = alpha;
      if (ringCanvas) {
        ctx.drawImage(ringCanvas, sw.x - rk, sw.y - rk, rk * 2, rk * 2);
      } else {
        ctx.strokeStyle = sw.color || '#EF4444';
        ctx.lineWidth = Math.max(2, 4 * (1 - lp));
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, rk, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Standalone discrete 16-bit pixel embers (Rule 26: zero radial connecting lines)
      if (k === 0 && lp < 0.75) {
        for (let e = 0; e < 4; e++) {
          const ea = e * (Math.PI * 0.5) + 0.35 + lp * 0.6;
          const ex = Math.round((sw.x + Math.cos(ea) * (rk + 5)) / 2) * 2;
          const ey = Math.round((sw.y + Math.sin(ea) * (rk + 5)) / 2) * 2;
          ctx.fillStyle = '#0E0F14';
          ctx.fillRect(ex - 2, ey - 2, 6, 6);
          ctx.fillStyle = e % 2 === 0 ? '#FEF08A' : (sw.color || '#EF4444');
          ctx.fillRect(ex - 1, ey - 1, 4, 4);
        }
      }
      ctx.restore();
    }
  }
}

export function updateDanteTransientVfx(list) {
  if (!Array.isArray(list) || list.length === 0) return;
  for (let i = list.length - 1; i >= 0; i--) {
    list[i].life--;
    if (list[i].life <= 0) list.splice(i, 1);
  }
}

export function updateDanteWeaponVanishVfx(list) {
  if (!Array.isArray(list) || list.length === 0) return;
  for (let i = list.length - 1; i >= 0; i--) {
    list[i].life--;
    if (list[i].life <= 0) list.splice(i, 1);
  }
}

function _drawVanishEmbersAndSeal(ctx, x, y, r, p, isRebellion = false) {
  const ringCanvas = _getDanteShockwaveRingCanvas('#EF4444');
  const ringRadius = Math.max(6, r * (0.28 + 0.72 * p));
  const ringAlpha = Math.max(0, 0.78 * (1 - p));
  if (ringCanvas && ringAlpha > 0.02) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = ringAlpha;
    ctx.drawImage(ringCanvas, x - ringRadius, y - ringRadius, ringRadius * 2, ringRadius * 2);
    ctx.restore();
  }
  const emberCount = isRebellion ? 6 : 4;
  const emberAlpha = Math.max(0, 1 - p * 1.15);
  if (emberAlpha > 0.02) {
    ctx.save();
    ctx.globalAlpha = emberAlpha;
    for (let i = 0; i < emberCount; i++) {
      const spread = (i / emberCount) * Math.PI * 2 + p * 0.9;
      const dist = isRebellion ? (r * 0.35 + i * r * 0.22 * p + r * 0.45 * p) : (r * 0.25 + r * 0.52 * p);
      const ex = x + Math.cos(spread) * dist * (isRebellion ? 1.1 : 0.9);
      const ey = y + Math.sin(spread) * dist * 0.75 - p * r * 0.28;
      const sz = Math.max(2, Math.round((isRebellion ? 4.5 : 3.5) * (1 - p * 0.65)));
      ctx.fillStyle = '#0E0F14';
      ctx.fillRect(ex - 1, ey - 1, sz + 2, sz + 2);
      ctx.fillStyle = i % 2 === 0 ? '#EF4444' : '#FBBF24';
      ctx.fillRect(ex, ey, sz, sz);
    }
    ctx.restore();
  }
}

export function drawDanteWeaponVanishVfx(ctx, list) {
  if (!ctx || !Array.isArray(list) || list.length === 0 || _isVfxDisabled()) return;
  const vanishEntry = _getVfxEntry('weaponVanish');
  const spriteReady = _isEntryReady(vanishEntry);
  for (let i = 0; i < list.length; i++) {
    const g = list[i];
    const p = Math.max(0, Math.min(1, 1 - Math.max(0, g.life) / Math.max(1, g.maxLife || 18)));
    const ease = 1 - Math.pow(1 - p, 2.2);
    const alpha = Math.max(0, 0.90 * Math.pow(1 - p, 1.35));
    const r = g.r || 30;
    const isGuns = g.kind === 'guns';
    const frameIdx = spriteReady ? Math.min(vanishEntry.frames - 1, Math.floor(p * vanishEntry.frames)) : 0;

    ctx.save();
    ctx.translate(g.x || 0, g.y || 0);
    ctx.rotate(g.angle || 0);
    if (g.facingLeft) ctx.scale(1, -1);

    // Main-hand outgoing weapon silhouette dissolve + dedicated 8-frame dispel sprite
    const baseMx = g.mainX ?? r * 0.82;
    const baseMy = g.mainY ?? r * 0.38;
    const mx = baseMx - r * 0.26 * ease;
    const my = baseMy + r * 0.16 * ease;
    const wScale = Math.max(0.25, 1 - 0.44 * ease);
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate((isGuns ? 0 : (g.swingAngle || 0)) - 0.58 * ease);
    ctx.scale(wScale, wScale);
    ctx.globalAlpha = alpha;
    if (isGuns) {
      _drawPistolShape(ctx, r, 0.92, false);
    } else {
      _drawRebellionShape(ctx, r, 1.0, Boolean(g.isDT));
    }
    ctx.restore();

    const mainVfxX = isGuns ? (baseMx + r * 0.25) : (baseMx + Math.cos(g.swingAngle || 0) * r * 0.72);
    const mainVfxY = isGuns ? baseMy : (baseMy + Math.sin(g.swingAngle || 0) * r * 0.72);
    if (spriteReady) {
      const sz = isGuns ? r * 2.15 : r * 2.95;
      drawDanteSprite(ctx, 'weaponVanish', mainVfxX, mainVfxY, g.swingAngle || 0, sz, sz, frameIdx, Math.max(0.25, 1 - p * 0.45));
    } else {
      _drawVanishEmbersAndSeal(ctx, mainVfxX, mainVfxY, r, p, !isGuns);
    }

    // Off-hand Ivory outgoing pistol dissolve + 8-frame dispel sprite
    if (isGuns) {
      const baseOx = g.offX ?? -r * 0.82;
      const baseOy = g.offY ?? r * 0.38;
      const ox = baseOx + r * 0.22 * ease;
      const oy = baseOy + r * 0.18 * ease;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(-0.10 + 0.58 * ease);
      ctx.scale(wScale, wScale);
      ctx.globalAlpha = alpha;
      _drawPistolShape(ctx, r, 0.88, true);
      ctx.restore();
      if (spriteReady) {
        const offSz = r * 2.0;
        drawDanteSprite(ctx, 'weaponVanish', baseOx + r * 0.22, baseOy, 0, offSz, offSz, frameIdx, Math.max(0.25, 1 - p * 0.45));
      } else {
        _drawVanishEmbersAndSeal(ctx, baseOx, baseOy, r * 0.88, p, false);
      }
    }

    ctx.restore();
  }
}

export function drawDanteTransientVfx(ctx, list, layer = 'all', fighter = null) {
  if (!ctx || !Array.isArray(list) || list.length === 0 || _isVfxDisabled()) return;
  for (let i = 0; i < list.length; i++) {
    const fx = list[i];
    if (layer === 'back' && !fx.behindBody) continue;
    if (layer === 'front' && fx.behindBody) continue;
    const p = 1 - Math.max(0, fx.life) / Math.max(1, fx.maxLife);
    const entry = _getVfxEntry(fx.kind);
    if (!_isEntryReady(entry)) continue;

    const frameIdx = Math.min(entry.frames - 1, Math.floor(p * entry.frames));
    const w = fx.w || fx.r * 2.8 || 84;
    const h = fx.h || w * (entry.ch / entry.cw);

    let drawX = fx.x;
    let drawY = fx.y;
    let drawAng = fx.angle || 0;
    if (fx.followFighter && fighter) {
      drawAng = fighter._sinStingerState?.active
        ? fighter._sinStingerState.angle
        : (fx.lockAngle !== undefined ? fx.lockAngle : (fighter.gunAngle ?? drawAng));
      const fwd = fx.forwardOffset || 0;
      drawX = (fighter.x || 0) + Math.cos(drawAng) * fwd;
      drawY = (fighter.y || 0) - (fighter.z || 0) + Math.sin(drawAng) * fwd;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = Math.max(0, (1 - p * 0.5) * (fx.alpha ?? 0.94));
    ctx.translate(drawX, drawY);
    if (drawAng) ctx.rotate(drawAng);
    if (fx.flipY) ctx.scale(1, -1);
    ctx.drawImage(entry.img, frameIdx * entry.cw, 0, entry.cw, entry.ch, -w * 0.5, -h * 0.5, w, h);
    ctx.restore();
  }
}

/**
 * Renders Dante's Side Special thrown Rebellion greatsword, flight ribbon trail,
 * and 8-frame 16-bit whirling sawblade vortex ring (FORWARDTHROW.gif F40-F85).
 */
export function drawDanteSideSpecialBlade(ctx, fighter) {
  const rt = fighter?._roundTripEntity;
  if (!ctx || !rt || rt.phase === 'charge') return;

  const r = fighter.r || 30;
  const custom = (typeof state !== 'undefined' && state.weaponCustomizations?.dante) || {};
  const scale = custom.scale ?? 1.0;
  const isDT = Boolean(fighter.isDevilTrigger);
  const isSpinning = rt.phase === 'spin';

  // 1. Crimson flight / recall motion smear ribbon (out & return phases)
  if (Array.isArray(rt.trail) && rt.trail.length >= 2 && (rt.phase === 'out' || rt.phase === 'return')) {
    ctx.save();
    for (let i = 1; i < rt.trail.length; i++) {
      const a = rt.trail[i - 1];
      const b = rt.trail[i];
      const t = i / rt.trail.length;
      ctx.strokeStyle = i % 2 === 0 ? '#EF4444' : '#F59E0B';
      ctx.globalAlpha = t * 0.62;
      ctx.lineWidth = Math.max(2, r * 0.42 * t);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. 16-bit 8-frame whirling crimson sawblade vortex disc
  const whirlEntry = _getVfxEntry('roundTripWhirl');
  if (_isEntryReady(whirlEntry) && !_isVfxDisabled()) {
    const frameIdx = Math.floor((rt.whirlFrame || 0) * 0.5 + Math.abs(rt.spinAngle) * 1.4) % whirlEntry.frames;
    const discSize = isSpinning ? r * 4.35 : r * 2.95;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(rt.x, rt.y);
    ctx.rotate(isSpinning ? 0.14 : (rt.lockedAngle || 0));
    ctx.scale(1.0, isSpinning ? 0.78 : 0.66);
    ctx.globalAlpha = isSpinning ? 0.94 : 0.62;
    ctx.drawImage(whirlEntry.img, frameIdx * whirlEntry.cw, 0, whirlEntry.cw, whirlEntry.ch, -discSize * 0.5, -discSize * 0.5, discSize, discSize);
    ctx.restore();
  }

  // 3. Real Rebellion greatsword spinning rapidly inside the vortex (+ ghost blur blade)
  ctx.save();
  ctx.translate(rt.x, rt.y);
  ctx.scale(1.0, isSpinning ? 0.80 : 0.92);

  ctx.save();
  ctx.rotate(rt.spinAngle - 0.62);
  ctx.translate(-r * 0.96 * scale, 0);
  ctx.globalAlpha = 0.36;
  _drawRebellionShape(ctx, r * 0.92, scale, isDT);
  ctx.restore();

  ctx.save();
  ctx.rotate(rt.spinAngle);
  ctx.translate(-r * 0.96 * scale, 0);
  ctx.globalAlpha = 0.98;
  _drawRebellionShape(ctx, r * 0.95, scale, isDT);
  ctx.restore();

  ctx.restore();
}

// ── Rule 35 Pre-Baked 16-Bit Sin Devil Trigger Obsidian & Magma-Vein Wings ──
let _dtUpperWingCanvas = null;
let _dtLowerWingCanvas = null;

function _bakeDanteWingCanvas(isUpper = true) {
  if (typeof document === 'undefined') return null;
  const gw = 26;
  const gh = isUpper ? 16 : 12;
  const P = 2;
  const c = document.createElement('canvas');
  c.width = gw * P;
  c.height = gh * P;
  const wctx = c.getContext('2d');
  if (!wctx) return null;
  wctx.imageSmoothingEnabled = false;

  const grid = new Map();
  for (let gx = 1; gx < gw - 1; gx++) {
    const t = (gx - 1) / (gw - 3);
    const archY = isUpper
      ? Math.round(4 - Math.sin(t * Math.PI * 0.72) * 3.5)
      : Math.round(1 + t * 4.5);
    const scallop = Math.round(Math.abs(Math.sin(t * Math.PI * 3.0)) * (isUpper ? 2.5 : 1.6));
    const chord = Math.max(2, Math.round((isUpper ? 11 : 7) * (1 - t * 0.55) - scallop));
    for (let dy = 0; dy < chord; dy++) {
      const gy = archY + dy;
      if (gy < 1 || gy >= gh - 1) continue;
      let col = '#1E1B26';
      if (dy === 0) col = '#DC2626';
      else if (dy === 1 || (gx % 6 === 0 && dy < chord - 1)) col = '#EF4444';
      else if (gx % 6 === 0 && dy === 2) col = '#F59E0B';
      else if (dy === chord - 1) col = '#450A0A';
      grid.set(`${gx},${gy}`, col);
    }
  }

  // 4-neighbor #0E0F14 manga ink outline
  wctx.fillStyle = '#0E0F14';
  for (const key of grid.keys()) {
    const [gx, gy] = key.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nb = `${gx + dx},${gy + dy}`;
      if (!grid.has(nb)) {
        wctx.fillRect((gx + dx) * P, (gy + dy) * P, P, P);
      }
    }
  }
  for (const [key, col] of grid.entries()) {
    const [gx, gy] = key.split(',').map(Number);
    wctx.fillStyle = col;
    wctx.fillRect(gx * P, gy * P, P, P);
  }
  return c;
}

function _getDanteWingCanvas(isUpper = true) {
  if (isUpper) {
    if (!_dtUpperWingCanvas) _dtUpperWingCanvas = _bakeDanteWingCanvas(true);
    return _dtUpperWingCanvas;
  }
  if (!_dtLowerWingCanvas) _dtLowerWingCanvas = _bakeDanteWingCanvas(false);
  return _dtLowerWingCanvas;
}

/**
 * Draws Dante's 4 Sin Devil Trigger obsidian wings veined with glowing crimson magma (Rule 35).
 */
export function drawDanteDevilWings(ctx, r, openFactor = 0.45, frameCount = 0) {
  if (!ctx) return;
  const upWing = _getDanteWingCanvas(true);
  const lowWing = _getDanteWingCanvas(false);
  if (!upWing || !lowWing) return;

  const o = Math.max(0.25, Math.min(1.1, openFactor));
  const beat = Math.sin((frameCount || 0) * 0.14) * 0.06;
  const upW = r * (1.28 + 0.72 * o);
  const upH = upW * (upWing.height / upWing.width);
  const lowW = r * (0.98 + 0.54 * o);
  const lowH = lowW * (lowWing.height / lowWing.width);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (const side of [-1, 1]) {
    // Upper primary wing sweeping upward-outward from shoulder
    ctx.save();
    ctx.translate(side * r * 0.36, -r * 0.06);
    ctx.scale(side, 1);
    ctx.rotate(-0.48 * o + beat + (1 - o) * 0.34);
    ctx.drawImage(upWing, -2, -upH * 0.38, upW, upH);
    ctx.restore();

    // Lower secondary wing sweeping downward-outward
    ctx.save();
    ctx.translate(side * r * 0.32, r * 0.24);
    ctx.scale(side, 1);
    ctx.rotate(0.42 * o - beat * 0.7);
    ctx.drawImage(lowWing, -2, -lowH * 0.32, lowW, lowH);
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Renders the FINALSMASH2.webp Devil Form transformation VFX behind Dante's body (rune ring, flame pillar & volcanic dome).
 */
export function drawDanteTransformSequenceVfx(ctx, fighter) {
  if (!ctx || !fighter || !(fighter._dtTransformTimer > 0) || _isVfxDisabled()) return;
  const maxT = Math.max(1, fighter._dtTransformMaxTimer || 54);
  const p = Math.max(0, Math.min(1, 1 - fighter._dtTransformTimer / maxT));
  const r = fighter.r || 30;
  const x = fighter.x || 0;
  const y = (fighter.y || 0) - (fighter.z || 0);

  // 12-frame volcanic transformation dome + ember burst sprite strip (drawn behind Dante; fades cleanly as real SDT wings unfurl)
  const frameIdx = Math.min(11, Math.floor(p * 12));
  const size = r * 6.8;
  const alpha = p < 0.50 ? 0.96 : Math.max(0, 0.96 * (1 - (p - 0.50) / 0.36));
  if (alpha > 0.02) {
    drawDanteSprite(ctx, 'dtTransform', x, y, 0, size, size, frameIdx, alpha);
  }
}

// ── Rule 35 Pre-Baked SDT Summoned Sword & Ombra Demonic Fireball Quads ──
let _sdtSwordCanvas = null;
let _sdtOmbraFireballCanvas = null;

function _getDanteSummonedSwordCanvas() {
  if (_sdtSwordCanvas) return _sdtSwordCanvas;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 40;
  c.height = 14;
  const sctx = c.getContext('2d');
  if (!sctx) return null;
  sctx.imageSmoothingEnabled = false;
  sctx.fillStyle = '#0E0F14';
  sctx.fillRect(2, 4, 34, 6);
  sctx.fillRect(10, 2, 4, 10);
  sctx.fillStyle = '#EF4444';
  sctx.fillRect(4, 5, 28, 4);
  sctx.fillStyle = '#FBBF24';
  sctx.fillRect(10, 3, 2, 8);
  sctx.fillRect(14, 6, 16, 2);
  sctx.fillStyle = '#FFFFFF';
  sctx.fillRect(26, 6, 8, 2);
  _sdtSwordCanvas = c;
  return c;
}

function _getDanteOmbraFireballCanvas() {
  if (_sdtOmbraFireballCanvas) return _sdtOmbraFireballCanvas;
  if (typeof document === 'undefined') return null;
  const size = 36;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const fctx = c.getContext('2d');
  if (!fctx) return null;
  fctx.imageSmoothingEnabled = false;
  const P = 2;
  const cx = size / (2 * P);
  for (let gy = 1; gy < size / P - 1; gy++) {
    for (let gx = 1; gx < size / P - 1; gx++) {
      const dx = gx - cx + 0.5;
      const dy = gy - cx + 0.5;
      const d = Math.hypot(dx * 0.9, dy);
      if (d > 7.6) continue;
      if (d >= 6.4) fctx.fillStyle = '#0E0F14';
      else if (d >= 4.8) fctx.fillStyle = '#DC2626';
      else if (d >= 3.2) fctx.fillStyle = '#F97316';
      else if (d >= 1.8) fctx.fillStyle = '#FBBF24';
      else fctx.fillStyle = '#FFFFFF';
      fctx.fillRect(gx * P, gy * P, P, P);
    }
  }
  _sdtOmbraFireballCanvas = c;
  return c;
}

/**
 * Renders behind-body Devil Form SDT VFX (Judgment arena-wide flurry slashes so Dante stays cleanly visible).
 */
export function drawDanteSdtBackVfx(ctx, fighter) {
  if (!ctx || !fighter) return;
  const jst = fighter._judgmentState;
  if (!jst || !jst.active || !Array.isArray(jst.slashes) || jst.slashes.length === 0) return;

  for (let i = 0; i < jst.slashes.length; i++) {
    const sl = jst.slashes[i];
    const alpha = Math.max(0, sl.life / Math.max(1, sl.maxLife));
    const halfL = (sl.len || 380) * 0.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(sl.x, sl.y);
    ctx.rotate(sl.angle || 0);
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.moveTo(-halfL, 0);
    ctx.lineTo(0, -14 * alpha);
    ctx.lineTo(halfL, 0);
    ctx.lineTo(0, 14 * alpha);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-halfL * 0.85, 0);
    ctx.lineTo(0, -4 * alpha);
    ctx.lineTo(halfL * 0.85, 0);
    ctx.lineTo(0, 4 * alpha);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Renders Devil Form SDT active VFX: Lightning Teleport arcs, Sin Stinger whirlwind swords, Ombra fireballs.
 */
export function drawDanteSdtVfx(ctx, fighter) {
  if (!ctx || !fighter) return;
  const yCenter = (fighter.y || 0) - (fighter.z || 0);

  // 1. Buffed DT Lightning Teleport Dodge Arcs
  const bolts = fighter._dtTeleportBolts;
  if (Array.isArray(bolts) && bolts.length > 0) {
    for (let i = 0; i < bolts.length; i++) {
      const b = bolts[i];
      const alpha = Math.max(0, b.life / Math.max(1, b.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha;
      for (const pass of [{ w: 5.5, col: '#EF4444' }, { w: 2.2, col: '#FFFFFF' }]) {
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        for (let seg = 1; seg <= 4; seg++) {
          const t = seg / 5;
          const jitter = Math.sin(b.seed + seg * 3.7) * 14;
          const perpAng = Math.atan2(b.y2 - b.y1, b.x2 - b.x1) + Math.PI * 0.5;
          ctx.lineTo(b.x1 + (b.x2 - b.x1) * t + Math.cos(perpAng) * jitter, b.y1 + (b.y2 - b.y1) * t + Math.sin(perpAng) * jitter);
        }
        ctx.lineTo(b.x2, b.y2);
        ctx.lineWidth = pass.w;
        ctx.strokeStyle = pass.col;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 2. Skill 2: Sin Stinger Whirlwind of Summoned Swords
  const stinger = fighter._sinStingerState;
  if (stinger && stinger.active) {
    const swordCanvas = _getDanteSummonedSwordCanvas();
    const orbitR = CONFIG.dante?.sinStingerSwordRadius ?? 72;
    const count = stinger.swordCount || 6;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(fighter.x, yCenter, orbitR, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < count; i++) {
      const a = stinger.spinAngle + (i / count) * Math.PI * 2;
      const sx = fighter.x + Math.cos(a) * orbitR;
      const sy = yCenter + Math.sin(a) * orbitR;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(a + Math.PI * 0.5);
      if (swordCanvas) {
        ctx.drawImage(swordCanvas, -20, -7, 40, 14);
      } else {
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(-16, -2, 32, 4);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // 3. Skill 3: Ombra Demonic Fireballs
  const fireballs = fighter._ombraFireballs;
  if (Array.isArray(fireballs) && fireballs.length > 0) {
    const fbCanvas = _getDanteOmbraFireballCanvas();
    for (let i = 0; i < fireballs.length; i++) {
      const fb = fireballs[i];
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.translate(fb.x, fb.y);
      ctx.rotate(fb.angle || 0);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(-24, -4, 10, 8);
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(-28, -2, 6, 4);
      if (fbCanvas) {
        ctx.drawImage(fbCanvas, -18, -18, 36, 36);
      } else {
        ctx.fillStyle = '#F97316';
        ctx.beginPath();
        ctx.arc(0, 0, fb.radius || 14, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
