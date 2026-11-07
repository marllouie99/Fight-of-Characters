/**
 * PreBattleCurtain.js
 * 
 * Mobile 60 FPS Pre-Battle VS Loading Curtain (SceneLoadingCurtain Standard)
 * Masks asset decode, offscreen quad caching, GPU texture uploads (1x1 warm-up),
 * and audio buffer pre-warming behind an esports-grade VS matchup curtain for
 * Tag Match (3v3 Relay) and Survivor Modes.
 */

import { state } from '../../core/state.js';
import { FIGHTER_DEFS } from '../../core/config.js';
import { createFighterInstance } from '../../core/state.js';
import { prewarmMatchAssets } from '../mobileAssetScaler.js';
import { preloadFighterAssets } from '../../core/gameFlow.js';
import { preloadSound } from '../../systems/soundSystem.js';
import { audioSystem } from '../../systems/audioSystem.js';
import { getFighterPreview } from './FighterPreviewCache.js';
import { getFighterSkillSoundPaths } from '../../soundEffects/skillSounds.js';
import { getFighterBasicAttackSoundPaths } from '../../soundEffects/basicAttackSounds.js';
import { getAnnouncerSoundPaths } from '../../soundEffects/announcerSounds.js';
import { clearAllPools } from '../objectPool.js';
import { GAME_MODES } from '../../core/modeConfig.js';

let _isCurtainActive = false;
let _curtainTimeoutId = null;

export function isPreBattleCurtainActive() {
  return _isCurtainActive;
}

export function showPreBattleCurtain(onComplete) {
  if (typeof document === 'undefined') {
    if (typeof onComplete === 'function') onComplete();
    return false;
  }

  const curtain = document.getElementById('prebattle-curtain');
  if (!curtain) {
    if (typeof onComplete === 'function') onComplete();
    return false;
  }

  const modeBadge = document.getElementById('curtain-mode-badge');
  const subBadge = document.getElementById('curtain-sub-badge');
  const leftName = document.getElementById('curtain-left-name');
  const rightName = document.getElementById('curtain-right-name');
  const leftRoster = document.getElementById('curtain-left-roster');
  const rightRoster = document.getElementById('curtain-right-roster');
  const progressBar = document.getElementById('curtain-progress-bar');
  const statusText = document.getElementById('curtain-status-text');
  const statusPct = document.getElementById('curtain-status-pct');

  _isCurtainActive = true;
  curtain.classList.remove('curtain-closing');
  curtain.style.display = 'flex';

  if (leftRoster) leftRoster.innerHTML = '';
  if (rightRoster) rightRoster.innerHTML = '';

  const setProgress = (pct, text) => {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    if (progressBar) progressBar.style.width = `${clamped}%`;
    if (statusPct) statusPct.textContent = `${clamped}%`;
    if (statusText && text) statusText.textContent = text;
  };

  setProgress(10, 'PREPARING ROSTER...');

  let finished = false;
  const finishCurtain = () => {
    if (finished) return;
    finished = true;
    _isCurtainActive = false;
    if (_curtainTimeoutId) {
      clearTimeout(_curtainTimeoutId);
      _curtainTimeoutId = null;
    }
    curtain.classList.add('curtain-closing');
    if (typeof audioSystem !== 'undefined' && audioSystem.playSFX) {
      try {
        audioSystem.playSFX('battleintro_transitions', 0.85);
      } catch (_) {}
    }
    setTimeout(() => {
      curtain.style.display = 'none';
      curtain.classList.remove('curtain-closing');
      if (typeof onComplete === 'function') onComplete();
    }, 280);
  };

  // Skip trigger on tap or click
  curtain.onclick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    finishCurtain();
  };
  curtain.ontouchend = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    finishCurtain();
  };

  const isTagMatch = (state.mode === GAME_MODES.TAG_MATCH || state.mode === 'Tag Match');
  const isSurvivor = (state.mode === GAME_MODES.SURVIVOR || state.mode === 'Survivor');
  const is2v2 = (state.mode === GAME_MODES.TWO_VS_TWO || state.mode === '2v2');
  const is1v2 = (state.mode === GAME_MODES.ONE_VS_TWO || state.mode === '1v2' || state.mode === '1v2 Stand Off' || state.mode === 'Stand Off 1v2');

  if (isTagMatch) {
    if (modeBadge) modeBadge.textContent = '3V3 TAG MATCH';
    if (subBadge) subBadge.textContent = 'ROSTER ASSET PRE-WARM';
    if (leftName) leftName.textContent = 'TEAM RED';
    if (rightName) rightName.textContent = 'TEAM BLUE';

    const team0 = (state.tagMatch && state.tagMatch.team0Roster) ? state.tagMatch.team0Roster : [state.p1Index ?? 0, state.p3Index ?? 2, state.p5Index ?? 4];
    const team1 = (state.tagMatch && state.tagMatch.team1Roster) ? state.tagMatch.team1Roster : [state.p2Index ?? 1, state.p4Index ?? 3, state.p6Index ?? 5];

    // Build Team Red cards
    team0.forEach((idx, i) => {
      const def = FIGHTER_DEFS[idx];
      if (!def || !leftRoster) return;
      const card = createCurtainCard(def, idx, i === 0 ? 'ACTIVE' : `RESERVE ${i}`, i === 0 ? '#ffffff' : '#000000', i === 0);
      leftRoster.appendChild(card);
    });

    // Build Team Blue cards
    team1.forEach((idx, i) => {
      const def = FIGHTER_DEFS[idx];
      if (!def || !rightRoster) return;
      const card = createCurtainCard(def, idx, i === 0 ? 'ACTIVE' : `RESERVE ${i}`, i === 0 ? '#ffffff' : '#000000', i === 0);
      rightRoster.appendChild(card);
    });

    // Asynchronous Pre-warming for all 6 fighters
    setTimeout(() => {
      if (finished) return;
      setProgress(40, 'PRE-WARMING GPU SHADERS...');
      const allIndexes = [...team0, ...team1].filter(idx => typeof idx === 'number');
      const dummyFighters = [];
      const soundPaths = [];

      for (const idx of allIndexes) {
        const def = FIGHTER_DEFS[idx];
        if (!def) continue;
        try {
          preloadFighterAssets(idx, true);
          const f = createFighterInstance(def, { x: 100, y: 100, color: def.color, controls: {} });
          if (f) dummyFighters.push(f);
        } catch (_) {}

        try {
          const skills = getFighterSkillSoundPaths(def.type);
          const basic = getFighterBasicAttackSoundPaths(def.id, def.type);
          soundPaths.push(...skills, ...basic);
        } catch (_) {}
      }

      // Prewarm GPU textures & body skin canvases
      if (dummyFighters.length > 0) {
        prewarmMatchAssets(dummyFighters, state.ctx);
      }

      setTimeout(() => {
        if (finished) return;
        setProgress(75, 'PRELOADING AUDIO BUFFERS...');
        if (soundPaths.length > 0) {
          const unique = [...new Set(soundPaths.filter(Boolean))];
          preloadSound(unique, { priority: true }).catch(() => {});
        }

        setTimeout(() => {
          if (finished) return;
          setProgress(100, 'ROSTER READY');
          _curtainTimeoutId = setTimeout(finishCurtain, 220);
        }, 220);
      }, 200);
    }, 150);

  } else if (isSurvivor) {
    if (modeBadge) modeBadge.textContent = 'SURVIVAL MODE';
    if (subBadge) subBadge.textContent = 'ARENA & WEAPON PRE-WARM';
    if (leftName) leftName.textContent = 'CHAMPION';
    if (rightName) rightName.textContent = 'THE HORDE';

    const playerIdx = state.p1Index ?? 0;
    const playerDef = FIGHTER_DEFS[playerIdx];

    if (playerDef && leftRoster) {
      const card = createCurtainCard(playerDef, playerIdx, 'SURVIVOR', '#ffffff', true);
      leftRoster.appendChild(card);
    }

    if (rightRoster) {
      const hordeCard = document.createElement('div');
      hordeCard.className = 'curtain-fighter-card active-slot';
      hordeCard.innerHTML = `
        <div class="curtain-fighter-thumb horde-thumb">
          <svg class="pixel-icon" viewBox="0 0 16 16" width="18" height="18" fill="none" shape-rendering="crispEdges">
            <path d="M4 2h8v2h2v5h-2v2h-1v3H5v-3H4V9H2V4h2V2z" fill="#ffffff"/>
            <path d="M5 6h2v2H5V6z M9 6h2v2H9V6z M7 9h2v1H7V9z M6 12h1v2H6v-2z M9 12h1v2H9v-2z" fill="#000000"/>
          </svg>
        </div>
        <div class="curtain-fighter-info">
          <span class="curtain-fighter-name">ENDLESS HORDE</span>
          <span class="curtain-fighter-role" style="color: #ffffff;">UNDEAD LEGION</span>
        </div>
      `;
      rightRoster.appendChild(hordeCard);
    }

    setTimeout(() => {
      if (finished) return;
      setProgress(45, 'PRE-WARMING COMBAT SHADERS...');
      preloadFighterAssets(playerIdx, true);
      if (state.fighters && state.fighters[0]) {
        prewarmMatchAssets([state.fighters[0]], state.ctx);
      }

      setTimeout(() => {
        if (finished) return;
        setProgress(80, 'PRELOADING SURVIVOR AUDIO...');
        const survivorSounds = [
          'Assets/Sound Effects/SkillEffects/zombie-chomp.wav',
          'Assets/Sound Effects/SkillEffects/zombie-groan.wav',
          'Assets/Sound Effects/SkillEffects/zombie-brains.wav',
          'Assets/Sound Effects/SkillEffects/zombie-metal-clank.wav',
          'Assets/Sound Effects/SkillEffects/zombie-hugewave.wav',
          'Assets/Sound Effects/SkillEffects/splat3.ogg',
          'Assets/Sound Effects/SkillEffects/crazydave-Planting.ogg',
          'Assets/Sound Effects/Sprites SFX/crazydave-sun-pickup.mp3',
          'Assets/Sound Effects/Attacks/crazydave-peashooter-shot.mp3'
        ];
        preloadSound(survivorSounds, { priority: true }).catch(() => {});

        setTimeout(() => {
          if (finished) return;
          setProgress(100, 'ARENA READY');
          _curtainTimeoutId = setTimeout(finishCurtain, 220);
        }, 220);
      }, 200);
    }, 150);
  } else if (is2v2) {
    if (modeBadge) modeBadge.textContent = '2V2 TEAM BATTLE';
    if (subBadge) subBadge.textContent = 'SQUAD ASSET PRE-WARM';
    if (leftName) leftName.textContent = 'TEAM RED';
    if (rightName) rightName.textContent = 'TEAM BLUE';

    const p1Idx = state.p1Index ?? 0;
    const p3Idx = state.p3Index ?? 2;
    const p2Idx = state.p2Index ?? 1;
    const p4Idx = state.p4Index ?? 3;

    const p1Def = FIGHTER_DEFS[p1Idx];
    const p3Def = FIGHTER_DEFS[p3Idx];
    const p2Def = FIGHTER_DEFS[p2Idx];
    const p4Def = FIGHTER_DEFS[p4Idx];

    if (p1Def && leftRoster) leftRoster.appendChild(createCurtainCard(p1Def, p1Idx, 'P1 LEADER', '#ffffff', true));
    if (p3Def && leftRoster) leftRoster.appendChild(createCurtainCard(p3Def, p3Idx, 'P1 PARTNER', '#ffffff', false));
    if (p2Def && rightRoster) rightRoster.appendChild(createCurtainCard(p2Def, p2Idx, 'P2 LEADER', '#ffffff', true));
    if (p4Def && rightRoster) rightRoster.appendChild(createCurtainCard(p4Def, p4Idx, 'P2 PARTNER', '#ffffff', false));

    prewarmCombatRoster([p1Idx, p3Idx, p2Idx, p4Idx]);

  } else if (is1v2) {
    if (modeBadge) modeBadge.textContent = '1V2 HANDICAP MATCH';
    if (subBadge) subBadge.textContent = 'COMBATANT PRE-WARM';
    if (leftName) leftName.textContent = 'SOLO FIGHTER';
    if (rightName) rightName.textContent = 'OPPONENT DUO';

    const p1Idx = state.p1Index ?? 0;
    const p2Idx = state.p2Index ?? 1;
    const p3Idx = state.p3Index ?? 2;

    const p1Def = FIGHTER_DEFS[p1Idx];
    const p2Def = FIGHTER_DEFS[p2Idx];
    const p3Def = FIGHTER_DEFS[p3Idx];

    if (p1Def && leftRoster) leftRoster.appendChild(createCurtainCard(p1Def, p1Idx, 'CHALLENGER', '#ffffff', true));
    if (p2Def && rightRoster) rightRoster.appendChild(createCurtainCard(p2Def, p2Idx, 'OPPONENT 1', '#ffffff', true));
    if (p3Def && rightRoster) rightRoster.appendChild(createCurtainCard(p3Def, p3Idx, 'OPPONENT 2', '#ffffff', false));

    prewarmCombatRoster([p1Idx, p2Idx, p3Idx]);

  } else {
    // 1v1 Duel, Tournament, or default match
    const modeName = (state.mode === 'Tournament' || state.mode === GAME_MODES.TOURNAMENT) ? 'TOURNAMENT DUEL' : '1V1 DUEL';
    if (modeBadge) modeBadge.textContent = modeName;
    if (subBadge) subBadge.textContent = 'COMBATANT PRE-WARM';
    if (leftName) leftName.textContent = 'PLAYER 1';
    if (rightName) rightName.textContent = 'PLAYER 2';

    const p1Idx = state.p1Index ?? 0;
    const p2Idx = state.p2Index ?? 1;

    const p1Def = FIGHTER_DEFS[p1Idx];
    const p2Def = FIGHTER_DEFS[p2Idx];

    if (p1Def && leftRoster) leftRoster.appendChild(createCurtainCard(p1Def, p1Idx, 'CHALLENGER', '#ffffff', true));
    if (p2Def && rightRoster) rightRoster.appendChild(createCurtainCard(p2Def, p2Idx, 'OPPONENT', '#ffffff', true));

    prewarmCombatRoster([p1Idx, p2Idx]);
  }

  function prewarmCombatRoster(indexes) {
    // Prime object pools to avoid garbage collection allocations during Round 1
    try {
      clearAllPools();
    } catch (_) {}

    setTimeout(() => {
      if (finished) return;
      setProgress(35, 'BAKING SPRITES & GPU SHADERS...');

      const activeFighters = (state.fighters && state.fighters.length > 0)
        ? state.fighters.filter(Boolean)
        : [];

      // If state.fighters is not fully initialized, construct dummy fighter instances for pre-warming
      if (activeFighters.length === 0) {
        for (const idx of indexes) {
          const def = FIGHTER_DEFS[idx];
          if (!def) continue;
          try {
            const f = createFighterInstance(def, { x: 100, y: 100, color: def.color, controls: {} });
            if (f) activeFighters.push(f);
          } catch (_) {}
        }
      }

      // Prewarm GPU textures, hair PNGs, and offscreen body skin canvases (Rule 35)
      if (activeFighters.length > 0) {
        prewarmMatchAssets(activeFighters, state.ctx);
      }

      for (const idx of indexes) {
        if (typeof idx === 'number') {
          preloadFighterAssets(idx, true);
        }
      }

      setTimeout(() => {
        if (finished) return;
        setProgress(70, 'DECODING COMBAT AUDIO...');

        const soundPaths = [...getAnnouncerSoundPaths()];
        for (const idx of indexes) {
          const def = FIGHTER_DEFS[idx];
          if (!def) continue;
          try {
            soundPaths.push(...getFighterSkillSoundPaths(def.type));
            soundPaths.push(...getFighterBasicAttackSoundPaths(def.id, def.type));
          } catch (_) {}
        }

        const uniqueSounds = [...new Set(soundPaths.filter(Boolean))];
        if (uniqueSounds.length > 0) {
          preloadSound(uniqueSounds, { priority: true }).catch(() => {});
        }

        setTimeout(() => {
          if (finished) return;
          setProgress(100, 'COMBAT READY • 60 FPS');
          _curtainTimeoutId = setTimeout(finishCurtain, 180);
        }, 180);
      }, 180);
    }, 120);
  }

  return true;
}

function createCurtainCard(def, idx, roleText, accentColor, isActive = false) {
  const card = document.createElement('div');
  card.className = `curtain-fighter-card${isActive ? ' active-slot' : ''}`;

  const charColor = def.color || accentColor || '#ffffff';
  if (isActive) {
    card.style.borderColor = charColor;
    card.style.boxShadow = `4px 4px 0px ${charColor}`;
  }

  const thumb = document.createElement('div');
  thumb.className = 'curtain-fighter-thumb';
  if (isActive) {
    thumb.style.borderColor = charColor;
  }

  let previewDrawn = false;
  try {
    const previewCanvas = getFighterPreview(idx);
    if (previewCanvas && previewCanvas.width > 0) {
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(previewCanvas, 0, 0, 32, 32);
        thumb.appendChild(c);
        previewDrawn = true;
      }
    }
  } catch (_) {}

  // If preview thumbnail is not ready yet, render a stylized circular fallback with theme color & initial
  if (!previewDrawn) {
    const fallback = document.createElement('div');
    fallback.style.width = '100%';
    fallback.style.height = '100%';
    fallback.style.borderRadius = '50%';
    fallback.style.backgroundColor = charColor;
    fallback.style.display = 'flex';
    fallback.style.alignItems = 'center';
    fallback.style.justifyContent = 'center';
    fallback.style.fontFamily = "'Press Start 2P', monospace";
    fallback.style.fontSize = '12px';
    fallback.style.fontWeight = 'bold';
    fallback.style.color = '#000000';
    fallback.textContent = (def.name || 'F')[0].toUpperCase();
    thumb.appendChild(fallback);
  }

  const info = document.createElement('div');
  info.className = 'curtain-fighter-info';

  const name = document.createElement('span');
  name.className = 'curtain-fighter-name';
  name.textContent = (def.name || 'FIGHTER').toUpperCase();

  const role = document.createElement('span');
  role.className = 'curtain-fighter-role';
  role.style.color = charColor;
  role.textContent = roleText;

  info.appendChild(name);
  info.appendChild(role);

  card.appendChild(thumb);
  card.appendChild(info);

  return card;
}
