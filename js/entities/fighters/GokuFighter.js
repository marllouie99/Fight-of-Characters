// ─────────────────────────────────────────────
// SON GOKU FIGHTER ENTITY CLASS
// Dragon Ball Series
// ─────────────────────────────────────────────
// • Hybrid Martial Arts Engine: Z-Vanish Gap-Closer -> 3-Hit CQC Flurry -> Backstep & Ki Barrage
// • Autonomous Z-Vanish Afterimage Dodge (Saitama & Sans Standard)
// • Super Saiyan Transformation Multiplier Buff (x1.30 DMG, x1.35 SPD, 15% DR, 95% Dodge)
// • Skills: Dragon Hammer (Skill 1), Kaioken Strike (Skill 2), Super Kamehameha (Ultimate)
// • Rule 1, 18, 19, 20, 21, 23, 24, 25, 26, 30, 31, 32 Compliant
// ─────────────────────────────────────────────

import { Fighter, applyDamageToTarget } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { state, isGlobalHitPauseActive, spawnFloatingText, triggerGlobalScreenShake } from '../../core/state.js';
import { MODE_SETTINGS } from '../../core/modeConfig.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { gokuConfig } from '../../configs/characters/gokuConfig.js';
import { drawGokuSkin } from '../../graphics/fighters/gokuSkin.js';
import { spawnImpactFlash, spawnSparks, spawnMeleeClashShockwave, spawnAnimePunchImpactFrame, spawnDbzInstantTransmissionVFX } from '../../graphics/particles/sparkEffect.js';
import { projectileSystem } from '../../systems/projectileSystem.js';

export class GokuFighter extends Fighter {
  constructor(def) {
    super(def);
    this.characterId = 'goku';
    this.type = 'goku';

    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.goku) ? CONFIG.goku : gokuConfig;
    this._cfg = cfg;

    // Baseline Attributes
    this.name = def?.name || cfg.name || 'GOKU';
    this.displayName = def?.displayName || cfg.displayName || 'Son Goku';
    this.color = cfg.color || '#FF7A00';
    this.themeColor = cfg.themeColor || '#FF7A00';
    this.damageNumberColor = '#FFD700';

    const sizeMult = CONFIG.globalFighter?.sizeMultiplier ?? 1.0;
    const internalScale = CONFIG.internalScale ?? 1.0;
    const baseRadius = def.radius || cfg.radius || 25;
    this.r = baseRadius * sizeMult * internalScale;

    const modeFixed = (typeof state !== 'undefined' && state?.mode && typeof MODE_SETTINGS !== 'undefined' && MODE_SETTINGS[state.mode])
      ? (MODE_SETTINGS[state.mode].fixedHp || MODE_SETTINGS[state.mode].playerFixedHp || MODE_SETTINGS[state.mode].soloFixedHp)
      : null;
    this.hp = modeFixed || cfg.hp || 380;
    this.maxHp = this.hp;
    this.baseMoveSpeed = cfg.moveSpeed || 5.6;
    this.moveSpeed = this.baseMoveSpeed;
    this.speed = this.baseMoveSpeed;

    // Martial Arts / Brawler Stance
    this.isMeleeFighter = true;
    this.isMeleeMode = true;
    this.isBrawler = true;
    this.handScale = cfg.handScale || 1.0;
    this.meleeReach = cfg.meleeReach || 68;

    // ─── Basic Attack: Hybrid Martial Arts & Follow-Up Ki Barrage Engine ───
    this.basicComboPhase = 0;           // 0: Idle, 1: Step-In, 2: CQC Flurry, 3: Ki Barrage
    this.meleeModeDurationTimer = 0;    // Active Melee Mode brawling duration timer (frames)
    this.meleeHitIndex = 0;             // 0: Gut Punch, 1: Rising Knee, 2: High Hook, 3: Knife Hand
    this.meleePunchCooldown = 0;        // Cadence between strikes
    this.basicAttackCooldownTimer = 0;  // Reset delay between full combo strings
    this.isPunching = false;
    this.isRightPunch = true;
    this.punchAnimTimer = 0;
    this.punchMaxTime = cfg.meleePunchAnimDuration || 10;
    this.meleeClashCooldown = 0;
    this.kiBarrageCount = 0;
    this.kiBarrageTimer = 0;
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

    // ─── Skill 1: Dragon Hammer ───
    this.dragonHammerCooldown = cfg.dragonHammerCooldown || 420;
    this.isDragonHammerActive = false;
    this.dragonHammerStep = 0;
    this.dragonHammerTimer = 0;

    // ─── Skill 2: Kaioken Strike ───
    this.kaiokenCooldown = cfg.kaiokenCooldown || 390;
    this.isKaiokenActive = false;
    this.kaiokenTimer = 0;
    this.kaiokenAuraTimer = 0;

    // ─── Ultimate: Super Kamehameha ───
    this.kamehamehaCooldown = cfg.kamehamehaCooldown || 1800;
    this.isChargingKamehameha = false;
    this.isFiringKamehameha = false;
    this.kamehamehaChargeTimer = 0;
    this.kamehamehaFireTimer = 0;
    this.kamehamehaAngle = 0;
    this.kamehamehaTickTimer = 0;
    this.kamehamehaTicksFired = 0;

    // General transient visual effects (Rule 25)
    this.activeVisualEffects = [];
    this.activeVisualExplosions = [];

    this._registerSkills();
  }

  _registerSkills() {
    const cfg = this._cfg || gokuConfig;
    const skills = [];

    if (this.isSkillEnabled(cfg.enableKamehameha, true)) {
      skills.push({
        id: 'kamehameha',
        name: 'SUPER KAMEHAMEHA',
        type: 'ultimate',
        cooldownKey: 'kamehamehaCooldown',
        cooldownMax: cfg.kamehamehaCooldown || 1800,
        channelingKey: 'isChargingKamehameha',
        activeKey: 'isFiringKamehameha',
        isSignature: true,
        signature: true,
        isUltimate: true
      });
    }

    if (this.isSkillEnabled(cfg.enableDragonHammer, true)) {
      skills.push({
        id: 'dragon_hammer',
        name: 'DRAGON HAMMER',
        type: 'offensive',
        cooldownKey: 'dragonHammerCooldown',
        cooldownMax: cfg.dragonHammerCooldown || 420,
        activeKey: 'isDragonHammerActive'
      });
    }

    if (this.isSkillEnabled(cfg.enableKaiokenStrike, true)) {
      skills.push({
        id: 'kaioken',
        name: 'KAIOKEN STRIKE',
        type: 'offensive',
        cooldownKey: 'kaiokenCooldown',
        cooldownMax: cfg.kaiokenCooldown || 390,
        activeKey: 'isKaiokenActive'
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
    // Intentionally empty: Goku uses dedicated hybrid martial arts combo and Ki blast barrage
  }

  /**
   * Universal Aim Guard: Locks aim during committed skills.
   */
  canAim() {
    if (this.isChargingKamehameha || this.isFiringKamehameha || this.isKaiokenActive) {
      return false;
    }
    return super.canAim();
  }

  /**
   * Distinct Skill Channeling State.
   * Isolates Kamehameha beam turning inertia (turnRate = 0.045) from Melee Mode CQC flurries.
   */
  isChannelingSkill() {
    return Boolean(
      this.isChargingKamehameha ||
      this.isFiringKamehameha ||
      this.isKaiokenActive
    );
  }

  /**
   * Instant Angle Snapping Aim Engine.
   * In Melee Mode (Phase 1, 2, or 3), Goku achieves instant 0-frame angular lock onto the enemy,
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
      this.isChargingKamehameha ||
      this.isFiringKamehameha ||
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
    this._updateAfterimages();
    this._updateAuraParticles();

    // 1. Mandatory Rule 1 Freeze & TimeStop Guard
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks();
      return;
    }

    // 2. Cooldown decrements
    this._decrementCooldowns();

    // 3. Super Saiyan Awakening & State Check
    this._updateSuperSaiyanState();

    // 4. Committed Ultimate / Skill Processing
    if (this._updateSkills(opponent, ownerIndex, currentArena)) {
      this.applyMovementPhysics(0);
      return;
    }

    // 5. Basic Attack Hybrid Martial Arts & Follow-up Ki Barrage Pipeline
    this._updateBasicHybridCombo(opponent, ownerIndex, currentArena);

    // 6. Movement & Wall Physics (Clamp velocity during active Melee Flurry or Ki Barrage)
    if (this.basicComboPhase === 2 || this.basicComboPhase === 3) {
      this.vx = 0;
      this.vy = 0;
      this.applyMovementPhysics(0);
      return;
    }

    const speedMult = this.isSuperSaiyan ? (this._cfg.superSaiyanSpeedMultiplier || 1.35) : 1.0;
    this.applyMovementPhysics(speedMult);
    this.resolveWallBounce(currentArena, opponent);
  }

  interruptAttacks(forceCancelAll = false) {
    super.interruptAttacks?.(forceCancelAll);
    if (forceCancelAll) {
      this.basicComboPhase = 0;
      this.meleeModeDurationTimer = 0;
      this.isChargingKamehameha = false;
      this.isFiringKamehameha = false;
      this.isDragonHammerActive = false;
      this.isKaiokenActive = false;
    }
  }

  // ─── Cooldown Processing ───
  _decrementCooldowns() {
    if (this.dodgeCooldown > 0) this.dodgeCooldown--;
    if (this.basicAttackCooldownTimer > 0) this.basicAttackCooldownTimer--;
    if (this.meleePunchCooldown > 0) this.meleePunchCooldown--;
    if (this.meleeClashCooldown > 0) this.meleeClashCooldown--;
    if (this.dragonHammerCooldown > 0) this.dragonHammerCooldown--;
    if (this.kaiokenCooldown > 0) this.kaiokenCooldown--;
    if (this.kamehamehaCooldown > 0) this.kamehamehaCooldown--;
    if (this.punchAnimTimer > 0) {
      this.punchAnimTimer--;
      this.isPunching = this.punchAnimTimer > 0;
    } else {
      this.isPunching = false;
    }
    if (this.kaiokenAuraTimer > 0) this.kaiokenAuraTimer--;
    if (this._shotgunDodgeGraceTimer > 0) this._shotgunDodgeGraceTimer--;
  }

  // ─── Super Saiyan Transformation Mechanics ───
  _updateSuperSaiyanState() {
    const cfg = this._cfg;
    if (!this.isSkillEnabled(cfg.enableSuperSaiyan, true)) return;

    // Zenkai Awakening Trigger at <= 35% HP
    const hpRatio = this.hp / this.maxHp;
    const threshold = cfg.superSaiyanHpThreshold || 0.35;

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
    this.moveSpeed = this.baseMoveSpeed * (cfg.superSaiyanSpeedMultiplier || 1.35);
    this.speed = this.moveSpeed;

    // CC Cleanse
    this.interruptAttacks(false);
    this.timeStopTimer = 0;
    this.hitStunTimer = 0;

    // Awakening Eruption & Screen Rumble
    triggerGlobalScreenShake(6.0, 24);
    this._playAudio('transform', cfg.sounds?.transform, cfg.soundVolumes?.transform || 0.95);
    this._playAudio('roar', cfg.sounds?.roar, cfg.soundVolumes?.roar || 0.85);

    // Golden Eruption Shockwave
    this._spawnRadialShockwave(this.x, this.y, 80, '#FFD700', 20);

    // Healthbar Pulse (Rule 27)
    this._healthBarHealTimer = 16;
  }

  getDamageMultiplier() {
    return this.isSuperSaiyan ? (this._cfg.superSaiyanDmgMultiplier || 1.30) : 1.0;
  }

  // ─── Basic Attack: Hybrid Martial Arts & Follow-Up Ki Barrage Engine ───
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
      const oldX = this.x;
      const oldY = this.y;
      this._playAudio('dodge', cfg.sounds?.dodge, cfg.soundVolumes?.dodge || 0.80);

      // Flash-step directly to 45px melee striking distance
      const strikeAngle = Math.atan2(this.y - opponent.y, this.x - opponent.x);
      const targetDist = (opponent.r || 25) + this.r + 8;
      this.x = opponent.x + Math.cos(strikeAngle) * targetDist;
      this.y = opponent.y + Math.sin(strikeAngle) * targetDist;
      this._clampToArena(arena);

      // DBZ Instant Transmission Dematerialize & Materialize VFX
      spawnDbzInstantTransmissionVFX(oldX, oldY, this.r, { isArrival: false, fighter: this });
      spawnDbzInstantTransmissionVFX(this.x, this.y, this.r, { isArrival: true, fighter: this });

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

    // Phase 2: Continuous Turtle School CQC Flurry Across 8 Surround Angles
    if (this.basicComboPhase === 2) {
      this.aim(opponent);
      if (this.meleeModeDurationTimer > 0) {
        this.meleeModeDurationTimer--;
      }

      if (this.meleePunchCooldown > 0) return;

      this._executeMeleeStrike(opponent, arena);
      return;
    }

    // Phase 3: Follow-Up Ki Blast Barrage (Renzoku Ki Dān)
    if (this.basicComboPhase === 3) {
      this.aim(opponent);
      this.kiBarrageTimer--;

      if (this.kiBarrageTimer <= 0 && this.kiBarrageCount < (cfg.followUpKiCount || 6)) {
        this._fireKiBlast(opponent);
        this.kiBarrageCount++;
        this.kiBarrageTimer = 5;
      }

      if (this.kiBarrageCount >= (cfg.followUpKiCount || 6) && this.kiBarrageTimer <= 0) {
        this.basicComboPhase = 0;
        this.basicAttackCooldownTimer = cfg.meleeModeSeparationCooldown || cfg.basicAttackResetCooldown || 180;
      }
    }
  }

  _executeMeleeStrike(opponent, arena) {
    const cfg = this._cfg;
    const dmgMult = this.getDamageMultiplier();
    const baseCadence = this.isSuperSaiyan ? 11 : (cfg.meleePunchCooldown || 14);

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
    this.isPunching = true;
    this.punchAnimTimer = baseCadence;
    this.punchMaxTime = baseCadence;
    this.meleePunchCooldown = baseCadence;

    // Check Brawler Clash
    const isBrawlerOpponent = opponent && (opponent.isBrawler || opponent.isMeleeMode || opponent.characterId === 'vegeta' || opponent.characterId === 'sukuna' || opponent.characterId === 'saitama');
    if (isBrawlerOpponent && this.meleeClashCooldown <= 0 && Math.hypot(opponent.x - this.x, opponent.y - this.y) <= (this.r + (opponent.r || 25) + 20)) {
      this.meleeClashCooldown = cfg.meleeClashCooldown || 25;
      spawnMeleeClashShockwave((this.x + opponent.x) / 2, (this.y + opponent.y) / 2, '#FFD700');
      triggerGlobalScreenShake(2.5, 6);
      this._playAudio('fleshHit', cfg.sounds?.fleshHit, cfg.soundVolumes?.fleshHit || 0.90);
    }

    if (this.meleeModeDurationTimer > 0) {
      // Continuous Flurry Strikes across 8 surround angles during active Melee Mode duration
      const strikeType = this.meleeHitIndex % 4;
      if (strikeType === 0) {
        // Strike 1: Flash-Teleport Gut Strike (18 base dmg)
        const dmg = Math.round((cfg.meleePunchDamage || 18) * dmgMult);
        this._applyHit(opponent, dmg, 6, 2.8);
        this._playAudio('punch', cfg.sounds?.punch, cfg.soundVolumes?.punch || 0.85);
      } else if (strikeType === 1) {
        // Strike 2: Flash-Teleport Rising Dragon Knee (22 base dmg)
        const dmg = Math.round((cfg.meleeKneeDamage || 22) * dmgMult);
        this._applyHit(opponent, dmg, 8, 3.2);
        this._playAudio('fleshHit', cfg.sounds?.fleshHit, cfg.soundVolumes?.fleshHit || 0.90);
      } else if (strikeType === 2) {
        // Strike 3: Flash-Teleport High Dragon Hook (24 base dmg)
        const dmg = Math.round((cfg.meleeKneeDamage || 24) * dmgMult);
        this._applyHit(opponent, dmg, 8, 3.5);
        this._playAudio('punch', cfg.sounds?.punch, cfg.soundVolumes?.punch || 0.90);
      } else {
        // Strike 4: Flash-Teleport Knife-Hand Chop (20 base dmg)
        const dmg = Math.round((cfg.meleePunchDamage || 20) * dmgMult);
        this._applyHit(opponent, dmg, 7, 3.0);
        this._playAudio('fleshHit', cfg.sounds?.fleshHit, cfg.soundVolumes?.fleshHit || 0.90);
      }
      this.meleeHitIndex++;
    } else {
      // Melee Mode Duration has expired! Culminate in the Terminal Finisher Slam:
      // Overhead Sledgehammer Finisher Slam (34 base dmg) with wall bounce & shockwave!
      const dmg = Math.round((cfg.meleeFinisherDamage || 34) * dmgMult);
      this._applyHit(opponent, dmg, 12, 12.0, true);
      this._playAudio('heavyPunch', cfg.sounds?.heavyPunch, cfg.soundVolumes?.heavyPunch || 0.90);
      triggerGlobalScreenShake(3.8, 12);
      this._spawnRadialShockwave(opponent.x, opponent.y, 45, '#FFD700', 0);

      // Vault backward >= 120px to initiate Phase 3 Ki Blast Barrage (Renzoku Ki Dān)
      this._vaultBackward(opponent, arena, cfg.meleeBackstepDistance || 120);
      this.basicComboPhase = 3;
      this.kiBarrageCount = 0;
      this.kiBarrageTimer = 8;
    }
  }

  _applyHit(opponent, dmg, hitPauseFrames = 6, knockback = 3.0, launchRicochet = false) {
    if (!opponent || opponent.hp <= 0) return;

    opponent.takeDamage(dmg, this, { isMelee: true, isPhysical: true });
    spawnSparks(opponent.x, opponent.y, '#FFD700', 10, 4.0);
    spawnImpactFlash(opponent.x, opponent.y, 22, '#FFF9C4');

    // 👊 Spawn Authentic 12-Frame Punch Attack VFX (Assets/effects/Punch Attack/)
    const hitAngle = Math.atan2(opponent.y - this.y, opponent.x - this.x);
    const punchColor = this.isSuperSaiyan ? 'gold' : 'orange';
    const punchRadius = launchRicochet ? 80 : 62;
    const impactDist = Math.max(this.r, Math.hypot(opponent.x - this.x, opponent.y - this.y) - (opponent.r || 25) * 0.45);
    const impactX = this.x + Math.cos(hitAngle) * impactDist;
    const impactY = this.y + Math.sin(hitAngle) * impactDist;
    if (typeof spawnAnimePunchImpactFrame === 'function') {
      spawnAnimePunchImpactFrame(impactX, impactY, punchRadius, hitAngle, punchColor);
    }

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
    const offsetDist = (opponent.r || 25) + this.r + 12;

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

    // DBZ Instant Transmission Dematerialization & Materialization VFX (Vertical Scanlines)
    spawnDbzInstantTransmissionVFX(oldX, oldY, this.r, { isArrival: false, fighter: this });
    spawnDbzInstantTransmissionVFX(this.x, this.y, this.r, { isArrival: true, fighter: this });

    this._playAudio('dodge', this._cfg.sounds?.dodge, this._cfg.soundVolumes?.dodge || 0.80);
  }

  _vaultBackward(opponent, arena, distance = 120) {
    if (!opponent) return;
    const oldX = this.x;
    const oldY = this.y;
    const awayAngle = Math.atan2(this.y - opponent.y, this.x - opponent.x);
    this.x += Math.cos(awayAngle) * distance;
    this.y += Math.sin(awayAngle) * distance;
    this._clampToArena(arena);

    // DBZ Instant Transmission Dematerialize & Materialize VFX
    spawnDbzInstantTransmissionVFX(oldX, oldY, this.r, { isArrival: false, fighter: this });
    spawnDbzInstantTransmissionVFX(this.x, this.y, this.r, { isArrival: true, fighter: this });

    // Instant snap aim facing back towards opponent
    const targetZ = opponent.z || 0;
    const myZ = this.z || 0;
    const snapAngle = Math.atan2((opponent.y - targetZ) - (this.y - myZ), opponent.x - this.x);
    this.gunAngle = snapAngle;
    this.angle = snapAngle;
    this.aim(opponent);
  }

  // ─── Phase 3 Follow-Up Ki Blasts (Renzoku Ki Dān) ───
  _fireKiBlast(opponent) {
    if (!opponent) return;
    const cfg = this._cfg;
    const dmgMult = this.getDamageMultiplier();
    const aimAngle = Math.atan2(opponent.y - this.y, opponent.x - this.x);
    const speed = cfg.followUpKiSpeed || 16;
    const dmg = Math.round((cfg.followUpKiDamage || 8) * dmgMult);
    const blastRadius = cfg.followUpKiRadius || 7;

    const blast = {
      x: this.x + Math.cos(aimAngle) * (this.r + 10),
      y: this.y + Math.sin(aimAngle) * (this.r + 10),
      vx: Math.cos(aimAngle) * speed,
      vy: Math.sin(aimAngle) * speed,
      r: blastRadius,
      damage: dmg,
      owner: this,
      color: '#FFD700',
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
            spawnSparks(blast.x, blast.y, '#FFD700', 8, 3.5);
            spawnImpactFlash(blast.x, blast.y, 25, '#FFF9C4');
            triggerGlobalScreenShake(1.5, 4);
            return false;
          }
        }

        // Arena boundary collision
        if (arenaObj && (blast.x < arenaObj.x || blast.x > arenaObj.x + arenaObj.width || blast.y < arenaObj.y || blast.y > arenaObj.y + arenaObj.height)) {
          spawnSparks(blast.x, blast.y, '#FFD700', 6, 2.5);
          return false;
        }
        return blast.life > 0;
      },
      draw: (ctx) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(blast.x, blast.y, blast.r, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(blast.x, blast.y, blast.r * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
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

  // ─── Autonomous Z-Vanish Dodge (Saitama & Sans Standard + CQC Vanish Counter) ───
  takeDamage(amount, attacker, opts = {}) {
    const cfg = this._cfg;

    // Check beam/tick attack exceptions
    const isBeamOrTick = Boolean(
      opts.isPurpleDPS || opts.isHollowPurple || opts.isBlueDPS || opts.isLapseBlue ||
      opts.isPureLoveBeam || opts.isBeam || opts.isContinuous || opts.isPeriodic || opts.isDPS
    );

    const isGuaranteed = Boolean(
      opts.undodgeable || opts.isSureKill || opts.bypassEvade || opts.isGuaranteedHit
    );

    const isChannelingBeam = this.isChargingKamehameha || this.isFiringKamehameha;

    if (isBeamOrTick || isGuaranteed || isChannelingBeam || this.timeStopTimer > 0) {
      const reducedAmount = this.isSuperSaiyan ? Math.max(1, Math.round(amount * (1 - (cfg.superSaiyanDamageReduction || 0.15)))) : amount;
      return super.takeDamage(reducedAmount, attacker, opts);
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

    // Super Saiyan Damage Reduction
    const finalAmount = this.isSuperSaiyan ? Math.max(1, Math.round(amount * (1 - (cfg.superSaiyanDamageReduction || 0.15)))) : amount;
    return super.takeDamage(finalAmount, attacker, opts);
  }

  executeDodgeTeleport(target, opts = {}) {
    const cfg = this._cfg;
    const arena = (typeof state !== 'undefined' ? state.arena : null) || CONFIG.arena;

    const oldX = this.x;
    const oldY = this.y;

    const src = target || { x: this.x + 1, y: this.y };
    const distToAttacker = Math.hypot(src.x - this.x, src.y - this.y);
    const inMeleeMode = (this.basicComboPhase === 1 || this.basicComboPhase === 2) || (target && distToAttacker <= 85);

    if (inMeleeMode && target && target !== this) {
      // ── CQC Z-Vanish Slip & Counter-Attack Standard ──
      // Teleport directly to opponent's flank or rear at point-blank striking distance (~58px)
      const curAngle = Math.atan2(this.y - target.y, this.x - target.x);
      const sideSign = Math.random() < 0.5 ? 1 : -1;
      const pivotAngle = curAngle + sideSign * (Math.PI * 0.65 + Math.random() * 0.15); // ~110° - 135° pivot
      const strikeDist = (target.r || 25) + this.r + 8;

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
      this._spawnRadialShockwave(this.x, this.y, 25, this.isSuperSaiyan ? '#FFE082' : '#FF9800', 0);
    } else {
      // ── Standard Neutral / Ranged Sidestep ──
      const incAngle = Math.atan2(this.y - src.y, this.x - src.x);
      const sideSign = Math.random() < 0.5 ? 1 : -1;
      const dodgeAngle = incAngle + (Math.PI / 2) * sideSign;
      const dist = cfg.dodgeDistance || 120;

      this.x += Math.cos(dodgeAngle) * dist;
      this.y += Math.sin(dodgeAngle) * dist;
      this._clampToArena(arena);

      if (target && target !== this) {
        target.teleportChaseDelayTimer = Math.max(target.teleportChaseDelayTimer || 0, cfg.attackerTeleportChaseDelayFrames || 5);
      }
    }

    // DBZ Instant Transmission Dematerialize & Materialize VFX
    spawnDbzInstantTransmissionVFX(oldX, oldY, this.r, { isArrival: false, fighter: this });
    spawnDbzInstantTransmissionVFX(this.x, this.y, this.r, { isArrival: true, fighter: this });

    this.dodgeCooldown = cfg.dodgeCooldown || 4;
    this._playAudio('dodge', cfg.sounds?.dodge, cfg.soundVolumes?.dodge || 0.80);
    spawnFloatingText(this.x, this.y - 20, cfg.dodgeText || 'MISS', cfg.dodgeTextColor || '#FFE082');

    return true;
  }

  // ─── Active Skills: Dragon Hammer, Kaioken Strike & Super Kamehameha ───
  _updateSkills(opponent, ownerIndex, arena) {
    const cfg = this._cfg;
    if (!opponent || opponent.hp <= 0) return false;

    // 1. Ultimate: Super Kamehameha
    if (this.isSkillEnabled(cfg.enableKamehameha, true) && this.kamehamehaCooldown <= 0 && !this.isChargingKamehameha && !this.isFiringKamehameha) {
      if (Math.hypot(opponent.x - this.x, opponent.y - this.y) <= 320) {
        this.startKamehameha(opponent);
        return true;
      }
    }

    if (this.isChargingKamehameha || this.isFiringKamehameha) {
      this._updateKamehameha(opponent, arena);
      return true;
    }

    // 2. Skill 2: Kaioken Strike
    if (this.isSkillEnabled(cfg.enableKaiokenStrike, true) && this.kaiokenCooldown <= 0 && !this.isKaiokenActive) {
      if (Math.hypot(opponent.x - this.x, opponent.y - this.y) <= 220) {
        this.startKaiokenStrike(opponent);
        return true;
      }
    }

    if (this.isKaiokenActive) {
      this._updateKaioken(opponent, arena);
      return true;
    }

    // 3. Skill 1: Dragon Hammer
    if (this.isSkillEnabled(cfg.enableDragonHammer, true) && this.dragonHammerCooldown <= 0 && !this.isDragonHammerActive) {
      if (Math.hypot(opponent.x - this.x, opponent.y - this.y) <= 240) {
        this.startDragonHammer(opponent, arena);
        return true;
      }
    }

    if (this.isDragonHammerActive) {
      this._updateDragonHammer(opponent, arena);
      return true;
    }

    return false;
  }

  // ── Dragon Hammer ──
  startDragonHammer(opponent, arena) {
    const cfg = this._cfg;
    this.isDragonHammerActive = true;
    this.dragonHammerStep = 0;
    this.dragonHammerTimer = cfg.dragonHammerDuration || 36;
    this.dragonHammerCooldown = cfg.dragonHammerCooldown || 420;

    // Instant blink in front of target
    const oldX = this.x;
    const oldY = this.y;
    const angle = Math.atan2(this.y - opponent.y, this.x - opponent.x);
    this.x = opponent.x + Math.cos(angle) * (this.r + (opponent.r || 25) + 5);
    this.y = opponent.y + Math.sin(angle) * (this.r + (opponent.r || 25) + 5);
    this._clampToArena(arena);
    this.aim(opponent);

    // DBZ Instant Transmission Dematerialize & Materialize VFX
    spawnDbzInstantTransmissionVFX(oldX, oldY, this.r, { isArrival: false, fighter: this });
    spawnDbzInstantTransmissionVFX(this.x, this.y, this.r, { isArrival: true, fighter: this });
    this._playAudio('dodge', cfg.sounds?.dodge, 0.80);
  }

  _updateDragonHammer(opponent, arena) {
    const cfg = this._cfg;
    const dmgMult = this.getDamageMultiplier();
    const hits = cfg.dragonHammerDamage || [12, 12, 14, 28];

    this.dragonHammerTimer--;
    if (this.dragonHammerTimer % 8 === 0 && this.dragonHammerStep < hits.length) {
      const dmg = Math.round(hits[this.dragonHammerStep] * dmgMult);
      const isFinisher = this.dragonHammerStep === hits.length - 1;
      this.isPunching = true;
      this.punchAnimTimer = isFinisher ? 12 : 8;
      this.punchMaxTime = isFinisher ? 12 : 8;
      this.isRightPunch = !this.isRightPunch;
      this._applyHit(opponent, dmg, isFinisher ? 14 : 6, isFinisher ? 12.0 : 4.0, isFinisher);

      if (isFinisher) {
        if (typeof opponent.applySlow === 'function') {
          opponent.applySlow(cfg.dragonHammerSlowDuration || 72, cfg.dragonHammerWallSlow || 0.30);
        }
        triggerGlobalScreenShake(3.5, 10);
      }
      this.dragonHammerStep++;
    }

    if (this.dragonHammerTimer <= 0) {
      this.isDragonHammerActive = false;
    }
  }

  // ── Kaioken Strike ──
  startKaiokenStrike(opponent) {
    const cfg = this._cfg;
    this.isKaiokenActive = true;
    this.isPunching = true;
    this.punchAnimTimer = cfg.kaiokenDashFrames || 14;
    this.punchMaxTime = cfg.kaiokenDashFrames || 14;
    this.isRightPunch = true;
    this.kaiokenTimer = cfg.kaiokenDashFrames || 14;
    this.kaiokenCooldown = cfg.kaiokenCooldown || 390;
    this.kaiokenAuraTimer = 40;
    this.kaiokenAngle = Math.atan2(opponent.y - this.y, opponent.x - this.x);
    this.gunAngle = this.kaiokenAngle;
    this.angle = this.kaiokenAngle;
    this._playAudio('roar', cfg.sounds?.roar, 0.80);
  }

  _updateKaioken(opponent, arena) {
    const cfg = this._cfg;
    const dmgMult = this.getDamageMultiplier();
    const speed = (cfg.kaiokenDashDistance || 200) / (cfg.kaiokenDashFrames || 14);

    this.x += Math.cos(this.kaiokenAngle) * speed;
    this.y += Math.sin(this.kaiokenAngle) * speed;
    this._clampToArena(arena);
    this.kaiokenTimer--;

    // Collision check
    if (opponent && opponent.hp > 0) {
      const d = Math.hypot(opponent.x - this.x, opponent.y - this.y);
      if (d <= this.r + (opponent.r || 25) + 15) {
        const dmg = Math.round((cfg.kaiokenDamage || 45) * dmgMult);
        opponent.takeDamage(dmg, this, { isPhysical: true, bypassBlock: true, bypassShield: true });
        if (typeof opponent.applyHitStun === 'function') {
          opponent.applyHitStun(cfg.kaiokenStunFrames || 60);
        }
        triggerGlobalScreenShake(4.0, 14);
        spawnImpactFlash(opponent.x, opponent.y, 40, '#FF1744');
        spawnSparks(opponent.x, opponent.y, '#FF1744', 15, 5.0);
        if (typeof spawnAnimePunchImpactFrame === 'function') {
          spawnAnimePunchImpactFrame(opponent.x, opponent.y, 85, this.kaiokenAngle, 'crimson');
        }
        this.isKaiokenActive = false;
        return;
      }
    }

    if (this.kaiokenTimer <= 0) {
      this.isKaiokenActive = false;
    }
  }

  // ── Super Kamehameha ──
  startKamehameha(opponent) {
    const cfg = this._cfg;
    this.isChargingKamehameha = true;
    this.isFiringKamehameha = false;
    this.kamehamehaChargeTimer = cfg.kamehamehaChargeFrames || 60;
    this.kamehamehaCooldown = cfg.kamehamehaCooldown || 1800;
    this.kamehamehaAngle = Math.atan2(opponent.y - this.y, opponent.x - this.x);
    this.gunAngle = this.kamehamehaAngle;
    this.angle = this.kamehamehaAngle;
    this._playAudio('transform', cfg.sounds?.transform, 0.85);
  }

  _updateKamehameha(opponent, arena) {
    const cfg = this._cfg;
    const dmgMult = this.getDamageMultiplier();

    if (this.isChargingKamehameha) {
      this.kamehamehaChargeTimer--;
      this.vx = 0;
      this.vy = 0;

      // Charge particles
      if (this.kamehamehaChargeTimer % 4 === 0) {
        spawnSparks(this.x, this.y, '#00E5FF', 4, 2.0);
      }

      if (this.kamehamehaChargeTimer <= 0) {
        this.isChargingKamehameha = false;
        this.isFiringKamehameha = true;
        this.kamehamehaFireTimer = cfg.kamehamehaFireFrames || 48;
        this.kamehamehaTicksFired = 0;
        this.kamehamehaTickTimer = 0;
        this._playAudio('beamFire', cfg.sounds?.beamFire, cfg.soundVolumes?.beamFire || 1.10);
      }
      return;
    }

    if (this.isFiringKamehameha) {
      this.kamehamehaFireTimer--;
      this.vx -= Math.cos(this.kamehamehaAngle) * (cfg.kamehamehaRecoil || 3.8) * 0.1;
      this.vy -= Math.sin(this.kamehamehaAngle) * (cfg.kamehamehaRecoil || 3.8) * 0.1;
      this._clampToArena(arena);
      triggerGlobalScreenShake(cfg.kamehamehaShakeIntensity || 4.5, 2);

      // Beam tick damage
      this.kamehamehaTickTimer--;
      if (this.kamehamehaTickTimer <= 0 && this.kamehamehaTicksFired < (cfg.kamehamehaTickCount || 8)) {
        this.kamehamehaTicksFired++;
        this.kamehamehaTickTimer = 5;
        this._checkKamehamehaBeamDamage(opponent, dmgMult);
      }

      if (this.kamehamehaFireTimer <= 0) {
        this.isFiringKamehameha = false;
        // Final Detonation Shockwave
        this._spawnRadialShockwave(
          this.x + Math.cos(this.kamehamehaAngle) * 220,
          this.y + Math.sin(this.kamehamehaAngle) * 220,
          120,
          '#00E5FF',
          Math.round((cfg.kamehamehaFinalBurstDamage || 50) * dmgMult)
        );
      }
    }
  }

  _checkKamehamehaBeamDamage(opponent, dmgMult) {
    if (!opponent || opponent.hp <= 0) return;
    const cfg = this._cfg;
    const beamWidth = this.isSuperSaiyan ? 110 : (cfg.kamehamehaBeamWidth || 85);
    const tickDmg = Math.round((cfg.kamehamehaTickDamage || 15) * dmgMult);

    // Line distance check
    const dx = opponent.x - this.x;
    const dy = opponent.y - this.y;
    const projAlong = dx * Math.cos(this.kamehamehaAngle) + dy * Math.sin(this.kamehamehaAngle);
    const projPerp = Math.abs(-dx * Math.sin(this.kamehamehaAngle) + dy * Math.cos(this.kamehamehaAngle));

    if (projAlong > 0 && projAlong < 600 && projPerp <= beamWidth / 2 + (opponent.r || 25)) {
      opponent.takeDamage(tickDmg, this, { isBeam: true });
      spawnSparks(opponent.x, opponent.y, '#00E5FF', 6, 4.0);
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
            f.vx += Math.cos(ang) * 8;
            f.vy += Math.sin(ang) * 8;
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
      timer: 18,
      isSuperSaiyan: Boolean(this.isSuperSaiyan)
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
        color: Math.random() < 0.3 ? '#00E5FF' : '#FFD700',
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
    drawGokuSkin(ctx, this);
  }

  draw(ctx, opponent) {
    if (this.hp <= 0) return;

    // 1. Draw Afterimages
    if (this.afterImages && this.afterImages.length > 0) {
      this.afterImages.forEach(img => {
        drawGokuGhostSkin(ctx, img.x, img.y, img.angle, this.r, img.alpha, Boolean(img.isSuperSaiyan));
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

    // 4. Draw Kamehameha Beam
    if (this.isFiringKamehameha) {
      this._drawKamehamehaBeam(ctx);
    }

    // 5. Draw Ki Blast Projectiles
    if (this.activeKiBlasts && this.activeKiBlasts.length > 0) {
      this.activeKiBlasts.forEach(b => b.draw(ctx));
    }

    // 6. Draw Goku Procedural Body Model
    drawGokuSkin(ctx, this);

    // 7. Rule 21 Mandatory Overhead HP & Freeze Indicators
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }

  _drawKamehamehaBeam(ctx) {
    const beamWidth = this.isSuperSaiyan ? 110 : (this._cfg.kamehamehaBeamWidth || 85);
    const length = 550;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.kamehamehaAngle);

    // Outer Azure Corona
    ctx.beginPath();
    ctx.rect(0, -beamWidth / 2, length, beamWidth);
    ctx.fillStyle = 'rgba(0, 229, 255, 0.40)';
    ctx.fill();

    // Inner Radiant Core
    ctx.beginPath();
    ctx.rect(0, -beamWidth * 0.25, length, beamWidth * 0.5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fill();

    ctx.restore();
  }
}
