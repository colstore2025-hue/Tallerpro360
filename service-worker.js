const CACHE_NAME = "nexus-x-starlink-v2";

// Recursos críticos para que la red funcione sin internet (Modo Offline)
const ASSETS_TO_CACHE = [
  "/",
  "/app", // Ruta limpia en Vercel
  "/index.php",
  "/app.php",
  "https://cdn.tailwindcss.com",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
];

// 1. Instalación: Almacenamiento ultra-rápido de activos críticos
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("🛰️ Nexus-X: Cache de Red Sincronizado");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Fuerza la activación inmediata
});

// 2. Activación: Limpieza de versiones antiguas de la red
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

// 3. Estrategia "Stale-While-Revalidate" (Carga instantánea + Actualización silenciosa)
self.addEventListener("fetch", event => {
  // Solo procesar peticiones GET (evita errores en envíos de formularios)
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // Actualizamos el caché con la versión más reciente del servidor
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Si no hay red y no hay caché (error total)
        console.log("⚠️ Nexus-X: Sin conexión a la Red Starlink");
      });

      // Retornar la versión en caché inmediatamente, o esperar a la red si no existe
      return cachedResponse || fetchPromise;
    })
  );
});
