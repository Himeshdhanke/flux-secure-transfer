const express = require('express');
const router = express.Router();
const auditService = require('../services/auditService');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const logs = await auditService.getOwnerActivity(req.user.cognitoSub, req.user.email, limit);
    res.json({
      success: true,
      data: { logs },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
