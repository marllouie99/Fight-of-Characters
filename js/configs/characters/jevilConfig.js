// ───────────────────────────────────────────────────────────────────────────
// JEVIL (Deltarune Chapter 1 Secret Boss) Character Configuration
// Extracted assets & combat voices from KRLW890/jevil-simulator.
// Adheres to Rules 18, 22, 24, 30, 32, 35.
// ───────────────────────────────────────────────────────────────────────────

export const jevilConfig = {
  assets: {
    hair: 'Assets/model/jevil/Jevil-hair.png',
    devilsknife: 'Assets/model/jevil/Devilsknife.png',
    bulletSpade: 'Assets/model/jevil/BulletSpade.png',
    bulletClub: 'Assets/model/jevil/BulletClub.png',
    bulletDiamond: 'Assets/model/jevil/BulletDiamond.png',
    bulletHeart: 'Assets/model/jevil/BulletHeart.png',
    bombSpade: 'Assets/model/jevil/BombSpade.png',
    bombClub: 'Assets/model/jevil/BombClub.png',
    bombDiamond: 'Assets/model/jevil/BombDiamond.png',
    bombHeart: 'Assets/model/jevil/BombHeart.png',
    bulletMerryGoRound: 'Assets/model/jevil/BulletMerryGoRound.png',
  },

  name: 'Jevil',
  displayName: 'JEVIL',
  grade: 'SS',
  title: 'The Jester of Chaos',
  category: 'Gaming',

  // ── Base Attributes (Rule 24: r = 25 -> scaled by super(def)) ──
  r: 25,
  radius: 25,
  hp: 520,
  maxHp: 520,
  speed: 6.5,
  moveSpeed: 6.5,
  color: '#A855F7',             // Unified Chaos Jester Purple (Rule 18)
  themeColor: '#A855F7',
  secondaryColor: '#FACC15',    // Golden Bell Accent
  accentCrimson: '#FF1E4D',     // Final Chaos Crimson Devilsknife
  accentDark: '#0E0F14',        // Manga Ink Outline
  damageNumberColor: '#A855F7',
  startX: 300,
  startY: 250,
  startVx: 1.5,
  startVy: 1.3,
  damage: 25,
  cooldown: 46,
  ability: 'Devilsknife, Spade Ring, Suit Bombs, Carousel, Metamorphosis & Final Chaos',
  desc: 'The hyper-mobile secret boss from Deltarune Chapter 1. Warps out of danger with Chaos Counter Spades, awakens TRUE CHAOS below 50% HP, cycles 6 relentless bullet-hell patterns (Spade Ringaround, 4-Suit Chaos Bombs, Devilsknife Carousel, Flying Merry-Go-Round, Rapid Diamond/Club Barrage, and Metamorphosis Scythe Blitz), and finishes with NEO FINAL CHAOS.',

  // ── Passive: Chaos Warp Counter Hop & Phase 2 Awakening ──
  enableChaosWarp: true,
  chaosWarpSkillName: 'CHAOS WARP',
  chaosWarpCooldown: 105,
  chaosWarpInitialCooldown: 30,
  chaosWarpDashSpeed: 16.5,
  chaosCounterBulletCount: 3,
  afterImageLife: 20,
  afterImageMinSpeed: 4.4,
  afterImageInterval: 3,

  // ── Basic Attack: 5-Phase Devilsknife Cleave + Alternating Spade/Diamond Pinwheel ──
  enableDevilsknifeBasic: true,
  basicAttackSkillName: 'Devilsknife',
  basicAttackDamage: 25,
  basicAttackCooldown: 46,
  basicAttackInitialCooldown: 16,
  basicAttackReach: 180,
  basicAttackArc: Math.PI * 0.84,
  basicAttackKnockback: 7.5,
  knifeLiftFrames: 5,
  knifeHoldFrames: 2,
  knifeStrikeFrames: 6,
  knifeImpactLockFrames: 4,
  knifeRecoveryFrames: 7,
  spadeVolleyCount: 3,
  spadeVolleyDamage: 10,
  spadeVolleySpeed: 10.4,
  spadeVolleySpread: 0.28,
  spadeVolleyLife: 58,

  // ── Unified Skill 1 Slot (6-Skill Anti-Repeat Random Cycle: I CAN DO ANYTHING!) ──
  enableSkill1: true,
  skill1Name: 'CHAOS ART',
  skill1Cooldown: 210,          // Fast SS-Boss 3.5s chaotic cycling
  skill1InitialCooldown: 80,

  // ── Skill 1A: Double Spade Ringaround ──
  enableSpadeRing: true,
  spadeRingSkillName: 'SPADE RING',
  spadeRingCount: 10,
  spadeRingRadius: 142,
  spadeRingHoldFrames: 16,
  spadeRingSpeed: 11.8,
  spadeRingDamage: 15,

  // ── Skill 1B: Chaos Suit Bombs (Heart / Diamond / Club / Spade 8-Way Bursts) ──
  enableSuitBombs: true,
  suitBombsSkillName: 'CHAOS BOMBS',
  suitBombCount: 4,
  suitBombDropSpeed: 7.6,
  suitBombFuseFrames: 24,
  suitBombBlastRadius: 72,
  suitBombDirectDamage: 18,
  suitBombShardSpeed: 9.0,
  suitBombShardDamage: 11,

  // ── Skill 1C: Devilsknife Carousel (5 Orbiting Scythes + Sweep) ──
  enableDevilsknifeCarousel: true,
  devilsknifeCarouselSkillName: 'DEVILSKNIFE',
  carouselScytheCount: 5,
  carouselOrbitFrames: 72,
  carouselStartRadius: 150,
  carouselMinRadius: 42,
  carouselDamage: 16,

  // ── Skill 1D: Merry-Go-Round Carousel Waves ──
  enableMerryGoRound: true,
  merryGoRoundSkillName: 'CAROUSEL',
  carouselWaveCount: 6,
  carouselWaveSpeed: 6.8,
  carouselWaveDamage: 15,

  // ── Skill 1E: Rapid Diamond & Club Barrage ──
  enableDiamondBarrage: true,
  diamondBarrageSkillName: 'CHAOS SUITS',
  diamondBarrageFrames: 40,
  diamondBarrageInterval: 4,
  diamondBarrageSpeed: 10.8,
  diamondBarrageDamage: 12,

  // ── Skill 1F: Metamorphosis Scythe Blitz (3 Invincible Teleport-Slash Passes) ──
  enableMetamorphosis: true,
  metamorphosisSkillName: 'METAMORPHOSIS',
  metamorphosisDashCount: 3,
  metamorphosisDashInterval: 10,
  metamorphosisDashDamage: 20,

  // ── Signature Ultimate: FINAL CHAOS // NEO CHAOS ──
  enableFinalChaos: true,
  finalChaosSkillName: 'FINAL CHAOS',
  finalChaosHitsRequired: 4,
  finalChaosCooldown: 0,
  finalChaosTriggerRange: 360,
  finalChaosRainCount: 10,
  finalChaosRainInterval: 6,
  finalChaosScytheDamage: 20,
  finalChaosClimaxDamage: 50,
  finalChaosKnockback: 15.0,

  // ── Sound Effects & Normalized Volumes ──
  sounds: {
    attack1: 'Assets/Sound Effects/Jevil/jevil_attack_1.wav',
    hit1: 'Assets/Sound Effects/Jevil/jevil_hit_1.wav',
    hit2: 'Assets/Sound Effects/Jevil/jevil_hit_2.wav',
    laugh1: 'Assets/Sound Effects/Jevil/jevil_laugh_1.wav',
    laugh2: 'Assets/Sound Effects/Jevil/jevil_laugh_2.wav',
    aLittleChaos: 'Assets/Sound Effects/Jevil/alittlechaos.wav',
    chaosChaos: 'Assets/Sound Effects/Jevil/chaoschaos.wav',
    iCanDoAnything: 'Assets/Sound Effects/Jevil/icandoanything.wav',
    metamorphosis: 'Assets/Sound Effects/Jevil/metamorphosis.wav',
    byeBye: 'Assets/Sound Effects/Jevil/byebye.wav',
    heartSplit: 'Assets/Sound Effects/Sans/HeartSplit.ogg',
    heartShatter: 'Assets/Sound Effects/Sans/HeartShatter.ogg',
    explosion: 'Assets/Sound Effects/Attacks/explosion.mp3',
  },
  soundVolumes: {
    attack1: 0.78,
    hit1: 0.76,
    hit2: 0.76,
    laugh1: 0.72,
    laugh2: 0.72,
    aLittleChaos: 0.80,
    chaosChaos: 0.82,
    iCanDoAnything: 0.82,
    metamorphosis: 0.82,
    byeBye: 0.86,
    heartSplit: 0.90,
    heartShatter: 0.95,
    explosion: 0.35,
  },
  soundDelays: {
    attack1: 0,
  },
};
