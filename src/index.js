require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth.route');
const workspaceRoutes = require('./routes/workspace.route');
const goalRoutes = require('./routes/goal.route');
const milestoneRoutes = require('./routes/milestone.route');
const announcementRoutes = require('./routes/announcement.route');
const actionItemRoutes = require('./routes/actionItem.route');
const uploadRoutes = require('./routes/upload.route');
const analyticsRoutes = require('./routes/analytics.route');
const notificationRoutes = require('./routes/notification.route');
const auditRoutes = require('./routes/audit.route');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const app = express();
const server = http.createServer(app);

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  }
});

// Pass io to request object for controllers to use
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/action-items', actionItemRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);

// Swagger Documentation
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Workspace API',
      version: '1.0.0',
      description: 'API Documentation for Workspace Collaboration Tool'
    },
    servers: [{ url: 'http://localhost:5000' }]
  },
  apis: ['./src/routes/*.js']
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Socket connection & Presence System
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_workspace', (workspaceId) => {
    socket.join(`workspace_${workspaceId}`);
  });

  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    onlineUsers.set(userId, socket.id);
    io.emit('presence_update', Array.from(onlineUsers.keys()));
  });
  
  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('presence_update', Array.from(onlineUsers.keys()));
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
