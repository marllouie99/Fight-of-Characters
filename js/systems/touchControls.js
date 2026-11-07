// ─────────────────────────────────────────────
// MOBILE TOUCH CONTROLS & AIM PROJECTOR
// Features:
// 1. Floating 360° Analog Virtual Joystick (dynamic touch origin in lower-left)
// 2. Right-flank skill wheel (ATK, S1, ULT)
// 3. Predictive Aim Trajectory Projector (1-bounce arena raycasting)
// 4. On-screen AUTO ⚔️ / MANUAL 🕹️ mode toggle
// Follows Rule 35 (Zero per-frame allocations, 100% Canvas 2D stack integrity).
// ─────────────────────────────────────────────

import { state } from '../core/state.js';
import { CONFIG } from '../core/config.js';
import { triggerHaptic } from './mobileAppBridge.js';
import { drawChamferedRect } from '../graphics/ui/uiFramework.js';

// Normalized stick vector (zero allocation cache)
const _stickVector = { x: 0, y: 0, mag: 0 };
const _trajectoryPoints = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];

// Touch tracking state
let _joystickTouchId = null;
let _joystickActive = false;
let _joystickBaseX = 100;
let _joystickBaseY = 750;
let _joystickThumbX = 100;
let _joystickThumbY = 750;
const _JOYSTICK_MAX_DIST = 55;
const _JOYSTICK_BASE_RADIUS = 55;
const _JOYSTICK_THUMB_RADIUS = 26;

// Drag aim tracking state
let _aimTouchId = null;
let _aimSkillSlot = null; // 's1' | 'ult' | null
let _aimStartX = 0;
let _aimStartY = 0;
let _aimCurrentX = 0;
let _aimCurrentY = 0;
let _aimAngle = 0;
let _isAiming = false;

// Button bounds (calculated based on canvas dimensions)
const _touchButtons = {
  modeToggle: { x: 0, y: 0, w: 96, h: 26 },
  atk:        { cx: 0, cy: 0, r: 28, isDown: false },
  s1:         { cx: 0, cy: 0, r: 26, isDown: false },
  ult:        { cx: 0, cy: 0, r: 28, isDown: false }
};

let _hasReceivedTouch = false;

export function isJoystickActive() {
  return _joystickActive;
}

export function getJoystickVector() {
  return _stickVector;
}

export function isAimingActive() {
  return _isAiming;
}

export function getAimTrajectory() {
  return _trajectoryPoints;
}

/**
 * Updates button layout based on current canvas and arena bounds
 */
function _updateLayout() {
  const canvasW = state.canvas ? state.canvas.width : 540;
  const canvasH = state.canvas ? state.canvas.height : 960;
  const arena = state.arena || CONFIG.arena || { x: 45, y: 240, width: 450, height: 450 };

  // Mode toggle: placed neatly right below the bottom of the arena
  _touchButtons.modeToggle.w = 98;
  _touchButtons.modeToggle.h = 26;
  _touchButtons.modeToggle.x = canvasW - _touchButtons.modeToggle.w - 18;
  _touchButtons.modeToggle.y = arena.y + arena.height + 8;

  // Skill wheel: right flank
  _touchButtons.atk.cx = canvasW - 130;
  _touchButtons.atk.cy = canvasH - 75;

  _touchButtons.s1.cx = canvasW - 60;
  _touchButtons.s1.cy = canvasH - 125;

  _touchButtons.ult.cx = canvasW - 60;
  _touchButtons.ult.cy = canvasH - 195;
}

/**
 * Computes predictive aim trajectory raycast reflecting off arena walls
 */
export function projectAimTrajectory(startX, startY, angle, maxDistance, arena) {
  if (!arena) arena = state.arena || CONFIG.arena || { x: 45, y: 240, width: 450, height: 450 };

  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  _trajectoryPoints[0].x = startX;
  _trajectoryPoints[0].y = startY;

  // Raycast to arena bounds
  let minT = maxDistance;
  let hitWall = 'none'; // 'left' | 'right' | 'top' | 'bottom'

  if (dx < -0.001) {
    const t = (arena.x - startX) / dx;
    if (t > 0 && t < minT) { minT = t; hitWall = 'left'; }
  } else if (dx > 0.001) {
    const t = (arena.x + arena.width - startX) / dx;
    if (t > 0 && t < minT) { minT = t; hitWall = 'right'; }
  }

  if (dy < -0.001) {
    const t = (arena.y - startY) / dy;
    if (t > 0 && t < minT) { minT = t; hitWall = 'top'; }
  } else if (dy > 0.001) {
    const t = (arena.y + arena.height - startY) / dy;
    if (t > 0 && t < minT) { minT = t; hitWall = 'bottom'; }
  }

  const hitX = startX + dx * minT;
  const hitY = startY + dy * minT;
  _trajectoryPoints[1].x = hitX;
  _trajectoryPoints[1].y = hitY;

  // 1-Bounce reflection
  const remainingDist = Math.max(0, maxDistance - minT);
  let reflectDx = dx;
  let reflectDy = dy;
  if (hitWall === 'left' || hitWall === 'right') reflectDx = -dx;
  if (hitWall === 'top' || hitWall === 'bottom') reflectDy = -dy;

  _trajectoryPoints[2].x = hitX + reflectDx * remainingDist;
  _trajectoryPoints[2].y = hitY + reflectDy * remainingDist;

  return _trajectoryPoints;
}

/**
 * Touch start event processor
 */
export function handleTouchStart(touch, rect, scaleX, scaleY) {
  _hasReceivedTouch = true;
  _updateLayout();

  const mx = (touch.clientX - rect.left) * scaleX;
  const my = (touch.clientY - rect.top) * scaleY;

  // 1. Check Mode Toggle Button
  const tb = _touchButtons.modeToggle;
  if (mx >= tb.x && mx <= tb.x + tb.w && my >= tb.y && my <= tb.y + tb.h) {
    state.controlMode = (state.controlMode === 'manual' ? 'auto' : 'manual');
    triggerHaptic('selection');
    return true;
  }

  // If in AUTO mode, virtual controls do not intercept touches
  if (state.controlMode !== 'manual') return false;

  const canvasW = state.canvas ? state.canvas.width : 540;
  const canvasH = state.canvas ? state.canvas.height : 960;

  // 2. Check Skill Buttons
  // ATK
  const atk = _touchButtons.atk;
  if (Math.hypot(mx - atk.cx, my - atk.cy) <= atk.r + 10) {
    atk.isDown = true;
    triggerHaptic('light');
    _fireFighterAttack();
    return true;
  }

  // S1 (Skill 1)
  const s1 = _touchButtons.s1;
  if (Math.hypot(mx - s1.cx, my - s1.cy) <= s1.r + 10) {
    s1.isDown = true;
    _aimTouchId = touch.identifier;
    _aimSkillSlot = 's1';
    _aimStartX = mx;
    _aimStartY = my;
    _aimCurrentX = mx;
    _aimCurrentY = my;
    _isAiming = true;
    triggerHaptic('selection');
    return true;
  }

  // ULT (Ultimate)
  const ult = _touchButtons.ult;
  if (Math.hypot(mx - ult.cx, my - ult.cy) <= ult.r + 10) {
    ult.isDown = true;
    _aimTouchId = touch.identifier;
    _aimSkillSlot = 'ult';
    _aimStartX = mx;
    _aimStartY = my;
    _aimCurrentX = mx;
    _aimCurrentY = my;
    _isAiming = true;
    triggerHaptic('selection');
    return true;
  }

  // 3. Lower-left floating joystick zone
  if (mx < canvasW * 0.48 && my > canvasH * 0.45 && _joystickTouchId === null) {
    _joystickTouchId = touch.identifier;
    _joystickActive = true;
    _joystickBaseX = mx;
    _joystickBaseY = my;
    _joystickThumbX = mx;
    _joystickThumbY = my;
    _stickVector.x = 0;
    _stickVector.y = 0;
    _stickVector.mag = 0;
    return true;
  }

  return false;
}

/**
 * Touch move event processor
 */
export function handleTouchMove(touch, rect, scaleX, scaleY) {
  if (state.controlMode !== 'manual') return;

  const mx = (touch.clientX - rect.left) * scaleX;
  const my = (touch.clientY - rect.top) * scaleY;

  // 1. Joystick movement
  if (touch.identifier === _joystickTouchId && _joystickActive) {
    const dx = mx - _joystickBaseX;
    const dy = my - _joystickBaseY;
    const dist = Math.hypot(dx, dy);

    if (dist <= _JOYSTICK_MAX_DIST) {
      _joystickThumbX = mx;
      _joystickThumbY = my;
    } else {
      const angle = Math.atan2(dy, dx);
      _joystickThumbX = _joystickBaseX + Math.cos(angle) * _JOYSTICK_MAX_DIST;
      _joystickThumbY = _joystickBaseY + Math.sin(angle) * _JOYSTICK_MAX_DIST;
    }

    const normDist = Math.min(1.0, dist / _JOYSTICK_MAX_DIST);
    if (dist > 3) {
      _stickVector.x = dx / (dist || 1);
      _stickVector.y = dy / (dist || 1);
      _stickVector.mag = normDist;
    } else {
      _stickVector.x = 0;
      _stickVector.y = 0;
      _stickVector.mag = 0;
    }
  }

  // 2. Skill Aim Drag
  if (touch.identifier === _aimTouchId && _isAiming) {
    _aimCurrentX = mx;
    _aimCurrentY = my;
    const dx = mx - _aimStartX;
    const dy = my - _aimStartY;
    if (Math.hypot(dx, dy) > 8) {
      _aimAngle = Math.atan2(dy, dx);
    }
  }
}

/**
 * Touch end event processor
 */
export function handleTouchEnd(touch) {
  if (touch.identifier === _joystickTouchId) {
    _joystickTouchId = null;
    _joystickActive = false;
    _stickVector.x = 0;
    _stickVector.y = 0;
    _stickVector.mag = 0;
  }

  if (touch.identifier === _aimTouchId) {
    if (_isAiming && _aimSkillSlot) {
      const dx = _aimCurrentX - _aimStartX;
      const dy = _aimCurrentY - _aimStartY;
      const dragDist = Math.hypot(dx, dy);
      const angle = dragDist > 12 ? Math.atan2(dy, dx) : null;
      _fireFighterSkill(_aimSkillSlot, angle);
    }
    _aimTouchId = null;
    _aimSkillSlot = null;
    _isAiming = false;
    _touchButtons.s1.isDown = false;
    _touchButtons.ult.isDown = false;
  }

  _touchButtons.atk.isDown = false;
}

function _fireFighterAttack() {
  const p1 = state.fighters && state.fighters[0];
  if (!p1 || p1.hp <= 0 || p1.dead) return;
  if (typeof p1.shoot === 'function') {
    p1.shoot(0);
  }
}

function _fireFighterSkill(slot, manualAngle = null) {
  const p1 = state.fighters && state.fighters[0];
  if (!p1 || p1.hp <= 0 || p1.dead) return;

  const opponent = p1.target || (state.fighters && state.fighters[1]);
  if (manualAngle !== null) {
    p1.gunAngle = manualAngle;
    p1.angle = manualAngle;
  }

  if (slot === 's1') {
    if (typeof p1.fireUp === 'function') {
      p1.fireUp(opponent, 0, state.arena);
    } else if (typeof p1.activateSkill1 === 'function') {
      p1.activateSkill1();
    } else if (typeof p1.triggerSkill1 === 'function') {
      p1.triggerSkill1();
    } else if (p1.skills && p1.skills[0] && typeof p1.skills[0].activate === 'function') {
      p1.skills[0].activate();
    }
    triggerHaptic('medium');
  } else if (slot === 'ult') {
    if (typeof p1.executeUltimate === 'function') {
      p1.executeUltimate(opponent, 0, state.arena);
    } else if (typeof p1.startDomainExpansion === 'function') {
      p1.startDomainExpansion();
    } else if (typeof p1.fireDown === 'function') {
      p1.fireDown(opponent, 0, state.arena);
    } else if (p1.skills && p1.skills[1] && typeof p1.skills[1].activate === 'function') {
      p1.skills[1].activate();
    }
    triggerHaptic('heavy');
  }
}

let _cachedAutoBtnCanvas = null;

function _getAutoToggleCanvas(w, h) {
  if (_cachedAutoBtnCanvas) return _cachedAutoBtnCanvas;
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
  const c = document.createElement('canvas');
  c.width = w + 4;
  c.height = h + 4;
  const cCtx = c.getContext('2d');
  if (!cCtx) return null;

  cCtx.translate(2, 2);
  cCtx.fillStyle = 'rgba(10, 15, 24, 0.75)';
  cCtx.strokeStyle = 'rgba(0, 245, 212, 0.45)';
  cCtx.lineWidth = 1.4;
  drawChamferedRect(cCtx, 0, 0, w, h, 4);
  cCtx.fill();
  cCtx.stroke();

  cCtx.fillStyle = '#00F5D4';
  cCtx.font = '900 10px "Outfit", "Rajdhani", sans-serif';
  cCtx.textAlign = 'center';
  cCtx.textBaseline = 'middle';
  cCtx.fillText('⚔️ AUTO', w / 2, h / 2);

  _cachedAutoBtnCanvas = c;
  return _cachedAutoBtnCanvas;
}

/**
 * Main draw routine for mobile touch controls
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawTouchControls(ctx) {
  if (!state || state.gameState !== 'playing') return;
  const isManual = (state.controlMode === 'manual');
  if (!isManual && ! _hasReceivedTouch) return;

  _updateLayout();
  const tb = _touchButtons.modeToggle;

  // Fast-path when in AUTO mode after touch: single pre-baked quad blit (Rule 35)
  if (!isManual) {
    const autoSprite = _getAutoToggleCanvas(tb.w, tb.h);
    if (autoSprite) {
      ctx.drawImage(autoSprite, tb.x - 2, tb.y - 2);
      return;
    }
  }

  ctx.save();

  // 1. Mode Toggle Button (AUTO / MANUAL)
  ctx.fillStyle = isManual ? '#00F5D4' : 'rgba(10, 15, 24, 0.75)';
  ctx.strokeStyle = isManual ? '#FFFFFF' : 'rgba(0, 245, 212, 0.45)';
  ctx.lineWidth = 1.4;
  drawChamferedRect(ctx, tb.x, tb.y, tb.w, tb.h, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isManual ? '#0E0F14' : '#00F5D4';
  ctx.font = '900 10px "Outfit", "Rajdhani", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isManual ? '🕹️ MANUAL' : '⚔️ AUTO', tb.x + tb.w / 2, tb.y + tb.h / 2);

  // If in AUTO mode, hide the virtual joystick and action wheel
  if (!isManual) {
    ctx.restore();
    return;
  }

  const p1 = state.fighters && state.fighters[0];
  const themeColor = (p1 && p1.color) ? p1.color : '#00F5D4';

  // 2. Floating Analog Virtual Joystick
  if (_joystickActive) {
    // Outer Base Ring
    ctx.fillStyle = 'rgba(14, 15, 20, 0.45)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(_joystickBaseX, _joystickBaseY, _JOYSTICK_BASE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner Direction Track
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(_joystickBaseX, _joystickBaseY, _JOYSTICK_BASE_RADIUS * 0.55, 0, Math.PI * 2);
    ctx.stroke();

    // Thumb Knob
    ctx.fillStyle = themeColor;
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(_joystickThumbX, _joystickThumbY, _JOYSTICK_THUMB_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Soft highlight on thumb knob
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.arc(_joystickThumbX - 6, _joystickThumbY - 6, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Right-Flank Skill Buttons
  _drawActionButton(ctx, _touchButtons.atk, 'ATK', '#FF4757', '⚔️');
  _drawActionButton(ctx, _touchButtons.s1, 'S1', '#2ED573', '⚡');
  _drawActionButton(ctx, _touchButtons.ult, 'ULT', '#FFA502', '💥');

  // 4. Predictive Aim Trajectory Projector
  if (_isAiming && p1 && p1.hp > 0) {
    const startX = p1.x;
    const startY = p1.y - (p1.z || 0);
    const pts = projectAimTrajectory(startX, startY, _aimAngle, 400, state.arena);

    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Impact wall reticle
    ctx.fillStyle = '#00F5D4';
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pts[1].x, pts[1].y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Terminal reticle
    ctx.fillStyle = '#FF4757';
    ctx.beginPath();
    ctx.arc(pts[2].x, pts[2].y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

function _drawActionButton(ctx, btn, label, color, icon) {
  const isPressed = Boolean(btn.isDown);
  const r = isPressed ? btn.r * 0.92 : btn.r;

  ctx.save();

  // Dark shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.arc(btn.cx + 2, btn.cy + 3, r, 0, Math.PI * 2);
  ctx.fill();

  // Button body
  ctx.fillStyle = isPressed ? color : 'rgba(20, 24, 32, 0.85)';
  ctx.strokeStyle = isPressed ? '#FFFFFF' : color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(btn.cx, btn.cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Icon / Text
  ctx.fillStyle = isPressed ? '#0E0F14' : '#FFFFFF';
  ctx.font = '900 11px "Outfit", "Rajdhani", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, btn.cx, btn.cy);

  ctx.restore();
}

