const CACHE_NAME = "tallerpro360-v5";

// Activos críticos para la interfaz Élite
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/taller.html",
  "/cliente.html",
  "/ceo.html",
  "/manifest.json",
  "https://cdn.tailwindcss.com",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;600;800&display=swap"
];

// 1. INSTALACIÓN: Descarga silenciosa de la infraestructura
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("🛰️ Nexus-X: Infraestructura descargada");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. ACTIVACIÓN: Purga de versiones antiguas
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
  console.log("🚀 Nexus-X: Satélite en órbita y listo");
});

// 3. ESTRATEGIA: STALE-WHILE-REVALIDATE (Velocidad de la Luz)
self.addEventListener("fetch", event => {
  // Ignorar peticiones que no sean GET (como envíos de Firebase/POST)
  if (event.request.method !== "GET" || !event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Retorna el caché inmediatamente si existe
      const networkFetch = fetch(event.request).then(networkResponse => {
        // Actualiza el caché en segundo plano
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        console.log("⚠️ Nexus-X: Trabajando en modo Offline profundo");
      });

      return cachedResponse || networkFetch;
    })
  );
});
