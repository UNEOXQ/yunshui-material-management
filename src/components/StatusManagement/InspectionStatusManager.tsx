import React, { useState, useEffect } from 'react';
import StatusOperationHistory from './StatusOperationHistory';
import './StatusManagement.css';

interface InspectionStatusManagerProps {
  projectId: string;
  currentStatus?: {
    status: string;
  };
  onStatusUpdate: (status: { status: string }) => Promise<void>;
  disabled?: boolean;
}

const InspectionStatusManager: React.FC<InspectionStatusManagerProps> = ({
  projectId,
  currentStatus,
  onStatusUpdate,
  disabled = false
}) => {
  const [status, setStatus] = useState<string>(currentStatus?.status || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  // Status options for inspection
  const statusOptions = [
    { value: '', label: '請選擇點收狀態' },
    { value: 'Check and sign(C.B/PM)', label: 'Check and sign(C.B/PM)' },
    { value: '(C.B)', label: '(C.B)' },
    { value: 'WH)', label: 'WH)' }
  ];

  useEffect(() => {
    if (currentStatus) {
      setStatus(currentStatus.status);
    }
  }, [currentStatus]);

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!status) {
      setError('請選擇點收狀態');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onStatusUpdate({ status });
      // 觸發歷史記錄刷新
      setHistoryRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || '更新狀態時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = status !== (currentStatus?.status || '');
  const isProjectCompleted = status !== '';

  return (
    <div className="status-manager inspection-status-manager">
      <div className="status-manager-header">
        <h3>點收狀態管理</h3>
        <span className="status-type-badge inspection">CHECK</span>
      </div>

      <div className="status-form">
        {/* Status Dropdown */}
        <div className="form-group">
          <label htmlFor={`inspection-${projectId}`}>點收狀態</label>
          <select
            id={`inspection-${projectId}`}
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={disabled || isLoading}
            className="status-select inspection-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Project Completion Notice */}
        {isProjectCompleted && (
          <div className="completion-notice">
            <div className="notice-content">
              <i className="completion-icon">✅</i>
              <div className="notice-text">
                <strong>專案完成標記</strong>
                <p>選擇點收狀態後，此專案將被標記為完成狀態</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Status Display */}
        {currentStatus && currentStatus.status && (
          <div className="current-status">
            <h4>目前狀態</h4>
            <div className="status-display">
              <span className="inspection-status">
                {currentStatus.status}
              </span>
              <span className="completion-badge">已完成</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <i className="error-icon">⚠️</i>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || isLoading || !hasChanges}
            className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                更新中...
              </>
            ) : (
              '更新狀態'
            )}
          </button>
          
          {hasChanges && (
            <button
              type="button"
              onClick={() => {
                setStatus(currentStatus?.status || '');
                setError(null);
              }}
              disabled={disabled || isLoading}
              className="btn btn-secondary"
            >
              重置
            </button>
          )}
        </div>
      </div>

      {/* Status Rules Info */}
      <div className="status-rules">
        <h4>狀態規則說明</h4>
        <ul>
          <li>點收狀態提供三個選項：Check and sign(C.B/PM)、(C.B)、WH)</li>
          <li>選擇任一點收狀態後，專案將被標記為完成狀態</li>
          <li>狀態更新會記錄時間和操作人員</li>
          <li>點收完成後代表整個物流流程結束</li>
        </ul>
      </div>

      {/* Operation History */}
      <StatusOperationHistory
        projectId={projectId}
        statusType="CHECK"
        refreshTrigger={historyRefreshTrigger}
      />
    </div>
  );
};

export default InspectionStatusManager;