const prisma = require('../utils/prisma');
const { Parser } = require('json2csv');

const getAuditLogs = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { entityType, action, limit = 50 } = req.query;

    const where = { workspaceId };
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10)
    });

    res.status(200).json(logs);
  } catch (error) {
    console.error('Audit Log Fetch Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const exportAuditLogs = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const logs = await prisma.auditLog.findMany({
      where: { workspaceId },
      include: {
        user: { select: { email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (logs.length === 0) {
      return res.status(404).json({ message: 'No logs to export' });
    }

    const data = logs.map(log => ({
      ID: log.id,
      Action: log.action,
      EntityType: log.entityType,
      EntityID: log.entityId,
      UserEmail: log.user ? log.user.email : 'Unknown',
      Details: log.details || '',
      Timestamp: log.createdAt.toISOString()
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(`audit_logs_${workspaceId}.csv`);
    return res.send(csv);
  } catch (error) {
    console.error('Export Audit Logs Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAuditLogs,
  exportAuditLogs
};
