// ─────────────────────────────────────────────
// ARENA CLIP HELPER
// Clamps 2D attack VFX, speed lines, and oversized melee sprites strictly
// inside the active arena boundaries (supports rect and circle shapes,
// camera transforms, and local fighter transforms).
// ─────────────────────────────────────────────
import { state } from '../../core/state.js';

/**
 * Returns the active match arena when rendering a live match fighter, or null
 * for UI/card/podium previews where arena clipping must not apply.
 *
 * @param {Object} fighter
 * @returns {Object|null}
 */
export function getActiveMatchArenaForFighter(fighter) {
  if (!fighter || typeof state === 'undefined' || !state || !state.arena) return null;
  if (fighter._isPreview || fighter._isCardPreview || fighter._isWinnerReveal) return null;
  if (!Array.isArray(state.fighters) || !state.fighters.includes(fighter)) return null;
  return state.arena;
}

/**
 * Traces the active arena boundary path and applies ctx.clip().
 * Caller MUST wrap calls inside ctx.save() ... ctx.restore().
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object|null} [arena]
 * @returns {boolean}
 */
export function clipCtxToArena(ctx, arena = (typeof state !== 'undefined' ? state?.arena : null)) {
  if (!ctx || !arena || typeof ctx.clip !== 'function' || typeof ctx.beginPath !== 'function') return false;
  if (!Number.isFinite(arena.x) || !Number.isFinite(arena.y) || !Number.isFinite(arena.width) || !Number.isFinite(arena.height)) {
    return false;
  }

  ctx.beginPath();
  if (arena.shape === 'circle') {
    if (typeof ctx.arc !== 'function') return false;
    const acx = arena.x + arena.width / 2;
    const acy = arena.y + arena.height / 2;
    const ar = arena.radius !== undefined ? arena.radius : (arena.width / 2);
    ctx.arc(acx, acy, Math.max(0, ar), 0, Math.PI * 2);
  } else if (typeof ctx.rect === 'function') {
    ctx.rect(arena.x, arena.y, arena.width, arena.height);
  } else {
    ctx.moveTo(arena.x, arena.y);
    ctx.lineTo(arena.x + arena.width, arena.y);
    ctx.lineTo(arena.x + arena.width, arena.y + arena.height);
    ctx.lineTo(arena.x, arena.y + arena.height);
    ctx.closePath();
  }
  ctx.clip();
  return true;
}

/**
 * Applies an arena clip when ctx is currently in fighter-local space
 * transformed by translate(originX, originY) -> rotate(angle) -> [scale(1, -1)].
 * Restores the exact fighter-local transform afterward while keeping the clip.
 * Caller MUST wrap calls inside ctx.save() ... ctx.restore().
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} originX
 * @param {number} originY
 * @param {number} [angle=0]
 * @param {boolean} [facingLeft=false]
 * @param {Object|null} [arena]
 * @returns {boolean}
 */
export function clipCtxToArenaInLocalSpace(ctx, originX, originY, angle = 0, facingLeft = false, arena = (typeof state !== 'undefined' ? state?.arena : null)) {
  if (!ctx || !arena || typeof ctx.clip !== 'function' || typeof ctx.beginPath !== 'function') return false;
  if (!Number.isFinite(originX) || !Number.isFinite(originY) || !Number.isFinite(angle)) return false;

  if (facingLeft) ctx.scale(1, -1);
  ctx.rotate(-angle);
  ctx.translate(-originX, -originY);

  const clipped = clipCtxToArena(ctx, arena);

  ctx.translate(originX, originY);
  ctx.rotate(angle);
  if (facingLeft) ctx.scale(1, -1);
  return clipped;
}
