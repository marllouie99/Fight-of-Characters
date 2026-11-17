// ─────────────────────────────────────────────
// Hajime Kashimo Character Config
// Jujutsu Kaisen — God of Lightning (MUGEN Port)
// ─────────────────────────────────────────────

export const kashimoConfig = {
  assets: {
    hair: 'Assets/model/kashimo/Kashimo-hair.png',
  },

  name: 'KASHIMO',
  displayName: 'Hajime Kashimo',
  grade: 'SS',
  category: 'Anime',
  bossTitle: 'God of Lightning',
  title: 'The Culling Game Sorcerer',

  // Baseline Attributes (Rule 24 Humanoid Standard)
  hp: 375,
  maxHpRatio: 1.0,
  speed: 5.5,
  moveSpeed: 5.5,
  r: 25,
  radius: 25,
  handScale: 1.0,
  color: '#38BDF8',
  themeColor: '#38BDF8',
  secondaryColor: '#A855F7',
  accentCyan: '#7CE8FF',
  accentViolet: '#C084FC',
  accentBlack: '#0E0F14',
  startX: 300,
  startY: 250,
  startVx: 1.1,
  startVy: 1.0,
  damage: 24,
  cooldown: 28,
  projectileSpeedMultiplier: 1.0,
  ability: 'Electrified Nyoi Staff, Static Counter, Sure-Hit Railgun & Mythical Beast Amber',
  desc: 'Ancient sorcerer whose cursed energy carries the traits of electricity. Builds Static Charge stacks on Nyoi Staff hits for guaranteed Sure-Hit Lightning Discharges, baits strikes with Violence Rampage Counter, fires piercing Railgun beams, and awakens Mythical Beast Amber (guard-piercing attacks + Sphere of Destruction).',

  // ─── Basic Attack: Nyoi Staff & Teleporte Blitz (Statedef 200-245 / 500) ───
  enableStaffCombo: true,
  staffComboSkillName: 'NYOI STAFF',
  staffReach: 92,
  staffArcDeg: 135,
  staffDamage: 20,
  staffCooldown: 24,
  teleporteCooldown: 150,
  teleporteDistance: 125,

  // ─── Passive: Electrified Cursed Energy (Static Charge Stacks) ───
  enableStaticCharge: 0,
  staticChargeSkillName: 'STATIC CHARGE',
  staticChargeMaxStacks: 3,
  staticDischargeDamage: 38,
  staticDischargeStunFrames: 26,

  // ─── Skill 1: "You Know What?" Counter / Photon Slicer (Statedef 1300 / 1200 / 1700) ───
  enableCounter: 0,
  counterSkillName: 'LIGHTNING COUNTER',
  counterCooldown: 390,
  counterStanceFrames: 42,
  counterPunishDamage: 46,
  counterStunFrames: 34,
  photonSlicerDamage: 32,

  // ─── Skill 2: Sure-Hit Lightning Railgun & Thunder Pillar (Statedef 2000 / 1500) ───
  enableRailgun: 0,
  railgunSkillName: 'SURE-HIT RAILGUN',
  railgunCooldown: 450,
  railgunChargeFrames: 20,
  railgunFireFrames: 50,
  railgunDamage: 52,
  railgunWidth: 56,
  thunderPillarDamage: 26,

  // ─── Ultimate: Mythical Beast Amber & Sphere of Destruction (Statedef 1300 var(3) / 3000) ───
  enableAmberForm: 1,
  amberSkillName: 'MYTHICAL BEAST AMBER',
  amberCooldown: 1650,
  amberHpThreshold: 0.45,
  amberDuration: 900,
  amberSpeedMultiplier: 1.35,
  amberDamageMultiplier: 1.30,
  amberDamageReduction: 0.15,
  amberShockDamage: 25,
  sphereDamage: 58,
  sphereRadius: 115,

  // ─── Lightning Dash Evasion ───
  enableDodge: 0,
  dodgeChance: 0.55,
  amberDodgeChance: 0.75,
  dodgeDistance: 110,
  dodgeCooldown: 22,

  // ─── Sound System Configuration (MUGEN Kashimo SFX) ───
  sounds: {
    staffSwing: 'Assets/Sound Effects/KashimoSFX/kashimo-staff-swing.ogg',
    lightningHit: 'Assets/Sound Effects/KashimoSFX/kashimo-lightning-hit.ogg',
    teleporte: 'Assets/Sound Effects/KashimoSFX/kashimo-teleporte.ogg',
    counterTrigger: 'Assets/Sound Effects/KashimoSFX/kashimo-counter-trigger.ogg',
    railgunCharge: 'Assets/Sound Effects/KashimoSFX/kashimo-railgun-charge.ogg',
    railgun: 'Assets/Sound Effects/KashimoSFX/kashimo-railgun.ogg',
    thunderPillar: 'Assets/Sound Effects/KashimoSFX/kashimo-thunder-pillar.ogg',
    sphereBoom: 'Assets/Sound Effects/KashimoSFX/kashimo-sphere-boom.ogg',
    amberTransform: 'Assets/Sound Effects/KashimoSFX/kashimo-amber-transform.ogg',
  },

  soundVolumes: {
    staffSwing: 0.82,
    lightningHit: 0.88,
    teleporte: 0.80,
    counterTrigger: 0.92,
    railgunCharge: 0.88,
    railgun: 0.95,
    thunderPillar: 0.95,
    sphereBoom: 1.00,
    amberTransform: 0.98,
  }
};
