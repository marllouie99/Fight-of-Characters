// ─────────────────────────────────────────────
// MOBILE APP BRIDGE (Capacitor Native Platform Integration)
// Provides hardware-accelerated mobile features:
// - True native fullscreen with status bar overlays
// - Physical device haptics (Taptic Engine on iOS / Vibration on Android)
// - Native splash screen dismissal
// - Dynamic orientation locking
// ─────────────────────────────────────────────

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const isNativeApp = Capacitor.isNativePlatform();
export const nativePlatform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

let _isBridgeInitialized = false;

/**
 * Initializes native mobile app subsystems (Status bar, Splash screen).
 * Strict safe no-op when running in desktop Electron or web browser.
 */
export async function initMobileAppBridge() {
  if (!isNativeApp || _isBridgeInitialized) return;
  _isBridgeInitialized = true;

  try {
    // 1. Hide native splash screen once game engine and title screen are ready
    await SplashScreen.hide({ fadeOutDuration: 400 }).catch(() => {});

    // 2. Configure native status bar for immersive dark combat
    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    await StatusBar.setBackgroundColor({ color: '#000000' }).catch(() => {});
  } catch (err) {
    console.warn('[MobileAppBridge] Native initialization warning:', err);
  }
}

/**
 * Triggers physical device tactile feedback / vibration.
 * @param {'light'|'medium'|'heavy'|'impact'|'success'|'warning'|'error'|'selection'} type
 */
export async function triggerHaptic(type = 'light') {
  if (isNativeApp) {
    try {
      switch (type) {
        case 'heavy':
        case 'impact':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
        case 'selection':
          await Haptics.selectionChanged();
          break;
        default:
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
      }
    } catch (e) {}
    return;
  }

  // Graceful fallback for mobile web browsers with Vibration API
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      const duration = (type === 'heavy' || type === 'impact') ? 35 : (type === 'medium' ? 20 : 10);
      navigator.vibrate(duration);
    } catch (e) {}
  }
}
