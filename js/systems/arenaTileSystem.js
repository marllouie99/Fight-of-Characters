// ─────────────────────────────────────────────
// ARENA TILE SYSTEM — Backwards Compatibility Facade
// Re-exports all tile and theme APIs from arenaThemeSystem.js
// ─────────────────────────────────────────────

export {
  ARENA_THEMES,
  ARENA_FLOORS,
  ARENA_THEME_STORAGE_KEY,
  ARENA_FLOOR_STORAGE_KEY,
  LEGACY_ARENA_FLOOR_STORAGE_KEY,
  getSelectedArenaTheme,
  setSelectedArenaTheme,
  getSelectedArenaFloor,
  setSelectedArenaFloor,
  isArenaThemeModalOpen,
  openArenaThemeModal,
  closeArenaThemeModal,
  toggleArenaThemeModal,
  isArenaFloorModalOpen,
  openArenaFloorModal,
  closeArenaFloorModal,
  toggleArenaFloorModal,
  resolveActiveThemeId,
  getActiveArenaThemeDef,
  getArenaTopWallBlockThickness,
  resolveActiveFloorId,
  getActiveArenaFloorDef,
  getTileGridInfo,
  getNearestTileCenter,
  getRandomTileCenter,
  isTileOccupied,
  getOrCreateThemeCanvas,
  getOrCreateFloorCanvas,
  renderActiveArenaTheme,
  renderActiveArenaFloor,
  drawArenaThemeSelector,
  drawArenaFloorSelector,
  drawArenaThemeModal,
  drawArenaFloorModal
} from './arenaThemeSystem.js';
