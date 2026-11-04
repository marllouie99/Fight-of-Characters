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
import { stepSoccerBall3DRotation } from '../graphics/weapons/soccerBallGraphics.js';

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
      armorPenetration: 0.30,
      guaranteedCrit: true
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
      guaranteedCrit: true,
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
      spawnFloatingText('EGO EXHAUSTED', fighter.x, fighter.y - 24, '#94A3B8');
      if (typeof fighter.onEgoEnd === 'function') {
        fighter.onEgoEnd(cfg);
      }
    }
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
 * Checks whether a fighter is within physical reach to kick the soccer ball.
 *
 * @param {object} fighter
 * @param {object} ball
 * @param {number} [reachMargin=16]
 * @returns {boolean}
 */
export function checkFighterCanKickBall(fighter, ball, reachMargin = 16) {
  if (!fighter || !ball) return false;
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
    if (egoBuffs.guaranteedCrit) {
      options.isCrit = true;
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
  ball.isCrit = Boolean(options.isCrit || isStrikerShot || (egoBuffs && egoBuffs.guaranteedCrit));
  ball.isDirectVolley = isStrikerShot;
  ball.isStriker = isStrikerShot;
  ball.isSuperShot = isStrikerShot;
  ball.isRebound = Boolean(options.isRebound);
  ball.isKicked = true;
  ball.isKickedByIsagi = (kicker.characterId === 'isagi');

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
    isCrit: true,
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
          activeKicker.shootCooldown = 0; // Ready next return volley kick!
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

      if (dist <= hitRadius) {
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
            activeKicker.shootCooldown = 0;
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
        const isSuper = Boolean(ball.isDirectVolley || ball.isStriker || ball.isSuperShot);
        let damage = isSuper
          ? (cfg.strikerDamage || cfg.directVolleyDamage || 75)
          : (ball.isRebound ? (ball.reboundDamage || 32) : (ball.baseDamage || 24));

        if (ball.isCrit) {
          damage = Math.round(damage * (cfg.flowShotCritMult || 1.35));
        }

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
        const isSweetSpot = flightDist >= (cfg.sweetSpotDistance || 180);
        if (isSweetSpot || ball.isRebound) {
          const sweetSpotBonus = (kickerEgoBuffs && typeof kickerEgoBuffs.sweetSpotDamageBonus === 'number')
            ? kickerEgoBuffs.sweetSpotDamageBonus
            : (cfg.sweetSpotDamageBonus || 6);
          damage += sweetSpotBonus;
          if (activeKicker && activeKicker.metavisionCooldownTimer !== undefined) {
            activeKicker.metavisionCooldownTimer = Math.max(0, activeKicker.metavisionCooldownTimer - (cfg.cooldownRefundOnRebound || 90));
          }
          if (ball.isRebound) {
            spawnFloatingText('DIRECT SHOT!', ball.x, ball.y - 16, themeColor);
          }
        }

        // Apply Damage via Universal Combat Helper
        applyDamageToTarget(target, damage, activeKicker, arena);

        // Universal Blue Lock "EGO" Meter Charge on Hit
        if (activeKicker && isBlueLockFighter(activeKicker)) {
          const kickerCfg = (typeof CONFIG !== 'undefined' && activeKicker.characterId && CONFIG[activeKicker.characterId])
            ? CONFIG[activeKicker.characterId]
            : cfg;
          if (isSkillEnabled(kickerCfg.enableEgo, true)) {
            const egoGain = isSuper
              ? (kickerCfg.egoGainPerStrikerHit || kickerCfg.egoGainPerSuperHit || 50)
              : (ball.isRebound ? (kickerCfg.egoGainPerReboundHit || 35) : (kickerCfg.egoGainPerHit || 25));
            gainBlueLockEgo(activeKicker, egoGain, kickerCfg);
          }
        }

        // Knockback & Hit Stun Pipeline: Directional Knockback FIRST, then Stun AFTERWARDS
        const wasSuper = isSuper;
        const kbAngle = Math.atan2(ball.vy, ball.vx);
        if (wasSuper) {
          const kbMultiplier = (kickerEgoBuffs && typeof kickerEgoBuffs.strikerKnockbackMultiplier === 'number')
            ? kickerEgoBuffs.strikerKnockbackMultiplier
            : 1.0;
          const kbForce = (cfg.strikerKnockback || cfg.directVolleyKnockback || 20.0) * kbMultiplier;
          const kbDuration = cfg.strikerKnockbackDuration || cfg.directVolleyKnockbackDuration || 14;
          const stunDuration = cfg.strikerStunDuration || cfg.directVolleyStunDuration || 100;

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
              color: '#00FF88'
            });
          }
          triggerGlobalScreenShake(cfg.strikerShake || cfg.directVolleyShake || 8, 14);
          playSound('Assets/Sound Effects/Attacks/heavypunch2.mp3', 0.85);
          ball.isDirectVolley = false;
          ball.isStriker = false;
          ball.isSuperShot = false;
        } else {
          target.vx += Math.cos(kbAngle) * 5.5;
          target.vy += Math.sin(kbAngle) * 5.5;
          playSound('Assets/Sound Effects/Attacks/fleshhit.mp3', 0.7);
        }

        // One-Two Return Pass
        const shouldBounceBack = Boolean(ball.shouldBounceBackToKicker || ball.shouldBounceBackToIsagi);
        if (shouldBounceBack && activeKicker) {
          ball.shouldBounceBackToKicker = false;
          ball.shouldBounceBackToIsagi = false;
          const toKickerAngle = Math.atan2(activeKicker.y - ball.y, activeKicker.x - ball.x);
          const returnSpeed = cfg.bounceBackSpeed || 8.5;
          ball.vx = Math.cos(toKickerAngle) * returnSpeed;
          ball.vy = Math.sin(toKickerAngle) * returnSpeed;
          ball.isRebound = true;
          activeKicker.shootCooldown = 0; // Ready return volley!
          spawnFloatingText('ONE-TWO!', ball.x, ball.y - 18, themeColor);
          if (typeof activeKicker._spawnPuzzleParticles === 'function') {
            activeKicker._spawnPuzzleParticles(ball.x, ball.y, 6, themeColor);
          }
        } else {
          ball.vx = -ball.vx * 0.45;
          ball.vy = -ball.vy * 0.45;
        }

        target._isagiBallHitCooldown = 18;
        target._ballHitCooldown = 18;
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
          activeKicker._spawn16BitHitEffect(hitX, hitY, hitAngle, wasSuper, ball.isCrit);
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
  const isCrit = Boolean(options.isCrit);
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
    isCrit,
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
