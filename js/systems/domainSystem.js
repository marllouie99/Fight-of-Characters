import { spawnFloatingText } from '../core/state.js';
import { spawnSparks } from '../graphics/particles/sparkEffect.js';
import { clearDomainSlashLines } from '../entities/fighters/sukuna/sukunaDomainVisuals.js';
import { projectileSystem } from './projectileSystem.js';
import { CONFIG } from '../core/config.js';
import { triggerHaptic } from './mobileAppBridge.js';
import { stopFighterVoice } from './soundSystem.js';

export const JJK_FIGHTER_IDS = new Set([
  'choso',
  'gojo',
  'mahito',
  'mahoraga',
  'maki',
  'megumi',
  'nanami',
  'naoya',
  'nobara',
  'sukuna',
  'todo',
  'toji',
  'yuji',
  'yuta',
  'rika'
]);

/**
 * Checks whether Verse Equalization is enabled for Gojo's Unlimited Void.
 * @returns {boolean}
 */
export function isGojoDomainVerseEqualizationEnabled() {
  return Boolean(CONFIG?.gojo?.domainVerseEqualization ?? false);
}

/**
 * Checks whether a fighter/summon belongs to the Jujutsu Kaisen (JJK) universe.
 * Supports owner lookup for summons, shikigami, and illusions.
 * @param {Object} fighter
 * @param {number} [depth=0]
 * @returns {boolean}
 */
export function isJjkFighter(fighter, depth = 0) {
  if (!fighter || depth > 2) return false;
  const ids = [
    fighter.characterId,
    fighter.type,
    fighter._def?.id,
    fighter._def?.type
  ];
  for (const id of ids) {
    if (typeof id === 'string' && JJK_FIGHTER_IDS.has(id.toLowerCase())) {
      return true;
    }
  }
  const owner = fighter.owner || fighter.master || fighter.caster;
  if (owner && owner !== fighter) {
    return isJjkFighter(owner, depth + 1);
  }
  return false;
}

/**
 * Returns true if the target should receive heavy movement slow instead of full paralysis
 * when inside Unlimited Void (when Verse Equalization is disabled and target is non-JJK).
 * @param {Object} fighter
 * @returns {boolean}
 */
export function shouldGojoDomainSlowInsteadOfFreeze(fighter) {
  if (!fighter) return false;
  if (isGojoDomainVerseEqualizationEnabled()) return false;
  return !isJjkFighter(fighter);
}

/**
 * Checks if a fighter is immune to Domain Expansions (e.g. Toji Heavenly Restriction / Zero Cursed Energy).
 * @param {Object} fighter 
 * @returns {boolean}
 */
export function isDomainImmune(fighter) {
  if (!fighter) return false;
  return !!(
    fighter.domainImmunity ||
    fighter.isDomainImmune ||
    fighter.isTurret ||
    fighter.isDispenser ||
    fighter.isBuilding ||
    fighter.immuneToDebuffs ||
    fighter.isDebuffImmune ||
    fighter.characterId === 'toji' ||
    fighter.type === 'toji' ||
    fighter._def?.id === 'toji'
  );
}

/**
 * Checks whether an entity is inside an active enemy Unlimited Void
 * (Gojo's Domain Expansion or Rubbick's stolen Gojo Domain) and not domain-immune.
 * @param {Object} fighter
 * @param {Object} gameState
 * @returns {boolean}
 */
export function isInsideEnemyUnlimitedVoid(fighter, gameState) {
  if (!fighter || !gameState || !gameState.fighters) return false;
  if (
    fighter.domainImmunity ||
    fighter.isDomainImmune ||
    fighter.isParalyzeImmune ||
    fighter.gojoDomainAdapted ||
    fighter.gojoAdapted?.domain ||
    fighter.characterId === 'toji' ||
    fighter.type === 'toji' ||
    fighter._def?.id === 'toji'
  ) {
    return false;
  }

  const fighters = gameState.fighters;
  const myIndex = fighters.indexOf(fighter);
  const teamEntityIndex = myIndex >= 0
    ? myIndex
    : (fighter.owner ? fighters.indexOf(fighter.owner) : -1);
  const myTeam = (teamEntityIndex >= 0 && typeof gameState.getFighterTeam === 'function')
    ? gameState.getFighterTeam(teamEntityIndex)
    : (fighter.team !== undefined ? fighter.team : null);

  return fighters.some((f, fIdx) => {
    if (!f || f === fighter || f.hp <= 0) return false;
    if (fighter.owner === f) return false;

    const isGojoCaster = (
      f.characterId === 'gojo' ||
      f.type === 'gojo' ||
      f._def?.id === 'gojo'
    );
    const isRubbickVoidCaster = (
      (f.characterId === 'rubbick' || f.type === 'rubbick' || f.characterId === 'trickster' || f.type === 'trickster' || f._def?.id === 'rubbick' || f._def?.id === 'trickster') &&
      f.stolenType === 'gojo_domain'
    );
    const isUnlimitedVoidActive = Boolean(
      (isGojoCaster && f.domainActive) ||
      (isRubbickVoidCaster && (f.domainActive || f.stolenDomainActive)) ||
      (f.isParalyzingDomain && (f.domainActive || f.stolenDomainActive))
    );
    if (!isUnlimitedVoidActive) return false;

    if (myTeam !== null && typeof gameState.getFighterTeam === 'function') {
      const fTeam = gameState.getFighterTeam(fIdx);
      if (fTeam !== null && fTeam === myTeam) return false;
    }
    return true;
  });
}

/**
 * Checks if any Domain Expansion is currently active in the arena.
 * @param {Object} state 
 * @returns {boolean}
 */
export function isAnyDomainActive(state) {
  if (!state || !state.fighters) return false;
  return state.fighters.some(f => f && (f.domainActive || f.stolenDomainActive) && f.hp > 0);
}

/**
 * Returns an array of all fighters currently maintaining an active Domain Expansion.
 * @param {Object} state 
 * @returns {Array}
 */
export function getActiveDomains(state) {
  if (!state || !state.fighters) return [];
  return state.fighters.filter(f => f && (f.domainActive || f.stolenDomainActive) && f.hp > 0);
}

/**
 * Checks if multiple domains are currently active, resulting in a Domain Clash.
 * @param {Object} state 
 * @returns {boolean}
 */
export function isMultiDomainClash(state) {
  return getActiveDomains(state).length > 1;
}

/**
 * Checks if any fighter is actively channeling/casting a Domain Expansion.
 * @param {Object} state 
 * @returns {boolean}
 */
export function isAnyFighterChannelingDomain(state) {
  if (!state || !state.fighters) return false;
  return state.fighters.some(f => f && f.hp > 0 && (f.isChannelingDomain || f.isChannelingDomainExpansion || (f.characterId === 'rubbick' && f.stolenType === 'gojo_domain' && f.stolenWindUpTimer > 0)));
}

/**
 * Applies domain trap paralysis, text, and hit-stun to all trapped enemy fighters.
 * Automatically verifies Toji Heavenly Restriction immunity before applying CC.
 * @param {Object} owner - The fighter who deployed the domain
 * @param {Object} state - The game state
 * @param {number} [hitStunFrames=20] - Frames of hit-stun to apply
 * @param {string} [trapText='TRAPPED IN DOMAIN!'] - Text to display over trapped enemies
 * @param {string} [textColor='#FF69B4'] - Hex color of the text
 */
export function applyDomainTrapToEnemies(owner, state, hitStunFrames = 20, trapText = 'TRAPPED IN DOMAIN!', textColor = '#FF69B4') {
  if (!owner || !state || !state.fighters) return;

  triggerHaptic('heavy');

  const ownerIdx = state.fighters.indexOf(owner);
  const myTeam = state.getFighterTeam ? state.getFighterTeam(ownerIdx) : null;

  state.fighters.forEach((f, idx) => {
    if (f && f !== owner && f.hp > 0) {
      const isEnemy = myTeam === null || (state.getFighterTeam && state.getFighterTeam(idx) !== myTeam);
      if (isEnemy) {
        if (isDomainImmune(f)) {
          return; // Immune to domain expansion traps!
        }
        if (typeof f.applyHitStun === 'function') {
          f.applyHitStun(hitStunFrames);
        }
        if (trapText) {
          spawnFloatingText(f.x, f.y - 30, trapText, textColor);
        }
        spawnSparks(f.x, f.y, 6, 'silver', 'rgba(255, 105, 180, 1)');
      }
    }
  });
}

/**
 * Immediately tears down and cleans up an active or channeling Domain Expansion / Time Stop Sphere
 * when the owning fighter dies or is eliminated in 1v2, 2v2, FFA, or any match mode.
 * @param {Object} fighter - The fighter who died or whose domain needs clearing
 * @param {Object} [state] - The game state
 */
export function clearFighterDomain(fighter, state) {
  if (!fighter) return;

  const wasActive = Boolean(
    fighter.domainActive ||
    fighter.stolenDomainActive ||
    fighter._mahitoDomainActive ||
    fighter.sphereActive
  );
  const wasChanneling = Boolean(
    fighter.isChannelingDomain ||
    fighter.isChannelingDomainExpansion ||
    (fighter.characterId === 'rubbick' && fighter.stolenWindUpTimer > 0) ||
    fighter.isChargingStorm ||
    fighter.stormActive
  );

  if (!wasActive && !wasChanneling) return;

  // 1. Reset generic domain & channeling flags
  fighter.domainActive = false;
  fighter.stolenDomainActive = false;
  fighter._mahitoDomainActive = false;
  fighter.sphereActive = false;
  fighter.isChannelingDomain = false;
  fighter.isChannelingDomainExpansion = false;
  fighter.domainTimer = 0;
  fighter.stolenDomainTimer = 0;
  fighter.domainChargeTimer = 0;
  fighter.stolenWindUpTimer = 0;
  fighter.forcedMeleeTimer = 0;
  fighter.postDomainFadeInTimer = 0;

  const charId = fighter.characterId || fighter.type || fighter._def?.id;

  // MAHITO: Stop active domain channeling voicelines
  if (charId === 'mahito' || fighter.type === 'mahito') {
    if (typeof stopFighterVoice === 'function') {
      stopFighterVoice('mahito', 60, true);
    }
  }

  // GOJO: Unfreeze enemies trapped in Unlimited Void
  if (charId === 'gojo' || fighter.type === 'gojo') {
    fighter.isMeleeMode = false;
    if (state && state.fighters) {
      const myIdx = state.fighters.indexOf(fighter);
      const myTeam = (state.getFighterTeam && myIdx >= 0) ? state.getFighterTeam(myIdx) : (fighter.team !== undefined ? fighter.team : null);
      state.fighters.forEach((f, idx) => {
        if (f && f !== fighter && f.hp > 0) {
          const isEnemy = myTeam === null || (state.getFighterTeam ? state.getFighterTeam(idx) !== myTeam : f.team !== fighter.team);
          if (isEnemy) {
            f.timeStopTimer = 0;
            f.hitStunTimer = 0;
            delete f._timeStopOriginalDuration;
            delete f._timeStopStartTime;
            delete f._timeStopFrozenAngle;
            delete f._timeStopFrozenGunAngle;
          }
        }
      });
    }
  }

  // SUKUNA: Clear domain slash lines and active slashes
  if (charId === 'sukuna' || fighter.type === 'sukuna') {
    if (typeof clearDomainSlashLines === 'function') {
      clearDomainSlashLines();
    }
    if (fighter.slashHitVisuals) {
      fighter.slashHitVisuals.length = 0;
    }
    fighter._hasFiredFugaInDomain = false;
    fighter._isFiringDomainFuga = false;
    const normalCd = (CONFIG.sukuna && CONFIG.sukuna.divineFlameCooldown) ? CONFIG.sukuna.divineFlameCooldown : 1500;
    fighter.divineFlameCooldown = Math.max(fighter.divineFlameCooldown, normalCd);
  }

  // YUTA: Clear spawned domain swords
  if (charId === 'yuta' || fighter.type === 'yuta') {
    if (Array.isArray(fighter.domainSwords)) fighter.domainSwords.length = 0;
    if (Array.isArray(fighter.swords)) fighter.swords.length = 0;
  }

  // MAHITO: Unfreeze entities trapped by Mahito domain and clear hands/tendrils
  if (charId === 'mahito' || fighter.type === 'mahito') {
    if (state && state.fighters) {
      const candidates = [...state.fighters, ...(state.illusions || [])];
      for (const ent of candidates) {
        if (ent && ent.isFrozenByMahitoDomain) {
          ent.isFrozenByMahitoDomain = false;
        }
      }
    }
    if (Array.isArray(fighter.domainHands)) fighter.domainHands.length = 0;
    if (Array.isArray(fighter.domainTendrils)) fighter.domainTendrils.length = 0;
  }

  // RUBICK: Clear stolen domain and unfreeze enemies if stolen Gojo domain
  if (charId === 'rubbick' || fighter.type === 'rubbick') {
    fighter._rubbickDomainHybridReady = false;
    fighter.stolenType = null;
    fighter.stolenTimer = 0;
    if (state && state.fighters) {
      const myIdx = state.fighters.indexOf(fighter);
      const myTeam = (state.getFighterTeam && myIdx >= 0) ? state.getFighterTeam(myIdx) : null;
      state.fighters.forEach((f, idx) => {
        if (f && f !== fighter && f.hp > 0) {
          const isEnemy = myTeam === null || (state.getFighterTeam ? state.getFighterTeam(idx) !== myTeam : true);
          if (isEnemy) {
            f.timeStopTimer = 0;
            f.hitStunTimer = 0;
            delete f._timeStopOriginalDuration;
            delete f._timeStopStartTime;
            delete f._timeStopFrozenAngle;
            delete f._timeStopFrozenGunAngle;
          }
        }
      });
    }
  }

  // CRONOS: Restore frozen fighters and projectiles
  if (charId === 'cronos' || fighter.type === 'cronos') {
    fighter.speed = fighter.baseSpeed || fighter.speed;
    if (state && state.fighters) {
      for (const f of state.fighters) {
        if (f && f !== fighter && f.hp > 0 && f.timeStopTimer > 0) {
          f.timeStopTimer = 0;
          if (f._frozenByCronosSphere) {
            if (typeof f._resumeVx === 'number') f.vx = f._resumeVx;
            if (typeof f._resumeVy === 'number') f.vy = f._resumeVy;
            delete f._resumeVx;
            delete f._resumeVy;
            delete f._frozenByCronosSphere;
          }
          delete f._suppressFreezeTimer;
        }
      }
    }
    if (typeof projectileSystem !== 'undefined' && state && state.fighters) {
      const fi = state.fighters.indexOf(fighter);
      if (fi !== -1 && typeof projectileSystem.restoreFrozenProjectiles === 'function') {
        projectileSystem.restoreFrozenProjectiles(fi);
      }
    }
  }

  // MEGUMI: Clear domain shadow puddle
  if (charId === 'megumi' || fighter.type === 'megumi') {
    if (Array.isArray(fighter.domainShadowPuddle)) fighter.domainShadowPuddle.length = 0;
  }

  // ZEUS: Clear storm active and charging
  if (charId === 'zeus' || fighter.type === 'zeus') {
    fighter.stormActive = false;
    fighter.stormTimer = 0;
    fighter.isChargingStorm = false;
  }
}

/**
 * Scans all fighters in state and automatically cleans up active/channeling domains
 * for any fighter whose HP is <= 0 or who is dead.
 * @param {Object} state - The game state
 */
export function cleanupDeadFightersDomains(state) {
  if (!state || !state.fighters) return;
  for (let i = 0; i < state.fighters.length; i++) {
    const f = state.fighters[i];
    if (f && (f.hp <= 0 || f.isDead)) {
      if (f.isCurseWomb) continue; // Do not clear domain during Cursed Womb cocoon transformation
      if (f.domainActive || f.stolenDomainActive || f._mahitoDomainActive || f.sphereActive || f.isChannelingDomain || f.isChannelingDomainExpansion || f.stormActive || f.isChargingStorm) {
        clearFighterDomain(f, state);
      }
    }
  }
}
