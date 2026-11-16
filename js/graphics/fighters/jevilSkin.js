// ───────────────────────────────────────────────────────────────────────────
// JEVIL (Deltarune Ch.1) Fighter Skin & Body Model
// Adheres strictly to:
// - Rule 11: Zero ctx.shadowBlur
// - Rule 19: Upright Front POV, zero eyes/pupils/mouths on body circle
// - Rule 20: Zero detached floating hands on neutral body
// - Rule 22: Dedicated Jevil-hair.png jester cap asset + Skin Studio hooks
// - Rule 24: 1:1 Offscreen Canvas Buffer + 4-Zone Proportions + #0E0F14 ink
// - Rule 32: Canonical World-Space Translation & 2.0px Outer Black Outline
// - Rule 35: 100% Pre-Baked Offscreen Canvas Quads
// ───────────────────────────────────────────────────────────────────────────

import { state } from '../../core/state.js';

let _jevilHairImage = null;
let _jevilHairImageLoading = false;

export function _getJevilHairImage() {
  if (_jevilHairImage && _jevilHairImage.complete && _jevilHairImage.naturalWidth > 0) {
    return _jevilHairImage;
  }
  if (!_jevilHairImageLoading && typeof Image !== 'undefined') {
    _jevilHairImageLoading = true;
    const img = new Image();
    img.onload = () => {
      _jevilHairImage = img;
      _jevilHairImageLoading = false;
    };
    img.onerror = () => {
      _jevilHairImageLoading = false;
    };
    img.src = 'Assets/model/jevil/Jevil-hair.png?v=1';
    _jevilHairImage = img;
  }
  return _jevilHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getJevilHairImage();
}

let _cachedJevilCanvas = null;
let _cachedJevilR = 0;
let _cachedJevilGhostCanvas = null;
let _cachedJevilGhostR = 0;

function _renderJevilPixelBodyToCanvas(destCtx, r) {
  destCtx.imageSmoothingEnabled = false;
  const P = 2.0;
  const snap = (v) => Math.round(v / P) * P;
  const steps = Math.ceil((r + P) / P);
  const cx = destCtx.canvas.width / 2;
  const cy = destCtx.canvas.height / 2;

  destCtx.save();
  destCtx.translate(cx, cy);

  for (let gy = -steps; gy <= steps; gy++) {
    for (let gx = -steps; gx <= steps; gx++) {
      const rx = gx * P;
      const ry = gy * P;
      if (Math.hypot(rx, ry) > r) continue;

      const px = rx - P / 2;
      const py = ry - P / 2;

      const isBorder = (
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

      // Zone 1: Clean Faceless Pale Lavender-Gray Jester Face Dome + Cheek Diamonds (Rule 19/24)
      if (ry < r * 0.26) {
        const leftCheek = Math.hypot(rx + r * 0.34, ry - r * 0.02) <= P * 1.4;
        const rightCheek = Math.hypot(rx - r * 0.34, ry - r * 0.02) <= P * 1.4;
        const browBand = Math.abs(ry + r * 0.28) <= P * 0.7 && Math.abs(rx) <= r * 0.65;

        let col = '#B8C4E0';
        if (ry < -r * 0.56) col = '#D3DCF2'; // Crown highlight
        else if (Math.abs(rx) > r * 0.68) col = '#94A3B8'; // Cheek contour

        if (leftCheek || rightCheek) col = '#7C3AED'; // Jester cheek diamond marks
        else if (browBand) col = '#262338'; // Hat brim trim inside top margin

        destCtx.fillStyle = col;
        destCtx.fillRect(px, py, P, P);
      }
      // Zone 2A: Golden Jagged Jester Neck Ruff Collar (r * 0.26 <= ry < r * 0.40)
      else if (ry < r * 0.40) {
        const wave = Math.sin((rx / Math.max(1, r)) * Math.PI * 5.0) * (r * 0.04);
        const isGoldRuff = ry < r * 0.36 + wave;
        let col = isGoldRuff ? '#FACC15' : '#201E2E';
        if (isGoldRuff && ry < r * 0.30) col = '#FEF08A';
        else if (isGoldRuff && Math.abs(rx) > r * 0.60) col = '#EAB308';
        destCtx.fillStyle = col;
        destCtx.fillRect(px, py, P, P);
      }
      // Zone 2B: Black Jester Cape Flanks + Violet Center Tunic (r * 0.40 <= ry < r * 0.66)
      else if (ry < r * 0.66) {
        const absX = Math.abs(rx);
        const vestHalfW = snap(r * 0.38);
        let col = '#201E2E'; // Dark cloak flanks (Y >= 24)
        if (absX <= vestHalfW) {
          col = absX < P * 1.1 ? '#5B21B6' : '#7C3AED';
          // Vertical yellow jester diamond buttons
          if (absX <= P * 1.2 && (Math.abs(ry - r * 0.48) <= P * 0.8 || Math.abs(ry - r * 0.58) <= P * 0.8)) {
            col = '#FACC15';
          }
        } else if (absX > r * 0.72) {
          col = '#2C2940';
        }
        destCtx.fillStyle = col;
        destCtx.fillRect(px, py, P, P);
      }
      // Zone 3: Violet-Gold Jester Belt (r * 0.66 <= ry < r * 0.78)
      else if (ry < r * 0.78) {
        let col = '#4C1D95';
        if (Math.abs(rx) <= P * 2.2) col = '#FACC15';
        else if (Math.abs(ry - r * 0.72) > r * 0.04) col = '#2E1065';
        destCtx.fillStyle = col;
        destCtx.fillRect(px, py, P, P);
      }
      // Zone 4: Jester Trousers + Purple/Gold Accents (ry >= r * 0.78)
      else {
        const absX = Math.abs(rx);
        let col = '#252338';
        if (absX < P * 1.1) col = '#171524';
        else if (absX > r * 0.42 && absX < r * 0.56) col = '#A855F7';
        destCtx.fillStyle = col;
        destCtx.fillRect(px, py, P, P);
      }
    }
  }
  destCtx.restore();
}

export function drawJevilPixelBody(ctx, r) {
  if (typeof document === 'undefined') return;
  const intR = Math.max(10, Math.round(r));
  if (!_cachedJevilCanvas || _cachedJevilR !== intR) {
    _cachedJevilR = intR;
    const P = 2.0;
    const steps = Math.ceil((intR + P) / P);
    const size = (steps * 2 + 1) * P;
    _cachedJevilCanvas = document.createElement('canvas');
    _cachedJevilCanvas.width = size;
    _cachedJevilCanvas.height = size;
    const offCtx = _cachedJevilCanvas.getContext('2d');
    if (offCtx) _renderJevilPixelBodyToCanvas(offCtx, intR);
  }
  if (_cachedJevilCanvas) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(_cachedJevilCanvas, -_cachedJevilCanvas.width / 2, -_cachedJevilCanvas.height / 2);
    ctx.restore();
  }
}

export function _drawJevilHair(ctx, r, facingLeft = false) {
  const hairImg = _getJevilHairImage();
  if (!hairImg || !hairImg.complete || hairImg.naturalWidth <= 0) return;

  const custom = state.skinCustomizations?.jevil;
  const wScale = custom?.widthScale ?? 1.0;
  const hScale = custom?.heightScale ?? 1.0;
  const offX = custom?.offsetX ?? 0;
  const offY = custom?.offsetY ?? 0;
  const rotOffset = custom?.angleOffset ?? 0;

  const drawW = r * 2.95 * wScale;
  const drawH = r * 1.36 * hScale;
  const drawX = -drawW * 0.5 + offX;
  const drawY = -r * 1.30 + offY;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (rotOffset) ctx.rotate(rotOffset);
  if (custom?.flipX) ctx.scale(-1, 1);
  if (custom?.flipY) ctx.scale(1, -1);
  ctx.drawImage(hairImg, drawX, drawY, drawW, drawH);
  ctx.restore();
}

export function drawJevilSkin(ctx, fighter) {
  if (!fighter) return;
  const r = fighter.r || 25;

  ctx.save();
  // Rule 32: Canonical World-Space Coordinate Translation Contract
  ctx.translate(fighter.x || 0, (fighter.y || 0) - (fighter.z || 0));

  const angle = fighter._isWinnerReveal ? 0 : (fighter.gunAngle || 0);
  ctx.rotate(angle);
  const facingLeft = Math.abs(angle) > Math.PI / 2;
  if (facingLeft) {
    ctx.scale(1, -1);
  }

  // Layer 1: Pre-baked 1:1 Pixel Body
  drawJevilPixelBody(ctx, r);

  // Layer 1.5: Mandatory 2.0px Outer Black Manga Outline (Rule 32)
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();
  ctx.restore();

  // Layer 2: Two-Pronged Jester Hat with Golden Bells (Rule 22)
  _drawJevilHair(ctx, r, facingLeft);

  // Non-silhouette Devil-Tail Accent
  if (!fighter._isSilhouettePass) {
    const wag = Math.sin((fighter._vfxTick || 0) * 0.16) * 4;
    ctx.save();
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(-r * 0.86, r * 0.56);
    ctx.quadraticCurveTo(-r * 1.26, r * 0.40 + wag, -r * 1.18, r * 0.12 + wag);
    ctx.stroke();

    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.fillStyle = '#A855F7';
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-r * 1.18, r * 0.04 + wag);
    ctx.lineTo(-r * 1.08, r * 0.14 + wag);
    ctx.lineTo(-r * 1.18, r * 0.22 + wag);
    ctx.lineTo(-r * 1.28, r * 0.14 + wag);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

export function drawJevilGhostSkin(ctx, fighter, x, y, angle = 0, alpha = 0.45, tintIndex = 0) {
  if (!fighter) return;
  const r = fighter.r || 25;
  const intR = Math.max(10, Math.round(r));

  if (typeof document !== 'undefined' && (!_cachedJevilGhostCanvas || _cachedJevilGhostR !== intR)) {
    _cachedJevilGhostR = intR;
    const P = 2.0;
    const steps = Math.ceil((intR + P) / P);
    const size = (steps * 2 + 1) * P;
    _cachedJevilGhostCanvas = document.createElement('canvas');
    _cachedJevilGhostCanvas.width = size;
    _cachedJevilGhostCanvas.height = size;
    const gctx = _cachedJevilGhostCanvas.getContext('2d');
    if (gctx) _renderJevilPixelBodyToCanvas(gctx, intR);
  }

  const tints = ['#A855F7', '#FACC15', '#FF1E4D'];
  const ghostCol = tints[tintIndex % tints.length];

  ctx.save();
  ctx.globalAlpha = Math.max(0.05, Math.min(0.85, alpha));
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (Math.abs(angle) > Math.PI / 2) ctx.scale(1, -1);

  if (_cachedJevilGhostCanvas) {
    ctx.drawImage(_cachedJevilGhostCanvas, -_cachedJevilGhostCanvas.width / 2, -_cachedJevilGhostCanvas.height / 2);
  }
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = ghostCol;
  ctx.globalAlpha *= 0.30;
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.globalAlpha = Math.min(0.9, alpha * 1.15);
  ctx.strokeStyle = ghostCol;
  ctx.stroke();

  _drawJevilHair(ctx, r, Math.abs(angle) > Math.PI / 2);
  ctx.restore();
}
