import { state, getProjectiles, isMobileDevice } from '../core/state.js';
import { CONFIG, FIGHTER_DEFS } from '../core/config.js';
import { spatialGrid } from './physics.js';
import { burnEffectSystem } from '../graphics/particles/burnEffectVisuals.js';
import { flamewardenFlameSystem } from '../graphics/weapons/flamewardenWeaponGraphics.js';
import { bomberExplosionSystem } from '../graphics/particles/bomberExplosionVisuals.js';
import { resetCachedTime } from '../graphics/draw.js';
import { updateGame } from './updateSystem.js';
import { renderGame } from './renderSystem.js';
import { getAudioCurrentTime } from './soundSystem.js';
import { syncWakeLockWithGameState } from './screenLockSystem.js';
import { updateCinematicKo } from '../graphics/renderers/cinematicKoRenderer.js';

export const isMobile = isMobileDevice;
export const TARGET_FPS = 60; // Standard 60 FPS across all devices for consistent combat physics
export const FRAME_TIME = 1000 / TARGET_FPS;
const PHYSICS_STEP = 1000 / 60; // 16.6667ms canonical physics step
let _physicsAccumulator = 0;
let _recentFastFrameCount = 0;
let lastFrameTime = 0;
let isPageVisible = true;
let _uiScreensCache = null;
let _uiLayerCache = null;
let _lastWakeState = null;
const _MENU_STATES = new Set([
  'title',
  'select',
  'horizontal_select',
  'index',
  'indexDetail',
  'leaderboard',
  'weapons',
  'weaponDetail',
  'weaponStudio',
  'skinStudio',
  'survivorStudio',
  'curtain'
]);

// Pause game loop when tab is hidden (mobile optimization)
document.addEventListener('visibilitychange', () => {
  isPageVisible = !document.hidden;
  if (isPageVisible) {
    const now = performance.now();
    lastFrameTime = now;
    if (state) {
      state.fpsLastTime = now;
      state.fpsFrames = 0;
    }
  }
});

export function animate(timestamp) {
  // Skip updates when page is hidden
  if (!isPageVisible) {
    requestAnimationFrame(animate);
    return;
  }

  // Adaptive High-Refresh Rate & Universal Frame Pacing:
  // On standard 60Hz displays (like iPhone 11 Pro and 60Hz mobile screens), WebKit timer jitter
  // produces frame intervals between 12ms and 20ms. Lowering the throttle threshold to 11.5ms
  // ensures ZERO frames are dropped on 60Hz screens, eliminating the 30 FPS stutter lock.
  // On 90Hz / 120Hz displays, when high-refresh rate is enabled, frames arrive faster (8.3ms–11.1ms);
  // we decouple 60Hz fixed physics stepping from native refresh rate rasterization!
  const isMenuState = _MENU_STATES.has(state.gameState);
  const isHighRefreshEnabled = Boolean(CONFIG?.enableHighRefreshRate ?? state.enableHighRefreshRate ?? true);

  // Dynamic Screen Wake Lock synchronization across game state transitions
  if (state && state.gameState !== _lastWakeState) {
    _lastWakeState = state.gameState;
    syncWakeLockWithGameState(state.gameState);
  }

  if (!lastFrameTime) lastFrameTime = timestamp;
  const elapsed = timestamp - lastFrameTime;

  // Throttle check: allow sub-11.5ms frames only when high-refresh is enabled (min 5.5ms for up to 144Hz)
  const minInterval = isHighRefreshEnabled ? 5.5 : 11.5;
  if (elapsed < minInterval) {
    requestAnimationFrame(animate);
    return;
  }

  // Detect display refresh rate dynamically based on frame timing
  if (elapsed <= 9.5) {
    _recentFastFrameCount++;
    if (_recentFastFrameCount >= 8) {
      state.displayRefreshRate = 120;
      state.highRefreshActive = isHighRefreshEnabled;
    }
  } else if (elapsed <= 12.0) {
    _recentFastFrameCount++;
    if (_recentFastFrameCount >= 8) {
      state.displayRefreshRate = 90;
      state.highRefreshActive = isHighRefreshEnabled;
    }
  } else {
    _recentFastFrameCount = Math.max(0, _recentFastFrameCount - 1);
    if (_recentFastFrameCount === 0 && elapsed >= 14.5) {
      state.displayRefreshRate = 60;
      state.highRefreshActive = false;
    }
  }

  const targetInterval = state.highRefreshActive ? (1000 / (state.displayRefreshRate || 120)) : (1000 / 60);
  lastFrameTime = elapsed >= targetInterval ? timestamp - (elapsed % targetInterval) : timestamp;

  try {
    // FPS calculation
    if (!state.fpsLastTime) state.fpsLastTime = timestamp;
    state.fpsFrames++;
    if (timestamp - state.fpsLastTime >= 1000) {
      state.fps = state.fpsFrames;
      state.fpsFrames = 0;
      state.fpsLastTime = timestamp;
      if (state._frameDurationCount > 0) {
        state.cpuFrameMs = (state._frameDurationSum / state._frameDurationCount).toFixed(1);
        state._frameDurationSum = 0;
        state._frameDurationCount = 0;
      }

      // Adaptive particle and LOD quality: dynamically scales based on live frame time and FPS
      const cpuMs = parseFloat(state.cpuFrameMs) || 0;
      const curFps = state.fps || 60;
      if (state.performanceMode) {
        state.qualityLevel = 0.2;
      } else if (isMobile) {
        const prevQ = typeof state.qualityLevel === 'number' ? state.qualityLevel : 0.65;
        if (!isMenuState && (cpuMs > 14.0 || curFps < 50)) {
          state.qualityLevel = Math.max(0.35, +(prevQ - 0.10).toFixed(2));
        } else if (cpuMs > 0 && cpuMs < 8.5 && curFps >= 56) {
          state.qualityLevel = Math.min(0.85, +(prevQ + 0.05).toFixed(2));
        } else {
          state.qualityLevel = Math.max(0.35, Math.min(0.85, prevQ));
        }
      } else {
        const prevQ = typeof state.qualityLevel === 'number' ? state.qualityLevel : 1.0;
        if (!isMenuState && cpuMs > 15.5 && curFps < 48) {
          state.qualityLevel = Math.max(0.55, +(prevQ - 0.15).toFixed(2));
        } else if (cpuMs < 11.0 || isMenuState) {
          state.qualityLevel = Math.min(1.0, +(prevQ + 0.10).toFixed(2));
        }
      }

      // Track active particles
      let burnActive = 0;
      if (burnEffectSystem && burnEffectSystem.particles) {
        burnActive = burnEffectSystem.particles.length; // BurnEffectSystem already manages active-only particles in this array
      }
      let flameActive = 0;
      if (flamewardenFlameSystem && flamewardenFlameSystem.particles) {
        const parts = flamewardenFlameSystem.particles;
        for (let i = 0; i < parts.length; i++) {
          if (parts[i] && parts[i].active) {
            flameActive++;
          }
        }
      }

      const totalParticles = state.bloodEffects.length + state.deathEffects.length +
        state.berserkerRageEffects.length + (state.sparkEffects ? state.sparkEffects.length : 0) +
        burnActive + flameActive;

      // FPS Drop Detection (Throttled to once per second to eliminate diagnostic overhead during combat)
      if (state.fps < 45 && state.gameState === 'playing' && (!state._lastFpsLogTime || (timestamp - state._lastFpsLogTime >= 1000))) {
        state._lastFpsLogTime = timestamp;
        // Collect diagnostic data synchronously (cheap integer checks)
        const currentFps = state.fps;
        const projCount = getProjectiles().length;
        const particleCount = totalParticles;
        const explosionsCount = (bomberExplosionSystem && bomberExplosionSystem.particles) ? bomberExplosionSystem.particles.length : 0;

        // Spatial grid clash detection (lightweight integer work)
        let closeFighters = 0;
        let clashingNames = new Set();

        for (const fighter of state.fighters) {
          if (!fighter || fighter.hp <= 0) continue;

          const nearbyFighters = spatialGrid.getNearby(fighter.x, fighter.y, 150);
          for (const other of nearbyFighters) {
            if (other === fighter || !other.hp || other.hp <= 0) continue;

            const dist = Math.hypot(other.x - fighter.x, other.y - fighter.y);
            if (dist < 150) {
              closeFighters++;
              let n1 = (fighter.fighterIndex !== undefined && FIGHTER_DEFS[fighter.fighterIndex]) ? FIGHTER_DEFS[fighter.fighterIndex].name : 'Unknown';
              let n2 = (other.fighterIndex !== undefined && FIGHTER_DEFS[other.fighterIndex]) ? FIGHTER_DEFS[other.fighterIndex].name : 'Unknown';
              clashingNames.add(n1);
              clashingNames.add(n2);
            }
          }
        }

        // Divide by 2 since each pair is counted twice
        closeFighters = Math.floor(closeFighters / 2);

        const aliveFighters = [];
        for (let i = 0; i < state.fighters.length; i++) {
          const f = state.fighters[i];
          if (f && f.hp > 0) {
            aliveFighters.push((f.fighterIndex !== undefined && FIGHTER_DEFS[f.fighterIndex]) ? FIGHTER_DEFS[f.fighterIndex].name : 'Unknown');
          }
        }
        
        // Defer heavy string concatenation/array operations to idle time
        const logTask = () => {
          let issues = [];
          if (projCount > 30) issues.push(`${projCount} Projectiles`);
          if (particleCount > 80) issues.push(`${particleCount} Particles`);
          if (explosionsCount > 3) issues.push(`${explosionsCount} Explosions`);
  
          if (closeFighters > 0) {
            let names = Array.from(clashingNames).join(', ');
            issues.push(`Clash (${closeFighters} close) [${names}]`);
          }
  
          let logText = '';
          if (issues.length > 0) {
            if (closeFighters === 0 && aliveFighters.length > 0) {
              issues.push(`Active: [${aliveFighters.join(', ')}]`);
            }
            logText = `[FPS: ${currentFps}] ${issues.join(', ')}`;
          } else {
            logText = `[FPS: ${currentFps}] Unknown Heavy Load [${aliveFighters.join(', ')}]`;
          }
  
          state.fpsLogs.push({ text: logText, timer: 300 });
          if (state.fpsLogs.length > 5) {
            state.fpsLogs[0] = state.fpsLogs[state.fpsLogs.length - 1];
            state.fpsLogs.pop();
          }
  
          state.allFpsLogs.push(`[${new Date().toLocaleTimeString()}] ${logText}`);
          const MAX_FPS_LOGS = 1000;
          if (state.allFpsLogs.length > MAX_FPS_LOGS) {
            state.allFpsLogs.splice(0, state.allFpsLogs.length - MAX_FPS_LOGS);
          }
        };

        if (window.requestIdleCallback) {
          window.requestIdleCallback(logTask);
        } else {
          setTimeout(logTask, 0);
        }
      }
    }

    if (state.fpsLogsCopiedTimer > 0) {
      state.fpsLogsCopiedTimer--;
    }

    if (state.fpsLogs) {
      for (let i = state.fpsLogs.length - 1; i >= 0; i--) {
        state.fpsLogs[i].timer--;
        if (state.fpsLogs[i].timer <= 0) {
          state.fpsLogs.splice(i, 1);
        }
      }
    }

    // Reset cached time for this frame (performance optimization)
    resetCachedTime();
    state.frameAudioTime = getAudioCurrentTime();

    const _t0 = performance.now();

    const timeDilation = state.timeDilation || 1.0;

    if (state.highRefreshActive) {
      // Decoupled High-Refresh Pipeline: Fixed 60Hz Physics Accumulator + Native 90/120Hz Rasterization
      const delta = Math.min(elapsed, 50.0) * timeDilation; // Scale accumulator step by time dilation
      _physicsAccumulator += delta;

      let updates = 0;
      while (_physicsAccumulator >= PHYSICS_STEP && updates < 3) {
        updateGame();
        _physicsAccumulator -= PHYSICS_STEP;
        updates++;
      }
      if (_physicsAccumulator > PHYSICS_STEP * 2) {
        _physicsAccumulator = 0;
      }
      updateCinematicKo();
      renderGame();
    } else {
      // Standard Canonical 60 FPS Lockstep (with time dilation accumulator support)
      if (timeDilation < 0.99) {
        _physicsAccumulator += PHYSICS_STEP * timeDilation;
        if (_physicsAccumulator >= PHYSICS_STEP) {
          updateGame();
          _physicsAccumulator -= PHYSICS_STEP;
        }
      } else {
        _physicsAccumulator = 0;
        updateGame();
      }
      updateCinematicKo();
      renderGame();
    }

    const _frameCost = performance.now() - _t0;
    state._frameDurationSum = (state._frameDurationSum || 0) + _frameCost;
    state._frameDurationCount = (state._frameDurationCount || 0) + 1;

    // Sync HTML UI Screens
    if (state.lastGameState !== state.gameState) {
      state.lastGameState = state.gameState;
      const inCombatTouchLock = !isMenuState;
      if (typeof document !== 'undefined') {
        if (document.body && document.body.classList) {
          document.body.classList.toggle('in-combat-touch-lock', inCombatTouchLock);
        }
        if (document.documentElement && document.documentElement.classList) {
          document.documentElement.classList.toggle('in-combat-touch-lock', inCombatTouchLock);
        }
      }
      if (!_uiScreensCache) _uiScreensCache = document.querySelectorAll('.ui-screen');
      const screens = _uiScreensCache;
      if (screens && screens.length > 0) {
        screens.forEach(s => s.classList.remove('active'));
        const activeScreen = document.getElementById(state.gameState + '-screen');
        if (activeScreen) activeScreen.classList.add('active');
        
        if (!_uiLayerCache) _uiLayerCache = document.getElementById('ui-layer');
        const uiLayer = _uiLayerCache;
        if (uiLayer) {
            uiLayer.style.pointerEvents = ['title'].includes(state.gameState) ? 'auto' : 'none';
        }
      }
    }

  } catch (e) {
    console.error('Game loop error:', e);
  }

  requestAnimationFrame(animate);
}

export function startGameLoop() {
  requestAnimationFrame(animate);
}
