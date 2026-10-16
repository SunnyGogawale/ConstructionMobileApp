import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  dayKey: { type: String, required: true },
  timeZone: { type: String, default: 'UTC' },
  status: { type: String, enum: ['active', 'on_break', 'completed'], default: 'active' },
  checkedInAt: { type: Date, required: true },
  checkInLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracyMetres: { type: Number, required: true },
    distanceMetres: { type: Number, required: true },
  },
  checkInSelfieUrl: { type: String, required: true },
  checkedOutAt: { type: Date, default: null },
  checkOutLocation: { type: mongoose.Schema.Types.Mixed, default: null },
  checkOutSelfieUrl: { type: String, default: null },
  workDescription: { type: String, default: '' },
  workPhotoUrls: { type: [String], default: [] },
  breakStartedAt: { type: Date, default: null },
  breakEndedAt: { type: Date, default: null },
  breakUsed: { type: Boolean, default: false },
  breakAutoEnded: { type: Boolean, default: false },
}, { timestamps: true });

attendanceSchema.index({ worker: 1, dayKey: 1 }, { unique: true });
attendanceSchema.index({ status: 1, breakStartedAt: 1, breakEndedAt: 1 });
export default mongoose.model('Attendance', attendanceSchema);
