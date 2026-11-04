import { Fighter } from './fighter.js';
import { CONFIG } from '../core/config.js';
import { spawnFloatingText, state } from '../core/state.js';
import { audioSystem } from '../systems/audioSystem.js';
import { getSkillEffectSound } from '../soundEffects/skillEffectSounds.js';
import { drawDispenser, drawDispenserTetherBeam, drawDispenserHealingRing } from '../graphics/weapons/engineerWeaponGraphics.js';
import { spawnSparks } from '../graphics/particles/sparkEffect.js';
import { spawnMachineCorpse } from '../graphics/particles/deathShatterEffect.js';
import { drawMinionHealthBar } from '../graphics/statusEffects.js';

export class DispenserEntity extends Fighter {
  constructor(x, y, ownerFighter) {
    const cfg = CONFIG.Engineer || {};
    const def = {
      id: 998,
      name: 'Dispenser',
      color: '#b8860b',
      startX: x,
      startY: y,
      startVx: 0,
      startVy: 0,
      radius: cfg.dispenserRadius || 19,
      type: 'Dispenser',
      isDispenser: true,
      isMinion: true,
      isDeployable: true,
      noBlood: true,
      suppressBlood: true,
      bleedImmune: true,
      isBloodImmune: true,
      hp: cfg.dispenserHp || 160,
      damage: 0,
      cooldown: 0,
      moveSpeed: 0,
      spinRate: 0,
    };
    super(def);

    this.owner = ownerFighter;

    // Comprehensive Debuff & Status Effect Immunity Flags
    this.isDispenser = true;
    this.isBuilding = true;
    this.isMinion = true;
    this.isDeployable = true;
    this.isImmovable = true;
    this.cannotBeKnockbacked = true;
    this.immuneToKnockback = true;
    this.immuneToPush = true;
    this.immuneToPull = true;
    this.immuneToSuction = true;
    this.immuneToDrag = true;
    this.immuneToCC = true;
    this.immuneToDebuffs = true;
    this.isDebuffImmune = true;
    this.isStatusImmune = true;
    this.immuneToBurn = true;
    this.isImmuneToBurn = true;
    this.immuneToPoison = true;
    this.isPoisonImmune = true;
    this.bleedImmune = true;
    this.isBloodImmune = true;
    this.noBlood = true;
    this.suppressBlood = true; // Machines don't bleed — spawn sparks instead
    this.immuneToParalyze = true;
    this.isParalyzeImmune = true;
    this.immuneToSlow = true;
    this.immuneToHitStun = true;
    this.immuneToTimeStop = true;
    this.immuneToFreeze = true;
    this.immuneToSoulDisfigurement = true;
    this.immuneToTelekinesis = true;
    this.cannotBeChained = true;
    this.cannotBeGrabbed = true;
    this.cannotBeSwapped = true;
    this.domainImmunity = true;
    this.isDomainImmune = true;
    this.immuneToDomainStasis = true;
    this.cannotBeTargetedByAmbush = true;
    this._bypassHealDebuff = true;
    this.hideHpText = true; // Disable HP number overlay over body
    this.maxHp = cfg.dispenserHp || 160;
    this.hp = this.maxHp;
    this.healCooldownTimer = 0;
    this.hitFlashTimer = 0;
    this.healTimer = 0;
    this.healTickTimer = 0;
    this.smokeParticles = [];
    this.tetheredTargets = [];
    this._tetheredFighterSet = new Set();
    this.isBuilding = true;
    this.buildProgress = 0;
    this._fixedX = x;
    this._fixedY = y;
  }

  // ── Absolute Debuff & Status Effect Neutralization Getters/Setters ──
  get burnTimer() { return 0; }
  set burnTimer(_) {}
  get burnDamageTimer() { return 0; }
  set burnDamageTimer(_) {}
  get poisonTimer() { return 0; }
  set poisonTimer(_) {}
  get poisonTicks() { return 0; }
  set poisonTicks(_) {}
  get bleedTimer() { return 0; }
  set bleedTimer(_) {}
  get bleedDamageTimer() { return 0; }
  set bleedDamageTimer(_) {}
  get slowTimer() { return 0; }
  set slowTimer(_) {}
  get slowMultiplier() { return 1.0; }
  set slowMultiplier(_) {}
  get paralyzeTimer() { return 0; }
  set paralyzeTimer(_) {}
  get isParalyzed() { return false; }
  set isParalyzed(_) {}
  get iceFreezeTimer() { return 0; }
  set iceFreezeTimer(_) {}
  get isFrozenBySnowPea() { return false; }
  set isFrozenBySnowPea(_) {}
  get isFrozenByBlueBone() { return false; }
  set isFrozenByBlueBone(_) {}
  get isFrozenByInfinity() { return false; }
  set isFrozenByInfinity(_) {}
  get timeStopTimer() { return 0; }
  set timeStopTimer(_) {}
  get hitStunTimer() { return 0; }
  set hitStunTimer(_) {}
  get electricStunTimer() { return 0; }
  set electricStunTimer(_) {}
  get crimsonElectrifiedTimer() { return 0; }
  set crimsonElectrifiedTimer(_) {}
  get dubstepStunTimer() { return 0; }
  set dubstepStunTimer(_) {}
  get silenceTimer() { return 0; }
  set silenceTimer(_) {}
  get nanamiArmorFractureTimer() { return 0; }
  set nanamiArmorFractureTimer(_) {}
  get grievousWoundsTimer() { return 0; }
  set grievousWoundsTimer(_) {}
  get healBlockTimer() { return 0; }
  set healBlockTimer(_) {}
  get tojiRegenDebuffTimer() { return 0; }
  set tojiRegenDebuffTimer(_) {}
  get blackFlashDebuffTimer() { return 0; }
  set blackFlashDebuffTimer(_) {}
  get pureLoveBeamRegenDebuffTimer() { return 0; }
  set pureLoveBeamRegenDebuffTimer(_) {}
  get staticDebuffTimer() { return 0; }
  set staticDebuffTimer(_) {}
  get zenitsuStaticDebuffTimer() { return 0; }
  set zenitsuStaticDebuffTimer(_) {}
  get voidMarkTimer() { return 0; }
  set voidMarkTimer(_) {}
  get isTargetOfAmbush() { return false; }
  set isTargetOfAmbush(_) {}
  get isChainedByMakima() { return false; }
  set isChainedByMakima(_) {}
  get isWallPinnedByMakima() { return false; }
  set isWallPinnedByMakima(_) {}
  get isWallPinnedBySaitama() { return false; }
  set isWallPinnedBySaitama(_) {}
  get isWallPinnedByNaoya() { return false; }
  set isWallPinnedByNaoya(_) {}
  get isCurrentlyWallPinnedByNaoya() { return false; }
  set isCurrentlyWallPinnedByNaoya(_) {}
  get isCaughtInNaoyaUlt() { return false; }
  set isCaughtInNaoyaUlt(_) {}
  get isFrameFrozen() { return false; }
  set isFrameFrozen(_) {}
  get frameFreezeTimer() { return 0; }
  set frameFreezeTimer(_) {}
  get isCaughtInBlue() { return false; }
  set isCaughtInBlue(_) {}
  get isCaughtInBluePull() { return false; }
  set isCaughtInBluePull(_) {}
  get isCaughtInBlackHole() { return false; }
  set isCaughtInBlackHole(_) {}
  get isDraggedByGetsuga() { return false; }
  set isDraggedByGetsuga(_) {}
  get isDraggedByDragon() { return false; }
  set isDraggedByDragon(_) {}
  get isPacmanGhost() { return false; }
  set isPacmanGhost(_) {}
  get isFrightenedGhost() { return false; }
  set isFrightenedGhost(_) {}
  get isParalyzedByMahito() { return false; }
  set isParalyzedByMahito(_) {}
  get isParalyzedByMahoraga() { return false; }
  set isParalyzedByMahoraga(_) {}
  get isGrabbedByMahoraga() { return false; }
  set isGrabbedByMahoraga(_) {}
  get isUnderMindControl() { return false; }
  set isUnderMindControl(_) {}
  get isSubjugated() { return false; }
  set isSubjugated(_) {}
  get caughtInJohnWickCombo() { return false; }
  set caughtInJohnWickCombo(_) {}
  get caughtInYujiFlurry() { return false; }
  set caughtInYujiFlurry(_) {}
  get caughtInOmniPunch() { return false; }
  set caughtInOmniPunch(_) {}
  get caughtInSaitamaCounter() { return false; }
  set caughtInSaitamaCounter(_) {}
  get caughtInGenosFlurry() { return false; }
  set caughtInGenosFlurry(_) {}
  get ratioHitPauseTimer() { return 0; }
  set ratioHitPauseTimer(_) {}
  get basicAttackHitPauseTimer() { return 0; }
  set basicAttackHitPauseTimer(_) {}

  reset() {
    super.reset();
    const cfg = CONFIG.Engineer || {};
    this.isDispenser = true;
    this.isBuilding = true;
    this.isMinion = true;
    this.isDeployable = true;
    this.isImmovable = true;
    this.cannotBeKnockbacked = true;
    this.immuneToKnockback = true;
    this.immuneToPush = true;
    this.immuneToPull = true;
    this.immuneToSuction = true;
    this.immuneToDrag = true;
    this.immuneToCC = true;
    this.immuneToDebuffs = true;
    this.isDebuffImmune = true;
    this.isStatusImmune = true;
    this.immuneToBurn = true;
    this.isImmuneToBurn = true;
    this.immuneToPoison = true;
    this.isPoisonImmune = true;
    this.bleedImmune = true;
    this.isBloodImmune = true;
    this.noBlood = true;
    this.suppressBlood = true;
    this.immuneToParalyze = true;
    this.isParalyzeImmune = true;
    this.immuneToSlow = true;
    this.immuneToHitStun = true;
    this.immuneToTimeStop = true;
    this.immuneToFreeze = true;
    this.immuneToSoulDisfigurement = true;
    this.immuneToTelekinesis = true;
    this.cannotBeChained = true;
    this.cannotBeGrabbed = true;
    this.cannotBeSwapped = true;
    this.domainImmunity = true;
    this.isDomainImmune = true;
    this.immuneToDomainStasis = true;
    this.cannotBeTargetedByAmbush = true;
    this._bypassHealDebuff = true;
    this.hideHpText = true;
    this.maxHp = cfg.dispenserHp || 160;
    this.hp = this.maxHp;
    this.tetheredTargets = [];
    this._tetheredFighterSet = new Set();
    if (this._fixedX !== undefined) {
      this.x = this._fixedX;
      this.y = this._fixedY;
    }
    this.vx = 0;
    this.vy = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
  }

  // ── Debuff & Physics Neutralization Method Overrides ──
  applyKnockback() { return; }
  applyPush() { return; }
  applyPull() { return; }
  applySuction() { return; }
  applyDrag() { return; }
  applyBurn() { return; }
  applyPoison() { return; }
  applyBleed() { return; }
  applySlow() { return; }
  applyHitStun() { return; }
  applyParalyze() { return; }
  applyFreeze() { return; }
  applyTimeStop() { return; }
  applySilence() { return; }
  applyStatusEffect() { return; }
  applyElectricStun() { return; }
  applySoulDisfigurement() { return; }
  applyTelekinesis() { return; }
  applyChain() { return; }
  applyRatioCrit() { return; }
  applyDomainStasis() { return; }
  applyGetsugaDrag() { return; }
  handleBurn() { return; }
  handlePoison() { return; }
  handleBleed() { return; }
  handleStatusEffects() { return; }
  _handleTimeStop() { return false; }
  isStunnedOrFrozen() { return false; }
  isParalyzedDebuffActive() { return false; }
  isSilenced() { return false; }
  isCaughtInBeam() { return false; }
  drawStatusOverlays() { /* Buildings are immune to debuffs */ }
  drawFreezeTimer() { /* Buildings are immune to freeze */ }

  takeDamage(amount, attacker, opts = {}) {
    if (this.isBuilding) return false;

    // Normalize opts: callers may pass a bare boolean or non-object.
    if (!opts || typeof opts !== 'object') opts = {};

    // Dispensers are completely immune to all status effect DoTs and debuff damage
    if (opts.isPoison || opts.isBurn || opts.isFlame || opts.isBleed || opts.isElectrified || opts.isCurse || opts.source === 'bleed' || opts.source === 'curse' || opts.source === 'poison' || opts.source === 'burn') {
      return false;
    }

    opts.knockback = false;
    opts.knockbackVx = 0;
    opts.knockbackVy = 0;

    const applied = super.takeDamage(amount, attacker, opts);
    this.vx = 0;
    this.vy = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    if (this._fixedX !== undefined) {
      this.x = this._fixedX;
      this.y = this._fixedY;
    }
    if (applied && this.hp > 0) {
      this.hitFlashTimer = 10;
    }
    return applied;
  }

  onDeath() {
    spawnMachineCorpse(this.x, this.y, 0);
    for (let i = 0; i < 4; i++) {
      spawnSparks(this.x, this.y, 8, 'gold');
    }
    const deathSound = getSkillEffectSound('turret', 'death');
    if (deathSound) audioSystem.playSFX(deathSound.src, deathSound.volume);
  }

  heal(amount) {
    if (this.hp <= 0) return;
    this.hp = Math.min(this.hp + amount, this.maxHp);
    this.healTimer = 20;
    spawnFloatingText(this.x, this.y - this.r - 10, `+${Math.round(amount)} HP`, '#00FF88');
  }

  update(opponent, ownerIndex, arena) {
    if (this.hp <= 0) return;

    if (this.healCooldownTimer > 0) this.healCooldownTimer--;
    if (this.hitFlashTimer > 0) this.hitFlashTimer--;
    if (this.healTimer > 0) this.healTimer--;

    // Update smoke particles
    if (this.smokeParticles && this.smokeParticles.length > 0) {
      for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
        const p = this.smokeParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.size += 0.35;
        p.life--;
        if (p.life <= 0) {
          this.smokeParticles.splice(i, 1);
        }
      }
    }

    // ── Absolute Immovable Anchor Lock ──
    // Dispenser is a fixed, heavy support cabinet anchored to the arena floor.
    // Zero out all velocities and lock coordinates unconditionally to prevent ANY push or displacement.
    this.vx = 0;
    this.vy = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    if (this._fixedX === undefined) {
      this._fixedX = this.x;
      this._fixedY = this.y;
    } else {
      this.x = this._fixedX;
      this.y = this._fixedY;
    }

    // Keep within arena bounds
    if (arena) {
      if (this.x - this.r < arena.x) this.x = arena.x + this.r;
      if (this.x + this.r > arena.x + arena.width) this.x = arena.x + arena.width - this.r;
      if (this.y - this.r < arena.y) this.y = arena.y + this.r;
      if (this.y + this.r > arena.y + arena.height) this.y = arena.y + arena.height - this.r;
    }

    // Overheating smoke when HP <= 10%
    if (this.hp > 0 && this.hp <= this.maxHp * 0.1) {
      if (Math.random() < 0.6) {
        this.smokeParticles.push({
          x: this.x + (Math.random() - 0.5) * 18,
          y: this.y + (Math.random() - 0.5) * 18,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -1 - Math.random() * 1.5,
          life: 20 + Math.random() * 20,
          maxLife: 40,
          size: 4 + Math.random() * 5,
          isDark: true
        });
      }
      if (Math.random() < 0.3) {
        spawnSparks(this.x + (Math.random() - 0.5) * 16, this.y + (Math.random() - 0.5) * 16, 1, 'gold');
      }
    }

    if (this.isBuilding) return;

    // ── SUPPORT & TETHER BEAM SYSTEM ──
    const cfg = CONFIG.Engineer || {};
    const range = cfg.dispenserRange || 260;
    const rangeSq = range * range;
    this.tetheredTargets = [];
    const currentTetheredSet = new Set();
    let newlyEntered = false;

    if (state && state.fighters) {
      const myOwnerIndex = state.fighters.indexOf(this.owner);
      const ownerTeam = (state.mode === '2v2' || state.mode === '1v2 Stand Off') ? state.getFighterTeam(myOwnerIndex) : null;

      for (let i = 0; i < state.fighters.length; i++) {
        const f = state.fighters[i];
        if (!f || f === this || f.hp <= 0) continue;

        const isOwner = (f === this.owner);
        const isTeammate = (ownerTeam !== null && state.getFighterTeam(i) === ownerTeam);

        // Tether to Engineer and teammates (exclude enemy fighters and non-allied entities)
        if ((isOwner || isTeammate) && !f.isTurret && !f.isDispenser && !f.isLawnmower && !f.isUntargetable && !f.untargetable && !f.cannotBeTargeted && f.isTargetable !== false) {
          const dx = f.x - this.x;
          const dy = (f.y - (f.z || 0)) - this.y;
          const distSq = dx * dx + dy * dy;

          if (distSq <= rangeSq) {
            this.tetheredTargets.push(f);
            currentTetheredSet.add(f);
            if (!this._tetheredFighterSet.has(f)) {
              newlyEntered = true;
            }
          }
        }
      }
    }

    // Play sound effect ONCE whenever a fighter enters the radius
    if (newlyEntered) {
      const healSfx = cfg.sounds?.dispenserHeal || 'Assets/Sound Effects/Skills/engineer-sentryreloading.mp3';
      const healVol = cfg.soundVolumes?.dispenserHeal ?? 0.40;
      audioSystem.playSFX(healSfx, healVol);
    }
    this._tetheredFighterSet = currentTetheredSet;

    // Synergy with nearby Sentry Turret: Accelerate reload speed
    if (this.owner && this.owner.turretEntity && this.owner.turretEntity.hp > 0) {
      const turret = this.owner.turretEntity;
      const tDx = turret.x - this.x;
      const tDy = turret.y - this.y;
      if (tDx * tDx + tDy * tDy <= rangeSq) {
        if (turret.isReloading && turret.reloadTimer > 0) {
          // Dispenser provides rapid ammo feed — double reload speed
          turret.reloadTimer--;
        }
      }
    }

    // Periodic healing pulses to tethered targets (visual floating text & sparks only)
    const tickInterval = cfg.dispenserTickInterval || 30;
    this.healTickTimer = (this.healTickTimer || 0) + 1;

    if (this.healTickTimer >= tickInterval) {
      this.healTickTimer = 0;
      const healPerTick = cfg.dispenserHealPerTick || 2;

      for (const target of this.tetheredTargets) {
        if (target.hp < target.maxHp) {
          target.hp = Math.min(target.maxHp, target.hp + healPerTick);
          spawnFloatingText(target.x, (target.y - (target.z || 0)) - target.r - 8, `+${healPerTick}`, '#00FF88');
          spawnSparks(target.x, target.y - (target.z || 0), 3, 'green');
        }
      }
    }
  }

  drawBody(ctx) {
    if (this.hp > 0) {
      drawDispenser(ctx, this);
    }
  }

  draw(ctx) {
    if (this.hp <= 0) return;

    // 1. Draw Tactical Healing Ring Radius (Ground Aura & Boundary Ring)
    drawDispenserHealingRing(ctx, this);

    // 2. Draw animated tether beams to all connected targets
    if (!this.isBuilding && this.tetheredTargets && this.tetheredTargets.length > 0) {
      for (const target of this.tetheredTargets) {
        drawDispenserTetherBeam(ctx, this.x, this.y, target.x, target.y - (target.z || 0), false);
      }
    }

    // Synergy Ammo Tether to nearby Sentry Turret
    if (!this.isBuilding && this.owner && this.owner.turretEntity && this.owner.turretEntity.hp > 0) {
      const turret = this.owner.turretEntity;
      const range = CONFIG.Engineer?.dispenserRange || 260;
      const dist = Math.hypot(turret.x - this.x, turret.y - this.y);
      if (dist <= range) {
        drawDispenserTetherBeam(ctx, this.x, this.y, turret.x, turret.y, true);
      }
    }

    // 2. Draw Dispenser cabinet & components
    drawDispenser(ctx, this);

    // 3. Draw smoke particles (Discrete Pixel Art)
    if (this.smokeParticles && this.smokeParticles.length > 0) {
      for (const p of this.smokeParticles) {
        const alpha = Math.max(0, p.life / p.maxLife) * 0.75;
        ctx.fillStyle = `rgba(30, 32, 40, ${alpha.toFixed(2)})`;
        const px = Math.round(p.x / 2) * 2;
        const py = Math.round(p.y / 2) * 2;
        const ps = Math.max(2, Math.round(p.size / 2) * 2);
        ctx.fillRect(px - ps / 2, py - ps / 2, ps, ps);
      }
    }

    // 4. Heal/repair visual effect (Discrete Pixel Art Green Crosses)
    if (this.healTimer > 0) {
      const t = this.healTimer / 20;
      ctx.save();
      ctx.translate(Math.round(this.x / 2) * 2, Math.round(this.y / 2) * 2);

      const healR = Math.round((this.r * (2.2 - t * 1.0)) / 2) * 2;
      const count = 8;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + (1 - t) * 0.5;
        const hx = Math.round(Math.cos(a) * healR / 2) * 2;
        const hy = Math.round(Math.sin(a) * healR / 2) * 2;
        ctx.fillStyle = `rgba(34, 197, 94, ${(t * 0.9).toFixed(2)})`;
        ctx.fillRect(hx - 1, hy - 3, 2, 6);
        ctx.fillRect(hx - 3, hy - 1, 6, 2);
      }

      ctx.restore();
    }

    this.drawHealth(ctx);
  }

  drawHealth(ctx) {
    if (CONFIG.hudHideOverheadHp || CONFIG.hudHideHpOverlay) return;
    if (this.hp <= 0 || this.isBuilding) return;
    const floatY = (this.y - (this.z || 0)) - this.r - 20;
    drawMinionHealthBar(ctx, this.x, floatY, 38, 6, this.hp, this.maxHp);
  }
}
