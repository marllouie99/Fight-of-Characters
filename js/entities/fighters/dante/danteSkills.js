// ─────────────────────────────────────────────────────────────────────────────
// DANTE MUGEN SKILLS, CHANNELING & PROJECTILE / SUMMON UPDATERS
// Round Trip, Drive, Doppelganger, Kalina Ann, Devil Trigger & Jackpot!
// ─────────────────────────────────────────────────────────────────────────────

import { isSkillEnabled } from '../../fighter.js';
import { CONFIG } from '../../../core/config.js';
import { state, spawnFloatingText, triggerGlobalScreenShake } from '../../../core/state.js';
import { spawnSparks, spawnImpactFlash } from '../../../graphics/particles/sparkEffect.js';
import { tryCastDanteSdtSkills } from './danteSdtSkills.js';

// ─── Skill Launchers ──────────────────────────────────────────────────────────

export function activateDanteDevilTrigger(fighter, opponent) {
  const cfg = CONFIG.dante || {};
  if (!isSkillEnabled(cfg.enableDevilTrigger, true)) return;
  fighter.interruptAttacks?.(false);
  fighter._gunVisualTimer = 0;
  if (opponent) fighter.aim(opponent);

  const txFrames = Math.max(24, cfg.dtTransformFrames ?? 54);
  fighter.isDevilTrigger = true;
  fighter.devilTriggerTimer = cfg.devilTriggerDuration ?? 660;
  fighter.devilTriggerCooldown = cfg.devilTriggerCooldown ?? 1450;
  fighter._jackpotUsedThisDT = false;
  fighter._dtTransformMaxTimer = txFrames;
  fighter._dtTransformTimer = txFrames;
  fighter._dtTransformBlastDone = false;
  fighter._dtTornado = null;
  fighter._syncWeaponSwitch?.(cfg);

  const mult = cfg.dtSpeedMultiplier ?? 1.32;
  fighter.speed = fighter.baseMoveSpeed * mult;
  fighter.moveSpeed = fighter.speed;
  fighter._playSfx('devilTrigger');
  triggerGlobalScreenShake?.(8, 10);
  spawnFloatingText(fighter.x, fighter.y - (fighter.r || 30) - 22, 'DEVIL TRIGGER!', '#EF4444');
}

export function startDanteJackpot(fighter, opponent) {
  const cfg = CONFIG.dante || {};
  if (!isSkillEnabled(cfg.enableDevilTrigger, true)) return;
  if (opponent) fighter.aim(opponent);

  fighter._jackpotUsedThisDT = true;
  fighter._jackpotLockedAngle = fighter.gunAngle || 0;
  fighter._jackpotTimer = cfg.jackpotChargeFrames ?? 18;
  fighter._gunVisualTimer = 60;
  fighter._syncWeaponSwitch(cfg);
  spawnFloatingText(fighter.x, fighter.y - (fighter.r || 30) - 22, 'JACKPOT!', '#FBBF24');
  fighter._playSfx('heavyBlast');
}

export function startDanteDoppelganger(fighter, opponent) {
  const cfg = CONFIG.dante || {};
  if (!isSkillEnabled(cfg.enableDoppelganger, true)) return;
  if (opponent) fighter.aim(opponent);

  const aimAng = fighter.gunAngle || 0;
  const spawnAng = aimAng + Math.PI * 0.5;
  fighter.doppelgangerCooldown = cfg.doppelgangerCooldown ?? 620;
  fighter._doppelganger = {
    x: fighter.x + Math.cos(spawnAng) * 44,
    y: fighter.y + Math.sin(spawnAng) * 44,
    angle: aimAng,
    life: cfg.doppelgangerDuration ?? 270,
    slashCooldown: 10,
  };
  fighter._playSfx('doppelganger');
  fighter._spawnRipple(fighter._doppelganger.x, fighter._doppelganger.y, 58, '#7F1D1D');
  spawnFloatingText(fighter.x, fighter.y - (fighter.r || 30) - 18, 'DOPPELGANGER', '#EF4444');
}

export function startDanteKalinaAnn(fighter, opponent) {
  const cfg = CONFIG.dante || {};
  if (!isSkillEnabled(cfg.enableKalinaAnn, true)) return;
  if (opponent) fighter.aim(opponent);

  fighter.kalinaCooldown = cfg.kalinaCooldown ?? 360;
  fighter._kalinaLockedAngle = fighter.gunAngle || 0;
  fighter._kalinaCastTimer = cfg.kalinaWindupFrames ?? 14;
  fighter._playSfx(fighter.isDevilTrigger ? 'demonCannon' : 'kalinaFire');
}

function _launchRoundTripBlade(fighter, rt, cfg) {
  const aimAng = fighter.gunAngle ?? rt.lockedAngle ?? 0;
  const spd = cfg.roundTripSpeed ?? 13.5;
  rt.phase = 'out';
  rt.x = fighter.x + Math.cos(aimAng) * 28;
  rt.y = fighter.y - (fighter.z || 0) + Math.sin(aimAng) * 28;
  rt.vx = Math.cos(aimAng) * spd;
  rt.vy = Math.sin(aimAng) * spd;
  rt.spinAngle = aimAng;
  rt.trail = [{ x: rt.x, y: rt.y, angle: rt.spinAngle }];

  fighter._roundTripThrowTimer = 12;
  fighter.vx = (fighter.vx || 0) * 0.4 + Math.cos(aimAng) * 2.6;
  fighter.vy = (fighter.vy || 0) * 0.4 + Math.sin(aimAng) * 2.6;
  fighter._playSfx('roundTrip');
  fighter._maybePlayBasicVoice(
    ['voSlash2', 'voSlash3', 'voFinisher'],
    cfg.roundTripVoicelineChance ?? 0.70,
    cfg,
    cfg.basicVoiceCooldownFrames ?? 38
  );
  fighter._spawnVfx('slashArc', fighter.x + Math.cos(aimAng) * 34, fighter.y + Math.sin(aimAng) * 34, aimAng, 108, 54, 12, 0.94);
  fighter._spawnRipple(fighter.x + Math.cos(aimAng) * 24, fighter.y + Math.sin(aimAng) * 24, 52, '#EF4444');
  triggerGlobalScreenShake?.(4.2, 6);
}

export function startDanteRoundTrip(fighter, opponent) {
  const cfg = CONFIG.dante || {};
  if (!isSkillEnabled(cfg.enableRoundTrip, true)) return;
  if (opponent) fighter.aim(opponent);

  const aimAng = fighter.gunAngle || 0;
  const chargeFrames = Math.max(0, cfg.roundTripChargeFrames ?? 16);
  const holdFrames = Math.max(24, cfg.roundTripHoldFrames ?? 96);
  fighter.roundTripCooldown = cfg.roundTripCooldown ?? 300;
  fighter._roundTripCatchTimer = 0;

  const rt = {
    x: fighter.x,
    y: fighter.y - (fighter.z || 0),
    vx: 0,
    vy: 0,
    lockedAngle: aimAng,
    chargeTimer: chargeFrames,
    chargeMax: Math.max(1, chargeFrames),
    spinAngle: aimAng,
    travelDist: 0,
    maxDist: cfg.roundTripMaxRange ?? 250,
    phase: chargeFrames > 0 ? 'charge' : 'out',
    holdTimer: holdFrames,
    holdMax: holdFrames,
    hitTick: 0,
    hitsLeft: cfg.roundTripMaxTicks ?? 12,
    latchedTarget: null,
    whirlFrame: 0,
    trail: [],
    returnHitSet: new Set(),
    safetyTimer: holdFrames + 120,
  };
  fighter._roundTripEntity = rt;

  if (chargeFrames > 0) {
    fighter._playSfx('swordSlash');
  } else {
    _launchRoundTripBlade(fighter, rt, cfg);
  }
  fighter._syncWeaponSwitch(cfg);
  spawnFloatingText(fighter.x, fighter.y - (fighter.r || 30) - 18, cfg.roundTripSkillName || 'SIDE SPECIAL', '#EF4444');
}

export function startDanteDrive(fighter, opponent) {
  const cfg = CONFIG.dante || {};
  if (!isSkillEnabled(cfg.enableDrive, true)) return;
  if (opponent) fighter.aim(opponent);

  fighter.driveCooldown = cfg.driveCooldown ?? 270;
  fighter._driveLockedAngle = fighter.gunAngle || 0;
  fighter._driveChargeTimer = cfg.driveChargeFrames ?? 12;
  fighter._playSfx('swordSlash');
}

// ─── AI Skill Selection & Committed Aim Channeling ────────────────────────────

export function tryCastDanteSkills(fighter, opponent, cfg, dist) {
  if (fighter.isDevilTrigger && tryCastDanteSdtSkills(fighter, opponent, cfg, dist)) {
    return true;
  }
  if (isSkillEnabled(cfg.enableDevilTrigger, true) && !fighter.isDevilTrigger && fighter.devilTriggerCooldown <= 0) {
    const hpRatio = fighter.hp / Math.max(1, fighter.maxHp);
    if (hpRatio <= (cfg.devilTriggerHpThreshold ?? 0.55) || Math.random() < 0.02) {
      fighter.activateDevilTrigger(opponent);
      return true;
    }
  }
  if (isSkillEnabled(cfg.enableDevilTrigger, true) && fighter.isDevilTrigger && !fighter._jackpotUsedThisDT && fighter.devilTriggerTimer <= (cfg.devilTriggerDuration ?? 660) - 65 && dist < 420) {
    fighter.startJackpot(opponent);
    return true;
  }
  if (isSkillEnabled(cfg.enableDoppelganger, true) && fighter.doppelgangerCooldown <= 0 && !fighter._doppelganger) {
    fighter.startDoppelganger(opponent);
    return true;
  }
  if (isSkillEnabled(cfg.enableKalinaAnn, true) && fighter.kalinaCooldown <= 0 && dist > 65) {
    fighter.startKalinaAnn(opponent);
    return true;
  }
  if (isSkillEnabled(cfg.enableRoundTrip, true) && fighter.roundTripCooldown <= 0 && !fighter._roundTripEntity && dist >= 40) {
    fighter.startRoundTrip(opponent);
    return true;
  }
  if (isSkillEnabled(cfg.enableDrive, true) && fighter.driveCooldown <= 0) {
    fighter.startDrive(opponent);
    return true;
  }
  return false;
}

function _releaseDriveWave(fighter, cfg) {
  const ang = fighter._driveLockedAngle;
  const spd = cfg.driveSpeed ?? 12.5;
  fighter._driveWaves.push({
    x: fighter.x + Math.cos(ang) * 26,
    y: fighter.y + Math.sin(ang) * 26,
    vx: Math.cos(ang) * spd,
    vy: Math.sin(ang) * spd,
    angle: ang,
    life: 48,
    hitSet: new Set(),
  });
  fighter._playSfx('heavyBlast');
}

function _releaseKalinaRockets(fighter, cfg) {
  const baseAng = fighter._kalinaLockedAngle;
  const spd = cfg.kalinaSpeed ?? 11.2;
  const offsets = fighter.isDevilTrigger ? [-0.12, 0.12] : [0];
  for (const off of offsets) {
    const ang = baseAng + off;
    fighter._rockets.push({
      x: fighter.x + Math.cos(ang) * 28,
      y: fighter.y + Math.sin(ang) * 28,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      angle: ang,
      life: 62,
    });
  }
  fighter.vx = -Math.cos(baseAng) * 5.2;
  fighter.vy = -Math.sin(baseAng) * 5.2;
}

function _fireJackpotBeam(fighter, opponent, cfg) {
  fighter._jackpotFireTimer = cfg.jackpotFireFrames ?? 42;
  fighter._playSfx('jackpotShot');
  triggerGlobalScreenShake?.(14, 18);

  const beamAng = fighter._jackpotLockedAngle;
  const beamLen = 620;
  const halfW = (cfg.jackpotWidth ?? 60) * 0.55;
  for (const enemy of fighter._getHostileTargets(opponent)) {
    const dx = enemy.x - fighter.x;
    const dy = enemy.y - fighter.y;
    const proj = dx * Math.cos(beamAng) + dy * Math.sin(beamAng);
    const perp = Math.abs(-dx * Math.sin(beamAng) + dy * Math.cos(beamAng));
    if (proj >= -10 && proj <= beamLen && perp <= halfW + (enemy.r || 28)) {
      fighter._dealDamage(enemy, cfg.jackpotDamage ?? 54, { angle: beamAng, knockback: 16, hitStun: 24, guardBreak: true });
    }
  }
  fighter.vx = -Math.cos(beamAng) * 7.5;
  fighter.vy = -Math.sin(beamAng) * 7.5;
}

export function processDanteChanneling(fighter, opponent, cfg) {
  const rt = fighter._roundTripEntity;
  if (rt && rt.phase === 'charge') {
    if (rt.chargeTimer > 3 && opponent && fighter._isHostile(opponent)) {
      rt.lockedAngle = Math.atan2((opponent.y - (opponent.z || 0)) - (fighter.y - (fighter.z || 0)), opponent.x - fighter.x);
    }
    fighter.gunAngle = rt.lockedAngle;
    rt.x = fighter.x;
    rt.y = fighter.y - (fighter.z || 0);
    if (--rt.chargeTimer <= 0) {
      _launchRoundTripBlade(fighter, rt, cfg);
    }
    return true;
  }
  if (fighter._driveChargeTimer > 0) {
    fighter.gunAngle = fighter._driveLockedAngle;
    if (--fighter._driveChargeTimer === 0) _releaseDriveWave(fighter, cfg);
    return true;
  }
  if (fighter._kalinaCastTimer > 0) {
    fighter.gunAngle = fighter._kalinaLockedAngle;
    if (--fighter._kalinaCastTimer === 0) _releaseKalinaRockets(fighter, cfg);
    return true;
  }
  if (fighter._jackpotTimer > 0) {
    fighter.gunAngle = fighter._jackpotLockedAngle;
    if (--fighter._jackpotTimer === 0) _fireJackpotBeam(fighter, opponent, cfg);
    return true;
  }
  if (fighter._jackpotFireTimer > 0) {
    fighter._jackpotFireTimer--;
    fighter.gunAngle = fighter._jackpotLockedAngle;
    return true;
  }
  return false;
}

// ─── Active Projectile & Summon Updaters ──────────────────────────────────────

function _detonateChargeShotSplash(fighter, b, primaryEnemy, hostiles, kb, hitStun, cfg) {
  const splashR = b.splashRadius || (cfg.dtChargeShotSplashRadius ?? 46);
  const splashDmg = Math.max(1, Math.round(b.damage * 0.55));
  for (let h = 0; h < hostiles.length; h++) {
    const other = hostiles[h];
    if (!other || other === primaryEnemy) continue;
    if (Math.hypot(other.x - b.x, other.y - b.y) > (other.r || 28) + splashR) continue;
    const sAng = Math.atan2(other.y - b.y, other.x - b.x);
    const { dealt } = fighter._dealBasicAttackDamage(other, splashDmg, {
      angle: sAng,
      isKnockback: true,
      knockbackForce: kb * 0.65,
      isProjectile: true,
      isGun: true,
      isChargeShot: true,
      preRolledCrit: { damage: splashDmg, isCrit: Boolean(b.isCrit) },
    });
    if (dealt > 0 && hitStun > 0 && typeof other.applyHitStun === 'function') {
      other.applyHitStun(hitStun);
    }
  }
  fighter._playSfx?.('explosion', 0.48);
  fighter._spawnRipple(b.x, b.y, b.isCrit ? 64 : 52, '#EF4444');
  spawnSparks(b.x, b.y, b.isCrit ? 12 : 8, 'crimson', '#FBBF24');
  triggerGlobalScreenShake?.(b.isCrit ? 5.0 : 3.4, 5);
}

function _updateBullets(fighter, hostiles, bounds, cfg) {
  for (let i = fighter._bullets.length - 1; i >= 0; i--) {
    const b = fighter._bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    b.life--;
    const hitPad = b.hitRadius ?? 8;
    let hit = false;
    for (let h = 0; h < hostiles.length; h++) {
      const enemy = hostiles[h];
      if (Math.hypot(enemy.x - b.x, enemy.y - b.y) > (enemy.r || 28) + hitPad) continue;
      const isCharge = Boolean(b.isChargeShot);
      const kb = isCharge
        ? (b.knockback ?? (cfg.dtChargeShotKnockback ?? 8.5)) + (b.isCrit ? 2.0 : 0)
        : (b.isCrit ? 5.5 : 3.5);
      const hitStun = isCharge ? (b.hitStun ?? (cfg.dtChargeShotHitStun ?? 8)) : 0;
      const { dealt } = fighter._dealBasicAttackDamage(enemy, b.damage, {
        angle: b.angle,
        isKnockback: isCharge,
        knockbackForce: kb,
        isProjectile: true,
        isGun: true,
        isChargeShot: isCharge,
        preRolledCrit: { damage: b.damage, isCrit: Boolean(b.isCrit) },
      });
      if (dealt > 0 && isCharge && hitStun > 0 && typeof enemy.applyHitStun === 'function') {
        enemy.applyHitStun(hitStun);
      }
      const boomSz = isCharge ? (b.isCrit ? 82 : 70) : (b.isCrit ? 48 : 38);
      fighter._spawnVfx('explosion', b.x, b.y, b.angle, boomSz, boomSz, isCharge ? 14 : 10, b.isCrit || isCharge ? 0.96 : 0.85);
      if (isCharge) {
        _detonateChargeShotSplash(fighter, b, enemy, hostiles, kb, hitStun, cfg);
      }
      hit = true;
      break;
    }
    const out = b.x < bounds.x || b.x > bounds.x + bounds.width || b.y < bounds.y || b.y > bounds.y + bounds.height;
    if (hit || b.life <= 0 || out) fighter._bullets.splice(i, 1);
  }
}

function _appendRoundTripTrail(rt) {
  if (!Array.isArray(rt.trail)) rt.trail = [];
  rt.trail.push({ x: rt.x, y: rt.y, angle: rt.spinAngle });
  if (rt.trail.length > 7) rt.trail.shift();
}

function _applyRoundTripHitEffects(enemy, cfg, hitPauseFrames) {
  const hpFrames = Math.max(0, hitPauseFrames ?? (cfg.roundTripHitPauseFrames ?? 4));
  if (hpFrames > 0) {
    if (typeof enemy.applyTimeStop === 'function') enemy.applyTimeStop(hpFrames);
    else enemy.basicAttackHitPauseTimer = Math.max(enemy.basicAttackHitPauseTimer || 0, hpFrames);
  }
  const slowFrames = Math.max(0, cfg.roundTripSlowFrames ?? 36);
  const slowMult = Math.max(0.1, Math.min(1.0, cfg.roundTripSlowMultiplier ?? 0.30));
  if (slowFrames > 0) {
    if (typeof enemy.applySlow === 'function') enemy.applySlow(slowFrames, slowMult);
    if ((enemy.slowTimer || 0) < slowFrames) enemy.slowTimer = slowFrames;
    enemy.slowMultiplier = Math.min(enemy.slowMultiplier ?? 1.0, slowMult);
  }
}

function _latchRoundTripToEnemy(fighter, rt, enemy, bounds, cfg) {
  rt.phase = 'spin';
  rt.latchedTarget = enemy;
  const bladeR = cfg.roundTripBladeRadius ?? 18;
  const minDist = (enemy.r || 28) + bladeR;
  const enemyY = enemy.y - (enemy.z || 0);
  let dx = rt.x - enemy.x;
  let dy = rt.y - enemyY;
  let d = Math.hypot(dx, dy);
  if (d < 0.001) {
    dx = -Math.cos(rt.lockedAngle || 0);
    dy = -Math.sin(rt.lockedAngle || 0);
    d = 1;
  }
  // Position blade right at physical contact surface rather than overlapping center
  const contactX = enemy.x + (dx / d) * minDist;
  const contactY = enemyY + (dy / d) * minDist;
  const pad = bladeR + 8;
  rt.anchorX = Math.max(bounds.x + pad, Math.min(bounds.x + bounds.width - pad, contactX));
  rt.anchorY = Math.max(bounds.y + pad, Math.min(bounds.y + bounds.height - pad, contactY));
  rt.x = rt.anchorX;
  rt.y = rt.anchorY;
  rt.vx = 0;
  rt.vy = 0;
  rt.hitTick = Math.max(2, cfg.roundTripWhirlTickInterval ?? 8);

  const launchDmg = cfg.roundTripLaunchDamage ?? 14;
  const dealt = fighter._dealDamage(enemy, launchDmg, { angle: rt.lockedAngle, knockback: 0, skipInterrupt: true });
  if (dealt > 0) {
    _applyRoundTripHitEffects(enemy, cfg, cfg.roundTripLaunchHitPauseFrames ?? 5);
  }
  fighter._playSfx('swordSlash');
  fighter._playSfx('heavyBlast');
  fighter.gunCooldown = Math.min(fighter.gunCooldown || 0, 8);
  fighter._syncWeaponSwitch(cfg);
  spawnSparks(rt.x, rt.y, 14, 'crimson', '#FBBF24');
  spawnImpactFlash(rt.x, rt.y, 32, '#EF4444');
  fighter._spawnRipple(rt.x, rt.y, 64, '#EF4444');
  triggerGlobalScreenShake?.(5.0, 7);
}

function _stepRoundTripOut(fighter, rt, hostiles, bounds, cfg) {
  _appendRoundTripTrail(rt);
  rt.x += rt.vx;
  rt.y += rt.vy;
  rt.travelDist += Math.hypot(rt.vx, rt.vy);

  const bladeR = cfg.roundTripBladeRadius ?? 18;
  for (const enemy of hostiles) {
    if (Math.hypot(enemy.x - rt.x, (enemy.y - (enemy.z || 0)) - rt.y) <= (enemy.r || 28) + bladeR + 12) {
      _latchRoundTripToEnemy(fighter, rt, enemy, bounds, cfg);
      return;
    }
  }

  const wallHit =
    rt.travelDist >= rt.maxDist ||
    rt.x < bounds.x + 15 || rt.x > bounds.x + bounds.width - 15 ||
    rt.y < bounds.y + 15 || rt.y > bounds.y + bounds.height - 15;
  if (wallHit) {
    rt.phase = 'spin';
    rt.anchorX = rt.x;
    rt.anchorY = rt.y;
    rt.holdTimer = Math.min(rt.holdTimer, Math.max(14, Math.round((cfg.roundTripHoldFrames ?? 96) * 0.35)));
    rt.vx = 0;
    rt.vy = 0;
    fighter.gunCooldown = Math.min(fighter.gunCooldown || 0, 8);
    fighter._syncWeaponSwitch(cfg);
  }
}

function _resolveRoundTripBladeCollision(rt, hostiles, bounds, bladeR) {
  const dirAng = rt.lockedAngle || 0;
  const fwdX = Math.cos(dirAng);
  const fwdY = Math.sin(dirAng);

  for (const enemy of hostiles) {
    const ax = rt.anchorX ?? rt.x;
    const ay = rt.anchorY ?? rt.y;
    const dx = enemy.x - ax;
    const dy = enemy.y - ay;
    const dist = Math.hypot(dx, dy);
    const minDist = (enemy.r || 28) + bladeR;
    if (dist >= minDist) continue;

    // Push linearly along forward throw direction (zero sideways orbital/rotational spin around blade)
    const overlap = minDist - dist;
    const pad = (enemy.r || 28) + 4;
    if (!enemy.isPullImmune) {
      enemy.x = Math.max(bounds.x + pad, Math.min(bounds.x + bounds.width - pad, enemy.x + fwdX * overlap));
      enemy.y = Math.max(bounds.y + pad, Math.min(bounds.y + bounds.height - pad, enemy.y + fwdY * overlap));
      enemy.vx = (enemy.vx || 0) * 0.65;
      enemy.vy = (enemy.vy || 0) * 0.65;
    }

    const remDist = Math.hypot(enemy.x - ax, enemy.y - ay);
    if (remDist < minDist) {
      const remOverlap = minDist - remDist;
      const bPad = bladeR + 8;
      rt.anchorX = Math.max(bounds.x + bPad, Math.min(bounds.x + bounds.width - bPad, ax - fwdX * remOverlap));
      rt.anchorY = Math.max(bounds.y + bPad, Math.min(bounds.y + bounds.height - bPad, ay - fwdY * remOverlap));
    }
  }
}

function _stepRoundTripSpin(fighter, rt, hostiles, bounds, cfg) {
  const bladeR = cfg.roundTripBladeRadius ?? 18;
  const whirlRadius = Math.max(bladeR + 24, cfg.roundTripWhirlRadius ?? 56);
  const driftSpeed = rt.latchedTarget ? (cfg.roundTripWhirlDriftSpeed ?? 1.35) : 0;
  const tickInterval = Math.max(4, cfg.roundTripWhirlTickInterval ?? 8);

  if (rt.anchorX === undefined || rt.anchorY === undefined) {
    rt.anchorX = rt.x;
    rt.anchorY = rt.y;
  }

  // Once landed on a target, slowly advance forward along throw direction while grinding & colliding
  if (driftSpeed > 0) {
    const dirAng = rt.lockedAngle || 0;
    const bPad = bladeR + 8;
    rt.anchorX = Math.max(bounds.x + bPad, Math.min(bounds.x + bounds.width - bPad, rt.anchorX + Math.cos(dirAng) * driftSpeed));
    rt.anchorY = Math.max(bounds.y + bPad, Math.min(bounds.y + bounds.height - bPad, rt.anchorY + Math.sin(dirAng) * driftSpeed));
  }

  _resolveRoundTripBladeCollision(rt, hostiles, bounds, bladeR);
  rt.x = rt.anchorX + Math.cos(rt.spinAngle * 0.55) * 2.0;
  rt.y = rt.anchorY + Math.sin(rt.spinAngle * 0.55) * 2.0;

  rt.whirlFrame = ((rt.whirlFrame || 0) + 1) % 16;
  rt.holdTimer--;

  if (--rt.hitTick <= 0 && rt.hitsLeft > 0) {
    let struckAny = false;
    for (const enemy of hostiles) {
      if (Math.hypot(enemy.x - rt.x, enemy.y - rt.y) > (enemy.r || 28) + whirlRadius) continue;
      const dealt = fighter._dealDamage(enemy, cfg.roundTripDamage ?? 9, { knockback: 0, skipInterrupt: true });
      if (dealt > 0) {
        struckAny = true;
        _applyRoundTripHitEffects(enemy, cfg, cfg.roundTripHitPauseFrames ?? 4);
      }
    }
    if (struckAny) {
      fighter._playSfx('swordSlash');
      spawnSparks(rt.x, rt.y, 9, 'crimson', '#FBBF24');
      triggerGlobalScreenShake?.(2.2, 2);
      if (Math.random() < 0.55) {
        fighter._spawnVfx('slashArc', rt.x, rt.y, rt.spinAngle, 90, 48, 8, 0.86, Math.random() > 0.5);
      }
    }
    rt.hitTick = tickInterval;
    rt.hitsLeft--;
  }

  if (rt.holdTimer <= 0 || hostiles.length === 0) {
    rt.latchedTarget = null;
    rt.phase = 'return';
    rt.trail = [{ x: rt.x, y: rt.y, angle: rt.spinAngle }];
    fighter._spawnRipple(rt.x, rt.y, 54, '#EF4444');
  }
}

function _stepRoundTripReturn(fighter, rt, hostiles, cfg) {
  if (rt.holdTimer > 0 && hostiles.length > 0) {
    rt.phase = 'spin';
    return;
  }
  _appendRoundTripTrail(rt);
  const targetY = fighter.y - (fighter.z || 0);
  const retAng = Math.atan2(targetY - rt.y, fighter.x - rt.x);
  const spd = cfg.roundTripReturnSpeed ?? Math.max(14, (cfg.roundTripSpeed ?? 13.5) * 1.15);
  rt.x += Math.cos(retAng) * spd;
  rt.y += Math.sin(retAng) * spd;

  for (const enemy of hostiles) {
    if (!rt.returnHitSet.has(enemy) && Math.hypot(enemy.x - rt.x, enemy.y - rt.y) <= (enemy.r || 28) + 34) {
      rt.returnHitSet.add(enemy);
      fighter._dealDamage(enemy, cfg.roundTripDamage ?? 9, { angle: retAng, knockback: 3.5 });
      spawnSparks(enemy.x, enemy.y, 6, 'crimson', '#EF4444');
    }
  }

  if (Math.hypot(fighter.x - rt.x, targetY - rt.y) <= (fighter.r || 30) + 20 || --rt.safetyTimer <= 0) {
    fighter._roundTripEntity = null;
    fighter.roundTripCooldown = cfg.roundTripCooldown ?? 300;
    fighter._gunVisualTimer = 0;
    fighter._gunBurstQueue = 0;
    fighter._roundTripCatchTimer = 10;
    if (!fighter._syncWeaponSwitch(cfg)) {
      fighter._playSfx('weaponSwitch');
    }
    spawnSparks(fighter.x, targetY, 8, 'crimson', '#FBBF24');
  }
}

function _updateRoundTrip(fighter, hostiles, bounds, cfg) {
  const rt = fighter._roundTripEntity;
  if (!rt || rt.phase === 'charge') return;
  if (fighter.hp <= 0 || fighter.isDead || fighter.dead) {
    fighter._roundTripEntity = null;
    return;
  }

  rt.spinAngle += rt.phase === 'spin' ? 0.72 : 0.56;
  if (rt.phase === 'out') {
    _stepRoundTripOut(fighter, rt, hostiles, bounds, cfg);
  } else if (rt.phase === 'spin') {
    _stepRoundTripSpin(fighter, rt, hostiles, bounds, cfg);
  } else {
    _stepRoundTripReturn(fighter, rt, hostiles, cfg);
  }
}

function _updateDriveWaves(fighter, hostiles, bounds, cfg) {
  for (let i = fighter._driveWaves.length - 1; i >= 0; i--) {
    const w = fighter._driveWaves[i];
    w.x += w.vx;
    w.y += w.vy;
    w.life--;
    for (const enemy of hostiles) {
      if (!w.hitSet.has(enemy) && Math.hypot(enemy.x - w.x, enemy.y - w.y) <= (enemy.r || 28) + 46) {
        w.hitSet.add(enemy);
        fighter._dealDamage(enemy, cfg.driveDamage ?? 30, { angle: w.angle, knockback: 11, hitStun: 18 });
        fighter._spawnVfx('slashArc', enemy.x, enemy.y, w.angle, 94, 62, 12, 0.92);
      }
    }
    const out = w.x < bounds.x - 40 || w.x > bounds.x + bounds.width + 40 || w.y < bounds.y - 40 || w.y > bounds.y + bounds.height + 40;
    if (w.life <= 0 || out) fighter._driveWaves.splice(i, 1);
  }
}

function _updateRockets(fighter, hostiles, bounds, cfg) {
  for (let i = fighter._rockets.length - 1; i >= 0; i--) {
    const rkt = fighter._rockets[i];
    rkt.x += rkt.vx;
    rkt.y += rkt.vy;
    rkt.life--;
    const wallHit = rkt.life <= 0 || rkt.x < bounds.x + 10 || rkt.x > bounds.x + bounds.width - 10 || rkt.y < bounds.y + 10 || rkt.y > bounds.y + bounds.height - 10;
    const directHit = !wallHit && hostiles.some((e) => Math.hypot(e.x - rkt.x, e.y - rkt.y) <= (e.r || 28) + 20);
    if (!wallHit && !directHit) continue;

    const boomR = cfg.kalinaExplosionRadius ?? 86;
    fighter._playSfx('explosion');
    triggerGlobalScreenShake?.(8, 10);
    fighter._spawnVfx('explosion', rkt.x, rkt.y, 0, boomR * 1.8, boomR * 1.8, 22, 0.96);
    fighter._spawnRipple(rkt.x, rkt.y, boomR * 1.15, '#EF4444');
    for (const enemy of hostiles) {
      if (Math.hypot(enemy.x - rkt.x, enemy.y - rkt.y) <= boomR + (enemy.r || 28)) {
        const kAng = Math.atan2(enemy.y - rkt.y, enemy.x - rkt.x);
        fighter._dealDamage(enemy, cfg.kalinaRocketDamage ?? 36, { angle: kAng, knockback: 12, guardBreak: true, hitStun: 18 });
      }
    }
    fighter._rockets.splice(i, 1);
  }
}

function _updateDoppelganger(fighter, hostiles, cfg) {
  const dg = fighter._doppelganger;
  if (!dg) return;

  dg.life--;
  if (dg.slashCooldown > 0) dg.slashCooldown--;
  const target = hostiles[0];
  if (target) {
    const dx = target.x - dg.x;
    const dy = target.y - dg.y;
    const dist = Math.hypot(dx, dy);
    dg.angle = Math.atan2(dy, dx);
    if (dist > 56) {
      const spd = cfg.doppelgangerSpeed ?? 5.8;
      dg.x += Math.cos(dg.angle) * spd;
      dg.y += Math.sin(dg.angle) * spd;
    }
    if (dist <= 92 && dg.slashCooldown <= 0) {
      dg.slashCooldown = 26;
      fighter._playSfx('swordSlash');
      triggerGlobalScreenShake?.(2.8, 4);
      fighter._spawnVfx('slashArc', (dg.x + target.x) * 0.5, (dg.y + target.y) * 0.5, dg.angle, 92, 60, 12, 0.85, Math.random() > 0.5);
      fighter._dealDamage(target, cfg.doppelgangerDamage ?? 14, { angle: dg.angle, knockback: 5 });
    }
  }
  if (dg.life <= 0) {
    fighter._spawnRipple(dg.x, dg.y, 48, '#7F1D1D');
    fighter._doppelganger = null;
  }
}

function _updateDtTornado(fighter, hostiles, cfg) {
  const tor = fighter._dtTornado;
  if (!tor) return;

  tor.life--;
  tor.x = fighter.x;
  tor.y = fighter.y;
  if (--tor.tick <= 0) {
    tor.tick = 14;
    for (const enemy of hostiles) {
      if (Math.hypot(enemy.x - tor.x, enemy.y - tor.y) > tor.radius + (enemy.r || 28)) continue;
      const pull = Math.atan2(tor.y - enemy.y, tor.x - enemy.x);
      enemy.vx = (enemy.vx || 0) * 0.4 + Math.cos(pull) * 4.5;
      enemy.vy = (enemy.vy || 0) * 0.4 + Math.sin(pull) * 4.5;
      fighter._dealDamage(enemy, cfg.dtTornadoDamage ?? 12, { knockback: 2.5, guardBreak: true });
    }
  }
  if (tor.life <= 0) fighter._dtTornado = null;
}

/**
 * Advances Dante's FINALSMASH2.webp Devil Form transformation (rune chest-pierce -> volcanic blast -> winged ascension).
 */
export function stepDanteTransformSequence(fighter, hostiles, cfg) {
  if (!(fighter._dtTransformTimer > 0)) return false;
  const maxT = Math.max(1, fighter._dtTransformMaxTimer || cfg.dtTransformFrames || 54);
  fighter._dtTransformTimer--;
  const p = 1 - Math.max(0, fighter._dtTransformTimer) / maxT;

  if (fighter._highTimeHopTimer <= 0) {
    fighter.z = Math.max(0, Math.sin(Math.min(1, p / 0.92) * Math.PI) * 24);
  }
  if (!(fighter._jackpotTimer > 0) && !(fighter._jackpotFireTimer > 0)) {
    fighter.vx = (fighter.vx || 0) * 0.78;
    fighter.vy = (fighter.vy || 0) * 0.78;
  }

  // Volcanic breakout dome explosion at F39 (~36% progress)
  if (p >= 0.36 && !fighter._dtTransformBlastDone) {
    fighter._dtTransformBlastDone = true;
    fighter._playSfx('explosion');
    fighter._playSfx('heavyBlast', 0.85);
    triggerGlobalScreenShake?.(12, 16);
    fighter._spawnRipple(fighter.x, fighter.y, 136, '#EF4444');
    spawnSparks(fighter.x, fighter.y, 24, 'crimson', '#FBBF24');
    spawnImpactFlash(fighter.x, fighter.y, 46, '#EF4444');

    const burstR = cfg.dtTransformBurstRadius ?? 135;
    const burstDmg = cfg.dtTransformBurstDamage ?? 16;
    const burstKb = cfg.dtTransformBurstKnockback ?? 14.0;
    for (const enemy of hostiles) {
      const dx = enemy.x - fighter.x;
      const dy = enemy.y - fighter.y;
      if (Math.hypot(dx, dy) > burstR + (enemy.r || 28)) continue;
      const kbAng = (dx !== 0 || dy !== 0) ? Math.atan2(dy, dx) : (fighter.gunAngle || 0);
      const dealt = fighter._dealDamage(enemy, burstDmg, { angle: kbAng, isKnockback: true, knockbackForce: burstKb, guardBreak: true });
      if (dealt > 0 && typeof enemy.applyHitStun === 'function') enemy.applyHitStun(14);
    }
  }

  if (fighter._dtTransformTimer <= 0) {
    fighter._dtTransformTimer = 0;
    if (fighter._highTimeHopTimer <= 0) fighter.z = 0;
  }
  return true;
}

/**
 * Updates all Dante projectiles, summons, and active hazards before freeze checks (Rule 25).
 */
export function updateDanteProjectilesAndSummons(fighter, opponent, arena) {
  const cfg = CONFIG.dante || {};
  const hostiles = fighter._getHostileTargets(opponent);
  const bounds = arena || state.arena || { x: 45, y: 240, width: 450, height: 450 };

  _updateBullets(fighter, hostiles, bounds, cfg);
  _updateRoundTrip(fighter, hostiles, bounds, cfg);
  _updateDriveWaves(fighter, hostiles, bounds, cfg);
  _updateRockets(fighter, hostiles, bounds, cfg);
  _updateDoppelganger(fighter, hostiles, cfg);
  _updateDtTornado(fighter, hostiles, cfg);
}
