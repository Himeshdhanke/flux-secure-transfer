const accessControlService = require('../services/accessControlService');
const s3StorageService = require('../services/s3StorageService');
const encryptionService = require('../services/encryptionService');
const pdfRenderingService = require('../services/pdfRenderingService');
const watermarkService = require('../services/watermarkService');
const auditService = require('../services/auditService');
const Share = require('../models/Share');
const { hashToken } = require('../utils/cryptoUtils');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

class ViewController {
  /**
   * Pre-flight share inspection endpoint.
   * Returns document metadata and authorization requirements before session creation.
   */
  async getShareInfo(req, res, next) {
    try {
      const rawToken = req.params.token;
      const tokenHash = hashToken(rawToken);

      const share = await Share.findOne({ tokenHash }).populate('documentId');
      if (!share) {
        throw new NotFoundError('Shared document link not found or invalid.', 'INVALID_TOKEN');
      }

      const document = share.documentId;
      if (!document) {
        throw new NotFoundError('The document associated with this share has been deleted.', 'DOCUMENT_DELETED');
      }

      const isRevoked = Boolean(share.revokedAt);
      const isExpired = new Date() > share.expiresAt;

      // Mask recipient email for public privacy preview (e.g. b***b@domain.com)
      const emailParts = share.recipientEmail.split('@');
      const maskedEmail = emailParts[0].length > 2
        ? `${emailParts[0][0]}***${emailParts[0].slice(-1)}@${emailParts[1]}`
        : `${emailParts[0]}***@${emailParts[1]}`;

      res.json({
        success: true,
        data: {
          originalFilename: document.originalFilename,
          pageCount: document.pageCount,
          recipientEmail: maskedEmail,
          rawRecipientEmail: share.recipientEmail, // For matching logic
          expiresAt: share.expiresAt,
          isExpired,
          isRevoked,
          protectedViewingRequired: share.protectedViewingRequired,
          allowDownload: false,
          maxViewSessions: share.maxViewSessions,
          viewSessionCount: share.viewSessionCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Authenticate and initialize a protected viewing session.
   */
  async createSession(req, res, next) {
    try {
      const rawToken = req.params.token;

      // Validate access criteria
      const { share, document } = await accessControlService.validateAccess({
        rawToken,
        user: req.user,
      });

      // Create session
      const session = await accessControlService.createViewSession(
        share,
        req.user,
        req.ip,
        req.get('user-agent') || ''
      );

      // Audit event
      await auditService.recordEvent({
        eventType: 'SHARE_VIEW_SUCCESS',
        actorSub: req.user.cognitoSub,
        actorEmail: req.user.email,
        documentId: document._id,
        shareId: share._id,
        ipAddress: req.ip,
        details: {
          sessionId: session._id,
          pageCount: document.pageCount,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          sessionId: session._id,
          documentId: document._id,
          originalFilename: document.originalFilename,
          pageCount: document.pageCount,
          recipientEmail: share.recipientEmail,
          expiresAt: share.expiresAt,
        },
      });
    } catch (err) {
      // Audit denial event
      const tokenHash = hashToken(req.params.token || '');
      const share = await Share.findOne({ tokenHash }).catch(() => null);

      let eventType = 'SHARE_VIEW_DENIED_UNAUTHORIZED';
      if (err.code === 'EXPIRED') eventType = 'SHARE_VIEW_DENIED_EXPIRED';
      if (err.code === 'REVOKED') eventType = 'SHARE_VIEW_DENIED_REVOKED';

      await auditService.recordEvent({
        eventType,
        actorSub: req.user ? req.user.cognitoSub : null,
        actorEmail: req.user ? req.user.email : null,
        documentId: share ? share.documentId : null,
        shareId: share ? share._id : null,
        ipAddress: req.ip,
        details: { reason: err.message, errorCode: err.code },
      }).catch(() => {});

      next(err);
    }
  }

  /**
   * Render and deliver a single watermarked page image.
   * Original PDF is decrypted into memory, rendered to image, watermarked, and sent.
   * Original PDF is NEVER sent to the client.
   */
  async renderPage(req, res, next) {
    let plaintextBuffer = null;
    try {
      const rawToken = req.params.token;
      const pageNumber = parseInt(req.params.pageNumber, 10);
      const sessionId = req.query.sessionId || req.headers['x-session-id'];

      // 1. Re-validate full authorization on EVERY page request
      const { share, document, session } = await accessControlService.validateAccess({
        rawToken,
        user: req.user,
        sessionId,
        pageNumber,
      });

      // 2. Retrieve encrypted ciphertext from storage
      const ciphertext = await s3StorageService.getEncryptedObject(document.storageKey);

      // 3. Decrypt ciphertext in memory using AES-256-GCM + authentication tag check
      plaintextBuffer = await encryptionService.decryptDocument(
        ciphertext,
        document.wrappedDek,
        document.nonce,
        document.authTag
      );

      // 4. Render requested PDF page to image buffer
      const rendered = await pdfRenderingService.renderPage(plaintextBuffer, pageNumber);

      // Clear decrypted PDF from memory immediately
      plaintextBuffer.fill(0);
      plaintextBuffer = null;

      // 5. Apply dynamic diagonal server-side watermark
      const watermarkedBuffer = await watermarkService.applyWatermark({
        imageBuffer: rendered.imageBuffer,
        width: rendered.width,
        height: rendered.height,
        senderIdentity: document.ownerEmail || document.ownerSub,
        recipientIdentity: req.user.email,
        sessionId: session ? String(session._id) : '',
        timestamp: new Date(),
      });

      // 6. Record audit event
      await auditService.recordEvent({
        eventType: 'PAGE_RENDERED',
        actorSub: req.user.cognitoSub,
        actorEmail: req.user.email,
        documentId: document._id,
        shareId: share._id,
        ipAddress: req.ip,
        details: {
          pageNumber,
          sessionId: session ? session._id : null,
        },
      });

      // 7. Send only watermarked image with strict DRM cache headers
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      return res.send(watermarkedBuffer);
    } catch (err) {
      if (plaintextBuffer && Buffer.isBuffer(plaintextBuffer)) {
        plaintextBuffer.fill(0);
      }
      next(err);
    }
  }

  /**
   * Close viewing session.
   */
  async closeSession(req, res, next) {
    try {
      const sessionId = req.params.sessionId;
      await accessControlService.closeViewSession(sessionId, req.user.cognitoSub);
      res.json({ success: true, message: 'Viewing session closed.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Log client-side DRM security event (e.g. PrintScreen attempt, focus loss, DevTools).
   */
  async recordSecurityEvent(req, res, next) {
    try {
      const rawToken = req.params.token;
      const { violationType, trigger, pageNumber } = req.body;
      const tokenHash = hashToken(rawToken || '');
      const share = await Share.findOne({ tokenHash }).catch(() => null);

      await auditService.recordEvent({
        eventType: 'SECURITY_VIOLATION',
        actorSub: req.user ? req.user.cognitoSub : null,
        actorEmail: req.user ? req.user.email : null,
        documentId: share ? share.documentId : null,
        shareId: share ? share._id : null,
        ipAddress: req.ip,
        details: {
          violationType: violationType || 'SCREENSHOT_OR_CAPTURE_ATTEMPT',
          trigger: trigger || 'PrintScreen',
          pageNumber: pageNumber || null,
          userAgent: req.headers['user-agent'] || '',
        },
      });

      res.json({ success: true, message: 'Security event logged.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ViewController();
