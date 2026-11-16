// ═══════════════════════════════════════════════════════════════════════════
// KAIZO KNIGHT (Deltarune Kaizo Mod v2.3.3) — Weapon & Skill VFX Graphics
// Extracted sprites & authentic mod mechanics from Mezu-Bezu/kaizo-knight-browser
// Adheres strictly to:
// - Rule 11: Zero shadowBlur CPU filters
// - Rule 15: Double-tapered slash crescents
// - Rule 20: Canonical single-source hand grip on weapon hilt (no duplicate hands)
// - Rule 26: Clean concentric shockwave rings (anti-cobweb rule)
// - Rule 30: 5-Phase Melee Kinematics + Articulated Shoulder-to-Wrist Arm Linkage
// - Rule 35: Pre-baked offscreen hand gauntlet & radial glow caches
// ═══════════════════════════════════════════════════════════════════════════

import { getHandSize } from '../../core/config.js';
import { state } from '../../core/state.js';

const P = 2.0;
const _snap = (v) => Math.round(v / P) * P;

function _getParryShakeX(fighter) {
  const t = fighter?.parryShakeTimer || 0;
  return t > 0 ? Math.sin(t * 1.9) * 3.2 * Math.min(1, t / 8) : 0;
}

// ── Sprite Asset Caches ──
const _kkSprites = {};
const _kkSpriteLoading = {};

function _loadKkSprite(key, src) {
  const existing = _kkSprites[key];
  if (existing && existing.complete && existing.naturalWidth > 0) {
    return existing;
  }
  if (!_kkSpriteLoading[key] && typeof Image !== 'undefined') {
    _kkSpriteLoading[key] = true;
    const img = new Image();
    img.onload = () => {
      _kkSprites[key] = img;
      _kkSpriteLoading[key] = false;
    };
    img.onerror = (e) => {
      console.warn(`Failed to load Kaizo Knight sprite ${src}:`, e);
      _kkSpriteLoading[key] = false;
    };
    img.src = src;
    _kkSprites[key] = img;
  }
  return _kkSprites[key] || null;
}

export function _preloadKaizoKnightWeaponSprites() {
  _loadKkSprite('radiantKnife', 'Assets/model/kaizo_knight/RadiantBlackKnife.png?v=2');
  _loadKkSprite('crescentSlash', 'Assets/model/kaizo_knight/KaizoCrescentSlash.png?v=1');
  _loadKkSprite('crescentArc', 'Assets/model/kaizo_knight/KaizoCrescentArc.png?v=1');
  _loadKkSprite('diamondBullet', 'Assets/model/kaizo_knight/DiamondSwordBullet.png?v=1');
  _loadKkSprite('diamondBladeM', 'Assets/model/kaizo_knight/DiamondBladeMedium.png?v=1');
  _loadKkSprite('diamondBladeL', 'Assets/model/kaizo_knight/DiamondBladeLong.png?v=1');
  _loadKkSprite('swordBreakVfx', 'Assets/model/kaizo_knight/SwordBreakVFX.png?v=1');
  _loadKkSprite('tunnelSlash', 'Assets/model/kaizo_knight/TunnelSlash.png?v=1');
  _loadKkSprite('finalShatter', 'Assets/model/kaizo_knight/RoaringFinalShatter.png?v=1');
  _loadKkSprite('roaringFire', 'Assets/model/kaizo_knight/RoaringFire.png?v=1');
  _loadKkSprite('blockVfx', 'Assets/model/kaizo_knight/BlockVFX.png?v=1');
  _loadKkSprite('blockShield', 'Assets/model/kaizo_knight/BlockShieldOL.png?v=1');
  _loadKkSprite('kaizoSpark', 'Assets/model/kaizo_knight/KaizoSpark.png?v=1');
  _loadKkSprite('starBullet', 'Assets/model/kaizo_knight/StarBulletKaizo.png?v=1');
  _loadKkSprite('starChild', 'Assets/model/kaizo_knight/StarChildKaizo.png?v=1');
  _loadKkSprite('battleFlurry', 'Assets/model/kaizo_knight/KaizoBattleFlurry.png?v=1');
  return _kkSprites;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _preloadKaizoKnightWeaponSprites();
}

// ── Pre-Baked Obsidian + #86A2FF Gauntlet Hand Cache (Rule 35 & Rule 20) ──
const _kkGripCache = new Map();

function _getKaizoGripCanvas(radius) {
  const r = Math.max(P * 2, radius);
  const intR = Math.round(r);
  if (_kkGripCache.has(intR)) return _kkGripCache.get(intR);
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

      let col = '#0A0B10';
      if (d >= intR - P * 0.45) {
        col = '#0E0F14'; // Crisp dark ink outer contour
      } else if (d >= intR - P * 1.45) {
        col = '#86A2FF'; // Exact Kaizo electric rim
      } else if (Math.abs(px) <= P * 0.55 && Math.abs(py) <= P * 0.55) {
        col = '#FFFFFF'; // Open-palm radiant core glint
      }
      gctx.fillStyle = col;
      gctx.fillRect(c + px - P / 2, c + py - P / 2, P, P);
    }
  }

  _kkGripCache.set(intR, canvas);
  return canvas;
}

// ── Pre-Baked Radial Glow Cache (Rule 35 Zero Per-Frame Gradients) ──
const _kkGlowCache = new Map();

function _getKaizoRadialGlowCanvas(colorHex, sizePx = 64) {
  const key = `${colorHex}_${sizePx}`;
  if (_kkGlowCache.has(key)) return _kkGlowCache.get(key);
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = sizePx;
  canvas.height = sizePx;
  const cctx = canvas.getContext('2d');
  const half = sizePx / 2;
  const grad = cctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, colorHex);
  grad.addColorStop(0.55, colorHex);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  cctx.fillStyle = grad;
  cctx.fillRect(0, 0, sizePx, sizePx);

  _kkGlowCache.set(key, canvas);
  return canvas;
}

const _kkTintedCache = new Map();
function _getTintedSpriteCanvas(key, img, sx, sy, sw, sh, tintColor) {
  if (typeof document === 'undefined' || !img || !img.complete || img.naturalWidth <= 0) return null;
  const cacheKey = `${key}_${sx}_${tintColor}`;
  if (_kkTintedCache.has(cacheKey)) return _kkTintedCache.get(cacheKey);
  const c = document.createElement('canvas');
  c.width = sw;
  c.height = sh;
  const cctx = c.getContext('2d');
  cctx.imageSmoothingEnabled = false;
  cctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  cctx.globalCompositeOperation = 'source-in';
  cctx.fillStyle = tintColor;
  cctx.fillRect(0, 0, sw, sh);
  cctx.globalCompositeOperation = 'source-over';
  _kkTintedCache.set(cacheKey, c);
  return c;
}

function _computeRadiantKnifePose(fighter, r) {
  const phase = fighter.meleePhase || 0;
  const p = fighter.meleePhaseProgress || 0;
  const dirSign = fighter.meleeComboFlip ? -1 : 1;

  let handX = r * 0.78;
  let handY = r * 0.36;
  let bladeRot = -0.32 * dirSign;
  let drawArc = false;
  let arcProgress = 0;

  if (!fighter.isMeleeSwinging || phase === 0) {
    if (fighter.blockPoseTimer > 0) {
      const hitMax = Math.max(1, fighter.parryHitAnimMaxFrames || 16);
      const hitP = Math.max(0, Math.min(1, (fighter.parryHitAnimTimer || 0) / hitMax));
      const kick = Math.sin(hitP * Math.PI);
      handX = r * (0.90 - 0.18 * kick);
      handY = r * (-0.14 + 0.10 * kick);
      bladeRot = 1.48 + 0.25 * kick;
    }
    return { handX, handY, bladeRot, drawArc, arcProgress, dirSign };
  }

  if (phase === 1) {
    const ease = 1 - Math.pow(1 - p, 2);
    handX = r * (0.78 - 0.34 * ease);
    handY = r * (0.36 - 0.85 * dirSign * ease);
    bladeRot = (-0.32 - 1.55 * ease) * dirSign;
  } else if (phase === 2) {
    handX = r * 0.44;
    handY = r * (0.36 - 0.85 * dirSign);
    bladeRot = -1.87 * dirSign;
  } else if (phase === 3) {
    const ease = 1 - Math.pow(1 - p, 3);
    handX = r * (0.44 + 0.82 * ease);
    handY = r * (-0.49 * dirSign + 1.06 * dirSign * ease);
    bladeRot = (-1.87 + 3.05 * ease) * dirSign;
    drawArc = true;
    arcProgress = ease;
  } else if (phase === 4) {
    const quiver = Math.sin(p * Math.PI * 5) * 2.2;
    handX = r * 1.26 + quiver;
    handY = r * 0.57 * dirSign;
    bladeRot = 1.18 * dirSign;
    drawArc = true;
    arcProgress = 1.0;
  } else if (phase === 5) {
    const ease = 1 - Math.pow(1 - p, 2);
    handX = r * (1.26 - 0.48 * ease);
    handY = r * (0.57 * dirSign + (0.36 - 0.57 * dirSign) * ease);
    bladeRot = (1.18 * dirSign) + (-0.32 * dirSign - 1.18 * dirSign) * ease;
  }

  return { handX, handY, bladeRot, drawArc, arcProgress, dirSign };
}

function _drawKaizoArmLinkage(ctx, r, handX, handY) {
  const shoulderX = r * 0.62;
  const shoulderY = r * 0.14;
  ctx.strokeStyle = '#86A2FF';
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

function _getKaizoKnifeCustom() {
  const raw = (typeof state !== 'undefined' && state.weaponCustomizations && state.weaponCustomizations.kaizo_knight)
    ? state.weaponCustomizations.kaizo_knight
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

function _drawRadiantKnifeModel(ctx, r, customScale = 1.0, customLengthScale = 1.0, customWidthScale = 1.0) {
  const knifeImg = _loadKkSprite('radiantKnife', 'Assets/model/kaizo_knight/RadiantBlackKnife.png?v=2');
  const bladeLen = r * 2.55;
  const bladeH = bladeLen * (31 / 75);
  const gripAnchor = bladeLen * 0.24;

  ctx.save();
  ctx.scale(customScale * customLengthScale, customScale * customWidthScale);
  if (knifeImg && knifeImg.complete && knifeImg.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(knifeImg, -gripAnchor, -bladeH / 2, bladeLen, bladeH);
  } else {
    const tipX = bladeLen - gripAnchor;
    const buttX = -gripAnchor;
    ctx.fillStyle = '#0A0B10';
    ctx.strokeStyle = '#86A2FF';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(buttX, -5);
    ctx.lineTo(0, -4);
    ctx.lineTo(tipX * 0.85, -3.5);
    ctx.lineTo(tipX, 0);
    ctx.lineTo(tipX * 0.72, 3.5);
    ctx.lineTo(0, 4.2);
    ctx.lineTo(buttX, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draws Kaizo Knight's Radiant Knife, arm linkage, gauntlet hand, and crescent cleave arc (Rule 20 & Rule 30).
 */
export function drawKaizoKnightRadiantKnife(ctx, fighter) {
  if (typeof state !== 'undefined' && state.showSkinOnly) return;

  const r = fighter.r || 25;
  const angle = fighter._isWinnerReveal
    ? 0
    : (fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0));
  const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  const facingLeft = Math.abs(normAngle) > Math.PI / 2;

  const pose = _computeRadiantKnifePose(fighter, r);
  const custom = _getKaizoKnifeCustom();
  const handPosX = pose.handX + custom.offsetX;
  const handPosY = pose.handY + custom.offsetY;
  const shakeAmt = _getParryShakeX(fighter);

  ctx.save();
  ctx.translate(fighter.x + shakeAmt, fighter.y - (fighter.z || 0));
  ctx.rotate(angle);
  if (facingLeft && !fighter.isSpinning) {
    ctx.scale(1, -1);
  }

  _drawKaizoArmLinkage(ctx, r, handPosX, handPosY);

  // Double-tapered Radiant Slash Arc + KaizoCrescentArc sprite overlay (Rule 15)
  if (pose.drawArc) {
    const slashRadius = r * 2.35;
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
      const outer = slashRadius + Math.sin(t * Math.PI) * (r * 0.42);
      if (i === 0) ctx.moveTo(Math.cos(a) * outer, Math.sin(a) * outer);
      else ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const a = minA + (maxA - minA) * t;
      const inner = slashRadius - Math.pow(Math.sin(t * Math.PI), 1.15) * (r * 0.50);
      ctx.lineTo(Math.cos(a) * inner, Math.sin(a) * inner);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#86A2FF';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    const arcImg = _loadKkSprite('crescentArc', 'Assets/model/kaizo_knight/KaizoCrescentArc.png?v=1');
    if (arcImg && arcImg.complete && arcImg.naturalWidth > 0) {
      const frameIdx = Math.min(7, Math.floor(Math.min(0.99, pose.arcProgress) * 8));
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(arcImg, frameIdx * 94, 0, 94, 91, -r * 1.4, -r * 1.85, r * 3.8, r * 3.7);
      ctx.restore();
    }
  }

  // Radiant Knife at hand
  ctx.save();
  ctx.translate(handPosX, handPosY);
  ctx.rotate(pose.bladeRot + custom.angleOffset);
  _drawRadiantKnifeModel(ctx, r, custom.scale, custom.lengthScale, custom.widthScale);

  const handR = getHandSize(r * 0.25, fighter);
  const gripCanvas = _getKaizoGripCanvas(handR);
  if (gripCanvas) {
    ctx.drawImage(gripCanvas, _snap(-gripCanvas.width / 2), _snap(-gripCanvas.height / 2));
  } else {
    ctx.fillStyle = '#0A0B10';
    ctx.strokeStyle = '#86A2FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, handR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

export function drawKaizoKnightWeaponPreview(ctx, x = 0, y = 0, angle = 0, r = 25, opts = {}) {
  const custom = _getKaizoKnifeCustom();
  ctx.save();
  ctx.translate(x + custom.offsetX, y + custom.offsetY);
  ctx.rotate(angle + custom.angleOffset);
  _drawRadiantKnifeModel(ctx, r, custom.scale, custom.lengthScale, custom.widthScale);

  if (opts.showHands !== false) {
    const handR = getHandSize ? getHandSize(r * 0.25) : (r * 0.25);
    const gripCanvas = _getKaizoGripCanvas(handR);
    if (gripCanvas) {
      ctx.drawImage(gripCanvas, _snap(-gripCanvas.width / 2), _snap(-gripCanvas.height / 2));
    }
  }
  ctx.restore();
}

/**
 * Renders KaizoCrescentSlash projectile wave (`spr_bullet_knightcrescent`) with glowing trail.
 */
export function drawKaizoCrescentProjectile(ctx, p) {
  const img = _loadKkSprite('crescentSlash', 'Assets/model/kaizo_knight/KaizoCrescentSlash.png?v=1');
  const glow = _getKaizoRadialGlowCanvas('rgba(134, 162, 255, 0.42)', 64);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle || 0);
  if (glow) {
    ctx.drawImage(glow, -28, -28, 56, 56);
  }
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false;
    const scale = p.scale || 1.15;
    const w = 36 * scale;
    const h = 34 * scale;
    ctx.drawImage(img, -w * 0.5, -h * 0.5, w, h);
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#86A2FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, -1.2, 1.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Renders Quickslash Board Slash cuts (crimson -> white -> #86A2FF exponential decay).
 */
export function drawKaizoBoardSlashVFX(ctx, s) {
  if (!s) return;
  const prog = Math.max(0, Math.min(1, s.life / Math.max(1, s.maxLife || 14)));
  const len = s.len || 560;
  const hw = (s.halfWidth || 20) * Math.pow(prog, 0.72);
  ctx.save();
  ctx.translate(s.cx, s.cy);
  ctx.rotate(s.angle || 0);

  if (s.telegraph > 0) {
    ctx.strokeStyle = 'rgba(255, 30, 77, 0.75)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-len * 0.5, 0);
    ctx.lineTo(len * 0.5, 0);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.globalAlpha = Math.min(1, prog * 1.25);
  ctx.fillStyle = s.color || '#FF1E4D';
  ctx.beginPath();
  ctx.moveTo(-len * 0.5, 0);
  ctx.quadraticCurveTo(0, -hw, len * 0.5, 0);
  ctx.quadraticCurveTo(0, hw, -len * 0.5, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(-len * 0.45, 0);
  ctx.quadraticCurveTo(0, -hw * 0.48, len * 0.45, 0);
  ctx.quadraticCurveTo(0, hw * 0.48, -len * 0.45, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Renders Skill 1A: Soul Splitter fault line, SwordBreakVFX burst, and split_bullet shards.
 */
export function drawSoulSplitterVFX(ctx, splitter, shards = []) {
  if (splitter) {
    const len = 760;
    ctx.save();
    ctx.translate(splitter.cx, splitter.cy);
    ctx.rotate(splitter.angle || 0);

    if (splitter.stage === 'aim') {
      const pulse = 0.45 + 0.45 * Math.sin((splitter.timer || 0) * 0.6);
      ctx.strokeStyle = `rgba(255, 30, 77, ${pulse.toFixed(2)})`;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      ctx.moveTo(-len * 0.5, 0);
      ctx.lineTo(len * 0.5, 0);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const t = Math.max(0, Math.min(1, splitter.timer / Math.max(1, splitter.maxTimer || 18)));
      const gap = (1 - t) * 26;
      ctx.fillStyle = `rgba(255, 30, 77, ${(0.88 * t).toFixed(2)})`;
      ctx.fillRect(-len * 0.5, -gap * 0.5 - 3, len, gap + 6);
      ctx.fillStyle = `rgba(255, 255, 255, ${t.toFixed(2)})`;
      ctx.fillRect(-len * 0.5, -2.5, len, 5);

      // Authentic SwordBreakVFX burst frames at center fault
      const breakImg = _loadKkSprite('swordBreakVfx', 'Assets/model/kaizo_knight/SwordBreakVFX.png?v=1');
      if (breakImg && breakImg.complete && breakImg.naturalWidth > 0) {
        const fi = Math.min(6, Math.floor((1 - t) * 7));
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = Math.min(1, t * 1.4);
        ctx.drawImage(breakImg, fi * 314, 0, 314, 227, -110, -80, 220, 160);
      }
    }
    ctx.restore();
  }

  const sparkImg = _loadKkSprite('kaizoSpark', 'Assets/model/kaizo_knight/KaizoSpark.png?v=1');
  for (let i = 0; i < shards.length; i++) {
    const b = shards[i];
    if (!b || b.life <= 0) continue;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle || 0);
    if (sparkImg && sparkImg.complete && sparkImg.naturalWidth > 0) {
      const fi = Math.floor((b.age || 0) / 3) % 4;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sparkImg, fi * 17, 0, 17, 18, -11, -11, 22, 22);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#FF1E4D';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(0, -5);
      ctx.lineTo(-10, 0);
      ctx.lineTo(0, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * Renders Skill 1B: Diamond Storm morphing projectiles (DiamondSwordBullet -> DiamondBladeLong).
 */
export function drawDiamondStormProjectile(ctx, d) {
  const diamondImg = _loadKkSprite('diamondBullet', 'Assets/model/kaizo_knight/DiamondSwordBullet.png?v=1');
  const bladeImg = _loadKkSprite('diamondBladeL', 'Assets/model/kaizo_knight/DiamondBladeLong.png?v=1');
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(d.angle || 0);

  if (d.stage === 'lock' || d.stage === 'track') {
    const redAlpha = d.stage === 'lock' ? 0.85 : 0.35;
    ctx.strokeStyle = `rgba(255, 30, 77, ${redAlpha})`;
    ctx.lineWidth = d.stage === 'lock' ? 2.2 : 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(520, 0);
    ctx.stroke();
  }

  if (d.stage === 'fire' && bladeImg && bladeImg.complete && bladeImg.naturalWidth > 0) {
    const fi = Math.min(2, Math.floor((d.age || 0) / 2) % 3);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bladeImg, fi * 99, 0, 99, 32, -32, -11, 76, 22);
  } else if (diamondImg && diamondImg.complete && diamondImg.naturalWidth > 0) {
    const fi = (d.stage === 'lock') ? 1 : 0;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(diamondImg, fi * 33, 0, 33, 32, -16, -15, 32, 30);
  } else {
    ctx.fillStyle = d.stage === 'lock' ? '#FF1E4D' : '#86A2FF';
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(0, -7);
    ctx.lineTo(-14, 0);
    ctx.lineTo(0, 7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Renders Skill 1C & 1D: Vortex Sword Storm blades + Kaizo Tunnel Slasher + Finisher beams.
 */
export function drawKaizoSwordVortexAndTunnelVFX(ctx, fighter) {
  const knifeImg = _loadKkSprite('radiantKnife', 'Assets/model/kaizo_knight/RadiantBlackKnife.png?v=1');
  const tunnelSlashImg = _loadKkSprite('tunnelSlash', 'Assets/model/kaizo_knight/TunnelSlash.png?v=1');

  const drawSwordSprite = (x, y, ang, w = 52, h = 20, tint = null) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    if (knifeImg && knifeImg.complete && knifeImg.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = false;
      const src = tint ? (_getTintedSpriteCanvas('knife', knifeImg, 0, 0, 75, 31, tint) || knifeImg) : knifeImg;
      ctx.drawImage(src, -w * 0.5, -h * 0.5, w, h);
    } else {
      ctx.fillStyle = tint || '#FFFFFF';
      ctx.strokeStyle = '#86A2FF';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-w * 0.45, -2.5, w * 0.9, 5);
      ctx.strokeRect(-w * 0.45, -2.5, w * 0.9, 5);
    }
    ctx.restore();
  };

  if (fighter.activeVortexSwords) {
    for (const s of fighter.activeVortexSwords) {
      drawSwordSprite(s.x, s.y, s.angle, 50, 20, s.crimson ? '#FF1E4D' : null);
    }
  }

  if (fighter.activeTunnelSwords) {
    for (const s of fighter.activeTunnelSwords) {
      if (s.telegraph > 0) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle || 0);
        ctx.strokeStyle = 'rgba(255, 30, 77, 0.72)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(520, 0);
        ctx.stroke();
        ctx.restore();
      }
      drawSwordSprite(s.x, s.y, s.angle, 48, 18, s.finisherStage === 'lock' ? '#FF1E4D' : null);
    }
  }

  if (fighter.activeTunnelSlashFX) {
    for (const ts of fighter.activeTunnelSlashFX) {
      ctx.save();
      ctx.translate(ts.x, ts.y);
      ctx.rotate(ts.angle || 0);
      ctx.globalAlpha = Math.max(0, Math.min(1, ts.life / (ts.maxLife || 12)));
      if (tunnelSlashImg && tunnelSlashImg.complete && tunnelSlashImg.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tunnelSlashImg, -68, -22, 136, 44);
      } else {
        ctx.fillStyle = '#86A2FF';
        ctx.fillRect(-60, -4, 120, 8);
      }
      ctx.restore();
    }
  }

  if (fighter.activeTunnelBeams) {
    for (const b of fighter.activeTunnelBeams) {
      const t = Math.max(0, Math.min(1, b.life / (b.maxLife || 12)));
      ctx.save();
      ctx.globalAlpha = t;
      ctx.strokeStyle = '#FF1E4D';
      ctx.lineWidth = (b.halfWidth || 10) * 1.9 * t;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = (b.halfWidth || 10) * 0.85 * t;
      ctx.stroke();
      ctx.restore();
    }
  }
}

/**
 * Renders Skill 2: Hypernova Starstorm cone, stars, 6-beam laser bursts & crimson homing shards.
 */
export function drawHypernovaStarstormVFX(ctx, fighter) {
  const starImg = _loadKkSprite('starBullet', 'Assets/model/kaizo_knight/StarBulletKaizo.png?v=1');
  const childImg = _loadKkSprite('starChild', 'Assets/model/kaizo_knight/StarChildKaizo.png?v=1');

  if (fighter.activeHypernovaCone) {
    const c = fighter.activeHypernovaCone;
    const len = 340;
    const halfSpread = 0.42;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle || 0);
    ctx.fillStyle = `rgba(134, 162, 255, ${(c.alpha || 0.35).toFixed(2)})`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(-halfSpread) * len, Math.sin(-halfSpread) * len);
    ctx.lineTo(Math.cos(halfSpread) * len, Math.sin(halfSpread) * len);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  if (fighter.activeHypernovaStars) {
    for (const s of fighter.activeHypernovaStars) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot || 0);
      const sz = (s.radius || 18) * 2;
      if (s.redLock) {
        const beamAlpha = 0.55 + 0.35 * Math.sin((fighter._vfxTick || 0) * 0.8);
        ctx.strokeStyle = `rgba(255, 30, 77, ${beamAlpha.toFixed(2)})`;
        ctx.lineWidth = 1.6;
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * 160, Math.sin(a) * 160);
          ctx.stroke();
        }
      }
      if (starImg && starImg.complete && starImg.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        const src = s.redLock ? (_getTintedSpriteCanvas('star', starImg, 0, 0, 64, 64, '#FF1E4D') || starImg) : starImg;
        ctx.drawImage(src, -sz * 0.5, -sz * 0.5, sz, sz);
      } else {
        ctx.fillStyle = s.redLock ? '#FF1E4D' : '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, s.radius || 14, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  if (fighter.activeHypernovaShards) {
    for (const sh of fighter.activeHypernovaShards) {
      ctx.save();
      ctx.translate(sh.x, sh.y);
      ctx.rotate(sh.angle || 0);
      if (childImg && childImg.complete && childImg.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        const src = sh.crimson ? (_getTintedSpriteCanvas('child', childImg, 0, 0, 33, 32, '#FF1E4D') || childImg) : childImg;
        ctx.drawImage(src, -13, -13, 26, 26);
      } else {
        ctx.fillStyle = sh.crimson ? '#FF1E4D' : '#86A2FF';
        ctx.fillRect(-6, -6, 12, 12);
      }
      ctx.restore();
    }
  }
}

/**
 * Renders Ultimate: Roaring Δ (Dark Fountain vortex, RoaringFire, Quickslash Frenzy & RoaringFinalShatter glass shatter + Rule 26 concentric ripples).
 */
export function drawRoaringDeltaVFX(ctx, fighter) {
  const fireImg = _loadKkSprite('roaringFire', 'Assets/model/kaizo_knight/RoaringFire.png?v=1');
  const flurryImg = _loadKkSprite('battleFlurry', 'Assets/model/kaizo_knight/KaizoBattleFlurry.png?v=1');
  const shatterImg = _loadKkSprite('finalShatter', 'Assets/model/kaizo_knight/RoaringFinalShatter.png?v=1');

  const ox = fighter.roaringDeltaOrigin?.x ?? fighter.x;
  const oy = fighter.roaringDeltaOrigin?.y ?? fighter.y;

  // 1. Dark Fountain Vortex & Roaring Fire pillar (spawned directly in front of Kaizo Knight)
  if (fighter.roaringDeltaVortexTimer > 0) {
    const progress = 1 - fighter.roaringDeltaVortexTimer / Math.max(1, fighter.roaringDeltaVortexMax || 38);
    ctx.save();
    ctx.translate(ox, oy);
    const colW = 38 + Math.sin(progress * Math.PI) * 34;
    ctx.fillStyle = 'rgba(10, 11, 16, 0.72)';
    ctx.fillRect(-colW * 0.5, -260, colW, 520);
    ctx.strokeStyle = 'rgba(134, 162, 255, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-colW * 0.5, -260, colW, 520);

    if (fireImg && fireImg.complete && fireImg.naturalWidth > 0) {
      const fi = Math.floor((fighter._vfxTick || 0) / 3) % 4;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(fireImg, fi * 64, 0, 64, 64, -46, -54, 92, 92);
    }
    ctx.restore();
  }

  // 2. Quickslash Flurry sprite overlay during Frenzy (anchored at front vortex origin)
  if (fighter.roaringDeltaFrenzyTimer > 0 && flurryImg && flurryImg.complete && flurryImg.naturalWidth > 0) {
    const fi = Math.floor((fighter._vfxTick || 0) / 2) % 3;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(flurryImg, fi * 113, 0, 113, 78, -68, -48, 136, 96);
    ctx.restore();
  }

  // 3. Fountain Bullets
  if (fighter.activeFountainBullets) {
    for (const b of fighter.activeFountainBullets) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#86A2FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, b.r || 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // 4. Staggered Clean Concentric Shockwaves (Rule 26 Anti-Cobweb Standard)
  if (fighter.activeShockwaveRipples) {
    for (const sw of fighter.activeShockwaveRipples) {
      const p = 1 - (sw.life / Math.max(1, sw.maxLife || 26));
      ctx.save();
      for (let k = 0; k < 3; k++) {
        const offset = k * 0.14;
        const lp = Math.max(0, Math.min(1, (p - offset) / (1 - offset)));
        if (lp <= 0) continue;
        const rad = (sw.maxRadius || 165) * Math.pow(lp, 0.72);
        const alpha = Math.pow(1 - lp, 1.25) * 0.9;
        if (k === 0) {
          ctx.fillStyle = `rgba(134, 162, 255, ${(0.16 * (1 - lp)).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, rad, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = k === 0 ? `rgba(255, 255, 255, ${alpha.toFixed(3)})` : (k === 1 ? `rgba(134, 162, 255, ${alpha.toFixed(3)})` : `rgba(255, 30, 77, ${alpha.toFixed(3)})`);
        ctx.lineWidth = 3.0 - k * 0.7;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, rad, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 5. Screen Shatter Climax Overlay (RoaringFinalShatter.png)
  if (fighter.roaringDeltaShatterTimer > 0) {
    const maxF = Math.max(1, fighter.roaringDeltaShatterMax || 32);
    const p = 1 - fighter.roaringDeltaShatterTimer / maxF;
    const arena = (typeof state !== 'undefined' && state.arena) ? state.arena : { x: 45, y: 240, width: 450, height: 450 };
    ctx.save();
    if (p < 0.15) {
      ctx.fillStyle = `rgba(255, 255, 255, ${(0.65 * (1 - p / 0.15)).toFixed(2)})`;
      ctx.fillRect(arena.x, arena.y, arena.width, arena.height);
    }
    if (shatterImg && shatterImg.complete && shatterImg.naturalWidth > 0) {
      const frameIdx = Math.min(11, Math.floor(p * 12));
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = Math.max(0.15, 1 - Math.pow(p, 1.6));
      ctx.drawImage(shatterImg, frameIdx * 640, 0, 640, 480, arena.x, arena.y, arena.width, arena.height);
    }
    ctx.restore();
  }
}

/**
 * Renders Radiant Parry Shield & BlockVFX burst.
 */
export function drawKaizoParryVFX(ctx, fighter) {
  const blockVfxImg = _loadKkSprite('blockVfx', 'Assets/model/kaizo_knight/BlockVFX.png?v=1');
  const shieldImg = _loadKkSprite('blockShield', 'Assets/model/kaizo_knight/BlockShieldOL.png?v=1');

  if (fighter.blockPoseTimer > 0 && shieldImg && shieldImg.complete && shieldImg.naturalWidth > 0) {
    const r = fighter.r || 25;
    ctx.save();
    ctx.translate(fighter.x, fighter.y);
    ctx.rotate(fighter.gunAngle || 0);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = Math.min(0.85, fighter.blockPoseTimer / 18);
    ctx.drawImage(shieldImg, -r * 0.4, -r * 1.15, r * 1.65, r * 2.3);
    ctx.restore();
  }

  if (fighter.activeParryBlockVfx) {
    for (const v of fighter.activeParryBlockVfx) {
      ctx.save();
      ctx.translate(v.x, v.y);
      const t = 1 - (v.life / Math.max(1, v.maxLife || 14));
      if (blockVfxImg && blockVfxImg.complete && blockVfxImg.naturalWidth > 0) {
        const fi = Math.min(6, Math.floor(t * 7));
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(blockVfxImg, fi * 39, 0, 39, 39, -22, -22, 44, 44);
      } else {
        ctx.strokeStyle = '#86A2FF';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 12 + t * 18, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}
