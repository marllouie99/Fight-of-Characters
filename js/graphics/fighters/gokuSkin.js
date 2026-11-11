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
import { CONFIG, getHandSize } from '../../core/config.js';
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
      if (!img.src.endsWith('Goku-hair.png')) {
        img.src = 'Assets/model/goku/Goku-hair.png';
      } else {
        _gokuHairImageLoading = false;
      }
    };
    const hairPath = (typeof CONFIG !== 'undefined' && CONFIG.goku?.assets?.hair) || 'Assets/model/goku/Pixel Art Spiky Black Hair Sprite.png';
    img.src = hairPath;
    _gokuHairImage = img;
  }
  return _gokuHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getGokuHairImage();
}

/**
 * Draws Goku's iconic Saiyan hair silhouette from Assets/model/goku/Pixel Art Spiky Black Hair Sprite.png.
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

  const targetHairWidth = r * 3.10 * wMult;
  const targetHairHeight = r * 2.07 * hMult;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const drawX = -targetHairWidth / 2 + offX;
  const drawY = -r * 1.38 + offY;

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
  drawPixelHand(ctx, 0, 0, radius, skinColor, '#0E0F14');
  ctx.restore();
}

/**
 * Strict Prohibition of Stretching Arm Tubes (Gojo Standard).
 * Brawlers use discrete floating pixel fists with zero stretching arm linkages.
 */
export function drawGokuArmLinkage(ctx, sx, sy, hx, hy, handRadius, r, isRightArm, isSuperSaiyan = false) {
  // Intentionally empty: Goku uses discrete floating pixel fists matching Gojo, Sukuna, and Yuji.
  return;
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
  const angle = (fighter._isWinnerReveal && !fighter._isStudioDummy) ? 0 : (fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0));
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

  // 5. Canonical Hands, Arm Physics & Smooth Punch Kinematics (Rule 20 & 30)
  const baseR = (CONFIG.globalFighter?.sizeMultiplier) ? (r / CONFIG.globalFighter.sizeMultiplier) : 25;
  const handRadius = getHandSize ? getHandSize(baseR * 0.30, fighter) : 10.5;
  const isPodiumPreview = Boolean(fighter._isWinnerReveal);
  const isPunching = !isPodiumPreview && Boolean((fighter.punchAnimTimer && fighter.punchAnimTimer > 0) || fighter.isPunching);
  const isChargingKamehameha = Boolean(fighter.isChargingKamehameha);
  const isFiringKamehameha = Boolean(fighter.isFiringKamehameha);
  const isKiBarrage = Boolean(fighter.basicComboPhase === 3);
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
      // Overhead Sledgehammer Finisher Slam: Both hands clasped together driving downward
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
  } else if (isKiBarrage) {
    // Phase 3: Ki Blast Barrage (Renzoku Ki Dān) — Dual floating palms thrust forward with vibration
    hideBackHand = false;
    const kiVibe = Math.sin((fighter.kiBarrageTimer || 0) * 1.8) * 3.0;
    frontHandX = r * 1.15 + kiVibe;
    frontHandY = +r * 0.24;
    backHandX = r * 1.15 - kiVibe;
    backHandY = -r * 0.24;
  } else if (isChargingKamehameha) {
    // Cupped hands at right hip channeling blue Ki
    hideBackHand = false;
    frontHandX = -r * 0.35;
    frontHandY = +r * 0.35;
    backHandX = -r * 0.45;
    backHandY = +r * 0.25;
  } else if (isFiringKamehameha) {
    // Both palms locked forward unleashing Super Kamehameha beam
    hideBackHand = false;
    frontHandX = r * 1.30;
    frontHandY = +r * 0.14;
    backHandX = r * 1.30;
    backHandY = -r * 0.14;
  }

  // Draw Floating Pixel Fists (Zero stretching arm tubes — Gojo standard)
  const fistSkinTone = isSuperSaiyan ? '#FFE0B2' : '#FFE0BD';

  if (!hideHands) {
    if (!hideBackHand) {
      drawGokuFist(ctx, backHandX, backHandY, handRadius, fistSkinTone);
    }
    if (!hideFrontHand) {
      drawGokuFist(ctx, frontHandX, frontHandY, handRadius, fistSkinTone);
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
      ctx.strokeStyle = isSuperSaiyan ? `rgba(255, 235, 59, ${0.75 * punchAlpha})` : `rgba(255, 171, 0, ${0.70 * punchAlpha})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Manga Action Speed Needles trailing behind knuckles
      const needleCount = 3;
      const streakColor = isSuperSaiyan ? '#FFF59D' : '#FFE0B2';
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
      ctx.fillStyle = isSuperSaiyan ? 'rgba(255, 215, 0, 0.42)' : 'rgba(255, 109, 0, 0.32)';
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

