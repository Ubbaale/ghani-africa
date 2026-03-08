const CACHE_NAME = 'ghani-africa-v3';
const STATIC_CACHE = 'ghani-static-v3';
const IMAGE_CACHE = 'ghani-images-v1';
const OFFLINE_QUEUE = 'ghani-offline-queue';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.png'
];

const CACHEABLE_API_PATHS = [
  '/api/products',
  '/api/categories',
  '/api/currencies',
  '/api/products/featured',
  '/api/advertisements',
  '/api/trade-expo-ads/active'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, STATIC_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

function shouldCacheApiResponse(pathname) {
  return CACHEABLE_API_PATHS.some(p => pathname.startsWith(p));
}

function isImageRequest(url) {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i) ||
    url.hostname.includes('unsplash.com') ||
    url.hostname.includes('images.unsplash.com') ||
    url.hostname.includes('storage.googleapis.com');
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') {
    if (!navigator.onLine || !self.navigator?.onLine) {
      event.respondWith(
        (async () => {
          try {
            return await fetch(event.request);
          } catch (e) {
            const body = await event.request.clone().text();
            const queue = await getOfflineQueue();
            queue.push({
              url: event.request.url,
              method: event.request.method,
              headers: Object.fromEntries(event.request.headers.entries()),
              body: body,
              timestamp: Date.now()
            });
            await saveOfflineQueue(queue);
            notifyClients({ type: 'QUEUED_OFFLINE', count: queue.length });
            return new Response(JSON.stringify({ queued: true, message: 'Action saved for when you are back online' }), {
              status: 202,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        })()
      );
    }
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok && shouldCacheApiResponse(url.pathname)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) {
              notifyClients({ type: 'SERVING_CACHED', path: url.pathname });
              return cached;
            }
            return new Response(JSON.stringify({ error: 'You appear to be offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request)
          .then((cached) => cached || caches.match('/'))
          .then((r) => r || new Response('Offline', { headers: { 'Content-Type': 'text/html' } }))
        )
    );
    return;
  }

  if (isImageRequest(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(event.request, clone);
              trimCache(IMAGE_CACHE, 200);
            });
          }
          return response;
        }).catch(() => {
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  if (url.pathname.match(/\.(js|css|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_PRODUCT') {
    const productUrl = event.data.url;
    if (productUrl) {
      fetch(productUrl)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(productUrl, clone);
              notifyClients({ type: 'PRODUCT_CACHED', url: productUrl });
            });
          }
        })
        .catch(() => {});
    }
  }

  if (event.data?.type === 'SYNC_OFFLINE_QUEUE') {
    processOfflineQueue();
  }
});

async function getOfflineQueue() {
  try {
    const cache = await caches.open(OFFLINE_QUEUE);
    const response = await cache.match('queue');
    if (response) {
      return await response.json();
    }
  } catch (e) {}
  return [];
}

async function saveOfflineQueue(queue) {
  const cache = await caches.open(OFFLINE_QUEUE);
  await cache.put('queue', new Response(JSON.stringify(queue)));
}

async function processOfflineQueue() {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return;

  const remaining = [];
  for (const item of queue) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body
      });
    } catch (e) {
      remaining.push(item);
    }
  }
  await saveOfflineQueue(remaining);
  notifyClients({ type: 'QUEUE_PROCESSED', remaining: remaining.length, processed: queue.length - remaining.length });
}

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    for (let i = 0; i < keys.length - maxItems; i++) {
      await cache.delete(keys[i]);
    }
  }
}

function notifyClients(message) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage(message));
  });
}
