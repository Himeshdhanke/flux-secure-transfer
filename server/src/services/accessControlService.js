const Share = require('../models/Share');
const ViewSession = require('../models/ViewSession');
const { hashToken } = require('../utils/cryptoUtils');
const { ForbiddenError, NotFoundError, UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

class AccessControlService {
  /**
   * Validate full access criteria on every single view or page request.
   * Enforces zero-trust access control.
   * 
   * @param {object} params
   * @param {string} params.rawToken - Raw URL-safe share token
   * @param {object} params.user - Authenticated user object from Cognito / JWT
   * @param {string} [params.sessionId] - Active view session ID
   * @param {number} [params.pageNumber] - Requested page number
   * @returns {Promise<{ share: object, document: object, session?: object }>}
   */
  async validateAccess({ rawToken, user, sessionId = null, pageNumber = null }) {
    if (!rawToken) {
      throw new ForbiddenError('Missing share token.', 'TOKEN_MISSING');
    }

    if (!user || !user.email) {
      throw new UnauthorizedError('Authentication required to access protected document.', 'AUTH_REQUIRED');
    }

    const tokenHash = hashToken(rawToken);
    const share = await Share.findOne({ tokenHash }).populate('documentId');

    if (!share) {
      throw new NotFoundError('Document share not found or invalid token.', 'SHARE_NOT_FOUND');
    }

    const document = share.documentId;
    if (!document) {
      throw new NotFoundError('Associated document has been permanently deleted.', 'DOCUMENT_DELETED');
    }

    // 1. Immediate Revocation Check
    if (share.revokedAt) {
      logger.security('Access denied: Share link is revoked', {
        shareId: share._id,
        userEmail: user.email,
        revokedAt: share.revokedAt,
      });
      throw new ForbiddenError('This document share has been revoked by the owner.', 'REVOKED');
    }

    // 2. Strict UTC Expiry Check
    const now = new Date();
    if (now > share.expiresAt) {
      logger.security('Access denied: Share link has expired', {
        shareId: share._id,
        userEmail: user.email,
        expiresAt: share.expiresAt,
        now,
      });
      throw new ForbiddenError('This document share link has expired.', 'EXPIRED');
    }

    // 3. Recipient Identity Restriction Check (Allow authorized recipient OR document owner)
    const normalizedUserEmail = user.email.toLowerCase().trim();
    const normalizedRecipientEmail = share.recipientEmail.toLowerCase().trim();
    const isOwner = user.cognitoSub === share.ownerSub || (document.ownerEmail && normalizedUserEmail === document.ownerEmail.toLowerCase().trim());

    if (!isOwner && normalizedUserEmail !== normalizedRecipientEmail) {
      logger.security('Access denied: Recipient email mismatch', {
        shareId: share._id,
        attemptedBy: normalizedUserEmail,
        authorizedRecipient: normalizedRecipientEmail,
      });
      throw new ForbiddenError(
        `Access denied. You are currently signed in as ${normalizedUserEmail}, but this protected document is not shared with your account.`,
        'UNAUTHORIZED_RECIPIENT'
      );
    }

    // 4. Session Validation (if sessionId provided)
    let session = null;
    if (sessionId) {
      session = await ViewSession.findOne({
        _id: sessionId,
        shareId: share._id,
        recipientSub: user.cognitoSub,
        status: 'active',
      });

      if (!session) {
        throw new ForbiddenError('Viewing session is invalid, expired, or was terminated.', 'INVALID_SESSION');
      }

      // Update last activity timestamp
      session.lastActivityAt = new Date();
      await session.save();
    }

    // 5. Page Range Validation
    if (pageNumber !== null && pageNumber !== undefined) {
      const pageNum = parseInt(pageNumber, 10);
      if (isNaN(pageNum) || pageNum < 1 || pageNum > document.pageCount) {
        throw new ForbiddenError(`Requested page ${pageNumber} is out of bounds (1-${document.pageCount}).`, 'INVALID_PAGE');
      }
    }

    return { share, document, session };
  }

  /**
   * Start a new viewing session with concurrency/session limits.
   * @param {object} share
   * @param {object} user
   * @param {string} ipAddress
   * @param {string} userAgent
   * @returns {Promise<object>}
   */
  async createViewSession(share, user, ipAddress = '', userAgent = '') {
    // Check if this user already has an active or previous session on this share
    let existingSession = await ViewSession.findOne({
      shareId: share._id,
      recipientSub: user.cognitoSub,
    }).sort({ startedAt: -1 });

    if (existingSession && (existingSession.status === 'active' || existingSession.status === 'closed')) {
      existingSession.status = 'active';
      existingSession.lastActivityAt = new Date();
      await existingSession.save();
      return existingSession;
    }

    // Check max view sessions limit for new sessions
    if (share.maxViewSessions && share.viewSessionCount >= share.maxViewSessions) {
      throw new ForbiddenError(
        `This share link has reached its maximum allowed viewing sessions (${share.maxViewSessions}).`,
        'MAX_SESSIONS_EXCEEDED'
      );
    }

    // Create session and atomically increment count
    const session = await ViewSession.create({
      shareId: share._id,
      recipientSub: user.cognitoSub,
      recipientEmail: user.email.toLowerCase().trim(),
      startedAt: new Date(),
      lastActivityAt: new Date(),
      status: 'active',
      ipAddress,
      userAgent,
    });

    await Share.findByIdAndUpdate(share._id, { $inc: { viewSessionCount: 1 } });

    logger.info('New view session started', {
      sessionId: session._id,
      shareId: share._id,
      recipient: user.email,
    });

    return session;
  }

  /**
   * Close a viewing session.
   * @param {string} sessionId
   * @param {string} userSub
   */
  async closeViewSession(sessionId, userSub) {
    const session = await ViewSession.findOne({ _id: sessionId, recipientSub: userSub, status: 'active' });
    if (session) {
      session.status = 'closed';
      session.endedAt = new Date();
      await session.save();
      logger.info('View session closed', { sessionId });
    }
  }
}

module.exports = new AccessControlService();
