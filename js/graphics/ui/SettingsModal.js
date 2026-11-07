// ─────────────────────────────────────────────
// UNIFIED IN-GAME SETTINGS MODAL
// Clean, tactile manga-ink settings panel with real-time audio sliders,
// haptics, 120 FPS, and commercial mode toggles.
// Follows Rule 35 (Zero per-frame allocations, 100% Canvas 2D stack integrity).
// ─────────────────────────────────────────────

import { state } from '../../core/state.js';
import { CONFIG } from '../../core/config.js';
import { drawChamferedRect, drawPanel, drawButton, _registerButton, _clearButtons } from './uiFramework.js';
import { drawScreentoneModalBackdrop } from './mangaScreentone.js';
import { getMasterVolume, setMasterVolume, getSfxVolume, setSfxVolume } from '../../systems/soundSystem.js';
import { getArenaBgmVolume, setArenaBgmVolume } from '../../systems/arenaBgmSystem.js';
import { triggerHaptic } from '../../systems/mobileAppBridge.js';

let _isSettingsOpen = false;
let _returnGameState = 'title';
let _activeDraggingSlider = null; // 'master' | 'bgm' | 'sfx' | null

// Slider bounding boxes for mouse/touch hit testing
const _sliderBounds = {
  master: { x: 0, y: 0, w: 0, h: 0 },
  bgm:    { x: 0, y: 0, w: 0, h: 0 },
  sfx:    { x: 0, y: 0, w: 0, h: 0 }
};

export function isSettingsModalOpen() {
  return _isSettingsOpen;
}

export function openSettingsModal(returnState = 'title') {
  _isSettingsOpen = true;
  _returnGameState = returnState || state.previousGameState || 'title';
  state.previousGameState = state.gameState;
  state.gameState = 'settings';
  triggerHaptic('selection');
}

export function closeSettingsModal() {
  _isSettingsOpen = false;
  _activeDraggingSlider = null;
  saveSettingsToStorage();
  triggerHaptic('selection');
  state.gameState = _returnGameState || 'title';
  if (state.canvas && state.canvas.style) {
    state.canvas.style.cursor = 'default';
  }
}

export function saveSettingsToStorage() {
  try {
    if (typeof localStorage === 'undefined') return;
    const settings = {
      masterVolume: getMasterVolume(),
      bgmVolume: getArenaBgmVolume(),
      sfxVolume: getSfxVolume(),
      enableHaptics: state.enableHaptics !== false,
      enableHighRefreshRate: state.enableHighRefreshRate !== false,
      enableMatchPerks: Boolean(CONFIG.enableMatchPerks),
      commercialMode: Boolean(CONFIG.COMMERCIAL_MODE)
    };
    localStorage.setItem('foc_settings', JSON.stringify(settings));
  } catch (_) {}
}

export function loadSettingsFromStorage() {
  try {
    if (typeof localStorage === 'undefined') return;
    const saved = localStorage.getItem('foc_settings');
    if (!saved) return;
    const s = JSON.parse(saved);
    if (typeof s.masterVolume === 'number') setMasterVolume(s.masterVolume);
    if (typeof s.bgmVolume === 'number') setArenaBgmVolume(s.bgmVolume);
    if (typeof s.sfxVolume === 'number') setSfxVolume(s.sfxVolume);
    if (typeof s.enableHaptics === 'boolean') state.enableHaptics = s.enableHaptics;
    if (typeof s.enableHighRefreshRate === 'boolean') {
      state.enableHighRefreshRate = s.enableHighRefreshRate;
      CONFIG.enableHighRefreshRate = s.enableHighRefreshRate;
    }
    if (typeof s.enableMatchPerks === 'boolean') {
      CONFIG.enableMatchPerks = s.enableMatchPerks;
    }
    if (typeof s.commercialMode === 'boolean') {
      CONFIG.COMMERCIAL_MODE = s.commercialMode;
    }
  } catch (_) {}
}

// Automatically load stored settings on startup
if (typeof window !== 'undefined') {
  loadSettingsFromStorage();
}

/**
 * Handles pointer/mouse down for volume sliders
 */
export function handleSettingsMouseDown(mx, my) {
  if (!_isSettingsOpen) return false;

  for (const [key, b] of Object.entries(_sliderBounds)) {
    if (b.w > 0 && mx >= b.x - 12 && mx <= b.x + b.w + 12 && my >= b.y - 10 && my <= b.y + b.h + 10) {
      _activeDraggingSlider = key;
      _updateSliderFromPointer(key, mx);
      return true;
    }
  }
  return false;
}

/**
 * Handles pointer/mouse move while dragging a slider
 */
export function handleSettingsMouseMove(mx, my) {
  if (!_isSettingsOpen) return false;

  if (_activeDraggingSlider) {
    _updateSliderFromPointer(_activeDraggingSlider, mx);
    return true;
  }

  // Hover cursor feedback
  let hoveringSlider = false;
  for (const b of Object.values(_sliderBounds)) {
    if (b.w > 0 && mx >= b.x - 12 && mx <= b.x + b.w + 12 && my >= b.y - 10 && my <= b.y + b.h + 10) {
      hoveringSlider = true;
      break;
    }
  }
  if (state.canvas && state.canvas.style) {
    state.canvas.style.cursor = hoveringSlider ? 'pointer' : 'default';
  }
  return hoveringSlider;
}

/**
 * Releases slider dragging
 */
export function handleSettingsMouseUp() {
  if (_activeDraggingSlider) {
    _activeDraggingSlider = null;
    saveSettingsToStorage();
    return true;
  }
  return false;
}

function _updateSliderFromPointer(key, mx) {
  const b = _sliderBounds[key];
  if (!b || b.w <= 0) return;
  const ratio = Math.max(0.0, Math.min(1.0, (mx - b.x) / b.w));
  if (key === 'master') {
    setMasterVolume(ratio);
  } else if (key === 'bgm') {
    setArenaBgmVolume(ratio);
  } else if (key === 'sfx') {
    setSfxVolume(ratio);
  }
}

/**
 * Main draw routine for the Settings Modal
 */
export function drawSettingsModal(ctx) {
  if (!_isSettingsOpen) return;
  _clearButtons();

  const canvasW = ctx.canvas.width;
  const canvasH = ctx.canvas.height;

  // 1. Full-screen dark screentone backdrop
  drawScreentoneModalBackdrop(ctx, canvasW, canvasH, 0.75);

  const panelW = Math.min(canvasW - 36, 360);
  const panelH = Math.min(canvasH - 40, 520);
  const cx = canvasW / 2;
  const cy = canvasH / 2;
  const x = cx - panelW / 2;
  const y = cy - panelH / 2;

  ctx.save();

  // 2. Main Panel Window Box (Authentic Manga Ink Frame)
  drawPanel(x, y, panelW, panelH, 0.96, 4, '#0E0F14');

  // Title Header
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#0E0F14';
  ctx.lineWidth = 1.5;
  ctx.font = '900 18px "Outfit", "Rajdhani", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚙️ SYSTEM SETTINGS', Math.round(cx), Math.round(y + 26));

  // Section 1: Audio Mixer Heading
  ctx.fillStyle = '#00F5D4';
  ctx.font = '900 10.5px "Rajdhani", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('── AUDIO CHANNELS ──', x + 24, y + 54);

  const sliderW = panelW - 130;
  const sliderH = 8;
  const sliderStartX = x + 24;

  // Slider 1: Master Volume
  const masterVal = getMasterVolume();
  _drawSliderRow(ctx, 'MASTER VOLUME', `${Math.round(masterVal * 100)}%`, sliderStartX, y + 68, sliderW, sliderH, masterVal, 'master');

  // Slider 2: Arena Music (BGM)
  const bgmVal = getArenaBgmVolume();
  _drawSliderRow(ctx, 'ARENA MUSIC (BGM)', `${Math.round(bgmVal * 100)}%`, sliderStartX, y + 110, sliderW, sliderH, bgmVal, 'bgm');

  // Slider 3: Combat SFX
  const sfxVal = getSfxVolume();
  _drawSliderRow(ctx, 'COMBAT SFX', `${Math.round(sfxVal * 100)}%`, sliderStartX, y + 152, sliderW, sliderH, sfxVal, 'sfx');

  // Section 2: Combat & System Toggles
  ctx.fillStyle = '#00F5D4';
  ctx.font = '900 10.5px "Rajdhani", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('── PERFORMANCE & GAMEPLAY ──', x + 24, y + 204);

  // Toggle 1: Haptic Feedback
  const hapticsActive = state.enableHaptics !== false;
  _drawToggleRow(ctx, 'HAPTIC FEEDBACK', hapticsActive ? 'ON' : 'OFF', hapticsActive, x + 24, y + 218, panelW - 48, () => {
    state.enableHaptics = !hapticsActive;
    if (state.enableHaptics) triggerHaptic('heavy');
    saveSettingsToStorage();
  });

  // Toggle 2: High Refresh Rate (120 FPS)
  const highRefreshActive = state.enableHighRefreshRate !== false;
  _drawToggleRow(ctx, 'HIGH REFRESH RATE', highRefreshActive ? '120 FPS' : '60 FPS', highRefreshActive, x + 24, y + 256, panelW - 48, () => {
    state.enableHighRefreshRate = !highRefreshActive;
    CONFIG.enableHighRefreshRate = state.enableHighRefreshRate;
    triggerHaptic('selection');
    saveSettingsToStorage();
  });

  // Toggle 3: Combat Blessings / Perks
  const perksActive = Boolean(CONFIG.enableMatchPerks);
  _drawToggleRow(ctx, 'COMBAT BLESSINGS', perksActive ? 'ON' : 'OFF', perksActive, x + 24, y + 294, panelW - 48, () => {
    CONFIG.enableMatchPerks = !perksActive;
    triggerHaptic('selection');
    saveSettingsToStorage();
  });

  // Toggle 4: Commercial Parody Mode
  const commercialActive = Boolean(CONFIG.COMMERCIAL_MODE);
  _drawToggleRow(ctx, 'STORE PARODY MODE', commercialActive ? 'LEGAL SAFE' : 'FAN ANIME', commercialActive, x + 24, y + 332, panelW - 48, () => {
    CONFIG.COMMERCIAL_MODE = !commercialActive;
    triggerHaptic('selection');
    saveSettingsToStorage();
  });

  // Toggle 5: Arena Dark Mode
  const darkModeActive = (state.arenaTheme === 'dark');
  _drawToggleRow(ctx, 'ARENA THEME', darkModeActive ? 'DARK' : 'LIGHT', darkModeActive, x + 24, y + 370, panelW - 48, () => {
    state.arenaTheme = darkModeActive ? 'light' : 'dark';
    triggerHaptic('selection');
    saveSettingsToStorage();
  });

  // Close Button at Bottom
  const btnW = Math.min(panelW - 60, 200);
  const btnH = 36;
  drawButton('✓ SAVE & CLOSE', cx, y + panelH - 32, () => {
    closeSettingsModal();
  }, btnW, btnH, '#00F5D4', 4);

  ctx.restore();
}

function _drawSliderRow(ctx, title, valLabel, x, y, w, h, ratio, key) {
  // Label row
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 11px "Outfit", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, x, y);

  ctx.fillStyle = '#00F5D4';
  ctx.font = '900 11px "Rajdhani", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(valLabel, x + w + 70, y);

  const trackY = y + 16;
  _sliderBounds[key] = { x, y: trackY - 4, w: w + 70, h: h + 8 };

  const totalW = w + 70;
  // Track background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  drawChamferedRect(ctx, x, trackY, totalW, h, 3);
  ctx.fill();

  // Active fill track
  const fillW = Math.max(0, totalW * ratio);
  if (fillW > 0) {
    ctx.fillStyle = '#00F5D4';
    drawChamferedRect(ctx, x, trackY, fillW, h, 3);
    ctx.fill();
  }

  // Thumb knob circle
  const knobX = x + fillW;
  const knobY = trackY + h / 2;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#0E0F14';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(knobX, knobY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function _drawToggleRow(ctx, title, stateLabel, isActive, x, y, rowW, onToggle) {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 11px "Outfit", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, x, y + 14);

  const btnW = 86;
  const btnH = 26;
  const btnX = x + rowW - btnW;
  const btnY = y + 1;

  ctx.save();
  ctx.fillStyle = isActive ? '#00F5D4' : 'rgba(255, 255, 255, 0.10)';
  ctx.strokeStyle = isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.4;
  drawChamferedRect(ctx, btnX, btnY, btnW, btnH, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isActive ? '#0E0F14' : '#FFFFFF';
  ctx.font = '900 10px "Outfit", "Rajdhani", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(stateLabel, btnX + btnW / 2, btnY + btnH / 2);
  ctx.restore();

  _registerButton(btnX, btnY, btnW, btnH, onToggle);
}
