// ─────────────────────────────────────────────
// Ender Dragon — Ruler of The End Fighter Entity
// Authentic Void Flight Physics & Multi-Skill Combat State Machine
// ─────────────────────────────────────────────
import { Fighter, applyDamageToTarget } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { ARENA_VERTICAL } from '../../configs/arenaConstants.js';
import { enderDragonConfig } from '../../configs/characters/enderDragonConfig.js';
import {
  drawEnderDragonSkin,
  drawDragonAcidPool,
  drawMinecraftDragonFireball,
  drawMinecraftBreathStream,
} from '../../graphics/fighters/enderDragonSkin.js';
import { state, triggerGlobalScreenShake, spawnFloatingText } from '../../core/state.js';
import { spawnSparks, spawnImpactFlash, spawnMeleeClashShockwave } from '../../graphics/particles/sparkEffect.js';
import { projectileSystem } from '../../systems/projectileSystem.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { EndCrystalEntity, getCornerEndCrystals, drawCrystalHealingTetherBeams } from '../EndCrystalEntity.js';

export const DRAGON_STATE = {
  HOVER: 'HOVER',
  PATROL: 'PATROL',                   // Dynamic sweeping perimeter patrols
  ALTITUDE_SHIFT: 'ALTITUDE_SHIFT',   // Multi-dimensional sudden altitude shifts
  INTERCEPT: 'INTERCEPT',             // Dynamic target interception & kinetic space control
  PERCH_DESCENT: 'PERCH_DESCENT',     // Grounded Intermission: Descent to anchor point
  PERCH_GROUNDED: 'PERCH_GROUNDED',   // Grounded Intermission: Perched on floor
  PERCH_TAKEOFF: 'PERCH_TAKEOFF',     // Grounded Intermission: Power flap takeoff
  FIREBALL_SPIT: 'FIREBALL_SPIT',
  SWOOP_WINDUP: 'SWOOP_WINDUP',
  SWOOP_DASH: 'SWOOP_DASH',
  SWOOP_RECOVERY: 'SWOOP_RECOVERY',
  CATACLYSM_CHANNEL: 'CATACLYSM_CHANNEL',
  // ── Off-Screen Telegraphed Divebomb Strafe ──
  DIVEBOMB_SETUP: 'DIVEBOMB_SETUP',         // Fly off-screen to setup attack vector
  DIVEBOMB_TELEGRAPH: 'DIVEBOMB_TELEGRAPH', // Hover off-screen & project ground danger corridor
  DIVEBOMB_STRIKE: 'DIVEBOMB_STRIKE',       // Extreme-velocity strafe through arena
  DIVEBOMB_RECOVERY: 'DIVEBOMB_RECOVERY',   // Decelerate off-screen on exit & bank back
};

export class EnderDragonFighter extends Fighter {
  constructor(def) {
    super(def);
    this.characterId = 'ender_dragon';
    this.type = 'ender_dragon';

    if (def?.customConfig) this.customConfig = def.customConfig;
    const cfg = this._getConfig();

    this.color = cfg.color || '#18181B';
    this.themeColor = cfg.themeColor || '#C026D3';
    this.damageNumberColor = cfg.themeColor || '#C026D3';

    // Circle Fighter Model: Hide generic firearms and humanoid hands (pure draconic form)
    this.hideHands = true;
    this.hideGun = true;
    this.hideFrontHand = true;
    this.hideBackHand = true;
    this.gunAngle = Math.PI / 2;
    this.angle = Math.PI / 2;

    // Arena Physics & Entity Collisions (Rule 1.2)
    this.isGhostTerrain = false;
    this.immuneToKnockback = false;
    this.immuneToPush = false;
    this.immuneToCC = false;

    // Authentic Minecraft Ender Dragon SFX & Sound Hooks
    this.suppressFaahDeathSound = true;
    this.suppressFaahOnDeath = true;
    this._hurtSoundCooldownTimer = 0;
    this._wingFlapToggle = false;

    // Wing Animation & SFX Synchronization Engine
    this.wingAnimTick = 0;
    this.wingFrameIndex = 0;
    this.prevWingFrameIndex = -1;
    this.groundedRestTick = 0;

    // ── General Movement Behavior State (Pillars 1-4) ──
    // Altitude & Simulated 3D Depth
    this.altitude = 1.0; // 0.0 = Grounded, 1.0 = Cruise, 1.7 = High Soaring
    this.targetAltitude = 1.0;
    this.altitudeTimer = 240 + Math.floor(Math.random() * 120);
    this.isGrounded = false;

    // Pillar 1: Dynamic Flight Paths & Perimeter Patrol
    this.patrolAngle = Math.random() * Math.PI * 2;
    this.patrolDirection = Math.random() < 0.5 ? 1 : -1;
    this.patrolWobbleTime = Math.random() * Math.PI * 2;

    // Pillar 2: Target Interception & Momentum Space Control
    this.interceptCooldown = 280 + Math.floor(Math.random() * 140);
    this.isIntercepting = false;
    this.interceptTargetAngle = 0;
    this.interceptHitFighters = new Set();

    // Pillar 3: Grounded Intermissions (Perching at Central Anchor)
    this.perchCooldown = 700 + Math.floor(Math.random() * 300); // Initial perch after ~12s
    this.perchBreathTimer = 0;

    // Pillar 4: Environmental Reactivity & Health Phases
    this.currentPhase = 1;
    this.phaseSpeedMult = 1.0;

    // AI State Machine
    this.aiState = DRAGON_STATE.PATROL;
    this.stateTimer = 180;
    this.hoverOrbitTime = Math.random() * Math.PI * 2;
    this.hoverPhase = Math.random() * Math.PI * 2;

    // Skill Cooldowns
    this.fireballCooldown = Math.floor(Math.random() * 60);
    this.swoopCooldown = 120 + Math.floor(Math.random() * 90);
    this.cataclysmCooldown = 300 + Math.floor(Math.random() * 120);
    this.divebombCooldown = 200 + Math.floor(Math.random() * 100);

    // Swoop mechanics
    this.isSwooping = false;
    this.committedAimAngle = 0;
    this.afterImages = [];
    this.hitOpponentThisSwoop = false;

    // Telegraphed Off-Screen Divebomb Strafe mechanics
    this.isTelegraphingDivebomb = false;
    this.isDivebombing = false;
    this.divebombStartX = 0;
    this.divebombStartY = 0;
    this.divebombEndX = 0;
    this.divebombEndY = 0;
    this.divebombAngle = 0;
    this.divebombTelegraphProgress = 0;
    this.divebombTelegraphMax = 55;
    this.divebombHitFighters = new Set();
    this.draggedVictims = new Set();
    this.divebombAcidTimer = 0;

    // Cataclysm mechanics
    this.isChannelingCataclysm = false;
    this.cataclysmProgress = 0;
    this.hasRoaredThisCataclysm = false;

    // Lingering Acid Pools & 360° Breath Streams
    this.acidPools = [];
    this.breathStreams = [];

    // Dragon Breath (Skill 1) 360 mechanics
    this.isBreathingFire = false;
    this.breathStartAngle = 0;
    this.breathSpinDuration = 0;
    this.breathRecoveryFrames = 0;
    this.breathTotalFrames = 0;
    this.breathFireInterval = 2;

    this._registerSkills();
  }

  /**
   * Natural Fighter Arena Wall Bouncing Physics (Rule 1.2):
   * Ender Dragon moves and bounces naturally inside the arena walls with randomized deflection angles
   * and speed normalization, just like a standard fighter.
   * Unrestricted off-screen transit is permitted exclusively during cinematic divebomb strikes.
   */
  resolveWallBounce(arena, opponent) {
    if (!arena && typeof state !== 'undefined') arena = state.arena;
    if (!arena) return false;

    // Rule 1.2: Standard CC trapping delegates to super
    if (typeof this.isCaughtInBeam === 'function' && (this.isCaughtInBeam() || this.isDraggedByGetsuga || this.isWallPinnedByMakima || this.isWallPinnedBySaitama)) {
      return super.resolveWallBounce(arena, opponent);
    }

    // Suppress wall bouncing and jitter while stationary during 360° dragon breath
    if (this.isBreathingFire || this.aiState === DRAGON_STATE.FIREBALL_SPIT) {
      return false;
    }

    // Allow unrestricted off-screen flight and transit during divebomb sequence
    if (this.isTelegraphingDivebomb || this.isDivebombing || this.aiState === DRAGON_STATE.DIVEBOMB_SETUP || this.aiState === DRAGON_STATE.DIVEBOMB_TELEGRAPH || this.aiState === DRAGON_STATE.DIVEBOMB_STRIKE || this.aiState === DRAGON_STATE.DIVEBOMB_RECOVERY) {
      return false;
    }

    const bounced = super.resolveWallBounce(arena, opponent);
    if (bounced) {
      const spd = Math.hypot(this.vx, this.vy);
      if (spd > 0.5) {
        const moveAngle = Math.atan2(this.vy, this.vx);
        this.gunAngle = moveAngle;
        this.angle = moveAngle;
      }
    }
    return bounced;
  }

  /**
   * Standard Movement Physics (Rule 1.2):
   * Ensures the dragon continuously faces forward along its flight trajectory
   * rather than spinning like a top.
   */
  applyMovementPhysics(extraMultiplier = 1) {
    if (this.isBreathingFire || this.aiState === DRAGON_STATE.FIREBALL_SPIT || this.isTelegraphingDivebomb || this.aiState === DRAGON_STATE.DIVEBOMB_TELEGRAPH) {
      this.vx = 0;
      this.vy = 0;
      this.knockbackVx = 0;
      this.knockbackVy = 0;
      return;
    }
    super.applyMovementPhysics(extraMultiplier);
    const spd = Math.hypot(this.vx, this.vy);
    if (spd > 0.5 && !this.isTelegraphingDivebomb && !this.isChannelingCataclysm && this.aiState !== DRAGON_STATE.PERCH_GROUNDED && this.aiState !== DRAGON_STATE.FIREBALL_SPIT && this.aiState !== DRAGON_STATE.DIVEBOMB_RECOVERY) {
      const moveAngle = Math.atan2(this.vy, this.vx);
      this.gunAngle = moveAngle;
      this.angle = moveAngle;
    }
  }

  reset() {
    super.reset();
    this.aiState = DRAGON_STATE.PATROL;
    this.stateTimer = 0;
    this.altitude = 1.0;
    this.targetAltitude = 1.0;
    this.z = 20;
    this.currentPhase = 1;
    this.phaseSpeedMult = 1.0;
    this.wingAnimTick = 0;
    this.wingFrameIndex = 0;
    this.prevWingFrameIndex = -1;
    this.groundedRestTick = 0;

    // Natural linear movement initialization (Rule 1.2)
    const baseSpeed = this.speed || 4.4;
    const startAngle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(startAngle) * baseSpeed;
    this.vy = Math.sin(startAngle) * baseSpeed;
    this.gunAngle = startAngle;
    this.angle = startAngle;

    this.fireballCooldown = 120 + Math.floor(Math.random() * 80);
    this.swoopCooldown = 240 + Math.floor(Math.random() * 100);
    this.cataclysmCooldown = 600 + Math.floor(Math.random() * 200);
    this.divebombCooldown = 200 + Math.floor(Math.random() * 100);
    this.isSwooping = false;
    this.isIntercepting = false;
    this.isDivebombing = false;
    this.isBreathingFire = false;
    this.breathSpinDuration = 0;
    this.breathRecoveryFrames = 0;
    this.breathTotalFrames = 0;
    this.isTelegraphingDivebomb = false;
    this.isChannelingCataclysm = false;
    this.isGrounded = false;
    this.acidPools = [];
    this.breathStreams = [];
    this.breathAnchorX = undefined;
    this.breathAnchorY = undefined;
    this.breathAnchorAltitude = undefined;
    this.breathElapsed = undefined;
    this.breathSpinTotal = undefined;
    this.afterImages = [];
    if (this.draggedVictims) this.draggedVictims.clear();
    if (this.divebombHitFighters) this.divebombHitFighters.clear();
    this._hasSpawnedCornerCrystals = false;
  }

  _ensureCornerEndCrystals(arena) {
    if (typeof state === 'undefined' || !Array.isArray(state.fighters)) return;
    if (state.activeFocMap && state.activeFocMap.id === 'foc_ender_dragon_map') return;
    if (this._hasSpawnedCornerCrystals) return;

    const cfg = this._getConfig();
    if (!this.isSkillEnabled(cfg.enableCornerCrystals, true)) return;

    const existingCount = state.fighters.filter(f => f && f.isEndCrystal && f.hp > 0).length;
    if (existingCount >= 4) {
      this._hasSpawnedCornerCrystals = true;
      return;
    }

    const curArena = arena || (typeof state !== 'undefined' ? state.arena : null) || (typeof CONFIG !== 'undefined' ? CONFIG.arena : null) || ARENA_VERTICAL;
    const cornerDefs = getCornerEndCrystals(curArena);
    // Remove stale/residual crystals first
    state.fighters = state.fighters.filter(f => !f.isEndCrystal);
    for (let cDef of cornerDefs) {
      const crystal = new EndCrystalEntity(cDef.x, cDef.y, cDef.id, cDef.name);
      state.fighters.push(crystal);
    }
    this._hasSpawnedCornerCrystals = true;
  }

  _getConfig() {
    if (this.customConfig) return this.customConfig;
    if (this._def?.customConfig) return this._def.customConfig;
    if (this.bossConfig) return this.bossConfig;
    if (typeof CONFIG !== 'undefined' && CONFIG.ender_dragon) return CONFIG.ender_dragon;
    return enderDragonConfig;
  }

  /**
   * Overrides base Fighter.shoot() to suppress default generic bullet projectiles (Rule 23).
   */
  shoot(ownerIndex) {
    // Intentionally empty: Ender Dragon uses dedicated flight, fireballs, wing buffet, and divebombs
  }

  _playAudio(key, fallbackSrc, customVol = null, speed = 1.0) {
    const cfg = this._getConfig();
    const src = (cfg.sounds && cfg.sounds[key]) || fallbackSrc;
    if (!src) return;
    const vol = (customVol !== null && customVol !== undefined)
      ? customVol
      : ((cfg.soundVolumes && cfg.soundVolumes[key] !== undefined) ? cfg.soundVolumes[key] : 0.85);
    if (vol <= 0) return;
    try {
      if (typeof audioSystem !== 'undefined' && audioSystem.playSFX) {
        audioSystem.playSFX(src, vol, speed);
      }
    } catch (_) {}
  }

  _playWingFlapAudio(customVol = null, speed = 1.0) {
    this._wingFlapToggle = !this._wingFlapToggle;
    const key = this._wingFlapToggle ? 'wingFlap' : 'wingFlap2';
    const fallback = this._wingFlapToggle
      ? 'Assets/Sound Effects/EnderdragonSFX/Ender_dragon_flap2.ogg'
      : 'Assets/Sound Effects/EnderdragonSFX/Ender_dragon_flap5.ogg';
    this._playAudio(key, fallback, customVol, speed);
  }

  _playRandomExplosionAudio(defaultVol = 0.90) {
    const expIdx = Math.floor(Math.random() * 4) + 1;
    const key = `explosion${expIdx}`;
    const fallback = `Assets/Sound Effects/EnderdragonSFX/Explosion${expIdx}.ogg`;
    this._playAudio(key, fallback, defaultVol);
  }

  _playRandomHurtAudio(defaultVol = 0.85) {
    const hurtIdx = Math.floor(Math.random() * 4) + 1;
    const key = `hurt${hurtIdx}`;
    const fallback = `Assets/Sound Effects/EnderdragonSFX/Ender_dragon_hurt${hurtIdx}.ogg`;
    this._playAudio(key, fallback, defaultVol);
  }

  _registerSkills() {
    const cfg = this._getConfig();
    this.skills = [];

    if (this.isSkillEnabled(cfg.enableFireball, cfg.enableDragonsBreath, true)) {
      this.skills.push({
        id: 'dragonsBreath',
        name: "Dragon's Breath",
        cooldown: cfg.fireballCooldown || 480,
        currentCooldown: this.fireballCooldown || 0,
        icon: '🟣',
        desc: "Halts movement and unleashes a continuous 360° stream of Dragon's Breath surrounding the dragon in void acid, then resumes flight.",
      });
    }

    if (this.isSkillEnabled(cfg.enableSwoop, cfg.enableWingBuffet, true)) {
      this.skills.push({
        id: 'wingBuffet',
        name: 'Wing Buffet',
        cooldown: cfg.swoopCooldown || 540,
        currentCooldown: this.swoopCooldown || 0,
        icon: '🦇',
        desc: "Performs a high-velocity aerial swoop launching enemies with massive kinetic force.",
      });
    }

    if (this.isSkillEnabled(cfg.enableDivebomb, cfg.enableVoidDivebomb, true)) {
      this.skills.push({
        id: 'divebombStrafe',
        name: 'Void Divebomb',
        cooldown: cfg.divebombCooldown || 600,
        currentCooldown: this.divebombCooldown || 0,
        icon: '⚡',
        desc: "Hovers off-screen, divebombs across the arena dragging victims into a wall slam, and chains into a 360° Dragon's Breath Void Acid Sweep.",
      });
    }

    if (this.isSkillEnabled(cfg.enableCataclysm, cfg.enableVoidCataclysm, true)) {
      this.skills.push({
        id: 'voidCataclysm',
        name: 'Void Cataclysm',
        cooldown: cfg.cataclysmCooldown || 1100,
        currentCooldown: this.cataclysmCooldown || 0,
        icon: '🌌',
        isUltimate: true,
        desc: "Ascends to perch, emits an earth-shattering roar, and discharges a 360° void wave.",
      });
    }
  }

  _getValidEnemyOpponent(passedOpponent) {
    if (passedOpponent && passedOpponent.hp > 0 && !passedOpponent.isEndCrystal && !passedOpponent.isBoss && passedOpponent !== this) {
      return passedOpponent;
    }
    const enemies = this._collectAllEnemyTargets();
    if (enemies.length === 0) return null;
    enemies.sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y));
    return enemies[0];
  }

  // ── Stationary Skill & Channeling Guard ──
  isStationarySkillActive() {
    if (this.isBreathingFire || this.aiState === DRAGON_STATE.FIREBALL_SPIT || this.aiState === DRAGON_STATE.PERCH_GROUNDED) {
      return true;
    }
    return super.isStationarySkillActive ? super.isStationarySkillActive() : false;
  }

  // ── Rule 1.4: Committed 360° Skill Aim Lock ──
  canAim() {
    if (this.isBreathingFire || this.aiState === DRAGON_STATE.FIREBALL_SPIT || this.isSwooping || this.isIntercepting || this.isChannelingCataclysm || this.isTelegraphingDivebomb || this.isDivebombing || this.aiState === DRAGON_STATE.SWOOP_DASH || this.aiState === DRAGON_STATE.DIVEBOMB_SETUP || this.aiState === DRAGON_STATE.DIVEBOMB_TELEGRAPH || this.aiState === DRAGON_STATE.DIVEBOMB_STRIKE || this.aiState === DRAGON_STATE.DIVEBOMB_RECOVERY || this.aiState === DRAGON_STATE.PERCH_TAKEOFF) {
      return false;
    }
    return super.canAim ? super.canAim() : true;
  }

  aim(target) {
    if (!this.canAim()) return false;
    const opponent = this._getValidEnemyOpponent(target);
    if (!opponent || opponent.hp <= 0) return false;

    const targetZ = opponent.z || 0;
    const myZ = this.z || (this.altitude ? this.altitude * 18 : 0);
    const targetAngle = Math.atan2((opponent.y - targetZ) - (this.y - myZ), opponent.x - this.x);

    let normAngle = targetAngle;
    while (normAngle > Math.PI) normAngle -= Math.PI * 2;
    while (normAngle < -Math.PI) normAngle += Math.PI * 2;

    this.gunAngle = normAngle;
    this.angle = normAngle;
    if (typeof this.rightGunAngle !== 'undefined') this.rightGunAngle = normAngle;
    if (typeof this.leftGunAngle !== 'undefined') this.leftGunAngle = normAngle;
    return true;
  }

  onCountdown(opponent) {
    const valid = this._getValidEnemyOpponent(opponent);
    if (valid) {
      this.aim(valid);
    }
  }

  // ── Pushback, Pull & Knockback Immunity Guard ──
  applyKnockback(vx, vy, opts = 0) {
    const isDivebombActive = this.isBreathingFire || this.aiState === DRAGON_STATE.FIREBALL_SPIT || this.isTelegraphingDivebomb || this.isDivebombing || this.aiState === DRAGON_STATE.DIVEBOMB_SETUP || this.aiState === DRAGON_STATE.DIVEBOMB_TELEGRAPH || this.aiState === DRAGON_STATE.DIVEBOMB_STRIKE || this.aiState === DRAGON_STATE.DIVEBOMB_RECOVERY || this.isChannelingCataclysm || this.aiState === DRAGON_STATE.CATACLYSM_CHANNEL;
    if (isDivebombActive || this.immuneToKnockback || this.immuneToPush) {
      this.knockbackVx = 0;
      this.knockbackVy = 0;
      return;
    }
    super.applyKnockback(vx, vy, opts);
  }

  applyPull(targetX, targetY, strength) {
    const isDivebombActive = this.isBreathingFire || this.aiState === DRAGON_STATE.FIREBALL_SPIT || this.isTelegraphingDivebomb || this.isDivebombing || this.aiState === DRAGON_STATE.DIVEBOMB_SETUP || this.aiState === DRAGON_STATE.DIVEBOMB_TELEGRAPH || this.aiState === DRAGON_STATE.DIVEBOMB_STRIKE || this.aiState === DRAGON_STATE.DIVEBOMB_RECOVERY || this.isChannelingCataclysm || this.aiState === DRAGON_STATE.CATACLYSM_CHANNEL;
    if (isDivebombActive || this.immuneToPull || this.immuneToPush) {
      return;
    }
    if (typeof super.applyPull === 'function') {
      super.applyPull(targetX, targetY, strength);
    }
  }

  // ── Main Update Loop ──
  update(opponent, ownerIndex, arena) {
    const validOpponent = this._getValidEnemyOpponent(opponent);
    const cfg = this._getConfig();

    // 0. Update visual effects & transient particle lifecycles before freeze guard (Rule 25)
    // (Ensures active dragon breath streams, acid pools & afterimages decay naturally when dragon is immobilized)
    this._updateAcidPools(validOpponent);
    this._updateBreathStreams(validOpponent, cfg);
    this._updateAfterImages();
    if (this._hurtSoundCooldownTimer > 0) this._hurtSoundCooldownTimer--;

    // Dynamic divebomb pushback and pull immunity sync
    const isDivebombActive = this.isTelegraphingDivebomb || this.isDivebombing || this.aiState === DRAGON_STATE.DIVEBOMB_SETUP || this.aiState === DRAGON_STATE.DIVEBOMB_TELEGRAPH || this.aiState === DRAGON_STATE.DIVEBOMB_STRIKE || this.aiState === DRAGON_STATE.DIVEBOMB_RECOVERY || this.isChannelingCataclysm || this.aiState === DRAGON_STATE.CATACLYSM_CHANNEL;
    this.immuneToKnockback = isDivebombActive;
    this.immuneToPush = isDivebombActive;
    this.immuneToPull = isDivebombActive;

    if (isDivebombActive) {
      this.knockbackVx = 0;
      this.knockbackVy = 0;
      this.isDraggedByGetsuga = false;
      this.isWallPinnedByMakima = false;
      this.isWallPinnedBySaitama = false;
      this.caughtInGenosFlurry = false;
      this.caughtInSaitamaFlurry = false;
    }

    // Rule 1.1: Freeze & TimeStop Early Guard
    const isFrozen = (typeof this._handleTimeStop === 'function') ? this._handleTimeStop() : false;
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks();
      return;
    }

    // 0b. Ensure 4 Corner End Crystals are active in arena for Fighter Ender Dragon
    this._ensureCornerEndCrystals(arena);

    // ── Synchronized Draconic Wing Flapping & Flap Audio Engine ──
    this._updateWingFlapCycle(cfg);

    // ── Pillar 4: Environmental Reactivity & HP Phase Check ──
    this._evaluateEnvironmentalReactivity(cfg);

    // ── Multi-Dimensional Altitude Shift Physics ──
    this._updateAltitude(cfg);

    // Tick cooldowns
    if (this.fireballCooldown > 0) this.fireballCooldown--;
    if (this.swoopCooldown > 0) this.swoopCooldown--;
    if (this.cataclysmCooldown > 0) this.cataclysmCooldown--;
    if (this.interceptCooldown > 0) this.interceptCooldown--;
    if (this.perchCooldown > 0) this.perchCooldown--;
    if (this.divebombCooldown > 0) this.divebombCooldown--;

    if (this.skills && this.skills.length > 0) {
      for (const sk of this.skills) {
        if (sk.id === 'dragonsBreath') sk.currentCooldown = this.fireballCooldown;
        else if (sk.id === 'wingBuffet') sk.currentCooldown = this.swoopCooldown;
        else if (sk.id === 'divebombStrafe') sk.currentCooldown = this.divebombCooldown;
        else if (sk.id === 'voidCataclysm') sk.currentCooldown = this.cataclysmCooldown;
      }
    }

    // AI State Machine Execution
    switch (this.aiState) {
      case DRAGON_STATE.PATROL:
        this._updatePatrolState(validOpponent, arena, cfg);
        break;
      case DRAGON_STATE.HOVER:
        this._updateHoverState(validOpponent, arena, cfg);
        break;
      case DRAGON_STATE.ALTITUDE_SHIFT:
        this._updateAltitudeShiftState(validOpponent, arena, cfg);
        break;
      case DRAGON_STATE.INTERCEPT:
        this._updateInterceptState(validOpponent, arena, cfg);
        break;
      case DRAGON_STATE.PERCH_DESCENT:
        this._updatePerchDescent(arena, cfg);
        break;
      case DRAGON_STATE.PERCH_GROUNDED:
        this._updatePerchGrounded(validOpponent, arena, cfg);
        break;
      case DRAGON_STATE.PERCH_TAKEOFF:
        this._updatePerchTakeoff(validOpponent, arena, cfg);
        break;
      case DRAGON_STATE.DIVEBOMB_SETUP:
        this._updateDivebombSetup(validOpponent, arena, cfg);
        break;
      case DRAGON_STATE.DIVEBOMB_TELEGRAPH:
        this._updateDivebombTelegraph(validOpponent, arena, cfg);
        break;
      case DRAGON_STATE.DIVEBOMB_STRIKE:
        this._updateDivebombStrike(validOpponent, arena, cfg);
        break;
      case DRAGON_STATE.DIVEBOMB_RECOVERY:
        this._updateDivebombRecovery(validOpponent, arena, cfg);
        break;
      case DRAGON_STATE.FIREBALL_SPIT:
        this._updateFireballState(validOpponent, cfg);
        break;
      case DRAGON_STATE.SWOOP_WINDUP:
        this._updateSwoopWindup(validOpponent, cfg);
        break;
      case DRAGON_STATE.SWOOP_DASH:
        this._updateSwoopDash(validOpponent, arena, cfg);
        break;
      case DRAGON_STATE.SWOOP_RECOVERY:
        this._updateSwoopRecovery(validOpponent, cfg);
        break;
      case DRAGON_STATE.CATACLYSM_CHANNEL:
        this._updateCataclysmChannel(validOpponent, arena, cfg);
        break;
      default:
        this.aiState = DRAGON_STATE.PATROL;
        break;
    }

    // Centralized Movement & Physics (Rule 1.2)
    const isSpecialHighSpeedState = this.isSwooping || this.isIntercepting || this.isDivebombing ||
      this.aiState === DRAGON_STATE.SWOOP_DASH || this.aiState === DRAGON_STATE.DIVEBOMB_STRIKE ||
      this.aiState === DRAGON_STATE.INTERCEPT || this.aiState === DRAGON_STATE.DIVEBOMB_SETUP ||
      this.aiState === DRAGON_STATE.DIVEBOMB_RECOVERY;

    if (isSpecialHighSpeedState) {
      this.x += this.vx;
      this.y += this.vy;
    } else {
      this.applyMovementPhysics(this.phaseSpeedMult || 1.0);
    }

    // Resolve Arena Wall Bouncing & Obstacle Collisions (Rule 1.2)
    this.resolveWallBounce(arena, validOpponent);
  }

  // ── Pillar 4: Environmental Reactivity & Phase Tracking ──
  _evaluateEnvironmentalReactivity(cfg) {
    const maxHp = this.maxHp || cfg.hp || 520;
    const hpRatio = Math.max(0, this.hp / maxHp);

    let newPhase = 1;
    let newSpeedMult = 1.0;

    if (hpRatio <= (cfg.phase4HpThreshold || 0.25)) {
      newPhase = 4;
      newSpeedMult = cfg.phase4SpeedMult || 1.45;
    } else if (hpRatio <= (cfg.phase3HpThreshold || 0.50)) {
      newPhase = 3;
      newSpeedMult = cfg.phase3SpeedMult || 1.25;
    } else if (hpRatio <= (cfg.phase2HpThreshold || 0.75)) {
      newPhase = 2;
      newSpeedMult = cfg.phase2SpeedMult || 1.12;
    }

    if (newPhase !== this.currentPhase) {
      this.currentPhase = newPhase;
      this.phaseSpeedMult = newSpeedMult;

      // Environmental Enrage Surge Feedback
      triggerGlobalScreenShake(10, 25);
      spawnImpactFlash(this.x, this.y, (this.r || 36) * 3.5, '#C026D3');
      spawnSparks(this.x, this.y, '#F5D0FE', 24, 7.5);
      this._playWingFlapAudio(0.95);

      // Enrage surge: sudden climb & speed boost
      this.targetAltitude = 1.7;
      const surgeSpeed = (this.speed || 4.4) * newSpeedMult;
      const angle = (this.gunAngle !== undefined && !Number.isNaN(this.gunAngle)) ? this.gunAngle : (Math.random() * Math.PI * 2);
      this.vx = Math.cos(angle) * surgeSpeed;
      this.vy = Math.sin(angle) * surgeSpeed;
    }

    // Environmental Support Node / End Crystal Tracking
    if (typeof state !== 'undefined' && state.fighters) {
      const activeCrystals = state.fighters.filter(f => f && f.isEndCrystal && f.hp > 0).length;
      if (this._lastCrystalCount !== undefined && activeCrystals < this._lastCrystalCount) {
        // A crystal was destroyed: immediate evasive reaction & reverse heading
        this.targetAltitude = 1.7;
        triggerGlobalScreenShake(8, 20);
        this._playWingFlapAudio(0.90);
        this.vx = -this.vx;
        this.vy = -this.vy;
        if (Math.hypot(this.vx, this.vy) > 0.5) {
          const moveAngle = Math.atan2(this.vy, this.vx);
          this.gunAngle = moveAngle;
          this.angle = moveAngle;
        }
      }
      this._lastCrystalCount = activeCrystals;
    }
  }

  // ── Synchronized Draconic Wing Flapping & Flap Audio Engine ──
  _updateWingFlapCycle(cfg) {
    const isGrounded = Boolean(this.isGrounded || this.aiState === DRAGON_STATE.PERCH_GROUNDED);
    if (isGrounded) {
      this.groundedRestTick = (this.groundedRestTick || 0) + 1;
      this.wingFrameIndex = 2 + Math.floor((this.groundedRestTick / 12) % 2);
      this.prevWingFrameIndex = this.wingFrameIndex;
      return;
    }

    const isSwooping = Boolean(
      this.isSwooping ||
      this.aiState === DRAGON_STATE.SWOOP_DASH ||
      this.aiState === DRAGON_STATE.INTERCEPT ||
      this.isDivebombing ||
      this.aiState === DRAGON_STATE.DIVEBOMB_STRIKE
    );

    const ticksPerFrame = isSwooping
      ? (cfg.swoopTicksPerFrame || 3)
      : (cfg.spriteTicksPerFrame || 5);

    this.wingAnimTick = (this.wingAnimTick || 0) + 1;
    const prevFrame = (this.wingFrameIndex !== undefined) ? this.wingFrameIndex : -1;
    const numFrames = 6;
    this.wingFrameIndex = Math.floor(this.wingAnimTick / ticksPerFrame) % numFrames;

    // Detect exact frame transition into downstroke
    const downstrokeFrame = (cfg.wingFlapDownstrokeFrame !== undefined) ? cfg.wingFlapDownstrokeFrame : 1;
    if (this.wingFrameIndex !== prevFrame && this.wingFrameIndex === downstrokeFrame) {
      const flapVol = isSwooping ? 0.85 : 0.65;
      const flapSpeed = isSwooping ? 1.20 : 1.0;
      this._playWingFlapAudio(flapVol, flapSpeed);
    }
    this.prevWingFrameIndex = this.wingFrameIndex;
  }

  // ── Altitude & Simulated 3D Depth Engine ──
  _updateAltitude(cfg) {
    if (this.isBreathingFire || this.aiState === DRAGON_STATE.FIREBALL_SPIT || this.isTelegraphingDivebomb || this.aiState === DRAGON_STATE.DIVEBOMB_TELEGRAPH) {
      return;
    }
    if (this.isGrounded) {
      this.targetAltitude = 0.0;
    }

    // Smooth altitude convergence
    this.altitude += (this.targetAltitude - this.altitude) * 0.06;
    this.z = this.altitude * 20;

    // Periodic altitude shift timer
    if (!this.isGrounded && this.aiState === DRAGON_STATE.PATROL) {
      this.altitudeTimer--;
      if (this.altitudeTimer <= 0) {
        this.altitudeTimer = (cfg.altitudeShiftInterval || 300) + Math.floor(Math.random() * 150);
        // Switch between High Soaring (1.7), Cruise (1.0), and Low Skimming (0.4)
        const rand = Math.random();
        if (rand < 0.40) {
          this.targetAltitude = cfg.highAltitude || 1.7;
          this.vx *= 1.25;
          this.vy *= 1.25;
        } else if (rand < 0.75) {
          this.targetAltitude = cfg.cruiseAltitude || 1.0;
        } else {
          this.targetAltitude = cfg.lowAltitude || 0.4;
          // Spawn air skim sparks on floor
          spawnSparks(this.x, this.y, '#E879F9', 4, 3.0);
        }
      }
    }
  }

  // ── Dynamic Linear Roaming & Decision Matrix (No Circling, Bounces Naturally) ──
  _updatePatrolState(opponent, arena, cfg) {
    const curArena = arena || (typeof state !== 'undefined' ? state.arena : null) || (typeof CONFIG !== 'undefined' ? CONFIG.arena : null) || ARENA_VERTICAL;
    const targetSpeed = (this.speed || cfg.speed || 4.4) * (this.phaseSpeedMult || 1.0);

    // Natural linear flight: maintain continuous momentum floor
    const curSpeed = Math.hypot(this.vx, this.vy);
    if (curSpeed < 0.5) {
      const angle = (this.gunAngle !== undefined && !Number.isNaN(this.gunAngle)) ? this.gunAngle : (Math.random() * Math.PI * 2);
      this.vx = Math.cos(angle) * targetSpeed;
      this.vy = Math.sin(angle) * targetSpeed;
    }

    // Align facing with movement direction
    if (curSpeed > 0.5) {
      const moveAngle = Math.atan2(this.vy, this.vx);
      this.gunAngle = moveAngle;
      this.angle = moveAngle;
    }

    // Evaluate Decision Matrix (Gated by Config Toggles)
    const canCataclysm = this.isSkillEnabled(cfg.enableCataclysm, cfg.enableVoidCataclysm, true);
    const canDivebomb = this.isSkillEnabled(cfg.enableDivebomb, cfg.enableVoidDivebomb, true);
    const canIntercept = this.isSkillEnabled(cfg.enableIntercept, true);
    const canSwoop = this.isSkillEnabled(cfg.enableSwoop, cfg.enableWingBuffet, true);
    const canFireball = this.isSkillEnabled(cfg.enableFireball, cfg.enableDragonsBreath, true);
    const canPerch = this.isSkillEnabled(cfg.enablePerch, true);

    if (canCataclysm && this.cataclysmCooldown <= 0 && opponent && opponent.hp > 0) {
      this._initiateCataclysm(opponent, cfg);
    } else if (canDivebomb && this.divebombCooldown <= 0 && opponent && opponent.hp > 0) {
      this._initiateDivebombSetup(opponent, curArena, cfg);
    } else if (canIntercept && this.interceptCooldown <= 0 && opponent && opponent.hp > 0) {
      this._initiateIntercept(opponent, cfg);
    } else if (canSwoop && this.swoopCooldown <= 0 && opponent && opponent.hp > 0) {
      this._initiateSwoopWindup(opponent, cfg);
    } else if (canFireball && this.fireballCooldown <= 0 && opponent && opponent.hp > 0) {
      this._initiateFireball(opponent, cfg);
    } else if (canPerch && this.perchCooldown <= 0 && (!opponent || opponent.hp > 0)) {
      this._initiatePerchDescent(curArena, cfg);
    }
  }

  // ── Pillar 2: Target Interception & Kinetic Space Control ──
  _initiateIntercept(opponent, cfg) {
    this.aiState = DRAGON_STATE.INTERCEPT;
    this.isIntercepting = true;
    this.interceptHitFighters.clear();

    const leadFrames = cfg.interceptLeadFrames || 14;
    const leadX = opponent.x + (opponent.vx || 0) * leadFrames;
    const leadY = opponent.y + (opponent.vy || 0) * leadFrames;

    this.interceptTargetAngle = Math.atan2(leadY - this.y, leadX - this.x);
    this.gunAngle = this.interceptTargetAngle;
    this.angle = this.interceptTargetAngle;

    const speed = (cfg.interceptSpeed || 16.5) * this.phaseSpeedMult;
    this.vx = Math.cos(this.interceptTargetAngle) * speed;
    this.vy = Math.sin(this.interceptTargetAngle) * speed;

    this.stateTimer = 26;
    this._playAudio('swoop', 'Assets/Sound Effects/EnderdragonSFX/Ender_dragon_flap5.ogg', 0.95);
  }

  _updateInterceptState(opponent, arena, cfg) {
    this.stateTimer--;

    // Trail high-speed afterimages
    if (this.stateTimer % 3 === 0) {
      this.afterImages.push({
        x: this.x,
        y: this.y,
        angle: this.interceptTargetAngle,
        alpha: 0.60,
      });
    }

    // Sheer Mass & Momentum Space Control: Gale-Force Wind Buffet
    const reach = cfg.interceptGaleReach || 75;
    const galeDamage = cfg.interceptGaleDamage || 16;
    const galeKnockback = (cfg.interceptGaleKnockback || 16.0) * this.phaseSpeedMult;
    const targets = this._collectAllEnemyTargets();

    for (let target of targets) {
      if (!target || target === this || target.hp <= 0) continue;
      if (this.interceptHitFighters.has(target)) continue;

      const d = Math.hypot(target.x - this.x, target.y - this.y);
      if (d <= reach + (target.r || 20)) {
        this.interceptHitFighters.add(target);

        // Apply gale brush damage & violent displacement impulse
        applyDamageToTarget(target, galeDamage, this);
        spawnFloatingText(target.x, target.y - 15, `-${galeDamage}`, '#C026D3');
        spawnSparks(target.x, target.y, '#E879F9', 10, 4.5);
        triggerGlobalScreenShake(5, 14);

        const pushAngle = Math.atan2(target.y - this.y, target.x - this.x);
        if (typeof target.applyKnockback === 'function') {
          target.applyKnockback(Math.cos(pushAngle) * galeKnockback, Math.sin(pushAngle) * galeKnockback, 12);
        }
        if (typeof target.applyTimeStop === 'function') {
          target.applyTimeStop(6);
        }
      }
    }

    if (this.stateTimer <= 0) {
      this.isIntercepting = false;
      this.targetAltitude = 1.7; // Rebound climb
      this.aiState = DRAGON_STATE.PATROL;
      this.interceptCooldown = (cfg.interceptCooldown || 360) / this.phaseSpeedMult;
      this.vx *= 0.35;
      this.vy *= 0.35;
    }
  }

  // ── Pillar 3: Low-Altitude Center Vortex Strafe Pass ──
  _initiatePerchDescent(arena, cfg) {
    this.aiState = DRAGON_STATE.PERCH_DESCENT;
    this.targetAltitude = 0.35; // Low skimming altitude
    this.stateTimer = 60;
  }

  _updatePerchDescent(arena, cfg) {
    this.stateTimer--;
    const curArena = arena || (typeof state !== 'undefined' ? state.arena : null) || (typeof CONFIG !== 'undefined' ? CONFIG.arena : null) || ARENA_VERTICAL;
    const anchorX = curArena.x + curArena.width / 2;
    const anchorY = curArena.y + curArena.height / 2;

    const dx = anchorX - this.x;
    const dy = anchorY - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    // Smooth gliding swoop inward
    this.vx += (dx / dist) * 0.35 * this.phaseSpeedMult;
    this.vy += (dy / dist) * 0.35 * this.phaseSpeedMult;
    this.gunAngle = Math.atan2(this.vy, this.vx);
    this.angle = this.gunAngle;

    // Enter active vortex strafe once close to center anchor
    if (dist <= 80 || this.stateTimer <= 0) {
      this.aiState = DRAGON_STATE.PERCH_GROUNDED;
      this.isGrounded = false;
      this.altitude = 0.35;
      this.targetAltitude = 0.35;
      this.perchVortexAngle = Math.atan2(this.y - anchorY, this.x - anchorX);
      const baseDuration = cfg.perchGroundedDuration || 110;
      this.stateTimer = Math.max(70, Math.floor(baseDuration / this.phaseSpeedMult));
      this.perchBreathTimer = 18;

      spawnSparks(this.x, this.y, '#A21CAF', 12, 4.0);
    }
  }

  _updatePerchGrounded(opponent, arena, cfg) {
    this.stateTimer--;
    const curArena = arena || (typeof state !== 'undefined' ? state.arena : null) || (typeof CONFIG !== 'undefined' ? CONFIG.arena : null) || ARENA_VERTICAL;
    const cx = curArena.x + curArena.width / 2;
    const cy = curArena.y + curArena.height / 2;

    // Anchor at center of arena with gentle low-altitude hovering (Minecraft perched state)
    const dx = cx - this.x;
    const dy = cy - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > 15) {
      this.vx += (dx / dist) * 0.40 * this.phaseSpeedMult;
      this.vy += (dy / dist) * 0.40 * this.phaseSpeedMult;
    }
    this.vx *= 0.88;
    this.vy *= 0.88;

    // Aim directly at the opponent while perched
    if (opponent && opponent.hp > 0) {
      this.aim(opponent);
    }

    // Low skimming air sparks
    if (Math.random() < 0.35) {
      spawnSparks(this.x, this.y, '#E879F9', 2, 2.5);
    }

    // Exhale sweeping breath sprays during active perch
    this.perchBreathTimer--;
    if (this.perchBreathTimer <= 0) {
      this.perchBreathTimer = cfg.perchBreathCooldown || 35;
      this._exhalePerchBreath(opponent, cfg);
    }

    if (this.stateTimer <= 0) {
      this._initiatePerchTakeoff(cfg);
    }
  }

  _exhalePerchBreath(opponent, cfg) {
    this._playAudio('fireball', 'Assets/Sound Effects/EnderdragonSFX/Ghast_fireball4.ogg', 0.65);
    const baseAngle = this.gunAngle || 0;
    const count = 3;

    for (let i = 0; i < count; i++) {
      const spread = (i - 1) * 0.22;
      const angle = baseAngle + spread;
      this._fireDragonBreathStream(angle, cfg);
    }
  }

  _initiatePerchTakeoff(cfg) {
    this.aiState = DRAGON_STATE.PERCH_TAKEOFF;
    this.isGrounded = false;
    this.targetAltitude = 1.7; // Launch skyward
    this.stateTimer = 22;

    const shockwaveR = cfg.perchTakeoffShockwaveRadius || 160;
    const damage = cfg.perchTakeoffDamage || 24;
    const knockback = (cfg.perchTakeoffKnockback || 18.0) * this.phaseSpeedMult;

    // Audio & Screen Feedback
    this._playWingFlapAudio(0.95);
    triggerGlobalScreenShake(8, 20);
    spawnImpactFlash(this.x, this.y, shockwaveR, '#F5D0FE');
    spawnSparks(this.x, this.y, '#C026D3', 24, 7.0);

    // Radial Wind Blast Knockback on nearby ground targets
    const targets = this._collectAllEnemyTargets();
    for (let target of targets) {
      if (!target || target === this || target.hp <= 0) continue;
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= shockwaveR) {
        const angle = Math.atan2(dy, dx);
        applyDamageToTarget(target, damage, this);
        spawnFloatingText(target.x, target.y - 15, `-${damage}`, '#C026D3');

        if (typeof target.applyTimeStop === 'function') {
          target.applyTimeStop(8);
        }
        if (typeof target.applyKnockback === 'function') {
          target.applyKnockback(Math.cos(angle) * knockback, Math.sin(angle) * knockback, 15);
        }
      }
    }
  }

  _updatePerchTakeoff(opponent, arena, cfg) {
    this.stateTimer--;
    this.vy -= 0.6; // Rapid upward propulsion

    if (this.stateTimer <= 0) {
      this.aiState = DRAGON_STATE.PATROL;
      this.perchCooldown = (cfg.perchInterval || 1200) / this.phaseSpeedMult;
      const targetSpeed = (this.speed || 4.4) * this.phaseSpeedMult;
      const angle = Math.random() * Math.PI * 2;
      this.vx = Math.cos(angle) * targetSpeed;
      this.vy = Math.sin(angle) * targetSpeed;
      this.targetAltitude = 1.0;
    }
  }

  _updateAltitudeShiftState(opponent, arena, cfg) {
    this.aiState = DRAGON_STATE.PATROL;
  }

  // ── High Altitude Cruising & Decision Matrix (Natural Roaming, No Circling) ──
  _updateHoverState(opponent, arena, cfg) {
    if (!opponent || opponent.hp <= 0) {
      this.aiState = DRAGON_STATE.PATROL;
      return;
    }

    this.targetAltitude = cfg.highAltitude || 1.7;
    const curArena = arena || (typeof state !== 'undefined' ? state.arena : null) || (typeof CONFIG !== 'undefined' ? CONFIG.arena : null) || ARENA_VERTICAL;
    const targetSpeed = (this.speed || cfg.speed || 4.4) * (this.phaseSpeedMult || 1.0);

    // Natural linear cruising across arena
    const curSpeed = Math.hypot(this.vx, this.vy);
    if (curSpeed < 0.5) {
      const angle = (this.gunAngle !== undefined && !Number.isNaN(this.gunAngle)) ? this.gunAngle : (Math.random() * Math.PI * 2);
      this.vx = Math.cos(angle) * targetSpeed;
      this.vy = Math.sin(angle) * targetSpeed;
    }

    // Align facing with movement direction
    if (curSpeed > 0.5) {
      const moveAngle = Math.atan2(this.vy, this.vx);
      this.gunAngle = moveAngle;
      this.angle = moveAngle;
    } else {
      this.aim(opponent);
    }

    // Dynamic state transitions (Gated by Config Toggles)
    const canCataclysm = this.isSkillEnabled(cfg.enableCataclysm, cfg.enableVoidCataclysm, true);
    const canDivebomb = this.isSkillEnabled(cfg.enableDivebomb, cfg.enableVoidDivebomb, true);
    const canIntercept = this.isSkillEnabled(cfg.enableIntercept, true);
    const canSwoop = this.isSkillEnabled(cfg.enableSwoop, cfg.enableWingBuffet, true);
    const canFireball = this.isSkillEnabled(cfg.enableFireball, cfg.enableDragonsBreath, true);
    const canPerch = this.isSkillEnabled(cfg.enablePerch, true);

    if (canCataclysm && this.cataclysmCooldown <= 0) {
      this._initiateCataclysm(opponent, cfg);
    } else if (canDivebomb && this.divebombCooldown <= 0) {
      this._initiateDivebombSetup(opponent, curArena, cfg);
    } else if (canSwoop && this.swoopCooldown <= 0) {
      this._initiateSwoopWindup(opponent, cfg);
    } else if (canIntercept && this.interceptCooldown <= 0) {
      this._initiateIntercept(opponent, cfg);
    } else if (canFireball && this.fireballCooldown <= 0) {
      this._initiateFireball(opponent, cfg);
    } else if (canPerch && this.perchCooldown <= 0) {
      this._initiatePerchDescent(curArena, cfg);
    }
  }

  // ── Skill 1: Dragon's Breath / 360° Void Acid Sweep (dragonsBreath) ──
  _initiateFireball(opponent, cfg) {
    this.aiState = DRAGON_STATE.FIREBALL_SPIT;
    this.isBreathingFire = true;

    // 1. Mandatory requirement: Stop movement completely upon activation
    this.vx = 0;
    this.vy = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;

    // 2. Setup 360° sweep duration & post-breath recovery settle frames
    const spinDuration = cfg.dragonsBreathSpinDuration || 72;
    const recoveryDuration = (cfg.dragonsBreathRecoveryFrames !== undefined) ? cfg.dragonsBreathRecoveryFrames : 24;
    this.breathSpinDuration = spinDuration;
    this.breathRecoveryFrames = recoveryDuration;
    this.breathTotalFrames = spinDuration + recoveryDuration;
    this.stateTimer = this.breathTotalFrames;
    this.breathFireInterval = cfg.dragonsBreathFireInterval || 2;

    // Initial aim angle: lock onto opponent if alive, or keep current facing
    if (opponent && opponent.hp > 0) {
      this.breathStartAngle = Math.atan2(opponent.y - this.y, opponent.x - this.x);
    } else {
      this.breathStartAngle = (this.gunAngle !== undefined) ? this.gunAngle : (this.angle || 0);
    }
    this.gunAngle = this.breathStartAngle;
    this.angle = this.breathStartAngle;

    // Anchor position & altitude for organic airborne hovering buoyancy
    this.breathAnchorX = this.x;
    this.breathAnchorY = this.y;
    this.breathAnchorAltitude = (this.altitude !== undefined) ? this.altitude : 1.0;

    // Roar & breath ignition sound
    this._playAudio('fireball', 'Assets/Sound Effects/EnderdragonSFX/Ghast_fireball4.ogg', 0.85);
    spawnImpactFlash(this.x, this.y, (this.r || 36) * 1.5, '#E879F9');
    spawnSparks(this.x + Math.cos(this.gunAngle) * (this.r + 10), this.y + Math.sin(this.gunAngle) * (this.r + 10), '#F5D0FE', 10, 4.0);
  }

  _updateFireballState(opponent, cfg) {
    const spinTotal = this.breathSpinDuration || 72;
    const total = this.breathTotalFrames || (spinTotal + (this.breathRecoveryFrames || 24));
    const elapsed = Math.max(0, total - this.stateTimer);
    this.breathElapsed = elapsed;
    this.breathSpinTotal = spinTotal;

    // Organic airborne hovering buoyancy & natural floating drift (zero shaking)
    if (this.breathAnchorX === undefined) {
      this.breathAnchorX = this.x;
      this.breathAnchorY = this.y;
      this.breathAnchorAltitude = (this.altitude !== undefined) ? this.altitude : 1.0;
    }
    const hoverWave = Math.sin(elapsed * 0.08);
    const hoverLateralWave = Math.cos(elapsed * 0.06);
    this.x = this.breathAnchorX + hoverLateralWave * 1.8;
    this.y = this.breathAnchorY + hoverWave * 2.2;
    this.altitude = this.breathAnchorAltitude + hoverWave * 0.07;
    this.z = this.altitude * 20;

    // 1. Keep gross velocity zero while hovering on anchor
    this.vx = 0;
    this.vy = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;

    if (elapsed < spinTotal) {
      // ── PHASE 1: ACTIVE 360° BREATH DISCHARGE & ROTATION ──
      this.isBreathingFire = true;
      const progress = Math.min(1.0, elapsed / spinTotal);

      // Continuous 360° rotation around the dragon
      const currentAngle = this.breathStartAngle + progress * Math.PI * 2;
      this.gunAngle = currentAngle;
      this.angle = currentAngle;

      // Fire & spread Dragon's Breath streams at rapid interval
      const interval = this.breathFireInterval || 2;
      if (elapsed % interval === 0) {
        this._fireDragonBreathStream(currentAngle, cfg);
      }

      // Periodic breath roar / ghast spit sound
      if (elapsed % 18 === 0 && (spinTotal - elapsed) > 4) {
        this._playAudio('fireball', 'Assets/Sound Effects/EnderdragonSFX/Ghast_fireball4.ogg', 0.70);
      }

      // Maw spark particles at snout
      if (Math.random() < 0.65) {
        const snoutDist = this.r + 8;
        const snoutX = this.x + Math.cos(currentAngle) * snoutDist;
        const snoutY = this.y + Math.sin(currentAngle) * snoutDist;
        spawnSparks(snoutX, snoutY, '#F5D0FE', 2, 2.5);
      }
    } else {
      // ── PHASE 2: POST-BREATH RECOVERY & SETTLE (Frames after breaths before movement) ──
      this.isBreathingFire = false;

      // Lock aim firmly at the final angle of the completed 360° sweep
      const finalAngle = this.breathStartAngle + Math.PI * 2;
      this.gunAngle = finalAngle;
      this.angle = finalAngle;

      // Lingering soft void vapor & cooling embers from snout as maw settles
      const recoveryElapsed = elapsed - spinTotal;
      if (recoveryElapsed % 5 === 0 && Math.random() < 0.60) {
        const snoutDist = this.r + 6;
        const snoutX = this.x + Math.cos(finalAngle) * snoutDist;
        const snoutY = this.y + Math.sin(finalAngle) * snoutDist;
        spawnSparks(snoutX, snoutY, '#E879F9', 1, 1.8);
      }
    }

    this.stateTimer--;

    // 4. Upon completing 360° rotation AND post-breath recovery frames, Ender Dragon resumes movement
    if (this.stateTimer <= 0) {
      this.isBreathingFire = false;
      this.fireballCooldown = cfg.fireballCooldown || 480;

      // Clean up breath anchor & elapsed trackers
      this.breathAnchorX = undefined;
      this.breathAnchorY = undefined;
      this.breathAnchorAltitude = undefined;
      this.breathElapsed = undefined;
      this.breathSpinTotal = undefined;

      // Resume natural movement (Patrol flight mode with forward impulse)
      this.aiState = DRAGON_STATE.PATROL;
      this.stateTimer = 160 + Math.floor(Math.random() * 80);

      const baseSpeed = (this.speed || 4.4) * (this.phaseSpeedMult || 1.0);
      const exitAngle = this.gunAngle || 0;
      this.vx = Math.cos(exitAngle) * baseSpeed;
      this.vy = Math.sin(exitAngle) * baseSpeed;

      // Wing flap sound & thrust wind sparks
      const ticksPerFrame = cfg.swoopTicksPerFrame || 3;
      const downstrokeFrame = (cfg.wingFlapDownstrokeFrame !== undefined) ? cfg.wingFlapDownstrokeFrame : 1;
      this.wingAnimTick = ticksPerFrame * downstrokeFrame;
      this.wingFrameIndex = downstrokeFrame;
      this._playWingFlapAudio(0.85, 1.20);
      spawnSparks(this.x - Math.cos(exitAngle) * this.r, this.y - Math.sin(exitAngle) * this.r, '#E879F9', 10, 4.0);
    }
  }

  _fireDragonBreathStream(angle, cfg) {
    const snoutDist = this.r + 8;
    const startX = this.x + Math.cos(angle) * snoutDist;
    const startY = this.y + Math.sin(angle) * snoutDist;

    // Slight organic spread cone for natural breath flamer look
    const streamAngle = angle + (Math.random() - 0.5) * 0.12;
    const speed = cfg.dragonsBreathStreamSpeed || 8.0;
    const maxDist = cfg.dragonsBreathMaxDistance || 190;
    const damage = cfg.dragonsBreathDamage || 12;
    const radius = cfg.dragonsBreathStreamRadius || 14;

    if (!Array.isArray(this.breathStreams)) this.breathStreams = [];

    this.breathStreams.push({
      x: startX,
      y: startY,
      vx: Math.cos(streamAngle) * speed,
      vy: Math.sin(streamAngle) * speed,
      radius: radius,
      damage: damage,
      color: '#D946EF',
      secondaryColor: '#E879F9',
      maxDistance: maxDist,
      traveled: 0,
    });
  }

  _updateBreathStreams(opponent, cfg) {
    if (!Array.isArray(this.breathStreams) || this.breathStreams.length === 0) return;
    const targets = this._collectAllEnemyTargets(opponent);

    for (let i = this.breathStreams.length - 1; i >= 0; i--) {
      const stream = this.breathStreams[i];
      stream.x += stream.vx;
      stream.y += stream.vy;
      stream.traveled += Math.hypot(stream.vx, stream.vy);

      if (Math.random() < 0.40) {
        spawnSparks(stream.x, stream.y, '#E879F9', 1, 1.8);
      }

      let hitTarget = false;
      for (let target of targets) {
        // STRICT PROHIBITION: Never damage the dragon itself, teammates, crystals, or bosses
        if (!target || target === this || target.hp <= 0 || target.isEndCrystal || target.isBoss) continue;
        if (typeof this.isTeammate === 'function' && this.isTeammate(target)) continue;

        const d = Math.hypot(target.x - stream.x, target.y - stream.y);
        if (d < (target.r || 20) + stream.radius) {
          applyDamageToTarget(target, stream.damage, this);
          spawnSparks(stream.x, stream.y, '#F5D0FE', 6, 3.0);
          target.vx = (target.vx || 0) * 0.85;
          target.vy = (target.vy || 0) * 0.85;
          this._deployAcidPool(stream.x, stream.y, cfg);
          hitTarget = true;
          break;
        }
      }

      if (hitTarget) {
        this.breathStreams.splice(i, 1);
        continue;
      }

      if (stream.traveled >= stream.maxDistance) {
        this._deployAcidPool(stream.x, stream.y, cfg);
        this.breathStreams.splice(i, 1);
      }
    }
  }

  _deployAcidPool(x, y, cfg) {
    const poolRadius = (cfg.acidPoolRadius || 65) * 0.75;
    const duration = Math.floor((cfg.acidPoolDurationFrames || 180) * 0.8);
    const damagePerTick = cfg.acidDamagePerTick || 6;
    const tickInterval = cfg.acidTickInterval || 15;

    // Deduping / clustering: if near an existing pool (< 24px), refresh duration
    for (let pool of this.acidPools) {
      const dist = Math.hypot(pool.x - x, pool.y - y);
      if (dist < 24) {
        pool.duration = Math.max(pool.duration, duration);
        return;
      }
    }

    this.acidPools.push({
      x,
      y,
      radius: poolRadius,
      duration: duration,
      maxDuration: duration,
      tickTimer: 0,
      tickInterval: tickInterval,
      damagePerTick: damagePerTick,
      owner: this,
    });
  }

  // Backward-compatibility alias
  _fireDragonBreath(cfg) {
    this._fireDragonBreathStream(this.gunAngle || 0, cfg);
  }

  // ── Skill 2: Wing Buffet / Kinetic Swoop ──
  _initiateSwoopWindup(opponent, cfg) {
    this.aiState = DRAGON_STATE.SWOOP_WINDUP;
    this.stateTimer = cfg.swoopWindupFrames || 14;
    this.committedAimAngle = Math.atan2(opponent.y - this.y, opponent.x - this.x);
    this.gunAngle = this.committedAimAngle;
    this.angle = this.committedAimAngle;
    this.vx *= 0.3;
    this.vy *= 0.3;

    this._playAudio('swoop', 'Assets/Sound Effects/EnderdragonSFX/Ender_dragon_flap5.ogg', 0.90);
  }

  _updateSwoopWindup(opponent, cfg) {
    this.stateTimer--;
    if (this.stateTimer <= 0) {
      this.aiState = DRAGON_STATE.SWOOP_DASH;
      this.stateTimer = cfg.swoopDurationFrames || 18;
      this.isSwooping = true;
      this.hitOpponentThisSwoop = false;

      const speed = cfg.swoopSpeed || 18.5;
      this.vx = Math.cos(this.committedAimAngle) * speed;
      this.vy = Math.sin(this.committedAimAngle) * speed;

      // Align wings to immediate power downstroke burst
      const ticksPerFrame = cfg.swoopTicksPerFrame || 3;
      const downstrokeFrame = (cfg.wingFlapDownstrokeFrame !== undefined) ? cfg.wingFlapDownstrokeFrame : 1;
      this.wingAnimTick = ticksPerFrame * downstrokeFrame;
      this.wingFrameIndex = downstrokeFrame;
      this._playWingFlapAudio(0.90, 1.20);
    }
  }

  _updateSwoopDash(opponent, arena, cfg) {
    this.stateTimer--;

    // Trail afterimages
    if (this.stateTimer % 3 === 0) {
      this.afterImages.push({
        x: this.x,
        y: this.y,
        angle: this.committedAimAngle,
        alpha: 0.55,
      });
    }

    // Frontal Arc Collision Query (Rule 1.6)
    if (!this.hitOpponentThisSwoop) {
      const reach = cfg.swoopReach || 80;
      const arc = cfg.swoopArc || (120 * Math.PI / 180);
      const targets = this._collectAllEnemyTargets();

      for (let target of targets) {
        if (!target || target === this || target.hp <= 0) continue;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= reach + (target.r || 20)) {
          const targetAngle = Math.atan2(dy, dx);
          let angleDiff = targetAngle - this.committedAimAngle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          if (Math.abs(angleDiff) <= arc / 2) {
            this._applySwoopHit(target, cfg);
            this.hitOpponentThisSwoop = true;
            break;
          }
        }
      }
    }

    if (this.stateTimer <= 0) {
      this.isSwooping = false;
      this.aiState = DRAGON_STATE.SWOOP_RECOVERY;
      this.stateTimer = cfg.swoopTurnaroundFrames || 8;
      this.vx *= 0.25;
      this.vy *= 0.25;
    }
  }

  _applySwoopHit(target, cfg) {
    const damage = cfg.swoopDamage || 38;
    const knockback = cfg.swoopKnockback || 20.0;
    const angle = this.committedAimAngle;

    this._playAudio('swoopHit', 'Assets/Sound Effects/EnderdragonSFX/Explosion3.ogg', 0.95);
    triggerGlobalScreenShake(8, 20);
    spawnImpactFlash(target.x, target.y, 45, '#F5D0FE');
    spawnSparks(target.x, target.y, '#C026D3', 14, 6.0);

    applyDamageToTarget(target, damage, this);
    spawnFloatingText(target.x, target.y - 20, `-${damage}`, '#C026D3');

    // Rule 1.5: Freeze / hit-pause applied to target only
    if (typeof target.applyTimeStop === 'function') {
      target.applyTimeStop(8);
    }

    if (typeof target.applyKnockback === 'function') {
      target.applyKnockback(Math.cos(angle) * knockback, Math.sin(angle) * knockback, 14);
    }
  }

  _updateSwoopRecovery(opponent, cfg) {
    this.stateTimer--;
    if (this.stateTimer <= 0) {
      this.aiState = DRAGON_STATE.HOVER;
      this.swoopCooldown = cfg.swoopCooldown || 540;
    }
  }

  // ── Skill 3 / Ultimate: Void Cataclysm & Perch ──
  _initiateCataclysm(opponent, cfg) {
    this.aiState = DRAGON_STATE.CATACLYSM_CHANNEL;
    this.stateTimer = cfg.cataclysmChannelFrames || 70;
    this.isChannelingCataclysm = true;
    this.cataclysmProgress = 0;
    this.hasRoaredThisCataclysm = false;
    this.targetAltitude = 1.8; // Dramatic skyward ascent

    // Maintain majestic circular ascent flight vector (never freezes!)
    const currentAngle = this.gunAngle || 0;
    this.vx = Math.cos(currentAngle) * 3.5;
    this.vy = Math.sin(currentAngle) * 3.5;

    this._playWingFlapAudio(1.0);
    this._playRandomHurtAudio(0.90);
  }

  _updateCataclysmChannel(opponent, arena, cfg) {
    this.stateTimer--;
    const totalFrames = cfg.cataclysmChannelFrames || 70;
    this.cataclysmProgress = 1.0 - (this.stateTimer / totalFrames);

    // Majestic soaring ascent while gathering void energy (hovering in place)
    this.vx *= 0.90;
    this.vy = -0.3; // Gentle upward drift
    if (opponent && opponent.hp > 0) {
      this.aim(opponent);
    }

    // Roar & shockwave at frame 40
    const roarFrame = cfg.cataclysmRoarFrame || 40;
    if (this.stateTimer === (totalFrames - roarFrame) && !this.hasRoaredThisCataclysm) {
      this.hasRoaredThisCataclysm = true;
      this._dischargeCataclysmBurst(cfg);
    }

    if (this.stateTimer <= 0) {
      this.isChannelingCataclysm = false;
      this.aiState = DRAGON_STATE.PATROL;
      this.cataclysmCooldown = cfg.cataclysmCooldown || 1100;
      const targetSpeed = (this.speed || 4.4) * this.phaseSpeedMult;
      const angle = (this.gunAngle !== undefined && !Number.isNaN(this.gunAngle)) ? this.gunAngle : (Math.random() * Math.PI * 2);
      this.vx = Math.cos(angle) * targetSpeed;
      this.vy = Math.sin(angle) * targetSpeed;
      this.targetAltitude = 1.0;
    }
  }

  _dischargeCataclysmBurst(cfg) {
    const shockwaveR = cfg.cataclysmShockwaveRadius || 220;
    const damage = cfg.cataclysmShockwaveDamage || 65;
    const knockback = cfg.cataclysmShockwaveKnockback || 22.0;

    this._playRandomExplosionAudio(1.0);
    this._playWingFlapAudio(1.0);
    triggerGlobalScreenShake(cfg.cataclysmScreenShake || 12, 35);
    spawnImpactFlash(this.x, this.y, shockwaveR, '#F5D0FE');
    spawnSparks(this.x, this.y, '#C026D3', 30, 9.0);

    const targets = this._collectAllEnemyTargets();
    for (let target of targets) {
      if (!target || target === this || target.hp <= 0) continue;
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= shockwaveR) {
        const angle = Math.atan2(dy, dx);
        applyDamageToTarget(target, damage, this);
        spawnFloatingText(target.x, target.y - 25, `-${damage}`, '#E879F9');

        if (typeof target.applyTimeStop === 'function') {
          target.applyTimeStop(12);
        }
        if (typeof target.applyKnockback === 'function') {
          target.applyKnockback(Math.cos(angle) * knockback, Math.sin(angle) * knockback, 18);
        }
      }
    }

    // Secondary homing void fireballs in spiral
    const count = cfg.cataclysmSecondaryFireballs || 6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this._fireSecondaryFireball(angle, cfg);
    }
  }

  _fireSecondaryFireball(angle, cfg) {
    const speed = cfg.cataclysmSecondarySpeed || 7.5;
    const damage = cfg.cataclysmSecondaryDamage || 18;
    const sourceFighter = this;

    const proj = {
      x: this.x + Math.cos(angle) * (this.r + 5),
      y: this.y + Math.sin(angle) * (this.r + 5),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 12,
      damage: damage,
      owner: sourceFighter,
      maxDistance: 450,
      traveled: 0,
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.traveled += speed;

        const targets = (typeof state !== 'undefined' && state.fighters) ? state.fighters : [];
        for (let f of targets) {
          if (f && f !== sourceFighter && f.hp > 0 && !f.isEndCrystal && !f.isBoss) {
            const d = Math.hypot(f.x - this.x, f.y - this.y);
            if (d < (f.r || 20) + this.radius) {
              applyDamageToTarget(f, this.damage, sourceFighter);
              spawnSparks(this.x, this.y, '#D946EF', 8, 3.5);
              return true;
            }
          }
        }
        return this.traveled >= this.maxDistance;
      },
      draw(ctx) {
        drawMinecraftDragonFireball(ctx, this, true);
      }
    };

    if (typeof projectileSystem !== 'undefined' && projectileSystem.addProjectile) {
      projectileSystem.addProjectile(proj);
    } else if (typeof state !== 'undefined' && state.projectiles) {
      state.projectiles.push(proj);
    }
  }

  // ── Acid Pools & Helpers ──
  _updateAcidPools(opponent) {
    for (let i = this.acidPools.length - 1; i >= 0; i--) {
      const pool = this.acidPools[i];
      pool.duration--;
      pool.tickTimer++;

      if (pool.tickTimer >= pool.tickInterval) {
        pool.tickTimer = 0;
        const targets = this._collectAllEnemyTargets();

        for (let target of targets) {
          if (!target || target === this || (pool.owner && target === pool.owner) || target.hp <= 0 || target.isEndCrystal || target.isBoss) continue;
          if (typeof this.isTeammate === 'function' && this.isTeammate(target)) continue;
          const d = Math.hypot(target.x - pool.x, target.y - pool.y);
          if (d <= pool.radius) {
            const isTargetInvincible = Boolean(
              target.isInvulnerable ||
              target.isInvincible ||
              target.invincible ||
              target.isInvincibleUltimate ||
              (target.invincibleTimer && target.invincibleTimer > 0) ||
              (target.invincibilityTimer && target.invincibilityTimer > 0)
            );
            if (isTargetInvincible) continue;
            const applied = applyDamageToTarget(target, pool.damagePerTick, this);
            if (applied) {
              spawnFloatingText(target.x, target.y - 10, `-${pool.damagePerTick}`, '#A21CAF');
              this._playAudio('acidTick', 'Assets/Sound Effects/Attacks/fleshhit.mp3', 0.35);

              // Apply movement slow
              target.vx = (target.vx || 0) * 0.85;
              target.vy = (target.vy || 0) * 0.85;
            }
          }
        }
      }

      if (pool.duration <= 0) {
        this.acidPools.splice(i, 1);
      }
    }
  }

  _updateAfterImages() {
    for (let i = this.afterImages.length - 1; i >= 0; i--) {
      this.afterImages[i].alpha -= 0.05;
      if (this.afterImages[i].alpha <= 0) {
        this.afterImages.splice(i, 1);
      }
    }
  }

  _collectAllEnemyTargets(opponent = null) {
    const targets = [];
    if (typeof state !== 'undefined') {
      if (Array.isArray(state.fighters)) {
        for (let f of state.fighters) {
          if (f && f !== this && f.hp > 0 && !f.isEndCrystal) targets.push(f);
        }
      }
      if (Array.isArray(state.illusions)) {
        for (let ill of state.illusions) {
          if (ill && ill !== this && ill.hp > 0 && !ill.isEndCrystal) targets.push(ill);
        }
      }
    }
    if (opponent && opponent !== this && opponent.hp > 0 && !opponent.isEndCrystal) {
      if (!targets.includes(opponent)) targets.push(opponent);
    }
    return targets;
  }

  _enforceArenaLeash(arena, cfg) {
    if (!arena) return;
    const margin = cfg.softLeashRadius || 440;
    const ax = arena.x + arena.width / 2;
    const ay = arena.y + arena.height / 2;
    const dist = Math.hypot(this.x - ax, this.y - ay);

    if (dist > margin) {
      const pull = 0.35;
      const angle = Math.atan2(ay - this.y, ax - this.x);
      this.vx += Math.cos(angle) * pull;
      this.vy += Math.sin(angle) * pull;
    }
  }

  // ── Skill 4: Off-Screen Telegraphed Divebomb Strafe Methods ──
  _initiateDivebombSetup(opponent, arena, cfg) {
    this.aiState = DRAGON_STATE.DIVEBOMB_SETUP;
    this.isTelegraphingDivebomb = false;
    this.isDivebombing = false;

    const curArena = arena || (typeof state !== 'undefined' ? state.arena : null) || (typeof CONFIG !== 'undefined' ? CONFIG.arena : null) || ARENA_VERTICAL;
    const cx = curArena.x + curArena.width / 2;
    const cy = curArena.y + curArena.height / 2;
    const ar = (curArena.radius || (curArena.width / 2));

    // Determine natural exit flight angle based on current position and momentum
    const currentDistFromCenter = Math.hypot(this.x - cx, this.y - cy);
    let exitAngle;
    if (currentDistFromCenter > 20) {
      exitAngle = Math.atan2(this.y - cy, this.x - cx);
    } else {
      exitAngle = Math.atan2(this.vy || 1, this.vx || 0);
    }

    // Set high-altitude soaring for the off-screen bank
    this.targetAltitude = cfg.highAltitude || 1.7;
    this.stateTimer = 50; // Timeout guard for reaching perimeter

    // Maintain natural cruise flight speed (NO sudden rocket speed burst upon activation!)
    const cruiseSpeed = (cfg.divebombSetupSpeed || (this.speed || cfg.speed || 4.4)) * this.phaseSpeedMult;
    this.vx = Math.cos(exitAngle) * cruiseSpeed;
    this.vy = Math.sin(exitAngle) * cruiseSpeed;
    this.gunAngle = exitAngle;
    this.angle = exitAngle;

    // Wing flap audio at calm cruising flight pitch
    this._playWingFlapAudio(0.75, 1.0);
  }

  _updateDivebombSetup(opponent, arena, cfg) {
    this.stateTimer--;

    const curArena = arena || (typeof state !== 'undefined' ? state.arena : null) || (typeof CONFIG !== 'undefined' ? CONFIG.arena : null) || ARENA_VERTICAL;
    const cx = curArena.x + curArena.width / 2;
    const cy = curArena.y + curArena.height / 2;
    const ar = (curArena.radius || (curArena.width / 2));

    // Continue smooth flight out past arena perimeter
    const distFromCenter = Math.hypot(this.x - cx, this.y - cy);
    const targetOutsideDist = ar + (cfg.divebombSetupDistance || 75);

    if (distFromCenter < targetOutsideDist) {
      const dirX = (this.x - cx) / (distFromCenter || 1);
      const dirY = (this.y - cy) / (distFromCenter || 1);
      const cruiseSpeed = (cfg.divebombSetupSpeed || (this.speed || cfg.speed || 4.4)) * this.phaseSpeedMult;
      this.vx = dirX * cruiseSpeed;
      this.vy = dirY * cruiseSpeed;

      this.gunAngle = Math.atan2(this.vy, this.vx);
      this.angle = this.gunAngle;
    }

    // Once clear of arena boundary (or after flight burst), seamlessly lock launch position to current coordinates without ANY snap
    if (distFromCenter >= targetOutsideDist || this.stateTimer <= 0) {
      this.divebombStartX = this.x;
      this.divebombStartY = this.y;
      this.vx = 0; // Immediate zero velocity, NO forward leak into applyMovementPhysics
      this.vy = 0;
      this.knockbackVx = 0;
      this.knockbackVy = 0;

      // Compute trajectory through opponent (or arena center) and out opposite side
      const targetX = (opponent && opponent.hp > 0) ? opponent.x : cx;
      const targetY = (opponent && opponent.hp > 0) ? opponent.y : cy;
      this.divebombAngle = Math.atan2(targetY - this.divebombStartY, targetX - this.divebombStartX);

      const totalLength = ar * 2.5 + 560;
      this.divebombEndX = this.divebombStartX + Math.cos(this.divebombAngle) * totalLength;
      this.divebombEndY = this.divebombStartY + Math.sin(this.divebombAngle) * totalLength;

      this.aiState = DRAGON_STATE.DIVEBOMB_TELEGRAPH;
      this.isTelegraphingDivebomb = true;
      this.isDivebombing = false;
      this.stateTimer = cfg.divebombTelegraphFrames || 55;
      this.divebombTelegraphMax = cfg.divebombTelegraphFrames || 55;
      this.divebombTelegraphProgress = 0;
      this.gunAngle = this.divebombAngle;
      this.angle = this.divebombAngle;

      // Smoothly align tail vertebrae along dive vector to eliminate angular thrash
      const numSegs = (this._tailSegWorldAngles && this._tailSegWorldAngles.length) || 8;
      this._tailSegWorldAngles = new Array(numSegs).fill(this.divebombAngle + Math.PI);
    }
  }

  _updateDivebombTelegraph(opponent, arena, cfg) {
    this.stateTimer--;
    const maxFrames = this.divebombTelegraphMax || 55;
    const elapsed = Math.max(0, maxFrames - this.stateTimer);
    this.divebombTelegraphProgress = Math.min(1.0, elapsed / maxFrames);

    // Organic airborne hover buoyancy & natural floating drift (zero shaking)
    const hoverWave = Math.sin(elapsed * 0.09);
    const hoverLateralWave = Math.cos(elapsed * 0.07);
    this.x = this.divebombStartX + hoverLateralWave * 1.4;
    this.y = this.divebombStartY + hoverWave * 1.8;
    this.altitude = (cfg.highAltitude || 1.7) + hoverWave * 0.05;
    this.z = this.altitude * 20;

    this.vx = 0;
    this.vy = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;

    // Keep facing locked strictly to attack corridor vector (Rule 1.4)
    this.gunAngle = this.divebombAngle;
    this.angle = this.divebombAngle;

    // Periodic telegraph spark cue along corridor
    if (this.stateTimer % 8 === 0) {
      const sampleDist = Math.random() * (arena ? arena.width * 1.6 : 600);
      const px = this.divebombStartX + Math.cos(this.divebombAngle) * sampleDist;
      const py = this.divebombStartY + Math.sin(this.divebombAngle) * sampleDist;
      spawnSparks(px, py, '#EF4444', 2, 2.5);
    }

    if (this.stateTimer <= 0) {
      // Re-anchor strictly to launch origin before striking
      this.x = this.divebombStartX;
      this.y = this.divebombStartY;

      // Launch divebomb strafe seamlessly from hover position
      this.aiState = DRAGON_STATE.DIVEBOMB_STRIKE;
      this.isTelegraphingDivebomb = false;
      this.isDivebombing = true;
      this.stateTimer = cfg.divebombDurationFrames || 22;
      this.targetAltitude = cfg.lowAltitude || 0.4;
      this.divebombHitFighters.clear();
      this.divebombAcidTimer = 0;

      const strikeSpeed = (cfg.divebombSpeed || 24.5) * this.phaseSpeedMult;
      this.vx = Math.cos(this.divebombAngle) * strikeSpeed;
      this.vy = Math.sin(this.divebombAngle) * strikeSpeed;
      this.gunAngle = this.divebombAngle;
      this.angle = this.divebombAngle;

      // Align wings to immediate power downstroke burst
      const ticksPerFrame = cfg.swoopTicksPerFrame || 3;
      const downstrokeFrame = (cfg.wingFlapDownstrokeFrame !== undefined) ? cfg.wingFlapDownstrokeFrame : 1;
      this.wingAnimTick = ticksPerFrame * downstrokeFrame;
      this.wingFrameIndex = downstrokeFrame;

      this._playAudio('swoop', 'Assets/Sound Effects/EnderdragonSFX/Ender_dragon_flap5.ogg', 1.0);
      triggerGlobalScreenShake(12, 28);
    }
  }

  _clampToArena(entity, arena) {
    if (!entity || !arena) return;
    const er = entity.r || 20;
    if (arena.shape === 'circle') {
      const cx = arena.x + arena.width / 2;
      const cy = arena.y + arena.height / 2;
      const ar = Math.max(30, (arena.radius || (arena.width / 2)) - er);
      const d = Math.hypot(entity.x - cx, entity.y - cy);
      if (d > ar && d > 0) {
        entity.x = cx + ((entity.x - cx) / d) * ar;
        entity.y = cy + ((entity.y - cy) / d) * ar;
      }
    } else {
      const minX = arena.x + er;
      const maxX = arena.x + arena.width - er;
      const minY = arena.y + er;
      const maxY = arena.y + arena.height - er;
      entity.x = Math.max(minX, Math.min(maxX, entity.x));
      entity.y = Math.max(minY, Math.min(maxY, entity.y));
    }
  }

  _isInsideArena(x, y, radius, arena) {
    if (!arena) return true;
    const r = radius || 0;
    if (arena.shape === 'circle') {
      const cx = arena.x + arena.width / 2;
      const cy = arena.y + arena.height / 2;
      const ar = Math.max(30, (arena.radius || (arena.width / 2)) - r);
      return Math.hypot(x - cx, y - cy) <= ar;
    }
    const minX = arena.x + r;
    const maxX = arena.x + arena.width - r;
    const minY = arena.y + r;
    const maxY = arena.y + arena.height - r;
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }

  _isCollidingWithArenaWall(x, y, radius, arena) {
    if (!arena) return false;
    const r = radius || 20;
    if (arena.shape === 'circle') {
      const cx = arena.x + arena.width / 2;
      const cy = arena.y + arena.height / 2;
      const ar = Math.max(30, (arena.radius || (arena.width / 2)) - r);
      return Math.hypot(x - cx, y - cy) >= ar;
    }
    const minX = arena.x + r;
    const maxX = arena.x + arena.width - r;
    const minY = arena.y + r;
    const maxY = arena.y + arena.height - r;
    return x <= minX || x >= maxX || y <= minY || y >= maxY;
  }

  _getClampedArenaPos(x, y, radius, arena) {
    if (!arena) return { x, y };
    const r = radius || 20;
    if (arena.shape === 'circle') {
      const cx = arena.x + arena.width / 2;
      const cy = arena.y + arena.height / 2;
      const ar = Math.max(30, (arena.radius || (arena.width / 2)) - r);
      const d = Math.hypot(x - cx, y - cy);
      if (d > ar && d > 0) {
        return {
          x: cx + ((x - cx) / d) * ar,
          y: cy + ((y - cy) / d) * ar
        };
      }
      return { x, y };
    }
    const minX = arena.x + r;
    const maxX = arena.x + arena.width - r;
    const minY = arena.y + r;
    const maxY = arena.y + arena.height - r;
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y))
    };
  }

  _isTargetInDivebombStrikeCorridor(target, strikeSpeed, cfg) {
    if (!target || target === this || target.hp <= 0 || target.isDead) return false;
    if (typeof this.isTeammate === 'function' && this.isTeammate(target)) return false;

    const tr = target.r || 20;
    const dr = this.r || 36;
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const cosA = Math.cos(this.divebombAngle);
    const sinA = Math.sin(this.divebombAngle);

    // Forward projection along dive trajectory
    const forwardDist = dx * cosA + dy * sinA;
    // Perpendicular lateral distance from flight centerline
    const lateralDist = Math.abs(-dx * sinA + dy * cosA);

    // Lateral collision check: Hitbox width is directly based off divebombCorridorWidth
    // (Prevents entities to the flank or outside the ground danger carpet from being caught or snapped)
    const corridorWidth = (cfg && cfg.divebombCorridorWidth !== undefined)
      ? Number(cfg.divebombCorridorWidth)
      : ((cfg && (cfg.divebombHitboxRadius !== undefined ? Number(cfg.divebombHitboxRadius) * 2 : (cfg.divebombRadius !== undefined ? Number(cfg.divebombRadius) * 2 : 70))) || 70);
    const corridorHalfWidth = corridorWidth * 0.5;
    if (lateralDist > corridorHalfWidth) return false;

    // Longitudinal collision check: Must be within physical front contact reach this frame
    // (Dragon travels at strikeSpeed px/frame, front snout is at dr, cannot hit behind the dragon)
    const minForward = -tr * 0.4;
    const maxForward = dr + tr + Math.min(22, (strikeSpeed || 24.5) * 0.75);
    return forwardDist >= minForward && forwardDist <= maxForward;
  }

  _catchAndDragVictim(victim) {
    if (!victim || victim.isEndCrystal || victim.isBoss || victim === this || victim.hp <= 0 || victim.isDead) return;
    if (typeof this.isTeammate === 'function' && this.isTeammate(victim)) return;
    if (this.divebombHitFighters && this.divebombHitFighters.has(victim)) return;
    if (!this.draggedVictims) this.draggedVictims = new Set();
    if (this.draggedVictims.has(victim)) return;
    this.draggedVictims.add(victim);
    if (this.divebombHitFighters) this.divebombHitFighters.add(victim);
    victim.isDraggedByDragon = true;

    // Rule 1.5: Hitstun/Timestop applied to target only on initial impact contact
    if (typeof victim.applyHitStun === 'function') {
      victim.applyHitStun(8);
    }
    if (typeof victim.applyTimeStop === 'function') {
      victim.applyTimeStop(6);
    }

    // Immediate tactile impact response at the contact point (NO coordinate snap!)
    this._playAudio('swoopHit', 'Assets/Sound Effects/EnderdragonSFX/Explosion3.ogg', 0.90);
    spawnImpactFlash(victim.x, victim.y, 50, '#F5D0FE');
    spawnSparks(victim.x, victim.y, '#E879F9', 10, 5.0);
    triggerGlobalScreenShake(6, 12);

    // Apply slow debuff upon initial divebomb contact
    const cfg = this._getConfig();
    this._applyDivebombSlow(victim, cfg, false);
  }

  _applyDivebombSlow(target, cfg, showFloatingText = true, yOffset = -45) {
    if (!target || target.hp <= 0 || target.isDead) return;
    const slowFrames = (cfg && cfg.divebombSlowDuration) || 90;
    const slowMult = (cfg && cfg.divebombSlowMultiplier) || 0.40;
    if (typeof target.applySlow === 'function') {
      target.applySlow(slowFrames, slowMult, { isDivebomb: true });
    } else if (target.statusEffects && typeof target.statusEffects.applySlow === 'function') {
      target.statusEffects.applySlow(slowFrames, slowMult, { isDivebomb: true });
    } else {
      target.slowTimer = Math.max(target.slowTimer || 0, slowFrames);
      target.slowMultiplier = Math.min(target.slowMultiplier || 1.0, slowMult);
    }
    if (showFloatingText) {
      spawnFloatingText(target.x, target.y + yOffset, 'SLOWED!', '#E879F9');
    }
  }

  _updateDivebombStrike(opponent, arena, cfg) {
    this.stateTimer--;

    const curArena = arena || (typeof state !== 'undefined' ? state.arena : null) || (typeof CONFIG !== 'undefined' ? CONFIG.arena : null) || ARENA_VERTICAL;

    // Trail vivid amethyst afterimages
    if (this.stateTimer % 2 === 0) {
      this.afterImages.push({
        x: this.x,
        y: this.y,
        angle: this.divebombAngle,
        alpha: 0.85,
      });
    }

    // Deploy lingering acid pool trail
    this.divebombAcidTimer++;
    if (this.divebombAcidTimer % (cfg.divebombAcidDeployInterval || 4) === 0) {
      this.acidPools.push({
        x: this.x,
        y: this.y,
        radius: (cfg.acidPoolRadius || 70) * 0.75,
        duration: cfg.acidPoolDurationFrames || 180,
        maxDuration: cfg.acidPoolDurationFrames || 180,
        tickTimer: 0,
        tickInterval: cfg.acidTickInterval || 15,
        damagePerTick: cfg.acidDamagePerTick || 6,
        owner: this,
      });
      spawnSparks(this.x, this.y, '#E879F9', 4, 3.5);
    }

    // Lock dragon flight vector: unstoppable freight train (no speed loss or deflection)
    const strikeSpeed = (cfg.divebombSpeed || 24.5) * this.phaseSpeedMult;
    this.vx = Math.cos(this.divebombAngle) * strikeSpeed;
    this.vy = Math.sin(this.divebombAngle) * strikeSpeed;
    this.gunAngle = this.divebombAngle;
    this.angle = this.divebombAngle;

    // Detect and catch any reachable targets along the physical dive corridor (Zero-Snap corridor collision)
    const targets = this._collectAllEnemyTargets(opponent);
    for (let target of targets) {
      if (!target || target === this || target.hp <= 0 || target.isDead) continue;
      if (!this._isTargetInDivebombStrikeCorridor(target, strikeSpeed, cfg)) continue;

      if (target.isBoss) {
        if (!this.divebombHitFighters.has(target)) {
          this.divebombHitFighters.add(target);
          const damage = cfg.divebombDamage || 45;
          const knockback = (cfg.divebombKnockback || 22.0) * this.phaseSpeedMult;
          this._applyDivebombHit(target, damage, knockback, curArena, cfg);
        }
      } else {
        this._catchAndDragVictim(target);
      }
    }

    // Drag caught victims along with the dragon in 1 direction with ZERO positional snapping
    if (this.draggedVictims && this.draggedVictims.size > 0) {
      const victims = [...this.draggedVictims];
      for (let victim of victims) {
        if (!victim || victim.hp <= 0 || victim.isDead) {
          if (victim) {
            victim.isDraggedByDragon = false;
            this._clampToArena(victim, curArena);
          }
          this.draggedVictims.delete(victim);
          continue;
        }

        const vr = victim.r || 20;
        const dr = this.r || 36;
        const cosA = Math.cos(this.divebombAngle);
        const sinA = Math.sin(this.divebombAngle);

        // 1. Natural forward momentum: victim moves smoothly along with dragon velocity
        let nextX = victim.x + this.vx;
        let nextY = victim.y + this.vy;

        // 2. Physical cowcatcher penetration resolution:
        // Compute victim's forward position relative to dragon's next position
        const nextDragonX = this.x + this.vx;
        const nextDragonY = this.y + this.vy;
        const relX = nextX - nextDragonX;
        const relY = nextY - nextDragonY;
        const forwardProj = relX * cosA + relY * sinA;
        const minSeparation = dr + vr + 2;

        // Only push forward if the dragon's body penetrates into the victim
        // STRICT PROHIBITION of snapping: NEVER pull backward, NEVER snap laterally across space!
        if (forwardProj < minSeparation) {
          const pushDist = minSeparation - forwardProj;
          nextX += cosA * pushDist;
          nextY += sinA * pushDist;
        }

        // Check if victim collides with the arena boundary wall
        if (this._isCollidingWithArenaWall(nextX, nextY, vr, curArena)) {
          // ── WALL CRASH SLAM ──
          // Dragon slams victim against the arena wall!
          // Pin victim at the perimeter wall inside arena, release them from drag,
          // and detonate wall impact explosion so enemy NEVER leaves the arena or disappears!
          const clamped = this._getClampedArenaPos(nextX, nextY, vr, curArena);
          victim.x = clamped.x;
          victim.y = clamped.y;
          victim.isDraggedByDragon = false;
          this.draggedVictims.delete(victim);

          const damage = cfg.divebombDamage || 45;
          const knockback = (cfg.divebombKnockback || 22.0) * this.phaseSpeedMult;
          this._applyDivebombWallSlam(victim, damage, knockback, curArena, cfg);
        } else {
          victim.x = nextX;
          victim.y = nextY;
          victim.vx = this.vx;
          victim.vy = this.vy;
          victim.knockbackVx = this.vx;
          victim.knockbackVy = this.vy;
          victim.isDraggedByDragon = true;

          // Maintain continuous hitstun & lock during drag
          if (typeof victim.applyHitStun === 'function') {
            victim.applyHitStun(4);
          }
          if (typeof victim.applyTimeStop === 'function') {
            victim.applyTimeStop(4);
          }

          // Deal drag friction scrap damage tick
          if (this.stateTimer % 4 === 0) {
            applyDamageToTarget(victim, 6, this);
            spawnSparks(victim.x, victim.y, '#E879F9', 4, 3.5);
            triggerGlobalScreenShake(4, 8);
            if (victim.hp <= 0 || victim.isDead) {
              victim.isDraggedByDragon = false;
              this._clampToArena(victim, curArena);
              this.draggedVictims.delete(victim);
            }
          }
        }
      }
    }

    if (this.stateTimer <= 0) {
      this.isDivebombing = false;
      this.aiState = DRAGON_STATE.DIVEBOMB_RECOVERY;
      this.recoveryFrames = 0;
      this.stateTimer = 90; // Watchdog timer for graceful banking and smooth arena return
      this.targetAltitude = cfg.cruiseAltitude || 1.0;
      this.vx *= 0.40;
      this.vy *= 0.40;

      // Deliver final explosive impact and launch knockback to all remaining dragged victims
      const damage = cfg.divebombDamage || 45;
      const knockback = (cfg.divebombKnockback || 22.0) * this.phaseSpeedMult;
      if (this.draggedVictims && this.draggedVictims.size > 0) {
        for (let victim of this.draggedVictims) {
          if (victim) {
            victim.isDraggedByDragon = false;
            this._clampToArena(victim, curArena);
            if (victim.hp > 0 && !victim.isDead) {
              this._applyDivebombHit(victim, damage, knockback, curArena, cfg);
            }
          }
        }
        this.draggedVictims.clear();
      }
    }
  }

  _applyDivebombWallSlam(victim, damage, knockback, curArena, cfg) {
    this._playAudio('swoopHit', 'Assets/Sound Effects/EnderdragonSFX/Explosion3.ogg', 1.0);
    this._playRandomExplosionAudio(0.95);
    triggerGlobalScreenShake(14, 26);
    spawnImpactFlash(victim.x, victim.y, 80, '#F5D0FE');
    spawnSparks(victim.x, victim.y, '#EF4444', 24, 9.0);
    spawnSparks(victim.x, victim.y, '#C026D3', 18, 7.0);
    if (typeof spawnMeleeClashShockwave === 'function') {
      spawnMeleeClashShockwave(victim.x, victim.y, 110, '#C026D3');
    }

    applyDamageToTarget(victim, damage, this);
    spawnFloatingText(victim.x, victim.y - 25, `-${damage}`, '#EF4444');
    spawnFloatingText(victim.x, victim.y - 45, 'WALL SLAM!', '#F43F5E');

    // Rule 1.5: Hitstun applied to target only
    if (typeof victim.applyHitStun === 'function') {
      victim.applyHitStun(24);
    } else {
      victim.hitStunTimer = 24;
    }

    // Apply slow debuff on divebomb wall slam
    this._applyDivebombSlow(victim, cfg, true, -65);

    // Rebound inward away from the wall toward arena interior
    if (curArena) {
      const cx = curArena.x + curArena.width / 2;
      const cy = curArena.y + curArena.height / 2;
      const reboundAngle = Math.atan2(cy - victim.y, cx - victim.x);
      const reboundSpeed = Math.min(8.0, Math.max(4.0, knockback * 0.35));
      victim.vx = Math.cos(reboundAngle) * reboundSpeed;
      victim.vy = Math.sin(reboundAngle) * reboundSpeed;
      victim.knockbackVx = victim.vx;
      victim.knockbackVy = victim.vy;
      this._clampToArena(victim, curArena);
    } else {
      victim.vx = 0;
      victim.vy = 0;
      victim.knockbackVx = 0;
      victim.knockbackVy = 0;
    }
  }

  _applyDivebombHit(target, damage, knockback, curArena, cfg) {
    this._playAudio('swoopHit', 'Assets/Sound Effects/EnderdragonSFX/Explosion3.ogg', 1.0);
    this._playRandomExplosionAudio(0.90);
    triggerGlobalScreenShake(10, 24);
    spawnImpactFlash(target.x, target.y, 65, '#F5D0FE');
    spawnSparks(target.x, target.y, '#EF4444', 20, 8.0);
    if (typeof spawnMeleeClashShockwave === 'function') {
      spawnMeleeClashShockwave(target.x, target.y, 85, '#C026D3');
    }

    applyDamageToTarget(target, damage, this);
    spawnFloatingText(target.x, target.y - 25, `-${damage}`, '#EF4444');

    // Rule 1.5: Hitstun applied to target only
    if (typeof target.applyHitStun === 'function') {
      target.applyHitStun(16);
    } else {
      target.hitStunTimer = 16;
    }

    // Apply slow debuff on divebomb hit
    this._applyDivebombSlow(target, cfg, true, -45);

    if (curArena) {
      this._clampToArena(target, curArena);
      const cx = curArena.x + curArena.width / 2;
      const cy = curArena.y + curArena.height / 2;
      const distFromCenter = Math.hypot(target.x - cx, target.y - cy);
      const ar = (curArena.radius || (curArena.width / 2));
      let pushAngle;
      if (distFromCenter > ar * 0.7) {
        // If near wall, push inward toward arena center
        pushAngle = Math.atan2(cy - target.y, cx - target.x);
      } else {
        pushAngle = this.divebombAngle + (Math.random() < 0.5 ? 0.35 : -0.35);
      }
      if (typeof target.applyKnockback === 'function') {
        target.applyKnockback(Math.cos(pushAngle) * knockback, Math.sin(pushAngle) * knockback, 16);
      }
    } else {
      if (typeof target.applyKnockback === 'function') {
        target.applyKnockback(Math.cos(this.divebombAngle) * knockback, Math.sin(this.divebombAngle) * knockback, 16);
      }
    }
  }

  _updateDivebombRecovery(opponent, arena, cfg) {
    this.recoveryFrames = (this.recoveryFrames || 0) + 1;
    if (this.stateTimer !== undefined && this.stateTimer > 0) {
      this.stateTimer--;
    }

    // Decelerate exit velocity floor on initial recovery frame
    if (this.recoveryFrames === 1) {
      const initSpd = Math.hypot(this.vx, this.vy);
      if (initSpd > 10.0) {
        this.vx = (this.vx / initSpd) * 9.8;
        this.vy = (this.vy / initSpd) * 9.8;
      }
    }

    const curArena = arena || (typeof state !== 'undefined' ? state.arena : null) || (typeof CONFIG !== 'undefined' ? CONFIG.arena : null) || ARENA_VERTICAL;
    const cx = curArena.x + curArena.width / 2;
    const cy = curArena.y + curArena.height / 2;

    // 1. Locate safe target point inside playable arena interior
    const targetEnemy = this._getValidEnemyOpponent(opponent);
    let targetX = cx;
    let targetY = cy;

    const safeMargin = (this.r || 36) + 30;
    if (curArena.shape === 'circle') {
      const ar = Math.max(30, (curArena.radius || (curArena.width / 2)) - safeMargin);
      if (targetEnemy && targetEnemy.hp > 0 && !targetEnemy.isDead) {
        const edx = targetEnemy.x - cx;
        const edy = targetEnemy.y - cy;
        const edist = Math.hypot(edx, edy);
        const escale = edist > ar ? (ar / (edist || 1)) : 1;
        targetX = cx + edx * escale;
        targetY = cy + edy * escale;
      }
    } else {
      const minX = curArena.x + safeMargin;
      const maxX = curArena.x + curArena.width - safeMargin;
      const minY = curArena.y + safeMargin;
      const maxY = curArena.y + curArena.height - safeMargin;
      if (targetEnemy && targetEnemy.hp > 0 && !targetEnemy.isDead) {
        targetX = Math.max(minX, Math.min(maxX, targetEnemy.x));
        targetY = Math.max(minY, Math.min(maxY, targetEnemy.y));
      }
    }

    // 2. Smoothly rotate body to aim toward safe interior (continuous angular slerp)
    const targetAimAngle = Math.atan2(targetY - this.y, targetX - this.x);
    let angleDiff = targetAimAngle - (this.gunAngle || 0);
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const turnSpeed = 0.095 * this.phaseSpeedMult;
    this.gunAngle = (this.gunAngle || 0) + angleDiff * turnSpeed;
    this.angle = this.gunAngle;

    // 3. Aerodynamic flight steering: smoothly blend velocity toward forward heading
    const cruiseSpeed = (cfg.divebombRecoverySpeed || 5.6) * this.phaseSpeedMult;
    const desiredVx = Math.cos(this.gunAngle) * cruiseSpeed;
    const desiredVy = Math.sin(this.gunAngle) * cruiseSpeed;

    const steerRate = 0.10;
    this.vx += (desiredVx - this.vx) * steerRate;
    this.vy += (desiredVy - this.vy) * steerRate;

    // 4. Safe re-entry condition: check if dragon is comfortably inside the playable arena
    const isComfortablyInside = this._isInsideArena(this.x, this.y, (this.r || 36) + 15, curArena);
    const minRecoveryFrames = 24; // Ensure minimum graceful banking arc duration (~0.4s)
    const maxRecoveryFrames = 90; // Watchdog upper limit (~1.5s)

    const canTransition = (this.recoveryFrames >= minRecoveryFrames && isComfortablyInside) ||
                          (this.recoveryFrames >= maxRecoveryFrames && this._isInsideArena(this.x, this.y, 0, curArena)) ||
                          (this.recoveryFrames >= 115);

    if (canTransition) {
      this.divebombCooldown = (cfg.divebombCooldown || 600) / this.phaseSpeedMult;

      const canChainBreath = this.isSkillEnabled(cfg.enableDivebombBreathCombo, true) &&
                             this.isSkillEnabled(cfg.enableFireball, cfg.enableDragonsBreath, true);

      if (canChainBreath) {
        // Zero out velocity smoothly as breath attack begins right from current inside position (NO TELEPORT SNAP)
        this.vx = 0;
        this.vy = 0;
        this.knockbackVx = 0;
        this.knockbackVy = 0;
        this._initiateFireball(targetEnemy || opponent, cfg);
      } else {
        const baseSpd = (this.speed || cfg.speed || 4.4) * this.phaseSpeedMult;
        const angle = (this.gunAngle !== undefined && !Number.isNaN(this.gunAngle)) ? this.gunAngle : Math.atan2(this.vy, this.vx);
        this.vx = Math.cos(angle) * baseSpd;
        this.vy = Math.sin(angle) * baseSpd;
        this.aiState = DRAGON_STATE.PATROL;
      }
    }
  }

  interruptAttacks(forceCancelAll = false) {
    this.isSwooping = false;
    this.isBreathingFire = false;
    this.breathStreams = [];
    this.breathAnchorX = undefined;
    this.breathAnchorY = undefined;
    this.breathAnchorAltitude = undefined;
    this.breathElapsed = undefined;
    this.breathSpinTotal = undefined;
    this.isChannelingCataclysm = false;
    this.isTelegraphingDivebomb = false;
    this.isDivebombing = false;
    if (this.draggedVictims) {
      const curArena = (typeof state !== 'undefined' ? state.arena : null) || (typeof CONFIG !== 'undefined' ? CONFIG.arena : null) || ARENA_VERTICAL;
      for (let victim of this.draggedVictims) {
        if (victim) {
          victim.isDraggedByDragon = false;
          this._clampToArena(victim, curArena);
        }
      }
      this.draggedVictims.clear();
    }
    if (this.aiState !== DRAGON_STATE.HOVER) {
      this.aiState = DRAGON_STATE.HOVER;
    }
  }

  takeDamage(amount, attacker, opts) {
    const res = super.takeDamage(amount, attacker, opts);
    if (res !== false && amount > 4 && this.hp > 0) {
      if ((this._hurtSoundCooldownTimer || 0) <= 0) {
        this._playRandomHurtAudio(0.85);
        this._hurtSoundCooldownTimer = 18;
      }
    }
    return res;
  }

  onDeath() {
    this.interruptAttacks(true);
    this._playAudio('death', 'Assets/Sound Effects/EnderdragonSFX/Ender_dragon_death.ogg', 1.0);
    super.onDeath();
  }

  /**
   * Ground telegraph layer hook (Rule 1.4 & Rule 2.4):
   * Renders the high-visibility Danger Zone corridor carpet underneath fighters
   * during the off-screen telegraphed divebomb strafe.
   */
  drawGroundTelegraph(ctx) {
    if (!ctx || this.hp <= 0 || this.isDead) return;

    if (this.isTelegraphingDivebomb || this.aiState === DRAGON_STATE.DIVEBOMB_TELEGRAPH) {
      const startX = this.divebombStartX;
      const startY = this.divebombStartY;
      const endX = this.divebombEndX;
      const endY = this.divebombEndY;
      const angle = this.divebombAngle;
      const length = Math.hypot(endX - startX, endY - startY);
      const cfg = this._getConfig();
      const width = cfg.divebombCorridorWidth || (cfg.divebombHitboxRadius ? cfg.divebombHitboxRadius * 2 : 60);

      ctx.save();
      ctx.translate(startX, startY);
      ctx.rotate(angle);

      // 1. Semi-transparent Danger Carpet Fill with dynamic pulse
      const pulse = 0.85 + Math.sin(Date.now() * 0.008) * 0.15;
      ctx.fillStyle = `rgba(239, 68, 68, ${0.18 * pulse})`;
      ctx.fillRect(0, -width / 2, length, width);

      // 2. Charging progress fill representing countdown to strike
      const progress = Math.min(1.0, Math.max(0, this.divebombTelegraphProgress || 0));
      const filledLength = length * progress;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.38)';
      ctx.fillRect(0, -width / 2, filledLength, width);

      // 3. Leading edge charging bar (White Core & Neon Rose)
      if (filledLength > 0 && filledLength < length) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(filledLength - 3, -width / 2, 6, width);
        ctx.fillStyle = '#F43F5E';
        ctx.fillRect(filledLength - 8, -width / 2, 5, width);
      }

      // 4. Hazard Border Rails (Dashed Neon Warning Lines)
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.90 * pulse})`;
      ctx.lineWidth = 3.0;
      ctx.setLineDash([14, 8]);

      // Top rail
      ctx.beginPath();
      ctx.moveTo(0, -width / 2);
      ctx.lineTo(length, -width / 2);
      ctx.stroke();

      // Bottom rail
      ctx.beginPath();
      ctx.moveTo(0, width / 2);
      ctx.lineTo(length, width / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 5. Dynamic Directional Chevrons advancing along dive path
      const chevronSpacing = 65;
      const timeOffset = (Date.now() * 0.14) % chevronSpacing;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.70 * pulse})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = timeOffset; x < length; x += chevronSpacing) {
        ctx.moveTo(x - 16, -width * 0.28);
        ctx.lineTo(x, 0);
        ctx.lineTo(x - 16, width * 0.28);
      }
      ctx.stroke();

      // 6. Hazard Warning Badge in corridor center
      const badgeX = length * 0.45;
      ctx.save();
      ctx.translate(badgeX, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px "Outfit", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠ DANGER ZONE ⚠', 0, 0);
      ctx.restore();

      ctx.restore();
    } else if (this.isDivebombing || this.aiState === DRAGON_STATE.DIVEBOMB_STRIKE) {
      // Energetic vacuum trail during the live supersonic strafe
      const startX = this.divebombStartX;
      const startY = this.divebombStartY;
      const endX = this.divebombEndX;
      const endY = this.divebombEndY;
      const angle = this.divebombAngle;
      const length = Math.hypot(endX - startX, endY - startY);
      const cfg = this._getConfig();
      const width = cfg.divebombCorridorWidth || (cfg.divebombHitboxRadius ? cfg.divebombHitboxRadius * 2 : 60);

      ctx.save();
      ctx.translate(startX, startY);
      ctx.rotate(angle);

      ctx.fillStyle = 'rgba(217, 70, 239, 0.20)';
      ctx.fillRect(0, -width / 2, length, width);

      ctx.strokeStyle = 'rgba(232, 121, 249, 0.65)';
      ctx.lineWidth = 2.0;
      ctx.strokeRect(0, -width / 2, length, width);

      ctx.restore();
    }
  }

  drawBody(ctx) {
    if (!ctx) return;
    drawEnderDragonSkin(ctx, this);
  }

  draw(ctx) {
    if (!ctx) return;

    // 1. Draw glowing amethyst crystal healing tether beams
    drawCrystalHealingTetherBeams(ctx, this);

    // 2. Draw acid pools beneath dragon
    for (let pool of this.acidPools) {
      drawDragonAcidPool(ctx, pool);
    }

    // 2b. Draw active 360° dragon breath streams
    if (Array.isArray(this.breathStreams)) {
      for (let stream of this.breathStreams) {
        drawMinecraftBreathStream(ctx, stream);
      }
    }

    // 3. Draw authentic animated dragon model
    drawEnderDragonSkin(ctx, this);

    // 4. Mandatory Rule 21 In-Game Overhead HP & Status
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }
}
