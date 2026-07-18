// Service worker minimal untuk kebutuhan instalasi PWA (Add to Home Screen).
// Strategi: network-first; halaman utama disimpan sebagai fallback offline.
const CACHE_NAME = "bimbingan-os-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(["/"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Hanya tangani navigasi halaman; request API/socket dibiarkan lewat langsung
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/"))
    );
  }
});

// === Web Push Notification ===
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "Bimbingan Skripsi Online", body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Bimbingan Skripsi Online", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // Fokuskan tab yang sudah terbuka jika ada
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      return clients.openWindow(event.notification.data?.url || "/");
    })
  );
});
