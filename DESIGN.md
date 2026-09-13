---
name: Foody
description: A hawker stall's own ordering board, where every number glows as a real LED digit.
colors:
  ground: "#fbf6ec"
  ground-deep: "#f3ead4"
  panel: "#ffffff"
  ink: "#211d17"
  ink-soft: "#5b5549"
  ink-muted: "#6f6858"
  rule: "#e8e0cd"
  rule-strong: "#d4c9ac"
  module: "#211d17"
  module-deep: "#14110d"
  amber: "#ff9f3d"
  amber-deep: "#e07f1e"
  amber-tint: "#fff2de"
  leaf: "#2fa562"
  leaf-deep: "#227a49"
  leaf-tint: "#e8f6ee"
  alert: "#d6432b"
  alert-tint: "#fbeae5"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 9vw, 4rem)"
    fontWeight: 800
    lineHeight: 0.98
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.1
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.15
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-compact:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.375
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.5
  digit:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontWeight: 600
    letterSpacing: "0.02em"
rounded:
  control: "12px"
  panel: "16px"
  module: "8px"
spacing:
  hairline: "2px"
  tight: "12px"
  row: "20px"
  block: "24px"
  section: "40px"
components:
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "48px"
  button-ink-hover:
    backgroundColor: "{colors.ink-soft}"
  button-amber:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "48px"
  button-amber-hover:
    backgroundColor: "{colors.amber-deep}"
  button-leaf:
    backgroundColor: "{colors.leaf}"
    textColor: "{colors.panel}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "48px"
  button-leaf-hover:
    backgroundColor: "{colors.leaf-deep}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "48px"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
  button-alert:
    backgroundColor: "{colors.alert}"
    textColor: "{colors.panel}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "48px"
  digit-module:
    backgroundColor: "{colors.module}"
    textColor: "{colors.amber}"
    typography: "{typography.digit}"
    rounded: "{rounded.module}"
    padding: "0.25rem 0.5rem"
  status-badge:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.module}"
    padding: "0 10px"
    height: "28px"
  input-field:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  category-tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    padding: "0 12px"
    height: "56px"
  category-tab-active:
    textColor: "{colors.ink}"
---

# Design System: Foody

## Overview

**Creative North Star: "Papan Digit Gerai" (Stall Digit Board)**

The product reads like the digital number board bolted above a hawker stall's counter: every number it owns — order numbers, table numbers, prices, quantities, cart counts, admin KPI tiles — glows as a real LED digit, amber on a dark instrument housing. Everything else — names, descriptions, labels, navigation — is set in a plain, confident grotesk (Inter), self-hosted and deliberately workhorse for this Operate-mode product. This build replaces a prior world ("Papan Menu Kedai Makan": signboard red, Big Shoulders Display, square corners), and the break is total: warm cream replaces enamel white as the ground, rounded panels replace square ones, and plain sequential two-digit numbering (01, 02...) replaces lettered menu codes.

Density reads as a photo-forward card grid: a sticky numbered rail up top, then dishes as square/4:3 photo tiles carrying their digit code and status badge, name and price below, with a pinned dark cart strip on phones; wide screens add a standing order chit beside the grid. A rotating photo slider (staff-uploaded, auto-cropped to one consistent ratio) can sit above the menu as its own moment before the grid begins. The admin panel mirrors the same card-grid language for its product catalogue, built from the same instrument-module vocabulary — KPI tiles and order numbers glow the same amber digits staff see on the customer-facing board. Amber is reserved for the digit face and its housing, plus the rail underline and section rules; leaf green marks only open/ready/success state; alert red is reserved for errors.

Motion is fast and decelerating: digits flip like a real number board when a count changes, sheets rise like a drawer, and a rounded amber underline slides between category tabs. Reduced motion collapses every move to a crossfade.

**Key Characteristics:**
- Every number in the product — order/table numbers, prices, quantities, cart counts, KPIs — renders through the `DigitDisplay` primitive: IBM Plex Mono, tabular, glowing amber inside a dark module housing.
- Warm cream ground (`#fbf6ec`) with a dark instrument-module counterpoint (`#211d17`); amber for lit digits, leaf green for open/ready/success only, alert red for errors only.
- Inter for all reading and UI text; IBM Plex Mono exclusively for digits. No other display face.
- Rounded panels and controls throughout (8-16px radius family); no pill/stadium shapes except genuine toggle switches and thin decorative line-caps (the rail underline, a timeline connector).
- Category and dish numbering is plain sequential two digits (01, 02...) running across the whole menu, not per-category letter codes.

## Colors

A warm cream shopfront ground with one dark instrument-module accent color; amber is the sole "ornament" hue, leaf green is reserved for positive state, alert red for errors only.

### Primary
- **Lit Amber** (amber, `#ff9f3d`): the lit color of every digit inside a dark module (order numbers, prices, counts, KPIs), the category-rail active underline, section-heading rules, and the focus ring inside dark ("on-module") surfaces.
- **Deep Amber** (amber-deep, `#e07f1e`): hover/pressed state for amber controls; the warning icon on the product sheet's closed message.
- **Amber Tint** (amber-tint, `#fff2de`): text-selection background, and the highlighted KPI tile on the admin dashboard (e.g. a nonzero "Baru" count).

### Neutral (module)
- **Module** (module / module-deep, `#211d17` / `#14110d`): the dark instrument housing behind every chip-mode digit readout, the admin sidebar/header bar, and the mobile cart strip. Text and focus rings inside it switch to amber or white (the `on-module` scope).

### Tertiary
- **Kedai Leaf** (leaf, `#2fa562`): the open/accepting-orders status lamp and label, the "Siap" (ready) status tag and action, "on" switches with their written "Ya".
- **Deep Leaf** (leaf-deep, `#227a49`): hover on leaf actions.
- **Leaf Tint** (leaf-tint, `#e8f6ee`): reserved for pale positive-state washes.

### Neutral
- **Ink** (ink, `#211d17`): primary text, 2px borders, the "Habis hari ini" sold-out tag, the "completed" status color, dark surfaces.
- **Soft Ink** (ink-soft, `#5b5549`): descriptions, secondary copy, inactive nav text.
- **Muted Ink** (ink-muted, `#6f6858`): hints, placeholders, timestamps — darkened from an earlier ~3.4:1 pass to clear 4.5:1 on both cream and white.
- **Ground** (ground, `#fbf6ec`) / **Deep Ground** (ground-deep, `#f3ead4`): the page background and its slightly deeper variant.
- **Panel** (panel, `#ffffff`): cards, sheets, the desktop cart chit, fields.
- **Rule** (rule, `#e8e0cd`) / **Strong Rule** (rule-strong, `#d4c9ac`): hairline dividers, dotted price leaders, field borders, the scrollbar thumb.
- **Alert** (alert, `#d6432b`) / **Alert Tint** (alert-tint, `#fbeae5`): errors only, always paired with an icon and written text.

### Named Rules
**The Digit Face Rule.** Every number the product owns (order number, table number, price, quantity, cart count, KPI) renders through `DigitDisplay`, never as plain UI type. Sentences and labels never use the digit face, even when they contain a number that isn't one of these roles.

**The One Ornament Rule.** Amber is the only "glow" color; it appears on the digit face, its housing, the rail underline, and section rules. Leaf green is reserved for positive state (open, ready, done, on) and never used decoratively. Alert red is reserved for errors.

## Typography

**Body/UI Font:** Inter (self-hosted, weights 400-800; falls back to ui-sans-serif, system-ui)
**Digit Font:** IBM Plex Mono (self-hosted, weights 500-700; falls back to ui-monospace, SFMono-Regular, Menlo)

**Character:** One workhorse grotesk carries every sentence, label and heading at confident extrabold weights for display roles; the monospace only ever appears inside the digit face, tabular and slightly glowing. There is no third, decorative display face — a deliberate rejection of a signage/system-display typeface for this Operate-mode product.

### Hierarchy
- **Display** (800, clamp 2.5rem-4rem, 0.98): the shop name in the header.
- **Headline** (800, ~1.875rem): category section headings, admin page titles, product-sheet name line (shares row with its `DigitDisplay` code).
- **Title** (800, ~1.5rem): cart/checkout/order-status section titles ("Troli", KPI section headers).
- **Body** (400, 1rem, 1.5): sheet descriptions and helper copy, max ~60ch.
- **Body Compact** (400, 15px, 1.375): sheet/detail dish descriptions, notices.
- **Card Caption** (400, 13px, 1.375): the tighter description clamp inside a dish/product grid tile, where the photo — not the copy — carries the tile.
- **Label** (600, 15px): field labels, nav items, button text, rail tabs.
- **Badge** (700, 11px, uppercase, 0.02em tracking): the short status word on a card-grid tile ("Pilihan", "Habis") riding directly on the photo.
- **Axis Label** (600, 11px): recessive chart tick labels (hour marks on the order-volume chart) — small and quiet on purpose, never competing with the data itself.
- **Digit** (IBM Plex Mono 600, tabular, 0.02em tracking): the only role set in monospace; used exclusively inside `DigitDisplay`, at sizes xs through xl depending on context (rail count badges through dashboard KPIs and order-status readouts).

### Named Rules
**The Grotesk-Or-Digit Rule.** If it's a number the product owns as an instrument reading (order number, table, price, quantity, count, KPI), it is set in the digit face. Everything else — names, sentences, labels, headings — is set in Inter. Never mix: no digit-face sentences, no monospace body text.

## Layout

A 96rem (max-w-[96rem]) container on the menu at desktop widths; reading pages (checkout, order status) stay narrower. Below 1024px it's a single scrolling column: hero header, horizontal sticky category rail, search field, then dish sections. From 1024px it becomes a 3-zone grid — a 16rem standing sidebar (the shop's own identity card, a vertical category nav replacing the horizontal rail, and hours/contact), the dish grid in the middle, and a sticky ~340px order chit on the right. There is no diner account in this product, so the sidebar's "profile card" slot is the restaurant's own — logo/name and its open/closed lamp — not a person's. Dishes run in a 2-column (mobile) / 3-column (`sm:`) photo-forward card grid, not a single scrolling list — the photo leads, with the digit code and any status badge riding the frame and the name/description/price below. The admin product catalogue mirrors the same card-grid language (2/3/4 columns by breakpoint) for the same reason: staff scan photos faster than rows of text. Admin uses a 240px fixed sidebar from `lg` and a top bar plus horizontally scrolling tab strip below it.

Rhythm: card grids use 16-20px gaps, sections start ~40px apart, cards/fields commonly step in 12-24px units, and fixed bars (mobile cart strip, safe-area padding) respect `env(safe-area-inset-*)`. Breakpoints in active use are 640px, 768px (sheet becomes a centered dialog; product-sheet photo goes from 4:3 to 16:10) and 1024px (desktop order chit, admin sidebar, mobile cart strip/bar removed).

## Elevation & Depth

Depth is hybrid: most surfaces are flat, relying on paint (dark module fill, amber rules) and 2px borders for structure, but floating layers cast real shadows. Sheets, the desktop dialog, toasts and the floating quick-add tile use a soft shadow to read as lifted above the page; the dark digit module itself uses only a subtle 1px inset highlight/shadow pair (`--shadow-module`) to suggest a housing, not a cast shadow.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 -12px 32px -12px rgb(20 17 13 / 0.28)`): upward cast of the phone bottom sheet.
- **Lift** (`box-shadow: 0 10px 28px -14px rgb(20 17 13 / 0.32)`): centered dialog from 768px, toasts, the quick-add tile floating over a dish photo, the desktop order chit's outer edge feel.
- **Module** (`box-shadow: 0 1px 0 0 rgb(255 255 255 / 0.06) inset, 0 -1px 0 0 rgb(0 0 0 / 0.3) inset`): the dark instrument housing's own subtle inset highlight/shadow — not a cast shadow, part of the housing's material.

### Named Rules
**The Floating-Only Shadow Rule.** Cast shadows (sheet, lift) belong only to layers above the page. Resting surfaces read through fill, border and the module's own inset highlight, never a cast shadow.

## Shapes

A full break from the prior world's square corners: panels use a 16px radius (`--radius-panel`), controls and fields use 12px (`--radius-control`), and the dark digit/status module uses 8px (`--radius-module`) — a deliberately tighter radius so the housing reads as a distinct instrument surface from the softer panels around it. Borders are 2px in ink or rule-strong. No pill or stadium shape appears except genuine toggle switches (the `Switch` track and thumb are fully rounded, a distinct control class) and thin decorative line-caps — the rounded rail underline and the order-status timeline connector — which are line devices, not badges, and do not license rounded-full chips or tags elsewhere.

## Components

### Buttons
Solid blocks of ink or amber/leaf paint with semibold labels; 12px corner.
- **Sizes:** 40px (sm), 48px (md, default), 56px (lg).
- **Ink (default):** ink fill, white text; hover fades to ink-soft.
- **Amber:** amber fill, ink text; hover deepens to amber-deep.
- **Leaf:** leaf fill, white text; used for "mark ready".
- **Outline:** transparent, 2px ink border; hover fills ink with white text.
- **Quiet:** transparent; hover shows a 70%-opacity rule wash.
- **Alert:** alert fill, white text (destructive actions).
- **Press:** scales to 0.97 (buttons) or 0.9-0.92 (small square tiles like quick-add) over 150ms ease-out.

### Status Tags / Badges (StatusBadge, "Pilihan", sold-out)
- **Shape:** 8px module radius (matches the digit housing) — squared from an initial rounded-full pass during finish review so state tags read as part of the same instrument vocabulary as the digit modules, not as pill badges.
- **Order status colors:** Baru (amber, ink text), Disahkan (amber-tint with an inset ink ring), Disediakan (ink fill, white text), Siap (leaf, white text), Selesai (rule wash, soft-ink text), Dibatalkan (alert-tint, alert text with an inset ring).
- **Product flags:** "Pilihan" (featured) is an amber module-radius tag with a filled star icon; "Habis hari ini" (sold out) is an ink module-radius tag on the dish row.
- Status is always written as a word plus icon, never color alone.

### Cards / Containers
- **Corner Style:** 16px panel radius (order chit, dashboard KPI grid, product sheet top).
- **Background:** panel on ground.
- **Shadow Strategy:** none at rest; see Elevation & Depth for floating exceptions.
- **Border:** 2px ink or rule-strong.

### Inputs / Fields
- **Style:** white field, 2px rule-strong border, 12px corner, 12x14px padding, 16px text; label above (15px semibold), hint or error below.
- **Focus:** border shifts to full ink; global 3px ink focus ring (amber inside `on-module` scopes). Caret is amber-deep.
- **Error:** alert border with a 40%-opacity alert-tint wash, bold alert message with a warning icon via `aria-describedby`.
- **Disabled:** 60% opacity.
- **Switch:** the one deliberately pill-shaped control — a rounded-full 32x56px track, 2px border, leaf fill with a white thumb when on, panel track with an ink thumb when off; the state is always also written out ("Ya"/"Tidak").

### Navigation
- **Category rail:** sticky panel bar, 2px rule bottom border, 56px tabs in Label type; active tab turns ink with a rounded amber underline (shared layout animation, 240ms ease-in-out) that auto-centers as the page scrolls. No numbered code tile in the rail itself — dish/category numbering lives on the digit face in the menu body, not in the nav.
- **Admin sidebar:** 240px panel sidebar with a 2px rule right border, headed by a dark ink block naming the shop; active item is ink-filled with white text; a nonzero item count renders as a small `DigitDisplay` badge, not a plain number.

### DigitDisplay (signature component)
The defining primitive: renders any string of characters through IBM Plex Mono, tabular numerals, 0.02em tracking. In "chip" mode (the default) it sits inside a rounded 8px dark module (`bg-module`) with the `--shadow-module` inset highlight and a subtle `text-shadow` glow on the lit color. In inline (`chip={false}`) mode it drops the housing, for plain tabular numerals riding inline with body text (e.g. a dish-row price). Tone defaults to amber inside a chip and ink otherwise, with leaf/white/dim variants for state and context. Used for: dish/category codes, prices everywhere, cart/rail counts, quantity steppers, KPI tiles, and order numbers up to the largest size on the order-status page.

An earlier pass added a faint ghost "8" behind every lit digit to mimic an unlit seven-segment cell. Dropped after user feedback: it read as visual noise rather than an instrument detail, especially with narrow digits like "1" where the ghost shape competed with the real character.

### Quantity Stepper
A 2px-bordered, 12px-corner inline group with minus/plus icon buttons flanking a `DigitDisplay` (inline mode) that flips vertically (70% travel, 180ms) in the direction of change. A `light` tone variant swaps the border and digit color to white for use on dark (module) surfaces.

### Sheet
A native `<dialog>`-based bottom sheet on phones (drag-to-dismiss, 4px amber top border under a 16px top radius, sheet shadow) that becomes a centered 16px-radius panel with the lift shadow from 768px. The amber top-edge stripe on the bottom sheet is a confirmed intentional signature device (inherited in spirit from the prior world's red top edge), not accidental drift against the "no border accent on a rounded corner" concern — verified against captured screenshots showing the stripe curving cleanly into the rounded top corners.

### Order Status Timeline
Square-ish markers joined by a thin rounded connector (a line-cap device, not a pill). Current step uses amber with a pulsing outline (stopped under reduced motion); done steps use leaf; to-do steps use a rule-strong outline.

### Dish Card (customer menu, admin product catalogue)
A photo-led tile, not the generic icon-plus-heading-plus-text scaffold: a square/4:3 photo carries the digit code (top-left) and a status badge — "Pilihan" in amber or "Habis" in ink (top-right) — with the quick-add control hanging off its bottom-right corner. Name, a 2-line description clamp, and the price sit below in plain type. The whole tile opens the product sheet; quick-add stays a separate control so adding to cart never requires leaving the grid. Replaced an earlier single-column row list — reasoned that the photo is the product's real content here (PRODUCT.md: "the food is the hero"), so it leads the tile instead of riding along at a fixed small size in a row.

### Menu Slider (customer menu, optional)
A rotating photo strip above the menu, populated by staff-uploaded images cropped server-side to one fixed 16:7 ratio so every slide is the same shape — no client-side cropping decisions, no wobble between slides. Crossfades with a slight scale-in (`duration.sheet`, reduced motion drops the scale), dot indicators plus a play/pause control (a genuine pause control, not just hover-to-stop, per the auto-rotating-content accessibility rule), and prev/next arrows that reveal on hover/focus. Renders nothing when no banners are active.

### Customer Sidebar (menu, desktop only, `lg:` and up)
The standing left rail once the page has room for it: the shop's own identity card (module housing, logo, name, the same open/closed lamp language as the header), a vertical list standing in for the horizontal category rail (same active-state treatment as the admin sidebar nav — ink fill, white text), and an hours/address/phone block. Replaces the mobile hero + horizontal rail rather than duplicating them; the two never show at once. A search field sits at the top of the main column at every width, filtering by name or description across all categories at once into a flat "Hasil carian" grid — dropped back into the normal per-category sections the moment the field empties.

### Order Volume Chart (admin dashboard)
Today's order count per hour as amber bars, growing in from the baseline on first load (`scaleY` 0→1, ~25ms stagger per bar, reduced motion drops to a plain fade) — the one authored motion moment on this page. An hour with no orders still renders a minimal rule-colored sliver so the time axis stays even. Hover or focus any bar for an exact count-and-hour readout; axis labels thin out as the hour range grows so they never crowd. Amber is the only bar color because this is a single series — no categorical palette needed.

### Order Pipeline Bar (admin dashboard)
Today's orders as one segmented bar — proportion at a glance — using the exact same status colors and icons as `StatusBadge` (amber/ink/leaf/muted), never a freshly invented categorical palette for what is already status data. Segments grow in from the left on load; a legend row below carries the icon, label and exact `DigitDisplay` count for all four states, including zero, so identity is never color-alone.

## Do's and Don'ts

### Do:
- **Do** render every order number, table number, price, quantity, cart count and KPI through `DigitDisplay`, never as plain UI type.
- **Do** keep amber as the only glow/ornament color; reserve leaf green strictly for open/ready/done/on state and alert red strictly for errors.
- **Do** give panels a 16px radius and controls/fields a 12px radius; give the dark digit/status module its own tighter 8px radius.
- **Do** write status in words and an icon as well as color (StatusBadge, the open/closed lamp, switches).
- **Do** number dishes and categories sequentially (01, 02...) across the whole menu, not per-category letter codes.
- **Do** keep every tap target at least 44px and press controls with a 0.9-0.97 scale over 150ms ease-out.

### Don't:
- **Don't** set a digit-owning value (price, count, order/table number, KPI) in plain Inter type; it must go through the digit face.
- **Don't** use pill/stadium shapes for panels, cards, buttons, or tags — the rounded family stops at 16px. The only rounded-full exceptions are the toggle switch and thin line-caps (rail underline, timeline connector); do not read those as license for pill badges or chips elsewhere.
- **Don't** invent kicker/eyebrow labels above headings; none exist in the shipped system and none should be added — this build carries no such device to canonize.
- **Don't** use leaf green decoratively, or alert red for anything but an actual error state.
- **Don't** add a system-display or signage typeface; Inter carries every reading and UI role, IBM Plex Mono is reserved for the digit face alone.
- **Don't** put a cast shadow on a resting surface; cast shadows belong only to sheets, dialogs, toasts and the floating quick-add tile.
