const express = require('express');
const { getWorkspaceAnalytics, exportWorkspaceData } = require('../controllers/analytics.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get('/workspace/:workspaceId', getWorkspaceAnalytics);
router.get('/workspace/:workspaceId/export', exportWorkspaceData);

module.exports = router;
