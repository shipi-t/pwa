const CACHE_NAME = "pwa-cache-v3";
const ASSETS_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./manifest.json",

    // JS files
    "./js/index.js",
    "./js/checkInList.js",
    "./js/dboperations.js",
    "./js/fileoperations.js",
    "./js/animations.js",
    "./js/language.js",

    // Images
    "./images/logo.ico",
    "./images/logo.png",
];

// Install SW and cache assets
self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)));
    self.skipWaiting();
});

// Serve cached assets when offline
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});
