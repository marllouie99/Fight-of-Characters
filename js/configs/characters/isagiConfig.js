// ─────────────────────────────────────────────
// Isagi Yoichi Character Config
// Blue Lock Series — Striker #11 & Master of Metavision
// ─────────────────────────────────────────────

export const isagiConfig = {
  assets: {
    hair: 'Assets/model/isagi/isagi-hair.png',
    kickImpact: 'Assets/model/isagi/kick_impact/kick_impact-b.png',
  },

  name: 'ISAGI',
  displayName: 'Isagi Yoichi',
  grade: 'A', // Fighter Grade: 'B' | 'A' | 'S' | 'SS' | 'SSR'
  bossTitle: 'The Egoist Striker',
  title: 'Heart of Blue Lock',

  // Baseline Attributes (Rule 24 Humanoid Standard: r = 25)
  hp: 420,
  maxHpRatio: 1.0,
  speed: 5.2,
  moveSpeed: 5.9,
  r: 25,
  radius: 25,
  color: '#00F0FF', // Electric Ego Cyan
  themeColor: '#00F0FF',
  secondaryColor: '#111827', // Blue Lock Dark Bodysuit
  accentGreen: '#00FF88', // Metavision Flow Green
  accentBlack: '#0E0F14', // Manga Ink Outline (Rule 24)
  startX: 300,
  startY: 250,
  startVx: 1.0,
  startVy: 1.0,
  damage: 24,
  cooldown: 36,
  projectileSpeedMultiplier: 1.0,
  attackRange: 320,
  ability: 'Metavision & Direct Volley',
  desc: 'The Egoist Striker from Blue Lock. Kicks high-velocity soccer balls that ricochet off arena walls for bonus bank-shot damage, repositions into blind spots with Metavision Slip, and unleashes the devastating Direct Volley finisher.',

  // ─── Basic Attack: Ego Shot (Soccer Ball Kinetic Drive) ───
  enableEgoShot: true, // Master toggle for basic attack
  egoShotDamage: 24, // Direct hit damage
  egoShotReboundDamage: 32, // Rebound / Bank Volley damage (+33% bonus)
  egoShotSpeed: 14.5, // Fast travel velocity
  egoShotRadius: 16, // Soccer ball collision radius (scaled up for prominent arcade visibility)
  egoShotCooldown: 100, // Attack cadence (~0.57s)
  egoShotMaxRebounds: 1, // Bounces once off arena walls
  kickSlowDuration: 18, // Brief duration in frames (~0.30s) of slow recovery movement upon kicking
  kickSlowMultiplier: 0.18, // Movement speed multiplier during kick recovery (very slow crawl)
  kickAccuracy: 1.0, // 100% kick accuracy: Every kick travels perfectly straight with ZERO spread
  maxKickSpread: (18 * Math.PI) / 180, // Default maximum spread dispersion angle for Blue Lock fighters (~18 deg)

  // ─── Dribble & Ball Control Profile ───
  enableDribble: true, // Master toggle for dribble mechanic
  dribbleControl: 0.96, // 96% spatial pocket ball control (high precision, tight shielding)
  dribbleTightness: 0.85, // Ball stays close to feet in personal spatial pocket
  dribbleLeadDistance: 2, // Minimal forward offset to keep ball sheltered
  dribblePushDistance: 10, // Natural forward push impulse distance per stride
  dribbleLateralWobble: 1.5, // Subtle left/right foot alternation (px)
  dribbleSpeedMultiplier: 1.05, // Retains smooth tempo while dribbling (+5%)
  dribbleStyle: 'spatial_pocket',
  dribbleTouchCadence: 10, // Rhythmic micro-touches cadence (frames)

  // ─── Ball Kick Steal & Tackle Mechanics ───
  enableBallSteal: true, // Master toggle for ball kick steal mechanic
  ballStealChance: 0.50, // 50% base chance to kick/steal ball when bumping dribbler
  ballStealKickSpeed: 11.0, // Kinetic velocity of the dislodged/stolen ball
  ballStealStaggerDuration: 16, // Frames of hitstun applied to dispossessed dribbler (~0.27s)
  ballStealCooldownPenalty: 35, // Shoot cooldown penalty applied to dribbler to prevent immediate kick

  // ─── Skill 1: Metavision Slip (Tactical Dodge & Ball Interception Dash) ───
  enableMetavision: true, // Master toggle for Skill 1
  metavisionCooldown: 200, // 8.0s cooldown
  metavisionDashDistance: 210, // Tactical reposition distance
  metavisionDashFrames: 30, // Dash duration in frames
  metavisionInvulnFrames: 14, // Dodge invulnerability window
  metavisionFlowDuration: 180, // 3.0s Flow State buff window
  metavisionBallInterceptionRange: 160, // Nearby ball proximity threshold to trigger dash to ball
  flowShotSpeedMult: 1.5, // Projectile speed during Flow State
  flowShotCritMult: 1.35, // Guaranteed critical damage multiplier

  // ─── Skill 2: "STRIKER!" (Universal Blue Lock Ultimate / Signature Finisher) ───
  enableStriker: true, // Universal Blue Lock Skill 2 Master toggle
  enableDirectVolley: true, // Backward-compatible alias
  strikerCooldown: 1080, // 18.0s cooldown
  directVolleyCooldown: 1080, // Backward-compatible alias
  strikerWindup: 0, // Zero pause / windup delay (instant volley strike in stride)
  directVolleyWindup: 0,
  strikerDamage: 75, // Massive finishing blast damage
  directVolleyDamage: 75,
  strikerSpeed: 24.0, // Hypersonic volley velocity
  directVolleySpeed: 24.0,
  strikerRadius: 20, // Blast collision radius (scaled up)
  directVolleyRadius: 20,
  strikerKnockback: 20.0, // Blasts opponent backwards into the turf/wall
  directVolleyKnockback: 20.0,
  strikerKnockbackDuration: 14, // Knockback flight duration (frames) before applying stun afterwards
  directVolleyKnockbackDuration: 14,
  strikerStunDuration: 100, // Stun debuff duration in frames applied after knockback (~1.6s stun)
  directVolleyStunDuration: 100,
  strikerShake: 8, // Screen shake intensity (px)
  directVolleyShake: 8,
  strikerKickSlowDuration: 24, // Brief duration for heavy strike (~0.40s)
  directVolleyKickSlowDuration: 24,
  strikerKickSlowMultiplier: 0.12, // Movement speed multiplier during recovery
  directVolleyKickSlowMultiplier: 0.12,

  // ─── Passive: Spatial Awareness & One-Two Rebound ───
  sweetSpotDistance: 180, // Distance threshold for sweet spot bonus
  sweetSpotDamageBonus: 6, // Flat bonus damage when striking at range
  cooldownRefundOnRebound: 90, // Frames (1.5s) refunded to Metavision on bank hits
  bounceBackToIsagiChance: 0.50, // 50% chance for ball to bounce right back to Isagi when kicked
  bounceBackSpeed: 8.5, // Return velocity towards Isagi on rebound

  // ─── Universal Blue Lock Trait: EGO Awakening & Potential Unlocked ───
  enableEgo: true, // Master toggle for Ego mechanic
  egoTitle: 'Metavision Flow', // Custom Ego Awakening Title
  maxEgoMeter: 100, // Maximum Ego capacity
  egoGainPerHit: 25, // Ego gained per standard soccer ball hit (+25% = 4 hits to fill)
  egoGainPerReboundHit: 35, // Ego gained on spatial rebound bank shots (+35%)
  egoGainPerStrikerHit: 50, // Ego gained on heavy "STRIKER!" finisher impacts (+50%)
  egoDuration: 360, // Duration of awakened potential in frames (360 frames = 6.0s)
  egoAwakenShake: 7, // Screen shake intensity on Ego awakening
  egoHitExtensionFrames: 30, // Extra duration added per ball hit while Ego is active (~0.5s)
  egoBuffs: {
    kickSpeedMultiplier: 1.30, // +30% ball kinetic velocity during Ego Mode
    damageMultiplier: 1.25, // +25% kick damage during Ego Mode
    cooldownRate: 1.6, // 60% accelerated skill cooldown recovery (spatial processing)
    sweetSpotDamageBonus: 8, // Enhanced spatial awareness direct sweet-spot hit damage
  },
};
