const crypto = require('crypto');
const { generateDek, generateNonce } = require('../utils/cryptoUtils');
const keyManagementService = require('./keyManagementService');
const { CryptographicError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Encryption Service
 * Implements AES-256-GCM authenticated encryption for documents.
 * Guarantees confidentiality, integrity, and authenticity.
 */
class EncryptionService {
  /**
   * Encrypt a plaintext document buffer.
   * 1. Generates a fresh 32-byte DEK.
   * 2. Generates a fresh 12-byte nonce.
   * 3. Encrypts using AES-256-GCM.
   * 4. Extracts the 16-byte authentication tag.
   * 5. Wraps the DEK using the master key.
   * 
   * @param {Buffer} plaintextBuffer
   * @returns {{ ciphertext: Buffer, nonce: string, authTag: string, wrappedDek: object }}
   */
  async encryptDocument(plaintextBuffer) {
    if (!Buffer.isBuffer(plaintextBuffer) || plaintextBuffer.length === 0) {
      throw new CryptographicError('Invalid document buffer for encryption.');
    }

    // 1. Fresh 32-byte Data Encryption Key (DEK)
    const dek = generateDek();

    // 2. Fresh 12-byte Nonce (Never reuse nonce with the same key)
    const nonce = generateNonce();

    try {
      // 3. Encrypt with AES-256-GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', dek, nonce);
      const ciphertext = Buffer.concat([cipher.update(plaintextBuffer), cipher.final()]);

      // 4. Extract 16-byte authentication tag
      const authTag = cipher.getAuthTag();

      // 5. Wrap the DEK with the master key (local AES-GCM or AWS KMS HSM)
      const wrappedDek = await keyManagementService.wrapKey(dek);

      // Clean raw DEK from memory reference
      dek.fill(0);

      return {
        ciphertext,
        nonce: nonce.toString('hex'),
        authTag: authTag.toString('hex'),
        wrappedDek,
      };
    } catch (err) {
      dek.fill(0);
      logger.error('Document encryption failed', { error: err.message });
      throw new CryptographicError('Document encryption failed.');
    }
  }

  /**
   * Decrypt a document ciphertext buffer in memory.
   * Verifies the authentication tag to ensure the ciphertext has not been tampered with.
   * 
   * @param {Buffer} ciphertextBuffer
   * @param {object} wrappedDek - Stored wrapped DEK structure
   * @param {string} nonceHex - Hex string of 12-byte nonce
   * @param {string} authTagHex - Hex string of 16-byte authentication tag
   * @returns {Promise<Buffer>} Plaintext PDF buffer
   */
  async decryptDocument(ciphertextBuffer, wrappedDek, nonceHex, authTagHex) {
    if (!Buffer.isBuffer(ciphertextBuffer) || ciphertextBuffer.length === 0) {
      throw new CryptographicError('Invalid ciphertext buffer.');
    }

    if (!nonceHex || !authTagHex || !wrappedDek) {
      throw new CryptographicError('Missing cryptographic parameters for decryption.');
    }

    // 1. Unwrap DEK with Master Key or AWS KMS HSM
    const dek = await keyManagementService.unwrapKey(wrappedDek);

    try {
      const nonce = Buffer.from(nonceHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      if (nonce.length !== 12) {
        throw new CryptographicError('Invalid nonce length: expected 12 bytes.');
      }
      if (authTag.length !== 16) {
        throw new CryptographicError('Invalid authentication tag length: expected 16 bytes.');
      }

      // 2. Decrypt and verify tag with AES-256-GCM
      const decipher = crypto.createDecipheriv('aes-256-gcm', dek, nonce);
      decipher.setAuthTag(authTag);

      const plaintext = Buffer.concat([decipher.update(ciphertextBuffer), decipher.final()]);

      // Zeroize DEK
      dek.fill(0);

      return plaintext;
    } catch (err) {
      dek.fill(0);
      logger.security('Document decryption failed: integrity check failed or tampered data', {
        error: err.message,
      });
      throw new CryptographicError('Document decryption failed: Authenticated tag check failed or data was tampered with.');
    }
  }
}

module.exports = new EncryptionService();
