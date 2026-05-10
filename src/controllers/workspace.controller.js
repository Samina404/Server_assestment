const prisma = require('../utils/prisma');

const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.userId;

    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId,
            role: 'ADMIN'
          }
        }
      },
      include: {
        members: true
      }
    });

    res.status(201).json(workspace);
  } catch (error) {
    console.error('Create Workspace Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getUserWorkspaces = async (req, res) => {
  try {
    const userId = req.user.userId;

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    res.status(200).json(workspaces);
  } catch (error) {
    console.error('Fetch Workspaces Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const inviteMember = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email, role } = req.body; // role: ADMIN or MEMBER
    const adminId = req.user.userId;

    // Check if the current user is an admin
    const adminMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: adminId,
          workspaceId
        }
      }
    });

    if (!adminMember || adminMember.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can invite members' });
    }

    // Find user to invite by email
    const userToInvite = await prisma.user.findUnique({ where: { email } });
    if (!userToInvite) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already in the workspace
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: userToInvite.id,
          workspaceId
        }
      }
    });

    if (existingMember) {
      return res.status(409).json({ message: 'User is already a member' });
    }

    const newMember = await prisma.workspaceMember.create({
      data: {
        userId: userToInvite.id,
        workspaceId,
        role: role || 'MEMBER'
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json(newMember);
  } catch (error) {
    console.error('Invite Member Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const switchWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId }
      },
      include: {
        workspace: true
      }
    });

    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this workspace' });
    }

    // Usually switching context is handled client-side by storing the active workspace ID, 
    // but we can return the full workspace data here to acknowledge the switch.
    res.status(200).json({ 
      message: 'Workspace context switched', 
      workspace: membership.workspace,
      role: membership.role 
    });
  } catch (error) {
    console.error('Switch Workspace Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
  inviteMember,
  switchWorkspace
};
