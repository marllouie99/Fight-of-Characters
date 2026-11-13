// ─────────────────────────────────────────────
// Son Goku Character Config
// Dragon Ball Series
// ─────────────────────────────────────────────

export const gokuConfig = {
  assets: {
    hair: 'Assets/model/goku/Pixel Art Spiky Black Hair Sprite.png',
    superSaiyanHair: 'Assets/model/goku/Goku-ssj-hair.png',
  },

  name: 'GOKU',
  displayName: 'Son Goku',
  grade: 'SS',                 // Fighter Grade: 'B' | 'A' | 'S' | 'SS' | 'SSR'
  bossTitle: 'The Legendary Super Saiyan',
  title: 'Earth-Raised Saiyan Hero',

  // Baseline Attributes (Rule 24 Humanoid Standard)
  hp: 380,
  maxHpRatio: 1.0,
  speed: 5.6,
  moveSpeed: 5.6,
  r: 25,
  radius: 25,
  handScale: 1.0,             // Canonical brawler fist scale (evaluated via getHandSize to match Gojo/Sukuna/Yuji/Todo)
  color: '#FF7A00',           // Turtle School Orange
  themeColor: '#FF7A00',
  secondaryColor: '#1A237E',   // Deep Indigo Underdogi
  accentGold: '#FFD700',       // Super Saiyan Aura Gold
  accentBlue: '#00E5FF',       // Kamehameha Azure
  accentBlack: '#0E0F14',      // Manga Ink Outline
  startX: 300,
  startY: 250,
  startVx: 1.0,
  startVy: 1.0,
  damage: 28,
  cooldown: 40,
  projectileSpeedMultiplier: 1.0,
  ability: 'Turtle School Hybrid Martial Arts & Super Kamehameha',
  desc: 'Earth-raised Saiyan martial artist. Basic attack is a hybrid CQC Melee combo seamlessly transitioning into a backstep Ki Blast Barrage. Wields Dragon Hammer blitzes, Kaioken guard-piercing strikes, Saitama/Sans Z-Vanish afterimage dodges, Super Saiyan transformation stat multipliers, and the cataclysmic Super Kamehameha.',

  // ─── Basic Attack: Hybrid Martial Arts & Follow-Up Ki Barrage Engine ───
  enableBasicMelee: true,             // Master toggle for Melee Mode Basic Attack
  initialMeleeDuration: 120,          // Duration of continuous CQC Melee Mode brawling in frames (2.0s at 60fps)
  meleeReach: 68,                     // Frontal arc strike reach in pixels (75 in Super Saiyan)
  meleeGapCloseRange: 150,            // Distance within which basic attack executes Z-Vanish step-in
  meleePunchDamage: 18,               // Hit 1 damage (23 in Super Saiyan)
  meleeKneeDamage: 22,                // Hit 2 damage (29 in Super Saiyan)
  meleeFinisherDamage: 32,            // Hit 3 finisher damage (42 in Super Saiyan)
  meleePunchCooldown: 14,             // Cadence between strikes in frames (11 in Super Saiyan)
  meleePunchAnimDuration: 10,         // Extension & retraction frame duration
  meleeTeleportAngle: 1.75,           // Flank pivot angle between combo hits
  meleeClashCooldown: 25,             // Minimum frames between clash shockwaves
  meleeBackstepDistance: 120,         // Distance vaulted backward after finisher (pixels)
  meleeModeSeparationCooldown: 180,   // Separation delay in frames before initiating next melee mode (3.0s at 60fps)
  enableFollowUpKiBarrage: true,      // Master toggle for follow-up Ki Blast Barrage
  followUpKiCount: 10,                 // Number of Ki blasts fired in follow-up barrage
  followUpKiDamage: 8,                // Damage per Ki blast in follow-up barrage (11 in Super Saiyan)
  followUpKiSpeed: 16,                // Projectile speed of follow-up Ki blasts (px/frame)
  followUpKiRadius: 7,                // Radius of follow-up Ki blast spheres (pixels)
  basicAttackResetCooldown: 180,      // Reset delay in frames before initiating next basic combo

  // ─── Skill 1: Dragon Hammer & Z-Burst Combo ───
  enableDragonHammer: true,           // Master toggle for Skill 1
  dragonHammerCooldown: 420,          // 7.0s cooldown at 60fps
  dragonHammerFlurryHits: 4,          // Number of rapid martial hits
  dragonHammerDamage: [12, 12, 14, 28],// Multi-strike damage distribution
  dragonHammerDuration: 36,           // Strike sequence frames
  dragonHammerWallSlow: 0.30,         // 30% movement slow on wall impact
  dragonHammerSlowDuration: 72,       // Slow duration (1.2s at 60fps)

  // ─── Skill 2: Kaioken Burst & Heavy Dragon Strike ───
  enableKaiokenStrike: true,          // Master toggle for Skill 2
  kaiokenCooldown: 390,               // 6.5s cooldown at 60fps
  kaiokenDamage: 45,                  // Burst physical damage (58 in Super Saiyan)
  kaiokenDashDistance: 200,           // Dash distance in pixels
  kaiokenDashFrames: 14,              // Dash speed in frames
  kaiokenStunFrames: 60,              // 1.0s heavy hit-stun

  // ─── Ultimate: Super Kamehameha ───
  enableKamehameha: true,             // Master toggle for Ultimate
  kamehamehaCooldown: 1800,           // 30.0s cooldown at 60fps
  kamehamehaChargeFrames: 60,         // 1.0s chanted windup
  kamehamehaFireFrames: 48,           // Active beam firing duration
  kamehamehaBeamWidth: 85,            // Base beam width in pixels (110 in Super Saiyan)
  kamehamehaTickCount: 8,             // Number of beam tick impacts
  kamehamehaTickDamage: 15,           // Damage per tick (19 in Super Saiyan)
  kamehamehaFinalBurstDamage: 50,     // Terminal detonation burst damage (65 in Super Saiyan)
  kamehamehaRecoil: 3.8,              // Physical backward kickback velocity
  kamehamehaShakeIntensity: 4.5,      // Global screen rumble amplitude

  // ─── Super Saiyan Transformation (Stats Multiplier Buff) ───
  enableSuperSaiyan: true,            // Master toggle for Super Saiyan Transformation
  superSaiyanHpThreshold: 0.35,       // Health threshold to trigger transformation (35% HP)
  superSaiyanDuration: 900,           // Duration of transformation in frames (15.0s at 60fps)
  superSaiyanDmgMultiplier: 1.30,     // Damage multiplier (+30% attack power)
  superSaiyanSpeedMultiplier: 1.35,   // Movement speed multiplier (+35% speed)
  superSaiyanDamageReduction: 0.15,   // Flat incoming damage reduction (15%)
  superSaiyanDodgeChance: 0.95,       // Evasion probability while in Super Saiyan (95%)

  // ─── Z-Vanish Afterimage Dodge System (Saitama & Sans Standard) ───
  enableDodge: true,                  // Master toggle for autonomous Z-Vanish evasion
  dodgeChance: 0.85,                  // Base evasion probability against incoming attacks (85%)
  domainDodgeChance: 0.80,            // Evasion probability against Domain spatial slices (80%)
  beamDodgeChance: 0.90,              // Evasion probability against lethal super-beams (90%)
  dodgeDistance: 120,                 // Flash-step jump distance in pixels
  dodgeCooldown: 4,                   // Minimum frames between consecutive dodge teleports
  shotgunDodgeGraceWindow: 16,        // Grace window where projectile volley pellets are auto-evaded
  dodgeAfterimageCount: 2,            // Number of fading ghost afterimages spawned per dodge
  dodgeAfterimageDuration: 18,        // Lifespan of afterimages in frames
  dodgeAfterimageAlpha: 0.40,         // Opacity of afterimage ghosts
  dodgeText: 'MISS',                  // Floating combat text displayed on dodge
  dodgeTextColor: '#FFE082',          // Gold-amber text color
  attackerTeleportChaseDelayFrames: 5,// Momentary disorientation delay for teleporting chasers

  // Sound System Configuration
  sounds: {
    punch: 'Assets/Sound Effects/Attacks/punch.mp3',
    fleshHit: 'Assets/Sound Effects/Attacks/fleshhit.mp3',
    heavyPunch: 'Assets/Sound Effects/Attacks/heavypunch1.mp3',
    dodge: 'Assets/Sound Effects/Skills/dash3.mp3',
    kiBlast: 'Assets/Sound Effects/Attacks/lasersniper1.mp3',
    beamFire: 'Assets/Sound Effects/Attacks/laserbeam.mp3',
    transform: 'Assets/Sound Effects/Skills/enhance.mp3',
    roar: 'Assets/Sound Effects/Skills/ragescream.mp3',
    explosion: 'Assets/Sound Effects/Attacks/explosion.mp3'
  },

  soundVolumes: {
    punch: 0.85,
    fleshHit: 0.90,
    heavyPunch: 0.90,
    dodge: 0.80,
    kiBlast: 0.75,
    beamFire: 1.10,
    transform: 0.95,
    roar: 0.85,
    explosion: 0.95
  }
};
