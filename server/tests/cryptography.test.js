const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const encryptionService = require('../src/services/encryptionService');
const keyManagementService = require('../src/services/keyManagementService');
const { CryptographicError } = require('../src/utils/errors');
const { generateToken, hashToken, timingSafeCompare } = require('../src/utils/cryptoUtils');

test('Key Management Service - Wrap and Unwrap DEK', async (t) => {
  await t.test('Successfully wraps and unwraps 32-byte DEK', async () => {
    const originalDek = crypto.randomBytes(32);
    const wrapped = await keyManagementService.wrapKey(originalDek);

    assert.ok(wrapped.ciphertext, 'Ciphertext must exist');
    assert.ok(wrapped.nonce, 'Nonce must exist');
    assert.ok(wrapped.authTag, 'AuthTag must exist');
    if (wrapped.mode === 'kms') {
      assert.equal(wrapped.mode, 'kms');
    } else {
      assert.equal(Buffer.from(wrapped.nonce, 'hex').length, 12, 'Nonce must be 12 bytes');
      assert.equal(Buffer.from(wrapped.authTag, 'hex').length, 16, 'AuthTag must be 16 bytes');
    }

    const unwrapped = await keyManagementService.unwrapKey(wrapped);
    assert.deepEqual(unwrapped, originalDek, 'Unwrapped DEK must match original');
  });

  await t.test('Fails unwrapping if ciphertext or authTag is tampered with', async () => {
    const originalDek = crypto.randomBytes(32);
    const wrapped = await keyManagementService.wrapKey(originalDek);

    // Tamper with ciphertext by flipping a byte
    const encoding = wrapped.mode === 'kms' ? 'base64' : 'hex';
    const tamperedCiphertext = Buffer.from(wrapped.ciphertext, encoding);
    tamperedCiphertext[0] ^= 0xff;

    await assert.rejects(
      async () => keyManagementService.unwrapKey({
        ...wrapped,
        ciphertext: tamperedCiphertext.toString(encoding),
      }),
      CryptographicError,
      'Must throw CryptographicError on tampered ciphertext'
    );
  });
});

test('Document Encryption - AES-256-GCM', async (t) => {
  const samplePdf = Buffer.from('%PDF-1.4 sample content for cryptographic verification testing.');

  await t.test('Encrypts plaintext and returns ciphertext, nonce, and authTag', async () => {
    const result = await encryptionService.encryptDocument(samplePdf);

    assert.ok(result.ciphertext, 'Ciphertext must be returned');
    assert.notDeepEqual(result.ciphertext, samplePdf, 'Ciphertext must differ from plaintext');
    assert.ok(result.nonce, 'Nonce must be present');
    assert.ok(result.authTag, 'AuthTag must be present');
    assert.ok(result.wrappedDek, 'Wrapped DEK must be present');
  });

  await t.test('Fresh nonce is generated for every encryption operation', async () => {
    const res1 = await encryptionService.encryptDocument(samplePdf);
    const res2 = await encryptionService.encryptDocument(samplePdf);

    assert.notEqual(res1.nonce, res2.nonce, 'Nonces must be unique for each encryption');
    assert.notEqual(res1.ciphertext.toString('hex'), res2.ciphertext.toString('hex'), 'Ciphertexts must differ due to fresh nonce');
  });

  await t.test('Successfully decrypts ciphertext with valid authentication tag', async () => {
    const encrypted = await encryptionService.encryptDocument(samplePdf);
    const decrypted = await encryptionService.decryptDocument(
      encrypted.ciphertext,
      encrypted.wrappedDek,
      encrypted.nonce,
      encrypted.authTag
    );

    assert.deepEqual(decrypted, samplePdf, 'Decrypted buffer must match original plaintext');
  });

  await t.test('Tampering with ciphertext fails authenticated decryption immediately', async () => {
    const encrypted = await encryptionService.encryptDocument(samplePdf);

    // Flip bits in ciphertext
    const tampered = Buffer.from(encrypted.ciphertext);
    tampered[10] ^= 0x5a;

    await assert.rejects(
      async () => encryptionService.decryptDocument(tampered, encrypted.wrappedDek, encrypted.nonce, encrypted.authTag),
      CryptographicError,
      'Tampered ciphertext must cause authenticated decryption to fail'
    );
  });

  await t.test('Tampering with authentication tag fails decryption immediately', async () => {
    const encrypted = await encryptionService.encryptDocument(samplePdf);

    const tamperedTag = Buffer.from(encrypted.authTag, 'hex');
    tamperedTag[0] ^= 0xff;

    await assert.rejects(
      async () => encryptionService.decryptDocument(
        encrypted.ciphertext,
        encrypted.wrappedDek,
        encrypted.nonce,
        tamperedTag.toString('hex')
      ),
      CryptographicError,
      'Invalid authentication tag must trigger CryptographicError'
    );
  });
});

test('Token Cryptography & Hashing', async (t) => {
  await t.test('Generates 32-byte URL-safe base64 tokens', () => {
    const token = generateToken(32);
    assert.ok(token.length >= 43, 'URL-safe base64 of 32 bytes should be at least 43 chars');
    assert.match(token, /^[A-Za-z0-9_-]+$/, 'Must be URL-safe without +, / or =');
  });

  await t.test('SHA-256 token hashing produces consistent hex digests', () => {
    const token = 'my-test-secure-token-12345';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64, 'SHA-256 hex string must be 64 characters');
  });

  await t.test('Timing safe comparison prevents timing attacks', () => {
    const a = 'secret-hash-comparison-value-123';
    const b = 'secret-hash-comparison-value-123';
    const c = 'secret-hash-comparison-value-999';

    assert.ok(timingSafeCompare(a, b));
    assert.equal(timingSafeCompare(a, c), false);
  });
});
