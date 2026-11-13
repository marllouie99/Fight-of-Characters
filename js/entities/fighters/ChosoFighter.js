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
  drawBloodLaserBeam,
  drawBloodChakram,
  drawSupernovaVisuals,
  drawPiercingBloodBeam,
  drawBloodEdgeSlashArc,
  getRayArenaIntersection
} from '../../graphics/weapons/chosoBloodGraphics.js';
import { spawnSparks } from '../../graphics/particles/sparkEffect.js';
import { audioSystem } from '../../systems/audioSystem.js';
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

    // Attack State (5-Phase Melee Combo & Piercing Blood Darts)
    this.comboCount = 0;
    this.meleePhase = 0; // 0=Idle, 1=Lift, 2=Hold, 3=Strike, 4=Impact Lock, 5=Recovery
    this.meleePhaseTimer = 0;
    this.slashSwingTimer = 0;
    this.slashSwingMax = 28;
    this.slashCastAngle = 0;
    this.meleeReach = cfg.meleeReach || 70;
    this.meleeArc = cfg.meleeArc || (130 * Math.PI) / 180;
    this.basicAttackCooldown = 0;

    // Skill 1: Slicing Exorcist / Blood Chakram (Karisō)
    this.skill1Cooldown = 0;
    this.skill1CooldownMax = cfg.skill1Cooldown || 360;
    this.chakrams = [];

    // Skill 2: Supernova (Chōshinsei)
    this.skill2Cooldown = 0;
    this.skill2CooldownMax = cfg.skill2Cooldown || 540;
    this.isChargingSupernova = false;
    this.supernovaTimer = 0;
    this.supernovaOrbs = [];
    this.supernovaPellets = [];
    this.supernovaWindupMax = 24;
    this.supernovaDetonationTimer = 0;
    this.supernovaDetonationMax = 14;

    // Skill 3: Piercing Blood: True Convergence (Teisō / Fuga)
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
    this.piercingBloodBeamMax = cfg.ultBeamFrames || 36;

    // ULTIMATE: Blood Manipulation: Convergence
    // As long as Ultimate is UP and blood exists in the arena, converts all blood droplets into laser beams!
    this.ultCooldown = 0;
    this.ultCooldownMax = cfg.ultCooldown || 840; // 14.0s
    this.skill3Cooldown = 0; // Synchronized alias for backwards compatibility
    this.skill3CooldownMax = this.ultCooldownMax;
    this.isCastingLaserMatrix = false;
    this.laserMatrixTimer = 0;
    this.laserTelegraphTimer = 0;
    this.laserMatrixCastMax = cfg.laserMatrixCastFrames || 16;
    this.laserTelegraphMax = cfg.laserTelegraphFrames || 12;
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
      if (typeof window !== 'undefined' && window.PIXI && state.bloodSquareTexture && state.pixiLayers?.particles) {
        const s = new window.PIXI.Sprite(state.bloodSquareTexture);
        s.anchor.set(0.5);
        s.tint = numericColor;
        s.width = size;
        s.height = size;
        s.x = x;
        s.y = y;
        s.alpha = 1.0;
        state.pixiLayers.particles.addChild(s);
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

    // Clean up PIXI sprite & particle reference if present
    if (node.particleRef) {
      node.particleRef.isDead = true;
      node.particleRef.life = 0;
      node.particleRef.isIgnitedAsLaser = false;
      if (node.particleRef.sprite) {
        if (node.particleRef.sprite.parent) {
          node.particleRef.sprite.parent.removeChild(node.particleRef.sprite);
        }
        if (typeof node.particleRef.sprite.destroy === 'function') {
          node.particleRef.sprite.destroy();
        }
        node.particleRef.sprite = null;
      }
      if (typeof state !== 'undefined' && Array.isArray(state.bloodEffects)) {
        fastCleanArray(state.bloodEffects, p => p !== node.particleRef);
      }
    }

    if (removeFromNodes && this.bloodNodes && this.bloodNodes.length > 0) {
      fastCleanArray(this.bloodNodes, n => n !== node && n.id !== node.id);
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
            if (node.particleRef.sprite) {
              node.particleRef.sprite.x = node.x;
              node.particleRef.sprite.y = node.y;
              node.particleRef.sprite.alpha = 1.0;
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
          } else if (c.x >= maxX) {
            c.x = maxX;
            c.vx = -Math.abs(c.vx);
            c.bounces = (c.bounces || 0) + 1;
          }

          if (c.y <= minY) {
            c.y = minY;
            c.vy = Math.abs(c.vy);
            c.bounces = (c.bounces || 0) + 1;
          } else if (c.y >= maxY) {
            c.y = maxY;
            c.vy = -Math.abs(c.vy);
            c.bounces = (c.bounces || 0) + 1;
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
          }
        }

        return true;
      });
    }

    // 4. Supernova Shrapnel Pellets
    if (this.supernovaPellets && this.supernovaPellets.length > 0) {
      fastCleanArray(this.supernovaPellets, (p) => {
        p.lifespan--;
        if (p.lifespan <= 0) {
          spawnSparks(p.x, p.y, 4, '#FF2A55', '#FFFFFF');
          return false;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (arena) {
          const wallW = arena.wallWidth || 4;
          const margin = wallW + 6;
          const minX = arena.x + margin;
          const maxX = arena.x + arena.width - margin;
          const minY = arena.y + margin;
          const maxY = arena.y + arena.height - margin;

          if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
            spawnSparks(p.x, p.y, 4, '#FF2A55', '#FFFFFF');
            return false;
          }
        }

        return true;
      });
    }
  }

  /**
   * Main Fighter Update Loop
   */
  update(opponent, ownerIndex, arena) {
    if (this.isDead || this.isRespawning || this.hp <= 0) {
      this.interruptAttacks(true);
      return;
    }

    // 0. Update non-freezing active visual effects before freeze guard (Rule 1.9 & Rule 25)
    this._updateVisualEffects();

    // 1. Mandatory Rule 1 Freeze & TimeStop Early Exit Guard
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks();
      return;
    }

    const cfg = CONFIG.choso || {};

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
      this._updatePiercingBloodSequence(opponent);
      return; // Lock movement and aim during Mach 3 cannon firing
    }

    if (this.isChargingSupernova) {
      this._updateSupernovaSequence(opponent);
      return;
    }

    if (this.slashSwingTimer > 0) {
      this._updateMeleeSwing(opponent);
      return;
    }

    // 5. Standard AI Combat Aim & Convergence Check on Existing Blood
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

  _updateLaserMatrixSequence(opponent) {
    const target = this._laserTarget || opponent;
    this.vx = 0;
    this.vy = 0;

    // Verify diode nodes still exist during windup / telegraph pose
    const activeDiodes = this.bloodNodes.filter(n => n && !n.isDead);
    if (activeDiodes.length === 0) {
      this.isCastingLaserMatrix = false;
      this.isClaspedForConvergence = false;
      this.laserMatrixTimer = 0;
      this.laserTelegraphTimer = 0;
      return;
    }

    if (this.laserMatrixTimer > 0) {
      this.laserMatrixTimer--;
      return;
    }

    if (this.laserTelegraphTimer > 0) {
      this.laserTelegraphTimer--;
      if (this.laserTelegraphTimer === 0) {
        // DISCHARGE ALL LASER BEAMS SIMULTANEOUSLY!
        this._dischargeLaserMatrix(target);
        this.isCastingLaserMatrix = false;
        this.isClaspedForConvergence = false;
        this.convergenceRecoveryTimer = this.convergenceRecoveryMax || 14;
        const cfg = CONFIG.choso || {};
        this.laserTransmutationOverdriveTimer = cfg.laserTransmutationOverdriveFrames || 300; // 5.0s
      }
      return;
    }

    // Finished casting
    this.isCastingLaserMatrix = false;
    this.isClaspedForConvergence = false;
    this.convergenceRecoveryTimer = this.convergenceRecoveryMax || 14;
    const cfg = CONFIG.choso || {};
    this.laserTransmutationOverdriveTimer = cfg.laserTransmutationOverdriveFrames || 300; // 5.0s
  }

  /**
   * Fires supersonic piercing laser beams from every active blood node to the target.
   */
  _dischargeLaserMatrix(target) {
    if (!target || target.isDead) {
      this.isCastingLaserMatrix = false;
      this.isClaspedForConvergence = false;
      return;
    }

    const cfg = CONFIG.choso || {};
    let hitCount = 0;
    const arena = (typeof state !== 'undefined' && state.arena) || (CONFIG && CONFIG.arena);

    // Filter strictly to living nodes that were ignited for this matrix
    const validNodes = this.bloodNodes.filter(node => node && !node.isDead);

    if (validNodes.length === 0) {
      this.bloodNodes = [];
      this.isCastingLaserMatrix = false;
      this.isClaspedForConvergence = false;
      return;
    }

    const bloodMultiplier = this.getBloodDamageMultiplier(validNodes.length);
    const damagePerNode = Math.round((cfg.laserDamagePerNode || 14) * bloodMultiplier);

    for (let i = 0; i < validNodes.length; i++) {
      const node = validNodes[i];

      // Project beam from node through target, strictly clamped to arena boundary
      const angle = Math.atan2(target.y - node.y, target.x - node.x);
      const maxBeamDist = arena ? getRayArenaIntersection(node.x, node.y, angle, arena, 4) : 700;
      const beamReach = Math.min(700, maxBeamDist);
      const endX = node.x + Math.cos(angle) * beamReach;
      const endY = node.y + Math.sin(angle) * beamReach;

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

      // Check Gojo Limitless Infinity (Rule 1.7)
      const isInfinity = (typeof target.hasActiveInfinity === 'function') && target.hasActiveInfinity();
      if (!isInfinity) {
        applyDamageToTarget(target, damagePerNode, this, { isTrueDamage: true, hitType: 'laser', skipKnockback: true });
        hitCount++;
        spawnSparks(target.x, target.y, 4, '#FF2A55', '#FFFFFF');
      } else {
        if (typeof target.triggerInfinityBlock === 'function') {
          target.triggerInfinityBlock(target.x, target.y, this);
        }
      }

      // Keep blood droplet alive & visible as laser emitter square throughout beam duration (Frame 3)
      node.dischargeTimer = cfg.laserDischargeFrames || 22;
      node.isIgnitedAsLaser = true;
      if (node.particleRef) {
        node.particleRef.isIgnitedAsLaser = true;
        node.particleRef.vx = 0;
        node.particleRef.vy = 0;
      }
      spawnSparks(node.x, node.y, 4, '#FF2A55', '#FFFFFF');
    }

    if (hitCount > 0) {
      const pullX = this.x - target.x;
      const pullY = this.y - target.y;
      const pullDistance = Math.hypot(pullX, pullY);
      if (pullDistance > 0 && typeof target.applyKnockback === 'function') {
        const dragForce = cfg.laserMatrixDragForce ?? 2.8;
        target.applyKnockback((pullX / pullDistance) * dragForce, (pullY / pullDistance) * dragForce);
      }
      if (typeof target.applySlow === 'function') {
        target.applySlow(
          cfg.laserMatrixSlowDurationFrames ?? 90,
          cfg.laserMatrixSlowMultiplier ?? 0.55
        );
      }
    }

    // Inflict Sanguine Stun if 3+ simultaneous beams hit
    if (hitCount >= (cfg.laserMatrixStunThreshold || 3)) {
      if (typeof target.applyHitStun === 'function') {
        target.applyHitStun(cfg.laserMatrixStunDuration || 30);
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
  // SKILL 2: SUPERNOVA
  // ═══════════════════════════════════════════════════════════

  _startSupernova(target, sourceNodes = null) {
    const cfg = CONFIG.choso || {};
    this.skill2Cooldown = this.skill2CooldownMax;
    this.isChargingSupernova = true;
    this.supernovaWindupMax = 24;
    this.supernovaTimer = this.supernovaWindupMax;
    this.supernovaOrbs = [];

    let sources = sourceNodes;
    if (!sources || sources.length === 0) {
      const activeBlood = this._getActiveBloodParticles();
      sources = (activeBlood.length > 0) ? activeBlood.slice(0, 4) : [{ x: this.x, y: this.y }];
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
      // Spin orbiting orbs around source blood particles
      for (let i = 0; i < this.supernovaOrbs.length; i++) {
        this.supernovaOrbs[i].angle += 0.20;
      }
      return;
    }

    // Detonate Supernova in 360° Fragmentation Burst from each source blood particle!
    this.isChargingSupernova = false;
    this.supernovaDetonationTimer = this.supernovaDetonationMax || 14;
    const cfg = CONFIG.choso || {};
    const pelletCount = cfg.supernovaPelletCount || 12;
    const speed = cfg.supernovaPelletSpeed || 13;
    const sources = (this.supernovaSources && this.supernovaSources.length > 0)
      ? this.supernovaSources
      : [{ x: this.x, y: this.y }];

    for (let s = 0; s < sources.length; s++) {
      const src = sources[s];
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

      // AOE Damage in proximity of each source blood particle
      const candidates = this._getAllValidEnemyTargets();
      for (let i = 0; i < candidates.length; i++) {
        const ent = candidates[i];
        const d = Math.hypot(ent.x - src.x, ent.y - src.y);
        if (d <= (cfg.supernovaRange || 210)) {
          const bloodMultiplier = this.getBloodDamageMultiplier();
          const novaDamage = Math.round((cfg.supernovaPelletDamage || 14) * 3 * bloodMultiplier);
          applyDamageToTarget(ent, novaDamage, this, { hitType: 'supernova' });
          spawnSparks(ent.x, ent.y, 8, '#FF2A55', '#FFFFFF');
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
    this.isClaspedForConvergence = true;
    this.piercingBloodChargeMax = cfg.ultChargeFrames || 30;
    this.piercingBloodBeamMax = cfg.ultBeamFrames || 36;
    this.piercingBloodTimer = this.piercingBloodChargeMax;
    this.piercingBloodSource = { x: node.x, y: node.y, node: node };

    // Halt source blood particle in mid-air
    node.vx = 0;
    node.vy = 0;
    node.isIgnitedAsLaser = true;

    this.piercingBloodAngle = Math.atan2(target.y - node.y, target.x - node.x);
    this.gunAngle = this.piercingBloodAngle;
    this.vx = 0;
    this.vy = 0;

    audioSystem.playSFX(cfg.sounds?.convergenceClasp || 'Assets/Sound Effects/Skills/enhance.mp3', 1.20);
    if (typeof triggerGlobalScreenShake === 'function') triggerGlobalScreenShake(2.5, 8);
    return true;
  }

  _updatePiercingBloodSequence(opponent) {
    const cfg = CONFIG.choso || {};
    this.vx = 0;
    this.vy = 0;

    const startX = (this.piercingBloodSource && typeof this.piercingBloodSource.x === 'number')
      ? this.piercingBloodSource.x
      : this.x;
    const startY = (this.piercingBloodSource && typeof this.piercingBloodSource.y === 'number')
      ? this.piercingBloodSource.y
      : (this.y - (this.z || 0));

    // Phase 1: High-Pressure Singularity Compression at the Blood Particle
    if (this.isChargingPiercingBlood) {
      this.piercingBloodTimer--;
      if (this.piercingBloodTimer <= 0) {
        this.isChargingPiercingBlood = false;
        this.isFiringPiercingBlood = true;
        this.piercingBloodTimer = cfg.ultBeamFrames || 36;
        this.piercingBloodProgress = 1.0;

        // Apply massive backward recoil velocity impulse (Rule 30 physical force)
        this.vx -= Math.cos(this.piercingBloodAngle) * (cfg.ultRecoilKick || 16);
        this.vy -= Math.sin(this.piercingBloodAngle) * (cfg.ultRecoilKick || 16);

        // Deal full arena cleave damage along beam trajectory starting from the blood particle
        this._executePiercingBloodDamage(startX, startY, this.piercingBloodAngle);

        audioSystem.playSFX(cfg.sounds?.piercingBloodCannon || 'Assets/Sound Effects/Skills/redblast.mp3', cfg.soundVolumes?.piercingBloodCannon || 1.35);
        if (typeof triggerGlobalScreenShake === 'function') triggerGlobalScreenShake(4.5, 16);
      }
      return;
    }

    // Phase 2: Active Supersonic Beam Discharge from the Blood Particle
    if (this.isFiringPiercingBlood) {
      this.piercingBloodTimer--;
      this.piercingBloodProgress = this.piercingBloodTimer / (cfg.ultBeamFrames || 36);

      if (this.piercingBloodTimer <= 0) {
        this.isFiringPiercingBlood = false;
        this.isClaspedForConvergence = false;

        // Source blood particle was used for Piercing Blood — clear it up!
        if (this.piercingBloodSource && this.piercingBloodSource.node) {
          this._clearBloodNode(this.piercingBloodSource.node, true);
          this.piercingBloodSource.node = null;
        }

        // Deposit vapor droplets along beam path strictly within arena walls
        const arena = (typeof state !== 'undefined' && state.arena) || (CONFIG && CONFIG.arena);
        const maxDist = arena ? getRayArenaIntersection(startX, startY, this.piercingBloodAngle, arena, 10) : 400;
        const safeBeamDist = Math.max(0, maxDist - 12);
        const maxNodes = cfg.ultFalloutNodes || 10;
        const dropCount = Math.min(maxNodes, Math.max(1, Math.floor(safeBeamDist / 50)));

        if (safeBeamDist > 20 && dropCount > 0) {
          const step = safeBeamDist / (dropCount + 1);
          for (let i = 1; i <= dropCount; i++) {
            const dist = i * step;
            const dropX = startX + Math.cos(this.piercingBloodAngle) * dist;
            const dropY = startY + Math.sin(this.piercingBloodAngle) * dist;
            this.spawnBloodNode(dropX, dropY, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
          }
        }
      }
    }
  }

  _executePiercingBloodDamage(startX = this.x, startY = this.y, beamAngle = this.piercingBloodAngle) {
    const cfg = CONFIG.choso || {};
    const bloodMultiplier = this.getBloodDamageMultiplier();
    const damage = Math.round((cfg.ultBeamDamage || 125) * bloodMultiplier);
    const candidates = this._getAllValidEnemyTargets();

    for (let i = 0; i < candidates.length; i++) {
      const ent = candidates[i];
      const angleToEnt = Math.atan2(ent.y - startY, ent.x - startX);
      const angleDiff = Math.abs(Math.atan2(Math.sin(angleToEnt - beamAngle), Math.cos(angleToEnt - beamAngle)));

      // Beam line intersection within narrow 22° cone
      if (angleDiff <= (22 * Math.PI) / 180) {
        // Check Gojo Infinity (Rule 1.7)
        const isInfinity = (typeof ent.hasActiveInfinity === 'function') && ent.hasActiveInfinity();
        if (!isInfinity) {
          applyDamageToTarget(ent, damage, this, { isTrueDamage: true, hitType: 'piercing_blood' });
          spawnSparks(ent.x, ent.y, 12, '#FFFFFF', '#FF2A55');
          if (typeof ent.applyHitStun === 'function') ent.applyHitStun(35);
        } else {
          if (typeof ent.triggerInfinityBlock === 'function') {
            ent.triggerInfinityBlock(ent.x, ent.y, this);
          }
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PRIMARY ATTACK: 5-PHASE BLOOD EDGE MELEE & BLOOD DARTS
  // ═══════════════════════════════════════════════════════════

  _startMeleeCombo(target) {
    const cfg = CONFIG.choso || {};
    this.comboCount = (this.comboCount % 3) + 1;
    this.slashSwingTimer = this.slashSwingMax;
    this.slashCastAngle = Math.atan2(target.y - this.y, target.x - this.x);
    this.gunAngle = this.slashCastAngle;
    this.basicAttackCooldown = cfg.cooldown || 36;

    audioSystem.playSFX(cfg.sounds?.meleeSlash || 'Assets/Sound Effects/Attacks/swordswing.mp3', cfg.soundVolumes?.meleeSlash || 0.90);
  }

  _updateMeleeSwing(opponent) {
    this.slashSwingTimer--;
    const progress = 1.0 - (this.slashSwingTimer / this.slashSwingMax);

    // Hit impact at 50% swing progress (Rule 30)
    if (progress >= 0.50 && !this._meleeHitDelivered) {
      this._meleeHitDelivered = true;
      this._executeMeleeImpact(opponent);
    }

    if (this.slashSwingTimer <= 0) {
      this._meleeHitDelivered = false;
    }
  }

  _executeMeleeImpact(opponent) {
    const cfg = CONFIG.choso || {};
    const bloodMultiplier = this.getBloodDamageMultiplier();
    const comboDmg = cfg.meleeDamageCombo || [22, 26, 34];
    const dmg = Math.round((comboDmg[this.comboCount - 1] || 22) * bloodMultiplier);
    const candidates = this._getAllValidEnemyTargets();

    for (let i = 0; i < candidates.length; i++) {
      const ent = candidates[i];
      const dist = Math.hypot(ent.x - this.x, ent.y - this.y);
      if (dist <= (this.meleeReach + ent.r)) {
        const angleTo = Math.atan2(ent.y - this.y, ent.x - this.x);
        const diff = Math.abs(Math.atan2(Math.sin(angleTo - this.slashCastAngle), Math.cos(angleTo - this.slashCastAngle)));

        if (diff <= this.meleeArc / 2) {
          applyDamageToTarget(ent, dmg, this, { hitType: 'blood_edge' });
          spawnSparks(ent.x, ent.y, 6, '#FF2A55', '#A31D1D');
          audioSystem.playSFX(cfg.sounds?.fleshHit || 'Assets/Sound Effects/Attacks/fleshhit.mp3', cfg.soundVolumes?.fleshHit || 1.00);

          // Third hit drops 3 fresh blood nodes on target ONLY if infinite blood is enabled
          if (this.comboCount === 3 && isSkillEnabled(cfg.enableInfiniteBlood, false)) {
            for (let k = 0; k < 3; k++) {
              this.spawnBloodNode(ent.x + (Math.random() - 0.5) * 16, ent.y + (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
            }
          }
        }
      }
    }
  }

  _throwBloodDart(target, sourceNode = null) {
    const cfg = CONFIG.choso || {};
    this.basicAttackCooldown = cfg.cooldown || 36;
    this.dartThrowTimer = this.dartThrowMax || 12;
    let node = sourceNode;
    if (!node) {
      const activeBlood = this._getActiveBloodParticles();
      node = (activeBlood.length > 0 ? activeBlood[activeBlood.length - 1] : null);
    }
    const startX = (node && typeof node.x === 'number') ? node.x : this.x;
    const startY = (node && typeof node.y === 'number') ? node.y : (this.y - (this.z || 0));

    const angle = Math.atan2(target.y - startY, target.x - startX);
    this.gunAngle = angle;

    const arena = (typeof state !== 'undefined' && state.arena) || (CONFIG && CONFIG.arena);
    const maxDist = arena ? getRayArenaIntersection(startX, startY, angle, arena, 4) : 400;
    const dist = Math.min(400, maxDist);
    const endX = startX + Math.cos(angle) * dist;
    const endY = startY + Math.sin(angle) * dist;

    this.activeLaserBeams.push({
      startX: startX,
      startY: startY,
      endX: endX,
      endY: endY,
      timer: 6,
      maxTimer: 6,
      thickness: 2.6,
      damageDealt: true,
      target: target
    });

    // Apply damage
    const bloodMultiplier = this.getBloodDamageMultiplier();
    const dartDmg = Math.round((cfg.rangedDartDamage || 18) * bloodMultiplier);
    applyDamageToTarget(target, dartDmg, this, { hitType: 'blood_dart' });

    // Blood particle was thrown as a dart — clear it up!
    if (node) {
      this._clearBloodNode(node, true);
    }

    audioSystem.playSFX(cfg.sounds?.dartThrow || 'Assets/Sound Effects/Attacks/shurikenthrow.mp3', cfg.soundVolumes?.dartThrow || 0.85);
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
      const target = attacker || this._findClosestEnemy();

      const cfg = CONFIG.choso || {};
      const isUltReady = (this.ultCooldown <= 0 || this.skill3Cooldown <= 0) &&
                         isSkillEnabled(cfg.enableLaserMatrix, true) &&
                         !this.isCastingLaserMatrix &&
                         !this.isRetaliationSpraying;

      const isPiercingBloodReady = isSkillEnabled(cfg.enablePiercingBlood, true) &&
                                   this.piercingBloodCooldown <= 0 &&
                                   !this.isChargingPiercingBlood &&
                                   !this.isFiringPiercingBlood &&
                                   !this.isCastingLaserMatrix;

      const isSupernovaReady = isSkillEnabled(cfg.enableSupernova, true) &&
                               this.skill2Cooldown <= 0 &&
                               !this.isChargingSupernova &&
                               !this.isCastingLaserMatrix;

      const isChakramReady = isSkillEnabled(cfg.enableChakram, true) &&
                             this.skill1Cooldown <= 0 &&
                             !this.isCastingLaserMatrix;

      // Calculate damage impact angle away from attacker
      const hitAngle = (target && typeof target.x === 'number')
        ? Math.atan2(this.y - target.y, this.x - target.x)
        : (this.lastHitAngle || 0);

      // Trigger offensive ability on hit with blood particles as the source!
      if (target && !target.isDead && target.hp > 0) {
        if (isUltReady) {
          // 1. Ultimate: Convergence (Laser Matrix) from all blood particles
          this._triggerSanguineRetaliation(target, hitAngle);
        } else if (isPiercingBloodReady) {
          // 2. Skill 3: Piercing Blood from blood particle
          this._triggerPiercingBloodRetaliation(target, hitAngle);
        } else if (isSupernovaReady) {
          // 3. Skill 2: Supernova from blood particles
          this._triggerSupernovaRetaliation(target, hitAngle);
        } else if (isChakramReady) {
          // 4. Skill 1: Slicing Exorcist from blood particle
          this._triggerChakramRetaliation(target, hitAngle);
        } else {
          // 5. Basic Offensive Attack: Sanguine Darts from blood particles
          this._triggerSanguineDartsRetaliation(target, hitAngle);
        }
      } else {
        // Standard combat blood shedding if no valid target
        this._spawnRetaliationBlood(hitAngle, 4);
      }
    }

    return res;
  }

  /**
   * Retaliation 1 (Ultimate): Erupts a dramatic spray of blood particles fanning out behind Choso away from attacker.
   * After 6 frames of visible flight into mid-air, halts all particles and transitions to Convergence Laser Matrix.
   */
  _triggerSanguineRetaliation(attacker, hitAngle) {
    const cfg = CONFIG.choso || {};
    this.ultCooldown = this.ultCooldownMax;
    this.skill3Cooldown = this.skill3CooldownMax;
    this._laserTarget = attacker;
    this._retaliationTarget = attacker;

    // Spawn 14 to 18 blood particles fanning out behind Choso away from attacker (Frame 2)
    const count = 16;
    const sprayNodes = [];
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 1.5; // ~85° fan cone behind Choso
      const speed = 4.5 + Math.random() * 8.5;
      const vx = Math.cos(hitAngle + spread) * speed;
      const vy = Math.sin(hitAngle + spread) * speed;
      const dist = 8 + Math.random() * 16;
      const sx = this.x + Math.cos(hitAngle + spread) * dist;
      const sy = this.y + Math.sin(hitAngle + spread) * dist;
      const node = this.spawnBloodNode(sx, sy, vx, vy);
      if (node) sprayNodes.push(node);
    }

    // Set brief spray timer so blood visibly fans out into mid-air behind Choso (Frame 2)
    this.isRetaliationSpraying = true;
    this.retaliationSprayTimer = 6;
    this._retaliationNodes = sprayNodes;

    audioSystem.playSFX(cfg.sounds?.meleeSlash || 'Assets/Sound Effects/Attacks/swordswing.mp3', 0.85);
  }

  /**
   * Retaliation 2 (Skill 3): Piercing Blood fired directly from a blood particle!
   */
  _triggerPiercingBloodRetaliation(attacker, hitAngle) {
    const nodes = this._spawnRetaliationBlood(hitAngle, 8);
    const sourceNode = (nodes.length > 0)
      ? nodes[Math.floor(nodes.length / 2)]
      : (this.bloodNodes[this.bloodNodes.length - 1] || { x: this.x, y: this.y });
    this._startPiercingBlood(attacker, sourceNode);
  }

  /**
   * Retaliation 3 (Skill 2): Supernova detonates directly from blood particles!
   */
  _triggerSupernovaRetaliation(attacker, hitAngle) {
    const nodes = this._spawnRetaliationBlood(hitAngle, 8);
    const sourceNodes = (nodes.length > 0)
      ? nodes.slice(0, Math.min(4, nodes.length))
      : (this.bloodNodes.slice(0, 4));
    this._startSupernova(attacker, sourceNodes);
  }

  /**
   * Retaliation 4 (Skill 1): Slicing Exorcist (Chakram) launched directly from a blood particle!
   */
  _triggerChakramRetaliation(attacker, hitAngle) {
    const nodes = this._spawnRetaliationBlood(hitAngle, 6);
    const sourceNode = (nodes.length > 0)
      ? nodes[0]
      : (this.bloodNodes[this.bloodNodes.length - 1] || { x: this.x, y: this.y });
    this._castChakram(attacker, sourceNode);
  }

  /**
   * Retaliation 5 (Basic Attack): Sanguine Darts shoot directly from each spawned blood particle!
   */
  _triggerSanguineDartsRetaliation(attacker, hitAngle) {
    const cfg = CONFIG.choso || {};
    this.basicAttackCooldown = cfg.cooldown || 36;
    this.dartThrowTimer = this.dartThrowMax || 12;
    const freshNodes = this._spawnRetaliationBlood(hitAngle, 5);
    const allUnexpired = this._getActiveBloodParticles();
    const firingNodes = (allUnexpired.length > 0) ? allUnexpired : freshNodes;
    if (!firingNodes || firingNodes.length === 0) return;

    const bloodMultiplier = this.getBloodDamageMultiplier();
    const dartDamage = Math.round((cfg.rangedDartDamage || 18) * bloodMultiplier);

    const arena = (typeof state !== 'undefined' && state.arena) || (CONFIG && CONFIG.arena);
    for (let i = 0; i < firingNodes.length; i++) {
      const node = firingNodes[i];
      const angle = Math.atan2(attacker.y - node.y, attacker.x - node.x);
      const maxDist = arena ? getRayArenaIntersection(node.x, node.y, angle, arena, 4) : 400;
      const dist = Math.min(400, maxDist);
      const endX = node.x + Math.cos(angle) * dist;
      const endY = node.y + Math.sin(angle) * dist;

      this.activeLaserBeams.push({
        startX: node.x,
        startY: node.y,
        endX: endX,
        endY: endY,
        timer: 6,
        maxTimer: 6,
        thickness: 2.6,
        damageDealt: true,
        target: attacker
      });

      // Blood particle acts as dart emitter for 6 frames, then clears up!
      node.dischargeTimer = 6;
      node.isIgnitedAsLaser = true;

      const isInfinity = (typeof attacker.hasActiveInfinity === 'function') && attacker.hasActiveInfinity();
      if (!isInfinity) {
        applyDamageToTarget(attacker, dartDamage, this, { hitType: 'blood_dart' });
        spawnSparks(attacker.x, attacker.y, 4, '#FF2A55', '#FFFFFF');
      } else if (typeof attacker.triggerInfinityBlock === 'function') {
        attacker.triggerInfinityBlock(attacker.x, attacker.y, this);
      }
    }

    audioSystem.playSFX(cfg.sounds?.dartThrow || 'Assets/Sound Effects/Attacks/shurikenthrow.mp3', cfg.soundVolumes?.dartThrow || 0.85);
    audioSystem.playSFX(cfg.sounds?.fleshHit || 'Assets/Sound Effects/Attacks/fleshhit.mp3', 0.90);
  }

  /**
   * Helper to retrieve all valid enemy targets (fighters & illusions, Rule 1.6).
   */
  _getAllValidEnemyTargets() {
    const enemies = [];
    if (typeof state === 'undefined') return enemies;

    if (state.fighters) {
      for (let i = 0; i < state.fighters.length; i++) {
        const f = state.fighters[i];
        if (f && f !== this && !f.isDead && f.hp > 0 && f.team !== this.team) {
          enemies.push(f);
        }
      }
    }
    if (state.illusions) {
      for (let i = 0; i < state.illusions.length; i++) {
        const ill = state.illusions[i];
        if (ill && ill !== this && !ill.isDead && ill.hp > 0 && ill.team !== this.team) {
          enemies.push(ill);
        }
      }
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
      (this.slashSwingTimer > 0) ||
      super.isStationarySkillActive?.()
    );
  }

  interruptAttacks(forceCancelAll = false) {
    this.slashSwingTimer = 0;
    this._meleeHitDelivered = false;
    this.isRetaliationSpraying = false;
    this.retaliationSprayTimer = 0;
    this.isCastingLaserMatrix = false;
    this.isClaspedForConvergence = false;
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
      if (this.activeLaserBeams) this.activeLaserBeams.length = 0;
    }
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

    // 2. Draw Laser Telegraph Guidance Lines (Laser Matrix)
    if (this.isCastingLaserMatrix && this.laserTelegraphTimer > 0 && this._laserTarget) {
      for (let i = 0; i < this.bloodNodes.length; i++) {
        const node = this.bloodNodes[i];
        if (node && !node.isDead) {
          drawLaserTelegraphLine(ctx, node.x, node.y, this._laserTarget.x, this._laserTarget.y, 0.75);
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

    // 6. Draw Blood Edge Melee Slashes
    drawBloodEdgeSlashArc(ctx, this);

    // 7. Draw Piercing Blood Death Beam
    drawPiercingBloodBeam(ctx, this);

    // 8. Draw Choso Body & Skin
    this.drawBody(ctx);

    // 9. Mandatory Top-Layer Overlay HP & Freeze Timer (Rule 2.9 & Rule 21)
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }
}
