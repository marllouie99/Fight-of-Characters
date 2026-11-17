// ─────────────────────────────────────────────────────────────────────────────
// HAJIME KASHIMO FIGHTER ENTITY CLASS
// Jujutsu Kaisen — God of Lightning (Jump Force MUGEN Moveset Port)
// ─────────────────────────────────────────────────────────────────────────────

import { Fighter, applyDamageToTarget } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { state, spawnFloatingText, triggerGlobalScreenShake } from '../../core/state.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { drawFighterInkOutline } from '../../graphics/renderers/fighterOutlineRenderer.js';
import { drawKashimoSkin } from '../../graphics/fighters/kashimoSkin.js';
import {
  drawKashimoAmberAura,
  drawKashimoCounterAura,
  drawKashimoRailgunBeam,
  getKashimoVfxEntries,
  updateKashimoTransientVfx,
  drawKashimoTransientVfx
} from '../../graphics/weapons/kashimoWeaponGraphics.js';

export class KashimoFighter extends Fighter {
  constructor(def) {
    super(def);
    this.characterId = 'kashimo';
    this.type = 'kashimo';
    this.usesCustomHands = true;

    const cfg = CONFIG.kashimo || {};
    this.name = def?.name || cfg.name || 'KASHIMO';
    this.displayName = def?.displayName || cfg.displayName || 'Hajime Kashimo';
    this.themeColor = def?.themeColor || cfg.themeColor || '#38BDF8';
    this.color = this.themeColor;
    this.damageNumberColor = this.themeColor;

    this.hp = def?.hp || cfg.hp || 375;
    this.maxHp = this.hp;
    this.baseMoveSpeed = def?.moveSpeed || cfg.moveSpeed || cfg.speed || 5.5;
    this.moveSpeed = this.baseMoveSpeed;
    this.speed = this.baseMoveSpeed;

    this._initKashimoState(cfg);

    this.skillManager.registerSkills([
      {
        id: 'counter',
        name: cfg.counterSkillName || 'LIGHTNING COUNTER',
        type: 'skill',
        cooldownKey: 'counterCooldown',
        cooldownMax: () => cfg.counterCooldown || 390,
        activeKey: 'isCounterStance',
        color: this.themeColor
      },
      {
        id: 'railgun',
        name: cfg.railgunSkillName || 'SURE-HIT RAILGUN',
        type: 'skill',
        cooldownKey: 'railgunCooldown',
        cooldownMax: () => cfg.railgunCooldown || 450,
        activeKey: 'isFiringRailgun',
        color: this.themeColor
      },
      {
        id: 'amber_form',
        name: cfg.amberSkillName || 'MYTHICAL BEAST AMBER',
        type: 'ultimate',
        cooldownKey: 'amberCooldown',
        cooldownMax: () => cfg.amberCooldown || 1650,
        durationKey: 'amberTimer',
        durationMax: () => cfg.amberDuration || 900,
        activeKey: 'isAmberForm',
        color: this.themeColor,
        isSignature: true,
        isUltimate: true
      }
    ]);
  }

  _cfg() {
    return CONFIG.kashimo || {};
  }

  _initKashimoState(cfg) {
    this.afterImages = [];
    this._kashimoVfx = [];
    this._staticCharges = new WeakMap();
    this.lastChargeCount = 0;

    this.staffCooldown = 0;
    this.teleporteCooldown = 0;
    this.slashSwingTimer = 0;
    this.slashSwingMaxTimer = 16;
    this.slashDir = 1;

    this.counterCooldown = Math.round((cfg.counterCooldown || 390) * 0.35);
    this.isCounterStance = false;
    this.counterStanceTimer = 0;
    this.isPhotonSlicing = false;
    this.photonSliceTimer = 0;
    this.photonSliceAngle = 0;

    this.railgunCooldown = Math.round((cfg.railgunCooldown || 450) * 0.45);
    this.isChargingRailgun = false;
    this.isFiringRailgun = false;
    this.railgunChargeTimer = 0;
    this.railgunFireTimer = 0;
    this.railgunAngle = 0;
    this.railgunHitApplied = false;

    this.amberCooldown = Math.round((cfg.amberCooldown || 1650) * 0.65);
    this.isAmberForm = false;
    this.hasAwakenedAmber = false;
    this.amberTimer = 0;
    this.dodgeCooldown = 0;
  }

  reset() {
    super.reset();
    this._initKashimoState(this._cfg());
  }

  isSkillEnabled(toggleVal, fallback = true) {
    return toggleVal === undefined ? fallback : Boolean(toggleVal);
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
    return true;
  }

  _findClosestEnemy() {
    let best = null;
    let bestDist = Infinity;
    const pool = [];
    if (typeof state !== 'undefined') {
      if (Array.isArray(state.fighters)) pool.push(...state.fighters);
      if (Array.isArray(state.illusions)) pool.push(...state.illusions);
    }
    for (const f of pool) {
      if (!this._isHostile(f)) continue;
      const d = Math.hypot(f.x - this.x, f.y - this.y);
      if (d < bestDist) {
        bestDist = d;
        best = f;
      }
    }
    return best;
  }

  _getEnemyTargets() {
    const out = [];
    if (typeof state !== 'undefined') {
      if (Array.isArray(state.fighters)) {
        for (const f of state.fighters) if (this._isHostile(f)) out.push(f);
      }
      if (Array.isArray(state.illusions)) {
        for (const il of state.illusions) if (this._isHostile(il)) out.push(il);
      }
    }
    return out;
  }

  _pushVfx(fx) {
    if (this._kashimoVfx.length >= 28) this._kashimoVfx.shift();
    this._kashimoVfx.push(fx);
  }

  _playSfx(key, fallbackVol = 0.85) {
    const cfg = this._cfg();
    const src = cfg.sounds?.[key];
    if (src && typeof audioSystem !== 'undefined' && audioSystem.playSFX) {
      audioSystem.playSFX(src, cfg.soundVolumes?.[key] ?? fallbackVol);
    }
  }

  _tickKashimoTimers(cfg) {
    if (this.staffCooldown > 0) this.staffCooldown--;
    if (this.teleporteCooldown > 0) this.teleporteCooldown--;
    if (this.slashSwingTimer > 0) this.slashSwingTimer--;
    if (this.dodgeCooldown > 0) this.dodgeCooldown--;

    if (this.isAmberForm) {
      this.amberTimer--;
      if (this.amberTimer <= 0) {
        this.isAmberForm = false;
        this.moveSpeed = this.baseMoveSpeed;
        this.speed = this.baseMoveSpeed;
      }
    } else if (!this.hasAwakenedAmber && this.isSkillEnabled(cfg.enableAmberForm, true)) {
      const threshold = cfg.amberHpThreshold || 0.45;
      if (this.hp > 0 && (this.hp / Math.max(1, this.maxHp)) <= threshold) {
        this.activateAmberForm(this._findClosestEnemy());
      }
    }
  }

  shoot() {
    // Rule 23: Suppress generic bullet shooting; Kashimo fights with Nyoi Staff & Lightning
  }

  canAim() {
    if (this.isChargingRailgun || this.isFiringRailgun || this.isPhotonSlicing) return false;
    return super.canAim();
  }

  interruptAttacks(forceCancelAll = false) {
    this.isChargingRailgun = false;
    this.isFiringRailgun = false;
    this.isCounterStance = false;
    this.isPhotonSlicing = false;
    if (forceCancelAll) {
      this.slashSwingTimer = 0;
      this._kashimoVfx.length = 0;
    }
  }

  update(opponent, ownerIndex, arena) {
    const currentArena = arena || (typeof state !== 'undefined' ? state.arena : null) || CONFIG.arena;
    const cfg = this._cfg();

    // 0. Rule 25: Decay transient lightning VFX before freeze guard
    updateKashimoTransientVfx(this._kashimoVfx);
    this._updateVisualExplosions?.();
    this._updateVisualEffects?.();

    // 1. Mandatory Rule 1 Freeze & TimeStop Guard
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks(false);
      return;
    }

    this._tickKashimoTimers(cfg);
    const target = (opponent && this._isHostile(opponent)) ? opponent : this._findClosestEnemy();

    // 2. Active skill channels take priority
    if (this.isCounterStance) {
      this._updateCounterStance(target, currentArena);
      super.update(target, ownerIndex, currentArena);
      return;
    }
    if (this.isPhotonSlicing) {
      this._updatePhotonSlice(currentArena);
      super.update(target, ownerIndex, currentArena);
      return;
    }
    if (this.isChargingRailgun || this.isFiringRailgun) {
      this._updateRailgun(currentArena);
      super.update(target, ownerIndex, currentArena);
      return;
    }

    // 3. Skill Decision Matrix
    if (target) {
      const dist = Math.hypot(target.x - this.x, target.y - this.y);
      if (this.isSkillEnabled(cfg.enableAmberForm, true) && !this.isAmberForm && this.amberCooldown <= 0 && dist <= 260) {
        this.activateAmberForm(target);
      } else if (this.isSkillEnabled(cfg.enableRailgun, true) && this.railgunCooldown <= 0 && dist <= 420) {
        this.startRailgun(target);
      } else if (this.isSkillEnabled(cfg.enableCounter, true) && this.counterCooldown <= 0 && dist <= 185) {
        this.startCounterStance();
      } else if (this.isSkillEnabled(cfg.enableStaffCombo, true)) {
        this._updateStaffCombat(target, currentArena);
      }
    }

    super.update(target, ownerIndex, currentArena);
  }

  _updateStaffCombat(target, arena) {
    const cfg = this._cfg();
    const dist = Math.hypot(target.x - this.x, target.y - this.y);

    // MUGEN Statedef 500 Teleporte: warp past/behind P2 and turn to face
    if (dist > 95 && dist < 240 && this.teleporteCooldown <= 0) {
      const ang = Math.atan2(target.y - this.y, target.x - this.x);
      this._pushVfx({ kind: 'shockRing', x: this.x, y: this.y, r: this.r, life: 12, maxLife: 12 });
      const behindDist = dist + this.r + (target.r || 25) + 14;
      const maxStep = Math.max(behindDist, cfg.teleporteDistance || 145);
      const step = Math.min(maxStep, behindDist);
      this.x += Math.cos(ang) * step;
      this.y += Math.sin(ang) * step;
      this._clampToArena(arena);
      this.aim(target);
      this._pushVfx({ kind: 'lightningArc', x: this.x, y: this.y, r: this.r * 1.15, life: 12, maxLife: 12 });
      this._playSfx('teleporte', 0.80);
      this.teleporteCooldown = cfg.teleporteCooldown || 150;
    }

    const reach = cfg.staffReach || 92;
    if (dist <= reach + (target.r || 25) && this.staffCooldown <= 0) {
      this._executeStaffSwing(target);
    }
  }

  _executeStaffSwing(target) {
    const cfg = this._cfg();
    this.aim(target);
    const swingAngle = this.gunAngle || 0;
    this.staffCooldown = cfg.staffCooldown || 24;
    this.slashSwingTimer = 16;
    this.slashSwingMaxTimer = 16;
    this.slashDir *= -1;
    this._playSfx('staffSwing', 0.82);

    const reach = cfg.staffReach || 92;
    const halfArc = ((cfg.staffArcDeg || 135) * Math.PI) / 360;
    const mult = this.isAmberForm ? (cfg.amberDamageMultiplier || 1.30) : 1.0;
    const dmg = Math.round((cfg.staffDamage || 20) * mult);

    for (const enemy of this._getEnemyTargets()) {
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d > reach + (enemy.r || 25)) continue;
      let diff = Math.atan2(dy, dx) - swingAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) <= halfArc) {
        const hitOpts = this.isAmberForm ? { isMelee: true, bypassBlock: true, bypassShield: true } : { isMelee: true };
        const dealt = applyDamageToTarget(enemy, dmg, this, hitOpts);
        if (dealt !== false) {
          this._playSfx('lightningHit', 0.85);
          this._pushVfx({ kind: 'lightningArc', x: enemy.x, y: enemy.y, r: (enemy.r || 25) * 1.1, life: 12, maxLife: 12 });
          const push = 5.5;
          const ang = Math.atan2(dy, dx);
          enemy.vx += Math.cos(ang) * push;
          enemy.vy += Math.sin(ang) * push;
          this._addStaticCharge(enemy, mult);
        }
      }
    }
  }

  _addStaticCharge(enemy, mult = 1.0) {
    const cfg = this._cfg();
    if (!this.isSkillEnabled(cfg.enableStaticCharge, true) || !enemy || enemy.hp <= 0) return;
    const maxStacks = cfg.staticChargeMaxStacks || 3;
    const next = (this._staticCharges.get(enemy) || 0) + 1;
    if (next >= maxStacks) {
      this._staticCharges.set(enemy, 0);
      this.lastChargeCount = 0;
      const boltDmg = Math.round((cfg.staticDischargeDamage || 38) * mult);
      applyDamageToTarget(enemy, boltDmg, this, { isAbility: true, bypassBlock: true });
      if (typeof enemy.applyHitStun === 'function') {
        enemy.applyHitStun(cfg.staticDischargeStunFrames || 26);
      }
      this._pushVfx({ kind: 'thunderPillar', x: enemy.x, y: enemy.y + (enemy.r || 25), w: 96, h: 170, anchorY: 1.0, life: 16, maxLife: 16 });
      this._pushVfx({ kind: 'p2Shock', x: enemy.x, y: enemy.y, r: (enemy.r || 25) * 1.15, life: 16, maxLife: 16 });
      this._pushVfx({ kind: 'shockRing', x: enemy.x, y: enemy.y, r: 55, life: 14, maxLife: 14 });
      this._playSfx('thunderPillar', 0.95);
      triggerGlobalScreenShake(4.2, 10);
      spawnFloatingText(enemy.x, enemy.y - 26, 'DISCHARGE!', '#38BDF8');
    } else {
      this._staticCharges.set(enemy, next);
      this.lastChargeCount = next;
    }
  }

  // ── Skill 1: Counter ("You Know What?") -> Fallback Photon Slicer ──
  startCounterStance() {
    const cfg = this._cfg();
    this.isCounterStance = true;
    this.counterStanceTimer = cfg.counterStanceFrames || 42;
    this.counterCooldown = cfg.counterCooldown || 390;
    this.vx = 0;
    this.vy = 0;
  }

  _updateCounterStance(target, arena) {
    this.vx = 0;
    this.vy = 0;
    this.counterStanceTimer--;
    if (this.counterStanceTimer <= 0) {
      this.isCounterStance = false;
      if (target) {
        this.aim(target);
        this.photonSliceAngle = Math.atan2(target.y - this.y, target.x - this.x);
      } else {
        this.photonSliceAngle = this.gunAngle || 0;
      }
      this.isPhotonSlicing = true;
      this.photonSliceTimer = 12;
      this._pushVfx({ kind: 'shockRing', x: this.x, y: this.y, r: this.r * 1.15, life: 12, maxLife: 12 });
      this._pushVfx({ kind: 'lightningArc', x: this.x, y: this.y, r: this.r * 1.25, angle: this.photonSliceAngle, life: 12, maxLife: 12 });
      this._playSfx('teleporte', 0.85);
    }
  }

  _updatePhotonSlice(arena) {
    const cfg = this._cfg();
    this.gunAngle = this.photonSliceAngle;
    this.angle = this.photonSliceAngle;
    this.x += Math.cos(this.photonSliceAngle) * 14;
    this.y += Math.sin(this.photonSliceAngle) * 14;
    this._clampToArena(arena);
    this.photonSliceTimer--;

    if (this.photonSliceTimer % 3 === 0) {
      this._pushVfx({ kind: 'lightningArc', x: this.x, y: this.y, r: this.r * 1.05, angle: this.photonSliceAngle, life: 10, maxLife: 10 });
    }

    for (const enemy of this._getEnemyTargets()) {
      if (Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.r + (enemy.r || 25) + 18) {
        const mult = this.isAmberForm ? (cfg.amberDamageMultiplier || 1.30) : 1.0;
        const dmg = Math.round((cfg.photonSlicerDamage || 32) * mult);
        applyDamageToTarget(enemy, dmg, this, { isAbility: true, bypassBlock: this.isAmberForm });
        this._pushVfx({ kind: 'lightningArc', x: enemy.x, y: enemy.y, r: 44, life: 14, maxLife: 14 });
        this._pushVfx({ kind: 'p2Shock', x: enemy.x, y: enemy.y, r: (enemy.r || 25) * 1.15, life: 14, maxLife: 14 });
        this._pushVfx({ kind: 'shockRing', x: enemy.x, y: enemy.y, r: 52, life: 12, maxLife: 12 });
        this._playSfx('lightningHit', 0.90);
        this.isPhotonSlicing = false;
        return;
      }
    }
    if (this.photonSliceTimer <= 0) {
      this.isPhotonSlicing = false;
    }
  }

  takeDamage(amount, attacker, opts = {}) {
    const cfg = this._cfg();
    const isBeamOrTick = Boolean(opts.isBeam || opts.isContinuous || opts.isPeriodic || opts.isDPS || opts.undodgeable || opts.isSureKill);

    if (this.isCounterStance && !isBeamOrTick && attacker && attacker !== this && attacker.hp > 0) {
      this.isCounterStance = false;
      // Departure teleport VFX at original position before blinking to attacker
      this._pushVfx({ kind: 'shockRing', x: this.x, y: this.y, r: this.r * 1.1, life: 12, maxLife: 12 });
      this._pushVfx({ kind: 'lightningArc', x: this.x, y: this.y, r: this.r * 1.2, life: 12, maxLife: 12 });
      const angToAttacker = Math.atan2(attacker.y - this.y, attacker.x - this.x);
      this.x = attacker.x - Math.cos(angToAttacker) * (this.r + (attacker.r || 25) + 8);
      this.y = attacker.y - Math.sin(angToAttacker) * (this.r + (attacker.r || 25) + 8);
      this.aim(attacker);
      const mult = this.isAmberForm ? (cfg.amberDamageMultiplier || 1.30) : 1.0;
      const dmg = Math.round((cfg.counterPunishDamage || 46) * mult);
      applyDamageToTarget(attacker, dmg, this, { isAbility: true, bypassBlock: true });
      if (typeof attacker.applyHitStun === 'function') attacker.applyHitStun(cfg.counterStunFrames || 34);
      this._pushVfx({ kind: 'counterWave', x: attacker.x, y: attacker.y + (attacker.r || 25) * 0.4, w: 120, h: 120, anchorY: 0.78, life: 16, maxLife: 16 });
      this._pushVfx({ kind: 'p2Shock', x: attacker.x, y: attacker.y, r: (attacker.r || 25) * 1.25, life: 16, maxLife: 16 });
      this._pushVfx({ kind: 'shockRing', x: attacker.x, y: attacker.y, r: 65, life: 14, maxLife: 14 });
      this._playSfx('counterTrigger', 0.92);
      triggerGlobalScreenShake(4.8, 12);
      spawnFloatingText(this.x, this.y - 26, 'COUNTER!', '#38BDF8');
      return false;
    }

    // Autonomous lightning evade
    if (!isBeamOrTick && this.timeStopTimer <= 0 && !this.isChargingRailgun && !this.isFiringRailgun && this.isSkillEnabled(cfg.enableDodge, true) && this.dodgeCooldown <= 0) {
      const chance = this.isAmberForm ? (cfg.amberDodgeChance || 0.75) : (cfg.dodgeChance || 0.55);
      if (Math.random() <= chance) {
        const ang = (attacker ? Math.atan2(this.y - attacker.y, this.x - attacker.x) : 0) + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
        this._pushVfx({ kind: 'shockRing', x: this.x, y: this.y, r: this.r, life: 10, maxLife: 10 });
        this.x += Math.cos(ang) * (cfg.dodgeDistance || 110);
        this.y += Math.sin(ang) * (cfg.dodgeDistance || 110);
        this._clampToArena(state.arena || CONFIG.arena);
        this._pushVfx({ kind: 'lightningArc', x: this.x, y: this.y, r: this.r * 1.15, life: 10, maxLife: 10 });
        this._playSfx('teleporte', 0.78);
        this.dodgeCooldown = cfg.dodgeCooldown || 22;
        spawnFloatingText(this.x, this.y - 20, 'MISS', '#7CE8FF');
        return false;
      }
    }

    const finalDmg = this.isAmberForm ? Math.max(1, Math.round(amount * (1 - (cfg.amberDamageReduction || 0.15)))) : amount;
    return super.takeDamage(finalDmg, attacker, opts);
  }

  // ── Skill 2: Sure-Hit Lightning Railgun (Statedef 2000 -> 2010 / 1420) ──
  startRailgun(target) {
    const cfg = this._cfg();
    this.isChargingRailgun = true;
    this.isFiringRailgun = false;
    this.railgunChargeTimer = cfg.railgunChargeFrames || 20;
    this.railgunCooldown = cfg.railgunCooldown || 450;
    this.railgunAngle = Math.atan2(target.y - this.y, target.x - this.x);
    this.gunAngle = this.railgunAngle;
    this.angle = this.railgunAngle;
    this.railgunHitApplied = false;
    // MUGEN Statedef 2000 !AnimElemTime(1): PlaySnd S211,0 + lightning charge sparks
    this._playSfx('railgunCharge', 0.88);
    this._pushVfx({ kind: 'lightningArc', x: this.x, y: this.y, r: this.r * 1.35, life: 12, maxLife: 12 });
  }

  _updateRailgun(arena) {
    const cfg = this._cfg();
    this.gunAngle = this.railgunAngle;
    this.angle = this.railgunAngle;
    this.vx = 0;
    this.vy = 0;

    if (this.isChargingRailgun) {
      this.railgunChargeTimer--;
      if (this.railgunChargeTimer === 10) {
        this._playSfx('lightningHit', 0.65);
        this._pushVfx({ kind: 'lightningArc', x: this.x, y: this.y, r: this.r * 1.45, life: 10, maxLife: 10 });
      }
      if (this.railgunChargeTimer <= 0) {
        this.isChargingRailgun = false;
        this.isFiringRailgun = true;
        this.railgunFireTimer = cfg.railgunFireFrames || 18;
        // MUGEN Statedef 2000 !AnimElemTime(7) + Helper 2010: PlaySnd S201,1 + S211,0
        this._playSfx('railgun', 0.95);
        this._playSfx('railgunCharge', 0.85);
        triggerGlobalScreenShake(5.0, 12);
      }
      return;
    }

    if (this.isFiringRailgun) {
      if (!this.railgunHitApplied) {
        this.railgunHitApplied = true;
        const beamW = cfg.railgunWidth || 56;
        const mult = this.isAmberForm ? (cfg.amberDamageMultiplier || 1.30) : 1.0;
        const dmg = Math.round((cfg.railgunDamage || 52) * mult);
        const pillarDmg = Math.round((cfg.thunderPillarDamage || 26) * mult);
        let hitAny = false;

        for (const enemy of this._getEnemyTargets()) {
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const along = dx * Math.cos(this.railgunAngle) + dy * Math.sin(this.railgunAngle);
          const perp = Math.abs(-dx * Math.sin(this.railgunAngle) + dy * Math.cos(this.railgunAngle));
          if (along > 0 && along <= 540 && perp <= beamW * 0.5 + (enemy.r || 25)) {
            const dealt = applyDamageToTarget(enemy, dmg + pillarDmg, this, { isBeam: true, isAbility: true, bypassBlock: this.isAmberForm });
            if (dealt !== false) hitAny = true;
            this._pushVfx({ kind: 'thunderDome', x: enemy.x, y: enemy.y + (enemy.r || 25), w: 124, h: 112, anchorY: 0.9, life: 16, maxLife: 16 });
            this._pushVfx({ kind: 'thunderPillar', x: enemy.x, y: enemy.y + (enemy.r || 25), w: 96, h: 170, anchorY: 1.0, life: 16, maxLife: 16 });
            this._pushVfx({ kind: 'p2Shock', x: enemy.x, y: enemy.y, r: (enemy.r || 25) * 1.2, life: 16, maxLife: 16 });
          }
        }
        if (hitAny) {
          this._playSfx('thunderPillar', 0.92);
        }
      }
      this.railgunFireTimer--;
      if (this.railgunFireTimer <= 0) {
        this.isFiringRailgun = false;
      }
    }
  }

  // ── Ultimate: Mythical Beast Amber + Sphere of Destruction (var(3)=1 + Supers St 3000/3015/32010) ──
  activateAmberForm(target) {
    const cfg = this._cfg();
    this.isAmberForm = true;
    this.hasAwakenedAmber = true;
    this.amberTimer = cfg.amberDuration || 900;
    this.amberCooldown = cfg.amberCooldown || 1650;
    this.moveSpeed = this.baseMoveSpeed * (cfg.amberSpeedMultiplier || 1.35);
    this.speed = this.moveSpeed;

    this._playSfx('amberTransform', 0.98);
    this._playSfx('sphereBoom', 0.96);
    triggerGlobalScreenShake(6.5, 18);

    const sphereR = cfg.sphereRadius || 115;
    const dmg = (cfg.sphereDamage || 58) + (cfg.amberShockDamage || 25);
    // Hajime Supers St 3015 Anim 3060 (grp 712) Thunder Dome + Shock Ring
    this._pushVfx({ kind: 'thunderDome', x: this.x, y: this.y + this.r, w: sphereR * 2.1, h: sphereR * 1.9, anchorY: 0.85, life: 20, maxLife: 20 });
    this._pushVfx({ kind: 'shockRing', x: this.x, y: this.y, r: sphereR, life: 18, maxLife: 18 });

    for (const enemy of this._getEnemyTargets()) {
      const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (d <= sphereR + (enemy.r || 25)) {
        // St 32010 is movetype=H LifeAdd -50 damage + Electricidad en P2 (St 3210 grp 216)
        applyDamageToTarget(enemy, dmg, this, { isExplosion: true, isUltimate: true, bypassBlock: true });
        if (typeof enemy.applyHitStun === 'function') enemy.applyHitStun(24);
        this._pushVfx({ kind: 'p2Shock', x: enemy.x, y: enemy.y, r: (enemy.r || 25) * 1.25, life: 18, maxLife: 18 });
        const ang = Math.atan2(enemy.y - this.y, enemy.x - this.x);
        enemy.vx += Math.cos(ang) * 10;
        enemy.vy += Math.sin(ang) * 10;
      }
    }
    spawnFloatingText(this.x, this.y - 30, 'MYTHICAL BEAST AMBER!', '#C084FC');
  }

  prewarmAssets(ctx) {
    const entries = getKashimoVfxEntries();
    if (ctx && typeof ctx.drawImage === 'function') {
      for (const e of entries) {
        if (e && e.loaded && e.img && e.img.naturalWidth > 0) {
          ctx.drawImage(e.img, 0, 0, 1, 1, 0, 0, 1, 1);
        }
      }
    }
    return entries.length;
  }

  _clampToArena(arena) {
    if (!arena) return;
    const m = this.r + 4;
    this.x = Math.max(arena.x + m, Math.min(arena.x + arena.width - m, this.x));
    this.y = Math.max(arena.y + m, Math.min(arena.y + arena.height - m, this.y));
  }

  // ─── Rendering Pipeline (Rule 21 & Rule 32) ───
  drawBody(ctx) {
    drawKashimoSkin(ctx, this);
  }

  drawGun() {
    // Intentionally empty: Nyoi Staff renders inside kashimoSkin.js (Rule 20)
  }

  draw(ctx, opponent) {
    if (this.hp <= 0) return;

    if (!this._isPreview) {
      drawFighterInkOutline(ctx, this);
    }

    this.drawBody(ctx);

    if (!this._isSilhouettePass) {
      if (this.isCounterStance) {
        drawKashimoCounterAura(ctx, this.x, this.y, this.r, 0.92);
      }
      if (this.isAmberForm) {
        drawKashimoAmberAura(ctx, this.x, this.y, this.r, 0.94);
      }
      if (this.isFiringRailgun) {
        const ang = this.railgunAngle || 0;
        const startX = this.x + Math.cos(ang) * (this.r * 0.55);
        const startY = this.y + Math.sin(ang) * (this.r * 0.55);
        drawKashimoRailgunBeam(ctx, startX, startY, ang, 540, this._cfg().railgunWidth || 56);
      }
      if (this._kashimoVfx.length > 0) {
        drawKashimoTransientVfx(ctx, this._kashimoVfx);
      }
    }

    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }
}
