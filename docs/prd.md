# Product Requirements Document (PRD)
## Pavitra B2B Saree E-commerce Platform

---

### 1. Document Overview
- **Project Name:** Pavitra B2B Saree E-commerce
- **Tagline:** Direct Mill & Weaver to Retailer Wholesale Marketplace
- **Document Version:** 1.0.0
- **Status:** Draft / Ready for Approval

---

### 2. Product Vision & Problem Statement
The Indian traditional saree trade relies heavily on multiple layers of intermediaries, brokers, and regional distributors. This results in:
- High markups (30%–60%) for independent retail store owners.
- Delayed payment cycles and lack of direct market access for authentic weavers in clusters like Varanasi, Kanchipuram, Chanderi, and Surat.
- Unreliable inventory visibility and lack of transparent Minimum Order Quantities (MOQ).

**Pavitra B2B Saree E-commerce** bridges this gap by offering a dedicated business-to-business platform connecting verified textile weavers directly with regional saree retailers, enabling bulk purchasing, transparent tier pricing, GST compliance, and end-to-end batch tracking.

---

### 3. User Personas & Roles

| Role | Description | Key Responsibilities & Goals |
| :--- | :--- | :--- |
| **Retailer / Buyer** | Saree boutique owner or retail store merchant | Discovers authentic handlooms, evaluates MOQ and wholesale pricing, manages B2B inquiry bag, submits bulk orders with GSTIN, tracks shipment batches. |
| **Seller / Weaver** | Master weaver, handloom cluster society, or textile mill owner | Lists new saree designs with wholesale rates, specifies production batch lead times and MOQ, manages stock, fulfills bulk wholesale orders. |
| **System Admin** | Pavitra platform operations team | Verifies business accounts and GSTIN numbers, oversees platform-wide catalog, moderates listings, monitors wholesale transactions, and handles support escalations. |

---

### 4. Existing Features vs. Planned Features

#### 4.1 Existing Features (Frontend UI & Mock State)
- **Wholesale Catalog Discovery:**
  - Grid presentation displaying saree image, name, fabric category, origin hub, rating, wholesale price (e.g., `₹4,500/pc`), and MOQ (e.g., `5 pcs`).
  - Category filters: Banarasi, Kanchipuram, Chanderi, Organza.
  - Client-side keyword search across titles and weaver origins.
- **B2B Inquiry Bag (Cart):**
  - Cart drawer/view with item listing, MOQ counters, increment/decrement controls, item deletion, and summary breakdown.
- **Wishlist:**
  - Heart toggle on catalog items, separate wishlist view, moving items to bag.
- **Multi-Role Frontend Simulation:**
  - Role switcher in Auth view for Retailer and Seller.
  - Dedicated Admin login modal simulation with predefined credentials (`admin@pavitra.com`).
- **Role Dashboards:**
  - *Admin Dashboard:* Tabs for Overview metrics, Saree Catalog management (adding/deleting items in frontend state), and Retailer Bulk Orders table.
  - *Retailer Dashboard:* High-level view showing active batches, ordered saree units, and GST input credit.
  - *Seller Dashboard:* Listing preview and active stock management interface.
- **Logistics & Support Mockups:**
  - Delivery batch timeline preview showing route, batch ID, and estimated arrival.
  - Support contact screen with helpline, email, and working hours.

#### 4.2 Planned Features (To be enabled by MERN Backend)
- **Persistent User & Business Authentication:**
  - JWT token generation with secure cookie/header handling.
  - Secure password hashing (bcrypt).
  - Business profile onboarding: Trade Name, GSTIN number, PAN, billing & delivery addresses.
  - Admin approval workflow for Seller and Retailer verification.
- **Dynamic Database-Driven Saree Catalog:**
  - MongoDB-backed product management with full CRUD.
  - Advanced filtering (fabric, weave type, origin cluster, price tier, MOQ range, stock status).
  - Multi-image storage and gallery support.
- **Persistent Cart & Wishlist:**
  - Database persistence synced to authenticated retailer user accounts.
  - Real-time stock and MOQ validation against catalog availability.
- **Wholesale Order & Inquiry Processing:**
  - Structured B2B checkout calculating subtotal, applicable GST (5% / 12% textile rates), and bulk freight estimate.
  - Order state lifecycle: `Pending Verification` → `Weaver Confirmed` → `In Production / Packed` → `Dispatched` → `In Transit` → `Delivered` → `Cancelled`.
- **Logistics & Shipment Management:**
  - Batch creation with consignment tracking numbers, transporter partner, and milestone updates.
- **Support & Dispute Tickets:**
  - Persistent inquiry ticketing system with priority levels, category tags, and admin resolution workflows.

---

### 5. Functional Requirements (FR)

- **FR-1: Authentication & RBAC**
  - System must enforce Role-Based Access Control (`retailer`, `seller`, `admin`).
  - Admin routes and seller inventory creation must reject unauthorized roles with HTTP 403.
- **FR-2: B2B Business Verification**
  - Retailer and Seller registrations must capture valid 15-character Indian GSTIN (where applicable) and business address.
  - Admin must be able to mark accounts as `verified` or `pending_verification`.
- **FR-3: Product Catalog & MOQ Enforcement**
  - Products must store minimum order quantities (MOQ). Cart additions lower than the MOQ must be blocked or adjusted to the minimum threshold.
- **FR-4: Order & Inquiry Lifecycle**
  - Placing an order must create an immutable snapshot of product pricing and MOQ at time of purchase.
  - Retailers, Sellers, and Admins must view order status tailored to their role.
- **FR-5: Logistics & Tracking**
  - Shipments must be tracked via unique batch identifiers (`Batch #PV-XXXXX`) matching the existing UI design.

---

### 6. Non-Functional Requirements (NFR)

- **Security:** Passwords encrypted using bcrypt (salt rounds >= 10); API endpoints protected via JWT; CORS policy configured for the Vite frontend domain.
- **Performance:** Catalog queries with pagination and index optimization returning responses in < 250ms.
- **Data Integrity:** Strict Mongoose schemas with validation preventing negative quantities, invalid prices, or malformed GSTIN numbers.
- **Maintainability:** Modular MVC/layered architecture (Routes, Controllers, Services, Models, Middleware).
- **Scalability:** Stateless API design allowing horizontal scaling.

---

### 7. Success Metrics & Future Enhancements

- **Phase 1 Success:** Complete elimination of client mock data; 100% of catalog, cart, orders, and auth operations persisted in MongoDB.
- **Future Enhancements (Post-MVP Decisions):**
  - Integration with third-party payment gateways (Razorpay B2B / NEFT / RTGS receipt upload).
  - Cloud image management (Cloudinary / AWS S3).
  - Live third-party logistics API webhooks (Shiprocket / Delhivery B2B freight).
  - WhatsApp Business API notification triggers for weaver dispatch alerts.
