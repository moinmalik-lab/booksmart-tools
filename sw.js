// BookSmartTools Service Worker v1.0
// Provides offline support, fast loading, and app-like experience

const CACHE_NAME = 'booksmartools-v1';
const STATIC_CACHE = 'booksmartools-static-v1';

// Core pages to cache immediately (app shell)
const APP_SHELL = [
  '/booksmart-tools/',
  '/booksmart-tools/index.html',
  '/booksmart-tools/tools.html',
  '/booksmart-tools/about.html',
  '/booksmart-tools/404.html',
  '/booksmart-tools/manifest.json',
];

// All tool pages — cached on first visit
const TOOL_PAGES = [
  '/booksmart-tools/payroll-tax-estimator.html',
  '/booksmart-tools/loan-amortization.html',
  '/booksmart-tools/quarterly-tax-calculator.html',
  '/booksmart-tools/profit-margin-calculator.html',
  '/booksmart-tools/mortgage-calculator.html',
  '/booksmart-tools/break-even-calculator.html',
  '/booksmart-tools/ebitda-calculator.html',
  '/booksmart-tools/overtime-calculator.html',
  '/booksmart-tools/net-pay-calculator.html',
  '/booksmart-tools/hourly-salary-converter.html',
  '/booksmart-tools/pto-calculator.html',
  '/booksmart-tools/401k-calculator.html',
  '/booksmart-tools/ar-aging-calculator.html',
  '/booksmart-tools/cash-flow-calculator.html',
  '/booksmart-tools/depreciation-calculator.html',
  '/booksmart-tools/self-employment-tax.html',
  '/booksmart-tools/1099-vs-w2-calculator.html',
  '/booksmart-tools/business-loan-calculator.html',
  '/booksmart-tools/roi-calculator.html',
  '/booksmart-tools/markup-margin-calculator.html',
  '/booksmart-tools/burn-rate-calculator.html',
  '/booksmart-tools/compound-interest.html',
  '/booksmart-tools/debt-payoff-calculator.html',
  '/booksmart-tools/savings-goal-calculator.html',
  '/booksmart-tools/budget-planner.html',
  '/booksmart-tools/invoice-late-fee-calculator.html',
  '/booksmart-tools/sales-tax-calculator.html',
  '/booksmart-tools/meals-tax-calculator.html',
  '/booksmart-tools/ecommerce-sales-tax-calculator.html',
  '/booksmart-tools/convert-to-pdf.html',
  '/booksmart-tools/pdf-merge.html',
  '/booksmart-tools/pdf-converter.html',
];

// ── Install: cache the app shell ──────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing BookSmartTools v1...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Install cache error:', err))
  );
});

// ── Activate: clean up old caches ─────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== STATIC_CACHE)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: serve from cache, fall back to network ─────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and external CDN requests (let them go to network)
  if (event.request.method !== 'GET') return;
  if (!url.origin.includes('github.io') && !url.pathname.startsWith('/booksmart-tools')) return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Serve from cache immediately, update cache in background
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
              }
              return networkResponse;
            })
            .catch(() => cachedResponse); // Stay with cache if network fails
          
          return cachedResponse; // Return cache immediately (stale-while-revalidate)
        }

        // Not in cache — fetch from network and cache it
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200) return response;
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
            return response;
          })
          .catch(() => {
            // Offline fallback for HTML pages
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/booksmart-tools/404.html');
            }
          });
      })
  );
});

// ── Background sync for analytics (optional) ──────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
