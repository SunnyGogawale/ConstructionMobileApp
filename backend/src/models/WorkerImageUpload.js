import mongoose from 'mongoose';

const workerImageUploadSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  purpose: { type: String, enum: ['check-in', 'check-out', 'daily-attendance'], required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  sha256: { type: String, required: true },
  relativePath: { type: String, required: true },
}, { timestamps: true });

workerImageUploadSchema.index({ worker: 1, purpose: 1, project: 1, sha256: 1 }, { unique: true });
export default mongoose.model('WorkerImageUpload', workerImageUploadSchema);
