const crypto = require('crypto');

/**
 * Generate a cryptographically secure random token (URL-safe base64).
 * @param {number} bytes - Number of random bytes (default 32)
 * @returns {string} URL-safe base64 string
 */
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Compute SHA-256 hash of a string or buffer.
 * Raw share tokens are never stored in the database, only their SHA-256 hash.
 * @param {string|Buffer} data
 * @returns {string} Hex-encoded SHA-256 digest
 */
function hashToken(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a cryptographically secure random 256-bit encryption key.
 * @returns {Buffer} 32-byte key buffer
 */
function generateDek() {
  return crypto.randomBytes(32);
}

/**
 * Generate a fresh 96-bit (12-byte) initialization vector/nonce for AES-256-GCM.
 * Nonces must NEVER be reused with the same key.
 * @returns {Buffer} 12-byte nonce buffer
 */
function generateNonce() {
  return crypto.randomBytes(12);
}

/**
 * Timing-safe string comparison to mitigate side-channel timing attacks.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = {
  generateToken,
  hashToken,
  generateDek,
  generateNonce,
  timingSafeCompare,
};
