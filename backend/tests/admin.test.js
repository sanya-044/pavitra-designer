import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_token_12345';

import app from '../src/app.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import Inquiry from '../src/models/Inquiry.js';
import { generateToken } from '../src/utils/jwt.js';

test('Admin and Seller Management API Integration Suite', async (t) => {
  const baseUri = process.env.MONGO_URI;
  if (!baseUri) {
    throw new Error('MONGO_URI is required for running integration tests');
  }

  const testUri = baseUri.includes('?')
    ? baseUri.replace(/\/[^/?]+(\?)/, '/pavitra_test$1')
    : `${baseUri}/pavitra_test`;

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testUri);
  }

  // 1. Seed Roles: Admin A, Admin B (to test last-admin protection), Seller 1, Seller 2 (for isolation), and Retailer
  let adminPrimary = await User.findOne({ email: 'admin_primary@test.com' });
  if (!adminPrimary) {
    adminPrimary = await User.create({
      name: 'Primary Platform Admin',
      email: 'admin_primary@test.com',
      password: 'Password123!',
      role: 'admin',
      accountStatus: 'active'
    });
  }

  let adminSecondary = await User.findOne({ email: 'admin_secondary@test.com' });
  if (!adminSecondary) {
    adminSecondary = await User.create({
      name: 'Secondary Admin Assistant',
      email: 'admin_secondary@test.com',
      password: 'Password123!',
      role: 'admin',
      accountStatus: 'active'
    });
  }

  let sellerOne = await User.findOne({ email: 'seller_one@test.com' });
  if (!sellerOne) {
    sellerOne = await User.create({
      name: 'Varanasi Master Weaver One',
      email: 'seller_one@test.com',
      password: 'Password123!',
      role: 'seller',
      businessName: 'Varanasi Heritage Silks',
      gstin: '09AAAAA1111A1Z1',
      businessVerificationStatus: 'verified',
      accountStatus: 'active'
    });
  }

  let sellerTwo = await User.findOne({ email: 'seller_two@test.com' });
  if (!sellerTwo) {
    sellerTwo = await User.create({
      name: 'Kanchipuram Guild Two',
      email: 'seller_two@test.com',
      password: 'Password123!',
      role: 'seller',
      businessName: 'Kanchipuram Royal Looms',
      gstin: '33BBBBB2222B1Z2',
      businessVerificationStatus: 'pending',
      accountStatus: 'active'
    });
  }

  let retailerUser = await User.findOne({ email: 'retailer_mgmt_test@test.com' });
  if (!retailerUser) {
    retailerUser = await User.create({
      name: 'Kolkata Saree Emporium',
      email: 'retailer_mgmt_test@test.com',
      password: 'Password123!',
      role: 'retailer',
      businessName: 'Kolkata Emporium',
      gstin: '19CCCCC3333C1Z3',
      businessVerificationStatus: 'unverified',
      accountStatus: 'active'
    });
  }

  const tokenAdmin1 = generateToken(adminPrimary);
  const tokenAdmin2 = generateToken(adminSecondary);
  const tokenSeller1 = generateToken(sellerOne);
  const tokenSeller2 = generateToken(sellerTwo);
  const tokenRetailer = generateToken(retailerUser);

  // 2. Create products for Seller 1 and Seller 2
  const productSeller1 = await Product.create({
    name: 'Seller One Banarasi Saree',
    category: 'Banarasi',
    fabric: 'Katan Silk',
    origin: 'Varanasi',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c',
    price: 4500,
    moq: 5,
    stock: 50,
    seller: sellerOne._id,
    isActive: true
  });

  const productSeller2 = await Product.create({
    name: 'Seller Two Kanchipuram Saree',
    category: 'Kanchipuram',
    fabric: 'Pure Mulberry Silk',
    origin: 'Tamil Nadu',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b',
    price: 7000,
    moq: 3,
    stock: 25,
    seller: sellerTwo._id,
    isActive: true
  });

  // 3. Create sample order for Seller 1
  const testOrder = await Order.create({
    orderNumber: `#PV-ORD-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
    retailer: retailerUser._id,
    retailerName: retailerUser.businessName || retailerUser.name,
    items: [
      {
        product: productSeller1._id,
        name: productSeller1.name,
        category: productSeller1.category,
        fabric: productSeller1.fabric,
        origin: productSeller1.origin,
        image: productSeller1.image,
        price: productSeller1.price,
        moq: productSeller1.moq,
        quantity: 5,
        subtotal: 22500,
        seller: sellerOne._id
      }
    ],
    totalUnits: 5,
    subtotal: 22500,
    taxAmount: 1125,
    shippingAmount: 0,
    grandTotal: 23625,
    shippingAddress: {
      addressLine: 'MG Road Saree Lane',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700001'
    },
    status: 'confirmed'
  });

  t.after(async () => {
    await Order.deleteMany({ _id: testOrder._id });
    await Product.deleteMany({ _id: { $in: [productSeller1._id, productSeller2._id] } });
    await User.deleteMany({
      email: {
        $in: [
          'admin_primary@test.com',
          'admin_secondary@test.com',
          'seller_one@test.com',
          'seller_two@test.com',
          'retailer_mgmt_test@test.com'
        ]
      }
    });
    await mongoose.disconnect();
  });

  // --- ACCESS CONTROL TESTS ---

  await t.test('1. Retailer blocked from accessing /api/admin/dashboard/stats (403)', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${tokenRetailer}`)
      .expect(403);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access forbidden/i);
  });

  await t.test('2. Seller blocked from accessing /api/admin/users (403)', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${tokenSeller1}`)
      .expect(403);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access forbidden/i);
  });

  await t.test('3. Retailer blocked from accessing /api/seller/dashboard/stats (403)', async () => {
    const res = await request(app)
      .get('/api/seller/dashboard/stats')
      .set('Authorization', `Bearer ${tokenRetailer}`)
      .expect(403);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access forbidden/i);
  });

  // --- ADMIN DASHBOARD & METRICS TESTS ---

  await t.test('4. GET /api/admin/dashboard/stats computes live database metrics', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${tokenAdmin1}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.totalRevenue >= 23625);
    assert.ok(res.body.data.ordersPlaced >= 1);
    assert.ok(res.body.data.catalogItemsCount >= 2);
    assert.ok(res.body.data.sellersCount >= 2);
    assert.ok(res.body.data.retailersCount >= 1);
  });

  await t.test('5. GET /api/admin/users returns paginated user list with role filter', async () => {
    const res = await request(app)
      .get('/api/admin/users?role=seller')
      .set('Authorization', `Bearer ${tokenAdmin1}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.users.length >= 2);
    assert.ok(res.body.data.users.every((u) => u.role === 'seller'));
    assert.ok(res.body.data.pagination);
    assert.equal(res.body.data.pagination.page, 1);
  });

  await t.test('6. GET /api/admin/users/:id retrieves user details and contextual counts', async () => {
    const res = await request(app)
      .get(`/api/admin/users/${sellerOne._id}`)
      .set('Authorization', `Bearer ${tokenAdmin1}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, sellerOne.email);
    assert.ok(res.body.data.stats.productCount >= 1);
    assert.ok(res.body.data.stats.orderCount >= 1);
  });

  await t.test('7. PATCH /api/admin/users/:id/status allows suspending a user', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${retailerUser._id}/status`)
      .set('Authorization', `Bearer ${tokenAdmin1}`)
      .send({ status: 'suspended' })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.accountStatus, 'suspended');

    // Suspended user now blocked from calling authenticated endpoints
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenRetailer}`)
      .expect(403);

    assert.match(meRes.body.message, /Account is suspended/i);

    // Reactivate user
    await request(app)
      .patch(`/api/admin/users/${retailerUser._id}/status`)
      .set('Authorization', `Bearer ${tokenAdmin1}`)
      .send({ status: 'active' })
      .expect(200);
  });

  await t.test('8. Last-Admin Protection: Prevent suspending the last active administrator', async () => {
    // Suspend admin secondary first
    await request(app)
      .patch(`/api/admin/users/${adminSecondary._id}/status`)
      .set('Authorization', `Bearer ${tokenAdmin1}`)
      .send({ status: 'suspended' })
      .expect(200);

    // Attempt to suspend admin primary (now the only active admin)
    const res = await request(app)
      .patch(`/api/admin/users/${adminPrimary._id}/status`)
      .set('Authorization', `Bearer ${tokenAdmin1}`)
      .send({ status: 'suspended' })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Cannot suspend the last active system administrator/i);

    // Restore secondary admin to active
    await request(app)
      .patch(`/api/admin/users/${adminSecondary._id}/status`)
      .set('Authorization', `Bearer ${tokenAdmin1}`)
      .send({ status: 'active' })
      .expect(200);
  });

  await t.test('9. PATCH /api/admin/users/:id/verification updates business GSTIN status', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${retailerUser._id}/verification`)
      .set('Authorization', `Bearer ${tokenAdmin1}`)
      .send({ status: 'verified' })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.businessVerificationStatus, 'verified');
  });

  await t.test('10. GET /api/admin/products returns catalog with seller references', async () => {
    const res = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${tokenAdmin1}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.products.length >= 2);
    assert.ok(res.body.data.products[0].seller);
  });

  // --- SELLER MANAGEMENT & OWNERSHIP TESTS ---

  await t.test('11. GET /api/seller/dashboard/stats computes seller-specific metrics', async () => {
    const res = await request(app)
      .get('/api/seller/dashboard/stats')
      .set('Authorization', `Bearer ${tokenSeller1}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.totalProducts >= 1);
    assert.equal(res.body.data.totalUnitsSold, 5);
    assert.equal(res.body.data.totalRevenue, 22500);
    assert.equal(res.body.data.totalStockPieces, 50);
  });

  await t.test('12. GET /api/seller/products enforces strict ownership (Seller 1 only sees own products)', async () => {
    const res = await request(app)
      .get('/api/seller/products')
      .set('Authorization', `Bearer ${tokenSeller1}`)
      .expect(200);

    assert.equal(res.body.success, true);
    // Must contain productSeller1 and NOT productSeller2
    const hasOwn = res.body.data.products.some((p) => p.id === productSeller1._id.toString());
    const hasOther = res.body.data.products.some((p) => p.id === productSeller2._id.toString());
    assert.equal(hasOwn, true);
    assert.equal(hasOther, false);
  });

  await t.test('13. Seller 2 cannot see Seller 1 products in /api/seller/products', async () => {
    const res = await request(app)
      .get('/api/seller/products')
      .set('Authorization', `Bearer ${tokenSeller2}`)
      .expect(200);

    assert.equal(res.body.success, true);
    const hasSeller1Prod = res.body.data.products.some((p) => p.id === productSeller1._id.toString());
    const hasOwn = res.body.data.products.some((p) => p.id === productSeller2._id.toString());
    assert.equal(hasSeller1Prod, false);
    assert.equal(hasOwn, true);
  });

  await t.test('14. PATCH /api/seller/profile updates permitted business details safely', async () => {
    const res = await request(app)
      .patch('/api/seller/profile')
      .set('Authorization', `Bearer ${tokenSeller1}`)
      .send({
        businessName: 'Varanasi Master Weavers & Looms Private Limited',
        phone: '9876543210'
      })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.businessName, 'Varanasi Master Weavers & Looms Private Limited');
    assert.equal(res.body.data.user.phone, '9876543210');
    // Ensure role cannot be altered via profile update
    assert.equal(res.body.data.user.role, 'seller');
  });

  await t.test('15. Seller profile rejects invalid GSTIN format (400)', async () => {
    const res = await request(app)
      .patch('/api/seller/profile')
      .set('Authorization', `Bearer ${tokenSeller1}`)
      .send({
        gstin: 'INVALID_GSTIN_123'
      })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Invalid GSTIN format/i);
  });
});
