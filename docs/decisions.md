# Architecture Decisions & Assumptions Log
## Pavitra B2B Saree E-commerce Platform

---

### 1. Architectural Decisions (ADR)

#### ADR-01: Monorepo Peer Structure for Frontend and Backend
- **Context:** The frontend currently resides in `pavitra-designer/pavitra-b2b-web/`. We need to introduce a Node.js/Express backend without disrupting the frontend.
- **Decision:** Place the backend in a peer directory `pavitra-designer/pavitra-b2b-api/`. 
- **Rationale:** Keeps frontend dependencies (React 19, Tailwind 4, Vite) strictly separated from backend dependencies (Express, Mongoose, bcryptjs), preventing package conflicts and clean deployment boundaries.

#### ADR-02: MongoDB Atlas + Mongoose for Data Persistence
- **Context:** The application needs a scalable database to store textile catalogs with varying attributes (fabric types, origins, weave structures, variable pricing, MOQ).
- **Decision:** Use MongoDB Atlas as the primary database with Mongoose as the ODM.
- **Rationale:** Schema flexibility in MongoDB accommodates varied textile specs while Mongoose ensures strict schema enforcement for critical fields like prices, MOQs, and GSTINs.

#### ADR-03: Stateless JWT Authentication with Role-Based Access Control (RBAC)
- **Context:** Three distinct personas interact with the platform: Retailer Buyer, Weaver/Seller, and System Admin.
- **Decision:** Implement JSON Web Tokens (JWT) with bearer authorization headers. Encode `userId` and `role` within token claims.
- **Rationale:** Stateless, highly scalable, and integrates cleanly with client single-page applications.

#### ADR-04: Non-Destructive Integration Strategy
- **Context:** The user specifically requested to preserve existing UI, styling, and React 19 setup.
- **Decision:** Retain all JSX components and CSS styles. Replace client mock arrays with asynchronous service calls incrementally without altering existing visual components.

#### ADR-05: Bearer Token Storage and Stateless Logout Strategy
- **Context:** Authentication must support SPA frontend consumption while preventing CSRF vulnerabilities associated with ambient cookie transport in cross-origin setups.
- **Decision:** Use standard HTTP `Authorization: Bearer <token>` headers. Store tokens in secure in-memory or sessionStorage on the frontend. Logout is implemented via client-side token discard, with the server acknowledging the session conclusion.
- **Rationale:** Avoids third-party cookie restrictions and CSRF vulnerabilities without complicated double-submit cookie schemes.

#### ADR-06: Controlled Administrative Provisioning
- **Context:** Admin accounts must never be created through public registration endpoints to prevent privilege escalation attacks.
- **Decision:** Public registration (`POST /api/auth/register`) strictly validates roles to `retailer` or `seller`. Dedicated `POST /api/auth/provision-admin` endpoint is gated by a cryptographically secure `ADMIN_SECRET_KEY` header.
- **Rationale:** Guarantees zero public privilege elevation paths while allowing automated bootstrapping and environment setup.

#### ADR-07: Saree Catalog Soft Deletion & Ownership Partitioning
- **Context:** Hard-deleting catalog products breaks historical order snapshots, cart references, and shipment tracking links. Furthermore, sellers must only manage their own loomed stock.
- **Decision:** Saree products utilize soft deletion (`isActive: false`). Public queries index on `{ isActive: true }`. Sellers are strictly verified against `product.seller.toString() === req.user.id.toString()` before any mutation, while platform admins retain universal moderation access.
- **Rationale:** Preserves referential integrity across past wholesale transactions while providing strict multi-tenant weaver isolation.

#### ADR-08: Server-Side Cart Pricing and Minimum Order Quantity (MOQ) Enforcement
- **Context:** Wholesale saree transactions involve custom MOQs per weaving cluster and volatile bulk pricing. Untrusted client submissions could attempt to bypass MOQs or submit manipulated line-item subtotals.
- **Decision:** The Cart model stores only `product` references and `quantity`. When reading or updating the inquiry bag, prices and subtotals are recalculated in real time against the active MongoDB `Product` records. The server rejects any line-item update where `quantity < product.moq` or `quantity > product.stock`.
- **Rationale:** Prevents fraudulent pricing tampering, guarantees weaver MOQ agreements, and avoids out-of-sync product prices in long-lived carts.

---

### 2. Documented Assumptions

1. **Role Access Distribution:**
   - `retailer`: Can browse products, manage wishlist, add to inquiry bag, submit bulk orders, and view own order history.
   - `seller`: Can manage own saree listings, view bulk orders containing their inventory, and update dispatch status.
   - `admin`: Superuser access to add/edit/delete any saree, view all orders, verify GSTINs, and inspect platform analytics.
2. **Catalog Seed Data:**
   - The initial MongoDB database seed will import the 8 saree designs already defined in [CatalogScreen.jsx](file:///c:/Users/DARSHANA%20PAWAR/backend%20saree/pavitra-designer/pavitra-b2b-web/src/views/catalog/CatalogScreen.jsx) to guarantee immediate visual continuity.
3. **B2B Bulk Pricing & MOQs:**
   - Every product has a mandatory MOQ (Minimum Order Quantity). Unlike B2C stores where quantity defaults to 1 piece, B2B wholesale orders must adhere to minimum batch quantities (e.g. 5 pcs).
4. **Server-Side Pricing & Snapshot Retention:**
   - Never trust frontend totals, prices, or discounts. All item subtotals, GST (5% for textiles), and grand totals are calculated server-side.
   - Products maintain immutable snapshots (`name`, `category`, `fabric`, `origin`, `price`, `moq`) at time of order creation so future catalog adjustments never affect historical records.
5. **Idempotency & Concurrent Stock Management:**
   - Order creation supports optional `idempotencyKey` headers/payloads to prevent duplicate orders or double charging on network retry.
   - Atomic inventory deduction uses conditional MongoDB `$inc` with `{ stock: { $gte: item.quantity } }` and rollback compensation.
6. **Inquiry Lifecycle & Status Transitions:**
   - Inquiry lifecycle: `pending` → `quoted` → `accepted` | `rejected` | `expired` → `converted_to_order`.
   - Order fulfillment transitions: `pending` → `confirmed` → `in_production` → `dispatched` → `in_transit` → `delivered` (or `cancelled`). On cancellation, reserved stock is automatically replenished.
7. **Last-Admin Safeguard Protection:**
   - Account status suspension (`PATCH /api/admin/users/:id/status`) checks total active admins and prohibits suspending the last remaining active administrator to prevent permanent lockout.
8. **Seller Ownership Isolation:**
   - A seller can only view (`/api/seller/products`) and edit (`PATCH /api/products/:id`) products they own. Cross-tenant modification returns `403 Forbidden`.
   - Seller profile updates are restricted to non-privileged fields (`name`, `phone`, `businessName`, `gstin`). Role escalation and self-verification are strictly rejected.
9. **Business Verification Lifecycle:**
   - Verification status: `unverified` → `pending` → `verified` | `rejected`.
   - When an unverified seller or retailer updates/submits a valid GSTIN format, status advances to `pending` for admin review. Only authorized admins can mark status as `verified`.

---

### 3. Decisions to Finalize (Pending User Confirmation / Approval)

The following items are **not assumed or pre-implemented** and require explicit decision before future phases:

| Area | Decision Question | Current Recommendation | Status |
| :--- | :--- | :--- | :---: |
| **Payment Gateway** | Should we integrate Razorpay/Stripe, or retain B2B Invoicing / NEFT / RTGS credit terms? | Phase 1: Implement "B2B Credit Invoice / Bank Transfer". Finalize Razorpay integration for Phase 2. | 🟡 Decision Pending |
| **Media / Image Uploads** | Will saree images continue using external URLs (e.g., Unsplash/CDN) or require Cloudinary / AWS S3 uploads? | Phase 1: Allow image URL strings. Finalize Cloudinary/Multer integration when weaver upload form is enhanced. | 🟡 Decision Pending |
| **Live Logistics Tracking** | Should logistics be connected to an actual third-party aggregator (e.g., Shiprocket, Delhivery B2B) or an internal tracking model? | Internal MongoDB `Shipment` model matching current UI batch `#PV-88321`. External logistics API decided later. | 🟡 Decision Pending |
| **Client Routing** | Should the frontend adopt `react-router-dom` for browser URL history (e.g., `/catalog`, `/orders`), or remain on the current `useState` view switcher? | Current `useState` view switcher works smoothly; adding `react-router-dom` can be evaluated as an optional enhancement. | 🟡 Decision Pending |
