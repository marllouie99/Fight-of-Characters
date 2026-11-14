// ═══════════════════════════════════════════════════════════════════════════
// THE ROARING KNIGHT (Deltarune Chapter 3) — Character Configuration
// Adheres strictly to:
// - Rule 18: HUD Skill Bar Theme Consistency & Clean Architecture Standard
// - Rule 20: Canonical Default Model Hand Positioning Standard
// - Rule 21: In-Game Overlay HP & Status Drawing Standard
// - Rule 22: Hair & Head Asset Model Import (Assets/model/roaring_knight/RoaringKnight-hair.png)
// - Rule 23: Basic Projectile Suppression (shoot override)
// - Rule 24: Universal Character Body Model & Scale Standard (r = 25 -> scaled 30)
// - Rule 25: Non-Freezing Active Visual Effects Standard
// - Rule 26: Clean Concentric Shockwave Standard (Anti-Cobweb Rule)
// - Rule 30: 5-Phase Melee Combat Kinematics & Physical Force Standard
// - Rule 32: Universal Character Black Outline Standard (#0E0F14)
// ═══════════════════════════════════════════════════════════════════════════

export const roaringKnightConfig = {
  id: 'roaring_knight',
  name: 'Roaring Knight',
  displayName: 'Roaring Knight',
  grade: 'S',
  category: 'Gaming',
  title: 'Herald of the Roaring',
  ability: 'Black Knife, Falling Swords & Roaring Swoon',
  desc: 'Harbinger of the Dark Fountains from Deltarune Chapter 3. Wields the razor-edged Black Knife in blistering 5-phase cleaves, summons telegraphed volleys of Falling Swords, launches detonating Star Bursts, and cleaves the entire arena in half with Roaring Swoon.',

  // ── Assets ──
  assets: {
    hair: 'Assets/model/roaring_knight/RoaringKnight-hair.png',
    blackKnife: 'Assets/model/roaring_knight/BlackKnife.png',
    fallingSword: 'Assets/model/roaring_knight/FallingSword.png',
    starBullet: 'Assets/model/roaring_knight/StarBullet.png',
    starBulletRed: 'Assets/model/roaring_knight/StarBulletRed.png',
    starChild: 'Assets/model/roaring_knight/StarChild.png',
    redSlash: 'Assets/model/roaring_knight/RedSlash.png',
    swoonLine: 'Assets/model/roaring_knight/RoaringSwoonLine.png',
  },

  // ── Base Attributes (Rule 24 Standard r = 25 -> scaled by base super(def)) ──
  r: 28,
  radius: 28,
  hp: 460,
  maxHp: 460,
  speed: 4.9,
  moveSpeed: 4.9,
  color: '#18181B', // Monochrome Void Black (Unified Rule 18 Top & Bottom HUD Theme Color)
  themeColor: '#18181B',
  secondaryColor: '#FFFFFF', // Crisp White Accent
  accentDark: '#161822', // Obsidian Armor Tint (Luminance-safe inside #0E0F14 ink outline)
  damageNumberColor: '#FFFFFF',
  startX: 300,
  startY: 250,
  startVx: 1.2,
  startVy: 1.1,

  // ── Passive: Shadow Mantle Dash ──
  enableShadowMantle: true,
  afterImageMinSpeed: 4.4,
  afterImageInterval: 5,
  afterImageLife: 16,

  // ── Basic Attack: Black Knife Cleave (Rule 30 5-Phase Melee Kinematics) ──
  enableBlackKnife: true,
  basicAttackDamage: 26,
  damage: 26,
  basicAttackCooldown: 42,
  cooldown: 42,
  basicAttackReach: 88,
  basicAttackArc: Math.PI * 0.78, // ~140° wide frontal cleave
  basicAttackKnockback: 11,
  knifeWindupFrames: 9,
  knifeHoldFrames: 3,
  knifeStrikeFrames: 7,
  knifeImpactLockFrames: 6,
  knifeRecoveryFrames: 13,

  // ── Skill 1: Falling Swords ──
  enableFallingSwords: true,
  fallingSwordsCooldown: 340, // ~5.7s
  fallingSwordsInitialCooldown: 90,
  fallingSwordsChargeFrames: 26,
  fallingSwordsTelegraphFrames: 18,
  fallingSwordCount: 6,
  fallingSwordDamage: 16,
  fallingSwordSpeed: 14.5,
  fallingSwordKnockback: 7,

  // ── Skill 2: Star Burst ──
  enableStarBurst: true,
  starBurstCooldown: 420, // 7.0s
  starBurstInitialCooldown: 160,
  starBurstCastFrames: 18,
  starBurstSpeed: 5.4,
  starBurstFuseFrames: 42,
  starBurstDamage: 24,
  starChildCount: 8,
  starChildDamage: 12,
  starChildSpeed: 8.5,

  // ── Ultimate: Roaring Swoon (Dark Fountain Dimensional Cleave) ──
  enableRoaringSwoon: true,
  swoonCooldown: 780, // 13.0s
  swoonInitialCooldown: 420, // 7.0s
  swoonChargeFrames: 38,
  swoonSlashFrames: 14,
  swoonRecoveryFrames: 20,
  swoonDamage: 78,
  swoonReach: 560,
  swoonHalfWidth: 42,
  swoonKnockback: 20,
  swoonStunFrames: 22,

  // ── Audio SFX Paths & Normalized Volumes ──
  sounds: {
    cut1: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_cut.wav',
    cut2: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_cut2.wav',
    hitStrong: 'Assets/Sound Effects/RoaringKnightSFX/snd_metal_hit_strong.wav',
    drawPower: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_drawpower.wav',
    fallingSword: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_fallingsword.ogg',
    fallingSwordBig: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_fallingsword_big.wav',
    pulse: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_pulse.wav',
    starExplosion: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_star_explosion_close.wav',
    roar: 'Assets/Sound Effects/RoaringKnightSFX/snd_knightroar.wav',
    powerupWhite: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_powerup_white.wav',
    boxBreak: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_boxbreak.wav',
    wideSlash: 'Assets/Sound Effects/RoaringKnightSFX/snd_wideslash_low.wav',
    darkFountain: 'Assets/Sound Effects/RoaringKnightSFX/snd_ftext_dark_fountain.wav',
    teleport: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_teleport.wav',
    cape: 'Assets/Sound Effects/RoaringKnightSFX/snd_cape_1.wav',
    hurt1: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_hurt.wav',
    hurt2: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_hurtb.wav',
  },
  soundVolumes: {
    cut1: 0.90,
    cut2: 0.90,
    hitStrong: 0.85,
    drawPower: 0.80,
    fallingSword: 0.75,
    fallingSwordBig: 0.85,
    pulse: 0.80,
    starExplosion: 0.95,
    roar: 1.00,
    powerupWhite: 0.85,
    boxBreak: 0.95,
    wideSlash: 0.95,
    darkFountain: 0.90,
    teleport: 0.70,
    cape: 0.65,
    hurt1: 0.75,
    hurt2: 0.75,
  },
};
