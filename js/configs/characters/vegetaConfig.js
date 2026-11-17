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
  basicMeleeSkillName: 'SAIYAN BEATDOWN',
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
  kiVolleySkillName: 'KI VOLLEY',
  followUpKiCount: 8,                 // Number of Ki blasts fired in follow-up volley
  followUpKiDamage: 7,                // Damage per Ki blast in follow-up volley (10 in Super Saiyan)
  followUpKiSpeed: 17,                // Projectile speed of follow-up Ki blasts (px/frame)
  followUpKiRadius: 7,                // Radius of follow-up Ki blast spheres (pixels)
  basicAttackResetCooldown: 180,      // Reset delay in frames before initiating next basic combo

  // ─── Skill 1: Big Bang Attack ───
  enableBigBang: true,                // Master toggle for Skill 1
  bigBangSkillName: 'BIG BANG',
  bigBangCooldown: 450,               // 7.5s cooldown at 60fps
  bigBangChargeFrames: 24,            // 0.4s open palm windup
  bigBangSpeed: 18,                   // Supersonic missile travel speed
  bigBangRadius: 90,                  // Blast explosion radius (120 in Super Saiyan)
  bigBangDamage: 52,                  // Burst damage (70 in Super Saiyan)
  bigBangSlowMultiplier: 0.70,        // 30% movement slow on wall impact
  bigBangSlowDuration: 72,            // 1.2s slow duration

  // ─── Skill 2: Galick Gun ───
  enableGalickGun: true,              // Master toggle for Skill 2
  galickGunSkillName: 'GALICK GUN',
  galickGunCooldown: 420,             // 7.0s cooldown at 60fps
  galickGunChargeFrames: 30,          // 0.5s chest charge
  galickGunDamage: 55,                // Burst beam damage (74 in Super Saiyan)
  galickGunWidth: 50,                 // Beam width in pixels (75 in Super Saiyan)

  // ─── Ultimate: Final Flash ───
  enableFinalFlash: true,             // Master toggle for Ultimate
  finalFlashSkillName: 'FINAL FLASH',
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
  royalPrideSkillName: 'Royal Saiyan Pride',
  prideDamageScalePer10Hp: 0.05,      // +5% bonus damage per 10% missing HP below 70%
  maxPrideDamageBonus: 0.35,          // +35% bonus cap (+70% in Super Saiyan)
  prideKnockbackReduction: 0.20,      // 20% reduced knockback below 50% HP

  // ─── Passive 2: Royal Battle Armor Carapace ───
  enableBattleArmor: true,            // Master toggle for Battle Armor
  battleArmorSkillName: 'BATTLE ARMOR',
  armorShieldMax: 50,                 // Shield capacity (absorbed first)
  armorMitigationPct: 0.20,           // 20% flat damage absorption into shield
  armorRechargeDelayFrames: 360,      // 6.0s out-of-combat recharge delay

  // ─── Super Saiyan Transformation (Stats Multiplier Buff) ───
  enableSuperSaiyan: true,            // Master toggle for Super Saiyan Transformation
  superSaiyanSkillName: 'SUPER SAIYAN',
  superSaiyanHpThreshold: 0.40,       // Health threshold to trigger transformation (40% HP)
  superSaiyanDuration: 900,           // Duration of transformation in frames (15.0s at 60fps)
  superSaiyanDmgMultiplier: 1.35,     // Damage multiplier (+35% attack power)
  superSaiyanSpeedMultiplier: 1.30,   // Movement speed multiplier (+30% speed)
  superSaiyanDamageReduction: 0.20,   // Flat incoming damage reduction (20%)
  superSaiyanDodgeChance: 0.95,       // Evasion probability while in Super Saiyan (95%)

  // ─── Z-Vanish Afterimage Dodge System (Saitama & Sans Standard) ───
  enableDodge: true,                  // Master toggle for autonomous Z-Vanish evasion
  zVanishSkillName: 'Z-Vanish Afterimage',
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

  // Sound System Configuration (DBZ MUGEN SFX & Voiceline Bank)
  sounds: {
    punch: 'Assets/Sound Effects/VegetaSFX/vegeta-punch.ogg',
    fleshHit: 'Assets/Sound Effects/VegetaSFX/vegeta-flesh-hit.ogg',
    heavyPunch: 'Assets/Sound Effects/VegetaSFX/vegeta-heavy-punch.ogg',
    dodge: 'Assets/Sound Effects/VegetaSFX/vegeta-z-vanish.ogg',
    kiBlast: 'Assets/Sound Effects/VegetaSFX/vegeta-ki-blast.ogg',
    charge: 'Assets/Sound Effects/VegetaSFX/vegeta-charge.ogg',
    beamFire: 'Assets/Sound Effects/VegetaSFX/vegeta-beam-fire.ogg',
    transform: 'Assets/Sound Effects/VegetaSFX/vegeta-ssj-transform.ogg',
    ssjAuraAmbience: 'Assets/Sound Effects/GokuSFX/dbz-ssj-aura-ambience.ogg',
    roar: 'Assets/Sound Effects/VegetaSFX/vegeta-ssj-transform.ogg',
    explosion: 'Assets/Sound Effects/VegetaSFX/vegeta-explosion.ogg',
    meleeVoiceline1: 'Assets/Sound Effects/VegetaSFX/vegeta-melee-voiceline1.ogg',
    meleeVoiceline2: 'Assets/Sound Effects/VegetaSFX/vegeta-melee-voiceline2.ogg',
    kiBlastVoiceline: 'Assets/Sound Effects/VegetaSFX/vegeta-kiblast-voiceline.ogg',
    bigBangVoiceline: 'Assets/Sound Effects/VegetaSFX/vegeta-big-bang-voiceline.ogg',
    galickGunVoiceline: 'Assets/Sound Effects/VegetaSFX/vegeta-galick-gun-voiceline.ogg',
    ssjVoiceline: 'Assets/Sound Effects/VegetaSFX/vegeta-ssj-voiceline.ogg',
    finalFlashChargeVoiceline: 'Assets/Sound Effects/VegetaSFX/vegeta-final-flash-charge-voiceline.ogg',
    finalFlashFireVoiceline: 'Assets/Sound Effects/VegetaSFX/vegeta-final-flash-fire-voiceline.ogg'
  },

  soundVolumes: {
    punch: 0.85,
    fleshHit: 0.90,
    heavyPunch: 0.90,
    dodge: 0.80,
    kiBlast: 0.72,
    charge: 0.90,
    beamFire: 1.05,
    transform: 0.95,
    ssjAuraAmbience: 0.45,
    roar: 0.88,
    explosion: 0.95,
    meleeVoiceline1: 0.85,
    meleeVoiceline2: 0.85,
    kiBlastVoiceline: 0.82,
    bigBangVoiceline: 0.95,
    galickGunVoiceline: 0.95,
    ssjVoiceline: 0.98,
    finalFlashChargeVoiceline: 1.00,
    finalFlashFireVoiceline: 1.05
  },

  soundChances: {
    meleeVoiceline1: 0.40,
    meleeVoiceline2: 0.45,
    kiBlastVoiceline: 0.35,
    bigBangVoiceline: 0.90,
    galickGunVoiceline: 0.90,
    ssjVoiceline: 1.0,
    finalFlashChargeVoiceline: 1.0,
    finalFlashFireVoiceline: 1.0
  }
};

