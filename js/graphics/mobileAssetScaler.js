// ─────────────────────────────────────────────
// MOBILE ASSET SCALER (@0.5x Sprite Sheet Pipeline)
// Transparent runtime adapter that redirects large image loading to downscaled
// @0.5x PNG variants on mobile devices, cutting decoded bitmap RAM by 75%.
// ─────────────────────────────────────────────

import { MOBILE_ASSET_MANIFEST } from '../configs/mobileAssetManifest.js';

function normalizeAssetPath(url) {
  if (!url || typeof url !== 'string') return '';
  let clean = url.split('?')[0].split('#')[0];
  try {
    clean = decodeURI(clean);
  } catch (e) {}
  clean = clean.replace(/\\/g, '/');
  const idx = clean.indexOf('Assets/');
  if (idx !== -1) {
    return clean.slice(idx);
  }
  return clean;
}

let _isInitialized = false;
let _previewRefreshTimer = null;

function scheduleMobilePreviewRefresh() {
  if (_previewRefreshTimer !== null) return;
  _previewRefreshTimer = setTimeout(() => {
    _previewRefreshTimer = null;
    if (typeof window !== 'undefined') {
      if (typeof window.__clearFighterPreviewCache === 'function') {
        window.__clearFighterPreviewCache();
      }
      if (typeof window.__clearCollectorCardCache === 'function') {
        window.__clearCollectorCardCache();
      }
    }
  }, 60);
}

/**
 * Initializes the transparent mobile asset scaler on mobile / touch devices.
 * If running on desktop, this is a strict no-op with zero runtime overhead.
 * @param {boolean} isMobileDevice
 */
export function initMobileAssetScaler(isMobileDevice = false) {
  if (!isMobileDevice || _isInitialized) return;
  if (typeof window === 'undefined' || typeof HTMLImageElement === 'undefined') return;

  _isInitialized = true;

  const srcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src') ||
    Object.getOwnPropertyDescriptor(Element.prototype, 'src');
  const completeDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'complete');
  const onloadDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'onload') ||
    Object.getOwnPropertyDescriptor(GlobalEventHandlers?.prototype || {}, 'onload');
  const natWidthDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalWidth');
  const natHeightDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalHeight');
  const widthDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'width');
  const heightDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'height');

  function triggerDeferredImageLoad(img) {
    if (!img || !img._deferredMobileSrc || !srcDescriptor || !srcDescriptor.set) return;
    const targetUrl = img._deferredMobileSrc;
    img._deferredMobileSrc = null;

    if (img._isMobile05x && img._originalSrc1x && !img._fallbackListenerAttached) {
      img._fallbackListenerAttached = true;
      const onError = () => {
        img.removeEventListener('error', onError);
        img._isMobile05x = false;
        img._mobileScale = 1.0;
        img._fallbackTo1x = true;
        img._mip0 = null;
        img._mip1 = null;
        srcDescriptor.set.call(img, img._originalSrc1x);
      };
      img.addEventListener('error', onError, { once: true });
    }

    img.addEventListener('load', () => {
      img._mip0 = null;
      img._mip1 = null;
      scheduleMobilePreviewRefresh();
    }, { once: true });

    srcDescriptor.set.call(img, targetUrl);
  }

  // 1. Intercept HTMLImageElement.prototype.src with lazy on-demand loading for fighter/effect assets
  if (srcDescriptor && srcDescriptor.set && srcDescriptor.get) {
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      set(value) {
        this._mip0 = null;
        this._mip1 = null;
        this._pendingLogicalSrc = value;

        if (!value || typeof value !== 'string') {
          this._deferredMobileSrc = null;
          srcDescriptor.set.call(this, value);
          return;
        }

        const normalized = normalizeAssetPath(value);
        const dims = MOBILE_ASSET_MANIFEST ? MOBILE_ASSET_MANIFEST[normalized] : null;
        let targetUrl = value;

        if (dims && !this._fallbackTo1x) {
          const mobileSubpath = normalized.replace(/^Assets\//, 'Assets/_mobile05x/');
          const queryIdx = value.indexOf('?');
          targetUrl = mobileSubpath + (queryIdx !== -1 ? value.slice(queryIdx) : '');

          this._isMobile05x = true;
          this._mobileScale = 0.5;
          this._logicalWidth = dims[0];
          this._logicalHeight = dims[1];
          this._originalSrc1x = value;
        } else {
          this._isMobile05x = false;
          this._mobileScale = 1.0;
        }

        // Defer eager module-boot fighter/weapon/effect image loads until first access or explicit onload listener
        const isDeferrableAsset = normalized.startsWith('Assets/model/') ||
          normalized.startsWith('Assets/character/') ||
          normalized.startsWith('Assets/effects/');
        const hasOnloadHandler = Boolean(this.onload || this._hasLoadListener);

        if (isDeferrableAsset && !hasOnloadHandler) {
          this._deferredMobileSrc = targetUrl;
          return;
        }

        this._deferredMobileSrc = targetUrl;
        triggerDeferredImageLoad(this);
      },
      get() {
        if (this._deferredMobileSrc && this._pendingLogicalSrc) {
          return this._pendingLogicalSrc;
        }
        return srcDescriptor.get.call(this);
      },
      configurable: true
    });
  }

  // Ensure attaching onload or 'load' listener immediately triggers any deferred image fetch
  if (onloadDesc && onloadDesc.set && onloadDesc.get) {
    Object.defineProperty(HTMLImageElement.prototype, 'onload', {
      set(fn) {
        onloadDesc.set.call(this, fn);
        if (fn && this._deferredMobileSrc) {
          triggerDeferredImageLoad(this);
        }
      },
      get() {
        return onloadDesc.get.call(this);
      },
      configurable: true
    });
  }

  const origAddEventListener = HTMLImageElement.prototype.addEventListener;
  if (typeof origAddEventListener === 'function') {
    HTMLImageElement.prototype.addEventListener = function(type, listener, options) {
      if (type === 'load') {
        this._hasLoadListener = true;
        if (this._deferredMobileSrc) {
          triggerDeferredImageLoad(this);
        }
      }
      return origAddEventListener.call(this, type, listener, options);
    };
  }

  if (completeDesc && completeDesc.get) {
    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
      get() {
        if (this._deferredMobileSrc) {
          triggerDeferredImageLoad(this);
          return false;
        }
        return completeDesc.get.call(this);
      },
      configurable: true
    });
  }

  // 2. Intercept naturalWidth, naturalHeight, width, and height to preserve 1x layout/aspect math
  if (natWidthDesc && natWidthDesc.get) {
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
      get() {
        if (this._deferredMobileSrc) {
          triggerDeferredImageLoad(this);
          return 0;
        }
        const raw = natWidthDesc.get.call(this);
        if (this._isMobile05x && raw > 0 && this._logicalWidth) {
          return this._logicalWidth;
        }
        return raw;
      },
      configurable: true
    });
  }

  if (natHeightDesc && natHeightDesc.get) {
    Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
      get() {
        if (this._deferredMobileSrc) {
          triggerDeferredImageLoad(this);
          return 0;
        }
        const raw = natHeightDesc.get.call(this);
        if (this._isMobile05x && raw > 0 && this._logicalHeight) {
          return this._logicalHeight;
        }
        return raw;
      },
      configurable: true
    });
  }

  if (widthDesc && widthDesc.get) {
    Object.defineProperty(HTMLImageElement.prototype, 'width', {
      get() {
        if (this._deferredMobileSrc) {
          triggerDeferredImageLoad(this);
        }
        const raw = widthDesc.get.call(this);
        if (this._isMobile05x && raw > 0 && this._logicalWidth) {
          return this._logicalWidth;
        }
        return raw;
      },
      set(val) {
        if (widthDesc.set) widthDesc.set.call(this, val);
      },
      configurable: true
    });
  }

  if (heightDesc && heightDesc.get) {
    Object.defineProperty(HTMLImageElement.prototype, 'height', {
      get() {
        if (this._deferredMobileSrc) {
          triggerDeferredImageLoad(this);
        }
        const raw = heightDesc.get.call(this);
        if (this._isMobile05x && raw > 0 && this._logicalHeight) {
          return this._logicalHeight;
        }
        return raw;
      },
      set(val) {
        if (heightDesc.set) heightDesc.set.call(this, val);
      },
      configurable: true
    });
  }

  // 3. Intercept CanvasRenderingContext2D.prototype.drawImage with zero-allocation signature
  // and 2-slot pre-scaled mip canvas caching for 5-arg sprite draws (hair, weapons, accessories)
  if (typeof CanvasRenderingContext2D !== 'undefined' && CanvasRenderingContext2D.prototype.drawImage) {
    const origDrawImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function(img, a, b, c, d, e, f, g, h) {
      if (!img) return;
      if (img._deferredMobileSrc) {
        triggerDeferredImageLoad(img);
        return;
      }

      if (e === undefined && c !== undefined && d !== undefined && img.tagName === 'IMG') {
        // 5-argument: drawImage(img, dx, dy, dw, dh)
        // Check if we can use a pre-scaled mip canvas to avoid downsampling 500K-1M px per frame
        const mipW = (c * 2) | 0;
        const mipH = (d * 2) | 0;
        if (mipW > 8 && mipH > 8 && mipW <= 384 && mipH <= 384) {
          const rawW = natWidthDesc ? natWidthDesc.get.call(img) : img.width;
          const rawH = natHeightDesc ? natHeightDesc.get.call(img) : img.height;
          if (rawW > mipW * 1.4 && rawH > mipH * 1.4) {
            let mipCanvas = null;
            const s0 = img._mip0;
            const s1 = img._mip1;
            if (s0 && s0.w === mipW && s0.h === mipH) {
              mipCanvas = s0.canvas;
            } else if (s1 && s1.w === mipW && s1.h === mipH) {
              mipCanvas = s1.canvas;
            } else if (typeof document !== 'undefined') {
              const mc = document.createElement('canvas');
              mc.width = mipW;
              mc.height = mipH;
              const mctx = mc.getContext('2d');
              if (mctx) {
                mctx.imageSmoothingEnabled = false;
                origDrawImage.call(mctx, img, 0, 0, mipW, mipH);
                mipCanvas = mc;
                img._mip1 = s0;
                img._mip0 = { w: mipW, h: mipH, canvas: mc };
              }
            }
            if (mipCanvas) {
              return origDrawImage.call(this, mipCanvas, a, b, c, d);
            }
          }
        }
        return origDrawImage.call(this, img, a, b, c, d);
      }

      if (img._isMobile05x) {
        if (e === undefined) {
          if (c === undefined) {
            // 3-argument: drawImage(img, dx, dy) -> draw at original logical size
            return origDrawImage.call(this, img, a, b, img._logicalWidth, img._logicalHeight);
          }
          return origDrawImage.call(this, img, a, b, c, d);
        }
        // 9-argument: drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
        return origDrawImage.call(this, img, a * 0.5, b * 0.5, c * 0.5, d * 0.5, e, f, g, h);
      }

      if (e === undefined) {
        if (c === undefined) return origDrawImage.call(this, img, a, b);
        return origDrawImage.call(this, img, a, b, c, d);
      }
      return origDrawImage.call(this, img, a, b, c, d, e, f, g, h);
    };
  }
}
