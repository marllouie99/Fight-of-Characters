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

// ── Sprite Asset Caches ──
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
  _loadRkSprite('blackKnife', 'Assets/model/roaring_knight/BlackKnife.png?v=1');
  _loadRkSprite('fallingSword', 'Assets/model/roaring_knight/FallingSword.png?v=1');
  _loadRkSprite('starBullet', 'Assets/model/roaring_knight/StarBullet.png?v=1');
  _loadRkSprite('starBulletRed', 'Assets/model/roaring_knight/StarBulletRed.png?v=2');
  _loadRkSprite('starChild', 'Assets/model/roaring_knight/StarChild.png?v=1');
  _loadRkSprite('redSlash', 'Assets/model/roaring_knight/RedSlash.png?v=2');
  _loadRkSprite('swoonLine', 'Assets/model/roaring_knight/RoaringSwoonLine.png?v=2');
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

/**
 * Draws The Roaring Knight's held Black Knife, arm linkage, single-source gauntlet hand,
 * and active double-tapered slash arc.
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
  const knifeImg = _loadRkSprite('blackKnife', 'Assets/model/roaring_knight/BlackKnife.png?v=1');

  ctx.save();
  ctx.translate(fighter.x, fighter.y - (fighter.z || 0));
  ctx.rotate(angle);
  if (facingLeft && !fighter.isSpinning) {
    ctx.scale(1, -1);
  }

  // 1. Articulated Shoulder-to-Wrist Arm Linkage (Rule 30)
  _drawArmLinkage(ctx, r, pose.handX, pose.handY);

  // 2. Slash Crescent VFX during active Strike / Lock phases (Rule 15)
  if (pose.drawArc) {
    const slashRadius = r * 2.15;
    const startA = -1.65 * pose.dirSign;
    const endA = (-1.65 + 2.85 * Math.min(1, pose.arcProgress)) * pose.dirSign;
    const steps = 10;
    const minA = Math.min(startA, endA);
    const maxA = Math.max(startA, endA);

    ctx.fillStyle = 'rgba(10, 11, 16, 0.90)';
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = minA + (maxA - minA) * t;
      const outer = slashRadius + Math.sin(t * Math.PI) * (r * 0.35);
      if (i === 0) ctx.moveTo(Math.cos(a) * outer, Math.sin(a) * outer);
      else ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const a = minA + (maxA - minA) * t;
      const inner = slashRadius - Math.pow(Math.sin(t * Math.PI), 1.15) * (r * 0.42);
      ctx.lineTo(Math.cos(a) * inner, Math.sin(a) * inner);
    }
    ctx.closePath();
    ctx.fill();

    // Crisp white leading edge filament
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, slashRadius + 2, minA, maxA);
    ctx.stroke();
  }

  // 3. Weapon Blade anchored at Hand Grip
  ctx.save();
  ctx.translate(pose.handX, pose.handY);
  ctx.rotate(pose.bladeRot);

  const bladeLen = r * 2.05;
  const bladeH = r * 0.56;
  if (knifeImg && knifeImg.complete && knifeImg.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(knifeImg, -bladeLen * 0.14, -bladeH / 2, bladeLen, bladeH);
  } else {
    // Fallback vector blade (Node verification / headless mode)
    ctx.fillStyle = '#0E0F14';
    ctx.strokeStyle = '#F8FAFC';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-4, -3);
    ctx.lineTo(bladeLen * 0.78, -4);
    ctx.lineTo(bladeLen, 0);
    ctx.lineTo(bladeLen * 0.78, 4);
    ctx.lineTo(-4, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

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
 * Draws telegraphed & plunging Falling Sword entity (Skill 1).
 */
export function drawFallingSwordEntity(ctx, sword) {
  if (!sword) return;
  const swordImg = _loadRkSprite('fallingSword', 'Assets/model/roaring_knight/FallingSword.png?v=1');

  ctx.save();
  ctx.translate(sword.x, sword.y);

  // Subtle monochrome ink trajectory line during lock-on telegraph phase
  if (sword.telegraphTimer > 0) {
    const alpha = Math.min(0.75, sword.telegraphTimer / 18);
    ctx.strokeStyle = `rgba(14, 15, 20, ${alpha.toFixed(2)})`;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(sword.angle) * 210, Math.sin(sword.angle) * 210);
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
    ctx.fillStyle = '#0A0B10';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-drawW / 2, -4);
    ctx.lineTo(drawW / 2, 0);
    ctx.lineTo(-drawW / 2, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws spinning 6-pointed Star Bullet projectile (Skill 2) in stark B&W.
 */
export function drawStarBurstProjectile(ctx, star) {
  if (!star) return;
  const isInvertFlash = star.fuseTimer < 14 && (Math.floor(star.fuseTimer / 3) % 2 === 0);
  const spr = isInvertFlash
    ? _loadRkSprite('starBulletRed', 'Assets/model/roaring_knight/StarBulletRed.png?v=2')
    : _loadRkSprite('starBullet', 'Assets/model/roaring_knight/StarBullet.png?v=1');

  ctx.save();
  ctx.translate(star.x, star.y);

  const glow = _getRadialGlowCanvas(isInvertFlash ? 'rgba(14, 15, 20, 0.50)' : 'rgba(255, 255, 255, 0.52)', 64);
  if (glow) {
    ctx.drawImage(glow, -30, -30, 60, 60);
  }

  ctx.rotate(star.rot || 0);
  const sz = star.radius ? star.radius * 2.3 : 38;
  if (spr && spr.complete && spr.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spr, -sz / 2, -sz / 2, sz, sz);
  } else {
    ctx.fillStyle = isInvertFlash ? '#0A0B10' : '#FFFFFF';
    ctx.strokeStyle = isInvertFlash ? '#FFFFFF' : '#0E0F14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws StarChild diamond shrapnel fragment emitted by Star Burst detonation.
 */
export function drawStarChildFragment(ctx, shard) {
  if (!shard) return;
  const spr = _loadRkSprite('starChild', 'Assets/model/roaring_knight/StarChild.png?v=1');

  ctx.save();
  ctx.translate(shard.x, shard.y);
  ctx.rotate(shard.angle || 0);
  const w = 18;
  const h = 16;
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
  const swoonImg = _loadRkSprite('swoonLine', 'Assets/model/roaring_knight/RoaringSwoonLine.png?v=2');
  const redSlashImg = _loadRkSprite('redSlash', 'Assets/model/roaring_knight/RedSlash.png?v=2');

  ctx.save();
  ctx.translate(fx.x, fx.y);

  if (fx.kind === 'swoon_telegraph') {
    const p = 1 - fx.timer / fx.maxTimer;
    ctx.rotate(fx.angle);
    ctx.strokeStyle = `rgba(10, 11, 16, ${(0.42 + 0.50 * p).toFixed(2)})`;
    ctx.lineWidth = 2.4 + 4 * p;
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.lineTo(fx.reach || 560, 0);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${(0.85 * p).toFixed(2)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(fx.reach || 560, 0);
    ctx.stroke();
  } else if (fx.kind === 'swoon_cut') {
    const p = 1 - fx.timer / fx.maxTimer;
    const alpha = Math.max(0, 1 - Math.pow(p, 1.3));
    ctx.globalAlpha = alpha;

    // 1. Dimensional Tear Line
    ctx.save();
    ctx.rotate(fx.angle);
    const len = fx.reach || 560;
    const h = 28 * (1 - p * 0.4);
    if (swoonImg && swoonImg.complete && swoonImg.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(swoonImg, -24, -h / 2, len, h);
    } else {
      ctx.fillStyle = '#0A0B10';
      ctx.fillRect(-20, -h * 0.35, len, h * 0.7);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-20, -2, len, 4);
    }

    // Sweeping Monochrome Crescent over target center
    if (redSlashImg && redSlashImg.complete && redSlashImg.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = false;
      const slashDist = (fx.hitDist || 120);
      ctx.drawImage(redSlashImg, slashDist - 55, -75, 110, 150);
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
  }

  ctx.restore();
}
