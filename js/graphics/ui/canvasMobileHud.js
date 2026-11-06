import { state } from '../../core/state.js';
import { CONFIG } from '../../core/config.js';
import { GAME_MODES } from '../../core/modeConfig.js';
import { drawChamferedRect } from './uiFramework.js';
import { getSkillDataForFighter, shouldShowFighterSkill } from './hudSkillProviders.js';
import {
  getFighterDisplayName,
  getFighterThemeColor,
  drawComboCounter,
  drawCheatNotification,
  drawTagMatchRosterHUD
} from '../hudManager.js';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CANVAS MOBILE HUD MANAGER (Zero-DOM 60 FPS Native-Equivalent Combat HUD)
 * Bypasses all HTML DOM card layout thrashing on mobile browsers/apps by
 * rendering health bars, skill cooldown meters, and fighter identity directly
 * onto the 2D canvas via GPU-accelerated drawing calls (matching Weapon Ball Z
 * and Ball Fight League architecture).
 * ─────────────────────────────────────────────────────────────────────────────
 */

let _cachedHealthHud = null;
let _cachedTopContainer = null;
let _cachedHealthHudLeft = null;
let _cachedHealthHudRight = null;
let _lastSyncedHudMode = null;

// Ghost health bar interpolation tracker: fighter -> { ghostHp, holdTimer, lastTargetHp }
const _ghostHpTrackers = new WeakMap();

export function isMobileCanvasHudActive() {
  if (typeof state === 'undefined') return false;
  if (state.viewOrientation === 'horizontal') return false;
  if (CONFIG.mobileCanvasHudEnabled === true) return true;
  if (CONFIG.mobileCanvasHudEnabled === false) return false;
  return Boolean(state.isMobileDevice);
}

export function syncMobileDomHudVisibility(active) {
  if (typeof document === 'undefined') return;
  if (_lastSyncedHudMode === active) return;
  _lastSyncedHudMode = active;

  if (!_cachedHealthHud) _cachedHealthHud = document.getElementById('healthHud');
  if (!_cachedTopContainer) _cachedTopContainer = document.getElementById('hudTopContainer');
  if (!_cachedHealthHudLeft) _cachedHealthHudLeft = document.getElementById('healthHudLeft');
  if (!_cachedHealthHudRight) _cachedHealthHudRight = document.getElementById('healthHudRight');

  if (active) {
    if (_cachedHealthHud && _cachedHealthHud.style.display !== 'none') {
      _cachedHealthHud.style.display = 'none';
      _cachedHealthHud.style.visibility = 'hidden';
    }
    if (_cachedTopContainer && _cachedTopContainer.style.display !== 'none') {
      _cachedTopContainer.style.display = 'none';
      _cachedTopContainer.style.visibility = 'hidden';
    }
    if (_cachedHealthHudLeft && _cachedHealthHudLeft.style.display !== 'none') {
      _cachedHealthHudLeft.style.display = 'none';
      _cachedHealthHudLeft.style.visibility = 'hidden';
    }
    if (_cachedHealthHudRight && _cachedHealthHudRight.style.display !== 'none') {
      _cachedHealthHudRight.style.display = 'none';
      _cachedHealthHudRight.style.visibility = 'hidden';
    }
  } else {
    // Invalidate cached state key on DOM top container so hudManager cleanly restores DOM layout
    if (_cachedTopContainer) {
      _cachedTopContainer._hudStateKey = null;
      if (_cachedTopContainer.style.display === 'none') {
        _cachedTopContainer.style.display = '';
        _cachedTopContainer.style.visibility = '';
      }
    }
    if (_cachedHealthHud && _cachedHealthHud.style.display === 'none') {
      _cachedHealthHud.style.display = '';
      _cachedHealthHud.style.visibility = '';
    }
    if (_cachedHealthHudLeft && _cachedHealthHudLeft.style.display === 'none') {
      _cachedHealthHudLeft.style.display = '';
      _cachedHealthHudLeft.style.visibility = '';
    }
    if (_cachedHealthHudRight && _cachedHealthHudRight.style.display === 'none') {
      _cachedHealthHudRight.style.display = '';
      _cachedHealthHudRight.style.visibility = '';
    }
  }
}

function cleanSkillLabel(label) {
  if (!label) return '';
  return String(label)
    .replace(/<[^>]*>/g, '')
    .replace(/\s*\(\s*([\d\.]+\s*[sS]?|\d+\s*\/\s*\d+|ACTIVE|READY)\s*\)/gi, '')
    .trim();
}

function resolveSkillStatus(s, fighter) {
  if (!s) return { text: 'READY', isReady: true, isActive: false };
  if (s.active) return { text: 'ACTIVE', isReady: false, isActive: true };

  const raw = String(s.label || '');
  if (/\bACTIVE\b/i.test(raw) && !s.ready) {
    return { text: 'ACTIVE', isReady: false, isActive: true };
  }

  const timerMatch = raw.match(/\(\s*([\d\.]+\s*[sS]?|\d+\s*\/\s*\d+)\s*\)/i);
  if (timerMatch && timerMatch[1]) {
    const val = timerMatch[1].trim().toUpperCase();
    const str = val.endsWith('S') || val.includes('/') ? val : `${val}S`;
    return { text: str, isReady: false, isActive: false };
  }

  if (s.ready || s.pct >= 99) {
    return { text: 'READY', isReady: true, isActive: false };
  }

  if (typeof s.cooldown === 'number' && s.cooldown > 0) {
    const sec = s.cooldown > 60 ? (s.cooldown / 60).toFixed(1) : s.cooldown.toFixed(1);
    return { text: `${sec}S`, isReady: false, isActive: false };
  }

  return { text: `${Math.round(s.pct)}%`, isReady: false, isActive: false };
}

function updateGhostBar(f, curHp, maxHp) {
  let tracker = _ghostHpTrackers.get(f);
  if (!tracker) {
    tracker = { ghostHp: curHp, holdTimer: 0, lastTargetHp: curHp };
    _ghostHpTrackers.set(f, tracker);
  }

  if (curHp <= 0) {
    tracker.ghostHp = 0;
    tracker.holdTimer = 0;
    tracker.lastTargetHp = 0;
    return 0;
  }

  if (curHp < tracker.lastTargetHp) {
    tracker.holdTimer = 8;
  } else if (curHp > tracker.ghostHp) {
    tracker.ghostHp = curHp;
    tracker.holdTimer = 0;
  }
  tracker.lastTargetHp = curHp;

  if (tracker.holdTimer > 0) {
    tracker.holdTimer--;
  } else if (tracker.ghostHp > curHp) {
    const gap = tracker.ghostHp - curHp;
    const step = Math.max(1.2, gap * 0.20);
    tracker.ghostHp = Math.max(curHp, tracker.ghostHp - step);
  } else {
    tracker.ghostHp = curHp;
  }

  return Math.min(1.0, Math.max(0, tracker.ghostHp / maxHp));
}

/**
 * Main draw call for Canvas Mobile HUD.
 * Renders into topLevelUiCtx or state.ctx at identity screen transform (540x960).
 */
export function drawMobileCanvasHud(ctx) {
  if (!ctx || !isMobileCanvasHudActive()) return;

  const { fighters, mode, scores, gameState } = state;
  if (!fighters || fighters.length === 0) return;
  if (gameState !== 'playing' && gameState !== 'countdown' && gameState !== 'roundEnd' && gameState !== 'matchEnd') return;

  syncMobileDomHudVisibility(true);

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const mainFighters = [];
  for (let i = 0; i < fighters.length; i++) {
    const f = fighters[i];
    if (f && !f.isTurret && !f.isEndCrystal && !f.isMinion && !f.isDeployable && !f.isIllusion) {
      mainFighters.push(f);
    }
  }

  // ── 1. CENTER TOP MATCH TIMER & ROUND BADGE ──
  _drawCenterTopTimer(ctx);

  // ── 2. FIGHTER PODS / CARDS (Anchored below arena: y = 700 to 950) ──
  if (mainFighters.length === 2) {
    const cardY = 700;
    const cardH = 244;
    const cardW = 218;

    // Player 1 Card (Left)
    _drawFighterCanvasCard(ctx, 45, cardY, cardW, cardH, mainFighters[0], 0, scores?.[0] || 0, false);

    // Player 2 Card (Right)
    _drawFighterCanvasCard(ctx, 277, cardY, cardW, cardH, mainFighters[1], 1, scores?.[1] || 0, true);
  } else if (mainFighters.length > 2) {
    _drawMultiFighterCanvasGrid(ctx, mainFighters, scores);
  }

  // ── 3. OVERLAYS & NOTIFICATIONS (Tag match, cheat banners, combo counters) ──
  drawTagMatchRosterHUD(ctx);
  drawCheatNotification(ctx);
  drawComboCounter(ctx);

  ctx.restore();
}

function _drawCenterTopTimer(ctx) {
  const arena = state.arena || CONFIG.arena || { x: 45, y: 240, width: 450, height: 450 };
  const cx = arena.x + arena.width / 2;
  const topY = arena.y - 38;

  // Background pill
  const pillW = 110;
  const pillH = 26;
  const pillX = cx - pillW / 2;

  ctx.fillStyle = 'rgba(8, 10, 16, 0.88)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.2;
  drawChamferedRect(ctx, pillX, topY, pillW, pillH, 5);
  ctx.fill();
  ctx.stroke();

  // Match Time String
  const totalSec = Math.floor((state.matchTimer || 0) / 60);
  const minStr = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const secStr = String(totalSec % 60).padStart(2, '0');
  const timeStr = `${minStr}:${secStr}`;

  ctx.font = '900 13px "Outfit", "Segoe UI", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(timeStr, cx, topY + pillH / 2);
}

function _drawFighterCanvasCard(ctx, x, y, w, h, f, fighterIndex, wins, isRightAlign) {
  if (!f) return;

  const isDark = (state.arenaTheme === 'dark');
  const themeColor = getFighterThemeColor(f, isRightAlign ? '#38bdf8' : '#ef4444');
  const curHp = (typeof f.getDisplayHp === 'function') ? f.getDisplayHp() : f.hp;
  const maxHp = f._originalMaxHp || f.maxHp || 100;
  const hpRatio = maxHp > 0 ? Math.min(1.0, Math.max(0, curHp / maxHp)) : 0;
  const ghostRatio = updateGhostBar(f, curHp, maxHp);
  const isDead = curHp <= 0;

  // Card Background Panel
  ctx.fillStyle = isDark ? 'rgba(12, 14, 22, 0.92)' : 'rgba(16, 20, 30, 0.90)';
  ctx.strokeStyle = isDead ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1.5;
  drawChamferedRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();

  // Top Theme Accent Rim
  ctx.fillStyle = themeColor;
  ctx.fillRect(x + 6, y, w - 12, 2.5);

  // ── HEADER: Name & Win Bullets ──
  const nameY = y + 16;
  ctx.font = '900 13px "Outfit", "Segoe UI", sans-serif';
  ctx.textAlign = isRightAlign ? 'right' : 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = themeColor;
  const displayName = getFighterDisplayName(f, true);
  const nameX = isRightAlign ? (x + w - 10) : (x + 10);
  ctx.fillText(displayName, nameX, nameY);

  // Win Bullets (2 dots)
  const bulletR = 3.5;
  const bulletsStartX = isRightAlign ? (x + 12) : (x + w - 24);
  for (let b = 0; b < 2; b++) {
    const bx = bulletsStartX + b * 10;
    const by = nameY;
    ctx.beginPath();
    ctx.arc(bx, by, bulletR, 0, Math.PI * 2);
    if (b < wins) {
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }
  }

  // ── HEALTH BAR ──
  const barX = x + 10;
  const barY = y + 28;
  const barW = w - 20;
  const barH = 18;

  // Bar Track
  ctx.fillStyle = '#0a0d14';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.lineWidth = 1.2;
  drawChamferedRect(ctx, barX, barY, barW, barH, 3);
  ctx.fill();
  ctx.stroke();

  // Ghost Fill (Red damage catch-up)
  if (ghostRatio > hpRatio) {
    const gw = Math.round(barW * ghostRatio);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(barX + 1, barY + 1, Math.max(0, gw - 2), barH - 2);
  }

  // Active HP Fill
  if (hpRatio > 0) {
    const fw = Math.round(barW * hpRatio);
    let hpColor = '#22c55e'; // Green
    if (hpRatio < 0.25) hpColor = '#ef4444'; // Red
    else if (hpRatio < 0.50) hpColor = '#eab308'; // Yellow

    ctx.fillStyle = hpColor;
    ctx.fillRect(barX + 1, barY + 1, Math.max(0, fw - 2), barH - 2);

    // Subtle highlight sheen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(barX + 1, barY + 1, Math.max(0, fw - 2), Math.floor((barH - 2) / 2));
  }

  // Health Number Text
  ctx.font = '900 10.5px "Rajdhani", "Outfit", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const hpText = isDead ? 'KIA' : `${Math.floor(Math.max(0, curHp))} / ${Math.floor(maxHp)}`;
  
  // Text Stroke for readability
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.strokeText(hpText, barX + barW / 2, barY + barH / 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(hpText, barX + barW / 2, barY + barH / 2);

  // ── SKILL ROWS (Up to 4 skills) ──
  const rawSkills = getSkillDataForFighter(f) || [];
  const skills = rawSkills.filter(s => shouldShowFighterSkill(f, s)).slice(0, 4);

  let skillY = barY + barH + 8;
  const skillH = 21;
  const skillGap = 4;

  for (let sIdx = 0; sIdx < skills.length; sIdx++) {
    const s = skills[sIdx];
    const status = resolveSkillStatus(s, f);
    const cleanLabel = cleanSkillLabel(s.label) || 'SKILL';
    const sPct = Math.min(100, Math.max(0, s.pct || 0));

    // Skill Box Background
    ctx.fillStyle = 'rgba(18, 22, 34, 0.85)';
    ctx.strokeStyle = status.isReady
      ? 'rgba(0, 255, 102, 0.85)'
      : (status.isActive ? 'rgba(255, 215, 0, 0.85)' : 'rgba(255, 255, 255, 0.12)');
    ctx.lineWidth = status.isReady || status.isActive ? 1.4 : 1.0;
    drawChamferedRect(ctx, barX, skillY, barW, skillH, 3);
    ctx.fill();
    ctx.stroke();

    // Skill Progress Fill
    if (!s.noFill && sPct > 0) {
      const fillW = Math.round((barW - 2) * (sPct / 100));
      ctx.fillStyle = status.isReady ? (s.color || themeColor) : 'rgba(255, 255, 255, 0.18)';
      ctx.globalAlpha = status.isReady ? 0.35 : 0.22;
      ctx.fillRect(barX + 1, skillY + 1, fillW, skillH - 2);
      ctx.globalAlpha = 1.0;
    }

    // Skill Label (Left)
    ctx.font = 'bold 9.5px "Outfit", "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(cleanLabel.toUpperCase(), barX + 6, skillY + skillH / 2);

    // Skill Cooldown Status (Right)
    ctx.font = '900 9.5px "Rajdhani", monospace';
    ctx.textAlign = 'right';
    if (status.isReady) {
      ctx.fillStyle = '#00FF66';
    } else if (status.isActive) {
      ctx.fillStyle = '#FFD700';
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    }
    ctx.fillText(status.text, barX + barW - 6, skillY + skillH / 2);

    skillY += skillH + skillGap;
  }
}

function _drawMultiFighterCanvasGrid(ctx, fighters, scores) {
  const count = Math.min(4, fighters.length);
  const startY = 700;
  const podH = 54;
  const podW = 218;

  for (let i = 0; i < count; i++) {
    const f = fighters[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const px = col === 0 ? 45 : 277;
    const py = startY + row * (podH + 8);
    const themeColor = getFighterThemeColor(f, col === 0 ? '#ef4444' : '#38bdf8');
    const curHp = (typeof f.getDisplayHp === 'function') ? f.getDisplayHp() : f.hp;
    const maxHp = f._originalMaxHp || f.maxHp || 100;
    const ratio = maxHp > 0 ? Math.min(1.0, Math.max(0, curHp / maxHp)) : 0;

    ctx.fillStyle = 'rgba(12, 14, 22, 0.92)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.2;
    drawChamferedRect(ctx, px, py, podW, podH, 4);
    ctx.fill();
    ctx.stroke();

    // Name & HP
    ctx.font = 'bold 11px "Outfit", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = themeColor;
    ctx.fillText(getFighterDisplayName(f, true), px + 8, py + 6);

    // HP Bar
    const bw = podW - 16;
    const bh = 10;
    const by = py + 24;
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(px + 8, by, bw, bh);

    if (ratio > 0) {
      ctx.fillStyle = ratio < 0.25 ? '#ef4444' : (ratio < 0.5 ? '#eab308' : '#22c55e');
      ctx.fillRect(px + 8, by, bw * ratio, bh);
    }
  }
}
