const shareService = require('../services/shareService');
const auditService = require('../services/auditService');
const Share = require('../models/Share');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

class ShareController {
  /**
   * Create a recipient-restricted share link for an owned document.
   */
  async createShare(req, res, next) {
    try {
      const documentId = req.params.id;
      const { recipientEmail, expiryHours, maxViewSessions } = req.body;

      const { share, rawToken } = await shareService.createShare({
        documentId,
        ownerSub: req.user.cognitoSub,
        recipientEmail,
        expiryHours,
        maxViewSessions,
      });

      // Audit event
      await auditService.recordEvent({
        eventType: 'SHARE_CREATED',
        actorSub: req.user.cognitoSub,
        actorEmail: req.user.email,
        documentId: share.documentId,
        shareId: share._id,
        ipAddress: req.ip,
        details: {
          recipientEmail: share.recipientEmail,
          expiresAt: share.expiresAt,
          maxViewSessions: share.maxViewSessions,
        },
      });

      // Build the viewer share URL (using origin or fallback)
      const baseUrl = req.get('origin') || `${req.protocol}://${req.get('host')}`;
      const shareUrl = `${baseUrl}/view/${rawToken}`;

      res.status(201).json({
        success: true,
        message: 'Share link created successfully.',
        data: {
          share: {
            id: share._id,
            documentId: share.documentId,
            recipientEmail: share.recipientEmail,
            expiresAt: share.expiresAt,
            maxViewSessions: share.maxViewSessions,
            createdAt: share.createdAt,
          },
          rawToken,
          shareUrl,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List all shares created by the authenticated owner.
   */
  async listShares(req, res, next) {
    try {
      const shares = await shareService.listSharesByOwner(req.user.cognitoSub);
      res.json({
        success: true,
        data: { shares },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single share status by ID.
   */
  async getShare(req, res, next) {
    try {
      const share = await Share.findOne({
        _id: req.params.id,
        ownerSub: req.user.cognitoSub,
      }).populate('documentId', 'originalFilename sizeBytes pageCount');

      if (!share) {
        throw new NotFoundError('Share not found.');
      }

      res.json({
        success: true,
        data: { share },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Revoke an active share immediately.
   */
  async revokeShare(req, res, next) {
    try {
      const share = await shareService.revokeShare(req.params.id, req.user.cognitoSub);

      await auditService.recordEvent({
        eventType: 'SHARE_REVOKED',
        actorSub: req.user.cognitoSub,
        actorEmail: req.user.email,
        documentId: share.documentId,
        shareId: share._id,
        ipAddress: req.ip,
        details: { recipientEmail: share.recipientEmail },
      });

      res.json({
        success: true,
        message: 'Document share link has been revoked immediately.',
        data: { share },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ShareController();
