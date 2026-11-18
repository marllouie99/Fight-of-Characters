// ───────────────────────────────────────────────────────────────────────────
// LAST BREATH SANS Weapons, Cracked Gaster Blasters, Void Hands & Color Bones
// Adheres strictly to:
// - Rule 11: Zero ctx.shadowBlur
// - Rule 20: Canonical Default Hands anchored at (±r*0.82, +r*0.38)
// - Rule 26: Sequential staggered concentric shockwave ripples (Zero cobwebs!)
// - Rule 35: Pre-baked offscreen radial glows, tinted bone sprites & int scaling
// ───────────────────────────────────────────────────────────────────────────

import { getHandSize } from '../../core/config.js';
import { state } from '../../core/state.js';
import { drawPixelHand } from '../renderers/fighterRenderer.js';

const _spriteCache = {};
let _spritePreloaded = false;

export function _preloadLastBreathSansWeaponSprites() {
  if (_spritePreloaded || typeof Image === 'undefined') return;
  _spritePreloaded = true;
  const manifest = {
    blasterSheet: 'Assets/model/last_breath_sans/LastBreathSans-gaster-blaster-sprite-sheet.png?v=1',
    gasterHand: 'Assets/model/last_breath_sans/GasterHand.png?v=1',
    gasterBullet: 'Assets/model/last_breath_sans/GasterBullet.png?v=1',
    bone: 'Assets/model/last_breath_sans/BoneV.png?v=1',
    boneStab: 'Assets/model/last_breath_sans/BoneStabV.png?v=1',
    colorBone: 'Assets/model/last_breath_sans/ColorBoneV.png?v=1',
  };
  for (const [key, src] of Object.entries(manifest)) {
    const img = new Image();
    if (key === 'colorBone') {
      img.onload = () => {
        _getTintedColorBone('#00E5FF');
        _getTintedColorBone('#FF9500');
      };
    }
    img.src = src;
    _spriteCache[key] = img;
  }
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _preloadLastBreathSansWeaponSprites();
}

function _getReadySprite(key) {
  _preloadLastBreathSansWeaponSprites();
  const img = _spriteCache[key];
  return (img && img.complete && img.naturalWidth > 0) ? img : null;
}

// Pre-baked radial glow cache (Rule 35 — zero per-frame createRadialGradient)
const _glowCache = new Map();
function _getPrebakedGlow(colorHex) {
  if (typeof document === 'undefined') return null;
  if (_glowCache.has(colorHex)) return _glowCache.get(colorHex);
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const gctx = c.getContext('2d');
  if (gctx) {
    const grad = gctx.createRadialGradient(48, 48, 3, 48, 48, 46);
    grad.addColorStop(0, colorHex);
    grad.addColorStop(0.45, colorHex + '66');
    grad.addColorStop(1, colorHex + '00');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 96, 96);
  }
  _glowCache.set(colorHex, c);
  return c;
}

// Pre-baked tinted color-bone cache (Cyan Blue / Solar Orange)
const _tintedBoneCache = new Map();
function _getTintedColorBone(tintHex) {
  if (typeof document === 'undefined') return null;
  const raw = _getReadySprite('colorBone');
  if (!raw) return null;
  if (_tintedBoneCache.has(tintHex)) return _tintedBoneCache.get(tintHex);

  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 38;
  const bctx = c.getContext('2d');
  if (bctx) {
    bctx.imageSmoothingEnabled = false;
    bctx.drawImage(raw, 0, 0, 16, 38);
    bctx.globalCompositeOperation = 'source-atop';
    bctx.fillStyle = tintHex;
    bctx.fillRect(0, 0, 16, 38);
    bctx.globalCompositeOperation = 'source-over';
  }
  _tintedBoneCache.set(tintHex, c);
  return c;
}

function _uploadWarmVfxTexture(targetCtx, drawable) {
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

export function prewarmLastBreathSansVfx(targetCtx = null) {
  _preloadLastBreathSansWeaponSprites();
  let warmedCount = 0;

  for (const hex of ['#EF4444', '#00E5FF', '#FF9500', '#FACC15']) {
    const glow = _getPrebakedGlow(hex);
    if (glow) {
      _uploadWarmVfxTexture(targetCtx, glow);
      warmedCount++;
    }
  }

  for (const hex of ['#00E5FF', '#FF9500']) {
    const tinted = _getTintedColorBone(hex);
    if (tinted) {
      _uploadWarmVfxTexture(targetCtx, tinted);
      warmedCount++;
    }
  }

  for (const img of Object.values(_spriteCache)) {
    if (img && img.complete && img.naturalWidth > 0) {
      _uploadWarmVfxTexture(targetCtx, img);
      warmedCount++;
    }
  }

  return warmedCount;
}

export function getLastBreathVfxCacheCounts() {
  return {
    glows: _glowCache.size,
    tintedBones: _tintedBoneCache.size,
    sprites: Object.keys(_spriteCache).length,
  };
}

/**
 * Draws canonical Last Breath Sans telekinesis casting hands at (±r * 0.82, +r * 0.38).
 * Rule 20: Single-source-of-truth canonical hands during active casts or UI preview.
 */
export function drawLastBreathSansWeaponPreview(ctx, x = 0, y = 0, angle = 0, r = 25, opts = {}) {
  const custom = state.weaponCustomizations?.last_breath_sans || {};
  const scale = custom.scale ?? 1.0;
  const offX = custom.offsetX ?? 0;
  const offY = custom.offsetY ?? 0;
  const angOff = custom.angleOffset ?? 0;
  const handR = getHandSize(r * 0.28);

  ctx.save();
  ctx.translate(x + offX, y + offY);
  ctx.rotate(angle + angOff);
  if (Math.abs(angle) > Math.PI / 2 && !opts.isPreview) {
    ctx.scale(1, -1);
  }
  ctx.scale(scale, scale);

  // Dual telekinesis aura hands (Left = Electric Cyan, Right = Crimson/Amber)
  for (const side of [-1, 1]) {
    const hx = side * r * 0.82;
    const hy = r * 0.38;
    const glowHex = side < 0 ? '#00E5FF' : '#EF4444';
    const glow = _getPrebakedGlow(glowHex);

    ctx.save();
    ctx.translate(hx, hy);
    if (glow) {
      ctx.globalAlpha = 0.72;
      const gs = handR * 3.1;
      ctx.drawImage(glow, -gs * 0.5, -gs * 0.5, gs, gs);
      ctx.globalAlpha = 1.0;
    }
    drawPixelHand(ctx, 0, 0, handR, '#FFFFFF', '#0E0F14', 1.6);
    ctx.restore();
  }

  // In Weapon Studio / Index preview, display floating Void Gaster Hand & Color Bone
  if (opts.isPreview) {
    const handImg = _getReadySprite('gasterHand');
    ctx.save();
    ctx.translate(r * 1.15, -r * 0.16);
    if (handImg) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(handImg, -14, -14, 28, 28);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#0E0F14';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0E0F14';
      ctx.beginPath();
      ctx.arc(0, 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws a Last Breath jagged Gaster Blaster (57x44 x 6 frames) + beam.
 */
export function drawLastBreathGasterBlaster(ctx, blaster) {
  if (!blaster) return;

  ctx.save();
  ctx.translate(blaster.x, blaster.y);
  ctx.rotate(blaster.angle || 0);

  const scale = (blaster.scale || 1.0) * (blaster.spawnScale || 1.0);
  ctx.scale(scale, scale);

  const isFiring = Boolean(blaster.isFiring || blaster.fireTimer > 0);
  const isCharging = Boolean(blaster.isCharging || blaster.chargeTimer > 0);

  if (isFiring) {
    const recoil = Math.sin((blaster.fireProgress || 0.2) * Math.PI) * 11;
    ctx.translate(-recoil, 0);
    _drawLastBreathBlasterBeam(ctx, blaster);
  }

  let frameIdx = 0;
  if (isFiring) {
    frameIdx = (blaster.fireProgress || 0) > 0.85 ? 4 : 5;
  } else if (isCharging) {
    const p = Math.min(1, Math.max(0, blaster.chargeProgress || 0));
    if (p > 0.88) frameIdx = 4;
    else if (p > 0.70) frameIdx = 3;
    else if (p > 0.50) frameIdx = 2;
    else if (p > 0.28) frameIdx = 1;
  }

  const sheet = _getReadySprite('blasterSheet');
  if (sheet) {
    const fw = 57;
    const fh = 44;
    const sx = frameIdx * fw;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, sx, 0, fw, fh, -28, -22, 57, 44);
    ctx.restore();
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 2.0;
    ctx.fillRect(-18, -14, 34, 28);
    ctx.strokeRect(-18, -14, 34, 28);
    ctx.fillStyle = '#00E5FF';
    ctx.fillRect(4, -7, 6, 5);
    ctx.fillStyle = '#FF9500';
    ctx.fillRect(4, 2, 6, 5);
  }

  // Charging glow at jaws (Cyan + Amber alternate)
  if (isCharging && !isFiring) {
    const glowHex = blaster.isOrange ? '#FF9500' : '#00E5FF';
    const glow = _getPrebakedGlow(glowHex);
    const p = Math.min(1, Math.max(0.15, blaster.chargeProgress || 0.2));
    if (glow) {
      ctx.save();
      ctx.globalAlpha = 0.72 * p;
      const gSize = 28 * (0.6 + 0.75 * p);
      ctx.drawImage(glow, 18 - gSize * 0.5, -gSize * 0.5, gSize, gSize);
      ctx.restore();
    }
  }

  ctx.restore();
}

function _drawLastBreathBlasterBeam(ctx, blaster) {
  const worldReach = (blaster.effectiveReach !== undefined) ? blaster.effectiveReach : (blaster.reach || 900);
  const reach = Math.max(4, worldReach / Math.max(0.4, blaster.scale || 1.0) - 18);
  const bw = (blaster.beamWidth || 34) / Math.max(0.4, blaster.scale || 1.0);
  const flicker = 0.86 + 0.14 * Math.sin((blaster._age || 0) * 2.0);
  const curW = bw * flicker;
  const accentRgba = blaster.isPhase3Beam ? 'rgba(255, 149, 0, 0.70)' : 'rgba(0, 229, 255, 0.68)';

  ctx.save();
  // Outer crimson Last Breath edge sheath
  ctx.fillStyle = 'rgba(239, 68, 68, 0.42)';
  ctx.fillRect(16, -curW * 0.74, reach, curW * 1.48);

  // Mid Cyan / Amber Undertale beam band
  ctx.fillStyle = accentRgba;
  ctx.fillRect(16, -curW * 0.48, reach, curW * 0.96);

  // Hot pure white center core
  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(16, -curW * 0.25, reach, curW * 0.50);
  ctx.restore();
}

/**
 * Draws a Last Breath Bone or Color Bone (Blue/Orange) projectile.
 */
export function drawLastBreathBoneProjectile(ctx, bone) {
  if (!bone) return;

  ctx.save();
  ctx.translate(bone.x, bone.y);
  ctx.rotate((bone.angle || 0) + Math.PI / 2);

  if (bone.boneColor === 'blue' || bone.boneColor === 'orange') {
    const hex = bone.boneColor === 'blue' ? '#00E5FF' : '#FF9500';
    const glow = _getPrebakedGlow(hex);
    if (glow) {
      ctx.globalAlpha = 0.45;
      ctx.drawImage(glow, -18, -22, 36, 44);
      ctx.globalAlpha = 1.0;
    }
    const tinted = _getTintedColorBone(hex);
    if (tinted) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tinted, -8, -19, 16, 38);
      ctx.restore();
      return;
    }
    ctx.fillStyle = hex;
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-3, -15, 6, 30);
    ctx.strokeRect(-3, -15, 6, 30);
    ctx.restore();
    return;
  }

  const img = _getReadySprite('bone');
  if (img) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -8, -19, 16, 38);
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-3, -15, 6, 30);
    ctx.strokeRect(-3, -15, 6, 30);
  }
  ctx.restore();
}

/**
 * Draws a Bone Stab Trap (ground telegraph warning + erupting Last Breath spikes).
 */
export function drawLastBreathBoneTrap(ctx, trap) {
  if (!trap) return;
  ctx.save();
  ctx.translate(trap.x, trap.y);

  if (trap.warnTimer > 0) {
    const warnRatio = Math.min(1, trap.warnTimer / Math.max(1, trap.warnMax || 20));
    const pulse = 0.4 + 0.6 * Math.abs(Math.sin(warnRatio * Math.PI * 3));
    ctx.fillStyle = `rgba(239, 68, 68, ${0.32 * pulse})`;
    ctx.fillRect(-16, -20, 32, 40);
    ctx.strokeStyle = '#FF9500';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-16, -20, 32, 40);
  } else if (trap.activeTimer > 0) {
    const img = _getReadySprite('boneStab');
    const pop = Math.min(1, (trap.activeMax - trap.activeTimer + 4) / 6);
    const h = 38 * pop;
    if (img) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, -9, 18 - h, 18, h);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1.6;
      ctx.fillRect(-6, 18 - h, 12, h);
      ctx.strokeRect(-6, 18 - h, 12, h);
    }
  }

  ctx.restore();
}

/**
 * Draws an orbiting/flanking Void Gaster Hand turret (`ball.png` from Last Breath remake).
 */
export function drawGasterHandTurret(ctx, hand) {
  if (!hand) return;
  const img = _getReadySprite('gasterHand');
  const alpha = hand.alpha !== undefined ? hand.alpha : Math.min(1, (hand.life || 20) / 14);
  const scale = hand.scale || 1.25;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.translate(hand.x, hand.y);
  ctx.rotate(hand.bobAngle || 0);
  ctx.scale(scale, scale);

  const glow = _getPrebakedGlow(hand.isPhase3 ? '#EF4444' : '#00E5FF');
  if (glow) {
    ctx.save();
    ctx.globalAlpha *= 0.55;
    ctx.drawImage(glow, -24, -24, 48, 48);
    ctx.restore();
  }

  if (img) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -16, -16, 32, 32);
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0E0F14';
    ctx.beginPath();
    ctx.arc(0, 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws a Void Bullet pellet fired from a Gaster Hand turret (`bullet-sheet0.png`).
 */
export function drawGasterBulletProjectile(ctx, bullet) {
  if (!bullet) return;
  const img = _getReadySprite('gasterBullet');
  const glow = _getPrebakedGlow('#FACC15');

  ctx.save();
  ctx.translate(bullet.x, bullet.y);
  ctx.rotate((bullet.angle || 0) + Math.PI / 2);

  if (glow) {
    ctx.globalAlpha = 0.52;
    ctx.drawImage(glow, -14, -16, 28, 32);
    ctx.globalAlpha = 1.0;
  }

  if (img) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -6, -10, 12, 20);
  } else {
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draws Last Breath Enigmatic Encounter shockwave ripples (Rule 26 — zero cobwebs).
 */
export function drawEnigmaticFinaleVFX(ctx, fighter, shockwaveRipples = []) {
  if (fighter && fighter.isEnigmaticFinaleActive) {
    const glow = _getPrebakedGlow('#EF4444');
    if (glow) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.drawImage(glow, fighter.x - 90, fighter.y - 90, 180, 180);
      ctx.restore();
    }
  }

  if (!shockwaveRipples || shockwaveRipples.length === 0) return;
  for (let i = 0; i < shockwaveRipples.length; i++) {
    const sw = shockwaveRipples[i];
    const progress = 1 - Math.max(0, sw.life / Math.max(1, sw.maxLife || 28));
    const staggerOffsets = [0.0, 0.14, 0.28];

    ctx.save();
    for (let k = 0; k < staggerOffsets.length; k++) {
      const lp = (progress - staggerOffsets[k]) / (1 - staggerOffsets[k]);
      if (lp <= 0 || lp >= 1) continue;
      const rad = (sw.maxRadius || 210) * Math.pow(lp, 0.65);
      const popIn = Math.min(1, lp / 0.10);
      const fadeOut = Math.pow(1 - lp, 1.25);
      const alpha = popIn * fadeOut;

      ctx.beginPath();
      ctx.arc(sw.x, sw.y, rad, 0, Math.PI * 2);
      if (k === 0) {
        ctx.fillStyle = `rgba(239, 68, 68, ${0.18 * alpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.88 * alpha})`;
        ctx.lineWidth = 3.2;
      } else if (k === 1) {
        ctx.strokeStyle = `rgba(0, 229, 255, ${0.82 * alpha})`;
        ctx.lineWidth = 2.4;
      } else {
        ctx.strokeStyle = `rgba(255, 149, 0, ${0.72 * alpha})`;
        ctx.lineWidth = 2.0;
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}
