import { useState, useCallback } from 'react';
import notificationService from '../services/notificationService.js';

export const useNotificationSender = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Send notification to specific user
  const sendToUser = useCallback(async (userId, notification) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notificationService.sendToUser(userId, notification);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send notification to multiple users
  const sendToUsers = useCallback(async (userIds, notification) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notificationService.sendToUsers(userIds, notification);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send broadcast notification
  const sendBroadcast = useCallback(async (notification) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notificationService.sendBroadcast(notification);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send system notification
  const sendSystemNotification = useCallback(async (userId, type, data) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notificationService.sendSystemNotification(userId, type, data);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send manager notification
  const sendManagerNotification = useCallback(async (managerId, type, data) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notificationService.sendManagerNotification(managerId, type, data);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper methods for common scenarios

  // Notify task assignment
  const notifyTaskAssigned = useCallback(async (userId, task) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notificationService.notifyTaskAssigned(userId, task);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Notify task completion
  const notifyTaskCompleted = useCallback(async (userId, task) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notificationService.notifyTaskCompleted(userId, task);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Notify attendance reminder
  const notifyAttendanceReminder = useCallback(async (userIds) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notificationService.notifyAttendanceReminder(userIds);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Notify break reminder
  const notifyBreakReminder = useCallback(async (userId) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notificationService.notifyBreakReminder(userId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Notify productivity alert
  const notifyProductivityAlert = useCallback(async (managerId, employeeId, employeeName, alertType, message) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notificationService.notifyProductivityAlert(managerId, employeeId, employeeName, alertType, message);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Notify system maintenance
  const notifySystemMaintenance = useCallback(async (message) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notificationService.notifySystemMaintenance(message);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Notify team announcement
  const notifyTeamAnnouncement = useCallback(async (teamUserIds, title, message, priority = 'normal') => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notificationService.notifyTeamAnnouncement(teamUserIds, title, message, priority);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send custom notification
  const sendCustomNotification = useCallback(async (userId, title, message, actions = [], priority = 'normal') => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notificationService.sendCustomNotification(userId, title, message, actions, priority);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    isLoading,
    error,
    
    // Core methods
    sendToUser,
    sendToUsers,
    sendBroadcast,
    sendSystemNotification,
    sendManagerNotification,
    
    // Helper methods
    notifyTaskAssigned,
    notifyTaskCompleted,
    notifyAttendanceReminder,
    notifyBreakReminder,
    notifyProductivityAlert,
    notifySystemMaintenance,
    notifyTeamAnnouncement,
    sendCustomNotification
  };
};
