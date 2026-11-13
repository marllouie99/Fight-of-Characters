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
import { CONFIG, getHandSize } from '../../core/config.js';
import { drawPixelHand } from '../renderers/fighterRenderer.js';
import { getFilteredSpriteCanvas, drawTransformedSpriteQuad, drawGlowingGhostSprite } from '../graphicsCache.js';

let _vegetaHairImage = null;
let _vegetaHairImageLoading = false;

let _vegetaSuperSaiyanHairImage = null;
let _vegetaSuperSaiyanHairImageLoading = false;

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
      if (!img.src.endsWith('Vegeta-hair.png')) {
        img.src = 'Assets/model/vegeta/Vegeta-hair.png';
      } else {
        _vegetaHairImageLoading = false;
      }
    };
    const hairPath = (typeof CONFIG !== 'undefined' && CONFIG.vegeta?.assets?.hair) || 'Assets/model/vegeta/Pixel Art Spiky Black Hair Sprite.png';
    img.src = hairPath;
    _vegetaHairImage = img;
  }
  return _vegetaHairImage;
}

export function _getVegetaSuperSaiyanHairImage() {
  if (_vegetaSuperSaiyanHairImage && _vegetaSuperSaiyanHairImage.complete && _vegetaSuperSaiyanHairImage.naturalWidth > 0) {
    return _vegetaSuperSaiyanHairImage;
  }
  if (!_vegetaSuperSaiyanHairImageLoading && typeof Image !== 'undefined') {
    _vegetaSuperSaiyanHairImageLoading = true;
    const img = new Image();
    img.onload = () => {
      _vegetaSuperSaiyanHairImage = img;
      _vegetaSuperSaiyanHairImageLoading = false;
    };
    img.onerror = () => {
      _vegetaSuperSaiyanHairImageLoading = false;
    };
    const hairPath = (typeof CONFIG !== 'undefined' && CONFIG.vegeta?.assets?.superSaiyanHair) || 'Assets/model/vegeta/Vegeta-ssj-hair.png';
    img.src = hairPath;
    _vegetaSuperSaiyanHairImage = img;
  }
  return _vegetaSuperSaiyanHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getVegetaHairImage();
  _getVegetaSuperSaiyanHairImage();
}

/**
 * Resolves calibrated hair dimensions, anchor offsets, and source image for Vegeta's base or SSJ form.
 */
function _resolveVegetaHairMetrics(r, isSuperSaiyan = false) {
  const hairImg = _getVegetaHairImage();
  const ssjHairImg = isSuperSaiyan ? _getVegetaSuperSaiyanHairImage() : null;
  const useDedicatedSsjSprite = Boolean(isSuperSaiyan && ssjHairImg && ssjHairImg.complete && ssjHairImg.naturalWidth > 0);

  const custom = (typeof state !== 'undefined' && (useDedicatedSsjSprite ? state.skinCustomizations?.vegeta_ssj : state.skinCustomizations?.vegeta)) || {};
  const wMult = custom.widthScale ?? 1.0;
  const hMult = custom.heightScale ?? 1.0;
  const offX = custom.offsetX ?? 0;
  const offY = custom.offsetY ?? 0;
  const rot = custom.angleOffset ?? 0;
  const flipX = custom.flipX ? -1 : 1;
  const flipY = custom.flipY ? -1 : 1;

  const targetHairWidth = r * (useDedicatedSsjSprite ? 3.12 : 2.80) * wMult;
  const targetHairHeight = r * (useDedicatedSsjSprite ? 2.72 : 2.80) * hMult;
  const drawX = -targetHairWidth / 2 + offX;
  const drawY = -r * (useDedicatedSsjSprite ? 2.30 : 2.05) + offY;

  let srcImg = null;
  if (useDedicatedSsjSprite) {
    srcImg = ssjHairImg;
  } else if (hairImg && hairImg.complete && hairImg.naturalWidth > 0) {
    srcImg = isSuperSaiyan
      ? getFilteredSpriteCanvas(hairImg, 'sepia(1) saturate(5) hue-rotate(5deg) brightness(1.2)')
      : hairImg;
  }

  return { srcImg, useDedicatedSsjSprite, targetHairWidth, targetHairHeight, drawX, drawY, rot, flipX, flipY };
}

/**
 * Draws Vegeta's upward flame hair silhouette (base black sprite or dedicated Super Saiyan golden sprite).
 */
export function _drawVegetaHair(ctx, r, facingLeft = false, isSuperSaiyan = false) {
  const m = _resolveVegetaHairMetrics(r, isSuperSaiyan);
  drawTransformedSpriteQuad(ctx, m.srcImg, m.drawX, m.drawY, m.targetHairWidth, m.targetHairHeight, m.rot, m.flipX, m.flipY);
}

/**
 * Draws Vegeta's canonical white royal combat gloves with charcoal knuckle seams.
 */
export function drawVegetaFist(ctx, x, y, radius) {
  ctx.save();
  ctx.translate(x, y);
  drawPixelHand(ctx, 0, 0, radius, '#FFFFFF', '#0E0F14');
  ctx.restore();
}

/**
 * Strict Prohibition of Stretching Arm Tubes (Gojo Standard).
 * Brawlers use discrete floating pixel fists with zero stretching arm linkages.
 */
export function drawVegetaArmLinkage(ctx, sx, sy, hx, hy, handRadius, r, isRightArm, isSuperSaiyan = false) {
  // Intentionally empty: Vegeta uses discrete floating pixel fists matching Gojo, Sukuna, and Yuji.
  return;
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
  const angle = (fighter._isWinnerReveal && !fighter._isStudioDummy) ? 0 : (fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0));
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

  // 5. Canonical Hands, Arm Physics & Smooth Punch Kinematics (Rule 20 & 30)
  const baseR = (CONFIG.globalFighter?.sizeMultiplier) ? (r / CONFIG.globalFighter.sizeMultiplier) : 25;
  const handRadius = getHandSize ? getHandSize(baseR * 0.30, fighter) : 10.5;
  const isPodiumPreview = Boolean(fighter._isWinnerReveal);
  const isPunching = !isPodiumPreview && Boolean((fighter.punchAnimTimer && fighter.punchAnimTimer > 0) || fighter.isPunching);
  const isChargingFinalFlash = Boolean(fighter.isChargingFinalFlash);
  const isFiringFinalFlash = Boolean(fighter.isFiringFinalFlash);
  const isBigBang = Boolean(fighter.isBigBangActive || (fighter.bigBangChargeTimer && fighter.bigBangChargeTimer > 0));
  const isKiVolley = Boolean(fighter.basicComboPhase === 3);
  const isFinisherSlam = Boolean(fighter.basicComboPhase === 2 && (fighter.meleeModeDurationTimer || 0) <= 0);

  // Canonical Brawler Default Hand Placement along +X aim axis
  const baseHandX = r * 0.88;
  const idleBob = (!isPodiumPreview && !isPunching) ? Math.sin(Date.now() * 0.007) * (r * 0.05) : 0;

  // Single front hand brawler punch stance (matching GojoRenderer proven standard)
  let hideFrontHand = false;
  let hideBackHand = true; // Other hand completely removed/chambered during punches and neutral stance

  let frontHandX = baseHandX + idleBob;
  let frontHandY = 0;
  let backHandX = 0;
  let backHandY = 0;

  const hideHands = (typeof state !== 'undefined' && state.showSkinOnly) || isPodiumPreview || fighter.hideHands;
  let easePunch = 0;
  let rawProgress = 0;

  if (isPunching) {
    const maxT = fighter.punchActiveMaxTime || fighter.punchMaxTime || 10;
    rawProgress = Math.min(1.0, Math.max(0.0, 1.0 - (fighter.punchAnimTimer / maxT)));

    // 4-Phase Anime Martial Arts Punch Kinematics (Anti-Stiffness & 5-Phase Impact Lock Standard)
    // Phase 1 (0.00 <= p < 0.12): Windup / Chamber Coil (-10% backward cocking)
    // Phase 2 (0.12 <= p < 0.38): Hypersonic Whip Stroke (Power ease forward to 1.0)
    // Phase 3 (0.38 <= p < 0.52): Impact Lock & Knuckle Latch (Held at 1.0 with micro-tremor)
    // Phase 4 (0.52 <= p <= 1.00): Damped Elastic Retraction Settle (Cosine ease back to 0.0)
    let impactTremor = 0;

    if (rawProgress < 0.12) {
      const cp = rawProgress / 0.12;
      easePunch = -Math.sin(cp * Math.PI) * 0.10;
    } else if (rawProgress < 0.38) {
      const sp = (rawProgress - 0.12) / 0.26;
      easePunch = Math.sin(sp * (Math.PI / 2));
    } else if (rawProgress < 0.52) {
      easePunch = 1.0;
      impactTremor = Math.sin((rawProgress - 0.38) * 45) * (r * 0.04);
    } else {
      const rp = (rawProgress - 0.52) / 0.48;
      easePunch = Math.cos(rp * (Math.PI / 2));
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

    const currentLunge = easePunch * maxLunge + impactTremor;
    const dip = Math.sin(rawProgress * Math.PI) * (r * 0.12) * (fighter.isRightPunch ? 1 : -1);

    if (isFinisherSlam) {
      // High Overhead Axe Kick / Fist Finisher: Fists braced overhead driving downward
      hideBackHand = false;
      frontHandX = baseHandX + currentLunge;
      frontHandY = +r * 0.08 + dip;
      backHandX = baseHandX + currentLunge;
      backHandY = -r * 0.08 + dip;
    } else {
      // Single front striking fist lunges forward (Gojo / brawler standard)
      hideBackHand = true;
      frontHandX = baseHandX + currentLunge;
      frontHandY = dip;
    }
  } else if (isKiVolley) {
    // Phase 3: Rapid Ki Volley (Renzoku Ki Dān) — Manic alternating floating palm thrusts
    hideBackHand = false;
    const kiVibe = Math.sin((fighter.kiVolleyTimer || 0) * 2.2) * 3.5;
    frontHandX = r * 1.15 + kiVibe;
    frontHandY = +r * 0.24;
    backHandX = r * 1.15 - kiVibe;
    backHandY = -r * 0.24;
  } else if (isBigBang) {
    // Big Bang Attack: Open right palm thrust forward, left arm coiled back
    hideBackHand = false;
    frontHandX = r * 1.25;
    frontHandY = +r * 0.08;
    backHandX = -r * 0.20;
    backHandY = -r * 0.30;
  } else if (isChargingFinalFlash) {
    // Dual arms spread wide charging golden lightning
    hideBackHand = false;
    frontHandX = 0;
    frontHandY = +r * 0.85;
    backHandX = 0;
    backHandY = -r * 0.85;
  } else if (isFiringFinalFlash) {
    // Both wrists clasped forward unleashing Final Flash beam
    hideBackHand = false;
    frontHandX = r * 1.25;
    frontHandY = +r * 0.10;
    backHandX = r * 1.25;
    backHandY = -r * 0.10;
  }

  // Draw Floating White Combat Gloves (Zero stretching arm tubes — Gojo standard)
  if (!hideHands) {
    if (!hideBackHand) {
      drawVegetaFist(ctx, backHandX, backHandY, handRadius);
    }
    if (!hideFrontHand) {
      drawVegetaFist(ctx, frontHandX, frontHandY, handRadius);
    }

    // Knuckle Punch VFX & Supersonic Compression Ripples during Strike Phase
    if (isPunching && easePunch > 0.40) {
      const activeHandX = frontHandX;
      const activeHandY = frontHandY;
      const punchAlpha = Math.min(1.0, (easePunch - 0.40) / 0.50);

      ctx.save();
      // Supersonic Air Compression Ring ahead of knuckles
      ctx.beginPath();
      ctx.arc(activeHandX + handRadius * 0.40, activeHandY, handRadius * (0.85 + easePunch * 0.55), 0, Math.PI * 2);
      ctx.strokeStyle = isSuperSaiyan ? `rgba(255, 235, 59, ${0.75 * punchAlpha})` : `rgba(0, 229, 255, ${0.70 * punchAlpha})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Manga Action Speed Needles trailing behind knuckles
      const needleCount = 3;
      const streakColor = isSuperSaiyan ? '#FFF59D' : '#80D8FF';
      ctx.fillStyle = streakColor;
      for (let sn = 0; sn < needleCount; sn++) {
        const ny = activeHandY + (sn - 1) * (handRadius * 0.45);
        const nx = activeHandX - handRadius * 0.30;
        const trailLen = handRadius * (1.2 + easePunch * 1.4);
        ctx.beginPath();
        ctx.moveTo(nx - trailLen, ny);
        ctx.lineTo(nx, ny - 1.2);
        ctx.lineTo(nx + 2, ny);
        ctx.lineTo(nx, ny + 1.2);
        ctx.closePath();
        ctx.fill();
      }

      // Specular Knuckle Ki Flare
      ctx.beginPath();
      ctx.arc(activeHandX, activeHandY, handRadius * 1.35, 0, Math.PI * 2);
      ctx.fillStyle = isSuperSaiyan ? 'rgba(255, 215, 0, 0.42)' : 'rgba(0, 229, 255, 0.32)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(activeHandX, activeHandY, handRadius * 0.80, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fill();
      ctx.restore();
    }
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
export function drawVegetaGhostSkin(ctx, x, y, angle = 0, r = 25, alpha = 0.5, isSuperSaiyan = false) {
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

  // Royal Cyan/Gold Vanish Aura
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
  ctx.fillStyle = isSuperSaiyan ? 'rgba(255, 224, 77, 0.34)' : 'rgba(0, 229, 255, 0.30)';
  ctx.fill();

  drawVegetaPixelBody(ctx, r);
  const ssjImg = isSuperSaiyan ? _getVegetaSuperSaiyanHairImage() : null;
  const useSsjGhost = Boolean(isSuperSaiyan && ssjImg && ssjImg.complete && ssjImg.naturalWidth > 0);
  if (useSsjGhost) {
    const m = _resolveVegetaHairMetrics(r, true);
    drawGlowingGhostSprite(ctx, m.srcImg, m.drawX, m.drawY, m.targetHairWidth, m.targetHairHeight, m.rot, m.flipX, m.flipY, '#FFE84D');
  } else {
    _drawVegetaHair(ctx, r, facingLeft, false);
  }

  ctx.strokeStyle = isSuperSaiyan ? 'rgba(255, 215, 0, 0.85)' : 'rgba(0, 229, 255, 0.80)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

