// ───────────────────────────────────────────────────────────────────────────
// CAROL HOLIDAY (Deltarune — "Resolve") Fighter Skin & Body Model
// Adheres strictly to:
// - Rule 11: Zero ctx.shadowBlur
// - Rule 19: Upright Front POV (Faceless Dome)
// - Rule 20: Zero Detached Idle Hands on Neutral Body
// - Rule 22: Dedicated Carol-hair.png (Snow-White Swept Hair + Cyan Antlers)
// - Rule 24: Canonical 4-Zone Proportions & 1:1 Offscreen Canvas Buffer
// - Rule 32: World-Space Skin Drawing & Explicit 2.0px #0E0F14 Outline
// - Rule 35: 100% Pre-Baked Offscreen Canvas Quads & Pre-Baked Glows
// ───────────────────────────────────────────────────────────────────────────

import { state } from '../../core/state.js';

let _carolHairImage = null;
let _carolHairLoading = false;

export function _getCarolHairImage() {
  if (_carolHairImage && _carolHairImage.complete && _carolHairImage.naturalWidth > 0) {
    return _carolHairImage;
  }
  if (!_carolHairLoading && typeof Image !== 'undefined') {
    _carolHairLoading = true;
    const img = new Image();
    img.onload = () => {
      _carolHairImage = img;
      _carolHairLoading = false;
    };
    img.onerror = () => {
      _carolHairLoading = false;
    };
    img.src = 'Assets/model/carol/Carol-hair.png?v=1';
    _carolHairImage = img;
  }
  return _carolHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getCarolHairImage();
}

// ── Offscreen Discrete Rasterization Caches (Rule 35) ──
const _bodyCanvasCache = new Map();
const _ghostCanvasCache = new Map();
let _frostAuraGlowCanvas = null;

function _uploadWarmTexture(targetCtx, drawable) {
  if (!targetCtx || typeof targetCtx.drawImage !== 'function' || !drawable) return;
  try {
    targetCtx.save();
    targetCtx.globalAlpha = 0.001;
    targetCtx.drawImage(drawable, 0, 0, 1, 1, -20, -20, 1, 1);
  } catch (_) {
    // Ignore headless/unloaded bitmap edge
  } finally {
    targetCtx.restore();
  }
}

function _getFrostAuraGlow() {
  if (typeof document === 'undefined') return null;
  if (_frostAuraGlowCanvas) return _frostAuraGlowCanvas;
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const gctx = c.getContext('2d');
  if (gctx) {
    const grad = gctx.createRadialGradient(48, 48, 8, 48, 48, 46);
    grad.addColorStop(0.0, 'rgba(186, 230, 253, 0.55)');
    grad.addColorStop(0.55, 'rgba(56, 189, 248, 0.30)');
    grad.addColorStop(1.0, 'rgba(56, 189, 248, 0.0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 96, 96);
  }
  _frostAuraGlowCanvas = c;
  return c;
}

function _renderCarolBodyToCanvas(destCtx, r) {
  destCtx.imageSmoothingEnabled = false;
  const P = 2.0;
  const steps = Math.ceil((r + P) / P);
  const cx = destCtx.canvas.width / 2;
  const cy = destCtx.canvas.height / 2;

  destCtx.save();
  destCtx.translate(cx, cy);

  for (let gy = -steps; gy <= steps; gy++) {
    for (let gx = -steps; gx <= steps; gx++) {
      const rx = gx * P;
      const ry = gy * P;
      const dist = Math.hypot(rx, ry);
      if (dist > r) continue;

      const px = rx - P / 2;
      const py = ry - P / 2;

      // 4-neighbor outer boundary test -> Crisp #0E0F14 Manga Ink Outline
      const isBorder = (
        dist >= r - P * 1.05 ||
        Math.hypot((gx + 1) * P, gy * P) > r ||
        Math.hypot((gx - 1) * P, gy * P) > r ||
        Math.hypot(gx * P, (gy + 1) * P) > r ||
        Math.hypot(gx * P, (gy - 1) * P) > r
      );
      if (isBorder) {
        destCtx.fillStyle = '#0E0F14';
        destCtx.fillRect(px, py, P, P);
        continue;
      }

      // ──────────────────────────────────────────────────
      // ZONE 1: PURE FACELESS DOME (ry < r * 0.28)
      // Warm pale fawn/cream deer skin (#E8DEC8) matching Carol_Idle1.png
      // ──────────────────────────────────────────────────
      if (ry < r * 0.28) {
        let skinCol = '#E8DEC8';
        if (ry < -r * 0.42 && Math.abs(rx) < r * 0.42) {
          skinCol = '#F5EFE0'; // Forehead glint
        } else if (Math.abs(rx) > r * 0.62) {
          skinCol = '#C8BCA6'; // Cheek & temple contour
        } else if (ry > r * 0.16) {
          skinCol = '#D5C8B2'; // Soft chin shadow
        }
        destCtx.fillStyle = skinCol;
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────────────
      // ZONE 2: ROYAL NAVY DOUBLE-BREASTED COAT (0.28r <= ry < 0.64r)
      // ──────────────────────────────────────────────────
      else if (ry < r * 0.64) {
        const isHighCollar = ry < r * 0.36;
        const isCenterSeam = Math.abs(rx) <= P * 0.85;
        const isButton = isCenterSeam && ((gy % 3 === 0) && ry >= r * 0.36 && ry <= r * 0.60);
        const isLapel = Math.abs(Math.abs(rx) - r * 0.24) <= P * 0.9 && ry < r * 0.56;

        if (isButton) {
          destCtx.fillStyle = '#E5D9B6'; // Brass-gold coat buttons
        } else if (isHighCollar && Math.abs(rx) < r * 0.34) {
          destCtx.fillStyle = '#2A3E8F'; // Raised navy collar highlight
        } else if (isLapel) {
          destCtx.fillStyle = '#263985'; // Double-breasted lapel seam
        } else if (isCenterSeam) {
          destCtx.fillStyle = '#131D47'; // Center placket crease
        } else {
          let coatCol = '#1E2D6B'; // Main royal navy coat (Y >= 24)
          if (Math.abs(rx) > r * 0.66) coatCol = '#162254';
          else if (ry < r * 0.44 && Math.abs(rx) < r * 0.52) coatCol = '#24357D';
          destCtx.fillStyle = coatCol;
        }
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────────────
      // ZONE 3: GLACIAL CYAN BELT / SCABBARD SASH (0.64r <= ry < 0.78r)
      // ──────────────────────────────────────────────────
      else if (ry < r * 0.78) {
        const isBuckle = Math.abs(rx) <= r * 0.22;
        if (isBuckle) {
          destCtx.fillStyle = Math.abs(rx) <= P * 1.1 ? '#F0F9FF' : '#7CE8FF';
        } else {
          destCtx.fillStyle = ry < r * 0.70 ? '#38BDF8' : '#0284C7';
        }
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────────────
      // ZONE 4: TAILORED SLATE-INDIGO TROUSERS (ry >= 0.78r)
      // ──────────────────────────────────────────────────
      else {
        const isCenterFly = Math.abs(rx) <= P * 0.85;
        if (isCenterFly) {
          destCtx.fillStyle = '#1A1E2E';
        } else if (Math.abs(rx) > r * 0.55) {
          destCtx.fillStyle = '#1F2438';
        } else {
          destCtx.fillStyle = '#2B314A';
        }
        destCtx.fillRect(px, py, P, P);
      }
    }
  }

  destCtx.restore();
}

function _getOrBakeBodyCanvas(intR) {
  if (typeof document === 'undefined') return null;
  if (_bodyCanvasCache.has(intR)) return _bodyCanvasCache.get(intR);
  const P = 2.0;
  const steps = Math.ceil((intR + P) / P);
  const size = (steps * 2 + 1) * P;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const bctx = c.getContext('2d');
  if (bctx) {
    _renderCarolBodyToCanvas(bctx, intR);
  }
  _bodyCanvasCache.set(intR, c);
  return c;
}

function _getOrBakeGhostCanvas(intR) {
  if (typeof document === 'undefined') return null;
  if (_ghostCanvasCache.has(intR)) return _ghostCanvasCache.get(intR);
  const P = 2.0;
  const steps = Math.ceil((intR + P) / P);
  const size = (steps * 2 + 1) * P;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const gctx = c.getContext('2d');
  if (gctx) {
    _renderCarolBodyToCanvas(gctx, intR);
    gctx.globalCompositeOperation = 'source-atop';
    gctx.fillStyle = 'rgba(56, 189, 248, 0.58)';
    gctx.fillRect(0, 0, size, size);
    gctx.globalCompositeOperation = 'source-over';
  }
  _ghostCanvasCache.set(intR, c);
  return c;
}

export function drawCarolPixelBody(ctx, r) {
  const intR = Math.max(8, Math.round(r));
  const cached = _getOrBakeBodyCanvas(intR);
  if (!cached) return;
  const size = cached.width;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cached, -size / 2, -size / 2);
  ctx.restore();
}

export function prewarmCarolSkin(radius = 30, targetCtx = null) {
  const hairImg = _getCarolHairImage();
  if (hairImg && hairImg.complete && hairImg.naturalWidth > 0) {
    _uploadWarmTexture(targetCtx, hairImg);
  }
  if (typeof document === 'undefined') return 0;
  const intR = Math.max(8, Math.round(radius));
  let warmed = 0;

  const body = _getOrBakeBodyCanvas(intR);
  if (body) { _uploadWarmTexture(targetCtx, body); warmed++; }

  const ghost = _getOrBakeGhostCanvas(intR);
  if (ghost) { _uploadWarmTexture(targetCtx, ghost); warmed++; }

  const aura = _getFrostAuraGlow();
  if (aura) { _uploadWarmTexture(targetCtx, aura); warmed++; }
  return warmed;
}

export function getCarolSkinCacheCounts() {
  return {
    bodies: _bodyCanvasCache.size,
    ghosts: _ghostCanvasCache.size,
    auraGlow: _frostAuraGlowCanvas ? 1 : 0,
  };
}

/**
 * Layer 2 Rule 22 Hair & Antler Renderer: Snow-White Swept Bob + Twin Cyan Antlers
 */
export function _drawCarolHair(ctx, r, facingLeft = false, customOverride = null) {
  const hairImg = _getCarolHairImage();
  if (!hairImg || !hairImg.complete || hairImg.naturalWidth <= 0) return;

  const custom = customOverride || state.skinCustomizations?.carol;
  const wMult = custom?.widthScale ?? 1.00;
  const hMult = custom?.heightScale ?? 1.00;
  const offX = custom?.offsetX ?? 0;
  const offY = custom?.offsetY ?? 0;
  const angOff = custom?.angleOffset ?? 0;
  const flipX = Boolean(custom?.flipX);
  const flipY = Boolean(custom?.flipY);

  const drawW = r * 3.04 * wMult;
  const drawH = r * 1.68 * hMult;
  const drawX = -drawW * 0.5 + offX;
  const drawY = -r * 1.42 + offY;

  ctx.save();
  if (angOff !== 0) ctx.rotate(angOff);
  if (flipX) ctx.scale(-1, 1);
  if (flipY) ctx.scale(1, -1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(hairImg, drawX, drawY, drawW, drawH);
  ctx.restore();
}

/**
 * Renders Carol Holiday's upright character skin in world space (Rule 32 & Rule 35).
 */
export function drawCarolSkin(ctx, fighter) {
  if (!fighter) return;
  const r = fighter.r || fighter.radius || 25;
  const angle = fighter._isWinnerReveal ? 0 : (fighter.gunAngle || fighter.angle || 0);
  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  const facingLeft = Math.abs(normAngle) > Math.PI / 2;

  ctx.save();
  ctx.translate(fighter.x || 0, (fighter.y || 0) - (fighter.z || 0));

  // Optional frost aura during Permafrost or Frost Parry (filtered out of silhouette pass per Rule 32)
  if (!fighter._isSilhouettePass && (fighter.isPermafrostActive || (fighter.parryFlashTimer || 0) > 0)) {
    const aura = _getFrostAuraGlow();
    if (aura) {
      const aSize = r * 3.8;
      ctx.save();
      ctx.globalAlpha = fighter.isPermafrostActive ? 0.78 : 0.55;
      ctx.drawImage(aura, -aSize * 0.5, -aSize * 0.5, aSize, aSize);
      ctx.restore();
    }
  }

  ctx.save();
  ctx.rotate(angle);
  if (facingLeft) {
    ctx.scale(1, -1);
  }

  // Layer 1: Pre-baked 4-zone Carol body
  drawCarolPixelBody(ctx, r);

  // Layer 1.5: Mandatory Universal Character Black Outline Standard (Rule 32)
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();
  ctx.restore();

  // Layer 2: Snow-white swept hair + twin cyan-indigo antlers (Rule 22)
  _drawCarolHair(ctx, r, facingLeft);

  ctx.restore();
  ctx.restore();
}

/**
 * Renders icy frost afterimage silhouette when Carol dashes or performs Ice Split.
 */
export function drawCarolGhostSkin(ctx, fighter, x, y, angle = 0, alpha = 0.45) {
  const r = fighter ? (fighter.r || fighter.radius || 25) : 25;
  const intR = Math.max(8, Math.round(r));
  const ghost = _getOrBakeGhostCanvas(intR);
  if (!ghost) return;

  const size = ghost.width;
  const facingLeft = Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) > Math.PI / 2;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (facingLeft) ctx.scale(1, -1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ghost, -size / 2, -size / 2);
  ctx.restore();
}
