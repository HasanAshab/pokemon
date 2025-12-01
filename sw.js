const CACHE_NAME = 'pokemon-game-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/battle.html',
  '/enemy.html',
  '/m_enemy.html',
  '/poke_details.html',
  '/storage.html',
  '/compare.html',
  '/data.html',
  '/backup_ls.html',
  
  // CSS files
  '/assets/css/global.css',
  '/assets/css/index.css',
  '/assets/css/battle.css',
  '/assets/css/enemy.css',
  '/assets/css/move-card.css',
  '/assets/css/multy-input-box.css',
  '/assets/css/n_enemy.css',
  '/assets/css/poke_details.css',
  
  // JavaScript files
  '/assets/js/index.js',
  '/assets/js/battle.js',
  '/assets/js/enemy.js',
  '/assets/js/n_enemy.js',
  '/assets/js/poke_details.js',
  '/assets/js/processor.js',
  '/assets/js/test.js',
  '/assets/js/utils/models.js',
  '/assets/js/utils/helpers.js',
  '/assets/js/utils/dom.js',
  
  // SVG files
  '/assets/svg/sword.svg',
  '/assets/svg/arrow-down.svg',
  '/assets/svg/arrow-up.svg',
  
  // Data files
  '/data/abilities.js',
  '/data/beasts.js',
  '/data/humans.js',
  '/data/items.js',
  '/data/moves.js',
  '/data/moves_text.js',
  '/data/natures.js',
  '/data/pokemons.js',
  '/data/types.js',
  
  // Company section
  '/company/index.html',
  '/company/cms.html',
  '/company/cms.css',
  '/company/cms.js',
  '/company/utils.js',
  
  // Stock market section
  '/stock_market/index.html',
  
  // Kingdoms section
  '/kingdoms/',
  
  // Manifest
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache resources during install:', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response because it's a stream
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          // If both cache and network fail, return a custom offline page
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
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