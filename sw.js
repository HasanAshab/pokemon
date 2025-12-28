const CACHE_NAME = 'pokemon-game-v6';
const urlsToCache = [
  // Root pages
  './',
  './index.html',
  './battle.html',
  './enemy.html',
  './m_enemy.html',
  './poke_details.html',
  './storage.html',
  './compare.html',
  './data.html',
  './backup_ls.html',
  './offline.html',
  './pwa-debug.html',
  './friendly_match.html',

  // CSS files
  './assets/css/global.css',
  './assets/css/index.css',
  './assets/css/battle.css',
  './assets/css/enemy.css',
  './assets/css/move-card.css',
  './assets/css/multy-input-box.css',
  './assets/css/n_enemy.css',
  './assets/css/poke_details.css',
  './assets/css/friendly-match.css',

  // JavaScript files
  './assets/js/index.js',
  './assets/js/battle.js',
  './assets/js/enemy.js',
  './assets/js/n_enemy.js',
  './assets/js/poke_details.js',
  './assets/js/processor.js',
  './assets/js/test.js',
  './assets/js/friendly-match.js',
  './assets/js/utils/models.js',
  './assets/js/utils/helpers.js',
  './assets/js/utils/dom.js',
  './assets/js/utils/navigation.js',
  './assets/js/utils/battle.js',
  './assets/js/utils/damage.js',
  './assets/js/utils/event.js',
  './assets/js/pwa-helper.js',

  // SVG files
  './assets/svg/sword.svg',
  './assets/svg/arrow-down.svg',
  './assets/svg/arrow-up.svg',

  // Data files
  './data/abilities.js',
  './data/beasts.js',
  './data/humans.js',
  './data/items.js',
  './data/moves.js',
  './data/moves_text.js',
  './data/natures.js',
  './data/pokemons.js',
  './data/types.js',

  // Company section
  './company/index.html',
  './company/cms.html',
  './company/cms.css',
  './company/cms.js',
  './company/utils.js',

  // Stock market section
  './stock_market/index.html',
  './stock_market/script.js',
  './stock_market/cms.js',
  './stock_market/style.css',

  // Kingdoms section
  './kingdoms/index.html',
  './kingdoms/script.js',
  './kingdoms/styles.css',
  './kingdoms/utils.js',
  './kingdoms/war.js',
  './kingdoms/constraints.js',
  './kingdoms/network.html',
  './kingdoms/network.js',

  // Kingdoms CMS
  './kingdoms/cms/index.html',
  './kingdoms/cms/script.js',
  './kingdoms/cms/styles.css',

  // Kingdoms CMS - Buildings
  './kingdoms/cms/buildings/index.html',
  './kingdoms/cms/buildings/script.js',
  './kingdoms/cms/buildings/styles.css',

  // Kingdoms CMS - Storage
  './kingdoms/cms/storage/index.html',
  './kingdoms/cms/storage/script.js',
  './kingdoms/cms/storage/styles.css',

  // Kingdoms CMS - War
  './kingdoms/cms/war/index.html',
  './kingdoms/cms/war/script.js',
  './kingdoms/cms/war/styles.css',

  // Kingdoms CMS - Militia
  './kingdoms/cms/militia/index.html',
  './kingdoms/cms/militia/script.js',
  './kingdoms/cms/militia/styles.css',

  // Kingdoms CMS - Militia - Barrack
  './kingdoms/cms/militia/barrack/index.html',
  './kingdoms/cms/militia/barrack/script.js',
  './kingdoms/cms/militia/barrack/styles.css',

  // Kingdoms CMS - Militia - Barrack - Ammo
  './kingdoms/cms/militia/barrack/ammo/index.html',
  './kingdoms/cms/militia/barrack/ammo/script.js',
  './kingdoms/cms/militia/barrack/ammo/style.css',

  // Kingdoms CMS - Militia - Commanders
  './kingdoms/cms/militia/commanders/index.html',
  './kingdoms/cms/militia/commanders/script.js',
  './kingdoms/cms/militia/commanders/styles.css',

  // Kingdoms CMS - Militia - Defence
  './kingdoms/cms/militia/defence/index.html',

  // Shared files
  './shared/chart.js',

  // Manifest
  './manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');

  // Check if we're running on localhost or 127.0.0.1
  const isLocalhost = self.location.hostname === 'localhost' || 
                     self.location.hostname === '127.0.0.1' ||
                     self.location.hostname === '0.0.0.0';

  if (isLocalhost) {
    console.log('Running on localhost - skipping cache installation');
    // Force activation without caching
    event.waitUntil(self.skipWaiting());
    return;
  }

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache:', CACHE_NAME);
        console.log('Caching', urlsToCache.length, 'resources...');

        // Cache resources individually to handle failures gracefully
        return Promise.allSettled(
          urlsToCache.map(url =>
            cache.add(url).catch(error => {
              console.warn(`Failed to cache ${url}:`, error);
              return null; // Continue with other resources
            })
          )
        );
      })
      .then(results => {
        const successful = results.filter(result => result.status === 'fulfilled').length;
        const failed = results.filter(result => result.status === 'rejected').length;
        console.log(`Cache installation complete: ${successful} successful, ${failed} failed`);

        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Failed to open cache during install:', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Check if we're running on localhost or 127.0.0.1
  const isLocalhost = self.location.hostname === 'localhost' || 
                     self.location.hostname === '127.0.0.1' ||
                     self.location.hostname === '0.0.0.0';

  if (isLocalhost) {
    // On localhost, always fetch from network (no caching)
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if found
        if (response) {
          return response;
        }

        // For HTML requests with query parameters, try to match the base URL
        if (event.request.destination === 'document') {
          const url = new URL(event.request.url);
          const baseUrl = url.origin + url.pathname;

          // Try to match the base URL without query parameters
          return caches.match(baseUrl).then(baseResponse => {
            if (baseResponse) {
              return baseResponse;
            }

            // If no base match, try network
            return tryNetworkThenFallback(event.request);
          });
        }

        // For non-document requests, try network
        return tryNetworkThenFallback(event.request);
      })
  );
});

// Helper function to try network then fallback
function tryNetworkThenFallback(request) {
  // Check if we're running on localhost or 127.0.0.1
  const isLocalhost = self.location.hostname === 'localhost' || 
                     self.location.hostname === '127.0.0.1' ||
                     self.location.hostname === '0.0.0.0';

  const fetchRequest = request.clone();

  return fetch(fetchRequest).then(response => {
    // Check if we received a valid response
    if (!response || response.status !== 200 || response.type !== 'basic') {
      return response;
    }

    // Skip caching on localhost
    if (isLocalhost) {
      return response;
    }

    // Clone the response because it's a stream
    const responseToCache = response.clone();

    caches.open(CACHE_NAME)
      .then(cache => {
        cache.put(request, responseToCache);
      });

    return response;
  }).catch(() => {
    // If network fails, return appropriate fallback
    if (request.destination === 'document') {
      // For HTML pages, try to return the base page or offline page
      const url = new URL(request.url);
      const baseUrl = url.origin + url.pathname;

      return caches.match(baseUrl).then(baseResponse => {
        if (baseResponse) {
          return baseResponse;
        }
        return caches.match('/offline.html') || caches.match('/index.html');
      });
    }

    // For other resources, just fail
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  });
}

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated and ready!');
    })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle any background sync tasks here
      console.log('Background sync triggered')
    );
  }
});

// Message handler for cache status checks
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        urlsToCache.map(url => cache.match(url))
      );
    }).then(results => {
      const cached = results.filter(result => result !== undefined).length;
      const total = urlsToCache.length;

      event.ports[0].postMessage({
        type: 'CACHE_STATUS',
        cached: cached,
        total: total,
        percentage: Math.round((cached / total) * 100)
      });
    });
  }
});

// Push notifications (optional for future features)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/assets/img/icon-192.png',
      badge: '/assets/img/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});