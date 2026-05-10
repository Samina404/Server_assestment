const prisma = require('../utils/prisma');
const { Parser } = require('json2csv');

const getWorkspaceAnalytics = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Verify membership
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: req.user.userId, workspaceId } }
    });
    if (!membership) return res.status(403).json({ message: 'Forbidden' });

    // Total goals
    const totalGoals = await prisma.goal.count({ where: { workspaceId } });

    // Completed goals
    const completedGoals = await prisma.goal.count({ where: { workspaceId, status: 'DONE' } });

    // Weekly completed tasks (action items completed in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyCompletedTasks = await prisma.actionItem.count({
      where: {
        workspaceId,
        status: 'DONE',
        updatedAt: { gte: sevenDaysAgo }
      }
    });

    // Overdue items (goals with dueDate < now and status != DONE)
    const overdueGoals = await prisma.goal.count({
      where: {
        workspaceId,
        status: { not: 'DONE' },
        dueDate: { lt: new Date() }
      }
    });

    res.status(200).json({
      totalGoals,
      completionStatistics: {
        completed: completedGoals,
        pending: totalGoals - completedGoals,
        percentage: totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100)
      },
      weeklyCompletedTasks,
      overdueItems: overdueGoals
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const exportWorkspaceData = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: req.user.userId, workspaceId } },
      include: { workspace: true }
    });
    if (!membership) return res.status(403).json({ message: 'Forbidden' });

    const actionItems = await prisma.actionItem.findMany({
      where: { workspaceId },
      include: {
        assignee: { select: { email: true } },
        goal: { select: { title: true } }
      }
    });

    const data = actionItems.map(item => ({
      ID: item.id,
      Title: item.title,
      Status: item.status,
      Priority: item.priority,
      Goal: item.goal ? item.goal.title : 'N/A',
      Assignee: item.assignee ? item.assignee.email : 'Unassigned',
      CreatedAt: item.createdAt.toISOString()
    }));

    if (data.length === 0) {
      return res.status(404).json({ message: 'No data to export' });
    }

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(`${membership.workspace.name.replace(/\s+/g, '_')}_export.csv`);
    return res.send(csv);
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getWorkspaceAnalytics,
  exportWorkspaceData
};
