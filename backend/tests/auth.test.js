import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Ensure test JWT secret and environment is populated
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_token_12345';
process.env.ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'test_admin_provision_key_123';

import app from '../src/app.js';
import User from '../src/models/User.js';
import { generateToken } from '../src/utils/jwt.js';

test('Authentication & Role-Based Access Control Suite', async (t) => {
  // Connect to isolated test database on MongoDB Atlas
  const baseUri = process.env.MONGO_URI;
  if (!baseUri) {
    throw new Error('MONGO_URI is required for running integration tests');
  }

  // Use a dedicated isolated test database `pavitra_test` to NEVER alter production data
  const testUri = baseUri.includes('?')
    ? baseUri.replace(/\/[^/?]+(\?)/, '/pavitra_test$1')
    : `${baseUri}/pavitra_test`;

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testUri);
  }

  // Clean test collection before tests start
  await User.deleteMany({ email: { $regex: /@test\.com$/ } });

  t.after(async () => {
    // Cleanup created test accounts
    await User.deleteMany({ email: { $regex: /@test\.com$/ } });
    await mongoose.disconnect();
  });

  const testRetailer = {
    name: 'Ramesh Silk Mart',
    email: 'retailer@test.com',
    password: 'Password123!',
    role: 'retailer',
    businessName: 'Ramesh Silks Pvt Ltd',
    gstin: '27AAAAA0000A1Z5',
    phone: '9876543210'
  };

  const testSeller = {
    name: 'Varanasi Weaver Co',
    email: 'weaver@test.com',
    password: 'Password123!',
    role: 'seller',
    businessName: 'Varanasi Handlooms'
  };

  let retailerToken = '';
  let adminToken = '';

  await t.test('1. Successful user registration (Retailer with GSTIN)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testRetailer)
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, testRetailer.email);
    assert.equal(res.body.data.user.role, 'retailer');
    assert.equal(res.body.data.user.businessVerificationStatus, 'pending'); // GSTIN submitted -> pending verification
    assert.equal(res.body.data.user.password, undefined); // Password hash must NEVER be exposed
    assert.ok(res.body.data.token);

    retailerToken = res.body.data.token;
  });

  await t.test('2. Password hashing in database verification', async () => {
    const userInDb = await User.findOne({ email: testRetailer.email });
    assert.ok(userInDb);
    assert.notEqual(userInDb.password, testRetailer.password);
    assert.ok(userInDb.password.startsWith('$2')); // bcrypt salt identifier
  });

  await t.test('3. Duplicate email registration rejection', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testRetailer)
      .expect(409);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /already exists/i);
  });

  await t.test('4. Registration rejection on invalid input (Short password & invalid GSTIN)', async () => {
    const invalidPayload = {
      name: 'A',
      email: 'notanemail',
      password: '123',
      gstin: 'INVALIDGST'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(invalidPayload)
      .expect(400);

    assert.equal(res.body.success, false);
    assert.ok(res.body.errors.length > 0);
  });

  await t.test('5. Rejection of privilege escalation attempt (Registering as admin)', async () => {
    const escalationAttempt = {
      name: 'Malicious Attacker',
      email: 'attacker@test.com',
      password: 'Password123!',
      role: 'admin'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(escalationAttempt)
      .expect(400);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /expected one of "retailer"\|"seller"|Public registration role/i);
  });

  await t.test('6. Successful Login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testRetailer.email,
        password: testRetailer.password
      })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, testRetailer.email);
    assert.equal(res.body.data.user.password, undefined); // No password exposed
  });

  await t.test('7. Failed Login with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testRetailer.email,
        password: 'WrongPassword!'
      })
      .expect(401);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Invalid email or password/i);
  });

  await t.test('8. Protected route GET /api/auth/me with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${retailerToken}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, testRetailer.email);
    assert.equal(res.body.data.user.role, 'retailer');
    assert.equal(res.body.data.user.password, undefined);
  });

  await t.test('9. Protected route GET /api/auth/me with missing or malformed token', async () => {
    // Missing token
    const resMissing = await request(app)
      .get('/api/auth/me')
      .expect(401);
    assert.equal(resMissing.body.success, false);

    // Malformed token
    const resMalformed = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.payload')
      .expect(401);
    assert.equal(resMalformed.body.success, false);
  });

  await t.test('10. Administrative Provisioning via secure secret key', async () => {
    const adminPayload = {
      name: 'Pavitra Superadmin',
      email: 'admin@test.com',
      password: 'AdminPassword123!'
    };

    // Missing/Invalid header secret -> 403
    await request(app)
      .post('/api/auth/provision-admin')
      .set('X-Admin-Secret', 'wrong-key')
      .send(adminPayload)
      .expect(403);

    // Valid header secret -> 201
    const res = await request(app)
      .post('/api/auth/provision-admin')
      .set('X-Admin-Secret', process.env.ADMIN_SECRET_KEY)
      .send(adminPayload)
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'admin');
    assert.ok(res.body.data.token);

    adminToken = res.body.data.token;
  });

  await t.test('11. Role-Based Access Control: Retailer blocked from admin-only route', async () => {
    const res = await request(app)
      .get('/api/auth/admin-only')
      .set('Authorization', `Bearer ${retailerToken}`)
      .expect(403);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access forbidden: Role "retailer"/i);
  });

  await t.test('12. Role-Based Access Control: Admin allowed on admin-only route', async () => {
    const res = await request(app)
      .get('/api/auth/admin-only')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.match(res.body.message, /Welcome to the Admin Portal/i);
  });

  await t.test('13. POST /api/auth/logout behavior', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${retailerToken}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.match(res.body.message, /discard the stored authorization token/i);
  });
});
