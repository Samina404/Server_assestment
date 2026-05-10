const express = require('express');
const { 
  createGoal, 
  getGoalsByWorkspace, 
  updateGoal, 
  deleteGoal 
} = require('../controllers/goal.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router({ mergeParams: true }); // Enable access to params from parent router if needed

router.use(protect);

router.post('/', createGoal);
router.get('/workspace/:workspaceId', getGoalsByWorkspace);
router.put('/:goalId', updateGoal);
router.delete('/:goalId', deleteGoal);

module.exports = router;
