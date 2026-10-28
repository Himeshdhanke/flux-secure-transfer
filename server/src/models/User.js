const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  cognitoSub: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    trim: true,
    default: '',
  },
  emailVerified: {
    type: Boolean,
    default: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  // Used only for local development authentication when AWS Cognito is not active
  passwordHash: {
    type: String,
    select: false,
  },
  authProvider: {
    type: String,
    enum: ['cognito', 'local'],
    default: 'cognito',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.index({ email: 1, authProvider: 1 });

module.exports = mongoose.model('User', userSchema);
