import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = fileURLToPath(new URL('../../', import.meta.url));
const configuredDirectory = process.env.UPLOAD_DIRECTORY || 'uploads';

export const uploadDirectory = path.isAbsolute(configuredDirectory)
  ? path.resolve(configuredDirectory)
  : path.resolve(backendDirectory, configuredDirectory);
