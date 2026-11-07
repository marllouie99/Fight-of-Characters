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

/**
 * Triggers physical device tactile feedback / vibration.
 * Throttles high-frequency light ticks to prevent continuous motor buzz.
 * @param {'light'|'medium'|'heavy'|'impact'|'success'|'warning'|'error'|'selection'} type
 */
export async function triggerHaptic(type = 'light') {
  if (typeof state !== 'undefined' && state.enableHaptics === false) return;

  const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
  if (type === 'light') {
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
          await plugins.Haptics.impact({ style: 'HEAVY' });
          break;
        case 'medium':
          await plugins.Haptics.impact({ style: 'MEDIUM' });
          break;
        case 'light':
          await plugins.Haptics.impact({ style: 'LIGHT' });
          break;
        case 'success':
          await plugins.Haptics.notification({ type: 'SUCCESS' });
          break;
        case 'error':
          await plugins.Haptics.notification({ type: 'ERROR' });
          break;
        case 'selection':
          if (typeof plugins.Haptics.selectionChanged === 'function') {
            await plugins.Haptics.selectionChanged();
          }
          break;
        default:
          await plugins.Haptics.impact({ style: 'LIGHT' });
          break;
      }
    } catch (e) {}
    return;
  }

  // Graceful fallback for mobile web browsers with Vibration API
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      const duration = (type === 'heavy' || type === 'impact') ? 35 : (type === 'medium' ? 20 : (type === 'selection' ? 5 : 10));
      navigator.vibrate(duration);
    } catch (e) {}
  }
}
