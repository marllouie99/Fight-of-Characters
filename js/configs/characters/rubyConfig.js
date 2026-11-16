// ─────────────────────────────────────────────────────────────────────────────
// Ruby Character Config
// ─────────────────────────────────────────────────────────────────────────────

export const rubyConfig = {
  id: 'ruby',
  name: 'Ruby',
  displayName: 'Ruby',
  grade: 'B',                 // Fighter Grade: 'B' | 'A' | 'S' | 'SS' (cosmetic — see js/configs/gradeConfig.js)

  // Registered Assets (Rule 22 Compliant)
  assets: {
    hair: 'Assets/model/ruby/Ruby-hair.png',
  },

  // Baseline Attributes
  category: 'Fantasy & Magic',
  color: '#E0115F',
  radius: 25,
  hp: 90,
  damage: 12,
  cooldown: 40,
  moveSpeed: 4.8,
  projectileSpeedMultiplier: 1.0,
  ability: 'Scythe Dance',
  desc: 'Casting abilities triggers a short dash. Swings and pulls scythe to lifesteal.',

  // ── Basic Attack: Crimson Scythe Swing & Lifesteal ──
  scytheSkillName: 'Crimson Scythe Swing',
  scytheDamage: 10,
  scytheRange: 45, // pixels from edge
  scytheCooldown: 40,
  lifestealPercent: 0.25, // 25% of damage dealt

  // ── Skill 1: Scythe Hook Pull ──
  pullSkillName: 'Scythe Hook Pull',
  activePullRange: 200,
  activePullCooldown: 240, // 4 seconds at 60fps
  activePullForce: 12.0,
  activeSlowDuration: 20,

  // ── Passive: 360° Scythe Whirlwind Spin ──
  spinSkillName: '360° Scythe Whirlwind',
  passiveSpinRadius: 80,
  passiveSpinCooldown: 300, // 5 seconds at 60fps
  passiveSpinDamage: 15,
  passiveLifestealPercent: 1.00,

  // ── Passive: Scythe Dance Dash ──
  dashSkillName: 'Scythe Dance Dash',
  dashSpeedMultiplier: 3.0,
  dashDuration: 12,
};
