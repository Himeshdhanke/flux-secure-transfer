const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  ownerSub: {
    type: String,
    required: true,
    index: true,
  },
  ownerEmail: {
    type: String,
    lowercase: true,
    trim: true,
  },
  originalFilename: {
    type: String,
    required: true,
    trim: true,
  },
  storageKey: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  mimeType: {
    type: String,
    required: true,
    enum: ['application/pdf'],
    default: 'application/pdf',
  },
  sizeBytes: {
    type: Number,
    required: true,
  },
  pageCount: {
    type: Number,
    required: true,
    min: 1,
  },
  // Hex-encoded 12-byte initialization vector (nonce) for AES-256-GCM
  nonce: {
    type: String,
    required: true,
  },
  // Hex-encoded 16-byte authentication tag from AES-256-GCM
  authTag: {
    type: String,
    required: true,
  },
  // Master-key wrapped Data Encryption Key (DEK)
  // Supports both local AES-256-GCM envelope and AWS KMS hardware envelope
  wrappedDek: {
    ciphertext: { type: String, required: true },
    nonce: { type: String, default: '' },
    authTag: { type: String, default: '' },
    mode: { type: String, enum: ['local', 'kms'], default: 'local' },
    kmsKeyId: { type: String, default: '' },
  },
  keyVersion: {
    type: Number,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

documentSchema.index({ ownerSub: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
