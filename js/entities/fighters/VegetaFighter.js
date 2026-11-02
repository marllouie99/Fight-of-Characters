// ─────────────────────────────────────────────
// VEGETA FIGHTER ENTITY CLASS
// Dragon Ball Series
// ─────────────────────────────────────────────
// • Hybrid Martial Arts Engine: Z-Vanish Gap-Closer -> 3-Hit Beatdown Flurry -> Backstep & Ki Volley
// • Autonomous Z-Vanish Afterimage Dodge (Saitama & Sans Standard)
// • Super Saiyan Transformation Multiplier Buff (x1.35 DMG, x1.30 SPD, 20% DR, 95% Dodge, Armor Re-arm)
// • Passives: Royal Saiyan Pride (Damage Scaling at low HP) & Royal Battle Armor Carapace (50 HP shield)
// • Skills: Big Bang Attack (Skill 1), Galick Gun (Skill 2), Final Flash (Ultimate)
// • Rule 1, 18, 19, 20, 21, 23, 24, 25, 26, 30, 31, 32 Compliant
// ─────────────────────────────────────────────

import { Fighter, applyDamageToTarget } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { state, isGlobalHitPauseActive, spawnFloatingText, triggerGlobalScreenShake } from '../../core/state.js';
import { MODE_SETTINGS } from '../../core/modeConfig.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { vegetaConfig } from '../../configs/characters/vegetaConfig.js';
import { drawVegetaSkin, drawVegetaGhostSkin } from '../../graphics/fighters/vegetaSkin.js';
import { spawnImpactFlash, spawnSparks, spawnMeleeClashShockwave } from '../../graphics/particles/sparkEffect.js';

export class VegetaFighter extends Fighter {
  constructor(def) {
    super(def);
    this.characterId = 'vegeta';
    this.type = 'vegeta';

    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.vegeta) ? CONFIG.vegeta : vegetaConfig;
    this._cfg = cfg;

    // Baseline Attributes
    this.name = def?.name || cfg.name || 'VEGETA';
    this.displayName = def?.displayName || cfg.displayName || 'Vegeta';
    this.color = cfg.color || '#1565C0';
    this.themeColor = cfg.themeColor || '#1565C0';
    this.damageNumberColor = '#00E5FF';

    const sizeMult = CONFIG.globalFighter?.sizeMultiplier ?? 1.0;
    const internalScale = CONFIG.internalScale ?? 1.0;
    const baseRadius = def.radius || cfg.radius || 25;
    this.r = baseRadius * sizeMult * internalScale;

    const modeFixed = (typeof state !== 'undefined' && state?.mode && typeof MODE_SETTINGS !== 'undefined' && MODE_SETTINGS[state.mode])
      ? (MODE_SETTINGS[state.mode].fixedHp || MODE_SETTINGS[state.mode].playerFixedHp || MODE_SETTINGS[state.mode].soloFixedHp)
      : null;
    this.hp = modeFixed || cfg.hp || 390;
    this.maxHp = this.hp;
    this.baseMoveSpeed = cfg.moveSpeed || 5.4;
    this.moveSpeed = this.baseMoveSpeed;
    this.speed = this.baseMoveSpeed;

    // Martial Arts / Brawler Stance
    this.isMeleeFighter = true;
    this.isMeleeMode = true;
    this.isBrawler = true;
    this.meleeReach = cfg.meleeReach || 66;

    // ─── Passive 2: Royal Battle Armor Carapace ───
    this.armorShield = cfg.armorShieldMax || 50;
    this.maxArmorShield = cfg.armorShieldMax || 50;
    this.timeSinceLastDamage = 0;

    // ─── Basic Attack: Hybrid Martial Arts & Follow-Up Ki Volley Engine ───
    this.basicComboPhase = 0;           // 0: Idle, 1: Step-In, 2: Beatdown Flurry, 3: Ki Volley
    this.meleeModeDurationTimer = 0;    // Active Melee Mode brawling duration timer (frames)
    this.meleeHitIndex = 0;             // 0: Gut Strike, 1: Elbow Fracture, 2: Roundhouse, 3: Ridge Hand
    this.meleePunchCooldown = 0;        // Cadence between strikes
    this.basicAttackCooldownTimer = 0;  // Reset delay between full combo strings
    this.isPunching = false;
    this.isRightPunch = true;
    this.punchAnimTimer = 0;
    this.punchMaxTime = cfg.meleePunchAnimDuration || 10;
    this.meleeClashCooldown = 0;
    this.kiVolleyCount = 0;
    this.kiVolleyTimer = 0;
    this.activeKiBlasts = [];

    // ─── Z-Vanish Afterimage Dodge Mechanic (Saitama & Sans Standard) ───
    this.dodgeCooldown = 0;
    this.afterImages = [];
    this._dodgedVolleyIds = new Set();
    this._lastShotgunDodgeFrame = 0;
    this._shotgunDodgeGraceTimer = 0;
    this._lastShotgunDodgeAttacker = null;

    // ─── Super Saiyan Transformation ───
    this.isSuperSaiyan = false;
    this.hasAwakenedSuperSaiyan = false;
    this.superSaiyanTimer = 0;
    this.superSaiyanDuration = cfg.superSaiyanDuration || 900;
    this.auraParticles = [];

    // ─── Skill 1: Big Bang Attack ───
    this.bigBangCooldown = cfg.bigBangCooldown || 450;
    this.isChargingBigBang = false;
    this.bigBangChargeTimer = 0;
    this.activeBigBangMissiles = [];

    // ─── Skill 2: Galick Gun ───
    this.galickGunCooldown = cfg.galickGunCooldown || 420;
    this.isChargingGalickGun = false;
    this.isFiringGalickGun = false;
    this.galickGunChargeTimer = 0;
    this.galickGunFireTimer = 0;
    this.galickGunAngle = 0;

    // ─── Ultimate: Final Flash ───
    this.finalFlashCooldown = cfg.finalFlashCooldown || 1920;
    this.isChargingFinalFlash = false;
    this.isFiringFinalFlash = false;
    this.finalFlashChargeTimer = 0;
    this.finalFlashFireTimer = 0;
    this.finalFlashAngle = 0;
    this.finalFlashTickTimer = 0;
    this.finalFlashTicksFired = 0;

    // General transient visual effects (Rule 25)
    this.activeVisualEffects = [];
    this.activeVisualExplosions = [];

    this._registerSkills();
  }

  _registerSkills() {
    const cfg = this._cfg || vegetaConfig;
    const skills = [];

    if (this.isSkillEnabled(cfg.enableFinalFlash, true)) {
      skills.push({
        id: 'final_flash',
        name: 'FINAL FLASH',
        type: 'ultimate',
        cooldownKey: 'finalFlashCooldown',
        cooldownMax: cfg.finalFlashCooldown || 1920,
        channelingKey: 'isChargingFinalFlash',
        activeKey: 'isFiringFinalFlash',
        isSignature: true,
        signature: true,
        isUltimate: true
      });
    }

    if (this.isSkillEnabled(cfg.enableBigBang, true)) {
      skills.push({
        id: 'big_bang',
        name: 'BIG BANG ATTACK',
        type: 'offensive',
        cooldownKey: 'bigBangCooldown',
        cooldownMax: cfg.bigBangCooldown || 450,
        channelingKey: 'isChargingBigBang'
      });
    }

    if (this.isSkillEnabled(cfg.enableGalickGun, true)) {
      skills.push({
        id: 'galick_gun',
        name: 'GALICK GUN',
        type: 'offensive',
        cooldownKey: 'galickGunCooldown',
        cooldownMax: cfg.galickGunCooldown || 420,
        channelingKey: 'isChargingGalickGun',
        activeKey: 'isFiringGalickGun'
      });
    }

    if (this.isSkillEnabled(cfg.enableSuperSaiyan, true)) {
      skills.push({
        id: 'super_saiyan',
        name: 'SUPER SAIYAN',
        type: 'buff',
        activeKey: 'isSuperSaiyan',
        durationKey: 'superSaiyanTimer',
        durationMax: cfg.superSaiyanDuration || 900
      });
    }

    if (skills.length > 0) {
      this.skillManager.registerSkills(skills);
    }
  }

  /**
   * Overrides base Fighter.shoot() to suppress default generic bullet projectiles (Rule 23).
   */
  shoot(ownerIndex) {
    // Intentionally empty: Vegeta uses dedicated hybrid martial arts combo and Ki blast volley
  }

  /**
   * Universal Aim Guard: Locks aim during committed skills.
   */
  canAim() {
    if (this.isChargingFinalFlash || this.isFiringFinalFlash || this.isChargingGalickGun || this.isFiringGalickGun || this.isChargingBigBang) {
      return false;
    }
    return super.canAim();
  }

  /**
   * Distinct Skill Channeling State.
   * Isolates Final Flash / Galick Gun beam turning inertia (turnRate = 0.045) from Melee Mode CQC flurries.
   */
  isChannelingSkill() {
    return Boolean(
      this.isChargingFinalFlash ||
      this.isFiringFinalFlash ||
      this.isChargingGalickGun ||
      this.isFiringGalickGun ||
      this.isChargingBigBang
    );
  }

  /**
   * Instant Angle Snapping Aim Engine.
   * In Melee Mode (Phase 1, 2, or 3), Vegeta achieves instant 0-frame angular lock onto the enemy,
   * completely bypassing turn rate delays, stealth penalties, and channel inertia (matching Gojo/Sukuna standard).
   */
  aim(opponent) {
    if (this.basicComboPhase === 1 || this.basicComboPhase === 2 || this.basicComboPhase === 3) {
      if (!opponent || opponent.hp <= 0) return false;
      const targetZ = opponent.z || 0;
      const myZ = this.z || 0;
      let targetX = opponent.x;
      let targetY = opponent.y;
      if (opponent.type === 'musashi' && opponent.flurryHitsLeft > 0 && opponent.flurryGhost) {
        targetX = opponent.flurryGhost.x;
        targetY = opponent.flurryGhost.y;
      }
      const snapAngle = Math.atan2((targetY - targetZ) - (this.y - myZ), targetX - this.x);
      this.gunAngle = snapAngle;
      this.angle = snapAngle;
      return true;
    }
    return super.aim(opponent);
  }

  isStationarySkillActive() {
    return Boolean(
      this.isChargingFinalFlash ||
      this.isFiringFinalFlash ||
      this.isChargingGalickGun ||
      this.isFiringGalickGun ||
      this.isChargingBigBang ||
      (this.basicComboPhase === 2) ||
      (this.basicComboPhase === 3) ||
      super.isStationarySkillActive?.()
    );
  }

  /**
   * Main Fighter Update Loop
   */
  update(opponent, ownerIndex, arena) {
    const currentArena = arena || (typeof state !== 'undefined' ? state.arena : null) || CONFIG.arena;

    // 0. Rule 25: Non-freezing active visual effects & particle decay before freeze guard
    this._updateVisualExplosions();
    this._updateVisualEffects();
    this._updateKiBlasts(currentArena);
    this._updateBigBangMissiles(currentArena, opponent);
    this._updateAfterimages();
    this._updateAuraParticles();

    // 1. Mandatory Rule 1 Freeze & TimeStop Guard
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks();
      return;
    }

    // 2. Cooldown decrements & Armor Recharge
    this._decrementCooldowns();
    this._updateArmorRecharge();

    // 3. Super Saiyan Awakening & State Check
    this._updateSuperSaiyanState();

    // 4. Committed Ultimate / Skill Processing
    if (this._updateSkills(opponent, ownerIndex, currentArena)) {
      this.applyMovementPhysics(0);
      return;
    }

    // 5. Basic Attack Hybrid Martial Arts & Follow-up Ki Volley Pipeline
    this._updateBasicHybridCombo(opponent, ownerIndex, currentArena);

    // 6. Movement & Wall Physics (Clamp velocity during active Melee Flurry or Ki Volley)
    if (this.basicComboPhase === 2 || this.basicComboPhase === 3) {
      this.vx = 0;
      this.vy = 0;
      this.applyMovementPhysics(0);
      return;
    }

    const speedMult = this.isSuperSaiyan ? (this._cfg.superSaiyanSpeedMultiplier || 1.30) : 1.0;
    this.applyMovementPhysics(speedMult);
    this.resolveWallBounce(currentArena, opponent);
  }

  interruptAttacks(forceCancelAll = false) {
    super.interruptAttacks?.(forceCancelAll);
    if (forceCancelAll) {
      this.basicComboPhase = 0;
      this.meleeModeDurationTimer = 0;
      this.isChargingFinalFlash = false;
      this.isFiringFinalFlash = false;
      this.isGalickGunActive = false;
    }
  }

  // ─── Cooldown Processing ───
  _decrementCooldowns() {
    if (this.dodgeCooldown > 0) this.dodgeCooldown--;
    if (this.basicAttackCooldownTimer > 0) this.basicAttackCooldownTimer--;
    if (this.meleePunchCooldown > 0) this.meleePunchCooldown--;
    if (this.meleeClashCooldown > 0) this.meleeClashCooldown--;
    if (this.bigBangCooldown > 0) this.bigBangCooldown--;
    if (this.galickGunCooldown > 0) this.galickGunCooldown--;
    if (this.finalFlashCooldown > 0) this.finalFlashCooldown--;
    if (this.punchAnimTimer > 0) this.punchAnimTimer--;
    if (this._shotgunDodgeGraceTimer > 0) this._shotgunDodgeGraceTimer--;
    this.timeSinceLastDamage++;
  }

  // ─── Passive 2: Royal Battle Armor Recharge ───
  _updateArmorRecharge() {
    const cfg = this._cfg;
    if (!this.isSkillEnabled(cfg.enableBattleArmor, true)) return;
    const rechargeDelay = cfg.armorRechargeDelayFrames || 360;

    if (this.timeSinceLastDamage >= rechargeDelay && this.armorShield < this.maxArmorShield) {
      this.armorShield = this.maxArmorShield;
      this._healthBarHealTimer = 16;
    }
  }

  // ─── Super Saiyan Transformation Mechanics ───
  _updateSuperSaiyanState() {
    const cfg = this._cfg;
    if (!this.isSkillEnabled(cfg.enableSuperSaiyan, true)) return;

    // Royal Saiyan Pride Awakening Trigger at <= 40% HP
    const hpRatio = this.hp / this.maxHp;
    const threshold = cfg.superSaiyanHpThreshold || 0.40;

    if (!this.hasAwakenedSuperSaiyan && hpRatio <= threshold && this.hp > 0) {
      this.activateSuperSaiyan();
    }

    if (this.isSuperSaiyan) {
      this.superSaiyanTimer--;
      if (this.superSaiyanTimer <= 0) {
        this.isSuperSaiyan = false;
        this.moveSpeed = this.baseMoveSpeed;
        this.speed = this.baseMoveSpeed;
      }
    }
  }

  activateSuperSaiyan() {
    const cfg = this._cfg;
    this.isSuperSaiyan = true;
    this.hasAwakenedSuperSaiyan = true;
    this.superSaiyanTimer = cfg.superSaiyanDuration || 900;
    this.moveSpeed = this.baseMoveSpeed * (cfg.superSaiyanSpeedMultiplier || 1.30);
    this.speed = this.moveSpeed;

    // Full Armor Re-Arm
    this.armorShield = this.maxArmorShield;

    // CC Cleanse
    this.interruptAttacks(false);
    this.timeStopTimer = 0;
    this.hitStunTimer = 0;

    // Awakening Eruption & Screen Rumble
    triggerGlobalScreenShake(6.0, 24);
    this._playAudio('transform', cfg.sounds?.transform, cfg.soundVolumes?.transform || 0.95);
    this._playAudio('roar', cfg.sounds?.roar, cfg.soundVolumes?.roar || 0.85);

    // Golden-Violet Shockwave
    this._spawnRadialShockwave(this.x, this.y, 80, '#7C4DFF', 20);

    // Healthbar Pulse (Rule 27)
    this._healthBarHealTimer = 16;
  }

  getDamageMultiplier() {
    const cfg = this._cfg;
    let mult = this.isSuperSaiyan ? (cfg.superSaiyanDmgMultiplier || 1.35) : 1.0;

    // Passive 1: Royal Saiyan Pride (+5% per 10% missing HP below 70%)
    if (this.isSkillEnabled(cfg.enableRoyalPride, true)) {
      const missingPct = Math.max(0, 0.70 - (this.hp / this.maxHp));
      const steps = Math.floor(missingPct / 0.10);
      const prideBonus = Math.min(cfg.maxPrideDamageBonus || 0.35, steps * (cfg.prideDamageScalePer10Hp || 0.05));
      mult += prideBonus;
    }
    return mult;
  }

  // ─── Basic Attack: Hybrid Martial Arts & Follow-Up Ki Volley Engine ───
  _updateBasicHybridCombo(opponent, ownerIndex, arena) {
    if (!opponent || opponent.hp <= 0) {
      this.basicComboPhase = 0;
      return;
    }

    const cfg = this._cfg;
    const dist = Math.hypot(opponent.x - this.x, opponent.y - this.y);

    // Phase 0: Check for Gap-Closer Initiation
    if (this.basicComboPhase === 0) {
      if (this.basicAttackCooldownTimer <= 0 && dist <= (cfg.meleeGapCloseRange || 150)) {
        this.basicComboPhase = 1;
        return;
      } else {
        // Natural pursuit
        this.aim(opponent);
        return;
      }
    }

    // Phase 1: Z-Vanish Gap-Closer Step-In
    if (this.basicComboPhase === 1) {
      this._spawnAfterimage();
      this._playAudio('dodge', cfg.sounds?.dodge, cfg.soundVolumes?.dodge || 0.80);

      // Flash-step directly to 40px melee striking distance
      const strikeAngle = Math.atan2(this.y - opponent.y, this.x - opponent.x);
      const targetDist = (opponent.r || 25) + this.r + 6;
      this.x = opponent.x + Math.cos(strikeAngle) * targetDist;
      this.y = opponent.y + Math.sin(strikeAngle) * targetDist;
      this._clampToArena(arena);

      // Instant 0-frame angle snap facing opponent
      const targetZ = opponent.z || 0;
      const myZ = this.z || 0;
      const snapAngle = Math.atan2((opponent.y - targetZ) - (this.y - myZ), opponent.x - this.x);
      this.gunAngle = snapAngle;
      this.angle = snapAngle;
      this.aim(opponent);

      if (typeof opponent.aim === 'function' && !opponent.isTargetOfAmbush && (opponent.timeStopTimer || 0) <= 0) {
        const oppAngle = Math.atan2((this.y - myZ) - (opponent.y - targetZ), this.x - opponent.x);
        opponent.gunAngle = oppAngle;
        opponent.angle = oppAngle;
        opponent.aim(this);
      }

      this.basicComboPhase = 2;
      this.meleeModeDurationTimer = cfg.initialMeleeDuration || 120;
      this.meleeHitIndex = 0;
      this.meleePunchCooldown = 0;
      return;
    }

    // Phase 2: Continuous Royal Saiyan Beatdown Flurry Across 8 Surround Angles
    if (this.basicComboPhase === 2) {
      this.aim(opponent);
      if (this.meleeModeDurationTimer > 0) {
        this.meleeModeDurationTimer--;
      }

      if (this.meleePunchCooldown > 0) return;

      this._executeMeleeStrike(opponent, arena);
      return;
    }

    // Phase 3: Follow-Up Rapid Ki Volley (Renzoku Ki Dān)
    if (this.basicComboPhase === 3) {
      this.aim(opponent);
      this.kiVolleyTimer--;

      if (this.kiVolleyTimer <= 0 && this.kiVolleyCount < (cfg.followUpKiCount || 8)) {
        this._fireKiBlast(opponent);
        this.kiVolleyCount++;
        this.kiVolleyTimer = 4;
      }

      if (this.kiVolleyCount >= (cfg.followUpKiCount || 8) && this.kiVolleyTimer <= 0) {
        this.basicComboPhase = 0;
        this.basicAttackCooldownTimer = cfg.meleeModeSeparationCooldown || cfg.basicAttackResetCooldown || 180;
      }
    }
  }

  _executeMeleeStrike(opponent, arena) {
    const cfg = this._cfg;
    const dmgMult = this.getDamageMultiplier();
    const baseCadence = this.isSuperSaiyan ? 12 : (cfg.meleePunchCooldown || 15);

    // Punch-Teleport-Punch: Flash-teleport to a new surround angle around the opponent before EVERY punch!
    this._teleportToMeleeAngle(opponent, arena);

    // Instant snap auto-aim to exact punch trajectory facing enemy (Gojo/Sukuna standard)
    const targetZ = (opponent && opponent.z) || 0;
    const myZ = this.z || 0;
    const punchAngle = (opponent && !opponent.isDead)
      ? Math.atan2((opponent.y - targetZ) - (this.y - myZ), opponent.x - this.x)
      : (this.gunAngle !== undefined ? this.gunAngle : (this.angle || 0));
    this.gunAngle = punchAngle;
    this.angle = punchAngle;

    this.isRightPunch = !this.isRightPunch;
    this.punchAnimTimer = cfg.meleePunchAnimDuration || 10;
    this.punchMaxTime = cfg.meleePunchAnimDuration || 10;
    this.meleePunchCooldown = baseCadence;

    // Check Brawler Clash
    const isBrawlerOpponent = opponent && (opponent.isBrawler || opponent.isMeleeMode || opponent.characterId === 'goku' || opponent.characterId === 'sukuna' || opponent.characterId === 'saitama');
    if (isBrawlerOpponent && this.meleeClashCooldown <= 0 && Math.hypot(opponent.x - this.x, opponent.y - this.y) <= (this.r + (opponent.r || 25) + 20)) {
      this.meleeClashCooldown = cfg.meleeClashCooldown || 25;
      spawnMeleeClashShockwave((this.x + opponent.x) / 2, (this.y + opponent.y) / 2, '#7C4DFF');
      triggerGlobalScreenShake(2.5, 6);
      this._playAudio('fleshHit', cfg.sounds?.fleshHit, cfg.soundVolumes?.fleshHit || 0.90);
    }

    if (this.meleeModeDurationTimer > 0) {
      // Continuous Flurry Strikes across 8 surround angles during active Melee Mode duration
      const strikeType = this.meleeHitIndex % 4;
      if (strikeType === 0) {
        // Strike 1: Flash-Teleport Heavy Gut Strike (20 base dmg)
        const dmg = Math.round((cfg.meleePunchDamage || 20) * dmgMult);
        this._applyHit(opponent, dmg, 6, 3.0);
        this._playAudio('punch', cfg.sounds?.punch, cfg.soundVolumes?.punch || 0.85);
      } else if (strikeType === 1) {
        // Strike 2: Flash-Teleport Blindside Elbow Fracture (24 base dmg)
        const dmg = Math.round((cfg.meleeElbowDamage || 24) * dmgMult);
        this._applyHit(opponent, dmg, 8, 3.5);
        this._playAudio('fleshHit', cfg.sounds?.fleshHit, cfg.soundVolumes?.fleshHit || 0.90);
      } else if (strikeType === 2) {
        // Strike 3: Flash-Teleport Royal Roundhouse (26 base dmg)
        const dmg = Math.round((cfg.meleeElbowDamage || 26) * dmgMult);
        this._applyHit(opponent, dmg, 8, 3.8);
        this._playAudio('punch', cfg.sounds?.punch, cfg.soundVolumes?.punch || 0.90);
      } else {
        // Strike 4: Flash-Teleport Saiyan Ridge-Hand Strike (22 base dmg)
        const dmg = Math.round((cfg.meleePunchDamage || 22) * dmgMult);
        this._applyHit(opponent, dmg, 7, 3.2);
        this._playAudio('fleshHit', cfg.sounds?.fleshHit, cfg.soundVolumes?.fleshHit || 0.90);
      }
      this.meleeHitIndex++;
    } else {
      // Melee Mode Duration has completed! Execute Terminal Finisher Slam:
      // High Overhead Axe Kick Finisher Slam (36 base dmg) with wall bounce & shockwave!
      const dmg = Math.round((cfg.meleeFinisherDamage || 36) * dmgMult);
      this._applyHit(opponent, dmg, 12, 13.0, true);
      this._playAudio('heavyPunch', cfg.sounds?.heavyPunch, cfg.soundVolumes?.heavyPunch || 0.90);
      triggerGlobalScreenShake(4.0, 12);
      this._spawnRadialShockwave(opponent.x, opponent.y, 45, '#00E5FF', 0);

      // Vault backward >= 120px to initiate Phase 3 Rapid Ki Volley (Renzoku Ki Dān)
      this._vaultBackward(opponent, arena, cfg.meleeBackstepDistance || 120);
      this.basicComboPhase = 3;
      this.kiVolleyCount = 0;
      this.kiVolleyTimer = 8;
    }
  }

  _applyHit(opponent, dmg, hitPauseFrames = 6, knockback = 3.5, launchRicochet = false) {
    if (!opponent || opponent.hp <= 0) return;

    opponent.takeDamage(dmg, this, { isMelee: true, isPhysical: true });
    spawnSparks(opponent.x, opponent.y, '#7C4DFF', 10, 4.0);
    spawnImpactFlash(opponent.x, opponent.y, 22, '#FFD700');

    // Rule 1.5: Hit-pause strictly on target, never freeze attacker
    if (typeof opponent.applyTimeStop === 'function') {
      opponent.applyTimeStop(hitPauseFrames);
    } else {
      opponent.timeStopTimer = Math.max(opponent.timeStopTimer || 0, hitPauseFrames);
    }

    const angle = Math.atan2(opponent.y - this.y, opponent.x - this.x);
    opponent.vx = Math.cos(angle) * knockback;
    opponent.vy = Math.sin(angle) * knockback;
    if (launchRicochet) {
      opponent.isWallRicochet = true;
    }
  }

  /**
   * Gojo & Sukuna Melee Mode Standard: Flash-teleports to one of 8 distinct surround angles around the target
   */
  _teleportToMeleeAngle(opponent, arena) {
    if (!opponent || opponent.hp <= 0 || (this.timeStopTimer || 0) > 0) return;

    const oldX = this.x;
    const oldY = this.y;

    const currentAngle = (this.x !== opponent.x || this.y !== opponent.y)
      ? Math.atan2(this.y - opponent.y, this.x - opponent.x)
      : (this.gunAngle !== undefined ? this.gunAngle + Math.PI : 0);

    const angleOffsets = [
      -Math.PI * 0.85, // Deep Left Rear (~153°)
      -Math.PI * 0.55, // Left Flank (~99°)
      -Math.PI * 0.25, // Left-Center (~45°)
      0.0,             // Direct Front (0°)
      Math.PI * 0.25,  // Right-Center (~45°)
      Math.PI * 0.55,  // Right Flank (~99°)
      Math.PI * 0.85,  // Deep Right Rear (~153°)
      Math.PI          // Direct Behind (180°)
    ];

    if (this._meleeAnglePatternIndex === undefined) {
      this._meleeAnglePatternIndex = Math.floor(Math.random() * angleOffsets.length);
    } else {
      this._meleeAnglePatternIndex = (this._meleeAnglePatternIndex + 1 + Math.floor(Math.random() * (angleOffsets.length - 1))) % angleOffsets.length;
    }

    const angleOffset = angleOffsets[this._meleeAnglePatternIndex];
    const jitter = (Math.random() - 0.5) * 0.05;
    const baseAngle = currentAngle + angleOffset + jitter;
    const offsetDist = (opponent.r || 25) + this.r + 10;

    const currentArena = arena || (typeof state !== 'undefined' ? state.arena : null) || CONFIG.arena;
    this.x = opponent.x + Math.cos(baseAngle) * offsetDist;
    this.y = opponent.y + Math.sin(baseAngle) * offsetDist;
    this._clampToArena(currentArena);

    // Instant 0-frame angle snap directly facing target
    const targetZ = opponent.z || 0;
    const myZ = this.z || 0;
    const snapAngle = Math.atan2((opponent.y - targetZ) - (this.y - myZ), opponent.x - this.x);
    this.gunAngle = snapAngle;
    this.angle = snapAngle;
    this.aim(opponent);

    // Mutual Melee Snap: Target snaps to face the attacker (matching Gojo/Sukuna standard)
    if (opponent && typeof opponent.aim === 'function' && !opponent.isTargetOfAmbush && (opponent.timeStopTimer || 0) <= 0) {
      const oppAngle = Math.atan2((this.y - myZ) - (opponent.y - targetZ), this.x - opponent.x);
      opponent.gunAngle = oppAngle;
      opponent.angle = oppAngle;
      opponent.aim(this);
    }

    // Spawn afterimages along teleport trajectory
    const dx = this.x - oldX;
    const dy = this.y - oldY;
    const dist = Math.hypot(dx, dy);
    if (dist >= 10) {
      const steps = Math.max(2, Math.min(5, Math.floor(dist / 24)));
      for (let i = 0; i <= steps; i++) {
        const t = steps > 0 ? (i / steps) : 0;
        this.afterImages.push({
          x: oldX + dx * t,
          y: oldY + dy * t,
          angle: this.gunAngle || this.angle || 0,
          alpha: 0.40 * (1 - t * 0.4),
          duration: 16,
          timer: 16
        });
      }
    }

    this._playAudio('dodge', this._cfg.sounds?.dodge, this._cfg.soundVolumes?.dodge || 0.80);
  }

  _vaultBackward(opponent, arena, distance = 120) {
    if (!opponent) return;
    this._spawnAfterimage();
    const awayAngle = Math.atan2(this.y - opponent.y, this.x - opponent.x);
    this.x += Math.cos(awayAngle) * distance;
    this.y += Math.sin(awayAngle) * distance;
    this._clampToArena(arena);

    // Instant snap aim facing back towards opponent
    const targetZ = opponent.z || 0;
    const myZ = this.z || 0;
    const snapAngle = Math.atan2((opponent.y - targetZ) - (this.y - myZ), opponent.x - this.x);
    this.gunAngle = snapAngle;
    this.angle = snapAngle;
    this.aim(opponent);
  }

  // ─── Phase 3 Follow-Up Ki Blasts (Rapid Ki Volley) ───
  _fireKiBlast(opponent) {
    if (!opponent) return;
    const cfg = this._cfg;
    const dmgMult = this.getDamageMultiplier();
    const aimAngle = Math.atan2(opponent.y - this.y, opponent.x - this.x);
    const speed = cfg.followUpKiSpeed || 17;
    const dmg = Math.round((cfg.followUpKiDamage || 7) * dmgMult);
    const blastRadius = cfg.followUpKiRadius || 7;

    const blast = {
      x: this.x + Math.cos(aimAngle) * (this.r + 10),
      y: this.y + Math.sin(aimAngle) * (this.r + 10),
      vx: Math.cos(aimAngle) * speed,
      vy: Math.sin(aimAngle) * speed,
      r: blastRadius,
      damage: dmg,
      owner: this,
      color: '#7C4DFF',
      life: 50,
      update: (arenaObj) => {
        blast.x += blast.vx;
        blast.y += blast.vy;
        blast.life--;

        // Collision with opponent
        if (opponent && opponent.hp > 0) {
          const d = Math.hypot(opponent.x - blast.x, opponent.y - blast.y);
          if (d <= blast.r + (opponent.r || 25)) {
            opponent.takeDamage(blast.damage, this, { isProjectile: true });
            spawnSparks(blast.x, blast.y, '#7C4DFF', 8, 3.5);
            spawnImpactFlash(blast.x, blast.y, 25, '#FFD700');
            triggerGlobalScreenShake(1.5, 4);
            return false;
          }
        }

        // Arena boundary collision
        if (arenaObj && (blast.x < arenaObj.x || blast.x > arenaObj.x + arenaObj.width || blast.y < arenaObj.y || blast.y > arenaObj.y + arenaObj.height)) {
          spawnSparks(blast.x, blast.y, '#7C4DFF', 6, 2.5);
          return false;
        }
        return blast.life > 0;
      },
      draw: (ctx) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(blast.x, blast.y, blast.r, 0, Math.PI * 2);
        ctx.fillStyle = '#7C4DFF';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(blast.x, blast.y, blast.r * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.restore();
      }
    };

    this.activeKiBlasts.push(blast);
    this._playAudio('kiBlast', cfg.sounds?.kiBlast, cfg.soundVolumes?.kiBlast || 0.75);
  }

  _updateKiBlasts(arena) {
    for (let i = this.activeKiBlasts.length - 1; i >= 0; i--) {
      const b = this.activeKiBlasts[i];
      if (!b.update(arena)) {
        this.activeKiBlasts.splice(i, 1);
      }
    }
  }

  // ─── Autonomous Z-Vanish Dodge (Saitama & Sans Standard) ───
  takeDamage(amount, attacker, opts = {}) {
    const cfg = this._cfg;
    this.timeSinceLastDamage = 0;

    // Check beam/tick attack exceptions
    const isBeamOrTick = Boolean(
      opts.isPurpleDPS || opts.isHollowPurple || opts.isBlueDPS || opts.isLapseBlue ||
      opts.isPureLoveBeam || opts.isBeam || opts.isContinuous || opts.isPeriodic || opts.isDPS
    );

    const isGuaranteed = Boolean(
      opts.undodgeable || opts.isSureKill || opts.bypassEvade || opts.isGuaranteedHit
    );

    const isChannelingBeam = this.isChargingFinalFlash || this.isFiringFinalFlash || this.isChargingGalick || this.isFiringGalick || this.isChargingBigBang;

    if (isBeamOrTick || isGuaranteed || isChannelingBeam || this.timeStopTimer > 0) {
      return this._applyDamageWithArmorAndDR(amount, attacker, opts);
    }

    // Shotgun grace window check
    const proj = opts.projectile;
    const currentFrame = (typeof state !== 'undefined' && state.frameCount !== undefined) ? state.frameCount : ((Date.now() / 16.6) | 0);
    const isShotgunPellet = Boolean(proj && (proj.isShotgun || proj.shotgunVolleyId));
    if (isShotgunPellet && this._shotgunDodgeGraceTimer > 0 && this._lastShotgunDodgeAttacker === attacker) {
      return false; // Auto-dodge remaining shotgun pellets
    }

    if (this.isSkillEnabled(cfg.enableDodge, true) && this.dodgeCooldown <= 0) {
      const dodgeChance = this.isSuperSaiyan ? (cfg.superSaiyanDodgeChance || 0.95) : (cfg.dodgeChance || 0.85);
      if (Math.random() <= dodgeChance) {
        this.executeDodgeTeleport(attacker, opts);

        if (isShotgunPellet) {
          this._shotgunDodgeGraceTimer = cfg.shotgunDodgeGraceWindow || 16;
          this._lastShotgunDodgeAttacker = attacker;
        }
        return false; // Negated!
      }
    }

    return this._applyDamageWithArmorAndDR(amount, attacker, opts);
  }

  _applyDamageWithArmorAndDR(amount, attacker, opts) {
    const cfg = this._cfg;
    let netAmount = amount;

    // Passive 2: Royal Battle Armor Carapace (absorbs 20% flat damage into shield)
    if (this.armorShield > 0 && !opts.bypassShield) {
      const absorb = Math.min(this.armorShield, Math.round(netAmount * (cfg.armorMitigationPct || 0.20)));
      this.armorShield -= absorb;
      netAmount -= absorb;
      spawnImpactFlash(this.x, this.y, 25, '#FFC107');
    }

    // Super Saiyan Damage Reduction
    if (this.isSuperSaiyan) {
      netAmount = Math.max(1, Math.round(netAmount * (1 - (cfg.superSaiyanDamageReduction || 0.20))));
    }

    return super.takeDamage(netAmount, attacker, opts);
  }

  executeDodgeTeleport(target, opts = {}) {
    const cfg = this._cfg;
    const arena = (typeof state !== 'undefined' ? state.arena : null) || CONFIG.arena;

    this._spawnAfterimage();
    this._spawnAfterimage();

    const src = target || { x: this.x + 1, y: this.y };
    const distToAttacker = Math.hypot(src.x - this.x, src.y - this.y);
    const inMeleeMode = (this.basicComboPhase === 1 || this.basicComboPhase === 2) || (target && distToAttacker <= 85);

    if (inMeleeMode && target && target !== this) {
      // ── CQC Z-Vanish Slip & Counter-Attack Standard ──
      // Teleport directly to opponent's flank or rear at point-blank striking distance (~56px)
      const curAngle = Math.atan2(this.y - target.y, this.x - target.x);
      const sideSign = Math.random() < 0.5 ? 1 : -1;
      const pivotAngle = curAngle + sideSign * (Math.PI * 0.65 + Math.random() * 0.15); // ~110° - 135° pivot
      const strikeDist = (target.r || 25) + this.r + 6;

      this.x = target.x + Math.cos(pivotAngle) * strikeDist;
      this.y = target.y + Math.sin(pivotAngle) * strikeDist;
      this._clampToArena(arena);

      // Instant snap aim after dodge teleport
      const targetZ = target.z || 0;
      const myZ = this.z || 0;
      const snapAngle = Math.atan2((target.y - targetZ) - (this.y - myZ), target.x - this.x);
      this.gunAngle = snapAngle;
      this.angle = snapAngle;
      this.aim(target);

      // Opponent also snaps aim if valid (matching Gojo/Sukuna standard)
      if (typeof target.aim === 'function' && !target.isTargetOfAmbush && (target.timeStopTimer || 0) <= 0) {
        const oppAngle = Math.atan2((this.y - myZ) - (target.y - targetZ), this.x - target.x);
        target.gunAngle = oppAngle;
        target.angle = oppAngle;
        target.aim(this);
      }

      // Seamless counter-melee flow: maintain Melee Mode & immediately ready counter-strike
      this.basicComboPhase = 2;
      this.meleePunchCooldown = 0;
      if (!this.meleeModeDurationTimer || this.meleeModeDurationTimer <= 0) {
        this.meleeModeDurationTimer = cfg.initialMeleeDuration || 120;
      }

      // Attacker whiffs their blow into empty air with recovery delay
      target.teleportChaseDelayTimer = Math.max(target.teleportChaseDelayTimer || 0, cfg.attackerTeleportChaseDelayFrames || 6);

      // Distinct CQC Counter shockwave ring
      this._spawnRadialShockwave(this.x, this.y, 25, this.isSuperSaiyan ? '#FFE082' : '#7C4DFF', 0);
    } else {
      // ── Standard Neutral / Ranged Sidestep ──
      const incAngle = Math.atan2(this.y - src.y, this.x - src.x);
      const sideSign = Math.random() < 0.5 ? 1 : -1;
      const dodgeAngle = incAngle + (Math.PI / 2) * sideSign;
      const dist = cfg.dodgeDistance || 115;

      this.x += Math.cos(dodgeAngle) * dist;
      this.y += Math.sin(dodgeAngle) * dist;
      this._clampToArena(arena);

      if (target && target !== this) {
        target.teleportChaseDelayTimer = Math.max(target.teleportChaseDelayTimer || 0, cfg.attackerTeleportChaseDelayFrames || 5);
      }
    }

    this.dodgeCooldown = cfg.dodgeCooldown || 4;
    this._playAudio('dodge', cfg.sounds?.dodge, cfg.soundVolumes?.dodge || 0.80);
    spawnFloatingText(this.x, this.y - 20, cfg.dodgeText || 'MISS', cfg.dodgeTextColor || '#00E5FF');

    return true;
  }

  // ─── Active Skills: Big Bang Attack, Galick Gun & Final Flash ───
  _updateSkills(opponent, ownerIndex, arena) {
    const cfg = this._cfg;
    if (!opponent || opponent.hp <= 0) return false;

    // 1. Ultimate: Final Flash
    if (this.isSkillEnabled(cfg.enableFinalFlash, true) && this.finalFlashCooldown <= 0 && !this.isChargingFinalFlash && !this.isFiringFinalFlash) {
      if (Math.hypot(opponent.x - this.x, opponent.y - this.y) <= 340) {
        this.startFinalFlash(opponent);
        return true;
      }
    }

    if (this.isChargingFinalFlash || this.isFiringFinalFlash) {
      this._updateFinalFlash(opponent, arena);
      return true;
    }

    // 2. Skill 1: Big Bang Attack
    if (this.isSkillEnabled(cfg.enableBigBang, true) && this.bigBangCooldown <= 0 && !this.isChargingBigBang) {
      if (Math.hypot(opponent.x - this.x, opponent.y - this.y) <= 260) {
        this.startBigBang(opponent);
        return true;
      }
    }

    if (this.isChargingBigBang) {
      this._updateBigBang(opponent, arena);
      return true;
    }

    // 3. Skill 2: Galick Gun
    if (this.isSkillEnabled(cfg.enableGalickGun, true) && this.galickGunCooldown <= 0 && !this.isChargingGalickGun && !this.isFiringGalickGun) {
      if (Math.hypot(opponent.x - this.x, opponent.y - this.y) <= 280) {
        this.startGalickGun(opponent);
        return true;
      }
    }

    if (this.isChargingGalickGun || this.isFiringGalickGun) {
      this._updateGalickGun(opponent, arena);
      return true;
    }

    return false;
  }

  // ── Big Bang Attack ──
  startBigBang(opponent) {
    const cfg = this._cfg;
    this.isChargingBigBang = true;
    this.bigBangChargeTimer = cfg.bigBangChargeFrames || 24;
    this.bigBangCooldown = cfg.bigBangCooldown || 450;
    this.bigBangAngle = Math.atan2(opponent.y - this.y, opponent.x - this.x);
    this.gunAngle = this.bigBangAngle;
    this.angle = this.bigBangAngle;
    this._playAudio('transform', cfg.sounds?.transform, 0.80);
  }

  _updateBigBang(opponent, arena) {
    this.bigBangChargeTimer--;
    this.vx = 0;
    this.vy = 0;

    if (this.bigBangChargeTimer <= 0) {
      this.isChargingBigBang = false;
      this._fireBigBangMissile(opponent);
    }
  }

  _fireBigBangMissile(opponent) {
    const cfg = this._cfg;
    const dmgMult = this.getDamageMultiplier();
    const speed = cfg.bigBangSpeed || 18;
    const radius = this.isSuperSaiyan ? 120 : (cfg.bigBangRadius || 90);
    const dmg = Math.round((cfg.bigBangDamage || 52) * dmgMult);

    this.activeBigBangMissiles.push({
      x: this.x + Math.cos(this.bigBangAngle) * (this.r + 14),
      y: this.y + Math.sin(this.bigBangAngle) * (this.r + 14),
      vx: Math.cos(this.bigBangAngle) * speed,
      vy: Math.sin(this.bigBangAngle) * speed,
      r: 12,
      blastRadius: radius,
      damage: dmg,
      life: 60,
      detonated: false
    });
    this._playAudio('beamFire', cfg.sounds?.beamFire, 0.95);
  }

  _updateBigBangMissiles(arena, opponent) {
    const cfg = this._cfg;
    for (let i = this.activeBigBangMissiles.length - 1; i >= 0; i--) {
      const m = this.activeBigBangMissiles[i];
      m.x += m.vx;
      m.y += m.vy;
      m.life--;

      let shouldDetonate = false;
      if (opponent && opponent.hp > 0) {
        if (Math.hypot(opponent.x - m.x, opponent.y - m.y) <= m.r + (opponent.r || 25)) {
          shouldDetonate = true;
        }
      }
      if (arena && (m.x < arena.x || m.x > arena.x + arena.width || m.y < arena.y || m.y > arena.y + arena.height)) {
        shouldDetonate = true;
      }

      if (shouldDetonate || m.life <= 0) {
        this._spawnRadialShockwave(m.x, m.y, m.blastRadius, '#00E5FF', m.damage);
        triggerGlobalScreenShake(4.5, 14);
        this._playAudio('explosion', cfg.sounds?.explosion, 0.95);
        if (opponent && typeof opponent.applySlow === 'function') {
          opponent.applySlow(cfg.bigBangSlowDuration || 72, cfg.bigBangSlowMultiplier || 0.70);
        }
        this.activeBigBangMissiles.splice(i, 1);
      }
    }
  }

  // ── Galick Gun ──
  startGalickGun(opponent) {
    const cfg = this._cfg;
    this.isChargingGalickGun = true;
    this.isFiringGalickGun = false;
    this.galickGunChargeTimer = cfg.galickGunChargeFrames || 30;
    this.galickGunCooldown = cfg.galickGunCooldown || 420;
    this.galickGunAngle = Math.atan2(opponent.y - this.y, opponent.x - this.x);
    this.gunAngle = this.galickGunAngle;
    this.angle = this.galickGunAngle;
    this._playAudio('transform', cfg.sounds?.transform, 0.85);
  }

  _updateGalickGun(opponent, arena) {
    const cfg = this._cfg;
    const dmgMult = this.getDamageMultiplier();

    if (this.isChargingGalickGun) {
      this.galickGunChargeTimer--;
      this.vx = 0;
      this.vy = 0;
      if (this.galickGunChargeTimer <= 0) {
        this.isChargingGalickGun = false;
        this.isFiringGalickGun = true;
        this.galickGunFireTimer = 16;
        this._playAudio('beamFire', cfg.sounds?.beamFire, 1.05);

        // Piercing damage
        const beamWidth = this.isSuperSaiyan ? 75 : (cfg.galickGunWidth || 50);
        const dmg = Math.round((cfg.galickGunDamage || 55) * dmgMult);
        if (opponent && opponent.hp > 0) {
          const dx = opponent.x - this.x;
          const dy = opponent.y - this.y;
          const projAlong = dx * Math.cos(this.galickGunAngle) + dy * Math.sin(this.galickGunAngle);
          const projPerp = Math.abs(-dx * Math.sin(this.galickGunAngle) + dy * Math.cos(this.galickGunAngle));
          if (projAlong > 0 && projAlong < 500 && projPerp <= beamWidth / 2 + (opponent.r || 25)) {
            opponent.takeDamage(dmg, this, { isBeam: true });
            spawnSparks(opponent.x, opponent.y, '#7C4DFF', 12, 5.0);
            triggerGlobalScreenShake(3.5, 10);
          }
        }
      }
      return;
    }

    if (this.isFiringGalickGun) {
      this.galickGunFireTimer--;
      if (this.galickGunFireTimer <= 0) {
        this.isFiringGalickGun = false;
      }
    }
  }

  // ── Final Flash ──
  startFinalFlash(opponent) {
    const cfg = this._cfg;
    this.isChargingFinalFlash = true;
    this.isFiringFinalFlash = false;
    this.finalFlashChargeTimer = cfg.finalFlashChargeFrames || 75;
    this.finalFlashCooldown = cfg.finalFlashCooldown || 1920;
    this.finalFlashAngle = Math.atan2(opponent.y - this.y, opponent.x - this.x);
    this.gunAngle = this.finalFlashAngle;
    this.angle = this.finalFlashAngle;
    this._playAudio('transform', cfg.sounds?.transform, 0.90);
  }

  _updateFinalFlash(opponent, arena) {
    const cfg = this._cfg;
    const dmgMult = this.getDamageMultiplier();

    if (this.isChargingFinalFlash) {
      this.finalFlashChargeTimer--;
      this.vx = 0;
      this.vy = 0;

      if (this.finalFlashChargeTimer % 4 === 0) {
        spawnSparks(this.x, this.y, '#FFD700', 4, 2.5);
      }

      if (this.finalFlashChargeTimer <= 0) {
        this.isChargingFinalFlash = false;
        this.isFiringFinalFlash = true;
        this.finalFlashFireTimer = cfg.finalFlashFireFrames || 48;
        this.finalFlashTicksFired = 0;
        this.finalFlashTickTimer = 0;
        this._playAudio('beamFire', cfg.sounds?.beamFire, cfg.soundVolumes?.beamFire || 1.10);
      }
      return;
    }

    if (this.isFiringFinalFlash) {
      this.finalFlashFireTimer--;
      this.vx -= Math.cos(this.finalFlashAngle) * (cfg.finalFlashRecoil || 4.2) * 0.1;
      this.vy -= Math.sin(this.finalFlashAngle) * (cfg.finalFlashRecoil || 4.2) * 0.1;
      this._clampToArena(arena);
      triggerGlobalScreenShake(cfg.finalFlashShakeIntensity || 4.8, 2);

      // Beam tick damage
      this.finalFlashTickTimer--;
      if (this.finalFlashTickTimer <= 0 && this.finalFlashTicksFired < (cfg.finalFlashTickCount || 9)) {
        this.finalFlashTicksFired++;
        this.finalFlashTickTimer = 5;
        this._checkFinalFlashBeamDamage(opponent, dmgMult);
      }

      if (this.finalFlashFireTimer <= 0) {
        this.isFiringFinalFlash = false;
        // Final Detonation Shockwave
        this._spawnRadialShockwave(
          this.x + Math.cos(this.finalFlashAngle) * 230,
          this.y + Math.sin(this.finalFlashAngle) * 230,
          130,
          '#FFD700',
          Math.round((cfg.finalFlashFinalBurstDamage || 60) * dmgMult)
        );
      }
    }
  }

  _checkFinalFlashBeamDamage(opponent, dmgMult) {
    if (!opponent || opponent.hp <= 0) return;
    const cfg = this._cfg;
    const beamWidth = this.isSuperSaiyan ? 115 : (cfg.finalFlashBeamWidth || 90);
    const tickDmg = Math.round((cfg.finalFlashTickDamage || 16) * dmgMult);

    const dx = opponent.x - this.x;
    const dy = opponent.y - this.y;
    const projAlong = dx * Math.cos(this.finalFlashAngle) + dy * Math.sin(this.finalFlashAngle);
    const projPerp = Math.abs(-dx * Math.sin(this.finalFlashAngle) + dy * Math.cos(this.finalFlashAngle));

    if (projAlong > 0 && projAlong < 600 && projPerp <= beamWidth / 2 + (opponent.r || 25)) {
      opponent.takeDamage(tickDmg, this, { isBeam: true });
      spawnSparks(opponent.x, opponent.y, '#FFD700', 6, 4.0);
    }
  }

  // ─── Helpers: Shockwaves, Afterimages & Sound ───
  _spawnRadialShockwave(x, y, radius, color, damage = 0) {
    this.activeVisualExplosions.push({
      x, y,
      maxRadius: radius,
      color,
      radius: 0,
      alpha: 1.0,
      damage,
      duration: 18,
      timer: 18
    });

    if (damage > 0 && typeof state !== 'undefined' && state.fighters) {
      state.fighters.forEach(f => {
        if (f && f !== this && f.hp > 0) {
          const d = Math.hypot(f.x - x, f.y - y);
          if (d <= radius + (f.r || 25)) {
            f.takeDamage(damage, this, { isExplosion: true });
            const ang = Math.atan2(f.y - y, f.x - x);
            f.vx += Math.cos(ang) * 8.5;
            f.vy += Math.sin(ang) * 8.5;
          }
        }
      });
    }
  }

  _updateVisualExplosions() {
    for (let i = this.activeVisualExplosions.length - 1; i >= 0; i--) {
      const exp = this.activeVisualExplosions[i];
      exp.timer--;
      const p = 1 - (exp.timer / exp.duration);
      exp.radius = exp.maxRadius * p;
      exp.alpha = Math.max(0, 1 - p);
      if (exp.timer <= 0) {
        this.activeVisualExplosions.splice(i, 1);
      }
    }
  }

  _updateVisualEffects() {
    for (let i = this.activeVisualEffects.length - 1; i >= 0; i--) {
      const vfx = this.activeVisualEffects[i];
      vfx.timer--;
      if (vfx.timer <= 0) {
        this.activeVisualEffects.splice(i, 1);
      }
    }
  }

  _spawnAfterimage() {
    this.afterImages.push({
      x: this.x,
      y: this.y,
      angle: this.gunAngle || this.angle || 0,
      alpha: 0.40,
      duration: 18,
      timer: 18
    });
  }

  _updateAfterimages() {
    for (let i = this.afterImages.length - 1; i >= 0; i--) {
      const img = this.afterImages[i];
      img.timer--;
      img.alpha = Math.max(0, 0.40 * (img.timer / img.duration));
      if (img.timer <= 0) {
        this.afterImages.splice(i, 1);
      }
    }
  }

  _updateAuraParticles() {
    if (this.isSuperSaiyan && Math.random() < 0.4) {
      this.auraParticles.push({
        x: this.x + (Math.random() - 0.5) * this.r * 1.5,
        y: this.y + (Math.random() - 0.5) * this.r * 1.5,
        vx: (Math.random() - 0.5) * 1.0,
        vy: -Math.random() * 2.0 - 1.0,
        alpha: 0.8,
        color: Math.random() < 0.3 ? '#7C4DFF' : '#FFD700',
        life: 14
      });
    }
    for (let i = this.auraParticles.length - 1; i >= 0; i--) {
      const p = this.auraParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.alpha = Math.max(0, p.life / 14);
      if (p.life <= 0) {
        this.auraParticles.splice(i, 1);
      }
    }
  }

  _clampToArena(arena) {
    if (!arena) return;
    const margin = this.r + 4;
    this.x = Math.max(arena.x + margin, Math.min(arena.x + arena.width - margin, this.x));
    this.y = Math.max(arena.y + margin, Math.min(arena.y + arena.height - margin, this.y));
  }

  _playAudio(key, src, vol = 0.8) {
    if (src && typeof audioSystem !== 'undefined' && audioSystem.playSFX) {
      audioSystem.playSFX(src, vol);
    }
  }

  // ─── Rendering Pipeline (Rule 21 & Upright Standard) ───
  drawBody(ctx) {
    drawVegetaSkin(ctx, this);
  }

  draw(ctx, opponent) {
    if (this.hp <= 0) return;

    // 1. Draw Afterimages
    if (this.afterImages && this.afterImages.length > 0) {
      this.afterImages.forEach(img => {
        drawVegetaGhostSkin(ctx, img.x, img.y, img.angle, this.r, img.alpha);
      });
    }

    // 2. Draw Aura Particles
    if (this.auraParticles && this.auraParticles.length > 0) {
      this.auraParticles.forEach(p => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // 3. Draw Active Visual Explosions / Shockwaves (Rule 26)
    if (this.activeVisualExplosions && this.activeVisualExplosions.length > 0) {
      this.activeVisualExplosions.forEach(exp => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.strokeStyle = exp.color;
        ctx.lineWidth = 3.0;
        ctx.globalAlpha = exp.alpha;
        ctx.stroke();
        ctx.restore();
      });
    }

    // 4. Draw Galick Gun & Final Flash Beams
    if (this.isFiringGalickGun) {
      this._drawGalickGunBeam(ctx);
    }
    if (this.isFiringFinalFlash) {
      this._drawFinalFlashBeam(ctx);
    }

    // 5. Draw Ki Blast Projectiles & Big Bang Missiles
    if (this.activeKiBlasts && this.activeKiBlasts.length > 0) {
      this.activeKiBlasts.forEach(b => b.draw(ctx));
    }
    if (this.activeBigBangMissiles && this.activeBigBangMissiles.length > 0) {
      this.activeBigBangMissiles.forEach(m => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = '#00E5FF';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.restore();
      });
    }

    // 6. Draw Vegeta Procedural Body Model
    drawVegetaSkin(ctx, this);

    // 7. Rule 21 Mandatory Overhead HP & Freeze Indicators
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }

  _drawGalickGunBeam(ctx) {
    const beamWidth = this.isSuperSaiyan ? 75 : (this._cfg.galickGunWidth || 50);
    const length = 500;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.galickGunAngle);

    ctx.beginPath();
    ctx.rect(0, -beamWidth / 2, length, beamWidth);
    ctx.fillStyle = 'rgba(124, 77, 255, 0.45)';
    ctx.fill();

    ctx.beginPath();
    ctx.rect(0, -beamWidth * 0.25, length, beamWidth * 0.5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fill();

    ctx.restore();
  }

  _drawFinalFlashBeam(ctx) {
    const beamWidth = this.isSuperSaiyan ? 115 : (this._cfg.finalFlashBeamWidth || 90);
    const length = 560;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.finalFlashAngle);

    ctx.beginPath();
    ctx.rect(0, -beamWidth / 2, length, beamWidth);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.45)';
    ctx.fill();

    ctx.beginPath();
    ctx.rect(0, -beamWidth * 0.25, length, beamWidth * 0.5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.fill();

    ctx.restore();
  }
}
