// ─────────────────────────────────────────────
// VEGETA FIGHTER SKIN & BODY MODEL
// Dragon Ball Series
// Canonical Toji Baseline Standard (Rule 24 Compliant):
// 1. Zone 1: Faceless Pure Face & Cheeks Dome (ry < r * 0.28)
// 2. Zone 2: Royal Saiyan Battle Cuirass & Gold Flanges (r * 0.28 <= ry < r * 0.64)
// 3. Zone 3: Segmented Armor Abdomen Plate (r * 0.64 <= ry < r * 0.78)
// 4. Zone 4: Royal Navy Tights & Combat Boots (ry >= r * 0.78)
// 5. Layer 2: Dedicated Upward Flame Hair (Assets/model/vegeta/Vegeta-hair.png)
// 6. Layer 1.5: Universal 2.0px Black Ink Outline (Rule 32 Compliant)
// ─────────────────────────────────────────────

import { state } from '../../core/state.js';
import { drawPixelHand } from '../renderers/fighterRenderer.js';
import { getFilteredSpriteCanvas } from '../graphicsCache.js';

let _vegetaHairImage = null;
let _vegetaHairImageLoading = false;

export function _getVegetaHairImage() {
  if (_vegetaHairImage && _vegetaHairImage.complete && _vegetaHairImage.naturalWidth > 0) {
    return _vegetaHairImage;
  }
  if (!_vegetaHairImageLoading && typeof Image !== 'undefined') {
    _vegetaHairImageLoading = true;
    const img = new Image();
    img.onload = () => {
      _vegetaHairImage = img;
      _vegetaHairImageLoading = false;
    };
    img.onerror = () => {
      _vegetaHairImageLoading = false;
    };
    img.src = 'Assets/model/vegeta/Vegeta-hair.png';
    _vegetaHairImage = img;
  }
  return _vegetaHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getVegetaHairImage();
}

/**
 * Draws Vegeta's upward flame hair silhouette from Assets/model/vegeta/Vegeta-hair.png.
 */
export function _drawVegetaHair(ctx, r, facingLeft = false, isSuperSaiyan = false) {
  const hairImg = _getVegetaHairImage();
  const custom = (typeof state !== 'undefined' && state.skinCustomizations?.vegeta) || {};
  const wMult = custom.widthScale ?? 1.0;
  const hMult = custom.heightScale ?? 1.0;
  const offX = custom.offsetX ?? 0;
  const offY = custom.offsetY ?? 0;
  const rot = custom.angleOffset ?? 0;
  const flipX = custom.flipX ? -1 : 1;
  const flipY = custom.flipY ? -1 : 1;

  const targetHairWidth = r * 2.80 * wMult;
  const targetHairHeight = r * 2.35 * hMult;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const drawX = -targetHairWidth / 2 + offX;
  const drawY = -r * 1.40 + offY;

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
 * Draws Vegeta's canonical white royal combat gloves with charcoal knuckle seams.
 */
export function drawVegetaFist(ctx, x, y, radius) {
  ctx.save();
  ctx.translate(x, y);
  drawPixelHand(ctx, 0, 0, radius, '#FFFFFF');
  ctx.restore();
}

let _cachedVegetaBodyCanvas = null;
let _cachedVegetaBodyR = 0;

/**
 * Procedural Pixel Art Render Function (Renders once to offscreen cache).
 * Adheres strictly to the Toji Proportional Baseline (Rule 24).
 */
function _renderVegetaPixelBodyToCanvas(destCtx, r) {
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
        if (Math.abs(rx) > r * 0.70) {
          col = '#E2B388';   // Side cheek contour
        }
        destCtx.fillStyle = col;
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────
      // ZONE 2: Royal Battle Armor Cuirass (r * 0.28 <= ry < r * 0.64)
      // ──────────────────────────────────────────
      else if (ry < r * 0.64) {
        // Gold shoulder flange guards on outer flanks
        const isShoulderFlange = Math.abs(rx) > r * 0.50 && ry < r * 0.48;
        const isCenterNeck = Math.abs(rx) < r * 0.25 && ry < r * 0.35;

        if (isCenterNeck) {
          destCtx.fillStyle = '#1565C0'; // Navy bodysuit collar line
        } else if (isShoulderFlange) {
          destCtx.fillStyle = (ry < r * 0.38) ? '#FFC107' : '#FFA000'; // Gold-amber armor shoulder straps
        } else if (Math.abs(rx) < r * 0.35 && ry > r * 0.38 && ry < r * 0.52) {
          destCtx.fillStyle = '#FFFFFF'; // White cuirass chest highlight
        } else {
          destCtx.fillStyle = '#ECEFF1'; // White Royal Saiyan Battle Plate
        }
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────
      // ZONE 3: Segmented Armor Abdomen Plate (r * 0.64 <= ry < r * 0.78)
      // ──────────────────────────────────────────
      else if (ry < r * 0.78) {
        if (ry < r * 0.70) {
          destCtx.fillStyle = (Math.abs(rx) < r * 0.40) ? '#CFD8DC' : '#90A4AE'; // Upper abdomen plate
        } else if (Math.abs(rx) <= P * 0.6) {
          destCtx.fillStyle = '#0E0F14'; // Center armor seam
        } else {
          destCtx.fillStyle = '#B0BEC5'; // Lower armor ribbing
        }
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────
      // ZONE 4: Royal Navy Bodysuit & White Boots (ry >= r * 0.78)
      // ──────────────────────────────────────────
      else {
        if (Math.abs(rx) <= P * 0.6) {
          destCtx.fillStyle = '#0E0F14'; // Center inseam
        } else if (ry > r * 0.88 && Math.abs(rx) > r * 0.45) {
          destCtx.fillStyle = '#FFFFFF'; // White combat boot upper
        } else if (ry > r * 0.94) {
          destCtx.fillStyle = '#FFC107'; // Reinforced gold boot toe cap
        } else if (ry < r * 0.85 && Math.abs(rx) < r * 0.45) {
          destCtx.fillStyle = '#1976D2'; // Navy tights highlight
        } else {
          destCtx.fillStyle = '#1565C0'; // Royal Saiyan Navy tights
        }
        destCtx.fillRect(px, py, P, P);
      }
    }
  }

  destCtx.restore();
}

/**
 * Draws Vegeta's procedural pixel body with offscreen buffer caching.
 */
export function drawVegetaPixelBody(ctx, r) {
  if (typeof document === 'undefined') {
    _renderVegetaPixelBodyToCanvas(ctx, r);
    return;
  }

  const intR = Math.round(r);
  if (!_cachedVegetaBodyCanvas || _cachedVegetaBodyR !== intR) {
    const P = 2.0;
    const steps = Math.ceil((intR + P) / P);
    const size = (steps * 2 + 1) * P;
    _cachedVegetaBodyCanvas = document.createElement('canvas');
    _cachedVegetaBodyCanvas.width = size;
    _cachedVegetaBodyCanvas.height = size;
    const cctx = _cachedVegetaBodyCanvas.getContext('2d');
    _renderVegetaPixelBodyToCanvas(cctx, intR);
    _cachedVegetaBodyR = intR;
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const size = _cachedVegetaBodyCanvas.width;
  ctx.drawImage(_cachedVegetaBodyCanvas, -size / 2, -size / 2);
  ctx.restore();
}

/**
 * Main Skin Renderer for Vegeta
 */
export function drawVegetaSkin(ctx, fighter) {
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

  // 2. Surging Super Saiyan Royal Flame Aura
  if (isSuperSaiyan && !fighter._isSilhouettePass) {
    ctx.save();
    const pulse = 1.0 + Math.sin((fighter.superSaiyanTimer || 0) * 0.25) * 0.08;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.35 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.28)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.15 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(124, 77, 255, 0.30)'; // Royal violet resonance
    ctx.fill();
    ctx.restore();
  }

  // 3. Procedural Pixel-Art Body
  drawVegetaPixelBody(ctx, r);

  // 4. Hair Asset Overlay (Layer 2)
  _drawVegetaHair(ctx, r, facingLeft, isSuperSaiyan);

  // 5. Canonical Floating Hands & Dynamic Punch Extension (Gojo/Sukuna/Yuji Floating Hand Standard)
  const handRadius = r * 0.30;
  const isPodiumPreview = Boolean(fighter._isWinnerReveal);
  const isPunching = !isPodiumPreview && Boolean(fighter.punchAnimTimer && fighter.punchAnimTimer > 0);
  const isChargingFinalFlash = Boolean(fighter.isChargingFinalFlash);
  const isFiringFinalFlash = Boolean(fighter.isFiringFinalFlash);
  const isBigBang = Boolean(fighter.isBigBangActive || (fighter.bigBangChargeTimer && fighter.bigBangChargeTimer > 0));
  const isKiVolley = Boolean(fighter.basicComboPhase === 3);
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
      // High Overhead Axe Kick Finisher: Fists braced defensively at chest level
      hideBackHand = false;
      handRX = r * 0.45;
      handRY = +r * 0.20;
      handLX = r * 0.45;
      handLY = -r * 0.20;
    } else if (fighter.isRightPunch) {
      // Right Fist Leading Beatdown Strike along +X aim vector
      handRX = baseHandX + currentLunge;
      handRY = +r * 0.20 + dip;
      hideBackHand = true;
    } else {
      // Left Fist Leading Beatdown Strike along +X aim vector
      handLX = baseHandX + currentLunge;
      handLY = -r * 0.20 - dip;
      hideBackHand = true;
    }
  } else if (isKiVolley) {
    // Phase 3: Rapid Ki Volley (Renzoku Ki Dān) — Manic alternating floating palm thrusts
    hideBackHand = false;
    const kiVibe = Math.sin((fighter.kiVolleyTimer || 0) * 2.2) * 3.5;
    handRX = r * 1.15 + kiVibe;
    handRY = +r * 0.24;
    handLX = r * 1.15 - kiVibe;
    handLY = -r * 0.24;
  } else if (isBigBang) {
    // Big Bang Attack: Open right palm thrust forward, left arm coiled back
    hideBackHand = false;
    handRX = r * 1.25;
    handRY = +r * 0.08;
    handLX = -r * 0.20;
    handLY = -r * 0.30;
  } else if (isChargingFinalFlash) {
    // Dual floating arms spread wide charging golden lightning
    hideBackHand = false;
    handRX = 0;
    handRY = +r * 0.85;
    handLX = 0;
    handLY = -r * 0.85;
  } else if (isFiringFinalFlash) {
    // Both wrists clasped forward unleashing Final Flash beam
    hideBackHand = false;
    handRX = r * 1.25;
    handRY = +r * 0.10;
    handLX = r * 1.25;
    handLY = -r * 0.10;
  }

  // Draw Floating Pixel Fists (Zero stretching arm tubes — Gojo standard)
  if (!hideBackHand) {
    drawVegetaFist(ctx, handLX, handLY, handRadius);
  }

  if (!hideFrontHand) {
    const fx = (isPunching && !fighter.isRightPunch) ? handLX : handRX;
    const fy = (isPunching && !fighter.isRightPunch) ? handLY : handRY;
    drawVegetaFist(ctx, fx, fy, handRadius);
  }

  // Super Saiyan / Royal Knuckle Aura Wisps when Punching
  if (isPunching) {
    const activeHandX = fighter.isRightPunch ? handRX : handLX;
    const activeHandY = fighter.isRightPunch ? handRY : handLY;
    ctx.save();
    ctx.beginPath();
    ctx.arc(activeHandX, activeHandY, handRadius * 1.45, 0, Math.PI * 2);
    ctx.fillStyle = isSuperSaiyan ? 'rgba(255, 215, 0, 0.40)' : 'rgba(0, 229, 255, 0.35)';
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
 * Ghost Model Afterimage for Vegeta (Z-Vanish Evasion)
 */
export function drawVegetaGhostSkin(ctx, x, y, angle = 0, r = 25, alpha = 0.5) {
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

  // Royal Cyan/Violet Vanish Aura
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 229, 255, 0.30)';
  ctx.fill();

  drawVegetaPixelBody(ctx, r);
  _drawVegetaHair(ctx, r, facingLeft, false);

  ctx.strokeStyle = 'rgba(0, 229, 255, 0.80)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

