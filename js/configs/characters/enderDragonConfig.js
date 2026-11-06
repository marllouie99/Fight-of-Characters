// ─────────────────────────────────────────────
// Ender Dragon — Ruler of The End Character Config
// ─────────────────────────────────────────────
export const enderDragonConfig = {
  grade: 'S',                 // Fighter Grade: 'B' | 'A' | 'S' | 'SS' (cosmetic — see js/configs/gradeConfig.js)
  assets: {
    model: 'Assets/model/enderDragon/Ender-Dragon-Model.png',
    bossMap: 'Assets/model/enderDragon/Enderdragon.jpg',
    wings: 'Assets/model/enderDragon/Dragon-wings-sprite-sheet.png',
    deathAnimation: 'Assets/model/enderDragon/Dragon-death-animation-sprite-sheet.png',
    tailBirdeyeView: 'Assets/model/enderDragon/Dragon-tail-birdeyeview-sprite-sheet.png',
    tailBirdeyeView1: 'Assets/model/enderDragon/Dragon-tail-birdeyeview-sprite-sheet1.png',
    tailSegmented: 'Assets/model/enderDragon/Dragon-tail-segmented-sheet.png',
    tails: 'Assets/model/enderDragon/Dragon-tails-sprite-sheet.png',
    textureSkin: 'Assets/model/enderDragon/dragon-texture-skin.png',
    endCrystal: 'Assets/model/enderDragon/End-crystal-animation-sprite-sheet.png',
    disintegrationSequence: 'Assets/model/enderDragon/Ender-dragon-Disintegration-Sequence.png',
    disintegrationSequence2: 'Assets/model/enderDragon/Ender-dragon-Disintegration-Sequence2.png',
    modelSpriteSheet: 'Assets/model/enderDragon/Ender-dragon-model-sprite-sheet.png',
    modelSpriteSheet2: 'Assets/model/enderDragon/Ender-dragon-model-sprite-sheet2.png',
  },

  // ── Base Attributes ──
  hp: 520,
  speed: 4.4,
  moveSpeed: 4.4,
  r: 36,
  radius: 36,
  damage: 32,
  cooldown: 80,
  projectileSpeedMultiplier: 1.0,
  color: '#18181B', // Obsidian Charcoal
  themeColor: '#C026D3', // Void Magenta
  hudSkillBarColor: '#C026D3', // Void Magenta HUD Skill Bar Theme
  secondaryColor: '#E879F9', // Light Amethyst Glow
  eyeColor: '#D946EF', // Glowing Ender Amethyst
  acidColor: '#A21CAF', // Dragon's Breath Acid Purple
  damageNumberColor: '#C026D3',
  name: 'Ender Dragon',
  displayName: 'Ender Dragon',
  ability: 'Ruler of The End',
  bossTitle: 'Ruler of The End',
  title: 'Ruler of The End',
  desc: 'Colossal flying draconic leviathan. Bypasses terrain with void flight, shoots lingering Dragon Breath acid pools, executes kinetic wing swoops, and unleashes cataclysmic void shockwaves.',

  // ── Asset Paths ──
  textureSkinSrc: 'Assets/model/enderDragon/dragon-texture-skin.png',
  wingsSpriteSrc: 'Assets/model/enderDragon/Dragon-wings-sprite-sheet.png',
  tailsSpriteSrc: 'Assets/model/enderDragon/Dragon-tail-segmented-sheet.png',
  movementSpriteSrc: 'Assets/model/enderDragon/Dragon-wings-sprite-sheet.png',
  disintegrationSrc1: 'Assets/model/enderDragon/Ender-dragon-Disintegration-Sequence.png',
  disintegrationSrc2: 'Assets/model/enderDragon/Ender-dragon-Disintegration-Sequence2.png',

  // ── Sprite Slicing & Animation ──
  spriteSheetWidth: 1536,
  spriteSheetHeight: 1024,
  spriteRows: 2,
  spriteCols: 3,
  spriteCellWidth: 512,
  spriteCellHeight: 512,
  spriteFrameCount: 6,
  spriteTicksPerFrame: 5,
  swoopTicksPerFrame: 3,
  wingFlapDownstrokeFrame: 1, // Frame index in WING_FRAMES (0-5) that triggers the downstroke flap SFX (1 = Mid Downstroke)
  tailScale: 2.25,
  wingScale: 5.2,

  // ── Passive: Flight & Arena Physics (Natural Roaming & Wall Ricochet Standard) ──
  spinRate: 0,
  isGhostTerrain: false,
  immuneToKnockback: false,
  immuneToPush: false,
  hoverOscillationAmp: 25.0,
  hoverOscillationFreq: 0.04,
  hoverAcceleration: 0.28,
  hoverFriction: 0.93,
  hoverTargetDistanceY: 220,
  hoverOrbitWobbleAmp: 65,
  softLeashRadius: 280,

  // ── General Movement Behavior (Pillars 1-4) ──
  // 1. Dynamic Flight Paths (Perimeter Patrol & Altitude Shifts)
  patrolSpeed: 5.6,
  patrolAngularSpeed: 0.016,
  patrolRadiusRatio: 1.10,
  patrolWobbleFreq: 0.03,
  patrolWobbleAmp: 45,
  altitudeShiftInterval: 300,
  cruiseAltitude: 1.0,
  highAltitude: 1.7,
  lowAltitude: 0.4,

  // 2. Target Interception (Momentum & Kinetic Space Control)
  enableIntercept: 0, // Master toggle for Target Interception & Gale Buffet
  interceptCooldown: 360,
  interceptSpeed: 16.5,
  interceptLeadFrames: 14,
  interceptGaleReach: 75,
  interceptGaleDamage: 16,
  interceptGaleKnockback: 16.0,

  // 3. Grounded Intermissions (Perching at Central Anchor)
  enablePerch: 0, // Master toggle for Central Anchor Perching & Acid Breath
  perchInterval: 1200,
  perchGroundedDuration: 150,
  perchDescentSpeed: 3.5,
  perchBreathCooldown: 40,
  perchTakeoffShockwaveRadius: 160,
  perchTakeoffDamage: 24,
  perchTakeoffKnockback: 18.0,

  // 4. Environmental Reactivity & Phase Multipliers
  phase2HpThreshold: 0.75,
  phase3HpThreshold: 0.50,
  phase4HpThreshold: 0.25,
  phase2SpeedMult: 1.12,
  phase3SpeedMult: 1.25,
  phase4SpeedMult: 1.45,

  // ── Skill 1: Dragon's Breath / 360° Void Acid Sweep (dragonsBreath) ──
  enableFireball: true, // Master toggle for Dragon's Breath / Fireball
  enableDragonsBreath: true, // Alias for Skill 1
  fireballCooldown: 480, // 8.0s
  dragonsBreathSpinDuration: 70, // Total frames for full 360° rotation sweep (~1.2s at 60 FPS)
  dragonsBreathRecoveryFrames: 50, // Post-breath recovery/settle pause frames before resuming movement (~0.4s at 60 FPS)
  dragonsBreathFireInterval: 2, // Emits breath stream every 2 frames during rotation
  dragonsBreathStreamSpeed: 6.0, // Outward travel speed of breath puffs
  dragonsBreathStreamRadius: 14, // Hitbox radius of breath puffs
  dragonsBreathDamage: 12, // Direct hit damage per breath puff
  dragonsBreathMaxDistance: 120, // Outward reach before deploying acid pools
  fireballSpeed: 8.0,
  fireballRadius: 14,
  fireballDamage: 12,
  fireballDetonationRadius: 65,
  acidPoolDurationFrames: 180, // 3.0s lingering hazard
  acidPoolRadius: 65, // Radius of lingering Dragon's Breath acid pools
  acidTickInterval: 15, // damage tick every 0.25s
  acidDamagePerTick: 6,
  acidSlowMultiplier: 0.75, // 25% movement slow inside cloud

  // ── Skill 2: Wing Buffet / Kinetic Swoop (wingBuffet) ──
  enableSwoop: 0, // Master toggle for Wing Buffet / Kinetic Swoop
  enableWingBuffet: 0, // Alias for Skill 2
  swoopCooldown: 540, // 9.0s
  swoopWindupFrames: 14,
  swoopDurationFrames: 18,
  swoopSpeed: 18.5,
  swoopDamage: 38,
  swoopKnockback: 20.0,
  swoopReach: 80,
  swoopArc: 120 * (Math.PI / 180),
  swoopTurnaroundFrames: 8,

  // ── Skill 3 / Ultimate: Void Cataclysm & Perch (voidCataclysm) ──
  enableCataclysm: 0, // Master toggle for Ultimate: Void Cataclysm
  enableVoidCataclysm: 0, // Alias for Ultimate
  cataclysmCooldown: 1100, // ~18.3s
  cataclysmChannelFrames: 70,
  cataclysmRoarFrame: 40,
  cataclysmScreenShake: 12,
  cataclysmShockwaveRadius: 220,
  cataclysmShockwaveDamage: 65,
  cataclysmShockwaveKnockback: 22.0,
  cataclysmSecondaryFireballs: 6,
  cataclysmSecondarySpeed: 7.5,
  cataclysmSecondaryDamage: 18,

  // ── Skill 4: Off-Screen Telegraphed Divebomb Strafe (divebombStrafe) ──
  enableDivebomb: true, // Master toggle for Off-Screen Telegraphed Divebomb Strafe
  enableVoidDivebomb: true, // Alias for Skill 4
  divebombCooldown: 600, // 10.0s
  divebombSetupSpeed: 4.8, // Natural cruise flight speed when gliding to setup position (prevents sudden velocity burst)
  divebombSetupDistance: 75, // Distance past arena perimeter for off-screen telegraph positioning
  divebombTelegraphFrames: 55, // ~0.91s ground danger corridor warning
  divebombDurationFrames: 22,
  divebombSpeed: 24.5,
  divebombRecoverySpeed: 5.6, // Graceful aerodynamic cruise speed when banking and gliding back into arena (Rule 1.2)
  divebombCorridorWidth: 70, // Width of telegraph danger carpet & physical strike hitbox (hitbox is based directly off this corridor width)
  divebombHitboxRadius: 35, // Physical collision half-width derived from divebombCorridorWidth * 0.5
  divebombRadius: 35, // Alias for divebomb hitbox radius
  divebombDamage: 45,
  divebombKnockback: 22.0,
  divebombReach: 95,
  divebombAcidDeployInterval: 4,
  divebombSlowDuration: 90, // 1.5s slow debuff applied to enemies hit by divebomb (~90 frames at 60 FPS)
  divebombSlowMultiplier: 0.40, // 40% movement speed (60% slow)
  enableDivebombBreathCombo: true, // Master toggle: Chains Divebomb directly into the 360° Dragon's Breath Void Acid Sweep

  // ── End Crystal Healing Mechanics (4 Corners) ──
  enableCornerCrystals: true, // Spawns 4 End Crystals in the 4 corners of the arena
  cornerCrystalCount: 4,
  crystalTetherReach: 340, // Max distance (px) between dragon and crystal for tether healing
  crystalHealAmount: 6, // HP restored per heal tick
  crystalHealInterval: 45, // Ticks (frames) between heal pulses (~0.75s)
  crystalBacklashDamage: 60, // Damage dealt to dragon when an opponent destroys an End Crystal
  crystalAnimTicks: 3, // Pacing: ticks per animation frame (3 ticks = ~3.0s per revolution, calm & authentic to Minecraft)
  crystalDrawSize: 140, // Rendered scale size of the End Crystal sprite on screen (140px, imposing beacon scale)

  // ── Death Sequence ──
  deathAscentFrames: 120,
  deathBeamCount: 8,
  deathExplosionRadius: 180,

  // ── Audio SFX Configuration (Minecraft Ender Dragon SFX) ──
  sounds: {
    fireball: 'Assets/Sound Effects/EnderdragonSFX/Ghast_fireball4.ogg',
    fireballImpact: 'Assets/Sound Effects/EnderdragonSFX/Explosion1.ogg',
    wingFlap: 'Assets/Sound Effects/EnderdragonSFX/Ender_dragon_flap2.ogg',
    wingFlap2: 'Assets/Sound Effects/EnderdragonSFX/Ender_dragon_flap5.ogg',
    swoop: 'Assets/Sound Effects/EnderdragonSFX/Ender_dragon_flap5.ogg',
    swoopHit: 'Assets/Sound Effects/EnderdragonSFX/Explosion3.ogg',
    acidTick: 'Assets/Sound Effects/Attacks/fleshhit.mp3',
    lightning: 'Assets/Sound Effects/EnderdragonSFX/Explosion2.ogg',
    cataclysmCharge: 'Assets/Sound Effects/EnderdragonSFX/Explosion2.ogg',
    disintegration: 'Assets/Sound Effects/EnderdragonSFX/Ender_dragon_death.ogg',
    death: 'Assets/Sound Effects/EnderdragonSFX/Ender_dragon_death.ogg',
    hurt1: 'Assets/Sound Effects/EnderdragonSFX/Ender_dragon_hurt1.ogg',
    hurt2: 'Assets/Sound Effects/EnderdragonSFX/Ender_dragon_hurt2.ogg',
    hurt3: 'Assets/Sound Effects/EnderdragonSFX/Ender_dragon_hurt3.ogg',
    hurt4: 'Assets/Sound Effects/EnderdragonSFX/Ender_dragon_hurt4.ogg',
    explosion1: 'Assets/Sound Effects/EnderdragonSFX/Explosion1.ogg',
    explosion2: 'Assets/Sound Effects/EnderdragonSFX/Explosion2.ogg',
    explosion3: 'Assets/Sound Effects/EnderdragonSFX/Explosion3.ogg',
    explosion4: 'Assets/Sound Effects/EnderdragonSFX/Explosion4.ogg',
    xpPickup: 'Assets/Sound Effects/EnderdragonSFX/Successful_hit.ogg',
  },
  soundVolumes: {
    fireball: 0.85,
    fireballImpact: 0.90,
    wingFlap: 0.70,
    wingFlap2: 0.70,
    swoop: 0.90,
    swoopHit: 0.95,
    acidTick: 0.50,
    lightning: 0.85,
    disintegration: 1.0,
    death: 1.0,
    hurt1: 0.85,
    hurt2: 0.85,
    hurt3: 0.85,
    hurt4: 0.85,
    explosion1: 0.90,
    explosion2: 0.90,
    explosion3: 0.90,
    explosion4: 0.90,
    xpPickup: 0.90,
  }
};
