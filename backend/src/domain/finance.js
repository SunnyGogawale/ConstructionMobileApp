export function calculateFinanceTotal({ labourCharges = 0, materialCharges = 0, quantity = 0, unitPrice = 0, taxRate = 0, discount = 0 }) {
  const values = [labourCharges, materialCharges, quantity, unitPrice, taxRate, discount].map(Number);
  if (values.some(value => !Number.isFinite(value) || value < 0)) {
    throw new Error('Financial amounts must be finite, non-negative numbers.');
  }
  const [labour, materials, count, price, tax, discountAmount] = values;
  const subtotal = Math.round((labour + materials + count * price) * 100) / 100;
  const total = Math.max(0, Math.round((subtotal * (1 + tax / 100) - discountAmount) * 100) / 100);
  return { subtotal, total };
}
