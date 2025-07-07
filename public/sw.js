const CACHE_NAME = 'sore-v2-cache-v1';
const STATIC_CACHE = 'sore-static-v2';
const DYNAMIC_CACHE = 'sore-dynamic-v2';
const API_CACHE = 'sore-api-v2';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  // Aggiungere qui icone e font
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/memories',
  '/api/moments',
  '/api/gallery',
  '/api/timeline',
  '/api/notifications',
];

// Strategia: pre-carica le rotte principali
const PRECACHE_ROUTES = [
    '/timeline',
    '/couples/setup',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        const allAssets = [...STATIC_ASSETS, ...PRECACHE_ROUTES];
        return cache.addAll(allAssets);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== STATIC_CACHE && 
                   cacheName !== DYNAMIC_CACHE && 
                   cacheName !== API_CACHE;
          })
          .map((cacheName) => {
            console.log(`Service Worker: Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignora le richieste non-GET
    if (request.method !== 'GET') {
        return;
    }

    // Strategia per le API: Network First, poi Cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request, API_CACHE));
        return;
    }
    
    // Strategia per le immagini e gli upload: Cache First
    if (request.destination === 'image' || url.pathname.includes('/uploads/')) {
        event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE));
        return;
    }

    // Strategia per gli asset statici (shell dell'app): Cache First
    if (STATIC_ASSETS.includes(url.pathname) || PRECACHE_ROUTES.includes(url.pathname)) {
        event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
        return;
    }

    // Strategia per tutto il resto (pagine, script, stili): Stale While Revalidate
    event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE));
});


// --- STRATEGIE DI CACHING ---

async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response(
      JSON.stringify({ error: 'Offline', message: 'Questa funzionalità non è disponibile offline' }),
      { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch from network:', request.url, error);
    // Potremmo voler restituire un'immagine/asset di fallback qui
    throw error;
  }
}

async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('Network request failed:', request.url, error);
      return null;
    });

  return cachedResponse || networkResponsePromise;
}


// --- GESTIONE MESSAGGI E BACKGROUND SYNC ---

// Logica di pre-caching intelligente su richiesta
const prefetchRoutes = async (routes) => {
    const cache = await caches.open(STATIC_CACHE);
    for (const route of routes) {
      try {
        const response = await cache.match(route);
        if (!response) {
            await cache.add(new Request(route, { mode: 'no-cors'}));
            console.log(`Service Worker: Prefetched route ${route}`);
        }
      } catch(e) {
        console.warn(`Could not prefetch route: ${route}`, e);
      }
    }
};

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PREFETCH_ROUTES') {
        prefetchRoutes(event.data.payload);
    }
});

// --- IndexedDB Logic (duplicated for Service Worker context) ---
const DB_NAME = 'SORE-V2-DB';
const DB_VERSION = 1;
const MOMENTO_STORE = 'momento-sync';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject('Error opening IndexedDB');
        request.onsuccess = (event) => resolve(event.target.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(MOMENTO_STORE)) {
                db.createObjectStore(MOMENTO_STORE, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

function getSyncQueue() {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(MOMENTO_STORE, 'readonly');
            const store = transaction.objectStore(MOMENTO_STORE);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error getting sync queue');
        });
    });
}

function clearSyncQueue() {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(MOMENTO_STORE, 'readwrite');
            const store = transaction.objectStore(MOMENTO_STORE);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject('Error clearing sync queue');
        });
    });
}

async function processSyncQueue() {
    try {
        const queue = await getSyncQueue();
        if (queue.length === 0) {
            console.log('Service Worker: Sync queue is empty.');
            return;
        }

        console.log(`Service Worker: Processing ${queue.length} items from sync queue.`);
        
        // In a real app, you would send this to your server.
        // For this example, we'll assume a fetch to a REST API endpoint.
        const response = await fetch('/api/momento/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(queue),
        });

        if (response.ok) {
            console.log('Service Worker: Sync successful, clearing queue.');
            await clearSyncQueue();
        } else {
            console.error('Service Worker: Sync failed, server responded with:', response.status);
            // Optionally, implement retry logic here. For now, we leave items in the queue.
        }
    } catch (error) {
        console.error('Service Worker: Error processing sync queue:', error);
    }
}


// Background Sync for uploads and momento data
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-uploads') {
      event.waitUntil(
        // Qui andrà la logica per riprovare gli upload in background
        console.log('Service Worker: Background sync event triggered for "sync-uploads".')
      );
    }
    if (event.tag === 'sync-momento-data') {
        console.log('Service Worker: Background sync event triggered for "sync-momento-data".');
        event.waitUntil(processSyncQueue());
    }
});

// Push event - show a notification
self.addEventListener('push', (event) => {
    let data = { title: 'Nuovo Messaggio', body: 'Hai ricevuto un nuovo messaggio!', icon: '/icons/icon-192x192.png' };
    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        console.error('Push event data is not valid JSON:', e);
    }

    const title = data.title || 'SORE';
    const options = {
        body: data.body || 'Notifica da SORE',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
        },
        actions: [
            { action: 'explore', title: 'Apri' },
            { action: 'close', title: 'Chiudi' },
        ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore' || !event.action) {
        const urlToOpen = event.notification.data.url || '/';
        event.waitUntil(
            clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            }).then((clientList) => {
                if (clientList.length > 0) {
                    let client = clientList[0];
                    for (let i = 0; i < clientList.length; i++) {
                        if (clientList[i].focused) {
                            client = clientList[i];
                        }
                    }
                    return client.focus().then(c => c.navigate(urlToOpen));
                }
                return clients.openWindow(urlToOpen);
            })
        );
    }
});

console.log('Service Worker: Loaded successfully'); 