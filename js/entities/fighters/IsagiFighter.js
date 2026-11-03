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
  drawIsagiKickImpact,
  drawIsagi16BitHitImpact
} from '../../graphics/weapons/isagiWeaponGraphics.js';
import { spawnSparks, spawnImpactFlash } from '../../graphics/particles/sparkEffect.js';
import { playSound } from '../../systems/soundSystem.js';

export class IsagiFighter extends Fighter {
  constructor(def) {
    const safeDef = def || { id: 70, type: 'isagi', name: 'ISAGI', color: '#00F0FF' };
    super(safeDef);
    this.characterId = 'isagi';
    this.type = 'isagi';

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

    // ─── Skill 2: Direct Volley (Ultimate) ───
    this.directVolleyCooldownMax = cfg.directVolleyCooldown || 1080;
    this.directVolleyCooldownTimer = 360; // Initial warmup
    this.isDirectVolleyWindingUp = false;
    this.directVolleyWindupTimer = 0;
    this.directVolleyWindupMax = cfg.directVolleyWindup || 14;
    this.directVolleyTargetAngle = 0;
    this.directVolleyTarget = null;

    // ─── Visual Effects & 12-Frame Kick Impact Animations (Rule 25) ───
    this.activeKickImpacts = [];
    this.active16BitHits = [];

    // ─── Post-Kick Movement Slow (Brief Recovery Follow-Through) ───
    this.kickSlowTimer = 0;
    this.kickSlowMultiplier = 1.0;
  }

  /**
   * Instantiates the single persistent soccer ball.
   */
  _createSoccerBall(cfg) {
    const angle = this.angle || 0;
    const r = cfg.egoShotRadius || 16;
    return {
      x: this.x + Math.cos(angle) * (this.r + r + 4),
      y: this.y + Math.sin(angle) * (this.r + r + 4),
      vx: 0,
      vy: 0,
      r: r,
      baseDamage: cfg.egoShotDamage || 24,
      reboundDamage: cfg.egoShotReboundDamage || 32,
      isCrit: false,
      isDirectVolley: false,
      isRebound: false,
      isKickedByIsagi: false,
      shouldBounceBackToIsagi: false,
      rotation: angle,
      rotSpeed: 0,
      startX: this.x,
      startY: this.y,
      lastKicker: null
    };
  }

  /**
   * Resets fighter and re-anchors the single soccer ball at Isagi's feet.
   */
  reset() {
    super.reset();
    this.activeKickImpacts = [];
    this.active16BitHits = [];
    this.kickSlowTimer = 0;
    this.kickSlowMultiplier = 1.0;
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.isagi) ? CONFIG.isagi : isagiConfig;
    if (this.soccerBall) {
      this.soccerBall.r = cfg.egoShotRadius || 16;
      const angle = this.angle || 0;
      this.soccerBall.x = this.x + Math.cos(angle) * (this.r + this.soccerBall.r + 4);
      this.soccerBall.y = this.y + Math.sin(angle) * (this.r + this.soccerBall.r + 4);
      this.soccerBall._lastStepX = this.soccerBall.x;
      this.soccerBall._lastStepY = this.soccerBall.y;
      this.soccerBall._rotMatrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      this.soccerBall._needs3DRender = true;
      this.soccerBall.vx = 0;
      this.soccerBall.vy = 0;
      this.soccerBall.isCrit = false;
      this.soccerBall.isDirectVolley = false;
      this.soccerBall.isRebound = false;
      this.soccerBall.isKickedByIsagi = false;
      this.soccerBall.shouldBounceBackToIsagi = false;
      this.soccerBall.rotSpeed = 0;
      this.soccerBall.lastKicker = null;
    } else {
      this.soccerBall = this._createSoccerBall(cfg);
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
    if (!this.soccerBall) return false;
    const kickReach = this.r + this.soccerBall.r + 16;
    return Math.hypot(this.soccerBall.x - this.x, this.soccerBall.y - this.y) <= kickReach;
  }

  /**
   * Disables auto-aim tracking during committed aim-lock (Rule 1.4).
   */
  canAim() {
    if (this.isDirectVolleyWindingUp) return false;
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
    if (this.metavisionInvulnTimer > 0 && !opts?.isGuaranteedHit && !opts?.undodgeable) {
      spawnFloatingText('SLIP!', this.x, this.y - 18, '#00FF88');
      return false;
    }
    return super.takeDamage(amount, attacker, opts);
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
  _spawn16BitHitEffect(x, y, impactAngle, isDirectVolley = false, isCrit = false) {
    const P = 2.0;
    const count = isDirectVolley ? 12 : 8;
    const particles = [];
    const baseColor = isDirectVolley ? '#00FF88' : (isCrit ? '#FACC15' : '#00F0FF');

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
      isCrit: isCrit,
      particles: particles
    });
  }

  /**
   * Main Fighter Update Loop.
   */
  update(opponent, ownerIndex, arena) {
    // 0. Update visual effects & transient particle lifecycles before freeze guard (Rule 25)
    this._updateVisualEffects();

    // 1. Mandatory Rule 1.1 Freeze & TimeStop Guard
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks();
      // Even when frozen, update soccer ball physics so active ball doesn't freeze in mid-flight
      this._updateSoccerBallPhysics(opponent, arena);
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

    // 2. Update Direct Volley Windup & Execution
    if (this.isDirectVolleyWindingUp) {
      this._updateDirectVolleyWindup(opponent, arena);
      this._updateSoccerBallPhysics(opponent, arena);
      return;
    }

    // 3. Update Metavision Slip Dash
    if (this.isMetavisionDashing) {
      this._updateMetavisionDash(arena);
    }

    // 4. Update the Single Soccer Ball Physics, Wall Bounces & Collisions
    this._updateSoccerBallPhysics(opponent, arena);

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
   * - Kicks when in natural possession/contact with the ball.
   * - Does not dash when kicking the ball.
   */
  _handleCombatAndBallMeeting(opponent, arena, cfg) {
    const hasBall = this._hasSoccerBall();

    // 1. Skill 1: Metavision Slip (Ball Interception Dash)
    // ONLY activates when Isagi is close to the ball and Metavision is off cooldown!
    if (!hasBall && this.soccerBall && isSkillEnabled(cfg.enableMetavision, true) && this.metavisionCooldownTimer <= 0) {
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
        // Priority A: Direct Volley Finisher if off cooldown (instant volley towards enemy)
        if (isSkillEnabled(cfg.enableDirectVolley, true) && this.directVolleyCooldownTimer <= 0) {
          this._unleashDirectVolley(opponent, arena);
          return;
        }

        // Priority B: Ego Shot (Standard Kick towards enemy)
        if (isSkillEnabled(cfg.enableEgoShot, true)) {
          this._fireEgoShot(opponent, cfg);
          return;
        }
      }

      // If on cooldown or not kicking, ball elastically deflects off Isagi's body circle
      this._resolveBallFighterDeflection(this);
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

    // Position ball right at the kicking foot along facing angle towards enemy
    this.soccerBall.x = this.x + Math.cos(angle) * (this.r + this.soccerBall.r + 2);
    this.soccerBall.y = this.y + Math.sin(angle) * (this.r + this.soccerBall.r + 2);
    this.soccerBall._lastStepX = this.soccerBall.x;
    this.soccerBall._lastStepY = this.soccerBall.y;
    this.soccerBall.vx = Math.cos(angle) * kickSpeed;
    this.soccerBall.vy = Math.sin(angle) * kickSpeed;
    this.soccerBall.isCrit = this.isFlowStateActive;
    this.soccerBall.isDirectVolley = false;
    this.soccerBall.isRebound = false;
    this.soccerBall.isKickedByIsagi = true; // Lethal ONLY when coming from Isagi's kick
    // Chance to bounce back right to Isagi on impact/rebound
    const bounceChance = cfg.bounceBackToIsagiChance !== undefined ? cfg.bounceBackToIsagiChance : 0.50;
    this.soccerBall.shouldBounceBackToIsagi = Math.random() < bounceChance;
    this.soccerBall.rotSpeed = 0.24;
    this.soccerBall.startX = this.x;
    this.soccerBall.startY = this.y;
    this.soccerBall.lastKicker = this;

    this.shootCooldown = this.shootCooldownMax;

    // Spawn kick sparks & puzzle embers
    spawnSparks(this.soccerBall.x, this.soccerBall.y, 8, '#00F0FF');
    this._spawnPuzzleParticles(this.soccerBall.x, this.soccerBall.y, 4, '#00F0FF');
    playSound('Assets/Sound Effects/Attacks/punch.mp3', 0.7);

    // 12-Frame Authentic Kick Impact Sprite Animation
    this.activeKickImpacts.push({
      x: this.soccerBall.x,
      y: this.soccerBall.y,
      angle: angle,
      timer: 14,
      maxTimer: 14,
      isDirectVolley: false
    });

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
    this.shootCooldown = 0; // Ready next kick immediately upon meeting ball!

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
      this.vx *= 0.2;
      this.vy *= 0.2;
    }
  }

  /**
   * Initiates Direct Volley (Ultimate Finisher) - strikes immediately in stride with zero pause/delay.
   */
  _startDirectVolleyWindup(opponent, arena) {
    this._unleashDirectVolley(opponent, arena);
  }

  /**
   * Updates Direct Volley windup if any is active (strikes instantly if called).
   */
  _updateDirectVolleyWindup(opponent, arena) {
    if (this.isDirectVolleyWindingUp) {
      this._unleashDirectVolley(opponent, arena);
    }
  }

  /**
   * Unleashes the supersonic Direct Volley strike on the single soccer ball with zero pause delay.
   * Directed straight towards the enemy.
   */
  _unleashDirectVolley(opponent, arena) {
    this.isDirectVolleyWindingUp = false;
    this.directVolleyCooldownTimer = this.directVolleyCooldownMax;

    if (!this.soccerBall) return;

    // Ensure Isagi does not dash as he kicks, and apply brief very slow movement on Isagi himself
    if (this.isMetavisionDashing) {
      this.isMetavisionDashing = false;
      this.metavisionDashTimer = 0;
    }
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.isagi) ? CONFIG.isagi : isagiConfig;
    this.kickSlowTimer = cfg.directVolleyKickSlowDuration || 24;
    this.kickSlowMultiplier = cfg.directVolleyKickSlowMultiplier || 0.12;
    this.vx *= 0.12;
    this.vy *= 0.12;
    // Kick directly towards the opponent
    const angle = (opponent && !opponent.isDead && typeof opponent.x === 'number' && typeof opponent.y === 'number')
      ? Math.atan2(opponent.y - this.y, opponent.x - this.x)
      : ((this.gunAngle !== undefined) ? this.gunAngle : ((this.angle !== undefined) ? this.angle : 0));
    this.directVolleyTargetAngle = angle;
    this.gunAngle = angle;
    this.angle = angle;
    const speed = cfg.directVolleySpeed || 25.0;

    // Supercharge the single ball!
    this.soccerBall.x = this.x + Math.cos(angle) * (this.r + this.soccerBall.r + 3);
    this.soccerBall.y = this.y + Math.sin(angle) * (this.r + this.soccerBall.r + 3);
    this.soccerBall._lastStepX = this.soccerBall.x;
    this.soccerBall._lastStepY = this.soccerBall.y;
    this.soccerBall.vx = Math.cos(angle) * speed;
    this.soccerBall.vy = Math.sin(angle) * speed;
    this.soccerBall.isCrit = true;
    this.soccerBall.isDirectVolley = true;
    this.soccerBall.isRebound = false;
    this.soccerBall.isKickedByIsagi = true; // Lethal ONLY when coming from Isagi's kick
    // Chance to bounce back right to Isagi on impact/rebound
    const bounceChance = cfg.bounceBackToIsagiChance !== undefined ? cfg.bounceBackToIsagiChance : 0.50;
    this.soccerBall.shouldBounceBackToIsagi = Math.random() < bounceChance;
    this.soccerBall.rotSpeed = 0.42;
    this.soccerBall.startX = this.x;
    this.soccerBall.startY = this.y;
    this.soccerBall.lastKicker = this;

    // Zero recoil dash: Isagi maintains natural grounded stance when kicking

    // Concentric Clean Shockwave Ring (Rule 26)
    this.shockwaves.push({
      x: this.soccerBall.x,
      y: this.soccerBall.y,
      maxR: 90,
      progress: 0.0,
      speed: 0.07,
      color: '#00F0FF'
    });

    // Screen Shake & Impact Audio
    triggerGlobalScreenShake(cfg.directVolleyShake || 8, 14);
    playSound('Assets/Sound Effects/Attacks/heavypunch1.mp3', 0.95);
    spawnFloatingText('DIRECT VOLLEY!!', this.x, this.y - 24, '#00F0FF');
    this._spawnPuzzleParticles(this.soccerBall.x, this.soccerBall.y, 10, '#00F0FF');

    // 12-Frame Supersonic Direct Volley Kick Impact Sprite Animation
    this.activeKickImpacts.push({
      x: this.soccerBall.x,
      y: this.soccerBall.y,
      angle: angle,
      timer: 16,
      maxTimer: 16,
      isDirectVolley: true
    });
  }

  /**
   * Updates the single persistent soccer ball: velocity, turf friction, wall rebounds & damage collisions.
   */
  _updateSoccerBallPhysics(primaryOpponent, arena) {
    const b = this.soccerBall;
    if (!b) return;

    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.isagi) ? CONFIG.isagi : isagiConfig;

    // 1. Position Integration & 3D Spherical Ball Rolling
    b.x += b.vx;
    b.y += b.vy;
    b.rotation += b.rotSpeed;
    stepSoccerBall3DRotation(b, b.vx, b.vy);

    // 2. Turf Friction / Rolling Deceleration
    b.vx *= 0.992;
    b.vy *= 0.992;
    b.rotSpeed *= 0.99;
    const currentSpeed = Math.hypot(b.vx, b.vy);
    if (currentSpeed < 2.5) {
      b.isDirectVolley = false;
      b.isKickedByIsagi = false;
    }
    if (currentSpeed < 0.2) {
      b.vx = 0;
      b.vy = 0;
      b.rotSpeed = 0;
      b.isDirectVolley = false;
      b.isKickedByIsagi = false;
    }

    // 3. Continuous Arena Wall Ricochet
    if (arena) {
      const minX = arena.x + b.r;
      const maxX = arena.x + arena.width - b.r;
      const minY = arena.y + b.r;
      const maxY = arena.y + arena.height - b.r;

      let bounced = false;
      const restitution = 0.95;

      if (b.x <= minX) {
        b.x = minX;
        b.vx = Math.abs(b.vx) * restitution;
        b.vy += (Math.random() - 0.5) * 1.5;
        bounced = true;
      } else if (b.x >= maxX) {
        b.x = maxX;
        b.vx = -Math.abs(b.vx) * restitution;
        b.vy += (Math.random() - 0.5) * 1.5;
        bounced = true;
      }
      if (b.y <= minY) {
        b.y = minY;
        b.vy = Math.abs(b.vy) * restitution;
        b.vx += (Math.random() - 0.5) * 1.5;
        bounced = true;
      } else if (b.y >= maxY) {
        b.y = maxY;
        b.vy = -Math.abs(b.vy) * restitution;
        b.vx += (Math.random() - 0.5) * 1.5;
        bounced = true;
      }

      if (bounced) {
        b.isRebound = true;
        spawnSparks(b.x, b.y, 8, '#00F0FF');
        playSound('Assets/Sound Effects/Attacks/punch.mp3', 0.55);

        // One-Two Bank Pass: Chance to bounce back right to Isagi off arena wall
        if (b.shouldBounceBackToIsagi) {
          const toIsagi = Math.atan2(this.y - b.y, this.x - b.x);
          const returnSpeed = (cfg.egoShotSpeed || 14.5) * 0.85;
          const candVx = Math.cos(toIsagi) * returnSpeed;
          const candVy = Math.sin(toIsagi) * returnSpeed;
          const movesInward = (b.x <= minX + 2 && candVx > 0) || (b.x >= maxX - 2 && candVx < 0) ||
                              (b.y <= minY + 2 && candVy > 0) || (b.y >= maxY - 2 && candVy < 0);
          if (movesInward) {
            b.vx = candVx;
            b.vy = candVy;
            b.shouldBounceBackToIsagi = false;
            b.isKickedByIsagi = false; // Bank pass is returning to Isagi, NOT an attack!
            b.isDirectVolley = false;
            this.shootCooldown = 0; // Ready next volley kick for when they meet!
            spawnFloatingText('BANK PASS!', b.x, b.y - 18, '#00F0FF');
            this._spawnPuzzleParticles(b.x, b.y, 6, '#00F0FF');
          }
        }
      }
    }

    // 4. Hostile Target Collisions (Lethal ONLY when actively kicked by Isagi with speed >= 3.0)
    if (b.isKickedByIsagi && currentSpeed >= 3.0) {
      const targets = [];
      if (state && state.fighters) {
        for (let i = 0; i < state.fighters.length; i++) {
          const f = state.fighters[i];
          if (f && f !== this && !f.isDead && !this.isTeammate(f)) {
            targets.push(f);
          }
        }
      }
      if (state && state.illusions) {
        for (let i = 0; i < state.illusions.length; i++) {
          const ill = state.illusions[i];
          if (ill && !ill.isDead && ill.owner !== this) {
            targets.push(ill);
          }
        }
      }

      for (let t = 0; t < targets.length; t++) {
        const target = targets[t];
        if (target._isagiBallHitCooldown > 0) {
          target._isagiBallHitCooldown--;
          continue;
        }

        const dist = Math.hypot(b.x - target.x, b.y - target.y);
        const hitRadius = b.r + (target.r || 25);

        if (dist <= hitRadius) {
          // Gojo Limitless Infinity Barrier Check (Rule 1.7)
          if (target.characterId === 'gojo' && target.infinityCooldown <= 0) {
            b.isKickedByIsagi = false; // Kick spent on Infinity barrier!
            b.isDirectVolley = false;
            if (b.shouldBounceBackToIsagi) {
              b.shouldBounceBackToIsagi = false;
              const toIsagiAngle = Math.atan2(this.y - b.y, this.x - b.x);
              const returnSpeed = cfg.bounceBackSpeed || 8.5;
              b.vx = Math.cos(toIsagiAngle) * returnSpeed;
              b.vy = Math.sin(toIsagiAngle) * returnSpeed;
              b.isRebound = true;
              this.shootCooldown = 0;
              spawnFloatingText('ONE-TWO!', b.x, b.y - 18, '#00E5FF');
            } else {
              b.vx = -b.vx * 0.4;
              b.vy = -b.vy * 0.4;
            }
            spawnSparks(b.x, b.y, 10, '#00E5FF');
            playSound('Assets/Sound Effects/Skills/backstab.mp3', 0.6);
            target._isagiBallHitCooldown = 15;
            break;
          }

          // Calculate Damage
          let damage = b.isDirectVolley ? (cfg.directVolleyDamage || 75) : (b.isRebound ? b.reboundDamage : b.baseDamage);
          if (b.isCrit) {
            damage = Math.round(damage * (cfg.flowShotCritMult || 1.35));
          }

          // Passive: Spatial Awareness (Sweet-spot distance bonus & cooldown refund)
          const flightDist = Math.hypot(b.x - b.startX, b.y - b.startY);
          const isSweetSpot = flightDist >= (cfg.sweetSpotDistance || 180);
          if (isSweetSpot || b.isRebound) {
            damage += (cfg.sweetSpotDamageBonus || 6);
            this.metavisionCooldownTimer = Math.max(0, this.metavisionCooldownTimer - (cfg.cooldownRefundOnRebound || 90));

            if (b.isRebound) {
              spawnFloatingText('DIRECT SHOT!', b.x, b.y - 16, '#00F0FF');
            }
          }

          // Apply damage cleanly via universal engine helper
          applyDamageToTarget(target, damage, this, arena);

          // Impact Knockback & Shockwave
          const wasDirectVolley = !!b.isDirectVolley;
          const kbAngle = Math.atan2(b.vy, b.vx);
          if (b.isDirectVolley) {
            const kbForce = cfg.directVolleyKnockback || 18.0;
            target.vx = Math.cos(kbAngle) * kbForce;
            target.vy = Math.sin(kbAngle) * kbForce;

            // Apply Stun Debuff on Direct Volley Impact
            const stunDuration = cfg.directVolleyStunDuration || 45;
            if (typeof target.applyParalyze === 'function') {
              target.applyParalyze(stunDuration, { isDirectVolley: true });
            } else {
              target.paralyzeTimer = Math.max(target.paralyzeTimer || 0, stunDuration);
            }
            if (typeof target.applyHitStun === 'function') {
              target.applyHitStun(stunDuration, { isDirectVolley: true });
            }
            spawnFloatingText('STUNNED!', target.x, target.y - 32, '#FACC15');

            this.shockwaves.push({
              x: target.x,
              y: target.y,
              maxR: 95,
              progress: 0.0,
              speed: 0.08,
              color: '#00FF88'
            });
            triggerGlobalScreenShake(cfg.directVolleyShake || 8, 14);
            playSound('Assets/Sound Effects/Attacks/heavypunch2.mp3', 0.85);
            b.isDirectVolley = false;
          } else {
            target.vx += Math.cos(kbAngle) * 5.5;
            target.vy += Math.sin(kbAngle) * 5.5;
            playSound('Assets/Sound Effects/Attacks/fleshhit.mp3', 0.7);
          }

          // Ball rebounds off target: Chance to bounce back right to Isagi!
          if (b.shouldBounceBackToIsagi) {
            b.shouldBounceBackToIsagi = false;
            const toIsagiAngle = Math.atan2(this.y - b.y, this.x - b.x);
            const returnSpeed = cfg.bounceBackSpeed || 8.5;
            b.vx = Math.cos(toIsagiAngle) * returnSpeed;
            b.vy = Math.sin(toIsagiAngle) * returnSpeed;
            b.isRebound = true;
            this.shootCooldown = 0; // Ready next volley kick immediately upon arrival!
            spawnFloatingText('ONE-TWO!', b.x, b.y - 18, '#00F0FF');
            this._spawnPuzzleParticles(b.x, b.y, 6, '#00F0FF');
          } else {
            b.vx = -b.vx * 0.45;
            b.vy = -b.vy * 0.45;
          }
          target._isagiBallHitCooldown = 18;

          // MANDATORY: Kick impact spent! Ball cannot deal further damage unless kicked again by Isagi!
          b.isKickedByIsagi = false;
          b.isDirectVolley = false;

          // Spawn Hardcoded 16-Bit Hit Impact Effect on Enemy
          const hitX = (b.x + target.x) * 0.5;
          const hitY = (b.y + target.y) * 0.5;
          const hitAngle = Math.atan2(target.y - b.y, target.x - b.x);
          this._spawn16BitHitEffect(hitX, hitY, hitAngle, wasDirectVolley, b.isCrit);

          spawnSparks(b.x, b.y, 12, '#00F0FF');
          this._spawnPuzzleParticles(b.x, b.y, 6, '#00FF88');
          break;
        }
      }
    } else if (state && state.fighters) {
      // 5. Non-damaging elastic deflection when ball is not an active kick from Isagi
      for (let i = 0; i < state.fighters.length; i++) {
        const f = state.fighters[i];
        if (f && f !== this && !f.isDead && !this.isTeammate(f)) {
          const dist = Math.hypot(b.x - f.x, b.y - f.y);
          if (dist < (f.r || 25) + b.r) {
            const dx = b.x - f.x;
            const dy = b.y - f.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = dx / len;
            const ny = dy / len;
            b.x = f.x + nx * ((f.r || 25) + b.r + 1);
            b.y = f.y + ny * ((f.r || 25) + b.r + 1);
            b.vx = nx * 3.5;
            b.vy = ny * 3.5;
            b.isKickedByIsagi = false; // Strictly non-lethal deflection!
            b.isDirectVolley = false;
            playSound('Assets/Sound Effects/Attacks/punch.mp3', 0.4);
            break;
          }
        }
      }
    }

    // Keep 3D rolling step anchors synchronized after wall/target position adjustments
    b._lastStepX = b.x;
    b._lastStepY = b.y;
    b._lastStepRot = b.rotation;
  }

  /**
   * Natural elastic deflection when fighter circle and soccer ball collide without kicking.
   */
  _resolveBallFighterDeflection(fighter) {
    const b = this.soccerBall;
    if (!b || !fighter) return;

    // Avoid deflecting immediately on the frame of an active kick
    if (this.shootCooldown > this.shootCooldownMax - 4) return;
    b.isKickedByIsagi = false; // Deflecting passively off a fighter is NOT an active kick!

    const dx = b.x - fighter.x;
    const dy = b.y - fighter.y;
    const dist = Math.hypot(dx, dy) || 1;
    const minDist = fighter.r + b.r;

    if (dist < minDist) {
      const nx = dx / dist;
      const ny = dy / dist;

      // Cleanly separate ball from fighter boundary
      b.x = fighter.x + nx * (minDist + 1);
      b.y = fighter.y + ny * (minDist + 1);
      b._lastStepX = b.x;
      b._lastStepY = b.y;

      // Relative velocity elastic bounce impulse
      const fvx = fighter.vx || 0;
      const fvy = fighter.vy || 0;
      const rvx = b.vx - fvx;
      const rvy = b.vy - fvy;
      const dot = rvx * nx + rvy * ny;

      if (dot < 0) {
        const bounceFactor = 1.4;
        b.vx -= bounceFactor * dot * nx;
        b.vy -= bounceFactor * dot * ny;
        b.rotSpeed = (Math.random() - 0.5) * 0.2;
      }
    }
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

    // 3. Draw Character Body Skin (Rule 24 Toji Standard)
    this.drawBody(ctx);

    // 4. Draw THE Single Persistent Soccer Ball
    if (this.soccerBall) {
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
    this.directVolleyWindupTimer = 0;
    this.isMetavisionDashing = false;
    this.metavisionDashTimer = 0;
    if (forceCancelAll) {
      this.activeKickImpacts.length = 0;
      this.active16BitHits.length = 0;
    }
  }
}
