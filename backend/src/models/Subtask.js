import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, default: '', maxlength: 3000 },
  startDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending', index: true },
  taskStartedAt: { type: Date, default: null },
  taskStartAttendance: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance', default: null },
  taskStartSelfieUrl: { type: String, default: null },
  taskStartLocation: { type: mongoose.Schema.Types.Mixed, default: null },
  taskCompletedAt: { type: Date, default: null },
  taskCompletionSelfieUrl: { type: String, default: null },
  taskCompletionLocation: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

subtaskSchema.index({ project: 1, assignedWorker: 1, dueDate: 1 });
export default mongoose.model('Subtask', subtaskSchema);
