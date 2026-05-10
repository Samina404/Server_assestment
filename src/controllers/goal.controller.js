const prisma = require('../utils/prisma');
const { logAudit } = require('../utils/audit');

const createGoal = async (req, res) => {
  try {
    const { title, dueDate, workspaceId } = req.body;
    const ownerId = req.user.userId;

    if (!title || !workspaceId) {
      return res.status(400).json({ message: 'Title and workspaceId are required' });
    }

    // Verify user is in workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: ownerId, workspaceId } }
    });

    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this workspace' });
    }

    const goal = await prisma.goal.create({
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        ownerId,
        workspaceId
      }
    });

    if (req.io) {
      req.io.to(`workspace_${workspaceId}`).emit('new_goal', goal);
    }

    await logAudit({
      action: 'CREATE_GOAL',
      entityType: 'GOAL',
      entityId: goal.id,
      details: `Goal '${title}' created`,
      userId: ownerId,
      workspaceId
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error('Create Goal Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getGoalsByWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    // Verify membership
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } }
    });

    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this workspace' });
    }

    const goals = await prisma.goal.findMany({
      where: { workspaceId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        milestones: true
      }
    });

    res.status(200).json(goals);
  } catch (error) {
    console.error('Get Goals Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const { title, status, dueDate } = req.body;

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    // Assuming any workspace member can update goals for simplicity, or we can restrict to owner/admin
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        title,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined
      }
    });

    if (req.io) {
      req.io.to(`workspace_${updatedGoal.workspaceId}`).emit('goal_update', updatedGoal);
    }

    res.status(200).json(updatedGoal);
  } catch (error) {
    console.error('Update Goal Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteGoal = async (req, res) => {
  try {
    const { goalId } = req.params;

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    await prisma.goal.delete({ where: { id: goalId } });

    res.status(200).json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete Goal Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createGoal,
  getGoalsByWorkspace,
  updateGoal,
  deleteGoal
};
