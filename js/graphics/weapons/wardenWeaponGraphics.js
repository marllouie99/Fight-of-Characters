// ═══════════════════════════════════════════════════════════════════════════
// THE WARDEN (Minecraft: The Deep Dark) — Weapon & Sonic Boom Visual Effects
// Adheres strictly to:
// - Rule 11: Prohibition of shadowBlur CPU filters
// - Rule 24: Universal Character Body Model (r = 30 Boss Tier)
// - Rule 25: Non-Freezing Active Visual Effects Standard
// - Rule 26: Clean Concentric Shockwave Standard (Anti-Cobweb & Anti-Mesh Rule)
// - Rule 31: Uncropped Visual Effects & Anti-Rectangular Clipping Standard
// - twelve-frame-animation-generator: Reze Baseline Architecture
// ═══════════════════════════════════════════════════════════════════════════

const WARDEN_SONIC_BOOM_FRAME_COUNT = 12;
const WARDEN_SONIC_BOOM_FRAME_PATHS = Array.from(
  { length: 12 },
  (_, i) => `Assets/model/warden/sonic_boom/sonic_boom-${i + 1}.png`
);

let _wardenSonicBoomFrames = [];
let _wardenSonicBoomFramesLoading = false;

/**
 * Eager preloader for The Warden's 12-frame authentic Sonic Boom sprite sequence.
 * @returns {HTMLImageElement[]}
 */
export function _getWardenSonicBoomFrames() {
  if (
    _wardenSonicBoomFrames.length === WARDEN_SONIC_BOOM_FRAME_COUNT &&
    _wardenSonicBoomFrames.every(img => img && img.complete && img.naturalWidth > 0)
  ) {
    return _wardenSonicBoomFrames;
  }

  if (!_wardenSonicBoomFramesLoading && typeof Image !== 'undefined') {
    _wardenSonicBoomFramesLoading = true;
    _wardenSonicBoomFrames = [];
    WARDEN_SONIC_BOOM_FRAME_PATHS.forEach((src, idx) => {
      const img = new Image();
      img.onload = () => {
        _wardenSonicBoomFrames[idx] = img;
      };
      img.onerror = (e) => {
        console.warn(`Failed to load Warden Sonic Boom frame ${idx + 1} at ${src}:`, e);
      };
      img.src = `${src}?v=2`;
      _wardenSonicBoomFrames[idx] = img;
    });
  }

  return _wardenSonicBoomFrames;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getWardenSonicBoomFrames();
}

/**
 * Renders the 12-frame pixel art Sonic Boom wave sprite (Rule 31 compliant).
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} wave
 * @param {number} p Progress 0.0 to 1.0
 * @returns {boolean} True if frame was successfully rendered
 */
export function drawWardenSonicBoomSprite(ctx, wave, p) {
  const frames = _getWardenSonicBoomFrames();
  const frameIndex = Math.min(11, Math.max(0, Math.floor(p * 12)));
  const frameImg = frames[frameIndex];

  if (!frameImg || !frameImg.complete || frameImg.naturalWidth <= 0) {
    return false;
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Travel forward along beam vector:
  // Wave propagates smoothly from chest (p=0) across the reach
  const travelDist = (wave.reach || 520) * 0.70 * Math.pow(p, 0.85);
  const wx = wave.startX + Math.cos(wave.angle) * travelDist;
  const wy = wave.startY + Math.sin(wave.angle) * travelDist;

  ctx.translate(wx, wy);
  ctx.rotate(wave.angle);

  // Natural dissolution on late dissipating frames (frames 11-12 dissolve to zero)
  const fadeAlpha = p > 0.85 ? Math.max(0, (1.0 - p) / 0.15) : 1.0;
  ctx.globalAlpha = (wave.alpha !== undefined ? wave.alpha : 1.0) * fadeAlpha;

  // Frame is 512x512px with focal acoustic origin calibrated at (80, 256)
  const scale = wave.scale || 0.85;
  const drawW = 512 * scale;
  const drawH = 512 * scale;
  const anchorX = 80 * scale;
  const anchorY = 256 * scale;

  ctx.drawImage(frameImg, -anchorX, -anchorY, drawW, drawH);
  ctx.restore();

  return true;
}

/**
 * Full Sonic Boom blast renderer combining animated 12-frame voxel wave and supersonic ion beam core.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} wave
 */
export function drawWardenSonicBoomWave(ctx, wave) {
  if (!wave || wave.timer >= wave.maxTimer) return;

  const p = Math.max(0, Math.min(1.0, wave.timer / wave.maxTimer));
  const reach = wave.reach || 520;
  const beamWidth = wave.width || 36;
  const endX = wave.startX + Math.cos(wave.angle) * reach;
  const endY = wave.startY + Math.sin(wave.angle) * reach;

  ctx.save();

  // 1. Supersonic Cyan Beam Core (connects chest to propagating wave)
  const beamAlpha = (1.0 - p * 0.75) * (wave.alpha !== undefined ? wave.alpha : 1.0);
  if (beamAlpha > 0.05) {
    // Outer Ionization Cylinder
    ctx.beginPath();
    ctx.moveTo(wave.startX, wave.startY);
    ctx.lineTo(endX, endY);
    ctx.lineWidth = beamWidth * (1.0 - p * 0.35);
    ctx.strokeStyle = `rgba(13, 148, 136, ${beamAlpha * 0.40})`;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Middle Turquoise Plasma Core
    ctx.beginPath();
    ctx.moveTo(wave.startX, wave.startY);
    ctx.lineTo(endX, endY);
    ctx.lineWidth = beamWidth * 0.55 * (1.0 - p * 0.35);
    ctx.strokeStyle = `rgba(0, 245, 212, ${beamAlpha * 0.85})`;
    ctx.stroke();

    // Supersonic White Core
    ctx.beginPath();
    ctx.moveTo(wave.startX, wave.startY);
    ctx.lineTo(endX, endY);
    ctx.lineWidth = beamWidth * 0.22 * (1.0 - p * 0.35);
    ctx.strokeStyle = `rgba(255, 255, 255, ${beamAlpha * 0.95})`;
    ctx.stroke();
  }

  // 2. Authentic 12-Frame Sonic Boom Pixel Animation Sprite (Rule 31)
  const renderedSprite = drawWardenSonicBoomSprite(ctx, wave, p);

  // 3. Fallback: Procedural concentric shockwave rings ONLY when animated sprite is unavailable
  if (!renderedSprite) {
    for (let k = 0; k < 4; k++) {
      const ringP = Math.max(0, Math.min(1.0, p - k * 0.12));
      if (ringP <= 0 || ringP >= 1.0) continue;
      const curDist = reach * 0.65 * ringP;
      const rx = wave.startX + Math.cos(wave.angle) * curDist;
      const ry = wave.startY + Math.sin(wave.angle) * curDist;
      const curR = 25 + k * 14 + ringP * 20;
      const ringAlpha = (1.0 - ringP) * 0.85;

      ctx.beginPath();
      ctx.arc(rx, ry, curR, 0, Math.PI * 2);
      ctx.lineWidth = 3.0;
      ctx.strokeStyle = `rgba(0, 245, 212, ${ringAlpha})`;
      ctx.stroke();
    }
  }

  ctx.restore();
}
