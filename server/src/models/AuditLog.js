const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorSub: {
    type: String,
    default: null,
    index: true,
  },
  actorEmail: {
    type: String,
    default: null,
  },
  ownerSub: {
    type: String,
    default: null,
    index: true,
  },
  ownerEmail: {
    type: String,
    default: null,
    lowercase: true,
    trim: true,
    index: true,
  },
  shareId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Share',
    default: null,
    index: true,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    default: null,
    index: true,
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'DOCUMENT_UPLOADED',
      'DOCUMENT_DELETED',
      'SHARE_CREATED',
      'SHARE_REVOKED',
      'SHARE_VIEW_ATTEMPT',
      'SHARE_VIEW_SUCCESS',
      'SHARE_VIEW_DENIED_UNAUTHORIZED',
      'SHARE_VIEW_DENIED_EXPIRED',
      'SHARE_VIEW_DENIED_REVOKED',
      'PAGE_RENDERED',
      'SECURITY_VIOLATION',
    ],
    index: true,
  },
  ipAddress: {
    type: String,
    default: null,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
