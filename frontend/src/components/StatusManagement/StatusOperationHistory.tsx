import React, { useState, useEffect } from 'react';
import { statusService } from '../../services/statusService';
import './StatusManagement.css';

interface StatusOperationHistoryProps {
  projectId: string;
  statusType: 'ORDER' | 'PICKUP' | 'DELIVERY' | 'CHECK';
  refreshTrigger?: number;
}

interface HistoryItem {
  id: string;
  statusType: string;
  statusValue: string;
  additionalData?: any;
  user: {
    username: string;
    role: string;
  };
  createdAt: string;
}

const StatusOperationHistory: React.FC<StatusOperationHistoryProps> = ({
  projectId,
  statusType,
  refreshTrigger = 0
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expanded) {
      loadHistory();
    }
  }, [expanded, projectId, statusType, refreshTrigger]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const projectHistory = await statusService.getProjectStatusHistory(projectId);
      if (projectHistory) {
        // 過濾出特定狀態類型的歷史記錄
        const filteredHistory = projectHistory.statusHistory.filter(
          (item: HistoryItem) => item.statusType === statusType
        );
        
        // 按時間排序（最新的在前）
        filteredHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setHistory(filteredHistory);
      }
    } catch (error: any) {
      console.error('Failed to load operation history:', error);
      setError('載入操作歷史失敗');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getRoleColor = (role: string): string => {
    const colors: Record<string, string> = {
      PM: '#007bff',
      AM: '#28a745',
      WAREHOUSE: '#ffc107',
      ADMIN: '#dc3545'
    };
    return colors[role] || '#6c757d';
  };

  const getStatusTypeDisplayName = (type: string): string => {
    const displayNames: Record<string, string> = {
      ORDER: '叫貨',
      PICKUP: '取貨',
      DELIVERY: '到案',
      CHECK: '點收',
    };
    return displayNames[type] || type;
  };

  const formatStatusValue = (statusType: string, statusValue: string, additionalData?: any): string => {
    if (statusType === 'DELIVERY' && additionalData) {
      let result = statusValue;
      if (additionalData.time) {
        result += ` (時間: ${formatTimestamp(additionalData.time)})`;
      }
      if (additionalData.address) {
        result += ` (地址: ${additionalData.address})`;
      }
      if (additionalData.po) {
        result += ` (P.O: ${additionalData.po})`;
      }
      if (additionalData.deliveredBy) {
        result += ` (交付人: ${additionalData.deliveredBy})`;
      }
      return result;
    }
    return statusValue;
  };

  return (
    <div className="status-operation-history">
      <button
        className="history-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <span>📋 {getStatusTypeDisplayName(statusType)}操作記錄</span>
        <span className={`toggle-icon ${expanded ? 'expanded' : ''}`}>▼</span>
        {history.length > 0 && (
          <span className="history-count">({history.length})</span>
        )}
      </button>

      {expanded && (
        <div className="history-content">
          {loading ? (
            <div className="history-loading">
              <div className="spinner"></div>
              <span>載入中...</span>
            </div>
          ) : error ? (
            <div className="history-error">
              <i className="error-icon">⚠️</i>
              <span>{error}</span>
              <button 
                onClick={loadHistory}
                className="btn btn-sm btn-secondary"
              >
                重試
              </button>
            </div>
          ) : history.length > 0 ? (
            <div className="history-list">
              {history.map((item, index) => (
                <div key={`${item.id}-${index}`} className="history-item">
                  <div className="history-header">
                    <div className="history-main-info">
                      <span className="history-description">
                        狀態更新為: <strong>{formatStatusValue(item.statusType, item.statusValue, item.additionalData)}</strong>
                      </span>
                    </div>
                    <div className="history-meta">
                      <span 
                        className="history-user"
                        style={{ color: getRoleColor(item.user.role) }}
                      >
                        {item.user.username} ({item.user.role})
                      </span>
                      <span className="history-timestamp">
                        {formatTimestamp(item.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  {item.additionalData && statusType === 'DELIVERY' && (
                    <div className="history-details">
                      <div className="delivery-details-display">
                        {item.additionalData.time && (
                          <div className="detail-row">
                            <strong>交付時間:</strong> {formatTimestamp(item.additionalData.time)}
                          </div>
                        )}
                        {item.additionalData.address && (
                          <div className="detail-row">
                            <strong>交付地址:</strong> {item.additionalData.address}
                          </div>
                        )}
                        {item.additionalData.po && (
                          <div className="detail-row">
                            <strong>P.O 編號:</strong> {item.additionalData.po}
                          </div>
                        )}
                        {item.additionalData.deliveredBy && (
                          <div className="detail-row">
                            <strong>交付人員:</strong> {item.additionalData.deliveredBy}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="history-empty">
              <div className="empty-icon">📝</div>
              <span>暫無{getStatusTypeDisplayName(statusType)}操作記錄</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusOperationHistory;