import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('Health Check API', async (t) => {
  await t.test('GET /api/health returns 200 and healthy JSON status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200)
      .expect('Content-Type', /json/);

    assert.equal(response.body.success, true);
    assert.equal(response.body.status, 'active');
    assert.ok(response.body.timestamp);
    assert.ok(response.body.database);
    assert.ok(response.body.environment);
  });

  await t.test('GET / returns API welcome and docs link', async () => {
    const response = await request(app)
      .get('/')
      .expect(200)
      .expect('Content-Type', /json/);

    assert.equal(response.body.message, 'Pavitra B2B Saree Marketplace API');
    assert.equal(response.body.docs, '/api/health');
  });

  await t.test('GET /api/nonexistent returns 404 with structured error', async () => {
    const response = await request(app)
      .get('/api/nonexistent')
      .expect(404)
      .expect('Content-Type', /json/);

    assert.equal(response.body.success, false);
    assert.match(response.body.message, /Resource not found/);
  });
});
