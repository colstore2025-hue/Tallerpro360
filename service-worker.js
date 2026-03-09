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

/* ===============================
   ARCHIVOS CRÍTICOS
=============================== */

const STATIC_ASSETS = [
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


/* ===============================
   🚀 INSTALL
=============================== */

self.addEventListener("install", event => {

  console.log("🚀 Instalando Service Worker TallerPRO360");

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        return cache.addAll(STATIC_ASSETS);
      })
  );

  self.skipWaiting();

});


/* ===============================
   🛰️ ACTIVATE
=============================== */

self.addEventListener("activate", event => {

  console.log("🛰️ Activando Service Worker");

  event.waitUntil(

    caches.keys().then(keys => {

      return Promise.all(

        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))

      );

    })

  );

  self.clients.claim();

});


/* ===============================
   🌐 FETCH STRATEGY
=============================== */

self.addEventListener("fetch", event => {

  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);


  /* ===============================
     🔥 FIREBASE / CDN
     Network First
  =============================== */

  if (
    url.origin.includes("firebase") ||
    url.origin.includes("gstatic")
  ) {

    event.respondWith(

      fetch(request)
        .then(response => response)
        .catch(() => caches.match(request))

    );

    return;
  }


  /* ===============================
     📄 HTML
     Network First
  =============================== */

  if (request.headers.get("accept").includes("text/html")) {

    event.respondWith(

      fetch(request)
        .then(response => {

          const copy = response.clone();

          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, copy);
          });

          return response;

        })
        .catch(() => {

          return caches.match(request)
            .then(res => res || caches.match(OFFLINE_URL));

        })

    );

    return;

  }


  /* ===============================
     🧩 ASSETS
     Cache First
  =============================== */

  event.respondWith(

    caches.match(request).then(cached => {

      if (cached) return cached;

      return fetch(request).then(response => {

        const copy = response.clone();

        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(request, copy);
        });

        return response;

      }).catch(() => {
        console.log("⚠️ Recurso no disponible offline:", request.url);
      });

    })

  );

});


/* ===============================
   🔔 PUSH NOTIFICATIONS READY
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

  event.waitUntil(
    self.registration.showNotification(title, options)
  );

});


/* ===============================
   📲 CLICK NOTIFICATION
=============================== */

self.addEventListener("notificationclick", event => {

  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data || "/")
  );

});