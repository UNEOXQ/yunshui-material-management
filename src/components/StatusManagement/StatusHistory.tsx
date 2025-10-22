import React, { useState, useEffect, useCallback } from 'react';
import { statusService, ProjectStatusHistory } from '../../services/statusService';
import { useWebSocket } from '../../hooks/useWebSocket';
import { StatusUpdateEvent, ProjectUpdateEvent } from '../../services/websocketService';
import './StatusManagement.css';

interface StatusHistoryProps {
  projectId: string;
  refreshTrigger?: number;
}

const StatusHistory: React.FC<StatusHistoryProps> = ({
  projectId,
  refreshTrigger = 0
}) => {
  const [statusHistory, setStatusHistory] = useState<ProjectStatusHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle real-time status updates
  const handleStatusUpdate = useCallback((data: StatusUpdateEvent) => {
    if (data.projectId === projectId) {
      console.log('Real-time status update received:', data);
      // Reload status history to get the latest data
      loadStatusHistory();
    }
  }, [projectId]);

  // Handle real-time project updates
  const handleProjectUpdate = useCallback((data: ProjectUpdateEvent) => {
    if (data.projectId === projectId) {
      console.log('Real-time project update received:', data);
      // Reload status history to get the latest data
      loadStatusHistory();
    }
  }, [projectId]);

  // Setup WebSocket connection for real-time updates
  const { subscribeToProject, unsubscribeFromProject } = useWebSocket({
    autoConnect: false, // Don't auto-connect, assume connection is managed elsewhere
    onStatusUpdate: handleStatusUpdate,
    onProjectUpdate: handleProjectUpdate
  });

  useEffect(() => {
    loadStatusHistory();
  }, [projectId, refreshTrigger]);

  // Subscribe to project updates when component mounts or projectId changes
  useEffect(() => {
    if (projectId) {
      subscribeToProject(projectId);
      
      return () => {
        unsubscribeFromProject(projectId);
      };
    }
  }, [projectId, subscribeToProject, unsubscribeFromProject]);

  const loadStatusHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const history = await statusService.getProjectStatusHistory(projectId);
      setStatusHistory(history);
    } catch (err: any) {
      setError(err.message || '載入狀態歷史時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusTypeDisplayName = (statusType: string): string => {
    return statusService.getStatusTypeDisplayName(statusType);
  };

  const getStatusTypeColor = (statusType: string): string => {
    return statusService.getStatusTypeColor(statusType);
  };

  if (isLoading) {
    return (
      <div className="status-history">
        <h3>狀態歷史</h3>
        <div className="loading-state">
          <div className="spinner"></div>
          <span>載入中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-history">
        <h3>狀態歷史</h3>
        <div className="error-message">
          <i className="error-icon">⚠️</i>
          {error}
        </div>
        <button 
          onClick={loadStatusHistory}
          className="btn btn-secondary"
        >
          重新載入
        </button>
      </div>
    );
  }

  if (!statusHistory) {
    return (
      <div className="status-history">
        <h3>狀態歷史</h3>
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-message">無狀態歷史記錄</div>
        </div>
      </div>
    );
  }

  return (
    <div className="status-history">
      <div className="status-history-header">
        <h3>狀態歷史</h3>
        <div className="project-info">
          <span className="project-name">{statusHistory.project.projectName}</span>
          <span className={`project-status ${statusHistory.project.overallStatus.toLowerCase()}`}>
            {statusHistory.project.overallStatus}
          </span>
        </div>
      </div>

      {/* Current Status Summary */}
      <div className="current-status-summary">
        <h4>目前狀態</h4>
        <div className="status-grid">
          {Object.entries(statusHistory.latestStatuses).map(([type, status]) => (
            <div key={type} className="status-item">
              <div 
                className="status-type-label"
                style={{ backgroundColor: getStatusTypeColor(type) }}
              >
                {getStatusTypeDisplayName(type)}
              </div>
              <div className="status-value">
                {status ? statusService.formatStatusDisplay(type, status.statusValue) : '未設定'}
              </div>
              {status && (
                <div className="status-time">
                  {formatDateTime(status.createdAt)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detailed History */}
      <div className="detailed-history">
        <h4>詳細歷史記錄</h4>
        {statusHistory.statusHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-message">尚無狀態更新記錄</div>
          </div>
        ) : (
          <div className="history-timeline">
            {statusHistory.statusHistory.map((item, index) => (
              <div key={item.id} className="status-history-item">
                <div className="timeline-marker">
                  <div 
                    className="timeline-dot"
                    style={{ backgroundColor: getStatusTypeColor(item.statusType) }}
                  ></div>
                  {index < statusHistory.statusHistory.length - 1 && (
                    <div className="timeline-line"></div>
                  )}
                </div>
                
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span 
                      className="status-type-badge"
                      style={{ backgroundColor: getStatusTypeColor(item.statusType) }}
                    >
                      {getStatusTypeDisplayName(item.statusType)}
                    </span>
                    <span className="timeline-time">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                  
                  <div className="timeline-body">
                    <div className="status-value">
                      {statusService.formatStatusDisplay(item.statusType, item.statusValue)}
                    </div>
                    
                    {item.additionalData && (
                      <div className="additional-data">
                        <strong>詳細資訊：</strong>
                        <pre>{JSON.stringify(item.additionalData, null, 2)}</pre>
                      </div>
                    )}
                    
                    <div className="updated-by">
                      更新者：{item.user.username} ({item.user.role})
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="history-actions">
        <button 
          onClick={loadStatusHistory}
          className="btn btn-secondary"
          disabled={isLoading}
        >
          {isLoading ? '載入中...' : '重新整理'}
        </button>
      </div>
    </div>
  );
};

export default StatusHistory;