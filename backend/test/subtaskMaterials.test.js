import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSubtaskMaterialTotal,
  createSubtaskMaterialSchema,
  updateSubtaskMaterialSchema,
} from '../src/domain/subtaskMaterials.js';

const validMaterial = {
  name: 'Cement',
  quantity: 12,
  unit: 'bags',
  unitPrice: 8.75,
  date: '2026-10-23',
};

test('validates required subtask material fields and optional fields', () => {
  const result = createSubtaskMaterialSchema.safeParse(validMaterial);
  assert.equal(result.success, true);
  assert.equal(result.data.description, '');
  assert.equal(result.data.notes, '');
  assert.equal(calculateSubtaskMaterialTotal(result.data.quantity, result.data.unitPrice), 105);
});

test('rejects invalid quantities, prices, and empty material updates', () => {
  assert.equal(createSubtaskMaterialSchema.safeParse({ ...validMaterial, quantity: 0 }).success, false);
  assert.equal(createSubtaskMaterialSchema.safeParse({ ...validMaterial, unitPrice: -1 }).success, false);
  assert.equal(updateSubtaskMaterialSchema.safeParse({}).success, false);
  assert.equal(updateSubtaskMaterialSchema.safeParse({ quantity: 2 }).success, true);
});

test('rounds material totals to currency precision', () => {
  assert.equal(calculateSubtaskMaterialTotal(3, 0.335), 1.01);
});
