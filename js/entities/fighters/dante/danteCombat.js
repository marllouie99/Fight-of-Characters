// ─────────────────────────────────────────────────────────────────────────────
// DANTE BASIC COMBAT & WEAPON SWITCHING MODULE
// Rebellion 4-Stage Combo, Million Stab, Ebony & Ivory Gunfire, Crit, Vanish Sync
// ─────────────────────────────────────────────────────────────────────────────

import { isSkillEnabled } from '../../fighter.js';
import { CONFIG } from '../../../core/config.js';
import { state, spawnFloatingText, triggerGlobalScreenShake } from '../../../core/state.js';
import { spawnSparks, spawnImpactFlash } from '../../../graphics/particles/sparkEffect.js';

const MOVE_TYPES = ['cleave_right', 'cleave_return', 'million_stab', 'high_time'];

// ─── Basic Attack Crit System ─────────────────────────────────────────────────

/**
 * Evaluates critical hit probability and scaled damage for Rebellion & Ebony/Ivory attacks.
 */
export function evaluateDanteBasicCrit(fighter, rawDmg = 0, opts = {}) {
  const cfg = CONFIG.dante || {};
  if (!isSkillEnabled(cfg.enableBasicCrit, true)) {
    return { damage: rawDmg, isCrit: false, critChance: 0, critMultiplier: 1.0 };
  }
  const baseChance = cfg.critChance ?? 0.22;
  const stackBonus = (fighter._critComboStacks || 0) * (cfg.critChancePerBasicHit ?? 0.04);
  const dtBonus = fighter.isDevilTrigger ? (cfg.dtCritChanceBonus ?? 0.15) : 0;
  const finisherChance = cfg.finisherCritChance ?? 1.0;
  const isGuaranteedFinisher = Boolean(opts.isFinisher && finisherChance >= 1.0);
  const finisherBonus = opts.isFinisher ? (cfg.finisherCritBonus ?? 0.15) : 0;
  const maxChance = Math.max(baseChance, opts.isFinisher ? finisherChance : 0, cfg.maxCritChance ?? 0.65);

  const critChance = isGuaranteedFinisher
    ? 1.0
    : Math.max(0, Math.min(maxChance, baseChance + stackBonus + dtBonus + finisherBonus));
  const critMultiplier = Math.max(1.0, cfg.critMultiplier ?? 1.75);
  const isCrit = Boolean(opts.forceCrit || isGuaranteedFinisher || (critChance > 0 && Math.random() < critChance));

  fighter.critChance = critChance;
  fighter.critMultiplier = critMultiplier;
  return {
    damage: isCrit ? Math.max(1, Math.round(rawDmg * critMultiplier)) : rawDmg,
    isCrit,
    critChance,
    critMultiplier,
  };
}

function _triggerBasicCritVfx(fighter, enemy, angle = 0, isFinisher = false) {
  spawnSparks(enemy.x, enemy.y, isFinisher ? 18 : 12, 'crimson', '#FBBF24');
  spawnImpactFlash(enemy.x, enemy.y, isFinisher ? 34 : 24, '#EF4444');
  fighter._spawnRipple(enemy.x, enemy.y, isFinisher ? 68 : 48, '#FBBF24');
  triggerGlobalScreenShake?.(isFinisher ? 9.5 : 5.5, isFinisher ? 11 : 7);
  if (isFinisher) {
    fighter._spawnVfx('slashArc', enemy.x, enemy.y, angle, 96, 54, 12, 0.94);
  }
}

/**
 * Deals Rebellion or Ebony/Ivory basic attack damage with escalating crit feedback.
 */
export function dealDanteBasicAttackDamage(fighter, target, rawDmg, opts = {}) {
  const critRes = opts.preRolledCrit || fighter.evaluateBasicCrit(rawDmg, opts);
  const isCrit = Boolean(critRes.isCrit);
  const dealt = fighter._dealDamage(target, critRes.damage, { ...opts, isCrit, isCritical: isCrit });
  if (dealt <= 0) return { dealt: 0, isCrit };

  fighter._critComboStacks = isCrit ? 0 : Math.min(25, (fighter._critComboStacks || 0) + 1);
  if (isCrit) {
    _triggerBasicCritVfx(fighter, target, opts.angle ?? fighter.gunAngle ?? 0, Boolean(opts.isFinisher));
  }
  return { dealt, isCrit };
}

// ─── Weapon Switching & Post-Finisher Gun Sequence ────────────────────────────

function _pushWeaponVanishGhost(fighter, fromMode, vanishFrames) {
  const r = fighter.r || 30;
  const angle = fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0);
  const normAng = Math.atan2(Math.sin(angle), Math.cos(angle));
  const phys = fighter._danteHandPhys;

  fighter._weaponVanishGhosts.push({
    kind: fromMode,
    x: fighter.x || 0,
    y: (fighter.y || 0) - (fighter.z || 0),
    r,
    angle,
    facingLeft: Math.abs(normAng) > Math.PI / 2,
    swingAngle: phys?.ang ?? 0,
    mainX: phys?.mx ?? (r * 0.82),
    mainY: phys?.my ?? (r * 0.38),
    offX: phys?.ox ?? (-r * 0.82),
    offY: phys?.oy ?? (r * 0.38),
    isDT: Boolean(fighter.isDevilTrigger),
    life: vanishFrames,
    maxLife: vanishFrames,
  });
  if (fighter._weaponVanishGhosts.length > 4) fighter._weaponVanishGhosts.shift();
}

/**
 * Synchronizes active weapon mode ('rebellion' <-> 'guns'), switch animation, cooldown & vanish VFX.
 */
export function syncDanteWeaponSwitch(fighter, cfg) {
  const activeCfg = cfg || CONFIG.dante || {};
  const bladeLandedSpinning = Boolean(
    fighter._roundTripEntity &&
    (fighter._roundTripEntity.phase === 'spin' || fighter._roundTripEntity.phase === 'return')
  );
  const targetMode = (
    (fighter._gunVisualTimer || 0) > 0 ||
    bladeLandedSpinning ||
    (fighter._jackpotTimer || 0) > 0 ||
    (fighter._jackpotFireTimer || 0) > 0
  ) ? 'guns' : 'rebellion';

  if (targetMode === fighter._weaponMode) return false;

  const fromMode = fighter._weaponMode || 'rebellion';
  const swFrames = Math.max(6, activeCfg.weaponSwitchFrames ?? 14);
  const switchCd = Math.max(0, activeCfg.weaponSwitchCooldown ?? 18);

  fighter._weaponMode = targetMode;
  fighter._weaponSwitchFrom = fromMode;
  fighter._weaponSwitchTo = targetMode;
  fighter._weaponSwitchMaxTimer = swFrames;
  fighter._weaponSwitchTimer = swFrames;
  fighter.weaponSwitchCooldown = bladeLandedSpinning ? 0 : switchCd;
  fighter.swordCooldown = Math.max(fighter.swordCooldown || 0, swFrames);
  if (targetMode === 'rebellion') {
    fighter.gunCooldown = Math.max(fighter.gunCooldown || 0, switchCd);
  }

  fighter._playSfx('weaponSwitch');
  if (!(fromMode === 'rebellion' && bladeLandedSpinning)) {
    _pushWeaponVanishGhost(fighter, fromMode, swFrames + 4);
  }
  return true;
}

/**
 * Starts the post-finisher Ebony & Ivory gunfire follow-up sequence.
 */
export function startDanteFinisherGunSequence(fighter, cfg) {
  const activeCfg = cfg || CONFIG.dante || {};
  if (!isSkillEnabled(activeCfg.enableFinisherGunSequence, true)) return false;

  const gunDur = Math.max(20, activeCfg.finisherGunDurationFrames ?? 64);
  const swFrames = Math.max(6, activeCfg.weaponSwitchFrames ?? 14);
  fighter._pendingGunSequence = false;
  fighter._gunSequenceTimer = gunDur;
  fighter._gunSequenceTick = Math.min(gunDur - 6, Math.max(4, Math.round(swFrames * 0.65)));
  fighter._gunVisualTimer = gunDur;
  fighter.swordCooldown = Math.max(fighter.swordCooldown || 0, gunDur + swFrames);
  fighter._syncWeaponSwitch(activeCfg);
  return true;
}

/**
 * Fires a single alternating Ebony or Ivory pistol tracer with kickback recoil & gunshot voiceline chance.
 */
export function fireSingleEbonyIvoryBullet(fighter, cfg, opts = {}) {
  const activeCfg = cfg || CONFIG.dante || {};
  if (!opts.forceSequence && !isSkillEnabled(activeCfg.enableGunfire, true)) return;

  const baseAng = fighter.gunAngle || 0;
  const ang = baseAng + (Math.random() - 0.5) * 0.08;
  const spd = activeCfg.gunShotSpeed ?? 16;
  const r = fighter.r || 30;
  const facingLeft = Math.abs(Math.atan2(Math.sin(baseAng), Math.cos(baseAng))) > Math.PI / 2;

  const useIvory = (fighter._gunShotIndex % 2) === 1;
  fighter._gunShotIndex = (fighter._gunShotIndex || 0) + 1;
  if (useIvory) fighter._ivoryRecoilTimer = 10;
  else fighter._ebonyRecoilTimer = 10;

  const lateralOff = (facingLeft ? -1 : 1) * (useIvory ? -1 : 1) * (r * 0.28);
  const muzzleDist = r + 14;
  const critRes = fighter.evaluateBasicCrit(activeCfg.gunDamage ?? 8, { isGun: true });

  fighter._bullets.push({
    x: fighter.x + Math.cos(ang) * muzzleDist - Math.sin(ang) * lateralOff,
    y: fighter.y + Math.sin(ang) * muzzleDist + Math.cos(ang) * lateralOff,
    vx: Math.cos(ang) * spd,
    vy: Math.sin(ang) * spd,
    angle: ang,
    damage: critRes.damage,
    isCrit: critRes.isCrit,
    life: 44,
  });

  if (!opts.preserveVisualTimer) fighter._gunVisualTimer = Math.max(fighter._gunVisualTimer || 0, 14);
  fighter._syncWeaponSwitch(activeCfg);
  fighter._playSfx('gunshot');
  fighter._maybePlayBasicVoice(
    ['voGun1', 'voGun2', 'voGun3', 'voGun4'],
    activeCfg.gunVoicelineChance ?? 0.30,
    activeCfg,
    activeCfg.basicVoiceCooldownFrames ?? 38
  );
}

/**
 * Advances active finisher gun sequence and standalone pistol burst queues.
 */
export function stepDanteBasicGunQueues(fighter, hostiles, cfg) {
  if (fighter._gunSequenceTimer > 0 && hostiles.length > 0) {
    const endBuffer = Math.max(6, Math.round((cfg.weaponSwitchFrames ?? 14) * 0.5));
    if (fighter._gunSequenceTimer > endBuffer && --fighter._gunSequenceTick <= 0) {
      fighter._gunSequenceTick = Math.max(4, cfg.finisherGunFireInterval ?? 11);
      fighter._fireSingleEbonyIvoryBullet(cfg, { forceSequence: true, preserveVisualTimer: true });
    }
  }
  if (fighter._gunBurstQueue > 0 && --fighter._gunBurstTick <= 0) {
    fighter._gunBurstQueue--;
    fighter._gunBurstTick = 6;
    fighter._fireSingleEbonyIvoryBullet(cfg);
  }
}

// ─── Rebellion 4-Stage Combo Execution ────────────────────────────────────────

function _resolveComboStage(fighter, activeCfg) {
  const millionEnabled = isSkillEnabled(activeCfg.enableMillionStab, true);
  const highTimeEnabled = isSkillEnabled(activeCfg.enableHighTime, true);
  const cleaveDur = Math.max(10, activeCfg.cleaveFrames ?? 28);
  const durations = [
    cleaveDur,
    cleaveDur,
    Math.max(18, activeCfg.millionStabFrames ?? 56),
    Math.max(12, activeCfg.highTimeFrames ?? 36),
  ];

  let step = fighter.comboStep % 4;
  if (step === 2 && !millionEnabled) step = highTimeEnabled ? 3 : 0;
  else if (step === 3 && !highTimeEnabled) step = 0;

  const hasNextStage =
    (step === 0) ||
    (step === 1 && (millionEnabled || highTimeEnabled)) ||
    (step === 2 && highTimeEnabled);

  return { step, duration: durations[step], hasNextStage };
}

function _setupStageAudioAndVfx(fighter, step, aimAng, activeCfg) {
  fighter._playSfx('swordSlash');
  if (step === 2) {
    fighter.vx = 0;
    fighter.vy = 0;
    fighter._millionStabTimer = Math.max(8, activeCfg.millionStabFlurryFrames ?? 28);
    fighter._millionStabTick = Math.max(1, (activeCfg.millionStabTickInterval ?? 5) - 1);
    fighter._millionStabFinisherDelay = 0;
    fighter._millionStabHitLanded = false;
    fighter._maybePlayBasicVoice(['voGun1', 'voGun2', 'voSlash2'], activeCfg.swordVoicelineChance ?? 0.45, activeCfg, 36);
    triggerGlobalScreenShake?.(3.0, 5);
    spawnFloatingText(fighter.x, fighter.y - (fighter.r || 30) - 18, 'MILLION STAB!', '#EF4444');
    return;
  }

  fighter._millionStabTimer = 0;
  fighter._millionStabFinisherDelay = 0;
  if (step === 3) {
    fighter._highTimeHopTimer = activeCfg.highTimeHopFrames ?? 20;
    fighter._playSfx('heavyBlast');
    fighter._maybePlayBasicVoice(['voFinisher', 'voSlash3', 'voGun2'], activeCfg.finisherVoicelineChance ?? 0.75, activeCfg, activeCfg.basicVoiceCooldownFrames ?? 38);
    fighter._spawnRipple(fighter.x + Math.cos(aimAng) * 34, fighter.y + Math.sin(aimAng) * 34, 68, '#EF4444');
    triggerGlobalScreenShake?.(activeCfg.highTimeSwingShake ?? 6.5, activeCfg.highTimeSwingShakeFrames ?? 9);
    spawnFloatingText(fighter.x, fighter.y - (fighter.r || 30) - 18, 'HIGH TIME!', '#FBBF24');
    return;
  }

  fighter._maybePlayBasicVoice(step === 0 ? ['voSlash1'] : ['voSlash2', 'voSlash3'], activeCfg.swordVoicelineChance ?? 0.45, activeCfg, 26);
  triggerGlobalScreenShake?.(activeCfg.cleaveSwingShake ?? 3.2, activeCfg.cleaveSwingShakeFrames ?? 5);
}

function _applyRebellionArcHits(fighter, opponent, step, aimAng, activeCfg) {
  const reach = (activeCfg.swordReach ?? 94) +
    (fighter.isDevilTrigger ? (activeCfg.dtSwordReachBonus ?? 14) : 0) +
    (step === 2 ? (activeCfg.millionStabReachBonus ?? 22) : (activeCfg.cleaveReachBonus ?? 6));
  const halfArc = ((activeCfg.swordArcDeg ?? 135) * Math.PI / 180) * (step === 2 ? 0.42 : 0.62);
  const baseSwordDmg = activeCfg.swordDamage ?? 21;
  const stageDamages = [
    baseSwordDmg,
    activeCfg.cleaveReturnDamage ?? Math.max(6, baseSwordDmg - 6),
    activeCfg.millionStabInitialDamage ?? Math.max(6, baseSwordDmg - 6),
    activeCfg.highTimeDamage ?? Math.max(6, baseSwordDmg + 9),
  ];
  const baseDmg = Math.max(6, stageDamages[step]);
  const kbForce = step === 3 ? (activeCfg.highTimeKnockback ?? 12) : (activeCfg.cleaveKnockback ?? 4.2);

  let cleaveLanded = false;
  for (const enemy of fighter._getHostileTargets(opponent)) {
    const dx = enemy.x - fighter.x;
    const dy = enemy.y - fighter.y;
    if (Math.hypot(dx, dy) > reach + (enemy.r || 28)) continue;
    const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - aimAng), Math.cos(Math.atan2(dy, dx) - aimAng)));
    if (diff > halfArc) continue;

    if (step === 2) {
      fighter._applyMillionStabThrustHit(enemy, baseDmg, aimAng, dx, dy, activeCfg);
    } else {
      const { dealt } = fighter._dealBasicAttackDamage(enemy, baseDmg, {
        angle: aimAng,
        isMelee: true,
        knockbackForce: kbForce,
        isHeavy: step === 3,
        isFinisher: step === 3,
      });
      if (dealt > 0) {
        cleaveLanded = true;
        fighter._comboHitLanded = true;
      }
    }
  }
  return cleaveLanded;
}

/**
 * Executes the current stage of Dante's 4-hit Rebellion Greatsword combo.
 */
export function executeDanteRebellionCleave(fighter, opponent, cfg) {
  const activeCfg = cfg || CONFIG.dante || {};
  if (!isSkillEnabled(activeCfg.enableRebellionCombo, true)) return;
  if (opponent) fighter.aim(opponent);

  const { step, duration, hasNextStage } = _resolveComboStage(fighter, activeCfg);
  fighter.slashMoveType = MOVE_TYPES[step];
  fighter.slashSwingMaxTimer = duration;
  fighter.slashSwingTimer = duration;
  fighter.slashDir = (step === 1 || step === 3) ? -1 : 1;
  fighter._gunVisualTimer = 0;
  fighter._syncWeaponSwitch(activeCfg);
  if (step === 0) fighter._comboHitLanded = false;

  fighter._comboChainActive = hasNextStage;
  fighter._pendingGunSequence = false;
  fighter.swordCooldown = hasNextStage
    ? 0
    : Math.max(activeCfg.swordCooldown ?? 22, duration + (activeCfg.comboPostFinisherCooldownPad ?? 14));
  fighter.comboStep = hasNextStage ? (step + 1) % 4 : 0;

  const aimAng = fighter.gunAngle || 0;
  _setupStageAudioAndVfx(fighter, step, aimAng, activeCfg);
  const cleaveLanded = _applyRebellionArcHits(fighter, opponent, step, aimAng, activeCfg);

  if (!hasNextStage) {
    fighter._pendingGunSequence = Boolean(
      isSkillEnabled(activeCfg.enableFinisherGunSequence, true) &&
      fighter.weaponSwitchCooldown <= 0 &&
      (fighter._comboHitLanded || cleaveLanded)
    );
  }
  if (cleaveLanded && step !== 2) {
    triggerGlobalScreenShake?.(
      step === 3 ? (activeCfg.highTimeHitShake ?? 8.5) : (activeCfg.cleaveHitShake ?? 5.2),
      step === 3 ? (activeCfg.highTimeHitShakeFrames ?? 11) : (activeCfg.cleaveHitShakeFrames ?? 7)
    );
  }
}

// ─── Million Stab Flurry & Lunging Thrust Finisher ────────────────────────────

/**
 * Applies a single Million Stab rapid thrust tick hit with brief stun lock.
 */
export function applyDanteMillionStabThrustHit(fighter, enemy, rawDmg, aimAng, dx, dy, cfg) {
  const activeCfg = cfg || CONFIG.dante || {};
  const kb = activeCfg.millionStabThrustKnockback ?? 2.6;
  const stunFrames = activeCfg.millionStabThrustStunFrames ?? 12;
  const { dealt } = fighter._dealBasicAttackDamage(enemy, rawDmg, {
    angle: aimAng,
    isMelee: true,
    isKnockback: true,
    knockbackForce: kb,
    skipInterrupt: true,
  });
  if (dealt <= 0) return 0;

  fighter._millionStabHitLanded = true;
  fighter._comboHitLanded = true;
  triggerGlobalScreenShake?.(activeCfg.millionStabThrustShake ?? 3.8, activeCfg.millionStabThrustShakeFrames ?? 5);

  const kbAng = (dx !== 0 || dy !== 0) ? Math.atan2(dy, dx) : aimAng;
  if (stunFrames > 0) {
    if (typeof enemy.applyTimeStop === 'function') enemy.applyTimeStop(stunFrames);
    if (typeof enemy.applyHitStun === 'function') enemy.applyHitStun(stunFrames);
    else enemy.hitStunTimer = Math.max(enemy.hitStunTimer || 0, stunFrames);
  }
  if (typeof enemy.applyKnockback === 'function') {
    enemy.applyKnockback(Math.cos(kbAng) * kb, Math.sin(kbAng) * kb, stunFrames);
  } else {
    enemy.vx = (enemy.vx || 0) + Math.cos(kbAng) * kb;
    enemy.vy = (enemy.vy || 0) + Math.sin(kbAng) * kb;
  }

  const arena = (typeof state !== 'undefined' && state.arena) || { x: 45, y: 240, width: 450, height: 450 };
  const pad = (enemy.r || 28) + 4;
  if (typeof enemy.x === 'number' && typeof enemy.y === 'number') {
    enemy.x = Math.max(arena.x + pad, Math.min(arena.x + arena.width - pad, enemy.x + Math.cos(kbAng) * 3.2));
    enemy.y = Math.max(arena.y + pad, Math.min(arena.y + arena.height - pad, enemy.y + Math.sin(kbAng) * 3.2));
  }
  return dealt;
}

/**
 * Releases the lunging Thrust Finisher at the end of Million Stab's flurry wind-up.
 */
export function executeDanteMillionStabFinisher(fighter, opponent, cfg) {
  const activeCfg = cfg || CONFIG.dante || {};
  const aimAng = fighter.gunAngle || 0;
  const reach = (activeCfg.swordReach ?? 94) +
    (fighter.isDevilTrigger ? (activeCfg.dtSwordReachBonus ?? 14) : 0) +
    (activeCfg.millionStabReachBonus ?? 22) + 14;
  const lunge = activeCfg.millionStabFinisherLunge ?? 10.5;

  fighter.vx = Math.cos(aimAng) * lunge;
  fighter.vy = Math.sin(aimAng) * lunge;
  fighter._playSfx('heavyBlast');
  fighter._playSfx('swordSlash');
  fighter._maybePlayBasicVoice(['voFinisher', 'voSlash3'], activeCfg.finisherVoicelineChance ?? 0.75, activeCfg, activeCfg.basicVoiceCooldownFrames ?? 38);
  fighter._spawnRipple(fighter.x + Math.cos(aimAng) * 42, fighter.y + Math.sin(aimAng) * 42, 62, '#EF4444');
  fighter._spawnVfx('slashArc', fighter.x + Math.cos(aimAng) * 48, fighter.y + Math.sin(aimAng) * 48, aimAng, 110, 48, 12, 0.96);
  triggerGlobalScreenShake?.(7.5, 10);

  const finisherDmg = activeCfg.millionStabFinisherDamage ?? Math.max(12, Math.round((activeCfg.swordDamage ?? 21) * 0.85));
  const finisherKb = activeCfg.millionStabFinisherKnockback ?? 14.5;
  const finisherStun = activeCfg.millionStabFinisherStunFrames ?? 16;
  let finisherLanded = false;

  for (const enemy of fighter._getHostileTargets(opponent)) {
    const dx = enemy.x - fighter.x;
    const dy = enemy.y - fighter.y;
    if (Math.hypot(dx, dy) > reach + (enemy.r || 28)) continue;
    const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - aimAng), Math.cos(Math.atan2(dy, dx) - aimAng)));
    if (diff > 0.72) continue;

    const { dealt } = fighter._dealBasicAttackDamage(enemy, finisherDmg, {
      angle: aimAng,
      isMelee: true,
      isHeavy: true,
      isFinisher: true,
      isKnockback: true,
      knockbackForce: finisherKb,
    });
    if (dealt <= 0) continue;

    finisherLanded = true;
    fighter._comboHitLanded = true;
    const kbAng = (dx !== 0 || dy !== 0) ? Math.atan2(dy, dx) : aimAng;
    if (typeof enemy.clearTimeStop === 'function') enemy.clearTimeStop();
    else enemy.timeStopTimer = 0;
    if (finisherStun > 0) {
      if (typeof enemy.applyHitStun === 'function') enemy.applyHitStun(finisherStun);
      else enemy.hitStunTimer = Math.max(enemy.hitStunTimer || 0, finisherStun);
    }
    if (typeof enemy.applyKnockback === 'function') {
      enemy.applyKnockback(Math.cos(kbAng) * finisherKb, Math.sin(kbAng) * finisherKb, finisherStun);
    }
    enemy.vx = Math.cos(kbAng) * finisherKb * 0.7;
    enemy.vy = Math.sin(kbAng) * finisherKb * 0.7;
  }

  if (finisherLanded) {
    triggerGlobalScreenShake?.(activeCfg.millionStabFinisherShake ?? 9.5, activeCfg.millionStabFinisherShakeFrames ?? 12);
  }
}

/**
 * Advances active Million Stab flurry ticks and transitions cleanly into coil wind-up or miss cancel.
 */
export function stepDanteMillionStab(fighter, opponent, cfg) {
  if (!isSkillEnabled(cfg.enableRebellionCombo, true)) return;

  if (fighter._millionStabTimer > 0) {
    fighter._millionStabTimer--;
    if (fighter._millionStabTimer === 0) {
      if (!fighter._millionStabHitLanded) {
        fighter._millionStabFinisherDelay = 0;
        fighter.slashSwingTimer = 0;
        fighter._comboChainActive = false;
        fighter._pendingGunSequence = false;
        fighter.swordCooldown = cfg.swordCooldown ?? 22;
        return;
      }
      const windupFrames = Math.max(0, cfg.millionStabFinisherWindupFrames ?? 10);
      fighter._millionStabFinisherDelay = windupFrames;
      if (windupFrames === 0) fighter._executeMillionStabFinisher(opponent, cfg);
      return;
    }

    if (--fighter._millionStabTick <= 0) {
      fighter._millionStabTick = Math.max(1, cfg.millionStabTickInterval ?? 5);
      const aimAng = fighter.gunAngle || 0;
      const reach = (cfg.swordReach ?? 94) +
        (fighter.isDevilTrigger ? (cfg.dtSwordReachBonus ?? 14) : 0) +
        (cfg.millionStabReachBonus ?? 22);
      const tickDmg = cfg.millionStabTickDamage ?? Math.max(5, Math.round((cfg.swordDamage ?? 21) * 0.35));
      fighter._playSfx('swordSlash');
      triggerGlobalScreenShake?.(2.8, 4);

      for (const enemy of fighter._getHostileTargets(opponent)) {
        const dx = enemy.x - fighter.x;
        const dy = enemy.y - fighter.y;
        if (Math.hypot(dx, dy) > reach + (enemy.r || 28)) continue;
        const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - aimAng), Math.cos(Math.atan2(dy, dx) - aimAng)));
        if (diff <= 0.65) fighter._applyMillionStabThrustHit(enemy, tickDmg, aimAng, dx, dy, cfg);
      }
    }
    return;
  }

  if (fighter._millionStabFinisherDelay > 0) {
    fighter._millionStabFinisherDelay--;
    if (fighter._millionStabFinisherDelay === 0) fighter._executeMillionStabFinisher(opponent, cfg);
  }
}
