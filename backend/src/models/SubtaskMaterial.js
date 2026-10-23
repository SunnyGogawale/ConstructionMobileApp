import mongoose from 'mongoose';

const subtaskMaterialSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  subtask: { type: mongoose.Schema.Types.ObjectId, ref: 'Subtask', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, default: '', maxlength: 3000 },
  quantity: { type: Number, required: true, min: Number.MIN_VALUE },
  unit: { type: String, required: true, trim: true, maxlength: 80 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalCost: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
  notes: { type: String, default: '', maxlength: 2000 },
}, { timestamps: true });

subtaskMaterialSchema.index({ project: 1, subtask: 1, date: -1 });
export default mongoose.model('SubtaskMaterial', subtaskMaterialSchema);
