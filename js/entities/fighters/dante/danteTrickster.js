// ─────────────────────────────────────────────────────────────────────────────
// DANTE TRICKSTER SPOT DODGE MODULE
// Split-Second Vanish Evasion, Anticipation Trigger & Unblockable Guards
// ─────────────────────────────────────────────────────────────────────────────

import { isSkillEnabled } from '../../fighter.js';
import { CONFIG } from '../../../core/config.js';
import { state, spawnFloatingText } from '../../../core/state.js';

/**
 * Returns true if an incoming strike bypasses Spot Dodge evasion (domains, DoTs, counters).
 */
export function isSpotDodgeUnblockable(fighter, attacker, opts = {}) {
  if (!opts || typeof opts !== 'object') return false;
  const isInsideGojoDomain = Boolean(
    typeof state !== 'undefined' &&
    state.activeDomain &&
    state.activeDomain.type === 'gojo' &&
    state.activeDomain.owner !== fighter
  );
  const isGuaranteed = Boolean(
    opts.isRatioCrit || opts.isNanamiPause || opts.undodgeable || opts.isSureKill ||
    opts.isSaitamaCounter || opts.isSaitamaPunch || opts.isSeriousPunch ||
    opts.bypassShield || opts.bypassEvade || opts.isGuaranteedHit ||
    opts.isTojiUltimateAssault || opts.isTojiUltimateFinalBlow || opts.isDivineFlame || opts.isFuga ||
    (attacker && (attacker.characterId === 'saitama' || attacker.type === 'saitama'))
  );
  const isDoTOrDomain = Boolean(
    opts.isDomain || opts.isDomainDPS || opts.isPoison || opts.isBurn || opts.isFlame ||
    opts.fromBlackHole || opts.isPurpleDPS || opts.isHollowPurple
  );
  return isGuaranteed || isInsideGojoDomain || isDoTOrDomain;
}

/**
 * Resolves incoming damage with Spot Dodge invulnerability, evasion roll & DT reduction.
 */
export function resolveDanteTakeDamage(fighter, amount, attacker, opts, superTakeDamage) {
  if (opts && opts.isHeal) return superTakeDamage(amount, attacker, opts);
  const cfg = CONFIG.dante || {};

  if (fighter.isSpotDodging && fighter._spotDodgeTimer > 0) {
    fighter.hitFlashTimer = 0;
    fighter.hitStunTimer = 0;
    return false;
  }

  let adj = Number(amount) || 0;
  if (fighter.isDevilTrigger && adj > 0) {
    adj *= 1 - (cfg.dtDamageReduction ?? 0.15);
  }

  const dodgeEnabled = isSkillEnabled(cfg.enableTricksterDash, true) && isSkillEnabled(cfg.enableSpotDodge, true);
  const dodgeChance = fighter.isDevilTrigger ? (cfg.dtSpotDodgeChance ?? 1.0) : (cfg.spotDodgeChance ?? 1.0);
  const isStunned = Boolean(
    fighter._handleTimeStop() ||
    fighter.isTargetOfAmbush ||
    fighter.isChainedByMakima ||
    (fighter.paralyzeTimer || 0) > 0 ||
    (fighter.electricStunTimer || 0) > 0
  );

  const canAttemptDodge = (
    adj > 0 &&
    dodgeEnabled &&
    fighter.tricksterCooldown <= 0 &&
    !fighter._isPerformingMillionStab() &&
    !isStunned &&
    !isSpotDodgeUnblockable(fighter, attacker, opts) &&
    Math.random() < dodgeChance
  );

  if (canAttemptDodge && performDanteTricksterDash(fighter, opts?.projectile || attacker, cfg)) {
    fighter.hitFlashTimer = 0;
    fighter.hitStunTimer = 0;
    return false;
  }

  return superTakeDamage(adj, attacker, opts);
}

/**
 * Triggers Trickster Spot Dodge when an incoming hostile projectile approaches.
 */
export function handleDanteProjectileApproach(fighter, projectile, attacker) {
  const cfg = CONFIG.dante || {};
  if (fighter.hp <= 0 || fighter.isDead || fighter._handleTimeStop() || fighter.isTargetOfAmbush) return;
  if (attacker === fighter || !fighter._isHostile(attacker || projectile)) return;
  if (fighter._isPerformingMillionStab()) return;
  if (fighter.tricksterCooldown <= 0 && !fighter.isSpotDodging) {
    performDanteTricksterDash(fighter, projectile || attacker, cfg);
  }
}

/**
 * Proactively triggers Spot Dodge when a nearby enemy begins a melee swing.
 */
export function checkDanteSpotDodgeAnticipation(fighter, target, dist, cfg) {
  if (!target || fighter.hp <= 0 || fighter.isDead || fighter.isSpotDodging || fighter.tricksterCooldown > 0) return false;
  if (fighter._isPerformingMillionStab()) return false;
  if (!isSkillEnabled(cfg.enableTricksterDash, true) || !isSkillEnabled(cfg.enableSpotDodge, true)) return false;

  const threatRadius = (fighter.r || 30) + (target.r || 30) + 65;
  if (dist > threatRadius) return false;

  const enemySwinging = Boolean(
    target.isSlashing ||
    (target.slashSwingTimer || 0) > 0 ||
    (target.punchAnimTimer || 0) > 0 ||
    (target.katanaSlashTimer || 0) > 0 ||
    (target.cleaveSwingTimer || 0) > 0 ||
    (target.meleeSwingTimer || 0) > 0 ||
    (target.spearSwingTimer || 0) > 0
  );
  return enemySwinging ? performDanteTricksterDash(fighter, target, cfg) : false;
}

/**
 * Executes Dante's Trickster Spot Dodge vanish, sidestep, and `MISS!` feedback.
 */
export function performDanteTricksterDash(fighter, threat, cfg) {
  const activeCfg = cfg || CONFIG.dante || {};
  if (!isSkillEnabled(activeCfg.enableTricksterDash, true) || !isSkillEnabled(activeCfg.enableSpotDodge, true)) return false;
  if (fighter._isPerformingMillionStab()) return false;

  fighter.tricksterCooldown = activeCfg.tricksterCooldown ?? 75;
  fighter._spotDodgeOriginX = fighter.x;
  fighter._spotDodgeOriginY = fighter.y;
  fighter._spotDodgeMaxTimer = activeCfg.spotDodgeDuration ?? 18;
  fighter._spotDodgeTimer = fighter._spotDodgeMaxTimer;
  fighter.trickPhaseTimer = fighter._spotDodgeMaxTimer;
  fighter.suppressInkOutline = true;
  fighter.suppressFloorShadow = true;
  fighter.hideHpText = true;
  fighter.isSpotDodging = true;

  const arena = state.arena || { x: 45, y: 240, width: 450, height: 450 };
  let awayAngle = (fighter.gunAngle || 0) + Math.PI * 0.5;
  if (threat && typeof threat.x === 'number' && typeof threat.y === 'number') {
    fighter._lastDodgeSide = !fighter._lastDodgeSide;
    awayAngle = Math.atan2(fighter.y - threat.y, fighter.x - threat.x) + (fighter._lastDodgeSide ? 1.15 : -1.15);
  }

  const shift = activeCfg.tricksterDistance ?? 12;
  const pad = (fighter.r || 30) + 6;
  fighter.x = Math.max(arena.x + pad, Math.min(arena.x + arena.width - pad, fighter.x + Math.cos(awayAngle) * shift));
  fighter.y = Math.max(arena.y + pad, Math.min(arena.y + arena.height - pad, fighter.y + Math.sin(awayAngle) * shift));

  const vfxSize = (fighter.r || 30) * 3.8;
  fighter._spawnVfx('spotDodge', fighter._spotDodgeOriginX, fighter._spotDodgeOriginY - (fighter.r || 30) * 0.18, 0, vfxSize, vfxSize, fighter._spotDodgeMaxTimer + 2, 0.98);
  fighter._playSfx('trickVanish');
  spawnFloatingText(
    fighter._spotDodgeOriginX,
    fighter._spotDodgeOriginY - (fighter.r || 30) - 18,
    activeCfg.spotDodgeText || 'MISS!',
    activeCfg.spotDodgeTextColor || '#FFFFFF'
  );
  if (threat && typeof threat.x === 'number' && typeof threat.y === 'number' && !threat.isProjectile) {
    fighter.aim(threat);
  }
  return true;
}
