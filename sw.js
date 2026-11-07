// ─────────────────────────────────────────────
// RAMBALL FIGHT SIMULATOR — PWA SERVICE WORKER
// Two-tier cache architecture:
// 1. SHELL_CACHE: Code, markup & CSS (auto-invalidated on code deploys)
// 2. ASSETS_CACHE: Persistent static textures & assets (survives code deploys; invalidated on version bumps)
// ─────────────────────────────────────────────

const SHELL_CACHE = 'foc-shell-v1.0.11';
const ASSETS_CACHE = 'foc-assets-v1.0.11';

// Minimal core application shell assets pre-cached on install
const PRECACHE_SHELL_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './manifest.json'
];

// Maximum single asset file size to store in Cache Storage (protects iOS Safari quota)
const MAX_CACHEABLE_ASSET_BYTES = 3 * 1024 * 1024; // 3MB

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      // Use allSettled so no single asset 404 aborts precaching
      await Promise.allSettled(
        PRECACHE_SHELL_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn('[SW] Precache item skip:', asset, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== SHELL_CACHE && key !== ASSETS_CACHE) {
            console.log('[SW] Purging stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only intercept GET requests from http / https schemes
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  const isSameOrigin = url.origin === self.location.origin;

  // 1. Navigation requests: Network-First to guarantee fresh HTML on deployments,
  // falling back to cached index.html when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkResp) => {
          if (networkResp && networkResp.status === 200) {
            const copy = networkResp.clone();
            caches.open(SHELL_CACHE).then((cache) => {
              cache.put('./index.html', copy).catch(() => {});
            });
          }
          return networkResp;
        })
        .catch(() => {
          return caches.match('./index.html');
        })
    );
    return;
  }

  // 2. Static Assets & Resources: Cache-First
  // Exclude audio files from SW cache storage (Web Audio API / sound system has dedicated LRU memory caching;
  // storing 100MB of audio in Safari SW Cache Storage triggers QuotaExceededError).
  const isAudio = /\.(mp3|wav|ogg)($|\?)/i.test(url.pathname);
  if (isAudio) return; // Allow normal browser media caching

  // Path allowlist for caching
  const isAllowedPath =
    url.pathname.includes('/Assets/') ||
    url.pathname.includes('/css/') ||
    url.pathname.includes('/js/') ||
    url.pathname.includes('/libs/') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/';

  if (!isSameOrigin || !isAllowedPath) return;

  const isCode = url.pathname.includes('/js/') || url.pathname.includes('/css/') || url.pathname.endsWith('.json');

  // Code files: Network-First to guarantee instant updates on code deploys, falling back to cache when offline
  if (isCode) {
    event.respondWith(
      fetch(req)
        .then((networkResp) => {
          if (networkResp && networkResp.status === 200) {
            const copy = networkResp.clone();
            caches.open(SHELL_CACHE).then((cache) => {
              cache.put(req, copy).catch(() => {});
            });
          }
          return networkResp;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 3. Static Media Assets & Libraries: Cache-First
  event.respondWith(
    caches.match(req).then((cachedResp) => {
      if (cachedResp) {
        return cachedResp;
      }

      return fetch(req).then((networkResp) => {
        if (networkResp && networkResp.status === 200) {
          // Check response size to avoid bloating cache on iOS
          const contentLength = networkResp.headers.get('content-length');
          if (contentLength && parseInt(contentLength, 10) > MAX_CACHEABLE_ASSET_BYTES) {
            return networkResp; // Skip oversized asset
          }

          const respClone = networkResp.clone();
          const targetCacheName = url.pathname.includes('/Assets/') ? ASSETS_CACHE : SHELL_CACHE;

          caches.open(targetCacheName).then((cache) => {
            cache.put(req, respClone).catch(() => {}); // Safe catch for storage quotas
          });
        }
        return networkResp;
      });
    })
  );
});
