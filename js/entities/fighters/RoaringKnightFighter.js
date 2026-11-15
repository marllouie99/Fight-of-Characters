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
import { spawnSparks, spawnParrySparksEffect } from '../../graphics/particles/sparkEffect.js';
import { drawRoaringKnightSkin, drawRoaringKnightGhostSkin } from '../../graphics/fighters/roaringKnightSkin.js';
import {
  drawRoaringKnightBlackKnife,
  drawFallingSwordEntity,
  drawTrackingSwordSlashVFX,
  drawStarBurstProjectile,
  drawStarConeVFX,
  drawStarChildFragment,
  drawRoaringSwoonVFX,
  drawRotatingSlashTelegraph,
  drawRotatingSlashVFX,
  drawRotatingSlashShard,
  drawRoaringKnightFrontSlashTrail,
  drawOrbitingStarEntity,
  drawSnowflakeMatrixVFX,
  drawGapingMawVoidRift,
  drawRiftSlashTelegraph,
  drawSwordTunnelVisuals,
  drawRoaringKnightParryVFX,
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

    // Ensure custom cooldowns and combat state match constructor overrides after super(def)
    this._initKnightCombatState(cfg);
  }

  _registerCooldownExclusions() {
    if (!this.skillManager || !this.skillManager.cooldownKeyMap) return;
    // Prevent SkillManager dynamic discovery from double-decrementing RoaringKnight's own *CooldownTimer fields
    const managedKeys = [
      'shadowStepCooldownTimer',
      'basicAttackCooldownTimer',
      'skill1CooldownTimer',
      'fallingSwordsCooldownTimer',
      'starBurstCooldownTimer',
      'bladeCorridorCooldownTimer',
      'snowflakeMatrixCooldownTimer',
      'swoonCooldownTimer',
    ];
    for (const key of managedKeys) {
      this.skillManager.cooldownKeyMap.set(key, true);
    }
  }

  _initKnightCombatState(cfg = this._cfg()) {
    // ── Basic Attack: 5-Phase Black Knife Cleave ──
    this.basicAttackCooldownTimer = cfg.basicAttackInitialCooldown ?? 30;
    this.isMeleeSwinging = false;
    this.meleePhase = 0; // 1: Windup, 2: Hold, 3: Strike, 4: ImpactLock, 5: Recovery
    this.meleePhaseTimer = 0;
    this.meleePhaseMaxTimer = 1;
    this.meleePhaseProgress = 0;
    this.meleeComboFlip = false;
    this.meleeHitRegistered = false;
    this.meleeCastAngle = 0;
    this._basicSlashStep = 0;
    this._basicRotatingSlash = null;

    // ── Unified Skill 1 Slot (Randomly chooses an enabled active skill when CD is up) ──
    this.skill1CooldownTimer = cfg.skill1InitialCooldown ?? cfg.fallingSwordsInitialCooldown ?? 180;
    this.skill1CooldownMax = cfg.skill1Cooldown ?? cfg.fallingSwordsCooldown ?? 420;
    this._activeSkill1Id = null;
    this._activeSkill1Label = null;

    // ── Skill 1: Tracking Sword (Phase 1) ──
    this.fallingSwordsCooldownTimer = cfg.fallingSwordsInitialCooldown ?? 180;
    this.isFallingSwordsCasting = false;
    this.fallingSwordsCastTimer = 0;
    this.activeFallingSwords = [];
    this.activeTrackingSlashes = [];
    this._trackingSwordSeq = null;

    // ── Passive: Shadow Step Dash ──
    this.shadowStepCooldownTimer = cfg.shadowStepInitialCooldown ?? 75;

    // ── Skill 2: STARS Phase 1 & Phase 3 (B&W Line -> Purple Cone -> Reverse -> Flicker -> 6 or 2 Shards) ──
    this.starBurstCooldownTimer = cfg.starBurstInitialCooldown ?? 300;
    this.isStarBurstCasting = false;
    this.starBurstCastTimer = 0;
    this.activeStarCone = null;
    this._starConeAngle = 0;
    this._starConeSpawned = 0;
    this._starCastCount = 0;
    this._starCastVariant = 'phase1';
    this._starPhase3SeqIndex = 0;
    this._lastStarSfxTick = 0;
    this.activeStarBursts = [];
    this.activeStarChildren = [];
    this.activeOrbitStars = [];

    // ── Skill 3: Blade Corridor (Sword Tunnel / Carousel Ring) ──
    this.bladeCorridorCooldownTimer = cfg.bladeCorridorInitialCooldown ?? 240;
    this.isBladeCorridorCasting = false;
    this.bladeCorridorCastTimer = 0;
    this._bladeCorridorCycleCount = 0;
    this.activeCorridorBlades = [];

    // ── Skill 3B: Sword Tunnel (Phase 1 Tunnel, Phase 2 Spiral Tunnel, Phase 2 Finisher) ──
    this.isSwordTunnelCasting = false;
    this.swordTunnelCastTimer = 0;
    this._swordTunnelCastPhase = 1;
    this._swordTunnelCastCount = 0;
    this.activeSwordTunnel = null;
    this.activeTunnelSwords = [];
    this.activeTunnelBeamHitboxes = [];
    this.activeTunnelAfterimages = [];

    // ── Skill 4: Snowflake Matrix (+ / X Lock-In Laser Grid) ──
    this.snowflakeMatrixCooldownTimer = cfg.snowflakeMatrixInitialCooldown ?? 360;
    this.isSnowflakeMatrixCasting = false;
    this.snowflakeMatrixPhase = 'idle'; // 'idle' | 'charge' | 'lock' | 'active'
    this.snowflakeMatrixTimer = 0;
    this.activeSnowflakeMatrix = null;

    // ── Ultimate: Rotating Slash (Phase 3 Finisher — 10 Basic Attack Hits) & Desperation Void Rifts ──
    this.swoonCooldownTimer = cfg.swoonInitialCooldown ?? 0;
    this.swoonBasicHits = 0;
    this.isSwoonChanneling = false;
    this.swoonChannelTimer = 0;
    this.swoonActiveTimer = 0;
    this.skillCastAngle = 0;
    this._rotatingSlashSeq = null;
    if (this._ultPausedTargets && this._ultPausedTargets.size > 0) {
      this._releaseUltPausedTargets();
    } else {
      this._ultPausedTargets = new Map();
    }
    this.activeRotatingSlashes = [];
    this.activeRotatingShards = [];
    this.activeVoidRifts = [];
    this.activeRiftStrikes = [];

    // ── Final Phase: Full-Screen Roaring Desperation Flag ──
    this.hasTriggeredDesperationRoar = false;

    // ── Passive: Black Knife Parry (Deltarune Ch.3 Block Guard & Riposte) ──
    this.blockPoseTimer = 0;
    this.parryHitAnimTimer = 0;
    this.parryHitAnimMaxFrames = cfg.parryHitAnimFrames ?? 18;
    this.parryWhiteFlashTimer = 0;
    this.parryShakeTimer = 0;
    this.parryCooldownTimer = 0;
    this._domainParryGraceTimer = 0;
    this.parryStanceIndex = 0;
    this.parryCount = 0;
    this.activeParryBlockVfx = [];

    // ── Transient Visual Effects & Afterimages (Rule 25 Non-Freezing) ──
    this.activeVisualEffects = [];
    this.afterImages = [];
    this._afterImageTick = 0;

    this._registerCooldownExclusions();
  }

  reset() {
    super.reset();
    this._initKnightCombatState(this._cfg());
  }

  _cfg() {
    return (typeof CONFIG !== 'undefined' && CONFIG.roaring_knight)
      ? CONFIG.roaring_knight
      : roaringKnightConfig;
  }

  _playAudio(key, fallbackPath, defaultVol = 0.85, speed = 1.0, offset = 0) {
    if (typeof audioSystem === 'undefined' || !audioSystem.playSFX) return;
    const cfg = this._cfg();
    const sfxPath = cfg.sounds?.[key] || fallbackPath;
    const vol = cfg.soundVolumes?.[key] ?? defaultVol;
    audioSystem.playSFX(sfxPath, vol, speed, offset);
  }

  _stopAudio(key, fallbackPath) {
    if (typeof audioSystem === 'undefined' || !audioSystem.stopSoundBySrc) return;
    const cfg = this._cfg();
    const sfxPath = cfg.sounds?.[key] || fallbackPath;
    audioSystem.stopSoundBySrc(sfxPath, true);
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
    if (this.snowflakeMatrixPhase === 'lock' || this.snowflakeMatrixPhase === 'active') return false;
    if (this.isMeleeSwinging && this.meleePhase >= 2 && this.meleePhase <= 4) return false;
    return super.canAim();
  }

  /**
   * Returns current Black Knife parry probability (0 while stunned, swinging, or channeling skills).
   */
  getParryChance() {
    const cfg = this._cfg();
    if (!this.isSkillEnabled(cfg.enableParry, true) || this.hp <= 0 || this.isDead) return 0;
    const isBusy =
      (this.isMeleeSwinging && this.meleePhase >= 1 && this.meleePhase <= 4) ||
      this.isSwoonChanneling ||
      this.isSnowflakeMatrixCasting ||
      this.isSwordTunnelCasting ||
      this.isBladeCorridorCasting ||
      this.isFallingSwordsCasting ||
      this.isStarBurstCasting;
    if (isBusy || (this.parryCooldownTimer || 0) > 0) return 0;
    return this.blockPoseTimer > 0
      ? (cfg.parryActiveChance ?? 0.70)
      : (cfg.parryPassiveChance ?? 0.40);
  }

  _isUnblockableAttack(attacker, opts = {}) {
    if (opts.isRiposte) return true;
    const isHardUnblockable = Boolean(
      opts.isRatioCrit || opts.isNanamiPause || opts.isSureKill ||
      opts.isSaitamaCounter || opts.isSaitamaPunch || opts.isSeriousPunch ||
      opts.isDivineFlame || opts.isFuga ||
      (attacker && (attacker.characterId === 'saitama' || attacker.type === 'saitama'))
    );
    if (isHardUnblockable) return true;

    const isSukunaShrineSlash = Boolean(
      opts.isDomainSlash || opts.isSukunaDomainSliceLine || opts.isSukunaSlash ||
      opts.projectile?.isSukunaSlash ||
      (opts.isDomain && attacker && (attacker.characterId === 'sukuna' || attacker.type === 'sukuna') && !opts.isDivineFlame && !opts.isFuga)
    );
    if (isSukunaShrineSlash) return false;

    const isGuaranteed = Boolean(
      opts.undodgeable || opts.isGuaranteedHit || opts.bypassShield ||
      opts.isAmbushThrust || opts.isAmbushKatana || opts.isAmbushFlurry ||
      opts.isTojiUltimateAssault || opts.isTojiUltimateFinalBlow
    );
    if (isGuaranteed) return true;
    return Boolean(
      opts.isDomain || opts.isGojoDomain || opts.isPoison || opts.isBurn ||
      opts.isFlame || opts.isExplosion || opts.fromBlackHole || opts.isRed ||
      opts.isPurpleDPS ||
      (opts.projectile && (opts.projectile.type === 'purple' || opts.projectile.isGojoPurple))
    );
  }

  _spawnParryBlockEffects(attacker, opts = {}) {
    const cfg = this._cfg();
    const angle = opts.isSukunaDomainSliceLine && Number.isFinite(opts.angle)
      ? opts.angle + Math.PI
      : attacker && Number.isFinite(attacker.x) && Number.isFinite(attacker.y)
        ? Math.atan2(attacker.y - this.y, attacker.x - this.x)
        : (this.gunAngle || 0);
    const guardDist = (this.r || 25) * 0.92;
    const contactX = this.x + Math.cos(angle) * guardDist;
    const contactY = this.y + Math.sin(angle) * guardDist;

    // obj_block_vfx sparks shooting vertically/outward along guard line with deceleration
    for (const dir of [-1, 1]) {
      this.activeParryBlockVfx.push({
        kind: 'spark',
        x: contactX + (Math.random() - 0.5) * 8,
        y: contactY + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * (1.2 + Math.random() * 1.6),
        vy: dir * (5.2 + Math.random() * 2.2),
        dragY: 0.42,
        size: 7 + Math.random() * 4,
        angle: Math.random() * Math.PI,
        life: 14,
        maxLife: 14,
      });
    }
    this.activeParryBlockVfx.push({
      kind: 'clash_arc',
      x: this.x + Math.cos(angle) * (guardDist * 0.35),
      y: this.y + Math.sin(angle) * (guardDist * 0.35),
      vx: 0,
      vy: 0,
      dragY: 0,
      angle,
      radius: (this.r || 25) * 1.15,
      life: 11,
      maxLife: 11,
    });

    spawnParrySparksEffect(contactX, contactY, 16);
    for (let i = 0; i < 8; i++) {
      spawnSparks(contactX, contactY, 1, 'silver', { color: '#FFFFFF', blendMode: 0 });
    }
    triggerGlobalScreenShake(3.5, 8);
    this._playAudio('parry', cfg.sounds?.parry || 'Assets/Sound Effects/Skills/parry.mp3', 0.85);
    this._playAudio('hitStrong', 'Assets/Sound Effects/RoaringKnightSFX/snd_metal_hit_strong.wav', 0.48, 1.38);
    spawnFloatingText(this.x, this.y - (this.r || 25) - 16, 'PARRIED!', '#FFFFFF');
  }

  _applyParryRiposte(attacker, opts = {}) {
    if (!attacker || attacker === this || attacker.hp <= 0 || attacker.isDead) return;
    if (opts.isProjectile || opts.isAOE || opts.isSukunaDomainSliceLine) return;
    const cfg = this._cfg();
    const dist = Math.hypot(attacker.x - this.x, attacker.y - this.y);
    const maxReach = (this.r || 25) + (attacker.r || attacker.radius || 25) + 95;
    if (dist > maxReach) return;

    const pushA = Math.atan2(attacker.y - this.y, attacker.x - this.x);
    const kb = cfg.parryCounterKnockback ?? 6.5;
    if (!attacker.invulnerable && typeof attacker.applyHitStun === 'function') {
      attacker.applyHitStun(cfg.parryCounterStunFrames ?? 12);
    }
    attacker.vx = (attacker.vx || 0) + Math.cos(pushA) * kb;
    attacker.vy = (attacker.vy || 0) + Math.sin(pushA) * kb;

    const counterDmg = cfg.parryCounterDamage ?? 12;
    if (counterDmg > 0 && !attacker.invulnerable) {
      applyDamageToTarget(attacker, counterDmg, this, {
        isMelee: true,
        isParry: true,
        isRiposte: true,
        source: 'roaring_knight_parry_riposte',
        hitAngle: pushA,
      });
    }
  }

  _tryParryIncomingHit(amount, attacker, opts = {}) {
    if (this.isTargetOfAmbush || this.isChainedByMakima) return false;
    const isStunned =
      (this.timeStopTimer || 0) > 0 ||
      (this.hitStunTimer || 0) > 0 ||
      (this.electricStunTimer || 0) > 0 ||
      (this.paralyzeTimer || 0) > 0 ||
      (this.statusEffects && ((this.statusEffects.timeStopTimer || 0) > 0 || (this.statusEffects.paralyzeTimer || 0) > 0)) ||
      (typeof this.isCaughtInBeam === 'function' && this.isCaughtInBeam());
    if (isStunned || this._isUnblockableAttack(attacker, opts)) return false;

    const cfg = this._cfg();
    const parryEnabled = cfg.enableParry !== false && cfg.enableParry !== 0;
    const isDomainSlashHit = Boolean(opts.isDomainSlash || opts.isSukunaDomainSliceLine);
    // Multi-line Sukuna shrine waves spawn 3 slice lines in the same frame; deflect follow-up lines cleanly
    if (parryEnabled && isDomainSlashHit && this._domainParryGraceTimer > 0) {
      return true;
    }

    const chance = this.getParryChance();
    if (chance <= 0 || Math.random() >= chance) return false;

    if (attacker && !attacker.isDead && typeof this.aim === 'function') {
      this.aim(attacker);
    }
    this.parryCount++;
    this.blockPoseTimer = cfg.parryGuardDuration ?? 75;
    this.parryHitAnimMaxFrames = Math.max(6, cfg.parryHitAnimFrames ?? 18);
    this.parryHitAnimTimer = this.parryHitAnimMaxFrames;
    this.parryWhiteFlashTimer = 6;
    this.parryShakeTimer = 8;
    const baseCooldown = cfg.parryCooldownFrames ?? 16;
    if (isDomainSlashHit) {
      this._domainParryGraceTimer = 3;
      this.parryCooldownTimer = Math.min(10, baseCooldown);
    } else {
      this.parryCooldownTimer = baseCooldown;
    }
    this.parryStanceIndex = ((this.parryStanceIndex || 0) + 1) % 3;

    const awayA = attacker && Number.isFinite(attacker.x) && Number.isFinite(attacker.y)
      ? Math.atan2(this.y - attacker.y, this.x - attacker.x)
      : (this.gunAngle || 0) + Math.PI;
    this.vx = (this.vx || 0) + Math.cos(awayA) * 2.4;
    this.vy = (this.vy || 0) + Math.sin(awayA) * 2.4;

    this._spawnParryBlockEffects(attacker, opts);
    this._applyParryRiposte(attacker, opts);
    return true;
  }

  /**
   * Plays authentic Deltarune Knight hurt SFX on incoming hits, handles Black Knife Parry, and releases Ult target pauses on defeat.
   */
  takeDamage(amount, attacker, opts = {}) {
    if (this._tryParryIncomingHit(amount, attacker, opts)) {
      return false;
    }

    const dealt = super.takeDamage(amount, attacker, opts);
    if (this.hp <= 0) {
      this._releaseUltPausedTargets();
      this.interruptAttacks(true);
      return dealt;
    }
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
    if (
      this.isMeleeSwinging &&
      (this.meleePhase <= 2 ||
        this._basicRotatingSlash?.stage === 'basic_dash' ||
        this._basicRotatingSlash?.stage === 'basic_aim' ||
        forceCancelAll)
    ) {
      this.isMeleeSwinging = false;
      this.meleePhase = 0;
      this.meleePhaseTimer = 0;
      this.meleePhaseProgress = 0;
      if (this._basicRotatingSlash) {
        this._basicRotatingSlash = null;
        this._stopAudio('rotatingSlashLine', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_rotatingslash_line.wav');
      }
    }
    if (this.isFallingSwordsCasting || forceCancelAll) {
      this.isFallingSwordsCasting = false;
      this.fallingSwordsCastTimer = 0;
    }
    if (this.isStarBurstCasting || forceCancelAll) {
      this.isStarBurstCasting = false;
      this.starBurstCastTimer = 0;
      if (this.activeStarCone && (this.activeStarCone.phase === 'intro' || this.activeStarCone.phase === 'open_flash' || this.activeStarCone.phase === 'cone')) {
        this.activeStarCone.phase = 'outro';
        this.activeStarCone.timer = Math.min(8, this.activeStarCone.outroMaxFrames || 12);
      }
      if (forceCancelAll) {
        this.activeStarCone = null;
      }
    }
    if (this.isBladeCorridorCasting || forceCancelAll) {
      this.isBladeCorridorCasting = false;
      this.bladeCorridorCastTimer = 0;
    }
    if (this.isSwordTunnelCasting || forceCancelAll) {
      this.isSwordTunnelCasting = false;
      this.swordTunnelCastTimer = 0;
    }
    if (this.isSnowflakeMatrixCasting && (this.snowflakeMatrixPhase !== 'active' || forceCancelAll)) {
      this.isSnowflakeMatrixCasting = false;
      this.snowflakeMatrixPhase = 'idle';
      this.snowflakeMatrixTimer = 0;
      this.activeSnowflakeMatrix = null;
    }
    if (this.isSwoonChanneling || forceCancelAll) {
      if (this._rotatingSlashSeq?.stage === 'ult_swing' || forceCancelAll) {
        this.isMeleeSwinging = false;
        this.meleePhase = 0;
        this.meleePhaseTimer = 0;
        this.meleePhaseMaxTimer = 1;
        this.meleePhaseProgress = 0;
      }
      this.isSwoonChanneling = false;
      this.swoonChannelTimer = 0;
      this.swoonActiveTimer = 0;
      this._rotatingSlashSeq = null;
      this._releaseUltPausedTargets();
      this._stopAudio('rotatingSlashLine', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_rotatingslash_line.wav');
      this.activeVisualEffects = this.activeVisualEffects.filter(fx => fx.kind !== 'swoon_telegraph');
    }
    if (forceCancelAll) {
      this._basicRotatingSlash = null;
      this._trackingSwordSeq = null;
      this.activeSwordTunnel = null;
      this.activeTunnelSwords.length = 0;
      this.activeTunnelBeamHitboxes.length = 0;
      this.activeTunnelAfterimages.length = 0;
      this.activeRotatingSlashes.length = 0;
      this.activeRotatingShards.length = 0;
      this.activeFallingSwords.length = 0;
      this.activeTrackingSlashes.length = 0;
      this.activeOrbitStars.length = 0;
      this.activeCorridorBlades.length = 0;
      this.activeVoidRifts.length = 0;
      this.activeRiftStrikes.length = 0;
      this.activeParryBlockVfx.length = 0;
      this.blockPoseTimer = 0;
      this.parryHitAnimTimer = 0;
      this.parryWhiteFlashTimer = 0;
      this.parryShakeTimer = 0;
      this._domainParryGraceTimer = 0;
    }
  }

  /**
   * Rule 25: Advances all non-interactive world VFX, projectiles, and afterimages even when frozen.
   */
  _updateAllTransientEffects(opponent, arena) {
    this._vfxTick++;
    if (this.parryHitAnimTimer > 0) this.parryHitAnimTimer--;
    if (this.parryWhiteFlashTimer > 0) this.parryWhiteFlashTimer--;
    if (this.parryShakeTimer > 0) this.parryShakeTimer--;
    if (this._domainParryGraceTimer > 0) this._domainParryGraceTimer--;

    for (let i = this.activeParryBlockVfx.length - 1; i >= 0; i--) {
      const fx = this.activeParryBlockVfx[i];
      fx.x += fx.vx || 0;
      fx.y += fx.vy || 0;
      if (fx.dragY && Math.abs(fx.vy || 0) > 0.05) {
        fx.vy = fx.vy > 0 ? Math.max(0, fx.vy - fx.dragY) : Math.min(0, fx.vy + fx.dragY);
      }
      fx.life--;
      if (fx.life <= 0) {
        this.activeParryBlockVfx.splice(i, 1);
      }
    }

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

    // 3. Advance active Skill projectiles & world hazards cleanly
    this._updateRotatingSlashesDecay();
    this._updateRotatingShards();
    this._updateStarConeDecay();
    this._updateFallingSwords(opponent, arena);
    this._updateTrackingSlashes(opponent);
    this._advanceSwordProjectiles(this.activeCorridorBlades, opponent, arena, 'roaring_knight_blade_corridor');
    this._updateSwordTunnelEffects(opponent, arena);
    this._updateStarBursts(opponent, arena);
    this._updateStarChildren(opponent, arena);
    this._updateOrbitingStars(opponent);
    this._updateRiftStrikes(opponent, arena);
    this._updateVoidRifts(arena);

    // Ensure discharging Snowflake Matrix beams finish cleanly even under time-stop stasis (Rule 25)
    if (this.activeSnowflakeMatrix && this.snowflakeMatrixPhase === 'active') {
      const frozenOrStunned = (this.timeStopTimer || 0) > 0 || (this.hitStunTimer || 0) > 0;
      if (frozenOrStunned) {
        this.activeSnowflakeMatrix.timer--;
        this.snowflakeMatrixTimer = this.activeSnowflakeMatrix.timer;
        if (this.activeSnowflakeMatrix.timer <= 0) {
          this.isSnowflakeMatrixCasting = false;
          this.snowflakeMatrixPhase = 'idle';
          this.activeSnowflakeMatrix = null;
        }
      }
    }
  }

  /**
   * Main 60 FPS update tick.
   */
  update(opponent, ownerIndex, arena) {
    if (arena && Number.isFinite(arena.x) && Number.isFinite(arena.y) && Number.isFinite(arena.width) && Number.isFinite(arena.height)) {
      this._arenaBounds = {
        x: arena.x,
        y: arena.y,
        width: arena.width,
        height: arena.height,
        shape: arena.shape,
        radius: arena.radius,
      };
    }

    // 0. Mandatory Rule 25 top-of-update decay BEFORE freeze guard
    this._updateAllTransientEffects(opponent, arena);

    // 1. Mandatory Rule 1 Freeze & TimeStop Early Exit
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks(false);
      return;
    }

    // 2. Tick Cooldowns (Skill 1 begins ticking down immediately upon activation; single-source tick)
    const canTickSkillCooldowns =
      !(this.isEvading || this.isPreSplitting) &&
      !(typeof this.isParalyzedDebuffActive === 'function' && this.isParalyzedDebuffActive()) &&
      !((this.silenceTimer || 0) > 0);
    if (canTickSkillCooldowns) {
      if (this.shadowStepCooldownTimer > 0) this.shadowStepCooldownTimer--;
      if (this.basicAttackCooldownTimer > 0) this.basicAttackCooldownTimer--;
      if (this.skill1CooldownTimer > 0) this.skill1CooldownTimer--;
      if (this.fallingSwordsCooldownTimer > 0) this.fallingSwordsCooldownTimer--;
      if (this.starBurstCooldownTimer > 0) this.starBurstCooldownTimer--;
      if (this.bladeCorridorCooldownTimer > 0) this.bladeCorridorCooldownTimer--;
      if (this.snowflakeMatrixCooldownTimer > 0) this.snowflakeMatrixCooldownTimer--;
      if (this.swoonCooldownTimer > 0) this.swoonCooldownTimer--;
      if (this.parryCooldownTimer > 0) this.parryCooldownTimer--;
      if (this.blockPoseTimer > 0) this.blockPoseTimer--;
    }

    // 3. Active Skill Pipelines
    this._updateSwoonChannel(opponent, arena);
    this._updateSnowflakeMatrix(opponent, arena);
    this._updateBladeCorridorChannel(opponent, arena);
    this._updateSwordTunnelChannel(opponent, arena);
    this._updateFallingSwordsChannel(opponent, arena);
    this._updateStarBurstChannel(opponent, arena);
    this._updateBlackKnifeMelee(opponent, arena);

    const prevX = this.x;
    const prevY = this.y;

    // 4. AI Combat Decision & Aggressive Steering
    this._decideAndMove(opponent, arena);

    // 5. Centralized Physics & Wall Bounce via Fighter base class
    super.update(opponent, ownerIndex, arena);

    // 6. Continuous Movement Ghost Model Afterimages (Rule 35)
    this._recordShadowMantleAfterimage(prevX, prevY);
  }

  _recordShadowMantleAfterimage(prevX = this.x, prevY = this.y) {
    if (this.hp <= 0) return;
    if (typeof this.areAttackEffectsSuppressed === 'function' && this.areAttackEffectsSuppressed()) return;

    const cfg = this._cfg();
    const movedDist = Math.hypot(this.x - prevX, this.y - prevY);
    const speedMag = Math.hypot(this.vx || 0, this.vy || 0);
    if (Math.max(movedDist, speedMag) < 0.25) return;

    this._afterImageTick++;
    const interval = Math.max(1, cfg.afterImageInterval ?? 4);
    if (this._afterImageTick % interval !== 0) return;

    const gx = this.x;
    const gy = this.y - (this.z || 0);
    const lastGhost = this.afterImages[this.afterImages.length - 1];
    if (lastGhost && Math.hypot(gx - lastGhost.x, gy - lastGhost.y) < 3) {
      return;
    }

    const life = cfg.afterImageLife ?? 18;
    this.afterImages.push({
      x: gx,
      y: gy,
      angle: this.gunAngle !== undefined ? this.gunAngle : (this.angle || 0),
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
    return Boolean(
      (this.isSwoonChanneling && this._rotatingSlashSeq?.stage !== 'ult_dash') ||
      this.swoonActiveTimer > 0 ||
      this.isStarBurstCasting ||
      (this.isSnowflakeMatrixCasting && this.snowflakeMatrixPhase !== 'idle') ||
      this._basicRotatingSlash?.stage === 'basic_swing'
    );
  }

  /**
   * Exposes channeling state so Fighter.applyMovementPhysics() treats Swoon/Matrix as stationary.
   */
  isChannelingSkill() {
    return this.isStationarySkillActive();
  }

  /**
   * Halts movement completely while casting Roaring Swoon or Snowflake Matrix and resumes afterward.
   */
  applyMovementPhysics(extraMultiplier = 1) {
    if (this.isStationarySkillActive()) {
      this.vx = 0;
      this.vy = 0;
      this._stationaryStallFrames = 0;
      return;
    }
    return super.applyMovementPhysics(extraMultiplier);
  }

  _decideAndMove(opponent, arena) {
    if (!opponent || opponent.hp <= 0) return;

    // Casting Roaring Swoon or Snowflake Matrix completely halts movement until discharge finishes
    if (this.isStationarySkillActive()) {
      this.vx = 0;
      this.vy = 0;
      if (this.isSwoonChanneling || this.swoonActiveTimer > 0) {
        this.gunAngle = this.skillCastAngle;
      }
      return;
    }

    if (
      this._basicRotatingSlash?.stage === 'basic_dash' ||
      this._rotatingSlashSeq?.stage === 'ult_dash'
    ) {
      return;
    }

    const dx = opponent.x - this.x;
    const dy = opponent.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const targetAngle = Math.atan2(dy, dx);
    const cfg = this._cfg();
    // Final Phase Desperation Attack: Full-Screen Roaring (once per match <= 35% HP)
    if (
      isSkillEnabled(cfg.enableDesperationRoaring, true) &&
      !this.hasTriggeredDesperationRoar &&
      this.hp > 0 &&
      this.hp <= this.maxHp * (cfg.desperationHpThreshold ?? 0.35)
    ) {
      this._triggerDesperationRoaring(opponent, arena);
    }

    const anyMajorCast =
      this.isMeleeSwinging ||
      this.isFallingSwordsCasting ||
      Boolean(this._trackingSwordSeq) ||
      this.isStarBurstCasting ||
      this.isBladeCorridorCasting ||
      this.isSwordTunnelCasting ||
      this.isSnowflakeMatrixCasting;

    // Priority 1: Ultimate — Rotating Slash (Phase 3 Finisher, requires hit count & close proximity to enemy)
    const swoonHitsReq = Math.max(1, cfg.swoonHitsRequired ?? 10);
    const ultTriggerRange = cfg.swoonTriggerRange ?? 140;
    const ultEnabled = isSkillEnabled(cfg.enableRotatingSlash ?? cfg.enableRoaringSwoon, true);
    const ultReady = ultEnabled && this.swoonCooldownTimer <= 0 && this.swoonBasicHits >= swoonHitsReq;
    if (
      ultReady &&
      dist <= ultTriggerRange &&
      !anyMajorCast &&
      !this._basicRotatingSlash
    ) {
      this._startRoaringSwoon(targetAngle, opponent, arena);
      return;
    }

    // Priority 2: Unified Random Skill 1 (randomly picks from enabled active skills when shared CD is up)
    if (
      isSkillEnabled(cfg.enableSkill1, true) &&
      this.skill1CooldownTimer <= 0 &&
      !anyMajorCast &&
      this._castRandomSkill1(dist, targetAngle, opponent, arena)
    ) {
      return;
    }

    // Priority 3: Basic Attack — Rotating Slash Phase 1 (Black Knife Held; defer while closing in for charged Ultimate)
    if (
      !ultReady &&
      isSkillEnabled(cfg.enableBlackKnife, true) &&
      this.basicAttackCooldownTimer <= 0 &&
      !this.isMeleeSwinging &&
      !this._basicRotatingSlash &&
      dist <= (cfg.basicAttackReach ?? 175)
    ) {
      this._startBlackKnifeSwing(targetAngle, opponent, arena);
    }

    // Relentless Knight Steering & Active Basic Attack Dash / Stationary Cast
    if (this.isMeleeSwinging) {
      if (this._basicRotatingSlash?.stage !== 'basic_dash') {
        this.vx = 0;
        this.vy = 0;
      }
      return;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    if (
      isSkillEnabled(cfg.enableShadowMantle, true) &&
      this.shadowStepCooldownTimer <= 0 &&
      dist > 165
    ) {
      this._triggerShadowStepDash(nx, ny, cfg);
    }
  }

  _isSkill1Active() {
    return Boolean(
      this.isFallingSwordsCasting ||
      this._trackingSwordSeq ||
      this.isStarBurstCasting ||
      this.isBladeCorridorCasting ||
      this.isSwordTunnelCasting ||
      Boolean(this.activeSwordTunnel) ||
      this.isSnowflakeMatrixCasting
    );
  }

  _armUnifiedSkill1Cooldown(skillId, skillLabel) {
    const cfg = this._cfg();
    const cd = cfg.skill1Cooldown ?? 420;
    this.skill1CooldownTimer = cd;
    this.skill1CooldownMax = cd;
    this._activeSkill1Id = skillId;
    this._activeSkill1Label = skillLabel;
  }

  _castRandomSkill1(dist, targetAngle, opponent, arena) {
    const cfg = this._cfg();
    const candidates = [];
    if (isSkillEnabled(cfg.enableFallingSwords, true)) {
      candidates.push({
        id: 'falling_swords',
        inRange: dist > 60,
        cast: () => this._startFallingSwordsCast(),
      });
    }
    if (isSkillEnabled(cfg.enableStarBurst, true)) {
      candidates.push({
        id: 'star_burst',
        inRange: dist > 60,
        cast: () => this._startStarBurstCast(targetAngle, arena),
      });
    }
    if (isSkillEnabled(cfg.enableBladeCorridor, true)) {
      candidates.push({
        id: 'blade_corridor',
        inRange: dist > 60,
        cast: () => this._startBladeCorridorCast(),
      });
    }
    const enableTunnel1 = isSkillEnabled(cfg.enableSwordTunnel, true);
    const enableTunnel2 = isSkillEnabled(cfg.enableSwordTunnelPhase2, true);
    if (enableTunnel1) {
      candidates.push({
        id: 'sword_tunnel',
        inRange: dist > 50,
        cast: () => this._startSwordTunnelCast(1, targetAngle, opponent, arena),
      });
    }
    if (enableTunnel2) {
      candidates.push({
        id: 'phase2_sword_tunnel',
        inRange: dist > 50,
        cast: () => this._startSwordTunnelCast(2, targetAngle, opponent, arena),
      });
    }
    if (!enableTunnel1 && !enableTunnel2 && isSkillEnabled(cfg.enableSwordTunnelFinisher, true)) {
      candidates.push({
        id: 'phase2_finisher',
        inRange: dist > 50,
        cast: () => this._startPhase2FinisherCast(opponent, arena),
      });
    }
    if (isSkillEnabled(cfg.enableSnowflakeMatrix, true)) {
      candidates.push({
        id: 'snowflake_matrix',
        inRange: dist <= 380,
        cast: () => this._startSnowflakeMatrixCast(opponent, arena),
      });
    }
    if (candidates.length === 0) return false;
    const eligible = candidates.filter(c => c.inRange);
    const pool = eligible.length > 0 ? eligible : candidates;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    chosen.cast();
    return true;
  }

  _triggerShadowStepDash(nx, ny, cfg) {
    const dashSpeed = cfg.shadowStepDashSpeed ?? 13.5;
    const sideSign = Math.random() < 0.5 ? 1 : -1;
    const angle = Math.atan2(ny, nx) + sideSign * 0.28;
    this.vx = Math.cos(angle) * dashSpeed;
    this.vy = Math.sin(angle) * dashSpeed;
    this.shadowStepCooldownTimer = cfg.shadowStepCooldown ?? 135;
    this._playAudio('teleport', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_teleport.wav', 0.65);
    this._playAudio('cape', 'Assets/Sound Effects/RoaringKnightSFX/snd_cape_1.wav', 0.55);

    const life = cfg.afterImageLife ?? 18;
    this.afterImages.push({
      x: this.x,
      y: this.y - (this.z || 0),
      angle: this.gunAngle || angle,
      r: this.r || 25,
      life,
      maxLife: life,
    });
  }

  // ── Basic Attack: Dash First -> Stop + Black Knife Swing Animation -> Rotating Slash Phase 1 (1->2->2->3->3->4) ──
  _startBlackKnifeSwing(angle, opponent = null, arena = null) {
    const cfg = this._cfg();
    const bounds = this._resolveUltArenaBounds(arena);
    const slashArray = Array.isArray(cfg.basicSlashArray) && cfg.basicSlashArray.length > 0
      ? cfg.basicSlashArray
      : [1, 2, 2, 3, 3, 4];
    const lineCount = slashArray[this._basicSlashStep % slashArray.length];
    this._basicSlashStep = (this._basicSlashStep + 1) % slashArray.length;

    const dashFrames = Math.max(4, cfg.knifeDashFrames ?? 9);
    const dashSpeed = cfg.knifeDashSpeed ?? 10.5;
    const windupFrames = Math.max(8, cfg.knifeWindupFrames ?? 8);
    const holdFrames = Math.max(2, cfg.knifeHoldFrames ?? 2);
    const strikeFrames = Math.max(5, cfg.knifeStrikeFrames ?? 7);
    const swingRecoverFrames = Math.max(4, cfg.knifeRecoveryFrames ?? 5);
    const aimFrames = Math.max(8, cfg.basicSlashAimFrames ?? 18);
    const spin = (this._basicSlashStep % 2 === 1) ? 1 : -1;
    const rawTarget = (opponent && opponent.hp > 0) ? opponent : null;
    const rawCx = rawTarget ? rawTarget.x : this.x + Math.cos(angle) * 95;
    const rawCy = rawTarget ? rawTarget.y : this.y + Math.sin(angle) * 95;
    const aimDir = rawTarget ? Math.atan2(rawCy - this.y, rawCx - this.x) : angle;

    // If already close to target, angle the opening dash as a crisp flanking step so it never overshoots inside target
    const startDist = rawTarget ? Math.hypot(rawCx - this.x, rawCy - this.y) : 999;
    const closeThresh = (this.r || 25) + ((rawTarget?.r || rawTarget?.radius || 25) + 42);
    const dashAngle = startDist <= closeThresh ? aimDir + spin * 0.85 : aimDir;

    this._basicRotatingSlash = {
      stage: 'basic_dash',
      dashTimer: dashFrames,
      dashMaxTimer: dashFrames,
      dashAngle,
      dashSpeed,
      swingPhase: 1,
      swingTimer: windupFrames,
      swingMaxTimer: windupFrames,
      holdFrames,
      strikeFrames,
      swingRecoverFrames,
      boardCx: Math.max(bounds.x + 28, Math.min(bounds.x + bounds.width - 28, rawCx)),
      boardCy: Math.max(bounds.y + 28, Math.min(bounds.y + bounds.height - 28, rawCy)),
      needsTargetLock: !rawTarget,
      aimTimer: aimFrames,
      maxAimFrames: aimFrames,
      windupAngle: aimDir + ((this._basicSlashStep % 3) - 1) * 0.28,
      spin,
      lineCount,
      slashAngles: [],
      fireIndex: 0,
      prevCutAngle: null,
      recoverTimer: 0,
      maxRecoverFrames: 6,
      damagedTargets: new Set(),
      span: Math.max(bounds.width, bounds.height) * 1.45,
      arenaBounds: { ...bounds },
    };

    this.isMeleeSwinging = true;
    this.meleePhase = 0;
    this.meleePhaseTimer = dashFrames;
    this.meleePhaseMaxTimer = dashFrames;
    this.meleePhaseProgress = 0;
    this.meleeHitRegistered = false;
    this.meleeCastAngle = aimDir;
    this.gunAngle = aimDir;
    this.vx = Math.cos(dashAngle) * dashSpeed;
    this.vy = Math.sin(dashAngle) * dashSpeed;
    this.basicAttackCooldownTimer = cfg.basicAttackCooldown ?? 78;
  }

  _updateBlackKnifeMelee(opponent, arena = null) {
    if (!this._basicRotatingSlash) {
      if (this.isMeleeSwinging && this._rotatingSlashSeq?.stage !== 'ult_swing') {
        this.isMeleeSwinging = false;
        this.meleePhase = 0;
      }
      return;
    }
    this._updateBasicRotatingSlash(opponent, arena);
  }

  _updateBasicRotatingSlash(opponent, arena) {
    const seq = this._basicRotatingSlash;
    const cfg = this._cfg();
    if (seq.stage === 'basic_dash') {
      this._stepBasicDashStage(seq, opponent);
      return;
    }
    if (seq.stage === 'basic_swing') {
      // Strictly stationary during the Black Knife swing animation only; free to move once swing finishes
      this.vx = 0;
      this.vy = 0;
      this._stepBasicPreSwing(seq, opponent, arena);
      return;
    }
    if (seq.stage === 'basic_aim') {
      this._stepBasicAimStage(seq);
      return;
    }
    this._stepBasicSlashFire(seq, cfg, opponent);
  }

  _stepBasicDashStage(seq, opponent) {
    seq.dashTimer--;
    this.vx = Math.cos(seq.dashAngle) * seq.dashSpeed;
    this.vy = Math.sin(seq.dashAngle) * seq.dashSpeed;
    if (opponent && opponent.hp > 0) {
      const aim = Math.atan2(opponent.y - this.y, opponent.x - this.x);
      this.meleeCastAngle = aim;
      this.gunAngle = aim;
    }

    const tRad = opponent ? (opponent.r || opponent.radius || 25) : 25;
    const curDist = opponent && opponent.hp > 0 ? Math.hypot(opponent.x - this.x, opponent.y - this.y) : 999;
    const stopDist = (this.r || 25) + tRad + 34;
    if (seq.dashTimer > 0 && curDist > stopDist) return;

    // Stop movement cleanly and enter Black Knife swing attack animation
    this.vx = 0;
    this.vy = 0;
    seq.stage = 'basic_swing';
    seq.swingPhase = 1;
    this.meleePhase = 1;
    this.meleePhaseTimer = seq.swingTimer;
    this.meleePhaseMaxTimer = seq.swingMaxTimer;
    this.meleePhaseProgress = 0;
  }

  _stepBasicPreSwing(seq, opponent, arena) {
    seq.swingTimer--;
    this.meleePhase = seq.swingPhase === 4 ? 5 : seq.swingPhase;
    this.meleePhaseTimer = Math.max(0, seq.swingTimer);
    this.meleePhaseMaxTimer = seq.swingMaxTimer;
    this.meleePhaseProgress = 1 - Math.max(0, seq.swingTimer) / Math.max(1, seq.swingMaxTimer);

    if (seq.swingPhase === 1 && opponent && opponent.hp > 0) {
      const aim = Math.atan2(opponent.y - this.y, opponent.x - this.x);
      this.meleeCastAngle = aim;
      this.gunAngle = aim;
    }
    if (seq.swingTimer > 0) return;

    if (seq.swingPhase === 1) {
      seq.swingPhase = 2;
      seq.swingTimer = seq.holdFrames;
      seq.swingMaxTimer = seq.holdFrames;
    } else if (seq.swingPhase === 2) {
      seq.swingPhase = 3;
      seq.swingTimer = seq.strikeFrames;
      seq.swingMaxTimer = seq.strikeFrames;
      const cutKey = this.meleeComboFlip ? 'cut2' : 'cut1';
      this._playAudio(cutKey, `Assets/Sound Effects/RoaringKnightSFX/snd_knight_${cutKey}.wav`, 0.85, 1.06);
    } else if (seq.swingPhase === 3) {
      seq.swingPhase = 4;
      seq.swingTimer = seq.swingRecoverFrames;
      seq.swingMaxTimer = seq.swingRecoverFrames;
    } else {
      this._beginBasicPhase1Aim(seq, opponent, arena);
    }
  }

  _beginBasicPhase1Aim(seq, opponent, arena) {
    const b = arena ? this._resolveUltArenaBounds(arena) : seq.arenaBounds;
    const aimDir = (opponent && opponent.hp > 0)
      ? Math.atan2(opponent.y - this.y, opponent.x - this.x)
      : (this.meleeCastAngle ?? this.gunAngle ?? 0);
    // Anchor Rotating Slash Phase 1 directly in front of Roaring Knight along its slash facing angle
    const frontOffset = (this.r || 25) * 2.4;
    const rawCx = this.x + Math.cos(aimDir) * frontOffset;
    const rawCy = this.y + Math.sin(aimDir) * frontOffset;
    seq.boardCx = Math.max(b.x + 28, Math.min(b.x + b.width - 28, rawCx));
    seq.boardCy = Math.max(b.y + 28, Math.min(b.y + b.height - 28, rawCy));
    seq.windupAngle = aimDir + ((this._basicSlashStep % 3) - 1) * 0.28;
    seq.needsTargetLock = false;
    seq.stage = 'basic_aim';

    // Unlock movement & neutral stance the moment the Black Knife swing animation completes
    this.isMeleeSwinging = false;
    this.meleePhase = 0;
    this.meleePhaseTimer = 0;
    this.meleePhaseMaxTimer = 1;
    this.meleePhaseProgress = 0;
    this._playAudio('rotatingSlashLine', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_rotatingslash_line.wav', 0.72, 1.0);
  }

  _stepBasicAimStage(seq) {
    const p = Math.min(1, 1 - seq.aimTimer / Math.max(1, seq.maxAimFrames));
    const rotSpeed = 0.145 * Math.pow(1 - p, 1.35) + 0.022;
    seq.windupAngle += rotSpeed * seq.spin;
    seq.aimTimer--;

    if (seq.aimTimer <= 0) {
      this._stopAudio('rotatingSlashLine', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_rotatingslash_line.wav');
      this._transitionBasicSlashToFire(seq);
    }
  }

  _transitionBasicSlashToFire(seq) {
    this._stopAudio('rotatingSlashLine', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_rotatingslash_line.wav');
    this._playAudio('cut1', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_cut.wav', 0.88, 1.0);
    this._playAudio('cutExplosion', 'Assets/Sound Effects/Attacks/explosion.mp3', 0.62, 1.08);

    const n = Math.max(1, seq.lineCount || 1);
    const angles = [];
    for (let k = 0; k < n; k++) {
      angles.push(seq.windupAngle + (k * Math.PI) / n);
    }
    for (let i = angles.length - 1; i > 0; i--) {
      const j = (i * 3 + this._basicSlashStep) % (i + 1);
      [angles[i], angles[j]] = [angles[j], angles[i]];
    }
    seq.slashAngles = angles;
    seq.stage = 'basic_slash';
    seq.fireIndex = 0;
  }

  _stepBasicSlashFire(seq, cfg, opponent) {
    const cutAngle = seq.slashAngles[seq.fireIndex];
    const maxTimer = cfg.basicSlashMaxTimer ?? 16;
    const halfWidth = cfg.basicSlashHalfWidth ?? 24;

    this.activeRotatingSlashes.push({
      mode: 'phase1',
      cx: seq.boardCx,
      cy: seq.boardCy,
      angle: cutAngle,
      prevAngle: seq.prevCutAngle,
      slashDir: (seq.fireIndex % 2 === 0 ? 1 : -1),
      halfWidth,
      span: seq.span,
      arenaBounds: { ...seq.arenaBounds },
      timer: maxTimer,
      maxTimer,
    });
    this._spawnRotatingSlashShards(seq.boardCx, seq.boardCy, cutAngle, seq.arenaBounds, seq.fireIndex);
    this._applyBasicRotatingLineDamage(seq, cutAngle, cfg, opponent);

    seq.prevCutAngle = cutAngle;
    seq.fireIndex++;

    if (seq.fireIndex >= seq.slashAngles.length) {
      this._basicRotatingSlash = null;
      this.meleeComboFlip = !this.meleeComboFlip;
    }
  }

  _applyBasicRotatingLineDamage(seq, cutAngle, cfg, opponent) {
    const dmg = cfg.basicAttackDamage ?? 24;
    const hitHalfW = Math.max(16, (cfg.basicSlashHalfWidth ?? 24) * 0.85);
    const pauseFrames = Math.max(1, cfg.basicSlashPauseFrames ?? 20);
    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);
    let hitAny = false;

    for (const target of targets) {
      if (!target || target.hp <= 0 || seq.damagedTargets.has(target)) continue;
      const tRad = target.r || target.radius || 25;
      const perp = Math.abs(-(target.x - seq.boardCx) * Math.sin(cutAngle) + (target.y - seq.boardCy) * Math.cos(cutAngle));
      if (perp > hitHalfW + tRad) continue;

      const dealt = applyDamageToTarget(target, dmg, this, {
        source: 'roaring_knight_black_knife',
        isMelee: true,
        hitAngle: cutAngle,
      });
      if (!dealt) continue;
      seq.damagedTargets.add(target);
      this.meleeHitRegistered = true;
      hitAny = true;
      if (!this.isSwoonChanneling && !this._rotatingSlashSeq) {
        const reqHits = Math.max(1, cfg.swoonHitsRequired ?? 10);
        if (this.swoonBasicHits < reqHits) {
          this.swoonBasicHits++;
        }
      }

      // Apply clean pause effect to the enemy whenever damaged by Basic Attack: Rotating Slash Phase 1
      if (!target.isTurret && !target.isDispenser && !target.isBuilding && !target.immuneToDebuffs && !target.isDebuffImmune) {
        if ((target.timeStopTimer || 0) <= pauseFrames) {
          target._rkPauseOwned = true;
        }
        if (typeof target.applyTimeStop === 'function') {
          target.applyTimeStop(pauseFrames);
        }
        target.timeStopTimer = Math.max(target.timeStopTimer || 0, pauseFrames);
        target.suppressFreezeOverlay = true;
        target._suppressFreezeTimer = true;
        target.vx = 0;
        target.vy = 0;
        target.knockbackVx = 0;
        target.knockbackVy = 0;
      }
      if (typeof target.applyHitStun === 'function') {
        target.applyHitStun(8);
      }
    }

    if (hitAny) {
      this._playAudio('hitStrong', 'Assets/Sound Effects/RoaringKnightSFX/snd_metal_hit_strong.wav', 0.82);
      triggerGlobalScreenShake?.(3.0, 5);
    }
  }

  // ── Skill 1: Tracking Sword Phase 1 (8-Dir SOUL Track -> Red Freeze -> White Flash -> Board Slash x10) ──
  _startFallingSwordsCast() {
    const cfg = this._cfg();
    this.isFallingSwordsCasting = true;
    this.fallingSwordsCastTimer = cfg.fallingSwordsChargeFrames ?? 16;
    this.fallingSwordsCooldownTimer = cfg.fallingSwordsCooldown ?? 420;
    this._armUnifiedSkill1Cooldown('falling_swords', 'TRACKING SWORD');
    this._playAudio('drawPower', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_drawpower.wav', 0.78);
  }

  _updateFallingSwordsChannel(opponent, arena) {
    if (this.isFallingSwordsCasting) {
      this.fallingSwordsCastTimer--;
      if (this.fallingSwordsCastTimer > 0) return;

      this.isFallingSwordsCasting = false;
      if (!opponent || opponent.hp <= 0) return;

      const total = Math.max(1, this._cfg().fallingSwordCount ?? 10);
      this._trackingSwordSeq = { total, spawned: 0, spawnTimer: 0, prevDirIdx: -1, recentDirs: [] };
      this._spawnNextTrackingSword(opponent, arena);
      return;
    }

    if (!this._trackingSwordSeq) return;
    if (!opponent || opponent.hp <= 0) {
      this._trackingSwordSeq = null;
      return;
    }

    this._trackingSwordSeq.spawnTimer--;
    if (this._trackingSwordSeq.spawnTimer <= 0) {
      this._spawnNextTrackingSword(opponent, arena);
    }
  }

  _pickTrackingSwordDirection(seq) {
    const recent = seq.recentDirs || [];
    const candidates = [];
    for (let d = 0; d < 8; d++) {
      const isOpposite = seq.prevDirIdx >= 0 && d === (seq.prevDirIdx + 4) % 8;
      if (!recent.includes(d) && !isOpposite) {
        candidates.push(d);
      }
    }
    const pool = candidates.length > 0
      ? candidates
      : [0, 1, 2, 3, 4, 5, 6, 7].filter(d => d !== seq.prevDirIdx && d !== (seq.prevDirIdx + 4) % 8);
    const dirIdx = pool[Math.floor(Math.random() * pool.length)] ?? 0;
    seq.prevDirIdx = dirIdx;
    if (!seq.recentDirs) seq.recentDirs = [];
    seq.recentDirs.push(dirIdx);
    if (seq.recentDirs.length > 3) seq.recentDirs.shift();
    return dirIdx * (Math.PI / 4);
  }

  _computeTrackingSwordAnchor(targetX, targetY, angle, arena, scale = 1.2) {
    const ax = arena?.x ?? 45;
    const ay = arena?.y ?? 240;
    const aw = arena?.width ?? 450;
    const ah = arena?.height ?? 450;
    const backX = -Math.cos(angle);
    const backY = -Math.sin(angle);
    const edgeOffset = Math.round(23 * scale);

    if (arena?.shape === 'circle') {
      const cx = ax + aw / 2;
      const cy = ay + ah / 2;
      const rad = arena.radius ?? (aw / 2);
      const dx = targetX - cx;
      const dy = targetY - cy;
      const b = dx * backX + dy * backY;
      const c = dx * dx + dy * dy - rad * rad;
      const sEdge = Math.max(0, -b + Math.sqrt(Math.max(0, b * b - c)));
      return { x: targetX + backX * (sEdge + edgeOffset), y: targetY + backY * (sEdge + edgeOffset) };
    }

    let sX = Infinity;
    if (backX > 1e-6) sX = (ax + aw - targetX) / backX;
    else if (backX < -1e-6) sX = (ax - targetX) / backX;

    let sY = Infinity;
    if (backY > 1e-6) sY = (ay + ah - targetY) / backY;
    else if (backY < -1e-6) sY = (ay - targetY) / backY;

    const sEdge = Math.max(0, Math.min(sX, sY));
    return { x: targetX + backX * (sEdge + edgeOffset), y: targetY + backY * (sEdge + edgeOffset) };
  }

  _spawnNextTrackingSword(opponent, arena) {
    const seq = this._trackingSwordSeq;
    if (!seq || !opponent || opponent.hp <= 0) {
      this._trackingSwordSeq = null;
      return;
    }

    const cfg = this._cfg();
    const idx = seq.spawned;
    const p = seq.total > 1 ? idx / (seq.total - 1) : 1;
    const trackFrames = Math.max(4, Math.round((cfg.trackingSwordTrackFramesStart ?? 28) + ((cfg.trackingSwordTrackFramesEnd ?? 10) - (cfg.trackingSwordTrackFramesStart ?? 28)) * p));
    const freezeFrames = Math.max(4, Math.round((cfg.trackingSwordFreezeFramesStart ?? 26) + ((cfg.trackingSwordFreezeFramesEnd ?? 12) - (cfg.trackingSwordFreezeFramesStart ?? 26)) * p));
    const whiteFrames = Math.max(3, Math.round((cfg.trackingSwordWhiteFramesStart ?? 6) + ((cfg.trackingSwordWhiteFramesEnd ?? 4) - (cfg.trackingSwordWhiteFramesStart ?? 6)) * p));
    const nextGap = Math.max(10, Math.round((cfg.trackingSwordIntervalStart ?? 38) + ((cfg.trackingSwordIntervalEnd ?? 16) - (cfg.trackingSwordIntervalStart ?? 38)) * p));

    const scale = cfg.trackingSwordScale ?? 1.2;
    const angle = this._pickTrackingSwordDirection(seq);
    const anchor = this._computeTrackingSwordAnchor(opponent.x, opponent.y, angle, arena, scale);

    this.activeFallingSwords.push({
      isTrackingSword: true,
      swordPhase: 'track',
      x: anchor.x,
      y: anchor.y,
      lineX: opponent.x,
      lineY: opponent.y,
      angle,
      scale,
      age: 0,
      alpha: 0.2,
      trackTimer: trackFrames,
      maxTrackFrames: trackFrames,
      freezeTimer: freezeFrames,
      maxFreezeFrames: freezeFrames,
      whiteTimer: whiteFrames,
      maxWhiteFrames: whiteFrames,
      pullBackPx: 0,
      freezeProgress: 0,
      flashJitter: 0,
      seqIndex: idx,
      damage: cfg.fallingSwordDamage ?? 14,
      knockback: cfg.fallingSwordKnockback ?? 6,
      isLocked: false,
    });

    this._playAudio('fallingSword', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_fallingsword.ogg', 0.58, 0.95 + idx * 0.035);
    this._playAudio('teleport', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_teleport.wav', 0.24, 1.30);
    seq.spawned++;
    if (seq.spawned >= seq.total) {
      this._trackingSwordSeq = null;
    } else {
      seq.spawnTimer = nextGap;
    }
  }

  _updateFallingSwords(opponent, arena) {
    for (let i = this.activeFallingSwords.length - 1; i >= 0; i--) {
      const sword = this.activeFallingSwords[i];
      if (!sword.isTrackingSword) {
        this._advanceSwordProjectiles([sword], opponent, arena, 'roaring_knight_falling_sword');
        if (sword.hasHit || sword.life <= 0) this.activeFallingSwords.splice(i, 1);
        continue;
      }

      sword.age = (sword.age || 0) + 1;

      if (sword.swordPhase === 'track') {
        sword.alpha = Math.min(0.84, 0.20 + 0.64 * Math.min(1, sword.age / 6));
        if (opponent && opponent.hp > 0) {
          sword.lineX += (opponent.x - sword.lineX) * 0.72;
          sword.lineY += (opponent.y - sword.lineY) * 0.72;
          const anchor = this._computeTrackingSwordAnchor(sword.lineX, sword.lineY, sword.angle, arena, sword.scale ?? 1.2);
          sword.x = anchor.x;
          sword.y = anchor.y;
        }
        sword.trackTimer--;
        if (sword.trackTimer <= 0) {
          sword.swordPhase = 'red_freeze';
          sword.isLocked = true;
          sword.freezeProgress = 0;
        }
      } else if (sword.swordPhase === 'red_freeze') {
        const maxFreeze = Math.max(1, sword.maxFreezeFrames || 26);
        const fp = Math.max(0, Math.min(1, 1 - sword.freezeTimer / maxFreeze));
        sword.freezeProgress = fp;
        sword.pullBackPx = 10 * Math.pow(fp, 1.25);
        sword.alpha = 0.84 + 0.16 * fp;
        sword.freezeTimer--;
        if (sword.freezeTimer <= 0) {
          sword.swordPhase = 'white_flash';
          sword.freezeProgress = 1;
          sword.pullBackPx = 10;
          sword.alpha = 1;
          const pb = sword.pullBackPx || 0;
          this.activeVisualEffects.push({
            kind: 'sword_afterimage_grow',
            x: sword.x - Math.cos(sword.angle) * pb,
            y: sword.y - Math.sin(sword.angle) * pb,
            angle: sword.angle,
            scale: sword.scale ?? 1.2,
            timer: 6,
            maxTimer: 6,
          });
          this._playAudio('beam', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_beam.wav', 0.24, 1.48 + (sword.seqIndex || 0) * 0.03);
        }
      } else {
        sword.alpha = 1;
        sword.flashJitter = (sword.whiteTimer % 2 === 0) ? 1.5 : 0.4;
        sword.whiteTimer--;
        if (sword.whiteTimer <= 0) {
          this.activeFallingSwords.splice(i, 1);
          this._detonateTrackingSwordSlash(sword, arena);
        }
      }
    }
  }

  _detonateTrackingSwordSlash(sword, arena) {
    const fallback = this._arenaBounds || { x: 45, y: 240, width: 450, height: 450, shape: 'rect' };
    const bounds = arena
      ? {
        x: arena.x ?? fallback.x,
        y: arena.y ?? fallback.y,
        width: arena.width ?? fallback.width,
        height: arena.height ?? fallback.height,
        shape: arena.shape ?? fallback.shape,
        radius: arena.radius ?? fallback.radius,
      }
      : fallback;
    const pb = sword.pullBackPx || 0;
    this.activeTrackingSlashes.push({
      cx: sword.lineX,
      cy: sword.lineY,
      ox: sword.x - Math.cos(sword.angle) * pb,
      oy: sword.y - Math.sin(sword.angle) * pb,
      angle: sword.angle,
      scale: sword.scale ?? 1.2,
      span: Math.hypot(bounds.width, bounds.height) * 1.15,
      arenaBounds: bounds,
      dashTimer: 2,
      maxDashFrames: 2,
      slashTimer: 8,
      maxSlashFrames: 8,
      damage: sword.damage,
      knockback: sword.knockback,
      seqIndex: sword.seqIndex ?? 0,
      damageDone: false,
    });
  }

  _updateTrackingSlashes(opponent) {
    for (let i = this.activeTrackingSlashes.length - 1; i >= 0; i--) {
      const slash = this.activeTrackingSlashes[i];
      if (slash.dashTimer > 0) {
        slash.dashTimer--;
        if (slash.dashTimer === 0) {
          this._playAudio('cut2', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_cut2.wav', 0.78, 1.28 + (slash.seqIndex % 3) * 0.03);
          if (slash.seqIndex === 0 || slash.seqIndex >= (this._cfg().fallingSwordCount ?? 10) - 1) {
            this._playAudio('fallingSwordBig', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_fallingsword_big.wav', 0.45, 1.04);
          }
          if (!slash.damageDone) {
            slash.damageDone = true;
            this._applyTrackingSlashDamage(slash, opponent);
          }
        }
        continue;
      }

      slash.slashTimer--;
      if (slash.slashTimer <= 0) {
        this.activeTrackingSlashes.splice(i, 1);
      }
    }
  }

  _applyTrackingSlashDamage(slash, opponent) {
    const halfW = this._cfg().trackingSwordSlashHalfWidth ?? 11;
    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);
    const nx = -Math.sin(slash.angle);
    const ny = Math.cos(slash.angle);
    let hitAny = false;

    for (const t of targets) {
      if (!t || t.hp <= 0) continue;
      const perpDist = Math.abs((t.x - slash.cx) * nx + (t.y - slash.cy) * ny);
      const tRad = t.r || t.radius || 25;
      if (perpDist > halfW + tRad * 0.62) continue;

      const dealt = applyDamageToTarget(t, slash.damage, this, {
        source: 'roaring_knight_tracking_sword',
        isProjectile: true,
        hitAngle: slash.angle,
      });
      if (dealt) {
        hitAny = true;
        t.vx = (t.vx || 0) + Math.cos(slash.angle) * slash.knockback;
        t.vy = (t.vy || 0) + Math.sin(slash.angle) * slash.knockback;
      }
    }

    if (hitAny) {
      this._playAudio('hitStrong', 'Assets/Sound Effects/RoaringKnightSFX/snd_metal_hit_strong.wav', 0.65);
      triggerGlobalScreenShake?.(2.0, 4);
    }
  }

  /**
   * Shared projectile update loop for Falling Swords & Blade Corridor waves (anti-duplication).
   */
  _advanceSwordProjectiles(swordList, opponent, arena, sourceTag) {
    if (!swordList || swordList.length === 0) return;
    const minX = (arena?.x ?? 45) - 65;
    const maxX = (arena?.x ?? 45) + (arena?.width ?? 450) + 65;
    const minY = (arena?.y ?? 240) - 65;
    const maxY = (arena?.y ?? 240) + (arena?.height ?? 450) + 65;
    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);

    for (let i = swordList.length - 1; i >= 0; i--) {
      const sword = swordList[i];
      if (sword.telegraphTimer > 0) {
        sword.telegraphTimer--;
        continue;
      }

      if (sword.isCarouselRing && sword.orbitTimer > 0) {
        sword.orbitAngle += sword.angularSpeed * sword.orbitDir;
        sword.orbitRadius = sword.baseRadius + Math.sin(sword.orbitTimer * 0.28) * 24;
        sword.x = sword.cx + Math.cos(sword.orbitAngle) * sword.orbitRadius;
        sword.y = sword.cy + Math.sin(sword.orbitAngle) * sword.orbitRadius;
        sword.angle = sword.orbitAngle + sword.orbitDir * Math.PI * 0.5;
        sword.orbitTimer--;
      } else {
        sword.x += Math.cos(sword.angle) * sword.speed;
        sword.y += Math.sin(sword.angle) * sword.speed;
        sword.life--;
      }

      if (!sword.hasHit) {
        for (const t of targets) {
          if (!t || t.hp <= 0) continue;
          const hitDist = Math.hypot(t.x - sword.x, t.y - sword.y);
          if (hitDist <= (t.r || t.radius || 25) + 18) {
            const dealt = applyDamageToTarget(t, sword.damage, this, {
              source: sourceTag,
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
        swordList.splice(i, 1);
      }
    }
  }

  // ── Skill 2: STARS Phase 1 Start ──

  // ── Skill 2: STARS Phase 1 (B&W Intro Beam -> Purple Cone -> Reverse -> Red Flicker -> 6 Shards) ──
  _updateStarConeDecay() {
    const cone = this.activeStarCone;
    if (!cone) return;
    cone.tick = (cone.tick || 0) + 1;
    if (cone.phase !== 'flash_close' && cone.phase !== 'outro' && this.isStarBurstCasting) {
      return;
    }
    cone.timer--;
    if (cone.timer > 0) return;

    if (cone.phase === 'flash_close') {
      cone.phase = 'outro';
      cone.timer = cone.outroMaxFrames || 16;
      return;
    }
    this.activeStarCone = null;
  }

  _startStarBurstCast(angle, arena, forcedVariant = null) {
    const cfg = this._cfg();
    const mode = cfg.starPhaseMode || 'alternate';
    const variant = forcedVariant || ((mode === 'phase1' || mode === 'phase3')
      ? mode
      : ((this._starCastCount++ % 2 === 0) ? 'phase1' : 'phase3'));
    const introFrames = Math.max(1, cfg.starIntroFrames ?? 12);
    const openFrames = Math.max(1, cfg.starConeOpenFrames ?? 4);
    const coneFrames = Math.max(1, cfg.starBurstCastFrames ?? 40);
    const outroFrames = Math.max(1, cfg.starConeOutroFrames ?? 16);
    const totalCast = introFrames + openFrames + coneFrames;
    const handDist = (this.r || 25) * 0.85;
    const bounds = arena
      ? { x: arena.x, y: arena.y, width: arena.width, height: arena.height }
      : (typeof state !== 'undefined' && state?.arena ? { ...state.arena } : { x: 45, y: 240, width: 450, height: 450 });

    this.isStarBurstCasting = true;
    this.starBurstCastTimer = totalCast;
    this.starBurstCooldownTimer = cfg.starBurstCooldown ?? 420;
    this._armUnifiedSkill1Cooldown('star_burst', 'STAR BURST');
    this._starConeAngle = angle;
    this._starConeSpawned = 0;
    this._starCastVariant = variant;
    this._starPhase3SeqIndex = 0;
    this._starReverseSfxPlayed = false;
    this._starRedLockSfxPlayed = false;
    this.gunAngle = angle;
    this.vx = 0;
    this.vy = 0;

    this.activeStarCone = {
      phase: 'intro',
      originX: this.x + Math.cos(angle) * handDist,
      originY: this.y + Math.sin(angle) * handDist,
      angle,
      halfAngle: 0.46,
      reach: 520,
      timer: introFrames,
      introMaxFrames: introFrames,
      openMaxFrames: openFrames,
      coneMaxFrames: coneFrames,
      closeMaxFrames: 4,
      outroMaxFrames: outroFrames,
      tick: 0,
      arenaBounds: bounds,
    };

    this._playAudio('drawPower', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_drawpower.wav', 0.48, 1.30);
    if (variant === 'phase3') {
      this._playAudio('pulse2', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_pulse2.wav', 0.82);
    } else {
      this._playAudio('pulse', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_pulse.wav', 0.80);
    }
  }

  _updateStarBurstChannel(opponent, arena) {
    if (!this.isStarBurstCasting) return;
    const cfg = this._cfg();
    const introFrames = Math.max(1, cfg.starIntroFrames ?? 12);
    const openFrames = Math.max(1, cfg.starConeOpenFrames ?? 4);
    const coneFrames = Math.max(1, cfg.starBurstCastFrames ?? 40);
    const totalCast = introFrames + openFrames + coneFrames;

    this.starBurstCastTimer--;
    this.gunAngle = this._starConeAngle;

    const elapsed = totalCast - this.starBurstCastTimer;
    const cone = this.activeStarCone;
    if (cone) {
      const handDist = (this.r || 25) * 0.85;
      cone.originX = this.x + Math.cos(this._starConeAngle) * handDist;
      cone.originY = this.y + Math.sin(this._starConeAngle) * handDist;
      if (arena) {
        cone.arenaBounds = { x: arena.x, y: arena.y, width: arena.width, height: arena.height };
      }

      if (elapsed <= introFrames) {
        cone.phase = 'intro';
        cone.timer = Math.max(0, introFrames - elapsed);
      } else if (elapsed <= introFrames + openFrames) {
        cone.phase = 'open_flash';
        cone.timer = Math.max(0, introFrames + openFrames - elapsed);
        if (!cone._openSfxPlayed) {
          cone._openSfxPlayed = true;
          this._playAudio('puff', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_puff.wav', 0.78);
          this._playAudio('beam', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_beam.wav', 0.48, 0.62);
        }
      } else {
        cone.phase = 'cone';
        const coneElapsed = elapsed - (introFrames + openFrames);
        const remainingCone = Math.max(0, coneFrames - coneElapsed);
        cone.timer = remainingCone;

        const totalStars = Math.max(1, cfg.starConeCount ?? 10);
        const targetSpawned = Math.min(totalStars, Math.floor((coneElapsed / coneFrames) * totalStars) + 1);
        while (this._starConeSpawned < targetSpawned) {
          this._spawnConeStarProjectile(this._starConeSpawned, totalStars, remainingCone, cfg);
          this._starConeSpawned++;
        }
      }
    }

    if (this.starBurstCastTimer > 0) return;

    this.isStarBurstCasting = false;
    if (cone) {
      cone.phase = 'flash_close';
      cone.timer = cone.closeMaxFrames || 4;
      this._playAudio('beam', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_beam.wav', 0.38, 1.35);
    }
    if (isSkillEnabled(cfg.enableStarOrbit, true)) {
      this._spawnOrbitingStars(cfg);
    }
  }

  _spawnConeStarProjectile(idx, totalCount, remainingConeFrames, cfg) {
    const halfCone = this.activeStarCone?.halfAngle ?? 0.46;
    const spreadFrac = Math.sin(idx * 2.15) * 0.85;
    const a = this._starConeAngle + spreadFrac * halfCone;
    const baseSpd = cfg.starBurstSpeed ?? 6.2;
    const spd = baseSpd * (0.78 + (idx % 3) * 0.16);
    const handDist = (this.r || 25) * 0.9;
    const forwardVx = Math.cos(a) * spd;
    const forwardVy = Math.sin(a) * spd;

    const reverseFrames = cfg.starReverseFrames ?? 50;
    if (!this._lastStarSpawnSfxTick || (this._vfxTick - this._lastStarSpawnSfxTick) >= 4) {
      this._lastStarSpawnSfxTick = this._vfxTick;
      this._playAudio('pulse', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_pulse.wav', 0.24, 1.55 + (idx % 3) * 0.08);
    }

    this.activeStarBursts.push({
      x: this.x + Math.cos(this._starConeAngle) * handDist,
      y: this.y + Math.sin(this._starConeAngle) * handDist,
      vx: forwardVx,
      vy: forwardVy,
      forwardVx,
      forwardVy,
      rot: idx * 0.35,
      radius: 7,
      maxRadius: 21,
      growRate: 0.28,
      phase: 'forward', // 'forward' -> 'pause' -> 'reverse' -> 'red_lock' -> detonate
      forwardTimer: Math.max(8, remainingConeFrames + 4),
      pauseTimer: 6,
      reverseTimer: reverseFrames,
      maxReverseFrames: reverseFrames,
      redLockTimer: (cfg.starRedLockFrames ?? 22) + (idx * 3),
      maxRedLockFrames: cfg.starRedLockFrames ?? 22,
      damage: cfg.starBurstDamage ?? 16,
      starVariant: this._starCastVariant || 'phase1',
      childCount: (this._starCastVariant === 'phase3') ? (cfg.starPhase3ChildCount ?? 2) : (cfg.starChildCount ?? 6),
      childDamage: cfg.starChildDamage ?? 9,
      childSpeed: cfg.starChildSpeed ?? 3.2,
      childShortSpeed: cfg.starChildShortSpeed ?? 2.0,
      childLongLife: cfg.starChildLongLife ?? 40,
      childShortLife: cfg.starChildShortLife ?? 22,
      hitCooldowns: new Map(),
    });
  }

  _spawnStarBurstSalvo(baseAngle, spreadCount, cfg) {
    const spd = cfg.starBurstSpeed ?? 6.2;
    const spreadStep = 0.28;
    const half = (spreadCount - 1) * 0.5;
    for (let s = 0; s < spreadCount; s++) {
      const a = baseAngle + (s - half) * spreadStep;
      const forwardVx = Math.cos(a) * spd;
      const forwardVy = Math.sin(a) * spd;
      this.activeStarBursts.push({
        x: this.x + Math.cos(a) * ((this.r || 25) + 12),
        y: this.y + Math.sin(a) * ((this.r || 25) + 12),
        vx: forwardVx,
        vy: forwardVy,
        forwardVx,
        forwardVy,
        rot: s * 0.3,
        radius: 9,
        maxRadius: 21,
        growRate: 0.28,
        phase: 'forward',
        forwardTimer: 26,
        pauseTimer: 5,
        reverseTimer: 26,
        maxReverseFrames: 26,
        redLockTimer: 16 + s * 3,
        maxRedLockFrames: 16,
        damage: cfg.starBurstDamage ?? 16,
        childCount: cfg.starChildCount ?? 6,
        childDamage: cfg.starChildDamage ?? 9,
        childSpeed: cfg.starChildSpeed ?? 3.2,
        childShortSpeed: cfg.starChildShortSpeed ?? 2.0,
        childLongLife: cfg.starChildLongLife ?? 40,
        childShortLife: cfg.starChildShortLife ?? 22,
        hitCooldowns: new Map(),
      });
    }
  }

  _spawnOrbitingStars(cfg) {
    const count = cfg.starOrbitCount ?? 4;
    const duration = cfg.starOrbitDurationFrames ?? 54;
    const damage = cfg.starOrbitDamage ?? 10;
    const orbitRadius = (this.r || 25) * 2.05;

    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      this.activeOrbitStars.push({
        orbitAngle: a,
        orbitRadius,
        x: this.x + Math.cos(a) * orbitRadius,
        y: this.y + Math.sin(a) * orbitRadius,
        rot: a,
        radius: 11,
        life: duration,
        damage,
        hitCooldowns: new Map(),
      });
    }
  }

  _updateOrbitingStars(opponent) {
    if (this.activeOrbitStars.length === 0) return;
    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);

    for (let i = this.activeOrbitStars.length - 1; i >= 0; i--) {
      const star = this.activeOrbitStars[i];
      star.life--;
      star.orbitAngle += 0.14;
      star.rot += 0.22;
      star.x = this.x + Math.cos(star.orbitAngle) * star.orbitRadius;
      star.y = this.y + Math.sin(star.orbitAngle) * star.orbitRadius;

      for (const t of targets) {
        if (!t || t.hp <= 0) continue;
        const lastHit = star.hitCooldowns.get(t) || 0;
        if (lastHit > 0) {
          star.hitCooldowns.set(t, lastHit - 1);
          continue;
        }
        if (Math.hypot(t.x - star.x, t.y - star.y) <= (t.r || t.radius || 25) + star.radius) {
          const dealt = applyDamageToTarget(t, star.damage, this, {
            source: 'roaring_knight_orbit_star',
            isProjectile: true,
            hitAngle: star.orbitAngle,
          });
          if (dealt) {
            star.hitCooldowns.set(t, 16);
          }
        }
      }

      if (star.life <= 0) {
        this.activeOrbitStars.splice(i, 1);
      }
    }
  }

  _updateStarBursts(opponent, arena) {
    if (this.activeStarBursts.length === 0) return;
    const minX = (arena?.x ?? 45) + 14;
    const maxX = (arena?.x ?? 45) + (arena?.width ?? 450) - 14;
    const minY = (arena?.y ?? 240) + 14;
    const maxY = (arena?.y ?? 240) + (arena?.height ?? 450) - 14;
    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);

    for (let i = this.activeStarBursts.length - 1; i >= 0; i--) {
      const star = this.activeStarBursts[i];
      const shouldDetonate = this._advanceSingleStarState(star, minX, maxX, minY, maxY);
      this._applyStarContactDamage(star, targets);

      if (shouldDetonate) {
        this._detonateStarBurst(star, targets);
        this.activeStarBursts.splice(i, 1);
      }
    }
  }

  _advanceSingleStarState(star, minX, maxX, minY, maxY) {
    star.radius = Math.min(star.maxRadius || 21, (star.radius || 7) + (star.growRate || 0.28));
    if (star.phase === 'forward') {
      star.x = Math.max(minX, Math.min(maxX, star.x + star.vx));
      star.y = Math.max(minY, Math.min(maxY, star.y + star.vy));
      star.rot += 0.08;
      star.forwardTimer--;
      if (star.forwardTimer <= 0) {
        star.phase = 'pause';
        star.vx *= 0.45;
        star.vy *= 0.45;
      }
      return false;
    }
    if (star.phase === 'pause') {
      star.vx *= 0.68;
      star.vy *= 0.68;
      star.x = Math.max(minX, Math.min(maxX, star.x + star.vx));
      star.y = Math.max(minY, Math.min(maxY, star.y + star.vy));
      star.pauseTimer--;
      if (star.pauseTimer <= 0) {
        star.phase = 'reverse';
        star.vx = -(star.forwardVx || 0) * 0.25;
        star.vy = -(star.forwardVy || 0) * 0.25;
        if (!this._starReverseSfxPlayed) {
          this._starReverseSfxPlayed = true;
          this._playAudio('stretch', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_stretch.wav', 0.62, 1.20, 0.15);
        }
      }
      return false;
    }
    if (star.phase === 'reverse') {
      const maxRev = Math.max(1, star.maxReverseFrames || 50);
      const revP = Math.max(0, Math.min(1, 1 - star.reverseTimer / maxRev));
      const spdFactor = 0.25 + 0.75 * revP;
      star.vx = -(star.forwardVx || 0) * spdFactor;
      star.vy = -(star.forwardVy || 0) * spdFactor;
      star.x = Math.max(minX, Math.min(maxX, star.x + star.vx));
      star.y = Math.max(minY, Math.min(maxY, star.y + star.vy));
      star.rot -= 0.05;
      star.reverseTimer--;
      if (star.reverseTimer <= 0) {
        star.phase = 'red_lock';
        star.vx = 0;
        star.vy = 0;
        if (!this._starRedLockSfxPlayed) {
          this._starRedLockSfxPlayed = true;
          this._playAudio('starExplosion', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_star_explosion_close.wav', 0.70, 0.72, 0.45);
        }
      }
      return false;
    }
    star.redLockTimer--;
    return star.redLockTimer <= 0;
  }

  _applyStarContactDamage(star, targets) {
    if (!star.hitCooldowns) star.hitCooldowns = new Map();
    for (const [t, cd] of star.hitCooldowns.entries()) {
      if (cd <= 1) star.hitCooldowns.delete(t);
      else star.hitCooldowns.set(t, cd - 1);
    }
    for (const t of targets) {
      if (!t || t.hp <= 0 || star.hitCooldowns.has(t)) continue;
      if (Math.hypot(t.x - star.x, t.y - star.y) <= (t.r || t.radius || 25) + (star.radius || 14)) {
        const dealt = applyDamageToTarget(t, star.damage, this, {
          source: 'roaring_knight_star_burst',
          isProjectile: true,
        });
        if (dealt) {
          star.hitCooldowns.set(t, 20);
        }
      }
    }
  }

  _detonateStarBurst(star, targets) {
    if (!this._lastStarSfxTick || (this._vfxTick - this._lastStarSfxTick) >= 4) {
      this._lastStarSfxTick = this._vfxTick;
      this._starBurstCounter = (this._starBurstCounter || 0) + 1;
      const shatterPitch = 0.98 + (this._starBurstCounter % 3) * 0.05;
      this._playAudio('starExplosion', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_star_explosion_close.wav', 0.95, shatterPitch, 1.02);
      if ((this._starBurstCounter % 2) === 0) {
        this._playAudio('cutExplosion', 'Assets/Sound Effects/Attacks/explosion.mp3', 0.26, 1.35);
      }
    }
    triggerGlobalScreenShake?.(3.2, 6);

    this.activeVisualEffects.push({
      kind: 'star_detonate_flash',
      x: star.x,
      y: star.y,
      rot: star.rot || 0,
      radius: star.radius || 21,
      timer: 10,
      maxTimer: 10,
    });

    for (const t of targets) {
      if (!t || t.hp <= 0) continue;
      if (Math.hypot(t.x - star.x, t.y - star.y) <= (star.radius || 21) * 2.2 + (t.r || t.radius || 25)) {
        applyDamageToTarget(t, star.damage, this, {
          source: 'roaring_knight_star_burst',
          isExplosive: true,
        });
      }
    }

    // Phase 3: Explode into 2 hovering shards that turn crimson red and shoot at target one at a time
    if (star.starVariant === 'phase3') {
      const cfg = this._cfg();
      const count3 = star.childCount || cfg.starPhase3ChildCount || 2;
      const baseAngle = (star.rot || 0) - Math.PI / 2;
      const driftBase = cfg.starPhase3DriftFrames ?? 18;
      const stagger = cfg.starPhase3StaggerFrames ?? 4;
      const aimFrames = cfg.starPhase3AimFrames ?? 10;
      const shootSpeed = cfg.starPhase3ShootSpeed ?? 10.8;
      const dmg = cfg.starPhase3ShardDamage ?? 12;

      for (let k = 0; k < count3; k++) {
        const a = baseAngle + (k / count3) * Math.PI * 2;
        const waitFrames = driftBase + (this._starPhase3SeqIndex++ * stagger);
        this.activeStarChildren.push({
          x: star.x,
          y: star.y,
          angle: a,
          vx: Math.cos(a) * 2.8,
          vy: Math.sin(a) * 2.8,
          damage: dmg,
          life: 60,
          isHomingPhase3: true,
          shardPhase: 'drift', // 'drift' -> 'aim' -> 'shoot'
          driftTimer: waitFrames,
          aimTimer: aimFrames,
          shootSpeed,
          isPhase3Crimson: false,
          hasHit: false,
        });
      }
      return;
    }

    // Phase 1: Explode into 6 StarChild shards aligned to star vertices: 3 slow normal + 3 shorter travel & duration
    const count = star.childCount || 6;
    const baseAngle = (star.rot || 0) - Math.PI / 2;
    const longSpd = star.childSpeed ?? 3.2;
    const shortSpd = star.childShortSpeed ?? 2.0;
    const longLife = star.childLongLife ?? 40;
    const shortLife = star.childShortLife ?? 22;
    for (let k = 0; k < count; k++) {
      const a = baseAngle + (k / count) * Math.PI * 2;
      const isShort = (k % 2) === 1;
      const spd = isShort ? shortSpd : longSpd;
      const life = isShort ? shortLife : longLife;
      this.activeStarChildren.push({
        x: star.x,
        y: star.y,
        angle: a,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        minSpeed: isShort ? spd * 0.35 : spd * 0.48,
        decel: 0.08,
        damage: star.childDamage ?? 9,
        life,
        maxLife: life,
        isShortShard: isShort,
        hasHit: false,
      });
    }
  }

  _updateStarChildren(opponent, arena) {
    const arenaX = arena?.x ?? 45;
    const arenaY = arena?.y ?? 240;
    const arenaW = arena?.width ?? 450;
    const arenaH = arena?.height ?? 450;
    const isCircleArena = arena?.shape === 'circle';
    const circleCx = arenaX + arenaW / 2;
    const circleCy = arenaY + arenaH / 2;
    const circleRad = arena?.radius ?? (arenaW / 2);
    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);

    for (let i = this.activeStarChildren.length - 1; i >= 0; i--) {
      const shard = this.activeStarChildren[i];
      if (shard.isHomingPhase3) {
        this._advancePhase3HomingShard(shard, opponent, arenaX + 8, arenaX + arenaW - 8, arenaY + 8, arenaY + arenaH - 8);
      } else {
        if (shard.decel > 0 && shard.minSpeed >= 0) {
          const curSpd = Math.hypot(shard.vx, shard.vy);
          if (curSpd > shard.minSpeed) {
            const nextSpd = Math.max(shard.minSpeed, curSpd - shard.decel);
            const scale = nextSpd / Math.max(0.0001, curSpd);
            shard.vx *= scale;
            shard.vy *= scale;
          }
        }
        shard.x += shard.vx;
        shard.y += shard.vy;
        shard.life--;
      }

      const insideArena = isCircleArena
        ? Math.hypot(shard.x - circleCx, shard.y - circleCy) <= circleRad
        : (shard.x >= arenaX && shard.x <= arenaX + arenaW && shard.y >= arenaY && shard.y <= arenaY + arenaH);

      if (!shard.hasHit && insideArena) {
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

      // Deltarune StarChild shrapnel passes right past the arena walls across outer canvas margins
      const cullPad = shard.isVoidDiamond
        ? 32
        : Math.max(340, Math.round(Math.max(arenaW, arenaH) * 0.8));
      const outOfBounds = isCircleArena
        ? Math.hypot(shard.x - circleCx, shard.y - circleCy) > circleRad + cullPad
        : (
          shard.x < arenaX - cullPad ||
          shard.x > arenaX + arenaW + cullPad ||
          shard.y < arenaY - cullPad ||
          shard.y > arenaY + arenaH + cullPad
        );

      if (shard.hasHit || shard.life <= 0 || outOfBounds) {
        this.activeStarChildren.splice(i, 1);
      }
    }
  }

  _advancePhase3HomingShard(shard, opponent, clampMinX, clampMaxX, clampMinY, clampMaxY) {
    if (shard.shardPhase === 'drift') {
      shard.x = Math.max(clampMinX, Math.min(clampMaxX, shard.x + shard.vx));
      shard.y = Math.max(clampMinY, Math.min(clampMaxY, shard.y + shard.vy));
      shard.vx *= 0.88;
      shard.vy *= 0.88;
      shard.driftTimer--;
      if (shard.driftTimer <= 0) {
        shard.shardPhase = 'aim';
        shard.isPhase3Crimson = true;
        shard.vx = 0;
        shard.vy = 0;
        if (opponent && opponent.hp > 0) {
          shard.angle = Math.atan2(opponent.y - shard.y, opponent.x - shard.x);
        }
        if (!this._lastStarAimSfxTick || (this._vfxTick - this._lastStarAimSfxTick) >= 8) {
          this._lastStarAimSfxTick = this._vfxTick;
          this._playAudio('beam', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_beam.wav', 0.30, 1.55);
        }
      }
      return;
    }
    if (shard.shardPhase === 'aim') {
      if (opponent && opponent.hp > 0) {
        shard.angle = Math.atan2(opponent.y - shard.y, opponent.x - shard.x);
      }
      shard.aimTimer--;
      if (shard.aimTimer <= 0) {
        shard.shardPhase = 'shoot';
        const spd = shard.shootSpeed ?? 10.8;
        shard.vx = Math.cos(shard.angle) * spd;
        shard.vy = Math.sin(shard.angle) * spd;
        shard.life = 55;
        if (!this._lastStarShootSfxTick || (this._vfxTick - this._lastStarShootSfxTick) >= 3) {
          this._lastStarShootSfxTick = this._vfxTick;
          this._playAudio('laser', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_laser.wav', 0.48, 1.18);
        }
      }
      return;
    }
    shard.x += shard.vx;
    shard.y += shard.vy;
    shard.life--;
  }

  // ── Skill 3: Blade Corridor (Sweeping Sword Wall Barrage) ──
  _startBladeCorridorCast() {
    const cfg = this._cfg();
    this.isBladeCorridorCasting = true;
    this.bladeCorridorCastTimer = cfg.bladeCorridorChargeFrames ?? 18;
    this.bladeCorridorCooldownTimer = cfg.bladeCorridorCooldown ?? 390;
    this._armUnifiedSkill1Cooldown('blade_corridor', 'BLADE CORRIDOR');
    this._playAudio('drawPower', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_drawpower.wav', 0.78);
  }

  _updateBladeCorridorChannel(opponent, arena) {
    if (!this.isBladeCorridorCasting) return;
    this.bladeCorridorCastTimer--;
    if (this.bladeCorridorCastTimer > 0) return;

    this.isBladeCorridorCasting = false;
    this._spawnBladeCorridorWaves(opponent, arena);
  }

  _spawnBladeCorridorWaves(opponent, arena) {
    const useCarousel = (this._bladeCorridorCycleCount++ % 2) === 1;
    if (useCarousel) {
      this._spawnBladeCarouselRing(arena);
      return;
    }

    const cfg = this._cfg();
    const ax = arena?.x ?? 45;
    const ay = arena?.y ?? 240;
    const aw = arena?.width ?? 450;
    const ah = arena?.height ?? 450;
    const waves = cfg.bladeCorridorWaveCount ?? 5;
    const speed = cfg.bladeCorridorSpeed ?? 9.2;
    const dmg = cfg.bladeCorridorDamage ?? 11;
    const kb = cfg.bladeCorridorKnockback ?? 5;
    const gapHalf = cfg.bladeCorridorGapHalfWidth ?? 46;
    const horizontal = Math.random() < 0.65;
    const dirSign = Math.random() < 0.5 ? 1 : -1;
    const spacing = 46;

    this._playAudio('fallingSword', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_fallingsword.ogg', 0.80);

    for (let w = 0; w < waves; w++) {
      const phase = (w / Math.max(1, waves - 1)) * Math.PI;
      const delay = 10 + w * 9;

      if (horizontal) {
        const startX = dirSign > 0 ? ax + 12 : ax + aw - 12;
        const angle = dirSign > 0 ? 0 : Math.PI;
        const safeY = ay + ah * (0.28 + 0.44 * (0.5 + 0.5 * Math.sin(phase)));
        for (let py = ay + 24; py <= ay + ah - 24; py += spacing) {
          if (Math.abs(py - safeY) < gapHalf) continue;
          this.activeCorridorBlades.push({
            x: startX,
            y: py,
            angle,
            telegraphTimer: delay,
            telegraphLocked: true,
            telegraphLength: aw * 0.75,
            isCorridorBlade: true,
            life: Math.ceil(aw / speed) + 14,
            speed,
            damage: dmg,
            knockback: kb,
            hasHit: false,
          });
        }
      } else {
        const startY = dirSign > 0 ? ay + 12 : ay + ah - 12;
        const angle = dirSign > 0 ? Math.PI / 2 : -Math.PI / 2;
        const safeX = ax + aw * (0.28 + 0.44 * (0.5 + 0.5 * Math.cos(phase)));
        for (let px = ax + 24; px <= ax + aw - 24; px += spacing) {
          if (Math.abs(px - safeX) < gapHalf) continue;
          this.activeCorridorBlades.push({
            x: px,
            y: startY,
            angle,
            telegraphTimer: delay,
            telegraphLocked: true,
            telegraphLength: ah * 0.75,
            isCorridorBlade: true,
            life: Math.ceil(ah / speed) + 14,
            speed,
            damage: dmg,
            knockback: kb,
            hasHit: false,
          });
        }
      }
    }
  }

  _spawnBladeCarouselRing(arena) {
    const cfg = this._cfg();
    const ax = arena?.x ?? 45;
    const ay = arena?.y ?? 240;
    const aw = arena?.width ?? 450;
    const ah = arena?.height ?? 450;
    const cx = ax + aw * 0.5;
    const cy = ay + ah * 0.5;
    const baseRadius = Math.min(aw, ah) * 0.36;
    const totalSlots = 14;
    const gapIndices = new Set([0, 1, 7]);
    const dir = (this._bladeCorridorCycleCount % 4 === 1) ? 1 : -1;
    const baseAngle = Math.random() * Math.PI * 2;
    const speed = cfg.bladeCorridorSpeed ?? 9.2;
    const dmg = cfg.bladeCorridorDamage ?? 11;
    const kb = cfg.bladeCorridorKnockback ?? 5;

    this._playAudio('fallingSword', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_fallingsword.ogg', 0.80);

    for (let i = 0; i < totalSlots; i++) {
      if (gapIndices.has(i)) continue;
      const orbitAngle = baseAngle + (i / totalSlots) * Math.PI * 2;
      this.activeCorridorBlades.push({
        x: cx + Math.cos(orbitAngle) * baseRadius,
        y: cy + Math.sin(orbitAngle) * baseRadius,
        cx,
        cy,
        orbitAngle,
        orbitRadius: baseRadius,
        baseRadius,
        orbitTimer: 38,
        orbitDir: dir,
        angularSpeed: 0.055,
        angle: orbitAngle + dir * Math.PI * 0.5,
        telegraphTimer: 14,
        telegraphLocked: true,
        telegraphLength: 85,
        isCorridorBlade: true,
        isCarouselRing: true,
        life: Math.ceil(Math.max(aw, ah) / speed) + 18,
        speed,
        damage: dmg,
        knockback: kb,
        hasHit: false,
      });
    }
  }

  // ── Skill 3B: Sword Tunnel (Phase 1 Corridor, Phase 2 Spiral & Phase 2 Finisher) ──
  _startSwordTunnelCast(phase = 1, targetAngle = 0, opponent = null, arena = null) {
    const cfg = this._cfg();
    const castPhase = phase === 2 ? 2 : 1;
    this.isSwordTunnelCasting = true;
    this.swordTunnelCastTimer = Math.max(1, cfg.swordTunnelCastFrames ?? 14);
    this._swordTunnelCastPhase = castPhase;

    const skillId = castPhase === 2 ? 'phase2_sword_tunnel' : 'sword_tunnel';
    const label = castPhase === 2 ? 'PHASE 2 TUNNEL' : 'SWORD TUNNEL';
    this._armUnifiedSkill1Cooldown(skillId, label);

    const aim = Number.isFinite(targetAngle) ? targetAngle : (this.gunAngle || 0);
    this.vx = -Math.cos(aim) * 4.5;
    this.vy = -Math.sin(aim) * 4.5;
    // Closest available proxies on disk for KnightSwordtunnelAnim (snd_leaf_dodge / snd_shinka_ambience not in Assets/)
    this._playAudio('cape', 'Assets/Sound Effects/RoaringKnightSFX/snd_cape_1.wav', 0.65, 1.15);
    this._playAudio('teleport', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_teleport.wav', 0.55, 0.90);
  }

  _startPhase2FinisherCast(opponent = null, arena = null) {
    this._armUnifiedSkill1Cooldown('phase2_finisher', 'PHASE 2 FINISHER');
    this._triggerSwordTunnelFinisher(opponent, arena, 'PHASE 2 FINISHER');
  }

  _createSwordTunnelManager(phase, opponent, arena) {
    const cfg = this._cfg();
    const ax = arena?.x ?? this._arenaBounds?.x ?? 45;
    const ay = arena?.y ?? this._arenaBounds?.y ?? 240;
    const aw = arena?.width ?? this._arenaBounds?.width ?? 450;
    const ah = arena?.height ?? this._arenaBounds?.height ?? 450;
    const cx = ax + aw * 0.5;
    const cy = ay + ah * 0.5;
    const baseAngle = phase === 2
      ? Math.random() * Math.PI * 2
      : (Math.random() < 0.5 ? 0 : Math.PI);
    const maxDur = phase === 2
      ? Math.max(24, cfg.swordTunnelPhase2DurationFrames ?? 128)
      : Math.max(24, cfg.swordTunnelPhase1DurationFrames ?? 108);

    return {
      phase,
      tobyMode: phase === 1 ? (this._swordTunnelCastCount++ % 2) : 2,
      timer: 0,
      maxDuration: maxDur,
      spawnTimer: 0,
      spawnInterval: Math.max(2, cfg.swordTunnelSpawnInterval ?? 4),
      sfxCooldown: 0,
      cx: opponent ? (cx * 0.6 + opponent.x * 0.4) : cx,
      cy: opponent ? (cy * 0.6 + opponent.y * 0.4) : cy,
      arenaX: ax,
      arenaY: ay,
      arenaW: aw,
      arenaH: ah,
      angle: baseAngle,
      gapOffset: 0,
      moveDir: Math.random() < 0.5 ? 'up' : 'down',
      segCounter: 0,
      segLimit: phase === 2 ? 5 : 3,
      wavePhase: 0,
    };
  }

  _updateSwordTunnelChannel(opponent, arena) {
    if (this.isSwordTunnelCasting) {
      this.swordTunnelCastTimer--;
      if (this.swordTunnelCastTimer <= 0) {
        this.isSwordTunnelCasting = false;
        this.activeSwordTunnel = this._createSwordTunnelManager(this._swordTunnelCastPhase || 1, opponent, arena);
      }
      return;
    }

    const tunnel = this.activeSwordTunnel;
    if (!tunnel) return;

    tunnel.timer++;
    tunnel.spawnTimer++;
    if (tunnel.sfxCooldown > 0) tunnel.sfxCooldown--;

    if (tunnel.spawnTimer >= tunnel.spawnInterval) {
      tunnel.spawnTimer = 0;
      this._spawnSwordTunnelPair(tunnel, opponent);
      this._stepSwordTunnelPath(tunnel);
    }

    if (tunnel.timer >= tunnel.maxDuration) {
      const endedPhase = tunnel.phase;
      this.activeSwordTunnel = null;
      const cfg = this._cfg();
      const finisherOn = isSkillEnabled(cfg.enableSwordTunnelFinisher, true);
      if (finisherOn && (endedPhase === 2 || cfg.swordTunnelPhase1Finisher !== false)) {
        const hudLabel = endedPhase === 2 ? 'PHASE 2 FINISHER' : 'TUNNEL FINISHER';
        this._triggerSwordTunnelFinisher(opponent, arena, hudLabel);
      }
    }
  }

  _stepSwordTunnelPath(tunnel) {
    const cfg = this._cfg();
    if (tunnel.phase === 2) {
      const stepDeg = cfg.swordTunnelPhase2RotateStepDeg ?? 5.5;
      tunnel.angle += (stepDeg * Math.PI) / 180;
      tunnel.wavePhase += 0.35;
    }
    const maxShift = Math.min(tunnel.arenaW, tunnel.arenaH) * 0.20;
    const step = tunnel.phase === 2 ? 7 : 10;
    if (tunnel.moveDir === 'up') tunnel.gapOffset -= step;
    else if (tunnel.moveDir === 'down') tunnel.gapOffset += step;

    tunnel.segCounter++;
    if (tunnel.segCounter >= tunnel.segLimit) {
      tunnel.segCounter = 0;
      if (tunnel.moveDir === 'none') {
        tunnel.moveDir = Math.random() < 0.5 ? 'up' : 'down';
        tunnel.segLimit = tunnel.phase === 2 ? (4 + Math.floor(Math.random() * 4)) : (2 + Math.floor(Math.random() * 3));
      } else {
        tunnel.moveDir = 'none';
        tunnel.segLimit = tunnel.phase === 2 ? (2 + Math.floor(Math.random() * 3)) : (1 + Math.floor(Math.random() * 2));
      }
    }
    if (tunnel.moveDir === 'up' && tunnel.gapOffset < -maxShift) tunnel.moveDir = 'down';
    if (tunnel.moveDir === 'down' && tunnel.gapOffset > maxShift) tunnel.moveDir = 'up';
  }

  _spawnSwordTunnelPair(tunnel, opponent) {
    const cfg = this._cfg();
    const dmg = cfg.swordTunnelDamage ?? 10;
    const kb = cfg.swordTunnelKnockback ?? 4.5;
    const gapBase = cfg.swordTunnelGapHalfWidth ?? 46;
    const dirX = Math.cos(tunnel.angle);
    const dirY = Math.sin(tunnel.angle);
    const perpX = Math.cos(tunnel.angle + Math.PI * 0.5);
    const perpY = Math.sin(tunnel.angle + Math.PI * 0.5);

    if (tunnel.sfxCooldown <= 0) {
      // Closest available proxy for sword_tunnel.rs snd_heavy_passing (vol 0.3, pitch 1.2)
      this._playAudio('fallingSword', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_fallingsword.ogg', 0.30, 1.20);
      tunnel.sfxCooldown = 8;
    }

    const spanHalf = Math.min(tunnel.arenaW, tunnel.arenaH) * 0.44;
    const spawnDistBack = tunnel.phase === 2 ? spanHalf * 1.24 : spanHalf * 1.05;
    const centerShift = tunnel.gapOffset;
    const dynGap = tunnel.phase === 2
      ? gapBase + Math.abs(Math.sin(tunnel.wavePhase)) * 10 + 44
      : gapBase + 44;
    const baseSpeed = tunnel.phase === 2
      ? (cfg.swordTunnelPhase2PullSpeed ?? -5.6)
      : (cfg.swordTunnelSpeed ?? 10.5) + (tunnel.tobyMode === 1 ? Math.sin(tunnel.timer / 6) * 2.4 : 0);
    const accel = tunnel.phase === 2 ? (cfg.swordTunnelPhase2Gravity ?? 1.45) : 0;
    const maxSpeed = tunnel.phase === 2 ? (cfg.swordTunnelPhase2MaxSpeed ?? 21.0) : 21.0;
    const smearLen = tunnel.phase === 2 ? 18 : 14;

    const anchorX = (opponent && tunnel.phase === 2
      ? tunnel.cx * 0.65 + opponent.x * 0.35
      : tunnel.cx) - dirX * spawnDistBack;
    const anchorY = (opponent && tunnel.phase === 2
      ? tunnel.cy * 0.65 + opponent.y * 0.35
      : tunnel.cy) - dirY * spawnDistBack;

    for (const side of [-1, 1]) {
      const off = centerShift + side * dynGap;
      const sx = anchorX + perpX * off;
      const sy = anchorY + perpY * off;
      const pointInward = side < 0 ? tunnel.angle + Math.PI * 0.5 : tunnel.angle - Math.PI * 0.5;
      this.activeTunnelSwords.push({
        x: sx,
        y: sy,
        prevX: sx,
        prevY: sy,
        smearX: dirX * smearLen,
        smearY: dirY * smearLen,
        angle: pointInward,
        travelAngle: tunnel.angle,
        speed: baseSpeed,
        accel,
        maxSpeed,
        scaleY: 0.12,
        life: 120,
        damage: dmg,
        knockback: kb,
        hasHit: false,
        isDangerRed: false,
        telegraphAlpha: 0,
        telegraphLength: Math.hypot(tunnel.arenaW, tunnel.arenaH) * 1.15,
        finisherStage: 'idle',
        finisherTimer: 0,
        finisherWhiteMix: 0,
        targetJitterX: (Math.random() - 0.5) * 52,
        targetJitterY: (Math.random() - 0.5) * 52,
      });
    }
  }

  _triggerSwordTunnelFinisher(opponent, arena, hudLabel = 'PHASE 2 FINISHER') {
    const cfg = this._cfg();
    this._activeSkill1Label = hudLabel;

    const ax = arena?.x ?? this._arenaBounds?.x ?? 45;
    const ay = arena?.y ?? this._arenaBounds?.y ?? 240;
    const aw = arena?.width ?? this._arenaBounds?.width ?? 450;
    const ah = arena?.height ?? this._arenaBounds?.height ?? 450;
    const cx = ax + aw * 0.5;
    const cy = ay + ah * 0.5;
    const volleyTracker = new Map();
    const minBlades = Math.max(4, cfg.swordTunnelFinisherMinBlades ?? 12);
    const maxBlades = 22;
    const dmg = cfg.swordTunnelFinisherDamage ?? 15;
    const kb = cfg.swordTunnelFinisherKnockback ?? 8.5;

    // Preserve active tunnel blades in place along the curved corridor (up to maxBlades) matching Phase 2 finisher
    const idleSwords = this.activeTunnelSwords.filter(s => s.finisherStage === 'idle');
    const keepSet = new Set();
    if (idleSwords.length > 0) {
      const targetKeep = Math.min(maxBlades, idleSwords.length);
      for (let i = 0; i < targetKeep; i++) {
        const idx = Math.floor((i * idleSwords.length) / targetKeep);
        keepSet.add(idleSwords[idx]);
      }
    }
    this.activeTunnelSwords = this.activeTunnelSwords.filter(s => s.finisherStage !== 'idle' || keepSet.has(s));

    let finisherCount = 0;
    for (const sword of this.activeTunnelSwords) {
      if (sword.finisherStage === 'idle') {
        this._convertSwordToFinisher(sword, dmg, kb, volleyTracker);
        finisherCount++;
      }
    }

    const needed = Math.max(0, minBlades - finisherCount);
    const rx = aw * 0.43;
    const ry = ah * 0.41;
    const baseAngle = Math.random() * Math.PI * 2;
    for (let i = 0; i < needed; i++) {
      const ringA = baseAngle + (i / needed) * Math.PI * 2;
      const sx = cx + Math.cos(ringA) * rx;
      const sy = cy + Math.sin(ringA) * ry;
      const sword = {
        x: sx,
        y: sy,
        prevX: sx,
        prevY: sy,
        angle: ringA + Math.PI,
        travelAngle: ringA + Math.PI,
        speed: 0,
        accel: 0,
        scaleY: 0.72,
        life: 95,
        damage: dmg,
        knockback: kb,
        hasHit: false,
        isDangerRed: false,
        telegraphAlpha: 0.14,
        telegraphLength: Math.hypot(aw, ah) * 1.2,
        finisherStage: 'aim',
        finisherTimer: 0,
        finisherWhiteMix: 0,
        targetJitterX: (Math.random() - 0.5) * 56,
        targetJitterY: (Math.random() - 0.5) * 56,
        volleyTracker,
      };
      this.activeTunnelSwords.push(sword);
    }
  }

  _convertSwordToFinisher(sword, dmg, kb, volleyTracker) {
    sword.accel = 0;
    sword.speed *= 0.35;
    sword.isDangerRed = false;
    sword.finisherStage = 'aim';
    sword.finisherTimer = 0;
    sword.finisherWhiteMix = 0;
    sword.telegraphAlpha = Math.max(sword.telegraphAlpha || 0, 0.14);
    sword.damage = dmg;
    sword.knockback = kb;
    sword.hasHit = false;
    sword.life = Math.max(sword.life, 95);
    sword.volleyTracker = volleyTracker;
  }

  _updateSwordTunnelEffects(opponent, arena) {
    for (let i = this.activeTunnelAfterimages.length - 1; i >= 0; i--) {
      const fx = this.activeTunnelAfterimages[i];
      fx.life--;
      if (fx.life <= 0) this.activeTunnelAfterimages.splice(i, 1);
    }

    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);
    this._advanceTunnelBeams(targets);

    const ax = arena?.x ?? this._arenaBounds?.x ?? 45;
    const ay = arena?.y ?? this._arenaBounds?.y ?? 240;
    const aw = arena?.width ?? this._arenaBounds?.width ?? 450;
    const ah = arena?.height ?? this._arenaBounds?.height ?? 450;
    const minX = ax - 185;
    const maxX = ax + aw + 185;
    const minY = ay - 185;
    const maxY = ay + ah + 185;
    const primaryTarget = targets.find(t => t && t.hp > 0) || opponent;

    for (let i = this.activeTunnelSwords.length - 1; i >= 0; i--) {
      const sword = this.activeTunnelSwords[i];
      const keep = this._advanceSingleTunnelSword(sword, targets, primaryTarget, minX, maxX, minY, maxY, aw, ah);
      if (!keep) {
        this.activeTunnelSwords.splice(i, 1);
      }
    }
  }

  _advanceSingleTunnelSword(sword, targets, primaryTarget, minX, maxX, minY, maxY, aw, ah) {
    const cfg = this._cfg();
    sword.prevX = sword.x;
    sword.prevY = sword.y;
    sword.life--;

    if (sword.finisherStage === 'idle') {
      sword.speed = Math.min(sword.maxSpeed ?? 21, sword.speed + sword.accel);
      sword.x += Math.cos(sword.travelAngle) * sword.speed;
      sword.y += Math.sin(sword.travelAngle) * sword.speed;
      const targetScale = Math.min(1.25, Math.max(0.15, Math.abs(sword.speed) / 14));
      sword.scaleY += (targetScale - sword.scaleY) * 0.14;
      sword.isDangerRed = Boolean(primaryTarget && Math.hypot(primaryTarget.x - sword.x, primaryTarget.y - sword.y) <= 85);
      this._checkTunnelSwordHit(sword, targets);
      return sword.life > 0 && sword.x >= minX - 40 && sword.x <= maxX + 40 && sword.y >= minY - 40 && sword.y <= maxY + 40;
    }

    const aimFrames = Math.max(4, cfg.swordTunnelFinisherAimFrames ?? 15);
    const recoilFrames = Math.max(2, cfg.swordTunnelFinisherRecoilFrames ?? 5);
    const pauseFrames = Math.max(2, cfg.swordTunnelFinisherPauseFrames ?? 5);
    sword.finisherTimer++;

    if (sword.finisherStage === 'aim') {
      sword.speed *= 0.78;
      sword.x += Math.cos(sword.travelAngle) * sword.speed;
      sword.y += Math.sin(sword.travelAngle) * sword.speed;
      sword.scaleY += (0.72 - sword.scaleY) * 0.22;
      sword.telegraphAlpha = Math.min(0.62, (sword.telegraphAlpha || 0) + 0.055);
      sword.finisherWhiteMix = Math.min(0.25, sword.finisherTimer / (aimFrames * 2));
      if (primaryTarget) {
        const aimAngle = Math.atan2(
          primaryTarget.y + sword.targetJitterY - sword.y,
          primaryTarget.x + sword.targetJitterX - sword.x
        );
        const diff = Math.atan2(Math.sin(aimAngle - sword.angle), Math.cos(aimAngle - sword.angle));
        const maxTurn = Math.max(0.05, 0.26 * (1 - sword.finisherTimer / (aimFrames + 2)));
        sword.angle += Math.max(-maxTurn, Math.min(maxTurn, diff));
      }
      if (sword.finisherTimer >= aimFrames) {
        sword.finisherStage = 'recoil';
        sword.finisherTimer = 0;
        if (!sword.volleyTracker || !sword.volleyTracker._recoilSfxPlayed) {
          if (sword.volleyTracker) sword.volleyTracker._recoilSfxPlayed = true;
          // Deduplicated once per volley (proxy for sword_tunnel.rs snd_knight_jump @ vol 1.0, pitch 0.8)
          this._playAudio('puff', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_puff.wav', 0.72, 0.80);
        }
      }
      return sword.life > 0;
    }

    if (sword.finisherStage === 'recoil') {
      sword.x += Math.cos(sword.angle + Math.PI) * 3.1;
      sword.y += Math.sin(sword.angle + Math.PI) * 3.1;
      if (sword.finisherTimer >= recoilFrames) {
        sword.finisherStage = 'pause';
        sword.finisherTimer = 0;
      }
      return sword.life > 0;
    }

    if (sword.finisherStage === 'pause') {
      sword.finisherWhiteMix = Math.min(0.55, 0.25 + 0.30 * (sword.finisherTimer / pauseFrames));
      if (sword.finisherTimer >= pauseFrames) {
        this._launchFinisherSword(sword, aw, ah);
      }
      return sword.life > 0;
    }

    // stage === 'launch'
    sword.telegraphAlpha = Math.max(0, (sword.telegraphAlpha || 0) - 0.16);
    const dashSpeed = cfg.swordTunnelFinisherDashSpeed ?? 56;
    sword.x += Math.cos(sword.angle) * dashSpeed;
    sword.y += Math.sin(sword.angle) * dashSpeed;
    this._checkTunnelSwordHit(sword, targets);
    return sword.life > 0 && sword.x >= minX - 110 && sword.x <= maxX + 110 && sword.y >= minY - 110 && sword.y <= maxY + 110;
  }

  _launchFinisherSword(sword, aw, ah) {
    const cfg = this._cfg();
    sword.finisherStage = 'launch';
    sword.finisherTimer = 0;
    sword.finisherWhiteMix = 0.25;
    sword.life = Math.min(sword.life, 20);

    this.activeTunnelAfterimages.push({
      x: sword.x,
      y: sword.y,
      angle: sword.angle,
      baseScale: 1.15,
      life: 10,
      maxLife: 10,
    });

    const beamLife = Math.max(4, cfg.swordTunnelFinisherBeamLife ?? 11);
    this.activeTunnelBeamHitboxes.push({
      x: sword.x,
      y: sword.y,
      angle: sword.angle,
      span: Math.hypot(aw, ah) * 1.45,
      halfWidth: cfg.swordTunnelFinisherBeamHalfWidth ?? 10,
      damage: cfg.swordTunnelFinisherDamage ?? 15,
      knockback: cfg.swordTunnelFinisherKnockback ?? 8.5,
      life: beamLife,
      maxLife: beamLife,
      activeFrames: 2,
      hitTargets: new Set(),
      volleyTracker: sword.volleyTracker || null,
    });

    if (!sword.volleyTracker || !sword.volleyTracker._launchSfxPlayed) {
      if (sword.volleyTracker) sword.volleyTracker._launchSfxPlayed = true;
      // Canonical sword_tunnel.rs finisher dash SFX: snd_knight_cut once per volley at pitch 0.8
      this._playAudio('cut1', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_cut.wav', 0.92, 0.80);
    }
  }

  _checkTunnelSwordHit(sword, targets) {
    if (sword.hasHit) return;
    const hitR = 16;
    for (const t of targets) {
      if (!t || t.hp <= 0) continue;
      if (Math.hypot(t.x - sword.x, t.y - sword.y) <= (t.r || t.radius || 25) + hitR) {
        const dealt = this._applyTunnelDamage(t, sword.damage, sword.knockback, sword.angle, sword.volleyTracker);
        if (dealt) {
          sword.hasHit = true;
          this._playAudio('hitStrong', 'Assets/Sound Effects/RoaringKnightSFX/snd_metal_hit_strong.wav', 0.65);
          break;
        }
      }
    }
  }

  _advanceTunnelBeams(targets) {
    for (let i = this.activeTunnelBeamHitboxes.length - 1; i >= 0; i--) {
      const beam = this.activeTunnelBeamHitboxes[i];
      if (beam.activeFrames > 0) {
        beam.activeFrames--;
        const dirX = Math.cos(beam.angle);
        const dirY = Math.sin(beam.angle);
        const halfSpan = (beam.span || 720) * 0.5;
        for (const t of targets) {
          if (!t || t.hp <= 0 || beam.hitTargets.has(t)) continue;
          const relX = t.x - beam.x;
          const relY = t.y - beam.y;
          const proj = relX * dirX + relY * dirY;
          if (Math.abs(proj) > halfSpan) continue;
          const perpDist = Math.abs(-relX * dirY + relY * dirX);
          if (perpDist <= (t.r || t.radius || 25) + (beam.halfWidth || 10)) {
            beam.hitTargets.add(t);
            this._applyTunnelDamage(t, beam.damage, beam.knockback, beam.angle, beam.volleyTracker);
          }
        }
      }
      beam.life--;
      if (beam.life <= 0) {
        this.activeTunnelBeamHitboxes.splice(i, 1);
      }
    }
  }

  _applyTunnelDamage(target, baseDamage, knockback, hitAngle, volleyTracker) {
    let finalDmg = baseDamage;
    if (volleyTracker) {
      const count = volleyTracker.get(target) || 0;
      if (count >= 3) return false;
      finalDmg = count === 0 ? baseDamage : Math.max(2, Math.round(baseDamage * 0.25));
      volleyTracker.set(target, count + 1);
    }
    const dealt = applyDamageToTarget(target, finalDmg, this, {
      source: 'roaring_knight_sword_tunnel',
      isProjectile: true,
      hitAngle,
    });
    if (dealt && target.hp > 0) {
      target.vx = (target.vx || 0) + Math.cos(hitAngle) * knockback;
      target.vy = (target.vy || 0) + Math.sin(hitAngle) * knockback;
    }
    return dealt;
  }

  // ── Skill 4: Snowflake Matrix (+ / X Crimson Lock-In & Piercing Beam Matrix) ──
  _buildSnowflakeBeams(cx, cy, arena) {
    const aw = arena?.width ?? 450;
    const ah = arena?.height ?? 450;
    const span = Math.hypot(aw, ah) * 1.1;
    const angles = [0, Math.PI / 4, Math.PI / 2, (Math.PI * 3) / 4];
    return angles.map(a => ({
      angle: a,
      x1: cx - Math.cos(a) * span,
      y1: cy - Math.sin(a) * span,
      x2: cx + Math.cos(a) * span,
      y2: cy + Math.sin(a) * span,
    }));
  }

  _pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const ldx = x2 - x1;
    const ldy = y2 - y1;
    const lenSq = ldx * ldx + ldy * ldy;
    if (lenSq <= 0.0001) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * ldx + (py - y1) * ldy) / lenSq));
    return Math.hypot(px - (x1 + t * ldx), py - (y1 + t * ldy));
  }

  _startSnowflakeMatrixCast(opponent, arena) {
    const cfg = this._cfg();
    const chargeFrames = cfg.snowflakeMatrixChargeFrames ?? 18;
    const cx = opponent ? opponent.x : this.x;
    const cy = opponent ? opponent.y : this.y;

    this.isSnowflakeMatrixCasting = true;
    this.snowflakeMatrixPhase = 'charge';
    this.snowflakeMatrixTimer = chargeFrames;
    this.snowflakeMatrixCooldownTimer = cfg.snowflakeMatrixCooldown ?? 480;
    this._armUnifiedSkill1Cooldown('snowflake_matrix', 'SNOWFLAKE SLASH');
    this.vx = 0;
    this.vy = 0;

    const bounds = arena
      ? { x: arena.x, y: arena.y, width: arena.width, height: arena.height }
      : { x: 45, y: 240, width: 450, height: 450 };

    this.activeSnowflakeMatrix = {
      phase: 'charge',
      cx,
      cy,
      progress: 0,
      halfWidth: cfg.snowflakeMatrixHalfWidth ?? 16,
      timer: chargeFrames,
      maxTimer: chargeFrames,
      arenaBounds: bounds,
      beams: this._buildSnowflakeBeams(cx, cy, bounds),
    };
    this._playAudio('rotatingSlashLine', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_rotatingslash_line.wav', 0.80);
  }

  _updateSnowflakeMatrix(opponent, arena) {
    if (!this.isSnowflakeMatrixCasting || !this.activeSnowflakeMatrix) return;

    const cfg = this._cfg();
    this.snowflakeMatrixTimer--;

    if (this.snowflakeMatrixPhase === 'charge') {
      const chargeMax = cfg.snowflakeMatrixChargeFrames ?? 18;
      if (opponent && opponent.hp > 0) {
        this.activeSnowflakeMatrix.cx = opponent.x;
        this.activeSnowflakeMatrix.cy = opponent.y;
        this.activeSnowflakeMatrix.beams = this._buildSnowflakeBeams(
          opponent.x,
          opponent.y,
          this.activeSnowflakeMatrix.arenaBounds
        );
      }
      this.activeSnowflakeMatrix.progress = 1 - Math.max(0, this.snowflakeMatrixTimer) / Math.max(1, chargeMax);
      if (this.snowflakeMatrixTimer <= 0) {
        this._commitSnowflakeMatrixLockIn(cfg);
      }
      return;
    }

    if (this.snowflakeMatrixPhase === 'lock') {
      // Aim stays strictly frozen at committed coordinates while crimson reticle holds
      this.activeSnowflakeMatrix.timer = this.snowflakeMatrixTimer;
      if (this.snowflakeMatrixTimer <= 0) {
        this._dischargeSnowflakeMatrix(opponent, cfg);
      }
      return;
    }

    if (this.snowflakeMatrixPhase === 'active') {
      const m = this.activeSnowflakeMatrix;
      m.timer = this.snowflakeMatrixTimer;
      const rotSpeed = cfg.snowflakeMatrixRotSpeed ?? 0.045;
      const aw = m.arenaBounds?.width ?? 450;
      const ah = m.arenaBounds?.height ?? 450;
      const span = Math.hypot(aw, ah) * 1.1;

      for (const beam of m.beams) {
        beam.angle += rotSpeed;
        beam.x1 = m.cx - Math.cos(beam.angle) * span;
        beam.y1 = m.cy - Math.sin(beam.angle) * span;
        beam.x2 = m.cx + Math.cos(beam.angle) * span;
        beam.y2 = m.cy + Math.sin(beam.angle) * span;
      }

      this._tickSnowflakeHitCooldowns(m);
      this._applySnowflakeMatrixSweepHits(opponent, cfg);

      if (this.snowflakeMatrixTimer <= 0) {
        this.isSnowflakeMatrixCasting = false;
        this.snowflakeMatrixPhase = 'idle';
        this.activeSnowflakeMatrix = null;
      }
    }
  }

  _tickSnowflakeHitCooldowns(matrix) {
    if (!matrix?.hitCooldowns) return;
    for (const [target, cd] of matrix.hitCooldowns.entries()) {
      if (cd <= 1) {
        matrix.hitCooldowns.delete(target);
      } else {
        matrix.hitCooldowns.set(target, cd - 1);
      }
    }
  }

  _commitSnowflakeMatrixLockIn(cfg) {
    const lockFrames = Math.max(1, cfg.snowflakeMatrixLockInFrames ?? 12);
    this.snowflakeMatrixPhase = 'lock';
    this.snowflakeMatrixTimer = lockFrames;
    this.activeSnowflakeMatrix.phase = 'lock';
    this.activeSnowflakeMatrix.timer = lockFrames;
    this.activeSnowflakeMatrix.maxTimer = lockFrames;
    this._playAudio('pulse', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_pulse.wav', 0.72);
  }

  _dischargeSnowflakeMatrix(opponent, cfg) {
    const activeFrames = Math.max(1, cfg.snowflakeMatrixActiveFrames ?? 22);
    this.snowflakeMatrixPhase = 'active';
    this.snowflakeMatrixTimer = activeFrames;
    this.activeSnowflakeMatrix.phase = 'active';
    this.activeSnowflakeMatrix.timer = activeFrames;
    this.activeSnowflakeMatrix.maxTimer = activeFrames;
    this.activeSnowflakeMatrix.hitCooldowns = new Map();

    this._playAudio('beam', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_beam.wav', 0.85);
    this._playAudio('laser', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_laser.wav', 0.80);
    triggerGlobalScreenShake?.(6.0, 10);

    this._applySnowflakeMatrixSweepHits(opponent, cfg);
  }

  /**
   * Rule 17 compliant recurring rotating beam cuts: cooldown-gated, zero applyHitStun.
   */
  _applySnowflakeMatrixSweepHits(opponent, cfg) {
    const m = this.activeSnowflakeMatrix;
    if (!m) return;
    const dmg = cfg.snowflakeMatrixDamage ?? 24;
    const kb = cfg.snowflakeMatrixKnockback ?? 11;
    const halfW = m.halfWidth || 16;
    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);

    for (const t of targets) {
      if (!t || t.hp <= 0 || m.hitCooldowns?.has(t)) continue;
      const tRad = t.r || t.radius || 25;
      const hitBeam = m.beams.find(beam =>
        this._pointToSegmentDist(t.x, t.y, beam.x1, beam.y1, beam.x2, beam.y2) <= halfW + tRad
      );
      if (!hitBeam) continue;

      const dealt = applyDamageToTarget(t, dmg, this, {
        source: 'roaring_knight_snowflake_matrix',
        isBeam: true,
        hitAngle: hitBeam.angle,
      });
      if (dealt) {
        m.hitCooldowns?.set(t, 16);
        const pushA = Math.atan2(t.y - m.cy, t.x - m.cx);
        t.vx = (t.vx || 0) + Math.cos(pushA) * kb;
        t.vy = (t.vy || 0) + Math.sin(pushA) * kb;
      }
    }
  }

  _triggerDesperationRoaring(opponent, arena) {
    const cfg = this._cfg();
    this.hasTriggeredDesperationRoar = true;
    this._playAudio('roar', 'Assets/Sound Effects/RoaringKnightSFX/snd_knightroar.wav', 1.0);
    this._playAudio('darkFountain', 'Assets/Sound Effects/RoaringKnightSFX/snd_ftext_dark_fountain.wav', 0.90);
    triggerGlobalScreenShake?.(9.5, 16);
    spawnFloatingText?.(this.x, this.y - (this.r || 25) - 20, 'FINAL ROARING!', '#FF2E4D');

    const baseAngle = opponent
      ? Math.atan2(opponent.y - this.y, opponent.x - this.x)
      : (this.gunAngle || 0);
    this._spawnStarBurstSalvo(baseAngle, cfg.starBurstSpreadCount ?? 3, cfg);

    if (isSkillEnabled(cfg.enableGapingMawRift, true)) {
      const cx = opponent ? opponent.x : ((arena?.x ?? 45) + (arena?.width ?? 450) * 0.5);
      const cy = opponent ? opponent.y : ((arena?.y ?? 240) + (arena?.height ?? 450) * 0.5);
      this._spawnGapingMawRift(cx, cy, baseAngle, arena);
      this._queueFollowupRiftStrikes(baseAngle + 0.52, opponent, arena);
    }
  }

  // ── Ultimate Upgrade: Sequential Gaping Maw Arena-Split Void Rifts ──
  _spawnGapingMawRift(cx, cy, angle, arena) {
    const cfg = this._cfg();
    if (!isSkillEnabled(cfg.enableGapingMawRift, true)) return;

    const bounds = arena
      ? { x: arena.x, y: arena.y, width: arena.width, height: arena.height }
      : { x: 45, y: 240, width: 450, height: 450 };
    const anchorX = cx ?? (bounds.x + bounds.width * 0.5);
    const anchorY = cy ?? (bounds.y + bounds.height * 0.5);
    const duration = cfg.voidRiftDurationFrames ?? 78;

    this.activeVoidRifts.push({
      cx: anchorX,
      cy: anchorY,
      angle,
      span: Math.hypot(bounds.width, bounds.height) * 0.95,
      halfWidth: cfg.voidRiftHalfWidth ?? 22,
      timer: duration,
      maxTimer: duration,
      flashTimer: 8,
      maxFlashTimer: 8,
      flowSign: Math.random() < 0.5 ? 1 : -1,
      shardTimer: 9,
      shardInterval: cfg.voidRiftShardInterval ?? 7,
      shardDamage: cfg.voidRiftShardDamage ?? 8,
      shardSpeed: cfg.voidRiftShardSpeed ?? 10.5,
      arenaBounds: bounds,
    });
  }

  _queueFollowupRiftStrikes(baseAngle, opponent, arena) {
    const cfg = this._cfg();
    if (!isSkillEnabled(cfg.enableGapingMawRift, true)) return;
    const slashCount = cfg.swoonSlashCount ?? 3;
    if (slashCount <= 1) return;

    const bounds = arena
      ? { x: arena.x, y: arena.y, width: arena.width, height: arena.height }
      : { x: 45, y: 240, width: 450, height: 450 };
    const delayStep = cfg.swoonFollowupDelayFrames ?? 34;
    const telegraphFrames = cfg.swoonFollowupTelegraphFrames ?? 16;
    const angleOffsets = [1.02, -0.92, 1.52];

    for (let k = 0; k < slashCount - 1; k++) {
      const a = baseAngle + angleOffsets[k % angleOffsets.length];
      this.activeRiftStrikes.push({
        cx: opponent ? opponent.x : bounds.x + bounds.width * 0.5,
        cy: opponent ? opponent.y : bounds.y + bounds.height * 0.5,
        angle: a,
        span: Math.hypot(bounds.width, bounds.height) * 0.95,
        halfWidth: cfg.voidRiftHalfWidth ?? 22,
        delayTimer: Math.max(4, delayStep * (k + 1) - telegraphFrames),
        telegraphTimer: telegraphFrames,
        lockFrames: Math.min(7, Math.max(4, Math.floor(telegraphFrames * 0.45))),
        isLocked: false,
        damage: cfg.swoonFollowupDamage ?? 24,
        arenaBounds: bounds,
      });
    }
  }

  _updateRiftStrikes(opponent, arena) {
    if (this.activeRiftStrikes.length === 0) return;

    for (let i = this.activeRiftStrikes.length - 1; i >= 0; i--) {
      const strike = this.activeRiftStrikes[i];
      if (strike.delayTimer > 0) {
        strike.delayTimer--;
        continue;
      }

      strike.telegraphTimer--;
      if (!strike.isLocked && strike.telegraphTimer > strike.lockFrames && opponent && opponent.hp > 0) {
        strike.cx = opponent.x;
        strike.cy = opponent.y;
      } else if (!strike.isLocked && strike.telegraphTimer <= strike.lockFrames) {
        strike.isLocked = true;
        this._playAudio('rotatingSlashLine', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_rotatingslash_line.wav', 0.68);
      }

      if (strike.telegraphTimer <= 0) {
        this._detonateRiftStrike(strike, opponent, arena);
        this.activeRiftStrikes.splice(i, 1);
      }
    }
  }

  _detonateRiftStrike(strike, opponent, arena) {
    const cosA = Math.cos(strike.angle);
    const sinA = Math.sin(strike.angle);
    const x1 = strike.cx - cosA * strike.span;
    const y1 = strike.cy - sinA * strike.span;
    const x2 = strike.cx + cosA * strike.span;
    const y2 = strike.cy + sinA * strike.span;

    this._playAudio('cut1', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_cut.wav', 0.90);
    this._playAudio('boxBreak', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_boxbreak.wav', 0.80);
    triggerGlobalScreenShake?.(5.0, 7);

    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);
    for (const t of targets) {
      if (!t || t.hp <= 0) continue;
      const tRad = t.r || t.radius || 25;
      if (this._pointToSegmentDist(t.x, t.y, x1, y1, x2, y2) <= (strike.halfWidth || 22) + tRad) {
        applyDamageToTarget(t, strike.damage, this, {
          source: 'roaring_knight_gaping_maw',
          isUltimate: true,
          hitAngle: strike.angle,
        });
      }
    }

    this._spawnGapingMawRift(strike.cx, strike.cy, strike.angle, arena || strike.arenaBounds);
  }

  _updateVoidRifts(arena) {
    if (this.activeVoidRifts.length === 0) return;

    for (let i = this.activeVoidRifts.length - 1; i >= 0; i--) {
      const rift = this.activeVoidRifts[i];
      if (rift.flashTimer > 0) rift.flashTimer--;
      rift.timer--;
      rift.shardTimer--;

      if (rift.flashTimer <= 0 && rift.shardTimer <= 0 && rift.timer > 8) {
        rift.shardTimer = rift.shardInterval;
        const bounds = rift.arenaBounds || arena || { x: 45, y: 240, width: 450, height: 450 };
        const entryDist = Math.max(bounds.width, bounds.height) * 0.56 * rift.flowSign;
        const travelAngle = rift.flowSign > 0 ? rift.angle + Math.PI : rift.angle;
        const perpAngle = rift.angle + Math.PI / 2;

        // Spawn a tight pair of elongated white diamonds rushing along inside the black void chasm
        for (let p = 0; p < 2; p++) {
          const lateral = (Math.random() - 0.5) * (rift.halfWidth || 22) * 1.15;
          const stagger = p * 18 * rift.flowSign;
          const sx = rift.cx + Math.cos(rift.angle) * (entryDist - stagger) + Math.cos(perpAngle) * lateral;
          const sy = rift.cy + Math.sin(rift.angle) * (entryDist - stagger) + Math.sin(perpAngle) * lateral;
          const spd = rift.shardSpeed * (0.9 + Math.random() * 0.25);

          this.activeStarChildren.push({
            x: sx,
            y: sy,
            angle: travelAngle,
            vx: Math.cos(travelAngle) * spd,
            vy: Math.sin(travelAngle) * spd,
            damage: rift.shardDamage,
            life: 52,
            hasHit: false,
            isVoidDiamond: true,
          });
        }
      }

      if (rift.timer <= 0) {
        this.activeVoidRifts.splice(i, 1);
      }
    }
  }

  // ── Ultimate: Rotating Slash — Phase 3 Finisher (Rule 1.4 Aim Lock) ──
  _resolveUltArenaBounds(arena) {
    const raw = arena || this._arenaBounds || (typeof state !== 'undefined' ? state.arena : null);
    if (!raw) {
      return { x: 45, y: 240, width: 450, height: 450, shape: 'rect' };
    }
    const x = Number.isFinite(raw.x) ? raw.x : (Number.isFinite(raw.left) ? raw.left : 0);
    const y = Number.isFinite(raw.y) ? raw.y : (Number.isFinite(raw.top) ? raw.top : 0);
    const width = Number.isFinite(raw.width) ? raw.width : (Number.isFinite(raw.right) ? raw.right - x : 450);
    const height = Number.isFinite(raw.height) ? raw.height : (Number.isFinite(raw.bottom) ? raw.bottom - y : 450);
    return { x, y, width, height, shape: raw.shape || 'rect', radius: raw.radius };
  }

  _startRoaringSwoon(angle, opponent = null, arena = null) {
    const cfg = this._cfg();
    const bounds = this._resolveUltArenaBounds(arena);
    const windupFrames = cfg.rotatingSlashWindupFrames ?? 18;
    const dashFrames = Math.max(1, cfg.swoonDashFrames ?? 12);
    const dashSpeed = cfg.swoonDashSpeed ?? 16.5;
    const dashAngle = (opponent && opponent.hp > 0)
      ? Math.atan2(opponent.y - this.y, opponent.x - this.x)
      : angle;
    const frontOffset = (this.r || 25) * 2.4;
    const rawCx = this.x + Math.cos(dashAngle) * frontOffset;
    const rawCy = this.y + Math.sin(dashAngle) * frontOffset;
    const boardCx = Math.max(bounds.x + 28, Math.min(bounds.x + bounds.width - 28, rawCx));
    const boardCy = Math.max(bounds.y + 28, Math.min(bounds.y + bounds.height - 28, rawCy));

    this.isSwoonChanneling = true;
    this.swoonChannelTimer = dashFrames + windupFrames;
    this.swoonActiveTimer = 0;
    this.swoonBasicHits = 0;
    this.swoonCooldownTimer = cfg.swoonCooldown ?? 0;
    this.skillCastAngle = dashAngle;
    this.gunAngle = dashAngle;
    this.vx = Math.cos(dashAngle) * dashSpeed;
    this.vy = Math.sin(dashAngle) * dashSpeed;

    this._rotatingSlashSeq = {
      stage: 'ult_dash',
      isFrontBarrage: true,
      dashTimer: dashFrames,
      maxDashFrames: dashFrames,
      dashSpeed,
      dashStopMargin: cfg.swoonDashStopMargin ?? 28,
      dashAngle,
      stunFrames: cfg.swoonStunFrames ?? 60,
      stunReach: cfg.swoonStunReach ?? 95,
      castAngle: dashAngle,
      boardCx,
      boardCy,
      centerStartX: this.x,
      centerStartY: this.y,
      centered: false,
      showFrontTrail: false,
      windupTimer: windupFrames,
      maxWindupFrames: windupFrames,
      telegraphAngles: [dashAngle - 0.74, dashAngle + 0.70, dashAngle],
      telegraphHalfLength: cfg.rotatingSlashHalfLength ?? 145,
      finaleShot: 0,
      finaleTotal: cfg.rotatingSlashFinaleCount ?? 10,
      finaleCooldown: 0,
      outroTimer: 0,
      maxOutroFrames: cfg.rotatingSlashOutroFrames ?? 14,
      span: Math.max(bounds.width, bounds.height) * 1.45,
      arenaBounds: { ...bounds },
    };

    // Pause all active enemy targets immediately upon Ultimate activation until the Ultimate finishes
    this._pauseEnemiesForUlt(opponent);

    // High-speed lunge SFX before stunning and unleashing the front slash barrage
    this._playAudio('puff', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_puff.wav', 0.80, 1.0);
    this._playAudio('teleport', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_teleport.wav', 0.85, 0.55);
    this._playAudio('cape', 'Assets/Sound Effects/RoaringKnightSFX/snd_cape_1.wav', 0.70, 1.05);
    spawnFloatingText?.(this.x, this.y - (this.r || 25) - 18, 'VOID BARRAGE!', '#FFFFFF');
  }

  /**
   * Freezes all active enemy targets cleanly for the duration of Roaring Knight's Ultimate.
   */
  _pauseEnemiesForUlt(opponent = null) {
    if (!this._ultPausedTargets) this._ultPausedTargets = new Map();
    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);
    for (const t of targets) {
      if (!t || t === this || t.hp <= 0) continue;
      if (!this._ultPausedTargets.has(t)) {
        const rawPrev = Math.max(0, t.timeStopTimer || 0);
        const basicPauseMax = Math.max(1, this._cfg().basicSlashPauseFrames ?? 20);
        const prevTimeStop = (t._rkPauseOwned && rawPrev <= basicPauseMax) ? 0 : rawPrev;
        delete t._rkPauseOwned;
        this._ultPausedTargets.set(t, {
          hadOverlaySuppressed: prevTimeStop > 0 && Boolean(t.suppressFreezeOverlay),
          prevTimeStop,
        });
      }
      if (typeof t.applyTimeStop === 'function') {
        t.applyTimeStop(10);
      }
      t.timeStopTimer = Math.max(t.timeStopTimer || 0, 10);
      t.suppressFreezeOverlay = true;
      t._suppressFreezeTimer = true;
      t.vx = 0;
      t.vy = 0;
      t.knockbackVx = 0;
      t.knockbackVy = 0;
    }
  }

  /**
   * Releases all enemy targets paused by Roaring Knight's Ultimate when it ends or is interrupted.
   */
  _releaseUltPausedTargets() {
    if (!this._ultPausedTargets || this._ultPausedTargets.size === 0) return;
    for (const [t, meta] of this._ultPausedTargets.entries()) {
      if (!t) continue;
      const preserved = meta && meta.prevTimeStop > 0 ? meta.prevTimeStop : 0;
      t.timeStopTimer = preserved;
      t.hitStunTimer = 0;
      t.suppressFreezeOverlay = Boolean(meta?.hadOverlaySuppressed);
      delete t._suppressFreezeTimer;
      if (preserved <= 0) {
        delete t._timeStopFrozenAngle;
        delete t._timeStopFrozenGunAngle;
        delete t._timeStopOriginalDuration;
        delete t._timeStopStartTime;
      }
      if (t.hp > 0 && t.timeStopTimer <= 0 && t.vx === 0 && t.vy === 0 && typeof t.resumeMovement === 'function') {
        t.resumeMovement();
      }
    }
    this._ultPausedTargets.clear();
  }

  _updateRotatingSlashesDecay() {
    for (let i = this.activeRotatingSlashes.length - 1; i >= 0; i--) {
      this.activeRotatingSlashes[i].timer--;
      if (this.activeRotatingSlashes[i].timer <= 0) {
        this.activeRotatingSlashes.splice(i, 1);
      }
    }
  }

  _updateRotatingShards() {
    for (let i = this.activeRotatingShards.length - 1; i >= 0; i--) {
      const shard = this.activeRotatingShards[i];
      shard.x += shard.vx || 0;
      shard.y += shard.vy || 0;
      shard.timer--;
      if (shard.timer <= 0) {
        this.activeRotatingShards.splice(i, 1);
      }
    }
  }

  _spawnRotatingSlashShards(cx, cy, cutAngle, bounds, shotIdx, halfLength = null) {
    // 1. Center black-inside-red diamond flash mark
    const centerLen = 78 + (shotIdx % 3) * 14;
    this.activeRotatingShards.push({
      kind: 'center_mark',
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      angle: cutAngle,
      len: centerLen,
      halfW: 15 + (shotIdx % 2) * 3,
      timer: 8,
      maxTimer: 8,
    });

    // 2. Kinetic debris needles bursting either at finite slash tips or at arena wall exits
    const bRight = bounds.x + bounds.width;
    const bBottom = bounds.y + bounds.height;
    const isFinite = Number.isFinite(halfLength);
    for (const sideOffset of [0, Math.PI]) {
      const baseAng = cutAngle + sideOffset;
      let wx = cx;
      let wy = cy;
      if (isFinite) {
        wx = cx + Math.cos(baseAng) * halfLength * 0.82;
        wy = cy + Math.sin(baseAng) * halfLength * 0.82;
      } else {
        const stepX = Math.cos(baseAng) * 8;
        const stepY = Math.sin(baseAng) * 8;
        for (let s = 0; s < 55; s++) {
          wx += stepX;
          wy += stepY;
          if (wx < bounds.x || wx > bRight || wy < bounds.y || wy > bBottom) break;
        }
      }

      const shardCount = isFinite ? 2 : 4;
      for (let k = 0; k < shardCount; k++) {
        const spread = (((shotIdx + 1) * (k + 3) * 37) % 100 / 100 - 0.5) * 0.38;
        const shardAng = baseAng + spread;
        const startOffset = isFinite ? (-6 + k * 8) : (-14 + ((shotIdx * 17 + k * 23) % 44));
        const speed = 3.2 + ((shotIdx + k) % 4) * 0.55;
        const life = 18 + ((shotIdx * 5 + k * 7) % 10);
        this.activeRotatingShards.push({
          kind: 'wall_shard',
          x: wx + Math.cos(shardAng) * startOffset,
          y: wy + Math.sin(shardAng) * startOffset,
          vx: Math.cos(shardAng) * speed,
          vy: Math.sin(shardAng) * speed,
          angle: shardAng,
          len: 14 + (k % 2) * 4,
          halfW: 3.2,
          timer: life,
          maxTimer: life,
        });
      }
    }
  }

  _updateSwoonChannel(opponent, arena) {
    if (this.swoonActiveTimer > 0) this.swoonActiveTimer--;
    const seq = this._rotatingSlashSeq;
    if (!this.isSwoonChanneling || !seq) return;

    this._pauseEnemiesForUlt(opponent);

    const bounds = this._resolveUltArenaBounds(arena);
    seq.arenaBounds = { ...bounds };
    seq.span = Math.max(bounds.width, bounds.height) * 1.45;

    if (seq.stage === 'ult_dash') {
      this._stepUltDashStage(seq, opponent, bounds);
      return;
    }

    seq.boardCx = Math.max(bounds.x + 28, Math.min(bounds.x + bounds.width - 28, seq.boardCx));
    seq.boardCy = Math.max(bounds.y + 28, Math.min(bounds.y + bounds.height - 28, seq.boardCy));
    this.gunAngle = this.skillCastAngle;
    this.vx = 0;
    this.vy = 0;

    if (seq.stage === 'ult_swing') {
      this._stepUltSwingStage(seq);
      return;
    }

    this._advanceFinaleRotatingSlash(seq, opponent, bounds);
  }

  _stepUltDashStage(seq, opponent, bounds) {
    seq.dashTimer--;
    if (opponent && opponent.hp > 0) {
      const aim = Math.atan2(opponent.y - this.y, opponent.x - this.x);
      seq.dashAngle = aim;
      this.skillCastAngle = aim;
      this.gunAngle = aim;
    }
    this.vx = Math.cos(seq.dashAngle) * seq.dashSpeed;
    this.vy = Math.sin(seq.dashAngle) * seq.dashSpeed;

    const tRad = opponent ? (opponent.r || opponent.radius || 25) : 25;
    const curDist = (opponent && opponent.hp > 0)
      ? Math.hypot(opponent.x - this.x, opponent.y - this.y)
      : 999;
    const stopDist = (this.r || 25) + tRad + (seq.dashStopMargin ?? 28);
    if (seq.dashTimer > 0 && curDist > stopDist) return;

    // Dash arrived at target: stop velocity, apply stun impact, perform Black Knife attack animation first
    this.vx = 0;
    this.vy = 0;
    const finalAngle = (opponent && opponent.hp > 0)
      ? Math.atan2(opponent.y - this.y, opponent.x - this.x)
      : seq.dashAngle;
    this.skillCastAngle = finalAngle;
    this.gunAngle = finalAngle;
    this.meleeCastAngle = finalAngle;
    seq.castAngle = finalAngle;
    seq.centerStartX = this.x;
    seq.centerStartY = this.y;
    seq.centered = true;

    const frontOffset = (this.r || 25) * 2.4;
    const rawCx = this.x + Math.cos(finalAngle) * frontOffset;
    const rawCy = this.y + Math.sin(finalAngle) * frontOffset;
    seq.boardCx = Math.max(bounds.x + 28, Math.min(bounds.x + bounds.width - 28, rawCx));
    seq.boardCy = Math.max(bounds.y + 28, Math.min(bounds.y + bounds.height - 28, rawCy));
    seq.telegraphAngles = [finalAngle - 0.74, finalAngle + 0.70, finalAngle];

    this._applyUltDashImpactStun(seq, opponent);

    const cfg = this._cfg();
    const windupFrames = Math.max(8, cfg.knifeWindupFrames ?? 8);
    seq.swingPhase = 1;
    seq.swingTimer = windupFrames;
    seq.swingMaxTimer = windupFrames;
    seq.holdFrames = Math.max(2, cfg.knifeHoldFrames ?? 2);
    seq.strikeFrames = Math.max(5, cfg.knifeStrikeFrames ?? 7);
    seq.swingRecoverFrames = Math.max(4, cfg.knifeRecoveryFrames ?? 5);
    seq.stage = 'ult_swing';

    this.isMeleeSwinging = true;
    this.meleePhase = 1;
    this.meleePhaseTimer = windupFrames;
    this.meleePhaseMaxTimer = windupFrames;
    this.meleePhaseProgress = 0;
  }

  _stepUltSwingStage(seq) {
    this._centerKnightDuringFinale(seq);
    seq.swingTimer--;
    this.meleePhase = seq.swingPhase === 4 ? 5 : seq.swingPhase;
    this.meleePhaseTimer = Math.max(0, seq.swingTimer);
    this.meleePhaseMaxTimer = seq.swingMaxTimer;
    this.meleePhaseProgress = 1 - Math.max(0, seq.swingTimer) / Math.max(1, seq.swingMaxTimer);

    if (seq.swingTimer > 0) return;

    if (seq.swingPhase === 1) {
      seq.swingPhase = 2;
      seq.swingTimer = seq.holdFrames;
      seq.swingMaxTimer = seq.holdFrames;
    } else if (seq.swingPhase === 2) {
      seq.swingPhase = 3;
      seq.swingTimer = seq.strikeFrames;
      seq.swingMaxTimer = seq.strikeFrames;
      const cutKey = this.meleeComboFlip ? 'cut2' : 'cut1';
      this._playAudio(cutKey, `Assets/Sound Effects/RoaringKnightSFX/snd_knight_${cutKey}.wav`, 0.90, 1.04);
      triggerGlobalScreenShake?.(4.2, 4);
    } else if (seq.swingPhase === 3) {
      seq.swingPhase = 4;
      seq.swingTimer = seq.swingRecoverFrames;
      seq.swingMaxTimer = seq.swingRecoverFrames;
    } else {
      // Cleave animation complete -> unlock melee pose and erupt into Non-Rotating Multi-Angle Front Slash Barrage
      this.isMeleeSwinging = false;
      this.meleePhase = 0;
      this.meleePhaseTimer = 0;
      this.meleePhaseMaxTimer = 1;
      this.meleePhaseProgress = 0;
      this.meleeComboFlip = !this.meleeComboFlip;

      this._playAudio('drawPower', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_drawpower.wav', 0.78, 1.12);
      this._playAudio('rotatingSlashLine', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_rotatingslash_line.wav', 0.85, 1.05);
      seq.stage = 'finale_windup';
    }
  }

  _applyUltDashImpactStun(seq, opponent) {
    const stunFrames = Math.max(1, seq.stunFrames ?? 60);
    const stunMargin = seq.stunReach ?? 95;
    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);
    let stunnedAny = false;

    for (const t of targets) {
      if (!t || t.hp <= 0) continue;
      const tRad = t.r || t.radius || 25;
      const dist = Math.hypot(t.x - this.x, t.y - this.y);
      if (dist > (this.r || 25) + tRad + stunMargin) continue;

      if (typeof t.applyHitStun === 'function') {
        t.applyHitStun(stunFrames);
      } else {
        t.hitStunTimer = Math.max(t.hitStunTimer || 0, stunFrames);
      }
      t.vx = 0;
      t.vy = 0;
      stunnedAny = true;
      spawnFloatingText?.(t.x, t.y - tRad - 16, 'STUNNED!', '#FF3355');
      this.activeVisualEffects.push({
        kind: 'star_detonate_flash',
        x: t.x,
        y: t.y,
        radius: 26,
        rot: seq.castAngle || 0,
        timer: 10,
        maxTimer: 10,
      });
    }

    if (stunnedAny) {
      this._playAudio('hitStrong', 'Assets/Sound Effects/RoaringKnightSFX/snd_metal_hit_strong.wav', 0.86, 1.06);
      triggerGlobalScreenShake?.(4.5, 4);
    }
  }

  _centerKnightDuringFinale(seq) {
    // Front Multi-Angle Slash Barrage spawns directly in front of Roaring Knight; keep body anchored cleanly
    if (Number.isFinite(seq.centerStartX) && Number.isFinite(seq.centerStartY)) {
      this.x = seq.centerStartX;
      this.y = seq.centerStartY;
    }
    if (!seq.centered) {
      seq.centered = true;
    }
  }

  _advanceFinaleRotatingSlash(seq, opponent, bounds) {
    const cfg = this._cfg();
    if (seq.stage === 'finale_windup') {
      seq.windupTimer--;
      const maxW = Math.max(1, seq.maxWindupFrames || 18);
      const p = Math.min(1, (maxW - seq.windupTimer) / maxW);
      if (p >= 0.60) {
        seq.showFrontTrail = true;
      }

      this._centerKnightDuringFinale(seq);
      if (seq.windupTimer > 0) return;

      this._stopAudio('rotatingSlashLine', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_rotatingslash_line.wav');
      seq.stage = 'finale_barrage';
      seq.showFrontTrail = true;
      seq.finaleCooldown = 0;
      this._advanceFinaleRotatingSlash(seq, opponent, bounds);
      return;
    }

    if (seq.stage === 'finale_barrage') {
      seq.showFrontTrail = true;
      this._centerKnightDuringFinale(seq);
      seq.finaleCooldown--;
      if (seq.finaleCooldown <= 0) {
        this._fireFinaleFrontSlashBurst(seq, opponent, bounds);
        seq.finaleShot++;
        if (seq.finaleShot >= seq.finaleTotal) {
          seq.stage = 'finale_outro';
          seq.outroTimer = cfg.rotatingSlashOutroFrames ?? 14;
          seq.maxOutroFrames = seq.outroTimer;
          return;
        }
        seq.finaleCooldown = cfg.rotatingSlashFinaleInterval ?? 4;
      }
      return;
    }

    this._centerKnightDuringFinale(seq);
    seq.outroTimer--;
    if (seq.outroTimer <= 0) {
      this._rotatingSlashSeq = null;
      this.isSwoonChanneling = false;
      this.swoonChannelTimer = 0;
      this.swoonActiveTimer = 0;
      this._releaseUltPausedTargets();
    }
  }

  _fireFinaleFrontSlashBurst(seq, opponent, bounds) {
    const cfg = this._cfg();
    const isFinal = seq.finaleShot >= seq.finaleTotal - 1;
    const cutKey = seq.finaleShot % 2 === 0 ? 'cut1' : 'cut2';
    const cutFile = cutKey === 'cut1' ? 'snd_knight_cut.wav' : 'snd_knight_cut2.wav';
    this._playAudio(cutKey, `Assets/Sound Effects/RoaringKnightSFX/${cutFile}`, 0.78, 1.05 + (seq.finaleShot % 4) * 0.05);
    this._playAudio('cutExplosion', 'Assets/Sound Effects/Attacks/explosion.mp3', 0.28, 1.42);
    if (isFinal) {
      this._playAudio('boxBreak', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_boxbreak.wav', 0.90, 1.02);
      this._playAudio('wideSlash', 'Assets/Sound Effects/RoaringKnightSFX/snd_wideslash_low.wav', 0.92, 0.98);
      triggerGlobalScreenShake?.(8.5, 11);
    } else {
      triggerGlobalScreenShake?.(3.8, 3);
    }

    const castAngle = Number.isFinite(seq.castAngle) ? seq.castAngle : (this.skillCastAngle || 0);
    const cosA = Math.cos(castAngle);
    const sinA = Math.sin(castAngle);
    const perpX = -sinA;
    const perpY = cosA;

    // Distinct non-rotating angle offsets (contrasting diagonals, steep vertical cuts, shallow thrusts)
    const anglePatterns = [
      [-0.78, 0.56],
      [0.94, -0.34],
      [-1.18, 0.26],
      [0.46, -0.96],
      [-0.54, 1.12],
      [0.72, -0.68],
      [-1.30, 0.16],
      [0.38, -1.08],
      [-0.86, 0.84],
    ];
    const spreadPatterns = [
      [-0.25, -0.65],
      [0.45, 0.58],
      [-0.10, 0.22],
      [0.65, -0.52],
      [0.15, -0.82],
      [-0.30, 0.72],
      [0.80, -0.18],
      [0.22, 0.42],
      [-0.18, -0.38],
    ];

    const halfW = isFinal
      ? Math.round((cfg.rotatingSlashFinaleHalfWidth ?? 30) * 1.25)
      : (cfg.rotatingSlashFinaleHalfWidth ?? 30);
    const spread = cfg.rotatingSlashFrontSpread ?? 44;
    const maxTimer = isFinal ? 24 : 18;
    const relAngles = isFinal
      ? [-0.64, 0.64, 0.0]
      : anglePatterns[seq.finaleShot % anglePatterns.length];

    const emittedSlashes = [];
    for (let k = 0; k < relAngles.length; k++) {
      const cutAngle = castAngle + relAngles[k];
      let cutCx = seq.boardCx;
      let cutCy = seq.boardCy;
      if (!isFinal) {
        const sp = spreadPatterns[(seq.finaleShot * 2 + k) % spreadPatterns.length];
        cutCx += cosA * (sp[0] * spread) + perpX * (sp[1] * spread);
        cutCy += sinA * (sp[0] * spread) + perpY * (sp[1] * spread);
        cutCx = Math.max(bounds.x + 20, Math.min(bounds.x + bounds.width - 20, cutCx));
        cutCy = Math.max(bounds.y + 20, Math.min(bounds.y + bounds.height - 20, cutCy));
      }

      const slashObj = {
        mode: 'phase1',
        isFrontBarrage: true,
        cx: cutCx,
        cy: cutCy,
        angle: cutAngle,
        prevAngle: null,
        slashDir: (seq.finaleShot + k) % 2 === 0 ? 1 : -1,
        halfWidth: halfW,
        timer: maxTimer,
        maxTimer,
        span: seq.span,
        seed: seq.finaleShot * 4 + k + 1,
        arenaBounds: { ...bounds },
      };
      this.activeRotatingSlashes.push(slashObj);
      emittedSlashes.push(slashObj);
      this._spawnRotatingSlashShards(cutCx, cutCy, cutAngle, bounds, seq.finaleShot * 3 + k);
    }

    const burstDamage = isFinal
      ? (cfg.rotatingSlashFinisherDamage ?? 30)
      : (cfg.rotatingSlashFinaleDamage ?? 15);
    const burstKb = isFinal
      ? (cfg.rotatingSlashFinisherKnockback ?? 9.5)
      : (cfg.rotatingSlashFinaleKnockback ?? 1.8);

    this._damageTargetsAlongFrontSlashes(
      emittedSlashes,
      burstDamage,
      burstKb,
      castAngle,
      isFinal,
      opponent,
      'roaring_knight_rotating_finale',
      {
        slowFrames: cfg.rotatingSlashSlowFrames ?? 150,
        slowMultiplier: cfg.rotatingSlashSlowMultiplier ?? 0.45,
      }
    );
  }

  _pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq <= 0.0001) return Math.hypot(px - x1, py - y1);
    const proj = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    return Math.hypot(px - (x1 + dx * proj), py - (y1 + dy * proj));
  }

  _damageTargetsAlongFrontSlashes(slashes, dmg, kb, castAngle, isFinal, opponent, sourceTag, hitEffects = {}) {
    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);
    const slowFrames = Math.max(0, Number(hitEffects.slowFrames) || 0);
    const slowMultiplier = Number.isFinite(hitEffects.slowMultiplier) ? hitEffects.slowMultiplier : 0.45;

    for (const t of targets) {
      if (!t || t.hp <= 0) continue;
      const tRad = t.r || t.radius || 25;
      let hitSlash = null;
      for (const s of slashes) {
        const cosA = Math.cos(s.angle);
        const sinA = Math.sin(s.angle);
        const dist = Number.isFinite(s.halfLength)
          ? this._pointToSegmentDist(
              t.x,
              t.y,
              s.cx - cosA * s.halfLength,
              s.cy - sinA * s.halfLength,
              s.cx + cosA * s.halfLength,
              s.cy + sinA * s.halfLength
            )
          : Math.abs(-(t.x - s.cx) * sinA + (t.y - s.cy) * cosA);
        if (dist <= (s.halfWidth || 30) + tRad) {
          hitSlash = s;
          break;
        }
      }
      if (!hitSlash) continue;

      const dealt = applyDamageToTarget(t, dmg, this, {
        source: sourceTag,
        isUltimate: true,
        hitAngle: hitSlash.angle,
      });
      if (dealt && slowFrames > 0) {
        if (typeof t.applySlow === 'function') {
          t.applySlow(slowFrames, slowMultiplier);
        } else if (t.statusEffects && typeof t.statusEffects.applySlow === 'function') {
          t.statusEffects.applySlow(slowFrames, slowMultiplier);
        }
      }
      if (dealt && kb > 0) {
        let dirX = Math.cos(castAngle);
        let dirY = Math.sin(castAngle);
        if (!isFinal) {
          const nx = -Math.sin(hitSlash.angle);
          const ny = Math.cos(hitSlash.angle);
          const pushSign = ((t.x - hitSlash.cx) * nx + (t.y - hitSlash.cy) * ny) >= 0 ? 1 : -1;
          dirX = nx * pushSign;
          dirY = ny * pushSign;
        }
        if (this._ultPausedTargets?.has(t) || (t.timeStopTimer || 0) > 0) {
          const stepDist = isFinal ? 22 : 14;
          const b = this._arenaBounds || (typeof state !== 'undefined' ? state.arena : null) || { x: 45, y: 240, width: 450, height: 450 };
          const oldX = t.x;
          const oldY = t.y;
          const pad = tRad + 4;
          t.x = Math.max((b.x ?? 45) + pad, Math.min((b.x ?? 45) + (b.width ?? 450) - pad, oldX + dirX * stepDist));
          t.y = Math.max((b.y ?? 240) + pad, Math.min((b.y ?? 240) + (b.height ?? 450) - pad, oldY + dirY * stepDist));
          t.vx = 0;
          t.vy = 0;
          this.activeVisualEffects.push({
            kind: 'ult_ricochet_streak',
            x: oldX,
            y: oldY,
            tx: t.x,
            ty: t.y,
            timer: 8,
            maxTimer: 8,
          });
        } else {
          t.vx = (t.vx || 0) + dirX * kb;
          t.vy = (t.vy || 0) + dirY * kb;
        }
      }
    }
  }

  // Rule 17 compliant line-intersection damage helper (zero per-hit stunlock across rapid cuts)
  _damageTargetsAlongLines(cx, cy, baseAngle, lineCount, halfWidth, dmg, kb, opponent, sourceTag, hitEffects = {}) {
    const targets = this._collectAllEnemyTargets ? this._collectAllEnemyTargets(opponent) : (opponent ? [opponent] : []);
    const slowFrames = Math.max(0, Number(hitEffects.slowFrames) || 0);
    const slowMultiplier = Number.isFinite(hitEffects.slowMultiplier) ? hitEffects.slowMultiplier : 0.45;
    for (const t of targets) {
      if (!t || t.hp <= 0) continue;
      const tRad = t.r || t.radius || 25;
      let hitAngle = null;
      for (let i = 0; i < lineCount; i++) {
        const a = baseAngle + (i * Math.PI) / lineCount;
        const perp = Math.abs(-(t.x - cx) * Math.sin(a) + (t.y - cy) * Math.cos(a));
        if (perp <= halfWidth + tRad) {
          hitAngle = a;
          break;
        }
      }
      if (hitAngle === null) continue;
      const dealt = applyDamageToTarget(t, dmg, this, { source: sourceTag, isUltimate: true, hitAngle });
      if (dealt && slowFrames > 0) {
        if (typeof t.applySlow === 'function') {
          t.applySlow(slowFrames, slowMultiplier);
        } else if (t.statusEffects && typeof t.statusEffects.applySlow === 'function') {
          t.statusEffects.applySlow(slowFrames, slowMultiplier);
        }
      }
      if (dealt && kb > 0) {
        const nx = -Math.sin(hitAngle);
        const ny = Math.cos(hitAngle);
        const pushSign = ((t.x - cx) * nx + (t.y - cy) * ny) >= 0 ? 1 : -1;
        t.vx = (t.vx || 0) + nx * pushSign * kb;
        t.vy = (t.vy || 0) + ny * pushSign * kb;
      }
    }
  }

  /**
   * Rule 21: Dedicated body draw hook for HUD/Studio preview compatibility.
   */
  drawBody(ctx) {
    drawRoaringKnightSkin(ctx, this);
  }

  /**
   * Renders Ultimate telegraphs, front flurry trail, barrage slashes, shards, and stun flashes
   * above all enemy bodies during the foreground FX pass.
   */
  drawUltimateForegroundVisuals(ctx) {
    if (this._rotatingSlashSeq) {
      drawRotatingSlashTelegraph(ctx, this._rotatingSlashSeq);
    }
    if (this._rotatingSlashSeq?.showFrontTrail) {
      drawRoaringKnightFrontSlashTrail(ctx, this);
    }
    for (const slash of this.activeRotatingSlashes) {
      if (slash.isFrontBarrage || slash.mode === 'finale') {
        drawRotatingSlashVFX(ctx, slash);
      }
    }
    for (const shard of this.activeRotatingShards) {
      drawRotatingSlashShard(ctx, shard);
    }
    if (this._hasActiveUltVisuals()) {
      for (const fx of this.activeVisualEffects) {
        if (fx.kind === 'star_detonate_flash' || fx.kind === 'swoon_telegraph' || fx.kind === 'ult_ricochet_streak') {
          drawRoaringSwoonVFX(ctx, fx);
        }
      }
    }
  }

  _hasActiveUltVisuals() {
    return Boolean(
      this._rotatingSlashSeq ||
      this.isSwoonChanneling ||
      this.activeRotatingSlashes.some(s => s.isFrontBarrage || s.mode === 'finale') ||
      this.activeRotatingShards.length > 0
    );
  }

  /**
   * Master combat renderer (Rule 21: drawHealth + drawFreezeTimer called last).
   */
  draw(ctx, opponent) {
    const hasUltVisuals = this._hasActiveUltVisuals();
    const deferUltVfx = Boolean(
      hasUltVisuals &&
      typeof state !== 'undefined' &&
      state._deferFighterForegroundFx &&
      Array.isArray(state._deferredForegroundFx)
    );

    // 0. Gaping Maw Void Rifts & queued crimson slice telegraphs
    for (const rift of this.activeVoidRifts) {
      drawGapingMawVoidRift(ctx, rift);
    }
    for (const strike of this.activeRiftStrikes) {
      drawRiftSlashTelegraph(ctx, strike);
    }

    // 1. Afterimage Trail Echoes
    for (const ghost of this.afterImages) {
      const alpha = Math.max(0, (ghost.life / ghost.maxLife) * 0.42);
      drawRoaringKnightGhostSkin(ctx, ghost.x, ghost.y, ghost.angle, ghost.r, alpha);
    }

    // 1b. Rotating Slash telegraph lines sit behind the Knight silhouette when aiming or centered
    if (this._basicRotatingSlash) {
      drawRotatingSlashTelegraph(ctx, this._basicRotatingSlash);
    }
    if (!deferUltVfx && this._rotatingSlashSeq) {
      drawRotatingSlashTelegraph(ctx, this._rotatingSlashSeq);
    }

    // 2 & 3. Keep canonical Circle Knight body visible at all times; overlay pure slash-trail flurry in Stage 2
    const showFlurryAnim = Boolean(this._rotatingSlashSeq?.showFrontTrail);
    drawRoaringKnightSkin(ctx, this);
    if (!showFlurryAnim || this._rotatingSlashSeq?.stage === 'finale_outro') {
      drawRoaringKnightBlackKnife(ctx, this);
    }
    drawRoaringKnightParryVFX(ctx, this);
    if (!deferUltVfx && showFlurryAnim) {
      drawRoaringKnightFrontSlashTrail(ctx, this);
    }

    // 4. Active Projectiles & Skill VFX
    for (const slash of this.activeRotatingSlashes) {
      const isUltSlash = Boolean(slash.isFrontBarrage || slash.mode === 'finale');
      if (deferUltVfx && isUltSlash) continue;
      drawRotatingSlashVFX(ctx, slash);
    }
    if (!deferUltVfx) {
      for (const shard of this.activeRotatingShards) {
        drawRotatingSlashShard(ctx, shard);
      }
    }
    if (this.activeStarCone) {
      drawStarConeVFX(ctx, this.activeStarCone);
    }
    for (const orbitStar of this.activeOrbitStars) {
      drawOrbitingStarEntity(ctx, orbitStar);
    }
    for (const sword of this.activeFallingSwords) {
      drawFallingSwordEntity(ctx, sword);
    }
    for (const slash of this.activeTrackingSlashes) {
      drawTrackingSwordSlashVFX(ctx, slash);
    }
    for (const blade of this.activeCorridorBlades) {
      drawFallingSwordEntity(ctx, blade);
    }
    drawSwordTunnelVisuals(ctx, this);
    for (const star of this.activeStarBursts) {
      drawStarBurstProjectile(ctx, star);
    }
    for (const shard of this.activeStarChildren) {
      drawStarChildFragment(ctx, shard);
    }
    for (const fx of this.activeVisualEffects) {
      if (deferUltVfx && (fx.kind === 'star_detonate_flash' || fx.kind === 'swoon_telegraph' || fx.kind === 'ult_ricochet_streak')) continue;
      drawRoaringSwoonVFX(ctx, fx);
    }
    if (this.activeSnowflakeMatrix) {
      drawSnowflakeMatrixVFX(ctx, this.activeSnowflakeMatrix);
    }

    if (deferUltVfx) {
      state._deferredForegroundFx.push({
        fighter: this,
        draw: (fgCtx, fgFighter) => fgFighter.drawUltimateForegroundVisuals(fgCtx),
      });
    }

    // 5. Mandatory Rule 21 Overhead HP & Status Indicators
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }
}
