// ───────────────────────────────────────────────────────────────────────────
// Vergil — Son of Sparda Config
// Devil May Cry (Jump Force MUGEN V14 — Son of Sparda Vergil Kit)
// Adheres strictly to Rules 18, 22, 24, 30, 35.
// ───────────────────────────────────────────────────────────────────────────

export const vergilConfig = {
  assets: {
    hair: 'Assets/model/vergil/Vergil-hair.png',
    weapon: 'Assets/model/vergil/Vergil-weapon.png',
  },

  vfxAssets: {
    judgmentSphere: 'Assets/effects/vergil/vergil-judgment-sphere.png',
    summonedSword: 'Assets/effects/vergil/vergil-summoned-sword.png',
    rapidSlash: 'Assets/effects/vergil/vergil-rapid-slash.png',
    crescentWave: 'Assets/effects/vergil/vergil-crescent-wave.png',
    yamatoCleave: 'Assets/effects/vergil/vergil-yamato-cleave.png',
    trickWarp: 'Assets/effects/vergil/vergil-trick-warp.png',
    mirageVortex: 'Assets/effects/vergil/vergil-mirage-vortex.png',
    swordRain: 'Assets/effects/vergil/vergil-sword-rain.png',
    spardaAura: 'Assets/effects/vergil/vergil-sparda-aura.png',
    crimsonBurst: 'Assets/effects/vergil/vergil-crimson-burst.png',
    doppelgangerPortal: 'Assets/effects/vergil/vergil-doppelganger-portal.png',
    dimensionShatter: 'Assets/effects/vergil/vergil-dimension-shatter.png',
    crossGlint: 'Assets/effects/vergil/vergil-cross-glint.png',
    slashEruption: 'Assets/effects/vergil/vergil-slash-eruption.png',
    screenSlash: 'Assets/effects/vergil/vergil-screen-slash.png',
  },

  name: 'Vergil',
  displayName: 'VERGIL',
  grade: 'SS',
  title: 'The Alpha and the Omega',
  category: 'Anime',

  // ── Base Attributes (Rule 24: r = 25 -> scaled cleanly by super(def)) ──
  r: 25,
  radius: 25,
  hp: 255,
  speed: 6.4,
  moveSpeed: 6.4,
  color: '#38BDF8',             // Unified Summoned Sword Cobalt-Cyan Theme (Rule 18)
  themeColor: '#38BDF8',
  secondaryColor: '#60A5FA',    // Yamato Aura Azure
  accentGold: '#FACC15',        // Yamato Guard Gold
  accentCrimson: '#E11D48',     // Seed of Sparda Devil Trigger Crimson
  accentDark: '#0E0F14',        // Manga Ink Outline
  damageNumberColor: '#38BDF8',
  startX: 300,
  startY: 250,
  startVx: 1.3,
  startVy: 1.1,
  damage: 15,
  cooldown: 24,
  projectileSpeedMultiplier: 1.0,
  ability: 'Yamato, Summoned Swords, Doppelganger & Judgment Cut End',
  desc: 'Son of Sparda wielding Yamato with hypersonic Rapid Slash dashes, Trick Teleports, Summoned Sword rings and Heavy Rain, Force Edge boomerang, spectral Doppelganger mirror strikes, Seed of Sparda Devil Trigger, and dimensional Judgment Cut End.',

  // ── Basic Attack: Yamato 5-Phase Iaijutsu Cleave (Rule 30) ──
  enableSwordAttack: true,
  swordSkillName: 'YAMATO',
  swordRange: 80,
  swordArc: 140,
  swordDamage: 15,
  swordKnockback: 6.8,
  swordCooldown: 24,
  swordLiftFrames: 5,
  swordHoldFrames: 2,
  swordStrikeFrames: 5,
  swordImpactLockFrames: 5,
  swordRecoveryFrames: 8,

  // ── Defensive Mechanics: Yamato Guard & Deflect Parry ──
  enableParry: 1,
  parrySkillName: 'YAMATO PARRY',
  parryChance: 0.34,
  parryActiveChance: 0.56,
  parryCooldown: 90,
  parryGuardDuration: 55,
  parryThreatRadius: 155,
  parryConcentrationGain: 18,

  // ── Passive: Concentration & The Seed of Sparda (Devil Trigger var(2)) ──
  enableSpardaForm: 1,
  spardaFormSkillName: 'SEED OF SPARDA',
  spardaFormThresholdHpRatio: 0.25, // Triggers Seed of Sparda strictly once HP drops to <= ratio (e.g. 0.90 = 10% HP lost)
  spardaFormSpeedMultiplier: 1.24,
  spardaFormDamageMultiplier: 1.22,
  spardaFormHealPercent: 0.20,

  // ── Skill 1: Judgment Cut (State 1000 / 1020) ──
  enableJudgmentCut: 0,
  judgmentCutSkillName: 'JUDGMENT CUT',
  judgmentCutCooldown: 190,
  judgmentCutDamage: 22,
  judgmentCutRadius: 68,
  judgmentCutStunFrames: 18,
  judgmentCutBackstepSpeed: 10.5,

  // ── Skill 2: Trick Teleport Dodge (State 550 / 551 — Saitama/Sans Reactive Evade) ──
  enableTrickTeleport: 1,
  trickTeleportSkillName: 'TRICK',
  trickTeleportCooldown: 170,
  trickDodgeChance: 1.0,
  trickDodgeDistance: 100,
  trickSlowFrames: 24,
  trickSlowMultiplier: 0.35,
  trickDodgeText: 'MISS!',
  trickDodgeTextColor: '#FFFFFF',

  // ── Skill 4: Summoned Swords -> Heavy Rain Swords (State 360 / 1100 -> State 2370 / 2375) ──
  enableSummonedSwords: 1,
  summonedSwordsSkillName: 'SUMMONED SWORDS',
  summonedSwordsCooldown: 280,
  summonedSwordCount: 6,
  summonedSwordScale: 1.60,
  summonedSwordOrbitOffset: 28,
  summonedSwordDamage: 7,
  summonedSwordSpeed: 12.5,
  summonedSwordOrbitDuration: 280,
  swordRainDamage: 6,
  swordRainHits: 7,
  swordRainSlowFrames: 34,

  // ── Skill 6: Mirage Edge Boomerang (State 530 / 535) ──
  enableMirageBoomerang: 0,
  mirageBoomerangSkillName: 'MIRAGE EDGE',
  mirageBoomerangCooldown: 250,
  mirageBoomerangDamage: 11,
  mirageBoomerangSpeed: 11.5,

  // ── Skill 7: Doppelganger Clone (State 1200 / Helper 1220, Base Form) ──
  enableDoppelganger: 0,
  doppelgangerSkillName: 'DOPPELGANGER',
  doppelgangerCooldown: 420,
  doppelgangerDuration: 240,
  doppelgangerDamageRatio: 0.28,

  // ── Super: Judgment Cut Barrage (State 1150 / 1160) ──
  enableJudgmentBarrage: 1,
  judgmentBarrageSkillName: 'DIMENSION BARRAGE',
  judgmentBarrageCooldown: 360,
  judgmentBarrageDamage: 10,
  judgmentBarrageTicks: 6,

  // ── Ultimate: Rapid Slash -> Judgment Cut End (State 3000 -> 3004) ──
  enableJudgmentCutEnd: 1,
  judgmentCutEndSkillName: 'JUDGMENT CUT END',
  judgmentCutEndCooldown: 620,
  rapidSlashDamage: 24,
  rapidSlashWindupFrames: 12,
  rapidSlashDashSpeed: 18.0,
  rapidSlashDurationFrames: 16,
  judgmentCutEndRadius: 215,
  judgmentCutEndFreezeFrames: 38,
  judgmentCutEndBarrageDamage: 24,
  judgmentCutEndShatterDamage: 48,
  judgmentCutEndKnockback: 13.5,

  // ── Audio Registry (Extracted Clean SOUNDS.snd SFX) ──
  sounds: {
    yamatoSlash: 'Assets/Sound Effects/VergilSFX/vergil-yamato-slash.ogg',
    sheathSnap: 'Assets/Sound Effects/VergilSFX/vergil-sheath-snap.ogg',
    judgmentCut: 'Assets/Sound Effects/VergilSFX/vergil-judgment-cut.ogg',
    rapidDash: 'Assets/Sound Effects/VergilSFX/vergil-rapid-dash.ogg',
    heavyCleave: 'Assets/Sound Effects/VergilSFX/vergil-heavy-cleave.ogg',
    hitSlice: 'Assets/Sound Effects/VergilSFX/vergil-hit-slice.ogg',
    trickVanish: 'Assets/Sound Effects/VergilSFX/vergil-trick-vanish.ogg',
    trickAppear: 'Assets/Sound Effects/VergilSFX/vergil-trick-appear.ogg',
    summonSword: 'Assets/Sound Effects/VergilSFX/vergil-summon-sword.ogg',
    mirageBoomerang: 'Assets/Sound Effects/VergilSFX/vergil-mirage-boomerang.ogg',
    doppelganger: 'Assets/Sound Effects/VergilSFX/vergil-doppelganger.ogg',
    glassShatter: 'Assets/Sound Effects/VergilSFX/vergil-glass-shatter.ogg',
    dimensionBoom: 'Assets/Sound Effects/VergilSFX/vergil-dimension-boom.ogg',
    spardaAwaken: 'Assets/Sound Effects/VergilSFX/vergil-sparda-awaken.ogg',
    devilRoar: 'Assets/Sound Effects/VergilSFX/vergil-devil-roar.ogg',
  },

  soundVolumes: {
    yamatoSlash: 0.74,
    sheathSnap: 0.80,
    judgmentCut: 0.86,
    rapidDash: 0.82,
    heavyCleave: 0.84,
    hitSlice: 0.78,
    trickVanish: 0.74,
    trickAppear: 0.78,
    summonSword: 0.74,
    mirageBoomerang: 0.80,
    doppelganger: 0.84,
    glassShatter: 0.92,
    dimensionBoom: 0.90,
    spardaAwaken: 0.90,
    devilRoar: 0.88,
  },
};
