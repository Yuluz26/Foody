---
name: Warung
description: A hawker stall's own ordering board, where every number glows as a real LED digit.
colors:
  ground: "#efe7d7"
  ground-deep: "#e8dfcc"
  panel: "#efe7d7"
  ink: "#211d17"
  ink-soft: "#4f493b"
  ink-muted: "#5f5848"
  rule: "#d9cdb2"
  rule-strong: "#bfb294"
  module: "#211d17"
  module-deep: "#14110d"
  amber: "#ff9f3d"
  amber-deep: "#e07f1e"
  amber-tint: "#fbe6c6"
  leaf: "#2fa562"
  leaf-deep: "#227a49"
  leaf-tint: "#dcefdf"
  alert: "#d6432b"
  alert-tint: "#f6ddd3"
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
  control: "16px"
  panel: "24px"
  module: "10px"
spacing:
  hairline: "2px"
  tight: "12px"
  row: "20px"
  block: "24px"
  section: "40px"
components:
  button-ink:
    backgroundColor: "linear-gradient(150deg, #403a31, #1d1a15)"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "48px"
  button-amber:
    backgroundColor: "linear-gradient(150deg, #ffb760, #f48f26)"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "48px"
  button-leaf:
    backgroundColor: "linear-gradient(150deg, #3bb870, #23803f)"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "48px"
  button-soft:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "48px"
  button-alert:
    backgroundColor: "linear-gradient(150deg, #e2573e, #b8341d)"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "0 18px"
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
    backgroundColor: "{colors.ground-deep}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
---

# Design System: Warung

## Overview

**Creative North Star: "Papan Digit Gerai, soft edition"**

The product still reads like the digital number board bolted above a hawker stall: every number it owns (order numbers, table numbers, prices, quantities, cart counts, admin KPIs) glows as an LED digit, amber on a dark instrument housing. What changed is everything around the digits. The page and every surface are now cut from one warm clay tone (`#efe7d7`) and lit from the top left: things you can use or that group content are **raised**, things you have chosen or type into are **pressed in**. That is the whole neumorphic vocabulary, and it is kept to two states on purpose.

Neumorphism fails when everything is soft, because nothing then says "this is the button". Three rules keep it usable here: text stays full-contrast ink on clay; real actions (ink, amber, leaf, alert) are solid colour with a gradient and a lit top edge, so the main path never depends on a shadow; and the dark digit module is the one hard-edged, high-contrast element on every screen.

Density reads as a photo-forward card grid: a sticky segmented category rail on phones (a pressed-in track with a raised thumb that slides between categories), a standing sidebar and a pinned order chit on wide screens, and dishes as raised tiles with the photo set into them. The admin panel uses the same language: a floating raised sidebar, KPI tiles whose numbers sit in digit modules, order rows as raised tiles (a new order is tinted amber), and tables inside a raised card.

Motion is tactile and short. Buttons lift 2px on hover, sink and spring back when pressed (overshoot easing), and solid ones catch a single light sweep. Switch knobs squish while held. Digits flip when a count changes. Reduced motion removes every transform and the sweep and keeps only the shadow swap, so a press still reads.

**Key Characteristics:**
- One clay tone for page and surfaces; wells and fields are one step deeper (`ground-deep`).
- Two surface states: raised (`neu-card`, `neu-tile`, `neu-press`) and pressed (`neu-well`, `neu-well-sm`, `neu-field`). Selected means pressed.
- Every number the product owns renders through `DigitDisplay` (IBM Plex Mono, tabular, amber in a dark recessed module).
- Solid-colour buttons for real actions (`.btn-ink`, `.btn-amber`, `.btn-leaf`, `.btn-alert`), clay `.btn-soft` for secondary, `.btn-quiet` for low-emphasis text actions.
- Amber is the only glow colour; leaf green marks open/ready/success; alert red is for errors only.

## Colors

A warm cream shopfront ground with one dark instrument-module accent color; amber is the sole "ornament" hue, leaf green is reserved for positive state, alert red for errors only.

### Primary
- **Lit Amber** (amber, `#ff9f3d`): the lit color of every digit inside a dark module (order numbers, prices, counts, KPIs), the category-rail active underline, section-heading rules, and the focus ring inside dark ("on-module") surfaces.
- **Deep Amber** (amber-deep, `#e07f1e`): hover/pressed state for amber controls; the warning icon on the product sheet's closed message.
- **Amber Tint** (amber-tint, `#fbe6c6`): text-selection background, and the highlighted KPI tile on the admin dashboard (e.g. a nonzero "Baru" count).

### Neutral (module)
- **Module** (module / module-deep, `#211d17` / `#14110d`): the dark instrument housing behind every chip-mode digit readout, the admin sidebar/header bar, and the mobile cart strip. Text and focus rings inside it switch to amber or white (the `on-module` scope).

### Tertiary
- **Kedai Leaf** (leaf, `#2fa562`): the open/accepting-orders status lamp and label, the "Siap" (ready) status tag and action, "on" switches with their written "Ya".
- **Deep Leaf** (leaf-deep, `#227a49`): hover on leaf actions.
- **Leaf Tint** (leaf-tint, `#e8f6ee`): reserved for pale positive-state washes.

### Neutral
- **Ink** (ink, `#211d17`): primary text, 2px borders, the "Habis hari ini" sold-out tag, the "completed" status color, dark surfaces.
- **Soft Ink** (ink-soft, `#5b5549`): descriptions, secondary copy, inactive nav text.
- **Muted Ink** (ink-muted, `#5f5848`): hints, placeholders, timestamps. Checked to clear 4.5:1 on both the clay and the deeper well tone.
- **Ground** (ground, `#efe7d7`) / **Deep Ground** (ground-deep, `#e8dfcc`): the page, and the one-step-deeper tone used inside wells, fields and tracks.
- **Panel** (panel, `#efe7d7`): the same clay as the ground on purpose. Raised surfaces are separated from the page by light and shadow, not by a different colour.
- **Rule** (rule, `#d9cdb2`) / **Strong Rule** (rule-strong, `#bfb294`): dotted price leaders, the scrollbar thumb and the neutral segment in charts. Dividers inside cards use `ink` at 8 to 14% instead.
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

A 96rem (max-w-[96rem]) container on the menu at desktop widths; reading pages (checkout, order status) stay narrower. Below 1024px it's a single scrolling column: hero header, horizontal sticky category rail, search field, then dish sections. From 1024px it becomes a 3-zone grid — a 16rem standing sidebar (the shop's own identity card, a vertical category nav replacing the horizontal rail, and hours/contact), the dish grid in the middle, and a sticky ~340px order chit on the right. There is no diner account in this product, so the sidebar's "profile card" slot is the restaurant's own — logo/name and its open/closed lamp — not a person's. Dishes run in a 2-column (mobile) / 3-column (`sm:`) photo-forward card grid, not a single scrolling list — the photo leads, with the digit code and any status badge riding the frame and the name/description/price below. The admin product catalogue mirrors the same card-grid language (2/3/4 columns by breakpoint) for the same reason: staff scan photos faster than rows of text. Admin uses a 17rem floating raised sidebar from `lg`; below that, a light top bar with a pressed-in segmented nav that scrolls horizontally.

Rhythm: card grids use 16-20px gaps, sections start ~40px apart, cards/fields commonly step in 12-24px units, and fixed bars (mobile cart strip, safe-area padding) respect `env(safe-area-inset-*)`. Breakpoints in active use are 640px, 768px (sheet becomes a centered dialog; product-sheet photo goes from 4:3 to 16:10) and 1024px (desktop order chit, admin sidebar, mobile cart strip/bar removed).

## Elevation & Depth

Depth is the system. Light comes from the top left, so every raised surface carries a light shadow up-left and a warm, clay-tinted shadow down-right; every pressed surface carries the same pair inset. Shadows are tinted to the clay (`rgb(158 133 88 / .42)`), never black.

### Shadow Vocabulary
- **Raised** (`--shadow-raised`, 10/22px): cards, the desktop chit, hovered tiles.
- **Raised small** (`--shadow-raised-sm`, 6/13px): resting tiles, buttons, list rows.
- **Raised xs / 2xs** (3/7px, 2/5px): badges, thumbs inside tracks, knobs. 2xs is small enough to live inside a scrolling track without being clipped.
- **Inset / inset small**: wells, fields, tracks, chosen options, the progress track.
- **Module** (`--shadow-module`): the dark digit housing is recessed into the clay, with a light edge on its lower right.
- **Sheet / lift**: the upward cast of the phone sheet and floating layers.

### Named Rules
**The Two-State Rule.** A surface is raised or pressed. Never invent a third (no borders as structure, no coloured outlines). Selected, chosen and active all mean pressed; hover means a bigger raised shadow.

**The Scroll-Container Rule.** A container that scrolls clips its children's shadows. Give it padding (and a matching negative margin) at least as large as the shadow it holds, or use the 2xs shadow inside it.

**The Solid-Action Rule.** Every action a user must find (add, order, confirm, mark ready) is solid colour. Soft clay buttons are for secondary actions only.

## Shapes

One radius family: **24px panels** (`--radius-panel`: cards, sheets, dish tiles, wells), **16px controls** (`--radius-control`: buttons, fields, segmented tabs, option cards) and a tight **10px module** (`--radius-module`) for the dark digit housing and status tags, so the housing still reads as a distinct instrument. Round shapes are allowed for circular controls only: icon buttons, switch tracks and knobs, steppers, pill-shaped tracks (set through `--neu-radius`), icon bubbles. Photos inside a tile use the tile radius minus its padding, so the corners stay concentric.

## Components

### Buttons
Defined once in `app.css` (`.btn` plus a variant and a size) and reached through `buttonClass()` / `<Button>` in `components/ui/Button.tsx`, so a `<Link>` can look identical to a `<button>`.
- **Sizes:** 40px (sm), 48px (md, default), 56px (lg); icon buttons are round, 44px (40px sm).
- **Ink, Amber, Leaf, Alert:** solid gradient fills with a lit top edge. Hover lifts 2px and sweeps a light band across once; press sinks to an inset shadow and scales to 0.96, then springs back.
- **Soft:** clay with raised shadow; the default secondary action.
- **Quiet:** no surface until hover (a small raised shadow); for text actions inside rows.
- **Loading:** three bouncing dots replace the leading icon; the label stays.
- **Reduced motion:** transforms and the sweep are removed; the shadow swap remains.

### Cards / Containers
- `neu-card` (24px, raised): panels, the chit, charts, tables.
- `neu-tile` (16px, raised small): rows and tiles; usually widened to the panel radius with `[--neu-radius:var(--radius-panel)]`.
- `neu-well` / `neu-well-sm` (pressed): empty states, totals, notices, tracks.
- `neu-press`: a tile that lifts on hover and sinks when pressed or selected (`aria-current`, `aria-pressed` or `data-selected`). Used for option cards and links that behave like buttons.
- A notice takes its colour from `--neu-bg` (amber tint for guidance, alert tint for errors), never from a border.

### Inputs / Fields
- **Style:** `neu-field`: pressed into the clay, one step deeper, 16px, with a hairline edge at about 26% ink so the control stays findable without relying on shadow alone. Label above (15px semibold), hint or error below.
- **Focus:** the border goes full ink and the inset deepens; the global 3px ink focus ring (amber inside `on-module`) stays.
- **Error:** alert border and alert tint; bold message with an icon via `aria-describedby`.
- **Checkbox:** styled globally in the base layer: pressed in when empty, raised amber with a springy tick when checked.
- **Switch:** a pressed-in track with a raised knob that stretches while held and slides on change; the state is always also written out ("Ya" / "Tidak").
- **Choice cards:** `ChoiceCard`, a radio you press: raised until chosen, then pressed in with a lit amber icon bubble and a tick.

### Navigation
- **Segmented control** (`CategoryRail` on phones, `SegmentedTabs` for filters, the admin phone nav): a pressed-in track, with the active item as a raised thumb. The category thumb slides between tabs (shared-layout tween, 240ms).
- **Sidebars** (customer from `lg`, admin from `lg`): the customer sidebar is stacked raised cards with the categories in a pressed-in track; the admin sidebar is one floating raised card whose active item is pressed in with an amber icon. A nonzero order count renders as a small `DigitDisplay`.

### Status Tags / Badges (StatusBadge, PaymentBadge)
- 10px module radius with a tiny raised shadow. Order status colours: Baru (amber), Disahkan (amber tint with an inset ink ring), Disediakan (ink), Siap (leaf), Selesai (deep clay), Dibatalkan (alert tint with ring). `StatusBadge` takes an optional `label` so the diner side can use friendlier wording on the same colours and icons. Status is always a word plus an icon, never colour alone.
- `StockBadge` is the same chip for the shelf: Cukup (leaf), Hampir habis (amber), Habis (alert tint with ring). Untracked dishes render nothing. Stock rows pair the chip with a `DigitDisplay` count (dim when empty); customers only ever see a small amber "Tinggal N" tag, and only when the count is at or under the dish's warning level.

### Dish Card (customer menu, admin catalogue)
A raised tile with the photo set into it (concentric radius). The digit code rides the photo top-left, the status tag top-right, and the quick-add button hangs off the bottom-right corner (ink; amber with the quantity once in the cart). Name, a 2-line description and the price sit below. The whole tile opens the product sheet through a stretched name button; quick-add stays separate.

### Sheet
A native `<dialog>` bottom sheet on phones (drag-to-dismiss, inset grab handle, soft round close button) that becomes a centred 24px panel from 768px. No coloured edge.

### Empty State
`EmptyState`: a pressed-in field with a raised round icon bubble, what is missing, and the action to fix it. Replaces every dashed-border placeholder.

### Tables
`.data-table` inside a `neu-card`: a hairline under the header, hairlines between rows, and a soft wash under the row being read.

### Order Status Timeline
Round markers joined by a thin connector. Done: raised leaf with a tick. Current: raised amber with a pulsing ring (stopped under reduced motion). Ahead: a pressed-in dimple.

### DigitDisplay (signature component)
The defining primitive: renders any string of characters through IBM Plex Mono, tabular numerals, 0.02em tracking. In "chip" mode (the default) it sits inside a 10px dark module (`bg-module`) recessed into the clay by `--shadow-module`, with a small `text-shadow` glow on the lit colour. In inline (`chip={false}`) mode it drops the housing, for plain tabular numerals riding with body text (a dish price, a row total). The `kpi` size steps down on phones so a seven-character total still fits a half-width tile. Used for dish and category codes, prices, cart and rail counts, quantity steppers, KPI tiles and order numbers up to the largest size on the order-status page.

### Quantity Stepper
A pressed-in pill holding two raised round buttons around an inline `DigitDisplay` that flips vertically (70% travel, 180ms) in the direction of change.

### Menu Slider (customer menu, optional)
A rotating photo strip in a raised card, populated by staff-uploaded images cropped server-side to one fixed 16:7 ratio. Crossfades with a slight scale-in (reduced motion drops the scale). A small frosted pill carries the dots (24px hit areas) and a real pause control; prev/next are soft round buttons that appear on hover or focus. Renders nothing when no banners are active.

### Order Volume Chart / Order Pipeline Bar / Completed Orders Chart (admin)
Each sits in a `neu-card`; the plot area is a pressed-in well. Hourly bars are amber (a rule-coloured sliver for an empty hour) and grow in from the baseline; the pipeline is one segmented bar in a pressed-in track using the same status colours as `StatusBadge`, with exact counts in a legend; the completed-orders trend is an amber line over a soft area, with a `SegmentedTabs` switch between count and revenue. Axis labels stay recessive.

## Do's and Don'ts

### Counter (POS, `/admin/pos`)
- Tablet-first. The menu is a grid of raised photo tiles (`ProductTile`): 4:3 image, name, price in mono, an amber plus. The whole tile is the button; a dark count badge shows what is already in the basket, and the left corner carries "Habis" or "Tinggal N". Dishes with add-ons open a sheet; the rest add on one tap.
- Category chips sit in a pressed-in track that scrolls sideways, beside a search field. Sections are headed by the same `section-title` underline as the guest menu.
- Wide screens (1280px and up) get a fixed side column for the basket: lines scroll, the total and the amber "Hantar ke dapur" stay pinned. Below that the basket is a sheet behind a full-width amber bar showing the item count and total. Only one of the two is ever mounted.
- Table picker is a grid of numbered keys: free ones raised, taken ones struck through and disabled, chosen one amber and pressed in. Cash shows quick-amount chips and the change due sits above the total so it is never scrolled out of view.
- Orders keyed here carry a small "Kaunter" tag in the queue.

### Do:
- **Do** render every order number, table number, price, quantity, cart count and KPI through `DigitDisplay`, never as plain UI type.
- **Do** keep text full-contrast ink on clay, and make real actions solid colour.
- **Do** use `buttonClass()` for anything that looks like a button, and the `neu-*` utilities for surfaces, instead of writing shadows by hand.
- **Do** treat selected as pressed and hover as a bigger raised shadow.
- **Do** pad scroll containers so shadows are not clipped.
- **Do** write status in words and an icon as well as colour.
- **Do** keep every tap target at least 24px (44px for primary controls) and respect reduced motion.

### Don't:
- **Don't** set a digit-owning value in plain Inter type; it must go through the digit face.
- **Don't** use a border to show structure or state; use raised or pressed. The one exception is the hairline edge on fields.
- **Don't** put a cast shadow on a pure text block, or stack raised inside raised more than one level.
- **Don't** use `!important`; radii and fills are overridden through `--neu-radius` and `--neu-bg`.
- **Don't** use leaf green decoratively, or alert red for anything but an actual error state.
- **Don't** add a system-display or signage typeface; Inter carries reading and UI, Nunito the admin headings, IBM Plex Mono the digits.
- **Don't** invent kicker or eyebrow labels above headings.
