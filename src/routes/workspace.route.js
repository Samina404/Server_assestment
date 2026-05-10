const express = require('express');
const { 
  createWorkspace, 
  getUserWorkspaces, 
  inviteMember, 
  switchWorkspace 
} = require('../controllers/workspace.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect); // All workspace routes are protected

router.post('/', createWorkspace);
router.get('/', getUserWorkspaces);
router.post('/:workspaceId/invite', inviteMember);
router.post('/:workspaceId/switch', switchWorkspace);

module.exports = router;
