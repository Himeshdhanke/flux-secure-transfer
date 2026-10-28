const mongoose = require('mongoose');

const viewSessionSchema = new mongoose.Schema({
  shareId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Share',
    required: true,
    index: true,
  },
  recipientSub: {
    type: String,
    required: true,
    index: true,
  },
  recipientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  lastActivityAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'expired'],
    default: 'active',
  },
  ipAddress: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
});

viewSessionSchema.index({ shareId: 1, recipientSub: 1, status: 1 });

module.exports = mongoose.model('ViewSession', viewSessionSchema);
