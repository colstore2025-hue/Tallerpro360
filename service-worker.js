/*
========================================
SERVICE WORKER: TallerPRO360 Nexus-X
Version: v10 (Optimized Network-First)
========================================
*/

const CACHE_VERSION = "v10";
const STATIC_CACHE = `nexus-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `nexus-dynamic-${CACHE_VERSION}`;

// Sincronizado con tus archivos reales en /assets
const STATIC_ASSETS = [
  "/",
  "/login.html",
  "/app/index.html",
  "/manifest.json",
  "/assets/logo-192.png",
  "/assets/logo-512.png",
  "/assets/logo-tallerpro360.png", 
  "/assets/favicon.png",
  "https://cdn.tailwindcss.com"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Ignorar Firebase para evitar conflictos de tiempo real
  if (url.origin.includes("firebase") || url.origin.includes("gstatic")) return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        return caches.open(DYNAMIC_CACHE).then(cache => {
          // Solo cacheamos si la respuesta es válida
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
            limitCacheSize(DYNAMIC_CACHE, 40); 
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // Si falla la red (offline), buscamos en cualquier caché disponible
        return caches.match(event.request).then(response => {
          return response || caches.match("/login.html");
        });
      })
  );
});

async function limitCacheSize(name, size) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > size) {
    await cache.delete(keys[0]);
    limitCacheSize(name, size);
  }
}

// Bloque de Notificaciones Push (Listo para el futuro)
self.addEventListener("push", event => {
  const data = event.data ? event.data.json() : { title: "Nexus-X", body: "Actualización de Sistema" };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/assets/logo-192.png",
      badge: "/assets/logo-192.png"
    })
  );
});
