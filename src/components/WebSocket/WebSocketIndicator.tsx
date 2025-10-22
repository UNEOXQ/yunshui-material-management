import React from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import './WebSocketIndicator.css';

interface WebSocketIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

const WebSocketIndicator: React.FC<WebSocketIndicatorProps> = ({
  showDetails = false,
  className = ''
}) => {
  const { connected, connecting, error, reconnectAttempts } = useWebSocket({
    autoConnect: false // Don't auto-connect, just monitor existing connection
  });

  const getStatusIcon = () => {
    if (connecting) return '🔄';
    if (connected) return '🟢';
    if (error) return '🔴';
    return '⚫';
  };

  const getStatusText = () => {
    if (connecting) return '連線中...';
    if (connected) return '已連線';
    if (error) return '連線錯誤';
    return '未連線';
  };

  const getStatusClass = () => {
    if (connecting) return 'connecting';
    if (connected) return 'connected';
    if (error) return 'error';
    return 'disconnected';
  };

  return (
    <div className={`websocket-indicator ${getStatusClass()} ${className}`}>
      <div className="status-icon" title={getStatusText()}>
        {getStatusIcon()}
      </div>
      
      {showDetails && (
        <div className="status-details">
          <span className="status-text">{getStatusText()}</span>
          
          {reconnectAttempts > 0 && (
            <span className="reconnect-attempts">
              (重連嘗試: {reconnectAttempts})
            </span>
          )}
          
          {error && (
            <div className="error-message" title={error}>
              {error.length > 30 ? `${error.substring(0, 30)}...` : error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WebSocketIndicator;