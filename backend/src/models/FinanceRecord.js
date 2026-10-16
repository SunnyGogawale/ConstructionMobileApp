import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true, maxlength: 500 },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
}, { _id: false });

const financeRecordSchema = new mongoose.Schema({
  recordType: { type: String, enum: ['quotation', 'invoice', 'payment', 'expense'], required: true, index: true },
  reference: { type: String, required: true, unique: true },
  client: { type: String, required: true, trim: true, index: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
  projectReference: { type: String, required: true },
  description: { type: String, required: true, maxlength: 1000 },
  category: { type: String, default: '' },
  lineItems: { type: [lineItemSchema], default: [] },
  labourCharges: { type: Number, min: 0, default: 0 },
  materialCharges: { type: Number, min: 0, default: 0 },
  taxRate: { type: Number, min: 0, default: 0 },
  discount: { type: Number, min: 0, default: 0 },
  subtotal: { type: Number, min: 0, default: 0 },
  total: { type: Number, min: 0, default: 0 },
  amountReceived: { type: Number, min: 0, default: 0 },
  paymentMethod: { type: String, default: '' },
  transactionReference: { type: String, default: '' },
  issueDate: { type: Date, default: null },
  dueDate: { type: Date, default: null },
  validUntil: { type: Date, default: null },
  paidAt: { type: Date, default: null },
  receiptUrl: { type: String, default: '' },
  status: { type: String, required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

financeRecordSchema.index({ recordType: 1, createdAt: -1 });
export default mongoose.model('FinanceRecord', financeRecordSchema);
