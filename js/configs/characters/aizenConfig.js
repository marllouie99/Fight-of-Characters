// ───────────────────────────────────────────────────────────────────────────
// Sōsuke Aizen — Transcendent Shinigami Config
// Bleach (Base -> Hōgyoku Fusion -> Final Form: Butterfly / Fragor)
// Adheres to Rules 18, 24, 30, 35.
// ───────────────────────────────────────────────────────────────────────────

export const aizenConfig = {
  assets: {
    hair: 'Assets/model/aizen/Aizen-hair.png',
  },

  vfxAssets: {
    kyokaShatter: 'Assets/effects/aizen/aizen-kyoka-shatter.png',
    raikohoLightning: 'Assets/effects/aizen/aizen-raikoho-lightning.png',
    raikohoBeam: 'Assets/effects/aizen/aizen-raikoho-beam.png',
    raikohoColumn: 'Assets/effects/aizen/aizen-raikoho-column.png',
    kurohitsugiCoffin: 'Assets/effects/aizen/aizen-kurohitsugi-coffin.png',
    kurohitsugiVortex: 'Assets/effects/aizen/aizen-kurohitsugi-vortex.png',
    kuroFlash: 'Assets/effects/aizen/aizen-kuro-flash.png',
    reiatsuPillar: 'Assets/effects/aizen/aizen-reiatsu-pillar.png',
    fragorBurst: 'Assets/effects/aizen/aizen-fragor-burst.png',
    bigBangPillar: 'Assets/effects/aizen/aizen-bigbang-pillar.png',
    hogyokuOrb: 'Assets/effects/aizen/aizen-hogyoku-orb.png',
    hogyokuPop: 'Assets/effects/aizen/aizen-hogyoku-pop.png',
    slashWave: 'Assets/effects/aizen/aizen-slash-wave.png',
    rikujokoroBeams: 'Assets/effects/aizen/aizen-rikujokoro-beams.png',
    multiExplosion: 'Assets/effects/aizen/aizen-multi-explosion.png',
    explosionSmoke: 'Assets/effects/aizen/aizen-explosion-smoke.png',
    darkBlast: 'Assets/effects/aizen/aizen-dark-blast.png',
    rushAura: 'Assets/effects/aizen/aizen-rush-aura.png',
    finisherBeam: 'Assets/effects/aizen/aizen-finisher-beam.png',
    thunderboltArc: 'Assets/effects/aizen/aizen-thunderbolt-arc.png',
    swallowAbyss: 'Assets/effects/aizen/aizen-swallow-abyss.png',
    vibrationRings: 'Assets/effects/aizen/aizen-vibration-rings.png',
    soulsTorture: 'Assets/effects/aizen/aizen-souls-torture.png',
    shadowWave: 'Assets/effects/aizen/aizen-shadow-wave.png',
    shellBolt: 'Assets/effects/aizen/aizen-shell-bolt.png',
    crushSmash: 'Assets/effects/aizen/aizen-crush-smash.png',
  },

  name: 'Aizen',
  displayName: 'AIZEN',
  grade: 'SS',
  title: 'Transcendent Shinigami',
  category: 'Anime',

  // ── Base Attributes (Rule 24: r = 25 -> scaled cleanly by super(def)) ──
  r: 25,
  radius: 25,
  hp: 260,
  speed: 6.0,
  moveSpeed: 6.0,
  color: '#8B5CF6',             // Unified Royal Amethyst Reiatsu Theme (Rule 18)
  themeColor: '#8B5CF6',
  secondaryColor: '#C084FC',    // Radiant Violet Highlight
  accentGold: '#FACC15',        // Hōgyoku / Raikōhō Lightning Gold
  accentCrimson: '#E11D48',     // Fragor Core Crimson
  accentDark: '#0E0F14',        // Manga Ink Outline / Kurohitsugi Black
  damageNumberColor: '#A855F7',
  startX: 300,
  startY: 250,
  startVx: 1.2,
  startVy: 1.1,
  damage: 16,
  cooldown: 28,
  projectileSpeedMultiplier: 1.0,
  ability: 'Kyōka Suigetsu, Kurohitsugi & Hōgyoku Transcendence',
  desc: 'Master of Complete Hypnosis and Kidō. Parries strikes with Kyōka Suigetsu glass-shatter counters, blasts Hadō #63 Raikōhō, crushes foes inside Hadō #90 Kurohitsugi, and ascends through Hōgyoku Fusion into Final Form Fragor.',

  // ── Basic Attack: Kyōka Suigetsu 5-Phase Zanpakutō Cleave (Rule 30) ──
  enableSwordAttack: true,
  swordSkillName: 'Kyōka Suigetsu',
  swordRange: 76,
  swordArc: 135,
  swordDamage: 16,
  swordKnockback: 7.5,
  swordCooldown: 28,
  swordLiftFrames: 6,
  swordHoldFrames: 2,
  swordStrikeFrames: 6,
  swordImpactLockFrames: 5,
  swordRecoveryFrames: 9,

  // ── Passive: Reiatsu Pressure & Hōgyoku Evolution ──
  enableHogyoku: true,
  hogyokuSkillName: 'HŌGYOKU',
  hogyokuThresholdHpRatio: 0.90,    // Evolves to Hōgyoku Form at <= 65% HP or 100% gauge
  finalFormThresholdHpRatio: 0.50,  // Evolves to Final Form at <= 32% HP
  hogyokuSpeedMultiplier: 1.20,
  hogyokuDamageMultiplier: 1.20,
  finalFormSpeedMultiplier: 1.35,
  finalFormDamageMultiplier: 1.35,
  hogyokuPassiveGainRate: 0.16,
  hogyokuHitGain: 12,
  hogyokuTransformHeal: 18,
  finalTransformHeal: 24,
  reiatsuCrushRadius: 115,
  reiatsuCrushDamage: 14,

  // ── Skill 1: Kyōka Suigetsu — Counter & Complete Hypnosis ──
  enableKyokaCounter: true,
  kyokaCounterSkillName: 'KYŌKA SUIGETSU',
  kyokaCounterCooldown: 300,        // 5.0s cooldown
  kyokaCounterWindowFrames: 34,     // Active parry stance window
  kyokaCounterDamage: 28,           // Shatter-ambush damage
  kyokaHypnosisStunFrames: 42,      // Brief illusion disorientation on counter hit
  kyokaFlashStepDist: 105,

  // ── Skill 2: Hadō #63 Raikōhō / Multi-Orbs (Hōgyoku+) / Fragor (Final Form) ──
  enableRaikoho: true,
  raikohoSkillName: 'HADŌ #63: RAIKŌHŌ',
  raikohoCooldown: 220,             // ~3.6s cooldown
  raikohoWindupFrames: 14,
  raikohoDamage: 26,
  raikohoProjectileSpeed: 13.5,
  raikohoRadius: 16,
  raikohoExplosionRadius: 68,
  hogyokuOrbCount: 3,               // Hōgyoku Form fires 3 homing/spread Reiatsu orbs
  hogyokuOrbDamage: 14,
  fragorDamage: 42,                 // Final Form Fragor sphere direct + AoE damage
  fragorRadius: 105,

  // ── Skill 3: Bakudō #81 Danku / Shunpo Reposition ──
  enableDanku: true,
  dankuSkillName: 'BAKUDŌ #81: DANKU',
  dankuCooldown: 340,
  dankuDurationFrames: 75,          // 1.25s shimmering rectangular Kido wall
  dankuRadius: 42,

  // ── Option Skill: Bakudō #61 Rikujōkōrō — Six-Beam Prison (MUGEN Especials.cns State 1300) ──
  enableRikujokoro: true,
  rikujokoroSkillName: 'RIKUJŌKŌRŌ',
  rikujokoroAllowAllForms: false,   // Base & Hōgyoku Forms (swaps to Multi Explosions in Final Form unless true)
  rikujokoroMaxHpRatio: 0.95,       // Activates once battle damage starts (<= 95% HP)
  rikujokoroCooldown: 420,          // 7.0s cooldown
  rikujokoroWindupFrames: 14,
  rikujokoroCaptureRange: 255,      // Forward Clsn1 capture sweep reach
  rikujokoroPrisonFrames: 120,      // 2.0s six-beam bind duration
  rikujokoroInitialDamage: 12,
  rikujokoroTickDamage: 3,          // Periodic seal crush tick every 15 frames (MUGEN timemod = 15,0)

  // ── Base Form MUGEN Expansions (Aizen.cns State 400 & Especials.cns 1400/1500) ──
  enableCloneAttack: true,
  cloneAttackSkillName: 'CLONE ATTACK',
  cloneAttackCooldown: 260,
  cloneAttackDamage: 16,

  enableConsecutiveSlashing: true,
  consecutiveSlashingSkillName: 'CONSECUTIVE SLASHING',
  consecutiveSlashingCooldown: 380,
  consecutiveSlashingDamage: 28,

  enableCompleteHypnosis: true,
  completeHypnosisSkillName: 'COMPLETE HYPNOSIS',
  completeHypnosisCooldown: 440,
  completeHypnosisDamage: 24,
  completeHypnosisStunFrames: 36,

  // ── Hōgyoku Form MUGEN Expansions (Hogyoku.cns States 25200–25500) ──
  enableThunderbolts: true,
  thunderboltsSkillName: 'THUNDERBOLTS',
  thunderboltsCooldown: 300,
  thunderboltsDamage: 16,

  enableSwallowGround: true,
  swallowGroundSkillName: 'SWALLOW GROUND',
  swallowGroundCooldown: 380,
  swallowGroundDamage: 32,

  enableTimeSlowing: true,
  timeSlowingSkillName: 'TIME SLOWING',
  timeSlowingCooldown: 420,
  timeSlowingDurationFrames: 110,
  timeSlowingCounterDamage: 34,

  // ── Final Form Skill: Multi Explosions Flanking Spawns (MUGEN Final Form.cns State 27200) ──
  enableMultiExplosions: true,
  multiExplosionsSkillName: 'MULTI EXPLOSIONS',
  multiExplosionsCooldown: 300,     // 5.0s cooldown in Final Form
  multiExplosionsWindupFrames: 12,
  multiExplosionsWaveInterval: 10,  // Staggered frames between bilateral flanking wave pairs
  multiExplosionsWaveDistances: [64, 88, 112, 136], // Mirrors MUGEN ±80/±100/±120/±140 flanking eruptions
  multiExplosionsRadius: 56,
  multiExplosionsDamage: 24,

  // ── Final Form MUGEN Expansions (Final Form.cns States 27000/27100/27300/27400/27500) ──
  enableRushingCrusher: true,
  rushingCrusherSkillName: 'RUSHING CRUSHER',
  rushingCrusherCooldown: 320,
  rushingCrusherDamage: 34,

  enableParalysisVibrations: true,
  paralysisVibrationsSkillName: 'PARALYSIS VIBRATIONS',
  paralysisVibrationsCooldown: 360,
  paralysisVibrationsDamage: 22,
  paralysisVibrationsStunFrames: 48,

  enableSoulsTorture: true,
  soulsTortureSkillName: 'SOULS TORTURE',
  soulsTortureCooldown: 340,
  soulsTortureDamage: 38,

  enableShadowWaves: true,
  shadowWavesSkillName: 'SHADOW WAVES',
  shadowWavesCooldown: 260,
  shadowWavesDamage: 20,

  enableShellsInevitables: true,
  shellsInevitablesSkillName: 'SHELLS INEVITABLES',
  shellsInevitablesCooldown: 300,
  shellsInevitablesDamage: 9,

  // ── Ultimate: Hadō #90 Kurohitsugi & Big Bang Explosion (Final Form) ──
  enableKurohitsugi: true,
  kurohitsugiSkillName: 'KUROHITSUGI',
  kurohitsugiCooldown: 600,         // 10.0s cooldown
  kurohitsugiCastFrames: 26,        // Coffin rise & lock
  kurohitsugiCrushFrames: 42,       // Gravity blades & compression
  kurohitsugiDamage: 52,            // Base / Hōgyoku total burst
  perfectKurohitsugiDamage: 68,     // Hōgyoku upgraded Perfect Kurohitsugi
  kurohitsugiBoxRadius: 72,
  bigBangDamage: 84,                // Final Form Big Bang Explosion (Ultra Fragor)
  bigBangRadius: 148,

  // ── Curated Extracted MUGEN Audio Paths & Normalized Volumes ──
  sounds: {
    slash1: 'Assets/Sound Effects/AizenSFX/aizen-slash1.wav',
    slash2: 'Assets/Sound Effects/AizenSFX/aizen-slash2.wav',
    hitSlash: 'Assets/Sound Effects/AizenSFX/aizen-hit-slash.wav',
    hitHeavy: 'Assets/Sound Effects/AizenSFX/aizen-hit-heavy.wav',
    shunpo: 'Assets/Sound Effects/AizenSFX/aizen-shunpo.wav',
    kyokaCounter: 'Assets/Sound Effects/AizenSFX/aizen-kyoka-counter.wav',
    kyokaHypnosis: 'Assets/Sound Effects/AizenSFX/aizen-kyoka-hypnosis.wav',
    danku: 'Assets/Sound Effects/AizenSFX/aizen-danku.wav',
    raikoho: 'Assets/Sound Effects/AizenSFX/aizen-raikoho.wav',
    kurohitsugiBox: 'Assets/Sound Effects/AizenSFX/aizen-kurohitsugi-box.wav',
    kurohitsugiCrush: 'Assets/Sound Effects/AizenSFX/aizen-kurohitsugi-crush.wav',
    kurohitsugiShatter: 'Assets/Sound Effects/AizenSFX/aizen-kurohitsugi-shatter.wav',
    hogyokuAwaken: 'Assets/Sound Effects/AizenSFX/aizen-hogyoku-awaken.wav',
    finalAwaken: 'Assets/Sound Effects/AizenSFX/aizen-final-awaken.wav',
    fragorCharge: 'Assets/Sound Effects/AizenSFX/aizen-fragor-charge.wav',
    fragorExplode: 'Assets/Sound Effects/AizenSFX/aizen-fragor-explode.wav',
    reiatsuCrush: 'Assets/Sound Effects/AizenSFX/aizen-reiatsu-crush.wav',
    voKyoka: 'Assets/Sound Effects/AizenSFX/aizen-kyoka-voiceline.wav',
    voKurohitsugi: 'Assets/Sound Effects/AizenSFX/aizen-kurohitsugi-voiceline.wav',
    voHogyoku: 'Assets/Sound Effects/AizenSFX/aizen-hogyoku-voiceline.wav',
    voFragor: 'Assets/Sound Effects/AizenSFX/aizen-fragor-voiceline.wav',
    rikujokoroCast: 'Assets/Sound Effects/AizenSFX/aizen-rikujokoro-cast.ogg',
    rikujokoroLock: 'Assets/Sound Effects/AizenSFX/aizen-rikujokoro-lock.ogg',
    multiExplosions: 'Assets/Sound Effects/AizenSFX/aizen-multi-explosions.ogg',
    multiBlast: 'Assets/Sound Effects/AizenSFX/aizen-multi-blast.ogg',
    multiHit: 'Assets/Sound Effects/AizenSFX/aizen-multi-hit.ogg',
    cloneCast: 'Assets/Sound Effects/AizenSFX/aizen-clone-cast.ogg',
    consecutiveCast: 'Assets/Sound Effects/AizenSFX/aizen-consecutive-cast.ogg',
    consecutiveFinisher: 'Assets/Sound Effects/AizenSFX/aizen-consecutive-finisher.ogg',
    hypnosisAmbush: 'Assets/Sound Effects/AizenSFX/aizen-hypnosis-ambush.ogg',
    hypnosisShatter: 'Assets/Sound Effects/AizenSFX/aizen-hypnosis-shatter.ogg',
    thunderboltsCast: 'Assets/Sound Effects/AizenSFX/aizen-thunderbolts-cast.ogg',
    thunderboltsHit: 'Assets/Sound Effects/AizenSFX/aizen-thunderbolts-hit.ogg',
    swallowCast: 'Assets/Sound Effects/AizenSFX/aizen-swallow-cast.ogg',
    swallowAbyss: 'Assets/Sound Effects/AizenSFX/aizen-swallow-abyss.ogg',
    timeSlow: 'Assets/Sound Effects/AizenSFX/aizen-time-slow.ogg',
    rushCrush: 'Assets/Sound Effects/AizenSFX/aizen-rush-crush.ogg',
    vibrations: 'Assets/Sound Effects/AizenSFX/aizen-vibrations.ogg',
    soulsTorture: 'Assets/Sound Effects/AizenSFX/aizen-souls-torture.ogg',
    soulsDrop: 'Assets/Sound Effects/AizenSFX/aizen-souls-drop.ogg',
    shadowWaves: 'Assets/Sound Effects/AizenSFX/aizen-shadow-waves.ogg',
    shadowWaveFire: 'Assets/Sound Effects/AizenSFX/aizen-shadow-wave-fire.ogg',
    shellsCast: 'Assets/Sound Effects/AizenSFX/aizen-shells-cast.ogg',
    shellFire: 'Assets/Sound Effects/AizenSFX/aizen-shell-fire.ogg',
  },

  soundVolumes: {
    slash1: 0.72,
    slash2: 0.72,
    hitSlash: 0.78,
    hitHeavy: 0.85,
    shunpo: 0.75,
    kyokaCounter: 0.88,
    kyokaHypnosis: 0.78,
    danku: 0.75,
    raikoho: 0.82,
    kurohitsugiBox: 0.85,
    kurohitsugiCrush: 0.90,
    kurohitsugiShatter: 0.92,
    hogyokuAwaken: 0.90,
    finalAwaken: 0.95,
    fragorCharge: 0.85,
    fragorExplode: 0.95,
    reiatsuCrush: 0.80,
    voKyoka: 0.88,
    voKurohitsugi: 0.92,
    voHogyoku: 0.90,
    voFragor: 0.95,
    rikujokoroCast: 0.88,
    rikujokoroLock: 0.88,
    multiExplosions: 0.92,
    multiBlast: 0.82,
    multiHit: 0.80,
    cloneCast: 0.78,
    consecutiveCast: 0.85,
    consecutiveFinisher: 0.88,
    hypnosisAmbush: 0.86,
    hypnosisShatter: 0.90,
    thunderboltsCast: 0.86,
    thunderboltsHit: 0.84,
    swallowCast: 0.86,
    swallowAbyss: 0.90,
    timeSlow: 0.86,
    rushCrush: 0.90,
    vibrations: 0.86,
    soulsTorture: 0.88,
    soulsDrop: 0.90,
    shadowWaves: 0.88,
    shadowWaveFire: 0.80,
    shellsCast: 0.88,
    shellFire: 0.78,
  },
};
