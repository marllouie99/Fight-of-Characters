import { CONFIG } from '../core/config.js';
import { isMobileDevice } from '../core/state.js';

const _imageCache = new Map();
let _totalPreloadCount = 0;
let _loadedPreloadCount = 0;
let _gpuWarmupCanvas = null;
let _gpuWarmupCtx = null;

/**
 * Forces immediate asynchronous bitmap decode and GPU texture upload for a loaded HTMLImageElement
 * by blitting a 1x1 texel into a persistent offscreen canvas (Rule 35 SceneLoadingCurtain pattern).
 * Eliminates 100-300ms first-cast lag spikes when domain overlays or ultimate sprite sheets first appear.
 * @param {HTMLImageElement} img
 */
export function warmImageOnGpu(img) {
  if (!img || typeof document === 'undefined') return;
  const upload = () => {
    try {
      if (!_gpuWarmupCanvas) {
        _gpuWarmupCanvas = document.createElement('canvas');
        _gpuWarmupCanvas.width = 16;
        _gpuWarmupCanvas.height = 16;
        _gpuWarmupCtx = _gpuWarmupCanvas.getContext('2d');
      }
      if (_gpuWarmupCtx && img.complete && img.naturalWidth > 0) {
        _gpuWarmupCtx.clearRect(0, 0, 2, 2);
        _gpuWarmupCtx.drawImage(img, 0, 0, 1, 1, 0, 0, 1, 1);
      }
    } catch (e) {}
  };
  if (typeof img.decode === 'function') {
    img.decode().then(upload).catch(upload);
  } else {
    upload();
  }
}

const FIGHTER_OVERLAY_MAP = {
  mahito: 'Assets/Overlays/mahitos-de.png',
  gojo: 'Assets/model/gojo/gojo_domain_arena_overlay.png',
  rubbick: 'Assets/model/gojo/gojo_domain_arena_overlay.png',
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
 * @param {boolean} [warmGpu=false] - Whether to decode and upload a 1x1 GPU texel immediately upon load
 * @returns {HTMLImageElement|undefined}
 */
export function preloadImage(src, warmGpu = false) {
  if (!src || typeof Image === 'undefined') return;
  if (_imageCache.has(src)) {
    const cached = _imageCache.get(src);
    if (warmGpu && cached && cached.complete && cached.naturalWidth > 0) {
      warmImageOnGpu(cached);
    }
    return cached;
  }

  _totalPreloadCount++;
  const img = new Image();
  if (typeof img.decoding === 'string') {
    img.decoding = 'async';
  }
  img.onload = () => {
    _loadedPreloadCount++;
    if (warmGpu) {
      warmImageOnGpu(img);
    }
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
 * Preloads visual assets and domain overlays specifically for the active match combatants,
 * and decodes/uploads them to the GPU before Round 1 starts (Rule 35 SceneLoadingCurtain pattern).
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
      preloadImage(FIGHTER_OVERLAY_MAP[charId], true);
    }

    const cfg = CONFIG[charId] || CONFIG[f.type] || CONFIG[def.id];
    if (cfg && cfg.assets && typeof cfg.assets === 'object') {
      for (const assetPath of Object.values(cfg.assets)) {
        if (typeof assetPath === 'string' && (assetPath.endsWith('.png') || assetPath.endsWith('.jpg') || assetPath.endsWith('.webp'))) {
          preloadImage(assetPath, true);
        }
      }
    }
  }
}

/**
 * Uploads 1x1 texels of all loaded active-combatant images directly onto the target 2D canvas context
 * so the browser's GPU texture cache has every active fighter asset bound before combat begins.
 * @param {Array<Object>} fighters
 * @param {CanvasRenderingContext2D} [targetCtx]
 */
export function warmActiveFighterTexturesOnGpu(fighters, targetCtx = null) {
  if (!Array.isArray(fighters) || _imageCache.size === 0) return;
  for (let i = 0; i < fighters.length; i++) {
    const f = fighters[i];
    if (!f) continue;
    const def = f._def || f;
    const charId = String(f.characterId || f.type || def.type || def.id || '').toLowerCase();
    if (!charId) continue;

    const paths = [];
    if (FIGHTER_OVERLAY_MAP[charId]) paths.push(FIGHTER_OVERLAY_MAP[charId]);
    const cfg = CONFIG[charId] || CONFIG[f.type] || CONFIG[def.id];
    if (cfg && cfg.assets && typeof cfg.assets === 'object') {
      for (const p of Object.values(cfg.assets)) {
        if (typeof p === 'string') paths.push(p);
      }
    }

    for (let j = 0; j < paths.length; j++) {
      const img = _imageCache.get(paths[j]);
      if (img && img.complete && img.naturalWidth > 0) {
        warmImageOnGpu(img);
        if (targetCtx && typeof targetCtx.drawImage === 'function') {
          try {
            targetCtx.save();
            targetCtx.globalAlpha = 0.001;
            targetCtx.drawImage(img, 0, 0, 1, 1, -10, -10, 1, 1);
            targetCtx.restore();
          } catch (e) {
            try { targetCtx.restore(); } catch (_) {}
          }
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

  // Evict character select preview canvases from GPU VRAM during match combat (Rule 35 SceneLoadingCurtain pattern)
  try {
    if (typeof window !== 'undefined' && typeof window.__clearFighterPreviewCache === 'function') {
      window.__clearFighterPreviewCache();
    }
  } catch (e) {}

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

const _filteredSpriteCache = new WeakMap();

/**
 * Pre-bakes a CSS/Canvas filter (e.g. 'hue-rotate(185deg) saturate(1.2)') onto an offscreen canvas
 * once per (Image, filterStr) pair so the 60 FPS game loop never sets `ctx.filter` on `state.ctx`
 * (preventing mobile/desktop Skia FBO pipeline flushes and multi-pass convolution stalls).
 * @param {HTMLImageElement|HTMLCanvasElement} img
 * @param {string} filterStr
 * @returns {HTMLCanvasElement|HTMLImageElement}
 */
export function getFilteredSpriteCanvas(img, filterStr) {
  if (!img || !filterStr || filterStr === 'none') return img;
  const w = img.naturalWidth || img.width || 0;
  const h = img.naturalHeight || img.height || 0;
  if (w <= 0 || h <= 0 || typeof document === 'undefined') return img;

  let byFilter = _filteredSpriteCache.get(img);
  if (!byFilter) {
    byFilter = new Map();
    _filteredSpriteCache.set(img, byFilter);
  }
  let cached = byFilter.get(filterStr);
  if (cached && cached.width === w && cached.height === h) {
    return cached;
  }

  try {
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const octx = off.getContext('2d');
    if (octx) {
      octx.save();
      octx.imageSmoothingEnabled = false;
      octx.filter = filterStr;
      octx.drawImage(img, 0, 0, w, h);
      octx.restore();
      byFilter.set(filterStr, off);
      return off;
    }
  } catch (e) {}
  return img;
}

const _glowingGhostQuadCache = new WeakMap();

/**
 * Pre-bakes a scaled sprite quad surrounded by an offscreen golden aura halo (zero ctx.shadowBlur)
 * so high-frequency afterimage trails blit a compact cached quad instead of downscaling 1024px+ PNGs per frame.
 * @param {HTMLImageElement|HTMLCanvasElement} img
 * @param {number} targetW
 * @param {number} targetH
 * @param {string} [glowColor='#FFE84D']
 * @returns {{ canvas: HTMLCanvasElement, padX: number, padY: number }|null}
 */
export function getPrebakedGlowingGhostQuad(img, targetW, targetH, glowColor = '#FFE84D') {
  if (!img || typeof document === 'undefined') return null;
  const srcW = img.naturalWidth || img.width || 0;
  const srcH = img.naturalHeight || img.height || 0;
  const scaledW = Math.max(1, Math.round(targetW));
  const scaledH = Math.max(1, Math.round(targetH));
  if (srcW <= 0 || srcH <= 0) return null;

  const pad = Math.max(4, Math.min(12, Math.round(Math.min(scaledW, scaledH) * 0.08)));
  const cacheKey = `${scaledW}x${scaledH}:${pad}:${glowColor}`;

  let byKey = _glowingGhostQuadCache.get(img);
  if (!byKey) {
    byKey = new Map();
    _glowingGhostQuadCache.set(img, byKey);
  }
  const existing = byKey.get(cacheKey);
  if (existing) {
    return existing;
  }
  if (byKey.size >= 8) {
    byKey.clear();
  }

  try {
    const silhouette = document.createElement('canvas');
    silhouette.width = scaledW;
    silhouette.height = scaledH;
    const sctx = silhouette.getContext('2d');
    if (!sctx) return null;
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(img, 0, 0, scaledW, scaledH);
    sctx.globalCompositeOperation = 'source-in';
    sctx.fillStyle = glowColor;
    sctx.fillRect(0, 0, scaledW, scaledH);

    const quad = document.createElement('canvas');
    quad.width = scaledW + pad * 2;
    quad.height = scaledH + pad * 2;
    const qctx = quad.getContext('2d');
    if (!qctx) return null;

    qctx.imageSmoothingEnabled = false;
    const outerOffset = Math.max(2, pad * 0.6);
    qctx.globalAlpha = 0.16;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      qctx.drawImage(silhouette, pad + Math.cos(a) * outerOffset, pad + Math.sin(a) * outerOffset);
    }

    const innerOffset = Math.max(1, pad * 0.28);
    qctx.globalAlpha = 0.36;
    qctx.drawImage(silhouette, pad + innerOffset, pad);
    qctx.drawImage(silhouette, pad - innerOffset, pad);
    qctx.drawImage(silhouette, pad, pad + innerOffset);
    qctx.drawImage(silhouette, pad, pad - innerOffset);

    qctx.globalAlpha = 1.0;
    qctx.drawImage(img, pad, pad, scaledW, scaledH);

    const entry = {
      canvas: quad,
      padX: pad * (targetW / scaledW),
      padY: pad * (targetH / scaledH)
    };
    byKey.set(cacheKey, entry);
    return entry;
  } catch (e) {
    return null;
  }
}

/**
 * Draws a pre-baked image or offscreen canvas with optional local rotation/flipping and nearest-neighbor crispness.
 */
export function drawTransformedSpriteQuad(ctx, sprite, drawX, drawY, width, height, rot = 0, flipX = 1, flipY = 1) {
  if (!sprite) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (rot !== 0 || flipX !== 1 || flipY !== 1) {
    ctx.translate(drawX + width / 2, drawY + height / 2);
    if (rot !== 0) ctx.rotate(rot);
    if (flipX !== 1 || flipY !== 1) ctx.scale(flipX, flipY);
    ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
  } else {
    ctx.drawImage(sprite, drawX, drawY, width, height);
  }
  ctx.restore();
}

/**
 * Draws a pre-baked glowing offscreen ghost quad when DOM Canvas is available,
 * falling back cleanly to direct transformed drawing in headless environments.
 */
export function drawGlowingGhostSprite(ctx, srcImg, drawX, drawY, width, height, rot = 0, flipX = 1, flipY = 1, glowColor = '#FFE84D') {
  if (!srcImg) return;
  const bakedQuad = getPrebakedGlowingGhostQuad(srcImg, width, height, glowColor);
  if (bakedQuad) {
    drawTransformedSpriteQuad(
      ctx,
      bakedQuad.canvas,
      drawX - bakedQuad.padX,
      drawY - bakedQuad.padY,
      width + bakedQuad.padX * 2,
      height + bakedQuad.padY * 2,
      rot,
      flipX,
      flipY
    );
    return;
  }
  drawTransformedSpriteQuad(ctx, srcImg, drawX, drawY, width, height, rot, flipX, flipY);
}

