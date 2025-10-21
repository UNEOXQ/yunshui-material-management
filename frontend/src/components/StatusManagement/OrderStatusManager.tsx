import React, { useState, useEffect } from 'react';
import StatusOperationHistory from './StatusOperationHistory';
import './StatusManagement.css';

interface OrderStatusManagerProps {
  projectId: string;
  currentStatus?: {
    primaryStatus: string;
    secondaryStatus: string;
  };
  onStatusUpdate: (status: { primaryStatus: string; secondaryStatus: string }) => Promise<void>;
  disabled?: boolean;
}

const OrderStatusManager: React.FC<OrderStatusManagerProps> = ({
  projectId,
  currentStatus,
  onStatusUpdate,
  disabled = false
}) => {
  const [primaryStatus, setPrimaryStatus] = useState<string>(currentStatus?.primaryStatus || '');
  const [secondaryStatus, setSecondaryStatus] = useState<string>(currentStatus?.secondaryStatus || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  // Primary status options
  const primaryOptions = [
    { value: '', label: '請選擇狀態' },
    { value: 'CLEAR', label: '　' },
    { value: 'Ordered', label: 'Ordered' }
  ];

  // Secondary status options (only available when primary is 'Ordered')
  const secondaryOptions = [
    { value: '', label: '請選擇處理狀態' },
    { value: 'Processing', label: 'Processing' },
    { value: 'waiting for pick', label: 'waiting for pick' },
    { value: 'pending', label: 'pending' }
  ];

  useEffect(() => {
    if (currentStatus) {
      setPrimaryStatus(currentStatus.primaryStatus);
      setSecondaryStatus(currentStatus.secondaryStatus);
    }
  }, [currentStatus]);

  const handlePrimaryStatusChange = (value: string) => {
    // Handle CLEAR option
    if (value === 'CLEAR') {
      setPrimaryStatus('');
      setSecondaryStatus('');
    } else {
      setPrimaryStatus(value);
      // Reset secondary status when primary changes
      if (value !== 'Ordered') {
        setSecondaryStatus('');
      }
    }
    setError(null);
  };

  const handleSecondaryStatusChange = (value: string) => {
    setSecondaryStatus(value);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!primaryStatus) {
      setError('請選擇主要狀態');
      return;
    }

    if (primaryStatus === 'Ordered' && !secondaryStatus) {
      setError('當狀態為 Ordered 時，請選擇處理狀態');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onStatusUpdate({
        primaryStatus,
        secondaryStatus: primaryStatus === 'Ordered' ? secondaryStatus : ''
      });
      // 觸發歷史記錄刷新
      setHistoryRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || '更新狀態時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const isSecondaryEnabled = primaryStatus === 'Ordered';
  const hasChanges = 
    primaryStatus !== (currentStatus?.primaryStatus || '') ||
    secondaryStatus !== (currentStatus?.secondaryStatus || '');

  return (
    <div className="status-manager order-status-manager">
      <div className="status-manager-header">
        <h3>叫貨狀態管理</h3>
        <span className="status-type-badge">ORDER</span>
      </div>

      <div className="status-form">
        {/* Primary Status Dropdown */}
        <div className="form-group">
          <label htmlFor={`primary-${projectId}`}>主要狀態</label>
          <select
            id={`primary-${projectId}`}
            value={primaryStatus}
            onChange={(e) => handlePrimaryStatusChange(e.target.value)}
            disabled={disabled || isLoading}
            className="status-select primary-select"
          >
            {primaryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Secondary Status Dropdown */}
        <div className="form-group">
          <label htmlFor={`secondary-${projectId}`}>處理狀態</label>
          <select
            id={`secondary-${projectId}`}
            value={secondaryStatus}
            onChange={(e) => handleSecondaryStatusChange(e.target.value)}
            disabled={disabled || isLoading || !isSecondaryEnabled}
            className={`status-select secondary-select ${!isSecondaryEnabled ? 'disabled' : ''}`}
          >
            {secondaryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {!isSecondaryEnabled && (
            <small className="help-text">
              請先選擇 "Ordered" 以啟用此選項
            </small>
          )}
        </div>

        {/* Current Status Display */}
        {currentStatus && (
          <div className="current-status">
            <h4>目前狀態</h4>
            <div className="status-display">
              <span className="primary-status">
                {currentStatus.primaryStatus || '未設定'}
              </span>
              {currentStatus.secondaryStatus && (
                <>
                  <span className="status-separator"> - </span>
                  <span className="secondary-status">
                    {currentStatus.secondaryStatus}
                  </span>
                </>
              )}
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
                setPrimaryStatus(currentStatus?.primaryStatus || '');
                setSecondaryStatus(currentStatus?.secondaryStatus || '');
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
          <li>第一個下拉選單可選擇 "Ordered" 或保持空白</li>
          <li>當選擇 "Ordered" 時，第二個下拉選單會啟用</li>
          <li>第二個下拉選單提供：Processing、waiting for pick、pending 三個選項</li>
          <li>狀態更新會記錄時間和操作人員</li>
        </ul>
      </div>

      {/* Operation History */}
      <StatusOperationHistory
        projectId={projectId}
        statusType="ORDER"
        refreshTrigger={historyRefreshTrigger}
      />
    </div>
  );
};

export default OrderStatusManager;