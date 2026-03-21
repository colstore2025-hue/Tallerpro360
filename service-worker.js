/*
========================================
SERVICE WORKER: TallerPRO360 ERP SaaS
Version: v9 (Network First Strategy)
========================================
*/

const CACHE_VERSION = "v9";
const STATIC_CACHE = `tallerpro360-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `tallerpro360-dynamic-${CACHE_VERSION}`;
const OFFLINE_URL = "/login.html";

const STATIC_ASSETS = [
  "/",
  "/login.html",
  "/app/index.html",
  "/admin/ceo-dashboard.html",
  "/manifest.json",
  "/assets/logo-192.png",
  "/assets/logo-512.png",
  "/assets/favicon.png"
];

/* ===============================
   INSTALL: Limpieza inmediata
   =============================== */
self.addEventListener("install", event => {
  console.log("🚀 SW v9: Instalando y Cacheando Estáticos");
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting(); // Fuerza a la nueva versión a tomar el control
});

/* ===============================
   ACTIVATE: Borrar versiones viejas
   =============================== */
self.addEventListener("activate", event => {
  console.log("🛰️ SW v9: Activado. Limpiando cachés antiguas...");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* ===============================
   ESTRATEGIA DE CARGA (FETCH)
   =============================== */
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 1. FIREBASE / GOOGLE FONTS: Directo a la red siempre
  if (url.origin.includes("firebase") || url.origin.includes("gstatic")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. ESTRATEGIA: NETWORK FIRST (Red primero, luego caché)
  // Esto asegura que William siempre vea la última actualización de Vercel.
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Guardamos una copia en la caché dinámica
        return caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(event.request, networkResponse.clone());
          limitCacheSize(DYNAMIC_CACHE, 50);
          return networkResponse;
        });
      })
      .catch(() => {
        // Si no hay red, buscamos en la caché
        return caches.match(event.request).then(cachedResponse => {
          return cachedResponse || caches.match(OFFLINE_URL);
        });
      })
  );
});

/* ===============================
   UTILS & NOTIFICATIONS
   =============================== */
async function limitCacheSize(name, size) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > size) {
    await cache.delete(keys[0]);
    limitCacheSize(name, size);
  }
}

self.addEventListener("push", event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || "TallerPRO360 Actualizado",
    icon: "/assets/logo-192.png",
    badge: "/assets/logo-192.png",
    data: data.url || "/"
  };
  event.waitUntil(self.registration.showNotification(data.title || "TallerPRO360", options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || "/"));
});
