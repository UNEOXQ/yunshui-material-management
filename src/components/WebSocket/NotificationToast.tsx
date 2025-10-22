import React, { useState, useEffect } from 'react';
import { NotificationEvent } from '../../services/websocketService';
import './NotificationToast.css';

interface NotificationToastProps {
  notification: NotificationEvent;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300); // Animation duration
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getTypeClass = () => {
    return `toast-${notification.type}`;
  };

  if (!isVisible) return null;

  return (
    <div className={`notification-toast ${getTypeClass()} ${isClosing ? 'closing' : ''}`}>
      <div className="toast-content">
        <div className="toast-icon">
          {getIcon()}
        </div>
        
        <div className="toast-body">
          <div className="toast-title">
            {notification.title}
          </div>
          
          <div className="toast-message">
            {notification.message}
          </div>
          
          {notification.data && (
            <div className="toast-data">
              <details>
                <summary>詳細資訊</summary>
                <pre>{JSON.stringify(notification.data, null, 2)}</pre>
              </details>
            </div>
          )}
          
          <div className="toast-timestamp">
            {new Date(notification.timestamp).toLocaleString('zh-TW')}
          </div>
        </div>
        
        <button 
          className="toast-close-button"
          onClick={handleClose}
          aria-label="關閉通知"
        >
          ×
        </button>
      </div>
      
      {autoClose && (
        <div 
          className="toast-progress-bar"
          style={{ animationDuration: `${autoCloseDelay}ms` }}
        />
      )}
    </div>
  );
};

export default NotificationToast;