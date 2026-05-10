const prisma = require('../utils/prisma');

const addMilestone = async (req, res) => {
  try {
    const { goalId, title } = req.body;

    if (!goalId || !title) {
      return res.status(400).json({ message: 'goalId and title are required' });
    }

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const milestone = await prisma.milestone.create({
      data: {
        title,
        goalId
      }
    });

    res.status(201).json(milestone);
  } catch (error) {
    console.error('Add Milestone Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateProgress = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { progress } = req.body;

    if (progress === undefined) {
      return res.status(400).json({ message: 'progress is required' });
    }

    const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: { progress }
    });

    res.status(200).json(updatedMilestone);
  } catch (error) {
    console.error('Update Progress Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;

    const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    await prisma.milestone.delete({ where: { id: milestoneId } });

    res.status(200).json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Delete Milestone Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  addMilestone,
  updateProgress,
  deleteMilestone
};
