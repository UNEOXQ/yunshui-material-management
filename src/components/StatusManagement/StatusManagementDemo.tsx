import React, { useState, useCallback } from 'react';
import OrderStatusManager from './OrderStatusManager';
import PickupStatusManager from './PickupStatusManager';
import DeliveryStatusManager from './DeliveryStatusManager';
import InspectionStatusManager from './InspectionStatusManager';
import StatusHistory from './StatusHistory';
import WebSocketIndicator from '../WebSocket/WebSocketIndicator';
import NotificationContainer from '../WebSocket/NotificationContainer';
import { statusService } from '../../services/statusService';
import { useWebSocket } from '../../hooks/useWebSocket';
import { StatusUpdateEvent, ProjectUpdateEvent, NotificationEvent } from '../../services/websocketService';
import './StatusManagement.css';

interface StatusManagementDemoProps {
  projectId: string;
}

const StatusManagementDemo: React.FC<StatusManagementDemoProps> = ({ projectId }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [realtimeUpdates, setRealtimeUpdates] = useState<StatusUpdateEvent[]>([]);

  const handleStatusUpdate = async () => {
    // Trigger refresh of status history
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle real-time status updates
  const handleRealtimeStatusUpdate = useCallback((data: StatusUpdateEvent) => {
    console.log('Real-time status update:', data);
    
    // Add to realtime updates list (keep last 10)
    setRealtimeUpdates(prev => [data, ...prev.slice(0, 9)]);
    
    // Trigger refresh if it's for this project
    if (data.projectId === projectId) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [projectId]);

  // Handle real-time project updates
  const handleRealtimeProjectUpdate = useCallback((data: ProjectUpdateEvent) => {
    console.log('Real-time project update:', data);
    
    // Trigger refresh if it's for this project
    if (data.projectId === projectId) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [projectId]);

  // Handle notifications
  const handleNotification = useCallback((data: NotificationEvent) => {
    console.log('Notification received:', data);
  }, []);

  // Setup WebSocket connection
  const { 
    connected, 
    connecting, 
    error,
    connect,
    disconnect,
    subscribeToProject,
    unsubscribeFromProject
  } = useWebSocket({
    autoConnect: true,
    projectIds: [projectId],
    onStatusUpdate: handleRealtimeStatusUpdate,
    onProjectUpdate: handleRealtimeProjectUpdate,
    onNotification: handleNotification,
    onConnect: () => console.log('WebSocket connected'),
    onDisconnect: (reason) => console.log('WebSocket disconnected:', reason),
    onError: (error) => console.error('WebSocket error:', error)
  });

  const handleOrderStatusUpdate = async (statusData: { primaryStatus: string; secondaryStatus: string }) => {
    await statusService.updateOrderStatus(projectId, statusData);
    handleStatusUpdate();
  };

  const handlePickupStatusUpdate = async (statusData: { primaryStatus: 'Picked' | 'Failed'; secondaryStatus: string }) => {
    await statusService.updatePickupStatus(projectId, statusData);
    handleStatusUpdate();
  };

  const handleDeliveryStatusUpdate = async (statusData: { 
    status: string; 
    time?: string; 
    address?: string; 
    po?: string; 
    deliveredBy?: string; 
  }) => {
    await statusService.updateDeliveryStatus(projectId, statusData);
    handleStatusUpdate();
  };

  const handleInspectionStatusUpdate = async (statusData: { status: string }) => {
    await statusService.updateCheckStatus(projectId, statusData);
    handleStatusUpdate();
  };

  return (
    <div className="status-management-demo">
      {/* WebSocket Status and Controls */}
      <div className="websocket-controls">
        <WebSocketIndicator showDetails={true} />
        
        <div className="connection-controls">
          {!connected && !connecting && (
            <button onClick={connect} className="btn btn-primary btn-sm">
              連接即時更新
            </button>
          )}
          
          {connected && (
            <button onClick={disconnect} className="btn btn-secondary btn-sm">
              斷開連接
            </button>
          )}
          
          {error && (
            <div className="connection-error">
              連接錯誤: {error}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Updates Panel */}
      {realtimeUpdates.length > 0 && (
        <div className="realtime-updates-panel">
          <h4>即時更新</h4>
          <div className="updates-list">
            {realtimeUpdates.slice(0, 5).map((update, index) => (
              <div key={`${update.projectId}-${update.timestamp}-${index}`} className="update-item">
                <span className="update-type">{update.statusType}</span>
                <span className="update-value">{update.statusValue}</span>
                <span className="update-user">{update.updatedByUsername}</span>
                <span className="update-time">
                  {new Date(update.timestamp).toLocaleTimeString('zh-TW')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="status-managers-grid">
        <OrderStatusManager
          projectId={projectId}
          onStatusUpdate={handleOrderStatusUpdate}
        />
        
        <PickupStatusManager
          projectId={projectId}
          onStatusUpdate={handlePickupStatusUpdate}
        />
        
        <DeliveryStatusManager
          projectId={projectId}
          onStatusUpdate={handleDeliveryStatusUpdate}
        />
        
        <InspectionStatusManager
          projectId={projectId}
          onStatusUpdate={handleInspectionStatusUpdate}
        />
      </div>

      <StatusHistory
        projectId={projectId}
        refreshTrigger={refreshTrigger}
      />

      {/* Notification Container */}
      <NotificationContainer 
        position="top-right"
        maxNotifications={5}
        autoClose={true}
        autoCloseDelay={5000}
      />
    </div>
  );
};

export default StatusManagementDemo;