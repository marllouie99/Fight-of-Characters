// ─────────────────────────────────────────────
// Ender Dragon — Upright Circle Body Fighter Skin & Animated Wings + Tail Engine
// Authentic Faceless Minimalist Pixel Art (Rule 19, 20 & 35)
// Uses Assets/model/enderDragon/Dragon-wings-sprite-sheet.png for animated flapping wings
// Uses Assets/model/enderDragon/Dragon-tails-sprite-sheet.png for animated articulated tail
// ─────────────────────────────────────────────
import { state } from '../../core/state.js';
import { getHandSize } from '../../core/config.js';
import { FighterRenderer, drawPixelHand } from '../renderers/fighterRenderer.js';
import { enderDragonConfig } from '../../configs/characters/enderDragonConfig.js';

let _wingsSheet = null;
let _tailsSheet = null;
let _textureSkinImage = null;
let _disintegration1 = null;
let _disintegration2 = null;

let _wingsLoaded = false;
let _tailsLoaded = false;
let _textureSkinLoaded = false;
let _dis1Loaded = false;
let _dis2Loaded = false;

// 6-Frame animation grid coordinates for wing sprite sheet (2 rows x 3 cols, 512x512 per cell)
const WING_FRAMES = [
  { sx: 0,    sy: 0,   sw: 512, sh: 512 }, // Frame 0: Peak Upstroke
  { sx: 512,  sy: 0,   sw: 512, sh: 512 }, // Frame 1: Mid Downstroke
  { sx: 1024, sy: 0,   sw: 512, sh: 512 }, // Frame 2: Full Downstroke
  { sx: 0,    sy: 512, sw: 512, sh: 512 }, // Frame 3: Bottom Rising
  { sx: 512,  sy: 512, sw: 512, sh: 512 }, // Frame 4: Mid Upstroke
  { sx: 1024, sy: 512, sw: 512, sh: 512 }, // Frame 5: Cresting Upstroke
];

// 8 Articulated Vertebrae Segments Grid for Dragon-tail-segmented-sheet.png
// (1280x140 sheet: 8 columns x 1 row, 160x140 cell per vertebra, anchor at 80,15)
const TAIL_SEGMENTS = [
  { id: 0, name: 'Root Base (Horns & Crown)', sx: 0,    sy: 0, sw: 160, sh: 140, ax: 80, ay: 15, jointDist: 118 },
  { id: 1, name: 'Vertebra 1',                sx: 160,  sy: 0, sw: 160, sh: 140, ax: 80, ay: 15, jointDist: 40 },
  { id: 2, name: 'Vertebra 2',                sx: 320,  sy: 0, sw: 160, sh: 140, ax: 80, ay: 15, jointDist: 48 },
  { id: 3, name: 'Vertebra 3',                sx: 480,  sy: 0, sw: 160, sh: 140, ax: 80, ay: 15, jointDist: 48 },
  { id: 4, name: 'Vertebra 4',                sx: 640,  sy: 0, sw: 160, sh: 140, ax: 80, ay: 15, jointDist: 48 },
  { id: 5, name: 'Vertebra 5',                sx: 800,  sy: 0, sw: 160, sh: 140, ax: 80, ay: 15, jointDist: 46 },
  { id: 6, name: 'Vertebra 6',                sx: 960,  sy: 0, sw: 160, sh: 140, ax: 80, ay: 15, jointDist: 46 },
  { id: 7, name: 'Crystalline Tail Tip',      sx: 1120, sy: 0, sw: 160, sh: 140, ax: 80, ay: 15, jointDist: 94 },
];
const TOTAL_TAIL_JOINT_LENGTH = 488.0;

// Single Bird's-Eye View Tail Frame Legacy Fallback
const TAIL_FRAME_LEGACY = { sx: 0, sy: 0, sw: 309, sh: 526, ax: 117.0, ay: 20.0, h: 484.0 };

export function getEnderDragonWingsSheet() {
  if (!_wingsSheet && typeof Image !== 'undefined') {
    _wingsSheet = new Image();
    _wingsSheet.onload = () => { _wingsLoaded = true; };
    _wingsSheet.onerror = (e) => { console.warn('Failed to load Dragon Wings Sheet at Assets/model/enderDragon/Dragon-wings-sprite-sheet.png', e); };
    _wingsSheet.src = encodeURI('Assets/model/enderDragon/Dragon-wings-sprite-sheet.png?v=1');
  }
  return _wingsSheet;
}

export function getEnderDragonTailsSheet() {
  if (!_tailsSheet && typeof Image !== 'undefined') {
    _tailsSheet = new Image();
    _tailsSheet.onload = () => { _tailsLoaded = true; };
    _tailsSheet.onerror = (e) => { console.warn('Failed to load Dragon Tails Sheet at Assets/model/enderDragon/Dragon-tail-segmented-sheet.png', e); };
    _tailsSheet.src = encodeURI(enderDragonConfig.tailsSpriteSrc || 'Assets/model/enderDragon/Dragon-tail-segmented-sheet.png?v=1');
  }
  return _tailsSheet;
}

export function getEnderDragonTextureSkinImage() {
  if (!_textureSkinImage && typeof Image !== 'undefined') {
    _textureSkinImage = new Image();
    _textureSkinImage.onload = () => { _textureSkinLoaded = true; };
    _textureSkinImage.onerror = (e) => { console.warn('Failed to load Dragon Texture Skin at Assets/model/enderDragon/dragon-texture-skin.png', e); };
    _textureSkinImage.src = encodeURI(enderDragonConfig.textureSkinSrc || 'Assets/model/enderDragon/dragon-texture-skin.png?v=1');
  }
  return _textureSkinImage;
}

// Backward-compatibility aliases
export const getEnderDragonMovementSheet = getEnderDragonWingsSheet;
export const getEnderDragonVerticalSheet = getEnderDragonWingsSheet;
export const getEnderDragonSideSheet = getEnderDragonWingsSheet;
export const getEnderDragonStraightSheet = getEnderDragonWingsSheet;
export const getEnderDragonAngledSheet = getEnderDragonWingsSheet;
export const getEnderDragonModelImage = getEnderDragonWingsSheet;

export function getEnderDragonDisintegrationImages() {
  if (!_disintegration1 && typeof Image !== 'undefined') {
    _disintegration1 = new Image();
    _disintegration1.onload = () => { _dis1Loaded = true; };
    _disintegration1.src = encodeURI('Assets/model/enderDragon/Ender-dragon-Disintegration-Sequence.png?v=1');
  }
  if (!_disintegration2 && typeof Image !== 'undefined') {
    _disintegration2 = new Image();
    _disintegration2.onload = () => { _dis2Loaded = true; };
    _disintegration2.src = encodeURI('Assets/model/enderDragon/Ender-dragon-Disintegration-Sequence2.png?v=1');
  }
  return { dis1: _disintegration1, dis2: _disintegration2 };
}

// Pre-initialize on load if in desktop browser environment (lazy-loaded on demand on mobile)
if (typeof window !== 'undefined' && !(typeof state !== 'undefined' && state.isMobileDevice)) {
  getEnderDragonTextureSkinImage();
  getEnderDragonWingsSheet();
  getEnderDragonTailsSheet();
  getEnderDragonDisintegrationImages();
}

/**
 * Procedural fallback wings if wings sheet is loading
 */
function _drawProceduralWings(ctx, r, isSwooping = false) {
  ctx.save();
  const custom = (typeof state !== 'undefined' && state.skinCustomizations?.enderDragon) || {};
  const wingScaleMult = custom.wingScale ?? (enderDragonConfig.wingScale || 5.2);
  const wingSpan = r * (wingScaleMult * 0.6);
  ctx.fillStyle = '#27272A';
  ctx.strokeStyle = '#581C87';
  ctx.lineWidth = 2.0;

  // Upper/Left Flank Wing
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, -r * 0.4);
  ctx.lineTo(-r * 0.9, -wingSpan);
  ctx.lineTo(r * 0.6, -wingSpan * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Lower/Right Flank Wing
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, r * 0.4);
  ctx.lineTo(-r * 0.9, wingSpan);
  ctx.lineTo(r * 0.6, wingSpan * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Procedural fallback tail if tail sheet is loading
 */
function _drawProceduralTail(ctx, r, segmentAngles = []) {
  ctx.save();
  ctx.translate(-r * 0.70, 0);
  const tailSegments = 8;
  const segLen = (r * 2.25) / tailSegments;

  ctx.fillStyle = '#18181B';
  ctx.strokeStyle = '#0E0F14';
  ctx.lineWidth = 2.0;

  for (let i = 0; i < tailSegments; i++) {
    const rot = (segmentAngles && segmentAngles[i] !== undefined) ? segmentAngles[i] : 0;
    ctx.rotate(rot);
    const halfW = (r * 0.32) * (1 - (i / tailSegments) * 0.55);

    ctx.beginPath();
    ctx.moveTo(0, -halfW);
    ctx.lineTo(-segLen, -halfW * 0.75);
    ctx.lineTo(-segLen, halfW * 0.75);
    ctx.lineTo(0, halfW);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Purple spine on dorsal side
    ctx.fillStyle = '#A21CAF';
    ctx.fillRect(-segLen * 0.5 - 2, -halfW - 2, 4, 3);
    ctx.fillStyle = '#18181B';

    ctx.translate(-segLen, 0);
  }
  ctx.restore();
}

/**
 * Renders Animated Articulated Multi-Segment Dragon Tail from Dragon-tail-segmented-sheet.png
 */
function _drawEnderDragonTail(ctx, r, tailImg, tailSegments, segmentAngles, attachOffsetX = 0) {
  const custom = (typeof state !== 'undefined' && state.skinCustomizations?.enderDragon) || {};
  const tailScaleMult = custom.tailScale ?? (enderDragonConfig.tailScale || 2.25);
  const tailLength = r * tailScaleMult; // Proportional prominent & powerful dragon tail scale
  const scale = tailLength / TOTAL_TAIL_JOINT_LENGTH;
  const attachX = -r * 0.70 + attachOffsetX; // Base attaches beneath dragon rear circle with breath heave coupling

  if (tailImg && tailImg.complete && tailImg.naturalWidth > 0) {
    ctx.save();
    ctx.translate(attachX, 0);
    ctx.rotate(Math.PI / 2);  // Rotate 90° so vertical downward (+Y) sprite extends straight backward (-X)
    ctx.imageSmoothingEnabled = false; // Authentic pixel art

    const isSegmented = tailImg.naturalWidth >= 1000 && Array.isArray(tailSegments);
    if (isSegmented) {
      for (let i = 0; i < tailSegments.length; i++) {
        const seg = tailSegments[i];
        const relAngle = (segmentAngles && segmentAngles[i] !== undefined) ? segmentAngles[i] : 0;
        ctx.rotate(relAngle);
        ctx.drawImage(
          tailImg,
          seg.sx, seg.sy, seg.sw, seg.sh,
          -seg.ax * scale, -seg.ay * scale,
          seg.sw * scale, seg.sh * scale
        );
        ctx.translate(0, seg.jointDist * scale);
      }
    } else {
      const tBox = TAIL_FRAME_LEGACY;
      const legScale = tailLength / (tBox.h || 484.0);
      const rot = (segmentAngles && segmentAngles[0] !== undefined) ? segmentAngles[0] : 0;
      ctx.rotate(rot);
      ctx.drawImage(
        tailImg,
        tBox.sx, tBox.sy, tBox.sw, tBox.sh,
        -tBox.ax * legScale, -tBox.ay * legScale,
        tBox.sw * legScale, tBox.sh * legScale
      );
    }
    ctx.restore();
  } else {
    _drawProceduralTail(ctx, r, segmentAngles);
  }
}

// Offscreen canvas cache for Ender Dragon's pixel body model (avoids 1,200 fillRect calls per frame and subpixel grid lines)
let _cachedDragonCanvas = null;
let _cachedDragonR = 0;

function _renderEnderDragonPixelBodyToCanvas(destCtx, r) {
  destCtx.imageSmoothingEnabled = false;
  const P = 2.0;
  const steps = Math.ceil((r * 1.15 + P) / P);

  // Palette Colors matching Authentic Ender Dragon (Obsidian + Amethyst + Silver)
  const C = {
    outline: '#0E0F14',        // Deep dark manga ink outline
    obsidianBase: '#18181B',   // Dark obsidian charcoal base
    obsidianDark: '#101014',   // Deep shadow / rear obsidian
    obsidianMid: '#24242B',    // Scale midtone
    obsidianLight: '#383842',  // Snout / brow specular highlight

    spinePlate: '#D4D4D8',    // Metallic silver dorsal spine plate
    spineGlint: '#FFFFFF',    // Specular spine glint

    eyeSocket: '#A21CAF',     // Amethyst socket rim
    eyeViolet: '#E879F9',     // Neon violet slit
    eyeCore: '#F5D0FE',       // Specular amethyst eye core

    crystalShadow: '#701A75', // Void crystal shadow
    crystalMid: '#D946EF',    // Void crystal facet
    crystalLight: '#F5D0FE',  // Void crystal bright facet
    crystalCore: '#FFFFFF',   // Void crystal inner gleam

    hornBase: '#18181B',      // Horn root
    hornMid: '#C026D3',       // Horn amethyst gradient
    hornBright: '#E879F9',    // Horn bright facet
    hornGlint: '#F5D0FE',     // Horn tip specular glint
  };

  const cx = destCtx.canvas.width / 2;
  const cy = destCtx.canvas.height / 2;

  destCtx.save();
  destCtx.translate(cx, cy);

  function pointInTri(px, py, x1, y1, x2, y2, x3, y3) {
    const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
    const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3);
    const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1);
    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(hasNeg && hasPos);
  }

  function isInsideDragon(x, y) {
    if (Math.hypot(x, y) <= r) return true;
    // Swept-back twin horns
    if (pointInTri(x, y, r * 0.35, -r * 0.38, -r * 0.95, -r * 0.95, -r * 0.25, -r * 0.60)) return true;
    if (pointInTri(x, y, r * 0.35, r * 0.38, -r * 0.95, r * 0.95, -r * 0.25, r * 0.60)) return true;
    return false;
  }

  // 100% Discrete Grid Rasterization onto Axis-Aligned Offscreen Canvas (Zero Crisscross Lines)
  for (let gy = -steps; gy <= steps; gy++) {
    for (let gx = -steps; gx <= steps; gx++) {
      const rx = gx * P;
      const ry = gy * P;
      if (!isInsideDragon(rx, ry)) continue;

      const px = rx - P / 2;
      const py = ry - P / 2;

      // 4-neighbor boundary test for clean 1-pixel outer manga ink outline
      const isBorder =
        !isInsideDragon((gx + 1) * P, gy * P) ||
        !isInsideDragon((gx - 1) * P, gy * P) ||
        !isInsideDragon(gx * P, (gy + 1) * P) ||
        !isInsideDragon(gx * P, (gy - 1) * P);

      if (isBorder) {
        destCtx.fillStyle = C.outline;
        destCtx.fillRect(px, py, P, P);
        continue;
      }

      const dist = Math.hypot(rx, ry);

      // ── ZONE 1: Swept-Back Twin Horns ──
      const isUpperHorn = ry < -r * 0.45 && rx < -r * 0.15;
      const isLowerHorn = ry > r * 0.45 && rx < -r * 0.15;

      if (isUpperHorn || isLowerHorn) {
        const absY = Math.abs(ry);
        if (rx < -r * 0.65 && absY > r * 0.72) {
          if (rx < -r * 0.85) {
            destCtx.fillStyle = C.hornGlint;
          } else if (rx < -r * 0.75) {
            destCtx.fillStyle = C.hornBright;
          } else {
            destCtx.fillStyle = C.hornMid;
          }
        } else {
          destCtx.fillStyle = C.hornBase;
        }
        destCtx.fillRect(px, py, P, P);
        continue;
      }

      // ── ZONE 2: Metallic Silver Dorsal Spine Ridges ──
      const isCenterSpine = Math.abs(ry) <= P * 1.5 && rx >= -r * 0.75 && rx <= r * 0.55;
      if (isCenterSpine) {
        const spineSegment = Math.floor((rx + r * 0.75) / (r * 0.26));
        const isSpineBlock = (spineSegment % 2 === 0);
        if (isSpineBlock) {
          destCtx.fillStyle = (Math.abs(ry) <= P * 0.6) ? C.spineGlint : C.spinePlate;
          destCtx.fillRect(px, py, P, P);
          continue;
        }
      }

      // ── ZONE 3: Faceless Amethyst Eye Slits ──
      const isEyeX = rx >= r * 0.28 && rx <= r * 0.48;
      const isUpperEye = isEyeX && ry >= -r * 0.42 && ry <= -r * 0.20;
      const isLowerEye = isEyeX && ry >= r * 0.20 && ry <= r * 0.42;

      if (isUpperEye || isLowerEye) {
        if (rx >= r * 0.36 && rx <= r * 0.44 && Math.abs(ry) >= r * 0.26 && Math.abs(ry) <= r * 0.36) {
          destCtx.fillStyle = C.eyeCore;
        } else if (rx >= r * 0.32) {
          destCtx.fillStyle = C.eyeViolet;
        } else {
          destCtx.fillStyle = C.eyeSocket;
        }
        destCtx.fillRect(px, py, P, P);
        continue;
      }

      // ── ZONE 4: Void Crystal Core / Heart ──
      const coreCenterX = -r * 0.10;
      const coreDist = Math.abs(rx - coreCenterX) + Math.abs(ry) * 1.25;
      if (coreDist <= r * 0.22) {
        if (coreDist <= P * 1.5) {
          destCtx.fillStyle = C.crystalCore;
        } else if (coreDist <= r * 0.10) {
          destCtx.fillStyle = C.crystalLight;
        } else if (coreDist <= r * 0.16) {
          destCtx.fillStyle = C.crystalMid;
        } else {
          destCtx.fillStyle = C.crystalShadow;
        }
        destCtx.fillRect(px, py, P, P);
        continue;
      }

      // ── ZONE 5: Solid Obsidian Scale Shading (No modulo dither noise) ──
      if (rx > r * 0.35 && Math.abs(ry) < r * 0.45) {
        destCtx.fillStyle = C.obsidianLight;
      } else if (rx > 0 && dist < r * 0.70) {
        destCtx.fillStyle = C.obsidianMid;
      } else if (rx < -r * 0.35 || dist > r * 0.82) {
        destCtx.fillStyle = C.obsidianDark;
      } else {
        destCtx.fillStyle = C.obsidianBase;
      }

      destCtx.fillRect(px, py, P, P);
    }
  }

  destCtx.restore();
}

/**
 * Renders Retro Arcade Pixel Exhale Vapor Mist Puffs from Snout Nostrils (Zenitsu / Arcade Style)
 */
function _drawRetroBreathVapor(ctx, r, exhaleStep, nostrilShiftX = 0, nostrilShiftY = 0) {
  if (exhaleStep < 0 || exhaleStep > 3) return;

  // Snout nostril anchor coordinates (+X forward, +/-Y lateral nostrils)
  const baseNx = r * 0.84 + nostrilShiftX;
  const baseNy = r * 0.20 + nostrilShiftY;

  // Stepped pixel clusters for authentic 16-bit arcade exhale mist
  const steps = [
    // Step 0: Subtle ignition spark at nostril opening
    [
      { dx: 3, dy: 0, w: 3, h: 3, c: '#F5D0FE' },
      { dx: 6, dy: -1, w: 2, h: 2, c: '#E879F9' },
    ],
    // Step 1: Expanding pixel vapor cloud
    [
      { dx: 5, dy: 0, w: 3, h: 3, c: '#FFFFFF' },
      { dx: 8, dy: -2, w: 4, h: 3, c: '#F5D0FE' },
      { dx: 12, dy: -3, w: 3, h: 3, c: '#E879F9' },
      { dx: 9, dy: 1, w: 2, h: 2, c: '#C026D3' },
    ],
    // Step 2: Drifting void mist cloud
    [
      { dx: 11, dy: -2, w: 3, h: 3, c: '#F5D0FE' },
      { dx: 14, dy: -4, w: 4, h: 4, c: '#E879F9' },
      { dx: 18, dy: -6, w: 3, h: 3, c: '#C026D3' },
      { dx: 21, dy: -7, w: 2, h: 2, c: '#701A75' },
    ],
    // Step 3: Dissipating pixel crumbs
    [
      { dx: 18, dy: -5, w: 3, h: 3, c: '#E879F9' },
      { dx: 22, dy: -7, w: 3, h: 2, c: '#C026D3' },
      { dx: 25, dy: -9, w: 2, h: 2, c: '#701A75' },
    ],
  ];

  const pixels = steps[exhaleStep];
  if (!pixels) return;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  for (let i = 0; i < pixels.length; i++) {
    const p = pixels[i];
    ctx.fillStyle = p.c;

    // Upper nostril (-Y)
    const ux = Math.round(baseNx + p.dx);
    const uy = Math.round(-baseNy + p.dy);
    ctx.fillRect(ux, uy, p.w, p.h);

    // Lower nostril (+Y)
    const lx = Math.round(baseNx + p.dx);
    const ly = Math.round(baseNy - p.dy);
    ctx.fillRect(lx, ly, p.w, p.h);
  }

  ctx.restore();
}

/**
 * Authentic Obsidian Ender Dragon Pixel Art Engine (Texture PNG + Offscreen Cached Fallback)
 * Upright Front POV, Faceless Minimalist Aesthetic (Rule 19, 20 & 35)
 */
export function drawEnderDragonPixelBody(ctx, r, isPreview = false, breathScaleX = 1.0, breathScaleY = 1.0, heaveX = 0, heaveY = 0) {
  if (!ctx) return;

  const skinImg = getEnderDragonTextureSkinImage();
  if (skinImg && skinImg.complete && skinImg.naturalWidth > 0) {
    ctx.save();
    ctx.imageSmoothingEnabled = false; // Authentic nearest-neighbor pixel art (Rule 19 & 3.5)

    const custom = (typeof state !== 'undefined' && state.skinCustomizations?.enderDragon) || {};
    const scaleMult = custom.scale ?? 1.0;
    const offX = (custom.offsetX ?? 0) + heaveX;
    const offY = (custom.offsetY ?? 0) + heaveY;

    // Exact true geometric & feature center of the dragon model in 1254x1254 texture is (627.0, 710.0)
    // Nominal circular radius is 433.0px
    const drawRadius = r * 1.05 * scaleMult;
    const scale = drawRadius / 433.0;
    const drawW = 1254.0 * scale * breathScaleX;
    const drawH = 1254.0 * scale * breathScaleY;
    const drawX = -627.0 * scale * breathScaleX + offX;
    const drawY = -710.0 * scale * breathScaleY + offY;

    // Clip to clean boundary with anisotropic chest expansion (Rule 19 & 3.5)
    ctx.beginPath();
    ctx.ellipse(offX, offY, drawRadius * breathScaleX, drawRadius * breathScaleY, 0, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(skinImg, 0, 0, 1254, 1254, drawX, drawY, drawW, drawH);
    ctx.restore();

    // Clean dark manga ink outline ring for crisp retro arcade silhouette (Rule 19 & 3.5)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(offX, offY, drawRadius * breathScaleX, drawRadius * breathScaleY, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Fallback to procedural discrete pixel art cache if image is still loading or running headless
  if (typeof document === 'undefined') return;

  if (!_cachedDragonCanvas || _cachedDragonR !== r) {
    _cachedDragonR = r;
    const P = 2.0;
    const steps = Math.ceil((r * 1.15 + P) / P);
    const size = (steps * 2 + 1) * P;

    _cachedDragonCanvas = document.createElement('canvas');
    _cachedDragonCanvas.width = size;
    _cachedDragonCanvas.height = size;
    const offCtx = _cachedDragonCanvas.getContext('2d');
    _renderEnderDragonPixelBodyToCanvas(offCtx, r);
  }

  if (_cachedDragonCanvas) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(heaveX, heaveY);
    ctx.scale(breathScaleX, breathScaleY);
    ctx.drawImage(_cachedDragonCanvas, -_cachedDragonCanvas.width / 2, -_cachedDragonCanvas.height / 2);
    ctx.restore();
  }
}

// Backward-compatibility alias
export const _drawEnderDragonCircleBody = drawEnderDragonPixelBody;

/**
 * Renders trailing swooping afterimages in world space
 */
function _drawSwoopAfterImages(ctx, afterImages, r, fBox, wingsImg, tailSegments, tailsImg, segmentAngles) {
  if (!afterImages || afterImages.length === 0) return;

  for (let i = 0; i < afterImages.length; i++) {
    const ai = afterImages[i];
    const alpha = Math.max(0, Math.min(1, ai.alpha || 0.4));
    if (alpha <= 0.02) continue;

    ctx.save();
    ctx.translate(ai.x, ai.y);
    const angle = (ai.angle !== undefined) ? ai.angle : 0;
    ctx.rotate(angle);
    const facingLeft = Math.abs(angle) > Math.PI / 2;
    if (facingLeft) {
      ctx.scale(1, -1);
    }
    ctx.globalAlpha = alpha * 0.5;

    // Draw fading tail with fluid multi-segment chain
    _drawEnderDragonTail(ctx, r, tailsImg, tailSegments, segmentAngles);

    // Draw fading wings
    if (wingsImg && wingsImg.complete && wingsImg.naturalWidth > 0 && fBox) {
      const custom = (typeof state !== 'undefined' && state.skinCustomizations?.enderDragon) || {};
      const wingScaleMult = custom.wingScale ?? (enderDragonConfig.wingScale || 5.2);
      const wingDrawSize = r * wingScaleMult;
      ctx.save();
      ctx.translate(-r * 0.15, 0);
      ctx.rotate(Math.PI / 2);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        wingsImg,
        fBox.sx, fBox.sy, fBox.sw, fBox.sh,
        -wingDrawSize / 2, -wingDrawSize / 2, wingDrawSize, wingDrawSize
      );
      ctx.restore();
    }

    // Draw fading silhouette
    ctx.fillStyle = '#C026D3';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Renders Void Cataclysm charging lightning arcs around dragon
 */
function _drawCataclysmLightning(ctx, r, channelProgress) {
  ctx.save();
  const count = 4 + Math.floor(channelProgress * 6);
  const ringR = r * (1.2 + channelProgress * 0.5);

  ctx.strokeStyle = channelProgress > 0.6 ? '#F5D0FE' : '#D946EF';
  ctx.lineWidth = 2.0;

  for (let i = 0; i < count; i++) {
    const baseA = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const x1 = Math.cos(baseA) * (ringR * 0.6);
    const y1 = Math.sin(baseA) * (ringR * 0.6);
    const midA = baseA + (Math.random() - 0.5) * 0.4;
    const mx = Math.cos(midA) * (ringR * 0.9);
    const my = Math.sin(midA) * (ringR * 0.9);
    const x2 = Math.cos(baseA) * ringR;
    const y2 = Math.sin(baseA) * ringR;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(mx, my);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Main Ender Dragon Skin Renderer
 * Renders Upright Minimalist Circle Body + Animated Flapping Wings + Fluid Articulated Multi-Segment Tail
 */
export function drawEnderDragonSkin(ctx, fighter) {
  if (!ctx || !fighter) return;

  const r = fighter.r || enderDragonConfig.r || 36;
  const isPreview = Boolean(fighter._isPreview || fighter._isWinnerReveal || fighter.isPreview);

  const wingsImg = getEnderDragonWingsSheet();
  const tailsImg = getEnderDragonTailsSheet();

  // Frame timing: speed up during swoops and high-velocity flight, or lock to resting frame when grounded
  const isSwooping = Boolean(fighter.isSwooping || fighter.aiState === 'SWOOP_DASH' || fighter.aiState === 'INTERCEPT');
  const isGrounded = Boolean(fighter.isGrounded || fighter.aiState === 'PERCH_GROUNDED');
  const ticksPerFrame = isSwooping
    ? enderDragonConfig.swoopTicksPerFrame || 3
    : (isGrounded ? 8 : (enderDragonConfig.spriteTicksPerFrame || 5));

  const frameCounter = (typeof state !== 'undefined' && state.frameCount !== undefined)
    ? state.frameCount
    : Math.floor(Date.now() / 16);

  // When grounded, cycle slowly between bottom resting/folded wing frames
  const frameIdx = (fighter.wingFrameIndex !== undefined)
    ? fighter.wingFrameIndex
    : (isGrounded
        ? (2 + Math.floor((frameCounter / 12) % 2))
        : (Math.floor(frameCounter / ticksPerFrame) % WING_FRAMES.length));
  const fBox = WING_FRAMES[frameIdx] || WING_FRAMES[0];

  // ── Multi-Dimensional Altitude Ground Shadow Engine ──
  const alt = (fighter.altitude !== undefined) ? fighter.altitude : (isGrounded ? 0 : 1.0);
  if (!isPreview && alt > 0.06) {
    const shadowAlpha = Math.max(0.08, 0.36 - alt * 0.12);
    const shadowScaleX = Math.max(0.60, 1.05 - alt * 0.16);
    const shadowScaleY = Math.max(0.35, 0.55 - alt * 0.10);
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(fighter.x, fighter.y + alt * 14, r * 1.0 * shadowScaleX, r * 0.6 * shadowScaleY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Retro Arcade Multi-Segment Articulated Vertebrae Trailing Ribbon Engine ──
  // Creates authentic 16-bit / Neo-Geo arcade boss trailing physics:
  // 1. Each vertebra smoothly trails the previous vertebra in world space along flight curves.
  // 2. Discrete 4.5° arcade angular notch quantization snaps joint rotations to clean pixel-art angles.
  // 3. Fluid trailing C-curves and S-curves form dynamically as the dragon turns and glides.
  const angle = isPreview ? 0 : (fighter.gunAngle !== undefined ? fighter.gunAngle : (fighter.angle || 0));
  const numSegs = TAIL_SEGMENTS.length;
  const spineWorldAngle = angle + Math.PI;

  // Initialize or reset tracking world angles for all 8 vertebrae
  if (!fighter._tailSegWorldAngles || fighter._tailSegWorldAngles.length !== numSegs || isNaN(fighter._tailSegWorldAngles[0])) {
    fighter._tailSegWorldAngles = new Array(numSegs).fill(spineWorldAngle);
  }

  // Shortest angular difference helper
  const angleDiff = (target, current) => {
    let d = target - current;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  };

  // 1. Segment 0 (Root Base) tracks the dragon's spine
  const rootDiff = angleDiff(spineWorldAngle, fighter._tailSegWorldAngles[0]);
  const rootFollowRate = isPreview ? 0.60 : (isSwooping ? 0.44 : 0.36);
  fighter._tailSegWorldAngles[0] += rootDiff * rootFollowRate;

  while (fighter._tailSegWorldAngles[0] > Math.PI) fighter._tailSegWorldAngles[0] -= Math.PI * 2;
  while (fighter._tailSegWorldAngles[0] < -Math.PI) fighter._tailSegWorldAngles[0] += Math.PI * 2;

  // 2. Downstream Vertebrae 1..7 trail their respective parent vertebrae
  const segFollowRate = isPreview ? 0.55 : (isSwooping ? 0.40 : 0.32);
  const maxJointBend = isPreview ? (10 * Math.PI / 180) : (24 * Math.PI / 180); // max 24° bend per joint

  for (let i = 1; i < numSegs; i++) {
    const parentAngle = fighter._tailSegWorldAngles[i - 1];
    const diff = angleDiff(parentAngle, fighter._tailSegWorldAngles[i]);

    fighter._tailSegWorldAngles[i] += diff * segFollowRate;

    while (fighter._tailSegWorldAngles[i] > Math.PI) fighter._tailSegWorldAngles[i] -= Math.PI * 2;
    while (fighter._tailSegWorldAngles[i] < -Math.PI) fighter._tailSegWorldAngles[i] += Math.PI * 2;

    // Safety anatomical clamp relative to parent vertebra
    const relToParent = angleDiff(fighter._tailSegWorldAngles[i], parentAngle);
    if (Math.abs(relToParent) > maxJointBend) {
      const clampedRel = Math.sign(relToParent) * maxJointBend;
      fighter._tailSegWorldAngles[i] = parentAngle + clampedRel;
      while (fighter._tailSegWorldAngles[i] > Math.PI) fighter._tailSegWorldAngles[i] -= Math.PI * 2;
      while (fighter._tailSegWorldAngles[i] < -Math.PI) fighter._tailSegWorldAngles[i] += Math.PI * 2;
    }
  }

  // 3. Retro Arcade 4.5° Angular Notch Snapping & Relative Joint Calculations
  const isSpinning360 = Boolean(fighter.isBreathingFire || fighter.aiState === 'FIREBALL_SPIT');
  const isTelegraphingDivebomb = Boolean(
    fighter.isTelegraphingDivebomb ||
    fighter.aiState === 'DIVEBOMB_TELEGRAPH' ||
    fighter.aiState === 'DIVEBOMB_SETUP'
  );
  const isDivebomb = Boolean(
    isTelegraphingDivebomb ||
    fighter.isDivebombing ||
    fighter.aiState === 'DIVEBOMB_STRIKE' ||
    fighter.aiState === 'DIVEBOMB_RECOVERY'
  );
  const RETRO_ARCADE_NOTCH = Math.PI / 40; // 4.5° discrete arcade step
  const facingLeft = Math.abs(angle) > Math.PI / 2;
  const segmentRelAngles = new Array(numSegs);

  if (isSpinning360) {
    const elapsed = (fighter.breathElapsed !== undefined) ? fighter.breathElapsed : 0;
    const spinTotal = fighter.breathSpinTotal || 70;
    const isPhase1 = elapsed < spinTotal && fighter.isBreathingFire !== false;
    const num = TAIL_SEGMENTS.length;

    if (isPhase1) {
      // ── Phase 1: Active 360° Sweep Trailing Kinematics ──
      // Aerodynamic rotational drag smoothly curves the tail opposite the spin direction
      // plus an organic traveling sinusoidal wisp wave down the vertebrae chain (Zero stepped notches / Zero jitter)
      for (let i = 0; i < num; i++) {
        const segFraction = (i + 1) / num;
        const dragCurve = -0.042 * (1.0 + segFraction * 0.4);
        const tailWave = Math.sin(frameCounter * 0.16 - i * 0.45) * 0.018 * (1.0 + segFraction * 0.6);
        segmentRelAngles[i] = dragCurve + tailWave;
      }
    } else {
      // ── Phase 2: Post-Breath Recovery & Settle ──
      // Gracefully straightens back out to resting alignment with damped decay
      const recoveryElapsed = Math.max(0, elapsed - spinTotal);
      const settleProgress = Math.min(1.0, Math.max(0, recoveryElapsed / (fighter.breathRecoveryFrames || 24)));
      const decay = Math.cos(settleProgress * Math.PI * 0.5); // 1.0 -> 0.0 smooth ease
      for (let i = 0; i < num; i++) {
        const segFraction = (i + 1) / num;
        const dragCurve = -0.042 * (1.0 + segFraction * 0.4) * decay;
        const tailWave = Math.sin(frameCounter * 0.12 - i * 0.35) * (0.015 * decay);
        segmentRelAngles[i] = dragCurve + tailWave;
      }
    }

    // Accumulate smooth world angles for internal tracking
    let accumAngle = spineWorldAngle;
    for (let i = 0; i < num; i++) {
      accumAngle += segmentRelAngles[i];
      fighter._tailSegWorldAngles[i] = accumAngle;
    }
  } else if (isTelegraphingDivebomb) {
    // ── Divebomb Windup & Telegraph Trailing Kinematics ──
    // Aerodynamic trailing alignment behind dive angle with graceful traveling wisp wave
    // (Zero discrete 4.5° notch snapping / Zero facingLeft sign flips / Zero jitter)
    const num = TAIL_SEGMENTS.length;
    for (let i = 0; i < num; i++) {
      const segFraction = (i + 1) / num;
      const tailWave = Math.sin(frameCounter * 0.14 - i * 0.40) * 0.015 * (1.0 + segFraction * 0.5);
      segmentRelAngles[i] = tailWave;
    }
    let accumAngle = spineWorldAngle;
    for (let i = 0; i < num; i++) {
      accumAngle += segmentRelAngles[i];
      fighter._tailSegWorldAngles[i] = accumAngle;
    }
  } else {
    // Segment 0 relative to dragon spine
    const rawRel0 = angleDiff(fighter._tailSegWorldAngles[0], spineWorldAngle);
    const qRel0 = Math.round(rawRel0 / RETRO_ARCADE_NOTCH) * RETRO_ARCADE_NOTCH;
    segmentRelAngles[0] = facingLeft ? -qRel0 : qRel0;

    // Segments 1..7 relative to previous vertebra
    for (let i = 1; i < numSegs; i++) {
      const rawRel_i = angleDiff(fighter._tailSegWorldAngles[i], fighter._tailSegWorldAngles[i - 1]);
      const qRel_i = Math.round(rawRel_i / RETRO_ARCADE_NOTCH) * RETRO_ARCADE_NOTCH;
      segmentRelAngles[i] = facingLeft ? -qRel_i : qRel_i;
    }
  }

  // Render afterimages in world space behind fighter
  if (fighter.afterImages && fighter.afterImages.length > 0) {
    _drawSwoopAfterImages(ctx, fighter.afterImages, r, fBox, wingsImg, TAIL_SEGMENTS, tailsImg, segmentRelAngles);
  }

  ctx.save();
  ctx.translate(fighter.x, fighter.y - (fighter.z || (fighter.altitude ? fighter.altitude * 18 : 0)));

  // ── Upright Aim Angle Transform Standard (Rule 19) ──
  ctx.rotate(angle);
  if (facingLeft && !isSpinning360 && !isDivebomb) {
    ctx.scale(1, -1); // Upright orientation: top horn/wing stays on -Y and bottom on +Y! (Suppressed during 360° spin and divebomb trajectory)
  }

  // Multi-dimensional altitude depth scale
  const altScale = !isPreview ? (1.0 + (alt - 1.0) * 0.08) : 1.0;
  if (altScale !== 1.0) {
    ctx.scale(altScale, altScale);
  }

  // Draw Void Cataclysm channeling lightning
  if (fighter.isChannelingCataclysm) {
    _drawCataclysmLightning(ctx, r, fighter.cataclysmProgress || 0);
  }

  // ── Retro Arcade Character Breathing Animation (Stepped Body Expansion & Chest Rhythm like Zenitsu) ──
  // Discrete 3-tier stepped breath cycle: Inhale (+1), Rest/Neutral (0), Exhale (-1)
  const isChanneling = Boolean(fighter.isChannelingCataclysm);
  const isSmoothKinematics = isSpinning360 || isTelegraphingDivebomb || isPreview;
  const breathFreq = isPreview ? 0.08 : (isSwooping ? 0.24 : 0.12);
  const cycleAngle = (frameCounter * breathFreq) % (Math.PI * 2);
  const rawBreath = isChanneling ? 0.0 : Math.sin(cycleAngle);
  const breathQuantized = rawBreath > 0.35 ? 1.0 : (rawBreath < -0.35 ? -1.0 : 0.0);
  const easeBreathing = isSwooping ? 0.0 : 1.0;

  // During 360° breath sweep or divebomb windup: organic continuous sub-pixel float breathing & maw heave (Zero 1px stepped jitter)
  const breathCycle = Math.sin(frameCounter * (isSmoothKinematics ? 0.14 : breathFreq));
  const chestExpansionX = isSmoothKinematics
    ? Math.max(0, breathCycle) * 1.2
    : Math.max(0, breathQuantized) * 1.5 * easeBreathing;
  const heaveX = isSmoothKinematics
    ? (breathCycle * 0.8)
    : Math.round(breathQuantized * 1.5 * easeBreathing);
  const heaveY = isSmoothKinematics
    ? (Math.cos(frameCounter * 0.14) * 0.5)
    : Math.round(Math.cos(cycleAngle) * 0.8 * (breathQuantized !== 0 ? 1 : 0) * easeBreathing);

  // Volume-conserving squash & stretch (chest expands forward on inhale, contracts on exhale)
  const breathScaleX = isSmoothKinematics
    ? (1.0 + breathCycle * 0.030)
    : (1.0 + (breathQuantized * 0.035 * easeBreathing));
  const breathScaleY = isSmoothKinematics
    ? (1.0 - breathCycle * 0.015)
    : (1.0 - (breathQuantized * 0.018 * easeBreathing));

  // ── LAYER 1: Fluid Articulated Multi-Segment Dragon Tail (8 Vertebrae Chain) ──
  _drawEnderDragonTail(ctx, r, tailsImg, TAIL_SEGMENTS, segmentRelAngles, -heaveX * 0.4);

  // ── LAYER 2: Animated Dragon Wings Attached to Back (Dragon-wings-sprite-sheet.png) ──
  const customSkin = (typeof state !== 'undefined' && state.skinCustomizations?.enderDragon) || {};
  const wingScaleMult = customSkin.wingScale ?? (enderDragonConfig.wingScale || 5.2);
  const wingDrawSize = r * wingScaleMult * (1.0 + (isSmoothKinematics ? breathCycle * 0.02 : breathQuantized * 0.02 * easeBreathing)); // Prominent wide dragon wingspan
  if (wingsImg && wingsImg.complete && wingsImg.naturalWidth > 0) {
    ctx.save();
    ctx.translate(-r * 0.15 - heaveX * 0.8, -heaveY * 0.4); // Attach wings to back spine with discrete breath heave
    ctx.rotate(Math.PI / 2 + (isSmoothKinematics ? breathCycle * 0.04 : breathQuantized * 0.04 * easeBreathing)); // Align lateral wing spread (leading bone forward +X, scalloped webbing trailing -X) with subtle pitch flare
    ctx.imageSmoothingEnabled = false; // Authentic pixel art
    ctx.drawImage(
      wingsImg,
      fBox.sx, fBox.sy, fBox.sw, fBox.sh,
      -wingDrawSize / 2, -wingDrawSize / 2, wingDrawSize, wingDrawSize
    );
    ctx.restore();
  } else {
    _drawProceduralWings(ctx, r, isSwooping);
  }

  // ── LAYER 3: Obsidian Circle Body Model (Head & Eyes at +X, Spine at -X) ──
  _drawEnderDragonCircleBody(ctx, r, isPreview, breathScaleX, breathScaleY, heaveX + chestExpansionX * 0.4, heaveY);

  // ── LAYER 4: Retro Arcade Exhale Void Vapor Mist Puffs ──
  if (!isSwooping && !isChanneling && cycleAngle >= Math.PI) {
    const exhaleProgress = (cycleAngle - Math.PI) / Math.PI;
    const exhaleStep = Math.min(3, Math.floor(exhaleProgress * 4));
    _drawRetroBreathVapor(ctx, r, exhaleStep, heaveX + chestExpansionX, heaveY);
  }

  // ── LAYER 5: Minecraft Dragon's Breath Maw Charging & Discharge Particles (Skill 1) ──
  if (fighter.aiState === 'FIREBALL_SPIT' && fighter.stateTimer !== undefined) {
    _drawMinecraftMawChargingBreath(ctx, r, fighter.stateTimer, fighter.isBreathingFire !== false);
  } else if (fighter.aiState === 'PERCH_GROUNDED' && fighter.perchBreathTimer !== undefined && fighter.perchBreathTimer <= 14) {
    _drawMinecraftMawChargingBreath(ctx, r, fighter.perchBreathTimer + 8, false);
  }

  // Status overlays & hit flash
  FighterRenderer.drawStatusOverlays(ctx, fighter);

  ctx.restore();
}

/**
 * Minecraft Dragon's Breath Swirling Maw Charging & Active Discharge Animation
 * Renders crackling Minecraft dragon_breath pixel star-cluster particles flaring from the snout
 */
function _drawMinecraftMawChargingBreath(ctx, r, stateTimer, isContinuous = false) {
  const baseNx = r * 0.84;
  const baseNy = r * 0.20;
  const time = (typeof state !== 'undefined' && state.frameCount) ? state.frameCount : Math.floor(Date.now() / 16);
  const progress = isContinuous ? 1.0 : Math.min(1.0, Math.max(0, (18 - stateTimer) / 10));
  const sprites = _getMinecraftBreathSprites();

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const P = 2.0;
  const particleCount = 12;
  const spiralRadius = r * (isContinuous ? 0.42 : (0.65 * (1.0 - progress * 0.72)));
  const animTime = isContinuous ? (time * 0.26) : (progress * Math.PI * 3.5);

  for (let i = 0; i < particleCount; i++) {
    const dist = spiralRadius * (0.28 + (i % 4) * 0.22);
    const angle = (i / particleCount) * Math.PI * 2 + animTime;
    const px = Math.round((baseNx + Math.cos(angle) * dist) / P) * P;
    const py = Math.round((baseNy + Math.sin(angle) * dist) / P) * P;
    const pAlpha = isContinuous ? (0.65 + (i % 3) * 0.12) : Math.min(1.0, 0.48 + progress * 0.52);

    if (sprites) {
      const stage = (i + Math.floor(time * 0.25)) % 3;
      const sprite = sprites.starSprites[i % sprites.starSprites.length][stage];
      const drawS = Math.round((12 + (i % 2) * 4) / P) * P;
      ctx.globalAlpha = pAlpha;
      ctx.drawImage(sprite, px - drawS / 2, py - drawS / 2, drawS, drawS);
    } else {
      const pSize = P * (1.5 + (i % 2) * 0.5);
      ctx.fillStyle = i % 2 === 0 ? '#E82CE8' : '#FF5EFF';
      ctx.globalAlpha = pAlpha;
      ctx.fillRect(px - pSize / 2, py - pSize / 2, pSize, pSize);
    }
  }

  // Bright magenta/white aperture core spark at snout
  if (isContinuous || progress > 0.35) {
    const coreAlpha = isContinuous ? (0.85 + Math.sin(time * 0.3) * 0.12) : Math.min(1.0, (progress - 0.35) * 1.6);
    const coreSize = Math.round((P * (2.5 + (isContinuous ? Math.sin(time * 0.4) * 0.5 : progress * 1.5))) / P) * P;
    ctx.fillStyle = '#E82CE8';
    ctx.globalAlpha = coreAlpha * 0.80;
    ctx.fillRect(Math.round(baseNx / P) * P - coreSize, Math.round(baseNy / P) * P - coreSize, coreSize * 2, coreSize * 2);

    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = coreAlpha * 0.95;
    ctx.fillRect(Math.round(baseNx / P) * P - P, Math.round(baseNy / P) * P - P, P * 2, P * 2);
  }

  ctx.restore();
}

// ─────────────────────────────────────────────
// MINECRAFT DRAGON'S BREATH ENGINE (LINGERING AREA EFFECT CLOUD)
// Pre-baked offscreen sprite caches (Rule 35 — zero per-frame pixel-grid fillRect floods):
// 1. Classic Minecraft 8x8 `dragon_breath` magenta/violet pixel star-cluster sprites (3 palettes x 4 stages)
// 2. Classic Minecraft lavender-grey `effect` potion swirl ring glyphs (4 orientations/stages)
// 3. Seeded pre-baked ground cloud carpet canvases (3 variants, 1-blit ground layer)
// ─────────────────────────────────────────────

const MC_BREATH_STAR_MATRICES = [
  [
    '..#..#..',
    '#..##..#',
    '..####..',
    '.###.###',
    '.######.',
    '..####..',
    '.#.##.#.',
    '#......#',
  ],
  [
    '.#....#.',
    '...##...',
    '.#.##.#.',
    '.##..##.',
    '.#.##.#.',
    '...##...',
    '.#....#.',
    '........',
  ],
  [
    '........',
    '..#..#..',
    '...##...',
    '.#....#.',
    '...##...',
    '.#....#.',
    '....#...',
    '........',
  ],
  [
    '........',
    '........',
    '..#..#..',
    '...#....',
    '.#...#..',
    '........',
    '..#.....',
    '........',
  ],
];

const MC_POTION_SWIRL_MATRICES = [
  [
    '...######...',
    '.##......##.',
    '#...####...#',
    '#..#....#..#',
    '#.#..##..#.#',
    '#.#.#....#.#',
    '#.#..###.#.#',
    '#..#......#.',
    '.#..####.#..',
    '..##....#...',
    '....####....',
    '............',
  ],
  [
    '....####....',
    '..##....##..',
    '.#..####..#.',
    '#..#....#..#',
    '#.#..##..#.#',
    '#.#....#.#.#',
    '#..#..#..#..',
    '.#..##..#...',
    '..##...#....',
    '....###.....',
    '............',
    '............',
  ],
  [
    '....###.....',
    '..##...##...',
    '.#..###..#..',
    '#..#...#..#.',
    '#.#..#..#.#.',
    '#.#.....#.#.',
    '.#..###..#..',
    '..#.....#...',
    '...####.....',
    '............',
    '............',
    '............',
  ],
  [
    '...#####....',
    '.##.....##..',
    '#...###...#.',
    '#..#...#..#.',
    '.#..#.#..#..',
    '..#..#..#...',
    '...#...#....',
    '....###.....',
    '............',
    '............',
    '............',
    '............',
  ],
];

const MC_BREATH_PALETTES = [
  ['#9E08AD', '#D414DF', '#FF52FF'],
  ['#B80EC9', '#E82CE8', '#FF7AFF'],
  ['#7D058B', '#B80FC7', '#E638F0'],
];

let _mcBreathSpritesCache = null;

function _hashBreathFloat(i, seed) {
  let n = (Math.imul(i, 374761393) + Math.imul(seed, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177) | 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function _bakeMatrixCanvas(matrix, pxSize, colorResolver) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const c = document.createElement('canvas');
  c.width = cols * pxSize;
  c.height = rows * pxSize;
  const octx = c.getContext('2d');
  octx.imageSmoothingEnabled = false;
  for (let r = 0; r < rows; r++) {
    const row = matrix[r];
    for (let col = 0; col < cols; col++) {
      if (row[col] !== '#') continue;
      octx.fillStyle = colorResolver(col, r, cols, rows);
      octx.fillRect(col * pxSize, r * pxSize, pxSize, pxSize);
    }
  }
  return c;
}

function _getMinecraftBreathSprites() {
  if (_mcBreathSpritesCache) return _mcBreathSpritesCache;
  if (typeof document === 'undefined') return null;

  const pxSize = 2;
  const starSprites = MC_BREATH_PALETTES.map((pal) =>
    MC_BREATH_STAR_MATRICES.map((mat) =>
      _bakeMatrixCanvas(mat, pxSize, (col, r, cols, rows) => {
        const d = Math.abs(col - cols * 0.5 + 0.5) + Math.abs(r - rows * 0.5 + 0.5);
        if (d <= 1.8) return pal[2];
        if (d <= 3.2) return pal[1];
        return pal[0];
      })
    )
  );

  const swirlSprites = MC_POTION_SWIRL_MATRICES.map((mat) =>
    _bakeMatrixCanvas(mat, pxSize, (col, r) => {
      if (r < 4 && col < 6) return '#B8B4D2';
      if (r > 7 || col > 8) return '#726E8A';
      return '#9894B2';
    })
  );

  // Pre-bake 3 airy 200x200 Minecraft dragon_breath ground carpet variants (1-quad blit per pool, sparse stars matching Minecraft!)
  const poolBaseCanvases = [0, 1, 2].map((variant) => {
    const size = 200;
    const cx = size * 0.5;
    const cy = size * 0.5;
    const rBase = 84;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const octx = c.getContext('2d');
    octx.imageSmoothingEnabled = false;

    const total = 26;
    const goldenAngle = 2.39996323;
    for (let i = 0; i < total; i++) {
      const seed = 31 + variant * 97;
      // Airy stratified spiral leaving clean negative space between individual 8x8 star clusters
      const baseU = Math.sqrt((i + 0.5) / total);
      const u = Math.max(0.06, Math.min(0.96, baseU + (_hashBreathFloat(i, seed) - 0.5) * 0.14));
      const ang = i * goldenAngle + (_hashBreathFloat(i, seed + 13) - 0.5) * 0.55;
      const dist = rBase * u;
      const dx = Math.round((cx + Math.cos(ang) * dist) / 2) * 2;
      const dy = Math.round((cy + Math.sin(ang) * dist * 0.85) / 2) * 2;

      const stage = u < 0.48 ? 0 : (u < 0.76 ? 1 : (u < 0.90 ? 2 : 3));
      const sprite = starSprites[(i + variant) % starSprites.length][stage];
      const spriteScale = u < 0.50 ? 16 : (u < 0.82 ? 14 : 12);
      octx.globalAlpha = Math.max(0.45, Math.min(0.96, 0.96 - Math.pow(u, 2.2) * 0.48));
      octx.drawImage(sprite, dx - spriteScale / 2, dy - spriteScale / 2, spriteScale, spriteScale);
    }
    octx.globalAlpha = 1.0;
    return c;
  });

  _mcBreathSpritesCache = { starSprites, swirlSprites, poolBaseCanvases };
  return _mcBreathSpritesCache;
}

// Pre-seeded 4 Live Rising Minecraft dragon_breath Star Clusters per pool (kept lean for 60 FPS mobile)
const MC_DRAGON_BREATH_PARTICLES = (() => {
  const particles = [];
  const count = 4;
  for (let i = 0; i < count; i++) {
    const angle = +((i * 2.39996) % (Math.PI * 2)).toFixed(3);
    const distRatio = +(0.18 + Math.sqrt((i + 0.5) / count) * 0.68).toFixed(3);
    const speed = +(0.012 + ((i * 7) % 4) * 0.0018).toFixed(4);
    const maxRise = 12 + ((i * 7) % 12);
    const swayAmp = +(2.0 + (i % 3) * 0.8).toFixed(1);
    const swayFreq = +(0.04 + (i % 4) * 0.008).toFixed(3);
    const swayPhase = +((i * 1.57) % (Math.PI * 2)).toFixed(2);
    const baseSize = 12 + (i % 2) * 2;
    const lifeOffset = +(i / count).toFixed(3);
    particles.push({ angle, distRatio, speed, maxRise, swayAmp, swayFreq, swayPhase, baseSize, lifeOffset });
  }
  return particles;
})();

// Pre-seeded 1 Rising Minecraft Grey-Lavender Potion Swirl Ring per pool (matches lean FPS budget)
const MC_BREATH_SWIRLS = (() => {
  const swirls = [];
  const count = 1;
  for (let i = 0; i < count; i++) {
    const angle = +(0.45).toFixed(3);
    const distRatio = 0.35;
    const speed = 0.009;
    const maxRise = 18;
    const lifeOffset = 0.25;
    swirls.push({ angle, distRatio, speed, maxRise, lifeOffset });
  }
  return swirls;
})();

/**
 * Draws the Authentic Minecraft Dragon's Breath Area Effect Cloud on the arena ground.
 * Combines pre-baked magenta/purple `dragon_breath` pixel star-cluster carpet + rising star
 * bursts + floating grey-lavender Minecraft potion swirl rings.
 */
export function drawDragonAcidPool(ctx, pool) {
  if (!ctx || !pool || pool.duration <= 0) return;
  const radius = pool.radius || 70;
  const maxDur = pool.maxDuration || 180;
  const inAlpha = Math.min(1.0, (maxDur - pool.duration) / 10);
  const outAlpha = Math.min(1.0, pool.duration / 28);
  const alpha = inAlpha * outAlpha;
  if (alpha <= 0.005) return;

  const expandP = Math.min(1.0, (maxDur - pool.duration) / 14);
  const curRadius = radius * (0.82 + 0.18 * Math.sin(expandP * Math.PI * 0.5));
  const time = (typeof state !== 'undefined' && state.frameCount) ? state.frameCount : Math.floor(Date.now() / 16);
  const sprites = _getMinecraftBreathSprites();

  ctx.save();
  ctx.translate(pool.x, pool.y);
  ctx.imageSmoothingEnabled = false;

  if (!sprites) {
    // Headless fallback
    ctx.fillStyle = '#D414DF';
    ctx.globalAlpha = alpha * 0.45;
    ctx.fillRect(-curRadius * 0.5, -curRadius * 0.4, curRadius, curRadius * 0.8);
    ctx.restore();
    return;
  }

  const P = 2.0;
  const snap = (v) => Math.round(v / P) * P;
  const variant = Math.abs(Math.floor((pool.x || 0) + (pool.y || 0))) % sprites.poolBaseCanvases.length;

  // ── LAYER 1: Pre-Baked Airy Magenta `dragon_breath` Star-Cluster Carpet (1-Blit GPU Quad, bounded within curRadius) ──
  const carpetDrawSize = Math.round((curRadius * 2.08) / P) * P;
  ctx.globalAlpha = alpha * 0.94;
  ctx.drawImage(
    sprites.poolBaseCanvases[variant],
    -carpetDrawSize / 2,
    -carpetDrawSize / 2,
    carpetDrawSize,
    carpetDrawSize
  );

  // ── LAYER 2: Lean Live Rising & Flickering `dragon_breath` Star-Clusters ──
  const pCount = MC_DRAGON_BREATH_PARTICLES.length;
  for (let i = 0; i < pCount; i++) {
    const p = MC_DRAGON_BREATH_PARTICLES[i];
    const pLife = (time * p.speed + p.lifeOffset + variant * 0.31) % 1.0;
    const x0 = Math.cos(p.angle) * (curRadius * p.distRatio);
    const y0 = Math.sin(p.angle) * (curRadius * p.distRatio * 0.82);
    const sx = snap(x0 + Math.sin(time * p.swayFreq + p.swayPhase) * p.swayAmp);
    const sy = snap(y0 - pLife * p.maxRise);

    const pIn = Math.min(1.0, pLife * 5.0);
    const pOut = Math.max(0, 1.0 - Math.pow(pLife, 2.0));
    const pAlpha = alpha * pIn * pOut * 0.95;
    if (pAlpha <= 0.03) continue;

    const stage = Math.min(3, Math.floor(pLife * 4));
    const sprite = sprites.starSprites[(i + variant) % sprites.starSprites.length][stage];
    const drawS = snap(p.baseSize * (1.08 - pLife * 0.25));
    ctx.globalAlpha = pAlpha;
    ctx.drawImage(sprite, sx - drawS / 2, sy - drawS / 2, drawS, drawS);
  }

  // ── LAYER 3: Rising Minecraft Grey-Lavender Potion Swirl Rings ──
  const sCount = MC_BREATH_SWIRLS.length;
  for (let i = 0; i < sCount; i++) {
    const sw = MC_BREATH_SWIRLS[i];
    const sLife = (time * sw.speed + sw.lifeOffset) % 1.0;
    const x0 = Math.cos(sw.angle + variant * 0.7) * (curRadius * sw.distRatio);
    const y0 = Math.sin(sw.angle + variant * 0.7) * (curRadius * sw.distRatio * 0.82);
    const sx = snap(x0 + Math.sin(time * 0.04 + i * 1.9) * 4);
    const sy = snap(y0 - 4 - sLife * sw.maxRise);

    const sAlpha = alpha * Math.sin(sLife * Math.PI) * 0.85;
    if (sAlpha <= 0.03) continue;

    const stage = Math.min(3, Math.floor(sLife * 4));
    const swirlCanvas = sprites.swirlSprites[(i + stage) % sprites.swirlSprites.length];
    const swirlDraw = snap(18 + (1.0 - sLife) * 4);
    ctx.globalAlpha = sAlpha;
    ctx.drawImage(swirlCanvas, sx - swirlDraw / 2, sy - swirlDraw / 2, swirlDraw, swirlDraw);
  }

  ctx.restore();
}

/**
 * Renders the Authentic Minecraft Dragon Fireball Projectile
 * Features:
 * - Faceted obsidian / bedrock core cube
 * - Orbiting swirling square magenta flame facets
 * - Trailing Minecraft dragon_breath square pixel puffs
 * - Central radiant amethyst core spark
 */
export function drawMinecraftDragonFireball(ctx, proj, isSecondary = false) {
  if (!ctx || !proj) return;
  const r = proj.radius || (isSecondary ? 12 : 16);
  const time = (typeof state !== 'undefined' && state.frameCount) ? state.frameCount : Math.floor(Date.now() / 16);
  const vx = proj.vx || 0;
  const vy = proj.vy || 0;
  const moveAngle = Math.atan2(vy, vx);

  ctx.save();
  ctx.translate(proj.x, proj.y);
  ctx.imageSmoothingEnabled = false;

  const P = 2.0;
  const snap = (v) => Math.round(v / P) * P;

  // 1. Trailing Minecraft Dragon Breath Square Puffs
  const trailPuffs = isSecondary ? 3 : 5;
  for (let k = 1; k <= trailPuffs; k++) {
    const dist = k * (r * 0.6);
    const wobble = Math.sin(time * 0.22 + k) * (P * 1.5);
    const perpAngle = moveAngle + Math.PI / 2;
    const tx = -Math.cos(moveAngle) * dist + Math.cos(perpAngle) * wobble;
    const ty = -Math.sin(moveAngle) * dist + Math.sin(perpAngle) * wobble;
    const puffSize = Math.max(P * 2, snap(r * (0.55 - k * 0.08)));
    const trailAlpha = (1.0 - k / (trailPuffs + 1)) * 0.75;

    // Outer dark violet
    ctx.fillStyle = k > 2 ? '#4A044E' : '#701A75';
    ctx.globalAlpha = trailAlpha * 0.85;
    ctx.fillRect(snap(tx) - puffSize / 2, snap(ty) - puffSize / 2, puffSize, puffSize);

    // Inner magenta puff
    if (puffSize >= P * 3) {
      const midPuff = puffSize - P * 2;
      ctx.fillStyle = '#C026D3';
      ctx.globalAlpha = trailAlpha;
      ctx.fillRect(snap(tx) - midPuff / 2, snap(ty) - midPuff / 2, midPuff, midPuff);
    }
  }

  // 2. Swirling Orbiting Flame Facets (Authentic Minecraft Fireball Corona)
  const orbitCount = 4;
  for (let o = 0; o < orbitCount; o++) {
    const orbitAngle = (o / orbitCount) * Math.PI * 2 + time * 0.12;
    const orbitDist = r * (0.85 + 0.15 * Math.sin(time * 0.18 + o));
    const ox = snap(Math.cos(orbitAngle) * orbitDist);
    const oy = snap(Math.sin(orbitAngle) * orbitDist);
    const fSize = snap(P * (2.5 + (o % 2)));

    ctx.fillStyle = o % 2 === 0 ? '#D946EF' : '#E879F9';
    ctx.globalAlpha = 0.85;
    ctx.fillRect(ox - fSize / 2, oy - fSize / 2, fSize, fSize);

    // White hot core pixel
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.95;
    ctx.fillRect(ox - P / 2, oy - P / 2, P, P);
  }

  // 3. Faceted Obsidian Bedrock Core Cube / Octagon
  const coreR = snap(r * 0.72);
  const halfC = coreR / 2;

  // Dark obsidian outer boundary
  ctx.fillStyle = '#120C18';
  ctx.globalAlpha = 1.0;
  ctx.fillRect(-coreR, -halfC, coreR * 2, coreR);
  ctx.fillRect(-halfC, -coreR, coreR, coreR * 2);

  // Inset bedrock obsidian facet
  const innerC = snap(coreR * 0.75);
  const innerHalf = innerC / 2;
  ctx.fillStyle = '#1F132B';
  ctx.fillRect(-innerC, -innerHalf, innerC * 2, innerC);
  ctx.fillRect(-innerHalf, -innerC, innerC, innerC * 2);

  // Amethyst void seams
  const seamW = snap(coreR * 0.55);
  ctx.fillStyle = '#9333EA';
  ctx.fillRect(-seamW, -P, seamW * 2, P * 2);
  ctx.fillRect(-P, -seamW, P * 2, seamW * 2);

  // Core radiant spark cross
  ctx.fillStyle = '#F5D0FE';
  ctx.fillRect(-P * 1.5, -P * 0.5, P * 3, P);
  ctx.fillRect(-P * 0.5, -P * 1.5, P, P * 3);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-P * 0.5, -P * 0.5, P, P);

  ctx.restore();
}

/**
 * Renders the Minecraft Dragon's Breath Direct Exhale Stream
 * Cascades forward as an expanding cone of pre-baked magenta dragon_breath star-clusters + potion swirls
 */
export function drawMinecraftBreathStream(ctx, proj) {
  if (!ctx || !proj) return;
  const time = (typeof state !== 'undefined' && state.frameCount) ? state.frameCount : Math.floor(Date.now() / 16);
  const vx = proj.vx || 0;
  const vy = proj.vy || 0;
  const moveAngle = Math.atan2(vy, vx);
  const r = proj.radius || 14;
  const sprites = _getMinecraftBreathSprites();

  ctx.save();
  ctx.translate(proj.x, proj.y);
  ctx.rotate(moveAngle);
  ctx.imageSmoothingEnabled = false;

  const P = 2.0;
  const snap = (v) => Math.round(v / P) * P;

  if (!sprites) {
    ctx.fillStyle = '#D414DF';
    ctx.globalAlpha = 0.85;
    const hs = snap(r * 0.9);
    ctx.fillRect(-hs / 2, -hs / 2, hs, hs);
    ctx.restore();
    return;
  }

  // Trailing expanding cone of magenta dragon_breath star-cluster sprites (lean 3-step cone for 60 FPS)
  const streamSteps = 3;
  for (let s = streamSteps; s >= 1; s--) {
    const backX = -s * (r * 0.65);
    const coneSpread = (s / streamSteps) * (r * 0.52);
    const drawS = snap(r * (0.95 + s * 0.12));
    const stepAlpha = (1.0 - (s - 1) / streamSteps) * 0.88;
    const stage = Math.min(3, Math.floor((s - 1) * 0.9));

    const yOffsets = s >= 2 ? [-coneSpread, coneSpread] : [0];
    for (let j = 0; j < yOffsets.length; j++) {
      const yOff = yOffsets[j];
      const wobble = Math.sin(time * 0.25 + s * 1.4 + j * 2.1) * P * 1.5;
      const px = snap(backX);
      const py = snap(yOff + wobble);
      const sprite = sprites.starSprites[(s + j) % sprites.starSprites.length][stage];

      ctx.globalAlpha = stepAlpha;
      ctx.drawImage(sprite, px - drawS / 2, py - drawS / 2, drawS, drawS);
    }
  }

  // Trailing Minecraft grey-lavender potion swirl ring near mid-plume
  const swirlIdx = Math.floor(time * 0.15) % sprites.swirlSprites.length;
  const swirlDraw = snap(r * 1.25);
  ctx.globalAlpha = 0.78;
  ctx.drawImage(
    sprites.swirlSprites[swirlIdx],
    snap(-r * 1.15) - swirlDraw / 2,
    snap(Math.sin(time * 0.18) * 3) - swirlDraw / 2,
    swirlDraw,
    swirlDraw
  );

  // Leading dense cluster burst at stream head
  const headDraw = snap(r * 1.45);
  ctx.globalAlpha = 0.96;
  ctx.drawImage(sprites.starSprites[1][0], -headDraw / 2, -headDraw / 2, headDraw, headDraw);
  ctx.globalAlpha = 0.85;
  ctx.drawImage(sprites.starSprites[0][1], snap(P * 2) - headDraw * 0.45, -headDraw * 0.45, headDraw * 0.9, headDraw * 0.9);

  ctx.restore();
}

// Pre-seeded 24 Minecraft Lightshow Ray Beams (Reference: Minecraft Ender Dragon Death Animation)
const MC_DEATH_BEAMS = [
  { baseAngle: 0.10, rotSpeed: 0.015, width: 0.20, lenMult: 1.1, startT: 0.00 },
  { baseAngle: 1.15, rotSpeed: -0.012, width: 0.24, lenMult: 1.2, startT: 0.04 },
  { baseAngle: 2.20, rotSpeed: 0.018, width: 0.18, lenMult: 1.0, startT: 0.08 },
  { baseAngle: 3.35, rotSpeed: -0.014, width: 0.25, lenMult: 1.3, startT: 0.11 },
  { baseAngle: 4.40, rotSpeed: 0.020, width: 0.22, lenMult: 1.1, startT: 0.14 },
  { baseAngle: 5.50, rotSpeed: -0.016, width: 0.19, lenMult: 1.0, startT: 0.17 },
  { baseAngle: 0.65, rotSpeed: 0.022, width: 0.26, lenMult: 1.3, startT: 0.20 },
  { baseAngle: 1.70, rotSpeed: -0.018, width: 0.21, lenMult: 1.1, startT: 0.24 },
  { baseAngle: 2.80, rotSpeed: 0.016, width: 0.23, lenMult: 1.2, startT: 0.28 },
  { baseAngle: 3.90, rotSpeed: -0.020, width: 0.22, lenMult: 1.2, startT: 0.32 },
  { baseAngle: 4.95, rotSpeed: 0.014, width: 0.25, lenMult: 1.1, startT: 0.36 },
  { baseAngle: 5.95, rotSpeed: -0.022, width: 0.20, lenMult: 1.3, startT: 0.40 },
  { baseAngle: 0.35, rotSpeed: 0.019, width: 0.27, lenMult: 1.4, startT: 0.44 },
  { baseAngle: 1.45, rotSpeed: -0.015, width: 0.22, lenMult: 1.2, startT: 0.48 },
  { baseAngle: 2.50, rotSpeed: 0.021, width: 0.24, lenMult: 1.3, startT: 0.52 },
  { baseAngle: 3.60, rotSpeed: -0.017, width: 0.21, lenMult: 1.3, startT: 0.56 },
  { baseAngle: 4.70, rotSpeed: 0.023, width: 0.28, lenMult: 1.4, startT: 0.60 },
  { baseAngle: 5.75, rotSpeed: -0.019, width: 0.23, lenMult: 1.2, startT: 0.64 },
  { baseAngle: 0.90, rotSpeed: 0.025, width: 0.29, lenMult: 1.5, startT: 0.68 },
  { baseAngle: 1.95, rotSpeed: -0.021, width: 0.25, lenMult: 1.3, startT: 0.72 },
  { baseAngle: 3.05, rotSpeed: 0.024, width: 0.27, lenMult: 1.4, startT: 0.75 },
  { baseAngle: 4.15, rotSpeed: -0.022, width: 0.26, lenMult: 1.4, startT: 0.78 },
  { baseAngle: 5.20, rotSpeed: 0.026, width: 0.28, lenMult: 1.5, startT: 0.81 },
  { baseAngle: 6.10, rotSpeed: -0.024, width: 0.26, lenMult: 1.3, startT: 0.84 },
];

/**
 * Renders Authentic Minecraft Ender Dragon Death Sequence (Reference: Minecraft Ender Dragon Death Animation)
 * 1. Stationary Hover / Ascension with steady rhythmic wing flapping
 * 2. Rapidly multiplying distinct piercing purple/magenta/white searchlight rays ("The Lightshow")
 * 3. Billowing dark purple square smoke clusters
 * 4. Progressive white overexposure engulfment
 * 5. Culminating in supernova flash and XP Orb explosion
 */
export function drawEnderDragonDeathDisintegration(ctx, effect) {
  if (!ctx || !effect) return;

  const r = effect.r || enderDragonConfig.r || 36;
  const progress = Math.min(1.0, Math.max(0, (effect.frameTimer || 0) / (effect.totalFrames || 130)));
  const facingLeft = Boolean(effect.facingLeft);
  const angle = effect.rotation || 0;

  // Gentle death tremor increasing at final stages
  const tremor = (progress > 0.6 ? (progress - 0.6) * 4.0 : 0);
  const jx = (Math.random() - 0.5) * tremor;
  const jy = (Math.random() - 0.5) * tremor;

  ctx.save();
  ctx.translate(jx, jy);

  // ── LAYER -1: Distinct Piercing Minecraft Volumetric Light Rays ──
  const maxReach = r * (2.2 + progress * 5.5);
  ctx.save();

  for (let i = 0; i < MC_DEATH_BEAMS.length; i++) {
    const beam = MC_DEATH_BEAMS[i];
    if (progress < beam.startT) continue;

    const beamProg = (progress - beam.startT) / (1.0 - beam.startT);
    const beamAngle = beam.baseAngle + (effect.frameTimer || 0) * beam.rotSpeed;
    const beamLen = maxReach * beam.lenMult * Math.min(1.0, beamProg * 1.4);
    const alpha = Math.min(1.0, beamProg * 1.5);

    // Sleek expanding beam widths (narrow anchor at body -> crisp tapered ray)
    const baseW = beam.width * (0.28 + beamProg * 0.15);
    const outerW = beam.width * (0.55 + beamProg * 0.45);
    const baseR = r * 0.25;

    const cosBaseL = Math.cos(beamAngle - baseW * 0.5);
    const sinBaseL = Math.sin(beamAngle - baseW * 0.5);
    const cosBaseR = Math.cos(beamAngle + baseW * 0.5);
    const sinBaseR = Math.sin(beamAngle + baseW * 0.5);

    const cosOuterL = Math.cos(beamAngle - outerW * 0.5);
    const sinOuterL = Math.sin(beamAngle - outerW * 0.5);
    const cosOuterR = Math.cos(beamAngle + outerW * 0.5);
    const sinOuterR = Math.sin(beamAngle + outerW * 0.5);

    // 1. Outer Deep Magenta Corona Flare
    const coronaOuterW = outerW * 1.25;
    const cosCoronaL = Math.cos(beamAngle - coronaOuterW * 0.5);
    const sinCoronaL = Math.sin(beamAngle - coronaOuterW * 0.5);
    const cosCoronaR = Math.cos(beamAngle + coronaOuterW * 0.5);
    const sinCoronaR = Math.sin(beamAngle + coronaOuterW * 0.5);

    ctx.fillStyle = `rgba(162, 28, 175, ${alpha * 0.30})`;
    ctx.beginPath();
    ctx.moveTo(cosBaseL * (baseR * 1.3), sinBaseL * (baseR * 1.3));
    ctx.lineTo(cosCoronaL * (beamLen * 1.03), sinCoronaL * (beamLen * 1.03));
    ctx.lineTo(cosCoronaR * (beamLen * 1.03), sinCoronaR * (beamLen * 1.03));
    ctx.lineTo(cosBaseR * (baseR * 1.3), sinBaseR * (baseR * 1.3));
    ctx.closePath();
    ctx.fill();

    // 2. Mid Radiant Violet Searchlight Shaft
    ctx.fillStyle = `rgba(232, 121, 249, ${alpha * 0.55})`;
    ctx.beginPath();
    ctx.moveTo(cosBaseL * baseR, sinBaseL * baseR);
    ctx.lineTo(cosOuterL * beamLen, sinOuterL * beamLen);
    ctx.lineTo(cosOuterR * beamLen, sinOuterR * beamLen);
    ctx.lineTo(cosBaseR * baseR, sinBaseR * baseR);
    ctx.closePath();
    ctx.fill();

    // 3. Inner White-Hot Core Shaft
    const coreBaseW = baseW * 0.40;
    const coreOuterW = outerW * 0.40;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.90})`;
    ctx.beginPath();
    ctx.moveTo(Math.cos(beamAngle - coreBaseW * 0.5) * (baseR * 0.5), Math.sin(beamAngle - coreBaseW * 0.5) * (baseR * 0.5));
    ctx.lineTo(Math.cos(beamAngle - coreOuterW * 0.5) * (beamLen * 0.97), Math.sin(beamAngle - coreOuterW * 0.5) * (beamLen * 0.97));
    ctx.lineTo(Math.cos(beamAngle + coreOuterW * 0.5) * (beamLen * 0.97), Math.sin(beamAngle + coreOuterW * 0.5) * (beamLen * 0.97));
    ctx.lineTo(Math.cos(beamAngle + coreBaseW * 0.5) * (baseR * 0.5), Math.sin(beamAngle + coreBaseW * 0.5) * (baseR * 0.5));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // ── LAYER 0: The Dragon Model (Wings Flapping + Body + Tail) ──
  const bodyAlpha = Math.max(0, 1.0 - Math.pow(progress, 3.2));
  if (bodyAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = bodyAlpha;
    ctx.rotate(angle);
    if (facingLeft) {
      ctx.scale(1, -1);
    }

    const wingsImg = getEnderDragonWingsSheet();
    const tailsImg = getEnderDragonTailsSheet();

    // 1. Tail (Remains attached and extends backward)
    const segmentRelAngles = new Array(TAIL_SEGMENTS.length).fill(0);
    _drawEnderDragonTail(ctx, r, tailsImg, TAIL_SEGMENTS, segmentRelAngles, 0);

    // 2. Wings (Flapping steadily at majestic pace like in Minecraft death animation)
    const wingTicks = 4;
    const frameIdx = Math.floor((effect.frameTimer || 0) / wingTicks) % WING_FRAMES.length;
    const fBox = WING_FRAMES[frameIdx] || WING_FRAMES[0];

    const customSkin = (typeof state !== 'undefined' && state.skinCustomizations?.enderDragon) || {};
    const wingScaleMult = customSkin.wingScale ?? (enderDragonConfig.wingScale || 5.2);
    const wingDrawSize = r * wingScaleMult;

    if (wingsImg && wingsImg.complete && wingsImg.naturalWidth > 0) {
      ctx.save();
      ctx.translate(-r * 0.15, 0);
      ctx.rotate(Math.PI / 2);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        wingsImg,
        fBox.sx, fBox.sy, fBox.sw, fBox.sh,
        -wingDrawSize / 2, -wingDrawSize / 2, wingDrawSize, wingDrawSize
      );
      ctx.restore();
    } else {
      _drawProceduralWings(ctx, r, false);
    }

    // 3. Dragon Circle Body Model
    drawEnderDragonPixelBody(ctx, r, true, 1.0, 1.0, 0, 0);

    // 4. White-Out Flash Overexposure as Light Engulfs Body
    if (progress > 0.30) {
      const flashAlpha = Math.min(0.95, (progress - 0.30) * 1.5);
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.06, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  // ── LAYER 1: Billowing Minecraft Purple Smoke Particles ──
  const smokeCount = Math.floor(8 + progress * 24);
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  for (let s = 0; s < smokeCount; s++) {
    const seed = s * 37.1 + (effect.frameTimer || 0) * 0.12;
    const smokeLife = ((seed % 1.0) + 1.0) % 1.0;
    const spawnAngle = (s / smokeCount) * Math.PI * 2 + (Math.sin(s * 7) * 0.8);
    const spawnDist = r * (0.3 + (s % 4) * 0.18);

    const initX = Math.cos(spawnAngle) * spawnDist;
    const initY = Math.sin(spawnAngle) * spawnDist;

    // Billow upward and expand outward
    const posX = Math.round(initX + Math.sin(seed * 3) * (r * 0.9));
    const posY = Math.round(initY - smokeLife * (r * 2.4 + (s % 3) * 12));
    const size = Math.round(3 + smokeLife * 6);

    const smokePalette = ['#3B0764', '#581C87', '#701A75', '#A21CAF', '#C026D3', '#E879F9'];
    ctx.fillStyle = smokePalette[s % smokePalette.length];
    ctx.globalAlpha = Math.max(0, 0.85 * (1.0 - smokeLife));
    ctx.fillRect(posX - size / 2, posY - size / 2, size, size);
  }
  ctx.restore();

  // ── LAYER 2: Core Supernova Detonation Flare ──
  if (progress > 0.70) {
    ctx.save();
    const novaProg = (progress - 0.70) / 0.30;
    const novaR = r * (0.5 + novaProg * 1.6);
    const novaAlpha = Math.min(1.0, novaProg * 1.8);

    ctx.fillStyle = `rgba(162, 28, 175, ${novaAlpha * 0.50})`;
    ctx.beginPath();
    ctx.arc(0, 0, novaR * 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(245, 208, 254, ${novaAlpha * 0.80})`;
    ctx.beginPath();
    ctx.arc(0, 0, novaR * 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${novaAlpha * 0.98})`;
    ctx.beginPath();
    ctx.arc(0, 0, novaR * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}
