// ─────────────────────────────────────────────
// Avatar of Emptiness Character Skin (Terraria: Wrath of the Gods)
// Pre-Baked Rule 35 Void Core + Authentic Modular Head, Mask, Legs, Spider Lily & Articulated Arms
// Strictly enforces Rule 11 (zero shadowBlur), Rule 24 (1:1 offscreen quad + #0E0F14 outline),
// and Rule 35 (pre-baked radial glows, zero per-frame createRadialGradient)
// ─────────────────────────────────────────────

import { state } from '../../core/state.js';
import { drawCachedRadialGlow } from '../glowSpriteCache.js';

const _ASSET_PATHS = {
  head: 'Assets/model/avatar/Head.png',
  mask: 'Assets/model/avatar/AvatarOfEmptiness.png',
  maskHollowEyes: 'Assets/model/avatar/MaskHollowEyes.png',
  neck1: 'Assets/model/avatar/Neck1.png',
  neck2: 'Assets/model/avatar/Neck2.png',
  beads1: 'Assets/model/avatar/Beads1.png',
  beads2: 'Assets/model/avatar/Beads2.png',
  bell: 'Assets/model/avatar/Bell.png',
  lantern1: 'Assets/model/avatar/Lantern1.png',
  lantern2: 'Assets/model/avatar/Lantern2.png',
  leg1: 'Assets/model/avatar/Leg1.png',
  leg2: 'Assets/model/avatar/Leg2.png',
  leg3: 'Assets/model/avatar/Leg3.png',
  leg4: 'Assets/model/avatar/Leg4.png',
  spiderLily: 'Assets/model/avatar/SpiderLily.png',
  armLeft: 'Assets/model/avatar/FrontArmLeft.png',
  armRight: 'Assets/model/avatar/FrontArmRight.png',
  forearmLeft: 'Assets/model/avatar/FrontForearmLeft.png',
  forearmRight: 'Assets/model/avatar/FrontForearmRight.png',
  handLeft: 'Assets/model/avatar/FrontHandLeft.png',
  riftInner: 'Assets/effects/Avatar/RiftInnerTexture.png'
};

const _imageCache = new Map();
const _coreCanvasCache = new Map();

function _getAssetImage(key) {
  const existing = _imageCache.get(key);
  if (existing) return existing;
  const src = _ASSET_PATHS[key];
  if (!src || typeof Image === 'undefined') return null;
  const img = new Image();
  img.src = src;
  _imageCache.set(key, img);
  return img;
}

function _isImageReady(img) {
  if (!img) return false;
  if (img.complete !== undefined) return Boolean(img.complete && img.naturalWidth > 0);
  return Boolean((img.width || img.naturalWidth) > 0);
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  for (const key of Object.keys(_ASSET_PATHS)) {
    _getAssetImage(key);
  }
}

export const AVATAR_OF_EMPTINESS_DEFAULT_CONFIGS = {
  overall: { widthScale: 1.0, heightScale: 1.0, offsetX: 0, offsetY: 0, angleOffset: 0, flipX: false, flipY: false },
  body: { widthScale: 1.0, heightScale: 1.0, offsetX: 0, offsetY: 0, angleOffset: 0, flipX: false, flipY: false },
  head: { widthScale: 1.0, heightScale: 1.0, offsetX: 0, offsetY: 0, angleOffset: 0, flipX: false, flipY: false },
  lily: { widthScale: 1.0, heightScale: 1.0, offsetX: 0, offsetY: 0, angleOffset: 0, flipX: false, flipY: false },
  legs: { widthScale: 1.0, heightScale: 1.0, offsetX: 0, offsetY: 0, angleOffset: 0, flipX: false, flipY: false },
  arm_left: { widthScale: 1.0, heightScale: 1.0, offsetX: 0, offsetY: 0, angleOffset: 0, flipX: false, flipY: false },
  arm_right: { widthScale: 1.0, heightScale: 1.0, offsetX: 0, offsetY: 0, angleOffset: 0, flipX: false, flipY: false },
  forearm_left: { widthScale: 1.0, heightScale: 1.0, offsetX: 0, offsetY: 0, angleOffset: 0, flipX: false, flipY: false },
  forearm_right: { widthScale: 1.0, heightScale: 1.0, offsetX: 0, offsetY: 0, angleOffset: 0, flipX: false, flipY: false }
};

function _getUniversePalette(universe) {
  if (universe === 'cryonic') {
    return {
      rim: '#00F5D4',
      mid: '#0C3B4E',
      glowStop0: 'rgba(0, 245, 212, 0.34)',
      glowStop1: 'rgba(157, 78, 221, 0.16)',
      slit: '#00F5D4'
    };
  }
  if (universe === 'visceral') {
    return {
      rim: '#FF0055',
      mid: '#420A24',
      glowStop0: 'rgba(255, 0, 85, 0.36)',
      glowStop1: 'rgba(157, 78, 221, 0.16)',
      slit: '#FF0055'
    };
  }
  return {
    rim: '#9D4EDD',
    mid: '#23133D',
    glowStop0: 'rgba(157, 78, 221, 0.36)',
    glowStop1: 'rgba(0, 245, 212, 0.15)',
    slit: '#00F5D4'
  };
}

/**
 * Pre-bakes the discrete 1:1 Pixel-Grid Obsidian Core Body once per radius/universe (Rule 24 & Rule 35).
 */
function _getCachedAvatarCoreCanvas(intR, universe) {
  const safeR = Math.max(12, Math.round(intR));
  const key = `${safeR}:${universe || 'dark'}`;
  const cached = _coreCanvasCache.get(key);
  if (cached) return cached;
  if (typeof document === 'undefined') return null;

  const P = 2.0;
  const steps = Math.ceil((safeR + P) / P);
  const size = (steps * 2 + 1) * P;
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const octx = off.getContext('2d');
  if (!octx) return null;

  octx.translate(size / 2, size / 2);
  octx.imageSmoothingEnabled = false;
  const pal = _getUniversePalette(universe);

  for (let py = -steps * P; py <= steps * P; py += P) {
    for (let px = -steps * P; px <= steps * P; px += P) {
      const gx = Math.round(px / P);
      const gy = Math.round(py / P);
      const dist = Math.hypot(px, py);
      if (dist > safeR) continue;

      const isEdge =
        Math.hypot((gx + 1) * P, gy * P) > safeR ||
        Math.hypot((gx - 1) * P, gy * P) > safeR ||
        Math.hypot(gx * P, (gy + 1) * P) > safeR ||
        Math.hypot(gx * P, (gy - 1) * P) > safeR;

      if (isEdge) {
        octx.fillStyle = '#0E0F14';
      } else if (dist > safeR * 0.84) {
        octx.fillStyle = pal.rim;
      } else if (dist > safeR * 0.56) {
        octx.fillStyle = pal.mid;
      } else {
        octx.fillStyle = '#181426';
      }
      octx.fillRect(px - P * 0.5, py - P * 0.5, P, P);
    }
  }

  _coreCanvasCache.set(key, { canvas: off, size });
  return { canvas: off, size };
}

function _drawAtPivot(ctx, image, x, y, scaleX, scaleY, pivotX = 0.5, pivotY = 0.5, sx = 0, sy = 0, sw = null, sh = null) {
  const fullW = image.naturalWidth || image.width || 300;
  const fullH = image.naturalHeight || image.height || 300;
  const srcW = sw || fullW;
  const srcH = sh || fullH;
  const width = srcW * scaleX;
  const height = srcH * scaleY;
  ctx.drawImage(image, sx, sy, srcW, srcH, x - width * pivotX, y - height * pivotY, width, height);
}

function _getCustomMap() {
  const sc = (typeof state !== 'undefined' && state.skinCustomizations) ? state.skinCustomizations : {};
  return {
    overall: sc.avatar_of_emptiness || sc.avatarofemptiness || {},
    body: sc.avatar_of_emptiness_body || sc.avatarofemptiness_body || {},
    head: sc.avatar_of_emptiness_head || sc.avatarofemptiness_head || {},
    lily: sc.avatar_of_emptiness_lily || sc.avatarofemptiness_lily || {},
    legs: sc.avatar_of_emptiness_legs || sc.avatarofemptiness_legs || {},
    armLeft: sc.avatar_of_emptiness_arm_left || sc.avatarofemptiness_arm_left || {},
    armRight: sc.avatar_of_emptiness_arm_right || sc.avatarofemptiness_arm_right || {},
    forearmLeft: sc.avatar_of_emptiness_forearm_left || sc.avatarofemptiness_forearm_left || {},
    forearmRight: sc.avatar_of_emptiness_forearm_right || sc.avatarofemptiness_forearm_right || {}
  };
}

function _drawBackLegsAndRift(ctx, r, rScale, gameTimer, universe, isPhase2, hoverBob, widthScale, heightScale, customLegs) {
  const riftTex = _getAssetImage('riftInner');
  const pal = _getUniversePalette(universe);

  // Pre-baked ambient void aura (Rule 35 - zero createRadialGradient)
  drawCachedRadialGlow(ctx, 0, hoverBob, r * (isPhase2 ? 1.85 : 1.58), [
    [0, pal.glowStop0],
    [0.55, pal.glowStop1],
    [1, 'rgba(6, 7, 11, 0)']
  ]);

  if (_isImageReady(riftTex)) {
    const riftSize = r * (isPhase2 ? 2.8 : 2.35);
    ctx.save();
    ctx.translate(0, hoverBob);
    ctx.rotate(gameTimer * 0.015);
    ctx.globalAlpha = isPhase2 ? 0.65 : 0.48;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(riftTex, -riftSize * 0.5, -riftSize * 0.5, riftSize, riftSize);
    ctx.restore();
  }

  // Back shadowy tendril legs (Leg1..Leg4)
  const legsDef = AVATAR_OF_EMPTINESS_DEFAULT_CONFIGS.legs;
  const legW = widthScale * (customLegs.widthScale ?? legsDef.widthScale);
  const legH = heightScale * (customLegs.heightScale ?? legsDef.heightScale);
  const legSpecs = [
    { key: 'leg1', x: -r * 0.28, y: r * 0.35, rot: 0.14, sway: 0.06, phase: 0.0, px: 0.9, py: 0.08 },
    { key: 'leg2', x: -r * 0.52, y: r * 0.05, rot: 0.58, sway: 0.07, phase: 1.4, px: 0.9, py: 0.08 },
    { key: 'leg3', x: r * 0.28, y: r * 0.35, rot: -0.14, sway: -0.06, phase: 0.7, px: 0.1, py: 0.08 },
    { key: 'leg4', x: r * 0.52, y: r * 0.05, rot: -0.58, sway: -0.07, phase: 2.1, px: 0.1, py: 0.08 }
  ];

  for (const spec of legSpecs) {
    const img = _getAssetImage(spec.key);
    if (!_isImageReady(img)) continue;
    const baseScale = (r * 1.15) / (img.naturalHeight || 550);
    ctx.save();
    ctx.translate(spec.x * widthScale, hoverBob + spec.y * heightScale);
    ctx.rotate(spec.rot + Math.sin(gameTimer * 0.045 + spec.phase) * spec.sway);
    ctx.globalAlpha = 0.88;
    ctx.imageSmoothingEnabled = true;
    _drawAtPivot(ctx, img, 0, 0, baseScale * legW, baseScale * legH, spec.px, spec.py);
    ctx.restore();
  }
}

function _drawCoreAndLily(ctx, fighter, r, rScale, gameTimer, universe, hoverBob, widthScale, heightScale, customBody, customLily) {
  const bodyDef = AVATAR_OF_EMPTINESS_DEFAULT_CONFIGS.body;
  const bodyScaleW = widthScale * (customBody.widthScale ?? bodyDef.widthScale);
  const bodyScaleH = heightScale * (customBody.heightScale ?? bodyDef.heightScale);
  const bodyOffX = (customBody.offsetX ?? bodyDef.offsetX) * rScale;
  const bodyOffY = (customBody.offsetY ?? bodyDef.offsetY) * rScale;
  const bodyAngle = (customBody.angleOffset ?? bodyDef.angleOffset);
  const bodyFlipX = (customBody.flipX ?? bodyDef.flipX) ? -1 : 1;
  const bodyFlipY = (customBody.flipY ?? bodyDef.flipY) ? -1 : 1;

  ctx.save();
  ctx.translate(bodyOffX, hoverBob + bodyOffY);
  if (bodyAngle !== 0) ctx.rotate(bodyAngle);
  ctx.scale(bodyScaleW * bodyFlipX, bodyScaleH * bodyFlipY);

  // Blit pre-baked 1:1 discrete quad (Rule 35 & Rule 24)
  const coreQuad = _getCachedAvatarCoreCanvas(r, universe);
  if (coreQuad) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(coreQuad.canvas, -coreQuad.size * 0.5, -coreQuad.size * 0.5);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#0E071A';
    ctx.fill();
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 2.0;
    ctx.stroke();
  }

  // Faceless cryonic rift slit fallback / underglow
  const pal = _getUniversePalette(universe);
  const slitH = r * 0.42;
  ctx.fillStyle = pal.slit;
  ctx.fillRect(-1.5, -slitH * 0.5, 3.0, slitH);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-0.75, -slitH * 0.34, 1.5, slitH * 0.68);

  // Animated 3-frame SpiderLily centerpiece on torso
  const lilyImg = _getAssetImage('spiderLily');
  if (_isImageReady(lilyImg)) {
    const lilyDef = AVATAR_OF_EMPTINESS_DEFAULT_CONFIGS.lily;
    const frameH = Math.floor((lilyImg.naturalHeight || 776) / 3);
    const frameIdx = Math.floor(gameTimer * 0.17) % 3;
    const lilyScale = (r * 0.72) / (lilyImg.naturalWidth || 359);
    const lw = lilyScale * (customLily.widthScale ?? lilyDef.widthScale);
    const lh = lilyScale * (customLily.heightScale ?? lilyDef.heightScale);
    const annGlow = (fighter.annihilationWindupTimer > 0 || fighter.annihilationFireTimer > 0);
    if (annGlow) {
      drawCachedRadialGlow(ctx, 0, r * 0.14, r * 0.9, [
        [0, 'rgba(255, 255, 255, 0.7)'],
        [0.45, 'rgba(255, 0, 85, 0.35)'],
        [1, 'rgba(6, 7, 11, 0)']
      ]);
    }
    ctx.imageSmoothingEnabled = true;
    _drawAtPivot(ctx, lilyImg, 0, r * 0.12, lw, lh, 0.5, 0.5, 0, frameIdx * frameH, lilyImg.naturalWidth, frameH);
  }

  ctx.restore();
}

function _drawHeadAndMask(ctx, fighter, r, rScale, gameTimer, hoverBob, widthScale, heightScale, customHead) {
  const headImg = _getAssetImage('head');
  const maskImg = _getAssetImage('mask');
  const neckImg = _getAssetImage('neck1');
  const bellImg = _getAssetImage('bell');
  const lantern1 = _getAssetImage('lantern1');
  const lantern2 = _getAssetImage('lantern2');
  const headDef = AVATAR_OF_EMPTINESS_DEFAULT_CONFIGS.head;

  const hw = widthScale * (customHead.widthScale ?? headDef.widthScale);
  const hh = heightScale * (customHead.heightScale ?? headDef.heightScale);
  const hOffX = (customHead.offsetX ?? headDef.offsetX) * rScale;
  const hOffY = (customHead.offsetY ?? headDef.offsetY) * rScale;

  if (!_isImageReady(headImg) && !_isImageReady(maskImg)) return;

  ctx.save();
  ctx.translate(hOffX, hoverBob - r * 0.42 + hOffY);
  ctx.rotate(Math.sin(gameTimer * 0.035) * 0.04 + (customHead.angleOffset ?? 0));
  ctx.imageSmoothingEnabled = true;

  if (_isImageReady(neckImg)) {
    const nScale = (r * 0.78) / (neckImg.naturalWidth || 821);
    _drawAtPivot(ctx, neckImg, 0, r * 0.25, nScale * hw, nScale * hh, 0.5, 0.5);
  }
  if (_isImageReady(bellImg)) {
    const bScale = (r * 0.34) / (bellImg.naturalHeight || 133);
    _drawAtPivot(ctx, bellImg, 0, r * 0.36, bScale * hw, bScale * hh, 0.5, 0.15);
  }
  if (_isImageReady(lantern1)) {
    const lScale = (r * 0.42) / (lantern1.naturalHeight || 64);
    const sway = Math.sin(gameTimer * 0.07) * 0.12;
    ctx.save();
    ctx.translate(-r * 0.34 * hw, r * 0.14 * hh);
    ctx.rotate(sway);
    _drawAtPivot(ctx, lantern1, 0, 0, lScale * hw, lScale * hh, 0.5, 0.06);
    ctx.restore();
  }
  if (_isImageReady(lantern2)) {
    const lScale = (r * 0.42) / (lantern2.naturalHeight || 66);
    const sway = Math.cos(gameTimer * 0.07) * 0.12;
    ctx.save();
    ctx.translate(r * 0.34 * hw, r * 0.16 * hh);
    ctx.rotate(sway);
    _drawAtPivot(ctx, lantern2, 0, 0, lScale * hw, lScale * hh, 0.5, 0.06);
    ctx.restore();
  }

  if (_isImageReady(headImg)) {
    const scale = (r * 1.12) / (headImg.naturalWidth || 675);
    _drawAtPivot(ctx, headImg, 0, -r * 0.22, scale * hw, scale * hh, 0.5, 0.35);
  }

  if (_isImageReady(maskImg)) {
    const frameCount = 24;
    const frameW = maskImg.naturalWidth || 186;
    const frameH = Math.floor((maskImg.naturalHeight || 5064) / frameCount);
    let frameIdx = Math.floor(gameTimer * 0.12) % 8;
    if (fighter.isPhase2) frameIdx = 8 + (Math.floor(gameTimer * 0.18) % 8);
    if (fighter.annihilationWindupTimer > 0 || fighter.annihilationFireTimer > 0 || fighter.visceralActiveTimer > 0) {
      frameIdx = 16 + (Math.floor(gameTimer * 0.28) % 8);
    }
    const mScale = (r * 0.44) / frameW;
    _drawAtPivot(ctx, maskImg, 0, r * 0.04, mScale * hw, mScale * hh, 0.5, 0.5, 0, frameIdx * frameH, frameW, frameH);
  }

  ctx.restore();
}

function _drawArticulatedArms(ctx, fighter, r, rScale, gameTimer, hoverBob, widthScale, heightScale, custom) {
  const shoulderLX = -r * 0.62 * widthScale;
  const shoulderRX = r * 0.62 * widthScale;
  const shoulderY = hoverBob - (r * 0.02 * heightScale);

  const isCharging = (fighter.annihilationWindupTimer || 0) > 0;
  const isFiring = (fighter.annihilationFireTimer || 0) > 0;
  const isCasting = (fighter.visceralActiveTimer || 0) > 0 || (fighter.activeCryonicZones?.length > 0);
  const spreadBoost = isCharging ? 0.55 : (isFiring ? -0.35 : (isCasting ? 0.28 : 0));

  const sides = [
    {
      armKey: 'armLeft', forearmKey: 'forearmLeft', handKey: 'handLeft',
      cArm: custom.armLeft, dArm: AVATAR_OF_EMPTINESS_DEFAULT_CONFIGS.arm_left,
      cFore: custom.forearmLeft, dFore: AVATAR_OF_EMPTINESS_DEFAULT_CONFIGS.forearm_left,
      sx: shoulderLX, sy: shoulderY,
      baseAngle: -0.24 - spreadBoost, sign: -1
    },
    {
      armKey: 'armRight', forearmKey: 'forearmRight', handKey: null,
      cArm: custom.armRight, dArm: AVATAR_OF_EMPTINESS_DEFAULT_CONFIGS.arm_right,
      cFore: custom.forearmRight, dFore: AVATAR_OF_EMPTINESS_DEFAULT_CONFIGS.forearm_right,
      sx: shoulderRX, sy: shoulderY,
      baseAngle: 0.24 + spreadBoost, sign: 1
    }
  ];

  for (const s of sides) {
    const armImg = _getAssetImage(s.armKey);
    if (!_isImageReady(armImg)) continue;
    const armW = widthScale * (s.cArm.widthScale ?? s.dArm.widthScale);
    const armH = heightScale * (s.cArm.heightScale ?? s.dArm.heightScale);
    const offX = (s.cArm.offsetX ?? s.dArm.offsetX) * rScale;
    const offY = (s.cArm.offsetY ?? s.dArm.offsetY) * rScale;
    const ang = (s.cArm.angleOffset ?? s.dArm.angleOffset);
    const fX = (s.cArm.flipX ?? s.dArm.flipX) ? -1 : 1;
    const fY = (s.cArm.flipY ?? s.dArm.flipY) ? -1 : 1;
    const baseScale = (r * 1.48) / (armImg.naturalHeight || 700);
    const sway = Math.sin(gameTimer * 0.04) * 0.05 * (-s.sign);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(s.sx + offX, s.sy + offY);
    ctx.rotate(s.baseAngle + sway + ang);
    _drawAtPivot(ctx, armImg, 0, 0, baseScale * armW * fX, baseScale * armH * fY, 0.5, 0.2);

    const foreImg = _getAssetImage(s.forearmKey);
    if (_isImageReady(foreImg)) {
      const fScale = (r * 1.38) / (foreImg.naturalHeight || 900);
      const foreW = widthScale * (s.cFore.widthScale ?? s.dFore.widthScale);
      const foreH = heightScale * (s.cFore.heightScale ?? s.dFore.heightScale);
      ctx.save();
      ctx.translate(s.sign * r * 0.16 * armW, r * 0.62 * armH);
      ctx.rotate(s.sign * (-0.18 + Math.sin(gameTimer * 0.05) * 0.06) + (s.cFore.angleOffset ?? 0));
      _drawAtPivot(ctx, foreImg, 0, 0, fScale * foreW, fScale * foreH, 0.5, 0.14);

      const handImg = s.handKey ? _getAssetImage(s.handKey) : null;
      if (_isImageReady(handImg)) {
        const hScale = (r * 0.42) / (handImg.naturalHeight || 220);
        _drawAtPivot(ctx, handImg, 0, r * 0.58 * foreH, hScale * foreW, hScale * foreH, 0.5, 0.1);
      }
      ctx.restore();
    }

    ctx.restore();
  }
}

/**
 * Main Skin Render Routine for Avatar of Emptiness
 */
export function drawAvatarOfEmptinessSkin(ctx, fighter) {
  if (!fighter || fighter.dead) return;

  const r = fighter.r || fighter.radius || 29;
  const rScale = r / 25;
  const gameTimer = (typeof state !== 'undefined' && state.gameTimer) ? state.gameTimer : 0;
  const universe = fighter.currentUniverse || 'dark';
  const isPhase2 = Boolean(fighter.isPhase2);

  const custom = _getCustomMap();
  const overallDef = AVATAR_OF_EMPTINESS_DEFAULT_CONFIGS.overall;
  const widthScale = custom.overall.widthScale ?? overallDef.widthScale;
  const heightScale = custom.overall.heightScale ?? overallDef.heightScale;
  const customOffsetX = (custom.overall.offsetX ?? overallDef.offsetX) * rScale;
  const customOffsetY = (custom.overall.offsetY ?? overallDef.offsetY) * rScale;
  const customAngleOffset = (custom.overall.angleOffset ?? overallDef.angleOffset);

  ctx.save();
  ctx.translate(fighter.x, fighter.y);

  const angle = fighter._isWinnerReveal ? 0 : (fighter.gunAngle || 0);
  ctx.rotate(angle);
  if (Math.abs(angle) > Math.PI / 2) {
    ctx.scale(1, -1);
  }
  if (customAngleOffset !== 0) {
    ctx.rotate(customAngleOffset);
  }
  ctx.translate(customOffsetX, customOffsetY);
  if (custom.overall.flipX) ctx.scale(-1, 1);
  if (custom.overall.flipY) ctx.scale(1, -1);

  const hoverBob = Math.sin(gameTimer * 0.045) * (r * 0.08);
  const showBody = (typeof state === 'undefined') || (state.studioSkinShowBody !== false) || !fighter._isStudioDummy;

  if (showBody) {
    _drawBackLegsAndRift(ctx, r, rScale, gameTimer, universe, isPhase2, hoverBob, widthScale, heightScale, custom.legs);
    _drawCoreAndLily(ctx, fighter, r, rScale, gameTimer, universe, hoverBob, widthScale, heightScale, custom.body, custom.lily);
    _drawHeadAndMask(ctx, fighter, r, rScale, gameTimer, hoverBob, widthScale, heightScale, custom.head);
  }

  _drawArticulatedArms(ctx, fighter, r, rScale, gameTimer, hoverBob, widthScale, heightScale, custom);

  ctx.restore();
}
