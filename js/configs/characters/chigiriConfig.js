// ─────────────────────────────────────────────
// Hyoma Chigiri Character Config
// Blue Lock Series — Striker #44 & The Red Panther (Mach Pace)
// ─────────────────────────────────────────────

export const chigiriConfig = {
  assets: {
    hair: 'Assets/model/chigiri/Chigiri_hair.png',
  },

  name: 'CHIGIRI',
  displayName: 'Hyoma Chigiri',
  grade: 'S', // Fighter Grade: 'B' | 'A' | 'S' | 'SS' | 'SSR'
  bossTitle: 'The Red Panther',
  title: '44-Panther Mach Pace',

  // Baseline Attributes (Rule 24 Humanoid Standard: r = 25)
  hp: 400,
  maxHpRatio: 1.0,
  speed: 6.4, // Exceptional base speed — fastest sprinter in Blue Lock!
  moveSpeed: 6.5,
  r: 25,
  radius: 25,
  color: '#EC4899', // Hot Rose Pink
  themeColor: '#EC4899',
  damageNumberColor: '#EC4899', // Unified Character Palette Standard (Rule 18)
  secondaryColor: '#111827', // Blue Lock Dark Bodysuit
  accentRed: '#F43F5E', // Crimson Rose Panther Accent
  accentBlack: '#0E0F14', // Manga Ink Outline (Rule 24)
  startX: 300,
  startY: 250,
  startVx: 1.2,
  startVy: 1.2,
  damage: 22,
  cooldown: 32,
  projectileSpeedMultiplier: 1.0,
  attackRange: 340,
  ability: 'Panther Sprint & 44-Mach Snipe',
  desc: 'The Red Panther of Blue Lock. Wields unmatched breakaway sprint speed, dashes across the turf with Panther Sprint to gain lingering Mach speed surges, and executes explosive long-range soccer kicks.',

  // ─── Basic Attack: Panther Shot (Soccer Ball Kinetic Drive) ───
  enablePantherShot: true, // Master toggle for basic attack
  enableEgoShot: true, // Alias for soccerBallSystem compatibility
  pantherShotDamage: 22, // Direct hit damage
  pantherShotReboundDamage: 28, // Rebound bank shot damage
  pantherShotSpeed: 15.0, // High-speed travel velocity
  pantherShotRadius: 16, // Collision radius
  pantherShotCooldown: 100, // Rapid attack cadence (~0.53s)
  pantherShotMaxRebounds: 1, // Bounces once off arena walls
  kickSlowDuration: 14, // Brief duration in frames (~0.23s) of kick recovery
  kickSlowMultiplier: 0.25, // Agile recovery movement
  kickAccuracy: 0.80, // 94% kick accuracy (slight spread chance)
  maxKickSpread: (18 * Math.PI) / 180, // Default maximum spread dispersion angle (~18 deg)

  // ─── Dribble & Ball Control Profile ───
  enableDribble: true, // Master toggle for dribble mechanic
  dribbleControl: 0.90, // 90% base breakaway speed dribble (surges to 98% during Speed Surge, 100% during EGO)
  dribbleTightness: 0.65, // Ball led forward to match high-speed stride
  dribbleLeadDistance: 6, // Pushes ball forward ahead of sprint vector
  dribblePushDistance: 22, // Explosive breakaway forward push per sprint stride
  dribbleLateralWobble: 3.0, // Natural sprint footwork alternation (px)
  dribbleSpeedMultiplier: 1.15, // High breakaway pace (+15% speed while running with ball)
  dribbleStyle: 'mach_breakaway',
  dribbleTouchCadence: 8, // Rapid cadence of micro-pushes matching Mach pace

  // ─── Ball Kick Steal & Tackle Mechanics ───
  enableBallSteal: true, // Master toggle for ball kick steal mechanic
  ballStealChance: 0.50, // 50% base chance to kick/steal ball when bumping dribbler
  ballStealKickSpeed: 12.0, // Explosive breakaway pace when dislodging/stealing ball
  ballStealStaggerDuration: 16, // Frames of hitstun applied to dispossessed dribbler (~0.27s)
  ballStealCooldownPenalty: 35, // Shoot cooldown penalty applied to dribbler to prevent immediate kick

  // ─── Skill 1: Panther Sprint (Mach Breakaway Dash & Lingering Speed Surge) ───
  enablePantherSprint: true, // Master toggle for Skill 1
  pantherSprintCooldown: 240, // 4.0s cooldown — rapid mobility cadence
  pantherSprintDashDistance: 240, // Long-distance breakaway surge
  pantherSprintDashFrames: 22, // Rapid dash execution
  pantherSprintInvulnFrames: 14, // Dodge invulnerability window during initial dash
  pantherSprintSpeedBuffDuration: 150, // Brief lingering speed boost after dashing (150 frames = 2.5s)
  pantherSprintSpeedBuffMultiplier: 1.40, // +40% speed boost during post-dash surge
  pantherSprintEvadeChance: 0.35, // 35% evasive dodge chance during temporary speed boost
  pantherSprintBallInterceptionRange: 180, // Nearby ball proximity threshold to dash toward ball

  // ─── Skill 2: "STRIKER!" (Universal Blue Lock Ultimate / Signature Finisher) ───
  enableStriker: true, // Universal Blue Lock Skill 2 Master toggle
  strikerCooldown: 1080, // 18.0s cooldown
  strikerWindup: 0, // Zero pause / windup delay (instant volley strike in stride)
  strikerDamage: 72, // Heavy finishing strike damage
  strikerSpeed: 10.0, // Hypersonic volley velocity (fastest strike in Blue Lock)
  strikerRadius: 20, // Blast collision radius
  strikerKnockback: 22.0, // Blasts opponent backwards
  strikerKnockbackDuration: 14, // Knockback flight duration (frames) before applying stun afterwards
  strikerStunDuration: 90, // Stun debuff duration in frames applied after knockback (~1.5s stun)
  strikerShake: 8, // Screen shake intensity (px)
  strikerKickSlowDuration: 22, // Brief recovery duration
  strikerKickSlowMultiplier: 0.15,

  // ─── Universal Blue Lock Trait: EGO Awakening & Potential Unlocked ───
  enableEgo: true, // Master toggle for Ego mechanic
  egoTitle: '44-Panther Mach Pace', // Custom Ego Awakening Title
  maxEgoMeter: 100, // Maximum Ego capacity
  egoGainPerHit: 25, // Ego gained per standard soccer ball hit (+25% = 4 hits to fill)
  egoGainPerReboundHit: 35, // Ego gained on rebound bank shots (+35%)
  egoGainPerStrikerHit: 50, // Ego gained on heavy "STRIKER!" finisher impacts (+50%)
  egoDuration: 360, // Duration of awakened potential in frames (360 frames = 6.0s)
  egoAwakenShake: 7, // Screen shake intensity on Ego awakening
  egoHitExtensionFrames: 30, // Extra duration added per ball hit while Ego is active (~0.5s)
  egoBuffs: {
    speedMultiplier: 1.60, // Extreme +60% breakaway sprint speed! (Core user requirement)
    kickSpeedMultiplier: 1.25, // +25% ball kinetic velocity
    damageMultiplier: 1.15, // +15% kick damage
    dodgeChance: 0.25, // 25% evasive dodge chance during extreme Mach speed
  },
};
