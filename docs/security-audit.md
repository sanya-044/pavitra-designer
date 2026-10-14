# Security Audit Report & Hardening Blueprint
## Pavitra B2B Saree E-commerce Platform

*Date: 2026-10-13 | Classification: Internal Engineering & Auditing*

---

### 1. Executive Summary
A comprehensive security review was conducted across the backend API (`backend/`) and the client application (`pavitra-b2b-web/`). The platform connects authentic artisan weaver clusters with verified retail buyers. The audit assessed authentication, authorization, data validation, rate limiting, dependency risks, and secret exposure.

**Overall Security Posture:** High. Robust role-based access control (RBAC), strict server-side price calculation, atomic inventory manipulation, and last-administrator protection safeguards are established.

---

### 2. Threat Vector Review & Findings

#### 2.1 Authentication & Session Management
- **Password Hashing:** Passwords hashed with `bcryptjs` using automatic salt generation (cost factor 10) in Mongoose pre-save middleware.
- **JWT Signature:** Signed using `HS256` with environment variable `JWT_SECRET` and configurable expiration (`7d`).
- **Token Leakage:** Model schema `.toJSON()` transform automatically strips `password` and `__v` from all JSON responses.
- **Session Revocation:** Client discards stored Bearer token on logout; backend rejects tokens belonging to deleted or suspended accounts (`accountStatus !== 'active'`).
- **Brute Force Protection:** Dedicated `authLimiter` restricts registration, login, and admin provisioning to **15 attempts per 15 minutes** per IP.

#### 2.2 Authorization & Tenant Isolation
- **Role Elevation:** Public registration strictly restricted to `retailer` and `seller` via Zod enum validation. Attempts to register with `role: "admin"` are rejected with `400 Bad Request`.
- **Admin Provisioning:** Secured via internal `provision-admin` endpoint requiring secret header `X-Admin-Secret`.
- **Last-Admin Safeguard:** Suspending an admin (`PATCH /api/admin/users/:id/status`) checks total active admins and returns `400 Bad Request` if attempting to deactivate the final remaining administrator.
- **Cross-Tenant Ownership:**
  - Sellers can only access, edit, or quote products, inquiries, and orders mapped to their own seller ObjectId.
  - Retailers can only view and mutate their own cart, wishlist, inquiries, and orders.
  - Cross-tenant requests return `403 Forbidden`.

#### 2.3 Injection & Request Validation
- **SQL / NoSQL Injection:** All request bodies and query parameters pass through strict `zod` schemas. ObjectIds are validated via `mongoose.Types.ObjectId.isValid()`. Regex queries on product search sanitize special characters (`replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`).
- **HTTP Header Security:** `helmet()` is active on all Express endpoints.
- **CORS Protection:** Configurable origin whitelist (`FRONTEND_URL`) restricting browser access to authorized domains.

#### 2.4 Business Logic & Trust Boundaries
- **Zero Frontend Trust:** Prices, subtotals, tax rates, and grand totals sent from frontend requests are discarded.
- **Historic Snapshots:** Orders and inquiries preserve historical product snapshots (`name`, `fabric`, `category`, `origin`, `price`, `moq`) at time of transaction so later catalog edits never alter financial ledgers.
- **Atomic Stock Deduction:** Decrements inventory atomically using conditional MongoDB queries (`{ stock: { $gte: quantity } }`). Concurrent collisions fail gracefully with automated compensation rollback.
- **Order Cancellation:** Automatically restores reserved stock to catalog inventory.

#### 2.5 Secret Management & Environment Hygiene
- **Git Exclusions:** Real `.env` files are excluded from Git via `.gitignore` in both `backend/` and `pavitra-b2b-web/`.
- **Templates:** `.env.example` templates contain empty placeholders.
- **Remediation Note on MongoDB URI:** If any real connection string was previously pasted into local test prompts, rotate the database user password immediately on MongoDB Atlas under **Security > Database Access** and whitelist only authorized deployment IP addresses.

---

### 3. Vulnerability Remediation & Verification

| Area | Threat | Remediation Applied | Status |
| :--- | :--- | :--- | :---: |
| **API Rate Limiting** | Denial of Service / Credential Stuffing | Implemented dual-tier `express-rate-limit`: Global API (100 req/15 min) + Auth specific (15 req/15 min) | 🟢 Verified |
| **Mongoose Deprecation** | Deprecated `{ new: true }` option | Migrated atomic stock updates to `{ returnDocument: 'after' }` | 🟢 Verified |
| **Frontend .env Gitignore** | Accidental commit of frontend environment variables | Added `.env` and `.env*.local` to `pavitra-b2b-web/.gitignore` | 🟢 Verified |
| **Dev Dependency Alert** | Stack exhaustion in `braces` via dev tool `nodemon` | Dev-only vulnerability in local file watcher; does not run in production bundle | 🟡 Documented |
