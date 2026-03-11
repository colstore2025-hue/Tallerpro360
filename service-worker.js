/*
========================================
SERVICE WORKER
TallerPRO360 ERP SaaS
PWA Offline Engine
Versión: v7
========================================
*/

const CACHE_VERSION = "v7";
const STATIC_CACHE = `tallerpro360-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `tallerpro360-dynamic-${CACHE_VERSION}`;
const OFFLINE_URL = "/index.html";

const STATIC_ASSETS = [
  "/", "/index.html", "/login.html", "/app/index.html",
  "/taller.html", "/cliente.html", "/ceo.html", "/manifest.json",
  "/assets/logo-192.png", "/assets/logo-512.png", "/assets/logo-192-maskable.png",
  "/assets/logo-512-maskable.png", "/assets/favicon.png"
];

/* ===============================
   INSTALL
=============================== */
self.addEventListener("install", event => {
  console.log("🚀 Service Worker Instalando TallerPRO360");
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

/* ===============================
   ACTIVATE
=============================== */
self.addEventListener("activate", event => {
  console.log("🛰️ Service Worker Activado");
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
   FETCH STRATEGY
=============================== */
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // FIREBASE/CDN: Network First
  if (url.origin.includes("firebase") || url.origin.includes("gstatic")) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  // HTML: Network First
  if (event.request.headers.get("accept").includes("text/html")) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const copy = res.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request).then(res => res || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // ASSETS: Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(res => {
          const copy = res.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, copy));
          return res;
        })
        .catch(() => console.log("⚠️ Recurso offline no disponible:", event.request.url))
    })
  );
});

/* ===============================
   PUSH NOTIFICATIONS
=============================== */
self.addEventListener("push", event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "TallerPRO360";
  const options = {
    body: data.body || "Nueva notificación",
    icon: "/assets/logo-192.png",
    badge: "/assets/logo-192.png",
    data: data.url || "/"
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

/* ===============================
   CLICK NOTIFICATION
=============================== */
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || "/"));
});