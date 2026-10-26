import mongoose from 'mongoose';

const progressUpdateSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  attendance: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance', default: null },
  attendanceSession: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance', default: null, index: true },
  subtasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subtask' }],
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

progressUpdateSchema.index({ attendance: 1 }, { unique: true, partialFilterExpression: { attendance: { $type: 'objectId' } } });
export default mongoose.model('ProgressUpdate', progressUpdateSchema);
