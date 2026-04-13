// public/service-worker.js

const CACHE_NAME = "e-approval-cache-v2";

// hanya static assets (JANGAN cache API)
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/company-logo.png",
  "/icons/3615953.png",
];

// ===================== INSTALL =====================
self.addEventListener("install", (event) => {
  console.log("🔥 Service Worker Installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );

  self.skipWaiting();
});

// ===================== ACTIVATE =====================
self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker Activated");

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// ===================== FETCH (FIXED - NO API CACHE) =====================
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // ❌ NEVER CACHE API REQUESTS
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // ❌ ONLY HANDLE GET REQUESTS
  if (event.request.method !== "GET") {
    event.respondWith(fetch(event.request));
    return;
  }

  // ✅ CACHE ONLY STATIC FILES
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).catch(() => {
        if (event.request.destination === "document") {
          return caches.match("/index.html");
        }
      });
    })
  );
});

// ===================== PUSH NOTIFICATION =====================
self.addEventListener("push", (event) => {
  console.log("📩 Push Received");

  let data = {
    title: "New Notification",
    body: "You have an update",
    url: "/",
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {}
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/3615953.png",
      data: data.url,
    })
  );
});

//===================== LOG ===========================//
self.addEventListener("push", (event) => {
  console.log("🔥 PUSH EVENT TRIGGERED");

  console.log("RAW DATA:", event.data?.text());
});

// ===================== NOTIFICATION CLICK =====================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientsArr) => {
      for (const client of clientsArr) {
        if (client.focus) return client.focus();
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data || "/");
      }
    })
  );
});
