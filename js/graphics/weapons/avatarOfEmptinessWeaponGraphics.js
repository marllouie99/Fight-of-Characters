// ─────────────────────────────────────────────
// Avatar of Emptiness Weapon & Visual Effects Graphics
// Terraria: Wrath of the Gods — Three Universes, Portals & Universal Annihilation
// Strictly enforces Rule 11 (zero shadowBlur), Rule 15 (tapered crescents),
// Rule 16 (needle speed lines), Rule 26 (clean sequential shockwaves, zero cobweb),
// Rule 35 (pre-baked radial glows, zero createRadialGradient) and Stack Balance
// ─────────────────────────────────────────────

import { state } from '../../core/state.js';
import { drawCachedRadialGlow } from '../glowSpriteCache.js';

const _VFX_PATHS = {
  riftInner: 'Assets/effects/Avatar/RiftInnerTexture.png',
  avatarRift: 'Assets/effects/Avatar/AvatarRift.png',
  voidBlot: 'Assets/effects/Avatar/VoidBlot.png',
  deadStar: 'Assets/effects/Avatar/DeadStar.png',
  comet: 'Assets/effects/Avatar/DimensionTwistedComet.png',
  disgustingStar: 'Assets/effects/Avatar/DisgustingStar.png',
  arcticBlast: 'Assets/effects/Avatar/ArcticBlast.png',
  snowflake: 'Assets/effects/Avatar/Snowflake.png',
  frostSkull1: 'Assets/effects/Avatar/FrostIllusion_Skull.png',
  frostSkull2: 'Assets/effects/Avatar/FrostIllusion_Skull2.png',
  frostLaRuga: 'Assets/effects/Avatar/FrostIllusion_LaRuga.png',
  bloodSplatter: 'Assets/effects/Avatar/BloodSplatterParticle.png',
  rubble: 'Assets/effects/Avatar/AcceleratingRubble.png',
  grabHand1: 'Assets/model/avatar/GrabbingShadowHand1.png',
  grabHand2: 'Assets/model/avatar/GrabbingShadowHand2.png',
  grabHand3: 'Assets/model/avatar/GrabbingShadowHand3.png',
  shadowHand1: 'Assets/model/avatar/ShadowHand1.png',
  shadowHand2: 'Assets/model/avatar/ShadowHand2.png',
  shadowHand3: 'Assets/model/avatar/ShadowHand3.png',
  shadowHand4: 'Assets/model/avatar/ShadowHand4.png'
};

const _vfxImageCache = new Map();

function _getVfxImage(key) {
  const existing = _vfxImageCache.get(key);
  if (existing) return existing;
  const src = _VFX_PATHS[key];
  if (!src || typeof Image === 'undefined') return null;
  const img = new Image();
  img.src = src;
  _vfxImageCache.set(key, img);
  return img;
}

function _isImgReady(img) {
  if (!img) return false;
  if (img.complete !== undefined) return Boolean(img.complete && img.naturalWidth > 0);
  return Boolean((img.width || img.naturalWidth) > 0);
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  for (const key of Object.keys(_VFX_PATHS)) {
    _getVfxImage(key);
  }
}

export function drawAvatarWeapon(ctx, fighter) {
  if (!fighter || fighter.hp <= 0) return;
  // Limb & hand rendering handled in avatarOfEmptinessSkin.js
}

/**
 * Renders Universal Annihilation Convergence Singularity Charge
 */
export function drawUniversalAnnihilationCharge(ctx, fighter, angle) {
  if (!fighter || fighter.hp <= 0) return;

  const r = fighter.r || 29;
  const gameTimer = (typeof state !== 'undefined' && state.gameTimer) ? state.gameTimer : 0;
  const windupProgress = Math.max(0, Math.min(1.0, 1.0 - (fighter.annihilationWindupTimer / (fighter.annihilationWindupMax || 50))));

  ctx.save();
  ctx.translate(fighter.x, fighter.y);
  ctx.rotate(angle);

  const focusX = r * 1.65;
  const focusY = 0;
  const coreRadius = Math.max(6, (r * 1.9) * Math.sin(windupProgress * Math.PI * 0.5));

  // Pre-baked Singularity Halo (Rule 35 - zero createRadialGradient)
  drawCachedRadialGlow(ctx, focusX, focusY, coreRadius * 1.85, [
    [0, 'rgba(255, 255, 255, 0.95)'],
    [0.25, 'rgba(0, 245, 212, 0.8)'],
    [0.6, 'rgba(157, 78, 221, 0.45)'],
    [1, 'rgba(6, 7, 11, 0)']
  ]);

  const riftTex = _getVfxImage('riftInner');
  if (_isImgReady(riftTex)) {
    const riftSize = coreRadius * (2.6 - windupProgress * 0.9);
    ctx.save();
    ctx.translate(focusX, focusY);
    ctx.rotate(-gameTimer * 0.08);
    ctx.globalAlpha = 0.72 * windupProgress;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(riftTex, -riftSize * 0.5, -riftSize * 0.5, riftSize, riftSize);
    ctx.restore();
  }

  // Orbiting Dead Star / Disgusting Star Remnants collapsing inward
  const deadStarImg = _getVfxImage('deadStar');
  const orbCount = 8;
  for (let i = 0; i < orbCount; i++) {
    const ringAngle = (i * (Math.PI * 2 / orbCount)) + (gameTimer * 0.09);
    const ringDist = coreRadius * (0.95 + (1.0 - windupProgress) * 2.1);
    const pX = focusX + Math.cos(ringAngle) * ringDist;
    const pY = focusY + Math.sin(ringAngle) * ringDist;

    if (_isImgReady(deadStarImg) && i % 2 === 0) {
      const sz = 14 + windupProgress * 8;
      ctx.save();
      ctx.translate(pX, pY);
      ctx.rotate(ringAngle);
      ctx.globalAlpha = 0.85;
      ctx.drawImage(deadStarImg, -sz * 0.5, -sz * 0.5, sz, sz);
      ctx.restore();
    } else {
      ctx.fillStyle = (i % 2 === 0) ? '#00F5D4' : '#FF0055';
      ctx.beginPath();
      ctx.arc(pX, pY, 3 + windupProgress * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Central Obsidian Event Horizon Core + Chromatic Rim
  ctx.fillStyle = '#06070B';
  ctx.beginPath();
  ctx.arc(focusX, focusY, coreRadius * 0.46, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = windupProgress > 0.75 ? '#FFFFFF' : '#00F5D4';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders the screen-spanning Universal Annihilation Reality Shatter Beam
 */
export function drawUniversalAnnihilationBeam(ctx, fighter, angle) {
  if (!fighter || fighter.hp <= 0) return;

  const r = fighter.r || 29;
  const gameTimer = (typeof state !== 'undefined' && state.gameTimer) ? state.gameTimer : 0;
  const beamLength = fighter.annihilationBeamLength || 1300;
  const baseWidth = fighter.annihilationBeamWidth || 52;
  const pulse = Math.sin(gameTimer * 0.45) * 6;
  const currentWidth = baseWidth + pulse;

  ctx.save();
  ctx.translate(fighter.x, fighter.y);
  ctx.rotate(angle);

  const startX = r * 1.2;

  // 1. Outermost Void Amethyst & Visceral Chromatic Distortion Aura
  ctx.fillStyle = 'rgba(157, 78, 221, 0.24)';
  ctx.fillRect(startX, -currentWidth * 1.45, beamLength, currentWidth * 2.9);

  ctx.fillStyle = 'rgba(255, 0, 85, 0.20)';
  ctx.fillRect(startX, -currentWidth * 1.15, beamLength, currentWidth * 2.3);

  // 2. Cryonic Cyan Corona Band
  ctx.fillStyle = 'rgba(0, 245, 212, 0.48)';
  ctx.fillRect(startX, -currentWidth * 0.88, beamLength, currentWidth * 1.76);

  // 3. Deep Amethyst Core Ray
  ctx.fillStyle = '#9D4EDD';
  ctx.fillRect(startX, -currentWidth * 0.54, beamLength, currentWidth * 1.08);

  // 4. White-Hot Singularity Center Line
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(startX, -currentWidth * 0.22, beamLength, currentWidth * 0.44);

  // 5. Rule 16 Needle Shock Polygons streaming forward along beam
  for (let d = startX + 40; d < startX + Math.min(960, beamLength); d += 95) {
    const waveY = Math.sin((d * 0.03) - (gameTimer * 0.55)) * (currentWidth * 0.85);
    const needleX = d + ((gameTimer * 18) % 95);
    ctx.fillStyle = (Math.floor(d / 95) % 2 === 0) ? '#00F5D4' : '#FF0055';
    ctx.beginPath();
    ctx.moveTo(needleX, waveY - 3.5);
    ctx.lineTo(needleX + 42, waveY);
    ctx.lineTo(needleX, waveY + 3.5);
    ctx.lineTo(needleX - 16, waveY);
    ctx.closePath();
    ctx.fill();
  }

  // 6. Origin Aperture Rift + Pre-Baked Muzzle Flare (Rule 35 - zero createRadialGradient)
  const flareRadius = currentWidth * 1.85;
  drawCachedRadialGlow(ctx, startX, 0, flareRadius, [
    [0, 'rgba(255, 255, 255, 1.0)'],
    [0.32, 'rgba(0, 245, 212, 0.88)'],
    [0.65, 'rgba(157, 78, 221, 0.48)'],
    [1, 'rgba(6, 7, 11, 0)']
  ]);

  const riftTex = _getVfxImage('riftInner');
  if (_isImgReady(riftTex)) {
    const apertureSize = currentWidth * 2.2;
    ctx.save();
    ctx.translate(startX, 0);
    ctx.rotate(gameTimer * 0.14);
    ctx.globalAlpha = 0.68;
    ctx.drawImage(riftTex, -apertureSize * 0.5, -apertureSize * 0.5, apertureSize, apertureSize);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws clean staggered concentric shockwaves (Rule 26 compliant: sequential water-ripple wavefronts, zero cobwebbing)
 */
export function drawAvatarShockwaves(ctx, shockwaves) {
  if (!shockwaves || shockwaves.length === 0) return;

  for (const sw of shockwaves) {
    const maxLife = sw.maxLife || 36;
    const progress = Math.max(0, Math.min(1, 1 - (sw.life / maxLife)));
    const maxRadius = sw.maxRadius || 200;
    const waveCount = sw.waveCount || 3;
    const primary = sw.color || '#9D4EDD';
    const secondary = sw.secondaryColor || '#00F5D4';

    ctx.save();
    ctx.translate(sw.x, sw.y);

    for (let k = 0; k < waveCount; k++) {
      const offset = k * 0.14;
      if (progress <= offset) continue;
      const lp = Math.min(1, (progress - offset) / (1 - offset));
      const rad = maxRadius * Math.pow(lp, 0.72);
      const popIn = Math.min(1, lp / 0.10);
      const fadeOut = Math.pow(1 - lp, 1.25);
      const alpha = popIn * fadeOut;
      if (alpha <= 0.02 || rad <= 1) continue;

      // Expanding translucent interior wash on leading ring
      if (k === 0) {
        ctx.fillStyle = sw.washColor || `rgba(157, 78, 221, ${(0.18 * alpha).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, 0, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = (k === 0) ? '#FFFFFF' : (k % 2 === 1 ? primary : secondary);
      ctx.lineWidth = Math.max(1.2, (4.2 - k * 0.9) * (1 - lp * 0.45));
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

/**
 * Draws Cryonic Absolute Zero frost rings, snowflake crystals, ghostly skull illusions, and frost columns
 */
export function drawCryonicZeroEffects(ctx, cryonicActiveList) {
  if (!cryonicActiveList || cryonicActiveList.length === 0) return;

  const snowflakeImg = _getVfxImage('snowflake');
  const skullImg = _getVfxImage('frostSkull1');
  const skull2Img = _getVfxImage('frostSkull2');
  const gameTimer = (typeof state !== 'undefined' && state.gameTimer) ? state.gameTimer : 0;

  for (const cryo of cryonicActiveList) {
    ctx.save();
    ctx.translate(cryo.x, cryo.y);

    const maxT = cryo.maxTimer || 150;
    const progress = Math.max(0, Math.min(1, 1.0 - (cryo.timer / maxT)));
    const rad = cryo.radius || 130;

    // Rule 26 sequential frost ripples
    for (let k = 0; k < 2; k++) {
      const off = k * 0.12;
      if (progress <= off) continue;
      const lp = Math.min(1, (progress - off) / (1 - off));
      const waveR = rad * Math.pow(lp, 0.72);
      const alpha = Math.pow(1 - lp, 1.2);
      if (alpha <= 0.02) continue;

      if (k === 0) {
        ctx.fillStyle = `rgba(0, 245, 212, ${(0.14 * alpha).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, 0, waveR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = k === 0 ? '#FFFFFF' : '#00F5D4';
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 3.0 - k * 1.0;
      ctx.beginPath();
      ctx.arc(0, 0, waveR, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Center rotating Snowflake glyph
    if (_isImgReady(snowflakeImg)) {
      const snowSize = rad * 0.9 * Math.sin(Math.min(1, progress * 2) * Math.PI * 0.5);
      ctx.save();
      ctx.rotate(gameTimer * 0.03);
      ctx.globalAlpha = Math.max(0, 0.55 * (1 - progress));
      ctx.drawImage(snowflakeImg, -snowSize * 0.5, -snowSize * 0.5, snowSize, snowSize);
      ctx.restore();
    }

    // Erupting Frost Columns & Ghostly Frost Skull Illusions
    if (cryo.columns) {
      for (let idx = 0; idx < cryo.columns.length; idx++) {
        const col = cryo.columns[idx];
        const colFade = Math.max(0, Math.min(1, 1 - progress * 0.85));
        const colRise = Math.min(1, progress * 3.5);
        ctx.save();
        ctx.translate(col.x - cryo.x, col.y - cryo.y);
        ctx.globalAlpha = colFade;

        // Ghostly Frost Skull apparition behind column
        const activeSkull = (idx % 2 === 0) ? skullImg : skull2Img;
        if (_isImgReady(activeSkull)) {
          ctx.save();
          ctx.globalAlpha = colFade * 0.42;
          const skSz = 56;
          ctx.drawImage(activeSkull, -skSz * 0.5, -52 - (colRise * 18), skSz, skSz);
          ctx.restore();
        }

        const spireH = 66 * colRise;
        ctx.fillStyle = 'rgba(0, 245, 212, 0.78)';
        ctx.beginPath();
        ctx.moveTo(0, -spireH);
        ctx.lineTo(13, 0);
        ctx.lineTo(0, 16);
        ctx.lineTo(-13, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(0, -spireH * 0.76);
        ctx.lineTo(4.5, 0);
        ctx.lineTo(0, 8);
        ctx.lineTo(-4.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
  }
}

/**
 * Draws Visceral Blood Torrent Cone, Double-Tapered Crescent (Rule 15) & Blood Sprites
 */
export function drawVisceralTorrentEffects(ctx, fighter) {
  if (!fighter || fighter.visceralActiveTimer <= 0) return;

  const r = fighter.r || 29;
  const gameTimer = (typeof state !== 'undefined' && state.gameTimer) ? state.gameTimer : 0;
  const reach = fighter.visceralReach || 155;
  const arc = fighter.visceralArc || (Math.PI * 0.88);
  const maxDur = fighter.visceralDurationMax || 90;
  const p = Math.max(0, Math.min(1, 1 - (fighter.visceralActiveTimer / maxDur)));

  ctx.save();
  ctx.translate(fighter.x, fighter.y);
  ctx.rotate(fighter.visceralCastAngle || fighter.gunAngle || 0);

  // Pre-baked visceral crimson glow inside cone clip (Rule 35 - zero createRadialGradient)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(r * 0.75, 0);
  ctx.arc(r * 0.75, 0, reach, -arc / 2, arc / 2);
  ctx.closePath();
  ctx.clip();

  drawCachedRadialGlow(ctx, r * 0.8, 0, reach, [
    [0, 'rgba(255, 0, 85, 0.85)'],
    [0.5, 'rgba(157, 78, 221, 0.55)'],
    [0.85, 'rgba(11, 0, 20, 0.35)'],
    [1, 'rgba(255, 0, 85, 0)']
  ]);

  // Swirling BloodSplatterParticle sprites inside torrent
  const bloodTex = _getVfxImage('bloodSplatter');
  if (_isImgReady(bloodTex)) {
    for (let i = 0; i < 6; i++) {
      const a = (-arc * 0.42) + (i / 5) * (arc * 0.84) + Math.sin(gameTimer * 0.25 + i) * 0.08;
      const dist = r * 1.1 + ((gameTimer * 9 + i * 27) % Math.max(20, reach - r));
      const bx = Math.cos(a) * dist;
      const by = Math.sin(a) * dist;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(a);
      ctx.globalAlpha = 0.82 * Math.max(0.2, 1 - p * 0.6);
      ctx.drawImage(bloodTex, -14, -14, 28, 28);
      ctx.restore();
    }
  }
  ctx.restore();

  // Rule 15 Double-Tapered Crimson Crescent Blade Sweep
  const segments = 14;
  const startA = -arc * 0.5;
  const endA = arc * 0.5;
  const maxThick = 16 * Math.max(0.25, 1 - p);

  ctx.fillStyle = '#FF0055';
  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const ang = startA + (endA - startA) * t;
    const taper = Math.pow(Math.sin(t * Math.PI), 1.15) * (0.3 + 0.7 * t);
    const radOut = reach * 0.92 + maxThick * taper * 0.5;
    const px = r * 0.4 + Math.cos(ang) * radOut;
    const py = Math.sin(ang) * radOut;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  for (let i = segments; i >= 0; i--) {
    const t = i / segments;
    const ang = startA + (endA - startA) * t;
    const taper = Math.pow(Math.sin(t * Math.PI), 1.15) * (0.3 + 0.7 * t);
    const radIn = reach * 0.92 - maxThick * taper * 0.5;
    const px = r * 0.4 + Math.cos(ang) * radIn;
    const py = Math.sin(ang) * radIn;
    ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draws Dark Dimension Portal Strikes using authentic RiftInnerTexture & GrabbingShadowHand/ShadowHand PNGs
 */
export function drawDarkPortalStrikes(ctx, activePortals) {
  if (!activePortals || activePortals.length === 0) return;

  const riftTex = _getVfxImage('riftInner');
  const grabHands = [_getVfxImage('grabHand1'), _getVfxImage('grabHand2'), _getVfxImage('grabHand3')];
  const staticHands = [_getVfxImage('shadowHand1'), _getVfxImage('shadowHand2'), _getVfxImage('shadowHand3')];

  for (let idx = 0; idx < activePortals.length; idx++) {
    const portal = activePortals[idx];
    if (portal.delay > 0) continue;

    ctx.save();
    ctx.translate(portal.x, portal.y);
    ctx.rotate(portal.angle || 0);

    const strikeProgress = Math.max(0, Math.min(1.0, 1.0 - (portal.timer / (portal.maxTimer || 24))));
    const openEnv = Math.sin(strikeProgress * Math.PI);
    const pSize = 42 * Math.max(0.1, openEnv);

    // 1. Dark Rift Portal Oval
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, pSize * 0.48, pSize * 1.15, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#06070B';
    ctx.fill();
    if (_isImgReady(riftTex)) {
      ctx.clip();
      ctx.drawImage(riftTex, -pSize * 1.1, -pSize * 1.2, pSize * 2.2, pSize * 2.4);
    }
    ctx.restore();

    ctx.strokeStyle = '#9D4EDD';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.ellipse(0, 0, pSize * 0.48, pSize * 1.15, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#00F5D4';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // 2. Jutting Shadow Hand Arm from Portal
    if (strikeProgress > 0.15 && strikeProgress < 0.92) {
      const clawExtend = (strikeProgress - 0.15) / 0.77;
      const reachLen = 78 * Math.sin(clawExtend * Math.PI);
      const handImg = grabHands[idx % grabHands.length];
      const fallbackHand = staticHands[idx % staticHands.length];

      // Dark Shadow Arm Shaft bridging portal center to hand
      ctx.fillStyle = '#0A0614';
      ctx.strokeStyle = '#9D4EDD';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(reachLen, -6);
      ctx.lineTo(reachLen, 6);
      ctx.lineTo(0, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (_isImgReady(handImg)) {
        const frames = 5;
        const fw = handImg.naturalWidth || 200;
        const fh = Math.floor((handImg.naturalHeight || 1890) / frames);
        const fIdx = Math.min(frames - 1, Math.floor(clawExtend * frames));
        const scale = 34 / fh;
        ctx.save();
        ctx.translate(reachLen, 0);
        ctx.rotate(Math.PI * 0.5);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(handImg, 0, fIdx * fh, fw, fh, -(fw * scale) * 0.5, -(fh * scale) * 0.5, fw * scale, fh * scale);
        ctx.restore();
      } else if (_isImgReady(fallbackHand)) {
        ctx.save();
        ctx.translate(reachLen, 0);
        ctx.drawImage(fallbackHand, -18, -18, 36, 36);
        ctx.restore();
      } else {
        ctx.fillStyle = '#10002B';
        ctx.strokeStyle = '#00F5D4';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(reachLen - 6, -12);
        ctx.lineTo(reachLen + 26, 0);
        ctx.lineTo(reachLen - 6, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

/**
 * Draws Void Blot dimensional tears spawned during Phase 2 / Dark attacks
 */
export function drawAvatarVoidBlots(ctx, voidBlots) {
  if (!voidBlots || voidBlots.length === 0) return;

  const voidBlotImg = _getVfxImage('voidBlot');
  for (const vb of voidBlots) {
    const maxT = vb.maxTimer || 72;
    const t = Math.max(0, Math.min(1, 1 - (vb.timer / maxT)));
    const alpha = Math.sin(Math.min(1, t * 1.1) * Math.PI);
    if (alpha <= 0.02) continue;

    ctx.save();
    ctx.translate(vb.x, vb.y);
    ctx.rotate(vb.angle || 0);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    const rad = (vb.radius || 46) * (0.65 + 0.45 * Math.sin(t * Math.PI * 0.5));

    if (_isImgReady(voidBlotImg)) {
      const fw = voidBlotImg.naturalWidth || 512;
      const fh = Math.floor((voidBlotImg.naturalHeight || 512) / 2);
      const variant = (vb.variant || 0) % 2;
      ctx.drawImage(voidBlotImg, 0, variant * fh, fw, fh, -rad, -rad * 0.65, rad * 2, rad * 1.3);
    } else {
      ctx.fillStyle = '#06070B';
      ctx.strokeStyle = '#9D4EDD';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(0, 0, rad * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * Draws Antimatter Void Blasts & Dimension-Twisted Comets
 */
export function drawAntimatterBlastProjectile(ctx, p) {
  if (!p) return;
  const cometImg = _getVfxImage(p.isComet ? 'comet' : 'disgustingStar');
  const ang = Math.atan2(p.vy || 0, p.vx || 1);

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(ang);

  drawCachedRadialGlow(ctx, 0, 0, (p.radius || 7) * 2.5, [
    [0, p.isComet ? 'rgba(0, 245, 212, 0.72)' : 'rgba(157, 78, 221, 0.72)'],
    [0.6, 'rgba(6, 7, 11, 0.25)'],
    [1, 'rgba(6, 7, 11, 0)']
  ]);

  if (p.isComet && _isImgReady(cometImg)) {
    const w = (p.radius || 8) * 3.8;
    const h = (p.radius || 8) * 1.7;
    ctx.drawImage(cometImg, -w * 0.55, -h * 0.5, w, h);
  } else {
    ctx.fillStyle = '#06070B';
    ctx.strokeStyle = p.color || '#9D4EDD';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius || 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = p.secondaryColor || '#00F5D4';
    ctx.beginPath();
    ctx.arc(0, 0, (p.radius || 7) * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
