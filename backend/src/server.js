import dotenv from 'dotenv';
import { createServer } from 'http';
import app from './app.js';
import sequelize from './config/database.js';
import { info, error } from './utils/logger.js';
import WebSocketManager from './websocket.js';
import NotificationService from './services/notificationService.js';
import { setNotificationService } from './controllers/notificationController.js';
import './models/index.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

const start = async () => {
  try {
    await sequelize.authenticate();
    info('Database connection established');
    await sequelize.sync();
    info('Database synced');

    // Create HTTP server
    const server = createServer(app);
    
    // Initialize WebSocket server
    const wsManager = new WebSocketManager(server);
    global.wsManager = wsManager; // Make it globally accessible
    
    // Initialize notification service
    const notificationService = new NotificationService(wsManager);
    setNotificationService(notificationService);
    global.notificationService = notificationService; // Make it globally accessible
    
    server.listen(PORT, () => {
      info(`Server running on port ${PORT}`);
      info(`WebSocket server available at ws://localhost:${PORT}/realtime`);
      info('📡 Notification service initialized');
    });
  } catch (err) {
    error('Unable to start the server', err);
    process.exit(1);
  }
};

start();
