// ─────────────────────────────────────────────
// CHOSO FIGHTER ENTITY (JUJUTSU KAISEN)
// Cursed Womb: Death Painting Eldest Brother
// Wielder of Blood Manipulation & Sanguine Laser Transmutation
// Strictly adheres to:
// - Rule 1.1: Freeze & TimeStop Early Exit Guard
// - Rule 1.2: Centralized Movement & Physics Delegation
// - Rule 1.4: 360° Omnidirectional Aiming & Aim Lock during Channeled Skills
// - Rule 1.5: Attacker vs Target Freeze (Locks target, never self)
// - Rule 1.6: Frontal Arc AOE checking state.fighters and state.illusions
// - Rule 1.7: Gojo Limitless Infinity Barrier Verification
// - Rule 1.8 & Rule 23: Mandatory Basic Projectile Suppression (shoot() overridden)
// - Rule 1.9 & Rule 25: Non-Freezing Active VFX & Particle Lifecycles at top of update
// - Rule 2.9 & Rule 21: Overhead Health & Freeze Drawing in draw()
// - Rule 2.11 & Rule 26: Clean Concentric Shockwaves
// - Rule 2.12 & Rule 27: Healthbar-Only Feedback (No arena floating text for lifesteal)
// - Rule 30: 5-Phase Melee Combat & Physical Force
// ─────────────────────────────────────────────

import { Fighter, applyDamageToTarget, isSkillEnabled, computeScaledFighterRadius } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { state, triggerGlobalScreenShake } from '../../core/state.js';
import { drawChosoSkin } from '../../graphics/fighters/chosoSkin.js';
import {
  drawBloodDropletNode,
  drawLaserTelegraphLine,
  drawLaserLockInLine,
  drawLaserLockInReticle,
  drawBloodLaserBeam,
  drawBloodChakram,
  drawSupernovaVisuals,
  drawPiercingBloodBeam,
  drawChosoBloodSplashes,
  resolvePiercingBloodStrikePoint,
  getRayArenaIntersection
} from '../../graphics/weapons/chosoBloodGraphics.js';
import { spawnSparks } from '../../graphics/particles/sparkEffect.js';
import { getBloodSprite, releaseBloodParticle } from '../../graphics/particles/bloodEffect.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { stopLoopingSound, fadeOutLoopingSound } from '../../systems/soundSystem.js';
import { fastCleanArray } from '../../graphics/particles/visualTrailSystem.js';

let _bloodNodeIdCounter = 0;

export class ChosoFighter extends Fighter {
  constructor(def) {
    super(def);
    this.characterId = 'choso';
    this.type = 'choso';
    const cfg = CONFIG.choso || {};
    this.name = def?.name || cfg.name || 'Choso';
    this.displayName = def?.displayName || cfg.displayName || this.name;
    this.themeColor = cfg.themeColor || '#A31D1D';
    this.color = this.themeColor;
    this.damageNumberColor = this.themeColor;

    this.hp = cfg.hp || 420;
    this.maxHp = cfg.hp || 420;
    this.baseSpeed = cfg.speed || 5.3;
    this.speed = this.baseSpeed;
    this.r = computeScaledFighterRadius(def?.radius ?? cfg.radius ?? cfg.r ?? 25);

    // Passive 1: Mugen Ketsuryū (Infinite Blood Reserves & Interactive Nodes)
    this.bloodNodes = []; // Interactive Blood Droplet Nodes scattered across arena
    this.maxBloodNodes = cfg.maxBloodNodesInArena || 999; // No artificial 32 limit!

    // Passive 2: Flowing Red Scale: Stack (Sekirin Ketsurui: Chō)
    this.isFlowingRedScaleActive = false;

    // Basic Attack: Supernova (Chōshinsei)
    this.basicAttackCooldown = 0;
    this.skill2Cooldown = 0;
    this.skill2CooldownMax = cfg.cooldown || 36;
    this.isChargingSupernova = false;
    this.supernovaTimer = 0;
    this.supernovaOrbs = [];
    this.supernovaPellets = [];
    this.supernovaBursts = [];
    this.supernovaWindupMax = cfg.supernovaWindupFrames || 24;
    this.supernovaDetonationTimer = 0;
    this.supernovaDetonationMax = 14;

    // Skill 1: Slicing Exorcist / Blood Chakram (Karisō)
    this.skill1Cooldown = 0;
    this.skill1CooldownMax = cfg.skill1Cooldown || 360;
    this.chakrams = [];

    // Skill 3: Piercing Blood: True Convergence (Teisō / Fuga — Continuous Aim-Locked Beam)
    this.piercingBloodCooldown = 0;
    this.piercingBloodCooldownMax = cfg.piercingBloodCooldown || 900; // 15.0s
    this.isChargingPiercingBlood = false;
    this.isFiringPiercingBlood = false;
    this.piercingBloodTimer = 0;
    this.piercingBloodAngle = 0;
    this.piercingBloodWidth = cfg.ultBeamWidth || 26;
    this.piercingBloodProgress = 0;
    this.piercingBloodSource = null;
    this.piercingBloodChargeMax = cfg.ultChargeFrames || 30;
    this.piercingBloodBeamMax = cfg.ultBeamFrames || 96;
    this._piercingBloodHitState = new Map();
    this._piercingBloodSoundKey = null;
    this._isPiercingBloodSoundPlaying = false;
    this._piercingBloodOwnerIndex = 0;

    // ULTIMATE: Blood Manipulation: Convergence
    // As long as Ultimate is UP and blood exists in the arena, converts all blood droplets into laser beams!
    this.ultCooldown = 0;
    this.ultCooldownMax = cfg.ultCooldown || 840; // 14.0s
    this.skill3Cooldown = 0; // Synchronized alias for backwards compatibility
    this.skill3CooldownMax = this.ultCooldownMax;
    this.isCastingLaserMatrix = false;
    this.laserMatrixTimer = 0;
    this.laserTelegraphTimer = 0;
    this.laserLockInTimer = 0;
    this.laserMatrixCastMax = cfg.laserMatrixCastFrames || 16;
    this.laserTelegraphMax = cfg.laserTelegraphFrames || 12;
    this.laserLockInMax = cfg.laserLockInFrames ?? 14;
    this.isLaserMatrixLockedIn = false;
    this._laserLockPos = null;
    this.activeLaserBeams = [];
    this.isClaspedForConvergence = false;
    this.convergenceRecoveryTimer = 0;
    this.convergenceRecoveryMax = 14;
    this.isRetaliationSpraying = false;
    this.retaliationSprayTimer = 0;
    this._retaliationTarget = null;
    this._retaliationNodes = [];
    this.supernovaSources = [];

    // Animation Kinematic Timers (Rule 20 & Rule 30)
    this.chakramThrowTimer = 0;
    this.chakramThrowMax = 16;
    this.dartThrowTimer = 0;
    this.dartThrowMax = 12;
    this.bloodSplashVisuals = [];
    this._piercingBloodWallSplashTimer = 0;
  }

  /**
   * Overrides base Fighter.shoot() to suppress default generic bullet projectiles (Rule 1.8 & Rule 23).
   * Choso uses dedicated blood skills, daggers, and laser transmutations.
   */
  shoot(ownerIndex) {
    // Intentionally suppressed.
  }

  /**
   * Invoked whenever authentic blood particles erupt from Choso upon taking damage.
   * Directly binds the actual spilled blood particles so they can be transmuted into laser beams!
   */
  onBloodParticleSpawned(particleData) {
    if (!particleData) return;
    const arena = (typeof state !== 'undefined' && state.arena) || (CONFIG && CONFIG.arena);
    if (arena) {
      const wallW = arena.wallWidth || 4;
      const margin = wallW + 6;
      const minX = arena.x + margin;
      const maxX = arena.x + arena.width - margin;
      const minY = arena.y + margin;
      const maxY = arena.y + arena.height - margin;
      particleData.x = Math.max(minX, Math.min(maxX, particleData.x));
      particleData.y = Math.max(minY, Math.min(maxY, particleData.y));
    }
    const cfg = CONFIG.choso || {};
    const node = {
      id: ++_bloodNodeIdCounter,
      x: particleData.x,
      y: particleData.y,
      vx: particleData.vx || 0,
      vy: particleData.vy || 0,
      r: Math.max(3.0, (particleData.size || 4.5) * 0.9),
      size: particleData.size || 4.5,
      onGround: Boolean(particleData.onGround),
      particleRef: particleData,
      lifespan: cfg.bloodNodeLifespanFrames || 480,
      isIgnitedAsLaser: false,
      isDead: false,
      fromDamage: true
    };

    if (this.bloodNodes.length >= this.maxBloodNodes) {
      const oldest = this.bloodNodes.shift();
      if (oldest) {
        this._clearBloodNode(oldest, false);
      }
    }
    this.bloodNodes.push(node);

    // If Overdrive is active and enabled, newly shed blood from damage immediately converts into a micro-laser!
    if (this.laserTransmutationOverdriveTimer > 0 && isSkillEnabled(cfg.enableOverdriveMicroLasers, false)) {
      this._emitOverdriveMicroLaser(node);
    }
  }

  /**
   * Spawns an interactive Blood Droplet Node in the arena.
   * Backed by authentic game system blood particle (bloodEffect.js).
   * Strictly clamped inside arena perimeter so blood is NEVER spawned outside.
   */
  spawnBloodNode(x, y, vx = 0, vy = 0) {
    if (this.bloodNodes.length >= this.maxBloodNodes) {
      // Remove oldest node to preserve performance cap and clean from state.bloodEffects
      const oldest = this.bloodNodes.shift();
      if (oldest) {
        this._clearBloodNode(oldest, false);
      }
    }
    const cfg = CONFIG.choso || {};
    const arena = (typeof state !== 'undefined' && state.arena) || (CONFIG && CONFIG.arena);

    // Strict arena perimeter containment: blood droplets MUST NEVER spawn or sit outside arena
    if (arena) {
      const wallW = arena.wallWidth || 4;
      const margin = wallW + 6;
      const minX = arena.x + margin;
      const maxX = arena.x + arena.width - margin;
      const minY = arena.y + margin;
      const maxY = arena.y + arena.height - margin;
      x = Math.max(minX, Math.min(maxX, x));
      y = Math.max(minY, Math.min(maxY, y));
    }

    const size = 4.2 + Math.random() * 1.4;
    const node = {
      id: ++_bloodNodeIdCounter,
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: size * 0.9,
      size: size,
      onGround: false,
      lifespan: cfg.bloodNodeLifespanFrames || 720,
      isIgnitedAsLaser: false,
      isDead: false
    };

    // If state.bloodEffects exists, push an authentic game system blood particle
    if (typeof state !== 'undefined' && Array.isArray(state.bloodEffects)) {
      const palette = [0x990000, 0xDC2626, 0xE60000, 0x800000];
      const numericColor = palette[Math.floor(Math.random() * palette.length)];
      const pData = {
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        size: size,
        life: 1.0,
        decay: 0.006,
        numericColor: numericColor,
        friction: 0.85,
        onGround: false,
        sourceEntity: this,
        sourceCharacterId: 'choso',
        isChosoBlood: true
      };
      const s = getBloodSprite();
      if (s) {
        s.tint = numericColor;
        s.width = size;
        s.height = size;
        s.x = x;
        s.y = y;
        s.alpha = 1.0;
        pData.sprite = s;
      }
      state.bloodEffects.push(pData);
      node.particleRef = pData;
    }

    this.bloodNodes.push(node);

    // If Laser Transmutation Overdrive is active and enabled, newly shed blood immediately emits a micro-laser!
    if (this.laserTransmutationOverdriveTimer > 0 && isSkillEnabled(cfg.enableOverdriveMicroLasers, false)) {
      this._emitOverdriveMicroLaser(node);
    }

    return node;
  }

  /**
   * Emits a high-frequency piercing micro-laser from a newly spawned droplet during Overdrive.
   * Clamped within arena perimeter walls.
   */
  _emitOverdriveMicroLaser(node) {
    const target = this._findClosestEnemy();
    if (!target || target.isDead || target.hp <= 0) return;

    const angle = Math.atan2(target.y - node.y, target.x - node.x);
    const arena = (typeof state !== 'undefined' && state.arena) || (CONFIG && CONFIG.arena);
    const maxLaserDist = arena ? getRayArenaIntersection(node.x, node.y, angle, arena, 4) : 400;
    const laserRange = Math.min(400, maxLaserDist);
    const endX = node.x + Math.cos(angle) * laserRange;
    const endY = node.y + Math.sin(angle) * laserRange;

    this.activeLaserBeams.push({
      startX: node.x,
      startY: node.y,
      endX: endX,
      endY: endY,
      timer: 8,
      maxTimer: 8,
      thickness: 3.0,
      damageDealt: true,
      target: target
    });

    const cfg = CONFIG.choso || {};
    const isInfinity = (typeof target.hasActiveInfinity === 'function') && target.hasActiveInfinity();
    if (!isInfinity) {
      applyDamageToTarget(target, cfg.overdriveMicroLaserDamage || 8, this, { isTrueDamage: true, hitType: 'micro_laser' });
    }
  }

  /**
   * Cleans up and destroys a blood particle after it has been used by an attack/ability.
   * Removes from this.bloodNodes, cleans up PIXI Sprite, and removes from state.bloodEffects.
   */
  _clearBloodNode(node, removeFromNodes = true) {
    if (!node) return;
    node.isDead = true;
    node.lifespan = 0;
    delete node.dischargeTimer;
    node.isIgnitedAsLaser = false;

    // Visual dissolution spark
    if (typeof spawnSparks === 'function' && typeof node.x === 'number' && typeof node.y === 'number') {
      spawnSparks(node.x, node.y, 4, '#FF2A55', '#FFFFFF');
    }

    // Clean up PIXI sprite & particle reference safely using pool release (never .destroy() pooled sprites)
    if (node.particleRef) {
      const ref = node.particleRef;
      ref.isDead = true;
      ref.life = 0;
      ref.isIgnitedAsLaser = false;
      const stillOwned = typeof state !== 'undefined' && Array.isArray(state.bloodEffects) && state.bloodEffects.includes(ref);
      if (stillOwned) {
        releaseBloodParticle(ref);
        fastCleanArray(state.bloodEffects, p => p !== ref);
      } else {
        ref.sprite = null;
      }
    }

    if (removeFromNodes && this.bloodNodes && this.bloodNodes.length > 0) {
      fastCleanArray(this.bloodNodes, n => n !== node && (node.id === undefined || n.id !== node.id));
    }
  }

  /**
   * Top-of-update lifecycle decay for active visual effects and interactive entities.
   * Strictly complies with Rule 1.9 & Rule 25: runs BEFORE the freeze guard exit!
   */
  _updateVisualEffects() {
    const arena = (typeof state !== 'undefined' && state.arena) ? state.arena : null;

    // 1. Interactive Blood Droplets (Movement, boundary containment & decay)
    if (this.bloodNodes && this.bloodNodes.length > 0) {
      fastCleanArray(this.bloodNodes, (node) => {
        if (!node || node.isDead) return false;

        // If node was used/discharged in a laser matrix or dart, keep it visible as the emitter diode during firing
        if (node.dischargeTimer !== undefined) {
          node.dischargeTimer--;
          if (node.dischargeTimer <= 0) {
            delete node.dischargeTimer;
            node.isIgnitedAsLaser = false;
            // The blood particle was used! Clean it up immediately upon completion
            this._clearBloodNode(node, false);
            return false;
          } else {
            return true;
          }
        }

        node.lifespan--;
        if (node.lifespan <= 0) {
          // Naturally expired after ~8.0s lifespan! Clean it up from arena, state.bloodEffects & PIXI
          this._clearBloodNode(node, false);
          return false;
        }

        // If linked to active state.bloodEffects particle, sync position with fluid ballistic trajectory
        if (node.particleRef) {
          if (!node.isIgnitedAsLaser && (node.particleRef.isDead || node.particleRef.life < 0.05)) {
            this._clearBloodNode(node, false);
            return false;
          }
          if (typeof state !== 'undefined' && Array.isArray(state.bloodEffects) && !state.bloodEffects.includes(node.particleRef)) {
            return false;
          }

          if (node.isIgnitedAsLaser) {
            // Keep particle frozen in place in mid-air/on-ground while ignited (Frame 2 & 3)
            node.particleRef.vx = 0;
            node.particleRef.vy = 0;
            node.particleRef.isIgnitedAsLaser = true;
            if (node.particleRef.sprite && !node.particleRef.sprite.destroyed && node.particleRef.sprite.transform) {
              node.particleRef.sprite.x = node.x;
              node.particleRef.sprite.y = node.y;
              node.particleRef.sprite.alpha = 1.0;
            } else if (node.particleRef.sprite) {
              node.particleRef.sprite = null;
            }
          } else {
            node.x = node.particleRef.x;
            node.y = node.particleRef.y;
            node.vx = node.particleRef.vx;
            node.vy = node.particleRef.vy;
            node.onGround = node.particleRef.onGround;
            node.size = node.particleRef.size;
          }
        } else {
          // If state.bloodEffects exists, drop unlinked phantom nodes
          if (typeof state !== 'undefined' && Array.isArray(state.bloodEffects)) {
            return false;
          }
          node.x += node.vx;
          node.y += node.vy;
          node.vx *= 0.92;
          node.vy *= 0.92;
        }

        // Arena boundary containment
        if (arena) {
          const wallW = arena.wallWidth || 4;
          const margin = wallW + 6;
          const minX = arena.x + margin;
          const maxX = arena.x + arena.width - margin;
          const minY = arena.y + margin;
          const maxY = arena.y + arena.height - margin;

          if (node.x < minX) {
            node.x = minX;
            node.vx = Math.abs(node.vx) * 0.5;
            if (node.particleRef) { node.particleRef.x = minX; node.particleRef.vx = node.vx; }
          }
          if (node.x > maxX) {
            node.x = maxX;
            node.vx = -Math.abs(node.vx) * 0.5;
            if (node.particleRef) { node.particleRef.x = maxX; node.particleRef.vx = node.vx; }
          }
          if (node.y < minY) {
            node.y = minY;
            node.vy = Math.abs(node.vy) * 0.5;
            if (node.particleRef) { node.particleRef.y = minY; node.particleRef.vy = node.vy; }
          }
          if (node.y > maxY) {
            node.y = maxY;
            node.vy = -Math.abs(node.vy) * 0.5;
            if (node.particleRef) { node.particleRef.y = maxY; node.particleRef.vy = node.vy; }
          }
        }

        return true;
      });
    }

    // 2. Active Laser Beams Decay
    if (this.activeLaserBeams && this.activeLaserBeams.length > 0) {
      fastCleanArray(this.activeLaserBeams, (beam) => {
        beam.timer--;
        return beam.timer > 0;
      });
    }

    // 3. Slicing Chakrams Decay & Bounces
    if (this.chakrams && this.chakrams.length > 0) {
      fastCleanArray(this.chakrams, (c) => {
        c.lifespan--;
        if (c.lifespan <= 0) return false;

        c.x += c.vx;
        c.y += c.vy;
        c.rotation += 0.35;

        // Arena Wall Bounces (clamped strictly inside arena perimeter)
        if (arena) {
          const wallW = arena.wallWidth || 4;
          const minX = arena.x + wallW + c.r;
          const maxX = arena.x + arena.width - wallW - c.r;
          const minY = arena.y + wallW + c.r;
          const maxY = arena.y + arena.height - wallW - c.r;

          if (c.x <= minX) {
            c.x = minX;
            c.vx = Math.abs(c.vx);
            c.bounces = (c.bounces || 0) + 1;
            this.spawnBloodSplash(c.x, c.y, 0, 56, 18);
          } else if (c.x >= maxX) {
            c.x = maxX;
            c.vx = -Math.abs(c.vx);
            c.bounces = (c.bounces || 0) + 1;
            this.spawnBloodSplash(c.x, c.y, Math.PI, 56, 18);
          }

          if (c.y <= minY) {
            c.y = minY;
            c.vy = Math.abs(c.vy);
            c.bounces = (c.bounces || 0) + 1;
            this.spawnBloodSplash(c.x, c.y, Math.PI * 0.5, 56, 18);
          } else if (c.y >= maxY) {
            c.y = maxY;
            c.vy = -Math.abs(c.vy);
            c.bounces = (c.bounces || 0) + 1;
            this.spawnBloodSplash(c.x, c.y, -Math.PI * 0.5, 56, 18);
          }

          if ((c.bounces || 0) > (c.maxBounces || 3)) return false;
        }

        // Damage candidates along slicing trajectory
        const candidates = this._getAllValidEnemyTargets();
        for (let j = 0; j < candidates.length; j++) {
          const enemy = candidates[j];
          if (!c.hitTargets) c.hitTargets = new Set();
          if (c.hitTargets.has(enemy)) continue;
          const dist = Math.hypot(enemy.x - c.x, enemy.y - c.y);
          if (dist <= (c.r + (enemy.r || 25))) {
            c.hitTargets.add(enemy);
            const cfg = CONFIG.choso || {};
            const bloodMultiplier = this.getBloodDamageMultiplier();
            const chakramDmg = Math.round((cfg.chakramDamage || 36) * bloodMultiplier);
            applyDamageToTarget(enemy, chakramDmg, this, { hitType: 'chakram' });
            spawnSparks(enemy.x, enemy.y, 8, '#FF2A55', '#A31D1D');
            this.spawnBloodSplash(c.x, c.y, Math.atan2(c.vy, c.vx), 76, 22);
          }
        }

        return true;
      });
    }

    // 4. Supernova Shrapnel Pellets
    if (this.supernovaPellets && this.supernovaPellets.length > 0) {
      const pelletCandidates = this._getAllValidEnemyTargets();
      fastCleanArray(this.supernovaPellets, (p) => {
        p.lifespan--;
        if (p.lifespan <= 0) {
          spawnSparks(p.x, p.y, 4, '#FF2A55', '#FFFFFF');
          return false;
        }

        p.x += p.vx;
        p.y += p.vy;

        for (let k = 0; k < pelletCandidates.length; k++) {
          const ent = pelletCandidates[k];
          const er = ent.r || ent.radius || 25;
          if (Math.hypot(ent.x - p.x, (ent.y - (ent.z || 0)) - p.y) <= er + 6) {
            this.spawnBloodSplash(p.x, p.y, Math.atan2(p.vy, p.vx), 54, 18);
            return false;
          }
        }

        if (arena) {
          const wallW = arena.wallWidth || 4;
          const margin = wallW + 6;
          const minX = arena.x + margin;
          const maxX = arena.x + arena.width - margin;
          const minY = arena.y + margin;
          const maxY = arena.y + arena.height - margin;

          if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
            spawnSparks(p.x, p.y, 4, '#FF2A55', '#FFFFFF');
            this.spawnBloodSplash(
              Math.max(minX, Math.min(maxX, p.x)),
              Math.max(minY, Math.min(maxY, p.y)),
              Math.atan2(p.vy, p.vx),
              52,
              18
            );
            return false;
          }
        }

        return true;
      });
    }

    // 5. Supernova Detonation Burst Sprites Decay
    if (this.supernovaBursts && this.supernovaBursts.length > 0) {
      fastCleanArray(this.supernovaBursts, (b) => {
        b.timer--;
        return b.timer > 0;
      });
    }
  }

  /**
   * Spawns a 16-bit 12-frame blood splash impact sprite at any struck surface or entity.
   */
  spawnBloodSplash(x, y, angle = 0, size = 80, duration = 22) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (!this.bloodSplashVisuals) this.bloodSplashVisuals = [];
    if (this.bloodSplashVisuals.length >= 14) {
      this.bloodSplashVisuals.shift();
    }
    this.bloodSplashVisuals.push({
      x,
      y,
      angle: angle + (Math.random() - 0.5) * 0.45,
      size,
      timer: duration,
      maxTimer: duration,
      flipX: Math.random() < 0.5,
    });
  }

  _decayBloodSplashVisuals() {
    if (!this.bloodSplashVisuals || this.bloodSplashVisuals.length === 0) return;
    fastCleanArray(this.bloodSplashVisuals, (s) => {
      s.timer--;
      return s.timer > 0;
    });
  }

  /**
   * Main Fighter Update Loop
   */
  update(opponent, ownerIndex, arena) {
    // 0. Always decay active hit-splash visuals even on stun/freeze/death (Rule 25)
    this._decayBloodSplashVisuals();

    if (this.isDead || this.isRespawning || this.hp <= 0) {
      this.interruptAttacks(true);
      return;
    }

    // 1. Update non-freezing active visual effects before freeze guard (Rule 1.9 & Rule 25)
    this._updateVisualEffects();

    // 1. Mandatory Rule 1 Freeze & TimeStop Early Exit Guard
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks();
      return;
    }

    const cfg = CONFIG.choso || {};
    this._piercingBloodOwnerIndex = ownerIndex ?? this._piercingBloodOwnerIndex ?? 0;

    // 2. Cooldowns & Animation Timers Tick
    if (this.basicAttackCooldown > 0) this.basicAttackCooldown--;
    if (this.skill1Cooldown > 0) this.skill1Cooldown--;
    if (this.skill2Cooldown > 0) this.skill2Cooldown--;
    if (this.skill3Cooldown > 0) this.skill3Cooldown--;
    if (this.piercingBloodCooldown > 0) this.piercingBloodCooldown--;
    if (this.ultCooldown > 0) this.ultCooldown--;
    if (this.laserTransmutationOverdriveTimer > 0) this.laserTransmutationOverdriveTimer--;
    if (this.chakramThrowTimer > 0) this.chakramThrowTimer--;
    if (this.dartThrowTimer > 0) this.dartThrowTimer--;
    if (this.supernovaDetonationTimer > 0) this.supernovaDetonationTimer--;
    if (this.convergenceRecoveryTimer > 0) this.convergenceRecoveryTimer--;

    // 3. Passive 2: Flowing Red Scale: Stack Check (<60% HP)
    const hpRatio = this.hp / this.maxHp;
    if (hpRatio <= (cfg.redScaleHpThreshold || 0.60)) {
      this.isFlowingRedScaleActive = true;
      this.speed = this.baseSpeed * (cfg.redScaleSpeedMultiplier || 1.25);
    } else {
      this.isFlowingRedScaleActive = false;
      this.speed = this.baseSpeed;
    }

    // 4. Update Ongoing Skill States
    if (this.isRetaliationSpraying) {
      this.retaliationSprayTimer--;
      if (this.retaliationSprayTimer <= 0) {
        this.isRetaliationSpraying = false;
        const target = this._retaliationTarget || this._findClosestEnemy() || opponent;
        const allActive = this._getActiveBloodParticles();
        this._startLaserMatrix(target, (allActive.length > 0 ? allActive : this._retaliationNodes));
      }
      return;
    }

    if (this.isCastingLaserMatrix) {
      this._updateLaserMatrixSequence(opponent);
      return; // Lock movement and aim during Convergence clasp
    }

    if (this.isChargingPiercingBlood || this.isFiringPiercingBlood) {
      this._updatePiercingBloodSequence(opponent, arena, ownerIndex);
      return; // Aim-locked Hyperion-style beam handles tracking & recoil drift
    }

    if (this.isChargingSupernova) {
      this._updateSupernovaSequence(opponent);
      return;
    }

    // 5. Standard AI Combat Aim & Convergence / Piercing Blood Check on Existing Blood
    const target = this._findClosestEnemy() || opponent;
    if (target && !target.isDead && target.hp > 0) {
      this.aim(target);

      // ULTIMATE: Blood Manipulation: Convergence
      // Automatically converts all existing blood in the arena into laser beams when ready!
      const isUltUp = (this.ultCooldown <= 0 || this.skill3Cooldown <= 0);
      if (isUltUp && isSkillEnabled(cfg.enableLaserMatrix, true)) {
        const activeBlood = this._getActiveBloodParticles();
        if (activeBlood.length > 0) {
          this._startLaserMatrix(target, activeBlood);
          return;
        }
      }

      // Skill 3: Piercing Blood (Proactive Hyperion-style laser initiation when blood exists)
      if (isSkillEnabled(cfg.enablePiercingBlood, true) && this.piercingBloodCooldown <= 0) {
        const activeBlood = this._getActiveBloodParticles();
        if (activeBlood.length > 0) {
          this._startPiercingBlood(target, activeBlood[0]);
          return;
        }
      }

      // Skill 1: Slicing Exorcist Chakram (when enabled and blood exists)
      if (isSkillEnabled(cfg.enableChakram, true) && this.skill1Cooldown <= 0) {
        const activeBlood = this._getActiveBloodParticles();
        if (activeBlood.length > 0) {
          this._castChakram(target, activeBlood[activeBlood.length - 1]);
          return;
        }
      }

      // Basic Attack: Supernova (Chōshinsei)
      if (this.basicAttackCooldown <= 0 && isSkillEnabled(cfg.enableSupernova, true)) {
        const range = cfg.supernovaRange || 210;
        const targetY = target.y - (target.z || 0);
        const selfY = this.y - (this.z || 0);
        const targetDist = Math.hypot(target.x - this.x, targetY - selfY);
        const activeBlood = this._getActiveBloodParticles();
        const nearbyBlood = activeBlood.filter(
          n => Math.hypot(target.x - n.x, targetY - n.y) <= range
        );
        if (nearbyBlood.length > 0) {
          this._startSupernova(target, nearbyBlood.slice(0, Math.min(4, nearbyBlood.length)));
          return;
        }
        if (targetDist <= range) {
          this._startSupernova(target, [{ x: this.x, y: selfY, isSelfOrigin: true }]);
          return;
        }
      }
    }

    // 6. Centralized Movement & Physics Standard (Rule 1.2)
    if (!this.isStationarySkillActive() && Math.hypot(this.vx, this.vy) < 0.1) {
      this.resumeMovement(target || opponent);
    }
    super.update(opponent, ownerIndex, arena);
  }

  // ═══════════════════════════════════════════════════════════
  // UNIQUE SIGNATURE SKILL: CONVERGENCE
  // ═══════════════════════════════════════════════════════════

  /**
   * Returns all currently active, living blood particles in the arena.
   * If blood particles are gone or not visible (life < 0.20), returns an empty array.
   * Relies strictly on state.bloodEffects as single source of truth.
   */
  _getActiveBloodParticles() {
    const arena = (typeof state !== 'undefined' && state.arena) || (CONFIG && CONFIG.arena);
    const minX = arena ? arena.x : -Infinity;
    const maxX = arena ? arena.x + arena.width : Infinity;
    const minY = arena ? arena.y : -Infinity;
    const maxY = arena ? arena.y + arena.height : Infinity;

    const isInsideArena = (x, y) => (x >= minX && x <= maxX && y >= minY && y <= maxY);

    // If currently mid-cast, preserve the ignited diode nodes so they cannot be wiped by transient desync
    if (this.isCastingLaserMatrix) {
      const ignited = this.bloodNodes.filter(n => n && !n.isDead && n.isIgnitedAsLaser);
      if (ignited.length > 0) {
        return ignited;
      }
    }

    // Helper to identify enemy blood: blood originating from an enemy entity must NEVER be captured by Choso
    const isEnemyBlood = (bp) => {
      if (bp.isChosoBlood === true) return false;
      if (bp.sourceCharacterId === 'choso') return false;
      if (bp.sourceEntity === this) return false;
      if (bp.sourceEntity && bp.sourceEntity !== this) return true;
      if (bp.sourceCharacterId && bp.sourceCharacterId !== 'choso') return true;
      if (bp.isChosoBlood === false && (bp.sourceEntity || bp.sourceCharacterId)) return true;
      return false;
    };

    // Filter living, visible blood particles directly from state.bloodEffects (single source of truth)
    // STRICT RULE: ONLY CHOSO'S BLOOD! Enemy blood from damage must NEVER be captured by Choso.
    const livingBloodEffects = (typeof state !== 'undefined' && Array.isArray(state.bloodEffects))
      ? state.bloodEffects.filter(bp => {
          if (!bp || bp.isDead || bp.life < 0.05) return false;
          if (isEnemyBlood(bp)) return false;
          return isInsideArena(bp.x, bp.y);
        })
      : [];

    // Fallback to this.bloodNodes if state.bloodEffects is unavailable or in isolated tests
    if (livingBloodEffects.length === 0) {
      if (this.bloodNodes && this.bloodNodes.length > 0) {
        const validNodes = this.bloodNodes.filter(n => {
          if (!n || n.isDead || n.lifespan <= 0) return false;
          if (n.particleRef && (n.particleRef.isDead || n.particleRef.life < 0.05)) return false;
          if (n.particleRef && isEnemyBlood(n.particleRef)) return false;
          return isInsideArena(n.x, n.y);
        });
        if (validNodes.length > 0) {
          return validNodes;
        }
      }
      if (!this.isCastingLaserMatrix) {
        this.bloodNodes = [];
      }
      return [];
    }

    // Synchronize this.bloodNodes with livingBloodEffects
    const active = [];
    for (let i = 0; i < livingBloodEffects.length; i++) {
      const bp = livingBloodEffects[i];
      let existingNode = this.bloodNodes.find(n => n && n.particleRef === bp && !n.isDead);
      if (!existingNode) {
        existingNode = {
          id: ++_bloodNodeIdCounter,
          x: bp.x,
          y: bp.y,
          vx: bp.vx || 0,
          vy: bp.vy || 0,
          r: Math.max(3.0, (bp.size || 4.5) * 0.9),
          size: bp.size || 4.5,
          onGround: Boolean(bp.onGround),
          particleRef: bp,
          lifespan: Math.round((bp.life || 1.0) * (CONFIG.choso?.bloodNodeLifespanFrames || 480)),
          isIgnitedAsLaser: false,
          isDead: false,
          fromDamage: true
        };
      } else {
        existingNode.x = bp.x;
        existingNode.y = bp.y;
        existingNode.vx = bp.vx || 0;
        existingNode.vy = bp.vy || 0;
        existingNode.onGround = Boolean(bp.onGround);
      }
      active.push(existingNode);
    }

    this.bloodNodes = active;
    return active;
  }

  _getActiveBloodCount() {
    if (this.bloodNodes) {
      const arena = (typeof state !== 'undefined' && state.arena) || (CONFIG && CONFIG.arena);
      const isInsideArena = (x, y) => (!arena || (x >= arena.x && x <= arena.x + arena.width && y >= arena.y && y <= arena.y + arena.height));
      const isEnemyBlood = (bp) => {
        if (!bp) return false;
        if (bp.isChosoBlood === true) return false;
        if (bp.sourceCharacterId === 'choso') return false;
        if (bp.sourceEntity === this) return false;
        if (bp.sourceEntity && bp.sourceEntity !== this) return true;
        if (bp.sourceCharacterId && bp.sourceCharacterId !== 'choso') return true;
        if (bp.isChosoBlood === false && (bp.sourceEntity || bp.sourceCharacterId)) return true;
        return false;
      };
      const valid = this.bloodNodes.filter(n => {
        if (!n || n.isDead || n.lifespan <= 0) return false;
        if (n.particleRef && (n.particleRef.isDead || n.particleRef.life < 0.05)) return false;
        if (n.particleRef && isEnemyBlood(n.particleRef)) return false;
        return isInsideArena(n.x, n.y);
      });
      return valid.length;
    }
    const particles = this._getActiveBloodParticles();
    return particles ? particles.length : 0;
  }

  /**
   * Calculates the damage scaling multiplier based on active, unexpired blood particles in the arena.
   * If there are more blood particles that have not expired and an ability is ready, Choso deals more damage.
   * As blood particles expire naturally, this multiplier smoothly returns to 1.0.
   */
  getBloodDamageMultiplier(overrideCount = null) {
    const cfg = CONFIG.choso || {};
    const unexpiredCount = (typeof overrideCount === 'number') ? overrideCount : this._getActiveBloodCount();
    const bonusPerNode = cfg.bloodDamageMultiplierPerNode ?? 0.04; // +4% per unexpired blood particle
    const maxMultiplier = cfg.maxBloodDamageMultiplier ?? 2.25;    // Capped at 2.25x (+125% bonus)
    return Math.min(maxMultiplier, 1.0 + (unexpiredCount * bonusPerNode));
  }

  /**
    * Initiates Blood Manipulation: Convergence.
   * Freezes all active blood particles currently in the arena and turns them into laser diodes!
   * MANDATORY: Does NOT activate if the blood particles are gone!
   * Only fires the currently existing blood particles in the arena (no fixed number).
   */
  _startLaserMatrix(target, precomputedActiveBlood = null) {
    const activeBlood = precomputedActiveBlood || this._getActiveBloodParticles();

    // Do not activate if the blood particles are gone!
    // Only fire when there are currently existing blood particles in the arena.
    if (!activeBlood || activeBlood.length === 0) {
      this.isCastingLaserMatrix = false;
      this.isClaspedForConvergence = false;
      return false;
    }

    const cfg = CONFIG.choso || {};
    this.isRetaliationSpraying = false;
    this.retaliationSprayTimer = 0;
    this.isCastingLaserMatrix = true;
    this.isClaspedForConvergence = true;
    this.laserMatrixCastMax = cfg.laserMatrixCastFrames || 16;
    this.laserMatrixTimer = this.laserMatrixCastMax;
    this.laserTelegraphMax = cfg.laserTelegraphFrames || 12;
    this.laserTelegraphTimer = this.laserTelegraphMax;
    this.laserLockInMax = cfg.laserLockInFrames ?? 14;
    this.laserLockInTimer = this.laserLockInMax;
    this.isLaserMatrixLockedIn = false;
    this._laserLockPos = (target && typeof target.x === 'number')
      ? { x: target.x, y: target.y - (target.z || 0) }
      : null;
    this.ultCooldown = this.ultCooldownMax;
    this.skill3Cooldown = this.skill3CooldownMax;
    this.vx = 0;
    this.vy = 0;

    // Snapshot target coordinates for locked beam firing
    this._laserTarget = target;

    // Update this.bloodNodes to contain ONLY the currently existing active blood particles
    this.bloodNodes = activeBlood;

    // Halt and ignite all active blood droplets into laser diodes
    for (let i = 0; i < this.bloodNodes.length; i++) {
      const node = this.bloodNodes[i];
      node.vx = 0;
      node.vy = 0;
      node.isIgnitedAsLaser = true;
      delete node.lockedAngle;
      delete node.lockedEndX;
      delete node.lockedEndY;
      if (node.particleRef) {
        node.particleRef.vx = 0;
        node.particleRef.vy = 0;
        node.particleRef.isIgnitedAsLaser = true;
      }
    }

    // Play Convergence Prayer Clasp sound & Diode ignition hum
    audioSystem.playSFX(cfg.sounds?.convergenceClasp || 'Assets/Sound Effects/Skills/enhance.mp3', cfg.soundVolumes?.convergenceClasp || 1.10);
    audioSystem.playSFX(cfg.sounds?.laserIgnite || 'Assets/Sound Effects/Skills/woosh.mp3', cfg.soundVolumes?.laserIgnite || 0.95);

    if (typeof triggerGlobalScreenShake === 'function') triggerGlobalScreenShake(2.0, 6);
    return true;
  }

  /**
   * Computes shortest distance from point (px, py) to segment (x1, y1)->(x2, y2).
   */
  _pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 <= 0.0001) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  /**
   * Freezes laser diode rays onto the target's coordinates before firing (lock-in phase).
   */
  _commitLaserMatrixLockIn(target) {
    const cfg = CONFIG.choso || {};
    const arena = (typeof state !== 'undefined' && state.arena) || (CONFIG && CONFIG.arena);
    if (target && !target.isDead && typeof target.x === 'number') {
      this._laserLockPos = { x: target.x, y: target.y - (target.z || 0) };
    }
    const lockX = this._laserLockPos ? this._laserLockPos.x : this.x;
    const lockY = this._laserLockPos ? this._laserLockPos.y : (this.y - (this.z || 0));

    for (let i = 0; i < this.bloodNodes.length; i++) {
      const node = this.bloodNodes[i];
      if (!node || node.isDead) continue;
      const angle = Math.atan2(lockY - node.y, lockX - node.x);
      const maxBeamDist = arena ? getRayArenaIntersection(node.x, node.y, angle, arena, 4) : 700;
      const beamReach = Math.min(700, maxBeamDist);
      node.lockedAngle = angle;
      node.lockedEndX = node.x + Math.cos(angle) * beamReach;
      node.lockedEndY = node.y + Math.sin(angle) * beamReach;
    }

    this.isLaserMatrixLockedIn = true;
    const lockFaceAngle = Math.atan2(lockY - (this.y - (this.z || 0)), lockX - this.x);
    this.gunAngle = lockFaceAngle;
    this.angle = lockFaceAngle;

    audioSystem.playSFX(cfg.sounds?.laserIgnite || 'Assets/Sound Effects/Skills/woosh.mp3', cfg.soundVolumes?.laserIgnite || 0.95);
    if (typeof triggerGlobalScreenShake === 'function') triggerGlobalScreenShake(1.6, 5);
  }

  _finishLaserMatrixCast() {
    const cfg = CONFIG.choso || {};
    this.isCastingLaserMatrix = false;
    this.isClaspedForConvergence = false;
    this.isLaserMatrixLockedIn = false;
    this.convergenceRecoveryTimer = this.convergenceRecoveryMax || 14;
    this.laserTransmutationOverdriveTimer = cfg.laserTransmutationOverdriveFrames || 300;
  }

  _updateLaserMatrixSequence(opponent) {
    const target = (this._laserTarget && !this._laserTarget.isDead && this._laserTarget.hp > 0)
      ? this._laserTarget
      : opponent;
    this.vx = 0;
    this.vy = 0;

    // Verify diode nodes still exist during windup / telegraph / lock-in pose
    const activeDiodes = this.bloodNodes.filter(n => n && !n.isDead);
    if (activeDiodes.length === 0) {
      this.isCastingLaserMatrix = false;
      this.isClaspedForConvergence = false;
      this.isLaserMatrixLockedIn = false;
      this.laserMatrixTimer = 0;
      this.laserTelegraphTimer = 0;
      this.laserLockInTimer = 0;
      this._laserLockPos = null;
      return;
    }

    if (this.laserMatrixTimer > 0) {
      this.laserMatrixTimer--;
      if (target && !target.isDead && typeof target.x === 'number') {
        this._laserLockPos = { x: target.x, y: target.y - (target.z || 0) };
        this.aim(target);
      }
      return;
    }

    if (this.laserTelegraphTimer > 0) {
      this.laserTelegraphTimer--;
      if (target && !target.isDead && typeof target.x === 'number') {
        this._laserLockPos = { x: target.x, y: target.y - (target.z || 0) };
        this.aim(target);
      }
      if (this.laserTelegraphTimer === 0) {
        if (this.laserLockInTimer > 0) {
          this._commitLaserMatrixLockIn(target);
          return;
        }
        this._dischargeLaserMatrix(target);
        this._finishLaserMatrixCast();
      }
      return;
    }

    if (this.laserLockInTimer > 0) {
      this.isLaserMatrixLockedIn = true;
      if (this._laserLockPos) {
        const lockFaceAngle = Math.atan2(this._laserLockPos.y - (this.y - (this.z || 0)), this._laserLockPos.x - this.x);
        this.gunAngle = lockFaceAngle;
        this.angle = lockFaceAngle;
      }
      this.laserLockInTimer--;
      if (this.laserLockInTimer === 0) {
        this._dischargeLaserMatrix(target);
        this._finishLaserMatrixCast();
      }
      return;
    }

    this._finishLaserMatrixCast();
  }

  /**
   * Fires supersonic piercing laser beams from every active blood node along locked angles.
   */
  _dischargeLaserMatrix(target) {
    const cfg = CONFIG.choso || {};
    const arena = (typeof state !== 'undefined' && state.arena) || (CONFIG && CONFIG.arena);

    // Filter strictly to living nodes that were ignited for this matrix
    const validNodes = this.bloodNodes.filter(node => node && !node.isDead);

    if (validNodes.length === 0) {
      this.bloodNodes = [];
      this.isCastingLaserMatrix = false;
      this.isClaspedForConvergence = false;
      this.isLaserMatrixLockedIn = false;
      return;
    }

    const candidates = this._getAllValidEnemyTargets();
    if (target && !target.isDead && target.hp > 0 && !candidates.includes(target) && this._isEnemyTarget(target)) {
      candidates.push(target);
    }

    const bloodMultiplier = this.getBloodDamageMultiplier(validNodes.length);
    const damagePerNode = Math.round((cfg.laserDamagePerNode || 14) * bloodMultiplier);
    const hitCountsByTarget = new Map();
    const beamHitPad = 6;

    for (let i = 0; i < validNodes.length; i++) {
      const node = validNodes[i];

      let angle = node.lockedAngle;
      let endX = node.lockedEndX;
      let endY = node.lockedEndY;
      if (angle === undefined || endX === undefined || endY === undefined) {
        const fallbackX = (target && typeof target.x === 'number') ? target.x : (this._laserLockPos?.x ?? this.x);
        const fallbackY = (target && typeof target.y === 'number') ? (target.y - (target.z || 0)) : (this._laserLockPos?.y ?? this.y);
        angle = Math.atan2(fallbackY - node.y, fallbackX - node.x);
        const maxBeamDist = arena ? getRayArenaIntersection(node.x, node.y, angle, arena, 4) : 700;
        const beamReach = Math.min(700, maxBeamDist);
        endX = node.x + Math.cos(angle) * beamReach;
        endY = node.y + Math.sin(angle) * beamReach;
      }

      this.activeLaserBeams.push({
        startX: node.x,
        startY: node.y,
        endX: endX,
        endY: endY,
        timer: cfg.laserDischargeFrames || 22,
        maxTimer: cfg.laserDischargeFrames || 22,
        thickness: 4.5,
        damageDealt: true,
        target: target
      });

      for (let c = 0; c < candidates.length; c++) {
        const ent = candidates[c];
        if (!ent || ent.isDead || ent.hp <= 0) continue;
        const entY = ent.y - (ent.z || 0);
        const hitRadius = (ent.r || 25) + beamHitPad;
        if (this._pointToSegmentDist(ent.x, entY, node.x, node.y, endX, endY) > hitRadius) continue;

        // Check Gojo Limitless Infinity (Rule 1.7)
        const isInfinity = (typeof ent.hasActiveInfinity === 'function') && ent.hasActiveInfinity();
        if (!isInfinity) {
          const applied = applyDamageToTarget(ent, damagePerNode, this, { isTrueDamage: true, hitType: 'laser', skipKnockback: true });
          if (applied !== false) {
            const nextCount = (hitCountsByTarget.get(ent) || 0) + 1;
            hitCountsByTarget.set(ent, nextCount);
            spawnSparks(ent.x, entY, 4, '#FF2A55', '#FFFFFF');
            if (nextCount <= 3) {
              this.spawnBloodSplash(ent.x, entY, angle, 74, 20);
            }
          }
        } else if (typeof ent.triggerInfinityBlock === 'function') {
          ent.triggerInfinityBlock(ent.x, ent.y, this);
        }
      }

      // Keep blood droplet alive & visible as laser emitter square throughout beam duration (Frame 3)
      node.dischargeTimer = cfg.laserDischargeFrames || 22;
      node.isIgnitedAsLaser = true;
      delete node.lockedAngle;
      delete node.lockedEndX;
      delete node.lockedEndY;
      if (node.particleRef) {
        node.particleRef.isIgnitedAsLaser = true;
        node.particleRef.vx = 0;
        node.particleRef.vy = 0;
      }
      spawnSparks(node.x, node.y, 4, '#FF2A55', '#FFFFFF');
    }

    for (const [ent, hitCount] of hitCountsByTarget.entries()) {
      if (hitCount <= 0 || ent.isDead || ent.hp <= 0) continue;
      const pullX = this.x - ent.x;
      const pullY = this.y - ent.y;
      const pullDistance = Math.hypot(pullX, pullY);
      if (pullDistance > 0 && typeof ent.applyKnockback === 'function') {
        const dragForce = cfg.laserMatrixDragForce ?? 2.8;
        ent.applyKnockback((pullX / pullDistance) * dragForce, (pullY / pullDistance) * dragForce);
      }
      if (typeof ent.applySlow === 'function') {
        ent.applySlow(
          cfg.laserMatrixSlowDurationFrames ?? 90,
          cfg.laserMatrixSlowMultiplier ?? 0.55
        );
      }
      if (hitCount >= (cfg.laserMatrixStunThreshold || 3) && typeof ent.applyHitStun === 'function') {
        ent.applyHitStun(cfg.laserMatrixStunDuration || 30);
      }
    }

    // Nodes remain alive in this.bloodNodes with dischargeTimer to display as beam emitters (Frame 3)

    audioSystem.playSFX(cfg.sounds?.laserFire || 'Assets/Sound Effects/Attacks/laserbeam.mp3', cfg.soundVolumes?.laserFire || 1.25);
    if (typeof triggerGlobalScreenShake === 'function') triggerGlobalScreenShake(3.5, 12);
  }

  // ═══════════════════════════════════════════════════════════
  // SKILL 1: SLICING EXORCIST (CHAKRAM)
  // ═══════════════════════════════════════════════════════════

  _castChakram(target, sourceNode = null) {
    const cfg = CONFIG.choso || {};
    this.skill1Cooldown = this.skill1CooldownMax;
    this.chakramThrowTimer = this.chakramThrowMax || 16;
    let node = sourceNode;
    if (!node) {
      const activeBlood = this._getActiveBloodParticles();
      node = (activeBlood.length > 0 ? activeBlood[activeBlood.length - 1] : null);
    }
    const startX = (node && typeof node.x === 'number') ? node.x : this.x;
    const startY = (node && typeof node.y === 'number') ? node.y : (this.y - (this.z || 0));

    const angle = Math.atan2(target.y - startY, target.x - startX);
    const speed = cfg.chakramSpeed || 11;

    this.chakrams.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 16,
      rotation: 0,
      lifespan: cfg.chakramLifespan || 90,
      bounces: 0,
      maxBounces: cfg.chakramMaxBounces || 3,
      dropTimer: 0,
      sourceNodeId: node ? node.id : null
    });

    // Blood particle was used to form the chakram — clear it up!
    if (node) {
      this._clearBloodNode(node, true);
    }

    audioSystem.playSFX(cfg.sounds?.chakramSpin || 'Assets/Sound Effects/Skills/spinslash.mp3', cfg.soundVolumes?.chakramSpin || 0.85);
  }

  // ═══════════════════════════════════════════════════════════
  // BASIC ATTACK: SUPERNOVA (CHŌSHINSEI)
  // ═══════════════════════════════════════════════════════════

  _startSupernova(target, sourceNodes = null) {
    const cfg = CONFIG.choso || {};
    const cd = cfg.cooldown || 36;
    this.basicAttackCooldown = cd;
    this.skill2Cooldown = cd;
    this.skill2CooldownMax = cd;
    this.isChargingSupernova = true;
    this.supernovaWindupMax = cfg.supernovaWindupFrames || 24;
    this.supernovaTimer = this.supernovaWindupMax;
    this.supernovaOrbs = [];
    this.vx = 0;
    this.vy = 0;
    if (target && !target.isDead && target.hp > 0) {
      this.aim(target);
    }

    let sources = sourceNodes;
    if (!sources || sources.length === 0) {
      const activeBlood = this._getActiveBloodParticles();
      sources = (activeBlood.length > 0)
        ? activeBlood.slice(0, 4)
        : [{ x: this.x, y: this.y - (this.z || 0), isSelfOrigin: true }];
    }
    this.supernovaSources = sources;

    const orbCount = cfg.supernovaOrbCount || 8;
    for (let s = 0; s < sources.length; s++) {
      const src = sources[s];
      for (let i = 0; i < orbCount; i++) {
        this.supernovaOrbs.push({
          source: src,
          angle: (i * Math.PI * 2) / orbCount,
          dist: 14
        });
      }
    }

    audioSystem.playSFX(cfg.sounds?.convergenceClasp || 'Assets/Sound Effects/Skills/enhance.mp3', 0.90);
  }

  _updateSupernovaSequence(opponent) {
    if (this.supernovaTimer > 0) {
      this.supernovaTimer--;
      this.vx = 0;
      this.vy = 0;
      if (this.supernovaSources && this.supernovaSources.length > 0) {
        const selfY = this.y - (this.z || 0);
        for (let s = 0; s < this.supernovaSources.length; s++) {
          if (this.supernovaSources[s]?.isSelfOrigin) {
            this.supernovaSources[s].x = this.x;
            this.supernovaSources[s].y = selfY;
          }
        }
      }
      // Spin orbiting orbs around source points
      for (let i = 0; i < this.supernovaOrbs.length; i++) {
        this.supernovaOrbs[i].angle += 0.20;
      }
      return;
    }

    // Detonate Supernova in 360° Fragmentation Burst from each source point!
    this.isChargingSupernova = false;
    this.supernovaDetonationTimer = this.supernovaDetonationMax || 14;
    const cfg = CONFIG.choso || {};
    const pelletCount = cfg.supernovaPelletCount || 12;
    const speed = cfg.supernovaPelletSpeed || 13;
    const sources = (this.supernovaSources && this.supernovaSources.length > 0)
      ? this.supernovaSources
      : [{ x: this.x, y: this.y - (this.z || 0), isSelfOrigin: true }];

    for (let s = 0; s < sources.length; s++) {
      const src = sources[s];
      this.supernovaBursts.push({
        x: src.x,
        y: src.y,
        timer: 18,
        maxTimer: 18,
        rotation: Math.random() * Math.PI * 2,
      });
      for (let i = 0; i < pelletCount; i++) {
        const angle = (i * Math.PI * 2) / pelletCount + (Math.random() - 0.5) * 0.2;
        this.supernovaPellets.push({
          x: src.x + Math.cos(angle) * 8,
          y: src.y + Math.sin(angle) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          lifespan: 16
        });
      }

      // AOE Damage in proximity of each source point
      const candidates = this._getAllValidEnemyTargets();
      for (let i = 0; i < candidates.length; i++) {
        const ent = candidates[i];
        const d = Math.hypot(ent.x - src.x, (ent.y - (ent.z || 0)) - src.y);
        if (d <= (cfg.supernovaRange || 210)) {
          if (typeof ent.hasActiveInfinity === 'function' && ent.hasActiveInfinity()) {
            if (typeof ent.triggerInfinityBlock === 'function') {
              ent.triggerInfinityBlock(ent.x, ent.y, this);
            }
            continue;
          }
          const bloodMultiplier = this.getBloodDamageMultiplier();
          const novaDamage = Math.round((cfg.supernovaPelletDamage || 14) * 3 * bloodMultiplier);
          applyDamageToTarget(ent, novaDamage, this, { hitType: 'supernova' });
          spawnSparks(ent.x, ent.y, 8, '#FF2A55', '#FFFFFF');
          this.spawnBloodSplash(ent.x, ent.y - (ent.z || 0), Math.atan2(ent.y - src.y, ent.x - src.x), 80, 22);
        }
      }
    }

    // Blood particles were used to detonate Supernova — clear them up!
    if (this.supernovaSources && this.supernovaSources.length > 0) {
      for (let s = 0; s < this.supernovaSources.length; s++) {
        this._clearBloodNode(this.supernovaSources[s], true);
      }
      this.supernovaSources = [];
    }

    audioSystem.playSFX(cfg.sounds?.supernovaExplode || 'Assets/Sound Effects/Attacks/explosion.mp3', cfg.soundVolumes?.supernovaExplode || 1.15);
    if (typeof triggerGlobalScreenShake === 'function') triggerGlobalScreenShake(3.0, 10);
  }

  // ═══════════════════════════════════════════════════════════
  // ULTIMATE: PIERCING BLOOD (TEISŌ / FUGA)
  // ═══════════════════════════════════════════════════════════

  _stopPiercingBloodSound() {
    if (this._piercingBloodSoundKey) {
      stopLoopingSound(this._piercingBloodSoundKey);
      fadeOutLoopingSound(this._piercingBloodSoundKey, 50);
    }
    this._isPiercingBloodSoundPlaying = false;
  }

  _isEnemyTarget(ent) {
    if (!ent || ent === this || ent.owner === this || ent.isDead || ent.hp <= 0) return false;
    if (this.team !== undefined && ent.team !== undefined) {
      return this.team !== ent.team;
    }
    if (typeof this.isTeammate === 'function') {
      return !this.isTeammate(ent);
    }
    return true;
  }

  _resolvePiercingBloodTarget(opponent) {
    const closest = this._findClosestEnemy();
    const oppValid = this._isEnemyTarget(opponent);
    if (closest && oppValid && closest !== opponent) {
      const dc = Math.hypot(closest.x - this.x, closest.y - this.y);
      const dop = Math.hypot(opponent.x - this.x, opponent.y - this.y);
      return dop < dc ? opponent : closest;
    }
    return closest || (oppValid ? opponent : null);
  }

  _trackPiercingBloodAim(target, maxRotate) {
    if (target && !target.isDead && target.hp > 0) {
      const targetY = target.y - (target.z || 0);
      const selfY = this.y - (this.z || 0);
      const targetAngle = Math.atan2(targetY - selfY, target.x - this.x);
      const delta = Math.atan2(Math.sin(targetAngle - this.piercingBloodAngle), Math.cos(targetAngle - this.piercingBloodAngle));
      if (Math.abs(delta) > maxRotate) {
        this.piercingBloodAngle += Math.sign(delta) * maxRotate;
      } else {
        this.piercingBloodAngle = targetAngle;
      }
    }

    this.gunAngle = this.piercingBloodAngle;
    this.angle = this.piercingBloodAngle;

    const nozzleDist = (this.r || 25) * 0.80;
    const nx = this.x + Math.cos(this.piercingBloodAngle) * nozzleDist;
    const ny = (this.y - (this.z || 0)) + Math.sin(this.piercingBloodAngle) * nozzleDist;

    if (!this.piercingBloodSource) {
      this.piercingBloodSource = { x: nx, y: ny, node: null };
    } else {
      this.piercingBloodSource.x = nx;
      this.piercingBloodSource.y = ny;
    }

    if (this.isChargingPiercingBlood && this.piercingBloodSource.node && !this.piercingBloodSource.node.isDead) {
      const n = this.piercingBloodSource.node;
      n.x += (nx - n.x) * 0.35;
      n.y += (ny - n.y) * 0.35;
      if (n.particleRef) {
        n.particleRef.x = n.x;
        n.particleRef.y = n.y;
      }
    }
  }

  _depositPiercingBloodFallout(startX, startY, beamAngle) {
    const cfg = CONFIG.choso || {};
    const arena = (typeof state !== 'undefined' && state.arena) || (CONFIG && CONFIG.arena);
    const maxDist = arena ? getRayArenaIntersection(startX, startY, beamAngle, arena, 10) : 400;
    const safeBeamDist = Math.max(0, maxDist - 12);
    const maxNodes = cfg.ultFalloutNodes || 10;
    const dropCount = Math.min(maxNodes, Math.max(1, Math.floor(safeBeamDist / 50)));

    if (safeBeamDist > 20 && dropCount > 0) {
      const step = safeBeamDist / (dropCount + 1);
      for (let i = 1; i <= dropCount; i++) {
        const dist = i * step;
        const dropX = startX + Math.cos(beamAngle) * dist;
        const dropY = startY + Math.sin(beamAngle) * dist;
        this.spawnBloodNode(dropX, dropY, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
      }
    }
  }

  _startPiercingBlood(target, sourceNode = null) {
    let node = sourceNode;
    if (!node) {
      const activeBlood = this._getActiveBloodParticles();
      if (!activeBlood || activeBlood.length === 0) {
        return false;
      }
      node = activeBlood[0];
    }

    const cfg = CONFIG.choso || {};
    this.piercingBloodCooldown = this.piercingBloodCooldownMax;
    this.isChargingPiercingBlood = true;
    this.isFiringPiercingBlood = false;
    this.isClaspedForConvergence = true;
    this.piercingBloodChargeMax = cfg.ultChargeFrames || 30;
    this.piercingBloodBeamMax = cfg.ultBeamFrames || 96;
    this.piercingBloodTimer = this.piercingBloodChargeMax;
    this._piercingBloodHitState.clear();

    // Halt source blood particle in mid-air while compressing into clasped hands
    node.vx = 0;
    node.vy = 0;
    node.isIgnitedAsLaser = true;

    const aimAngle = (target && typeof target.x === 'number')
      ? Math.atan2((target.y - (target.z || 0)) - (this.y - (this.z || 0)), target.x - this.x)
      : (this.gunAngle || 0);
    this.piercingBloodAngle = aimAngle;
    this.gunAngle = aimAngle;
    this.angle = aimAngle;

    const nozzleDist = (this.r || 25) * 0.80;
    this.piercingBloodSource = {
      x: this.x + Math.cos(aimAngle) * nozzleDist,
      y: (this.y - (this.z || 0)) + Math.sin(aimAngle) * nozzleDist,
      node: node
    };

    this.vx = 0;
    this.vy = 0;

    audioSystem.playSFX(cfg.sounds?.convergenceClasp || 'Assets/Sound Effects/Skills/enhance.mp3', 1.20);
    if (typeof triggerGlobalScreenShake === 'function') triggerGlobalScreenShake(2.5, 8);
    return true;
  }

  _updatePiercingBloodSequence(opponent, arena = null, ownerIndex = 0) {
    const cfg = CONFIG.choso || {};
    const target = this._resolvePiercingBloodTarget(opponent);
    const activeArena = arena || (typeof state !== 'undefined' && state.arena) || (CONFIG && CONFIG.arena);

    // Phase 1: High-Pressure Singularity Compression while tracking enemy
    if (this.isChargingPiercingBlood) {
      this.vx = 0;
      this.vy = 0;
      this._trackPiercingBloodAim(target, cfg.ultBeamChargeRotateSpeed ?? 0.055);
      this.piercingBloodTimer--;

      if (this.piercingBloodTimer <= 0) {
        this.isChargingPiercingBlood = false;
        this.isFiringPiercingBlood = true;
        this.piercingBloodBeamMax = cfg.ultBeamFrames || 96;
        this.piercingBloodTimer = this.piercingBloodBeamMax;
        this.piercingBloodProgress = 1.0;
        this._piercingBloodHitState.clear();

        // Apply initial backward recoil impulse (Rule 30 physical force)
        const kick = cfg.ultRecoilKick || 16;
        this.vx -= Math.cos(this.piercingBloodAngle) * kick;
        this.vy -= Math.sin(this.piercingBloodAngle) * kick;

        // Start sustained beam audio loop + initial sonic crack
        const slotIdx = ownerIndex ?? this._piercingBloodOwnerIndex ?? 0;
        if (!this._piercingBloodSoundKey) {
          this._piercingBloodSoundKey = `choso-piercing-blood-${slotIdx}`;
        }
        if (!this._isPiercingBloodSoundPlaying && typeof audioSystem.playLoop === 'function') {
          const beamSrc = cfg.sounds?.laserFire || cfg.sounds?.piercingBloodCannon || 'Assets/Sound Effects/Attacks/laserbeam.mp3';
          audioSystem.playLoop(this._piercingBloodSoundKey, beamSrc, cfg.soundVolumes?.piercingBloodCannon || 1.05);
          this._isPiercingBloodSoundPlaying = true;
        }
        audioSystem.playSFX(cfg.sounds?.piercingBloodCannon || 'Assets/Sound Effects/Skills/redblast.mp3', cfg.soundVolumes?.piercingBloodCannon || 1.35);

        const startX = this.piercingBloodSource ? this.piercingBloodSource.x : this.x;
        const startY = this.piercingBloodSource ? this.piercingBloodSource.y : (this.y - (this.z || 0));
        this._piercingBloodWallSplashTimer = 0;
        this._executePiercingBloodDamage(startX, startY, this.piercingBloodAngle, slotIdx, opponent);
        this._spawnPiercingBloodSurfaceSplash(startX, startY, this.piercingBloodAngle, activeArena);
        if (typeof triggerGlobalScreenShake === 'function') triggerGlobalScreenShake(4.5, 14);
      }
      return;
    }

    // Phase 2: Continuous Aim-Locked Hyperion-Style Beam Discharge
    if (this.isFiringPiercingBlood) {
      this._trackPiercingBloodAim(target, cfg.ultBeamRotateSpeed ?? 0.022);
      if (typeof triggerGlobalScreenShake === 'function') triggerGlobalScreenShake(2.2, 4);

      // Gentle Hyperion-style backward recoil drift while firing continuously
      const backwardSpeed = Number(cfg.ultBeamBackwardSpeed) || 0.85;
      const recoilX = -Math.cos(this.piercingBloodAngle) * backwardSpeed;
      const recoilY = -Math.sin(this.piercingBloodAngle) * backwardSpeed;
      const retention = Number(cfg.ultBeamDriftRetention) || 0.90;
      const blend = Number(cfg.ultBeamDriftBlend) || 0.08;
      this.vx = this.vx * retention + recoilX * blend;
      this.vy = this.vy * retention + recoilY * blend;

      const driftMult = backwardSpeed / Math.max(1, this.speed || 5.3);
      this.applyMovementPhysics(driftMult);
      if (activeArena) {
        this.resolveWallBounce(activeArena, opponent);
      }

      // Keep nozzle source pinned to Choso's forward clasped hands after drift step
      const nozzleDist = (this.r || 25) * 0.80;
      const startX = this.x + Math.cos(this.piercingBloodAngle) * nozzleDist;
      const startY = (this.y - (this.z || 0)) + Math.sin(this.piercingBloodAngle) * nozzleDist;
      if (this.piercingBloodSource) {
        this.piercingBloodSource.x = startX;
        this.piercingBloodSource.y = startY;
      }

      const slotIdx = ownerIndex ?? this._piercingBloodOwnerIndex ?? 0;
      this._executePiercingBloodDamage(startX, startY, this.piercingBloodAngle, slotIdx, opponent);
      this._piercingBloodWallSplashTimer = (this._piercingBloodWallSplashTimer || 0) + 1;
      if (this._piercingBloodWallSplashTimer >= (cfg.ultBeamTickInterval || 6)) {
        this._piercingBloodWallSplashTimer = 0;
        this._spawnPiercingBloodSurfaceSplash(startX, startY, this.piercingBloodAngle, activeArena);
      }

      this.piercingBloodTimer--;
      const beamMax = this.piercingBloodBeamMax || cfg.ultBeamFrames || 96;
      this.piercingBloodProgress = Math.max(0, this.piercingBloodTimer / beamMax);

      if (this.piercingBloodTimer <= 0) {
        this._stopPiercingBloodSound();
        this.isFiringPiercingBlood = false;
        this.isClaspedForConvergence = false;
        this._piercingBloodHitState.clear();

        if (this.piercingBloodSource && this.piercingBloodSource.node) {
          this._clearBloodNode(this.piercingBloodSource.node, true);
          this.piercingBloodSource.node = null;
        }

        this._depositPiercingBloodFallout(startX, startY, this.piercingBloodAngle);
      }
    }
  }

  _spawnPiercingBloodSurfaceSplash(startX, startY, beamAngle, arena) {
    const cfg = CONFIG.choso || {};
    const maxLen = arena ? getRayArenaIntersection(startX, startY, beamAngle, arena, 6) : 1200;
    const beamLen = Math.min(1200, maxLen);
    const strike = resolvePiercingBloodStrikePoint(this, startX, startY, beamAngle, beamLen, this.r || 25);
    const baseSplash = Number(cfg.ultBeamSplashSize) || 88;
    const size = strike.hitTarget ? baseSplash : Math.round(baseSplash * 0.84);
    this.spawnBloodSplash(strike.hitX, strike.hitY, beamAngle, size, 22);
  }

  _executePiercingBloodDamage(startX = this.x, startY = this.y, beamAngle = this.piercingBloodAngle, ownerIndex = 0, explicitOpponent = null) {
    const cfg = CONFIG.choso || {};
    const arena = (typeof state !== 'undefined' && state.arena) || (CONFIG && CONFIG.arena);
    const maxLen = arena ? getRayArenaIntersection(startX, startY, beamAngle, arena, 0) : 1200;
    const beamLen = Math.min(1200, maxLen);
    const dx = Math.cos(beamAngle) * beamLen;
    const dy = Math.sin(beamAngle) * beamLen;
    const l2 = dx * dx + dy * dy;
    if (l2 <= 0) return;

    const bloodMultiplier = this.getBloodDamageMultiplier();
    const initialDamage = Math.round((cfg.ultBeamDamage || 125) * bloodMultiplier);
    const tickDamage = Math.round((cfg.ultBeamTickDamage || 14) * bloodMultiplier);
    const tickInterval = cfg.ultBeamTickInterval || 6;
    const tickPush = Number(cfg.ultBeamTickPush) || 1.4;
    const beamHalfWidth = (this.piercingBloodWidth || cfg.ultBeamWidth || 26) * 0.55;
    const baseSplashSize = Number(cfg.ultBeamSplashSize) || 88;

    const candidates = this._getAllValidEnemyTargets();
    if (this._isEnemyTarget(explicitOpponent) && !candidates.includes(explicitOpponent)) {
      candidates.push(explicitOpponent);
    }

    for (let i = 0; i < candidates.length; i++) {
      const ent = candidates[i];
      const entY = ent.y - (ent.z || 0);
      const t = Math.max(0, Math.min(1, ((ent.x - startX) * dx + (entY - startY) * dy) / l2));
      const projX = startX + t * dx;
      const projY = startY + t * dy;
      const distToCenter = Math.hypot(ent.x - projX, entY - projY);

      if (distToCenter > (ent.r || 25) + beamHalfWidth) continue;

      let hitState = this._piercingBloodHitState.get(ent);
      if (!hitState) {
        hitState = { initialHitDone: false, continuousDamageTimer: 0, infinityTick: 0 };
        this._piercingBloodHitState.set(ent, hitState);
      }

      // Check Gojo Infinity (Rule 1.7)
      const isInfinity = (typeof ent.hasActiveInfinity === 'function') && ent.hasActiveInfinity();
      if (isInfinity) {
        if (hitState.infinityTick === 0 && typeof ent.triggerInfinityBlock === 'function') {
          ent.triggerInfinityBlock(ent.x, ent.y, this);
        }
        hitState.infinityTick = (hitState.infinityTick + 1) % tickInterval;
        continue;
      }

      if (!hitState.initialHitDone) {
        const applied = applyDamageToTarget(ent, initialDamage, this, {
          isTrueDamage: true,
          hitType: 'piercing_blood',
          isLaser: true,
          isAdaptableSkillShot: true,
          skillShotId: 'piercing_blood'
        });
        if (applied !== false) {
          spawnSparks(ent.x, ent.y, 12, '#FFFFFF', '#FF2A55');
          this.spawnBloodSplash(projX, projY, beamAngle, baseSplashSize + 2, 22);
          if (typeof ent.applyHitStun === 'function') ent.applyHitStun(15);
          hitState.initialHitDone = true;
          hitState.continuousDamageTimer = 0;
          if (typeof this.onDamageDealt === 'function') {
            this.onDamageDealt(ent, { damage: initialDamage, isLaser: true }, ownerIndex);
          }
        }
        continue;
      }

      hitState.continuousDamageTimer++;
      if (hitState.continuousDamageTimer >= tickInterval) {
        const applied = applyDamageToTarget(ent, tickDamage, this, {
          isTrueDamage: true,
          hitType: 'piercing_blood_tick',
          isLaser: true,
          isAdaptableSkillShot: true,
          skillShotId: 'piercing_blood'
        });
        if (applied !== false) {
          if (tickPush !== 0 && !ent.immuneToPush && !ent.immuneToKnockback && ent.characterId !== 'escanor') {
            ent.vx += Math.cos(beamAngle) * tickPush;
            ent.vy += Math.sin(beamAngle) * tickPush;
          }
          spawnSparks(ent.x, ent.y, 5, '#FFFFFF', '#FF2A55');
          this.spawnBloodSplash(projX, projY, beamAngle, Math.round(baseSplashSize * 0.93), 20);
          if (typeof this.onDamageDealt === 'function') {
            this.onDamageDealt(ent, { damage: tickDamage, isLaser: true }, ownerIndex);
          }
        }
        hitState.continuousDamageTimer = 0;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // DAMAGE REACTION & SANGUINE RETALIATION MATRIX (FRAME 1 -> 2 -> 3)
  // ═══════════════════════════════════════════════════════════

  /**
   * Helper to spawn blood particles fanning out along hit angle away from attacker.
   */
  _spawnRetaliationBlood(hitAngle, count = 6) {
    const dropMultiplier = this.isFlowingRedScaleActive ? 2 : 1;
    const totalCount = Math.round(count * dropMultiplier);
    const nodes = [];
    for (let i = 0; i < totalCount; i++) {
      const spread = (Math.random() - 0.5) * 1.5; // ~85° fan cone away from hit
      const speed = 4.0 + Math.random() * 7.5;
      const vx = Math.cos(hitAngle + spread) * speed;
      const vy = Math.sin(hitAngle + spread) * speed;
      const dist = 6 + Math.random() * 16;
      const sx = this.x + Math.cos(hitAngle + spread) * dist;
      const sy = this.y + Math.sin(hitAngle + spread) * dist;
      const node = this.spawnBloodNode(sx, sy, vx, vy);
      if (node) nodes.push(node);
    }
    return nodes;
  }

  takeDamage(finalAmount, attacker, opts) {
    const res = super.takeDamage(finalAmount, attacker, opts);

    if (!this.isDead && this.hp > 0) {
      this.lastDamageAttacker = attacker || this.lastDamageAttacker;
      const cfg = CONFIG.choso || {};
      const minDrop = cfg.bloodNodesPerDamageTakenMin ?? 2;
      const maxDrop = cfg.bloodNodesPerDamageTakenMax ?? 4;
      const dropCount = minDrop + Math.floor(Math.random() * (Math.max(0, maxDrop - minDrop) + 1));

      // Shed natural blood droplets away from attacker without firing instant counter-attacks on hit
      const hitAngle = (attacker && typeof attacker.x === 'number')
        ? Math.atan2(this.y - attacker.y, this.x - attacker.x)
        : (this.lastHitAngle || 0);
      this._spawnRetaliationBlood(hitAngle, dropCount);
    }

    return res;
  }

  /**
   * Helper to retrieve all valid enemy targets (fighters & illusions, Rule 1.6).
   */
  _getAllValidEnemyTargets() {
    const enemies = [];
    if (typeof state === 'undefined') return enemies;

    const addIfEnemy = (cand) => {
      if (this._isEnemyTarget(cand) && !enemies.includes(cand)) {
        enemies.push(cand);
      }
    };

    if (state.fighters) {
      for (let i = 0; i < state.fighters.length; i++) {
        const f = state.fighters[i];
        addIfEnemy(f);
        const isFriendlyOwner = !f || f === this || (typeof this.isTeammate === 'function' && this.isTeammate(f));
        if (!isFriendlyOwner) {
          if (f.turretEntity) addIfEnemy(f.turretEntity);
          if (f.dispenserEntity) addIfEnemy(f.dispenserEntity);
          const subLists = [f.activeMinions, f.activeWallnuts, f.activePeashooters, f.activeSnowPeas, f.activeTorchwoods, f.activePotatoMines];
          for (let s = 0; s < subLists.length; s++) {
            if (Array.isArray(subLists[s])) {
              for (let k = 0; k < subLists[s].length; k++) addIfEnemy(subLists[s][k]);
            }
          }
        }
      }
    }

    const extraGroups = [state.illusions, state.deployables, state.plants, state.buildings];
    for (let g = 0; g < extraGroups.length; g++) {
      const list = extraGroups[g];
      if (!Array.isArray(list)) continue;
      for (let i = 0; i < list.length; i++) addIfEnemy(list[i]);
    }
    return enemies;
  }

  _findClosestEnemy() {
    const enemies = this._getAllValidEnemyTargets();
    let closest = null;
    let minDist = Infinity;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d < minDist) {
        minDist = d;
        closest = e;
      }
    }
    return closest;
  }

  isStationarySkillActive() {
    return Boolean(
      this.isRetaliationSpraying ||
      this.isCastingLaserMatrix ||
      this.isChargingPiercingBlood ||
      this.isFiringPiercingBlood ||
      this.isChargingSupernova ||
      super.isStationarySkillActive?.()
    );
  }

  interruptAttacks(forceCancelAll = false) {
    this._stopPiercingBloodSound();
    if (this._piercingBloodHitState) this._piercingBloodHitState.clear();
    this.isRetaliationSpraying = false;
    this.retaliationSprayTimer = 0;
    this.isCastingLaserMatrix = false;
    this.isClaspedForConvergence = false;
    this.isLaserMatrixLockedIn = false;
    this.laserMatrixTimer = 0;
    this.laserTelegraphTimer = 0;
    this.laserLockInTimer = 0;
    this._laserLockPos = null;
    this.isChargingSupernova = false;
    this.isChargingPiercingBlood = false;
    this.isFiringPiercingBlood = false;
    this.piercingBloodSource = null;
    this.chakramThrowTimer = 0;
    this.dartThrowTimer = 0;
    this.supernovaDetonationTimer = 0;
    this.convergenceRecoveryTimer = 0;
    if (this.supernovaSources) this.supernovaSources.length = 0;

    if (this.bloodNodes) {
      for (let i = this.bloodNodes.length - 1; i >= 0; i--) {
        const n = this.bloodNodes[i];
        if (n) {
          n.isIgnitedAsLaser = false;
          delete n.lockedAngle;
          delete n.lockedEndX;
          delete n.lockedEndY;
          if (forceCancelAll && n.dischargeTimer !== undefined) {
            this._clearBloodNode(n, false);
            this.bloodNodes.splice(i, 1);
          }
        }
      }
    }

    if (forceCancelAll) {
      if (this.chakrams) this.chakrams.length = 0;
      if (this.supernovaPellets) this.supernovaPellets.length = 0;
      if (this.supernovaBursts) this.supernovaBursts.length = 0;
      if (this.activeLaserBeams) this.activeLaserBeams.length = 0;
    }
  }

  onDeath() {
    this.interruptAttacks(true);
    super.onDeath?.();
  }

  /**
   * Required drawBody hook for engine previews and standard render loops (Rule 2.9 & Rule 21).
   */
  drawBody(ctx) {
    drawChosoSkin(ctx, this);
  }

  /**
   * Main Draw Pipeline
   * Explicitly renders health & freeze timer on top layer (Rule 2.9 & Rule 21).
   */
  draw(ctx, opponent) {
    if (this.hp <= 0 && this.isDead) return;

    // 1. Blood droplets are rendered exclusively by the default game system (state.bloodEffects / bloodEffect.js)

    // 2. Draw Laser Telegraph Guidance Lines & Lock-In Rays (Laser Matrix)
    if (this.isCastingLaserMatrix) {
      if (this.isLaserMatrixLockedIn && this.laserLockInTimer > 0) {
        const lockMax = Math.max(1, this.laserLockInMax || 14);
        const lockProgress = Math.max(0, Math.min(1, 1 - (this.laserLockInTimer / lockMax)));
        for (let i = 0; i < this.bloodNodes.length; i++) {
          const node = this.bloodNodes[i];
          if (node && !node.isDead && node.lockedEndX !== undefined && node.lockedEndY !== undefined) {
            drawLaserLockInLine(ctx, node.x, node.y, node.lockedEndX, node.lockedEndY, lockProgress);
          }
        }
        if (this._laserLockPos) {
          drawLaserLockInReticle(ctx, this._laserLockPos.x, this._laserLockPos.y, lockProgress);
        }
      } else if (this.laserTelegraphTimer > 0 && this._laserTarget) {
        const targetY = this._laserTarget.y - (this._laserTarget.z || 0);
        for (let i = 0; i < this.bloodNodes.length; i++) {
          const node = this.bloodNodes[i];
          if (node && !node.isDead) {
            drawLaserTelegraphLine(ctx, node.x, node.y, this._laserTarget.x, targetY, 0.75);
          }
        }
      }
    }

    // 3. Draw Active Laser Beams
    if (this.activeLaserBeams && this.activeLaserBeams.length > 0) {
      for (let i = 0; i < this.activeLaserBeams.length; i++) {
        const b = this.activeLaserBeams[i];
        const alpha = b.timer / b.maxTimer;
        drawBloodLaserBeam(ctx, b.startX, b.startY, b.endX, b.endY, b.thickness, alpha);
      }
    }

    // 4. Draw Slicing Exorcist Chakrams
    if (this.chakrams && this.chakrams.length > 0) {
      for (let i = 0; i < this.chakrams.length; i++) {
        drawBloodChakram(ctx, this.chakrams[i]);
      }
    }

    // 5. Draw Supernova Visuals
    drawSupernovaVisuals(ctx, this);

    // 6. Draw Piercing Blood Death Beam
    drawPiercingBloodBeam(ctx, this);

    // 7b. Draw 12-Frame 16-Bit Blood Splash Impacts (wall/entity/skill hits)
    drawChosoBloodSplashes(ctx, this);

    // 8. Draw Choso Body & Skin
    this.drawBody(ctx);

    // 9. Mandatory Top-Layer Overlay HP & Freeze Timer (Rule 2.9 & Rule 21)
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }
}
