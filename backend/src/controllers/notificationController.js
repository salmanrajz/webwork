import { info, error } from '../utils/logger.js';

// This will be set when the WebSocket manager is initialized
let notificationService = null;

export const setNotificationService = (service) => {
  notificationService = service;
};

// Send notification to specific user
export const sendToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const notification = req.body;

    if (!notificationService) {
      return res.status(503).json({
        success: false,
        error: 'Notification service not available'
      });
    }

    const success = notificationService.sendToUser(userId, notification);
    
    if (success) {
      res.json({
        success: true,
        message: 'Notification sent successfully',
        userId,
        notificationId: notification.id || Date.now().toString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send notification'
      });
    }
  } catch (err) {
    error('Error sending notification to user:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Send notification to multiple users
export const sendToUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    const notification = req.body.notification;

    if (!notificationService) {
      return res.status(503).json({
        success: false,
        error: 'Notification service not available'
      });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User IDs array is required'
      });
    }

    const results = notificationService.sendToUsers(userIds, notification);
    const successCount = results.filter(Boolean).length;
    
    res.json({
      success: true,
      message: `Notifications sent to ${successCount}/${userIds.length} users`,
      results: {
        total: userIds.length,
        successful: successCount,
        failed: userIds.length - successCount
      }
    });
  } catch (err) {
    error('Error sending notifications to users:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Send broadcast notification
export const sendBroadcast = async (req, res) => {
  try {
    const notification = req.body;

    if (!notificationService) {
      return res.status(503).json({
        success: false,
        error: 'Notification service not available'
      });
    }

    const success = notificationService.sendBroadcast(notification);
    
    if (success) {
      res.json({
        success: true,
        message: 'Broadcast notification sent successfully',
        notificationId: notification.id || Date.now().toString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send broadcast notification'
      });
    }
  } catch (err) {
    error('Error sending broadcast notification:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Send system notification
export const sendSystemNotification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, data } = req.body;

    if (!notificationService) {
      return res.status(503).json({
        success: false,
        error: 'Notification service not available'
      });
    }

    const success = notificationService.sendSystemNotification(userId, type, data);
    
    if (success) {
      res.json({
        success: true,
        message: 'System notification sent successfully',
        userId,
        type
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid notification type or failed to send'
      });
    }
  } catch (err) {
    error('Error sending system notification:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Send manager notification
export const sendManagerNotification = async (req, res) => {
  try {
    const { managerId } = req.params;
    const { type, data } = req.body;

    if (!notificationService) {
      return res.status(503).json({
        success: false,
        error: 'Notification service not available'
      });
    }

    const success = notificationService.sendManagerNotification(managerId, type, data);
    
    if (success) {
      res.json({
        success: true,
        message: 'Manager notification sent successfully',
        managerId,
        type
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid notification type or failed to send'
      });
    }
  } catch (err) {
    error('Error sending manager notification:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get notification statistics
export const getStats = async (req, res) => {
  try {
    if (!notificationService) {
      return res.status(503).json({
        success: false,
        error: 'Notification service not available'
      });
    }

    const stats = notificationService.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    error('Error getting notification stats:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
