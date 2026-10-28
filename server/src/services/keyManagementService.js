const crypto = require('crypto');
const { KMSClient, EncryptCommand, DecryptCommand } = require('@aws-sdk/client-kms');
const config = require('../config/env');
const { CryptographicError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Key Management Service (KMS)
 * Implements hardware envelope encryption via AWS KMS (FIPS 140-3 validated HSM)
 * with authenticated local AES-256-GCM fallback.
 */
class KeyManagementService {
  constructor() {
    this.masterKey = config.masterKeyBuffer;
    this.kmsEnabled = Boolean(config.aws.kms && config.aws.kms.enabled && config.aws.kms.keyId);
    this.kmsKeyId = config.aws.kms ? config.aws.kms.keyId : '';
    this.kmsClient = null;

    if (this.kmsEnabled) {
      this._initKmsClient();
      logger.info('AWS KMS Hardware Envelope Encryption initialized', {
        keyId: this.kmsKeyId,
        region: config.aws.region,
      });
    } else {
      if (!this.masterKey || this.masterKey.length !== 32) {
        throw new Error('KeyManagementService failed to initialize: Invalid master key length. Must be 256 bits.');
      }
      logger.info('Local AES-256-GCM Key Wrapping initialized (KMS disabled or unconfigured)');
    }
  }

  _initKmsClient() {
    const clientConfig = {
      region: config.aws.region || 'ap-southeast-2',
    };
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      };
    }
    this.kmsClient = new KMSClient(clientConfig);
  }

  /**
   * Wrap (encrypt) a Data Encryption Key (DEK).
   * If AWS KMS is enabled, uses KMS hardware HSM (kms:Encrypt).
   * Otherwise, falls back to authenticated AES-256-GCM using local master key.
   *
   * @param {Buffer} dek - 32-byte random DEK
   * @returns {Promise<{ ciphertext: string, nonce: string, authTag: string, mode: string, kmsKeyId?: string }>}
   */
  async wrapKey(dek) {
    if (!Buffer.isBuffer(dek) || dek.length !== 32) {
      throw new CryptographicError('Invalid DEK provided for wrapping. DEK must be a 32-byte Buffer.');
    }

    // 1. AWS KMS Hardware HSM Wrap
    if (this.kmsEnabled && this.kmsKeyId) {
      if (!this.kmsClient) {
        this._initKmsClient();
      }
      try {
        const command = new EncryptCommand({
          KeyId: this.kmsKeyId,
          Plaintext: dek,
          EncryptionAlgorithm: 'SYMMETRIC_DEFAULT',
        });
        const response = await this.kmsClient.send(command);
        const ciphertextBase64 = Buffer.from(response.CiphertextBlob).toString('base64');

        logger.info('DEK wrapped via AWS KMS Hardware HSM', { keyId: this.kmsKeyId });
        return {
          ciphertext: ciphertextBase64,
          nonce: 'kms',
          authTag: 'kms',
          mode: 'kms',
          kmsKeyId: this.kmsKeyId,
        };
      } catch (err) {
        logger.error('AWS KMS wrapKey operation failed', { error: err.message });
        throw new CryptographicError(`AWS KMS Key wrapping failed: ${err.message}`);
      }
    }

    // 2. Local AES-256-GCM authenticated wrap
    try {
      const nonce = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, nonce);
      const encryptedDek = Buffer.concat([cipher.update(dek), cipher.final()]);
      const authTag = cipher.getAuthTag();

      return {
        ciphertext: encryptedDek.toString('hex'),
        nonce: nonce.toString('hex'),
        authTag: authTag.toString('hex'),
        mode: 'local',
      };
    } catch (err) {
      logger.error('Failed to wrap DEK locally', { error: err.message });
      throw new CryptographicError('Key wrapping operation failed.');
    }
  }

  /**
   * Unwrap (decrypt) a wrapped DEK.
   * If wrappedKey.mode is 'kms', decrypts using AWS KMS (kms:Decrypt).
   * Otherwise, decrypts using local AES-256-GCM authenticated decipher.
   *
   * @param {{ ciphertext: string, nonce: string, authTag: string, mode?: string, kmsKeyId?: string }} wrappedKey
   * @returns {Promise<Buffer>} The decrypted 32-byte DEK Buffer
   */
  async unwrapKey(wrappedKey) {
    if (!wrappedKey || !wrappedKey.ciphertext) {
      throw new CryptographicError('Invalid wrapped key structure. Missing required ciphertext.');
    }

    // 1. AWS KMS Hardware HSM Unwrap
    if (wrappedKey.mode === 'kms' || wrappedKey.nonce === 'kms') {
      if (!this.kmsClient) {
        this._initKmsClient();
      }

      try {
        const command = new DecryptCommand({
          CiphertextBlob: Buffer.from(wrappedKey.ciphertext, 'base64'),
          KeyId: wrappedKey.kmsKeyId || this.kmsKeyId || undefined,
        });
        const response = await this.kmsClient.send(command);
        const dek = Buffer.from(response.Plaintext);

        if (dek.length !== 32) {
          throw new CryptographicError('Unwrapped KMS DEK has unexpected length.');
        }

        return dek;
      } catch (err) {
        logger.security('AWS KMS DEK unwrap failed - access denied or corrupted ciphertext', { error: err.message });
        throw new CryptographicError(`AWS KMS DEK unwrap failed: ${err.message}`);
      }
    }

    // 2. Local AES-256-GCM authenticated unwrap
    if (!wrappedKey.nonce || !wrappedKey.authTag) {
      throw new CryptographicError('Invalid wrapped key structure. Missing required nonce or authTag for local unwrap.');
    }

    try {
      const nonce = Buffer.from(wrappedKey.nonce, 'hex');
      const authTag = Buffer.from(wrappedKey.authTag, 'hex');
      const ciphertext = Buffer.from(wrappedKey.ciphertext, 'hex');

      if (nonce.length !== 12 || authTag.length !== 16) {
        throw new CryptographicError('Invalid wrapped key parameters: nonce must be 12 bytes and authTag 16 bytes.');
      }

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, nonce);
      decipher.setAuthTag(authTag);

      const dek = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      if (dek.length !== 32) {
        throw new CryptographicError('Unwrapped key has unexpected length.');
      }

      return dek;
    } catch (err) {
      logger.security('DEK unwrap failed - potential tampering or master key mismatch', { error: err.message });
      throw new CryptographicError('Failed to unwrap encryption key. Authentication tag mismatch or corrupted key envelope.');
    }
  }
}

module.exports = new KeyManagementService();
