import mongoose from 'mongoose';

const progressUpdateSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  workDate: { type: Date, required: true },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  progress: { type: Number, required: true, min: 0, max: 100 },
  completedTasks: { type: [String], default: [] },
  pendingTasks: { type: [String], default: [] },
  remarks: { type: String, default: '', maxlength: 2000 },
  photoUrls: { type: [String], default: [] },
  reviewStatus: { type: String, enum: ['Pending', 'Approved', 'Revision requested'], default: 'Pending' },
  reviewFeedback: { type: String, default: '', maxlength: 1000 },
}, { timestamps: true });

export default mongoose.model('ProgressUpdate', progressUpdateSchema);
