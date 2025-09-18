import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications.js';

const NotificationCenter = () => {
  const { 
    notifications, 
    isConnected, 
    dismissNotification, 
    clearAllNotifications, 
    handleNotificationAction 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type) => {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      task: '📋',
      attendance: '🕐',
      reminder: '⏰',
      system: '🔧',
      high: '🔴',
      normal: '🟡',
      low: '🟢'
    };
    return icons[type] || '📢';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'border-red-500 bg-red-50 dark:bg-red-900/20',
      normal: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      low: 'border-green-500 bg-green-50 dark:bg-green-900/20'
    };
    return colors[priority] || colors.normal;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200"
        title="Notifications"
      >
        <span className="text-xl">🔔</span>
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
        {!isConnected && (
          <span className="absolute -bottom-1 -right-1 bg-gray-400 text-white text-xs rounded-full h-3 w-3"></span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 transition-colors duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                isConnected 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                <div className="text-4xl mb-2">🔔</div>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} transition-colors duration-300`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <h4 className="font-medium text-slate-800 dark:text-slate-100">
                          {notification.title}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                      
                      {/* Action Buttons */}
                      {notification.actions && notification.actions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {notification.actions.map((action, index) => (
                            <button
                              key={index}
                              onClick={() => handleNotificationAction(notification, action)}
                              className="text-xs px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary rounded-full hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors duration-200"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="ml-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
