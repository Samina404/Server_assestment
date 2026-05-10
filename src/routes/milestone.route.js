const express = require('express');
const { 
  addMilestone, 
  updateProgress, 
  deleteMilestone 
} = require('../controllers/milestone.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/', addMilestone);
router.patch('/:milestoneId/progress', updateProgress);
router.delete('/:milestoneId', deleteMilestone);

module.exports = router;
