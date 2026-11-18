// ─────────────────────────────────────────────────────────────────────────────
// DANTE SIN DEVIL TRIGGER (SDT) EXCLUSIVE SKILL SUITE
// SKILL 1: SDT Combo (wide sword combo -> 360-degree AOE sweep)
// SKILL 2: Sin Stinger (pass-through charge in a whirlwind of summoned swords)
// SKILL 3: Ombra (rapid barrage of high-damage demonic fireballs)
// SKILL 4: Judgment (screen-clearing flurry of slashes -> massive explosion, ends SDT)
// ─────────────────────────────────────────────────────────────────────────────

import { isSkillEnabled } from '../../fighter.js';
import { CONFIG } from '../../../core/config.js';
import { state, spawnFloatingText, triggerGlobalScreenShake } from '../../../core/state.js';
import { spawnSparks, spawnImpactFlash } from '../../../graphics/particles/sparkEffect.js';

function _applyStunAndKb(enemy, fighter, dmg, angle, kb, hitStun, opts = {}) {
  const dealt = fighter._dealDamage(enemy, dmg, {
    angle,
    isKnockback: kb > 0,
    knockbackForce: kb,
    guardBreak: true,
    ...opts,
  });
  if (dealt > 0 && hitStun > 0 && typeof enemy.applyHitStun === 'function') {
    enemy.applyHitStun(hitStun);
  }
  return dealt;
}

function _clearConflictingSdtActions(fighter, cfg, syncSword = true) {
  fighter.slashSwingTimer = 0;
  fighter._comboChainActive = false;
  fighter._millionStabTimer = 0;
  fighter._millionStabFinisherDelay = 0;
  fighter._gunSequenceTimer = 0;
  fighter._gunBurstQueue = 0;
  if (syncSword) {
    fighter._gunVisualTimer = 0;
    fighter._syncWeaponSwitch?.(cfg);
  }
}

// ─── Skill 1: SDT Combo (Wide Cleaves + 360° AOE Sweep Finale) ────────────────

export function startDanteSdtCombo(fighter, opponent) {
  const cfg = CONFIG.dante || {};
  if (!fighter.isDevilTrigger || !isSkillEnabled(cfg.enableSdtCombo, true)) return false;
  _clearConflictingSdtActions(fighter, cfg, true);
  fighter._sinStingerState = null;
  fighter._ombraState = null;
  if (opponent) fighter.aim(opponent);

  fighter.sdtComboCooldown = cfg.sdtComboCooldown ?? 180;
  fighter._sdtComboState = {
    active: true,
    stage: 0,
    timer: 32,
    maxTimer: 32,
    stage1Done: false,
    stage2Done: false,
    angle: fighter.gunAngle || 0,
  };
  _executeSdtComboStage(fighter, fighter._getHostileTargets(opponent), 0, cfg);
  spawnFloatingText(fighter.x, fighter.y - (fighter.r || 30) - 18, cfg.sdtComboSkillName || 'SDT COMBO', '#EF4444');
  return true;
}

function _executeSdtComboStage(fighter, hostiles, stage, cfg) {
  const ang = fighter.gunAngle || 0;
  const isSweep360 = stage === 2;
  const reach = isSweep360 ? (cfg.sdtComboSweepRadius ?? 158) : (cfg.sdtComboReach ?? 132);
  const dmg = isSweep360 ? (cfg.sdtComboSweepDamage ?? 36) : Math.round((cfg.sdtComboDamage ?? 24) * (stage === 1 ? 1.12 : 1.0));
  const kb = isSweep360 ? (cfg.sdtComboSweepKnockback ?? 16.0) : (cfg.sdtComboKnockback ?? 5.5);
  const stun = isSweep360 ? 16 : 10;

  fighter._playSfx('swordSlash');
  if (isSweep360) {
    fighter._playSfx('heavyBlast', 0.85);
    fighter._spawnRipple(fighter.x, fighter.y, reach * 1.02, '#EF4444');
    triggerGlobalScreenShake?.(9.5, 11);
  } else {
    fighter.vx = (fighter.vx || 0) * 0.35 + Math.cos(ang) * 6.5;
    fighter.vy = (fighter.vy || 0) * 0.35 + Math.sin(ang) * 6.5;
    triggerGlobalScreenShake?.(4.5, 6);
  }

  for (const enemy of hostiles) {
    const dx = enemy.x - fighter.x;
    const dy = enemy.y - fighter.y;
    if (Math.hypot(dx, dy) > reach + (enemy.r || 28)) continue;
    if (!isSweep360) {
      const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - ang), Math.cos(Math.atan2(dy, dx) - ang)));
      if (diff > Math.PI * 0.56) continue;
    }
    const kbAng = (dx !== 0 || dy !== 0) ? Math.atan2(dy, dx) : ang;
    _applyStunAndKb(enemy, fighter, dmg, kbAng, kb, stun, { isMelee: true, isHeavy: isSweep360 });
    spawnSparks(enemy.x, enemy.y, isSweep360 ? 14 : 8, 'crimson', '#FBBF24');
  }
}

export function stepDanteSdtCombo(fighter, hostiles, opponent, cfg) {
  const st = fighter._sdtComboState;
  if (!st || !st.active) return false;
  st.timer--;
  if (opponent && fighter._isHostile(opponent)) {
    fighter.aim(opponent);
    st.angle = fighter.gunAngle || st.angle;
  }
  if (st.timer === 21 && !st.stage1Done) {
    st.stage = 1;
    st.stage1Done = true;
    _executeSdtComboStage(fighter, hostiles, 1, cfg);
  } else if (st.timer === 10 && !st.stage2Done) {
    st.stage = 2;
    st.stage2Done = true;
    _executeSdtComboStage(fighter, hostiles, 2, cfg);
  }
  if (st.timer <= 0) fighter._sdtComboState = null;
  return true;
}

// ─── Skill 2: Sin Stinger (Pass-Through Charge + Whirlwind of Summoned Swords) ─

export function startDanteSinStinger(fighter, opponent) {
  const cfg = CONFIG.dante || {};
  if (!fighter.isDevilTrigger || !isSkillEnabled(cfg.enableSinStinger, true)) return false;
  _clearConflictingSdtActions(fighter, cfg, true);
  fighter._sdtComboState = null;
  fighter._ombraState = null;
  if (opponent) fighter.aim(opponent);

  const ang = fighter.gunAngle || 0;
  const dur = Math.max(10, cfg.sinStingerDuration ?? 20);
  const fwd = (fighter.r || 30) * 1.85;
  fighter.sinStingerCooldown = cfg.sinStingerCooldown ?? 240;
  fighter._sinStingerState = {
    active: true,
    timer: dur,
    maxTimer: dur,
    angle: ang,
    spinAngle: ang,
    hitTick: 0,
    swordCount: Math.max(4, cfg.sinStingerSwordCount ?? 6),
  };
  fighter.trickPhaseTimer = 2;
  fighter._playSfx('heavyBlast');
  fighter._playSfx('swordSlash');
  fighter._spawnVfx(
    'dtStingerThrust',
    fighter.x + Math.cos(ang) * fwd,
    fighter.y + Math.sin(ang) * fwd,
    ang,
    172,
    132,
    dur,
    0.96,
    false,
    { behindBody: true, followFighter: true, forwardOffset: fwd }
  );
  fighter._spawnRipple(fighter.x, fighter.y, 82, '#EF4444');
  spawnFloatingText(fighter.x, fighter.y - (fighter.r || 30) - 18, cfg.sinStingerSkillName || 'SIN STINGER', '#EF4444');
  return true;
}

export function stepDanteSinStinger(fighter, hostiles, bounds, cfg) {
  const st = fighter._sinStingerState;
  if (!st || !st.active) return false;

  st.timer--;
  st.spinAngle += 0.38;
  fighter.trickPhaseTimer = 2;
  fighter.gunAngle = st.angle;
  fighter.angle = st.angle;

  const spd = cfg.sinStingerSpeed ?? 19.5;
  fighter.vx = Math.cos(st.angle) * spd;
  fighter.vy = Math.sin(st.angle) * spd;

  const hitR = cfg.sinStingerHitRadius ?? 88;
  const tickDmg = cfg.sinStingerTickDamage ?? 12;
  const kb = cfg.sinStingerKnockback ?? 4.5;
  if (--st.hitTick <= 0) {
    st.hitTick = 4;
    for (const enemy of hostiles) {
      if (Math.hypot(enemy.x - fighter.x, enemy.y - fighter.y) > hitR + (enemy.r || 28)) continue;
      _applyStunAndKb(enemy, fighter, tickDmg, st.angle, kb, 8, { isMelee: true });
      spawnSparks(enemy.x, enemy.y, 7, 'crimson', '#FBBF24');
    }
    triggerGlobalScreenShake?.(3.2, 4);
  }

  // Bounce cleanly if reaching arena wall without cutting short
  const pad = (fighter.r || 30) + 6;
  if (fighter.x <= bounds.x + pad || fighter.x >= bounds.x + bounds.width - pad) {
    st.angle = Math.PI - st.angle;
  }
  if (fighter.y <= bounds.y + pad || fighter.y >= bounds.y + bounds.height - pad) {
    st.angle = -st.angle;
  }

  if (st.timer <= 0) {
    fighter._sinStingerState = null;
    fighter.trickPhaseTimer = 0;
    fighter.vx *= 0.45;
    fighter.vy *= 0.45;
  }
  return true;
}

// ─── Skill 3: Ombra (Rapid Barrage of High-Damage Demonic Fireballs) ──────────

export function startDanteOmbra(fighter, opponent) {
  const cfg = CONFIG.dante || {};
  if (!fighter.isDevilTrigger || !isSkillEnabled(cfg.enableOmbra, true)) return false;
  _clearConflictingSdtActions(fighter, cfg, false);
  if (opponent) fighter.aim(opponent);

  fighter.ombraCooldown = cfg.ombraCooldown ?? 210;
  fighter._ombraState = {
    active: true,
    shotsLeft: Math.max(2, cfg.ombraCount ?? 6),
    tick: 0,
    shotIdx: 0,
  };
  spawnFloatingText(fighter.x, fighter.y - (fighter.r || 30) - 18, cfg.ombraSkillName || 'OMBRA', '#F97316');
  return true;
}

function _spawnSingleOmbraFireball(fighter, opponent, shotIdx, totalShots, cfg) {
  if (opponent && fighter._isHostile(opponent)) fighter.aim(opponent);
  const baseAng = fighter.gunAngle || 0;
  const fan = ((shotIdx % 3) - 1) * 0.11;
  const ang = baseAng + fan;
  const spd = cfg.ombraSpeed ?? 14.5;
  const r = fighter.r || 30;

  fighter._ombraFireballs.push({
    x: fighter.x + Math.cos(ang) * (r + 12),
    y: fighter.y - (fighter.z || 0) + Math.sin(ang) * (r + 12),
    vx: Math.cos(ang) * spd,
    vy: Math.sin(ang) * spd,
    angle: ang,
    damage: cfg.ombraDamage ?? 24,
    radius: cfg.ombraRadius ?? 15,
    explosionRadius: cfg.ombraExplosionRadius ?? 56,
    knockback: cfg.ombraKnockback ?? 11.0,
    life: 52,
  });
  fighter._playSfx('heavyBlast', 0.48);
  fighter._spawnRipple(fighter.x + Math.cos(ang) * r, fighter.y + Math.sin(ang) * r, 38, '#F97316');
}

export function stepDanteOmbra(fighter, hostiles, opponent, cfg) {
  const st = fighter._ombraState;
  if (!st || !st.active) return false;

  if (--st.tick <= 0 && st.shotsLeft > 0) {
    const target = (opponent && fighter._isHostile(opponent)) ? opponent : hostiles[0];
    _spawnSingleOmbraFireball(fighter, target, st.shotIdx++, cfg.ombraCount ?? 6, cfg);
    st.shotsLeft--;
    st.tick = Math.max(2, cfg.ombraFireInterval ?? 4);
  }
  if (st.shotsLeft <= 0) fighter._ombraState = null;
  return Boolean(fighter._ombraState);
}

export function updateDanteOmbraFireballs(fighter, hostiles, bounds, cfg) {
  const list = fighter._ombraFireballs;
  if (!Array.isArray(list) || list.length === 0) return;

  for (let i = list.length - 1; i >= 0; i--) {
    const fb = list[i];
    fb.x += fb.vx;
    fb.y += fb.vy;
    fb.life--;

    const directHit = hostiles.some(e => Math.hypot(e.x - fb.x, e.y - fb.y) <= (e.r || 28) + fb.radius);
    const out = fb.life <= 0 || fb.x < bounds.x || fb.x > bounds.x + bounds.width || fb.y < bounds.y || fb.y > bounds.y + bounds.height;
    if (!directHit && !out) continue;

    if (directHit || fb.life <= 0) {
      fighter._playSfx('explosion', 0.62);
      fighter._spawnVfx('explosion', fb.x, fb.y, fb.angle, fb.explosionRadius * 1.75, fb.explosionRadius * 1.75, 16, 0.96);
      fighter._spawnRipple(fb.x, fb.y, fb.explosionRadius * 1.15, '#EF4444');
      spawnSparks(fb.x, fb.y, 12, 'crimson', '#FBBF24');
      triggerGlobalScreenShake?.(5.2, 6);

      for (const enemy of hostiles) {
        if (Math.hypot(enemy.x - fb.x, enemy.y - fb.y) > (enemy.r || 28) + fb.explosionRadius) continue;
        const kAng = Math.atan2(enemy.y - fb.y, enemy.x - fb.x);
        _applyStunAndKb(enemy, fighter, fb.damage, kAng, fb.knockback, 12, { isProjectile: true, isExplosion: true });
      }
    }
    list.splice(i, 1);
  }
}

// ─── Skill 4: Judgment (Screen-Clearing Slashes -> Massive Explosion, Ends SDT) ─

export function startDanteJudgment(fighter, opponent) {
  const cfg = CONFIG.dante || {};
  if (!fighter.isDevilTrigger || !isSkillEnabled(cfg.enableJudgment, true)) return false;
  _clearConflictingSdtActions(fighter, cfg, true);
  if (opponent) fighter.aim(opponent);

  fighter.judgmentCooldown = cfg.judgmentCooldown ?? 420;
  fighter._sdtComboState = null;
  fighter._sinStingerState = null;
  fighter._ombraState = null;
  fighter._dtTransformTimer = 0;

  const flurry = Math.max(16, cfg.judgmentFlurryFrames ?? 36);
  const finisher = Math.max(10, cfg.judgmentFinisherFrames ?? 18);
  fighter._judgmentState = {
    active: true,
    phase: 'flurry',
    timer: flurry,
    flurryMax: flurry,
    finisherMax: finisher,
    tick: 1,
    detonated: false,
    slashes: [],
  };
  fighter._playSfx('devilTrigger');
  fighter._spawnRipple(fighter.x, fighter.y, 120, '#EF4444');
  spawnFloatingText(fighter.x, fighter.y - (fighter.r || 30) - 24, cfg.judgmentSkillName || 'JUDGMENT!', '#FBBF24');
  return true;
}

function _endDevilTriggerState(fighter) {
  fighter.isDevilTrigger = false;
  fighter.devilTriggerTimer = 0;
  fighter._dtTransformTimer = 0;
  fighter.speed = fighter.baseMoveSpeed;
  fighter.moveSpeed = fighter.baseMoveSpeed;
  if (fighter._highTimeHopTimer <= 0) fighter.z = 0;
}

function _detonateJudgment(fighter, hostiles, arena, cfg) {
  const cx = fighter.x;
  const cy = fighter.y;
  const expR = cfg.judgmentExplosionRadius ?? 280;
  const expDmg = cfg.judgmentExplosionDamage ?? 62;
  const expKb = cfg.judgmentExplosionKnockback ?? 18.0;
  const expStun = cfg.judgmentExplosionStunFrames ?? 26;

  fighter._playSfx('explosion');
  fighter._playSfx('heavyBlast');
  triggerGlobalScreenShake?.(16, 22);
  fighter._spawnVfx(
    'dtJudgmentExplosion',
    cx,
    cy,
    0,
    Math.min(460, arena.width * 0.95),
    Math.min(460, arena.height * 0.95),
    24,
    0.98,
    false,
    { behindBody: true }
  );
  fighter._spawnRipple(cx, cy, expR * 0.88, '#FBBF24');
  spawnSparks(cx, cy, 34, 'crimson', '#FBBF24');
  spawnImpactFlash(cx, cy, 78, '#FFFFFF');

  for (const enemy of hostiles) {
    if (Math.hypot(enemy.x - cx, enemy.y - cy) > expR + (enemy.r || 28)) continue;
    const kbAng = Math.atan2(enemy.y - cy, enemy.x - cx);
    _applyStunAndKb(enemy, fighter, expDmg, kbAng, expKb, expStun, { isExplosion: true, isHeavy: true });
  }

  // Using Judgment immediately ends Sin Devil Trigger
  _endDevilTriggerState(fighter);
}

export function stepDanteJudgment(fighter, hostiles, arena, cfg) {
  const st = fighter._judgmentState;
  if (!st || !st.active) return false;

  fighter.vx = 0;
  fighter.vy = 0;
  for (let i = st.slashes.length - 1; i >= 0; i--) {
    if (--st.slashes[i].life <= 0) st.slashes.splice(i, 1);
  }

  st.timer--;
  if (st.phase === 'flurry') {
    fighter.z = 20;
    if (--st.tick <= 0) {
      st.tick = Math.max(3, cfg.judgmentTickInterval ?? 5);
      fighter._playSfx('swordSlash');
      triggerGlobalScreenShake?.(5.5, 6);
      const ax = arena.x + arena.width * (0.2 + Math.random() * 0.6);
      const ay = arena.y + arena.height * (0.2 + Math.random() * 0.6);
      st.slashes.push({ x: ax, y: ay, angle: Math.random() * Math.PI * 2, len: Math.max(arena.width, arena.height) * 0.92, life: 11, maxLife: 11 });
      const tickDmg = cfg.judgmentTickDamage ?? 9;
      for (const enemy of hostiles) {
        _applyStunAndKb(enemy, fighter, tickDmg, Math.atan2(fighter.y - enemy.y, fighter.x - enemy.x), 2.5, 6, { isMelee: true });
        spawnSparks(enemy.x, enemy.y, 7, 'crimson', '#FBBF24');
      }
    }
    if (st.timer <= 0) {
      st.phase = 'finisher';
      st.timer = st.finisherMax;
    }
    return true;
  }

  // Finisher convergence -> massive explosion + immediate SDT termination
  fighter.z = Math.max(0, (st.timer / Math.max(1, st.finisherMax)) * 20);
  if (!st.detonated && st.timer <= Math.floor(st.finisherMax * 0.55)) {
    st.detonated = true;
    _detonateJudgment(fighter, hostiles, arena, cfg);
  }
  if (st.timer <= 0) {
    fighter._judgmentState = null;
    if (fighter._highTimeHopTimer <= 0) fighter.z = 0;
  }
  return true;
}

export function decayDanteSdtVisualsOnFreeze(fighter) {
  if (fighter._judgmentState) {
    const slashes = fighter._judgmentState.slashes;
    for (let i = slashes.length - 1; i >= 0; i--) {
      if (--slashes[i].life <= 0) slashes.splice(i, 1);
    }
    if (--fighter._judgmentState.timer <= 0) {
      fighter._judgmentState = null;
      if (fighter._highTimeHopTimer <= 0) fighter.z = 0;
    }
  }
  for (let i = (fighter._dtTeleportBolts?.length || 0) - 1; i >= 0; i--) {
    if (--fighter._dtTeleportBolts[i].life <= 0) fighter._dtTeleportBolts.splice(i, 1);
  }
}

export function stepDanteSdtSkillTimers(fighter, hostiles, bounds, opponent, cfg) {
  for (let i = (fighter._dtTeleportBolts?.length || 0) - 1; i >= 0; i--) {
    if (--fighter._dtTeleportBolts[i].life <= 0) fighter._dtTeleportBolts.splice(i, 1);
  }
  updateDanteOmbraFireballs(fighter, hostiles, bounds, cfg);
  if (fighter._judgmentState?.active) return stepDanteJudgment(fighter, hostiles, bounds, cfg);
  if (fighter._sinStingerState?.active) return stepDanteSinStinger(fighter, hostiles, bounds, cfg);
  if (fighter._sdtComboState?.active) return stepDanteSdtCombo(fighter, hostiles, opponent, cfg);
  stepDanteOmbra(fighter, hostiles, opponent, cfg);
  return false;
}

export function tryCastDanteSdtSkills(fighter, opponent, cfg, dist) {
  if (!fighter.isDevilTrigger || (fighter._dtTransformTimer || 0) > 0) return false;

  const dtDur = Math.max(1, cfg.devilTriggerDuration ?? 660);
  if (isSkillEnabled(cfg.enableJudgment, true) && fighter.judgmentCooldown <= 0 && fighter.devilTriggerTimer <= Math.round(dtDur * 0.62)) {
    return startDanteJudgment(fighter, opponent);
  }
  if (isSkillEnabled(cfg.enableSinStinger, true) && fighter.sinStingerCooldown <= 0 && dist >= 65) {
    return startDanteSinStinger(fighter, opponent);
  }
  if (isSkillEnabled(cfg.enableOmbra, true) && fighter.ombraCooldown <= 0 && dist >= 65) {
    return startDanteOmbra(fighter, opponent);
  }
  if (isSkillEnabled(cfg.enableSdtCombo, true) && fighter.sdtComboCooldown <= 0 && dist <= 165) {
    return startDanteSdtCombo(fighter, opponent);
  }
  return false;
}
