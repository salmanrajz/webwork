import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  sendToUser,
  sendToUsers,
  sendBroadcast,
  sendSystemNotification,
  sendManagerNotification,
  getStats
} from '../controllers/notificationController.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Send notification to specific user
router.post('/user/:userId', sendToUser);

// Send notification to multiple users
router.post('/users', sendToUsers);

// Send broadcast notification to all connected users
router.post('/broadcast', sendBroadcast);

// Send system notification to user
router.post('/system/:userId', sendSystemNotification);

// Send manager notification
router.post('/manager/:managerId', sendManagerNotification);

// Get notification statistics
router.get('/stats', getStats);

export default router;
