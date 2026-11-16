// ───────────────────────────────────────────────────────────────────────────
// Sōsuke Aizen — Transcendent Shinigami Fighter Entity
// Bleach: Base -> Hōgyoku Fusion -> Final Form (Butterfly / Fragor)
//
// Adheres strictly to:
// - Rule 1.1: Freeze & TimeStop Early Exits
// - Rule 1.2: Centralized Physics via super.update()
// - Rule 1.3 & 1.4: Teleport Aim Alignment & 360° Committed Skill Aim Lock
// - Rule 1.5 & 1.6: Target-Only Stasis & Multi-Target Frontal Arc AOE
// - Rule 18: Unified Theme Color (#8B5CF6) & Config Toggle Gating
// - Rule 21: In-Game Overlay HP & Status Drawing (drawHealth + drawFreezeTimer)
// - Rule 23: Basic Projectile Suppression (shoot override)
// - Rule 24 & 32: Preserve scaled r from super(def) & World-Space 2.0px Outline
// - Rule 25: Top-of-Update VFX & Projectile Decay (never freeze mid-air)
// - Rule 30: 5-Phase Melee Swing & Layered Fleshy Slap Audio
// ───────────────────────────────────────────────────────────────────────────

import { Fighter, applyDamageToTarget, isSkillEnabled } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { aizenConfig } from '../../configs/characters/aizenConfig.js';
import { state, spawnFloatingText, triggerGlobalScreenShake } from '../../core/state.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { spawnSparks, spawnImpactFlash } from '../../graphics/particles/sparkEffect.js';
import { spawnBloodEffect } from '../../graphics/particles/bloodEffect.js';
import { drawAizenSkin, drawAizenGhostSkin } from '../../graphics/fighters/aizenSkin.js';
import {
  prewarmAizenVfxAssets,
  drawAizenBladeAndSlashVFX,
  drawAizenShunpoSpeedLinesVFX,
  drawAizenFormAuraVFX,
  drawAizenDankuVFX,
  drawAizenKyokaVFX,
  drawAizenProjectilesVFX,
  drawAizenRaikohoBeamVFX,
  drawAizenKurohitsugiVFX,
  drawAizenRikujokoroVFX,
  drawAizenDomainAndRushVFX,
} from '../../graphics/weapons/aizenWeaponGraphics.js';

export class AizenFighter extends Fighter {
  constructor(def = {}) {
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.aizen) ? CONFIG.aizen : aizenConfig;

    // Rule 24: Preserve scaled radius computed by super(def)
    super({
      ...def,
      r: def.r ?? cfg.r ?? 25,
      radius: def.radius ?? cfg.radius ?? 25,
      hp: def.hp ?? cfg.hp ?? 260,
      maxHp: def.maxHp ?? cfg.hp ?? 260,
      speed: def.speed ?? cfg.speed ?? 6.0,
      damage: def.damage ?? cfg.swordDamage ?? 16,
      cooldown: def.cooldown ?? cfg.swordCooldown ?? 28,
      color: def.color || cfg.color || '#8B5CF6',
    });

    this.characterId = 'aizen';
    this.type = 'aizen';
    this.name = def?.name || cfg.name || 'Aizen';
    this.displayName = def?.displayName || cfg.displayName || 'AIZEN';
    this.grade = cfg.grade || 'SS';
    this.title = cfg.title || 'Transcendent Shinigami';
    this.color = cfg.color || '#8B5CF6';
    this.themeColor = cfg.themeColor || '#8B5CF6';
    this.damageNumberColor = cfg.damageNumberColor || '#A855F7';
    this.moveSpeed = def.moveSpeed ?? cfg.moveSpeed ?? cfg.speed ?? 6.0;
    this.speed = this.moveSpeed;
    this.suppressSketchyOutline = true;
    this.usesCustomHands = true;

    this._initAizenState(cfg);
    prewarmAizenVfxAssets();
  }

  /**
   * Rule 35 pre-battle hook invoked by prewarmMatchAssets() before Round 1 starts.
   */
  prewarmAssets(targetCtx = null) {
    return prewarmAizenVfxAssets(targetCtx);
  }

  reset() {
    super.reset();
    this._initAizenState(this._cfg());
  }

  _cfg() {
    return (typeof CONFIG !== 'undefined' && CONFIG.aizen) ? CONFIG.aizen : aizenConfig;
  }

  _initAizenState(cfg = this._cfg()) {
    this._vfxTick = 0;
    this._soundPlayTimestamps = {};

    // Form Progression: 0 = Base, 1 = Hogyoku, 2 = Final Form
    this.aizenForm = 0;
    this.hogyokuGauge = 0;
    this.formTransformVfxTimer = 0;

    // 5-Phase Melee Swing State (Rule 30)
    this.swordCooldown = 16;
    this.swordCooldownMax = cfg.swordCooldown ?? 28;
    this.swordComboIndex = 0;
    this.isSlashing = false;
    this.swordSwingPhase = 'idle';
    this.swordSwingTimer = 0;
    this.swordSwingPhaseMax = 1;
    this.swordSwingPhaseProgress = 0;
    this.swordHitDealt = false;
    this.hideFrontHand = false;
    this.hideBackHand = false;
    this.shootCooldownMax = 0;
    this.shootCooldown = 999999;

    // Skill 1: Kyoka Suigetsu Counter
    this.kyokaCounterCooldown = 70;
    this.kyokaCounterCooldownMax = cfg.kyokaCounterCooldown ?? 300;
    this.isKyokaCounterStance = false;
    this.kyokaCounterTimer = 0;

    // Skill 2: Hado #63 Raikoho Beam / Multi-Orbs / Fragor
    this.raikohoCooldown = 45;
    this.raikohoCooldownMax = cfg.raikohoCooldown ?? 220;
    this.raikohoWindupTimer = 0;
    this.raikohoBeamState = null;
    this.skillCastAngle = 0;

    // Skill 3: Bakudo #81 Danku + Shunpo
    this.dankuCooldown = 95;
    this.dankuCooldownMax = cfg.dankuCooldown ?? 340;
    this.dankuActive = false;
    this.dankuTimer = 0;
    this.dankuAngle = 0;
    this.dankuRadius = cfg.dankuRadius ?? 42;
    this.shunpoVfxTimer = 0;
    this.shunpoAngle = 0;

    // Option Skill: Bakudo #61 Rikujokoro Six-Beam Prison (MUGEN State 1300-1302)
    this.rikujokoroCooldown = 110;
    this.rikujokoroCooldownMax = cfg.rikujokoroCooldown ?? 420;
    this.rikujokoroWindupTimer = 0;
    this.rikujokoroState = null;

    // Final Form Skill: Multi Explosions Flanking Spawns (MUGEN State 27200/27250)
    this.multiExplosionsCooldown = 0;
    this.multiExplosionsCooldownMax = cfg.multiExplosionsCooldown ?? 300;
    this.multiExplosionsState = null;

    // Complete All-Form MUGEN Kit Cooldowns & Phased States
    this.cloneAttackCooldown = 60;
    this.consecutiveSlashingCooldown = 140;
    this.consecutiveSlashingState = null;
    this.completeHypnosisCooldown = 190;

    this.thunderboltsCooldown = 80;
    this.thunderboltsState = null;
    this.swallowGroundCooldown = 140;
    this.swallowGroundState = null;
    this.timeSlowingCooldown = 160;
    this.timeSlowFieldTimer = 0;
    this.timeSlowFieldRadius = 135;

    this.rushingCrusherCooldown = 90;
    this.rushingCrusherState = null;
    this.paralysisVibrationsCooldown = 130;
    this.soulsTortureCooldown = 110;
    this.shadowWavesCooldown = 40;
    this.shellsInevitablesCooldown = 70;
    this.shellsBarrageState = null;

    // Ultimate: Hado #90 Kurohitsugi & Big Bang Explosion
    this.kurohitsugiCooldown = 220;
    this.kurohitsugiCooldownMax = cfg.kurohitsugiCooldown ?? 600;
    this.kurohitsugiState = null;

    // Non-Freezing VFX & Custom Projectiles (Rule 25)
    this.activeVisualEffects = [];
    this.aizenProjectiles = [];
    this._registerAizenSkills(cfg);
  }

  _registerAizenSkills(cfg) {
    if (!this.skillManager || typeof this.skillManager.registerSkills !== 'function') return;
    const skills = [];
    if (this.isSkillEnabled(cfg.enableKyokaCounter, true)) {
      skills.push({
        id: 'kyoka_counter',
        name: cfg.kyokaCounterSkillName || 'KYŌKA SUIGETSU',
        type: 'defensive',
        cooldownKey: 'kyokaCounterCooldown',
        cooldownMax: cfg.kyokaCounterCooldown ?? 300,
        activeKey: 'isKyokaCounterStance',
      });
    }
    if (this.isSkillEnabled(cfg.enableRaikoho, true)) {
      skills.push({
        id: 'raikoho',
        name: cfg.raikohoSkillName || 'HADŌ #63: RAIKŌHŌ',
        type: 'offensive',
        cooldownKey: 'raikohoCooldown',
        cooldownMax: cfg.raikohoCooldown ?? 220,
      });
    }
    if (this.isSkillEnabled(cfg.enableDanku, true)) {
      skills.push({
        id: 'danku',
        name: cfg.dankuSkillName || 'BAKUDŌ #81: DANKU',
        type: 'defensive',
        cooldownKey: 'dankuCooldown',
        cooldownMax: cfg.dankuCooldown ?? 340,
        activeKey: 'dankuActive',
      });
    }
    if (this.isSkillEnabled(cfg.enableRikujokoro, true)) {
      skills.push({
        id: 'rikujokoro',
        name: cfg.rikujokoroSkillName || 'RIKUJŌKŌRŌ',
        type: 'offensive',
        cooldownKey: 'rikujokoroCooldown',
        cooldownMax: cfg.rikujokoroCooldown ?? 420,
      });
    }
    if (this.isSkillEnabled(cfg.enableMultiExplosions, true)) {
      skills.push({
        id: 'multi_explosions',
        name: cfg.multiExplosionsSkillName || 'MULTI EXPLOSIONS',
        type: 'offensive',
        cooldownKey: 'multiExplosionsCooldown',
        cooldownMax: cfg.multiExplosionsCooldown ?? 300,
      });
    }
    const extraSkillDefs = [
      ['clone_attack', cfg.enableCloneAttack, 'cloneAttackSkillName', 'CLONE ATTACK', 'cloneAttackCooldown', cfg.cloneAttackCooldown ?? 260, 'offensive'],
      ['consecutive_slashing', cfg.enableConsecutiveSlashing, 'consecutiveSlashingSkillName', 'CONSECUTIVE SLASHING', 'consecutiveSlashingCooldown', cfg.consecutiveSlashingCooldown ?? 380, 'offensive'],
      ['complete_hypnosis', cfg.enableCompleteHypnosis, 'completeHypnosisSkillName', 'COMPLETE HYPNOSIS', 'completeHypnosisCooldown', cfg.completeHypnosisCooldown ?? 440, 'offensive'],
      ['thunderbolts', cfg.enableThunderbolts, 'thunderboltsSkillName', 'THUNDERBOLTS', 'thunderboltsCooldown', cfg.thunderboltsCooldown ?? 300, 'offensive'],
      ['swallow_ground', cfg.enableSwallowGround, 'swallowGroundSkillName', 'SWALLOW GROUND', 'swallowGroundCooldown', cfg.swallowGroundCooldown ?? 380, 'offensive'],
      ['time_slowing', cfg.enableTimeSlowing, 'timeSlowingSkillName', 'TIME SLOWING', 'timeSlowingCooldown', cfg.timeSlowingCooldown ?? 420, 'defensive'],
      ['rushing_crusher', cfg.enableRushingCrusher, 'rushingCrusherSkillName', 'RUSHING CRUSHER', 'rushingCrusherCooldown', cfg.rushingCrusherCooldown ?? 320, 'offensive'],
      ['paralysis_vibrations', cfg.enableParalysisVibrations, 'paralysisVibrationsSkillName', 'PARALYSIS VIBRATIONS', 'paralysisVibrationsCooldown', cfg.paralysisVibrationsCooldown ?? 360, 'offensive'],
      ['souls_torture', cfg.enableSoulsTorture, 'soulsTortureSkillName', 'SOULS TORTURE', 'soulsTortureCooldown', cfg.soulsTortureCooldown ?? 340, 'offensive'],
      ['shadow_waves', cfg.enableShadowWaves, 'shadowWavesSkillName', 'SHADOW WAVES', 'shadowWavesCooldown', cfg.shadowWavesCooldown ?? 260, 'offensive'],
      ['shells_inevitables', cfg.enableShellsInevitables, 'shellsInevitablesSkillName', 'SHELLS INEVITABLES', 'shellsInevitablesCooldown', cfg.shellsInevitablesCooldown ?? 300, 'offensive'],
    ];
    for (const [id, flag, nameKey, defName, cdKey, cdMax, type] of extraSkillDefs) {
      if (this.isSkillEnabled(flag, true)) {
        skills.push({ id, name: cfg[nameKey] || defName, type, cooldownKey: cdKey, cooldownMax: cdMax });
      }
    }
    if (this.isSkillEnabled(cfg.enableKurohitsugi, true)) {
      skills.push({
        id: 'kurohitsugi',
        name: cfg.kurohitsugiSkillName || 'KUROHITSUGI',
        type: 'ultimate',
        cooldownKey: 'kurohitsugiCooldown',
        cooldownMax: cfg.kurohitsugiCooldown ?? 600,
      });
    }
    this.skillManager.registerSkills(skills);
  }

  _playSound(key, defaultVol = 0.8) {
    if (!this._soundPlayTimestamps) this._soundPlayTimestamps = {};
    const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    if (now - (this._soundPlayTimestamps[key] || 0) < 90) return;
    this._soundPlayTimestamps[key] = now;
    const cfg = this._cfg();
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
    // Intentionally empty: Aizen fights with Kyōka Suigetsu swordsmanship, Kidō, and Kurohitsugi.
  }

  canAim() {
    if (this.raikohoWindupTimer > 0) return false;
    if (this.raikohoBeamState && this.raikohoBeamState.active) return false;
    if (this.rikujokoroWindupTimer > 0) return false;
    if (this.rushingCrusherState && this.rushingCrusherState.active) return false;
    if (this.consecutiveSlashingState && this.consecutiveSlashingState.active) return false;
    if (this.multiExplosionsState && this.multiExplosionsState.active && this.multiExplosionsState.timer < this.multiExplosionsState.windupFrames) {
      return false;
    }
    if (this.kurohitsugiState && this.kurohitsugiState.active && this.kurohitsugiState.phase === 'rising') {
      return false;
    }
    return super.canAim ? super.canAim() : true;
  }

  isStationarySkillActive() {
    return Boolean(
      this.raikohoWindupTimer > 0 ||
      (this.raikohoBeamState && this.raikohoBeamState.active) ||
      this.rikujokoroWindupTimer > 0 ||
      (this.rushingCrusherState && this.rushingCrusherState.active) ||
      (this.consecutiveSlashingState && this.consecutiveSlashingState.active) ||
      (this.multiExplosionsState && this.multiExplosionsState.active && this.multiExplosionsState.timer < this.multiExplosionsState.windupFrames) ||
      (this.kurohitsugiState && this.kurohitsugiState.active && this.kurohitsugiState.phase === 'rising') ||
      super.isStationarySkillActive?.()
    );
  }

  interruptAttacks(forceCancelAll = false) {
    super.interruptAttacks(forceCancelAll);
    this.isSlashing = false;
    this.swordSwingPhase = 'idle';
    this.swordSwingTimer = 0;
    this.raikohoWindupTimer = 0;
    this.raikohoBeamState = null;
    this.rikujokoroWindupTimer = 0;
    this.multiExplosionsState = null;
    this.consecutiveSlashingState = null;
    this.thunderboltsState = null;
    this.rushingCrusherState = null;
    this.shellsBarrageState = null;
    this.isKyokaCounterStance = false;
    this.kyokaCounterTimer = 0;
    if (forceCancelAll) {
      this.dankuActive = false;
      this.dankuTimer = 0;
      this.rikujokoroState = null;
      this.swallowGroundState = null;
      this.timeSlowFieldTimer = 0;
      if (this.kurohitsugiState && this.kurohitsugiState.phase === 'rising') {
        this.kurohitsugiState = null;
      }
    }
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
        if (myTeam !== null && targetTeam !== null) {
          return myTeam !== targetTeam;
        }
      }
    }
    return true;
  }

  _collectTargets() {
    const out = [];
    if (typeof state !== 'undefined' && Array.isArray(state.fighters)) {
      for (let i = 0; i < state.fighters.length; i++) {
        const f = state.fighters[i];
        if (!this._isHostile(f)) continue;
        if (f.isPokemonTrainer && f.activePokemon && f.activePokemon.hp > 0 && !f.activePokemon.isFainting) {
          out.push(f.activePokemon);
        } else {
          out.push(f);
        }
      }
    }
    if (typeof state !== 'undefined' && Array.isArray(state.illusions)) {
      for (let i = 0; i < state.illusions.length; i++) {
        const ill = state.illusions[i];
        if (ill && this._isHostile(ill)) out.push(ill);
      }
    }
    return out;
  }

  _findNearestEnemy() {
    const targets = this._collectTargets();
    let best = null;
    let bestD = Infinity;
    for (let i = 0; i < targets.length; i++) {
      const d = Math.hypot(targets[i].x - this.x, targets[i].y - this.y);
      if (d < bestD) {
        bestD = d;
        best = targets[i];
      }
    }
    return best;
  }

  _damageMultiplier() {
    const cfg = this._cfg();
    if (this.aizenForm >= 2) return cfg.finalFormDamageMultiplier ?? 1.35;
    if (this.aizenForm === 1) return cfg.hogyokuDamageMultiplier ?? 1.20;
    return 1.0;
  }

  takeDamage(amount, attacker = null, opts = {}) {
    const isGuaranteed = Boolean(
      opts && (opts.isRatioCrit || opts.isNanamiPause || opts.undodgeable || opts.isSureKill ||
      opts.isSaitamaCounter || opts.isSaitamaPunch || opts.isSeriousPunch || opts.bypassShield ||
      opts.bypassEvade || opts.isGuaranteedHit || opts.isDivineFlame || opts.isFuga)
    );

    // Skill 1: Kyōka Suigetsu Mirror-Shatter Counter
    if (this.isKyokaCounterStance && !isGuaranteed && attacker && attacker !== this && !attacker.isDead) {
      this._triggerKyokaCounter(attacker);
      return false;
    }

    // Hōgyoku Time Slowing ReversalDef Counter (MUGEN Statedef 25500 -> 16001)
    if ((this.timeSlowFieldTimer || 0) > 0 && !isGuaranteed && attacker && attacker !== this && !attacker.isDead) {
      this._triggerTimeSlowCounter(attacker);
      return false;
    }

    // Skill 3: Bakudō #81 Danku frontal barrier mitigation
    let finalAmount = amount;
    if (this.dankuActive && !isGuaranteed && attacker) {
      const angToAttacker = Math.atan2(attacker.y - this.y, attacker.x - this.x);
      let diff = angToAttacker - (this.dankuAngle || this.gunAngle || 0);
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) <= Math.PI * 0.55) {
        finalAmount = Math.max(1, amount * 0.35);
        spawnSparks(this.x + Math.cos(angToAttacker) * (this.r + 14), this.y + Math.sin(angToAttacker) * (this.r + 14), 6, '#C084FC', '#FFFFFF');
      }
    }

    return super.takeDamage(finalAmount, attacker, opts);
  }

  _triggerKyokaCounter(attacker) {
    const cfg = this._cfg();
    this.isKyokaCounterStance = false;
    this.kyokaCounterTimer = 0;

    const decoyX = this.x;
    const decoyY = this.y;
    this.activeVisualEffects.push({
      kind: 'kyokaShatter',
      x: decoyX,
      y: decoyY,
      radius: this.r || 30,
      timer: 28,
      maxTimer: 28,
    });

    // Shunpo behind attacker and re-align aim (Rule 1.3) unless pinned/caught in stasis
    const ang = Math.atan2(attacker.y - decoyY, attacker.x - decoyX);
    if (!this.isCaughtInBeam?.() && !this.isWallPinnedByMakima && !this.isWallPinnedBySaitama) {
      const stepDist = (attacker.r || 30) + (this.r || 30) + 18;
      const arena = (typeof state !== 'undefined' && state.arena) ? state.arena : { x: 0, y: 0, width: 540, height: 960 };
      const pad = (this.r || 30) + 6;
      this.x = Math.max(arena.x + pad, Math.min(arena.x + arena.width - pad, attacker.x + Math.cos(ang) * stepDist));
      this.y = Math.max(arena.y + pad, Math.min(arena.y + arena.height - pad, attacker.y + Math.sin(ang) * stepDist));
      this.aim(attacker);
    }
    this.shunpoVfxTimer = 14;
    this.shunpoAngle = ang;

    const dmg = Math.round((cfg.kyokaCounterDamage ?? 28) * this._damageMultiplier());
    applyDamageToTarget(attacker, dmg, this, { source: 'kyoka_counter' });
    if (typeof attacker.applyHitStun === 'function') {
      attacker.applyHitStun(cfg.kyokaHypnosisStunFrames ?? 42);
    }

    spawnBloodEffect(attacker.x, attacker.y, 12);
    spawnSparks(attacker.x, attacker.y, 14, '#C084FC', '#FFFFFF');
    spawnFloatingText(decoyX, decoyY - 36, 'KYŌKA SUIGETSU!', '#C084FC', 18);
    triggerGlobalScreenShake(7, 10);
    // MUGEN Statedef 1101 follow-through ambush cut visual
    this.isSlashing = true;
    this.swordSwingPhase = 'strike';
    this.swordSwingTimer = 0;
    this.swordSwingPhaseMax = cfg.swordStrikeFrames ?? 6;
    this.swordSwingPhaseProgress = 0;
    this.swordHitDealt = true;
    this._playSound('kyokaCounter', 0.88);
    this._playSound('voKyoka', 0.88);
    this._gainHogyoku(16);
  }

  _gainHogyoku(amount) {
    const cfg = this._cfg();
    if (!this.isSkillEnabled(cfg.enableHogyoku, true)) return;
    this.hogyokuGauge = Math.min(100, this.hogyokuGauge + amount);
  }

  /**
   * Rule 25: Update all VFX, shockwaves, Kurohitsugi, and custom projectiles
   * at the top of update() BEFORE _handleTimeStop() so effects never freeze mid-air.
   */
  _updateVisualEffects(arenaObj) {
    this._vfxTick++;
    if (this.formTransformVfxTimer > 0) this.formTransformVfxTimer--;
    if (this.shunpoVfxTimer > 0) this.shunpoVfxTimer--;

    for (let i = this.activeVisualEffects.length - 1; i >= 0; i--) {
      this.activeVisualEffects[i].timer--;
      if (this.activeVisualEffects[i].timer <= 0) {
        this.activeVisualEffects.splice(i, 1);
      }
    }

    this._updateAizenProjectiles(arenaObj);
    this._updateKurohitsugiState();
    this._updateRikujokoroPrisonState();
    this._updateSwallowGroundState();
  }

  _updateAizenProjectiles(arenaObj) {
    const arena = arenaObj || (typeof state !== 'undefined' && state.arena) || { x: 0, y: 0, width: 540, height: 960 };
    for (let i = this.aizenProjectiles.length - 1; i >= 0; i--) {
      const p = this.aizenProjectiles[i];
      p.age++;
      const homingReady = p.homing && p.age >= (p.homingDelay || 0);
      if (homingReady && p.target && !p.target.isDead && p.target.hp > 0) {
        const want = Math.atan2(p.target.y - p.y, p.target.x - p.x);
        const speed = Math.hypot(p.vx, p.vy) || 10;
        const cur = Math.atan2(p.vy, p.vx);
        let diff = want - cur;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const turnRate = p.turnRate || 0.075;
        const next = cur + Math.max(-turnRate, Math.min(turnRate, diff));
        p.vx = Math.cos(next) * speed;
        p.vy = Math.sin(next) * speed;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      let hitTarget = null;
      const targets = this._collectTargets();
      for (let t = 0; t < targets.length; t++) {
        const foe = targets[t];
        if (Math.hypot(foe.x - p.x, foe.y - p.y) <= (p.radius || 14) + (foe.r || 25)) {
          hitTarget = foe;
          break;
        }
      }

      const outOfBounds = (p.x < arena.x || p.x > arena.x + arena.width || p.y < arena.y || p.y > arena.y + arena.height);
      if (hitTarget || outOfBounds || p.life <= 0) {
        this._detonateAizenProjectile(p, hitTarget);
        this.aizenProjectiles.splice(i, 1);
      }
    }
  }

  _detonateAizenProjectile(p, directTarget) {
    const targets = this._collectTargets();
    const blastR = p.explosionRadius || 52;
    const isHeavy = p.kind === 'fragor' || p.kind === 'shadow_wave';
    for (let i = 0; i < targets.length; i++) {
      const foe = targets[i];
      if (foe === directTarget || Math.hypot(foe.x - p.x, foe.y - p.y) <= blastR + (foe.r || 25)) {
        const dmg = Math.round(p.damage * this._damageMultiplier());
        applyDamageToTarget(foe, dmg, this, { source: p.kind });
        const ang = Math.atan2(foe.y - p.y, foe.x - p.x);
        const kb = isHeavy ? 10 : (p.kind === 'shell_bolt' ? 4.5 : 6.5);
        foe.knockbackVx = (foe.knockbackVx || 0) + Math.cos(ang) * kb;
        foe.knockbackVy = (foe.knockbackVy || 0) + Math.sin(ang) * kb;
        spawnSparks(foe.x, foe.y, p.kind === 'shell_bolt' ? 6 : 10, p.kind === 'fragor' ? '#FB7185' : '#C084FC', '#FFFFFF');
        this._gainHogyoku(p.kind === 'shell_bolt' ? 3 : 6);
      }
    }
    const impactKind = p.kind === 'fragor'
      ? 'fragorExplosion'
      : (p.kind === 'shell_bolt' ? 'shellBurst' : (p.kind === 'clone_rush' ? 'kuroSlashSpark' : (p.kind === 'shadow_wave' ? 'darkBlast' : (p.kind === 'hogyoku_orb' ? 'hogyokuImpact' : 'raikohoImpact'))));
    this.activeVisualEffects.push({
      kind: impactKind,
      x: p.x,
      y: p.y,
      radius: blastR,
      angle: Math.atan2(p.vy || 0, p.vx || 1),
      timer: p.kind === 'fragor' ? 28 : 20,
      maxTimer: p.kind === 'fragor' ? 28 : 20,
    });
    if (p.kind === 'fragor') {
      this._playSound('fragorExplode', 0.92);
      triggerGlobalScreenShake(10, 14);
    } else if (p.kind !== 'shell_bolt') {
      triggerGlobalScreenShake(4, 7);
    }
  }

  _updateKurohitsugiState() {
    const k = this.kurohitsugiState;
    if (!k || !k.active) return;
    k.timer++;
    if (k.phase === 'rising') {
      k.progress = k.timer / Math.max(1, k.castFrames);
      if (k.target && !k.target.isDead && k.target.hp > 0) {
        k.x = k.target.x;
        k.y = k.target.y;
        k.target.vx = 0;
        k.target.vy = 0;
      }
      if (k.timer >= k.castFrames) {
        k.phase = 'crushing';
        k.timer = 0;
        k.progress = 0;
        this._playSound('kurohitsugiCrush', 0.90);
      }
    } else if (k.phase === 'crushing') {
      k.progress = k.timer / Math.max(1, k.crushFrames);
      if (k.target && !k.target.isDead && k.target.hp > 0) {
        k.target.x += (k.x - k.target.x) * 0.25;
        k.target.y += (k.y - k.target.y) * 0.25;
        k.target.vx = 0;
        k.target.vy = 0;
      }
      if (k.timer % 6 === 1) {
        const idx = Math.floor(k.timer / 6);
        this.activeVisualEffects.push({
          kind: 'kuroSlashSpark',
          x: k.x + ((idx % 3) - 1) * 16,
          y: k.y + (((idx + 1) % 3) - 1) * 14,
          radius: Math.max(58, (k.radius || 72) * 0.9),
          angle: idx * 0.95 - 0.4,
          timer: 15,
          maxTimer: 15,
        });
      }
      if (k.timer >= k.crushFrames) {
        k.phase = 'shatter';
        k.timer = 0;
        k.progress = 0;
        this._detonateKurohitsugi(k);
      }
    } else if (k.phase === 'shatter') {
      k.progress = k.timer / 24;
      if (k.timer >= 24) {
        this.kurohitsugiState = null;
      }
    }
  }

  _detonateKurohitsugi(k) {
    const targets = this._collectTargets();
    const radius = k.isBigBang ? (this._cfg().bigBangRadius ?? 148) : (k.radius + 36);
    for (let i = 0; i < targets.length; i++) {
      const foe = targets[i];
      if (foe === k.target || Math.hypot(foe.x - k.x, foe.y - k.y) <= radius) {
        applyDamageToTarget(foe, Math.round(k.damage * this._damageMultiplier()), this, {
          source: k.isBigBang ? 'big_bang_explosion' : 'kurohitsugi',
          undodgeable: true,
        });
        const ang = Math.atan2(foe.y - k.y, foe.x - k.x);
        foe.knockbackVx = (foe.knockbackVx || 0) + Math.cos(ang) * 12;
        foe.knockbackVy = (foe.knockbackVy || 0) + Math.sin(ang) * 12;
        spawnBloodEffect(foe.x, foe.y, 16);
        spawnImpactFlash(foe.x, foe.y, 48, k.isBigBang ? '#FB7185' : '#8B5CF6');
      }
    }
    if (k.isBigBang) {
      this.activeVisualEffects.push({ kind: 'fragorExplosion', x: k.x, y: k.y, radius, timer: 32, maxTimer: 32 });
      this._playSound('fragorExplode', 0.95);
    } else {
      this.activeVisualEffects.push({ kind: 'kuroSlashSpark', x: k.x, y: k.y, radius: Math.max(64, k.radius || 72), angle: 0.38, timer: 20, maxTimer: 20 });
      this._playSound('kurohitsugiShatter', 0.92);
    }
    triggerGlobalScreenShake(k.isBigBang ? 14 : 10, 18);
  }

  update(opponent, ownerIndex, arenaObj) {
    // 0. Rule 25: Update transient VFX & projectiles BEFORE freeze guard
    this._updateVisualEffects(arenaObj);

    // 1. Rule 1.1: Freeze & Time-Stop Guard
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks();
      return;
    }

    const cfg = this._cfg();
    this._checkFormEvolution(cfg);
    this._tickAizenTimers(cfg);
    this._updateRaikohoBeamState(cfg, arenaObj);
    this._updateConsecutiveSlashingState(cfg, arenaObj);
    this._updateThunderboltsSpawner(cfg, arenaObj);
    this._updateTimeSlowFieldState(cfg);
    this._updateRushingCrusherState(cfg, arenaObj);
    this._updateMultiExplosionsSpawner(cfg, arenaObj);
    this._updateShellsBarrageSpawner(cfg);
    this._updateDankuBarrier(cfg);
    this._updateSwordSwing(cfg);
    this._updateSkillAI(opponent, cfg, arenaObj);

    // Rule 1.2: Centralized movement & wall bounce
    super.update(opponent, ownerIndex, arenaObj);
  }

  _updateRaikohoBeamState(cfg, arenaObj) {
    const b = this.raikohoBeamState;
    if (!b || !b.active) return;
    this.gunAngle = b.angle;
    this.vx *= 0.25;
    this.vy *= 0.25;

    const r = this.r || 30;
    const ox = this.x + Math.cos(b.angle) * (r + 10);
    const oy = this.y + Math.sin(b.angle) * (r + 10);
    const arena = arenaObj || (typeof state !== 'undefined' && state.arena);
    let maxLen = b.maxRange || 300;
    if (arena) {
      const margin = (arena.wallWidth || 4) + 6;
      const cosA = Math.cos(b.angle), sinA = Math.sin(b.angle);
      if (cosA > 0.001) maxLen = Math.min(maxLen, ((arena.x + arena.width - margin) - ox) / cosA);
      else if (cosA < -0.001) maxLen = Math.min(maxLen, ((arena.x + margin) - ox) / cosA);
      if (sinA > 0.001) maxLen = Math.min(maxLen, ((arena.y + arena.height - margin) - oy) / sinA);
      else if (sinA < -0.001) maxLen = Math.min(maxLen, ((arena.y + margin) - oy) / sinA);
    }
    b.length = Math.max(70, maxLen);

    const ex = ox + Math.cos(b.angle) * b.length;
    const ey = oy + Math.sin(b.angle) * b.length;
    const segDx = ex - ox, segDy = ey - oy;
    const lenSq = segDx * segDx + segDy * segDy || 1;
    const elapsed = (b.maxTimer || 26) - b.timer;

    if (elapsed % 6 === 0) {
      const pulseDmg = Math.max(4, Math.round((b.totalDamage || 26) * 0.28 * this._damageMultiplier()));
      const hitHalfW = (b.width || 54) * 0.52;
      const targets = this._collectTargets();
      for (let i = 0; i < targets.length; i++) {
        const foe = targets[i];
        const t = Math.max(0, Math.min(1, ((foe.x - ox) * segDx + (foe.y - oy) * segDy) / lenSq));
        const cx = ox + t * segDx, cy = oy + t * segDy;
        const dist = Math.hypot(foe.x - cx, foe.y - cy);
        if (dist <= hitHalfW + (foe.r || 25)) {
          applyDamageToTarget(foe, pulseDmg, this, { source: 'raikoho_beam' });
          foe.knockbackVx = (foe.knockbackVx || 0) + Math.cos(b.angle) * 5.2;
          foe.knockbackVy = (foe.knockbackVy || 0) + Math.sin(b.angle) * 5.2;
          if (typeof foe.applyHitStun === 'function') foe.applyHitStun(8);
          spawnSparks(foe.x, foe.y, 7, '#FACC15', '#FFFFFF');
          this.activeVisualEffects.push({
            kind: 'raikohoImpact',
            x: foe.x,
            y: foe.y,
            radius: 56,
            timer: 16,
            maxTimer: 16,
          });
          this._gainHogyoku(4);
        }
      }
      triggerGlobalScreenShake(3.5, 4);
    }

    b.timer--;
    if (b.timer <= 0) {
      this.raikohoBeamState = null;
    }
  }

  _checkFormEvolution(cfg) {
    if (!this.isSkillEnabled(cfg.enableHogyoku, true) || this.hp <= 0) return;
    this._gainHogyoku(cfg.hogyokuPassiveGainRate ?? 0.16);
    const maxHp = this.maxHp || 260;
    const hpRatio = this.hp / maxHp;
    const baseSpd = this.baseSpeed ?? cfg.speed ?? 6.0;

    if (this.aizenForm === 0 && (hpRatio <= (cfg.hogyokuThresholdHpRatio ?? 0.65) || this.hogyokuGauge >= 100)) {
      this.aizenForm = 1;
      this.hogyokuGauge = 0;
      this.formTransformVfxTimer = 42;
      const spdMult = cfg.hogyokuSpeedMultiplier ?? 1.20;
      this.speed = baseSpd * spdMult;
      this.moveSpeed = this.speed;
      const heal = cfg.hogyokuTransformHeal ?? 18;
      this.hp = Math.min(maxHp, this.hp + heal);
      this._healthBarHealTimer = 16;
      this.raikohoCooldown = Math.min(this.raikohoCooldown, 18);
      this._triggerReiatsuCrush(cfg);
      spawnFloatingText(this.x, this.y - 38, 'HŌGYOKU FUSION!', '#C084FC', 20);
      this._playSound('hogyokuAwaken', 0.90);
      this._playSound('voHogyoku', 0.90);
    } else if (this.aizenForm === 1 && hpRatio <= (cfg.finalFormThresholdHpRatio ?? 0.32)) {
      this.aizenForm = 2;
      this.formTransformVfxTimer = 42;
      const spdMult = cfg.finalFormSpeedMultiplier ?? 1.35;
      this.speed = baseSpd * spdMult;
      this.moveSpeed = this.speed;
      const heal = cfg.finalTransformHeal ?? 24;
      this.hp = Math.min(maxHp, this.hp + heal);
      this._healthBarHealTimer = 16;
      this.raikohoCooldown = Math.min(this.raikohoCooldown, 18);
      this._triggerReiatsuCrush(cfg);
      spawnFloatingText(this.x, this.y - 44, 'TRANSCENDENCE!', '#FB7185', 22);
      this._playSound('finalAwaken', 0.95);
      this._playSound('voFragor', 0.95);
    }
  }

  _triggerReiatsuCrush(cfg) {
    const crushR = cfg.reiatsuCrushRadius ?? 115;
    const dmg = cfg.reiatsuCrushDamage ?? 14;
    const targets = this._collectTargets();
    for (let i = 0; i < targets.length; i++) {
      const foe = targets[i];
      if (Math.hypot(foe.x - this.x, foe.y - this.y) <= crushR) {
        applyDamageToTarget(foe, dmg, this, { source: 'reiatsu_crush' });
        const ang = Math.atan2(foe.y - this.y, foe.x - this.x);
        foe.knockbackVx = (foe.knockbackVx || 0) + Math.cos(ang) * 10;
        foe.knockbackVy = (foe.knockbackVy || 0) + Math.sin(ang) * 10;
      }
    }
    this.activeVisualEffects.push({ kind: 'reiatsuCrush', x: this.x, y: this.y, radius: crushR, timer: 24, maxTimer: 24 });
    triggerGlobalScreenShake(9, 14);
  }

  /**
   * Ticks Aizen-specific active timers without shadowing base Fighter.prototype._tickCooldowns().
   * Cooldown properties (*Cooldown) are managed once per frame by base Fighter SkillManager.
   */
  _tickAizenTimers(cfg) {
    if (this.isKyokaCounterStance) {
      this.kyokaCounterTimer--;
      if (this.kyokaCounterTimer <= 0) this.isKyokaCounterStance = false;
    }

    if (this.raikohoWindupTimer > 0) {
      this.raikohoWindupTimer--;
      this.gunAngle = this.skillCastAngle;
      this.vx = 0;
      this.vy = 0;
      if (this.raikohoWindupTimer === 0) {
        this._fireRaikohoOrFragor(cfg);
        this.resumeMovement?.(this._findNearestEnemy());
      }
    }

    if (this.rikujokoroWindupTimer > 0) {
      this.rikujokoroWindupTimer--;
      this.gunAngle = this.skillCastAngle;
      this.vx = 0;
      this.vy = 0;
      if (this.rikujokoroWindupTimer === 0) {
        this._activateRikujokoroCapture(cfg);
        this.resumeMovement?.(this._findNearestEnemy());
      }
    }
  }

  _updateDankuBarrier(cfg) {
    if (!this.dankuActive) return;
    this.dankuTimer--;
    this.dankuAngle = this.gunAngle || this.dankuAngle || 0;
    // Intercept hostile arena projectiles in front of Danku wall
    if (typeof state !== 'undefined' && Array.isArray(state.projectiles)) {
      const bx = this.x + Math.cos(this.dankuAngle) * ((this.r || 30) + 18);
      const by = this.y + Math.sin(this.dankuAngle) * ((this.r || 30) + 18);
      for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const proj = state.projectiles[i];
        if (!proj || proj.owner === this || proj.isPermanentBeam) continue;
        if (Math.hypot(proj.x - bx, proj.y - by) <= (this.dankuRadius || 42)) {
          spawnSparks(proj.x, proj.y, 6, '#C084FC', '#FFFFFF');
          state.projectiles.splice(i, 1);
        }
      }
    }
    if (this.dankuTimer <= 0) this.dankuActive = false;
  }

  /**
   * 5-Phase Melee Swing State Machine (Rule 30)
   */
  _updateSwordSwing(cfg) {
    if (!this.isSlashing) return;
    this.swordSwingTimer++;
    this.swordSwingPhaseProgress = this.swordSwingTimer / Math.max(1, this.swordSwingPhaseMax);

    if (this.swordSwingPhase === 'lift' && this.swordSwingTimer >= (cfg.swordLiftFrames ?? 6)) {
      this.swordSwingPhase = 'hold';
      this.swordSwingTimer = 0;
      this.swordSwingPhaseMax = cfg.swordHoldFrames ?? 2;
      this.swordSwingPhaseProgress = 0;
    } else if (this.swordSwingPhase === 'hold' && this.swordSwingTimer >= (cfg.swordHoldFrames ?? 2)) {
      this.swordSwingPhase = 'strike';
      this.swordSwingTimer = 0;
      this.swordSwingPhaseMax = cfg.swordStrikeFrames ?? 6;
      this.swordSwingPhaseProgress = 0;
      this._playSound(this.swordComboIndex % 2 === 0 ? 'slash1' : 'slash2', 0.72);
    } else if (this.swordSwingPhase === 'strike') {
      if (!this.swordHitDealt && this.swordSwingPhaseProgress >= 0.5) {
        this.swordHitDealt = true;
        this._executeSwordHitArc(cfg);
      }
      if (this.swordSwingTimer >= (cfg.swordStrikeFrames ?? 6)) {
        this.swordSwingPhase = 'impactLock';
        this.swordSwingTimer = 0;
        this.swordSwingPhaseMax = cfg.swordImpactLockFrames ?? 5;
        this.swordSwingPhaseProgress = 0;
      }
    } else if (this.swordSwingPhase === 'impactLock') {
      this.vx *= 0.2;
      this.vy *= 0.2;
      if (this.swordSwingTimer >= (cfg.swordImpactLockFrames ?? 5)) {
        this.swordSwingPhase = 'recovery';
        this.swordSwingTimer = 0;
        this.swordSwingPhaseMax = cfg.swordRecoveryFrames ?? 9;
        this.swordSwingPhaseProgress = 0;
      }
    } else if (this.swordSwingPhase === 'recovery' && this.swordSwingTimer >= (cfg.swordRecoveryFrames ?? 9)) {
      this.isSlashing = false;
      this.swordSwingPhase = 'idle';
      this.swordSwingTimer = 0;
      this.swordSwingPhaseProgress = 0;
      this.swordComboIndex = (this.swordComboIndex + 1) % 4;
    }
  }

  _executeSwordHitArc(cfg) {
    const targets = this._collectTargets();
    const reach = (cfg.swordRange ?? 76) * (this.aizenForm >= 2 ? 1.18 : 1.0);
    const halfArc = ((cfg.swordArc ?? 135) * Math.PI) / 360;
    const facing = this.gunAngle ?? 0;
    let landed = false;

    for (let i = 0; i < targets.length; i++) {
      const foe = targets[i];
      const dx = foe.x - this.x;
      const dy = foe.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > reach + (foe.r || 25)) continue;
      let diff = Math.atan2(dy, dx) - facing;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > halfArc) continue;

      const dmg = Math.round((cfg.swordDamage ?? 16) * this._damageMultiplier());
      applyDamageToTarget(foe, dmg, this, { source: 'melee' });
      const kb = cfg.swordKnockback ?? 7.5;
      const pushAng = Math.atan2(dy, dx);
      foe.knockbackVx = (foe.knockbackVx || 0) + Math.cos(pushAng) * kb;
      foe.knockbackVy = (foe.knockbackVy || 0) + Math.sin(pushAng) * kb;
      spawnBloodEffect(foe.x, foe.y, 10);
      spawnSparks(foe.x, foe.y, 10, '#C084FC', '#FFFFFF');
      this.activeVisualEffects.push({
        kind: 'kuroSlashSpark',
        x: foe.x,
        y: foe.y,
        radius: Math.max(44, (foe.r || 25) * 1.65),
        angle: pushAng,
        timer: 16,
        maxTimer: 16,
      });
      this._gainHogyoku(cfg.hogyokuHitGain ?? 12);
      landed = true;
    }

    if (landed) {
      // Rule 30: Layered fleshy slap + blade hit SFX
      if (typeof audioSystem !== 'undefined' && typeof audioSystem.playSFX === 'function') {
        audioSystem.playSFX('Assets/Sound Effects/Attacks/fleshhit.mp3', 0.85);
      }
      this._playSound(this.aizenForm >= 1 ? 'hitHeavy' : 'hitSlash', 0.80);
      triggerGlobalScreenShake(3.5, 5);
    }
  }

  _updateSkillAI(opponent, cfg, arenaObj) {
    let target = this._isHostile(opponent) ? opponent : null;
    if (target && target.isPokemonTrainer && target.activePokemon && target.activePokemon.hp > 0 && !target.activePokemon.isFainting) {
      target = target.activePokemon;
    }
    if (!target) target = this._findNearestEnemy();
    if (!target || this.hp <= 0) return;
    if (
      this.raikohoWindupTimer > 0 ||
      (this.raikohoBeamState && this.raikohoBeamState.active) ||
      this.rikujokoroWindupTimer > 0 ||
      (this.multiExplosionsState && this.multiExplosionsState.active) ||
      (this.consecutiveSlashingState && this.consecutiveSlashingState.active) ||
      (this.rushingCrusherState && this.rushingCrusherState.active)
    ) {
      return;
    }

    const dist = Math.hypot(target.x - this.x, target.y - this.y);
    const angle = Math.atan2(target.y - this.y, target.x - this.x);

    // 1. Ultimate: Kurohitsugi (Base) / Perfect Kurohitsugi (Hōgyoku) / Big Bang Explosion (Final Form)
    if (this.isSkillEnabled(cfg.enableKurohitsugi, true) && this.kurohitsugiCooldown <= 0 && !this.kurohitsugiState && dist <= 320) {
      this._castKurohitsugi(target, angle, cfg);
      return;
    }

    // 2. Form-Specific MUGEN Special Rotations
    if (this.aizenForm >= 2) {
      if (this._runFinalFormAI(target, dist, angle, cfg)) return;
    } else if (this.aizenForm === 1) {
      if (this._runHogyokuFormAI(target, dist, angle, cfg)) return;
    } else {
      if (this._runBaseFormAI(target, dist, angle, cfg, arenaObj)) return;
    }

    // 3. Shared Kyōka Counter / Raikōhō / Danku / Melee
    if (this.isSkillEnabled(cfg.enableKyokaCounter, true) && this.kyokaCounterCooldown <= 0 && !this.isKyokaCounterStance && dist <= 135) {
      this.isKyokaCounterStance = true;
      this.kyokaCounterTimer = cfg.kyokaCounterWindowFrames ?? 34;
      this.kyokaCounterCooldown = cfg.kyokaCounterCooldown ?? 300;
      this._playSound('kyokaHypnosis', 0.65);
      return;
    }

    if (this.isSkillEnabled(cfg.enableRaikoho, true) && this.raikohoCooldown <= 0 && (dist >= 35 || (this.swordCooldown > 0 && !this.isSlashing))) {
      this.skillCastAngle = angle;
      this.gunAngle = angle;
      this.raikohoWindupTimer = cfg.raikohoWindupFrames ?? 14;
      this.raikohoCooldown = cfg.raikohoCooldown ?? 220;
      return;
    }

    if (this.isSkillEnabled(cfg.enableDanku, true) && this.dankuCooldown <= 0 && dist <= 210) {
      this.dankuActive = true;
      this.dankuTimer = cfg.dankuDurationFrames ?? 75;
      this.dankuAngle = angle;
      this.dankuCooldown = cfg.dankuCooldown ?? 340;
      this._performShunpo(target, arenaObj);
      this._playSound('danku', 0.75);
      return;
    }

    if (this.isSkillEnabled(cfg.enableSwordAttack, true) && !this.isSlashing && this.swordCooldown <= 0 && dist <= (cfg.swordRange ?? 76) + (target.r || 25)) {
      this.gunAngle = angle;
      this.isSlashing = true;
      this.swordSwingPhase = 'lift';
      this.swordSwingTimer = 0;
      this.swordSwingPhaseMax = cfg.swordLiftFrames ?? 6;
      this.swordSwingPhaseProgress = 0;
      this.swordHitDealt = false;
      this.swordCooldown = cfg.swordCooldown ?? 28;
    }
  }

  _runBaseFormAI(target, dist, angle, cfg, arenaObj) {
    if (this._canCastRikujokoro(dist, cfg)) {
      this.skillCastAngle = angle;
      this.gunAngle = angle;
      this.rikujokoroWindupTimer = cfg.rikujokoroWindupFrames ?? 14;
      this.rikujokoroCooldown = cfg.rikujokoroCooldown ?? 420;
      this._playSound('rikujokoroCast', 0.88);
      spawnFloatingText(this.x, this.y - (this.r || 30) - 24, 'BAKUDŌ #61: RIKUJŌKŌRŌ!', '#FACC15', 16);
      return true;
    }
    if (this.isSkillEnabled(cfg.enableConsecutiveSlashing, true) && this.consecutiveSlashingCooldown <= 0 && dist <= 220) {
      this._startConsecutiveSlashing(target, angle, cfg);
      return true;
    }
    if (this.isSkillEnabled(cfg.enableCompleteHypnosis, true) && this.completeHypnosisCooldown <= 0 && dist <= 200) {
      this._castCompleteHypnosis(target, angle, cfg, arenaObj);
      return true;
    }
    if (this.isSkillEnabled(cfg.enableCloneAttack, true) && this.cloneAttackCooldown <= 0 && dist >= 70 && dist <= 300) {
      this._castCloneAttack(target, angle, cfg);
      return true;
    }
    return false;
  }

  _runHogyokuFormAI(target, dist, angle, cfg) {
    if (this._canCastRikujokoro(dist, cfg)) {
      this.skillCastAngle = angle;
      this.gunAngle = angle;
      this.rikujokoroWindupTimer = cfg.rikujokoroWindupFrames ?? 14;
      this.rikujokoroCooldown = cfg.rikujokoroCooldown ?? 420;
      this._playSound('rikujokoroCast', 0.88);
      spawnFloatingText(this.x, this.y - (this.r || 30) - 24, 'BAKUDŌ #61: RIKUJŌKŌRŌ!', '#FACC15', 16);
      return true;
    }
    if (this.isSkillEnabled(cfg.enableRaikoho, true) && this.raikohoCooldown <= 0 && (dist >= 35 || (this.swordCooldown > 0 && !this.isSlashing))) {
      this.skillCastAngle = angle;
      this.gunAngle = angle;
      this.raikohoWindupTimer = cfg.raikohoWindupFrames ?? 14;
      this.raikohoCooldown = cfg.raikohoCooldown ?? 220;
      return true;
    }
    if (this.isSkillEnabled(cfg.enableThunderbolts, true) && this.thunderboltsCooldown <= 0 && !this.thunderboltsState && dist <= 260) {
      this._startThunderbolts(angle, cfg);
      return true;
    }
    if (this.isSkillEnabled(cfg.enableSwallowGround, true) && this.swallowGroundCooldown <= 0 && !this.swallowGroundState && dist <= 260) {
      this._castSwallowGround(target, cfg);
      return true;
    }
    if (this.isSkillEnabled(cfg.enableTimeSlowing, true) && this.timeSlowingCooldown <= 0 && (this.timeSlowFieldTimer || 0) <= 0 && dist <= 185) {
      this._castTimeSlowing(cfg);
      return true;
    }
    return false;
  }

  _runFinalFormAI(target, dist, angle, cfg) {
    if (this.isSkillEnabled(cfg.enableMultiExplosions, true) && this.multiExplosionsCooldown <= 0 && dist <= 260) {
      this._startMultiExplosions(angle, cfg);
      return true;
    }
    if (this.isSkillEnabled(cfg.enableRushingCrusher, true) && this.rushingCrusherCooldown <= 0 && !this.rushingCrusherState && dist >= 55 && dist <= 280) {
      this._startRushingCrusher(angle, cfg);
      return true;
    }
    if (this.isSkillEnabled(cfg.enableParalysisVibrations, true) && this.paralysisVibrationsCooldown <= 0 && dist <= 150) {
      this._castParalysisVibrations(cfg);
      return true;
    }
    if (this.isSkillEnabled(cfg.enableSoulsTorture, true) && this.soulsTortureCooldown <= 0 && dist <= 270) {
      this._castSoulsTorture(target, cfg);
      return true;
    }
    if (this.isSkillEnabled(cfg.enableShadowWaves, true) && this.shadowWavesCooldown <= 0 && dist <= 320) {
      this._castShadowWaves(target, angle, cfg);
      return true;
    }
    if (this.isSkillEnabled(cfg.enableShellsInevitables, true) && this.shellsInevitablesCooldown <= 0 && !this.shellsBarrageState && dist <= 340) {
      this._startShellsInevitables(target, angle, cfg);
      return true;
    }
    return false;
  }

  _performShunpo(target, arenaObj) {
    if (this.isCaughtInBeam?.() || this.isWallPinnedByMakima || this.isWallPinnedBySaitama) return;
    const arena = arenaObj || (typeof state !== 'undefined' && state.arena) || { x: 0, y: 0, width: 540, height: 960 };
    const pad = (this.r || 30) + 8;
    const ang = Math.atan2(target.y - this.y, target.x - this.x) + (Math.random() < 0.5 ? 0.65 : -0.65);
    const step = 88;
    this.x = Math.max(arena.x + pad, Math.min(arena.x + arena.width - pad, this.x + Math.cos(ang) * step));
    this.y = Math.max(arena.y + pad, Math.min(arena.y + arena.height - pad, this.y + Math.sin(ang) * step));
    this.aim(target); // Rule 1.3
    this.shunpoVfxTimer = 14;
    this.shunpoAngle = ang;
    this._playSound('shunpo', 0.75);
  }

  _fireRaikohoOrFragor(cfg) {
    const angle = this.skillCastAngle ?? this.gunAngle ?? 0;
    const spawnDist = (this.r || 30) + 16;
    const sx = this.x + Math.cos(angle) * spawnDist;
    const sy = this.y + Math.sin(angle) * spawnDist;

    if (this.aizenForm >= 2) {
      const spd = 11.5;
      this.aizenProjectiles.push({
        kind: 'fragor',
        x: sx,
        y: sy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: 22,
        explosionRadius: cfg.fragorRadius ?? 105,
        damage: cfg.fragorDamage ?? 42,
        life: 65,
        age: 0,
        homing: true,
        target: this._findNearestEnemy(),
      });
      this._playSound('fragorCharge', 0.85);
    } else if (this.aizenForm === 1) {
      const count = cfg.hogyokuOrbCount ?? 3;
      const spd = 11.0;
      const foe = this._findNearestEnemy();
      for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) * 0.5) * 0.24;
        const a = angle + spread;
        this.aizenProjectiles.push({
          kind: 'hogyoku_orb',
          x: sx,
          y: sy,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          radius: 11,
          explosionRadius: 48,
          damage: cfg.hogyokuOrbDamage ?? 14,
          life: 60,
          age: i * 4,
          homing: true,
          target: foe,
        });
      }
      this._playSound('raikoho', 0.82);
    } else {
      // Base Form: MUGEN Statedef 1200 -> 1260 (G8004) Sustained Directional Golden Lightning Torrent
      const beamDur = cfg.raikohoBeamDurationFrames ?? 26;
      this.raikohoBeamState = {
        active: true,
        angle,
        timer: beamDur,
        maxTimer: beamDur,
        width: cfg.raikohoBeamWidth ?? 54,
        maxRange: cfg.raikohoBeamRange ?? 310,
        length: cfg.raikohoBeamRange ?? 310,
        totalDamage: cfg.raikohoDamage ?? 26,
      };
      spawnFloatingText(this.x, this.y - (this.r || 30) - 24, 'HADŌ #63: RAIKŌHŌ!', '#FACC15', 17);
      triggerGlobalScreenShake(6, 10);
      this._playSound('raikoho', 0.85);
    }
  }

  _castKurohitsugi(target, angle, cfg) {
    this.skillCastAngle = angle;
    this.gunAngle = angle;
    this.kurohitsugiCooldown = cfg.kurohitsugiCooldown ?? 600;
    const isBigBang = this.aizenForm >= 2;
    const isPerfect = this.aizenForm >= 1;
    const castFrames = cfg.kurohitsugiCastFrames ?? 26;
    const crushFrames = cfg.kurohitsugiCrushFrames ?? 42;

    this.kurohitsugiState = {
      active: true,
      target,
      x: target.x,
      y: target.y,
      radius: cfg.kurohitsugiBoxRadius ?? 72,
      phase: 'rising',
      timer: 0,
      progress: 0,
      castFrames,
      crushFrames,
      isPerfect,
      isBigBang,
      damage: isBigBang ? (cfg.bigBangDamage ?? 84) : (isPerfect ? (cfg.perfectKurohitsugiDamage ?? 68) : (cfg.kurohitsugiDamage ?? 52)),
    };

    // Rule 1.5: Apply stasis ONLY to target, never to Aizen himself
    if (typeof target.applyTimeStop === 'function') {
      target.applyTimeStop(castFrames + crushFrames);
    }
    spawnFloatingText(target.x, target.y - 46, isBigBang ? 'ULTRA FRAGOR!' : (isPerfect ? 'PERFECT KUROHITSUGI!' : 'HADŌ #90: KUROHITSUGI!'), isBigBang ? '#FB7185' : '#C084FC', 19);
    this._playSound('kurohitsugiBox', 0.85);
    this._playSound('voKurohitsugi', 0.92);
  }

  _canCastRikujokoro(dist, cfg) {
    if (!this.isSkillEnabled(cfg.enableRikujokoro, true)) return false;
    if (this.rikujokoroCooldown > 0 || this.rikujokoroState) return false;
    if (this.aizenForm >= 2 && cfg.rikujokoroAllowAllForms !== true) return false;
    const hpRatio = this.hp / Math.max(1, this.maxHp || 260);
    if (hpRatio > (cfg.rikujokoroMaxHpRatio ?? 0.95)) return false;
    return dist <= (cfg.rikujokoroCaptureRange ?? 255);
  }

  _activateRikujokoroCapture(cfg) {
    const angle = this.skillCastAngle ?? this.gunAngle ?? 0;
    const maxDist = cfg.rikujokoroCaptureRange ?? 255;
    const ox = this.x;
    const oy = this.y;
    const ex = ox + Math.cos(angle) * maxDist;
    const ey = oy + Math.sin(angle) * maxDist;
    const segDx = ex - ox, segDy = ey - oy;
    const lenSq = segDx * segDx + segDy * segDy || 1;
    const targets = this._collectTargets();

    let caught = null;
    let bestD = Infinity;
    for (let i = 0; i < targets.length; i++) {
      const foe = targets[i];
      const t = Math.max(0, Math.min(1, ((foe.x - ox) * segDx + (foe.y - oy) * segDy) / lenSq));
      const cx = ox + t * segDx, cy = oy + t * segDy;
      const d = Math.hypot(foe.x - cx, foe.y - cy);
      if (d <= 44 + (foe.r || 25) && d < bestD) {
        bestD = d;
        caught = foe;
      }
    }
    if (!caught) return;

    const prisonFrames = cfg.rikujokoroPrisonFrames ?? 120;
    this.rikujokoroState = {
      active: true,
      target: caught,
      x: caught.x,
      y: caught.y,
      radius: caught.r || 30,
      timer: 0,
      maxTimer: prisonFrames,
      tickDamage: cfg.rikujokoroTickDamage ?? 3,
    };

    const initDmg = Math.round((cfg.rikujokoroInitialDamage ?? 12) * this._damageMultiplier());
    applyDamageToTarget(caught, initDmg, this, { source: 'rikujokoro', undodgeable: true });
    if (typeof caught.applyTimeStop === 'function') {
      caught.applyTimeStop(prisonFrames);
    }
    caught.vx = 0;
    caught.vy = 0;
    spawnSparks(caught.x, caught.y, 12, '#FACC15', '#FFFFFF');
    triggerGlobalScreenShake(5, 8);
    this._playSound('rikujokoroLock', 0.88);
    this._gainHogyoku(10);
  }

  _updateRikujokoroPrisonState() {
    const r = this.rikujokoroState;
    if (!r || !r.active) return;
    r.timer++;
    const foe = r.target;
    if (!foe || foe.isDead || foe.hp <= 0 || r.timer >= r.maxTimer) {
      this.rikujokoroState = null;
      return;
    }

    r.x = foe.x;
    r.y = foe.y;
    foe.vx = 0;
    foe.vy = 0;
    if (r.timer % 15 === 0) {
      const dmg = Math.max(1, Math.round((r.tickDamage ?? 3) * this._damageMultiplier()));
      applyDamageToTarget(foe, dmg, this, { source: 'rikujokoro_seal', undodgeable: true });
      spawnSparks(foe.x, foe.y, 5, '#FEF08A', '#FACC15');
      this._gainHogyoku(2);
    }
  }

  _startMultiExplosions(angle, cfg) {
    this.skillCastAngle = angle;
    this.gunAngle = angle;
    this.multiExplosionsCooldown = cfg.multiExplosionsCooldown ?? 300;
    this.multiExplosionsState = {
      active: true,
      angle,
      timer: 0,
      waveIndex: 0,
      windupFrames: cfg.multiExplosionsWindupFrames ?? 12,
      interval: cfg.multiExplosionsWaveInterval ?? 10,
      distances: cfg.multiExplosionsWaveDistances || [64, 88, 112, 136],
    };
    spawnFloatingText(this.x, this.y - (this.r || 30) - 24, 'MULTI EXPLOSIONS!', '#FB7185', 18);
    this._playSound('multiExplosions', 0.92);
  }

  _updateMultiExplosionsSpawner(cfg, arenaObj) {
    const m = this.multiExplosionsState;
    if (!m || !m.active) return;
    m.timer++;
    if (m.timer < m.windupFrames) {
      this.gunAngle = m.angle;
      this.vx *= 0.25;
      this.vy *= 0.25;
      return;
    }

    const activeTick = m.timer - m.windupFrames;
    if (activeTick % Math.max(1, m.interval) === 0 && m.waveIndex < m.distances.length) {
      this._spawnFlankingExplosionPair(m.angle, m.distances[m.waveIndex], cfg, arenaObj);
      m.waveIndex++;
      if (m.waveIndex >= m.distances.length) {
        this.multiExplosionsState = null;
      }
    }
  }

  _spawnFlankingExplosionPair(angle, dist, cfg, arenaObj) {
    const arena = arenaObj || (typeof state !== 'undefined' && state.arena) || { x: 0, y: 0, width: 540, height: 960 };
    const radius = cfg.multiExplosionsRadius ?? 56;
    const dmg = Math.round((cfg.multiExplosionsDamage ?? 24) * this._damageMultiplier());
    const cosA = Math.cos(angle), sinA = Math.sin(angle);
    const pad = 28;
    const minX = arena.x + pad, maxX = arena.x + arena.width - pad;
    const minY = arena.y + pad, maxY = arena.y + arena.height - pad;
    const sides = [1, -1]; // Mirrors MUGEN State 27200 symmetric +X / -X flanking helpers

    this._playSound('multiBlast', 0.82);
    triggerGlobalScreenShake(7, 8);

    for (let s = 0; s < sides.length; s++) {
      const sign = sides[s];
      const px = Math.max(minX, Math.min(maxX, this.x + cosA * dist * sign));
      const py = Math.max(minY, Math.min(maxY, this.y + sinA * dist * sign));
      this.activeVisualEffects.push({
        kind: 'multiExplosionPillar',
        x: px,
        y: py,
        radius,
        timer: 26,
        maxTimer: 26,
      });
      this._detonateMultiExplosionPillar(px, py, radius, dmg);
    }
  }

  _detonateMultiExplosionPillar(px, py, radius, dmg) {
    const targets = this._collectTargets();
    let anyHit = false;
    for (let i = 0; i < targets.length; i++) {
      const foe = targets[i];
      if (Math.hypot(foe.x - px, foe.y - py) > radius + (foe.r || 25)) continue;
      applyDamageToTarget(foe, dmg, this, { source: 'multi_explosions', undodgeable: true });
      const pushAng = Math.atan2(foe.y - py, foe.x - px);
      foe.knockbackVx = (foe.knockbackVx || 0) + Math.cos(pushAng) * 8.5;
      foe.knockbackVy = (foe.knockbackVy || 0) + Math.sin(pushAng) * 8.5 - 2.0;
      if (typeof foe.applyHitStun === 'function') foe.applyHitStun(12);
      spawnBloodEffect(foe.x, foe.y, 10);
      spawnSparks(foe.x, foe.y, 10, '#FB7185', '#C084FC');
      this.activeVisualEffects.push({
        kind: 'darkBlast',
        x: foe.x,
        y: foe.y,
        radius: Math.round(radius * 0.82),
        timer: 20,
        maxTimer: 20,
      });
      anyHit = true;
    }
    if (anyHit) this._playSound('multiHit', 0.80);
  }

  // ── Base Form MUGEN Expansions (States 400, 1400, 1500) ──

  _castCloneAttack(target, angle, cfg) {
    this.gunAngle = angle;
    this.cloneAttackCooldown = cfg.cloneAttackCooldown ?? 260;
    const spd = 12.5;
    const r = (this.r || 30) + 12;
    this.aizenProjectiles.push({
      kind: 'clone_rush',
      x: this.x + Math.cos(angle) * r,
      y: this.y + Math.sin(angle) * r,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      radius: 16,
      explosionRadius: 46,
      damage: cfg.cloneAttackDamage ?? 16,
      life: 44,
      age: 0,
      homing: true,
      turnRate: 0.045,
      target,
    });
    this._playSound('cloneCast', 0.78);
  }

  _startConsecutiveSlashing(target, angle, cfg) {
    this.skillCastAngle = angle;
    this.gunAngle = angle;
    this.consecutiveSlashingCooldown = cfg.consecutiveSlashingCooldown ?? 380;
    this.consecutiveSlashingState = { active: true, target, angle, timer: 0, maxTimer: 28, hitCount: 0 };
    if (typeof target.applyTimeStop === 'function') target.applyTimeStop(28);
    this._playSound('consecutiveCast', 0.85);
    spawnFloatingText(this.x, this.y - (this.r || 30) - 22, 'SHUNPO BLITZ!', '#C084FC', 17);
  }

  _updateConsecutiveSlashingState(cfg, arenaObj) {
    const cs = this.consecutiveSlashingState;
    if (!cs || !cs.active) return;
    cs.timer++;
    const foe = cs.target && !cs.target.isDead ? cs.target : this._findNearestEnemy();
    if (!foe) { this.consecutiveSlashingState = null; return; }
    this.vx *= 0.2;
    this.vy *= 0.2;

    if (cs.timer % 7 === 0 && cs.timer < cs.maxTimer) {
      const ang = (cs.hitCount % 2 === 0 ? 1 : -1) * 1.15 + cs.angle;
      const arena = arenaObj || (typeof state !== 'undefined' && state.arena) || { x: 0, y: 0, width: 540, height: 960 };
      const dist = (foe.r || 25) + (this.r || 30) + 12;
      this.x = Math.max(arena.x + 28, Math.min(arena.x + arena.width - 28, foe.x - Math.cos(ang) * dist));
      this.y = Math.max(arena.y + 28, Math.min(arena.y + arena.height - 28, foe.y - Math.sin(ang) * dist));
      this.aim(foe);
      this.shunpoVfxTimer = 8;
      this.shunpoAngle = ang;
      const sliceDmg = Math.max(3, Math.round((cfg.consecutiveSlashingDamage ?? 28) * 0.22 * this._damageMultiplier()));
      applyDamageToTarget(foe, sliceDmg, this, { source: 'consecutive_slashing', undodgeable: true });
      this.activeVisualEffects.push({ kind: 'kuroSlashSpark', x: foe.x, y: foe.y, radius: 64, angle: ang, timer: 14, maxTimer: 14 });
      spawnBloodEffect(foe.x, foe.y, 6);
      this._playSound('hitSlash', 0.78);
      cs.hitCount++;
    } else if (cs.timer >= cs.maxTimer) {
      const finDmg = Math.round((cfg.consecutiveSlashingDamage ?? 28) * 0.55 * this._damageMultiplier());
      applyDamageToTarget(foe, finDmg, this, { source: 'consecutive_slashing', undodgeable: true });
      const ang = Math.atan2(foe.y - this.y, foe.x - this.x);
      foe.knockbackVx = (foe.knockbackVx || 0) + Math.cos(ang) * 9.5;
      foe.knockbackVy = (foe.knockbackVy || 0) + Math.sin(ang) * 9.5;
      this.activeVisualEffects.push({ kind: 'consecutiveFinisher', x: foe.x, y: foe.y, radius: 54, angle: ang, timer: 22, maxTimer: 22 });
      this._playSound('consecutiveFinisher', 0.88);
      triggerGlobalScreenShake(8, 12);
      this.consecutiveSlashingState = null;
    }
  }

  _castCompleteHypnosis(target, angle, cfg, arenaObj) {
    this.completeHypnosisCooldown = cfg.completeHypnosisCooldown ?? 440;
    const decoyX = this.x, decoyY = this.y;
    this.activeVisualEffects.push({ kind: 'kyokaShatter', x: decoyX, y: decoyY, radius: this.r || 30, timer: 26, maxTimer: 26 });
    const arena = arenaObj || (typeof state !== 'undefined' && state.arena) || { x: 0, y: 0, width: 540, height: 960 };
    const step = (target.r || 25) + (this.r || 30) + 14;
    this.x = Math.max(arena.x + 28, Math.min(arena.x + arena.width - 28, target.x + Math.cos(angle) * step));
    this.y = Math.max(arena.y + 28, Math.min(arena.y + arena.height - 28, target.y + Math.sin(angle) * step));
    this.aim(target);
    this.shunpoVfxTimer = 14;
    const dmg = Math.round((cfg.completeHypnosisDamage ?? 24) * this._damageMultiplier());
    applyDamageToTarget(target, dmg, this, { source: 'complete_hypnosis' });
    if (typeof target.applyHitStun === 'function') target.applyHitStun(cfg.completeHypnosisStunFrames ?? 36);
    this.activeVisualEffects.push({ kind: 'kuroSlashSpark', x: target.x, y: target.y, radius: 74, angle: angle + 0.5, timer: 18, maxTimer: 18 });
    spawnFloatingText(target.x, target.y - 34, 'COMPLETE HYPNOSIS!', '#C084FC', 18);
    this._playSound('hypnosisAmbush', 0.86);
    this._playSound('hypnosisShatter', 0.88);
  }

  // ── Hōgyoku Form MUGEN Expansions (States 25300, 25400, 25500) ──

  _startThunderbolts(angle, cfg) {
    this.skillCastAngle = angle;
    this.thunderboltsCooldown = cfg.thunderboltsCooldown ?? 300;
    this.thunderboltsState = { active: true, angle, timer: 0, wave: 0, offsets: [42, 84, 124] };
    this._playSound('thunderboltsCast', 0.86);
    spawnFloatingText(this.x, this.y - (this.r || 30) - 24, 'THUNDERBOLTS!', '#E9D5FF', 17);
  }

  _updateThunderboltsSpawner(cfg, arenaObj) {
    const tb = this.thunderboltsState;
    if (!tb || !tb.active) return;
    tb.timer++;
    if (tb.timer % 10 !== 1) return;
    if (tb.wave >= tb.offsets.length) { this.thunderboltsState = null; return; }
    const dist = tb.offsets[tb.wave++];
    const arena = arenaObj || (typeof state !== 'undefined' && state.arena) || { x: 0, y: 0, width: 540, height: 960 };
    const dmg = Math.round((cfg.thunderboltsDamage ?? 16) * this._damageMultiplier());
    this._playSound('thunderboltsHit', 0.84);
    for (const sign of [1, -1]) {
      const px = Math.max(arena.x + 28, Math.min(arena.x + arena.width - 28, this.x + Math.cos(tb.angle) * dist * sign));
      const py = Math.max(arena.y + 28, Math.min(arena.y + arena.height - 28, this.y + Math.sin(tb.angle) * dist * sign));
      this.activeVisualEffects.push({ kind: 'thunderboltPillar', x: px, y: py, radius: 46, timer: 20, maxTimer: 20 });
      for (const foe of this._collectTargets()) {
        if (Math.hypot(foe.x - px, foe.y - py) <= 48 + (foe.r || 25)) {
          applyDamageToTarget(foe, dmg, this, { source: 'thunderbolts' });
          if (typeof foe.applyHitStun === 'function') foe.applyHitStun(12);
          spawnSparks(foe.x, foe.y, 8, '#C084FC', '#FACC15');
        }
      }
    }
  }

  _castSwallowGround(target, cfg) {
    this.swallowGroundCooldown = cfg.swallowGroundCooldown ?? 380;
    const trapFrames = 32;
    this.swallowGroundState = {
      active: true,
      target,
      x: target.x,
      y: target.y,
      radius: 74,
      timer: 0,
      trapFrames,
      damage: cfg.swallowGroundDamage ?? 32,
    };
    this.activeVisualEffects.push({ kind: 'swallowAbyss', x: target.x, y: target.y, radius: 74, timer: 38, maxTimer: 38 });
    if (typeof target.applyTimeStop === 'function') target.applyTimeStop(trapFrames);
    this._playSound('swallowCast', 0.86);
    this._playSound('swallowAbyss', 0.88);
    spawnFloatingText(target.x, target.y - 36, 'SWALLOW GROUND!', '#A855F7', 17);
  }

  _updateSwallowGroundState() {
    const sg = this.swallowGroundState;
    if (!sg || !sg.active) return;
    sg.timer++;
    if (sg.target && !sg.target.isDead && sg.target.hp > 0 && sg.timer < sg.trapFrames) {
      sg.x = sg.target.x;
      sg.y = sg.target.y;
      sg.target.vx = 0;
      sg.target.vy = 0;
    }
    if (sg.timer >= sg.trapFrames) {
      for (const foe of this._collectTargets()) {
        if (foe === sg.target || Math.hypot(foe.x - sg.x, foe.y - sg.y) <= sg.radius + (foe.r || 25)) {
          applyDamageToTarget(foe, Math.round(sg.damage * this._damageMultiplier()), this, { source: 'swallow_ground', undodgeable: true });
          const ang = Math.atan2(foe.y - sg.y, foe.x - sg.x);
          foe.knockbackVx = (foe.knockbackVx || 0) + Math.cos(ang) * 9;
          foe.knockbackVy = (foe.knockbackVy || 0) + Math.sin(ang) * 9;
          spawnBloodEffect(foe.x, foe.y, 12);
        }
      }
      this.activeVisualEffects.push({ kind: 'darkBlast', x: sg.x, y: sg.y, radius: 66, timer: 22, maxTimer: 22 });
      this._playSound('multiBlast', 0.84);
      triggerGlobalScreenShake(9, 12);
      this.swallowGroundState = null;
    }
  }

  _castTimeSlowing(cfg) {
    this.timeSlowingCooldown = cfg.timeSlowingCooldown ?? 420;
    this.timeSlowFieldTimer = cfg.timeSlowingDurationFrames ?? 110;
    this.timeSlowFieldRadius = 135;
    this._playSound('timeSlow', 0.86);
    spawnFloatingText(this.x, this.y - (this.r || 30) - 24, 'TIME SLOWING!', '#C084FC', 17);
  }

  _updateTimeSlowFieldState(cfg) {
    if ((this.timeSlowFieldTimer || 0) <= 0) return;
    this.timeSlowFieldTimer--;
    const r = this.timeSlowFieldRadius || 135;
    for (const foe of this._collectTargets()) {
      if (Math.hypot(foe.x - this.x, foe.y - this.y) <= r + (foe.r || 25)) {
        foe.slowTimer = Math.max(foe.slowTimer || 0, 12);
        foe.slowMultiplier = Math.min(foe.slowMultiplier || 1, 0.42);
      }
    }
  }

  _triggerTimeSlowCounter(attacker) {
    const cfg = this._cfg();
    this.timeSlowFieldTimer = 0;
    const ang = Math.atan2(attacker.y - this.y, attacker.x - this.x);
    const arena = (typeof state !== 'undefined' && state.arena) || { x: 0, y: 0, width: 540, height: 960 };
    const step = (attacker.r || 25) + (this.r || 30) + 14;
    this.x = Math.max(arena.x + 28, Math.min(arena.x + arena.width - 28, attacker.x + Math.cos(ang) * step));
    this.y = Math.max(arena.y + 28, Math.min(arena.y + arena.height - 28, attacker.y + Math.sin(ang) * step));
    this.aim(attacker);
    const dmg = Math.round((cfg.timeSlowingCounterDamage ?? 34) * this._damageMultiplier());
    applyDamageToTarget(attacker, dmg, this, { source: 'time_slowing_counter', undodgeable: true });
    if (typeof attacker.applyHitStun === 'function') attacker.applyHitStun(32);
    this.activeVisualEffects.push({ kind: 'kuroSlashSpark', x: attacker.x, y: attacker.y, radius: 78, angle: ang, timer: 18, maxTimer: 18 });
    this._playSound('hypnosisShatter', 0.90);
    triggerGlobalScreenShake(8, 10);
  }

  // ── Final Form MUGEN Expansions (States 27000, 27100, 27300, 27400, 27500) ──

  _startRushingCrusher(angle, cfg) {
    this.skillCastAngle = angle;
    this.gunAngle = angle;
    this.rushingCrusherCooldown = cfg.rushingCrusherCooldown ?? 320;
    this.rushingCrusherState = { active: true, angle, timer: 0, maxTimer: 26, grabbed: null };
    this._playSound('rushCrush', 0.88);
    spawnFloatingText(this.x, this.y - (this.r || 30) - 24, 'RUSHING CRUSHER!', '#FACC15', 18);
  }

  _updateRushingCrusherState(cfg, arenaObj) {
    const rc = this.rushingCrusherState;
    if (!rc || !rc.active) return;
    rc.timer++;
    this.gunAngle = rc.angle;
    const rushSpeed = 16.5;
    this.vx = Math.cos(rc.angle) * rushSpeed;
    this.vy = Math.sin(rc.angle) * rushSpeed;
    const arena = arenaObj || (typeof state !== 'undefined' && state.arena) || { x: 0, y: 0, width: 540, height: 960 };

    if (!rc.grabbed) {
      for (const foe of this._collectTargets()) {
        if (Math.hypot(foe.x - this.x, foe.y - this.y) <= (this.r || 30) + (foe.r || 25) + 12) {
          rc.grabbed = foe;
          if (typeof foe.applyTimeStop === 'function') foe.applyTimeStop(18);
          break;
        }
      }
    }
    if (rc.grabbed && !rc.grabbed.isDead) {
      const offset = (this.r || 30) + (rc.grabbed.r || 25);
      rc.grabbed.x = Math.max(arena.x + 24, Math.min(arena.x + arena.width - 24, this.x + Math.cos(rc.angle) * offset));
      rc.grabbed.y = Math.max(arena.y + 24, Math.min(arena.y + arena.height - 24, this.y + Math.sin(rc.angle) * offset));
      rc.grabbed.vx = 0;
      rc.grabbed.vy = 0;
    }

    const pad = (this.r || 30) + 14;
    const hitWall = (
      this.x <= arena.x + pad || this.x >= arena.x + arena.width - pad ||
      this.y <= arena.y + pad || this.y >= arena.y + arena.height - pad
    );
    if ((rc.grabbed && (hitWall || rc.timer >= rc.maxTimer)) || rc.timer >= rc.maxTimer) {
      if (rc.grabbed && !rc.grabbed.isDead) {
        const dmg = Math.round((cfg.rushingCrusherDamage ?? 34) * this._damageMultiplier());
        applyDamageToTarget(rc.grabbed, dmg, this, { source: 'rushing_crusher', undodgeable: true });
        spawnBloodEffect(rc.grabbed.x, rc.grabbed.y, 14);
        this.activeVisualEffects.push({ kind: 'rushCrushSmash', x: rc.grabbed.x, y: rc.grabbed.y, radius: 66, timer: 24, maxTimer: 24 });
        this._playSound('rushCrush', 0.92);
        triggerGlobalScreenShake(11, 14);
      }
      this.rushingCrusherState = null;
    }
  }

  _castParalysisVibrations(cfg) {
    this.paralysisVibrationsCooldown = cfg.paralysisVibrationsCooldown ?? 360;
    const vibR = 128;
    const dmg = Math.round((cfg.paralysisVibrationsDamage ?? 22) * this._damageMultiplier());
    const stun = cfg.paralysisVibrationsStunFrames ?? 48;
    this.activeVisualEffects.push({ kind: 'paralysisVibration', x: this.x, y: this.y, radius: vibR, timer: 24, maxTimer: 24 });
    for (const foe of this._collectTargets()) {
      if (Math.hypot(foe.x - this.x, foe.y - this.y) <= vibR + (foe.r || 25)) {
        applyDamageToTarget(foe, dmg, this, { source: 'paralysis_vibrations', undodgeable: true });
        if (typeof foe.applyTimeStop === 'function') foe.applyTimeStop(stun);
        spawnSparks(foe.x, foe.y, 10, '#E879F9', '#FFFFFF');
      }
    }
    this._playSound('vibrations', 0.86);
    triggerGlobalScreenShake(8, 12);
    spawnFloatingText(this.x, this.y - (this.r || 30) - 24, 'PARALYSIS VIBRATIONS!', '#E879F9', 17);
  }

  _castSoulsTorture(target, cfg) {
    this.soulsTortureCooldown = cfg.soulsTortureCooldown ?? 340;
    const tx = target.x, ty = target.y;
    const r = 72;
    this.activeVisualEffects.push({ kind: 'soulsTortureMonolith', x: tx, y: ty, radius: r, timer: 28, maxTimer: 28 });
    const dmg = Math.round((cfg.soulsTortureDamage ?? 38) * this._damageMultiplier());
    for (const foe of this._collectTargets()) {
      if (foe === target || Math.hypot(foe.x - tx, foe.y - ty) <= r + (foe.r || 25)) {
        applyDamageToTarget(foe, dmg, this, { source: 'souls_torture', undodgeable: true });
        if (typeof foe.applyHitStun === 'function') foe.applyHitStun(22);
        spawnBloodEffect(foe.x, foe.y, 12);
      }
    }
    this._playSound('soulsTorture', 0.88);
    this._playSound('soulsDrop', 0.88);
    triggerGlobalScreenShake(10, 14);
    spawnFloatingText(tx, ty - 38, 'SOULS TORTURE!', '#A855F7', 18);
  }

  _castShadowWaves(target, angle, cfg) {
    this.gunAngle = angle;
    this.shadowWavesCooldown = cfg.shadowWavesCooldown ?? 260;
    const spd = 12.0;
    const baseR = (this.r || 30) + 14;
    for (const spread of [-0.26, 0, 0.26]) {
      const a = angle + spread;
      this.aizenProjectiles.push({
        kind: 'shadow_wave',
        x: this.x + Math.cos(a) * baseR,
        y: this.y + Math.sin(a) * baseR,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        radius: 15,
        explosionRadius: 50,
        damage: cfg.shadowWavesDamage ?? 20,
        life: 52,
        age: 0,
        homing: false,
        target,
      });
    }
    this._playSound('shadowWaves', 0.86);
    this._playSound('shadowWaveFire', 0.80);
  }

  _startShellsInevitables(target, angle, cfg) {
    this.skillCastAngle = angle;
    this.gunAngle = angle;
    this.shellsInevitablesCooldown = cfg.shellsInevitablesCooldown ?? 300;
    this.shellsBarrageState = { active: true, target, angle, timer: 0, wavesLeft: 4 };
    this._playSound('shellsCast', 0.88);
    spawnFloatingText(this.x, this.y - (this.r || 30) - 24, 'SHELLS INEVITABLES!', '#C084FC', 17);
  }

  _updateShellsBarrageSpawner(cfg) {
    const sb = this.shellsBarrageState;
    if (!sb || !sb.active) return;
    sb.timer++;
    if (sb.timer % 5 !== 1) return;
    const foe = sb.target && !sb.target.isDead ? sb.target : this._findNearestEnemy();
    const baseAng = foe ? Math.atan2(foe.y - this.y, foe.x - this.x) : (sb.angle || 0);
    const spd = 12.5;
    this._playSound('shellFire', 0.78);
    for (const side of [-0.38, 0.38]) {
      const a = baseAng + side + (Math.random() - 0.5) * 0.16;
      this.aizenProjectiles.push({
        kind: 'shell_bolt',
        x: this.x + Math.cos(a) * 24,
        y: this.y + Math.sin(a) * 24,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        radius: 9,
        explosionRadius: 34,
        damage: cfg.shellsInevitablesDamage ?? 9,
        life: 62,
        age: 0,
        homing: true,
        homingDelay: 7,
        turnRate: 0.11,
        target: foe,
      });
    }
    sb.wavesLeft--;
    if (sb.wavesLeft <= 0) this.shellsBarrageState = null;
  }

  /**
   * Rule 24 & 32: Canonical pre-baked pixel body + Layer 2 hair skin renderer.
   */
  drawBody(ctx) {
    drawAizenSkin(ctx, this);
  }

  drawGun(ctx) {
    // Intentionally empty: Aizen uses Kyōka Suigetsu katana instead of generic gun
  }

  draw(ctx, opponent) {
    const suppressed = typeof this.areAttackEffectsSuppressed === 'function' ? this.areAttackEffectsSuppressed() : false;

    if (!suppressed) {
      drawAizenFormAuraVFX(ctx, this);
      drawAizenShunpoSpeedLinesVFX(ctx, this);
    }

    this.drawBody(ctx);

    if (!suppressed) {
      drawAizenBladeAndSlashVFX(ctx, this);
      drawAizenDankuVFX(ctx, this);
      drawAizenProjectilesVFX(ctx, this.aizenProjectiles);
      drawAizenRaikohoBeamVFX(ctx, this);
      drawAizenKurohitsugiVFX(ctx, this);
      drawAizenRikujokoroVFX(ctx, this);
      drawAizenDomainAndRushVFX(ctx, this);
      drawAizenKyokaVFX(ctx, this);
    }

    // Rule 21: Mandatory in-game overhead HP & freeze status rendering
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }
}
