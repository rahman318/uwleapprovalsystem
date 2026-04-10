// public/service-worker.js
// ===================== SERVICE WORKER (PRODUCTION SAFE) =====================

const CACHE_NAME = "e-approval-cache-v2";

// 🔥 ONLY STATIC FILES (NO API HERE)
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/company-logo.png",
  "/icons/3615953.png",
];

// ===================== INSTALL =====================
self.addEventListener("install", (event) => {
  console.log("🔥 SW Installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📦 Caching static assets...");
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

// ===================== ACTIVATE =====================
self.addEventListener("activate", (event) => {
  console.log("✅ SW Activated");

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🧹 Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// ===================== FETCH (🔥 FIXED - NO API CACHE) =====================
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 🚨 1. NEVER CACHE API REQUESTS
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: "Offline API" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // 🚨 2. ONLY HANDLE GET REQUESTS
  if (event.request.method !== "GET") {
    event.respondWith(fetch(event.request));
    return;
  }

  // ===================== CACHE FIRST STRATEGY (STATIC ONLY) =====================
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });

          return response;
        })
        .catch(() => {
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
    message: "You have a new update",
    url: "/",
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      try {
        data = JSON.parse(event.data.text());
      } catch (err) {
        console.error("Push parse error:", err);
      }
    }
  }

  const options = {
    body: data.message,
    icon: "/icons/3615953.png",
    badge: "/icons/3615953.png",
    data: data.url,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ===================== NOTIFICATION CLICK =====================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ("focus" in client) {
          client.focus();
          return;
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(event.notification.data || "/");
      }
    })
  );
});
