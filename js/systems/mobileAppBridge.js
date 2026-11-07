// ─────────────────────────────────────────────
// MOBILE APP BRIDGE (Capacitor Native Platform Integration)
// Provides hardware-accelerated mobile features:
// - True native fullscreen with status bar overlays
// - Physical device haptics (Taptic Engine on iOS / Vibration on Android)
// - Native splash screen dismissal
// - Dynamic orientation locking
// 
// Universal Browser & Bundler-Free Standard:
// In native Capacitor apps (iOS/Android), `window.Capacitor` is automatically
// injected by the native runtime at document start. In standard web browsers
// and desktop Electron, this module gracefully falls back with zero runtime
// errors and zero bare-module resolution failures.
// ─────────────────────────────────────────────

function getCapacitor() {
  if (typeof window !== 'undefined' && window.Capacitor) {
    return window.Capacitor;
  }
  return null;
}

export function isNativePlatform() {
  const cap = getCapacitor();
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

export function getPlatform() {
  const cap = getCapacitor();
  return cap && typeof cap.getPlatform === 'function' ? cap.getPlatform() : 'web';
}

export const isNativeApp = isNativePlatform();
export const nativePlatform = getPlatform();

let _isBridgeInitialized = false;

/**
 * Initializes native mobile app subsystems (Status bar, Splash screen).
 * Strict safe no-op when running in desktop Electron or web browser.
 */
export async function initMobileAppBridge() {
  if (_isBridgeInitialized) return;
  _isBridgeInitialized = true;

  const cap = getCapacitor();
  if (!cap || !cap.isNativePlatform?.()) return;

  const plugins = cap.Plugins || {};

  try {
    // 1. Hide native splash screen once game engine and title screen are ready
    if (plugins.SplashScreen && typeof plugins.SplashScreen.hide === 'function') {
      await plugins.SplashScreen.hide({ fadeOutDuration: 400 }).catch(() => {});
    }

    // 2. Configure native status bar for immersive dark combat
    if (plugins.StatusBar) {
      if (typeof plugins.StatusBar.setStyle === 'function') {
        await plugins.StatusBar.setStyle({ style: 'DARK' }).catch(() => {});
      }
      if (typeof plugins.StatusBar.setOverlaysWebView === 'function') {
        await plugins.StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      }
      if (typeof plugins.StatusBar.setBackgroundColor === 'function') {
        await plugins.StatusBar.setBackgroundColor({ color: '#000000' }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[MobileAppBridge] Native initialization warning:', err);
  }
}

import { state } from '../core/state.js';

let _lastLightHapticTime = 0;
const _hasWebVibrate = (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function');

/**
 * Triggers physical device tactile feedback / vibration.
 * Synchronous fast-path: zero Promise allocation and zero syscall overhead when haptics are unavailable.
 * @param {'light'|'medium'|'heavy'|'impact'|'success'|'warning'|'error'|'selection'} type
 */
export function triggerHaptic(type = 'light') {
  if (!isNativeApp && !_hasWebVibrate) return;
  if (typeof state !== 'undefined' && state.enableHaptics === false) return;

  if (type === 'light') {
    const now = Date.now();
    // 90ms retrigger gate to prevent continuous motor buzzing during rapid flurries
    if (now - _lastLightHapticTime < 90) return;
    _lastLightHapticTime = now;
  }

  const cap = getCapacitor();
  const plugins = cap?.Plugins || {};

  if (cap?.isNativePlatform?.() && plugins.Haptics) {
    try {
      switch (type) {
        case 'heavy':
        case 'impact':
          plugins.Haptics.impact({ style: 'HEAVY' })?.catch?.(() => {});
          break;
        case 'medium':
          plugins.Haptics.impact({ style: 'MEDIUM' })?.catch?.(() => {});
          break;
        case 'light':
          plugins.Haptics.impact({ style: 'LIGHT' })?.catch?.(() => {});
          break;
        case 'success':
          plugins.Haptics.notification({ type: 'SUCCESS' })?.catch?.(() => {});
          break;
        case 'error':
          plugins.Haptics.notification({ type: 'ERROR' })?.catch?.(() => {});
          break;
        case 'selection':
          if (typeof plugins.Haptics.selectionChanged === 'function') {
            plugins.Haptics.selectionChanged()?.catch?.(() => {});
          }
          break;
        default:
          plugins.Haptics.impact({ style: 'LIGHT' })?.catch?.(() => {});
          break;
      }
    } catch (e) {}
    return;
  }

  // Graceful fallback for mobile web browsers with Vibration API
  if (_hasWebVibrate) {
    try {
      const duration = (type === 'heavy' || type === 'impact') ? 35 : (type === 'medium' ? 20 : (type === 'selection' ? 5 : 10));
      navigator.vibrate(duration);
    } catch (e) {}
  }
}
