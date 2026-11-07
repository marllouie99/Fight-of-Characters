// ─────────────────────────────────────────────
// SCREEN LOCK & KEEP-AWAKE SYSTEM
// Manages display wake lock and screen pinning (lock task mode) across
// native Android (Capacitor), mobile web browsers, PWA, and desktop.
//
// Features:
// 1. Dynamic Wake-Lock: Keeps display illuminated during active combat matches;
//    automatically releases during idle menus, pause, and inactive states to save battery.
// 2. Visibility Auto-Reacquisition: Seamlessly re-acquires wake lock when app returns to foreground.
// 3. Native Android Screen Pinning: Calls startLockTask() / stopLockTask() for kiosk / tournament mode.
// ─────────────────────────────────────────────

const _MENU_STATES = new Set([
  'title',
  'select',
  'horizontal_select',
  'index',
  'indexDetail',
  'leaderboard',
  'weapons',
  'weaponDetail',
  'weaponStudio',
  'skinStudio',
  'survivorStudio',
  'paused'
]);

let _wakeLockSentinel = null;
let _isWakeLockActive = false;
let _isMatchOngoing = false;
let _matchEndReleaseTimer = null;
let _isInitialized = false;

/**
 * Checks whether native Android screen control bridge is available.
 * @returns {boolean}
 */
export function hasNativeScreenBridge() {
  return typeof window !== 'undefined' &&
    Boolean(window.NativeScreenControl && typeof window.NativeScreenControl.setKeepScreenAwake === 'function');
}

/**
 * Requests display wake lock through both native Android bridge and W3C Wake Lock API.
 * @param {string} [reason='battle']
 * @returns {Promise<boolean>}
 */
export async function requestScreenWakeLock(reason = 'battle') {
  if (typeof window === 'undefined') return false;

  if (_matchEndReleaseTimer !== null) {
    clearTimeout(_matchEndReleaseTimer);
    _matchEndReleaseTimer = null;
  }

  _isMatchOngoing = true;

  // 1. Native Android Capacitor Bridge (Hardware WindowManager FLAG_KEEP_SCREEN_ON)
  if (hasNativeScreenBridge()) {
    try {
      window.NativeScreenControl.setKeepScreenAwake(true);
      _isWakeLockActive = true;
    } catch (e) {
      console.warn('⚠️ [ScreenLockSystem] Native Android setKeepScreenAwake(true) failed:', e);
    }
  }

  // 2. W3C Standard Screen Wake Lock API (Chrome, Safari, WebView, PWA)
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && !_wakeLockSentinel) {
    try {
      _wakeLockSentinel = await navigator.wakeLock.request('screen');
      _isWakeLockActive = true;
      _wakeLockSentinel.addEventListener('release', () => {
        _wakeLockSentinel = null;
        if (!_isMatchOngoing) {
          _isWakeLockActive = false;
        }
      });
    } catch (err) {
      // Ignored if device is low battery, tab is in background, or policy forbids
    }
  }

  return _isWakeLockActive;
}

/**
 * Releases display wake lock so screen can naturally dim/sleep during menus and pause.
 * @param {string} [reason='idle']
 */
export function releaseScreenWakeLock(reason = 'idle') {
  if (typeof window === 'undefined') return;

  _isMatchOngoing = false;

  if (_matchEndReleaseTimer !== null) {
    clearTimeout(_matchEndReleaseTimer);
    _matchEndReleaseTimer = null;
  }

  // 1. Release Native Android FLAG_KEEP_SCREEN_ON
  if (hasNativeScreenBridge()) {
    try {
      window.NativeScreenControl.setKeepScreenAwake(false);
    } catch (e) {
      console.warn('⚠️ [ScreenLockSystem] Native Android setKeepScreenAwake(false) failed:', e);
    }
  }

  // 2. Release W3C Screen Wake Lock
  if (_wakeLockSentinel) {
    _wakeLockSentinel.release().catch(() => {});
    _wakeLockSentinel = null;
  }

  _isWakeLockActive = false;
}

/**
 * Returns whether wake lock is currently holding the screen awake.
 * @returns {boolean}
 */
export function isScreenWakeLockActive() {
  return _isWakeLockActive;
}

/**
 * Synchronizes display wake lock with current game state.
 * - Active battle ('playing', 'countdown', 'faceOff', 'roundEnd'): screen locked awake.
 * - Match victory ('matchEnd'): 6-second celebration grace period, then released.
 * - Menus / Paused: wake lock released immediately to prevent battery drain.
 * @param {string} gameState
 */
export function syncWakeLockWithGameState(gameState) {
  if (!gameState) return;

  if (_MENU_STATES.has(gameState)) {
    releaseScreenWakeLock('menu');
    return;
  }

  if (gameState === 'matchEnd') {
    // Keep screen awake for 6s during victory podium/champion animation, then release
    if (_matchEndReleaseTimer !== null) {
      clearTimeout(_matchEndReleaseTimer);
    }
    _matchEndReleaseTimer = setTimeout(() => {
      _matchEndReleaseTimer = null;
      releaseScreenWakeLock('matchEndExpired');
    }, 6000);
    return;
  }

  // Active combat states ('playing', 'countdown', 'faceOff', 'roundEnd', etc.)
  requestScreenWakeLock('combat');
}

/**
 * Activates Android Screen Pinning / Lock Task mode for kiosk or tournament matches.
 * @returns {boolean}
 */
export function startScreenPinning() {
  if (typeof window === 'undefined') return false;
  if (hasNativeScreenBridge() && typeof window.NativeScreenControl.startScreenPinning === 'function') {
    try {
      window.NativeScreenControl.startScreenPinning();
      return true;
    } catch (e) {
      console.warn('⚠️ [ScreenLockSystem] startScreenPinning failed:', e);
    }
  }
  return false;
}

/**
 * Exits Android Screen Pinning / Lock Task mode.
 * @returns {boolean}
 */
export function stopScreenPinning() {
  if (typeof window === 'undefined') return false;
  if (hasNativeScreenBridge() && typeof window.NativeScreenControl.stopScreenPinning === 'function') {
    try {
      window.NativeScreenControl.stopScreenPinning();
      return true;
    } catch (e) {
      console.warn('⚠️ [ScreenLockSystem] stopScreenPinning failed:', e);
    }
  }
  return false;
}

/**
 * Checks if Screen Pinning is supported on this device.
 * @returns {boolean}
 */
export function isScreenPinningSupported() {
  if (typeof window === 'undefined') return false;
  if (hasNativeScreenBridge() && typeof window.NativeScreenControl.isScreenPinningSupported === 'function') {
    return Boolean(window.NativeScreenControl.isScreenPinningSupported());
  }
  return false;
}

/**
 * Initializes listeners for visibility change auto-reacquisition.
 */
export function initScreenLockSystem() {
  if (_isInitialized || typeof window === 'undefined') return;
  _isInitialized = true;

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible' && _isMatchOngoing) {
        // Tab / app restored to foreground during active combat - re-acquire lock
        await requestScreenWakeLock('visibilityRestore');
      }
    });
  }

  // Expose global controller for UI buttons, debugging, and terminal control
  window.ScreenLockSystem = {
    requestScreenWakeLock,
    releaseScreenWakeLock,
    isScreenWakeLockActive,
    syncWakeLockWithGameState,
    startScreenPinning,
    stopScreenPinning,
    isScreenPinningSupported
  };
}
