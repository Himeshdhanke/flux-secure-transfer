const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const config = require('../config/env');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

class S3StorageService {
  constructor() {
    this.mode = config.storageMode;
    this.bucket = config.aws.s3Bucket;
    this.localDir = config.storageDirectory;

    if (this.mode === 's3') {
      if (!this.bucket) {
        throw new Error('AWS_S3_BUCKET must be configured when SECURESHARE_STORAGE_MODE is "s3".');
      }
      const clientConfig = { region: config.aws.region };
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        clientConfig.credentials = {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        };
      }
      this.s3Client = new S3Client(clientConfig);
      logger.info(`[STORAGE] Initialized Amazon S3 storage using bucket: ${this.bucket} in region ${config.aws.region}`);
    } else {
      // Ensure local vault directory exists
      if (!fs.existsSync(this.localDir)) {
        fs.mkdirSync(this.localDir, { recursive: true });
      }
      logger.info(`[STORAGE] Initialized local encrypted vault storage in: ${this.localDir}`);
    }
  }

  /**
   * Upload encrypted document ciphertext to private storage.
   * @param {string} storageKey - Unique server-side key
   * @param {Buffer} ciphertextBuffer - Encrypted ciphertext
   * @returns {Promise<void>}
   */
  async putEncryptedObject(storageKey, ciphertextBuffer) {
    if (this.mode === 's3') {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
          Body: ciphertextBuffer,
          ContentType: 'application/octet-stream',
          // Enforce server-side KMS encryption at rest in S3 as defense-in-depth on top of application AES-GCM
          ServerSideEncryption: 'AES256',
        });
        await this.s3Client.send(command);
        logger.info('Encrypted object uploaded to S3', { storageKey });
      } catch (err) {
        logger.error('Failed to upload encrypted object to S3', { error: err.message, storageKey });
        throw new AppError('Storage service failed to store encrypted document.', 500);
      }
    } else {
      try {
        const filePath = path.join(this.localDir, storageKey);
        await fs.promises.writeFile(filePath, ciphertextBuffer);
        logger.info('Encrypted object written to local vault', { storageKey });
      } catch (err) {
        logger.error('Failed to write encrypted object to local storage', { error: err.message, storageKey });
        throw new AppError('Local storage service failed to store encrypted document.', 500);
      }
    }
  }

  /**
   * Retrieve encrypted document ciphertext from storage.
   * @param {string} storageKey
   * @returns {Promise<Buffer>}
   */
  async getEncryptedObject(storageKey) {
    if (this.mode === 's3') {
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        });
        const response = await this.s3Client.send(command);
        const chunks = [];
        for await (const chunk of response.Body) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      } catch (err) {
        logger.error('Failed to retrieve encrypted object from S3', { error: err.message, storageKey });
        throw new AppError('Encrypted document object not found or inaccessible in storage.', 404);
      }
    } else {
      try {
        let filePath = path.join(this.localDir, storageKey);
        if (!fs.existsSync(filePath)) {
          // Check parent / root storage_vault if relative path differs
          const altPath1 = path.resolve(this.localDir, '..', 'storage_vault', storageKey);
          const altPath2 = path.resolve(__dirname, '../../../storage_vault', storageKey);
          if (fs.existsSync(altPath1)) {
            filePath = altPath1;
          } else if (fs.existsSync(altPath2)) {
            filePath = altPath2;
          } else {
            throw new AppError('Encrypted document object file not found in local vault.', 404);
          }
        }
        return await fs.promises.readFile(filePath);
      } catch (err) {
        if (err instanceof AppError) throw err;
        logger.error('Failed to read encrypted object from local vault', { error: err.message, storageKey });
        throw new AppError('Failed to read encrypted document object.', 500);
      }
    }
  }

  /**
   * Delete encrypted document ciphertext from storage.
   * @param {string} storageKey
   * @returns {Promise<void>}
   */
  async deleteEncryptedObject(storageKey) {
    if (this.mode === 's3') {
      try {
        const command = new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        });
        await this.s3Client.send(command);
        logger.info('Encrypted object deleted from S3', { storageKey });
      } catch (err) {
        logger.warn('Failed to delete object from S3', { error: err.message, storageKey });
      }
    } else {
      try {
        const filePath = path.join(this.localDir, storageKey);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
          logger.info('Encrypted object deleted from local vault', { storageKey });
        }
      } catch (err) {
        logger.warn('Failed to delete local encrypted file', { error: err.message, storageKey });
      }
    }
  }
}

module.exports = new S3StorageService();
