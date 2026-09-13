# Food Ordering System — Production Polish & Hardening PRD
## Claude Code Master Prompt

The Food Ordering System MVP already exists.

Your task is to transform the existing MVP into a polished, production-grade commercial product.

DO NOT rebuild the application from scratch.

DO NOT replace stable architecture without a strong technical reason.

First audit. Then improve systematically.

The Customer Ordering Panel is the visual centerpiece and must receive the highest UX/UI attention.

---

# 1. PRIMARY OBJECTIVE

Transform the MVP into a product that feels:

- Production-ready
- Premium
- Modern
- Fast
- Reliable
- Accessible
- Consistent
- Maintainable
- Commercially credible

The customer ordering experience must feel closer to a high-quality food ordering application than a generic restaurant website.

---

# 2. FIRST STEP — FULL AUDIT

Before making changes, inspect:

- Repository
- Routes
- Components
- Database
- API/server logic
- Authentication
- State management
- Styling
- Design tokens
- Animations
- Images
- Error handling
- Loading states
- Empty states
- Responsive behaviour
- Accessibility
- Tests
- Dependencies
- Build process
- Environment configuration

Create an internal audit checklist.

Classify findings as:

### Critical
Can break production, security or data integrity.

### High
Major UX, performance or reliability problem.

### Medium
Visual, maintainability or usability issue.

### Low
Nice-to-have refinement.

Fix in priority order.

---

# 3. REQUIRED DESIGN / DEVELOPMENT SKILLS

Use relevant installed skills throughout the audit and polish:

- Impeccable
- UI/UX Pro Max
- Taste Skill
- Framer Motion
- Relevant Anthropic / Claude Code skills
- Other relevant project skills

Use them to actively critique the existing implementation.

Do not merely mention them.

UI/UX Pro Max:
- Audit IA
- UX flow
- Responsive patterns
- Interaction design

Impeccable:
- Typography
- Spacing
- Hierarchy
- Contrast
- Accessibility
- Anti-slop refinement

Taste Skill:
- Premium composition
- Visual judgement
- Product-design quality

Framer Motion:
- Interaction
- Transition
- Feedback
- State changes

Do not add unnecessary libraries.

---

# 4. CUSTOMER ORDERING PANEL — PRIORITY #1

The Customer Ordering Panel is the product's most important interface.

It must NOT look like:

- Generic CRUD
- Generic SaaS
- Basic e-commerce grid
- Generic Tailwind template
- AI-generated UI
- Excessive glassmorphism
- Gradient-heavy startup design
- Excessive rounded cards
- Excessive shadows
- Random decorative blobs
- Animation showcase

Instead it should feel:

- Modern
- Attractive
- Premium
- Food-focused
- Editorial
- App-like
- Fast
- Intuitive
- Visually memorable

The interface must make customers want to browse and order.

---

# 5. VISUAL ART DIRECTION

Use:

- High-quality food photography
- Strong composition
- Sophisticated typography
- Intentional whitespace
- Clear hierarchy
- Carefully selected visual accents
- Consistent design tokens
- Beautiful image cropping
- Meaningful motion

Do not turn every section into a card.

Use different layout structures where appropriate.

The first viewport should communicate:

1. Restaurant identity
2. Food/menu availability
3. Immediate path into ordering

The customer should not need to hunt for the menu.

---

# 6. DESIGN SYSTEM AUDIT

Create/refine a coherent system for:

- Typography
- Font sizes
- Font weights
- Line heights
- Spacing
- Radius
- Borders
- Shadows
- Buttons
- Inputs
- Cards
- Modals
- Drawers
- Bottom sheets
- Badges
- Toasts
- Status indicators
- Navigation

Remove inconsistent one-off styles.

Consolidate components that serve the same role.

---

# 7. CUSTOMER ORDERING JOURNEY

Audit this exact journey:

```text
Restaurant
→ Browse
→ Categories
→ Product
→ Add to cart
→ Cart
→ Order type
→ Customer details
→ Review
→ Submit
→ Confirmation
→ Status
```

Ask at every step:

- Is this necessary?
- Is the next action obvious?
- Is there friction?
- Is the hierarchy clear?
- Does the interface feel premium?
- Is it fast on mobile?

Remove unnecessary friction.

---

# 8. MOBILE-FIRST POLISH

Treat mobile as the primary customer device.

Test realistic sizes:

- 320px
- 375px
- 390px
- 430px

Also test:

- 768px
- 1024px
- 1280px+
- 1440px+
- 1920px

Pay attention to:

- Thumb reach
- Sticky controls
- Cart access
- Bottom sheets
- Modal behaviour
- Keyboard
- Safe areas
- Horizontal category scrolling
- Long names
- Long descriptions
- Image cropping
- Checkout controls

The ordering experience should feel almost native-app quality.

---

# 9. RESTAURANT HERO / HEADER

Refine the first viewport.

It should communicate:

- Restaurant identity
- Logo
- Name
- Short description
- Open/closed state
- Relevant location/contact details if useful

Do not make the hero unnecessarily tall.

The menu should remain immediately accessible.

---

# 10. CATEGORY NAVIGATION

Improve:

- Horizontal scrolling
- Active state
- Sticky behaviour where useful
- Smooth movement
- Clear current position

Do not allow category navigation to consume excessive screen space.

---

# 11. PRODUCT PRESENTATION

Product cards must be visually appealing.

Improve:

- Image ratio
- Typography
- Price hierarchy
- Description
- Availability
- Add action
- Featured presentation

Avoid visually identical blocks everywhere.

Food photography should have strong visual priority.

---

# 12. PRODUCT DETAIL EXPERIENCE

Refine the product detail modal/drawer/page.

It should feel intentional and premium.

Improve:

- Image presentation
- Quantity control
- Price
- CTA
- Closing behaviour
- Mobile interaction
- Scroll behaviour
- Keyboard accessibility

Use Framer Motion where it genuinely improves continuity.

---

# 13. CART EXPERIENCE

The cart must always be easy to discover.

Improve:

- Sticky/floating cart
- Quantity animation
- Item transitions
- Total hierarchy
- Checkout CTA
- Mobile sheet/drawer
- Empty cart state

Cart interactions should feel responsive and satisfying.

---

# 14. CHECKOUT EXPERIENCE

Reduce friction.

Use:

- Logical grouping
- Minimal fields
- Inline validation
- Correct keyboard/input types
- Clear order summary
- Strong primary CTA

Submission flow:

```text
Place Order
↓
Submitting...
↓
Success
```

Prevent duplicate orders.

Do not allow multiple rapid submissions.

---

# 15. ORDER SUCCESS

Make the confirmation feel reassuring.

Show:

- Success state
- Order number
- Summary
- Order type
- Total
- Current status

Provide a clear next action where appropriate.

---

# 16. ORDER STATUS

Create a polished status experience:

```text
✓ Order Received
      ↓
✓ Confirmed
      ↓
● Preparing
      ↓
○ Ready
      ↓
○ Completed
```

Current status must be immediately obvious.

Use subtle Framer Motion transitions for state changes.

If real-time infrastructure is already present, audit it.

If not, evaluate whether real-time updates materially improve the product before introducing WebSockets.

Do not add infrastructure purely for visual effect.

---

# 17. MOTION SYSTEM

Create a consistent motion language.

Motion should communicate:

- Feedback
- State
- Continuity
- Hierarchy

Good examples:

- Product drawer
- Add-to-cart
- Cart count
- Quantity changes
- Toasts
- Checkout transitions
- Order success
- Order status

Rules:

- Fast
- Subtle
- Natural
- Purposeful

Respect:

`prefers-reduced-motion`

Remove unnecessary animation.

---

# 18. ADMIN PANEL POLISH

The backend is an operational tool.

Prioritize:

- Speed
- Clarity
- Order visibility
- Quick status changes
- Search
- Filtering
- Useful tables
- Clear empty states
- Keyboard usability

Do not make the admin visually noisy.

---

# 19. ORDER MANAGEMENT

Improve:

- Order list
- Order detail
- Status controls
- Search
- Filters
- Date filtering
- Order type filtering
- Status filtering

Make active orders visually obvious.

Optimise for restaurant staff.

---

# 20. DASHBOARD

Keep metrics useful:

- Today's orders
- Today's revenue
- Pending
- Preparing
- Completed
- Average order value where reliable

Do not add charts just to fill empty space.

---

# 21. PRODUCT / CATEGORY MANAGEMENT

Improve:

- Forms
- Validation
- Image previews
- Availability
- Category selection
- Ordering
- Feedback
- Empty states

Common actions should be quick.

---

# 22. ERROR HANDLING

Audit all failure states.

Examples:

- Network failure
- Product unavailable
- Restaurant closed
- Session expired
- Validation failure
- Order submission failure
- Server failure

Every error should communicate:

1. What happened.
2. What the user can do next.

Do not expose technical details unnecessarily.

---

# 23. LOADING STATES

Improve loading behaviour using:

- Skeletons where useful
- Progressive loading
- Lightweight indicators

Do not use skeletons everywhere.

Loading UI should match the content it represents.

---

# 24. EMPTY STATES

Design meaningful empty states.

Examples:

```text
No menu items
No orders yet
Cart is empty
No customers yet
```

Each state should explain the situation and provide the next useful action where appropriate.

---

# 25. FORM UX

All important forms need:

- Clear labels
- Correct input types
- Validation
- Inline errors
- Loading state
- Success feedback
- Disabled submission while processing

Use:

- Client validation for UX
- Server validation for security

---

# 26. ACCESSIBILITY AUDIT

Perform a serious accessibility review.

Check:

- Semantic HTML
- Keyboard navigation
- Focus management
- Focus visibility
- Screen reader semantics
- Modal accessibility
- Drawer accessibility
- Form labels
- Error association
- Contrast
- Status communication
- Reduced motion

Do not add ARIA unnecessarily.

Prefer semantic HTML.

---

# 27. SECURITY AUDIT

Review:

- Authentication
- Authorization
- CSRF
- XSS
- SQL injection
- File uploads
- Rate limiting where appropriate
- Input validation
- Session security
- Sensitive data exposure
- Admin route protection
- Mass assignment
- API authorization
- Server-side price validation

Never trust frontend:

- Price
- Total
- Availability
- Permissions

Revalidate critical data server-side.

---

# 28. DATABASE AUDIT

Check:

- Foreign keys
- Indexes
- Constraints
- N+1 queries
- Eager loading
- Pagination
- Transactions
- Unnecessary queries

Order creation and important status changes must be safe against partial failure.

---

# 29. PERFORMANCE AUDIT

Measure before optimizing.

Inspect:

- Initial load
- JavaScript bundle
- CSS
- Images
- API requests
- Database queries
- Rendering
- Re-renders

Fix highest-impact bottlenecks first.

Do not perform arbitrary micro-optimizations.

---

# 30. IMAGE OPTIMIZATION

Audit food images.

Use appropriate:

- Dimensions
- Formats
- Lazy loading
- Responsive sizing
- Aspect ratios

Prevent layout shift.

Do not ship huge original images when smaller assets are sufficient.

---

# 31. FRONTEND PERFORMANCE

Check:

- Unnecessary re-renders
- State architecture
- Network requests
- Code splitting where useful
- Lazy loading
- Image loading
- Bundle size

Avoid unnecessary global state and effects.

---

# 32. BACKEND PERFORMANCE

Check:

- Query efficiency
- N+1 problems
- Indexes
- Pagination
- Eager loading
- Caching where justified
- API payload size

Do not introduce caching everywhere.

---

# 33. REAL-WORLD FAILURE RESILIENCE

Evaluate:

- Slow network
- Failed request
- Double click
- Browser refresh
- Session expiry
- Product becoming unavailable
- Restaurant closing
- Order submission retry

Customer should not accidentally create duplicate orders.

Preserve cart where appropriate.

---

# 34. BROWSER QA

Test modern:

- Chrome
- Safari
- Firefox
- Edge

Prioritize mobile Safari and Chrome.

---

# 35. SEO / SHAREABILITY

For public ordering pages where applicable:

- Title
- Description
- Open Graph
- Canonical URL
- Semantic structure

Do not expose private admin data.

---

# 36. PRODUCTION CONFIGURATION

Audit:

- Debug disabled
- Secure cookies
- HTTPS
- Environment variables
- Secret handling
- Error exposure
- Logging
- Security headers where appropriate

Never commit secrets.

---

# 37. OBSERVABILITY

Add sensible logging for:

- Authentication failures
- Order creation
- Order status changes
- Critical server errors

Do not log unnecessary sensitive customer information.

---

# 38. TESTING

Expand tests for:

Customer:
- Browse
- Product
- Cart
- Quantity
- Remove
- Dine-in
- Takeaway
- Checkout
- Order creation
- Duplicate submission
- Status

Admin:
- Login
- Product CRUD
- Category CRUD
- Orders
- Status
- Settings

Security:
- Unauthorized access
- Invalid input
- Manipulated price
- Invalid product
- Disabled product
- Invalid state transitions

Run the project's appropriate test suite and production build.

---

# 39. VISUAL QA / ANTI-SLOP PASS

Perform a dedicated visual review.

Look for:

- Misalignment
- Inconsistent spacing
- Weak hierarchy
- Bad typography
- Poor image crops
- Weak CTAs
- Excessive cards
- Excessive radius
- Excessive shadows
- Random colours
- Unnecessary gradients
- Generic dashboard patterns
- Awkward mobile layouts
- Unnecessary animations

Use Impeccable principles.

The final interface should look deliberately designed.

---

# 40. PREMIUM FOOD PRODUCT STANDARD

The customer ordering panel should communicate:

```text
Fresh
Modern
Premium
Trustworthy
Fast
App-like
Food-focused
```

Photography, typography, whitespace and motion should work together.

Do not sacrifice usability for aesthetics.

---

# 41. DEPENDENCY AUDIT

For every dependency ask:

- Is it actually used?
- Is it necessary?
- Is there a native solution?
- Does it add complexity?
- Does it materially improve the product?

Remove unnecessary dependencies when safe.

Do not replace stable libraries just because a newer library exists.

---

# 42. CODE QUALITY

Improve maintainability:

- Remove dead code
- Remove unused imports
- Remove unnecessary dependencies
- Consolidate duplicated components
- Improve naming
- Simplify overly complex logic
- Separate business logic from presentation
- Keep components focused

Do not refactor purely for personal style preference.

---

# 43. FINAL PRODUCTION CHECKLIST

## Functionality
- [ ] Authentication
- [ ] Categories
- [ ] Products
- [ ] Cart
- [ ] Checkout
- [ ] Orders
- [ ] Status
- [ ] Settings

## Customer UX
- [ ] Ordering flow is intuitive
- [ ] Mobile experience is excellent
- [ ] Menu is visually attractive
- [ ] Food photography is strong
- [ ] Cart is easy to find
- [ ] Forms are simple
- [ ] Errors are understandable
- [ ] Loading states exist
- [ ] Empty states exist
- [ ] Feedback is consistent

## UI
- [ ] Design system consistent
- [ ] Typography consistent
- [ ] Spacing consistent
- [ ] Buttons consistent
- [ ] Product presentation polished
- [ ] Motion purposeful
- [ ] No visual defects
- [ ] No generic AI/slop appearance

## Accessibility
- [ ] Keyboard navigation
- [ ] Focus states
- [ ] Labels
- [ ] Contrast
- [ ] Semantic HTML
- [ ] Reduced motion

## Security
- [ ] Authentication
- [ ] Authorization
- [ ] Validation
- [ ] Server-side pricing
- [ ] File validation
- [ ] Secure configuration

## Performance
- [ ] Images optimized
- [ ] Queries optimized
- [ ] No obvious N+1
- [ ] No unnecessary requests
- [ ] Responsive performance acceptable

## Code
- [ ] No obvious dead code
- [ ] No unnecessary dependencies
- [ ] No obvious console errors
- [ ] Critical tests pass
- [ ] Production build passes

---

# 44. FINAL CLAUDE CODE INSTRUCTION

Do not stop at "the code works".

The goal is:

```text
Existing MVP
↓
Full Audit
↓
Critical Fixes
↓
UX Refinement
↓
Visual Refinement
↓
Mobile Polish
↓
Accessibility
↓
Performance
↓
Security
↓
Testing
↓
Production Readiness
```

Do not rebuild working features unnecessarily.

Do not introduce complexity without a measurable benefit.

Do not declare production-ready while critical issues remain.

At completion, provide a concise report:

1. Audit findings
2. Changes made
3. Security issues fixed
4. Performance improvements
5. UX/UI improvements
6. Dependencies added/removed
7. Tests executed
8. Production build result
9. Remaining known issues
10. Recommended next steps
