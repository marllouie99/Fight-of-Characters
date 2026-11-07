// ─────────────────────────────────────────────
// PERK DRAFT MODAL (Roguelite Blessing Selection)
// Renders an authentic 3-card blessing draft between rounds
// when CONFIG.enableMatchPerks is active.
// Follows Rule 35 (Zero per-frame allocations, 100% Canvas 2D stack integrity).
// ─────────────────────────────────────────────

import { state } from '../../core/state.js';
import { drawChamferedRect, drawPanel, wrapText } from './uiFramework.js';
import { drawScreentoneModalBackdrop } from './mangaScreentone.js';
import { getRandomPerkDraft, applyPerkToFighter } from '../../systems/perkSystem.js';
import { triggerHaptic } from '../../systems/mobileAppBridge.js';

let _isOpen = false;
let _targetFighter = null;
let _currentDraft = [];
let _onCompleteCallback = null;
let _hoveredIndex = -1;

const _cardBounds = [
  { x: 0, y: 0, w: 0, h: 0 },
  { x: 0, y: 0, w: 0, h: 0 },
  { x: 0, y: 0, w: 0, h: 0 }
];

export function isPerkDraftModalOpen() {
  return _isOpen;
}

/**
 * Opens the 3-card blessing draft modal
 * @param {Object} fighter Target fighter (usually Player 1)
 * @param {Function} onComplete Callback invoked when a perk is drafted
 */
export function openPerkDraftModal(fighter, onComplete) {
  _isOpen = true;
  _targetFighter = fighter || (state.fighters && state.fighters[0]);
  _currentDraft = getRandomPerkDraft(3);
  _onCompleteCallback = onComplete;
  _hoveredIndex = -1;
  triggerHaptic('selection');
}

export function closePerkDraftModal() {
  _isOpen = false;
  _targetFighter = null;
  _currentDraft = [];
  _hoveredIndex = -1;
  if (state.canvas) {
    state.canvas.style.cursor = 'default';
  }
}

/**
 * Handles clicks/taps on the draft cards
 */
export function handlePerkDraftClick(mx, my) {
  if (!_isOpen) return false;

  for (let i = 0; i < _cardBounds.length; i++) {
    const b = _cardBounds[i];
    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
      const selectedPerk = _currentDraft[i];
      if (selectedPerk && _targetFighter) {
        applyPerkToFighter(_targetFighter, selectedPerk.id);
        triggerHaptic('success');
      }

      const cb = _onCompleteCallback;
      closePerkDraftModal();
      if (typeof cb === 'function') {
        cb(selectedPerk);
      }
      return true;
    }
  }
  return false;
}

/**
 * Handles pointer hovering
 */
export function handlePerkDraftMouseMove(mx, my) {
  if (!_isOpen) return false;

  let hovered = -1;
  for (let i = 0; i < _cardBounds.length; i++) {
    const b = _cardBounds[i];
    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
      hovered = i;
      break;
    }
  }

  if (hovered !== _hoveredIndex) {
    _hoveredIndex = hovered;
    if (_hoveredIndex >= 0) triggerHaptic('selection');
    if (state.canvas) {
      state.canvas.style.cursor = (_hoveredIndex >= 0) ? 'pointer' : 'default';
    }
  }
  return _hoveredIndex >= 0;
}

/**
 * Main draw routine for the Perk Draft Modal
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawPerkDraftModal(ctx) {
  if (!_isOpen || _currentDraft.length === 0) return;

  const canvasW = ctx.canvas.width;
  const canvasH = ctx.canvas.height;

  // 1. Full-screen dark screentone backdrop
  drawScreentoneModalBackdrop(ctx, canvasW, canvasH, 0.78);

  const panelW = Math.min(canvasW - 36, 380);
  const panelH = 390;
  const cx = canvasW / 2;
  const cy = canvasH / 2;
  const px = cx - panelW / 2;
  const py = cy - panelH / 2;

  ctx.save();

  // 2. Main Manga Ink Window
  drawPanel(px, py, panelW, panelH, 0.96, 4, '#0E0F14');

  // Title Header
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#0E0F14';
  ctx.lineWidth = 2;
  ctx.font = '900 18px "Outfit", "Rajdhani", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏆 ROUND VICTORY!', Math.round(cx), Math.round(py + 26));

  // Subtitle
  ctx.fillStyle = '#00F5D4';
  ctx.font = '900 10px "Rajdhani", monospace';
  ctx.fillText('SELECT 1 OF 3 ENHANCEMENTS FOR NEXT ROUND', Math.round(cx), Math.round(py + 46));

  // 3. Render 3 Draft Cards
  const cardW = panelW - 40;
  const cardH = 86;
  const startCardY = py + 68;
  const cardGap = 12;

  for (let i = 0; i < _currentDraft.length; i++) {
    const perk = _currentDraft[i];
    const cardY = startCardY + i * (cardH + cardGap);
    const cardX = px + 20;

    _cardBounds[i] = { x: cardX, y: cardY, w: cardW, h: cardH };

    const isHovered = (_hoveredIndex === i);
    const borderColor = perk.color || '#00F5D4';

    // Card Box
    ctx.save();
    ctx.fillStyle = isHovered ? 'rgba(30, 38, 52, 0.98)' : 'rgba(18, 22, 30, 0.95)';
    ctx.strokeStyle = isHovered ? '#FFFFFF' : borderColor;
    ctx.lineWidth = isHovered ? 2.5 : 1.5;

    drawChamferedRect(ctx, cardX, cardY, cardW, cardH, 4);
    ctx.fill();
    ctx.stroke();

    // Left Icon Column
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(perk.icon, cardX + 32, cardY + cardH / 2);

    // Title & Tier
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 13px "Outfit", "Rajdhani", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(perk.name, cardX + 64, cardY + 14);

    // Tier Badge Pill
    const badgeW = 54;
    const badgeH = 16;
    const badgeX = cardX + cardW - badgeW - 12;
    const badgeY = cardY + 12;

    ctx.fillStyle = borderColor;
    drawChamferedRect(ctx, badgeX, badgeY, badgeW, badgeH, 3);
    ctx.fill();

    ctx.fillStyle = '#0E0F14';
    ctx.font = '900 8.5px "Rajdhani", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(perk.tier.toUpperCase(), badgeX + badgeW / 2, badgeY + badgeH / 2);

    // Description
    ctx.fillStyle = 'rgba(255, 255, 255, 0.80)';
    ctx.font = '600 10px "Outfit", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    wrapText(ctx, perk.desc, cardX + 64, cardY + 36, cardW - 76, 14);

    ctx.restore();
  }

  ctx.restore();
}

