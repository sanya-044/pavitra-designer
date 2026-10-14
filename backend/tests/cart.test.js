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
import Wishlist from '../src/models/Wishlist.js';
import { generateToken } from '../src/utils/jwt.js';

test('B2B Inquiry Bag (Cart) & Wishlist API Suite', async (t) => {
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

  // 1. Create Buyer A & Buyer B for tenant separation tests
  let buyerA = await User.findOne({ email: 'buyer_a@test.com' });
  if (!buyerA) {
    buyerA = await User.create({
      name: 'Buyer Alpha Silks',
      email: 'buyer_a@test.com',
      password: 'Password123!',
      role: 'retailer',
      businessName: 'Alpha Textiles',
      accountStatus: 'active'
    });
  }

  let buyerB = await User.findOne({ email: 'buyer_b@test.com' });
  if (!buyerB) {
    buyerB = await User.create({
      name: 'Buyer Beta Sarees',
      email: 'buyer_b@test.com',
      password: 'Password123!',
      role: 'retailer',
      businessName: 'Beta Textiles',
      accountStatus: 'active'
    });
  }

  let weaverUser = await User.findOne({ email: 'weaver_cart_test@test.com' });
  if (!weaverUser) {
    weaverUser = await User.create({
      name: 'Chanderi Loom Guild',
      email: 'weaver_cart_test@test.com',
      password: 'Password123!',
      role: 'seller',
      businessName: 'Chanderi Looms',
      accountStatus: 'active'
    });
  }

  const tokenA = generateToken(buyerA);
  const tokenB = generateToken(buyerB);

  // 2. Create sample test products (with MOQ = 5, Stock = 50, Price = 3000)
  const productA = await Product.create({
    name: 'Cart Test Handloom Chanderi Saree',
    category: 'Chanderi',
    fabric: 'Cotton Silk',
    origin: 'Madhya Pradesh',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb',
    price: 3000,
    moq: 5,
    stock: 50,
    seller: weaverUser._id,
    isActive: true
  });

  const productB = await Product.create({
    name: 'Cart Test Kanchipuram Brocade Saree',
    category: 'Kanchipuram',
    fabric: 'Mulberry Silk',
    origin: 'Tamil Nadu',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b',
    price: 6000,
    moq: 3,
    stock: 20,
    seller: weaverUser._id,
    isActive: true
  });

  // Clean initial cart and wishlist for Buyer A and B
  await Cart.deleteMany({ user: { $in: [buyerA._id, buyerB._id] } });
  await Wishlist.deleteMany({ user: { $in: [buyerA._id, buyerB._id] } });

  t.after(async () => {
    await Cart.deleteMany({ user: { $in: [buyerA._id, buyerB._id] } });
    await Wishlist.deleteMany({ user: { $in: [buyerA._id, buyerB._id] } });
    await Product.deleteMany({ _id: { $in: [productA._id, productB._id] } });
    await User.deleteMany({
      email: { $in: ['buyer_a@test.com', 'buyer_b@test.com', 'weaver_cart_test@test.com'] }
    });
    await mongoose.disconnect();
  });

  // CART TESTS
  await t.test('1. Unauthenticated request to /api/cart is rejected (401)', async () => {
    await request(app).get('/api/cart').expect(401);
  });

  await t.test('2. GET /api/cart initializes empty cart for new user', async () => {
    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.cart.items.length, 0);
    assert.equal(res.body.data.cart.totalUnits, 0);
    assert.equal(res.body.data.cart.subtotal, 0);
  });

  await t.test('3. POST /api/cart/items rejects quantity below MOQ (400)', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        productId: productA._id.toString(),
        quantity: 2 // MOQ is 5
      })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Minimum Order Quantity \(MOQ\) of 5 pieces/i);
  });

  await t.test('4. POST /api/cart/items rejects quantity exceeding stock (400)', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        productId: productA._id.toString(),
        quantity: 100 // Stock is 50
      })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /exceeds available weaver loom stock/i);
  });

  await t.test('5. POST /api/cart/items successfully adds product with valid MOQ', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        productId: productA._id.toString(),
        quantity: 5 // Meets MOQ 5
      })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.cart.items.length, 1);
    assert.equal(res.body.data.cart.items[0].quantity, 5);
    assert.equal(res.body.data.cart.totalUnits, 5);
    assert.equal(res.body.data.cart.subtotal, 15000); // 5 * 3000
    assert.equal(res.body.data.cart.formattedSubtotal, '₹15,000');
    assert.ok(res.body.data.cart.estimatedTax > 0);
    assert.ok(res.body.data.cart.grandTotal > 15000);
  });

  await t.test('6. POST /api/cart/items increments quantity on duplicate addition', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        productId: productA._id.toString(),
        quantity: 5 // Adds 5 more, making it 10
      })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.cart.items.length, 1); // No duplicate array entry
    assert.equal(res.body.data.cart.items[0].quantity, 10);
    assert.equal(res.body.data.cart.subtotal, 30000); // 10 * 3000
  });

  await t.test('7. Tenant Isolation: Buyer B cannot see Buyer A cart items', async () => {
    const resB = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    assert.equal(resB.body.success, true);
    assert.equal(resB.body.data.cart.items.length, 0); // Cart is completely separate
  });

  await t.test('8. PATCH /api/cart/items/:productId directly updates item quantity', async () => {
    const res = await request(app)
      .patch(`/api/cart/items/${productA._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ quantity: 6 })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.cart.items[0].quantity, 6);
    assert.equal(res.body.data.cart.subtotal, 18000); // 6 * 3000
  });

  await t.test('9. DELETE /api/cart/items/:productId removes item from cart', async () => {
    const res = await request(app)
      .delete(`/api/cart/items/${productA._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.cart.items.length, 0);
    assert.equal(res.body.data.cart.subtotal, 0);
  });

  await t.test('10. DELETE /api/cart clears all items in cart', async () => {
    // Add two products first
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ productId: productA._id.toString(), quantity: 5 });

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ productId: productB._id.toString(), quantity: 3 });

    // Clear cart
    const res = await request(app)
      .delete('/api/cart')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.cart.items.length, 0);
    assert.equal(res.body.data.cart.totalUnits, 0);
  });

  // WISHLIST TESTS
  await t.test('11. Unauthenticated request to /api/wishlist is rejected (401)', async () => {
    await request(app).get('/api/wishlist').expect(401);
  });

  await t.test('12. POST /api/wishlist/items adds product and prevents duplicates', async () => {
    // First addition
    const res1 = await request(app)
      .post('/api/wishlist/items')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ productId: productA._id.toString() })
      .expect(200);

    assert.equal(res1.body.success, true);
    assert.equal(res1.body.data.isInWishlist, true);
    assert.equal(res1.body.data.totalCount, 1);

    // Duplicate addition (idempotent, does not duplicate)
    const res2 = await request(app)
      .post('/api/wishlist/items')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ productId: productA._id.toString() })
      .expect(200);

    assert.equal(res2.body.success, true);
    assert.equal(res2.body.data.totalCount, 1);
  });

  await t.test('13. GET /api/wishlist returns active saved items with formatting', async () => {
    const res = await request(app)
      .get('/api/wishlist')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.wishlist.products.length, 1);
    assert.equal(res.body.data.wishlist.products[0].name, productA.name);
    assert.ok(res.body.data.wishlist.products[0].formattedPrice);
    assert.ok(res.body.data.wishlist.products[0].formattedMoq);
  });

  await t.test('14. DELETE /api/wishlist/items/:productId removes product from wishlist', async () => {
    const res = await request(app)
      .delete(`/api/wishlist/items/${productA._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.isInWishlist, false);
    assert.equal(res.body.data.totalCount, 0);
  });

  await t.test('15. Inactive product handling: Deactivated saree is filtered out from wishlist', async () => {
    // Add product B to wishlist
    await request(app)
      .post('/api/wishlist/items')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ productId: productB._id.toString() })
      .expect(200);

    // Deactivate product B
    productB.isActive = false;
    await productB.save();

    // Verify it is safely excluded from GET /api/wishlist
    const res = await request(app)
      .get('/api/wishlist')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.wishlist.products.length, 0); // Filtered out safely
  });
});
