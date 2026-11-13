// ─────────────────────────────────────────────
// Vegeta Character Config
// Dragon Ball Series
// ─────────────────────────────────────────────

export const vegetaConfig = {
  assets: {
    hair: 'Assets/model/vegeta/Pixel Art Spiky Black Hair Sprite.png',
    superSaiyanHair: 'Assets/model/vegeta/Vegeta-ssj-hair.png',
  },

  name: 'VEGETA',
  displayName: 'Vegeta',
  grade: 'SS',                 // Fighter Grade: 'B' | 'A' | 'S' | 'SS' | 'SSR'
  bossTitle: 'The Saiyan Prince',
  title: 'Prince of all Saiyans',

  // Baseline Attributes (Rule 24 Humanoid Standard)
  hp: 390,
  maxHpRatio: 1.0,
  speed: 5.4,
  moveSpeed: 5.4,
  r: 25,
  radius: 25,
  handScale: 1.0,             // Canonical brawler fist scale (evaluated via getHandSize to match Gojo/Sukuna/Yuji/Todo)
  color: '#1565C0',           // Royal Saiyan Navy
  themeColor: '#1565C0',
  secondaryColor: '#FFC107',   // Battle Armor Gold
  accentViolet: '#7C4DFF',     // Galick Gun Violet
  accentCyan: '#00E5FF',       // Big Bang Cyan
  accentBlack: '#0E0F14',      // Manga Ink Outline
  startX: 300,
  startY: 250,
  startVx: 1.0,
  startVy: 1.0,
  damage: 30,
  cooldown: 42,
  projectileSpeedMultiplier: 1.0,
  ability: 'Royal Saiyan Martial Arts, Big Bang & Final Flash',
  desc: 'The proud Prince of the Saiyan race. Basic attack is a brutal CQC Beatdown seamlessly transitioning into a backstep Rapid Ki Volley. Wields point-blank Big Bang Attacks, Galick Gun laser beams, regenerating Royal Battle Armor, Saitama/Sans Z-Vanish afterimage dodges, Super Saiyan transformation stat multipliers, and the cataclysmic Final Flash.',

  // ─── Basic Attack: Hybrid Martial Arts & Follow-Up Ki Volley Engine ───
  enableBasicMelee: true,             // Master toggle for Melee Mode Basic Attack
  initialMeleeDuration: 120,          // Duration of continuous CQC Melee Mode brawling in frames (2.0s at 60fps)
  meleeReach: 66,                     // Frontal arc strike reach in pixels (73 in Super Saiyan)
  meleeGapCloseRange: 150,            // Distance within which basic attack executes Z-Vanish step-in
  meleePunchDamage: 20,               // Hit 1 damage (27 in Super Saiyan)
  meleeElbowDamage: 24,               // Hit 2 damage (32 in Super Saiyan)
  meleeFinisherDamage: 34,            // Hit 3 finisher damage (46 in Super Saiyan)
  meleePunchCooldown: 15,             // Cadence between strikes in frames (12 in Super Saiyan)
  meleePunchAnimDuration: 10,         // Extension & retraction frame duration
  meleeTeleportAngle: 1.75,           // Flank pivot angle between combo hits
  meleeClashCooldown: 25,             // Minimum frames between clash shockwaves
  meleeBackstepDistance: 120,         // Distance vaulted backward after finisher (pixels)
  meleeModeSeparationCooldown: 180,   // Separation delay in frames before initiating next melee mode (3.0s at 60fps)
  enableFollowUpKiVolley: true,       // Master toggle for follow-up Rapid Ki Volley
  followUpKiCount: 8,                 // Number of Ki blasts fired in follow-up volley
  followUpKiDamage: 7,                // Damage per Ki blast in follow-up volley (10 in Super Saiyan)
  followUpKiSpeed: 17,                // Projectile speed of follow-up Ki blasts (px/frame)
  followUpKiRadius: 7,                // Radius of follow-up Ki blast spheres (pixels)
  basicAttackResetCooldown: 180,      // Reset delay in frames before initiating next basic combo

  // ─── Skill 1: Big Bang Attack ───
  enableBigBang: true,                // Master toggle for Skill 1
  bigBangCooldown: 450,               // 7.5s cooldown at 60fps
  bigBangChargeFrames: 24,            // 0.4s open palm windup
  bigBangSpeed: 18,                   // Supersonic missile travel speed
  bigBangRadius: 90,                  // Blast explosion radius (120 in Super Saiyan)
  bigBangDamage: 52,                  // Burst damage (70 in Super Saiyan)
  bigBangSlowMultiplier: 0.70,        // 30% movement slow on wall impact
  bigBangSlowDuration: 72,            // 1.2s slow duration

  // ─── Skill 2: Galick Gun ───
  enableGalickGun: true,              // Master toggle for Skill 2
  galickGunCooldown: 420,             // 7.0s cooldown at 60fps
  galickGunChargeFrames: 30,          // 0.5s chest charge
  galickGunDamage: 55,                // Burst beam damage (74 in Super Saiyan)
  galickGunWidth: 50,                 // Beam width in pixels (75 in Super Saiyan)

  // ─── Ultimate: Final Flash ───
  enableFinalFlash: true,             // Master toggle for Ultimate
  finalFlashCooldown: 1920,           // 32.0s cooldown at 60fps
  finalFlashChargeFrames: 75,         // 1.25s wide-arm stance charge
  finalFlashFireFrames: 48,           // Active laser cannon duration
  finalFlashBeamWidth: 90,            // Base beam width in pixels (115 in Super Saiyan)
  finalFlashTickCount: 9,             // Number of beam tick impacts
  finalFlashTickDamage: 16,           // Damage per tick (21 in Super Saiyan)
  finalFlashFinalBurstDamage: 60,     // Terminal detonation burst damage (85 in Super Saiyan)
  finalFlashRecoil: 4.2,              // Physical backward kickback velocity
  finalFlashShakeIntensity: 4.8,      // Global screen rumble amplitude

  // ─── Passive 1: Royal Saiyan Pride ───
  enableRoyalPride: true,             // Master toggle for Royal Saiyan Pride
  prideDamageScalePer10Hp: 0.05,      // +5% bonus damage per 10% missing HP below 70%
  maxPrideDamageBonus: 0.35,          // +35% bonus cap (+70% in Super Saiyan)
  prideKnockbackReduction: 0.20,      // 20% reduced knockback below 50% HP

  // ─── Passive 2: Royal Battle Armor Carapace ───
  enableBattleArmor: true,            // Master toggle for Battle Armor
  armorShieldMax: 50,                 // Shield capacity (absorbed first)
  armorMitigationPct: 0.20,           // 20% flat damage absorption into shield
  armorRechargeDelayFrames: 360,      // 6.0s out-of-combat recharge delay

  // ─── Super Saiyan Transformation (Stats Multiplier Buff) ───
  enableSuperSaiyan: true,            // Master toggle for Super Saiyan Transformation
  superSaiyanHpThreshold: 0.40,       // Health threshold to trigger transformation (40% HP)
  superSaiyanDuration: 900,           // Duration of transformation in frames (15.0s at 60fps)
  superSaiyanDmgMultiplier: 1.35,     // Damage multiplier (+35% attack power)
  superSaiyanSpeedMultiplier: 1.30,   // Movement speed multiplier (+30% speed)
  superSaiyanDamageReduction: 0.20,   // Flat incoming damage reduction (20%)
  superSaiyanDodgeChance: 0.95,       // Evasion probability while in Super Saiyan (95%)

  // ─── Z-Vanish Afterimage Dodge System (Saitama & Sans Standard) ───
  enableDodge: true,                  // Master toggle for autonomous Z-Vanish evasion
  dodgeChance: 0.85,                  // Base evasion probability against incoming attacks (85%)
  domainDodgeChance: 0.80,            // Evasion probability against Domain spatial slices (80%)
  beamDodgeChance: 0.90,              // Evasion probability against lethal super-beams (90%)
  dodgeDistance: 115,                 // Flash-step jump distance in pixels
  dodgeCooldown: 4,                   // Minimum frames between consecutive dodge teleports
  shotgunDodgeGraceWindow: 16,        // Grace window where projectile volley pellets are auto-evaded
  dodgeAfterimageCount: 2,            // Number of fading ghost afterimages spawned per dodge
  dodgeAfterimageDuration: 18,        // Lifespan of afterimages in frames
  dodgeAfterimageAlpha: 0.40,         // Opacity of afterimage ghosts
  dodgeText: 'MISS',                  // Floating combat text displayed on dodge
  dodgeTextColor: '#00E5FF',          // Cyan text color
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

