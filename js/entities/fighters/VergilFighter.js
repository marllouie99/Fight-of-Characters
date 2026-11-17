// ───────────────────────────────────────────────────────────────────────────
// Vergil — Son of Sparda Fighter Entity
// Devil May Cry (Jump Force MUGEN V14 — Son of Sparda Vergil Kit)
//
// Adheres strictly to:
// - Rule 1.1: Freeze & TimeStop Early Exits
// - Rule 1.2: Centralized Physics via super.update()
// - Rule 1.3 & 1.4: Teleport Aim Alignment & 360° Committed Skill Aim Lock
// - Rule 1.5 & 1.6: Target-Only Stasis & Multi-Target Frontal Arc AOE
// - Rule 1.7: Gojo Limitless Infinity Barrier Respect
// - Rule 18: Unified Theme Color (#38BDF8) & Config Toggle Gating
// - Rule 21: In-Game Overlay HP & Status Drawing (drawHealth + drawFreezeTimer)
// - Rule 23: Basic Projectile Suppression (shoot override)
// - Rule 24 & 32: Preserve scaled r from super(def) & World-Space 2.0px Outline
// - Rule 25: Top-of-Update VFX & Projectile Decay (never freeze mid-air)
// - Rule 30: 5-Phase Melee Swing & Layered Fleshy Slap Audio
// ───────────────────────────────────────────────────────────────────────────

import { Fighter, applyDamageToTarget } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { vergilConfig } from '../../configs/characters/vergilConfig.js';
import { state, spawnFloatingText, triggerGlobalScreenShake } from '../../core/state.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { spawnSparks, spawnImpactFlash, spawnParrySparksEffect } from '../../graphics/particles/sparkEffect.js';
import { spawnBloodEffect } from '../../graphics/particles/bloodEffect.js';
import { drawVergilSkin } from '../../graphics/fighters/vergilSkin.js';
import {
  prewarmVergilVfxAssets,
  drawVergilBladeAndSlashVFX,
  drawVergilAuraAndMobilityVFX,
  drawVergilCombatVFX,
} from '../../graphics/weapons/vergilWeaponGraphics.js';

export class VergilFighter extends Fighter {
  constructor(def = {}) {
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.vergil) ? CONFIG.vergil : vergilConfig;

    // Rule 24: Preserve scaled radius computed by super(def)
    super({
      ...def,
      r: def.r ?? cfg.r ?? 25,
      radius: def.radius ?? cfg.radius ?? 25,
      hp: def.hp ?? cfg.hp ?? 255,
      maxHp: def.maxHp ?? cfg.hp ?? 255,
      speed: def.speed ?? cfg.speed ?? 6.4,
      damage: def.damage ?? cfg.swordDamage ?? 15,
      cooldown: def.cooldown ?? cfg.swordCooldown ?? 24,
      color: def.color || cfg.color || '#38BDF8',
    });

    this.characterId = 'vergil';
    this.type = 'vergil';
    this.name = def?.name || cfg.name || 'Vergil';
    this.displayName = def?.displayName || cfg.displayName || 'VERGIL';
    this.grade = cfg.grade || 'SS';
    this.title = cfg.title || 'The Alpha and the Omega';
    this.color = cfg.color || '#38BDF8';
    this.themeColor = cfg.themeColor || '#38BDF8';
    this.damageNumberColor = cfg.damageNumberColor || '#38BDF8';
    this.moveSpeed = def.moveSpeed ?? cfg.moveSpeed ?? cfg.speed ?? 6.4;
    this.speed = this.moveSpeed;
    this.suppressSketchyOutline = true;
    this.usesCustomHands = true;

    this._initVergilState(cfg);
    prewarmVergilVfxAssets();
  }

  /**
   * Rule 35 pre-battle hook invoked by prewarmMatchAssets() before Round 1 starts.
   */
  prewarmAssets(targetCtx = null) {
    return prewarmVergilVfxAssets(targetCtx);
  }

  reset() {
    super.reset();
    this._initVergilState(this._cfg());
  }

  _cfg() {
    return (typeof CONFIG !== 'undefined' && CONFIG.vergil) ? CONFIG.vergil : vergilConfig;
  }

  _initVergilState(cfg = this._cfg()) {
    this._vfxTick = 0;
    this._soundPlayTimestamps = {};

    // Concentration & The Seed of Sparda (Devil Trigger var(2): 0 = Base, 1 = Seed of Sparda)
    this.vergilForm = 0;
    this.concentrationGauge = 0;
    this.formTransformVfxTimer = 0;
    this.skillCastAngle = 0;

    // 5-Phase Yamato Melee Swing (Rule 30)
    this.swordCooldown = 12;
    this.swordCooldownMax = cfg.swordCooldown ?? 24;
    this.swordComboStep = 0;
    this.swordSwingDir = 1;
    this.isSlashing = false;
    this.swordSwingPhase = 'idle';
    this.swordSwingTimer = 0;
    this.swordSwingPhaseMax = 1;
    this.swordSwingPhaseProgress = 0;
    this.swordHitDealt = false;
    this.shootCooldownMax = 0;
    this.shootCooldown = 999999;

    // Mobility & Trick Teleport
    this.trickTeleportCooldown = 0;
    this.trickTeleportCooldownMax = cfg.trickTeleportCooldown ?? 170;
    this.shunpoVfxTimer = 0;
    this.trickPhaseTimer = 0;
    this.trickSlowTimer = 0;
    this.trickAngle = 0;
    this._lastTrickSideLeft = false;

    // Specials & Supers (Cooldowns ticked by base SkillManager — NEVER shadow _tickCooldowns!)
    this.judgmentCutCooldown = 65;
    this.judgmentCutCooldownMax = cfg.judgmentCutCooldown ?? 190;
    this.rapidSlashTimer = 0;
    this.rapidSlashHitTargets = new Set();

    this.summonedSwordsCooldown = 50;
    this.summonedSwordsCooldownMax = cfg.summonedSwordsCooldown ?? 280;
    this.orbitingSwords = [];
    this.swordAimFireTimer = 0;
    this._summonedSwordHits = 0;
    this._pendingSwordRainFollowUp = false;
    this._pendingSwordRainTarget = null;
    this.swordRainState = null;

    this.mirageBoomerangCooldown = 95;
    this.mirageBoomerangCooldownMax = cfg.mirageBoomerangCooldown ?? 250;

    this.doppelgangerCooldown = 150;
    this.doppelgangerCooldownMax = cfg.doppelgangerCooldown ?? 420;
    this.doppelgangerTimer = 0;
    this.doppelgangerMaxDuration = cfg.doppelgangerDuration ?? 240;

    // Defensive Mechanics: Yamato Guard & Deflect Parry (Roaring Knight Parry Animation)
    this.parryCooldown = 0;
    this.parryCooldownMax = cfg.parryCooldown ?? 90;
    this.blockPoseTimer = 0;
    this.parryHitAnimTimer = 0;
    this.parryHitAnimMaxFrames = 18;
    this.parryWhiteFlashTimer = 0;
    this.parryShakeTimer = 0;
    this.parryStanceIndex = 0;
    this.activeParryBlockVfx = [];

    this.judgmentBarrageCooldown = 0;
    this.judgmentBarrageCooldownMax = cfg.judgmentBarrageCooldown ?? 360;
    this.judgmentBarrageState = null;
    this._pendingBarrageFollowUpTarget = null;
    this.barrageSlashTimer = 0;
    this.barrageSlashMax = 7;
    this.barrageCutCenter = 0;
    this.barrageCutDir = 1;

    // Ultimate: Judgment Cut End (State 3000 -> 3004)
    this.judgmentCutEndCooldown = 260;
    this.judgmentCutEndCooldownMax = cfg.judgmentCutEndCooldown ?? 620;
    this.jceState = null;

    // Rule 25 Non-Freezing World VFX, Afterimages & Projectiles
    this.activeVisualEffects = [];
    this.vergilProjectiles = [];
    this.afterimages = [];

    this._registerVergilSkills(cfg);
  }

  _registerVergilSkills(cfg) {
    if (!this.skillManager || typeof this.skillManager.registerSkills !== 'function') return;
    const list = [
      ['judgment_cut', cfg.enableJudgmentCut, 'judgmentCutSkillName', 'JUDGMENT CUT', 'judgmentCutCooldown', cfg.judgmentCutCooldown ?? 190, 'offensive'],
      ['trick_teleport', cfg.enableTrickTeleport, 'trickTeleportSkillName', 'TRICK', 'trickTeleportCooldown', cfg.trickTeleportCooldown ?? 170, 'mobility'],
      ['summoned_swords', cfg.enableSummonedSwords, 'summonedSwordsSkillName', 'SUMMONED SWORDS', 'summonedSwordsCooldown', cfg.summonedSwordsCooldown ?? 280, 'offensive'],
      ['mirage_boomerang', cfg.enableMirageBoomerang, 'mirageBoomerangSkillName', 'MIRAGE EDGE', 'mirageBoomerangCooldown', cfg.mirageBoomerangCooldown ?? 250, 'offensive'],
      ['doppelganger', cfg.enableDoppelganger, 'doppelgangerSkillName', 'DOPPELGANGER', 'doppelgangerCooldown', cfg.doppelgangerCooldown ?? 420, 'buff'],
      ['yamato_parry', cfg.enableParry, 'parrySkillName', 'YAMATO PARRY', 'parryCooldown', cfg.parryCooldown ?? 90, 'defensive'],
      ['judgment_barrage', cfg.enableJudgmentBarrage, 'judgmentBarrageSkillName', 'DIMENSION BARRAGE', 'judgmentBarrageCooldown', cfg.judgmentBarrageCooldown ?? 360, 'offensive'],
      ['judgment_cut_end', cfg.enableJudgmentCutEnd, 'judgmentCutEndSkillName', 'JUDGMENT CUT END', 'judgmentCutEndCooldown', cfg.judgmentCutEndCooldown ?? 620, 'ultimate'],
    ];
    const skills = [];
    for (const [id, enabled, nameKey, defName, cdKey, cdMax, type] of list) {
      if (this.isSkillEnabled(enabled, true)) {
        skills.push({ id, name: cfg[nameKey] || defName, type, cooldownKey: cdKey, cooldownMax: cdMax });
      }
    }
    this.skillManager.registerSkills(skills);
  }

  _playSound(key, defaultVol = 0.8) {
    if (!this._soundPlayTimestamps) this._soundPlayTimestamps = {};
    const cfg = this._cfg();
    const chance = cfg.soundChances?.[key];
    if (chance !== undefined && chance < 1 && Math.random() >= chance) return;
    const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    if (now - (this._soundPlayTimestamps[key] || 0) < 85) return;
    this._soundPlayTimestamps[key] = now;
    const sfx = cfg.sounds?.[key];
    const vol = cfg.soundVolumes?.[key] ?? defaultVol;
    if (sfx && typeof audioSystem !== 'undefined' && typeof audioSystem.playSFX === 'function') {
      audioSystem.playSFX(sfx, vol);
    }
  }

  /**
   * Rule 23: Suppress base generic circular bullets.
   */
  shoot(ownerIndex) {
    // Intentionally empty: Vergil fights exclusively with Yamato, Summoned Swords & Sparda arts.
  }

  canAim() {
    if (this.rapidSlashTimer > 0) return false;
    if (this.jceState && this.jceState.active) return false;
    return super.canAim ? super.canAim() : true;
  }

  applyAim(opponent, targetAngle) {
    // Keep barrage iai flurry locked crisply onto moving targets rather than 0.045 beam turn throttling
    if (this.judgmentBarrageState && this.judgmentBarrageState.active && !(this.jceState && this.jceState.active)) {
      const prevTurnRate = this.aimTurnRate;
      this.aimTurnRate = 1.0;
      try {
        return super.applyAim(opponent, targetAngle);
      } finally {
        this.aimTurnRate = prevTurnRate;
      }
    }
    return super.applyAim(opponent, targetAngle);
  }

  isStationarySkillActive() {
    if (this.jceState && this.jceState.active && this.jceState.phase === 'dash') {
      return false;
    }
    return Boolean(
      (this.judgmentBarrageState && this.judgmentBarrageState.active) ||
      (this.jceState && this.jceState.active) ||
      super.isStationarySkillActive?.()
    );
  }

  isChannelingSkill() {
    return Boolean(
      (this.jceState && this.jceState.active) ||
      (this.judgmentBarrageState && this.judgmentBarrageState.active) ||
      super.isChannelingSkill?.()
    );
  }

  applyMovementPhysics(extraMultiplier = 1) {
    if (this.jceState && this.jceState.active && this.jceState.phase !== 'dash') {
      this.vx = 0;
      this.vy = 0;
      this.knockbackVx = 0;
      this.knockbackVy = 0;
      this._stationaryStallFrames = 0;
      if (this.jceState.lockedX !== undefined) this.x = this.jceState.lockedX;
      if (this.jceState.lockedY !== undefined) this.y = this.jceState.lockedY;
      return;
    }
    const slowMult = (this.trickSlowTimer || 0) > 0 ? (this._cfg().trickSlowMultiplier ?? 0.35) : 1.0;
    super.applyMovementPhysics(extraMultiplier * this._speedMultiplier() * slowMult);
  }

  _damageMultiplier() {
    const cfg = this._cfg();
    return this.vergilForm >= 1 ? (cfg.spardaFormDamageMultiplier ?? 1.22) : 1.0;
  }

  _speedMultiplier() {
    const cfg = this._cfg();
    return this.vergilForm >= 1 ? (cfg.spardaFormSpeedMultiplier ?? 1.24) : 1.0;
  }

  _isGojoInfinityBlocked(target) {
    if (!target) return false;
    const tId = String(target.characterId || target.type || '').toLowerCase();
    return (tId === 'gojo' || tId === 'rubbick') && (target.infinityCooldown ?? 999) <= 0 && !target.isChainedByMakima;
  }

  _isHostile(target) {
    if (!target || target === this || target.hp <= 0 || target.isDead || target.dead) return false;
    if (typeof state !== 'undefined' && typeof state.getFighterTeam === 'function' && Array.isArray(state.fighters)) {
      const myIdx = state.fighters.indexOf(this);
      const targetSubject = (target.owner && !state.fighters.includes(target)) ? target.owner : target;
      if (targetSubject === this) return false;
      const targetIdx = state.fighters.indexOf(targetSubject);
      if (myIdx !== -1 && targetIdx !== -1) {
        const myTeam = state.getFighterTeam(myIdx);
        const targetTeam = state.getFighterTeam(targetIdx);
        if (myTeam !== null && targetTeam !== null) return myTeam !== targetTeam;
      }
    }
    return true;
  }

  _collectTargets() {
    const out = [];
    if (typeof state !== 'undefined') {
      if (Array.isArray(state.fighters)) {
        for (const f of state.fighters) {
          if (this._isHostile(f)) out.push(f);
        }
      }
      if (Array.isArray(state.illusions)) {
        for (const il of state.illusions) {
          if (il && il.hp > 0 && this._isHostile(il)) out.push(il);
        }
      }
    }
    return out;
  }

  _pickNearestTarget(fallbackOpponent) {
    const targets = this._collectTargets();
    if (targets.length === 0) return (fallbackOpponent && this._isHostile(fallbackOpponent)) ? fallbackOpponent : null;
    let best = targets[0];
    let bestDist = Math.hypot(best.x - this.x, best.y - this.y);
    for (let i = 1; i < targets.length; i++) {
      const d = Math.hypot(targets[i].x - this.x, targets[i].y - this.y);
      if (d < bestDist) { best = targets[i]; bestDist = d; }
    }
    return best;
  }

  _gainConcentration(amount) {
    const cfg = this._cfg();
    if (!this.isSkillEnabled(cfg.enableSpardaForm, true) || this.vergilForm >= 1) return;
    this.concentrationGauge = Math.min(100, (this.concentrationGauge || 0) + amount);
  }

  _checkSpardaFormAwakening(cfg) {
    if (!this.isSkillEnabled(cfg.enableSpardaForm, true) || this.vergilForm >= 1) return;
    const maxHp = Math.max(1, this.maxHp || 1);
    const hpRatio = (this.hp || 0) / maxHp;
    const hpThresh = cfg.spardaFormThresholdHpRatio ?? 0.58;
    const hpLostRatio = Math.max(0, (maxHp - (this.hp || 0)) / maxHp);
    const requiredLossRatio = Math.max(0.01, 1 - hpThresh);
    // Triggers strictly based on HP lost (hpRatio <= spardaFormThresholdHpRatio)
    if (hpRatio <= hpThresh || hpLostRatio >= requiredLossRatio) {
      this.vergilForm = 1;
      this.concentrationGauge = 100;
      this.formTransformVfxTimer = 28;
      this.doppelgangerTimer = 0; // MUGEN var(2)=0 restriction switches to SDT power

      const healAmt = Math.round(this.maxHp * (cfg.spardaFormHealPercent ?? 0.14));
      if (healAmt > 0 && this.hp > 0) {
        this.hp = Math.min(this.maxHp, this.hp + healAmt);
        this._lastHealAmount = (this._lastHealAmount || 0) + healAmt;
        this._healthBarHealTimer = 16;
      }

      spawnFloatingText(this.x, this.y - (this.r || 30) - 24, 'SEED OF SPARDA!', '#E11D48', 18);
      triggerGlobalScreenShake(9, 14);
      this._playSound('spardaAwaken', 0.90);
      this._playSound('devilRoar', 0.88);
      this._playSound('voSparda', 0.90);
    }
  }

  interruptAttacks(forceCancelAll = false) {
    super.interruptAttacks(forceCancelAll);
    this.isSlashing = false;
    this.swordSwingPhase = 'idle';
    this.swordSwingTimer = 0;
    this.rapidSlashTimer = 0;
    this._pendingBarrageFollowUpTarget = null;
    if (forceCancelAll) {
      this.judgmentBarrageState = null;
      this.barrageSlashTimer = 0;
      this._summonedSwordHits = 0;
      this._pendingSwordRainFollowUp = false;
      this._pendingSwordRainTarget = null;
      this.swordRainState = null;
      this.jceState = null;
      this.doppelgangerTimer = 0;
      this.trickPhaseTimer = 0;
      this.trickSlowTimer = 0;
      this.blockPoseTimer = 0;
      this.parryHitAnimTimer = 0;
      this.parryWhiteFlashTimer = 0;
      this.parryShakeTimer = 0;
      this.activeParryBlockVfx.length = 0;
      this.activeVisualEffects.length = 0;
    }
  }

  resolveWallBounce(arena, opponent) {
    if (this.isCaughtInBeam() || this.isDraggedByGetsuga || this.isWallPinnedByMakima || this.isWallPinnedBySaitama) {
      return super.resolveWallBounce(arena, opponent);
    }
    return super.resolveWallBounce(arena, opponent);
  }

  // ── Top-of-Update Rule 25 Decay (Runs even while frozen/stunned) ──
  _updateVisualEffects(arenaObj) {
    this._vfxTick++;
    if (this.formTransformVfxTimer > 0) this.formTransformVfxTimer--;
    if (this.shunpoVfxTimer > 0) this.shunpoVfxTimer--;
    if (this.trickPhaseTimer > 0) this.trickPhaseTimer--;
    if (this.parryWhiteFlashTimer > 0) this.parryWhiteFlashTimer--;
    if (this.parryShakeTimer > 0) this.parryShakeTimer--;
    if (this.barrageSlashTimer > 0) this.barrageSlashTimer--;

    for (let i = this.activeParryBlockVfx.length - 1; i >= 0; i--) {
      const fx = this.activeParryBlockVfx[i];
      fx.x += fx.vx || 0;
      fx.y += fx.vy || 0;
      if (fx.dragY && Math.abs(fx.vy || 0) > 0.05) {
        fx.vy = fx.vy > 0 ? Math.max(0, fx.vy - fx.dragY) : Math.min(0, fx.vy + fx.dragY);
      }
      fx.life--;
      if (fx.life <= 0) this.activeParryBlockVfx.splice(i, 1);
    }

    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      this.afterimages[i].alpha -= 0.045;
      if (this.afterimages[i].alpha <= 0.02) this.afterimages.splice(i, 1);
    }

    for (let i = this.activeVisualEffects.length - 1; i >= 0; i--) {
      this.activeVisualEffects[i].timer--;
      if (this.activeVisualEffects[i].timer <= 0) this.activeVisualEffects.splice(i, 1);
    }

    this._updateVergilProjectiles(arenaObj);
    this._updateOrbitingSwords(this._cfg());
    this._updateSwordRainState(this._cfg());
    this._updateJudgmentBarrageState(this._cfg());
    this._updateJudgmentCutEndState(this._cfg());
  }

  _tickVergilTimers(cfg) {
    if (this.doppelgangerTimer > 0) this.doppelgangerTimer--;
    if (this.blockPoseTimer > 0) this.blockPoseTimer--;
    if (this.parryHitAnimTimer > 0) this.parryHitAnimTimer--;
    if (this.trickSlowTimer > 0) this.trickSlowTimer--;
    if (this.vergilForm >= 1 && (this._vfxTick % 12 === 0)) {
      this.afterimages.push({ x: this.x, y: this.y, angle: this.gunAngle ?? 0, alpha: 0.42 });
      if (this.afterimages.length > 6) this.afterimages.shift();
    }
    // Accelerate cooldown recovery slightly in Seed of Sparda form
    if (this.vergilForm >= 1 && (this._vfxTick % 4 === 0)) {
      for (const key of ['judgmentCutCooldown', 'trickTeleportCooldown', 'summonedSwordsCooldown', 'mirageBoomerangCooldown', 'doppelgangerCooldown', 'parryCooldown', 'judgmentBarrageCooldown', 'judgmentCutEndCooldown']) {
        if ((this[key] || 0) > 0) this[key]--;
      }
    }
  }

  _isAttackUndodgeableOrTick(attacker, opts = {}) {
    const isInsideGojoDomain = Boolean(
      (typeof state !== 'undefined' && state.fighters?.some(f =>
        (f.characterId === 'gojo' || f.type === 'gojo' || f._def?.id === 'gojo') && f.domainActive
      )) ||
      (attacker && (attacker.characterId === 'gojo' || attacker.type === 'gojo' || attacker._def?.id === 'gojo') && (attacker.domainActive || (attacker.stolenDomainActive && attacker.stolenType === 'gojo_domain')))
    );
    const isGuaranteedHit = Boolean(
      opts.isRatioCrit || opts.isNanamiPause || opts.undodgeable || opts.isSureKill ||
      opts.isSaitamaCounter || opts.isSaitamaPunch || opts.isSeriousPunch || opts.isGuaranteedHit ||
      opts.bypassEvade || opts.bypassShield ||
      opts.isAmbushThrust || opts.isAmbushKatana || opts.isAmbushFlurry ||
      opts.isTojiUltimateAssault || opts.isTojiUltimateFinalBlow || opts.isDivineFlame || opts.isFuga ||
      (attacker && (attacker.characterId === 'saitama' || attacker.type === 'saitama'))
    );
    const isBeamOrTick = Boolean(
      opts.isDomain || opts.isDomainDPS || opts.isPoison || opts.isBurn || opts.isFlame ||
      opts.isExplosion || opts.fromBlackHole || opts.isRed || opts.isPurpleDPS || opts.isHollowPurple ||
      opts.isPureLoveBeam || opts.isBeam || opts.isLaserBeam || opts.isLaylaBeam || opts.isGenosBeam ||
      opts.isGetsuga || opts.getsugaForm || opts.isTickDamage || opts.isTick || opts.isMultiTick ||
      opts.isContinuous || opts.isPeriodic || opts.isDPS ||
      (opts.projectile && (
        opts.projectile.type === 'purple' || opts.projectile.isGojoPurple ||
        opts.projectile.isBeam || opts.projectile.isPureLoveBeam || opts.projectile.isGetsuga ||
        opts.projectile.isTickDamage || opts.projectile.isMultiTick
      ))
    );
    return isGuaranteedHit || isInsideGojoDomain || isBeamOrTick;
  }

  _isControlDisabled() {
    return (this.timeStopTimer > 0) || (this.hitStunTimer > 0) || (this.paralyzeTimer > 0) ||
      (this.electricStunTimer > 0) || (this.dubstepStunTimer > 0) || Boolean(this.isTargetOfAmbush) ||
      Boolean(this.isChainedByMakima) || (typeof this.isInsideCronosSphere === 'function' && this.isInsideCronosSphere());
  }

  /**
   * Saitama/Sans-style Trick Teleport Dodge (State 550 / 551):
   * Reactively warps sideways/clear of incoming attacks & projectiles, grants Trick phase pass-through,
   * and applies a brief post-Trick poise slow moment.
   */
  _executeTrickDodge(threat, cfg = this._cfg(), arenaObj = null, opts = {}) {
    if (!this.isSkillEnabled(cfg.enableTrickTeleport, true) || this.hp <= 0 || this.isDead) return false;
    if ((this.trickTeleportCooldown || 0) > 0) return false;
    const inUltimate = Boolean((this.jceState && this.jceState.active) || (this.judgmentBarrageState && this.judgmentBarrageState.active));
    if (inUltimate || this._isControlDisabled()) return false;
    if (this._isAttackUndodgeableOrTick(threat, opts)) return false;

    const dodgeChance = cfg.trickDodgeChance ?? 1.0;
    if (dodgeChance < 1.0 && Math.random() >= dodgeChance) return false;

    const arena = arenaObj || (typeof state !== 'undefined' && state.arena) || { x: 45, y: 240, width: 450, height: 450 };
    const oldX = this.x;
    const oldY = this.y;

    let refAngle = this.gunAngle ?? this.angle ?? 0;
    if (threat && threat !== this && typeof threat.x === 'number' && typeof threat.y === 'number') {
      refAngle = Math.atan2(this.y - threat.y, this.x - threat.x);
    } else if (threat && typeof threat.vx === 'number' && typeof threat.vy === 'number' && (threat.vx !== 0 || threat.vy !== 0)) {
      refAngle = Math.atan2(threat.vy, threat.vx);
    }

    this._lastTrickSideLeft = !this._lastTrickSideLeft;
    const sideSign = this._lastTrickSideLeft ? 1 : -1;
    const perpAngle = refAngle + sideSign * (Math.PI / 2);
    const dist = cfg.trickDodgeDistance ?? 105;
    const pad = (this.r || 30) + 10;

    let nx = Math.max(arena.x + pad, Math.min(arena.x + arena.width - pad, this.x + Math.cos(perpAngle) * dist));
    let ny = Math.max(arena.y + pad, Math.min(arena.y + arena.height - pad, this.y + Math.sin(perpAngle) * dist));
    if (Math.hypot(nx - oldX, ny - oldY) < 28) {
      const altAngle = refAngle - sideSign * (Math.PI / 2);
      nx = Math.max(arena.x + pad, Math.min(arena.x + arena.width - pad, this.x + Math.cos(altAngle) * dist));
      ny = Math.max(arena.y + pad, Math.min(arena.y + arena.height - pad, this.y + Math.sin(altAngle) * dist));
    }

    this.afterimages.push({ x: oldX, y: oldY, angle: this.gunAngle ?? 0, alpha: 0.65 });
    spawnImpactFlash(oldX, oldY, 26, '#BAE6FD');

    this.x = nx;
    this.y = ny;
    if (threat && typeof threat.hp === 'number' && !threat.isDead) {
      this.aim(threat); // Rule 1.3: Realign facing after Trick teleport
    }
    this.trickTeleportCooldown = cfg.trickTeleportCooldown ?? 170;
    this.trickAngle = Math.atan2(ny - oldY, nx - oldX);
    this.shunpoVfxTimer = 14;
    this.trickPhaseTimer = 14; // MUGEN PlayerPush = 0: zero body block during Trick dodge
    const slowMult = cfg.trickSlowMultiplier ?? 0.35;
    this.trickSlowTimer = cfg.trickSlowFrames ?? 24;
    this.vx *= slowMult;
    this.vy *= slowMult;

    spawnSparks(this.x, this.y, 8, '#38BDF8', '#FFFFFF');
    spawnFloatingText(
      this.x,
      this.y - (this.r || 30) - 18,
      cfg.trickDodgeText || 'MISS!',
      cfg.trickDodgeTextColor || '#FFFFFF'
    );
    this._playSound('trickVanish', 0.74);
    this._playSound('trickAppear', 0.78);
    this._gainConcentration(8);
    return true;
  }

  onProjectileApproach(projectile, attacker) {
    const cfg = this._cfg();
    if (this.hp <= 0 || this.isDead || this._isControlDisabled()) return;
    if (this.jceState && this.jceState.active) return;
    if (attacker === this || !this._isHostile(attacker || projectile)) return;

    // 1. Reactive Trick Dodge first if ready (like Saitama/Sans sidestep)
    if (this._executeTrickDodge(projectile || attacker, cfg)) return;

    // 2. Otherwise raise Yamato Parry guard anticipation
    if (this.isSkillEnabled(cfg.enableParry, true) && (this.parryCooldown || 0) <= 0) {
      this.blockPoseTimer = Math.max(this.blockPoseTimer || 0, cfg.parryGuardDuration ?? 55);
      if (attacker && !attacker.isDead && !this.isSlashing) this.aim(attacker);
    }
  }

  _checkParryAnticipation(target, dist, cfg) {
    if (!this.isSkillEnabled(cfg.enableParry, true) || !target || this.isSlashing) return;
    if ((this.parryCooldown || 0) > 0 || (this.blockPoseTimer || 0) > 0) return;
    const threatRad = cfg.parryThreatRadius ?? 155;
    if (dist > threatRad) return;
    const enemyAttacking = Boolean(
      target.isSlashing || target.punchAnimTimer > 0 || target.slashSwingTimer > 0 ||
      target.katanaSlashTimer > 0 || target.cleaveSwingTimer > 0 || target.meleeSwingTimer > 0
    );
    if (enemyAttacking) {
      this.blockPoseTimer = Math.min(35, cfg.parryGuardDuration ?? 55);
    }
  }

  /**
   * Intercepts incoming hits for Trick Teleport Dodge (when ready) & Yamato Guard Parry.
   */
  takeDamage(amount, attacker = null, opts = {}) {
    if (opts.isHeal) return super.takeDamage(amount, attacker, opts);
    const cfg = this._cfg();

    const unblockable = this._isAttackUndodgeableOrTick(attacker, opts);
    const isStunned = this._isControlDisabled();
    const inUltimate = Boolean((this.jceState && this.jceState.active) || (this.judgmentBarrageState && this.judgmentBarrageState.active));

    // 1. Reactive Trick Teleport Dodge (Saitama/Sans evade) when not actively guarding and off cooldown
    if (!unblockable && !isStunned && !inUltimate && (this.blockPoseTimer || 0) <= 0) {
      const dodged = this._executeTrickDodge(opts.projectile || attacker, cfg, null, opts);
      if (dodged) return false;
    }

    const baseChance = (this.blockPoseTimer > 0 ? (cfg.parryActiveChance ?? 0.56) : (cfg.parryChance ?? 0.34)) + (this.vergilForm >= 1 ? 0.08 : 0);
    const canParry = this.isSkillEnabled(cfg.enableParry, true) &&
      (this.parryCooldown || 0) <= 0 && !isStunned && !inUltimate && !this.isSlashing &&
      !unblockable && this.hp > 0 && !this.isDead;

    if (canParry && Math.random() < baseChance) {
      if (attacker && !attacker.isDead && attacker.hp > 0) this.aim(attacker);
      this.blockPoseTimer = cfg.parryGuardDuration ?? 75;
      this.parryHitAnimMaxFrames = 18;
      this.parryHitAnimTimer = this.parryHitAnimMaxFrames;
      this.parryWhiteFlashTimer = 6;
      this.parryShakeTimer = 8;
      this.parryStanceIndex = ((this.parryStanceIndex || 0) + 1) % 3;
      this.parryCooldown = cfg.parryCooldown ?? 90;

      const angle = attacker && Number.isFinite(attacker.x) && Number.isFinite(attacker.y)
        ? Math.atan2(attacker.y - this.y, attacker.x - this.x)
        : (this.gunAngle ?? this.angle ?? 0);
      const guardDist = (this.r || 30) * 0.92;
      const contactX = this.x + Math.cos(angle) * guardDist;
      const contactY = this.y + Math.sin(angle) * guardDist;

      // Roaring Knight obj_block_vfx: opposing 4-point block stars shooting outward with dragY
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
      // Roaring Knight clash_arc along the Yamato guard line
      this.activeParryBlockVfx.push({
        kind: 'clash_arc',
        x: this.x + Math.cos(angle) * (guardDist * 0.35),
        y: this.y + Math.sin(angle) * (guardDist * 0.35),
        vx: 0,
        vy: 0,
        dragY: 0,
        angle,
        radius: (this.r || 30) * 1.15,
        life: 11,
        maxLife: 11,
      });

      if (typeof spawnParrySparksEffect === 'function') spawnParrySparksEffect(contactX, contactY, 16);
      spawnSparks(contactX, contactY, 8, '#BAE6FD', '#FFFFFF');
      triggerGlobalScreenShake(3.5, 8);

      if (typeof audioSystem !== 'undefined' && typeof audioSystem.playSFX === 'function') {
        audioSystem.playSFX('skill_parry', 0.85);
      }
      this._playSound('sheathSnap', 0.72);
      this._gainConcentration(cfg.parryConcentrationGain ?? 18);
      spawnFloatingText(this.x, this.y - (this.r || 30) - 16, 'PARRIED!', '#FFFFFF', 15);

      // Gentle deflect push on close-range melee attackers without stunning or pausing them
      if (attacker && !opts.projectile && attacker !== this && !attacker.isDead && attacker.hp > 0) {
        const dAtt = Math.hypot(attacker.x - this.x, attacker.y - this.y);
        if (dAtt <= 105 && !this._isGojoInfinityBlocked(attacker)) {
          const pushAng = Math.atan2(attacker.y - this.y, attacker.x - this.x);
          attacker.knockbackVx = (attacker.knockbackVx || 0) + Math.cos(pushAng) * 5.2;
          attacker.knockbackVy = (attacker.knockbackVy || 0) + Math.sin(pushAng) * 5.2;
        }
      }
      return false;
    }

    this.blockPoseTimer = 0;
    return super.takeDamage(amount, attacker, opts);
  }

  // ── Orbiting 6 Summoned Swords + Boomerang + Blistering Bolts ──
  _tryTriggerSwordRainFollowUp(cfg, fallbackTarget = null) {
    if (!this._pendingSwordRainFollowUp || (this.orbitingSwords && this.orbitingSwords.length > 0)) return;
    if (Array.isArray(this.vergilProjectiles) && this.vergilProjectiles.some(p => p.kind === 'summoned_bolt')) return;

    const hitCount = this._summonedSwordHits || 0;
    this._pendingSwordRainFollowUp = false;
    this._summonedSwordHits = 0;
    const followTarget = (this._pendingSwordRainTarget && !this._pendingSwordRainTarget.isDead && this._pendingSwordRainTarget.hp > 0)
      ? this._pendingSwordRainTarget
      : (fallbackTarget || this._pickNearestTarget(null));
    this._pendingSwordRainTarget = null;

    if (hitCount > 0 && !this.isDead && this.hp > 0 && followTarget && this.isSkillEnabled(cfg.enableSummonedSwords, true)) {
      this._castSwordRain(followTarget, cfg, hitCount);
    }
  }

  _updateOrbitingSwords(cfg) {
    const target = this._pickNearestTarget(null);
    if (!Array.isArray(this.orbitingSwords) || this.orbitingSwords.length === 0) {
      this._tryTriggerSwordRainFollowUp(cfg, target);
      return;
    }
    if (this.swordAimFireTimer > 0) this.swordAimFireTimer--;

    for (let i = this.orbitingSwords.length - 1; i >= 0; i--) {
      const sw = this.orbitingSwords[i];
      sw.life--;
      sw.angle += 0.11;
      if (target) {
        sw.aimAngle = Math.atan2(target.y - (this.y + Math.sin(sw.angle) * sw.orbitR), target.x - (this.x + Math.cos(sw.angle) * sw.orbitR));
      }
      if (sw.life <= 0) {
        this.orbitingSwords.splice(i, 1);
      }
    }

    // Launch an orbiting sword automatically toward nearest hostile every 22 frames (MUGEN State 2120)
    if (target && this.orbitingSwords.length > 0 && this.swordAimFireTimer <= 0 && !this.isDead && this.hp > 0) {
      const sw = this.orbitingSwords.pop();
      const sx = this.x + Math.cos(sw.angle) * sw.orbitR;
      const sy = this.y + Math.sin(sw.angle) * sw.orbitR;
      const ang = Math.atan2(target.y - sy, target.x - sx);
      const spd = cfg.summonedSwordSpeed ?? 12.5;
      const swordScale = cfg.summonedSwordScale ?? 1.60;
      this.vergilProjectiles.push({
        kind: 'summoned_bolt',
        x: sx,
        y: sy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: Math.round(12 * swordScale),
        scale: swordScale,
        damage: Math.round((cfg.summonedSwordDamage ?? 7) * this._damageMultiplier()),
        target,
        homing: true,
        turnRate: 0.08,
        age: 0,
        maxAge: 85,
      });
      this.swordAimFireTimer = 20;
      this._playSound('summonSword', 0.68);
    }

    this._tryTriggerSwordRainFollowUp(cfg, target);
  }

  _updateVergilProjectiles(arenaObj) {
    const arena = arenaObj || (typeof state !== 'undefined' && state.arena) || { x: 0, y: 0, width: 540, height: 960 };
    const targets = this._collectTargets();

    for (let i = this.vergilProjectiles.length - 1; i >= 0; i--) {
      const p = this.vergilProjectiles[i];
      p.age++;

      if (p.kind === 'mirage_boomerang') {
        // Outbound decelerate, then return toward Vergil like MUGEN State 535 Boomerang
        if (p.age < 26) {
          p.vx *= 0.96;
          p.vy *= 0.96;
        } else {
          const backAng = Math.atan2(this.y - p.y, this.x - p.x);
          p.vx += Math.cos(backAng) * 1.15;
          p.vy += Math.sin(backAng) * 1.15;
          const spd = Math.hypot(p.vx, p.vy);
          if (spd > 13) { p.vx = (p.vx / spd) * 13; p.vy = (p.vy / spd) * 13; }
          if (p.age > 34 && Math.hypot(this.x - p.x, this.y - p.y) <= (this.r || 30) + 14) {
            this.vergilProjectiles.splice(i, 1);
            continue;
          }
        }
      } else if (p.homing && p.target && !p.target.isDead && p.target.hp > 0) {
        const want = Math.atan2(p.target.y - p.y, p.target.x - p.x);
        const cur = Math.atan2(p.vy, p.vx);
        const speed = Math.hypot(p.vx, p.vy) || 12;
        let diff = want - cur;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const next = cur + Math.max(-(p.turnRate || 0.08), Math.min(p.turnRate || 0.08, diff));
        p.vx = Math.cos(next) * speed;
        p.vy = Math.sin(next) * speed;
      }

      p.x += p.vx;
      p.y += p.vy;

      let hitRemoved = false;
      for (let t = 0; t < targets.length; t++) {
        const foe = targets[t];
        const dist = Math.hypot(foe.x - p.x, foe.y - p.y);
        if (dist <= (foe.r || 25) + (p.r || 12)) {
          if (this._isGojoInfinityBlocked(foe)) {
            this.vergilProjectiles.splice(i, 1);
            hitRemoved = true;
            break;
          }
          if (p.kind === 'mirage_boomerang') {
            if (!p.hitCooldowns) p.hitCooldowns = new Map();
            const last = p.hitCooldowns.get(foe) ?? -99;
            if (p.age - last >= 10) {
              p.hitCooldowns.set(foe, p.age);
              applyDamageToTarget(foe, p.damage, this, { source: 'mirage_boomerang' });
              spawnSparks(foe.x, foe.y, 6, '#38BDF8', '#FFFFFF');
              this._playSound('hitSlice', 0.65);
              this._gainConcentration(4);
            }
          } else {
            const prevHp = foe.hp;
            const dmgRes = applyDamageToTarget(foe, p.damage, this, { source: 'summoned_sword' });
            const dealtDamage = dmgRes !== false && ((typeof dmgRes === 'number' && dmgRes > 0) || (foe.hp < prevHp));
            if (dealtDamage && p.kind === 'summoned_bolt' && this._pendingSwordRainFollowUp) {
              this._summonedSwordHits = (this._summonedSwordHits || 0) + 1;
              if (!this._pendingSwordRainTarget || this._pendingSwordRainTarget.isDead || this._pendingSwordRainTarget.hp <= 0) {
                this._pendingSwordRainTarget = foe;
              }
            }
            if (typeof foe.applyHitStun === 'function') foe.applyHitStun(5);
            spawnSparks(p.x, p.y, 7, '#38BDF8', '#E0F2FE');
            this._playSound('hitSlice', 0.65);
            this._gainConcentration(5);
            this.vergilProjectiles.splice(i, 1);
            hitRemoved = true;
            break;
          }
        }
      }
      if (hitRemoved) continue;

      const margin = 24;
      const outOfBounds = p.kind !== 'mirage_boomerang' && (
        p.x < arena.x - margin || p.x > arena.x + arena.width + margin ||
        p.y < arena.y - margin || p.y > arena.y + arena.height + margin
      );
      if (p.age >= (p.maxAge || 90) || outOfBounds) {
        this.vergilProjectiles.splice(i, 1);
      }
    }
  }

  // ── 5-Phase Yamato Melee Attack (Rule 30) ──
  _startSwordSwing(opponent, cfg) {
    this.swordCooldown = cfg.swordCooldown ?? 24;
    this.swordComboStep = (this.swordComboStep + 1) % 4;
    this.swordSwingDir = this.swordComboStep % 2 === 0 ? 1 : -1;
    this.isSlashing = true;
    this.swordSwingPhase = 'lift';
    this.swordSwingTimer = 0;
    this.swordSwingPhaseMax = cfg.swordLiftFrames ?? 5;
    this.swordSwingPhaseProgress = 0;
    this.swordHitDealt = false;
    this._pendingBarrageFollowUpTarget = null;
    this._swordTarget = opponent || null;
    this._playSound('yamatoSlash', 0.72);
    const voSlashKey = ['voSlash1', 'voSlash2', 'voSlash3'][this.swordComboStep % 3];
    this._playSound(voSlashKey, 0.78);
    if (opponent) this.aim(opponent);
  }

  _updateSwordSwing(cfg) {
    if (!this.isSlashing || this.swordSwingPhase === 'idle') return;
    this.swordSwingTimer++;
    this.swordSwingPhaseProgress = Math.min(1, this.swordSwingTimer / Math.max(1, this.swordSwingPhaseMax));

    if ((this.swordSwingPhase === 'lift' || this.swordSwingPhase === 'hold') && this._swordTarget && !this._swordTarget.isDead && this._swordTarget.hp > 0) {
      this.aim(this._swordTarget);
    }

    if (this.swordSwingPhase === 'lift' && this.swordSwingTimer >= this.swordSwingPhaseMax) {
      this.swordSwingPhase = 'hold';
      this.swordSwingTimer = 0;
      this.swordSwingPhaseMax = cfg.swordHoldFrames ?? 2;
      this.swordSwingPhaseProgress = 0;
    } else if (this.swordSwingPhase === 'hold' && this.swordSwingTimer >= this.swordSwingPhaseMax) {
      this.swordSwingPhase = 'strike';
      this.swordSwingTimer = 0;
      this.swordSwingPhaseMax = cfg.swordStrikeFrames ?? 5;
      this.swordSwingPhaseProgress = 0;
    } else if (this.swordSwingPhase === 'strike') {
      if (!this.swordHitDealt && this.swordSwingPhaseProgress >= 0.45) {
        this.swordHitDealt = true;
        this._executeYamatoArcHit(cfg);
      }
      if (this.swordSwingTimer >= this.swordSwingPhaseMax) {
        this.swordSwingPhase = 'impactLock';
        this.swordSwingTimer = 0;
        this.swordSwingPhaseMax = cfg.swordImpactLockFrames ?? 5;
        this.swordSwingPhaseProgress = 0;
      }
    } else if (this.swordSwingPhase === 'impactLock') {
      if (this.swordSwingTimer >= this.swordSwingPhaseMax) {
        this.swordSwingPhase = 'recovery';
        this.swordSwingTimer = 0;
        this.swordSwingPhaseMax = cfg.swordRecoveryFrames ?? 8;
        this.swordSwingPhaseProgress = 0;
      }
    } else if (this.swordSwingPhase === 'recovery' && this.swordSwingTimer >= this.swordSwingPhaseMax) {
      this.isSlashing = false;
      this.swordSwingPhase = 'idle';
      this.swordSwingTimer = 0;
      this.swordSwingPhaseProgress = 0;

      // Basic Attack Follow-Up: Judgment Cut Barrage (State 1150 / 1160)
      const followTarget = this._pendingBarrageFollowUpTarget;
      this._pendingBarrageFollowUpTarget = null;
      if (
        followTarget &&
        !followTarget.isDead &&
        !followTarget.dead &&
        followTarget.hp > 0 &&
        this._isHostile(followTarget) &&
        this.isSkillEnabled(cfg.enableJudgmentBarrage, true) &&
        (this.judgmentBarrageCooldown || 0) <= 0 &&
        !(this.jceState && this.jceState.active) &&
        !(this.judgmentBarrageState && this.judgmentBarrageState.active)
      ) {
        this._startJudgmentBarrage(followTarget, cfg);
      }
    }
  }

  _executeYamatoArcHit(cfg) {
    const aim = this.gunAngle ?? this.angle ?? 0;
    const reach = (cfg.swordRange ?? 80) + (this.vergilForm >= 1 ? 10 : 0);
    const halfArc = ((cfg.swordArc ?? 140) * Math.PI) / 360;
    const baseDmg = Math.round((cfg.swordDamage ?? 15) * this._damageMultiplier());
    const cloneBonus = this.doppelgangerTimer > 0 ? Math.round(baseDmg * (cfg.doppelgangerDamageRatio ?? 0.28)) : 0;
    const totalDmg = baseDmg + cloneBonus;
    const kb = cfg.swordKnockback ?? 6.8;

    let hitAny = false;
    let primaryHitFoe = null;
    const targets = this._collectTargets();
    for (const foe of targets) {
      const dx = foe.x - this.x;
      const dy = foe.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > reach + (foe.r || 25)) continue;
      let diff = Math.atan2(dy, dx) - aim;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > halfArc && dist > (this.r || 30) + 12) continue;

      if (this._isGojoInfinityBlocked(foe)) {
        spawnSparks(foe.x - Math.cos(aim) * 18, foe.y - Math.sin(aim) * 18, 6, '#60A5FA', '#FFFFFF');
        continue;
      }

      hitAny = true;
      if (!primaryHitFoe) primaryHitFoe = foe;
      // Flush/replace any prior unfinished Mini JCE flurry on the same target so consecutive hits never stack visually
      for (let i = this.activeVisualEffects.length - 1; i >= 0; i--) {
        const oldFx = this.activeVisualEffects[i];
        if (oldFx.kind === 'miniJceFlurry' && oldFx.trackTarget === foe) {
          if (Array.isArray(oldFx.cuts)) {
            for (let c = 0; c < oldFx.cuts.length; c++) {
              const oc = oldFx.cuts[c];
              if (!oc.hitApplied && (oc.damage || 0) > 0 && foe.hp > 0 && !foe.isDead) {
                oc.hitApplied = true;
                applyDamageToTarget(foe, oc.damage, this, { source: 'yamato_slash', skipInterrupt: true });
              }
            }
          }
          this.activeVisualEffects.splice(i, 1);
        }
      }

      // Basic attack spawns a Mini Judgment Cut End animated multi-slash flurry on just the target body;
      // each individual cut deals its share of damage cleanly as it slices (no stun/pause, no glass shatter)
      const bodyRad = Math.max(54, (foe.r || 25) * 2.45);
      const cutCount = 7;
      const baseCutDmg = Math.floor(totalDmg / cutCount);
      const cutRem = totalDmg % cutCount;
      const cuts = [];
      const baseAngle = aim + (this.swordComboStep || 0) * 0.55;
      for (let c = 0; c < cutCount; c++) {
        const dirSign = c % 2 === 0 ? 1 : -1;
        const ang = baseAngle + (c * 1.08 * dirSign) + (Math.random() - 0.5) * 0.28;
        const offDist = (Math.random() - 0.5) * bodyRad * 0.44;
        const perpAng = ang + Math.PI * 0.5;
        cuts.push({
          ox: Math.cos(perpAng) * offDist,
          oy: Math.sin(perpAng) * offDist,
          ang,
          len: bodyRad * (2.05 + Math.random() * 0.40),
          thickness: 2.3 + Math.random() * 1.2,
          halo: (c % 3 === 0 && this.vergilForm >= 1) ? '#E11D48' : '#38BDF8',
          delay: c * 2,
          dur: 9,
          damage: Math.max(1, baseCutDmg + (c < cutRem ? 1 : 0)),
          hitApplied: c === 0,
        });
      }

      if (cuts[0].damage > 0) {
        applyDamageToTarget(foe, cuts[0].damage, this, { source: 'yamato_slash', skipInterrupt: true });
      }
      const pushAng = Math.atan2(dy, dx);
      foe.knockbackVx = (foe.knockbackVx || 0) + Math.cos(pushAng) * kb;
      foe.knockbackVy = (foe.knockbackVy || 0) + Math.sin(pushAng) * kb;
      spawnBloodEffect(foe.x, foe.y, 4);
      spawnSparks(foe.x, foe.y, 6, '#38BDF8', '#FFFFFF');

      this.activeVisualEffects.push({
        kind: 'miniJceFlurry',
        trackTarget: foe,
        x: foe.x,
        y: foe.y,
        radius: bodyRad,
        cuts,
        timer: 22,
        maxTimer: 22,
      });
    }

    if (hitAny) {
      this._pendingBarrageFollowUpTarget = primaryHitFoe;
      // Layered fleshy slap + rapid Yamato multi-cut SFX (no glass shatter) + light recoil
      if (typeof audioSystem !== 'undefined' && typeof audioSystem.playSFX === 'function') {
        audioSystem.playSFX('Assets/Sound Effects/Attacks/fleshhit.mp3', 0.85);
      }
      this._playSound('yamatoSlash', 0.68);
      this._playSound('hitSlice', 0.78);
      this._gainConcentration(12);
    }
  }

  _updateMiniJceFlurryHits() {
    for (let i = 0; i < this.activeVisualEffects.length; i++) {
      const fx = this.activeVisualEffects[i];
      if (fx.kind !== 'miniJceFlurry' || !Array.isArray(fx.cuts)) continue;
      const foe = fx.trackTarget;
      if (!foe || foe.isDead || foe.dead || foe.hp <= 0) continue;
      if (!this._isHostile(foe) || this._isGojoInfinityBlocked(foe)) continue;

      const elapsed = Math.max(0, (fx.maxTimer || 30) - (fx.timer || 0));
      for (let c = 0; c < fx.cuts.length; c++) {
        const cut = fx.cuts[c];
        if (cut.hitApplied || elapsed < (cut.delay || 0)) continue;
        cut.hitApplied = true;
        if ((cut.damage || 0) > 0) {
          applyDamageToTarget(foe, cut.damage, this, { source: 'yamato_slash', skipInterrupt: true });
          spawnSparks(foe.x + (cut.ox || 0), foe.y + (cut.oy || 0), 4, '#38BDF8', '#FFFFFF');
          spawnBloodEffect(foe.x, foe.y, 2);
          this._playSound('hitSlice', 0.45);
        }
      }
    }
  }

  // ── Skill 1: Judgment Cut (State 1000 / 1020) ──
  _castJudgmentCut(target, cfg) {
    this.judgmentCutCooldown = cfg.judgmentCutCooldown ?? 190;
    const ang = Math.atan2(target.y - this.y, target.x - this.x);
    this.gunAngle = ang;
    this.trickAngle = ang;
    this.shunpoVfxTimer = 12;

    // Evade backstep (MUGEN State 1021 velset = -15,0)
    const backSpd = cfg.judgmentCutBackstepSpeed ?? 10.5;
    this.vx = -Math.cos(ang) * backSpd;
    this.vy = -Math.sin(ang) * backSpd;
    this.afterimages.push({ x: this.x, y: this.y, angle: ang, alpha: 0.55 });

    const sphereR = cfg.judgmentCutRadius ?? 68;
    const tx = target.x;
    const ty = target.y;
    this.activeVisualEffects.push({
      kind: 'judgmentCutSphere',
      x: tx,
      y: ty,
      radius: sphereR,
      rotation: ang,
      timer: 26,
      maxTimer: 26,
    });

    const dmg = Math.round((cfg.judgmentCutDamage ?? 22) * this._damageMultiplier());
    const targets = this._collectTargets();
    let landed = false;
    for (const foe of targets) {
      if (Math.hypot(foe.x - tx, foe.y - ty) <= sphereR + (foe.r || 25)) {
        if (this._isGojoInfinityBlocked(foe)) continue;
        landed = true;
        applyDamageToTarget(foe, dmg, this, { source: 'judgment_cut', undodgeable: true });
        if (typeof foe.applyHitStun === 'function') foe.applyHitStun(cfg.judgmentCutStunFrames ?? 18);
        spawnBloodEffect(foe.x, foe.y, 12);
        spawnSparks(foe.x, foe.y, 12, '#38BDF8', '#FFFFFF');
      }
    }
    this._playSound('judgmentCut', 0.86);
    this._playSound('sheathSnap', 0.78);
    this._playSound('voJudgmentCut', 0.88);
    if (landed) this._gainConcentration(14);
    triggerGlobalScreenShake(5, 8);
  }

  // ── Rapid Slash Entry (Merged into Ultimate: Rapid Slash -> Judgment Cut End) ──
  _startRapidSlash(target, cfg = this._cfg()) {
    this._startJudgmentCutEnd(target, cfg);
  }

  _updateRapidSlashState(cfg) {
    const inJceDash = Boolean(this.jceState && this.jceState.active && this.jceState.phase === 'dash');
    if (this.rapidSlashTimer <= 0 || !inJceDash) return;

    const dmg = Math.round((cfg.rapidSlashDamage ?? 24) * this._damageMultiplier());
    for (const foe of this._collectTargets()) {
      if (this.rapidSlashHitTargets.has(foe)) continue;
      if (Math.hypot(foe.x - this.x, foe.y - this.y) <= (this.r || 30) + (foe.r || 25) + 22) {
        if (this._isGojoInfinityBlocked(foe)) {
          this.rapidSlashTimer = 0;
          if (inJceDash) this.jceState = null;
          this.vx = -Math.cos(this.skillCastAngle) * 5;
          this.vy = -Math.sin(this.skillCastAngle) * 5;
          return;
        }
        this.rapidSlashHitTargets.add(foe);
        applyDamageToTarget(foe, dmg, this, { source: 'rapid_slash' });
        if (typeof foe.applyHitStun === 'function') foe.applyHitStun(16);
        spawnBloodEffect(foe.x, foe.y, 12);
        spawnSparks(foe.x, foe.y, 14, '#38BDF8', '#FFFFFF');
        this.activeVisualEffects.push({
          kind: 'slashEruption',
          x: foe.x,
          y: foe.y,
          radius: 58,
          rotation: this.skillCastAngle,
          timer: 18,
          maxTimer: 18,
        });
        this._playSound('heavyCleave', 0.85);
        this._gainConcentration(14);
        triggerGlobalScreenShake(6, 8);
      }
    }
  }

  // ── Skill 2: Trick Teleport Dodge Entry (State 550 / 551) ──
  _castTrickTeleport(target, cfg, arenaObj) {
    return this._executeTrickDodge(target, cfg, arenaObj);
  }

  // ── Skill 4: 6-Sword Orbit Ring + Blistering Aimed Fire -> Heavy Rain Swords (State 360 / 1100 -> 2370) ──
  _castSummonedSwords(cfg, target = null) {
    this.summonedSwordsCooldown = cfg.summonedSwordsCooldown ?? 280;
    const count = cfg.summonedSwordCount ?? 6;
    const duration = cfg.summonedSwordOrbitDuration ?? 280;
    const orbitR = (this.r || 30) + (cfg.summonedSwordOrbitOffset ?? 28);

    this.orbitingSwords = [];
    for (let i = 0; i < count; i++) {
      this.orbitingSwords.push({
        angle: (i / count) * Math.PI * 2,
        orbitR,
        life: duration,
      });
    }
    this.swordAimFireTimer = 18;
    this._summonedSwordHits = 0;
    this._pendingSwordRainFollowUp = true;
    this._pendingSwordRainTarget = target || null;
    this._playSound('summonSword', 0.78);
    this._playSound('voSummonSwords', 0.86);
    this._gainConcentration(8);
  }

  // ── Heavy Rain Swords Follow-Up (State 2370 / 2375 -> 2376) ──
  _castSwordRain(target, cfg, hitCount = null) {
    const count = hitCount !== null ? hitCount : (cfg.swordRainHits ?? 7);
    if (count <= 0 || !target) return;
    this.swordRainState = {
      active: true,
      target,
      x: target.x,
      y: target.y,
      ticksRemaining: count,
      intervalTimer: 0,
    };
    this._playSound('summonSword', 0.80);
  }

  _updateSwordRainState(cfg) {
    const sr = this.swordRainState;
    if (!sr || !sr.active) return;
    if (sr.target && !sr.target.isDead && sr.target.hp > 0) {
      sr.x += (sr.target.x - sr.x) * 0.25;
      sr.y += (sr.target.y - sr.y) * 0.25;
    }
    if (sr.intervalTimer > 0) {
      sr.intervalTimer--;
      return;
    }
    sr.ticksRemaining--;
    sr.intervalTimer = 8;

    const sx = sr.x + (Math.random() - 0.5) * 70;
    const sy = sr.y + (Math.random() - 0.5) * 56;
    this.activeVisualEffects.push({
      kind: 'swordRainStrike',
      x: sx,
      y: sy,
      radius: 48,
      timer: 18,
      maxTimer: 18,
    });

    const dmg = Math.round((cfg.swordRainDamage ?? 6) * this._damageMultiplier());
    for (const foe of this._collectTargets()) {
      if (Math.hypot(foe.x - sx, foe.y - sy) <= 58 + (foe.r || 25)) {
        if (this._isGojoInfinityBlocked(foe)) continue;
        applyDamageToTarget(foe, dmg, this, { source: 'heavy_rain_swords' });
        foe.vx *= 0.65;
        foe.vy *= 0.65;
        if (typeof foe.applyHitStun === 'function') foe.applyHitStun(8);
        spawnSparks(foe.x, foe.y, 6, '#38BDF8', '#E0F2FE');
        this._gainConcentration(4);
      }
    }
    this._playSound('hitSlice', 0.66);

    if (sr.ticksRemaining <= 0) {
      this.swordRainState = null;
    }
  }

  // ── Skill 6: Mirage Edge Boomerang (State 530 / 535) ──
  _castMirageBoomerang(target, cfg) {
    this.mirageBoomerangCooldown = cfg.mirageBoomerangCooldown ?? 250;
    const ang = Math.atan2(target.y - this.y, target.x - this.x);
    this.gunAngle = ang;
    const spd = cfg.mirageBoomerangSpeed ?? 11.5;
    this.vergilProjectiles.push({
      kind: 'mirage_boomerang',
      x: this.x + Math.cos(ang) * ((this.r || 30) + 12),
      y: this.y + Math.sin(ang) * ((this.r || 30) + 12),
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      r: 22,
      damage: Math.round((cfg.mirageBoomerangDamage ?? 11) * this._damageMultiplier()),
      age: 0,
      maxAge: 110,
      hitCooldowns: new Map(),
    });
    this._playSound('mirageBoomerang', 0.80);
    this._playSound('voMirageEdge', 0.86);
    this._gainConcentration(6);
  }

  // ── Skill 7: Doppelganger Spectral Clone (State 1200 / Helper 1220) ──
  _castDoppelganger(cfg) {
    if (this.vergilForm >= 1) return false; // MUGEN var(2)=0 rule: Base Form summon
    this.doppelgangerCooldown = cfg.doppelgangerCooldown ?? 420;
    this.doppelgangerTimer = cfg.doppelgangerDuration ?? 240;
    this.activeVisualEffects.push({
      kind: 'doppelPortal',
      x: this.x,
      y: this.y,
      radius: 58,
      timer: 22,
      maxTimer: 22,
    });
    spawnFloatingText(this.x, this.y - (this.r || 30) - 22, 'DOPPELGANGER!', '#38BDF8', 16);
    this._playSound('doppelganger', 0.85);
    this._playSound('voDoppelganger', 0.88);
    return true;
  }

  // ── Super: Judgment Cut Barrage (State 1150 / 1160) ──
  _pickRandomBarragePose() {
    const prev = this.barrageCutCenter ?? 0;
    let candidate = (Math.random() - 0.5) * 2.5;
    for (let attempt = 0; attempt < 6; attempt++) {
      if (Math.abs(candidate - prev) >= 0.70) break;
      candidate = (Math.random() - 0.5) * 2.5;
    }
    this.barrageCutCenter = candidate;
    this.barrageCutDir = Math.random() < 0.78 ? -(this.barrageCutDir || 1) : (this.barrageCutDir || 1);
    this.barrageSlashMax = 7;
    this.barrageSlashTimer = 7;
  }

  _startJudgmentBarrage(target, cfg) {
    this.judgmentBarrageCooldown = cfg.judgmentBarrageCooldown ?? 360;
    if (target) this.aim(target);
    this.judgmentBarrageState = {
      active: true,
      target,
      x: target.x,
      y: target.y,
      ticksRemaining: cfg.judgmentBarrageTicks ?? 6,
      intervalTimer: 0,
    };
    this.trickAngle = Math.atan2(target.y - this.y, target.x - this.x);
    this.shunpoVfxTimer = 14;
    this._playSound('judgmentCut', 0.88);
    this._playSound('voBarrage', 0.90);
  }

  _updateJudgmentBarrageState(cfg) {
    const jb = this.judgmentBarrageState;
    if (!jb || !jb.active) return;
    this.vx *= 0.2;
    this.vy *= 0.2;
    const barrageTarget = (jb.target && !jb.target.isDead && !jb.target.dead && jb.target.hp > 0)
      ? jb.target
      : this._pickNearestTarget(null);
    if (barrageTarget) {
      jb.target = barrageTarget;
      jb.x += (barrageTarget.x - jb.x) * 0.35;
      jb.y += (barrageTarget.y - jb.y) * 0.35;
      this.aim(barrageTarget);
    }
    if (jb.intervalTimer > 0) {
      jb.intervalTimer--;
      return;
    }
    jb.ticksRemaining--;
    jb.intervalTimer = 7;
    this._pickRandomBarragePose();

    const sx = jb.x + (Math.random() - 0.5) * 64;
    const sy = jb.y + (Math.random() - 0.5) * 64;
    const cutAng = (this.gunAngle ?? 0) + this.barrageCutCenter + (Math.random() - 0.5) * 0.28;
    this.activeVisualEffects.push({
      kind: 'screenSlashLine',
      x: sx,
      y: sy,
      length: 340 + Math.random() * 140,
      angle: cutAng,
      thickness: 2.6,
      timer: 18,
      maxTimer: 18,
    });
    if (jb.ticksRemaining % 2 === 0) {
      this.activeVisualEffects.push({
        kind: 'judgmentCutSphere',
        x: sx,
        y: sy,
        radius: 54,
        rotation: cutAng,
        timer: 18,
        maxTimer: 18,
      });
    }

    const dmg = Math.round((cfg.judgmentBarrageDamage ?? 7) * this._damageMultiplier());
    for (const foe of this._collectTargets()) {
      if (Math.hypot(foe.x - sx, foe.y - sy) <= 84 + (foe.r || 25)) {
        if (this._isGojoInfinityBlocked(foe)) continue;
        applyDamageToTarget(foe, dmg, this, { source: 'judgment_barrage', undodgeable: true });
        if (typeof foe.applyHitStun === 'function') foe.applyHitStun(9);
        spawnSparks(foe.x, foe.y, 7, '#38BDF8', '#FFFFFF');
      }
    }
    this._playSound('hitSlice', 0.72);

    if (jb.ticksRemaining <= 0) {
      this._playSound('glassShatter', 0.85);
      this.judgmentBarrageState = null;
    }
  }

  // ── Ultimate Sequence: Rapid Slash Windup -> Pass-Through -> Judgment Cut End (State 3000 -> 3004) ──
  _startJudgmentCutEnd(target, cfg) {
    this.judgmentCutEndCooldown = cfg.judgmentCutEndCooldown ?? 620;
    const arena = (typeof state !== 'undefined' && state.arena) || { x: 45, y: 240, width: 450, height: 450 };
    // Occupy the entire arena corner-to-corner regardless of where Vergil or targets stand
    const radius = Math.max(cfg.judgmentCutEndRadius ?? 215, Math.hypot(arena.width, arena.height) * 0.56);
    const cx = arena.x + arena.width * 0.5;
    const cy = arena.y + arena.height * 0.5;
    const dashAngle = target ? Math.atan2(target.y - this.y, target.x - this.x) : (this.gunAngle ?? 0);
    const windupTicks = Math.max(4, cfg.rapidSlashWindupFrames ?? 12);
    const dashTicks = cfg.rapidSlashDurationFrames ?? 18;

    this.skillCastAngle = dashAngle;
    this.gunAngle = dashAngle;
    this.rapidSlashTimer = 0;
    this.rapidSlashHitTargets = new Set();
    this.vx = 0;
    this.vy = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;

    this.jceState = {
      active: true,
      cx,
      cy,
      radius,
      arenaX: arena.x,
      arenaY: arena.y,
      arenaW: arena.width,
      arenaH: arena.height,
      dashAngle,
      dashTarget: target || null,
      passedTarget: false,
      phase: 'windup',
      windupTicks,
      dashTicks,
      chargeTicks: 20,
      slashTicks: 42,
      shatterTicks: 22,
      phaseTimer: windupTicks,
      timer: windupTicks + dashTicks + 20 + 42 + 22,
      lockedX: this.x,
      lockedY: this.y,
      screenCuts: [],
    };

    this._playSound('sheathSnap', 0.80);
    this._playSound('voRapidSlash', 0.92);
  }

  _enterJceChargePhase(jce, cfg) {
    jce.phase = 'charge';
    jce.phaseTimer = jce.chargeTicks;
    jce.sheathClicked = false;
    jce.lockedX = this.x;
    jce.lockedY = this.y;
    this.rapidSlashTimer = 0;
    this.vx = 0;
    this.vy = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    this._stationaryStallFrames = 0;
    if (jce.dashTarget) {
      this.aim(jce.dashTarget);
    }

    // Rule 1.5: Apply time-stop / stasis ONLY to hostile targets inside the arena, NEVER to this!
    const freezeFrames = Math.max(cfg.judgmentCutEndFreezeFrames ?? 56, 56);
    for (const foe of this._collectTargets()) {
      if (Math.hypot(foe.x - jce.cx, foe.y - jce.cy) <= jce.radius + (foe.r || 25)) {
        if (!this._isGojoInfinityBlocked(foe) && typeof foe.applyTimeStop === 'function') {
          foe.applyTimeStop(freezeFrames);
        }
      }
    }

    spawnFloatingText(this.x, this.y - (this.r || 30) - 26, 'JUDGMENT CUT END!', '#BAE6FD', 19);
    triggerGlobalScreenShake(5, 10);
  }

  _spawnJceScreenCut(jce) {
    const aW = jce.arenaW || 450;
    const aH = jce.arenaH || 450;
    const midX = (jce.arenaX ?? (jce.cx - aW * 0.5)) + aW * (0.06 + Math.random() * 0.88);
    const midY = (jce.arenaY ?? (jce.cy - aH * 0.5)) + aH * (0.06 + Math.random() * 0.88);
    const ang = Math.random() * Math.PI;
    const halfSpan = Math.hypot(aW, aH) * 0.72;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    jce.screenCuts.push({
      x1: midX - ca * halfSpan,
      y1: midY - sa * halfSpan,
      x2: midX + ca * halfSpan,
      y2: midY + sa * halfSpan,
      thickness: 1.8 + Math.random() * 2.0,
      halo: (jce.screenCuts.length % 4 === 0 && this.vergilForm >= 1) ? '#E11D48' : '#38BDF8',
      age: 0,
    });
    const cutShake = this._cfg()?.judgmentCutEndCutShake ?? 7.5;
    triggerGlobalScreenShake(cutShake, 4);
  }

  _updateJudgmentCutEndState(cfg) {
    const jce = this.jceState;
    if (!jce || !jce.active) return;
    jce.timer--;
    jce.phaseTimer--;

    if (jce.phase === 'windup') {
      this.vx = 0;
      this.vy = 0;
      this.knockbackVx = 0;
      this.knockbackVy = 0;
      this._stationaryStallFrames = 0;
      if (jce.lockedX !== undefined) this.x = jce.lockedX;
      if (jce.lockedY !== undefined) this.y = jce.lockedY;
      this.gunAngle = jce.dashAngle;

      if (jce.phaseTimer <= 0) {
        jce.phase = 'dash';
        jce.phaseTimer = jce.dashTicks;
        delete jce.lockedX;
        delete jce.lockedY;
        this.rapidSlashTimer = jce.dashTicks;
        this._playSound('rapidDash', 0.88);
        triggerGlobalScreenShake(5, 8);
      }
      return;
    }

    if (jce.phase === 'dash') {
      // Phase 1: Rapid Slash pass-through dash (no body block in physics.js)
      const spd = Math.max(cfg.rapidSlashDashSpeed ?? 18.0, 18.0);
      this.vx = Math.cos(jce.dashAngle) * spd;
      this.vy = Math.sin(jce.dashAngle) * spd;
      this.gunAngle = jce.dashAngle;
      this.rapidSlashTimer = Math.max(1, jce.phaseTimer);
      if (jce.phaseTimer % 2 === 0) {
        this.afterimages.push({ x: this.x, y: this.y, angle: jce.dashAngle, alpha: 0.62 });
      }

      // Judgment Cut End ONLY unlocks once Vergil physically slices a target and dashes past behind them
      const ux = Math.cos(jce.dashAngle);
      const uy = Math.sin(jce.dashAngle);
      for (const foe of this.rapidSlashHitTargets) {
        if (!foe || foe.isDead || foe.hp <= 0) continue;
        const dx = this.x - foe.x;
        const dy = this.y - foe.y;
        const forwardDot = dx * ux + dy * uy;
        const clearDist = (this.r || 30) + (foe.r || 25) + 12;
        if (forwardDot >= clearDist) {
          jce.dashTarget = foe;
          jce.passedTarget = true;
          break;
        }
      }

      if (jce.passedTarget && jce.phaseTimer <= jce.dashTicks - 6) {
        this._enterJceChargePhase(jce, cfg);
      } else if (jce.phaseTimer <= 0) {
        if (jce.passedTarget) {
          this._enterJceChargePhase(jce, cfg);
        } else {
          // Whiffed or blocked before passing behind target: cancel JCE & refund partial cooldown
          this.jceState = null;
          this.rapidSlashTimer = 0;
          this.vx *= 0.25;
          this.vy *= 0.25;
          this.judgmentCutEndCooldown = Math.round((cfg.judgmentCutEndCooldown ?? 620) * 0.40);
        }
      }
      return;
    }

    this.vx = 0;
    this.vy = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    this._stationaryStallFrames = 0;
    if (jce.lockedX !== undefined) this.x = jce.lockedX;
    if (jce.lockedY !== undefined) this.y = jce.lockedY;

    if (Array.isArray(jce.screenCuts)) {
      for (let i = 0; i < jce.screenCuts.length; i++) jce.screenCuts[i].age++;
    }

    if (jce.phase === 'charge') {
      const clickTick = Math.max(1, Math.round((jce.chargeTicks || 20) * 0.18));
      if (!jce.sheathClicked && jce.phaseTimer <= clickTick) {
        jce.sheathClicked = true;
        this._playSound('sheathSnap', 0.94);
        triggerGlobalScreenShake(7, 10);
      }
      if (jce.phaseTimer <= 0) {
        jce.phase = 'slash';
        jce.phaseTimer = jce.slashTicks;
        this._spawnJceScreenCut(jce);
        this._spawnJceScreenCut(jce);
        this._playSound('judgmentCut', 0.90);
        this._playSound('rapidDash', 0.84);
      }
    } else if (jce.phase === 'slash') {
      // Carve rapid multi-angle screen-spanning cut seams across first 34 ticks, then brief dramatic pause
      if (jce.phaseTimer > 8 && jce.screenCuts.length < 36) {
        this._spawnJceScreenCut(jce);
        if (jce.phaseTimer % 2 === 0 && jce.screenCuts.length < 36) {
          this._spawnJceScreenCut(jce);
        }
        if (jce.phaseTimer % 4 === 0) {
          this.afterimages.push({
            x: (jce.arenaX ?? 45) + (jce.arenaW ?? 450) * (0.2 + Math.random() * 0.6),
            y: (jce.arenaY ?? 240) + (jce.arenaH ?? 450) * (0.2 + Math.random() * 0.6),
            angle: Math.random() * Math.PI * 2,
            alpha: 0.45,
          });
          this._playSound('yamatoSlash', 0.72);
        }
      }
      if (jce.phaseTimer % 9 === 1) {
        const dmg = Math.round(((cfg.judgmentCutEndBarrageDamage ?? 24) / 4) * this._damageMultiplier());
        for (const foe of this._collectTargets()) {
          if (Math.hypot(foe.x - jce.cx, foe.y - jce.cy) <= jce.radius + (foe.r || 25)) {
            if (this._isGojoInfinityBlocked(foe)) continue;
            applyDamageToTarget(foe, dmg, this, { source: 'judgment_cut_end_blitz', undodgeable: true });
            spawnBloodEffect(foe.x, foe.y, 7);
            spawnSparks(foe.x, foe.y, 10, '#E0F2FE', '#38BDF8');
          }
        }
        this._playSound('hitSlice', 0.78);
      }
      if (jce.phaseTimer <= 0) {
        jce.phase = 'shatter';
        jce.phaseTimer = jce.shatterTicks;
        this._detonateJudgmentCutEnd(jce, cfg);
      }
    } else if (jce.phase === 'shatter' && jce.phaseTimer <= 0) {
      this.jceState = null;
    }
  }

  _detonateJudgmentCutEnd(jce, cfg) {
    const dmg = Math.round((cfg.judgmentCutEndShatterDamage ?? 48) * this._damageMultiplier());
    const kb = cfg.judgmentCutEndKnockback ?? 13.5;
    const postStun = Math.max(0, cfg.judgmentCutEndPostStunFrames ?? 36);
    const totalStun = postStun > 0 ? ((jce.shatterTicks || 22) + postStun) : 0;

    for (const foe of this._collectTargets()) {
      if (Math.hypot(foe.x - jce.cx, foe.y - jce.cy) <= jce.radius + (foe.r || 25)) {
        if (this._isGojoInfinityBlocked(foe)) continue;
        applyDamageToTarget(foe, dmg, this, { source: 'judgment_cut_end', undodgeable: true });
        const ang = Math.atan2(foe.y - jce.cy, foe.x - jce.cx);
        foe.knockbackVx = (foe.knockbackVx || 0) + Math.cos(ang) * kb;
        foe.knockbackVy = (foe.knockbackVy || 0) + Math.sin(ang) * kb;
        if (totalStun > 0 && typeof foe.applyHitStun === 'function') {
          foe.applyHitStun(totalStun);
        }
        spawnBloodEffect(foe.x, foe.y, 18);
        spawnImpactFlash(foe.x, foe.y, 52, '#38BDF8');
      }
    }

    this.activeVisualEffects.push({
      kind: 'dimensionShatterBurst',
      x: jce.cx,
      y: jce.cy,
      radius: jce.radius,
      arenaX: jce.arenaX,
      arenaY: jce.arenaY,
      arenaW: jce.arenaW,
      arenaH: jce.arenaH,
      timer: 28,
      maxTimer: 28,
    });
    this._playSound('glassShatter', 0.94);
    this._playSound('dimensionBoom', 0.90);
    this._playSound('voJce', 0.94);
    triggerGlobalScreenShake(13, 18);
  }

  // ── Skill Decision AI Matrix ──
  _updateSkillAI(opponent, cfg, arenaObj) {
    const target = this._pickNearestTarget(opponent);
    if (!target) return;

    const dist = Math.hypot(target.x - this.x, target.y - this.y);
    const busy = this.rapidSlashTimer > 0 || (this.jceState && this.jceState.active) || (this.judgmentBarrageState && this.judgmentBarrageState.active);
    if (busy) return;

    this._checkParryAnticipation(target, dist, cfg);

    // 1. Ultimate: Rapid Slash Pass-Through -> Judgment Cut End (initiate within dash reach)
    if (this.isSkillEnabled(cfg.enableJudgmentCutEnd, true) && (this.judgmentCutEndCooldown || 0) <= 0 && dist <= 250) {
      this._startJudgmentCutEnd(target, cfg);
      return;
    }

    // 2. Base Form Awakening Helper: Doppelganger Clone (Dimension Barrage is merged into Basic Attack follow-up)
    if (this.vergilForm === 0 && this.isSkillEnabled(cfg.enableDoppelganger, true) && (this.doppelgangerCooldown || 0) <= 0 && this.doppelgangerTimer <= 0) {
      if (this._castDoppelganger(cfg)) return;
    }

    // 4. Merged Skill 4: 6 Summoned Swords Orbit Ring -> Heavy Rain Swords Follow-Up
    if (this.isSkillEnabled(cfg.enableSummonedSwords, true) && (this.summonedSwordsCooldown || 0) <= 0 &&
        this.orbitingSwords.length === 0 && !this.swordRainState) {
      this._castSummonedSwords(cfg, target);
      return;
    }

    // 5. Mirage Edge Boomerang
    if (this.isSkillEnabled(cfg.enableMirageBoomerang, true) && (this.mirageBoomerangCooldown || 0) <= 0 && dist >= 85) {
      this._castMirageBoomerang(target, cfg);
      return;
    }

    // 8. Judgment Cut spatial sphere
    if (this.isSkillEnabled(cfg.enableJudgmentCut, true) && (this.judgmentCutCooldown || 0) <= 0 && dist <= 240) {
      this._castJudgmentCut(target, cfg);
      return;
    }

    // 8. Basic 5-phase Yamato cleave when in melee range (Trick Teleport triggers reactively as dodge)
    if (this.isSkillEnabled(cfg.enableSwordAttack, true) && !this.isSlashing && (this.swordCooldown || 0) <= 0 && dist <= (cfg.swordRange ?? 80) + (target.r || 25) + 10) {
      this._startSwordSwing(target, cfg);
    }
  }

  update(opponent, ownerIndex, arenaObj) {
    // 0. Rule 25: Update visual effects, Shockwaves, Projectiles & JCE BEFORE freeze guard
    this._updateVisualEffects(arenaObj);

    // 1. Rule 1.1: Freeze & Time-Stop Guard
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks();
      return;
    }

    const cfg = this._cfg();
    this._checkSpardaFormAwakening(cfg);
    this._tickVergilTimers(cfg);
    this._updateRapidSlashState(cfg);
    this._updateSwordSwing(cfg);
    this._updateMiniJceFlurryHits();
    this._updateSkillAI(opponent, cfg, arenaObj);

    // Rule 1.2: Centralized natural movement & arena/fighter wall bounce
    super.update(opponent, ownerIndex, arenaObj);

    if (this.judgmentBarrageState?.active && this.judgmentBarrageState.target) {
      this.aim(this.judgmentBarrageState.target);
    }
  }

  /**
   * Standard engine body hook for previews & render passes (Rule 21).
   */
  drawBody(ctx) {
    drawVergilSkin(ctx, this);
  }

  /**
   * Main render pipeline: Aura/Doppelganger -> Body -> Yamato/Arm -> Combat VFX -> HP/Freeze (Rule 21).
   */
  draw(ctx, opponent) {
    if (this.isDeathShattered) return;

    drawVergilAuraAndMobilityVFX(ctx, this, this._vfxTick);
    this.drawBody(ctx);
    drawVergilBladeAndSlashVFX(ctx, this);

    // Defer Vergil combat VFX (Mini JCE cuts, Judgment Cut Spheres, JCE domain) onto the
    // Foreground FX Pass so Y-sorted enemy bodies & illusions never overlay the target cuts
    if (typeof state !== 'undefined' && state._deferFighterForegroundFx && Array.isArray(state._deferredForegroundFx)) {
      const tickSnapshot = this._vfxTick;
      state._deferredForegroundFx.push({
        fighter: this,
        draw: (fgCtx, fgFighter) => drawVergilCombatVFX(fgCtx, fgFighter, tickSnapshot),
      });
    } else {
      drawVergilCombatVFX(ctx, this, this._vfxTick);
    }

    // Rule 21: Mandatory overhead HP number & freeze overlay
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }
}
