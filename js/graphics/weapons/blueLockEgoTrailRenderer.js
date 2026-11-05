// ─────────────────────────────────────────────
// BLUE LOCK EGO AWAKENING & SPRINT — 18-FRAME EGO AURA SPRITE & MOLTEN LIQUID-PLASMA TRAIL RENDERER
//
// Directly modeled on the Blue Lock Ego Master Architecture:
// 1. EGO AURA STATE (18-Frame Standing & In-Combat Spectral Flame Spire):
//    - ego_aura frames 1 through 18 (Isagi Yoichi Electric Ego Aqua-Mint, Chigiri Red Panther Crimson-Pink)
//    - Rendered directly by drawBlueLockEgoSpectreColumn & drawBlueLockEgoAuraFront (calibrated 1:1 at anchor 128, 164, scale r / 27.0).
// 2. EGO MOVEMENT TRAIL (Molten Liquid-Plasma Wake, Hooked Flame Claws & Electric Lightning):
//    - Directly shares the proven organic 4-stage plasma flame architecture of the Striker Soccer Ball.
//    - Decoupled world-space history nodes with `isBreak` ricochet decoupling (Zero V-wedge on rebounds!)
//    - Body-anchored sculpted plasma core, inward-hooking C-claws & whipping S-curve flame tongues.
//    - Crackling electric lightning filaments, heel ground friction sparks, and high-velocity ember shower.
//
// Complies strictly with:
// - Rule 11: Prohibition of shadowBlur CPU filters.
// - Rule 16: Manga Action Speed Lines & dynamic needle tapers.
// - Rule 24: Manga Ink Trio silhouette standards (face and chest 100% clean).
// - Rule 25: Non-Freezing Active Visual Effects Decay.
// - Rule 26: Clean continuous curves (Zero spoke webs / cobweb meshes).
// - Rule 31: Generous transparent margins with zero rectangular border clipping.
// ─────────────────────────────────────────────

export const EGO_TRAIL_FRAME_COUNT = 12;
export const EGO_AURA_FRAME_COUNT = 18;
export const EGO_AURA_DISAPPEAR_FRAME_COUNT = 12;

const ISAGI_EGO_TRAIL_FRAME_PATHS = Array.from(
  { length: EGO_TRAIL_FRAME_COUNT },
  (_, i) => `Assets/model/isagi/ego_trail/ego_trail-${i + 1}.png`
);

const CHIGIRI_EGO_TRAIL_FRAME_PATHS = Array.from(
  { length: EGO_TRAIL_FRAME_COUNT },
  (_, i) => `Assets/model/chigiri/ego_trail/ego_trail-${i + 1}.png`
);

const ISAGI_EGO_AURA_FRAME_PATHS = Array.from(
  { length: EGO_AURA_FRAME_COUNT },
  (_, i) => `Assets/model/isagi/ego_aura/ego_aura-${i + 1}.png`
);

const CHIGIRI_EGO_AURA_FRAME_PATHS = Array.from(
  { length: EGO_AURA_FRAME_COUNT },
  (_, i) => `Assets/model/chigiri/ego_aura/ego_aura-${i + 1}.png`
);

const ISAGI_EGO_AURA_DISAPPEAR_FRAME_PATHS = Array.from(
  { length: EGO_AURA_DISAPPEAR_FRAME_COUNT },
  (_, i) => `Assets/model/isagi/ego_aura_disappear/ego_aura_disappear-${i + 1}.png`
);

const CHIGIRI_EGO_AURA_DISAPPEAR_FRAME_PATHS = Array.from(
  { length: EGO_AURA_DISAPPEAR_FRAME_COUNT },
  (_, i) => `Assets/model/chigiri/ego_aura_disappear/ego_aura_disappear-${i + 1}.png`
);

let _isagiEgoTrailFrames = [];
let _isagiEgoTrailFramesLoading = false;
let _chigiriEgoTrailFrames = [];
let _chigiriEgoTrailFramesLoading = false;

let _isagiEgoAuraFrames = [];
let _isagiEgoAuraFramesLoading = false;
let _chigiriEgoAuraFrames = [];
let _chigiriEgoAuraFramesLoading = false;

let _isagiEgoAuraDisappearFrames = [];
let _isagiEgoAuraDisappearFramesLoading = false;
let _chigiriEgoAuraDisappearFrames = [];
let _chigiriEgoAuraDisappearFramesLoading = false;

function _preloadFrameSequence(paths, targetArr, setLoadingFlag) {
  if (typeof Image === 'undefined') return targetArr;
  setLoadingFlag(true);
  targetArr.length = 0;
  paths.forEach((src, idx) => {
    const img = new Image();
    img.onload = () => {
      targetArr[idx] = img;
    };
    img.onerror = (e) => {
      console.warn(`Failed to load Blue Lock Ego frame ${idx + 1} at ${src}:`, e);
    };
    img.src = `${src}?v=20`;
    targetArr[idx] = img;
  });
  return targetArr;
}

export function _getIsagiEgoTrailFrames() {
  if (
    _isagiEgoTrailFrames.length === EGO_TRAIL_FRAME_COUNT &&
    _isagiEgoTrailFrames.every(img => img && img.complete && ((img.naturalWidth || img.width || 0) > 0))
  ) {
    return _isagiEgoTrailFrames;
  }
  if (!_isagiEgoTrailFramesLoading) {
    _preloadFrameSequence(ISAGI_EGO_TRAIL_FRAME_PATHS, _isagiEgoTrailFrames, v => {
      _isagiEgoTrailFramesLoading = v;
    });
  }
  return _isagiEgoTrailFrames;
}

export function _getChigiriEgoTrailFrames() {
  if (
    _chigiriEgoTrailFrames.length === EGO_TRAIL_FRAME_COUNT &&
    _chigiriEgoTrailFrames.every(img => img && img.complete && ((img.naturalWidth || img.width || 0) > 0))
  ) {
    return _chigiriEgoTrailFrames;
  }
  if (!_chigiriEgoTrailFramesLoading) {
    _preloadFrameSequence(CHIGIRI_EGO_TRAIL_FRAME_PATHS, _chigiriEgoTrailFrames, v => {
      _chigiriEgoTrailFramesLoading = v;
    });
  }
  return _chigiriEgoTrailFrames;
}

export function getBlueLockEgoTrailFrames(fighter) {
  const charId = (fighter && (fighter.characterId || fighter.type))
    ? String(fighter.characterId || fighter.type).toLowerCase()
    : '';
  const theme = (fighter && fighter.color) ? String(fighter.color).toUpperCase() : '';
  if (charId === 'chigiri' || charId === 'barou' || theme === '#EC4899' || theme === '#F43F5E' || theme === '#DC2626') {
    return _getChigiriEgoTrailFrames();
  }
  return _getIsagiEgoTrailFrames();
}

export function _getIsagiEgoAuraFrames() {
  if (
    _isagiEgoAuraFrames.length === EGO_AURA_FRAME_COUNT &&
    _isagiEgoAuraFrames.every(img => img && img.complete && ((img.naturalWidth || img.width || 0) > 0))
  ) {
    return _isagiEgoAuraFrames;
  }
  if (!_isagiEgoAuraFramesLoading) {
    _preloadFrameSequence(ISAGI_EGO_AURA_FRAME_PATHS, _isagiEgoAuraFrames, v => {
      _isagiEgoAuraFramesLoading = v;
    });
  }
  return _isagiEgoAuraFrames;
}

export function _getChigiriEgoAuraFrames() {
  if (
    _chigiriEgoAuraFrames.length === EGO_AURA_FRAME_COUNT &&
    _chigiriEgoAuraFrames.every(img => img && img.complete && ((img.naturalWidth || img.width || 0) > 0))
  ) {
    return _chigiriEgoAuraFrames;
  }
  if (!_chigiriEgoAuraFramesLoading) {
    _preloadFrameSequence(CHIGIRI_EGO_AURA_FRAME_PATHS, _chigiriEgoAuraFrames, v => {
      _chigiriEgoAuraFramesLoading = v;
    });
  }
  return _chigiriEgoAuraFrames;
}

export function getBlueLockEgoAuraFrames(fighter) {
  const charId = (fighter && (fighter.characterId || fighter.type))
    ? String(fighter.characterId || fighter.type).toLowerCase()
    : '';
  const theme = (fighter && fighter.color) ? String(fighter.color).toUpperCase() : '';
  if (charId === 'chigiri' || charId === 'barou' || theme === '#EC4899' || theme === '#F43F5E' || theme === '#DC2626') {
    return _getChigiriEgoAuraFrames();
  }
  return _getIsagiEgoAuraFrames();
}

export function _getIsagiEgoAuraDisappearFrames() {
  if (
    _isagiEgoAuraDisappearFrames.length === EGO_AURA_DISAPPEAR_FRAME_COUNT &&
    _isagiEgoAuraDisappearFrames.every(img => img && img.complete && ((img.naturalWidth || img.width || 0) > 0))
  ) {
    return _isagiEgoAuraDisappearFrames;
  }
  if (!_isagiEgoAuraDisappearFramesLoading) {
    _preloadFrameSequence(ISAGI_EGO_AURA_DISAPPEAR_FRAME_PATHS, _isagiEgoAuraDisappearFrames, v => {
      _isagiEgoAuraDisappearFramesLoading = v;
    });
  }
  return _isagiEgoAuraDisappearFrames;
}

export function _getChigiriEgoAuraDisappearFrames() {
  if (
    _chigiriEgoAuraDisappearFrames.length === EGO_AURA_DISAPPEAR_FRAME_COUNT &&
    _chigiriEgoAuraDisappearFrames.every(img => img && img.complete && ((img.naturalWidth || img.width || 0) > 0))
  ) {
    return _chigiriEgoAuraDisappearFrames;
  }
  if (!_chigiriEgoAuraDisappearFramesLoading) {
    _preloadFrameSequence(CHIGIRI_EGO_AURA_DISAPPEAR_FRAME_PATHS, _chigiriEgoAuraDisappearFrames, v => {
      _chigiriEgoAuraDisappearFramesLoading = v;
    });
  }
  return _chigiriEgoAuraDisappearFrames;
}

export function getBlueLockEgoAuraDisappearFrames(fighter) {
  const charId = (fighter && (fighter.characterId || fighter.type))
    ? String(fighter.characterId || fighter.type).toLowerCase()
    : '';
  const theme = (fighter && fighter.color) ? String(fighter.color).toUpperCase() : '';
  if (charId === 'chigiri' || charId === 'barou' || theme === '#EC4899' || theme === '#F43F5E' || theme === '#DC2626') {
    return _getChigiriEgoAuraDisappearFrames();
  }
  return _getIsagiEgoAuraDisappearFrames();
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getIsagiEgoTrailFrames();
  _getChigiriEgoTrailFrames();
  _getIsagiEgoAuraFrames();
  _getChigiriEgoAuraFrames();
  _getIsagiEgoAuraDisappearFrames();
  _getChigiriEgoAuraDisappearFrames();
}

const MAX_SPINE_NODES = 26;
const MAX_DROPLETS = 48;
const MAX_FLAME_WISPS = 18;

function _rgba(rgb, alpha) {
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a.toFixed(3)})`;
}

// ─────────────────────────────────────────────
// 1. CHARACTER LIQUID-PLASMA & EGO LIGHTNING PALETTES
// ─────────────────────────────────────────────

const EGO_SPECTRAL_PALETTES = Object.freeze({
  // Isagi Yoichi — Electric Aqua-Mint, Emerald, Liquid Chrome & Golden Ego Sparks
  isagi: Object.freeze({
    darkSmokeOuter: 'rgba(8, 28, 36, 0.48)',
    darkSmokeCore: 'rgba(12, 46, 54, 0.68)',
    outerFlame: 'rgba(14, 158, 136, 0.86)',     // Emerald Aqua
    midFlame: 'rgba(24, 238, 202, 0.94)',       // Electric Aqua-Mint
    brightFlame: 'rgba(135, 255, 242, 0.98)',   // Vivid Aqua-White
    coreWhite: 'rgba(255, 255, 255, 0.99)',
    rimGlow: 'rgba(24, 238, 202, 0.48)',
    silverBase: 'rgba(182, 214, 224, 0.94)',
    silverHighlight: 'rgba(255, 255, 255, 0.99)',
    silverRimShadow: 'rgba(20, 74, 86, 0.85)',
    dustBronze: 'rgba(42, 168, 146, 0.52)',
    lightningOuter: 'rgba(0, 240, 255, 0.95)',
    lightningCore: 'rgba(255, 255, 255, 0.99)',
    rgbDark: [8, 38, 48],
    rgbOuter: [14, 158, 136],
    rgbMid: [24, 238, 202],
    rgbBright: [135, 255, 242],
    rgbSilver: [182, 214, 224],
    rgbCore: [255, 255, 255],
    rgbGold: [255, 224, 71],
    rgbLightning: [0, 240, 255],
    rgbLightningCore: [255, 255, 255],
    emberColors: ['#FFFFFF', '#E6FFFA', '#78FFEC', '#00F0FF', '#FDE047', '#18ECCA', '#0E9E88']
  }),
  // Hyoma Chigiri — 44-Panther Mach Pace Crimson-Rose, Molten Gold & Liquid Chrome-Silver
  chigiri: Object.freeze({
    darkSmokeOuter: 'rgba(38, 12, 18, 0.48)',
    darkSmokeCore: 'rgba(64, 18, 28, 0.68)',
    outerFlame: 'rgba(214, 38, 92, 0.86)',      // Vivid Crimson-Rose
    midFlame: 'rgba(255, 38, 92, 0.94)',        // Hot Rose
    brightFlame: 'rgba(255, 204, 72, 0.98)',     // Molten Gold
    coreWhite: 'rgba(255, 255, 255, 0.99)',     // Pure Hot White
    rimGlow: 'rgba(255, 180, 52, 0.50)',
    silverBase: 'rgba(220, 226, 236, 0.95)',
    silverHighlight: 'rgba(255, 255, 255, 0.99)',
    silverRimShadow: 'rgba(118, 52, 28, 0.86)',
    dustBronze: 'rgba(196, 132, 48, 0.54)',
    lightningOuter: 'rgba(254, 224, 71, 0.95)',  // Intense Golden Lightning
    lightningCore: 'rgba(255, 255, 255, 0.99)',
    rgbDark: [78, 12, 30],
    rgbOuter: [214, 38, 92],
    rgbMid: [255, 38, 92],
    rgbBright: [255, 204, 72],
    rgbSilver: [220, 226, 236],
    rgbCore: [255, 255, 255],
    rgbGold: [255, 204, 56],
    rgbLightning: [254, 224, 71],
    rgbLightningCore: [255, 255, 255],
    emberColors: ['#FFFFFF', '#FFFBEB', '#FDE047', '#FEF08A', '#FF94C6', '#EC4899', '#F43F5E']
  }),
  // Itoshi Rin — Berserker Destruction Abyssal Teal-Turquoise & Liquid Silver
  rin: Object.freeze({
    darkSmokeOuter: 'rgba(10, 26, 36, 0.48)',
    darkSmokeCore: 'rgba(14, 42, 56, 0.72)',
    outerFlame: 'rgba(14, 138, 168, 0.86)',
    midFlame: 'rgba(0, 200, 235, 0.92)',
    brightFlame: 'rgba(125, 244, 255, 0.96)',
    coreWhite: 'rgba(240, 253, 255, 0.99)',
    rimGlow: 'rgba(0, 200, 235, 0.44)',
    silverBase: 'rgba(190, 220, 235, 0.94)',
    silverHighlight: 'rgba(255, 255, 255, 0.99)',
    silverRimShadow: 'rgba(14, 42, 56, 0.86)',
    dustBronze: 'rgba(14, 138, 168, 0.54)',
    lightningOuter: 'rgba(125, 244, 255, 0.90)',
    lightningCore: 'rgba(255, 255, 255, 0.99)',
    rgbOuter: [14, 138, 168],
    rgbMid: [0, 200, 235],
    rgbBright: [125, 244, 255],
    rgbSilver: [190, 220, 235],
    rgbCore: [245, 253, 255],
    rgbLightning: [125, 244, 255],
    rgbLightningCore: [255, 255, 255],
    emberColors: ['#FFFFFF', '#7DF4FF', '#00C8EB', '#0E8AA8']
  }),
  // Meguru Bachira — Monster Trance Golden-Amber
  bachira: Object.freeze({
    darkSmokeOuter: 'rgba(32, 18, 4, 0.48)',
    darkSmokeCore: 'rgba(54, 30, 6, 0.72)',
    outerFlame: 'rgba(217, 119, 6, 0.86)',
    midFlame: 'rgba(245, 178, 11, 0.92)',
    brightFlame: 'rgba(254, 230, 95, 0.96)',
    coreWhite: 'rgba(255, 253, 232, 0.99)',
    rimGlow: 'rgba(245, 178, 11, 0.46)',
    silverBase: 'rgba(228, 232, 238, 0.94)',
    silverHighlight: 'rgba(255, 255, 255, 0.99)',
    silverRimShadow: 'rgba(54, 30, 6, 0.86)',
    dustBronze: 'rgba(217, 119, 6, 0.54)',
    lightningOuter: 'rgba(254, 230, 95, 0.90)',
    lightningCore: 'rgba(255, 255, 255, 0.99)',
    rgbOuter: [217, 119, 6],
    rgbMid: [245, 178, 11],
    rgbBright: [254, 230, 95],
    rgbSilver: [228, 232, 238],
    rgbCore: [255, 253, 238],
    rgbLightning: [254, 230, 95],
    rgbLightningCore: [255, 255, 255],
    emberColors: ['#FFFFFF', '#FEE65F', '#F5B20B', '#D97706']
  }),
  // Barou Shouei — King's Predator Pitch-Black & Crimson
  barou: Object.freeze({
    darkSmokeOuter: 'rgba(28, 6, 8, 0.52)',
    darkSmokeCore: 'rgba(46, 8, 12, 0.74)',
    outerFlame: 'rgba(185, 28, 28, 0.86)',
    midFlame: 'rgba(239, 68, 68, 0.92)',
    brightFlame: 'rgba(254, 178, 92, 0.96)',
    coreWhite: 'rgba(255, 246, 238, 0.99)',
    rimGlow: 'rgba(239, 68, 68, 0.45)',
    silverBase: 'rgba(224, 228, 236, 0.94)',
    silverHighlight: 'rgba(255, 255, 255, 0.99)',
    silverRimShadow: 'rgba(46, 8, 12, 0.86)',
    dustBronze: 'rgba(185, 28, 28, 0.54)',
    lightningOuter: 'rgba(254, 178, 92, 0.90)',
    lightningCore: 'rgba(255, 255, 255, 0.99)',
    rgbOuter: [185, 28, 28],
    rgbMid: [239, 68, 68],
    rgbBright: [254, 178, 92],
    rgbSilver: [224, 228, 236],
    rgbCore: [255, 246, 238],
    rgbLightning: [254, 178, 92],
    rgbLightningCore: [255, 255, 255],
    emberColors: ['#FFFFFF', '#FEB25C', '#EF4444', '#B91C1C']
  }),
  // Ryusei Shidou — Dragon Drive Neon Violet-Magenta
  shidou: Object.freeze({
    darkSmokeOuter: 'rgba(24, 8, 36, 0.48)',
    darkSmokeCore: 'rgba(40, 12, 56, 0.72)',
    outerFlame: 'rgba(147, 51, 234, 0.86)',
    midFlame: 'rgba(192, 72, 255, 0.92)',
    brightFlame: 'rgba(236, 160, 255, 0.96)',
    coreWhite: 'rgba(252, 240, 255, 0.99)',
    rimGlow: 'rgba(192, 72, 255, 0.44)',
    silverBase: 'rgba(228, 224, 242, 0.94)',
    silverHighlight: 'rgba(255, 255, 255, 0.99)',
    silverRimShadow: 'rgba(40, 12, 56, 0.86)',
    dustBronze: 'rgba(147, 51, 234, 0.54)',
    lightningOuter: 'rgba(236, 160, 255, 0.90)',
    lightningCore: 'rgba(255, 255, 255, 0.99)',
    rgbOuter: [147, 51, 234],
    rgbMid: [192, 72, 255],
    rgbBright: [236, 160, 255],
    rgbSilver: [228, 224, 242],
    rgbCore: [252, 240, 255],
    rgbLightning: [236, 160, 255],
    rgbLightningCore: [255, 255, 255],
    emberColors: ['#FFFFFF', '#ECA0FF', '#C048FF', '#9333EA']
  }),
  // Rensuke Kunigami — Wild Card Blazing Solar Orange
  kunigami: Object.freeze({
    darkSmokeOuter: 'rgba(32, 12, 6, 0.48)',
    darkSmokeCore: 'rgba(50, 18, 8, 0.72)',
    outerFlame: 'rgba(218, 82, 12, 0.86)',
    midFlame: 'rgba(249, 115, 22, 0.92)',
    brightFlame: 'rgba(254, 202, 88, 0.96)',
    coreWhite: 'rgba(255, 248, 232, 0.99)',
    rimGlow: 'rgba(249, 115, 22, 0.45)',
    silverBase: 'rgba(228, 226, 234, 0.94)',
    silverHighlight: 'rgba(255, 255, 255, 0.99)',
    silverRimShadow: 'rgba(50, 18, 8, 0.86)',
    dustBronze: 'rgba(218, 82, 12, 0.54)',
    lightningOuter: 'rgba(254, 202, 88, 0.90)',
    lightningCore: 'rgba(255, 255, 255, 0.99)',
    rgbOuter: [218, 82, 12],
    rgbMid: [249, 115, 22],
    rgbBright: [254, 202, 88],
    rgbSilver: [228, 226, 234],
    rgbCore: [255, 248, 232],
    rgbLightning: [254, 202, 88],
    rgbLightningCore: [255, 255, 255],
    emberColors: ['#FFFFFF', '#FECA58', '#F97316', '#DA520C']
  }),
  // Mikage Reo — Chameleon Royal Amethyst
  reo: Object.freeze({
    darkSmokeOuter: 'rgba(18, 10, 34, 0.48)',
    darkSmokeCore: 'rgba(30, 16, 52, 0.72)',
    outerFlame: 'rgba(109, 40, 217, 0.86)',
    midFlame: 'rgba(139, 92, 246, 0.92)',
    brightFlame: 'rgba(196, 181, 253, 0.96)',
    coreWhite: 'rgba(245, 240, 255, 0.99)',
    rimGlow: 'rgba(139, 92, 246, 0.44)',
    silverBase: 'rgba(224, 222, 240, 0.94)',
    silverHighlight: 'rgba(255, 255, 255, 0.99)',
    silverRimShadow: 'rgba(30, 16, 52, 0.86)',
    dustBronze: 'rgba(109, 40, 217, 0.54)',
    lightningOuter: 'rgba(196, 181, 253, 0.90)',
    lightningCore: 'rgba(255, 255, 255, 0.99)',
    rgbOuter: [109, 40, 217],
    rgbMid: [139, 92, 246],
    rgbBright: [196, 181, 253],
    rgbSilver: [224, 222, 240],
    rgbCore: [245, 240, 255],
    rgbLightning: [196, 181, 253],
    rgbLightningCore: [255, 255, 255],
    emberColors: ['#FFFFFF', '#C4B5FD', '#8B5CF6', '#6D28D9']
  })
});

export function getBlueLockEgoPalette(fighter) {
  const charId = (fighter && (fighter.characterId || fighter.type))
    ? String(fighter.characterId || fighter.type).toLowerCase()
    : '';
  if (charId === 'chigiri') return EGO_SPECTRAL_PALETTES.chigiri;
  if (charId === 'isagi') return EGO_SPECTRAL_PALETTES.isagi;
  if (EGO_SPECTRAL_PALETTES[charId]) {
    return EGO_SPECTRAL_PALETTES[charId];
  }
  const theme = (fighter && fighter.color) ? String(fighter.color).toUpperCase() : '#00F0FF';
  if (theme === '#EC4899' || theme === '#F43F5E') return EGO_SPECTRAL_PALETTES.chigiri;
  if (theme === '#F59E0B') return EGO_SPECTRAL_PALETTES.bachira;
  if (theme === '#DC2626') return EGO_SPECTRAL_PALETTES.barou;
  if (theme === '#A855F7') return EGO_SPECTRAL_PALETTES.shidou;
  if (theme === '#F97316') return EGO_SPECTRAL_PALETTES.kunigami;
  if (theme === '#8B5CF6') return EGO_SPECTRAL_PALETTES.reo;
  return EGO_SPECTRAL_PALETTES.isagi;
}

// ─────────────────────────────────────────────
// 2. WORLD-SPACE FLUID SPINE & WALL BOUNCE RICOCHET LIFECYCLE (RULE 25)
// ─────────────────────────────────────────────

export function updateBlueLockEgoTrail(fighter, arena) {
  if (!fighter) return;

  if (!Array.isArray(fighter._egoTrailNodes)) fighter._egoTrailNodes = [];
  if (!Array.isArray(fighter._egoDroplets)) fighter._egoDroplets = [];
  if (!Array.isArray(fighter._egoFlameWisps)) fighter._egoFlameWisps = [];
  if (!Array.isArray(fighter._egoWallSplashes)) fighter._egoWallSplashes = [];

  fighter._egoTrailTimer = (fighter._egoTrailTimer || 0) + 1;
  fighter._egoAuraTimer = (fighter._egoAuraTimer || 0) + 1;
  fighter._wasEgoAuraActive = true;
  fighter._egoAuraDisappearing = false;
  fighter._egoAuraDisappearTimer = 0;
  if (fighter.isEgoActive || fighter.isPantherSprinting || (fighter.pantherSpeedBuffTimer > 0)) {
    fighter._egoAuraOpacity = Math.min(1.0, (fighter._egoAuraOpacity || 0.45) + 0.14);
  }

  const timer = fighter._egoTrailTimer;
  const vx = fighter.vx || 0;
  const vy = fighter.vy || 0;
  const speed = Math.hypot(vx, vy);
  const r = fighter.r || 25;

  let moveAngle = typeof fighter._egoMoveAngle === 'number'
    ? fighter._egoMoveAngle
    : (typeof fighter.gunAngle === 'number' ? fighter.gunAngle : (fighter.angle || 0));

  if (speed > 0.20) {
    moveAngle = Math.atan2(vy, vx);
  }
  fighter._egoMoveAngle = moveAngle;

  const nodes = fighter._egoTrailNodes;
  const MAX_CHAIN_LINKS = 14;
  const TARGET_LINK_DIST = 7.0;

  // Detect wall bounce / velocity reversal to spawn impact splash (Rule 25)
  if (nodes.length > 0 && typeof nodes[0].vx === 'number' && typeof nodes[0].vy === 'number') {
    const isVelocityReversal = (nodes[0].vx * vx < -1.0) || (nodes[0].vy * vy < -1.0);
    const angleDiff = Math.abs(Math.atan2(Math.sin(moveAngle - (nodes[0].angle || 0)), Math.cos(moveAngle - (nodes[0].angle || 0))));
    if (isVelocityReversal || angleDiff > 0.85) {
      if (fighter._egoWallSplashes.length < 5) {
        fighter._egoWallSplashes.push({
          x: fighter.x,
          y: fighter.y,
          angle: moveAngle,
          timer: 16,
          maxTimer: 16,
          r
        });
      }
    }
  }

  // Pre-seed initial articulated chain on first frame
  if (nodes.length === 0) {
    const tailAng = moveAngle + Math.PI;
    for (let k = 0; k < MAX_CHAIN_LINKS; k++) {
      nodes.push({
        x: fighter.x + Math.cos(tailAng) * (k * TARGET_LINK_DIST),
        y: fighter.y + Math.sin(tailAng) * (k * TARGET_LINK_DIST),
        vx,
        vy,
        speed,
        angle: moveAngle,
        tailAngle: tailAng,
        age: k / MAX_CHAIN_LINKS,
        r
      });
    }
  } else {
    // True Physical Follow-The-Leader IK Chain:
    // Node 0 is ALWAYS anchored at fighter position
    nodes[0].x = fighter.x;
    nodes[0].y = fighter.y;
    nodes[0].vx = vx;
    nodes[0].vy = vy;
    nodes[0].speed = speed;
    nodes[0].angle = moveAngle;
    nodes[0].age = 0;

    // Constrain links 1..N-1 with bi-directional distance constraint
    for (let i = 1; i < nodes.length; i++) {
      const prev = nodes[i - 1];
      const curr = nodes[i];
      curr.age = i / nodes.length;

      let dx = curr.x - prev.x;
      let dy = curr.y - prev.y;
      let curDist = Math.hypot(dx, dy);

      if (curDist < 0.001) {
        dx = -Math.cos(moveAngle);
        dy = -Math.sin(moveAngle);
        curDist = 1.0;
      }

      // Exact distance enforcement: Prevents links from bunching up OR stretching
      curr.x = prev.x + (dx / curDist) * TARGET_LINK_DIST;
      curr.y = prev.y + (dy / curDist) * TARGET_LINK_DIST;

      // Arena boundary collision constraint (prevents trail from penetrating arena walls)
      if (arena) {
        const wallPad = 10;
        curr.x = Math.max(arena.x + wallPad, Math.min(arena.x + arena.width - wallPad, curr.x));
        curr.y = Math.max(arena.y + wallPad, Math.min(arena.y + arena.height - wallPad, curr.y));
      }

      // Smooth organic undulating transverse wave
      const perpX = -(curr.y - prev.y);
      const perpY = curr.x - prev.x;
      const perpLen = Math.hypot(perpX, perpY) || 1.0;
      const wave = Math.sin(timer * 0.35 + i * 0.72) * 0.35 * (1.0 - (i / nodes.length));
      curr.x += (perpX / perpLen) * wave;
      curr.y += (perpY / perpLen) * wave;

      curr.tailAngle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
    }

    // Ensure fixed chain length
    while (nodes.length > MAX_CHAIN_LINKS) {
      nodes.pop();
    }
  }

  // Update transient wall bounce splash bursts
  for (let s = fighter._egoWallSplashes.length - 1; s >= 0; s--) {
    const sp = fighter._egoWallSplashes[s];
    sp.timer--;
    if (sp.timer <= 0) fighter._egoWallSplashes.splice(s, 1);
  }

  _spawnAndStepEgoSparks(fighter, moveAngle, speed);
  _updateBackFlameTongues(fighter, timer, speed);
}

function _spawnAndStepEgoSparks(fighter, moveAngle, speed) {
  const droplets = fighter._egoDroplets;
  const nodes = fighter._egoTrailNodes;
  const palette = getBlueLockEgoPalette(fighter);
  const r = fighter.r || 25;
  const tailAngle = moveAngle + Math.PI;

  if (droplets.length < MAX_DROPLETS && speed > 0.4) {
    const spawnCount = speed > 10.0 ? 3 : 2;
    for (let s = 0; s < spawnCount; s++) {
      if (droplets.length >= MAX_DROPLETS) break;
      const chainIdx = (Array.isArray(nodes) && nodes.length > 2)
        ? Math.floor(Math.random() * Math.min(10, nodes.length))
        : 0;
      const anchorNode = (Array.isArray(nodes) && nodes[chainIdx]) ? nodes[chainIdx] : fighter;
      const nodeTailAngle = (anchorNode && typeof anchorNode.tailAngle === 'number')
        ? anchorNode.tailAngle
        : tailAngle;

      const spread = (Math.random() - 0.5) * 1.35;
      const launchAngle = nodeTailAngle + spread * 0.52;
      const sparkSpeed = (2.0 + Math.random() * 3.4) + Math.min(4.5, speed * 0.22);
      const color = palette.emberColors[Math.floor(Math.random() * palette.emberColors.length)];
      const jitterR = r * 0.55 * (1.0 - chainIdx / MAX_SPINE_NODES);

      droplets.push({
        x: anchorNode.x + (Math.random() - 0.5) * jitterR,
        y: anchorNode.y + (Math.random() - 0.5) * jitterR,
        vx: Math.cos(launchAngle) * sparkSpeed,
        vy: Math.sin(launchAngle) * sparkSpeed,
        size: 1.5 + Math.random() * 2.4,
        streakLen: 5.0 + Math.random() * 8.5,
        color,
        alpha: 0.90 + Math.random() * 0.10,
        life: 16 + Math.floor(Math.random() * 12),
        maxLife: 28,
        rot: launchAngle
      });
    }
  }

  for (let i = droplets.length - 1; i >= 0; i--) {
    const sp = droplets[i];
    sp.x += sp.vx;
    sp.y += sp.vy;
    sp.vx *= 0.93;
    sp.vy *= 0.93;
    sp.life--;
    if (sp.life <= 0) droplets.splice(i, 1);
  }
}

function _updateBackFlameTongues(fighter, timer, speed) {
  const wisps = fighter._egoFlameWisps;
  const r = fighter.r || 25;

  if (wisps.length < MAX_FLAME_WISPS && (timer % 2 === 0)) {
    const isHeelStream = (timer % 4 === 0);
    wisps.push({
      localX: isHeelStream ? -r * (0.35 + Math.random() * 0.45) : -r * (0.78 + Math.random() * 0.25),
      localY: isHeelStream ? r * (0.82 + Math.random() * 0.16) : r * (-0.32 + Math.random() * 0.52),
      vx: -(2.2 + Math.random() * 2.5 + Math.min(3.2, speed * 0.22)),
      vy: isHeelStream ? -(0.35 + Math.random() * 0.65) : -(0.55 + Math.random() * 0.95),
      size: isHeelStream ? (3.5 + Math.random() * 2.2) : (4.5 + Math.random() * 3.0),
      life: 14 + Math.floor(Math.random() * 10),
      maxLife: 24
    });
  }

  for (let i = wisps.length - 1; i >= 0; i--) {
    const w = wisps[i];
    w.localX += w.vx;
    w.localY += w.vy;
    w.vx *= 0.95;
    w.life--;
    if (w.life <= 0) wisps.splice(i, 1);
  }
}

export function decayBlueLockEgoTrail(fighter) {
  if (!fighter) return;

  const wasActive = Boolean(fighter._wasEgoAuraActive);
  const isNowActive = Boolean(
    fighter.isEgoActive ||
    fighter.isPantherSprinting ||
    (fighter.pantherSpeedBuffTimer > 0) ||
    fighter.isMetavisionDashing
  );

  // Smooth transition from active 18-frame aura into 12-frame disappearance animation
  if (wasActive && !isNowActive) {
    fighter._wasEgoAuraActive = false;
    fighter._egoAuraDisappearing = true;
    fighter._egoAuraDisappearTimer = 24;
    fighter._egoAuraDisappearMax = 24;
  }

  if (fighter._egoAuraDisappearTimer > 0) {
    fighter._egoAuraDisappearTimer--;
    fighter._egoAuraOpacity = Math.max(0, fighter._egoAuraDisappearTimer / (fighter._egoAuraDisappearMax || 24));
    if (fighter._egoAuraDisappearTimer <= 0) {
      fighter._egoAuraDisappearing = false;
      fighter._egoAuraOpacity = 0;
    }
  } else if (!isNowActive && typeof fighter._egoAuraOpacity === 'number' && fighter._egoAuraOpacity > 0) {
    fighter._egoAuraOpacity = Math.max(0, fighter._egoAuraOpacity - 0.08);
  }

  if (Array.isArray(fighter._egoTrailNodes)) {
    for (let i = fighter._egoTrailNodes.length - 1; i >= 0; i--) {
      const node = fighter._egoTrailNodes[i];
      node.age = (node.age || 0) + 0.10;
      if (node.age >= 1.0) fighter._egoTrailNodes.splice(i, 1);
    }
  }

  if (Array.isArray(fighter._egoDroplets)) {
    for (let i = fighter._egoDroplets.length - 1; i >= 0; i--) {
      const sp = fighter._egoDroplets[i];
      sp.x += sp.vx || 0;
      sp.y += sp.vy || 0;
      sp.vx = (sp.vx || 0) * 0.92;
      sp.vy = (sp.vy || 0) * 0.92;
      sp.life -= 2;
      if (sp.life <= 0) fighter._egoDroplets.splice(i, 1);
    }
  }

  if (Array.isArray(fighter._egoFlameWisps)) {
    for (let i = fighter._egoFlameWisps.length - 1; i >= 0; i--) {
      const w = fighter._egoFlameWisps[i];
      w.localX += w.vx || -1.5;
      w.localY += w.vy || 0;
      w.life -= 2;
      if (w.life <= 0) fighter._egoFlameWisps.splice(i, 1);
    }
  }

  if (Array.isArray(fighter._egoWallSplashes)) {
    for (let i = fighter._egoWallSplashes.length - 1; i >= 0; i--) {
      fighter._egoWallSplashes[i].timer -= 2;
      if (fighter._egoWallSplashes[i].timer <= 0) fighter._egoWallSplashes.splice(i, 1);
    }
  }
}

// ─────────────────────────────────────────────
// 3. FLUID PLASMA & HOOKED FLAME CLAW PRIMITIVES
// ─────────────────────────────────────────────

function _resolveAuraTime(fighter) {
  // Derives from continuous high-resolution performance.now() or state.frameCount
  // to strictly enforce Rule 25 (Non-Freezing Active Visual Effects Standard).
  // Ensures the 18-frame anime flame aura and ground puddle NEVER freeze in mid-air
  // when the character's movement is stopped, hit-paused, stunned, or time-stopped.
  if (typeof performance !== 'undefined' && performance.now) {
    return Math.floor(performance.now() / 16.67);
  }
  if (typeof state !== 'undefined' && typeof state.frameCount === 'number') {
    return state.frameCount;
  }
  if (fighter && typeof fighter._egoAuraTimer === 'number' && fighter._egoAuraTimer > 0) {
    return fighter._egoAuraTimer;
  }
  return Math.floor(Date.now() / 16.67);
}

/**
 * Draws a continuous multi-tier ribbon band along motion spine points with smooth power tapering.
 * Connects trail history nodes into a sleek, streamlined aerodynamic wake (Rule 16 & Rule 26).
 */
function _drawEgoRibbonBand(ctx, pts, widthFunc, fillStyle) {
  if (!pts || pts.length < 2) return;
  const lefts = [];
  const rights = [];

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    let tx = 0;
    let ty = 0;
    if (i === 0) {
      tx = pts[1].x - p.x;
      ty = pts[1].y - p.y;
    } else if (i === pts.length - 1) {
      tx = p.x - pts[i - 1].x;
      ty = p.y - pts[i - 1].y;
    } else {
      tx = pts[i + 1].x - pts[i - 1].x;
      ty = pts[i + 1].y - pts[i - 1].y;
    }
    const len = Math.hypot(tx, ty);
    if (len < 0.001) {
      lefts.push({ x: p.x, y: p.y });
      rights.push({ x: p.x, y: p.y });
      continue;
    }
    const nx = -ty / len;
    const ny = tx / len;
    const halfW = widthFunc(i, pts.length, p);
    lefts.push({ x: p.x + nx * halfW, y: p.y + ny * halfW });
    rights.push({ x: p.x - nx * halfW, y: p.y - ny * halfW });
  }

  if (lefts.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(lefts[0].x, lefts[0].y);
  for (let i = 1; i < lefts.length; i++) {
    ctx.lineTo(lefts[i].x, lefts[i].y);
  }
  for (let i = rights.length - 1; i >= 0; i--) {
    ctx.lineTo(rights[i].x, rights[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

/**
 * Feathered radial plasma pocket with clean 0-alpha perimeter (Rule 31 anti-box clipping).
 */
function _drawFeatheredBallPlasmaPocket(ctx, cx, cy, radius, palette, alpha, isHotCore = false) {
  if (radius <= 1.0 || alpha <= 0.015) return;
  const grad = ctx.createRadialGradient(cx, cy, radius * 0.06, cx, cy, radius);
  if (isHotCore) {
    grad.addColorStop(0.0, _rgba(palette.rgbCore, 0.96 * alpha));
    grad.addColorStop(0.35, _rgba(palette.rgbBright, 0.84 * alpha));
    grad.addColorStop(0.70, _rgba(palette.rgbMid, 0.44 * alpha));
    grad.addColorStop(1.0, _rgba(palette.rgbOuter, 0.0));
  } else {
    grad.addColorStop(0.0, _rgba(palette.rgbBright, 0.62 * alpha));
    grad.addColorStop(0.45, _rgba(palette.rgbMid, 0.38 * alpha));
    grad.addColorStop(0.78, _rgba(palette.rgbOuter, 0.16 * alpha));
    grad.addColorStop(1.0, _rgba(palette.rgbOuter, 0.0));
  }
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

/**
 * Supersonic electric lightning filament with multi-segment jitter and pure white core.
 */
function _drawEgoLightningArc(ctx, x0, y0, x1, y1, timer, seed, palette, alpha) {
  if (alpha <= 0.04) return;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 4) return;

  const nx = -dy / len;
  const ny = dx / len;
  const steps = 5;
  const pts = [{ x: x0, y: y0 }];

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const env = Math.sin(t * Math.PI);
    const jitter = (Math.sin(timer * 2.1 + seed * 3.7 + i * 3.1) * 5.2 +
                    Math.cos(timer * 2.8 - seed * 2.1 + i * 4.7) * 3.2) * env;
    pts.push({
      x: x0 + dx * t + nx * jitter,
      y: y0 + dy * t + ny * jitter
    });
  }
  pts.push({ x: x1, y: y1 });

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }

  ctx.strokeStyle = _rgba(palette.rgbLightning || palette.rgbBright, 0.82 * alpha);
  ctx.lineWidth = 2.4;
  ctx.stroke();

  ctx.strokeStyle = _rgba(palette.rgbLightningCore || palette.rgbCore, 0.98 * alpha);
  ctx.lineWidth = 1.0;
  ctx.stroke();
}

/**
 * 4-point aerodynamic diamond needle spark polygon (Rule 16 Manga Action Speed Line standard).
 */
function _drawAerodynamicSpark(ctx, cx, cy, vx, vy, size, streakLen, color, alpha) {
  const spd = Math.hypot(vx, vy);
  const ang = spd > 0.1 ? Math.atan2(vy, vx) : 0;
  const halfW = size * 0.55;
  const streak = streakLen * (1.0 + Math.min(1.5, spd * 0.15));

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  ctx.globalAlpha = alpha;

  ctx.beginPath();
  ctx.moveTo(streak * 0.6, 0);                 // Leading sharp tip
  ctx.lineTo(0, halfW);                        // Top flank
  ctx.lineTo(-streak * 0.8, 0);                // Trailing needle tail
  ctx.lineTo(0, -halfW);                       // Bottom flank
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // White-hot center core
  ctx.beginPath();
  ctx.arc(streak * 0.1, 0, halfW * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.restore();
}

// ─────────────────────────────────────────────
// 4. MASTER BLUE LOCK EGO TRAIL RENDERER (ORGANIC LIQUID-PLASMA WAKE)
// ─────────────────────────────────────────────

/**
 * Draws the master 12-frame Blue Lock Ego Awakening & Sprint Trail (`ego_trail-1.png` .. `ego_trail-12.png`),
 * articulated wake turf bloom, crackling electric lightning arcs, and streaking ember shower.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} fighter - Blue Lock fighter entity
 */
export function drawBlueLockEgoTrail(ctx, fighter) {
  // Intentionally removed per user request: Striker uses pure 18-frame Ego Aura (Spectre Column & Ground Pool Wrap)
  return;
}

// ─────────────────────────────────────────────
// 5. 18-FRAME EGO AURA SPRITE & SPECTRAL FLAME SPIRE (`ego_aura-1..18.png`)
// ─────────────────────────────────────────────

/**
 * Headless Node / pre-load 16-bit stepped pixel art fallback (P = 2.0px).
 */
function _draw16BitProceduralFallback(ctx, r, time, palette) {
  const P = 2.0;
  const snap = (v) => Math.round(v / P) * P;
  const sway = snap(Math.sin(time * 0.25) * 4);

  // 1. Dark Charcoal Smoke Spire (-4.5r to -1.4r)
  ctx.fillStyle = palette.darkSmokeCore;
  for (let y = -r * 4.5; y < -r * 1.4; y += P * 2) {
    const t = (y + r * 4.5) / (r * 3.1);
    const halfW = snap(P + t * r * 0.45);
    ctx.fillRect(sway - halfW, snap(y), halfW * 2, P * 2);
  }

  // 2. Blazing Flame Spear & Flank Shroud (-2.5r to +1.1r)
  ctx.fillStyle = palette.midFlame;
  for (let y = -r * 2.5; y <= r * 1.1; y += P * 2) {
    const normY = (y + r * 2.5) / (r * 3.6);
    const halfW = snap(Math.sin(normY * Math.PI) * r * 1.45);
    ctx.fillRect(-halfW, snap(y), halfW * 2, P * 2);
  }

  // 3. White-Hot Inner Core & Ground Puddle
  ctx.fillStyle = palette.coreWhite;
  ctx.fillRect(-snap(r * 0.35), -snap(r * 2.1), snap(r * 0.70), snap(r * 0.8));
  ctx.fillRect(-snap(r * 0.95), snap(r * 0.85), snap(r * 1.90), P * 2);
}

/**
 * Renders the 18-frame Blue Lock EGO Aura Sprite (`ego_aura-1.png` .. `ego_aura-18.png`)
 * centered 1:1 on the fighter (Isagi: Electric Aqua-Mint, Chigiri: Red Panther Crimson-Pink).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} fighter - Blue Lock fighter entity
 */
export function drawBlueLockEgoSpectreColumn(ctx, fighter) {
  if (!ctx || !fighter) return;

  const isActive = Boolean(fighter.isEgoActive || fighter.isPantherSprinting || (fighter.pantherSpeedBuffTimer > 0));
  const isDisappearing = Boolean(!isActive && (fighter._egoAuraDisappearTimer > 0 || fighter._egoAuraDisappearing));
  const residualAlpha = typeof fighter._egoAuraOpacity === 'number' ? fighter._egoAuraOpacity : 0;
  if (!isActive && !isDisappearing && residualAlpha <= 0.02) return;

  const r = fighter.r || 25;
  const palette = getBlueLockEgoPalette(fighter);
  const time = _resolveAuraTime(fighter);
  const maxTimer = fighter._egoAuraDisappearMax || 24;
  const timer = fighter._egoAuraDisappearTimer || 0;
  const masterAlpha = isActive
    ? 1.0
    : (isDisappearing ? Math.max(0, Math.min(1.0, timer / maxTimer)) : Math.max(0, Math.min(1.0, residualAlpha)));

  let frameImg = null;
  if (isDisappearing) {
    // 12-frame disappearance animation played sequentially from frame 0 to 11
    const progress = Math.max(0, Math.min(1.0, 1.0 - (timer / maxTimer)));
    const frameIndex = Math.min(
      EGO_AURA_DISAPPEAR_FRAME_COUNT - 1,
      Math.floor(progress * EGO_AURA_DISAPPEAR_FRAME_COUNT)
    );
    const disappearFrames = getBlueLockEgoAuraDisappearFrames(fighter);
    frameImg = disappearFrames && disappearFrames[frameIndex];
  } else {
    // Cycle smoothly through all 18 active aura frames at ~20 FPS (1 frame every 3 ticks at 60 FPS)
    const frameIndex = Math.floor(time / 3) % EGO_AURA_FRAME_COUNT;
    const frames = getBlueLockEgoAuraFrames(fighter);
    frameImg = frames && frames[frameIndex];
  }

  const hasSprite = Boolean(
    frameImg &&
    frameImg.complete &&
    ((frameImg.naturalWidth || frameImg.width || 0) > 0)
  );

  ctx.save();
  // Upright standing aura in 2D top-down manga space — NO ctx.rotate(angle)
  ctx.translate(fighter.x, fighter.y - (fighter.z || 0));

  const prevSmoothing = ctx.imageSmoothingEnabled;
  const prevAlpha = ctx.globalAlpha;
  ctx.imageSmoothingEnabled = false; // Nearest-neighbor crisp pixel fidelity
  ctx.globalAlpha = Math.max(0, Math.min(1.0, prevAlpha * masterAlpha));

  // 1. Soft Turf Ground Ignition Bloom (Rule 11 compliant: pure radial gradient, zero shadowBlur)
  const pulse = Math.sin(time * 0.22) * 0.5 + 0.5;
  const bloomR = r * (2.0 + 0.25 * pulse);
  const grad = ctx.createRadialGradient(0, r * 0.40, r * 0.15, 0, r * 0.40, bloomR);
  grad.addColorStop(0.0, _rgba(palette.rgbBright, 0.40 * masterAlpha));
  grad.addColorStop(0.45, _rgba(palette.rgbMid, 0.22 * masterAlpha));
  grad.addColorStop(0.85, _rgba(palette.rgbDark, 0.06 * masterAlpha));
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.beginPath();
  ctx.arc(0, r * 0.40, bloomR, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  if (hasSprite) {
    // Calibrated compact scale (Turn 8 standard):
    // drawSize = Math.round(r * 4.8) (~120px for r=25), framing the 50px body circle snugly.
    // Center of body in 256x256 sprite is at (128, 156).
    const drawSize = Math.round(r * 4.8);
    const drawX = Math.round(-drawSize * 0.50);
    const drawY = Math.round(-drawSize * (156.0 / 256.0));

    // Base crisp 16-bit sprite pass
    ctx.drawImage(frameImg, drawX, drawY, drawSize, drawSize);

    // Specular Additive Self-Bloom Pass (Rule 11: GPU lighter blend for vibrant anime glow)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.max(0, Math.min(1.0, (0.32 + 0.12 * pulse) * masterAlpha));
    ctx.drawImage(frameImg, drawX, drawY, drawSize, drawSize);
    ctx.restore();
  } else {
    // Headless Node / pre-load fallback
    _draw16BitProceduralFallback(ctx, r, time, palette);
  }

  ctx.imageSmoothingEnabled = prevSmoothing;
  ctx.globalAlpha = prevAlpha;
  ctx.restore();
}

// ─────────────────────────────────────────────
// 6. FRONT GROUND PUDDLE & PERIMETER WISPS (AFTER BODY DRAW)
// ─────────────────────────────────────────────

/**
 * Draws crisp ground puddle licks along the lower perimeter and rising flank pixel sparks
 * AFTER `fighter.drawBody(ctx)`, grounding the character inside the flame aura without
 * ever obscuring the face or hair (Rule 24).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} fighter - Blue Lock fighter entity
 */
export function drawBlueLockEgoAuraFront(ctx, fighter) {
  if (!ctx || !fighter) return;

  const isActive = Boolean(fighter.isEgoActive || fighter.isPantherSprinting || (fighter.pantherSpeedBuffTimer > 0));
  const isDisappearing = Boolean(!isActive && (fighter._egoAuraDisappearTimer > 0 || fighter._egoAuraDisappearing));
  const residualAlpha = typeof fighter._egoAuraOpacity === 'number' ? fighter._egoAuraOpacity : 0;
  if (!isActive && !isDisappearing && residualAlpha <= 0.02) return;

  const r = fighter.r || 25;
  const palette = getBlueLockEgoPalette(fighter);
  const time = _resolveAuraTime(fighter);
  const maxTimer = fighter._egoAuraDisappearMax || 24;
  const timer = fighter._egoAuraDisappearTimer || 0;
  const masterAlpha = isActive
    ? 1.0
    : (isDisappearing ? Math.max(0, Math.min(1.0, timer / maxTimer)) : Math.max(0, Math.min(1.0, residualAlpha)));
  const P = 2.0;
  const snap = (v) => Math.round(v / P) * P;

  ctx.save();
  // Upright standing wrap — NO ctx.rotate(angle) so ground puddle remains at feet
  ctx.translate(fighter.x, fighter.y - (fighter.z || 0));
  ctx.globalAlpha = masterAlpha;

  // 1. Lower Ground Puddle Rim Licks (Strictly at feet: y >= +0.84r)
  const phase = Math.floor(time / 3);
  for (let k = -4; k <= 4; k++) {
    const lx = snap(k * r * 0.22);
    const wave = ((phase + Math.abs(k) * 2) % 4) * P * 0.5;
    const baseY = snap(Math.sqrt(Math.max(0, r * r - lx * lx)) * 0.94);
    if (baseY < r * 0.68) continue;

    ctx.fillStyle = palette.midFlame;
    ctx.fillRect(lx - P, baseY - wave, P * 2, P * 2);

    if (Math.abs(k) <= 2) {
      ctx.fillStyle = palette.coreWhite;
      ctx.fillRect(lx - P * 0.5, baseY + P - wave, P, P);
    }
  }

  // 2. Rising Flank Pixel Wisps along Outer Perimeter (|x| >= 0.85r, never over face/hair)
  const wisps = fighter._egoFlameWisps;
  if (Array.isArray(wisps)) {
    for (let i = 0; i < wisps.length; i++) {
      const w = wisps[i];
      const lifeRatio = Math.max(0, w.life / w.maxLife);
      if (lifeRatio <= 0.05) continue;

      const wx = snap(w.localX);
      const wy = snap(w.localY);
      ctx.fillStyle = lifeRatio > 0.55 ? palette.brightFlame : palette.midFlame;
      ctx.fillRect(wx - P, wy - P, P * 2, P * 2);
    }
  }

  ctx.restore();
}
