const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const shareController = require('../controllers/shareController');
const { authenticate } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { validateBody, createShareSchema } = require('../middleware/validationMiddleware');

// All document management routes require authentication
router.use(authenticate);

router.post('/', upload.single('document'), documentController.uploadDocument);
router.get('/', documentController.listDocuments);
router.get('/:id', documentController.getDocument);
router.delete('/:id', documentController.deleteDocument);

// Shares sub-resource under documents
router.post('/:id/shares', validateBody(createShareSchema), shareController.createShare);

module.exports = router;
