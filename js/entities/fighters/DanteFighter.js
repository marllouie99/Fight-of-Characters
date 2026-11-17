// ─────────────────────────────────────────────────────────────────────────────
// DANTE FIGHTER ENTITY CLASS
// Devil May Cry — The Legendary Devil Hunter (Jump Force MUGEN V14 Port)
// Modularized across danteCombat.js, danteSkills.js, and danteTrickster.js.
// ─────────────────────────────────────────────────────────────────────────────

import { Fighter, applyDamageToTarget, isSkillEnabled } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { state } from '../../core/state.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { drawFighterInkOutline } from '../../graphics/renderers/fighterOutlineRenderer.js';
import { drawDanteSkin } from '../../graphics/fighters/danteSkin.js';
import {
  drawDanteDtAura,
  drawDanteJackpotBeam,
  drawDantePixelBullet,
  drawDantePixelShockwaves,
  drawDanteSprite,
  getDanteVfxEntries,
  updateDanteTransientVfx,
  drawDanteTransientVfx,
  updateDanteWeaponVanishVfx,
  drawDanteWeaponVanishVfx,
  drawDanteSideSpecialBlade,
} from '../../graphics/weapons/danteWeaponGraphics.js';
import {
  evaluateDanteBasicCrit,
  dealDanteBasicAttackDamage,
  syncDanteWeaponSwitch,
  startDanteFinisherGunSequence,
  fireSingleEbonyIvoryBullet,
  stepDanteBasicGunQueues,
  executeDanteRebellionCleave,
  applyDanteMillionStabThrustHit,
  executeDanteMillionStabFinisher,
  stepDanteMillionStab,
} from './dante/danteCombat.js';
import {
  activateDanteDevilTrigger,
  startDanteJackpot,
  startDanteDoppelganger,
  startDanteKalinaAnn,
  startDanteRoundTrip,
  startDanteDrive,
  tryCastDanteSkills,
  processDanteChanneling,
  updateDanteProjectilesAndSummons,
} from './dante/danteSkills.js';
import {
  isSpotDodgeUnblockable,
  resolveDanteTakeDamage,
  handleDanteProjectileApproach,
  checkDanteSpotDodgeAnticipation,
  performDanteTricksterDash,
} from './dante/danteTrickster.js';

export class DanteFighter extends Fighter {
  constructor(def) {
    super(def);
    this.characterId = 'dante';
    this.type = 'dante';
    this.usesCustomHands = true;

    const cfg = CONFIG.dante || {};
    this.name = def?.name || cfg.name || 'DANTE';
    this.displayName = def?.displayName || cfg.displayName || 'Dante';
    this.themeColor = def?.themeColor || cfg.themeColor || '#EF4444';
    this.color = this.themeColor;
    this.damageNumberColor = this.themeColor;

    this.hp = def?.hp || cfg.hp || 380;
    this.maxHp = this.hp;
    this.baseMoveSpeed = def?.moveSpeed || cfg.moveSpeed || cfg.speed || 5.5;
    this.moveSpeed = this.baseMoveSpeed;
    this.speed = this.baseMoveSpeed;
    // Rule 24: preserve scaled radius from super(def); only fallback if uninitialized
    if (!this.r) {
      this.r = cfg.r || 25;
      this.radius = this.r;
    }

    this.reset();
  }

  // ─── Lifecycle & State Reset ────────────────────────────────────────────────

  reset() {
    super.reset();
    const cfg = CONFIG.dante || {};
    this._resetBasicCombatState(cfg);
    this._resetSkillState(cfg);
    this._resetTricksterAndVisualState(cfg);
  }

  _resetBasicCombatState(cfg) {
    this.swordCooldown = 0;
    this.slashSwingTimer = 0;
    this.slashSwingMaxTimer = 36;
    this.slashDir = 1;
    this.slashMoveType = 'cleave_right';
    this.comboStep = 0;
    this._comboChainActive = false;
    this._comboHitLanded = false;
    this._millionStabTimer = 0;
    this._millionStabTick = 0;
    this._millionStabFinisherDelay = 0;
    this._millionStabHitLanded = false;
    this._highTimeHopTimer = 0;
    this.critChance = cfg.critChance ?? 0.22;
    this.critMultiplier = cfg.critMultiplier ?? 1.75;
    this._critComboStacks = 0;

    this.gunCooldown = Math.round((cfg.gunCooldown ?? 68) * 0.45);
    this._gunBurstQueue = 0;
    this._gunBurstTick = 0;
    this._gunVisualTimer = 0;
    this._gunShotIndex = 0;
    this._ebonyRecoilTimer = 0;
    this._ivoryRecoilTimer = 0;
    this._basicVoiceCooldown = 0;
    this._pendingGunSequence = false;
    this._gunSequenceTimer = 0;
    this._gunSequenceTick = 0;
    this._bullets = [];
  }

  _resetSkillState(cfg) {
    this.roundTripCooldown = Math.round((cfg.roundTripCooldown ?? 300) * 0.40);
    this._roundTripEntity = null;
    this._roundTripThrowTimer = 0;
    this._roundTripCatchTimer = 0;
    this.driveCooldown = Math.round((cfg.driveCooldown ?? 270) * 0.30);
    this._driveChargeTimer = 0;
    this._driveLockedAngle = 0;
    this._driveWaves = [];
    this.doppelgangerCooldown = Math.round((cfg.doppelgangerCooldown ?? 620) * 0.55);
    this._doppelganger = null;
    this.kalinaCooldown = Math.round((cfg.kalinaCooldown ?? 360) * 0.50);
    this._kalinaCastTimer = 0;
    this._kalinaLockedAngle = 0;
    this._rockets = [];

    this.devilTriggerCooldown = Math.round((cfg.devilTriggerCooldown ?? 1450) * 0.65);
    this.isDevilTrigger = false;
    this.devilTriggerTimer = 0;
    this._dtTornado = null;
    this._jackpotTimer = 0;
    this._jackpotFireTimer = 0;
    this._jackpotLockedAngle = 0;
    this._jackpotUsedThisDT = false;
  }

  _resetTricksterAndVisualState(cfg) {
    this.tricksterCooldown = 0;
    this.isSpotDodging = false;
    this._spotDodgeTimer = 0;
    this._spotDodgeMaxTimer = 18;
    this._spotDodgeOriginX = 0;
    this._spotDodgeOriginY = 0;
    this.trickPhaseTimer = 0;
    this.suppressInkOutline = false;
    this.suppressFloorShadow = false;
    this.hideHpText = false;
    this._danteVfx = [];
    this._shockwaves = [];
    this._weaponMode = 'rebellion';
    this._weaponSwitchFrom = 'rebellion';
    this._weaponSwitchTo = 'rebellion';
    this._weaponSwitchTimer = 0;
    this._weaponSwitchMaxTimer = Math.max(6, cfg.weaponSwitchFrames ?? 14);
    this.weaponSwitchCooldown = 0;
    this._weaponVanishGhosts = [];
  }

  /**
   * Rule 23: Suppresses base Fighter bullet auto-fire; Dante uses Ebony & Ivory bursts.
   */
  shoot(ownerIndex) {
    // Intentionally empty (Rule 23)
  }

  /**
   * Pre-warms Dante's MUGEN VFX strips & sound banks behind the loading curtain (Rule 35).
   */
  prewarmAssets(ctx) {
    const entries = getDanteVfxEntries();
    if (ctx) {
      for (const entry of entries) {
        if (entry.img && entry.img.complete && entry.img.naturalWidth > 0) {
          try {
            ctx.drawImage(entry.img, 0, 0, 1, 1, -100, -100, 1, 1);
          } catch (_) {
            // ignore offline decode edge
          }
        }
      }
    }
    const sounds = CONFIG.dante?.sounds;
    if (sounds && typeof audioSystem !== 'undefined' && typeof audioSystem.preload === 'function') {
      for (const src of Object.values(sounds)) {
        if (typeof src === 'string') audioSystem.preload(src);
      }
    }
    return entries.length > 0 ? entries.length : 8;
  }

  interruptAttacks(forceCancelAll = false) {
    this._gunBurstQueue = 0;
    this._ebonyRecoilTimer = 0;
    this._ivoryRecoilTimer = 0;
    this._driveChargeTimer = 0;
    this._kalinaCastTimer = 0;
    this._jackpotTimer = 0;
    this._jackpotFireTimer = 0;
    this.slashSwingTimer = 0;
    this._comboChainActive = false;
    this._millionStabTimer = 0;
    this._millionStabFinisherDelay = 0;
    this._millionStabHitLanded = false;
    this._comboHitLanded = false;
    this._highTimeHopTimer = 0;
    this._pendingGunSequence = false;
    this._gunSequenceTimer = 0;
    this._gunSequenceTick = 0;
    this._roundTripThrowTimer = 0;
    if (this._roundTripEntity && this._roundTripEntity.phase === 'charge') {
      this._roundTripEntity = null;
    }
    this.z = 0;
    if (forceCancelAll) {
      this._danteVfx.length = 0;
      this._shockwaves.length = 0;
      this._weaponVanishGhosts.length = 0;
      // Preserve an already-thrown Side Special blade on knockback hits; only clear on death/defeat
      if (this.hp <= 0 || this.isDead || this.dead) {
        this._roundTripEntity = null;
      }
      this._roundTripCatchTimer = 0;
      this._weaponMode = 'rebellion';
      this._weaponSwitchTimer = 0;
      this.weaponSwitchCooldown = 0;
      this._gunVisualTimer = 0;
      this._bullets.length = 0;
      this._doppelganger = null;
      this._dtTornado = null;
    }
  }

  canAim() {
    if (
      this._roundTripEntity?.phase === 'charge' ||
      this._driveChargeTimer > 0 ||
      this._kalinaCastTimer > 0 ||
      this._jackpotTimer > 0 ||
      this._jackpotFireTimer > 0
    ) {
      return false;
    }
    return super.canAim();
  }

  // ─── Targeting, Audio & Feedback Helpers ────────────────────────────────────

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
    if (this.teamIndex !== undefined && target.teamIndex !== undefined) {
      return target.teamIndex !== this.teamIndex;
    }
    return true;
  }

  _getHostileTargets(opponent) {
    const out = [];
    const seen = new Set();
    const list = (Array.isArray(state?.fighters) && state.fighters.length > 0) ? state.fighters : [opponent];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      if (this._isHostile(f) && !seen.has(f)) {
        seen.add(f);
        out.push(f);
      }
    }
    if (opponent && this._isHostile(opponent) && !seen.has(opponent)) {
      out.push(opponent);
    }
    return out;
  }

  _playSfx(key) {
    const cfg = CONFIG.dante || {};
    const path = cfg.sounds?.[key];
    if (!path) return;
    const vol = cfg.soundVolumes?.[key] ?? 0.85;
    if (typeof audioSystem !== 'undefined' && audioSystem.playSFX) {
      audioSystem.playSFX(path, vol);
    }
  }

  _maybePlayBasicVoice(keys, chance, cfg, cooldownFrames) {
    const activeCfg = cfg || CONFIG.dante || {};
    if (!isSkillEnabled(activeCfg.enableBasicVoicelines, true)) return null;
    if ((this._basicVoiceCooldown || 0) > 0) return null;
    const list = Array.isArray(keys) ? keys : [keys];
    if (list.length === 0) return null;

    const p = Math.max(0, Math.min(1, chance ?? 0.45));
    if (p <= 0 || Math.random() >= p) return null;

    const key = list[Math.floor(Math.random() * list.length)];
    this._basicVoiceCooldown = Math.max(0, cooldownFrames ?? (activeCfg.basicVoiceCooldownFrames ?? 38));
    this._playSfx(key);
    return key;
  }

  _spawnVfx(kind, x, y, angle = 0, w = 90, h = 90, maxLife = 16, alpha = 0.94, flipY = false) {
    this._danteVfx.push({ kind, x, y, angle, w, h, life: maxLife, maxLife, alpha, flipY });
  }

  _spawnRipple(x, y, maxR = 88, color = '#EF4444') {
    this._shockwaves.push({ x, y, maxR, color, life: 18, maxLife: 18 });
  }

  _damageScale() {
    const cfg = CONFIG.dante || {};
    return this.isDevilTrigger ? (cfg.dtDamageMultiplier ?? 1.25) : 1.0;
  }

  _dealDamage(target, rawDmg, opts = {}) {
    if (!this._isHostile(target)) return 0;
    const dmg = Math.max(1, Math.round(rawDmg * this._damageScale()));
    const landed = applyDamageToTarget(target, dmg, this, {
      ...opts,
      guardBreak: Boolean(this.isDevilTrigger || opts.guardBreak),
    });
    return landed ? dmg : 0;
  }

  // ─── Basic Combat, Crit & Weapon Switching Delegates ────────────────────────

  evaluateBasicCrit(rawDmg = 0, opts = {}) {
    return evaluateDanteBasicCrit(this, rawDmg, opts);
  }

  _dealBasicAttackDamage(target, rawDmg, opts = {}) {
    return dealDanteBasicAttackDamage(this, target, rawDmg, opts);
  }

  _syncWeaponSwitch(cfg) {
    return syncDanteWeaponSwitch(this, cfg);
  }

  _executeRebellionCleave(opponent, cfg) {
    return executeDanteRebellionCleave(this, opponent, cfg);
  }

  _applyMillionStabThrustHit(enemy, rawDmg, aimAng, dx, dy, cfg) {
    return applyDanteMillionStabThrustHit(this, enemy, rawDmg, aimAng, dx, dy, cfg);
  }

  _executeMillionStabFinisher(opponent, cfg) {
    return executeDanteMillionStabFinisher(this, opponent, cfg);
  }

  _startFinisherGunSequence(cfg) {
    return startDanteFinisherGunSequence(this, cfg);
  }

  _fireSingleEbonyIvoryBullet(cfg, opts = {}) {
    return fireSingleEbonyIvoryBullet(this, cfg, opts);
  }

  _isMillionStabStationary() {
    return Boolean(this._millionStabTimer > 0 || this._millionStabFinisherDelay > 0);
  }

  _isPerformingMillionStab() {
    return Boolean(
      this._millionStabTimer > 0 ||
      this._millionStabFinisherDelay > 0 ||
      (this.slashSwingTimer > 0 && this.slashMoveType === 'million_stab')
    );
  }

  isStationarySkillActive() {
    return Boolean(
      this._isMillionStabStationary() ||
      this._jackpotTimer > 0 ||
      this._jackpotFireTimer > 0 ||
      super.isStationarySkillActive?.()
    );
  }

  hasActiveFinishingAbility() {
    return Boolean(
      this._isPerformingMillionStab() ||
      this.slashSwingTimer > 0 ||
      this._jackpotTimer > 0 ||
      this._jackpotFireTimer > 0
    );
  }

  // ─── Trickster Spot Dodge Delegates ─────────────────────────────────────────

  applyHitStun(duration) {
    if (this.isSpotDodging && this._spotDodgeTimer > 0) return;
    return super.applyHitStun(duration);
  }

  _isSpotDodgeUnblockable(attacker, opts = {}) {
    return isSpotDodgeUnblockable(this, attacker, opts);
  }

  takeDamage(amount, attacker = null, opts = {}) {
    return resolveDanteTakeDamage(this, amount, attacker, opts, super.takeDamage.bind(this));
  }

  receiveDamage(amount, attacker, opts = {}) {
    const applied = this.takeDamage(amount, attacker, opts);
    return applied ? amount : 0;
  }

  onProjectileApproach(projectile, attacker) {
    return handleDanteProjectileApproach(this, projectile, attacker);
  }

  _checkSpotDodgeAnticipation(target, dist, cfg) {
    return checkDanteSpotDodgeAnticipation(this, target, dist, cfg);
  }

  _performTricksterDash(threat, cfg) {
    return performDanteTricksterDash(this, threat, cfg);
  }

  // ─── Skill Launchers & Channeling Delegates ─────────────────────────────────

  activateDevilTrigger(opponent) { return activateDanteDevilTrigger(this, opponent); }
  startJackpot(opponent) { return startDanteJackpot(this, opponent); }
  startDoppelganger(opponent) { return startDanteDoppelganger(this, opponent); }
  startKalinaAnn(opponent) { return startDanteKalinaAnn(this, opponent); }
  startRoundTrip(opponent) { return startDanteRoundTrip(this, opponent); }
  startDrive(opponent) { return startDanteDrive(this, opponent); }
  _tryCastSkills(opponent, cfg, dist) { return tryCastDanteSkills(this, opponent, cfg, dist); }
  _processActiveChanneling(opponent, cfg) { return processDanteChanneling(this, opponent, cfg); }
  _updateProjectilesAndSummons(opponent, arena) { return updateDanteProjectilesAndSummons(this, opponent, arena); }

  // ─── Per-Frame Timers, AI Decision & Main Update Loop ───────────────────────

  _tickDanteTimers(cfg) {
    if (this.swordCooldown > 0) this.swordCooldown--;
    if (this._isMillionStabStationary() && this.slashSwingTimer > 0) this.slashSwingTimer--;
    if (this.trickPhaseTimer > 0) this.trickPhaseTimer--;
    if (this._spotDodgeTimer > 0) {
      this._spotDodgeTimer--;
      this.hitFlashTimer = 0;
      if (this._spotDodgeTimer <= 0) {
        this.isSpotDodging = false;
        this.trickPhaseTimer = 0;
        this.suppressInkOutline = false;
        this.suppressFloorShadow = false;
        this.hideHpText = false;
        this._playSfx('trickAppear');
      }
    }
    if (this._highTimeHopTimer > 0) {
      this._highTimeHopTimer--;
      const hopMax = Math.max(1, (cfg.highTimeHopFrames ?? 20) - 2);
      const hp = Math.max(0, Math.min(1, 1 - this._highTimeHopTimer / hopMax));
      this.z = Math.max(0, Math.sin(hp * Math.PI) * (cfg.highTimeHopHeight ?? 22));
      if (this._highTimeHopTimer === 0) this.z = 0;
    }

    if (this.gunCooldown > 0) this.gunCooldown--;
    if (this._gunVisualTimer > 0) this._gunVisualTimer--;
    if (this._ebonyRecoilTimer > 0) this._ebonyRecoilTimer--;
    if (this._ivoryRecoilTimer > 0) this._ivoryRecoilTimer--;
    if (this._basicVoiceCooldown > 0) this._basicVoiceCooldown--;
    if (!this._roundTripEntity && this.roundTripCooldown > 0) this.roundTripCooldown--;
    if (this.driveCooldown > 0) this.driveCooldown--;
    if (this.doppelgangerCooldown > 0) this.doppelgangerCooldown--;
    if (this.kalinaCooldown > 0) this.kalinaCooldown--;
    if (this.tricksterCooldown > 0) this.tricksterCooldown--;
    if (this._weaponSwitchTimer > 0) this._weaponSwitchTimer--;
    if (this.weaponSwitchCooldown > 0) this.weaponSwitchCooldown--;
    if (this._roundTripThrowTimer > 0) this._roundTripThrowTimer--;
    if (this._roundTripCatchTimer > 0) this._roundTripCatchTimer--;
    if (this._gunSequenceTimer > 0) {
      this._gunSequenceTimer--;
      this._gunVisualTimer = Math.max(this._gunVisualTimer || 0, this._gunSequenceTimer);
    }

    this._tickDevilTriggerRegen(cfg);
  }

  _tickDevilTriggerRegen(cfg) {
    if (!this.isDevilTrigger) {
      if (this.devilTriggerCooldown > 0) this.devilTriggerCooldown--;
      return;
    }
    this.devilTriggerTimer--;
    // Rule 27: Healthbar-only DT replenishment (zero arena floating text)
    const healPerFrame = (cfg.dtHealPerSecond ?? 3.5) / 60;
    if (healPerFrame > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + healPerFrame);
      this._healthBarHealTimer = 10;
    }
    if (this.devilTriggerTimer <= 0) {
      this.isDevilTrigger = false;
      this.speed = this.baseMoveSpeed;
      this.moveSpeed = this.baseMoveSpeed;
    }
  }

  _updateTransientVisualsOnly() {
    updateDanteTransientVfx(this._danteVfx);
    updateDanteWeaponVanishVfx(this._weaponVanishGhosts);
    for (let i = this._shockwaves.length - 1; i >= 0; i--) {
      if (--this._shockwaves[i].life <= 0) this._shockwaves.splice(i, 1);
    }
  }

  _stepDanteCombatAi(opponent, primaryTarget, hostiles, dist, cfg) {
    if (hostiles.length === 0 || !primaryTarget) return;

    if (this._comboChainActive && this.slashSwingTimer <= 0 && isSkillEnabled(cfg.enableRebellionCombo, true) && !this._roundTripEntity) {
      this._executeRebellionCleave(primaryTarget, cfg);
    } else if (this.slashSwingTimer <= 0 && this._gunSequenceTimer <= 0 && !this._tryCastSkills(opponent, cfg, dist)) {
      const reach = (cfg.swordReach ?? 94) + (this.isDevilTrigger ? (cfg.dtSwordReachBonus ?? 14) : 0);
      const bladeSpinningOut = Boolean(
        this._roundTripEntity &&
        (this._roundTripEntity.phase === 'spin' || this._roundTripEntity.phase === 'return')
      );
      const canSideSpecialGunfire = bladeSpinningOut && this._gunBurstQueue <= 0;
      const canStandaloneGunfire = !isSkillEnabled(cfg.enableFinisherGunSequence, true) && this.weaponSwitchCooldown <= 0 && this._weaponSwitchTimer <= 0 && dist > 60;
      if (isSkillEnabled(cfg.enableRebellionCombo, true) && !this._roundTripEntity && this._weaponSwitchTimer <= 0 && dist <= reach + (primaryTarget.r || 28) && this.swordCooldown <= 0) {
        this.comboStep = 0;
        this._executeRebellionCleave(primaryTarget, cfg);
      } else if (isSkillEnabled(cfg.enableGunfire, true) && this.gunCooldown <= 0 && (canSideSpecialGunfire || canStandaloneGunfire)) {
        this.gunCooldown = cfg.gunCooldown ?? 68;
        this._gunBurstQueue = Math.max(0, (cfg.gunBurstCount ?? 3) - 1);
        this._gunBurstTick = 6;
        this._fireSingleEbonyIvoryBullet(cfg);
      }
    }

    if (this._isMillionStabStationary()) {
      this.vx = 0;
      this.vy = 0;
    } else if (this._isPerformingMillionStab()) {
      this.vx = (this.vx || 0) * 0.88;
      this.vy = (this.vy || 0) * 0.88;
    }
  }

  update(opponent, ownerIndex, arena) {
    const cfg = CONFIG.dante || {};

    // Rule 25: Decay transient visuals & projectiles BEFORE freeze/time-stop checks
    this._updateTransientVisualsOnly();
    this._updateProjectilesAndSummons(opponent, arena);

    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks(false);
      return;
    }

    this._tickDanteTimers(cfg);
    if (this.hp <= 0) return;

    this.aim(opponent);
    stepDanteMillionStab(this, opponent, cfg);

    const hostiles = this._getHostileTargets(opponent);
    const primaryTarget = hostiles[0] || opponent;
    if (hostiles.length === 0) this._comboChainActive = false;

    stepDanteBasicGunQueues(this, hostiles, cfg);

    const dist = primaryTarget ? Math.hypot(primaryTarget.x - this.x, primaryTarget.y - this.y) : 999;
    this._checkSpotDodgeAnticipation(primaryTarget, dist, cfg);

    if (!this._processActiveChanneling(opponent, cfg)) {
      this._stepDanteCombatAi(opponent, primaryTarget, hostiles, dist, cfg);
    }
    this._syncWeaponSwitch(cfg);

    const plantStance = this._isMillionStabStationary() || this._roundTripEntity?.phase === 'charge';
    if (plantStance) {
      if (this._roundTripEntity?.phase === 'charge') {
        this.vx = 0;
        this.vy = 0;
      }
      this.applyMovementPhysics(0);
      this.resolveWallBounce(arena, opponent);
    } else {
      super.update(opponent, ownerIndex, arena);
    }

    if (this._pendingGunSequence && this.slashSwingTimer <= 0 && !this._isPerformingMillionStab()) {
      if (isSkillEnabled(cfg.enableFinisherGunSequence, true) && this.weaponSwitchCooldown <= 0 && hostiles.length > 0) {
        this._startFinisherGunSequence(cfg);
      } else {
        this._pendingGunSequence = false;
      }
    }
  }

  // ─── Render Pipeline (Rules 21, 24, 35) ─────────────────────────────────────

  drawBody(ctx) {
    if (this.isSpotDodging && this._spotDodgeTimer > 0) return;
    drawDanteSkin(ctx, this);
  }

  _drawShockwaves(ctx) {
    drawDantePixelShockwaves(ctx, this._shockwaves);
  }

  _drawActiveProjectiles(ctx) {
    drawDanteSideSpecialBlade(ctx, this);
    for (let i = 0; i < this._driveWaves.length; i++) {
      const w = this._driveWaves[i];
      const fIdx = Math.min(5, Math.floor((48 - w.life) / 6));
      drawDanteSprite(ctx, 'driveWave', w.x, w.y, w.angle, 92, 108, fIdx, 0.94);
    }
    for (let i = 0; i < this._rockets.length; i++) {
      const rkt = this._rockets[i];
      drawDanteSprite(ctx, 'rocket', rkt.x, rkt.y, rkt.angle, 64, 24, 0, 0.98);
    }
    for (let i = 0; i < this._bullets.length; i++) {
      drawDantePixelBullet(ctx, this._bullets[i]);
    }
  }

  draw(ctx, opponent) {
    if (!ctx || this.hp <= 0) return;

    if (this._doppelganger) {
      const dg = this._doppelganger;
      ctx.save();
      ctx.globalAlpha = 0.56;
      drawDanteSkin(ctx, { ...this, x: dg.x, y: dg.y, z: 0, gunAngle: dg.angle, isDevilTrigger: true, hideHands: false });
      ctx.restore();
    }
    if (this._dtTornado) {
      const tor = this._dtTornado;
      const fIdx = Math.floor((96 - tor.life) / 3) % 7;
      drawDanteSprite(ctx, 'dtTornado', tor.x, tor.y, 0, tor.radius * 2.15, tor.radius * 2.0, fIdx, 0.85);
    }
    if (this.isDevilTrigger && !this.isSpotDodging) {
      drawDanteDtAura(ctx, this.x, this.y - (this.z || 0), this.r || 30, 0.84);
    }

    if (this.isSpotDodging && this._spotDodgeTimer > 0) {
      if (typeof state !== 'undefined' && state.frameCount !== undefined) {
        this._statusOverlaysRenderedFrame = state.frameCount;
      }
    } else {
      if (typeof drawFighterInkOutline === 'function') drawFighterInkOutline(ctx, this);
      this.drawBody(ctx);
    }

    this._drawActiveProjectiles(ctx);

    if (this._jackpotFireTimer > 0) {
      const cfg = CONFIG.dante || {};
      const ang = this._jackpotLockedAngle;
      const px = -Math.sin(ang) * 14;
      const py = Math.cos(ang) * 14;
      drawDanteJackpotBeam(ctx, this.x + px, this.y + py, ang, 620, (cfg.jackpotWidth ?? 60) * 0.72);
      drawDanteJackpotBeam(ctx, this.x - px, this.y - py, ang, 620, (cfg.jackpotWidth ?? 60) * 0.72);
    }

    drawDanteWeaponVanishVfx(ctx, this._weaponVanishGhosts);
    drawDanteTransientVfx(ctx, this._danteVfx);
    this._drawShockwaves(ctx);

    // Rule 21: Mandatory overhead HP & freeze status rendering on top layer
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }
}
