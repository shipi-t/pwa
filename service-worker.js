const CACHE_NAME = "pwa-cache-9"; // bump this every deploy!
const ASSETS_TO_CACHE = [
    "/",
    "/index.html",
    "/style.css",
    "/manifest.json",

    // JS files
    "/js/index.js",
    "/js/checkInList.js",
    "/js/dboperations.js",
    "/js/fileoperations.js",
    "/js/animations.js",
    "/js/language.js",

    // Images
    "/images/logo.ico",
    "/images/logo.png",
];

// INSTALL: Cache assets
self.addEventListener("install", (event) => {
    console.log("[Service Worker] Installing new version...");
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting(); // new SW activates immediately
});

// ACTIVATE: Clean old caches and take control
self.addEventListener("activate", (event) => {
    console.log("[Service Worker] Activating new version...");
    event.waitUntil(
        caches
            .keys()
            .then((keys) => {
                return Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
            })
            .then(() => self.clients.claim()) // <-- take control without reload
    );
});

// FETCH: Network first for HTML, cache first for static assets
self.addEventListener("fetch", (event) => {
    const request = event.request;

    // Always try network first for HTML files
    if (request.mode === "navigate" || request.destination === "document") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, response.clone());
                        return response;
                    });
                })
                .catch(() => caches.match(request)) // fallback to cache when offline
        );
        return;
    }

    // Cache-first for everything else
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            return cachedResponse || fetch(request);
        })
    );
});
