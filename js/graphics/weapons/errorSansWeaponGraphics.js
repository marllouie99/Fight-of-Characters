// ───────────────────────────────────────────────────────────────────────────
// ERROR SANS Weapons, Error Strings, Error Gaster Blasters & Glitch VFX
// Adheres strictly to:
// - Rule 11: Zero ctx.shadowBlur
// - Rule 20: Canonical Default Hands anchored at (±r*0.82, +r*0.38)
// - Rule 26: Sequential staggered concentric shockwave ripples (Zero cobwebs!)
// - Rule 35: Pre-baked offscreen radial glows & integer imageSmoothing=false
// ───────────────────────────────────────────────────────────────────────────

import { getHandSize } from '../../core/config.js';
import { state } from '../../core/state.js';
import { drawPixelHand } from '../renderers/fighterRenderer.js';

const _spriteCache = {};
let _spritePreloaded = false;

export function _preloadErrorSansWeaponSprites() {
  if (_spritePreloaded || typeof Image === 'undefined') return;
  _spritePreloaded = true;
  const manifest = {
    blasterSheet: 'Assets/model/error_sans/ErrorSans-gaster-blaster-sprite-sheet.png?v=1',
    errorBone: 'Assets/model/error_sans/ErrorBoneV.png?v=1',
    errorBoneStab: 'Assets/model/error_sans/ErrorBoneStabV.png?v=1',
  };
  for (const [key, src] of Object.entries(manifest)) {
    const img = new Image();
    img.src = src;
    _spriteCache[key] = img;
  }
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _preloadErrorSansWeaponSprites();
}

function _getReadySprite(key) {
  _preloadErrorSansWeaponSprites();
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
    const grad = gctx.createRadialGradient(48, 48, 4, 48, 48, 46);
    grad.addColorStop(0, colorHex);
    grad.addColorStop(0.45, colorHex + '66');
    grad.addColorStop(1, colorHex + '00');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 96, 96);
  }
  _glowCache.set(colorHex, c);
  return c;
}

/**
 * Draws canonical ERROR Sans puppet-string casting hands when actively casting strings/skills.
 * Rule 20: Single-source-of-truth canonical hands anchored at (±r * 0.82, +r * 0.38).
 */
export function drawErrorSansWeaponPreview(ctx, x = 0, y = 0, angle = 0, r = 25, opts = {}) {
  const custom = state.weaponCustomizations?.error_sans || {};
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

  // Draw glowing Error String coils + hands at canonical flanks
  for (const side of [-1, 1]) {
    const hx = side * r * 0.82;
    const hy = r * 0.38;

    ctx.save();
    ctx.translate(hx, hy);
    // Cyan Error Strings streaming from fingertips
    ctx.strokeStyle = '#00A0FF';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(side * 12, -16);
    ctx.lineTo(side * 18, 6);
    ctx.stroke();

    ctx.strokeStyle = '#DD0000';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(side * 15, -10);
    ctx.stroke();

    drawPixelHand(ctx, 0, 0, handR, '#000000', '#EE0000', 1.6);
    ctx.restore();
  }

  // In Weapon Studio / Index preview, showcase a mini Error Bone & String crest beside the hands
  if (opts.isPreview) {
    const boneImg = _getReadySprite('errorBone');
    ctx.save();
    ctx.translate(r * 0.92, -r * 0.12);
    ctx.rotate(0.45);
    if (boneImg) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(boneImg, -9, -22, 18, 44);
    } else {
      ctx.fillStyle = '#DD0000';
      ctx.strokeStyle = '#0E0F14';
      ctx.lineWidth = 1.6;
      ctx.fillRect(-4, -18, 8, 36);
      ctx.strokeRect(-4, -18, 8, 36);
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws an Error Gaster Blaster (57x44 x 6 frames) + its crimson/cyan glitch laser beam.
 */
export function drawErrorGasterBlaster(ctx, blaster) {
  if (!blaster) return;

  ctx.save();
  ctx.translate(blaster.x, blaster.y);
  ctx.rotate(blaster.angle || 0);

  const scale = (blaster.scale || 1.0) * (blaster.spawnScale || 1.0);
  ctx.scale(scale, scale);

  const isFiring = Boolean(blaster.isFiring || blaster.fireTimer > 0);
  const isCharging = Boolean(blaster.isCharging || blaster.chargeTimer > 0);

  if (isFiring) {
    const recoil = Math.sin((blaster.fireProgress || 0.2) * Math.PI) * 10;
    ctx.translate(-recoil, 0);
    _drawErrorBlasterBeam(ctx, blaster);
  }

  let frameIdx = 0;
  if (isFiring) {
    frameIdx = (blaster.fireProgress || 0) > 0.85 ? 4 : 5;
  } else if (isCharging) {
    const p = Math.min(1, Math.max(0, blaster.chargeProgress || 0));
    if (p > 0.88) frameIdx = 4;
    else if (p > 0.70) frameIdx = 3;
    else if (p > 0.52) frameIdx = 2;
    else if (p > 0.30) frameIdx = 1;
  }

  const sheet = _getReadySprite('blasterSheet');
  if (sheet) {
    const fw = 57;
    const fh = 44;
    const sx = frameIdx * fw;
    ctx.save();
    // Source blaster faces down/right-aligned; orient snout forward (+X) matching Sans convention
    ctx.rotate(-Math.PI / 2);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, sx, 0, fw, fh, -28, -22, 56, 44);
    ctx.restore();
  } else {
    // Fallback crisp obsidian + crimson skull silhouette
    ctx.fillStyle = '#181A24';
    ctx.strokeStyle = '#DD0000';
    ctx.lineWidth = 2.0;
    ctx.fillRect(-18, -14, 34, 28);
    ctx.strokeRect(-18, -14, 34, 28);
    ctx.fillStyle = '#FFEB00';
    ctx.fillRect(4, -7, 6, 5);
    ctx.fillStyle = '#00A0FF';
    ctx.fillRect(4, 2, 6, 5);
  }

  // Charging glitch glow at mouth
  if (isCharging && !isFiring) {
    const glow = _getPrebakedGlow('#DD0000');
    const p = Math.min(1, Math.max(0.15, blaster.chargeProgress || 0.2));
    if (glow) {
      ctx.save();
      ctx.globalAlpha = 0.65 * p;
      const gSize = 26 * (0.6 + 0.7 * p);
      ctx.drawImage(glow, 18 - gSize * 0.5, -gSize * 0.5, gSize, gSize);
      ctx.restore();
    }
  }

  ctx.restore();
}

function _drawErrorBlasterBeam(ctx, blaster) {
  const worldReach = (blaster.effectiveReach !== undefined) ? blaster.effectiveReach : (blaster.reach || 850);
  const reach = Math.max(4, worldReach / Math.max(0.4, blaster.scale || 1.0) - 16);
  const bw = (blaster.beamWidth || 34) / Math.max(0.4, blaster.scale || 1.0);
  const flicker = 0.85 + 0.15 * Math.sin((blaster._age || 0) * 1.9);
  const curW = bw * flicker;

  ctx.save();
  // Outer crimson aura sheath
  ctx.fillStyle = 'rgba(221, 0, 0, 0.42)';
  ctx.fillRect(16, -curW * 0.72, reach, curW * 1.44);

  // Mid electric cyan glitch band
  ctx.fillStyle = 'rgba(0, 160, 255, 0.72)';
  ctx.fillRect(16, -curW * 0.48, reach, curW * 0.96);

  // Hot white/yellow inner core
  ctx.fillStyle = '#FFFDF5';
  ctx.fillRect(16, -curW * 0.24, reach, curW * 0.48);

  // Glitch artifact bars along beam
  if (reach > 32) {
    const tick = blaster._age || 0;
    ctx.fillStyle = '#FFEB00';
    for (let i = 0; i < 4; i++) {
      const bx = 28 + ((tick * 27 + i * 110) % Math.max(24, reach - 28));
      const by = ((i % 2 === 0) ? -1 : 1) * curW * 0.55;
      ctx.fillRect(bx, by - 2, Math.min(18, Math.max(4, reach - (bx - 16))), 4);
    }
  }
  ctx.restore();
}

/**
 * Draws an Error Bone projectile (crimson/cyan/obsidian).
 */
export function drawErrorBoneProjectile(ctx, bone) {
  if (!bone) return;
  const img = _getReadySprite('errorBone');

  ctx.save();
  ctx.translate(bone.x, bone.y);
  ctx.rotate((bone.angle || 0) + Math.PI / 2);
  if (img) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -8, -19, 16, 38);
  } else {
    ctx.fillStyle = '#24141D';
    ctx.strokeStyle = '#DD0000';
    ctx.lineWidth = 1.8;
    ctx.fillRect(-4, -14, 8, 28);
    ctx.strokeRect(-4, -14, 8, 28);
    ctx.fillStyle = '#00A0FF';
    ctx.fillRect(-3, -6, 6, 4);
  }
  ctx.restore();
}

/**
 * Draws Glitch Zone ground bone spike traps & pre-erupt warnings.
 */
export function drawErrorBoneTrap(ctx, trap) {
  if (!trap) return;
  const img = _getReadySprite('errorBoneStab');

  ctx.save();
  ctx.translate(trap.x, trap.y);
  if (trap.warnTimer > 0) {
    const pulse = (trap.warnTimer % 6 < 3) ? '#DD0000' : '#00A0FF';
    ctx.strokeStyle = pulse;
    ctx.lineWidth = 2.0;
    ctx.strokeRect(-14, -22, 28, 44);
    ctx.fillStyle = 'rgba(221, 0, 0, 0.22)';
    ctx.fillRect(-14, -22, 28, 44);
    ctx.fillStyle = '#FFEB00';
    ctx.font = '900 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', 0, 4);
  } else {
    const pop = Math.min(1.0, (trap.age || 1) / 4);
    const h = 44 * pop;
    if (img) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, -12, 22 - h, 24, h);
    } else {
      ctx.fillStyle = '#DD0000';
      ctx.strokeStyle = '#0E0F14';
      ctx.lineWidth = 1.6;
      ctx.fillRect(-8, 22 - h, 16, h);
      ctx.strokeRect(-8, 22 - h, 16, h);
    }
  }
  ctx.restore();
}

/**
 * Draws Electric Cyan Error Strings linking Error Sans to active tether nodes or targets.
 */
export function drawErrorStringsVFX(ctx, fighter, strings) {
  if (!fighter || !Array.isArray(strings) || strings.length === 0) return;

  ctx.save();
  for (const s of strings) {
    const sx = fighter.x;
    const sy = fighter.y;
    const tx = s.target && s.latched ? s.target.x : s.x;
    const ty = s.target && s.latched ? s.target.y : s.y;

    // Multi-segment jagged electric blue puppet string
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    const segs = 5;
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      const jx = (Math.sin((fighter._vfxTick || 0) * 0.8 + i * 2.1 + (s.seed || 0)) * 6);
      const jy = (Math.cos((fighter._vfxTick || 0) * 0.7 + i * 1.7 + (s.seed || 0)) * 6);
      ctx.lineTo(sx + (tx - sx) * t + jx, sy + (ty - sy) * t + jy);
    }
    ctx.lineTo(tx, ty);
    ctx.strokeStyle = '#00A0FF';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Soul trap knot around latched target
    if (s.latched && s.target) {
      const tr = (s.target.r || 25) + 6;
      ctx.strokeStyle = '#00A0FF';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(tx, ty, tr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#DD0000';
      ctx.font = '900 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ERR', tx, ty - tr - 5);
    }
  }
  ctx.restore();
}

/**
 * Draws Forced Crash glitch windows, ERROR tags, and staggered clean concentric ripples (Rule 26).
 */
export function drawForcedCrashVFX(ctx, windows, ripples) {
  if (Array.isArray(windows) && windows.length > 0) {
    ctx.save();
    for (const w of windows) {
      const a = Math.min(1, w.life / Math.max(1, w.maxLife * 0.45));
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = '#0E0F14';
      ctx.fillRect(w.x - w.w * 0.5, w.y - w.h * 0.5, w.w, w.h);
      ctx.strokeStyle = w.color || '#DD0000';
      ctx.lineWidth = 2.0;
      ctx.strokeRect(w.x - w.w * 0.5, w.y - w.h * 0.5, w.w, w.h);

      // Header bar
      ctx.fillStyle = w.color || '#DD0000';
      ctx.fillRect(w.x - w.w * 0.5, w.y - w.h * 0.5, w.w, 8);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(w.text || 'ERROR', w.x, w.y + 4);
    }
    ctx.restore();
  }

  // Rule 26: Sequential staggered concentric shockwave ripples (zero radial spoke cobwebs)
  if (Array.isArray(ripples) && ripples.length > 0) {
    ctx.save();
    const offsets = [0.0, 0.14, 0.28];
    const colors = ['#FFFFFF', '#DD0000', '#00A0FF'];
    for (const r of ripples) {
      const p = 1 - r.life / Math.max(1, r.maxLife);
      for (let k = 0; k < offsets.length; k++) {
        const lp = (p - offsets[k]) / (1 - offsets[k]);
        if (lp <= 0 || lp >= 1) continue;
        const rad = r.maxRadius * Math.pow(lp, 0.65);
        const fadeOut = Math.pow(1 - lp, 1.25);
        const popIn = lp < 0.08 ? (lp / 0.08) : 1;
        ctx.globalAlpha = fadeOut * popIn * 0.85;
        ctx.strokeStyle = colors[k];
        ctx.lineWidth = Math.max(1.2, (4.2 - k * 0.9) * (1 - lp * 0.55));
        ctx.beginPath();
        ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
        ctx.stroke();

        if (k === 1) {
          ctx.fillStyle = `rgba(221, 0, 0, ${0.14 * fadeOut})`;
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }
}
