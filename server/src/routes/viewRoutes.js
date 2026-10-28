const express = require('express');
const router = express.Router();
const viewController = require('../controllers/viewController');
const { authenticate } = require('../middleware/authMiddleware');
const { pageViewLimiter } = require('../middleware/rateLimiter');

// Public inspection of share status before login
router.get('/shares/:token', viewController.getShareInfo);

// Protected session initialization (Requires receiver authentication)
router.post('/shares/:token/sessions', authenticate, viewController.createSession);

// Protected page rendering (Requires receiver authentication + strict zero-trust checks on each page request)
router.get('/shares/:token/pages/:pageNumber', pageViewLimiter, authenticate, viewController.renderPage);

// Close viewing session
router.post('/shares/:token/sessions/:sessionId/close', authenticate, viewController.closeSession);

// Report client-side security violation (e.g. PrintScreen attempt)
router.post('/shares/:token/security-event', authenticate, viewController.recordSecurityEvent);

module.exports = router;
