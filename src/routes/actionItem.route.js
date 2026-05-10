const express = require('express');
const { 
  createActionItem, 
  assignUser, 
  updateStatusAndPriority, 
  getWorkspaceItems 
} = require('../controllers/actionItem.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.post('/', createActionItem);
router.get('/workspace/:workspaceId', getWorkspaceItems);
router.patch('/:itemId/assign', assignUser);
router.patch('/:itemId', updateStatusAndPriority);

module.exports = router;
