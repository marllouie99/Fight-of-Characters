import { CONFIG } from '../core/config.js';
import { isMobileDevice } from '../core/state.js';

const _imageCache = new Map();
let _totalPreloadCount = 0;
let _loadedPreloadCount = 0;

const FIGHTER_OVERLAY_MAP = {
  mahito: 'Assets/Overlays/mahitos-de.png',
  gojo: 'Assets/Overlays/gojo-domainexpansion.png',
  rubbick: 'Assets/Overlays/gojo-domainexpansion.png',
  yuta: 'Assets/Overlays/Yuta-domain-overlay.png',
  toji: 'Assets/Overlays/toji-ultimate-overlay.png',
  cj: 'Assets/Overlays/CJ-baguvix-overlay.png',
  nanami: 'Assets/Overlays/Nanami-overtime-overlay.png',
  todo: 'Assets/Overlays/Todo-ultimate-overlay.png',
  yuji: 'Assets/Overlays/Yuji-soulswap-overlay.png',
  mahoraga: 'Assets/Overlays/Mahoraga-wheel-overlay.png',
  escanor: 'Assets/model/escanor/escanor_ultimate_arena_overlay.png'
};

/**
 * Preload an image asset so it's fully resident in memory before combat.
 * @param {string} src
 * @returns {HTMLImageElement|undefined}
 */
export function preloadImage(src) {
  if (!src || typeof Image === 'undefined') return;
  if (_imageCache.has(src)) return _imageCache.get(src);

  _totalPreloadCount++;
  const img = new Image();
  if (typeof img.decoding === 'string') {
    img.decoding = 'async';
  }
  img.onload = () => {
    _loadedPreloadCount++;
  };
  img.onerror = () => {
    _loadedPreloadCount++;
  };
  img.src = src;
  _imageCache.set(src, img);
  return img;
}

/**
 * Returns current asset preloader progress.
 * @returns {{ total: number, loaded: number, ratio: number, isComplete: boolean }}
 */
export function getPreloadStatus() {
  const total = _totalPreloadCount;
  const loaded = _loadedPreloadCount;
  const ratio = total > 0 ? Math.min(1.0, loaded / total) : 1.0;
  return {
    total,
    loaded,
    ratio,
    isComplete: total === 0 || loaded >= total
  };
}

/**
 * Initializes the graphics cache and warms up character skin bitmaps.
 * On mobile devices, skips eager preloading of all 9 full-screen domain overlays
 * and non-hair heavy textures at boot to prevent RAM spikes and network congestion.
 */
export function initGraphicsCache() {
  if (typeof Image === 'undefined') return;
  const models = new Set();

  if (!isMobileDevice) {
    Object.values(FIGHTER_OVERLAY_MAP).forEach(p => models.add(p));
  }

  if (typeof CONFIG === 'object') {
    for (const key of Object.keys(CONFIG)) {
      const cfg = CONFIG[key];
      if (cfg && cfg.assets && typeof cfg.assets === 'object') {
        if (isMobileDevice) {
          if (typeof cfg.assets.hair === 'string') {
            models.add(cfg.assets.hair);
          }
        } else {
          for (const assetPath of Object.values(cfg.assets)) {
            if (typeof assetPath === 'string' && (assetPath.endsWith('.png') || assetPath.endsWith('.jpg') || assetPath.endsWith('.webp'))) {
              models.add(assetPath);
            }
          }
        }
      }
    }
  }

  models.forEach(preloadImage);
}

/**
 * Preloads visual assets and domain overlays specifically for the active match combatants.
 * @param {Array<Object>} fighters
 */
export function preloadActiveMatchFighterVisuals(fighters) {
  if (typeof Image === 'undefined' || !Array.isArray(fighters)) return;
  for (let i = 0; i < fighters.length; i++) {
    const f = fighters[i];
    if (!f) continue;
    const def = f._def || f;
    const charId = String(f.characterId || f.type || def.type || def.id || '').toLowerCase();
    if (!charId) continue;

    if (FIGHTER_OVERLAY_MAP[charId]) {
      preloadImage(FIGHTER_OVERLAY_MAP[charId]);
    }

    const cfg = CONFIG[charId] || CONFIG[f.type] || CONFIG[def.id];
    if (cfg && cfg.assets && typeof cfg.assets === 'object') {
      for (const assetPath of Object.values(cfg.assets)) {
        if (typeof assetPath === 'string' && (assetPath.endsWith('.png') || assetPath.endsWith('.jpg') || assetPath.endsWith('.webp'))) {
          preloadImage(assetPath);
        }
      }
    }
  }
}

/**
 * Releases unused full-screen overlay images and caps offscreen canvas cache growth
 * between matches on mobile devices to prevent browser tab out-of-memory kills.
 * @param {Array<Object>} activeFighters
 */
export function releaseInactiveMatchGraphicsMemory(activeFighters = []) {
  if (!isMobileDevice) return;

  const activeOverlays = new Set();
  for (let i = 0; i < activeFighters.length; i++) {
    const f = activeFighters[i];
    if (!f) continue;
    const def = f._def || f;
    const charId = String(f.characterId || f.type || def.type || def.id || '').toLowerCase();
    if (charId && FIGHTER_OVERLAY_MAP[charId]) {
      activeOverlays.add(FIGHTER_OVERLAY_MAP[charId]);
    }
  }

  const allOverlayPaths = new Set(Object.values(FIGHTER_OVERLAY_MAP));
  for (const [src, img] of _imageCache.entries()) {
    if (allOverlayPaths.has(src) && !activeOverlays.has(src)) {
      try {
        if (img) img.src = '';
      } catch (e) {}
      _imageCache.delete(src);
    }
  }

  if (_canvasCache.size > 96) {
    for (const [key, canvas] of _canvasCache.entries()) {
      if (key.startsWith('grad_')) continue;
      try {
        if (canvas && typeof canvas.width === 'number') {
          canvas.width = 0;
          canvas.height = 0;
        }
      } catch (e) {}
      _canvasCache.delete(key);
      if (_canvasCache.size <= 64) break;
    }
  }
}

const _canvasCache = new Map();

/**
 * Retrieves or renders an offscreen canvas by key.
 * @param {string} key - Unique cache identifier
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Function} renderFn - Callback `(ctx, canvas) => void` to paint into the canvas if cache miss
 * @returns {HTMLCanvasElement|Object}
 */
export function getCachedCanvas(key, width, height, renderFn) {
  if (_canvasCache.has(key)) {
    return _canvasCache.get(key);
  }
  let canvas;
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    canvas = document.createElement('canvas');
  } else if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(width, height);
  } else {
    canvas = { width, height, getContext: () => null };
  }
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;
  if (ctx && typeof renderFn === 'function') {
    renderFn(ctx, canvas);
  }
  _canvasCache.set(key, canvas);
  return canvas;
}

/**
 * Clears the graphics cache.
 * Call this when resetting the game or changing modes.
 */
export function clearCache() {
  _imageCache.clear();
  _canvasCache.clear();
}

/**
 * Pre-bakes a circular radial gradient into an offscreen canvas so it can be blitted
 * via `ctx.drawImage(canvas, x - r, y - r, r * 2, r * 2)` with zero per-frame shader creation.
 * @param {string} key - Unique cache identifier
 * @param {number} size - Square canvas width/height in pixels (e.g. 128)
 * @param {Array<[number, string]>} stops - Array of `[offset, color]` gradient stops
 * @returns {HTMLCanvasElement|Object}
 */
export function getCachedRadialGradientCanvas(key, size, stops) {
  return getCachedCanvas(`grad_${key}`, size, size, (ctx) => {
    const half = size / 2;
    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    if (Array.isArray(stops)) {
      for (let i = 0; i < stops.length; i++) {
        grad.addColorStop(stops[i][0], stops[i][1]);
      }
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(half, half, half, 0, Math.PI * 2);
    ctx.fill();
  });
}
