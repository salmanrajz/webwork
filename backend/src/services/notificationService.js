import { info, error } from '../utils/logger.js';

class NotificationService {
  constructor(wsManager) {
    this.wsManager = wsManager;
  }

  // Send notification to a specific user
  sendToUser(userId, notification) {
    if (!this.wsManager) {
      error('WebSocket manager not available');
      return false;
    }

    const message = {
      type: 'notification',
      data: {
        id: notification.id || Date.now().toString(),
        title: notification.title,
        message: notification.message,
        type: notification.notificationType || 'info',
        priority: notification.priority || 'normal',
        timestamp: new Date().toISOString(),
        actions: notification.actions || [],
        metadata: notification.metadata || {}
      }
    };

    try {
      this.wsManager.broadcastToUser(userId, message);
      info(`📤 Notification sent to user ${userId}: ${notification.title}`);
      return true;
    } catch (err) {
      error(`Failed to send notification to user ${userId}:`, err.message);
      return false;
    }
  }

  // Send notification to multiple users
  sendToUsers(userIds, notification) {
    const results = [];
    userIds.forEach(userId => {
      results.push(this.sendToUser(userId, notification));
    });
    return results;
  }

  // Send broadcast notification to all connected users
  sendBroadcast(notification) {
    if (!this.wsManager) {
      error('WebSocket manager not available');
      return false;
    }

    const message = {
      type: 'notification',
      data: {
        id: notification.id || Date.now().toString(),
        title: notification.title,
        message: notification.message,
        type: notification.notificationType || 'info',
        priority: notification.priority || 'normal',
        timestamp: new Date().toISOString(),
        actions: notification.actions || [],
        metadata: notification.metadata || {}
      }
    };

    try {
      this.wsManager.broadcast(message);
      info(`📢 Broadcast notification sent: ${notification.title}`);
      return true;
    } catch (err) {
      error('Failed to send broadcast notification:', err.message);
      return false;
    }
  }

  // Send system notifications
  sendSystemNotification(userId, type, data) {
    const notifications = {
      task_assigned: {
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${data.taskTitle}`,
        notificationType: 'task',
        priority: 'high',
        actions: [
          { label: 'View Task', action: 'view_task', data: { taskId: data.taskId } },
          { label: 'Start Timer', action: 'start_timer', data: { taskId: data.taskId } }
        ],
        metadata: { taskId: data.taskId, projectId: data.projectId }
      },
      task_completed: {
        title: 'Task Completed',
        message: `${data.taskTitle} has been marked as completed`,
        notificationType: 'success',
        priority: 'normal',
        metadata: { taskId: data.taskId }
      },
      time_log_created: {
        title: 'Time Logged',
        message: `Time logged for ${data.taskTitle}: ${data.duration}`,
        notificationType: 'info',
        priority: 'low',
        metadata: { taskId: data.taskId, timeLogId: data.timeLogId }
      },
      attendance_reminder: {
        title: 'Attendance Reminder',
        message: 'Don\'t forget to clock in for your shift',
        notificationType: 'reminder',
        priority: 'high',
        actions: [
          { label: 'Clock In', action: 'clock_in' }
        ]
      },
      break_reminder: {
        title: 'Break Time',
        message: 'You\'ve been working for a while. Consider taking a break!',
        notificationType: 'reminder',
        priority: 'normal',
        actions: [
          { label: 'Take Break', action: 'take_break' },
          { label: 'Dismiss', action: 'dismiss' }
        ]
      },
      productivity_alert: {
        title: 'Productivity Alert',
        message: data.message,
        notificationType: 'warning',
        priority: 'high',
        metadata: { alertType: data.alertType, userId: data.userId }
      },
      system_maintenance: {
        title: 'System Maintenance',
        message: 'The system will be under maintenance in 30 minutes',
        notificationType: 'system',
        priority: 'high',
        actions: [
          { label: 'Save Work', action: 'save_work' }
        ]
      }
    };

    const notification = notifications[type];
    if (notification) {
      return this.sendToUser(userId, { ...notification, ...data });
    }
    return false;
  }

  // Send manager notifications
  sendManagerNotification(managerId, type, data) {
    const notifications = {
      employee_clocked_in: {
        title: 'Employee Clocked In',
        message: `${data.employeeName} has clocked in`,
        notificationType: 'attendance',
        priority: 'normal',
        metadata: { employeeId: data.employeeId, clockInTime: data.clockInTime }
      },
      employee_clocked_out: {
        title: 'Employee Clocked Out',
        message: `${data.employeeName} has clocked out`,
        notificationType: 'attendance',
        priority: 'normal',
        metadata: { employeeId: data.employeeId, clockOutTime: data.clockOutTime }
      },
      task_overdue: {
        title: 'Task Overdue',
        message: `${data.taskTitle} is overdue`,
        notificationType: 'warning',
        priority: 'high',
        actions: [
          { label: 'View Task', action: 'view_task', data: { taskId: data.taskId } }
        ],
        metadata: { taskId: data.taskId, assigneeId: data.assigneeId }
      },
      productivity_concern: {
        title: 'Productivity Concern',
        message: `${data.employeeName} has been inactive for ${data.inactiveTime}`,
        notificationType: 'warning',
        priority: 'high',
        metadata: { employeeId: data.employeeId, inactiveTime: data.inactiveTime }
      }
    };

    const notification = notifications[type];
    if (notification) {
      return this.sendToUser(managerId, { ...notification, ...data });
    }
    return false;
  }

  // Get notification statistics
  getStats() {
    if (!this.wsManager) {
      return { connectedUsers: 0, totalConnections: 0 };
    }
    return this.wsManager.getStats();
  }
}

export default NotificationService;
