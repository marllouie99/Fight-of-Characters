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
  egoShotCooldown: 34, // Attack cadence (~0.57s)
  egoShotMaxRebounds: 1, // Bounces once off arena walls
  kickSlowDuration: 18, // Brief duration in frames (~0.30s) of slow recovery movement upon kicking
  kickSlowMultiplier: 0.18, // Movement speed multiplier during kick recovery (very slow crawl)

  // ─── Skill 1: Metavision Slip (Tactical Dodge & Ball Interception Dash) ───
  enableMetavision: true, // Master toggle for Skill 1
  metavisionCooldown: 100, // 8.0s cooldown
  metavisionDashDistance: 210, // Tactical reposition distance
  metavisionDashFrames: 30, // Dash duration in frames
  metavisionInvulnFrames: 14, // Dodge invulnerability window
  metavisionFlowDuration: 180, // 3.0s Flow State buff window
  metavisionBallInterceptionRange: 160, // Nearby ball proximity threshold to trigger dash to ball
  flowShotSpeedMult: 1.5, // Projectile speed during Flow State
  flowShotCritMult: 1.35, // Guaranteed critical damage multiplier

  // ─── Skill 2: Direct Volley (Ultimate / Signature Finisher) ───
  enableDirectVolley: true, // Master toggle for Skill 2
  directVolleyCooldown: 1080, // 18.0s cooldown
  directVolleyWindup: 0, // Zero pause / windup delay (instant volley strike in stride)
  directVolleyDamage: 75, // Massive finishing blast damage
  directVolleySpeed: 24.0, // Hypersonic volley velocity
  directVolleyRadius: 20, // Blast collision radius (scaled up)
  directVolleyKnockback: 18.0, // Blasts opponent into the wall
  directVolleyStunDuration: 100, // Stun debuff duration in frames (~0.75s stun)
  directVolleyShake: 8, // Screen shake intensity (px)
  directVolleyKickSlowDuration: 24, // Brief duration for heavy Direct Volley (~0.40s)
  directVolleyKickSlowMultiplier: 0.12, // Movement speed multiplier during Direct Volley recovery

  // ─── Passive: Spatial Awareness & One-Two Rebound ───
  sweetSpotDistance: 180, // Distance threshold for sweet spot bonus
  sweetSpotDamageBonus: 6, // Flat bonus damage when striking at range
  cooldownRefundOnRebound: 90, // Frames (1.5s) refunded to Metavision on bank hits
  bounceBackToIsagiChance: 0.50, // 50% chance for ball to bounce right back to Isagi when kicked
  bounceBackSpeed: 8.5, // Return velocity towards Isagi on rebound
};
