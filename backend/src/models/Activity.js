import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actorName: { type: String, required: true, maxlength: 120 },
  action: { type: String, required: true, maxlength: 80 },
  category: { type: String, enum: ['project', 'assignment', 'attendance', 'progress', 'finance', 'people', 'system'], required: true, index: true },
  title: { type: String, required: true, maxlength: 180 },
  detail: { type: String, default: '', maxlength: 1000 },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
  entityType: { type: String, default: '' },
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

activitySchema.index({ createdAt: -1 });
export default mongoose.model('Activity', activitySchema);
