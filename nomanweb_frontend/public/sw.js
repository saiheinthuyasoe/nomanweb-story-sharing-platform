// Service Worker for NoManWeb
const CACHE_NAME = 'nomanweb-v1';
const STATIC_CACHE_NAME = 'nomanweb-static-v1';
const API_CACHE_NAME = 'nomanweb-api-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/logo.png',
  '/logo1.png',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/stories/trending',
  '/api/stories/featured',
  '/api/stories/popular',
  '/api/stories/categories',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(API_CACHE_NAME).then((cache) => {
        console.log('Preparing API cache');
        return Promise.resolve();
      })
    ])
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== API_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients immediately
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with fallback to cache
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Static assets - Cache First
    event.respondWith(handleStaticAssets(request));
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    // Other static resources - Cache First
    event.respondWith(handleStaticAssets(request));
  } else {
    // HTML pages - Network First with cache fallback
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests with Network First strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cacheName = API_CACHE_NAME;
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses for trending, featured, and popular stories
    if (networkResponse.ok && shouldCacheApiResponse(url.pathname)) {
      const cache = await caches.open(cacheName);
      // Clone the response before caching
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache for:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return a fallback response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable', 
        cached: false,
        message: 'Please check your internet connection' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets with Cache First strategy
async function handleStaticAssets(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Handle page requests with Network First strategy
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed for page, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to offline page or basic HTML
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>NoManWeb - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
              background: #f5f5f5;
            }
            .offline-message { 
              text-align: center; 
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .offline-message h1 { color: #333; margin-bottom: 1rem; }
            .offline-message p { color: #666; margin-bottom: 1.5rem; }
            .retry-btn {
              background: #007bff;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 4px;
              cursor: pointer;
              font-size: 1rem;
            }
            .retry-btn:hover { background: #0056b3; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button class="retry-btn" onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Determine if API response should be cached
function shouldCacheApiResponse(pathname) {
  return API_ENDPOINTS.some(endpoint => pathname.includes(endpoint)) ||
         pathname.includes('/stories/trending') ||
         pathname.includes('/stories/featured') ||
         pathname.includes('/stories/popular') ||
         pathname.includes('/stories/categories');
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  console.log('Performing background sync...');
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from NoManWeb',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/logo.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logo.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('NoManWeb', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});