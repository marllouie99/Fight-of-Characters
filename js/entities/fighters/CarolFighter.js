// ───────────────────────────────────────────────────────────────────────────
// CAROL HOLIDAY (Deltarune — "Resolve") Combat Entity Class
// Adheres strictly to:
// - Rule 1.1: Freeze & TimeStop Early Exits
// - Rule 1.2: Centralized Physics via super.update() (natural rebound movement)
// - Rule 1.4: Continuous 360° Aiming & Committed Cast Angle Lock
// - Rule 18: Unified Theme Color (#38BDF8) & Toggle Gating
// - Rule 20: Canonical Lower-Flank Hands holding Glacial Katana
// - Rule 21: In-Game Overlay HP & Status Drawing (drawHealth + drawFreezeTimer)
// - Rule 23: Basic Projectile Suppression (shoot override)
// - Rule 24: Universal Character Body Model Scale (preserve super(def) scaled r)
// - Rule 25: Non-Freezing Active Visual Effects Standard (top-of-update decay)
// - Rule 30: 5-Phase Katana Melee Combo with Impact Lock & Layered Slap Audio
// - Rule 32: World-Space Skin Drawing & Explicit 2.0px Outer Black Outline
// ───────────────────────────────────────────────────────────────────────────

import { Fighter, applyDamageToTarget, isSkillEnabled } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { carolConfig } from '../../configs/characters/carolConfig.js';
import { state, spawnFloatingText, triggerGlobalScreenShake } from '../../core/state.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { spawnSparks } from '../../graphics/particles/sparkEffect.js';
import { drawCarolSkin, drawCarolGhostSkin, prewarmCarolSkin } from '../../graphics/fighters/carolSkin.js';
import {
  drawCarolKatanaAndSlashVFX,
  drawCarolFrostDagger,
  drawCarolDaggerTrails,
  drawCarolFrostGale,
  drawCarolIcicleShard,
  drawCarolIceSplitLines,
  drawCarolFractalBursts,
  drawCarolSpellPulses,
  drawCarolCastMist,
  drawCarolPermafrostVFX,
  drawCarolCryoMendAura,
  drawCarolAquaHeatbarChill,
  prewarmCarolVfx,
} from '../../graphics/weapons/carolWeaponGraphics.js';
import {
  resetSpeechState,
  triggerFighterSpeech,
  updateFighterSpeech,
  tickFighterIntroAndWinSpeech,
} from '../../systems/undertaleSpeech.js';
import { drawSansSpeechBubble } from '../../graphics/weapons/sansWeaponGraphics.js';
import { getBlasterTargetBlockRadius } from './SansFighter.js';

export class CarolFighter extends Fighter {
  constructor(def = {}) {
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.carol) ? CONFIG.carol : carolConfig;

    // Rule 24: Preserve scaled radius from super(def); NEVER overwrite this.r afterward
    super({
      ...def,
      r: def.r ?? cfg.r ?? 25,
      radius: def.radius ?? cfg.radius ?? 25,
      hp: def.hp ?? cfg.hp ?? 360,
      maxHp: def.maxHp ?? cfg.maxHp ?? 360,
      speed: def.speed ?? cfg.speed ?? 5.9,
      damage: def.damage ?? cfg.hit1Damage ?? 18,
      cooldown: def.cooldown ?? cfg.swordCooldown ?? 34,
      color: def.color || cfg.color || '#38BDF8',
    });

    this.characterId = 'carol';
    this.type = 'carol';
    this.name = def?.name || cfg.name || 'Carol';
    this.displayName = def?.displayName || cfg.displayName || 'CAROL HOLIDAY';
    this.grade = cfg.grade || 'SS';
    this.title = cfg.title || 'The Frozen Resolve';
    this.color = cfg.color || '#38BDF8';
    this.themeColor = cfg.themeColor || '#38BDF8';
    this.secondaryColor = cfg.secondaryColor || '#BAE6FD';
    this.damageNumberColor = cfg.damageNumberColor || '#38BDF8';
    this.moveSpeed = def.moveSpeed ?? cfg.moveSpeed ?? cfg.speed ?? 5.9;
    this.speed = this.moveSpeed;

    this._initCarolState(cfg);
  }

  _cfg() {
    return (typeof CONFIG !== 'undefined' && CONFIG.carol) ? CONFIG.carol : carolConfig;
  }

  /**
   * Rule 35 pre-battle hook invoked by prewarmMatchAssets() before Round 1 starts.
   */
  prewarmAssets(targetCtx = null) {
    const skinCount = prewarmCarolSkin(this.r || 30, targetCtx);
    const vfxCount = prewarmCarolVfx(targetCtx);
    return skinCount + vfxCount;
  }

  _registerCooldownExclusions() {
    if (!this.skillManager || !this.skillManager.cooldownKeyMap) return;
    const keys = [
      'swordCooldownTimer',
      'parryCooldownTimer',
      'skill1CooldownTimer',
      'permafrostCooldownTimer',
    ];
    for (const k of keys) {
      this.skillManager.cooldownKeyMap.set(k, true);
    }
  }

  _initCarolState(cfg = this._cfg()) {
    this._vfxTick = 0;
    this.afterImages = [];

    // Passive: Frostbite Stacks, Iaijutsu Frost Parry & Cryo Mend (Carol_Heal)
    this.frostStacks = new Map();
    this.parryCooldownTimer = 0;
    this.parryFlashTimer = 0;
    this.hasUsedCarolHeal = false;
    this.healBannerTimer = 0;
    this.healBannerMax = 36;
    this.aquaChilledTargets = new Map();

    // Basic Attack: 5-Phase Glacial Katana Combo (Rule 30)
    this.swordCooldownTimer = 14;
    this.swordSwingTimer = 0;
    this.swordSwingMax = 35;
    this.swordSwingLiftFrames = 8;
    this.swordSwingHoldFrames = 3;
    this.swordSwingStrikeFrames = 6;
    this.swordSwingImpactLockFrames = 6;
    this.swordSwingHitPause = 3;
    this.swordSwingLunge = 6.5;
    this.swordSwingRecoil = 2.2;
    this.swordSwingArc = (140 * Math.PI) / 180;
    this.swordSwingDamage = 18;
    this.swordSwingKnockback = 5.5;
    this.swordSwingShake = 3.6;
    this.swordComboStep = 0;
    this.comboResetTimer = 0;
    this.swordSlashAngle = 0;
    this.swordHitDelivered = false;
    this.swordRecoilApplied = false;
    this.fractalFollowupSpawned = false;
    this.swordHitTremorTimer = 0;
    this.shootCooldownMax = 0;
    this.shootCooldown = 999999;

    // Passive 4: Dagger Hailstorm (5 basic attack damage hits)
    this.daggerHailBasicHits = 0;
    this.daggerHailPassiveCooldownTimer = 0;

    // Unified Skill 1 Slot (Anti-Repeat Resolve Arts)
    this.skill1CooldownTimer = cfg.skill1InitialCooldown ?? 85;
    this.skill1CooldownMax = cfg.skill1Cooldown ?? 270;
    this._activeSkill1Id = null;
    this._activeSkill1Label = null;
    this._daggerHailPatternIdx = 0;
    this._fractalWebSeq = 0;

    this.activeDaggers = [];
    this.activeDaggerTrails = [];
    this.activeFrostGales = [];
    this.activeIcicles = [];
    this.activeIceSplits = [];
    this.activeFractalBursts = [];
    this.activeBlizzardSpawners = [];
    this.activeShockwaveRipples = [];
    this.activeSnowDrops = [];
    this.activeSpellRings = [];
    this.castAnimType = null;
    this.castAnimTimer = 0;
    this.castAnimMax = 0;
    this._castSlashAlternator = false;
    this.castMistTimer = 0;
    this.castMistMax = 0;
    this._daggerHailSeq = null;
    this._quickSlashSeq = null;
    this._daggerFractalSeq = null;
    this._daggerHailDirToggle = false;
    this._quickSlashWaveToggle = false;

    // Signature Ultimate: PERMAFROST // AQUA HEATBAR
    this.permafrostHits = 0;
    this.isPermafrostActive = false;
    this.permafrostCooldownTimer = cfg.permafrostCooldown ?? 0;
    this._permafrostSeq = null;
    this.permafrostScreenAlpha = 0;
    this.permafrostFreezeHold = 0;
    this.skillCastAngle = 0;

    resetSpeechState(this);
    this._registerCooldownExclusions();
  }

  reset() {
    super.reset();
    this._initCarolState(this._cfg());
  }

  _playAudio(key, fallbackPath, defaultVol = 0.78, speed = 1.0) {
    if (typeof audioSystem === 'undefined' || !audioSystem.playSFX) return;
    const cfg = this._cfg();
    const src = cfg.sounds?.[key] || fallbackPath;
    const vol = cfg.soundVolumes?.[key] ?? defaultVol;
    audioSystem.playSFX(src, vol, speed, 0);
  }

  _speak(text, opts = {}) {
    const cfg = this._cfg();
    triggerFighterSpeech(this, text, {
      preserveCase: true,
      borderColor: '#38BDF8',
      blipSrc: cfg.sounds?.carolSpeak || 'Assets/Sound Effects/CarolSFX/carol_txt.wav',
      blipVolume: cfg.soundVolumes?.carolSpeak ?? 0.72,
      ...opts,
    });
  }

  /**
   * Rule 23: Suppress base Fighter generic bullet projectiles.
   */
  shoot() {
    // Intentionally empty: Carol uses Glacial Katana combos & Frost Resolve arts.
  }

  /**
   * Rule 1.4: Lock aim during Permafrost ultimate and active sword strike/lock phases.
   */
  canAim() {
    if (this.isPermafrostActive) return false;
    if (this.swordSwingTimer > 0) {
      const elapsed = (this.swordSwingMax || 35) - this.swordSwingTimer;
      if (elapsed >= (this.swordSwingLiftFrames || 8) + (this.swordSwingHoldFrames || 3)) {
        return false;
      }
    }
    return super.canAim();
  }

  isStationarySkillActive() {
    return Boolean(this.isPermafrostActive || super.isStationarySkillActive?.());
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

  _applyFrostStack(target, cfg = this._cfg(), addCount = 1) {
    if (!isSkillEnabled(cfg.enableFrostStacks, true) || !target || target.hp <= 0) return;
    target.slowTimer = Math.max(target.slowTimer || 0, cfg.frostChillDuration ?? 95);
    target.slowMultiplier = Math.min(target.slowMultiplier || 1.0, cfg.frostChillMultiplier ?? 0.72);

    const stackChance = cfg.frostStackChance ?? 1.0;
    if (stackChance <= 0 || Math.random() >= stackChance) return;

    const prev = this.frostStacks.get(target) || 0;
    const next = prev + addCount;
    const req = Math.max(1, cfg.frostStacksToFreeze ?? 3);
    if (next >= req) {
      this.frostStacks.set(target, 0);
      const freezeChance = cfg.frostFreezeChance ?? 0.45;
      if (freezeChance <= 0 || Math.random() >= freezeChance) return;

      const freezeDur = cfg.frostFreezeDuration ?? 26;
      if (typeof target.applyFreeze === 'function') {
        target.applyFreeze(freezeDur);
      } else if (typeof target.applyTimeStop === 'function') {
        target.applyTimeStop(freezeDur);
      } else {
        target.freezeTimer = Math.max(target.freezeTimer || 0, freezeDur);
      }
      applyDamageToTarget(target, cfg.frostShatterBonusDamage ?? 14, this, { skipInterrupt: true, isFrostShatter: true });
      spawnFloatingText(target.x, target.y - (target.r || 25) - 18, 'FROZEN!', '#BAE6FD');
      spawnSparks(target.x, target.y, 10, 'cyan', { color: '#BAE6FD' });
      this._playAudio('icespell', 'Assets/Sound Effects/CarolSFX/carol_icespell.wav', 0.76, 1.15);
    } else {
      this.frostStacks.set(target, next);
    }
  }

  _dealCarolDamage(target, amount, opts = {}) {
    if (!target || target.hp <= 0 || target.dead || target.isDead || target.invulnerable) return false;
    const damageOpts = { skipInterrupt: true, ...opts };
    const dealt = applyDamageToTarget(target, amount, this, damageOpts);
    if (dealt) {
      if (opts.applyFrost !== false) this._applyFrostStack(target, this._cfg(), opts.frostCount || 1);
      if (opts.incrementUlt && !this.isPermafrostActive) {
        const req = Math.max(1, this._cfg().permafrostHitsRequired ?? 5);
        this.permafrostHits = Math.min(req, (this.permafrostHits || 0) + 1);
      }
    }
    return Boolean(dealt);
  }

  /**
   * Passive 2: Iaijutsu Frost Parry — deflects non-guaranteed incoming strikes & ripostes.
   */
  takeDamage(amount, attacker, opts = {}) {
    const cfg = this._cfg();
    const isFrozen = Boolean(this.isTimeStopped || this.isStunned || this.isParalyzed || this.isChainedByMakima);
    const canParry = Boolean(
      isSkillEnabled(cfg.enableIceParry, true) &&
      !isFrozen &&
      !opts.isHeal &&
      !opts.bypassParry &&
      !opts.isGuaranteedHit &&
      !opts.isDomain &&
      !opts.isDomainSlash &&
      !opts.isDot &&
      amount > 0 &&
      (this.parryCooldownTimer || 0) <= 0 &&
      Math.random() < (cfg.parryChance ?? 0.30)
    );

    if (canParry) {
      this.parryCooldownTimer = cfg.parryCooldown ?? 150;
      this.parryFlashTimer = 18;
      spawnFloatingText(this.x, this.y - (this.r || 25) - 16, 'PARRY!', '#BAE6FD');
      spawnSparks(this.x, this.y, 10, 'cyan', { color: '#7DD3FC' });
      this._playAudio('slice', 'Assets/Sound Effects/CarolSFX/carol_slice.mp3', 0.84, 1.15);
      this._playAudio('impact', 'Assets/Sound Effects/CarolSFX/carol_impact.wav', 0.72);
      if (attacker && attacker !== this && attacker.hp > 0 && Math.hypot(attacker.x - this.x, attacker.y - this.y) <= (cfg.swordRange ?? 86) + 45) {
        this._dealCarolDamage(attacker, cfg.parryCounterDamage ?? 14, { isMelee: true, incrementUlt: true });
      }
      return 0;
    }

    return super.takeDamage(amount, attacker, opts);
  }

  interruptAttacks(forceCancelAll = false) {
    this.swordSwingTimer = 0;
    if (forceCancelAll) {
      this._permafrostSeq = null;
      this._daggerHailSeq = null;
      this._quickSlashSeq = null;
      this._daggerFractalSeq = null;
      this.isPermafrostActive = false;
      this.permafrostScreenAlpha = 0;
      this.permafrostFreezeHold = 0;
      this.activeDaggers.length = 0;
      this.activeDaggerTrails.length = 0;
      this.activeFrostGales.length = 0;
      this.activeIcicles.length = 0;
      this.activeIceSplits.length = 0;
      this.activeFractalBursts.length = 0;
      this.activeBlizzardSpawners.length = 0;
      this.activeShockwaveRipples.length = 0;
      this.activeSnowDrops.length = 0;
      this.activeSpellRings.length = 0;
      this.castAnimType = null;
      this.castAnimTimer = 0;
      this.castAnimMax = 0;
      this.castMistTimer = 0;
      this.castMistMax = 0;
      this.aquaChilledTargets.clear();
    }
  }

  _triggerCastAnim(type, duration = 24) {
    this.castAnimType = type;
    this.castAnimMax = Math.max(1, duration);
    this.castAnimTimer = this.castAnimMax;
  }

  _triggerCastMist(duration = 48) {
    this.castMistMax = Math.max(this.castMistMax || 1, duration);
    this.castMistTimer = Math.max(this.castMistTimer || 0, duration);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RULE 25: TOP-OF-UPDATE NON-FREEZING VFX DECAY (BEFORE _handleTimeStop)
  // ═════════════════════════════════════════════════════════════════════════
  _updateAllVfxLifecycles(arena) {
    const cfg = this._cfg();
    const bounds = arena || (typeof state !== 'undefined' && state.arena) || { x: 45, y: 240, width: 450, height: 450 };
    const enemies = this._getAllEnemyTargets(null);

    this._vfxTick++;
    if (this.swordHitTremorTimer > 0) this.swordHitTremorTimer--;
    if (this.parryFlashTimer > 0) this.parryFlashTimer--;
    if (this.healBannerTimer > 0) this.healBannerTimer--;
    if (this.castMistTimer > 0) this.castMistTimer--;
    if (this.castAnimTimer > 0) {
      this.castAnimTimer--;
      if (this.castAnimTimer === 0) this.castAnimType = null;
    }

    this._updateAfterImages();
    this._updateRipplesAndSnow(bounds);
    this._updateSpellRings();
    this._updateFractalBursts();
    this._updateBlizzardSpawners(bounds, cfg);
    this._updateAquaChilledTargets(cfg);
    this._updateDaggers(enemies, bounds, cfg);
    this._updateFrostGales(enemies, bounds, cfg);
    this._updateIcicles(enemies, bounds, cfg);
    this._updateIceSplits(enemies, bounds, cfg);
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

  _updateRipplesAndSnow(bounds) {
    for (let i = this.activeShockwaveRipples.length - 1; i >= 0; i--) {
      const sw = this.activeShockwaveRipples[i];
      sw.life--;
      if (sw.life <= 0) {
        this.activeShockwaveRipples[i] = this.activeShockwaveRipples[this.activeShockwaveRipples.length - 1];
        this.activeShockwaveRipples.pop();
      }
    }
    for (let i = this.activeSnowDrops.length - 1; i >= 0; i--) {
      const s = this.activeSnowDrops[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life--;
      const outLeft = bounds && s.vx < -4 && s.x < bounds.x - 16;
      if (s.life <= 0 || outLeft) {
        this.activeSnowDrops[i] = this.activeSnowDrops[this.activeSnowDrops.length - 1];
        this.activeSnowDrops.pop();
      }
    }
    for (let i = this.activeDaggerTrails.length - 1; i >= 0; i--) {
      const tr = this.activeDaggerTrails[i];
      tr.timer--;
      if (tr.timer <= 0) {
        this.activeDaggerTrails[i] = this.activeDaggerTrails[this.activeDaggerTrails.length - 1];
        this.activeDaggerTrails.pop();
      }
    }
  }

  _updateSpellRings() {
    for (let i = this.activeSpellRings.length - 1; i >= 0; i--) {
      const rg = this.activeSpellRings[i];
      rg.life--;
      if (rg.life <= 0) {
        this.activeSpellRings[i] = this.activeSpellRings[this.activeSpellRings.length - 1];
        this.activeSpellRings.pop();
      }
    }
  }

  _updateFractalBursts() {
    for (let i = this.activeFractalBursts.length - 1; i >= 0; i--) {
      const b = this.activeFractalBursts[i];
      b.x += b.vx || 0;
      b.y += b.vy || 0;
      b.vx = (b.vx || 0) * 0.90;
      b.vy = (b.vy || 0) * 0.90;
      b.life--;
      if (b.life <= 0) {
        this.activeFractalBursts[i] = this.activeFractalBursts[this.activeFractalBursts.length - 1];
        this.activeFractalBursts.pop();
      }
    }
  }

  _updateBlizzardSpawners(bounds, cfg) {
    for (let i = this.activeBlizzardSpawners.length - 1; i >= 0; i--) {
      const b = this.activeBlizzardSpawners[i];
      if (b.delay > 0) {
        b.delay--;
        continue;
      }
      // Resolve attacks//Icicle_Blizzard `burst`: 10-shard vertical column wall from edge sweeping -120° / -60°
      const count = b.count ?? cfg.blizzardColumnCount ?? 8;
      const spd = b.speed ?? cfg.blizzardSlowSpeed ?? 4.8;
      const deg = b.deg ?? 150;
      const rad = (deg * Math.PI) / 180;
      const dmg = cfg.blizzardShardDamage ?? 8;
      const fromRight = Math.cos(rad) < 0;
      const startX = fromRight ? (bounds.x + bounds.width - 18) : (bounds.x + 18);
      const marginY = 26;
      const usableH = Math.max(40, bounds.height - marginY * 2);

      for (let k = 0; k < count; k++) {
        const frac = count > 1 ? k / (count - 1) : 0.5;
        const y = bounds.y + marginY + frac * usableH + (b.yJitter || 0);
        this.activeIcicles.push({
          x: startX,
          y,
          vx: Math.cos(rad) * spd,
          vy: Math.sin(rad) * spd,
          angle: rad,
          scale: cfg.blizzardShardScale ?? 1.05,
          animTick: k * 2,
          damage: dmg,
          life: cfg.blizzardShardLifeFrames ?? 115,
        });
      }
      this._playAudio('stardrop', 'Assets/Sound Effects/CarolSFX/carol_stardrop.wav', 0.68, 1.02);
      this.activeBlizzardSpawners[i] = this.activeBlizzardSpawners[this.activeBlizzardSpawners.length - 1];
      this.activeBlizzardSpawners.pop();
    }
  }

  _updateAquaChilledTargets(cfg) {
    if (!this.aquaChilledTargets || this.aquaChilledTargets.size === 0) return;
    const slowMult = cfg.aquaHeatbarSlowMultiplier ?? 0.68;
    const tickDmg = cfg.aquaHeatbarTickDamage ?? 3;
    const tickInterval = Math.max(1, cfg.aquaHeatbarTickIntervalFrames ?? 36);
    for (const [target, info] of this.aquaChilledTargets.entries()) {
      if (!target || target.hp <= 0 || target.dead || target.isDead || !info || info.timer <= 0) {
        this.aquaChilledTargets.delete(target);
        continue;
      }
      info.timer--;
      target.slowTimer = Math.max(target.slowTimer || 0, 8);
      target.slowMultiplier = Math.min(target.slowMultiplier || 1.0, slowMult);
      if (info.timer > 0 && info.timer % tickInterval === 0) {
        this._dealCarolDamage(target, tickDmg, { isDot: true, applyFrost: false, bypassParry: true });
      }
      if (info.timer <= 0) {
        this.aquaChilledTargets.delete(target);
      }
    }
  }

  _updateDaggers(enemies, bounds, cfg) {
    const primary = enemies[0] || null;
    for (let i = this.activeDaggers.length - 1; i >= 0; i--) {
      const d = this.activeDaggers[i];
      if (d.stuckTimer > 0) {
        d.stuckTimer--;
        if (d.stuckTimer <= 0) {
          this.activeDaggers[i] = this.activeDaggers[this.activeDaggers.length - 1];
          this.activeDaggers.pop();
        }
        continue;
      }

      if (d.stage === 'pullback') {
        d.stageTick = (d.stageTick || 0) + 1;
        const pullMax = Math.max(1, d.pullFrames ?? cfg.daggerPullbackFrames ?? 18);
        d.alpha = Math.min(1, d.stageTick / Math.max(1, pullMax - 2));
        d.spinIdx = Math.min(7, Math.floor((d.stageTick / pullMax) * 8));
        const pullSpd = d.pullSpd ?? cfg.daggerPullbackSpeed ?? 1.8;
        d.x -= Math.cos(d.angle) * pullSpd;
        d.y -= Math.sin(d.angle) * pullSpd;
        d.pullSpd = pullSpd * 0.80;
        if (d.stageTick >= pullMax) {
          d.alpha = 1;
          d.spinIdx = 7;
          d.stage = 'wait';
          d.stageTick = 0;
        }
        continue;
      }

      if (d.stage === 'wait') {
        d.waitTimer = (d.waitTimer || 0) - 1;
        if (d.waitTimer <= 0) {
          d.stage = 'slide_aim';
          d.stageTick = 0;
        }
        continue;
      }

      if (d.stage === 'slide_aim') {
        d.stageTick = (d.stageTick || 0) + 1;
        const slideMax = Math.max(1, d.slideFrames ?? cfg.daggerSlideFrames ?? 18);
        const slideSpd = d.slideSpd ?? cfg.daggerSlideSpeed ?? 3.0;
        d.x = Math.max(bounds.x + 22, Math.min(bounds.x + bounds.width - 22, d.x + (d.slideDirX || 0) * slideSpd));
        d.y = Math.max(bounds.y + 22, Math.min(bounds.y + bounds.height - 22, d.y + (d.slideDirY || 0) * slideSpd));
        d.slideSpd = slideSpd * 0.84;

        // Resolve `Aim`: lock onto initial cast-time spot when daggerAutoAim is false; track live target only if daggerAutoAim === true
        if (cfg.daggerAutoAim === true && primary && primary.hp > 0) {
          const want = Math.atan2((primary.y - (primary.z || 0)) - d.y, primary.x - d.x);
          const diff = Math.atan2(Math.sin(want - d.angle), Math.cos(want - d.angle));
          d.angle += diff / Math.max(2, cfg.daggerTurnDivisor ?? 5);
        } else if (d.lockedTargetX !== undefined && d.lockedTargetY !== undefined) {
          const want = Math.atan2(d.lockedTargetY - d.y, d.lockedTargetX - d.x);
          const diff = Math.atan2(Math.sin(want - d.angle), Math.cos(want - d.angle));
          d.angle += diff / Math.max(2, cfg.daggerTurnDivisor ?? 5);
        }
        if (d.stageTick >= slideMax) {
          d.lockedAngle = d.angle;
          d.stage = 'hold';
          d.reticleTimer = cfg.daggerReticleFrames ?? 14;
          d.reticleMax = d.reticleTimer;
          d.aimTimer = Math.max(12, Math.round((cfg.daggerAimFrames ?? 34) * 0.55));
          d.aimMax = d.aimTimer;
        }
        continue;
      }

      if (d.reticleTimer > 0) d.reticleTimer--;

      if (d.aimTimer > 0) {
        d.aimTimer--;
        if (d.aimTimer === 0) {
          const lockAngle = d.lockedAngle !== undefined ? d.lockedAngle : d.angle;
          d.angle = lockAngle;
          d.stage = 'fly';
          const spd = d.speed ?? cfg.daggerSpeed ?? 13.5;
          const trailLife = Math.max(1, cfg.daggerTrailFrames ?? 16);
          d.vx = Math.cos(lockAngle) * spd;
          d.vy = Math.sin(lockAngle) * spd;
          this.activeDaggerTrails.push({
            x: d.x,
            y: d.y,
            angle: lockAngle,
            length: Math.hypot(bounds.width, bounds.height) + 40,
            timer: trailLife,
            maxTimer: trailLife,
          });
          this._playAudio('cut', 'Assets/Sound Effects/CarolSFX/carol_cut.wav', 0.66, 1.05);
        }
        continue;
      }

      d.x += d.vx;
      d.y += d.vy;
      d.life--;

      let hit = false;
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        const blockR = getBlasterTargetBlockRadius(e);
        const hitDist = blockR > 0 ? blockR : ((e.r || 25) + 12);
        if (Math.hypot(e.x - d.x, (e.y - (e.z || 0)) - d.y) <= hitDist) {
          hit = true;
          if (blockR <= 0) {
            this._dealCarolDamage(e, d.damage ?? cfg.daggerDamage ?? 9, { isProjectile: true, incrementUlt: true });
          }
          spawnSparks(d.x, d.y, 4, 'cyan', { color: '#BAE6FD' });
          break;
        }
      }

      if (hit || d.life <= 0) {
        this.activeDaggers[i] = this.activeDaggers[this.activeDaggers.length - 1];
        this.activeDaggers.pop();
        continue;
      }

      // Resolve Dagger_Hailstorm wall embed: daggers hitting the far arena border stick into the edge cleanly
      const hitLeft = d.x <= bounds.x + 14 && d.vx < 0;
      const hitRight = d.x >= bounds.x + bounds.width - 14 && d.vx > 0;
      const hitTop = d.y <= bounds.y + 14 && d.vy < 0;
      const hitBottom = d.y >= bounds.y + bounds.height - 14 && d.vy > 0;
      if (hitLeft || hitRight || hitTop || hitBottom) {
        d.x = Math.max(bounds.x + 12, Math.min(bounds.x + bounds.width - 12, d.x));
        d.y = Math.max(bounds.y + 12, Math.min(bounds.y + bounds.height - 12, d.y));
        d.vx = 0;
        d.vy = 0;
        d.stuckTimer = cfg.daggerWallStickFrames ?? 28;
        spawnSparks(d.x, d.y, 3, 'cyan', { color: '#BAE6FD' });
        this._playAudio('impact', 'Assets/Sound Effects/CarolSFX/carol_impact.wav', 0.35, 1.15);
      }
    }
  }

  _updateFrostGales(enemies, bounds, cfg) {
    for (let i = this.activeFrostGales.length - 1; i >= 0; i--) {
      const g = this.activeFrostGales[i];
      g.age = (g.age || 0) + 1;
      g.alpha = Math.min(1, g.age / 8);
      g.x = Math.max(bounds.x + 22, Math.min(bounds.x + bounds.width - 22, g.x + g.vx));
      g.y = Math.max(bounds.y + 22, Math.min(bounds.y + bounds.height - 22, g.y + g.vy));

      // Resolve Frost_Gale deceleration (ZERO gravity pull vortex) + Flake2 telegraph swell before burst
      const decel = g.decel ?? 0.90;
      g.vx *= decel;
      g.vy *= decel;
      g.life--;
      g.fuseRatio = g.life < 20 ? (1 - g.life / 20) : 0;

      if (g.life <= 0) {
        // Resolve attacks//Frost_Gale exact dual-hexagon burst: 6 @ 100% (60° steps) + 6 @ 60% (+30° offset)
        const outerCount = g.outerCount ?? cfg.galeOuterRingCount ?? 6;
        const innerCount = g.innerCount ?? cfg.galeInnerRingCount ?? 6;
        const outerSpd = cfg.galeShardSpeed ?? 6.4;
        const innerSpd = cfg.galeInnerShardSpeed ?? 5.8;
        const dmg = cfg.galeShardDamage ?? 9;
        const baseAng = g.burstOffset || 0;
        const burstLife = Math.max(10, cfg.galeBurstShardLifeFrames ?? 70);

        for (let s = 0; s < outerCount; s++) {
          const a = baseAng + (s / outerCount) * Math.PI * 2;
          this.activeIcicles.push({
            x: g.x, y: g.y,
            vx: Math.cos(a) * outerSpd, vy: Math.sin(a) * outerSpd,
            angle: a, scale: 1.0, animTick: s, damage: dmg, life: burstLife,
          });
        }
        const halfStep = Math.PI / Math.max(1, outerCount);
        for (let s = 0; s < innerCount; s++) {
          const a = baseAng + halfStep + (s / innerCount) * Math.PI * 2;
          this.activeIcicles.push({
            x: g.x, y: g.y,
            vx: Math.cos(a) * innerSpd, vy: Math.sin(a) * innerSpd,
            angle: a, scale: 0.60, animTick: s + 2, damage: dmg, life: burstLife,
          });
        }
        this._playAudio('icespell', 'Assets/Sound Effects/CarolSFX/carol_icespell.wav', 0.72);
        this._playAudio('starExplode', 'Assets/Sound Effects/CarolSFX/carol_star_explode.wav', 0.72);
        this.activeFrostGales[i] = this.activeFrostGales[this.activeFrostGales.length - 1];
        this.activeFrostGales.pop();
      }
    }
  }

  _updateIcicles(enemies, bounds, cfg) {
    for (let i = this.activeIcicles.length - 1; i >= 0; i--) {
      const s = this.activeIcicles[i];
      s.x += s.vx;
      s.y += s.vy;
      s.animTick = (s.animTick || 0) + 1;
      s.life--;

      let hit = false;
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        const blockR = getBlasterTargetBlockRadius(e);
        const hitDist = blockR > 0 ? blockR : ((e.r || 25) + 9 * (s.scale || 1));
        if (Math.hypot(e.x - s.x, (e.y - (e.z || 0)) - s.y) <= hitDist) {
          hit = true;
          if (blockR <= 0) {
            this._dealCarolDamage(e, s.damage ?? cfg.galeShardDamage ?? 9, { isProjectile: true });
          }
          break;
        }
      }

      const off = s.x < bounds.x - 40 || s.x > bounds.x + bounds.width + 40 || s.y < bounds.y - 40 || s.y > bounds.y + bounds.height + 40;
      if (hit || s.life <= 0 || off) {
        this.activeIcicles[i] = this.activeIcicles[this.activeIcicles.length - 1];
        this.activeIcicles.pop();
      }
    }
  }

  _spawnFractalDetonationVfx(sp, cfg = this._cfg()) {
    if (!sp.isFractal || this.activeFractalBursts.length >= 76) return;
    this.activeFractalBursts.push({
      kind: 'flash',
      x: sp.cx,
      y: sp.cy,
      angle: sp.angle || 0,
      length: Math.max(820, (sp.length || 640) * 1.35),
      vx: 0,
      vy: 0,
      life: 9,
      maxLife: 9,
    });
    // Resolve attacks//Ice_Slash costume 6 -> spawns fast flying `effect5` razor slash VFX streaks shooting across the whole screen
    const maxStreaks = Math.max(0, sp.streakCountPerSide ?? cfg.fractalSlashStreakCountPerSide ?? 3);
    const perSide = sp.quietShake ? Math.min(1, maxStreaks) : maxStreaks;
    const baseStreakSpeed = sp.streakSpeed ?? cfg.fractalSlashStreakSpeed ?? 22;
    for (let dirSign = -1; dirSign <= 1; dirSign += 2) {
      const ang = (sp.angle || 0) + (dirSign < 0 ? Math.PI : 0);
      for (let s = 0; s < perSide; s++) {
        const spread = (s - (perSide - 1) * 0.5) * 0.09;
        const speed = baseStreakSpeed + (s % 2) * 7;
        this.activeFractalBursts.push({
          kind: 'streak',
          x: sp.cx + Math.cos(sp.angle) * (s - (perSide - 1) * 0.5) * 36,
          y: sp.cy + Math.sin(sp.angle) * (s - (perSide - 1) * 0.5) * 36,
          angle: ang + spread,
          len: 190 + (s % 2) * 60,
          vx: Math.cos(ang + spread) * speed,
          vy: Math.sin(ang + spread) * speed,
          life: 13,
          maxLife: 13,
        });
      }
    }
  }

  _updateIceSplits(enemies, bounds, cfg) {
    for (let i = this.activeIceSplits.length - 1; i >= 0; i--) {
      const sp = this.activeIceSplits[i];
      if (sp.delayTimer > 0) {
        sp.delayTimer--;
        continue;
      }
      if (sp.isFrozenWait) {
        continue;
      }
      if (sp.warnTimer > 0) {
        sp.warnTimer--;
        // Exact Resolve TURN CW Turn; Turn = Turn / spin (rotates each chord around its own center into exact parallel triangle grid)
        if (sp.spinVel) {
          sp.angle += sp.spinVel;
          if (sp.spinDecay) sp.spinVel /= sp.spinDecay;
        }
        if (sp.warnTimer === 0) {
          if (!sp.quietAudio) {
            this._playAudio(sp.isFractal || sp.isRapidSlash ? 'cut' : 'boxbreak', (sp.isFractal || sp.isRapidSlash) ? 'Assets/Sound Effects/CarolSFX/carol_cut.wav' : 'Assets/Sound Effects/CarolSFX/carol_boxbreak.wav', 0.72);
          }
          if (!sp.quietShake) {
            const shakeAmt = sp.isFractal ? (sp.shakeIntensity ?? cfg.fractalSlashShakeIntensity ?? 3.2) : 4.2;
            if (shakeAmt > 0) triggerGlobalScreenShake(shakeAmt, 6);
          }
          // Sync Carol's katana animation directly to slash detonation (completing each full Up/Down cut without mid-swing reset)
          if (sp.isFractal && !this.isTimeStopped && this.swordSwingTimer <= 0 && !this.isPermafrostActive) {
            const animBusy = (this.castAnimTimer || 0) > 1 && (this.castAnimType === 'upslash' || this.castAnimType === 'downslash');
            if (!animBusy) {
              this._castSlashAlternator = !this._castSlashAlternator;
              const slashFrames = Math.max(4, sp.castSlashFrames ?? cfg.fractalSlashCastSlashFrames ?? 6);
              this._triggerCastAnim(this._castSlashAlternator ? 'upslash' : 'downslash', slashFrames);
            }
          } else if (sp.isRapidSlash && !sp.isFrozenWait && !sp.quietShake && !this.isTimeStopped && this.swordSwingTimer <= 0) {
            this._triggerCastAnim('sheath', 14);
          }
          this._spawnFractalDetonationVfx(sp, cfg);
        }
      } else {
        sp.activeTimer--;
        if (!sp.hasHit) {
          sp.hasHit = true;
          const cosA = Math.cos(sp.angle || 0);
          const sinA = Math.sin(sp.angle || 0);
          const halfW = (sp.width || cfg.iceSplitWidth || 34) * 0.5;
          for (let j = 0; j < enemies.length; j++) {
            const e = enemies[j];
            const dx = e.x - sp.cx;
            const dy = (e.y - (e.z || 0)) - sp.cy;
            const perp = Math.abs(-dx * sinA + dy * cosA);
            const along = Math.abs(dx * cosA + dy * sinA);
            if (perp <= halfW + (e.r || 25) && along <= (sp.length || 520) * 0.52) {
              this._dealCarolDamage(e, sp.damage ?? cfg.iceSplitDamage ?? 12, {
                isAOE: true,
                incrementUlt: sp.incrementUlt !== false,
              });
            }
          }
        }
      }
      if (sp.delayTimer <= 0 && !sp.isFrozenWait && sp.warnTimer <= 0 && sp.activeTimer <= 0) {
        this.activeIceSplits[i] = this.activeIceSplits[this.activeIceSplits.length - 1];
        this.activeIceSplits.pop();
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // MAIN COMBAT UPDATE LOOP (Rule 1.1, Rule 1.2, Rule 30)
  // ═════════════════════════════════════════════════════════════════════════
  update(opponent, ownerIndex, arena) {
    const cfg = this._cfg();

    // 0. Rule 25: Always decay VFX before freeze guard
    this._updateAllVfxLifecycles(arena);

    // 1. Rule 1.1: Mandatory Freeze & TimeStop Early Exit
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks();
      return;
    }

    if (this.parryCooldownTimer > 0) this.parryCooldownTimer--;
    if (this.swordCooldownTimer > 0) this.swordCooldownTimer--;
    if (this.comboResetTimer > 0) {
      this.comboResetTimer--;
      if (this.comboResetTimer === 0) this.swordComboStep = 0;
    }
    if (this.skill1CooldownTimer > 0) this.skill1CooldownTimer--;
    if (this.daggerHailPassiveCooldownTimer > 0) this.daggerHailPassiveCooldownTimer--;
    if (this.permafrostCooldownTimer > 0) this.permafrostCooldownTimer--;

    updateFighterSpeech(this);
    const targets = this._getAllEnemyTargets(opponent);
    const primary = targets[0] || opponent;
    tickFighterIntroAndWinSpeech(this, primary, {
      introText: 'You are not welcome here.',
      winText: 'Cold... is it not?',
      speechStyle: {
        preserveCase: true,
        borderColor: '#38BDF8',
        blipSrc: cfg.sounds?.carolSpeak || 'Assets/Sound Effects/CarolSFX/carol_txt.wav',
        blipVolume: cfg.soundVolumes?.carolSpeak ?? 0.72,
      },
    });

    const bounds = arena || (typeof state !== 'undefined' && state.arena) || { x: 45, y: 240, width: 450, height: 450 };

    // Passive 3: Carol_Heal / Cryo Mend once per match below HP threshold
    this._tryCarolHeal(cfg);

    // Passive 4: Dagger Hailstorm (if hits >= required & ready)
    if (primary && primary.hp > 0 && !this.isPermafrostActive) {
      this._tryTriggerDaggerHailPassive(primary, cfg);
    }

    // Advance staggered Resolve sequences (Dagger_Hailstorm + Quick_Slash + 0:54-1:01 DaggerHail II + FractalSlash II)
    if (this._daggerHailSeq) this._updateDaggerHailSeq(primary, bounds, cfg);
    if (this._quickSlashSeq) this._updateQuickSlashSeq(primary, bounds, cfg);
    if (this._daggerFractalSeq) this._updateDaggerFractalSeq(primary, bounds, cfg);

    if (this.isPermafrostActive) {
      this._updatePermafrostSeq(targets, bounds, cfg);
    } else if (this.swordSwingTimer > 0) {
      this._updateSwordSwing(primary, targets, cfg);
    } else if (primary && primary.hp > 0) {
      if (typeof this.aim === 'function') this.aim(primary);
      const dist = Math.hypot(primary.x - this.x, (primary.y - (primary.z || 0)) - (this.y - (this.z || 0)));
      const permReq = Math.max(1, cfg.permafrostHitsRequired ?? 5);

      let actionStarted = false;
      if (isSkillEnabled(cfg.enablePermafrost, true) && (this.permafrostHits || 0) >= permReq && this.permafrostCooldownTimer <= 0) {
        this._startPermafrost(primary, bounds, cfg);
        actionStarted = true;
      }
      if (!actionStarted && isSkillEnabled(cfg.enableSkill1, true) && this.skill1CooldownTimer <= 0) {
        actionStarted = Boolean(this._castRandomSkill1(primary, bounds, cfg));
        if (!actionStarted) {
          this.skill1CooldownTimer = cfg.skill1Cooldown ?? 270;
        }
      }
      const hasSkillSlashPending = this.activeIceSplits.some(s => (s.isFractal || s.isRapidSlash) && !s.isBasicFollowup && s.warnTimer > 0 && s.warnTimer <= 18);
      const swingTriggerDist = (cfg.swordRange ?? 86) + (this.r || 25) + (primary.r || 25);
      if (!actionStarted && !hasSkillSlashPending && isSkillEnabled(cfg.enableBasicSword, true) && this.swordCooldownTimer <= 0 && dist <= swingTriggerDist) {
        this._startSwordSwing(primary, cfg);
      }
    }

    // Delegate movement & wall bounce to centralized Fighter physics (Rule 1.2)
    super.update(opponent, ownerIndex, arena);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 5-PHASE GLACIAL KATANA COMBO (Rule 30)
  // ═════════════════════════════════════════════════════════════════════════
  _startSwordSwing(target, cfg = this._cfg()) {
    const nextStep = (this.swordComboStep === 1 && this.comboResetTimer > 0) ? 2 : 1;
    this.swordComboStep = nextStep;
    const minComboWindow = (cfg.swordCooldown ?? 34) + 35;
    this.comboResetTimer = Math.max(cfg.comboResetFrames ?? 95, minComboWindow);

    const p = nextStep === 2 ? 'hit2' : 'hit1';
    this.swordSwingLiftFrames = cfg[`${p}LiftFrames`] ?? 8;
    this.swordSwingHoldFrames = cfg[`${p}HoldFrames`] ?? 3;
    this.swordSwingStrikeFrames = cfg[`${p}StrikeFrames`] ?? (nextStep === 2 ? 7 : 6);
    this.swordSwingImpactLockFrames = cfg[`${p}ImpactLockFrames`] ?? (nextStep === 2 ? 7 : 6);
    const recF = cfg[`${p}RecoveryFrames`] ?? (nextStep === 2 ? 14 : 12);

    this.swordSwingMax = this.swordSwingLiftFrames + this.swordSwingHoldFrames + this.swordSwingStrikeFrames + this.swordSwingImpactLockFrames + recF;
    this.swordSwingTimer = this.swordSwingMax;
    this.swordSwingHitPause = cfg[`${p}HitPauseFrames`] ?? 3;
    this.swordSwingLunge = cfg[`${p}LungeSpeed`] ?? 6.8;
    this.swordSwingRecoil = cfg[`${p}RecoilKick`] ?? 2.4;
    this.swordSwingArc = cfg[`${p}ArcAngle`] ?? ((145 * Math.PI) / 180);
    this.swordSwingDamage = cfg[`${p}Damage`] ?? (nextStep === 2 ? 24 : 18);
    this.swordSwingKnockback = cfg[`${p}Knockback`] ?? (nextStep === 2 ? 8.5 : 5.5);
    this.swordSwingShake = cfg[`${p}ImpactShake`] ?? 4.0;
    this.swordHitDelivered = false;
    this.swordRecoilApplied = false;
    this.fractalFollowupSpawned = false;
    this.swordCooldownTimer = cfg.swordCooldown ?? 34;

    if (target) {
      this.swordSlashAngle = Math.atan2((target.y - (target.z || 0)) - (this.y - (this.z || 0)), target.x - this.x);
      this.gunAngle = this.swordSlashAngle;
    }
    this._playAudio('dash', 'Assets/Sound Effects/CarolSFX/carol_dash.wav', 0.45, 1.08);
  }

  _updateSwordSwing(primary, targets, cfg) {
    const totalF = this.swordSwingMax || 35;
    const elapsed = totalF - this.swordSwingTimer;
    const strikeStart = (this.swordSwingLiftFrames || 8) + (this.swordSwingHoldFrames || 3);
    const strikeEnd = strikeStart + (this.swordSwingStrikeFrames || 6);
    const lockEnd = strikeEnd + (this.swordSwingImpactLockFrames || 6);

    if (elapsed < strikeStart) {
      if (primary && primary.hp > 0) {
        this.swordSlashAngle = Math.atan2((primary.y - (primary.z || 0)) - (this.y - (this.z || 0)), primary.x - this.x);
        this.gunAngle = this.swordSlashAngle;
      }
    } else if (elapsed < strikeEnd) {
      const sp = (elapsed - strikeStart) / Math.max(1, this.swordSwingStrikeFrames || 6);
      const decay = Math.sin(sp * Math.PI);
      this.vx = Math.cos(this.swordSlashAngle) * (this.swordSwingLunge || 6.8) * decay;
      this.vy = Math.sin(this.swordSlashAngle) * (this.swordSwingLunge || 6.8) * decay;
      if (!this.swordHitDelivered && sp >= 0.50) {
        this._deliverSwordImpact(targets, cfg);
      }
    } else if (elapsed < lockEnd) {
      // Phase 4: Impact Lock — freeze forward motion cleanly
      if (!this.swordHitDelivered) {
        this._deliverSwordImpact(targets, cfg);
      }
      this.vx = 0;
      this.vy = 0;
    } else {
      // Phase 5: Recovery, physical backward recoil kick (Rule 30) & Fractal Slash Follow-Up (attacks//Ice_Slash)
      if (!this.swordRecoilApplied) {
        this.swordRecoilApplied = true;
        const kick = this.swordSwingRecoil || 2.4;
        this.vx -= Math.cos(this.swordSlashAngle) * kick;
        this.vy -= Math.sin(this.swordSlashAngle) * kick;
        if (!this.fractalFollowupSpawned && isSkillEnabled(cfg.enableBasicFractalFollowup, true)) {
          this.fractalFollowupSpawned = true;
          this._spawnBasicFractalFollowup(primary, cfg);
        }
      } else {
        this.vx *= 0.80;
        this.vy *= 0.80;
      }
    }

    this.swordSwingTimer--;
  }

  _deliverSwordImpact(targets, cfg) {
    if (this.swordHitDelivered) return;
    this.swordHitDelivered = true;

    const reach = (cfg.swordRange ?? 86) + (this.r || 25);
    const halfArc = (this.swordSwingArc || ((145 * Math.PI) / 180)) * 0.5;
    let landedAny = false;
    let passiveHitTarget = null;

    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      const dx = t.x - this.x;
      const dy = (t.y - (t.z || 0)) - (this.y - (this.z || 0));
      const dist = Math.hypot(dx, dy);
      if (dist > reach + (t.r || 25)) continue;
      const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - this.swordSlashAngle), Math.cos(Math.atan2(dy, dx) - this.swordSlashAngle)));
      if (diff <= halfArc) {
        const dealt = this._dealCarolDamage(t, this.swordSwingDamage || 18, { isMelee: true, incrementUlt: true });
        if (dealt) {
          landedAny = true;
          if (!passiveHitTarget) passiveHitTarget = t;
          const kb = this.swordSwingKnockback || 5.5;
          t.vx = (t.vx || 0) + Math.cos(this.swordSlashAngle) * kb;
          t.vy = (t.vy || 0) + Math.sin(this.swordSlashAngle) * kb;
          if (typeof t.applyTimeStop === 'function') {
            t.applyTimeStop(this.swordSwingHitPause || 3);
          }
          if (isSkillEnabled(cfg.enableDaggerHailstorm, true)) {
            const req = Math.max(1, cfg.daggerHailstormHitsRequired ?? 5);
            this.daggerHailBasicHits = Math.min(req, (this.daggerHailBasicHits || 0) + 1);
          }
        }
      }
    }

    // Rule 30: Layered fleshy slap + crisp Resolve blade cut audio
    this._playAudio('slice', 'Assets/Sound Effects/CarolSFX/carol_slice.mp3', 0.82);
    if (landedAny) {
      if (typeof audioSystem !== 'undefined' && audioSystem.playSFX) {
        audioSystem.playSFX('attack_fleshhit', 0.95);
      }
      if (this.swordComboStep === 2) {
        this._playAudio('impact', 'Assets/Sound Effects/CarolSFX/carol_impact.wav', 0.86);
      }
      const tipX = this.x + Math.cos(this.swordSlashAngle) * ((this.r || 25) * 2.4);
      const tipY = (this.y - (this.z || 0)) + Math.sin(this.swordSlashAngle) * ((this.r || 25) * 2.4);
      spawnSparks(tipX, tipY, 8, 'cyan', { color: '#BAE6FD' });
      this.swordHitTremorTimer = (this.swordSwingHitPause || 3) + 2;
      triggerGlobalScreenShake(this.swordSwingShake || 4.0, 8);
      if (passiveHitTarget) {
        this._tryTriggerDaggerHailPassive(passiveHitTarget, cfg);
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PASSIVE 4: DAGGER HAILSTORM (Triggers on 5th Basic Attack Damage Hit)
  // ═════════════════════════════════════════════════════════════════════════
  _tryTriggerDaggerHailPassive(target, cfg = this._cfg()) {
    if (!isSkillEnabled(cfg.enableDaggerHailstorm, true)) return false;
    if (!target || target.hp <= 0 || target.dead || target.isDead) return false;
    if (this._daggerHailSeq || (this.daggerHailPassiveCooldownTimer || 0) > 0) return false;
    const req = Math.max(1, cfg.daggerHailstormHitsRequired ?? 5);
    if ((this.daggerHailBasicHits || 0) < req) return false;

    this.daggerHailBasicHits = 0;
    this.daggerHailPassiveCooldownTimer = cfg.daggerHailstormPassiveCooldown ?? 0;
    const bounds = (typeof state !== 'undefined' && state.arena) || { x: 45, y: 240, width: 450, height: 450 };
    this._spawnDaggerHailstorm(target, bounds, cfg);
    return true;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PASSIVE 3: CAROL_HEAL / CRYO MEND (Once per match below HP threshold)
  // ═════════════════════════════════════════════════════════════════════════
  _tryCarolHeal(cfg = this._cfg()) {
    if (this.hasUsedCarolHeal || !isSkillEnabled(cfg.enableCarolHeal, true)) return false;
    if (this.hp <= 0 || this.dead || this.isDead) return false;
    const threshold = (this.maxHp || 360) * (cfg.carolHealThresholdRatio ?? 0.38);
    if (this.hp > threshold) return false;

    this.hasUsedCarolHeal = true;
    const amount = cfg.carolHealAmount ?? 55;
    const prevHp = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    const actualHeal = Math.max(0, Math.round(this.hp - prevHp));
    this._lastHealAmount = (this._lastHealAmount || 0) + actualHeal;
    this._healthBarHealTimer = 16;

    this.healBannerMax = cfg.carolHealShieldFrames ?? 36;
    this.healBannerTimer = this.healBannerMax;
    const healIFrames = cfg.carolHealInvincibilityFrames ?? 18;
    if (healIFrames > 0) this.invincibilityTimer = Math.max(this.invincibilityTimer || 0, healIFrames);
    const healRadius = cfg.carolHealShockwaveRadius ?? 96;
    if (healRadius > 0) this.activeShockwaveRipples.push({ x: this.x, y: this.y, maxRadius: healRadius, life: 20, maxLife: 20 });
    this.activeSpellRings.push({ x: this.x, y: this.y - (this.z || 0), life: 20, maxLife: 20 });
    this._triggerCastAnim('spell', 30);
    this._playAudio('spellcast', 'Assets/Sound Effects/CarolSFX/carol_spellcast.wav', 0.82);
    this._speak('I will not yield.', { duration: 95 });
    return true;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // UNIFIED SKILL 1: RESOLVE ARTS (Fractal Slash / Icicle Blizzard / Frost Gale / Quick Slash / Dagger+Fractal II)
  // ═════════════════════════════════════════════════════════════════════════
  _castRandomSkill1(target, bounds, cfg = this._cfg()) {
    const pool = [];
    if (isSkillEnabled(cfg.enableDaggerFractalCombo, true)) pool.push('dagger_fractal');
    if (isSkillEnabled(cfg.enableFractalSlash, true)) pool.push('fractal_slash');
    if (isSkillEnabled(cfg.enableIcicleBlizzard, true)) pool.push('icicle_blizzard');
    if (isSkillEnabled(cfg.enableFrostGale, true)) pool.push('frost_gale');
    if (isSkillEnabled(cfg.enableQuickSlash ?? cfg.enableIceSplitSlash, true)) pool.push('quick_slash');
    if (pool.length === 0) return false;

    const filtered = pool.length > 1 ? pool.filter(id => id !== this._activeSkill1Id) : pool;
    const chosen = filtered[Math.floor(Math.random() * filtered.length)];
    this._executeSkill1ById(chosen, target, bounds, cfg);
    this.skill1CooldownTimer = cfg.skill1Cooldown ?? 240;
    this.skill1CooldownMax = this.skill1CooldownTimer;
    return true;
  }

  _executeSkill1ById(id, target, bounds, cfg = this._cfg()) {
    this._activeSkill1Id = id;
    if (id === 'dagger_hailstorm') {
      this._activeSkill1Label = cfg.daggerHailstormSkillName || 'DAGGER HAILSTORM';
      this._spawnDaggerHailstorm(target, bounds, cfg);
    } else if (id === 'dagger_fractal') {
      this._activeSkill1Label = cfg.daggerFractalSkillName || 'DAGGER HAIL + FRACTAL II';
      this._spawnDaggerFractalCombo(target, bounds, cfg);
    } else if (id === 'fractal_slash') {
      this._activeSkill1Label = cfg.fractalSlashSkillName || 'FRACTAL SLASH';
      this._spawnFractalSlash(target, bounds, cfg);
    } else if (id === 'icicle_blizzard') {
      this._activeSkill1Label = cfg.icicleBlizzardSkillName || 'ICICLE BLIZZARD';
      this._spawnIcicleBlizzard(target, bounds, cfg);
    } else if (id === 'frost_gale') {
      this._activeSkill1Label = cfg.frostGaleSkillName || 'FROST GALE';
      this._spawnFrostGale(target, cfg);
    } else if (id === 'quick_slash' || id === 'ice_split') {
      this._activeSkill1Label = cfg.quickSlashSkillName || cfg.iceSplitSkillName || 'QUICK SLASH';
      this._spawnQuickSlash(target, bounds, cfg);
    }
  }

  // ── Skill 1A: attacks//Dagger_Hailstorm (Crescent Halo around Carol -> Pullback -> Delaylist Slide & Smooth Aim -> Reticle -> Stab) ──
  _spawnDaggerHailstorm(target, bounds, cfg, forcedCount = null, silentBanner = false, daggerOpts = null) {
    if (!target) return;
    const total = Math.max(1, forcedCount ?? cfg.daggerCount ?? 10);
    const isHoriz = this._daggerHailDirToggle;
    this._daggerHailDirToggle = !this._daggerHailDirToggle;

    // Resolve `Delaylist`: shuffled unique delay indices 1..total
    const delaySlots = [];
    for (let i = 1; i <= total; i++) delaySlots.push(i);
    for (let i = delaySlots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = delaySlots[i];
      delaySlots[i] = delaySlots[j];
      delaySlots[j] = tmp;
    }

    const lockedTargetX = target ? target.x : (bounds.x + bounds.width * 0.5);
    const lockedTargetY = target ? (target.y - (target.z || 0)) : (bounds.y + bounds.height * 0.5);
    const castAng = Math.atan2(lockedTargetY - (this.y - (this.z || 0)), lockedTargetX - this.x);
    this._daggerHailSeq = {
      total,
      spawned: 0,
      tick: 0,
      stepTicks: Math.max(1, daggerOpts?.spawnInterval ?? cfg.daggerSpawnIntervalFrames ?? 2),
      isHoriz,
      castAng,
      lockedTargetX,
      lockedTargetY,
      delaySlots,
      timing: total >= 12 ? 1.8 : 1.4,
      speedOverride: daggerOpts?.speed,
      damageOverride: daggerOpts?.damage,
    };

    this._spawnNextHailstormDagger(target, bounds, cfg);
    this._triggerCastMist(52);
    this._triggerCastAnim('stance', 44);
    if (!silentBanner) {
      spawnFloatingText(this.x, this.y - (this.r || 25) - 18, 'DAGGER HAILSTORM!', '#38BDF8');
    }
  }

  _updateDaggerHailSeq(target, bounds, cfg) {
    const seq = this._daggerHailSeq;
    if (!seq) return;
    seq.tick++;
    if (seq.spawned < seq.total && seq.tick % seq.stepTicks === 0) {
      this._spawnNextHailstormDagger(target, bounds, cfg);
    }
    if (seq.spawned >= seq.total) {
      this._daggerHailSeq = null;
    }
  }

  _spawnNextHailstormDagger(target, bounds, cfg) {
    const seq = this._daggerHailSeq;
    if (!seq || seq.spawned >= seq.total) return;

    const idx = seq.spawned++;
    const autoAim = cfg.daggerAutoAim === true;
    const tx = autoAim && target ? target.x : (seq.lockedTargetX ?? (target ? target.x : bounds.x + bounds.width * 0.5));
    const ty = autoAim && target ? (target.y - (target.z || 0)) : (seq.lockedTargetY ?? (target ? (target.y - (target.z || 0)) : bounds.y + bounds.height * 0.5));
    const cx = this.x || (bounds.x + bounds.width * 0.5);
    const cy = (this.y || (bounds.y + bounds.height * 0.5)) - (this.z || 0);
    const castAng = autoAim ? Math.atan2(ty - cy, tx - cx) : (seq.castAng ?? Math.atan2(ty - cy, tx - cx));
    const perpAng = castAng + Math.PI * 0.5;

    // Exact Resolve Dagger_Hailstorm_H_2 ellipse behind Carol's flank (`rx = 32, ry = 92` tilted along cast axis)
    const theta = (idx / Math.max(1, seq.total)) * Math.PI * 2;
    const backOffset = cfg.daggerBackOffset ?? 34;
    const haloRx = cfg.daggerHaloRx ?? 32;
    const haloRy = cfg.daggerHaloRy ?? 92;
    const anchorX = cx - Math.cos(castAng) * backOffset;
    const anchorY = cy - Math.sin(castAng) * backOffset;
    const localForward = Math.cos(theta) * haloRx;
    const localSide = Math.sin(theta) * haloRy;
    const rawX = anchorX + Math.cos(castAng) * localForward + Math.cos(perpAng) * localSide;
    const rawY = anchorY + Math.sin(castAng) * localForward + Math.sin(perpAng) * localSide;
    const startX = Math.max(bounds.x + 20, Math.min(bounds.x + bounds.width - 20, rawX));
    const startY = Math.max(bounds.y + 20, Math.min(bounds.y + bounds.height - 20, rawY));

    const delaySlot = seq.delaySlots[idx] || (idx + 1);
    const waitTicks = Math.max(5, Math.round((delaySlot * 6) / seq.timing));
    // Resolve slide-back slightly away from Battlebox (`-castAng`) while smoothing aim toward locked cast point
    const slideDirX = -Math.cos(castAng);
    const slideDirY = -Math.sin(castAng);
    const lockedAng = Math.atan2(ty - startY, tx - startX);

    this.activeDaggers.push({
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      angle: castAng,
      lockedAngle: lockedAng,
      lockedTargetX: tx,
      lockedTargetY: ty,
      stage: 'pullback',
      stageTick: 0,
      alpha: 0.05,
      spinIdx: 0,
      pullFrames: cfg.daggerPullbackFrames ?? 18,
      pullSpd: cfg.daggerPullbackSpeed ?? 1.8,
      waitTimer: waitTicks,
      slideFrames: cfg.daggerSlideFrames ?? 18,
      slideSpd: cfg.daggerSlideSpeed ?? 3.0,
      slideDirX,
      slideDirY,
      reticleTimer: 0,
      reticleMax: cfg.daggerReticleFrames ?? 14,
      aimTimer: 0,
      aimMax: cfg.daggerAimFrames ?? 34,
      speed: seq.speedOverride ?? cfg.daggerSpeed ?? 13.5,
      damage: seq.damageOverride ?? cfg.daggerDamage ?? 9,
      life: Math.max(15, cfg.daggerFlightLifeFrames ?? 90),
    });
    this._playAudio('knifeSpawn', 'Assets/Sound Effects/CarolSFX/carol_knife_spawn.wav', 0.58, 1.0);
  }

  // ── Skill 1F: 0:54-1:01 Resolve Combo (DaggerHail II Crescent + Multi-Wave FractalSlash II Triangle Lattice + Giant Crescent Slash) ──
  _spawnDaggerFractalCombo(target, bounds, cfg) {
    if (!target) return;
    const totalWaves = Math.max(1, cfg.daggerFractalWaves ?? 4);
    const interval = Math.max(18, cfg.daggerFractalWaveInterval ?? 34);
    const daggers = cfg.daggerFractalDaggers ?? 12;

    this._spawnDaggerHailstorm(target, bounds, cfg, daggers, true, {
      speed: cfg.daggerFractalDaggerSpeed ?? cfg.daggerSpeed ?? 13.5,
      damage: cfg.daggerFractalDaggerDamage ?? cfg.daggerDamage ?? 9,
      spawnInterval: cfg.daggerFractalDaggerSpawnIntervalFrames ?? cfg.daggerSpawnIntervalFrames ?? 2,
    });
    this._triggerCastMist(totalWaves * interval);
    this._triggerCastAnim('stance', interval + 10);

    this._daggerFractalSeq = {
      waveIdx: 1,
      totalWaves,
      timer: 0,
      interval,
    };

    // Wave 1 FractalSlash II immediately over opponent/arena
    this._emitComboFractalWave(target, bounds, cfg, 0, totalWaves);
    spawnFloatingText(this.x, this.y - (this.r || 25) - 18, 'DAGGER HAIL + FRACTAL II!', '#BAE6FD');
  }

  _updateDaggerFractalSeq(target, bounds, cfg) {
    const seq = this._daggerFractalSeq;
    if (!seq) return;
    seq.timer++;
    if (seq.timer >= seq.interval) {
      seq.timer = 0;
      const idx = seq.waveIdx++;
      this._emitComboFractalWave(target, bounds, cfg, idx, seq.totalWaves);
      if (seq.waveIdx >= seq.totalWaves) {
        this._daggerFractalSeq = null;
      }
    }
  }

  _emitComboFractalWave(target, bounds, cfg, waveIdx, totalWaves) {
    const cx = target ? target.x : (bounds.x + bounds.width * 0.5);
    const cy = target ? (target.y - (target.z || 0)) : (bounds.y + bounds.height * 0.5);
    const angleStep = cfg.daggerFractalWaveAngleStepRad ?? 0.52;
    const baseAng = Math.atan2(cy - (this.y - (this.z || 0)), cx - this.x) + waveIdx * angleStep;
    const expandRings = Math.max(0, cfg.daggerFractalExpandRings ?? 2);
    const alternateSpin = cfg.daggerFractalAlternateSpin ?? true;

    this._spawnFractalRingAndExpand({
      cx,
      cy,
      bounds,
      includeExpandRings: expandRings > 0,
      expandStepCount: expandRings,
      expandPerRing: Math.max(1, cfg.daggerFractalExpandPerRing ?? 6),
      expandRadiusRatio: cfg.daggerFractalExpandRadiusRatio ?? 0.36,
      expandDamageMultiplier: cfg.daggerFractalExpandDamageMultiplier ?? 0.72,
      ringCount: Math.max(1, cfg.daggerFractalRingCount ?? 3),
      warn: Math.max(4, cfg.daggerFractalWarnFrames ?? 22),
      active: Math.max(4, cfg.daggerFractalActiveFrames ?? 12),
      staggerFrames: Math.max(0, cfg.daggerFractalStaggerFrames ?? 3),
      expandStaggerFrames: Math.max(0, cfg.daggerFractalExpandStaggerFrames ?? 2),
      spinSpeedRad: cfg.daggerFractalSpinSpeedRad ?? 0.1745,
      spinDecay: cfg.daggerFractalSpinDecay ?? 1.25,
      length: cfg.daggerFractalSlashLength ?? 640,
      width: cfg.daggerFractalSlashWidth ?? 24,
      damage: cfg.daggerFractalSlashDamage ?? 10,
      castSlashFrames: cfg.daggerFractalCastSlashFrames ?? 6,
      streakCountPerSide: cfg.daggerFractalStreakCountPerSide ?? 3,
      shakeIntensity: cfg.daggerFractalShakeIntensity ?? 3.2,
      incrementUlt: true,
      baseAng,
      turnSign: alternateSpin ? (waveIdx % 2 === 0 ? 1 : -1) : 1,
    });
    this._playAudio('slashLine', 'Assets/Sound Effects/CarolSFX/carol_slash_line.wav', 0.78);
    // Hold waist katana stance while telegraph lattice winds up; _updateIceSplits triggers synced Up/Down cuts on detonation
    if (!this.swordSwingTimer && !this.isPermafrostActive) {
      const stanceHold = Math.max(4, cfg.daggerFractalStanceHoldFrames ?? 20);
      this._triggerCastAnim('stance', stanceHold);
      this._triggerCastMist(stanceHold + 8);
    }
  }

  // ── Skill 1B & Basic Follow-Up: attacks//Ice_Slash (Exact `ring(3)` + `expandring(6)` + `Turn /= 1.25` -> Parallel Triangle Grid) ──
  _spawnFractalRingAndExpand({
    cx,
    cy,
    bounds,
    includeExpandRings = true,
    expandStepCount = 2,
    expandPerRing = 6,
    expandRadiusRatio = 0.36,
    expandWidthOffset = -2,
    expandDamageMultiplier = 0.72,
    isBasicFollowup = false,
    ringCount = 3,
    warn = 24,
    active = 16,
    staggerFrames = 3,
    expandStaggerFrames = 2,
    spinSpeedRad = 0.1745,
    spinDecay = 1.25,
    length = 640,
    width = 24,
    damage = 14,
    castSlashFrames = 6,
    streakCountPerSide = 3,
    shakeIntensity = 3.2,
    incrementUlt = true,
    baseAng = 0,
    turnSign = 1,
  }) {
    const b = bounds || (typeof state !== 'undefined' && state.arena) || { x: 45, y: 240, width: 450, height: 450 };
    const pivotX = Math.max(b.x + 85, Math.min(b.x + b.width - 85, cx));
    const pivotY = Math.max(b.y + 85, Math.min(b.y + b.height - 85, cy));
    const starGroupId = ++this._fractalWebSeq;
    const maxLen = Math.max(length, Math.hypot(b.width, b.height) + 80);

    // Exact Resolve `Turn = ±10°, spin = 1.25`: sum = ±50.0° (0.8726 rad) locking lines dead still into parallel triangles
    const spinVel0 = spinSpeedRad * turnSign;
    const safeSpinDecay = Math.max(1.0, spinDecay);

    // Resolve costume 1 (effect1): center additive reticle pulse
    this.activeFractalBursts.push({
      kind: 'ring',
      x: pivotX,
      y: pivotY,
      angle: 0,
      vx: 0,
      vy: 0,
      life: 14,
      maxLife: 14,
    });

    const snapActive = Math.min(6, Math.max(4, active));

    // Resolve `ring(num)`: center lines rotating `180 / num`, staggered +3f per cut so each slash removes 1-by-1
    for (let i = 0; i < ringCount; i++) {
      const ang = baseAng + (i * Math.PI) / Math.max(1, ringCount);
      const wF = warn + i * staggerFrames;
      this.activeIceSplits.push({
        cx: pivotX,
        cy: pivotY,
        angle: ang,
        spinVel: spinVel0,
        spinDecay: safeSpinDecay,
        slashIdx: i,
        starGroupId,
        delayTimer: 0,
        warnTimer: wF,
        warnMax: wF,
        activeTimer: snapActive,
        activeMax: snapActive,
        length: maxLen,
        width,
        damage,
        castSlashFrames,
        streakCountPerSide,
        shakeIntensity,
        isFractal: true,
        isBasicFollowup,
        useStretch: true,
        incrementUlt,
        quietShake: i > 0,
        quietAudio: i % 2 === 1,
        hasHit: false,
      });
    }

    if (!includeExpandRings || expandStepCount <= 0) return;

    // Resolve `expandring(6)`: radial offset `move` + tangent `+90°`, each individual slash staggered 1-by-1 (+2f)
    const arenaSpan = Math.min(b.width, b.height);
    const moveStep = Math.round(arenaSpan * expandRadiusRatio); // * cos(50°) ≈ 104px perpendicular stripe spacing in 450px arena
    const perRing = Math.max(1, expandPerRing);
    for (let rIdx = 1; rIdx <= expandStepCount; rIdx++) {
      const moveDist = rIdx * moveStep;
      for (let i = 0; i < perRing; i++) {
        const radialAng = baseAng + Math.PI / perRing + (i * Math.PI * 2) / perRing;
        const chordAng = radialAng + Math.PI * 0.5; // ≡ {baseAng, baseAng+60°, baseAng+120°} mod 180°
        const seqSlot = ringCount + (rIdx - 1) * perRing + i;
        const wF = warn + 6 + (rIdx - 1) * 8 + i * expandStaggerFrames;
        this.activeIceSplits.push({
          cx: pivotX + Math.cos(radialAng) * moveDist,
          cy: pivotY + Math.sin(radialAng) * moveDist,
          angle: chordAng,
          spinVel: spinVel0,
          spinDecay: safeSpinDecay,
          slashIdx: seqSlot,
          starGroupId,
          delayTimer: 0,
          warnTimer: wF,
          warnMax: wF,
          activeTimer: snapActive,
          activeMax: snapActive,
          length: maxLen,
          width: Math.max(12, width + expandWidthOffset),
          damage: Math.max(1, Math.round(damage * expandDamageMultiplier)),
          castSlashFrames,
          streakCountPerSide,
          shakeIntensity,
          isFractal: true,
          isBasicFollowup,
          useStretch: true,
          incrementUlt,
          quietShake: true,
          quietAudio: i % 2 === 1,
          hasHit: false,
        });
      }
    }
  }

  _spawnBasicFractalFollowup(primary, cfg = this._cfg()) {
    const bounds = (typeof state !== 'undefined' && state.arena) || { x: 45, y: 240, width: 450, height: 450 };
    const fallbackX = this.x + Math.cos(this.swordSlashAngle || 0) * 60;
    const fallbackY = (this.y - (this.z || 0)) + Math.sin(this.swordSlashAngle || 0) * 60;
    const cx = primary && primary.hp > 0 ? primary.x : fallbackX;
    const cy = primary && primary.hp > 0 ? (primary.y - (primary.z || 0)) : fallbackY;

    const isHit2 = this.swordComboStep === 2;
    this._spawnFractalRingAndExpand({
      cx,
      cy,
      bounds,
      includeExpandRings: isHit2,
      isBasicFollowup: true,
      ringCount: Math.max(1, cfg.fractalFollowupCount ?? 3),
      warn: cfg.fractalFollowupWarnFrames ?? 20,
      active: cfg.fractalFollowupActiveFrames ?? 12,
      staggerFrames: Math.max(0, cfg.fractalFollowupStaggerFrames ?? 3),
      length: cfg.fractalFollowupLength ?? 680,
      width: cfg.fractalFollowupWidth ?? 22,
      damage: cfg.fractalFollowupDamage ?? 8,
      incrementUlt: false,
      baseAng: (this.swordSlashAngle || 0) + 0.30,
      turnSign: isHit2 ? -1 : 1,
    });
    this._playAudio('slashLine', 'Assets/Sound Effects/CarolSFX/carol_slash_line.wav', 0.60, 1.06);
  }

  _spawnFractalSlash(target, bounds, cfg) {
    if (!target) return;
    const cx = target.x;
    const cy = target.y - (target.z || 0);
    const warn = Math.max(4, cfg.fractalSlashWarnFrames ?? 24);
    const expandRings = Math.max(0, cfg.fractalSlashExpandRingCount ?? 2);
    this._spawnFractalRingAndExpand({
      cx,
      cy,
      bounds,
      includeExpandRings: expandRings > 0,
      expandStepCount: expandRings,
      expandPerRing: Math.max(1, cfg.fractalSlashExpandPerRing ?? 6),
      expandRadiusRatio: cfg.fractalSlashExpandRadiusRatio ?? 0.36,
      expandWidthOffset: cfg.fractalSlashExpandWidthOffset ?? -2,
      expandDamageMultiplier: cfg.fractalSlashExpandDamageMultiplier ?? 0.72,
      ringCount: Math.max(1, cfg.fractalSlashRingCount ?? 3),
      warn,
      active: cfg.fractalSlashActiveFrames ?? 16,
      staggerFrames: Math.max(0, cfg.fractalSlashStaggerFrames ?? 3),
      expandStaggerFrames: Math.max(0, cfg.fractalSlashExpandStaggerFrames ?? 2),
      spinSpeedRad: cfg.fractalSlashSpinSpeedRad ?? 0.1745,
      spinDecay: cfg.fractalSlashSpinDecay ?? 1.25,
      length: cfg.fractalSlashLength ?? 640,
      width: cfg.fractalSlashWidth ?? 26,
      damage: cfg.fractalSlashDamage ?? 14,
      castSlashFrames: cfg.fractalSlashCastSlashFrames ?? 6,
      streakCountPerSide: cfg.fractalSlashStreakCountPerSide ?? 3,
      shakeIntensity: cfg.fractalSlashShakeIntensity ?? 3.2,
      incrementUlt: true,
      baseAng: Math.atan2(cy - this.y, cx - this.x),
      turnSign: Math.random() < 0.5 ? 1 : -1,
    });
    this._playAudio('slashLine', 'Assets/Sound Effects/CarolSFX/carol_slash_line.wav', 0.80);
    this._triggerCastAnim('stance', warn);
    spawnFloatingText(this.x, this.y - (this.r || 25) - 18, 'FRACTAL SLASH!', '#38BDF8');
  }

  // ── Skill 1C: attacks//Icicle_Blizzard (Vertical 8-10 Shard Columns sweeping -120° / -60°) ──
  _spawnIcicleBlizzard(target, bounds, cfg) {
    const waves = cfg.blizzardWaveCount ?? 4;
    const waveInterval = Math.max(4, cfg.blizzardWaveIntervalFrames ?? 18);
    const secOffset = Math.max(0, cfg.blizzardSecondaryOffsetFrames ?? 6);
    const secRatio = cfg.blizzardSecondaryCountRatio ?? 0.75;
    const colCount = cfg.blizzardColumnCount ?? 8;
    const leftDeg = cfg.blizzardLeftDeg ?? 150;
    const rightDeg = cfg.blizzardRightDeg ?? 210;
    const slowSpd = cfg.blizzardSlowSpeed ?? 4.8;
    const fastSpd = cfg.blizzardFastSpeed ?? 7.2;

    for (let w = 0; w < waves; w++) {
      const deg = w % 2 === 0 ? leftDeg : rightDeg; // Resolve -120° (down-left) and -60° (up-left)
      this.activeBlizzardSpawners.push({
        deg,
        speed: w % 2 === 0 ? slowSpd : fastSpd,
        count: colCount,
        yJitter: (w - waves * 0.5) * 6,
        delay: w * waveInterval,
      });
      this.activeBlizzardSpawners.push({
        deg: deg === leftDeg ? rightDeg : leftDeg,
        speed: fastSpd,
        count: Math.max(1, Math.floor(colCount * secRatio)),
        yJitter: 14,
        delay: w * waveInterval + secOffset,
      });
    }
    this._playAudio('icespell', 'Assets/Sound Effects/CarolSFX/carol_icespell.wav', 0.72, 1.08);
    this._triggerCastAnim('point', 26);
    spawnFloatingText(this.x, this.y - (this.r || 25) - 18, 'ICICLE BLIZZARD!', '#BAE6FD');
  }

  // ── Skill 1D: attacks//Frost_Gale (Decelerating Flakes -> Exact Dual 6+6 Hexagon Burst, ZERO Pull) ──
  _spawnFrostGale(target, cfg) {
    if (!target) return;
    const baseAng = Math.atan2((target.y - (target.z || 0)) - this.y, target.x - this.x);
    const spd = cfg.galeSpeed ?? 7.8;
    const galeCount = Math.max(1, cfg.galeCount ?? 8);
    const spreadRad = cfg.galeSpreadRad ?? 0.20;
    const decel = cfg.galeDecelFactor ?? 0.90;
    const spawnOffset = cfg.galeSpawnRadiusOffset ?? 24;
    for (let i = 0; i < galeCount; i++) {
      const spread = (i - (galeCount - 1) * 0.5) * spreadRad;
      const ang = baseAng + spread;
      const flakeSpd = spd - i * 0.35;
      this.activeFrostGales.push({
        x: this.x + Math.cos(ang) * spawnOffset,
        y: (this.y - (this.z || 0)) + Math.sin(ang) * spawnOffset,
        vx: Math.cos(ang) * Math.max(3.5, flakeSpd),
        vy: Math.sin(ang) * Math.max(3.5, flakeSpd),
        decel,
        age: 0,
        alpha: 0.1,
        fuseRatio: 0,
        scale: 0.90 + (i % 2) * 0.15,
        life: Math.max(12, (cfg.galeDuration ?? 48) - i * 3),
        outerCount: cfg.galeOuterRingCount ?? 6,
        innerCount: cfg.galeInnerRingCount ?? 6,
        burstOffset: (i % 2) * 0.26,
      });
    }
    this._playAudio('stardrop', 'Assets/Sound Effects/CarolSFX/carol_stardrop.wav', 0.72);
    this._triggerCastAnim('point', 30);
    spawnFloatingText(this.x, this.y - (this.r || 25) - 18, 'FROST GALE!', '#BAE6FD');
  }

  // ── Skill 1E: attacks//Quick_Slash (Accelerating 9-Beat Telegraph -> Pause -> 10-Cut Barrage + Sheath, NO Daggers) ──
  _spawnQuickSlash(target, bounds, cfg) {
    if (!target) return;
    const xCross = this._quickSlashWaveToggle;
    this._quickSlashWaveToggle = !this._quickSlashWaveToggle;
    const beatCount = cfg.quickSlashBeatCount ?? 9;
    const barrageCount = cfg.quickSlashBarrageCount ?? 10;

    this._quickSlashSeq = {
      phase: 'beats',
      timer: 0,
      nextBeatAt: 0,
      beatIdx: 0,
      beatCount,
      barrageCount,
      xCross,
    };

    // Emit beat #0 synchronously and mark Sheath_Cut pose + dash afterimage
    const ang0 = Math.atan2((target.y - (target.z || 0)) - this.y, target.x - this.x);
    this.afterImages.push({ x: this.x, y: this.y, angle: ang0, timer: 18, maxTimer: 18 });
    this._emitQuickSlashCut(target.x, target.y - (target.z || 0), bounds, cfg, xCross);
    this._quickSlashSeq.beatIdx = 1;
    this._quickSlashSeq.nextBeatAt = Math.max(1, cfg.quickSlashInitialGapFrames ?? 12);
    this._triggerCastAnim('sheath', 26);

    spawnFloatingText(this.x, this.y - (this.r || 25) - 18, xCross ? 'RAPID SLASH III!' : 'RAPID SLASH II!', '#38BDF8');
    this._speak('Stand down.', { duration: 85 });
  }

  _updateQuickSlashSeq(target, bounds, cfg) {
    const seq = this._quickSlashSeq;
    if (!seq) return;
    seq.timer++;

    if (seq.phase === 'beats') {
      if (seq.timer >= seq.nextBeatAt) {
        const jitter = cfg.quickSlashJitterPx ?? 12;
        const tx = target ? target.x + (Math.random() - 0.5) * jitter : (bounds.x + bounds.width * 0.5);
        const ty = target ? (target.y - (target.z || 0)) + (Math.random() - 0.5) * jitter : (bounds.y + bounds.height * 0.5);
        this._emitQuickSlashCut(tx, ty, bounds, cfg, seq.xCross);
        seq.beatIdx++;
        if (seq.beatIdx >= seq.beatCount) {
          seq.phase = 'pause';
          seq.timer = 0;
        } else {
          // Resolve `Timeleft = 0.4`, decreasing by `-0.1s` each cut down to rapid ticks
          const initGap = Math.max(1, cfg.quickSlashInitialGapFrames ?? 12);
          const minGap = Math.max(1, cfg.quickSlashMinGapFrames ?? 3);
          const accel = Math.max(0, cfg.quickSlashGapAccelStep ?? 2);
          const gap = Math.max(minGap, initGap - seq.beatIdx * accel);
          seq.nextBeatAt = seq.timer + gap;
        }
      }
    } else if (seq.phase === 'pause') {
      const pauseMax = Math.max(1, cfg.quickSlashBarragePauseFrames ?? 18);
      if (seq.timer >= pauseMax) {
        // Resolve second loop: 10 simultaneous box-wide slashes + Sheath_Cut
        const len = Math.hypot(bounds.width, bounds.height) + 80;
        const margin = cfg.quickSlashBarrageMarginPx ?? 44;
        for (let i = 0; i < seq.barrageCount; i++) {
          const sx = bounds.x + margin + Math.random() * Math.max(40, bounds.width - margin * 2);
          const sy = bounds.y + margin + Math.random() * Math.max(40, bounds.height - margin * 2);
          this._pushSingleQuickCut(sx, sy, Math.random() * Math.PI * 2, len, cfg, i > 0);
          if (seq.xCross) {
            const crossAng = ((75 + Math.random() * 30) * Math.PI) / 180;
            this._pushSingleQuickCut(sx, sy, Math.random() * Math.PI * 2 + crossAng, len, cfg, true);
          }
        }
        this._playAudio('spearChoppy', 'Assets/Sound Effects/CarolSFX/carol_spear_choppy.wav', 0.72);
        this._playAudio('slashLine', 'Assets/Sound Effects/CarolSFX/carol_slash_line.wav', 0.78);
        this._playAudio('slice', 'Assets/Sound Effects/CarolSFX/carol_slice.mp3', 0.76, 1.05);
        this._triggerCastAnim('sheath', 24);
        this.afterImages.push({ x: this.x, y: this.y, angle: this.gunAngle || 0, timer: 18, maxTimer: 18 });
        this._quickSlashSeq = null;
      }
    }
  }

  _emitQuickSlashCut(cx, cy, bounds, cfg, xCross = false) {
    const len = Math.hypot(bounds.width, bounds.height) + 80;
    const ang = Math.random() * Math.PI * 2;
    this._pushSingleQuickCut(cx, cy, ang, len, cfg, false);
    if (xCross) {
      const pairDelta = ((75 + Math.random() * 30) * Math.PI) / 180;
      this._pushSingleQuickCut(cx, cy, ang + pairDelta, len, cfg, true);
    }
    this._playAudio('spearChoppy', 'Assets/Sound Effects/CarolSFX/carol_spear_choppy.wav', 0.64, 1.05);
    this._playAudio('slashLine', 'Assets/Sound Effects/CarolSFX/carol_slash_line.wav', 0.70, 1.04);
  }

  _pushSingleQuickCut(cx, cy, angle, len, cfg, quietShake = false) {
    const warn = cfg.iceSplitWarnFrames ?? 15;
    const active = cfg.iceSplitActiveFrames ?? 14;
    this.activeIceSplits.push({
      cx,
      cy,
      angle,
      spinVel: 0,
      delayTimer: 0,
      warnTimer: warn,
      warnMax: warn,
      activeTimer: active,
      activeMax: active,
      length: len,
      width: cfg.iceSplitWidth ?? 34,
      damage: cfg.iceSplitDamage ?? 11,
      isFractal: false,
      isRapidSlash: true,
      useStretch: true,
      quietShake,
      hasHit: false,
    });
  }

  _spawnIceSplitSlash(target, bounds, cfg) {
    return this._spawnQuickSlash(target, bounds, cfg);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SIGNATURE ULTIMATE: PERMAFROST // AQUA HEATBAR (100% Resolve Port)
  // ═════════════════════════════════════════════════════════════════════════
  _startPermafrost(target, bounds, cfg = this._cfg()) {
    this.permafrostHits = 0;
    this.isPermafrostActive = true;
    this.permafrostScreenAlpha = 0.05;
    this.permafrostFreezeHold = 0;

    const cx = target ? target.x : (bounds.x + bounds.width * 0.5);
    const cy = target ? (target.y - (target.z || 0)) : (bounds.y + bounds.height * 0.5);
    const castAng = Math.atan2(cy - this.y, cx - this.x);
    this.skillCastAngle = castAng;
    this.gunAngle = castAng;
    this.angle = castAng;

    this._permafrostSeq = {
      stage: 'charge',
      timer: 0,
      chargeMax: cfg.permafrostChargeFrames ?? 42,
      freezeMax: cfg.permafrostFreezeFrames ?? 30,
      cx,
      cy,
      crossCut1Spawned: false,
      crossCut2Spawned: false,
    };

    spawnFloatingText(this.x, this.y - (this.r || 25) - 24, 'PERMAFROST!', '#BAE6FD');
    this._speak('Frozen Resolve... Permafrost.', { duration: 120, force: true });
    this._triggerCastAnim('spell', 20);
    this.activeSpellRings.push({ x: this.x, y: this.y - (this.z || 0), life: 18, maxLife: 18 });
    this._playAudio('spellcast', 'Assets/Sound Effects/CarolSFX/carol_spellcast.wav', 0.78);
    this._playAudio('snowgrave', 'Assets/Sound Effects/CarolSFX/carol_snowgrave.wav', 0.88);
  }

  _updatePermafrostSeq(targets, bounds, cfg) {
    const seq = this._permafrostSeq;
    if (!seq) {
      this.isPermafrostActive = false;
      this.permafrostScreenAlpha = 0;
      this.permafrostFreezeHold = 0;
      return;
    }

    this.gunAngle = this.skillCastAngle;
    this.angle = this.skillCastAngle;
    seq.timer++;

    // Resolve Permafrost visual: high-speed wind-blown snowflakes sweeping right-to-left (`x: right -> left`)
    if (this.activeSnowDrops.length < 48) {
      const batch = seq.stage === 'freeze_wait' ? 1 : 2;
      for (let b = 0; b < batch; b++) {
        this.activeSnowDrops.push({
          x: bounds.x + bounds.width + 6,
          y: bounds.y + 8 + Math.random() * Math.max(20, bounds.height - 16),
          vx: -(12 + Math.random() * 14),
          vy: (Math.random() - 0.5) * 1.6,
          size: 8 + Math.floor(Math.random() * 6),
          life: 45,
          maxLife: 45,
        });
      }
    }

    const tx = targets[0] ? targets[0].x : seq.cx;
    const ty = targets[0] ? (targets[0].y - (targets[0].z || 0)) : seq.cy;

    if (seq.stage === 'charge') {
      this.permafrostScreenAlpha = Math.min(1, seq.timer / Math.max(1, seq.chargeMax * 0.7));
      if (seq.timer === 15 || seq.timer === 30) {
        this.activeSpellRings.push({ x: this.x, y: this.y - (this.z || 0), life: 18, maxLife: 18 });
      }

      // Resolve attacks//Ice_Slash during PERMAFROST: 2 opposing slow rotating `ring(1)` slashes -> Carol_Cut_1 / Carol_Cut_2
      const crossCutDmg = cfg.permafrostCrossCutDamage ?? 10;
      const crossCutWarn = Math.max(4, cfg.permafrostCrossCutWarnFrames ?? 18);
      const crossCutWidth = cfg.permafrostCrossCutWidth ?? 26;
      if (!seq.crossCut1Spawned && seq.timer >= 14) {
        seq.crossCut1Spawned = true;
        this._triggerCastAnim('upslash', 14);
        this._spawnFractalRingAndExpand({
          cx: tx, cy: ty, bounds,
          includeExpandRings: false, ringCount: 1,
          warn: crossCutWarn, active: 12, width: crossCutWidth, damage: crossCutDmg,
          incrementUlt: false, baseAng: this.skillCastAngle + 0.5, turnSign: 1,
        });
        this._playAudio('slashLine', 'Assets/Sound Effects/CarolSFX/carol_slash_line.wav', 0.72);
      }
      if (!seq.crossCut2Spawned && seq.timer >= 28) {
        seq.crossCut2Spawned = true;
        this._triggerCastAnim('downslash', 14);
        this._spawnFractalRingAndExpand({
          cx: tx, cy: ty, bounds,
          includeExpandRings: false, ringCount: 1,
          warn: crossCutWarn, active: 12, width: crossCutWidth, damage: crossCutDmg,
          incrementUlt: false, baseAng: this.skillCastAngle - 0.5, turnSign: -1,
        });
        this._playAudio('slashLine', 'Assets/Sound Effects/CarolSFX/carol_slash_line.wav', 0.72);
      }

      if (seq.timer >= seq.chargeMax) {
        // Resolve attacks//Quick_Slash PERMAFROST: spawn 20 frozen cuts around target + snap freeze (`Gamespeed = 0`)
        seq.stage = 'freeze_wait';
        seq.timer = 0;
        this.permafrostFreezeHold = seq.freezeMax;
        const slashCount = cfg.permafrostFrozenSlashCount ?? 20;
        const slashWidth = cfg.permafrostFrozenSlashWidth ?? 28;
        const slashSpread = cfg.permafrostFrozenSlashSpreadPx ?? 24;
        const len = Math.max(bounds.width, bounds.height) + 80;
        const dmg = cfg.permafrostSlashDamage ?? 7;

        for (let i = 0; i < slashCount; i++) {
          const offsetAng = Math.random() * Math.PI * 2;
          const cutAng = Math.random() * Math.PI * 2;
          this.activeIceSplits.push({
            cx: tx + Math.cos(offsetAng) * slashSpread,
            cy: ty + Math.sin(offsetAng) * slashSpread,
            angle: cutAng,
            spinVel: 0,
            delayTimer: 0,
            warnTimer: 16,
            warnMax: 16,
            activeTimer: 14,
            activeMax: 14,
            length: len,
            width: slashWidth,
            damage: dmg,
            isFractal: false,
            isRapidSlash: true,
            isFrozenWait: true,
            incrementUlt: false,
            quietShake: i > 0,
            hasHit: false,
          });
        }
        for (let i = 0; i < targets.length; i++) {
          const e = targets[i];
          if (typeof e.applyTimeStop === 'function') e.applyTimeStop(seq.freezeMax);
          else if (typeof e.applyFreeze === 'function') e.applyFreeze(seq.freezeMax);
        }
        this._playAudio('spearChoppy', 'Assets/Sound Effects/CarolSFX/carol_spear_choppy.wav', 0.74);
        this._playAudio('permafrostSnap', 'Assets/Sound Effects/CarolSFX/carol_permafrost_snap.wav', 0.82);
      }
    } else if (seq.stage === 'freeze_wait') {
      if (this.permafrostFreezeHold > 0) this.permafrostFreezeHold--;
      if (seq.timer >= seq.freezeMax) {
        // Release all 20 frozen Quick_Slash lines simultaneously + apply Aqua Heatbar & knockback finisher
        for (let i = 0; i < this.activeIceSplits.length; i++) {
          const sp = this.activeIceSplits[i];
          if (sp.isFrozenWait) {
            sp.isFrozenWait = false;
            sp.warnTimer = 2;
          }
        }
        this._finishPermafrostStorm(targets, { cx: tx, cy: ty }, cfg);
      }
    }
  }

  _finishPermafrostStorm(targets, seq, cfg) {
    const swRadius = cfg.permafrostFinisherShockwaveRadius ?? 210;
    if (swRadius > 0) this.activeShockwaveRipples.push({ x: seq.cx, y: seq.cy, maxRadius: swRadius, life: 26, maxLife: 26 });
    this.afterImages.push({ x: this.x, y: this.y, angle: this.skillCastAngle, timer: 20, maxTimer: 20 });
    this._triggerCastAnim('sheath', 24);
    this._playAudio('slice', 'Assets/Sound Effects/CarolSFX/carol_slice.mp3', 0.80, 1.04);
    this._playAudio('cut', 'Assets/Sound Effects/CarolSFX/carol_cut.wav', 0.88);
    this._playAudio('impact', 'Assets/Sound Effects/CarolSFX/carol_impact.wav', 0.84);
    const finShake = cfg.permafrostFinisherShakeIntensity ?? 8.5;
    if (finShake > 0) triggerGlobalScreenShake(finShake, 12);

    const finDmg = cfg.permafrostFinisherDamage ?? 28;
    const finKb = cfg.permafrostKnockback ?? 12.5;
    const freezeDur = cfg.permafrostFinisherFreezeFrames ?? 28;
    const finFreezeChance = cfg.permafrostFinisherFreezeChance ?? 1.0;
    const aquaDur = cfg.aquaHeatbarDuration ?? 150;
    for (let i = 0; i < targets.length; i++) {
      const e = targets[i];
      this._dealCarolDamage(e, finDmg, { isAOE: true, isGuaranteedHit: true, frostCount: 2 });
      if (isSkillEnabled(cfg.enableAquaHeatbar, true) && e.hp > 0) {
        this.aquaChilledTargets.set(e, { timer: aquaDur, maxTimer: aquaDur });
      }
      if (freezeDur > 0 && finFreezeChance > 0 && Math.random() < finFreezeChance) {
        if (typeof e.applyFreeze === 'function') e.applyFreeze(freezeDur);
        else if (typeof e.applyTimeStop === 'function') e.applyTimeStop(freezeDur);
      }
      const pushA = Math.atan2(e.y - this.y, e.x - this.x);
      e.vx = (e.vx || 0) + Math.cos(pushA) * finKb;
      e.vy = (e.vy || 0) + Math.sin(pushA) * finKb;
    }
    this._permafrostSeq = null;
    this.isPermafrostActive = false;
    this.permafrostScreenAlpha = 0;
    this.permafrostFreezeHold = 0;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDERING PIPELINE (Rules 20, 21, 30, 32, 35)
  // ═════════════════════════════════════════════════════════════════════════
  drawBody(ctx) {
    drawCarolSkin(ctx, this);
  }

  draw(ctx) {
    const arena = (typeof state !== 'undefined' && state.arena) ? state.arena : null;

    // 1. Frost afterimages, Ice Split / Fractal Star Web lines & Resolve effect3/4/5 starbursts
    for (let i = 0; i < this.afterImages.length; i++) {
      const ai = this.afterImages[i];
      const alpha = (ai.timer / Math.max(1, ai.maxTimer || 18)) * 0.45;
      drawCarolGhostSkin(ctx, this, ai.x, ai.y, ai.angle, alpha);
    }
    drawCarolIceSplitLines(ctx, this.activeIceSplits, arena);
    // Unclipped flying screen-wide `effect4` & `effect5` slash VFX (matches Resolve zero-clipbox bursts)
    drawCarolFractalBursts(ctx, this.activeFractalBursts);

    // 2. Resolve swirling frost mist + Cspell magic pulses behind body + Carol Body Circle + Cryo Mend Barrier (Rule 32)
    drawCarolCastMist(ctx, this);
    drawCarolSpellPulses(ctx, this.activeSpellRings);
    this.drawBody(ctx);
    drawCarolCryoMendAura(ctx, this);

    // 3. Frost Katana, Canonical Lower-Flank Hands & Slash Ribbon (Rule 20 & Rule 30)
    drawCarolKatanaAndSlashVFX(ctx, this);

    // 4. Daggers, Dagger Trails, Snowflakes, Icicle Shards, Aqua Heatbar & Permafrost Snow/Ripples
    drawCarolDaggerTrails(ctx, this.activeDaggerTrails, arena);
    for (let i = 0; i < this.activeFrostGales.length; i++) {
      drawCarolFrostGale(ctx, this.activeFrostGales[i]);
    }
    for (let i = 0; i < this.activeDaggers.length; i++) {
      drawCarolFrostDagger(ctx, this.activeDaggers[i]);
    }
    for (let i = 0; i < this.activeIcicles.length; i++) {
      drawCarolIcicleShard(ctx, this.activeIcicles[i]);
    }
    drawCarolAquaHeatbarChill(ctx, this.aquaChilledTargets);
    drawCarolPermafrostVFX(ctx, this, this.activeShockwaveRipples, this.activeSnowDrops, arena);

    // 5. Rule 21 Mandatory In-Game Overhead HP & Freeze Timers + Deltarune Speech Bubble
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
    drawSansSpeechBubble(ctx, this);
  }
}
