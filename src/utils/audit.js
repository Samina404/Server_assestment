const prisma = require('./prisma');

const logAudit = async ({ action, entityType, entityId, details, userId, workspaceId }) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        userId,
        workspaceId
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

module.exports = { logAudit };
