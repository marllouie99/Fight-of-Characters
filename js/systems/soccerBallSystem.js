// ─────────────────────────────────────────────
// CENTRALIZED BLUE LOCK SOCCER BALL COMBAT & PHYSICS SYSTEM
// Universal Ball Creation, 3D Rolling, Ricochet, Bank Passes,
// Target Hit Stun, One-Two Rebounds, and Contested Ball Mechanics
//
// Complies with:
// - Rule 1.2: Centralized Movement & Physics Standard
// - Rule 1.6: Frontal Arc Radius AOE & Target Acquisition
// - Rule 1.7: Gojo Limitless Infinity Barrier Standard
// - Rule 23: Basic Projectile Suppression
// - Rule 24: Universal Character Body Model (r = 25 Baseline)
// - Rule 25: Non-Freezing Active Visual Effects Decay
// - Rule 26: Clean Concentric Shockwaves (No Cobweb / Radial Meshes)
// ─────────────────────────────────────────────

import { state, spawnFloatingText, triggerGlobalScreenShake } from '../core/state.js';
import { playSound } from './soundSystem.js';
import { spawnSparks } from '../graphics/particles/sparkEffect.js';
import { applyDamageToTarget, isSkillEnabled } from '../entities/fighter.js';
import {
  stepSoccerBall3DRotation,
  updateBlueLockEgoTrail,
  decayBlueLockEgoTrail,
  updateStrikerBallTrail,
  decayStrikerBallTrail
} from '../graphics/weapons/soccerBallGraphics.js';

export {
  updateBlueLockEgoTrail,
  decayBlueLockEgoTrail,
  updateStrikerBallTrail,
  decayStrikerBallTrail
};

/**
 * Universal Blue Lock Character Registry.
 * All characters belonging to the Blue Lock series share exactly ONE soccer ball on the pitch.
 */
export const BLUE_LOCK_CHARACTER_IDS = Object.freeze([
  'isagi',
  'rin',
  'bachira',
  'nagi',
  'barou',
  'chigiri',
  'shidou',
  'kunigami',
  'reo'
]);

/**
 * Canonical EGO Awakening & Potential Buff Registry for each Blue Lock Striker.
 * Guarantees distinct, authentic weapon buffs tailored to each character's lore weapon.
 */
export const BLUE_LOCK_EGO_REGISTRY = Object.freeze({
  isagi: Object.freeze({
    id: 'isagi',
    name: 'Yoichi Isagi',
    title: 'Metavision Flow',
    themeColor: '#00F0FF',
    buffs: Object.freeze({
      kickSpeedMultiplier: 1.30, // +30% ball kinetic speed
      damageMultiplier: 1.25,    // +25% strike damage
      cooldownRate: 1.6,         // 60% faster skill cooldown recovery (spatial processing)
      sweetSpotDamageBonus: 8    // Enhanced spatial awareness direct sweet-spot hit damage
    })
  }),
  chigiri: Object.freeze({
    id: 'chigiri',
    name: 'Hyoma Chigiri',
    title: '44-Panther Mach Pace',
    themeColor: '#EC4899',
    buffs: Object.freeze({
      speedMultiplier: 1.60,     // Extreme +60% breakaway sprint speed!
      kickSpeedMultiplier: 1.25,
      damageMultiplier: 1.15,
      dodgeChance: 0.25
    })
  }),
  rin: Object.freeze({
    id: 'rin',
    name: 'Itoshi Rin',
    title: 'Berserker Destruction',
    themeColor: '#00B4D8',
    buffs: Object.freeze({
      damageMultiplier: 1.45,    // Massive +45% lethal strike damage
      kickSpeedMultiplier: 1.35,
      curvedShotRate: 1.6,       // Extreme trivela rotational curve
      armorPenetration: 0.30
    })
  }),
  bachira: Object.freeze({
    id: 'bachira',
    name: 'Meguru Bachira',
    title: 'Monster Trance Dribbler',
    themeColor: '#F59E0B',
    buffs: Object.freeze({
      speedMultiplier: 1.30,
      dodgeChance: 0.40,         // 40% erratic footwork attack evasion
      kickSpeedMultiplier: 1.20,
      reboundBounceChance: 0.80, // 80% One-Two return bounce chance
      kickAccuracy: 1.0
    })
  }),
  nagi: Object.freeze({
    id: 'nagi',
    name: 'Seishiro Nagi',
    title: 'Black Hole Trapper',
    themeColor: '#F8FAFC',
    buffs: Object.freeze({
      trapKillVelocity: true,    // Instantly kills ball velocity on trap
      damageMultiplier: 1.35,
      kickSpeedMultiplier: 1.40, // Explosive fake-volley takeoff
      sweetSpotBonusMult: 2.0,
      cooldownRate: 1.4
    })
  }),
  barou: Object.freeze({
    id: 'barou',
    name: 'Barou Shouei',
    title: "The King's Predator Cannon",
    themeColor: '#DC2626',
    buffs: Object.freeze({
      damageMultiplier: 1.55,           // Devastating +55% blast damage
      strikerKnockbackMultiplier: 1.60, // Heavy wall slam knockback
      defenseMultiplier: 0.80,          // 20% physical damage reduction
      kickSpeedMultiplier: 1.45
    })
  }),
  shidou: Object.freeze({
    id: 'shidou',
    name: 'Ryusei Shidou',
    title: 'Dragon Drive Finisher',
    themeColor: '#A855F7',
    buffs: Object.freeze({
      damageMultiplier: 1.40,
      strikerRadiusMultiplier: 1.50, // 50% wider aerial blast radius
      kickSpeedMultiplier: 1.50,
      speedMultiplier: 1.20
    })
  }),
  kunigami: Object.freeze({
    id: 'kunigami',
    name: 'Rensuke Kunigami',
    title: 'Wild Card Powerhouse',
    themeColor: '#F97316',
    buffs: Object.freeze({
      damageMultiplier: 1.50,           // Ambidextrous power shots
      defenseMultiplier: 0.75,          // 25% physical damage reduction
      kickSpeedMultiplier: 1.35,
      strikerKnockbackMultiplier: 1.40
    })
  }),
  reo: Object.freeze({
    id: 'reo',
    name: 'Mikage Reo',
    title: 'Chameleon All-Rounder',
    themeColor: '#8B5CF6',
    buffs: Object.freeze({
      speedMultiplier: 1.25,
      kickSpeedMultiplier: 1.25,
      damageMultiplier: 1.25,
      dodgeChance: 0.20,
      cooldownRate: 1.6                // 60% faster skill recovery
    })
  })
});

/**
 * Checks whether a given entity is a Blue Lock fighter.
 *
 * @param {object} f - Fighter entity
 * @returns {boolean}
 */
export function isBlueLockFighter(f) {
  if (!f) return false;
  if (f.isBlueLockFighter) return true;
  const id = f.characterId ? String(f.characterId).toLowerCase() : (f.type ? String(f.type).toLowerCase() : '');
  return BLUE_LOCK_CHARACTER_IDS.includes(id);
}

/**
 * Counts the active Blue Lock characters present in the match.
 *
 * @param {object} [stateRef=state]
 * @returns {number}
 */
export function countBlueLockFighters(stateRef = state) {
  if (!stateRef || !Array.isArray(stateRef.fighters)) return 0;
  let count = 0;
  for (let i = 0; i < stateRef.fighters.length; i++) {
    if (isBlueLockFighter(stateRef.fighters[i])) {
      count++;
    }
  }
  return count;
}

/**
 * Returns all Blue Lock fighters currently in the arena.
 *
 * @param {object} [stateRef=state]
 * @returns {Array}
 */
export function getBlueLockFighters(stateRef = state) {
  if (!stateRef || !Array.isArray(stateRef.fighters)) return [];
  return stateRef.fighters.filter(isBlueLockFighter);
}

/**
 * Determines whether a fighter is the primary controller responsible for
 * driving soccer ball physics integration and rendering.
 * Prevents multiple Blue Lock characters from duplicating ball physics steps
 * or performing redundant draw calls for the single shared soccer ball.
 *
 * @param {object} fighter
 * @param {object} [stateRef=state]
 * @returns {boolean}
 */
export function isPrimaryBlueLockBallController(fighter, stateRef = state) {
  if (!fighter) return false;
  if (!stateRef || !Array.isArray(stateRef.fighters) || stateRef.fighters.length === 0) {
    return true; // Fallback: standalone fighter is always primary
  }
  const blFighters = stateRef.fighters.filter(isBlueLockFighter);
  if (blFighters.length <= 1) {
    return true;
  }
  // Primary controller is the first non-dead Blue Lock fighter in the match
  const primary = blFighters.find(f => !f.isDead) || blFighters[0];
  return primary === fighter;
}

/**
 * Retrieves the existing shared soccer ball, or instantiates a new one if none exists.
 * Guarantees exactly ONE soccer ball on the pitch when multiple Blue Lock characters are present.
 *
 * @param {object} [kicker=null]
 * @param {object} [cfg={}]
 * @param {object} [stateRef=state]
 * @returns {object} Shared soccer ball entity
 */
export function getOrCreateSharedSoccerBall(kicker = null, cfg = {}, stateRef = state) {
  // 1. Check if another Blue Lock character in state.fighters already has a soccer ball
  if (stateRef && Array.isArray(stateRef.fighters)) {
    for (let i = 0; i < stateRef.fighters.length; i++) {
      const f = stateRef.fighters[i];
      if (f && isBlueLockFighter(f) && f.soccerBall && typeof f.soccerBall === 'object') {
        if (stateRef) stateRef.sharedSoccerBall = f.soccerBall;
        return f.soccerBall;
      }
    }
  }

  // 2. Check if a shared soccer ball is already anchored in state
  if (stateRef && stateRef.sharedSoccerBall && typeof stateRef.sharedSoccerBall === 'object') {
    return stateRef.sharedSoccerBall;
  }

  // 3. Create a new single soccer ball instance
  const newBall = createSoccerBall(kicker, cfg);
  if (stateRef) {
    stateRef.sharedSoccerBall = newBall;
  }
  return newBall;
}

/**
 * Creates a new standardized soccer ball entity for Blue Lock characters.
 *
 * @param {object} [kicker=null] - Owner / Initial kicker fighter
 * @param {object} [cfg={}] - Character config object
 * @returns {object} Standardized soccer ball entity
 */
export function createSoccerBall(kicker = null, cfg = {}) {
  const angle = kicker ? (kicker.angle || 0) : 0;
  const kickerR = kicker ? (kicker.r || 25) : 25;
  const r = cfg.egoShotRadius || 16;
  const startX = kicker ? (kicker.x + Math.cos(angle) * (kickerR + r + 4)) : 200;
  const startY = kicker ? (kicker.y + Math.sin(angle) * (kickerR + r + 4)) : 200;

  return {
    x: startX,
    y: startY,
    vx: 0,
    vy: 0,
    r: r,
    baseDamage: cfg.egoShotDamage || 24,
    reboundDamage: cfg.egoShotReboundDamage || 32,
    isCrit: false,
    isDirectVolley: false,
    isSuperShot: false,
    isRebound: false,
    isKicked: false,
    // Backward-compatible alias for Isagi tests
    isKickedByIsagi: false,
    shouldBounceBackToIsagi: false,
    shouldBounceBackToKicker: false,
    rotation: angle,
    rotSpeed: 0,
    startX: kicker ? kicker.x : startX,
    startY: kicker ? kicker.y : startY,
    lastKicker: kicker,
    kickerThemeColor: kicker ? (kicker.color || '#00F0FF') : '#00F0FF',
    _lastStepX: startX,
    _lastStepY: startY,
    _lastStepRot: angle,
    _rotMatrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    _needs3DRender: true
  };
}

/**
 * Resets and re-anchors the soccer ball.
 * When multiple Blue Lock characters are present in the arena,
 * the ball resets to the center kickoff point of the pitch.
 * When only one Blue Lock character is present, it anchors at their feet.
 *
 * @param {object} ball - Ball entity
 * @param {object} kicker - Kicker fighter
 * @param {object} [cfg={}] - Config overrides
 * @param {object} [arena=null] - Arena bounding box
 * @param {object} [stateRef=state] - State reference
 */
export function resetSoccerBall(ball, kicker, cfg = {}, arena = null, stateRef = state) {
  if (!ball) return;
  const r = cfg.egoShotRadius || ball.r || 16;
  ball.r = r;
  ball.vx = 0;
  ball.vy = 0;
  ball.isCrit = false;
  ball.isDirectVolley = false;
  ball.isSuperShot = false;
  ball.isRebound = false;
  ball.isKicked = false;
  ball.isKickedByIsagi = false;
  ball.shouldBounceBackToKicker = false;
  ball.shouldBounceBackToIsagi = false;
  ball.rotSpeed = 0;
  ball.lastKicker = kicker || null;
  if (ball._strikerTrailNodes) ball._strikerTrailNodes.length = 0;
  if (ball._strikerSparks) ball._strikerSparks.length = 0;
  ball.kickerThemeColor = kicker ? (kicker.color || '#00F0FF') : '#00F0FF';

  // Single Shared Ball Kick-off standard:
  // If 2 or more Blue Lock fighters are present and arena is provided, spawn at pitch center
  const blCount = countBlueLockFighters(stateRef);
  if (blCount >= 2 && arena && typeof arena.width === 'number' && typeof arena.height === 'number') {
    ball.x = arena.x + arena.width / 2;
    ball.y = arena.y + arena.height / 2;
  } else if (kicker) {
    const angle = kicker.angle || 0;
    const kickerR = kicker.r || 25;
    ball.x = kicker.x + Math.cos(angle) * (kickerR + r + 4);
    ball.y = kicker.y + Math.sin(angle) * (kickerR + r + 4);
  }

  ball._lastStepX = ball.x;
  ball._lastStepY = ball.y;
  ball._lastStepRot = kicker ? (kicker.angle || 0) : 0;
  ball._rotMatrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  ball._needs3DRender = true;
}

// ─────────────────────────────────────────────
// UNIVERSAL BLUE LOCK "EGO" AWAKENING SYSTEM
// ─────────────────────────────────────────────

/**
 * Initializes or resets the Ego meter and potential buff state on a Blue Lock fighter.
 *
 * @param {object} fighter - Blue Lock fighter entity
 * @param {object} [cfg={}] - Character config
 */
export function initBlueLockEgo(fighter, cfg = {}) {
  if (!fighter) return;
  const fId = fighter.characterId
    ? String(fighter.characterId).toLowerCase()
    : (fighter.type ? String(fighter.type).toLowerCase() : 'isagi');
  const registryDef = BLUE_LOCK_EGO_REGISTRY[fId] || BLUE_LOCK_EGO_REGISTRY.isagi;

  fighter.egoMeter = 0;
  fighter.maxEgoMeter = cfg.maxEgoMeter || 100;
  fighter.isEgoActive = false;
  fighter.isEgoAwakened = false;
  fighter.egoDurationTimer = 0;
  fighter.egoMaxDuration = cfg.egoDuration || 360;
  fighter.egoBuffs = cfg.egoBuffs
    ? { ...cfg.egoBuffs }
    : { ...registryDef.buffs };
  fighter.egoTitle = cfg.egoTitle || registryDef.title;
  fighter._egoAuraTimer = 0;
  fighter._egoAuraOpacity = 0;
}

/**
 * Grants Ego meter points to a Blue Lock fighter upon successfully hitting an enemy.
 * When the meter reaches 100% (maxEgoMeter), Ego Awakening triggers automatically.
 *
 * @param {object} fighter - Blue Lock fighter entity
 * @param {number} [amount=25] - Ego points gained
 * @param {object} [cfg={}] - Character config
 */
export function gainBlueLockEgo(fighter, amount = 25, cfg = {}) {
  if (!fighter || fighter.isDead) return;

  // If already awakened, successful hits extend active duration up to max
  if (fighter.isEgoActive) {
    const bonusFrames = cfg.egoHitExtensionFrames || 30; // +0.5s extension on hit
    fighter.egoDurationTimer = Math.min(fighter.egoMaxDuration || 360, fighter.egoDurationTimer + bonusFrames);
    spawnFloatingText('+EGO TIME!', fighter.x, fighter.y - 28, fighter.color || '#00F0FF');
    return;
  }

  const maxEgo = fighter.maxEgoMeter || cfg.maxEgoMeter || 100;
  fighter.egoMeter = Math.min(maxEgo, (fighter.egoMeter || 0) + amount);

  // Check awakening threshold
  if (fighter.egoMeter >= maxEgo) {
    activateBlueLockEgo(fighter, cfg);
  } else {
    const themeColor = fighter.color || cfg.themeColor || '#00F0FF';
    spawnFloatingText(`EGO ${Math.round(fighter.egoMeter)}%`, fighter.x, fighter.y - 24, themeColor);
  }
}

/**
 * Activates Ego Awakening, unlocking the character's full potential and buffs.
 *
 * @param {object} fighter - Blue Lock fighter entity
 * @param {object} [cfg={}] - Character config
 */
export function activateBlueLockEgo(fighter, cfg = {}) {
  if (!fighter || fighter.isDead) return;
  fighter.egoMeter = fighter.maxEgoMeter || cfg.maxEgoMeter || 100;
  fighter.isEgoActive = true;
  fighter.isEgoAwakened = true;
  fighter.egoMaxDuration = cfg.egoDuration || 360;
  fighter.egoDurationTimer = fighter.egoMaxDuration;
  fighter._egoAuraOpacity = 0.65;
  updateBlueLockEgoTrail(fighter);

  const themeColor = fighter.color || cfg.themeColor || '#00F0FF';

  // Concentric supersonic shockwave (Rule 26)
  if (Array.isArray(fighter.shockwaves)) {
    fighter.shockwaves.push({
      x: fighter.x,
      y: fighter.y,
      maxR: 90,
      progress: 0.0,
      speed: 0.07,
      color: themeColor
    });
  }

  triggerGlobalScreenShake(cfg.egoAwakenShake || 7, 14);
  playSound('Assets/Sound Effects/Skills/enhance.mp3', 0.85);
  const shoutText = fighter.egoTitle
    ? `${fighter.egoTitle.toUpperCase()}!`
    : (cfg.egoTitle ? `${cfg.egoTitle.toUpperCase()}!` : 'EGO AWAKENED!!');
  spawnFloatingText(shoutText, fighter.x, fighter.y - 32, themeColor);

  if (typeof fighter._spawnPuzzleParticles === 'function') {
    fighter._spawnPuzzleParticles(fighter.x, fighter.y, 14, themeColor);
  }

  if (typeof fighter.onEgoAwakened === 'function') {
    fighter.onEgoAwakened(cfg);
  }
}

/**
 * Per-frame update for the active Ego Awakening lifecycle and timer drain.
 *
 * @param {object} fighter - Blue Lock fighter entity
 * @param {object} [cfg={}] - Character config
 */
export function updateBlueLockEgo(fighter, cfg = {}) {
  if (!fighter) return;

  if (fighter.isEgoActive) {
    fighter.egoDurationTimer--;
    fighter._egoAuraTimer = (fighter._egoAuraTimer || 0) + 1;

    // High-octane stylized Dark Flame & Ribbon Ego Trail (Rule 11 & Rule 25)
    updateBlueLockEgoTrail(fighter);

    // Synchronize egoMeter with remaining active duration for HUD progression
    const maxDur = fighter.egoMaxDuration || cfg.egoDuration || 360;
    fighter.egoMeter = Math.max(0, (fighter.egoDurationTimer / maxDur) * (fighter.maxEgoMeter || 100));

    // Periodic ambient ego particles
    if (fighter._egoAuraTimer % 18 === 0 && typeof fighter._spawnPuzzleParticles === 'function') {
      fighter._spawnPuzzleParticles(
        fighter.x + (Math.random() - 0.5) * 30,
        fighter.y + (Math.random() - 0.5) * 30,
        1,
        fighter.color || '#00F0FF'
      );
    }

    // Expiration
    if (fighter.egoDurationTimer <= 0) {
      fighter.isEgoActive = false;
      fighter.isEgoAwakened = false;
      fighter.egoMeter = 0;
      fighter.egoDurationTimer = 0;
      fighter._wasEgoAuraActive = false;
      fighter._egoAuraDisappearing = true;
      fighter._egoAuraDisappearTimer = 24;
      fighter._egoAuraDisappearMax = 24;
      spawnFloatingText('EGO EXHAUSTED', fighter.x, fighter.y - 24, '#94A3B8');
      if (typeof fighter.onEgoEnd === 'function') {
        fighter.onEgoEnd(cfg);
      }
    }
  } else {
    // Lingering Ego Trail natural decay when inactive (Rule 25)
    decayBlueLockEgoTrail(fighter);
  }
}

/**
 * Returns active Ego Buff multipliers if the fighter is currently in Ego Awakening.
 *
 * @param {object} fighter - Blue Lock fighter entity
 * @returns {object|null}
 */
export function getBlueLockEgoBuffs(fighter) {
  if (!fighter || !fighter.isEgoActive) return null;
  return fighter.egoBuffs || null;
}

/**
 * Evaluates whether the soccer ball is currently an active, lethal hostile strike
 * traveling towards the specified fighter.
 * When true, the target fighter MUST NOT intercept, trap, dribble, or kick the ball;
 * the ball must resolve its lethal hit check and damage against the target first.
 *
 * @param {object} ball - Soccer ball entity
 * @param {object} fighter - Fighter evaluating ball hostility
 * @returns {boolean} True if the ball is a lethal enemy attack incoming towards fighter
 */
export function isHostileLethalBall(ball, fighter) {
  if (!ball || !fighter) return false;
  const isKicked = Boolean(ball.isKicked || ball.isKickedByIsagi || ball.isDirectVolley || ball.isStriker || ball.isSuperShot);
  if (!isKicked) return false;
  const currentSpeed = Math.hypot(ball.vx || 0, ball.vy || 0);
  if (currentSpeed < 3.0) return false;

  const kicker = ball.lastKicker || ball.kicker;
  if (!kicker) return false;
  // Not hostile if kicker is self (e.g. wall bank pass / one-two return)
  if (kicker === fighter || kicker.id === fighter.id) return false;
  // Not hostile if kicker is a teammate
  if (typeof fighter.isTeammate === 'function' && fighter.isTeammate(kicker)) return false;

  return true;
}

/**
 * Checks whether a fighter is within physical reach to kick the soccer ball.
 * Strictly guards against claiming or intercepting incoming lethal hostile kicks,
 * as well as acting during active hit stun or hit cooldown.
 *
 * @param {object} fighter
 * @param {object} ball
 * @param {number} [reachMargin=16]
 * @returns {boolean}
 */
export function checkFighterCanKickBall(fighter, ball, reachMargin = 16) {
  if (!fighter || !ball) return false;
  if (fighter.isDead || (typeof fighter.hp === 'number' && fighter.hp <= 0)) return false;
  if (fighter.hitStunTimer > 0 || fighter.paralyzeTimer > 0 || fighter.knockbackStunTimer > 0) return false;
  if (fighter._ballHitCooldown > 0 || fighter._isagiBallHitCooldown > 0) return false;

  // Crucial: Cannot kick or possess a ball that is actively flying as a lethal hostile attack from an opponent!
  // (Prevents enemy fighters from grabbing/negating incoming lethal kicks before damage resolves)
  if (isHostileLethalBall(ball, fighter)) {
    return false;
  }

  const totalReach = (fighter.r || 25) + (ball.r || 16) + reachMargin;
  return Math.hypot(ball.x - fighter.x, ball.y - fighter.y) <= totalReach;
}

/**
 * Executes an active soccer kick by a Blue Lock character.
 * Repositions the ball in the kick direction, imparts velocity and spin,
 * and sets up combat hit flags.
 *
 * @param {object} kicker - Kicking fighter
 * @param {object} ball - Soccer ball entity
 * @param {number} angle - Launch angle in radians
 * @param {number} speed - Kick launch speed (px/frame)
 * @param {object} [options={}] - Custom kick parameters
 * @returns {object} Ball reference
 */
export function executeSoccerKick(kicker, ball, angle, speed, options = {}) {
  if (!kicker || !ball) return ball;

  const kickerR = kicker.r || 25;
  const ballR = ball.r || 16;
  const themeColor = options.themeColor || kicker.color || '#00F0FF';

  // 1. Kick Accuracy & Angular Spread Deviation
  // kickAccuracy: 1.0 (or 100) = 100% straight shot with 0 angular spread (Isagi standard).
  // Lower values introduce probability and angular dispersion.
  let rawAccuracy = options.kickAccuracy !== undefined
    ? options.kickAccuracy
    : (kicker.kickAccuracy !== undefined ? kicker.kickAccuracy : 1.0);
  if (typeof rawAccuracy === 'number' && rawAccuracy > 1.0) {
    rawAccuracy = rawAccuracy / 100; // e.g. 100 -> 1.0
  }
  const kickAccuracy = typeof rawAccuracy === 'number' ? Math.max(0, Math.min(1.0, rawAccuracy)) : 1.0;

  let finalAngle = angle;
  let spreadAngle = 0;
  if (kickAccuracy < 1.0) {
    const maxSpread = options.maxKickSpread || ((18 * Math.PI) / 180);
    // Probability of spread based on accuracy deficiency
    if (Math.random() > kickAccuracy) {
      const sign = Math.random() < 0.5 ? -1 : 1;
      const deviationFraction = 0.25 + 0.75 * Math.random();
      spreadAngle = sign * deviationFraction * maxSpread * (1.0 - kickAccuracy);
      finalAngle = angle + spreadAngle;
    }
  }

  // 1b. Active EGO Awakening Buffs (kick speed, guaranteed crits & rebound chance)
  const egoBuffs = getBlueLockEgoBuffs(kicker);
  if (egoBuffs) {
    if (typeof egoBuffs.kickSpeedMultiplier === 'number') {
      speed *= egoBuffs.kickSpeedMultiplier;
    }
    if (typeof egoBuffs.reboundBounceChance === 'number' && options.bounceBackChance === undefined) {
      options.bounceBackChance = egoBuffs.reboundBounceChance;
    }
  }

  // 2. Reposition ball along aimed kick vector to prevent clipping
  ball.x = kicker.x + Math.cos(angle) * (kickerR + ballR + 2);
  ball.y = kicker.y + Math.sin(angle) * (kickerR + ballR + 2);
  ball._lastStepX = ball.x;
  ball._lastStepY = ball.y;

  // 3. Velocity & Spin Integration (Travels along finalAngle with spread)
  ball.vx = Math.cos(finalAngle) * speed;
  ball.vy = Math.sin(finalAngle) * speed;
  ball.startX = kicker.x;
  ball.startY = kicker.y;
  ball.lastKicker = kicker;
  ball.kickerThemeColor = themeColor;
  ball.rotSpeed = options.rotSpeed || (options.isDirectVolley ? 0.42 : 0.24);
  ball.kickAccuracy = kickAccuracy;
  ball.kickAngle = angle;
  ball.finalKickAngle = finalAngle;
  ball.kickSpreadAngle = spreadAngle;

  // 3. Combat Flags
  const isStrikerShot = Boolean(options.isStriker || options.isDirectVolley || options.isSuperShot);
  ball.isCrit = Boolean(options.isCrit || (egoBuffs && egoBuffs.guaranteedCrit));
  ball.isDirectVolley = isStrikerShot;
  ball.isStriker = isStrikerShot;
  ball.isSuperShot = isStrikerShot;
  ball.isRebound = Boolean(options.isRebound);
  ball.isKicked = true;
  ball.isKickedByIsagi = (kicker.characterId === 'isagi');
  ball.dribbler = null;

  const kickerCfg = (typeof CONFIG !== 'undefined' && kicker.characterId && CONFIG[kicker.characterId])
    ? CONFIG[kicker.characterId]
    : {};

  // 3b. Kick Kinematics Slowdown: Slow Blue Lock kicker's movement upon kicking
  if (kicker && isBlueLockFighter(kicker)) {
    const kickSlowDur = options.kickSlowDuration || kickerCfg.kickSlowDuration || 18;
    const kickSlowMult = options.kickSlowMultiplier || kickerCfg.kickSlowMultiplier || 0.18;
    kicker.kickSlowTimer = Math.max(kicker.kickSlowTimer || 0, kickSlowDur);
    kicker.kickSlowMultiplier = kickSlowMult;
    kicker.vx *= kickSlowMult;
    kicker.vy *= kickSlowMult;
  }

  ball.baseDamage = options.damage || options.baseDamage || kicker.damage || kickerCfg.damage || kickerCfg.pantherShotDamage || kickerCfg.egoShotDamage || 24;
  ball.reboundDamage = options.reboundDamage || kickerCfg.reboundDamage || kickerCfg.pantherShotReboundDamage || kickerCfg.egoShotReboundDamage || 32;

  // One-Two Return Pass Chance
  const bounceChance = options.bounceBackChance ?? 0.35;
  const shouldBounce = Math.random() < bounceChance;
  ball.shouldBounceBackToKicker = shouldBounce;
  ball.shouldBounceBackToIsagi = (kicker.characterId === 'isagi') && shouldBounce;

  // 4. Visual Kick Impact Registration
  if (Array.isArray(kicker.activeKickImpacts)) {
    kicker.activeKickImpacts.push({
      x: ball.x,
      y: ball.y,
      angle: finalAngle,
      timer: 12,
      maxTimer: 12,
      isDirectVolley: isStrikerShot,
      isStriker: isStrikerShot,
      color: themeColor
    });
  }

  // Instant seed for Striker ball electric comet trail (frame 0 visual continuity)
  if (isStrikerShot) {
    const spd = Math.hypot(ball.vx, ball.vy);
    const seedOffset = Math.min(8, (ball.r || 16) * 0.5);
    ball._strikerTrailNodes = [
      { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy, speed: spd, angle: finalAngle, age: 0, r: ball.r || 16 },
      { x: ball.x - Math.cos(finalAngle) * seedOffset, y: ball.y - Math.sin(finalAngle) * seedOffset, vx: ball.vx, vy: ball.vy, speed: spd, angle: finalAngle, age: 0.05, r: ball.r || 16 }
    ];
    ball._strikerTrailTimer = 1;
  }

  // 5. Audio & Sparks
  spawnSparks(ball.x, ball.y, isStrikerShot ? 14 : 8, themeColor);
  if (isStrikerShot) {
    playSound('Assets/Sound Effects/Skills/toji-2stseq-2ndweaponAttack.mp3', 0.85);
  } else {
    playSound('Assets/Sound Effects/Attacks/swordswing.mp3', 0.70);
  }

  return ball;
}

/**
 * Universal "STRIKER!" Skill Finisher Execution for Blue Lock characters.
 * All Blue Lock characters unleash their ultimate finishing blast ("STRIKER!") on the soccer ball.
 *
 * @param {object} kicker - Blue Lock fighter instance
 * @param {object} ball - Active soccer ball entity
 * @param {object} opponent - Primary opponent target
 * @param {object} arena - Arena bounding box
 * @param {object} [cfg={}] - Character config
 * @param {object} [options={}] - Custom overrides (speed, damage, shout, etc.)
 * @returns {object} The energized soccer ball
 */
export function executeStrikerSkill(kicker, ball, opponent, arena, cfg = {}, options = {}) {
  if (!kicker || !ball) return ball;

  // 1. Interrupt transient dashes or slips on kicker
  if (kicker.isMetavisionDashing) {
    kicker.isMetavisionDashing = false;
    kicker.metavisionDashTimer = 0;
  }
  if (kicker.isStrikerWindingUp || kicker.isDirectVolleyWindingUp) {
    kicker.isStrikerWindingUp = false;
    kicker.isDirectVolleyWindingUp = false;
  }

  // 2. Cooldown Reset
  const cdMax = options.cooldownMax || cfg.strikerCooldown || cfg.directVolleyCooldown || 1080;
  kicker.strikerCooldownTimer = cdMax;
  kicker.directVolleyCooldownTimer = cdMax;

  // 3. Kick Slow Recovery Follow-Through
  const slowDur = options.kickSlowDuration || cfg.strikerKickSlowDuration || cfg.directVolleyKickSlowDuration || 24;
  const slowMult = options.kickSlowMultiplier || cfg.strikerKickSlowMultiplier || cfg.directVolleyKickSlowMultiplier || 0.12;
  kicker.kickSlowTimer = slowDur;
  kicker.kickSlowMultiplier = slowMult;
  kicker.vx *= slowMult;
  kicker.vy *= slowMult;

  // 4. Committed Aim Lock towards Opponent
  const angle = (opponent && !opponent.isDead && typeof opponent.x === 'number' && typeof opponent.y === 'number')
    ? Math.atan2(opponent.y - kicker.y, opponent.x - kicker.x)
    : ((kicker.gunAngle !== undefined) ? kicker.gunAngle : ((kicker.angle !== undefined) ? kicker.angle : 0));
  kicker.gunAngle = angle;
  kicker.angle = angle;
  if (kicker.directVolleyTargetAngle !== undefined) kicker.directVolleyTargetAngle = angle;
  if (kicker.strikerTargetAngle !== undefined) kicker.strikerTargetAngle = angle;

  // 5. Kinematics & Ball Acceleration
  const themeColor = options.themeColor || kicker.color || cfg.themeColor || '#00F0FF';
  const speed = options.speed || cfg.strikerSpeed || cfg.directVolleySpeed || 25.0;
  const bounceChance = options.bounceBackChance ?? cfg.bounceBackChance ?? cfg.bounceBackToIsagiChance ?? 0.50;
  const accuracy = options.kickAccuracy !== undefined
    ? options.kickAccuracy
    : (kicker.kickAccuracy !== undefined ? kicker.kickAccuracy : (cfg.kickAccuracy ?? 1.0));
  const maxSpread = options.maxKickSpread ?? cfg.maxKickSpread;

  executeSoccerKick(kicker, ball, angle, speed, {
    isDirectVolley: true, // backward-compatible flag
    isStriker: true,      // universal Blue Lock striker flag
    isSuperShot: true,
    themeColor: themeColor,
    bounceBackChance: bounceChance,
    rotSpeed: options.rotSpeed || 0.42,
    kickAccuracy: accuracy,
    maxKickSpread: maxSpread
  });

  // 6. Supersonic Concentric Shockwave (Rule 26)
  if (Array.isArray(kicker.shockwaves)) {
    kicker.shockwaves.push({
      x: ball.x,
      y: ball.y,
      maxR: options.shockwaveRadius || 90,
      progress: 0.0,
      speed: 0.07,
      color: themeColor
    });
  }

  // 7. Screen Shake & Audio
  const shake = options.shakeIntensity || cfg.strikerShake || cfg.directVolleyShake || 8;
  triggerGlobalScreenShake(shake, 14);
  playSound('Assets/Sound Effects/Attacks/heavypunch1.mp3', 0.95);

  // 8. Visual Floating Text ("STRIKER!!" / "STRIKER!")
  const shout = options.shoutText || 'STRIKER!!';
  spawnFloatingText(shout, kicker.x, kicker.y - 24, themeColor);

  // 9. Ego Particle Shards
  if (typeof kicker._spawnPuzzleParticles === 'function') {
    kicker._spawnPuzzleParticles(ball.x, ball.y, 10, themeColor);
  }

  return ball;
}

/**
 * Squared perpendicular distance from point (px, py) to line segment (x1, y1)-(x2, y2).
 * Used for continuous swept collision detection of high-velocity soccer ball kicks.
 */
function distToSegmentSquared(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return (px - x1) * (px - x1) + (py - y1) * (py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  return (px - projX) * (px - projX) + (py - projY) * (py - projY);
}

/**
 * Universal Soccer Ball Physics & Target Collision Update Engine.
 * Handles 3D rolling, turf friction, arena ricochet, bank passes,
 * enemy damage, Gojo Infinity barrier checks, and One-Two return bounces.
 *
 * @param {object} ball - Soccer ball entity
 * @param {object} kicker - Primary kicker / owner
 * @param {object} arena - Current arena bounding box
 * @param {object} [cfg={}] - Character config
 * @param {object} [stateRef=state] - Engine state reference
 */
export function updateSoccerBallPhysics(ball, kicker, primaryOpponentOrArena, arenaOrCfg = {}, maybeCfg = {}, stateRef = state) {
  if (!ball) return;

  // Polymorphic argument parsing:
  // Supports (ball, kicker, arena, cfg, stateRef) OR (ball, kicker, primaryOpponent, arena, cfg, stateRef)
  let primaryOpponent = null;
  let arena = null;
  let cfg = {};

  if (primaryOpponentOrArena && typeof primaryOpponentOrArena.width === 'number' && typeof primaryOpponentOrArena.height === 'number') {
    arena = primaryOpponentOrArena;
    cfg = arenaOrCfg || {};
  } else {
    primaryOpponent = primaryOpponentOrArena;
    arena = arenaOrCfg;
    cfg = maybeCfg || {};
  }

  // Resolve active kicker (prefers lastKicker who actively struck the ball)
  const activeKicker = (ball.lastKicker && !ball.lastKicker.isDead) ? ball.lastKicker : (kicker || ball.lastKicker);

  // 0. Process Active "STRIKER!" Knockback Flight & Apply Stun Afterwards
  const pendingTargets = [];
  if (primaryOpponent && primaryOpponent._strikerKnockback && !pendingTargets.includes(primaryOpponent)) {
    pendingTargets.push(primaryOpponent);
  }
  if (stateRef && Array.isArray(stateRef.fighters)) {
    for (let i = 0; i < stateRef.fighters.length; i++) {
      const f = stateRef.fighters[i];
      if (f && f._strikerKnockback && !pendingTargets.includes(f)) {
        pendingTargets.push(f);
      }
    }
  }

  for (let i = 0; i < pendingTargets.length; i++) {
    const target = pendingTargets[i];
    const kb = target._strikerKnockback;
    if (!kb) continue;

    if (target.isDead || (typeof target.hp === 'number' && target.hp <= 0)) {
      delete target._strikerKnockback;
      continue;
    }

    kb.timer--;

    // Keep knockback velocity carrying the target smoothly during flight
    target.vx *= 0.95;
    target.vy *= 0.95;
    if (target.knockbackVx !== undefined) target.knockbackVx = target.vx;
    if (target.knockbackVy !== undefined) target.knockbackVy = target.vy;

    // Check arena wall collision during knockback flight (only if actively moving towards wall)
    let hitWall = false;
    if (arena && typeof arena.x === 'number') {
      const tr = target.r || 25;
      const minX = arena.x + tr;
      const maxX = arena.x + arena.width - tr;
      const minY = arena.y + tr;
      const maxY = arena.y + arena.height - tr;

      if (target.x <= minX && target.vx < 0) {
        target.x = minX;
        hitWall = true;
      } else if (target.x >= maxX && target.vx > 0) {
        target.x = maxX;
        hitWall = true;
      }
      if (target.y <= minY && target.vy < 0) {
        target.y = minY;
        hitWall = true;
      } else if (target.y >= maxY && target.vy > 0) {
        target.y = maxY;
        hitWall = true;
      }
    }

    // When knockback flight expires OR target slams into arena wall:
    if (kb.timer <= 0 || hitWall) {
      const stunDur = kb.stunDuration || 100;
      delete target._strikerKnockback;

      // Apply the stun AFTERWARDS
      if (typeof target.applyParalyze === 'function') {
        target.applyParalyze(stunDur, { isDirectVolley: true, isStriker: true });
      } else {
        target.paralyzeTimer = Math.max(target.paralyzeTimer || 0, stunDur);
      }
      if (typeof target.applyHitStun === 'function') {
        target.applyHitStun(stunDur, { isDirectVolley: true, isStriker: true });
      }

      // Settle velocity into full stun
      target.vx = 0;
      target.vy = 0;
      if (target.knockbackVx !== undefined) target.knockbackVx = 0;
      if (target.knockbackVy !== undefined) target.knockbackVy = 0;

      spawnFloatingText('STUNNED!', target.x, target.y - 32, '#FACC15');
      if (hitWall) {
        spawnSparks(target.x, target.y, 10, '#FACC15');
        triggerGlobalScreenShake(6, 10);
        playSound('Assets/Sound Effects/Attacks/heavypunch1.mp3', 0.8);
      }
    }
  }

  // 1. Position Integration & 3D Spherical Rolling
  ball.x += ball.vx;
  ball.y += ball.vy;
  ball.rotation += ball.rotSpeed;
  stepSoccerBall3DRotation(ball, ball.vx, ball.vy);

  // 1b. Update Epic Striker Ball Electric Comet Trail (Rule 25 compliant)
  if (ball.isStriker || ball.isDirectVolley || ball.isSuperShot) {
    updateStrikerBallTrail(ball);
  } else if ((ball._strikerTrailNodes && ball._strikerTrailNodes.length > 0) || (ball._strikerSparks && ball._strikerSparks.length > 0)) {
    decayStrikerBallTrail(ball);
  }

  // 2. Turf Friction / Rolling Deceleration
  ball.vx *= 0.992;
  ball.vy *= 0.992;
  ball.rotSpeed *= 0.99;
  const currentSpeed = Math.hypot(ball.vx, ball.vy);

  if (currentSpeed < 2.5) {
    ball.isDirectVolley = false;
    ball.isStriker = false;
    ball.isSuperShot = false;
    ball.isKicked = false;
    ball.isKickedByIsagi = false;
  }
  if (currentSpeed < 0.2) {
    ball.vx = 0;
    ball.vy = 0;
    ball.rotSpeed = 0;
    ball.isDirectVolley = false;
    ball.isStriker = false;
    ball.isSuperShot = false;
    ball.isKicked = false;
    ball.isKickedByIsagi = false;
  }

  // 3. Continuous Arena Wall Ricochet
  if (arena) {
    const minX = arena.x + ball.r;
    const maxX = arena.x + arena.width - ball.r;
    const minY = arena.y + ball.r;
    const maxY = arena.y + arena.height - ball.r;

    let bounced = false;
    const restitution = 0.95;

    if (ball.x <= minX) {
      ball.x = minX;
      ball.vx = Math.abs(ball.vx) * restitution;
      ball.vy += (Math.random() - 0.5) * 1.5;
      bounced = true;
    } else if (ball.x >= maxX) {
      ball.x = maxX;
      ball.vx = -Math.abs(ball.vx) * restitution;
      ball.vy += (Math.random() - 0.5) * 1.5;
      bounced = true;
    }
    if (ball.y <= minY) {
      ball.y = minY;
      ball.vy = Math.abs(ball.vy) * restitution;
      ball.vx += (Math.random() - 0.5) * 1.5;
      bounced = true;
    } else if (ball.y >= maxY) {
      ball.y = maxY;
      ball.vy = -Math.abs(ball.vy) * restitution;
      ball.vx += (Math.random() - 0.5) * 1.5;
      bounced = true;
    }

    if (bounced) {
      ball.isRebound = true;
      const themeColor = ball.kickerThemeColor || '#00F0FF';
      spawnSparks(ball.x, ball.y, 8, themeColor);
      playSound('Assets/Sound Effects/Attacks/punch.mp3', 0.55);

      // Bank Pass: Chance to bounce back right to kicker off arena wall
      const shouldBounceBack = Boolean(ball.shouldBounceBackToKicker || ball.shouldBounceBackToIsagi);
      if (shouldBounceBack && activeKicker) {
        const toKicker = Math.atan2(activeKicker.y - ball.y, activeKicker.x - ball.x);
        const returnSpeed = (cfg.egoShotSpeed || 14.5) * 0.85;
        const candVx = Math.cos(toKicker) * returnSpeed;
        const candVy = Math.sin(toKicker) * returnSpeed;
        const movesInward = (ball.x <= minX + 2 && candVx > 0) || (ball.x >= maxX - 2 && candVx < 0) ||
                            (ball.y <= minY + 2 && candVy > 0) || (ball.y >= maxY - 2 && candVy < 0);
        if (movesInward) {
          ball.vx = candVx;
          ball.vy = candVy;
          ball.shouldBounceBackToKicker = false;
          ball.shouldBounceBackToIsagi = false;
          ball.isKicked = false;
          ball.isKickedByIsagi = false;
          ball.isDirectVolley = false;
          ball.isSuperShot = false;
          spawnFloatingText('BANK PASS!', ball.x, ball.y - 18, themeColor);
          if (typeof activeKicker._spawnPuzzleParticles === 'function') {
            activeKicker._spawnPuzzleParticles(ball.x, ball.y, 6, themeColor);
          }
        }
      }
    }
  }

  // 4. Hostile Target Collisions (Lethal ONLY when actively kicked with speed >= 3.0)
  const isLethalKick = Boolean(ball.isKicked || ball.isKickedByIsagi) && currentSpeed >= 3.0;
  if (isLethalKick) {
    const targets = [];
    if (primaryOpponent && primaryOpponent !== activeKicker && !primaryOpponent.isDead && !targets.includes(primaryOpponent)) {
      targets.push(primaryOpponent);
    }
    // Also include primary controller (kicker) if opponent is activeKicker
    if (kicker && kicker !== activeKicker && !kicker.isDead && !targets.includes(kicker)) {
      targets.push(kicker);
    }
    if (stateRef && stateRef.fighters) {
      for (let i = 0; i < stateRef.fighters.length; i++) {
        const f = stateRef.fighters[i];
        if (f && f !== activeKicker && !f.isDead && !targets.includes(f)) {
          const isTeammate = activeKicker && typeof activeKicker.isTeammate === 'function' ? activeKicker.isTeammate(f) : false;
          if (!isTeammate) targets.push(f);
        }
      }
    }
    if (stateRef && stateRef.illusions) {
      for (let i = 0; i < stateRef.illusions.length; i++) {
        const ill = stateRef.illusions[i];
        if (ill && !ill.isDead && ill.owner !== activeKicker) {
          targets.push(ill);
        }
      }
    }

    for (let t = 0; t < targets.length; t++) {
      const target = targets[t];
      const isIsagi = (activeKicker && activeKicker.characterId === 'isagi') || ball.isKickedByIsagi;
      const hitCd = (isIsagi && target._isagiBallHitCooldown !== undefined)
        ? (target._isagiBallHitCooldown || 0)
        : (target._ballHitCooldown || 0);
      if (hitCd > 0) {
        if (target._isagiBallHitCooldown > 0) target._isagiBallHitCooldown--;
        if (target._ballHitCooldown > 0) target._ballHitCooldown--;
        continue;
      }

      const dist = Math.hypot(ball.x - target.x, ball.y - target.y);
      const hitRadius = ball.r + (target.r || 25);
      const sweptDistSq = distToSegmentSquared(
        target.x, target.y,
        ball._lastStepX ?? ball.x, ball._lastStepY ?? ball.y,
        ball.x, ball.y
      );
      const isHit = dist <= hitRadius || sweptDistSq <= hitRadius * hitRadius;

      if (isHit) {
        const themeColor = ball.kickerThemeColor || '#00F0FF';

        // Gojo Limitless Infinity Barrier Check (Rule 1.7)
        if (target.characterId === 'gojo' && target.infinityCooldown <= 0) {
          ball.isKicked = false;
          ball.isKickedByIsagi = false;
          ball.isDirectVolley = false;
          ball.isStriker = false;
          ball.isSuperShot = false;

          const shouldBounceBack = Boolean(ball.shouldBounceBackToKicker || ball.shouldBounceBackToIsagi);
          if (shouldBounceBack && activeKicker) {
            ball.shouldBounceBackToKicker = false;
            ball.shouldBounceBackToIsagi = false;
            const toKickerAngle = Math.atan2(activeKicker.y - ball.y, activeKicker.x - ball.x);
            const returnSpeed = cfg.bounceBackSpeed || 8.5;
            ball.vx = Math.cos(toKickerAngle) * returnSpeed;
            ball.vy = Math.sin(toKickerAngle) * returnSpeed;
            ball.isRebound = true;
            spawnFloatingText('ONE-TWO!', ball.x, ball.y - 18, '#00E5FF');
          } else {
            ball.vx = -ball.vx * 0.4;
            ball.vy = -ball.vy * 0.4;
          }
          spawnSparks(ball.x, ball.y, 10, '#00E5FF');
          playSound('Assets/Sound Effects/Skills/backstab.mp3', 0.6);
          target._isagiBallHitCooldown = 15;
          target._ballHitCooldown = 15;
          break;
        }

        // Damage Calculation
        const kickerCfg = (typeof CONFIG !== 'undefined' && activeKicker && activeKicker.characterId && CONFIG[activeKicker.characterId])
          ? CONFIG[activeKicker.characterId]
          : cfg;
        const isSuper = Boolean(ball.isDirectVolley || ball.isStriker || ball.isSuperShot);
        let damage = isSuper
          ? (kickerCfg.strikerDamage || kickerCfg.directVolleyDamage || 75)
          : (ball.isRebound ? (ball.reboundDamage || kickerCfg.reboundDamage || 32) : (ball.baseDamage || kickerCfg.damage || kickerCfg.pantherShotDamage || kickerCfg.egoShotDamage || 24));

        // Active Ego Mode Damage Multiplier (Attacker Buff)
        const kickerEgoBuffs = getBlueLockEgoBuffs(activeKicker);
        if (kickerEgoBuffs && typeof kickerEgoBuffs.damageMultiplier === 'number') {
          damage = Math.round(damage * kickerEgoBuffs.damageMultiplier);
        }

        // Active Ego Mode Defense Multiplier (Target Buff)
        const targetEgoBuffs = getBlueLockEgoBuffs(target);
        if (targetEgoBuffs && typeof targetEgoBuffs.defenseMultiplier === 'number') {
          damage = Math.round(damage * targetEgoBuffs.defenseMultiplier);
        }

        // Passive Sweet-Spot Distance Bonus & Cooldown Refund
        const flightDist = Math.hypot(ball.x - ball.startX, ball.y - ball.startY);
        const isSweetSpot = flightDist >= (kickerCfg.sweetSpotDistance || cfg.sweetSpotDistance || 180);
        if (isSweetSpot || ball.isRebound) {
          const sweetSpotBonus = (kickerEgoBuffs && typeof kickerEgoBuffs.sweetSpotDamageBonus === 'number')
            ? kickerEgoBuffs.sweetSpotDamageBonus
            : (kickerCfg.sweetSpotDamageBonus || cfg.sweetSpotDamageBonus || 6);
          damage += sweetSpotBonus;
          if (activeKicker && activeKicker.metavisionCooldownTimer !== undefined) {
            activeKicker.metavisionCooldownTimer = Math.max(0, activeKicker.metavisionCooldownTimer - (kickerCfg.cooldownRefundOnRebound || 90));
          }
          if (ball.isRebound) {
            spawnFloatingText('DIRECT SHOT!', ball.x, ball.y - 16, themeColor);
          }
        }

        // Apply Damage via Universal Combat Helper
        applyDamageToTarget(target, damage, activeKicker, { isSoccerKick: true, isSuper, arena });

        // Universal Blue Lock "EGO" Meter Charge on Hit
        if (activeKicker && isBlueLockFighter(activeKicker)) {
          if (isSkillEnabled(kickerCfg.enableEgo, true)) {
            const egoGain = isSuper
              ? (kickerCfg.egoGainPerStrikerHit || kickerCfg.egoGainPerSuperHit || 50)
              : (ball.isRebound ? (kickerCfg.egoGainPerReboundHit || 35) : (kickerCfg.egoGainPerHit || 25));
            gainBlueLockEgo(activeKicker, egoGain, kickerCfg);
          }

          // Hitstop / Kick Impact Slowdown on the Blue Lock kicker upon successful enemy impact
          const hitSlowDur = kickerCfg.ballHitSlowDuration || kickerCfg.kickSlowDuration || 18;
          const hitSlowMult = kickerCfg.ballHitSlowMultiplier || kickerCfg.kickSlowMultiplier || 0.18;
          activeKicker.kickSlowTimer = Math.max(activeKicker.kickSlowTimer || 0, hitSlowDur);
          activeKicker.kickSlowMultiplier = hitSlowMult;
          activeKicker.vx *= hitSlowMult;
          activeKicker.vy *= hitSlowMult;
        }

        // Knockback & Hit Stun Pipeline: Directional Knockback FIRST, then Stun AFTERWARDS
        const wasSuper = isSuper;
        const kbAngle = Math.atan2(ball.vy, ball.vx);
        if (wasSuper) {
          const kbMultiplier = (kickerEgoBuffs && typeof kickerEgoBuffs.strikerKnockbackMultiplier === 'number')
            ? kickerEgoBuffs.strikerKnockbackMultiplier
            : 1.0;
          const kbForce = (kickerCfg.strikerKnockback || kickerCfg.directVolleyKnockback || 20.0) * kbMultiplier;
          const kbDuration = kickerCfg.strikerKnockbackDuration || kickerCfg.directVolleyKnockbackDuration || 14;
          const stunDuration = kickerCfg.strikerStunDuration || kickerCfg.directVolleyStunDuration || 100;

          // 1. Directional Knockback: Launch target flying backwards along the ball trajectory
          const kbVx = Math.cos(kbAngle) * kbForce;
          const kbVy = Math.sin(kbAngle) * kbForce;
          target.vx = kbVx;
          target.vy = kbVy;
          if (target.knockbackVx !== undefined) target.knockbackVx = kbVx;
          if (target.knockbackVy !== undefined) target.knockbackVy = kbVy;
          if (typeof target.applyKnockback === 'function') {
            target.applyKnockback(kbVx, kbVy);
          }
          target.x += Math.cos(kbAngle) * 5.0;
          target.y += Math.sin(kbAngle) * 5.0;

          // Interrupt target's active attacks/channels
          if (typeof target.interruptAttacks === 'function') {
            target.interruptAttacks();
          }

          // Incapacitate target during knockback flight without zeroing their velocity
          target.knockbackStunTimer = Math.max(target.knockbackStunTimer || 0, kbDuration);

          // Register pending striker stun: applied AFTER knockback flight completes
          target._strikerKnockback = {
            timer: kbDuration,
            stunDuration: stunDuration,
            kickerThemeColor: themeColor
          };

          spawnFloatingText('KNOCKBACK!', target.x, target.y - 28, '#38BDF8');

          if (activeKicker && Array.isArray(activeKicker.shockwaves)) {
            activeKicker.shockwaves.push({
              x: target.x,
              y: target.y,
              maxR: 95,
              progress: 0.0,
              speed: 0.08,
              color: themeColor
            });
          }
          triggerGlobalScreenShake(kickerCfg.strikerShake || kickerCfg.directVolleyShake || 8, 14);
          playSound('Assets/Sound Effects/Attacks/heavypunch2.mp3', 0.85);
          ball.isDirectVolley = false;
          ball.isStriker = false;
          ball.isSuperShot = false;
        } else {
          // Basic attack kick impact: Knockback, hit stun, and attack interruption
          const basicKbForce = kickerCfg.kickKnockback || kickerCfg.pantherShotKnockback || 7.5;
          const basicHitStun = kickerCfg.basicHitStun || 16;
          const kbVx = Math.cos(kbAngle) * basicKbForce;
          const kbVy = Math.sin(kbAngle) * basicKbForce;

          target.vx += kbVx;
          target.vy += kbVy;
          if (typeof target.applyKnockback === 'function') {
            target.applyKnockback(kbVx, kbVy);
          }
          if (typeof target.applyHitStun === 'function') {
            target.applyHitStun(basicHitStun);
          } else {
            target.hitStunTimer = Math.max(target.hitStunTimer || 0, basicHitStun);
          }
          if (typeof target.interruptAttacks === 'function') {
            target.interruptAttacks();
          }

          target._isagiBallHitCooldown = 20;
          target._ballHitCooldown = 20;
          playSound('Assets/Sound Effects/Attacks/fleshhit.mp3', 0.7);
        }

        // One-Two Return Pass
        const shouldBounceBack = Boolean(ball.shouldBounceBackToKicker || ball.shouldBounceBackToIsagi);
        if (shouldBounceBack && activeKicker) {
          ball.shouldBounceBackToKicker = false;
          ball.shouldBounceBackToIsagi = false;
          const toKickerAngle = Math.atan2(activeKicker.y - ball.y, activeKicker.x - ball.x);
          const returnSpeed = kickerCfg.bounceBackSpeed || cfg.bounceBackSpeed || 8.5;
          ball.vx = Math.cos(toKickerAngle) * returnSpeed;
          ball.vy = Math.sin(toKickerAngle) * returnSpeed;
          ball.isRebound = true;
          spawnFloatingText('ONE-TWO!', ball.x, ball.y - 18, themeColor);
          if (typeof activeKicker._spawnPuzzleParticles === 'function') {
            activeKicker._spawnPuzzleParticles(ball.x, ball.y, 6, themeColor);
          }
        } else {
          ball.vx = -ball.vx * 0.45;
          ball.vy = -ball.vy * 0.45;
        }

        target._isagiBallHitCooldown = 20;
        target._ballHitCooldown = 20;
        ball.isKicked = false;
        ball.isKickedByIsagi = false;
        ball.isDirectVolley = false;
        ball.isStriker = false;
        ball.isSuperShot = false;

        // Spawn 16-Bit Hit Impact Effect
        if (activeKicker && typeof activeKicker._spawn16BitHitEffect === 'function') {
          const hitX = (ball.x + target.x) * 0.5;
          const hitY = (ball.y + target.y) * 0.5;
          const hitAngle = Math.atan2(target.y - ball.y, target.x - ball.x);
          activeKicker._spawn16BitHitEffect(hitX, hitY, hitAngle, wasSuper);
        }

        spawnSparks(ball.x, ball.y, 12, themeColor);
        break;
      }
    }
  } else if (stateRef && stateRef.fighters) {
    // 5. Non-damaging elastic deflection when ball meets an unkicked fighter
    for (let i = 0; i < stateRef.fighters.length; i++) {
      const f = stateRef.fighters[i];
      if (f && f !== activeKicker && !f.isDead) {
        const isTeammate = activeKicker && typeof activeKicker.isTeammate === 'function' ? activeKicker.isTeammate(f) : false;
        if (!isTeammate) {
          const dist = Math.hypot(ball.x - f.x, ball.y - f.y);
          if (dist < (f.r || 25) + ball.r) {
            const dx = ball.x - f.x;
            const dy = ball.y - f.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = dx / len;
            const ny = dy / len;

            // Ball Kick Steal: If ball is currently being dribbled by an opponent, intercepting the ball triggers a steal attempt!
            if (ball.dribbler && ball.dribbler !== f) {
              const stolen = attemptBallKickSteal(ball.dribbler, f, ball, arena, { nx, ny });
              if (stolen) break;
            }

            ball.x = f.x + nx * ((f.r || 25) + ball.r + 1);
            ball.y = f.y + ny * ((f.r || 25) + ball.r + 1);
            ball.vx = nx * 3.5;
            ball.vy = ny * 3.5;
            ball.isKicked = false;
            ball.isKickedByIsagi = false;
            ball.isDirectVolley = false;
            ball.isStriker = false;
            ball.isSuperShot = false;
            playSound('Assets/Sound Effects/Attacks/punch.mp3', 0.4);
            break;
          }
        }
      }
    }
  }

  // Keep 3D step anchors synchronized
  ball._lastStepX = ball.x;
  ball._lastStepY = ball.y;
  ball._lastStepRot = ball.rotation;
}

/**
 * Resolves physical circle separation and deflection between a fighter and soccer ball.
 *
 * @param {object} ball
 * @param {object} fighter
 * @param {boolean} [isShootingOnCooldown=false]
 */
export function resolveBallFighterDeflection(ball, fighter, isShootingOnCooldown = false) {
  if (!ball || !fighter) return;
  if (isShootingOnCooldown) return;

  ball.isKicked = false;
  ball.isKickedByIsagi = false;

  const dx = ball.x - fighter.x;
  const dy = ball.y - fighter.y;
  const dist = Math.hypot(dx, dy) || 1;
  const minDist = (fighter.r || 25) + (ball.r || 16);

  if (dist < minDist) {
    const nx = dx / dist;
    const ny = dy / dist;
    ball.x = fighter.x + nx * (minDist + 1);
    ball.y = fighter.y + ny * (minDist + 1);
    ball._lastStepX = ball.x;
    ball._lastStepY = ball.y;

    const normalVelocity = ball.vx * nx + ball.vy * ny;
    if (normalVelocity < 0) {
      ball.vx -= 1.6 * normalVelocity * nx;
      ball.vy -= 1.6 * normalVelocity * ny;
      ball.vx += (fighter.vx || 0) * 0.4;
      ball.vy += (fighter.vy || 0) * 0.4;
    }
  }
}

/**
 * Calculates the dynamic dribble control rating (0.0 to 1.0) for a Blue Lock fighter.
 * Higher control yields tighter ball retention, snappier direction changes,
 * and higher poise resistance against losing possession on hits.
 *
 * @param {object} fighter - Blue Lock fighter entity
 * @param {object} [cfg={}] - Character configuration object
 * @returns {number} Effective dribble control rating [0.10, 1.0]
 */
export function getFighterDribbleControl(fighter, cfg = {}) {
  if (!fighter) return 0.75;
  const charId = (fighter.characterId || fighter.type || '').toLowerCase();
  let baseControl = cfg.dribbleControl;
  if (baseControl === undefined) {
    baseControl = (charId === 'isagi') ? 0.96 : (charId === 'chigiri' ? 0.90 : 0.75);
  }

  // Active Blue Lock EGO Awakening elevates ball control to elite levels (+10%)
  if (fighter.isEgoActive) {
    baseControl = Math.min(1.0, baseControl + 0.10);
  }
  // Chigiri Panther Speed Surge sharpens breakaway touch (+8%)
  if (fighter.pantherSpeedBuffTimer && fighter.pantherSpeedBuffTimer > 0) {
    baseControl = Math.min(1.0, baseControl + 0.08);
  }
  // Isagi Flow State maximizes spatial trapping precision (100% flawless control)
  if (fighter.isFlowStateActive) {
    baseControl = 1.0;
  }

  return Math.max(0.10, Math.min(1.0, baseControl));
}

/**
 * Keeps the soccer ball under active control (dribbling & trapping) at the fighter's feet
 * while their basic attack is on cooldown. Different Blue Lock characters exhibit different
 * ball control archetypes (e.g. Isagi's spatial pocket vs Chigiri's mach breakaway pace).
 *
 * @param {object} fighter - Blue Lock fighter entity
 * @param {object} ball - Soccer ball entity
 * @param {object} [arena=null] - Arena bounding box
 * @param {object} [cfg={}] - Character config
 */
export function dribbleSoccerBall(fighter, ball, arena = null, cfg = {}) {
  if (!fighter || !ball) return;
  if (fighter.isDead || (typeof fighter.hp === 'number' && fighter.hp <= 0)) return;
  if (fighter.hitStunTimer > 0 || fighter.paralyzeTimer > 0 || fighter.knockbackStunTimer > 0) return;
  if (fighter._ballHitCooldown > 0 || fighter._isagiBallHitCooldown > 0) return;
  if (isHostileLethalBall(ball, fighter)) return;

  const charId = (fighter.characterId || fighter.type || '').toLowerCase();
  const effectiveControl = getFighterDribbleControl(fighter, cfg);
  const themeColor = fighter.themeColor || fighter.color || '#00F0FF';

  // 1. Initial Trap Registration (First frame of contact)
  if (ball.dribbler !== fighter) {
    spawnSparks(ball.x, ball.y, 4, themeColor);
    playSound('Assets/Sound Effects/Attacks/punch.mp3', 0.35);
  }

  // 2. Dynamic Movement Vector & Direction Alignment
  const fighterSpeed = Math.hypot(fighter.vx || 0, fighter.vy || 0);
  const aimAngle = (fighter.gunAngle !== undefined) ? fighter.gunAngle : (fighter.angle || 0);
  const isMoving = fighterSpeed > 0.5;
  let dribbleAngle = aimAngle;

  if (isMoving) {
    const moveAngle = Math.atan2(fighter.vy || 0, fighter.vx || 0);
    const style = cfg.dribbleStyle || (charId === 'isagi' ? 'spatial_pocket' : 'mach_breakaway');
    if (style === 'spatial_pocket') {
      // Spatial pocket blends aim and motion, keeping ball shielded between feet & target
      const angleDiff = Math.atan2(Math.sin(moveAngle - aimAngle), Math.cos(moveAngle - aimAngle));
      dribbleAngle = aimAngle + angleDiff * 0.40;
    } else {
      // Mach breakaway leads directly along movement line
      dribbleAngle = moveAngle;
    }
  }

  // 3. Rhythmic Foot Touch Cadence & Dynamic Forward Push Cycle
  const touchCadence = cfg.dribbleTouchCadence ?? (charId === 'chigiri' ? 8 : 10);
  const baseDist = (fighter.r || 25) + (ball.r || 16) + 2;
  const leadDist = isMoving ? (cfg.dribbleLeadDistance ?? (charId === 'chigiri' ? 6 : 2)) : 0;
  const pushDistance = isMoving ? (cfg.dribblePushDistance ?? (charId === 'chigiri' ? 22 : 10)) : 0;
  const lateralWobble = isMoving ? (cfg.dribbleLateralWobble ?? (charId === 'chigiri' ? 3.0 : 1.5)) : 0;

  if (isMoving) {
    fighter._dribbleTouchTimer = (fighter._dribbleTouchTimer || 0) + 1;
    if (fighter._dribbleTouchTimer >= touchCadence) {
      // Foot strikes the ball: push forward again!
      fighter._dribbleTouchTimer = 0;
      fighter._dribbleStepCount = (fighter._dribbleStepCount || 0) + 1;

      // Audio & Turf Sparks on foot touch
      spawnSparks(ball.x, ball.y, 3, themeColor);
      playSound('Assets/Sound Effects/Attacks/punch.mp3', 0.22);
      stepSoccerBall3DRotation(ball, (fighter.vx || 0) * 2.2, (fighter.vy || 0) * 2.2);

      // Chigiri Aerodynamic Pink Trail while sprinting with ball
      if (charId === 'chigiri' && (fighter.isPantherSprinting || fighter.pantherSpeedBuffTimer > 0 || fighter.isEgoActive)) {
        if (Array.isArray(fighter.afterImages)) {
          fighter.afterImages.push({
            x: ball.x,
            y: ball.y,
            angle: dribbleAngle,
            r: ball.r || 16,
            alpha: 0.35,
            fadeSpeed: 0.10
          });
        }
      }
      // Isagi Cyan Puzzle Fragments while in Flow State with ball
      else if (charId === 'isagi' && (fighter.isFlowStateActive || fighter.isEgoActive)) {
        if (typeof fighter._spawnPuzzleParticles === 'function') {
          fighter._spawnPuzzleParticles(ball.x, ball.y, 1, '#00F0FF');
        }
      }
    }
  } else {
    fighter._dribbleTouchTimer = 0;
  }

  // 4. Dynamic Distance & Footwork Curve (Ball is pushed ahead then caught back up)
  const t = isMoving ? (fighter._dribbleTouchTimer / touchCadence) : 0;
  const pushCurve = Math.sin(t * Math.PI);
  const currentPushOffset = pushDistance * Math.pow(pushCurve, 0.85);

  // Natural foot alternation (left foot / right foot micro-wobble)
  const footSign = ((fighter._dribbleStepCount || 0) % 2 === 0) ? 1 : -1;
  const currentLateralOffset = Math.sin(t * Math.PI) * lateralWobble * footSign;
  const perpAngle = dribbleAngle + Math.PI / 2;

  const targetDist = baseDist + leadDist + currentPushOffset;
  const targetX = fighter.x + Math.cos(dribbleAngle) * targetDist + Math.cos(perpAngle) * currentLateralOffset;
  const targetY = fighter.y + Math.sin(dribbleAngle) * targetDist + Math.sin(perpAngle) * currentLateralOffset;

  // 5. Snappiness & Follow Rate Scaled by Dribble Control Rating
  const lerpRate = 0.32 + effectiveControl * 0.44;
  ball.x += (targetX - ball.x) * lerpRate;
  ball.y += (targetY - ball.y) * lerpRate;
  ball._lastStepX = ball.x;
  ball._lastStepY = ball.y;

  // Match fighter velocity plus push momentum delta
  const pushVelBoost = isMoving ? (1.0 + (pushDistance / (touchCadence * Math.max(1, fighterSpeed))) * Math.cos(t * Math.PI)) : 1.0;
  ball.vx = (fighter.vx || 0) * Math.max(0.6, pushVelBoost);
  ball.vy = (fighter.vy || 0) * Math.max(0.6, pushVelBoost);
  stepSoccerBall3DRotation(ball, ball.vx, ball.vy);

  // 6. Arena Wall Clamping
  if (arena && typeof arena.x === 'number') {
    const minX = arena.x + ball.r;
    const maxX = arena.x + arena.width - ball.r;
    const minY = arena.y + ball.r;
    const maxY = arena.y + arena.height - ball.r;
    ball.x = Math.max(minX, Math.min(maxX, ball.x));
    ball.y = Math.max(minY, Math.min(maxY, ball.y));
  }

  // 7. Controlled Ball State Flags
  ball.isKicked = false;
  ball.isKickedByIsagi = false;
  ball.isDirectVolley = false;
  ball.isStriker = false;
  ball.isRebound = false;
  ball.isSuperShot = false;
  ball.shouldBounceBackToKicker = false;
  ball.shouldBounceBackToIsagi = false;
  ball.lastKicker = fighter;
  ball.dribbler = fighter;
  ball.effectiveControl = effectiveControl;
}

/**
 * Evaluates and executes the "Ball Kick Steal" mechanic.
 * Triggered when a fighter physically bumps into a Blue Lock fighter who is currently dribbling,
 * or when an opponent physically collides with the ball being dribbled at a player's feet.
 *
 * Mechanically:
 * - Checks whether a steal proc succeeds based on base steal chance and dribbler's control rating.
 * - On success:
 *   1. Dribbler is DISPOSSESSED: ball.dribbler is cleared.
 *   2. Prevents the dribbler from kicking: applies hit stun (stagger), attack interruption, and shootCooldown penalty.
 *   3. Pushes the dribbler backward slightly.
 *   4. Kicks/pushes the ball away:
 *      - If tackler is a Blue Lock striker: tackler steals possession (becomes new dribbler or can counter-kick).
 *      - If tackler is any other fighter: kicks the ball away with kinetic velocity.
 *   5. Emits floating text, audio ('kick.mp3'), and sparks/puzzle particle VFX.
 *
 * @param {object} dribbler - Fighter currently dribbling the soccer ball
 * @param {object} tackler - Fighter bumping into the dribbler or intercepting the ball
 * @param {object} ball - The soccer ball entity
 * @param {object} [arena=null] - Arena bounding box
 * @param {object} [options={}] - Optional tuning overrides (e.g. nx, ny normal vector, forcedSuccess)
 * @returns {boolean} True if a ball kick steal successfully occurred
 */
export function attemptBallKickSteal(dribbler, tackler, ball, arena = null, options = {}) {
  if (!dribbler || !tackler || !ball) return false;
  if (dribbler === tackler || dribbler.id === tackler.id) return false;
  if (dribbler.isDead || tackler.isDead) return false;
  if (typeof dribbler.isTeammate === 'function' && dribbler.isTeammate(tackler)) return false;

  // Dribbler must actively be dribbling/controlling the ball
  if (ball.dribbler !== dribbler) return false;

  // Anti-spam cooldown gate: avoid rolling 60 times/sec during continuous body overlap
  if ((dribbler._ballStealCooldown && dribbler._ballStealCooldown > 0) ||
      (tackler._tackleStealCooldown && tackler._tackleStealCooldown > 0)) {
    return false;
  }

  const dribblerCfg = (typeof CONFIG !== 'undefined' && dribbler.characterId && CONFIG[dribbler.characterId])
    ? CONFIG[dribbler.characterId]
    : {};
  const tacklerCfg = (typeof CONFIG !== 'undefined' && tackler.characterId && CONFIG[tackler.characterId])
    ? CONFIG[tackler.characterId]
    : {};

  // Master toggle check
  if (!isSkillEnabled(dribblerCfg.enableBallSteal, true) && !isSkillEnabled(tacklerCfg.enableBallSteal, true)) {
    return false;
  }

  // Explicit miss flag override (for testing and evasive skills)
  if (tackler.forceMissSteal || dribbler.forceMissSteal || options.forceMiss) {
    dribbler._ballStealCooldown = 18;
    tackler._tackleStealCooldown = 18;
    return false;
  }

  // Calculate dynamic steal chance based on tackler ability vs dribbler control
  const baseChance = tacklerCfg.ballStealChance ?? dribblerCfg.ballStealChance ?? 0.50;
  if (baseChance <= 0) {
    dribbler._ballStealCooldown = 18;
    tackler._tackleStealCooldown = 18;
    return false;
  }
  const dribblerControl = getFighterDribbleControl(dribbler, dribblerCfg); // [0.10, 1.0]
  let stealChance = baseChance * (1.25 - dribblerControl * 0.40);

  // Bonus steal chance if tackler is another Blue Lock striker
  if (isBlueLockFighter(tackler)) {
    stealChance += 0.10;
  }

  // Bonus steal chance if tackler is lunging / dashing in with high velocity
  const isTacklerDashing = Boolean(
    (tackler.isPantherSprinting && (tackler.pantherSprintDashTimer || 0) > 0) ||
    (tackler.isMetavisionDashing && (tackler.metavisionDashTimer || 0) > 0) ||
    (tackler.isBlueLockDashing && (tackler.blueLockDashTimer || 0) > 0) ||
    options.isDashing
  );
  const tacklerSpeed = Math.hypot(tackler.vx || 0, tackler.vy || 0);
  if (tacklerSpeed >= 7.0 || isTacklerDashing) {
    stealChance += 0.15;
  }
  stealChance = Math.max(0.15, Math.min(0.85, stealChance));

  const roll = (typeof options.forcedSuccess === 'boolean')
    ? (options.forcedSuccess ? 0.0 : 1.0)
    : Math.random();

  if (roll > stealChance) {
    // Steal attempt failed: Dribbler successfully shields the ball!
    dribbler._ballStealCooldown = 18;
    tackler._tackleStealCooldown = 18;
    playSound('Assets/Sound Effects/Attacks/punch.mp3', 0.25);
    return false;
  }

  // ─── 1. DISPOSSESS DRIBBLER & APPLY STAGGER (PREVENT KICKING) ───
  ball.dribbler = null;
  dribbler._ballHitCooldown = 25;
  dribbler._isagiBallHitCooldown = 25;
  dribbler._ballStealCooldown = 40;
  tackler._tackleStealCooldown = 40;

  // Prevent dribbler from kicking: shootCooldown penalty + attack interrupt
  const cooldownPenalty = dribblerCfg.ballStealCooldownPenalty || 35;
  dribbler.shootCooldown = Math.max(dribbler.shootCooldown || 0, cooldownPenalty);

  const staggerDuration = dribblerCfg.ballStealStaggerDuration || 16;
  if (typeof dribbler.applyHitStun === 'function') {
    dribbler.applyHitStun(staggerDuration);
  } else {
    dribbler.hitStunTimer = Math.max(dribbler.hitStunTimer || 0, staggerDuration);
  }
  if (typeof dribbler.interruptAttacks === 'function') {
    dribbler.interruptAttacks();
  }

  // Normal displacement bump
  let bumpNx = options.nx;
  let bumpNy = options.ny;
  if (bumpNx === undefined || bumpNy === undefined) {
    const dx = dribbler.x - tackler.x;
    const dy = dribbler.y - tackler.y;
    const dist = Math.hypot(dx, dy) || 1;
    bumpNx = dx / dist;
    bumpNy = dy / dist;
  }
  dribbler.vx += bumpNx * 4.5;
  dribbler.vy += bumpNy * 4.5;

  // ─── 2. KICK / PUSH BALL AWAY & RESOLVE STEAL POSSESSION ───
  const tacklerAngle = (tackler.gunAngle !== undefined)
    ? tackler.gunAngle
    : (tackler.angle !== undefined ? tackler.angle : Math.atan2(tackler.vy || -bumpNy, tackler.vx || -bumpNx));
  const kickSpeed = tacklerCfg.ballStealKickSpeed || dribblerCfg.ballStealKickSpeed || 11.0;
  const tacklerTheme = tackler.themeColor || tackler.color || '#10B981';

  if (isBlueLockFighter(tackler)) {
    // Tackler is a Blue Lock striker! Direct steal of the ball!
    ball.lastKicker = tackler;
    ball.kickerThemeColor = tacklerTheme;
    tackler._ballHitCooldown = 0;
    tackler._isagiBallHitCooldown = 0;

    if (tackler.shootCooldown <= 0) {
      // Ready to kick: Immediate steal-and-shot counter-attack!
      const aimAngle = (dribbler && !dribbler.isDead)
        ? Math.atan2(dribbler.y - tackler.y, dribbler.x - tackler.x)
        : tacklerAngle;
      executeSoccerKick(tackler, ball, aimAngle, kickSpeed * 1.15, {
        isDirectVolley: false,
        themeColor: tacklerTheme,
        bounceBackChance: 0.40,
        rotSpeed: 0.28
      });
      tackler.shootCooldown = tackler.shootCooldownMax || 32;
      spawnFloatingText(tackler.x, tackler.y - (tackler.r || 25) - 14, 'STEAL', tacklerTheme);
    } else {
      // On cooldown: Tackler takes over active dribbling!
      dribbleSoccerBall(tackler, ball, arena, tacklerCfg);
      spawnFloatingText(tackler.x, tackler.y - (tackler.r || 25) - 14, 'STEAL', tacklerTheme);
    }
  } else {
    // Tackler is any other fighter: Tackles and kicks the ball loose into space!
    ball.isKicked = true;
    ball.lastKicker = tackler;
    ball.kickerThemeColor = tacklerTheme;
    ball.vx = Math.cos(tacklerAngle) * kickSpeed;
    ball.vy = Math.sin(tacklerAngle) * kickSpeed;
    ball.x = dribbler.x + Math.cos(tacklerAngle) * ((dribbler.r || 25) + ball.r + 6);
    ball.y = dribbler.y + Math.sin(tacklerAngle) * ((dribbler.r || 25) + ball.r + 6);
    ball.isRebound = false;
    ball.isDirectVolley = false;
    ball.isStriker = false;
    ball.isSuperShot = false;
  }

  // Feedback on dribbler
  spawnFloatingText('DISPOSSESSED!', dribbler.x, dribbler.y - (dribbler.r || 25) - 14, '#EF4444');

  // VFX & SFX
  playSound('Assets/Sound Effects/Attacks/heavypunch2.mp3', 0.8);
  spawnSparks(ball.x, ball.y, 10, tacklerTheme);
  if (typeof dribbler._spawnPuzzleParticles === 'function') {
    dribbler._spawnPuzzleParticles(ball.x, ball.y, 6, dribbler.themeColor || '#EC4899');
  }

  return true;
}

/**
 * Spawns a standardized 16-bit retro arcade hit impact into the given array.
 *
 * @param {Array} effectsArray
 * @param {number} x
 * @param {number} y
 * @param {number} impactAngle
 * @param {object} [options={}]
 */
export function spawn16BitHitEffect(effectsArray, x, y, impactAngle, options = {}) {
  if (!Array.isArray(effectsArray)) return;
  const isDirectVolley = Boolean(options.isDirectVolley);
  const color = options.color || (isDirectVolley ? '#00FF88' : '#00F0FF');

  const particleCount = isDirectVolley ? 12 : 7;
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    const pAngle = impactAngle + (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = (2.5 + Math.random() * 4.5) * (isDirectVolley ? 1.4 : 1.0);
    particles.push({
      vx: Math.cos(pAngle) * speed,
      vy: Math.sin(pAngle) * speed,
      size: 2.0 + Math.random() * 2.0,
      color: (i % 2 === 0) ? color : '#FFFFFF'
    });
  }

  effectsArray.push({
    x,
    y,
    angle: impactAngle,
    timer: isDirectVolley ? 18 : 12,
    maxTimer: isDirectVolley ? 18 : 12,
    isDirectVolley,
    color,
    particles
  });
}

/**
 * Spawns procedural ego puzzle piece particles into the given array.
 *
 * @param {Array} particlesArray
 * @param {number} x
 * @param {number} y
 * @param {number} [count=4]
 * @param {string} [color='#00F0FF']
 */
export function spawnPuzzleParticles(particlesArray, x, y, count = 4, color = '#00F0FF') {
  if (!Array.isArray(particlesArray)) return;
  for (let i = 0; i < count; i++) {
    const pAngle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 3.5;
    particlesArray.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 12,
      vx: Math.cos(pAngle) * speed,
      vy: Math.sin(pAngle) * speed,
      size: 6.0 + Math.random() * 4.5,
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.25,
      timer: 24 + Math.floor(Math.random() * 14),
      maxTimer: 38,
      color: color
    });
  }
}
