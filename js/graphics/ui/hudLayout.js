import { CONFIG } from '../../core/config.js';
import { state } from '../../core/state.js';
import { GAME_MODES } from '../../core/modeConfig.js';
import { worldToScreen } from '../../systems/cameraSystem.js';
import { getArenaTopWallBlockThickness } from '../../systems/arenaThemeSystem.js';

let _hudSyncInitialized = false;
let _cachedGameBox = null;
let _cachedContainerBottom = null;
let _cachedContainerLeft = null;
let _cachedContainerRight = null;
let _cachedTopContainer = null;
let _cachedBottomContainer = null;
let _cachedPixiView = null;
let _cachedBoxHeight = 0;
let _cachedBoxWidth = 0;
let _cachedCanvasHeight = 0;
let _cachedCanvasWidth = 0;
let _cachedCanvasTopInBox = 0;

/**
 * Safely sets a style property on a DOM element, supporting both standard
 * CSSStyleDeclaration (.setProperty) and mock style objects (used in unit tests).
 */
function setSafeStyle(el, prop, val, priority) {
  if (!el || !el.style) return;
  if (typeof el.style.setProperty === 'function') {
    if (priority) {
      el.style.setProperty(prop, val, priority);
    } else {
      el.style.setProperty(prop, val);
    }
  } else {
    const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    el.style[camelProp] = val;
    el.style[prop] = val;
  }
}

/**
 * Dynamically recalculates the HUD container positions based on the actual
 * PixiJS canvas element's bounding rect relative to the game-box.
 * This prevents HUD drift during browser zoom changes.
 */
export function syncHudPosition() {
  _lastTopHudStyle = '';
  _lastBottomHudStyle = '';
  _lastSideHudStyle = '';
  if (!_cachedGameBox) _cachedGameBox = document.querySelector('.game-box');
  if (!_cachedPixiView) _cachedPixiView = _cachedGameBox?.querySelector('canvas') || document.getElementById('arena');
  if (!_cachedGameBox || !_cachedPixiView) return;

  const canvasWidth = (typeof state !== 'undefined' && state.canvas && state.canvas.width) || CONFIG.canvasWidth || 540;
  const canvasHeight = (typeof state !== 'undefined' && state.canvas && state.canvas.height) || CONFIG.canvasHeight || 960;

  const isHorizontal = Boolean(typeof state !== 'undefined' && state.viewOrientation === 'horizontal');
  const isGrandBattle = isHorizontal && Boolean(typeof state !== 'undefined' && (
    (state.arena && state.arena.width >= 1200) ||
    state.mode === '3v3v3v3' ||
    state.mode === '2v2v2v2' ||
    state.mode === '4v4' ||
    state.mode === 'Battle Royale 8' ||
    state.mode === '8-Fighter Battle Royale' ||
    state.mode === '3v3v3v3 Teamfight' ||
    state.mode === '4v4 Grand War' ||
    state.mode === '2v2v2v2 Quad Battle' ||
    state.mode === '2v2v2v2 Quad' ||
    state.mode === 'Grand Colosseum' ||
    state.mode === 'Classic Minimalist Arena'
  ));
  const isTactical = isGrandBattle;

  _cachedGameBox.style.aspectRatio = isHorizontal ? '16 / 9' : '540 / 960';
  _cachedGameBox.style.maxWidth = `${canvasWidth}px`;
  
  const isDark = (typeof state !== 'undefined' && state.arenaTheme === 'dark');
  const outerBgColor = isDark ? (CONFIG.darkArenaOuterBgColor || '#000000') : (CONFIG.arenaOuterBgColor || '#141622');
  _cachedGameBox.style.backgroundColor = (typeof outerBgColor === 'string' && outerBgColor.startsWith('#') && outerBgColor.length === 9 && outerBgColor.endsWith('ff'))
    ? outerBgColor.substring(0, 7)
    : outerBgColor;

  const boxRect = _cachedGameBox.getBoundingClientRect();
  const canvasRect = _cachedPixiView.getBoundingClientRect();

  if (boxRect.height <= 0 || canvasRect.height <= 0 || boxRect.width <= 0 || canvasRect.width <= 0) return;

  _cachedBoxHeight = boxRect.height;
  _cachedBoxWidth = boxRect.width;
  _cachedCanvasHeight = canvasRect.height;
  _cachedCanvasWidth = canvasRect.width;
  _cachedCanvasTopInBox = canvasRect.top - boxRect.top;

  const canvasTopInBox = _cachedCanvasTopInBox;
  const canvasLeftInBox = canvasRect.left - boxRect.left;

  const scale = CONFIG.internalScale || 1.0;
  const hudScale = isHorizontal ? 0.80 : (scale * 0.9);

  const arena = (typeof state !== 'undefined' && state.arena) ? state.arena : CONFIG.arena;
  const arenaWidth = arena.width;
  const arenaX = arena.x;
  
  const widthModifier = CONFIG.hudWidthModifier ?? scale;
  const topWidthModifier = CONFIG.topHudWidthModifier ?? widthModifier;
  const bottomWidthModifier = CONFIG.bottomHudWidthModifier ?? (CONFIG.hudBottomWidthModifier ?? 1.007);

  // Top HUD sizing & positioning (spans full arena header)
  const topHudCssWidth = isTactical ? arenaWidth : ((arenaWidth * topWidthModifier) / hudScale);
  const topVisualWidthPercent = (topHudCssWidth / canvasWidth) * 100;
  const topHudCssLeft = isTactical ? arenaX : ((arenaX + arenaWidth / 2) - topHudCssWidth / 2);
  const topVisualLeftPercent = (topHudCssLeft / canvasWidth) * 100;

  // Bottom HUD sizing & positioning (compact centered width)
  const bottomHudCssWidth = isTactical ? (arenaWidth * bottomWidthModifier) : ((arenaWidth * bottomWidthModifier) / hudScale);
  const bottomVisualWidthPercent = (bottomHudCssWidth / canvasWidth) * 100;
  const bottomHudCssLeft = isTactical ? ((arenaX + arenaWidth / 2) - (arenaWidth * bottomWidthModifier) / 2) : ((arenaX + arenaWidth / 2) - bottomHudCssWidth / 2);
  const bottomVisualLeftPercent = (bottomHudCssLeft / canvasWidth) * 100;

  const is1v2 = Boolean(
    state.mode === 'Boss Battle' ||
    state.mode === '1v2 Stand Off' ||
    state.mode === '1v2' ||
    state.mode === 'Stand Off 1v2' ||
    (typeof GAME_MODES !== 'undefined' && (state.mode === GAME_MODES.BOSS_BATTLE || state.mode === GAME_MODES.STAND_OFF_1V2))
  );

  // 1. Position Top HUD Container
  const topWallExtra = (typeof getArenaTopWallBlockThickness === 'function')
    ? getArenaTopWallBlockThickness()
    : ((state.selectedArenaTheme === 'bomberman_normal' || state.selectedArenaFloor === 'bomberman_normal') ? 25 : 0);
  const topMarginPx = (is1v2 ? 82 : 72) + topWallExtra;
  const topRatio = isHorizontal
    ? (4 / canvasHeight)
    : ((arena.y - topMarginPx) / canvasHeight);
  const topPx = canvasTopInBox + canvasRect.height * topRatio;
  const topPercent = (topPx / boxRect.height) * 100;
  
  if (!_cachedTopContainer) _cachedTopContainer = document.getElementById('hudTopContainer');
  if (_cachedTopContainer) {
    setSafeStyle(_cachedTopContainer, 'top', isHorizontal ? '4px' : `${topPercent.toFixed(3)}%`, 'important');
    setSafeStyle(_cachedTopContainer, 'width', isHorizontal ? 'calc(100% - 20px)' : `${topVisualWidthPercent.toFixed(3)}%`, 'important');
    setSafeStyle(_cachedTopContainer, 'max-width', isHorizontal ? '940px' : 'none', 'important');
    setSafeStyle(_cachedTopContainer, 'left', isHorizontal ? '10px' : `${topVisualLeftPercent.toFixed(3)}%`, 'important');
    setSafeStyle(_cachedTopContainer, 'right', isHorizontal ? '10px' : 'auto', 'important');
    setSafeStyle(_cachedTopContainer, 'margin', isHorizontal ? '0 auto' : '0', 'important');
    setSafeStyle(_cachedTopContainer, 'transform', isHorizontal ? 'none' : (isTactical ? 'none' : `scale(${hudScale})`));
    setSafeStyle(_cachedTopContainer, 'transform-origin', 'top center', 'important');
  }

  // 2. Position Bottom HUD Container (Snug right below arena bottom wall)
  const bottomWallExtra = topWallExtra;
  const bottomMarginPx = isHorizontal ? 6 : ((is1v2 ? 24 : 16) + bottomWallExtra);
  const bottomRatio = ((arena.y + arena.height + bottomMarginPx) / canvasHeight);
  const bottomPx = canvasTopInBox + canvasRect.height * bottomRatio;
  const bottomPercent = (bottomPx / boxRect.height) * 100;

  if (!_cachedBottomContainer) _cachedBottomContainer = document.getElementById('hudBottomContainer');
  if (_cachedBottomContainer) {
    setSafeStyle(_cachedBottomContainer, 'top', `${bottomPercent.toFixed(3)}%`);
    setSafeStyle(_cachedBottomContainer, 'bottom', 'auto', 'important');
    setSafeStyle(_cachedBottomContainer, 'width', `${bottomVisualWidthPercent.toFixed(3)}%`, 'important');
    setSafeStyle(_cachedBottomContainer, 'max-width', 'none', 'important');
    setSafeStyle(_cachedBottomContainer, 'left', `${bottomVisualLeftPercent.toFixed(3)}%`, 'important');
    setSafeStyle(_cachedBottomContainer, 'right', 'auto', 'important');
    setSafeStyle(_cachedBottomContainer, 'margin', '0', 'important');
    setSafeStyle(_cachedBottomContainer, 'transform', isTactical ? 'none' : `scale(${hudScale})`);
    setSafeStyle(_cachedBottomContainer, 'transform-origin', 'top center', 'important');
  }

  // 3. Position Health HUD (Snug right below arena bottom wall)
  if (!_cachedContainerBottom) _cachedContainerBottom = document.getElementById('healthHud');
  const healthHud = _cachedContainerBottom;
  if (healthHud) {
    setSafeStyle(healthHud, 'top', `${bottomPercent.toFixed(3)}%`);
    setSafeStyle(healthHud, 'bottom', 'auto', 'important');
    setSafeStyle(healthHud, 'width', `${bottomVisualWidthPercent.toFixed(3)}%`, 'important');
    setSafeStyle(healthHud, 'max-width', 'none', 'important');
    setSafeStyle(healthHud, 'left', `${bottomVisualLeftPercent.toFixed(3)}%`, 'important');
    setSafeStyle(healthHud, 'right', 'auto', 'important');
    setSafeStyle(healthHud, 'margin', '0', 'important');
    setSafeStyle(healthHud, 'transform', isTactical ? 'none' : `scale(${hudScale})`);
    setSafeStyle(healthHud, 'transform-origin', 'top center', 'important');
  }

  // 4. Position Side HUD Containers for Horizontal 1v1 Mode
  if (!_cachedContainerLeft) _cachedContainerLeft = document.getElementById('healthHudLeft');
  if (!_cachedContainerRight) _cachedContainerRight = document.getElementById('healthHudRight');

  if (isHorizontal) {
    const isMultiFighter = Boolean(
      (state.fighters && state.fighters.filter(f => f && !f.isTurret && !f.isEndCrystal && !f.isMinion && !f.isDeployable).length > 2) ||
      state.mode === '2v2' || state.mode === '1v2' || state.mode === '4v4' ||
      (typeof GAME_MODES !== 'undefined' && (state.mode === GAME_MODES.TWO_VS_TWO || state.mode === GAME_MODES.ONE_VS_TWO))
    );

    // In large arenas (arena.width > 600, e.g. FFA 800x800 or Grand 1400x1400), side containers
    // are anchored cleanly at screen top (24px) spanning the screen height (canvasHeight - 48px).
    // In horizontal 1v1 mode, side containers are placed cleanly in the top space provided above the arena top wall (21px).
    // In standard multi-fighter mode, top is arena.y (aligned with the arena top wall).
    const isLargeArena = Boolean(arena && arena.width >= 1200);
    const isTopHud1v1 = Boolean(!isMultiFighter && !isLargeArena);
    const sideTopPxInCanvas = isLargeArena ? 24 : (isMultiFighter ? arena.y : (isTopHud1v1 ? 21 : (arena.y + 38)));
    const sideTopRatio = sideTopPxInCanvas / canvasHeight;
    const sideTopPx = canvasTopInBox + canvasRect.height * sideTopRatio;
    const sideTopPercent = (sideTopPx / boxRect.height) * 100;

    const sideHeightPx = isLargeArena ? (canvasHeight - 48) : arena.height;
    const sideHeightPxInBox = canvasRect.height * (sideHeightPx / canvasHeight);
    const sideHeightPercent = (sideHeightPxInBox / boxRect.height) * 100;

    const sideWidthPx = isTopHud1v1 ? 300 : 176;
    const sideWidthPercent = (sideWidthPx / canvasWidth) * 100;

    if (_cachedContainerLeft) {
      if (isTopHud1v1) {
        _cachedContainerLeft.classList.add('top-hud-1v1');
      } else {
        _cachedContainerLeft.classList.remove('top-hud-1v1');
      }
      setSafeStyle(_cachedContainerLeft, 'top', `${sideTopPercent.toFixed(3)}%`);
      if (isMultiFighter) {
        setSafeStyle(_cachedContainerLeft, 'height', `${sideHeightPercent.toFixed(3)}%`, 'important');
      } else {
        setSafeStyle(_cachedContainerLeft, 'height', 'auto');
      }
      setSafeStyle(_cachedContainerLeft, 'left', `18px`, 'important');
      setSafeStyle(_cachedContainerLeft, 'right', 'auto', 'important');
      setSafeStyle(_cachedContainerLeft, 'width', `${sideWidthPercent.toFixed(3)}%`, 'important');
      setSafeStyle(_cachedContainerLeft, 'max-width', 'none', 'important');
    }
    if (_cachedContainerRight) {
      if (isTopHud1v1) {
        _cachedContainerRight.classList.add('top-hud-1v1');
      } else {
        _cachedContainerRight.classList.remove('top-hud-1v1');
      }
      setSafeStyle(_cachedContainerRight, 'top', `${sideTopPercent.toFixed(3)}%`);
      if (isMultiFighter) {
        setSafeStyle(_cachedContainerRight, 'height', `${sideHeightPercent.toFixed(3)}%`, 'important');
      } else {
        setSafeStyle(_cachedContainerRight, 'height', 'auto');
      }
      setSafeStyle(_cachedContainerRight, 'right', `18px`, 'important');
      setSafeStyle(_cachedContainerRight, 'left', 'auto', 'important');
      setSafeStyle(_cachedContainerRight, 'width', `${sideWidthPercent.toFixed(3)}%`, 'important');
      setSafeStyle(_cachedContainerRight, 'max-width', 'none', 'important');
    }
  }
}

export function initHudSync() {
  if (_hudSyncInitialized) return;
  _hudSyncInitialized = true;

  syncHudPosition();

  window.addEventListener('resize', syncHudPosition);

  const dprMediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  const onDprChange = () => {
    syncHudPosition();
    const newQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    newQuery.addEventListener('change', onDprChange, { once: true });
  };
  dprMediaQuery.addEventListener('change', onDprChange, { once: true });

  const gameBox = document.querySelector('.game-box');
  if (gameBox && typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => {
      _cachedPixiView = null;
      syncHudPosition();
    });
    ro.observe(gameBox);
  }
}

let _lastTopHudStyle = '';
let _lastBottomHudStyle = '';
let _lastSideHudStyle = '';

/**
 * Dynamically anchors the Top HUD Container (#hudTopContainer)
 * to the arena's top wall when zooming or panning.
 */
export function updateTopHudCameraTracking(topContainer) {
  if (!topContainer) return;

  const isHorizontal = Boolean(typeof state !== 'undefined' && state.viewOrientation === 'horizontal');
  if (isHorizontal) {
    if (_lastTopHudStyle === 'horizontal') return;
    _lastTopHudStyle = 'horizontal';
    setSafeStyle(topContainer, 'transform', 'none', 'important');
    return;
  }

  const scale = CONFIG.internalScale || 1.0;
  const baseHudScale = scale * 0.9;

  const cam = (typeof state !== 'undefined' && state.camera) ? state.camera : null;
  const isDynamic = Boolean(cam && cam.enabled && (cam.mode === 'dynamic' || cam.cinematicOverride));
  const isZooming = Boolean(cam && Math.abs((cam.zoom || 1.0) - 1.0) > 0.0005);
  const isCamActive = !state.isMobileDevice && (isDynamic || isZooming);

  if (!isCamActive) {
    const curStyle = `static_${baseHudScale}`;
    if (_lastTopHudStyle === curStyle) return;
    _lastTopHudStyle = curStyle;
    setSafeStyle(topContainer, 'transform', `scale(${baseHudScale})`, 'important');
    setSafeStyle(topContainer, 'transform-origin', 'top center', 'important');
    return;
  }

  const arena = (typeof state !== 'undefined' && state.arena) ? state.arena : CONFIG.arena;
  const arenaWidth = arena.width || 450;
  const arenaX = arena.x || 45;
  const arenaY = arena.y || 240;
  const arenaCenterX = arenaX + arenaWidth / 2;

  const is1v2 = Boolean(
    state.mode === 'Boss Battle' ||
    state.mode === '1v2 Stand Off' ||
    state.mode === '1v2' ||
    state.mode === 'Stand Off 1v2' ||
    (typeof GAME_MODES !== 'undefined' && (state.mode === GAME_MODES.BOSS_BATTLE || state.mode === GAME_MODES.STAND_OFF_1V2))
  );
  const topWallExtra = (typeof getArenaTopWallBlockThickness === 'function')
    ? getArenaTopWallBlockThickness()
    : ((state.selectedArenaTheme === 'bomberman_normal' || state.selectedArenaFloor === 'bomberman_normal') ? 25 : 0);
  const topMarginPx = (is1v2 ? 82 : 72) + topWallExtra;
  const defaultTopY = arenaY - topMarginPx;

  const screenTop = worldToScreen(arenaCenterX, arenaY);
  const camZoom = (cam && Number.isFinite(cam.zoom) && cam.zoom > 0) ? cam.zoom : 1.0;

  const targetTopY = screenTop.y - (topMarginPx * camZoom);
  const targetTopX = screenTop.x;

  const canvasWidth = (typeof state !== 'undefined' && state.canvas && state.canvas.width) || CONFIG.canvasWidth || 540;
  const canvasHeight = (typeof state !== 'undefined' && state.canvas && state.canvas.height) || CONFIG.canvasHeight || 960;
  const boxW = _cachedBoxWidth || canvasWidth;
  const boxH = _cachedBoxHeight || canvasHeight;
  const ratioX = boxW / canvasWidth;
  const ratioY = boxH / canvasHeight;

  const deltaX = (targetTopX - arenaCenterX) * ratioX;
  const deltaY = (targetTopY - defaultTopY) * ratioY;
  const effectiveScale = baseHudScale * camZoom;

  const curStyle = `${deltaX.toFixed(1)}_${deltaY.toFixed(1)}_${effectiveScale.toFixed(3)}`;
  if (_lastTopHudStyle === curStyle) return;
  _lastTopHudStyle = curStyle;

  setSafeStyle(topContainer, 'transform', `translate3d(${deltaX.toFixed(2)}px, ${deltaY.toFixed(2)}px, 0) scale(${effectiveScale.toFixed(4)})`, 'important');
  setSafeStyle(topContainer, 'transform-origin', 'top center', 'important');
}

/**
 * Dynamically anchors the Bottom HUD Container (#healthHud and #hudBottomContainer)
 * containing fighter healthbars, skill progress bars, and combat stats to the arena's
 * bottom wall when zooming or panning.
 */
export function updateBottomHudCameraTracking(bottomContainer) {
  if (!bottomContainer) return;

  const isHorizontal = Boolean(typeof state !== 'undefined' && state.viewOrientation === 'horizontal');
  const scale = CONFIG.internalScale || 1.0;
  const baseHudScale = isHorizontal ? 0.80 : (scale * 0.9);

  if (isHorizontal) {
    const curStyle = `horizontal_${baseHudScale}`;
    if (_lastBottomHudStyle === curStyle) return;
    _lastBottomHudStyle = curStyle;
    setSafeStyle(bottomContainer, 'bottom', 'auto', 'important');
    setSafeStyle(bottomContainer, 'transform', `scale(${baseHudScale})`, 'important');
    setSafeStyle(bottomContainer, 'transform-origin', 'top center', 'important');
    return;
  }

  const cam = (typeof state !== 'undefined' && state.camera) ? state.camera : null;
  const isDynamic = Boolean(cam && cam.enabled && (cam.mode === 'dynamic' || cam.cinematicOverride));
  const isZooming = Boolean(cam && Math.abs((cam.zoom || 1.0) - 1.0) > 0.0005);
  const isCamActive = !state.isMobileDevice && (isDynamic || isZooming);

  if (!isCamActive) {
    const curStyle = `static_${baseHudScale}`;
    if (_lastBottomHudStyle === curStyle) return;
    _lastBottomHudStyle = curStyle;
    setSafeStyle(bottomContainer, 'bottom', 'auto', 'important');
    setSafeStyle(bottomContainer, 'transform', `scale(${baseHudScale})`, 'important');
    setSafeStyle(bottomContainer, 'transform-origin', 'top center', 'important');
    if (_cachedBottomContainer && _cachedBottomContainer !== bottomContainer) {
      setSafeStyle(_cachedBottomContainer, 'bottom', 'auto', 'important');
      setSafeStyle(_cachedBottomContainer, 'transform', `scale(${baseHudScale})`, 'important');
      setSafeStyle(_cachedBottomContainer, 'transform-origin', 'top center', 'important');
    }
    return;
  }

  const arena = (typeof state !== 'undefined' && state.arena) ? state.arena : CONFIG.arena;
  const arenaWidth = arena.width || 450;
  const arenaHeight = arena.height || 450;
  const arenaX = arena.x || 45;
  const arenaY = arena.y || 240;
  const arenaCenterX = arenaX + arenaWidth / 2;
  const arenaBottomY = arenaY + arenaHeight;

  const is1v2 = Boolean(
    state.mode === 'Boss Battle' ||
    state.mode === '1v2 Stand Off' ||
    state.mode === '1v2' ||
    state.mode === 'Stand Off 1v2' ||
    (typeof GAME_MODES !== 'undefined' && (state.mode === GAME_MODES.BOSS_BATTLE || state.mode === GAME_MODES.STAND_OFF_1V2))
  );
  const bottomWallExtra = (typeof getArenaTopWallBlockThickness === 'function')
    ? getArenaTopWallBlockThickness()
    : ((state.selectedArenaTheme === 'bomberman_normal' || state.selectedArenaFloor === 'bomberman_normal') ? 25 : 0);
  const bottomMarginPx = (is1v2 ? 24 : 16) + bottomWallExtra;
  const defaultHudTopY = arenaBottomY + bottomMarginPx;

  const screenBottom = worldToScreen(arenaCenterX, arenaBottomY);
  const camZoom = (cam && Number.isFinite(cam.zoom) && cam.zoom > 0) ? cam.zoom : 1.0;

  // The Bottom HUD anchors right below the arena's screen bottom boundary
  const targetHudTopY = screenBottom.y + (bottomMarginPx * camZoom);
  const targetHudTopX = screenBottom.x;

  const canvasWidth = (typeof state !== 'undefined' && state.canvas && state.canvas.width) || CONFIG.canvasWidth || 540;
  const canvasHeight = (typeof state !== 'undefined' && state.canvas && state.canvas.height) || CONFIG.canvasHeight || 960;
  const boxW = _cachedBoxWidth || canvasWidth;
  const boxH = _cachedBoxHeight || canvasHeight;
  const ratioX = boxW / canvasWidth;
  const ratioY = boxH / canvasHeight;

  const deltaX = (targetHudTopX - arenaCenterX) * ratioX;
  const deltaY = (targetHudTopY - defaultHudTopY) * ratioY;
  const effectiveScale = baseHudScale * camZoom;

  const curStyle = `${deltaX.toFixed(1)}_${deltaY.toFixed(1)}_${effectiveScale.toFixed(3)}`;
  if (_lastBottomHudStyle === curStyle) return;
  _lastBottomHudStyle = curStyle;

  const transformStyle = `translate3d(${deltaX.toFixed(2)}px, ${deltaY.toFixed(2)}px, 0) scale(${effectiveScale.toFixed(4)})`;

  setSafeStyle(bottomContainer, 'bottom', 'auto', 'important');
  setSafeStyle(bottomContainer, 'transform', transformStyle, 'important');
  setSafeStyle(bottomContainer, 'transform-origin', 'top center', 'important');

  if (_cachedBottomContainer && _cachedBottomContainer !== bottomContainer) {
    setSafeStyle(_cachedBottomContainer, 'bottom', 'auto', 'important');
    setSafeStyle(_cachedBottomContainer, 'transform', transformStyle, 'important');
    setSafeStyle(_cachedBottomContainer, 'transform-origin', 'top center', 'important');
  }
}

/**
 * Dynamically anchors the Side HUD Containers (#healthHudLeft and #healthHudRight)
 * to the arena's left and right flanks in Horizontal Mode when zooming or panning.
 */
export function updateSideHudCameraTracking(containerLeft, containerRight) {
  const isHorizontal = Boolean(typeof state !== 'undefined' && state.viewOrientation === 'horizontal');
  if (!isHorizontal) return;

  const isMultiFighter = Boolean(
    (state.fighters && state.fighters.filter(f => f && !f.isTurret && !f.isEndCrystal && !f.isMinion && !f.isDeployable).length > 2) ||
    state.mode === '2v2' || state.mode === '1v2' || state.mode === '4v4' ||
    (typeof GAME_MODES !== 'undefined' && (state.mode === GAME_MODES.TWO_VS_TWO || state.mode === GAME_MODES.ONE_VS_TWO))
  );
  const arena = (typeof state !== 'undefined' && state.arena) ? state.arena : CONFIG.arena;
  const isLargeArena = Boolean(arena && arena.width >= 1200);
  const isTopHud1v1 = Boolean(!isMultiFighter && !isLargeArena);

  const cam = (typeof state !== 'undefined' && state.camera) ? state.camera : null;
  const isDynamic = Boolean(cam && cam.enabled && (cam.mode === 'dynamic' || cam.cinematicOverride));
  const isZooming = Boolean(cam && Math.abs((cam.zoom || 1.0) - 1.0) > 0.0005);
  const isCamActive = !state.isMobileDevice && (isDynamic || isZooming);

  if (!isCamActive || isTopHud1v1) {
    if (_lastSideHudStyle === 'static' && !isTopHud1v1) return;
    _lastSideHudStyle = isTopHud1v1 ? 'top-1v1' : 'static';
    if (containerLeft) setSafeStyle(containerLeft, 'transform', 'none', 'important');
    if (containerRight) setSafeStyle(containerRight, 'transform', 'none', 'important');
    return;
  }

  const arenaWidth = arena.width || 450;
  const arenaHeight = arena.height || 450;
  const arenaX = arena.x || 45;
  const arenaY = arena.y || 240;
  const arenaCenterY = arenaY + arenaHeight / 2;

  const screenLeft = worldToScreen(arenaX, arenaCenterY);
  const screenRight = worldToScreen(arenaX + arenaWidth, arenaCenterY);
  const camZoom = (cam && Number.isFinite(cam.zoom) && cam.zoom > 0) ? cam.zoom : 1.0;

  const canvasWidth = (typeof state !== 'undefined' && state.canvas && state.canvas.width) || 960;
  const canvasHeight = (typeof state !== 'undefined' && state.canvas && state.canvas.height) || 540;
  const boxW = _cachedBoxWidth || canvasWidth;
  const boxH = _cachedBoxHeight || canvasHeight;
  const ratioX = boxW / canvasWidth;
  const ratioY = boxH / canvasHeight;

  const deltaLeftX = (screenLeft.x - arenaX) * ratioX;
  const deltaRightX = (screenRight.x - (arenaX + arenaWidth)) * ratioX;
  const deltaY = (screenLeft.y - arenaCenterY) * ratioY;

  const curStyle = `${deltaLeftX.toFixed(1)}_${deltaRightX.toFixed(1)}_${deltaY.toFixed(1)}_${camZoom.toFixed(3)}`;
  if (_lastSideHudStyle === curStyle) return;
  _lastSideHudStyle = curStyle;

  if (containerLeft) {
    setSafeStyle(containerLeft, 'transform', `translate3d(${deltaLeftX.toFixed(2)}px, ${deltaY.toFixed(2)}px, 0) scale(${camZoom.toFixed(4)})`, 'important');
    setSafeStyle(containerLeft, 'transform-origin', 'top left', 'important');
  }
  if (containerRight) {
    setSafeStyle(containerRight, 'transform', `translate3d(${deltaRightX.toFixed(2)}px, ${deltaY.toFixed(2)}px, 0) scale(${camZoom.toFixed(4)})`, 'important');
    setSafeStyle(containerRight, 'transform-origin', 'top right', 'important');
  }
}
