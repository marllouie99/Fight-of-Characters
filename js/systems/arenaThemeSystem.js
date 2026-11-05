// ─────────────────────────────────────────────
// ARENA THEME SYSTEM — Unified Modular Environment Theme Engine & Grid Math
// Replaces and extends legacy arenaTileSystem with integrated environmental themes,
// dedicated Halloween spooky gothic floors, corner decorations, and universal 8x8 grid math.
// ─────────────────────────────────────────────

import { state } from '../core/state.js';
import { CONFIG } from '../core/config.js';
import { ARENA_TILE_COUNT } from './arenaTileGrid.js';
import { _registerButton, drawChamferedRect, drawPanel, fitSingleLineText, wrapText } from '../graphics/ui/uiFramework.js';
import { getOrCreateGrassFloorCanvas } from '../graphics/renderers/grassFloorRenderer.js';
import { getOrCreateSandBeachFloorCanvas } from '../graphics/renderers/sandBeachFloorRenderer.js';
import { getOrCreateDungeonFloorCanvas } from '../graphics/renderers/dungeonFloorRenderer.js';
import { getOrCreateEndStoneFloorCanvas } from '../graphics/renderers/endStoneFloorRenderer.js';
import { getOrCreateEndStoneBricksFloorCanvas } from '../graphics/renderers/endStoneBricksFloorRenderer.js';
import { getOrCreateMossyStoneFloorCanvas } from '../graphics/renderers/mossyStoneFloorRenderer.js';
import { getOrCreateFootballFieldFloorCanvas, _renderFootballFieldFloor } from '../graphics/renderers/footballFieldRenderer.js';

export const ARENA_THEME_STORAGE_KEY = 'circle_selected_arena_theme';
export const LEGACY_ARENA_FLOOR_STORAGE_KEY = 'circle_selected_arena_floor';

export const ARENA_THEMES = [
  {
    id: 'classic_clean',
    name: 'PIXEL TOURNAMENT',
    shortName: 'PIXEL CLEAN',
    icon: '⚪',
    themeColor: '#64748b',
    features: '8x8 TILES • ESPORTS STANDARD',
    desc: '8x8 Esports-grade minimalist pixel arena with 8-bit stepped corner brackets and discrete intersection crosshairs.',
    hasDecorations: false,
    decorationTheme: 'none'
  },
  {
    id: 'football_field',
    name: 'FOOTBALL FIELD',
    shortName: 'FOOTBALL',
    icon: '⚽',
    themeColor: '#22c55e',
    features: '8-BIT PITCH • RETRO TURF & CHALK',
    desc: 'Authentic 8-bit championship football pitch with stepped pixel turf bands, dithered lawn cuts, 8-bit regulation chalk markings, pixel center circle, and goal areas.',
    hasDecorations: false,
    decorationTheme: 'none'
  },
  {
    id: 'bomberman_normal',
    name: 'BOMBERMAN NORMAL ZONE',
    shortName: 'NORMAL ZONE',
    icon: '💣',
    themeColor: '#22c55e',
    features: 'CLASSIC MAP • BEVEL BLOCKS & GREEN TURF',
    desc: 'The iconic classic Normal Zone battle stage from Bomberman featuring bevelled grey perimeter wall blocks and vibrant emerald turf.',
    hasDecorations: false,
    decorationTheme: 'none',
    wallBlockThickness: 25
  },
  {
    id: 'halloween',
    name: 'HALLOWEEN HAUNT',
    shortName: 'HALLOWEEN',
    icon: '🎃',
    themeColor: '#f97316',
    features: '8x8 TILES • COBWEBS • SKULLS & CANDLES',
    desc: 'Spooky haunted arena with weathered dark tombstone dungeon tiles, cobwebs in top corners, flickering bone candles, and ancient skeletal relics.',
    hasDecorations: true,
    decorationTheme: 'halloween'
  },
  {
    id: 'pvz_grass',
    name: 'PVZ LAWN',
    shortName: 'PVZ LAWN',
    icon: '🌱',
    themeColor: '#22c55e',
    features: '8x8 TILES • 8 COLS x 8 ROWS',
    desc: '8x8 Authentic Plants vs. Zombies front lawn with 8 columns and 8 rows of sprite tiles (daisies, solar sunbeams, dirt paths).',
    hasDecorations: false,
    decorationTheme: 'none'
  },
  {
    id: 'clash_arena',
    name: 'CLASH ARENA',
    shortName: 'CLASH',
    icon: '⚔️',
    themeColor: '#f59e0b',
    features: '8x8 TILES • 8 COLS x 8 ROWS',
    desc: '8x8 Royal battle turf bounded by heavy pixel slate pauldron blocks, 16-bit golden bolt rivets, and emerald grass tufts.',
    hasDecorations: false,
    decorationTheme: 'none'
  },
  {
    id: 'stone_dungeon',
    name: 'DUNGEON SLABS',
    shortName: 'DUNGEON',
    icon: '🧱',
    themeColor: '#78716c',
    features: '8x8 TILES • 8 COLS x 8 ROWS',
    desc: '8x8 Authentic carved dungeon stone tiles with 6 discrete sprite variants, iron sewer grates, mossy slabs, and rubble masonry.',
    hasDecorations: false,
    decorationTheme: 'none'
  },
  {
    id: 'checker_arcade',
    name: 'RETRO CHECKER',
    shortName: 'CHECKER',
    icon: '🏁',
    themeColor: '#8b5cf6',
    features: '8x8 TILES • 8 COLS x 8 ROWS',
    desc: '8x8 High-contrast 16-bit retro arcade checkerboard with 3D stepped beveled rims on every tile, specular highlights, and studs.',
    hasDecorations: false,
    decorationTheme: 'none'
  },
  {
    id: 'cyber_grid',
    name: 'CYBER GRID',
    shortName: 'CYBER',
    icon: '🌐',
    themeColor: '#06b6d4',
    features: '8x8 TILES • 8 COLS x 8 ROWS',
    desc: '8x8 Deep obsidian void arena with glowing neon cyan pixel tracks, 8-bit diamond intersection nodes, and PCB traces.',
    hasDecorations: false,
    decorationTheme: 'none'
  },
  {
    id: 'tatami_dojo',
    name: 'DOJO TATAMI',
    shortName: 'TATAMI',
    icon: '🥋',
    themeColor: '#d97706',
    features: '8x8 TILES • 8 COLS x 8 ROWS',
    desc: '8x8 Traditional martial arts dojo with discrete woven straw reed striations, deep indigo cloth borders, and pixel cross-stitches.',
    hasDecorations: false,
    decorationTheme: 'none'
  },
  {
    id: 'sand_beach',
    name: 'SAND BEACH',
    shortName: 'SAND BEACH',
    icon: '🏖️',
    themeColor: '#f59e0b',
    features: '8x8 TILES • 8 COLS x 8 ROWS',
    desc: '8x8 Authentic tropical sand tiles with 6 discrete sprite variants, pixel beach pebbles, sunlit dunes, and seamless interlocking.',
    hasDecorations: false,
    decorationTheme: 'none'
  },
  {
    id: 'mossy_stone',
    name: 'ANCIENT STONE SLABS',
    shortName: 'STONE SLABS',
    icon: '🪨',
    themeColor: '#64748b',
    features: '8x8 TILES • 2 PURE STONE TILES',
    desc: 'Weathered flagstone cobblestones and 4-square carved stone paver slabs with zero grass, deep mortar grooves, and seamless interlocking.',
    hasDecorations: false,
    decorationTheme: 'none'
  },
  {
    id: 'end_stone',
    name: 'MINECRAFT END STONE',
    shortName: 'END STONE',
    icon: '🟨',
    themeColor: '#ca8a04',
    features: '8x8 TILES • MINECRAFT THEME',
    desc: 'Authentic 16-bit Minecraft End Stone terrain with pale yellowish-tan cobblestone texture and dark olive pitting.',
    hasDecorations: false,
    decorationTheme: 'none'
  },
  {
    id: 'end_stone_bricks',
    name: 'END STONE BRICKS',
    shortName: 'END BRICKS',
    icon: '🧱',
    themeColor: '#ca8a04',
    features: '8x8 TILES • MINECRAFT BRICKS',
    desc: 'Authentic 16-bit Minecraft End Stone Bricks masonry with pale cream brick courses, dark olive mortar grooves, and seamless bond.',
    hasDecorations: false,
    decorationTheme: 'none'
  },
  {
    id: 'none',
    name: 'NO TILES',
    shortName: 'NO TILES',
    icon: '🚫',
    themeColor: '#64748b',
    features: 'CLEAN RING • NO TILES / NO GRID',
    desc: 'Pure clean minimalist fighting ring with a solid backdrop and zero floor tiles, grid lines, or ground sprites.',
    hasDecorations: false,
    decorationTheme: 'none'
  }
];

let _selectedArenaTheme = null;
let _isArenaThemeModalOpen = false;
let _modalScrollY = 0;
let _miniPreviewCache = {};

// ─────────────────────────────────────────────
// STATE & SELECTION PERSISTENCE
// ─────────────────────────────────────────────

export function getSelectedArenaTheme() {
  if (_selectedArenaTheme !== null) return _selectedArenaTheme;

  // 1. Check state cache
  if (typeof state !== 'undefined') {
    if (state.selectedArenaTheme && ARENA_THEMES.some(t => t.id === state.selectedArenaTheme)) {
      _selectedArenaTheme = state.selectedArenaTheme;
      return _selectedArenaTheme;
    }
    if (state.selectedArenaFloor && ARENA_THEMES.some(t => t.id === state.selectedArenaFloor)) {
      _selectedArenaTheme = state.selectedArenaFloor;
      state.selectedArenaTheme = _selectedArenaTheme;
      return _selectedArenaTheme;
    }
  }

  // 2. Check localStorage with legacy fallback
  try {
    const saved = localStorage.getItem(ARENA_THEME_STORAGE_KEY);
    if (saved && ARENA_THEMES.some(t => t.id === saved)) {
      _selectedArenaTheme = saved;
      if (typeof state !== 'undefined') {
        state.selectedArenaTheme = saved;
        state.selectedArenaFloor = saved;
      }
      return _selectedArenaTheme;
    }
    const legacySaved = localStorage.getItem(LEGACY_ARENA_FLOOR_STORAGE_KEY);
    if (legacySaved && ARENA_THEMES.some(t => t.id === legacySaved)) {
      _selectedArenaTheme = legacySaved;
      if (typeof state !== 'undefined') {
        state.selectedArenaTheme = legacySaved;
        state.selectedArenaFloor = legacySaved;
      }
      return _selectedArenaTheme;
    }
  } catch (e) {}

  _selectedArenaTheme = 'classic_clean';
  if (typeof state !== 'undefined') {
    state.selectedArenaTheme = 'classic_clean';
    state.selectedArenaFloor = 'classic_clean';
  }
  return _selectedArenaTheme;
}

export function setSelectedArenaTheme(themeId) {
  if (!ARENA_THEMES.some(t => t.id === themeId)) themeId = 'classic_clean';
  _selectedArenaTheme = themeId;
  if (typeof state !== 'undefined') {
    state.selectedArenaTheme = themeId;
    state.selectedArenaFloor = themeId;
    if (state._arenaFloorCanvasCache) {
      state._arenaFloorCanvasCache = {};
    }
    state._arenaBorderCanvas = null;
  }
  try {
    localStorage.setItem(ARENA_THEME_STORAGE_KEY, themeId);
    localStorage.setItem(LEGACY_ARENA_FLOOR_STORAGE_KEY, themeId);
  } catch (e) {}
  return _selectedArenaTheme;
}

export function isArenaThemeModalOpen() {
  return _isArenaThemeModalOpen;
}

export function openArenaThemeModal() {
  _isArenaThemeModalOpen = true;
  _modalScrollY = 0;
}

export function closeArenaThemeModal() {
  _isArenaThemeModalOpen = false;
}

export function toggleArenaThemeModal() {
  _isArenaThemeModalOpen = !_isArenaThemeModalOpen;
  if (_isArenaThemeModalOpen) _modalScrollY = 0;
  return _isArenaThemeModalOpen;
}

// ─────────────────────────────────────────────
// THEME RESOLUTION
// ─────────────────────────────────────────────

export function resolveActiveThemeId() {
  return getSelectedArenaTheme();
}

export function getActiveArenaThemeDef() {
  const activeId = resolveActiveThemeId();
  return ARENA_THEMES.find(t => t.id === activeId) || ARENA_THEMES[0];
}

/**
 * Returns the extra perimeter wall block thickness protruding above arena.y.
 * For example, Bomberman Normal Zone features 25px 3D bevel blocks outside the arena boundary,
 * requiring HUD elements above the top wall to elevate accordingly.
 */
export function getArenaTopWallBlockThickness(themeId = resolveActiveThemeId()) {
  if (themeId === 'bomberman_normal') return 25;
  const theme = ARENA_THEMES.find(t => t.id === themeId);
  return theme?.wallBlockThickness || 0;
}

// ─────────────────────────────────────────────
// UNIVERSAL TILE GRID MATH & SNAPPING API
// ─────────────────────────────────────────────

export function getTileGridInfo(arena) {
  arena = arena || (typeof state !== 'undefined' && state.arena) || { x: 0, y: 0, width: 460, height: 460 };
  const themeDef = getActiveArenaThemeDef();
  const cols = ARENA_TILE_COUNT;
  const rows = ARENA_TILE_COUNT;
  const cellW = arena.width / cols;
  const cellH = arena.height / rows;

  return {
    arenaX: arena.x,
    arenaY: arena.y,
    cols,
    rows,
    cellW,
    cellH,
    totalTiles: cols * rows,
    tileSize: Math.min(cellW, cellH),
    themeDef,
    floorDef: themeDef
  };
}

export function getNearestTileCenter(targetX, targetY, arena, existingOccupants = []) {
  arena = arena || (typeof state !== 'undefined' && state.arena) || { x: 0, y: 0, width: 460, height: 460 };
  const { cols, rows, cellW, cellH } = getTileGridInfo(arena);

  const baseCol = Math.max(0, Math.min(cols - 1, Math.floor((targetX - arena.x) / cellW)));
  const baseRow = Math.max(0, Math.min(rows - 1, Math.floor((targetY - arena.y) / cellH)));

  const isInsideCircularArena = (cx, cy) => {
    if (arena.shape !== 'circle') return true;
    const arenaMidX = arena.x + arena.width / 2;
    const arenaMidY = arena.y + arena.height / 2;
    const ar = (arena.radius !== undefined ? arena.radius : (arena.width / 2)) - 25;
    return Math.hypot(cx - arenaMidX, cy - arenaMidY) <= ar;
  };

  const isOccupied = (c, r) => {
    const cx = arena.x + (c + 0.5) * cellW;
    const cy = arena.y + (r + 0.5) * cellH;
    if (!isInsideCircularArena(cx, cy)) return true;
    return existingOccupants.some(occ => {
      if (!occ || occ.hp <= 0) return false;
      return Math.hypot(occ.x - cx, occ.y - cy) < Math.min(cellW, cellH) * 0.45;
    });
  };

  if (!isOccupied(baseCol, baseRow) && isInsideCircularArena(arena.x + (baseCol + 0.5) * cellW, arena.y + (baseRow + 0.5) * cellH)) {
    return {
      x: arena.x + (baseCol + 0.5) * cellW,
      y: arena.y + (baseRow + 0.5) * cellH,
      col: baseCol,
      row: baseRow
    };
  }

  // Find nearest unoccupied tile center
  let bestCenter = null;
  let minD = Infinity;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isOccupied(c, r)) continue;
      const cx = arena.x + (c + 0.5) * cellW;
      const cy = arena.y + (r + 0.5) * cellH;
      if (!isInsideCircularArena(cx, cy)) continue;
      const d = Math.hypot(cx - targetX, cy - targetY);
      if (d < minD) {
        minD = d;
        bestCenter = { x: cx, y: cy, col: c, row: r };
      }
    }
  }

  if (bestCenter) return bestCenter;

  return {
    x: arena.x + (baseCol + 0.5) * cellW,
    y: arena.y + (baseRow + 0.5) * cellH,
    col: baseCol,
    row: baseRow
  };
}

export function getRandomTileCenter(arena, existingOccupants = []) {
  arena = arena || (typeof state !== 'undefined' && state.arena) || { x: 0, y: 0, width: 460, height: 460 };
  const { cols, rows, cellW, cellH } = getTileGridInfo(arena);

  const validTiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = arena.x + (c + 0.5) * cellW;
      const cy = arena.y + (r + 0.5) * cellH;
      if (arena.shape === 'circle') {
        const arenaMidX = arena.x + arena.width / 2;
        const arenaMidY = arena.y + arena.height / 2;
        const ar = (arena.radius !== undefined ? arena.radius : (arena.width / 2)) - 25;
        if (Math.hypot(cx - arenaMidX, cy - arenaMidY) > ar) continue;
      }
      validTiles.push({ x: cx, y: cy, col: c, row: r });
    }
  }

  if (validTiles.length === 0) {
    return { x: arena.x + arena.width / 2, y: arena.y + arena.height / 2, col: 0, row: 0 };
  }

  return validTiles[Math.floor(Math.random() * validTiles.length)];
}

export function isTileOccupied(col, row, arena, occupants = []) {
  if (!occupants || occupants.length === 0) return false;
  arena = arena || (typeof state !== 'undefined' && state.arena) || { x: 0, y: 0, width: 460, height: 460 };
  const { cellW, cellH } = getTileGridInfo(arena);
  const cx = arena.x + (col + 0.5) * cellW;
  const cy = arena.y + (row + 0.5) * cellH;
  return occupants.some(occ => occ && occ.hp > 0 && Math.hypot(occ.x - cx, occ.y - cy) < Math.min(cellW, cellH) * 0.45);
}

// ─────────────────────────────────────────────
// AUTHENTIC 2D DISCRETE PIXEL ART HELPERS
// ─────────────────────────────────────────────

function _pixelRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function _pixelDiamond(ctx, cx, cy, size, color) {
  cx = Math.round(cx);
  cy = Math.round(cy);
  ctx.fillStyle = color;
  for (let dy = -size; dy <= size; dy++) {
    const span = size - Math.abs(dy);
    ctx.fillRect(cx - span, cy + dy, span * 2 + 1, 1);
  }
}

function _pixelCross(ctx, cx, cy, armLen, thick, color) {
  cx = Math.round(cx);
  cy = Math.round(cy);
  ctx.fillStyle = color;
  ctx.fillRect(cx - armLen, cy - Math.floor(thick / 2), armLen * 2 + 1, thick);
  ctx.fillRect(cx - Math.floor(thick / 2), cy - armLen, thick, armLen * 2 + 1);
}

function _pixelLBracket(ctx, x, y, len, thick, dirX, dirY, color) {
  x = Math.round(x);
  y = Math.round(y);
  ctx.fillStyle = color;
  if (dirX > 0) {
    ctx.fillRect(x, y, len, thick);
  } else {
    ctx.fillRect(x - len + thick, y, len, thick);
  }
  if (dirY > 0) {
    ctx.fillRect(x, y, thick, len);
  } else {
    ctx.fillRect(x, y - len + thick, thick, len);
  }
}

// ─────────────────────────────────────────────
// MODULAR PIXEL ART THEME GENERATORS
// ─────────────────────────────────────────────

function _renderNoTilesFloor(oc, width, height, isDark) {
  const bgColor = isDark ? (CONFIG.darkArenaInnerBgColor || '#000000') : (CONFIG.arenaInnerBgColor || '#919298ff');
  _pixelRect(oc, 0, 0, width, height, bgColor);
}

function _renderPixelCleanFloor(oc, width, height, cols, rows, cellW, cellH, isDark) {
  if (typeof CONFIG !== 'undefined' && CONFIG.hudLayoutStyle === 'classic') {
    const bgColor = isDark ? '#070a13' : '#f8fafc';
    const gridDotColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.12)';
    const frameColor = isDark ? '#334155' : '#cbd5e1';
    const bracketColor = isDark ? '#64748b' : '#475569';

    _pixelRect(oc, 0, 0, width, height, bgColor);

    for (let r = 1; r < rows; r++) {
      for (let c = 1; c < cols; c++) {
        const gx = Math.round(c * cellW);
        const gy = Math.round(r * cellH);
        _pixelRect(oc, gx - 1, gy, 3, 1, gridDotColor);
        _pixelRect(oc, gx, gy - 1, 1, 3, gridDotColor);
      }
    }

    const pad = 6;
    _pixelRect(oc, pad, pad, width - pad * 2, 2, frameColor);
    _pixelRect(oc, pad, height - pad - 2, width - pad * 2, 2, frameColor);
    _pixelRect(oc, pad, pad, 2, height - pad * 2, frameColor);
    _pixelRect(oc, width - pad - 2, pad, 2, height - pad * 2, frameColor);

    const bLen = 14;
    const bThick = 3;
    _pixelLBracket(oc, pad + 2, pad + 2, bLen, bThick, 1, 1, bracketColor);
    _pixelLBracket(oc, width - pad - 2 - bThick, pad + 2, bLen, bThick, -1, 1, bracketColor);
    _pixelLBracket(oc, pad + 2, height - pad - 2 - bThick, bLen, bThick, 1, -1, bracketColor);
    _pixelLBracket(oc, width - pad - 2 - bThick, height - pad - 2 - bThick, bLen, bThick, -1, -1, bracketColor);
    return;
  }

  const customInnerBg = isDark ? (CONFIG.darkArenaInnerBgColor || null) : (CONFIG.arenaInnerBgColor || null);
  const bgColor = customInnerBg || (isDark ? '#080B14' : '#F6F8FC');
  const crossColor = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(15, 23, 42, 0.22)';
  const crossDotColor = isDark ? 'rgba(255, 255, 255, 0.38)' : 'rgba(15, 23, 42, 0.38)';
  const centerEmblemColor = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(15, 23, 42, 0.18)';
  const centerCoreColor = isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(15, 23, 42, 0.28)';
  const cornerMarkColor = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(15, 23, 42, 0.16)';

  _pixelRect(oc, 0, 0, width, height, bgColor);

  const edgeWashColor = isDark ? 'rgba(0, 0, 0, 0.40)' : 'rgba(15, 23, 42, 0.04)';
  _pixelRect(oc, 0, 0, width, 4, edgeWashColor);
  _pixelRect(oc, 0, height - 4, width, 4, edgeWashColor);
  _pixelRect(oc, 0, 0, 4, height, edgeWashColor);
  _pixelRect(oc, width - 4, 0, 4, height, edgeWashColor);

  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      const gx = Math.round(c * cellW);
      const gy = Math.round(r * cellH);
      _pixelRect(oc, gx - 3, gy, 7, 1, crossColor);
      _pixelRect(oc, gx, gy - 3, 1, 7, crossColor);
      _pixelRect(oc, gx - 1, gy - 1, 3, 3, crossDotColor);
    }
  }

  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  _pixelDiamond(oc, cx, cy, 18, centerEmblemColor);
  _pixelDiamond(oc, cx, cy, 16, bgColor);
  _pixelDiamond(oc, cx, cy, 8, centerEmblemColor);
  _pixelDiamond(oc, cx, cy, 6, bgColor);
  _pixelCross(oc, cx, cy, 12, 1, centerCoreColor);
  _pixelRect(oc, cx - 2, cy - 2, 5, 5, centerCoreColor);
  _pixelRect(oc, cx - 1, cy - 1, 3, 3, isDark ? '#FFFFFF' : '#050609');

  const pad = 14;
  const tickLen = 10;
  const tickThick = 2;
  _pixelLBracket(oc, pad, pad, tickLen, tickThick, 1, 1, cornerMarkColor);
  _pixelLBracket(oc, width - pad - tickThick, pad, tickLen, tickThick, -1, 1, cornerMarkColor);
  _pixelLBracket(oc, pad, height - pad - tickThick, tickLen, tickThick, 1, -1, cornerMarkColor);
  _pixelLBracket(oc, width - pad - tickThick, height - pad - tickThick, tickLen, tickThick, -1, -1, cornerMarkColor);
}

// ─────────────────────────────────────────────
// HALLOWEEN SPOOKY GOTHIC FLOOR RENDERER
// ─────────────────────────────────────────────

function _renderHalloweenFloor(oc, width, height, cols, rows, cellW, cellH, isDark) {
  // Deep dark obsidian / purple-charcoal underlay
  const mortarBg = isDark ? '#06050b' : '#0a0812';
  _pixelRect(oc, 0, 0, width, height, mortarBg);

  // Weathered gothic tombstone cobblestone tones
  const stoneA = isDark ? '#13101d' : '#1e192c';
  const stoneB = isDark ? '#0d0b16' : '#161322';
  const stoneHi = isDark ? '#2e263d' : '#3f3554';
  const stoneSh = isDark ? '#06050b' : '#0c0a13';
  const seamColor = isDark ? '#040307' : '#07050d';

  // Subtle pumpkin amber & spectral purple rune accents
  const emberGlow = '#f97316';
  const emberSoft = 'rgba(249, 115, 22, 0.40)';
  const spectralPurple = '#a855f7';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = Math.round(c * cellW) + 2;
      const by = Math.round(r * cellH) + 2;
      const bw = Math.round((c + 1) * cellW) - bx - 2;
      const bh = Math.round((r + 1) * cellH) - by - 2;
      const isAlt = ((r + c) % 2 === 0);

      // Base Gothic Paver
      _pixelRect(oc, bx, by, bw, bh, isAlt ? stoneA : stoneB);

      // 3D Weathered Stone Bevels
      _pixelRect(oc, bx, by, bw, 2, stoneHi);
      _pixelRect(oc, bx, by, 2, bh, stoneHi);
      _pixelRect(oc, bx, by + bh - 2, bw, 2, stoneSh);
      _pixelRect(oc, bx + bw - 2, by, 2, bh, stoneSh);

      // 1px Mortar Seam Frame
      _pixelRect(oc, bx - 1, by - 1, bw + 2, 1, seamColor);
      _pixelRect(oc, bx - 1, by + bh, bw + 2, 1, seamColor);
      _pixelRect(oc, bx - 1, by - 1, 1, bh + 2, seamColor);
      _pixelRect(oc, bx + bw, by - 1, 1, bh + 2, seamColor);

      const seed = (r * 17 + c * 31) % 100;

      // Jagged Stone Fissures / Grave Cracks
      if (seed % 3 === 0) {
        let kx = bx + Math.round(bw * 0.28);
        let ky = by + Math.round(bh * 0.32);
        const crackSteps = 7;
        for (let s = 0; s < crackSteps; s++) {
          _pixelRect(oc, kx, ky, 2, 2, '#040307');
          _pixelRect(oc, kx + 1, ky + 1, 1, 1, stoneHi);
          kx += (s % 2 === 0 ? 2 : 1);
          ky += (s % 3 === 0 ? 2 : 1);
        }
      }

      // Dark Eerie Moss / Lichen on Paver Corners
      if (seed % 4 === 0) {
        const mx = bx + bw - 7;
        const my = by + bh - 7;
        _pixelRect(oc, mx, my, 6, 6, '#182414');
        _pixelRect(oc, mx + 1, my + 1, 4, 4, '#263a1f');
        _pixelRect(oc, mx + 2, my + 2, 2, 2, '#3b5a2f');
      }

      // Subtle Spectral Purple & Pumpkin Ember Keystones
      if (seed % 9 === 0) {
        const ex = bx + Math.round(bw * 0.50);
        const ey = by + Math.round(bh * 0.50);
        _pixelRect(oc, ex - 1, ey - 1, 3, 3, emberSoft);
        _pixelRect(oc, ex, ey, 1, 1, emberGlow);
      } else if (seed % 13 === 0) {
        const px = bx + Math.round(bw * 0.50);
        const py = by + Math.round(bh * 0.50);
        _pixelRect(oc, px - 1, py, 3, 1, spectralPurple);
        _pixelRect(oc, px, py - 1, 1, 3, spectralPurple);
        _pixelRect(oc, px, py, 1, 1, '#f3e8ff');
      }
    }
  }

  // Spooky Gothic Center Emblem & Pumpkin Ember Reticle
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  _pixelDiamond(oc, cx, cy, 14, '#06050b');
  _pixelDiamond(oc, cx, cy, 11, '#7c2d12');
  _pixelDiamond(oc, cx, cy, 8, '#c2410c');
  _pixelDiamond(oc, cx, cy, 5, '#f97316');
  _pixelCross(oc, cx, cy, 9, 1, '#fbbf24');
  _pixelRect(oc, cx - 1, cy - 1, 3, 3, '#06050b');
  _pixelRect(oc, cx, cy, 1, 1, '#ffffff');

  // Spooky Corner Brackets (Glowing Amber Needles)
  const pad = 12;
  const bLen = 10;
  const bThick = 2;
  _pixelLBracket(oc, pad, pad, bLen, bThick, 1, 1, emberGlow);
  _pixelLBracket(oc, width - pad - bThick, pad, bLen, bThick, -1, 1, emberGlow);
  _pixelLBracket(oc, pad, height - pad - bThick, bLen, bThick, 1, -1, emberGlow);
  _pixelLBracket(oc, width - pad - bThick, height - pad - bThick, bLen, bThick, -1, -1, emberGlow);
}

// ─────────────────────────────────────────────
// BOMBERMAN "NORMAL ZONE" CLASSIC FLOOR & BEVEL BLOCK RENDERER
// ─────────────────────────────────────────────

export function _drawBombermanBevelBlock(oc, bx, by, bw, bh, isDark = false) {
  const pad = 0.5;
  const x = Math.round(bx) + pad;
  const y = Math.round(by) + pad;
  const w = Math.round(bw) - pad * 2;
  const h = Math.round(bh) - pad * 2;
  const bevel = Math.max(3, Math.round(Math.min(w, h) * 0.20));

  // 1. Dark outer seam gap
  oc.fillStyle = '#181818';
  oc.fillRect(x - 0.5, y - 0.5, w + 1, h + 1);

  // 2. Main face base
  oc.fillStyle = isDark ? '#686868' : '#808080';
  oc.fillRect(x + bevel, y + bevel, w - bevel * 2, h - bevel * 2);

  // 3. Top Bevel (Highlight)
  oc.fillStyle = isDark ? '#d4d4d4' : '#e8e8e8';
  oc.beginPath();
  oc.moveTo(x, y);
  oc.lineTo(x + w, y);
  oc.lineTo(x + w - bevel, y + bevel);
  oc.lineTo(x + bevel, y + bevel);
  oc.closePath();
  oc.fill();

  // 4. Left Bevel (Sub-highlight)
  oc.fillStyle = isDark ? '#a8a8a8' : '#c0c0c0';
  oc.beginPath();
  oc.moveTo(x, y);
  oc.lineTo(x + bevel, y + bevel);
  oc.lineTo(x + bevel, y + h - bevel);
  oc.lineTo(x, y + h);
  oc.closePath();
  oc.fill();

  // 5. Right Bevel (Medium Shade)
  oc.fillStyle = isDark ? '#303030' : '#404040';
  oc.beginPath();
  oc.moveTo(x + w, y);
  oc.lineTo(x + w, y + h);
  oc.lineTo(x + w - bevel, y + h - bevel);
  oc.lineTo(x + w - bevel, y + bevel);
  oc.closePath();
  oc.fill();

  // 6. Bottom Bevel (Deep Dark Shade)
  oc.fillStyle = isDark ? '#202020' : '#303030';
  oc.beginPath();
  oc.moveTo(x, y + h);
  oc.lineTo(x + bevel, y + h - bevel);
  oc.lineTo(x + w - bevel, y + h - bevel);
  oc.lineTo(x + w, y + h);
  oc.closePath();
  oc.fill();

  // 7. Top-left corner glint
  oc.fillStyle = isDark ? '#f0f0f0' : '#ffffff';
  oc.fillRect(x + 1, y + 1, 2, 1);
  oc.fillRect(x + 1, y + 1, 1, 2);
}

function _renderBombermanFloor(oc, width, height, cols, rows, cellW, cellH, isDark) {
  // 1. Authentic Emerald Green Turf Base
  const grassBase = isDark ? '#0c6426' : '#107830';
  const shadowDark = isDark ? '#053814' : '#085820';
  const shadowFringe = isDark ? '#08481c' : '#0a6426';
  const grassHighlight = isDark ? '#147c32' : '#188c38';

  _pixelRect(oc, 0, 0, width, height, grassBase);

  // 2. Top Edge Shadow (Cast by top wall blocks)
  const shadowDepth = Math.max(6, Math.round(height * 0.022));
  _pixelRect(oc, 0, 0, width, shadowDepth, shadowDark);

  // Dithered saw-tooth fringe (stepped teeth along entire top edge)
  const toothW = 4;
  const toothH = 4;
  for (let x = 0; x < width; x += toothW * 2) {
    _pixelRect(oc, x, shadowDepth, toothW, toothH, shadowDark);
    _pixelRect(oc, x + toothW, shadowDepth, toothW, 2, shadowFringe);
  }

  // 3. Subtle Left & Right Wall Edge Shade
  const edgeShadeW = 3;
  _pixelRect(oc, 0, 0, edgeShadeW, height, 'rgba(8, 88, 32, 0.35)');
  _pixelRect(oc, width - edgeShadeW, 0, edgeShadeW, height, 'rgba(8, 88, 32, 0.35)');

  // 4. Subtle Grass Blade Texture Variations
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = Math.round(c * cellW);
      const by = Math.round(r * cellH);
      const bw = Math.round((c + 1) * cellW) - bx;
      const bh = Math.round((r + 1) * cellH) - by;
      const seed = (r * 19 + c * 31) % 100;

      if (seed % 3 === 0) {
        const gx = bx + Math.round(bw * 0.35);
        const gy = by + Math.round(bh * 0.45);
        if (gy > shadowDepth + 4) {
          _pixelRect(oc, gx, gy, 2, 3, grassHighlight);
          _pixelRect(oc, gx + 1, gy - 1, 1, 2, grassHighlight);
        }
      }
      if (seed % 5 === 0) {
        const gx2 = bx + Math.round(bw * 0.70);
        const gy2 = by + Math.round(bh * 0.65);
        if (gy2 > shadowDepth + 4) {
          _pixelRect(oc, gx2, gy2, 2, 2, shadowDark);
        }
      }
    }
  }

  // 5. Discrete Intersection Crosshairs (+)
  const crossColor = 'rgba(8, 88, 32, 0.55)';
  const crossCore = 'rgba(8, 88, 32, 0.85)';
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      const gx = Math.round(c * cellW);
      const gy = Math.round(r * cellH);
      _pixelRect(oc, gx - 2, gy, 5, 1, crossColor);
      _pixelRect(oc, gx, gy - 2, 1, 5, crossColor);
      _pixelRect(oc, gx - 1, gy - 1, 3, 3, crossCore);
    }
  }
}

function _renderPixelPvzGrassFloor(oc, width, height, cols, rows, cellW, cellH, isDark) {
  const grassA = isDark ? '#2b7a18' : '#43b02a';
  const grassB = isDark ? '#236313' : '#389822';
  const seamColor = isDark ? '#19450c' : '#297017';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = Math.round(c * cellW);
      const by = Math.round(r * cellH);
      const bw = Math.round((c + 1) * cellW) - bx;
      const bh = Math.round((r + 1) * cellH) - by;
      const isAlt = ((r + c) % 2 === 0);

      _pixelRect(oc, bx, by, bw, bh, isAlt ? grassA : grassB);
      _pixelRect(oc, bx, by, bw, 1, seamColor);
      _pixelRect(oc, bx, by, 1, bh, seamColor);

      const cellSeed = (r * 13 + c * 37) % 100;

      if ((c === 3 && (r === 1 || r === 4)) || (c === 1 && r === 2)) {
        const dx = bx + Math.round(bw * 0.22);
        const dy = by + Math.round(bh * 0.22);
        const dw = Math.round(bw * 0.56);
        const dh = Math.round(bh * 0.56);
        _pixelRect(oc, dx, dy, dw, dh, '#78350f');
        _pixelRect(oc, dx + 2, dy + 2, dw - 4, dh - 4, '#92400e');
        _pixelRect(oc, dx - 2, dy + 4, 2, dh - 8, '#78350f');
        _pixelRect(oc, dx + dw, dy + 4, 2, dh - 8, '#78350f');
        _pixelRect(oc, dx + 4, dy - 2, dw - 8, 2, '#78350f');
        _pixelRect(oc, dx + 4, dy + dh, dw - 8, 2, '#78350f');
        _pixelRect(oc, dx + 4, dy + 4, 3, 2, '#94a3b8');
        _pixelRect(oc, dx + dw - 7, dy + dh - 6, 4, 2, '#64748b');
      } else {
        const bladeTip = isDark ? '#4ade80' : '#86efac';
        const bladeRoot = isDark ? '#14532d' : '#166534';
        
        const kx1 = bx + Math.round(bw * 0.25);
        const ky1 = by + Math.round(bh * 0.35);
        _pixelRect(oc, kx1, ky1, 2, 5, bladeRoot);
        _pixelRect(oc, kx1 + 2, ky1 - 2, 2, 7, bladeTip);
        _pixelRect(oc, kx1 + 4, ky1 + 1, 2, 4, bladeRoot);

        const kx2 = bx + Math.round(bw * 0.70);
        const ky2 = by + Math.round(bh * 0.65);
        _pixelRect(oc, kx2, ky2, 2, 4, bladeRoot);
        _pixelRect(oc, kx2 - 2, ky2 - 2, 2, 6, bladeTip);

        if (cellSeed % 3 === 0) {
          const fx = bx + Math.round(bw * 0.50);
          const fy = by + Math.round(bh * 0.40);
          _pixelRect(oc, fx - 2, fy - 1, 5, 3, '#ffffff');
          _pixelRect(oc, fx - 1, fy - 2, 3, 5, '#ffffff');
          _pixelRect(oc, fx, fy, 1, 1, '#f59e0b');
        } else if (cellSeed % 5 === 0) {
          const sx = bx + Math.round(bw * 0.45);
          const sy = by + Math.round(bh * 0.50);
          _pixelRect(oc, sx, sy, 4, 2, 'rgba(254, 240, 138, 0.45)');
          _pixelRect(oc, sx + 1, sy - 1, 2, 4, 'rgba(254, 240, 138, 0.45)');
        }
      }
    }
  }
}

function _renderPixelClashFloor(oc, width, height, cols, rows, cellW, cellH, isDark) {
  const slateBaseA = isDark ? '#1e293b' : '#475569';
  const slateBaseB = isDark ? '#0f172a' : '#334155';
  const slateLight = isDark ? '#475569' : '#94a3b8';
  const slateDark = isDark ? '#020617' : '#1e293b';

  const turfBaseA = isDark ? '#15803d' : '#22c55e';
  const turfBaseB = isDark ? '#166534' : '#16a34a';
  const turfSeam = isDark ? '#052e16' : '#14532d';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = Math.round(c * cellW);
      const by = Math.round(r * cellH);
      const bw = Math.round((c + 1) * cellW) - bx;
      const bh = Math.round((r + 1) * cellH) - by;
      const isBorder = (r === 0 || r === rows - 1 || c === 0 || c === cols - 1);
      const isAlt = ((r + c) % 2 === 0);

      if (isBorder) {
        _pixelRect(oc, bx, by, bw, bh, isAlt ? slateBaseA : slateBaseB);
        _pixelRect(oc, bx + 1, by + 1, bw - 2, 2, slateLight);
        _pixelRect(oc, bx + 1, by + 1, 2, bh - 2, slateLight);
        _pixelRect(oc, bx + 1, by + bh - 3, bw - 2, 2, slateDark);
        _pixelRect(oc, bx + bw - 3, by + 1, 2, bh - 2, slateDark);
        _pixelRect(oc, bx, by, bw, 1, '#020617');
        _pixelRect(oc, bx, by + bh - 1, bw, 1, '#020617');
        _pixelRect(oc, bx, by, 1, bh, '#020617');
        _pixelRect(oc, bx + bw - 1, by, 1, bh, '#020617');

        const isCorner = (r === 0 || r === rows - 1) && (c === 0 || c === cols - 1);
        const isMidEdge = (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) && (c === Math.floor(cols / 2) || r === Math.floor(rows / 2));
        if (isCorner || isMidEdge) {
          const rvx = Math.round(bx + bw / 2);
          const rvy = Math.round(by + bh / 2);
          _pixelRect(oc, rvx - 3, rvy - 3, 7, 7, '#78350f');
          _pixelRect(oc, rvx - 2, rvy - 2, 5, 5, '#f59e0b');
          _pixelRect(oc, rvx - 1, rvy - 1, 3, 3, '#fde047');
          _pixelRect(oc, rvx - 2, rvy - 2, 2, 2, '#ffffff');
          _pixelRect(oc, rvx + 1, rvy + 1, 1, 1, '#b45309');
        }
      } else {
        _pixelRect(oc, bx, by, bw, bh, isAlt ? turfBaseA : turfBaseB);
        _pixelRect(oc, bx, by, bw, 1, turfSeam);
        _pixelRect(oc, bx, by, 1, bh, turfSeam);

        const tipColor = isDark ? '#4ade80' : '#86efac';
        const rootColor = isDark ? '#052e16' : '#14532d';
        const gx1 = bx + Math.round(bw * 0.30);
        const gy1 = by + Math.round(bh * 0.35);
        _pixelRect(oc, gx1, gy1, 2, 4, rootColor);
        _pixelRect(oc, gx1 + 2, gy1 - 2, 2, 6, tipColor);

        const gx2 = bx + Math.round(bw * 0.70);
        const gy2 = by + Math.round(bh * 0.65);
        _pixelRect(oc, gx2, gy2, 2, 5, rootColor);
        _pixelRect(oc, gx2 - 2, gy2 - 1, 2, 4, tipColor);

        const midC = Math.floor(cols / 2);
        const midR = Math.floor(rows / 2);
        if ((r === midR || r === midR - 1) && (c === midC || c === midC - 1)) {
          const fx = (c === midC ? bx + 2 : bx + bw - 5);
          const fy = (r === midR ? by + 2 : by + bh - 5);
          _pixelRect(oc, fx, fy, 3, 3, '#f59e0b');
          _pixelRect(oc, fx + 1, fy + 1, 1, 1, '#fef08a');
        }
      }
    }
  }
}

function _renderPixelCheckerFloor(oc, width, height, cols, rows, cellW, cellH, isDark) {
  const lightBase = isDark ? '#334155' : '#f8fafc';
  const lightBevelHi = isDark ? '#64748b' : '#ffffff';
  const lightBevelSh = isDark ? '#1e293b' : '#cbd5e1';

  const darkBase = isDark ? '#1e1b4b' : '#4f46e5';
  const darkBevelHi = isDark ? '#4338ca' : '#818cf8';
  const darkBevelSh = isDark ? '#0f172a' : '#312e81';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = Math.round(c * cellW);
      const by = Math.round(r * cellH);
      const bw = Math.round((c + 1) * cellW) - bx;
      const bh = Math.round((r + 1) * cellH) - by;
      const isAlt = ((r + c) % 2 === 0);

      const base = isAlt ? lightBase : darkBase;
      const hi = isAlt ? lightBevelHi : darkBevelHi;
      const sh = isAlt ? lightBevelSh : darkBevelSh;

      _pixelRect(oc, bx, by, bw, bh, base);
      _pixelRect(oc, bx + 1, by + 1, bw - 2, 2, hi);
      _pixelRect(oc, bx + 1, by + 1, 2, bh - 2, hi);
      _pixelRect(oc, bx + 1, by + bh - 3, bw - 2, 2, sh);
      _pixelRect(oc, bx + bw - 3, by + 1, 2, bh - 2, sh);

      _pixelRect(oc, bx, by, bw, 1, '#0f172a');
      _pixelRect(oc, bx, by + bh - 1, bw, 1, '#0f172a');
      _pixelRect(oc, bx, by, 1, bh, '#0f172a');
      _pixelRect(oc, bx + bw - 1, by, 1, bh, '#0f172a');

      const studHi = isAlt ? '#ffffff' : '#a5b4fc';
      const studSh = isAlt ? '#94a3b8' : '#1e1b4b';
      const off = 5;

      _pixelRect(oc, bx + off, by + off, 2, 2, studHi);
      _pixelRect(oc, bx + off + 1, by + off + 1, 1, 1, studSh);
      _pixelRect(oc, bx + bw - off - 2, by + off, 2, 2, studHi);
      _pixelRect(oc, bx + bw - off - 1, by + off + 1, 1, 1, studSh);
      _pixelRect(oc, bx + off, by + bh - off - 2, 2, 2, studHi);
      _pixelRect(oc, bx + off + 1, by + bh - off - 1, 1, 1, studSh);
      _pixelRect(oc, bx + bw - off - 2, by + bh - off - 2, 2, 2, studHi);
      _pixelRect(oc, bx + bw - off - 1, by + bh - off - 1, 1, 1, studSh);
    }
  }

  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  _pixelDiamond(oc, cx, cy, 7, '#0f172a');
  _pixelDiamond(oc, cx, cy, 5, '#8b5cf6');
  _pixelDiamond(oc, cx, cy, 3, '#c084fc');
  _pixelRect(oc, cx, cy, 1, 1, '#ffffff');
}

function _renderPixelCyberFloor(oc, width, height, cols, rows, cellW, cellH, isDark) {
  const bgVoid = isDark ? '#040711' : '#080d1a';
  _pixelRect(oc, 0, 0, width, height, bgVoid);

  const neonCyan = '#06b6d4';
  const neonCyanBright = '#22d3ee';
  const neonCyanGlow = 'rgba(6, 182, 212, 0.35)';

  for (let c = 0; c <= cols; c++) {
    const gx = Math.round(c * cellW);
    _pixelRect(oc, gx - 1, 0, 3, height, neonCyanGlow);
    _pixelRect(oc, gx, 0, 1, height, neonCyanBright);
  }
  for (let r = 0; r <= rows; r++) {
    const gy = Math.round(r * cellH);
    _pixelRect(oc, 0, gy - 1, width, 3, neonCyanGlow);
    _pixelRect(oc, 0, gy, width, 1, neonCyanBright);
  }

  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const gx = Math.round(c * cellW);
      const gy = Math.round(r * cellH);
      _pixelDiamond(oc, gx, gy, 2, neonCyan);
      _pixelRect(oc, gx, gy, 1, 1, '#ffffff');
    }
  }

  const pad = 12;
  const traceSteps = [
    { x: pad, y: pad + 24, len: 12, dx: 0, dy: -1 },
    { x: pad, y: pad + 12, len: 12, dx: 1, dy: 0 },
    { x: width - pad - 2, y: pad + 24, len: 12, dx: 0, dy: -1 },
    { x: width - pad - 14, y: pad + 12, len: 12, dx: 1, dy: 0 },
    { x: pad, y: height - pad - 26, len: 12, dx: 0, dy: 1 },
    { x: pad, y: height - pad - 14, len: 12, dx: 1, dy: 0 },
    { x: width - pad - 2, y: height - pad - 26, len: 12, dx: 0, dy: 1 },
    { x: width - pad - 14, y: height - pad - 14, len: 12, dx: 1, dy: 0 }
  ];
  for (const tr of traceSteps) {
    _pixelRect(oc, tr.x, tr.y, (tr.dx ? tr.len : 2), (tr.dy ? tr.len : 2), neonCyanBright);
  }

  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const arm = 10;
  _pixelRect(oc, cx - arm, cy, arm * 2 + 1, 1, neonCyanBright);
  _pixelRect(oc, cx, cy - arm, 1, arm * 2 + 1, neonCyanBright);
  _pixelDiamond(oc, cx, cy, 3, neonCyan);
  _pixelRect(oc, cx - 1, cy - 1, 3, 3, bgVoid);
  _pixelRect(oc, cx, cy, 1, 1, '#ffffff');
}

function _renderPixelDungeonFloor(oc, width, height, cols, rows, cellW, cellH, isDark) {
  const mortarColor = isDark ? '#05070a' : '#111827';
  _pixelRect(oc, 0, 0, width, height, mortarColor);

  const stoneA = isDark ? '#27272a' : '#52525b';
  const stoneB = isDark ? '#18181b' : '#3f3f46';
  const stoneHi = isDark ? '#52525b' : '#a1a1aa';
  const stoneSh = isDark ? '#09090b' : '#27272a';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = Math.round(c * cellW) + 2;
      const by = Math.round(r * cellH) + 2;
      const bw = Math.round((c + 1) * cellW) - bx - 2;
      const bh = Math.round((r + 1) * cellH) - by - 2;
      const isAlt = ((r + c) % 2 === 0);

      _pixelRect(oc, bx, by, bw, bh, isAlt ? stoneA : stoneB);
      _pixelRect(oc, bx, by, bw, 2, stoneHi);
      _pixelRect(oc, bx, by, 2, bh, stoneHi);
      _pixelRect(oc, bx, by + bh - 2, bw, 2, stoneSh);
      _pixelRect(oc, bx + bw - 2, by, 2, bh, stoneSh);

      if ((r * 7 + c * 13) % 3 === 0) {
        let kx = bx + Math.round(bw * 0.25);
        let ky = by + Math.round(bh * 0.30);
        const steps = 8;
        for (let s = 0; s < steps; s++) {
          _pixelRect(oc, kx, ky, 2, 2, '#09090b');
          _pixelRect(oc, kx + 1, ky + 1, 1, 1, stoneHi);
          kx += (s % 2 === 0 ? 2 : 1);
          ky += (s % 3 === 0 ? 2 : 1);
        }
      }

      if ((r * 11 + c * 17) % 4 === 0) {
        const mx = bx + bw - 6;
        const my = by + bh - 6;
        _pixelRect(oc, mx, my, 6, 6, '#14532d');
        _pixelRect(oc, mx + 1, my + 1, 4, 4, '#16a34a');
        _pixelRect(oc, mx + 2, my + 2, 2, 2, '#4ade80');
      }
    }
  }

  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  _pixelDiamond(oc, cx, cy, 6, '#09090b');
  _pixelCross(oc, cx, cy, 5, 1, '#38bdf8');
  _pixelRect(oc, cx - 1, cy - 1, 3, 3, '#09090b');
  _pixelRect(oc, cx, cy, 1, 1, '#e0f2fe');
}

function _renderPixelTatamiFloor(oc, width, height, cols, rows, cellW, cellH, isDark) {
  const mortarBg = isDark ? '#100904' : '#1c1208';
  _pixelRect(oc, 0, 0, width, height, mortarBg);

  const strawBase = isDark ? '#78350f' : '#ca8a04';
  const strawReedHi = isDark ? '#92400e' : '#eab308';
  const strawReedSh = isDark ? '#451a03' : '#854d0e';
  const clothTape = isDark ? '#0f172a' : '#1e1b4b';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = Math.round(c * cellW) + 2;
      const by = Math.round(r * cellH) + 2;
      const bw = Math.round((c + 1) * cellW) - bx - 2;
      const bh = Math.round((r + 1) * cellH) - by - 2;
      const isHorizontal = ((r + c) % 2 === 0);

      _pixelRect(oc, bx, by, bw, bh, strawBase);

      if (isHorizontal) {
        for (let ly = by + 4; ly < by + bh - 4; ly += 4) {
          _pixelRect(oc, bx + 5, ly, bw - 10, 1, strawReedHi);
          _pixelRect(oc, bx + 5, ly + 1, bw - 10, 1, strawReedSh);
          for (let lx = bx + 7; lx < bx + bw - 7; lx += 8) {
            _pixelRect(oc, lx + (ly % 8 === 0 ? 0 : 4), ly, 1, 2, strawReedSh);
          }
        }
        _pixelRect(oc, bx, by, 5, bh, clothTape);
        _pixelRect(oc, bx + bw - 5, by, 5, bh, clothTape);

        for (let sy = by + 6; sy < by + bh - 6; sy += 10) {
          _pixelRect(oc, bx + 1, sy + 1, 3, 1, '#ffffff');
          _pixelRect(oc, bx + 2, sy, 1, 3, '#ffffff');
          _pixelRect(oc, bx + bw - 4, sy + 1, 3, 1, '#ffffff');
          _pixelRect(oc, bx + bw - 3, sy, 1, 3, '#ffffff');
        }
      } else {
        for (let lx = bx + 4; lx < bx + bw - 4; lx += 4) {
          _pixelRect(oc, lx, by + 5, 1, bh - 10, strawReedHi);
          _pixelRect(oc, lx + 1, by + 5, 1, bh - 10, strawReedSh);
          for (let ly = by + 7; ly < by + bh - 7; ly += 8) {
            _pixelRect(oc, lx, ly + (lx % 8 === 0 ? 0 : 4), 2, 1, strawReedSh);
          }
        }
        _pixelRect(oc, bx, by, bw, 5, clothTape);
        _pixelRect(oc, bx, by + bh - 5, bw, 5, clothTape);

        for (let sx = bx + 6; sx < bx + bw - 6; sx += 10) {
          _pixelRect(oc, sx + 1, by + 1, 3, 1, '#ffffff');
          _pixelRect(oc, sx + 2, by, 1, 3, '#ffffff');
          _pixelRect(oc, sx + 1, by + bh - 4, 3, 1, '#ffffff');
          _pixelRect(oc, sx + 2, by + bh - 3, 1, 3, '#ffffff');
        }
      }

      _pixelRect(oc, bx, by, 4, 4, '#7c2d12');
      _pixelRect(oc, bx + 1, by + 1, 2, 2, '#b45309');
    }
  }
}

function _renderPixelSandBeachFloor(oc, width, height, cols, rows, cellW, cellH, isDark) {
  const sandBaseA = isDark ? '#1e293b' : '#fde047';
  const sandBaseB = isDark ? '#0f172a' : '#facc15';
  const sandHi = isDark ? '#334155' : '#fef9c3';
  const sandSh = isDark ? '#020617' : '#ca8a04';
  const seamColor = isDark ? '#020617' : '#b45309';

  const waveWater = isDark ? '#0369a1' : '#0284c7';
  const waveShallow = isDark ? '#0891b2' : '#38bdf8';
  const waveFoam = isDark ? '#e0f2fe' : '#ffffff';

  const starfishColor = isDark ? '#c084fc' : '#ef4444';
  const starfishHi = isDark ? '#f3e8ff' : '#fca5a5';
  const starfishDark = isDark ? '#581c87' : '#991b1b';

  const shellPink = isDark ? '#94a3b8' : '#f43f5e';
  const shellWhite = isDark ? '#f1f5f9' : '#fff1f2';
  const shellDark = isDark ? '#475569' : '#881337';

  const jadeStone = isDark ? '#0e7490' : '#059669';
  const jadeStoneHi = isDark ? '#67e8f9' : '#6ee7b7';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = Math.round(c * cellW);
      const by = Math.round(r * cellH);
      const bw = Math.round((c + 1) * cellW) - bx;
      const bh = Math.round((r + 1) * cellH) - by;
      const isAlt = ((r + c) % 2 === 0);

      _pixelRect(oc, bx, by, bw, bh, isAlt ? sandBaseA : sandBaseB);
      _pixelRect(oc, bx + 1, by + 1, bw - 2, 1, sandHi);
      _pixelRect(oc, bx + 1, by + 1, 1, bh - 2, sandHi);
      _pixelRect(oc, bx + 1, by + bh - 2, bw - 2, 1, sandSh);
      _pixelRect(oc, bx + bw - 2, by + 1, 1, bh - 2, sandSh);

      _pixelRect(oc, bx, by, bw, 1, seamColor);
      _pixelRect(oc, bx, by + bh - 1, bw, 1, seamColor);
      _pixelRect(oc, bx, by, 1, bh, seamColor);
      _pixelRect(oc, bx + bw - 1, by, 1, bh, seamColor);

      const rip1Y = by + Math.round(bh * 0.28);
      _pixelRect(oc, bx + 6, rip1Y, bw - 12, 1, sandHi);
      _pixelRect(oc, bx + 7, rip1Y + 1, bw - 14, 1, sandSh);

      const rip2Y = by + Math.round(bh * 0.70);
      _pixelRect(oc, bx + 10, rip2Y, bw - 20, 1, sandHi);
      _pixelRect(oc, bx + 11, rip2Y + 1, bw - 22, 1, sandSh);

      if (r === 0) {
        _pixelRect(oc, bx, by + 1, bw, 3, waveWater);
        _pixelRect(oc, bx, by + 4, bw, 2, waveShallow);
        _pixelRect(oc, bx + (c % 2 === 0 ? 3 : 7), by + 6, bw - 10, 1, waveFoam);
        _pixelRect(oc, bx + 4, by + 8, 2, 2, waveFoam);
        _pixelRect(oc, bx + bw - 8, by + 8, 2, 2, waveFoam);
      } else if (r === rows - 1) {
        _pixelRect(oc, bx, by + bh - 4, bw, 3, waveWater);
        _pixelRect(oc, bx, by + bh - 6, bw, 2, waveShallow);
        _pixelRect(oc, bx + (c % 2 === 0 ? 7 : 3), by + bh - 7, bw - 10, 1, waveFoam);
        _pixelRect(oc, bx + 6, by + bh - 10, 2, 2, waveFoam);
        _pixelRect(oc, bx + bw - 8, by + bh - 10, 2, 2, waveFoam);
      }

      const propSeed = (r * 11 + c * 17) % 6;

      if (propSeed === 0) {
        const sx = bx + Math.round(bw * 0.50);
        const sy = by + Math.round(bh * 0.48);
        _pixelRect(oc, sx - 2, sy - 2, 5, 5, starfishColor);
        _pixelRect(oc, sx - 1, sy - 4, 3, 2, starfishColor);
        _pixelRect(oc, sx - 4, sy - 1, 2, 3, starfishColor);
        _pixelRect(oc, sx + 3, sy - 1, 2, 3, starfishColor);
        _pixelRect(oc, sx - 3, sy + 3, 2, 2, starfishColor);
        _pixelRect(oc, sx + 2, sy + 3, 2, 2, starfishColor);
        _pixelRect(oc, sx, sy, 1, 1, starfishHi);
        _pixelRect(oc, sx - 1, sy - 1, 1, 1, starfishDark);
      } else if (propSeed === 1) {
        const fx = bx + Math.round(bw * 0.45);
        const fy = by + Math.round(bh * 0.46);
        _pixelRect(oc, fx - 2, fy - 2, 5, 4, shellPink);
        _pixelRect(oc, fx - 1, fy - 3, 3, 1, shellWhite);
        _pixelRect(oc, fx - 3, fy, 1, 2, shellDark);
        _pixelRect(oc, fx + 3, fy, 1, 2, shellDark);
        _pixelRect(oc, fx, fy - 1, 1, 3, shellWhite);
        _pixelRect(oc, fx - 1, fy + 2, 3, 1, shellDark);
      } else if (propSeed === 2) {
        const px = bx + Math.round(bw * 0.38);
        const py = by + Math.round(bh * 0.52);
        _pixelRect(oc, px, py, 4, 3, jadeStone);
        _pixelRect(oc, px + 1, py, 2, 1, jadeStoneHi);
        _pixelRect(oc, px + 5, py + 2, 3, 2, isDark ? '#475569' : '#64748b');
        _pixelRect(oc, px + 6, py + 2, 1, 1, '#ffffff');
      } else if (propSeed === 3) {
        const nx = bx + Math.round(bw * 0.60);
        const ny = by + Math.round(bh * 0.42);
        _pixelRect(oc, nx - 2, ny - 2, 4, 4, isDark ? '#67e8f9' : '#fef08a');
        _pixelRect(oc, nx - 1, ny - 1, 2, 2, isDark ? '#0284c7' : '#d97706');
        _pixelRect(oc, nx, ny - 2, 2, 1, '#ffffff');
      } else if (propSeed === 4) {
        const gx = bx + Math.round(bw * 0.55);
        const gy = by + Math.round(bh * 0.44);
        _pixelCross(oc, gx, gy, 2, 1, '#ffffff');
        _pixelRect(oc, gx, gy, 1, 1, isDark ? '#67e8f9' : '#fef08a');
      }
    }
  }

  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  _pixelDiamond(oc, cx, cy, 8, isDark ? '#020617' : '#b45309');
  _pixelDiamond(oc, cx, cy, 6, isDark ? '#0891b2' : '#f59e0b');
  _pixelDiamond(oc, cx, cy, 4, isDark ? '#06b6d4' : '#fde047');
  _pixelCross(oc, cx, cy, 10, 1, isDark ? '#38bdf8' : '#f97316');
  _pixelRect(oc, cx - 1, cy - 1, 3, 3, isDark ? '#040711' : '#ffffff');
  _pixelRect(oc, cx, cy, 1, 1, isDark ? '#38bdf8' : '#ea580c');
}

// ─────────────────────────────────────────────
// PROCEDURAL OFFSCREEN CANVAS TEXTURE GENERATOR
// ─────────────────────────────────────────────

export function getOrCreateThemeCanvas(themeId, arena, isDark = false, fBleed = 0) {
  if (typeof document === 'undefined') return null;

  if (themeId === 'none') {
    const width = Math.max(64, Math.ceil(arena.width + fBleed * 2));
    const height = Math.max(64, Math.ceil(arena.height + fBleed * 2));
    const shape = arena.shape || 'rect';
    const activeInnerBg = isDark ? (CONFIG.darkArenaInnerBgColor || 'dark') : (CONFIG.arenaInnerBgColor || 'light');
    const key = `${themeId}_${width}_${height}_${shape}_${isDark ? 'dark' : 'light'}_${activeInnerBg}`;
    if (state._arenaFloorCanvasCache && state._arenaFloorCanvasCache[key]) {
      return state._arenaFloorCanvasCache[key];
    }
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const oc = offCanvas.getContext('2d');
    if (!oc) return null;
    oc.imageSmoothingEnabled = false;
    _renderNoTilesFloor(oc, width, height, isDark);
    if (!state._arenaFloorCanvasCache) state._arenaFloorCanvasCache = {};
    state._arenaFloorCanvasCache[key] = offCanvas;
    return offCanvas;
  }

  if (themeId === 'pvz_grass') {
    return getOrCreateGrassFloorCanvas(arena, isDark, fBleed);
  }
  if (themeId === 'sand_beach') {
    return getOrCreateSandBeachFloorCanvas(arena, isDark, fBleed);
  }
  if (themeId === 'stone_dungeon') {
    return getOrCreateDungeonFloorCanvas(arena, isDark, fBleed);
  }
  if (themeId === 'end_stone') {
    return getOrCreateEndStoneFloorCanvas(arena, isDark, fBleed);
  }
  if (themeId === 'end_stone_bricks') {
    return getOrCreateEndStoneBricksFloorCanvas(arena, isDark, fBleed);
  }
  if (themeId === 'mossy_stone') {
    return getOrCreateMossyStoneFloorCanvas(arena, isDark, fBleed);
  }
  if (themeId === 'football_field') {
    return getOrCreateFootballFieldFloorCanvas(arena, isDark, fBleed);
  }

  const width = Math.max(64, Math.ceil(arena.width + fBleed * 2));
  const height = Math.max(64, Math.ceil(arena.height + fBleed * 2));
  const shape = arena.shape || 'rect';
  const activeInnerBg = isDark ? (CONFIG.darkArenaInnerBgColor || 'dark') : (CONFIG.arenaInnerBgColor || 'light');
  const isClassicLayout = typeof CONFIG !== 'undefined' && CONFIG.hudLayoutStyle === 'classic';
  const key = `${themeId}_${width}_${height}_${shape}_${isDark ? 'dark' : 'light'}_${activeInnerBg}_${isClassicLayout ? 'classic' : 'duel'}_v4`;

  if (!state._arenaFloorCanvasCache) {
    state._arenaFloorCanvasCache = {};
  }
  if (state._arenaFloorCanvasCache[key]) {
    return state._arenaFloorCanvasCache[key];
  }

  const offCanvas = document.createElement('canvas');
  offCanvas.width = width;
  offCanvas.height = height;
  const oc = offCanvas.getContext('2d');
  if (!oc) return null;

  oc.imageSmoothingEnabled = false;

  const cols = ARENA_TILE_COUNT;
  const rows = ARENA_TILE_COUNT;
  const cellW = width / cols;
  const cellH = height / rows;

  switch (themeId) {
    case 'football_field':
      _renderFootballFieldFloor(oc, width, height, cols, rows, cellW, cellH, isDark);
      break;

    case 'bomberman_normal':
      _renderBombermanFloor(oc, width, height, cols, rows, cellW, cellH, isDark);
      break;

    case 'halloween':
      _renderHalloweenFloor(oc, width, height, cols, rows, cellW, cellH, isDark);
      break;

    case 'pvz_grass':
      _renderPixelPvzGrassFloor(oc, width, height, cols, rows, cellW, cellH, isDark);
      break;

    case 'sand_beach':
      _renderPixelSandBeachFloor(oc, width, height, cols, rows, cellW, cellH, isDark);
      break;

    case 'clash_arena':
      _renderPixelClashFloor(oc, width, height, cols, rows, cellW, cellH, isDark);
      break;

    case 'checker_arcade':
      _renderPixelCheckerFloor(oc, width, height, cols, rows, cellW, cellH, isDark);
      break;

    case 'cyber_grid':
      _renderPixelCyberFloor(oc, width, height, cols, rows, cellW, cellH, isDark);
      break;

    case 'stone_dungeon':
      _renderPixelDungeonFloor(oc, width, height, cols, rows, cellW, cellH, isDark);
      break;

    case 'tatami_dojo':
      _renderPixelTatamiFloor(oc, width, height, cols, rows, cellW, cellH, isDark);
      break;

    case 'classic_clean':
    default:
      _renderPixelCleanFloor(oc, width, height, cols, rows, cellW, cellH, isDark);
      break;
  }

  state._arenaFloorCanvasCache[key] = offCanvas;
  return offCanvas;
}

// ─────────────────────────────────────────────
// ACTIVE THEME CANVAS RENDERER PASS (CANVAS 2D)
// ─────────────────────────────────────────────

export function renderActiveArenaTheme(ctx, arena, isDark = false, fBleed = 0) {
  if (!ctx || !arena) return;

  const themeId = resolveActiveThemeId();
  const floorCanvas = getOrCreateThemeCanvas(themeId, arena, isDark, fBleed);

  ctx.save();
  ctx.beginPath();
  if (arena.shape === 'circle') {
    const cx = arena.x + arena.width / 2;
    const cy = arena.y + arena.height / 2;
    const ar = (arena.radius !== undefined ? arena.radius : (arena.width / 2)) + fBleed;
    ctx.arc(cx, cy, ar, 0, Math.PI * 2);
  } else {
    ctx.rect(arena.x - fBleed, arena.y - fBleed, arena.width + fBleed * 2, arena.height + fBleed * 2);
  }
  ctx.clip();

  if (floorCanvas) {
    ctx.drawImage(floorCanvas, arena.x - fBleed, arena.y - fBleed, arena.width + fBleed * 2, arena.height + fBleed * 2);
  } else {
    ctx.fillStyle = isDark ? (CONFIG.darkArenaInnerBgColor || '#000000') : (CONFIG.arenaInnerBgColor || '#919298ff');
    if (arena.shape === 'circle') {
      const cx = arena.x + arena.width / 2;
      const cy = arena.y + arena.height / 2;
      const ar = (arena.radius !== undefined ? arena.radius : (arena.width / 2)) + fBleed;
      ctx.beginPath();
      ctx.arc(cx, cy, ar, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(arena.x - fBleed, arena.y - fBleed, arena.width + fBleed * 2, arena.height + fBleed * 2);
    }
  }

  ctx.restore();
}

// ─────────────────────────────────────────────
// MINI PREVIEW GENERATOR FOR MODAL CARDS
// ─────────────────────────────────────────────

function getOrCreateMiniPreviewCanvas(themeDef, w, h) {
  const key = `${themeDef.id}_${w}x${h}_${CONFIG.arenaInnerBgColor || 'def'}`;
  if (_miniPreviewCache[key]) return _miniPreviewCache[key];

  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const oc = off.getContext('2d');
  if (!oc) return null;

  oc.imageSmoothingEnabled = false;

  if (themeDef.id === 'none') {
    oc.fillStyle = CONFIG.arenaInnerBgColor || '#ffffff';
    oc.fillRect(0, 0, w, h);
    oc.strokeStyle = '#94a3b8';
    oc.lineWidth = 1.4;
    oc.beginPath();
    oc.arc(w / 2, h / 2, Math.min(w, h) * 0.30, 0, Math.PI * 2);
    oc.stroke();
    oc.beginPath();
    oc.moveTo(w / 2 - Math.min(w, h) * 0.20, h / 2 - Math.min(w, h) * 0.20);
    oc.lineTo(w / 2 + Math.min(w, h) * 0.20, h / 2 + Math.min(w, h) * 0.20);
    oc.stroke();
  } else {
    const mockArena = { x: 0, y: 0, width: 460, height: 460, shape: 'rect' };
    const targetId = themeDef.id;
    const fullCanvas = getOrCreateThemeCanvas(targetId, mockArena, false, 0);

    if (fullCanvas) {
      oc.drawImage(fullCanvas, 0, 0, w, h);
    } else {
      oc.fillStyle = themeDef.themeColor;
      oc.fillRect(0, 0, w, h);
    }

    // Mini decorative accent on preview for Halloween
    if (themeDef.id === 'football_field') {
      // Crisp white center circle & kickoff spot on mini preview card
      const pcx = Math.round(w / 2);
      const pcy = Math.round(h / 2);
      oc.strokeStyle = '#ffffff';
      oc.lineWidth = 1.0;
      oc.beginPath();
      oc.arc(pcx, pcy, Math.max(3, Math.round(w * 0.20)), 0, Math.PI * 2);
      oc.stroke();
      oc.fillStyle = '#ffffff';
      oc.fillRect(pcx - 1, pcy - 1, 2, 2);
    } else if (themeDef.id === 'halloween') {
      // Miniature glowing pumpkin dot in center
      oc.fillStyle = '#f97316';
      oc.fillRect(Math.round(w / 2 - 2), Math.round(h / 2 - 2), 5, 4);
      oc.fillStyle = '#16a34a';
      oc.fillRect(Math.round(w / 2), Math.round(h / 2 - 4), 1, 2);
    } else if (themeDef.id === 'bomberman_normal') {
      // Draw mini grey bevel blocks along the edges of the preview card
      const bSize = Math.max(3, Math.round(w * 0.12));
      _drawBombermanBevelBlock(oc, 0, 0, w, bSize, false);
      _drawBombermanBevelBlock(oc, 0, h - bSize, w, bSize, false);
      _drawBombermanBevelBlock(oc, 0, 0, bSize, h, false);
      _drawBombermanBevelBlock(oc, w - bSize, 0, bSize, h, false);
      oc.fillStyle = '#ffffff';
      oc.fillRect(Math.round(w / 2), Math.round(h / 2), 2, 2);
    }
  }

  oc.strokeStyle = 'rgba(33, 5, 12, 0.4)';
  oc.lineWidth = 1.0;
  oc.strokeRect(0, 0, w, h);

  _miniPreviewCache[key] = off;
  return off;
}

// ─────────────────────────────────────────────
// UI SELECTOR BADGE (CHARACTER SELECT TOP BAR)
// ─────────────────────────────────────────────

export function drawArenaThemeSelector(ctx, x, y, w, h) {
  if (!ctx) return;

  const activeDef = ARENA_THEMES.find(t => t.id === getSelectedArenaTheme()) || ARENA_THEMES[0];
  const label = `${activeDef.icon} THEME: ${activeDef.shortName}`;

  ctx.save();
  ctx.fillStyle = '#0F1116';
  drawChamferedRect(ctx, x, y + 2, w, h, 3);
  ctx.fill();

  ctx.fillStyle = '#181A22';
  ctx.strokeStyle = activeDef.themeColor || '#F5A623';
  ctx.lineWidth = 1.4;
  drawChamferedRect(ctx, x, y, w, h, 3);
  ctx.fill();
  ctx.stroke();

  // Accent Pip
  ctx.fillStyle = activeDef.themeColor || '#F5A623';
  ctx.fillRect(x + 3, y + 2, 2.5, h - 4);

  // Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 9px "Outfit", "Rajdhani", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(fitSingleLineText(ctx, label, w - 12), x + w / 2 + 2, y + h / 2);
  ctx.restore();

  _registerButton(x, y, w, h + 2, () => {
    toggleArenaThemeModal();
    if (typeof state !== 'undefined' && state.audioSystem?.playSFX) {
      state.audioSystem.playSFX('skill_dash1', 0.25);
    }
  });
}

// ─────────────────────────────────────────────
// ARENA THEME SELECTION MODAL
// ─────────────────────────────────────────────

export function drawArenaThemeModal(ctx) {
  if (!ctx || !state.canvas) return;

  const canvas = state.canvas;
  const isHorizontal = typeof state !== 'undefined' && state.viewOrientation === 'horizontal';
  const modalW = isHorizontal ? Math.min(canvas.width - 48, 860) : Math.min(canvas.width - 24, 520);
  const modalH = isHorizontal ? Math.min(canvas.height - 24, 516) : Math.min(canvas.height - 24, 720);
  const mx = (canvas.width - modalW) / 2;
  const my = (canvas.height - modalH) / 2;

  // 1. Dark Backdrop Overlay
  ctx.save();
  ctx.fillStyle = 'rgba(33, 5, 12, 0.88)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Backdrop click closes modal
  _registerButton(0, 0, canvas.width, canvas.height, () => {
    closeArenaThemeModal();
  });

  // Panel Window Click Blocker
  _registerButton(mx, my, modalW, modalH, () => {});

  // 2. Outer Retro Window Panel
  drawPanel(mx, my, modalW, modalH, 0.98, 6, '#21050c');

  // Header Banner
  ctx.fillStyle = '#b81c3b';
  ctx.font = '900 10px "Outfit", "Rajdhani", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('ARENA ENVIRONMENT // BATTLEFIELD THEME ENGINE // SYS.v3.0', mx + 18, my + 12);

  ctx.fillStyle = '#21050c';
  ctx.font = '900 14px "Outfit", "Rajdhani", sans-serif';
  ctx.fillText('CHOOSE ARENA THEME', mx + 18, my + 24);

  // Close Button (Top-Right "X")
  const closeBtnW = 24;
  const closeBtnH = 22;
  const closeBtnX = mx + modalW - closeBtnW - 16;
  const closeBtnY = my + 12;

  ctx.fillStyle = '#baa88c';
  drawChamferedRect(ctx, closeBtnX, closeBtnY + 2, closeBtnW, closeBtnH, 3);
  ctx.fill();

  ctx.fillStyle = '#faedf0';
  ctx.strokeStyle = '#21050c';
  ctx.lineWidth = 1.4;
  drawChamferedRect(ctx, closeBtnX, closeBtnY, closeBtnW, closeBtnH, 3);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#b81c3b';
  ctx.font = '900 12px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✕', closeBtnX + closeBtnW / 2, closeBtnY + closeBtnH / 2);

  _registerButton(closeBtnX, closeBtnY, closeBtnW, closeBtnH + 2, () => {
    closeArenaThemeModal();
  });

  // Header Accent Line
  ctx.fillStyle = '#21050c';
  ctx.fillRect(mx + 18, my + 42, modalW - 36, 2);

  // 3. Theme Option Cards (2 Columns x Rows)
  const cols = isHorizontal ? 3 : 2;
  const padX = 16;
  const gapX = 10;
  const gapY = 5;
  const numRows = Math.ceil(ARENA_THEMES.length / cols);
  const availHeight = modalH - 46 - 26; // Header & footer space
  const cardH = Math.min(84, Math.floor((availHeight - (numRows - 1) * gapY) / numRows));
  const cardW = Math.floor((modalW - padX * 2 - gapX * (cols - 1)) / cols);
  const startCardsY = my + 46;

  const currentSelection = getSelectedArenaTheme();

  ARENA_THEMES.forEach((themeDef, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = mx + padX + col * (cardW + gapX);
    const cy = startCardsY + row * (cardH + gapY);

    const isSelected = (currentSelection === themeDef.id);

    // Card 3D Shadow
    ctx.fillStyle = isSelected ? '#5e0d1f' : '#baa88c';
    drawChamferedRect(ctx, cx, cy + 2, cardW, cardH, 3);
    ctx.fill();

    // Card Background
    ctx.fillStyle = isSelected ? '#fff5f7' : '#faedf0';
    ctx.strokeStyle = isSelected ? '#b81c3b' : '#21050c';
    ctx.lineWidth = isSelected ? 2.0 : 1.4;
    drawChamferedRect(ctx, cx, cy, cardW, cardH, 3);
    ctx.fill();
    ctx.stroke();

    // Left Pip Accent Bar
    ctx.fillStyle = themeDef.themeColor;
    ctx.fillRect(cx + 3, cy + 3, 3, cardH - 6);

    // Mini Live Preview Box on Left
    const prevW = Math.min(34, cardH - 14);
    const prevH = prevW;
    const prevX = cx + 8;
    const prevY = cy + 6;

    const miniPreview = getOrCreateMiniPreviewCanvas(themeDef, prevW, prevH);
    if (miniPreview) {
      ctx.drawImage(miniPreview, prevX, prevY, prevW, prevH);
    }

    // Mini preview border
    ctx.strokeStyle = '#21050c';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(prevX, prevY, prevW, prevH);

    // Title & Icon on Right of Preview
    const textX = prevX + prevW + 7;
    const maxTextW = cardW - (textX - cx) - 6;

    ctx.fillStyle = isSelected ? '#b81c3b' : '#21050c';
    ctx.font = '900 9.5px "Outfit", "Rajdhani", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(fitSingleLineText(ctx, `${themeDef.icon} ${themeDef.name}`, maxTextW), textX, cy + 5);

    // Feature Tag
    ctx.fillStyle = '#8b1524';
    ctx.font = '800 7px "Outfit", "Rajdhani", sans-serif';
    ctx.fillText(fitSingleLineText(ctx, themeDef.features, maxTextW), textX, cy + 17);

    // Equipped / Select Status Badge
    const statusY = cy + 27;
    ctx.fillStyle = isSelected ? '#b81c3b' : '#64748b';
    ctx.font = '900 7px "Press Start 2P", monospace';
    ctx.fillText(isSelected ? '★ EQUIPPED' : '○ SELECT', textX, statusY);

    // Description text across bottom
    ctx.fillStyle = '#21050c';
    ctx.font = '800 7px "Outfit", "Rajdhani", sans-serif';
    wrapText(ctx, themeDef.desc, cx + 8, cy + 39, cardW - 16, 8.5, 2);

    // Card Selection Click Handler
    _registerButton(cx, cy, cardW, cardH + 2, () => {
      setSelectedArenaTheme(themeDef.id);
      if (typeof state !== 'undefined' && state.audioSystem?.playSFX) {
        state.audioSystem.playSFX('skill_dash1', 0.3);
      }
    });
  });

  // Footer Instructions
  const footY = my + modalH - 14;
  ctx.fillStyle = '#8b1524';
  ctx.font = '800 8.5px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CLICK ANY THEME TO EQUIP • SELECTION AUTOMATICALLY SAVED TO STORAGE', mx + modalW / 2, footY);

  ctx.restore();
}

// ─────────────────────────────────────────────
// BACKWARD COMPATIBILITY ALIASES (LEGACY FLOOR API)
// ─────────────────────────────────────────────

export const ARENA_FLOOR_STORAGE_KEY = ARENA_THEME_STORAGE_KEY;
export const ARENA_FLOORS = ARENA_THEMES;

export const getSelectedArenaFloor = getSelectedArenaTheme;
export const setSelectedArenaFloor = setSelectedArenaTheme;
export const getActiveArenaFloorDef = getActiveArenaThemeDef;
export const resolveActiveFloorId = resolveActiveThemeId;
export const getOrCreateFloorCanvas = getOrCreateThemeCanvas;
export const renderActiveArenaFloor = renderActiveArenaTheme;

export const drawArenaFloorSelector = drawArenaThemeSelector;
export const drawArenaFloorModal = drawArenaThemeModal;
export const isArenaFloorModalOpen = isArenaThemeModalOpen;
export const openArenaFloorModal = openArenaThemeModal;
export const closeArenaFloorModal = closeArenaThemeModal;
export const toggleArenaFloorModal = toggleArenaThemeModal;


// ─────────────────────────────────────────────
// EXPLICIT THEME CANVAS GENERATORS
// ─────────────────────────────────────────────

export { getOrCreateFootballFieldFloorCanvas };

/**
 * Procedurally generates or retrieves the cached 8-bit Football Field floor canvas.
 *
 * @param {object} arena - Arena bounding rect
 * @param {object|boolean} [opts={}] - Options or boolean isDark
 * @returns {HTMLCanvasElement|null}
 */
export function generateFootballFieldThemeFloor(arena, opts = {}) {
  const isDark = typeof opts === 'boolean' ? opts : !!opts?.isDarkMode;
  const fBleed = opts?.fBleed || 0;
  return getOrCreateFootballFieldFloorCanvas(arena, isDark, fBleed);
}
