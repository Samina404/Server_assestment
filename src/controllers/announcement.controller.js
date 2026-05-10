const prisma = require('../utils/prisma');
const { parseMentions } = require('../utils/mentions');

// Middleware helper to check if user is admin
const checkAdmin = async (userId, workspaceId) => {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } }
  });
  return membership && membership.role === 'ADMIN';
};

const createAnnouncement = async (req, res) => {
  try {
    const { workspaceId, title, content, isPinned } = req.body;
    const authorId = req.user.userId;

    const isAdmin = await checkAdmin(authorId, workspaceId);
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can create announcements' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        isPinned: isPinned || false,
        authorId,
        workspaceId
      }
    });

    if (req.io) {
      req.io.to(`workspace_${workspaceId}`).emit('new_announcement', announcement);
    }
    await parseMentions(content, workspaceId, authorId, req.io);

    res.status(201).json(announcement);
  } catch (error) {
    console.error('Create Announcement Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAnnouncements = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } }
    });
    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this workspace' });
    }

    const announcements = await prisma.announcement.findMany({
      where: { workspaceId },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        author: { select: { id: true, name: true, email: true } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' }
        },
        reactions: true
      }
    });

    res.status(200).json(announcements);
  } catch (error) {
    console.error('Get Announcements Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const pinAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { isPinned } = req.body;
    const userId = req.user.userId;

    const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } });
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    const isAdmin = await checkAdmin(userId, announcement.workspaceId);
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can pin/unpin' });

    const updated = await prisma.announcement.update({
      where: { id: announcementId },
      data: { isPinned }
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Pin Announcement Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const addComment = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { content } = req.body;
    const authorId = req.user.userId;

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId,
        announcementId
      },
      include: {
        author: { select: { id: true, name: true } }
      }
    });

    const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } });
    if (req.io && announcement) {
      req.io.to(`workspace_${announcement.workspaceId}`).emit('new_comment', comment);
      await parseMentions(content, announcement.workspaceId, authorId, req.io);
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add Comment Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const toggleReaction = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.userId;

    const existingReaction = await prisma.reaction.findUnique({
      where: {
        userId_announcementId_emoji: {
          userId,
          announcementId,
          emoji
        }
      }
    });

    if (existingReaction) {
      await prisma.reaction.delete({
        where: { id: existingReaction.id }
      });
      return res.status(200).json({ message: 'Reaction removed' });
    } else {
      const reaction = await prisma.reaction.create({
        data: {
          emoji,
          userId,
          announcementId
        }
      });
      const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } });
      if (req.io && announcement) {
        req.io.to(`workspace_${announcement.workspaceId}`).emit('reaction_added', reaction);
      }
      return res.status(201).json(reaction);
    }
  } catch (error) {
    console.error('Toggle Reaction Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  pinAnnouncement,
  addComment,
  toggleReaction
};
