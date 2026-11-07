// ─────────────────────────────────────────────
// ROGUELITE BLESSING & PERK DRAFTING SYSTEM
// Provides between-round 3-card draft progression:
// 8 Canonical Blessings:
// - Titan's Might: +15% Melee & Skill Damage
// - Vampiric Touch: 6% HP Lifesteal on all damage dealt
// - Aero Haste: -20% Active Skill Cooldowns
// - Kinetic Shock: Wall bounces trigger 18 AOE shockwaves
// - Iron Bastion: +35 Max HP & 2.0s Super Armor at round start
// - Lightning Step: Dashing stuns enemies with electric sparks for 12 frames
// - Overdrive Zone: +35% Move Speed when HP < 30%
// - Bouncing Comet: Projectiles gain +1 additional bounce
// Gated by CONFIG.enableMatchPerks (default: false).
// Follows Rule 35 (Zero allocations per-frame).
// ─────────────────────────────────────────────

import { state } from '../core/state.js';
import { CONFIG } from '../core/config.js';
import { triggerHaptic } from './mobileAppBridge.js';
import { spawnSparks, spawnImpactFlash } from '../graphics/particles/sparkEffect.js';

export const PERK_CATALOG = [
  {
    id: 'titans_might',
    name: "TITAN'S MIGHT",
    icon: '⚔️',
    tier: 'Common',
    color: '#00F5D4',
    desc: 'All melee strikes and skill damage increased by +15%.'
  },
  {
    id: 'vampiric_touch',
    name: 'VAMPIRIC TOUCH',
    icon: '🩸',
    tier: 'Rare',
    color: '#FF3366',
    desc: 'Restore 6% of all damage dealt as instant health.'
  },
  {
    id: 'aero_haste',
    name: 'AERO HASTE',
    icon: '⚡',
    tier: 'Common',
    color: '#00F5D4',
    desc: 'All active skill cooldowns reduced by -20%.'
  },
  {
    id: 'kinetic_shock',
    name: 'KINETIC SHOCK',
    icon: '💥',
    tier: 'Rare',
    color: '#FFA502',
    desc: 'Wall bounces trigger supersonic shockwaves dealing 18 AOE damage.'
  },
  {
    id: 'iron_bastion',
    name: 'IRON BASTION',
    icon: '🛡️',
    tier: 'Common',
    color: '#4A90E2',
    desc: '+35 Max HP and gain 2.0s of super-armor at round start.'
  },
  {
    id: 'lightning_step',
    name: 'LIGHTNING STEP',
    icon: '⚡',
    tier: 'Epic',
    color: '#A335EE',
    desc: 'Dashing leaves a streak of electric sparks that stun enemies for 12 frames.'
  },
  {
    id: 'overdrive_zone',
    name: 'OVERDRIVE ZONE',
    icon: '🌀',
    tier: 'Epic',
    color: '#A335EE',
    desc: 'When HP drops below 30%, movement speed increases by +35%.'
  },
  {
    id: 'bouncing_comet',
    name: 'BOUNCING COMET',
    icon: '☄️',
    tier: 'Rare',
    color: '#FFA502',
    desc: 'Projectiles gain +1 additional wall reflection bounce.'
  }
];

/**
 * Returns a randomized draft selection of distinct perks
 * @param {number} count Number of choices (default: 3)
 * @returns {Array} Array of perk definition objects
 */
export function getRandomPerkDraft(count = 3) {
  const pool = [...PERK_CATALOG];
  const draft = [];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    draft.push(pool.splice(idx, 1)[0]);
  }
  return draft;
}

/**
 * Applies a drafted blessing to the specified fighter
 * @param {Object} fighter
 * @param {string} perkId
 */
export function applyPerkToFighter(fighter, perkId) {
  if (!fighter) return;

  if (!fighter.activePerks) fighter.activePerks = [];
  if (!fighter.activePerks.includes(perkId)) {
    fighter.activePerks.push(perkId);
  }

  switch (perkId) {
    case 'titans_might':
      fighter.perkTitansMight = true;
      break;

    case 'vampiric_touch':
      fighter.perkVampiricTouch = true;
      break;

    case 'aero_haste':
      fighter.perkAeroHaste = true;
      break;

    case 'kinetic_shock':
      fighter.perkKineticShock = true;
      break;

    case 'iron_bastion':
      fighter.perkIronBastion = true;
      fighter.maxHp = (fighter.maxHp || 200) + 35;
      fighter.hp = Math.min(fighter.maxHp, (fighter.hp || 0) + 35);
      fighter.superArmorTimer = 120; // 2.0 seconds at 60 FPS
      break;

    case 'lightning_step':
      fighter.perkLightningStep = true;
      break;

    case 'overdrive_zone':
      fighter.perkOverdriveZone = true;
      break;

    case 'bouncing_comet':
      fighter.perkBouncingComet = true;
      break;
  }
}

/**
 * Triggers Kinetic Shock AOE blast on wall bounce
 * @param {Object} fighter
 * @param {Object} arena
 */
export function triggerKineticShockWave(fighter, arena) {
  if (!fighter || !fighter.perkKineticShock) return;

  spawnImpactFlash(fighter.x, fighter.y, 22);
  spawnSparks(fighter.x, fighter.y, 8, 'gold', '#FFA502');
  triggerHaptic('impact');

  const blastRadius = 90;
  const damage = 18;

  if (state.fighters) {
    for (let i = 0; i < state.fighters.length; i++) {
      const enemy = state.fighters[i];
      if (enemy && enemy !== fighter && enemy.hp > 0 && !enemy.dead) {
        const dist = Math.hypot(enemy.x - fighter.x, enemy.y - fighter.y);
        if (dist <= blastRadius + enemy.r) {
          enemy.takeDamage(damage, fighter, { isKineticShock: true });
          const angle = Math.atan2(enemy.y - fighter.y, enemy.x - fighter.x);
          enemy.vx += Math.cos(angle) * 6;
          enemy.vy += Math.sin(angle) * 6;
        }
      }
    }
  }
}

/**
 * Resets all active perks on a fighter
 * @param {Object} fighter
 */
export function resetFighterPerks(fighter) {
  if (!fighter) return;
  fighter.activePerks = [];
  fighter.perkTitansMight = false;
  fighter.perkVampiricTouch = false;
  fighter.perkAeroHaste = false;
  fighter.perkKineticShock = false;
  fighter.perkIronBastion = false;
  fighter.perkLightningStep = false;
  fighter.perkOverdriveZone = false;
  fighter.perkBouncingComet = false;
}

