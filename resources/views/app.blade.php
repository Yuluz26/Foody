<!DOCTYPE html>
<html lang="ms">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="theme-color" content="#efe7d7">
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
        THESIS: The product reads like the digital number board above a hawker stall: every number it owns glows as a real LED digit.
        OWN-WORLD: Papan Digit Gerai, soft edition. One warm clay tone for the page and everything raised from it, lit from the top left; fields, wells and tracks are pressed in. A dark instrument module glows amber digits for order numbers, table numbers, prices, counts and KPIs; real actions are solid colour so the main path never depends on a soft shadow. Leaf green for ready/open, alert red for errors only. Inter for reading text, Nunito for admin headings, IBM Plex Mono for every digit.
        FORM: Neomorphism, restrained: raised = interactive or grouped, pressed = chosen or an input. See DESIGN.md.
        -->
        <x-inertia::app />
    </body>
</html>
