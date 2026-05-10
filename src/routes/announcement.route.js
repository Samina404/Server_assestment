const express = require('express');
const { 
  createAnnouncement, 
  getAnnouncements, 
  pinAnnouncement, 
  addComment, 
  toggleReaction 
} = require('../controllers/announcement.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.post('/', createAnnouncement);
router.get('/workspace/:workspaceId', getAnnouncements);
router.patch('/:announcementId/pin', pinAnnouncement);
router.post('/:announcementId/comments', addComment);
router.post('/:announcementId/reactions', toggleReaction);

module.exports = router;
