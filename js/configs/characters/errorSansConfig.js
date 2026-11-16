// ───────────────────────────────────────────────────────────────────────────
// ERROR SANS (Anti-Void AU Destroyer) Character Configuration
// Visuals & Audio: Extracted Error Gaster Blaster sprite sheet + FNF glitch
// badnoise bursts paired with Undertale blaster/bone SFX.
// Adheres to Rules 18, 22, 24, 32, 35.
// ───────────────────────────────────────────────────────────────────────────

export const errorSansConfig = {
  assets: {
    hair: 'Assets/model/error_sans/ErrorSans-hair.png',
    blasterSheet: 'Assets/model/error_sans/ErrorSans-gaster-blaster-sprite-sheet.png',
    errorBone: 'Assets/model/error_sans/ErrorBoneV.png',
    errorBoneStab: 'Assets/model/error_sans/ErrorBoneStabV.png',
  },

  name: 'Error Sans',
  displayName: 'ERROR SANS',
  grade: 'SS',
  title: 'Destroyer of AUs',
  category: 'Gaming',

  // ── Base Attributes (Rule 24: r = 25 -> scaled cleanly by super(def)) ──
  r: 25,
  radius: 25,
  hp: 1,                        // Authentic Sans 1 HP glass-cannon pool (backed by Dodge Stamina)
  maxHp: 1,
  maxHpRatio: 1.0,
  speed: 5.8,
  moveSpeed: 5.8,
  color: '#DD0000',             // Unified Crimson Error Theme (Rule 18)
  themeColor: '#DD0000',
  secondaryColor: '#00A0FF',    // Electric Glitch Cyan
  accentYellow: '#FFEB00',      // Error Core Yellow
  accentDark: '#0E0F14',        // Manga Ink Outline
  damageNumberColor: '#DD0000',
  startX: 300,
  startY: 250,
  startVx: 1.2,
  startVy: 1.1,
  damage: 11,
  cooldown: 56,
  ability: '1 HP Glitch Dodge, Error Strings, Error Blasters & Forced Crash',
  desc: 'The glitching Destroyer of AUs from Undertale AU lore. Carries 1 HP backed by a 100-Stamina ERROR WARP dodge system, corrupts enemies with Code Corruption DoT, binds souls in cyan Error Strings, fires crimson Error Blasters, and unleashes FORCED CRASH.',

  // ── Passive 1: 1 HP + ERROR! Glitch Warp Dodge Stamina ──
  enableGlitchDodge: true,
  enableTeleportDodge: true,
  glitchDodgeSkillName: 'ERROR WARP',
  dodgeChance: 1.0,
  domainDodgeChance: 1.0,
  dodgeStaminaMax: 100,
  dodgeStaminaCost: 10,
  damageStaminaCostMultiplier: 0.10,
  minDodgeStaminaCost: 1,
  domainDodgeStaminaCost: 1,
  dodgeStaminaRegen: 0,
  dodgeStaminaRegenDelay: 0,
  dodgeCooldown: 0,
  shotgunDodgeGraceWindow: 16,
  dodgeStallDuration: 12,
  glitchDodgeDistance: 145,
  dodgeDistance: 145,
  blasterStaminaRecoverOnHit: 0,
  afterImageLife: 22,
  afterImageMinSpeed: 4.2,
  afterImageInterval: 3,

  // ── Passive 2: Code Corruption (Error KR DoT) ──
  enableErrorKarma: true,
  errorKarmaTickDamage: 2,
  errorKarmaTickInterval: 20,
  errorKarmaMaxStacks: 8,
  errorKarmaDuration: 90,

  // ── Basic Attack: Glitch Bone Volley ──
  enableGlitchBoneBasic: true,
  basicAttackSkillName: 'Glitch Bone Volley',
  basicAttackCooldown: 56,
  basicAttackInitialCooldown: 18,
  basicBoneCount: 3,
  basicBoneDamage: 11,
  basicBoneSpeed: 9.8,
  basicBoneSpread: 0.24,
  basicBoneReach: 380,
  basicBoneLife: 54,

  // ── Unified Skill 1 Slot (Random Anti-Repeat Cycle) ──
  enableSkill1: true,
  skill1Name: 'ERROR ART',
  skill1Cooldown: 330,          // 5.5s shared Skill 1 cooldown
  skill1InitialCooldown: 105,

  // ── Skill 1A: Error Strings (Blue Puppet Tether & Yank) ──
  enableErrorStrings: true,
  errorStringsSkillName: 'BLUE STRINGS',
  errorStringsSpeed: 18.0,
  errorStringsRange: 380,
  errorStringsDuration: 42,
  errorStringsPullSpeed: 6.2,
  errorStringsDamage: 16,
  errorStringsTickDamage: 6,

  // ── Skill 1B: Error Gaster Blasters (3-Blaster Crossfire) ──
  enableErrorBlaster: true,
  errorBlasterSkillName: 'ERROR BLASTER',
  blasterStaminaCost: 1,
  errorBlasterCount: 3,
  errorBlasterChargeFrames: 20,
  errorBlasterFireFrames: 24,
  errorBlasterDamage: 5,
  errorBlasterContinuousRatio: 0.35,
  errorBlasterTickInterval: 6,
  errorBlasterBeamWidth: 34,
  errorBlasterLaserReach: 900,

  // ── Skill 1C: Glitch Zone (Anti-Void Bone Spikes + Glitch Shards) ──
  enableGlitchZone: true,
  glitchZoneSkillName: 'GLITCH ZONE',
  glitchZoneSpikeCount: 6,
  glitchZoneWarnFrames: 20,
  glitchZoneActiveFrames: 36,
  glitchZoneDamage: 18,
  glitchZoneShardCount: 6,
  glitchZoneShardSpeed: 8.6,
  glitchZoneShardDamage: 10,

  // ── Ultimate: FORCED CRASH // ANTI-VOID ERASURE ──
  enableForcedCrash: true,
  forcedCrashSkillName: 'FORCED CRASH',
  crashHitsRequired: 5,
  forcedCrashCooldown: 0,
  forcedCrashTriggerRange: 340,
  forcedCrashBindFrames: 34,
  forcedCrashBlastFrames: 34,
  forcedCrashWindowCount: 5,
  forcedCrashBlasterCount: 2,
  forcedCrashBlasterScale: 2.05,
  forcedCrashBlasterBeamWidth: 72,
  forcedCrashBlasterDamage: 16,
  forcedCrashSlamDamage: 38,
  forcedCrashKnockback: 14.5,

  // ── Sound Effects & Normalized Volumes ──
  sounds: {
    badNoise1: 'Assets/Sound Effects/ErrorSans/badnoise1.mp3',
    badNoise2: 'Assets/Sound Effects/ErrorSans/badnoise2.mp3',
    badNoise3: 'Assets/Sound Effects/ErrorSans/badnoise3.mp3',
    gasterBlaster: 'Assets/Sound Effects/Sans/GasterBlaster.ogg',
    gasterBlast: 'Assets/Sound Effects/Sans/GasterBlast.ogg',
    gasterBlast2: 'Assets/Sound Effects/Sans/GasterBlast2.ogg',
    boneStab: 'Assets/Sound Effects/Sans/BoneStab.ogg',
    slam: 'Assets/Sound Effects/Sans/Slam.ogg',
    warning: 'Assets/Sound Effects/Sans/Warning.ogg',
    flash: 'Assets/Sound Effects/Sans/Flash.ogg',
    ding: 'Assets/Sound Effects/Sans/Ding.ogg',
    sansSpeak: 'Assets/Sound Effects/Sans/SansSpeak.ogg',
    explosion: 'Assets/Sound Effects/Attacks/explosion.mp3',
  },
  soundVolumes: {
    badNoise1: 0.72,
    badNoise2: 0.72,
    badNoise3: 0.80,
    gasterBlaster: 0.78,
    gasterBlast: 0.78,
    gasterBlast2: 0.82,
    boneStab: 0.80,
    slam: 0.85,
    warning: 0.72,
    flash: 0.75,
    ding: 0.75,
    sansSpeak: 0.70,
    explosion: 0.35,
  },
  soundDelays: {
    boneStab: 0,
  },
};
