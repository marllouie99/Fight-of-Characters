// ═══════════════════════════════════════════════════════════════════════════
// KAIZO KNIGHT (Deltarune Kaizo Mod v2.3.3) — Combat Entity Class
// Adapted from Mezu-Bezu/kaizo-knight-browser
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
import { kaizoKnightConfig } from '../../configs/characters/kaizoKnightConfig.js';
import { state, spawnFloatingText, triggerGlobalScreenShake } from '../../core/state.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { spawnSparks, spawnParrySparksEffect } from '../../graphics/particles/sparkEffect.js';
import { drawKaizoKnightSkin, drawKaizoKnightGhostSkin } from '../../graphics/fighters/kaizoKnightSkin.js';
import { resetSpeechState, triggerFighterSpeech, updateFighterSpeech, tickFighterIntroAndWinSpeech } from '../../systems/undertaleSpeech.js';
import { drawSansSpeechBubble } from '../../graphics/weapons/sansWeaponGraphics.js';
import {
  drawKaizoKnightRadiantKnife,
  drawKaizoCrescentProjectile,
  drawKaizoBoardSlashVFX,
  drawSoulSplitterVFX,
  drawDiamondStormProjectile,
  drawKaizoSwordVortexAndTunnelVFX,
  drawHypernovaStarstormVFX,
  drawRoaringDeltaVFX,
  drawKaizoParryVFX,
} from '../../graphics/weapons/kaizoKnightWeaponGraphics.js';

export class KaizoKnightFighter extends Fighter {
  constructor(def = {}) {
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.kaizo_knight)
      ? CONFIG.kaizo_knight
      : kaizoKnightConfig;

    // Rule 24: Pass base r=25 to super(def) and NEVER overwrite this.r afterwards
    super({
      ...def,
      r: def.r ?? cfg.r ?? 25,
      radius: def.radius ?? cfg.radius ?? 25,
      hp: def.hp ?? cfg.hp ?? 500,
      maxHp: def.maxHp ?? cfg.maxHp ?? 500,
      speed: def.speed ?? cfg.speed ?? 6.4,
      color: def.color || cfg.color || '#86A2FF',
    });

    this.characterId = 'kaizo_knight';
    this.type = 'kaizo_knight';
    this.name = def?.name || cfg.name || 'Kaizo Knight';
    this.displayName = def?.displayName || cfg.displayName || 'Kaizo Knight';
    this.grade = cfg.grade || 'SS';
    this.title = cfg.title || 'Anomaly of the Dark Fountain';

    this.speed = def.speed ?? cfg.speed ?? 6.4;
    this.moveSpeed = cfg.moveSpeed ?? this.speed;
    this.color = cfg.color || '#86A2FF';
    this.themeColor = cfg.themeColor || '#86A2FF';
    this.secondaryColor = cfg.secondaryColor || '#FFFFFF';
    this.damageNumberColor = cfg.damageNumberColor || '#86A2FF';
    this._vfxTick = 0;

    this._initKaizoState(cfg);
  }

  _cfg() {
    return (typeof CONFIG !== 'undefined' && CONFIG.kaizo_knight)
      ? CONFIG.kaizo_knight
      : kaizoKnightConfig;
  }

  _registerCooldownExclusions() {
    if (!this.skillManager || !this.skillManager.cooldownKeyMap) return;
    const managedKeys = [
      'kaizoStepCooldownTimer',
      'basicAttackCooldownTimer',
      'skill1CooldownTimer',
      'hypernovaCooldownTimer',
      'roaringDeltaCooldownTimer',
    ];
    for (const key of managedKeys) {
      this.skillManager.cooldownKeyMap.set(key, true);
    }
  }

  _initKaizoState(cfg = this._cfg()) {
    // Passive: Kaizo Step & RGB Afterimages
    this.kaizoStepCooldownTimer = cfg.kaizoStepInitialCooldown ?? 45;
    this.afterImages = [];
    this._afterImageTick = 0;
    this._afterImageColorIndex = 0;

    // Passive: Radiant Parry
    this.blockPoseTimer = 0;
    this.parryHitAnimTimer = 0;
    this.parryHitAnimMaxFrames = cfg.parryHitAnimFrames ?? 16;
    this.parryWhiteFlashTimer = 0;
    this.parryShakeTimer = 0;
    this.parryCooldownTimer = 0;
    this._parrySfxCooldownTimer = 0;
    this.parryCount = 0;
    this.activeParryBlockVfx = [];

    // Basic Attack: 5-Phase Radiant Knife Cleave + Crescent Wave + Quickslash Cuts
    this.basicAttackCooldownTimer = cfg.basicAttackInitialCooldown ?? 24;
    this.isMeleeSwinging = false;
    this.meleePhase = 0;
    this.meleePhaseTimer = 0;
    this.meleePhaseMaxTimer = 1;
    this.meleePhaseProgress = 0;
    this.meleeComboFlip = false;
    this.meleeHitRegistered = false;
    this.meleeCastAngle = 0;
    this._basicSlashStep = 0;
    this.activeCrescentWaves = [];
    this.activeBoardSlashes = [];

    // Unified Skill 1 Slot (Randomly picks from Soul Splitter / Diamond Storm / Vortex Storm / Kaizo Tunnel / Hypernova)
    this.skill1CooldownTimer = cfg.skill1InitialCooldown ?? 120;
    this.skill1CooldownMax = cfg.skill1Cooldown ?? 390;
    this.isSkill1Channeling = false;
    this._activeSkill1Id = null;
    this._activeSkill1Label = null;

    this.activeSoulSplitter = null;
    this.activeSplitShards = [];
    this.activeDiamondProjectiles = [];
    this._diamondSeq = null;
    this.activeVortexSwords = [];
    this._vortexSeq = null;
    this.activeTunnelSwords = [];
    this.activeTunnelSlashFX = [];
    this.activeTunnelBeams = [];
    this._tunnelSeq = null;

    // Pooled Hypernova Starstorm state
    this.hypernovaCooldownTimer = cfg.hypernovaInitialCooldown ?? 120;
    this.isHypernovaCasting = false;
    this._hypernovaSeq = null;
    this.activeHypernovaCone = null;
    this.activeHypernovaStars = [];
    this.activeHypernovaShards = [];

    // Ultimate: Roaring Delta (Front-Spawned Dark Fountain Vortex -> Quickslash Frenzy -> Screen Shatter)
    this.swoonBasicHits = 0;
    this.roaringDeltaCooldownTimer = cfg.roaringDeltaInitialCooldown ?? 0;
    this.isRoaringDeltaActive = false;
    this._roaringDeltaSeq = null;
    this.roaringDeltaOrigin = null;
    this.roaringDeltaVortexTimer = 0;
    this.roaringDeltaVortexMax = cfg.roaringDeltaVortexFrames ?? 38;
    this.roaringDeltaFrenzyTimer = 0;
    this.roaringDeltaShatterTimer = 0;
    this.roaringDeltaShatterMax = cfg.roaringDeltaShatterFrames ?? 32;
    this.activeFountainBullets = [];
    this.activeShockwaveRipples = [];

    this.skillCastAngle = 0;
    resetSpeechState(this);
    this._registerCooldownExclusions();
  }

  reset() {
    super.reset();
    this._initKaizoState(this._cfg());
  }

  _playAudio(key, fallbackPath, defaultVol = 0.85, speed = 1.0, offset = 0) {
    if (typeof audioSystem === 'undefined' || !audioSystem.playSFX) return;
    const cfg = this._cfg();
    const sfxPath = cfg.sounds?.[key] || fallbackPath;
    const vol = cfg.soundVolumes?.[key] ?? defaultVol;
    audioSystem.playSFX(sfxPath, vol, speed, offset);
  }

  /**
   * Rule 23: Suppresses base generic bullet projectiles.
   */
  shoot() {
    // Intentionally empty: Kaizo Knight attacks exclusively with Radiant Knife & Kaizo skills.
  }

  /**
   * Rule 1.4: Lock aim during melee strike commitment & Roaring Delta sequence.
   */
  canAim() {
    if (this.isRoaringDeltaActive) return false;
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

  _applyGloomChill(target, cfg = this._cfg()) {
    if (!target || target.hp <= 0 || target.dead || target.isDead) return;
    if (!isSkillEnabled(cfg.enableKaizoGloom, true)) return;
    if (target.isBoss || target.isCCImmune) return;
    const slowFrames = cfg.gloomSlowFrames ?? 90;
    const slowMult = cfg.gloomSlowMultiplier ?? 0.62;
    target.slowTimer = Math.max(target.slowTimer || 0, slowFrames);
    if (target.slowMultiplier === undefined || slowMult < target.slowMultiplier) {
      target.slowMultiplier = slowMult;
    }
  }

  _dealKaizoDamage(target, amount, opts = {}) {
    if (!target || target.hp <= 0 || target.dead || target.isDead) return false;
    if (target.invulnerable) return false;
    // Preserve simultaneous enemy skills & active casts (prevents fighter.js isBlastOrKnockback from calling interruptAttacks(true))
    const damageOpts = { skipInterrupt: true, ...opts };
    const dealt = applyDamageToTarget(target, amount, this, damageOpts);
    if (dealt && opts.applyGloom) {
      this._applyGloomChill(target);
    }
    if (dealt && opts.incrementUlt && !this.isRoaringDeltaActive) {
      const req = Math.max(1, this._cfg().swoonHitsRequired ?? 5);
      this.swoonBasicHits = Math.min(req, (this.swoonBasicHits || 0) + 1);
    }
    return Boolean(dealt);
  }

  _tryParryIncomingHit(amount, attacker, opts = {}) {
    const cfg = this._cfg();
    if (!isSkillEnabled(cfg.enableParry, true)) return false;
    if (this.hp <= 0 || this.dead || this.isDead) return false;
    if (opts.bypassParry || opts.isGuaranteedHit || opts.isDomainDPS || opts.isBeamDPS || opts.isContinuousShred || opts.isDoT) {
      return false;
    }
    if ((this.parryCooldownTimer || 0) > 0 || (this.timeStopTimer || 0) > 0 || (this.hitStunTimer || 0) > 0) {
      return false;
    }
    const chance = (this.blockPoseTimer > 0)
      ? (cfg.parryActiveChance ?? 0.72)
      : (cfg.parryPassiveChance ?? 0.42);
    if (Math.random() >= chance) return false;

    this.parryCount = (this.parryCount || 0) + 1;
    this.parryCooldownTimer = cfg.parryCooldownFrames ?? 14;
    this.blockPoseTimer = cfg.parryGuardDuration ?? 65;
    this.parryHitAnimTimer = this.parryHitAnimMaxFrames ?? 16;
    this.parryWhiteFlashTimer = 6;
    this.parryShakeTimer = 6;

    const ang = attacker && Number.isFinite(attacker.x)
      ? Math.atan2(attacker.y - this.y, attacker.x - this.x)
      : (this.gunAngle || 0);
    const rx = this.x + Math.cos(ang) * (this.r || 25);
    const ry = this.y + Math.sin(ang) * (this.r || 25);
    this.activeParryBlockVfx.push({ x: rx, y: ry, life: 14, maxLife: 14 });
    spawnParrySparksEffect(rx, ry, 12);

    if ((this._parrySfxCooldownTimer || 0) <= 0) {
      this._parrySfxCooldownTimer = 14;
      triggerGlobalScreenShake(3.5, 8);
      this._playAudio('parry', 'Assets/Sound Effects/Skills/parry.mp3', 0.85);
      spawnFloatingText(this.x, this.y - (this.r || 25) - 16, 'KAIZO PARRY!', '#86A2FF');
    }
    const parryLines = ['rejected.', 'predictable.', '...not enough.'];
    triggerFighterSpeech(this, parryLines[(this.parryCount || 0) % parryLines.length], { duration: 80, borderColor: '#4F46E5', blipSpeed: 0.58 });

    // Close-range melee riposte + radiant spark pushback
    if (attacker && !opts.isProjectile && !opts.isAOE) {
      const dist = Math.hypot(attacker.x - this.x, attacker.y - this.y);
      if (dist <= (this.r || 25) + (attacker.r || 25) + 100) {
        const kb = cfg.parryCounterKnockback ?? 7.0;
        attacker.vx = (attacker.vx || 0) + Math.cos(ang) * kb;
        attacker.vy = (attacker.vy || 0) + Math.sin(ang) * kb;
        this._dealKaizoDamage(attacker, cfg.parryCounterDamage ?? 14, { isMelee: true, bypassParry: true });
      }
    }
    return true;
  }

  takeDamage(amount, attacker, opts = {}) {
    if (this._tryParryIncomingHit(amount, attacker, opts)) {
      return false;
    }
    const dealt = super.takeDamage(amount, attacker, opts);
    if (this.hp <= 0) {
      this.interruptAttacks(true);
      return dealt;
    }
    if (dealt && this.hp > 0 && Math.random() < 0.4) {
      const idx = Math.random() < 0.5 ? 1 : 2;
      this._playAudio(`hurt${idx}`, `Assets/Sound Effects/RoaringKnightSFX/snd_knight_hurt${idx === 2 ? 'b' : ''}.wav`, 0.72);
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
      this.isHypernovaCasting = false;
      this._hypernovaSeq = null;
      this.activeHypernovaCone = null;
      this.isSkill1Channeling = false;
      this.isRoaringDeltaActive = false;
      this._roaringDeltaSeq = null;
      this._diamondSeq = null;
      this._vortexSeq = null;
      this._tunnelSeq = null;
      this.roaringDeltaVortexTimer = 0;
      this.roaringDeltaFrenzyTimer = 0;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RULE 25: TOP-OF-UPDATE NON-FREEZING VFX DECAY
  // ═════════════════════════════════════════════════════════════════════════
  _updateAllVfxLifecycles(arena) {
    const enemies = this._getAllEnemyTargets(null);
    const bounds = arena || { x: 45, y: 240, width: 450, height: 450 };
    const cfg = this._cfg();

    // Afterimages
    for (let i = this.afterImages.length - 1; i >= 0; i--) {
      this.afterImages[i].timer--;
      if (this.afterImages[i].timer <= 0) this.afterImages.splice(i, 1);
    }

    // Parry VFX
    for (let i = this.activeParryBlockVfx.length - 1; i >= 0; i--) {
      this.activeParryBlockVfx[i].life--;
      if (this.activeParryBlockVfx[i].life <= 0) this.activeParryBlockVfx.splice(i, 1);
    }

    // Board Slashes (Quickslash cuts & Ultimate cuts)
    for (let i = this.activeBoardSlashes.length - 1; i >= 0; i--) {
      const s = this.activeBoardSlashes[i];
      if (s.telegraph > 0) {
        s.telegraph--;
        if (s.telegraph === 0) {
          this._playAudio('cut1', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_cut.wav', 0.80, 1.12);
          this._checkLineCutHits(s, enemies);
        }
        continue;
      }
      s.life--;
      if (s.life <= 0) this.activeBoardSlashes.splice(i, 1);
    }

    // Crescent Wave Projectiles
    for (let i = this.activeCrescentWaves.length - 1; i >= 0; i--) {
      const p = this.activeCrescentWaves[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      for (const e of enemies) {
        if (p.hitSet.has(e)) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) <= (e.r || 25) + 18) {
          p.hitSet.add(e);
          this._dealKaizoDamage(e, p.damage, { isProjectile: true, applyGloom: true });
          e.vx = (e.vx || 0) + Math.cos(p.angle) * (p.knockback || 5);
          e.vy = (e.vy || 0) + Math.sin(p.angle) * (p.knockback || 5);
          spawnSparks(e.x, e.y, 4, 'blue', { color: '#86A2FF' });
        }
      }
      if (p.life <= 0 || p.x < bounds.x - 60 || p.x > bounds.x + bounds.width + 60 || p.y < bounds.y - 60 || p.y > bounds.y + bounds.height + 60) {
        this.activeCrescentWaves.splice(i, 1);
      }
    }

    // Soul Splitter & Split Shards
    if (this.activeSoulSplitter) {
      const sp = this.activeSoulSplitter;
      sp.timer--;
      if (sp.stage === 'aim') {
        if (sp.timer <= 0) {
          sp.stage = 'split';
          sp.maxTimer = cfg.soulSplitterSplitFrames ?? 18;
          sp.timer = sp.maxTimer;
          this._detonateSoulSplitter(sp, enemies, cfg);
        }
      } else if (sp.timer <= 0) {
        this.activeSoulSplitter = null;
      }
    }
    this._updateShardArray(this.activeSplitShards, enemies, bounds, 12, true);

    // Diamond Storm Projectiles
    for (let i = this.activeDiamondProjectiles.length - 1; i >= 0; i--) {
      const d = this.activeDiamondProjectiles[i];
      d.age = (d.age || 0) + 1;
      if (d.stage === 'track') {
        if (d.target && d.target.hp > 0) {
          d.angle = Math.atan2(d.target.y - d.y, d.target.x - d.x);
        }
        d.timer--;
        if (d.timer <= 0) {
          d.stage = 'lock';
          d.timer = d.lockFrames || 10;
          this._playAudio('fountainTarget', 'Assets/Sound Effects/KaizoKnightSFX/snd_fountain_target.ogg', 0.72);
        }
      } else if (d.stage === 'lock') {
        d.timer--;
        if (d.timer <= 0) {
          d.stage = 'fire';
          const spd = cfg.diamondStormSpeed ?? 14.5;
          d.vx = Math.cos(d.angle) * spd;
          d.vy = Math.sin(d.angle) * spd;
          this._playAudio('cut2', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_cut2.wav', 0.72, 1.25);
        }
      } else {
        d.x += d.vx;
        d.y += d.vy;
        d.life--;
        for (const e of enemies) {
          if (d.hitSet.has(e)) continue;
          if (Math.hypot(e.x - d.x, e.y - d.y) <= (e.r || 25) + 16) {
            d.hitSet.add(e);
            this._dealKaizoDamage(e, d.damage, { isProjectile: true, applyGloom: true });
            spawnSparks(e.x, e.y, 4, 'blue', { color: '#86A2FF' });
          }
        }
        if (d.life <= 0) this.activeDiamondProjectiles.splice(i, 1);
      }
    }

    // Vortex Sword Storm
    this._updateVortexSwords(enemies, cfg);

    // Kaizo Tunnel Swords, Slash FX & Beams
    this._updateTunnelVfx(enemies, bounds, cfg);

    // Hypernova Starstorm Cone, Stars & Homing Shards
    this._updateHypernovaVfx(enemies, bounds, cfg);

    // Roaring Delta Fountain Bullets, Shockwave Ripples & Shatter Timer
    this._updateShardArray(this.activeFountainBullets, enemies, bounds, 12, false);
    for (let i = this.activeShockwaveRipples.length - 1; i >= 0; i--) {
      this.activeShockwaveRipples[i].life--;
      if (this.activeShockwaveRipples[i].life <= 0) this.activeShockwaveRipples.splice(i, 1);
    }
    if (this.roaringDeltaShatterTimer > 0) {
      this.roaringDeltaShatterTimer--;
    }
  }

  _updateShardArray(arr, enemies, bounds, hitRadius, applyGloom) {
    for (let i = arr.length - 1; i >= 0; i--) {
      const b = arr[i];
      b.age = (b.age || 0) + 1;
      b.x += b.vx;
      b.y += b.vy;
      b.life--;
      for (const e of enemies) {
        if (b.hitSet && b.hitSet.has(e)) continue;
        if (Math.hypot(e.x - b.x, e.y - b.y) <= (e.r || 25) + hitRadius) {
          if (b.hitSet) b.hitSet.add(e);
          this._dealKaizoDamage(e, b.damage || 10, { isProjectile: true, applyGloom });
          b.life = 0;
          break;
        }
      }
      if (b.life <= 0 || b.x < bounds.x - 80 || b.x > bounds.x + bounds.width + 80 || b.y < bounds.y - 80 || b.y > bounds.y + bounds.height + 80) {
        arr.splice(i, 1);
      }
    }
  }

  _checkLineCutHits(slashObj, enemies) {
    const len = (slashObj.len || 560) * 0.5;
    const hw = (slashObj.halfWidth || 20) + 8;
    const cosA = Math.cos(slashObj.angle || 0);
    const sinA = Math.sin(slashObj.angle || 0);
    for (const e of enemies) {
      if (slashObj.hitSet.has(e)) continue;
      const dx = e.x - slashObj.cx;
      const dy = e.y - slashObj.cy;
      const along = dx * cosA + dy * sinA;
      const perp = Math.abs(-dx * sinA + dy * cosA);
      if (Math.abs(along) <= len && perp <= hw + (e.r || 25) * 0.7) {
        slashObj.hitSet.add(e);
        this._dealKaizoDamage(e, slashObj.damage || 14, { isAOE: true, applyGloom: Boolean(slashObj.applyGloom) });
        spawnSparks(e.x, e.y, 4, 'red', { color: slashObj.color || '#FF1E4D' });
      }
    }
  }

  _detonateSoulSplitter(sp, enemies, cfg) {
    triggerGlobalScreenShake(7.0, 12);
    this._playAudio('boxBreak', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_boxbreak.wav', 0.92);
    this._playAudio('dtransFlip', 'Assets/Sound Effects/KaizoKnightSFX/snd_dtrans_flip.ogg', 0.80);

    const cosA = Math.cos(sp.angle);
    const sinA = Math.sin(sp.angle);
    const dmg = cfg.soulSplitterDamage ?? 24;
    const kb = cfg.soulSplitterKnockback ?? 11.0;
    const hw = cfg.soulSplitterHalfWidth ?? 22;

    for (const e of enemies) {
      const dx = e.x - sp.cx;
      const dy = e.y - sp.cy;
      const signedPerp = -dx * sinA + dy * cosA;
      if (Math.abs(signedPerp) <= hw + (e.r || 25)) {
        this._dealKaizoDamage(e, dmg, { isAOE: true, applyGloom: true });
        const pushSign = signedPerp >= 0 ? 1 : -1;
        e.vx = (e.vx || 0) - sinA * pushSign * kb;
        e.vy = (e.vy || 0) + cosA * pushSign * kb;
      }
    }

    // Spawn bidirectional perpendicular split_bullet shards along fault line
    const count = cfg.soulSplitterShardCount ?? 12;
    const spd = cfg.soulSplitterShardSpeed ?? 9.8;
    const shardDmg = cfg.soulSplitterShardDamage ?? 11;
    const normalAngle = sp.angle + Math.PI / 2;
    for (let i = 0; i < count; i++) {
      const t = (i / Math.max(1, count - 1)) - 0.5;
      const offsetAlong = t * 340;
      const bx = sp.cx + cosA * offsetAlong;
      const by = sp.cy + sinA * offsetAlong;
      const dir = (i % 2 === 0) ? 1 : -1;
      const a = normalAngle + (dir < 0 ? Math.PI : 0);
      this.activeSplitShards.push({
        x: bx,
        y: by,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        angle: a,
        damage: shardDmg,
        life: 44,
        age: 0,
        hitSet: new Set(),
      });
    }
  }

  _updateVortexSwords(enemies, cfg) {
    if (this._vortexSeq) {
      const seq = this._vortexSeq;
      seq.timer++;
      const total = cfg.vortexOrbitFrames ?? 66;
      const p = Math.min(1, seq.timer / total);
      const startR = cfg.vortexStartRadius ?? 155;
      const minR = cfg.vortexMinRadius ?? 56;
      const curR = startR - (startR - minR) * Math.pow(p, 0.85);
      seq.rot += 0.08 + 0.14 * p;

      for (let i = 0; i < this.activeVortexSwords.length; i++) {
        const s = this.activeVortexSwords[i];
        const a = seq.rot + (i / this.activeVortexSwords.length) * Math.PI * 2;
        s.x = seq.cx + Math.cos(a) * curR;
        s.y = seq.cy + Math.sin(a) * curR;
        s.angle = a + Math.PI; // Aim inward toward target center
        s.crimson = p > 0.65;
        if (seq.timer % 8 === 0) {
          for (const e of enemies) {
            if (Math.hypot(e.x - s.x, e.y - s.y) <= (e.r || 25) + 18) {
              this._dealKaizoDamage(e, cfg.vortexDamage ?? 12, { isProjectile: true, applyGloom: true });
            }
          }
        }
      }

      if (seq.timer >= total) {
        // Detonate vortex into spiraling KaizoSpark bolts
        this._playAudio('dtransHeavyPassing', 'Assets/Sound Effects/KaizoKnightSFX/snd_dtrans_heavypassing.ogg', 0.82);
        const sparkSpd = cfg.vortexSparkSpeed ?? 8.6;
        const sparkDmg = cfg.vortexSparkDamage ?? 11;
        for (const s of this.activeVortexSwords) {
          const outA = s.angle + Math.PI;
          this.activeSplitShards.push({
            x: s.x,
            y: s.y,
            vx: Math.cos(outA) * sparkSpd,
            vy: Math.sin(outA) * sparkSpd,
            angle: outA,
            damage: sparkDmg,
            life: 40,
            age: 0,
            hitSet: new Set(),
          });
        }
        this.activeVortexSwords.length = 0;
        this._vortexSeq = null;
        this.isSkill1Channeling = false;
      }
    }
  }

  _updateTunnelVfx(enemies, bounds, cfg) {
    for (let i = this.activeTunnelSlashFX.length - 1; i >= 0; i--) {
      this.activeTunnelSlashFX[i].life--;
      if (this.activeTunnelSlashFX[i].life <= 0) this.activeTunnelSlashFX.splice(i, 1);
    }
    for (let i = this.activeTunnelBeams.length - 1; i >= 0; i--) {
      this.activeTunnelBeams[i].life--;
      if (this.activeTunnelBeams[i].life <= 0) this.activeTunnelBeams.splice(i, 1);
    }
    for (let i = this.activeTunnelSwords.length - 1; i >= 0; i--) {
      const s = this.activeTunnelSwords[i];
      if (s.finisherStage === 'lock') {
        s.timer--;
        if (s.timer <= 0) {
          const beamLen = 520;
          const x2 = s.x + Math.cos(s.angle) * beamLen;
          const y2 = s.y + Math.sin(s.angle) * beamLen;
          this.activeTunnelBeams.push({ x1: s.x, y1: s.y, x2, y2, halfWidth: 10, life: cfg.tunnelFinisherBeamLife ?? 12, maxLife: cfg.tunnelFinisherBeamLife ?? 12 });
          this._checkLineCutHits({ cx: (s.x + x2) * 0.5, cy: (s.y + y2) * 0.5, angle: s.angle, len: beamLen, halfWidth: 14, damage: cfg.tunnelFinisherDamage ?? 20, hitSet: new Set(), color: '#FF1E4D', applyGloom: true }, enemies);
          this.activeTunnelSwords.splice(i, 1);
        }
        continue;
      }
      s.speed = Math.min(cfg.tunnelMaxSpeed ?? 19.5, (s.speed ?? -5.2) + (cfg.tunnelGravity ?? 1.4));
      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      s.life--;
      for (const e of enemies) {
        if (s.hitSet.has(e)) continue;
        if (Math.hypot(e.x - s.x, e.y - s.y) <= (e.r || 25) + 14) {
          s.hitSet.add(e);
          this._dealKaizoDamage(e, cfg.tunnelDamage ?? 11, { isProjectile: true });
        }
      }
      if (s.life <= 0 || s.x < bounds.x - 100 || s.x > bounds.x + bounds.width + 100 || s.y < bounds.y - 100 || s.y > bounds.y + bounds.height + 100) {
        this.activeTunnelSwords.splice(i, 1);
      }
    }
  }

  _updateHypernovaVfx(enemies, bounds, cfg) {
    if (this._hypernovaSeq) {
      const seq = this._hypernovaSeq;
      seq.timer++;
      if (seq.stage === 'cone') {
        if (this.activeHypernovaCone) {
          this.activeHypernovaCone.x = this.x;
          this.activeHypernovaCone.y = this.y;
          this.activeHypernovaCone.alpha = 0.25 + 0.15 * Math.sin(seq.timer * 0.4);
        }
        if (seq.timer % 3 === 0 && seq.spawned < (cfg.hypernovaStarCount ?? 10)) {
          seq.spawned++;
          const spread = (Math.random() - 0.5) * 0.72;
          const a = seq.angle + spread;
          const spd = (cfg.hypernovaStarSpeed ?? 6.8) * (0.85 + Math.random() * 0.35);
          this.activeHypernovaStars.push({
            x: this.x + Math.cos(a) * 24,
            y: this.y + Math.sin(a) * 24,
            vx: Math.cos(a) * spd,
            vy: Math.sin(a) * spd,
            rot: Math.random() * Math.PI * 2,
            radius: 16,
            redLock: false,
            timer: 0,
            hitSet: new Set(),
          });
          this._playAudio('pulse', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_pulse.wav', 0.55, 1.45);
        }
        if (seq.timer >= (cfg.hypernovaConeFrames ?? 32)) {
          seq.stage = 'reverse';
          seq.timer = 0;
          this.activeHypernovaCone = null;
          this._playAudio('stretch', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_stretch.wav', 0.75);
        }
      } else if (seq.stage === 'reverse') {
        const pull = 0.38;
        for (const st of this.activeHypernovaStars) {
          st.vx -= Math.cos(seq.angle) * pull;
          st.vy -= Math.sin(seq.angle) * pull;
          st.x += st.vx;
          st.y += st.vy;
          st.rot += 0.18;
        }
        if (seq.timer >= (cfg.hypernovaReverseFrames ?? 36)) {
          seq.stage = 'red_lock';
          seq.timer = 0;
          for (const st of this.activeHypernovaStars) {
            st.vx = 0;
            st.vy = 0;
            st.redLock = true;
          }
          this._playAudio('starExplosion', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_star_explosion_close.wav', 0.85, 0.8, 0.35);
        }
      } else if (seq.stage === 'red_lock') {
        if (seq.timer >= (cfg.hypernovaRedLockFrames ?? 16)) {
          this._detonateHypernovaStars(enemies, cfg);
          this._hypernovaSeq = null;
          this.isHypernovaCasting = false;
        }
      }
    }

    for (let i = this.activeHypernovaShards.length - 1; i >= 0; i--) {
      const sh = this.activeHypernovaShards[i];
      sh.timer = (sh.timer || 0) + 1;
      if (!sh.crimson && sh.timer >= 14) {
        sh.crimson = true;
        const target = enemies[0];
        if (target) {
          const aim = Math.atan2(target.y - sh.y, target.x - sh.x);
          const spd = cfg.hypernovaShardSpeed ?? 11.2;
          sh.vx = Math.cos(aim) * spd;
          sh.vy = Math.sin(aim) * spd;
          sh.angle = aim;
        }
        this._playAudio('laser', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_laser.wav', 0.60, 1.25);
      }
      sh.x += sh.vx;
      sh.y += sh.vy;
      sh.life--;
      for (const e of enemies) {
        if (sh.hitSet.has(e)) continue;
        if (Math.hypot(e.x - sh.x, e.y - sh.y) <= (e.r || 25) + 12) {
          sh.hitSet.add(e);
          this._dealKaizoDamage(e, sh.damage, { isProjectile: true, applyGloom: true });
          sh.life = 0;
          break;
        }
      }
      if (sh.life <= 0 || sh.x < bounds.x - 60 || sh.x > bounds.x + bounds.width + 60 || sh.y < bounds.y - 60 || sh.y > bounds.y + bounds.height + 60) {
        this.activeHypernovaShards.splice(i, 1);
      }
    }
  }

  _detonateHypernovaStars(enemies, cfg) {
    this._playAudio('cutExplosion', 'Assets/Sound Effects/Attacks/explosion.mp3', 0.30);
    triggerGlobalScreenShake(5.5, 10);
    const beamDmg = cfg.hypernovaBeamDamage ?? 14;
    const shardDmg = cfg.hypernovaShardDamage ?? 11;

    for (const st of this.activeHypernovaStars) {
      for (const e of enemies) {
        if (Math.hypot(e.x - st.x, e.y - st.y) <= (e.r || 25) + 46) {
          this._dealKaizoDamage(e, beamDmg, { isAOE: true });
        }
      }
      // Emit 2 Phase-3 style shards per star that hover then turn crimson and snipe
      for (let k = 0; k < 2; k++) {
        const a = st.rot + k * Math.PI + (Math.random() - 0.5) * 0.5;
        this.activeHypernovaShards.push({
          x: st.x,
          y: st.y,
          vx: Math.cos(a) * 2.2,
          vy: Math.sin(a) * 2.2,
          angle: a,
          damage: shardDmg,
          crimson: false,
          timer: 0,
          life: 68,
          hitSet: new Set(),
        });
      }
    }
    this.activeHypernovaStars.length = 0;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // MAIN COMBAT UPDATE LOOP
  // ═════════════════════════════════════════════════════════════════════════
  update(opponent, ownerIndex, arena) {
    this._vfxTick++;
    // Rule 25: Always decay transient VFX & speech timers before freeze/time-stop guard
    updateFighterSpeech(this);
    this._updateAllVfxLifecycles(arena);

    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks();
      return;
    }

    const cfg = this._cfg();

    // Decrement internal timers
    if (this.parryCooldownTimer > 0) this.parryCooldownTimer--;
    if (this._parrySfxCooldownTimer > 0) this._parrySfxCooldownTimer--;
    if (this.blockPoseTimer > 0) this.blockPoseTimer--;
    if (this.parryHitAnimTimer > 0) this.parryHitAnimTimer--;
    if (this.parryWhiteFlashTimer > 0) this.parryWhiteFlashTimer--;
    if (this.parryShakeTimer > 0) this.parryShakeTimer--;

    if (this.kaizoStepCooldownTimer > 0) this.kaizoStepCooldownTimer--;
    if (this.basicAttackCooldownTimer > 0) this.basicAttackCooldownTimer--;
    if (this.skill1CooldownTimer > 0) this.skill1CooldownTimer--;
    if (this.hypernovaCooldownTimer > 0) this.hypernovaCooldownTimer--;
    if (this.roaringDeltaCooldownTimer > 0) this.roaringDeltaCooldownTimer--;

    // Prismatic RGB Afterimage trail gating (Rule 35 velocity + interval throttle)
    const speedMag = Math.hypot(this.vx || 0, this.vy || 0);
    this._afterImageTick++;
    if (speedMag >= (cfg.afterImageMinSpeed ?? 4.5) && this._afterImageTick % (cfg.afterImageInterval ?? 3) === 0) {
      this._afterImageColorIndex = (this._afterImageColorIndex + 1) % 4;
      this.afterImages.push({
        x: this.x,
        y: this.y,
        angle: this.gunAngle || 0,
        timer: cfg.afterImageLife ?? 20,
        maxTimer: cfg.afterImageLife ?? 20,
        tintIndex: this._afterImageColorIndex,
      });
    }

    const targets = this._getAllEnemyTargets(opponent);
    const primaryTarget = targets[0] || null;
    tickFighterIntroAndWinSpeech(this, primaryTarget || opponent, {
      introText: '...kaizo trial begins.',
      winText: '...consumed by the fountain.',
      speechStyle: { borderColor: '#4F46E5', blipSpeed: 0.58 },
    });
    if (this.canAim() && primaryTarget) {
      this.aim(primaryTarget);
    }

    // 1. Update Active Sequences
    if (this.isMeleeSwinging) {
      this._updateMeleeSwing(targets, cfg);
    }
    if (this._diamondSeq) {
      this._updateDiamondSeq(primaryTarget, cfg);
    }
    if (this._tunnelSeq) {
      this._updateTunnelSeq(primaryTarget, arena, cfg);
    }
    if (this.isRoaringDeltaActive) {
      this._updateRoaringDeltaSeq(targets, arena, cfg);
    }

    // 2. AI / Decision Trigger Hierarchy (Ultimate -> Random Skill 1 -> Basic Attack -> Kaizo Step)
    const isBusy = this.isMeleeSwinging || this.isRoaringDeltaActive || this.isHypernovaCasting || this.isSkill1Channeling;
    if (!isBusy && primaryTarget) {
      const dist = Math.hypot(primaryTarget.x - this.x, primaryTarget.y - this.y);
      const hitsReq = Math.max(1, cfg.swoonHitsRequired ?? 5);

      if (isSkillEnabled(cfg.enableRoaringDelta, true) && this.swoonBasicHits >= hitsReq && this.roaringDeltaCooldownTimer <= 0 && dist <= (cfg.roaringDeltaTriggerRange ?? 210)) {
        this._startRoaringDelta(primaryTarget, arena, cfg);
      } else if (isSkillEnabled(cfg.enableSkill1, true) && this.skill1CooldownTimer <= 0 && this._castRandomSkill1(primaryTarget, arena, cfg)) {
        // Triggered random Skill 1 successfully
      } else if (isSkillEnabled(cfg.enableQuickslashBasic, true) && this.basicAttackCooldownTimer <= 0 && dist <= (cfg.basicAttackReach ?? 185)) {
        this._startBasicCleave(primaryTarget, cfg);
      } else if (isSkillEnabled(cfg.enableKaizoGloom, true) && this.kaizoStepCooldownTimer <= 0 && dist > 110) {
        const dashA = Math.atan2(primaryTarget.y - this.y, primaryTarget.x - this.x) + (Math.random() - 0.5) * 0.6;
        const dashSpd = cfg.kaizoStepDashSpeed ?? 15.0;
        this.vx = Math.cos(dashA) * dashSpd;
        this.vy = Math.sin(dashA) * dashSpd;
        this.kaizoStepCooldownTimer = cfg.kaizoStepCooldown ?? 105;
        this._playAudio('teleport', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_teleport.wav', 0.62, 1.35);
      }
    }

    // 3. Centralized Physics & Wall Bounce (Rule 1.2)
    super.update(opponent, ownerIndex, arena);
  }

  _startBasicCleave(target, cfg) {
    this.meleeCastAngle = Math.atan2(target.y - this.y, target.x - this.x);
    this.gunAngle = this.meleeCastAngle;
    this.isMeleeSwinging = true;
    this.meleePhase = 1;
    this.meleePhaseMaxTimer = Math.max(1, cfg.knifeWindupFrames ?? 6);
    this.meleePhaseTimer = this.meleePhaseMaxTimer;
    this.meleePhaseProgress = 0;
    this.meleeHitRegistered = false;
    this.meleeComboFlip = !this.meleeComboFlip;
    this.basicAttackCooldownTimer = cfg.basicAttackCooldown ?? 64;
    // Dash impulse toward target
    const spd = cfg.knifeDashSpeed ?? 12.5;
    this.vx = Math.cos(this.meleeCastAngle) * spd;
    this.vy = Math.sin(this.meleeCastAngle) * spd;
  }

  _updateMeleeSwing(targets, cfg) {
    this.gunAngle = this.meleeCastAngle;
    this.meleePhaseTimer--;
    this.meleePhaseProgress = 1 - Math.max(0, this.meleePhaseTimer) / Math.max(1, this.meleePhaseMaxTimer);

    if (this.meleePhase === 4) {
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
        this._playAudio('cut1', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_cut.wav', 0.85, 1.1);
      } else if (this.meleePhase === 4) {
        this.meleePhaseMaxTimer = Math.max(1, cfg.knifeImpactLockFrames ?? 3);
      } else if (this.meleePhase === 5) {
        this.meleePhaseMaxTimer = Math.max(1, cfg.knifeRecoveryFrames ?? 4);
      } else {
        this.isMeleeSwinging = false;
        this.meleePhase = 0;
        this.meleePhaseProgress = 0;
      }
      this.meleePhaseTimer = this.meleePhaseMaxTimer;
    }
  }

  _executeBasicStrikeHit(targets, cfg) {
    const reach = cfg.basicAttackReach ?? 185;
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
      if (diff <= halfArc) {
        if (this._dealKaizoDamage(t, dmg, { isMelee: true, applyGloom: true, incrementUlt: !landed })) {
          landed = true;
          t.vx = (t.vx || 0) + Math.cos(this.meleeCastAngle) * kb;
          t.vy = (t.vy || 0) + Math.sin(this.meleeCastAngle) * kb;
          spawnSparks(t.x, t.y, 6, 'blue', { color: '#86A2FF' });
        }
      }
    }

    if (landed) {
      triggerGlobalScreenShake(4.0, 6);
      this._playAudio('hitStrong', 'Assets/Sound Effects/RoaringKnightSFX/snd_metal_hit_strong.wav', 0.72, 1.15);
    }

    // Emit Kaizo Crescent Slash wave + alternating multi-cut board slashes
    const wSpd = cfg.crescentWaveSpeed ?? 12.5;
    this.activeCrescentWaves.push({
      x: this.x + Math.cos(this.meleeCastAngle) * ((this.r || 25) + 12),
      y: this.y + Math.sin(this.meleeCastAngle) * ((this.r || 25) + 12),
      vx: Math.cos(this.meleeCastAngle) * wSpd,
      vy: Math.sin(this.meleeCastAngle) * wSpd,
      angle: this.meleeCastAngle,
      damage: cfg.crescentWaveDamage ?? 14,
      knockback: cfg.crescentWaveKnockback ?? 5.5,
      life: cfg.crescentWaveLife ?? 48,
      scale: 1.25,
      hitSet: new Set(),
    });

    const seqArr = cfg.basicSlashArray || [2, 3, 4];
    const cutCount = seqArr[this._basicSlashStep % seqArr.length];
    this._basicSlashStep++;
    const anchorX = this.x + Math.cos(this.meleeCastAngle) * ((this.r || 25) * 2.2);
    const anchorY = this.y + Math.sin(this.meleeCastAngle) * ((this.r || 25) * 2.2);
    for (let i = 0; i < cutCount; i++) {
      const a = this.meleeCastAngle + (i / cutCount) * Math.PI + (Math.random() - 0.5) * 0.25;
      this.activeBoardSlashes.push({
        cx: anchorX,
        cy: anchorY,
        angle: a,
        len: 460,
        halfWidth: cfg.basicSlashHalfWidth ?? 20,
        telegraph: (cfg.basicSlashAimFrames ?? 12) + i * 3,
        life: cfg.basicSlashMaxTimer ?? 14,
        maxLife: cfg.basicSlashMaxTimer ?? 14,
        damage: Math.round(dmg * 0.6),
        color: i % 2 === 0 ? '#86A2FF' : '#FF1E4D',
        applyGloom: true,
        hitSet: new Set(),
      });
    }
  }

  _castRandomSkill1(target, arena, cfg = this._cfg()) {
    const options = [];
    if (isSkillEnabled(cfg.enableSoulSplitter, true)) options.push('soul_splitter');
    if (isSkillEnabled(cfg.enableDiamondStorm, true)) options.push('diamond_storm');
    if (isSkillEnabled(cfg.enableVortexStorm, true)) options.push('vortex_storm');
    if (isSkillEnabled(cfg.enableKaizoTunnel, true)) options.push('kaizo_tunnel');
    if (isSkillEnabled(cfg.enableHypernova, true)) options.push('hypernova');
    if (options.length === 0) return false;

    const nonRepeat = options.filter(id => id !== this._activeSkill1Id);
    const pool = nonRepeat.length > 0 ? nonRepeat : options;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return this._executeSkill1ById(pick, target, arena, cfg);
  }

  _executeSkill1ById(pick, target, arena, cfg = this._cfg()) {
    this.skill1CooldownTimer = cfg.skill1Cooldown ?? 390;
    this.skill1CooldownMax = cfg.skill1Cooldown ?? 390;
    this._activeSkill1Id = pick;

    if (pick === 'soul_splitter') {
      this._activeSkill1Label = cfg.soulSplitterSkillName || 'SOUL SPLITTER';
      this.activeSoulSplitter = {
        cx: target.x,
        cy: target.y,
        angle: Math.atan2(target.y - this.y, target.x - this.x) + (Math.random() - 0.5) * 0.5,
        stage: 'aim',
        timer: cfg.soulSplitterAimFrames ?? 20,
      };
      this._playAudio('dtransSquare', 'Assets/Sound Effects/KaizoKnightSFX/snd_dtrans_square.ogg', 0.80);
    } else if (pick === 'diamond_storm') {
      this._activeSkill1Label = cfg.diamondStormSkillName || 'DIAMOND STORM';
      this.isSkill1Channeling = true;
      this._diamondSeq = { timer: 0, spawned: 0 };
      this._playAudio('dtransTwinkle', 'Assets/Sound Effects/KaizoKnightSFX/snd_dtrans_twinkle.ogg', 0.78);
    } else if (pick === 'vortex_storm') {
      this._activeSkill1Label = cfg.vortexStormSkillName || 'VORTEX STORM';
      this.isSkill1Channeling = true;
      const cnt = cfg.vortexSwordCount ?? 8;
      this.activeVortexSwords = [];
      for (let i = 0; i < cnt; i++) {
        this.activeVortexSwords.push({ x: target.x, y: target.y, angle: 0, crimson: false });
      }
      this._vortexSeq = { cx: target.x, cy: target.y, timer: 0, rot: 0 };
      this._playAudio('drawPower', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_drawpower.wav', 0.78);
    } else if (pick === 'kaizo_tunnel') {
      this._activeSkill1Label = cfg.kaizoTunnelSkillName || 'KAIZO TUNNEL';
      this.isSkill1Channeling = true;
      const a = Math.atan2(target.y - this.y, target.x - this.x);
      this._tunnelSeq = { timer: 0, rot: a, side: 1 };
      this._playAudio('fallingSword', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_fallingsword.ogg', 0.78);
    } else if (pick === 'hypernova') {
      this._activeSkill1Label = cfg.hypernovaSkillName || 'HYPERNOVA';
      this._startHypernova(target, cfg);
    }
    return true;
  }

  _updateDiamondSeq(target, cfg) {
    const seq = this._diamondSeq;
    seq.timer++;
    const interval = cfg.diamondStormSpawnInterval ?? 4;
    const total = cfg.diamondStormCount ?? 12;
    if (seq.timer % interval === 0 && seq.spawned < total) {
      const a = (seq.spawned / total) * Math.PI * 2;
      const dist = 125;
      const cx = target ? target.x : this.x;
      const cy = target ? target.y : this.y;
      this.activeDiamondProjectiles.push({
        x: cx + Math.cos(a) * dist,
        y: cy + Math.sin(a) * dist,
        vx: 0,
        vy: 0,
        angle: a + Math.PI,
        target,
        stage: 'track',
        timer: cfg.diamondStormTrackFrames ?? 16,
        lockFrames: cfg.diamondStormLockFrames ?? 10,
        damage: cfg.diamondStormDamage ?? 14,
        life: 64,
        hitSet: new Set(),
      });
      seq.spawned++;
    }
    if (seq.spawned >= total) {
      this._diamondSeq = null;
      this.isSkill1Channeling = false;
    }
  }

  _updateTunnelSeq(target, arena, cfg) {
    const seq = this._tunnelSeq;
    seq.timer++;
    const dur = cfg.tunnelDurationFrames ?? 96;
    const interval = cfg.tunnelSpawnInterval ?? 4;
    if (seq.timer % interval === 0 && seq.timer < dur - 16) {
      seq.rot += ((cfg.tunnelRotateStepDeg ?? 5.2) * Math.PI) / 180;
      const cx = (arena?.x ?? 45) + (arena?.width ?? 450) * 0.5;
      const cy = (arena?.y ?? 240) + (arena?.height ?? 450) * 0.5;
      const gap = cfg.tunnelGapHalfWidth ?? 40;
      for (const side of [-1, 1]) {
        const perpA = seq.rot + side * (Math.PI / 2);
        this.activeTunnelSwords.push({
          x: cx + Math.cos(perpA) * (gap + 42),
          y: cy + Math.sin(perpA) * (gap + 42),
          angle: seq.rot,
          speed: cfg.tunnelPullSpeed ?? -5.2,
          life: 52,
          hitSet: new Set(),
        });
      }
      if (seq.timer % 16 === 0 && target) {
        const slashA = Math.atan2(target.y - this.y, target.x - this.x);
        this.activeTunnelSlashFX.push({ x: target.x, y: target.y, angle: slashA, life: 12, maxLife: 12 });
      }
    }
    if (seq.timer >= dur) {
      // Lock 4 blades into crimson finisher telegraph
      for (let i = 0; i < Math.min(4, this.activeTunnelSwords.length); i++) {
        const sw = this.activeTunnelSwords[i];
        sw.finisherStage = 'lock';
        sw.timer = cfg.tunnelFinisherAimFrames ?? 16;
        if (target) sw.angle = Math.atan2(target.y - sw.y, target.x - sw.x);
        sw.telegraph = sw.timer;
      }
      this._playAudio('beam', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_beam.wav', 0.80);
      this._tunnelSeq = null;
      this.isSkill1Channeling = false;
    }
  }

  _startHypernova(target, cfg) {
    this.isHypernovaCasting = true;
    this.hypernovaCooldownTimer = cfg.hypernovaCooldown ?? 540;
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    this.activeHypernovaCone = { x: this.x, y: this.y, angle, alpha: 0.35 };
    this._hypernovaSeq = { stage: 'cone', timer: 0, angle, spawned: 0 };
    this._playAudio('greatShine', 'Assets/Sound Effects/KaizoKnightSFX/snd_great_shine.ogg', 0.84);
  }

  _startRoaringDelta(target, arena, cfg) {
    this.swoonBasicHits = 0;
    this.isRoaringDeltaActive = true;
    this.roaringDeltaCooldownTimer = cfg.roaringDeltaCooldown ?? 0;
    this.roaringDeltaVortexMax = cfg.roaringDeltaVortexFrames ?? 38;
    this.roaringDeltaVortexTimer = this.roaringDeltaVortexMax;
    this.roaringDeltaFrenzyTimer = 0;

    // Rule 1.4: Lock aim toward opponent & spawn Roaring Delta directly in front of Kaizo Knight (no center teleport!)
    const castAngle = target ? Math.atan2(target.y - this.y, target.x - this.x) : (this.gunAngle || 0);
    this.skillCastAngle = castAngle;
    this.gunAngle = castAngle;
    this.vx = 0;
    this.vy = 0;

    const bounds = arena || { x: 45, y: 240, width: 450, height: 450 };
    const frontOffset = (this.r || 25) * (cfg.roaringDeltaFrontOffsetMultiplier ?? 2.5);
    const rawFx = this.x + Math.cos(castAngle) * frontOffset;
    const rawFy = this.y + Math.sin(castAngle) * frontOffset;
    const frontX = Math.max(bounds.x + 28, Math.min(bounds.x + bounds.width - 28, rawFx));
    const frontY = Math.max(bounds.y + 28, Math.min(bounds.y + bounds.height - 28, rawFy));
    this.roaringDeltaOrigin = { x: frontX, y: frontY, angle: castAngle };

    this._roaringDeltaSeq = { stage: 'vortex', timer: 0, frenzyCount: 0, frontX, frontY, castAngle };
    this._playAudio('fountainMake', 'Assets/Sound Effects/KaizoKnightSFX/snd_fountain_make.ogg', 0.88);
    this._playAudio('roar', 'Assets/Sound Effects/RoaringKnightSFX/snd_knightroar.wav', 0.92);
    spawnFloatingText(this.x, this.y - (this.r || 25) - 22, 'ROARING DELTA!', '#FF1E4D');
    triggerFighterSpeech(this, 'ROARING DELTA.', { duration: 110, force: true, preserveCase: true, borderColor: '#4F46E5', blipSpeed: 0.58 });
  }

  _updateRoaringDeltaSeq(targets, arena, cfg) {
    const seq = this._roaringDeltaSeq;
    if (!seq) {
      this.isRoaringDeltaActive = false;
      return;
    }
    this.vx = 0;
    this.vy = 0;
    seq.timer++;
    const ox = seq.frontX ?? this.roaringDeltaOrigin?.x ?? this.x;
    const oy = seq.frontY ?? this.roaringDeltaOrigin?.y ?? this.y;

    if (seq.stage === 'vortex') {
      if (this.roaringDeltaVortexTimer > 0) this.roaringDeltaVortexTimer--;
      // Gentle Dark Fountain suction pulling targets into the vortex directly in front of Kaizo Knight
      const pull = cfg.roaringDeltaVortexPull ?? 3.4;
      for (const e of targets) {
        if (e.isPullImmune) continue;
        const dx = ox - e.x;
        const dy = oy - e.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        if (d > 36) {
          e.x += (dx / d) * pull;
          e.y += (dy / d) * pull;
        }
      }
      if (seq.timer % 4 === 0) {
        const randA = Math.random() * Math.PI * 2;
        const dist = 210;
        const bx = ox + Math.cos(randA) * dist;
        const by = oy + Math.sin(randA) * dist;
        const inA = Math.atan2(oy - by, ox - bx);
        this.activeFountainBullets.push({
          x: bx,
          y: by,
          vx: Math.cos(inA) * 7.5,
          vy: Math.sin(inA) * 7.5,
          damage: cfg.roaringDeltaFountainBulletDamage ?? 8,
          r: 6,
          life: 38,
          hitSet: new Set(),
        });
      }
      if (this.roaringDeltaVortexTimer <= 0) {
        seq.stage = 'frenzy';
        seq.timer = 0;
        this.roaringDeltaFrenzyTimer = (cfg.roaringDeltaFrenzyCount ?? 14) * (cfg.roaringDeltaFrenzyInterval ?? 3);
        this._playAudio('himQuick', 'Assets/Sound Effects/KaizoKnightSFX/snd_him_quick.ogg', 0.85);
      }
    } else if (seq.stage === 'frenzy') {
      if (this.roaringDeltaFrenzyTimer > 0) this.roaringDeltaFrenzyTimer--;
      const interval = cfg.roaringDeltaFrenzyInterval ?? 3;
      const maxCuts = cfg.roaringDeltaFrenzyCount ?? 14;
      if (seq.timer % interval === 0 && seq.frenzyCount < maxCuts) {
        seq.frenzyCount++;
        const slashObj = {
          cx: ox + (Math.random() - 0.5) * 44,
          cy: oy + (Math.random() - 0.5) * 44,
          angle: Math.random() * Math.PI * 2,
          len: 540,
          halfWidth: 26,
          telegraph: 0,
          life: 12,
          maxLife: 12,
          damage: cfg.roaringDeltaFrenzyDamage ?? 10,
          color: seq.frenzyCount % 2 === 0 ? '#FF1E4D' : '#86A2FF',
          applyGloom: true,
          hitSet: new Set(),
        };
        this.activeBoardSlashes.push(slashObj);
        this._checkLineCutHits(slashObj, targets);
        this._playAudio(seq.frenzyCount % 2 === 0 ? 'cut1' : 'cut2', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_cut.wav', 0.72, 1.2);
      }
      if (seq.frenzyCount >= maxCuts && this.roaringDeltaFrenzyTimer <= 0) {
        // Screen Shatter Climax anchored right in front of Kaizo Knight
        this.roaringDeltaShatterMax = cfg.roaringDeltaShatterFrames ?? 32;
        this.roaringDeltaShatterTimer = this.roaringDeltaShatterMax;
        this.activeShockwaveRipples.push({ x: ox, y: oy, maxRadius: 210, life: 28, maxLife: 28 });
        this._playAudio('useFountain', 'Assets/Sound Effects/KaizoKnightSFX/snd_usefountain.ogg', 0.92);
        this._playAudio('powerupWhite', 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_powerup_white.wav', 0.85);
        triggerGlobalScreenShake(10.0, 16);

        const shatterDmg = cfg.roaringDeltaShatterDamage ?? 34;
        const shatterKb = cfg.roaringDeltaShatterKnockback ?? 14.0;
        for (const e of targets) {
          this._dealKaizoDamage(e, shatterDmg, { isAOE: true, isGuaranteedHit: true, applyGloom: true });
          const pushA = Math.atan2(e.y - this.y, e.x - this.x);
          e.vx = (e.vx || 0) + Math.cos(pushA) * shatterKb;
          e.vy = (e.vy || 0) + Math.sin(pushA) * shatterKb;
        }
        this._roaringDeltaSeq = null;
        this.isRoaringDeltaActive = false;
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDERING PIPELINE (Rules 20, 21, 32, 35)
  // ═════════════════════════════════════════════════════════════════════════
  drawBody(ctx) {
    drawKaizoKnightSkin(ctx, this);
  }

  draw(ctx) {
    // 1. Prismatic RGB Afterimages
    for (let i = 0; i < this.afterImages.length; i++) {
      const ai = this.afterImages[i];
      const alpha = (ai.timer / Math.max(1, ai.maxTimer || 20)) * 0.45;
      drawKaizoKnightGhostSkin(ctx, ai.x, ai.y, ai.angle, this.r || 25, alpha, ai.tintIndex || 0);
    }

    // 2. World-space Skill Projectiles & Slashes
    for (const cw of this.activeCrescentWaves) drawKaizoCrescentProjectile(ctx, cw);
    for (const dp of this.activeDiamondProjectiles) drawDiamondStormProjectile(ctx, dp);
    drawSoulSplitterVFX(ctx, this.activeSoulSplitter, this.activeSplitShards);
    drawKaizoSwordVortexAndTunnelVFX(ctx, this);
    drawHypernovaStarstormVFX(ctx, this);
    drawRoaringDeltaVFX(ctx, this);
    for (const bs of this.activeBoardSlashes) drawKaizoBoardSlashVFX(ctx, bs);

    // 3. Canonical Fighter Body + Radiant Knife + Parry Shield
    this.drawBody(ctx);
    drawKaizoKnightRadiantKnife(ctx, this);
    drawKaizoParryVFX(ctx, this);

    // 4. Mandatory Rule 21 Overhead HP & Status Overlays + Deltarune Speech Bubble
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
    drawSansSpeechBubble(ctx, this);
  }
}
