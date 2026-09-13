// Foody service worker: caches the static app shell (build assets, fonts, icons) so it
// starts instantly on repeat visits, and shows a friendly offline page for a failed page
// navigation. It never caches an HTML document, an API response, or anything from /admin —
// menu, order and account data must always come from the network.
const VERSION = 'foody-shell-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

function isBuildAsset(url) {
    return url.origin === self.location.origin && (url.pathname.startsWith('/build/') || url.pathname.startsWith('/fonts/'));
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') {
        return; // Never intercept an order submit, status update, or any other mutation.
    }

    const url = new URL(request.url);

    if (url.origin === self.location.origin && url.pathname.startsWith('/admin')) {
        return; // Staff always see live data.
    }

    // Vite's build output is content-hashed and immutable: once fetched, it never changes.
    if (isBuildAsset(url)) {
        event.respondWith(
            caches.open(VERSION).then(async (cache) => {
                const cached = await cache.match(request);

                if (cached) {
                    return cached;
                }

                const response = await fetch(request);

                if (response.ok) {
                    cache.put(request, response.clone());
                }

                return response;
            }),
        );

        return;
    }

    // A full page load: try the network, and fall back to the offline card if it fails outright.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => caches.match(OFFLINE_URL)),
        );
    }
});
