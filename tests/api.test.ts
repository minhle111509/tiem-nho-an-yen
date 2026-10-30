import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Database, StorageAdapter, StoreChange, StoreData } from '../server/db';
import { createApi, ApiRequest } from '../server/api';

// In-memory storage that also records what each write touched
class MemoryStorage implements StorageAdapter {
  data: StoreData | null = null;
  changes: StoreChange[] = [];
  load() {
    return this.data ? structuredClone(this.data) : null;
  }
  save(data: StoreData, change: StoreChange) {
    this.data = structuredClone(data);
    this.changes.push(change);
  }
}

const images = new Map<string, Uint8Array>();
const setup = () => {
  const storage = new MemoryStorage();
  const db = new Database(storage, { adminPin: '654321' });
  const api = createApi(db, { put: (name, _m, bytes) => void images.set(name, bytes) }, { maxUploadBytes: 1024 * 1024 });
  const call = (method: string, path: string, body?: unknown, headers: Record<string, string> = {}, ip = '1.1.1.1') => {
    const [p, q] = path.split('?');
    const req: ApiRequest = {
      method,
      path: p,
      query: new URLSearchParams(q || ''),
      body,
      header: (n) => headers[n.toLowerCase()],
      ip,
    };
    return api(req) as Promise<{ status: number; body: any }>;
  };
  return { db, storage, call };
};

test('public settings never expose the admin PIN', async () => {
  const { call } = setup();
  const res = await call('GET', '/api/settings/public');
  assert.equal(res.status, 200);
  assert.equal(res.body.settings.adminPin, undefined);
});

test('admin routes require the PIN; wrong PINs get rate limited', async () => {
  const { call } = setup();
  assert.equal((await call('GET', '/api/admin/orders')).status, 401);
  assert.equal((await call('GET', '/api/admin/orders', undefined, { 'x-admin-pin': '654321' })).status, 200);
  for (let i = 0; i < 10; i++) await call('POST', '/api/admin/login', { pin: '000000' }, {}, '9.9.9.9');
  assert.equal((await call('POST', '/api/admin/login', { pin: '000000' }, {}, '9.9.9.9')).status, 429);
});

test('order lookup hides internal notes', async () => {
  const { db, call } = setup();
  const product = db.getProducts().find((p) => p.isActive && p.stock > 0 && !p.variations?.length)!;
  const created = await call('POST', '/api/orders', {
    customerName: 'A',
    customerPhone: '0909123456',
    province: 'HCM',
    address: 'x',
    paymentMethod: 'COD',
    items: [{ productId: product.id, quantity: 1 }],
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  db.updateInternalNote(created.body.order.id, 'secret');
  const res = await call('POST', '/api/orders/lookup', { phone: '0909123456', orderId: created.body.order.id });
  assert.equal(res.status, 200);
  assert.equal(res.body.order.internalNote, undefined);
});

test('writes report exactly which rows changed', async () => {
  const { db, storage, call } = setup();
  const pin = { 'x-admin-pin': '654321' };
  const product = db.getProducts()[0];
  storage.changes = [];
  await call('PUT', `/api/admin/products/${product.id}/toggle-status`, undefined, pin);
  assert.deepEqual(storage.changes, [{ products: [product.id] }]);
});

test('upload rejects non-images and stores valid ones', async () => {
  const { call } = setup();
  const pin = { 'x-admin-pin': '654321' };
  const bad = await call('POST', '/api/admin/upload-image', { imageBase64: 'data:text/html;base64,PGgxPg==' }, pin);
  assert.equal(bad.status, 400);
  const good = await call('POST', '/api/admin/upload-image', { imageBase64: 'data:image/png;base64,iVBORw0KGgo=' }, pin);
  assert.equal(good.status, 200);
  assert.match(good.body.url, /^\/uploads\/ay-prod-.+\.png$/);
  assert.ok(images.has(good.body.url.slice('/uploads/'.length)));
});

test('export + import round-trips all data and requires confirmation', async () => {
  const a = setup();
  const pin = { 'x-admin-pin': '654321' };
  const backup = (await a.call('GET', '/api/admin/export', undefined, pin)).body;
  backup.settings.storeName = 'Restored';

  const b = setup();
  assert.equal((await b.call('POST', '/api/admin/import', { data: backup }, pin)).status, 400);
  const res = await b.call('POST', '/api/admin/import', { data: backup, confirm: 'REPLACE_ALL_DATA' }, pin);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(b.db.getSettings().storeName, 'Restored');
  assert.deepEqual(b.storage.changes.at(-1), { all: true });
});

test('unknown API path returns JSON 404', async () => {
  const { call } = setup();
  assert.equal((await call('GET', '/api/nope')).status, 404);
});
