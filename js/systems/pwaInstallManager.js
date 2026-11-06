/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PWA INSTALL MANAGER
 * Manages Progressive Web App (PWA) Add-to-Home-Screen workflows:
 * - Listens for beforeinstallprompt event on Android / Chromium
 * - Surfaces seamless 1-tap "INSTALL" button on mobileQuickBar
 * - Surfaces non-intrusive floating install banner with 5-day snooze
 * - Handles iOS Safari "Share -> Add to Home Screen" instructions
 * - Suppresses all prompts when running in standalone PWA mode
 * ─────────────────────────────────────────────────────────────────────────────
 */

let deferredInstallPrompt = null;
let pwaInitialized = false;

const SNOOZE_KEY = 'foc_pwa_install_snoozed_until';
const SNOOZE_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

/**
 * Checks whether the app is currently running as an installed standalone PWA.
 */
export function isStandalone() {
  if (typeof window === 'undefined') return false;
  if (window.navigator?.standalone === true) return true; // iOS Safari standalone
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true; // Standard PWA
  if (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) return true;
  return false;
}

/**
 * Checks if the current browser is iOS Safari where beforeinstallprompt is absent.
 */
export function isIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isWebkit = /WebKit/i.test(ua);
  const isOtherBrowser = /CriOS|FxiOS|OPiOS|mercury/i.test(ua);
  return isIos && isWebkit && !isOtherBrowser;
}

/**
 * Checks whether the user has snoozed the install banner.
 */
function isInstallSnoozed() {
  try {
    const snoozedUntil = parseInt(localStorage.getItem(SNOOZE_KEY) || '0', 10);
    return Date.now() < snoozedUntil;
  } catch (e) {
    return false;
  }
}

/**
 * Sets a snooze timestamp so the banner does not bother the user again for 5 days.
 */
export function snoozeInstallPrompt() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DURATION_MS));
  } catch (e) {}
}

/**
 * Hides the floating install banner.
 */
export function hidePwaInstallBanner() {
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) {
    banner.classList.remove('pwa-banner-visible');
    setTimeout(() => {
      if (banner && !banner.classList.contains('pwa-banner-visible')) {
        banner.style.display = 'none';
      }
    }, 300);
  }
}

/**
 * Shows the floating install banner if installable and not snoozed.
 */
export function showPwaInstallBanner(force = false) {
  if (isStandalone()) return;
  if (!force && isInstallSnoozed()) return;

  const banner = document.getElementById('pwaInstallBanner');
  if (!banner) return;

  // Customize description based on platform
  const descEl = document.getElementById('pwaBannerDesc');
  const actionBtn = document.getElementById('pwaInstallActionBtn');
  if (isIosSafari() && !deferredInstallPrompt) {
    if (descEl) descEl.textContent = 'Tap Share ⎋ then "Add to Home Screen" ⊞ for fullscreen!';
    if (actionBtn) actionBtn.textContent = 'HOW TO';
  } else {
    if (descEl) descEl.textContent = 'Play fullscreen with zero lag & offline instant boot!';
    if (actionBtn) actionBtn.textContent = 'INSTALL';
  }

  banner.style.display = 'flex';
  // Force reflow for smooth CSS transition
  void banner.offsetWidth;
  banner.classList.add('pwa-banner-visible');
}

/**
 * Triggers the browser install prompt or shows the iOS helper dialog.
 */
export async function promptPwaInstall() {
  if (deferredInstallPrompt) {
    try {
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        hidePwaInstallBanner();
        updateQuickBarInstallButton(false);
      }
    } catch (err) {
      console.warn('[PWA] Prompt error:', err);
    } finally {
      deferredInstallPrompt = null;
    }
  } else if (isIosSafari()) {
    showIosInstallModal();
  } else {
    showPwaInstallBanner(true);
  }
}

/**
 * Displays a lightweight modal showing step-by-step instructions for iOS Safari.
 */
function showIosInstallModal() {
  let modal = document.getElementById('pwaIosModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'pwaIosModal';
    modal.className = 'pwa-ios-modal';
    modal.innerHTML = `
      <div class="pwa-ios-modal-card">
        <div class="pwa-ios-modal-header">
          <span class="pwa-ios-modal-title">📲 Install on iPhone / iPad</span>
          <button class="pwa-ios-modal-close" id="pwaIosModalClose">✕</button>
        </div>
        <div class="pwa-ios-modal-body">
          <p class="pwa-ios-step"><strong>1.</strong> Tap the <strong>Share</strong> button <span class="pwa-ios-icon">⎋</span> in Safari's bottom toolbar.</p>
          <p class="pwa-ios-step"><strong>2.</strong> Scroll down and select <strong>"Add to Home Screen"</strong> <span class="pwa-ios-icon">⊞</span>.</p>
          <p class="pwa-ios-step"><strong>3.</strong> Tap <strong>Add</strong> in the top right to play fullscreen anytime!</p>
        </div>
        <button class="pwa-ios-modal-gotit" id="pwaIosModalGotIt">GOT IT!</button>
      </div>
    `;
    document.body.appendChild(modal);

    const close = () => {
      modal.classList.remove('pwa-modal-visible');
      snoozeInstallPrompt();
    };
    document.getElementById('pwaIosModalClose')?.addEventListener('click', close);
    document.getElementById('pwaIosModalGotIt')?.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
  }

  modal.classList.add('pwa-modal-visible');
}

/**
 * Shows or hides the QuickBar install button.
 */
function updateQuickBarInstallButton(show) {
  const quickBtn = document.getElementById('quickBtnInstall');
  if (quickBtn) {
    quickBtn.style.display = show ? 'flex' : 'none';
  }
}

/**
 * Initializes the PWA Install Manager event listeners and DOM bindings.
 */
export function initPwaInstallManager() {
  if (pwaInitialized || typeof window === 'undefined') return;
  pwaInitialized = true;

  if (isStandalone()) {
    updateQuickBarInstallButton(false);
    hidePwaInstallBanner();
    return;
  }

  // 1. Capture beforeinstallprompt for Android & Chromium browsers
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    updateQuickBarInstallButton(true);

    // If on a touch device and not snoozed, auto-show the banner after 3 seconds of playtime
    if (!isInstallSnoozed()) {
      setTimeout(() => {
        if (deferredInstallPrompt && !isStandalone()) {
          showPwaInstallBanner(false);
        }
      }, 3500);
    }
  });

  // 2. Track when app is installed successfully
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    hidePwaInstallBanner();
    updateQuickBarInstallButton(false);
    console.log('🎉 [PWA] Fight of Characters installed to home screen successfully!');
  });

  // 3. Bind UI banner actions
  const bannerInstallBtn = document.getElementById('pwaInstallActionBtn');
  if (bannerInstallBtn) {
    bannerInstallBtn.addEventListener('click', () => {
      promptPwaInstall();
    });
  }

  const bannerDismissBtn = document.getElementById('pwaDismissBtn');
  if (bannerDismissBtn) {
    bannerDismissBtn.addEventListener('click', () => {
      snoozeInstallPrompt();
      hidePwaInstallBanner();
    });
  }

  const quickBtnInstall = document.getElementById('quickBtnInstall');
  if (quickBtnInstall) {
    quickBtnInstall.addEventListener('click', () => {
      promptPwaInstall();
    });
  }

  // 4. On iOS Safari, show the QuickBar install button if not standalone
  if (isIosSafari() && !isStandalone()) {
    updateQuickBarInstallButton(true);
  }
}
