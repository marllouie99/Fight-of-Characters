// ───────────────────────────────────────────────────────────────────────────
// LAST BREATH SANS Fighter Skin & Body Model
// Renders Sans across his authentic 3 Undertale: Last Breath phases:
// - Phase 1: Classic dark open hoodie, bone skull, faint mouth blood droplet
// - Phase 2: "The Slaughter Continues" — Deep crimson diagonal chest slash,
//            hem blood stains, faint crack & blazing Cyan/Orange left eye
// - Phase 3: "An Enigmatic Encounter" — Jagged diagonal skull crack across
//            left/right socket, cracked glowing eye sockets & spectral aura
// Adheres strictly to Rules 11, 19, 20, 22, 24, 32, 35.
// ───────────────────────────────────────────────────────────────────────────

import { getHandSize } from '../../core/config.js';
import { state } from '../../core/state.js';
import { drawPixelHand } from '../renderers/fighterRenderer.js';

let _lastBreathHairImage = null;
let _lastBreathHairLoading = false;

export function _getLastBreathSansHairImage() {
  if (_lastBreathHairImage && _lastBreathHairImage.complete && _lastBreathHairImage.naturalWidth > 0) {
    return _lastBreathHairImage;
  }
  if (!_lastBreathHairLoading && typeof Image !== 'undefined') {
    _lastBreathHairLoading = true;
    const img = new Image();
    img.onload = () => {
      _lastBreathHairImage = img;
      _lastBreathHairLoading = false;
    };
    img.onerror = () => {
      _lastBreathHairLoading = false;
    };
    img.src = 'Assets/model/last_breath_sans/LastBreathSans-hair.png?v=1';
    _lastBreathHairImage = img;
  }
  return _lastBreathHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getLastBreathSansHairImage();
}

// ── Offscreen Discrete Rasterization Caches (Rule 35) ──
// Keyed by `${intR}_${phase}_${eyeActive ? 1 : 0}` for zero runtime pixel loops
const _bodyCanvasCache = new Map();
const _ghostCanvasCache = new Map();
const _eyeGlowCache = new Map();

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

function _getOrBakeGhostCanvas(intR, phase = 1) {
  if (typeof document === 'undefined') return null;
  const ghostTier = phase >= 3 ? 3 : 1;
  const key = `${intR}_${ghostTier}`;
  if (_ghostCanvasCache.has(key)) return _ghostCanvasCache.get(key);
  const P = 2.0;
  const steps = Math.ceil((intR + P) / P);
  const size = (steps * 2 + 1) * P;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const gctx = c.getContext('2d');
  if (gctx) {
    _renderLastBreathBodyToCanvas(gctx, intR, 3, true);
    gctx.globalCompositeOperation = 'source-atop';
    gctx.fillStyle = ghostTier >= 3 ? 'rgba(239, 68, 68, 0.55)' : 'rgba(0, 229, 255, 0.52)';
    gctx.fillRect(0, 0, size, size);
    gctx.globalCompositeOperation = 'source-over';
  }
  _ghostCanvasCache.set(key, c);
  return c;
}

function _getPrebakedEyeGlow(colorKey, innerRgba, midRgba, outerRgba) {
  if (typeof document === 'undefined') return null;
  if (_eyeGlowCache.has(colorKey)) return _eyeGlowCache.get(colorKey);
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const gctx = c.getContext('2d');
  if (gctx) {
    const grad = gctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0.0, innerRgba);
    grad.addColorStop(0.32, midRgba);
    grad.addColorStop(0.70, outerRgba);
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 64, 64);
  }
  _eyeGlowCache.set(colorKey, c);
  return c;
}

function _renderLastBreathBodyToCanvas(destCtx, r, phase = 1, eyeActive = false) {
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

      // 4-neighbor attached boundary test -> Dark Manga Ink Border (#0E0F14)
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

      // Inner white coat contour on hoodie/shorts zone (authentic Undertale sprite white outlines)
      const isInnerWhiteRim = (
        dist >= r - P * 2.05 ||
        Math.hypot((gx + 2) * P, gy * P) > r ||
        Math.hypot((gx - 2) * P, gy * P) > r ||
        Math.hypot(gx * P, (gy + 2) * P) > r ||
        Math.hypot(gx * P, (gy - 2) * P) > r
      );

      // ──────────────────────────────────────────────────
      // 1. SKELETON SKULL, EYES & PHASE 3 CRACK (ry < +r * 0.16)
      // ──────────────────────────────────────────────────
      if (ry < r * 0.16) {
        const eyeY = -r * 0.13;
        const leftEyeX = -r * 0.28;
        const rightEyeX = r * 0.28;
        const eyeRadius = r * 0.17;

        const distLeftEye = Math.hypot(rx - leftEyeX, ry - eyeY);
        const distRightEye = Math.hypot(rx - rightEyeX, ry - eyeY);
        const isLeftSocket = distLeftEye <= eyeRadius;
        const isRightSocket = distRightEye <= eyeRadius;

        // Nasal cavity inverted triangle
        const isNasalCavity = (
          ry >= -r * 0.05 &&
          ry <= r * 0.01 &&
          Math.abs(rx) <= (0.01 - (ry - (-r * 0.05))) * 0.6 * r + P
        );

        // Teeth grin
        const isSmileZone = (ry >= r * 0.04 && ry <= r * 0.13 && Math.abs(rx) <= r * 0.44);

        // Small blood droplet from right corner of mouth (iconic Last Breath cue)
        const isMouthBlood = (
          ry >= r * 0.11 &&
          ry <= r * 0.155 &&
          rx >= r * 0.14 &&
          rx <= r * 0.24
        );

        // Phase 3 jagged skull crack cutting diagonally down from upper brow across eye bridge
        const crackDiagX = -r * 0.42 + ((ry + r * 0.62) / (r * 0.56)) * r * 0.56;
        const isPhase3Crack = (
          phase >= 3 &&
          ry >= -r * 0.68 &&
          ry <= -r * 0.05 &&
          Math.abs(rx - (crackDiagX + Math.sin(ry * 0.55) * P * 0.9)) <= P * 0.72
        );
        // Subtle Phase 2 hairline temple crack
        const isPhase2Fracture = (
          phase === 2 &&
          ry >= -r * 0.58 &&
          ry <= -r * 0.24 &&
          Math.abs(rx - (-r * 0.34 + ((ry + r * 0.58) / (r * 0.34)) * r * 0.18)) <= P * 0.55
        );

        if (isLeftSocket) {
          if (eyeActive || phase >= 2) {
            if (distLeftEye <= eyeRadius * 0.48) {
              destCtx.fillStyle = '#FFFFFF';
            } else if (distLeftEye <= eyeRadius * 0.80) {
              destCtx.fillStyle = phase >= 3 ? '#00E5FF' : '#00F5FF';
            } else {
              destCtx.fillStyle = phase >= 3 ? '#FF9500' : '#0E0F14';
            }
          } else {
            const isPupil = distLeftEye <= P * 0.80;
            destCtx.fillStyle = isPupil ? '#FFFFFF' : '#0E0F14';
          }
          destCtx.fillRect(px, py, P, P);
        } else if (isRightSocket) {
          if (phase >= 3 && eyeActive) {
            if (distRightEye <= eyeRadius * 0.45) {
              destCtx.fillStyle = '#FFF7ED';
            } else if (distRightEye <= eyeRadius * 0.80) {
              destCtx.fillStyle = '#EF4444';
            } else {
              destCtx.fillStyle = '#0E0F14';
            }
          } else if (phase >= 3) {
            // Cracked static dark eye socket in Phase 3
            const isHatch = ((gx + gy) % 2 === 0) && distRightEye <= eyeRadius * 0.72;
            destCtx.fillStyle = isHatch ? '#94A3B8' : '#0E0F14';
          } else {
            const isPupil = distRightEye <= P * 0.80;
            destCtx.fillStyle = isPupil ? '#FFFFFF' : '#0E0F14';
          }
          destCtx.fillRect(px, py, P, P);
        } else if (isPhase3Crack || isPhase2Fracture) {
          destCtx.fillStyle = '#0E0F14';
          destCtx.fillRect(px, py, P, P);
        } else if (isNasalCavity) {
          destCtx.fillStyle = '#0E0F14';
          destCtx.fillRect(px, py, P, P);
        } else if (isMouthBlood) {
          destCtx.fillStyle = '#EF4444';
          destCtx.fillRect(px, py, P, P);
        } else if (isSmileZone) {
          const toothIndex = Math.floor((rx + r * 0.44) / (P * 2.0));
          const isToothDivider = (toothIndex % 2 === 1) && (ry >= r * 0.06 && ry <= r * 0.11);
          const isSmileOutline = (ry >= r * 0.12 || Math.abs(rx) >= r * 0.40);
          destCtx.fillStyle = (isToothDivider || isSmileOutline) ? '#0E0F14' : '#FFFFFF';
          destCtx.fillRect(px, py, P, P);
        } else {
          let boneColor = '#FFFFFF';
          if (ry < -r * 0.48) boneColor = '#F8FAFC';
          else if (Math.abs(rx) > r * 0.70) boneColor = '#E2E8F0';
          else if (ry > r * 0.08) boneColor = '#CBD5E1';
          destCtx.fillStyle = boneColor;
          destCtx.fillRect(px, py, P, P);
        }
      }
      // ──────────────────────────────────────────────────
      // 2. FLUFFY WHITE HOOD COLLAR (ry >= +r * 0.16 && ry < +r * 0.32)
      // ──────────────────────────────────────────────────
      else if (ry < r * 0.32) {
        if (isInnerWhiteRim) {
          destCtx.fillStyle = '#FFFFFF';
        } else if (ry < r * 0.21 && Math.abs(rx) < r * 0.32) {
          destCtx.fillStyle = '#F8FAFC';
        } else if (Math.abs(rx) > r * 0.35 || ry < r * 0.21) {
          destCtx.fillStyle = '#E2E8F0';
        } else {
          destCtx.fillStyle = '#94A3B8';
        }
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────────────
      // 3. BLACK JACKET, WHITE SHIRT & PHASE 2/3 CRIMSON CHEST SLASH
      // ──────────────────────────────────────────────────
      else if (ry < r * 0.70) {
        const shirtHalfW = r * 0.22 - (ry - r * 0.32) * 0.04;
        const isWhiteShirt = Math.abs(rx) <= Math.max(P * 1.5, shirtHalfW);
        const isZipperEdge = Math.abs(Math.abs(rx) - Math.max(P * 1.5, shirtHalfW)) <= P * 1.1;

        // Diagonal Chest Slash from top-left (-0.42r, 0.30r) to bottom-right (+0.44r, 0.65r)
        const slashProgress = (ry - r * 0.30) / (r * 0.36);
        const slashCenterX = -r * 0.42 + slashProgress * (r * 0.86);
        const isChestSlash = (
          phase >= 2 &&
          slashProgress >= 0 &&
          slashProgress <= 1 &&
          Math.abs(rx - slashCenterX) <= P * (1.25 - Math.abs(slashProgress - 0.5) * 0.8)
        );
        // Blood splatter along bottom right of jacket in Phase 2 & 3
        const isHemBlood = (
          phase >= 2 &&
          ry >= r * 0.56 &&
          ry <= r * 0.69 &&
          rx >= r * 0.28 &&
          rx <= r * 0.56 &&
          ((gx * 3 + gy * 5) % 3 !== 0)
        );

        if (isChestSlash || isHemBlood) {
          destCtx.fillStyle = Math.abs(rx - slashCenterX) <= P * 0.55 ? '#EF4444' : '#B91C1C';
          destCtx.fillRect(px, py, P, P);
        } else if (isInnerWhiteRim || isZipperEdge) {
          destCtx.fillStyle = '#F8FAFC';
          destCtx.fillRect(px, py, P, P);
        } else if (isWhiteShirt) {
          const isRibCrease = Math.abs(rx) <= P * 0.65 && (gy % 2 === 0);
          destCtx.fillStyle = isRibCrease ? '#CBD5E1' : '#FFFFFF';
          destCtx.fillRect(px, py, P, P);
        } else {
          // Dark Undertale hoodie fabric (#1A1D29 > Y 24 luminance separation from #0E0F14)
          let coatColor = '#1E2230';
          if (ry > r * 0.54 && Math.abs(rx) > r * 0.36) coatColor = '#181B26';
          if (Math.abs(rx) > r * 0.72) coatColor = '#262C3D';
          destCtx.fillStyle = coatColor;
          destCtx.fillRect(px, py, P, P);
        }
      }
      // ──────────────────────────────────────────────────
      // 4. WAISTBAND & SHORTS TRIM (ry >= +r * 0.70 && ry < +r * 0.80)
      // ──────────────────────────────────────────────────
      else if (ry < r * 0.80) {
        destCtx.fillStyle = isInnerWhiteRim ? '#F8FAFC' : '#161924';
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────────────
      // 5. BLACK BASKETBALL SHORTS & WHITE SIDE STRIPES
      // ──────────────────────────────────────────────────
      else {
        const isWhiteStripe = Math.abs(rx) >= r * 0.52 && Math.abs(rx) <= r * 0.66;
        const isCenterSeam = Math.abs(rx) <= P * 0.9;
        if (isInnerWhiteRim || isWhiteStripe) {
          destCtx.fillStyle = '#FFFFFF';
        } else if (isCenterSeam) {
          destCtx.fillStyle = '#475569';
        } else {
          destCtx.fillStyle = '#1E2230';
        }
        destCtx.fillRect(px, py, P, P);
      }
    }
  }

  destCtx.restore();
}

export function drawLastBreathSansPixelBody(ctx, r, options = {}) {
  const intR = Math.max(8, Math.round(r));
  const phase = Math.max(1, Math.min(3, Math.round(options.phase || 1)));
  const eyeActive = Boolean(options.eyeActive);

  if (typeof document === 'undefined') return;
  const cacheKey = `${intR}_${phase}_${eyeActive ? 1 : 0}`;
  let cachedCanvas = _bodyCanvasCache.get(cacheKey);
  if (!cachedCanvas) {
    const P = 2.0;
    const steps = Math.ceil((intR + P) / P);
    const size = (steps * 2 + 1) * P;
    cachedCanvas = document.createElement('canvas');
    cachedCanvas.width = size;
    cachedCanvas.height = size;
    const bctx = cachedCanvas.getContext('2d');
    if (bctx) {
      _renderLastBreathBodyToCanvas(bctx, intR, phase, eyeActive);
    }
    _bodyCanvasCache.set(cacheKey, cachedCanvas);
  }

  const size = cachedCanvas.width;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cachedCanvas, -size / 2, -size / 2);
  ctx.restore();
}

export function prewarmLastBreathSansSkin(radius = 30, targetCtx = null) {
  const hairImg = _getLastBreathSansHairImage();
  if (hairImg && hairImg.complete && hairImg.naturalWidth > 0) {
    _uploadWarmTexture(targetCtx, hairImg);
  }
  if (typeof document === 'undefined') return 0;
  const intR = Math.max(8, Math.round(radius));
  let warmedCount = 0;

  for (const phase of [1, 2, 3]) {
    for (const eyeActive of [false, true]) {
      const cacheKey = `${intR}_${phase}_${eyeActive ? 1 : 0}`;
      let c = _bodyCanvasCache.get(cacheKey);
      if (!c) {
        const P = 2.0;
        const steps = Math.ceil((intR + P) / P);
        const size = (steps * 2 + 1) * P;
        c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const bctx = c.getContext('2d');
        if (bctx) {
          _renderLastBreathBodyToCanvas(bctx, intR, phase, eyeActive);
        }
        _bodyCanvasCache.set(cacheKey, c);
      }
      _uploadWarmTexture(targetCtx, c);
      warmedCount++;
    }
  }

  for (const ghostTier of [1, 3]) {
    const gc = _getOrBakeGhostCanvas(intR, ghostTier);
    _uploadWarmTexture(targetCtx, gc);
    if (gc) warmedCount++;
  }

  const cyanGlow = _getPrebakedEyeGlow('cyan', 'rgba(255,255,255,0.95)', 'rgba(0,229,255,0.85)', 'rgba(239,68,68,0.35)');
  const amberGlow = _getPrebakedEyeGlow('amber', 'rgba(255,255,255,0.95)', 'rgba(255,149,0,0.85)', 'rgba(239,68,68,0.40)');
  _uploadWarmTexture(targetCtx, cyanGlow);
  _uploadWarmTexture(targetCtx, amberGlow);
  if (cyanGlow) warmedCount++;
  if (amberGlow) warmedCount++;
  return warmedCount;
}

export function getLastBreathSkinCacheCounts() {
  return {
    bodies: _bodyCanvasCache.size,
    ghosts: _ghostCanvasCache.size,
    eyeGlows: _eyeGlowCache.size,
  };
}

/**
 * Layer 2 Rule 22 Hair/Crown Renderer: Last Breath Sans Spectral Crown & Flame Aura
 */
export function _drawLastBreathSansHair(ctx, r, facingLeft = false, customOverride = null) {
  const hairImg = _getLastBreathSansHairImage();
  if (!hairImg || !hairImg.complete || hairImg.naturalWidth <= 0) return;

  const custom = customOverride || state.skinCustomizations?.last_breath_sans;
  const wMult = custom?.widthScale ?? 1.00;
  const hMult = custom?.heightScale ?? 1.00;
  const offX = custom?.offsetX ?? 0;
  const offY = custom?.offsetY ?? 0;
  const angOff = custom?.angleOffset ?? 0;
  const flipX = Boolean(custom?.flipX);
  const flipY = Boolean(custom?.flipY);

  const drawW = r * 2.88 * wMult;
  const drawH = r * 1.34 * hMult;
  const drawX = -drawW * 0.5 + offX;
  const drawY = -r * 1.24 + offY;

  ctx.save();
  if (angOff !== 0) ctx.rotate(angOff);
  if (flipX) ctx.scale(-1, 1);
  if (flipY) ctx.scale(1, -1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(hairImg, drawX, drawY, drawW, drawH);
  ctx.restore();
}

/**
 * Renders Last Breath Sans's upright character skin in world space (Rule 32 & Rule 35).
 */
export function drawLastBreathSansSkin(ctx, fighter) {
  if (!fighter) return;
  const r = fighter.r || fighter.radius || 25;
  const angle = fighter._isWinnerReveal ? 0 : (fighter.gunAngle || fighter.angle || 0);
  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  const facingLeft = Math.abs(normAngle) > Math.PI / 2;

  const phase = fighter._isStudioDummy
    ? (fighter.studioPhase || 3)
    : Math.max(1, Math.min(3, fighter.lastBreathPhase || 1));

  const timeMs = (typeof performance !== 'undefined') ? performance.now() : Date.now();
  const flickerTick = Math.floor(timeMs / 95);
  const eyeActive = Boolean(
    fighter._isStudioDummy ||
    phase >= 2 ||
    fighter.isEnigmaticFinaleActive ||
    (fighter.skillCastHandsTimer && fighter.skillCastHandsTimer > 0) ||
    (fighter.stamina !== undefined && fighter.stamina < 65)
  );

  ctx.save();
  ctx.translate(fighter.x || 0, (fighter.y || 0) - (fighter.z || 0));

  ctx.save();
  ctx.rotate(angle);
  if (facingLeft) {
    ctx.scale(1, -1);
  }

  // Layer 1: Pre-baked phase body circle (zero live-frame loops)
  drawLastBreathSansPixelBody(ctx, r, { phase, eyeActive });

  // Layer 1.2: Subtle animated glowing eye lens (filtered out in silhouette pass per Rule 32)
  if (!fighter._isSilhouettePass && eyeActive) {
    const isCyanBeat = (phase === 2) || (flickerTick % 2 === 0);
    const glowCanvas = isCyanBeat
      ? _getPrebakedEyeGlow('cyan', 'rgba(255,255,255,0.95)', 'rgba(0,229,255,0.85)', 'rgba(239,68,68,0.35)')
      : _getPrebakedEyeGlow('amber', 'rgba(255,255,255,0.95)', 'rgba(255,149,0,0.85)', 'rgba(239,68,68,0.40)');
    if (glowCanvas) {
      const gSize = r * (phase >= 3 ? 0.72 : 0.56);
      ctx.save();
      ctx.globalAlpha = phase >= 3 ? 0.85 : 0.70;
      ctx.drawImage(glowCanvas, -r * 0.28 - gSize * 0.5, -r * 0.13 - gSize * 0.5, gSize, gSize);
      if (phase >= 3) {
        ctx.globalAlpha = 0.72;
        ctx.drawImage(glowCanvas, r * 0.28 - gSize * 0.5, -r * 0.13 - gSize * 0.5, gSize, gSize);
      }
      ctx.restore();
    }
  }

  // Layer 1.5: Mandatory Universal Character Black Outline Standard (Rule 32)
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();
  ctx.restore();

  // Layer 2: Floating Last Breath Spectral Crown (Rule 22)
  _drawLastBreathSansHair(ctx, r, facingLeft);

  ctx.restore();
  ctx.restore();
}

/**
 * Renders ghostly chromatic afterimage silhouette when Last Breath Sans Shadow-Steps or dashes.
 */
export function drawLastBreathSansGhostSkin(ctx, fighter, x, y, angle = 0, alpha = 0.45, phase = 1) {
  const r = fighter ? (fighter.r || fighter.radius || 25) : 25;
  const intR = Math.max(8, Math.round(r));

  if (typeof document === 'undefined') return;
  const ghostCanvas = _getOrBakeGhostCanvas(intR, phase);
  if (!ghostCanvas) return;

  const size = ghostCanvas.width;
  const facingLeft = Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) > Math.PI / 2;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (facingLeft) ctx.scale(1, -1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ghostCanvas, -size / 2, -size / 2);
  ctx.restore();
}
