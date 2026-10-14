# REST API Contract Specification
## Pavitra B2B Saree E-commerce Platform

---

### 1. Base URL & Protocol
- **Base URL (Local Development):** `http://localhost:5000/api`
- **Content-Type:** `application/json`
- **Authentication Scheme:** `Authorization: Bearer <JWT_TOKEN>`

---

### 2. Standard Response Format

#### Success Response
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {}
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Validation error or resource not found",
  "errors": [
    {
      "field": "price",
      "message": "Price must be a positive integer"
    }
  ]
}
```

---

### 3. API Endpoints

#### 3.0 Health & Diagnostics (`/api/health`)

##### `GET /api/health`
- **Access:** Public
- **Description:** Checks the API operational status and current MongoDB connection state.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Pavitra B2B API is running",
    "status": "active",
    "timestamp": "2026-10-13T14:38:00.000Z",
    "database": "connected",
    "environment": "development"
  }
  ```

#### 3.1 Authentication & Profile (`/api/auth`)

##### `POST /api/auth/register`
- **Access:** Public
- **Description:** Registers a new B2B user (`retailer` or `seller`).
- **Request Body:**
  ```json
  {
    "name": "Rajesh Kumar",
    "email": "rajesh@sareeboutique.com",
    "password": "SecurePassword123!",
    "role": "retailer",
    "businessName": "Varanasi Silk Emporium",
    "gstin": "09AAAAA0000A1Z5",
    "phone": "+91 9876543210"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "message": "Account registered successfully. Pending business verification.",
    "data": {
      "user": {
        "id": "670c1a2f9b1d8c0012345678",
        "name": "Rajesh Kumar",
        "email": "rajesh@sareeboutique.com",
        "role": "retailer",
        "businessName": "Varanasi Silk Emporium",
        "gstin": "09AAAAA0000A1Z5",
        "isVerified": false
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

##### `POST /api/auth/login`
- **Access:** Public
- **Description:** Authenticates any user (`retailer`, `seller`, or `admin`).
- **Request Body:**
  ```json
  {
    "email": "admin@pavitra.com",
    "password": "admin123"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Authentication successful",
    "data": {
      "user": {
        "id": "670c1a2f9b1d8c0012345679",
        "name": "System Administrator",
        "email": "admin@pavitra.com",
        "role": "admin"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

##### `GET /api/auth/me`
- **Access:** Private (Bearer Token)
- **Description:** Retrieves the authenticated user's current session and profile data.
- **Response `200 OK`:** Returns full user profile (`password` excluded).

##### `POST /api/auth/logout`
- **Access:** Private (Bearer Token)
- **Description:** Acknowledges session logout. The client should discard the authorization Bearer token from local/session storage.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Logged out successfully. The client should discard the stored authorization token."
  }
  ```

##### `POST /api/auth/provision-admin`
- **Access:** Internal / Admin-Secret
- **Headers:** `X-Admin-Secret: <ADMIN_SECRET_KEY>`
- **Description:** Provision initial administrative master account without exposing public registration elevation.
- **Request Body:**
  ```json
  {
    "name": "System Administrator",
    "email": "admin@pavitra.com",
    "password": "SecureAdminPassword123!"
  }
  ```
- **Response `201 Created`:** Returns admin user payload and signed JWT.

---

#### 3.2 Saree Catalog (`/api/products`)

##### `GET /api/products`
- **Access:** Public
- **Query Parameters:**
  - `category` (optional, e.g. `Banarasi`, `Kanchipuram`, `Chanderi`, `Organza`)
  - `q` (optional keyword search for name or origin)
  - `minPrice`, `maxPrice` (optional)
  - `page` (default: 1), `limit` (default: 20)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "products": [
        {
          "id": "670c1a2f9b1d8c0012345680",
          "name": "Royal Banarasi Katan Silk Saree",
          "category": "Banarasi",
          "moq": 5,
          "price": 4500,
          "formattedPrice": "₹4,500/pc",
          "rating": 4.8,
          "image": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600",
          "images": [
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600"
          ],
          "origin": "Varanasi",
          "stock": 150,
          "seller": {
            "id": "670c1a2f9b1d8c0012345681",
            "name": "Varanasi Weavers Co-op",
            "businessName": "Varanasi Silk Mills"
          }
        }
      ],
      "pagination": {
        "total": 8,
        "page": 1,
        "pages": 1
      }
    }
  }
  ```

##### `GET /api/products/categories`
- **Access:** Public
- **Description:** Retrieve distinct active saree categories (e.g. `Banarasi`, `Kanchipuram`, `Chanderi`, `Organza`).

##### `GET /api/products/:id`
- **Access:** Public
- **Description:** Fetch detailed product information by MongoDB ObjectId.

##### `GET /api/products/slug/:slug`
- **Access:** Public
- **Description:** Fetch detailed product information by SEO slug.

##### `POST /api/products`
- **Access:** Private (`seller`, `admin`)
- **Description:** Create a new saree catalog listing. Seller ownership is automatically assigned from the authenticated user token.
- **Request Body:**
  ```json
  {
    "name": "Zari Woven Tissue Silk Banarasi",
    "description": "Shimmering tissue silk saree with intricate gold floral jaal.",
    "category": "Banarasi",
    "fabric": "Tissue Silk",
    "origin": "Varanasi",
    "image": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600",
    "price": 5500,
    "moq": 5,
    "stock": 40
  }
  ```
- **Response `201 Created`**

##### `PATCH /api/products/:id`
- **Access:** Private (`admin` can edit any product; `seller` can edit only own products)
- **Description:** Update price, MOQ, stock, image, or catalog details.
- **Request Body (Partial update):**
  ```json
  {
    "price": 5200,
    "stock": 35
  }
  ```

##### `DELETE /api/products/:id`
- **Access:** Private (`admin` can deactivate any product; `seller` can deactivate only own products)
- **Description:** Soft-deactivates saree listing (`isActive: false`), removing it from public browse while preserving historical orders and references.

##### 3.2.1 Frontend Field Mapping Table

| Frontend Mock Field (`CatalogScreen.jsx` / `AdminCatalog.jsx`) | Backend API Field (`Product.js`) | Type / Format | Notes |
| :--- | :--- | :--- | :--- |
| `saree.id` | `product.id` | String (ObjectId) | Primary identifier |
| `saree.name` | `product.name` | String | Saree title |
| - | `product.slug` | String | URL-friendly slug |
| `saree.category` | `product.category` | String | `Banarasi`, `Kanchipuram`, etc. |
| `saree.price` (`"₹4,500/pc"`) | `product.formattedPrice` | String | Virtual getter matching UI format |
| `saree.price` (numeric) | `product.price` | Number | Integer in INR |
| `saree.moq` (`"5 pcs"`) | `product.formattedMoq` | String | Virtual getter matching UI format |
| `saree.moq` (numeric) | `product.moq` | Number | Integer minimum batch units |
| `saree.origin` | `product.origin` | String | Weaver cluster city |
| `saree.rating` | `product.rating` | Number | System rating (1.0 to 5.0) |
| `saree.image` | `product.image` | String (URL) | Primary display image |
| - | `product.stock` | Number | Available loom stock units |
| - | `product.seller` | Object | Populated seller `{ id, name, businessName }` |

---

#### 3.3 B2B Bag / Cart (`/api/cart`)

##### `GET /api/cart`
- **Access:** Private (Authenticated User)
- **Description:** Fetch current user's inquiry bag items with server-calculated subtotal, 5% estimated textile GST, and totalUnits.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Cart retrieved successfully.",
    "data": {
      "cart": {
        "id": "670c1a2f9b1d8c0012345690",
        "items": [
          {
            "product": {
              "id": "670c1a2f9b1d8c0012345680",
              "name": "Royal Banarasi Katan Silk Saree",
              "slug": "royal-banarasi-katan-silk-saree",
              "category": "Banarasi",
              "fabric": "Katan Silk",
              "origin": "Varanasi",
              "image": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600",
              "price": 4500,
              "formattedPrice": "₹4,500/pc",
              "moq": 5,
              "formattedMoq": "5 pcs",
              "stock": 120
            },
            "quantity": 5,
            "itemTotal": 22500,
            "formattedItemTotal": "₹22,500"
          }
        ],
        "totalUnits": 5,
        "subtotal": 22500,
        "formattedSubtotal": "₹22,500",
        "estimatedTax": 1125,
        "formattedEstimatedTax": "₹1,125",
        "grandTotal": 23625,
        "formattedGrandTotal": "₹23,625"
      }
    }
  }
  ```

##### `POST /api/cart/items`
- **Access:** Private (Authenticated User)
- **Description:** Add saree to bag or increment quantity if already present. Enforces product MOQ and loom stock limits.
- **Request Body:**
  ```json
  {
    "productId": "670c1a2f9b1d8c0012345680",
    "quantity": 5
  }
  ```

##### `PATCH /api/cart/items/:productId`
- **Access:** Private (Authenticated User)
- **Description:** Update quantity of item in bag directly (must satisfy product MOQ and available stock).
- **Request Body:**
  ```json
  {
    "quantity": 10
  }
  ```

##### `DELETE /api/cart/items/:productId`
- **Access:** Private (Authenticated User)
- **Description:** Remove a single item from the bag.

##### `DELETE /api/cart`
- **Access:** Private (Authenticated User)
- **Description:** Clear all items in the inquiry bag.

##### 3.3.1 Frontend Cart Field Mapping Table

| Frontend Mock Field (`BagScreen.jsx` / `Navbar.jsx`) | Backend API Field (`Cart.js` / `Product.js`) | Type / Notes |
| :--- | :--- | :--- |
| `cart.length` / `totalItems` (badge count) | `cart.totalUnits` | Sum of all quantities across items |
| `item.id` | `item.product.id` | MongoDB ObjectId |
| `item.name` | `item.product.name` | Saree title |
| `item.origin` | `item.product.origin` | Weaver cluster hub |
| `item.moq` | `item.product.formattedMoq` | `"5 pcs"` formatted string |
| `item.price` | `item.product.formattedPrice` | `"₹4,500/pc"` formatted unit price |
| `item.quantity` | `item.quantity` | Integer batch units |
| `itemTotal` | `item.itemTotal` | Subtotal for item (`unitPrice * quantity`) |
| `subtotal` | `cart.subtotal` | Sum of all itemTotals in INR |
| `grandTotal` | `cart.grandTotal` | Total including 5% estimated GST |

---

#### 3.4 Wishlist (`/api/wishlist`)

##### `GET /api/wishlist`
- **Access:** Private (Authenticated User)
- **Description:** Retrieve all active wishlisted sarees saved by the current user. Inactive sarees are filtered out dynamically.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Wishlist retrieved successfully.",
    "data": {
      "wishlist": {
        "id": "670c1a2f9b1d8c0012345688",
        "products": [
          {
            "id": "670c1a2f9b1d8c0012345680",
            "name": "Royal Banarasi Katan Silk Saree",
            "category": "Banarasi",
            "fabric": "Katan Silk",
            "origin": "Varanasi",
            "price": 4500,
            "formattedPrice": "₹4,500/pc",
            "moq": 5,
            "formattedMoq": "5 pcs",
            "rating": 4.8,
            "stock": 120
          }
        ],
        "totalCount": 1
      }
    }
  }
  ```

##### `POST /api/wishlist/items`
- **Access:** Private (Authenticated User)
- **Description:** Save a saree to user's wishlist (prevents duplicate entries).
- **Request Body:**
  ```json
  {
    "productId": "670c1a2f9b1d8c0012345680"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Product added to wishlist successfully.",
    "data": {
      "isInWishlist": true,
      "totalCount": 1
    }
  }
  ```

##### `DELETE /api/wishlist/items/:productId`
- **Access:** Private (Authenticated User)
- **Description:** Remove a saree from user's saved wishlist.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Product removed from wishlist.",
    "data": {
      "isInWishlist": false,
      "totalCount": 0
    }
  }
  ```

##### 3.4.1 Frontend Wishlist Field Mapping Table

| Frontend Mock Field (`WishlistScreen.jsx` / `Navbar.jsx`) | Backend API Field (`Wishlist.js` / `Product.js`) | Type / Notes |
| :--- | :--- | :--- |
| `wishlist.length` (badge count) | `wishlist.totalCount` | Integer saved items count |
| `saree.id` | `product.id` | MongoDB ObjectId |
| `saree.name` | `product.name` | Saree title |
| `saree.origin` | `product.origin` | Weaver cluster hub |
| `saree.price` | `product.formattedPrice` | `"₹4,500/pc"` formatted string |
| `saree.moq` | `product.formattedMoq` | `"5 pcs"` formatted string |
| `saree.image` | `product.image` | Primary image URL |

---

---

#### 3.5 B2B Bulk Orders & Inquiries (`/api/inquiries`, `/api/orders`, `/api/seller`, `/api/admin`)

##### 3.5.1 B2B Inquiry Endpoints

###### `POST /api/inquiries`
- **Access:** Private (`retailer`, `admin`)
- **Description:** Submit a bulk-order quotation inquiry directly for a handloom saree product.
- **Request Body:**
  ```json
  {
    "productId": "670c1a2f9b1d8c0012345680",
    "quantity": 10,
    "buyerNotes": "Need custom zari border finish if possible.",
    "shippingAddress": {
      "addressLine": "Shop 42, New Zari Bazaar, MG Road",
      "city": "Pune",
      "state": "Maharashtra",
      "pincode": "411001"
    }
  }
  ```
- **Response `201 Created`:** Returns inquiry object with generated `#PV-INQ-XXXXX` reference and `status: "pending"`.

###### `GET /api/inquiries/my`
- **Access:** Private (`retailer`)
- **Description:** Lists all inquiries placed by the authenticated retailer.

###### `GET /api/inquiries/:id`
- **Access:** Private (`retailer` owner, target `seller`, or `admin`)
- **Description:** Retrieves detailed inquiry snapshot including weaver quotation details.

###### `PATCH /api/inquiries/:id`
- **Access:** Private (`retailer` owner, `admin`)
- **Description:** Update buyer notes and shipping address (permitted only while in `pending` status).

###### `GET /api/seller/inquiries`
- **Access:** Private (`seller`, `admin`)
- **Description:** Lists inquiries routed to the authenticated weaver's loom cluster.

###### `PATCH /api/seller/inquiries/:id/quote`
- **Access:** Private (`seller` assigned to inquiry, `admin`)
- **Description:** Submit formal wholesale price per piece, GST breakdown, valid days, and weaver notes.
- **Request Body:**
  ```json
  {
    "quotedPricePerUnit": 4600,
    "sellerNotes": "Special bulk discount applied for 10 sarees.",
    "validUntilDays": 14
  }
  ```
- **Response `200 OK`:** Sets inquiry status to `quoted`.

###### `GET /api/admin/inquiries`
- **Access:** Private (`admin`)
- **Description:** Lists all platform inquiries with optional `?status=` filtering.

###### `PATCH /api/admin/inquiries/:id/status`
- **Access:** Private (`admin`)
- **Description:** Admin override for inquiry lifecycle status (`pending`, `quoted`, `accepted`, `rejected`, `expired`, `converted_to_order`).

---

##### 3.5.2 B2B Order Endpoints

###### `POST /api/orders`
- **Access:** Private (`retailer`, `admin`)
- **Description:** Place an atomic wholesale order either from validated active cart items or an approved quotation inquiry.
- **Request Body:**
  ```json
  {
    "inquiryId": "670c1a2f9b1d8c0012345688", // Optional: to convert approved inquiry
    "shippingAddress": {
      "addressLine": "Shop 42, Heritage Silk Market, MG Road",
      "city": "Bengaluru",
      "state": "Karnataka",
      "pincode": "560001"
    },
    "notes": "Ensure moisture-barrier packaging.",
    "idempotencyKey": "ord-idemp-uuid-4412" // Optional: prevents duplicate charges/orders
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "message": "B2B Wholesale Order placed successfully.",
    "data": {
      "order": {
        "id": "670c1a2f9b1d8c0012345690",
        "orderNumber": "#PV-ORD-88321",
        "retailerName": "Alpha Emporium Ltd",
        "items": [
          {
            "product": "670c1a2f9b1d8c0012345680",
            "name": "Royal Banarasi Katan Silk Saree",
            "price": 4600,
            "moq": 5,
            "quantity": 10,
            "subtotal": 46000
          }
        ],
        "totalUnits": 10,
        "subtotal": 46000,
        "taxAmount": 2300,
        "shippingAmount": 0,
        "grandTotal": 48300,
        "status": "confirmed",
        "paymentStatus": "credit_invoice",
        "createdAt": "2026-10-13T19:00:00.000Z"
      }
    }
  }
  ```

###### `GET /api/orders/my`
- **Access:** Private (`retailer`)
- **Description:** Lists all orders placed by the authenticated retailer.

###### `GET /api/orders/:id`
- **Access:** Private (`retailer` owner, assigned `seller`, or `admin`)
- **Description:** Retrieves order details and items snapshot.

###### `GET /api/seller/orders`
- **Access:** Private (`seller`, `admin`)
- **Description:** Retrieves orders containing saree batches manufactured by the authenticated weaver.

###### `PATCH /api/seller/orders/:id/status`
- **Access:** Private (`seller` assigned to order, `admin`)
- **Description:** Advances fulfillment status within allowed transitions (`confirmed` → `in_production` → `dispatched` → `in_transit` → `delivered`).

###### `GET /api/admin/orders`
- **Access:** Private (`admin`)
- **Description:** Retrieves all platform bulk orders with optional `?status=` filtering for [AdminOrders.jsx](file:///c:/Users/DARSHANA%20PAWAR/backend%20saree/pavitra-designer/pavitra-b2b-web/src/views/admin/AdminOrders.jsx).

###### `PATCH /api/admin/orders/:id/status`
- **Access:** Private (`admin`)
- **Description:** Platform administration order status transition update.

---

##### 3.5.3 Frontend Order Field Mapping Table

| Frontend Mock Field (`AdminOrders.jsx` / `CheckoutScreen.jsx`) | Backend API Field (`Order.js`) | Type / Notes |
| :--- | :--- | :--- |
| `ord.id` | `order.orderNumber` | Formatted string (e.g. `#PV-ORD-88321`) |
| `ord.retailer` | `order.retailerName` | Retailer business name snapshot |
| `ord.items` | `order.totalUnits` / `order.items.length` | Total units ordered (e.g. `50 pcs`) |
| `ord.total` | `order.formattedGrandTotal` | Formatted string (`₹48,300`) or numeric `grandTotal` |
| `ord.status` | `order.status` | `confirmed`, `in_production`, `dispatched`, `in_transit`, `delivered`, `cancelled` |
| `ord.date` | `order.createdAt` | ISO Date / locale formatted date |


---

#### 3.6 Logistics & Batch Tracking (`/api/tracking`)

##### `GET /api/tracking/:batchId`
- **Access:** Public or Private
- **Description:** Retrieves consignment status for batch IDs like `Batch #PV-88321`.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "batchNumber": "PV-88321",
      "status": "In Transit",
      "route": "Varanasi Loom Cluster → Delhi Central Hub",
      "estimatedDelivery": "Oct 19, 2026",
      "units": 50,
      "fabricType": "Katan Silk Sarees",
      "milestones": [
        { "stage": "Loom Dispatch", "timestamp": "2026-10-10", "completed": true },
        { "stage": "Quality Check Hub", "timestamp": "2026-10-12", "completed": true },
        { "stage": "In Transit", "timestamp": "2026-10-13", "completed": true },
        { "stage": "Out for Retail Delivery", "timestamp": null, "completed": false }
      ]
    }
  }
  ```

---

#### 3.7 Support & Wholesale Help (`/api/support`)

##### `POST /api/support`
- **Access:** Public or Private
- **Description:** Submit inquiry or logistics claim.
- **Request Body:**
  ```json
  {
    "name": "Ramesh Gupta",
    "email": "ramesh@textiles.com",
    "phone": "+91 9876543210",
    "subject": "Custom Weaving Inquiry",
    "message": "Looking to place a customized 200-piece order of Kanchipuram sarees."
  }
  ```

##### `GET /api/support`
- **Access:** Private (`admin`)
- **Description:** Retrieve support inquiries and feedback.

---

#### 3.8 Admin Overview & Platform Operations (`/api/admin`)

##### `GET /api/admin/dashboard/stats` (also `GET /api/admin/overview`)
- **Access:** Private (`admin`)
- **Description:** Powers [AdminOverview.jsx](file:///c:/Users/DARSHANA%20PAWAR/backend%20saree/pavitra-designer/pavitra-b2b-web/src/views/admin/AdminOverview.jsx) summary cards with live database aggregation.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Admin dashboard statistics calculated successfully.",
    "data": {
      "totalRevenue": 412500,
      "formattedTotalRevenue": "₹4,12,500",
      "ordersPlaced": 18,
      "activeOrdersCount": 12,
      "pendingOrdersCount": 2,
      "pendingInquiriesCount": 4,
      "catalogItemsCount": 8,
      "totalCatalogItems": 10,
      "verifiedRetailersCount": 128,
      "retailersCount": 145,
      "verifiedSellersCount": 14,
      "sellersCount": 18,
      "totalUsers": 165
    }
  }
  ```

##### `GET /api/admin/users`
- **Access:** Private (`admin`)
- **Description:** Paginated user administration with filters (`?role=seller|retailer|admin`, `?status=active|suspended`, `?verificationStatus=unverified|pending|verified|rejected`, `?search=`).
- **Response `200 OK`:** Returns array of users with pagination metadata (`total`, `page`, `limit`, `totalPages`).

##### `GET /api/admin/users/:id`
- **Access:** Private (`admin`)
- **Description:** Detailed user profile including contextual business statistics (seller product & order counts; retailer order & inquiry counts).

##### `PATCH /api/admin/users/:id/status`
- **Access:** Private (`admin`)
- **Description:** Activate or suspend a user account. Enforces Last-Admin Protection (prevents suspending the final active administrator).
- **Request Body:**
  ```json
  {
    "status": "suspended" // "active" | "suspended" | "pending_approval"
  }
  ```

##### `PATCH /api/admin/users/:id/verification` (also `PATCH /api/admin/users/:id/verify`)
- **Access:** Private (`admin`)
- **Description:** Verify or reject a business's GSTIN status.
- **Request Body:**
  ```json
  {
    "status": "verified" // "unverified" | "pending" | "verified" | "rejected"
  }
  ```

##### `GET /api/admin/products`
- **Access:** Private (`admin`)
- **Description:** View all catalog products including inactive/deactivated listings with seller details.

---

#### 3.9 Seller Management & Loom Portal (`/api/seller`)

##### `GET /api/seller/dashboard/stats`
- **Access:** Private (`seller`)
- **Description:** Powers [SellerDashboard.jsx](file:///c:/Users/DARSHANA%20PAWAR/backend%20saree/pavitra-designer/pavitra-b2b-web/src/views/seller/SellerDashboard.jsx) with weaver-specific production and revenue metrics.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Seller dashboard statistics calculated successfully.",
    "data": {
      "totalProducts": 6,
      "activeProducts": 5,
      "totalOrdersCount": 8,
      "totalUnitsSold": 48,
      "totalRevenue": 216000,
      "formattedTotalRevenue": "₹2,16,000",
      "pendingInquiriesCount": 2,
      "totalStockPieces": 140,
      "verificationStatus": "verified"
    }
  }
  ```

##### `GET /api/seller/products`
- **Access:** Private (`seller`)
- **Description:** Retrieve all saree listings manufactured by the authenticated seller (strict ownership isolation).

##### `PATCH /api/seller/profile`
- **Access:** Private (`seller`)
- **Description:** Update permitted business profile fields (`businessName`, `phone`, `gstin`). Protected fields like `role` or `businessVerificationStatus` cannot be modified by the seller.
- **Request Body:**
  ```json
  {
    "businessName": "Varanasi Heritage Looms Pvt Ltd",
    "phone": "9876543210",
    "gstin": "09AAAAA1111A1Z1"
  }
  ```

