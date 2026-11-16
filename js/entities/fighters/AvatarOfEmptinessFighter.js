// ─────────────────────────────────────────────
// Avatar of Emptiness Fighter Entity (Terraria: Wrath of the Gods)
// ─────────────────────────────────────────────

import { Fighter, applyDamageToTarget, isSkillEnabled } from '../fighter.js';
import { CONFIG } from '../../core/config.js';
import { avatarOfEmptinessConfig } from '../../configs/characters/avatarOfEmptinessConfig.js';
import { state, spawnFloatingText, triggerGlobalScreenShake } from '../../core/state.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { playSound, playLoopingSound, stopLoopingSound } from '../../systems/soundSystem.js';
import { projectileSystem } from '../../systems/projectileSystem.js';
import { drawAvatarOfEmptinessSkin } from '../../graphics/fighters/avatarOfEmptinessSkin.js';
import {
  drawAvatarWeapon,
  drawUniversalAnnihilationCharge,
  drawUniversalAnnihilationBeam,
  drawAvatarShockwaves,
  drawCryonicZeroEffects,
  drawVisceralTorrentEffects,
  drawDarkPortalStrikes,
  drawAvatarVoidBlots,
  drawAntimatterBlastProjectile
} from '../../graphics/weapons/avatarOfEmptinessWeaponGraphics.js';
import { spawnSparks, spawnImpactFlash } from '../../graphics/particles/sparkEffect.js';

function getAvatarSetting(config, key) {
  return config?.[key] ?? avatarOfEmptinessConfig[key];
}

function normalizeAngle(a) {
  let res = a;
  while (res < -Math.PI) res += Math.PI * 2;
  while (res > Math.PI) res -= Math.PI * 2;
  return res;
}

export class AvatarOfEmptinessFighter extends Fighter {
  constructor(def) {
    super(def);
    this.characterId = 'avatarofemptiness';
    this.type = 'avatarofemptiness';
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.avatarofemptiness) ? CONFIG.avatarofemptiness : avatarOfEmptinessConfig;
    this.name = def?.name ?? getAvatarSetting(cfg, 'name') ?? 'Avatar of Emptiness';
    this.displayName = def?.displayName ?? getAvatarSetting(cfg, 'displayName') ?? this.name;
    this.color = def?.color ?? getAvatarSetting(cfg, 'color') ?? '#9D4EDD';
    this.themeColor = def?.themeColor ?? getAvatarSetting(cfg, 'themeColor') ?? '#9D4EDD';
    this.secondaryColor = def?.secondaryColor ?? getAvatarSetting(cfg, 'secondaryColor') ?? '#00F5D4';
    this.damageNumberColor = getAvatarSetting(cfg, 'color') ?? '#9D4EDD';

    this.hp = getAvatarSetting(cfg, 'hp') ?? 460;
    this.maxHp = getAvatarSetting(cfg, 'maxHp') ?? 460;
    this.speed = getAvatarSetting(cfg, 'speed') ?? 4.7;
    this.baseSpeed = this.speed;
    this.r = getAvatarSetting(cfg, 'r') || 42;
    this.radius = this.r;
    this.usesCustomHands = true;
    this.hideHands = true;

    this.damage = getAvatarSetting(cfg, 'damage') ?? 17;
    this.cooldown = getAvatarSetting(cfg, 'cooldown') ?? 34;

    // Three Universes State & Phase 2 Awakening
    this.currentUniverse = 'dark';
    this.isPhase2 = false;
    this.phase2Triggered = false;
    this.basicVolleyCount = 0;

    // Skill Timers & VFX Pools
    this.cryonicCooldown = 0;
    this.activeCryonicZones = [];

    this.visceralCooldown = 0;
    this.visceralActiveTimer = 0;
    this.visceralDurationMax = getAvatarSetting(cfg, 'visceralDuration') || 90;
    this.visceralCastAngle = 0;
    this.visceralReach = getAvatarSetting(cfg, 'visceralReach') || 155;
    this.visceralArc = getAvatarSetting(cfg, 'visceralArc') || (Math.PI * 0.88);

    this.portalCooldown = 0;
    this.activePortalStrikes = [];
    this.activeVoidBlots = [];
    this.activeShockwaves = [];

    // Ultimate: Universal Annihilation
    this.annihilationCooldown = getAvatarSetting(cfg, 'annihilationInitialCooldown') ?? 360;
    this.annihilationWindupTimer = 0;
    this.annihilationWindupMax = getAvatarSetting(cfg, 'annihilationWindupFrames') || 50;
    this.annihilationFireTimer = 0;
    this.annihilationFireMax = getAvatarSetting(cfg, 'annihilationFireFrames') || 95;
    this.annihilationRecoveryTimer = 0;
    this.annihilationRecoveryMax = getAvatarSetting(cfg, 'annihilationRecoveryFrames') || 30;
    this.annihilationCastAngle = 0;
    this.annihilationDamageTick = getAvatarSetting(cfg, 'annihilationDamageTick') || 6;
    this.annihilationTickRate = getAvatarSetting(cfg, 'annihilationTickRate') || 4;
    this.annihilationBeamWidth = getAvatarSetting(cfg, 'annihilationBeamWidth') || 52;
    this.annihilationBeamLength = getAvatarSetting(cfg, 'annihilationBeamLength') || 1300;

    this.shootCooldown = 0;
    this._registerSkills();
  }

  _registerSkills() {
    const cfg = this._getCfg();
    const themeColor = this.themeColor || cfg.themeColor || '#9D4EDD';
    if (!this.skillManager) return;

    const skills = [];
    if (isSkillEnabled(cfg.enableCryonicZero, true)) {
      skills.push({
        id: 'cryonic',
        name: cfg.cryonicZeroSkillName || 'CRYONIC ZERO',
        type: 'special',
        cooldownKey: 'cryonicCooldown',
        cooldownMax: () => getAvatarSetting(this._getCfg(), 'cryonicCooldown') || 360,
        color: themeColor,
        canTickCooldown: () => false,
        onActivate: (fighter, opponent) => fighter.castCryonicZero(opponent)
      });
    }
    if (isSkillEnabled(cfg.enableVisceralTorrent, true)) {
      skills.push({
        id: 'visceral',
        name: cfg.visceralTorrentSkillName || 'VISCERAL TORRENT',
        type: 'special',
        cooldownKey: 'visceralCooldown',
        cooldownMax: () => getAvatarSetting(this._getCfg(), 'visceralCooldown') || 390,
        color: themeColor,
        canTickCooldown: () => false,
        onActivate: (fighter, opponent) => fighter.castVisceralTorrent(opponent)
      });
    }
    if (isSkillEnabled(cfg.enablePortalStrikes, true)) {
      skills.push({
        id: 'portal',
        name: cfg.portalStrikesSkillName || 'PORTAL STRIKES',
        type: 'special',
        cooldownKey: 'portalCooldown',
        cooldownMax: () => getAvatarSetting(this._getCfg(), 'portalCooldown') || 480,
        color: themeColor,
        canTickCooldown: () => false,
        onActivate: (fighter, opponent) => fighter.castPortalStrikes(opponent)
      });
    }
    if (isSkillEnabled(cfg.enableUniversalAnnihilation, true)) {
      skills.push({
        id: 'annihilation',
        name: cfg.universalAnnihilationSkillName || 'UNIVERSAL ANNIHILATION',
        type: 'ultimate',
        cooldownKey: 'annihilationCooldown',
        cooldownMax: () => getAvatarSetting(this._getCfg(), 'annihilationCooldown') || 880,
        color: themeColor,
        canTickCooldown: () => false,
        onActivate: (fighter, opponent) => fighter.castUniversalAnnihilation(opponent)
      });
    }
    if (skills.length > 0) {
      this.skillManager.registerSkills(skills);
    }
  }

  _getCfg() {
    return (typeof CONFIG !== 'undefined' && CONFIG.avatarofemptiness) ? CONFIG.avatarofemptiness : avatarOfEmptinessConfig;
  }

  _playAvatarSfx(soundKeys, audioKeyFallback, volumeOverride = null) {
    const cfg = this._getCfg();
    const keys = Array.isArray(soundKeys) ? soundKeys : [soundKeys];
    const pickedKey = keys[Math.floor(Math.random() * keys.length)];
    const src = cfg?.sounds?.[pickedKey] || avatarOfEmptinessConfig.sounds?.[pickedKey];
    const vol = volumeOverride ?? cfg?.soundVolumes?.[pickedKey] ?? avatarOfEmptinessConfig.soundVolumes?.[pickedKey] ?? 0.85;

    if (src && typeof audioSystem !== 'undefined' && typeof audioSystem.playSFX === 'function') {
      audioSystem.playSFX(src, vol);
      return;
    }
    if (audioKeyFallback && typeof playSound === 'function') {
      playSound(audioKeyFallback);
    }
  }

  stopAllAvatarAudio() {
    if (typeof stopLoopingSound === 'function') {
      stopLoopingSound('avatar_annihilation_loop');
      stopLoopingSound('avatar_blood_vortex_loop');
    }
  }

  canAim() {
    if (this.hp <= 0 || this.isDead || this.dead) return false;
    const isLockIn = this.annihilationWindupTimer > 0 && this.annihilationWindupTimer <= 20;
    if (isLockIn || this.annihilationFireTimer > 0 || this.annihilationRecoveryTimer > 0) {
      return false;
    }
    if (this.visceralActiveTimer > 0) {
      return false;
    }
    return super.canAim ? super.canAim() : true;
  }

  aim(opponent) {
    const isLockIn = this.annihilationWindupTimer > 0 && this.annihilationWindupTimer <= 20;
    if (isLockIn || this.annihilationFireTimer > 0 || this.annihilationRecoveryTimer > 0) {
      this.gunAngle = this.annihilationCastAngle;
      this.angle = this.annihilationCastAngle;
      return;
    }
    if (this.annihilationWindupTimer > 20 && opponent && opponent.hp > 0 && !this.isTeammate(opponent)) {
      const targetAngle = Math.atan2(opponent.y - this.y, opponent.x - this.x);
      const diff = normalizeAngle(targetAngle - (this.gunAngle || 0));
      this.gunAngle = (this.gunAngle || 0) + diff * 0.1;
      this.angle = this.gunAngle;
      this.annihilationCastAngle = this.gunAngle;
      return;
    }
    if (this.visceralActiveTimer > 0) {
      this.gunAngle = this.visceralCastAngle;
      this.angle = this.visceralCastAngle;
      return;
    }
    super.aim(opponent);
  }

  applyAim(opponent, targetAngle) {
    if (!this.canAim()) return;
    this.gunAngle = targetAngle;
    this.angle = targetAngle;
  }

  interruptAttacks(forceCancelAll = false) {
    if (typeof super.interruptAttacks === 'function') super.interruptAttacks(forceCancelAll);
    this.annihilationWindupTimer = 0;
    this.annihilationFireTimer = 0;
    this.annihilationRecoveryTimer = 0;
    this.visceralActiveTimer = 0;
    if (forceCancelAll) {
      this.activeShockwaves.length = 0;
    }
    this.stopAllAvatarAudio();
  }

  applyKnockback(vx, vy, stunFrames = 0) {
    const cfg = this._getCfg();
    const resist = Math.max(0, Math.min(0.95, getAvatarSetting(cfg, 'knockbackResist') ?? 0.85));
    const scale = 1 - resist;
    return super.applyKnockback(vx * scale, vy * scale, stunFrames);
  }

  applyRedKnockback(vx, vy) {
    const cfg = this._getCfg();
    const resist = Math.max(0, Math.min(0.95, getAvatarSetting(cfg, 'knockbackResist') ?? 0.85));
    const scale = 1 - resist;
    return super.applyRedKnockback(vx * scale, vy * scale);
  }

  takeDamage(amount, attacker, opts = {}) {
    const res = super.takeDamage(amount, attacker, opts);
    if (this.hp <= 0 || this.dead || this.isDead) {
      this.stopAllAvatarAudio();
    } else if (!this.phase2Triggered && this.hp <= this.maxHp * (getAvatarSetting(this._getCfg(), 'phase2HpThreshold') ?? 0.55)) {
      this._triggerPhase2Awakening();
    }
    return res;
  }

  die(attacker) {
    this.stopAllAvatarAudio();
    if (typeof super.die === 'function') {
      return super.die(attacker);
    }
  }

  resolveWallBounce(arena, opponent) {
    if (this.isCaughtInBeam?.() || this.isDraggedByGetsuga || this.isWallPinnedByMakima || this.isWallPinnedBySaitama) {
      return super.resolveWallBounce(arena, opponent);
    }
    return super.resolveWallBounce(arena, opponent);
  }

  _triggerPhase2Awakening() {
    this.phase2Triggered = true;
    this.isPhase2 = true;
    this._playAvatarSfx('phase2NeckSnap', 'avatar_phase2_neck_snap');
    this._playAvatarSfx('phase2FaceManifest', 'avatar_phase2_manifest');
    this._spawnShockwave(this.x, this.y, 210, '#9D4EDD', '#FF0055', 'rgba(157, 78, 221, 0.22)');
    if (typeof triggerGlobalScreenShake === 'function') {
      triggerGlobalScreenShake(7.5, 22);
    }
    if (typeof spawnFloatingText === 'function') {
      spawnFloatingText(this.x, this.y - this.r - 18, 'EMPTINESS AWAKENS', '#9D4EDD');
    }
  }

  _spawnShockwave(x, y, maxRadius, color, secondaryColor, washColor = null, maxLife = 34) {
    this.activeShockwaves.push({
      x,
      y,
      maxRadius,
      color,
      secondaryColor,
      washColor,
      life: maxLife,
      maxLife,
      waveCount: 3
    });
  }

  _spawnVoidBlot(x, y, radius = 48, duration = 72) {
    this.activeVoidBlots.push({
      x,
      y,
      angle: Math.random() * Math.PI * 2,
      radius,
      timer: duration,
      maxTimer: duration,
      variant: Math.floor(Math.random() * 2)
    });
  }

  // ─────────────────────────────────────────────
  // Basic Attack: Antimatter Void Blasts
  // ─────────────────────────────────────────────
  shoot(opponentOrIdx, targetAngle) {
    const cfg = this._getCfg();
    if (!isSkillEnabled(cfg.enableVoidBlasts, true)) return false;

    let opponent = (opponentOrIdx && typeof opponentOrIdx === 'object') ? opponentOrIdx : null;
    if (!opponent && typeof state !== 'undefined' && Array.isArray(state.fighters)) {
      opponent = state.fighters.find(f => f && f !== this && !this.isTeammate(f) && f.hp > 0 && !f.dead) || null;
    }

    this.basicVolleyCount++;
    const blastCount = cfg.blastCount || 3;
    const spreadAngle = cfg.blastSpreadAngle || 0.35;
    const baseAngle = targetAngle ?? (opponent ? Math.atan2(opponent.y - this.y, opponent.x - this.x) : (this.gunAngle ?? 0));
    const damage = cfg.blastDamage || 15;
    const speed = cfg.blastSpeed || 11.0;
    const homingStrength = cfg.blastHomingStrength || 0.065;
    const useCometCenter = (this.basicVolleyCount % 3 === 0);

    for (let i = 0; i < blastCount; i++) {
      const angleOffset = blastCount === 1 ? 0 : (-spreadAngle / 2 + (i / (blastCount - 1)) * spreadAngle);
      const blastAngle = baseAngle + angleOffset;
      const isComet = useCometCenter && i === Math.floor(blastCount / 2);

      const p = {
        x: this.x + Math.cos(blastAngle) * (this.r * 1.15),
        y: this.y + Math.sin(blastAngle) * (this.r * 1.15),
        vx: Math.cos(blastAngle) * (isComet ? speed * 1.25 : speed),
        vy: Math.sin(blastAngle) * (isComet ? speed * 1.25 : speed),
        radius: isComet ? (cfg.blastRadius || 7) + 2 : (cfg.blastRadius || 7),
        damage: isComet ? Math.round(damage * 1.25) : damage,
        color: isComet ? '#00F5D4' : (cfg.blastColor || '#9D4EDD'),
        secondaryColor: isComet ? '#FFFFFF' : '#00F5D4',
        owner: this,
        homing: true,
        homingStrength,
        target: opponent,
        life: cfg.blastLife || 140,
        isVoidBlast: true,
        isComet,
        update: function() {
          this.life--;
          if (this.life <= 0) return false;
          if (this.target && this.target.hp > 0 && !this.target.dead) {
            const desiredAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            const curAngle = Math.atan2(this.vy, this.vx);
            const diff = normalizeAngle(desiredAngle - curAngle);
            const turn = Math.sign(diff) * Math.min(Math.abs(diff), this.homingStrength);
            const newAngle = curAngle + turn;
            const curSpd = Math.hypot(this.vx, this.vy);
            this.vx = Math.cos(newAngle) * curSpd;
            this.vy = Math.sin(newAngle) * curSpd;
          }
          this.x += this.vx;
          this.y += this.vy;
          return true;
        },
        draw: function(ctx) {
          drawAntimatterBlastProjectile(ctx, this);
        }
      };

      if (typeof projectileSystem !== 'undefined' && projectileSystem.addCustomProjectile) {
        projectileSystem.addCustomProjectile(p);
      } else if (typeof state !== 'undefined' && Array.isArray(state.projectiles)) {
        state.projectiles.push(p);
      }
    }

    this._playAvatarSfx(['riftShoot1', 'riftShoot2', 'riftShoot3'], 'avatar_rift_shoot');
    const cdBase = this.cooldown || 34;
    this.shootCooldown = this.isPhase2 ? Math.max(20, Math.round(cdBase * 0.85)) : cdBase;
    return true;
  }

  // ─────────────────────────────────────────────
  // Skill 1: Cryonic Absolute Zero (Frost Pulse & Columns)
  // ─────────────────────────────────────────────
  castCryonicZero(opponent) {
    const cfg = this._getCfg();
    if (!isSkillEnabled(cfg.enableCryonicZero, true) || this.cryonicCooldown > 0) return false;

    this.currentUniverse = 'cryonic';
    this.cryonicCooldown = cfg.cryonicCooldown || 360;
    const radius = cfg.cryonicRadius || 130;
    const damage = cfg.cryonicDamage || 30;
    const colCount = cfg.cryonicColumnsCount || 3;

    const columns = [];
    const anchorX = opponent ? opponent.x : this.x;
    const anchorY = opponent ? opponent.y : this.y;
    for (let i = 0; i < colCount; i++) {
      const a = (i / colCount) * Math.PI * 2;
      const spread = 32 + Math.random() * 28;
      columns.push({
        x: anchorX + Math.cos(a) * spread,
        y: anchorY + Math.sin(a) * spread,
        hitDealt: false
      });
    }

    this.activeCryonicZones.push({
      x: this.x,
      y: this.y,
      radius,
      timer: cfg.cryonicDuration || 150,
      maxTimer: cfg.cryonicDuration || 150,
      columns
    });

    const targets = this.getValidTargets();
    for (const t of targets) {
      const dist = Math.hypot(t.x - this.x, t.y - this.y);
      if (dist <= radius + (t.radius || 25)) {
        applyDamageToTarget(t, damage, this);
        if (typeof t.applySlow === 'function') {
          t.applySlow(90, 1.0 - (cfg.cryonicChillSlowPct || 0.45));
        } else if (t.vx !== undefined && t.vy !== undefined) {
          t.vx *= (1.0 - (cfg.cryonicChillSlowPct || 0.45));
          t.vy *= (1.0 - (cfg.cryonicChillSlowPct || 0.45));
        }
        if (typeof spawnSparks === 'function') spawnSparks(t.x, t.y, 10, 'cyan', '#00F5D4');
      }
    }

    this._spawnShockwave(this.x, this.y, radius * 1.18, '#00F5D4', '#FFFFFF', 'rgba(0, 245, 212, 0.16)', 32);
    this._playAvatarSfx(['absoluteZeroWave', 'frostColumnBurst'], 'avatar_frost_column_burst');
    if (typeof triggerGlobalScreenShake === 'function') {
      triggerGlobalScreenShake(4.8, 14);
    }
    return true;
  }

  // ─────────────────────────────────────────────
  // Skill 2: Visceral Blood Torrent (Vortex Whirlpool)
  // ─────────────────────────────────────────────
  castVisceralTorrent(opponent) {
    const cfg = this._getCfg();
    if (!isSkillEnabled(cfg.enableVisceralTorrent, true) || this.visceralCooldown > 0) return false;

    this.currentUniverse = 'visceral';
    const angle = opponent ? Math.atan2(opponent.y - this.y, opponent.x - this.x) : (this.gunAngle || 0);
    this.visceralCastAngle = angle;
    this.gunAngle = angle;
    this.angle = angle;
    this.visceralDurationMax = cfg.visceralDuration || 90;
    this.visceralActiveTimer = this.visceralDurationMax;
    this.visceralCooldown = cfg.visceralCooldown || 390;

    const reach = cfg.visceralReach || 155;
    const arc = cfg.visceralArc || (Math.PI * 0.88);
    const damage = cfg.visceralDamage || 38;
    const knockback = cfg.visceralKnockback || 13.0;

    const targets = this.getValidTargets();
    for (const t of targets) {
      const dx = t.x - this.x;
      const dy = t.y - this.y;
      const dist = Math.hypot(dx, dy);
      const angleDiff = normalizeAngle(Math.atan2(dy, dx) - angle);

      if (dist <= reach + (t.radius || 25) && Math.abs(angleDiff) <= arc / 2) {
        applyDamageToTarget(t, damage, this);
        if (typeof t.applyKnockback === 'function') {
          t.applyKnockback(Math.cos(angle) * knockback, Math.sin(angle) * knockback, 16);
        } else {
          t.vx += Math.cos(angle) * knockback;
          t.vy += Math.sin(angle) * knockback;
        }
        if (typeof spawnSparks === 'function') spawnSparks(t.x, t.y, 12, 'red', '#FF0055');
      }
    }

    this._spawnShockwave(this.x + Math.cos(angle) * 40, this.y + Math.sin(angle) * 40, reach, '#FF0055', '#9D4EDD', 'rgba(255, 0, 85, 0.16)', 28);
    this._playAvatarSfx(['bloodFountainErupt', 'realityImpact'], 'avatar_reality_impact');
    if (typeof triggerGlobalScreenShake === 'function') {
      triggerGlobalScreenShake(5.5, 16);
    }
    return true;
  }

  // ─────────────────────────────────────────────
  // Skill 3: Dark Dimension Portal Strikes
  // ─────────────────────────────────────────────
  castPortalStrikes(opponent) {
    const cfg = this._getCfg();
    if (!isSkillEnabled(cfg.enablePortalStrikes, true) || this.portalCooldown > 0 || !opponent) return false;

    this.currentUniverse = 'dark';
    this.portalCooldown = cfg.portalCooldown || 480;
    const strikeCount = this.isPhase2 ? (cfg.portalStrikesCount || 4) + 1 : (cfg.portalStrikesCount || 4);
    const interval = cfg.portalStrikeInterval || 12;
    const targetX = opponent.x;
    const targetY = opponent.y;

    for (let i = 0; i < strikeCount; i++) {
      const strikeAngle = (i * (Math.PI * 2 / strikeCount)) + (Math.random() - 0.5) * 0.35;
      const offsetDist = 58 + Math.random() * 18;
      this.activePortalStrikes.push({
        x: targetX + Math.cos(strikeAngle) * offsetDist,
        y: targetY + Math.sin(strikeAngle) * offsetDist,
        angle: strikeAngle + Math.PI,
        timer: 26,
        maxTimer: 26,
        delay: i * interval,
        damage: cfg.portalStrikeDamage || 12,
        hasStruck: false,
        hasPlayedOpen: false,
        target: opponent
      });
    }

    this._playAvatarSfx(['erasureRiftOpen1', 'erasureRiftOpen2', 'erasureRiftOpen3'], 'avatar_erasure_open');
    this._playAvatarSfx(['portalHandReach1', 'portalHandReach2', 'portalHandReach3'], 'avatar_portal_hand_reach');
    return true;
  }

  // ─────────────────────────────────────────────
  // Ultimate: Universal Annihilation
  // ─────────────────────────────────────────────
  castUniversalAnnihilation(opponent) {
    const cfg = this._getCfg();
    if (!isSkillEnabled(cfg.enableUniversalAnnihilation, true) || this.annihilationCooldown > 0) return false;

    this.currentUniverse = 'dark';
    const angle = opponent ? Math.atan2(opponent.y - this.y, opponent.x - this.x) : (this.gunAngle || 0);
    this.annihilationCastAngle = angle;
    this.gunAngle = angle;
    this.angle = angle;
    this.annihilationWindupTimer = this.annihilationWindupMax;
    this.annihilationFireTimer = 0;
    this.annihilationRecoveryTimer = 0;
    this.annihilationCooldown = cfg.annihilationCooldown || 880;

    this._playAvatarSfx('annihilationCharge', 'avatar_annihilation_charge');
    this._spawnShockwave(this.x, this.y, 160, '#FFFFFF', '#00F5D4', 'rgba(157, 78, 221, 0.15)', 40);
    return true;
  }

  getValidTargets() {
    const targets = [];
    if (typeof state !== 'undefined') {
      if (Array.isArray(state.fighters)) {
        for (const f of state.fighters) {
          if (f && f !== this && !this.isTeammate(f) && f.hp > 0 && !f.dead) {
            targets.push(f);
          }
        }
      }
      if (Array.isArray(state.illusions)) {
        for (const ill of state.illusions) {
          if (ill && ill.owner !== this && ill.hp > 0) {
            targets.push(ill);
          }
        }
      }
    }
    return targets;
  }

  /**
   * Rule 25 Top-of-Update Visual Effect Decay:
   * Must run BEFORE _handleTimeStop() so active shockwaves, void blots, cryo visuals,
   * and portal visuals never freeze mid-air when Avatar is time-stopped or hit-paused.
   */
  _updateVisualDecay(allowCombatTriggers = false) {
    for (let i = this.activeShockwaves.length - 1; i >= 0; i--) {
      this.activeShockwaves[i].life--;
      if (this.activeShockwaves[i].life <= 0) {
        this.activeShockwaves.splice(i, 1);
      }
    }

    for (let i = this.activeVoidBlots.length - 1; i >= 0; i--) {
      const vb = this.activeVoidBlots[i];
      vb.timer--;
      if (vb.timer <= 0) {
        this.activeVoidBlots.splice(i, 1);
      }
    }

    for (let i = this.activeCryonicZones.length - 1; i >= 0; i--) {
      const z = this.activeCryonicZones[i];
      z.timer--;
      if (z.timer <= 0) {
        this.activeCryonicZones.splice(i, 1);
      }
    }

    for (let i = this.activePortalStrikes.length - 1; i >= 0; i--) {
      const ps = this.activePortalStrikes[i];
      if (ps.delay > 0) {
        ps.delay--;
        continue;
      }
      ps.timer--;

      if (allowCombatTriggers && !ps.hasStruck && ps.timer <= 14) {
        ps.hasStruck = true;
        if (ps.target && ps.target.hp > 0 && !ps.target.dead) {
          applyDamageToTarget(ps.target, ps.damage, this, { skipInterrupt: true });
          if (typeof ps.target.applyHitStun === 'function') ps.target.applyHitStun(10);
          if (typeof spawnSparks === 'function') spawnSparks(ps.target.x, ps.target.y, 8, 'purple', '#9D4EDD');
          this._playAvatarSfx(['portalPierce1', 'portalPierce2', 'portalPierce3', 'portalPierce4'], 'avatar_portal_pierce');
          this._spawnVoidBlot(ps.x, ps.y, 40, 48);
        }
      }

      if (ps.timer <= 0) {
        if (allowCombatTriggers) {
          this._playAvatarSfx(['erasureRiftClose1', 'erasureRiftClose2'], 'avatar_erasure_close', 0.45);
        }
        this.activePortalStrikes.splice(i, 1);
      }
    }
  }

  _updateChannelingLoop(cfg, arena) {
    const isChanneling = (this.annihilationWindupTimer > 0 || this.annihilationFireTimer > 0 || this.annihilationRecoveryTimer > 0);
    if (!isChanneling) return false;

    if (this.annihilationWindupTimer > 0) {
      this.annihilationWindupTimer--;
      this.vx = 0;
      this.vy = 0;
      if (this.annihilationWindupTimer === 0) {
        this.annihilationFireTimer = this.annihilationFireMax;
        this._playAvatarSfx('annihilationBlast', 'avatar_annihilation_blast');
        if (typeof playLoopingSound === 'function') playLoopingSound('avatar_annihilation_loop');
        this._spawnShockwave(this.x, this.y, 240, '#FFFFFF', '#9D4EDD', 'rgba(0, 245, 212, 0.20)', 36);
      }
    } else if (this.annihilationFireTimer > 0) {
      this.annihilationFireTimer--;
      const recoil = cfg.annihilationRecoil || 3.5;
      this.vx = -Math.cos(this.annihilationCastAngle) * recoil;
      this.vy = -Math.sin(this.annihilationCastAngle) * recoil;
      this.applyMovementPhysics(0);
      if (arena) this.resolveWallBounce(arena);

      if (typeof triggerGlobalScreenShake === 'function') {
        triggerGlobalScreenShake(cfg.annihilationScreenShake || 7.0, 4);
      }

      if (this.annihilationFireTimer % this.annihilationTickRate === 0) {
        const beamAngle = this.annihilationCastAngle;
        const beamLength = cfg.annihilationBeamLength || 1300;
        const halfWidth = (this.annihilationBeamWidth || 52) * 0.55;
        const cosB = Math.cos(beamAngle);
        const sinB = Math.sin(beamAngle);

        for (const t of this.getValidTargets()) {
          const dx = t.x - this.x;
          const dy = t.y - this.y;
          const projDist = dx * cosB + dy * sinB;
          const perpDist = Math.abs(-dx * sinB + dy * cosB);
          if (projDist > 0 && projDist <= beamLength && perpDist <= (halfWidth + (t.radius || 25))) {
            applyDamageToTarget(t, this.annihilationDamageTick, this, { skipInterrupt: true });
            if (typeof t.applyHitStun === 'function') t.applyHitStun(8);
            if (typeof spawnSparks === 'function') spawnSparks(t.x, t.y, 5, 'cyan', '#00F5D4');
          }
        }
      }

      if (this.annihilationFireTimer === 0) {
        this.annihilationRecoveryTimer = this.annihilationRecoveryMax;
        if (typeof stopLoopingSound === 'function') stopLoopingSound('avatar_annihilation_loop');
        this._playAvatarSfx(['realityShatter1', 'realityShatter2'], 'avatar_reality_shatter');
        this._playAvatarSfx('deadStarExplode', 'avatar_dead_star_explode');
        this._spawnShockwave(this.x + Math.cos(this.annihilationCastAngle) * 70, this.y + Math.sin(this.annihilationCastAngle) * 70, 260, '#FFFFFF', '#FF0055', 'rgba(157, 78, 221, 0.22)', 42);
        if (typeof spawnImpactFlash === 'function') spawnImpactFlash(this.x, this.y, 120, '#9D4EDD');
      }
    } else if (this.annihilationRecoveryTimer > 0) {
      this.annihilationRecoveryTimer--;
      this.vx *= 0.85;
      this.vy *= 0.85;
      if (this.annihilationRecoveryTimer === 0) {
        this.annihilationCooldown = cfg.annihilationCooldown || 880;
      }
    }

    this.shootCooldown = Math.max(this.shootCooldown || 0, 30);
    return true;
  }

  update(opponent, ownerIndex, arena) {
    // Top-Level Freeze / TimeStop Guard (Rule 1.1 + Rule 25 non-freezing visual decay)
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this._updateVisualDecay(false);
      this.interruptAttacks();
      return;
    }

    this._updateVisualDecay(true);
    const cfg = this._getCfg();

    // Check Phase 2 Awakening
    if (!this.phase2Triggered && this.hp > 0 && this.hp <= this.maxHp * (getAvatarSetting(cfg, 'phase2HpThreshold') ?? 0.55)) {
      this._triggerPhase2Awakening();
    }

    const isChanneling = (this.annihilationWindupTimer > 0 || this.annihilationFireTimer > 0 || this.annihilationRecoveryTimer > 0);
    if (this.cryonicCooldown > 0) this.cryonicCooldown--;
    if (this.visceralCooldown > 0) this.visceralCooldown--;
    if (this.visceralActiveTimer > 0) this.visceralActiveTimer--;
    if (this.portalCooldown > 0) this.portalCooldown--;
    if (!isChanneling && this.annihilationCooldown > 0) {
      this.annihilationCooldown--;
    }

    // Visceral Whirlpool continuous pull while active
    if (this.visceralActiveTimer > 0) {
      const pullForce = getAvatarSetting(cfg, 'visceralPullForce') ?? 0.42;
      for (const t of this.getValidTargets()) {
        if (t.isImmovable || t.isKnockbackImmune) continue;
        const dx = this.x - t.x;
        const dy = this.y - t.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 45 && dist <= this.visceralReach * 1.25 && t.vx !== undefined && t.vy !== undefined) {
          t.vx += (dx / dist) * pullForce;
          t.vy += (dy / dist) * pullForce;
        }
      }
    }

    // Universal Annihilation state progression
    if (this._updateChannelingLoop(cfg, arena)) {
      return;
    }

    // AI Combat Decision Matrix
    if (opponent && opponent.hp > 0 && !opponent.dead && !this.isTeammate(opponent)) {
      const dist = Math.hypot(opponent.x - this.x, opponent.y - this.y);
      if (this.annihilationCooldown <= 0 && isSkillEnabled(cfg.enableUniversalAnnihilation, true)) {
        this.castUniversalAnnihilation(opponent);
        return;
      } else if (dist < 165 && this.visceralCooldown <= 0 && isSkillEnabled(cfg.enableVisceralTorrent, true)) {
        this.castVisceralTorrent(opponent);
      } else if (dist < 145 && this.cryonicCooldown <= 0 && isSkillEnabled(cfg.enableCryonicZero, true)) {
        this.castCryonicZero(opponent);
      } else if (dist > 155 && this.portalCooldown <= 0 && isSkillEnabled(cfg.enablePortalStrikes, true)) {
        this.castPortalStrikes(opponent);
      }
    }

    super.update(opponent, ownerIndex, arena);
  }

  draw(ctx, opponent) {
    drawAvatarVoidBlots(ctx, this.activeVoidBlots);
    drawCryonicZeroEffects(ctx, this.activeCryonicZones);
    drawDarkPortalStrikes(ctx, this.activePortalStrikes);

    drawAvatarOfEmptinessSkin(ctx, this);
    drawAvatarWeapon(ctx, this);

    if (this.visceralActiveTimer > 0) {
      drawVisceralTorrentEffects(ctx, this);
    }

    drawAvatarShockwaves(ctx, this.activeShockwaves);

    const isRenderGameActive = (typeof state !== 'undefined' && state.gameState && state.gameState !== 'test');
    if (!isRenderGameActive) {
      if (this.annihilationWindupTimer > 0) {
        drawUniversalAnnihilationCharge(ctx, this, this.annihilationCastAngle);
      } else if (this.annihilationFireTimer > 0) {
        drawUniversalAnnihilationBeam(ctx, this, this.annihilationCastAngle, (state && state.arena));
      }
    }

    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }

  drawTopLayerBeams(ctx) {
    if (this.hp <= 0) return;
    if (this.annihilationWindupTimer > 0) {
      drawUniversalAnnihilationCharge(ctx, this, this.annihilationCastAngle);
    } else if (this.annihilationFireTimer > 0) {
      drawUniversalAnnihilationBeam(ctx, this, this.annihilationCastAngle, (state && state.arena));
    }
  }

  drawBody(ctx) {
    drawAvatarOfEmptinessSkin(ctx, this);
  }

  drawOutline(ctx) {}

  drawGun(ctx) {
    // Limb & weapon visuals handled in avatarOfEmptinessSkin / weapon graphics
  }
}
