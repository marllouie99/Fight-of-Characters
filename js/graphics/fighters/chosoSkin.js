// ─────────────────────────────────────────────
// CHOSO FIGHTER SKIN & BODY MODEL
// Death Painting Eldest Brother (Jujutsu Kaisen)
// Strictly adheres to:
// - Rule 19: Upright Front POV Orientation & Leftward Y-Scale Mirroring
// - Rule 20: Canonical Symmetrical Flank Hand Positioning & Convergence Clasp
// - Rule 22: Hair & Head Asset Model Import with Procedural Discrete Locks Fallback
// - Rule 24: Universal Character Body Model & Scale Standard (Toji Reference Standard)
// - Rule 3.2: Faceless Minimalist Standard (Zero eyes/mouth; iconic nose blood bridge)
// - Rule 11: Prohibition of shadowBlur / shadowColor
// ─────────────────────────────────────────────

import { getHandSize } from '../../core/config.js';
import { state } from '../../core/state.js';
import { drawPixelHand } from '../renderers/fighterRenderer.js';

let _chosoHairImage = null;
let _chosoHairImageLoading = false;

/**
 * Module-level eager loader for Choso's dedicated hair asset.
 */
export function _getChosoHairImage() {
  if (_chosoHairImage && _chosoHairImage.complete && _chosoHairImage.naturalWidth > 0) {
    return _chosoHairImage;
  }
  if (!_chosoHairImageLoading && typeof Image !== 'undefined') {
    _chosoHairImageLoading = true;
    const img = new Image();
    img.onload = () => {
      _chosoHairImage = img;
      _chosoHairImageLoading = false;
      _cachedChosoBodyCanvas = null;
      _cachedChosoBodyR = 0;
    };
    img.onerror = () => {
      _chosoHairImageLoading = false;
    };
    img.src = 'Assets/model/choso/Choso-hair.png?v=2';
    _chosoHairImage = img;
  }
  return _chosoHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getChosoHairImage();
}

/**
 * Procedural discrete lock hair rendering for Choso (Rule 22 Fallback & Studio Renderer).
 * Accurately models Choso's signature dark messy hair, jagged forehead bangs,
 * and the iconic high twin pigtail tufts flared at 45° angles.
 */
export function _drawProceduralChosoHair(ctx, r, offX = 0, offY = 0, wMult = 1, hMult = 1, rot = 0, flipX = 1, flipY = 1) {
  ctx.save();
  if (rot !== 0 || flipX !== 1 || flipY !== 1 || offX !== 0 || offY !== 0 || wMult !== 1 || hMult !== 1) {
    ctx.translate(offX, offY);
    if (rot !== 0) ctx.rotate(rot);
    if (flipX !== 1 || flipY !== 1) ctx.scale(flipX * wMult, flipY * hMult);
  }

  const baseCol = '#1B141E';      // Deep espresso / midnight plum black
  const shadowCol = '#0E0912';    // Dark ink root / tie bands
  const highlightCol = '#2D2034'; // Crown glint tier

  // 1. Root Volume & Forehead Hairline (Terminates cleanly at y = -r * 0.20 to -r * 0.35)
  ctx.fillStyle = baseCol;
  ctx.beginPath();
  ctx.arc(0, -r * 0.40, r * 0.82, Math.PI * 0.90, Math.PI * 2.10);
  ctx.fill();

  // 2. High Twin Pigtail Tufts (Iconic Choso Silhouette)
  // Left High Pigtail Tuft (Angled ~ -45° to upper-left)
  ctx.save();
  ctx.translate(-r * 0.52, -r * 0.88);
  ctx.rotate(-0.45);
  // Hair tie band
  ctx.fillStyle = shadowCol;
  ctx.fillRect(-r * 0.14, -r * 0.08, r * 0.28, r * 0.14);
  // Expanding tuft flare
  ctx.fillStyle = baseCol;
  ctx.beginPath();
  ctx.moveTo(-r * 0.12, 0);
  ctx.lineTo(-r * 0.38, -r * 0.52);
  ctx.lineTo(-r * 0.18, -r * 0.46);
  ctx.lineTo(-r * 0.32, -r * 0.78); // Topmost spike
  ctx.lineTo(-r * 0.06, -r * 0.56);
  ctx.lineTo(r * 0.08, -r * 0.84);  // Secondary apex
  ctx.lineTo(r * 0.12, -r * 0.44);
  ctx.lineTo(r * 0.26, -r * 0.50);
  ctx.lineTo(r * 0.12, 0);
  ctx.closePath();
  ctx.fill();
  // Glint strand
  ctx.fillStyle = highlightCol;
  ctx.beginPath();
  ctx.moveTo(-r * 0.06, -r * 0.12);
  ctx.lineTo(-r * 0.18, -r * 0.50);
  ctx.lineTo(0, -r * 0.38);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Right High Pigtail Tuft (Angled ~ +45° to upper-right)
  ctx.save();
  ctx.translate(r * 0.52, -r * 0.88);
  ctx.rotate(0.45);
  // Hair tie band
  ctx.fillStyle = shadowCol;
  ctx.fillRect(-r * 0.14, -r * 0.08, r * 0.28, r * 0.14);
  // Expanding tuft flare
  ctx.fillStyle = baseCol;
  ctx.beginPath();
  ctx.moveTo(r * 0.12, 0);
  ctx.lineTo(r * 0.38, -r * 0.52);
  ctx.lineTo(r * 0.18, -r * 0.46);
  ctx.lineTo(r * 0.32, -r * 0.78); // Topmost spike
  ctx.lineTo(r * 0.06, -r * 0.56);
  ctx.lineTo(-r * 0.08, -r * 0.84); // Secondary apex
  ctx.lineTo(-r * 0.12, -r * 0.44);
  ctx.lineTo(-r * 0.26, -r * 0.50);
  ctx.lineTo(-r * 0.12, 0);
  ctx.closePath();
  ctx.fill();
  // Glint strand
  ctx.fillStyle = highlightCol;
  ctx.beginPath();
  ctx.moveTo(r * 0.06, -r * 0.12);
  ctx.lineTo(r * 0.18, -r * 0.50);
  ctx.lineTo(0, -r * 0.38);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. Central Crown Messy Strands
  ctx.fillStyle = baseCol;
  ctx.beginPath();
  ctx.moveTo(-r * 0.30, -r * 0.90);
  ctx.lineTo(-r * 0.16, -r * 1.25);
  ctx.lineTo(0, -r * 0.98);
  ctx.lineTo(r * 0.16, -r * 1.28);
  ctx.lineTo(r * 0.30, -r * 0.90);
  ctx.closePath();
  ctx.fill();

  // 4. Forehead Bang Strands (Sharp, discrete locks framing the skin dome)
  const bangs = [
    { startX: -r * 0.65, startY: -r * 0.50, tipX: -r * 0.58, tipY: -r * 0.18, endX: -r * 0.46, endY: -r * 0.45 },
    { startX: -r * 0.48, startY: -r * 0.55, tipX: -r * 0.34, tipY: -r * 0.22, endX: -r * 0.22, endY: -r * 0.52 },
    { startX: -r * 0.24, startY: -r * 0.58, tipX: -r * 0.08, tipY: -r * 0.19, endX: r * 0.04, endY: -r * 0.56 },
    { startX: 0, startY: -r * 0.58, tipX: r * 0.14, tipY: -r * 0.21, endX: r * 0.28, endY: -r * 0.54 },
    { startX: r * 0.26, startY: -r * 0.52, tipX: r * 0.42, tipY: -r * 0.18, endX: r * 0.56, endY: -r * 0.48 },
    { startX: r * 0.52, startY: -r * 0.45, tipX: r * 0.64, tipY: -r * 0.16, endX: r * 0.72, endY: -r * 0.40 },
  ];

  for (let i = 0; i < bangs.length; i++) {
    const b = bangs[i];
    ctx.beginPath();
    ctx.moveTo(b.startX, b.startY);
    ctx.lineTo(b.tipX, b.tipY);
    ctx.lineTo(b.endX, b.endY);
    ctx.closePath();
    ctx.fill();
  }

  // 5. Crown Highlight Sheen
  ctx.fillStyle = highlightCol;
  ctx.beginPath();
  ctx.arc(0, -r * 0.85, r * 0.35, Math.PI * 1.1, Math.PI * 1.9);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws Choso's anime hair from Assets/model/choso/Choso-hair.png or procedural fallback.
 */
export function _drawChosoHair(ctx, r, facingLeft = false) {
  const custom = (typeof state !== 'undefined' && state.skinCustomizations?.choso) || {};
  const wMult = custom.widthScale ?? 1.0;
  const hMult = custom.heightScale ?? 1.0;
  const offX = custom.offsetX ?? 0;
  const offY = custom.offsetY ?? 0;
  const rot = custom.angleOffset ?? 0;
  const flipX = custom.flipX ? -1 : 1;
  const flipY = custom.flipY ? -1 : 1;

  const hairImg = _getChosoHairImage();
  if (hairImg && hairImg.complete && hairImg.naturalWidth > 0) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Calibrated crown anchor for Choso hair asset (1024x768, opaque bbox: X [36..988], Y [76..691])
    const targetHairWidth = r * 3.62 * wMult;
    const targetHairHeight = r * 2.42 * hMult;
    const scaleX = targetHairWidth / 952;
    const scaleY = targetHairHeight / 615;
    const drawW = 1024 * scaleX;
    const drawH = 768 * scaleY;
    const drawX = -512 * scaleX + offX;
    const drawY = -r * 1.86 - 76 * scaleY + offY;

    if (rot !== 0 || flipX !== 1 || flipY !== 1) {
      ctx.translate(drawX + drawW / 2, drawY + drawH / 2);
      if (rot !== 0) ctx.rotate(rot);
      if (flipX !== 1 || flipY !== 1) ctx.scale(flipX, flipY);
      ctx.drawImage(hairImg, -drawW / 2, -drawH / 2, drawW, drawH);
    } else {
      ctx.drawImage(hairImg, drawX, drawY, drawW, drawH);
    }
    ctx.restore();
  } else {
    // Crisp pixel art discrete lock procedural fallback
    _drawProceduralChosoHair(ctx, r, offX, offY, wMult, hMult, rot, flipX, flipY);
  }
}

let _cachedChosoBodyCanvas = null;
let _cachedChosoBodyR = 0;

/**
 * Procedural Pixel Art Render Function (Renders once to offscreen cache).
 * Strictly adheres to Toji Reference Standard (Rule 24):
 * - Fixed discrete grid unit P = 2.0px with integer coordinate snapping
 * - 4-neighbor attached boundary shell test for solid #0E0F14 manga ink outline
 * - Vertical Proportion Zones:
 *   Zone 1 (ry < r * 0.28): Pale skin dome with iconic horizontal nose blood stripe
 *   Zone 2 (r * 0.28 <= ry < r * 0.65): High cream scarf collar + plum-charcoal martial arts tunic
 *   Zone 3 (r * 0.65 <= ry < r * 0.78): Dark burgundy/black obi belt sash
 *   Zone 4 (ry >= r * 0.78): Deep slate-black baggy hakama trousers
 */
function _renderChosoPixelBodyToCanvas(destCtx, r) {
  destCtx.save();
  destCtx.imageSmoothingEnabled = false;
  destCtx.translate(destCtx.canvas.width / 2, destCtx.canvas.height / 2);
  const P = 2.0;
  const steps = Math.ceil((r + P) / P);

  for (let gy = -steps; gy <= steps; gy++) {
    for (let gx = -steps; gx <= steps; gx++) {
      const rx = gx * P;
      const ry = gy * P;
      const dist = Math.hypot(rx, ry);
      if (dist > r) continue;

      const px = rx - P / 2;
      const py = ry - P / 2;

      // 4-neighbor boundary test for clean 1-pixel outer manga ink outline (Rule 24)
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
      // ZONE 1: Face Dome & Iconic Blood Stripe (ry < r * 0.28)
      // ──────────────────────────────────────────
      if (ry < r * 0.28) {
        let col = '#F4DDD0'; // Pale, cold Death Painting skin tone

        // Side cheek shading contour
        if (Math.abs(rx) > r * 0.70) {
          col = '#DDB9A4';
        }

        // Iconic Horizontal Blood Scab Stripe across the nose bridge and cheeks
        // Positioned centrally: rx in [-r * 0.44, +r * 0.44], ry in [-r * 0.04, +r * 0.09]
        if (Math.abs(rx) <= r * 0.44 && ry >= -r * 0.04 && ry <= r * 0.09) {
          if (ry <= -r * 0.02 || ry >= r * 0.07 || Math.abs(rx) >= r * 0.40) {
            col = '#3E0B12'; // Deep dried blood border
          } else {
            col = '#6E1420'; // Coagulated dark blood core
          }
        }

        destCtx.fillStyle = col;
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────
      // ZONE 2: Collar & Martial Arts Robes (r * 0.28 <= ry < r * 0.65)
      // ──────────────────────────────────────────
      else if (ry < r * 0.65) {
        // High wrap cream-white under-kimono scarf collar (ry: 0.28r to 0.42r)
        if (ry < r * 0.42) {
          if (Math.abs(rx) <= r * 0.50) {
            // Fold shadow
            destCtx.fillStyle = (Math.abs(rx) < r * 0.15) ? '#DED5C2' : '#EEE5D3';
          } else {
            destCtx.fillStyle = '#221828'; // Outer shoulder robe fabric
          }
        }
        // Baggy Sleeveless Plum-Charcoal Tabard Tunic (ry: 0.42r to 0.65r)
        else {
          if (Math.abs(rx) <= r * 0.12) {
            destCtx.fillStyle = '#1D1422'; // Center chest seam / fold
          } else if (Math.abs(rx) < r * 0.42 && ry > r * 0.46 && ry < r * 0.58) {
            destCtx.fillStyle = '#3F2F4A'; // Robe fold highlight
          } else {
            destCtx.fillStyle = '#2E2236'; // Main plum-charcoal martial arts fabric
          }
        }
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────
      // ZONE 3: Obi Sash Belt & Forward Knot (r * 0.65 <= ry < r * 0.78)
      // ──────────────────────────────────────────
      else if (ry < r * 0.78) {
        if (Math.abs(rx) <= r * 0.14) {
          destCtx.fillStyle = '#100B14'; // Center hanging sash knot
        } else if (Math.abs(rx) < r * 0.10 && ry > r * 0.70) {
          destCtx.fillStyle = '#4D1A25'; // Knot fold highlight
        } else {
          destCtx.fillStyle = '#20121C'; // Dark burgundy-black obi sash band
        }
        destCtx.fillRect(px, py, P, P);
      }
      // ──────────────────────────────────────────
      // ZONE 4: Lower Hakama Trousers (ry >= r * 0.78)
      // ──────────────────────────────────────────
      else {
        if (Math.abs(rx) <= P * 0.6) {
          destCtx.fillStyle = '#0E0912'; // Center pants inseam crease
        } else if ((Math.abs(rx) >= r * 0.30 && Math.abs(rx) <= r * 0.38) || Math.abs(rx) >= r * 0.68) {
          destCtx.fillStyle = '#150F1A'; // Deep pleat shadow
        } else {
          destCtx.fillStyle = '#241B2B'; // Deep slate-plum hakama cloth
        }
        destCtx.fillRect(px, py, P, P);
      }
    }
  }

  destCtx.restore();
}

/**
 * Draws Choso's procedural pixel-art body with offscreen canvas caching.
 */
export function drawChosoPixelBody(ctx, r) {
  if (typeof document === 'undefined') {
    _renderChosoPixelBodyToCanvas(ctx, r);
    return;
  }

  const intR = Math.round(r);
  if (!_cachedChosoBodyCanvas || _cachedChosoBodyR !== intR) {
    const P = 2.0;
    const steps = Math.ceil((intR + P) / P);
    const size = (steps * 2 + 1) * P;
    _cachedChosoBodyCanvas = document.createElement('canvas');
    _cachedChosoBodyCanvas.width = size;
    _cachedChosoBodyCanvas.height = size;
    const cctx = _cachedChosoBodyCanvas.getContext('2d');
    _renderChosoPixelBodyToCanvas(cctx, intR);
    _cachedChosoBodyR = intR;
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const size = _cachedChosoBodyCanvas.width;
  ctx.drawImage(_cachedChosoBodyCanvas, -size / 2, -size / 2);
  ctx.restore();
}

/**
 * Draws Choso's dynamic muscular arm & martial arts robe sleeve connecting shoulder to hand (Rule 30).
 * Features:
 * - Natural 2-segment elbow flexion based on extension distance
 * - Outer manga ink border (#0E0F14)
 * - Upper arm: Plum-charcoal martial arts sleeve fabric (#2E2236, fold shadow #1D1422, highlight #3F2F4A)
 * - Forearm: Athletic pale skin tone (#EAD2C2, shadow #D1B4A1, highlight #F4E4D7) with cream cuff (#EEE5D3)
 * - Shoulder cap: Deltoid rim (#221828) with #0E0F14 ink border
 */
export function _drawChosoArmLinkage(ctx, shoulderX, shoulderY, handX, handY, handRadius, r, isLeftArm = false) {
  const dx = handX - shoulderX;
  const dy = handY - shoulderY;
  const dist = Math.hypot(dx, dy);
  if (dist < 2.0) return;

  const nx = -dy / dist;
  const ny = dx / dist;
  const mx = shoulderX + dx * 0.48;
  const my = shoulderY + dy * 0.48;

  // Natural arm reach before full extension
  const armReach = r * 1.35;
  const flexRatio = Math.max(0, 1 - (dist / armReach));
  const bendAmount = Math.min(r * 0.42, r * 0.38 * Math.sin(flexRatio * Math.PI * 0.7));

  // Determine elbow outward flare direction relative to body core
  const flareX = isLeftArm ? -1.0 : 1.0;
  const flareY = 0.30;
  const dirX = flareX * 0.70 + (nx * mx >= 0 ? nx : -nx) * 0.30;
  const dirY = flareY * 0.70 + (ny * my >= 0 ? ny : -ny) * 0.30;
  const dirLen = Math.hypot(dirX, dirY) || 1;

  const elbowX = mx + (dirX / dirLen) * bendAmount;
  const elbowY = my + (dirY / dirLen) * bendAmount;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 1. Manga ink outer border
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(handX, handY);
  ctx.lineWidth = handRadius * 1.55;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();

  // 2. Upper arm: Martial arts robe sleeve fabric
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineWidth = handRadius * 1.15;
  ctx.strokeStyle = '#2E2236';
  ctx.stroke();

  // Sleeve fold shadow
  ctx.beginPath();
  ctx.moveTo(shoulderX + (elbowX - shoulderX) * 0.2, shoulderY + (elbowY - shoulderY) * 0.2);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineWidth = handRadius * 0.50;
  ctx.strokeStyle = '#1D1422';
  ctx.stroke();

  // Sleeve crest highlight
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(elbowX - (elbowX - shoulderX) * 0.2, elbowY - (elbowY - shoulderY) * 0.2);
  ctx.lineWidth = handRadius * 0.30;
  ctx.strokeStyle = '#3F2F4A';
  ctx.stroke();

  // 3. Forearm: Athletic pale skin tone
  ctx.beginPath();
  ctx.moveTo(elbowX, elbowY);
  ctx.lineTo(handX, handY);
  ctx.lineWidth = handRadius * 0.95;
  ctx.strokeStyle = isLeftArm ? '#D1B4A1' : '#EAD2C2';
  ctx.stroke();

  // Forearm crest highlight
  ctx.beginPath();
  ctx.moveTo(elbowX + (handX - elbowX) * 0.2, elbowY + (handY - elbowY) * 0.2);
  ctx.lineTo(handX - (handX - elbowX) * 0.2, handY - (handY - elbowY) * 0.2);
  ctx.lineWidth = handRadius * 0.32;
  ctx.strokeStyle = '#F4E4D7';
  ctx.stroke();

  // 4. White sleeve cuff band at elbow
  ctx.beginPath();
  ctx.arc(elbowX, elbowY, handRadius * 0.65, 0, Math.PI * 2);
  ctx.fillStyle = '#EEE5D3';
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();

  // 5. Deltoid rim at shoulder
  ctx.beginPath();
  ctx.arc(shoulderX, shoulderY, handRadius * 0.60, 0, Math.PI * 2);
  ctx.fillStyle = '#221828';
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders Choso's coagulated Blood Edge dagger in his dominant right hand during melee combos (Rule 20 & 30).
 * Features:
 * - Single-edged curved crimson blade forged from hardened blood
 * - Dark hilt wrap (#1D1422) with coagulated blood crossguard (#6E1420)
 * - Razor cutting edge (#FF2A55) with crystalline white spine glint (#FFFFFF)
 */
export function _drawChosoBloodDagger(ctx, handX, handY, bladeAngle, bladeAlpha = 1.0, r = 25) {
  if (bladeAlpha <= 0.05) return;
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(bladeAngle);
  ctx.globalAlpha = Math.min(1.0, bladeAlpha);

  const daggerLen = r * 1.30;
  const hiltLen = r * 0.35;

  // 1. Dagger Hilt & Pommel (Extending backward from grip)
  ctx.fillStyle = '#1D1422';
  ctx.fillRect(-hiltLen, -1.8, hiltLen, 3.6);
  // Blood Pommel Drop
  ctx.beginPath();
  ctx.arc(-hiltLen, 0, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#6E1420';
  ctx.fill();

  // 2. Coagulated Blood Crossguard
  ctx.fillStyle = '#6E1420';
  ctx.fillRect(-1.5, -4.5, 3.0, 9.0);
  ctx.strokeStyle = '#0E0F14';
  ctx.lineWidth = 1.0;
  ctx.strokeRect(-1.5, -4.5, 3.0, 9.0);

  // 3. Curved Blood Blade (Extending forward from grip)
  ctx.beginPath();
  ctx.moveTo(1.5, -2.5);
  ctx.lineTo(daggerLen * 0.70, -2.0);
  ctx.lineTo(daggerLen, 0); // Sharp piercing tip
  ctx.lineTo(daggerLen * 0.65, 3.0);
  ctx.lineTo(1.5, 2.5);
  ctx.closePath();
  ctx.fillStyle = '#990000'; // Deep arterial blood core
  ctx.fill();

  // Outer cutting edge glow
  ctx.beginPath();
  ctx.moveTo(1.5, 2.5);
  ctx.lineTo(daggerLen * 0.65, 3.0);
  ctx.lineTo(daggerLen, 0);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#FF2A55'; // Vibrant energized blood edge
  ctx.stroke();

  // Spine glint
  ctx.beginPath();
  ctx.moveTo(1.5, -2.0);
  ctx.lineTo(daggerLen * 0.75, -1.5);
  ctx.lineTo(daggerLen, 0);
  ctx.lineWidth = 1.0;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();

  ctx.restore();
}

/**
 * Master hand & arm animator for Choso's abilities adhering strictly to Rule 20 & Rule 30.
 * Smoothly computes kinematics across Convergence, Piercing Blood, Supernova, Chakrams, Darts, and Melee.
 */
export function _drawChosoArmsAndHands(ctx, fighter, r, handRadius, skinTone) {
  const lShoulderX = -r * 0.65;
  const lShoulderY = r * 0.22;
  const rShoulderX = r * 0.65;
  const rShoulderY = r * 0.22;

  // Canonical Default Flank Coordinates (Rule 20)
  const defaultLX = -r * 0.82;
  const defaultLY = r * 0.38;
  const defaultRX = r * 0.82;
  const defaultRY = r * 0.38;

  let leftX = defaultLX;
  let leftY = defaultLY;
  let rightX = defaultRX;
  let rightY = defaultRY;

  let bloodDagger = null;     // { handX, handY, angle, alpha }
  let palmSingularity = null; // { x, y, radius, isDiode }
  let apertureNozzle = null;  // { x, y, progress }
  let supernovaAura = null;   // { left: {x,y}, right: {x,y}, radius }
  let miniChakram = null;     // { x, y, rotation }
  let bloodDartNeedle = null; // { x, y, angle }

  // ──────────────────────────────────────────
  // 1. MELEE COMBO: BLOOD EDGE (5-Phase Kinematics Rule 30)
  // ──────────────────────────────────────────
  if (fighter.slashSwingTimer > 0) {
    const sMax = fighter.slashSwingMax || 36;
    const elapsed = sMax - fighter.slashSwingTimer;
    const progress = Math.min(1.0, Math.max(0, elapsed / sMax));

    const coilP = 0.26;
    const holdP = 0.36;
    const strikeP = 0.58;
    const lockP = 0.72;

    let lungeX = 0;
    let lungeY = 0;
    let bladeRot = 0;
    let daggerAlpha = 1.0;

    if (progress < coilP) {
      // Phase 1: Lift & Coil back
      const cp = progress / coilP;
      const ease = Math.sin(cp * Math.PI * 0.5);
      lungeX = -r * 0.45 * ease;
      lungeY = -r * 0.15 * ease;
      bladeRot = -1.60 * ease;
      leftX = defaultLX + r * 0.25 * ease;
      leftY = defaultLY - r * 0.18 * ease;
      rightX = defaultRX + lungeX;
      rightY = defaultRY + lungeY;
    } else if (progress < holdP) {
      // Phase 2: Apex Hold
      lungeX = -r * 0.45;
      lungeY = -r * 0.15;
      bladeRot = -1.60;
      leftX = defaultLX + r * 0.25;
      leftY = defaultLY - r * 0.18;
      rightX = defaultRX + lungeX;
      rightY = defaultRY + lungeY;
    } else if (progress < strikeP) {
      // Phase 3: Hypersonic Whip Strike (Power ease)
      const sp = (progress - holdP) / (strikeP - holdP);
      const whipEase = Math.pow(sp, 2.5);
      lungeX = -r * 0.45 + r * 0.85 * whipEase;
      lungeY = -r * 0.15 + r * 0.10 * whipEase;
      bladeRot = -1.60 + 2.75 * whipEase;
      leftX = defaultLX + r * 0.25 - r * 0.10 * whipEase;
      leftY = defaultLY - r * 0.18 + r * 0.15 * whipEase;
      rightX = defaultRX + lungeX;
      rightY = defaultRY + lungeY;
    } else if (progress < lockP) {
      // Phase 4: Impact Lock (Firmly sustained on target)
      lungeX = r * 0.40;
      lungeY = -r * 0.05;
      bladeRot = 1.15;
      leftX = defaultLX + r * 0.15;
      leftY = defaultLY - r * 0.03;
      rightX = defaultRX + lungeX;
      rightY = defaultRY + lungeY;
    } else {
      // Phase 5: Recovery Settle (Decelerating return to guard)
      const rp = (progress - lockP) / (1.0 - lockP);
      const settleEase = Math.pow(1.0 - rp, 2.0);
      lungeX = r * 0.40 * settleEase;
      lungeY = -r * 0.05 * settleEase;
      bladeRot = 1.15 * settleEase;
      daggerAlpha = Math.max(0, 1.0 - rp * 1.3);
      leftX = defaultLX + (r * 0.15) * settleEase;
      leftY = defaultLY - (r * 0.03) * settleEase;
      rightX = defaultRX + lungeX;
      rightY = defaultRY + lungeY;
    }

    bloodDagger = {
      handX: rightX,
      handY: rightY,
      angle: bladeRot,
      alpha: daggerAlpha
    };
  }

  // ──────────────────────────────────────────
  // 2. PIERCING BLOOD (Charging Nozzle Clasp & Hypersonic Recoil)
  // ──────────────────────────────────────────
  else if (fighter.isChargingPiercingBlood || fighter.isFiringPiercingBlood) {
    if (fighter.isChargingPiercingBlood) {
      const cMax = fighter.piercingBloodChargeMax || 30;
      const elapsed = cMax - fighter.piercingBloodTimer;
      const p = Math.min(1.0, Math.max(0, elapsed / cMax));

      if (p < 0.35) {
        // Forward thrust from flanks into forward aperture clasp
        const subP = p / 0.35;
        const ease = 0.5 - 0.5 * Math.cos(subP * Math.PI);
        leftX = defaultLX + (r * 0.72 - defaultLX) * ease;
        leftY = defaultLY + (-handRadius * 0.45 - defaultLY) * ease;
        rightX = defaultRX + (r * 0.72 - defaultRX) * ease;
        rightY = defaultRY + (handRadius * 0.45 - defaultRY) * ease;
      } else {
        // Aperture nozzle lock & tension tremor
        let tremorX = 0;
        let tremorY = 0;
        if (p >= 0.80) {
          // High-frequency vibration as blood reaches Mach 3 pressure
          tremorX = (Math.random() - 0.5) * 1.5;
          tremorY = (Math.random() - 0.5) * 1.5;
        }
        leftX = r * 0.75 + tremorX;
        leftY = -handRadius * 0.45 + tremorY;
        rightX = r * 0.75 + tremorX;
        rightY = handRadius * 0.45 + tremorY;
      }

      apertureNozzle = {
        x: r * 0.80,
        y: 0,
        progress: p
      };
    } else {
      // Supersonic Beam Discharge & Recoil Kickback
      const bMax = fighter.piercingBloodBeamMax || 36;
      const elapsed = bMax - fighter.piercingBloodTimer;
      const t = Math.min(1.0, Math.max(0, elapsed / bMax));

      if (t < 0.16) {
        // Instant backward recoil kickback (0 to 6 frames)
        const kickP = Math.sin((t / 0.16) * Math.PI * 0.5);
        leftX = r * 0.75 - r * 0.55 * kickP;
        leftY = -handRadius * 0.45 - r * 0.15 * kickP;
        rightX = r * 0.75 - r * 0.55 * kickP;
        rightY = handRadius * 0.45 + r * 0.15 * kickP;
      } else {
        // Power ease recovery (6 to 36 frames)
        const recP = (t - 0.16) / 0.84;
        const e = 1.0 - Math.pow(1.0 - recP, 2.5);
        const recoilLX = r * 0.20;
        const recoilLY = -handRadius * 0.45 - r * 0.15;
        const recoilRX = r * 0.20;
        const recoilRY = handRadius * 0.45 + r * 0.15;

        leftX = recoilLX + (defaultLX - recoilLX) * e;
        leftY = recoilLY + (defaultLY - recoilLY) * e;
        rightX = recoilRX + (defaultRX - recoilRX) * e;
        rightY = recoilRY + (defaultRY - recoilRY) * e;
      }
    }
  }

  // ──────────────────────────────────────────
  // 3. CONVERGENCE: SANGUINE RETALIATION SPRAY & LASER MATRIX
  // ──────────────────────────────────────────
  else if (fighter.isRetaliationSpraying || fighter.isCastingLaserMatrix || fighter.isClaspedForConvergence || (fighter.convergenceRecoveryTimer > 0)) {
    if (fighter.isRetaliationSpraying) {
      // Sanguine Spray Lift: Arms react to concussive hit, sweeping up-out
      const p = Math.min(1.0, Math.max(0, fighter.retaliationSprayTimer / 6.0));
      const liftP = Math.sin(p * Math.PI * 0.5);
      leftX = defaultLX - r * 0.16 * liftP;
      leftY = defaultLY - r * 0.48 * liftP;
      rightX = defaultRX + r * 0.16 * liftP;
      rightY = defaultLY - r * 0.48 * liftP;
    } else if (fighter.isCastingLaserMatrix && fighter.laserMatrixTimer > 0) {
      // Windup Inward Glide: Hands smoothly glide from flanks into prayer clasp
      const castMax = fighter.laserMatrixCastMax || 16;
      const elapsed = castMax - fighter.laserMatrixTimer;
      const p = Math.min(1.0, Math.max(0, elapsed / castMax));
      const s = 0.5 - 0.5 * Math.cos(p * Math.PI);

      const targetClaspLX = -handRadius * 0.65;
      const targetClaspRX = handRadius * 0.65;
      const targetClaspY = r * 0.22;

      leftX = defaultLX + (targetClaspLX - defaultLX) * s;
      leftY = defaultLY + (targetClaspY - defaultLY) * s;
      rightX = defaultRX + (targetClaspRX - defaultRX) * s;
      rightY = defaultRY + (targetClaspY - defaultRY) * s;

      if (p > 0.60) {
        palmSingularity = {
          x: 0,
          y: r * 0.22,
          radius: 3.0 * ((p - 0.60) / 0.40),
          isDiode: false
        };
      }
    } else if (fighter.isCastingLaserMatrix || fighter.isClaspedForConvergence) {
      // Diode Telegraph Hold: Locked in tight prayer clasp with micro-tremor
      const tremor = Math.sin(performance.now() * 0.05) * 0.8;
      leftX = -handRadius * 0.65 + tremor * 0.5;
      leftY = r * 0.22 + tremor * 0.3;
      rightX = handRadius * 0.65 + tremor * 0.5;
      rightY = r * 0.22 + tremor * 0.3;

      const pulse = Math.sin(performance.now() * 0.02) * 1.5;
      palmSingularity = {
        x: 0,
        y: r * 0.22,
        radius: 4.5 + pulse,
        isDiode: true
      };
    } else if (fighter.convergenceRecoveryTimer > 0) {
      // Smooth recovery glide from prayer clasp back to resting flanks
      const rMax = fighter.convergenceRecoveryMax || 14;
      const rp = 1.0 - (fighter.convergenceRecoveryTimer / rMax);
      const e = 1.0 - Math.pow(1.0 - rp, 2.5);

      const startClaspLX = -handRadius * 0.65;
      const startClaspRX = handRadius * 0.65;
      const startClaspY = r * 0.22;

      leftX = startClaspLX + (defaultLX - startClaspLX) * e;
      leftY = startClaspY + (defaultLY - startClaspY) * e;
      rightX = startClaspRX + (defaultRX - startClaspRX) * e;
      rightY = startClaspY + (defaultRY - startClaspY) * e;
    }
  }

  // ──────────────────────────────────────────
  // 4. SUPERNOVA: COMMANDING GRAVITATIONAL HOLD & CONCUSSIVE DETONATION SNAP
  // ──────────────────────────────────────────
  else if (fighter.isChargingSupernova || (fighter.supernovaDetonationTimer > 0)) {
    if (fighter.isChargingSupernova) {
      const wMax = fighter.supernovaWindupMax || 24;
      const elapsed = wMax - fighter.supernovaTimer;
      const p = Math.min(1.0, Math.max(0, elapsed / wMax));
      const s = 0.5 - 0.5 * Math.cos(p * Math.PI);

      // Sweeps both arms outward and upward into commanding hold
      const targetLX = -r * 1.04;
      const targetRX = r * 1.04;
      const targetY = -r * 0.15;

      leftX = defaultLX + (targetLX - defaultLX) * s;
      leftY = defaultLY + (targetY - defaultLY) * s;
      rightX = defaultRX + (targetRX - defaultRX) * s;
      rightY = defaultRY + (targetY - defaultRY) * s;

      // Pulsing cursed energy aura around open palms
      supernovaAura = {
        left: { x: leftX, y: leftY },
        right: { x: rightX, y: rightY },
        radius: 6.0 + Math.sin(performance.now() * 0.02) * 1.8
      };
    } else {
      // Concussive outward/downward detonation snap
      const dMax = fighter.supernovaDetonationMax || 14;
      const p = 1.0 - (fighter.supernovaDetonationTimer / dMax);

      if (p < 0.35) {
        // Locked at full explosive extension
        leftX = -r * 1.12;
        leftY = r * 0.18;
        rightX = r * 1.12;
        rightY = r * 0.18;
      } else {
        // Decelerates smoothly back to resting flanks
        const rp = (p - 0.35) / 0.65;
        const e = 1.0 - Math.pow(1.0 - rp, 2.5);
        leftX = -r * 1.12 + (defaultLX - (-r * 1.12)) * e;
        leftY = r * 0.18 + (defaultLY - r * 0.18) * e;
        rightX = r * 1.12 + (defaultRX - r * 1.12) * e;
        rightY = r * 0.18 + (defaultRY - r * 0.18) * e;
      }
    }
  }

  // ──────────────────────────────────────────
  // 5. SLICING EXORCIST (CHAKRAM THROW KINEMATICS)
  // ──────────────────────────────────────────
  else if (fighter.chakramThrowTimer > 0) {
    const tMax = fighter.chakramThrowMax || 16;
    const elapsed = tMax - fighter.chakramThrowTimer;
    const p = Math.min(1.0, Math.max(0, elapsed / tMax));

    if (p < 0.45) {
      // Phase 1: Asymmetrical Coiling Windup
      const wp = p / 0.45;
      const ease = 0.5 - 0.5 * Math.cos(wp * Math.PI);
      // Right hand coils back across chest
      rightX = defaultRX + (-r * 0.25 - defaultRX) * ease;
      rightY = defaultRY + (r * 0.44 - defaultRY) * ease;
      // Left hand raises in tactical front guard
      leftX = defaultLX + (-r * 0.78 - defaultLX) * ease;
      leftY = defaultLY + (-r * 0.08 - defaultLY) * ease;

      miniChakram = {
        x: rightX,
        y: rightY,
        rotation: performance.now() * 0.03
      };
    } else if (p < 0.70) {
      // Phase 2: Hypersonic Whip Strike
      const sp = (p - 0.45) / 0.25;
      const whipEase = Math.pow(sp, 2.4);
      rightX = -r * 0.25 + (r * 1.15 - (-r * 0.25)) * whipEase;
      rightY = r * 0.44 + (-r * 0.05 - r * 0.44) * whipEase;
      leftX = -r * 0.78 - r * 0.08 * whipEase;
      leftY = -r * 0.08 + r * 0.20 * whipEase;
    } else {
      // Phase 3: Follow-Through & Settle
      const rp = (p - 0.70) / 0.30;
      const settleEase = 1.0 - Math.pow(1.0 - rp, 2.2);
      rightX = r * 1.15 + (defaultRX - r * 1.15) * settleEase;
      rightY = -r * 0.05 + (defaultRY - (-r * 0.05)) * settleEase;
      leftX = -r * 0.86 + (defaultLX - (-r * 0.86)) * settleEase;
      leftY = r * 0.12 + (defaultLY - r * 0.12) * settleEase;
    }
  }

  // ──────────────────────────────────────────
  // 6. SANGUINE DARTS (RAPID NEEDLE FLICK KINEMATICS)
  // ──────────────────────────────────────────
  else if (fighter.dartThrowTimer > 0) {
    const dMax = fighter.dartThrowMax || 12;
    const elapsed = dMax - fighter.dartThrowTimer;
    const p = Math.min(1.0, Math.max(0, elapsed / dMax));

    if (p < 0.35) {
      // Phase 1: Needle Coil Back
      const wp = p / 0.35;
      const ease = Math.sin(wp * Math.PI * 0.5);
      rightX = defaultRX + (-r * 0.18) * ease;
      rightY = defaultRY + (r * 0.06) * ease;
      leftX = defaultLX;
      leftY = defaultLY;
      bloodDartNeedle = { x: rightX + 6, y: rightY, angle: 0 };
    } else if (p < 0.60) {
      // Phase 2: Rapid Forward Needle Flick
      const sp = (p - 0.35) / 0.25;
      const whip = Math.pow(sp, 2.0);
      rightX = (defaultRX - r * 0.18) + (r * 0.42) * whip;
      rightY = (defaultRY + r * 0.06) - (r * 0.24) * whip;
      leftX = defaultLX;
      leftY = defaultLY;
    } else {
      // Phase 3: Spring Settle back to default
      const rp = (p - 0.60) / 0.40;
      const settle = 1.0 - Math.pow(1.0 - rp, 2.2);
      const apexRX = defaultRX + r * 0.24;
      const apexRY = defaultRY - r * 0.18;
      rightX = apexRX + (defaultRX - apexRX) * settle;
      rightY = apexRY + (defaultRY - apexRY) * settle;
      leftX = defaultLX;
      leftY = defaultLY;
    }
  }

  // ──────────────────────────────────────────
  // RENDER PASS: Dynamic Arm Linkages & Hands
  // ──────────────────────────────────────────

  // 1. Draw Left Arm Linkage (Left Shoulder to Left Hand)
  _drawChosoArmLinkage(ctx, lShoulderX, lShoulderY, leftX, leftY, handRadius, r, true);

  // 2. Draw Right Arm Linkage (Right Shoulder to Right Hand)
  _drawChosoArmLinkage(ctx, rShoulderX, rShoulderY, rightX, rightY, handRadius, r, false);

  // 3. Render Ability Specific Visual Accents (Pre-Hand / In-Hand)
  if (bloodDagger) {
    _drawChosoBloodDagger(ctx, bloodDagger.handX, bloodDagger.handY, bloodDagger.angle, bloodDagger.alpha, r);
  }

  if (supernovaAura) {
    ctx.save();
    // Concentric cursed energy pulse around palms
    ctx.strokeStyle = 'rgba(255, 42, 85, 0.75)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(supernovaAura.left.x, supernovaAura.left.y, supernovaAura.radius, 0, Math.PI * 2);
    ctx.arc(supernovaAura.right.x, supernovaAura.right.y, supernovaAura.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(supernovaAura.left.x, supernovaAura.left.y, supernovaAura.radius * 0.55, 0, Math.PI * 2);
    ctx.arc(supernovaAura.right.x, supernovaAura.right.y, supernovaAura.radius * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (miniChakram) {
    ctx.save();
    ctx.translate(miniChakram.x, miniChakram.y);
    ctx.rotate(miniChakram.rotation);
    ctx.beginPath();
    ctx.arc(0, 0, 7.0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(220, 38, 38, 0.85)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#FF2A55';
    ctx.stroke();
    ctx.restore();
  }

  if (bloodDartNeedle) {
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(bloodDartNeedle.x, bloodDartNeedle.y - 1, 6, 2);
    ctx.fillStyle = '#FF2A55';
    ctx.fillRect(bloodDartNeedle.x - 2, bloodDartNeedle.y - 1.5, 4, 3);
    ctx.restore();
  }

  // 4. Draw Canonical Default Pair of Hands (Rule 20)
  drawPixelHand(ctx, leftX, leftY, handRadius, skinTone, '#0E0F14');
  drawPixelHand(ctx, rightX, rightY, handRadius, skinTone, '#0E0F14');

  // 5. Render Post-Hand Visual Accents (Palms Cupping Singularity / Aperture Nozzle)
  if (palmSingularity && palmSingularity.radius > 0.5) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(palmSingularity.x, palmSingularity.y, palmSingularity.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FF2A55';
    ctx.fill();

    if (palmSingularity.isDiode) {
      ctx.beginPath();
      ctx.arc(palmSingularity.x, palmSingularity.y, palmSingularity.radius * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }
    ctx.restore();
  }

  if (apertureNozzle) {
    ctx.save();
    const ringRadius = 5.0 + Math.sin(performance.now() * 0.03) * 1.2;
    ctx.beginPath();
    ctx.arc(apertureNozzle.x, apertureNozzle.y, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#FF2A55';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(apertureNozzle.x, apertureNozzle.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Main Skin Renderer for Choso
 */
export function drawChosoSkin(ctx, fighter) {
  const r = fighter.r || 25;

  ctx.save();
  ctx.translate(fighter.x, fighter.y - (fighter.z || 0));

  // 1. Orientation & Mirroring (Rule 19 Upright Front POV)
  const angle = fighter._isWinnerReveal ? 0 : (fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0));
  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  ctx.rotate(angle);

  const facingLeft = Math.abs(normAngle) > Math.PI / 2;
  if (facingLeft && !fighter.isSpinning) {
    ctx.scale(1, -1);
  }

  // 2. Procedural Pixel-Art Body (Rule 24 Toji Baseline)
  drawChosoPixelBody(ctx, r);

  // 3. Hair Asset Overlay (Rule 22 Standard)
  _drawChosoHair(ctx, r, facingLeft);

  // 4. Canonical Default Symmetrical Hand Layering & Dynamic Kinematics (Rule 20 & Rule 30)
  const shouldHideHands = Boolean(
    (typeof state !== 'undefined' && state.showSkinOnly) ||
    fighter.hideHands ||
    fighter.usesCustomHands
  );

  if (!shouldHideHands) {
    const handRadius = getHandSize(r * 0.30);
    const skinTone = '#EAD2C2';
    _drawChosoArmsAndHands(ctx, fighter, r, handRadius, skinTone);
  }

  // 5. Flowing Red Scale: Stack Vascular Marking Glow (when buff active)
  if (fighter.isFlowingRedScaleActive) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 30, 60, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    // Subtle capillary branches across cheeks
    ctx.moveTo(-r * 0.40, 0);
    ctx.lineTo(-r * 0.60, -r * 0.15);
    ctx.moveTo(r * 0.40, 0);
    ctx.lineTo(r * 0.60, -r * 0.15);
    ctx.stroke();
    ctx.restore();
  }

  // 6. Status Overlays
  if (typeof fighter.drawStatusOverlays === 'function') {
    fighter.drawStatusOverlays(ctx, r);
  }

  ctx.restore();
}

/**
 * Ghost model afterimage renderer for Choso's Flowing Red Scale dashes.
 */
export function drawChosoGhostSkin(ctx, x, y, angle = 0, r = 25, alpha = 0.5) {
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

  // Sanguine Cursed Energy Aura Disc
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(163, 29, 29, 0.28)';
  ctx.fill();

  drawChosoPixelBody(ctx, r);
  _drawChosoHair(ctx, r, facingLeft);

  ctx.restore();
}
