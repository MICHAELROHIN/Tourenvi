const APP_SHELL = "tourenvi-app-shell-v1";
const API_CACHE = "tourenvi-api-v1";
const TILE_CACHE = "tourenvi-tiles-v1";
const IMAGE_CACHE = "tourenvi-images-v1";

const APP_ASSETS = ["/", "/index.html", "/manifest.json", "/robots.txt"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(APP_SHELL).then((cache) => cache.addAll(APP_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![APP_SHELL, API_CACHE, TILE_CACHE, IMAGE_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

const networkFirstWithTimeout = async (request, timeoutMs = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(id);
    const cache = await caches.open(API_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    clearTimeout(id);
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "Offline" }), {
      headers: { "Content-Type": "application/json" },
      status: 503,
    });
  }
};

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (url.origin === location.origin && (url.pathname === "/" || url.pathname.endsWith(".js") || url.pathname.endsWith(".css") || url.pathname.endsWith(".html"))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }

        return fetch(request)
          .then((response) => {
            caches.open(APP_SHELL).then((cache) => cache.put(request, response.clone()));
            return response;
          })
          .catch(async () => {
            const fallback = await caches.match("/index.html");
            return (
              fallback ||
              new Response("Offline", {
                status: 503,
                headers: { "Content-Type": "text/plain" },
              })
            );
          });
      }),
    );
    return;
  }

  if (url.pathname.includes("/api/") || url.port === "8000") {
    event.respondWith(networkFirstWithTimeout(request, 5000));
    return;
  }

  if (url.hostname.includes("tile") || url.hostname.includes("openstreetmap")) {
    event.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  if (request.destination === "image") {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          return cached;
        }

        try {
          const response = await fetch(request);
          cache.put(request, response.clone());
          return response;
        } catch {
          return new Response("", {
            status: 404,
            headers: { "Content-Type": "text/plain" },
          });
        }
      }),
    );
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "tourenvi-offline-write") {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "Tourenvi", body: "New trip update" };
  event.waitUntil(
    self.registration.showNotification(data.title || "Tourenvi", {
      body: data.body || "You have a new message",
      icon: "/pwa-192.png",
    }),
  );
});
