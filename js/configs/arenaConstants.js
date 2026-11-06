// ─────────────────────────────────────────────
// CANONICAL ARENA & VIEWPORT GEOMETRY CONSTANTS (RULE 28)
// Single Source of Truth for Arena Dimensions, Centering & Canvas Dimensions
// ─────────────────────────────────────────────

/**
 * Canonical vertical portrait arena geometry for YouTube Shorts 9:16 mode.
 * Strictly locked to { x: 45, y: 240, width: 450, height: 450, wallWidth: 4, shape: 'rect' }
 * on the 540 × 960 canvas per Rule 28.
 */
export const ARENA_VERTICAL = Object.freeze({
  x: 45,
  y: 240,
  width: 450,
  height: 450,
  wallWidth: 4,
  shape: 'rect'
});

export const CANVAS_VERTICAL = Object.freeze({
  width: 540,
  height: 960
});

/**
 * Canonical 16:9 widescreen Duel arena geometry (960 × 540 canvas).
 */
export const ARENA_DUEL_HORIZONTAL = Object.freeze({
  x: 10,
  y: 84,
  width: 940,
  height: 444,
  wallWidth: 4,
  shape: 'rect'
});

/**
 * Canonical 16:9 Free-For-All (FFA) arena with center obstacle.
 */
export const ARENA_FFA_HORIZONTAL = Object.freeze({
  x: 80,
  y: -130,
  width: 800,
  height: 800,
  wallWidth: 4,
  shape: 'rect',
  centerObstacle: Object.freeze({
    type: 'plus',
    size: 280,
    thickness: 90
  })
});

/**
 * Canonical Grand Battle arena geometry (1400 × 1400).
 */
export const ARENA_GRAND = Object.freeze({
  x: -220,
  y: -430,
  width: 1400,
  height: 1400,
  wallWidth: 4,
  shape: 'rect'
});

/**
 * Canonical Survivor horde arena geometry (1560 × 1400) with corner pillars.
 */
export const ARENA_SURVIVOR = Object.freeze({
  x: -300,
  y: -430,
  width: 1560,
  height: 1400,
  wallWidth: 6,
  shape: 'rect',
  obstacles: Object.freeze([
    Object.freeze({ type: 'rect', x: 20, y: -160, width: 80, height: 260 }),
    Object.freeze({ type: 'rect', x: 860, y: -160, width: 80, height: 260 }),
    Object.freeze({ type: 'rect', x: 20, y: 440, width: 80, height: 260 }),
    Object.freeze({ type: 'rect', x: 860, y: 440, width: 80, height: 260 })
  ])
});

export const CANVAS_HORIZONTAL = Object.freeze({
  width: 960,
  height: 540
});

/**
 * Returns a cloned arena geometry object for the given orientation or mode.
 * @param {'vertical'|'horizontal'|'grand'|'ffa'|'survivor'} [mode='vertical']
 * @returns {{ x: number, y: number, width: number, height: number, wallWidth: number, shape: string }}
 */
export function getDefaultArena(mode = 'vertical') {
  switch (mode) {
    case 'horizontal':
    case 'duel_horizontal':
      return { ...ARENA_DUEL_HORIZONTAL };
    case 'ffa':
    case 'ffa_horizontal':
      return { ...ARENA_FFA_HORIZONTAL };
    case 'grand':
      return { ...ARENA_GRAND };
    case 'survivor':
      return { ...ARENA_SURVIVOR };
    case 'vertical':
    default:
      return { ...ARENA_VERTICAL };
  }
}
