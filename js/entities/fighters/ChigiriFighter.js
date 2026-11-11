// ─────────────────────────────────────────────
// HYOMA CHIGIRI FIGHTER ENTITY (BLUE LOCK)
// Striker #44 — The Red Panther (Mach Pace)
// Single Persistent Soccer Ball Mechanics Standard:
// - Exactly ONE persistent soccer ball on the pitch at all times.
// - Chigiri moves and bounces naturally via standard circle fighter engine physics.
// - Chigiri attacks by kicking the soccer ball (Panther Shot or Universal STRIKER!).
// - Skill 1: "Panther Sprint" (Mach Breakaway Dash) intercepts loose ball and gives a lingering speed boost!
// - EGO Awakening: "44-Panther Mach Pace" grants extreme temporary speed boost (+60% SPD) and evasion.
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
import { chigiriConfig } from '../../configs/characters/chigiriConfig.js';
import { state, spawnFloatingText, triggerGlobalScreenShake } from '../../core/state.js';
import { drawChigiriSkin, drawChigiriGhostSkin } from '../../graphics/fighters/chigiriSkin.js';
import {
  drawSoccerBallProjectile,
  drawPuzzlePiece,
  drawStrikerShockwave,
  drawKickImpact,
  draw16BitHitImpact,
  drawBlueLockEgoAura,
  drawBlueLockEgoAuraFront
} from '../../graphics/weapons/soccerBallGraphics.js';
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
  isBlueLockFighter,
  isPrimaryBlueLockBallController,
  getOrCreateSharedSoccerBall,
  initBlueLockEgo,
  gainBlueLockEgo,
  activateBlueLockEgo,
  updateBlueLockEgo,
  updateBlueLockEgoTrail,
  decayBlueLockEgoTrail,
  decayStrikerBallTrail,
  getBlueLockEgoBuffs,
  spawn16BitHitEffect
} from '../../systems/soccerBallSystem.js';
import { playSound } from '../../systems/soundSystem.js';

export class ChigiriFighter extends Fighter {
  constructor(def) {
    const safeDef = def || { id: 71, type: 'chigiri', name: 'CHIGIRI', color: '#EC4899' };
    super(safeDef);
    this.characterId = 'chigiri';
    this.type = 'chigiri';
    this.isBlueLockFighter = true;

    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.chigiri) ? CONFIG.chigiri : chigiriConfig;

    this.name = def?.name || cfg.name || 'CHIGIRI';
    this.displayName = def?.displayName || cfg.displayName || 'Hyoma Chigiri';
    this.grade = cfg.grade || 'S';
    this.themeColor = cfg.themeColor || '#EC4899';
    this.color = this.themeColor;
    this.damageNumberColor = this.themeColor;

    // Attributes (Rule 24 Humanoid Standard: r = 25)
    this.hp = cfg.hp || 400;
    this.maxHp = this.hp;
    this.baseSpeed = cfg.speed || 6.4;
    this.speed = this.baseSpeed;
    this.r = cfg.r || 25;
    this.radius = this.r;
    this.attackRange = cfg.attackRange || 340;

    // ─── Single Persistent Soccer Ball (Core Rule: ONLY 1 ACTIVE BALL) ───
    this.soccerBall = this._createSoccerBall(cfg);

    // Visual particles & effects
    this.puzzleParticles = [];
    this.shockwaves = [];
    this.afterImages = [];
    this.activeKickImpacts = [];
    this.active16BitHits = [];

    // ─── Basic Attack: Panther Shot (Kick Cadence) ───
    this.shootCooldown = 20;
    this.shootCooldownMax = cfg.pantherShotCooldown || 32;

    // ─── Skill 1: Panther Sprint (Mach Breakaway Dash & Post-Dash Speed Surge) ───
    this.pantherSprintCooldownMax = cfg.pantherSprintCooldown || 240;
    this.pantherSprintCooldownTimer = 100; // Initial delay
    this.isPantherSprinting = false;
    this.pantherSprintDashTimer = 0;
    this.pantherSprintDashMax = cfg.pantherSprintDashFrames || 22;
    this.pantherSprintInvulnTimer = 0;
    this.pantherSpeedBuffTimer = 0;
    this.pantherSpeedBuffDuration = cfg.pantherSprintSpeedBuffDuration || 150;
    this.pantherSpeedBuffMultiplier = cfg.pantherSprintSpeedBuffMultiplier || 1.40;
    this.pantherSprintEvadeChance = cfg.pantherSprintEvadeChance !== undefined ? cfg.pantherSprintEvadeChance : 0.35;

    // ─── Skill 2: "STRIKER!" (Universal Blue Lock Ultimate) ───
    this.strikerCooldownMax = cfg.strikerCooldown || 720;
    this.strikerCooldownTimer = 0; // Ready immediately on first ball possession!
    this.isStrikerWindingUp = false;
    this.strikerWindupTimer = 0;
    this.strikerWindupMax = cfg.strikerWindup || 0;
    this.strikerTargetAngle = 0;
    this.strikerTarget = null;

    // ─── Kick Accuracy Standard (Blue Lock Mechanics) ───
    this.kickAccuracy = cfg.kickAccuracy !== undefined ? cfg.kickAccuracy : 0.94;

    // ─── Post-Kick Movement Slow (Brief Recovery Follow-Through) ───
    this.kickSlowTimer = 0;
    this.kickSlowMultiplier = 1.0;

    // ─── Declarative SkillManager Registration (Rule 18 & Cooldown Stasis Architecture) ───
    if (this.skillManager) {
      const skills = [
        {
          id: 'panther_sprint',
          name: 'Panther Sprint',
          type: 'active',
          isSignature: true,
          signature: true,
          cooldownKey: 'pantherSprintCooldownTimer',
          cooldownMaxKey: 'pantherSprintCooldownMax',
          durationKey: 'pantherSpeedBuffTimer',
          durationMaxKey: 'pantherSpeedBuffDuration',
          activeKey: 'isPantherSprinting',
          canTickCooldown: (fighter) => !fighter.isPantherSprinting && (fighter.pantherSprintDashTimer || 0) <= 0 && (fighter.pantherSpeedBuffTimer || 0) <= 0,
          onExpire: (fighter) => {
            fighter.isPantherSprinting = false;
          }
        },
        {
          id: 'striker',
          name: 'STRIKER!',
          type: 'ultimate',
          isSignature: true,
          signature: true,
          isUltimate: true,
          cooldownKey: 'strikerCooldownTimer',
          cooldownMaxKey: 'strikerCooldownMax',
          activeKey: 'isStrikerWindingUp'
        }
      ];
      this.skillManager.registerSkills(skills);
      this.skillManager.cooldownKeyMap.set('pantherSprintCooldown', skills[0]);
      this.skillManager.cooldownKeyMap.set('strikerCooldown', skills[1]);
    }

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
   */
  reset() {
    super.reset();
    this.activeKickImpacts = [];
    this.active16BitHits = [];
    this.kickSlowTimer = 0;
    this.kickSlowMultiplier = 1.0;
    this.isPantherSprinting = false;
    this.pantherSprintDashTimer = 0;
    this.pantherSprintInvulnTimer = 0;
    this.pantherSpeedBuffTimer = 0;
    this.strikerCooldownTimer = 0;
    if (this.skillManager) {
      const s1 = this.skillManager.getSkill('panther_sprint');
      const s2 = this.skillManager.getSkill('striker');
      if (s1) this.skillManager.cooldownKeyMap.set('pantherSprintCooldown', s1);
      if (s2) this.skillManager.cooldownKeyMap.set('strikerCooldown', s2);
    }
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.chigiri) ? CONFIG.chigiri : chigiriConfig;
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
    // Intentionally empty: Chigiri attacks exclusively by kicking the single soccer ball!
  }

  /**
   * Checks whether Chigiri is close enough to physically kick the soccer ball.
   */
  _hasSoccerBall() {
    return checkFighterCanKickBall(this, this.soccerBall, 16);
  }

  /**
   * Disables auto-aim tracking during committed aim-lock (Rule 1.4).
   */
  canAim() {
    if (this.isStrikerWindingUp) return false;
    return super.canAim();
  }

  /**
   * Aiming Pipeline:
   * Chigiri aims towards the enemy target.
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
   * Checks for Panther Sprint dash invulnerability and temporary speed boost evasion mechanic.
   */
  takeDamage(amount, attacker, opts = {}) {
    const isGuaranteedHit = Boolean(
      opts?.isGuaranteedHit ||
      opts?.undodgeable ||
      opts?.bypassEvade ||
      opts?.isSureKill ||
      opts?.isRatioCrit ||
      opts?.isNanamiPause ||
      opts?.isSaitamaCounter ||
      opts?.isDivineFlame ||
      opts?.isFuga ||
      opts?.isPureLoveBeam ||
      (opts?.projectile && opts?.projectile.isPureLoveBeam)
    );

    if (!isGuaranteedHit) {
      // 1. Panther Sprint Dash Invulnerability (100% intangibility during initial dash)
      if (this.pantherSprintInvulnTimer > 0) {
        spawnFloatingText('SLIP!', this.x, this.y - 18, '#EC4899');
        this.afterImages.push({
          x: this.x,
          y: this.y,
          angle: this.gunAngle !== undefined ? this.gunAngle : (this.angle || 0),
          r: this.r,
          alpha: 0.65,
          fadeSpeed: 0.08
        });
        return false;
      }

      // 2. Temporary Speed Boost Evade Mechanic (Post-Dash Speed Surge & EGO Mach Pace)
      const cfg = (typeof CONFIG !== 'undefined' && CONFIG.chigiri) ? CONFIG.chigiri : chigiriConfig;
      const isSpeedSurgeActive = (this.pantherSpeedBuffTimer > 0);
      const isEgoActive = Boolean(this.isEgoActive);

      if (isSpeedSurgeActive || isEgoActive) {
        let evadeChance = 0;
        if (isSpeedSurgeActive) {
          evadeChance = cfg.pantherSprintEvadeChance !== undefined
            ? cfg.pantherSprintEvadeChance
            : (this.pantherSprintEvadeChance !== undefined ? this.pantherSprintEvadeChance : 0.35);
        }
        if (isEgoActive) {
          const egoBuffs = getBlueLockEgoBuffs(this);
          const egoChance = (egoBuffs && typeof egoBuffs.dodgeChance === 'number') ? egoBuffs.dodgeChance : 0.25;
          evadeChance = (evadeChance > 0) ? Math.min(0.60, evadeChance + 0.15) : egoChance;
        }

        if (Math.random() < evadeChance) {
          spawnFloatingText('EVADE!', this.x, this.y - 18, this.color || '#EC4899');
          playSound('Assets/Sound Effects/Skills/dash1.mp3', 0.60);

          // Evasive Mach ghost slip trails
          const slipAngle = (attacker && typeof attacker.x === 'number' && typeof attacker.y === 'number')
            ? Math.atan2(this.y - attacker.y, this.x - attacker.x)
            : (this.gunAngle !== undefined ? this.gunAngle : (this.angle || 0));

          this.afterImages.push({
            x: this.x - Math.cos(slipAngle) * 14,
            y: this.y - Math.sin(slipAngle) * 14,
            angle: this.gunAngle !== undefined ? this.gunAngle : (this.angle || 0),
            r: this.r,
            alpha: 0.65,
            fadeSpeed: 0.08
          });
          this.afterImages.push({
            x: this.x - Math.cos(slipAngle) * 28,
            y: this.y - Math.sin(slipAngle) * 28,
            angle: this.gunAngle !== undefined ? this.gunAngle : (this.angle || 0),
            r: this.r,
            alpha: 0.40,
            fadeSpeed: 0.08
          });

          // Aerodynamic rose wind burst
          this._spawnPuzzleParticles(this.x, this.y, 6, '#EC4899');

          // Reactive Mach slip micro-impulse
          const jukeSpeed = 3.5;
          this.vx += Math.cos(slipAngle) * jukeSpeed;
          this.vy += Math.sin(slipAngle) * jukeSpeed;

          return false; // Negates damage!
        }
      }
    }

    const res = super.takeDamage(amount, attacker, opts);
    // Ball Disruption / Poise check when hit while dribbling
    if (res && this.soccerBall && this.soccerBall.dribbler === this) {
      const cfg = (typeof CONFIG !== 'undefined' && CONFIG.chigiri) ? CONFIG.chigiri : chigiriConfig;
      const control = getFighterDribbleControl(this, cfg);
      if (amount >= 35 || Math.random() > control) {
        this.soccerBall.dribbler = null;
        this.soccerBall.vx += (Math.random() - 0.5) * 8;
        this.soccerBall.vy += (Math.random() - 0.5) * 8;
        spawnFloatingText('LOOSE BALL!', this.soccerBall.x, this.soccerBall.y - 18, '#FACC15');
      }
    }
    return res;
  }

  /**
   * Universal Beam Evasion:
   * If actively dashing or under a temporary speed boost, slips through continuous beams.
   */
  dodgeBeam(beamData = {}) {
    if (this.pantherSprintInvulnTimer > 0) {
      return true;
    }
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.chigiri) ? CONFIG.chigiri : chigiriConfig;
    if (this.pantherSpeedBuffTimer > 0 || this.isEgoActive) {
      const evadeChance = cfg.pantherSprintEvadeChance !== undefined
        ? cfg.pantherSprintEvadeChance
        : (this.pantherSprintEvadeChance !== undefined ? this.pantherSprintEvadeChance : 0.35);
      if (Math.random() < evadeChance) {
        return true;
      }
    }
    return super.dodgeBeam(beamData);
  }

  /**
   * Spawns floating puzzle piece / rose shard particles (Rule 25 compliant).
   */
  _spawnPuzzleParticles(x, y, count = 4, color = '#EC4899') {
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
        color: Math.random() < 0.4 ? '#F43F5E' : color,
        life: 22 + Math.random() * 12,
        maxLife: 34
      });
    }
  }

  /**
   * Spawns a 16-bit retro arcade hit impact effect when the soccer ball strikes an enemy.
   */
  _spawn16BitHitEffect(x, y, impactAngle, isDirectVolley = false) {
    spawn16BitHitEffect(this.active16BitHits, x, y, impactAngle, {
      isDirectVolley,
      color: this.color || '#EC4899'
    });
  }

  /**
   * Top-of-update non-freezing active visual effect decay routine (Rule 25).
   */
  _updateVisualEffects() {
    // 0. Blue Lock Ego Aura update & decay before freeze guard (Rule 25)
    // Ensures aura opacity and visual flame animation persist even when movement is stopped by attacks/CC
    if (this.isEgoActive || this.isPantherSprinting || (this.pantherSpeedBuffTimer || 0) > 0) {
      updateBlueLockEgoTrail(this);
    } else {
      decayBlueLockEgoTrail(this);
    }

    // 0b. Striker Ball Comet Trail Decay (Rule 25)
    if (this.soccerBall && !this.soccerBall.isStriker && !this.soccerBall.isDirectVolley) {
      decayStrikerBallTrail(this.soccerBall);
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

    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.chigiri) ? CONFIG.chigiri : chigiriConfig;

    // Dynamically ensure soccer ball radius stays synchronized with config
    if (this.soccerBall && cfg.pantherShotRadius && this.soccerBall.r !== cfg.pantherShotRadius) {
      this.soccerBall.r = cfg.pantherShotRadius;
    }

    // Decrement Skill Cooldowns
    if (this.shootCooldown > 0) this.shootCooldown--;

    // Skill 1: Panther Sprint Cooldown & Speed Buff Timer
    // Managed declaratively via SkillManager with duration gating; fallback if skillManager is not present
    if (!this.skillManager) {
      if (!this.isPantherSprinting && this.pantherSprintDashTimer <= 0 && this.pantherSpeedBuffTimer <= 0) {
        if (this.pantherSprintCooldownTimer > 0) this.pantherSprintCooldownTimer--;
      }
      if (this.strikerCooldownTimer > 0) this.strikerCooldownTimer--;
      if (this.pantherSpeedBuffTimer > 0) {
        this.pantherSpeedBuffTimer--;
      }
    }

    // Invulnerability timer from Panther Sprint
    if (this.pantherSprintInvulnTimer > 0) {
      this.pantherSprintInvulnTimer--;
      this.isInvulnerable = true;
    } else {
      this.isInvulnerable = false;
    }

    // 1b. Universal Blue Lock EGO Awakening Lifecycle & Cooldown Recovery
    updateBlueLockEgo(this, cfg);

    // 2. Update Panther Sprint Dash
    if (this.isPantherSprinting) {
      this._updatePantherSprintDash(arena);
    }

    // 3. Update the Single Soccer Ball Physics, Wall Bounces & Collisions (Primary Controller only)
    if (isPrimaryBlueLockBallController(this, state)) {
      this._updateSoccerBallPhysics(opponent, arena);
    }

    // 4. Combat & Natural Ball Interaction
    if (!this.isDead && opponent && !opponent.isDead) {
      this._handleCombatAndBallMeeting(opponent, arena, cfg);
    }

    // 5. Centralized Movement & Physics (Rule 1.2)
    if (!this.isPantherSprinting && !this.isStrikerWindingUp) {
      let speedMult = 1.0;
      if (this.kickSlowTimer > 0) {
        this.kickSlowTimer--;
        speedMult = this.kickSlowMultiplier || 0.25;
      }
      // Post-dash lingering speed surge (+40% speed boost)
      if (this.pantherSpeedBuffTimer > 0) {
        speedMult *= (cfg.pantherSprintSpeedBuffMultiplier || 1.40);
      }
      // EGO Awakening speed boost (+60% speed boost)
      if (this.isEgoActive) {
        const egoBuffs = getBlueLockEgoBuffs(this);
        if (egoBuffs && typeof egoBuffs.speedMultiplier === 'number') {
          speedMult *= egoBuffs.speedMultiplier;
        }
      }
      if (this.soccerBall && this.soccerBall.dribbler === this && this.shootCooldown > 0) {
        speedMult *= (cfg.dribbleSpeedMultiplier || 1.15);
      }
      this.applyMovementPhysics(speedMult);

      // Leave subtle ghost afterimage trails during active Mach speed surges (Rule 25)
      if ((this.pantherSpeedBuffTimer > 0 || this.isEgoActive) && Math.hypot(this.vx, this.vy) > 3.0) {
        if (this.pantherSpeedBuffTimer % 5 === 0 || (this.isEgoActive && Math.random() < 0.20)) {
          this.afterImages.push({
            x: this.x,
            y: this.y,
            angle: this.gunAngle !== undefined ? this.gunAngle : (this.angle || 0),
            r: this.r,
            alpha: 0.35,
            fadeSpeed: 0.06
          });
        }
      }

      if (this.canAim() && opponent && !opponent.isDead) {
        this.aim(opponent);
      }
      this.resolveWallBounce(arena, opponent);
    } else if (this.kickSlowTimer > 0) {
      this.kickSlowTimer--;
    }
  }

  /**
   * Combat & Natural Ball Interaction:
   * - Skill 1: Panther Sprint intercepts loose ball or repositions with invulnerability.
   * - Strictly guards against interacting with an incoming hostile lethal enemy kick!
   * - Kicks when in natural possession/contact with the ball.
   */
  _handleCombatAndBallMeeting(opponent, arena, cfg) {
    if (this.hitStunTimer > 0 || this.paralyzeTimer > 0 || this.knockbackStunTimer > 0) return;
    if (this._ballHitCooldown > 0 || this._isagiBallHitCooldown > 0) return;
    if (isHostileLethalBall(this.soccerBall, this)) return;

    const hasBall = this._hasSoccerBall();

    // 1. Skill 1: Panther Sprint (Ball Interception Dash & Lingering Speed Surge)
    if (!hasBall && this.soccerBall && !isHostileLethalBall(this.soccerBall, this) && isSkillEnabled(cfg.enablePantherSprint, true) && this.pantherSprintCooldownTimer <= 0) {
      const distToBall = Math.hypot(this.soccerBall.x - this.x, this.soccerBall.y - this.y);
      const interceptionRange = cfg.pantherSprintBallInterceptionRange || 180;
      const kickReach = this.r + this.soccerBall.r + 14;

      if (distToBall <= interceptionRange && distToBall > kickReach) {
        this._executePantherSprint(this.soccerBall, cfg);
        return;
      }
    }

    // 2. Check if Chigiri and the Soccer Ball naturally meet
    if (hasBall) {
      // Re-aim at the opponent upon getting the ball
      if (opponent && !opponent.isDead) {
        this.aim(opponent);
      }

      // If ready to attack:
      if (this.shootCooldown <= 0) {
        // Priority A: "STRIKER!" Finisher if off cooldown (instant hypersonic volley)
        if (isSkillEnabled(cfg.enableStriker, true) && this.strikerCooldownTimer <= 0) {
          this._unleashStrikerSkill(opponent, arena);
          return;
        }

        // Priority B: Panther Shot (Standard Kick towards enemy)
        if (isSkillEnabled(cfg.enablePantherShot, isSkillEnabled(cfg.enableEgoShot, true))) {
          this._firePantherShot(opponent, cfg);
          return;
        }
      }

      // If on cooldown, trap and dribble the ball at feet until shootCooldown <= 0
      dribbleSoccerBall(this, this.soccerBall, arena, cfg);
    }
  }

  /**
   * Kicks the soccer ball with high speed directly towards the enemy.
   */
  _firePantherShot(opponent, cfg) {
    if (!this.soccerBall) return;

    if (this.isPantherSprinting) {
      this.isPantherSprinting = false;
      this.pantherSprintDashTimer = 0;
    }
    this.kickSlowTimer = cfg.kickSlowDuration || 14;
    this.kickSlowMultiplier = cfg.kickSlowMultiplier || 0.25;
    this.vx *= 0.25;
    this.vy *= 0.25;

    const angle = (opponent && !opponent.isDead && typeof opponent.x === 'number' && typeof opponent.y === 'number')
      ? Math.atan2(opponent.y - this.y, opponent.x - this.x)
      : ((this.gunAngle !== undefined) ? this.gunAngle : ((this.angle !== undefined) ? this.angle : 0));
    this.gunAngle = angle;
    this.angle = angle;

    const kickSpeed = cfg.pantherShotSpeed || 15.0;
    const isEmpowered = Boolean(this.isEgoActive || (this.pantherSpeedBuffTimer > 0));

    executeSoccerKick(this, this.soccerBall, angle, isEmpowered ? kickSpeed * 1.30 : kickSpeed, {
      damage: cfg.pantherShotDamage || 22,
      reboundDamage: cfg.pantherShotReboundDamage || 28,
      isDirectVolley: isEmpowered,
      isStriker: isEmpowered,
      isSuperShot: isEmpowered,
      themeColor: '#EC4899',
      bounceBackChance: 0.50,
      rotSpeed: 0.28,
      kickAccuracy: cfg.kickAccuracy !== undefined ? cfg.kickAccuracy : this.kickAccuracy,
      maxKickSpread: cfg.maxKickSpread
    });

    this.shootCooldown = this.shootCooldownMax;
    this._spawnPuzzleParticles(this.soccerBall.x, this.soccerBall.y, 4, '#EC4899');
  }

  /**
   * Initiates Skill 1: Panther Sprint.
   * Dashing grants invulnerability and immediately triggers a lingering speed boost!
   */
  _executePantherSprint(targetEntity, cfg) {
    this.pantherSprintCooldownMax = cfg.pantherSprintCooldown || this.pantherSprintCooldownMax || 240;
    this.pantherSprintCooldownTimer = this.pantherSprintCooldownMax;
    this.isPantherSprinting = true;
    this._hasPassedThroughText = false;
    this.pantherSprintDashTimer = cfg.pantherSprintDashFrames || 22;
    this.pantherSprintInvulnTimer = cfg.pantherSprintInvulnFrames || 14;

    // Core requirement: Every time he dashes, he gains a short brief of speed boost!
    this.pantherSpeedBuffTimer = cfg.pantherSprintSpeedBuffDuration || 150;

    const target = targetEntity || this.soccerBall;
    if (target) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const sprintAngle = Math.atan2(dy, dx);
      const dist = Math.hypot(dx, dy);
      const dashSpeed = Math.max(13, dist / this.pantherSprintDashTimer);
      this.vx = Math.cos(sprintAngle) * dashSpeed;
      this.vy = Math.sin(sprintAngle) * dashSpeed;
      this.gunAngle = sprintAngle;
      this.angle = sprintAngle;
    }

    spawnFloatingText('PANTHER SPRINT!', this.x, this.y - 18, '#EC4899');
    playSound('Assets/Sound Effects/Skills/dash1.mp3', 0.75);
    this._spawnPuzzleParticles(this.x, this.y, 8, '#EC4899');
  }

  /**
   * Updates Panther Sprint dash movement.
   */
  _updatePantherSprintDash(arena) {
    this.x += this.vx;
    this.y += this.vy;

    if (arena) {
      this.x = Math.max(arena.x + this.r, Math.min(arena.x + arena.width - this.r, this.x));
      this.y = Math.max(arena.y + this.r, Math.min(arena.y + arena.height - this.r, this.y));
    }

    // Leave ghost afterimage
    if (this.pantherSprintDashTimer % 3 === 0) {
      this.afterImages.push({
        x: this.x,
        y: this.y,
        angle: this.gunAngle || this.angle || 0,
        r: this.r,
        alpha: 0.60,
        fadeSpeed: 0.08
      });
    }

    this.pantherSprintDashTimer--;
    if (this.pantherSprintDashTimer <= 0) {
      this.isPantherSprinting = false;
      this._hasPassedThroughText = false;
      this.vx *= 0.3;
      this.vy *= 0.3;
    }
  }

  /**
   * Unleashes the hypersonic "STRIKER!" finisher strike on the single soccer ball with zero pause delay.
   * Delivers knockback then stun afterwards.
   */
  _unleashStrikerSkill(opponent, arena) {
    this.isStrikerWindingUp = false;
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.chigiri) ? CONFIG.chigiri : chigiriConfig;

    return executeStrikerSkill(this, this.soccerBall, opponent, arena, cfg, {
      speed: cfg.strikerSpeed || 26.0,
      themeColor: '#EC4899',
      shoutText: 'STRIKER!!',
      kickAccuracy: cfg.kickAccuracy !== undefined ? cfg.kickAccuracy : this.kickAccuracy,
      maxKickSpread: cfg.maxKickSpread
    });
  }

  /**
   * Updates the single persistent soccer ball: velocity, turf friction, wall rebounds & damage collisions.
   */
  _updateSoccerBallPhysics(primaryOpponent, arena) {
    if (!this.soccerBall) return;
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.chigiri) ? CONFIG.chigiri : chigiriConfig;
    updateSoccerBallPhysics(this.soccerBall, this, primaryOpponent, arena, cfg, state);
  }

  /**
   * Natural elastic deflection when fighter circle and soccer ball collide without kicking.
   */
  _resolveBallFighterDeflection(fighter) {
    resolveBallFighterDeflection(this.soccerBall, fighter, this.shootCooldown > this.shootCooldownMax - 4);
  }

  /**
   * Defines standard body pass for previewers and engine hooks (Rule 21).
   */
  drawBody(ctx) {
    drawChigiriSkin(ctx, this);
  }

  /**
   * Alias for standard skin drawing.
   */
  drawSkin(ctx) {
    this.drawBody(ctx);
  }

  /**
   * Custom Draw Pipeline (Rule 21: Must call drawHealth & drawFreezeTimer on top layer).
   */
  draw(ctx, opponent) {
    // 1. Draw Panther Sprint Ghost Afterimages
    for (let i = 0; i < this.afterImages.length; i++) {
      const img = this.afterImages[i];
      drawChigiriGhostSkin(ctx, img.x, img.y, img.angle, img.r, img.alpha);
    }

    // 2. Draw Ego Awakening Spectral Flame Spire & Ground Pool Aura (Back Layer & Decaying Wisps)
    drawBlueLockEgoAura(ctx, this);

    // 3. Draw Character Body Skin (Rule 24 Standard)
    this.drawBody(ctx);

    // 3.5 Draw Ego Awakening Front Ground Pool Licks & Flank Rim Wisps (3D Depth Wrapping)
    drawBlueLockEgoAuraFront(ctx, this);

    // 4. Draw THE Single Persistent Soccer Ball (Only primary Blue Lock controller draws)
    if (this.soccerBall && isPrimaryBlueLockBallController(this, state) && !this._isPreview && !this._isProfilePreview) {
      drawSoccerBallProjectile(ctx, this.soccerBall);
    }

    // 5. Draw Floating Puzzle Particles / Rose Shards
    for (let i = 0; i < this.puzzleParticles.length; i++) {
      const p = this.puzzleParticles[i];
      const alpha = p.life / p.maxLife;
      drawPuzzlePiece(ctx, p.x, p.y, p.size, p.rot, p.color, alpha);
    }

    // 6. Draw Concentric Shockwaves (Rule 26)
    for (let i = 0; i < this.shockwaves.length; i++) {
      drawStrikerShockwave(ctx, this.shockwaves[i]);
    }

    // 7. Draw 12-Frame Kick Impact Animations
    for (let i = 0; i < this.activeKickImpacts.length; i++) {
      drawKickImpact(ctx, this.activeKickImpacts[i]);
    }

    // 8. Draw Hardcoded 16-Bit Hit Impact Effects (Enemy Ball Hits)
    for (let i = 0; i < this.active16BitHits.length; i++) {
      draw16BitHitImpact(ctx, this.active16BitHits[i]);
    }

    // 9. Mandatory Rule 21 Overhead HP & Freeze Timer (TOP LAYER)
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }

  /**
   * Clean attack interruption on CC / defeat (Rule 25).
   */
  interruptAttacks(forceCancelAll = false) {
    this.isStrikerWindingUp = false;
    this.strikerWindupTimer = 0;
    this.isPantherSprinting = false;
    this.pantherSprintDashTimer = 0;
    if (forceCancelAll) {
      this.pantherSpeedBuffTimer = 0;
      this.pantherSprintInvulnTimer = 0;
      this.activeKickImpacts.length = 0;
      this.active16BitHits.length = 0;
      if (this._egoTrailNodes) this._egoTrailNodes.length = 0;
      if (this._egoDroplets) this._egoDroplets.length = 0;
      if (this._egoFlameWisps) this._egoFlameWisps.length = 0;
      this._egoAuraOpacity = 0;
    }
  }
}
