// ─────────────────────────────────────────────────────────────────────────────
// DBZ MUGEN VFX Sprite Renderer (Goku & Vegeta)
// Uses blend-converted 60 FPS sprite strips from Assets/effects/dbz/ (Rule 35).
// ─────────────────────────────────────────────────────────────────────────────

import { CONFIG } from '../../core/config.js';
import { state } from '../../core/state.js';

const DBZ_VFX_SPECS = {
  auraGold1: { src: 'Assets/effects/dbz/dbz-ssj-aura_frame_1.png', frames: 1, cw: 724, ch: 724 },
  auraGold2: { src: 'Assets/effects/dbz/dbz-ssj-aura_frame_2.png', frames: 1, cw: 724, ch: 724 },
  auraGold3: { src: 'Assets/effects/dbz/dbz-ssj-aura_frame_3.png', frames: 1, cw: 724, ch: 724 },
  auraCrimson1: { src: 'Assets/effects/dbz/dbz-kaioken-aura_frame_1.png', frames: 1, cw: 724, ch: 724 },
  auraCrimson2: { src: 'Assets/effects/dbz/dbz-kaioken-aura_frame_2.png', frames: 1, cw: 724, ch: 724 },
  auraCrimson3: { src: 'Assets/effects/dbz/dbz-kaioken-aura_frame_3.png', frames: 1, cw: 724, ch: 724 },
  auraBlue1: { src: 'Assets/effects/dbz/dbz-blue-aura_frame_1.png', frames: 1, cw: 724, ch: 724 },
  auraBlue2: { src: 'Assets/effects/dbz/dbz-blue-aura_frame_2.png', frames: 1, cw: 724, ch: 724 },
  auraBlue3: { src: 'Assets/effects/dbz/dbz-blue-aura_frame_3.png', frames: 1, cw: 724, ch: 724 },
  kiOrbGold: { src: 'Assets/effects/dbz/dbz-ki-orb-gold.png', frames: 8, cw: 96, ch: 96 },
  kiOrbCyan: { src: 'Assets/effects/dbz/dbz-ki-orb-cyan.png', frames: 8, cw: 96, ch: 96 },
  zVanish: { src: 'Assets/effects/dbz/dbz-z-vanish.png', frames: 8, cw: 96, ch: 96 },
  chargeBlue: { src: 'Assets/effects/dbz/dbz-charge-flare-blue.png', frames: 8, cw: 128, ch: 128 },
  chargeGold: { src: 'Assets/effects/dbz/dbz-charge-flare-gold.png', frames: 8, cw: 128, ch: 128 },
  impactArc: { src: 'Assets/effects/dbz/dbz-impact-arc.png', frames: 5, cw: 128, ch: 128 },
  explosionBlue: { src: 'Assets/effects/dbz/dbz-explosion-blue.png', frames: 8, cw: 128, ch: 128 },
  explosionGold: { src: 'Assets/effects/dbz/dbz-explosion-gold.png', frames: 8, cw: 128, ch: 128 },
  beamBlue: { src: 'Assets/effects/dbz/dbz-beam-blue.png', frames: 6, cw: 224, ch: 128 },
  beamViolet: { src: 'Assets/effects/dbz/dbz-beam-violet.png', frames: 6, cw: 224, ch: 128 },
  beamGold: { src: 'Assets/effects/dbz/dbz-beam-gold.png', frames: 6, cw: 224, ch: 128 },
};

const _vfxCache = new Map();

function _getVfxEntry(key) {
  const spec = DBZ_VFX_SPECS[key];
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

export function preloadDbzVfx() {
  for (const key of Object.keys(DBZ_VFX_SPECS)) {
    _getVfxEntry(key);
  }
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  preloadDbzVfx();
}

function _isVfxDisabled() {
  if (typeof CONFIG !== 'undefined' && CONFIG.enableVfx === false) return true;
  if (typeof state !== 'undefined' && (state.performanceMode || (state.qualityLevel && state.qualityLevel < 0.5))) return true;
  return false;
}

const DBZ_SPARK_PALETTES = {
  gold: [
    { core: '#FFFFFF', outer: '#FFD700' },
    { core: '#FFFDE7', outer: '#F59E0B' },
    { core: '#FEF08A', outer: '#EAB308' },
  ],
  crimson: [
    { core: '#FFFFFF', outer: '#FF1744' },
    { core: '#FFE8EC', outer: '#E00C26' },
    { core: '#FFCDD2', outer: '#D50000' },
  ],
  blue: [
    { core: '#FFFFFF', outer: '#00E5FF' },
    { core: '#E0F7FA', outer: '#00B0FF' },
    { core: '#B3E5FC', outer: '#0091EA' },
  ],
};

function _drawDbzAuraPixelSparks(ctx, x, y, r, theme) {
  const palette = DBZ_SPARK_PALETTES[theme] || DBZ_SPARK_PALETTES.gold;
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const P = 2.0;
  const snap = (v) => Math.round(v / P) * P;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < 12; i++) {
    const seed = i * 79.19 + (i % 3) * 31.7;
    const period = 1100 + (i % 7) * 160;
    const progress = ((now * 0.9 + seed * 12) % period) / period;
    const curY = y + snap(r * 1.05 + (-r * 4.45) * progress);
    const spreadW = (r * 1.35) * (1.15 - progress * 0.55);
    const curX = x + snap(Math.sin(seed * 3.7) * spreadW + Math.sin((now * 0.006) + i * 1.4) * (r * 0.22));
    const alpha = progress < 0.12 ? (progress / 0.12) : (progress > 0.65 ? Math.max(0, (1.0 - progress) / 0.35) : 1.0);
    if (alpha <= 0.02) continue;

    const col = palette[i % palette.length];
    ctx.globalAlpha = alpha * 0.92;
    ctx.fillStyle = col.outer;
    ctx.fillRect(curX - P, curY - P, P * 2, P * 2);
    ctx.fillStyle = col.core;
    ctx.fillRect(curX - P * 0.5, curY - P * 0.5, P, P);
  }
  ctx.restore();
}

/**
 * Draws an animated 16-bit spiky DBZ Ki Aura behind the fighter matching CJ's BAGUVIX aura template.
 */
export function drawDbzAura(ctx, x, y, r, theme = 'gold', alpha = 0.96) {
  if (!ctx || _isVfxDisabled()) return false;
  const prefix = theme === 'crimson' ? 'auraCrimson' : (theme === 'blue' ? 'auraBlue' : 'auraGold');
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const frameNum = (Math.floor(now / 85) % 3) + 1;
  const entry = _getVfxEntry(`${prefix}${frameNum}`) || _getVfxEntry(`${prefix}1`);
  if (!entry || !entry.loaded || entry.img.naturalWidth <= 0) return false;

  // Exact CJ-baguvix-aura 724x724 body-cutout calibration (265px cavity centered at 355, 542.5)
  const scale = (r * 2.0) / 265;
  const drawW = 724 * scale;
  const drawH = 724 * scale;
  const drawX = x - 355 * scale;
  const drawY = y - 542.5 * scale;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  ctx.drawImage(entry.img, drawX, drawY, drawW, drawH);
  ctx.restore();

  _drawDbzAuraPixelSparks(ctx, x, y, r, theme);
  return true;
}

/**
 * Draws a spinning DBZ energy charge flare (Kamehameha, Galick Gun, Big Bang, Final Flash).
 */
export function drawDbzChargeFlare(ctx, x, y, radius, theme = 'blue', progress = 0.5) {
  if (!ctx || _isVfxDisabled()) return false;
  const key = theme === 'gold' ? 'chargeGold' : 'chargeBlue';
  const entry = _getVfxEntry(key);
  if (!entry || !entry.loaded || entry.img.naturalWidth <= 0) return false;

  const p = Math.max(0, Math.min(1, progress));
  const frameIdx = Math.min(entry.frames - 1, Math.floor((Date.now() / 45) % entry.frames));
  const size = Math.max(24, radius * (1.2 + p * 1.4));

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((Date.now() * 0.008) % (Math.PI * 2));
  ctx.globalAlpha = 0.55 + p * 0.4;
  ctx.drawImage(
    entry.img,
    frameIdx * entry.cw, 0, entry.cw, entry.ch,
    -size * 0.5, -size * 0.5, size, size
  );
  ctx.restore();
  return true;
}

/**
 * Draws a directional DBZ Comet Ki Blast orb (rotated along velocity vector).
 */
export function drawDbzKiOrb(ctx, x, y, angle, r, theme = 'gold') {
  if (!ctx || _isVfxDisabled()) return false;
  const key = theme === 'cyan' ? 'kiOrbCyan' : 'kiOrbGold';
  const entry = _getVfxEntry(key);
  if (!entry || !entry.loaded || entry.img.naturalWidth <= 0) return false;

  const frameIdx = Math.floor(Date.now() / 40) % entry.frames;
  const size = Math.max(22, r * 4.2);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle || 0);
  ctx.drawImage(
    entry.img,
    frameIdx * entry.cw, 0, entry.cw, entry.ch,
    -size * 0.65, -size * 0.5, size, size
  );
  ctx.restore();
  return true;
}

/**
 * Draws a DBZ Z-Vanish speed-streak flash at a teleport departure/arrival coordinate.
 */
export function drawDbzZVanishFlash(ctx, x, y, r, progress = 0.5) {
  if (!ctx || _isVfxDisabled()) return false;
  const entry = _getVfxEntry('zVanish');
  if (!entry || !entry.loaded || entry.img.naturalWidth <= 0) return false;

  const p = Math.max(0, Math.min(1, progress));
  const frameIdx = Math.min(entry.frames - 1, Math.floor(p * entry.frames));
  const size = r * 2.8;

  ctx.save();
  ctx.globalAlpha = Math.max(0, (1 - p) * 0.9);
  ctx.drawImage(
    entry.img,
    frameIdx * entry.cw, 0, entry.cw, entry.ch,
    x - size * 0.5, y - size * 0.5, size, size
  );
  ctx.restore();
  return true;
}

/**
 * Draws a jagged DBZ heavy impact crescent arc.
 */
export function drawDbzImpactArc(ctx, x, y, angle, r, progress = 0.5) {
  if (!ctx || _isVfxDisabled()) return false;
  const entry = _getVfxEntry('impactArc');
  if (!entry || !entry.loaded || entry.img.naturalWidth <= 0) return false;

  const p = Math.max(0, Math.min(1, progress));
  const frameIdx = Math.min(entry.frames - 1, Math.floor(p * entry.frames));
  const size = r * 3.0;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle || 0);
  ctx.globalAlpha = Math.max(0, 1 - p * 0.75);
  ctx.drawImage(
    entry.img,
    frameIdx * entry.cw, 0, entry.cw, entry.ch,
    -size * 0.45, -size * 0.5, size, size
  );
  ctx.restore();
  return true;
}

/**
 * Draws an 8-frame DBZ energy detonation burst (Big Bang, Kamehameha, Final Flash).
 */
export function drawDbzExplosion(ctx, x, y, radius, theme = 'blue', progress = 0.5) {
  if (!ctx || _isVfxDisabled()) return false;
  const key = theme === 'gold' ? 'explosionGold' : 'explosionBlue';
  const entry = _getVfxEntry(key);
  if (!entry || !entry.loaded || entry.img.naturalWidth <= 0) return false;

  const p = Math.max(0, Math.min(1, progress));
  const frameIdx = Math.min(entry.frames - 1, Math.floor(p * entry.frames));
  const size = Math.max(48, radius * 2.4);

  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - Math.pow(p, 1.8));
  ctx.drawImage(
    entry.img,
    frameIdx * entry.cw, 0, entry.cw, entry.ch,
    x - size * 0.5, y - size * 0.5, size, size
  );
  ctx.restore();
  return true;
}

/**
 * Draws an animated DBZ energy beam sprite (Kamehameha, Galick Gun, Final Flash).
 */
export function drawDbzBeam(ctx, x, y, angle, length, width, theme = 'blue') {
  if (!ctx || _isVfxDisabled()) return false;
  const key = theme === 'gold' ? 'beamGold' : (theme === 'violet' ? 'beamViolet' : 'beamBlue');
  const entry = _getVfxEntry(key);
  if (!entry || !entry.loaded || entry.img.naturalWidth <= 0) return false;

  const frameIdx = Math.floor(Date.now() / 45) % entry.frames;
  const drawH = Math.max(48, width * 1.45);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle || 0);
  ctx.drawImage(
    entry.img,
    frameIdx * entry.cw, 0, entry.cw, entry.ch,
    0, -drawH * 0.5, length, drawH
  );
  ctx.restore();
  return true;
}

/**
 * Ticks transient DBZ VFX lifecycles (call at top of update() before _handleTimeStop per Rule 25).
 */
export function updateDbzTransientVfx(list) {
  if (!Array.isArray(list) || list.length === 0) return;
  for (let i = list.length - 1; i >= 0; i--) {
    list[i].life--;
    if (list[i].life <= 0) {
      list.splice(i, 1);
    }
  }
}

/**
 * Renders transient DBZ VFX (Z-Vanish flashes, Impact Arcs, Energy Explosions).
 */
export function drawDbzTransientVfx(ctx, list) {
  if (!ctx || !Array.isArray(list) || list.length === 0 || _isVfxDisabled()) return;
  for (let i = 0; i < list.length; i++) {
    const fx = list[i];
    const progress = 1 - Math.max(0, fx.life) / Math.max(1, fx.maxLife);
    if (fx.type === 'zVanish') {
      drawDbzZVanishFlash(ctx, fx.x, fx.y, fx.r || 25, progress);
    } else if (fx.type === 'impactArc') {
      drawDbzImpactArc(ctx, fx.x, fx.y, fx.angle || 0, fx.r || 28, progress);
    } else if (fx.type === 'explosion') {
      drawDbzExplosion(ctx, fx.x, fx.y, fx.r || 60, fx.theme || 'blue', progress);
    }
  }
}
