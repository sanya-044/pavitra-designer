# Technology Stack Specification
## Pavitra B2B Saree E-commerce Platform

---

### 1. Existing Frontend Stack (Completed / Active)

The client application is housed inside `pavitra-designer/pavitra-b2b-web/` and is actively running on a local Vite development server.

| Layer / Aspect | Technology / Library | Version | Role in Application |
| :--- | :--- | :--- | :--- |
| **Framework** | React | `^19.2.8` | Component-based UI rendering, local state management |
| **DOM Renderer** | React DOM | `^19.2.8` | Browser DOM reconciliation |
| **Build Tool & Bundler** | Vite | `^8.3.0` | Ultra-fast HMR and ESM build pipeline |
| **Styling** | Tailwind CSS | `^4.3.3` | Utility-first responsive styling and theme tokens |
| **PostCSS Plugins** | `@tailwindcss/postcss`, `postcss`, `autoprefixer` | `^4.3.3`, `^8.5.29`, `^10.6.1` | Modern CSS transformation pipeline |
| **Icons** | Lucide React | `^1.52.0` | SVG UI icons (ShoppingBag, Truck, Heart, ShieldAlert, etc.) |
| **Linter** | Oxlint | `^1.81.0` | High-performance JavaScript/JSX linter |
| **Client Routing** | Internal State | React `useState` | View switching between catalog, bag, auth, dashboards |

---

### 2. Planned Backend Stack (MERN Architecture)

The backend will be designed to run as an independent, modular Node.js/Express service connecting to MongoDB Atlas.

| Component | Technology | Installed Library / Version | Purpose & Function |
| :--- | :--- | :--- | :--- |
| **Runtime Environment** | Node.js | `v24.x LTS` | Server-side JavaScript execution engine |
| **Web Framework** | Express.js | `^5.3.0` | HTTP routing, REST API controller layer, middleware pipeline |
| **Database** | MongoDB Atlas | MongoDB 7.x cluster | Document-oriented NoSQL database |
| **ODM** | Mongoose | `^9.11.2` | Strongly typed schema definition, data validation, lifecycle hooks |
| **Authentication & Security** | JSON Web Tokens (`jsonwebtoken`) | `^9.0.3` | Stateless bearer token generation and claims verification |
| **Password Hashing** | `bcryptjs` | `^3.0.3` | Salted cryptographic password hashing |
| **Schema Validation** | `zod` | `^4.6.7` | Runtime request body schema validation and type safety |
| **Security Headers** | `helmet` | `^8.3.0` | Comprehensive HTTP security header protection |
| **Rate Limiting** | `express-rate-limit` | `^8.7.1` | Brute-force and DDoS protection for auth and public routes |
| **CORS Middleware** | `cors` | `^2.8.6` | Cross-Origin Resource Sharing handling for Vite dev (`http://localhost:5173`) |
| **Environment Config** | `dotenv` | `^18.0.7` | Loading environment variables from `.env` files |

---

### 3. Architecture & Directory Relationship

```
backend saree/
├── pavitra-designer/
│   ├── docs/                         # Centralized Project Documentation
│   │   ├── prd.md
│   │   ├── tech-stack.md
│   │   ├── task-breakdown.md
│   │   ├── api.md
│   │   ├── schema.md
│   │   ├── tracker.md
│   │   └── decisions.md
│   │
│   ├── PROJECT_ANALYSIS.md           # High-Level Frontend & Backend Analysis
│   │
│   ├── pavitra-b2b-web/              # FRONTEND APPLICATION (Existing - React 19 + Vite 8)
│   │   ├── src/
│   │   │   ├── components/           # Navbar, Footer
│   │   │   ├── views/                # catalog, auth, bags, admin, retailer, seller, etc.
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   └── package.json
│   │
│   └── backend/                      # BACKEND APPLICATION (Node/Express/Mongoose)
│       ├── src/
│       │   ├── config/               # db.js
│       │   ├── controllers/          # Business logic handlers
│       │   ├── middleware/           # errorHandler.js, notFound.js
│       │   ├── models/               # User, Product, Order, Cart, Wishlist, Ticket
│       │   ├── routes/               # health.routes.js, etc.
│       │   ├── services/             # Core services
│       │   ├── validators/           # Request schema validators
│       │   ├── utils/                # Helper utilities
│       │   └── app.js                # Express app setup
│       ├── tests/                    # Automated integration tests
│       ├── server.js                 # Entry point / listener & graceful shutdown
│       ├── .env.example
│       ├── .gitignore
│       ├── README.md
│       └── package.json
```

---

### 4. Integration Strategy Between Client and Server

1. **HTTP Client:** Standard `fetch` or lightweight `axios` wrapper on the frontend configured with a base URL (e.g., `http://localhost:5000/api`).
2. **State Management Migration:**
   - In the initial phase, keep the lightweight React state in `App.jsx` and views, but replace hardcoded initialization arrays with `useEffect` API calls.
   - Store user authentication credentials and JWT in browser `localStorage` or `sessionStorage`.
3. **CORS & Environment Setup:**
   - Backend configured with CORS whitelist: `http://localhost:5173` and `http://127.0.0.1:5173`.
   - Frontend Vite configuration can optionally configure a dev server proxy for `/api` to avoid CORS friction during development.
