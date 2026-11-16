// ───────────────────────────────────────────────────────────────────────────
// ERROR SANS (Anti-Void Destroyer of AUs) — Combat Entity Class
// Adheres strictly to:
// - Rule 1.1: Freeze & TimeStop Early Exits
// - Rule 1.2: Centralized Physics via super.update()
// - Rule 1.4: Continuous 360° Aiming & Committed Cast Angle Lock
// - Rule 18: Unified Theme Color (#DD0000) & Toggle Gating
// - Rule 20: Canonical String-Spool Hands during active casts only
// - Rule 21: In-Game Overlay HP & Status Drawing (drawHealth + drawFreezeTimer)
// - Rule 23: Basic Projectile Suppression (shoot override)
// - Rule 24: Universal Character Body Model Scale (preserve super(def) scaled r)
// - Rule 25: Non-Freezing Active Visual Effects Standard (top-of-update decay)
// - Rule 32: World-Space Skin Drawing & 2.0px Outer Black Outline
// ───────────────────────────────────────────────────────────────────────────

import { Fighter, applyDamageToTarget, isSkillEnabled } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { errorSansConfig } from '../../configs/characters/errorSansConfig.js';
import { state, spawnFloatingText, triggerGlobalScreenShake } from '../../core/state.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { spawnSparks } from '../../graphics/particles/sparkEffect.js';
import { drawErrorSansSkin, drawErrorSansGhostSkin } from '../../graphics/fighters/errorSansSkin.js';
import { resetSpeechState, triggerFighterSpeech, updateFighterSpeech, tickFighterIntroAndWinSpeech } from '../../systems/undertaleSpeech.js';
import { drawSansSpeechBubble } from '../../graphics/weapons/sansWeaponGraphics.js';
import { getBlasterTargetBlockRadius, computeEffectiveBlasterReach } from './SansFighter.js';
import {
  drawErrorSansWeaponPreview,
  drawErrorGasterBlaster,
  drawErrorBoneProjectile,
  drawErrorBoneTrap,
  drawErrorStringsVFX,
  drawForcedCrashVFX,
} from '../../graphics/weapons/errorSansWeaponGraphics.js';

export class ErrorSansFighter extends Fighter {
  constructor(def = {}) {
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.error_sans)
      ? CONFIG.error_sans
      : errorSansConfig;

    // Rule 24: Preserve scaled radius from super(def); NEVER overwrite this.r afterward
    super({
      ...def,
      r: def.r ?? cfg.r ?? 25,
      radius: def.radius ?? cfg.radius ?? 25,
      hp: def.hp ?? cfg.hp ?? 1,
      maxHp: def.maxHp ?? cfg.maxHp ?? 1,
      speed: def.speed ?? cfg.speed ?? 5.8,
      damage: def.damage ?? cfg.basicBoneDamage ?? 11,
      cooldown: def.cooldown ?? cfg.basicAttackCooldown ?? 56,
      color: def.color || cfg.color || '#DD0000',
    });

    this.characterId = 'error_sans';
    this.type = 'error_sans';
    this.name = def?.name || cfg.name || 'Error Sans';
    this.displayName = def?.displayName || cfg.displayName || 'ERROR SANS';
    this.grade = cfg.grade || 'SS';
    this.title = cfg.title || 'Destroyer of AUs';
    this.color = cfg.color || '#DD0000';
    this.themeColor = cfg.themeColor || '#DD0000';
    this.secondaryColor = cfg.secondaryColor || '#00A0FF';
    this.damageNumberColor = cfg.damageNumberColor || '#DD0000';
    this.moveSpeed = def.moveSpeed ?? cfg.moveSpeed ?? cfg.speed ?? 5.8;
    this.speed = this.moveSpeed;
    this.hp = (def.hp !== undefined) ? def.hp : (cfg.hp !== undefined ? cfg.hp : 1);
    this.maxHp = this.hp;

    this._initErrorState(cfg);
  }

  _cfg() {
    return (typeof CONFIG !== 'undefined' && CONFIG.error_sans)
      ? CONFIG.error_sans
      : errorSansConfig;
  }

  _registerCooldownExclusions() {
    if (!this.skillManager || !this.skillManager.cooldownKeyMap) return;
    const keys = [
      'dodgeCooldown',
      'basicAttackCooldownTimer',
      'skill1CooldownTimer',
      'forcedCrashCooldownTimer',
    ];
    for (const k of keys) {
      this.skillManager.cooldownKeyMap.set(k, true);
    }
  }

  _initErrorState(cfg = this._cfg()) {
    this._vfxTick = 0;
    this._afterImageTick = 0;
    this._afterImageTintIndex = 0;
    this.afterImages = [];

    // Passive 1: 1 HP + Glitch Dodge Stamina System (replaces healthbar in HUD)
    this.maxStamina = cfg.dodgeStaminaMax !== undefined ? cfg.dodgeStaminaMax : 100;
    this.stamina = this.maxStamina;
    this.staminaRegenDelayTimer = 0;
    this.dodgeCooldown = 0;
    this.dodgeStallTimer = 0;
    this._dodgedVolleyIds = null;
    this._lastShotgunDodgeFrame = -1;
    this._shotgunDodgeGraceTimer = 0;
    this._lastShotgunDodgeAttacker = null;
    this.dodgeCount = 0;
    this.glitchCastHandsTimer = 0;

    // Passive 2: Code Corruption (Error Karma DoT)
    this.errorKarmaTargets = new Map(); // target -> { stacks, timer, tickTimer }

    // Basic Attack
    this.basicAttackCooldownTimer = cfg.basicAttackInitialCooldown ?? 18;
    this.shootCooldownMax = 0;
    this.shootCooldown = 999999;

    // Unified Skill 1 Slot (Random Anti-Repeat Pool)
    this.skill1CooldownTimer = cfg.skill1InitialCooldown ?? 105;
    this.skill1CooldownMax = cfg.skill1Cooldown ?? 330;
    this._activeSkill1Id = null;
    this._activeSkill1Label = null;
    this.isSkill1Channeling = false;

    this.activeErrorStrings = [];
    this.activeErrorBlasters = [];
    this.activeErrorBones = [];
    this.activeErrorTraps = [];

    // Ultimate: FORCED CRASH
    this.crashHits = 0;
    this.isForcedCrashActive = false;
    this.forcedCrashCooldownTimer = cfg.forcedCrashCooldown ?? 0;
    this._forcedCrashSeq = null;
    this.activeGlitchWindows = [];
    this.activeShockwaveRipples = [];
    this.skillCastAngle = 0;

    resetSpeechState(this);
    this._registerCooldownExclusions();
  }

  reset() {
    super.reset();
    this._initErrorState(this._cfg());
  }

  _playAudio(key, fallbackPath, defaultVol = 0.78, speed = 1.0) {
    if (typeof audioSystem === 'undefined' || !audioSystem.playSFX) return;
    const cfg = this._cfg();
    const src = cfg.sounds?.[key] || fallbackPath;
    const vol = cfg.soundVolumes?.[key] ?? defaultVol;
    audioSystem.playSFX(src, vol, speed, 0);
  }

  _playRandomBadNoise(volMult = 1.0) {
    const idx = 1 + Math.floor(Math.random() * 3);
    const key = `badNoise${idx}`;
    const cfg = this._cfg();
    const vol = (cfg.soundVolumes?.[key] ?? 0.72) * volMult;
    this._playAudio(key, `Assets/Sound Effects/ErrorSans/badnoise${idx}.mp3`, vol, 0.95 + Math.random() * 0.15);
  }

  /**
   * Rule 23: Suppress base Fighter generic bullet projectiles.
   */
  shoot() {
    // Intentionally empty: Error Sans fights with Glitch Bones, Error Strings & Error Blasters.
  }

  /**
   * Rule 1.4: Lock aim during Forced Crash sequence.
   */
  canAim() {
    if (this.isForcedCrashActive) return false;
    return super.canAim();
  }

  _getAllEnemyTargets(opponent) {
    const out = [];
    const seen = new Set();
    const pushIfEnemy = (entity) => {
      if (!entity || entity === this || seen.has(entity)) return;
      if (entity.hp <= 0 || entity.dead || entity.isDead) return;
      if (typeof this.isAllyWith === 'function' && this.isAllyWith(entity)) return;
      if (entity.team !== undefined && this.team !== undefined && entity.team === this.team) return;
      seen.add(entity);
      out.push(entity);
    };
    pushIfEnemy(opponent);
    if (typeof state !== 'undefined') {
      if (Array.isArray(state.fighters)) state.fighters.forEach(pushIfEnemy);
      if (Array.isArray(state.illusions)) state.illusions.forEach(pushIfEnemy);
    }
    return out;
  }

  _applyErrorKarma(target, cfg = this._cfg()) {
    if (!target || target.hp <= 0 || target.dead || target.isDead) return;
    if (!isSkillEnabled(cfg.enableErrorKarma, true)) return;
    const maxStacks = cfg.errorKarmaMaxStacks ?? 8;
    const dur = cfg.errorKarmaDuration ?? 90;
    const interval = cfg.errorKarmaTickInterval ?? 20;
    const existing = this.errorKarmaTargets.get(target);
    if (existing) {
      existing.stacks = Math.min(maxStacks, existing.stacks + 1);
      existing.timer = dur;
    } else {
      this.errorKarmaTargets.set(target, { stacks: 1, timer: dur, tickTimer: interval });
    }
  }

  _dealErrorDamage(target, amount, opts = {}) {
    if (!target || target.hp <= 0 || target.dead || target.isDead) return false;
    if (target.invulnerable) return false;
    // Preserve simultaneous enemy active casts (skipInterrupt prevents isBlastOrKnockback interrupts)
    const damageOpts = { skipInterrupt: true, ...opts };
    const dealt = applyDamageToTarget(target, amount, this, damageOpts);
    if (dealt && opts.applyKarma) {
      this._applyErrorKarma(target);
    }
    if (dealt && opts.incrementUlt && !this.isForcedCrashActive) {
      const req = Math.max(1, this._cfg().crashHitsRequired ?? 5);
      this.crashHits = Math.min(req, (this.crashHits || 0) + 1);
    }
    return Boolean(dealt);
  }

  recoverStamina(_amount) {
    // Error Sans has zero stamina recovery; every dodge permanently consumes stamina.
    return 0;
  }

  _calculateDodgeStaminaCost(damageVal, isSukunaDomainActive = false) {
    const cfg = this._cfg();
    if (isSukunaDomainActive) return cfg.domainDodgeStaminaCost ?? 1;
    const mult = cfg.damageStaminaCostMultiplier ?? 0.10;
    const minCost = cfg.minDodgeStaminaCost ?? 1;
    const dmg = (typeof damageVal === 'number' && Number.isFinite(damageVal) && damageVal > 0) ? damageVal : 10;
    return Math.max(minCost, Math.round(dmg * mult));
  }

  _executeGlitchWarp(startX, startY, targetX, targetY, attacker) {
    const cfg = this._cfg();
    const bounds = (typeof state !== 'undefined' && state.arena)
      ? state.arena
      : { x: 45, y: 240, width: 450, height: 450 };
    const r = this.r || 25;
    const minX = bounds.x + r + 14;
    const maxX = bounds.x + bounds.width - r - 14;
    const minY = bounds.y + r + 14;
    const maxY = bounds.y + bounds.height - r - 14;

    const finalX = Math.max(minX, Math.min(maxX, targetX));
    const finalY = Math.max(minY, Math.min(maxY, targetY));
    const oldAngle = this.gunAngle || 0;

    // Multi-ghost chromatic warp trail + glitch tear jitter on dodge
    const ghostSteps = [0.0, 0.36, 0.72];
    const ghostColors = ['#EE0000', '#00A0FF', '#FFEB00'];
    for (let g = 0; g < ghostSteps.length; g++) {
      const t = ghostSteps[g];
      const jitterX = (Math.random() - 0.5) * 14;
      const jitterY = (Math.random() - 0.5) * 14;
      this._afterImageTintIndex = (this._afterImageTintIndex + 1) % 3;
      this.afterImages.push({
        x: startX + (finalX - startX) * t + jitterX,
        y: startY + (finalY - startY) * t + jitterY,
        angle: oldAngle + (Math.random() - 0.5) * 0.22,
        timer: (cfg.afterImageLife ?? 22) - g * 3,
        maxTimer: cfg.afterImageLife ?? 22,
        tintIndex: this._afterImageTintIndex,
      });
    }

    this.x = finalX;
    this.y = finalY;
    this.vx = 0;
    this.vy = 0;
    this.dodgeStallTimer = cfg.dodgeStallDuration ?? 12;

    if (attacker && Number.isFinite(attacker.x) && Number.isFinite(attacker.y) && typeof this.aim === 'function') {
      this.aim(attacker);
    }

    spawnSparks(startX, startY, 5, 'crimson', { color: ghostColors[0] });
    spawnSparks(finalX, finalY, 6, 'cyan', { color: ghostColors[1] });
    this.activeGlitchWindows.push(
      {
        x: startX,
        y: startY - 12,
        w: 44,
        h: 20,
        text: 'ERROR!',
        color: '#00A0FF',
        life: 18,
        maxLife: 18,
      },
      {
        x: (startX + finalX) * 0.5 + (Math.random() - 0.5) * 20,
        y: (startY + finalY) * 0.5 + (Math.random() - 0.5) * 20,
        w: 36,
        h: 16,
        text: '0xERR',
        color: '#EE0000',
        life: 14,
        maxLife: 14,
      }
    );
    spawnFloatingText(finalX, finalY - r - 14, 'ERROR!', '#00A0FF');
    this._playRandomBadNoise(0.95);
    const warpLines = ['n0pe.', 'glitched right past.', 'missed me, anomaly.'];
    triggerFighterSpeech(this, warpLines[(this.dodgeCount || 0) % warpLines.length], {
      duration: 85,
      preserveCase: true,
      borderColor: '#EE0000',
      blipSpeed: 0.88,
    });

    // Follow up every Error Warp / slice dodge with Skill 1B (3-Blaster Crossfire)
    const counterTarget = (attacker && attacker !== this && attacker.hp > 0 && Number.isFinite(attacker.x) && Number.isFinite(attacker.y))
      ? attacker
      : this._getAllEnemyTargets(null)[0];
    if (counterTarget && this.activeErrorBlasters.length < 12) {
      this.glitchCastHandsTimer = Math.max(this.glitchCastHandsTimer || 0, 20);
      this._spawnErrorBlasterCrossfire(counterTarget, bounds, cfg);
    }
  }

  dodgeSliceLine(lineData = {}) {
    const cfg = this._cfg();
    if (!isSkillEnabled(cfg.enableGlitchDodge, true)) return false;
    if (this.isPacmanGhost && (this.pacmanGhostTimer || 0) > 0) return false;
    const isFrozen = Boolean(this.isTimeStopped || this.isStunned || this.isParalyzed || this.isChainedByMakima);
    if (isFrozen || this.hp <= 0) return false;

    const isSukunaDomainActive = Boolean(
      lineData.isSukunaDomain ||
      lineData.attacker?.characterId === 'sukuna' ||
      lineData.attacker?.type === 'sukuna' ||
      (typeof state !== 'undefined' && state.fighters?.some(f => f && (f.characterId === 'sukuna' || f.type === 'sukuna') && f.domainActive))
    );
    const staminaCost = this._calculateDodgeStaminaCost(lineData.damage || lineData.attacker?.damage, isSukunaDomainActive);
    if (this.stamina < staminaCost) return false;
    if (this.dodgeCooldown > 0 && (cfg.dodgeCooldown ?? 0) > 0) return false;

    const dodgeChance = cfg.domainDodgeChance ?? cfg.dodgeChance ?? 1.0;
    if (dodgeChance < 1.0 && Math.random() >= dodgeChance) return false;

    this.stamina -= staminaCost;
    this.staminaRegenDelayTimer = cfg.dodgeStaminaRegenDelay ?? 20;
    this.dodgeCooldown = cfg.dodgeCooldown ?? 0;
    this.dodgeCount++;

    const angle = lineData.angle || 0;
    const nx = lineData.normalX !== undefined ? lineData.normalX : -Math.sin(angle);
    const ny = lineData.normalY !== undefined ? lineData.normalY : Math.cos(angle);
    const sideSign = Math.random() < 0.5 ? 1 : -1;
    const dist = cfg.glitchDodgeDistance ?? cfg.dodgeDistance ?? 145;
    this._executeGlitchWarp(this.x, this.y, this.x + nx * sideSign * dist, this.y + ny * sideSign * dist, lineData.attacker);
    return true;
  }

  takeDamage(amount, attacker, opts = {}) {
    const cfg = this._cfg();
    const isGhost = Boolean(this.isPacmanGhost && (this.pacmanGhostTimer || 0) > 0);
    const isFrozen = Boolean(
      this.isTimeStopped || this.isStunned || this.isParalyzed || this.isChainedByMakima || isGhost
    );
    const isDomainSlash = Boolean(opts.isSukunaDomainSliceLine || opts.isDomainSlash);
    const dodgeChance = isDomainSlash ? (cfg.domainDodgeChance ?? 1.0) : (cfg.dodgeChance ?? 1.0);
    const rollsDodge = (dodgeChance >= 1.0 || Math.random() < dodgeChance);
    const isSukunaDomainActive = isDomainSlash ||
      (attacker && (attacker.characterId === 'sukuna' || attacker.type === 'sukuna') && attacker.domainActive) ||
      (typeof state !== 'undefined' && state.fighters?.some(f => f && (f.characterId === 'sukuna' || f.type === 'sukuna') && f.domainActive));
    const incomingDmg = (typeof amount === 'number' && amount > 0) ? amount : (opts.projectile?.damage || attacker?.damage);
    const staminaCost = this._calculateDodgeStaminaCost(incomingDmg, isSukunaDomainActive);
    const hasStamina = (this.stamina >= staminaCost);
    const cooldownReady = (this.dodgeCooldown <= 0) || ((cfg.dodgeCooldown ?? 0) === 0);
    const canDodge = !isGhost && isSkillEnabled(cfg.enableGlitchDodge, true) && !isFrozen && hasStamina && cooldownReady && rollsDodge;

    const proj = opts.projectile;
    const currentFrame = (typeof state !== 'undefined' && state.frameCount !== undefined) ? state.frameCount : ((Date.now() / 16.6) | 0);
    const isShotgunPellet = Boolean(proj && (proj.isShotgun || proj.shotgunVolleyId || proj.visual === 'johnWickShotgunPellet' || proj.visual === 'EngineerBullet'));
    const isAlreadyDodgedVolley = Boolean(
      (proj && proj.shotgunVolleyId && this._dodgedVolleyIds && this._dodgedVolleyIds.has(proj.shotgunVolleyId)) ||
      (proj && proj.shotPairId && this._dodgedVolleyIds && this._dodgedVolleyIds.has(proj.shotPairId)) ||
      (isShotgunPellet && ((this._lastShotgunDodgeFrame === currentFrame) || (this._shotgunDodgeGraceTimer > 0 && this._lastShotgunDodgeAttacker === attacker)))
    );

    if (!isGhost && isAlreadyDodgedVolley && (!opts.bypassDodge || isDomainSlash)) {
      return 0;
    }

    if (!isGhost && canDodge && !opts.isHeal && (!opts.bypassDodge || isDomainSlash)) {
      this.stamina -= staminaCost;
      this.staminaRegenDelayTimer = cfg.dodgeStaminaRegenDelay ?? 20;
      this.dodgeCooldown = cfg.dodgeCooldown ?? 0;
      this.dodgeCount++;

      if (isShotgunPellet || (proj && proj.shotPairId)) {
        if (!this._dodgedVolleyIds) this._dodgedVolleyIds = new Set();
        if (proj && proj.shotgunVolleyId) this._dodgedVolleyIds.add(proj.shotgunVolleyId);
        if (proj && proj.shotPairId) this._dodgedVolleyIds.add(proj.shotPairId);
        this._lastShotgunDodgeFrame = currentFrame;
        this._shotgunDodgeGraceTimer = cfg.shotgunDodgeGraceWindow ?? 16;
        this._lastShotgunDodgeAttacker = attacker;
      }

      const warpDist = cfg.glitchDodgeDistance ?? cfg.dodgeDistance ?? 145;
      const baseAngle = attacker && Number.isFinite(attacker.x)
        ? Math.atan2(this.y - attacker.y, this.x - attacker.x) + (Math.random() < 0.5 ? 1 : -1) * (Math.PI * 0.45)
        : Math.random() * Math.PI * 2;
      this._executeGlitchWarp(this.x, this.y, this.x + Math.cos(baseAngle) * warpDist, this.y + Math.sin(baseAngle) * warpDist, attacker);
      return 0;
    }

    const dealt = super.takeDamage(amount, attacker, opts);
    if (this.hp <= 0) {
      if (typeof state !== 'undefined') state._hadSansDeath = true;
      this.interruptAttacks(true);
    }
    return dealt;
  }

  interruptAttacks(forceCancelAll = false) {
    if (!forceCancelAll && typeof this.isSkillPreservedInStasis === 'function' && this.isSkillPreservedInStasis()) {
      return;
    }
    if (forceCancelAll) {
      this.isSkill1Channeling = false;
      this.isForcedCrashActive = false;
      this._forcedCrashSeq = null;
      this.glitchCastHandsTimer = 0;
      this.activeErrorStrings.length = 0;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RULE 25: TOP-OF-UPDATE NON-FREEZING VFX & PROJECTILE LIFECYCLES
  // ═════════════════════════════════════════════════════════════════════════
  _updateAllVfxLifecycles(arena) {
    updateFighterSpeech(this);
    const enemies = this._getAllEnemyTargets(null);
    const bounds = arena || { x: 45, y: 240, width: 450, height: 450 };
    const cfg = this._cfg();

    // Afterimages
    for (let i = this.afterImages.length - 1; i >= 0; i--) {
      this.afterImages[i].timer--;
      if (this.afterImages[i].timer <= 0) this.afterImages.splice(i, 1);
    }

    // Glitch Popups & Forced Crash Shockwaves
    for (let i = this.activeGlitchWindows.length - 1; i >= 0; i--) {
      this.activeGlitchWindows[i].life--;
      if (this.activeGlitchWindows[i].life <= 0) this.activeGlitchWindows.splice(i, 1);
    }
    for (let i = this.activeShockwaveRipples.length - 1; i >= 0; i--) {
      this.activeShockwaveRipples[i].life--;
      if (this.activeShockwaveRipples[i].life <= 0) this.activeShockwaveRipples.splice(i, 1);
    }

    // Error Karma DoT ticks
    if (isSkillEnabled(cfg.enableErrorKarma, true) && this.errorKarmaTargets.size > 0) {
      const tickDmg = cfg.errorKarmaTickDamage ?? 2;
      const interval = cfg.errorKarmaTickInterval ?? 20;
      for (const [target, data] of this.errorKarmaTargets.entries()) {
        if (!target || target.hp <= 0 || target.dead || target.isDead) {
          this.errorKarmaTargets.delete(target);
          continue;
        }
        data.timer--;
        data.tickTimer--;
        if (data.tickTimer <= 0) {
          data.tickTimer = interval;
          this._dealErrorDamage(target, Math.max(1, tickDmg * Math.min(3, Math.ceil(data.stacks / 3))), {
            isKarma: true,
            isDoT: true,
            bypassEvade: true,
          });
        }
        if (data.timer <= 0) this.errorKarmaTargets.delete(target);
      }
    }

    // Glitch Bone Projectiles
    for (let i = this.activeErrorBones.length - 1; i >= 0; i--) {
      const b = this.activeErrorBones[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;
      for (const e of enemies) {
        if (b.hitSet.has(e)) continue;
        if (Math.hypot(e.x - b.x, e.y - b.y) <= (e.r || 25) + 14) {
          b.hitSet.add(e);
          this._dealErrorDamage(e, b.damage, {
            isProjectile: true,
            applyKarma: true,
            incrementUlt: Boolean(b.incrementUlt),
          });
          spawnSparks(e.x, e.y, 4, 'red', { color: '#DD0000' });
          b.life = 0;
          break;
        }
      }
      if (b.life <= 0 || b.x < bounds.x - 60 || b.x > bounds.x + bounds.width + 60 || b.y < bounds.y - 60 || b.y > bounds.y + bounds.height + 60) {
        this.activeErrorBones.splice(i, 1);
      }
    }

    // Glitch Zone Bone Spikes
    for (let i = this.activeErrorTraps.length - 1; i >= 0; i--) {
      const t = this.activeErrorTraps[i];
      if (t.warnTimer > 0) {
        t.warnTimer--;
        if (t.warnTimer === 0) {
          this._playAudio('boneStab', 'Assets/Sound Effects/Sans/BoneStab.ogg', 0.78);
        }
        continue;
      }
      t.age = (t.age || 0) + 1;
      t.activeTimer--;
      for (const e of enemies) {
        if (t.hitSet.has(e)) continue;
        if (Math.hypot(e.x - t.x, e.y - t.y) <= (e.r || 25) + 18) {
          t.hitSet.add(e);
          this._dealErrorDamage(e, t.damage, { isAOE: true, applyKarma: true });
          spawnSparks(e.x, e.y, 5, 'blue', { color: '#00A0FF' });
        }
      }
      if (t.activeTimer <= 0) this.activeErrorTraps.splice(i, 1);
    }

    // Error Strings Tethers
    for (let i = this.activeErrorStrings.length - 1; i >= 0; i--) {
      const s = this.activeErrorStrings[i];
      s.life--;
      if (!s.latched) {
        s.x += s.vx;
        s.y += s.vy;
        for (const e of enemies) {
          if (Math.hypot(e.x - s.x, e.y - s.y) <= (e.r || 25) + 20) {
            s.latched = true;
            s.target = e;
            s.life = Math.max(s.life, cfg.errorStringsDuration ?? 42);
            this._dealErrorDamage(e, s.impactDamage ?? 16, { isProjectile: true, applyKarma: true });
            this._playAudio('badNoise1', 'Assets/Sound Effects/ErrorSans/badnoise1.mp3', 0.72);
            break;
          }
        }
      } else if (s.target && s.target.hp > 0 && !s.target.dead) {
        // Gentle yank toward pullAnchor (or Error Sans front) while respecting pull immunity
        if (!s.target.isPullImmune) {
          const ax = s.anchorX ?? this.x;
          const ay = s.anchorY ?? this.y;
          const dx = ax - s.target.x;
          const dy = ay - s.target.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          if (d > 48) {
            const pull = cfg.errorStringsPullSpeed ?? 6.2;
            s.target.x += (dx / d) * pull;
            s.target.y += (dy / d) * pull;
          }
        }
        if (s.life % 14 === 0) {
          this._dealErrorDamage(s.target, s.tickDamage ?? 6, { isDoT: true, applyKarma: true });
        }
      }
      if (s.life <= 0) {
        this.activeErrorStrings.splice(i, 1);
      }
    }

    // Error Gaster Blasters
    for (let i = this.activeErrorBlasters.length - 1; i >= 0; i--) {
      const gb = this.activeErrorBlasters[i];
      gb._age = (gb._age || 0) + 1;
      gb.spawnScale = Math.min(1, (gb.spawnScale || 0.2) + 0.16);

      if (gb.chargeTimer > 0) {
        gb.chargeTimer--;
        gb.chargeProgress = 1 - gb.chargeTimer / Math.max(1, gb.chargeMax);
        if (gb.trackTarget && gb.trackTarget.hp > 0 && gb.chargeProgress < 0.78) {
          gb.angle = Math.atan2(gb.trackTarget.y - gb.y, gb.trackTarget.x - gb.x);
        }
        if (gb.chargeTimer <= 0) {
          gb.isCharging = false;
          gb.isFiring = true;
          gb.fireTimer = gb.fireMax;
          this._playAudio('gasterBlast', 'Assets/Sound Effects/Sans/GasterBlast.ogg', 0.78);
          triggerGlobalScreenShake(gb.scale > 1.5 ? 7.5 : 4.2, 8);
        }
        continue;
      }

      if (gb.fireTimer > 0) {
        gb.fireTimer--;
        gb.fireProgress = 1 - gb.fireTimer / Math.max(1, gb.fireMax);
        this._checkBlasterBeamHits(gb, enemies, cfg);
        if (gb.fireTimer <= 0) {
          this.activeErrorBlasters.splice(i, 1);
        }
      }
    }
  }

  _checkBlasterBeamHits(gb, enemies, cfg) {
    const cosA = Math.cos(gb.angle || 0);
    const sinA = Math.sin(gb.angle || 0);
    const halfW = (gb.beamWidth || 34) * 0.5;
    const maxReach = gb.maxReach || gb.reach || 900;
    gb.maxReach = maxReach;
    const reach = computeEffectiveBlasterReach(gb, this, enemies, maxReach, gb.beamWidth || 34);
    gb.effectiveReach = reach;
    const tickInt = cfg.errorBlasterTickInterval ?? 6;
    const contRatio = cfg.errorBlasterContinuousRatio ?? 0.35;

    for (const e of enemies) {
      const dx = e.x - gb.x;
      const dy = (e.y - (e.z || 0)) - gb.y;
      const along = dx * cosA + dy * sinA;
      const perp = Math.abs(-dx * sinA + dy * cosA);
      const blockRadius = getBlasterTargetBlockRadius(e);
      const targetR = e.r || 25;
      const hitWithinReach = blockRadius > 0
        ? (along > 0 && Math.max(0, along - blockRadius) <= reach + 0.5 && perp <= (halfW + blockRadius))
        : (along > -12 && along <= reach && perp <= halfW + targetR * 0.75);
      if (!hitWithinReach) continue;

      const blasterHitOpts = {
        isProjectile: true,
        isLaser: true,
        isGasterBlaster: true,
        isSkill: true,
        isAdaptableSkillShot: true,
        skillShotId: 'gasterBlaster',
        hitX: gb.x,
        hitY: gb.y,
        applyKarma: true,
      };

      if (!gb.firstHitSet.has(e)) {
        gb.firstHitSet.add(e);
        gb.tickTimers.set(e, tickInt);
        const dealt = this._dealErrorDamage(e, gb.damage, { ...blasterHitOpts, isAOE: true, isBeam: true, isFirstImpact: true });
        if (dealt) spawnSparks(e.x, e.y, 5, 'red', { color: '#DD0000' });
      } else {
        const curT = (gb.tickTimers.get(e) ?? 0) - 1;
        if (curT <= 0) {
          gb.tickTimers.set(e, tickInt);
          const tickDmg = Math.max(2, Math.round(gb.damage * contRatio));
          this._dealErrorDamage(e, tickDmg, { ...blasterHitOpts, isBeamDPS: true, isContinuousDamage: true });
        } else {
          gb.tickTimers.set(e, curT);
        }
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // MAIN COMBAT UPDATE LOOP
  // ═════════════════════════════════════════════════════════════════════════
  update(opponent, ownerIndex, arena) {
    this._vfxTick++;
    // Rule 25: Always decay transient VFX before freeze/time-stop guard
    this._updateAllVfxLifecycles(arena);

    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks();
      return;
    }

    const cfg = this._cfg();
    if (this.dodgeCooldown > 0) this.dodgeCooldown--;
    if (this._shotgunDodgeGraceTimer > 0) this._shotgunDodgeGraceTimer--;
    if (this.staminaRegenDelayTimer > 0) {
      this.staminaRegenDelayTimer--;
    } else if ((cfg.dodgeStaminaRegen ?? 0) > 0 && this.stamina < this.maxStamina) {
      this.stamina = Math.min(this.maxStamina, this.stamina + cfg.dodgeStaminaRegen);
    }
    if (this.dodgeStallTimer > 0) {
      this.dodgeStallTimer--;
      this.vx = 0;
      this.vy = 0;
    }
    if (this.basicAttackCooldownTimer > 0) this.basicAttackCooldownTimer--;
    if (this.skill1CooldownTimer > 0) this.skill1CooldownTimer--;
    if (this.forcedCrashCooldownTimer > 0) this.forcedCrashCooldownTimer--;
    if (this.glitchCastHandsTimer > 0) this.glitchCastHandsTimer--;

    // Chromatic twitching glitch afterimages whenever moving
    const speedMag = Math.hypot(this.vx || 0, this.vy || 0);
    this._afterImageTick++;
    const moveThreshold = Math.min(3.2, cfg.afterImageMinSpeed ?? 3.2);
    const moveInterval = Math.max(2, cfg.afterImageInterval ?? 3);
    if (speedMag >= moveThreshold && this._afterImageTick % moveInterval === 0) {
      this._afterImageTintIndex = (this._afterImageTintIndex + 1) % 3;
      const jitX = Math.sin(this._vfxTick * 2.4) * 5.0;
      const jitY = Math.cos(this._vfxTick * 3.1) * 4.0;
      this.afterImages.push({
        x: this.x + jitX,
        y: this.y + jitY,
        angle: (this.gunAngle || 0) + Math.sin(this._vfxTick * 1.9) * 0.10,
        timer: cfg.afterImageLife ?? 22,
        maxTimer: cfg.afterImageLife ?? 22,
        tintIndex: this._afterImageTintIndex,
      });
    }

    const targets = this._getAllEnemyTargets(opponent);
    const primaryTarget = targets[0] || null;
    tickFighterIntroAndWinSpeech(this, primaryTarget || opponent, {
      introText: 'ERR0R. time to erase.',
      winText: 'anomaly deleted.',
      speechStyle: { preserveCase: true, borderColor: '#EE0000', blipSpeed: 0.88 },
    });
    if (this.canAim() && primaryTarget) {
      this.aim(primaryTarget);
    }

    if (this.isForcedCrashActive) {
      this._updateForcedCrashSeq(targets, arena, cfg);
    }

    // AI Decision Hierarchy: Ultimate -> Random Skill 1 -> Basic Glitch Bone Volley
    if (!this.isForcedCrashActive && primaryTarget) {
      const dist = Math.hypot(primaryTarget.x - this.x, primaryTarget.y - this.y);
      const reqHits = Math.max(1, cfg.crashHitsRequired ?? 5);

      if (
        isSkillEnabled(cfg.enableForcedCrash, true) &&
        this.crashHits >= reqHits &&
        this.forcedCrashCooldownTimer <= 0 &&
        dist <= (cfg.forcedCrashTriggerRange ?? 340)
      ) {
        this._startForcedCrash(primaryTarget, arena, cfg);
      } else if (isSkillEnabled(cfg.enableSkill1, true) && this.skill1CooldownTimer <= 0 && this._castRandomSkill1(primaryTarget, arena, cfg)) {
        // Skill 1 triggered cleanly
      } else if (isSkillEnabled(cfg.enableGlitchBoneBasic, true) && this.basicAttackCooldownTimer <= 0 && dist <= (cfg.basicBoneReach ?? 380)) {
        this._fireGlitchBoneVolley(primaryTarget, cfg);
      }
    }

    // Rule 1.2: Centralized physics & wall bounce
    super.update(opponent, ownerIndex, arena);
  }

  _fireGlitchBoneVolley(target, cfg = this._cfg()) {
    this.basicAttackCooldownTimer = cfg.basicAttackCooldown ?? 56;
    this.glitchCastHandsTimer = 14;
    const baseAngle = Math.atan2(target.y - this.y, target.x - this.x);
    this.gunAngle = baseAngle;
    const cnt = Math.max(1, cfg.basicBoneCount ?? 3);
    const spread = cfg.basicBoneSpread ?? 0.24;
    const spd = cfg.basicBoneSpeed ?? 9.8;
    const dmg = cfg.basicBoneDamage ?? 11;
    const life = cfg.basicBoneLife ?? 54;

    for (let i = 0; i < cnt; i++) {
      const offset = cnt > 1 ? ((i / (cnt - 1)) - 0.5) * spread * 2 : 0;
      const a = baseAngle + offset;
      this.activeErrorBones.push({
        x: this.x + Math.cos(a) * ((this.r || 25) + 8),
        y: this.y + Math.sin(a) * ((this.r || 25) + 8),
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        angle: a,
        damage: dmg,
        life,
        incrementUlt: i === 0,
        hitSet: new Set(),
      });
    }
    this._playAudio('boneStab', 'Assets/Sound Effects/Sans/BoneStab.ogg', 0.72, 1.15);
  }

  _castRandomSkill1(target, arena, cfg = this._cfg()) {
    const blasterCost = cfg.blasterStaminaCost !== undefined ? cfg.blasterStaminaCost : 5;
    const options = [];
    if (isSkillEnabled(cfg.enableErrorStrings, true)) options.push('error_strings');
    if (isSkillEnabled(cfg.enableErrorBlaster, true) && (this.stamina || 0) >= blasterCost) options.push('error_blaster');
    if (isSkillEnabled(cfg.enableGlitchZone, true)) options.push('glitch_zone');
    if (options.length === 0) return false;

    const nonRepeat = options.filter(id => id !== this._activeSkill1Id);
    const pool = nonRepeat.length > 0 ? nonRepeat : options;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return this._executeSkill1ById(pick, target, arena, cfg);
  }

  _spawnErrorBlasterCrossfire(target, bounds, cfg = this._cfg()) {
    if (!target || !isSkillEnabled(cfg.enableErrorBlaster, true)) return false;
    const staminaCost = cfg.blasterStaminaCost !== undefined ? cfg.blasterStaminaCost : 5;
    if (staminaCost > 0) {
      if ((this.stamina || 0) < staminaCost) return false;
      this.stamina = Math.max(0, this.stamina - staminaCost);
    }
    const area = bounds || ((typeof state !== 'undefined' && state.arena) ? state.arena : { x: 45, y: 240, width: 450, height: 450 });
    const count = cfg.errorBlasterCount ?? 3;
    const chargeMax = cfg.errorBlasterChargeFrames ?? 20;
    const fireMax = cfg.errorBlasterFireFrames ?? 24;
    const beamW = cfg.errorBlasterBeamWidth ?? 34;
    const reach = cfg.errorBlasterLaserReach ?? 900;
    const dmg = cfg.errorBlasterDamage ?? 22;

    const baseA = Math.atan2(target.y - this.y, target.x - this.x) + Math.PI;
    for (let i = 0; i < count; i++) {
      const a = baseA + (i - (count - 1) * 0.5) * 1.15;
      const dist = 125;
      const bx = Math.max(area.x + 24, Math.min(area.x + area.width - 24, target.x + Math.cos(a) * dist));
      const by = Math.max(area.y + 24, Math.min(area.y + area.height - 24, target.y + Math.sin(a) * dist));
      this.activeErrorBlasters.push({
        x: bx,
        y: by,
        angle: Math.atan2(target.y - by, target.x - bx),
        trackTarget: target,
        scale: 1.05,
        spawnScale: 0.25,
        isCharging: true,
        isFiring: false,
        chargeTimer: chargeMax + i * 4,
        chargeMax: chargeMax + i * 4,
        chargeProgress: 0,
        fireTimer: 0,
        fireMax,
        fireProgress: 0,
        beamWidth: beamW,
        reach,
        damage: dmg,
        firstHitSet: new Set(),
        tickTimers: new Map(),
      });
    }
    this._playAudio('gasterBlaster', 'Assets/Sound Effects/Sans/GasterBlaster.ogg', 0.78);
    return true;
  }

  _executeSkill1ById(pick, target, arena, cfg = this._cfg()) {
    this.skill1CooldownTimer = cfg.skill1Cooldown ?? 330;
    this.skill1CooldownMax = cfg.skill1Cooldown ?? 330;
    this._activeSkill1Id = pick;
    this.glitchCastHandsTimer = 26;

    const bounds = arena || { x: 45, y: 240, width: 450, height: 450 };

    if (pick === 'error_strings') {
      this._activeSkill1Label = cfg.errorStringsSkillName || 'BLUE STRINGS';
      const baseA = Math.atan2(target.y - this.y, target.x - this.x);
      const spd = cfg.errorStringsSpeed ?? 18.0;
      for (const offset of [-0.14, 0, 0.14]) {
        const a = baseA + offset;
        this.activeErrorStrings.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          latched: false,
          target: null,
          anchorX: this.x + Math.cos(baseA) * 85,
          anchorY: this.y + Math.sin(baseA) * 85,
          impactDamage: cfg.errorStringsDamage ?? 16,
          tickDamage: cfg.errorStringsTickDamage ?? 6,
          life: cfg.errorStringsDuration ?? 42,
          seed: Math.random() * 10,
        });
      }
      this._playRandomBadNoise(0.95);
    } else if (pick === 'error_blaster') {
      this._activeSkill1Label = cfg.errorBlasterSkillName || 'ERROR BLASTER';
      this._spawnErrorBlasterCrossfire(target, bounds, cfg);
    } else if (pick === 'glitch_zone') {
      this._activeSkill1Label = cfg.glitchZoneSkillName || 'GLITCH ZONE';
      const count = cfg.glitchZoneSpikeCount ?? 6;
      const warn = cfg.glitchZoneWarnFrames ?? 20;
      const active = cfg.glitchZoneActiveFrames ?? 36;
      const dmg = cfg.glitchZoneDamage ?? 18;
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2;
        const rad = i === 0 ? 0 : 54;
        const tx = Math.max(bounds.x + 24, Math.min(bounds.x + bounds.width - 24, target.x + Math.cos(ang) * rad));
        const ty = Math.max(bounds.y + 24, Math.min(bounds.y + bounds.height - 24, target.y + Math.sin(ang) * rad));
        this.activeErrorTraps.push({
          x: tx,
          y: ty,
          warnTimer: warn + Math.floor(i * 2),
          activeTimer: active,
          age: 0,
          damage: dmg,
          hitSet: new Set(),
        });
      }
      this._playAudio('warning', 'Assets/Sound Effects/Sans/Warning.ogg', 0.75);
      this._playRandomBadNoise(0.75);
    }
    return true;
  }

  _startForcedCrash(target, arena, cfg = this._cfg()) {
    this.crashHits = 0;
    this.isForcedCrashActive = true;
    this.forcedCrashCooldownTimer = cfg.forcedCrashCooldown ?? 0;
    this.glitchCastHandsTimer = 70;

    const castAngle = target ? Math.atan2(target.y - this.y, target.x - this.x) : (this.gunAngle || 0);
    this.skillCastAngle = castAngle;
    this.gunAngle = castAngle;

    const bounds = arena || { x: 45, y: 240, width: 450, height: 450 };
    const cx = target ? target.x : (bounds.x + bounds.width * 0.5);
    const cy = target ? target.y : (bounds.y + bounds.height * 0.5);

    this._forcedCrashSeq = {
      stage: 'bind',
      timer: 0,
      bindMax: cfg.forcedCrashBindFrames ?? 34,
      blastMax: cfg.forcedCrashBlastFrames ?? 34,
      cx,
      cy,
      blastersSpawned: false,
    };

    // Latch triple Cyan Error Strings onto the victim
    if (target) {
      for (let i = 0; i < 3; i++) {
        this.activeErrorStrings.push({
          x: target.x,
          y: target.y,
          vx: 0,
          vy: 0,
          latched: true,
          target,
          anchorX: cx,
          anchorY: cy,
          impactDamage: 0,
          tickDamage: 5,
          life: (cfg.forcedCrashBindFrames ?? 34) + 12,
          seed: i * 1.7,
        });
      }
    }

    spawnFloatingText(this.x, this.y - (this.r || 25) - 22, 'FORCED CRASH!', '#DD0000');
    triggerFighterSpeech(this, 'FORCED CRASH! bye-bye, au.', {
      duration: 120,
      force: true,
      preserveCase: true,
      borderColor: '#EE0000',
      blipSpeed: 0.88,
    });
    this._playRandomBadNoise(1.0);
    this._playAudio('flash', 'Assets/Sound Effects/Sans/Flash.ogg', 0.80);
  }

  _updateForcedCrashSeq(targets, arena, cfg) {
    const seq = this._forcedCrashSeq;
    if (!seq) {
      this.isForcedCrashActive = false;
      return;
    }

    const bounds = arena || { x: 45, y: 240, width: 450, height: 450 };
    seq.timer++;

    if (seq.stage === 'bind') {
      if (seq.timer % 6 === 0) {
        const wCount = Math.max(1, cfg.forcedCrashWindowCount ?? 5);
        if (this.activeGlitchWindows.length < wCount * 2) {
          this.activeGlitchWindows.push({
            x: seq.cx + (Math.random() - 0.5) * 140,
            y: seq.cy + (Math.random() - 0.5) * 140,
            w: 58,
            h: 24,
            text: Math.random() < 0.5 ? 'ERR // 404' : 'FATAL CRASH',
            color: Math.random() < 0.5 ? '#DD0000' : '#00A0FF',
            life: 26,
            maxLife: 26,
          });
        }
      }

      if (!seq.blastersSpawned && seq.timer >= 10) {
        seq.blastersSpawned = true;
        const bCount = cfg.forcedCrashBlasterCount ?? 2;
        const bScale = cfg.forcedCrashBlasterScale ?? 2.05;
        const bw = cfg.forcedCrashBlasterBeamWidth ?? 72;
        const dmg = cfg.forcedCrashBlasterDamage ?? 16;

        for (let i = 0; i < bCount; i++) {
          const ang = seq.timer + i * Math.PI * 0.75;
          const bx = Math.max(bounds.x + 26, Math.min(bounds.x + bounds.width - 26, seq.cx + Math.cos(ang) * 150));
          const by = Math.max(bounds.y + 26, Math.min(bounds.y + bounds.height - 26, seq.cy + Math.sin(ang) * 150));
          this.activeErrorBlasters.push({
            x: bx,
            y: by,
            angle: Math.atan2(seq.cy - by, seq.cx - bx),
            trackTarget: targets[0] || null,
            scale: bScale,
            spawnScale: 0.35,
            isCharging: true,
            isFiring: false,
            chargeTimer: Math.max(8, seq.bindMax - 12),
            chargeMax: Math.max(8, seq.bindMax - 12),
            chargeProgress: 0,
            fireTimer: 0,
            fireMax: seq.blastMax,
            fireProgress: 0,
            beamWidth: bw,
            reach: 950,
            damage: dmg,
            firstHitSet: new Set(),
            tickTimers: new Map(),
          });
        }
        this._playAudio('gasterBlaster', 'Assets/Sound Effects/Sans/GasterBlaster.ogg', 0.85);
      }

      if (seq.timer >= seq.bindMax) {
        seq.stage = 'blast';
        seq.timer = 0;
      }
    } else if (seq.stage === 'blast') {
      if (seq.timer >= seq.blastMax) {
        // Final Forced Crash Shockwave Slam
        this.activeShockwaveRipples.push({ x: seq.cx, y: seq.cy, maxRadius: 215, life: 28, maxLife: 28 });
        this._playAudio('slam', 'Assets/Sound Effects/Sans/Slam.ogg', 0.88);
        this._playAudio('explosion', 'Assets/Sound Effects/Attacks/explosion.mp3', 0.35);
        this._playRandomBadNoise(1.0);
        triggerGlobalScreenShake(9.5, 14);

        const slamDmg = cfg.forcedCrashSlamDamage ?? 38;
        const slamKb = cfg.forcedCrashKnockback ?? 14.5;
        for (const e of targets) {
          this._dealErrorDamage(e, slamDmg, { isAOE: true, isGuaranteedHit: true, applyKarma: true });
          const pushA = Math.atan2(e.y - this.y, e.x - this.x);
          e.vx = (e.vx || 0) + Math.cos(pushA) * slamKb;
          e.vy = (e.vy || 0) + Math.sin(pushA) * slamKb;
        }
        this._forcedCrashSeq = null;
        this.isForcedCrashActive = false;
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDERING PIPELINE (Rules 20, 21, 32, 35)
  // ═════════════════════════════════════════════════════════════════════════
  drawBody(ctx) {
    drawErrorSansSkin(ctx, this);
  }

  draw(ctx) {
    // 1. Chromatic Glitch Afterimages (Rule 25)
    for (let i = 0; i < this.afterImages.length; i++) {
      const ai = this.afterImages[i];
      const alpha = (ai.timer / Math.max(1, ai.maxTimer || 22)) * 0.48;
      drawErrorSansGhostSkin(ctx, this, ai.x, ai.y, ai.angle, alpha, ai.tintIndex || 0);
    }

    // 2. Arena Glitch Bone Traps & Strings under fighter
    for (let i = 0; i < this.activeErrorTraps.length; i++) {
      drawErrorBoneTrap(ctx, this.activeErrorTraps[i]);
    }
    drawErrorStringsVFX(ctx, this, this.activeErrorStrings);

    // 3. Body Circle + Floating ERROR Glitch Crown (Rule 32)
    this.drawBody(ctx);

    // 4. Canonical Puppet-String Hands when actively casting (Rule 20 — zero detached idle hands)
    if (this.glitchCastHandsTimer > 0 || this.isForcedCrashActive || this.activeErrorStrings.length > 0) {
      drawErrorSansWeaponPreview(ctx, this.x || 0, (this.y || 0) - (this.z || 0), this.gunAngle || 0, this.r || 25, { isPreview: false });
    }

    // 5. Projectiles, Error Blasters & Forced Crash Ripples/Windows
    for (let i = 0; i < this.activeErrorBones.length; i++) {
      drawErrorBoneProjectile(ctx, this.activeErrorBones[i]);
    }
    for (let i = 0; i < this.activeErrorBlasters.length; i++) {
      drawErrorGasterBlaster(ctx, this.activeErrorBlasters[i]);
    }
    drawForcedCrashVFX(ctx, this.activeGlitchWindows, this.activeShockwaveRipples);

    // 6. Rule 21 Mandatory In-Game Overhead HP & Freeze Timers + Undertale Speech Bubble
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
    drawSansSpeechBubble(ctx, this);
  }
}
