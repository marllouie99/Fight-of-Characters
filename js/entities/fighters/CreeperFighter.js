// ═══════════════════════════════════════════════════════════════════════════
// CREEPER (Minecraft) — Fighter Entity Implementation
// Adheres strictly to Repository Standards:
// - Rule 1.1: Freeze & TimeStop early exits
// - Rule 18: Mandatory HUD skill bar theme consistency (themeColor: #22C55E)
// - Rule 20: Symmetrical hand / paw positioning
// - Rule 21: Mandatory in-game overlay HP & freeze timer drawing
// - Rule 23: Mandatory basic projectile suppression (shoot override)
// - Rule 24: Toji reference standard (r: 25)
// - Rule 25: Non-freezing active visual effects & particle decay
// - Rule 32: Universal character black outline standard
// ═══════════════════════════════════════════════════════════════════════════

import { Fighter } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { creeperConfig } from '../../configs/characters/creeperConfig.js';
import { spawnFloatingText, triggerGlobalScreenShake, state } from '../../core/state.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { drawCreeperSkin } from '../../graphics/fighters/creeperSkin.js';
import { drawCreeperExplosion } from '../../graphics/weapons/creeperWeaponGraphics.js';
import { drawZeusThunderstrike } from '../../graphics/weapons/zeusWeaponGraphics.js';

export class CreeperFighter extends Fighter {
  constructor(def = {}) {
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.creeper) ? CONFIG.creeper : creeperConfig;
    super({
      ...def,
      r: cfg.r ?? 25,
      radius: cfg.radius ?? 25,
      hp: def.hp ?? cfg.hp ?? 380,
      maxHp: def.maxHp ?? cfg.maxHp ?? 380,
      speed: def.speed ?? cfg.speed ?? 4.2,
      color: def.color || cfg.color || '#22C55E',
    });

    this.characterId = 'creeper';
    this.type = 'creeper';
    this.name = def?.name || cfg.name || 'Creeper';
    this.displayName = def?.displayName || cfg.displayName || this.name;

    // Rule 18 & Character Palette Standards
    this.themeColor = cfg.themeColor || '#22C55E';
    this.color = this.themeColor;
    this.secondaryColor = cfg.secondaryColor || '#38BDF8';
    this.damageNumberColor = this.themeColor;

    // Base Humanoid Dimensions (Rule 24 Toji Standard)
    this.r = cfg.r || 25;
    this.radius = this.r;
    this.maxHp = def.hp ?? cfg.hp ?? 380;
    this.hp = this.maxHp;
    this.speed = def.speed ?? cfg.speed ?? 4.2;
    this.baseSpeed = this.speed;
    this.chargedSpeed = cfg.chargedSpeed || 5.4;
    this.hideHands = true; // Creeper is an armless/handless Minecraft mob

    // ── Combat Kit States & Cooldowns ──
    // Basic Attack: Suppressed (Rule 23 — No Basic Attack per Minecraft Lore)
    this.basicAttackCooldown = 999999;
    this.basicAttackCooldownTimer = 0;
    this.basicAttackDamage = 0;
    this.basicAttackReach = 0;
    this.basicAttackKnockback = 0;

    // Skill 1: "Tssssss..." (Proximity Fuse Detonation — Canonical Minecraft Mechanic)
    this.detonationCooldownMax = cfg.detonationCooldown || 180;
    this.detonationCooldownTimer = cfg.detonationInitialCooldown || 40;
    this.fuseTriggerDistance = cfg.fuseTriggerDistance || 88;
    this.fuseCancelDistance = cfg.fuseCancelDistance || 120;
    this.maxPrimeTimer = cfg.primeDurationFrames || 50;
    this.fuseTimer = 0;
    this.isPrimingDetonation = false;
    this.baseBlastRadius = cfg.baseBlastRadius || 135;
    this.baseBlastDamage = cfg.baseBlastDamage || 95;
    this.selfDetonationHpCost = cfg.selfDetonationHpCost || 65;
    this.blastKnockback = cfg.blastKnockback || 18;
    this._fuseHissSoundTimer = 0;
    this._lastHissTextFrame = -999;
    this._lastDefuseTextFrame = -999;

    // Ultimate: Charged Creeper (Lightning Awakening)
    this.chargedCooldownMax = cfg.chargedCooldown || 1800;
    this.chargedCooldownTimer = cfg.chargedInitialCooldown || 1080;
    this.chargedDuration = cfg.chargedDuration || 1200;
    this.chargedCreeperTimer = 0;
    this.isChargedCreeper = false;
    this.lightningAwakenTimer = 0;
    this.maxLightningAwakenTimer = 28;
    this.activeThunderstrikes = [];

    // Passive: Silent Stalker & Death Detonation
    this.enableDeathDetonation = cfg.enableDeathDetonation !== false;
    this.deathDetonationTimer = 0;
    this.hasDeathExploded = false;

    // Active visual arrays
    this.activeVisualExplosions = [];
    this.activeVisualEffects = [];

    // Register skills with universal SkillManager
    this._registerSkills();
  }

  // ── Backward-compatible getters & setters for SkillManager & external probes ──
  get detonationCooldown() { return this.detonationCooldownMax; }
  set detonationCooldown(val) { if (typeof val === 'number') this.detonationCooldownMax = val; }
  get primeDetonationTimer() { return this.fuseTimer; }
  set primeDetonationTimer(val) { if (typeof val === 'number') this.fuseTimer = val; }
  get chargedCooldown() { return this.chargedCooldownMax; }
  set chargedCooldown(val) { if (typeof val === 'number') this.chargedCooldownMax = val; }

  /**
   * Declarative Skill Registration (Rule 18 HUD Theme Consistency)
   */
  _registerSkills() {
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.creeper) ? CONFIG.creeper : creeperConfig;
    const skills = [];

    // Passive: Silent Stalker & Gunpowder Core
    skills.push({
      id: 'silent_stalker',
      name: 'Silent Stalker',
      type: 'passive',
      color: this.themeColor,
      description: 'Silent footwork and gunpowder regeneration core.'
    });

    // Skill 1: "Tssss!" (Proximity Fuse Detonation)
    if (this.isSkillEnabled(cfg.enablePrimedDetonation, true)) {
      skills.push({
        id: 'detonation',
        name: 'Detonation',
        type: 'active',
        cooldownKey: 'detonationCooldownTimer',
        cooldownMaxKey: 'detonationCooldownMax',
        color: this.themeColor,
        onActivate: () => this.primeDetonation()
      });
    }

    // Ultimate: Charged Creeper
    if (this.isSkillEnabled(cfg.enableChargedCreeper, true)) {
      skills.push({
        id: 'charged_creeper',
        name: 'Charged Creeper',
        type: 'ultimate',
        isUltimate: true,
        isSignature: true,
        signature: true,
        cooldownKey: 'chargedCooldownTimer',
        cooldownMaxKey: 'chargedCooldownMax',
        color: this.themeColor,
        onActivate: () => this.activateChargedCreeper()
      });
    }

    this.skillManager?.registerSkills(skills);
  }

  /**
   * Evaluates if Creeper is still active or currently priming his final retaliatory death explosion.
   */
  isEffectivelyAlive() {
    if (this.deathDetonationTimer > 0 && !this.hasDeathExploded) {
      return true;
    }
    return this.hp > 0 && !this.dead;
  }

  reset() {
    super.reset();
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.creeper) ? CONFIG.creeper : creeperConfig;
    this.speed = this.baseSpeed;
    this.hideHands = true;
    this.isPrimingDetonation = false;
    this.fuseTimer = 0;
    this._fuseHissSoundTimer = 0;
    this._lastHissTextFrame = -999;
    this._lastDefuseTextFrame = -999;
    this.isChargedCreeper = false;
    this.chargedCreeperTimer = 0;
    this.deathDetonationTimer = 0;
    this.hasDeathExploded = false;
    this.selfDetonationHpCost = cfg.selfDetonationHpCost || 65;
    this.detonationCooldownTimer = cfg.detonationInitialCooldown || 40;
    this.chargedCooldownTimer = cfg.chargedInitialCooldown || 1080;
    this.lightningAwakenTimer = 0;
    if (this.activeThunderstrikes) this.activeThunderstrikes.length = 0; else this.activeThunderstrikes = [];
    if (this.activeVisualExplosions) this.activeVisualExplosions.length = 0; else this.activeVisualExplosions = [];
    if (this.activeVisualEffects) this.activeVisualEffects.length = 0; else this.activeVisualEffects = [];
  }

  /**
   * Interrupt and cancel active actions.
   * If Creeper was hissing, knockback interrupts the prime and starts defusing!
   */
  interruptAttacks(forceCancelAll = false) {
    super.interruptAttacks?.(forceCancelAll);
    if (this.isPrimingDetonation) {
      this.isPrimingDetonation = false;
      // Allow fuseTimer to begin smoothly deflating
    }
    if (forceCancelAll) {
      if (this.activeThunderstrikes) this.activeThunderstrikes.length = 0;
      this.lightningAwakenTimer = 0;
      this.fuseTimer = 0;
    }
  }

  /**
   * Rule 23: Mandatory Basic Projectile Suppression
   * Creeper has NO basic attack. His offensive mechanism is strictly proximity self-detonation.
   */
  shoot(ownerIndex, opponent) {
    // Intentionally empty: Creeper has no basic attack or projectile shooting per Minecraft lore.
  }

  /**
   * Skill 1: Manual Prime Detonation Trigger ("Tssssss...!")
   */
  primeDetonation() {
    if (this.detonationCooldownTimer > 0 || this.deathDetonationTimer > 0) return false;

    this.isPrimingDetonation = true;
    this.fuseTimer = Math.max(this.fuseTimer, 12);

    // Sizzling fuse hiss audio trigger
    audioSystem.playSFX('creeper_fuse', 0.85);
    this._fuseHissSoundTimer = 24;
    spawnFloatingText(this.x, this.y - this.r - 20, 'Tssssssss...!', this.themeColor);
    return true;
  }

  /**
   * Ultimate: Charged Creeper (Lightning Strike Awakening)
   */
  activateChargedCreeper() {
    if (this.isChargedCreeper || this.chargedCooldownTimer > 0) return false;

    this.chargedCooldownTimer = this.chargedCooldownMax;
    this.isChargedCreeper = true;
    this.chargedCreeperTimer = this.chargedDuration;
    this.speed = this.chargedSpeed;
    this.lightningAwakenTimer = 28;
    this.maxLightningAwakenTimer = 28;
    this.vx = 0;
    this.vy = 0;

    // Celestial lightning strike visual & sound
    triggerGlobalScreenShake(9.0, 20);
    audioSystem.playSFX('skill_thunderstrike', 1.0);
    spawnFloatingText(this.x, this.y - this.r - 24, 'CHARGED CREEPER!', '#38BDF8');

    // Spawn authentic Zeus Thunderstrike descending from the heavens directly onto Creeper
    const strike = {
      x: this.x,
      y: this.y,
      life: 28,
      maxLife: 28,
      scale: 1.55,
      color: 'blue',
      isCrit: true,
      alpha: 1.0
    };
    if (!this.activeThunderstrikes) this.activeThunderstrikes = [];
    this.activeThunderstrikes.push(strike);

    // Lightning strike flash burst
    this.activeVisualExplosions.push({
      x: this.x,
      y: this.y,
      radius: 180,
      timer: 26,
      maxTimer: 26,
      isCharged: true
    });
    return true;
  }

  /**
   * Unleashes a concussive explosion at designated coordinates.
   */
  _triggerExplosion(x, y, radius = 80, damage = 50, isCharged = false, arena = state.arena) {
    this.activeVisualExplosions.push({
      x,
      y,
      radius,
      timer: 30,
      maxTimer: 30,
      isCharged
    });
    triggerGlobalScreenShake(isCharged ? 8.0 : 5.0, 10);
    if (typeof audioSystem !== 'undefined' && typeof audioSystem.playSFX === 'function') {
      audioSystem.playSFX('creeper_explode', 0.9);
    }
  }

  /**
   * Executes Creeper's devastating self-detonation blast.
   */
  _executeDetonation(isDeathNuke = false) {
    const isCharged = this.isChargedCreeper || isDeathNuke;
    const blastR = (isCharged ? this.baseBlastRadius * 1.85 : this.baseBlastRadius) * (isDeathNuke ? 1.2 : 1.0);
    const blastDmg = (isCharged ? this.baseBlastDamage * 2.47 : this.baseBlastDamage) * (isDeathNuke ? 1.15 : 1.0);

    // 1. Visual explosion entity
    this.activeVisualExplosions.push({
      x: this.x,
      y: this.y,
      radius: blastR,
      timer: 30,
      maxTimer: 30,
      isCharged: isCharged
    });

    // 2. Audio & Impact Screen Rumble
    triggerGlobalScreenShake(isCharged ? 10.0 : 7.0, isCharged ? 18 : 12);
    audioSystem.playSFX('creeper_explode', 1.0);

    // 3. Area of Effect damage & heavy knockback to all valid enemies
    const targets = (state.fighters || []).concat(state.illusions || []);
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (!target || target === this || target.hp <= 0) continue;
      if (typeof state.isFriendlyFire === 'function' && state.isFriendlyFire(this, target)) continue;

      const d = Math.hypot(target.x - this.x, target.y - this.y);
      if (d <= blastR + (target.r || 25)) {
        const falloff = Math.max(0.45, 1.0 - (d / blastR) * 0.55);
        const finalDmg = Math.round(blastDmg * falloff);
        const hitAngle = Math.atan2(target.y - this.y, target.x - this.x);
        const kb = this.blastKnockback * falloff * (isCharged ? 1.4 : 1.0);

        if (typeof target.takeDamage === 'function') {
          target.takeDamage(finalDmg, this);
        }
        target.vx = (target.vx || 0) + Math.cos(hitAngle) * kb;
        target.vy = (target.vy || 0) + Math.sin(hitAngle) * kb;
      }
    }

    // 4. Recoil Creeper backwards slightly from blast pressure
    if (!isDeathNuke && this.aimTarget) {
      const oppAngle = Math.atan2(this.aimTarget.y - this.y, this.aimTarget.x - this.x);
      this.vx = -Math.cos(oppAngle) * 6;
      this.vy = -Math.sin(oppAngle) * 6;
    }

    // 5. Mandatory Self-Detonation HP Cost: Creeper loses HP every time he explodes himself
    if (!isDeathNuke) {
      const selfCost = isCharged ? Math.round((this.selfDetonationHpCost || 65) * 1.15) : (this.selfDetonationHpCost || 65);
      const prevHp = this.hp;
      this.hp = Math.max(0, Number((this.hp - selfCost).toFixed(2)));
      const actualLost = prevHp - this.hp;
      if (actualLost > 0) {
        this.damageReceived = (this.damageReceived || 0) + actualLost;
        this._healthBarDamageTimer = 16;
        spawnFloatingText(this.x, this.y - this.r - 18, `-${actualLost} HP`, '#EF4444');
      }

      // Enter detonation cooldown between explosions
      this.detonationCooldownTimer = this.detonationCooldownMax;

      // If self-detonation depletes remaining HP to 0, trigger final death detonation
      if (this.hp <= 0 && this.enableDeathDetonation && !this.hasDeathExploded) {
        this.deathDetonationTimer = 45;
        this.vx = 0;
        this.vy = 0;
        this.lightningAwakenTimer = 0;
        audioSystem.playSFX('creeper_fuse', 0.85);
      }
    }

    this.isPrimingDetonation = false;
    this.fuseTimer = 0;
  }

  /**
   * Updates proximity fuse state machine:
   * - In close proximity (< fuseTriggerDistance) & off cooldown: stops, hisses, swells, advances fuse.
   * - Retreated / knocked back (> fuseCancelDistance): defuses, cancels hissing, deflates back to normal.
   */
  _updateProximityFuse(opponent) {
    if (this.hp <= 0 || this.deathDetonationTimer > 0) return;

    if (this._fuseHissSoundTimer > 0) {
      this._fuseHissSoundTimer--;
    }

    if (!opponent || opponent.hp <= 0) {
      if (this.fuseTimer > 0) {
        this.fuseTimer = Math.max(0, this.fuseTimer - 1.5);
        this.isPrimingDetonation = false;
      }
      return;
    }

    const dist = Math.hypot(opponent.x - this.x, opponent.y - this.y);

    // 1. Proximity Stalking Contact -> Start / Advance Fuse & Hiss
    if (dist <= this.fuseTriggerDistance && this.detonationCooldownTimer <= 0) {
      this.isPrimingDetonation = true;
      this.fuseTimer = Math.min(this.maxPrimeTimer, this.fuseTimer + 1);

      // Stalling / halt in place while hissing (authentic Minecraft behavior)
      this.vx *= 0.25;
      this.vy *= 0.25;

      // Periodic fuse hiss sound
      if (this._fuseHissSoundTimer <= 0) {
        audioSystem.playSFX('creeper_fuse', 0.85);
        this._fuseHissSoundTimer = 24;
      }

      // Floating text feedback (debounced)
      const frame = (typeof state !== 'undefined' && state.frameCount) ? state.frameCount : 0;
      if (frame - this._lastHissTextFrame > 50) {
        spawnFloatingText(this.x, this.y - this.r - 20, 'Tssssssss...!', this.themeColor);
        this._lastHissTextFrame = frame;
      }

      // Detonate upon fuse completion
      if (this.fuseTimer >= this.maxPrimeTimer) {
        this._executeDetonation(false);
      }
    }
    // 2. Beyond Cancel Distance -> Abort & Defuse! (Canonical Minecraft Defuse Rule)
    else if (dist > this.fuseCancelDistance) {
      if (this.isPrimingDetonation) {
        this.isPrimingDetonation = false;
        const frame = (typeof state !== 'undefined' && state.frameCount) ? state.frameCount : 0;
        if (frame - this._lastDefuseTextFrame > 60 && this.fuseTimer > 10) {
          spawnFloatingText(this.x, this.y - this.r - 18, 'Defused!', '#94A3B8');
          this._lastDefuseTextFrame = frame;
        }
      }
      // Fuse smoothly deflates back to zero
      if (this.fuseTimer > 0) {
        this.fuseTimer = Math.max(0, this.fuseTimer - 1.5);
      }
    }
    // 3. Hysteresis Buffer Zone (fuseTriggerDistance < dist <= fuseCancelDistance)
    else {
      if (this.isPrimingDetonation && this.detonationCooldownTimer <= 0) {
        this.fuseTimer = Math.min(this.maxPrimeTimer, this.fuseTimer + 1);
        this.vx *= 0.35;
        this.vy *= 0.35;
        if (this._fuseHissSoundTimer <= 0) {
          audioSystem.playSFX('creeper_fuse', 0.85);
          this._fuseHissSoundTimer = 24;
        }
        if (this.fuseTimer >= this.maxPrimeTimer) {
          this._executeDetonation(false);
        }
      } else if (this.fuseTimer > 0) {
        this.fuseTimer = Math.max(0, this.fuseTimer - 1.5);
      }
    }
  }

  /**
   * Applies continuous contact electric shock damage to targets touching Charged Creeper.
   */
  _tickChargedContactShock(opponent) {
    if (!this.isChargedCreeper || !opponent || opponent.hp <= 0) return;
    const d = Math.hypot(opponent.x - this.x, opponent.y - this.y);
    if (d <= this.r + (opponent.r || 25) + 12) {
      if (typeof opponent.takeDamage === 'function') {
        opponent.takeDamage(6, this);
      } else {
        opponent.hp = Math.max(0, opponent.hp - 6);
      }
      if (typeof audioSystem !== 'undefined' && typeof audioSystem.playSFX === 'function') {
        audioSystem.playSFX('skill_zenitsu_electric1', 0.5);
      }
    }
  }

  /**
   * Rule 25: Decay active explosions and particles at top of update
   */
  _updateVisualExplosions() {
    if (this.activeThunderstrikes) {
      for (let i = this.activeThunderstrikes.length - 1; i >= 0; i--) {
        const strike = this.activeThunderstrikes[i];
        strike.life--;
        if (strike.life <= 0) {
          this.activeThunderstrikes.splice(i, 1);
        }
      }
    }
    for (let i = this.activeVisualExplosions.length - 1; i >= 0; i--) {
      const vfx = this.activeVisualExplosions[i];
      vfx.timer--;
      if (vfx.timer <= 0) {
        this.activeVisualExplosions.splice(i, 1);
      }
    }
    for (let i = this.activeVisualEffects.length - 1; i >= 0; i--) {
      const vfx = this.activeVisualEffects[i];
      vfx.timer--;
      if (vfx.timer <= 0) {
        this.activeVisualEffects.splice(i, 1);
      }
    }
  }

  update(opponent, ownerIndex, arena) {
    // 0. Update visual effects & transient particle lifecycles before freeze guard (Rule 25)
    this._updateVisualExplosions();

    // 1. Mandatory freeze / time-stop guard (Rule 1.1)
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks();
      return;
    }

    // 2. Death Detonation Handling (Final Retaliation Passive)
    if (this.hp <= 0 && this.enableDeathDetonation && !this.hasDeathExploded) {
      if (this.deathDetonationTimer === 0) {
        this.deathDetonationTimer = 45;
        this.vx = 0;
        this.vy = 0;
        this.lightningAwakenTimer = 0;
        audioSystem.playSFX('creeper_fuse', 0.85);
      }
      this.deathDetonationTimer--;
      if (this.deathDetonationTimer <= 0) {
        this.hasDeathExploded = true;
        this._executeDetonation(true);
        this.dead = true;
        if (typeof this.checkRoundOrMatchEnd === 'function') {
          this.checkRoundOrMatchEnd();
        }
      }
      return; // Stop update while death nuke is hyper-flashing
    }

    if (this.hp <= 0) {
      this.dead = true;
      if (typeof this.checkRoundOrMatchEnd === 'function') {
        this.checkRoundOrMatchEnd();
      }
      return;
    }

    // 2.5. Lightning Strike Awakening Stun / Dramatic Freeze (0.46s)
    if (this.lightningAwakenTimer > 0) {
      this.lightningAwakenTimer--;
      this.vx *= 0.2;
      this.vy *= 0.2;
      this.gunAngle = 0;
      return; // Freeze movement & attacks while celestial lightning bolt strikes Creeper
    }

    this.handleStatusEffects();
    this._tickCooldowns();
    this._tickAttackSound();

    // 3. Skill & Ability Timers Decay
    if (this.basicAttackCooldownTimer > 0) this.basicAttackCooldownTimer--;
    if (this.detonationCooldownTimer > 0 && !this.isPrimingDetonation) this.detonationCooldownTimer--;

    // Charged Creeper Lifetime Drain
    if (this.chargedCreeperTimer > 0) {
      this.chargedCreeperTimer--;
      this.isChargedCreeper = this.chargedCreeperTimer > 0;
      if (!this.isChargedCreeper) {
        this.speed = this.baseSpeed;
      } else if (opponent && opponent.hp > 0) {
        if (this.chargedCreeperTimer % 15 === 0) {
          this._tickChargedContactShock(opponent);
        }
      }
    } else if (this.chargedCooldownTimer > 0) {
      this.chargedCooldownTimer--;
    }

    // 4. Proximity Fuse State Machine (Automatic Stalking Hiss & Defuse)
    this._updateProximityFuse(opponent);

    // 5. AI Decision Matrix
    if (opponent && opponent.hp > 0) {
      // AI: Activate Charged Creeper when off cooldown
      if (this.chargedCooldownTimer <= 0) {
        this.activateChargedCreeper();
      }
    }

    // 6. Centralized Movement & Physics (Rule 1.2)
    super.update(opponent, ownerIndex, arena);
  }

  /**
   * Rule 21: Standard body renderer hooks for character previews and render passes.
   */
  drawBody(ctx) {
    drawCreeperSkin(ctx, this);
  }

  drawSkin(ctx) {
    drawCreeperSkin(ctx, this);
  }

  /**
   * Rule 21: Custom fighter draw pipeline.
   * Renders explosions, lightning awakening thunderstrikes, Creeper's body, and MANDATORY overhead HP.
   */
  draw(ctx, opponent) {
    if (!ctx) return;

    // 1. Draw concussive Minecraft explosions & water-ripple shockwaves
    for (let i = 0; i < this.activeVisualExplosions.length; i++) {
      drawCreeperExplosion(ctx, this.activeVisualExplosions[i]);
    }

    // 2. Draw Zeus Thunderstrike Awakening Animation (Ground fractures, sky lightning bolt, shine bloom, embers)
    if (this.activeThunderstrikes && this.activeThunderstrikes.length > 0) {
      for (let i = 0; i < this.activeThunderstrikes.length; i++) {
        drawZeusThunderstrike(ctx, this.activeThunderstrikes[i]);
      }
    }

    // 3. Draw Creeper body (internal world translation contract)
    this.drawBody(ctx);

    // 4. Mandatory Rule 21: Overhead HP & Freeze Timer on top layer
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }
}
