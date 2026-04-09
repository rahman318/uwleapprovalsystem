// public/service-worker.js

const CACHE_NAME = "e-approval-cache-v1";
const urlsToCache = [
  "/",                 
  "/index.html",       
  "/manifest.json",          
  "/company-logo.png",
  "/icons/3615953.png",
  // tambah assets lain seperti CSS / JS / logo
];

// ===================== INSTALL =====================
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching files...");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// ===================== ACTIVATE =====================
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activated");
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker: Clearing old cache", cache);
            return caches.delete(cache);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ===================== FETCH =====================
self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      try {
        // cuba ambil dari cache dulu
        const cachedRes = await caches.match(event.request);
        if (cachedRes) return cachedRes;

        // ignore non-GET requests (POST/PUT/DELETE)
        if (event.request.method !== "GET") return fetch(event.request);

        // fetch dari network
        const networkRes = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, networkRes.clone());
        return networkRes;
      } catch (err) {
        console.warn("❌ Fetch failed for:", event.request.url, err);

        // fallback HTML page
        if (event.request.destination === "document") {
          const fallback = await caches.match("/index.html");
          if (fallback) return fallback;
        }

        // fallback image
        if (event.request.destination === "image") {
          return new Response(null, { status: 404 });
        }

        // fallback API / other requests
        return new Response(JSON.stringify({ error: "Offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }
    })()
  );
});

// ===================== PUSH NOTIFICATION =====================
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push Received");
  let data = { title: "New Notification", body: "You have a new update", url: "/" };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      console.error("Push data parse error:", err);
    }
  }

  const options = {
    body: data.body,
    icon: "./icons/3615953.png",
    badge: "./icons/3615953.png",
    data: data.url, // url untuk buka bila click
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ===================== NOTIFICATION CLICK =====================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // jika dah ada tab terbuka, fokuskan
        if (client.url === event.notification.data && "focus" in client) return client.focus();
      }
      // kalau tak ada, buka tab baru
      if (clients.openWindow) return clients.openWindow(event.notification.data);
    })
  );
});
