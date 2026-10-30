import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSearchText, normalizePhone, isValidVietnamesePhone } from '../src/utils/format';

test('normalizeSearchText strips Vietnamese diacritics', () => {
  assert.equal(normalizeSearchText('Nụ Trầm Hương Đá'), 'nu tram huong da');
  assert.ok(normalizeSearchText('Thạch Anh Trắng').includes(normalizeSearchText('thach anh')));
});

test('normalizePhone and validation', () => {
  assert.equal(normalizePhone('+84 909-123-456'), '0909123456');
  assert.equal(isValidVietnamesePhone('0909123456'), true);
  assert.equal(isValidVietnamesePhone('0209123456'), false);
  assert.equal(isValidVietnamesePhone('09091234'), false);
});
