import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Isolated data folder so tests never touch the real store.json
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'tiem-test-'));
process.env.NODE_ENV = 'production'; // seed without the sample order

type Db = typeof import('../server/db').db;
let db: Db;
let productId: string;

const baseOrder = () => ({
  customerName: 'Khách Test',
  customerPhone: '0909 123 456',
  province: 'TP. Hồ Chí Minh',
  district: 'Quận 1',
  address: '1 Lê Lợi',
  items: [{ productId, quantity: 1 }],
  paymentMethod: 'COD' as const,
});

before(async () => {
  ({ db } = await import('../server/db'));
  const p = db.getProducts().find((x) => x.isActive && x.stock >= 5 && !x.variations?.length)!;
  productId = p.id;
});

test('creates a COD order, computes totals server-side and decrements stock', () => {
  const before = db.getProductById(productId)!.stock;
  const res = db.createOrder({ ...baseOrder(), items: [{ productId, quantity: 2 }] });
  assert.equal(res.success, true, res.error);
  const order = res.order!;
  assert.match(order.id, /^AY-\d{6}-[A-Z2-9]{4}$/);
  assert.equal(order.customerPhone, '0909123456');
  assert.equal(order.subtotal, db.getProductById(productId)!.price * 2);
  assert.equal(order.totalAmount, order.subtotal + order.shippingFee + order.giftWrapFee);
  assert.equal(db.getProductById(productId)!.stock, before - 2);
});

test('rejects negative, zero and fractional quantities', () => {
  for (const quantity of [-5, 0, 1.5, 1000]) {
    const res = db.createOrder({ ...baseOrder(), items: [{ productId, quantity }] });
    assert.equal(res.success, false, `quantity ${quantity} should be rejected`);
  }
});

test('counts duplicate lines of the same product against one stock pool', () => {
  const stock = db.getProductById(productId)!.stock;
  const res = db.createOrder({
    ...baseOrder(),
    items: [
      { productId, quantity: stock },
      { productId, quantity: 1 },
    ],
  });
  assert.equal(res.success, false);
  assert.equal(db.getProductById(productId)!.stock, stock, 'stock must be untouched on failure');
});

test('rejects invalid phone numbers and payment methods', () => {
  assert.equal(db.createOrder({ ...baseOrder(), customerPhone: '12345' }).success, false);
  assert.equal(db.createOrder({ ...baseOrder(), paymentMethod: 'CRYPTO' as any }).success, false);
});

test('refuses bank transfer when no receiving account is configured', () => {
  db.updateSettings({ accountNumber: '' });
  const stock = db.getProductById(productId)!.stock;
  const res = db.createOrder({ ...baseOrder(), paymentMethod: 'BANK_TRANSFER' });
  assert.equal(res.success, false);
  assert.equal(db.getProductById(productId)!.stock, stock);

  db.updateSettings({ accountNumber: '0123456789' });
  const ok = db.createOrder({ ...baseOrder(), paymentMethod: 'BANK_TRANSFER' });
  assert.equal(ok.success, true, ok.error);
  assert.equal(ok.order!.bankSnapshot?.accountNumber, '0123456789');
});

test('cancelling restocks exactly once', () => {
  const stock = db.getProductById(productId)!.stock;
  const order = db.createOrder(baseOrder()).order!;
  assert.equal(db.getProductById(productId)!.stock, stock - 1);
  db.updateOrderStatus(order.id, 'cancelled');
  db.updateOrderStatus(order.id, 'cancelled');
  assert.equal(db.getProductById(productId)!.stock, stock);
});

test('order lookup tolerates phone formatting differences', () => {
  const order = db.createOrder(baseOrder()).order!;
  assert.ok(db.findOrderByPhoneAndCode('+84 909 123 456', order.id.toLowerCase()));
  assert.equal(db.findOrderByPhoneAndCode('0911111111', order.id), null);
});

test('settings validation: PIN must be 6 digits, bankingHistory is server-managed', () => {
  assert.throws(() => db.updateSettings({ adminPin: '12' }));
  assert.throws(() => db.updateSettings({ shippingFlatFee: -1 }));
  db.updateSettings({ bankingHistory: [] as any, adminPin: '654321' });
  assert.equal(db.getSettings().adminPin, '654321');
  assert.ok((db.getSettings().bankingHistory || []).length > 0);
});

test('product update cannot change the product id', () => {
  const updated = db.updateProduct(productId, { id: 'hacked', name: 'Tên mới' } as any)!;
  assert.equal(updated.id, productId);
  assert.equal(updated.name, 'Tên mới');
});

test('data is persisted to store.json', () => {
  const saved = JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR!, 'store.json'), 'utf-8'));
  assert.ok(saved.orders.length >= 3);
});
