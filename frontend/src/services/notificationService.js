import axios from 'axios';

class NotificationService {
  constructor() {
    this.baseURL = 'http://localhost:4000/api/notifications';
  }

  // Get auth token from localStorage or context
  getAuthToken() {
    const token = localStorage.getItem('webwork_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  }

  // Send notification to specific user
  async sendToUser(userId, notification) {
    try {
      const token = this.getAuthToken();
      const response = await axios.post(`${this.baseURL}/user/${userId}`, notification, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send notification to user:', error);
      throw error;
    }
  }

  // Send notification to multiple users
  async sendToUsers(userIds, notification) {
    try {
      const token = this.getAuthToken();
      const response = await axios.post(`${this.baseURL}/users`, {
        userIds,
        notification
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send notification to users:', error);
      throw error;
    }
  }

  // Send broadcast notification to all connected users
  async sendBroadcast(notification) {
    try {
      const token = this.getAuthToken();
      const response = await axios.post(`${this.baseURL}/broadcast`, notification, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send broadcast notification:', error);
      throw error;
    }
  }

  // Send system notification
  async sendSystemNotification(userId, type, data) {
    try {
      const token = this.getAuthToken();
      const response = await axios.post(`${this.baseURL}/system/${userId}`, {
        type,
        data
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send system notification:', error);
      throw error;
    }
  }

  // Send manager notification
  async sendManagerNotification(managerId, type, data) {
    try {
      const token = this.getAuthToken();
      const response = await axios.post(`${this.baseURL}/manager/${managerId}`, {
        type,
        data
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send manager notification:', error);
      throw error;
    }
  }

  // Get notification statistics
  async getStats() {
    try {
      const token = this.getAuthToken();
      const response = await axios.get(`${this.baseURL}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      throw error;
    }
  }

  // Helper methods for common notification types

  // Send task assignment notification
  async notifyTaskAssigned(userId, task) {
    return this.sendSystemNotification(userId, 'task_assigned', {
      taskId: task.id,
      taskTitle: task.title,
      projectId: task.projectId
    });
  }

  // Send task completion notification
  async notifyTaskCompleted(userId, task) {
    return this.sendSystemNotification(userId, 'task_completed', {
      taskId: task.id,
      taskTitle: task.title
    });
  }

  // Send attendance reminder
  async notifyAttendanceReminder(userIds) {
    const notification = {
      title: 'Attendance Reminder',
      message: 'Don\'t forget to clock in for your shift',
      notificationType: 'reminder',
      priority: 'high',
      actions: [
        { label: 'Clock In', action: 'clock_in' }
      ]
    };

    if (Array.isArray(userIds)) {
      return this.sendToUsers(userIds, notification);
    } else {
      return this.sendToUser(userIds, notification);
    }
  }

  // Send break reminder
  async notifyBreakReminder(userId) {
    return this.sendSystemNotification(userId, 'break_reminder', {
      userId
    });
  }

  // Send productivity alert
  async notifyProductivityAlert(managerId, employeeId, employeeName, alertType, message) {
    return this.sendManagerNotification(managerId, 'productivity_concern', {
      employeeId,
      employeeName,
      alertType,
      message,
      inactiveTime: '2 hours'
    });
  }

  // Send system maintenance notification
  async notifySystemMaintenance(message = 'The system will be under maintenance in 30 minutes') {
    const notification = {
      title: 'System Maintenance',
      message,
      notificationType: 'system',
      priority: 'high',
      actions: [
        { label: 'Save Work', action: 'save_work' }
      ]
    };
    return this.sendBroadcast(notification);
  }

  // Send team announcement
  async notifyTeamAnnouncement(teamUserIds, title, message, priority = 'normal') {
    const notification = {
      title,
      message,
      notificationType: 'info',
      priority,
      actions: [
        { label: 'View Details', action: 'view_details' }
      ]
    };
    return this.sendToUsers(teamUserIds, notification);
  }

  // Send custom notification with actions
  async sendCustomNotification(userId, title, message, actions = [], priority = 'normal') {
    const notification = {
      title,
      message,
      notificationType: 'info',
      priority,
      actions
    };
    return this.sendToUser(userId, notification);
  }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
export default notificationService;
