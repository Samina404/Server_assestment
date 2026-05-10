const prisma = require('../utils/prisma');

// Permission Matrix defining what each role can do
const PERMISSION_MATRIX = {
  ADMIN: [
    'CREATE_ANNOUNCEMENT',
    'DELETE_ANNOUNCEMENT',
    'PIN_ANNOUNCEMENT',
    'INVITE_MEMBER',
    'REMOVE_MEMBER',
    'CREATE_GOAL',
    'DELETE_GOAL',
    'UPDATE_GOAL',
    'CREATE_ACTION_ITEM',
    'DELETE_ACTION_ITEM',
    'UPDATE_ACTION_ITEM',
    'VIEW_AUDIT_LOGS'
  ],
  MEMBER: [
    'CREATE_ACTION_ITEM',
    'UPDATE_ACTION_ITEM', // Usually limited to assigned items, but simplified here
    'CREATE_GOAL',
    'UPDATE_GOAL',
    // Members cannot create/delete announcements or view audit logs
  ]
};

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      
      // Look for workspaceId in params or body
      const workspaceId = req.params.workspaceId || req.body.workspaceId;
      
      if (!workspaceId) {
        return res.status(400).json({ message: 'workspaceId is required for RBAC check' });
      }

      const membership = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId } }
      });

      if (!membership) {
        return res.status(403).json({ message: 'Forbidden: Not a member of this workspace' });
      }

      const rolePermissions = PERMISSION_MATRIX[membership.role] || [];

      if (!rolePermissions.includes(requiredPermission)) {
        return res.status(403).json({ 
          message: `Forbidden: Requires ${requiredPermission} permission` 
        });
      }

      next();
    } catch (error) {
      console.error('RBAC Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
};

module.exports = { checkPermission };
