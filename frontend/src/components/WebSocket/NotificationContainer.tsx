import React, { useState, useCallback } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { NotificationEvent } from '../../services/websocketService';
import NotificationToast from './NotificationToast';
import './NotificationContainer.css';

interface NotificationWithId extends NotificationEvent {
  id: string;
}

interface NotificationContainerProps {
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  maxNotifications = 5,
  position = 'top-right',
  autoClose = true,
  autoCloseDelay = 5000
}) => {
  const [notifications, setNotifications] = useState<NotificationWithId[]>([]);

  const addNotification = useCallback((notification: NotificationEvent) => {
    const notificationWithId: NotificationWithId = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    setNotifications(prev => {
      const newNotifications = [notificationWithId, ...prev];
      
      // Limit the number of notifications
      if (newNotifications.length > maxNotifications) {
        return newNotifications.slice(0, maxNotifications);
      }
      
      return newNotifications;
    });
  }, [maxNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Setup WebSocket notification handler
  useWebSocket({
    autoConnect: false, // Don't auto-connect, just listen for notifications
    onNotification: addNotification
  });

  const getPositionClass = () => {
    return `position-${position}`;
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`notification-container ${getPositionClass()}`}>
      {notifications.length > 1 && (
        <div className="notification-header">
          <span className="notification-count">
            {notifications.length} 個通知
          </span>
          <button 
            className="clear-all-button"
            onClick={clearAllNotifications}
            title="清除所有通知"
          >
            清除全部
          </button>
        </div>
      )}
      
      <div className="notification-list">
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
            autoClose={autoClose}
            autoCloseDelay={autoCloseDelay}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationContainer;