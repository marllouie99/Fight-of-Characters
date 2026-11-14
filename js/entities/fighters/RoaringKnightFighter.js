// ═══════════════════════════════════════════════════════════════════════════
// THE ROARING KNIGHT (Deltarune Chapter 3) — Combat Entity Class
// Adheres strictly to:
// - Rule 1.1: Freeze & TimeStop Early Exits
// - Rule 1.4: Continuous 360° Skill Aiming & Committed Aim Lock
// - Rule 20: Canonical Weapon Grip (Single-Source Hand)
// - Rule 21: In-Game Overlay HP & Status Drawing (drawHealth + drawFreezeTimer)
// - Rule 23: Basic Projectile Suppression (shoot override)
// - Rule 24: Universal Character Body Model Scale (preserve super(def) scaled r)
// - Rule 25: Non-Freezing Active Visual Effects Standard (top-of-update decay)
// - Rule 30: 5-Phase Melee Kinematics & Impact Lock Physics
// ═══════════════════════════════════════════════════════════════════════════

import { Fighter, applyDamageToTarget, isSkillEnabled } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { roaringKnightConfig } from '../../configs/characters/roaringKnightConfig.js';
import { state, spawnFloatingText, triggerGlobalScreenShake } from '../../core/state.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { drawRoaringKnightSkin, drawRoaringKnightGhostSkin } from '../../graphics/fighters/roaringKnightSkin.js';
import {
  drawRoaringKnightBlackKnife,
  drawFallingSwordEntity,
  drawStarBurstProjectile,
  drawStarChildFragment,
  drawRoaringSwoonVFX,
} from '../../graphics/weapons/roaringKnightWeaponGraphics.js';

export class RoaringKnightFighter extends Fighter {
  constructor(def = {}) {
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.roaring_knight)
      ? CONFIG.roaring_knight
      : roaringKnightConfig;

    // Rule 24: Pass base r=25 to super(def) and NEVER overwrite this.r afterwards
    super({
      ...def,
      r: def.r ?? cfg.r ?? 25,
      radius: def.radius ?? cfg.radius ?? 25,
      hp: def.hp ?? cfg.hp ?? 460,
      maxHp: def.maxHp ?? cfg.maxHp ?? 460,
      speed: def.speed ?? cfg.speed ?? 4.9,
      color: def.color || cfg.color || '#18181B',
    });

    this.characterId = 'roaring_knight';
    this.type = 'roaring_knight';
    this.name = def?.name || cfg.name || 'Roaring Knight';
    this.displayName = def?.displayName || cfg.displayName || 'Roaring Knight';
    this.grade = cfg.grade || 'S';
    this.title = cfg.title || 'Herald of the Roaring';

    this.speed = def.speed ?? cfg.speed ?? 4.9;
    this.moveSpeed = cfg.moveSpeed ?? this.speed;
    this.color = cfg.color || '#18181B';
    this.themeColor = cfg.themeColor || '#18181B';
    this.secondaryColor = cfg.secondaryColor || '#FFFFFF';
    this.damageNumberColor = cfg.damageNumberColor || '#FFFFFF';
    this._vfxTick = 0;

    // ── Basic Attack: 5-Phase Black Knife Cleave ──
    this.basicAttackCooldownTimer = 20;
    this.isMeleeSwinging = false;
    this.meleePhase = 0; // 1: Windup, 2: Hold, 3: Strike, 4: ImpactLock, 5: Recovery
    this.meleePhaseTimer = 0;
    this.meleePhaseMaxTimer = 1;
    this.meleePhaseProgress = 0;
    this.meleeComboFlip = false;
    this.meleeHitRegistered = false;
    this.meleeCastAngle = 0;

    // ── Skill 1: Falling Swords ──
    this.fallingSwordsCooldownTimer = cfg.fallingSwordsInitialCooldown ?? 90;
    this.isFallingSwordsCasting = false;
    this.fallingSwordsCastTimer = 0;
    this.activeFallingSwords = [];

    // ── Skill 2: Star Burst ──
    this.starBurstCooldownTimer = cfg.starBurstInitialCooldown ?? 160;
    this.isStarBurstCasting = false;
    this.starBurstCastTimer = 0;
    this.activeStarBursts = [];
    this.activeStarChildren = [];

    // ── Ultimate: Roaring Swoon ──
    this.swoonCooldownTimer = cfg.swoonInitialCooldown ?? 420;
    this.isSwoonChanneling = false;
    this.swoonChannelTimer = 0;
    this.swoonActiveTimer = 0;
    this.skillCastAngle = 0;

    // ── Transient Visual Effects & Afterimages (Rule 25 Non-Freezing) ──
    this.activeVisualEffects = [];
    this.afterImages = [];
    this._afterImageTick = 0;
  }

  _cfg() {
    return (typeof CONFIG !== 'undefined' && CONFIG.roaring_knight)
      ? CONFIG.roaring_knight
      : roaringKnightConfig;
  }

  _playAudio(key, fallbackPath, defaultVol = 0.85) {
    if (typeof audioSystem === 'undefined' || !audioSystem.playSFX) return;
    const cfg = this._cfg();
    const sfxPath = cfg.sounds?.[key] || fallbackPath;
    const vol = cfg.soundVolumes?.[key] ?? defaultVol;
    audioSystem.playSFX(sfxPath, vol);
  }

  /**
   * Rule 23: Suppresses base generic bullet projectiles.
   */
  shoot() {
    // Intentionally empty: The Roaring Knight fights via Black Knife & Deltarune skills.
  }

  /**
   * Rule 1.4: Lock facing orientation while swinging Black Knife or channeling Roaring Swoon.
   */
  canAim() {
    if (this.isSwoonChanneling || this.swoonActiveTimer > 0) return false;
    if (this.isMeleeSwinging && this.meleePhase >= 2 && this.meleePhase <= 4) return false;
    return super.canAim();
  }

  /**
   * Plays authentic Deltarune Knight hurt SFX on incoming hits.
   */
  takeDamage(amount, ...args) {
    const dealt = super.takeDamage(amount, ...args);
    if (dealt && this.hp > 0 && Math.random() < 0.45) {
      const idx = Math.random() < 0.5 ? 1 : 2;
      this._playAudio(`hurt${idx}`, `Assets/Sound Effects/RoaringKnightSFX/snd_knight_hurt${idx === 2 ? 'b' : ''}.wav`, 0.75);
    }
    return dealt;
  }

  /**
   * Rule 25: Interruption resets cast channels safely and clears body-bound telegraph lines.
   */
  interruptAttacks(forceCancelAll = false) {
    if (this.isMeleeSwinging && (this.meleePhase <= 2 || forceCancelAll)) {
      this.isMeleeSwinging = false;
      this.meleePhase = 0;
      this.meleePhaseTimer = 0;
      this.meleePhaseProgress = 0;
    }
    if (this.isFallingSwordsCasting || forceCancelAll) {
      this.isFallingSwordsCasting = false;
      this.fallingSwordsCastTimer = 0;
    }
    if (this.isStarBurstCasting || forceCancelAll) {
      this.isStarBurstCasting = false;
      this.starBurstCastTimer = 0;
    }
    if (this.isSwoonChanneling || forceCancelAll) {
      this.isSwoonChanneling = false;
      this.swoonChannelTimer = 0;
      this.activeVisualEffects = this.activeVisualEffects.filter(fx => fx.kind !== 'swoon_telegraph');
    }
    if (forceCancelAll) {
      this.swoonActiveTimer = 0;
    }
  }

  /**
   * Rule 25: Advances all non-interactive world VFX, projectiles, and afterimages even when frozen.
   */
  _updateAllTransientEffects(opponent, arena) {
    this._vfxTick++;

    // 1. Decay visual effect rings/cuts & remove expired telegraphs
    for (let i = this.activeVisualEffects.length - 1; i >= 0; i--) {
      const fx = this.activeVisualEffects[i];
      fx.timer--;
      if (fx.timer <= 0) {
        this.activeVisualEffects.splice(i, 1);
      }
    }

    // 2. Decay Shadow Mantle afterimages
    for (let i = this.afterImages.length - 1; i >= 0; i--) {
      this.afterImages[i].life--;
      if (this.afterImages[i].life <= 0) {
        this.afterImages.splice(i, 1);
      }
    }

    // 3. Advance active Skill projectiles cleanly
    this._updateFallingSwords(opponent, arena);
    this._updateStarBursts(opponent, arena);
    this._updateStarChildren(opponent, arena);
  }

  /**
   * Main 60 FPS update tick.
   */
  update(opponent, ownerIndex, arena) {
    // 0. Mandatory Rule 25 top-of-update decay BEFORE freeze guard
    this._updateAllTransientEffects(opponent, arena);

    // 1. Mandatory Rule 1 Freeze & TimeStop Early Exit
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks(false);
      return;
    }

    // 2. Tick Cooldowns
    if (this.basicAttackCooldownTimer > 0) this.basicAttackCooldownTimer--;
    if (this.fallingSwordsCooldownTimer > 0) this.fallingSwordsCooldownTimer--;
    if (this.starBurstCooldownTimer > 0) this.starBurstCooldownTimer--;
    if (this.swoonCooldownTimer > 0) this.swoonCooldownTimer--;

    // 3. Active Skill Pipelines
    this._updateSwoonChannel(opponent);
    this._updateFallingSwordsChannel(opponent, arena);
    this._updateStarBurstChannel(opponent);
    this._updateBlackKnifeMelee(opponent);

    // 4. Shadow Mantle Dash Afterimages (Rule 35 velocity gated)
    this._recordShadowMantleAfterimage();

    // 5. AI Combat Decision & Aggressive Steering
    this._decideAndMove(opponent);

    // 6. Centralized Physics & Wall Bounce via Fighter base class
    super.update(opponent, ownerIndex, arena);
  }

  _recordShadowMantleAfterimage() {
    const cfg = this._cfg();
    if (!isSkillEnabled(cfg.enableShadowMantle, true)) return;
    const speedMag = Math.hypot(this.vx || 0, this.vy || 0);
    if (speedMag < (cfg.afterImageMinSpeed ?? 4.4)) return;

    this._afterImageTick++;
    const interval = cfg.afterImageInterval ?? 5;
    if (this._afterImageTick % interval !== 0) return;

    const life = cfg.afterImageLife ?? 16;
    this.afterImages.push({
      x: this.x,
      y: this.y - (this.z || 0),
      angle: this.gunAngle || this.angle || 0,
      r: this.r || 25,
      life,
      maxLife: life,
    });
    if (this.afterImages.length > 8) {
      this.afterImages.shift();
    }
  }

  /**
   * Keeps base Fighter physics & stall watchdog locked during Roaring Swoon cast.
   */
  isStationarySkillActive() {
    return Boolean(this.isSwoonChanneling || this.swoonActiveTimer > 0);
  }

  /**
   * Exposes channeling state so Fighter.applyMovementPhysics() treats Swoon as stationary.
   */
  isChannelingSkill() {
    return Boolean(this.isSwoonChanneling || this.swoonActiveTimer > 0);
  }

  /**
   * Halts movement completely while casting Roaring Swoon and resumes normal physics afterward.
   */
  applyMovementPhysics(extraMultiplier = 1) {
    if (this.isSwoonChanneling || this.swoonActiveTimer > 0) {
      this.vx = 0;
      this.vy = 0;
      this._stationaryStallFrames = 0;
      return;
    }
    return super.applyMovementPhysics(extraMultiplier);
  }

  _decideAndMove(opponent) {
    if (!opponent || opponent.hp <= 0) return;

    // Casting Roaring Swoon completely halts movement until the slash finishes
    if (this.isSwoonChanneling || this.swoonActiveTimer > 0) {
      this.vx = 0;
      this.vy = 0;
      this.gunAngle = this.skillCastAngle;
      return;
    }

    const dx = opponent.x - this.x;
    const dy = opponent.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const targetAngle = Math.atan2(dy, dx);
    const cfg = this._cfg();

    // Priority 1: Ultimate — Roaring Swoon
    if (
      isSkillEnabled(cfg.enableRoaringSwoon, true) &&
      this.swoonCooldownTimer <= 0 &&
      !this.isMeleeSwinging &&
      !this.isFallingSwordsCasting &&
      !this.isStarBurstCasting &&
      dist <= (cfg.swoonReach ?? 560) * 0.85
    ) {
      this._startRoaringSwoon(targetAngle);
      return;
    }

    // Priority 2: Skill 1 — Falling Swords
    if (
      isSkillEnabled(cfg.enableFallingSwords, true) &&
      this.fallingSwordsCooldownTimer <= 0 &&
      !this.isMeleeSwinging &&
      !this.isStarBurstCasting &&
      dist > 95
    ) {
      this._startFallingSwordsCast();
      return;
    }

    // Priority 3: Skill 2 — Star Burst
    if (
      isSkillEnabled(cfg.enableStarBurst, true) &&
      this.starBurstCooldownTimer <= 0 &&
      !this.isMeleeSwinging &&
      !this.isFallingSwordsCasting &&
      dist > 110
    ) {
      this._startStarBurstCast(targetAngle);
      return;
    }

    // Priority 4: Basic Attack — 5-Phase Black Knife Cleave
    if (
      isSkillEnabled(cfg.enableBlackKnife, true) &&
      this.basicAttackCooldownTimer <= 0 &&
      !this.isMeleeSwinging &&
      dist <= (cfg.basicAttackReach ?? 88)
    ) {
      this._startBlackKnifeSwing(targetAngle);
    }

    // Relentless Knight Steering
    if (this.isMeleeSwinging) {
      this.vx *= 0.88;
      this.vy *= 0.88;
      return;
    }

    const desiredDist = 58;
    const nx = dx / dist;
    const ny = dy / dist;
    const moveSpd = this.speed || cfg.speed || 4.9;

    if (dist > desiredDist) {
      this.vx = this.vx * 0.82 + nx * moveSpd * 0.18;
      this.vy = this.vy * 0.82 + ny * moveSpd * 0.18;
    } else {
      // Strafe slightly around opponent to keep blades sweeping cleanly
      this.vx = this.vx * 0.86 + (-ny) * moveSpd * 0.16;
      this.vy = this.vy * 0.86 + nx * moveSpd * 0.16;
    }
  }

  // ── Basic Attack: 5-Phase Black Knife Cleave (Rule 30) ──
  _startBlackKnifeSwing(angle) {
    const cfg = this._cfg();
    this.isMeleeSwinging = true;
    this.meleePhase = 1;
    this.meleePhaseTimer = cfg.knifeWindupFrames ?? 9;
    this.meleePhaseMaxTimer = this.meleePhaseTimer;
    this.meleePhaseProgress = 0;
    this.meleeHitRegistered = false;
    this.meleeCastAngle = angle;
    this.gunAngle = angle;
    this.basicAttackCooldownTimer = cfg.basicAttackCooldown ?? 42;
  }

  _updateBlackKnifeMelee(opponent) {
    if (!this.isMeleeSwinging) return;

    const cfg = this._cfg();
    this.meleePhaseTimer--;
    this.meleePhaseProgress = 1 - Math.max(0, this.meleePhaseTimer) / Math.max(1, this.meleePhaseMaxTimer);

    // Hit Check inside active Strike phase (Phase 3)
    if (this.meleePhase === 3 && !this.meleeHitRegistered && this.meleePhaseProgress >= 0.35) {
      this._executeBlackKnifeHitCheck(opponent);
      this.meleeHitRegistered = true;
    }

    if (this.meleePhaseTimer > 0) return;

    if (this.meleePhase === 1) {
      this.meleePhase = 2;
      this.meleePhaseTimer = cfg.knifeHoldFrames ?? 3;
      this.meleePhaseMaxTimer = this.meleePhaseTimer;
    } else if (this.meleePhase === 2) {
      this.meleePhase = 3;
      this.meleePhaseTimer = cfg.knifeStrikeFrames ?? 7;
      this.meleePhaseMaxTimer = this.meleePhaseTimer;
      const cutKey = this.meleeComboFlip ? 'cut2' : 'cut1';
      this._playAudio(cutKey, `Assets/Sound Effects/RoaringKnightSFX/snd_knight_${cutKey}.wav`, 0.90);
      // Controlled forward step impulse cleanly along cast angle without overshooting target
      this.vx += Math.cos(this.meleeCastAngle) * 2.0;
      this.vy += Math.sin(this.meleeCastAngle) * 2.0;
    } else if (this.meleePhase === 3) {
      this.meleePhase = 4;
      this.meleePhaseTimer = cfg.knifeImpactLockFrames ?? 6;
      this.meleePhaseMaxTimer = this.meleePhaseTimer;
    } else if (this.meleePhase === 4) {
      this.meleePhase = 5;
      this.meleePhaseTimer = cfg.knifeRecoveryFrames ?? 13;
      this.meleePhaseMaxTimer = this.meleePhaseTimer;
    } else {
      this.isMeleeSwinging = false;
      this.meleePhase = 0;
      this.meleePhaseTimer = 0;
      this.meleePhaseProgress = 0;
      this.meleeComboFlip = !this.meleeComboFlip;
    }
  }

  _executeBlackKnifeHitCheck(opponent) {
    const cfg = this._cfg();
    const reach = (cfg.basicAttackReach ?? 88) + (this.r || 25) * 0.4;
    const halfArc = (cfg.basicAttackArc ?? Math.PI * 0.78) * 0.5;
    const dmg = cfg.basicAttackDamage ?? 26;
    const kb = cfg.basicAttackKnockback ?? 11;
    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);

    let hitAny = false;
    for (const target of targets) {
      if (!target || target.hp <= 0) continue;
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const centerDist = Math.hypot(dx, dy);
      const tRad = target.r || target.radius || 25;
      const edgeDist = centerDist - tRad;
      if (edgeDist > reach) continue;

      const angleToTarget = Math.atan2(dy, dx);
      const isPointBlank = centerDist <= (this.r || 25) + tRad + 16;
      const diff = Math.abs(Math.atan2(Math.sin(angleToTarget - this.meleeCastAngle), Math.cos(angleToTarget - this.meleeCastAngle)));
      if (!isPointBlank && diff > halfArc) continue;

      const dealt = applyDamageToTarget(target, dmg, this, {
        source: 'roaring_knight_black_knife',
        isMelee: true,
        hitAngle: angleToTarget,
      });
      if (dealt) {
        hitAny = true;
        target.vx = (target.vx || 0) + Math.cos(angleToTarget) * kb;
        target.vy = (target.vy || 0) + Math.sin(angleToTarget) * kb;
        if (typeof target.applyHitStun === 'function') {
          target.applyHitStun(10);
        }
      }
    }

    if (hitAny) {
      this._playAudio('hitStrong', 'Assets/Sound Effects/RoaringKnightSFX/snd_metal_hit_strong.wav', 0.85);
      triggerGlobalScreenShake?.(3.5, 6);
    }
  }

  // ── Skill 1: Falling Swords ──
  _startFallingSwordsCast() {
    const cfg = this._cfg();
    this.isFallingSwordsCasting = true;
    this.fallingSwordsCastTimer = cfg.fallingSwordsChargeFrames ?? 26;
    this.fallingSwordsCooldownTimer = cfg.fallingSwordsCooldown ?? 340;
    this._playAudio('drawPower', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_drawpower.wav', 0.80);
  }

  _updateFallingSwordsChannel(opponent, arena) {
    if (!this.isFallingSwordsCasting) return;
    this.fallingSwordsCastTimer--;
    if (this.fallingSwordsCastTimer > 0) return;

    this.isFallingSwordsCasting = false;
    if (!opponent || opponent.hp <= 0) return;

    const cfg = this._cfg();
    const count = cfg.fallingSwordCount ?? 6;
    const telegraph = cfg.fallingSwordsTelegraphFrames ?? 18;
    const spawnRadius = 118;
    const minX = (arena?.x ?? 45) + 18;
    const maxX = (arena?.x ?? 45) + (arena?.width ?? 450) - 18;
    const minY = (arena?.y ?? 240) + 18;
    const maxY = (arena?.y ?? 240) + (arena?.height ?? 450) - 18;

    this._playAudio('fallingSword', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_fallingsword.ogg', 0.78);
    this._playAudio('fallingSwordBig', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_fallingsword_big.wav', 0.82);

    const baseRot = Math.random() * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const theta = baseRot + (i / count) * Math.PI * 2;
      const sx = Math.max(minX, Math.min(maxX, opponent.x + Math.cos(theta) * spawnRadius));
      const sy = Math.max(minY, Math.min(maxY, opponent.y + Math.sin(theta) * spawnRadius));
      const aimAngle = Math.atan2(opponent.y - sy, opponent.x - sx);

      this.activeFallingSwords.push({
        x: sx,
        y: sy,
        angle: aimAngle,
        telegraphTimer: telegraph + i * 2,
        life: 62,
        speed: cfg.fallingSwordSpeed ?? 14.5,
        damage: cfg.fallingSwordDamage ?? 16,
        knockback: cfg.fallingSwordKnockback ?? 7,
        hasHit: false,
      });
    }
  }

  _updateFallingSwords(opponent, arena) {
    const minX = (arena?.x ?? 45) - 60;
    const maxX = (arena?.x ?? 45) + (arena?.width ?? 450) + 60;
    const minY = (arena?.y ?? 240) - 60;
    const maxY = (arena?.y ?? 240) + (arena?.height ?? 450) + 60;
    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);

    for (let i = this.activeFallingSwords.length - 1; i >= 0; i--) {
      const sword = this.activeFallingSwords[i];
      if (sword.telegraphTimer > 0) {
        sword.telegraphTimer--;
        continue;
      }

      sword.x += Math.cos(sword.angle) * sword.speed;
      sword.y += Math.sin(sword.angle) * sword.speed;
      sword.life--;

      if (!sword.hasHit) {
        for (const t of targets) {
          if (!t || t.hp <= 0) continue;
          const hitDist = Math.hypot(t.x - sword.x, t.y - sword.y);
          if (hitDist <= (t.r || t.radius || 25) + 18) {
            const dealt = applyDamageToTarget(t, sword.damage, this, {
              source: 'roaring_knight_falling_sword',
              isProjectile: true,
              hitAngle: sword.angle,
            });
            if (dealt) {
              sword.hasHit = true;
              t.vx = (t.vx || 0) + Math.cos(sword.angle) * sword.knockback;
              t.vy = (t.vy || 0) + Math.sin(sword.angle) * sword.knockback;
              this._playAudio('hitStrong', 'Assets/Sound Effects/RoaringKnightSFX/snd_metal_hit_strong.wav', 0.70);
              break;
            }
          }
        }
      }

      if (sword.hasHit || sword.life <= 0 || sword.x < minX || sword.x > maxX || sword.y < minY || sword.y > maxY) {
        this.activeFallingSwords.splice(i, 1);
      }
    }
  }

  // ── Skill 2: Star Burst ──
  _startStarBurstCast(angle) {
    const cfg = this._cfg();
    this.isStarBurstCasting = true;
    this.starBurstCastTimer = cfg.starBurstCastFrames ?? 18;
    this.starBurstCooldownTimer = cfg.starBurstCooldown ?? 420;
    this.gunAngle = angle;
    this._playAudio('pulse', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_pulse.wav', 0.80);
  }

  _updateStarBurstChannel(opponent) {
    if (!this.isStarBurstCasting) return;
    this.starBurstCastTimer--;
    if (this.starBurstCastTimer > 0) return;

    this.isStarBurstCasting = false;
    const cfg = this._cfg();
    const angle = opponent
      ? Math.atan2(opponent.y - this.y, opponent.x - this.x)
      : (this.gunAngle || 0);
    const spd = cfg.starBurstSpeed ?? 5.4;

    this.activeStarBursts.push({
      x: this.x + Math.cos(angle) * ((this.r || 25) + 12),
      y: this.y + Math.sin(angle) * ((this.r || 25) + 12),
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      rot: 0,
      radius: 17,
      fuseTimer: cfg.starBurstFuseFrames ?? 42,
      damage: cfg.starBurstDamage ?? 24,
      childCount: cfg.starChildCount ?? 8,
      childDamage: cfg.starChildDamage ?? 12,
      childSpeed: cfg.starChildSpeed ?? 8.5,
    });
  }

  _updateStarBursts(opponent, arena) {
    const minX = (arena?.x ?? 45) + 16;
    const maxX = (arena?.x ?? 45) + (arena?.width ?? 450) - 16;
    const minY = (arena?.y ?? 240) + 16;
    const maxY = (arena?.y ?? 240) + (arena?.height ?? 450) - 16;
    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);

    for (let i = this.activeStarBursts.length - 1; i >= 0; i--) {
      const star = this.activeStarBursts[i];
      star.x += star.vx;
      star.y += star.vy;
      star.rot += 0.14;
      star.fuseTimer--;

      if (star.x < minX || star.x > maxX) star.vx *= -1;
      if (star.y < minY || star.y > maxY) star.vy *= -1;

      let touchedEnemy = false;
      for (const t of targets) {
        if (!t || t.hp <= 0) continue;
        if (Math.hypot(t.x - star.x, t.y - star.y) <= (t.r || t.radius || 25) + star.radius) {
          touchedEnemy = true;
          break;
        }
      }

      if (touchedEnemy || star.fuseTimer <= 0) {
        this._detonateStarBurst(star, targets);
        this.activeStarBursts.splice(i, 1);
      }
    }
  }

  _detonateStarBurst(star, targets) {
    this._playAudio('starExplosion', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_star_explosion_close.wav', 0.92);
    triggerGlobalScreenShake?.(4.5, 8);

    this.activeVisualEffects.push({
      kind: 'star_shockwave',
      x: star.x,
      y: star.y,
      maxRadius: 92,
      timer: 22,
      maxTimer: 22,
    });

    for (const t of targets) {
      if (!t || t.hp <= 0) continue;
      if (Math.hypot(t.x - star.x, t.y - star.y) <= 88 + (t.r || t.radius || 25)) {
        applyDamageToTarget(t, star.damage, this, {
          source: 'roaring_knight_star_burst',
          isExplosive: true,
        });
      }
    }

    // Emit StarChild diamond shards radially
    const count = star.childCount || 8;
    const baseAngle = star.rot || 0;
    for (let k = 0; k < count; k++) {
      const a = baseAngle + (k / count) * Math.PI * 2;
      this.activeStarChildren.push({
        x: star.x,
        y: star.y,
        angle: a,
        vx: Math.cos(a) * star.childSpeed,
        vy: Math.sin(a) * star.childSpeed,
        damage: star.childDamage,
        life: 44,
        hasHit: false,
      });
    }
  }

  _updateStarChildren(opponent, arena) {
    const minX = (arena?.x ?? 45) - 20;
    const maxX = (arena?.x ?? 45) + (arena?.width ?? 450) + 20;
    const minY = (arena?.y ?? 240) - 20;
    const maxY = (arena?.y ?? 240) + (arena?.height ?? 450) + 20;
    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);

    for (let i = this.activeStarChildren.length - 1; i >= 0; i--) {
      const shard = this.activeStarChildren[i];
      shard.x += shard.vx;
      shard.y += shard.vy;
      shard.life--;

      if (!shard.hasHit) {
        for (const t of targets) {
          if (!t || t.hp <= 0) continue;
          if (Math.hypot(t.x - shard.x, t.y - shard.y) <= (t.r || t.radius || 25) + 10) {
            const dealt = applyDamageToTarget(t, shard.damage, this, {
              source: 'roaring_knight_star_child',
              isProjectile: true,
              hitAngle: shard.angle,
            });
            if (dealt) {
              shard.hasHit = true;
              break;
            }
          }
        }
      }

      if (shard.hasHit || shard.life <= 0 || shard.x < minX || shard.x > maxX || shard.y < minY || shard.y > maxY) {
        this.activeStarChildren.splice(i, 1);
      }
    }
  }

  // ── Ultimate: Roaring Swoon (Rule 1.4 Continuous 360° Aim Lock) ──
  _startRoaringSwoon(angle) {
    const cfg = this._cfg();
    this.isSwoonChanneling = true;
    this.swoonChannelTimer = cfg.swoonChargeFrames ?? 38;
    this.swoonCooldownTimer = cfg.swoonCooldown ?? 780;
    this.skillCastAngle = angle;
    this.gunAngle = angle;
    this.vx = 0;
    this.vy = 0;

    this._playAudio('roar', 'Assets/Sound Effects/RoaringKnightSFX/snd_knightroar.wav', 1.0);
    this._playAudio('powerupWhite', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_powerup_white.wav', 0.85);
    spawnFloatingText?.(this.x, this.y - (this.r || 25) - 18, 'ROARING SWOON!', '#FFFFFF');

    this.activeVisualEffects.push({
      kind: 'swoon_telegraph',
      x: this.x,
      y: this.y,
      angle: this.skillCastAngle,
      reach: cfg.swoonReach ?? 560,
      timer: this.swoonChannelTimer,
      maxTimer: this.swoonChannelTimer,
    });
  }

  _updateSwoonChannel(opponent) {
    if (this.swoonActiveTimer > 0) this.swoonActiveTimer--;
    if (!this.isSwoonChanneling) return;

    this.swoonChannelTimer--;
    this.gunAngle = this.skillCastAngle;
    if (this.swoonChannelTimer > 0) return;

    this.isSwoonChanneling = false;
    this.swoonActiveTimer = (this._cfg().swoonSlashFrames ?? 14) + 10;
    this._executeRoaringSwoonSlash(opponent);
  }

  _executeRoaringSwoonSlash(opponent) {
    const cfg = this._cfg();
    const reach = cfg.swoonReach ?? 560;
    const halfWidth = cfg.swoonHalfWidth ?? 42;
    const dmg = cfg.swoonDamage ?? 78;
    const kb = cfg.swoonKnockback ?? 20;
    const stun = cfg.swoonStunFrames ?? 22;
    const angle = this.skillCastAngle;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    this._playAudio('boxBreak', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_boxbreak.wav', 0.95);
    this._playAudio('wideSlash', 'Assets/Sound Effects/RoaringKnightSFX/snd_wideslash_low.wav', 0.95);
    this._playAudio('darkFountain', 'Assets/Sound Effects/RoaringKnightSFX/snd_ftext_dark_fountain.wav', 0.85);
    triggerGlobalScreenShake?.(8.5, 14);

    let bestHitDist = 140;
    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);
    for (const t of targets) {
      if (!t || t.hp <= 0) continue;
      const rx = t.x - this.x;
      const ry = t.y - this.y;
      const along = rx * cosA + ry * sinA;
      const perp = Math.abs(-rx * sinA + ry * cosA);
      const tRad = t.r || t.radius || 25;

      if (along >= -tRad && along <= reach + tRad && perp <= halfWidth + tRad) {
        bestHitDist = Math.max(60, along);
        const dealt = applyDamageToTarget(t, dmg, this, {
          source: 'roaring_knight_swoon',
          isUltimate: true,
          hitAngle: angle,
        });
        if (dealt) {
          t.vx = (t.vx || 0) + cosA * kb;
          t.vy = (t.vy || 0) + sinA * kb;
          if (typeof t.applyHitStun === 'function') {
            t.applyHitStun(stun);
          }
        }
      }
    }

    // Keep caster stationary during Roaring Swoon execution; normal movement resumes once swoonActiveTimer expires
    this.vx = 0;
    this.vy = 0;

    this.activeVisualEffects.push({
      kind: 'swoon_cut',
      x: this.x,
      y: this.y,
      angle,
      reach,
      hitDist: bestHitDist,
      timer: 26,
      maxTimer: 26,
    });
  }

  /**
   * Rule 21: Dedicated body draw hook for HUD/Studio preview compatibility.
   */
  drawBody(ctx) {
    drawRoaringKnightSkin(ctx, this);
  }

  /**
   * Master combat renderer (Rule 21: drawHealth + drawFreezeTimer called last).
   */
  draw(ctx, opponent) {
    // 1. Afterimage Trail Echoes
    for (const ghost of this.afterImages) {
      const alpha = Math.max(0, (ghost.life / ghost.maxLife) * 0.42);
      drawRoaringKnightGhostSkin(ctx, ghost.x, ghost.y, ghost.angle, ghost.r, alpha);
    }

    // 2. Circle Body + Layer 2 Horned Crown (Rule 24 & Rule 22)
    drawRoaringKnightSkin(ctx, this);

    // 3. Held Black Knife + Single-Source Gauntlet Hand + Arm Linkage (Rule 20 & Rule 30)
    drawRoaringKnightBlackKnife(ctx, this);

    // 4. Active Projectiles & Skill VFX
    for (const sword of this.activeFallingSwords) {
      drawFallingSwordEntity(ctx, sword);
    }
    for (const star of this.activeStarBursts) {
      drawStarBurstProjectile(ctx, star);
    }
    for (const shard of this.activeStarChildren) {
      drawStarChildFragment(ctx, shard);
    }
    for (const fx of this.activeVisualEffects) {
      drawRoaringSwoonVFX(ctx, fx);
    }

    // 5. Mandatory Rule 21 Overhead HP & Status Indicators
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }
}
