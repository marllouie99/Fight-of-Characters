// ─────────────────────────────────────────────
// ISAGI YOICHI WEAPON & COMBAT VFX GRAPHICS
// Re-exports from centralized soccerBallGraphics.js for 100% backward compatibility
// Complies with Rule 11 (No shadowBlur), Rule 25 (Non-freezing decay),
// Rule 26 (Clean Concentric Shockwaves - No cobwebs), and Rule 24.
// ─────────────────────────────────────────────

export {
  drawPuzzlePiece,
  stepSoccerBall3DRotation,
  drawSoccerBallProjectile,
  drawMetavisionAimReticle,
  drawDirectVolleyShockwave,
  drawStrikerShockwave,
  drawSoccerAimReticle,
  drawSoccerShockwave,
  getKickImpactFrames,
  _getIsagiKickImpactFrames,
  drawKickImpact,
  drawIsagiKickImpact,
  draw16BitHitImpact,
  drawIsagi16BitHitImpact,
  EGO_TRAIL_FRAME_COUNT,
  getBlueLockEgoTrailFrames,
  _getIsagiEgoTrailFrames,
  _getChigiriEgoTrailFrames,
  EGO_AURA_FRAME_COUNT,
  EGO_AURA_DISAPPEAR_FRAME_COUNT,
  getBlueLockEgoAuraFrames,
  getBlueLockEgoAuraDisappearFrames,
  _getIsagiEgoAuraFrames,
  _getIsagiEgoAuraDisappearFrames,
  _getChigiriEgoAuraFrames,
  _getChigiriEgoAuraDisappearFrames,
  drawBlueLockEgoAura,
  drawBlueLockEgoAuraFront,
  drawBlueLockEgoSpectreColumn,
  getBlueLockEgoPalette,
  drawIsagiEgoAura,
  drawIsagiEgoAuraFront,
  drawBlueLockEgoTrail,
  updateBlueLockEgoTrail,
  decayBlueLockEgoTrail,
  drawStrikerBallTrail,
  updateStrikerBallTrail,
  decayStrikerBallTrail
} from './soccerBallGraphics.js';
