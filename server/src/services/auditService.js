const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

class AuditService {
  /**
   * Record a security or document lifecycle audit event.
   * Persists to MongoDB AuditLog and forwards to structured logger / CloudWatch.
   * 
   * @param {object} params
   * @param {string} params.eventType - Event enum code
   * @param {string} [params.actorSub] - Cognito subject of actor
   * @param {string} [params.actorEmail] - Email of actor
   * @param {string} [params.documentId] - Document ObjectId
   * @param {string} [params.shareId] - Share ObjectId
   * @param {string} [params.ipAddress] - Request IP
   * @param {object} [params.details] - Non-sensitive metadata details
   */
  async recordEvent({
    eventType,
    actorSub = null,
    actorEmail = null,
    documentId = null,
    shareId = null,
    ipAddress = null,
    details = {},
  }) {
    // Sanitize details to guarantee no secrets, tokens, or raw keys are logged
    const safeDetails = logger.sanitize(details);

    try {
      const logEntry = await AuditLog.create({
        eventType,
        actorSub,
        actorEmail,
        documentId,
        shareId,
        ipAddress,
        details: safeDetails,
        createdAt: new Date(),
      });

      // Stream to structured logger / CloudWatch
      logger.info(`[AUDIT EVENT] ${eventType}`, {
        auditId: logEntry._id,
        eventType,
        actorSub,
        actorEmail,
        documentId,
        shareId,
        ipAddress,
        details: safeDetails,
      });

      return logEntry;
    } catch (err) {
      // Never crash the primary application flow if an audit log write fails
      logger.error('Failed to persist audit log entry', { error: err.message, eventType });
      return null;
    }
  }

  /**
   * Retrieve recent audit activity for an owner's documents.
   * @param {string} ownerSub
   * @param {number} limit
   */
  async getOwnerActivity(ownerSub, limit = 50) {
    return AuditLog.find({ actorSub: ownerSub })
      .populate('documentId', 'originalFilename')
      .populate('shareId', 'recipientEmail')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

module.exports = new AuditService();
