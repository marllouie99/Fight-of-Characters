// ───────────────────────────────────────────────────────────────────────────
// LAST BREATH SANS ("An Enigmatic Encounter") Character Configuration
// Extracted sprites & audio from mario1D240/undertale-last-breath-remake-bad-time-simulator:
// - Cracked Jagged Last Breath Gaster Blasters (6-frame sheet)
// - Gaster Void Hand Turrets & Yellow Void Bullets
// - Color Bones (Blue/Orange) & Rising Bone Stab Traps
// - Iconic 3-Phase Transformation ("The Slaughter Continues" -> "An Enigmatic Encounter")
// Adheres strictly to Rules 18, 22, 24, 32, 35.
// ───────────────────────────────────────────────────────────────────────────

export const lastBreathSansConfig = {
  assets: {
    hair: 'Assets/model/last_breath_sans/LastBreathSans-hair.png',
    blasterSheet: 'Assets/model/last_breath_sans/LastBreathSans-gaster-blaster-sprite-sheet.png',
    gasterHand: 'Assets/model/last_breath_sans/GasterHand.png',
    gasterBullet: 'Assets/model/last_breath_sans/GasterBullet.png',
    bone: 'Assets/model/last_breath_sans/BoneV.png',
    boneStab: 'Assets/model/last_breath_sans/BoneStabV.png',
    colorBone: 'Assets/model/last_breath_sans/ColorBoneV.png',
  },

  name: 'Last Breath Sans',
  displayName: 'LAST BREATH SANS',
  grade: 'SS',
  title: 'An Enigmatic Encounter',
  category: 'Gaming',

  // ── Base Attributes (Rule 24: r = 25 -> scaled cleanly by super(def)) ──
  r: 25,
  radius: 25,
  hp: 1,                        // Authentic 1 HP glass-cannon pool backed by Stamina & Phase 3 Second Wind
  maxHp: 1,
  maxHpRatio: 1.0,
  speed: 5.7,
  moveSpeed: 5.7,
  color: '#EF4444',             // Unified Last Breath Crimson Theme (Rule 18)
  themeColor: '#EF4444',
  secondaryColor: '#00E5FF',    // Electric Cyan Soul Eye
  accentAmber: '#FF9500',       // Enigmatic Encounter Amber/Orange Flame
  accentDark: '#0E0F14',        // Manga Ink Outline
  damageNumberColor: '#EF4444',
  startX: 300,
  startY: 250,
  startVx: 1.2,
  startVy: 1.1,
  damage: 11,
  cooldown: 52,
  ability: '3-Phase Awakening, Gaster Hand Turrets, Color Bones & Enigmatic Encounter',
  desc: 'Undertale: Last Breath Phase 1-3 Sans. Defies lethal fate with Phase 2 "The Slaughter Continues" and Phase 3 "An Enigmatic Encounter", wielding cracked Gaster Blasters, Twin Void Gaster Hand bullet turrets, Blue/Orange Color Bones, and Karma (KR).',

  // ── Passive 1: 1 HP + Last Breath Dodge Stamina & Phase Awakening ──
  enableLastBreathDodge: true,
  enableTeleportDodge: true,
  lastBreathDodgeSkillName: 'LAST BREATH',
  dodgeChance: 1.0,
  domainDodgeChance: 1.0,
  dodgeStaminaMax: 100,
  dodgeStaminaCost: 9,
  damageStaminaCostMultiplier: 0.09,
  minDodgeStaminaCost: 1,
  domainDodgeStaminaCost: 1,
  dodgeStaminaRegen: 0,
  dodgeStaminaRegenDelay: 0,
  dodgeCooldown: 0,
  shotgunDodgeGraceWindow: 16,
  dodgeStallDuration: 11,
  dodgeDistance: 148,
  afterImageLife: 22,
  afterImageMinSpeed: 4.2,
  afterImageInterval: 3,

  // Phase 2 & 3 Transformations ("It's not over yet.")
  enablePhase3Awaken: true,
  phase2StaminaThreshold: 62,   // Below 62 Stamina triggers Phase 2 chest slash + dual Color Bones
  phase2StaminaBonus: 12,       // Small resolve surge on Phase 2 awaken
  phase3ReviveStamina: 40,      // First lethal hit or 0-stamina crisis awakens Phase 3 ("An Enigmatic Encounter") once
  phase2SpeedMult: 1.08,
  phase3SpeedMult: 1.16,
  phase2CooldownMult: 0.86,
  phase3CooldownMult: 0.74,

  // ── Passive 2: Karmic Retribution (KR Poison DoT) ──
  enableKarma: true,
  karmaTickDamage: 1.5,
  karmaTickInterval: 20,
  karmaMaxStacks: 10,
  karmaDuration: 85,

  // ── Basic Attack: Bone & Color-Bone Volley ──
  enableBasicBone: true,
  basicAttackSkillName: 'Bone & Color Volley',
  basicAttackCooldown: 52,
  basicAttackInitialCooldown: 16,
  basicBoneCount: 3,
  basicBoneDamage: 11,
  basicBoneSpeed: 9.8,
  basicBoneSpread: 0.24,
  basicBoneReach: 400,
  basicBoneLife: 56,
  colorBoneFreezeFrames: 12,    // Blue Bone freeze stagger if target is moving fast

  // ── Unified Skill 1 Slot (Random Anti-Repeat Cycle) ──
  enableSkill1: true,
  skill1Name: 'LAST BREATH ART',
  skill1Cooldown: 300,          // ~5.0s shared Skill 1 cooldown (accelerated in Phase 2/3)
  skill1InitialCooldown: 95,

  // ── Skill 1A: Last Breath Cracked Gaster Blasters ──
  enableCrackedBlaster: true,
  crackedBlasterSkillName: 'CRACKED BLASTER',
  blasterStaminaCost: 1,
  blasterStaminaRecoverOnHit: 0.5,
  blasterCount: 3,
  blasterChargeFrames: 20,
  blasterFireFrames: 24,
  blasterDamage: 7,
  blasterContinuousRatio: 0.35,
  blasterTickInterval: 6,
  blasterBeamWidth: 34,
  blasterLaserReach: 920,

  // ── Skill 1B: Gaster Hand Turrets (LastBreath.csv Dual Ball + Center Blaster) ──
  enableGasterHands: true,
  gasterHandsSkillName: 'GASTER HANDS',
  gasterHandDuration: 110,
  gasterHandFireInterval: 18,
  gasterBulletSpeed: 8.6,
  gasterBulletDamage: 8,
  gasterHandCenterBlasterScale: 1.35,

  // ── Skill 1C: Bone Stab Cage & Blue Soul Slam ──
  enableBoneCage: true,
  boneCageSkillName: 'BONE CAGE SLAM',
  boneCageSpikeCount: 6,
  boneCageWarnFrames: 20,
  boneCageActiveFrames: 36,
  boneCageDamage: 18,
  boneCageSlamDamage: 12,
  boneCageSlamKnockback: 9.5,

  // ── Ultimate: AN ENIGMATIC ENCOUNTER ──
  enableEnigmaticFinale: true,
  enigmaticFinaleSkillName: 'ENIGMATIC ENCOUNTER',
  finaleHitsRequired: 5,
  enigmaticFinaleCooldown: 0,
  finaleBindFrames: 30,
  finaleBlastFrames: 42,
  finaleBlasterCount: 4,
  finaleTitanScale: 2.05,
  finaleTitanBeamWidth: 74,
  finaleBlasterDamage: 14,
  finaleSlamDamage: 36,
  finaleKnockback: 14.5,

  // ── Sound Effects & Normalized Volumes ──
  sounds: {
    biu: 'Assets/Sound Effects/LastBreathSans/biu.ogg',
    dark: 'Assets/Sound Effects/LastBreathSans/dark.ogg',
    gasterBlaster: 'Assets/Sound Effects/Sans/GasterBlaster.ogg',
    gasterBlast: 'Assets/Sound Effects/Sans/GasterBlast.ogg',
    gasterBlast2: 'Assets/Sound Effects/Sans/GasterBlast2.ogg',
    boneStab: 'Assets/Sound Effects/Sans/BoneStab.ogg',
    slam: 'Assets/Sound Effects/Sans/Slam.ogg',
    warning: 'Assets/Sound Effects/Sans/Warning.ogg',
    flash: 'Assets/Sound Effects/Sans/Flash.ogg',
    ding: 'Assets/Sound Effects/Sans/Ding.ogg',
    playerFight: 'Assets/Sound Effects/Sans/PlayerFight.ogg',
    playerDamaged: 'Assets/Sound Effects/Sans/PlayerDamaged.ogg',
    sansSpeak: 'Assets/Sound Effects/Sans/SansSpeak.ogg',
    explosion: 'Assets/Sound Effects/Attacks/explosion.mp3',
  },
  soundVolumes: {
    biu: 0.72,
    dark: 0.88,
    gasterBlaster: 0.84,
    gasterBlast: 0.80,
    gasterBlast2: 0.80,
    boneStab: 0.80,
    slam: 0.88,
    warning: 0.76,
    flash: 0.82,
    ding: 0.80,
    playerFight: 0.84,
    playerDamaged: 0.80,
    sansSpeak: 0.70,
    explosion: 0.36,
  },
};
