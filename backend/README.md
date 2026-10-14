# Pavitra B2B Backend REST API

REST API for Pavitra B2B Saree E-commerce Platform connecting authentic Indian weavers with boutique and retail buyers.

---

## 🛠️ Tech Stack
- **Runtime:** Node.js (v24.x LTS)
- **Framework:** Express.js (v5.x)
- **Database:** MongoDB Atlas via Mongoose (v9.x)
- **Authentication & Security:** JWT (`jsonwebtoken`), `bcryptjs`, `helmet`, `cors`, `express-rate-limit`
- **Validation:** `zod`
- **Testing:** Node.js Native Test Runner (`node:test`) + `supertest`

---

## 📁 Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & disconnect handlers
│   ├── controllers/
│   │   ├── auth.controller.js    # Register, Login, Me, Logout, Provision Admin
│   │   └── product.controller.js # Catalog listings, search, filter, CRUD & soft delete
│   ├── middleware/
│   │   ├── auth.middleware.js    # authenticate, authorizeRoles, requireBusinessVerification
│   │   ├── errorHandler.js       # Centralized error handler
│   │   └── notFound.js           # 404 handler
│   ├── models/
│   │   ├── Product.js            # Saree model with slug, MOQ, price, stock, virtuals
│   │   └── User.js               # User schema with bcrypt hashing & GSTIN validation
│   ├── routes/
│   │   ├── auth.routes.js        # Authentication endpoints & role check
│   │   ├── health.routes.js      # Health & diagnostics endpoints
│   │   └── product.routes.js     # Public & protected catalog routes
│   ├── services/                 # Business logic service layer
│   ├── validators/
│   │   ├── auth.validator.js     # Auth Zod validation schemas
│   │   └── product.validator.js  # Product Zod validation schemas
│   ├── utils/
│   │   ├── jwt.js                # JWT sign and verify helpers
│   │   └── seed.js               # Safe, idempotent development seed script
│   └── app.js                    # Express app initialization & security pipeline
├── tests/
│   ├── auth.test.js              # 13 auth & RBAC integration tests
│   ├── health.test.js            # Health and 404 integration tests
│   └── product.test.js           # 14 catalog and ownership integration tests
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git exclusions (.env, node_modules, logs)
├── package.json                  # Dependencies and scripts
├── README.md                     # Documentation
└── server.js                     # HTTP server entry point & graceful shutdown
```

---

## 🚀 Setup & Installation

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your settings:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@saree.lpo9aop.mongodb.net/pavitra?retryWrites=true&w=majority&appName=saree
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
JWT_SECRET=your_long_random_jwt_secret_key
JWT_EXPIRES_IN=7d
ADMIN_SECRET_KEY=your_internal_admin_provision_secret
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run Production Server
```bash
npm start
```

### 5. Run Automated Tests
```bash
npm test
```

### 6. (Optional) Run Development Seed
To populate the database with the 8 authentic sarees matching the frontend mock catalog:
```bash
npm run seed
```
*(Idempotent: safely skips already-existing sarees and never overwrites production records).*

---

## 📡 API Endpoints

### Health & Diagnostics
- `GET /` — API root greeting
- `GET /api/health` — API liveness & MongoDB connection state

### Authentication & Authorization (`/api/auth`)
- `POST /api/auth/register` — Public registration for `retailer` or `seller` with optional business details (GSTIN)
- `POST /api/auth/login` — Authenticate and obtain JWT Bearer token
- `GET /api/auth/me` — Retrieve active authenticated user profile (Bearer token required)
- `POST /api/auth/logout` — Acknowledge session termination (client discards stored token)
- `POST /api/auth/provision-admin` — Internal endpoint to provision system administrator (protected by `X-Admin-Secret` header)
- `GET /api/auth/admin-only` — Diagnostic endpoint verifying `admin` role authorization

### Saree Catalog (`/api/products`)
- `GET /api/products` — List active sarees with search (`?q=`), category (`?category=`), fabric (`?fabric=`), price range (`?minPrice=`, `?maxPrice=`), sort (`?sort=`), and pagination (`?page=`, `?limit=`)
- `GET /api/products/categories` — List distinct saree categories (Banarasi, Kanchipuram, Chanderi, Organza, etc.)
- `GET /api/products/:id` — Get single saree by MongoDB ObjectId
- `GET /api/products/slug/:slug` — Get single saree by SEO-friendly slug
- `POST /api/products` — Create new saree listing (Private: `admin`, `seller`). Seller is automatically assigned from token.
- `PATCH /api/products/:id` — Update saree listing (Private: `admin` can edit any product; `seller` can edit only own products)
- `DELETE /api/products/:id` — Soft-delete / deactivate saree listing (Private: `admin`, `seller` [own product only])

### B2B Inquiry Bag / Cart (`/api/cart`)
- `GET /api/cart` — Retrieve active user's cart with server-calculated subtotal, 5% estimated GST, and totalUnits
- `POST /api/cart/items` — Add product or increment existing quantity (enforcing MOQ and stock)
- `PATCH /api/cart/items/:productId` — Directly change quantity (enforcing MOQ and stock)
- `DELETE /api/cart/items/:productId` — Remove single item from inquiry bag
- `DELETE /api/cart` — Clear all items in inquiry bag

### Wishlist (`/api/wishlist`)
- `GET /api/wishlist` — Retrieve active saved sarees (inactive items filtered out dynamically)
- `POST /api/wishlist/items` — Add product to wishlist (idempotent, prevents duplicates)
- `DELETE /api/wishlist/items/:productId` — Remove product from wishlist

### B2B Wholesale Inquiries (`/api/inquiries`)
- `POST /api/inquiries` — Create a bulk-order quotation inquiry (Private: `retailer`, `admin`)
- `GET /api/inquiries/my` — List current retailer's submitted inquiries
- `GET /api/inquiries/:id` — Retrieve inquiry details (Private: retailer owner, target seller, or admin)
- `PATCH /api/inquiries/:id` — Update inquiry notes/shipping address (Allowed only while status is `pending`)

### B2B Wholesale Orders (`/api/orders`)
- `POST /api/orders` — Place order from Cart or from approved Quotation inquiry (Atomic stock deduction, MOQ enforcement, server-side totals, idempotency protection)
- `GET /api/orders/my` — List current retailer's orders
- `GET /api/orders/:id` — Retrieve authorized order details

### Weaver Seller Management (`/api/seller`)
- `GET /api/seller/dashboard/stats` — Live weaver-specific production and revenue metrics
- `GET /api/seller/products` — Saree listings manufactured by authenticated weaver (strict ownership isolation)
- `PATCH /api/seller/profile` — Update permitted business profile fields (`businessName`, `phone`, `gstin`)
- `GET /api/seller/inquiries` — List inquiries assigned to the authenticated weaver's loom cluster
- `PATCH /api/seller/inquiries/:id/quote` — Submit formal wholesale quotation with custom price per unit & validity period
- `GET /api/seller/orders` — List orders containing sarees manufactured by this seller
- `PATCH /api/seller/orders/:id/status` — Update order fulfillment within allowed status transitions

### Admin Supervision & Operations (`/api/admin`)
- `GET /api/admin/dashboard/stats` (alias `GET /api/admin/overview`) — Platform live aggregation metrics for `AdminOverview.jsx`
- `GET /api/admin/users` — Paginated user management with role, status, and verification filtering
- `GET /api/admin/users/:id` — Detailed user profile with related order/product metrics
- `PATCH /api/admin/users/:id/status` — Activate or suspend accounts (with Last-Admin Protection)
- `PATCH /api/admin/users/:id/verification` — Update business GSTIN verification status
- `GET /api/admin/products` — Catalog administration view including active and deactivated sarees
- `GET /api/admin/inquiries` — View and filter all platform inquiries
- `PATCH /api/admin/inquiries/:id/status` — Update inquiry status directly
- `GET /api/admin/orders` — View and filter all platform orders
- `PATCH /api/admin/orders/:id/status` — Admin update order status with automatic stock release on cancellation


