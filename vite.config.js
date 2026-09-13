import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import inertia from '@inertiajs/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                // Interface and reading text.
                bunny('Inter', {
                    weights: [400, 500, 600, 700, 800],
                }),
                // Headings: rounded terminals for a warmer, friendlier voice than the plain grotesk.
                bunny('Nunito', {
                    weights: [700, 800, 900],
                }),
                // The digit face: every number the product owns reads through this monospace.
                bunny('IBM Plex Mono', {
                    weights: [500, 600, 700],
                }),
            ],
        }),
        react(),
        inertia(),
        tailwindcss(),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
