// ─────────────────────────────────────────────────────────────────────────────
// DANTE FIGHTER ENTITY CLASS
// Devil May Cry — The Legendary Devil Hunter (Jump Force MUGEN V14 Port)
// ─────────────────────────────────────────────────────────────────────────────

import { Fighter, applyDamageToTarget, isSkillEnabled } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { state, spawnFloatingText, triggerGlobalScreenShake } from '../../core/state.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { spawnSparks, spawnImpactFlash } from '../../graphics/particles/sparkEffect.js';
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
} from '../../graphics/weapons/danteWeaponGraphics.js';

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

  reset() {
    super.reset();
    const cfg = CONFIG.dante || {};
    this.swordCooldown = 0;
    this.slashSwingTimer = 0;
    this.slashSwingMaxTimer = 36;
    this.slashDir = 1;
    this.slashMoveType = 'cleave_right';
    this.comboStep = 0;
    this._comboChainActive = false;
    this._millionStabTimer = 0;
    this._millionStabTick = 0;
    this._millionStabFinisherDelay = 0;
    this._millionStabHitLanded = false;
    this._comboHitLanded = false;
    this._highTimeHopTimer = 0;
    this.critChance = cfg.critChance ?? 0.22;
    this.critMultiplier = cfg.critMultiplier ?? 1.75;
    this._critComboStacks = 0;

    this.gunCooldown = Math.round((cfg.gunCooldown ?? 68) * 0.45);
    this._gunBurstQueue = 0;
    this._gunBurstTick = 0;
    this._gunVisualTimer = 0;
    this._bullets = [];

    this.roundTripCooldown = Math.round((cfg.roundTripCooldown ?? 300) * 0.40);
    this._roundTripEntity = null;

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
    this._comboHitLanded = false;
    this._pendingGunSequence = false;
    this._gunSequenceTimer = 0;
    this._gunSequenceTick = 0;
    this._weaponVanishGhosts = [];
  }

  /**
   * Rule 23: Suppresses base Fighter bullet projectile auto-fire; Dante uses Ebony & Ivory bursts.
   */
  shoot(ownerIndex) {
    // Intentionally empty (Rule 23)
  }

  /**
   * Pre-warms Dante's MUGEN VFX strips behind the loading curtain (Rule 35).
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
    this.z = 0;
    if (forceCancelAll) {
      this._danteVfx.length = 0;
      this._shockwaves.length = 0;
      this._weaponVanishGhosts.length = 0;
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
    if (this._driveChargeTimer > 0 || this._kalinaCastTimer > 0 || this._jackpotTimer > 0 || this._jackpotFireTimer > 0) {
      return false;
    }
    return super.canAim();
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

  /**
   * Evaluates critical hit probability and multiplied damage for Dante's basic attacks (Rebellion & Ebony/Ivory).
   */
  evaluateBasicCrit(rawDmg = 0, opts = {}) {
    const cfg = CONFIG.dante || {};
    if (!isSkillEnabled(cfg.enableBasicCrit, true)) {
      return { damage: rawDmg, isCrit: false, critChance: 0, critMultiplier: 1.0 };
    }
    const baseChance = cfg.critChance ?? 0.22;
    const stackBonus = (this._critComboStacks || 0) * (cfg.critChancePerBasicHit ?? 0.04);
    const dtBonus = this.isDevilTrigger ? (cfg.dtCritChanceBonus ?? 0.15) : 0;
    const finisherChance = cfg.finisherCritChance ?? 1.0;
    const isGuaranteedFinisher = Boolean(opts.isFinisher && finisherChance >= 1.0);
    const finisherBonus = opts.isFinisher ? (cfg.finisherCritBonus ?? 0.15) : 0;
    const maxChance = Math.max(baseChance, opts.isFinisher ? finisherChance : 0, cfg.maxCritChance ?? 0.65);
    const critChance = isGuaranteedFinisher
      ? 1.0
      : Math.max(0, Math.min(maxChance, baseChance + stackBonus + dtBonus + finisherBonus));
    const critMultiplier = Math.max(1.0, cfg.critMultiplier ?? 1.75);
    const isCrit = Boolean(opts.forceCrit || isGuaranteedFinisher || (critChance > 0 && Math.random() < critChance));
    this.critChance = critChance;
    this.critMultiplier = critMultiplier;
    const damage = isCrit ? Math.max(1, Math.round(rawDmg * critMultiplier)) : rawDmg;
    return { damage, isCrit, critChance, critMultiplier };
  }

  _recordBasicHitOutcome(isCrit) {
    if (isCrit) {
      this._critComboStacks = 0;
    } else {
      this._critComboStacks = Math.min(25, (this._critComboStacks || 0) + 1);
    }
  }

  _triggerBasicCritVfx(enemy, angle = 0, isFinisher = false) {
    spawnSparks(enemy.x, enemy.y, isFinisher ? 18 : 12, 'crimson', '#FBBF24');
    spawnImpactFlash(enemy.x, enemy.y, isFinisher ? 34 : 24, '#EF4444');
    this._spawnRipple(enemy.x, enemy.y, isFinisher ? 68 : 48, '#FBBF24');
    triggerGlobalScreenShake?.(isFinisher ? 9.5 : 5.5, isFinisher ? 11 : 7);
    if (isFinisher) {
      this._spawnVfx('slashArc', enemy.x, enemy.y, angle, 96, 54, 12, 0.94);
    }
  }

  _dealBasicAttackDamage(target, rawDmg, opts = {}) {
    const critRes = opts.preRolledCrit || this.evaluateBasicCrit(rawDmg, opts);
    const isCrit = Boolean(critRes.isCrit);
    const dealt = this._dealDamage(target, critRes.damage, {
      ...opts,
      isCrit,
      isCritical: isCrit,
    });
    if (dealt > 0) {
      this._recordBasicHitOutcome(isCrit);
      if (isCrit) {
        this._triggerBasicCritVfx(target, opts.angle ?? this.gunAngle ?? 0, Boolean(opts.isFinisher));
      }
    }
    return { dealt, isCrit };
  }

  _isMillionStabStationary() {
    return Boolean(this._millionStabTimer > 0 || this._millionStabFinisherDelay > 0);
  }

  isStationarySkillActive() {
    return Boolean(
      this._isMillionStabStationary() ||
      this._jackpotTimer > 0 ||
      this._jackpotFireTimer > 0 ||
      super.isStationarySkillActive?.()
    );
  }

  _executeMillionStabFinisher(opponent, cfg) {
    const activeCfg = cfg || CONFIG.dante || {};
    const aimAng = this.gunAngle || 0;
    const reach = (activeCfg.swordReach ?? 94) +
      (this.isDevilTrigger ? (activeCfg.dtSwordReachBonus ?? 14) : 0) +
      (activeCfg.millionStabReachBonus ?? 22) + 14;
    // Physically lunge forward as Dante delivers the Thrust Finisher
    const finisherLungeSpd = activeCfg.millionStabFinisherLunge ?? 10.5;
    this.vx = Math.cos(aimAng) * finisherLungeSpd;
    this.vy = Math.sin(aimAng) * finisherLungeSpd;
    this._playSfx('heavyBlast');
    this._playSfx('swordSlash');
    this._spawnRipple(this.x + Math.cos(aimAng) * 42, this.y + Math.sin(aimAng) * 42, 62, '#EF4444');
    this._spawnVfx('slashArc', this.x + Math.cos(aimAng) * 48, this.y + Math.sin(aimAng) * 48, aimAng, 110, 48, 12, 0.96);
    triggerGlobalScreenShake?.(7.5, 10);

    const finisherDmg = activeCfg.millionStabFinisherDamage ?? Math.max(12, Math.round((activeCfg.swordDamage ?? 21) * 0.85));
    const finisherKb = activeCfg.millionStabFinisherKnockback ?? 14.5;
    const finisherStun = activeCfg.millionStabFinisherStunFrames ?? 16;
    let finisherLanded = false;
    for (const enemy of this._getHostileTargets(opponent)) {
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      if (Math.hypot(dx, dy) <= reach + (enemy.r || 28)) {
        const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - aimAng), Math.cos(Math.atan2(dy, dx) - aimAng)));
        if (diff <= 0.72) {
          const { dealt } = this._dealBasicAttackDamage(enemy, finisherDmg, {
            angle: aimAng,
            isMelee: true,
            isHeavy: true,
            isFinisher: true,
            isKnockback: true,
            knockbackForce: finisherKb,
          });
          if (dealt > 0) {
            finisherLanded = true;
            this._comboHitLanded = true;
            const kbAng = (dx !== 0 || dy !== 0) ? Math.atan2(dy, dx) : aimAng;
            // Clear prior Million Stab time-stop so the enemy isn't pinned frozen and actually flies back from knockback
            if (typeof enemy.clearTimeStop === 'function') enemy.clearTimeStop();
            else enemy.timeStopTimer = 0;
            if (finisherStun > 0) {
              if (typeof enemy.applyHitStun === 'function') enemy.applyHitStun(finisherStun);
              else enemy.hitStunTimer = Math.max(enemy.hitStunTimer || 0, finisherStun);
            }
            if (typeof enemy.applyKnockback === 'function') {
              enemy.applyKnockback(Math.cos(kbAng) * finisherKb, Math.sin(kbAng) * finisherKb, finisherStun);
            }
            enemy.vx = Math.cos(kbAng) * finisherKb * 0.7;
            enemy.vy = Math.sin(kbAng) * finisherKb * 0.7;
          }
        }
      }
    }
    if (finisherLanded) {
      triggerGlobalScreenShake?.(
        activeCfg.millionStabFinisherShake ?? 9.5,
        activeCfg.millionStabFinisherShakeFrames ?? 12
      );
    }
  }

  _applyMillionStabThrustHit(enemy, rawDmg, aimAng, dx, dy, cfg) {
    const activeCfg = cfg || CONFIG.dante || {};
    const kb = activeCfg.millionStabThrustKnockback ?? 2.6;
    const stunFrames = activeCfg.millionStabThrustStunFrames ?? 12;
    const { dealt } = this._dealBasicAttackDamage(enemy, rawDmg, {
      angle: aimAng,
      isMelee: true,
      isKnockback: true,
      knockbackForce: kb,
      skipInterrupt: true,
    });
    if (dealt <= 0) return 0;
    this._millionStabHitLanded = true;
    this._comboHitLanded = true;
    triggerGlobalScreenShake?.(
      activeCfg.millionStabThrustShake ?? 3.8,
      activeCfg.millionStabThrustShakeFrames ?? 5
    );
    const kbAng = (dx !== 0 || dy !== 0) ? Math.atan2(dy, dx) : aimAng;
    if (stunFrames > 0) {
      if (typeof enemy.applyTimeStop === 'function') {
        enemy.applyTimeStop(stunFrames);
      }
      if (typeof enemy.applyHitStun === 'function') {
        enemy.applyHitStun(stunFrames);
      } else {
        enemy.hitStunTimer = Math.max(enemy.hitStunTimer || 0, stunFrames);
      }
    }
    if (typeof enemy.applyKnockback === 'function') {
      enemy.applyKnockback(Math.cos(kbAng) * kb, Math.sin(kbAng) * kb, stunFrames);
    } else {
      enemy.vx = (enemy.vx || 0) + Math.cos(kbAng) * kb;
      enemy.vy = (enemy.vy || 0) + Math.sin(kbAng) * kb;
    }
    // Nudge enemy slightly along thrust vector so small knockback is visible even while stunned
    const arena = (typeof state !== 'undefined' && state.arena) || { x: 45, y: 240, width: 450, height: 450 };
    const pad = (enemy.r || 28) + 4;
    if (typeof enemy.x === 'number' && typeof enemy.y === 'number') {
      enemy.x = Math.max(arena.x + pad, Math.min(arena.x + arena.width - pad, enemy.x + Math.cos(kbAng) * 3.2));
      enemy.y = Math.max(arena.y + pad, Math.min(arena.y + arena.height - pad, enemy.y + Math.sin(kbAng) * 3.2));
    }
    return dealt;
  }

  applyHitStun(duration) {
    if (this.isSpotDodging && this._spotDodgeTimer > 0) return;
    return super.applyHitStun(duration);
  }

  _isPerformingMillionStab() {
    return Boolean(
      this._millionStabTimer > 0 ||
      this._millionStabFinisherDelay > 0 ||
      (this.slashSwingTimer > 0 && this.slashMoveType === 'million_stab')
    );
  }

  /**
   * Prevents physics.js post-kill cleanup from cutting off Million Stab (or active finishers) when the enemy dies mid-animation.
   */
  hasActiveFinishingAbility() {
    return Boolean(
      this._isPerformingMillionStab() ||
      this.slashSwingTimer > 0 ||
      this._jackpotTimer > 0 ||
      this._jackpotFireTimer > 0
    );
  }

  _isSpotDodgeUnblockable(attacker, opts = {}) {
    if (!opts || typeof opts !== 'object') return false;
    const isInsideGojoDomain = Boolean(
      typeof state !== 'undefined' &&
      state.activeDomain &&
      state.activeDomain.type === 'gojo' &&
      state.activeDomain.owner !== this
    );
    const isGuaranteed = Boolean(
      opts.isRatioCrit || opts.isNanamiPause || opts.undodgeable || opts.isSureKill ||
      opts.isSaitamaCounter || opts.isSaitamaPunch || opts.isSeriousPunch ||
      opts.bypassShield || opts.bypassEvade || opts.isGuaranteedHit ||
      opts.isTojiUltimateAssault || opts.isTojiUltimateFinalBlow || opts.isDivineFlame || opts.isFuga ||
      (attacker && (attacker.characterId === 'saitama' || attacker.type === 'saitama'))
    );
    const isDoTOrDomain = Boolean(
      opts.isDomain || opts.isDomainDPS || opts.isPoison || opts.isBurn || opts.isFlame ||
      opts.fromBlackHole || opts.isPurpleDPS || opts.isHollowPurple
    );
    return isGuaranteed || isInsideGojoDomain || isDoTOrDomain;
  }

  takeDamage(amount, attacker = null, opts = {}) {
    if (opts && opts.isHeal) return super.takeDamage(amount, attacker, opts);
    const cfg = CONFIG.dante || {};

    // Active Spot Dodge vanish window grants complete untargetable invulnerability
    if (this.isSpotDodging && this._spotDodgeTimer > 0) {
      this.hitFlashTimer = 0;
      this.hitStunTimer = 0;
      return false;
    }

    let adj = Number(amount) || 0;
    if (this.isDevilTrigger && adj > 0) {
      adj = adj * (1 - (cfg.dtDamageReduction ?? 0.15));
    }

    // Spot Dodge trigger: Dante vanishes in a split second & reappears unscathed
    const dodgeEnabled = isSkillEnabled(cfg.enableTricksterDash, true) && isSkillEnabled(cfg.enableSpotDodge, true);
    const dodgeChance = this.isDevilTrigger ? (cfg.dtSpotDodgeChance ?? 1.0) : (cfg.spotDodgeChance ?? 1.0);
    const isStunned = Boolean(
      this._handleTimeStop() ||
      this.isTargetOfAmbush ||
      this.isChainedByMakima ||
      (this.paralyzeTimer || 0) > 0 ||
      (this.electricStunTimer || 0) > 0
    );

    if (
      adj > 0 &&
      dodgeEnabled &&
      this.tricksterCooldown <= 0 &&
      !this._isPerformingMillionStab() &&
      !isStunned &&
      !this._isSpotDodgeUnblockable(attacker, opts) &&
      Math.random() < dodgeChance
    ) {
      const dodged = this._performTricksterDash(opts?.projectile || attacker, cfg);
      if (dodged) {
        this.hitFlashTimer = 0;
        this.hitStunTimer = 0;
        return false;
      }
    }

    return super.takeDamage(adj, attacker, opts);
  }

  receiveDamage(amount, attacker, opts = {}) {
    const applied = this.takeDamage(amount, attacker, opts);
    return applied ? amount : 0;
  }

  onProjectileApproach(projectile, attacker) {
    const cfg = CONFIG.dante || {};
    if (this.hp <= 0 || this.isDead || this._handleTimeStop() || this.isTargetOfAmbush) return;
    if (attacker === this || !this._isHostile(attacker || projectile)) return;
    if (this._isPerformingMillionStab()) return;
    if (this.tricksterCooldown <= 0 && !this.isSpotDodging) {
      this._performTricksterDash(projectile || attacker, cfg);
    }
  }

  _checkSpotDodgeAnticipation(target, dist, cfg) {
    if (!target || this.hp <= 0 || this.isDead || this.isSpotDodging || this.tricksterCooldown > 0) return false;
    if (this._isPerformingMillionStab()) return false;
    if (!isSkillEnabled(cfg.enableTricksterDash, true) || !isSkillEnabled(cfg.enableSpotDodge, true)) return false;
    const threatRadius = (this.r || 30) + (target.r || 30) + 65;
    if (dist > threatRadius) return false;
    const enemySwinging = Boolean(
      target.isSlashing ||
      (target.slashSwingTimer || 0) > 0 ||
      (target.punchAnimTimer || 0) > 0 ||
      (target.katanaSlashTimer || 0) > 0 ||
      (target.cleaveSwingTimer || 0) > 0 ||
      (target.meleeSwingTimer || 0) > 0 ||
      (target.spearSwingTimer || 0) > 0
    );
    if (enemySwinging) {
      return this._performTricksterDash(target, cfg);
    }
    return false;
  }

  _performTricksterDash(threat, cfg) {
    const activeCfg = cfg || CONFIG.dante || {};
    if (!isSkillEnabled(activeCfg.enableTricksterDash, true) || !isSkillEnabled(activeCfg.enableSpotDodge, true)) return false;
    if (this._isPerformingMillionStab()) return false;

    this.tricksterCooldown = activeCfg.tricksterCooldown ?? 75;
    this._spotDodgeOriginX = this.x;
    this._spotDodgeOriginY = this.y;
    this._spotDodgeMaxTimer = activeCfg.spotDodgeDuration ?? 18;
    this._spotDodgeTimer = this._spotDodgeMaxTimer;
    this.trickPhaseTimer = this._spotDodgeMaxTimer;
    this.suppressInkOutline = true;
    this.suppressFloorShadow = true;
    this.hideHpText = true;
    this.isSpotDodging = true;

    const arena = state.arena || { x: 45, y: 240, width: 450, height: 450 };
    let awayAngle = (this.gunAngle || 0) + Math.PI * 0.5;
    if (threat && typeof threat.x === 'number' && typeof threat.y === 'number') {
      this._lastDodgeSide = !this._lastDodgeSide;
      const sideSign = this._lastDodgeSide ? 1 : -1;
      awayAngle = Math.atan2(this.y - threat.y, this.x - threat.x) + sideSign * 1.15;
    }
    const shift = activeCfg.tricksterDistance ?? 12;
    const pad = (this.r || 30) + 6;
    this.x = Math.max(arena.x + pad, Math.min(arena.x + arena.width - pad, this.x + Math.cos(awayAngle) * shift));
    this.y = Math.max(arena.y + pad, Math.min(arena.y + arena.height - pad, this.y + Math.sin(awayAngle) * shift));

    // Spawn Spot Dodge VFX (16-bit dark black-umber smoke apparition with upward forked tendrils from dodge spot.mp4)
    const vfxSize = (this.r || 30) * 3.8;
    this._spawnVfx('spotDodge', this._spotDodgeOriginX, this._spotDodgeOriginY - (this.r || 30) * 0.18, 0, vfxSize, vfxSize, this._spotDodgeMaxTimer + 2, 0.98);
    this._playSfx('trickVanish');
    spawnFloatingText(
      this._spotDodgeOriginX,
      this._spotDodgeOriginY - (this.r || 30) - 18,
      activeCfg.spotDodgeText || 'MISS!',
      activeCfg.spotDodgeTextColor || '#FFFFFF'
    );
    if (threat && typeof threat.x === 'number' && typeof threat.y === 'number' && !threat.isProjectile) {
      this.aim(threat);
    }
    return true;
  }

  _tickDanteTimers(cfg) {
    if (this.swordCooldown > 0) this.swordCooldown--;
    // Base Fighter.update() decrements slashSwingTimer when super.update() runs; only tick here while stationary
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
    if (this.roundTripCooldown > 0) this.roundTripCooldown--;
    if (this.driveCooldown > 0) this.driveCooldown--;
    if (this.doppelgangerCooldown > 0) this.doppelgangerCooldown--;
    if (this.kalinaCooldown > 0) this.kalinaCooldown--;
    if (this.tricksterCooldown > 0) this.tricksterCooldown--;
    if (this._weaponSwitchTimer > 0) this._weaponSwitchTimer--;
    if (this.weaponSwitchCooldown > 0) this.weaponSwitchCooldown--;
    if (this._gunSequenceTimer > 0) {
      this._gunSequenceTimer--;
      this._gunVisualTimer = Math.max(this._gunVisualTimer || 0, this._gunSequenceTimer);
    }

    if (this.isDevilTrigger) {
      this.devilTriggerTimer--;
      // Rule 27: Subtle DT healthbar replenishment (no arena floating text)
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
    } else if (this.devilTriggerCooldown > 0) {
      this.devilTriggerCooldown--;
    }
  }

  _syncWeaponSwitch(cfg) {
    const activeCfg = cfg || CONFIG.dante || {};
    const targetMode = (
      (this._gunVisualTimer || 0) > 0 ||
      Boolean(this._roundTripEntity) ||
      (this._jackpotTimer || 0) > 0 ||
      (this._jackpotFireTimer || 0) > 0
    ) ? 'guns' : 'rebellion';

    if (targetMode === this._weaponMode) return false;
    const fromMode = this._weaponMode || 'rebellion';
    this._weaponMode = targetMode;
    this._weaponSwitchFrom = fromMode;
    this._weaponSwitchTo = targetMode;
    const swFrames = Math.max(6, activeCfg.weaponSwitchFrames ?? 14);
    const vanishFrames = swFrames + 4;
    const switchCd = Math.max(0, activeCfg.weaponSwitchCooldown ?? 18);
    this._weaponSwitchMaxTimer = swFrames;
    this._weaponSwitchTimer = swFrames;
    this.weaponSwitchCooldown = switchCd;
    if (targetMode === 'rebellion') {
      this.gunCooldown = Math.max(this.gunCooldown || 0, switchCd);
      this.swordCooldown = Math.max(this.swordCooldown || 0, swFrames);
    } else {
      this.swordCooldown = Math.max(this.swordCooldown || 0, swFrames);
    }

    const r = this.r || 30;
    const angle = this.gunAngle !== undefined ? this.gunAngle : (this.angle || 0);
    const normAng = Math.atan2(Math.sin(angle), Math.cos(angle));
    const facingLeft = Math.abs(normAng) > Math.PI / 2;
    const phys = this._danteHandPhys;
    this._weaponVanishGhosts.push({
      kind: fromMode,
      x: this.x || 0,
      y: (this.y || 0) - (this.z || 0),
      r,
      angle,
      facingLeft,
      swingAngle: phys?.ang ?? 0,
      mainX: phys?.mx ?? (r * 0.82),
      mainY: phys?.my ?? (r * 0.38),
      offX: phys?.ox ?? (-r * 0.82),
      offY: phys?.oy ?? (r * 0.38),
      isDT: Boolean(this.isDevilTrigger),
      life: vanishFrames,
      maxLife: vanishFrames,
    });
    if (this._weaponVanishGhosts.length > 4) {
      this._weaponVanishGhosts.shift();
    }
    return true;
  }

  _updateTransientVisualsOnly() {
    updateDanteTransientVfx(this._danteVfx);
    updateDanteWeaponVanishVfx(this._weaponVanishGhosts);
    for (let i = this._shockwaves.length - 1; i >= 0; i--) {
      this._shockwaves[i].life--;
      if (this._shockwaves[i].life <= 0) this._shockwaves.splice(i, 1);
    }
  }

  _updateProjectilesAndSummons(opponent, arena) {
    const cfg = CONFIG.dante || {};
    const hostiles = this._getHostileTargets(opponent);
    const bounds = arena || state.arena || { x: 45, y: 240, width: 450, height: 450 };

    // 1. Ebony & Ivory gunfire tracers
    for (let i = this._bullets.length - 1; i >= 0; i--) {
      const b = this._bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;
      let hit = false;
      for (let h = 0; h < hostiles.length; h++) {
        const enemy = hostiles[h];
        if (Math.hypot(enemy.x - b.x, enemy.y - b.y) <= (enemy.r || 28) + 8) {
          this._dealBasicAttackDamage(enemy, b.damage, {
            angle: b.angle,
            knockback: b.isCrit ? 5.5 : 3.5,
            isProjectile: true,
            isGun: true,
            preRolledCrit: { damage: b.damage, isCrit: Boolean(b.isCrit) },
          });
          this._spawnVfx('explosion', b.x, b.y, b.angle, b.isCrit ? 48 : 38, b.isCrit ? 48 : 38, 10, b.isCrit ? 0.95 : 0.85);
          hit = true;
          break;
        }
      }
      if (hit || b.life <= 0 || b.x < bounds.x || b.x > bounds.x + bounds.width || b.y < bounds.y || b.y > bounds.y + bounds.height) {
        this._bullets.splice(i, 1);
      }
    }

    // 2. Round Trip spinning Rebellion boomerang (Statedef 1000/1005)
    if (this._roundTripEntity) {
      const rt = this._roundTripEntity;
      rt.spinAngle += 0.42;
      if (rt.phase === 'out') {
        rt.x += rt.vx;
        rt.y += rt.vy;
        rt.travelDist += Math.hypot(rt.vx, rt.vy);
        if (rt.travelDist >= rt.maxDist || rt.x < bounds.x + 15 || rt.x > bounds.x + bounds.width - 15 || rt.y < bounds.y + 15 || rt.y > bounds.y + bounds.height - 15) {
          rt.phase = 'spin';
        } else {
          for (const enemy of hostiles) {
            if (Math.hypot(enemy.x - rt.x, enemy.y - rt.y) <= (enemy.r || 28) + 34) {
              rt.phase = 'spin';
              break;
            }
          }
        }
      } else if (rt.phase === 'spin') {
        rt.holdTimer--;
        if (rt.hitTick <= 0 && rt.hitsLeft > 0) {
          for (const enemy of hostiles) {
            if (Math.hypot(enemy.x - rt.x, enemy.y - rt.y) <= (enemy.r || 28) + 48) {
              this._dealDamage(enemy, cfg.roundTripDamage ?? 14, { knockback: 2.0 });
              // Slight inward vortex toward spinning blade
              const pull = Math.atan2(rt.y - enemy.y, rt.x - enemy.x);
              enemy.vx = (enemy.vx || 0) * 0.6 + Math.cos(pull) * 2.5;
              enemy.vy = (enemy.vy || 0) * 0.6 + Math.sin(pull) * 2.5;
            }
          }
          rt.hitTick = 10;
          rt.hitsLeft--;
        } else {
          rt.hitTick--;
        }
        if (rt.holdTimer <= 0) rt.phase = 'return';
      } else {
        const retAng = Math.atan2(this.y - rt.y, this.x - rt.x);
        const spd = (cfg.roundTripSpeed ?? 10.5) * 1.25;
        rt.x += Math.cos(retAng) * spd;
        rt.y += Math.sin(retAng) * spd;
        if (Math.hypot(this.x - rt.x, this.y - rt.y) <= (this.r || 30) + 18 || --rt.safetyTimer <= 0) {
          this._roundTripEntity = null;
        }
      }
    }

    // 3. Drive Crimson Slash Waves (Statedef 1220)
    for (let i = this._driveWaves.length - 1; i >= 0; i--) {
      const w = this._driveWaves[i];
      w.x += w.vx;
      w.y += w.vy;
      w.life--;
      for (const enemy of hostiles) {
        if (!w.hitSet.has(enemy) && Math.hypot(enemy.x - w.x, enemy.y - w.y) <= (enemy.r || 28) + 46) {
          w.hitSet.add(enemy);
          this._dealDamage(enemy, cfg.driveDamage ?? 30, { angle: w.angle, knockback: 11, hitStun: 18 });
          this._spawnVfx('slashArc', enemy.x, enemy.y, w.angle, 94, 62, 12, 0.92);
        }
      }
      if (w.life <= 0 || w.x < bounds.x - 40 || w.x > bounds.x + bounds.width + 40 || w.y < bounds.y - 40 || w.y > bounds.y + bounds.height + 40) {
        this._driveWaves.splice(i, 1);
      }
    }

    // 4. Kalina Ann Rockets (Statedef 1450/1470)
    for (let i = this._rockets.length - 1; i >= 0; i--) {
      const rkt = this._rockets[i];
      rkt.x += rkt.vx;
      rkt.y += rkt.vy;
      rkt.life--;
      let detonate = rkt.life <= 0 ||
        rkt.x < bounds.x + 10 || rkt.x > bounds.x + bounds.width - 10 ||
        rkt.y < bounds.y + 10 || rkt.y > bounds.y + bounds.height - 10;
      if (!detonate) {
        for (const enemy of hostiles) {
          if (Math.hypot(enemy.x - rkt.x, enemy.y - rkt.y) <= (enemy.r || 28) + 20) {
            detonate = true;
            break;
          }
        }
      }
      if (detonate) {
        const boomR = cfg.kalinaExplosionRadius ?? 86;
        this._playSfx('explosion');
        triggerGlobalScreenShake?.(8, 10);
        this._spawnVfx('explosion', rkt.x, rkt.y, 0, boomR * 1.8, boomR * 1.8, 22, 0.96);
        this._spawnRipple(rkt.x, rkt.y, boomR * 1.15, '#EF4444');
        for (const enemy of hostiles) {
          if (Math.hypot(enemy.x - rkt.x, enemy.y - rkt.y) <= boomR + (enemy.r || 28)) {
            const kAng = Math.atan2(enemy.y - rkt.y, enemy.x - rkt.x);
            this._dealDamage(enemy, cfg.kalinaRocketDamage ?? 36, { angle: kAng, knockback: 12, guardBreak: true, hitStun: 18 });
          }
        }
        this._rockets.splice(i, 1);
      }
    }

    // 5. Doppelganger Shadow Clone (Statedef 1300 / Helper 1350)
    if (this._doppelganger) {
      const dg = this._doppelganger;
      dg.life--;
      if (dg.slashCooldown > 0) dg.slashCooldown--;
      const target = hostiles[0];
      if (target) {
        const dx = target.x - dg.x;
        const dy = target.y - dg.y;
        const dist = Math.hypot(dx, dy);
        dg.angle = Math.atan2(dy, dx);
        if (dist > 56) {
          const spd = cfg.doppelgangerSpeed ?? 5.8;
          dg.x += Math.cos(dg.angle) * spd;
          dg.y += Math.sin(dg.angle) * spd;
        }
        if (dist <= 92 && dg.slashCooldown <= 0) {
          dg.slashCooldown = 26;
          this._playSfx('swordSlash');
          triggerGlobalScreenShake?.(2.8, 4);
          this._spawnVfx('slashArc', (dg.x + target.x) * 0.5, (dg.y + target.y) * 0.5, dg.angle, 92, 60, 12, 0.85, Math.random() > 0.5);
          this._dealDamage(target, cfg.doppelgangerDamage ?? 14, { angle: dg.angle, knockback: 5 });
        }
      }
      if (dg.life <= 0) {
        this._spawnRipple(dg.x, dg.y, 48, '#7F1D1D');
        this._doppelganger = null;
      }
    }

    // 6. Devil Trigger Crimson Vortex Tornado (Statedef 3670)
    if (this._dtTornado) {
      const tor = this._dtTornado;
      tor.life--;
      tor.x = this.x;
      tor.y = this.y;
      tor.tick--;
      if (tor.tick <= 0) {
        tor.tick = 14;
        for (const enemy of hostiles) {
          const dist = Math.hypot(enemy.x - tor.x, enemy.y - tor.y);
          if (dist <= tor.radius + (enemy.r || 28)) {
            const pull = Math.atan2(tor.y - enemy.y, tor.x - enemy.x);
            enemy.vx = (enemy.vx || 0) * 0.4 + Math.cos(pull) * 4.5;
            enemy.vy = (enemy.vy || 0) * 0.4 + Math.sin(pull) * 4.5;
            this._dealDamage(enemy, cfg.dtTornadoDamage ?? 12, { knockback: 2.5, guardBreak: true });
          }
        }
      }
      if (tor.life <= 0) this._dtTornado = null;
    }
  }

  _executeRebellionCleave(opponent, cfg) {
    const activeCfg = cfg || CONFIG.dante || {};
    if (!isSkillEnabled(activeCfg.enableRebellionCombo, true)) return;
    if (opponent) this.aim(opponent);

    const millionEnabled = isSkillEnabled(activeCfg.enableMillionStab, true);
    const highTimeEnabled = isSkillEnabled(activeCfg.enableHighTime, true);
    const MOVE_TYPES = ['cleave_right', 'cleave_return', 'million_stab', 'high_time'];
    const cleaveDur = Math.max(10, activeCfg.cleaveFrames ?? 28);
    const MOVE_DURATIONS = [
      cleaveDur,
      cleaveDur,
      Math.max(18, activeCfg.millionStabFrames ?? 56),
      Math.max(12, activeCfg.highTimeFrames ?? 36),
    ];

    let step = this.comboStep % 4;
    if (step === 2 && !millionEnabled) step = highTimeEnabled ? 3 : 0;
    else if (step === 3 && !highTimeEnabled) step = 0;

    this.slashMoveType = MOVE_TYPES[step];
    this.slashSwingMaxTimer = MOVE_DURATIONS[step];
    this.slashSwingTimer = this.slashSwingMaxTimer;
    this.slashDir = (step === 1 || step === 3) ? -1 : 1;
    this._gunVisualTimer = 0;
    this._syncWeaponSwitch(activeCfg);
    if (step === 0) this._comboHitLanded = false;

    const hasNextStage =
      (step === 0) ||
      (step === 1 && (millionEnabled || highTimeEnabled)) ||
      (step === 2 && highTimeEnabled);
    if (hasNextStage) {
      this._comboChainActive = true;
      this._pendingGunSequence = false;
      this.swordCooldown = 0;
      this.comboStep = (step + 1) % 4;
    } else {
      this._comboChainActive = false;
      this._pendingGunSequence = false;
      this.swordCooldown = Math.max(
        activeCfg.swordCooldown ?? 22,
        this.slashSwingMaxTimer + (activeCfg.comboPostFinisherCooldownPad ?? 14)
      );
      this.comboStep = 0;
    }

    const aimAng = this.gunAngle || 0;
    const reach = (activeCfg.swordReach ?? 94) +
      (this.isDevilTrigger ? (activeCfg.dtSwordReachBonus ?? 14) : 0) +
      (step === 2 ? (activeCfg.millionStabReachBonus ?? 22) : (activeCfg.cleaveReachBonus ?? 6));
    const halfArc = ((activeCfg.swordArcDeg ?? 135) * Math.PI / 180) * (step === 2 ? 0.42 : 0.62);
    const hostiles = this._getHostileTargets(opponent);

    // Plant feet during Million Stab flurry & wind-up; let normal cleaves keep natural arena bounce momentum
    if (step === 2) {
      this.vx = 0;
      this.vy = 0;
    }

    this._playSfx('swordSlash');

    if (step === 2) {
      // Stage 3: Million Stab rapid multi-hit thrust flurry -> wind-up -> Thrust Finisher
      this._millionStabTimer = Math.max(8, activeCfg.millionStabFlurryFrames ?? 28);
      this._millionStabTick = Math.max(1, (activeCfg.millionStabTickInterval ?? 5) - 1);
      this._millionStabFinisherDelay = 0;
      this._millionStabHitLanded = false;
      triggerGlobalScreenShake?.(3.0, 5);
      spawnFloatingText(this.x, this.y - (this.r || 30) - 18, 'MILLION STAB!', '#EF4444');
    } else {
      this._millionStabTimer = 0;
      this._millionStabFinisherDelay = 0;
      if (step === 3) {
        // Stage 4: High Time rising launcher uppercut
        this._highTimeHopTimer = activeCfg.highTimeHopFrames ?? 20;
        this._playSfx('heavyBlast');
        this._spawnRipple(this.x + Math.cos(aimAng) * 34, this.y + Math.sin(aimAng) * 34, 68, '#EF4444');
        triggerGlobalScreenShake?.(
          activeCfg.highTimeSwingShake ?? 6.5,
          activeCfg.highTimeSwingShakeFrames ?? 9
        );
        spawnFloatingText(this.x, this.y - (this.r || 30) - 18, 'HIGH TIME!', '#FBBF24');
      } else {
        // Stages 1 & 2: Wide Rebellion cross cleaves
        triggerGlobalScreenShake?.(
          activeCfg.cleaveSwingShake ?? 3.2,
          activeCfg.cleaveSwingShakeFrames ?? 5
        );
      }
    }

    const baseSwordDmg = activeCfg.swordDamage ?? 21;
    const stageDamages = [
      baseSwordDmg,
      activeCfg.cleaveReturnDamage ?? Math.max(6, baseSwordDmg - 6),
      activeCfg.millionStabInitialDamage ?? Math.max(6, baseSwordDmg - 6),
      activeCfg.highTimeDamage ?? Math.max(6, baseSwordDmg + 9),
    ];
    const baseDmg = stageDamages[step];
    const kbForce = step === 3 ? (activeCfg.highTimeKnockback ?? 12) : (activeCfg.cleaveKnockback ?? 4.2);
    let cleaveLanded = false;
    for (const enemy of hostiles) {
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= reach + (enemy.r || 28)) {
        const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - aimAng), Math.cos(Math.atan2(dy, dx) - aimAng)));
        if (diff <= halfArc) {
          if (step === 2) {
            this._applyMillionStabThrustHit(enemy, Math.max(6, baseDmg), aimAng, dx, dy, activeCfg);
          } else {
            const { dealt } = this._dealBasicAttackDamage(enemy, Math.max(6, baseDmg), {
              angle: aimAng,
              isMelee: true,
              knockbackForce: kbForce,
              isHeavy: step === 3,
              isFinisher: step === 3,
            });
            if (dealt > 0) {
              cleaveLanded = true;
              this._comboHitLanded = true;
            }
          }
        }
      }
    }
    if (!hasNextStage) {
      this._pendingGunSequence = Boolean(
        isSkillEnabled(activeCfg.enableFinisherGunSequence, true) &&
        this.weaponSwitchCooldown <= 0 &&
        (this._comboHitLanded || cleaveLanded)
      );
    }
    if (cleaveLanded && step !== 2) {
      triggerGlobalScreenShake?.(
        step === 3 ? (activeCfg.highTimeHitShake ?? 8.5) : (activeCfg.cleaveHitShake ?? 5.2),
        step === 3 ? (activeCfg.highTimeHitShakeFrames ?? 11) : (activeCfg.cleaveHitShakeFrames ?? 7)
      );
    }
  }

  _startFinisherGunSequence(cfg) {
    const activeCfg = cfg || CONFIG.dante || {};
    if (!isSkillEnabled(activeCfg.enableFinisherGunSequence, true)) return false;
    const gunDur = Math.max(20, activeCfg.finisherGunDurationFrames ?? 64);
    const swFrames = Math.max(6, activeCfg.weaponSwitchFrames ?? 14);
    this._pendingGunSequence = false;
    this._gunSequenceTimer = gunDur;
    this._gunSequenceTick = Math.min(gunDur - 6, Math.max(4, Math.round(swFrames * 0.65)));
    this._gunVisualTimer = gunDur;
    this.swordCooldown = Math.max(this.swordCooldown || 0, gunDur + swFrames);
    this._syncWeaponSwitch(activeCfg);
    return true;
  }

  _fireSingleEbonyIvoryBullet(cfg, opts = {}) {
    const activeCfg = cfg || CONFIG.dante || {};
    if (!opts.forceSequence && !isSkillEnabled(activeCfg.enableGunfire, true)) return;
    const ang = (this.gunAngle || 0) + (Math.random() - 0.5) * 0.10;
    const spd = activeCfg.gunShotSpeed ?? 16;
    const muzzleDist = (this.r || 30) + 12;
    const baseDmg = activeCfg.gunDamage ?? 8;
    const critRes = this.evaluateBasicCrit(baseDmg, { isGun: true });
    this._bullets.push({
      x: this.x + Math.cos(ang) * muzzleDist,
      y: this.y + Math.sin(ang) * muzzleDist,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      angle: ang,
      damage: critRes.damage,
      isCrit: critRes.isCrit,
      life: 44,
    });
    if (!opts.preserveVisualTimer) {
      this._gunVisualTimer = Math.max(this._gunVisualTimer || 0, 14);
    }
    this._syncWeaponSwitch(activeCfg);
    this._playSfx('gunshot');
  }

  activateDevilTrigger(opponent) {
    const cfg = CONFIG.dante || {};
    if (!isSkillEnabled(cfg.enableDevilTrigger, true)) return;
    if (opponent) this.aim(opponent);
    this.isDevilTrigger = true;
    this.devilTriggerTimer = cfg.devilTriggerDuration ?? 660;
    this.devilTriggerCooldown = cfg.devilTriggerCooldown ?? 1450;
    this._jackpotUsedThisDT = false;
    const mult = cfg.dtSpeedMultiplier ?? 1.32;
    this.speed = this.baseMoveSpeed * mult;
    this.moveSpeed = this.speed;
    this._playSfx('devilTrigger');
    this._playSfx('dtTornado');
    triggerGlobalScreenShake?.(12, 16);
    spawnFloatingText(this.x, this.y - (this.r || 30) - 22, 'DEVIL TRIGGER!', '#EF4444');
    this._spawnRipple(this.x, this.y, 130, '#EF4444');
    this._dtTornado = {
      x: this.x,
      y: this.y,
      radius: cfg.dtTornadoRadius ?? 128,
      life: cfg.dtTornadoDuration ?? 96,
      tick: 2,
    };
  }

  startJackpot(opponent) {
    const cfg = CONFIG.dante || {};
    if (!isSkillEnabled(cfg.enableDevilTrigger, true)) return;
    if (opponent) this.aim(opponent);
    this._jackpotUsedThisDT = true;
    this._jackpotLockedAngle = this.gunAngle || 0;
    this._jackpotTimer = cfg.jackpotChargeFrames ?? 18;
    this._gunVisualTimer = 60;
    this._syncWeaponSwitch(cfg);
    spawnFloatingText(this.x, this.y - (this.r || 30) - 22, 'JACKPOT!', '#FBBF24');
    this._playSfx('heavyBlast');
  }

  startDoppelganger(opponent) {
    const cfg = CONFIG.dante || {};
    if (!isSkillEnabled(cfg.enableDoppelganger, true)) return;
    if (opponent) this.aim(opponent);
    const aimAng = this.gunAngle || 0;
    this.doppelgangerCooldown = cfg.doppelgangerCooldown ?? 620;
    const spawnAng = aimAng + Math.PI * 0.5;
    this._doppelganger = {
      x: this.x + Math.cos(spawnAng) * 44,
      y: this.y + Math.sin(spawnAng) * 44,
      angle: aimAng,
      life: cfg.doppelgangerDuration ?? 270,
      slashCooldown: 10,
    };
    this._playSfx('doppelganger');
    this._spawnRipple(this._doppelganger.x, this._doppelganger.y, 58, '#7F1D1D');
    spawnFloatingText(this.x, this.y - (this.r || 30) - 18, 'DOPPELGANGER', '#EF4444');
  }

  startKalinaAnn(opponent) {
    const cfg = CONFIG.dante || {};
    if (!isSkillEnabled(cfg.enableKalinaAnn, true)) return;
    if (opponent) this.aim(opponent);
    this.kalinaCooldown = cfg.kalinaCooldown ?? 360;
    this._kalinaLockedAngle = this.gunAngle || 0;
    this._kalinaCastTimer = cfg.kalinaWindupFrames ?? 14;
    this._playSfx(this.isDevilTrigger ? 'demonCannon' : 'kalinaFire');
  }

  startRoundTrip(opponent) {
    const cfg = CONFIG.dante || {};
    if (!isSkillEnabled(cfg.enableRoundTrip, true)) return;
    if (opponent) this.aim(opponent);
    const aimAng = this.gunAngle || 0;
    this.roundTripCooldown = cfg.roundTripCooldown ?? 300;
    const spd = cfg.roundTripSpeed ?? 10.5;
    this._roundTripEntity = {
      x: this.x + Math.cos(aimAng) * 28,
      y: this.y + Math.sin(aimAng) * 28,
      vx: Math.cos(aimAng) * spd,
      vy: Math.sin(aimAng) * spd,
      spinAngle: 0,
      travelDist: 0,
      maxDist: 230,
      phase: 'out',
      holdTimer: cfg.roundTripHoldFrames ?? 42,
      hitTick: 0,
      hitsLeft: cfg.roundTripMaxTicks ?? 4,
      safetyTimer: 160,
    };
    this._playSfx('roundTrip');
    this._syncWeaponSwitch(cfg);
    spawnFloatingText(this.x, this.y - (this.r || 30) - 18, 'ROUND TRIP', '#EF4444');
  }

  startDrive(opponent) {
    const cfg = CONFIG.dante || {};
    if (!isSkillEnabled(cfg.enableDrive, true)) return;
    if (opponent) this.aim(opponent);
    this.driveCooldown = cfg.driveCooldown ?? 270;
    this._driveLockedAngle = this.gunAngle || 0;
    this._driveChargeTimer = cfg.driveChargeFrames ?? 12;
    this._playSfx('swordSlash');
  }

  _tryCastSkills(opponent, cfg, dist) {
    if (isSkillEnabled(cfg.enableDevilTrigger, true) && !this.isDevilTrigger && this.devilTriggerCooldown <= 0) {
      const hpRatio = this.hp / Math.max(1, this.maxHp);
      if (hpRatio <= (cfg.devilTriggerHpThreshold ?? 0.55) || Math.random() < 0.02) {
        this.activateDevilTrigger(opponent);
        return true;
      }
    }
    if (isSkillEnabled(cfg.enableDevilTrigger, true) && this.isDevilTrigger && !this._jackpotUsedThisDT && this.devilTriggerTimer <= (cfg.devilTriggerDuration ?? 660) - 65 && dist < 420) {
      this.startJackpot(opponent);
      return true;
    }
    if (isSkillEnabled(cfg.enableDoppelganger, true) && this.doppelgangerCooldown <= 0 && !this._doppelganger) {
      this.startDoppelganger(opponent);
      return true;
    }
    if (isSkillEnabled(cfg.enableKalinaAnn, true) && this.kalinaCooldown <= 0 && dist > 65) {
      this.startKalinaAnn(opponent);
      return true;
    }
    if (isSkillEnabled(cfg.enableRoundTrip, true) && this.roundTripCooldown <= 0 && !this._roundTripEntity && dist >= 75) {
      this.startRoundTrip(opponent);
      return true;
    }
    if (isSkillEnabled(cfg.enableDrive, true) && this.driveCooldown <= 0) {
      this.startDrive(opponent);
      return true;
    }
    return false;
  }

  _processActiveChanneling(opponent, cfg) {
    if (this._driveChargeTimer > 0) {
      this._driveChargeTimer--;
      this.gunAngle = this._driveLockedAngle;
      if (this._driveChargeTimer === 0) {
        const ang = this._driveLockedAngle;
        const spd = cfg.driveSpeed ?? 12.5;
        this._driveWaves.push({
          x: this.x + Math.cos(ang) * 26,
          y: this.y + Math.sin(ang) * 26,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          angle: ang,
          life: 48,
          hitSet: new Set(),
        });
        this._playSfx('heavyBlast');
      }
      return true;
    }

    if (this._kalinaCastTimer > 0) {
      this._kalinaCastTimer--;
      this.gunAngle = this._kalinaLockedAngle;
      if (this._kalinaCastTimer === 0) {
        const baseAng = this._kalinaLockedAngle;
        const spd = cfg.kalinaSpeed ?? 11.2;
        const offsets = this.isDevilTrigger ? [-0.12, 0.12] : [0];
        for (const off of offsets) {
          const ang = baseAng + off;
          this._rockets.push({
            x: this.x + Math.cos(ang) * 28,
            y: this.y + Math.sin(ang) * 28,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            angle: ang,
            life: 62,
          });
        }
        // Recoil opposite committed cast angle (Section 1.4)
        this.vx = -Math.cos(baseAng) * 5.2;
        this.vy = -Math.sin(baseAng) * 5.2;
      }
      return true;
    }

    if (this._jackpotTimer > 0) {
      this._jackpotTimer--;
      this.gunAngle = this._jackpotLockedAngle;
      if (this._jackpotTimer === 0) {
        this._jackpotFireTimer = cfg.jackpotFireFrames ?? 42;
        this._playSfx('jackpotShot');
        triggerGlobalScreenShake?.(14, 18);
        const hostiles = this._getHostileTargets(opponent);
        const beamAng = this._jackpotLockedAngle;
        const beamLen = 620;
        const halfW = (cfg.jackpotWidth ?? 60) * 0.55;
        for (const enemy of hostiles) {
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const proj = dx * Math.cos(beamAng) + dy * Math.sin(beamAng);
          const perp = Math.abs(-dx * Math.sin(beamAng) + dy * Math.cos(beamAng));
          if (proj >= -10 && proj <= beamLen && perp <= halfW + (enemy.r || 28)) {
            this._dealDamage(enemy, cfg.jackpotDamage ?? 54, {
              angle: beamAng,
              knockback: 16,
              hitStun: 24,
              guardBreak: true,
            });
          }
        }
        this.vx = -Math.cos(beamAng) * 7.5;
        this.vy = -Math.sin(beamAng) * 7.5;
      }
      return true;
    }

    if (this._jackpotFireTimer > 0) {
      this._jackpotFireTimer--;
      this.gunAngle = this._jackpotLockedAngle;
      return true;
    }

    return false;
  }

  update(opponent, ownerIndex, arena) {
    const cfg = CONFIG.dante || {};

    // Rule 25: Always decay transient visuals & active projectiles BEFORE freeze guard
    this._updateTransientVisualsOnly();
    this._updateProjectilesAndSummons(opponent, arena);

    // Rule 1 / Section 1.1: Mandatory Freeze & TimeStop Guard
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks(false);
      return;
    }

    this._tickDanteTimers(cfg);
    if (this.hp <= 0) return;

    this.aim(opponent);

    if (this._millionStabTimer > 0 && isSkillEnabled(cfg.enableRebellionCombo, true)) {
      this._millionStabTimer--;
      if (this._millionStabTimer === 0) {
        if (this._millionStabHitLanded) {
          // Enter hip-coil wind-up before unleashing the forward-leaning Thrust Finisher
          const windupFrames = Math.max(0, cfg.millionStabFinisherWindupFrames ?? 10);
          if (windupFrames > 0) {
            this._millionStabFinisherDelay = windupFrames;
          } else {
            this._millionStabFinisherDelay = 0;
            this._executeMillionStabFinisher(opponent, cfg);
          }
        } else {
          // No enemy was hit by Million Stab: skip the Thrust Finisher & High Time chain cleanly
          this._millionStabFinisherDelay = 0;
          this.slashSwingTimer = 0;
          this._comboChainActive = false;
          this._pendingGunSequence = false;
          this.swordCooldown = cfg.swordCooldown ?? 22;
        }
      } else if (--this._millionStabTick <= 0) {
        this._millionStabTick = Math.max(1, cfg.millionStabTickInterval ?? 5);
        const aimAng = this.gunAngle || 0;
        const reach = (cfg.swordReach ?? 94) +
          (this.isDevilTrigger ? (cfg.dtSwordReachBonus ?? 14) : 0) +
          (cfg.millionStabReachBonus ?? 22);
        const tickDmg = cfg.millionStabTickDamage ?? Math.max(5, Math.round((cfg.swordDamage ?? 21) * 0.35));
        this._playSfx('swordSlash');
        triggerGlobalScreenShake?.(2.8, 4);
        for (const enemy of this._getHostileTargets(opponent)) {
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          if (Math.hypot(dx, dy) <= reach + (enemy.r || 28)) {
            const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - aimAng), Math.cos(Math.atan2(dy, dx) - aimAng)));
            if (diff <= 0.65) {
              this._applyMillionStabThrustHit(enemy, tickDmg, aimAng, dx, dy, cfg);
            }
          }
        }
      }
    } else if (this._millionStabFinisherDelay > 0 && isSkillEnabled(cfg.enableRebellionCombo, true)) {
      this._millionStabFinisherDelay--;
      if (this._millionStabFinisherDelay === 0) {
        this._executeMillionStabFinisher(opponent, cfg);
      }
    }

    const hostiles = this._getHostileTargets(opponent);
    const primaryTarget = hostiles[0] || opponent;
    if (hostiles.length === 0) {
      this._comboChainActive = false;
    }

    if (this._gunSequenceTimer > 0 && hostiles.length > 0) {
      const endBuffer = Math.max(6, Math.round((cfg.weaponSwitchFrames ?? 14) * 0.5));
      if (this._gunSequenceTimer > endBuffer && --this._gunSequenceTick <= 0) {
        this._gunSequenceTick = Math.max(4, cfg.finisherGunFireInterval ?? 11);
        this._fireSingleEbonyIvoryBullet(cfg, { forceSequence: true, preserveVisualTimer: true });
      }
    }

    if (this._gunBurstQueue > 0) {
      if (--this._gunBurstTick <= 0) {
        this._gunBurstQueue--;
        this._gunBurstTick = 6;
        this._fireSingleEbonyIvoryBullet(cfg);
      }
    }

    const dist = primaryTarget ? Math.hypot(primaryTarget.x - this.x, primaryTarget.y - this.y) : 999;

    // Proactive Spot Dodge when an enemy swings at close range while Spot Dodge is ready
    this._checkSpotDodgeAnticipation(primaryTarget, dist, cfg);

    const isChanneling = this._processActiveChanneling(opponent, cfg);
    if (!isChanneling && hostiles.length > 0 && primaryTarget) {
      // Automatically chain through all 4 Greatsword Combo stages (Wide Slash -> Reverse Slash -> Million Stab -> High Time)
      if (this._comboChainActive && this.slashSwingTimer <= 0 && isSkillEnabled(cfg.enableRebellionCombo, true) && !this._roundTripEntity) {
        this._executeRebellionCleave(primaryTarget, cfg);
      } else if (this.slashSwingTimer <= 0 && this._gunSequenceTimer <= 0 && !this._tryCastSkills(opponent, cfg, dist)) {
        const reach = (cfg.swordReach ?? 94) + (this.isDevilTrigger ? (cfg.dtSwordReachBonus ?? 14) : 0);
        if (isSkillEnabled(cfg.enableRebellionCombo, true) && !this._roundTripEntity && this._weaponSwitchTimer <= 0 && dist <= reach + (primaryTarget.r || 28) && this.swordCooldown <= 0) {
          this.comboStep = 0;
          this._executeRebellionCleave(primaryTarget, cfg);
        } else if (!isSkillEnabled(cfg.enableFinisherGunSequence, true) && isSkillEnabled(cfg.enableGunfire, true) && this.weaponSwitchCooldown <= 0 && this._weaponSwitchTimer <= 0 && this.gunCooldown <= 0 && dist > 60) {
          this.gunCooldown = cfg.gunCooldown ?? 68;
          this._gunBurstQueue = (cfg.gunBurstCount ?? 3) - 1;
          this._gunBurstTick = 6;
          this._fireSingleEbonyIvoryBullet(cfg);
        }
      }

      // Preserve natural arena/opponent ricochet velocity; only brake during stationary Million Stab & finisher lunge settle
      if (this._isMillionStabStationary()) {
        this.vx = 0;
        this.vy = 0;
      } else if (this._isPerformingMillionStab()) {
        this.vx = (this.vx || 0) * 0.88;
        this.vy = (this.vy || 0) * 0.88;
      }
    }

    this._syncWeaponSwitch(cfg);

    // Section 1.2: Centralized Natural Movement & Wall/Fighter Rebound Pipeline (matches Vergil/Toji/Gojo)
    if (this._isMillionStabStationary()) {
      this.applyMovementPhysics(0);
      this.resolveWallBounce(arena, opponent);
    } else {
      super.update(opponent, ownerIndex, arena);
    }

    // Sequence: immediately transition into Ebony & Ivory guns as soon as the finisher swing finishes cleanly
    if (this._pendingGunSequence && this.slashSwingTimer <= 0 && !this._isPerformingMillionStab()) {
      if (isSkillEnabled(cfg.enableFinisherGunSequence, true) && this.weaponSwitchCooldown <= 0 && hostiles.length > 0) {
        this._startFinisherGunSequence(cfg);
      } else {
        this._pendingGunSequence = false;
      }
    }
  }

  drawBody(ctx) {
    if (this.isSpotDodging && this._spotDodgeTimer > 0) return;
    drawDanteSkin(ctx, this);
  }

  _drawShockwaves(ctx) {
    drawDantePixelShockwaves(ctx, this._shockwaves);
  }

  draw(ctx, opponent) {
    if (!ctx || this.hp <= 0) return;

    // Doppelganger shadow clone behind main body
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

    // DT Crimson Vortex Tornado (behind/around Dante)
    if (this._dtTornado) {
      const tor = this._dtTornado;
      const fIdx = Math.floor((96 - tor.life) / 3) % 7;
      drawDanteSprite(ctx, 'dtTornado', tor.x, tor.y, 0, tor.radius * 2.15, tor.radius * 2.0, fIdx, 0.85);
    }

    // Devil Trigger flickering crimson aura behind body
    if (this.isDevilTrigger && !this.isSpotDodging) {
      drawDanteDtAura(ctx, this.x, this.y - (this.z || 0), this.r || 30, 0.84);
    }

    // Spot Dodge: while active, Dante's body & outline are 100% vanished (only the spotDodge VFX is visible)
    if (this.isSpotDodging && this._spotDodgeTimer > 0) {
      if (typeof state !== 'undefined' && state.frameCount !== undefined) {
        this._statusOverlaysRenderedFrame = state.frameCount;
      }
    } else {
      if (typeof drawFighterInkOutline === 'function') {
        drawFighterInkOutline(ctx, this);
      }
      this.drawBody(ctx);
    }

    // Independent active projectiles (Round Trip, Drive Wave, Rockets, Ebony & Ivory tracers)
    if (this._roundTripEntity) {
      const rt = this._roundTripEntity;
      drawDanteSprite(ctx, 'roundTrip', rt.x, rt.y, rt.spinAngle, 84, 34, 0, 0.96);
    }
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

    // Jackpot! Twin Ebony & Ivory Crimson Finisher Beams
    if (this._jackpotFireTimer > 0) {
      const cfg = CONFIG.dante || {};
      const ang = this._jackpotLockedAngle;
      const px = -Math.sin(ang) * 14;
      const py = Math.cos(ang) * 14;
      drawDanteJackpotBeam(ctx, this.x + px, this.y + py, ang, 620, (cfg.jackpotWidth ?? 60) * 0.72);
      drawDanteJackpotBeam(ctx, this.x - px, this.y - py, ang, 620, (cfg.jackpotWidth ?? 60) * 0.72);
    }

    // Transient MUGEN slash arcs, explosions, weapon switch vanish VFX & clean concentric shockwaves
    drawDanteWeaponVanishVfx(ctx, this._weaponVanishGhosts);
    drawDanteTransientVfx(ctx, this._danteVfx);
    this._drawShockwaves(ctx);

    // Rule 21: Mandatory overhead HP & freeze status rendering on top layer
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }
}
