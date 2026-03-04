const CACHE_NAME = "tallerpro360-v6";
const OFFLINE_URL = "/index.html";

const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/taller.html",
  "/cliente.html",
  "/ceo.html",
  "/login.html",
  "/manifest.json",
  "/assets/logo-192.png",
  "/assets/logo-512.png",
  "/assets/logo-180.png",
  "/assets/favicon.png"
];

// ===============================
// 🚀 INSTALACIÓN
// ===============================
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("🚀 TallerPRO360: Infraestructura lista");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ===============================
// 🛰️ ACTIVACIÓN
// ===============================
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
  console.log("🛰️ TallerPRO360 activo");
});

// ===============================
// 🌐 FETCH - Estrategia Inteligente
// ===============================
self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {

      const networkFetch = fetch(event.request)
        .then(networkResponse => {

          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });

          return networkResponse;
        })
        .catch(() => {
          console.log("⚠️ Modo offline activo");
          return cachedResponse || caches.match(OFFLINE_URL);
        });

      return cachedResponse || networkFetch;
    })
  );
});