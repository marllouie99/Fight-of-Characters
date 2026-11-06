import { state } from './state.js';
import { CONFIG } from './config.js';
import { resetCamera } from '../systems/cameraSystem.js';
import {
  ARENA_VERTICAL,
  CANVAS_VERTICAL,
  ARENA_DUEL_HORIZONTAL,
  ARENA_FFA_HORIZONTAL,
  ARENA_GRAND,
  ARENA_SURVIVOR,
  CANVAS_HORIZONTAL,
  getDefaultArena,
} from '../configs/arenaConstants.js';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * VIEWPORT MANAGER
 * Handles dynamic switching between Vertical View (9:16 Portrait - 540x960)
 * for YouTube Shorts / Mobile and Horizontal View (16:9 Landscape - 960x540)
 * for Longform YouTube Videos / Grand Teamfights with zero page reloads.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const VIEWPORT_MODES = {
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal',
};

export const VIEWPORT_CONFIGS = {
  [VIEWPORT_MODES.VERTICAL]: {
    width: CANVAS_VERTICAL.width,
    height: CANVAS_VERTICAL.height,
    arena: { ...ARENA_VERTICAL },
    label: '📱 Vertical (9:16 Shorts)',
  },
  [VIEWPORT_MODES.HORIZONTAL]: {
    width: CANVAS_HORIZONTAL.width,
    height: CANVAS_HORIZONTAL.height,
    arena: { ...ARENA_DUEL_HORIZONTAL },
    ffaArena: { ...ARENA_FFA_HORIZONTAL },
    grandArena: { ...ARENA_GRAND },
    survivorArena: { ...ARENA_SURVIVOR },
    label: '🖥️ Horizontal (16:9 Widescreen)',
  },
};

/**
 * Helper to check if the current or target game mode is an FFA mode.
 */
/**
 * Helper to check if the current or target game mode is Survivor horde mode.
 */
export function isSurvivorMode(mode) {
  const m = mode || (typeof state !== 'undefined' ? state.mode : '');
  return Boolean(
    m === 'Survivor' ||
    (typeof GAME_MODES !== 'undefined' && m === GAME_MODES.SURVIVOR)
  );
}

export function isFfaMode(mode) {
  const m = mode || (typeof state !== 'undefined' ? state.mode : '');
  return Boolean(
    m === 'FFA' ||
    m === 'Tactical FFA' ||
    m === 'FFA 4-Player' ||
    (typeof GAME_MODES !== 'undefined' && (m === GAME_MODES.FFA || m === GAME_MODES.TACTICAL_FFA))
  );
}

/**
 * Helper to check if the current or target game mode is a multi-team grand battle.
 */
export function isGrandBattleMode(mode) {
  const m = mode || (typeof state !== 'undefined' ? state.mode : '');
  return Boolean(
    m === '3v3v3v3' ||
    m === '2v2v2v2' ||
    m === '4v4' ||
    m === 'Battle Royale 8' ||
    m === '8-Fighter Battle Royale' ||
    m === '3v3v3v3 Teamfight' ||
    m === '4v4 Grand War' ||
    m === '2v2v2v2 Quad Battle' ||
    m === '2v2v2v2 Quad' ||
    m === 'Grand Colosseum' ||
    m === 'Classic Minimalist Arena'
  );
}

/**
 * Resolves the appropriate arena geometry for a given mode and orientation.
 */
export function getArenaConfigForMode(mode, orientation) {
  if (isSurvivorMode(mode)) {
    return getDefaultArena('survivor');
  }

  const isH = (orientation === VIEWPORT_MODES.HORIZONTAL || (typeof state !== 'undefined' && state.viewOrientation === VIEWPORT_MODES.HORIZONTAL));
  if (isH) {
    if (isGrandBattleMode(mode)) {
      return getDefaultArena('grand');
    }
    if (isFfaMode(mode)) {
      return getDefaultArena('ffa');
    }
    return getDefaultArena('horizontal');
  }
  return getDefaultArena('vertical');
}

/**
 * Gets current active viewport mode ('vertical' | 'horizontal').
 */
export function getViewportOrientation() {
  if (typeof state !== 'undefined' && state.viewOrientation) {
    return state.viewOrientation;
  }
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('ramball_viewport_orientation');
    if (saved === VIEWPORT_MODES.HORIZONTAL || saved === VIEWPORT_MODES.VERTICAL) {
      return saved;
    }
  }
  return VIEWPORT_MODES.VERTICAL;
}

/**
 * Sets active viewport mode and resizes all canvases, rendering layers, and UI containers.
 */
export function setViewportOrientation(mode) {
  const targetMode = (mode === VIEWPORT_MODES.HORIZONTAL) ? VIEWPORT_MODES.HORIZONTAL : VIEWPORT_MODES.VERTICAL;
  const cfg = VIEWPORT_CONFIGS[targetMode];

  state.viewOrientation = targetMode;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('ramball_viewport_orientation', targetMode);
  }

  // Determine arena geometry based on mode & orientation
  const activeArena = getArenaConfigForMode(state.mode, targetMode);

  // Update logical config dimensions
  CONFIG.canvasWidth = cfg.width;
  CONFIG.canvasHeight = cfg.height;
  CONFIG.arena = { ...activeArena };
  state.arena = { ...activeArena };

  // Resize main 2D and WebGL render targets
  const canvas = state.canvas || (typeof document !== 'undefined' ? document.getElementById('arena') : null);
  if (canvas) {
    canvas.width = cfg.width;
    canvas.height = cfg.height;
  }

  if (state.floatingTextCanvas) {
    state.floatingTextCanvas.width = cfg.width;
    state.floatingTextCanvas.height = cfg.height;
  }

  if (state.topLevelUiCanvas) {
    state.topLevelUiCanvas.width = cfg.width;
    state.topLevelUiCanvas.height = cfg.height;
  }

  // Resize PixiJS WebGL viewport if active
  if (state.pixiApp && state.pixiApp.renderer && typeof state.pixiApp.renderer.resize === 'function') {
    state.pixiApp.renderer.resize(cfg.width, cfg.height);
  }

  // Synchronize PixiJS canvas textures immediately to prevent WebGL texSubImage2D overflow
  syncPixiCanvasTextureSize(state.legacyCanvasSprite, canvas);
  syncPixiCanvasTextureSize(state.floatingTextSprite, state.floatingTextCanvas);
  syncPixiCanvasTextureSize(state.topLevelUiSprite, state.topLevelUiCanvas);

  // Invalidate cached arena backgrounds so they re-render at the new aspect ratio
  state._arenaBorderCanvas = null;
  state._arenaOuterDetailsCanvas = null;

  // Toggle DOM styling classes
  if (typeof document !== 'undefined') {
    const isH = (targetMode === VIEWPORT_MODES.HORIZONTAL);
    const container = document.querySelector('.game-container');
    const box = document.querySelector('.game-box');

    const topCanvas = state.topLevelUiCanvas || (typeof document !== 'undefined' ? document.getElementById('topLevelUiCanvas') : null);
    const floatCanvas = state.floatingTextCanvas || (typeof document !== 'undefined' ? document.getElementById('floatingTextCanvas') : null);

    if (isH) {
      if (document.documentElement?.classList) document.documentElement.classList.add('horizontal-viewport-mode');
      if (document.body?.classList) document.body.classList.add('horizontal-viewport-mode');
      if (container) {
        container.classList.add('horizontal-mode');
        container.style.width = '960px';
        container.style.height = '540px';
      }
      if (box) {
        box.classList.add('horizontal-mode');
        box.style.width = '960px';
        box.style.height = '540px';
        box.style.aspectRatio = '16 / 9';
      }
      if (canvas) {
        if (canvas.classList) canvas.classList.add('horizontal-mode');
        if (canvas.style) {
          canvas.style.width = '960px';
          canvas.style.height = '540px';
        }
      }
      if (topCanvas) {
        if (topCanvas.classList) topCanvas.classList.add('horizontal-mode');
        if (topCanvas.style) {
          topCanvas.style.width = '960px';
          topCanvas.style.height = '540px';
        }
      }
      if (floatCanvas) {
        if (floatCanvas.classList) floatCanvas.classList.add('horizontal-mode');
        if (floatCanvas.style) {
          floatCanvas.style.width = '960px';
          floatCanvas.style.height = '540px';
        }
      }
    } else {
      if (document.documentElement?.classList) document.documentElement.classList.remove('horizontal-viewport-mode');
      if (document.body?.classList) document.body.classList.remove('horizontal-viewport-mode');
      if (container) {
        container.classList.remove('horizontal-mode');
        if (container.style) {
          container.style.width = '540px';
          container.style.height = '960px';
        }
      }
      if (box) {
        box.classList.remove('horizontal-mode');
        if (box.style) {
          box.style.width = '540px';
          box.style.height = '960px';
          box.style.aspectRatio = '540 / 960';
        }
      }
      if (canvas) {
        if (canvas.classList) canvas.classList.remove('horizontal-mode');
        if (canvas.style) {
          canvas.style.width = '540px';
          canvas.style.height = '960px';
        }
      }
      if (topCanvas) {
        if (topCanvas.classList) topCanvas.classList.remove('horizontal-mode');
        if (topCanvas.style) {
          topCanvas.style.width = '540px';
          topCanvas.style.height = '960px';
        }
      }
      if (floatCanvas) {
        if (floatCanvas.classList) floatCanvas.classList.remove('horizontal-mode');
        if (floatCanvas.style) {
          floatCanvas.style.width = '540px';
          floatCanvas.style.height = '960px';
        }
      }
    }

    // Always enable and trigger aspect scaling so the window auto-adjusts immediately
    if (state) {
      state.aspectScalingMode = 'fit';
    }
    if (typeof window !== 'undefined' && typeof window.updateAspectScaling === 'function') {
      window.updateAspectScaling();
    }
  }

  // Recenter and normalize camera
  resetCamera(true);

  // Clear and rebuild health HUD for new orientation
  import('../graphics/hudManager.js').then(m => m.clearHealthHud && m.clearHealthHud()).catch(() => {});

  // Notify Electron desktop main process to resize physical OS window to 16:9 / 9:16
  if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.setWindowOrientation === 'function') {
    window.electronAPI.setWindowOrientation(targetMode);
  }

  // Dispatch event for UI listeners
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('viewportOrientationChanged', { detail: { mode: targetMode, config: cfg } }));
  }

  return targetMode;
}

/**
 * Toggles between Vertical and Horizontal viewport mode.
 */
export function toggleViewportOrientation() {
  const current = getViewportOrientation();
  const next = (current === VIEWPORT_MODES.HORIZONTAL) ? VIEWPORT_MODES.VERTICAL : VIEWPORT_MODES.HORIZONTAL;
  return setViewportOrientation(next);
}

/**
 * Safely synchronizes PixiJS Canvas texture and BaseTexture dimensions
 * to match source canvas dimensions and prevent WebGL texSubImage2D dimension overflows.
 */
export function syncPixiCanvasTextureSize(sprite, targetCanvas) {
  if (!sprite || !sprite.texture || !targetCanvas) return;
  const tex = sprite.texture;
  const base = tex.baseTexture;
  if (!base) return;

  const w = targetCanvas.width;
  const h = targetCanvas.height;
  if (base.width !== w || base.height !== h || (base.resource && (base.resource.width !== w || base.resource.height !== h))) {
    if (base.resource && typeof base.resource.resize === 'function') {
      base.resource.resize(w, h);
    }
    if (typeof base.setSize === 'function') {
      base.setSize(w, h);
    }
    if (tex.trim && typeof tex.trim === 'object') {
      tex.trim.width = w;
      tex.trim.height = h;
    }
    if (tex.orig && typeof tex.orig === 'object') {
      tex.orig.width = w;
      tex.orig.height = h;
    }
    if (tex._frame && typeof tex._frame === 'object') {
      tex._frame.width = w;
      tex._frame.height = h;
    }
    if (typeof base.update === 'function') {
      base.update();
    }
  }
}


