// ─────────────────────────────────────────────────────────────────────────────
// HAJIME KASHIMO WEAPON & MUGEN LIGHTNING VFX RENDERER (Rule 20, Rule 35)
// ─────────────────────────────────────────────────────────────────────────────

import { CONFIG } from '../../core/config.js';
import { state } from '../../core/state.js';
import { drawPixelHand } from '../renderers/fighterRenderer.js';

const KASHIMO_VFX_SPECS = {
  amberAura: { src: 'Assets/effects/kashimo/kashimo-amber-aura.png', frames: 8, cw: 128, ch: 128 },
  lightningArc: { src: 'Assets/effects/kashimo/kashimo-lightning-arc.png', frames: 8, cw: 128, ch: 128 },
  railgunBeam: { src: 'Assets/effects/kashimo/kashimo-railgun-beam.png', frames: 6, cw: 224, ch: 128 },
  thunderPillar: { src: 'Assets/effects/kashimo/kashimo-thunder-pillar.png', frames: 8, cw: 128, ch: 192 },
  shockRing: { src: 'Assets/effects/kashimo/kashimo-shock-ring.png', frames: 6, cw: 128, ch: 128 },
  counterWave: { src: 'Assets/effects/kashimo/kashimo-counter-wave.png', frames: 8, cw: 128, ch: 128 },
  thunderDome: { src: 'Assets/effects/kashimo/kashimo-thunder-dome.png', frames: 8, cw: 128, ch: 128 },
  p2Shock: { src: 'Assets/effects/kashimo/kashimo-p2-shock.png', frames: 8, cw: 128, ch: 128 },
};

const _vfxCache = new Map();

function _getVfxEntry(key) {
  const spec = KASHIMO_VFX_SPECS[key];
  if (!spec) return null;
  let entry = _vfxCache.get(key);
  if (entry) return entry;
  if (typeof Image === 'undefined') return null;

  const img = new Image();
  entry = { img, loaded: false, ...spec };
  img.onload = () => { entry.loaded = true; };
  img.src = spec.src;
  _vfxCache.set(key, entry);
  return entry;
}

export function preloadKashimoVfx() {
  for (const k of Object.keys(KASHIMO_VFX_SPECS)) _getVfxEntry(k);
}

export function getKashimoVfxEntries() {
  preloadKashimoVfx();
  return Object.values(KASHIMO_VFX_SPECS).map(s => _vfxCache.get(Object.keys(KASHIMO_VFX_SPECS).find(k => KASHIMO_VFX_SPECS[k] === s))).filter(Boolean);
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  preloadKashimoVfx();
}

function _isVfxDisabled() {
  if (typeof CONFIG !== 'undefined' && CONFIG.enableVfx === false) return true;
  if (typeof state !== 'undefined' && (state.performanceMode || (state.qualityLevel && state.qualityLevel < 0.5))) return true;
  return false;
}

/**
 * Draws Kashimo's silver-cyan Nyoi Staff anchored strictly at the canonical lower-torso hand (Rule 20).
 */
export function drawKashimoStaffAndSlashVFX(ctx, fighter, r, facingLeft = false) {
  if (!ctx || !fighter) return;
  const custom = (typeof state !== 'undefined' && state.weaponCustomizations?.kashimo) || {};
  const scale = custom.scale ?? 1.0;

  // 5-phase melee kinematics offset
  const swingT = fighter.slashSwingTimer || 0;
  const maxT = Math.max(1, fighter.slashSwingMaxTimer || 16);
  let swingOffset = 0;
  let lungeX = 0;
  if (swingT > 0) {
    const p = 1 - Math.max(0, Math.min(1, swingT / maxT));
    if (p < 0.25) {
      swingOffset = -0.75 * (p / 0.25);
      lungeX = -r * 0.14 * (p / 0.25);
    } else if (p < 0.55) {
      const sp = (p - 0.25) / 0.30;
      swingOffset = -0.75 + 2.15 * Math.sin(sp * Math.PI / 2);
      lungeX = r * 0.48 * Math.sin(sp * Math.PI / 2);
    } else if (p < 0.72) {
      swingOffset = 1.40;
      lungeX = r * 0.48;
    } else {
      const rp = (p - 0.72) / 0.28;
      swingOffset = 1.40 * Math.cos(rp * Math.PI / 2);
      lungeX = r * 0.48 * Math.cos(rp * Math.PI / 2);
    }
  }

  // Canonical lower-torso flank anchor (Rule 20: NEVER placed above head/hair)
  const anchorX = r * 0.82 + lungeX + (custom.offsetX || 0);
  const anchorY = r * 0.38 + (custom.offsetY || 0);
  const handRadius = r * 0.30;
  const isAmber = Boolean(fighter.isAmberForm);
  const staffLen = r * 2.55 * scale;

  ctx.save();
  ctx.translate(anchorX, anchorY);
  ctx.rotate(swingOffset * (fighter.slashDir || 1) + (custom.angleOffset || 0) - 0.35);

  // Staff shaft behind & ahead of grip
  ctx.fillStyle = '#0E0F14';
  ctx.fillRect(-staffLen * 0.40 - 1.5, -3.5, staffLen + 3, 7);
  ctx.fillStyle = isAmber ? '#C084FC' : '#94A3B8';
  ctx.fillRect(-staffLen * 0.40, -2.0, staffLen, 4);
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(-staffLen * 0.38, -1.2, staffLen * 0.96, 1.4);

  // Electrified cyan/violet spear tips
  const tipColor = isAmber ? '#C084FC' : '#38BDF8';
  ctx.fillStyle = tipColor;
  ctx.fillRect(staffLen * 0.60 - 7, -3.2, 8, 6.4);
  ctx.fillRect(-staffLen * 0.40, -3.2, 6, 6.4);

  // Canonical hand directly over the grip at (0, 0)
  if (!fighter.hideHands && !fighter.hideFrontHand) {
    drawPixelHand(ctx, 0, 0, handRadius, isAmber ? '#E9D5FF' : '#FEDBC0', '#0E0F14');
  }
  ctx.restore();
}

export function drawKashimoWeaponPreview(ctx, x, y, angle, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle || 0);
  const len = r * 2.4;
  ctx.fillStyle = '#0E0F14';
  ctx.fillRect(-len * 0.5 - 1.5, -3.5, len + 3, 7);
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(-len * 0.5, -2, len, 4);
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(len * 0.5 - 7, -3.2, 8, 6.4);
  ctx.restore();
}

/**
 * Draws Kashimo's Mythical Beast Amber MUGEN lightning shroud aura (Kashimo_Hajime Group 30511).
 */
export function drawKashimoAmberAura(ctx, x, y, r, alpha = 0.92) {
  if (!ctx || _isVfxDisabled()) return false;
  const entry = _getVfxEntry('amberAura');
  if (!entry || !entry.loaded || entry.img.naturalWidth <= 0) return false;

  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const frameIdx = Math.floor(now / 65) % entry.frames;
  const size = Math.max(88, r * 3.45);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(entry.img, frameIdx * entry.cw, 0, entry.cw, entry.ch, x - size * 0.5, y - size * 0.5, size, size);
  ctx.restore();
  return true;
}

/**
 * Draws MUGEN Statedef 1300 Counter Stance swirling lightning ring (Group 216 sprite) instead of plain vector arc.
 */
export function drawKashimoCounterAura(ctx, x, y, r, alpha = 0.90) {
  if (!ctx || _isVfxDisabled()) return false;
  const entry = _getVfxEntry('p2Shock');
  if (!entry || !entry.loaded || entry.img.naturalWidth <= 0) return false;

  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const frameIdx = Math.floor(now / 55) % entry.frames;
  const size = Math.max(60, r * 2.95);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(entry.img, frameIdx * entry.cw, 0, entry.cw, entry.ch, x - size * 0.5, y - size * 0.5, size, size);
  ctx.restore();
  return true;
}

/**
 * Draws Kashimo's Sure-Hit Lightning Railgun Beam (Hajime Supers Group 460 / 3055).
 */
export function drawKashimoRailgunBeam(ctx, x, y, angle, length, width) {
  if (!ctx || _isVfxDisabled()) return false;
  const entry = _getVfxEntry('railgunBeam');
  if (!entry || !entry.loaded || entry.img.naturalWidth <= 0) return false;

  const frameIdx = Math.floor(Date.now() / 42) % entry.frames;
  const drawH = Math.max(48, width * 1.45);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle || 0);
  ctx.drawImage(entry.img, frameIdx * entry.cw, 0, entry.cw, entry.ch, 0, -drawH * 0.5, length, drawH);
  ctx.restore();
  return true;
}

export function updateKashimoTransientVfx(list) {
  if (!Array.isArray(list) || list.length === 0) return;
  for (let i = list.length - 1; i >= 0; i--) {
    list[i].life--;
    if (list[i].life <= 0) list.splice(i, 1);
  }
}

export function drawKashimoTransientVfx(ctx, list) {
  if (!ctx || !Array.isArray(list) || list.length === 0 || _isVfxDisabled()) return;
  for (let i = 0; i < list.length; i++) {
    const fx = list[i];
    const p = 1 - Math.max(0, fx.life) / Math.max(1, fx.maxLife);
    const entry = _getVfxEntry(fx.kind);
    if (!entry || !entry.loaded || entry.img.naturalWidth <= 0) continue;

    const frameIdx = Math.min(entry.frames - 1, Math.floor(p * entry.frames));
    const w = fx.w || fx.r * 2.6 || 76;
    const h = fx.h || w;

    ctx.save();
    ctx.translate(fx.x, fx.y);
    if (fx.angle) ctx.rotate(fx.angle);
    ctx.globalAlpha = Math.max(0, 1 - Math.pow(p, 1.8));
    ctx.drawImage(entry.img, frameIdx * entry.cw, 0, entry.cw, entry.ch, -w * 0.5, -h * (fx.anchorY ?? 0.5), w, h);
    ctx.restore();
  }
}
