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
import Cart from '../src/models/Cart.js';
import Inquiry from '../src/models/Inquiry.js';
import Order from '../src/models/Order.js';
import { generateToken } from '../src/utils/jwt.js';

test('B2B Wholesale Inquiry and Order Management Integration Suite', async (t) => {
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

  // 1. Seed Roles: Retailer Alpha, Retailer Beta (for isolation), Loom Master Seller, and Platform Admin
  let retailerAlpha = await User.findOne({ email: 'retailer_alpha@test.com' });
  if (!retailerAlpha) {
    retailerAlpha = await User.create({
      name: 'Alpha Retailer Emporium',
      email: 'retailer_alpha@test.com',
      password: 'Password123!',
      role: 'retailer',
      businessName: 'Alpha Emporium Ltd',
      gstin: '27AAAAA0000A1Z5',
      accountStatus: 'active'
    });
  }

  let retailerBeta = await User.findOne({ email: 'retailer_beta@test.com' });
  if (!retailerBeta) {
    retailerBeta = await User.create({
      name: 'Beta Boutique Stores',
      email: 'retailer_beta@test.com',
      password: 'Password123!',
      role: 'retailer',
      businessName: 'Beta Boutique',
      gstin: '24BBBBB1111B1Z2',
      accountStatus: 'active'
    });
  }

  let loomSeller = await User.findOne({ email: 'loom_master@test.com' });
  if (!loomSeller) {
    loomSeller = await User.create({
      name: 'Varanasi Master Weaver',
      email: 'loom_master@test.com',
      password: 'Password123!',
      role: 'seller',
      businessName: 'Varanasi Heritage Weaves',
      gstin: '09CCCCC2222C1Z9',
      accountStatus: 'active'
    });
  }

  let adminUser = await User.findOne({ email: 'platform_admin@test.com' });
  if (!adminUser) {
    adminUser = await User.create({
      name: 'Platform Ops Admin',
      email: 'platform_admin@test.com',
      password: 'Password123!',
      role: 'admin',
      accountStatus: 'active'
    });
  }

  const tokenAlpha = generateToken(retailerAlpha);
  const tokenBeta = generateToken(retailerBeta);
  const tokenSeller = generateToken(loomSeller);
  const tokenAdmin = generateToken(adminUser);

  // 2. Seed Test Products (MOQ = 5, Stock = 40, Catalog Price = 5000)
  const productA = await Product.create({
    name: 'Order Test Banarasi Katan Silk Saree',
    category: 'Banarasi',
    fabric: 'Katan Pure Silk',
    origin: 'Varanasi, Uttar Pradesh',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c',
    price: 5000,
    moq: 5,
    stock: 40,
    seller: loomSeller._id,
    isActive: true
  });

  // Cleanup tracking arrays
  let createdInquiryId = null;
  let createdOrderId = null;

  t.after(async () => {
    await Inquiry.deleteMany({
      $or: [{ retailer: retailerAlpha._id }, { retailer: retailerBeta._id }]
    });
    await Order.deleteMany({
      $or: [{ retailer: retailerAlpha._id }, { retailer: retailerBeta._id }]
    });
    await Cart.deleteMany({
      user: { $in: [retailerAlpha._id, retailerBeta._id] }
    });
    await Product.deleteMany({ _id: productA._id });
    await User.deleteMany({
      email: {
        $in: [
          'retailer_alpha@test.com',
          'retailer_beta@test.com',
          'loom_master@test.com',
          'platform_admin@test.com'
        ]
      }
    });
    await mongoose.disconnect();
  });

  const validShippingAddress = {
    addressLine: 'Shop 42, New Zari Bazaar, MG Road',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001'
  };

  // --- INQUIRY TESTS ---

  await t.test('1. POST /api/inquiries rejects unauthenticated requests (401)', async () => {
    await request(app)
      .post('/api/inquiries')
      .send({
        productId: productA._id.toString(),
        quantity: 10,
        shippingAddress: validShippingAddress
      })
      .expect(401);
  });

  await t.test('2. POST /api/inquiries enforces Minimum Order Quantity (MOQ)', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .set('Authorization', `Bearer ${tokenAlpha}`)
      .send({
        productId: productA._id.toString(),
        quantity: 2, // Less than product MOQ 5
        shippingAddress: validShippingAddress
      })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Minimum Order Quantity \(MOQ\) of 5 pieces/i);
  });

  await t.test('3. POST /api/inquiries creates a valid bulk quotation inquiry', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .set('Authorization', `Bearer ${tokenAlpha}`)
      .send({
        productId: productA._id.toString(),
        quantity: 10,
        buyerNotes: 'Need custom zari border finish if possible.',
        shippingAddress: validShippingAddress
      })
      .expect(201);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.inquiry.inquiryNumber.startsWith('#PV-INQ-'));
    assert.equal(res.body.data.inquiry.totalUnits, 10);
    assert.equal(res.body.data.inquiry.estimatedSubtotal, 50000); // 10 * 5000
    assert.equal(res.body.data.inquiry.status, 'pending');

    createdInquiryId = res.body.data.inquiry.id;
  });

  await t.test('4. GET /api/inquiries/my retrieves only current retailer inquiries', async () => {
    const res = await request(app)
      .get('/api/inquiries/my')
      .set('Authorization', `Bearer ${tokenAlpha}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.inquiries.length >= 1);
    assert.equal(res.body.data.inquiries[0].id, createdInquiryId);
  });

  await t.test('5. Tenant Isolation: Retailer Beta cannot access Retailer Alpha inquiry (403)', async () => {
    const res = await request(app)
      .get(`/api/inquiries/${createdInquiryId}`)
      .set('Authorization', `Bearer ${tokenBeta}`)
      .expect(403);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access forbidden/i);
  });

  await t.test('6. GET /api/seller/inquiries allows assigned weaver to view inquiry', async () => {
    const res = await request(app)
      .get('/api/seller/inquiries')
      .set('Authorization', `Bearer ${tokenSeller}`)
      .expect(200);

    assert.equal(res.body.success, true);
    const inq = res.body.data.inquiries.find((i) => i.id === createdInquiryId);
    assert.ok(inq, 'Weaver should see inquiry for their handloom saree');
  });

  await t.test('7. PATCH /api/seller/inquiries/:id/quote allows weaver to submit quotation', async () => {
    const res = await request(app)
      .patch(`/api/seller/inquiries/${createdInquiryId}/quote`)
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({
        quotedPricePerUnit: 4600, // Discounted bulk rate
        sellerNotes: 'Special bulk festival discount: ₹4,600/pc applied for 10 sarees.',
        validUntilDays: 10
      })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.inquiry.status, 'quoted');
    assert.equal(res.body.data.inquiry.quotation.quotedPricePerUnit, 4600);
    assert.equal(res.body.data.inquiry.quotation.quotedSubtotal, 46000); // 10 * 4600
    assert.equal(res.body.data.inquiry.quotation.quotedTaxAmount, 2300); // 5% GST
    assert.equal(res.body.data.inquiry.quotation.quotedGrandTotal, 48300);
  });

  await t.test('8. PATCH /api/admin/inquiries/:id/status allows admin to supervise status lifecycle', async () => {
    const res = await request(app)
      .patch(`/api/admin/inquiries/${createdInquiryId}/status`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        status: 'accepted'
      })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.inquiry.status, 'accepted');
  });

  // --- ORDER TESTS ---

  await t.test('9. POST /api/orders rejects order if Cart is empty without inquiryId (400)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenAlpha}`)
      .send({
        shippingAddress: validShippingAddress
      })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /cart is empty/i);
  });

  await t.test('10. POST /api/orders successfully places order from approved quotation inquiry', async () => {
    const initialProductStock = (await Product.findById(productA._id)).stock;

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenAlpha}`)
      .send({
        inquiryId: createdInquiryId,
        shippingAddress: validShippingAddress,
        notes: 'Priority dispatch requested before Diwali festival.'
      })
      .expect(201);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.order.orderNumber.startsWith('#PV-ORD-'));
    assert.equal(res.body.data.order.totalUnits, 10);
    assert.equal(res.body.data.order.subtotal, 46000); // Uses quoted unit price ₹4,600 * 10
    assert.equal(res.body.data.order.taxAmount, 2300);
    assert.equal(res.body.data.order.grandTotal, 48300);
    assert.equal(res.body.data.order.status, 'confirmed');

    createdOrderId = res.body.data.order.id;

    // Verify stock deduction occurred
    const updatedProduct = await Product.findById(productA._id);
    assert.equal(updatedProduct.stock, initialProductStock - 10);

    // Verify inquiry marked as converted_to_order
    const updatedInq = await Inquiry.findById(createdInquiryId);
    assert.equal(updatedInq.status, 'converted_to_order');
  });

  await t.test('11. POST /api/orders places order from Cart with server-side pricing and resets cart', async () => {
    // 1. Add 5 items to Retailer Alpha's cart
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${tokenAlpha}`)
      .send({
        productId: productA._id.toString(),
        quantity: 5
      })
      .expect(200);

    const prevStock = (await Product.findById(productA._id)).stock;

    // 2. Place order from Cart
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenAlpha}`)
      .send({
        shippingAddress: validShippingAddress,
        idempotencyKey: 'cart-order-test-uuid-001'
      })
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.order.totalUnits, 5);
    assert.equal(res.body.data.order.subtotal, 25000); // 5 * 5000 (catalog price)
    assert.equal(res.body.data.order.taxAmount, 1250); // 5% GST
    assert.equal(res.body.data.order.grandTotal, 26250);

    // Verify stock deducted
    const afterStock = (await Product.findById(productA._id)).stock;
    assert.equal(afterStock, prevStock - 5);

    // Verify cart was cleared
    const cartRes = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${tokenAlpha}`)
      .expect(200);

    assert.equal(cartRes.body.data.cart.items.length, 0);
  });

  await t.test('12. Idempotency Check: Duplicate request with same idempotencyKey returns existing order without double-deduction', async () => {
    const stockBefore = (await Product.findById(productA._id)).stock;

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenAlpha}`)
      .send({
        shippingAddress: validShippingAddress,
        idempotencyKey: 'cart-order-test-uuid-001'
      })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.match(res.body.message, /idempotent request/i);

    // Stock must not change
    const stockAfter = (await Product.findById(productA._id)).stock;
    assert.equal(stockAfter, stockBefore);
  });

  await t.test('13. Insufficient Stock check: Reject order if quantity exceeds stock', async () => {
    // Current stock is 40 - 10 - 5 = 25
    // Add 26 to cart
    // Since product stock is 25, setting quantity > 25 in cart or updating stock below cart will fail
    await Product.findByIdAndUpdate(productA._id, { stock: 4 }); // Drop stock below MOQ or order

    // Try creating cart item or order with 5
    await Cart.findOneAndUpdate({ user: retailerAlpha._id }, {
      items: [{ product: productA._id, quantity: 5 }]
    }, { upsert: true });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenAlpha}`)
      .send({
        shippingAddress: validShippingAddress
      })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Insufficient stock/i);

    // Restore stock for remaining tests
    await Product.findByIdAndUpdate(productA._id, { stock: 50 });
  });

  await t.test('14. GET /api/orders/my lists retailer orders', async () => {
    const res = await request(app)
      .get('/api/orders/my')
      .set('Authorization', `Bearer ${tokenAlpha}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.orders.length >= 1);
  });

  await t.test('15. Order Access Control: Retailer Beta cannot view Retailer Alpha order (403)', async () => {
    const res = await request(app)
      .get(`/api/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${tokenBeta}`)
      .expect(403);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access forbidden/i);
  });

  await t.test('16. GET /api/seller/orders allows assigned weaver to view their orders', async () => {
    const res = await request(app)
      .get('/api/seller/orders')
      .set('Authorization', `Bearer ${tokenSeller}`)
      .expect(200);

    assert.equal(res.body.success, true);
    const ord = res.body.data.orders.find((o) => o.id === createdOrderId);
    assert.ok(ord, 'Seller should see order for their manufactured sarees');
  });

  await t.test('17. Invalid status transition is rejected with 400', async () => {
    // Order is currently 'confirmed'. Invalid transition directly to 'delivered'
    const res = await request(app)
      .patch(`/api/seller/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({
        status: 'delivered'
      })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Invalid status transition/i);
  });

  await t.test('18. Valid status transition updates order status (confirmed -> in_production)', async () => {
    const res = await request(app)
      .patch(`/api/seller/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({
        status: 'in_production'
      })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.order.status, 'in_production');
  });

  await t.test('19. Order cancellation releases and restores inventory stock safely', async () => {
    const stockBeforeCancel = (await Product.findById(productA._id)).stock;

    const res = await request(app)
      .patch(`/api/seller/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({
        status: 'cancelled'
      })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.order.status, 'cancelled');

    // Order had 10 units of productA. Verify 10 units released back to stock
    const stockAfterCancel = (await Product.findById(productA._id)).stock;
    assert.equal(stockAfterCancel, stockBeforeCancel + 10);
  });

  await t.test('20. GET /api/admin/orders lists all orders for platform supervision', async () => {
    const res = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.orders.length >= 1);
  });
});
