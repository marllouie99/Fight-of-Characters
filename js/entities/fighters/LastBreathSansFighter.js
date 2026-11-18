// ───────────────────────────────────────────────────────────────────────────
// LAST BREATH SANS ("An Enigmatic Encounter") — Combat Entity Class
// Adheres strictly to:
// - Rule 1.1: Freeze & TimeStop Early Exits
// - Rule 1.2: Centralized Physics via super.update()
// - Rule 1.4: Continuous 360° Aiming & Committed Cast Angle Lock
// - Rule 18: Unified Theme Color (#EF4444) & Toggle Gating
// - Rule 20: Canonical Hands only during active telekinesis/skill casts
// - Rule 21: In-Game Overlay HP & Status Drawing (drawHealth + drawFreezeTimer)
// - Rule 23: Basic Projectile Suppression (shoot override)
// - Rule 24: Universal Character Body Model Scale (preserve super(def) scaled r)
// - Rule 25: Non-Freezing Active Visual Effects Standard (top-of-update decay)
// - Rule 32: World-Space Skin Drawing & 2.0px Outer Black Outline
// ───────────────────────────────────────────────────────────────────────────

import { Fighter, applyDamageToTarget, isSkillEnabled } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { lastBreathSansConfig } from '../../configs/characters/lastBreathSansConfig.js';
import { state, spawnFloatingText, triggerGlobalScreenShake } from '../../core/state.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { spawnSparks } from '../../graphics/particles/sparkEffect.js';
import {
  drawLastBreathSansSkin,
  drawLastBreathSansGhostSkin,
  prewarmLastBreathSansSkin,
} from '../../graphics/fighters/lastBreathSansSkin.js';
import {
  resetSpeechState,
  triggerFighterSpeech,
  updateFighterSpeech,
  tickFighterIntroAndWinSpeech,
} from '../../systems/undertaleSpeech.js';
import { drawSansSpeechBubble } from '../../graphics/weapons/sansWeaponGraphics.js';
import { getBlasterTargetBlockRadius, computeEffectiveBlasterReach } from './SansFighter.js';
import {
  drawLastBreathSansWeaponPreview,
  drawLastBreathGasterBlaster,
  drawLastBreathBoneProjectile,
  drawLastBreathBoneTrap,
  drawGasterHandTurret,
  drawGasterBulletProjectile,
  drawEnigmaticFinaleVFX,
  prewarmLastBreathSansVfx,
} from '../../graphics/weapons/lastBreathSansWeaponGraphics.js';

export class LastBreathSansFighter extends Fighter {
  constructor(def = {}) {
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.last_breath_sans)
      ? CONFIG.last_breath_sans
      : lastBreathSansConfig;

    // Rule 24: Preserve scaled radius from super(def); NEVER overwrite this.r afterward
    super({
      ...def,
      r: def.r ?? cfg.r ?? 25,
      radius: def.radius ?? cfg.radius ?? 25,
      hp: def.hp ?? cfg.hp ?? 1,
      maxHp: def.maxHp ?? cfg.maxHp ?? 1,
      speed: def.speed ?? cfg.speed ?? 5.7,
      damage: def.damage ?? cfg.basicBoneDamage ?? 11,
      cooldown: def.cooldown ?? cfg.basicAttackCooldown ?? 52,
      color: def.color || cfg.color || '#EF4444',
    });

    this.characterId = 'last_breath_sans';
    this.type = 'last_breath_sans';
    this.name = def?.name || cfg.name || 'Last Breath Sans';
    this.displayName = def?.displayName || cfg.displayName || 'LAST BREATH SANS';
    this.grade = cfg.grade || 'SS';
    this.title = cfg.title || 'An Enigmatic Encounter';
    this.color = cfg.color || '#EF4444';
    this.themeColor = cfg.themeColor || '#EF4444';
    this.secondaryColor = cfg.secondaryColor || '#00E5FF';
    this.damageNumberColor = cfg.damageNumberColor || '#EF4444';
    this.baseMoveSpeed = def.moveSpeed ?? cfg.moveSpeed ?? cfg.speed ?? 5.7;
    this.moveSpeed = this.baseMoveSpeed;
    this.speed = this.baseMoveSpeed;
    this.hp = (def.hp !== undefined) ? def.hp : (cfg.hp !== undefined ? cfg.hp : 1);
    this.maxHp = this.hp;

    this._initLastBreathState(cfg);
  }

  _cfg() {
    return (typeof CONFIG !== 'undefined' && CONFIG.last_breath_sans)
      ? CONFIG.last_breath_sans
      : lastBreathSansConfig;
  }

  /**
   * Rule 35 pre-battle hook invoked by prewarmMatchAssets() before Round 1 starts.
   * Pre-bakes all 3 phase skin textures, ghost canvases, glow sprites & Color Bones.
   */
  prewarmAssets(targetCtx = null) {
    const skinCount = prewarmLastBreathSansSkin(this.r || 30, targetCtx);
    const vfxCount = prewarmLastBreathSansVfx(targetCtx);
    return skinCount + vfxCount;
  }

  _registerCooldownExclusions() {
    if (!this.skillManager || !this.skillManager.cooldownKeyMap) return;
    const keys = [
      'dodgeCooldown',
      'basicAttackCooldownTimer',
      'skill1CooldownTimer',
      'enigmaticFinaleCooldownTimer',
    ];
    for (const k of keys) {
      this.skillManager.cooldownKeyMap.set(k, true);
    }
  }

  _initLastBreathState(cfg = this._cfg()) {
    this._vfxTick = 0;
    this._afterImageTick = 0;
    this.afterImages = [];

    // 3-Phase Last Breath Progression
    this.lastBreathPhase = 1;
    this._revivePhase3Used = false;

    // Passive 1: 1 HP + Last Breath Stamina
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
    this.skillCastHandsTimer = 0;

    // Passive 2: Karmic Retribution (KR)
    this.karmaTargets = new Map();

    // Basic Attack
    this.basicAttackCooldownTimer = cfg.basicAttackInitialCooldown ?? 16;
    this.shootCooldownMax = 0;
    this.shootCooldown = 999999;

    // Unified Skill 1 Slot
    this.skill1CooldownTimer = cfg.skill1InitialCooldown ?? 95;
    this.skill1CooldownMax = cfg.skill1Cooldown ?? 300;
    this._activeSkill1Id = null;
    this._activeSkill1Label = null;
    this.isSkill1Channeling = false;

    this.activeBlasters = [];
    this.activeBones = [];
    this.activeBoneTraps = [];
    this.activeGasterHands = [];
    this.activeGasterBullets = [];
    this.activeShockwaveRipples = [];

    // Ultimate: AN ENIGMATIC ENCOUNTER
    this.finaleHits = 0;
    this.isEnigmaticFinaleActive = false;
    this.enigmaticFinaleCooldownTimer = cfg.enigmaticFinaleCooldown ?? 0;
    this._finaleSeq = null;
    this.skillCastAngle = 0;

    const baseSpd = this.baseMoveSpeed || cfg.moveSpeed || cfg.speed || 5.7;
    this.moveSpeed = baseSpd;
    this.speed = baseSpd;

    resetSpeechState(this);
    this._registerCooldownExclusions();
  }

  reset() {
    super.reset();
    this._initLastBreathState(this._cfg());
  }

  _playAudio(key, fallbackPath, defaultVol = 0.78, speed = 1.0) {
    if (typeof audioSystem === 'undefined' || !audioSystem.playSFX) return;
    const cfg = this._cfg();
    const src = cfg.sounds?.[key] || fallbackPath;
    const vol = cfg.soundVolumes?.[key] ?? defaultVol;
    audioSystem.playSFX(src, vol, speed, 0);
  }

  /**
   * Rule 23: Suppress base Fighter generic bullet projectiles.
   */
  shoot() {
    // Intentionally empty: Last Breath Sans uses Bone Volleys, Cracked Blasters & Gaster Hands.
  }

  /**
   * Rule 1.4: Lock aim during Enigmatic Encounter ultimate sequence.
   */
  canAim() {
    if (this.isEnigmaticFinaleActive) return false;
    return super.canAim();
  }

  isStationarySkillActive() {
    return Boolean(
      this.isEnigmaticFinaleActive ||
      (this.dodgeStallTimer && this.dodgeStallTimer > 0) ||
      super.isStationarySkillActive?.()
    );
  }

  _getPhaseCooldownMult(cfg = this._cfg()) {
    if (this.lastBreathPhase >= 3) return cfg.phase3CooldownMult ?? 0.74;
    if (this.lastBreathPhase === 2) return cfg.phase2CooldownMult ?? 0.86;
    return 1.0;
  }

  _syncPhaseSpeed(cfg = this._cfg()) {
    const baseSpd = this.baseMoveSpeed || cfg.moveSpeed || cfg.speed || 5.7;
    const mult = this.lastBreathPhase >= 3
      ? (cfg.phase3SpeedMult ?? 1.16)
      : (this.lastBreathPhase === 2 ? (cfg.phase2SpeedMult ?? 1.08) : 1.0);
    this.moveSpeed = baseSpd * mult;
    this.speed = this.moveSpeed;
  }

  _awakenPhase2(cfg = this._cfg()) {
    if (this.lastBreathPhase >= 2) return false;
    this.lastBreathPhase = 2;
    this._syncPhaseSpeed(cfg);
    const bonus = cfg.phase2StaminaBonus ?? 12;
    if (bonus > 0) {
      this.stamina = Math.min(this.maxStamina, (this.stamina || 0) + bonus);
    }
    this.activeShockwaveRipples.push({ x: this.x, y: this.y, maxRadius: 120, life: 22, maxLife: 22 });
    spawnFloatingText(this.x, this.y - (this.r || 25) - 24, 'PHASE 2: THE SLAUGHTER CONTINUES!', '#EF4444');
    this._playAudio('flash', 'Assets/Sound Effects/Sans/Flash.ogg', 0.85);
    this._playAudio('dark', 'Assets/Sound Effects/LastBreathSans/dark.ogg', 0.82);
    triggerGlobalScreenShake(5.0, 8);
    triggerFighterSpeech(this, "i can't afford not to care anymore.", {
      duration: 110,
      force: true,
      preserveCase: true,
      borderColor: '#EF4444',
    });
    return true;
  }

  _awakenPhase3(attacker = null, cfg = this._cfg()) {
    if (this._revivePhase3Used) return false;
    this._revivePhase3Used = true;
    this.lastBreathPhase = 3;
    this._syncPhaseSpeed(cfg);

    const reviveStamina = cfg.phase3ReviveStamina ?? 40;
    this.stamina = Math.min(this.maxStamina, Math.max(reviveStamina, (this.stamina || 0) + reviveStamina));
    this.dodgeCooldown = 0;
    this.isTimeStopped = false;
    this.timeStopTimer = 0;
    this.isStunned = false;
    this.stunTimer = 0;

    // Unlock Enigmatic Encounter & summon Twin Phase 3 Gaster Hands immediately
    const req = Math.max(1, cfg.finaleHitsRequired ?? 5);
    this.finaleHits = req;
    this.skillCastHandsTimer = Math.max(this.skillCastHandsTimer || 0, 32);

    this.activeShockwaveRipples.push({ x: this.x, y: this.y, maxRadius: 175, life: 26, maxLife: 26 });
    spawnSparks(this.x, this.y, 12, 'crimson', { color: '#EF4444' });
    spawnSparks(this.x, this.y, 8, 'cyan', { color: '#00E5FF' });
    spawnFloatingText(this.x, this.y - (this.r || 25) - 26, 'PHASE 3: ENIGMATIC ENCOUNTER!', '#FF9500');
    this._playAudio('dark', 'Assets/Sound Effects/LastBreathSans/dark.ogg', 0.92);
    this._playAudio('flash', 'Assets/Sound Effects/Sans/Flash.ogg', 0.88);
    triggerGlobalScreenShake(8.0, 12);
    triggerFighterSpeech(this, "remember, son... dying is gay. let's finish this.", {
      duration: 120,
      force: true,
      preserveCase: true,
      borderColor: '#FF9500',
    });

    const target = attacker && attacker.hp > 0 ? attacker : this._getAllEnemyTargets(null)[0];
    const bounds = (typeof state !== 'undefined' && state.arena)
      ? state.arena
      : { x: 45, y: 240, width: 450, height: 450 };
    if (target) {
      this._spawnGasterHandTurrets(target, bounds, cfg, true);
    }
    return true;
  }

  _getAllEnemyTargets(opponent = null) {
    const out = [];
    const seen = new Set();
    const candidates = [
      opponent,
      ...(typeof state !== 'undefined' && Array.isArray(state.fighters) ? state.fighters : []),
      ...(typeof state !== 'undefined' && Array.isArray(state.illusions) ? state.illusions : []),
    ];
    for (const t of candidates) {
      if (!t || t === this || seen.has(t) || t.hp <= 0 || t.dead || t.isDead) continue;
      if (this.team !== undefined && this.team !== null && t.team === this.team) continue;
      if (typeof this.isTeammate === 'function' && this.isTeammate(t)) continue;
      seen.add(t);
      out.push(t);
    }
    return out;
  }

  _dealLastBreathDamage(target, amount, opts = {}) {
    if (!target || target.hp <= 0 || target.dead || target.isDead || target.invulnerable) return false;
    const damageOpts = { skipInterrupt: true, ...opts };
    const dealt = applyDamageToTarget(target, amount, this, damageOpts);
    if (dealt && opts.applyKarma) {
      this._applyKarma(target);
    }
    if (dealt && opts.incrementUlt && !this.isEnigmaticFinaleActive) {
      const req = Math.max(1, this._cfg().finaleHitsRequired ?? 5);
      this.finaleHits = Math.min(req, (this.finaleHits || 0) + 1);
    }
    return Boolean(dealt);
  }

  _applyKarma(target) {
    const cfg = this._cfg();
    if (!isSkillEnabled(cfg.enableKarma, true) || !target || target.hp <= 0) return;
    if (!this.karmaTargets) this.karmaTargets = new Map();
    const maxStacks = cfg.karmaMaxStacks ?? 10;
    const dur = cfg.karmaDuration ?? 85;
    const interval = cfg.karmaTickInterval ?? 20;
    const cur = this.karmaTargets.get(target);
    if (cur) {
      cur.stacks = Math.min(maxStacks, cur.stacks + 1);
      cur.timer = dur;
    } else {
      this.karmaTargets.set(target, { stacks: 1, timer: dur, tickTimer: interval });
    }
  }

  _updateKarmaTargets(cfg) {
    if (!this.karmaTargets || this.karmaTargets.size === 0) return;
    const tickInterval = cfg.karmaTickInterval ?? 20;
    const tickDmg = cfg.karmaTickDamage ?? 1.5;

    for (const [target, info] of this.karmaTargets.entries()) {
      if (!target || target.hp <= 0 || target.dead || target.isDead || info.timer <= 0) {
        this.karmaTargets.delete(target);
        continue;
      }
      info.timer--;
      info.tickTimer--;
      if (info.tickTimer <= 0) {
        info.tickTimer = tickInterval;
        const dmg = Math.max(1, Math.round(tickDmg * (0.6 + info.stacks * 0.2)));
        applyDamageToTarget(target, dmg, this, { skipInterrupt: true, isKarma: true, bypassDodge: false });
      }
    }
  }

  _calculateDodgeStaminaCost(damageVal, isSukunaDomainActive = false) {
    const cfg = this._cfg();
    if (isSukunaDomainActive) return cfg.domainDodgeStaminaCost ?? 1;
    const mult = cfg.damageStaminaCostMultiplier ?? 0.09;
    const minCost = cfg.minDodgeStaminaCost ?? 1;
    const dmg = (typeof damageVal === 'number' && Number.isFinite(damageVal) && damageVal > 0) ? damageVal : 10;
    return Math.max(minCost, Math.round(dmg * mult));
  }

  _executeShadowStepDodge(startX, startY, targetX, targetY, attacker) {
    const cfg = this._cfg();
    const bounds = (typeof state !== 'undefined' && state.arena)
      ? state.arena
      : { x: 45, y: 240, width: 450, height: 450 };
    const r = this.r || 25;
    const finalX = Math.max(bounds.x + r + 14, Math.min(bounds.x + bounds.width - r - 14, targetX));
    const finalY = Math.max(bounds.y + r + 14, Math.min(bounds.y + bounds.height - r - 14, targetY));
    const oldAngle = this.gunAngle || 0;

    for (let g = 0; g < 3; g++) {
      const t = g * 0.34;
      this.afterImages.push({
        x: startX + (finalX - startX) * t,
        y: startY + (finalY - startY) * t,
        angle: oldAngle,
        timer: (cfg.afterImageLife ?? 22) - g * 3,
        maxTimer: cfg.afterImageLife ?? 22,
        phase: this.lastBreathPhase,
      });
    }

    this.x = finalX;
    this.y = finalY;
    this.vx = 0;
    this.vy = 0;
    this.dodgeStallTimer = cfg.dodgeStallDuration ?? 11;

    if (attacker && Number.isFinite(attacker.x) && Number.isFinite(attacker.y) && typeof this.aim === 'function') {
      this.aim(attacker);
    }

    // Check Phase 2 awakening threshold after stamina burn
    if (this.lastBreathPhase < 2 && this.stamina <= (cfg.phase2StaminaThreshold ?? 62)) {
      this._awakenPhase2(cfg);
    }

    const missCol = this.lastBreathPhase >= 3 ? '#FF9500' : '#00E5FF';
    spawnFloatingText(finalX, finalY - r - 14, 'MISS', missCol);
    this._playAudio('biu', 'Assets/Sound Effects/LastBreathSans/biu.ogg', 0.64, 0.96 + Math.random() * 0.12);

    const lines = this.lastBreathPhase >= 3
      ? ['not done yet.', "you can't stop us.", 'one last breath.']
      : ['nope.', 'too slow, kid.', 'did you really think?'];
    triggerFighterSpeech(this, lines[(this.dodgeCount || 0) % lines.length], {
      duration: 80,
      preserveCase: true,
      borderColor: this.lastBreathPhase >= 3 ? '#EF4444' : '#00E5FF',
    });

    // Counter-punish with 2 Cracked Blasters on dodge (up to buffer limit)
    const counterTarget = (attacker && attacker !== this && attacker.hp > 0 && Number.isFinite(attacker.x))
      ? attacker
      : this._getAllEnemyTargets(null)[0];
    if (counterTarget && this.activeBlasters.length < 10) {
      this.skillCastHandsTimer = Math.max(this.skillCastHandsTimer || 0, 18);
      this._spawnCrackedBlasterBarrage(counterTarget, bounds, cfg, 2);
    }
  }

  dodgeSliceLine(lineData = {}) {
    const cfg = this._cfg();
    if (!isSkillEnabled(cfg.enableLastBreathDodge, true)) return false;
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
    this.dodgeCooldown = cfg.dodgeCooldown ?? 0;
    this.dodgeCount++;

    const angle = lineData.angle || 0;
    const nx = lineData.normalX !== undefined ? lineData.normalX : -Math.sin(angle);
    const ny = lineData.normalY !== undefined ? lineData.normalY : Math.cos(angle);
    const sideSign = Math.random() < 0.5 ? 1 : -1;
    const dist = cfg.dodgeDistance ?? 148;
    this._executeShadowStepDodge(this.x, this.y, this.x + nx * sideSign * dist, this.y + ny * sideSign * dist, lineData.attacker);
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
    const canDodge = !isGhost && isSkillEnabled(cfg.enableLastBreathDodge, true) && !isFrozen && hasStamina && cooldownReady && rollsDodge;

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

      const warpDist = cfg.dodgeDistance ?? 148;
      const baseAngle = attacker && Number.isFinite(attacker.x)
        ? Math.atan2(this.y - attacker.y, this.x - attacker.x) + (Math.random() < 0.5 ? 1 : -1) * (Math.PI * 0.45)
        : Math.random() * Math.PI * 2;
      this._executeShadowStepDodge(this.x, this.y, this.x + Math.cos(baseAngle) * warpDist, this.y + Math.sin(baseAngle) * warpDist, attacker);
      return 0;
    }

    // Iconic Last Breath Phase 3 Second Wind: First mortal hit awakens Phase 3 instead of immediate defeat
    const canPhase3Revive = Boolean(
      !isGhost &&
      !opts.isHeal &&
      !opts.bypassPhase3 &&
      !this._revivePhase3Used &&
      isSkillEnabled(cfg.enablePhase3Awaken, true) &&
      (amount > 0 || incomingDmg > 0)
    );
    if (canPhase3Revive) {
      this._awakenPhase3(attacker, cfg);
      const warpDist = cfg.dodgeDistance ?? 148;
      const evadeAng = attacker && Number.isFinite(attacker.x)
        ? Math.atan2(this.y - attacker.y, this.x - attacker.x)
        : Math.random() * Math.PI * 2;
      const bounds = (typeof state !== 'undefined' && state.arena)
        ? state.arena
        : { x: 45, y: 240, width: 450, height: 450 };
      const r = this.r || 25;
      this.x = Math.max(bounds.x + r + 14, Math.min(bounds.x + bounds.width - r - 14, this.x + Math.cos(evadeAng) * warpDist));
      this.y = Math.max(bounds.y + r + 14, Math.min(bounds.y + bounds.height - r - 14, this.y + Math.sin(evadeAng) * warpDist));
      return 0;
    }

    const dealt = super.takeDamage(amount, attacker, opts);
    if (this.hp <= 0) {
      if (typeof state !== 'undefined') state._hadSansDeath = true;
    }
    return dealt;
  }

  interruptAttacks(forceCancelAll = false) {
    if (forceCancelAll) {
      this._finaleSeq = null;
      this.isEnigmaticFinaleActive = false;
      this.isSkill1Channeling = false;
      this.activeBlasters.length = 0;
      this.activeBones.length = 0;
      this.activeBoneTraps.length = 0;
      this.activeGasterHands.length = 0;
      this.activeGasterBullets.length = 0;
      this.activeShockwaveRipples.length = 0;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RULE 25: TOP-OF-UPDATE NON-FREEZING VFX DECAY (BEFORE _handleTimeStop)
  // ═════════════════════════════════════════════════════════════════════════
  _updateAllVfxLifecycles(arena) {
    const cfg = this._cfg();
    const bounds = arena || (typeof state !== 'undefined' && state.arena) || { x: 45, y: 240, width: 450, height: 450 };
    const enemies = this._getAllEnemyTargets(null);

    this._vfxTick++;
    if (this.skillCastHandsTimer > 0) this.skillCastHandsTimer--;

    this._updateAfterImages();
    this._updateRipples();
    this._updateBones(enemies, bounds, cfg);
    this._updateBoneTraps(enemies, cfg);
    this._updateBlasters(enemies, cfg);
    this._updateGasterHands(enemies, cfg);
    this._updateGasterBullets(enemies, bounds, cfg);
  }

  _updateAfterImages() {
    for (let i = this.afterImages.length - 1; i >= 0; i--) {
      const ai = this.afterImages[i];
      ai.timer--;
      if (ai.timer <= 0) {
        this.afterImages[i] = this.afterImages[this.afterImages.length - 1];
        this.afterImages.pop();
      }
    }
  }

  _updateRipples() {
    for (let i = this.activeShockwaveRipples.length - 1; i >= 0; i--) {
      const sw = this.activeShockwaveRipples[i];
      sw.life--;
      if (sw.life <= 0) {
        this.activeShockwaveRipples[i] = this.activeShockwaveRipples[this.activeShockwaveRipples.length - 1];
        this.activeShockwaveRipples.pop();
      }
    }
  }

  _updateBones(enemies, bounds, cfg) {
    for (let i = this.activeBones.length - 1; i >= 0; i--) {
      const b = this.activeBones[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      let hit = false;
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        const blockR = getBlasterTargetBlockRadius(e);
        const hitDist = blockR > 0 ? blockR : ((e.r || 25) + 10);
        if (Math.hypot(e.x - b.x, (e.y - (e.z || 0)) - b.y) <= hitDist) {
          hit = true;
          if (blockR <= 0) {
            const dealt = this._dealLastBreathDamage(e, b.damage, {
              applyKarma: true,
              incrementUlt: Boolean(b.fromBasic),
            });
            if (dealt && b.boneColor === 'blue' && Math.hypot(e.vx || 0, e.vy || 0) > 2.2) {
              if (typeof e.applyStun === 'function') e.applyStun(cfg.colorBoneFreezeFrames ?? 12);
            } else if (dealt && b.boneColor === 'orange') {
              this._applyKarma(e);
            }
          } else {
            spawnSparks(b.x, b.y, 4, 'cyan', { color: '#00E5FF' });
          }
          break;
        }
      }

      const offscreen =
        b.x < bounds.x - 40 ||
        b.x > bounds.x + bounds.width + 40 ||
        b.y < bounds.y - 40 ||
        b.y > bounds.y + bounds.height + 40;
      if (hit || b.life <= 0 || offscreen) {
        this.activeBones[i] = this.activeBones[this.activeBones.length - 1];
        this.activeBones.pop();
      }
    }
  }

  _updateBoneTraps(enemies, cfg) {
    for (let i = this.activeBoneTraps.length - 1; i >= 0; i--) {
      const trap = this.activeBoneTraps[i];
      if (trap.warnTimer > 0) {
        trap.warnTimer--;
        if (trap.warnTimer === 0) {
          this._playAudio('boneStab', 'Assets/Sound Effects/Sans/BoneStab.ogg', 0.72);
        }
      } else {
        trap.activeTimer--;
        if (!trap.hasDamaged) {
          trap.hasDamaged = true;
          for (let j = 0; j < enemies.length; j++) {
            const e = enemies[j];
            if (Math.hypot(e.x - trap.x, (e.y - (e.z || 0)) - trap.y) <= (e.r || 25) + 20) {
              this._dealLastBreathDamage(e, trap.damage ?? cfg.boneCageDamage ?? 18, { applyKarma: true });
            }
          }
        }
      }

      if (trap.warnTimer <= 0 && trap.activeTimer <= 0) {
        this.activeBoneTraps[i] = this.activeBoneTraps[this.activeBoneTraps.length - 1];
        this.activeBoneTraps.pop();
      }
    }
  }

  _updateBlasters(enemies, cfg) {
    for (let i = this.activeBlasters.length - 1; i >= 0; i--) {
      const bl = this.activeBlasters[i];
      bl._age = (bl._age || 0) + 1;
      bl.spawnScale = Math.min(1.0, (bl.spawnScale || 0.4) + 0.14);

      if (bl.isCharging) {
        bl.chargeTimer--;
        bl.chargeProgress = 1 - Math.max(0, bl.chargeTimer / Math.max(1, bl.chargeMax || 20));
        if (bl.trackTarget && bl.trackTarget.hp > 0 && bl.chargeTimer > 4) {
          bl.angle = Math.atan2((bl.trackTarget.y - (bl.trackTarget.z || 0)) - bl.y, bl.trackTarget.x - bl.x);
        }
        if (bl.chargeTimer <= 0) {
          bl.isCharging = false;
          bl.isFiring = true;
          bl.fireTimer = bl.fireMax || cfg.blasterFireFrames || 24;
          bl.fireProgress = 0;
          this._playAudio(bl.scale > 1.5 ? 'gasterBlast2' : 'gasterBlast', 'Assets/Sound Effects/Sans/GasterBlast.ogg', 0.80);
          triggerGlobalScreenShake(bl.scale > 1.5 ? 6.5 : 3.2, 6);
        }
      } else if (bl.isFiring) {
        bl.fireTimer--;
        bl.fireProgress = 1 - Math.max(0, bl.fireTimer / Math.max(1, bl.fireMax || 24));
        bl.effectiveReach = computeEffectiveBlasterReach(bl, this, enemies, bl.reach || 920, bl.beamWidth || 34);
        this._checkBlasterHits(bl, enemies, cfg);
        if (bl.fireTimer <= 0) {
          bl.isFiring = false;
        }
      }

      if (!bl.isCharging && !bl.isFiring) {
        this.activeBlasters[i] = this.activeBlasters[this.activeBlasters.length - 1];
        this.activeBlasters.pop();
      }
    }
  }

  _checkBlasterHits(bl, enemies, cfg) {
    if (!bl || !bl.isFiring) return;
    const reach = (bl.effectiveReach !== undefined) ? bl.effectiveReach : (bl.reach || 920);
    const halfW = (bl.beamWidth || 34) * 0.5;
    const cosA = Math.cos(bl.angle || 0);
    const sinA = Math.sin(bl.angle || 0);
    const tickInterval = cfg.blasterTickInterval ?? 6;
    const contRatio = cfg.blasterContinuousRatio ?? 0.35;
    if (!bl.firstHitSet) bl.firstHitSet = new Set();
    if (!bl.tickTimers) bl.tickTimers = new Map();

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      const dx = e.x - bl.x;
      const dy = (e.y - (e.z || 0)) - bl.y;
      const proj = dx * cosA + dy * sinA;
      const perp = Math.abs(-dx * sinA + dy * cosA);
      const hitDist = halfW + (e.r || 25);

      if (proj >= -10 && proj <= reach && perp <= hitDist) {
        const isFirst = !bl.firstHitSet.has(e);
        if (isFirst) {
          bl.firstHitSet.add(e);
          bl.tickTimers.set(e, tickInterval);
          const dealt = this._dealLastBreathDamage(e, bl.damage || cfg.blasterDamage || 7, { isBeam: true, applyKarma: true });
          if (dealt && (cfg.blasterStaminaRecoverOnHit ?? 0.5) > 0) {
            this.stamina = Math.min(this.maxStamina, this.stamina + (cfg.blasterStaminaRecoverOnHit ?? 0.5));
          }
        } else {
          const curT = (bl.tickTimers.get(e) ?? 0) - 1;
          if (curT <= 0) {
            bl.tickTimers.set(e, tickInterval);
            this._dealLastBreathDamage(e, Math.max(1, Math.round((bl.damage || 7) * contRatio)), { isBeam: true, applyKarma: true });
          } else {
            bl.tickTimers.set(e, curT);
          }
        }
      }
    }
  }

  _updateGasterHands(enemies, cfg) {
    const target = enemies[0] || null;
    for (let i = this.activeGasterHands.length - 1; i >= 0; i--) {
      const h = this.activeGasterHands[i];
      h.life--;
      h.age = (h.age || 0) + 1;
      h.bobAngle = Math.sin(h.age * 0.14 + (h.side || 1)) * 0.18;
      h.y = h.baseY + Math.sin(h.age * 0.11 + (h.side || 1)) * 10;

      h.fireTimer--;
      if (h.fireTimer <= 0 && target && h.life > 10) {
        h.fireTimer = h.fireInterval || cfg.gasterHandFireInterval || 18;
        const aim = Math.atan2((target.y - (target.z || 0)) - h.y, target.x - h.x);
        const spd = cfg.gasterBulletSpeed ?? 8.6;
        this.activeGasterBullets.push({
          x: h.x,
          y: h.y,
          vx: Math.cos(aim) * spd,
          vy: Math.sin(aim) * spd,
          angle: aim,
          damage: cfg.gasterBulletDamage ?? 8,
          life: 95,
        });
        this._playAudio('biu', 'Assets/Sound Effects/LastBreathSans/biu.ogg', 0.58, 1.04 + Math.random() * 0.12);
      }

      if (h.life <= 0) {
        this.activeGasterHands[i] = this.activeGasterHands[this.activeGasterHands.length - 1];
        this.activeGasterHands.pop();
      }
    }
  }

  _updateGasterBullets(enemies, bounds, cfg) {
    for (let i = this.activeGasterBullets.length - 1; i >= 0; i--) {
      const b = this.activeGasterBullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      let hit = false;
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        const blockR = getBlasterTargetBlockRadius(e);
        const hitDist = blockR > 0 ? blockR : ((e.r || 25) + 8);
        if (Math.hypot(e.x - b.x, (e.y - (e.z || 0)) - b.y) <= hitDist) {
          hit = true;
          if (blockR <= 0) {
            this._dealLastBreathDamage(e, b.damage ?? cfg.gasterBulletDamage ?? 8, { applyKarma: true });
          } else {
            spawnSparks(b.x, b.y, 3, 'gold', { color: '#FACC15' });
          }
          break;
        }
      }

      const offscreen =
        b.x < bounds.x - 30 ||
        b.x > bounds.x + bounds.width + 30 ||
        b.y < bounds.y - 30 ||
        b.y > bounds.y + bounds.height + 30;
      if (hit || b.life <= 0 || offscreen) {
        this.activeGasterBullets[i] = this.activeGasterBullets[this.activeGasterBullets.length - 1];
        this.activeGasterBullets.pop();
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // MAIN COMBAT UPDATE LOOP (Rule 1.1 & Rule 1.2)
  // ═════════════════════════════════════════════════════════════════════════
  update(opponent, ownerIndex, arena) {
    const cfg = this._cfg();

    // 0. Rule 25: Always decay transient VFX & projectiles BEFORE freeze check
    this._updateAllVfxLifecycles(arena);

    // 1. Rule 1.1: Mandatory Freeze & TimeStop Early Exit
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks();
      return;
    }

    if (this.dodgeCooldown > 0) this.dodgeCooldown--;
    if (this._shotgunDodgeGraceTimer > 0) this._shotgunDodgeGraceTimer--;
    if (this.dodgeStallTimer > 0) this.dodgeStallTimer--;

    updateFighterSpeech(this);
    const targets = this._getAllEnemyTargets(opponent);
    const primary = targets[0] || opponent;
    tickFighterIntroAndWinSpeech(this, primary, {
      introLines: ["it's a beautiful day outside.", 'what happened?', "now it's too late. you will face your consequences."],
      winLines: ['that was for papyrus.', 'stay determined... somewhere else.'],
      borderColor: '#EF4444',
    });

    this._updateKarmaTargets(cfg);

    if (this.basicAttackCooldownTimer > 0) this.basicAttackCooldownTimer--;
    if (this.skill1CooldownTimer > 0) this.skill1CooldownTimer--;
    if (this.enigmaticFinaleCooldownTimer > 0) this.enigmaticFinaleCooldownTimer--;

    const bounds = arena || (typeof state !== 'undefined' && state.arena) || { x: 45, y: 240, width: 450, height: 450 };

    if (this.isEnigmaticFinaleActive) {
      this._updateEnigmaticFinaleSeq(targets, bounds, cfg);
    } else if (primary && primary.hp > 0) {
      if (typeof this.aim === 'function') this.aim(primary);

      const finaleReq = Math.max(1, cfg.finaleHitsRequired ?? 5);
      if (isSkillEnabled(cfg.enableEnigmaticFinale, true) && (this.finaleHits || 0) >= finaleReq && this.enigmaticFinaleCooldownTimer <= 0) {
        this._startEnigmaticFinale(primary, bounds, cfg);
      } else if (isSkillEnabled(cfg.enableSkill1, true) && this.skill1CooldownTimer <= 0) {
        this._castRandomSkill1(primary, bounds, cfg);
      } else if (isSkillEnabled(cfg.enableBasicBone, true) && this.basicAttackCooldownTimer <= 0) {
        this._fireBasicBoneVolley(primary, cfg);
      }
    }

    // Shadow-step speed afterimages
    this._recordMoveAfterimage(cfg);

    // Delegate movement & wall bounce to centralized Fighter physics (Rule 1.2)
    super.update(opponent, ownerIndex, arena);
  }

  _recordMoveAfterimage(cfg) {
    const spd = Math.hypot(this.vx || 0, this.vy || 0);
    const minSpd = cfg.afterImageMinSpeed ?? 4.2;
    const interval = cfg.afterImageInterval ?? 3;
    if (spd < minSpd || this.dodgeStallTimer > 0) return;
    this._afterImageTick++;
    if (this._afterImageTick % interval !== 0) return;
    if (this.afterImages.length >= 6) return;
    this.afterImages.push({
      x: this.x,
      y: this.y,
      angle: this.gunAngle || 0,
      timer: 14,
      maxTimer: 14,
      phase: this.lastBreathPhase,
    });
  }

  _fireBasicBoneVolley(target, cfg) {
    const aim = Math.atan2((target.y - (target.z || 0)) - this.y, target.x - this.x);
    const count = cfg.basicBoneCount ?? 3;
    const spread = cfg.basicBoneSpread ?? 0.24;
    const spd = cfg.basicBoneSpeed ?? 9.8;
    const dmg = cfg.basicBoneDamage ?? 11;
    const life = cfg.basicBoneLife ?? 56;

    for (let i = 0; i < count; i++) {
      const offset = count === 1 ? 0 : (i / (count - 1) - 0.5) * spread;
      const a = aim + offset;
      let boneColor = null;
      if (this.lastBreathPhase >= 2 && i !== 1) {
        boneColor = (i === 0) ? 'blue' : 'orange';
      }
      this.activeBones.push({
        x: this.x + Math.cos(a) * ((this.r || 25) + 6),
        y: (this.y - (this.z || 0)) + Math.sin(a) * ((this.r || 25) + 6),
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        angle: a,
        damage: dmg,
        life,
        boneColor,
        fromBasic: true,
      });
    }

    this.skillCastHandsTimer = Math.max(this.skillCastHandsTimer || 0, 14);
    const baseCd = cfg.basicAttackCooldown ?? 52;
    this.basicAttackCooldownTimer = Math.max(20, Math.round(baseCd * this._getPhaseCooldownMult(cfg)));
    this._playAudio('boneStab', 'Assets/Sound Effects/Sans/BoneStab.ogg', 0.68, 1.05);
  }

  _castRandomSkill1(target, bounds, cfg) {
    const pool = [];
    if (isSkillEnabled(cfg.enableCrackedBlaster, true)) pool.push('cracked_blaster');
    if (isSkillEnabled(cfg.enableGasterHands, true)) pool.push('gaster_hands');
    if (isSkillEnabled(cfg.enableBoneCage, true)) pool.push('bone_cage');
    if (pool.length === 0) return false;

    const filtered = pool.length > 1 ? pool.filter(id => id !== this._activeSkill1Id) : pool;
    const chosen = filtered[Math.floor(Math.random() * filtered.length)];
    this._executeSkill1ById(chosen, target, bounds, cfg);
    this.skill1CooldownTimer = Math.max(120, Math.round((cfg.skill1Cooldown ?? 300) * this._getPhaseCooldownMult(cfg)));
    this.skill1CooldownMax = this.skill1CooldownTimer;
    return true;
  }

  _executeSkill1ById(id, target, bounds, cfg = this._cfg()) {
    this._activeSkill1Id = id;
    this.skillCastHandsTimer = Math.max(this.skillCastHandsTimer || 0, 26);

    if (id === 'cracked_blaster') {
      this._activeSkill1Label = cfg.crackedBlasterSkillName || 'CRACKED BLASTER';
      this._spawnCrackedBlasterBarrage(target, bounds, cfg, cfg.blasterCount ?? 3);
    } else if (id === 'gaster_hands') {
      this._activeSkill1Label = cfg.gasterHandsSkillName || 'GASTER HANDS';
      this._spawnGasterHandTurrets(target, bounds, cfg, this.lastBreathPhase >= 3);
    } else if (id === 'bone_cage') {
      this._activeSkill1Label = cfg.boneCageSkillName || 'BONE CAGE SLAM';
      this._spawnBoneCageAndSlam(target, bounds, cfg);
    }
  }

  _spawnCrackedBlasterBarrage(target, bounds, cfg, count = 3) {
    if (!target) return false;
    const staminaCost = cfg.blasterStaminaCost ?? 1;
    if (staminaCost > 0 && this.stamina < staminaCost) return false;
    if (staminaCost > 0) this.stamina = Math.max(0, this.stamina - staminaCost);

    const cx = target.x;
    const cy = target.y - (target.z || 0);
    const baseAngle = Math.atan2(cy - this.y, cx - this.x);

    for (let i = 0; i < count; i++) {
      const ang = baseAngle + (i / Math.max(1, count)) * Math.PI * 2;
      const bx = Math.max(bounds.x + 28, Math.min(bounds.x + bounds.width - 28, cx + Math.cos(ang) * 145));
      const by = Math.max(bounds.y + 28, Math.min(bounds.y + bounds.height - 28, cy + Math.sin(ang) * 145));
      this.activeBlasters.push({
        x: bx,
        y: by,
        angle: Math.atan2(cy - by, cx - bx),
        trackTarget: target,
        scale: 1.0,
        spawnScale: 0.35,
        isCharging: true,
        isFiring: false,
        chargeTimer: cfg.blasterChargeFrames ?? 20,
        chargeMax: cfg.blasterChargeFrames ?? 20,
        chargeProgress: 0,
        fireTimer: 0,
        fireMax: cfg.blasterFireFrames ?? 24,
        fireProgress: 0,
        beamWidth: cfg.blasterBeamWidth ?? 34,
        reach: cfg.blasterLaserReach ?? 920,
        damage: cfg.blasterDamage ?? 7,
        isOrange: this.lastBreathPhase >= 3 && i % 2 === 1,
        isPhase3Beam: this.lastBreathPhase >= 3,
        firstHitSet: new Set(),
        tickTimers: new Map(),
      });
    }
    this._playAudio('gasterBlaster', 'Assets/Sound Effects/Sans/GasterBlaster.ogg', 0.80);
    return true;
  }

  _spawnGasterHandTurrets(target, bounds, cfg, isPhase3 = false) {
    const cy = target ? (target.y - (target.z || 0)) : (bounds.y + bounds.height * 0.5);
    const clampedY = Math.max(bounds.y + 52, Math.min(bounds.y + bounds.height - 52, cy));
    const dur = cfg.gasterHandDuration ?? 110;
    const interval = cfg.gasterHandFireInterval ?? 18;

    for (const side of [-1, 1]) {
      const hx = side < 0 ? (bounds.x + 42) : (bounds.x + bounds.width - 42);
      this.activeGasterHands.push({
        x: hx,
        y: clampedY,
        baseY: clampedY,
        side,
        scale: isPhase3 ? 1.45 : 1.25,
        life: dur,
        fireTimer: 10 + (side > 0 ? 9 : 0),
        fireInterval: isPhase3 ? Math.max(12, interval - 4) : interval,
        isPhase3,
      });
    }

    // Center downward Gaster Blaster (faithful to lastbreath.csv Gaster Hand sequence)
    if (target) {
      const bx = Math.max(bounds.x + 40, Math.min(bounds.x + bounds.width - 40, target.x));
      const by = bounds.y + 30;
      this.activeBlasters.push({
        x: bx,
        y: by,
        angle: Math.PI / 2,
        trackTarget: target,
        scale: cfg.gasterHandCenterBlasterScale ?? 1.35,
        spawnScale: 0.35,
        isCharging: true,
        isFiring: false,
        chargeTimer: 22,
        chargeMax: 22,
        chargeProgress: 0,
        fireTimer: 0,
        fireMax: 26,
        fireProgress: 0,
        beamWidth: 40,
        reach: bounds.height + 80,
        damage: (cfg.blasterDamage ?? 7) + 4,
        isPhase3Beam: isPhase3,
        firstHitSet: new Set(),
        tickTimers: new Map(),
      });
    }

    this._playAudio('ding', 'Assets/Sound Effects/Sans/Ding.ogg', 0.80);
    this._playAudio('gasterBlaster', 'Assets/Sound Effects/Sans/GasterBlaster.ogg', 0.78);
    spawnFloatingText(this.x, this.y - (this.r || 25) - 18, 'GASTER HANDS!', '#00E5FF');
  }

  _spawnBoneCageAndSlam(target, bounds, cfg) {
    if (!target) return;
    const cx = target.x;
    const cy = target.y - (target.z || 0);
    const count = cfg.boneCageSpikeCount ?? 6;
    const warn = cfg.boneCageWarnFrames ?? 20;
    const active = cfg.boneCageActiveFrames ?? 36;

    // Blue Soul telekinesis slam pulse toward opponent
    this._playAudio('slam', 'Assets/Sound Effects/Sans/Slam.ogg', 0.86);
    this._playAudio('warning', 'Assets/Sound Effects/Sans/Warning.ogg', 0.76);
    const slamAng = Math.atan2(cy - this.y, cx - this.x);
    const kb = cfg.boneCageSlamKnockback ?? 9.5;
    target.vx = (target.vx || 0) + Math.cos(slamAng) * kb;
    target.vy = (target.vy || 0) + Math.sin(slamAng) * kb;
    this._dealLastBreathDamage(target, cfg.boneCageSlamDamage ?? 12, { applyKarma: true });

    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const dist = i === 0 ? 0 : 48;
      const tx = Math.max(bounds.x + 24, Math.min(bounds.x + bounds.width - 24, cx + Math.cos(ang) * dist));
      const ty = Math.max(bounds.y + 24, Math.min(bounds.y + bounds.height - 24, cy + Math.sin(ang) * dist));
      this.activeBoneTraps.push({
        x: tx,
        y: ty,
        warnTimer: warn,
        warnMax: warn,
        activeTimer: active,
        activeMax: active,
        damage: cfg.boneCageDamage ?? 18,
        hasDamaged: false,
      });
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SIGNATURE ULTIMATE: AN ENIGMATIC ENCOUNTER
  // ═════════════════════════════════════════════════════════════════════════
  _startEnigmaticFinale(target, bounds, cfg = this._cfg()) {
    this.finaleHits = 0;
    this.isEnigmaticFinaleActive = true;
    this.skillCastHandsTimer = Math.max(this.skillCastHandsTimer || 0, 72);

    const cx = target ? target.x : (bounds.x + bounds.width * 0.5);
    const cy = target ? (target.y - (target.z || 0)) : (bounds.y + bounds.height * 0.5);
    const castAng = Math.atan2(cy - this.y, cx - this.x);
    this.skillCastAngle = castAng;
    this.gunAngle = castAng;
    this.angle = castAng;

    this._finaleSeq = {
      stage: 'charge',
      timer: 0,
      chargeMax: cfg.finaleBindFrames ?? 30,
      blastMax: cfg.finaleBlastFrames ?? 42,
      cx,
      cy,
      blastersSpawned: false,
    };

    spawnFloatingText(this.x, this.y - (this.r || 25) - 24, 'AN ENIGMATIC ENCOUNTER!', '#EF4444');
    triggerFighterSpeech(this, "let's bring this to an end.", {
      duration: 115,
      force: true,
      preserveCase: true,
      borderColor: '#EF4444',
    });
    this._playAudio('dark', 'Assets/Sound Effects/LastBreathSans/dark.ogg', 0.90);
    this._playAudio('flash', 'Assets/Sound Effects/Sans/Flash.ogg', 0.85);
  }

  _updateEnigmaticFinaleSeq(targets, bounds, cfg) {
    const seq = this._finaleSeq;
    if (!seq) {
      this.isEnigmaticFinaleActive = false;
      return;
    }

    this.gunAngle = this.skillCastAngle;
    this.angle = this.skillCastAngle;
    seq.timer++;

    if (seq.stage === 'charge') {
      if (!seq.blastersSpawned && seq.timer >= 8) {
        seq.blastersSpawned = true;
        const bCount = cfg.finaleBlasterCount ?? 4;
        const bDmg = cfg.finaleBlasterDamage ?? 14;

        // Ring of 4 Cracked Blasters
        for (let i = 0; i < bCount; i++) {
          const ang = this.skillCastAngle + (i / bCount) * Math.PI * 2;
          const bx = Math.max(bounds.x + 28, Math.min(bounds.x + bounds.width - 28, seq.cx + Math.cos(ang) * 165));
          const by = Math.max(bounds.y + 28, Math.min(bounds.y + bounds.height - 28, seq.cy + Math.sin(ang) * 165));
          this.activeBlasters.push({
            x: bx,
            y: by,
            angle: Math.atan2(seq.cy - by, seq.cx - bx),
            trackTarget: targets[0] || null,
            scale: 1.25,
            spawnScale: 0.35,
            isCharging: true,
            isFiring: false,
            chargeTimer: Math.max(8, seq.chargeMax - 8),
            chargeMax: Math.max(8, seq.chargeMax - 8),
            chargeProgress: 0,
            fireTimer: 0,
            fireMax: seq.blastMax,
            fireProgress: 0,
            beamWidth: 42,
            reach: 950,
            damage: bDmg,
            isPhase3Beam: true,
            firstHitSet: new Set(),
            tickTimers: new Map(),
          });
        }

        // Colossal Phase 3 Titan Blaster fired along locked cast angle
        this.activeBlasters.push({
          x: this.x,
          y: this.y - (this.z || 0),
          angle: this.skillCastAngle,
          trackTarget: null,
          scale: cfg.finaleTitanScale ?? 2.05,
          spawnScale: 0.35,
          isCharging: true,
          isFiring: false,
          chargeTimer: Math.max(10, seq.chargeMax - 6),
          chargeMax: Math.max(10, seq.chargeMax - 6),
          chargeProgress: 0,
          fireTimer: 0,
          fireMax: seq.blastMax,
          fireProgress: 0,
          beamWidth: cfg.finaleTitanBeamWidth ?? 74,
          reach: 980,
          damage: bDmg + 6,
          isOrange: true,
          isPhase3Beam: true,
          firstHitSet: new Set(),
          tickTimers: new Map(),
        });

        this._playAudio('gasterBlaster', 'Assets/Sound Effects/Sans/GasterBlaster.ogg', 0.86);
      }

      if (seq.timer >= seq.chargeMax) {
        seq.stage = 'blast';
        seq.timer = 0;
      }
    } else if (seq.stage === 'blast') {
      if (seq.timer >= seq.blastMax) {
        this.activeShockwaveRipples.push({ x: seq.cx, y: seq.cy, maxRadius: 215, life: 28, maxLife: 28 });
        this._playAudio('slam', 'Assets/Sound Effects/Sans/Slam.ogg', 0.88);
        this._playAudio('explosion', 'Assets/Sound Effects/Attacks/explosion.mp3', 0.36);
        triggerGlobalScreenShake(9.0, 14);

        const slamDmg = cfg.finaleSlamDamage ?? 36;
        const slamKb = cfg.finaleKnockback ?? 14.5;
        for (let i = 0; i < targets.length; i++) {
          const e = targets[i];
          this._dealLastBreathDamage(e, slamDmg, { isAOE: true, isGuaranteedHit: true, applyKarma: true });
          const pushA = Math.atan2(e.y - this.y, e.x - this.x);
          e.vx = (e.vx || 0) + Math.cos(pushA) * slamKb;
          e.vy = (e.vy || 0) + Math.sin(pushA) * slamKb;
        }
        this._finaleSeq = null;
        this.isEnigmaticFinaleActive = false;
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDERING PIPELINE (Rules 20, 21, 32, 35)
  // ═════════════════════════════════════════════════════════════════════════
  drawBody(ctx) {
    drawLastBreathSansSkin(ctx, this);
  }

  draw(ctx) {
    // 1. Afterimage silhouettes
    for (let i = 0; i < this.afterImages.length; i++) {
      const ai = this.afterImages[i];
      const alpha = (ai.timer / Math.max(1, ai.maxTimer || 22)) * 0.48;
      drawLastBreathSansGhostSkin(ctx, this, ai.x, ai.y, ai.angle, alpha, ai.phase || 1);
    }

    // 2. Arena traps under fighter
    for (let i = 0; i < this.activeBoneTraps.length; i++) {
      drawLastBreathBoneTrap(ctx, this.activeBoneTraps[i]);
    }

    // 3. Body Circle + Last Breath Spectral Crown (Rule 32)
    this.drawBody(ctx);

    // 4. Canonical Telekinesis Hands during active casts only (Rule 20)
    if (this.skillCastHandsTimer > 0 || this.isEnigmaticFinaleActive) {
      drawLastBreathSansWeaponPreview(ctx, this.x || 0, (this.y || 0) - (this.z || 0), this.gunAngle || 0, this.r || 25, { isPreview: false });
    }

    // 5. Gaster Hand Turrets, Void Bullets, Color Bones, Blasters & Ripples
    for (let i = 0; i < this.activeGasterHands.length; i++) {
      drawGasterHandTurret(ctx, this.activeGasterHands[i]);
    }
    for (let i = 0; i < this.activeGasterBullets.length; i++) {
      drawGasterBulletProjectile(ctx, this.activeGasterBullets[i]);
    }
    for (let i = 0; i < this.activeBones.length; i++) {
      drawLastBreathBoneProjectile(ctx, this.activeBones[i]);
    }
    for (let i = 0; i < this.activeBlasters.length; i++) {
      drawLastBreathGasterBlaster(ctx, this.activeBlasters[i]);
    }
    drawEnigmaticFinaleVFX(ctx, this, this.activeShockwaveRipples);

    // 6. Rule 21 Mandatory In-Game Overhead HP & Freeze Timers + Undertale Speech Bubble
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
    drawSansSpeechBubble(ctx, this);
  }
}
