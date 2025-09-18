import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (!user?.token || ws) return;

    const token = user.token;
    const wsUrl = `ws://localhost:4000/realtime?token=${token}`;
    
    try {
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        console.log('🔗 WebSocket connected');
        setIsConnected(true);
        setWs(websocket);
      };
      
      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notification') {
            // Add notification to the list
            setNotifications(prev => [data.data, ...prev.slice(0, 49)]); // Keep last 50 notifications
            
            // Show browser notification if permission granted
            if (Notification.permission === 'granted') {
              new Notification(data.data.title, {
                body: data.data.message,
                icon: '/favicon.ico',
                tag: data.data.id
              });
            }
          } else if (data.type === 'connected') {
            console.log('📡 Real-time monitoring connected');
          }
        } catch (error) {
          console.warn('⚠️ Invalid WebSocket message:', error);
        }
      };
      
      websocket.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        setWs(null);
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (user?.token) {
            connectWebSocket();
          }
        }, 5000);
      };
      
      websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
      };
      
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
    }
  }, [user?.token, ws]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
      setIsConnected(false);
    }
  }, [ws]);

  // Send ping to keep connection alive
  const ping = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, [ws]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Handle notification action
  const handleNotificationAction = useCallback((notification, action) => {
    console.log('🔔 Notification action:', action, 'for notification:', notification.id);
    
    // Handle different action types
    switch (action.action) {
      case 'view_task':
        // Navigate to task or open task modal
        window.location.href = `/tasks/${action.data.taskId}`;
        break;
      case 'start_timer':
        // Start timer for specific task
        console.log('⏱️ Starting timer for task:', action.data.taskId);
        break;
      case 'clock_in':
        // Trigger clock in
        console.log('🕐 Clocking in...');
        break;
      case 'take_break':
        // Trigger break
        console.log('☕ Taking break...');
        break;
      case 'save_work':
        // Save current work
        console.log('💾 Saving work...');
        break;
      default:
        console.log('❓ Unknown action:', action.action);
    }
    
    // Dismiss the notification after action
    dismissNotification(notification.id);
  }, [dismissNotification]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (user?.token) {
      connectWebSocket();
    }
    
    return () => {
      disconnectWebSocket();
    };
  }, [user?.token, connectWebSocket, disconnectWebSocket]);

  // Ping every 30 seconds to keep connection alive
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(ping, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, ping]);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  return {
    notifications,
    isConnected,
    dismissNotification,
    clearAllNotifications,
    handleNotificationAction,
    requestNotificationPermission
  };
};
