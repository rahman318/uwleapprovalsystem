// public/service-worker.js

const CACHE_NAME = "e-approval-cache-v1";
const urlsToCache = [
  "/",                 
  "/index.html",       
  "/public/manifest.json",          
  "/public/images/company logo.png",
  "/public/icons/3615953.png",
  // boleh tambah assets lain seperti CSS / JS / logo
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
    caches.match(event.request).then((cachedRes) => {
      if (cachedRes) return cachedRes;

      return fetch(event.request)
        .then((networkRes) => {
          return caches.open(CACHE_NAME).then((cache) => {
            if (event.request.method === "GET") cache.put(event.request, networkRes.clone());
            return networkRes;
          });
        })
        .catch(() => {
          // fallback jika offline dan tak ada cache
          if (event.request.destination === "document") {
            return caches.match("/index.html");
          }
        });
    })
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
