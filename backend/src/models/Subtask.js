import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, default: '', maxlength: 3000 },
  startDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending', index: true },
}, { timestamps: true });

subtaskSchema.index({ project: 1, assignedWorker: 1, dueDate: 1 });
export default mongoose.model('Subtask', subtaskSchema);
