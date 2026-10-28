const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true,
  },
  ownerSub: {
    type: String,
    required: true,
    index: true,
  },
  ownerEmail: {
    type: String,
    lowercase: true,
    trim: true,
    index: true,
  },
  // SHA-256 hex hash of the raw URL-safe base64 token. Raw token is never persisted.
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  recipientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
  protectedViewingRequired: {
    type: Boolean,
    default: true,
  },
  allowDownload: {
    type: Boolean,
    default: false,
  },
  maxViewSessions: {
    type: Number,
    default: null,
  },
  viewSessionCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

shareSchema.index({ ownerSub: 1, createdAt: -1 });
shareSchema.index({ recipientEmail: 1, expiresAt: 1 });

module.exports = mongoose.model('Share', shareSchema);
