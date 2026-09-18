import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  endpoint: process.env.STORAGE_ENDPOINT,
  accessKeyId: process.env.STORAGE_ACCESS_KEY,
  secretAccessKey: process.env.STORAGE_SECRET_KEY,
  bucket: process.env.STORAGE_BUCKET || 'talentflow-documents',
  region: process.env.STORAGE_REGION || 'us-east-1',
  signedUrlExpiry: parseInt(process.env.STORAGE_SIGNED_URL_EXPIRY || '900', 10),
}));
