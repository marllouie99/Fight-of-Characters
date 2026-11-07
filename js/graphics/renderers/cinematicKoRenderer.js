// ─────────────────────────────────────────────
// CINEMATIC SLOW-MOTION K.O. FINISHER RENDERER
// Creates a dramatic 25-frame impact climax on fatal round/match blow:
// 1. Time dilation (0.20x slow motion)
// 2. Camera punch-in zoom (1.45x) to impact coordinates
// 3. Supersonic Mach shockwave ring (Rule 26 compliant)
// 4. Manga ink comic "K.O.!" impact stamp
// 5. Heavy haptic tactile pulse
// Follows Rule 26 (Clean concentric shockwave, no cobwebbing)
// and Rule 35 (Zero per-frame allocations, 100% Canvas 2D stack integrity).
// ─────────────────────────────────────────────

import { state } from '../../core/state.js';
import { triggerHaptic } from '../../systems/mobileAppBridge.js';

let _active = false;
let _frame = 0;
const _MAX_FRAMES = 25;
let _impactX = 0;
let _impactY = 0;
let _winner = null;
let _loser = null;

// Pre-seeded ripple wave offsets (Rule 26: Water-ripple wavefront staggering)
const _WAVE_OFFSETS = [0.00, 0.12, 0.24];
const _MAX_SHOCKWAVE_RADIUS = 260;

export function isCinematicKoActive() {
  return _active;
}

/**
 * Triggers the 25-frame slow-motion K.O. finisher
 * @param {number} x Impact point X
 * @param {number} y Impact point Y
 * @param {Object} [winner] Winning fighter
 * @param {Object} [loser] Defeated fighter
 */
export function triggerCinematicKo(x, y, winner = null, loser = null) {
  if (_active) return; // Prevent re-triggering while already executing

  _active = true;
  _frame = 0;
  _impactX = Number.isFinite(x) ? x : (state.canvas ? state.canvas.width / 2 : 270);
  _impactY = Number.isFinite(y) ? y : (state.canvas ? state.canvas.height / 2 : 465);
  _winner = winner;
  _loser = loser;

  state.timeDilation = 0.20;
  state.isCinematicKo = true;

  // Camera Punch-In to impact coordinate
  if (state.camera) {
    state.camera.cinematicOverride = true;
    state.camera.targetX = _impactX;
    state.camera.targetY = _impactY;
    state.camera.targetZoom = 1.45;
  }

  // Tactile haptic burst
  triggerHaptic('heavy');
}

/**
 * Advances the K.O. finisher timeline
 */
export function updateCinematicKo() {
  if (!_active) return;

  _frame++;

  if (_frame <= 12) {
    // Phase 1: High-impact time dilation freeze
    state.timeDilation = 0.20;
  } else if (_frame <= _MAX_FRAMES) {
    // Phase 2: Smooth ease-out back to 1.0x speed and normal camera zoom
    const progress = (_frame - 12) / (_MAX_FRAMES - 12);
    const easeOut = Math.pow(progress, 2);
    state.timeDilation = 0.20 + 0.80 * easeOut;

    if (state.camera) {
      const arena = state.arena;
      if (arena) {
        state.camera.targetX = arena.x + arena.width / 2;
        state.camera.targetY = arena.y + arena.height / 2;
        state.camera.targetZoom = 1.0;
      }
    }
  } else {
    // Finish timeline
    _active = false;
    state.timeDilation = 1.0;
    state.isCinematicKo = false;
    if (state.camera) {
      state.camera.cinematicOverride = false;
    }
  }
}

/**
 * Renders the Mach shockwave and comic ink "K.O.!" stamp
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawCinematicKo(ctx) {
  if (!_active) return;

  const p = Math.min(1.0, _frame / _MAX_FRAMES);

  ctx.save();

  // 1. Expanding translucent interior wash (Rule 26)
  const washRadius = _MAX_SHOCKWAVE_RADIUS * Math.pow(p, 0.7);
  const washAlpha = Math.max(0, (1 - p) * 0.25);
  if (washAlpha > 0.01) {
    ctx.fillStyle = `rgba(255, 30, 60, ${washAlpha})`;
    ctx.beginPath();
    ctx.arc(_impactX, _impactY, washRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Concentric staggered compression shockwaves (Rule 26)
  for (let i = 0; i < _WAVE_OFFSETS.length; i++) {
    const offset = _WAVE_OFFSETS[i];
    if (p < offset) continue;

    const waveP = (p - offset) / (1 - offset);
    if (waveP <= 0 || waveP >= 1) continue;

    const r = _MAX_SHOCKWAVE_RADIUS * Math.pow(waveP, 0.65);
    const popIn = Math.min(1.0, waveP / 0.10);
    const fadeOut = Math.pow(1.0 - waveP, 1.25);
    const alpha = popIn * fadeOut;

    if (alpha > 0.01) {
      // Supersonic outer glow
      ctx.lineWidth = Math.max(1, (1 - waveP) * 5.0);
      ctx.strokeStyle = `rgba(255, 220, 50, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(_impactX, _impactY, r, 0, Math.PI * 2);
      ctx.stroke();

      // Sharp white inner core band
      ctx.lineWidth = Math.max(1, (1 - waveP) * 2.5);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(_impactX, _impactY, r * 0.96, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 3. Manga Ink "K.O.!" Comic Stamp
  // Elastic punch-in scale on first 6 frames
  let scale = 1.0;
  if (_frame < 6) {
    const punch = _frame / 6;
    scale = 1.55 - 0.55 * Math.sin(punch * Math.PI * 0.5);
  }

  ctx.translate(_impactX, _impactY - 10);
  ctx.rotate(-0.08); // -4.6 degree dynamic action tilt
  ctx.scale(scale, scale);

  const stampAlpha = Math.min(1.0, _frame / 3) * Math.max(0, 1.0 - Math.pow(Math.max(0, p - 0.7) / 0.3, 2));

  if (stampAlpha > 0.01) {
    ctx.globalAlpha = stampAlpha;
    ctx.font = '900 56px "Outfit", "Glast Blitch", "Rajdhani", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Thick black manga ink outline (#0E0F14 per Rule 24)
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 3;
    ctx.strokeText('K.O.!', 0, 0);

    // Secondary ink stroke for ultra-bold pop
    ctx.strokeStyle = '#1a0505';
    ctx.lineWidth = 6;
    ctx.strokeText('K.O.!', 0, 0);

    // Fiery crimson fill
    ctx.fillStyle = '#FF1A4B';
    ctx.fillText('K.O.!', 0, 0);

    // Inner bright yellow-white core highlight
    ctx.fillStyle = '#FFF5B8';
    ctx.font = '900 52px "Outfit", "Glast Blitch", "Rajdhani", Impact, sans-serif';
    ctx.fillText('K.O.!', 0, -2);
  }

  ctx.restore();
}

/**
 * Resets the cinematic K.O. state
 */
export function resetCinematicKo() {
  _active = false;
  _frame = 0;
  state.timeDilation = 1.0;
  state.isCinematicKo = false;
  if (state.camera) {
    state.camera.cinematicOverride = false;
  }
}

