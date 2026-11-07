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
      const card = createCurtainCard(def, idx, i === 0 ? 'ACTIVE' : `RESERVE ${i}`, '#FF3344', i === 0);
      leftRoster.appendChild(card);
    });

    // Build Team Blue cards
    team1.forEach((idx, i) => {
      const def = FIGHTER_DEFS[idx];
      if (!def || !rightRoster) return;
      const card = createCurtainCard(def, idx, i === 0 ? 'ACTIVE' : `RESERVE ${i}`, '#38BDF8', i === 0);
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
          const basic = getFighterBasicAttackSoundPaths(def.type);
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
      const card = createCurtainCard(playerDef, playerIdx, 'SURVIVOR', '#22C55E', true);
      leftRoster.appendChild(card);
    }

    if (rightRoster) {
      const hordeCard = document.createElement('div');
      hordeCard.className = 'curtain-fighter-card active-slot';
      hordeCard.innerHTML = `
        <div class="curtain-fighter-thumb horde-thumb">
          <span class="horde-icon">🧟</span>
        </div>
        <div class="curtain-fighter-info">
          <span class="curtain-fighter-name">ENDLESS HORDE</span>
          <span class="curtain-fighter-role" style="color: #FF3344;">UNDEAD LEGION</span>
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
  } else {
    finishCurtain();
  }

  return true;
}

function createCurtainCard(def, idx, roleText, accentColor, isActive = false) {
  const card = document.createElement('div');
  card.className = `curtain-fighter-card${isActive ? ' active-slot' : ''}`;

  const thumb = document.createElement('div');
  thumb.className = 'curtain-fighter-thumb';

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
      }
    }
  } catch (_) {}

  const info = document.createElement('div');
  info.className = 'curtain-fighter-info';

  const name = document.createElement('span');
  name.className = 'curtain-fighter-name';
  name.textContent = (def.name || 'FIGHTER').toUpperCase();

  const role = document.createElement('span');
  role.className = 'curtain-fighter-role';
  role.style.color = accentColor;
  role.textContent = roleText;

  info.appendChild(name);
  info.appendChild(role);

  card.appendChild(thumb);
  card.appendChild(info);

  return card;
}
