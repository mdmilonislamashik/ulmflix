@'
const CACHE = "ulmflix-shell-v2";

const ASSETS = [
"./",
"./index.html",
"./movies.html",
"./search.html",
"./profile.html",
"./css/main.css",
"./css/income-center.css",
"./js/config.js",
"./js/storage.js",
"./js/income-options.js",
"./js/income-center.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return;

  // Supabase auth callback must bypass cache
  if (url.pathname.startsWith("/auth/callback")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) return cached;

        return fetch(event.request)
          .then((response) => {
            const copy = response.clone();

            caches.open(CACHE).then((cache) => {
              cache.put(event.request, copy);
            });

            return response;
          })
          .catch(() => {
            return new Response("Offline", {
              status: 503,
              headers: {
                "Content-Type": "text/plain"
              }
            });
          });
      })
  );
});
'@ | Set-Content sw.js