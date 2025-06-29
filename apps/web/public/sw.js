const CACHE_NAME = 'tradementor-v1';
const STATIC_CACHE = 'tradementor-static-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/_next/static/css/app/globals.css',
  // Add more static files as needed
];

// API routes that should be cached
const API_CACHE_PATTERNS = [
  /^https?:\/\/.*\/api\/emotions$/,
  /^https?:\/\/.*\/api\/trades$/,
  /^https?:\/\/.*\/api\/patterns\/.*$/
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Service Worker: Caching static files');
      return cache.addAll(STATIC_FILES);
    }).catch((error) => {
      console.error('Service Worker: Failed to cache static files', error);
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients immediately
  return self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (request.method === 'GET') {
    // Static files - cache first strategy
    if (isStaticFile(url)) {
      event.respondWith(cacheFirst(request));
    }
    // API calls - network first with cache fallback
    else if (isApiCall(url)) {
      event.respondWith(networkFirstWithCache(request));
    }
    // Other requests - network first
    else {
      event.respondWith(networkFirst(request));
    }
  }
  // POST/PUT/DELETE requests - network only
  else {
    event.respondWith(networkOnly(request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'emotion-sync') {
    event.waitUntil(syncEmotionChecks());
  } else if (event.tag === 'trade-sync') {
    event.waitUntil(syncTrades());
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from TradeMentor',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('TradeMentor', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Helper functions
function isStaticFile(url) {
  return url.pathname.includes('/_next/static') ||
         url.pathname.includes('/icons/') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.ico');
}

function isApiCall(url) {
  return url.pathname.startsWith('/api/') ||
         API_CACHE_PATTERNS.some(pattern => pattern.test(url.href));
}

// Cache first strategy - good for static files
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network first with cache fallback - good for API calls
async function networkFirstWithCache(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Only cache successful GET responses
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache for:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for failed API calls
    if (request.url.includes('/api/')) {
      return new Response(JSON.stringify({
        error: 'Offline - please try again when connected',
        offline: true
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy - for pages and other requests
async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Network only strategy - for POST/PUT/DELETE requests
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Store failed requests for background sync
    if (request.method === 'POST' || request.method === 'PUT') {
      await storeFailedRequest(request);
    }
    
    return new Response(JSON.stringify({
      error: 'Request failed - will retry when online',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Store failed requests for background sync
async function storeFailedRequest(request) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['failed_requests'], 'readwrite');
    const store = transaction.objectStore('failed_requests');
    
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    };
    
    await store.add(requestData);
    console.log('Stored failed request for sync:', requestData);
  } catch (error) {
    console.error('Failed to store request for sync:', error);
  }
}

// Background sync functions
async function syncEmotionChecks() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['failed_requests'], 'readonly');
    const store = transaction.objectStore('failed_requests');
    const requests = await store.getAll();
    
    const emotionRequests = requests.filter(req => 
      req.url.includes('/api/emotions') && req.method === 'POST'
    );
    
    for (const requestData of emotionRequests) {
      try {
        await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        // Remove successful request from storage
        const deleteTransaction = db.transaction(['failed_requests'], 'readwrite');
        const deleteStore = deleteTransaction.objectStore('failed_requests');
        await deleteStore.delete(requestData.id);
        
        console.log('Successfully synced emotion check');
      } catch (error) {
        console.error('Failed to sync emotion check:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function syncTrades() {
  // Similar implementation for trade sync
  console.log('Syncing trades...');
}

// IndexedDB helper
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TradeMentorDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('failed_requests')) {
        const store = db.createObjectStore('failed_requests', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}
