const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

class AuditService {
  /**
   * Record a security or document lifecycle audit event.
   * Persists to MongoDB AuditLog and forwards to structured logger / CloudWatch.
   * 
   * @param {object} params
   * @param {string} params.eventType - Event enum code
   * @param {string} [params.actorSub] - Cognito subject of actor (who performed action)
   * @param {string} [params.actorEmail] - Email of actor
   * @param {string} [params.ownerSub] - Cognito subject of document owner (who owns the asset)
   * @param {string} [params.ownerEmail] - Email of document owner
   * @param {string} [params.documentId] - Document ObjectId
   * @param {string} [params.shareId] - Share ObjectId
   * @param {string} [params.ipAddress] - Request IP
   * @param {object} [params.details] - Non-sensitive metadata details
   */
  async recordEvent({
    eventType,
    actorSub = null,
    actorEmail = null,
    ownerSub = null,
    ownerEmail = null,
    documentId = null,
    shareId = null,
    ipAddress = null,
    details = {},
  }) {
    let resolvedOwnerSub = ownerSub;
    let resolvedOwnerEmail = ownerEmail ? ownerEmail.toLowerCase().trim() : null;

    // Auto-resolve owner from Share if not provided
    if (!resolvedOwnerSub && shareId) {
      try {
        const Share = require('../models/Share');
        const s = await Share.findById(shareId, 'ownerSub ownerEmail documentId').lean();
        if (s) {
          resolvedOwnerSub = s.ownerSub;
          resolvedOwnerEmail = s.ownerEmail ? s.ownerEmail.toLowerCase().trim() : null;
          if (!documentId && s.documentId) documentId = s.documentId;
        }
      } catch (_) {}
    }

    // Auto-resolve owner from Document if not provided
    if (!resolvedOwnerSub && documentId) {
      try {
        const Document = require('../models/Document');
        const d = await Document.findById(documentId, 'ownerSub ownerEmail').lean();
        if (d) {
          resolvedOwnerSub = d.ownerSub;
          resolvedOwnerEmail = d.ownerEmail ? d.ownerEmail.toLowerCase().trim() : null;
        }
      } catch (_) {}
    }

    // Default to actor if no owner resolved (e.g. for uploads where actor IS the owner)
    if (!resolvedOwnerSub && actorSub) {
      resolvedOwnerSub = actorSub;
      resolvedOwnerEmail = actorEmail ? actorEmail.toLowerCase().trim() : null;
    }

    // Sanitize details to guarantee no secrets, tokens, or raw keys are logged
    const safeDetails = logger.sanitize(details);

    try {
      const logEntry = await AuditLog.create({
        eventType,
        actorSub,
        actorEmail: actorEmail ? actorEmail.toLowerCase().trim() : null,
        ownerSub: resolvedOwnerSub,
        ownerEmail: resolvedOwnerEmail,
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
        ownerSub: resolvedOwnerSub,
        ownerEmail: resolvedOwnerEmail,
        documentId,
        shareId,
        ipAddress,
        details: safeDetails,
      });

      return logEntry;
    } catch (err) {
      logger.error('Failed to persist audit log entry', { error: err.message, eventType });
      return null;
    }
  }

  /**
   * Retrieve recent audit activity for a document owner.
   * Telemetry and security violation incidents are delivered to the document OWNER (Sender).
   * 
   * @param {string} ownerSub - Cognito sub of user requesting activity
   * @param {string} [ownerEmail] - Email of user requesting activity
   * @param {number} [limit] - Max events to return
   */
  async getOwnerActivity(ownerSub, ownerEmail = null, limit = 50) {
    const normalizedEmail = ownerEmail ? ownerEmail.toLowerCase().trim() : null;
    const Document = require('../models/Document');
    const Share = require('../models/Share');

    // Retrieve all document and share IDs owned by this user
    const [userDocs, userShares] = await Promise.all([
      Document.find(
        ownerSub && normalizedEmail
          ? { $or: [{ ownerSub }, { ownerEmail: normalizedEmail }] }
          : ownerSub
          ? { ownerSub }
          : { ownerEmail: normalizedEmail },
        '_id'
      ).lean().catch(() => []),
      Share.find(
        ownerSub && normalizedEmail
          ? { $or: [{ ownerSub }, { ownerEmail: normalizedEmail }] }
          : ownerSub
          ? { ownerSub }
          : { ownerEmail: normalizedEmail },
        '_id'
      ).lean().catch(() => []),
    ]);

    const docIds = userDocs.map((d) => d._id);
    const shareIds = userShares.map((s) => s._id);

    // Build the query:
    // 1. All events where this user is explicitly the OWNER of the document/share.
    // 2. All events targeting any document or share owned by this user.
    // 3. Lifecycle actions this user performed themselves (uploads, share creation, revocations).
    // Security violations are NEVER shown to the violator (receiver), only to the asset owner (sender).
    const orConditions = [];

    if (ownerSub) {
      orConditions.push({ ownerSub });
    }
    if (normalizedEmail) {
      orConditions.push({ ownerEmail: normalizedEmail });
    }
    if (docIds.length > 0) {
      orConditions.push({ documentId: { $in: docIds } });
    }
    if (shareIds.length > 0) {
      orConditions.push({ shareId: { $in: shareIds } });
    }

    // Direct actions the user performed themselves on their own assets
    if (ownerSub) {
      orConditions.push({
        actorSub: ownerSub,
        eventType: { $in: ['DOCUMENT_UPLOADED', 'DOCUMENT_DELETED', 'SHARE_CREATED', 'SHARE_REVOKED'] },
      });
    }
    if (normalizedEmail) {
      orConditions.push({
        actorEmail: normalizedEmail,
        eventType: { $in: ['DOCUMENT_UPLOADED', 'DOCUMENT_DELETED', 'SHARE_CREATED', 'SHARE_REVOKED'] },
      });
    }

    const query = orConditions.length > 0 ? { $or: orConditions } : { ownerSub: '__none__' };

    return AuditLog.find(query)
      .populate('documentId', 'originalFilename')
      .populate('shareId', 'recipientEmail')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

module.exports = new AuditService();
