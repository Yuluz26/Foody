# Food Ordering System — MVP Development PRD
## Claude Code Master Prompt

You are the lead full-stack engineer, product engineer and UI/UX engineer responsible for building the MVP of a modern Food Ordering System.

The system has TWO primary sides:

1. Backend / Admin Panel
2. Modern Customer Ordering Panel

The Customer Ordering Panel is the visual centerpiece of the product. It must already look attractive and intentional in MVP; Phase 2 will refine it further into production quality.

---

# 1. CORE PRODUCT VISION

Build a modern digital restaurant ordering system that feels like a real commercial product, not a generic CRUD application.

The customer experience must be:

- Modern
- Attractive
- Premium
- Fast
- Mobile-first
- App-like
- Food-focused
- Easy to understand
- Low friction

The backend should prioritize operational efficiency and maintainability.

The customer ordering panel should prioritize visual quality, discovery, usability and conversion.

---

# 2. DEVELOPMENT PHILOSOPHY

Follow these principles:

- Functional before decorative.
- Strong UX from the beginning.
- Mobile-first customer ordering.
- Clean and maintainable code.
- Reusable components.
- Avoid duplicated logic.
- Avoid unnecessary dependencies.
- Avoid unnecessary abstractions.
- Do not over-engineer the MVP.
- Do not build features outside this PRD unless clearly required.
- Do not change unrelated working functionality.
- Do not rebuild stable architecture without a reason.

MVP means usable and well-designed, not unfinished-looking.

---

# 3. REQUIRED DESIGN / DEVELOPMENT SKILLS

Before significant implementation:

1. Inspect the repository and existing tooling.
2. Inspect available Claude Code skills.
3. Use relevant installed skills throughout development.

Prioritize:

- Impeccable
- UI/UX Pro Max
- Taste Skill
- Framer Motion
- Relevant Anthropic / Claude Code skills
- Other relevant installed development skills

Use these skills as actual development guidance.

UI/UX Pro Max:
- Information architecture
- UX patterns
- Responsive behaviour
- Component decisions
- Mobile interaction

Impeccable:
- Typography
- Spacing
- Hierarchy
- Contrast
- Accessibility
- Visual consistency
- Anti-slop refinement

Taste Skill:
- Premium visual judgement
- Composition
- Visual polish
- Product-design quality

Framer Motion:
- Meaningful transitions
- Micro-interactions
- Cart feedback
- Product interactions
- Status transitions

Do not add libraries simply because they are available.

---

# 4. FIRST STEP — PROJECT AUDIT

Before coding:

- Inspect complete repository.
- Identify framework.
- Identify database.
- Identify authentication.
- Identify styling system.
- Identify component system.
- Identify routes.
- Identify API/server architecture.
- Identify existing dependencies.
- Identify existing skills.
- Identify environment configuration.

If the repository is empty, establish a clean architecture appropriate for this product.

Do not blindly replace an existing working architecture.

---

# 5. APPLICATION STRUCTURE

```text
Food Ordering System
│
├── Backend / Admin
│   ├── Dashboard
│   ├── Orders
│   ├── Products
│   ├── Categories
│   ├── Customers
│   └── Settings
│
└── Customer Ordering Panel
    ├── Restaurant Header
    ├── Menu Discovery
    ├── Categories
    ├── Product Detail
    ├── Cart
    ├── Order Type
    ├── Customer Details
    ├── Order Review
    ├── Confirmation
    └── Order Status
```

---

# 6. BACKEND / ADMIN

Implement basic secure authentication:

- Login
- Logout
- Protected routes
- Session handling
- Validation
- Error handling

MVP does NOT require:

- Enterprise SSO
- OAuth
- Complex RBAC
- Multi-tenant architecture

Keep the foundation extensible.

---

# 7. ADMIN DASHBOARD

Show operational information:

- Today's orders
- Today's revenue
- Pending orders
- Preparing orders
- Completed orders
- Recent orders

Do not create meaningless analytics just to fill space.

---

# 8. CATEGORY MANAGEMENT

Admin can:

- View categories
- Create
- Edit
- Delete
- Enable / disable
- Reorder where practical

Fields:

- Name
- Description
- Image
- Display order
- Active status

---

# 9. PRODUCT MANAGEMENT

Admin can:

- View products
- Create
- Edit
- Delete
- Enable / disable
- Assign category
- Upload image
- Mark featured

Fields:

- Name
- Description
- Price
- Category
- Image
- Availability
- Featured
- Display order

Do not build a complicated modifier engine in MVP unless already supported.

Keep the model extensible for future modifiers/add-ons.

---

# 10. ORDER MANAGEMENT

Order fields:

- Order number
- Customer name
- Customer phone
- Order type
- Table number
- Items
- Quantity
- Subtotal
- Total
- Status
- Created at

Order types:

- Dine-in
- Takeaway

Statuses:

- Pending
- Confirmed
- Preparing
- Ready
- Completed
- Cancelled

Admin can update order status.

Pending and active orders must be visually obvious.

---

# 11. CUSTOMER MANAGEMENT

Keep customer records lightweight:

- Name
- Phone
- Number of orders
- Last order
- Created date

Do not build a full CRM.

---

# 12. RESTAURANT SETTINGS

Allow configuration of:

- Restaurant name
- Logo
- Description
- Phone
- Address
- Operating hours
- Currency
- Ordering enabled / disabled
- Dine-in enabled / disabled
- Takeaway enabled / disabled

---

# 13. CUSTOMER ORDERING PANEL — HIGHEST PRIORITY

IMPORTANT:

The Customer Ordering Panel must NOT look like a generic CRUD menu, generic SaaS UI, or basic e-commerce grid.

Treat it as a premium digital restaurant ordering experience.

It should feel:

- Modern
- Attractive
- Premium
- Editorial
- Immersive where appropriate
- Fast
- App-like

Use:

- Strong food photography
- Sophisticated typography
- Intentional whitespace
- Clear visual hierarchy
- Beautiful product presentation
- Modern category navigation
- Smooth interaction
- Sticky/floating cart access
- Polished states
- Responsive layouts

The first viewport should immediately communicate restaurant identity and encourage menu exploration.

---

# 14. ORDERING PANEL VISUAL DIRECTION

Avoid:

- Generic Tailwind template appearance
- Generic SaaS dashboard
- Excessive glassmorphism
- Random gradients
- Gradient-heavy startup aesthetics
- Huge meaningless headings
- Excessive rounded cards
- Excessive shadows
- Random floating blobs
- Excessive colours
- Decorative animation everywhere
- AI-generated "slop" aesthetics

Do not make every element a card.

Use composition, whitespace, photography and typography to create hierarchy.

The interface should feel intentionally art-directed.

---

# 15. CUSTOMER HOME / MENU

Include:

## Restaurant Hero / Header

- Restaurant logo
- Restaurant name
- Short description
- Open / closed state
- Optional location/contact information

The hero should be visually compelling without making the customer wait to reach the menu.

## Category Navigation

- Easy to scan
- Horizontal scrolling on mobile where appropriate
- Active category state
- Smooth navigation

## Menu

Product cards should show:

- High-quality image
- Product name
- Short description
- Price
- Availability
- Add / view action

Use image aspect ratios consistently.

---

# 16. PRODUCT DETAIL

Use a polished modal, drawer or dedicated view depending on the existing architecture.

Show:

- Large food image
- Product name
- Description
- Price
- Quantity
- Add to cart

Keep the interaction simple.

Do not introduce unnecessary fields.

---

# 17. CART

Customer can:

- View products
- Increase quantity
- Decrease quantity
- Remove items
- Continue browsing
- Checkout

Cart should be constantly discoverable.

On mobile, consider:

- Sticky cart bar
- Floating cart button
- Bottom sheet
- Cart drawer

Choose the approach that produces the best UX for the existing layout.

Cart interactions should feel polished.

---

# 18. ORDER TYPE

Customer chooses:

### Dine-in

Ask:

- Table number

### Takeaway

No table number required.

Do not ask unnecessary information.

---

# 19. CUSTOMER DETAILS

Collect:

- Name
- Phone
- Optional notes

Use friendly validation.

Do not create unnecessary friction.

---

# 20. ORDER REVIEW

Before submission show:

- Order type
- Table number where applicable
- Customer details
- Items
- Quantities
- Subtotal
- Total
- Notes

Primary CTA:

```text
Place Order
```

Prevent accidental duplicate submissions.

---

# 21. ORDER SUCCESS

Show:

- Order confirmed
- Order number
- Order summary
- Order type
- Current status
- Items
- Total

Make success feel reassuring and polished.

---

# 22. ORDER STATUS

Display:

```text
Order Received
      ↓
Confirmed
      ↓
Preparing
      ↓
Ready
      ↓
Completed
```

Highlight the current state.

Use subtle motion when the status changes.

Real-time WebSockets are optional in MVP. Polling/refresh is acceptable.

---

# 23. MOTION DESIGN

Use Framer Motion selectively.

Good use cases:

- Product modal/drawer
- Category transitions
- Add-to-cart feedback
- Cart updates
- Page transitions
- Order success
- Order status
- Toasts
- Micro-interactions

Motion must be:

- Fast
- Smooth
- Purposeful

Avoid:

- Long transitions
- Excessive bouncing
- Animation everywhere
- Motion that slows ordering

Respect reduced-motion preferences where practical.

---

# 24. RESPONSIVE DESIGN

Customer:

- Mobile-first
- Tablet
- Desktop

Test at:

- 320px+
- 375px
- 390px
- 430px
- 768px
- 1024px
- 1280px+
- 1440px+

Pay attention to:

- Touch targets
- Category overflow
- Sticky cart
- Modal/sheet behaviour
- Keyboard behaviour
- Long product names
- Image ratios
- Safe areas

---

# 25. ACCESSIBILITY

Implement:

- Semantic HTML
- Keyboard navigation
- Visible focus
- Proper labels
- Accessible buttons
- Contrast
- Alt text
- Status communication not dependent only on colour

---

# 26. DATABASE

Core models:

```text
User
Category
Product
Order
OrderItem
Customer
RestaurantSetting
```

Relationships:

```text
Category
 └── Products

Order
 └── OrderItems
       └── Product

Customer
 └── Orders
```

Use:

- Foreign keys
- Indexes
- Constraints
- Timestamps
- Proper validation

Keep it simple.

---

# 27. SERVER / BUSINESS LOGIC

Keep business logic out of presentation components where practical.

Use the appropriate architecture for the project's framework.

Order creation must be transactional.

CRITICAL:

Never trust frontend-submitted prices or totals.

Recalculate:

- Product price
- Quantity
- Subtotal
- Total

server-side.

---

# 28. SECURITY

Implement:

- Authentication protection
- Admin authorization
- Input validation
- CSRF protection where applicable
- Safe queries
- XSS prevention
- File upload validation
- Secure sessions
- Protected admin routes

---

# 29. LOADING / ERROR / EMPTY STATES

Every major screen should have appropriate:

- Loading
- Empty
- Error
- Success

Examples:

- No menu items
- Restaurant closed
- Product unavailable
- Failed to load menu
- Order failed
- No orders yet

States should be intentionally designed, not default browser messages.

---

# 30. PERFORMANCE

MVP should avoid obvious performance problems:

- Optimized images
- Lazy loading where appropriate
- Reasonable API requests
- No unnecessary re-renders
- Efficient database queries
- Pagination where appropriate

Do not prematurely optimize everything.

---

# 31. TESTING

Test critical flows:

- Authentication
- Category CRUD
- Product CRUD
- Cart calculations
- Order creation
- Server-side totals
- Order status
- Unauthorized admin access
- Product availability

Use the existing project's appropriate testing framework.

---

# 32. DEVELOPMENT ORDER

Follow this sequence:

1. Audit repository
2. Establish architecture
3. Database
4. Authentication
5. Admin foundation
6. Categories
7. Products
8. Orders
9. Customer ordering panel
10. Cart
11. Checkout
12. Confirmation
13. Order status
14. Validation
15. Testing
16. Responsive QA
17. Visual refinement

After each major phase:

- Run application.
- Test the feature.
- Fix errors.
- Continue only when core functionality is stable.

---

# 33. DEFINITION OF DONE

MVP is complete when:

Backend:
- Admin login works.
- Categories work.
- Products work.
- Orders work.
- Status updates work.
- Customers can be viewed.
- Settings work.
- Dashboard works.

Customer:
- Menu is attractive and modern.
- Categories work.
- Product details work.
- Cart works.
- Dine-in works.
- Takeaway works.
- Customer details work.
- Checkout works.
- Order confirmation works.
- Order status works.
- Mobile experience is strong.

Technical:
- Database relationships work.
- Server validates all critical order data.
- Server calculates totals.
- Critical tests pass.
- Responsive layouts work.
- No obvious console errors.
- No broken core routes.

---

# 34. FINAL CLAUDE CODE RULE

Do not declare success simply because the application runs.

The MVP must be genuinely usable.

Before finishing, inspect the customer ordering panel again specifically for:

- Visual hierarchy
- Mobile usability
- Typography
- Food image presentation
- Cart discoverability
- CTA clarity
- Spacing
- Motion
- Empty/loading states
- Overall premium feel

The Ordering Panel must already feel like a product, not a prototype.

At the end provide:

1. What was built.
2. What was tested.
3. Any known issues.
4. Dependencies added.
5. Anything intentionally out of scope.
6. Recommended next steps.
