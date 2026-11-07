// ─────────────────────────────────────────────
// SON GOKU FIGHTER SKIN & BODY MODEL
// Dragon Ball Series
// Canonical Toji Baseline Standard (Rule 24 Compliant):
// 1. Zone 1: Faceless Pure Face & Cheeks Dome (ry < r * 0.28)
// 2. Zone 2: Turtle School Dogi with Chest Kanji Crest (r * 0.28 <= ry < r * 0.64)
// 3. Zone 3: Indigo Martial Cloth Sash & Ribbon Knot (r * 0.64 <= ry < r * 0.78)
// 4. Zone 4: Baggy Dogi Trousers & Navy Boot Wraps (ry >= r * 0.78)
// 5. Layer 2: Dedicated Saiyan Hair Silhouette (Assets/model/goku/Goku-hair.png)
// 6. Layer 1.5: Universal 2.0px Black Ink Outline (Rule 32 Compliant)
// ─────────────────────────────────────────────

import { state } from '../../core/state.js';
import { drawPixelHand } from '../renderers/fighterRenderer.js';
import { getFilteredSpriteCanvas } from '../graphicsCache.js';

let _gokuHairImage = null;
let _gokuHairImageLoading = false;

export function _getGokuHairImage() {
  if (_gokuHairImage && _gokuHairImage.complete && _gokuHairImage.naturalWidth > 0) {
    return _gokuHairImage;
  }
  if (!_gokuHairImageLoading && typeof Image !== 'undefined') {
    _gokuHairImageLoading = true;
    const img = new Image();
    img.onload = () => {
      _gokuHairImage = img;
      _gokuHairImageLoading = false;
    };
    img.onerror = () => {
      _gokuHairImageLoading = false;
    };
    img.src = 'Assets/model/goku/Goku-hair.png';
    _gokuHairImage = img;
  }
  return _gokuHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getGokuHairImage();
}

/**
 * Draws Goku's iconic Saiyan hair silhouette from Assets/model/goku/Goku-hair.png.
 */
export function _drawGokuHair(ctx, r, facingLeft = false, isSuperSaiyan = false) {
  const hairImg = _getGokuHairImage();
  const custom = (typeof state !== 'undefined' && state.skinCustomizations?.goku) || {};
  const wMult = custom.widthScale ?? 1.0;
  const hMult = custom.heightScale ?? 1.0;
  const offX = custom.offsetX ?? 0;
  const offY = custom.offsetY ?? 0;
  const rot = custom.angleOffset ?? 0;
  const flipX = custom.flipX ? -1 : 1;
  const flipY = custom.flipY ? -1 : 1;

  const targetHairWidth = r * 2.90 * wMult;
  const targetHairHeight = r * 2.25 * hMult;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const drawX = -targetHairWidth / 2 + offX;
  const drawY = -r * 1.35 + offY;

  if (rot !== 0 || flipX !== 1 || flipY !== 1) {
    ctx.translate(drawX + targetHairWidth / 2, drawY + targetHairHeight / 2);
    if (rot !== 0) ctx.rotate(rot);
    if (flipX !== 1 || flipY !== 1) ctx.scale(flipX, flipY);
    if (hairImg && hairImg.complete && hairImg.naturalWidth > 0) {
      const srcImg = isSuperSaiyan
        ? getFilteredSpriteCanvas(hairImg, 'sepia(1) saturate(5) hue-rotate(5deg) brightness(1.2)')
        : hairImg;
      ctx.drawImage(srcImg, -targetHairWidth / 2, -targetHairHeight / 2, targetHairWidth, targetHairHeight);
    }
  } else {
    if (hairImg && hairImg.complete && hairImg.naturalWidth > 0) {
      const srcImg = isSuperSaiyan
        ? getFilteredSpriteCanvas(hairImg, 'sepia(1) saturate(5) hue-rotate(5deg) brightness(1.2)')
        : hairImg;
      ctx.drawImage(srcImg, drawX, drawY, targetHairWidth, targetHairHeight);
    }
  }

  ctx.restore();
}

/**
 * Draws Goku's canonical pixel fists with indigo wristbands.
 */
export function drawGokuFist(ctx, x, y, radius, skinColor = '#FFE0BD') {
  ctx.save();
  ctx.translate(x, y);
  drawPixelHand(ctx, 0, 0, radius, skinColor);
  ctx.restore();
}

let _cachedGokuBodyCanvas = null;
let _cachedGokuBodyR = 0;

/**
 * Procedural Pixel Art Render Function (Renders once to offscreen cache).
 * Adheres strictly to the Toji Proportional Baseline (Rule 24).
 */
function _renderGokuPixelBodyToCanvas(destCtx, r) {
  destCtx.save();
  destCtx.imageSmoothingEnabled = false;
  destCtx.translate(destCtx.canvas.width / 2, destCtx.canvas.height / 2);
  const P = 2.0;
  const steps = Math.ceil((r + P) / P);

  // 100% 4-Way Symmetrical Circular Pixel Body Fill & Outer Ink Border
  for (let gy = -steps; gy <= steps; gy++) {
    for (let gx = -steps; gx <= steps; gx++) {
      const rx = gx * P;
      const ry = gy * P;
      const dist = Math.hypot(rx, ry);
      if (dist > r) continue;

      const px = rx - P / 2;
      const py = ry - P / 2;

      // 4-neighbor boundary test for clean 1-pixel outer manga ink outline
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

      // ──────────────────────────────────────────
      // ZONE 1: Face Dome (ry < r * 0.28)
      // ──────────────────────────────────────────
      if (ry < r * 0.28) {
        let col = '#FFE0BD'; // Clean fair/tan anime skin
        if (Math.abs(rx) > r * 0.72) {
          col = '#F2C49B';   // Subtle side cheek shadow
        }
        destCtx.fillStyle = col;
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────
      // ZONE 2: Turtle School Dogi Torso (r * 0.28 <= ry < r * 0.64)
      // ──────────────────────────────────────────
      else if (ry < r * 0.64) {
        // Deep V-Neck Collar opening revealing indigo undershirt
        const isCenterNeck = Math.abs(rx) < (ry - r * 0.26) * 0.75;
        if (isCenterNeck && ry < r * 0.52) {
          destCtx.fillStyle = '#1A237E'; // Deep navy-indigo undershirt
        } else if (Math.hypot(rx - (-r * 0.38), ry - (r * 0.44)) < r * 0.16) {
          // Circular white martial arts kanji crest backing on chest
          destCtx.fillStyle = '#FFFFFF';
        } else if (Math.hypot(rx - (-r * 0.38), ry - (r * 0.44)) < r * 0.08) {
          // Kanji calligraphy mark
          destCtx.fillStyle = '#0E0F14';
        } else if (ry > r * 0.58) {
          destCtx.fillStyle = '#D84315'; // Deep fold shadow on gi
        } else {
          destCtx.fillStyle = '#FF6B00'; // Vibrant Turtle School Orange Dogi
        }
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────
      // ZONE 3: Indigo Martial Sash & Knot (r * 0.64 <= ry < r * 0.78)
      // ──────────────────────────────────────────
      else if (ry < r * 0.78) {
        if (Math.abs(rx) <= r * 0.16 && ry >= r * 0.68) {
          destCtx.fillStyle = '#0D47A1'; // Center hanging sash knot ribbon
        } else if (Math.abs(rx) <= P * 0.6) {
          destCtx.fillStyle = '#0E0F14'; // Center ribbon fold seam
        } else {
          destCtx.fillStyle = '#1A237E'; // Deep indigo-blue cloth sash
        }
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────
      // ZONE 4: Baggy Orange Trousers (ry >= r * 0.78)
      // ──────────────────────────────────────────
      else {
        if (Math.abs(rx) <= P * 0.6) {
          destCtx.fillStyle = '#0E0F14'; // Center fly seam
        } else if (ry > r * 0.90 && Math.abs(rx) > r * 0.55) {
          destCtx.fillStyle = '#1A237E'; // Navy boot top wrap
        } else if (ry < r * 0.84) {
          destCtx.fillStyle = '#FF8F00'; // Upper trouser highlight
        } else {
          destCtx.fillStyle = '#E65100'; // Lower baggy trouser crease
        }
        destCtx.fillRect(px, py, P, P);
      }
    }
  }

  destCtx.restore();
}

/**
 * Draws Goku's procedural pixel body with offscreen buffer caching.
 */
export function drawGokuPixelBody(ctx, r) {
  if (typeof document === 'undefined') {
    _renderGokuPixelBodyToCanvas(ctx, r);
    return;
  }

  const intR = Math.round(r);
  if (!_cachedGokuBodyCanvas || _cachedGokuBodyR !== intR) {
    const P = 2.0;
    const steps = Math.ceil((intR + P) / P);
    const size = (steps * 2 + 1) * P;
    _cachedGokuBodyCanvas = document.createElement('canvas');
    _cachedGokuBodyCanvas.width = size;
    _cachedGokuBodyCanvas.height = size;
    const cctx = _cachedGokuBodyCanvas.getContext('2d');
    _renderGokuPixelBodyToCanvas(cctx, intR);
    _cachedGokuBodyR = intR;
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const size = _cachedGokuBodyCanvas.width;
  ctx.drawImage(_cachedGokuBodyCanvas, -size / 2, -size / 2);
  ctx.restore();
}

/**
 * Main Skin Renderer for Son Goku
 */
export function drawGokuSkin(ctx, fighter) {
  const r = fighter.r || 25;

  ctx.save();
  ctx.translate(fighter.x || 0, (fighter.y || 0) - (fighter.z || 0));

  // 1. Orientation & Mirroring (Rule 19 Upright POV)
  const angle = fighter._isWinnerReveal ? 0 : (fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0));
  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  ctx.rotate(angle);

  const facingLeft = Math.abs(normAngle) > Math.PI / 2;
  if (facingLeft && !fighter.isSpinning) {
    ctx.scale(1, -1);
  }

  const isSuperSaiyan = Boolean(fighter.isSuperSaiyan);

  // 2. Surging Super Saiyan Ki Flame Aura
  if (isSuperSaiyan && !fighter._isSilhouettePass) {
    ctx.save();
    const pulse = 1.0 + Math.sin((fighter.superSaiyanTimer || 0) * 0.25) * 0.08;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.35 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.28)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.15 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 200, 0.35)';
    ctx.fill();
    ctx.restore();
  }

  // 3. Procedural Pixel-Art Body
  drawGokuPixelBody(ctx, r);

  // 4. Hair Asset Overlay (Layer 2)
  _drawGokuHair(ctx, r, facingLeft, isSuperSaiyan);

  // 5. Canonical Floating Hands & Dynamic Punch Extension (Gojo/Sukuna/Yuji Floating Hand Standard)
  const handRadius = r * 0.30;
  const isPodiumPreview = Boolean(fighter._isWinnerReveal);
  const isPunching = !isPodiumPreview && Boolean(fighter.punchAnimTimer && fighter.punchAnimTimer > 0);
  const isChargingKamehameha = Boolean(fighter.isChargingKamehameha);
  const isFiringKamehameha = Boolean(fighter.isFiringKamehameha);
  const isKiBarrage = Boolean(fighter.basicComboPhase === 3);
  const isFinisherSlam = Boolean(fighter.basicComboPhase === 2 && (fighter.meleeModeDurationTimer || 0) <= 0);

  // Canonical Brawler Default Hand Placement (matching Gojo/Sukuna: floating at front perimeter along +X aim axis)
  const baseHandX = r * 0.88;
  const idleBob = (!isPodiumPreview && !isPunching) ? Math.sin(Date.now() * 0.007) * (r * 0.05) : 0;
  let handRX = baseHandX + idleBob;
  let handRY = +r * 0.20;
  let handLX = 0;
  let handLY = 0;
  let hideBackHand = true; // Canonical brawler single front hand stance
  let hideFrontHand = (typeof state !== 'undefined' && state.showSkinOnly) || isPodiumPreview || fighter.hideHands;

  if (isPunching) {
    const maxT = fighter.punchActiveMaxTime || fighter.punchMaxTime || 10;
    const rawProgress = Math.min(1.0, Math.max(0.0, 1.0 - (fighter.punchAnimTimer / maxT)));

    // Asymmetric punch kinematics (Gojo / Brawler Standard)
    let easePunch = 0;
    if (rawProgress < 0.28) {
      easePunch = Math.sin((rawProgress / 0.28) * (Math.PI / 2));
    } else {
      const retractT = (rawProgress - 0.28) / 0.72;
      easePunch = Math.cos(retractT * (Math.PI / 2));
    }

    // Dynamic target proximity extension (matching GojoRenderer proven standard)
    let maxLunge = r * 2.0;
    const target = (fighter.target && !fighter.target.isDead) 
      ? fighter.target 
      : (typeof fighter._findClosestEnemy === 'function' ? fighter._findClosestEnemy() : null);

    if (target && !target.isDead) {
      const targetY = target.y - (target.z || 0);
      const fighterY = fighter.y - (fighter.z || 0);
      const dx = target.x - fighter.x;
      const dy = targetY - fighterY;
      const targetDist = Math.hypot(dx, dy);

      const angleToTarget = Math.atan2(dy, dx);
      let angleDiff = angleToTarget - angle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

      if (Math.abs(angleDiff) < Math.PI * 0.5) {
        const forwardDist = targetDist * Math.cos(angleDiff);
        const targetR = target.r || r;
        const targetNearEdge = forwardDist - targetR;
        const gapToTarget = targetNearEdge - baseHandX;
        const desiredImpactReach = gapToTarget + Math.min(targetR * 0.55, 12);
        const maxBeforeBackExit = (forwardDist + targetR * 0.40) - baseHandX;
        const clampedTargetReach = Math.min(maxBeforeBackExit, desiredImpactReach);
        maxLunge = Math.max(r * 1.15, Math.min(r * 2.3, clampedTargetReach));
      }
    }

    const currentLunge = easePunch * maxLunge;
    const dip = Math.sin(rawProgress * Math.PI) * (r * 0.12) * (fighter.isRightPunch ? 1 : -1);

    if (isFinisherSlam) {
      // Overhead Sledgehammer Finisher Slam: Both hands clasped together floating forward-down
      hideBackHand = false;
      handRX = baseHandX + currentLunge;
      handRY = +r * 0.08 + dip;
      handLX = baseHandX + currentLunge;
      handLY = -r * 0.08 + dip;
    } else if (fighter.isRightPunch) {
      // Right Fist Leading Punch along +X aim vector
      handRX = baseHandX + currentLunge;
      handRY = +r * 0.20 + dip;
      hideBackHand = true;
    } else {
      // Left Fist Leading Punch along +X aim vector
      handLX = baseHandX + currentLunge;
      handLY = -r * 0.20 - dip;
      hideBackHand = true;
    }
  } else if (isKiBarrage) {
    // Phase 3: Ki Blast Barrage (Renzoku Ki Dān) — Dual floating palms thrust forward with vibration
    hideBackHand = false;
    const kiVibe = Math.sin((fighter.kiBarrageTimer || 0) * 1.8) * 3.0;
    handRX = r * 1.15 + kiVibe;
    handRY = +r * 0.24;
    handLX = r * 1.15 - kiVibe;
    handLY = -r * 0.24;
  } else if (isChargingKamehameha) {
    // Cupped hands at right hip channeling blue Ki
    hideBackHand = false;
    handRX = -r * 0.35;
    handRY = +r * 0.35;
    handLX = -r * 0.45;
    handLY = +r * 0.25;
  } else if (isFiringKamehameha) {
    // Both palms locked forward unleashing Super Kamehameha beam
    hideBackHand = false;
    handRX = r * 1.30;
    handRY = +r * 0.14;
    handLX = r * 1.30;
    handLY = -r * 0.14;
  }

  // Draw Floating Pixel Fists (Zero stretching arm tubes — Gojo standard)
  const fistSkinTone = isSuperSaiyan ? '#FFE0B2' : '#FFE0BD';

  if (!hideBackHand) {
    drawGokuFist(ctx, handLX, handLY, handRadius, fistSkinTone);
  }

  if (!hideFrontHand) {
    const fx = (isPunching && !fighter.isRightPunch) ? handLX : handRX;
    const fy = (isPunching && !fighter.isRightPunch) ? handLY : handRY;
    drawGokuFist(ctx, fx, fy, handRadius, fistSkinTone);
  }

  // Super Saiyan Knuckle Aura Wisps when Punching
  if (isSuperSaiyan && isPunching) {
    const activeHandX = fighter.isRightPunch ? handRX : handLX;
    const activeHandY = fighter.isRightPunch ? handRY : handLY;
    ctx.save();
    ctx.beginPath();
    ctx.arc(activeHandX, activeHandY, handRadius * 1.45, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.40)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(activeHandX, activeHandY, handRadius * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.60)';
    ctx.fill();
    ctx.restore();
  }

  // 6. Universal Manga Ink Outline (Rule 32)
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();
  ctx.restore();

  // 7. Status Overlays
  if (typeof fighter.drawStatusOverlays === 'function') {
    fighter.drawStatusOverlays(ctx, r);
  }

  ctx.restore();
}

/**
 * Ghost Model Afterimage for Goku (Z-Vanish Evasion)
 */
export function drawGokuGhostSkin(ctx, x, y, angle = 0, r = 25, alpha = 0.5) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);

  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  const facingLeft = Math.abs(normAngle) > Math.PI / 2;
  ctx.rotate(angle);
  if (facingLeft) {
    ctx.scale(1, -1);
  }

  // Golden Vanish Aura
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 215, 0, 0.30)';
  ctx.fill();

  drawGokuPixelBody(ctx, r);
  _drawGokuHair(ctx, r, facingLeft, false);

  ctx.strokeStyle = 'rgba(255, 215, 0, 0.80)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

