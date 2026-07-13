const CACHE_NAME = 'tourenvi-offline-cache-v1';
const DB_NAME = 'TourenviOfflineDB';
const DB_VERSION = 1;

// Files to cache for offline app shell
const urlsToCache = [
  '/',
  '/index.html',
  // Normally you would inject Vite output files here
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Intercept network requests and cache map geometries, cost structures, and JSON
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Example: Intercepting trips data to save to IndexedDB
  if (requestUrl.pathname.includes('/api/trips') || requestUrl.pathname.includes('firestore.googleapis.com')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response so we can read it and return it
          const clonedResponse = response.clone();
          
          if (event.request.method === 'GET' && response.ok) {
            clonedResponse.json().then((data) => {
              saveToIndexedDB('itineraries', data);
            }).catch(err => console.log('Not a JSON response', err));
          }
          
          return response;
        })
        .catch(async () => {
          // Network failed, fallback to IndexedDB
          console.log('Network failed, falling back to offline IndexedDB data');
          // For simplicity in service worker, return a custom offline response
          // A real implementation might use a message channel to the main thread
          return new Response(JSON.stringify({ offline: true, message: 'Currently offline.' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Generic Cache First Strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response; // Return from cache
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache dynamic resources like map tiles if needed, but be careful with storage size
        if (event.request.url.includes('maps.googleapis.com')) {
           const cloned = networkResponse.clone();
           caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for navigation requests
      });
    })
  );
});

// Helper for IndexedDB storage
function saveToIndexedDB(storeName, data) {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('itineraries')) {
      db.createObjectStore('itineraries', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('mapGeometries')) {
      db.createObjectStore('mapGeometries', { keyPath: 'tripId' });
    }
  };

  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Depending on if data is an array or single object
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (item.id) store.put(item);
      });
    } else if (data.id) {
      store.put(data);
    }
  };

  request.onerror = (event) => {
    console.error('IndexedDB error:', event.target.error);
  };
}
