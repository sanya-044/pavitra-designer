# Phase-Wise Task Breakdown
## Pavitra B2B Saree E-commerce Platform

---

### Phase Overview

- **Phase 0:** Project Documentation & Architecture Blueprint *(Currently Completing)*
- **Phase 1:** Backend Foundation & Database Connectivity
- **Phase 2:** Authentication, RBAC & Business Profile Management
- **Phase 3:** Saree Catalog & Inventory Engine
- **Phase 4:** B2B Cart, Wishlist & Inquiry Bag API
- **Phase 5:** B2B Orders, Wholesale Checkout & Status Workflow
- **Phase 6:** Logistics, Shipment Tracking & Support APIs
- **Phase 7:** Admin Analytics & Moderation Endpoints
- **Phase 8:** Frontend-to-Backend Integration & End-to-End Validation

---

### Detailed Task Specifications

#### Phase 1: Backend Foundation & Database Connectivity
- **Task 1.1: Express Application Scaffolding**
  - *Priority:* P0 (Blocker)
  - *Dependencies:* None
  - *Acceptance Criteria:* Initialize `backend/` with `package.json`, install `express`, `cors`, `dotenv`, `helmet`, `express-rate-limit`, `nodemon`, `supertest`. Create standard directory structure. Health check endpoint `GET /api/health` returns `200 OK` with JSON `{ "status": "active" }`.
  - *Status:* 🟢 Completed
- **Task 1.2: MongoDB Atlas Connection Setup**
  - *Priority:* P0 (Blocker)
  - *Dependencies:* Task 1.1
  - *Acceptance Criteria:* Setup `src/config/db.js` using Mongoose. Connect cleanly via `process.env.MONGO_URI` with graceful error logging, graceful shutdown, and listener starting after DB connection.
  - *Status:* 🟢 Completed
- **Task 1.3: Global Error Handling & 404 Middleware**
  - *Priority:* P1
  - *Dependencies:* Task 1.1
  - *Acceptance Criteria:* Structured error responses `{ "success": false, "message": "..." }` and 404 handler without leaking stack traces in production mode.
  - *Status:* 🟢 Completed

---

#### Phase 2: Authentication, RBAC & Business Profiles
- **Task 2.1: User & Business Model (`User.js`)**
  - *Priority:* P0
  - *Dependencies:* Task 1.2
  - *Acceptance Criteria:* Schema with fields for `name`, `email` (unique index), `password` (bcrypt pre-save hook), `role` (`admin`, `seller`, `retailer`), `businessName`, `gstin` (regex validated), `phone`, `businessVerificationStatus`, `accountStatus`. Password hashes safely stripped from JSON serialization.
  - *Status:* 🟢 Completed
- **Task 2.2: Auth Endpoints (`auth.routes.js`, `auth.controller.js`)**
  - *Priority:* P0
  - *Dependencies:* Task 2.1
  - *Acceptance Criteria:*
    - `POST /api/auth/register`: Public registration (restricted to `retailer` and `seller`), duplicate email check.
    - `POST /api/auth/login`: Validates credentials, returns JWT bearer token + safe user payload.
    - `GET /api/auth/me`: Returns active user profile for token holder.
    - `POST /api/auth/logout`: Acknowledges session termination for client token disposal.
    - `POST /api/auth/provision-admin`: Internal secret-gated endpoint (`X-Admin-Secret`).
  - *Status:* 🟢 Completed
- **Task 2.3: JWT Auth & RBAC Middleware (`auth.middleware.js`, `auth.validator.js`)**
  - *Priority:* P0
  - *Dependencies:* Task 2.2
  - *Acceptance Criteria:* `authenticate` extracts and verifies Bearer token. `authorizeRoles(...roles)` blocks unauthorized roles with `403 Forbidden`. `requireBusinessVerification` gates wholesale operations. Zod validates request schemas with rate limiting.
  - *Status:* 🟢 Completed

---

#### Phase 3: Saree Catalog & Inventory Engine
- **Task 3.1: Saree Product Model (`Product.js`)**
  - *Priority:* P0
  - *Dependencies:* Task 1.2
  - *Acceptance Criteria:* Schema storing `name`, `slug` (auto-generated unique index), `category` (Banarasi, Kanchipuram, Chanderi, Organza, Silk, Cotton), `fabric`, `moq`, `price`, `origin`, `rating`, `reviewCount`, `image`, `images`, `stock`, `seller` (ref to User), `isActive`. Virtuals for `formattedPrice` ("₹4,500/pc") and `formattedMoq` ("5 pcs").
  - *Status:* 🟢 Completed
- **Task 3.2: Public Catalog Endpoints (`product.routes.js`, `product.controller.js`)**
  - *Priority:* P0
  - *Dependencies:* Task 3.1
  - *Acceptance Criteria:*
    - `GET /api/products`: Validated search query (`?q=`), category filter (`?category=`), fabric filter, price range (`?minPrice=`, `?maxPrice=`), sort (`newest`, `price_asc`, `price_desc`, `rating_desc`), and pagination.
    - `GET /api/products/categories`: Returns distinct active categories with fallbacks.
    - `GET /api/products/:id`: Validates ObjectId format and returns active saree.
    - `GET /api/products/slug/:slug`: Returns saree by SEO slug.
  - *Status:* 🟢 Completed
- **Task 3.3: Seller & Admin Product CRUD Endpoints**
  - *Priority:* P1
  - *Dependencies:* Task 3.2, Task 2.3
  - *Acceptance Criteria:*
    - `POST /api/products`: Protected by `seller` or `admin` role with seller ownership derived from token.
    - `PATCH /api/products/:id`: Update price, MOQ, stock, image. Enforces ownership check (sellers can only edit their own products; admins can edit all).
    - `DELETE /api/products/:id`: Soft deletion sets `isActive: false` ensuring historical orders and cart snapshots are never broken.
  - *Status:* 🟢 Completed
- **Task 3.4: Safe Development Seed Script (`seed.js`)**
  - *Priority:* P1
  - *Dependencies:* Task 3.1
  - *Acceptance Criteria:* Non-destructive, idempotent seed script importing 8 authentic sarees matching frontend mock catalog.
  - *Status:* 🟢 Completed

---

#### Phase 4: B2B Cart, Wishlist & Inquiry Bag API
- **Task 4.1: Cart & Wishlist Models (`Cart.js`, `Wishlist.js`)**
  - *Priority:* P1
  - *Dependencies:* Task 2.1, Task 3.1
  - *Acceptance Criteria:* Cart schema with unique `user` index, array of items with `product` ObjectId and integer `quantity`. Wishlist schema with unique `user` index and `products` array.
  - *Status:* 🟢 Completed
- **Task 4.2: Cart & Inquiry Bag Endpoints (`cart.routes.js`, `cart.controller.js`)**
  - *Priority:* P1
  - *Dependencies:* Task 4.1, Task 2.3
  - *Acceptance Criteria:*
    - `GET /api/cart`: Recalculates subtotal, 5% estimated textile GST, and totalUnits dynamically from active server-side products.
    - `POST /api/cart/items`: Validates positive quantity, checks against product MOQ and loom stock, increments existing items rather than duplicating.
    - `PATCH /api/cart/items/:productId`: Directly sets item quantity after MOQ/stock checks.
    - `DELETE /api/cart/items/:productId`: Removes item from cart.
    - `DELETE /api/cart`: Clears entire bag.
  - *Status:* 🟢 Completed
- **Task 4.3: Wishlist Endpoints (`wishlist.routes.js`, `wishlist.controller.js`)**
  - *Priority:* P2
  - *Dependencies:* Task 4.1, Task 2.3
  - *Acceptance Criteria:*
    - `GET /api/wishlist`: Returns active wishlisted sarees, filtering out inactive/discontinued products safely.
    - `POST /api/wishlist/items`: Adds saree idempotently preventing duplicate array entries.
    - `DELETE /api/wishlist/items/:productId`: Removes saree from saved list.
  - *Status:* 🟢 Completed

---

#### Phase 5: B2B Orders, Wholesale Checkout & Status Workflow
- **Task 5.1: Order Model (`Order.js`)**
  - *Priority:* P0
  - *Dependencies:* Task 2.1, Task 3.1
  - *Acceptance Criteria:* Fields for `orderNumber` (e.g., `#PV-ORD-1001`), `retailerId`, `items` (frozen price, quantity, saree ref, seller ref), `subtotal`, `taxAmount` (GST), `shippingAmount`, `grandTotal`, `shippingAddress`, `orderStatus`, `paymentStatus`.
- **Task 5.2: Checkout & Order Creation**
  - *Priority:* P0
  - *Dependencies:* Task 5.1, Task 4.2
  - *Acceptance Criteria:* `POST /api/orders`: Converts active cart into confirmed B2B order, deducts stock, validates minimum order threshold, clears cart upon success.
- **Task 5.3: Order Management Endpoints**
  - *Priority:* P1
  - *Dependencies:* Task 5.2, Task 2.3
  - *Acceptance Criteria:*
    - `GET /api/orders/my-orders`: Returns retailer's placed orders.
    - `GET /api/orders/seller-orders`: Returns orders containing items sold by the seller.
    - `GET /api/orders`: Admin endpoint to retrieve all platform orders with filters.
    - `PATCH /api/orders/:id/status`: Updates order progress (`Confirmed`, `In Production`, `Dispatched`, `Delivered`).

---

#### Phase 6: Logistics, Tracking & Support APIs
- **Task 6.1: Shipment Tracking Model & API (`Shipment.js`)**
  - *Priority:* P1
  - *Dependencies:* Task 5.1
  - *Acceptance Criteria:* `GET /api/tracking/:batchId` returns batch details matching UI fields (`batchNumber`, `route`, `status`, `estimatedDelivery`, `unitsCount`).
- **Task 6.2: Support Ticket Model & API (`SupportTicket.js`)**
  - *Priority:* P2
  - *Dependencies:* Task 2.1
  - *Acceptance Criteria:*
    - `POST /api/support`: Submits new B2B query or bulk order claim.
    - `GET /api/support`: Admin view to review open tickets.

---

#### Phase 7: Admin Analytics & Moderation
- **Task 7.1: Admin Analytics Endpoint (`GET /api/admin/overview`)**
  - *Priority:* P1
  - *Dependencies:* Task 2.1, Task 3.1, Task 5.1
  - *Acceptance Criteria:* Aggregates platform metrics required by [AdminOverview.jsx](file:///c:/Users/DARSHANA%20PAWAR/backend%20saree/pavitra-designer/pavitra-b2b-web/src/views/admin/AdminOverview.jsx): `totalRevenue`, `ordersCount`, `catalogItemsCount`, `verifiedRetailersCount`.
- **Task 7.2: User Verification Endpoints**
  - *Priority:* P2
  - *Dependencies:* Task 2.1, Task 2.3
  - *Acceptance Criteria:* `PATCH /api/admin/users/:id/verify`: Toggles GST and business verification status.

---

#### Phase 8: Frontend-to-Backend Integration
- **Task 8.1: API Service Layer on Frontend**
  - *Priority:* P0
  - *Dependencies:* All previous phases
  - *Acceptance Criteria:* Create `src/services/api.js` with structured helper functions and auth token headers.
- **Task 8.2: Connect Catalog, Bag, and Wishlist**
  - *Priority:* P0
  - *Dependencies:* Task 8.1
  - *Acceptance Criteria:* Replace mock initial state in `App.jsx` and `CatalogScreen.jsx` with API queries.
- **Task 8.3: Connect Auth and Role Dashboards**
  - *Priority:* P0
  - *Dependencies:* Task 8.2
  - *Acceptance Criteria:* Real login flow for Retailer, Weaver, and Admin. Live metrics on admin overview.
- **Task 8.4: End-to-End Testing & Verification**
  - *Priority:* P0
  - *Dependencies:* Task 8.3
  - *Acceptance Criteria:* Full lifecycle smoke test: Register retailer → Browse catalog → Add MOQ to Bag → Checkout Order → Admin verifies order → Check tracking.
