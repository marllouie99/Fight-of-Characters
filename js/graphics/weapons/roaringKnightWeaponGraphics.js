// ═══════════════════════════════════════════════════════════════════════════
// THE ROARING KNIGHT (Deltarune Chapter 3) — Weapon & Skill VFX Graphics
// Adheres strictly to:
// - Rule 11: Zero shadowBlur CPU filters
// - Rule 15: Double-tapered slash crescents
// - Rule 20: Canonical single-source hand grip on weapon hilt (no duplicate hands)
// - Rule 26: Clean concentric shockwave rings (anti-cobweb rule)
// - Rule 30: 5-Phase Melee Kinematics + Articulated Shoulder-to-Wrist Arm Linkage
// - Rule 35: Pre-baked offscreen hand gauntlet & glow caches
// ═══════════════════════════════════════════════════════════════════════════

import { getHandSize } from '../../core/config.js';
import { state } from '../../core/state.js';

const P = 2.0;
const _snap = (v) => Math.round(v / P) * P;

function _getParryShakeX(fighter) {
  const t = fighter?.parryShakeTimer || 0;
  return t > 0 ? Math.sin(t * 1.9) * 3.2 * Math.min(1, t / 8) : 0;
}

let _knightCircleGlowCanvas = null;

function _getKnightCircleGlowCanvas() {
  if (_knightCircleGlowCanvas) return _knightCircleGlowCanvas;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const gctx = c.getContext('2d');
  if (!gctx) return null;
  const grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.45, 'rgba(42, 0, 6, 0.22)');
  grad.addColorStop(0.82, 'rgba(155, 0, 20, 0.88)');
  grad.addColorStop(0.95, 'rgba(210, 12, 34, 0.55)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 128, 128);
  _knightCircleGlowCanvas = c;
  return _knightCircleGlowCanvas;
}

// ── Sprite Asset Caches ──
const BATTLE_FLURRY_SPRITE_SRC = 'Assets/model/roaring_knight/KnightBattleFlurry.png?v=2';
const FLURRY_CELL_W = 128;
const FLURRY_CELL_H = 90;
const FLURRY_ANCHOR_X = 72;
const FLURRY_ANCHOR_Y = 38;
const _rkSprites = {};
const _rkSpriteLoading = {};

function _loadRkSprite(key, src) {
  const existing = _rkSprites[key];
  if (existing && existing.complete && existing.naturalWidth > 0) {
    return existing;
  }
  if (!_rkSpriteLoading[key] && typeof Image !== 'undefined') {
    _rkSpriteLoading[key] = true;
    const img = new Image();
    img.onload = () => {
      _rkSprites[key] = img;
      _rkSpriteLoading[key] = false;
    };
    img.onerror = (e) => {
      console.warn(`Failed to load Roaring Knight sprite ${src}:`, e);
      _rkSpriteLoading[key] = false;
    };
    img.src = src;
    _rkSprites[key] = img;
  }
  return _rkSprites[key] || null;
}

export function _preloadRoaringKnightWeaponSprites() {
  _loadRkSprite('blackKnife', 'Assets/model/roaring_knight/BlackKnife.png?v=2');
  _loadRkSprite('fallingSword', 'Assets/model/roaring_knight/FallingSword.png?v=1');
  _loadRkSprite('starBullet', 'Assets/model/roaring_knight/StarBullet.png?v=1');
  _loadRkSprite('starBulletRed', 'Assets/model/roaring_knight/StarBulletRed.png?v=2');
  _loadRkSprite('starChild', 'Assets/model/roaring_knight/StarChild.png?v=1');
  _loadRkSprite('redSlash', 'Assets/model/roaring_knight/RedSlash.png?v=2');
  _loadRkSprite('swoonLine', 'Assets/model/roaring_knight/RoaringSwoonLine.png?v=2');
  _loadRkSprite('battleFlurry', BATTLE_FLURRY_SPRITE_SRC);
  return _rkSprites;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _preloadRoaringKnightWeaponSprites();
}

// ── Pre-Baked Obsidian Gauntlet Hand Cache (Rule 35 & Rule 20 Single-Source Hand) ──
const _rkGripCache = new Map();

function _getKnightGripCanvas(radius) {
  const r = Math.max(P * 2, radius);
  const intR = Math.round(r);
  if (_rkGripCache.has(intR)) return _rkGripCache.get(intR);
  if (typeof document === 'undefined') return null;

  const steps = Math.ceil(intR / P);
  const size = (steps * 2 + 2) * P;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const gctx = canvas.getContext('2d');
  gctx.imageSmoothingEnabled = false;
  const c = size / 2;

  for (let gy = -steps; gy <= steps; gy++) {
    for (let gx = -steps; gx <= steps; gx++) {
      const px = gx * P;
      const py = gy * P;
      const d = Math.hypot(px, py);
      if (d > intR + P * 0.6) continue;

      let col = '#0A0B10'; // Pitch-black shadow gauntlet matching Deltarune Knight
      if (d >= intR - P * 0.45) {
        col = '#0E0F14'; // Crisp manga ink outline
      } else if (d >= intR - P * 1.45) {
        col = '#FFFFFF'; // Crisp 1-pixel white rim outline
      } else if (Math.abs(px) <= P * 0.55 && Math.abs(py) <= P * 0.55) {
        col = '#FFFFFF'; // Signature Deltarune Knight open-palm white core dot
      }
      gctx.fillStyle = col;
      gctx.fillRect(c + px - P / 2, c + py - P / 2, P, P);
    }
  }

  _rkGripCache.set(intR, canvas);
  return canvas;
}

// ── Pre-Baked Radial Glow Sprite Cache (Rule 35 Zero Per-Frame Gradients) ──
const _rkGlowCache = new Map();

function _getRadialGlowCanvas(colorHex, sizePx = 64) {
  const key = `${colorHex}_${sizePx}`;
  if (_rkGlowCache.has(key)) return _rkGlowCache.get(key);
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = sizePx;
  canvas.height = sizePx;
  const cctx = canvas.getContext('2d');
  const half = sizePx / 2;
  const grad = cctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, colorHex);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  cctx.fillStyle = grad;
  cctx.fillRect(0, 0, sizePx, sizePx);

  _rkGlowCache.set(key, canvas);
  return canvas;
}

/**
 * Computes Rule 30 5-phase kinematic hand & blade offsets for Black Knife cleave.
 */
function _computeBlackKnifePose(fighter, r) {
  const phase = fighter.meleePhase || 0;
  const p = fighter.meleePhaseProgress || 0;
  const dirSign = fighter.meleeComboFlip ? -1 : 1; // Alternates downward & upward cleave

  // Canonical resting grip at lower-right flank (Rule 20)
  let handX = r * 0.78;
  let handY = r * 0.36;
  let bladeRot = -0.35 * dirSign;
  let drawArc = false;
  let arcProgress = 0;

  if (!fighter.isMeleeSwinging || phase === 0) {
    if (fighter.blockPoseTimer > 0) {
      const stance = fighter.parryStanceIndex || 0;
      const hitMax = Math.max(1, fighter.parryHitAnimMaxFrames || 18);
      const hitP = Math.max(0, Math.min(1, (fighter.parryHitAnimTimer || 0) / hitMax));
      const kick = Math.sin(hitP * Math.PI);
      if (stance === 1) {
        handX = r * (0.88 - 0.18 * kick);
        handY = r * (0.34 - 0.10 * kick);
        bladeRot = -1.62 - 0.28 * kick;
      } else if (stance === 2) {
        handX = r * (0.84 - 0.16 * kick);
        handY = r * (-0.36 + 0.08 * kick);
        bladeRot = 1.85 + 0.24 * kick;
      } else {
        handX = r * (0.92 - 0.18 * kick);
        handY = r * (-0.16 + 0.10 * kick);
        bladeRot = 1.48 + 0.26 * kick;
      }
    }
    return { handX, handY, bladeRot, drawArc, arcProgress, dirSign };
  }

  if (phase === 1) {
    // Windup: coil shoulder & wrist backward
    const ease = 1 - Math.pow(1 - p, 2);
    handX = r * (0.78 - 0.36 * ease);
    handY = r * (0.36 - 0.85 * dirSign * ease);
    bladeRot = (-0.35 - 1.55 * ease) * dirSign;
  } else if (phase === 2) {
    // Hold tension at apex
    handX = r * 0.42;
    handY = r * (0.36 - 0.85 * dirSign);
    bladeRot = -1.90 * dirSign;
  } else if (phase === 3) {
    // Blistering strike snap-through
    const ease = 1 - Math.pow(1 - p, 3);
    handX = r * (0.42 + 0.80 * ease);
    handY = r * (-0.49 * dirSign + 1.05 * dirSign * ease);
    bladeRot = (-1.90 + 3.05 * ease) * dirSign;
    drawArc = true;
    arcProgress = ease;
  } else if (phase === 4) {
    // Impact Lock with subtle impact vibration
    const quiver = Math.sin(p * Math.PI * 5) * 2.2;
    handX = r * 1.22 + quiver;
    handY = r * 0.56 * dirSign;
    bladeRot = 1.15 * dirSign;
    drawArc = true;
    arcProgress = 1.0;
  } else if (phase === 5) {
    // Smooth muscular recovery back to idle stance
    const ease = 1 - Math.pow(1 - p, 2);
    handX = r * (1.22 - 0.44 * ease);
    handY = r * (0.56 * dirSign + (0.36 - 0.56 * dirSign) * ease);
    bladeRot = (1.15 * dirSign) + (-0.35 * dirSign - 1.15 * dirSign) * ease;
  }

  return { handX, handY, bladeRot, drawArc, arcProgress, dirSign };
}

/**
 * Draws articulated shadow-arm linkage from shoulder pauldron to canonical gauntlet wrist (Rule 30).
 */
function _drawArmLinkage(ctx, r, handX, handY) {
  const shoulderX = r * 0.62;
  const shoulderY = r * 0.14;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = Math.max(4.5, r * 0.22);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(handX, handY);
  ctx.stroke();

  ctx.strokeStyle = '#0A0B10';
  ctx.lineWidth = Math.max(2.2, r * 0.11);
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(handX, handY);
  ctx.stroke();
}

function _getRoaringKnightWeaponCustom() {
  const raw = (typeof state !== 'undefined' && state.weaponCustomizations && state.weaponCustomizations.roaring_knight)
    ? state.weaponCustomizations.roaring_knight
    : null;
  return {
    offsetX: raw?.offsetX ?? 0,
    offsetY: raw?.offsetY ?? 0,
    scale: raw?.scale ?? 1.0,
    widthScale: raw?.widthScale ?? 1.0,
    lengthScale: raw?.lengthScale ?? 1.0,
    angleOffset: raw?.angleOffset ?? 0,
  };
}

/**
 * Shared Black Knife sprite & headless vector fallback renderer centered on grip origin (0, 0).
 */
function _drawBlackKnifeModel(ctx, r, customScale = 1.0, customLengthScale = 1.0, customWidthScale = 1.0) {
  const knifeImg = _loadRkSprite('blackKnife', 'Assets/model/roaring_knight/BlackKnife.png?v=2');
  const bladeLen = r * 2.25;
  const bladeH = bladeLen * (19 / 64);
  const gripAnchor = bladeLen * 0.22;

  ctx.save();
  ctx.scale(customScale * customLengthScale, customScale * customWidthScale);
  if (knifeImg && knifeImg.complete && knifeImg.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(knifeImg, -gripAnchor, -bladeH / 2, bladeLen, bladeH);
  } else {
    // Fallback vector blade matching flared pommel + asymmetrical katana point (headless verification)
    const tipX = bladeLen - gripAnchor;
    const buttX = -gripAnchor;
    ctx.fillStyle = '#0A0B10';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(buttX, -4);
    ctx.lineTo(buttX + 4, -1.5);
    ctx.lineTo(0, -3.5);
    ctx.lineTo(tipX * 0.84, -3.5);
    ctx.lineTo(tipX, -0.5);
    ctx.lineTo(tipX * 0.72, 3.2);
    ctx.lineTo(0, 4.2);
    ctx.lineTo(buttX + 4, 1.5);
    ctx.lineTo(buttX, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draws The Roaring Knight's held Black Knife, arm linkage, single-source gauntlet hand,
 * and active double-tapered slash arc. Supports Weapon Studio transforms.
 */
export function drawRoaringKnightBlackKnife(ctx, fighter) {
  if (typeof state !== 'undefined' && state.showSkinOnly) return;

  const r = fighter.r || 25;
  const angle = fighter._isWinnerReveal
    ? 0
    : (fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0));
  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  const facingLeft = Math.abs(normAngle) > Math.PI / 2;

  const pose = _computeBlackKnifePose(fighter, r);
  const custom = _getRoaringKnightWeaponCustom();
  const handPosX = pose.handX + custom.offsetX;
  const handPosY = pose.handY + custom.offsetY;

  const shakeAmt = _getParryShakeX(fighter);

  ctx.save();
  ctx.translate(fighter.x + shakeAmt, fighter.y - (fighter.z || 0));
  ctx.rotate(angle);
  if (facingLeft && !fighter.isSpinning) {
    ctx.scale(1, -1);
  }

  // 1. Articulated Shoulder-to-Wrist Arm Linkage (Rule 30)
  _drawArmLinkage(ctx, r, handPosX, handPosY);

  // 2. Slash Crescent VFX during active Strike / Lock phases (Rule 15)
  if (pose.drawArc) {
    const isPreRotatingSwing = fighter._basicRotatingSlash?.stage === 'basic_swing';
    const slashRadius = r * (isPreRotatingSwing ? 2.55 : 2.15);
    const startA = -1.65 * pose.dirSign;
    const endA = (-1.65 + 2.85 * Math.min(1, pose.arcProgress)) * pose.dirSign;
    const steps = 10;
    const minA = Math.min(startA, endA);
    const maxA = Math.max(startA, endA);

    ctx.fillStyle = 'rgba(10, 11, 16, 0.92)';
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = minA + (maxA - minA) * t;
      const outer = slashRadius + Math.sin(t * Math.PI) * (r * (isPreRotatingSwing ? 0.45 : 0.35));
      if (i === 0) ctx.moveTo(Math.cos(a) * outer, Math.sin(a) * outer);
      else ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const a = minA + (maxA - minA) * t;
      const inner = slashRadius - Math.pow(Math.sin(t * Math.PI), 1.15) * (r * (isPreRotatingSwing ? 0.56 : 0.42));
      ctx.lineTo(Math.cos(a) * inner, Math.sin(a) * inner);
    }
    ctx.closePath();
    ctx.fill();

    // Crisp Deltarune white ink contour around the crescent blade arc
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = isPreRotatingSwing ? 2.0 : 2.2;
    ctx.stroke();
  }

  // 3. Weapon Blade anchored at Hand Grip
  ctx.save();
  ctx.translate(handPosX, handPosY);
  ctx.rotate(pose.bladeRot + custom.angleOffset);
  _drawBlackKnifeModel(ctx, r, custom.scale, custom.lengthScale, custom.widthScale);

  // 4. Single-Source Shadow Gauntlet Hand over Grip (Rule 20)
  const handR = getHandSize(r * 0.25, fighter);
  const gripCanvas = _getKnightGripCanvas(handR);
  if (gripCanvas) {
    ctx.drawImage(gripCanvas, _snap(-gripCanvas.width / 2), _snap(-gripCanvas.height / 2));
  } else {
    ctx.fillStyle = '#0A0B10';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, handR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
  ctx.restore();
}

/**
 * Standalone Black Knife preview renderer for Weapon Studio & Weapon Index Screen.
 * Supports full Weapon Studio transformations (offsetX, offsetY, scale, widthScale, lengthScale, angleOffset).
 */
export function drawRoaringKnightWeaponPreview(ctx, x = 0, y = 0, angle = 0, r = 25, opts = {}) {
  const custom = _getRoaringKnightWeaponCustom();

  ctx.save();
  ctx.translate(x + custom.offsetX, y + custom.offsetY);
  ctx.rotate(angle + custom.angleOffset);
  _drawBlackKnifeModel(ctx, r, custom.scale, custom.lengthScale, custom.widthScale);

  if (opts.showHands !== false) {
    const handR = getHandSize ? getHandSize(r * 0.25) : (r * 0.25);
    const gripCanvas = _getKnightGripCanvas(handR);
    if (gripCanvas) {
      ctx.drawImage(gripCanvas, _snap(-gripCanvas.width / 2), _snap(-gripCanvas.height / 2));
    } else {
      ctx.fillStyle = '#0A0B10';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, handR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.restore();
}

const _rkSwordVariantCanvases = {};

function _buildSwordSolidMask(swordImg, w, h, color) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.drawImage(swordImg, 0, 0, w, h);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, w, h);
  return c;
}

function _getTrackingSwordVariantCanvas(variant, swordImg) {
  if (_rkSwordVariantCanvases[variant]) return _rkSwordVariantCanvases[variant];
  if (typeof document === 'undefined' || !swordImg || !swordImg.complete || swordImg.naturalWidth <= 0) {
    return null;
  }

  // Exact 1:1 native pixel grid of FallingSword.png (288x108 -> 72x27)
  const w = 72;
  const h = 27;
  const pad = 2;
  const out = document.createElement('canvas');
  out.width = w + pad * 2;
  out.height = h + pad * 2;
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = false;

  if (variant === 'white_flash' || variant === 'ghost_red') {
    const fill = variant === 'white_flash' ? '#FFFFFF' : '#DC2626';
    const mask = _buildSwordSolidMask(swordImg, w, h, fill);
    if (variant === 'white_flash') {
      octx.drawImage(mask, pad - 1, pad);
      octx.drawImage(mask, pad + 1, pad);
      octx.drawImage(mask, pad, pad - 1);
      octx.drawImage(mask, pad, pad + 1);
    }
    octx.drawImage(mask, pad, pad);
    _rkSwordVariantCanvases[variant] = out;
    return out;
  }

  if (variant === 'tunnel_dark' || variant === 'tunnel_crimson') {
    const isCrimson = variant === 'tunnel_crimson';
    const rimMask = _buildSwordSolidMask(swordImg, w, h, isCrimson ? '#FF2038' : '#FFFFFF');
    const bodyMask = _buildSwordSolidMask(swordImg, w, h, isCrimson ? '#3A050B' : '#0A0B10');
    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      octx.drawImage(rimMask, pad + ox, pad + oy);
    }
    octx.drawImage(bodyMask, pad, pad);
    octx.fillStyle = isCrimson ? '#FF4D66' : '#FFFFFF';
    octx.fillRect(pad + 32, pad + 12, 6, 3);
    _rkSwordVariantCanvases[variant] = out;
    return out;
  }

  const rimColor = variant === 'red_freeze' ? '#FF2E4D' : '#CBD5E1';
  const rimMask = _buildSwordSolidMask(swordImg, w, h, rimColor);
  for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    octx.drawImage(rimMask, pad + ox, pad + oy);
  }
  octx.drawImage(swordImg, pad, pad, w, h);

  if (variant === 'red_freeze') {
    // Multiply-tint ONLY the white oval hilt eye cavity (29..40 x 10..16 in 72x27 grid), keeping dark iris black
    octx.save();
    octx.globalCompositeOperation = 'multiply';
    octx.fillStyle = '#FF2E4D';
    octx.fillRect(pad + 29, pad + 10, 12, 7);
    octx.restore();
  }

  _rkSwordVariantCanvases[variant] = out;
  return out;
}

function _drawVectorSwordFallback(ctx, drawW, drawH, fill, stroke, eyeColor) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-drawW / 2, -2.5);
  ctx.lineTo(-drawW * 0.24, -drawH * 0.48);
  ctx.lineTo(-drawW * 0.14, -3.5);
  ctx.lineTo(drawW / 2, 0);
  ctx.lineTo(-drawW * 0.14, 3.5);
  ctx.lineTo(-drawW * 0.24, drawH * 0.48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (eyeColor) {
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(-drawW * 0.04, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function _drawTrackingSwordSprite(ctx, sword, swordImg) {
  const phase = sword.swordPhase || 'track';
  const scale = sword.scale ?? 1.2;
  const drawW = 72 * scale;
  const drawH = 27 * scale;
  const jitter = phase === 'white_flash' ? (sword.flashJitter || 0) : 0;
  const pullBack = sword.pullBackPx || 0;
  const baseAlpha = sword.alpha ?? 1;

  ctx.translate(-pullBack - jitter, 0);
  ctx.globalAlpha = baseAlpha;

  if (phase === 'white_flash') {
    const whiteC = _getTrackingSwordVariantCanvas('white_flash', swordImg);
    if (whiteC) {
      const cw = whiteC.width * scale;
      const ch = whiteC.height * scale;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(whiteC, -cw / 2, -ch / 2, cw, ch);
      return;
    }
    _drawVectorSwordFallback(ctx, drawW, drawH, '#FFFFFF', '#FFFFFF', null);
    return;
  }

  const greyC = _getTrackingSwordVariantCanvas('track_grey', swordImg);
  const redC = _getTrackingSwordVariantCanvas('red_freeze', swordImg);
  if (greyC && redC) {
    const cw = greyC.width * scale;
    const ch = greyC.height * scale;
    ctx.imageSmoothingEnabled = false;
    if (phase === 'red_freeze') {
      const fp = Math.max(0, Math.min(1, sword.freezeProgress ?? 1));
      if (fp < 0.99) {
        ctx.drawImage(greyC, -cw / 2, -ch / 2, cw, ch);
      }
      ctx.globalAlpha = baseAlpha * (0.28 + 0.72 * fp);
      ctx.drawImage(redC, -cw / 2, -ch / 2, cw, ch);
    } else {
      ctx.drawImage(greyC, -cw / 2, -ch / 2, cw, ch);
    }
    return;
  }

  if (phase === 'red_freeze') {
    _drawVectorSwordFallback(ctx, drawW, drawH, '#0A0B10', '#FF2E4D', '#FF2E4D');
  } else {
    _drawVectorSwordFallback(ctx, drawW, drawH, '#0A0B10', '#CBD5E1', '#E2E8F0');
  }
}

/**
 * Draws Tracking Sword (Skill 1), Blade Corridor blade, or standalone Falling Sword entity.
 */
export function drawFallingSwordEntity(ctx, sword) {
  if (!sword) return;
  const swordImg = _loadRkSprite('fallingSword', 'Assets/model/roaring_knight/FallingSword.png?v=1');

  ctx.save();
  ctx.translate(sword.x, sword.y);

  if (sword.isTrackingSword) {
    ctx.rotate(sword.angle);
    _drawTrackingSwordSprite(ctx, sword, swordImg);
    ctx.restore();
    return;
  }

  // Crisp crimson trajectory lock-on sightline during Blade Corridor telegraph
  if (sword.telegraphTimer > 0) {
    const lineLen = sword.telegraphLength || 260;
    const alpha = Math.min(0.92, Math.max(0.28, sword.telegraphTimer / 18));
    ctx.strokeStyle = `rgba(255, 46, 77, ${alpha.toFixed(2)})`;
    ctx.lineWidth = sword.isCorridorBlade ? 1.5 : 2.0;
    ctx.setLineDash(sword.telegraphLocked ? [] : [7, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(sword.angle) * lineLen, Math.sin(sword.angle) * lineLen);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.rotate(sword.angle);
  const drawW = 46;
  const drawH = 18;
  if (swordImg && swordImg.complete && swordImg.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(swordImg, -drawW / 2, -drawH / 2, drawW, drawH);
  } else {
    _drawVectorSwordFallback(ctx, drawW, drawH, '#0A0B10', '#FFFFFF', null);
  }

  ctx.restore();
}

function _drawTrackingSwordDashTrail(ctx, slash, span) {
  const swordImg = _loadRkSprite('fallingSword', 'Assets/model/roaring_knight/FallingSword.png?v=1');
  const ghostCanvas = _getTrackingSwordVariantCanvas('ghost_red', swordImg);
  const mult = slash.dashTimer >= (slash.maxDashFrames || 2) ? 1.0 : 0.55;
  const scale = slash.scale ?? 1.2;
  const count = 28;
  const halfSpan = span * 0.56;
  const startLocalX = (slash.ox !== undefined && slash.oy !== undefined)
    ? ((slash.ox - slash.cx) * Math.cos(slash.angle) + (slash.oy - slash.cy) * Math.sin(slash.angle))
    : -halfSpan;
  const endLocalX = startLocalX + span * 1.12;

  ctx.save();
  ctx.translate(slash.cx, slash.cy);
  ctx.rotate(slash.angle);

  // Subtle crimson velocity streak bridging the ghost afterimages
  ctx.fillStyle = `rgba(220, 38, 38, ${(0.22 * mult).toFixed(3)})`;
  ctx.beginPath();
  ctx.moveTo(startLocalX, -2.5);
  ctx.lineTo(endLocalX, 0);
  ctx.lineTo(startLocalX, 2.5);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < count; i++) {
    const frac = i / (count - 1);
    const xPos = startLocalX + (endLocalX - startLocalX) * frac;
    ctx.globalAlpha = (0.10 + 0.52 * frac) * mult;
    if (ghostCanvas) {
      const cw = ghostCanvas.width * scale;
      const ch = ghostCanvas.height * scale;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(ghostCanvas, xPos - cw / 2, -ch / 2, cw, ch);
    } else {
      ctx.save();
      ctx.translate(xPos, 0);
      _drawVectorSwordFallback(ctx, 68 * scale, 25 * scale, 'rgba(220, 38, 38, 0.85)', '#FF2E4D', null);
      ctx.restore();
    }
  }
  ctx.restore();
}

/**
 * Draws the crimson ghost-sword streak followed by the white board slash for Skill 1 (Tracking Sword).
 */
export function drawTrackingSwordSlashVFX(ctx, slash) {
  if (!slash) return;
  const span = slash.span || 680;

  if (slash.dashTimer > 0) {
    _drawTrackingSwordDashTrail(ctx, slash, span);
    return;
  }

  if (slash.slashTimer <= 0) return;

  const p = 1 - slash.slashTimer / Math.max(1, slash.maxSlashFrames || 8);
  const alpha = Math.max(0, 1 - Math.pow(p, 1.45));
  const coreHalfW = Math.max(0.5, 4.2 * (1 - p * 0.82));

  ctx.save();
  if (slash.arenaBounds) {
    const b = slash.arenaBounds;
    ctx.beginPath();
    if (b.shape === 'circle') {
      ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.radius ?? b.width / 2, 0, Math.PI * 2);
    } else {
      ctx.rect(b.x, b.y, b.width, b.height);
    }
    ctx.clip();
  }

  ctx.translate(slash.cx, slash.cy);
  ctx.rotate(slash.angle);

  if (p < 0.45) {
    const redAlpha = (0.48 * (1 - p / 0.45)).toFixed(3);
    const redW = coreHalfW * 2.1;
    ctx.fillStyle = `rgba(255, 36, 72, ${redAlpha})`;
    ctx.beginPath();
    ctx.moveTo(-span, 0);
    ctx.lineTo(0, -redW);
    ctx.lineTo(span, 0);
    ctx.lineTo(0, redW);
    ctx.closePath();
    ctx.fill();
  }

  // Razor-sharp pointed white diamond cut across bullet board (matching hell_surface additive slash)
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.moveTo(-span, 0);
  ctx.lineTo(0, -coreHalfW);
  ctx.lineTo(span, 0);
  ctx.lineTo(0, coreHalfW);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function _drawHexagramStarPath(ctx, outerR, innerR) {
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const r = (i % 2 === 0) ? outerR : innerR;
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function _drawStarLineBeam(ctx, reach, halfTipW, segmentedFrac = 0) {
  // Sharp black-bordered white Deltarune beam (pointed at fingertip, wider across box)
  const segments = segmentedFrac > 0 ? [
    [0.06, 0.22],
    [0.30, 0.56],
    [0.64, 0.92],
  ] : [[0, 1]];

  for (const [s0, s1] of segments) {
    const x0 = reach * s0;
    const x1 = reach * s1;
    const w0 = Math.max(0.4, halfTipW * (0.22 + 0.78 * s0));
    const w1 = Math.max(0.6, halfTipW * (0.22 + 0.78 * s1));

    ctx.fillStyle = '#0E0F14';
    ctx.beginPath();
    ctx.moveTo(x0, -w0 - 1.2);
    ctx.lineTo(x1, -w1 - 1.2);
    ctx.lineTo(x1, w1 + 1.2);
    ctx.lineTo(x0, w0 + 1.2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(x0, -w0);
    ctx.lineTo(x1, -w1);
    ctx.lineTo(x1, w1);
    ctx.lineTo(x0, w0);
    ctx.closePath();
    ctx.fill();
  }
}

function _drawStarConeWedge(ctx, reach, tipY, fillStyle, borderStyle, borderWidth = 1.6, innerFillStyle = null, innerScale = 0.65) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(reach, -tipY);
  ctx.lineTo(reach, tipY);
  ctx.closePath();
  ctx.fill();

  if (innerFillStyle) {
    ctx.fillStyle = innerFillStyle;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(reach, -tipY * innerScale);
    ctx.lineTo(reach, tipY * innerScale);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = borderStyle;
  ctx.lineWidth = borderWidth;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(reach, -tipY);
  ctx.moveTo(0, 0);
  ctx.lineTo(reach, tipY);
  ctx.stroke();
}

function _drawStarConeWindStrips(ctx, reach, halfAngle, tick, coneProgress = 0.5) {
  const tipY = Math.tan(halfAngle) * reach;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(reach, -tipY);
  ctx.lineTo(reach, tipY);
  ctx.closePath();
  ctx.clip();

  // Fast-scrolling additive wind streaks pulling inward along cone axis
  ctx.fillStyle = `rgba(226, 174, 255, ${(0.22 + 0.14 * (1 - coneProgress)).toFixed(3)})`;
  for (let i = 0; i < 6; i++) {
    const scroll = 1 - (((tick * 0.085) + i * 0.167) % 1);
    const sx = Math.max(12, scroll * reach);
    const syFrac = ((i * 0.37) % 1) * 1.5 - 0.75;
    const sy = Math.tan(halfAngle) * sx * syFrac;
    const sw = 24 + (i % 3) * 14;
    ctx.fillRect(sx - sw, sy - 0.9, sw, 1.8);
  }

  // Subtle horizontal scanline grate flicker inside cone (matching spr_knight_line_grate)
  const grateOffset = (tick * 3) % 10;
  ctx.fillStyle = 'rgba(246, 224, 255, 0.11)';
  for (let gy = -tipY + grateOffset; gy < tipY; gy += 10) {
    ctx.fillRect(10, gy, reach - 10, 1.4);
  }
  ctx.restore();
}

/**
 * Draws Roaring Knight's Phase 1 STARS B&W intro beam -> purple cone -> synced B&W outro beam & cone collapse.
 */
export function drawStarConeVFX(ctx, cone) {
  if (!cone) return;
  const bounds = cone.arenaBounds || { x: 45, y: 240, width: 450, height: 450 };
  const reach = cone.reach || 520;
  const halfAngle = cone.halfAngle || 0.46;
  const tick = cone.tick || 0;
  const phase = cone.phase || 'cone';

  ctx.save();
  ctx.beginPath();
  ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.clip();

  ctx.translate(cone.originX, cone.originY);
  ctx.rotate(cone.angle);

  if (phase === 'intro') {
    const p = 1 - cone.timer / Math.max(1, cone.introMaxFrames || 12);
    const curReach = reach * Math.min(1, 0.25 + p * 1.15);
    const segmented = p < 0.38 ? 1 : 0;
    const halfW = p < 0.65 ? 1.1 : (1.1 + (p - 0.65) * 2.2);
    // Twin jittered hairline wind strips pulling along aim axis during intro
    ctx.fillStyle = 'rgba(235, 220, 255, 0.55)';
    const j1 = ((tick % 3) - 1) * 1.4;
    ctx.fillRect(14, -4.5 + j1, curReach * 0.72, 1.2);
    ctx.fillRect(28, 4.5 - j1, curReach * 0.68, 1.2);
    _drawStarLineBeam(ctx, curReach, halfW, segmented);
  } else if (phase === 'open_flash') {
    const p = 1 - cone.timer / Math.max(1, cone.openMaxFrames || 4);
    const openEase = 1 - Math.pow(1 - p, 4);
    const tipY = Math.tan(halfAngle * (0.08 + 0.92 * openEase)) * reach;
    const alpha = (0.64 - 0.18 * p).toFixed(3);
    _drawStarConeWedge(ctx, reach, tipY, `rgba(240, 210, 255, ${alpha})`, 'rgba(255, 255, 255, 0.90)', 1.6);
  } else if (phase === 'flash_close') {
    const p = 1 - cone.timer / Math.max(1, cone.closeMaxFrames || 4);
    const tipY = Math.tan(halfAngle * (1 - 0.76 * p)) * reach;
    const purpleAlpha = (0.30 + 0.08 * (1 - p)).toFixed(3);
    const innerAlpha = (0.28 * (1 - p * 0.4)).toFixed(3);
    _drawStarConeWedge(
      ctx, reach, tipY,
      `rgba(148, 52, 226, ${purpleAlpha})`,
      'rgba(218, 152, 255, 0.65)', 1.6,
      `rgba(240, 210, 255, ${innerAlpha})`, 0.75
    );
    _drawStarLineBeam(ctx, reach, 1.6 + 3.0 * p, 0);
  } else if (phase === 'outro') {
    const p = 1 - cone.timer / Math.max(1, cone.outroMaxFrames || 16);
    const tipY = Math.tan(halfAngle * Math.max(0.015, 0.24 * (1 - p))) * reach;
    const halfW = Math.max(0.5, 4.6 * (1 - p));
    const segmented = p >= 0.58 ? 1 : 0;

    // Fade residual purple cone sheath & B&W outro line together so both disappear in sync
    ctx.globalAlpha = Math.max(0, 1 - Math.pow(p, 1.35));
    _drawStarConeWedge(
      ctx, reach, tipY,
      'rgba(156, 66, 236, 0.34)',
      'rgba(206, 128, 255, 0.52)', 1.4,
      'rgba(235, 200, 255, 0.22)', 0.55
    );
    _drawStarLineBeam(ctx, reach, halfW, segmented);
  } else {
    const coneP = 1 - cone.timer / Math.max(1, cone.coneMaxFrames || 40);
    const shimmerRot = (tick % 2 === 0 ? 1 : -1) * 0.014;
    ctx.rotate(shimmerRot);
    const tipY = Math.tan(halfAngle) * reach;
    const rFill = Math.round(186 - 68 * coneP);
    const gFill = Math.round(112 - 84 * coneP);
    const bFill = Math.round(248 - 54 * coneP);
    _drawStarConeWedge(
      ctx, reach, tipY,
      `rgba(${rFill}, ${gFill}, ${bFill}, 0.30)`,
      'rgba(208, 134, 255, 0.48)', 1.6,
      'rgba(228, 186, 255, 0.14)', 0.55
    );
    _drawStarConeWindStrips(ctx, reach, halfAngle, tick, coneP);
  }

  ctx.restore();
}

function _drawStarTriBeam(ctx, angle, length, baseHalfWidth, colorStyle, alpha) {
  if (alpha <= 0.01 || length <= 1) return;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const px = -sin * baseHalfWidth;
  const py = cos * baseHalfWidth;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.fillStyle = colorStyle;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(-px, -py);
  ctx.lineTo(cos * length, sin * length);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function _drawStarRedLockBeams(ctx, star, sz, chargeP, isFinalPop) {
  const t = star.redLockTimer || 0;
  const flickerPeak = (t % 4) < 2;
  const flickerMult = flickerPeak ? 1.18 : 0.78;
  const isPhase3 = star.starVariant === 'phase3';
  const baseRot = star.rot || 0;
  const surgeMult = isFinalPop ? 1.45 : (0.65 + 0.55 * chargeP) * flickerMult;
  const beamLen = sz * (isPhase3 ? 1.55 : 1.35) * surgeMult;
  const baseW = isFinalPop ? 3.8 : (flickerPeak ? 2.6 : 1.7);
  const alpha = isFinalPop ? 0.96 : (flickerPeak ? 0.88 : 0.52);

  if (isPhase3) {
    // 6 squeezing crimson beams (vertical +-90 deg + 4 arms tightening 66 deg -> 5 deg)
    const spreadRad = (66 * Math.pow(Math.max(0, 1 - chargeP), 2) + 5) * (Math.PI / 180);
    const armAngles = [
      baseRot + Math.PI * 0.5,
      baseRot - Math.PI * 0.5,
      baseRot + Math.PI * 0.5 - spreadRad,
      baseRot + Math.PI * 0.5 + spreadRad,
      baseRot - Math.PI * 0.5 - spreadRad,
      baseRot - Math.PI * 0.5 + spreadRad,
    ];
    for (const a of armAngles) {
      _drawStarTriBeam(ctx, a, beamLen * 1.18, baseW * 1.45, 'rgba(255, 24, 62, 0.72)', alpha * 0.72);
      _drawStarTriBeam(ctx, a, beamLen * 0.92, baseW * 0.75, '#FFD9E2', alpha);
    }
    return;
  }

  // Phase 1: 6 flickering star point beams (24, 90, 156, 204, 270, 336 deg)
  const p1AnglesDeg = [24, 90, 156, 204, 270, 336];
  for (let i = 0; i < p1AnglesDeg.length; i++) {
    const a = baseRot + p1AnglesDeg[i] * (Math.PI / 180);
    const lenScale = (i % 2 === 1) ? 1.16 : 0.88;
    _drawStarTriBeam(ctx, a, beamLen * lenScale * 1.12, baseW * 1.55, 'rgba(255, 36, 72, 0.55)', alpha * 0.68);
    _drawStarTriBeam(ctx, a, beamLen * lenScale, baseW * 0.85, '#FFFFFF', alpha);
  }
}

/**
 * Draws spinning 6-pointed Star Bullet projectile (Phase 1 STARS: growing B&W -> ghost reverse -> red + 6 beams).
 */
export function drawStarBurstProjectile(ctx, star) {
  if (!star) return;
  const isRedLock = star.phase === 'red_lock';
  const t = star.redLockTimer || 0;
  const isFinalPop = isRedLock && t <= 4;
  const spr = _loadRkSprite('starBullet', 'Assets/model/roaring_knight/StarBullet.png?v=1');

  ctx.save();
  ctx.translate(star.x, star.y);

  const finalBloat = isFinalPop ? (1 + Math.min(1, Math.max(0, (4 - t) / 4)) * 0.42) : 1;
  const sz = Math.max(14, (star.radius || 17) * 2.25) * finalBloat;

  if (isRedLock) {
    const maxRed = Math.max(1, star.maxRedLockFrames || 22);
    const chargeP = Math.min(1, 1 - t / maxRed);

    // Draw the 6 tapered triangular beams before & behind core star pop
    _drawStarRedLockBeams(ctx, star, sz, chargeP, isFinalPop);

    // Lerp smooth grey -> crimson core fill, flashing solid white during final pop
    const rFill = Math.round(128 + (255 - 128) * chargeP);
    const gFill = Math.round(128 * (1 - chargeP));
    const bFill = Math.round(136 + (36 - 136) * chargeP);

    ctx.save();
    ctx.rotate(star.rot || 0);
    const outerR = sz * 0.5;
    // Pulsing additive outer shell (matching src/attacks/stars.rs scr_pingpong shell)
    const pulseAlpha = (Math.sin(t * 0.9) + 1) * 0.18 + 0.14;
    _drawHexagramStarPath(ctx, outerR * 1.12, outerR * 0.62);
    ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha.toFixed(3)})`;
    ctx.fill();

    _drawHexagramStarPath(ctx, outerR, outerR * 0.56);
    if (isFinalPop) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    } else {
      ctx.fillStyle = `rgb(${rFill}, ${gFill}, ${bFill})`;
      ctx.fill();
      ctx.strokeStyle = '#FF0024';
      ctx.lineWidth = Math.max(2.0, sz * 0.12);
      ctx.stroke();
    }
    ctx.restore();

    // Bright center glint core dot
    ctx.fillStyle = isFinalPop ? '#FFFFFF' : 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.arc(0, 0, isFinalPop ? 4.4 : 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.rotate(star.rot || 0);
    if (star.phase === 'reverse' || star.phase === 'pause') {
      ctx.globalAlpha = 0.72;
    }
    if (spr && spr.complete && spr.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(spr, -sz / 2, -sz / 2, sz, sz);
    } else {
      const outerR = sz * 0.5;
      _drawHexagramStarPath(ctx, outerR, outerR * 0.56);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#0E0F14';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Draws StarChild diamond shrapnel fragment emitted by Star Burst detonation.
 * Fragments fly freely past arena walls like in Deltarune.
 */
export function drawStarChildFragment(ctx, shard) {
  if (!shard) return;
  _drawStarChildFragmentBody(ctx, shard);
}

function _drawStarChildFragmentBody(ctx, shard) {

  if (shard.isVoidDiamond) {
    ctx.save();
    ctx.translate(shard.x, shard.y);
    ctx.rotate(shard.angle || 0);
    const len = 7.5;
    const wid = 3.8;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(len, 0);
    ctx.lineTo(0, -wid);
    ctx.lineTo(-len, 0);
    ctx.lineTo(0, wid);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (shard.isPhase3Crimson) {
    ctx.save();
    ctx.translate(shard.x, shard.y);
    ctx.rotate(shard.angle || 0);
    const isShooting = shard.shardPhase === 'shoot';
    if (isShooting) {
      // Subtle crimson velocity trail wake behind firing dart
      ctx.fillStyle = 'rgba(225, 29, 72, 0.34)';
      ctx.beginPath();
      ctx.moveTo(-4, -3.5);
      ctx.lineTo(-22, 0);
      ctx.lineTo(-4, 3.5);
      ctx.closePath();
      ctx.fill();
    }
    // Crisp Deltarune pointed crimson-outlined black shard
    ctx.fillStyle = '#0A0B10';
    ctx.strokeStyle = isShooting ? '#FF2E4D' : '#E11D48';
    ctx.lineWidth = isShooting ? 2.1 : 1.8;
    ctx.beginPath();
    ctx.moveTo(10.5, 0);
    ctx.lineTo(-6.5, -5.8);
    ctx.lineTo(-3.5, 0);
    ctx.lineTo(-6.5, 5.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  const spr = _loadRkSprite('starChild', 'Assets/model/roaring_knight/StarChild.png?v=1');
  const fadeAlpha = (shard.life !== undefined && shard.life < 12) ? Math.max(0, shard.life / 12) : 1;
  const glintPulse = 0.22 + 0.28 * (0.5 + 0.5 * Math.sin((shard.life || 0) * 0.45));

  ctx.save();
  ctx.globalAlpha = fadeAlpha;
  ctx.translate(shard.x, shard.y);
  ctx.rotate(shard.angle || 0);
  const w = 18;
  const h = 16;

  // Subtle pulsing outer glint diamond behind fading star shard
  ctx.fillStyle = `rgba(255, 255, 255, ${(glintPulse * fadeAlpha).toFixed(3)})`;
  ctx.beginPath();
  ctx.moveTo(w * 0.64, 0);
  ctx.lineTo(-w * 0.58, -h * 0.58);
  ctx.lineTo(-w * 0.58, h * 0.58);
  ctx.closePath();
  ctx.fill();

  if (spr && spr.complete && spr.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spr, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(-w / 2, -h / 2);
    ctx.lineTo(-w / 2, h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draws Roaring Swoon dimensional slash & staggered concentric shockwaves in stark B&W (Rule 26).
 */
export function drawRoaringSwoonVFX(ctx, fx) {
  if (!fx) return;

  ctx.save();
  ctx.translate(fx.x, fx.y);

  if (fx.kind === 'swoon_telegraph') {
    const p = 1 - fx.timer / fx.maxTimer;
    ctx.rotate(fx.angle);
    ctx.strokeStyle = `rgba(255, 46, 77, ${(0.55 + 0.40 * p).toFixed(2)})`;
    ctx.lineWidth = 1.8 + 1.4 * p;
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.lineTo(fx.reach || 560, 0);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${(0.80 * p).toFixed(2)})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(fx.reach || 560, 0);
    ctx.stroke();
  } else if (fx.kind === 'swoon_cut') {
    const p = 1 - fx.timer / fx.maxTimer;
    const alpha = Math.max(0, 1 - Math.pow(p, 1.3));
    ctx.globalAlpha = alpha;

    ctx.save();
    ctx.rotate(fx.angle);
    const len = fx.reach || 560;
    const h = Math.max(3, 18 * (1 - p));
    ctx.fillStyle = '#0A0B10';
    ctx.fillRect(-40, -h * 0.65, len + 40, h * 1.3);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-40, -h * 0.35, len + 40, h * 0.7);
    ctx.restore();
  } else if (fx.kind === 'star_detonate_flash') {
    const p = 1 - fx.timer / Math.max(1, fx.maxTimer);
    const alpha = Math.max(0, 1 - Math.pow(p, 1.15));
    const outerR = (fx.radius || 21) * (1.15 + p * 0.72);

    // Expanding white -> steel-grey hexagram burst matching Deltarune star pop
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.rotate(fx.rot || 0);
    _drawHexagramStarPath(ctx, outerR, outerR * 0.56);
    ctx.fillStyle = p < 0.35 ? '#FFFFFF' : (p < 0.7 ? '#D4D4D8' : '#71717A');
    ctx.fill();
    ctx.restore();

    // Brief peak flare flash cross on initial pop frames
    if (p < 0.45) {
      const fp = 1 - p / 0.45;
      const fLen = outerR * (2.6 + fp * 1.4);
      const fW = 3.2 * fp;
      ctx.fillStyle = `rgba(255, 255, 255, ${(0.88 * fp).toFixed(2)})`;
      ctx.beginPath();
      ctx.moveTo(-fLen, 0);
      ctx.lineTo(0, -fW);
      ctx.lineTo(fLen, 0);
      ctx.lineTo(0, fW);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -fLen * 0.85);
      ctx.lineTo(fW, 0);
      ctx.lineTo(0, fLen * 0.85);
      ctx.lineTo(-fW, 0);
      ctx.closePath();
      ctx.fill();
    }
  } else if (fx.kind === 'sword_afterimage_grow') {
    const p = 1 - fx.timer / Math.max(1, fx.maxTimer || 6);
    const growScale = (fx.scale ?? 1.2) * (1 + 0.85 * p);
    const swordImg = _loadRkSprite('fallingSword', 'Assets/model/roaring_knight/FallingSword.png?v=1');
    const redC = _getTrackingSwordVariantCanvas('red_freeze', swordImg);

    ctx.save();
    ctx.rotate(fx.angle || 0);
    ctx.globalAlpha = Math.max(0, 0.78 * (1 - p));
    if (redC) {
      const cw = redC.width * growScale;
      const ch = redC.height * growScale;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(redC, -cw / 2, -ch / 2, cw, ch);
    } else {
      _drawVectorSwordFallback(ctx, 72 * growScale, 27 * growScale, 'rgba(255, 46, 77, 0.45)', '#FF2E4D', '#FFFFFF');
    }
    ctx.restore();
  } else if (fx.kind === 'star_shockwave') {
    // Rule 26: Staggered sequential concentric B&W ripple rings (Zero radial spokes!)
    const p = 1 - fx.timer / fx.maxTimer;
    const maxR = fx.maxRadius || 90;
    const offsets = [0.0, 0.14, 0.28];
    for (let i = 0; i < offsets.length; i++) {
      const lp = (p - offsets[i]) / (1 - offsets[i]);
      if (lp <= 0 || lp >= 1) continue;
      const curR = maxR * Math.pow(lp, 0.68);
      const ringA = Math.pow(1 - lp, 1.25);
      ctx.fillStyle = `rgba(10, 11, 16, ${(0.12 * ringA).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(0, 0, curR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = i === 0
        ? `rgba(255, 255, 255, ${(0.92 * ringA).toFixed(3)})`
        : `rgba(14, 15, 20, ${(0.85 * ringA).toFixed(3)})`;
      ctx.lineWidth = Math.max(1.2, 3.2 * (1 - lp));
      ctx.beginPath();
      ctx.arc(0, 0, curR, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (fx.kind === 'ult_ricochet_streak') {
    const p = 1 - fx.timer / Math.max(1, fx.maxTimer || 8);
    const alpha = Math.max(0, 1 - p);
    const dx = (fx.tx ?? fx.x) - fx.x;
    const dy = (fx.ty ?? fx.y) - fx.y;
    ctx.strokeStyle = `rgba(255, 46, 77, ${(0.80 * alpha).toFixed(3)})`;
    ctx.lineWidth = Math.max(1.5, 4.5 * alpha);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(dx, dy);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${(0.95 * alpha).toFixed(3)})`;
    ctx.lineWidth = Math.max(1.0, 2.0 * alpha);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(dx, dy);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws an orbiting 4-pointed white star/shuriken around Roaring Knight (Starburst Shield).
 */
export function drawOrbitingStarEntity(ctx, star) {
  if (!star) return;
  const radius = star.radius || 12;
  const inner = radius * 0.32;

  ctx.save();
  ctx.translate(star.x, star.y);
  ctx.rotate(star.rot || 0);
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#0E0F14';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = (i % 2 === 0) ? radius : inner;
    const a = (i * Math.PI) / 4;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws Snowflake Matrix crimson telegraph lock-in rays & intersecting + / X white piercing beams.
 */
export function drawSnowflakeMatrixVFX(ctx, matrix) {
  if (!matrix || !matrix.beams || matrix.beams.length === 0) return;

  ctx.save();
  if (matrix.arenaBounds) {
    const { x, y, width, height } = matrix.arenaBounds;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
  }

  const isActive = matrix.phase === 'active';
  const isLock = matrix.phase === 'lock';

  for (const beam of matrix.beams) {
    if (!isActive) {
      const alpha = isLock ? 0.92 : Math.max(0.25, 0.7 * (matrix.progress || 0.5));
      ctx.strokeStyle = `rgba(255, 46, 77, ${alpha.toFixed(2)})`;
      ctx.lineWidth = isLock ? 2.6 : 1.6;
      ctx.setLineDash(isLock ? [] : [8, 6]);
      ctx.beginPath();
      ctx.moveTo(beam.x1, beam.y1);
      ctx.lineTo(beam.x2, beam.y2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (isLock) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(beam.x1, beam.y1);
        ctx.lineTo(beam.x2, beam.y2);
        ctx.stroke();
      }
      continue;
    }

    const fade = Math.max(0, Math.min(1, matrix.timer / Math.max(1, matrix.maxTimer)));
    const halfW = (matrix.halfWidth || 16) * (0.45 + 0.55 * Math.sin(Math.min(1, fade) * Math.PI * 0.5));

    ctx.strokeStyle = `rgba(14, 15, 20, ${(0.85 * fade).toFixed(2)})`;
    ctx.lineWidth = halfW * 2 + 4;
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y1);
    ctx.lineTo(beam.x2, beam.y2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${fade.toFixed(2)})`;
    ctx.lineWidth = halfW * 1.65;
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y1);
    ctx.lineTo(beam.x2, beam.y2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(248, 250, 252, ${fade.toFixed(2)})`;
    ctx.lineWidth = Math.max(2, halfW * 0.55);
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y1);
    ctx.lineTo(beam.x2, beam.y2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws the Gaping Maw arena-splitting flash & pitch-black void tear with crisp white borders.
 */
export function drawGapingMawVoidRift(ctx, rift) {
  if (!rift) return;
  const openEase = Math.min(1, (rift.maxTimer - rift.timer) / 6);
  const closeEase = rift.timer < 12 ? (rift.timer / 12) : 1;
  const halfW = (rift.halfWidth || 22) * openEase * closeEase;
  if (halfW <= 0.5 && (!rift.flashTimer || rift.flashTimer <= 0)) return;

  const span = rift.span || 820;

  ctx.save();
  if (rift.arenaBounds) {
    const { x, y, width, height } = rift.arenaBounds;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
  }

  ctx.translate(rift.cx, rift.cy);
  ctx.rotate(rift.angle);

  if (rift.flashTimer && rift.flashTimer > 0) {
    const flashP = Math.min(1, rift.flashTimer / Math.max(1, rift.maxFlashTimer || 8));
    // Soft translucent white halo + blinding white slash beam (zero shadowBlur)
    ctx.fillStyle = `rgba(255, 255, 255, ${(0.32 * flashP).toFixed(2)})`;
    ctx.fillRect(-span, -halfW * 1.15, span * 2, halfW * 2.3);
    ctx.fillStyle = `rgba(255, 255, 255, ${(0.96 * flashP).toFixed(2)})`;
    ctx.fillRect(-span, -6.5 * flashP - 1.5, span * 2, 13 * flashP + 3);
  } else {
    // Pitch-black void chasm slicing edge-to-edge across the arena
    ctx.fillStyle = `rgba(5, 6, 9, ${(0.96 * closeEase).toFixed(2)})`;
    ctx.fillRect(-span, -halfW, span * 2, halfW * 2);

    // Razor-sharp bright white edges framing the tear
    ctx.strokeStyle = `rgba(255, 255, 255, ${(0.96 * closeEase).toFixed(2)})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-span, -halfW);
    ctx.lineTo(span, -halfW);
    ctx.moveTo(-span, halfW);
    ctx.lineTo(span, halfW);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws the thin crimson targeting slice line before a Gaping Maw slash rips open.
 */
export function drawRiftSlashTelegraph(ctx, strike) {
  if (!strike || strike.delayTimer > 0 || strike.telegraphTimer <= 0) return;
  const span = strike.span || 820;
  const isLocked = Boolean(strike.isLocked);

  ctx.save();
  if (strike.arenaBounds) {
    const { x, y, width, height } = strike.arenaBounds;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
  }

  ctx.translate(strike.cx, strike.cy);
  ctx.rotate(strike.angle);
  ctx.strokeStyle = isLocked ? 'rgba(255, 46, 77, 0.95)' : 'rgba(255, 46, 77, 0.78)';
  ctx.lineWidth = isLocked ? 2.2 : 1.5;
  ctx.setLineDash(isLocked ? [] : [8, 6]);
  ctx.beginPath();
  ctx.moveTo(-span, 0);
  ctx.lineTo(span, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  if (isLocked) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.70)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-span, 0);
    ctx.lineTo(span, 0);
    ctx.stroke();
  }

  ctx.restore();
}

function _applyRkArenaClip(ctx, bounds) {
  if (!bounds) return;
  const bx = Number.isFinite(bounds.x) ? bounds.x : 0;
  const by = Number.isFinite(bounds.y) ? bounds.y : 0;
  const bw = Number.isFinite(bounds.width) ? bounds.width : 450;
  const bh = Number.isFinite(bounds.height) ? bounds.height : 450;
  ctx.beginPath();
  if (bounds.shape === 'circle') {
    ctx.arc(bx + bw / 2, by + bh / 2, bounds.radius ?? bw / 2, 0, Math.PI * 2);
  } else {
    ctx.rect(bx, by, bw, bh);
  }
  ctx.clip();
}

/**
 * Draws active Phase 3 Rotating Slash targeting lines:
 * - Stage 1 ('initial'): 3 intersecting rotating lines on Slash #1 -> 4 intersecting lines on Slashes #2-#6.
 * - Stage 2 ('finale_windup'): Triple-strand crimson reticle sweeping around the arena center.
 * - Stage 2 ('finale_barrage'): Subtle next-angle dashed guide trace at arena center.
 */
function _drawParallelCrimsonGuideLines(ctx, span, laneOffset, centerWidth, sideWidth, withWhiteCore) {
  for (const off of [-laneOffset, 0, laneOffset]) {
    const isCenter = off === 0;
    ctx.strokeStyle = isCenter ? 'rgba(255, 30, 56, 0.96)' : 'rgba(255, 46, 77, 0.56)';
    ctx.lineWidth = isCenter ? centerWidth : sideWidth;
    ctx.beginPath();
    ctx.moveTo(-span, off);
    ctx.lineTo(span, off);
    ctx.stroke();
  }
  if (withWhiteCore) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-span, 0);
    ctx.lineTo(span, 0);
    ctx.stroke();
  }
}

function _drawWindupSparks(ctx, seq, boardR, p) {
  if (p >= 0.08) return;
  const alpha = (1 - p / 0.08) * 0.85;
  ctx.save();
  ctx.translate(seq.boardCx, seq.boardCy);
  ctx.fillStyle = `rgba(255, 36, 64, ${alpha.toFixed(2)})`;
  for (let i = 0; i < 6; i++) {
    const a = (seq.windupStartAngle || 0.18) + (i * Math.PI) / 3 + p * 1.4;
    const dist = boardR * (1.06 + (i % 3) * 0.08) + p * 38;
    ctx.save();
    ctx.rotate(a);
    ctx.fillRect(dist, -1.2, 10, 2.4);
    ctx.restore();
  }
  ctx.restore();
}

function _drawKnightCircleFlash(ctx, boardR, p) {
  if (p >= 0.34) return;
  const fadeP = Math.max(0, 1 - p / 0.34);
  const rad = 24 + boardR * 1.15 * Math.pow(Math.min(1, p / 0.24), 0.72);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = fadeP * 0.92;
  const glowCanvas = _getKnightCircleGlowCanvas();
  if (glowCanvas) {
    ctx.drawImage(glowCanvas, -rad, -rad, rad * 2, rad * 2);
  } else {
    ctx.strokeStyle = 'rgba(160, 0, 22, 0.85)';
    ctx.lineWidth = Math.max(4, rad * 0.22);
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.84, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function _drawEchoParallelLines(ctx, span, lp, colorRgb) {
  if (!Number.isFinite(lp) || lp < 0 || lp >= 1) return;
  const off = lp * 48;
  const alpha = Math.max(0, 1 - lp) * 0.92;
  ctx.strokeStyle = `rgba(${colorRgb}, ${alpha.toFixed(2)})`;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-span, -off);
  ctx.lineTo(span, -off);
  ctx.moveTo(-span, off);
  ctx.lineTo(span, off);
  ctx.stroke();
}

function _drawWindupRotatingLine(ctx, seq, span) {
  const maxW = Math.max(1, seq.maxWindupFrames || 60);
  const p = Math.min(1, 1 - seq.windupTimer / maxW);
  const boardR = Math.max(180, (seq.arenaBounds?.width || 450) * 0.52);

  ctx.translate(seq.boardCx, seq.boardCy);

  // Early crimson board tint + obj_knight_circle black-core red radial flash (additive inside clipped box)
  if (p < 0.50) {
    const washAlpha = (0.28 * (1 - p / 0.50)).toFixed(2);
    ctx.fillStyle = `rgba(115, 6, 16, ${washAlpha})`;
    ctx.fillRect(-boardR * 2, -boardR * 2, boardR * 4, boardR * 4);
  }
  _drawKnightCircleFlash(ctx, boardR, p);

  ctx.rotate(seq.windupAngle || 0);

  // Smooth GML rgb(128,128,128) -> rgb(255,0,0) color approach + ys 3.0 -> 1.0 taper with black inner core
  const colorMix = Math.min(1, p / 0.44);
  const cr = Math.round(145 + (255 - 145) * colorMix);
  const cg = Math.round(145 + (16 - 145) * colorMix);
  const cb = Math.round(152 + (36 - 152) * colorMix);
  const colorRgb = `${cr}, ${cg}, ${cb}`;

  if (p < 0.44) {
    const bwMix = 1 - p / 0.44;
    const outerHalf = 2.6 + 6.4 * Math.pow(bwMix, 1.15);
    ctx.fillStyle = `rgba(${colorRgb}, ${(0.88 - bwMix * 0.10).toFixed(2)})`;
    ctx.fillRect(-span, -(outerHalf + 1.8), span * 2, (outerHalf + 1.8) * 2);
    if (bwMix > 0.08) {
      ctx.fillStyle = `rgba(255, 255, 255, ${(0.72 * Math.pow(bwMix, 1.5)).toFixed(2)})`;
      ctx.fillRect(-span, -outerHalf * 0.85, span * 2, outerHalf * 1.70);
      ctx.fillStyle = `rgba(6, 7, 11, ${(0.95 * Math.pow(bwMix, 0.7)).toFixed(2)})`;
      ctx.fillRect(-span, -outerHalf * 0.56, span * 2, outerHalf * 1.12);
    }
  } else {
    const lane = p >= 0.84 ? 3.2 : 4.6;
    _drawParallelCrimsonGuideLines(ctx, span, lane, 2.6, 1.15, seq.windupTimer <= 10);
  }

  _drawEchoParallelLines(ctx, span, seq.line2Progress, colorRgb);
  _drawEchoParallelLines(ctx, span, seq.line3Progress, colorRgb);
}

function _drawPhase1BeamAngles(ctx, seq, angles, p, span) {
  const boardR = Math.max(160, (seq.arenaBounds?.width || 450) * 0.44);

  ctx.translate(seq.boardCx, seq.boardCy);
  _drawKnightCircleFlash(ctx, boardR * 0.72, p);

  const colorMix = Math.min(1, p / 0.58);
  const cr = Math.round(145 + (255 - 145) * colorMix);
  const cg = Math.round(145 + (16 - 145) * colorMix);
  const cb = Math.round(152 + (36 - 152) * colorMix);
  const colorRgb = `${cr}, ${cg}, ${cb}`;
  const bwMix = Math.max(0, 1 - p / 0.58);
  const outerHalf = 2.2 + 4.8 * Math.pow(bwMix, 1.15);

  for (const ang of angles) {
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = `rgba(${colorRgb}, ${(0.88 - bwMix * 0.10).toFixed(2)})`;
    ctx.fillRect(-span, -(outerHalf + 1.4), span * 2, (outerHalf + 1.4) * 2);
    if (bwMix > 0.08) {
      ctx.fillStyle = `rgba(255, 255, 255, ${(0.68 * Math.pow(bwMix, 1.5)).toFixed(2)})`;
      ctx.fillRect(-span, -outerHalf * 0.85, span * 2, outerHalf * 1.70);
      ctx.fillStyle = `rgba(6, 7, 11, ${(0.94 * Math.pow(bwMix, 0.7)).toFixed(2)})`;
      ctx.fillRect(-span, -outerHalf * 0.54, span * 2, outerHalf * 1.08);
    } else if (p >= 0.72) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(-span, -0.7, span * 2, 1.4);
    }
    ctx.restore();
  }
}

function _drawPhase1RotatingAim(ctx, seq, span) {
  const maxW = Math.max(1, seq.maxAimFrames || 24);
  const p = Math.min(1, 1 - (seq.aimTimer || 0) / maxW);
  const n = Math.max(1, seq.lineCount || 1);
  const angles = [];
  for (let k = 0; k < n; k++) {
    angles.push((seq.windupAngle || 0) + (k * Math.PI) / n);
  }
  _drawPhase1BeamAngles(ctx, seq, angles, p, span);
}

function _drawFrontBarrageTelegraph(ctx, seq, span) {
  const maxW = Math.max(1, seq.maxWindupFrames || 18);
  const p = Math.min(1, 1 - (seq.windupTimer || 0) / maxW);
  const angles = Array.isArray(seq.telegraphAngles) && seq.telegraphAngles.length
    ? seq.telegraphAngles
    : [-0.74, 0.70, 0];
  _drawPhase1BeamAngles(ctx, seq, angles, p, span);
}

export function drawRotatingSlashTelegraph(ctx, seq) {
  if (!seq || seq.stage === 'ult_dash' || seq.stage === 'ult_swing') return;
  const span = seq.span || 780;
  const boardR = Math.max(180, (seq.arenaBounds?.width || 450) * 0.52);

  if (seq.stage === 'finale_windup' && !seq.isFrontBarrage) {
    const maxW = Math.max(1, seq.maxWindupFrames || 60);
    const p = Math.min(1, 1 - seq.windupTimer / maxW);
    _drawWindupSparks(ctx, seq, boardR, p);
  }

  ctx.save();
  _applyRkArenaClip(ctx, seq.arenaBounds);

  if (seq.stage === 'basic_aim') {
    _drawPhase1RotatingAim(ctx, seq, span);
  } else if (seq.stage === 'finale_windup') {
    if (seq.isFrontBarrage) {
      _drawFrontBarrageTelegraph(ctx, seq, span);
    } else {
      _drawWindupRotatingLine(ctx, seq, span);
    }
  } else if (seq.stage === 'finale_barrage' && !seq.isFrontBarrage && Number.isFinite(seq.nextAngle)) {
    ctx.translate(seq.boardCx, seq.boardCy);
    ctx.rotate(seq.nextAngle);
    _drawParallelCrimsonGuideLines(ctx, span, 3.8, 1.8, 0.95, true);
  }

  ctx.restore();
}

function _drawFinaleOuterWings(ctx, slash, p, span, bandHalf) {
  if (p >= 0.38) return;
  const wingAlpha = Math.max(0, 1 - p / 0.38) * 0.86;
  const isFiniteSlash = Number.isFinite(slash.halfLength);
  const cutSpan = isFiniteSlash ? slash.halfLength : span;

  ctx.save();
  ctx.translate(slash.cx, slash.cy);
  ctx.rotate(slash.angle || 0);
  ctx.globalAlpha = wingAlpha;
  ctx.fillStyle = p < 0.16 ? '#FF082C' : '#FF5C72';

  if (isFiniteSlash) {
    const wingReach = cutSpan * 1.14;
    const wingW = bandHalf * 0.82;
    ctx.beginPath();
    ctx.moveTo(-wingReach, 0);
    ctx.lineTo(-cutSpan * 0.35, -wingW);
    ctx.lineTo(cutSpan * 0.35, -wingW * 0.85);
    ctx.lineTo(wingReach, 0);
    ctx.lineTo(cutSpan * 0.35, wingW * 0.85);
    ctx.lineTo(-cutSpan * 0.35, wingW);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return;
  }

  // Forked twin crimson spikes bursting past the arena walls along both ends
  for (const forkSign of [-1, 1]) {
    ctx.save();
    ctx.rotate(forkSign * 0.032);
    ctx.beginPath();
    ctx.moveTo(-span * 0.88, forkSign * 3);
    ctx.lineTo(-span * 0.28, -bandHalf * 0.48);
    ctx.lineTo(span * 0.28, -bandHalf * 0.48);
    ctx.lineTo(span * 0.88, forkSign * 3);
    ctx.lineTo(span * 0.28, bandHalf * 0.48);
    ctx.lineTo(-span * 0.28, bandHalf * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function _drawFinaleInnerCut(ctx, slash, p, span, bandHalf) {
  const maxT = Math.max(1, slash.maxTimer || 18);
  const frameAge = p * maxT;
  const expDecay = Math.pow(0.812, frameAge); // 0.66/tick @ 30fps -> 0.812/frame @ 60fps
  const sDir = slash.slashDir || 1;
  const isFiniteSlash = Number.isFinite(slash.halfLength);
  const cutSpan = isFiniteSlash ? slash.halfLength : span;

  ctx.save();
  _applyRkArenaClip(ctx, slash.arenaBounds);
  ctx.translate(slash.cx, slash.cy);
  ctx.rotate(slash.angle || 0);

  // Subtle swept crimson bowtie sector behind legacy rotating cuts (p < 0.20)
  if (!isFiniteSlash && p < 0.20) {
    const prevA = slash.prevAngle;
    const deltaA = Number.isFinite(prevA) ? prevA - (slash.angle || 0) : 0;
    if (Math.abs(deltaA) > 0.005) {
      const ccw = deltaA > 0;
      ctx.fillStyle = `rgba(255, 8, 36, ${(0.52 * (1 - p / 0.20)).toFixed(2)})`;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, span, deltaA, 0, ccw);
      ctx.closePath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, span, deltaA + Math.PI, Math.PI, ccw);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Sharp double-tapered slash polygon (crimson -> salmon -> white)
  if (expDecay > 0.03) {
    const triHalf = Math.max(1.2, (slash.halfWidth || 28) * expDecay);
    const gb = Math.min(255, Math.round((1 - expDecay) * 255));
    const triAlpha = Math.min(1, expDecay * 1.85);
    ctx.fillStyle = `rgba(255, ${gb}, ${gb}, ${triAlpha.toFixed(2)})`;
    ctx.beginPath();
    if (isFiniteSlash) {
      const tipSpan = cutSpan * (0.94 + 0.10 * (1 - expDecay));
      ctx.moveTo(-sDir * tipSpan, 0);
      ctx.lineTo(-sDir * cutSpan * 0.18, -triHalf);
      ctx.lineTo(sDir * cutSpan * 0.42, -triHalf * 0.55);
      ctx.lineTo(sDir * tipSpan, 0);
      ctx.lineTo(sDir * cutSpan * 0.42, triHalf * 0.55);
      ctx.lineTo(-sDir * cutSpan * 0.18, triHalf);
    } else {
      const tailReach = cutSpan * 0.92 * expDecay;
      ctx.moveTo(-sDir * tailReach, 0);
      ctx.lineTo(sDir * cutSpan, -triHalf);
      ctx.lineTo(sDir * cutSpan, triHalf);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Lingering white hairline cut scar breaking into faint dashed scratches (p > 0.66)
  const lineAlpha = Math.max(0, 1 - Math.pow(p, 1.85));
  ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha.toFixed(2)})`;
  ctx.lineWidth = p < 0.22 ? 2.6 : Math.max(0.9, 1.9 * (1 - p * 0.6));
  if (p > 0.66) {
    ctx.setLineDash([18, 6, 8, 5]);
  }
  ctx.beginPath();
  ctx.moveTo(-cutSpan, 0);
  ctx.lineTo(cutSpan, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

/**
 * Draws spawned Phase 3 Rotating Slash cut waves:
 * - 'finale': Exponentially decaying triangle cut (crimson -> salmon -> white), bowtie sweep, & white scars.
 */
export function drawRotatingSlashVFX(ctx, slash) {
  if (!slash || slash.timer <= 0 || slash.mode === 'initial') return;
  const p = Math.min(1, 1 - slash.timer / Math.max(1, slash.maxTimer || 18));
  const span = slash.span || 780;
  const bandHalf = (slash.halfWidth || 28) * Math.max(0.08, Math.pow(1 - p, 1.35));

  if (slash.mode !== 'phase1') {
    _drawFinaleOuterWings(ctx, slash, p, span, bandHalf);
  }
  _drawFinaleInnerCut(ctx, slash, p, span, bandHalf);
}

/**
 * Draws Rotating Slash unclipped center diamond flash marks & wall-exit crimson debris shards (Rule 26).
 */
export function drawRotatingSlashShard(ctx, shard) {
  if (!shard || shard.timer <= 0) return;
  const p = Math.min(1, 1 - shard.timer / Math.max(1, shard.maxTimer || 8));
  const scaleLeft = Math.max(0, 1 - p);

  ctx.save();
  ctx.translate(shard.x, shard.y);
  ctx.rotate(shard.angle || 0);

  if (shard.kind === 'center_mark') {
    const rx = (shard.len || 92) * scaleLeft;
    const ry = (shard.halfW || 16) * scaleLeft;
    ctx.fillStyle = '#FF0024';
    ctx.beginPath();
    ctx.moveTo(-rx, 0);
    ctx.lineTo(0, -ry);
    ctx.lineTo(rx, 0);
    ctx.lineTo(0, ry);
    ctx.closePath();
    ctx.fill();

    const cx = rx * 0.72;
    const cy = ry * 0.72;
    ctx.fillStyle = '#06070C';
    ctx.beginPath();
    ctx.moveTo(-cx, 0);
    ctx.lineTo(0, -cy);
    ctx.lineTo(cx, 0);
    ctx.lineTo(0, cy);
    ctx.closePath();
    ctx.fill();
  } else {
    const rx = (shard.len || 16) * scaleLeft;
    const ry = (shard.halfW || 3.4) * scaleLeft;
    ctx.fillStyle = '#FF1230';
    ctx.beginPath();
    ctx.moveTo(-rx, 0);
    ctx.lineTo(0, -ry);
    ctx.lineTo(rx, 0);
    ctx.lineTo(0, ry);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function _drawFlurryBodyCoverShape(ctx, r, poseIdx) {
  ctx.fillStyle = '#050609';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.0;

  if (poseIdx === 0) {
    // Frame A (GIF F27/F30/F35): Huge forward-upward sweeping black-and-white blade cone
    ctx.beginPath();
    ctx.moveTo(-r * 0.22, r * 1.25);
    ctx.quadraticCurveTo(r * 0.95, r * 0.55, r * 2.48, -r * 0.98);
    ctx.quadraticCurveTo(r * 1.15, -r * 0.95, r * 0.10, -r * 0.35);
    ctx.lineTo(r * 0.48, r * 0.05);
    ctx.lineTo(-r * 0.28, r * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(r * 0.15, r * 0.90);
    ctx.quadraticCurveTo(r * 1.20, r * 0.18, r * 2.15, -r * 0.78);
    ctx.stroke();
    return;
  }

  if (poseIdx === 1) {
    // Frame B (GIF F28/F31/F33): Dense crossed 'X' black-filled slash barrage covering front of body
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.12, -dir * r * 1.18);
      ctx.quadraticCurveTo(r * 0.95, -dir * r * 0.22, r * 2.05, dir * r * 1.08);
      ctx.lineTo(r * 1.62, dir * r * 1.26);
      ctx.quadraticCurveTo(r * 0.68, dir * r * 0.14, -r * 0.32, -dir * r * 0.88);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    return;
  }

  // Frame C (GIF F29/F34/F36): Heavy downward sweeping forward crescent shroud
  ctx.beginPath();
  ctx.moveTo(-r * 0.20, -r * 0.92);
  ctx.quadraticCurveTo(r * 1.15, -r * 0.80, r * 2.38, r * 0.45);
  ctx.quadraticCurveTo(r * 1.45, r * 1.15, -r * 0.15, r * 1.05);
  ctx.lineTo(r * 0.22, r * 0.35);
  ctx.lineTo(-r * 0.32, -r * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

let _rkFlurryGhostCanvas = null;

function _getKnightFlurryGhostCanvas(flurryImg) {
  if (_rkFlurryGhostCanvas) return _rkFlurryGhostCanvas;
  if (typeof document === 'undefined' || !flurryImg || !flurryImg.complete || flurryImg.naturalWidth <= 0) {
    return null;
  }
  const c = document.createElement('canvas');
  c.width = flurryImg.naturalWidth;
  c.height = flurryImg.naturalHeight;
  const octx = c.getContext('2d');
  octx.imageSmoothingEnabled = false;
  octx.drawImage(flurryImg, 0, 0);
  octx.globalCompositeOperation = 'source-in';
  octx.fillStyle = '#FFFFFF';
  octx.fillRect(0, 0, c.width, c.height);
  _rkFlurryGhostCanvas = c;
  return c;
}

function _getReadyFlurrySprite() {
  const img = _loadRkSprite('battleFlurry', BATTLE_FLURRY_SPRITE_SRC);
  return img && img.complete && img.naturalWidth > 0 ? img : null;
}

/**
 * Returns whether the 3-frame KnightBattleFlurry sprite sheet is decoded and ready.
 */
export function isRoaringKnightFlurryReady() {
  return Boolean(_getReadyFlurrySprite());
}

function _drawFlurrySparks(ctx, r, tick, dirSign) {
  ctx.fillStyle = '#FF2038';
  for (let s = 0; s < 4; s++) {
    const sa = ((tick * 0.7 + s * 1.57) % 3.14) - 1.57;
    const sd = r * (1.25 + ((tick + s * 3) % 4) * 0.35);
    ctx.fillRect(dirSign * Math.cos(sa) * sd - 2.5, Math.sin(sa) * sd - 1.2, 5, 2.4);
  }
}

function _drawKnightFlurrySpriteAnim(ctx, fighter, seq, flurryImg, tick, angle, facingLeft, outroP) {
  const r = fighter.r || 25;
  const frameIdx = Math.floor(tick / 4) % 3; // ~67ms per frame matching Knight_battle_flurry.gif (70ms)
  const lean = Math.sin(angle) * (facingLeft ? -0.22 : 0.22);
  const shrink = seq.stage === 'finale_outro' ? (1 - outroP * 0.14) : 1;
  const drawScale = ((r * 3.65) / FLURRY_CELL_H) * shrink;
  const drawW = FLURRY_CELL_W * drawScale;
  const drawH = FLURRY_CELL_H * drawScale;
  const dx = -FLURRY_ANCHOR_X * drawScale;
  const dy = -FLURRY_ANCHOR_Y * drawScale;
  const sx = frameIdx * FLURRY_CELL_W;
  const baseAlpha = seq.stage === 'finale_outro' ? Math.max(0, 1 - outroP * 0.90) : 1;
  const echoSrc = _getKnightFlurryGhostCanvas(flurryImg) || flurryImg;

  const shakeAmt = _getParryShakeX(fighter);

  ctx.save();
  ctx.translate(fighter.x + shakeAmt, fighter.y - (fighter.z || 0));
  ctx.rotate(lean);
  if (!facingLeft) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;

  for (let g = 3; g >= 1; g--) {
    ctx.globalAlpha = baseAlpha * (0.06 * (4 - g));
    ctx.drawImage(echoSrc, sx, 0, FLURRY_CELL_W, FLURRY_CELL_H, dx + g * 12, dy, drawW, drawH);
  }
  ctx.globalAlpha = baseAlpha;
  ctx.drawImage(flurryImg, sx, 0, FLURRY_CELL_W, FLURRY_CELL_H, dx, dy, drawW, drawH);

  if (seq.stage !== 'finale_outro') {
    _drawFlurrySparks(ctx, r, tick, -1);
  }
  ctx.restore();
}

function _drawKnightFlurryVectorFallback(ctx, fighter, seq, tick, angle, facingLeft, outroP) {
  const r = fighter.r || 25;
  const shakeAmt = _getParryShakeX(fighter);

  ctx.save();
  ctx.translate(fighter.x + shakeAmt, fighter.y - (fighter.z || 0));
  ctx.rotate(angle);
  if (facingLeft && !fighter.isSpinning) ctx.scale(1, -1);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 1.1;
  for (let g = 1; g <= 3; g++) {
    ctx.beginPath();
    ctx.arc(-r * 0.45 * g, 0, r * 0.92, Math.PI * 0.65, Math.PI * 1.35);
    ctx.stroke();
  }

  if (seq.stage === 'finale_outro') {
    const scale = Math.max(0.25, 1 - outroP * 0.72);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(5, 6, 9, 0.88)';
    ctx.strokeStyle = `rgba(255, 255, 255, ${(0.90 * (1 - outroP * 0.65)).toFixed(2)})`;
    ctx.lineWidth = 1.8;
    for (let k = 0; k < 2; k++) {
      ctx.save();
      ctx.rotate(outroP * 3.8 + k * Math.PI * 0.55);
      ctx.beginPath();
      ctx.ellipse(r * 0.55, 0, r * 1.15, r * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    return;
  }

  _drawFlurryBodyCoverShape(ctx, r, Math.floor(tick / 4) % 3);
  _drawFlurrySparks(ctx, r, tick, 1);
  ctx.restore();
}

/**
 * Draws Roaring Knight's 3-frame KnightBattleFlurry animated sprite (or crisp B&W vector
 * slash-trail fallback when headless/unloaded) during Stage 2 of Rotating Slash.
 */
export function drawRoaringKnightFrontSlashTrail(ctx, fighter) {
  const seq = fighter?._rotatingSlashSeq;
  if (!seq || !seq.showFrontTrail) return;

  const angle = fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0);
  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  const facingLeft = Math.abs(normAngle) > Math.PI / 2;
  const tick = fighter._vfxTick || 0;
  const outroP = seq.stage === 'finale_outro'
    ? (1 - Math.max(0, seq.outroTimer || 0) / Math.max(1, seq.maxOutroFrames || 10))
    : 0;

  const flurryImg = _getReadyFlurrySprite();
  if (flurryImg) {
    _drawKnightFlurrySpriteAnim(ctx, fighter, seq, flurryImg, tick, angle, facingLeft, outroP);
    return;
  }
  _drawKnightFlurryVectorFallback(ctx, fighter, seq, tick, angle, facingLeft, outroP);
}

const _rkTunnelLongswordCanvases = {};

/**
 * Bakes Deltarune `spr_knight_diamondbullet_l` (longsword with crossguard, pommel & sharp spear tip)
 * once into an offscreen canvas quad (Rule 35).
 */
function _getTunnelLongswordCanvas(variant = 'normal') {
  if (_rkTunnelLongswordCanvases[variant]) return _rkTunnelLongswordCanvases[variant];
  if (typeof document === 'undefined') return null;

  const w = 96;
  const h = 26;
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const octx = canvas.getContext('2d');
  octx.imageSmoothingEnabled = false;

  const isWhite = variant === 'white';
  const isCrimson = variant === 'crimson';
  const fillCol = isWhite ? '#FFFFFF' : (isCrimson ? '#2E0408' : '#0A0B10');
  const rimCol = isWhite ? '#FFFFFF' : (isCrimson ? '#FF1E38' : '#FFFFFF');
  const ridgeCol = isWhite ? '#FFFFFF' : (isCrimson ? '#991B1B' : '#3E4150');

  // Longsword contour oriented right (+X = blade tip, -X = hilt/pommel)
  octx.beginPath();
  octx.moveTo(cx - 44, cy - 3);
  octx.lineTo(cx - 35, cy - 3);
  octx.lineTo(cx - 35, cy - 10); // Upper crossguard
  octx.lineTo(cx - 28, cy - 10);
  octx.lineTo(cx - 28, cy - 6);  // Stepped collar shoulder
  octx.lineTo(cx - 21, cy - 6);
  octx.lineTo(cx - 21, cy - 5);
  octx.lineTo(cx + 28, cy - 5);  // Straight upper blade edge
  octx.lineTo(cx + 46, cy);      // Sharp spearhead tip
  octx.lineTo(cx + 28, cy + 5);  // Straight lower blade edge
  octx.lineTo(cx - 21, cy + 5);
  octx.lineTo(cx - 21, cy + 6);
  octx.lineTo(cx - 28, cy + 6);
  octx.lineTo(cx - 28, cy + 10); // Lower crossguard
  octx.lineTo(cx - 35, cy + 10);
  octx.lineTo(cx - 35, cy + 3);
  octx.lineTo(cx - 44, cy + 3);
  octx.closePath();

  octx.fillStyle = fillCol;
  octx.fill();
  octx.strokeStyle = rimCol;
  octx.lineWidth = 1.8;
  octx.stroke();

  if (!isWhite) {
    // Crisp central fuller groove & hilt collar sheen
    octx.fillStyle = ridgeCol;
    octx.fillRect(cx - 26, cy - 1, 54, 2);
    octx.fillStyle = rimCol;
    octx.fillRect(cx - 33, cy - 4, 3, 8);
  }

  _rkTunnelLongswordCanvases[variant] = canvas;
  return canvas;
}

function _drawTunnelLongswordShape(ctx, w, h, fill, stroke) {
  const hw = w * 0.5;
  const hh = h * 0.5;
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.92, -hh * 0.25);
  ctx.lineTo(-hw * 0.72, -hh * 0.25);
  ctx.lineTo(-hw * 0.72, -hh * 0.85);
  ctx.lineTo(-hw * 0.58, -hh * 0.85);
  ctx.lineTo(-hw * 0.58, -hh * 0.45);
  ctx.lineTo(hw * 0.58, -hh * 0.42);
  ctx.lineTo(hw * 0.98, 0);
  ctx.lineTo(hw * 0.58, hh * 0.42);
  ctx.lineTo(-hw * 0.58, hh * 0.45);
  ctx.lineTo(-hw * 0.58, hh * 0.85);
  ctx.lineTo(-hw * 0.72, hh * 0.85);
  ctx.lineTo(-hw * 0.72, hh * 0.25);
  ctx.lineTo(-hw * 0.92, hh * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function _drawTunnelBeamHitbox(ctx, beam) {
  if (!beam || beam.life <= 0) return;
  const maxLife = Math.max(1, beam.maxLife || 12);
  const p = Math.max(0, Math.min(1, beam.life / maxLife));
  const len = Math.min(620, (beam.span || 620) * 0.86);
  const darkSword = _getTunnelLongswordCanvas('normal');
  const whiteSword = _getTunnelLongswordCanvas('white');

  ctx.save();
  ctx.translate(beam.x, beam.y);
  ctx.rotate(beam.angle);

  // Dense serrated longsword afterimage ribbon along Finisher Mach dash (st2b panels 8-11)
  const stamps = 10;
  for (let i = 0; i < stamps; i++) {
    const frac = i / (stamps - 1);
    const sx = frac * len;
    ctx.globalAlpha = Math.max(0, Math.min(0.88, p * (0.28 + 0.56 * frac)));
    const sprite = (p > 0.78 && i >= stamps - 2 && whiteSword) ? whiteSword : darkSword;
    if (sprite) {
      const cw = sprite.width;
      const ch = sprite.height * 0.74;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, sx - cw / 2, -ch / 2, cw, ch);
    } else {
      ctx.save();
      ctx.translate(sx, 0);
      _drawTunnelLongswordShape(ctx, 92, 19, '#0A0B10', '#FFFFFF');
      ctx.restore();
    }
  }

  ctx.restore();
}

function _drawTunnelAfterimageGrow(ctx, fx) {
  if (!fx || fx.life <= 0) return;
  const maxLife = Math.max(1, fx.maxLife || 10);
  const progress = 1 - fx.life / maxLife;
  const alpha = Math.max(0, fx.life / maxLife);
  const growScale = (fx.baseScale ?? 1.0) * (1 + progress * 2.1);
  const whiteCanvas = _getTunnelLongswordCanvas('white');

  ctx.save();
  ctx.translate(fx.x, fx.y);
  ctx.rotate(fx.angle || 0);
  ctx.globalAlpha = alpha * 0.85;
  if (whiteCanvas) {
    const dw = whiteCanvas.width * growScale;
    const dh = whiteCanvas.height * 0.78 * growScale;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(whiteCanvas, -dw / 2, -dh / 2, dw, dh);
  } else {
    _drawTunnelLongswordShape(ctx, 92 * growScale, 20 * growScale, '#FFFFFF', '#FFFFFF');
  }
  ctx.restore();
}

function _drawTunnelSwordSpritePass(ctx, sword) {
  const isFinisher = Boolean(sword.finisherStage && sword.finisherStage !== 'idle');
  const scaleH = Math.max(0.10, Math.min(1.30, sword.scaleY ?? 1));
  const useWhite = sword.finisherWhiteMix > 0.60;
  const useRed = sword.isDangerRed;
  const variant = useWhite ? 'white' : (useRed ? 'crimson' : 'normal');
  const sprite = _getTunnelLongswordCanvas(variant);

  // 8-sample lerped conveyor motion trail (sword_tunnel.rs `for i in 0..10` -> ribbed metallic walls)
  const dx = sword.x - (sword.prevX ?? sword.x);
  const dy = sword.y - (sword.prevY ?? sword.y);
  const moveDist = Math.hypot(dx, dy);
  const smearDistX = moveDist > 0.8 ? dx : (sword.smearX || 0);
  const smearDistY = moveDist > 0.8 ? dy : (sword.smearY || 0);
  if (Math.hypot(smearDistX, smearDistY) > 0.9) {
    const samples = 8;
    for (let s = 0; s < samples; s++) {
      const frac = s / samples;
      const sx = sword.x - smearDistX * (1 - frac);
      const sy = sword.y - smearDistY * (1 - frac);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(sword.angle);
      ctx.globalAlpha = 0.08 + 0.62 * frac;
      if (sprite) {
        const tw = sprite.width;
        const th = sprite.height * (isFinisher ? 0.74 : scaleH);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sprite, -tw / 2, -th / 2, tw, th);
      } else {
        _drawTunnelLongswordShape(ctx, 92, 24 * scaleH, useRed ? '#2E0408' : '#0A0B10', useRed ? '#FF1E38' : '#FFFFFF');
      }
      ctx.restore();
    }
  }

  ctx.save();
  ctx.translate(sword.x, sword.y);
  ctx.rotate(sword.angle);
  if (sprite) {
    const cw = sprite.width;
    const ch = sprite.height * (isFinisher ? 0.74 : scaleH);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, -cw / 2, -ch / 2, cw, ch);
  } else {
    _drawTunnelLongswordShape(
      ctx,
      92,
      24 * (isFinisher ? 0.74 : scaleH),
      useWhite ? '#FFFFFF' : (useRed ? '#2E0408' : '#0A0B10'),
      useRed ? '#FF1E38' : '#FFFFFF'
    );
  }
  ctx.restore();
}

/**
 * Draws Sword Tunnel waves, Phase 2 rotating spiral blades, Finisher crimson laser
 * telegraphs, AfterimageGrow bursts, and Mach serrated longsword trails (Rule 35, stack depth 0).
 */
export function drawSwordTunnelVisuals(ctx, fighter) {
  if (!fighter) return;
  const beamHitboxes = fighter.activeTunnelBeamHitboxes || [];
  const afterimages = fighter.activeTunnelAfterimages || [];
  const tunnelSwords = fighter.activeTunnelSwords || [];

  // 1. Wide translucent crimson lock-on laser telegraph web (behind swords, st2b panels 3-7)
  for (const sword of tunnelSwords) {
    if ((sword.telegraphAlpha || 0) > 0.01) {
      const len = sword.telegraphLength || 760;
      const bx = sword.x - Math.cos(sword.angle) * 28;
      const by = sword.y - Math.sin(sword.angle) * 28;
      const ex = sword.x + Math.cos(sword.angle) * len;
      const ey = sword.y + Math.sin(sword.angle) * len;
      const a = Math.min(0.55, sword.telegraphAlpha);
      ctx.save();
      ctx.strokeStyle = `rgba(205, 16, 36, ${(a * 0.65).toFixed(3)})`;
      ctx.lineWidth = 8.5;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 58, 78, ${(a * 0.78).toFixed(3)})`;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.restore();
    }
  }

  for (const fx of afterimages) {
    _drawTunnelAfterimageGrow(ctx, fx);
  }

  for (const beam of beamHitboxes) {
    _drawTunnelBeamHitbox(ctx, beam);
  }

  for (const sword of tunnelSwords) {
    _drawTunnelSwordSpritePass(ctx, sword);
  }
}

/**
 * Draws Deltarune Ch.3 obj_block_vfx monochrome parry stars and clash arcs along Black Knife guard (stack depth 0).
 */
export function drawRoaringKnightParryVFX(ctx, fighter) {
  const list = fighter?.activeParryBlockVfx;
  if (!list || list.length === 0) return;

  for (let i = 0; i < list.length; i++) {
    const fx = list[i];
    const alpha = Math.max(0, Math.min(1, (fx.life || 0) / Math.max(1, fx.maxLife || 14)));
    if (alpha <= 0.01) continue;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(fx.x, fx.y);

    if (fx.kind === 'clash_arc') {
      ctx.rotate(fx.angle || 0);
      const radius = fx.radius || 32;
      const spread = 0.72 * (1 - 0.35 * (1 - alpha));
      ctx.strokeStyle = '#0A0B10';
      ctx.lineWidth = 4.5 * alpha;
      ctx.beginPath();
      ctx.arc(0, 0, radius, -spread, spread);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.4 * alpha;
      ctx.beginPath();
      ctx.arc(0, 0, radius, -spread, spread);
      ctx.stroke();
      ctx.restore();
      continue;
    }

    // obj_block_vfx 4-point Deltarune block star spark
    const s = (fx.size || 8) * (0.55 + 0.65 * alpha);
    const inner = s * 0.28;
    ctx.rotate(fx.angle || 0);
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0A0B10';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(inner, -inner);
    ctx.lineTo(s, 0);
    ctx.lineTo(inner, inner);
    ctx.lineTo(0, s);
    ctx.lineTo(-inner, inner);
    ctx.lineTo(-s, 0);
    ctx.lineTo(-inner, -inner);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
