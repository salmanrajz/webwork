# 🔔 Frontend Notification Guide

This guide shows you how to send notifications from the frontend in the WebWork Tracker system.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Using the Notification Service](#using-the-notification-service)
3. [Using the Notification Hook](#using-the-notification-hook)
4. [Component Examples](#component-examples)
5. [Common Use Cases](#common-use-cases)
6. [Testing Notifications](#testing-notifications)

## 🚀 Quick Start

### 1. Import the Notification Service

```javascript
import notificationService from '../services/notificationService.js';
```

### 2. Send a Simple Notification

```javascript
// Send notification to specific user
await notificationService.sendToUser('user-123', {
  title: 'New Task Assigned',
  message: 'You have been assigned a new task',
  notificationType: 'task',
  priority: 'high'
});
```

### 3. Use the Notification Hook

```javascript
import { useNotificationSender } from '../hooks/useNotificationSender.js';

function MyComponent() {
  const { sendToUser, isLoading, error } = useNotificationSender();

  const handleSendNotification = async () => {
    try {
      await sendToUser('user-123', {
        title: 'Hello!',
        message: 'This is a test notification'
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  return (
    <button onClick={handleSendNotification} disabled={isLoading}>
      Send Notification
    </button>
  );
}
```

## 🔧 Using the Notification Service

### Direct Service Usage

```javascript
import notificationService from '../services/notificationService.js';

// Send to specific user
await notificationService.sendToUser('user-123', {
  title: 'Task Assigned',
  message: 'You have a new task',
  notificationType: 'task',
  priority: 'high',
  actions: [
    { label: 'View Task', action: 'view_task', data: { taskId: 'task-123' } }
  ]
});

// Send to multiple users
await notificationService.sendToUsers(['user-123', 'user-456'], {
  title: 'Team Update',
  message: 'Important team announcement',
  notificationType: 'info',
  priority: 'normal'
});

// Send broadcast to all users
await notificationService.sendBroadcast({
  title: 'System Maintenance',
  message: 'System will be under maintenance in 30 minutes',
  notificationType: 'system',
  priority: 'high'
});
```

### Helper Methods

```javascript
// Task notifications
await notificationService.notifyTaskAssigned('user-123', {
  id: 'task-123',
  title: 'Implement new feature',
  projectId: 'project-456'
});

await notificationService.notifyTaskCompleted('user-123', {
  id: 'task-123',
  title: 'Implement new feature'
});

// Attendance notifications
await notificationService.notifyAttendanceReminder(['user-123', 'user-456']);

// Break reminders
await notificationService.notifyBreakReminder('user-123');

// Productivity alerts
await notificationService.notifyProductivityAlert(
  'manager-123', // manager ID
  'emp-123', // employee ID
  'John Doe', // employee name
  'inactivity', // alert type
  'Employee has been inactive for 2 hours'
);

// System maintenance
await notificationService.notifySystemMaintenance(
  'The system will be under maintenance in 30 minutes'
);

// Team announcements
await notificationService.notifyTeamAnnouncement(
  ['user-123', 'user-456'], // team user IDs
  'Team Meeting',
  'We have a team meeting scheduled for tomorrow at 2 PM',
  'high' // priority
);
```

## 🎣 Using the Notification Hook

### Basic Usage

```javascript
import { useNotificationSender } from '../hooks/useNotificationSender.js';

function TaskAssignmentComponent() {
  const {
    sendToUser,
    notifyTaskAssigned,
    isLoading,
    error
  } = useNotificationSender();

  const handleAssignTask = async (userId, task) => {
    try {
      // Method 1: Use helper method
      await notifyTaskAssigned(userId, task);
      
      // Method 2: Use generic method
      await sendToUser(userId, {
        title: 'New Task Assigned',
        message: `You have been assigned: ${task.title}`,
        notificationType: 'task',
        priority: 'high',
        actions: [
          { label: 'View Task', action: 'view_task', data: { taskId: task.id } }
        ]
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button 
        onClick={() => handleAssignTask('user-123', { id: 'task-123', title: 'New Task' })}
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Assign Task'}
      </button>
    </div>
  );
}
```

### Advanced Usage with Multiple Methods

```javascript
import { useNotificationSender } from '../hooks/useNotificationSender.js';

function ManagerDashboard() {
  const {
    sendToUsers,
    sendBroadcast,
    notifyProductivityAlert,
    notifySystemMaintenance,
    isLoading,
    error
  } = useNotificationSender();

  const handleSendTeamUpdate = async () => {
    const teamUserIds = ['user-123', 'user-456', 'user-789'];
    
    try {
      await sendToUsers(teamUserIds, {
        title: 'Team Update',
        message: 'Important team announcement',
        notificationType: 'info',
        priority: 'normal'
      });
    } catch (error) {
      console.error('Failed to send team update:', error);
    }
  };

  const handleSendProductivityAlert = async () => {
    try {
      await notifyProductivityAlert(
        'manager-123',
        'emp-123',
        'John Doe',
        'inactivity',
        'Employee has been inactive for 2 hours'
      );
    } catch (error) {
      console.error('Failed to send productivity alert:', error);
    }
  };

  const handleSendSystemMaintenance = async () => {
    try {
      await notifySystemMaintenance(
        'The system will be under maintenance in 30 minutes. Please save your work.'
      );
    } catch (error) {
      console.error('Failed to send system maintenance notification:', error);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Error: {error}
        </div>
      )}
      
      <button 
        onClick={handleSendTeamUpdate}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        Send Team Update
      </button>
      
      <button 
        onClick={handleSendProductivityAlert}
        disabled={isLoading}
        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
      >
        Send Productivity Alert
      </button>
      
      <button 
        onClick={handleSendSystemMaintenance}
        disabled={isLoading}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
      >
        Send System Maintenance
      </button>
    </div>
  );
}
```

## 🧩 Component Examples

### Task Assignment Component

```javascript
import { useState } from 'react';
import { useNotificationSender } from '../hooks/useNotificationSender.js';

function TaskAssignmentForm({ task, onAssign }) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const { notifyTaskAssigned, isLoading, error } = useNotificationSender();

  const handleAssignTask = async (e) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      alert('Please select a user');
      return;
    }

    try {
      // Assign the task (your existing logic)
      await onAssign(selectedUserId, task);
      
      // Send notification
      await notifyTaskAssigned(selectedUserId, task);
      
      alert('Task assigned and notification sent!');
    } catch (error) {
      console.error('Failed to assign task:', error);
      alert('Failed to assign task: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleAssignTask} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Error: {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Assign to User
        </label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        >
          <option value="">Select a user</option>
          <option value="user-123">John Doe</option>
          <option value="user-456">Jane Smith</option>
        </select>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Assigning...' : 'Assign Task'}
      </button>
    </form>
  );
}
```

### Attendance Management Component

```javascript
import { useState } from 'react';
import { useNotificationSender } from '../hooks/useNotificationSender.js';

function AttendanceManager() {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { notifyAttendanceReminder, isLoading, error } = useNotificationSender();

  const handleSendAttendanceReminder = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select users');
      return;
    }

    try {
      await notifyAttendanceReminder(selectedUsers);
      alert('Attendance reminders sent to ' + selectedUsers.length + ' users!');
    } catch (error) {
      console.error('Failed to send attendance reminders:', error);
      alert('Failed to send attendance reminders: ' + error.message);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Error: {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Select Users
        </label>
        <div className="mt-2 space-y-2">
          {[
            { id: 'user-123', name: 'John Doe' },
            { id: 'user-456', name: 'Jane Smith' },
            { id: 'user-789', name: 'Bob Johnson' }
          ].map(user => (
            <label key={user.id} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedUsers.includes(user.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedUsers([...selectedUsers, user.id]);
                  } else {
                    setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                  }
                }}
                className="mr-2"
              />
              {user.name}
            </label>
          ))}
        </div>
      </div>
      
      <button
        onClick={handleSendAttendanceReminder}
        disabled={isLoading}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
      >
        {isLoading ? 'Sending...' : 'Send Attendance Reminders'}
      </button>
    </div>
  );
}
```

### System Administration Component

```javascript
import { useState } from 'react';
import { useNotificationSender } from '../hooks/useNotificationSender.js';

function SystemAdminPanel() {
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const { notifySystemMaintenance, sendBroadcast, isLoading, error } = useNotificationSender();

  const handleSendMaintenanceNotification = async () => {
    if (!maintenanceMessage.trim()) {
      alert('Please enter a maintenance message');
      return;
    }

    try {
      await notifySystemMaintenance(maintenanceMessage);
      alert('System maintenance notification sent!');
    } catch (error) {
      console.error('Failed to send maintenance notification:', error);
      alert('Failed to send maintenance notification: ' + error.message);
    }
  };

  const handleSendCustomBroadcast = async () => {
    if (!maintenanceMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      await sendBroadcast({
        title: 'System Announcement',
        message: maintenanceMessage,
        notificationType: 'system',
        priority: 'high',
        actions: [
          { label: 'Learn More', action: 'learn_more' }
        ]
      });
      alert('Custom broadcast sent!');
    } catch (error) {
      console.error('Failed to send broadcast:', error);
      alert('Failed to send broadcast: ' + error.message);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Error: {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Message
        </label>
        <textarea
          value={maintenanceMessage}
          onChange={(e) => setMaintenanceMessage(e.target.value)}
          placeholder="Enter your message here..."
          rows={4}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="flex space-x-4">
        <button
          onClick={handleSendMaintenanceNotification}
          disabled={isLoading}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send Maintenance Notification'}
        </button>
        
        <button
          onClick={handleSendCustomBroadcast}
          disabled={isLoading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send Custom Broadcast'}
        </button>
      </div>
    </div>
  );
}
```

## 🎯 Common Use Cases

### 1. Task Management

```javascript
// When assigning a task
const handleAssignTask = async (userId, task) => {
  // Your existing task assignment logic
  await assignTaskToUser(userId, task);
  
  // Send notification
  await notifyTaskAssigned(userId, task);
};

// When completing a task
const handleCompleteTask = async (userId, task) => {
  // Your existing task completion logic
  await completeTask(task);
  
  // Send notification
  await notifyTaskCompleted(userId, task);
};
```

### 2. Attendance Management

```javascript
// Send attendance reminders
const handleSendAttendanceReminders = async () => {
  const activeUsers = await getActiveUsers();
  await notifyAttendanceReminder(activeUsers.map(user => user.id));
};
```

### 3. Productivity Monitoring

```javascript
// Send productivity alerts to managers
const handleProductivityAlert = async (managerId, employeeId, employeeName) => {
  await notifyProductivityAlert(
    managerId,
    employeeId,
    employeeName,
    'inactivity',
    'Employee has been inactive for 2 hours'
  );
};
```

### 4. System Administration

```javascript
// Send system maintenance notifications
const handleSystemMaintenance = async () => {
  await notifySystemMaintenance(
    'The system will be under maintenance in 30 minutes. Please save your work.'
  );
};
```

### 5. Team Communication

```javascript
// Send team announcements
const handleTeamAnnouncement = async (teamUserIds, title, message) => {
  await notifyTeamAnnouncement(teamUserIds, title, message, 'high');
};
```

## 🧪 Testing Notifications

### 1. Test Page Component

```javascript
import NotificationTestPage from '../pages/NotificationTestPage.jsx';

// Add to your router
<Route path="/notifications/test" element={<NotificationTestPage />} />
```

### 2. Manual Testing

1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Navigate to the test page**:
   ```
   http://localhost:5173/notifications/test
   ```

4. **Test different notification types** using the form

### 3. Programmatic Testing

```javascript
// Test notification in your component
const testNotification = async () => {
  try {
    await sendToUser('user-123', {
      title: 'Test Notification',
      message: 'This is a test notification',
      notificationType: 'info',
      priority: 'normal'
    });
    console.log('Test notification sent successfully!');
  } catch (error) {
    console.error('Test notification failed:', error);
  }
};
```

## 🔧 Configuration

### Environment Variables

Make sure your frontend has the correct API base URL:

```javascript
// In your notification service
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/notifications';
```

### Authentication

The notification service automatically uses the JWT token from localStorage:

```javascript
// Token is automatically retrieved from localStorage
const token = localStorage.getItem('webwork_token');
```

## 🎨 Styling

### Dark Mode Support

All notification components support dark mode:

```javascript
// Dark mode classes are automatically applied
<div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
  {/* Notification content */}
</div>
```

### Custom Styling

You can customize notification appearance:

```javascript
// Custom notification with specific styling
await sendToUser('user-123', {
  title: 'Custom Styled Notification',
  message: 'This notification has custom styling',
  notificationType: 'custom',
  priority: 'high',
  metadata: {
    customClass: 'my-custom-notification',
    icon: '🎉'
  }
});
```

## 🚀 Best Practices

1. **Use appropriate notification types** (task, info, warning, error)
2. **Set correct priority levels** (high, normal, low)
3. **Include action buttons** for interactive notifications
4. **Handle errors gracefully** with try-catch blocks
5. **Show loading states** while sending notifications
6. **Test thoroughly** with different user scenarios
7. **Use helper methods** for common notification types
8. **Implement proper error handling** and user feedback

## 📊 Monitoring

### Check Connection Status

```javascript
import { useNotifications } from '../hooks/useNotifications.js';

function ConnectionStatus() {
  const { isConnected } = useNotifications();
  
  return (
    <div className={`px-2 py-1 rounded text-xs ${
      isConnected 
        ? 'bg-green-100 text-green-700' 
        : 'bg-red-100 text-red-700'
    }`}>
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
}
```

### Get Notification Stats

```javascript
import notificationService from '../services/notificationService.js';

const getStats = async () => {
  try {
    const stats = await notificationService.getStats();
    console.log('Notification stats:', stats);
  } catch (error) {
    console.error('Failed to get stats:', error);
  }
};
```

This comprehensive guide shows you how to send notifications from the frontend in various scenarios! 🚀🔔
