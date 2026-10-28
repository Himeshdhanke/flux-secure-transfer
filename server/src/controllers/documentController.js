const crypto = require('crypto');
const Document = require('../models/Document');
const Share = require('../models/Share');
const ViewSession = require('../models/ViewSession');
const encryptionService = require('../services/encryptionService');
const s3StorageService = require('../services/s3StorageService');
const pdfRenderingService = require('../services/pdfRenderingService');
const auditService = require('../services/auditService');
const config = require('../config/env');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

class DocumentController {
  /**
   * Upload and encrypt a new PDF document.
   * Full envelope encryption pipeline with AES-256-GCM.
   */
  async uploadDocument(req, res, next) {
    try {
      if (!req.file || !req.file.buffer) {
        throw new ValidationError('No document file was uploaded.');
      }

      const fileBuffer = req.file.buffer;
      const originalFilename = req.file.originalname || 'document.pdf';

      // 1. Validate PDF format and structure, extract page count
      const pdfMeta = await pdfRenderingService.inspectPdf(fileBuffer);
      if (pdfMeta.pageCount > config.maxPdfPages) {
        throw new ValidationError(
          `Document exceeds maximum permitted page count of ${config.maxPdfPages} pages (Document has ${pdfMeta.pageCount} pages).`
        );
      }

      // 2. Encrypt document in memory using AES-256-GCM and wrapped DEK
      const encryptionResult = await encryptionService.encryptDocument(fileBuffer);

      // 3. Generate random server-side storage key (never use original filename)
      const storageKey = `doc_${crypto.randomUUID()}.enc`;

      // 4. Upload encrypted ciphertext to storage (S3 or local encrypted vault)
      await s3StorageService.putEncryptedObject(storageKey, encryptionResult.ciphertext);

      // 5. Store metadata and envelope keys in MongoDB
      const document = await Document.create({
        ownerSub: req.user.cognitoSub,
        ownerEmail: req.user.email,
        originalFilename,
        storageKey,
        mimeType: 'application/pdf',
        sizeBytes: fileBuffer.length,
        pageCount: pdfMeta.pageCount,
        nonce: encryptionResult.nonce,
        authTag: encryptionResult.authTag,
        wrappedDek: encryptionResult.wrappedDek,
        keyVersion: 1,
      });

      // 6. Record audit event
      await auditService.recordEvent({
        eventType: 'DOCUMENT_UPLOADED',
        actorSub: req.user.cognitoSub,
        actorEmail: req.user.email,
        documentId: document._id,
        ipAddress: req.ip,
        details: {
          filename: originalFilename,
          sizeBytes: fileBuffer.length,
          pageCount: pdfMeta.pageCount,
          storageMode: config.storageMode,
        },
      });

      logger.info('Document uploaded and encrypted successfully', {
        documentId: document._id,
        ownerSub: req.user.cognitoSub,
        pageCount: pdfMeta.pageCount,
      });

      res.status(201).json({
        success: true,
        message: 'Document encrypted and saved successfully.',
        data: {
          document: {
            id: document._id,
            originalFilename: document.originalFilename,
            sizeBytes: document.sizeBytes,
            pageCount: document.pageCount,
            createdAt: document.createdAt,
            storageKey: document.storageKey,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List all documents owned by the authenticated sender.
   */
  async listDocuments(req, res, next) {
    try {
      const documents = await Document.find({ ownerSub: req.user.cognitoSub })
        .select('-wrappedDek -nonce -authTag')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: { documents },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get metadata for a specific document owned by the sender.
   */
  async getDocument(req, res, next) {
    try {
      const document = await Document.findOne({
        _id: req.params.id,
        ownerSub: req.user.cognitoSub,
      }).select('-wrappedDek -nonce -authTag');

      if (!document) {
        throw new NotFoundError('Document not found or you do not have permission to view it.');
      }

      res.json({
        success: true,
        data: { document },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete document and its encrypted storage object.
   */
  async deleteDocument(req, res, next) {
    try {
      const document = await Document.findOne({
        _id: req.params.id,
        ownerSub: req.user.cognitoSub,
      });

      if (!document) {
        throw new NotFoundError('Document not found or you do not have permission to delete it.');
      }

      // 1. Delete encrypted object from storage
      await s3StorageService.deleteEncryptedObject(document.storageKey);

      // 2. Cascade delete related shares and view sessions
      const shares = await Share.find({ documentId: document._id });
      const shareIds = shares.map(s => s._id);

      await ViewSession.deleteMany({ shareId: { $in: shareIds } });
      await Share.deleteMany({ documentId: document._id });

      // 3. Record audit event
      await auditService.recordEvent({
        eventType: 'DOCUMENT_DELETED',
        actorSub: req.user.cognitoSub,
        actorEmail: req.user.email,
        documentId: document._id,
        ipAddress: req.ip,
        details: { filename: document.originalFilename },
      });

      // 4. Delete document record
      await Document.findByIdAndDelete(document._id);

      logger.info('Document permanently deleted', { documentId: req.params.id, ownerSub: req.user.cognitoSub });

      res.json({
        success: true,
        message: 'Document and associated shares deleted permanently.',
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DocumentController();
