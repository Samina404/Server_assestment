const express = require('express');
const { getAuditLogs, exportAuditLogs } = require('../controllers/audit.controller');
const { protect } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/rbac.middleware');

const router = express.Router({ mergeParams: true });

router.use(protect);

// Only admins can view and export audit logs
router.get('/workspace/:workspaceId', checkPermission('VIEW_AUDIT_LOGS'), getAuditLogs);
router.get('/workspace/:workspaceId/export', checkPermission('VIEW_AUDIT_LOGS'), exportAuditLogs);

module.exports = router;
