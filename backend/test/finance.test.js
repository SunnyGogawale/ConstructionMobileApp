import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFinanceTotal } from '../src/domain/finance.js';

test('calculates labour, material, quantity, tax, and discount totals', () => {
  assert.deepEqual(calculateFinanceTotal({
    labourCharges: 1000,
    materialCharges: 500,
    quantity: 2,
    unitPrice: 150,
    taxRate: 10,
    discount: 50,
  }), { subtotal: 1800, total: 1930 });
});

test('rejects negative and non-finite financial inputs', () => {
  assert.throws(() => calculateFinanceTotal({ labourCharges: -1 }), /non-negative/);
  assert.throws(() => calculateFinanceTotal({ unitPrice: Number.NaN }), /non-negative/);
});

test('does not return a negative invoice total for a discount exceeding subtotal', () => {
  assert.deepEqual(calculateFinanceTotal({ quantity: 1, unitPrice: 20, discount: 50 }), { subtotal: 20, total: 0 });
});
