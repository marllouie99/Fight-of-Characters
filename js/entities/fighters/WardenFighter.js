// ═══════════════════════════════════════════════════════════════════════════
// THE WARDEN (Minecraft: The Deep Dark) — Combat Entity Class
// Adheres strictly to:
// - Rule 1.1: Freeze & TimeStop Early Exits
// - Rule 1.4: Continuous 360° Skill Aiming & Committed Aim Lock
// - Rule 20: Canonical Default Model Hands
// - Rule 21: In-Game Overlay HP & Status Drawing Standard
// - Rule 23: Basic Projectile Suppression (shoot override)
// - Rule 24: Universal Character Body Model (r = 30 Boss Tier)
// - Rule 25: Non-Freezing Active Visual Effects Standard
// - Rule 26: Clean Concentric Shockwave Standard (Anti-Cobweb Rule)
// - Rule 30: 5-Phase Melee Combat Kinematics & Physical Force Standard
// - Rule 32: Universal Character Black Outline Standard
// ═══════════════════════════════════════════════════════════════════════════

import { Fighter } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { wardenConfig } from '../../configs/characters/wardenConfig.js';
import { state, spawnFloatingText, triggerGlobalScreenShake } from '../../core/state.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { drawWardenSkin } from '../../graphics/fighters/wardenSkin.js';
import { drawWardenSonicBoomWave } from '../../graphics/weapons/wardenWeaponGraphics.js';

export class WardenFighter extends Fighter {
  constructor(def = {}) {
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.warden) ? CONFIG.warden : wardenConfig;
    super({
      ...def,
      r: cfg.r ?? 30,
      radius: cfg.radius ?? 30,
      hp: def.hp ?? cfg.hp ?? 580,
      maxHp: def.maxHp ?? cfg.maxHp ?? 580,
      speed: def.speed ?? cfg.speed ?? 3.8,
      color: def.color || cfg.color || '#0D9488',
    });

    this.characterId = 'warden';
    this.type = 'warden';
    this.name = def?.name || cfg.name || 'Warden';
    this.displayName = def?.displayName || cfg.displayName || 'The Warden';
    this.grade = cfg.grade || 'S';
    this.title = cfg.title || 'Blind Horror of the Deep Dark';

    // Base Attributes (Rule 24 Hulking Boss Tier r = 30)
    this.r = cfg.r || 30;
    this.radius = cfg.radius || 30;
    this.maxHp = cfg.maxHp || 580;
    this.hp = cfg.hp || 580;
    this.speed = cfg.speed || 3.8;
    this.moveSpeed = cfg.moveSpeed || 3.8;
    this.color = cfg.color || '#0D9488';
    this.themeColor = cfg.themeColor || '#0D9488';
    this.secondaryColor = cfg.secondaryColor || '#00F5D4';
    this.damageNumberColor = cfg.damageNumberColor || '#00F5D4';

    // ── Passive: Sculk Vibration Echolocation & Anger Engine ──
    this.anger = 0;
    this.maxAnger = cfg.maxAnger || 100;
    this.isEnraged = false;
    this.enragedTimer = 0;
    this.enragedDuration = cfg.enragedDuration || 360;
    this.angerDecayTimer = 0;
    this.vibrationDetectionRadius = cfg.vibrationDetectionRadius || 420;

    // Last recorded opponent positions for movement vibration detection
    this._lastOpponentX = null;
    this._lastOpponentY = null;

    // ── Basic Attack: Heavy Sculk Pulverize (5-Phase Melee Combat) ──
    this.basicAttackCooldownTimer = 0;
    this.isPunching = false;
    this.punchPhase = 0; // 1: Lift, 2: Hold, 3: Strike, 4: Impact Lock, 5: Recovery
    this.punchPhaseTimer = 0;
    this.punchTargetAngle = 0;
    this.punchHitRegistered = false;

    // ── Skill 1: Darkness Pulse ──
    this.darknessCooldownTimer = 180; // Starts with short initial delay
    this.darknessRadius = cfg.darknessRadius || 240;
    this.isDarknessPulsing = false;
    this.darknessPulseProgress = 0;

    // ── Skill 2: Sculk Tendril Sniff ──
    this.sniffCooldownTimer = 240;
    this.isSniffing = false;
    this.sniffTimer = 0;

    // ── Ultimate: Sculk Sonic Boom ──
    this.sonicBoomCooldownTimer = 360; // Initial warmup
    this.isSonicBoomCharging = false;
    this.sonicBoomChargeTimer = 0;
    this.isSonicBoomFiring = false;
    this.sonicBoomFireTimer = 0;
    this.skillCastAngle = 0;

    // Transient Visual Effects Arrays (Rule 25 compliant)
    this.activeVibrationArcs = [];
    this.activeSculkBursts = [];
    this.activeSonicWaves = [];
    this.activeDarknessWaves = [];
  }

  /**
   * Overrides base Fighter.shoot() to suppress default generic bullet projectiles (Rule 23).
   */
  shoot(ownerIndex) {
    // Intentionally empty: Warden uses dedicated combat skills, echolocation, and Heavy Sculk Pulverize
  }

  /**
   * Decays transient visual effect lifecycles (Rule 25: runs before freeze exit).
   */
  _updateVisualEffects() {
    // 1. Vibration arcs flying toward horns
    for (let i = this.activeVibrationArcs.length - 1; i >= 0; i--) {
      const arc = this.activeVibrationArcs[i];
      arc.t += 0.06;
      if (arc.t >= 1.0) {
        this.activeVibrationArcs.splice(i, 1);
      }
    }

    // 2. Sculk particle bursts
    for (let i = this.activeSculkBursts.length - 1; i >= 0; i--) {
      const b = this.activeSculkBursts[i];
      b.timer--;
      b.x += b.vx;
      b.y += b.vy;
      b.vx *= 0.92;
      b.vy *= 0.92;
      if (b.timer <= 0) {
        this.activeSculkBursts.splice(i, 1);
      }
    }

    // 3. Sonic Boom shockwave discs (Rule 26 compliant concentric waves)
    for (let i = this.activeSonicWaves.length - 1; i >= 0; i--) {
      const w = this.activeSonicWaves[i];
      w.timer++;
      if (w.timer >= w.maxTimer) {
        this.activeSonicWaves.splice(i, 1);
      }
    }

    // 4. Darkness Pulse waves
    for (let i = this.activeDarknessWaves.length - 1; i >= 0; i--) {
      const dw = this.activeDarknessWaves[i];
      dw.timer++;
      if (dw.timer >= dw.maxTimer) {
        this.activeDarknessWaves.splice(i, 1);
      }
    }
  }

  /**
   * Interrupts active channeling on stun or time stop.
   */
  interruptAttacks(forceCancelAll = false) {
    this.isPunching = false;
    this.punchPhase = 0;
    this.punchPhaseTimer = 0;
    this.isSniffing = false;
    this.sniffTimer = 0;
    this.isSonicBoomCharging = false;
    this.sonicBoomChargeTimer = 0;
    this.isSonicBoomFiring = false;
    this.sonicBoomFireTimer = 0;

    if (forceCancelAll) {
      this.activeVibrationArcs.length = 0;
    }
  }

  /**
   * Main Per-Frame Update Loop
   */
  update(opponent, ownerIndex, arena) {
    // 0. Update visual effects before freeze guard (Rule 25)
    this._updateVisualEffects();

    // 1. Mandatory Rule 1.1 Freeze & TimeStop Guard
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks();
      return;
    }

    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.warden) ? CONFIG.warden : wardenConfig;

    // 2. Cooldown Tickers
    if (this.basicAttackCooldownTimer > 0) this.basicAttackCooldownTimer--;
    if (this.darknessCooldownTimer > 0) this.darknessCooldownTimer--;
    if (this.sniffCooldownTimer > 0) this.sniffCooldownTimer--;
    if (this.sonicBoomCooldownTimer > 0) this.sonicBoomCooldownTimer--;

    // 3. Enraged State Lifecycle & Speed Scaling
    if (this.isEnraged) {
      this.enragedTimer--;
      this.moveSpeed = cfg.enragedSpeed || 5.6;
      this.speed = cfg.enragedSpeed || 5.6;
      if (this.enragedTimer <= 0) {
        this.isEnraged = false;
        this.anger = 0;
        this.moveSpeed = cfg.moveSpeed || 3.8;
        this.speed = cfg.moveSpeed || 3.8;
      }
    } else {
      this.moveSpeed = cfg.moveSpeed || 3.8;
      this.speed = cfg.moveSpeed || 3.8;

      // Anger decay when no vibrations are detected
      this.angerDecayTimer++;
      if (this.angerDecayTimer >= (cfg.angerDecayCadence || 30)) {
        this.angerDecayTimer = 0;
        if (this.anger > 0) this.anger = Math.max(0, this.anger - 1);
      }
    }

    // 4. Passive: Vibration Echolocation Detector
    this._processEcholocation(opponent);

    // 5. Active Combat & Skill AI
    if (opponent && opponent.hp > 0) {
      this._updateWardenCombat(opponent, ownerIndex, arena, cfg);
    }

    // 6. Centralized Movement & Physics Delegation
    if (!this.isSonicBoomCharging && !this.isSonicBoomFiring && !this.isSniffing) {
      super.update(opponent, ownerIndex, arena);
    } else {
      // Locked in channeling stasis
      this.vx *= 0.85;
      this.vy *= 0.85;
      this.applyMovementPhysics(0.1);
      this.resolveWallBounce(arena, opponent);
    }
  }

  /**
   * Detects sound vibrations from opponent movement, attacks, and projectiles.
   */
  _processEcholocation(opponent) {
    if (!opponent || opponent.hp <= 0) return;

    const dx = opponent.x - this.x;
    const dy = opponent.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > this.vibrationDetectionRadius) return;

    // 1. Detect high-speed movement or dashing vibrations
    if (this._lastOpponentX !== null && this._lastOpponentY !== null) {
      const movedDist = Math.hypot(opponent.x - this._lastOpponentX, opponent.y - this._lastOpponentY);
      if (movedDist > 4.5) {
        this._addAnger(2, opponent.x, opponent.y, 'footstep');
      }
    }
    this._lastOpponentX = opponent.x;
    this._lastOpponentY = opponent.y;

    // 2. Detect opponent attack swings / channeling
    if (opponent.isAttacking || opponent.isPunching || opponent.isChanneling || opponent.isSwinging) {
      if (Math.random() < 0.15) {
        this._addAnger(8, opponent.x, opponent.y, 'attack');
      }
    }
  }

  /**
   * Increases Warden's anger and spawns cyan vibration arc particles.
   */
  _addAnger(amount, sourceX, sourceY, reason = '') {
    if (this.isEnraged) return;

    this.anger = Math.min(this.maxAnger, this.anger + amount);

    // Spawn cyan vibration arc traveling from noise source to Warden's head
    if (this.activeVibrationArcs.length < 8) {
      this.activeVibrationArcs.push({
        sx: sourceX,
        sy: sourceY,
        tx: this.x,
        ty: this.y - this.r * 0.8,
        t: 0,
        radius: 12 + Math.random() * 8
      });
    }

    // Check Enraged Threshold
    if (this.anger >= this.maxAnger) {
      this._triggerEnragedState();
    }
  }

  _triggerEnragedState() {
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.warden) ? CONFIG.warden : wardenConfig;
    this.isEnraged = true;
    this.enragedTimer = this.enragedDuration;
    this.anger = this.maxAnger;
    this.moveSpeed = cfg.enragedSpeed || 5.6;
    this.speed = cfg.enragedSpeed || 5.6;

    // Enraged Roar SFX & Screen Shake
    triggerGlobalScreenShake(4.5, 18);
    spawnFloatingText(this.x, this.y - this.r - 20, 'ROAAAR! (ENRAGED)', '#00F5D4');

    if (typeof audioSystem !== 'undefined' && audioSystem.playSFX) {
      audioSystem.playSFX('skill_heavy_slam', 1.0);
    }

    // Burst sculk embers
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const spd = 3.5 + Math.random() * 3.5;
      this.activeSculkBursts.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        timer: 30,
        color: '#00F5D4'
      });
    }
  }

  /**
   * Combat AI decision tree for melee, skills, and sonic boom.
   */
  _updateWardenCombat(opponent, ownerIndex, arena, cfg) {
    const dx = opponent.x - this.x;
    const dy = opponent.y - this.y;
    const dist = Math.hypot(dx, dy);
    const targetAngle = Math.atan2(dy, dx);

    // Update gunAngle unless locked in Sonic Boom committed release
    if (!this.isSonicBoomCharging && !this.isSonicBoomFiring) {
      this.gunAngle = targetAngle;
      this.angle = targetAngle;
    }

    // 1. Ultimate: Sculk Sonic Boom (Rule 1.4 Committed Aim Lock)
    if (this.sonicBoomCooldownTimer <= 0 && dist <= (cfg.sonicBoomReach || 520) && !this.isPunching && !this.isSniffing) {
      this._startSonicBoom(targetAngle);
      return;
    }

    if (this.isSonicBoomCharging) {
      this._updateSonicBoomCharge(opponent, cfg);
      return;
    }

    if (this.isSonicBoomFiring) {
      this._updateSonicBoomFire(opponent, cfg);
      return;
    }

    // 2. Skill 2: Sculk Tendril Sniff (Reveals stealth / roots target)
    if (this.sniffCooldownTimer <= 0 && dist <= 320 && !this.isPunching) {
      this._castSculkSniff(opponent, cfg);
      return;
    }

    if (this.isSniffing) {
      this.sniffTimer--;
      if (this.sniffTimer <= 0) {
        this.isSniffing = false;
      }
      return;
    }

    // 3. Skill 1: Darkness Pulse
    if (this.darknessCooldownTimer <= 0 && dist <= this.darknessRadius && !this.isPunching) {
      this._castDarknessPulse(opponent, cfg);
    }

    // 4. Basic Attack: Heavy Sculk Pulverize (5-Phase Melee Combat - Rule 30)
    if (this.isPunching) {
      this._updatePunchCycle(opponent, cfg);
      return;
    }

    if (this.basicAttackCooldownTimer <= 0 && dist <= (cfg.basicAttackReach || 80)) {
      this._startPunchCycle(targetAngle, cfg);
    }
  }

  // ── 5-Phase Melee Combat Kinematics (Rule 30) ──
  _startPunchCycle(targetAngle, cfg) {
    this.isPunching = true;
    this.punchPhase = 1; // Phase 1: Lift / Coil
    this.punchPhaseTimer = cfg.punchLiftFrames || 8;
    this.punchTargetAngle = targetAngle;
    this.punchHitRegistered = false;
  }

  _updatePunchCycle(opponent, cfg) {
    this.punchPhaseTimer--;

    // Phase 1: Lift / Coil
    if (this.punchPhase === 1) {
      if (this.punchPhaseTimer <= 0) {
        this.punchPhase = 2; // Poised Hold
        this.punchPhaseTimer = cfg.punchHoldFrames || 3;
      }
    }
    // Phase 2: Poised Hold
    else if (this.punchPhase === 2) {
      if (this.punchPhaseTimer <= 0) {
        this.punchPhase = 3; // Hypersonic Strike
        this.punchPhaseTimer = cfg.punchStrikeFrames || 7;
      }
    }
    // Phase 3: Hypersonic Whip Strike
    else if (this.punchPhase === 3) {
      if (!this.punchHitRegistered && this.punchPhaseTimer <= Math.floor((cfg.punchStrikeFrames || 7) / 2)) {
        this.punchHitRegistered = true;
        this._executePunchHit(opponent, cfg);
      }
      if (this.punchPhaseTimer <= 0) {
        this.punchPhase = 4; // Phase 4: THE IMPACT LOCK (Rule 30)
        this.punchPhaseTimer = cfg.punchImpactLockFrames || 8;
      }
    }
    // Phase 4: Impact Lock (Frozen at collision apex, sustaining force)
    else if (this.punchPhase === 4) {
      if (this.punchPhaseTimer <= 0) {
        this.punchPhase = 5; // Phase 5: Recovery Settle
        this.punchPhaseTimer = cfg.punchRecoveryFrames || 14;
      }
    }
    // Phase 5: Recovery Settle
    else if (this.punchPhase === 5) {
      if (this.punchPhaseTimer <= 0) {
        this.isPunching = false;
        this.punchPhase = 0;
        this.basicAttackCooldownTimer = cfg.basicAttackCooldown || 48;
      }
    }
  }

  _executePunchHit(opponent, cfg) {
    const reach = cfg.basicAttackReach || 80;
    const arcAngle = (100 * Math.PI) / 180;
    const isEnraged = this.isEnraged || this.anger >= 100;
    const dmg = isEnraged ? (cfg.enragedAttackDamage || 62) : (cfg.basicAttackDamage || 42);

    // Frontal arc query (Rule 1.6: checks fighters & illusions)
    const targets = this._getFrontalArcTargets(reach, arcAngle, opponent);
    for (const target of targets) {
      if (!target || target.hp <= 0) continue;
      const isTargetInvincible = Boolean(
        target.isInvulnerable ||
        target.isInvincible ||
        target.invincible ||
        target.isInvincibleUltimate ||
        (target.invincibleTimer && target.invincibleTimer > 0) ||
        (target.invincibilityTimer && target.invincibilityTimer > 0)
      );
      if (isTargetInvincible) continue;

      target.hp = Math.max(0, target.hp - dmg);
      target._lastHitBy = this;

      // Knockback impulse
      const kb = cfg.punchKnockback || 14;
      target.vx += Math.cos(this.gunAngle) * kb;
      target.vy += Math.sin(this.gunAngle) * kb;

      // Hit pause
      if (typeof target.applyHitStun === 'function') {
        target.applyHitStun(8);
      }

      spawnFloatingText(target.x, target.y - target.r, `-${dmg}`, isEnraged ? '#00FFE0' : '#0D9488');
    }

    // Impact Rumble & SFX
    triggerGlobalScreenShake(2.5, 8);
    if (typeof audioSystem !== 'undefined' && audioSystem.playSFX) {
      audioSystem.playSFX('skill_heavy_slam', 0.85);
    }
  }

  _getFrontalArcTargets(reach, arcAngle, primaryOpponent) {
    const list = [];
    const pool = (typeof state !== 'undefined' && state.fighters) ? state.fighters : [primaryOpponent];
    for (const f of pool) {
      if (!f || f === this || f.hp <= 0) continue;
      const dx = f.x - this.x;
      const dy = f.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= reach + (f.r || 25)) {
        const angleToTarget = Math.atan2(dy, dx);
        let diff = Math.abs(angleToTarget - this.gunAngle);
        while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
        if (diff <= arcAngle / 2) {
          list.push(f);
        }
      }
    }
    return list;
  }

  // ── Skill 1: Darkness Pulse ──
  _castDarknessPulse(opponent, cfg) {
    this.darknessCooldownTimer = cfg.darknessCooldown || 480;

    // Spawn expanding darkness wave
    this.activeDarknessWaves.push({
      x: this.x,
      y: this.y,
      maxRadius: this.darknessRadius,
      timer: 0,
      maxTimer: 36
    });

    // Check targets caught in pulse
    const dx = opponent.x - this.x;
    const dy = opponent.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= this.darknessRadius) {
      if (typeof opponent.applySpeedModifier === 'function') {
        opponent.applySpeedModifier(cfg.darknessSlowMultiplier || 0.55, cfg.darknessDuration || 150);
      }
      spawnFloatingText(opponent.x, opponent.y - opponent.r - 12, 'DARKNESS!', '#0D9488');
    }

    if (typeof audioSystem !== 'undefined' && audioSystem.playSFX) {
      audioSystem.playSFX('teleport', 0.7);
    }
  }

  // ── Skill 2: Sculk Tendril Sniff ──
  _castSculkSniff(opponent, cfg) {
    this.sniffCooldownTimer = cfg.sniffCooldown || 380;
    this.isSniffing = true;
    this.sniffTimer = cfg.sniffDuration || 40;

    // Immediately reveals stealth / invisible targets
    if (opponent.isStealthed || opponent.isInvisible) {
      opponent.isStealthed = false;
      opponent.isInvisible = false;
      spawnFloatingText(opponent.x, opponent.y - opponent.r - 16, 'SCENT DETECTED!', '#00F5D4');
    }

    // Root opponent in place with sculk tendril trap
    const isOpponentInvincible = Boolean(
      opponent.isInvulnerable ||
      opponent.isInvincible ||
      opponent.invincible ||
      opponent.isInvincibleUltimate ||
      (opponent.invincibleTimer && opponent.invincibleTimer > 0) ||
      (opponent.invincibilityTimer && opponent.invincibilityTimer > 0)
    );
    if (isOpponentInvincible) return;

    if (typeof opponent.applyHitStun === 'function') {
      opponent.applyHitStun(cfg.trapDuration || 45);
    }
    opponent.hp = Math.max(0, opponent.hp - (cfg.trapDamage || 24));
    spawnFloatingText(opponent.x, opponent.y - opponent.r, `-${cfg.trapDamage || 24} (ROOTED)`, '#00F5D4');

    // Spawn sculk growth particles at target feet
    for (let i = 0; i < 10; i++) {
      this.activeSculkBursts.push({
        x: opponent.x + (Math.random() - 0.5) * 30,
        y: opponent.y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        timer: 36,
        color: '#0D9488'
      });
    }
  }

  // ── Ultimate: SCULK SONIC BOOM (Rule 1.4 & Rule 26) ──
  _startSonicBoom(targetAngle) {
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.warden) ? CONFIG.warden : wardenConfig;
    this.isSonicBoomCharging = true;
    this.sonicBoomChargeTimer = cfg.sonicBoomChargeFrames || 45;
    this.skillCastAngle = targetAngle;
    this.gunAngle = targetAngle;
    this.angle = targetAngle;

    spawnFloatingText(this.x, this.y - this.r - 24, 'CHARGING SONIC BOOM...', '#00F5D4');

    if (typeof audioSystem !== 'undefined' && audioSystem.playSFX) {
      audioSystem.playSFX('skill_zenitsu_electric1', 0.8);
    }
  }

  _updateSonicBoomCharge(opponent, cfg) {
    this.sonicBoomChargeTimer--;

    // Rule 1.4: Strict committed aim lock during charge
    this.gunAngle = this.skillCastAngle;
    this.angle = this.skillCastAngle;

    // Swirling sculk soul particles toward chest cavity
    if (this.sonicBoomChargeTimer % 3 === 0) {
      const a = Math.random() * Math.PI * 2;
      const d = 40 + Math.random() * 30;
      this.activeSculkBursts.push({
        x: this.x + Math.cos(a) * d,
        y: this.y + Math.sin(a) * d,
        vx: -Math.cos(a) * 3.5,
        vy: -Math.sin(a) * 3.5,
        timer: 16,
        color: '#00FFE0'
      });
    }

    if (this.sonicBoomChargeTimer <= 0) {
      this.isSonicBoomCharging = false;
      this.isSonicBoomFiring = true;
      this.sonicBoomFireTimer = cfg.sonicBoomBeamFrames || 24;
      this._fireSonicBoom(opponent, cfg);
    }
  }

  _fireSonicBoom(opponent, cfg) {
    const reach = cfg.sonicBoomReach || 520;
    const beamWidth = cfg.sonicBoomWidth || 36;
    const dmg = cfg.sonicBoomDamage || 95;
    const kb = cfg.sonicBoomKnockback || 22;

    // Spawn authentic 12-frame Sonic Boom animated wave (twelve-frame-animation-generator)
    this.activeSonicWaves.push({
      startX: this.x,
      startY: this.y,
      angle: this.skillCastAngle,
      timer: 0,
      maxTimer: cfg.sonicBoomBeamFrames || 24,
      reach: reach,
      width: beamWidth,
      scale: 0.85
    });

    // Kinetic Recoil (Rule 1.4)
    this.vx -= Math.cos(this.skillCastAngle) * 8.5;
    this.vy -= Math.sin(this.skillCastAngle) * 8.5;

    // Screen Shake & Sonic Blast Audio
    triggerGlobalScreenShake(6.0, 20);
    if (typeof audioSystem !== 'undefined' && audioSystem.playSFX) {
      audioSystem.playSFX('skill_heavy_slam', 1.0);
    }

    // Piercing ray-cast hit evaluation
    const pool = (typeof state !== 'undefined' && state.fighters) ? state.fighters : [opponent];
    for (const f of pool) {
      if (!f || f === this || f.hp <= 0) continue;
      const dx = f.x - this.x;
      const dy = f.y - this.y;
      const proj = dx * Math.cos(this.skillCastAngle) + dy * Math.sin(this.skillCastAngle);
      if (proj > 0 && proj <= reach) {
        const perpDist = Math.abs(-dx * Math.sin(this.skillCastAngle) + dy * Math.cos(this.skillCastAngle));
        if (perpDist <= (beamWidth / 2) + (f.r || 25)) {
          const isTargetInvincible = Boolean(
            f.isInvulnerable ||
            f.isInvincible ||
            f.invincible ||
            f.isInvincibleUltimate ||
            (f.invincibleTimer && f.invincibleTimer > 0) ||
            (f.invincibilityTimer && f.invincibilityTimer > 0)
          );
          if (isTargetInvincible) continue;

          // Unblockable piercing damage
          f.hp = Math.max(0, f.hp - dmg);
          f._lastHitBy = this;
          f.vx += Math.cos(this.skillCastAngle) * kb;
          f.vy += Math.sin(this.skillCastAngle) * kb;

          if (typeof f.applyHitStun === 'function') {
            f.applyHitStun(16);
          }

          spawnFloatingText(f.x, f.y - f.r, `-${dmg} (SONIC BOOM)`, '#00F5D4');
        }
      }
    }
  }

  _updateSonicBoomFire(opponent, cfg) {
    this.sonicBoomFireTimer--;
    // Clamped committed angle
    this.gunAngle = this.skillCastAngle;
    this.angle = this.skillCastAngle;

    if (this.sonicBoomFireTimer <= 0) {
      this.isSonicBoomFiring = false;
      this.sonicBoomCooldownTimer = cfg.sonicBoomCooldown || 720;
    }
  }

  /**
   * Body drawing hook for engine render passes.
   */
  drawBody(ctx) {
    drawWardenSkin(ctx, this);
  }

  /**
   * Full draw pipeline (Rule 21 compliant).
   */
  draw(ctx, opponent) {
    // 1. Draw Visual Effects Beneath / Around Fighter
    this._drawWorldVfx(ctx);

    // 2. Draw Body in World Space (Rule 32 compliant)
    this.drawBody(ctx);

    // 3. Draw Active Beams / Sonic Boom Rings
    this._drawSonicBoomEffects(ctx);

    // 4. Mandatory In-Game Overlay HP & Status Drawing (Rule 21)
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }

  _drawWorldVfx(ctx) {
    ctx.save();

    // 1. Darkness Pulse Expanding Disk
    for (const dw of this.activeDarknessWaves) {
      const p = dw.timer / dw.maxTimer;
      const curR = dw.maxRadius * Math.sin(p * Math.PI / 2);
      const alpha = (1 - p) * 0.35;
      ctx.beginPath();
      ctx.arc(dw.x, dw.y, curR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(13, 148, 136, ${alpha})`;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = `rgba(0, 245, 212, ${alpha * 1.5})`;
      ctx.stroke();
    }

    // 2. Vibration Echolocation Arcs flying to horns
    for (const arc of this.activeVibrationArcs) {
      const curX = arc.sx + (arc.tx - arc.sx) * arc.t;
      const curY = arc.sy + (arc.ty - arc.sy) * arc.t;
      const a = (1 - arc.t) * 0.85;

      ctx.save();
      ctx.beginPath();
      ctx.arc(curX, curY, arc.radius * (1 - arc.t * 0.4), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 245, 212, ${a})`;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Sculk Embers & Particles
    for (const b of this.activeSculkBursts) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = b.color || '#00F5D4';
      ctx.fill();
    }

    ctx.restore();
  }

  _drawSonicBoomEffects(ctx) {
    // 1. Sonic Boom Charging Aura
    if (this.isSonicBoomCharging) {
      ctx.save();
      const p = 1 - (this.sonicBoomChargeTimer / 45);
      ctx.beginPath();
      ctx.arc(this.x, this.y, (this.r + 15) * p, 0, Math.PI * 2);
      ctx.strokeStyle = '#00F5D4';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Active 12-Frame Sonic Boom Waves & Supersonic Plasma Core
    for (const wave of this.activeSonicWaves) {
      drawWardenSonicBoomWave(ctx, wave);
    }
  }
}
