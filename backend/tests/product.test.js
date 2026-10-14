import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_token_12345';
process.env.ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'test_admin_provision_key_123';

import app from '../src/app.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import { generateToken } from '../src/utils/jwt.js';

test('Product & Saree Catalog API Test Suite', async (t) => {
  const baseUri = process.env.MONGO_URI;
  if (!baseUri) {
    throw new Error('MONGO_URI is required for running integration tests');
  }

  // Use dedicated isolated test database `pavitra_test`
  const testUri = baseUri.includes('?')
    ? baseUri.replace(/\/[^/?]+(\?)/, '/pavitra_test$1')
    : `${baseUri}/pavitra_test`;

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testUri);
  }

  // Setup test users for RBAC testing
  let adminUser = await User.findOne({ email: 'admin_prod_test@test.com' });
  if (!adminUser) {
    adminUser = await User.create({
      name: 'Catalog Admin',
      email: 'admin_prod_test@test.com',
      password: 'AdminPassword123!',
      role: 'admin',
      accountStatus: 'active'
    });
  }

  let sellerOne = await User.findOne({ email: 'seller_one@test.com' });
  if (!sellerOne) {
    sellerOne = await User.create({
      name: 'Varanasi Master Weaver',
      email: 'seller_one@test.com',
      password: 'SellerPassword123!',
      role: 'seller',
      businessName: 'Varanasi Heritage Looms',
      accountStatus: 'active'
    });
  }

  let sellerTwo = await User.findOne({ email: 'seller_two@test.com' });
  if (!sellerTwo) {
    sellerTwo = await User.create({
      name: 'Kanchipuram Silk House',
      email: 'seller_two@test.com',
      password: 'SellerPassword123!',
      role: 'seller',
      businessName: 'Kanchi Silks',
      accountStatus: 'active'
    });
  }

  let retailerUser = await User.findOne({ email: 'retailer_prod_test@test.com' });
  if (!retailerUser) {
    retailerUser = await User.create({
      name: 'Retailer Buyer',
      email: 'retailer_prod_test@test.com',
      password: 'BuyerPassword123!',
      role: 'retailer',
      businessName: 'Boutique Collection',
      accountStatus: 'active'
    });
  }

  const adminToken = generateToken(adminUser);
  const sellerOneToken = generateToken(sellerOne);
  const sellerTwoToken = generateToken(sellerTwo);
  const retailerToken = generateToken(retailerUser);

  // Clean test products created in previous test runs
  await Product.deleteMany({ seller: { $in: [sellerOne._id, sellerTwo._id, adminUser._id] } });

  let sampleSareeId = '';
  let sampleSareeSlug = '';

  t.after(async () => {
    // Clean test products and users
    await Product.deleteMany({ seller: { $in: [sellerOne._id, sellerTwo._id, adminUser._id] } });
    await User.deleteMany({
      email: { $in: ['admin_prod_test@test.com', 'seller_one@test.com', 'seller_two@test.com', 'retailer_prod_test@test.com'] }
    });
    await mongoose.disconnect();
  });

  await t.test('1. Seller successfully creates a saree product', async () => {
    const payload = {
      name: 'Katan Silk Zari Banarasi Test Saree',
      description: 'Handwoven pure silk Banarasi with golden floral zari kadwa jaal.',
      category: 'Banarasi',
      fabric: 'Katan Silk',
      origin: 'Varanasi',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600',
      price: 4500,
      moq: 5,
      stock: 40
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerOneToken}`)
      .send(payload)
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.product.name, payload.name);
    assert.equal(res.body.data.product.price, 4500);
    assert.equal(res.body.data.product.formattedPrice, '₹4,500/pc');
    assert.equal(res.body.data.product.formattedMoq, '5 pcs');
    assert.ok(res.body.data.product.slug);
    assert.equal(res.body.data.product.seller.name, sellerOne.name);

    sampleSareeId = res.body.data.product.id;
    sampleSareeSlug = res.body.data.product.slug;
  });

  await t.test('2. Product creation validation failures (Invalid category, negative price, missing image)', async () => {
    const invalidPayload = {
      name: 'Bad Saree',
      category: 'PlasticPolyester', // Invalid category
      price: -500, // Negative price
      moq: 0 // MOQ must be >= 1
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerOneToken}`)
      .send(invalidPayload)
      .expect(400);

    assert.equal(res.body.success, false);
    assert.ok(res.body.errors.length > 0);
  });

  await t.test('3. Retailer forbidden from creating product listings (RBAC)', async () => {
    const payload = {
      name: 'Retailer Attempt Product',
      category: 'Banarasi',
      origin: 'Varanasi',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c',
      price: 3000,
      moq: 5
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${retailerToken}`)
      .send(payload)
      .expect(403);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access forbidden: Role "retailer"/i);
  });

  await t.test('4. Unauthenticated user forbidden from creating products', async () => {
    await request(app)
      .post('/api/products')
      .send({ name: 'Anonymous Saree' })
      .expect(401);
  });

  await t.test('5. Public GET /api/products returns catalog with pagination and virtuals', async () => {
    const res = await request(app)
      .get('/api/products')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.products));
    assert.ok(res.body.data.products.length >= 1);
    assert.ok(res.body.data.pagination);
    assert.equal(res.body.data.pagination.page, 1);

    const first = res.body.data.products[0];
    assert.ok(first.formattedPrice);
    assert.ok(first.formattedMoq);
    assert.ok(first.seller);
  });

  await t.test('6. Public search query (?q=Varanasi) finds relevant products', async () => {
    const res = await request(app)
      .get('/api/products?q=Varanasi')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.products.length >= 1);
    assert.equal(res.body.data.products[0].origin, 'Varanasi');
  });

  await t.test('7. Category filter (?category=Banarasi) and Price Range filter', async () => {
    const res = await request(app)
      .get('/api/products?category=Banarasi&minPrice=4000&maxPrice=5000')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.products.length >= 1);
    assert.equal(res.body.data.products[0].category, 'Banarasi');
    assert.ok(res.body.data.products[0].price >= 4000 && res.body.data.products[0].price <= 5000);
  });

  await t.test('8. GET /api/products/categories returns categories list', async () => {
    const res = await request(app)
      .get('/api/products/categories')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.categories));
    assert.ok(res.body.data.categories.includes('Banarasi'));
  });

  await t.test('9. GET /api/products/:id and /api/products/slug/:slug return product details', async () => {
    // By ID
    const resId = await request(app)
      .get(`/api/products/${sampleSareeId}`)
      .expect(200);
    assert.equal(resId.body.data.product.id, sampleSareeId);

    // By Slug
    const resSlug = await request(app)
      .get(`/api/products/slug/${sampleSareeSlug}`)
      .expect(200);
    assert.equal(resSlug.body.data.product.slug, sampleSareeSlug);
  });

  await t.test('10. Invalid MongoDB ID returns 400 Bad Request', async () => {
    const res = await request(app)
      .get('/api/products/invalid-mongodb-id')
      .expect(400);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Invalid product ID format/i);
  });

  await t.test('11. Seller cannot modify another seller\'s product (Ownership Protection)', async () => {
    const res = await request(app)
      .patch(`/api/products/${sampleSareeId}`)
      .set('Authorization', `Bearer ${sellerTwoToken}`)
      .send({ price: 3999 })
      .expect(403);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access forbidden: You do not have permission to modify another weaver's listing/i);
  });

  await t.test('12. Owner Seller can successfully update their own product', async () => {
    const res = await request(app)
      .patch(`/api/products/${sampleSareeId}`)
      .set('Authorization', `Bearer ${sellerOneToken}`)
      .send({ price: 4800, stock: 35 })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.product.price, 4800);
    assert.equal(res.body.data.product.stock, 35);
    assert.equal(res.body.data.product.formattedPrice, '₹4,800/pc');
  });

  await t.test('13. Admin can update any product regardless of seller', async () => {
    const res = await request(app)
      .patch(`/api/products/${sampleSareeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Admin Updated Banarasi Luxury Saree' })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.product.name, 'Admin Updated Banarasi Luxury Saree');
  });

  await t.test('14. Soft deletion (DELETE /api/products/:id) deactivates product from public catalog', async () => {
    const res = await request(app)
      .delete(`/api/products/${sampleSareeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    assert.equal(res.body.success, true);

    // Verify it is no longer returned in public listings
    const fetchAfterDelete = await request(app)
      .get(`/api/products/${sampleSareeId}`)
      .expect(404);

    assert.equal(fetchAfterDelete.body.success, false);

    // Verify database record still exists with isActive = false
    const dbRecord = await Product.findById(sampleSareeId);
    assert.ok(dbRecord);
    assert.equal(dbRecord.isActive, false);
  });
});
