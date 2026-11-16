// ───────────────────────────────────────────────────────────────────────────
// Sōsuke Aizen — VFX & Zanpakutō Graphics Renderer
// Combines extracted Jump Force MUGEN VFX strips (Assets/effects/aizen/)
// with 60 FPS Canvas 2D procedural anime VFX.
//
// Adheres strictly to:
// - Rule 11: Zero ctx.shadowBlur / shadowColor
// - Rule 15: Double-tapered crescent blade slash + recovery tail-to-tip wipe
// - Rule 16: 4-point filled needle speed lines on Shunpo dashes
// - Rule 20: Weapon anchored cleanly at canonical hand offset
// - Rule 26: Sequential water-ripple concentric shockwaves (zero radial spokes)
// - Rule 30: 5-phase melee swing kinematics & impact lock tremor
// - Rule 35: Lazy VFX asset loading & pre-baked offscreen radial glow quads
// ───────────────────────────────────────────────────────────────────────────

import { drawPixelHand } from '../renderers/fighterRenderer.js';
import { aizenConfig } from '../../configs/characters/aizenConfig.js';

// ── Lazy Cached VFX Sprite Strips (Rule 35) ──
const _vfxImages = new Map();
function _getAizenVfxImage(key) {
  if (_vfxImages.has(key)) {
    const img = _vfxImages.get(key);
    return (img && img.complete && (img.naturalWidth > 0 || img.width > 0)) ? img : null;
  }
  const src = aizenConfig.vfxAssets?.[key];
  if (!src || typeof Image === 'undefined') return null;
  const img = new Image();
  img.src = src;
  _vfxImages.set(key, img);
  return (img.complete && (img.naturalWidth > 0 || img.width > 0)) ? img : null;
}

const _PREWARM_GLOW_SPECS = [
  ['violet_aura', 'rgba(168, 85, 247, 0.38)', 'rgba(139, 92, 246, 0.14)'],
  ['crimson_aura', 'rgba(225, 29, 72, 0.34)', 'rgba(139, 92, 246, 0.16)'],
  ['hogyoku_core', 'rgba(240, 171, 252, 0.9)', 'rgba(139, 92, 246, 0.3)'],
  ['raikoho_hit', 'rgba(250, 204, 21, 0.85)', 'rgba(139, 92, 246, 0.35)'],
  ['fragor_blast', 'rgba(244, 63, 94, 0.9)', 'rgba(139, 92, 246, 0.42)'],
  ['kuro_aura', 'rgba(139, 92, 246, 0.55)', 'rgba(15, 10, 30, 0.35)'],
  ['kuro_shatter', 'rgba(192, 132, 252, 0.85)', 'rgba(88, 28, 135, 0.35)'],
  ['bigbang_charge', 'rgba(251, 113, 133, 0.90)', 'rgba(139, 92, 246, 0.45)']
];

// Pre-warm lazily in browser without blocking SSR/Node tests
export function prewarmAizenVfxAssets(targetCtx = null) {
  if (typeof window === 'undefined' || typeof Image === 'undefined') return 0;
  let warmedCount = 0;
  for (const [colorKey, innerRgba, midRgba] of _PREWARM_GLOW_SPECS) {
    _getPrebakedGlow(colorKey, innerRgba, midRgba);
  }
  for (const key of Object.keys(aizenConfig.vfxAssets || {})) {
    const img = _getAizenVfxImage(key);
    warmedCount++;
    if (img && targetCtx && typeof targetCtx.drawImage === 'function') {
      try {
        targetCtx.save();
        targetCtx.globalAlpha = 0.001;
        targetCtx.drawImage(img, 0, 0, 1, 1, -10, -10, 1, 1);
        targetCtx.restore();
      } catch (e) {
        try { targetCtx.restore(); } catch (_) {}
      }
    }
  }
  return warmedCount;
}

// ── Pre-Baked Offscreen Radial Glow Quads (Rule 35: Zero Per-Frame Gradients) ──
const _glowCache = new Map();
function _getPrebakedGlow(colorKey, innerRgba, midRgba) {
  if (_glowCache.has(colorKey)) return _glowCache.get(colorKey);
  if (typeof document === 'undefined') return null;
  const size = 128;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  if (!g) return null;
  const half = size / 2;
  const grad = g.createRadialGradient(half, half, 2, half, half, half);
  grad.addColorStop(0.0, innerRgba);
  grad.addColorStop(0.45, midRgba);
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  _glowCache.set(colorKey, c);
  return c;
}

function _drawGlowQuad(ctx, x, y, radius, colorKey, innerRgba, midRgba, alpha = 1.0) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  const glow = _getPrebakedGlow(colorKey, innerRgba, midRgba);
  if (!glow) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.drawImage(glow, x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

function _drawSpriteStripFrame(ctx, imgKey, frameCount, progress, x, y, drawW, drawH, alpha = 1.0, rotation = 0) {
  const img = _getAizenVfxImage(imgKey);
  if (!img || alpha <= 0.01) return false;
  const w = img.naturalWidth || img.width || 0;
  const h = img.naturalHeight || img.height || 0;
  if (w <= 0 || h <= 0) return false;
  const cellW = Math.floor(w / frameCount);
  if (cellW <= 0) return false;
  const fIdx = Math.max(0, Math.min(frameCount - 1, Math.floor(progress * frameCount)));

  ctx.save();
  ctx.translate(x, y);
  if (rotation !== 0) ctx.rotate(rotation);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.drawImage(img, fIdx * cellW, 0, cellW, h, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
  return true;
}

// ── 5-Phase Melee Swing Kinematics Helper (Rule 30) ──
export function getAizenSwingKinematics(fighter) {
  const phase = fighter.swordSwingPhase || 'idle';
  const p = Math.max(0, Math.min(1, fighter.swordSwingPhaseProgress || 0));
  const dir = (fighter.swordComboIndex % 2 === 0) ? 1 : -1;

  if (!fighter.isSlashing || phase === 'idle') {
    return {
      rotOffset: 0.25 * dir,
      lunge: 0,
      offY: 0,
      isImpactLock: false,
      showSlash: false,
      slashSweepP: 0,
      slashRecP: 0,
      dir,
    };
  }

  if (phase === 'lift') {
    const ease = 1 - Math.pow(1 - p, 2);
    return {
      rotOffset: dir * (-1.35 * ease),
      lunge: -5 * ease,
      offY: -4 * ease * dir,
      isImpactLock: false,
      showSlash: false,
      slashSweepP: 0,
      slashRecP: 0,
      dir,
    };
  }
  if (phase === 'hold') {
    return {
      rotOffset: dir * -1.38,
      lunge: -5,
      offY: -4 * dir,
      isImpactLock: false,
      showSlash: false,
      slashSweepP: 0,
      slashRecP: 0,
      dir,
    };
  }
  if (phase === 'strike') {
    const whip = Math.pow(p, 0.55);
    return {
      rotOffset: dir * (-1.38 + 2.76 * whip),
      lunge: -5 + 14 * whip,
      offY: (-4 + 7 * whip) * dir,
      isImpactLock: false,
      showSlash: true,
      slashSweepP: whip,
      slashRecP: 0,
      dir,
    };
  }
  if (phase === 'impactLock') {
    const jitter = Math.sin(p * Math.PI * 6) * 1.4;
    return {
      rotOffset: dir * 1.38 + jitter * 0.03,
      lunge: 9 + jitter,
      offY: 3 * dir + jitter * 0.5,
      isImpactLock: true,
      showSlash: true,
      slashSweepP: 1.0,
      slashRecP: 0,
      dir,
    };
  }
  // Recovery phase with spring-damped oscillation (Rule 30)
  const damp = Math.exp(-p * 4.2);
  const osc = Math.sin(p * Math.PI * 2.2) * damp * 0.18;
  return {
    rotOffset: dir * (1.38 * (1 - p) + 0.25 * p) + osc,
    lunge: 9 * (1 - p),
    offY: 3 * dir * (1 - p),
    isImpactLock: false,
    showSlash: p < 0.72,
    slashSweepP: 1.0,
    slashRecP: Math.min(1, p / 0.72),
    dir,
  };
}

/**
 * Draw Kyōka Suigetsu Zanpakutō & Double-Tapered Crescent Slash Arc (Rules 15, 20, 30)
 */
export function drawAizenBladeAndSlashVFX(ctx, fighter) {
  if (!fighter || fighter.hideWeapon) return;
  const r = fighter.r || 30;
  const aim = fighter._isWinnerReveal ? 0 : (fighter.gunAngle || 0);
  const normAim = Math.atan2(Math.sin(aim), Math.cos(aim));
  const facingLeft = Math.abs(normAim) > Math.PI / 2;
  const kin = getAizenSwingKinematics(fighter);
  const formLevel = fighter.aizenForm || 0; // 0: Base, 1: Hogyoku, 2: Final

  // Mid-lower chest hand anchor (0.82r, 0.52r) straddling the lower torso flank
  const handLocalX = r * 0.82 + kin.lunge;
  const handLocalY = r * 0.52 + kin.offY;
  const bladeLen = r * (formLevel >= 2 ? 2.15 : 1.85);
  const bladeColor = formLevel >= 2 ? '#E9D5FF' : (formLevel === 1 ? '#DDD6FE' : '#E2E8F0');
  const edgeGlow = formLevel >= 2 ? '#E11D48' : '#8B5CF6';

  ctx.save();
  ctx.translate(fighter.x || 0, (fighter.y || 0) - (fighter.z || 0));
  ctx.rotate(aim);
  if (facingLeft && !fighter.isSpinning) {
    ctx.scale(1, -1);
  }

  // 1. Dynamic Arm Segment connecting torso flank to wielding hand (Rule 30)
  if (!fighter._isSilhouettePass) {
    ctx.beginPath();
    ctx.moveTo(r * 0.55, r * 0.34);
    ctx.lineTo(handLocalX, handLocalY);
    ctx.lineWidth = Math.max(4, r * 0.24);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0E0F14';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(r * 0.55, r * 0.34);
    ctx.lineTo(handLocalX, handLocalY);
    ctx.lineWidth = Math.max(2.5, r * 0.16);
    ctx.strokeStyle = formLevel >= 1 ? '#F1F5F9' : '#1E1B2E';
    ctx.stroke();
  }

  // 2. Zanpakutō Blade at Canonical Hand
  ctx.save();
  ctx.translate(handLocalX, handLocalY);
  ctx.rotate(kin.rotOffset);

  // Hilt + Emerald/Violet Tsuka-ito & Hexagonal Tsuba (Kyōka Suigetsu motif)
  ctx.fillStyle = '#1E293B';
  ctx.strokeStyle = '#0E0F14';
  ctx.lineWidth = 1.6;
  ctx.fillRect(-10, -2.5, 13, 5);
  ctx.strokeRect(-10, -2.5, 13, 5);

  // Hexagonal guard (tsuba)
  ctx.fillStyle = formLevel >= 1 ? '#C084FC' : '#10B981';
  ctx.beginPath();
  ctx.rect(1, -6.5, 3.5, 13);
  ctx.fill();
  ctx.stroke();

  // Katana blade
  ctx.beginPath();
  ctx.moveTo(4.5, -2.6);
  ctx.lineTo(bladeLen - 6, -2.0);
  ctx.lineTo(bladeLen, 0.2);
  ctx.lineTo(bladeLen - 5, 2.5);
  ctx.lineTo(4.5, 2.3);
  ctx.closePath();
  ctx.fillStyle = bladeColor;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();

  // Reiatsu blade edge sheen (non-silhouette only)
  if (!fighter._isSilhouettePass) {
    ctx.beginPath();
    ctx.moveTo(6, -1.3);
    ctx.lineTo(bladeLen - 3, -0.8);
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = edgeGlow;
    ctx.stroke();
  }

  // Canonical Hand drawn directly over hilt grip (Rule 20)
  if (!fighter.hideHands && !fighter.hideFrontHand) {
    drawPixelHand(ctx, 0, 0, Math.max(5, r * 0.26), '#FEDBC0', '#0E0F14');
  }
  ctx.restore();

  // 3. Double-Tapered Crescent Slash Arc with Recovery Eraser Wipe (Rule 15)
  if (kin.showSlash && !fighter._isSilhouettePass) {
    const reach = (fighter.swordRange || 76) * (formLevel >= 2 ? 1.18 : 1.0);
    const arcHalf = 1.25;
    const startA = -arcHalf * kin.dir;
    const endA = arcHalf * kin.dir;

    // Tail chases tip during recovery (eraser wipe)
    const wipeCurve = kin.slashRecP > 0 ? Math.pow(kin.slashRecP, 1.35) : 0;
    const curStart = startA + (endA - startA) * wipeCurve;
    const curEnd = startA + (endA - startA) * kin.slashSweepP;

    const segments = 16;
    const maxThick = r * (formLevel >= 1 ? 0.68 : 0.54) * (1 - wipeCurve * 0.45);
    if (Math.abs(curEnd - curStart) > 0.06 && maxThick > 0.8) {
      const outerPts = [];
      const innerPts = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const a = curStart + (curEnd - curStart) * t;
        const taper = Math.pow(Math.sin(t * Math.PI), 1.15) * (0.3 + 0.7 * t);
        const thick = maxThick * taper;
        outerPts.push([Math.cos(a) * (reach + thick * 0.5), Math.sin(a) * (reach + thick * 0.5)]);
        innerPts.push([Math.cos(a) * (reach - thick * 0.5), Math.sin(a) * (reach - thick * 0.5)]);
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(outerPts[0][0], outerPts[0][1]);
      for (let i = 1; i < outerPts.length; i++) ctx.lineTo(outerPts[i][0], outerPts[i][1]);
      for (let i = innerPts.length - 1; i >= 0; i--) ctx.lineTo(innerPts[i][0], innerPts[i][1]);
      ctx.closePath();
      ctx.fillStyle = formLevel >= 2 ? 'rgba(225, 29, 72, 0.78)' : 'rgba(139, 92, 246, 0.82)';
      ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = '#0E0F14';
      ctx.stroke();

      // Inner crisp white crescent core
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const a = curStart + (curEnd - curStart) * t;
        const px = Math.cos(a) * reach;
        const py = Math.sin(a) * reach;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.lineWidth = Math.max(1.5, maxThick * 0.30);
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.stroke();
      ctx.restore();
    }

    // MUGEN violet dimensional blade wave accent on active strike / impact lock
    if (fighter.swordSwingPhase === 'strike' || fighter.swordSwingPhase === 'impactLock') {
      const waveP = fighter.swordSwingPhase === 'strike' ? (fighter.swordSwingPhaseProgress || 0) * 0.65 : 0.75;
      _drawSpriteStripFrame(ctx, 'slashWave', 8, waveP, reach * 0.65, 0, reach * 1.5, reach * 0.85, 0.82, kin.dir * 0.38);
    }
  }

  ctx.restore();
}

/**
 * Draw Shunpo Afterimage Speed Lines (Rule 16: 4-point filled needle polygons)
 */
export function drawAizenShunpoSpeedLinesVFX(ctx, fighter) {
  if (!fighter || !fighter.shunpoVfxTimer || fighter.shunpoVfxTimer <= 0 || fighter._isSilhouettePass) return;
  const alpha = Math.min(1, fighter.shunpoVfxTimer / 14);
  const aim = fighter.shunpoAngle ?? fighter.gunAngle ?? 0;
  const cosA = Math.cos(aim);
  const sinA = Math.sin(aim);
  const perpX = -sinA;
  const perpY = cosA;
  const r = fighter.r || 30;
  const palette = ['#8B5CF6', '#C084FC', '#FFFFFF', '#0E0F14'];

  ctx.save();
  ctx.globalAlpha = alpha * 0.88;
  for (let i = 0; i < 8; i++) {
    const lat = ((i - 3.5) / 3.5) * (r * 1.35);
    const backOffset = r * 0.6 + (i % 3) * 14 + (1 - alpha) * 26;
    const len = 32 + (i % 2) * 20;
    const halfW = 1.0 + (i % 3) * 0.45;
    const cx = (fighter.x || 0) - cosA * backOffset + perpX * lat;
    const cy = (fighter.y || 0) - (fighter.z || 0) - sinA * backOffset + perpY * lat;
    const startX = cx - cosA * len;
    const startY = cy - sinA * len;
    const endX = cx + cosA * (len * 0.35);
    const endY = cy + sinA * (len * 0.35);
    const midX = (startX + endX) * 0.5;
    const midY = (startY + endY) * 0.5;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(midX + perpX * halfW, midY + perpY * halfW);
    ctx.lineTo(endX, endY);
    ctx.lineTo(midX - perpX * halfW, midY - perpY * halfW);
    ctx.closePath();
    ctx.fillStyle = palette[i % palette.length];
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draw Hōgyoku / Final Form Aura, Transcendent Wings & Evolution Pillar VFX
 */
export function drawAizenFormAuraVFX(ctx, fighter) {
  if (!fighter || fighter._isSilhouettePass) return;
  const x = fighter.x || 0;
  const y = (fighter.y || 0) - (fighter.z || 0);
  const r = fighter.r || 30;
  const formLevel = fighter.aizenForm || 0;
  const t = (fighter._vfxTick || 0) * 0.08;

  // 1. Subtle ambient Reiatsu glow quad (pre-baked)
  if (formLevel === 1) {
    _drawGlowQuad(ctx, x, y, r * 2.1, 'violet_aura', 'rgba(168, 85, 247, 0.38)', 'rgba(139, 92, 246, 0.14)', 0.72);
  } else if (formLevel >= 2) {
    _drawGlowQuad(ctx, x, y, r * 2.45, 'crimson_aura', 'rgba(225, 29, 72, 0.34)', 'rgba(139, 92, 246, 0.16)', 0.80);

    // Transcendent Final Form crescent energy wings behind body
    ctx.save();
    ctx.translate(x, y);
    const wingPulse = 1 + Math.sin(t * 1.4) * 0.06;
    for (const side of [-1, 1]) {
      for (let k = 0; k < 2; k++) {
        const ang = side * (0.55 + k * 0.42);
        const wLen = r * (2.35 - k * 0.35) * wingPulse;
        ctx.save();
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(side * wLen * 0.45, -wLen * 0.55, side * wLen, -wLen * 0.18);
        ctx.quadraticCurveTo(side * wLen * 0.52, -wLen * 0.10, 0, r * 0.25);
        ctx.closePath();
        ctx.fillStyle = k === 0 ? 'rgba(233, 213, 255, 0.42)' : 'rgba(139, 92, 246, 0.36)';
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(14, 15, 20, 0.7)';
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // 2. Orbiting Hōgyoku Prism Core when Form >= 1
  if (formLevel >= 1) {
    const orbitAngle = t * 0.9;
    const ox = x + Math.cos(orbitAngle) * (r * 0.95);
    const oy = y + Math.sin(orbitAngle) * (r * 0.45) - r * 0.15;
    _drawGlowQuad(ctx, ox, oy, 14, 'hogyoku_core', 'rgba(240, 171, 252, 0.9)', 'rgba(139, 92, 246, 0.3)', 0.85);
    ctx.save();
    ctx.beginPath();
    ctx.arc(ox, oy, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = formLevel >= 2 ? '#FB7185' : '#A855F7';
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = '#0E0F14';
    ctx.stroke();
    ctx.restore();
  }

  // 3. Extracted Reiatsu Pillar Burst on Form Evolution
  if (fighter.formTransformVfxTimer > 0) {
    const p = 1 - fighter.formTransformVfxTimer / 42;
    const alpha = Math.sin(Math.min(1, p) * Math.PI);
    _drawSpriteStripFrame(ctx, 'reiatsuPillar', 8, p, x, y - r * 0.6, r * 4.4, r * 5.2, alpha);
  }

  // 4. Hadō #63 Raikōhō / Multi-Orbs / Fragor Windup Charge Sphere
  if (fighter.raikohoWindupTimer > 0) {
    const maxW = 14;
    const wp = Math.max(0, Math.min(1, 1 - fighter.raikohoWindupTimer / maxW));
    const castAng = fighter.skillCastAngle ?? fighter.gunAngle ?? 0;
    const cx = x + Math.cos(castAng) * (r + 14);
    const cy = y + Math.sin(castAng) * (r + 14);
    const chargeR = r * (0.45 + wp * 0.55);
    const stripKey = formLevel >= 2 ? 'fragorBurst' : (formLevel === 1 ? 'hogyokuOrb' : 'raikohoLightning');
    const frames = formLevel >= 1 ? 8 : 7;
    const glowKey = formLevel >= 2 ? 'fragor_charge' : (formLevel === 1 ? 'hog_charge' : 'rai_charge');
    const c1 = formLevel >= 2 ? 'rgba(244, 63, 94, 0.90)' : (formLevel === 1 ? 'rgba(192, 132, 252, 0.90)' : 'rgba(250, 204, 21, 0.90)');
    const c2 = formLevel >= 2 ? 'rgba(139, 92, 246, 0.35)' : 'rgba(139, 92, 246, 0.30)';
    _drawGlowQuad(ctx, cx, cy, chargeR * 2.1, glowKey, c1, c2, 0.55 + wp * 0.45);
    _drawSpriteStripFrame(ctx, stripKey, frames, wp, cx, cy, chargeR * 3.0, chargeR * 3.0, 0.85, wp * 2.2);
  }
}

/**
 * Draw Bakudō #81: Danku Translucent Hexagonal Kido Barrier
 */
export function drawAizenDankuVFX(ctx, fighter) {
  if (!fighter || !fighter.dankuActive || fighter.dankuTimer <= 0 || fighter._isSilhouettePass) return;
  const x = fighter.x || 0;
  const y = (fighter.y || 0) - (fighter.z || 0);
  const aim = fighter.dankuAngle ?? fighter.gunAngle ?? 0;
  const dist = (fighter.r || 30) + 18;
  const bx = x + Math.cos(aim) * dist;
  const by = y + Math.sin(aim) * dist;
  const fade = Math.min(1, fighter.dankuTimer / 14);
  const wallH = (fighter.dankuRadius || 42) * 1.45;

  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(aim);
  ctx.globalAlpha = fade * 0.88;

  // Translucent hexagonal-bevel shield wall
  ctx.beginPath();
  ctx.moveTo(-6, -wallH * 0.5);
  ctx.lineTo(6, -wallH * 0.42);
  ctx.lineTo(8, 0);
  ctx.lineTo(6, wallH * 0.42);
  ctx.lineTo(-6, wallH * 0.5);
  ctx.lineTo(-8, 0);
  ctx.closePath();
  ctx.fillStyle = 'rgba(139, 92, 246, 0.28)';
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = '#C084FC';
  ctx.stroke();

  // Inner white Kido brace line
  ctx.beginPath();
  ctx.moveTo(0, -wallH * 0.38);
  ctx.lineTo(0, wallH * 0.38);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw Kyōka Suigetsu Mirror-Shatter Counter & Mirage Clone VFX
 */
export function drawAizenKyokaVFX(ctx, fighter) {
  if (!fighter || fighter._isSilhouettePass) return;
  const x = fighter.x || 0;
  const y = (fighter.y || 0) - (fighter.z || 0);
  const r = fighter.r || 30;

  // Active parry stance shimmering illusion ring
  if (fighter.isKyokaCounterStance && fighter.kyokaCounterTimer > 0) {
    const pulse = (Math.sin((fighter._vfxTick || 0) * 0.35) + 1) * 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r * (1.28 + pulse * 0.14), 0, Math.PI * 2);
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.85)';
    ctx.stroke();
    ctx.restore();
  }

  // Triggered Kyōka Suigetsu glass-shatter bursts
  const effects = fighter.activeVisualEffects;
  if (!effects || effects.length === 0) return;
  for (let i = 0; i < effects.length; i++) {
    const fx = effects[i];
    const p = 1 - fx.timer / Math.max(1, fx.maxTimer);
    if (fx.kind === 'kyokaShatter') {
      const alpha = Math.pow(1 - p, 0.65);
      // Lingering mirage silhouette circle at decoy origin
      ctx.save();
      ctx.globalAlpha = alpha * 0.45;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, (fx.radius || 32) * (1 + p * 0.25), 0, Math.PI * 2);
      ctx.fillStyle = '#8B5CF6';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      ctx.restore();

      // Extracted MUGEN glass shatter strip + top-layer violet cross-flash (Action 7015 / G7007)
      _drawSpriteStripFrame(ctx, 'kyokaShatter', 8, p, fx.x, fx.y, 145, 145, alpha * 0.92);
      if (p < 0.85) {
        _drawSpriteStripFrame(ctx, 'kuroFlash', 4, p / 0.85, fx.x, fx.y, 168, 168, alpha * 0.98, 0.25);
      }

      // Sharp drifting mirror shards (discrete triangles, zero radial lines)
      ctx.save();
      ctx.globalAlpha = alpha;
      for (let s = 0; s < 8; s++) {
        const sa = (s / 8) * Math.PI * 2 + 0.3;
        const dist = 12 + p * 54 * (0.7 + (s % 3) * 0.25);
        const sx = fx.x + Math.cos(sa) * dist;
        const sy = fx.y + Math.sin(sa) * dist;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(sa + p * 3.5);
        ctx.beginPath();
        ctx.moveTo(-5, -3);
        ctx.lineTo(6, 0);
        ctx.lineTo(-2, 5);
        ctx.closePath();
        ctx.fillStyle = s % 2 === 0 ? '#E9D5FF' : '#8B5CF6';
        ctx.fill();
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = '#0E0F14';
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    } else if (fx.kind === 'raikohoImpact') {
      const alpha = Math.pow(1 - p, 0.75);
      _drawGlowQuad(ctx, fx.x, fx.y, fx.radius * (0.6 + p * 0.7), 'raikoho_hit', 'rgba(250, 204, 21, 0.85)', 'rgba(139, 92, 246, 0.35)', alpha);
      _drawSpriteStripFrame(ctx, 'raikohoColumn', 8, p, fx.x, fx.y - fx.radius * 0.38, fx.radius * 2.0, fx.radius * 2.5, alpha * 0.95);
      _drawSpriteStripFrame(ctx, 'raikohoLightning', 7, p, fx.x, fx.y, fx.radius * 2.2, fx.radius * 2.2, alpha * 0.9);
      _drawSequentialShockwaves(ctx, fx.x, fx.y, fx.radius * 1.15, p, 'rgba(250, 204, 21, 0.14)', '#FACC15', '#8B5CF6');
    } else if (fx.kind === 'hogyokuImpact') {
      const alpha = Math.pow(1 - p, 0.75);
      _drawGlowQuad(ctx, fx.x, fx.y, fx.radius * (0.7 + p * 0.7), 'hog_hit', 'rgba(192, 132, 252, 0.90)', 'rgba(109, 40, 217, 0.35)', alpha);
      _drawSpriteStripFrame(ctx, 'hogyokuPop', 5, p, fx.x, fx.y, fx.radius * 2.2, fx.radius * 2.2, alpha * 0.95);
      _drawSequentialShockwaves(ctx, fx.x, fx.y, fx.radius * 1.15, p, 'rgba(168, 85, 247, 0.16)', '#E9D5FF', '#9333EA');
    } else if (fx.kind === 'reiatsuCrush') {
      const alpha = Math.pow(1 - p, 0.7);
      _drawSpriteStripFrame(ctx, 'reiatsuPillar', 8, p, fx.x, fx.y - fx.radius * 0.32, fx.radius * 1.8, fx.radius * 2.0, alpha * 0.85);
      _drawSequentialShockwaves(ctx, fx.x, fx.y, fx.radius, p, 'rgba(139, 92, 246, 0.18)', '#C084FC', '#4C1D95');
    } else if (fx.kind === 'fragorExplosion') {
      const alpha = Math.pow(1 - p, 0.55);
      _drawGlowQuad(ctx, fx.x, fx.y, fx.radius * (0.7 + p * 0.65), 'fragor_blast', 'rgba(244, 63, 94, 0.9)', 'rgba(139, 92, 246, 0.42)', alpha);
      _drawSpriteStripFrame(ctx, 'bigBangPillar', 8, p, fx.x, fx.y - fx.radius * 0.36, fx.radius * 2.0, fx.radius * 2.4, alpha * 0.92);
      _drawSpriteStripFrame(ctx, 'fragorBurst', 8, p, fx.x, fx.y, fx.radius * 2.2, fx.radius * 2.2, alpha);
      if (p < 0.80) {
        _drawSpriteStripFrame(ctx, 'kuroFlash', 4, p / 0.80, fx.x, fx.y, fx.radius * 2.25, fx.radius * 2.25, alpha * 0.96);
      }
      _drawSequentialShockwaves(ctx, fx.x, fx.y, fx.radius * 1.25, p, 'rgba(225, 29, 72, 0.18)', '#FDA4AF', '#8B5CF6');
    } else if (fx.kind === 'kuroSlashSpark') {
      // MUGEN Statedef 804 (Action 7015 / G7007): Expanding angled violet slash spark on melee & coffin hits
      const alpha = Math.pow(1 - p, 0.45);
      const drawSize = (fx.radius || 64) * (1.75 + p * 0.85);
      _drawGlowQuad(ctx, fx.x, fx.y, (fx.radius || 64) * 0.95, 'kuro_spark', 'rgba(216, 180, 254, 0.88)', 'rgba(124, 58, 237, 0.38)', alpha * 0.85);
      _drawSpriteStripFrame(ctx, 'kuroFlash', 4, p, fx.x, fx.y, drawSize, drawSize, alpha, fx.angle || 0);
    } else if (fx.kind === 'multiExplosionPillar') {
      const alpha = Math.pow(1 - p, 0.55);
      const pillarH = (fx.radius || 56) * 2.55;
      const pillarW = (fx.radius || 56) * 1.65;
      _drawGlowQuad(ctx, fx.x, fx.y, (fx.radius || 56) * (0.85 + p * 0.65), 'multi_exp', 'rgba(225, 29, 72, 0.78)', 'rgba(124, 58, 237, 0.36)', alpha);
      _drawSpriteStripFrame(ctx, 'explosionSmoke', 8, p, fx.x, fx.y - pillarH * 0.12, pillarW * 1.15, pillarW * 1.15, alpha * 0.92);
      _drawSpriteStripFrame(ctx, 'multiExplosion', 8, p, fx.x, fx.y - pillarH * 0.34, pillarW * 1.05, pillarH, alpha);
      _drawSequentialShockwaves(ctx, fx.x, fx.y, (fx.radius || 56) * 1.15, p, 'rgba(225, 29, 72, 0.16)', '#F43F5E', '#8B5CF6');
    } else if (fx.kind === 'darkBlast') {
      const alpha = Math.pow(1 - p, 0.65);
      _drawGlowQuad(ctx, fx.x, fx.y, (fx.radius || 46) * (0.7 + p * 0.6), 'dark_blast', 'rgba(139, 92, 246, 0.85)', 'rgba(15, 10, 28, 0.42)', alpha);
      _drawSpriteStripFrame(ctx, 'darkBlast', 8, p, fx.x, fx.y, (fx.radius || 46) * 2.1, (fx.radius || 46) * 2.1, alpha * 0.94);
    } else if (fx.kind === 'consecutiveFinisher') {
      const alpha = Math.pow(1 - p, 0.55);
      const h = (fx.radius || 52) * 3.1;
      const w = (fx.radius || 52) * 1.45;
      _drawGlowQuad(ctx, fx.x, fx.y, (fx.radius || 52) * 1.4, 'consec_fin', 'rgba(244, 63, 94, 0.90)', 'rgba(139, 92, 246, 0.38)', alpha);
      _drawSpriteStripFrame(ctx, 'finisherBeam', 8, p, fx.x, fx.y - h * 0.15, w, h, alpha * 0.95);
      _drawSpriteStripFrame(ctx, 'slashWave', 8, p, fx.x, fx.y, w * 1.45, w * 1.15, alpha * 0.92, fx.angle || 0);
      if (p < 0.75) {
        _drawSpriteStripFrame(ctx, 'kuroFlash', 4, p / 0.75, fx.x, fx.y, w * 1.6, w * 1.6, alpha * 0.95, (fx.angle || 0) + 0.4);
      }
    } else if (fx.kind === 'thunderboltPillar') {
      const alpha = Math.pow(1 - p, 0.6);
      const r = fx.radius || 48;
      _drawGlowQuad(ctx, fx.x, fx.y, r * 1.45, 'thunder_pillar', 'rgba(192, 132, 252, 0.92)', 'rgba(250, 204, 21, 0.34)', alpha);
      _drawSpriteStripFrame(ctx, 'raikohoColumn', 8, p, fx.x, fx.y - r * 0.48, r * 1.85, r * 2.55, alpha * 0.92);
      _drawSpriteStripFrame(ctx, 'thunderboltArc', 8, p, fx.x, fx.y, r * 2.15, r * 2.15, alpha * 0.95);
      _drawSequentialShockwaves(ctx, fx.x, fx.y, r * 1.05, p, 'rgba(168, 85, 247, 0.16)', '#E9D5FF', '#FACC15');
    } else if (fx.kind === 'swallowAbyss') {
      const alpha = Math.sin(Math.min(1, p) * Math.PI) * 0.95 + (1 - p) * 0.25;
      const r = fx.radius || 76;
      _drawGlowQuad(ctx, fx.x, fx.y, r * 1.35, 'swallow_abyss', 'rgba(88, 28, 135, 0.72)', 'rgba(15, 10, 30, 0.45)', Math.min(1, alpha));
      _drawSpriteStripFrame(ctx, 'swallowAbyss', 8, p, fx.x, fx.y, r * 2.15, r * 2.15, Math.min(1, alpha));
      _drawSequentialShockwaves(ctx, fx.x, fx.y, r * 1.15, p, 'rgba(76, 29, 149, 0.20)', '#C084FC', '#1E1B4B');
    } else if (fx.kind === 'rushCrushSmash') {
      const alpha = Math.pow(1 - p, 0.6);
      const r = fx.radius || 64;
      _drawGlowQuad(ctx, fx.x, fx.y, r * 1.4, 'rush_smash', 'rgba(254, 240, 138, 0.90)', 'rgba(225, 29, 72, 0.38)', alpha);
      _drawSpriteStripFrame(ctx, 'crushSmash', 8, p, fx.x, fx.y - r * 0.15, r * 2.4, r * 1.65, alpha);
      _drawSequentialShockwaves(ctx, fx.x, fx.y, r * 1.35, p, 'rgba(250, 204, 21, 0.18)', '#FEF08A', '#FB7185');
    } else if (fx.kind === 'paralysisVibration') {
      const alpha = Math.pow(1 - p, 0.55);
      const r = fx.radius || 115;
      _drawGlowQuad(ctx, fx.x, fx.y, r * 0.9, 'vib_pulse', 'rgba(216, 180, 254, 0.85)', 'rgba(147, 51, 234, 0.32)', alpha);
      _drawSpriteStripFrame(ctx, 'vibrationRings', 8, p, fx.x, fx.y, r * 2.05, r * 2.05, alpha);
      _drawSequentialShockwaves(ctx, fx.x, fx.y, r * 1.15, p, 'rgba(192, 132, 252, 0.14)', '#F3E8FF', '#9333EA');
    } else if (fx.kind === 'soulsTortureMonolith') {
      const alpha = Math.pow(1 - p, 0.50);
      const r = fx.radius || 68;
      const dropY = (1 - Math.min(1, p * 2.6)) * (-55);
      _drawGlowQuad(ctx, fx.x, fx.y, r * 1.45, 'souls_monolith', 'rgba(147, 51, 234, 0.80)', 'rgba(15, 10, 28, 0.45)', alpha);
      _drawSpriteStripFrame(ctx, 'soulsTorture', 6, Math.min(0.99, p * 1.15), fx.x, fx.y + dropY - r * 0.45, r * 1.55, r * 2.35, alpha * 0.96);
      if (p > 0.25) {
        const dp = (p - 0.25) / 0.75;
        _drawSpriteStripFrame(ctx, 'darkBlast', 8, dp, fx.x, fx.y, r * 2.1, r * 2.1, alpha * 0.9);
        _drawSequentialShockwaves(ctx, fx.x, fx.y, r * 1.35, dp, 'rgba(109, 40, 217, 0.20)', '#C084FC', '#4C1D95');
      }
    } else if (fx.kind === 'shellBurst') {
      const alpha = Math.pow(1 - p, 0.65);
      const r = fx.radius || 34;
      _drawGlowQuad(ctx, fx.x, fx.y, r * 1.3, 'shell_burst', 'rgba(192, 132, 252, 0.88)', 'rgba(109, 40, 217, 0.35)', alpha);
      _drawSpriteStripFrame(ctx, 'hogyokuPop', 5, p, fx.x, fx.y, r * 2.1, r * 2.1, alpha);
    }
  }
}

/**
 * Draw Sequential Water-Ripple Concentric Shockwaves (Rule 26: Zero radial spoke meshes)
 */
function _drawSequentialShockwaves(ctx, x, y, maxR, p, washRgba, innerStroke, outerStroke) {
  const offsets = [0.0, 0.14, 0.28];
  for (let i = 0; i < offsets.length; i++) {
    const start = offsets[i];
    if (p <= start) continue;
    const lp = Math.min(1, (p - start) / (1 - start));
    const popIn = Math.min(1, lp / 0.10);
    const fadeOut = Math.pow(1 - lp, 1.25);
    const waveAlpha = popIn * fadeOut;
    if (waveAlpha <= 0.02) continue;

    const r = maxR * Math.pow(lp, 0.62);
    ctx.save();
    ctx.globalAlpha = waveAlpha;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (i === 0) {
      ctx.fillStyle = washRgba;
      ctx.fill();
    }
    ctx.lineWidth = Math.max(1.2, (4.5 - i * 1.1) * (1 - lp * 0.45));
    ctx.strokeStyle = i === 0 ? innerStroke : outerStroke;
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Draw Aizen Energy Projectiles (Raikōhō, Hōgyoku Orbs, Fragor, Clone Dash, Shadow Waves, Shells)
 */
export function drawAizenProjectilesVFX(ctx, projectiles) {
  if (!projectiles || projectiles.length === 0) return;
  for (let i = 0; i < projectiles.length; i++) {
    const proj = projectiles[i];
    const r = proj.radius || 14;
    const kind = proj.kind;
    const rot = Math.atan2(proj.vy || 0, proj.vx || 1);

    if (kind === 'clone_rush') {
      _drawGlowQuad(ctx, proj.x, proj.y, r * 2.1, 'clone_proj', 'rgba(192, 132, 252, 0.88)', 'rgba(250, 204, 21, 0.32)', 0.82);
      _drawSpriteStripFrame(ctx, 'rushAura', 7, ((proj.age || 0) % 14) / 14, proj.x - Math.cos(rot) * 14, proj.y - Math.sin(rot) * 14, r * 3.0, r * 2.2, 0.88, rot);
      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, r * 0.75, 0, Math.PI * 2);
      ctx.fillStyle = '#2E1065';
      ctx.fill();
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = '#C084FC';
      ctx.stroke();
      ctx.restore();
    } else if (kind === 'shadow_wave') {
      _drawGlowQuad(ctx, proj.x, proj.y, r * 2.2, 'shadow_wave_proj', 'rgba(225, 29, 72, 0.86)', 'rgba(139, 92, 246, 0.42)', 0.90);
      _drawSpriteStripFrame(ctx, 'shadowWave', 5, ((proj.age || 0) % 15) / 15, proj.x, proj.y, r * 3.1, r * 3.1, 0.95, rot);
    } else if (kind === 'shell_bolt') {
      _drawGlowQuad(ctx, proj.x, proj.y, r * 1.9, 'shell_bolt_proj', 'rgba(216, 180, 254, 0.90)', 'rgba(109, 40, 217, 0.38)', 0.88);
      _drawSpriteStripFrame(ctx, 'shellBolt', 3, ((proj.age || 0) % 9) / 9, proj.x, proj.y, r * 3.2, r * 2.4, 0.96, rot);
    } else if (kind === 'fragor') {
      _drawGlowQuad(ctx, proj.x, proj.y, r * 2.4, 'fragor_proj', 'rgba(251, 113, 133, 0.95)', 'rgba(139, 92, 246, 0.45)', 0.92);
      ctx.save();
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, r * 0.68, 0, Math.PI * 2);
      ctx.fillStyle = '#FFF1F2';
      ctx.fill();
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = '#E11D48';
      ctx.stroke();
      ctx.restore();
      _drawSpriteStripFrame(ctx, 'fragorBurst', 8, ((proj.age || 0) % 24) / 24, proj.x, proj.y, r * 3.1, r * 3.1, 0.92, (proj.age || 0) * 0.14);
    } else if (kind === 'raikoho') {
      _drawGlowQuad(ctx, proj.x, proj.y, r * 2.2, 'raikoho_proj', 'rgba(250, 204, 21, 0.92)', 'rgba(139, 92, 246, 0.42)', 0.9);
      ctx.save();
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, r * 0.68, 0, Math.PI * 2);
      ctx.fillStyle = '#FEF9C3';
      ctx.fill();
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = '#EAB308';
      ctx.stroke();
      ctx.restore();
      _drawSpriteStripFrame(ctx, 'raikohoLightning', 7, ((proj.age || 0) % 21) / 21, proj.x, proj.y, r * 3.2, r * 3.2, 0.88, (proj.age || 0) * 0.25);
    } else {
      _drawGlowQuad(ctx, proj.x, proj.y, r * 2.0, 'hogyoku_proj', 'rgba(192, 132, 252, 0.90)', 'rgba(109, 40, 217, 0.35)', 0.85);
      ctx.save();
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, r * 0.68, 0, Math.PI * 2);
      ctx.fillStyle = '#F3E8FF';
      ctx.fill();
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = '#7C3AED';
      ctx.stroke();
      ctx.restore();
      _drawSpriteStripFrame(ctx, 'hogyokuOrb', 8, ((proj.age || 0) % 24) / 24, proj.x, proj.y, r * 3.1, r * 3.1, 0.90, (proj.age || 0) * 0.18);
    }
  }
}

/**
 * Draw Hadō #63: Raikōhō Sustained Golden Lightning Cannon Beam (MUGEN Statedef 1200/1260 G8004 + G1056)
 */
export function drawAizenRaikohoBeamVFX(ctx, fighter) {
  const b = fighter?.raikohoBeamState;
  if (!b || !b.active || fighter._isSilhouettePass) return;

  const angle = b.angle ?? fighter.skillCastAngle ?? fighter.gunAngle ?? 0;
  const r = fighter.r || 30;
  const ox = (fighter.x || 0) + Math.cos(angle) * (r + 10);
  const oy = (fighter.y || 0) - (fighter.z || 0) + Math.sin(angle) * (r + 10);
  const len = Math.max(60, b.length || 280);
  const lifeP = Math.max(0, Math.min(1, b.timer / Math.max(1, b.maxTimer || 26)));
  const fade = Math.min(1, lifeP * 3.5);
  const tick = fighter._vfxTick || 0;

  // 1. Crackling Golden Palm Orb (G1056) at beam origin
  _drawGlowQuad(ctx, ox, oy, r * 1.9, 'raikoho_palm', 'rgba(254, 240, 138, 0.96)', 'rgba(234, 179, 8, 0.42)', fade * 0.95);
  _drawSpriteStripFrame(ctx, 'raikohoLightning', 7, (tick % 21) / 21, ox, oy, r * 3.1, r * 3.1, fade * 0.92, tick * 0.28);

  // 2. MUGEN G8004 Directional Branching Lightning Torrent Beam
  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(angle);
  ctx.globalAlpha = fade;

  const beamImg = _getAizenVfxImage('raikohoBeam');
  const beamW = b.width || 54;
  if (beamImg) {
    const w = beamImg.naturalWidth || beamImg.width || 0;
    const h = beamImg.naturalHeight || beamImg.height || 0;
    const cellW = Math.floor(w / 8);
    if (cellW > 0 && h > 0) {
      const fIdx = Math.floor((tick * 0.55) % 8);
      const drawH = Math.max(96, beamW * 2.25);
      ctx.drawImage(beamImg, fIdx * cellW, 0, cellW, h, -14, -drawH * 0.5, len + 20, drawH);
    }
  } else {
    // Clean procedural lightning bolt fallback when headless/undecoded
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
    ctx.lineWidth = beamW * 0.45;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, 0);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = beamW * 0.16;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, 0);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draw Hadō #90: Kurohitsugi (Black Coffin) Monolith, Spears & Collapse VFX
 */
export function drawAizenKurohitsugiVFX(ctx, fighter) {
  const k = fighter?.kurohitsugiState;
  if (!k || !k.active || fighter._isSilhouettePass) return;

  const x = k.x;
  const y = k.y;
  const boxR = k.radius || 72;
  const phase = k.phase; // 'rising' | 'crushing' | 'shatter'
  const p = Math.max(0, Math.min(1, k.progress || 0));

  ctx.save();
  if (k.isBigBang) {
    // Final Form Ultimate: Big Bang Explosion / Ultra Fragor (MUGEN Statedef 3200–3265)
    if (phase === 'rising' || phase === 'crushing') {
      const chargeP = phase === 'rising' ? p * 0.45 : 0.45 + p * 0.55;
      const orbR = boxR * (phase === 'rising' ? 0.5 + p * 0.45 : 0.95 - p * 0.25);
      _drawGlowQuad(ctx, x, y, orbR * 2.2, 'bigbang_charge', 'rgba(251, 113, 133, 0.90)', 'rgba(139, 92, 246, 0.45)', 0.65 + chargeP * 0.35);
      _drawSpriteStripFrame(ctx, 'kurohitsugiVortex', 8, chargeP, x, y, orbR * 2.5, orbR * 2.5, 0.80, chargeP * 2.4);
      _drawSpriteStripFrame(ctx, 'fragorBurst', 8, chargeP, x, y, orbR * 2.1, orbR * 2.1, 0.92, -chargeP * 1.8);
    } else if (phase === 'shatter') {
      const alpha = Math.pow(1 - p, 0.65);
      _drawGlowQuad(ctx, x, y, boxR * (1.5 + p * 1.2), 'bigbang_blast', 'rgba(251, 146, 60, 0.92)', 'rgba(225, 29, 72, 0.45)', alpha);
      _drawSpriteStripFrame(ctx, 'bigBangPillar', 8, p, x, y - boxR * 0.5, boxR * 2.6, boxR * 3.0, alpha);
      _drawSpriteStripFrame(ctx, 'fragorBurst', 8, p, x, y, boxR * 2.5, boxR * 2.5, alpha * 0.95);
      _drawSequentialShockwaves(ctx, x, y, boxR * 1.9, p, 'rgba(225, 29, 72, 0.20)', '#FDE047', '#E11D48');
    }
    ctx.restore();
    return;
  }

  if (phase === 'rising') {
    const riseH = boxR * 1.9 * Math.min(1, p * 1.25);
    const halfW = boxR * 0.78;
    const topY = y + boxR * 0.65 - riseH;
    const botY = y + boxR * 0.65;

    // MUGEN Statedef 3030 swirling dark gravity vortex beneath rising Black Coffin
    _drawSpriteStripFrame(ctx, 'kurohitsugiVortex', 8, p, x, y, boxR * 2.3, boxR * 2.3, 0.75 * Math.sin(p * Math.PI));

    // Ground purple Kido summoning ring
    ctx.beginPath();
    ctx.ellipse(x, botY, halfW * 1.18, halfW * 0.34, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(139, 92, 246, 0.25)';
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#C084FC';
    ctx.stroke();

    // Pitch-black monolithic coffin rising
    ctx.fillStyle = 'rgba(10, 8, 18, 0.90)';
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.rect(x - halfW, topY, halfW * 2, riseH);
    ctx.fill();
    ctx.stroke();

    // Kido lattice grid lines inside coffin
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, botY);
    ctx.moveTo(x - halfW, (topY + botY) * 0.5);
    ctx.lineTo(x + halfW, (topY + botY) * 0.5);
    ctx.stroke();

    // Extracted dark obsidian coffin aura strip overlay
    _drawSpriteStripFrame(ctx, 'kurohitsugiCoffin', 8, Math.min(0.45, p * 0.45), x, y, boxR * 2.3, boxR * 2.4, 0.92);
  } else if (phase === 'crushing') {
    const halfW = boxR * (0.78 - p * 0.14);
    const halfH = boxR * (0.95 - p * 0.14);
    const shakeX = Math.sin(p * 48) * 2.5;
    const shakeY = Math.cos(p * 42) * 2.0;

    _drawGlowQuad(ctx, x, y, boxR * 1.9, 'kuro_aura', 'rgba(139, 92, 246, 0.55)', 'rgba(15, 10, 30, 0.35)', 0.9);

    ctx.fillStyle = 'rgba(8, 6, 16, 0.95)';
    ctx.strokeStyle = k.isPerfect ? '#E879F9' : '#8B5CF6';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.rect(x - halfW + shakeX, y - halfH + shakeY, halfW * 2, halfH * 2);
    ctx.fill();
    ctx.stroke();

    // Piercing gravity lances converging inward from the coffin walls
    const spearCount = k.isPerfect ? 12 : 8;
    for (let i = 0; i < spearCount; i++) {
      const sa = (i / spearCount) * Math.PI * 2 + 0.2;
      const startDist = boxR * 1.35;
      const tipDist = Math.max(8, startDist * (1 - Math.min(1, p * 1.35)));
      const sx = x + Math.cos(sa) * startDist;
      const sy = y + Math.sin(sa) * startDist;
      const tx = x + Math.cos(sa) * tipDist;
      const ty = y + Math.sin(sa) * tipDist;
      const px = -Math.sin(sa) * 4.5;
      const py = Math.cos(sa) * 4.5;

      ctx.beginPath();
      ctx.moveTo(sx + px, sy + py);
      ctx.lineTo(tx, ty);
      ctx.lineTo(sx - px, sy - py);
      ctx.closePath();
      ctx.fillStyle = '#1E1B4B';
      ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = '#C084FC';
      ctx.stroke();
    }

    _drawSpriteStripFrame(ctx, 'kurohitsugiCoffin', 8, 0.45 + p * 0.27, x, y, boxR * 2.2, boxR * 2.2, 0.82);
    // MUGEN Supers.cns:386 — High-visibility Action 7015 (kuroFlash) slash flashes ripping across the Black Coffin
    const cycleP = (p * 3.5) % 1;
    _drawSpriteStripFrame(ctx, 'kuroFlash', 4, cycleP, x, y, boxR * 2.35, boxR * 2.35, 0.96, 0.38);
    _drawSpriteStripFrame(ctx, 'kuroFlash', 4, ((p * 3.5) + 0.5) % 1, x, y, boxR * 2.2, boxR * 2.2, 0.92, -0.52);
  } else if (phase === 'shatter') {
    const alpha = Math.pow(1 - p, 0.75);
    _drawGlowQuad(ctx, x, y, boxR * (1.2 + p * 1.1), 'kuro_shatter', 'rgba(192, 132, 252, 0.85)', 'rgba(88, 28, 135, 0.35)', alpha);
    _drawSpriteStripFrame(ctx, 'kurohitsugiCoffin', 8, 0.72 + p * 0.28, x, y, boxR * 2.4, boxR * 2.4, alpha * 0.9);
    _drawSequentialShockwaves(ctx, x, y, boxR * 1.65, p, 'rgba(139, 92, 246, 0.22)', '#E9D5FF', '#6D28D9');
    _drawSpriteStripFrame(ctx, 'kyokaShatter', 8, p, x, y, boxR * 2.5, boxR * 2.5, alpha * 0.9);
    if (p < 0.85) {
      _drawSpriteStripFrame(ctx, 'kuroFlash', 4, p / 0.85, x, y, boxR * 2.65, boxR * 2.65, alpha * 0.98);
    }
  }
  ctx.restore();
}

const RIKUJOKORO_HEX_OFFSETS = [
  { x: 0, y: 50, lx: 0, ly: 14 },
  { x: 40, y: 30, lx: 13, ly: 9 },
  { x: 40, y: -20, lx: 13, ly: -9 },
  { x: 0, y: -40, lx: 0, ly: -14 },
  { x: -40, y: -20, lx: -13, ly: -9 },
  { x: -40, y: 30, lx: -13, ly: 9 },
];

/**
 * Draw Bakudō #61: Rikujōkōrō Six-Beam Light Prison (MUGEN Especials.cns State 1300-1302)
 */
export function drawAizenRikujokoroVFX(ctx, fighter) {
  if (!fighter || fighter._isSilhouettePass) return;

  // Brief golden targeting ray during windup frame release
  if (fighter.rikujokoroWindupTimer > 0 && fighter.rikujokoroWindupTimer <= 4) {
    const r = fighter.r || 30;
    const ang = fighter.skillCastAngle ?? fighter.gunAngle ?? 0;
    ctx.save();
    ctx.translate(fighter.x || 0, (fighter.y || 0) - (fighter.z || 0));
    ctx.rotate(ang);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.72)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(r + 6, 0);
    ctx.lineTo(r + 170, 0);
    ctx.stroke();
    ctx.restore();
  }

  const state = fighter.rikujokoroState;
  if (!state || !state.active) return;

  const tx = state.target && !state.target.isDead ? state.target.x : state.x;
  const ty = state.target && !state.target.isDead ? (state.target.y - (state.target.z || 0)) : state.y;
  const timer = state.timer || 0;
  const maxTimer = Math.max(1, state.maxTimer || 120);
  const convergeP = Math.min(1, timer / 5); // MUGEN ModifyExplod trigger1 = time >= 5 lock-in
  const fadeOut = timer > maxTimer - 12 ? Math.max(0, (maxTimer - timer) / 12) : 1;
  const pulse = 0.86 + Math.sin(timer * 0.25) * 0.14;
  const targetR = state.radius || 30;
  const spreadScale = Math.max(0.85, targetR / 28);

  _drawGlowQuad(ctx, tx, ty, targetR * 1.9, 'riku_lock', 'rgba(254, 240, 138, 0.78)', 'rgba(234, 179, 8, 0.28)', 0.65 * fadeOut * pulse);

  const img = _getAizenVfxImage('rikujokoroBeams');
  const cellW = img ? Math.floor((img.naturalWidth || img.width || 0) / 6) : 0;
  const cellH = img ? (img.naturalHeight || img.height || 0) : 0;

  ctx.save();
  ctx.globalAlpha = fadeOut * pulse;
  const beamSize = targetR * 1.85;
  for (let i = 0; i < 6; i++) {
    const o = RIKUJOKORO_HEX_OFFSETS[i];
    const bx = tx + (o.x * (1 - convergeP) + o.lx * convergeP) * spreadScale;
    const by = ty + (o.y * (1 - convergeP) + o.ly * convergeP) * spreadScale;
    if (img && cellW > 0 && cellH > 0) {
      ctx.drawImage(img, i * cellW, 0, cellW, cellH, bx - beamSize * 0.5, by - beamSize * 0.5, beamSize, beamSize);
    } else {
      const ang = (i / 6) * Math.PI * 2 + Math.PI * 0.5;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(ang);
      ctx.fillStyle = '#FEF08A';
      ctx.strokeStyle = '#EAB308';
      ctx.lineWidth = 1.6;
      ctx.fillRect(-5, -14, 10, 28);
      ctx.strokeRect(-5, -14, 10, 28);
      ctx.restore();
    }
  }
  ctx.restore();
}

/**
 * Draw Active Time Slowing Field (Hogyoku State 25500) & Rushing Crusher Aura (Final Form State 27000)
 */
export function drawAizenDomainAndRushVFX(ctx, fighter) {
  if (!fighter || fighter._isSilhouettePass) return;
  const x = fighter.x || 0;
  const y = (fighter.y || 0) - (fighter.z || 0);
  const r = fighter.r || 30;
  const tick = fighter._vfxTick || 0;

  if ((fighter.timeSlowFieldTimer || 0) > 0) {
    const fieldR = fighter.timeSlowFieldRadius || 135;
    const fade = Math.min(1, fighter.timeSlowFieldTimer / 18);
    const pulse = 0.94 + Math.sin(tick * 0.18) * 0.06;
    ctx.save();
    ctx.globalAlpha = fade * 0.65;
    ctx.beginPath();
    ctx.arc(x, y, fieldR * pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(109, 40, 217, 0.14)';
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#C084FC';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, fieldR * 0.68, 0, Math.PI * 2);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(233, 213, 255, 0.65)';
    ctx.stroke();
    ctx.restore();
  }

  if (fighter.rushingCrusherState && fighter.rushingCrusherState.active) {
    const ang = fighter.rushingCrusherState.angle || fighter.gunAngle || 0;
    _drawGlowQuad(ctx, x, y, r * 2.1, 'rush_dash', 'rgba(254, 240, 138, 0.9)', 'rgba(251, 113, 133, 0.35)', 0.92);
    _drawSpriteStripFrame(ctx, 'rushAura', 7, (tick % 14) / 14, x - Math.cos(ang) * 16, y - Math.sin(ang) * 16, r * 3.1, r * 2.2, 0.95, ang);
  }
}
