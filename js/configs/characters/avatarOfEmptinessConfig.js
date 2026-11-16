// ─────────────────────────────────────────────
// Avatar of Emptiness Character Config
// Terraria: Wrath of the Gods — The Final Manifestation
// ─────────────────────────────────────────────

export const avatarOfEmptinessConfig = {
  id: 'avatarofemptiness',
  name: 'Avatar of Emptiness',
  displayName: 'Avatar of Emptiness',
  grade: 'B',                 // Fighter Grade: 'B' | 'A' | 'S' | 'SS' (cosmetic — see js/configs/gradeConfig.js)
  category: 'Gaming',
  bossTitle: 'Sovereign of the Three Universes',
  title: 'Sovereign of the Three Universes',

  // Core Combat Stats
  hp: 460,
  maxHp: 460,
  speed: 4.7,
  moveSpeed: 4.7,
  radius: 29,
  r: 42,
  damage: 17,
  cooldown: 34,
  projectileSpeedMultiplier: 1.0,

  // Theme & Aesthetics Palette
  color: '#9D4EDD',            // Abyssal Void Amethyst
  themeColor: '#9D4EDD',       // Primary Theme Color
  secondaryColor: '#00F5D4',   // Cryonic Rift Cyan
  accentCrimson: '#FF0055',    // Visceral Blood Red
  accentCyan: '#00F5D4',       // Cryonic Cyan
  accentViolet: '#9D4EDD',     // Abyssal Amethyst
  accentDark: '#06070B',       // Antishadow Obsidian
  accentWhite: '#FFFFFF',      // Singularity Core

  ability: 'Universal Annihilation & Three Universes',
  desc: 'The incomprehensible sovereign of the Dark, Cryonic, and Visceral Universes from Terraria: Wrath of the Gods. Fires homing Antimatter Void Blasts, triggers Cryonic Absolute Zero frost outbursts, summons Visceral Blood Torrents, strikes with Dark Portal Arms, and uncages the reality-shattering "Universal Annihilation" cosmic death beam.',

  // ──────────────────────────────────────────
  // Basic Attack: Antimatter Void Blasts
  // ──────────────────────────────────────────
  enableVoidBlasts: 1,
  voidBlastsSkillName: 'Antimatter Void Blasts',
  blastDamage: 15,
  blastSpeed: 11.0,
  blastHomingStrength: 0.065,
  blastCount: 3,
  blastSpreadAngle: 0.35,
  blastLife: 140,
  blastRadius: 7,
  blastColor: '#9D4EDD',

  // ──────────────────────────────────────────
  // Skill 1: Cryonic Absolute Zero (Frost Pulse & Columns)
  // ──────────────────────────────────────────
  enableCryonicZero: 1,
  cryonicZeroSkillName: 'CRYONIC ZERO',
  cryonicCost: 0,
  cryonicCooldown: 360,
  cryonicDuration: 150,
  cryonicDamage: 30,
  cryonicRadius: 130,
  cryonicChillSlowPct: 0.45,
  cryonicColumnsCount: 3,

  // ──────────────────────────────────────────
  // Skill 2: Visceral Blood Torrent (Vortex Whirlpool)
  // ──────────────────────────────────────────
  enableVisceralTorrent: 1,
  visceralTorrentSkillName: 'VISCERAL TORRENT',
  visceralCost: 0,
  visceralCooldown: 390,
  visceralDuration: 90,
  visceralDamage: 38,
  visceralReach: 155,
  visceralArc: Math.PI * 0.88,
  visceralKnockback: 13.0,

  // ──────────────────────────────────────────
  // Skill 3: Dark Dimension Portal Strikes (Arm Jut Out)
  // ──────────────────────────────────────────
  enablePortalStrikes: 1,
  portalStrikesSkillName: 'PORTAL STRIKES',
  portalCost: 0,
  portalCooldown: 480,
  portalStrikesCount: 4,
  portalStrikeDamage: 12,
  portalStrikeInterval: 14,
  portalStrikeRange: 260,

  // ──────────────────────────────────────────
  // Ultimate: Universal Annihilation (Apocalyptic Reality Shatter)
  // ──────────────────────────────────────────
  enableUniversalAnnihilation: 1,
  universalAnnihilationSkillName: 'UNIVERSAL ANNIHILATION',
  annihilationCost: 0,
  annihilationCooldown: 880,
  annihilationInitialCooldown: 360,
  annihilationWindupFrames: 50,
  annihilationFireFrames: 95,
  annihilationRecoveryFrames: 30,
  annihilationDamageTick: 6,
  annihilationTickRate: 4,
  annihilationBeamWidth: 52,
  annihilationBeamLength: 1300,
  annihilationScreenShake: 7.0,
  annihilationRecoil: 3.5,

  // ──────────────────────────────────────────
  // Boss Poise, Phase 2 Awakening & Three Universes Passive
  // ──────────────────────────────────────────
  knockbackResist: 0.85,
  phase2HpThreshold: 0.55,
  voidBlotDamage: 10,
  voidBlotRadius: 48,
  voidBlotDuration: 72,
  visceralPullForce: 0.42,
  portalStrikeRadius: 44,

  // ──────────────────────────────────────────
  // AI Spacing & Decision Thresholds
  // ──────────────────────────────────────────
  aiPreferredDistMin: 140,
  aiPreferredDistMax: 300,
  aiAggression: 0.85,

  // ──────────────────────────────────────────
  // Sound Effects Configuration (Terraria: Wrath of the Gods)
  // ──────────────────────────────────────────
  sounds: {
    riftShoot1: 'Assets/Sound Effects/Avatar/RiftShoot1.ogg',
    riftShoot2: 'Assets/Sound Effects/Avatar/RiftShoot2.ogg',
    riftShoot3: 'Assets/Sound Effects/Avatar/RiftShoot3.ogg',
    hurt1: 'Assets/Sound Effects/Avatar/AvatarHurt1.ogg',
    hurt2: 'Assets/Sound Effects/Avatar/AvatarHurt2.ogg',
    hurt3: 'Assets/Sound Effects/Avatar/AvatarHurt3.ogg',
    absoluteZeroCharge: 'Assets/Sound Effects/Avatar/AbsoluteZeroChargeUp.ogg',
    absoluteZeroWave: 'Assets/Sound Effects/Avatar/AbsoluteZeroWave.ogg',
    frostColumnCharge: 'Assets/Sound Effects/Avatar/FrostColumnChargeUp.ogg',
    frostColumnBurst: 'Assets/Sound Effects/Avatar/FrostColumnBurst.ogg',
    arcticWind1: 'Assets/Sound Effects/Avatar/ArcticWindGust1.ogg',
    arcticWind2: 'Assets/Sound Effects/Avatar/ArcticWindGust2.ogg',
    antishadowSwirl: 'Assets/Sound Effects/Avatar/AntishadowSwirl.ogg',
    bloodFountainErupt: 'Assets/Sound Effects/Avatar/BloodFountainErupt.ogg',
    bloodVortexLoop: 'Assets/Sound Effects/Avatar/BloodVortexAmbientLoop.ogg',
    bloodCry: 'Assets/Sound Effects/Avatar/BloodCry.ogg',
    realityImpact: 'Assets/Sound Effects/Avatar/RealityImpact.ogg',
    erasureRiftOpen1: 'Assets/Sound Effects/Avatar/ErasureRiftOpen1.ogg',
    erasureRiftOpen2: 'Assets/Sound Effects/Avatar/ErasureRiftOpen2.ogg',
    erasureRiftOpen3: 'Assets/Sound Effects/Avatar/ErasureRiftOpen3.ogg',
    erasureRiftClose1: 'Assets/Sound Effects/Avatar/ErasureRiftClose1.ogg',
    erasureRiftClose2: 'Assets/Sound Effects/Avatar/ErasureRiftClose2.ogg',
    portalHandReach1: 'Assets/Sound Effects/Avatar/PortalHandReach1.ogg',
    portalHandReach2: 'Assets/Sound Effects/Avatar/PortalHandReach2.ogg',
    portalHandReach3: 'Assets/Sound Effects/Avatar/PortalHandReach3.ogg',
    portalPierce1: 'Assets/Sound Effects/Avatar/PortalPierce1.ogg',
    portalPierce2: 'Assets/Sound Effects/Avatar/PortalPierce2.ogg',
    portalPierce3: 'Assets/Sound Effects/Avatar/PortalPierce3.ogg',
    portalPierce4: 'Assets/Sound Effects/Avatar/PortalPierce4.ogg',
    armJutOut: 'Assets/Sound Effects/Avatar/ArmJutOut.ogg',
    armSwing: 'Assets/Sound Effects/Avatar/ArmSwing.ogg',
    lilyActivate: 'Assets/Sound Effects/Avatar/LilyActivate.ogg',
    lilyFireStart: 'Assets/Sound Effects/Avatar/LilyFireStart.ogg',
    annihilationCharge: 'Assets/Sound Effects/Avatar/UniversalAnnihilationCharge.ogg',
    annihilationBlast: 'Assets/Sound Effects/Avatar/UniversalAnnihilationBlast.ogg',
    annihilationLoop: 'Assets/Sound Effects/Avatar/UniversalAnnihilationLoop.ogg',
    realityShatter1: 'Assets/Sound Effects/Avatar/RealityShatter1.ogg',
    realityShatter2: 'Assets/Sound Effects/Avatar/RealityShatter2.ogg',
    deadStarExplode: 'Assets/Sound Effects/Avatar/DeadStarCoreExplode.ogg',
    phase2NeckSnap: 'Assets/Sound Effects/Avatar/Phase2IntroNeckSnap.ogg',
    phase2FaceManifest: 'Assets/Sound Effects/Avatar/Phase2IntroFaceManifest.ogg',
    roar1: 'Assets/Sound Effects/Avatar/Roar1.ogg',
    roar2: 'Assets/Sound Effects/Avatar/Roar2.ogg',
    roar3: 'Assets/Sound Effects/Avatar/Roar3.ogg'
  },

  soundVolumes: {
    riftShoot1: 0.78,
    riftShoot2: 0.78,
    riftShoot3: 0.78,
    hurt1: 0.75,
    hurt2: 0.75,
    hurt3: 0.75,
    absoluteZeroCharge: 0.85,
    absoluteZeroWave: 0.90,
    frostColumnCharge: 0.80,
    frostColumnBurst: 0.88,
    arcticWind1: 0.70,
    arcticWind2: 0.70,
    antishadowSwirl: 0.85,
    bloodFountainErupt: 0.88,
    bloodVortexLoop: 0.70,
    bloodCry: 0.82,
    realityImpact: 0.88,
    erasureRiftOpen1: 0.75,
    erasureRiftOpen2: 0.75,
    erasureRiftOpen3: 0.75,
    erasureRiftClose1: 0.70,
    erasureRiftClose2: 0.70,
    portalHandReach1: 0.82,
    portalHandReach2: 0.82,
    portalHandReach3: 0.82,
    portalPierce1: 0.84,
    portalPierce2: 0.84,
    portalPierce3: 0.84,
    portalPierce4: 0.84,
    armJutOut: 0.80,
    armSwing: 0.76,
    lilyActivate: 0.85,
    lilyFireStart: 0.88,
    annihilationCharge: 0.95,
    annihilationBlast: 1.05,
    annihilationLoop: 0.85,
    realityShatter1: 0.95,
    realityShatter2: 0.95,
    deadStarExplode: 0.92,
    phase2NeckSnap: 0.88,
    phase2FaceManifest: 0.90,
    roar1: 0.88,
    roar2: 0.88,
    roar3: 0.88
  }
};
