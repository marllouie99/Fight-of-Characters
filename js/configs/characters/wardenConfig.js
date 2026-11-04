// ═══════════════════════════════════════════════════════════════════════════
// THE WARDEN (Minecraft: The Deep Dark) — Character Configuration
// Adheres strictly to:
// - Rule 18: HUD Skill Bar Theme Consistency & Clean Architecture Standard
// - Rule 20: Canonical Default Model Hand Positioning Standard
// - Rule 21: In-Game Overlay HP & Status Drawing Standard
// - Rule 22: Hair & Head Asset Model Import (Assets/model/warden/warden-hair.png)
// - Rule 23: Basic Projectile Suppression (shoot override)
// - Rule 24: Universal Character Body Model & Scale Standard (r = 30 boss tier)
// - Rule 25: Non-Freezing Active Visual Effects Standard
// - Rule 26: Clean Concentric Shockwave Standard (Anti-Cobweb Rule)
// - Rule 30: 5-Phase Melee Combat Kinematics & Physical Force Standard
// - Rule 32: Universal Character Black Outline Standard (#0E0F14)
// ═══════════════════════════════════════════════════════════════════════════

export const wardenConfig = {
  id: 'warden',
  name: 'Warden',
  displayName: 'The Warden',
  grade: 'S', // Boss Tier: B | A | S | SS | SSR
  category: 'Gaming',
  title: 'Blind Horror of the Deep Dark',
  bossTitle: 'Sculk Behemoth',
  desc: 'Colossal blind apex predator from the Minecraft Ancient City. Cannot see standard targets; relies on vibration echolocation and scent to detect movement, attacks, and stealth. Builds relentless Anger to enter an enraged sprint, emits eerie Darkness pulses, and channels unblockable supersonic kinetic energy through its ribcage with the terrifying Sonic Boom.',

  assets: {
    hair: 'Assets/model/warden/warden-hair.png',
    sonicBoom: 'Assets/model/warden/sonic_boom/sonic_boom-b.png',
  },

  // ── Base Attributes (Rule 24 Hulking Boss Tier r = 30) ──
  r: 30,
  radius: 30,
  hp: 580,
  maxHp: 580,
  speed: 3.8, // Slow, terrifying stalking pace when calm
  moveSpeed: 3.8,
  enragedSpeed: 5.6, // Blistering rushdown speed when fully enraged (100% anger)
  color: '#0D9488', // Deep Sculk Teal
  themeColor: '#0D9488',
  secondaryColor: '#00F5D4', // Glowing Soul Cyan
  accentDark: '#07161B', // Abyssal Sculk Obsidian
  damageNumberColor: '#00F5D4',
  startX: 300,
  startY: 250,
  startVx: 1.0,
  startVy: 1.0,

  // ── Passive: Sculk Echolocation & The Anger Engine ──
  enableEcholocation: true,
  maxAnger: 100,
  angerDecayCadence: 30, // Ticks before anger decays by 1 point if no vibrations detected
  angerPerFootstep: 3, // Anger gained per enemy high-speed dash or step
  angerPerAttack: 10, // Anger gained when enemy swings/casts
  angerPerProjectile: 14, // Anger gained when enemy fires a bullet/blast
  angerPerExplosion: 25, // Massive anger spike from nearby detonations
  enragedThreshold: 100,
  enragedDuration: 360, // 6.0s duration of fully enraged state before calming
  vibrationDetectionRadius: 420,

  // ── Basic Attack: Heavy Sculk Pulverize (Rule 30 Melee Combat) ──
  enableSculkPunch: true,
  basicAttackDamage: 42,
  enragedAttackDamage: 62,
  basicAttackCooldown: 48,
  basicAttackReach: 80,
  punchKnockback: 14,
  punchLiftFrames: 8,
  punchHoldFrames: 3,
  punchStrikeFrames: 7,
  punchImpactLockFrames: 8,
  punchRecoveryFrames: 14,

  // ── Skill 1: Darkness Pulse (Deep Dark Blindness Stasis) ──
  enableDarknessPulse: true,
  darknessCooldown: 480, // 8.0s cooldown
  darknessRadius: 240,
  darknessDuration: 150, // 2.5s duration
  darknessSlowMultiplier: 0.55, // Slows caught enemies by 45%

  // ── Skill 2: Sculk Tendril Sniff (Stealth Tracking & Ground Trap) ──
  enableSculkSniff: true,
  sniffCooldown: 380, // ~6.3s cooldown
  sniffDuration: 40,
  trapDuration: 45, // 0.75s root/snare duration
  trapDamage: 24,

  // ── Ultimate: SCULK SONIC BOOM (Rule 1.4 & Rule 26 Piercing Supersonic Blast) ──
  enableSonicBoom: true,
  sonicBoomCooldown: 720, // 12.0s cooldown
  sonicBoomChargeFrames: 45, // 0.75s telegraphed chest charging
  sonicBoomBeamFrames: 24, // 0.40s active beam duration
  sonicBoomRecoveryFrames: 20,
  sonicBoomDamage: 95,
  sonicBoomReach: 520,
  sonicBoomWidth: 36,
  sonicBoomKnockback: 22,
};
