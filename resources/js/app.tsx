import { createInertiaApp } from '@inertiajs/react';

createInertiaApp({
    title: (title) => title || 'Foody',
    progress: {
        color: '#ff9f3d',
        delay: 250,
    },
});

// Registration is a no-op where it can't work (no HTTPS, no support, blocked by the browser),
// so this never blocks the app; it only makes the shell installable and start faster on repeat visits.
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Offline caching is a nice-to-have; ordering keeps working without it.
        });
    });
}
