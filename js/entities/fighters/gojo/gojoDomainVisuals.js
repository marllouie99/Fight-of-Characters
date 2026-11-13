// ─────────────────────────────────────────────
// SATORU GOJO & RUBBICK DOMAIN EXPANSION (UNLIMITED VOID / MURYŌKŪSHO)
// High-Resolution Domain Overlay Image Renderer (Assets/model/gojo/gojo_domain_arena_overlay.png)
// Supports Gojo (Cosmic Cyan/Blue) & Rubbick (Stolen Arcane Emerald Green)
// ─────────────────────────────────────────────
import { state } from '../../../core/state.js';
import { drawCachedDomainHalo, RUBBICK_EMERALD_NEBULA_STOPS } from '../../../graphics/glowSpriteCache.js';

let _gojoDomainImg = null;
let _gojoDomainImgLoading = false;
let _gojoDomainSplashesImg = null;
let _gojoDomainSplashesImgLoading = false;
let _rubbickDomainCanvas = null;
let _rubbickDomainCanvasReady = false;
let _rubbickDomainSplashesCanvas = null;
let _rubbickDomainSplashesCanvasReady = false;

const _GOJO_DOMAIN_SPLASHES_SRC = 'Assets/model/gojo/gojo_domain_splashes_overlay.png';

/**
 * Lazy-loads an image element once with optional readiness tracking flags.
 * @param {string} src
 * @param {() => HTMLImageElement|null} getRef
 * @param {(img: HTMLImageElement|null) => void} setRef
 * @param {() => boolean} isLoading
 * @param {(flag: boolean) => void} setLoading
 * @returns {HTMLImageElement|null}
 */
function _loadCachedImage(src, getRef, setRef, isLoading, setLoading) {
  const existing = getRef();
  if (existing && existing.complete && existing.naturalWidth > 0) {
    return existing;
  }
  if (!isLoading() && typeof Image !== 'undefined') {
    setLoading(true);
    const img = new Image();
    img.onload = () => {
      setRef(img);
      setLoading(false);
    };
    img.onerror = (e) => {
      console.warn(`Failed to load Gojo domain image at ${src}`, e);
      setLoading(false);
    };
    img.src = src;
    setRef(img);
  }
  return getRef();
}

/**
 * Preload and retrieve Gojo's pixel art domain expansion overlay image
 */
function _getGojoDomainImage() {
  return _loadCachedImage(
    'Assets/model/gojo/gojo_domain_arena_overlay.png',
    () => _gojoDomainImg,
    (img) => { _gojoDomainImg = img; },
    () => _gojoDomainImgLoading,
    (flag) => { _gojoDomainImgLoading = flag; }
  );
}

/**
 * Preload and retrieve Gojo's 16-bit cosmic splashes overlay sprite
 */
function _getGojoDomainSplashesImage() {
  return _loadCachedImage(
    _GOJO_DOMAIN_SPLASHES_SRC,
    () => _gojoDomainSplashesImg,
    (img) => { _gojoDomainSplashesImg = img; },
    () => _gojoDomainSplashesImgLoading,
    (flag) => { _gojoDomainSplashesImgLoading = flag; }
  );
}

/**
 * Remaps cosmic blue/cyan Unlimited Void artwork pixels into Rubbick's Arcane Emerald palette
 * on a one-time offscreen canvas (Rule 35).
 * @param {HTMLImageElement} img
 * @returns {HTMLCanvasElement|null}
 */
function _remapCosmicCanvasToEmerald(img) {
  if (typeof document === 'undefined' || !img || !img.naturalWidth || !img.naturalHeight) return null;

  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a === 0) continue;

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;

      if (lum < 6) {
        data[i] = 1;
        data[i + 1] = Math.min(10, Math.round(lum * 0.8));
        data[i + 2] = 2;
      } else if (lum > 220 && sat < 0.22) {
        data[i] = Math.round(r * 0.82 + 200 * 0.18);
        data[i + 1] = 255;
        data[i + 2] = Math.round(b * 0.82 + 220 * 0.18);
      } else {
        const t = Math.min(1.0, Math.max(0, lum / 255));
        let newR, newG, newB;
        if (t < 0.45) {
          const factor = t / 0.45;
          newR = 0;
          newG = Math.round(30 * (1 - factor) + 220 * factor);
          newB = Math.round(12 * (1 - factor) + 75 * factor);
        } else if (t < 0.82) {
          const factor = (t - 0.45) / 0.37;
          newR = Math.round(20 * factor);
          newG = Math.round(220 * (1 - factor) + 255 * factor);
          newB = Math.round(75 * (1 - factor) + 110 * factor);
        } else {
          const factor = (t - 0.82) / 0.18;
          newR = Math.round(20 * (1 - factor) + 224 * factor);
          newG = 255;
          newB = Math.round(110 * (1 - factor) + 240 * factor);
        }
        data[i] = newR;
        data[i + 1] = newG;
        data[i + 2] = newB;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  } catch (err) {
    try {
      const w = img.naturalWidth || 540;
      const h = img.naturalHeight || 960;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const fallbackCtx = canvas.getContext('2d');
      if (fallbackCtx) {
        fallbackCtx.filter = 'hue-rotate(190deg) saturate(1.8) brightness(0.95)';
        fallbackCtx.drawImage(img, 0, 0, w, h);
        return canvas;
      }
    } catch (_) {}
    return null;
  }
}

/**
 * Retrieve the green-tinted Unlimited Void domain image/canvas for Rubbick
 */
function _getRubbickDomainImage() {
  if (_rubbickDomainCanvasReady && _rubbickDomainCanvas) {
    return _rubbickDomainCanvas;
  }
  const baseImg = _getGojoDomainImage();
  if (baseImg && baseImg.complete && baseImg.naturalWidth > 0) {
    const built = _remapCosmicCanvasToEmerald(baseImg);
    if (built) {
      _rubbickDomainCanvas = built;
      _rubbickDomainCanvasReady = true;
      return _rubbickDomainCanvas;
    }
    return baseImg;
  }
  return null;
}

/**
 * Retrieve the green-tinted 16-bit splash overlay canvas for Rubbick's stolen domain
 */
function _getRubbickDomainSplashesImage() {
  if (_rubbickDomainSplashesCanvasReady && _rubbickDomainSplashesCanvas) {
    return _rubbickDomainSplashesCanvas;
  }
  const baseImg = _getGojoDomainSplashesImage();
  if (baseImg && baseImg.complete && baseImg.naturalWidth > 0) {
    const built = _remapCosmicCanvasToEmerald(baseImg);
    if (built) {
      _rubbickDomainSplashesCanvas = built;
      _rubbickDomainSplashesCanvasReady = true;
      return _rubbickDomainSplashesCanvas;
    }
    return baseImg;
  }
  return null;
}

/**
 * Renders a loaded domain layer image onto the arena rect, with optional Rubbick emerald fallback tint.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement|HTMLCanvasElement|null} img
 * @param {HTMLImageElement|null} baseImg
 * @param {boolean} isRubbick
 * @param {boolean} pixelCrisp
 * @param {number} ax
 * @param {number} ay
 * @param {number} aw
 * @param {number} ah
 */
function _drawDomainLayerImage(ctx, img, baseImg, isRubbick, pixelCrisp, ax, ay, aw, ah) {
  if (!img || !(img.complete || img.naturalWidth > 0 || img.width > 0)) return false;

  ctx.save();
  if (pixelCrisp) {
    ctx.imageSmoothingEnabled = false;
  } else {
    ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
  }

  if (isRubbick && img === baseImg) {
    ctx.save();
    try {
      ctx.filter = 'hue-rotate(190deg) saturate(1.8) brightness(0.95)';
    } catch (_) {}
    ctx.drawImage(img, ax, ay, aw, ah);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(0, 255, 100, 0.20)';
    ctx.globalCompositeOperation = 'color';
    ctx.fillRect(ax, ay, aw, ah);
    ctx.restore();
  } else {
    ctx.drawImage(img, ax, ay, aw, ah);
  }

  ctx.restore();
  return true;
}

// Preload immediately if running in desktop browser (deferred on mobile until Gojo/Rubbick enters match)
if (typeof window !== 'undefined' && typeof Image !== 'undefined' && !(typeof state !== 'undefined' && state.isMobileDevice)) {
  _getGojoDomainImage();
  _getGojoDomainSplashesImage();
}

/**
 * Main Visual Renderer for Gojo & Rubbick Domain Expansion (Unlimited Void / Muryōkūsho).
 * Renders the pixel art domain overlay occupying the whole arena, clipped inside the arena bounds.
 * Supports standard Gojo cyan and Rubbick emerald green.
 * @param {object} fighter - The Gojo or Rubbick fighter instance
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
 * @param {boolean} isClashSecondary - Whether this domain is secondary in a domain clash
 * @param {object} [options={}] - Custom options (e.g. { isRubbick: true, colorTheme: 'green' })
 */
export function renderGojoDomainBackground(fighter, ctx, isClashSecondary = false, options = {}) {
  const isRubbick = Boolean(
    options.isRubbick ||
    options.colorTheme === 'green' ||
    (fighter && (
      fighter.characterId === 'rubbick' || fighter.type === 'rubbick' ||
      fighter.characterId === 'trickster' || fighter.type === 'trickster' ||
      fighter._def?.id === 'rubbick' || fighter._def?.id === 'trickster' ||
      fighter.stolenDomainActive || fighter.stolenType === 'gojo_domain'
    ))
  );

  const isActive = fighter && (fighter.domainActive || fighter.stolenDomainActive || (fighter.stolenType === 'gojo_domain' && fighter.stolenWindUpTimer > 0));
  if (!isActive) return;

  const arena = state.arena;
  if (!arena) return;

  const isLocal = Boolean(options.isLocal || (ctx.canvas && Math.abs(ctx.canvas.width - arena.width) < 2));
  const ax = isLocal ? 0 : arena.x;
  const ay = isLocal ? 0 : arena.y;
  const aw = isLocal ? ctx.canvas.width : arena.width;
  const ah = isLocal ? ctx.canvas.height : arena.height;

  ctx.save();

  // 1. Clip strictly inside the arena bounds
  const ww = isLocal ? 0 : ((arena.wallWidth !== undefined) ? arena.wallWidth : 4);
  ctx.beginPath();
  if (arena.shape === 'circle') {
    const acx = ax + aw / 2;
    const acy = ay + ah / 2;
    const ar = arena.radius !== undefined ? arena.radius : (aw / 2);
    ctx.arc(acx, acy, Math.max(0, ar - ww), 0, Math.PI * 2);
  } else {
    ctx.rect(ax + ww, ay + ww, aw - ww * 2, ah - ww * 2);
  }
  ctx.clip();

  if (isClashSecondary) {
    ctx.globalAlpha = 0.75;
  }

  // 2. Base Dark Cosmic Background
  ctx.fillStyle = isRubbick ? '#011106' : '#01030a';
  ctx.fillRect(ax, ay, aw, ah);

  // 3. Draw 16-Bit Domain Overlay Image occupying the whole arena with crisp nearest-neighbor pixels
  const img = isRubbick ? _getRubbickDomainImage() : _getGojoDomainImage();
  const baseImg = _getGojoDomainImage();
  const drewBase = _drawDomainLayerImage(ctx, img, baseImg, isRubbick, true, ax, ay, aw, ah);
  if (!drewBase && isRubbick) {
    // Procedural Emerald Cosmic Nebula fallback while asset initializes (Pre-baked atlas quad)
    const cx = ax + aw / 2;
    const cy = ay + ah / 2;
    const maxR = Math.max(aw, ah) * 0.6;
    drawCachedDomainHalo(ctx, cx, cy, maxR, RUBBICK_EMERALD_NEBULA_STOPS);
  }

  // 4. Composite 16-Bit Cosmic Ink Splashes Overlay with nearest-neighbor pixel fidelity
  const splashImg = isRubbick ? _getRubbickDomainSplashesImage() : _getGojoDomainSplashesImage();
  const baseSplashImg = _getGojoDomainSplashesImage();
  _drawDomainLayerImage(ctx, splashImg, baseSplashImg, isRubbick, true, ax, ay, aw, ah);

  // 5. Subtle Arena Wall Edge Feather Vignette (Keeps corner 16-bit splashes vibrant while preserving fighter readability)
  const vcx = ax + aw / 2;
  const vcy = ay + ah / 2;
  const maxDim = Math.max(aw, ah);
  const edgeGrad = ctx.createRadialGradient(vcx, vcy, maxDim * 0.36, vcx, vcy, maxDim * 0.72);
  if (edgeGrad) {
    if (isRubbick) {
      edgeGrad.addColorStop(0.0, 'rgba(0, 20, 8, 0.08)');
      edgeGrad.addColorStop(0.70, 'rgba(0, 14, 5, 0.22)');
      edgeGrad.addColorStop(1.0, 'rgba(0, 8, 3, 0.38)');
    } else {
      edgeGrad.addColorStop(0.0, 'rgba(0, 2, 10, 0.08)');
      edgeGrad.addColorStop(0.70, 'rgba(0, 2, 8, 0.20)');
      edgeGrad.addColorStop(1.0, 'rgba(0, 1, 5, 0.36)');
    }
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(ax, ay, aw, ah);
  }

  ctx.restore();
}

/**
 * Dedicated visual renderer for Rubbick's stolen Unlimited Void domain (Arcane Emerald Green)
 */
export function renderRubbickDomainBackground(fighter, ctx, isClashSecondary = false, options = {}) {
  return renderGojoDomainBackground(fighter, ctx, isClashSecondary, { ...options, isRubbick: true, colorTheme: 'green' });
}

