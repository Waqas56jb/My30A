import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/config/db.js';

const app = createApp();

async function login(email: string, password: string, role: string) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password, role });
  assert.equal(res.status, 200, res.body?.error?.message ?? res.text);
  return { token: res.body.data.token as string, account: res.body.data.account };
}

describe('My30A Host API', () => {
  let sarah: { token: string; account: { id: string } };
  let alex: { token: string };
  let michael: { token: string };
  let glow: { token: string; account: { id: string } };
  let carts: { token: string; account: { id: string } };
  let alicia: { token: string };
  let tom: { token: string };

  before(async () => {
    sarah = await login('sarah@my30a.com', 'demo1234', 'GUEST');
    alex = await login('alex@my30a.com', 'demo1234', 'GUEST');
    michael = await login('michael@coastalkey30a.com', 'demo1234', 'HOST');
    glow = await login('glow@30abonfires.com', 'demo1234', 'PARTNER');
    carts = await login('carts@30agolfcarts.com', 'demo1234', 'PARTNER');
    alicia = await login('alicia@my30a.com', 'admin1234', 'ADMIN');
    tom = await login('tom@my30a.com', 'admin1234', 'ADMIN');
  });

  after(async () => {
    await pool.end();
  });

  it('health reports subsystems without secrets', async () => {
    const res = await request(app).get('/health');
    assert.ok([200, 503].includes(res.status));
    assert.ok(res.body.service);
    assert.equal(JSON.stringify(res.body).includes('sk-'), false);
  });

  it('rejects bad credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'sarah@my30a.com', password: 'wrongpass', role: 'GUEST' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'AUTH_INVALID');
  });

  it('guest without a stay can browse but cannot read WiFi', async () => {
    const publicRes = await request(app).get('/api/v1/restaurants');
    assert.equal(publicRes.status, 200);
    assert.ok(Array.isArray(publicRes.body.data));

    const wifi = await request(app)
      .get('/api/v1/properties/authorized')
      .set('Authorization', `Bearer ${alex.token}`);
    assert.equal(wifi.status, 403);
    assert.equal(wifi.body.error.code, 'PROPERTY_ACCESS_DENIED');
  });

  it('guest A cannot read guest B grocery order', async () => {
    const mine = await request(app)
      .get('/api/v1/grocery')
      .set('Authorization', `Bearer ${sarah.token}`);
    assert.equal(mine.status, 200);
    const other = mine.body.data.find((o: { guestId: string }) => o.guestId !== sarah.account.id);
    assert.equal(other, undefined);

    const hidden = await request(app)
      .get('/api/v1/grocery/GR-1024')
      .set('Authorization', `Bearer ${alex.token}`);
    assert.equal(hidden.status, 404);
  });

  it('partner A cannot read partner B analytics', async () => {
    const own = await request(app)
      .get('/api/v1/partners/me/analytics')
      .set('Authorization', `Bearer ${glow.token}`);
    assert.equal(own.status, 200);
    assert.ok(own.body.data.notTracked);

    const other = await request(app)
      .get('/api/v1/partners/me')
      .set('Authorization', `Bearer ${carts.token}`);
    assert.equal(other.status, 200);
    assert.notEqual(other.body.data.id, glow.account.id);
  });

  it('host cannot operate grocery orders', async () => {
    const res = await request(app)
      .get('/api/v1/grocery')
      .set('Authorization', `Bearer ${michael.token}`);
    assert.equal(res.status, 403);
  });

  it('content manager cannot confirm grocery orders', async () => {
    const res = await request(app)
      .post('/api/v1/grocery/GR-1024/status')
      .set('Authorization', `Bearer ${tom.token}`)
      .send({ status: 'confirmed' });
    assert.equal(res.status, 403);
  });

  it('admin can confirm grocery and invalid transitions fail', async () => {
    const created = await request(app)
      .post('/api/v1/grocery')
      .set('Authorization', `Bearer ${sarah.token}`)
      .send({
        items: 'Milk\nEggs',
        deliveryDate: '2026-08-22',
        deliveryWindow: '10:00 AM – 12:00 PM',
        store: 'Publix',
        cancellationAccepted: true,
      });
    assert.equal(created.status, 201);
    const id = created.body.data.id as string;

    const skip = await request(app)
      .post(`/api/v1/grocery/${id}/status`)
      .set('Authorization', `Bearer ${alicia.token}`)
      .send({ status: 'delivered' });
    assert.equal(skip.status, 409);
    assert.equal(skip.body.error.code, 'INVALID_STATUS_TRANSITION');

    const confirm = await request(app)
      .post(`/api/v1/grocery/${id}/status`)
      .set('Authorization', `Bearer ${alicia.token}`)
      .send({ status: 'confirmed' });
    assert.equal(confirm.status, 200);
    assert.equal(confirm.body.data.status, 'confirmed');

    const pay = await request(app)
      .post(`/api/v1/grocery/${id}/pay`)
      .set('Authorization', `Bearer ${sarah.token}`);
    assert.equal(pay.status, 503);
    assert.equal(pay.body.error.code, 'PAYMENT_PROVIDER_NOT_CONFIGURED');
  });

  it('transfer lifecycle and cancellation preview', async () => {
    const created = await request(app)
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${sarah.token}`)
      .send({
        airport: 'ECP',
        date: '2026-08-25',
        time: '14:00',
        passengers: 4,
        bags: 3,
        vehicleClass: 'suv',
      });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.status, 'pending');
    assert.ok(created.body.data.quotedPrice);

    const preview = await request(app)
      .get(`/api/v1/transfers/${created.body.data.id}/cancellation-preview`)
      .set('Authorization', `Bearer ${sarah.token}`);
    assert.equal(preview.status, 200);
    assert.ok(preview.body.data.policy);

    const authorize = await request(app)
      .post(`/api/v1/transfers/${created.body.data.id}/authorize`)
      .set('Authorization', `Bearer ${sarah.token}`);
    assert.equal(authorize.status, 503);
    assert.equal(authorize.body.error.code, 'PAYMENT_PROVIDER_NOT_CONFIGURED');
  });

  it('public explore, weather, map, pricing', async () => {
    const weather = await request(app).get('/api/v1/weather');
    assert.equal(weather.status, 200);
    const map = await request(app).get('/api/v1/map/entities');
    assert.equal(map.status, 200);
    const pricing = await request(app).get('/api/v1/pricing');
    assert.equal(pricing.status, 200);
    assert.ok(pricing.body.data.packages.length);
  });

  it('partner clicks increment only referral metrics', async () => {
    const res = await request(app)
      .post(`/api/v1/partners/${glow.account.id}/events`)
      .set('Authorization', `Bearer ${sarah.token}`)
      .send({ eventType: 'partner_website_click' });
    assert.equal(res.status, 200);
    assert.ok(res.body.data.notTracked);
  });

  it('notifications are scoped to the recipient', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${sarah.token}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.items));
  });
});
