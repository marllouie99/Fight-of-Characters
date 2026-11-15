// ─────────────────────────────────────────────
// CHOSO BLOOD MANIPULATION & LASER GRAPHICS
// Renders 16-bit pixel-art VFX sprites for all Choso combat skills:
// - Piercing Blood (Assets/model/choso/PiercingBlood.png)
// - Convergence Matrix & Sanguine Darts (Assets/model/choso/ConvergenceBeam.png)
// - Slicing Exorcist Blood Chakram (Assets/model/choso/BloodChakram.png)
// - Supernova Compressed Orbs & Bursts (SupernovaOrb.png & SupernovaBurst.png)
// - Blood Edge Crescent Melee Slash (Assets/model/choso/BloodEdgeSlash.png)
// Strictly adheres to:
// - Rule 11: Prohibition of shadowBlur / shadowColor
// - Rule 26: Concentric Shockwaves (No Spoke Meshes / Anti-Cobweb)
// - Rule 31: Generous Transparent Bounds & Crisp Pixel Rendering
// - Rule 35: Cached Sprite Assets & 0 Canvas Stack Depth
import { state } from '../../core/state.js';
import { CONFIG } from '../../core/config.js';

const CHOSO_SKILL_META = {
  piercingBlood: {
    width: 296,
    height: 102,
    padLeft: 18,
    tightWidth: 260,
    tightHeight: 66,
    fallbackPath: 'Assets/model/choso/PiercingBlood.png',
  },
  piercingBloodFrame: {
    width: 256,
    height: 256,
    padLeft: 16,
    tightWidth: 224,
    tightHeight: 88,
    tipX: 240,
    skirtX: 96,
  },
  bloodChakram: {
    width: 130,
    height: 130,
    tightMax: 96,
    fallbackPath: 'Assets/model/choso/BloodChakram.png',
  },
  supernovaOrb: {
    width: 104,
    height: 104,
    tightMax: 72,
    fallbackPath: 'Assets/model/choso/SupernovaOrb.png',
  },
  supernovaBurst: {
    width: 162,
    height: 162,
    tightMax: 128,
    fallbackPath: 'Assets/model/choso/SupernovaBurst.png',
  },
  convergenceBeam: {
    width: 248,
    height: 58,
    padLeft: 16,
    tightWidth: 216,
    tightHeight: 26,
    fallbackPath: 'Assets/model/choso/ConvergenceBeam.png',
  },
  bloodEdgeSlash: {
    width: 109,
    height: 144,
    tightWidth: 77,
    tightHeight: 112,
    fallbackPath: 'Assets/model/choso/BloodEdgeSlash.png',
  },
  bloodSplashFrame: {
    width: 256,
    height: 256,
    tightWidth: 208,
    tightHeight: 214,
  },
};

const _chosoSkillSprites = {};

/**
 * Lazily initializes and caches any 16-bit Choso skill sprite by key.
 */
export function getChosoSkillSprite(key) {
  const meta = CHOSO_SKILL_META[key];
  if (!meta) return null;
  if (!_chosoSkillSprites[key] && typeof Image !== 'undefined') {
    const img = new Image();
    img.src = CONFIG?.choso?.assets?.[key] || meta.fallbackPath;
    _chosoSkillSprites[key] = img;
  }
  return _chosoSkillSprites[key] || null;
}

export function _getPiercingBloodSprite() {
  return getChosoSkillSprite('piercingBlood');
}

const CHOSO_PIERCING_BLOOD_FRAME_COUNT = 12;
const CHOSO_PIERCING_BLOOD_FRAME_PATHS = Array.from(
  { length: CHOSO_PIERCING_BLOOD_FRAME_COUNT },
  (_, i) => `Assets/model/choso/PiercingBlood/PiercingBlood-${i + 1}.png`
);

let _chosoPiercingBloodFrames = [];
let _chosoPiercingBloodFramesLoading = false;

/**
 * Eagerly loads and caches the 12-frame 16-bit Piercing Blood sprite sequence.
 */
export function _getPiercingBloodFrames() {
  if (
    _chosoPiercingBloodFrames.length === CHOSO_PIERCING_BLOOD_FRAME_COUNT &&
    _chosoPiercingBloodFrames.every(img => img && img.complete && img.naturalWidth > 0)
  ) {
    return _chosoPiercingBloodFrames;
  }
  if (!_chosoPiercingBloodFramesLoading && typeof Image !== 'undefined') {
    _chosoPiercingBloodFramesLoading = true;
    _chosoPiercingBloodFrames = [];
    CHOSO_PIERCING_BLOOD_FRAME_PATHS.forEach((src, idx) => {
      const img = new Image();
      img.onload = () => {
        _chosoPiercingBloodFrames[idx] = img;
      };
      img.src = src;
      _chosoPiercingBloodFrames[idx] = img;
    });
  }
  return _chosoPiercingBloodFrames;
}

const CHOSO_BLOOD_SPLASH_FRAME_COUNT = 12;
const CHOSO_BLOOD_SPLASH_FRAME_PATHS = Array.from(
  { length: CHOSO_BLOOD_SPLASH_FRAME_COUNT },
  (_, i) => `Assets/model/choso/BloodSplash/BloodSplash-${i + 1}.png`
);

let _chosoBloodSplashFrames = [];
let _chosoBloodSplashFramesLoading = false;

/**
 * Eagerly loads and caches the 12-frame 16-bit Blood Splash sprite sequence.
 */
export function _getChosoBloodSplashFrames() {
  if (
    _chosoBloodSplashFrames.length === CHOSO_BLOOD_SPLASH_FRAME_COUNT &&
    _chosoBloodSplashFrames.every(img => img && img.complete && img.naturalWidth > 0)
  ) {
    return _chosoBloodSplashFrames;
  }
  if (!_chosoBloodSplashFramesLoading && typeof Image !== 'undefined') {
    _chosoBloodSplashFramesLoading = true;
    _chosoBloodSplashFrames = [];
    CHOSO_BLOOD_SPLASH_FRAME_PATHS.forEach((src, idx) => {
      const img = new Image();
      img.onload = () => {
        _chosoBloodSplashFrames[idx] = img;
      };
      img.src = src;
      _chosoBloodSplashFrames[idx] = img;
    });
  }
  return _chosoBloodSplashFrames;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  for (const key of Object.keys(CHOSO_SKILL_META)) {
    if (CHOSO_SKILL_META[key].fallbackPath) {
      getChosoSkillSprite(key);
    }
  }
  _getPiercingBloodFrames();
  _getChosoBloodSplashFrames();
}

function _isLoadedSprite(img) {
  return Boolean(img && img.complete && img.naturalWidth > 0);
}

/**
 * Calculates the maximum travel distance along a ray from (startX, startY) at angle
 * before impacting the arena perimeter walls.
 *
 * @param {number} startX
 * @param {number} startY
 * @param {number} angle
 * @param {Object} arena
 * @param {number} [innerMargin=6]
 * @returns {number} Distance to arena wall boundary (clamped to >= 0)
 */
export function getRayArenaIntersection(startX, startY, angle, arena, innerMargin = 6) {
  if (!arena) return 500;

  const wallW = arena.wallWidth || 4;
  const margin = wallW + innerMargin;

  if (arena.shape === 'circle' || arena.radius) {
    const cx = arena.x + arena.width / 2;
    const cy = arena.y + arena.height / 2;
    const r = Math.max(10, (arena.radius || arena.width / 2) - margin);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const dx = startX - cx;
    const dy = startY - cy;
    const b = 2 * (dx * cosA + dy * sinA);
    const c = dx * dx + dy * dy - r * r;
    const disc = b * b - 4 * c;
    if (disc < 0) return 0;
    const t = (-b + Math.sqrt(disc)) / 2;
    return Math.max(0, t);
  }

  const minX = arena.x + margin;
  const maxX = arena.x + arena.width - margin;
  const minY = arena.y + margin;
  const maxY = arena.y + arena.height - margin;

  const clampedX = Math.max(minX, Math.min(maxX, startX));
  const clampedY = Math.max(minY, Math.min(maxY, startY));

  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  let maxDist = Infinity;

  if (cosA > 0.0001) {
    const d = (maxX - clampedX) / cosA;
    if (d >= 0 && d < maxDist) maxDist = d;
  } else if (cosA < -0.0001) {
    const d = (minX - clampedX) / cosA;
    if (d >= 0 && d < maxDist) maxDist = d;
  }

  if (sinA > 0.0001) {
    const d = (maxY - clampedY) / sinA;
    if (d >= 0 && d < maxDist) maxDist = d;
  } else if (sinA < -0.0001) {
    const d = (minY - clampedY) / sinA;
    if (d >= 0 && d < maxDist) maxDist = d;
  }

  return Math.max(0, maxDist === Infinity ? 400 : maxDist);
}

/**
 * Interactive Blood Droplet Nodes render via the default bloodEffect.js system.
 */
export function drawBloodDropletNode(ctx, droplet) {
  // Intentionally empty: rendered via state.bloodEffects / bloodEffect.js
}

/**
 * Draws razor-thin targeting needle lines connecting blood nodes to target.
 */
export function drawLaserTelegraphLine(ctx, sourceX, sourceY, targetX, targetY, alpha = 0.6) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);
  ctx.strokeStyle = '#FF2A55';
  ctx.lineWidth = 1.0;
  ctx.setLineDash([6, 3]);

  ctx.beginPath();
  ctx.moveTo(sourceX, sourceY);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws the locked-in trajectory beam ray and diode ignition flash before Convergence fires.
 */
export function drawLaserLockInLine(ctx, sourceX, sourceY, endX, endY, lockProgress = 0) {
  const p = Math.max(0, Math.min(1, lockProgress));
  ctx.save();

  // 1. Solid outer crimson lock-in beam lane
  ctx.globalAlpha = 0.35 + 0.50 * p;
  ctx.strokeStyle = '#FF2A55';
  ctx.lineWidth = 3.4 - 1.6 * p;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(sourceX, sourceY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // 2. Crisp white-hot razor core tightening into firing alignment
  ctx.globalAlpha = 0.55 + 0.45 * p;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 0.9 + 0.6 * p;
  ctx.beginPath();
  ctx.moveTo(sourceX, sourceY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // 3. Diode node lock ring around origin blood particle
  const ringR = 4.5 + (1 - p) * 5.0;
  ctx.globalAlpha = 0.70 + 0.30 * p;
  ctx.strokeStyle = p > 0.65 ? '#FFFFFF' : '#FF2A55';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(sourceX, sourceY, ringR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws the snapping Convergence Lock-In diamond reticle at the committed target coordinates.
 */
export function drawLaserLockInReticle(ctx, lockX, lockY, lockProgress = 0) {
  const p = Math.max(0, Math.min(1, lockProgress));
  const radius = 26 * (1 - p * 0.52);
  const rotation = (1 - p) * (Math.PI * 0.25);

  ctx.save();
  ctx.translate(lockX, lockY);
  ctx.rotate(rotation);

  // Inner crimson wash
  ctx.globalAlpha = 0.14 + 0.16 * p;
  ctx.fillStyle = '#FF2A55';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Diamond lock frame
  ctx.globalAlpha = 0.72 + 0.28 * p;
  ctx.strokeStyle = '#FF2A55';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(0, -radius);
  ctx.lineTo(radius, 0);
  ctx.lineTo(0, radius);
  ctx.lineTo(-radius, 0);
  ctx.closePath();
  ctx.stroke();

  // Inner crisp white crosshairs
  const tickIn = Math.max(3, radius * 0.35);
  const tickOut = radius * 1.18;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-tickOut, 0); ctx.lineTo(-tickIn, 0);
  ctx.moveTo(tickIn, 0);  ctx.lineTo(tickOut, 0);
  ctx.moveTo(0, -tickOut); ctx.lineTo(0, -tickIn);
  ctx.moveTo(0, tickIn);   ctx.lineTo(0, tickOut);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a Convergence laser beam or Sanguine Blood Dart using 16-bit pixel-art sprite
 * with crisp vector fallback when running headless.
 */
export function drawBloodLaserBeam(ctx, startX, startY, endX, endY, thickness = 4.5, alpha = 1.0) {
  if (alpha <= 0.01) return;
  const dx = endX - startX;
  const dy = endY - startY;
  const beamLen = Math.hypot(dx, dy);
  if (beamLen < 2) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);

  const sprite = getChosoSkillSprite('convergenceBeam');
  if (_isLoadedSprite(sprite)) {
    const meta = CHOSO_SKILL_META.convergenceBeam;
    const angle = Math.atan2(dy, dx);
    const scaleX = beamLen / meta.tightWidth;
    const drawW = meta.width * scaleX;
    const offsetX = -(meta.padLeft * scaleX);
    const tightH = Math.max(12, thickness * 4.2);
    const drawH = tightH * (meta.height / meta.tightHeight);

    ctx.translate(startX, startY);
    ctx.rotate(angle);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, offsetX, -drawH / 2, drawW, drawH);
    ctx.restore();
    return;
  }

  const angle = Math.atan2(dy, dx);
  const perpX = -Math.sin(angle);
  const perpY = Math.cos(angle);

  ctx.beginPath();
  ctx.moveTo(startX - perpX * (thickness * 2.2), startY - perpY * (thickness * 2.2));
  ctx.lineTo(endX - perpX * (thickness * 2.2), endY - perpY * (thickness * 2.2));
  ctx.lineTo(endX + perpX * (thickness * 2.2), endY + perpY * (thickness * 2.2));
  ctx.lineTo(startX + perpX * (thickness * 2.2), startY + perpY * (thickness * 2.2));
  ctx.closePath();
  ctx.fillStyle = 'rgba(163, 29, 29, 0.35)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(startX - perpX * (thickness * 1.2), startY - perpY * (thickness * 1.2));
  ctx.lineTo(endX - perpX * (thickness * 1.2), endY - perpY * (thickness * 1.2));
  ctx.lineTo(endX + perpX * (thickness * 1.2), endY + perpY * (thickness * 1.2));
  ctx.lineTo(startX + perpX * (thickness * 1.2), startY + perpY * (thickness * 1.2));
  ctx.closePath();
  ctx.fillStyle = '#FF2A55';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(startX - perpX * (thickness * 0.45), startY - perpY * (thickness * 0.45));
  ctx.lineTo(endX - perpX * (thickness * 0.45), endY - perpY * (thickness * 0.45));
  ctx.lineTo(endX + perpX * (thickness * 0.45), endY + perpY * (thickness * 0.45));
  ctx.lineTo(startX + perpX * (thickness * 0.45), startY + perpY * (thickness * 0.45));
  ctx.closePath();
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.restore();
}

/**
 * Draws the spinning Slicing Exorcist (Karisō) Blood Chakram disc.
 */
export function drawBloodChakram(ctx, chakram) {
  if (!chakram || chakram.isDead) return;

  const x = chakram.x;
  const y = chakram.y;
  const r = chakram.r || 16;
  const rot = chakram.rotation || 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);

  const sprite = getChosoSkillSprite('bloodChakram');
  if (_isLoadedSprite(sprite)) {
    const meta = CHOSO_SKILL_META.bloodChakram;
    const tightDiam = r * 2.55;
    const drawSize = tightDiam * (meta.width / meta.tightMax);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 42, 85, 0.35)';
  ctx.fill();

  const teeth = 4;
  ctx.fillStyle = '#A31D1D';
  for (let i = 0; i < teeth; i++) {
    const angle = (i * Math.PI * 2) / teeth;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(r * 0.4, 0);
    ctx.quadraticCurveTo(r * 0.9, -r * 0.3, r * 1.3, 0);
    ctx.lineTo(r * 0.7, r * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = '#6B111E';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.restore();
}

/**
 * Draws Supernova compressed orbiting orbs, starburst detonations, and flying blood shrapnel.
 */
export function drawSupernovaVisuals(ctx, fighter) {
  if (!fighter) return;

  // 1. Orbiting Compressed Blood Spheres before detonation
  if (fighter.isChargingSupernova && fighter.supernovaOrbs && fighter.supernovaOrbs.length > 0) {
    _drawSupernovaOrbs(ctx, fighter);
  }

  // 2. Active Detonation Starburst Sprites at source coordinates
  if (fighter.supernovaBursts && fighter.supernovaBursts.length > 0) {
    _drawSupernovaBursts(ctx, fighter.supernovaBursts);
  }

  // 3. Outbound 360° Supernova Blood Shrapnel Pellets
  if (fighter.supernovaPellets && fighter.supernovaPellets.length > 0) {
    _drawSupernovaPellets(ctx, fighter.supernovaPellets);
  }
}

function _drawSupernovaOrbs(ctx, fighter) {
  const orbSprite = getChosoSkillSprite('supernovaOrb');
  const useSprite = _isLoadedSprite(orbSprite);
  const orbSize = 18 * (CHOSO_SKILL_META.supernovaOrb.width / CHOSO_SKILL_META.supernovaOrb.tightMax);

  ctx.save();
  for (let i = 0; i < fighter.supernovaOrbs.length; i++) {
    const orb = fighter.supernovaOrbs[i];
    const centerX = (orb.source && typeof orb.source.x === 'number') ? orb.source.x : fighter.x;
    const centerY = (orb.source && typeof orb.source.y === 'number') ? orb.source.y : (fighter.y - (fighter.z || 0));
    const ox = centerX + Math.cos(orb.angle) * orb.dist;
    const oy = centerY + Math.sin(orb.angle) * orb.dist;

    if (useSprite) {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(orb.angle * 1.5);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(orbSprite, -orbSize / 2, -orbSize / 2, orbSize, orbSize);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(ox, oy, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#A31D1D';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ox, oy, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#FF2A55';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ox - 1.2, oy - 1.2, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }
  }
  ctx.restore();
}

function _drawSupernovaBursts(ctx, bursts) {
  const burstSprite = getChosoSkillSprite('supernovaBurst');
  const useSprite = _isLoadedSprite(burstSprite);
  const meta = CHOSO_SKILL_META.supernovaBurst;

  ctx.save();
  for (let i = 0; i < bursts.length; i++) {
    const b = bursts[i];
    const ratio = Math.max(0, Math.min(1, b.timer / (b.maxTimer || 18)));
    const expand = 1.0 - ratio;
    const alpha = Math.min(1.0, ratio * 1.65);

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rotation || 0);
    ctx.globalAlpha = alpha;

    if (useSprite) {
      const tightSize = 54 + 62 * Math.pow(expand, 0.45);
      const drawSize = tightSize * (meta.width / meta.tightMax);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(burstSprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 14 + 40 * expand, 0, Math.PI * 2);
      ctx.strokeStyle = '#FF2A55';
      ctx.lineWidth = Math.max(1.2, 3.0 * ratio);
      ctx.stroke();
    }

    ctx.restore();
  }
  ctx.restore();
}

function _drawSupernovaPellets(ctx, pellets) {
  const needleSprite = getChosoSkillSprite('convergenceBeam');
  const useSprite = _isLoadedSprite(needleSprite);
  const meta = CHOSO_SKILL_META.convergenceBeam;

  ctx.save();
  for (let i = 0; i < pellets.length; i++) {
    const p = pellets[i];
    const angle = Math.atan2(p.vy, p.vx);
    const alpha = Math.min(1, (p.lifespan || 16) / 6);

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;

    if (useSprite) {
      const drawW = 24 * (meta.width / meta.tightWidth);
      const drawH = 8 * (meta.height / meta.tightHeight);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(needleSprite, -drawW * 0.65, -drawH / 2, drawW, drawH);
    } else {
      ctx.fillStyle = '#FF2A55';
      ctx.fillRect(-6, -2, 12, 4);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-2, -1, 7, 2);
    }

    ctx.restore();
  }
  ctx.restore();
}

/**
 * Draws the colossal Mach 3 Piercing Blood death beam.
 * Starts directly from the source blood particle in mid-air/on-ground.
 */
/**
 * Checks if a candidate entity is a valid living enemy for Piercing Blood ray termination.
 */
function _isPiercingBloodEnemy(fighter, ent) {
  if (!ent || ent === fighter || ent.owner === fighter || ent.hp <= 0 || ent.isDead || ent.isUntargetable) return false;
  if (typeof fighter.isTeammate === 'function') return !fighter.isTeammate(ent);
  if (fighter.team !== undefined && ent.team !== undefined) return fighter.team !== ent.team;
  return true;
}

/**
 * Resolves exact world-space spear distance and impact target/wall along the ray
 * so the conical splash crown and 12-frame impact blood splash trigger on hitting anything.
 */
export function resolvePiercingBloodStrikePoint(fighter, startX, startY, angle, maxLen, r) {
  let bestLen = maxLen;
  let hitTarget = null;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  if (typeof state !== 'undefined') {
    const groups = [state.fighters, state.illusions, state.deployables, state.plants, state.buildings];
    const checkEntity = (ent) => {
      if (!_isPiercingBloodEnemy(fighter, ent)) return;
      const ey = ent.y - (ent.z || 0);
      const dx = ent.x - startX;
      const dy = ey - startY;
      const proj = dx * cosA + dy * sinA;
      if (proj <= 0 || proj >= bestLen) return;
      const perpDist = Math.abs(-dx * sinA + dy * cosA);
      const er = ent.r || ent.radius || 25;
      if (perpDist <= er + 14) {
        bestLen = Math.min(bestLen, proj + er * 0.45);
        hitTarget = ent;
      }
    };

    for (let g = 0; g < groups.length; g++) {
      const list = groups[g];
      if (!Array.isArray(list)) continue;
      for (let i = 0; i < list.length; i++) {
        const ent = list[i];
        checkEntity(ent);
        if (ent && g === 0) {
          const isFriendlyOwner = ent === fighter || (typeof fighter.isTeammate === 'function' && fighter.isTeammate(ent));
          if (!isFriendlyOwner) {
            if (ent.turretEntity) checkEntity(ent.turretEntity);
            if (ent.dispenserEntity) checkEntity(ent.dispenserEntity);
            const subLists = [ent.activeMinions, ent.activeWallnuts, ent.activePeashooters, ent.activeSnowPeas, ent.activeTorchwoods, ent.activePotatoMines];
            for (let s = 0; s < subLists.length; s++) {
              if (Array.isArray(subLists[s])) {
                for (let k = 0; k < subLists[s].length; k++) checkEntity(subLists[s][k]);
              }
            }
          }
        }
      }
    }
  }

  const pierceLen = Math.max(Math.min(maxLen, r * 1.6), bestLen);
  return {
    pierceLen,
    hitWall: !hitTarget,
    hitTarget,
    hitX: startX + cosA * pierceLen,
    hitY: startY + sinA * pierceLen,
  };
}

function _resolvePiercingBloodStrikeLength(fighter, startX, startY, angle, maxLen, r) {
  return resolvePiercingBloodStrikePoint(fighter, startX, startY, angle, maxLen, r).pierceLen;
}

/**
 * Draws the Piercing Blood attack using the 1:1 12-frame Conical Blood Spearhead sprite
 * paired with a razor-thin compressed arterial blood shaft extending from Choso's clasped hands.
 */
export function drawPiercingBloodBeam(ctx, fighter) {
  if (!fighter) return;

  const r = fighter.r || 25;
  const startX = (fighter.piercingBloodSource && typeof fighter.piercingBloodSource.x === 'number')
    ? fighter.piercingBloodSource.x
    : fighter.x;
  const startY = (fighter.piercingBloodSource && typeof fighter.piercingBloodSource.y === 'number')
    ? fighter.piercingBloodSource.y
    : (fighter.y - (fighter.z || 0));

  if (fighter.isChargingPiercingBlood) {
    _drawPiercingBloodCharge(ctx, startX, startY, fighter);
    return;
  }

  if (!fighter.isFiringPiercingBlood) return;

  const angle = fighter.piercingBloodAngle !== undefined ? fighter.piercingBloodAngle : (fighter.gunAngle || 0);
  const arena = (typeof state !== 'undefined' && state.arena) || (typeof CONFIG !== 'undefined' && CONFIG.arena);
  const maxBeamLength = arena ? getRayArenaIntersection(startX, startY, angle, arena, 6) : 1200;
  const beamLength = Math.min(1200, maxBeamLength);
  const pierceLen = _resolvePiercingBloodStrikeLength(fighter, startX, startY, angle, beamLength, r);
  const beamWidth = fighter.piercingBloodWidth || 26;
  const progress = Math.max(0, Math.min(1, fighter.piercingBloodProgress ?? 1.0));
  const beamMax = fighter.piercingBloodBeamMax || 96;
  const elapsedFrames = Math.max(0, beamMax - (fighter.piercingBloodTimer || 0));
  const frames = _getPiercingBloodFrames();
  const frameIndex = Math.floor(elapsedFrames / 2) % CHOSO_PIERCING_BLOOD_FRAME_COUNT;
  const animFrame = frames[frameIndex];
  const staticSprite = _getPiercingBloodSprite();

  ctx.save();

  if (_isLoadedSprite(animFrame)) {
    _drawPiercingBloodSprite(ctx, animFrame, CHOSO_SKILL_META.piercingBloodFrame, startX, startY, angle, pierceLen, beamWidth, progress, r, true, elapsedFrames);
  } else if (_isLoadedSprite(staticSprite)) {
    _drawPiercingBloodSprite(ctx, staticSprite, CHOSO_SKILL_META.piercingBlood, startX, startY, angle, beamLength, beamWidth, progress, r, false, elapsedFrames);
  } else {
    const endX = startX + Math.cos(angle) * pierceLen;
    const endY = startY + Math.sin(angle) * pierceLen;
    _drawVectorPiercingBloodFallback(ctx, startX, startY, endX, endY, angle, beamWidth, progress, r);
  }

  ctx.restore();
}

function _drawPiercingBloodCharge(ctx, startX, startY, fighter) {
  const chargeMax = fighter.piercingBloodChargeMax || 30;
  const progress = Math.max(0, Math.min(1, 1.0 - ((fighter.piercingBloodTimer || 0) / chargeMax)));
  const orbSprite = getChosoSkillSprite('supernovaOrb');

  ctx.save();

  ctx.beginPath();
  ctx.arc(startX, startY, Math.max(3, 18 * (1 - progress)), 0, Math.PI * 2);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  if (_isLoadedSprite(orbSprite)) {
    const meta = CHOSO_SKILL_META.supernovaOrb;
    const tightDiam = 8 + 14 * progress;
    const drawSize = tightDiam * (meta.width / meta.tightMax);
    ctx.translate(startX, startY);
    ctx.rotate(progress * Math.PI * 2.5);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(orbSprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
  } else {
    ctx.beginPath();
    ctx.arc(startX, startY, Math.max(2.5, 6 * progress), 0, Math.PI * 2);
    ctx.fillStyle = '#FF2A55';
    ctx.fill();
  }

  ctx.restore();
}

function _drawCompressedBloodShaft(ctx, length, uniformScale, sustainFade, elapsedFrames) {
  if (length <= 2) return;
  const halfOuter = Math.max(1.8, 4.0 * uniformScale);
  const halfInner = Math.max(1.0, 2.5 * uniformScale);

  // Dark arterial outline matching PiercingBlood-1..12 shaft
  ctx.fillStyle = '#220207';
  ctx.fillRect(0, -halfOuter, length, halfOuter * 2);

  // Pressurized crimson jet core
  ctx.fillStyle = '#8E0A18';
  ctx.fillRect(0, -halfInner, length, halfInner * 2);

  // Lit upper fluid plane
  ctx.fillStyle = '#B21022';
  ctx.fillRect(0, -halfInner, length, Math.max(1.0, halfInner * 0.85));

  // Rapid animated supersonic fluid shear streaks along shaft
  ctx.fillStyle = `rgba(212, 34, 54, ${(0.85 * sustainFade).toFixed(3)})`;
  const streakLen = Math.max(10, 22 * uniformScale);
  const stride = Math.max(24, 44 * uniformScale);
  const phase = (elapsedFrames * 18) % stride;
  for (let sx = phase; sx < length - 4; sx += stride) {
    const w = Math.min(streakLen, length - sx);
    if (w > 2) ctx.fillRect(sx, -Math.max(0.8, halfInner * 0.45), w, Math.max(1.0, halfInner * 0.7));
  }
}

function _drawSupersonicNozzleShear(ctx, r, sustainFade, elapsedFrames) {
  if (sustainFade <= 0.25) return;
  const waveOffset = (elapsedFrames % 10) / 10;
  for (let i = 0; i < 2; i++) {
    const p = (waveOffset + i * 0.5) % 1.0;
    const alpha = (1 - p) * 0.42 * sustainFade;
    if (alpha <= 0.04) continue;
    ctx.beginPath();
    ctx.arc(r * 0.14 + p * 14, 0, Math.max(4, (r * 0.34) + p * 8), -Math.PI * 0.34, Math.PI * 0.34);
    ctx.strokeStyle = `rgba(255, 235, 240, ${alpha.toFixed(3)})`;
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
}

function _drawPiercingBloodSprite(ctx, sprite, meta, startX, startY, angle, pierceLen, beamWidth, progress, r, isAnimated12F = false, elapsedFrames = 0) {
  const nowMs = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  const sustainFade = progress < 0.15 ? Math.max(0, progress / 0.15) : 1.0;

  ctx.translate(startX, startY);
  ctx.rotate(angle);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = sustainFade;

  if (isAnimated12F) {
    // Sleek locked arrow scale relative to fighter size so rotating aim never inflates/shrinks it
    const cfgScale = (typeof CONFIG !== 'undefined' && Number(CONFIG?.choso?.ultBeamSpearScale)) || 0.42;
    const fixedScale = Math.max(0.24, Math.min(0.85, (r / 30) * cfgScale));
    const drawSize = meta.width * fixedScale;
    const tipOffsetPx = (meta.tipX || 240) * fixedScale;
    const spriteX = pierceLen - tipOffsetPx;
    const shaftJoinX = Math.max(0, spriteX + ((meta.padLeft || 16) + 22) * fixedScale);

    _drawCompressedBloodShaft(ctx, shaftJoinX, fixedScale, sustainFade, elapsedFrames);

    // Source-crop if the target/wall is closer than tipOffsetPx so rear shaft never pokes behind Choso
    const clipSrcLeft = Math.max(0, -spriteX / fixedScale);
    const sx = Math.min(meta.width - 1, Math.floor(clipSrcLeft));
    const sw = meta.width - sx;
    if (sw > 1) {
      const dx = spriteX + sx * fixedScale;
      const dw = sw * fixedScale;
      ctx.drawImage(sprite, sx, 0, sw, meta.height, dx, -drawSize / 2, dw, drawSize);
    }

    _drawSupersonicNozzleShear(ctx, r, sustainFade, elapsedFrames);
    return;
  }

  const scaleX = pierceLen / meta.tightWidth;
  const drawWidth = meta.width * scaleX;
  const drawOffsetX = -(meta.padLeft * scaleX);
  const pulse = 0.96 + 0.04 * Math.sin(elapsedFrames * 0.45);
  const heightScale = (progress < 0.15 ? (0.30 + 0.70 * sustainFade) : pulse);
  const tightHeight = Math.max(beamWidth * 3.1, Math.min(116, pierceLen * 0.25)) * heightScale;
  const drawHeight = tightHeight * (meta.height / meta.tightHeight);
  const flipY = (Math.floor(nowMs / 55) % 2 === 1) ? -1 : 1;
  ctx.scale(1, flipY);
  ctx.drawImage(sprite, drawOffsetX, -drawHeight / 2, drawWidth, drawHeight);
}

function _drawVectorPiercingBloodFallback(ctx, startX, startY, endX, endY, angle, _beamWidth, progress, r) {
  const sustainFade = progress < 0.15 ? Math.max(0, progress / 0.15) : 1.0;
  const dx = endX - startX;
  const dy = endY - startY;
  const len = Math.hypot(dx, dy);
  if (len <= 2) return;

  ctx.translate(startX, startY);
  ctx.rotate(angle);
  ctx.globalAlpha = sustainFade;

  const headLen = Math.min(46, len * 0.40);
  const shaftLen = Math.max(0, len - headLen * 0.65);
  _drawCompressedBloodShaft(ctx, shaftLen, 0.45, sustainFade, 0);

  // Crisp arterial crimson conical spearhead silhouette
  const tipX = len;
  const baseX = Math.max(0, len - headLen);
  ctx.beginPath();
  ctx.moveTo(tipX, 0);
  ctx.lineTo(baseX, -8);
  ctx.lineTo(baseX + 5, 0);
  ctx.lineTo(baseX, 8);
  ctx.closePath();
  ctx.fillStyle = '#8E0A18';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#220207';
  ctx.stroke();

  _drawSupersonicNozzleShear(ctx, r, sustainFade, 0);
}

/**
 * Draws double-tapered Blood Edge crescent slashes using 16-bit pixel-art crescent sprite
 * with Rule 15 vector fallback.
 */
export function drawBloodEdgeSlashArc(ctx, fighter) {
  if (!fighter || fighter.slashSwingTimer <= 0) return;

  const totalFrames = fighter.slashSwingMax || 28;
  const elapsed = totalFrames - fighter.slashSwingTimer;
  const progress = Math.min(1.0, Math.max(0, elapsed / totalFrames));
  const aimAngle = fighter.slashCastAngle !== undefined ? fighter.slashCastAngle : (fighter.gunAngle || 0);
  const reach = fighter.meleeReach || 70;
  const slashSprite = getChosoSkillSprite('bloodEdgeSlash');

  if (_isLoadedSprite(slashSprite)) {
    // Only flash crescent during active strike -> recovery frames
    if (progress < 0.30) return;

    const meta = CHOSO_SKILL_META.bloodEdgeSlash;
    const activeP = (progress - 0.30) / 0.70;
    const alpha = activeP < 0.25 ? (activeP / 0.25) : Math.max(0, 1.0 - Math.pow((activeP - 0.25) / 0.75, 1.25));
    if (alpha <= 0.02) return;

    const tightH = reach * 1.95;
    const drawH = tightH * (meta.height / meta.tightHeight);
    const drawW = drawH * (meta.width / meta.height);
    const flipY = ((fighter.comboStep || 0) % 2 === 1) ? -1 : 1;

    ctx.save();
    ctx.translate(fighter.x, fighter.y - (fighter.z || 0));
    ctx.rotate(aimAngle);
    ctx.scale(1, flipY);
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(slashSprite, -drawW * 0.12, -drawH / 2, drawW, drawH);
    ctx.restore();
    return;
  }

  const arcSpan = (130 * Math.PI) / 180;
  const startAngle = aimAngle - arcSpan / 2;
  const currentEndAngle = startAngle + arcSpan * Math.min(1.0, progress * 1.6);
  const eraserStartAngle = (progress > 0.60) ? (startAngle + arcSpan * Math.pow((progress - 0.60) / 0.40, 1.4)) : startAngle;

  if (currentEndAngle <= eraserStartAngle) return;

  ctx.save();
  ctx.beginPath();
  ctx.arc(fighter.x, fighter.y - (fighter.z || 0), reach, eraserStartAngle, currentEndAngle);
  ctx.strokeStyle = '#FF2A55';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(fighter.x, fighter.y - (fighter.z || 0), reach - 3, eraserStartAngle, currentEndAngle);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders Choso's 16-bit 12-frame Blood Splash impact animations upon hitting
 * any entity (fighters, minions, illusions, buildings) or arena walls.
 */
export function drawChosoBloodSplashes(ctx, fighter) {
  if (!fighter || !Array.isArray(fighter.bloodSplashVisuals) || fighter.bloodSplashVisuals.length === 0) return;

  const frames = _getChosoBloodSplashFrames();
  const meta = CHOSO_SKILL_META.bloodSplashFrame;

  for (let i = 0; i < fighter.bloodSplashVisuals.length; i++) {
    const s = fighter.bloodSplashVisuals[i];
    if (!s || s.timer <= 0) continue;

    const maxTimer = Math.max(1, s.maxTimer || 24);
    const elapsed = Math.max(0, maxTimer - s.timer);
    const progress = Math.min(1, elapsed / maxTimer);
    const frameIdx = Math.min(CHOSO_BLOOD_SPLASH_FRAME_COUNT - 1, Math.floor(progress * CHOSO_BLOOD_SPLASH_FRAME_COUNT));
    const frameImg = frames[frameIdx];

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle || 0);
    if (s.flipX) ctx.scale(-1, 1);

    if (_isLoadedSprite(frameImg)) {
      const drawSize = Math.round((s.size || 84) * (meta.width / meta.tightWidth));
      ctx.globalAlpha = progress > 0.85 ? Math.max(0, 1 - (progress - 0.85) / 0.15) : 1.0;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(frameImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    } else {
      const rSplash = (s.size || 84) * (0.20 + 0.35 * progress);
      ctx.globalAlpha = Math.max(0, 1 - progress);
      ctx.fillStyle = '#8E0A18';
      ctx.strokeStyle = '#220207';
      ctx.lineWidth = 1.5;
      for (let d = 0; d < 6; d++) {
        const da = (d * Math.PI * 2) / 6 + 0.3;
        const bx = Math.cos(da) * rSplash;
        const by = Math.sin(da) * rSplash;
        ctx.beginPath();
        ctx.arc(bx, by, Math.max(2, 5 * (1 - progress * 0.5)), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
