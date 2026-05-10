const prisma = require('../utils/prisma');

const createActionItem = async (req, res) => {
  try {
    const { workspaceId, title, description, priority, goalId, assigneeId } = req.body;
    const creatorId = req.user.userId;

    if (!workspaceId || !title) {
      return res.status(400).json({ message: 'workspaceId and title are required' });
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: creatorId, workspaceId } }
    });
    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this workspace' });
    }

    const actionItem = await prisma.actionItem.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        creatorId,
        workspaceId,
        goalId: goalId || null,
        assigneeId: assigneeId || null
      }
    });

    res.status(201).json(actionItem);
  } catch (error) {
    console.error('Create Action Item Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const assignUser = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { assigneeId } = req.body; // Can be null to unassign

    const item = await prisma.actionItem.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ message: 'Action item not found' });

    const updatedItem = await prisma.actionItem.update({
      where: { id: itemId },
      data: { assigneeId }
    });

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Assign User Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateStatusAndPriority = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { status, priority, goalId } = req.body;

    const item = await prisma.actionItem.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ message: 'Action item not found' });

    const dataToUpdate = {};
    if (status) dataToUpdate.status = status;
    if (priority) dataToUpdate.priority = priority;
    if (goalId !== undefined) dataToUpdate.goalId = goalId; // allow linking/unlinking

    const updatedItem = await prisma.actionItem.update({
      where: { id: itemId },
      data: dataToUpdate
    });

    if (req.io && status) {
      req.io.to(`workspace_${updatedItem.workspaceId}`).emit('status_changed', updatedItem);
    }

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Update Status/Priority Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Fetch items (supports Kanban / List views by filtering sorting client-side or passing queries)
const getWorkspaceItems = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { view } = req.query; // 'kanban' or 'list'
    const userId = req.user.userId;

    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } }
    });
    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this workspace' });
    }

    const items = await prisma.actionItem.findMany({
      where: { workspaceId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        goal: { select: { id: true, title: true } }
      },
      orderBy: view === 'kanban' 
        ? [ { status: 'asc' }, { priority: 'desc' } ] 
        : [ { createdAt: 'desc' } ] // list view
    });

    // If kanban view requested, we can group them here or let the client group them
    if (view === 'kanban') {
      const grouped = {
        TODO: items.filter(i => i.status === 'TODO'),
        IN_PROGRESS: items.filter(i => i.status === 'IN_PROGRESS'),
        IN_REVIEW: items.filter(i => i.status === 'IN_REVIEW'),
        DONE: items.filter(i => i.status === 'DONE'),
      };
      return res.status(200).json(grouped);
    }

    // Default to array for list view
    res.status(200).json(items);
  } catch (error) {
    console.error('Get Workspace Items Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createActionItem,
  assignUser,
  updateStatusAndPriority,
  getWorkspaceItems
};
