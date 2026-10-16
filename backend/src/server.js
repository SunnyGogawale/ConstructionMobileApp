import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import Attendance from './models/Attendance.js';
import { MAX_BREAK_SECONDS } from './domain/attendance.js';

const port = Number(process.env.PORT || 4000);
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');

async function closeExpiredBreaks() {
  const now = Date.now();
  const expired = await Attendance.find({ status: 'on_break', breakEndedAt: null, breakStartedAt: { $lte: new Date(now - MAX_BREAK_SECONDS * 1000) } }).select('_id breakStartedAt');
  await Promise.all(expired.map(record => Attendance.updateOne(
    { _id: record._id, status: 'on_break', breakEndedAt: null },
    { $set: { status: 'active', breakEndedAt: new Date(record.breakStartedAt.getTime() + MAX_BREAK_SECONDS * 1000), breakAutoEnded: true } },
  )));
}

await mongoose.connect(process.env.MONGODB_URI);
await closeExpiredBreaks();
const breakTimer = setInterval(() => closeExpiredBreaks().catch(error => console.error('Break expiry task failed:', error)), 30_000);
const server = app.listen(port, () => console.log(`BuildFlow API listening on port ${port}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    clearInterval(breakTimer);
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  });
}
