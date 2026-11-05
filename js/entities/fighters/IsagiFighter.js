// ─────────────────────────────────────────────
// ISAGI YOICHI FIGHTER ENTITY (BLUE LOCK)
// Striker #11 — The Egoist Master of Metavision
// Single Persistent Soccer Ball Mechanics Standard:
// - Exactly ONE persistent soccer ball on the pitch at all times.
// - Isagi moves and bounces 100% naturally via standard circle fighter engine physics.
// - STRICT PROHIBITION of unnatural ball pursuit: Isagi NEVER actively steers or seeks the ball.
// - Isagi can ONLY attack when he and the ball naturally meet as he moves around the pitch!
// - When they meet: if off cooldown, Isagi kicks the ball (Ego Shot or Direct Volley).
// - If not kicking, the ball elastically deflects off his body circle.
// - Metavision Slip is a tactical blind-spot dodge activating Flow State (never homing on the ball).
// - Direct Volley unleashes a hypersonic finisher on the ball with zero trap delay upon natural collision.
// Strictly adheres to:
// - Rule 1.1: Freeze & TimeStop Early Exit Guard
// - Rule 1.2: Centralized Movement & Physics Delegation
// - Rule 1.3 & 1.4: 360° Omnidirectional Aiming & Committed Aim Lock
// - Rule 1.5: Attacker vs Target Freeze (Locks target, never self)
// - Rule 1.6: Target checking including state.fighters & state.illusions
// - Rule 1.7: Gojo Limitless Infinity Barrier Verification
// - Rule 1.8 & Rule 23: Basic Projectile Suppression (shoot() overridden)
// - Rule 1.9 & Rule 25: Non-Freezing Active VFX & Particle Lifecycles at top of update
// - Rule 2.9 & Rule 21: Mandatory Overhead Health & Freeze Drawing in draw()
// - Rule 2.11 & Rule 26: Clean Concentric Shockwaves (No cobwebs)
// - Rule 2.12 & Rule 27: Healthbar-Only Feedback (No floating text for lifesteal)
// - Rule 18: HUD Skill Bar Theme Consistency & Toggle Gating
// ─────────────────────────────────────────────

import { Fighter, applyDamageToTarget, isSkillEnabled } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { isagiConfig } from '../../configs/characters/isagiConfig.js';
import { state, spawnFloatingText, triggerGlobalScreenShake } from '../../core/state.js';
import { drawIsagiSkin, drawIsagiGhostSkin } from '../../graphics/fighters/isagiSkin.js';
import {
  drawSoccerBallProjectile,
  stepSoccerBall3DRotation,
  drawPuzzlePiece,
  drawMetavisionAimReticle,
  drawDirectVolleyShockwave,
  drawStrikerShockwave,
  drawIsagiKickImpact,
  drawIsagi16BitHitImpact,
  drawBlueLockEgoAura,
  drawBlueLockEgoAuraFront
} from '../../graphics/weapons/isagiWeaponGraphics.js';
import {
  createSoccerBall,
  resetSoccerBall,
  checkFighterCanKickBall,
  isHostileLethalBall,
  executeSoccerKick,
  executeStrikerSkill,
  updateSoccerBallPhysics,
  resolveBallFighterDeflection,
  dribbleSoccerBall,
  getFighterDribbleControl,
  spawn16BitHitEffect,
  spawnPuzzleParticles,
  isBlueLockFighter,
  isPrimaryBlueLockBallController,
  getOrCreateSharedSoccerBall,
  initBlueLockEgo,
  gainBlueLockEgo,
  activateBlueLockEgo,
  updateBlueLockEgo,
  updateBlueLockEgoTrail,
  decayBlueLockEgoTrail,
  getBlueLockEgoBuffs
} from '../../systems/soccerBallSystem.js';
import { spawnSparks, spawnImpactFlash } from '../../graphics/particles/sparkEffect.js';
import { playSound } from '../../systems/soundSystem.js';

export class IsagiFighter extends Fighter {
  constructor(def) {
    const safeDef = def || { id: 70, type: 'isagi', name: 'ISAGI', color: '#00F0FF' };
    super(safeDef);
    this.characterId = 'isagi';
    this.type = 'isagi';
    this.isBlueLockFighter = true;

    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.isagi) ? CONFIG.isagi : isagiConfig;

    this.name = def?.name || cfg.name || 'ISAGI';
    this.displayName = def?.displayName || cfg.displayName || 'Isagi Yoichi';
    this.grade = cfg.grade || 'A';
    this.themeColor = cfg.themeColor || '#00F0FF';
    this.color = this.themeColor;
    this.damageNumberColor = this.themeColor;

    // Attributes (Rule 24 Toji Standard: r = 25)
    this.hp = cfg.hp || 420;
    this.maxHp = this.hp;
    this.baseSpeed = cfg.speed || 5.2;
    this.speed = this.baseSpeed;
    this.r = cfg.r || 25;
    this.radius = this.r;
    this.attackRange = cfg.attackRange || 320;

    // ─── Single Persistent Soccer Ball (Core Rule: ONLY 1 ACTIVE BALL) ───
    this.soccerBall = this._createSoccerBall(cfg);

    // Visual particles & effects
    this.puzzleParticles = [];
    this.shockwaves = [];
    this.afterImages = [];

    // ─── Basic Attack: Ego Shot (Kick Cadence) ───
    this.shootCooldown = 20;
    this.shootCooldownMax = cfg.egoShotCooldown || 34;

    // ─── Skill 1: Metavision Slip ───
    this.metavisionCooldownMax = cfg.metavisionCooldown || 480;
    this.metavisionCooldownTimer = 120; // Initial delay
    this.isMetavisionDashing = false;
    this.metavisionDashTimer = 0;
    this.metavisionDashMax = cfg.metavisionDashFrames || 10;
    this.metavisionInvulnTimer = 0;
    this.isFlowStateActive = false;
    this.flowStateTimer = 0;

    // ─── Skill 2: "STRIKER!" (Universal Blue Lock Ultimate) ───
    this.strikerCooldownMax = cfg.strikerCooldown || cfg.directVolleyCooldown || 1080;
    this.directVolleyCooldownMax = this.strikerCooldownMax;
    this.strikerCooldownTimer = 360; // Initial warmup
    this.directVolleyCooldownTimer = 360;
    this.isStrikerWindingUp = false;
    this.isDirectVolleyWindingUp = false;
    this.strikerWindupTimer = 0;
    this.directVolleyWindupTimer = 0;
    this.strikerWindupMax = cfg.strikerWindup || cfg.directVolleyWindup || 14;
    this.directVolleyWindupMax = this.strikerWindupMax;
    this.strikerTargetAngle = 0;
    this.directVolleyTargetAngle = 0;
    this.strikerTarget = null;
    this.directVolleyTarget = null;

    // ─── Visual Effects & 12-Frame Kick Impact Animations (Rule 25) ───
    this.activeKickImpacts = [];
    this.active16BitHits = [];

    // ─── Kick Accuracy Standard (Blue Lock Mechanics) ───
    this.kickAccuracy = cfg.kickAccuracy !== undefined ? cfg.kickAccuracy : 1.0;

    // ─── Post-Kick Movement Slow (Brief Recovery Follow-Through) ───
    this.kickSlowTimer = 0;
    this.kickSlowMultiplier = 1.0;

    // ─── Universal Blue Lock Trait: EGO Awakening & Potential Unlocked ───
    initBlueLockEgo(this, cfg);
  }

  /**
   * Instantiates or binds to the single shared persistent soccer ball.
   */
  _createSoccerBall(cfg) {
    return getOrCreateSharedSoccerBall(this, cfg, state);
  }

  /**
   * Synchronizes with the shared soccer ball if another Blue Lock character
   * is already present in the match, enforcing the Single Shared Soccer Ball standard.
   */
  _syncSharedSoccerBall() {
    if (typeof state !== 'undefined' && Array.isArray(state.fighters)) {
      for (let i = 0; i < state.fighters.length; i++) {
        const f = state.fighters[i];
        if (f && f !== this && isBlueLockFighter(f) && f.soccerBall && typeof f.soccerBall === 'object') {
          if (this.soccerBall !== f.soccerBall) {
            this.soccerBall = f.soccerBall;
          }
          break;
        }
      }
    }
  }

  /**
   * Resets fighter and re-anchors the single soccer ball.
   * If multiple Blue Lock fighters are present, the ball is placed at the kickoff center.
   * Only the primary controller resets the ball to avoid conflicting overwrites.
   */
  reset() {
    super.reset();
    this.activeKickImpacts = [];
    this.active16BitHits = [];
    this.kickSlowTimer = 0;
    this.kickSlowMultiplier = 1.0;
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.isagi) ? CONFIG.isagi : isagiConfig;
    initBlueLockEgo(this, cfg);
    this._syncSharedSoccerBall();
    if (!this.soccerBall) {
      this.soccerBall = this._createSoccerBall(cfg);
    }
    if (isPrimaryBlueLockBallController(this, state)) {
      resetSoccerBall(this.soccerBall, this, cfg, state?.arena, state);
    }
  }

  /**
   * Natural Wall Bounce Handler: Preserves clean restitution and bounce angle (Rule 1.2).
   */
  resolveWallBounce(arena, opponent) {
    return super.resolveWallBounce(arena, opponent);
  }

  /**
   * Overrides base Fighter.shoot() to suppress default generic bullet projectiles (Rule 23).
   */
  shoot(ownerIndex) {
    // Intentionally empty: Isagi can ONLY attack by physically kicking the single soccer ball!
  }

  /**
   * Checks whether Isagi is close enough to physically kick the soccer ball.
   */
  _hasSoccerBall() {
    return checkFighterCanKickBall(this, this.soccerBall, 16);
  }

  /**
   * Disables auto-aim tracking during committed aim-lock (Rule 1.4).
   */
  canAim() {
    if (this.isDirectVolleyWindingUp || this.isStrikerWindingUp) return false;
    return super.canAim();
  }

  /**
   * Aiming Pipeline:
   * Isagi aims towards the enemy target.
   * This ensures his kicks launch towards the opponent.
   */
  aim(target) {
    if (!this.canAim()) return false;

    if (target && typeof target.x === 'number' && typeof target.y === 'number') {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      if (Math.hypot(dx, dy) > 0.001) {
        const targetAngle = Math.atan2(dy, dx);
        this.gunAngle = targetAngle;
        this.angle = targetAngle;
        return true;
      }
    }

    return false;
  }

  /**
   * Damage Pipeline:
   * Metavision Slip only activates when Isagi is close to the ball.
   * If Isagi is actively dashing to the ball with invulnerability frames, damage is evaded.
   */
  takeDamage(amount, attacker, opts = {}) {
    if (this.isEgoActive) {
      const egoBuffs = getBlueLockEgoBuffs(this);
      if (egoBuffs && typeof egoBuffs.dodgeChance === 'number' && Math.random() < egoBuffs.dodgeChance && !opts?.isGuaranteedHit && !opts?.undodgeable) {
        spawnFloatingText('EVADE!', this.x, this.y - 18, this.color || '#00F0FF');
        return false;
      }
    }
    if (this.metavisionInvulnTimer > 0 && !opts?.isGuaranteedHit && !opts?.undodgeable) {
      spawnFloatingText('SLIP!', this.x, this.y - 18, '#00FF88');
      return false;
    }
    const res = super.takeDamage(amount, attacker, opts);
    // Ball Disruption / Poise check when hit while dribbling
    if (res && this.soccerBall && this.soccerBall.dribbler === this) {
      const cfg = (typeof CONFIG !== 'undefined' && CONFIG.isagi) ? CONFIG.isagi : isagiConfig;
      const control = getFighterDribbleControl(this, cfg);
      if (amount >= 35 || Math.random() > control) {
        this.soccerBall.dribbler = null;
        this.soccerBall.vx += (Math.random() - 0.5) * 6;
        this.soccerBall.vy += (Math.random() - 0.5) * 6;
        spawnFloatingText('LOOSE BALL!', this.soccerBall.x, this.soccerBall.y - 18, '#FACC15');
      }
    }
    return res;
  }

  /**
   * Universal Beam Evasion:
   * If actively dashing with Metavision Slip, slips through continuous beams.
   */
  dodgeBeam(beamData = {}) {
    if (this.metavisionInvulnTimer > 0) {
      return true;
    }
    return super.dodgeBeam(beamData);
  }

  /**
   * Spawns floating puzzle piece particles (Rule 25 compliant).
   */
  _spawnPuzzleParticles(x, y, count = 4, color = '#00F0FF') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.8;
      this.puzzleParticles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 7 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.18,
        color: Math.random() < 0.4 ? '#00FF88' : color,
        life: 22 + Math.random() * 12,
        maxLife: 34
      });
    }
  }

  /**
   * Top-of-update non-freezing active visual effect decay routine (Rule 25).
   */
  _updateVisualEffects() {
    // 0. Blue Lock Ego Aura update & decay before freeze guard (Rule 25)
    // Ensures aura opacity and visual flame animation persist even when movement is stopped by attacks/CC
    if (this.isEgoActive || this.isMetavisionDashing) {
      updateBlueLockEgoTrail(this);
    } else {
      decayBlueLockEgoTrail(this);
    }

    // 1. Puzzle Particles Decay
    for (let i = this.puzzleParticles.length - 1; i >= 0; i--) {
      const p = this.puzzleParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.rot += p.rotSpeed;
      p.life--;
      if (p.life <= 0) {
        this.puzzleParticles.splice(i, 1);
      }
    }

    // 2. Shockwave Rings Decay (Rule 26)
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.progress += sw.speed;
      if (sw.progress >= 1.0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Ghost Afterimages Decay
    for (let i = this.afterImages.length - 1; i >= 0; i--) {
      const img = this.afterImages[i];
      img.alpha -= img.fadeSpeed;
      if (img.alpha <= 0) {
        this.afterImages.splice(i, 1);
      }
    }

    // 4. 12-Frame Kick Impact Animations Decay (Rule 25)
    for (let i = this.activeKickImpacts.length - 1; i >= 0; i--) {
      const imp = this.activeKickImpacts[i];
      imp.timer--;
      if (imp.timer <= 0) {
        this.activeKickImpacts.splice(i, 1);
      }
    }

    // 5. 16-Bit Hardcoded Hit Impact Effects Decay (Rule 25)
    for (let i = this.active16BitHits.length - 1; i >= 0; i--) {
      const hit = this.active16BitHits[i];
      hit.timer--;
      if (hit.particles) {
        for (let j = 0; j < hit.particles.length; j++) {
          const pt = hit.particles[j];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vx *= 0.90;
          pt.vy *= 0.90;
          pt.life--;
        }
      }
      if (hit.timer <= 0) {
        this.active16BitHits.splice(i, 1);
      }
    }
  }

  /**
   * Spawns a 16-bit retro arcade hit impact effect when the soccer ball strikes an enemy.
   */
  _spawn16BitHitEffect(x, y, impactAngle, isDirectVolley = false) {
    const P = 2.0;
    const count = isDirectVolley ? 12 : 8;
    const particles = [];
    const baseColor = this.color || '#00F0FF';

    for (let i = 0; i < count; i++) {
      // 16-bit quantized radial angles
      const quantAngle = impactAngle + ((i - (count - 1) / 2) * (Math.PI / (count * 0.6))) + (Math.random() - 0.5) * 0.2;
      const speed = (isDirectVolley ? 4.5 : 3.0) + Math.random() * 3.5;
      const size = Math.random() < 0.4 ? P * 2 : P;
      const color = Math.random() < 0.35 ? '#FFFFFF' : (Math.random() < 0.65 ? baseColor : '#38BDF8');

      particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(quantAngle) * speed,
        vy: Math.sin(quantAngle) * speed,
        size: size,
        color: color,
        life: 14 + Math.floor(Math.random() * 6),
        maxLife: 20
      });
    }

    this.active16BitHits.push({
      x: x,
      y: y,
      timer: isDirectVolley ? 16 : 13,
      maxTimer: isDirectVolley ? 16 : 13,
      isDirectVolley: isDirectVolley,
      particles: particles
    });
  }

  /**
   * Main Fighter Update Loop.
   */
  update(opponent, ownerIndex, arena) {
    // 0. Update visual effects & transient particle lifecycles before freeze guard (Rule 25)
    this._updateVisualEffects();

    // 0.1 Synchronize shared soccer ball across Blue Lock characters
    this._syncSharedSoccerBall();

    // 1. Mandatory Rule 1.1 Freeze & TimeStop Guard
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks();
      // Even when frozen, primary controller updates ball physics so active ball doesn't freeze in mid-flight
      if (isPrimaryBlueLockBallController(this, state)) {
        this._updateSoccerBallPhysics(opponent, arena);
      }
      return;
    }

    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.isagi) ? CONFIG.isagi : isagiConfig;

    // Dynamically ensure soccer ball radius stays synchronized with config
    if (this.soccerBall && cfg.egoShotRadius && this.soccerBall.r !== cfg.egoShotRadius) {
      this.soccerBall.r = cfg.egoShotRadius;
    }

    // Decrement Skill Cooldowns
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.metavisionCooldownTimer > 0) this.metavisionCooldownTimer--;
    if (this.directVolleyCooldownTimer > 0) this.directVolleyCooldownTimer--;
    if (this.strikerCooldownTimer > 0) this.strikerCooldownTimer--;
    this.strikerCooldownTimer = Math.min(this.strikerCooldownTimer, this.directVolleyCooldownTimer);
    this.directVolleyCooldownTimer = this.strikerCooldownTimer;

    // Invulnerability timer from Metavision slip
    if (this.metavisionInvulnTimer > 0) {
      this.metavisionInvulnTimer--;
      this.isInvulnerable = true;
    } else {
      this.isInvulnerable = false;
    }

    // Flow State duration countdown
    if (this.isFlowStateActive) {
      this.flowStateTimer--;
      if (this.flowStateTimer <= 0) {
        this.isFlowStateActive = false;
      }
    }

    // 1b. Universal Blue Lock EGO Awakening Lifecycle & Cooldown Recovery
    updateBlueLockEgo(this, cfg);
    if (this.isEgoActive) {
      const egoBuffs = getBlueLockEgoBuffs(this);
      if (egoBuffs && typeof egoBuffs.cooldownRate === 'number' && egoBuffs.cooldownRate > 1.0) {
        const extraRefund = egoBuffs.cooldownRate - 1.0;
        if (this.metavisionCooldownTimer > 0) {
          this.metavisionCooldownTimer = Math.max(0, this.metavisionCooldownTimer - extraRefund);
        }
        if (this.strikerCooldownTimer > 0) {
          this.strikerCooldownTimer = Math.max(0, this.strikerCooldownTimer - extraRefund);
          this.directVolleyCooldownTimer = this.strikerCooldownTimer;
        }
      }
    }

    // 2. Update Direct Volley / Striker Windup & Execution
    if (this.isDirectVolleyWindingUp || this.isStrikerWindingUp) {
      this._updateDirectVolleyWindup(opponent, arena);
      if (isPrimaryBlueLockBallController(this, state)) {
        this._updateSoccerBallPhysics(opponent, arena);
      }
      return;
    }

    // 3. Update Metavision Slip Dash
    if (this.isMetavisionDashing) {
      this._updateMetavisionDash(arena);
    }

    // 4. Update the Single Soccer Ball Physics, Wall Bounces & Collisions (Primary Controller only)
    if (isPrimaryBlueLockBallController(this, state)) {
      this._updateSoccerBallPhysics(opponent, arena);
    }

    // 5. Combat & Natural Ball Interaction: Attacks ONLY when he and the ball naturally meet!
    if (!this.isDead && opponent && !opponent.isDead) {
      this._handleCombatAndBallMeeting(opponent, arena, cfg);
    }

    // 6. Centralized Movement & Physics (Rule 1.2)
    // Isagi moves 100% naturally via standard engine physics (ZERO artificial ball steering)
    if (!this.isMetavisionDashing && !this.isDirectVolleyWindingUp) {
      let speedMult = 1.0;
      if (this.kickSlowTimer > 0) {
        this.kickSlowTimer--;
        speedMult = this.kickSlowMultiplier || 0.18;
      }
      const egoBuffs = getBlueLockEgoBuffs(this);
      if (egoBuffs && typeof egoBuffs.speedMultiplier === 'number') {
        speedMult *= egoBuffs.speedMultiplier;
      }
      if (this.soccerBall && this.soccerBall.dribbler === this && this.shootCooldown > 0) {
        speedMult *= (cfg.dribbleSpeedMultiplier || 1.05);
      }
      this.applyMovementPhysics(speedMult);
      if (this.canAim() && opponent && !opponent.isDead) {
        this.aim(opponent);
      }
      this.resolveWallBounce(arena, opponent);
    }
  }

  /**
   * Combat & Natural Ball Interaction:
   * - Skill 1 (Metavision Slip) ONLY activates when Isagi is close to the loose soccer ball, dashing directly toward it!
   * - Strictly guards against interacting with an incoming hostile lethal enemy kick!
   * - Kicks when in natural possession/contact with the ball.
   * - Does not dash when kicking the ball.
   */
  _handleCombatAndBallMeeting(opponent, arena, cfg) {
    if (this.hitStunTimer > 0 || this.paralyzeTimer > 0 || this.knockbackStunTimer > 0) return;
    if (this._ballHitCooldown > 0 || this._isagiBallHitCooldown > 0) return;
    if (isHostileLethalBall(this.soccerBall, this)) return;

    const hasBall = this._hasSoccerBall();

    // 1. Skill 1: Metavision Slip (Ball Interception Dash)
    // ONLY activates when Isagi is close to the loose, friendly ball and Metavision is off cooldown!
    if (!hasBall && this.soccerBall && !isHostileLethalBall(this.soccerBall, this) && isSkillEnabled(cfg.enableMetavision, true) && this.metavisionCooldownTimer <= 0) {
      const distToBall = Math.hypot(this.soccerBall.x - this.x, this.soccerBall.y - this.y);
      const interceptionRange = cfg.metavisionBallInterceptionRange || 160;
      const kickReach = this.r + this.soccerBall.r + 14;

      if (distToBall <= interceptionRange && distToBall > kickReach) {
        this._executeMetavisionSlip(this.soccerBall, cfg);
        return;
      }
    }

    // 2. Check if Isagi and the Soccer Ball naturally meet
    if (hasBall) {
      // Re-aim at the opponent upon getting the ball
      if (opponent && !opponent.isDead) {
        this.aim(opponent);
      }

      // If ready to attack:
      if (this.shootCooldown <= 0) {
        // Priority A: "STRIKER!" Finisher if off cooldown (instant volley towards enemy)
        const isStrikerEnabled = isSkillEnabled(cfg.enableStriker, isSkillEnabled(cfg.enableDirectVolley, true));
        const isStrikerReady = (this.strikerCooldownTimer <= 0) || (this.directVolleyCooldownTimer <= 0);
        if (isStrikerEnabled && isStrikerReady) {
          this._unleashStrikerSkill(opponent, arena);
          return;
        }

        // Priority B: Ego Shot (Standard Kick towards enemy)
        if (isSkillEnabled(cfg.enableEgoShot, true)) {
          this._fireEgoShot(opponent, cfg);
          return;
        }
      }

      // If on cooldown, trap and dribble the ball at feet until shootCooldown <= 0
      dribbleSoccerBall(this, this.soccerBall, arena, cfg);
    }
  }

  /**
   * Kicks the single soccer ball at high velocity directed straight towards the enemy.
   * Applies a brief very slow movement on Isagi himself upon kicking.
   */
  _fireEgoShot(opponent, cfg) {
    if (!this.soccerBall) return;

    // Ensure Isagi does not dash as he kicks, and apply brief very slow movement on Isagi himself
    if (this.isMetavisionDashing) {
      this.isMetavisionDashing = false;
      this.metavisionDashTimer = 0;
    }
    this.kickSlowTimer = cfg.kickSlowDuration || 18;
    this.kickSlowMultiplier = cfg.kickSlowMultiplier || 0.18;
    this.vx *= 0.18;
    this.vy *= 0.18;

    // Calculate angle directly towards the opponent
    const angle = (opponent && !opponent.isDead && typeof opponent.x === 'number' && typeof opponent.y === 'number')
      ? Math.atan2(opponent.y - this.y, opponent.x - this.x)
      : ((this.gunAngle !== undefined) ? this.gunAngle : ((this.angle !== undefined) ? this.angle : 0));
    this.gunAngle = angle;
    this.angle = angle;

    const speedMult = this.isFlowStateActive ? (cfg.flowShotSpeedMult || 1.5) : 1.0;
    const kickSpeed = (cfg.egoShotSpeed || 15.5) * speedMult;
    const bounceChance = cfg.bounceBackToIsagiChance !== undefined ? cfg.bounceBackToIsagiChance : 0.50;

    executeSoccerKick(this, this.soccerBall, angle, kickSpeed, {
      damage: cfg.egoShotDamage || 24,
      reboundDamage: cfg.egoShotReboundDamage || 32,
      isDirectVolley: false,
      themeColor: '#00F0FF',
      bounceBackChance: bounceChance,
      rotSpeed: 0.24,
      kickAccuracy: cfg.kickAccuracy !== undefined ? cfg.kickAccuracy : (this.kickAccuracy !== undefined ? this.kickAccuracy : 1.0),
      maxKickSpread: cfg.maxKickSpread
    });

    this.shootCooldown = this.shootCooldownMax;
    this._spawnPuzzleParticles(this.soccerBall.x, this.soccerBall.y, 4, '#00F0FF');

    // Consume Flow State on kick
    if (this.isFlowStateActive) {
      this.isFlowStateActive = false;
      this.flowStateTimer = 0;
    }
  }

  /**
   * Initiates Skill 1: Metavision Slip (Ball Interception Dash).
   * Activates ONLY when Isagi is close to the loose soccer ball, dashing directly toward it!
   */
  _executeMetavisionSlip(ballTarget, cfg) {
    this.metavisionCooldownTimer = this.metavisionCooldownMax;
    this.isMetavisionDashing = true;
    this._hasPassedThroughText = false;
    this.metavisionDashTimer = cfg.metavisionDashFrames || 10;
    this.metavisionInvulnTimer = cfg.metavisionInvulnFrames || 14;

    const target = ballTarget || this.soccerBall;
    if (target) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const slipAngle = Math.atan2(dy, dx);
      const dist = Math.hypot(dx, dy);
      const dashSpeed = Math.max(12, dist / this.metavisionDashTimer);
      this.vx = Math.cos(slipAngle) * dashSpeed;
      this.vy = Math.sin(slipAngle) * dashSpeed;
      this.gunAngle = slipAngle;
      this.angle = slipAngle;
    }

    spawnFloatingText('METAVISION!', this.x, this.y - 18, '#00F0FF');

    // Flow State Empowerment for the incoming kick
    this.isFlowStateActive = true;
    this.flowStateTimer = cfg.metavisionFlowDuration || 180;

    // VFX & Sound
    this._spawnPuzzleParticles(this.x, this.y, 8, '#00FF88');
    playSound('Assets/Sound Effects/Skills/dash1.mp3', 0.75);
  }

  /**
   * Updates Metavision Slip dash movement.
   */
  _updateMetavisionDash(arena) {
    this.x += this.vx;
    this.y += this.vy;

    // Arena boundary containment
    if (arena) {
      this.x = Math.max(arena.x + this.r, Math.min(arena.x + arena.width - this.r, this.x));
      this.y = Math.max(arena.y + this.r, Math.min(arena.y + arena.height - this.r, this.y));
    }

    // Leave ghost afterimage
    if (this.metavisionDashTimer % 3 === 0) {
      this.afterImages.push({
        x: this.x,
        y: this.y,
        angle: this.gunAngle || this.angle || 0,
        r: this.r,
        alpha: 0.55,
        fadeSpeed: 0.08
      });
    }

    this.metavisionDashTimer--;
    if (this.metavisionDashTimer <= 0) {
      this.isMetavisionDashing = false;
      this._hasPassedThroughText = false;
      this.vx *= 0.2;
      this.vy *= 0.2;
    }
  }

  /**
   * Initiates "STRIKER!" (Ultimate Finisher) - strikes immediately in stride with zero pause/delay.
   */
  _startStrikerWindup(opponent, arena) {
    this._unleashStrikerSkill(opponent, arena);
  }

  _startDirectVolleyWindup(opponent, arena) {
    this._startStrikerWindup(opponent, arena);
  }

  /**
   * Updates "STRIKER!" windup if any is active (strikes instantly if called).
   */
  _updateDirectVolleyWindup(opponent, arena) {
    if (this.isDirectVolleyWindingUp || this.isStrikerWindingUp) {
      this._unleashStrikerSkill(opponent, arena);
    }
  }

  /**
   * Unleashes the supersonic "STRIKER!" finisher strike on the single soccer ball with zero pause delay.
   * Directed straight towards the enemy.
   */
  _unleashStrikerSkill(opponent, arena) {
    this.isDirectVolleyWindingUp = false;
    this.isStrikerWindingUp = false;
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.isagi) ? CONFIG.isagi : isagiConfig;

    return executeStrikerSkill(this, this.soccerBall, opponent, arena, cfg, {
      themeColor: '#00F0FF',
      shoutText: 'STRIKER!!',
      kickAccuracy: cfg.kickAccuracy !== undefined ? cfg.kickAccuracy : (this.kickAccuracy !== undefined ? this.kickAccuracy : 1.0),
      maxKickSpread: cfg.maxKickSpread
    });
  }

  _unleashDirectVolley(opponent, arena) {
    return this._unleashStrikerSkill(opponent, arena);
  }

  /**
   * Updates the single persistent soccer ball: velocity, turf friction, wall rebounds & damage collisions.
   * Delegated to centralized soccerBallSystem (Rule 1.2).
   */
  _updateSoccerBallPhysics(primaryOpponent, arena) {
    if (!this.soccerBall) return;
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.isagi) ? CONFIG.isagi : isagiConfig;
    updateSoccerBallPhysics(this.soccerBall, this, primaryOpponent, arena, cfg, state);
  }

  /**
   * Natural elastic deflection when fighter circle and soccer ball collide without kicking.
   * Delegated to centralized soccerBallSystem (Rule 1.2).
   */
  _resolveBallFighterDeflection(fighter) {
    resolveBallFighterDeflection(this.soccerBall, fighter, this.shootCooldown > this.shootCooldownMax - 4);
  }

  /**
   * Defines standard body pass for previewers and engine hooks (Rule 21).
   */
  drawBody(ctx) {
    drawIsagiSkin(ctx, this);
  }

  /**
   * Custom Draw Pipeline (Rule 21: Must call drawHealth & drawFreezeTimer on top layer).
   */
  draw(ctx, opponent) {
    // 1. Draw Metavision Ghost Afterimages
    for (let i = 0; i < this.afterImages.length; i++) {
      const img = this.afterImages[i];
      drawIsagiGhostSkin(ctx, img.x, img.y, img.angle, img.r, img.alpha);
    }

    // 2. Draw Direct Volley Aim Lock Reticle
    if (this.isDirectVolleyWindingUp && this.directVolleyTarget) {
      const progress = 1.0 - (this.directVolleyWindupTimer / this.directVolleyWindupMax);
      drawMetavisionAimReticle(ctx, this, this.directVolleyTarget, progress);
    }

    // 2.5 Draw Ego Awakening Spectral Flame Spire & Ground Pool Aura (Back Layer & Decaying Wisps)
    drawBlueLockEgoAura(ctx, this);

    // 3. Draw Character Body Skin (Rule 24 Toji Standard)
    this.drawBody(ctx);

    // 3.5 Draw Ego Awakening Front Ground Pool Licks & Flank Rim Wisps (3D Depth Wrapping)
    drawBlueLockEgoAuraFront(ctx, this);

    // 4. Draw THE Single Persistent Soccer Ball (Only primary Blue Lock controller draws to avoid duplicate rendering)
    if (this.soccerBall && isPrimaryBlueLockBallController(this, state) && !this._isPreview && !this._isProfilePreview) {
      drawSoccerBallProjectile(ctx, this.soccerBall);
    }

    // 5. Draw Floating Puzzle Particles
    for (let i = 0; i < this.puzzleParticles.length; i++) {
      const p = this.puzzleParticles[i];
      const alpha = p.life / p.maxLife;
      drawPuzzlePiece(ctx, p.x, p.y, p.size, p.rot, p.color, alpha);
    }

    // 6. Draw Concentric Shockwaves (Rule 26)
    for (let i = 0; i < this.shockwaves.length; i++) {
      drawDirectVolleyShockwave(ctx, this.shockwaves[i]);
    }

    // 7. Draw 12-Frame Kick Impact Animations
    for (let i = 0; i < this.activeKickImpacts.length; i++) {
      drawIsagiKickImpact(ctx, this.activeKickImpacts[i]);
    }

    // 8. Draw Hardcoded 16-Bit Hit Impact Effects (Enemy Ball Hits)
    for (let i = 0; i < this.active16BitHits.length; i++) {
      drawIsagi16BitHitImpact(ctx, this.active16BitHits[i]);
    }

    // 9. Mandatory Rule 21 Overhead HP & Freeze Timer (TOP LAYER)
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }

  /**
   * Clean attack interruption on CC / defeat (Rule 25).
   */
  interruptAttacks(forceCancelAll = false) {
    this.isDirectVolleyWindingUp = false;
    this.isStrikerWindingUp = false;
    this.directVolleyWindupTimer = 0;
    this.strikerWindupTimer = 0;
    this.isMetavisionDashing = false;
    this.metavisionDashTimer = 0;
    if (forceCancelAll) {
      this.activeKickImpacts.length = 0;
      this.active16BitHits.length = 0;
      if (this._egoTrailNodes) this._egoTrailNodes.length = 0;
      if (this._egoDroplets) this._egoDroplets.length = 0;
      if (this._egoFlameWisps) this._egoFlameWisps.length = 0;
      this._egoAuraOpacity = 0;
    }
  }
}
