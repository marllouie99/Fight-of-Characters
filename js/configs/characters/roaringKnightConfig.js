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
  ability: 'Black Knife, Tracking Sword & Rotating Slash',
  desc: 'Harbinger of the Dark Fountains from Deltarune Chapter 3. Wields the razor-edged Black Knife in blistering 5-phase cleaves, tracks foes with Transforming Swords, unleashes STARS bursts, and overwhelms the arena with Phase 3 Rotating Slash.',

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
    battleFlurry: 'Assets/model/roaring_knight/KnightBattleFlurry.png',
  },

  // ── Base Attributes (Rule 24 Standard r = 25 -> scaled by base super(def)) ──
  r: 28,
  radius: 28,
  hp: 460,
  maxHp: 460,
  speed: 5.9,
  moveSpeed: 5.9,
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
  enableShadowMantle: 0,
  shadowMantleSkillName: 'SHADOW MANTLE',
  afterImageMinSpeed: 4.4,
  afterImageInterval: 4,
  afterImageLife: 18,
  shadowStepCooldown: 135,
  shadowStepInitialCooldown: 75, // 1.25s initial cooldown
  shadowStepDashSpeed: 13.5,

  // ── Passive: Black Knife Parry (Deltarune Ch.3 Guard & Riposte) ──
  enableParry: true,
  parrySkillName: 'Black Knife Parry',
  parryPassiveChance: 0.40, // Base deflect chance when idle or maneuvering
  parryActiveChance: 0.70, // Boosted deflect chance while holding Black Knife guard stance
  parryGuardDuration: 75, // 1.25s defensive guard pose hold after parry
  parryHitAnimFrames: 18, // Crisp block_vfx + whiteflash block recoil frames
  parryCooldownFrames: 16, // Short anti-spam internal parry cooldown (~0.27s)
  parryCounterDamage: 12, // Close-range Black Knife riposte slash on parried melee attackers
  parryCounterKnockback: 6.5, // Separation knockback applied to parried melee attacker
  parryCounterStunFrames: 12, // Brief stagger frames on parried melee attacker

  // ── Basic Attack: Rotating Slash Phase 1 (1 -> 2 -> 2 -> 3 -> 3 -> 4 Cycle) ──
  enableBlackKnife: true,
  basicAttackSkillName: 'Rotating Slash Phase 1',
  basicAttackDamage: 24,
  damage: 24,
  basicAttackCooldown: 78,
  basicAttackInitialCooldown: 30, // 0.5s initial cooldown
  cooldown: 78,
  basicAttackReach: 175,
  basicAttackArc: Math.PI * 0.78,
  basicAttackKnockback: 7.5,
  basicSlashArray: [1, 2, 2, 3, 3, 4],
  basicSlashAimFrames: 18,
  basicSlashHalfWidth: 24,
  basicSlashMaxTimer: 16,
  basicSlashPauseFrames: 20,
  knifeDashFrames: 9,
  knifeDashSpeed: 10.5,
  knifeWindupFrames: 8,
  knifeHoldFrames: 2,
  knifeStrikeFrames: 7,
  knifeImpactLockFrames: 3,
  knifeRecoveryFrames: 5,

  // ── Unified Skill 1 Slot (Randomly chooses an enabled active skill when CD is up) ──
  enableSkill1: true,
  skill1Name: 'SKILL 1',
  skill1Cooldown: 500, // 7.0s shared Skill 1 cooldown
  skill1InitialCooldown: 500, // 3.0s initial round-start cooldown

  // ── Skill 1: Tracking Sword Phase 1 (8-Dir SOUL Track -> Red Freeze -> White Flash -> Board Slash x10) ──
  enableFallingSwords: 1,
  fallingSwordsSkillName: 'TRACKING SWORD',
  fallingSwordsCooldown: 520, // 7.0s
  fallingSwordsInitialCooldown: 180, // 3.0s initial cooldown
  fallingSwordsChargeFrames: 16,
  fallingSwordCount: 10, // Repeats 10 times with progressive speed & shorter lock delay
  fallingSwordDamage: 14,
  fallingSwordKnockback: 6,
  trackingSwordTrackFramesStart: 28, // ~0.47s tracking initially -> shortens smoothly
  trackingSwordTrackFramesEnd: 10,
  trackingSwordFreezeFramesStart: 26, // Red freeze telegraph before white flash (~1.0s total initially)
  trackingSwordFreezeFramesEnd: 12,
  trackingSwordWhiteFramesStart: 6, // Crisp white pre-vanish flash
  trackingSwordWhiteFramesEnd: 4,
  trackingSwordIntervalStart: 38, // Spawn stagger between consecutive swords -> tightens to 16f
  trackingSwordIntervalEnd: 16,
  trackingSwordSlashHalfWidth: 11,
  trackingSwordScale: 1.2, // Renders 72x27 native FallingSword pixel sprite at ~86x32px

  // ── Skill 2: STARS Phase 1 (B&W Line Intro -> Purple Cone -> Reverse -> Red Flicker Flare -> 6 Shards) ──
  enableStarBurst: 1,
  starBurstSkillName: 'STAR BURST',
  starBurstCooldown: 700, // 7.0s
  starBurstInitialCooldown: 300, // 5.0s initial cooldown
  starIntroFrames: 12, // B&W pointing hairline beam before cone unfolds
  starConeOpenFrames: 4, // lavender-white cone unfold flash
  starBurstCastFrames: 40, // purple cone stream duration
  starConeOutroFrames: 16, // collapsing white/black tapered beam outro
  starConeCount: 10, // growing 6-pointed stars emitted inside the purple cone
  starBurstSpreadCount: 3, // fallback spread count for Final Roaring salvo
  starBurstSpeed: 6.2,
  starBurstFuseFrames: 42,
  starReverseFrames: 50, // ~0.85s reverse pullback phase
  starRedLockFrames: 22, // red + 6 white beams telegraph before exploding
  starBurstDamage: 16,
  starChildCount: 6, // 6 shards per star (3 normal slow, 3 shorter travel & duration)
  starChildDamage: 9,
  starChildSpeed: 3.2,
  starChildShortSpeed: 2.0,
  starChildLongLife: 100,
  starChildShortLife: 100,
  // ── Skill 2 Phase 3 Variant (2 Shards -> Hover -> Turn Red & Shoot One at a Time) ──
  starPhaseMode: 'alternate', // 'phase1' | 'phase3' | 'alternate'
  starPhase3ChildCount: 2,
  starPhase3DriftFrames: 18,
  starPhase3StaggerFrames: 4,
  starPhase3AimFrames: 10,
  starPhase3ShootSpeed: 10.8,
  starPhase3ShardDamage: 12,
  enableStarOrbit: true,
  starOrbitCount: 4,
  starOrbitDurationFrames: 54,
  starOrbitDamage: 10,

  // ── Skill 3: Blade Corridor (Sweeping Sword Wall Barrage) ──
  enableBladeCorridor: 0,
  bladeCorridorSkillName: 'BLADE CORRIDOR',
  bladeCorridorCooldown: 390, // 6.5s
  bladeCorridorInitialCooldown: 240, // 4.0s initial cooldown
  bladeCorridorChargeFrames: 18,
  bladeCorridorWaveCount: 5,
  bladeCorridorSpeed: 9.2,
  bladeCorridorDamage: 11,
  bladeCorridorKnockback: 5,
  bladeCorridorGapHalfWidth: 46,

  // ── Skill 3B: Sword Tunnel (Phase 1 Tunnel, Phase 2 Rotating Spiral Tunnel & Phase 2 Finisher) ──
  enableSwordTunnel: 1, // Phase 1 weaving sword tunnel corridor
  swordTunnelSkillName: 'SWORD TUNNEL',
  enableSwordTunnelPhase2: 1, // Phase 2 rotating 360-degree spiral tunnel + Phase 2 Finisher
  enableSwordTunnelFinisher: 1, // Climax crimson-laser lock -> recoil -> AfterimageGrow -> Mach cut beams
  swordTunnelPhase1Finisher: true, // Also trigger closing Finisher on Phase 1 Tunnel climax
  swordTunnelCastFrames: 14, // Point/step-back startup frames
  swordTunnelPhase1DurationFrames: 116, // ~1.95s Phase 1 corridor duration before finisher
  swordTunnelPhase2DurationFrames: 144, // ~2.4s Phase 2 rotating spiral duration before Phase 2 Finisher
  swordTunnelSpawnInterval: 4, // Exact sword_tunnel.rs rate=4 volley cadence
  swordTunnelGapHalfWidth: 38, // Clear dodge lane half-width between opposing blade tips
  swordTunnelSpeed: 10.5, // Phase 1 glide speed
  swordTunnelPhase2PullSpeed: -5.6, // Outward initial pullback before inward acceleration (sword_tunnel.rs _speed=-8 scaled)
  swordTunnelPhase2Gravity: 1.45, // Strong inward acceleration into corridor sweep (sword_tunnel.rs _gravity=2 scaled)
  swordTunnelPhase2MaxSpeed: 21.0, // Peak corridor glide velocity (sword_tunnel.rs _maxspeed scaled for 450px arena)
  swordTunnelPhase2RotateStepDeg: 4.4, // Exact sword_tunnel.rs 4deg-per-volley spiral sweep
  swordTunnelDamage: 10, // Tunnel sword contact damage
  swordTunnelKnockback: 4.5, // Tunnel sword knockback impulse
  swordTunnelFinisherMinBlades: 12, // Tops up only if fewer than 12 tunnel blades remain in arena on climax
  swordTunnelFinisherAimFrames: 30, // Decelerate & rotate toward target while projecting red telegraph lasers
  swordTunnelFinisherRecoilFrames: 5, // Reverse pullback frames before pause
  swordTunnelFinisherPauseFrames: 5, // Dead-still crimson laser freeze before Mach dash
  swordTunnelFinisherDashSpeed: 56, // Blazing Mach launch speed matching st2b 1-2 frame arena cross
  swordTunnelFinisherBeamLife: 12, // Lingering serrated sword-trail decay frames (st2b panels 8-11)
  swordTunnelFinisherBeamHalfWidth: 10, // SwordTunnelHitbox line collision half-width
  swordTunnelFinisherDamage: 15, // Phase 2 Finisher beam/blade damage
  swordTunnelFinisherKnockback: 8.5, // Phase 2 Finisher knockback impulse

  // ── Skill 4: Snowflake Matrix (Red Lock-In + Full-Arena + / X Beam Matrix) ──
  enableSnowflakeMatrix: 0,
  snowflakeMatrixSkillName: 'SNOWFLAKE SLASH',
  snowflakeMatrixCooldown: 480, // 8.0s
  snowflakeMatrixInitialCooldown: 360, // 6.0s initial cooldown
  snowflakeMatrixChargeFrames: 18,
  snowflakeMatrixLockInFrames: 12,
  snowflakeMatrixActiveFrames: 22,
  snowflakeMatrixRotSpeed: 0.045,
  snowflakeMatrixDamage: 24,
  snowflakeMatrixHalfWidth: 16,
  snowflakeMatrixKnockback: 11,

  // ── Ultimate: Non-Rotating Multi-Angle Front Slash Barrage (Activated at N Basic Attack Hits) ──
  enableRoaringSwoon: 1,
  roaringSwoonSkillName: 'ROTATING SLASH',
  swoonHitsRequired: 5, // Successful Black Knife hits needed to activate Ultimate
  swoonCooldown: 0,
  swoonInitialCooldown: 0,
  swoonTriggerRange: 140, // Must be close to enemy before unleashing front-spawned Slash Barrage Ultimate
  swoonDashFrames: 12, // Fast forward lunge frames toward target on Ultimate activation
  swoonDashSpeed: 16.5, // Forward dash velocity when rushing the target
  swoonDashStopMargin: 28, // Stops just in front of target before stunning & unleashing barrage
  swoonStunFrames: 78, // 1.3s stun applied on Ultimate dash impact covering attack swing animation + windup + barrage
  swoonStunReach: 95, // Impact stun radius ahead of Knight at end of Ultimate dash
  swoonReach: 560,
  rotatingSlashWindupFrames: 18, // Crisp 0.3s multi-angle crimson telegraph flash (non-rotating)
  rotatingSlashFinaleCount: 20, // 9 rapid dual-angle front bursts + 1 heavy 3-way Void Cross finisher (21 total slashes)
  rotatingSlashFinaleInterval: 4, // Fast 4-frame burst cadence (~67ms) for intense shred
  rotatingSlashFinaleHalfWidth: 30,
  rotatingSlashHalfLength: 145, // Crisp 290px finite slash blades in front of Knight
  rotatingSlashFinisherHalfLength: 195, // Extra-wide 390px Void Cross finisher blades
  rotatingSlashFrontSpread: 44, // Spatial scatter across the front kill zone ahead of Knight
  rotatingSlashFinaleDamage: 15, // Strong multi-hit damage per burst
  rotatingSlashFinisherDamage: 30, // Heavy final 3-way Void Cross burst damage
  rotatingSlashFinaleKnockback: 1.8, // Light shred jitter keeps enemy in front during barrage
  rotatingSlashFinisherKnockback: 9.5, // Heavy forward knockback on final Void Cross burst
  rotatingSlashSlowFrames: 150, // 2.5s @ 60fps slow debuff applied on Ultimate slash hit
  rotatingSlashSlowMultiplier: 0.45, // 55% movement speed reduction while slowed
  rotatingSlashOutroFrames: 14, // Front sword-trail spin-down & lingering scratch scar fade outro
  enableGapingMawRift: true,
  swoonSlashCount: 3, // Used by Final Phase Desperation Roaring sequential Gaping Maw rifts
  swoonFollowupDelayFrames: 34,
  swoonFollowupTelegraphFrames: 16,
  swoonFollowupDamage: 24,
  voidRiftDurationFrames: 86,
  voidRiftHalfWidth: 22,
  voidRiftShardInterval: 7,
  voidRiftShardDamage: 8,
  voidRiftShardSpeed: 10.5,

  // ── Final Phase: Full-Screen Roaring Desperation Barrage (<= 35% HP, once per match) ──
  enableDesperationRoaring: 0,
  desperationRoaringSkillName: 'Final Roaring Desperation',
  desperationHpThreshold: 0.35,

  // ── Audio SFX Paths & Normalized Volumes ──
  sounds: {
    cut1: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_cut.wav',
    cut2: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_cut2.wav',
    hitStrong: 'Assets/Sound Effects/RoaringKnightSFX/snd_metal_hit_strong.wav',
    drawPower: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_drawpower.wav',
    fallingSword: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_fallingsword.ogg',
    fallingSwordBig: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_fallingsword_big.wav',
    pulse: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_pulse.wav',
    pulse2: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_pulse2.wav',
    stretch: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_stretch.wav',
    puff: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_puff.wav',
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
    beam: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_beam.wav',
    laser: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_laser.wav',
    rotatingSlashLine: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_rotatingslash_line.wav',
    cutExplosion: 'Assets/Sound Effects/Attacks/explosion.mp3',
    parry: 'Assets/Sound Effects/Skills/parry.mp3',
    attackVoice1: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_hurt.wav',
    attackVoice2: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_hurtb.wav',
    attackGrowl: 'Assets/Sound Effects/RoaringKnightSFX/snd_knight_puff.wav',
    ultRoar: 'Assets/Sound Effects/RoaringKnightSFX/snd_knightroar.wav',
    heartSplit: 'Assets/Sound Effects/Sans/HeartSplit.ogg',
    heartShatter: 'Assets/Sound Effects/Sans/HeartShatter.ogg',
  },
  soundVolumes: {
    cut1: 0.90,
    cut2: 0.90,
    hitStrong: 0.85,
    drawPower: 0.80,
    fallingSword: 0.75,
    fallingSwordBig: 0.85,
    pulse: 0.80,
    pulse2: 0.82,
    stretch: 0.62,
    puff: 0.78,
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
    beam: 0.85,
    laser: 0.80,
    rotatingSlashLine: 0.82,
    cutExplosion: 0.28,
    parry: 0.85,
    attackVoice1: 0.42,
    attackVoice2: 0.42,
    attackGrowl: 0.50,
    ultRoar: 0.92,
    heartSplit: 0.90,
    heartShatter: 0.95,
  },
};
