import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 180 },
  normalizedName: { type: String, required: true, lowercase: true, trim: true },
  contactName: { type: String, default: '', trim: true, maxlength: 120 },
  contactEmail: { type: String, default: '', lowercase: true, trim: true },
  contactPhone: { type: String, default: '', trim: true, maxlength: 40 },
  address: { type: String, default: '', trim: true, maxlength: 300 },
  active: { type: Boolean, default: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });

clientSchema.index({ normalizedName: 1 }, { unique: true });
clientSchema.index({ name: 'text', contactName: 'text', contactEmail: 'text' });
export default mongoose.model('Client', clientSchema);
