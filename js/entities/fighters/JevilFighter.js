// ───────────────────────────────────────────────────────────────────────────
// JEVIL (Deltarune Ch.1 Secret Boss) — Full Boss Combat Entity Class
// Adheres strictly to:
// - Rule 1.1: Freeze & TimeStop Early Exits
// - Rule 1.2: Centralized Physics via super.update()
// - Rule 1.4: Continuous 360° Aiming & Committed Cast Angle Lock
// - Rule 18: Unified Theme Color (#A855F7) & Toggle Gating
// - Rule 20: Canonical Weapon Grip (Single-Source Hand)
// - Rule 21: In-Game Overlay HP & Status Drawing (drawHealth + drawFreezeTimer)
// - Rule 23: Basic Projectile Suppression (shoot override)
// - Rule 24: Universal Character Body Model Scale (preserve super(def) scaled r)
// - Rule 25: Non-Freezing Active Visual Effects Standard (top-of-update decay)
// - Rule 30: 5-Phase Melee Kinematics & Impact Lock Physics
// - Rule 32: World-Space Skin Drawing & 2.0px Outer Black Outline
// ───────────────────────────────────────────────────────────────────────────

import { Fighter, applyDamageToTarget, isSkillEnabled } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { jevilConfig } from '../../configs/characters/jevilConfig.js';
import { state, spawnFloatingText, triggerGlobalScreenShake } from '../../core/state.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { spawnSparks } from '../../graphics/particles/sparkEffect.js';
import { drawJevilSkin, drawJevilGhostSkin } from '../../graphics/fighters/jevilSkin.js';
import { resetSpeechState, triggerFighterSpeech, updateFighterSpeech, tickFighterIntroAndWinSpeech } from '../../systems/undertaleSpeech.js';
import { drawSansSpeechBubble } from '../../graphics/weapons/sansWeaponGraphics.js';
import {
  drawJevilDevilsknife,
  drawJevilSuitBullet,
  drawJevilSuitBomb,
  drawJevilSpinningScythe,
  drawJevilMerryGoRound,
  drawJevilFinalChaosRipples,
} from '../../graphics/weapons/jevilWeaponGraphics.js';

export class JevilFighter extends Fighter {
  constructor(def = {}) {
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.jevil)
      ? CONFIG.jevil
      : jevilConfig;

    // Rule 24: Preserve scaled radius from super(def); NEVER overwrite this.r afterward
    super({
      ...def,
      r: def.r ?? cfg.r ?? 25,
      radius: def.radius ?? cfg.radius ?? 25,
      hp: def.hp ?? cfg.hp ?? 520,
      maxHp: def.maxHp ?? cfg.maxHp ?? 520,
      speed: def.speed ?? cfg.speed ?? 6.5,
      damage: def.damage ?? cfg.basicAttackDamage ?? 25,
      cooldown: def.cooldown ?? cfg.basicAttackCooldown ?? 46,
      color: def.color || cfg.color || '#A855F7',
    });

    this.characterId = 'jevil';
    this.type = 'jevil';
    this.name = def?.name || cfg.name || 'Jevil';
    this.displayName = def?.displayName || cfg.displayName || 'JEVIL';
    this.grade = cfg.grade || 'SS';
    this.title = cfg.title || 'The Jester of Chaos';
    this.color = cfg.color || '#A855F7';
    this.themeColor = cfg.themeColor || '#A855F7';
    this.secondaryColor = cfg.secondaryColor || '#FACC15';
    this.damageNumberColor = cfg.damageNumberColor || '#A855F7';
    this.moveSpeed = def.moveSpeed ?? cfg.moveSpeed ?? cfg.speed ?? 6.5;
    this.speed = this.moveSpeed;

    this._initJevilState(cfg);
  }

  _cfg() {
    return (typeof CONFIG !== 'undefined' && CONFIG.jevil)
      ? CONFIG.jevil
      : jevilConfig;
  }

  _registerCooldownExclusions() {
    if (!this.skillManager || !this.skillManager.cooldownKeyMap) return;
    const keys = [
      'chaosWarpCooldownTimer',
      'basicAttackCooldownTimer',
      'skill1CooldownTimer',
      'finalChaosCooldownTimer',
    ];
    for (const k of keys) {
      this.skillManager.cooldownKeyMap.set(k, true);
    }
  }

  _initJevilState(cfg = this._cfg()) {
    this._vfxTick = 0;
    this._afterImageTick = 0;
    this._afterImageTintIndex = 0;
    this.afterImages = [];
    this.trueChaosAwakened = false;

    // Passive: Chaos Warp + Counter Spades
    this.chaosWarpCooldownTimer = cfg.chaosWarpInitialCooldown ?? 30;

    // Basic Attack: 5-Phase Devilsknife Cleave + Alternating Suit Volleys
    this.basicAttackCooldownTimer = cfg.basicAttackInitialCooldown ?? 16;
    this.isMeleeSwinging = false;
    this.meleePhase = 0;
    this.meleePhaseTimer = 0;
    this.meleePhaseMaxTimer = 1;
    this.meleePhaseProgress = 0;
    this.meleeComboFlip = false;
    this.meleeHitRegistered = false;
    this.meleeCastAngle = 0;
    this._basicPatternStep = 0;
    this.shootCooldownMax = 0;
    this.shootCooldown = 999999;

    // Unified Randomized Skill 1 (6 Canon Attacks)
    this.skill1CooldownTimer = cfg.skill1InitialCooldown ?? 80;
    this.skill1CooldownMax = cfg.skill1Cooldown ?? 210;
    this._activeSkill1Id = null;
    this._activeSkill1Label = null;
    this.isSkill1Channeling = false;

    this.activeSuitBullets = [];
    this.activeSuitBombs = [];
    this.activeCarouselScythes = [];
    this.activeCarouselHorses = [];
    this._carouselSeq = null;
    this._diamondBarrageSeq = null;
    this._metamorphosisSeq = null;

    // Ultimate: FINAL CHAOS // NEO CHAOS
    this.finalChaosHits = 0;
    this.isFinalChaosActive = false;
    this.finalChaosCooldownTimer = cfg.finalChaosCooldown ?? 0;
    this._finalChaosSeq = null;
    this.activeChaosRipples = [];
    this.skillCastAngle = 0;

    resetSpeechState(this);
    this._registerCooldownExclusions();
  }

  reset() {
    super.reset();
    this._initJevilState(this._cfg());
  }

  _playAudio(key, fallbackPath, defaultVol = 0.78, speed = 1.0) {
    if (typeof audioSystem === 'undefined' || !audioSystem.playSFX) return;
    const cfg = this._cfg();
    const src = cfg.sounds?.[key] || fallbackPath;
    const vol = cfg.soundVolumes?.[key] ?? defaultVol;
    audioSystem.playSFX(src, vol, speed, 0);
  }

  /**
   * Rule 23: Suppress base generic bullet projectiles.
   */
  shoot() {
    // Intentionally empty: Jevil attacks via Devilsknife cleave & suit bullet-hell patterns.
  }

  /**
   * Rule 1.4: Lock aim during melee strike & Final Chaos sequence.
   */
  canAim() {
    if (this.isFinalChaosActive) return false;
    if (this.isMeleeSwinging && this.meleePhase >= 2 && this.meleePhase <= 4) return false;
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

  _dealJevilDamage(target, amount, opts = {}) {
    if (!target || target.hp <= 0 || target.dead || target.isDead) return false;
    if (target.invulnerable) return false;
    const mult = this.trueChaosAwakened ? 1.15 : 1.0;
    const scaledAmt = Math.max(1, Math.round(amount * mult));
    // Preserve simultaneous enemy active casts cleanly (skipInterrupt)
    const damageOpts = { skipInterrupt: true, ...opts };
    const dealt = applyDamageToTarget(target, scaledAmt, this, damageOpts);
    if (dealt && opts.incrementUlt && !this.isFinalChaosActive) {
      const req = Math.max(1, this._cfg().finalChaosHitsRequired ?? 4);
      this.finalChaosHits = Math.min(req, (this.finalChaosHits || 0) + 1);
    }
    return Boolean(dealt);
  }

  takeDamage(amount, attacker, opts = {}) {
    const cfg = this._cfg();
    // Passive Chaos Warp Counter: on hit when off cooldown, hop away + counter-fire Spade Aces!
    const isFrozen =
      (this.timeStopTimer || 0) > 0 || (this.hitStunTimer || 0) > 0 ||
      (this.paralyzeTimer || 0) > 0 || this.isChainedByMakima || this.isTargetOfAmbush;
    if (
      isSkillEnabled(cfg.enableChaosWarp, true) &&
      !isFrozen && !this._metamorphosisSeq && !this.isFinalChaosActive &&
      (this.chaosWarpCooldownTimer || 0) <= 0 &&
      amount > 0 && !opts.isHeal && !opts.isDoT && !opts.isGuaranteedHit && !opts.bypassEvade
    ) {
      this._triggerChaosWarp(attacker || { x: this.x + 80, y: this.y }, cfg, true);
      return false;
    }

    const dealt = super.takeDamage(amount, attacker, opts);
    if (this.hp <= 0) {
      this.interruptAttacks(true);
      return dealt;
    }
    if (dealt && this.hp > 0 && Math.random() < 0.35) {
      const k = Math.random() < 0.5 ? 'hit1' : 'hit2';
      this._playAudio(k, `Assets/Sound Effects/Jevil/jevil_${k === 'hit1' ? 'hit_1' : 'hit_2'}.wav`, 0.72);
    }
    return dealt;
  }

  interruptAttacks(forceCancelAll = false) {
    if (!forceCancelAll && typeof this.isSkillPreservedInStasis === 'function' && this.isSkillPreservedInStasis()) {
      return;
    }
    if (this.isMeleeSwinging && (this.meleePhase <= 2 || forceCancelAll)) {
      this.isMeleeSwinging = false;
      this.meleePhase = 0;
      this.meleePhaseTimer = 0;
      this.meleePhaseProgress = 0;
    }
    if (forceCancelAll) {
      this.isSkill1Channeling = false;
      this.isFinalChaosActive = false;
      this._finalChaosSeq = null;
      this._carouselSeq = null;
      this._diamondBarrageSeq = null;
      this._metamorphosisSeq = null;
      this.activeCarouselScythes.length = 0;
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

    for (let i = this.afterImages.length - 1; i >= 0; i--) {
      this.afterImages[i].timer--;
      if (this.afterImages[i].timer <= 0) this.afterImages.splice(i, 1);
    }

    for (let i = this.activeChaosRipples.length - 1; i >= 0; i--) {
      this.activeChaosRipples[i].life--;
      if (this.activeChaosRipples[i].life <= 0) this.activeChaosRipples.splice(i, 1);
    }

    // Suit Bullets (Spade Ringaround, Diamond/Club Barrage, Bomb Bursts)
    for (let i = this.activeSuitBullets.length - 1; i >= 0; i--) {
      const b = this.activeSuitBullets[i];
      if (b.holdTimer && b.holdTimer > 0) {
        b.holdTimer--;
        if (b.holdTimer === 0 && b.target && b.target.hp > 0) {
          const a = Math.atan2(b.target.y - b.y, b.target.x - b.x);
          const spd = b.launchSpeed ?? 11.4;
          b.vx = Math.cos(a) * spd;
          b.vy = Math.sin(a) * spd;
          b.angle = a;
        }
        continue;
      }
      b.x += b.vx;
      b.y += b.vy;
      b.life--;
      if (b.spinVel) b.angle += b.spinVel;
      for (const e of enemies) {
        if (b.hitSet.has(e)) continue;
        if (Math.hypot(e.x - b.x, e.y - b.y) <= (e.r || 25) + 14) {
          b.hitSet.add(e);
          this._dealJevilDamage(e, b.damage, { isProjectile: true, incrementUlt: Boolean(b.incrementUlt) });
          spawnSparks(e.x, e.y, 4, 'purple', { color: '#A855F7' });
          b.life = 0;
          break;
        }
      }
      if (b.life <= 0 || b.x < bounds.x - 60 || b.x > bounds.x + bounds.width + 60 || b.y < bounds.y - 60 || b.y > bounds.y + bounds.height + 60) {
        this.activeSuitBullets.splice(i, 1);
      }
    }

    // Chaos Suit Bombs -> Detonate into 8-Way Radial Suit Bullet Bursts
    const suits = ['heart', 'diamond', 'club', 'spade'];
    for (let i = this.activeSuitBombs.length - 1; i >= 0; i--) {
      const bomb = this.activeSuitBombs[i];
      bomb.age = (bomb.age || 0) + 1;
      if (bomb.y < bomb.targetY) {
        bomb.y = Math.min(bomb.targetY, bomb.y + (bomb.dropSpeed || 7.6));
      } else {
        bomb.fuseTimer--;
        if (bomb.fuseTimer <= 0) {
          this._playAudio('explosion', 'Assets/Sound Effects/Attacks/explosion.mp3', 0.30);
          const blastR = cfg.suitBombBlastRadius ?? 72;
          const directDmg = cfg.suitBombDirectDamage ?? 18;
          for (const e of enemies) {
            if (Math.hypot(e.x - bomb.x, e.y - bomb.y) <= blastR + (e.r || 25)) {
              this._dealJevilDamage(e, directDmg, { isAOE: true });
            }
          }
          const shardSpd = cfg.suitBombShardSpeed ?? 9.0;
          const shardDmg = cfg.suitBombShardDamage ?? 11;
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2 + bomb.age * 0.15;
            this.activeSuitBullets.push({
              x: bomb.x,
              y: bomb.y,
              vx: Math.cos(a) * shardSpd,
              vy: Math.sin(a) * shardSpd,
              angle: a,
              suit: suits[(k + bomb.age) % suits.length],
              damage: shardDmg,
              life: 54,
              scale: 0.78,
              hitSet: new Set(),
            });
          }
          this.activeSuitBombs.splice(i, 1);
        }
      }
    }

    // Merry-Go-Round Carousel Waves (Sinusoidal Arena Sweeps)
    for (let i = this.activeCarouselHorses.length - 1; i >= 0; i--) {
      const h = this.activeCarouselHorses[i];
      h.age = (h.age || 0) + 1;
      h.x += h.vx;
      h.y = h.baseY + Math.sin(h.age * 0.16 + h.phase) * 34;
      h.life--;
      for (const e of enemies) {
        if (h.hitSet.has(e)) continue;
        if (Math.hypot(e.x - h.x, e.y - h.y) <= (e.r || 25) + 18) {
          h.hitSet.add(e);
          this._dealJevilDamage(e, h.damage || 15, { isProjectile: true });
          spawnSparks(e.x, e.y, 4, 'purple', { color: '#FACC15' });
        }
      }
      if (h.life <= 0 || h.x < bounds.x - 65 || h.x > bounds.x + bounds.width + 65) {
        this.activeCarouselHorses.splice(i, 1);
      }
    }

    // Spinning Devilsknife Scythes (Carousel & Final Chaos Rain)
    if (this._carouselSeq) {
      const seq = this._carouselSeq;
      seq.timer++;
      const total = cfg.carouselOrbitFrames ?? 72;
      const p = Math.min(1, seq.timer / total);
      const startR = cfg.carouselStartRadius ?? 150;
      const minR = cfg.carouselMinRadius ?? 42;
      const curR = startR - (startR - minR) * Math.sin(p * Math.PI);
      seq.rot += 0.125;

      const carouselScythes = this.activeCarouselScythes.filter(s => !s.crimson);
      for (let i = 0; i < carouselScythes.length; i++) {
        const s = carouselScythes[i];
        const a = seq.rot + (i / Math.max(1, carouselScythes.length)) * Math.PI * 2;
        s.x = seq.cx + Math.cos(a) * curR;
        s.y = seq.cy + Math.sin(a) * curR;
        s.spinAngle += 0.28;
      }
      if (seq.timer >= total) {
        this._carouselSeq = null;
        this.isSkill1Channeling = false;
        this.activeCarouselScythes = this.activeCarouselScythes.filter(s => s.crimson);
      }
    }

    for (let i = this.activeCarouselScythes.length - 1; i >= 0; i--) {
      const sc = this.activeCarouselScythes[i];
      sc.spinAngle = (sc.spinAngle || 0) + 0.30;
      if (sc.vx || sc.vy) {
        sc.x += sc.vx;
        sc.y += sc.vy;
      }
      sc.age = (sc.age || 0) + 1;
      if (sc.age % 7 === 0) {
        for (const e of enemies) {
          if (Math.hypot(e.x - sc.x, e.y - sc.y) <= (e.r || 25) + (sc.hitR || 26)) {
            this._dealJevilDamage(e, sc.damage || 16, { isAOE: true });
            spawnSparks(e.x, e.y, 4, 'purple', { color: sc.crimson ? '#FF1E4D' : '#A855F7' });
          }
        }
      }
      if (sc.life !== undefined) {
        sc.life--;
        if (sc.life <= 0) this.activeCarouselScythes.splice(i, 1);
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
    // Phase 2 Awakening below 50% HP: TRUE CHAOS!
    if (!this.trueChaosAwakened && this.hp > 0 && this.hp < this.maxHp * 0.5) {
      this.trueChaosAwakened = true;
      spawnFloatingText(this.x, this.y - (this.r || 25) - 20, 'TRUE CHAOS!', '#FACC15');
      this._playAudio('metamorphosis', 'Assets/Sound Effects/Jevil/metamorphosis.wav', 0.85);
      triggerFighterSpeech(this, 'TRUE AND NEO CHAOS!', { duration: 120, force: true, preserveCase: true, borderColor: '#A855F7', blipSpeed: 1.25 });
    }

    const haste = this.trueChaosAwakened ? 2 : 1;
    if (this.chaosWarpCooldownTimer > 0) this.chaosWarpCooldownTimer--;
    if (this.basicAttackCooldownTimer > 0) this.basicAttackCooldownTimer = Math.max(0, this.basicAttackCooldownTimer - haste);
    if (this.skill1CooldownTimer > 0) this.skill1CooldownTimer = Math.max(0, this.skill1CooldownTimer - haste);
    if (this.finalChaosCooldownTimer > 0) this.finalChaosCooldownTimer--;

    this.speed = (cfg.moveSpeed ?? cfg.speed ?? 6.5) * (this.trueChaosAwakened ? 1.18 : 1.0);

    // Chromatic Jester Afterimages
    const speedMag = Math.hypot(this.vx || 0, this.vy || 0);
    this._afterImageTick++;
    if (speedMag >= (cfg.afterImageMinSpeed ?? 4.4) && this._afterImageTick % (cfg.afterImageInterval ?? 3) === 0) {
      this._afterImageTintIndex = (this._afterImageTintIndex + 1) % 3;
      this.afterImages.push({
        x: this.x,
        y: this.y,
        angle: this.gunAngle || 0,
        timer: cfg.afterImageLife ?? 20,
        maxTimer: cfg.afterImageLife ?? 20,
        tintIndex: this._afterImageTintIndex,
      });
    }

    const targets = this._getAllEnemyTargets(opponent);
    const primaryTarget = targets[0] || null;
    tickFighterIntroAndWinSpeech(this, primaryTarget || opponent, {
      introText: 'CHAOS, CHAOS! LET THE GAMES BEGIN!',
      winText: 'BYE-BYE! WHAT FUN WE HAD!',
      speechStyle: { preserveCase: true, borderColor: '#A855F7', blipSpeed: 1.25 },
    });
    if (this.canAim() && primaryTarget) {
      this.aim(primaryTarget);
    }

    if (this.isMeleeSwinging) {
      this._updateMeleeSwing(targets, cfg);
    }
    if (this._diamondBarrageSeq) {
      this._updateDiamondBarrage(primaryTarget, arena, cfg);
    }
    if (this._metamorphosisSeq) {
      this._updateMetamorphosisSeq(targets, arena, cfg);
    }
    if (this.isFinalChaosActive) {
      this._updateFinalChaosSeq(targets, arena, cfg);
    }

    const isBusy = this.isMeleeSwinging || this.isFinalChaosActive || this.isSkill1Channeling;
    if (!isBusy && primaryTarget) {
      const dist = Math.hypot(primaryTarget.x - this.x, primaryTarget.y - this.y);
      const reqHits = Math.max(1, cfg.finalChaosHitsRequired ?? 4);

      if (
        isSkillEnabled(cfg.enableFinalChaos, true) &&
        this.finalChaosHits >= reqHits &&
        this.finalChaosCooldownTimer <= 0 &&
        dist <= (cfg.finalChaosTriggerRange ?? 360)
      ) {
        this._startFinalChaos(primaryTarget, arena, cfg);
      } else if (isSkillEnabled(cfg.enableSkill1, true) && this.skill1CooldownTimer <= 0 && this._castRandomSkill1(primaryTarget, arena, cfg)) {
        // Skill 1 triggered cleanly
      } else if (isSkillEnabled(cfg.enableDevilsknifeBasic, true) && this.basicAttackCooldownTimer <= 0 && dist <= (cfg.basicAttackReach ?? 180)) {
        this._startBasicCleave(primaryTarget, cfg);
      } else if (isSkillEnabled(cfg.enableChaosWarp, true) && this.chaosWarpCooldownTimer <= 0 && dist > 110) {
        this._triggerChaosWarp(primaryTarget, cfg, false);
      }
    }

    // Rule 1.2: Centralized physics & wall bounce
    super.update(opponent, ownerIndex, arena);
  }

  _triggerChaosWarp(target, cfg, counterFire = false) {
    this.chaosWarpCooldownTimer = cfg.chaosWarpCooldown ?? 105;
    const oldX = this.x;
    const oldY = this.y;
    const oldA = this.gunAngle || 0;
    const dashA = Math.atan2((target?.y ?? this.y) - this.y, (target?.x ?? this.x) - this.x) + (Math.random() < 0.5 ? 0.65 : -0.65);

    if (counterFire) {
      const bounds = (typeof state !== 'undefined' && state.arena) ? state.arena : { x: 45, y: 240, width: 450, height: 450 };
      const r = this.r || 25;
      this.afterImages.push({ x: oldX, y: oldY, angle: oldA, timer: 20, maxTimer: 20, tintIndex: 0 });
      const hopA = dashA + Math.PI;
      this.x = Math.max(bounds.x + r + 10, Math.min(bounds.x + bounds.width - r - 10, oldX + Math.cos(hopA) * 95));
      this.y = Math.max(bounds.y + r + 10, Math.min(bounds.y + bounds.height - r - 10, oldY + Math.sin(hopA) * 95));
      spawnFloatingText(this.x, this.y - r - 12, 'CHAOS!', '#A855F7');
      triggerFighterSpeech(this, "UEE HEE HEE! CAN'T CATCH ME!", { duration: 85, preserveCase: true, borderColor: '#A855F7', blipSpeed: 1.25 });
      if (target && Number.isFinite(target.x)) {
        const aimA = Math.atan2(target.y - this.y, target.x - this.x);
        const cnt = cfg.chaosCounterBulletCount ?? 3;
        for (let i = 0; i < cnt; i++) {
          const a = aimA + (i - (cnt - 1) * 0.5) * 0.28;
          this.activeSuitBullets.push({
            x: this.x, y: this.y, vx: Math.cos(a) * 10.5, vy: Math.sin(a) * 10.5,
            angle: a, suit: i % 2 === 0 ? 'spade' : 'diamond', damage: 10, life: 48, scale: 0.74, hitSet: new Set(),
          });
        }
      }
    } else {
      const spd = cfg.chaosWarpDashSpeed ?? 16.5;
      this.vx = Math.cos(dashA) * spd;
      this.vy = Math.sin(dashA) * spd;
    }

    const laughKey = Math.random() < 0.5 ? 'laugh1' : 'laugh2';
    this._playAudio(laughKey, `Assets/Sound Effects/Jevil/jevil_${laughKey === 'laugh1' ? 'laugh_1' : 'laugh_2'}.wav`, 0.70);
  }

  _startBasicCleave(target, cfg = this._cfg()) {
    this.meleeCastAngle = Math.atan2(target.y - this.y, target.x - this.x);
    this.gunAngle = this.meleeCastAngle;
    this.isMeleeSwinging = true;
    this.meleePhase = 1;
    this.meleePhaseMaxTimer = Math.max(1, cfg.knifeLiftFrames ?? 5);
    this.meleePhaseTimer = this.meleePhaseMaxTimer;
    this.meleePhaseProgress = 0;
    this.meleeHitRegistered = false;
    this.meleeComboFlip = !this.meleeComboFlip;
    this.basicAttackCooldownTimer = cfg.basicAttackCooldown ?? 46;

    const dist = Math.hypot(target.x - this.x, target.y - this.y);
    const lungeSpd = dist > (this.r || 25) * 3.0 ? 8.5 : 3.2;
    this.vx = Math.cos(this.meleeCastAngle) * lungeSpd;
    this.vy = Math.sin(this.meleeCastAngle) * lungeSpd;
  }

  _updateMeleeSwing(targets, cfg) {
    this.gunAngle = this.meleeCastAngle;
    this.meleePhaseTimer--;
    this.meleePhaseProgress = 1 - Math.max(0, this.meleePhaseTimer) / Math.max(1, this.meleePhaseMaxTimer);

    if (this.meleePhase === 2 || this.meleePhase === 3) {
      this.vx *= 0.85;
      this.vy *= 0.85;
    } else if (this.meleePhase === 4) {
      this.vx = 0;
      this.vy = 0;
    }

    if (this.meleePhase === 3 && !this.meleeHitRegistered && this.meleePhaseProgress >= 0.45) {
      this.meleeHitRegistered = true;
      this._executeBasicStrikeHit(targets, cfg);
    }

    if (this.meleePhaseTimer <= 0) {
      this.meleePhase++;
      if (this.meleePhase === 2) {
        this.meleePhaseMaxTimer = Math.max(1, cfg.knifeHoldFrames ?? 2);
      } else if (this.meleePhase === 3) {
        this.meleePhaseMaxTimer = Math.max(1, cfg.knifeStrikeFrames ?? 6);
        this._playAudio('attack1', 'Assets/Sound Effects/Jevil/jevil_attack_1.wav', 0.78);
      } else if (this.meleePhase === 4) {
        this.meleePhaseMaxTimer = Math.max(1, cfg.knifeImpactLockFrames ?? 4);
      } else if (this.meleePhase === 5) {
        this.meleePhaseMaxTimer = Math.max(1, cfg.knifeRecoveryFrames ?? 7);
      } else {
        this.isMeleeSwinging = false;
        this.meleePhase = 0;
        this.meleePhaseProgress = 0;
      }
      this.meleePhaseTimer = this.meleePhaseMaxTimer;
    }
  }

  _executeBasicStrikeHit(targets, cfg) {
    const reach = cfg.basicAttackReach ?? 180;
    const halfArc = (cfg.basicAttackArc ?? Math.PI * 0.84) * 0.5;
    const dmg = cfg.basicAttackDamage ?? 25;
    const kb = cfg.basicAttackKnockback ?? 7.5;
    let landed = false;

    for (const t of targets) {
      const dx = t.x - this.x;
      const dy = t.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > reach + (t.r || 25)) continue;
      const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - this.meleeCastAngle), Math.cos(Math.atan2(dy, dx) - this.meleeCastAngle)));
      const pointBlank = dist <= (this.r || 25) + (t.r || 25) + 12;
      if (diff <= halfArc || pointBlank) {
        if (this._dealJevilDamage(t, dmg, { isMelee: true, incrementUlt: !landed })) {
          landed = true;
          t.vx = (t.vx || 0) + Math.cos(this.meleeCastAngle) * kb;
          t.vy = (t.vy || 0) + Math.sin(this.meleeCastAngle) * kb;
          spawnSparks(t.x, t.y, 6, 'purple', { color: '#A855F7' });
        }
      }
    }

    if (landed) {
      triggerGlobalScreenShake(4.2, 6);
    }

    // Alternate 3-way Spade Aces & Diamond bursts on basic strikes
    this._basicPatternStep++;
    const cnt = Math.max(1, cfg.spadeVolleyCount ?? 3);
    const spread = cfg.spadeVolleySpread ?? 0.28;
    const spd = cfg.spadeVolleySpeed ?? 10.4;
    const sDmg = cfg.spadeVolleyDamage ?? 10;
    const sLife = cfg.spadeVolleyLife ?? 58;
    const useDiamonds = this._basicPatternStep % 2 === 0;
    for (let i = 0; i < cnt; i++) {
      const off = cnt > 1 ? ((i / (cnt - 1)) - 0.5) * spread * 2 : 0;
      const a = this.meleeCastAngle + off;
      this.activeSuitBullets.push({
        x: this.x + Math.cos(a) * ((this.r || 25) + 10),
        y: this.y + Math.sin(a) * ((this.r || 25) + 10),
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        angle: a,
        suit: useDiamonds ? 'diamond' : 'spade',
        damage: sDmg,
        life: sLife,
        scale: 0.74,
        incrementUlt: i === 0 && !landed,
        hitSet: new Set(),
      });
    }
  }

  _castRandomSkill1(target, arena, cfg = this._cfg()) {
    const options = [];
    if (isSkillEnabled(cfg.enableSpadeRing, true)) options.push('spade_ring');
    if (isSkillEnabled(cfg.enableSuitBombs, true)) options.push('suit_bombs');
    if (isSkillEnabled(cfg.enableDevilsknifeCarousel, true)) options.push('devilsknife_carousel');
    if (isSkillEnabled(cfg.enableMerryGoRound, true)) options.push('merry_go_round');
    if (isSkillEnabled(cfg.enableDiamondBarrage, true)) options.push('diamond_barrage');
    if (isSkillEnabled(cfg.enableMetamorphosis, true)) options.push('metamorphosis');
    if (options.length === 0) return false;

    const nonRepeat = options.filter(id => id !== this._activeSkill1Id);
    const pool = nonRepeat.length > 0 ? nonRepeat : options;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return this._executeSkill1ById(pick, target, arena, cfg);
  }

  _executeSkill1ById(pick, target, arena, cfg = this._cfg()) {
    this.skill1CooldownTimer = cfg.skill1Cooldown ?? 210;
    this.skill1CooldownMax = cfg.skill1Cooldown ?? 210;
    this._activeSkill1Id = pick;
    const bounds = arena || { x: 45, y: 240, width: 450, height: 450 };

    if (pick === 'spade_ring') {
      this._activeSkill1Label = cfg.spadeRingSkillName || 'SPADE RING';
      const cnt = cfg.spadeRingCount ?? 10;
      const rad = cfg.spadeRingRadius ?? 142;
      const hold = cfg.spadeRingHoldFrames ?? 16;
      const spd = cfg.spadeRingSpeed ?? 11.8;
      const dmg = cfg.spadeRingDamage ?? 15;
      for (let wave = 0; wave < 2; wave++) {
        const wCnt = wave === 0 ? cnt : Math.max(6, cnt - 2);
        const wRad = wave === 0 ? rad : rad + 34;
        for (let i = 0; i < wCnt; i++) {
          const a = (i / wCnt) * Math.PI * 2 + wave * 0.35;
          const bx = Math.max(bounds.x + 18, Math.min(bounds.x + bounds.width - 18, target.x + Math.cos(a) * wRad));
          const by = Math.max(bounds.y + 18, Math.min(bounds.y + bounds.height - 18, target.y + Math.sin(a) * wRad));
          const inA = Math.atan2(target.y - by, target.x - bx);
          this.activeSuitBullets.push({
            x: bx, y: by, vx: 0, vy: 0, angle: inA,
            holdTimer: hold + wave * 12 + i,
            launchSpeed: spd, target, suit: 'spade', damage: dmg, life: 64, scale: 0.85, hitSet: new Set(),
          });
        }
      }
      this._playAudio('iCanDoAnything', 'Assets/Sound Effects/Jevil/icandoanything.wav', 0.82);
    } else if (pick === 'suit_bombs') {
      this._activeSkill1Label = cfg.suitBombsSkillName || 'CHAOS BOMBS';
      const suits = ['heart', 'diamond', 'club', 'spade'];
      const cnt = cfg.suitBombCount ?? 4;
      for (let i = 0; i < cnt; i++) {
        const offX = (i - (cnt - 1) * 0.5) * 62;
        const tx = Math.max(bounds.x + 28, Math.min(bounds.x + bounds.width - 28, target.x + offX));
        const ty = Math.max(bounds.y + 38, Math.min(bounds.y + bounds.height - 38, target.y + (Math.random() - 0.5) * 56));
        this.activeSuitBombs.push({
          x: tx, y: bounds.y - 16 - i * 16, targetY: ty,
          dropSpeed: cfg.suitBombDropSpeed ?? 7.6, fuseTimer: cfg.suitBombFuseFrames ?? 24,
          suit: suits[i % suits.length], age: 0,
        });
      }
      this._playAudio('aLittleChaos', 'Assets/Sound Effects/Jevil/alittlechaos.wav', 0.80);
    } else if (pick === 'devilsknife_carousel') {
      this._activeSkill1Label = cfg.devilsknifeCarouselSkillName || 'DEVILSKNIFE';
      this.isSkill1Channeling = true;
      // Clear any previous non-crimson carousel scythes so they never stack or leak
      this.activeCarouselScythes = this.activeCarouselScythes.filter(s => s.crimson);
      const cnt = cfg.carouselScytheCount ?? 5;
      const orbitFrames = cfg.carouselOrbitFrames ?? 72;
      for (let i = 0; i < cnt; i++) {
        this.activeCarouselScythes.push({
          x: target.x, y: target.y, spinAngle: i * 1.1, size: 58, hitR: 28,
          damage: cfg.carouselDamage ?? 16, crimson: false, age: 0, life: orbitFrames + 2,
        });
      }
      this._carouselSeq = { cx: target.x, cy: target.y, timer: 0, rot: 0 };
      this._playAudio('chaosChaos', 'Assets/Sound Effects/Jevil/chaoschaos.wav', 0.82);
    } else if (pick === 'merry_go_round') {
      this._activeSkill1Label = cfg.merryGoRoundSkillName || 'CAROUSEL';
      const count = cfg.carouselWaveCount ?? 6;
      const spd = cfg.carouselWaveSpeed ?? 6.8;
      const dmg = cfg.carouselWaveDamage ?? 15;
      for (let i = 0; i < count; i++) {
        const fromLeft = i % 2 === 0;
        const laneY = Math.max(bounds.y + 42, Math.min(bounds.y + bounds.height - 42, target.y + ((i - count * 0.5) * 38)));
        this.activeCarouselHorses.push({
          x: fromLeft ? (bounds.x - 16 - i * 28) : (bounds.x + bounds.width + 16 + i * 28),
          y: laneY,
          baseY: laneY,
          vx: fromLeft ? spd : -spd,
          frameIdx: i % 3,
          phase: i * 0.9,
          damage: dmg,
          life: 110,
          age: 0,
          hitSet: new Set(),
        });
      }
      this._playAudio('chaosChaos', 'Assets/Sound Effects/Jevil/chaoschaos.wav', 0.78, 1.12);
    } else if (pick === 'diamond_barrage') {
      this._activeSkill1Label = cfg.diamondBarrageSkillName || 'CHAOS SUITS';
      this.isSkill1Channeling = true;
      this._diamondBarrageSeq = { timer: 0, duration: cfg.diamondBarrageFrames ?? 40 };
      this._playAudio('iCanDoAnything', 'Assets/Sound Effects/Jevil/icandoanything.wav', 0.78, 1.1);
    } else if (pick === 'metamorphosis') {
      this._activeSkill1Label = cfg.metamorphosisSkillName || 'METAMORPHOSIS';
      this.isSkill1Channeling = true;
      this._metamorphosisSeq = {
        timer: 0,
        dashesDone: 0,
        totalDashes: cfg.metamorphosisDashCount ?? 3,
        interval: cfg.metamorphosisDashInterval ?? 10,
      };
      this._playAudio('metamorphosis', 'Assets/Sound Effects/Jevil/metamorphosis.wav', 0.85);
    }
    return true;
  }

  _updateDiamondBarrage(target, arena, cfg) {
    const seq = this._diamondBarrageSeq;
    seq.timer++;
    const bounds = arena || { x: 45, y: 240, width: 450, height: 450 };
    const interval = cfg.diamondBarrageInterval ?? 4;
    const spd = cfg.diamondBarrageSpeed ?? 10.8;
    const dmg = cfg.diamondBarrageDamage ?? 12;

    if (seq.timer % interval === 1 && target) {
      const fromBottom = (seq.timer % 2 === 1);
      const sx = Math.max(bounds.x + 24, Math.min(bounds.x + bounds.width - 24, target.x + (Math.random() - 0.5) * 180));
      const sy = fromBottom ? (bounds.y + bounds.height - 12) : (bounds.y + 12);
      const a = Math.atan2(target.y - sy, target.x - sx);
      this.activeSuitBullets.push({
        x: sx, y: sy, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        angle: a, suit: 'diamond', damage: dmg, life: 56, scale: 0.82, hitSet: new Set(),
      });
      if (seq.timer % (interval * 3) === 1) {
        const baseA = Math.atan2(target.y - this.y, target.x - this.x);
        for (const off of [-0.22, 0, 0.22]) {
          const ca = baseA + off;
          this.activeSuitBullets.push({
            x: this.x, y: this.y, vx: Math.cos(ca) * (spd * 0.92), vy: Math.sin(ca) * (spd * 0.92),
            angle: ca, suit: 'club', damage: dmg, life: 58, scale: 0.82, hitSet: new Set(),
          });
        }
        this._playAudio('attack1', 'Assets/Sound Effects/Jevil/jevil_attack_1.wav', 0.65, 1.15);
      }
    }

    if (seq.timer >= seq.duration) {
      this._diamondBarrageSeq = null;
      this.isSkill1Channeling = false;
    }
  }

  _updateMetamorphosisSeq(targets, arena, cfg) {
    const seq = this._metamorphosisSeq;
    seq.timer++;
    const bounds = arena || { x: 45, y: 240, width: 450, height: 450 };

    if (seq.dashesDone < seq.totalDashes && seq.timer % seq.interval === 1) {
      seq.dashesDone++;
      const t = targets[0];
      if (t) {
        const a = Math.atan2(t.y - this.y, t.x - this.x);
        this.gunAngle = a;
        this.afterImages.push({ x: this.x, y: this.y, angle: a, timer: 20, maxTimer: 20, tintIndex: seq.dashesDone % 3 });
        const passX = Math.max(bounds.x + 28, Math.min(bounds.x + bounds.width - 28, t.x + Math.cos(a) * 52));
        const passY = Math.max(bounds.y + 28, Math.min(bounds.y + bounds.height - 28, t.y + Math.sin(a) * 52));
        this.x = passX;
        this.y = passY;
        this.vx = 0;
        this.vy = 0;
        this._dealJevilDamage(t, cfg.metamorphosisDashDamage ?? 20, { isMelee: true });
        spawnSparks(t.x, t.y, 7, 'purple', { color: '#FACC15' });
        for (let k = 0; k < 4; k++) {
          const sa = a + (k / 4) * Math.PI * 2;
          this.activeSuitBullets.push({
            x: passX, y: passY, vx: Math.cos(sa) * 9.5, vy: Math.sin(sa) * 9.5,
            angle: sa, suit: 'spade', damage: 11, life: 48, scale: 0.78, hitSet: new Set(),
          });
        }
        this._playAudio('attack1', 'Assets/Sound Effects/Jevil/jevil_attack_1.wav', 0.80, 1.15);
      }
    }

    if (seq.timer >= seq.totalDashes * seq.interval + 6) {
      this._metamorphosisSeq = null;
      this.isSkill1Channeling = false;
    }
  }

  _startFinalChaos(target, arena, cfg = this._cfg()) {
    this.finalChaosHits = 0;
    this.isFinalChaosActive = true;
    this.finalChaosCooldownTimer = cfg.finalChaosCooldown ?? 0;

    const castAngle = target ? Math.atan2(target.y - this.y, target.x - this.x) : (this.gunAngle || 0);
    this.skillCastAngle = castAngle;
    this.gunAngle = castAngle;

    const bounds = arena || { x: 45, y: 240, width: 450, height: 450 };
    const cx = target ? target.x : (bounds.x + bounds.width * 0.5);
    const cy = target ? target.y : (bounds.y + bounds.height * 0.5);

    this._finalChaosSeq = {
      timer: 0,
      spawned: 0,
      total: cfg.finalChaosRainCount ?? 10,
      interval: cfg.finalChaosRainInterval ?? 6,
      cx,
      cy,
    };

    spawnFloatingText(this.x, this.y - (this.r || 25) - 22, 'FINAL CHAOS!', '#FACC15');
    this._playAudio('byeBye', 'Assets/Sound Effects/Jevil/byebye.wav', 0.86);
    triggerFighterSpeech(this, 'THE FINAL CHAOS!', { duration: 120, force: true, preserveCase: true, borderColor: '#A855F7', blipSpeed: 1.25 });
  }

  _updateFinalChaosSeq(targets, arena, cfg) {
    const seq = this._finalChaosSeq;
    if (!seq) {
      this.isFinalChaosActive = false;
      return;
    }

    const bounds = arena || { x: 45, y: 240, width: 450, height: 450 };
    seq.timer++;

    if (seq.spawned < seq.total && seq.timer % seq.interval === 1) {
      const idx = seq.spawned++;
      const t = targets[0];
      const tx = t ? t.x : seq.cx;
      const ty = t ? t.y : seq.cy;
      const ang = (idx / seq.total) * Math.PI * 2 + 0.35;
      const sx = tx + Math.cos(ang) * 195;
      const sy = bounds.y - 24;
      const aimA = Math.atan2(ty - sy, tx - sx);
      this.activeCarouselScythes.push({
        x: sx, y: sy,
        vx: Math.cos(aimA) * 13.0, vy: Math.sin(aimA) * 13.0,
        spinAngle: ang, size: idx === seq.total - 1 ? 96 : 74, hitR: idx === seq.total - 1 ? 44 : 34,
        damage: cfg.finalChaosScytheDamage ?? 20, crimson: true, life: 48, age: 0,
      });
      this._playAudio('attack1', 'Assets/Sound Effects/Jevil/jevil_attack_1.wav', 0.78, 0.9 + idx * 0.04);
    }

    const totalDur = seq.total * seq.interval + 18;
    if (seq.timer >= totalDur) {
      const tx = targets[0] ? targets[0].x : seq.cx;
      const ty = targets[0] ? targets[0].y : seq.cy;
      this.activeChaosRipples.push({ x: tx, y: ty, maxRadius: 230, life: 30, maxLife: 30 });
      this._playAudio('explosion', 'Assets/Sound Effects/Attacks/explosion.mp3', 0.35);
      triggerGlobalScreenShake(10.0, 16);

      const climaxDmg = cfg.finalChaosClimaxDamage ?? 50;
      const climaxKb = cfg.finalChaosKnockback ?? 15.0;
      for (const e of targets) {
        this._dealJevilDamage(e, climaxDmg, { isAOE: true, isGuaranteedHit: true });
        const pushA = Math.atan2(e.y - this.y, e.x - this.x);
        e.vx = (e.vx || 0) + Math.cos(pushA) * climaxKb;
        e.vy = (e.vy || 0) + Math.sin(pushA) * climaxKb;
      }

      const suits = ['heart', 'diamond', 'club', 'spade'];
      for (let k = 0; k < 12; k++) {
        const sa = (k / 12) * Math.PI * 2;
        this.activeSuitBullets.push({
          x: tx, y: ty, vx: Math.cos(sa) * 9.8, vy: Math.sin(sa) * 9.8,
          angle: sa, suit: suits[k % suits.length], damage: 12, life: 56, scale: 0.82, hitSet: new Set(),
        });
      }

      this._finalChaosSeq = null;
      this.isFinalChaosActive = false;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDERING PIPELINE (Rules 20, 21, 30, 32, 35)
  // ═════════════════════════════════════════════════════════════════════════
  drawBody(ctx) {
    drawJevilSkin(ctx, this);
  }

  draw(ctx) {
    // 1. Chromatic Jester Afterimages
    for (let i = 0; i < this.afterImages.length; i++) {
      const ai = this.afterImages[i];
      const alpha = (ai.timer / Math.max(1, ai.maxTimer || 20)) * 0.45;
      drawJevilGhostSkin(ctx, this, ai.x, ai.y, ai.angle, alpha, ai.tintIndex || 0);
    }

    // 2. Body Circle + Jester Cap (Rule 32)
    this.drawBody(ctx);

    // 3. Devilsknife held by canonical hand (Rule 20/30)
    if (!this._isSilhouettePass) {
      drawJevilDevilsknife(ctx, this.x || 0, (this.y || 0) - (this.z || 0), this.gunAngle || 0, this.r || 25, this, { isPreview: false });
    }

    // 4. Bullets, Suit Bombs, Carousel Horses, Spinning Scythes & Final Chaos Ripples
    for (let i = 0; i < this.activeSuitBullets.length; i++) {
      drawJevilSuitBullet(ctx, this.activeSuitBullets[i]);
    }
    for (let i = 0; i < this.activeSuitBombs.length; i++) {
      drawJevilSuitBomb(ctx, this.activeSuitBombs[i]);
    }
    for (let i = 0; i < this.activeCarouselHorses.length; i++) {
      drawJevilMerryGoRound(ctx, this.activeCarouselHorses[i]);
    }
    for (let i = 0; i < this.activeCarouselScythes.length; i++) {
      drawJevilSpinningScythe(ctx, this.activeCarouselScythes[i]);
    }
    drawJevilFinalChaosRipples(ctx, this.activeChaosRipples);

    // 5. Rule 21 Mandatory In-Game Overhead HP & Freeze Timers + Deltarune Speech Bubble
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
    drawSansSpeechBubble(ctx, this);
  }
}
