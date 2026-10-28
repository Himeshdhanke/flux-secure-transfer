const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Master key validation: must be 32 bytes (64 hex characters)
let masterKey = process.env.SECURESHARE_MASTER_KEY;
if (!masterKey) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: SECURESHARE_MASTER_KEY must be configured in production (64 hex characters / 32 bytes).');
  }
  // In development, provide a stable fallback key if not set, but log a warning
  console.warn('[SECURITY WARNING] SECURESHARE_MASTER_KEY not set in environment. Using development fallback key.');
  masterKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
}

if (masterKey.length !== 64 || !/^[0-9a-fA-F]+$/.test(masterKey)) {
  throw new Error('SECURESHARE_MASTER_KEY must be exactly 64 hexadecimal characters representing a 256-bit key.');
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secureshare',
  masterKeyBuffer: Buffer.from(masterKey, 'hex'),

  // Storage configuration
  storageMode: (process.env.SECURESHARE_STORAGE_MODE || 'local').toLowerCase(), // 'local' or 's3'
  storageDirectory: process.env.SECURESHARE_STORAGE_DIRECTORY || path.resolve(__dirname, '../../../storage_vault'),

  // AWS Configuration
  aws: {
    region: (process.env.AWS_REGION && process.env.AWS_REGION.trim() !== '') ? process.env.AWS_REGION.trim() : 'ap-southeast-2',
    s3Bucket: (process.env.AWS_S3_BUCKET && process.env.AWS_S3_BUCKET.trim() !== '') ? process.env.AWS_S3_BUCKET.trim() : 'flux-encrypted-vault-prod',
    kms: {
      enabled: process.env.KMS_ENABLED === 'true' || Boolean(process.env.AWS_KMS_KEY_ID),
      keyId: process.env.AWS_KMS_KEY_ID || '',
    },
    cloudWatch: {
      enabled: process.env.CLOUDWATCH_ENABLED === 'true',
      logGroup: process.env.CLOUDWATCH_LOG_GROUP || '/aws/secureshare/application-logs',
      logStream: process.env.CLOUDWATCH_LOG_STREAM || `instance-${Date.now()}`
    },
    cognito: {
      userPoolId: process.env.COGNITO_USER_POOL_ID || '',
      clientId: process.env.COGNITO_CLIENT_ID || '',
      clientSecret: process.env.COGNITO_CLIENT_SECRET || '',
      issuerUri: process.env.COGNITO_ISSUER_URI || (process.env.COGNITO_USER_POOL_ID && process.env.AWS_REGION ? `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}` : '')
    }
  },

  // Security limits
  maxUploadSizeBytes: (parseInt(process.env.MAX_UPLOAD_SIZE_MB || '20', 10)) * 1024 * 1024,
  maxPdfPages: parseInt(process.env.MAX_PDF_PAGES || '100', 10),

  // Local JWT Auth (Active when Cognito is not configured, enabling zero-friction local development)
  localJwtSecret: process.env.LOCAL_JWT_SECRET || 'secureshare-local-development-secret-key-32b',
};

module.exports = config;
