import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true, maxlength: 80 },
  category: { type: String, enum: ['project', 'assignment', 'attendance', 'progress', 'finance', 'system'], required: true, index: true },
  title: { type: String, required: true, maxlength: 180 },
  message: { type: String, required: true, maxlength: 1000 },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
  recordType: { type: String, default: '' },
  recordId: { type: mongoose.Schema.Types.ObjectId, default: null },
  readAt: { type: Date, default: null, index: true },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ title: 'text', message: 'text', type: 'text' });
export default mongoose.model('Notification', notificationSchema);
