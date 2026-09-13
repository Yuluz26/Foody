<!DOCTYPE html>
<html lang="ms">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="theme-color" content="#FBF6EC">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="Foody">
        <link rel="manifest" href="/manifest.webmanifest">
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml">
        <link rel="icon" href="/icons/favicon-32.png" type="image/png" sizes="32x32">
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">

        @fonts
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        <x-inertia::head />
    </head>
    <body class="min-h-dvh bg-ground font-sans text-ink antialiased">
        <!--
        THESIS: The product reads like the digital number board above a hawker stall: every number it owns glows as a real LED digit. It refuses the category default of white rounded cards with an orange accent.
        OWN-WORLD: Warm cream shopfront ground; a dark instrument module glows amber digits for order numbers, table numbers, prices, counts and KPIs, a ghost "8" behind every unlit position; leaf green for ready/open, alert red for errors only; Inter for reading text, IBM Plex Mono for every digit; rounded panels, no pills.
        STORY: The diner sees the shop's open state glow, browses numbered dishes, adds to cart, checks out, then watches their order number count through status on a glowing readout. Staff read the same digits on a busier operator console.
        FIRST VIEWPORT: Cream header with Foody's name; a small dark module glowing the table number and open state beside it; category tabs below; the first dish as a large photo with its number and price set in digits.
        FORM: Papan Digit Gerai, fused from the seven-segment/signals-instruments challenger over the dealt "kedai kopi" direction, seed 43a8cb4c; replaces Papan Menu Kedai Makan (seed e979aa04) by user request.
        FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
        -->
        <x-inertia::app />
    </body>
</html>
