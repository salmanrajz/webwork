# 🔔 Real-Time Push Notifications Guide

This guide explains how to implement and use real-time push notifications in the WebWork Tracker system.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [API Endpoints](#api-endpoints)
5. [Usage Examples](#usage-examples)
6. [Testing](#testing)

## 🎯 Overview

The notification system uses WebSockets to send real-time push notifications to users. It supports:

- **User-specific notifications** - Send to individual users
- **Multi-user notifications** - Send to multiple users at once
- **Broadcast notifications** - Send to all connected users
- **System notifications** - Predefined notification types
- **Manager notifications** - Special notifications for managers
- **Browser notifications** - Native browser notifications
- **Action buttons** - Interactive notification actions

## 🔧 Backend Implementation

### WebSocket Server

The WebSocket server is implemented in `backend/src/websocket.js`:

```javascript
// WebSocket connection with JWT authentication
const wsUrl = `ws://localhost:4000/realtime?token=${jwtToken}`;
```

### Notification Service

The notification service (`backend/src/services/notificationService.js`) provides:

- `sendToUser(userId, notification)` - Send to specific user
- `sendToUsers(userIds, notification)` - Send to multiple users
- `sendBroadcast(notification)` - Send to all connected users
- `sendSystemNotification(userId, type, data)` - Send system notifications
- `sendManagerNotification(managerId, type, data)` - Send manager notifications

### API Endpoints

All notification endpoints require authentication:

```
POST /api/notifications/user/:userId          # Send to specific user
POST /api/notifications/users                 # Send to multiple users
POST /api/notifications/broadcast             # Send broadcast
POST /api/notifications/system/:userId        # Send system notification
POST /api/notifications/manager/:managerId    # Send manager notification
GET  /api/notifications/stats                 # Get connection stats
```

## 🎨 Frontend Implementation

### WebSocket Hook

The `useNotifications` hook (`frontend/src/hooks/useNotifications.js`) provides:

- Automatic WebSocket connection
- Notification state management
- Browser notification support
- Action handling
- Connection status monitoring

### Notification Center Component

The `NotificationCenter` component (`frontend/src/components/NotificationCenter.jsx`) provides:

- Notification bell with badge count
- Dropdown notification list
- Action buttons
- Priority-based styling
- Dark mode support

## 📡 API Endpoints

### 1. Send to Specific User

```bash
curl -X POST http://localhost:4000/api/notifications/user/user-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Task Assigned",
    "message": "You have been assigned a new task",
    "notificationType": "task",
    "priority": "high",
    "actions": [
      {"label": "View Task", "action": "view_task", "data": {"taskId": "task-123"}}
    ]
  }'
```

### 2. Send to Multiple Users

```bash
curl -X POST http://localhost:4000/api/notifications/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user-123", "user-456"],
    "notification": {
      "title": "Team Announcement",
      "message": "Important team update",
      "notificationType": "info",
      "priority": "normal"
    }
  }'
```

### 3. Send Broadcast

```bash
curl -X POST http://localhost:4000/api/notifications/broadcast \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "System Maintenance",
    "message": "System will be under maintenance in 30 minutes",
    "notificationType": "system",
    "priority": "high"
  }'
```

### 4. Send System Notification

```bash
curl -X POST http://localhost:4000/api/notifications/system/user-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "task_assigned",
    "data": {
      "taskId": "task-123",
      "taskTitle": "Implement new feature",
      "projectId": "project-456"
    }
  }'
```

### 5. Send Manager Notification

```bash
curl -X POST http://localhost:4000/api/notifications/manager/manager-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "employee_clocked_in",
    "data": {
      "employeeId": "emp-123",
      "employeeName": "John Doe",
      "clockInTime": "2025-01-15T10:00:00Z"
    }
  }'
```

## 💡 Usage Examples

### 1. Task Assignment Notification

```javascript
// When a task is assigned to a user
const notification = {
  title: 'New Task Assigned',
  message: `You have been assigned: ${task.title}`,
  notificationType: 'task',
  priority: 'high',
  actions: [
    { label: 'View Task', action: 'view_task', data: { taskId: task.id } },
    { label: 'Start Timer', action: 'start_timer', data: { taskId: task.id } }
  ],
  metadata: { taskId: task.id, projectId: task.projectId }
};

await notificationService.sendToUser(userId, notification);
```

### 2. Attendance Reminder

```javascript
// Send attendance reminder to all employees
const notification = {
  title: 'Attendance Reminder',
  message: 'Don\'t forget to clock in for your shift',
  notificationType: 'reminder',
  priority: 'high',
  actions: [
    { label: 'Clock In', action: 'clock_in' }
  ]
};

await notificationService.sendBroadcast(notification);
```

### 3. Productivity Alert

```javascript
// Send productivity alert to manager
await notificationService.sendManagerNotification(managerId, 'productivity_concern', {
  employeeId: userId,
  employeeName: user.name,
  inactiveTime: '2 hours',
  alertType: 'inactivity'
});
```

### 4. System Maintenance

```javascript
// Send system maintenance notification
const notification = {
  title: 'System Maintenance',
  message: 'The system will be under maintenance in 30 minutes',
  notificationType: 'system',
  priority: 'high',
  actions: [
    { label: 'Save Work', action: 'save_work' }
  ]
};

await notificationService.sendBroadcast(notification);
```

## 🧪 Testing

### 1. Test Script

Use the provided test script:

```bash
cd backend
node test-notifications.js
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

3. **Login to get a JWT token**

4. **Send test notifications** using the API endpoints

### 3. WebSocket Testing

You can test WebSocket connections directly:

```javascript
const ws = new WebSocket('ws://localhost:4000/realtime?token=YOUR_JWT_TOKEN');

ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

## 🔔 Notification Types

### System Notifications

- `task_assigned` - New task assigned
- `task_completed` - Task completed
- `time_log_created` - Time logged
- `attendance_reminder` - Clock in reminder
- `break_reminder` - Break time reminder
- `productivity_alert` - Productivity concern
- `system_maintenance` - System maintenance

### Manager Notifications

- `employee_clocked_in` - Employee clocked in
- `employee_clocked_out` - Employee clocked out
- `task_overdue` - Task overdue
- `productivity_concern` - Employee productivity concern

## 🎨 Frontend Integration

### Using the Notification Hook

```javascript
import { useNotifications } from '../hooks/useNotifications.js';

function MyComponent() {
  const { 
    notifications, 
    isConnected, 
    dismissNotification, 
    handleNotificationAction 
  } = useNotifications();

  return (
    <div>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>Notifications: {notifications.length}</p>
    </div>
  );
}
```

### Using the Notification Center

```javascript
import NotificationCenter from '../components/NotificationCenter.jsx';

function Topbar() {
  return (
    <div>
      <NotificationCenter />
    </div>
  );
}
```

## 🚀 Production Considerations

1. **Authentication**: Ensure JWT tokens are properly validated
2. **Rate Limiting**: Implement rate limiting for notification endpoints
3. **Persistence**: Consider storing notifications in database
4. **Scaling**: Use Redis for WebSocket scaling in production
5. **Monitoring**: Monitor WebSocket connections and notification delivery
6. **Error Handling**: Implement proper error handling and retry logic

## 📊 Monitoring

### Get Connection Stats

```bash
curl -X GET http://localhost:4000/api/notifications/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "totalConnections": 5,
    "uniqueUsers": 3,
    "users": [
      {"userId": "user-123", "connections": 2},
      {"userId": "user-456", "connections": 1}
    ]
  }
}
```

## 🔧 Configuration

### Environment Variables

```env
JWT_SECRET=your-jwt-secret
WEBSOCKET_URL=ws://localhost:4000/realtime
```

### WebSocket Configuration

The WebSocket server is configured in `backend/src/websocket.js`:

- **Path**: `/realtime`
- **Authentication**: JWT token in query params
- **Heartbeat**: 30-second ping/pong
- **Reconnection**: Automatic reconnection on disconnect

## 🎯 Best Practices

1. **Use appropriate priority levels** (high, normal, low)
2. **Include action buttons** for interactive notifications
3. **Handle connection states** gracefully
4. **Implement notification persistence** for offline users
5. **Use system notifications** for common scenarios
6. **Test thoroughly** with multiple users
7. **Monitor performance** and connection health

This notification system provides a robust foundation for real-time communication in your WebWork Tracker application! 🚀
