// ═══════════════════════════════════════════════════════════════════════════
// CREEPER (Minecraft) — Character Configuration
// Adheres strictly to Rule 18 (HUD Theme Consistency), Rule 24 (Toji Standard r=25),
// Rule 23 (Basic Shoot Suppression), and Rule 32 (Universal Black Outline).
// ═══════════════════════════════════════════════════════════════════════════

export const creeperConfig = {
  id: 'creeper',
  name: 'Creeper',
  displayName: 'Creeper',
  grade: 'A',
  category: 'Gaming',
  description:
    'Iconic silent Minecraft stalker with no basic attack. Silently stalks opponents and primes a devastating white-flashing concussive blast with its signature fuse hiss upon reaching close proximity (with authentic defuse mechanics if the opponent retreats), sacrificing HP per detonation, and channeling celestial lightning to awaken as Charged Creeper.',

  // ── Base Stats ──
  r: 30,
  radius: 30,
  hp: 380,
  maxHp: 380,
  speed: 4.2,
  moveSpeed: 4.2,
  chargedSpeed: 5.4, // +28% movement pace during Charged Creeper Ultimate
  color: '#22C55E', // Minecraft Foliage Green
  themeColor: '#22C55E',
  secondaryColor: '#38BDF8', // Charged Electric Plasma Cyan
  damageNumberColor: '#22C55E',
  hideHands: true, // Creeper is a handless Minecraft mob

  // ── Basic Attack: Suppressed (Rule 23 — No Basic Attack per Minecraft Lore) ──
  basicAttackCooldown: 999999,
  basicAttackDamage: 0,
  basicAttackReach: 0,
  basicAttackKnockback: 0,

  // ── Passive: Silent Stalker & Gunpowder Core ──
  enableSilentStalker: true,
  backStalkSpeedMultiplier: 1.15, // +15% speed when closing in from behind enemy
  enableDeathDetonation: true,
  deathDetonationFrames: 45, // 0.75s hyper-flashing death sequence before final retaliatory nuke
  deathDetonationRadius: 160,
  deathDetonationDamage: 110,

  // ── Skill 1: Proximity Fuse Detonation ("Tssssss...!") ──
  enablePrimedDetonation: true,
  fuseTriggerDistance: 88, // Distance in px to initiate fuse hiss (~3.5 blocks)
  fuseCancelDistance: 120, // Distance in px where fuse cancels/defuses (~4.8 blocks)
  primeDurationFrames: 50, // ~0.83s fuse time (30 Minecraft ticks equivalent)
  detonationCooldown: 180, // ~3.0s cooldown between self-detonations
  detonationInitialCooldown: 40, // 0.66s initial delay at match start
  primeVisualScaleMax: 1.35, // Inflates to 1.35x size before blast
  baseBlastRadius: 135, // 135px 360-degree blast zone
  baseBlastDamage: 500, // Direct explosion damage
  selfDetonationHpCost: 65, // Mandatory: Creeper loses 65 HP per self-detonation
  blastKnockback: 18, // Heavy outward velocity impulse
  blastShakeIntensity: 8.0,
  blastShakeDuration: 14,

  // ── Ultimate: Charged Creeper (Lightning Awakening) ──
  enableChargedCreeper: true,
  chargedDuration: 1200, // 20.0s charged state at 60 FPS
  chargedCooldown: 1800, // 30.0s cooldown after activation
  chargedInitialCooldown: 1080, // 18.0s initial charge at round start
  chargedDamageMultiplier: 2.47, // Detonation damage boosted to ~235 dmg
  chargedRadiusMultiplier: 1.85, // Explosion radius boosted to ~250px
  chargedElectricShockDamage: 6, // Passive contact shock tick every 15 frames to touching enemies
  chargedElectricShockInterval: 15,

  // ── Assets ──
  assets: {},

  // ── Audio SFX Configuration ──
  sounds: {
    fuse: 'Assets/Sound Effects/CreeperSFX/Creeper_fuse.ogg',
    death: 'Assets/Sound Effects/CreeperSFX/Creeper_death.ogg',
    hurt1: 'Assets/Sound Effects/CreeperSFX/Creeper_hurt1.ogg',
    hurt2: 'Assets/Sound Effects/CreeperSFX/Creeper_hurt2.ogg',
    hurt3: 'Assets/Sound Effects/CreeperSFX/Creeper_hurt3.ogg',
    hurt4: 'Assets/Sound Effects/CreeperSFX/Creeper_hurt4.ogg',
    explosion1: 'Assets/Sound Effects/CreeperSFX/Explosion1.ogg',
    explosion2: 'Assets/Sound Effects/CreeperSFX/Explosion2.ogg',
    explosion3: 'Assets/Sound Effects/CreeperSFX/Explosion3.ogg',
    explosion4: 'Assets/Sound Effects/CreeperSFX/Explosion4.ogg',
  },
  soundVolumes: {
    fuse: 0.85,
    death: 1.0,
    hurt1: 0.80,
    hurt2: 0.80,
    hurt3: 0.80,
    hurt4: 0.80,
    explosion1: 0.95,
    explosion2: 0.95,
    explosion3: 0.95,
    explosion4: 0.95,
  },
};
