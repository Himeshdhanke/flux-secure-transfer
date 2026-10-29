const Share = require('../models/Share');
const Document = require('../models/Document');
const { generateToken, hashToken } = require('../utils/cryptoUtils');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class ShareService {
  /**
   * Create a new recipient-restricted share link.
   * Generates a 32-byte URL-safe token. Returns the raw token ONCE to the creator.
   * Only the SHA-256 hash of the token is saved to the database.
   * 
   * @param {object} params
   * @param {string} params.documentId
   * @param {string} [params.ownerSub]
   * @param {string} [params.ownerEmail]
   * @param {string} params.recipientEmail
   * @param {number} params.expiryHours
   * @param {number} [params.maxViewSessions]
   * @returns {Promise<{ share: object, rawToken: string }>}
   */
  async createShare({ documentId, ownerSub, ownerEmail, recipientEmail, expiryHours = 24, maxViewSessions = null }) {
    const query = { _id: documentId };
    const normalizedOwnerEmail = ownerEmail ? ownerEmail.toLowerCase().trim() : null;

    if (ownerSub && normalizedOwnerEmail) {
      query.$or = [{ ownerSub }, { ownerEmail: normalizedOwnerEmail }];
    } else if (ownerSub) {
      query.ownerSub = ownerSub;
    } else if (normalizedOwnerEmail) {
      query.ownerEmail = normalizedOwnerEmail;
    }

    const document = await Document.findOne(query);
    if (!document) {
      throw new NotFoundError('Document not found or you do not have permission to share it.');
    }

    if (!recipientEmail || typeof recipientEmail !== 'string') {
      throw new ValidationError('A valid recipient email is required for restricted sharing.');
    }

    const normalizedEmail = recipientEmail.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new ValidationError('Invalid recipient email format.');
    }

    // Expiry calculation in UTC
    const hours = Math.max(1, Math.min(parseInt(expiryHours, 10) || 24, 720)); // Between 1 hour and 30 days
    const expiresAt = new Date(Date.now() + hours * 3600 * 1000);

    // Generate cryptographically random 32-byte token
    const rawToken = generateToken(32);
    // SHA-256 hash
    const tokenHash = hashToken(rawToken);

    const share = await Share.create({
      documentId: document._id,
      ownerSub: document.ownerSub || ownerSub,
      ownerEmail: document.ownerEmail || normalizedOwnerEmail,
      tokenHash,
      recipientEmail: normalizedEmail,
      expiresAt,
      maxViewSessions: maxViewSessions ? parseInt(maxViewSessions, 10) : null,
      protectedViewingRequired: true,
      allowDownload: false,
    });

    logger.info('Share link created', {
      shareId: share._id,
      documentId: document._id,
      recipientEmail: normalizedEmail,
      expiresAt: expiresAt.toISOString(),
      maxViewSessions,
    });

    return {
      share,
      rawToken,
    };
  }

  /**
   * Look up a share record by its raw token (via SHA-256 hash).
   * @param {string} rawToken
   * @returns {Promise<object>} Share document populated with Document
   */
  async getShareByToken(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new ValidationError('Invalid share token.');
    }

    const tokenHash = hashToken(rawToken);
    const share = await Share.findOne({ tokenHash }).populate('documentId');
    if (!share) {
      throw new NotFoundError('Invalid share link or link does not exist.');
    }

    return share;
  }

  /**
   * List all shares created by a document owner.
   * @param {string} ownerSub
   * @param {string} [ownerEmail]
   * @returns {Promise<Array>}
   */
  async listSharesByOwner(ownerSub, ownerEmail) {
    const query = {};
    const normalizedEmail = ownerEmail ? ownerEmail.toLowerCase().trim() : null;
    if (ownerSub && normalizedEmail) {
      query.$or = [{ ownerSub }, { ownerEmail: normalizedEmail }];
    } else if (ownerSub) {
      query.ownerSub = ownerSub;
    } else if (normalizedEmail) {
      query.ownerEmail = normalizedEmail;
    }

    return Share.find(query)
      .populate('documentId', 'originalFilename sizeBytes pageCount createdAt')
      .sort({ createdAt: -1 });
  }

  /**
   * Revoke an active share immediately.
   * @param {string} shareId
   * @param {string} ownerSub
   * @param {string} [ownerEmail]
   * @returns {Promise<object>}
   */
  async revokeShare(shareId, ownerSub, ownerEmail) {
    const query = { _id: shareId };
    const normalizedEmail = ownerEmail ? ownerEmail.toLowerCase().trim() : null;
    if (ownerSub && normalizedEmail) {
      query.$or = [{ ownerSub }, { ownerEmail: normalizedEmail }];
    } else if (ownerSub) {
      query.ownerSub = ownerSub;
    } else if (normalizedEmail) {
      query.ownerEmail = normalizedEmail;
    }

    const share = await Share.findOne(query);
    if (!share) {
      throw new NotFoundError('Share not found or you do not have permission to revoke it.');
    }

    if (share.revokedAt) {
      return share; // Already revoked
    }

    share.revokedAt = new Date();
    await share.save();

    logger.security('Share revoked by owner', { shareId: share._id, ownerSub, ownerEmail });
    return share;
  }

  /**
   * List active shares received by a verified recipient email.
   * @param {string} recipientEmail
   * @returns {Promise<Array>}
   */
  async listSharesForRecipient(recipientEmail) {
    if (!recipientEmail) return [];
    const normalizedEmail = recipientEmail.toLowerCase().trim();

    return Share.find({
      recipientEmail: normalizedEmail,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .populate('documentId', 'originalFilename sizeBytes pageCount createdAt storageKey')
      .sort({ createdAt: -1 });
  }
}

module.exports = new ShareService();
