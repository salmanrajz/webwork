import { useState } from 'react';
import { useNotificationSender } from '../hooks/useNotificationSender.js';
import Button from './Button.jsx';

const NotificationExamples = () => {
  const {
    isLoading,
    error,
    sendToUser,
    sendToUsers,
    sendBroadcast,
    notifyTaskAssigned,
    notifyTaskCompleted,
    notifyAttendanceReminder,
    notifyBreakReminder,
    notifyProductivityAlert,
    notifySystemMaintenance,
    notifyTeamAnnouncement,
    sendCustomNotification
  } = useNotificationSender();

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  // Example 1: Send custom notification to specific user
  const handleSendToUser = async () => {
    if (!selectedUserId) {
      alert('Please enter a user ID');
      return;
    }

    try {
      await sendToUser(selectedUserId, {
        title: 'Custom Notification',
        message: 'This is a custom notification sent from the frontend',
        notificationType: 'info',
        priority: 'normal',
        actions: [
          { label: 'View Details', action: 'view_details' },
          { label: 'Dismiss', action: 'dismiss' }
        ]
      });
      alert('Notification sent successfully!');
    } catch (error) {
      alert('Failed to send notification: ' + error.message);
    }
  };

  // Example 2: Send notification to multiple users
  const handleSendToUsers = async () => {
    const userIds = selectedUserIds.split(',').map(id => id.trim()).filter(id => id);
    if (userIds.length === 0) {
      alert('Please enter user IDs separated by commas');
      return;
    }

    try {
      await sendToUsers(userIds, {
        title: 'Team Update',
        message: 'Important team announcement from the frontend',
        notificationType: 'info',
        priority: 'normal'
      });
      alert('Notifications sent to ' + userIds.length + ' users!');
    } catch (error) {
      alert('Failed to send notifications: ' + error.message);
    }
  };

  // Example 3: Send broadcast notification
  const handleSendBroadcast = async () => {
    try {
      await sendBroadcast({
        title: 'System Announcement',
        message: 'This is a broadcast notification to all connected users',
        notificationType: 'system',
        priority: 'high',
        actions: [
          { label: 'Learn More', action: 'learn_more' }
        ]
      });
      alert('Broadcast notification sent!');
    } catch (error) {
      alert('Failed to send broadcast: ' + error.message);
    }
  };

  // Example 4: Notify task assignment
  const handleNotifyTaskAssigned = async () => {
    if (!selectedUserId) {
      alert('Please enter a user ID');
      return;
    }

    try {
      await notifyTaskAssigned(selectedUserId, {
        id: 'task-123',
        title: 'Implement new feature',
        projectId: 'project-456'
      });
      alert('Task assignment notification sent!');
    } catch (error) {
      alert('Failed to send task assignment notification: ' + error.message);
    }
  };

  // Example 5: Notify task completion
  const handleNotifyTaskCompleted = async () => {
    if (!selectedUserId) {
      alert('Please enter a user ID');
      return;
    }

    try {
      await notifyTaskCompleted(selectedUserId, {
        id: 'task-123',
        title: 'Implement new feature'
      });
      alert('Task completion notification sent!');
    } catch (error) {
      alert('Failed to send task completion notification: ' + error.message);
    }
  };

  // Example 6: Send attendance reminder
  const handleNotifyAttendanceReminder = async () => {
    const userIds = selectedUserIds.split(',').map(id => id.trim()).filter(id => id);
    if (userIds.length === 0) {
      alert('Please enter user IDs separated by commas');
      return;
    }

    try {
      await notifyAttendanceReminder(userIds);
      alert('Attendance reminders sent!');
    } catch (error) {
      alert('Failed to send attendance reminders: ' + error.message);
    }
  };

  // Example 7: Send break reminder
  const handleNotifyBreakReminder = async () => {
    if (!selectedUserId) {
      alert('Please enter a user ID');
      return;
    }

    try {
      await notifyBreakReminder(selectedUserId);
      alert('Break reminder sent!');
    } catch (error) {
      alert('Failed to send break reminder: ' + error.message);
    }
  };

  // Example 8: Send productivity alert
  const handleNotifyProductivityAlert = async () => {
    if (!selectedUserId) {
      alert('Please enter a manager ID');
      return;
    }

    try {
      await notifyProductivityAlert(
        selectedUserId, // manager ID
        'emp-123', // employee ID
        'John Doe', // employee name
        'inactivity', // alert type
        'Employee has been inactive for 2 hours'
      );
      alert('Productivity alert sent to manager!');
    } catch (error) {
      alert('Failed to send productivity alert: ' + error.message);
    }
  };

  // Example 9: Send system maintenance notification
  const handleNotifySystemMaintenance = async () => {
    try {
      await notifySystemMaintenance('The system will be under maintenance in 30 minutes. Please save your work.');
      alert('System maintenance notification sent!');
    } catch (error) {
      alert('Failed to send system maintenance notification: ' + error.message);
    }
  };

  // Example 10: Send team announcement
  const handleNotifyTeamAnnouncement = async () => {
    const userIds = selectedUserIds.split(',').map(id => id.trim()).filter(id => id);
    if (userIds.length === 0) {
      alert('Please enter user IDs separated by commas');
      return;
    }

    try {
      await notifyTeamAnnouncement(
        userIds,
        'Team Meeting',
        'We have a team meeting scheduled for tomorrow at 2 PM',
        'high'
      );
      alert('Team announcement sent!');
    } catch (error) {
      alert('Failed to send team announcement: ' + error.message);
    }
  };

  // Example 11: Send custom notification with actions
  const handleSendCustomNotification = async () => {
    if (!selectedUserId || !customTitle || !customMessage) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await sendCustomNotification(
        selectedUserId,
        customTitle,
        customMessage,
        [
          { label: 'Approve', action: 'approve', data: { id: '123' } },
          { label: 'Reject', action: 'reject', data: { id: '123' } },
          { label: 'View Details', action: 'view_details', data: { id: '123' } }
        ],
        'high'
      );
      alert('Custom notification sent!');
    } catch (error) {
      alert('Failed to send custom notification: ' + error.message);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors duration-300">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        🔔 Notification Examples
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          Error: {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              User ID (for single user notifications)
            </label>
            <input
              type="text"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              placeholder="user-123"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              User IDs (comma-separated for multiple users)
            </label>
            <input
              type="text"
              value={selectedUserIds}
              onChange={(e) => setSelectedUserIds(e.target.value)}
              placeholder="user-123, user-456, user-789"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Custom Title
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Custom notification title"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Custom Message
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Custom notification message"
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300"
            />
          </div>
        </div>

        {/* Notification Buttons */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Send Notifications
          </h3>

          <div className="grid gap-3">
            <Button
              onClick={handleSendToUser}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send to User'}
            </Button>

            <Button
              onClick={handleSendToUsers}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send to Multiple Users'}
            </Button>

            <Button
              onClick={handleSendBroadcast}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Broadcast'}
            </Button>

            <Button
              onClick={handleNotifyTaskAssigned}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Notify Task Assignment'}
            </Button>

            <Button
              onClick={handleNotifyTaskCompleted}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Notify Task Completion'}
            </Button>

            <Button
              onClick={handleNotifyAttendanceReminder}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Attendance Reminder'}
            </Button>

            <Button
              onClick={handleNotifyBreakReminder}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Break Reminder'}
            </Button>

            <Button
              onClick={handleNotifyProductivityAlert}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Productivity Alert'}
            </Button>

            <Button
              onClick={handleNotifySystemMaintenance}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send System Maintenance'}
            </Button>

            <Button
              onClick={handleNotifyTeamAnnouncement}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Team Announcement'}
            </Button>

            <Button
              onClick={handleSendCustomNotification}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Custom Notification'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
          💡 Usage Tips:
        </h4>
        <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
          <li>• Use real user IDs from your database</li>
          <li>• Notifications will appear in the notification bell (🔔) in the topbar</li>
          <li>• Users need to be connected via WebSocket to receive notifications</li>
          <li>• Browser notifications require user permission</li>
          <li>• Check the browser console for WebSocket connection status</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationExamples;
