// ─────────────────────────────────────────────────────────────────────────────
// TOJI SPLIT SOUL KATANA HIT IMPACT EFFECT — Spatial Soul Cleave System
// High-performance, zero-allocation particle pipeline for Split Soul Katana impacts.
// ─────────────────────────────────────────────────────────────────────────────

import { state } from '../../core/state.js';

const MAX_TOJI_PARTICLES = 100;
const _pool = [];
const _activeEffects = [];

// Initialize zero-GC particle pool
for (let i = 0; i < MAX_TOJI_PARTICLES; i++) {
  _pool.push({
    type: 'slice', // 'slice', 'ring', 'needle', 'smoke'
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    length: 0,
    thickness: 0,
    size: 0,
    maxSize: 0,
    life: 0,
    maxLife: 0,
    primaryColor: '#FF1E56',
    accentColor: '#FFFFFF',
    voidColor: '#0E0F14',
    auraColor: '#9B1FE8',
    alpha: 1.0,
    scale: 1.0,
    curve: 0
  });
}

function _getParticle() {
  return _pool.length > 0 ? _pool.pop() : {
    type: 'slice', x: 0, y: 0, vx: 0, vy: 0, angle: 0,
    length: 0, thickness: 0, size: 0, maxSize: 0,
    life: 0, maxLife: 0,
    primaryColor: '#FF1E56', accentColor: '#FFFFFF', voidColor: '#0E0F14', auraColor: '#9B1FE8',
    alpha: 1.0, scale: 1.0, curve: 0
  };
}

function _returnParticle(p) {
  _pool.push(p);
}

/**
 * Spawns an authentic anime Split Soul Katana spatial cleave hit effect on a target.
 * @param {number} x Target hit X
 * @param {number} y Target hit Y
 * @param {number} hitAngle Angle of the downward Katana chop
 */
export function spawnTojiCleaveHitEffect(x, y, hitAngle = 0) {
  // Spatial soul cleave visual effect disabled
  return;
}

/**
 * Updates all active Toji Split Soul Cleave particles.
 */
export function updateTojiImpactEffects() {
  for (let i = _activeEffects.length - 1; i >= 0; i--) {
    const p = _activeEffects[i];
    p.life++;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.93;
    p.vy *= 0.93;

    const progress = p.life / p.maxLife;
    if (p.type === 'slice') {
      // Hold full alpha during first 60% of lifespan, then smooth fade
      if (progress < 0.60) {
        p.alpha = 1.0;
      } else {
        p.alpha = Math.max(0, (1.0 - progress) / 0.40);
      }
    } else {
      p.alpha = Math.max(0, 1.0 - progress);
    }

    if (p.type === 'ring') {
      p.size += (p.maxSize - p.size) * 0.14;
    } else if (p.type === 'smoke') {
      p.size += (p.maxSize - p.size) * 0.06;
    }

    if (p.life >= p.maxLife) {
      _returnParticle(p);
      _activeEffects[i] = _activeEffects[_activeEffects.length - 1];
      _activeEffects.pop();
    }
  }
}

/**
 * Renders all active Toji Split Soul Cleave hit particles on Canvas 2D.
 * @param {CanvasRenderingContext2D} ctx Main game canvas context
 */
export function drawTojiImpactEffects(ctx) {
  if (!ctx || _activeEffects.length === 0) return;

  const P = 2.0;
  const snap = (v) => Math.round(v / P) * P;

  for (let i = 0; i < _activeEffects.length; i++) {
    const p = _activeEffects[i];
    if (p.alpha <= 0.01) continue;

    ctx.save();

    if (p.type === 'slice') {
      // 1. SPATIAL CLEAVE SCAR (True 2D Grid Scan Pixel Art Crescent Slice)
      ctx.translate(snap(p.x), snap(p.y));
      ctx.rotate(p.angle);

      const progress = p.life / p.maxLife;
      let thickFactor;
      if (progress < 0.12) {
        thickFactor = progress / 0.12;
      } else if (progress < 0.65) {
        thickFactor = 1.0 + Math.sin(p.life * 0.35) * 0.08; // Organic glowing pulse
      } else {
        thickFactor = Math.pow((1.0 - progress) / 0.35, 1.2);
      }

      const halfLen = p.length * 0.5;
      const maxThick = p.thickness * thickFactor;
      const span = p.length;
      const outlineCol = p.voidColor;

      const isInsideSlice = (rx, ry) => {
        if (rx < -halfLen || rx > halfLen) return false;
        const norm = (rx + halfLen) / span; // 0 to 1
        const taper = Math.sin(norm * Math.PI);
        const curveOffset = Math.sin(norm * Math.PI) * p.curve * p.length * 0.2;
        const curThick = maxThick * taper;
        const topY = curveOffset - curThick * 0.5;
        const botY = curveOffset + curThick * 0.5;
        return ry >= topY && ry <= botY;
      };

      const minX = Math.floor((-halfLen - P * 2) / P) * P;
      const maxX = Math.ceil((halfLen + P * 2) / P) * P;
      const minY = Math.floor((-maxThick - P * 2) / P) * P;
      const maxY = Math.ceil((maxThick + P * 2) / P) * P;

      _drawCachedTojiSlice(ctx, p, halfLen, maxThick, span, minX, maxX, minY, maxY, P, snap, isInsideSlice);
    } else if (p.type === 'ring') {
      // 2. EXPANDING SPATIAL CLEAVE SHOCKWAVE ARC
      ctx.translate(snap(p.x), snap(p.y));
      ctx.rotate(p.angle);

      const r = p.size;
      const th = p.thickness * p.alpha;
      const arc = Math.PI * 0.95;

      // Outer Cursed Violet Arc
      ctx.beginPath();
      ctx.arc(0, 0, r, -arc / 2, arc / 2);
      ctx.strokeStyle = p.auraColor;
      ctx.lineWidth = th * 1.5;
      ctx.globalAlpha = p.alpha * 0.55;
      ctx.stroke();

      // Middle Crimson Blade Wave Arc
      ctx.beginPath();
      ctx.arc(0, 0, r, -arc / 2, arc / 2);
      ctx.strokeStyle = p.primaryColor;
      ctx.lineWidth = th;
      ctx.globalAlpha = p.alpha * 0.90;
      ctx.stroke();

      // Inner White Core Arc
      ctx.beginPath();
      ctx.arc(0, 0, r - 2, -arc / 2.2, arc / 2.2);
      ctx.strokeStyle = p.accentColor;
      ctx.lineWidth = Math.max(1.2, th * 0.45);
      ctx.globalAlpha = p.alpha * 0.98;
      ctx.stroke();
    } else if (p.type === 'needle') {
      // 3. NEEDLE POLYGONS (Rule 16 standard: 4-point filled double-tapered needles)
      ctx.translate(snap(p.x), snap(p.y));
      ctx.rotate(p.angle);

      const halfLen = p.length * 0.5;
      const maxThick = p.thickness * p.alpha;
      const midOff = halfLen * 0.15;

      ctx.fillStyle = p.primaryColor;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.moveTo(-halfLen, 0);                 // sharp trailing tip
      ctx.lineTo(midOff, -maxThick * 0.5);      // top edge
      ctx.lineTo(halfLen, 0);                  // sharp leading tip
      ctx.lineTo(midOff, maxThick * 0.5);       // bottom edge
      ctx.closePath();
      ctx.fill();

      // White-hot needle spine
      ctx.fillStyle = p.accentColor;
      ctx.globalAlpha = p.alpha * 0.9;
      ctx.fillRect(-halfLen * 0.4, -0.6, halfLen * 0.9, 1.2);
    } else if (p.type === 'smoke') {
      // 4. SOUL DISPERSION VAPOR
      ctx.translate(snap(p.x), snap(p.y));
      ctx.fillStyle = p.auraColor;
      ctx.globalAlpha = p.alpha * 0.35;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = p.primaryColor;
      ctx.globalAlpha = p.alpha * 0.20;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

const _tojiSliceSpriteCache = new Map();
function _drawCachedTojiSlice(ctx, p, halfLen, maxThick, span, minX, maxX, minY, maxY, P, snap, isInsideSlice) {
  const qLen = Math.round(p.length / 4) * 4;
  const qThick = Math.round(maxThick);
  const qCurve = Math.round((p.curve || 0) * 4) / 4;
  const key = `${qLen}_${qThick}_${qCurve}_${p.primaryColor}`;
  let entry = _tojiSliceSpriteCache.get(key);
  if (!entry && typeof document !== 'undefined') {
    const w = Math.max(8, Math.ceil((maxX - minX + P * 4)));
    const h = Math.max(8, Math.ceil((maxY - minY + P * 4)));
    const hw = w / 2;
    const hh = h / 2;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const bCtx = c.getContext('2d');
    if (bCtx) {
      bCtx.save();
      bCtx.imageSmoothingEnabled = false;
      bCtx.translate(hw, hh);
      for (let y = minY; y <= maxY; y += P) {
        for (let x = minX; x <= maxX; x += P) {
          if (!isInsideSlice(x, y)) continue;
          const pxX = snap(x), pyY = snap(y);
          const isBorder = !isInsideSlice(x + P, y) || !isInsideSlice(x - P, y) || !isInsideSlice(x, y + P) || !isInsideSlice(x, y - P);
          if (isBorder) {
            bCtx.fillStyle = p.voidColor;
            bCtx.fillRect(pxX, pyY, P, P);
            continue;
          }
          const norm = (x + halfLen) / span;
          const curveOffset = Math.sin(norm * Math.PI) * p.curve * p.length * 0.2;
          const distFromCore = Math.abs(y - curveOffset);
          const taper = Math.sin(norm * Math.PI);
          const curHalfThick = (maxThick * taper) * 0.5;
          const relDist = distFromCore / Math.max(0.001, curHalfThick);
          bCtx.fillStyle = relDist < 0.25 ? p.accentColor : (relDist < 0.60 ? p.primaryColor : p.auraColor);
          bCtx.fillRect(pxX, pyY, P, P);
        }
      }
      bCtx.restore();
      entry = { canvas: c, hw, hh };
      if (_tojiSliceSpriteCache.size > 48) _tojiSliceSpriteCache.delete(_tojiSliceSpriteCache.keys().next().value);
      _tojiSliceSpriteCache.set(key, entry);
    }
  }
  if (entry) {
    ctx.globalAlpha = p.alpha;
    ctx.drawImage(entry.canvas, -entry.hw, -entry.hh);
  }
}
