const CACHE_NAME = "nexus-x-starlink-v3";

// Recursos críticos para que la red funcione sin internet (Modo Offline)
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/taller.html",
  "/cliente.html",
  "/ceo.html",
  "/manifest.json",
  "https://cdn.tailwindcss.com",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&family=Inter:wght@300;400;700&display=swap"
];

// 1. Instalación: Almacenamiento ultra-rápido
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("🛰️ Nexus-X: Cache de Red Sincronizado");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Activación: Limpieza y toma de control
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  console.log("🚀 Nexus-X: Sistema Operativo Starlink Activado");
  self.clients.claim();
});

// 3. Estrategia "Network First, Falling Back to Cache"
// Para un sistema de taller, necesitamos los datos más frescos (Network First).
// Si la red Starlink falla, usamos el caché (Backup).
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Si hay internet, servimos y actualizamos caché
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Si falla el internet, buscamos en el búnker (Caché)
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          
          // Si no está en caché y es una navegación, mostramos index como fallback
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
