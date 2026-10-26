import mongoose from 'mongoose';

const imageFilenamePattern = /^[0-9a-f-]{36}\.(?:jpe?g|png|webp|heic)$/i;
let bucket;
let bucketDatabase;

export function getUploadBucket() {
  const database = mongoose.connection.db;
  if (!database) throw new Error('MongoDB must be connected before accessing image uploads.');
  if (bucketDatabase !== database) {
    bucket = new mongoose.mongo.GridFSBucket(database, { bucketName: 'uploads' });
    bucketDatabase = database;
  }
  return bucket;
}

export async function findStoredUpload(filename) {
  if (!imageFilenamePattern.test(filename)) return null;
  const [file] = await getUploadBucket().find({ filename }).limit(1).toArray();
  return file || null;
}
