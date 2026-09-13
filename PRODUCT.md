# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Delegated: Laravel 13 + Inertia v3 + React 19 + TypeScript + Tailwind CSS 4, MySQL (managed through phpMyAdmin on Laragon). React was chosen because the user asked for Framer Motion, which is a React library.

## Users
- **Diners (primary):** customers of Foody, a modern Malay eatery (kedai makan Melayu moden). They order from their phone in two equally important situations: seated at a table after scanning a QR code (dine-in), or before arriving to collect at the counter (takeaway).
- **Restaurant staff (secondary):** cashier and kitchen staff who watch incoming orders, move them through statuses, and maintain the menu and settings.

## Product Purpose
A restaurant's own ordering system. Diners register or log in, browse the menu, add dishes to a cart, choose dine-in or takeaway, choose to pay at the cashier or by scanning a QR code, place the order, and track its status — including self-cancelling while it's still new — from their own account until it is ready. Staff run the day from an admin panel: dashboard, orders, products, categories, customers, settings.

Success: a diner can go from menu to placed order quickly on a phone without help, and staff never miss a pending order.

## Positioning
It is one restaurant's own menu, not a delivery marketplace: no restaurant listings, ratings, couriers or maps. The menu, the food photography and the order status are the whole experience.

## Operating Context
- Dine-in orders carry a table number (can be prefilled from the QR link); takeaway orders do not.
- Order statuses: Pending, Confirmed, Preparing, Ready, Completed, Cancelled.
- Currency: Malaysian Ringgit (RM).
- Status updates on the diner side use polling; no WebSockets in MVP.
- Prices and totals are always recalculated on the server.

## Capabilities and Constraints
- Interface language: Bahasa Melayu for both the customer panel and the admin panel.
- MVP scope follows `food-ordering-claude-code-prompts/food-ordering-mvp-prompt.md`; the polish pass follows `food-ordering-production-polish-prompt.md`.
- Payment is cashier or QR transfer with an uploaded proof, verified by staff — no card/online gateway integration.
- Out of scope: delivery, OAuth/SSO, complex roles, multi-tenant, modifier engine (model stays extensible for add-ons), password reset for diner accounts.
- Undecided: real restaurant address, phone, operating hours and logo. Seeded values are placeholders to replace in Settings.

## Brand Commitments
- Restaurant name: Foody (editable in Settings).
- Menu is Malay / Malaysian food: nasi lemak, satay, mee goreng, roti canai, teh tarik and similar.

## Evidence on Hand
- No real food photography, logo, testimonials or ratings exist yet. Seed imagery is open-license stock photography loaded by URL and must be replaced with the restaurant's own photos. Do not invent ratings, reviews or sales figures.

## Product Principles
1. Ordering speed on a phone beats decoration.
2. The food is the hero; the interface frames it.
3. Never trust the client with prices, totals, availability or permissions.
4. Staff must see what needs action now without searching.
5. Every state (empty, loading, closed, failed) is designed, not defaulted.

## Accessibility & Inclusion
WCAG 2.2 AA: semantic HTML, keyboard navigation, visible focus, labelled fields, status never conveyed by colour alone, reduced-motion respected.
