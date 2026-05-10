const prisma = require('./prisma');

const parseMentions = async (content, workspaceId, creatorId, io) => {
  // Regex to find @username or @user@email.com
  const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
  const matches = content.match(mentionRegex);

  if (!matches) return;

  // Extract names or emails
  const identifiers = matches.map(m => m.substring(1));

  // Find users in the workspace that match these identifiers
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: true }
  });

  const mentionedUsers = members.filter(m => 
    m.user.id !== creatorId && 
    (identifiers.includes(m.user.name) || identifiers.includes(m.user.email) || identifiers.includes(m.user.id))
  );

  for (const member of mentionedUsers) {
    // Create DB notification
    const notification = await prisma.notification.create({
      data: {
        userId: member.user.id,
        content: `You were mentioned in a workspace by a team member.`
      }
    });

    // Emit real-time if socket is provided
    if (io) {
      io.to(`user_${member.user.id}`).emit('notification', notification);
    }
  }
};

module.exports = { parseMentions };
