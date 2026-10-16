import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  projectId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, default: '', maxlength: 5000 },
  client: {
    name: { type: String, required: true, trim: true },
    contactName: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
  },
  address: { type: String, required: true, trim: true },
  location: {
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    radiusMetres: { type: Number, default: 100, min: 1, max: 1000 },
  },
  timeZone: { type: String, default: 'UTC' },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  assignedAt: { type: Date, default: null },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  priority: { type: String, enum: ['low', 'standard', 'high', 'urgent'], default: 'standard' },
  budget: { type: Number, min: 0, default: 0 },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  attachments: { type: [String], default: [] },
  status: { type: String, enum: ['Draft', 'Open', 'Assigned', 'In Progress', 'Completed', 'Closed', 'Cancelled'], default: 'Open', index: true },
}, { timestamps: true });

projectSchema.index({ status: 1, assignedWorker: 1 });
export default mongoose.model('Project', projectSchema);
