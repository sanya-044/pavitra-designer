# Production Deployment Checklist & Hosting Architecture
## Pavitra B2B Saree E-commerce Platform

*Target Stacks: Vercel (Frontend) | Render / Railway / AWS ECS (Backend) | MongoDB Atlas (Database)*

---

### 1. Pre-Deployment Verification Matrix

- [x] **Backend Automated Regression:** All 86 tests passing (`npm test` in `backend/`).
- [x] **Frontend Production Bundle:** `npm run build` succeeds (`dist/` created with 294 kB minified bundle).
- [x] **Security Headers & CORS:** Helmet configured; CORS restricted via `FRONTEND_URL`.
- [x] **Database Isolation:** Database tests run on isolated suffix (`/pavitra_test`); production DB preserved.
- [x] **Zero Secret Leaks:** `.env` files git-ignored in both root folders.

---

### 2. Frontend Deployment (Vercel)

#### Configuration:
1. **Root Directory:** `pavitra-b2b-web`
2. **Framework Preset:** `Vite`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Install Command:** `npm install`

#### Environment Variables to Set on Vercel:
```env
VITE_API_BASE_URL=https://api.pavitrab2b.com/api
```
*(Replace with production backend domain)*

#### SPA Routing (Vercel Rewrite):
Ensure single-page routing does not 404 on refresh by creating `vercel.json` if needed:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

### 3. Backend Deployment (Render / Railway / AWS / DigitalOcean)

#### Configuration:
1. **Root Directory:** `backend`
2. **Environment:** Node.js (Node 20+ or 24 LTS)
3. **Build Command:** `npm install`
4. **Start Command:** `npm start` (runs `node server.js`)

#### Environment Variables to Set on Production Server:
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<username>:<password>@saree.lpo9aop.mongodb.net/pavitra_production?retryWrites=true&w=majority&appName=saree
FRONTEND_URL=https://pavitrab2b.vercel.app,https://pavitrab2b.com
JWT_SECRET=super_strong_cryptographically_secure_random_hex_64_bytes
JWT_EXPIRES_IN=7d
ADMIN_SECRET_KEY=highly_confidential_admin_provision_secret
```

---

### 4. Database Setup (MongoDB Atlas)

1. **Cluster:** M0 (Free Tier Sandbox) or M10+ (Production Replica Set).
2. **Network Access (IP Whitelist):**
   - In development: Whitelist current IP address.
   - In production: Allow access from backend host IP or `0.0.0.0/0` (secured with strong user credentials).
3. **Database User:**
   - Create dedicated application user with `readWrite` role on `pavitra_production` database only.
   - Avoid using root/admin Atlas credentials for standard API connections.
4. **Indexes:**
   - Model schemas will automatically construct text indexes and compound indexes on first startup (`name`, `origin`, `category`, `price`, `status`).

---

### 5. Production Smoke Testing Checklist

After deploying to staging/production, execute these health and operational checks:

1. **Liveness Check:**
   `curl https://<backend-domain>/api/health`
   Expected response: `200 OK` with `{ success: true, mongoConnection: "connected" }`.
2. **Admin Provisioning:**
   Call `POST /api/auth/provision-admin` once with `X-Admin-Secret` to set up initial system administrator.
3. **Catalog Seed:**
   Execute `npm run seed` on the backend server to populate the 8 authentic handloom sarees.
4. **End-to-End Workflow Verification:**
   - Register a new test retailer account.
   - Search sarees by origin ("Varanasi") and category ("Banarasi").
   - Add items to Inquiry Bag with valid MOQ.
   - Complete checkout and verify order creation with `#PV-ORD-XXXXX` reference.
   - Log in as admin and verify order appears in Admin Dashboard.

---

### 6. Rollback & Disaster Recovery Strategy

1. **Frontend Rollback:** Revert commit on Vercel deployment dashboard for instantaneous atomic rollback to previous immutable build.
2. **Backend Rollback:** Redeploy previous container image or Git SHA on Render/Railway.
3. **Database Backup:** Enable Continuous Cloud Backups in MongoDB Atlas with point-in-time recovery before launching live production traffic.
