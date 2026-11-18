// ─────────────────────────────────────────────────────────────────────────────
// DANTE FIGHTER ENTITY CLASS
// Devil May Cry — The Legendary Devil Hunter (Jump Force MUGEN V14 Port)
// Modularized across danteCombat.js, danteSkills.js, danteSdtSkills.js, danteTrickster.js
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
  drawDanteSideSpecialBlade,
  drawDanteSprite,
  drawDanteSdtBackVfx,
  drawDanteSdtVfx,
  drawDanteTransformSequenceVfx,
  drawDanteTransientVfx,
  drawDanteWeaponVanishVfx,
  getDanteVfxEntries,
  updateDanteTransientVfx,
  updateDanteWeaponVanishVfx,
} from '../../graphics/weapons/danteWeaponGraphics.js';
import {
  applyDanteMillionStabThrustHit,
  dealDanteBasicAttackDamage,
  evaluateDanteBasicCrit,
  executeDanteMillionStabFinisher,
  executeDanteRebellionCleave,
  fireSingleEbonyIvoryBullet,
  startDanteFinisherGunSequence,
  stepDanteBasicGunQueues,
  stepDanteMillionStab,
  syncDanteWeaponSwitch,
} from './dante/danteCombat.js';
import {
  activateDanteDevilTrigger,
  processDanteChanneling,
  startDanteDoppelganger,
  startDanteDrive,
  startDanteJackpot,
  startDanteKalinaAnn,
  startDanteRoundTrip,
  stepDanteTransformSequence,
  tryCastDanteSkills,
  updateDanteProjectilesAndSummons,
} from './dante/danteSkills.js';
import {
  decayDanteSdtVisualsOnFreeze,
  startDanteJudgment,
  startDanteOmbra,
  startDanteSdtCombo,
  startDanteSinStinger,
  stepDanteSdtSkillTimers,
  tryCastDanteSdtSkills,
} from './dante/danteSdtSkills.js';
import {
  checkDanteSpotDodgeAnticipation,
  handleDanteProjectileApproach,
  performDanteTricksterDash,
  resolveDanteTakeDamage,
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

    // Prevent SkillManager from double-decrementing Dante's custom cooldown fields
    this._customTickedCooldowns = new Set([
      'swordCooldown',
      'gunCooldown',
      'roundTripCooldown',
      'driveCooldown',
      'doppelgangerCooldown',
      'kalinaCooldown',
      'tricksterCooldown',
      'devilTriggerCooldown',
      'weaponSwitchCooldown',
      'sdtComboCooldown',
      'sinStingerCooldown',
      'ombraCooldown',
      'judgmentCooldown',
    ]);

    this._initDanteState(cfg);
  }

  _cfg() {
    return CONFIG.dante || {};
  }

  _initDanteState(cfg = CONFIG.dante || {}) {
    this.comboStep = 0;
    this.slashMoveType = 'cleave_right';
    this.slashDir = 1;
    this.slashSwingTimer = 0;
    this.slashSwingMaxTimer = 14;
    this.swordCooldown = 0;
    this._comboChainActive = false;
    this._comboHitLanded = false;
    this._critComboStacks = 0;

    this._millionStabTimer = 0;
    this._millionStabFinisherDelay = 0;
    this._millionStabHitLanded = false;
    this._highTimeHopTimer = 0;

    this.gunCooldown = Math.round((cfg.gunCooldown ?? 68) * 0.45);
    this._gunBurstQueue = 0;
    this._gunBurstTick = 0;
    this._gunVisualTimer = 0;
    this._gunShotIndex = 0;
    this._ebonyRecoilTimer = 0;
    this._ivoryRecoilTimer = 0;
    this._gunSequenceTimer = 0;
    this._gunSequenceTick = 0;
    this._pendingGunSequence = false;

    this._weaponMode = 'rebellion';
    this._weaponSwitchFrom = 'rebellion';
    this._weaponSwitchTo = 'rebellion';
    this._weaponSwitchTimer = 0;
    this._weaponSwitchMaxTimer = Math.max(6, cfg.weaponSwitchFrames ?? 14);
    this.weaponSwitchCooldown = 0;
    this._weaponVanishGhosts = [];

    this.roundTripCooldown = 0;
    this.driveCooldown = 60;
    this.doppelgangerCooldown = 140;
    this.kalinaCooldown = 110;
    this.tricksterCooldown = 0;
    this.devilTriggerCooldown = cfg.devilTriggerInitialCooldown ?? 0;

    this.sdtComboCooldown = 0;
    this.sinStingerCooldown = 0;
    this.ombraCooldown = 0;
    this.judgmentCooldown = 0;
    this._sdtComboState = null;
    this._sinStingerState = null;
    this._ombraFireballs = [];
    this._judgmentState = null;
    this._dtTeleportBolts = [];

    this._bullets = [];
    this._roundTripEntity = null;
    this._roundTripThrowTimer = 0;
    this._roundTripCatchTimer = 0;
    this._driveWaves = [];
    this._rockets = [];
    this._doppelganger = null;
    this._dtTornado = null;
    this._danteVfx = [];
    this._shockwaves = [];

    this._driveCastTimer = 0;
    this._driveLockedAngle = 0;
    this._kalinaCastTimer = 0;
    this._kalinaLockedAngle = 0;
    this._jackpotTimer = 0;
    this._jackpotFireTimer = 0;
    this._jackpotLockedAngle = 0;
    this._jackpotUsedThisDT = false;

    this._dtTransformTimer = 0;
    this._dtTransformMaxTimer = cfg.dtTransformFrames ?? 54;
    this._dtTransformBlastDone = false;

    this.isDevilTrigger = false;
    this.devilTriggerTimer = 0;

    this.isSpotDodging = false;
    this._spotDodgeTimer = 0;
    this._spotDodgeMaxTimer = cfg.spotDodgeFrames ?? 14;
    this._spotDodgeDir = 0;
    this.vanishTimer = 0;
    this.trickPhaseTimer = 0;
    this._basicVoiceCooldown = 0;
    this._danteHandPhys = null;
  }

  reset() {
    super.reset();
    this._initDanteState(this._cfg());
  }

  prewarmAssets() {
    return getDanteVfxEntries();
  }

  shoot() {
    // Rule 23: Suppresses generic base projectile bullets; uses Rebellion & Ebony/Ivory skills
  }

  hasActiveFinishingAbility() {
    return Boolean(
      (this._millionStabTimer || 0) > 0 ||
      (this._jackpotTimer || 0) > 0 ||
      (this._jackpotFireTimer || 0) > 0 ||
      (this._dtTransformTimer || 0) > 0 ||
      (this._gunSequenceTimer || 0) > 0 ||
      this._sdtComboState?.active ||
      this._sinStingerState?.active ||
      this._judgmentState?.active
    );
  }

  isStationarySkillActive() {
    return Boolean(
      (this._millionStabTimer || 0) > 0 ||
      (this._millionStabFinisherDelay || 0) > 0 ||
      (this._jackpotTimer || 0) > 0 ||
      (this._jackpotFireTimer || 0) > 0 ||
      this._roundTripEntity?.phase === 'charge' ||
      this._judgmentState?.active
    );
  }

  canAim() {
    if (
      this._driveCastTimer > 0 ||
      this._kalinaCastTimer > 0 ||
      this._jackpotTimer > 0 ||
      this._jackpotFireTimer > 0 ||
      this._roundTripEntity?.phase === 'charge' ||
      this._sdtComboState?.active ||
      this._sinStingerState?.active ||
      this._judgmentState?.active
    ) {
      return false;
    }
    return super.canAim();
  }

  interruptAttacks(forceCancelAll = false) {
    if (forceCancelAll) {
      this._driveCastTimer = 0;
      this._kalinaCastTimer = 0;
      this._jackpotTimer = 0;
      this._jackpotFireTimer = 0;
      this._gunSequenceTimer = 0;
      this._pendingGunSequence = false;
      this._millionStabTimer = 0;
      this._millionStabFinisherDelay = 0;
      this._comboChainActive = false;
      this._sdtComboState = null;
      this._sinStingerState = null;
      this._judgmentState = null;
      this._dtTransformTimer = 0;
      if (this._roundTripEntity && this._roundTripEntity.phase === 'charge') {
        this._roundTripEntity = null;
      }
      this._danteVfx.length = 0;
      this._shockwaves.length = 0;
      this._weaponVanishGhosts.length = 0;
    }
    if (this.hp <= 0) {
      this.isDevilTrigger = false;
      this.isSpotDodging = false;
      this.vanishTimer = 0;
      this.trickPhaseTimer = 0;
      this._doppelganger = null;
      this._dtTornado = null;
      this._roundTripEntity = null;
      this._weaponMode = 'rebellion';
      this._weaponSwitchTimer = 0;
      this._weaponVanishGhosts.length = 0;
      this._driveWaves.length = 0;
      this._bullets.length = 0;
      this._rockets.length = 0;
      this._ombraFireballs.length = 0;
      this._dtTeleportBolts.length = 0;
    }
    super.interruptAttacks?.(forceCancelAll);
  }

  _isHostile(target) {
    if (!target || target === this || target.hp <= 0 || target.isDead || target.dead) return false;
    if (typeof state !== 'undefined' && typeof state.getFighterTeam === 'function' && Array.isArray(state.fighters)) {
      const myIdx = state.fighters.indexOf(this);
      const subj = (target.owner && !state.fighters.includes(target)) ? target.owner : target;
      if (subj === this) return false;
      const tIdx = state.fighters.indexOf(subj);
      if (myIdx !== -1 && tIdx !== -1) {
        const myTeam = state.getFighterTeam(myIdx);
        const targetTeam = state.getFighterTeam(tIdx);
        if (myTeam !== null && targetTeam !== null) return myTeam !== targetTeam;
      }
    }
    return true;
  }

  _getHostileTargets(opponent) {
    const out = [];
    const seen = new Set();
    const pushIfHostile = (t) => {
      if (!t || seen.has(t) || !this._isHostile(t)) return;
      seen.add(t);
      out.push(t);
    };
    if (typeof state !== 'undefined') {
      if (Array.isArray(state.fighters)) state.fighters.forEach(pushIfHostile);
      if (Array.isArray(state.illusions)) state.illusions.forEach(pushIfHostile);
    }
    if (opponent) pushIfHostile(opponent);
    return out;
  }

  _playSfx(key, volMult = 1.0, speed = 1.0) {
    if (typeof audioSystem === 'undefined' || typeof audioSystem.playSFX !== 'function') return;
    const cfg = this._cfg();
    const src = cfg.sounds?.[key];
    if (!src) return;
    const vol = (cfg.soundVolumes?.[key] ?? 0.75) * volMult;
    audioSystem.playSFX(src, vol, speed, 0);
  }

  _maybePlayBasicVoice(keys = [], chance = 0.5, cfg = null, cooldownFrames = 38) {
    if ((this._basicVoiceCooldown || 0) > 0) return false;
    if (!Array.isArray(keys) || keys.length === 0) return false;
    if (Math.random() > Math.max(0, Math.min(1, chance))) return false;
    const activeCfg = cfg || this._cfg();
    const available = keys.filter((k) => Boolean(activeCfg.sounds?.[k]));
    if (available.length === 0) return false;
    const pick = available[Math.floor(Math.random() * available.length)];
    this._basicVoiceCooldown = Math.max(8, cooldownFrames);
    this._playSfx(pick, 1.0, 0.96 + Math.random() * 0.08);
    return true;
  }

  _spawnVfx(kind, x, y, angle = 0, w = 84, h = 84, life = 16, alpha = 0.94, flipY = false, extra = null) {
    this._danteVfx.push({
      kind,
      x,
      y,
      angle,
      w,
      h,
      life,
      maxLife: Math.max(1, life),
      alpha,
      flipY,
      ...(extra && typeof extra === 'object' ? extra : {}),
    });
  }

  _spawnRipple(x, y, maxR = 64, color = '#EF4444') {
    this._shockwaves.push({ x, y, maxR, color, life: 16, maxLife: 16 });
  }

  _dealDamage(target, amount, opts = {}) {
    if (!target || target.hp <= 0) return 0;
    const dmg = Math.max(1, Math.round(amount));
    const dealt = applyDamageToTarget(target, dmg, this, {
      color: this.themeColor || '#EF4444',
      ...opts,
    });
    return typeof dealt === 'number' ? dealt : (dealt ? dmg : 0);
  }

  evaluateBasicCrit(rawDmg = 0, opts = {}) {
    return evaluateDanteBasicCrit(this, rawDmg, opts);
  }

  _dealBasicAttackDamage(target, rawDmg, opts = {}) {
    return dealDanteBasicAttackDamage(this, target, rawDmg, opts);
  }

  _syncWeaponSwitch(cfg) {
    return syncDanteWeaponSwitch(this, cfg);
  }

  _startFinisherGunSequence(cfg) {
    return startDanteFinisherGunSequence(this, cfg);
  }

  _fireSingleEbonyIvoryBullet(cfg, opts = {}) {
    return fireSingleEbonyIvoryBullet(this, cfg, opts);
  }

  _executeRebellionCleave(opponent, cfg) {
    return executeDanteRebellionCleave(this, opponent, cfg);
  }

  _executeMillionStabFinisher(opponent, cfg) {
    return executeDanteMillionStabFinisher(this, opponent, cfg);
  }

  _applyMillionStabThrustHit(enemy, rawDmg, aimAng, dx, dy, cfg) {
    return applyDanteMillionStabThrustHit(this, enemy, rawDmg, aimAng, dx, dy, cfg);
  }

  _isPerformingMillionStab() {
    return Boolean(
      this.slashMoveType === 'million_stab' ||
      (this._millionStabTimer || 0) > 0 ||
      (this._millionStabFinisherDelay || 0) > 0
    );
  }

  takeDamage(amount, attacker, opts = {}) {
    return resolveDanteTakeDamage(this, amount, attacker, opts, (a, att, o) => super.takeDamage(a, att, o));
  }

  onIncomingProjectile(projectile, attacker) {
    return handleDanteProjectileApproach(this, projectile, attacker);
  }

  _performTricksterDash(threat, cfg) {
    return performDanteTricksterDash(this, threat, cfg);
  }

  _tickDanteTimers(cfg) {
    if (this.swordCooldown > 0) this.swordCooldown--;
    if (this.slashSwingTimer > 0) this.slashSwingTimer--;
    if (this._highTimeHopTimer > 0) {
      this._highTimeHopTimer--;
      const hp = 1 - this._highTimeHopTimer / 18;
      this.z = Math.max(0, Math.sin(hp * Math.PI) * 22);
      if (this._highTimeHopTimer === 0) this.z = 0;
    }
    if (this.gunCooldown > 0) this.gunCooldown--;
    if (this._gunVisualTimer > 0) this._gunVisualTimer--;
    if (this._ebonyRecoilTimer > 0) this._ebonyRecoilTimer--;
    if (this._ivoryRecoilTimer > 0) this._ivoryRecoilTimer--;
    if (this._weaponSwitchTimer > 0) this._weaponSwitchTimer--;
    if (this.weaponSwitchCooldown > 0) this.weaponSwitchCooldown--;
    if (this._roundTripThrowTimer > 0) this._roundTripThrowTimer--;
    if (this._roundTripCatchTimer > 0) this._roundTripCatchTimer--;
    if (!this._roundTripEntity && this.roundTripCooldown > 0) this.roundTripCooldown--;
    if (this.driveCooldown > 0) this.driveCooldown--;
    if (this.doppelgangerCooldown > 0) this.doppelgangerCooldown--;
    if (this.kalinaCooldown > 0) this.kalinaCooldown--;
    if (this.tricksterCooldown > 0) this.tricksterCooldown--;
    if (this._basicVoiceCooldown > 0) this._basicVoiceCooldown--;
    if (this.sdtComboCooldown > 0) this.sdtComboCooldown--;
    if (this.sinStingerCooldown > 0) this.sinStingerCooldown--;
    if (this.ombraCooldown > 0) this.ombraCooldown--;
    if (this.judgmentCooldown > 0) this.judgmentCooldown--;

    if (this.isSpotDodging) {
      this._spotDodgeTimer--;
      if (this._spotDodgeTimer <= 0) {
        this.isSpotDodging = false;
        this.vanishTimer = 0;
        this.trickPhaseTimer = 0;
      }
    }

    if (this.isDevilTrigger) {
      if ((this._dtTransformTimer || 0) <= 0) {
        this.devilTriggerTimer--;
      }
      const healPerFrame = (cfg.dtHealPerSecond ?? 3.5) / 60;
      if (healPerFrame > 0 && this.hp < this.maxHp) {
        this.hp = Math.min(this.maxHp, this.hp + healPerFrame);
        this._healthBarHealTimer = 10;
      }
      if (this.devilTriggerTimer <= 0) {
        this.isDevilTrigger = false;
        this.speed = this.baseMoveSpeed;
        this.moveSpeed = this.baseMoveSpeed;
        this._sdtComboState = null;
        this._sinStingerState = null;
        this._judgmentState = null;
      }
    } else if (this.devilTriggerCooldown > 0) {
      this.devilTriggerCooldown--;
    }

    syncDanteWeaponSwitch(this, cfg);
  }

  _updateTransientVisualsOnly() {
    updateDanteTransientVfx(this._danteVfx);
    updateDanteWeaponVanishVfx(this._weaponVanishGhosts);
    for (let i = this._shockwaves.length - 1; i >= 0; i--) {
      this._shockwaves[i].life--;
      if (this._shockwaves[i].life <= 0) this._shockwaves.splice(i, 1);
    }
    decayDanteSdtVisualsOnFreeze(this);
  }

  activateDevilTrigger(opponent) { return activateDanteDevilTrigger(this, opponent); }
  startJackpot(opponent) { return startDanteJackpot(this, opponent); }
  startDoppelganger(opponent) { return startDanteDoppelganger(this, opponent); }
  startKalinaAnn(opponent) { return startDanteKalinaAnn(this, opponent); }
  startRoundTrip(opponent) { return startDanteRoundTrip(this, opponent); }
  startDrive(opponent) { return startDanteDrive(this, opponent); }
  startSdtCombo(opponent) { return startDanteSdtCombo(this, opponent); }
  startSinStinger(opponent) { return startDanteSinStinger(this, opponent); }
  startOmbra(opponent) { return startDanteOmbra(this, opponent); }
  startJudgment(opponent) { return startDanteJudgment(this, opponent); }

  _tryCastSkills(opponent, cfg, dist) {
    if (tryCastDanteSdtSkills(this, opponent, cfg, dist)) return true;
    return tryCastDanteSkills(this, opponent, cfg, dist);
  }

  update(opponent, ownerIndex, arena) {
    const cfg = this._cfg();

    // Rule 25: Always decay transient visuals & active projectiles BEFORE freeze guard
    this._updateTransientVisualsOnly();
    updateDanteProjectilesAndSummons(this, opponent, arena);

    // Rule 1 / Section 1.1: Mandatory Freeze & TimeStop Guard
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks(false);
      return;
    }

    this._tickDanteTimers(cfg);
    if (this.hp <= 0) return;

    this.aim(opponent);

    const hostiles = this._getHostileTargets(opponent);
    const primaryTarget = hostiles[0] || opponent;
    const dist = primaryTarget ? Math.hypot(primaryTarget.x - this.x, primaryTarget.y - this.y) : 999;
    const bounds = arena || state.arena || { x: 45, y: 240, width: 450, height: 450 };

    stepDanteBasicGunQueues(this, hostiles, cfg);
    stepDanteMillionStab(this, primaryTarget, cfg);

    if (stepDanteTransformSequence(this, hostiles, cfg)) {
      this.applyMovementPhysics(1.0);
      this.resolveWallBounce(arena, opponent);
      return;
    }

    const sdtBusy = stepDanteSdtSkillTimers(this, hostiles, bounds, opponent, cfg);
    const isChanneling = sdtBusy || processDanteChanneling(this, opponent, cfg);

    if (!isChanneling && primaryTarget) {
      checkDanteSpotDodgeAnticipation(this, primaryTarget, dist, cfg);

      const bladeSpinningOut = Boolean(
        this._roundTripEntity &&
        (this._roundTripEntity.phase === 'spin' || this._roundTripEntity.phase === 'return')
      );

      if (this._comboChainActive && this.slashSwingTimer <= 0 && isSkillEnabled(cfg.enableRebellionCombo, true) && !this._roundTripEntity) {
        this._executeRebellionCleave(primaryTarget, cfg);
      } else if (
        bladeSpinningOut &&
        this.slashSwingTimer <= 0 &&
        this._gunSequenceTimer <= 0 &&
        isSkillEnabled(cfg.enableGunfire, true) &&
        this.gunCooldown <= 0 &&
        this._gunBurstQueue <= 0
      ) {
        this.gunCooldown = cfg.gunCooldown ?? 68;
        this._gunBurstQueue = Math.max(0, (cfg.gunBurstCount ?? 3) - 1);
        this._gunBurstTick = 6;
        this._fireSingleEbonyIvoryBullet(cfg);
      } else if (this.slashSwingTimer <= 0 && this._gunSequenceTimer <= 0 && !this._tryCastSkills(opponent, cfg, dist)) {
        const reach = (cfg.swordReach ?? 94) + (this.isDevilTrigger ? (cfg.dtSwordReachBonus ?? 14) : 0);
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
    }

    if (this.isStationarySkillActive()) {
      this.vx = 0;
      this.vy = 0;
    }

    // Rule 37: Centralized natural rebound movement & wall bounce
    super.update(opponent, ownerIndex, arena);
  }

  drawBody(ctx) {
    drawDanteSkin(ctx, this);
  }

  _drawShockwaves(ctx) {
    drawDantePixelShockwaves(ctx, this._shockwaves);
  }

  draw(ctx, opponent) {
    if (!ctx || this.hp <= 0) return;

    if (this._doppelganger) {
      const dg = this._doppelganger;
      ctx.save();
      ctx.globalAlpha = 0.56;
      drawDanteSkin(ctx, {
        ...this,
        x: dg.x,
        y: dg.y,
        z: 0,
        gunAngle: dg.angle,
        isDevilTrigger: true,
        hideHands: false,
      });
      ctx.restore();
    }

    if (this._dtTornado) {
      const tor = this._dtTornado;
      const fIdx = Math.floor((96 - tor.life) / 3) % 7;
      drawDanteSprite(ctx, 'dtTornado', tor.x, tor.y, 0, tor.radius * 2.15, tor.radius * 2.0, fIdx, 0.85);
    }

    if (this.isDevilTrigger) {
      drawDanteDtAura(ctx, this.x, this.y - (this.z || 0), this.r || 30, 0.84);
    }

    drawDanteSdtBackVfx(ctx, this);
    drawDanteTransientVfx(ctx, this._danteVfx, 'back', this);

    this.drawBody(ctx);
    if (typeof drawFighterInkOutline === 'function') {
      drawFighterInkOutline(ctx, this);
    }

    drawDanteWeaponVanishVfx(ctx, this._weaponVanishGhosts);
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

    if (this._jackpotFireTimer > 0) {
      const cfg = this._cfg();
      const ang = this._jackpotLockedAngle;
      const px = -Math.sin(ang) * 14;
      const py = Math.cos(ang) * 14;
      drawDanteJackpotBeam(ctx, this.x + px, this.y + py, ang, 620, (cfg.jackpotWidth ?? 60) * 0.72);
      drawDanteJackpotBeam(ctx, this.x - px, this.y - py, ang, 620, (cfg.jackpotWidth ?? 60) * 0.72);
    }

    drawDanteTransformSequenceVfx(ctx, this);
    drawDanteSdtVfx(ctx, this);
    drawDanteTransientVfx(ctx, this._danteVfx, 'front', this);
    this._drawShockwaves(ctx);

    // Rule 21: Mandatory overhead HP & freeze status rendering on top layer
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }
}
