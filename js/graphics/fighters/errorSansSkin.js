// ───────────────────────────────────────────────────────────────────────────
// ERROR SANS Fighter Skin & Body Model
// Redesigned to mirror Sans's canonical 5-zone skeletal silhouette (`sansSkin.js`)
// with Error Sans's exact palette & reference styling:
// - Model Outer Outline : Bright Red (#EE0000)
// - Skin / Skull & Hands: Pure Black (#000000)
// - Eye Sockets         : Red (#EE0000) with White/Yellow-Blue Glitch Pupils
// - Clothes             : Pure Black Jacket & Shorts with Crisp White Outline (#FFFFFF),
//                         Cyan Scarf/Collar (#38BDF8), & Red Inner Shirt (#DC2626)
// Adheres strictly to:
// - Rule 11: Zero ctx.shadowBlur
// - Rule 19: Upright Front POV
// - Rule 20: Canonical Symmetrical Lower-Flank Hands (±r*0.82, +r*0.38)
// - Rule 32: World-Space Skin Drawing & Clean 2.0px Outer Outline
// - Rule 35: 100% Pre-Baked Offscreen Canvas Quads & Pre-Baked Radial Glows
// ───────────────────────────────────────────────────────────────────────────

import { getHandSize } from '../../core/config.js';
import { state } from '../../core/state.js';
import { drawPixelHand } from '../renderers/fighterRenderer.js';

let _errorSansHairImage = null;
let _errorSansHairImageLoading = false;

export function _getErrorSansHairImage() {
  if (_errorSansHairImage && _errorSansHairImage.complete && _errorSansHairImage.naturalWidth > 0) {
    return _errorSansHairImage;
  }
  if (!_errorSansHairImageLoading && typeof Image !== 'undefined') {
    _errorSansHairImageLoading = true;
    const img = new Image();
    img.onload = () => {
      _errorSansHairImage = img;
      _errorSansHairImageLoading = false;
    };
    img.onerror = () => {
      _errorSansHairImageLoading = false;
    };
    img.src = 'Assets/model/error_sans/ErrorSans-hair.png?v=1';
    _errorSansHairImage = img;
  }
  return _errorSansHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getErrorSansHairImage();
}

// ── Offscreen Discrete Rasterization Caches (Rule 35) ──
let _cachedErrorBodyCanvas = null;
let _cachedErrorBodyR = 0;
let _cachedErrorEyeMode = false;

let _cachedErrorGhostCanvas = null;
let _cachedErrorGhostR = 0;

let _cachedRedEyeGlowCanvas = null;

function _getPrebakedRedEyeGlow() {
  if (typeof document === 'undefined') return null;
  if (_cachedRedEyeGlowCanvas) return _cachedRedEyeGlowCanvas;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const gctx = c.getContext('2d');
  if (gctx) {
    const grad = gctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.28, 'rgba(238, 0, 0, 0.88)');
    grad.addColorStop(0.68, 'rgba(255, 235, 0, 0.42)');
    grad.addColorStop(1.0, 'rgba(238, 0, 0, 0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 64, 64);
  }
  _cachedRedEyeGlowCanvas = c;
  return c;
}

/**
 * Renders Error Sans's discrete pixel art body using Sans's exact 5-zone skull/hoodie/shorts
 * geometry, recolored with Pure Black skin, Red eyes, Red outer outline, and White clothes outline.
 */
function _renderErrorBodyToCanvas(destCtx, r, eyeActive = false) {
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

      // Outer boundary ring: Bright RED model outline (#EE0000)
      const isBorder = (
        dist >= r - P * 1.05 ||
        Math.hypot((gx + 1) * P, gy * P) > r ||
        Math.hypot((gx - 1) * P, gy * P) > r ||
        Math.hypot(gx * P, (gy + 1) * P) > r ||
        Math.hypot(gx * P, (gy - 1) * P) > r
      );
      if (isBorder) {
        destCtx.fillStyle = '#EE0000';
        destCtx.fillRect(px, py, P, P);
        continue;
      }

      // 1-step inward contour check used to hug clothes with a crisp WHITE outline (#FFFFFF)
      const isInnerClothEdge = (
        dist >= r - P * 2.05 ||
        Math.hypot((gx + 2) * P, gy * P) > r ||
        Math.hypot((gx - 2) * P, gy * P) > r ||
        Math.hypot(gx * P, (gy + 2) * P) > r ||
        Math.hypot(gx * P, (gy - 2) * P) > r ||
        Math.hypot((gx + 1) * P, (gy + 1) * P) > r ||
        Math.hypot((gx - 1) * P, (gy + 1) * P) > r ||
        Math.hypot((gx + 1) * P, (gy - 1) * P) > r ||
        Math.hypot((gx - 1) * P, (gy - 1) * P) > r
      );

      // ──────────────────────────────────────────────────
      // 1. PURE BLACK SKULL, RED EYES & GRIN (ry < +r * 0.17)
      // ──────────────────────────────────────────────────
      if (ry < r * 0.17) {
        const eyeY = -r * 0.22;
        const leftEyeX = -r * 0.28;
        const rightEyeX = r * 0.28;
        const eyeRadius = r * 0.16;

        const distLeftEye = Math.hypot(rx - leftEyeX, ry - eyeY);
        const distRightEye = Math.hypot(rx - rightEyeX, ry - eyeY);

        const isLeftSocket = distLeftEye <= eyeRadius;
        const isRightSocket = distRightEye <= eyeRadius;

        // Nasal cavity (Red inverted triangle on Pure Black skull)
        const isNasalCavity = (
          ry >= -r * 0.10 &&
          ry <= -r * 0.02 &&
          Math.abs(rx) <= (-0.02 - (ry - (-r * 0.10))) * 0.5 * r + P * 0.85
        );

        // Smile / Teeth grill (Red outline & separators, golden-yellow teeth)
        const isSmileZone = (ry >= r * 0.01 && ry <= r * 0.14 && Math.abs(rx) <= r * 0.44);

        // Iconic blue ERROR tear streaks streaming beneath both eye sockets
        const isLeftTear = (
          ry >= eyeY + eyeRadius * 0.65 &&
          ry < r * 0.16 &&
          (Math.abs(rx - (leftEyeX - P * 0.9)) <= P * 0.55 || Math.abs(rx - (leftEyeX + P * 0.9)) <= P * 0.55)
        );
        const isRightTear = (
          ry >= eyeY + eyeRadius * 0.65 &&
          ry < r * 0.16 &&
          (Math.abs(rx - (rightEyeX - P * 0.9)) <= P * 0.55 || Math.abs(rx - (rightEyeX + P * 0.9)) <= P * 0.55)
        );

        if (isLeftSocket) {
          if (eyeActive) {
            if (distLeftEye <= eyeRadius * 0.48) {
              destCtx.fillStyle = '#FFFFFF';
            } else if (distLeftEye <= eyeRadius * 0.78) {
              destCtx.fillStyle = '#FFEB00';
            } else {
              destCtx.fillStyle = '#EE0000';
            }
          } else {
            // Red eye socket with white dot pupil
            const isPupil = distLeftEye <= P * 0.75;
            destCtx.fillStyle = isPupil ? '#FFFFFF' : '#EE0000';
          }
          destCtx.fillRect(px, py, P, P);
        } else if (isRightSocket) {
          // Red eye socket with signature yellow-ringed blue glitch pupil
          if (distRightEye <= P * 0.55) {
            destCtx.fillStyle = '#1D4ED8';
          } else if (distRightEye <= P * 1.05) {
            destCtx.fillStyle = '#FFEB00';
          } else {
            destCtx.fillStyle = '#EE0000';
          }
          destCtx.fillRect(px, py, P, P);
        } else if (isNasalCavity) {
          destCtx.fillStyle = '#EE0000';
          destCtx.fillRect(px, py, P, P);
        } else if (isSmileZone) {
          const toothIndex = Math.floor((rx + r * 0.44) / (P * 2.0));
          const isToothDivider = (toothIndex % 2 === 1) && (ry >= r * 0.04 && ry <= r * 0.11);
          const isSmileOutline = (ry >= r * 0.12 || ry <= r * 0.025 || Math.abs(rx) >= r * 0.40);
          destCtx.fillStyle = (isToothDivider || isSmileOutline) ? '#EE0000' : '#FDE047';
          destCtx.fillRect(px, py, P, P);
        } else if (isLeftTear || isRightTear) {
          destCtx.fillStyle = '#38BDF8';
          destCtx.fillRect(px, py, P, P);
        } else {
          // PURE BLACK SKULL SKIN
          destCtx.fillStyle = '#000000';
          destCtx.fillRect(px, py, P, P);
        }
      }
      // ──────────────────────────────────────────────────
      // 2. CYAN HOOD COLLAR WITH WHITE CLOTH OUTLINE (ry >= +r * 0.17 && ry < +r * 0.31)
      // ──────────────────────────────────────────────────
      else if (ry < r * 0.31) {
        const absX = Math.abs(rx);
        let collarCol = '#38BDF8';
        if (isInnerClothEdge || ry >= r * 0.275) {
          collarCol = '#FFFFFF'; // Crisp white outline hugging clothing perimeter & lower collar seam
        } else if (absX <= r * 0.19) {
          collarCol = '#DC2626'; // Center red undershirt V-top
        } else if (absX <= r * 0.27) {
          collarCol = '#FFFFFF'; // White collar inner lapel framing red shirt
        } else if (ry < r * 0.21 && absX < r * 0.56) {
          collarCol = '#7DD3FC'; // Upper cyan hood fluff highlight
        }
        destCtx.fillStyle = collarCol;
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────────────
      // 3. BLACK HOODIE JACKET + WHITE OUTLINE + RED SHIRT (ry >= +r * 0.31 && ry < +r * 0.65)
      // ──────────────────────────────────────────────────
      else if (ry < r * 0.65) {
        const absX = Math.abs(rx);
        const shirtHalfW = r * 0.20 - (ry - r * 0.31) * 0.04;
        const isRedShirt = absX <= Math.max(P * 1.4, shirtHalfW);
        const isLapelWhite = !isRedShirt && absX <= Math.max(P * 1.4, shirtHalfW) + P * 1.35;
        const isLowerHemWhite = ry >= r * 0.605;
        const isPocketYellow = (
          !isInnerClothEdge &&
          absX >= r * 0.54 && absX <= r * 0.64 &&
          ry >= r * 0.50 && ry < r * 0.605
        );

        if (isRedShirt && !isLowerHemWhite) {
          destCtx.fillStyle = ry > r * 0.50 ? '#B91C1C' : '#DC2626';
        } else if (isInnerClothEdge || isLapelWhite || isLowerHemWhite) {
          destCtx.fillStyle = '#FFFFFF'; // Crisp white clothing outline on lapels, edges & hem
        } else if (isPocketYellow) {
          destCtx.fillStyle = '#FACC15'; // Iconic Error Sans yellow pocket trim
        } else {
          destCtx.fillStyle = '#000000'; // Pure black hoodie body
        }
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────────────
      // 4. BLACK GYM SHORTS + WHITE OUTLINE + CYAN STRIPES (ry >= +r * 0.65 && ry < +r * 0.89)
      // ──────────────────────────────────────────────────
      else if (ry < r * 0.89) {
        const absX = Math.abs(rx);
        const isStripe = (absX >= r * 0.42 && absX <= r * 0.55);
        const isCenterDividerWhite = absX < r * 0.08;
        const isHemWhite = ry >= r * 0.845;

        if (isInnerClothEdge || isCenterDividerWhite || isHemWhite) {
          destCtx.fillStyle = '#FFFFFF'; // White outline along shorts perimeter, hem & inseam
        } else if (isStripe) {
          destCtx.fillStyle = '#38BDF8'; // Light blue vertical shorts stripe
        } else {
          destCtx.fillStyle = '#000000';
        }
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────────────
      // 5. RED SLIPPERS WITH WHITE TRIM (ry >= +r * 0.90)
      // ──────────────────────────────────────────────────
      else {
        const absX = Math.abs(rx);
        if (absX < r * 0.12) {
          destCtx.fillStyle = '#000000';
        } else if (isInnerClothEdge || ry < r * 0.93 || absX < r * 0.20) {
          destCtx.fillStyle = '#FFFFFF';
        } else {
          destCtx.fillStyle = ry > r * 0.96 ? '#991B1B' : '#DC2626';
        }
        destCtx.fillRect(px, py, P, P);
      }
    }
  }
  destCtx.restore();
}

function _drawSlicedGlitchQuad(ctx, canvas, glitchIntensity = 0, seed = 0) {
  const w = canvas.width;
  const h = canvas.height;
  if (glitchIntensity <= 0.02) {
    ctx.drawImage(canvas, -w / 2, -h / 2);
    return;
  }

  const slices = 4;
  const sliceH = h / slices;
  const maxShift = glitchIntensity * 7.5;
  for (let s = 0; s < slices; s++) {
    const sy = Math.floor(s * sliceH);
    const sh = (s === slices - 1) ? (h - sy) : Math.ceil(sliceH);
    const wave = Math.sin(seed * 1.9 + s * 2.7);
    const shiftX = Math.round(wave * maxShift);
    ctx.drawImage(canvas, 0, sy, w, sh, -w / 2 + shiftX, -h / 2 + sy, w, sh);
  }
}

export function drawErrorSansPixelBody(ctx, r, options = {}) {
  if (typeof document === 'undefined') return;
  const intR = Math.max(10, Math.round(r));
  const eyeActive = Boolean(options.eyeActive);

  if (!_cachedErrorBodyCanvas || _cachedErrorBodyR !== intR || _cachedErrorEyeMode !== eyeActive) {
    _cachedErrorBodyR = intR;
    _cachedErrorEyeMode = eyeActive;
    const P = 2.0;
    const steps = Math.ceil((intR + P) / P);
    const size = (steps * 2 + 1) * P;
    if (!_cachedErrorBodyCanvas) _cachedErrorBodyCanvas = document.createElement('canvas');
    _cachedErrorBodyCanvas.width = size;
    _cachedErrorBodyCanvas.height = size;
    const offCtx = _cachedErrorBodyCanvas.getContext('2d');
    if (offCtx) _renderErrorBodyToCanvas(offCtx, intR, eyeActive);
  }
  if (_cachedErrorBodyCanvas) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    _drawSlicedGlitchQuad(ctx, _cachedErrorBodyCanvas, options.glitchIntensity || 0, options.glitchSeed || 0);
    ctx.restore();
  }
}

/**
 * Crimson Glitch Flame Eye flare (Rule 11 & Rule 35 compliant: pre-baked glow + flame needles).
 */
function _drawErrorCrimsonFlameEye(ctx, r, now = Date.now()) {
  ctx.save();
  const eyeX = -r * 0.28;
  const eyeY = -r * 0.20;
  const flameTimer = (now * 0.014) % (Math.PI * 2);

  const glowCanvas = _getPrebakedRedEyeGlow();
  const glowDiameter = r * 1.15 + Math.sin(flameTimer * 2.5) * 3;
  if (glowCanvas) {
    ctx.drawImage(glowCanvas, eyeX - glowDiameter * 0.5, eyeY - glowDiameter * 0.5, glowDiameter, glowDiameter);
  }

  const strobePhase = Math.sin(now * 0.028);
  ctx.fillStyle = strobePhase > 0.2 ? '#FFEB00' : '#EE0000';
  for (let i = 0; i < 4; i++) {
    const flameH = r * (0.58 + i * 0.20) + Math.sin(flameTimer * 1.7 + i * 1.3) * (r * 0.16);
    const flameW = r * (0.12 - i * 0.016);
    const sway = Math.sin(flameTimer * 1.9 + i * 1.1) * (r * 0.20);
    ctx.beginPath();
    ctx.moveTo(eyeX - flameW, eyeY);
    ctx.quadraticCurveTo(eyeX + sway * 0.5 - flameW * 0.4, eyeY - flameH * 0.55, eyeX + sway, eyeY - flameH);
    ctx.quadraticCurveTo(eyeX + sway * 0.5 + flameW * 0.4, eyeY - flameH * 0.55, eyeX + flameW, eyeY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Kept exported for Skin Studio isolation previews & backward compatibility.
 */
export function _drawErrorSansHair(ctx, r, facingLeft = false) {
  const hairImg = _getErrorSansHairImage();
  if (!hairImg || !hairImg.complete || hairImg.naturalWidth <= 0) return;

  const custom = state.skinCustomizations?.error_sans;
  const wScale = custom?.widthScale ?? 1.0;
  const hScale = custom?.heightScale ?? 1.0;
  const offX = custom?.offsetX ?? 0;
  const offY = custom?.offsetY ?? 0;
  const rotOffset = custom?.angleOffset ?? 0;

  const drawW = r * 2.86 * wScale;
  const drawH = r * 1.32 * hScale;
  const drawX = -drawW * 0.5 + offX;
  const drawY = -r * 1.24 + offY;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (rotOffset) ctx.rotate(rotOffset);
  if (custom?.flipX) ctx.scale(-1, 1);
  if (custom?.flipY) ctx.scale(1, -1);
  ctx.drawImage(hairImg, drawX, drawY, drawW, drawH);
  ctx.restore();
}

function _computeErrorGlitchState(fighter, now) {
  if (!fighter || fighter._isWinnerReveal || fighter._isSilhouettePass) {
    return { glitchIntensity: 0, twitchX: 0, twitchY: 0, twitchRot: 0, seed: 0 };
  }
  const tick = (fighter._vfxTick || 0) + Math.floor(now * 0.06);
  const speedMag = Math.hypot(fighter.vx || 0, fighter.vy || 0);
  const dodgeFrames = fighter.dodgeStallTimer || 0;
  const isDodging = dodgeFrames > 0;
  const isMoving = speedMag > 0.35;
  if (!isDodging && !isMoving) {
    return { glitchIntensity: 0, twitchX: 0, twitchY: 0, twitchRot: 0, seed: tick };
  }

  // Sharp jagged pulse frames interspersed between subtle jitter frames for authentic ERROR twitching
  const burstWindow = isDodging ? 1.0 : ((tick % 7 < 3 || speedMag > 4.2) ? 0.82 : 0.32);
  const glitchIntensity = isDodging ? 1.0 : burstWindow;
  const amp = isDodging ? 6.0 : (burstWindow > 0.5 ? 3.2 : 1.3);
  const twitchX = Math.round(Math.sin(tick * 2.31) * amp);
  const twitchY = Math.round(Math.cos(tick * 3.17) * (amp * 0.72));
  const twitchRot = Math.sin(tick * 2.89) * (isDodging ? 0.14 : (burstWindow > 0.5 ? 0.07 : 0.025));
  return { glitchIntensity, twitchX, twitchY, twitchRot, seed: tick };
}

function _drawGlitchTearOverlay(ctx, r, glitchIntensity, seed) {
  if (glitchIntensity <= 0.15) return;
  const bars = glitchIntensity > 0.8 ? 5 : 3;
  const colors = ['#00A0FF', '#EE0000', '#FFEB00', '#FFFFFF'];
  ctx.save();
  for (let i = 0; i < bars; i++) {
    const hHash = Math.sin(seed * 1.47 + i * 3.91);
    const vHash = Math.cos(seed * 2.13 + i * 1.73);
    const bw = 6 + Math.abs(hHash) * (r * (glitchIntensity > 0.8 ? 0.95 : 0.60));
    const bh = (i % 2 === 0) ? 2 : 3;
    const bx = hHash * r * 0.85 - bw * 0.5;
    const by = vHash * r * 0.82;
    ctx.fillStyle = colors[(seed + i) % colors.length];
    ctx.globalAlpha = glitchIntensity > 0.8 ? 0.88 : 0.68;
    ctx.fillRect(Math.round(bx), Math.round(by), Math.round(bw), bh);
  }
  ctx.restore();
}

export function drawErrorSansSkin(ctx, fighter) {
  if (!fighter) return;
  const r = fighter.r || 25;
  const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
  const isPodiumPreview = Boolean(fighter._isWinnerReveal);
  const angle = isPodiumPreview ? 0 : (fighter.gunAngle || 0);
  const gState = _computeErrorGlitchState(fighter, now);

  ctx.save();
  // Rule 32: Canonical World-Space Coordinate Translation Contract + ERROR Twitch Offset
  ctx.translate((fighter.x || 0) + gState.twitchX, (fighter.y || 0) - (fighter.z || 0) + gState.twitchY);
  ctx.rotate(angle + gState.twitchRot);
  const facingLeft = Math.abs(angle) > Math.PI / 2;
  if (facingLeft) {
    ctx.scale(1, -1);
  }

  const isEyeActive = Boolean(
    fighter.isForcedCrashActive ||
    fighter.glitchCastHandsTimer > 0 ||
    (fighter.dodgeStallTimer || 0) > 0 ||
    (fighter.activeErrorBlasters && fighter.activeErrorBlasters.length > 0) ||
    (fighter.activeErrorStrings && fighter.activeErrorStrings.length > 0)
  );

  // Layer 1: Pre-baked 1:1 Sans-Layout Pixel Body (sliced horizontal scanline glitches on move/dodge)
  drawErrorSansPixelBody(ctx, r, {
    eyeActive: isEyeActive,
    glitchIntensity: gState.glitchIntensity,
    glitchSeed: gState.seed,
  });

  // Layer 1.5: Red Model Outer Outline (#EE0000) + chromatic glitch echo ring when twitching/dodging
  ctx.save();
  if (gState.glitchIntensity > 0.4 && !fighter._isSilhouettePass) {
    ctx.beginPath();
    ctx.arc(gState.twitchX * 0.65, -gState.twitchY * 0.5, r, 0, Math.PI * 2);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = (gState.seed % 2 === 0) ? '#00A0FF' : '#FFEB00';
    ctx.globalAlpha = gState.glitchIntensity > 0.8 ? 0.72 : 0.45;
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = '#EE0000';
  ctx.stroke();
  ctx.restore();

  // Layer 2: Active Crimson Glitch Flame Eye during skills/blasters/dodge
  if (isEyeActive && !isPodiumPreview && !fighter._isSilhouettePass) {
    _drawErrorCrimsonFlameEye(ctx, r, now);
  }

  // Layer 3: Canonical Symmetrical Hands matching Sans (Pure Black fill + Red outline)
  const stringWeaponHandsActive = Boolean(
    fighter.glitchCastHandsTimer > 0 ||
    fighter.isForcedCrashActive ||
    (fighter.activeErrorStrings && fighter.activeErrorStrings.length > 0)
  );
  const hideHands = isPodiumPreview || (typeof state !== 'undefined' && state.showSkinOnly) || fighter.hideHands || stringWeaponHandsActive;
  if (!hideHands) {
    const handRadius = getHandSize(r * 0.30, fighter);
    const handJit = gState.glitchIntensity > 0.3 ? Math.round(Math.sin(gState.seed * 3.1) * (gState.glitchIntensity * 2.5)) : 0;
    drawPixelHand(ctx, -r * 0.82 + handJit, r * 0.38 - handJit, handRadius, '#000000', '#EE0000', 1.6);
    drawPixelHand(ctx, r * 0.82 - handJit, r * 0.38 + handJit, handRadius, '#000000', '#EE0000', 1.6);
  }

  // Layer 4: Dynamic ERROR glitch tear scanbars when moving / dodging + idle artifact specks
  if (!fighter._isSilhouettePass && !isPodiumPreview) {
    _drawGlitchTearOverlay(ctx, r, gState.glitchIntensity, gState.seed);
    const t = (fighter._vfxTick || 0);
    if ((t % 12) < 9) {
      const jitX = Math.sin(t * 0.7) * 2.0;
      const jitY = Math.cos(t * 0.9) * 1.6;
      ctx.save();
      ctx.fillStyle = '#00A0FF';
      ctx.fillRect(-r * 0.92 + jitX, -r * 0.48 + jitY, 6, 2);
      ctx.fillStyle = '#EE0000';
      ctx.fillRect(r * 0.62 - jitX, -r * 0.18 - jitY, 6, 2);
      ctx.fillStyle = '#FFEB00';
      ctx.fillRect(r * 0.38 + jitY, r * 0.46 + jitX, 4, 2);
      ctx.restore();
    }
  }

  if (typeof fighter.drawStatusOverlays === 'function' && !fighter._isSilhouettePass) {
    fighter.drawStatusOverlays(ctx, r);
  }

  ctx.restore();
}

export function drawErrorSansGhostSkin(ctx, fighter, x, y, angle = 0, alpha = 0.45, tintIndex = 0) {
  if (!fighter) return;
  const r = fighter.r || 25;
  const intR = Math.max(10, Math.round(r));

  if (typeof document !== 'undefined' && (!_cachedErrorGhostCanvas || _cachedErrorGhostR !== intR)) {
    _cachedErrorGhostR = intR;
    const P = 2.0;
    const steps = Math.ceil((intR + P) / P);
    const size = (steps * 2 + 1) * P;
    _cachedErrorGhostCanvas = document.createElement('canvas');
    _cachedErrorGhostCanvas.width = size;
    _cachedErrorGhostCanvas.height = size;
    const gctx = _cachedErrorGhostCanvas.getContext('2d');
    if (gctx) {
      _renderErrorBodyToCanvas(gctx, intR, false);
    }
  }

  const tints = ['#EE0000', '#00A0FF', '#FFEB00'];
  const ghostCol = tints[tintIndex % tints.length];

  ctx.save();
  ctx.globalAlpha = Math.max(0.05, Math.min(0.85, alpha));
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (Math.abs(angle) > Math.PI / 2) ctx.scale(1, -1);

  if (_cachedErrorGhostCanvas) {
    ctx.imageSmoothingEnabled = false;
    _drawSlicedGlitchQuad(ctx, _cachedErrorGhostCanvas, 0.72, Math.floor(x + y) + tintIndex * 7);
  }
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = ghostCol;
  ctx.globalAlpha *= 0.28;
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.globalAlpha = Math.min(0.9, alpha * 1.15);
  ctx.strokeStyle = ghostCol;
  ctx.stroke();

  ctx.restore();
}
