import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Topbar from '../components/Topbar.jsx';
import Modal from '../components/Modal.jsx';
import { useNotificationSender } from '../hooks/useNotificationSender.js';
import Button from '../components/Button.jsx';

const NotificationManagement = () => {
  const {
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
    sendCustomNotification,
    isLoading,
    error
  } = useNotificationSender();

  const [formData, setFormData] = useState({
    userId: '',
    userIds: '',
    title: '',
    message: '',
    notificationType: 'info',
    priority: 'normal'
  });

  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Load users for selection
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('webwork_token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setUsers(data.data);
        }
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    loadUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Send notification to specific user
  const handleSendToUser = async () => {
    if (!formData.userId || !formData.title || !formData.message) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await sendToUser(formData.userId, {
        title: formData.title,
        message: formData.message,
        notificationType: formData.notificationType,
        priority: formData.priority,
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

  // Send notification to multiple users
  const handleSendToUsers = async () => {
    if (selectedUsers.length === 0 || !formData.title || !formData.message) {
      alert('Please select users and fill in the message');
      return;
    }

    try {
      await sendToUsers(selectedUsers, {
        title: formData.title,
        message: formData.message,
        notificationType: formData.notificationType,
        priority: formData.priority
      });
      alert(`Notification sent to ${selectedUsers.length} users!`);
    } catch (error) {
      alert('Failed to send notifications: ' + error.message);
    }
  };

  // Send broadcast notification
  const handleSendBroadcast = async () => {
    if (!formData.title || !formData.message) {
      alert('Please fill in the title and message');
      return;
    }

    try {
      await sendBroadcast({
        title: formData.title,
        message: formData.message,
        notificationType: formData.notificationType,
        priority: formData.priority,
        actions: [
          { label: 'Learn More', action: 'learn_more' }
        ]
      });
      alert('Broadcast notification sent to all connected users!');
    } catch (error) {
      alert('Failed to send broadcast: ' + error.message);
    }
  };

  // Quick notification templates
  const handleQuickNotification = async (type) => {
    const templates = {
      task_assigned: {
        title: 'New Task Assigned',
        message: 'You have been assigned a new task. Please check your task list.',
        notificationType: 'task',
        priority: 'high'
      },
      attendance_reminder: {
        title: 'Attendance Reminder',
        message: 'Don\'t forget to clock in for your shift.',
        notificationType: 'reminder',
        priority: 'high'
      },
      break_reminder: {
        title: 'Break Time',
        message: 'You\'ve been working for a while. Consider taking a break!',
        notificationType: 'reminder',
        priority: 'normal'
      },
      system_maintenance: {
        title: 'System Maintenance',
        message: 'The system will be under maintenance in 30 minutes. Please save your work.',
        notificationType: 'system',
        priority: 'high'
      },
      team_announcement: {
        title: 'Team Announcement',
        message: 'We have a team meeting scheduled for tomorrow at 2 PM.',
        notificationType: 'info',
        priority: 'normal'
      }
    };

    const template = templates[type];
    if (!template) return;

    setFormData(prev => ({
      ...prev,
      title: template.title,
      message: template.message,
      notificationType: template.notificationType,
      priority: template.priority
    }));
  };

  return (
    <DashboardLayout topbar={<Topbar title="Notification Management" />}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            🔔 Notification Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Send alerts, announcements, and notifications to users
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            Error: {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Templates */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Quick Templates
            </h3>
            <div className="grid gap-3">
              <Button
                onClick={() => handleQuickNotification('task_assigned')}
                className="w-full text-left"
              >
                📋 Task Assignment
              </Button>
              <Button
                onClick={() => handleQuickNotification('attendance_reminder')}
                className="w-full text-left"
              >
                🕐 Attendance Reminder
              </Button>
              <Button
                onClick={() => handleQuickNotification('break_reminder')}
                className="w-full text-left"
              >
                ☕ Break Reminder
              </Button>
              <Button
                onClick={() => handleQuickNotification('system_maintenance')}
                className="w-full text-left"
              >
                🔧 System Maintenance
              </Button>
              <Button
                onClick={() => handleQuickNotification('team_announcement')}
                className="w-full text-left"
              >
                📢 Team Announcement
              </Button>
            </div>
          </div>

          {/* Notification Form */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Send Notification
            </h3>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Notification title"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Notification message"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Type
                  </label>
                  <select
                    name="notificationType"
                    value={formData.notificationType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300"
                  >
                    <option value="info">Info</option>
                    <option value="task">Task</option>
                    <option value="reminder">Reminder</option>
                    <option value="system">System</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowPreviewModal(true)}
                  disabled={!formData.title || !formData.message}
                  className="flex-1"
                >
                  👁️ Preview
                </Button>
                <Button
                  onClick={handleSendBroadcast}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Sending...' : '📢 Broadcast to All'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* User Selection */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-colors duration-300">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Select Users
          </h3>
          
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {users.map(user => (
              <label key={user.id} className="flex items-center p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => handleUserSelect(user.id)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {user.email}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4 flex space-x-3">
            <Button
              onClick={handleSendToUsers}
              disabled={isLoading || selectedUsers.length === 0}
              className="flex-1"
            >
              {isLoading ? 'Sending...' : `📤 Send to ${selectedUsers.length} Users`}
            </Button>
          </div>
        </div>

        {/* Single User Selection */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-colors duration-300">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Send to Specific User
          </h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select User
              </label>
              <select
                name="userId"
                value={formData.userId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300"
              >
                <option value="">Select a user</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleSendToUser}
                disabled={isLoading || !formData.userId}
                className="w-full"
              >
                {isLoading ? 'Sending...' : '📤 Send to User'}
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="Notification Preview"
          size="md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">
                  {formData.notificationType === 'task' ? '📋' : 
                   formData.notificationType === 'reminder' ? '⏰' :
                   formData.notificationType === 'system' ? '🔧' :
                   formData.notificationType === 'warning' ? '⚠️' :
                   formData.notificationType === 'success' ? '✅' : 'ℹ️'}
                </span>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                  {formData.title}
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                {formData.message}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  formData.priority === 'high' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                  formData.priority === 'normal' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' :
                  'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                }`}>
                  {formData.priority} priority
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formData.notificationType}
                </span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowPreviewModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowPreviewModal(false);
                  handleSendBroadcast();
                }}
              >
                Send Notification
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default NotificationManagement;
