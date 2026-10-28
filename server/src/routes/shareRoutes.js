const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', shareController.listShares);
router.get('/:id', shareController.getShare);
router.post('/:id/revoke', shareController.revokeShare);

module.exports = router;
