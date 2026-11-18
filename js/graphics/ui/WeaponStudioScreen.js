import {
  state,
  saveWeaponCustomizations,
  setWeaponCustomAsDefault,
  resetWeaponToDefault,
  resetAllWeaponsToDefault,
  autoExportWeaponDatabaseToDisk,
  generateWeaponDatabaseModuleCode
} from '../../core/state.js';
import { FIGHTER_DEFS, CONFIG } from '../../core/config.js';
import { _clearButtons, _registerButton, handleUIMove, handleUIClick, drawPanel, drawButton, wrapText, drawChamferedRect } from './uiFramework.js';
import { drawWeaponPreview } from './WeaponIndexScreen.js';
import { _getZenitsuAssemblyImage } from '../weapons/demonSlayerWeaponGraphics.js';
import { _getEscanorWeaponImage } from '../weapons/escanorWeaponGraphics.js';
import { _getInvertedSpearImage, _getSplitSoulKatanaImage, _getTojiPistolGunImage } from '../weapons/tojiWeaponGraphics.js';
import { _preloadRoaringKnightWeaponSprites } from '../weapons/roaringKnightWeaponGraphics.js';
import { _preloadKaizoKnightWeaponSprites } from '../weapons/kaizoKnightWeaponGraphics.js';
import { _preloadErrorSansWeaponSprites } from '../weapons/errorSansWeaponGraphics.js';
import { _preloadLastBreathSansWeaponSprites } from '../weapons/lastBreathSansWeaponGraphics.js';
import { _preloadCarolWeaponSprites } from '../weapons/carolWeaponGraphics.js';
import { _preloadJevilWeaponSprites } from '../weapons/jevilWeaponGraphics.js';
import { _getVergilWeaponImage } from '../weapons/vergilWeaponGraphics.js';
import { preloadKashimoVfx } from '../weapons/kashimoWeaponGraphics.js';
import { preloadDanteVfx } from '../weapons/danteWeaponGraphics.js';

if (typeof window !== 'undefined') {
  _getZenitsuAssemblyImage?.();
  _getEscanorWeaponImage?.();
  _getInvertedSpearImage?.();
  _getSplitSoulKatanaImage?.();
  _getTojiPistolGunImage?.();
  _preloadRoaringKnightWeaponSprites?.();
  _preloadKaizoKnightWeaponSprites?.();
  _preloadErrorSansWeaponSprites?.();
  _preloadLastBreathSansWeaponSprites?.();
  _preloadCarolWeaponSprites?.();
  _preloadJevilWeaponSprites?.();
  _getVergilWeaponImage?.();
  preloadKashimoVfx?.();
  preloadDanteVfx?.();
}

const TOJI_STUDIO_PART_KEYS = ['pistol', 'inverted_spear', 'split_soul_katana'];

function _ensureTojiWeaponParts() {
  if (!state.weaponCustomizations.toji) {
    state.weaponCustomizations.toji = { offsetX: 0, offsetY: 0, scale: 1.0, widthScale: 1.0, lengthScale: 1.0, angleOffset: 0 };
  }
  const toji = state.weaponCustomizations.toji;
  if (!toji.parts) toji.parts = {};
  for (const pk of TOJI_STUDIO_PART_KEYS) {
    if (!toji.parts[pk]) {
      toji.parts[pk] = { offsetX: 0, offsetY: 0, scale: 1.0, widthScale: 1.0, lengthScale: 1.0, angleOffset: 0 };
    } else {
      const p = toji.parts[pk];
      if (p.offsetX === undefined) p.offsetX = 0;
      if (p.offsetY === undefined) p.offsetY = 0;
      if (p.scale === undefined) p.scale = 1.0;
      if (p.widthScale === undefined) p.widthScale = 1.0;
      if (p.lengthScale === undefined) p.lengthScale = 1.0;
      if (p.angleOffset === undefined) p.angleOffset = 0;
    }
  }
  return toji;
}

function _getActiveTojiCustom() {
  const toji = _ensureTojiWeaponParts();
  const idx = (state.tojiWeaponIndex === 0 || state.tojiWeaponIndex === 1 || state.tojiWeaponIndex === 2)
    ? state.tojiWeaponIndex
    : 1;
  const partKey = TOJI_STUDIO_PART_KEYS[idx] || 'inverted_spear';
  return toji.parts[partKey] || toji;
}

// Currently selected weapon key in studio: 'mahito' | 'yuta' | 'toji' | 'cronos' | 'ruby'
if (state.studioSelectedWeapon === undefined) state.studioSelectedWeapon = 'mahito';
if (state.studioPreviewScale === undefined) state.studioPreviewScale = 2.4;
const ZOOM_MIN = 0.8;
const ZOOM_MAX = 6.0;
const ZOOM_STEP = 0.3;
const ZOOM_DEFAULT = 2.4;
// Selected detail group for editing: 'finger' | 'position' | 'scale_angle' | 'proportions'
if (state.studioSelectedDetail === undefined || state.studioSelectedDetail === null) state.studioSelectedDetail = 'position';
if (state.studioZenitsuPart === undefined) state.studioZenitsuPart = 'overall';
if (state.studioDanteWeaponPart === undefined) state.studioDanteWeaponPart = 'rebellion';
if (state.studioWeaponModalOpen === undefined) state.studioWeaponModalOpen = false;
if (state.studioWeaponModalPage === undefined) state.studioWeaponModalPage = 0;
if (state.studioWeaponBg === undefined) state.studioWeaponBg = 'grid';
if (state.studioWeaponShowGuides === undefined) state.studioWeaponShowGuides = true;

// Precision Viewport Layout Constants (Unified for rendering and mouse math)
const VIEWPORT_X = 16;
const VIEWPORT_Y = 104;
const VIEWPORT_H = 382;

// Interactive Drag States
let isDraggingBase = false;
let isDraggingTip = false;
let activeDragFinger = -1;
let activeDragType = null; // 'knuckle' | 'tip' | 'length' | 'width'

// Toast Notification State
let _weaponToastText = '';
let _weaponToastTimer = 0;

/**
 * Triggers a file download of the full weaponCustomizationsDatabase.js code module.
 */
export function downloadWeaponDatabaseFile() {
  try {
    const code = generateWeaponDatabaseModuleCode(state.weaponCustomizations);
    const blob = new Blob([code], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weaponCustomizationsDatabase.js';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    return true;
  } catch (e) {
    console.error('Failed to download weapon database file:', e);
    return false;
  }
}

// Cached Event Target Bounding Rect to eliminate DOM reflows / layout thrashing on mousemove
let _cachedStudioTargetRect = null;
function getCachedTargetRect(target) {
  if (!_cachedStudioTargetRect) {
    _cachedStudioTargetRect = target.getBoundingClientRect();
  }
  return _cachedStudioTargetRect;
}
function invalidateCachedTargetRect() {
  _cachedStudioTargetRect = null;
}

// Helper to initialize custom settings in state
function initCustomizations() {
  if (!state.weaponCustomizations) {
    state.weaponCustomizations = {
      mahito: {
        blades: [
          { idx: 0, knuckleX: 3.0, knuckleY: -6.5, fanAngle: -0.32, length: 82, heelWidth: 14.0, topArchY: -14.0, tipY: 16.0 },
          { idx: 1, knuckleX: 5.0, knuckleY: -3.8, fanAngle: -0.22, length: 88, heelWidth: 15.5, topArchY: -9.0, tipY: 18.0 },
          { idx: 2, knuckleX: 6.0, knuckleY: -0.8, fanAngle: -0.06, length: 84, heelWidth: 15.0, topArchY: -3.0, tipY: 24.0 },
          { idx: 3, knuckleX: 1.5, knuckleY: 9.0, fanAngle: 0.48, length: 80, heelWidth: 14.5, topArchY: 18.0, tipY: -22.0 }
        ],
        drawOrder: [0, 1, 2, 3],
        weaponScale: 1.0
      },
      yuta: { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 },
      toji: { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 },
      cronos: { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 },
      ruby: { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 },
      rubbick: { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 },
      uryu: { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 },
      ulquiorra: { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 },
      nanami: { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 },
      megumi: { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 },
      john_wick: { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 },
      escanor: { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 },
      engineer: { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 },
      zenitsu: {
        offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0, widthScale: 1.0, lengthScale: 1.0,
        parts: {
          hands:  { offsetX: 0, offsetY: 0, scale: 1.0, spacing: 1.0 }
        }
      }
    };
    // Sync state.mahitoClawCustomBlades with the new unified structure
    state.mahitoClawCustomBlades = state.weaponCustomizations.mahito.blades;
  }
  if (!state.weaponCustomizations.rubbick) {
    state.weaponCustomizations.rubbick = { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 };
  }
  if (!state.weaponCustomizations.ulquiorra) {
    state.weaponCustomizations.ulquiorra = { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 };
  }
  if (!state.weaponCustomizations.megumi) {
    state.weaponCustomizations.megumi = { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 };
  }
  if (!state.weaponCustomizations.uryu) {
    state.weaponCustomizations.uryu = { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 };
  }
  if (!state.weaponCustomizations.cj) {
    state.weaponCustomizations.cj = { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 };
  }
  if (!state.weaponCustomizations.escanor) {
    state.weaponCustomizations.escanor = { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 };
  }
  if (!state.weaponCustomizations.engineer) {
    state.weaponCustomizations.engineer = { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 };
  }
  if (!state.weaponCustomizations.crazydave) {
    state.weaponCustomizations.crazydave = { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 };
  }
  if (!state.weaponCustomizations.guts) {
    state.weaponCustomizations.guts = { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0, widthScale: 1.0, lengthScale: 1.0 };
  }
  if (!state.weaponCustomizations.roaring_knight) {
    state.weaponCustomizations.roaring_knight = { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0, widthScale: 1.0, lengthScale: 1.0 };
  }
  if (!state.weaponCustomizations.kaizo_knight) {
    state.weaponCustomizations.kaizo_knight = { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0, widthScale: 1.0, lengthScale: 1.0 };
  }
  if (!state.weaponCustomizations.error_sans) {
    state.weaponCustomizations.error_sans = { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0, widthScale: 1.0, lengthScale: 1.0 };
  }
  if (!state.weaponCustomizations.last_breath_sans) {
    state.weaponCustomizations.last_breath_sans = { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0, widthScale: 1.0, lengthScale: 1.0 };
  }
  if (!state.weaponCustomizations.carol) {
    state.weaponCustomizations.carol = { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0, widthScale: 1.0, lengthScale: 1.0 };
  }
  if (!state.weaponCustomizations.jevil) {
    state.weaponCustomizations.jevil = { offsetX: 0, offsetY: 0, scale: 1.15, angleOffset: 0, widthScale: 1.0, lengthScale: 1.0 };
  }
  if (!state.weaponCustomizations.vergil) {
    state.weaponCustomizations.vergil = { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0, widthScale: 1.0, lengthScale: 1.0 };
  }
  if (!state.weaponCustomizations.kashimo) {
    state.weaponCustomizations.kashimo = { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0, widthScale: 1.0, lengthScale: 1.0 };
  }
  if (!state.weaponCustomizations.dante) {
    state.weaponCustomizations.dante = { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0, widthScale: 1.0, lengthScale: 1.0 };
  }
  if (!state.weaponCustomizations.zenitsu) {
    state.weaponCustomizations.zenitsu = {
      offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0, widthScale: 1.0, lengthScale: 1.0,
      parts: {
        hands:  { offsetX: 0, offsetY: 0, scale: 1.0, spacing: 1.0 }
      }
    };
  } else {
    if (!state.weaponCustomizations.zenitsu.parts) {
      state.weaponCustomizations.zenitsu.parts = {};
    }
    const p = state.weaponCustomizations.zenitsu.parts;
    delete p.blade;
    delete p.tsuba;
    delete p.habaki;
    delete p.handle;
    if (!p.hands) p.hands = { offsetX: 0, offsetY: 0, scale: 1.0, spacing: 1.0 };
  }
  if (!state.weaponCustomizations.mahito.drawOrder) {
    state.weaponCustomizations.mahito.drawOrder = [0, 1, 2, 3];
  }
  if (state.weaponCustomizations.mahito.weaponScale === undefined) {
    state.weaponCustomizations.mahito.weaponScale = 1.0;
  }
  
  // Migration for widthScale and lengthScale
  _ensureTojiWeaponParts();
  Object.keys(state.weaponCustomizations).forEach(k => {
    if (k !== 'mahito' && state.weaponCustomizations[k]) {
      if (state.weaponCustomizations[k].widthScale === undefined) state.weaponCustomizations[k].widthScale = 1.0;
      if (state.weaponCustomizations[k].lengthScale === undefined) state.weaponCustomizations[k].lengthScale = 1.0;
    }
  });
}

const STUDIO_WEAPONS_ROSTER = [
  { key: 'mahito', label: 'MAHITO', sub: 'Transfigured Claw' },
  { key: 'yuta', label: 'YUTA', sub: 'Bound Katana' },
  { key: 'toji', label: 'TOJI', sub: 'Cursed Arsenal (3)' },
  { key: 'cronos', label: 'CRONOS', sub: 'Time Scythe' },
  { key: 'ruby', label: 'RUBY', sub: 'Crescent Rose' },
  { key: 'roaring_knight', label: 'R. KNIGHT', sub: 'Shadow Blade' },
  { key: 'kaizo_knight', label: 'K. KNIGHT', sub: 'Delta Greatsword' },
  { key: 'rubbick', label: 'RUBBICK', sub: 'Arcane Staff' },
  { key: 'uryu', label: 'URYU', sub: 'Quincy Ginrei' },
  { key: 'ulquiorra', label: 'ULQUIORRA', sub: 'Murcielago Spear' },
  { key: 'nanami', label: 'NANAMI', sub: 'Ratio Cleaver' },
  { key: 'megumi', label: 'MEGUMI', sub: 'Shadow Katana' },
  { key: 'john_wick', label: 'JOHN WICK', sub: 'Tactical Firearms' },
  { key: 'cj', label: 'CJ', sub: 'Grove Arsenal (5)' },
  { key: 'escanor', label: 'ESCANOR', sub: 'Divine Axe Rhitta' },
  { key: 'zenitsu', label: 'ZENITSU', sub: 'Nichirin Thunder' },
  { key: 'engineer', label: 'ENGINEER', sub: 'Sentry & Wrench' },
  { key: 'guts', label: 'GUTS', sub: 'Dragonslayer' },
  { key: 'vergil', label: 'VERGIL', sub: 'Yamato Katana' },
  { key: 'kashimo', label: 'KASHIMO', sub: 'Nyoi Staff' },
  { key: 'dante', label: 'DANTE', sub: 'Rebellion / E&I (3)' },
  { key: 'last_breath_sans', label: 'LAST BREATH', sub: 'Gaster Hands & Blasters' },
  { key: 'carol', label: 'CAROL', sub: 'Glacial Katana' }
];

function _selectStudioWeapon(key) {
  state.studioSelectedWeapon = key;
  if (key === 'zenitsu') {
    state.studioZenitsuPart = 'overall';
    state.studioSelectedDetail = 'proportions';
  } else if (key === 'toji') {
    if (state.tojiWeaponIndex !== 0 && state.tojiWeaponIndex !== 1 && state.tojiWeaponIndex !== 2) {
      state.tojiWeaponIndex = 1;
    }
    state.studioSelectedDetail = 'position';
  } else if (key === 'mahito') {
    state.studioSelectedDetail = 'finger';
  } else {
    state.studioSelectedDetail = 'position';
  }
  isDraggingBase = false;
  isDraggingTip = false;
  activeDragFinger = -1;
  activeDragType = null;
}

function _drawWeaponSelectorBar(ctx, canvas, activeWeaponKey, themeColor) {
  const idx = Math.max(0, STUDIO_WEAPONS_ROSTER.findIndex(w => w.key === activeWeaponKey));
  const cur = STUDIO_WEAPONS_ROSTER[idx] || STUDIO_WEAPONS_ROSTER[0];
  const barY = 66;
  const barH = 30;
  const arrowW = 36;
  const pillW = canvas.width - 32 - arrowW * 2 - 12;
  const leftArrowX = 16;
  const pillX = leftArrowX + arrowW + 6;
  const rightArrowX = pillX + pillW + 6;

  drawButton('◀', leftArrowX + arrowW / 2, barY + barH / 2, () => {
    const prevIdx = (idx - 1 + STUDIO_WEAPONS_ROSTER.length) % STUDIO_WEAPONS_ROSTER.length;
    _selectStudioWeapon(STUDIO_WEAPONS_ROSTER[prevIdx].key);
  }, arrowW, barH, null, 4);

  ctx.save();
  ctx.fillStyle = 'rgba(16, 20, 28, 0.94)';
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 1.6;
  drawChamferedRect(ctx, pillX, barY, pillW, barH, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = themeColor;
  ctx.beginPath();
  ctx.arc(pillX + 16, barY + barH / 2, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 12px "Rajdhani", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`EDITING: ${cur.label}`, pillX + 28, barY + barH / 2);

  const labelW = ctx.measureText(`EDITING: ${cur.label}`).width;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 9.5px "Rajdhani", monospace';
  ctx.fillText(`(${idx + 1}/${STUDIO_WEAPONS_ROSTER.length} • ${cur.sub})`, pillX + 34 + labelW, barY + barH / 2);

  ctx.fillStyle = themeColor;
  ctx.font = '900 10px "Rajdhani", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('ROSTER ▾', pillX + pillW - 12, barY + barH / 2);
  ctx.restore();

  _registerButton(pillX, barY, pillW, barH, () => {
    state.studioWeaponModalOpen = true;
    state.studioWeaponModalPage = Math.floor(idx / 12);
  });

  drawButton('▶', rightArrowX + arrowW / 2, barY + barH / 2, () => {
    const nextIdx = (idx + 1) % STUDIO_WEAPONS_ROSTER.length;
    _selectStudioWeapon(STUDIO_WEAPONS_ROSTER[nextIdx].key);
  }, arrowW, barH, null, 4);
}

function _drawViewportStageBg(ctx, viewportX, viewportY, viewportW, viewportH, heroX, heroY) {
  const mode = state.studioWeaponBg || 'grid';
  if (mode === 'light') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(viewportX, viewportY, viewportW, viewportH);
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.06)';
  } else if (mode === 'dark') {
    ctx.fillStyle = '#080c14';
    ctx.fillRect(viewportX, viewportY, viewportW, viewportH);
    return;
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(viewportX, viewportY, viewportW, viewportH);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
  }

  ctx.lineWidth = 1;
  for (let gx = viewportX; gx < viewportX + viewportW; gx += 20) {
    ctx.beginPath(); ctx.moveTo(gx, viewportY); ctx.lineTo(gx, viewportY + viewportH); ctx.stroke();
  }
  for (let gy = viewportY; gy < viewportY + viewportH; gy += 20) {
    ctx.beginPath(); ctx.moveTo(viewportX, gy); ctx.lineTo(viewportX + viewportW, gy); ctx.stroke();
  }

  if (state.studioWeaponShowGuides) {
    ctx.save();
    ctx.strokeStyle = mode === 'light' ? 'rgba(15, 23, 42, 0.16)' : 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(heroX, viewportY); ctx.lineTo(heroX, viewportY + viewportH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(viewportX, heroY); ctx.lineTo(viewportX + viewportW, heroY); ctx.stroke();
    ctx.restore();
  }
}

function _drawStepperRow(ctx, rowX, curY, rowW, labelText, onDecCoarse, onDecFine, onIncFine, onIncCoarse) {
  const rowH = 38;
  ctx.save();
  ctx.fillStyle = 'rgba(18, 22, 32, 0.92)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = 1;
  drawChamferedRect(ctx, rowX, curY, rowW, rowH, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 11px "Rajdhani", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(labelText, rowX + 10, curY + rowH / 2);
  ctx.restore();

  const btnY = curY + rowH / 2;
  drawButton('−−', rowX + rowW - 84, btnY, onDecCoarse, 20, 20, null, 2);
  drawButton('−', rowX + rowW - 60, btnY, onDecFine, 20, 20, null, 2);
  drawButton('+', rowX + rowW - 36, btnY, onIncFine, 20, 20, null, 2);
  drawButton('++', rowX + rowW - 12, btnY, onIncCoarse, 20, 20, null, 2);
  return curY + rowH + 8;
}

function _drawWeaponRosterModal(ctx, canvas, activeWeaponKey, themeColor) {
  if (!state.studioWeaponModalOpen) return;
  ctx.save();
  ctx.fillStyle = 'rgba(5, 8, 16, 0.86)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  _registerButton(0, 0, canvas.width, canvas.height, () => {
    state.studioWeaponModalOpen = false;
  });

  const modalW = canvas.width - 28;
  const modalH = 446;
  const modalX = 14;
  const modalY = Math.max(24, Math.floor((canvas.height - modalH) / 2));
  _registerButton(modalX, modalY, modalW, modalH, () => {});
  drawPanel(modalX, modalY, modalW, modalH, 0.98, 8, themeColor);

  ctx.save();
  ctx.fillStyle = themeColor;
  ctx.font = '900 9px "Rajdhani", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('WEAPON STUDIO // ROSTER DIRECTORY', modalX + 14, modalY + 12);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 15px "Outfit", "Rajdhani", sans-serif';
  ctx.fillText('SELECT WEAPON TO CALIBRATE', modalX + 14, modalY + 25);
  ctx.restore();

  drawButton('✕ CLOSE', modalX + modalW - 44, modalY + 24, () => {
    state.studioWeaponModalOpen = false;
  }, 66, 22, '#ef4444', 3);

  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(STUDIO_WEAPONS_ROSTER.length / PAGE_SIZE));
  const curPage = Math.max(0, Math.min(state.studioWeaponModalPage || 0, totalPages - 1));
  state.studioWeaponModalPage = curPage;
  const pageItems = STUDIO_WEAPONS_ROSTER.slice(curPage * PAGE_SIZE, (curPage + 1) * PAGE_SIZE);

  const cols = 3;
  const gapX = 8;
  const gapY = 8;
  const cardW = Math.floor((modalW - 28 - gapX * (cols - 1)) / cols);
  const cardH = 68;
  const gridX = modalX + 14;
  const gridY = modalY + 56;

  pageItems.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = gridX + col * (cardW + gapX);
    const cy = gridY + row * (cardH + gapY);
    const isSel = item.key === activeWeaponKey;
    const fDef = FIGHTER_DEFS.find(f => f.type === item.key || (f.type && f.type.toLowerCase() === item.key));
    const itemColor = fDef?.color || '#f59e0b';

    ctx.save();
    ctx.fillStyle = isSel ? 'rgba(245, 158, 11, 0.16)' : 'rgba(18, 24, 38, 0.92)';
    ctx.strokeStyle = isSel ? '#f59e0b' : 'rgba(255, 255, 255, 0.10)';
    ctx.lineWidth = isSel ? 1.6 : 1;
    drawChamferedRect(ctx, cx, cy, cardW, cardH, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = itemColor;
    ctx.fillRect(cx + 8, cy + 10, 4, cardH - 20);
    ctx.fillStyle = isSel ? '#ffffff' : '#e2e8f0';
    ctx.font = '900 11px "Rajdhani", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(item.label, cx + 18, cy + 10);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 8.5px "Rajdhani", sans-serif';
    ctx.fillText(item.sub, cx + 18, cy + 28);

    ctx.fillStyle = isSel ? '#f59e0b' : '#64748b';
    ctx.font = '900 8px "Rajdhani", monospace';
    ctx.fillText(isSel ? '● ACTIVE' : 'SELECT ➔', cx + 18, cy + 48);
    ctx.restore();

    _registerButton(cx, cy, cardW, cardH, () => {
      _selectStudioWeapon(item.key);
      state.studioWeaponModalOpen = false;
    });
  });

  const pagY = modalY + modalH - 28;
  drawButton('◀ PREV', modalX + 54, pagY, () => {
    state.studioWeaponModalPage = (curPage - 1 + totalPages) % totalPages;
  }, 78, 22, null, 3);

  ctx.save();
  ctx.fillStyle = '#94a3b8';
  ctx.font = '900 10.5px "Rajdhani", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`PAGE ${curPage + 1} / ${totalPages}`, modalX + modalW / 2, pagY);
  ctx.restore();

  drawButton('NEXT ▶', modalX + modalW - 54, pagY, () => {
    state.studioWeaponModalPage = (curPage + 1) % totalPages;
  }, 78, 22, null, 3);
}

export function drawWeaponStudioScreen() {
  const { ctx, canvas } = state;
  initCustomizations();

  // 1. Reset Context
  ctx.resetTransform();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowBlur = 0;

  _clearButtons();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 2. Sleek Gunmetal Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGrad.addColorStop(0, '#07080c');
  bgGrad.addColorStop(0.5, '#10131c');
  bgGrad.addColorStop(1, '#07080c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const activeWeaponKey = state.studioSelectedWeapon;
  const activeDef = FIGHTER_DEFS.find(f => f.type === activeWeaponKey || (f.type && f.type.toLowerCase() === activeWeaponKey.toLowerCase()));
  const themeColor = activeDef?.color || '#f59e0b';

  // ── Tier 1: Clean Zero-Overlap Header & Weapon Selector Bar ──
  ctx.fillStyle = '#64748b';
  ctx.font = '900 10px "Rajdhani", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('CIRCLE BATTLE // WEAPON STUDIO // SYS.v3.0', canvas.width / 2, 36);

  ctx.save();
  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 19px "Outfit", "Rajdhani", sans-serif';
  ctx.fillText('[ WEAPON STUDIO ]', canvas.width / 2, 56);
  ctx.restore();

  _drawWeaponSelectorBar(ctx, canvas, activeWeaponKey, themeColor);

  // ── Tier 2: Precision Viewport Stage ──
  const viewportX = VIEWPORT_X;
  const viewportY = VIEWPORT_Y;
  const viewportW = canvas.width - 32; // 508px
  const viewportH = VIEWPORT_H;
  const heroX = canvas.width / 2;
  const heroY = viewportY + viewportH / 2;

  // Viewport Container Panel
  drawPanel(viewportX, viewportY, viewportW, viewportH, 0.94, 8);

  // Stage Background (Grid / Dark / Light Review Canvas)
  ctx.save();
  ctx.beginPath();
  drawChamferedRect(ctx, viewportX + 1, viewportY + 1, viewportW - 2, viewportH - 2, 7);
  ctx.clip();
  _drawViewportStageBg(ctx, viewportX, viewportY, viewportW, viewportH, heroX, heroY);

  // Render Hero Weapon Preview
  const currentScale = state.studioPreviewScale;
  if (state.studioPixelArtMode) {
    const pixelFactor = 0.30;
    const pw = Math.ceil(viewportW * pixelFactor);
    const ph = Math.ceil(viewportH * pixelFactor);

    if (!state._studioPixelCanvas) {
      state._studioPixelCanvas = document.createElement('canvas');
    }
    const pc = state._studioPixelCanvas;
    if (pc.width !== pw || pc.height !== ph) {
      pc.width = pw;
      pc.height = ph;
    }
    const pctx = pc.getContext('2d');
    pctx.clearRect(0, 0, pw, ph);

    pctx.save();
    pctx.translate(pw / 2, ph / 2);
    pctx.scale(currentScale * pixelFactor, currentScale * pixelFactor);
    drawWeaponPreview(pctx, activeWeaponKey, themeColor);
    pctx.restore();

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pc, 0, 0, pw, ph, viewportX, viewportY, viewportW, viewportH);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(heroX, heroY);
    ctx.scale(currentScale, currentScale);
    drawWeaponPreview(ctx, activeWeaponKey, themeColor);
    ctx.restore();
  }

  // Draw Interactive Drag Handles
  if (state.studioSelectedDetail !== null) {
    ctx.save();
    ctx.translate(heroX, heroY);
    ctx.scale(currentScale, currentScale);

    if (activeWeaponKey === 'mahito' && state.studioSelectedDetail === 'finger') {
      const handX = 25;
      const blades = state.weaponCustomizations.mahito.blades;
      const b = blades[state.studioClawFinger];
      if (b) {
        const kx = handX + b.knuckleX;
        const ky = b.knuckleY;

        const cosAngle = Math.cos(b.fanAngle);
        const sinAngle = Math.sin(b.fanAngle);
        const tx = handX + b.knuckleX + b.length * cosAngle - b.tipY * sinAngle;
        const ty = b.knuckleY + b.length * sinAngle + b.tipY * cosAngle;

        // Knuckle Handle (Teal)
        ctx.beginPath(); ctx.arc(kx, ky, 4.0, 0, Math.PI * 2);
        ctx.fillStyle = (activeDragFinger === state.studioClawFinger && activeDragType === 'knuckle') ? '#00ffff' : 'rgba(0, 255, 255, 0.85)';
        ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.0; ctx.stroke();

        // Tip Handle (Amber / Red)
        ctx.beginPath(); ctx.arc(tx, ty, 4.0, 0, Math.PI * 2);
        ctx.fillStyle = (activeDragFinger === state.studioClawFinger && activeDragType === 'tip') ? '#f59e0b' : 'rgba(245, 158, 11, 0.85)';
        ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.0; ctx.stroke();

        // Guide line
        ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(tx, ty);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.8; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
      }
    } else if (activeWeaponKey === 'zenitsu') {
      const custom = state.weaponCustomizations.zenitsu;
      const partKey = state.studioZenitsuPart || 'overall';
      const isHands = (partKey === 'hands');
      const target = isHands ? (custom.parts?.hands || custom) : custom;

      const baseAnchorX = isHands ? -33.5 : -18;
      const baseLx = baseAnchorX + custom.offsetX + (isHands ? (target.offsetX || 0) : 0);
      const baseLy = custom.offsetY + (isHands ? (target.offsetY || 0) : 0);

      if (state.studioSelectedDetail === 'position') {
        ctx.beginPath(); ctx.arc(baseLx, baseLy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = isDraggingBase ? '#00ffff' : 'rgba(0, 255, 255, 0.85)';
        ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.0; ctx.stroke();
      } else if (state.studioSelectedDetail === 'scale_angle' || state.studioSelectedDetail === 'hands_size') {
        const lineLen = isHands ? 30 : 65;
        const curScale = target.scale ?? 1.0;
        const curAngle = isHands ? 0 : (target.angleOffset ?? 0);
        const tipLx = baseLx + lineLen * curScale * Math.cos(curAngle);
        const tipLy = baseLy + lineLen * curScale * Math.sin(curAngle);

        ctx.beginPath(); ctx.arc(tipLx, tipLy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = isDraggingTip ? '#f59e0b' : 'rgba(245, 158, 11, 0.85)';
        ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.0; ctx.stroke();

        ctx.beginPath(); ctx.moveTo(baseLx, baseLy); ctx.lineTo(tipLx, tipLy);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 0.8; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
      } else if (state.studioSelectedDetail === 'proportions') {
        const lineLen = 65 * (target.scale ?? 1.0) * (target.lengthScale ?? 1.0);
        const widthLen = 18 * (target.scale ?? 1.0) * (target.widthScale ?? 1.0);
        const cosA = Math.cos(target.angleOffset || 0);
        const sinA = Math.sin(target.angleOffset || 0);

        const lenLx = baseLx + lineLen * cosA;
        const lenLy = baseLy + lineLen * sinA;
        const widthLx = baseLx - widthLen * sinA;
        const widthLy = baseLy + widthLen * cosA;

        // Length Handle (Green)
        ctx.beginPath(); ctx.arc(lenLx, lenLy, 5.0, 0, Math.PI * 2);
        ctx.fillStyle = (activeDragType === 'length') ? '#10b981' : 'rgba(16, 185, 129, 0.85)';
        ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.0; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(baseLx, baseLy); ctx.lineTo(lenLx, lenLy);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)'; ctx.lineWidth = 1.0; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);

        // Width Handle (Cyan)
        ctx.beginPath(); ctx.arc(widthLx, widthLy, 5.0, 0, Math.PI * 2);
        ctx.fillStyle = (activeDragType === 'width') ? '#06b6d4' : 'rgba(6, 182, 212, 0.85)';
        ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.0; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(baseLx, baseLy); ctx.lineTo(widthLx, widthLy);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)'; ctx.lineWidth = 1.0; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
      }
    } else if (activeWeaponKey !== 'mahito') {
      const custom = (activeWeaponKey === 'toji')
        ? _getActiveTojiCustom()
        : state.weaponCustomizations[activeWeaponKey];
      let offsetX = -40;
      if (activeWeaponKey === 'cronos') offsetX = -55;
      else if (activeWeaponKey === 'ruby') offsetX = -75;
      else if (activeWeaponKey === 'escanor') offsetX = -40;
      else if (activeWeaponKey === 'rubbick' || activeWeaponKey === 'uryu') offsetX = 0;

      const baseLx = offsetX + custom.offsetX;
      const baseLy = custom.offsetY;

      if (state.studioSelectedDetail === 'position') {
        ctx.beginPath(); ctx.arc(baseLx, baseLy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = isDraggingBase ? '#00ffff' : 'rgba(0, 255, 255, 0.85)';
        ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.0; ctx.stroke();
      } else if (state.studioSelectedDetail === 'scale_angle') {
        const lineLen = 70;
        const tipLx = baseLx + lineLen * custom.scale * Math.cos(custom.angleOffset);
        const tipLy = baseLy + lineLen * custom.scale * Math.sin(custom.angleOffset);

        ctx.beginPath(); ctx.arc(tipLx, tipLy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = isDraggingTip ? '#f59e0b' : 'rgba(245, 158, 11, 0.85)';
        ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.0; ctx.stroke();

        ctx.beginPath(); ctx.moveTo(baseLx, baseLy); ctx.lineTo(tipLx, tipLy);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 0.8; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
      } else if (state.studioSelectedDetail === 'proportions') {
        const lineLen = 70 * (custom.scale ?? 1.0) * (custom.lengthScale ?? 1.0);
        const widthLen = 28 * (custom.scale ?? 1.0) * (custom.widthScale ?? 1.0);
        const cosA = Math.cos(custom.angleOffset || 0);
        const sinA = Math.sin(custom.angleOffset || 0);

        const lenLx = baseLx + lineLen * cosA;
        const lenLy = baseLy + lineLen * sinA;
        const widthLx = baseLx - widthLen * sinA;
        const widthLy = baseLy + widthLen * cosA;

        // Length Handle (Green)
        ctx.beginPath(); ctx.arc(lenLx, lenLy, 5.0, 0, Math.PI * 2);
        ctx.fillStyle = (activeDragType === 'length') ? '#10b981' : 'rgba(16, 185, 129, 0.85)';
        ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.0; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(baseLx, baseLy); ctx.lineTo(lenLx, lenLy);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)'; ctx.lineWidth = 1.0; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);

        // Width Handle (Cyan)
        ctx.beginPath(); ctx.arc(widthLx, widthLy, 5.0, 0, Math.PI * 2);
        ctx.fillStyle = (activeDragType === 'width') ? '#06b6d4' : 'rgba(6, 182, 212, 0.85)';
        ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.0; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(baseLx, baseLy); ctx.lineTo(widthLx, widthLy);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)'; ctx.lineWidth = 1.0; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }

  ctx.restore(); // Restore clip

  // Viewport Toast Notification Banner
  if (_weaponToastTimer > 0) {
    _weaponToastTimer--;
    ctx.save();
    const toastW = 340;
    const toastH = 26;
    const toastX = (canvas.width - toastW) / 2;
    const toastY = viewportY + 10;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    drawChamferedRect(ctx, toastX, toastY, toastW, toastH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = '900 11px "Rajdhani", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(_weaponToastText, toastX + toastW / 2, toastY + toastH / 2);
    ctx.restore();
  }

  // Viewport Overlays: Top Toolbar (Pixel Art, Stage BG, Crosshair Guides)
  if (state.studioPixelArtMode === undefined) state.studioPixelArtMode = false;
  const topBtnY = viewportY + 21;

  drawButton(
    state.studioPixelArtMode ? 'PIXEL ART: ON' : 'PIXEL ART: OFF',
    viewportX + 62, topBtnY,
    () => { state.studioPixelArtMode = !state.studioPixelArtMode; },
    104, 22, state.studioPixelArtMode ? '#f59e0b' : null, 4
  );

  const bgLabel = `BG: ${(state.studioWeaponBg || 'grid').toUpperCase()}`;
  drawButton(bgLabel, viewportX + viewportW - 122, topBtnY, () => {
    const order = ['grid', 'dark', 'light'];
    const cur = state.studioWeaponBg || 'grid';
    state.studioWeaponBg = order[(order.indexOf(cur) + 1) % order.length];
  }, 76, 22, null, 4);

  drawButton(
    state.studioWeaponShowGuides ? 'GUIDES: ON' : 'GUIDES: OFF',
    viewportX + viewportW - 44, topBtnY,
    () => { state.studioWeaponShowGuides = !state.studioWeaponShowGuides; },
    72, 22, state.studioWeaponShowGuides ? '#38bdf8' : null, 4
  );

  // Dante multi-weapon selector bar inside stage top/bottom-left
  if (activeWeaponKey === 'dante') {
    const parts = [
      { id: 'rebellion', label: 'REBELLION' },
      { id: 'ebony', label: 'EBONY' },
      { id: 'ivory', label: 'IVORY' }
    ];
    parts.forEach((p, idx) => {
      const bx = viewportX + 46 + idx * 72;
      const by = viewportY + viewportH - 24;
      const isActive = (state.studioDanteWeaponPart || 'rebellion') === p.id;
      drawButton(p.label, bx, by, () => {
        state.studioDanteWeaponPart = p.id;
      }, 68, 20, isActive ? '#EF4444' : null, 3);
    });
  }

  // Viewport Overlays: High-Contrast Zoom Controls Capsule (Bottom-Center of Viewport)
  const zoomY = viewportY + viewportH - 24;
  const zoomCenterX = activeWeaponKey === 'dante' ? heroX + 62 : heroX;
  const zoomPct = Math.round((currentScale / ZOOM_DEFAULT) * 100);

  ctx.save();
  ctx.fillStyle = 'rgba(11, 15, 25, 0.88)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  drawChamferedRect(ctx, zoomCenterX - 132, zoomY - 22, 268, 36, 5);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  drawButton('−', zoomCenterX - 78, zoomY, () => {
    state.studioPreviewScale = Math.max(ZOOM_MIN, state.studioPreviewScale - ZOOM_STEP);
  }, 24, 18, null, 3);

  const trackW = 84;
  const trackH = 6;
  const trackX = zoomCenterX - trackW / 2;
  const trackY = zoomY - 3;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  drawChamferedRect(ctx, trackX, trackY, trackW, trackH, 2);
  ctx.fill();
  ctx.stroke();

  const zoomFrac = (currentScale - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN);
  const fillW = Math.max(4, zoomFrac * trackW);
  ctx.fillStyle = '#f59e0b';
  drawChamferedRect(ctx, trackX, trackY, fillW, trackH, 2);
  ctx.fill();

  drawButton('+', zoomCenterX + 78, zoomY, () => {
    state.studioPreviewScale = Math.min(ZOOM_MAX, state.studioPreviewScale + ZOOM_STEP);
  }, 24, 18, null, 3);

  drawButton('⟲', zoomCenterX + 112, zoomY, () => {
    state.studioPreviewScale = ZOOM_DEFAULT;
  }, 22, 18, null, 3);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 9.5px "Rajdhani", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`ZOOM: ${zoomPct}%`, zoomCenterX, zoomY - 9);

  // ── Tier 3: Dual Parameter Console ──
  const consoleY = viewportY + viewportH + 10;
  const consoleH = canvas.height - consoleY - 52;
  const consoleGap = 12;
  const leftConsoleW = Math.floor((viewportW - consoleGap) * 0.48); // 238px
  const rightConsoleW = viewportW - leftConsoleW - consoleGap; // 258px
  const leftConsoleX = viewportX;
  const rightConsoleX = leftConsoleX + leftConsoleW + consoleGap;

  // Left Console Panel (Layers & Components)
  drawPanel(leftConsoleX, consoleY, leftConsoleW, consoleH, 0.92, 8);
  // Right Console Panel (Precision Metrics)
  drawPanel(rightConsoleX, consoleY, rightConsoleW, consoleH, 0.92, 8);

  // Console Headers
  ctx.fillStyle = '#f59e0b';
  ctx.font = '900 10px "Rajdhani", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  if (activeWeaponKey === 'mahito') {
    ctx.fillText('CLAW BLADE LAYERS //', leftConsoleX + 14, consoleY + 12);
    ctx.fillText('GEOMETRY CALIBRATION //', rightConsoleX + 14, consoleY + 12);

    if (state.studioClawFinger === undefined) state.studioClawFinger = 0;
    const drawOrder = state.weaponCustomizations.mahito.drawOrder;
    const clawNames = ['FINGER 1 (TOP)', 'FINGER 2 (MID-TOP)', 'FINGER 3 (MID-BOT)', 'THUMB (BOTTOM)'];

    // Finger Layer Cards in Left Console
    clawNames.forEach((name, idx) => {
      const cardY = consoleY + 34 + idx * 48;
      const cardW = leftConsoleW - 24;
      const cardH = 40;
      const cardX = leftConsoleX + 12;
      const isSelected = state.studioClawFinger === idx && state.studioSelectedDetail === 'finger';

      const layerPos = drawOrder.indexOf(idx);
      const layerLabel = layerPos === drawOrder.length - 1 ? 'TOP' : layerPos === 0 ? 'BOTTOM' : `LAYER ${layerPos + 1}`;

      ctx.save();
      if (isSelected) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.20)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
      } else {
        ctx.fillStyle = 'rgba(18, 22, 32, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
        ctx.lineWidth = 1;
      }
      drawChamferedRect(ctx, cardX, cardY, cardW, cardH, 5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
      ctx.font = '900 10px "Rajdhani", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(name, cardX + 10, cardY + 8);

      ctx.fillStyle = isSelected ? '#f59e0b' : '#64748b';
      ctx.font = '900 8.5px "Rajdhani", monospace';
      ctx.fillText(`ORDER: [ ${layerLabel} ]`, cardX + 10, cardY + 23);

      // Layer Up (▲) / Down (▼) buttons
      const upBtnX = cardX + cardW - 48;
      const downBtnX = cardX + cardW - 24;
      const btnSize = 18;
      const btnY = cardY + 11;

      drawButton('▲', upBtnX, btnY + btnSize / 2, () => {
        const pos = drawOrder.indexOf(idx);
        if (pos < drawOrder.length - 1) {
          [drawOrder[pos], drawOrder[pos + 1]] = [drawOrder[pos + 1], drawOrder[pos]];
          saveWeaponCustomizations();
        }
      }, btnSize, btnSize, null, 2);

      drawButton('▼', downBtnX, btnY + btnSize / 2, () => {
        const pos = drawOrder.indexOf(idx);
        if (pos > 0) {
          [drawOrder[pos], drawOrder[pos - 1]] = [drawOrder[pos - 1], drawOrder[pos]];
          saveWeaponCustomizations();
        }
      }, btnSize, btnSize, null, 2);

      _registerButton(cardX, cardY, cardW - 52, cardH, () => {
        state.studioClawFinger = idx;
        state.studioSelectedDetail = 'finger';
      });
    });

    // Right Console Metrics for Mahito
    const f = state.weaponCustomizations.mahito.blades[state.studioClawFinger];
    let curY = consoleY + 34;

    if (state.studioSelectedDetail === 'finger') {
      ctx.fillStyle = '#64748b';
      ctx.font = '900 9px "Rajdhani", sans-serif';
      ctx.fillText(`ACTIVE: ${clawNames[state.studioClawFinger]}`, rightConsoleX + 14, curY);
      curY += 22;

      // Arch Stepper
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 11px "Rajdhani", sans-serif';
      ctx.fillText(`SPINE ARCH: ${Math.round(f.topArchY)}px`, rightConsoleX + 14, curY + 4);
      drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { f.topArchY -= 1.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
      drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { f.topArchY += 1.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
      curY += 34;

      // Tip Stepper
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`TIP CURVATURE: ${Math.round(f.tipY)}px`, rightConsoleX + 14, curY + 4);
      drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { f.tipY -= 1.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
      drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { f.tipY += 1.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
      curY += 34;

      // Blade Length Readout
      ctx.fillStyle = '#94a3b8';
      ctx.font = '900 10px "Rajdhani", monospace';
      ctx.fillText(`BLADE LENGTH: ${Math.round(f.length)}px`, rightConsoleX + 14, curY);
      curY += 20;
      ctx.fillText(`FAN ANGLE: ${(f.fanAngle * (180 / Math.PI)).toFixed(1)}°`, rightConsoleX + 14, curY);
      curY += 32;
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = '900 10px "Rajdhani", sans-serif';
      ctx.fillText('SELECT A FINGER CARD ON THE LEFT', rightConsoleX + 14, curY + 20);
      ctx.fillText('TO ADJUST BLADE CURVATURE', rightConsoleX + 14, curY + 36);
      curY += 80;
    }

    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightConsoleX + 14, curY);
    ctx.lineTo(rightConsoleX + rightConsoleW - 14, curY);
    ctx.stroke();
    curY += 16;

    // Global Weapon Scale
    const mahitoCustom = state.weaponCustomizations.mahito;
    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 10.5px "Rajdhani", sans-serif';
    ctx.fillText('GLOBAL CLAW SCALE //', rightConsoleX + 14, curY);
    curY += 20;

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 12px "Rajdhani", sans-serif';
    ctx.fillText(`SCALE: ${mahitoCustom.weaponScale.toFixed(2)}x`, rightConsoleX + 14, curY + 4);
    drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { mahitoCustom.weaponScale = Math.max(0.3, mahitoCustom.weaponScale - 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
    drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { mahitoCustom.weaponScale = Math.min(3.0, mahitoCustom.weaponScale + 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);

  } else if (activeWeaponKey === 'toji') {
    ctx.fillText('TOJI WEAPONS ARSENAL //', leftConsoleX + 14, consoleY + 12);
    ctx.fillText('TRANSFORM METRICS //', rightConsoleX + 14, consoleY + 12);

    if (state.tojiWeaponIndex !== 0 && state.tojiWeaponIndex !== 1 && state.tojiWeaponIndex !== 2) {
      state.tojiWeaponIndex = 1;
    }

    const tojiWeapons = [
      { id: 0, label: '1. TACTICAL PISTOL', desc: 'Semi-auto sidearm (toji_pistol.png)' },
      { id: 1, label: '2. INVERTED SPEAR', desc: '16-bit Cursed Tool Sprite + Chain' },
      { id: 2, label: '3. SPLIT SOUL KATANA', desc: '16-bit Soul Liberation Blade Sprite' }
    ];

    tojiWeapons.forEach((w) => {
      const cardY = consoleY + 32 + w.id * 56;
      const cardW = leftConsoleW - 24;
      const cardH = 48;
      const cardX = leftConsoleX + 12;
      const isSelected = state.tojiWeaponIndex === w.id;

      ctx.save();
      if (isSelected) {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.22)';
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.5;
      } else {
        ctx.fillStyle = 'rgba(18, 22, 32, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
        ctx.lineWidth = 1;
      }
      drawChamferedRect(ctx, cardX, cardY, cardW, cardH, 5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
      ctx.font = '900 10.5px "Rajdhani", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(w.label, cardX + 10, cardY + 8);

      ctx.fillStyle = isSelected ? '#c084fc' : '#64748b';
      ctx.font = '900 8.5px "Rajdhani", sans-serif';
      ctx.fillText(w.desc, cardX + 10, cardY + 25);

      _registerButton(cardX, cardY, cardW, cardH, () => {
        state.tojiWeaponIndex = w.id;
        if (state.previewFighter) state.previewFighter.tojiWeaponIndex = w.id;
        if (state.studioSelectedDetail === null) state.studioSelectedDetail = 'position';
      });
    });

    const custom = _getActiveTojiCustom();
    let curY = consoleY + 34;

    const modeW = Math.floor((rightConsoleW - 44) / 3);
    const isPosMode = (state.studioSelectedDetail === 'position');
    const isScaleMode = (state.studioSelectedDetail === 'scale_angle');
    const isPropMode = (state.studioSelectedDetail === 'proportions');

    drawButton('📍 POS', rightConsoleX + 14 + modeW / 2, curY + 10, () => {
      state.studioSelectedDetail = 'position';
    }, modeW, 22, isPosMode ? '#a855f7' : null, 3);

    drawButton('📐 ROT', rightConsoleX + 22 + modeW + modeW / 2, curY + 10, () => {
      state.studioSelectedDetail = 'scale_angle';
    }, modeW, 22, isScaleMode ? '#a855f7' : null, 3);

    drawButton('📏 PROP', rightConsoleX + 30 + modeW * 2 + modeW / 2, curY + 10, () => {
      state.studioSelectedDetail = 'proportions';
    }, modeW, 22, isPropMode ? '#a855f7' : null, 3);

    curY += 40;

    if (state.studioSelectedDetail === 'position') {
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 11.5px "Rajdhani", sans-serif';
      ctx.fillText(`OFFSET X: ${Math.round(custom.offsetX)}px`, rightConsoleX + 14, curY + 4);
      drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { custom.offsetX -= 2.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
      drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { custom.offsetX += 2.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
      curY += 36;

      ctx.fillText(`OFFSET Y: ${Math.round(custom.offsetY)}px`, rightConsoleX + 14, curY + 4);
      drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { custom.offsetY -= 2.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
      drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { custom.offsetY += 2.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
      curY += 36;

      ctx.fillStyle = '#64748b';
      ctx.font = '900 9.5px "Rajdhani", sans-serif';
      ctx.fillText('DRAG TEAL HANDLE IN VIEWPORT', rightConsoleX + 14, curY + 10);
      ctx.fillText('FOR REAL-TIME POSITIONING', rightConsoleX + 14, curY + 26);
    } else if (state.studioSelectedDetail === 'scale_angle') {
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 11.5px "Rajdhani", sans-serif';
      ctx.fillText(`SCALE: ${custom.scale.toFixed(2)}x`, rightConsoleX + 14, curY + 4);
      drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { custom.scale = Math.max(0.3, custom.scale - 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
      drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { custom.scale = Math.min(3.0, custom.scale + 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
      curY += 36;

      const deg = Math.round(custom.angleOffset * (180 / Math.PI));
      ctx.fillText(`ROTATION: ${deg}°`, rightConsoleX + 14, curY + 4);
      drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { custom.angleOffset -= 0.05; saveWeaponCustomizations(); }, 22, 18, null, 2);
      drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { custom.angleOffset += 0.05; saveWeaponCustomizations(); }, 22, 18, null, 2);
      curY += 36;

      ctx.fillStyle = '#64748b';
      ctx.font = '900 9.5px "Rajdhani", sans-serif';
      ctx.fillText('DRAG AMBER HANDLE IN VIEWPORT', rightConsoleX + 14, curY + 10);
      ctx.fillText('FOR REAL-TIME ROTATION & SCALE', rightConsoleX + 14, curY + 26);
    } else if (state.studioSelectedDetail === 'proportions') {
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 11.5px "Rajdhani", sans-serif';
      const curW = custom.widthScale ?? 1.0;
      const curL = custom.lengthScale ?? 1.0;
      ctx.fillText(`WIDTH: ${curW.toFixed(2)}x`, rightConsoleX + 14, curY + 4);
      drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { custom.widthScale = Math.max(0.3, (custom.widthScale ?? 1.0) - 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
      drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { custom.widthScale = Math.min(3.0, (custom.widthScale ?? 1.0) + 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
      curY += 36;

      ctx.fillText(`LENGTH: ${curL.toFixed(2)}x`, rightConsoleX + 14, curY + 4);
      drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { custom.lengthScale = Math.max(0.3, (custom.lengthScale ?? 1.0) - 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
      drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { custom.lengthScale = Math.min(3.0, (custom.lengthScale ?? 1.0) + 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
      curY += 36;

      ctx.fillStyle = '#64748b';
      ctx.font = '900 9.5px "Rajdhani", sans-serif';
      ctx.fillText('DRAG GREEN (LEN) / CYAN (WIDTH)', rightConsoleX + 14, curY + 10);
      ctx.fillText('HANDLES FOR REAL-TIME PROPORTIONS', rightConsoleX + 14, curY + 26);
    }

  } else if (activeWeaponKey === 'cj') {
    ctx.fillText('CJ WEAPONS ARSENAL //', leftConsoleX + 14, consoleY + 12);
    ctx.fillText('TRANSFORM METRICS //', rightConsoleX + 14, consoleY + 12);

    if (state.studioCjWeaponIndex === undefined) state.studioCjWeaponIndex = 0;
    const cjWeapons = [
      { id: 0, label: '1. BRASS KNUCKLES', desc: 'CQC metallic cast knuckles' },
      { id: 1, label: '2. DARPA JETPACK', desc: 'Area 69 dual rocket thrusters' },
      { id: 2, label: '3. DUAL MICRO-UZIS', desc: '9mm submachine guns' },
      { id: 3, label: '4. M134 MINIGUN', desc: '6-barrel Gatling minigun' },
      { id: 4, label: '5. INTRATEC TEC-9', desc: 'Skill 3 Drive-By submachine gun' }
    ];

    cjWeapons.forEach((w) => {
      const cardY = consoleY + 30 + w.id * 46;
      const cardW = leftConsoleW - 24;
      const cardH = 40;
      const cardX = leftConsoleX + 12;
      const isSelected = state.studioCjWeaponIndex === w.id;

      ctx.save();
      if (isSelected) {
        ctx.fillStyle = 'rgba(22, 163, 74, 0.22)';
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 1.5;
      } else {
        ctx.fillStyle = 'rgba(18, 22, 32, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
        ctx.lineWidth = 1;
      }
      drawChamferedRect(ctx, cardX, cardY, cardW, cardH, 5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
      ctx.font = '900 10px "Rajdhani", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(w.label, cardX + 10, cardY + 6);

      ctx.fillStyle = isSelected ? '#4ade80' : '#64748b';
      ctx.font = '900 8.5px "Rajdhani", sans-serif';
      ctx.fillText(w.desc, cardX + 10, cardY + 21);

      _registerButton(cardX, cardY, cardW, cardH, () => {
        state.studioCjWeaponIndex = w.id;
      });
    });

    const custom = state.weaponCustomizations.cj || { offsetX: 0, offsetY: 0, scale: 1.0, angleOffset: 0 };
    let curY = consoleY + 34;

    const modeW = Math.floor((rightConsoleW - 44) / 3);
    const isPosMode = (state.studioSelectedDetail === 'position');
    const isScaleMode = (state.studioSelectedDetail === 'scale_angle');
    const isPropMode = (state.studioSelectedDetail === 'proportions');

    drawButton('📍 POS', rightConsoleX + 14 + modeW / 2, curY + 10, () => {
      state.studioSelectedDetail = 'position';
    }, modeW, 22, isPosMode ? '#16a34a' : null, 3);

    drawButton('📐 ROT', rightConsoleX + 22 + modeW + modeW / 2, curY + 10, () => {
      state.studioSelectedDetail = 'scale_angle';
    }, modeW, 22, isScaleMode ? '#16a34a' : null, 3);

    drawButton('📏 PROP', rightConsoleX + 30 + modeW * 2 + modeW / 2, curY + 10, () => {
      state.studioSelectedDetail = 'proportions';
    }, modeW, 22, isPropMode ? '#16a34a' : null, 3);

    curY += 40;

    if (state.studioSelectedDetail === 'position') {
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 11.5px "Rajdhani", sans-serif';
      ctx.fillText(`OFFSET X: ${Math.round(custom.offsetX)}px`, rightConsoleX + 14, curY + 4);
      drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { custom.offsetX -= 2.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
      drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { custom.offsetX += 2.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
      curY += 36;

      ctx.fillText(`OFFSET Y: ${Math.round(custom.offsetY)}px`, rightConsoleX + 14, curY + 4);
      drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { custom.offsetY -= 2.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
      drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { custom.offsetY += 2.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
      curY += 36;

      ctx.fillStyle = '#64748b';
      ctx.font = '900 9.5px "Rajdhani", sans-serif';
      ctx.fillText('DRAG TEAL HANDLE IN VIEWPORT', rightConsoleX + 14, curY + 10);
      ctx.fillText('FOR REAL-TIME POSITIONING', rightConsoleX + 14, curY + 26);
    } else if (state.studioSelectedDetail === 'scale_angle') {
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 11.5px "Rajdhani", sans-serif';
      ctx.fillText(`SCALE: ${custom.scale.toFixed(2)}x`, rightConsoleX + 14, curY + 4);
      drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { custom.scale = Math.max(0.3, custom.scale - 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
      drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { custom.scale = Math.min(3.0, custom.scale + 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
      curY += 36;

      const deg = Math.round(custom.angleOffset * (180 / Math.PI));
      ctx.fillText(`ROTATION: ${deg}°`, rightConsoleX + 14, curY + 4);
      drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { custom.angleOffset -= 0.05; saveWeaponCustomizations(); }, 22, 18, null, 2);
      drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { custom.angleOffset += 0.05; saveWeaponCustomizations(); }, 22, 18, null, 2);
      curY += 36;

      ctx.fillStyle = '#64748b';
      ctx.font = '900 9.5px "Rajdhani", sans-serif';
      ctx.fillText('DRAG AMBER HANDLE IN VIEWPORT', rightConsoleX + 14, curY + 10);
      ctx.fillText('FOR REAL-TIME ROTATION & SCALE', rightConsoleX + 14, curY + 26);
    } else if (state.studioSelectedDetail === 'proportions') {
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 11.5px "Rajdhani", sans-serif';
      const curW = custom.widthScale ?? 1.0;
      const curL = custom.lengthScale ?? 1.0;
      ctx.fillText(`WIDTH: ${curW.toFixed(2)}x`, rightConsoleX + 14, curY + 4);
      drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { custom.widthScale = Math.max(0.3, (custom.widthScale ?? 1.0) - 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
      drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { custom.widthScale = Math.min(3.0, (custom.widthScale ?? 1.0) + 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
      curY += 36;

      ctx.fillText(`LENGTH: ${curL.toFixed(2)}x`, rightConsoleX + 14, curY + 4);
      drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { custom.lengthScale = Math.max(0.3, (custom.lengthScale ?? 1.0) - 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
      drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { custom.lengthScale = Math.min(3.0, (custom.lengthScale ?? 1.0) + 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
      curY += 36;

      ctx.fillStyle = '#64748b';
      ctx.font = '900 9.5px "Rajdhani", sans-serif';
      ctx.fillText('DRAG GREEN (LEN) / CYAN (WIDTH)', rightConsoleX + 14, curY + 10);
      ctx.fillText('HANDLES FOR REAL-TIME PROPORTIONS', rightConsoleX + 14, curY + 26);
    }
  } else if (activeWeaponKey === 'zenitsu') {
    ctx.fillText('ZENITSU KATANA //', leftConsoleX + 14, consoleY + 12);
    ctx.fillText('PART CALIBRATION //', rightConsoleX + 14, consoleY + 12);

    if (state.studioZenitsuPart === undefined || !['overall', 'hands'].includes(state.studioZenitsuPart)) {
      state.studioZenitsuPart = 'overall';
    }

    const zenitsuParts = [
      { id: 'overall', label: '[ALL] KATANA', desc: 'Position, scale, angle, length & width' },
      { id: 'hands', label: 'HANDS GRIP', desc: 'Two-hand grip, spacing & size' }
    ];

    zenitsuParts.forEach((part, idx) => {
      const cardY = consoleY + 34 + idx * 56;
      const cardW = leftConsoleW - 24;
      const cardH = 48;
      const cardX = leftConsoleX + 12;
      const isSelected = (state.studioZenitsuPart === part.id);

      ctx.save();
      if (isSelected) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
      } else {
        ctx.fillStyle = 'rgba(18, 22, 32, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
        ctx.lineWidth = 1;
      }
      drawChamferedRect(ctx, cardX, cardY, cardW, cardH, 5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
      ctx.font = '900 11px "Rajdhani", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(part.label, cardX + 10, cardY + 9);

      ctx.fillStyle = isSelected ? '#f59e0b' : '#64748b';
      ctx.font = '900 8.5px "Rajdhani", sans-serif';
      ctx.fillText(part.desc, cardX + 10, cardY + 26);

      _registerButton(cardX, cardY, cardW, cardH, () => {
        state.studioZenitsuPart = part.id;
        state.studioSelectedDetail = part.id === 'overall' ? 'proportions' : 'position';
      });
    });

    // Right Console Metrics for Zenitsu
    const activePartKey = state.studioZenitsuPart || 'overall';
    const zenitsuCustom = state.weaponCustomizations.zenitsu;
    if (!zenitsuCustom.parts) zenitsuCustom.parts = {};
    if (!zenitsuCustom.parts.hands) {
      zenitsuCustom.parts.hands = { offsetX: 0, offsetY: 0, scale: 1.0, spacing: 1.0 };
    }
    const targetObj = (activePartKey === 'overall') ? zenitsuCustom : zenitsuCustom.parts.hands;

    let curY = consoleY + 34;

    if (activePartKey === 'hands') {
      // Hands modes: POS & SIZE
      const modeW = Math.floor((rightConsoleW - 36) / 2);
      const isPosMode = (state.studioSelectedDetail === 'position');
      const isSizeMode = (state.studioSelectedDetail === 'hands_size' || state.studioSelectedDetail === 'scale_angle');

      drawButton('📍 POS', rightConsoleX + 14 + modeW / 2, curY + 10, () => {
        state.studioSelectedDetail = 'position';
      }, modeW, 22, isPosMode ? '#f59e0b' : null, 3);

      drawButton('📐 SIZE & SPACING', rightConsoleX + 22 + modeW + modeW / 2, curY + 10, () => {
        state.studioSelectedDetail = 'hands_size';
      }, modeW, 22, isSizeMode ? '#f59e0b' : null, 3);

      curY += 40;

      if (isPosMode) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 11.5px "Rajdhani", sans-serif';
        ctx.fillText(`OFFSET X: ${Math.round(targetObj.offsetX || 0)}px`, rightConsoleX + 14, curY + 4);
        drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { targetObj.offsetX = (targetObj.offsetX || 0) - 1.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
        drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { targetObj.offsetX = (targetObj.offsetX || 0) + 1.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
        curY += 36;

        ctx.fillText(`OFFSET Y: ${Math.round(targetObj.offsetY || 0)}px`, rightConsoleX + 14, curY + 4);
        drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { targetObj.offsetY = (targetObj.offsetY || 0) - 1.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
        drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { targetObj.offsetY = (targetObj.offsetY || 0) + 1.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
        curY += 36;

        ctx.fillStyle = '#64748b';
        ctx.font = '900 9.5px "Rajdhani", sans-serif';
        ctx.fillText('NUDGE HANDS ALONG KATANA TSUKA', rightConsoleX + 14, curY + 10);
        ctx.fillText('FOR PERFECT TWO-HAND GRIP ALIGNMENT', rightConsoleX + 14, curY + 26);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 11.5px "Rajdhani", sans-serif';
        const hScale = targetObj.scale ?? 1.0;
        ctx.fillText(`HAND SIZE: ${hScale.toFixed(2)}x`, rightConsoleX + 14, curY + 4);
        drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { targetObj.scale = Math.max(0.3, (targetObj.scale ?? 1.0) - 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
        drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { targetObj.scale = Math.min(2.5, (targetObj.scale ?? 1.0) + 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
        curY += 36;

        const hSpacing = targetObj.spacing ?? 1.0;
        ctx.fillText(`GRIP SPACING: ${hSpacing.toFixed(2)}x`, rightConsoleX + 14, curY + 4);
        drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { targetObj.spacing = Math.max(0.2, (targetObj.spacing ?? 1.0) - 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
        drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { targetObj.spacing = Math.min(2.5, (targetObj.spacing ?? 1.0) + 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
        curY += 36;

        ctx.fillStyle = '#64748b';
        ctx.font = '900 9.5px "Rajdhani", sans-serif';
        ctx.fillText('ADJUST HAND PROPORTIONS & DISTANCE', rightConsoleX + 14, curY + 10);
        ctx.fillText('BETWEEN REAR AND LEAD HANDS', rightConsoleX + 14, curY + 26);
      }
    } else {
      // General parts & overall: POS, ROT, PROP
      const modeW = Math.floor((rightConsoleW - 44) / 3);
      const isPosMode = (state.studioSelectedDetail === 'position');
      const isScaleMode = (state.studioSelectedDetail === 'scale_angle');
      const isPropMode = (state.studioSelectedDetail === 'proportions');

      drawButton('📍 POS', rightConsoleX + 14 + modeW / 2, curY + 10, () => {
        state.studioSelectedDetail = 'position';
      }, modeW, 22, isPosMode ? '#f59e0b' : null, 3);

      drawButton('📐 ROT', rightConsoleX + 22 + modeW + modeW / 2, curY + 10, () => {
        state.studioSelectedDetail = 'scale_angle';
      }, modeW, 22, isScaleMode ? '#f59e0b' : null, 3);

      drawButton('📏 SIZE', rightConsoleX + 30 + modeW * 2 + modeW / 2, curY + 10, () => {
        state.studioSelectedDetail = 'proportions';
      }, modeW, 22, isPropMode ? '#f59e0b' : null, 3);

      curY += 40;

      if (isPosMode) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 11.5px "Rajdhani", sans-serif';
        ctx.fillText(`OFFSET X: ${Math.round(targetObj.offsetX || 0)}px`, rightConsoleX + 14, curY + 4);
        drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { targetObj.offsetX = (targetObj.offsetX || 0) - 1.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
        drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { targetObj.offsetX = (targetObj.offsetX || 0) + 1.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
        curY += 36;

        ctx.fillText(`OFFSET Y: ${Math.round(targetObj.offsetY || 0)}px`, rightConsoleX + 14, curY + 4);
        drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { targetObj.offsetY = (targetObj.offsetY || 0) - 1.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
        drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { targetObj.offsetY = (targetObj.offsetY || 0) + 1.0; saveWeaponCustomizations(); }, 22, 18, null, 2);
        curY += 36;

        ctx.fillStyle = '#64748b';
        ctx.font = '900 9.5px "Rajdhani", sans-serif';
        ctx.fillText('DRAG TEAL HANDLE IN VIEWPORT', rightConsoleX + 14, curY + 10);
        ctx.fillText('FOR REAL-TIME POSITIONING', rightConsoleX + 14, curY + 26);
      } else if (isScaleMode) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 11.5px "Rajdhani", sans-serif';
        const curScale = targetObj.scale ?? 1.0;
        ctx.fillText(`SCALE: ${curScale.toFixed(2)}x`, rightConsoleX + 14, curY + 4);
        drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { targetObj.scale = Math.max(0.2, (targetObj.scale ?? 1.0) - 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
        drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { targetObj.scale = Math.min(3.0, (targetObj.scale ?? 1.0) + 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
        curY += 36;

        const deg = Math.round((targetObj.angleOffset || 0) * (180 / Math.PI));
        ctx.fillText(`ROTATION: ${deg}°`, rightConsoleX + 14, curY + 4);
        drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { targetObj.angleOffset = (targetObj.angleOffset || 0) - 0.05; saveWeaponCustomizations(); }, 22, 18, null, 2);
        drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { targetObj.angleOffset = (targetObj.angleOffset || 0) + 0.05; saveWeaponCustomizations(); }, 22, 18, null, 2);
        curY += 36;

        ctx.fillStyle = '#64748b';
        ctx.font = '900 9.5px "Rajdhani", sans-serif';
        ctx.fillText('DRAG AMBER HANDLE IN VIEWPORT', rightConsoleX + 14, curY + 10);
        ctx.fillText('FOR REAL-TIME ROTATION & SCALE', rightConsoleX + 14, curY + 26);
      } else if (isPropMode) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 11.5px "Rajdhani", sans-serif';
        const curW = targetObj.widthScale ?? 1.0;
        ctx.fillText(`WIDTH: ${curW.toFixed(2)}x`, rightConsoleX + 14, curY + 4);
        drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { targetObj.widthScale = Math.max(0.2, (targetObj.widthScale ?? 1.0) - 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
        drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { targetObj.widthScale = Math.min(3.5, (targetObj.widthScale ?? 1.0) + 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
        curY += 36;

        const curL = targetObj.lengthScale ?? 1.0;
        ctx.fillText(`LENGTH: ${curL.toFixed(2)}x`, rightConsoleX + 14, curY + 4);
        drawButton('−', rightConsoleX + rightConsoleW - 54, curY + 8, () => { targetObj.lengthScale = Math.max(0.2, (targetObj.lengthScale ?? 1.0) - 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
        drawButton('+', rightConsoleX + rightConsoleW - 26, curY + 8, () => { targetObj.lengthScale = Math.min(3.5, (targetObj.lengthScale ?? 1.0) + 0.05); saveWeaponCustomizations(); }, 22, 18, null, 2);
        curY += 36;

        ctx.fillStyle = '#64748b';
        ctx.font = '900 9.5px "Rajdhani", sans-serif';
        ctx.fillText('ADJUST THICKNESS & LENGTH', rightConsoleX + 14, curY + 10);
        ctx.fillText('OF THE SELECTED COMPONENT', rightConsoleX + 14, curY + 26);
      }
    }
  } else {
    // Non-Mahito / Non-CJ Weapons Console (Zero dead empty panel & zero overlapping SAVE DEFAULT button)
    ctx.fillText('CALIBRATION MODE //', leftConsoleX + 14, consoleY + 12);
    ctx.fillText('TRANSFORM METRICS //', rightConsoleX + 14, consoleY + 12);

    if (!['position', 'scale_angle', 'proportions'].includes(state.studioSelectedDetail)) {
      state.studioSelectedDetail = 'position';
    }

    const detailOptions = [
      { id: 'position', label: 'POSITION (X, Y)', desc: 'Translate weapon grip point' },
      { id: 'scale_angle', label: 'SCALE & ROTATION', desc: 'Adjust size & tilt angle' },
      { id: 'proportions', label: 'PROPORTIONS (W, L)', desc: 'Adjust width & length' }
    ];

    detailOptions.forEach((opt, idx) => {
      const cardY = consoleY + 34 + idx * 58;
      const cardW = leftConsoleW - 24;
      const cardH = 50;
      const cardX = leftConsoleX + 12;
      const isSelected = state.studioSelectedDetail === opt.id;

      ctx.save();
      if (isSelected) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.20)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
      } else {
        ctx.fillStyle = 'rgba(18, 22, 32, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
        ctx.lineWidth = 1;
      }
      drawChamferedRect(ctx, cardX, cardY, cardW, cardH, 5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
      ctx.font = '900 11px "Rajdhani", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(opt.label, cardX + 10, cardY + 9);

      ctx.fillStyle = '#64748b';
      ctx.font = '900 8.5px "Rajdhani", sans-serif';
      ctx.fillText(opt.desc, cardX + 10, cardY + 27);

      _registerButton(cardX, cardY, cardW, cardH, () => {
        state.studioSelectedDetail = opt.id;
      });
    });

    const custom = state.weaponCustomizations[activeWeaponKey];
    let curY = consoleY + 34;
    const rowX = rightConsoleX + 12;
    const rowW = rightConsoleW - 24;

    if (state.studioSelectedDetail === 'position') {
      curY = _drawStepperRow(
        ctx, rowX, curY, rowW,
        `OFFSET X: ${Math.round(custom.offsetX || 0)}px`,
        () => { custom.offsetX = (custom.offsetX || 0) - 5; saveWeaponCustomizations(); },
        () => { custom.offsetX = (custom.offsetX || 0) - 1; saveWeaponCustomizations(); },
        () => { custom.offsetX = (custom.offsetX || 0) + 1; saveWeaponCustomizations(); },
        () => { custom.offsetX = (custom.offsetX || 0) + 5; saveWeaponCustomizations(); }
      );
      curY = _drawStepperRow(
        ctx, rowX, curY, rowW,
        `OFFSET Y: ${Math.round(custom.offsetY || 0)}px`,
        () => { custom.offsetY = (custom.offsetY || 0) - 5; saveWeaponCustomizations(); },
        () => { custom.offsetY = (custom.offsetY || 0) - 1; saveWeaponCustomizations(); },
        () => { custom.offsetY = (custom.offsetY || 0) + 1; saveWeaponCustomizations(); },
        () => { custom.offsetY = (custom.offsetY || 0) + 5; saveWeaponCustomizations(); }
      );
    } else if (state.studioSelectedDetail === 'scale_angle') {
      const curScale = custom.scale ?? 1.0;
      const deg = Math.round((custom.angleOffset || 0) * (180 / Math.PI));
      curY = _drawStepperRow(
        ctx, rowX, curY, rowW,
        `SCALE: ${curScale.toFixed(2)}x`,
        () => { custom.scale = Math.max(0.3, Number((curScale - 0.10).toFixed(2))); saveWeaponCustomizations(); },
        () => { custom.scale = Math.max(0.3, Number((curScale - 0.02).toFixed(2))); saveWeaponCustomizations(); },
        () => { custom.scale = Math.min(3.0, Number((curScale + 0.02).toFixed(2))); saveWeaponCustomizations(); },
        () => { custom.scale = Math.min(3.0, Number((curScale + 0.10).toFixed(2))); saveWeaponCustomizations(); }
      );
      curY = _drawStepperRow(
        ctx, rowX, curY, rowW,
        `ROTATION: ${deg}°`,
        () => { custom.angleOffset = (custom.angleOffset || 0) - 0.1745; saveWeaponCustomizations(); },
        () => { custom.angleOffset = (custom.angleOffset || 0) - 0.0349; saveWeaponCustomizations(); },
        () => { custom.angleOffset = (custom.angleOffset || 0) + 0.0349; saveWeaponCustomizations(); },
        () => { custom.angleOffset = (custom.angleOffset || 0) + 0.1745; saveWeaponCustomizations(); }
      );
    } else {
      const curW = custom.widthScale ?? 1.0;
      const curL = custom.lengthScale ?? 1.0;
      curY = _drawStepperRow(
        ctx, rowX, curY, rowW,
        `WIDTH: ${curW.toFixed(2)}x`,
        () => { custom.widthScale = Math.max(0.3, Number((curW - 0.10).toFixed(2))); saveWeaponCustomizations(); },
        () => { custom.widthScale = Math.max(0.3, Number((curW - 0.02).toFixed(2))); saveWeaponCustomizations(); },
        () => { custom.widthScale = Math.min(3.0, Number((curW + 0.02).toFixed(2))); saveWeaponCustomizations(); },
        () => { custom.widthScale = Math.min(3.0, Number((curW + 0.10).toFixed(2))); saveWeaponCustomizations(); }
      );
      curY = _drawStepperRow(
        ctx, rowX, curY, rowW,
        `LENGTH: ${curL.toFixed(2)}x`,
        () => { custom.lengthScale = Math.max(0.3, Number((curL - 0.10).toFixed(2))); saveWeaponCustomizations(); },
        () => { custom.lengthScale = Math.max(0.3, Number((curL - 0.02).toFixed(2))); saveWeaponCustomizations(); },
        () => { custom.lengthScale = Math.min(3.0, Number((curL + 0.02).toFixed(2))); saveWeaponCustomizations(); },
        () => { custom.lengthScale = Math.min(3.0, Number((curL + 0.10).toFixed(2))); saveWeaponCustomizations(); }
      );
    }

    // Live Calibration Metrics Telemetry Footer
    const sDeg = Math.round((custom.angleOffset || 0) * (180 / Math.PI));
    ctx.save();
    ctx.fillStyle = 'rgba(12, 16, 24, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    drawChamferedRect(ctx, rowX, curY + 4, rowW, 56, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 9.5px "Rajdhani", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`LIVE TELEMETRY // ${activeWeaponKey.toUpperCase()}`, rowX + 10, curY + 12);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`POS: (${Math.round(custom.offsetX || 0)}, ${Math.round(custom.offsetY || 0)})  |  SCALE: ${(custom.scale ?? 1).toFixed(2)}x  |  ROT: ${sDeg}°`, rowX + 10, curY + 27);
    ctx.fillText(`PROPORTION: ${(custom.widthScale ?? 1).toFixed(2)}x W  ×  ${(custom.lengthScale ?? 1).toFixed(2)}x L`, rowX + 10, curY + 41);
    ctx.restore();
  }

  // ── Tier 4: Bottom Action Deck (Single Clean Save Button — No Duplicate Header Overlay) ──
  const bottomY = canvas.height - 26;
  const actionBtnH = 26;

  drawButton('🔄 RESET', 60, bottomY, () => {
    if (confirm(`Reset ${activeWeaponKey.toUpperCase()} customizations to saved default?`)) {
      resetWeaponToDefault(activeWeaponKey, false);
      _weaponToastText = `✓ RESET ${activeWeaponKey.toUpperCase()} TO SAVED DEFAULT!`;
      _weaponToastTimer = 90;
    }
  }, 88, actionBtnH, '#ef4444', 4);

  drawButton('🏭 FACTORY', 158, bottomY, () => {
    if (confirm(`Restore factory calibrated code database default for ${activeWeaponKey.toUpperCase()}?`)) {
      resetWeaponToDefault(activeWeaponKey, true);
      _weaponToastText = `✓ RESTORED ${activeWeaponKey.toUpperCase()} FACTORY PRESET!`;
      _weaponToastTimer = 90;
    }
  }, 94, actionBtnH, '#f59e0b', 4);

  drawButton('💾 SAVE DEFAULT', 288, bottomY, () => {
    const custom = state.weaponCustomizations[activeWeaponKey];
    setWeaponCustomAsDefault(activeWeaponKey, custom);
    _weaponToastText = `✓ SAVED ${activeWeaponKey.toUpperCase()} AS PROJECT DEFAULT!`;
    _weaponToastTimer = 90;
  }, 148, actionBtnH, '#10b981', 4);

  drawButton('⌂ MENU', 446, bottomY, () => {
    state.gameState = 'title';
  }, 116, actionBtnH, null, 4);

  // ── Tier 5: Weapon Roster Picker Modal Overlay ──
  _drawWeaponRosterModal(ctx, canvas, activeWeaponKey, themeColor);
}

// ─────────────────────────────────────────────
// mouse down, move, up event listeners
// ─────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('resize', invalidateCachedTargetRect);
  window.addEventListener('scroll', invalidateCachedTargetRect, { passive: true });

  const eventTarget = state.pixiApp ? state.pixiApp.view : state.canvas;
  if (eventTarget && typeof eventTarget.addEventListener === 'function') {
    eventTarget.addEventListener('mousedown', (e) => {
      if (state.gameState !== 'weaponStudio' || state.studioWeaponModalOpen || state.studioSelectedDetail === null) return;

      invalidateCachedTargetRect();
      const rect = getCachedTargetRect(eventTarget);
      const scaleX = state.canvas.width / (rect.width || state.canvas.width);
      const scaleY = state.canvas.height / (rect.height || state.canvas.height);
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const currentScale = state.studioPreviewScale;
      const heroY = VIEWPORT_Y + VIEWPORT_H / 2;
      const activeWeaponKey = state.studioSelectedWeapon;

      // Convert mouse position to local hero display space
      const localX = (mx - state.canvas.width / 2) / currentScale;
      const localY = (my - heroY) / currentScale;

      if (activeWeaponKey === 'mahito') {
        if (state.studioSelectedDetail !== 'finger') return;
        const handX = 25;
        const blades = state.weaponCustomizations.mahito.blades;
        const i = state.studioClawFinger;
        const b = blades[i];
        if (!b) return;

        const kx = handX + b.knuckleX;
        const ky = b.knuckleY;

        const cosAngle = Math.cos(b.fanAngle);
        const sinAngle = Math.sin(b.fanAngle);
        const tx = handX + b.knuckleX + b.length * cosAngle - b.tipY * sinAngle;
        const ty = b.knuckleY + b.length * sinAngle + b.tipY * cosAngle;

        // Knuckle click check
        if (Math.hypot(localX - kx, localY - ky) < 14) {
          activeDragFinger = i;
          activeDragType = 'knuckle';
          return;
        }

        // Tip click check
        if (Math.hypot(localX - tx, localY - ty) < 14) {
          activeDragFinger = i;
          activeDragType = 'tip';
          return;
        }
      } else if (activeWeaponKey === 'zenitsu') {
        const custom = state.weaponCustomizations.zenitsu;
        const partKey = state.studioZenitsuPart || 'overall';
        const isHands = (partKey === 'hands');
        const target = isHands ? (custom.parts?.hands || custom) : custom;

        const baseAnchorX = isHands ? -33.5 : -18;
        const baseLx = baseAnchorX + custom.offsetX + (isHands ? (target.offsetX || 0) : 0);
        const baseLy = custom.offsetY + (isHands ? (target.offsetY || 0) : 0);

        if (state.studioSelectedDetail === 'position') {
          if (Math.hypot(localX - baseLx, localY - baseLy) < 16) {
            isDraggingBase = true;
            return;
          }
        } else if (state.studioSelectedDetail === 'scale_angle' || state.studioSelectedDetail === 'hands_size') {
          const lineLen = isHands ? 30 : 65;
          const curScale = target.scale ?? 1.0;
          const curAngle = isHands ? 0 : (target.angleOffset ?? 0);
          const tipLx = baseLx + lineLen * curScale * Math.cos(curAngle);
          const tipLy = baseLy + lineLen * curScale * Math.sin(curAngle);
          if (Math.hypot(localX - tipLx, localY - tipLy) < 16) {
            isDraggingTip = true;
            activeDragType = 'tip';
            return;
          }
        } else if (state.studioSelectedDetail === 'proportions') {
          const lineLen = 65 * (target.scale ?? 1.0) * (target.lengthScale ?? 1.0);
          const widthLen = 18 * (target.scale ?? 1.0) * (target.widthScale ?? 1.0);
          const cosA = Math.cos(target.angleOffset || 0);
          const sinA = Math.sin(target.angleOffset || 0);

          const lenLx = baseLx + lineLen * cosA;
          const lenLy = baseLy + lineLen * sinA;
          const widthLx = baseLx - widthLen * sinA;
          const widthLy = baseLy + widthLen * cosA;

          if (Math.hypot(localX - lenLx, localY - lenLy) < 16) {
            isDraggingTip = true;
            activeDragType = 'length';
            return;
          }
          if (Math.hypot(localX - widthLx, localY - widthLy) < 16) {
            isDraggingTip = true;
            activeDragType = 'width';
            return;
          }
        }
      } else {
        const custom = (activeWeaponKey === 'toji')
          ? _getActiveTojiCustom()
          : state.weaponCustomizations[activeWeaponKey];
        let offsetX = -40;
        if (activeWeaponKey === 'cronos') offsetX = -55;
        else if (activeWeaponKey === 'ruby') offsetX = -75;
        else if (activeWeaponKey === 'escanor') offsetX = -40;
        else if (activeWeaponKey === 'rubbick' || activeWeaponKey === 'uryu') offsetX = 0;

        const baseLx = offsetX + custom.offsetX;
        const baseLy = custom.offsetY;

        if (state.studioSelectedDetail === 'position') {
          // Grip anchor check
          if (Math.hypot(localX - baseLx, localY - baseLy) < 14) {
            isDraggingBase = true;
            return;
          }
        } else if (state.studioSelectedDetail === 'scale_angle') {
          const lineLen = 70;
          const tipLx = baseLx + lineLen * custom.scale * Math.cos(custom.angleOffset);
          const tipLy = baseLy + lineLen * custom.scale * Math.sin(custom.angleOffset);

          // Tip handle check
          if (Math.hypot(localX - tipLx, localY - tipLy) < 14) {
            isDraggingTip = true;
            activeDragType = 'tip';
            return;
          }
        } else if (state.studioSelectedDetail === 'proportions') {
          const lineLen = 70 * (custom.scale ?? 1.0) * (custom.lengthScale ?? 1.0);
          const widthLen = 28 * (custom.scale ?? 1.0) * (custom.widthScale ?? 1.0);
          const cosA = Math.cos(custom.angleOffset || 0);
          const sinA = Math.sin(custom.angleOffset || 0);

          const lenLx = baseLx + lineLen * cosA;
          const lenLy = baseLy + lineLen * sinA;
          const widthLx = baseLx - widthLen * sinA;
          const widthLy = baseLy + widthLen * cosA;

          if (Math.hypot(localX - lenLx, localY - lenLy) < 14) {
            isDraggingTip = true;
            activeDragType = 'length';
            return;
          }
          if (Math.hypot(localX - widthLx, localY - widthLy) < 14) {
            isDraggingTip = true;
            activeDragType = 'width';
            return;
          }
        }
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (state.gameState !== 'weaponStudio' || state.studioWeaponModalOpen || state.studioSelectedDetail === null) return;
      const isDraggingMahito = (activeDragFinger >= 0 && state.studioSelectedDetail === 'finger');
      const isDraggingNormal = isDraggingBase || isDraggingTip;
      if (!isDraggingMahito && !isDraggingNormal) return;

      const rect = getCachedTargetRect(eventTarget);
      const scaleX = state.canvas.width / (rect.width || state.canvas.width);
      const scaleY = state.canvas.height / (rect.height || state.canvas.height);
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const currentScale = state.studioPreviewScale;
      const heroY = VIEWPORT_Y + VIEWPORT_H / 2;
      const activeWeaponKey = state.studioSelectedWeapon;

      const localX = (mx - state.canvas.width / 2) / currentScale;
      const localY = (my - heroY) / currentScale;

      if (activeWeaponKey === 'mahito') {
        if (activeDragFinger < 0 || state.studioSelectedDetail !== 'finger') return;
        const handX = 25;
        const b = state.weaponCustomizations.mahito.blades[activeDragFinger];

        if (activeDragType === 'knuckle') {
          b.knuckleX = localX - handX;
          b.knuckleY = localY;
        } else if (activeDragType === 'tip') {
          const dx = localX - (handX + b.knuckleX);
          const dy = localY - b.knuckleY;
          b.length = Math.max(15, Math.hypot(dx, dy));
          b.fanAngle = Math.atan2(dy, dx);
        }
      } else if (activeWeaponKey === 'zenitsu') {
        const custom = state.weaponCustomizations.zenitsu;
        const partKey = state.studioZenitsuPart || 'overall';
        const isHands = (partKey === 'hands');
        const target = isHands ? (custom.parts?.hands || custom) : custom;
        const baseAnchorX = isHands ? -33.5 : -18;

        if (isDraggingBase && state.studioSelectedDetail === 'position') {
          if (partKey === 'overall') {
            custom.offsetX = localX - baseAnchorX;
            custom.offsetY = localY;
          } else {
            target.offsetX = localX - (baseAnchorX + custom.offsetX);
            target.offsetY = localY - custom.offsetY;
          }
        } else if (isDraggingTip && (state.studioSelectedDetail === 'scale_angle' || state.studioSelectedDetail === 'hands_size')) {
          const parentX = baseAnchorX + custom.offsetX + (isHands ? (target.offsetX || 0) : 0);
          const parentY = custom.offsetY + (isHands ? (target.offsetY || 0) : 0);
          const dx = localX - parentX;
          const dy = localY - parentY;
          const lineLen = isHands ? 30 : 65;
          target.scale = Math.max(0.2, Math.hypot(dx, dy) / lineLen);
          if (!isHands) {
            target.angleOffset = Math.atan2(dy, dx);
          }
        } else if (isDraggingTip && state.studioSelectedDetail === 'proportions') {
          const parentX = baseAnchorX + custom.offsetX;
          const parentY = custom.offsetY;
          const dx = localX - parentX;
          const dy = localY - parentY;
          const angle = target.angleOffset || 0;
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);
          const scale = Math.max(0.2, target.scale ?? 1.0);

          if (activeDragType === 'length') {
            const projLen = dx * cosA + dy * sinA;
            target.lengthScale = Math.max(0.2, Math.min(3.5, projLen / (65 * scale)));
          } else if (activeDragType === 'width') {
            const projWidth = -dx * sinA + dy * cosA;
            target.widthScale = Math.max(0.2, Math.min(3.5, Math.abs(projWidth) / (18 * scale)));
          }
        }
      } else {
        const custom = (activeWeaponKey === 'toji')
          ? _getActiveTojiCustom()
          : state.weaponCustomizations[activeWeaponKey];
        let offsetX = -40;
        if (activeWeaponKey === 'cronos') offsetX = -55;
        else if (activeWeaponKey === 'ruby') offsetX = -75;
        else if (activeWeaponKey === 'escanor') offsetX = -40;
        else if (activeWeaponKey === 'rubbick' || activeWeaponKey === 'uryu') offsetX = 0;

        if (isDraggingBase && state.studioSelectedDetail === 'position') {
          custom.offsetX = localX - offsetX;
          custom.offsetY = localY;
        } else if (isDraggingTip && state.studioSelectedDetail === 'scale_angle') {
          const dx = localX - (offsetX + custom.offsetX);
          const dy = localY - custom.offsetY;
          const lineLen = 70;
          custom.scale = Math.max(0.3, Math.hypot(dx, dy) / lineLen);
          custom.angleOffset = Math.atan2(dy, dx);
        } else if (isDraggingTip && state.studioSelectedDetail === 'proportions') {
          const dx = localX - (offsetX + custom.offsetX);
          const dy = localY - custom.offsetY;
          const cosA = Math.cos(custom.angleOffset || 0);
          const sinA = Math.sin(custom.angleOffset || 0);
          const scale = Math.max(0.2, custom.scale ?? 1.0);

          if (activeDragType === 'length') {
            const projLen = dx * cosA + dy * sinA;
            custom.lengthScale = Math.max(0.2, Math.min(3.5, projLen / (70 * scale)));
          } else if (activeDragType === 'width') {
            const projWidth = -dx * sinA + dy * cosA;
            custom.widthScale = Math.max(0.2, Math.min(3.5, Math.abs(projWidth) / (28 * scale)));
          }
        }
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDraggingBase || isDraggingTip || activeDragFinger >= 0) {
        saveWeaponCustomizations();
      }
      isDraggingBase = false;
      isDraggingTip = false;
      activeDragFinger = -1;
      activeDragType = null;
    });

    // Mouse Wheel Zoom
    eventTarget.addEventListener('wheel', (e) => {
      if (state.gameState !== 'weaponStudio' || state.studioWeaponModalOpen) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP * 0.5 : ZOOM_STEP * 0.5;
      state.studioPreviewScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, state.studioPreviewScale + delta));
    }, { passive: false });
  }
}
