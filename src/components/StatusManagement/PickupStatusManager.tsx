import React, { useState, useEffect } from 'react';
import StatusOperationHistory from './StatusOperationHistory';
import './StatusManagement.css';

interface PickupStatusManagerProps {
  projectId: string;
  currentStatus?: {
    primaryStatus: string;
    secondaryStatus: string;
  };
  onStatusUpdate: (status: { primaryStatus: string; secondaryStatus: string }) => Promise<void>;
  disabled?: boolean;
}

const PickupStatusManager: React.FC<PickupStatusManagerProps> = ({
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
    { value: 'Picked', label: 'Picked' },
    { value: 'Failed', label: 'Failed' }
  ];

  // Secondary status options based on primary selection
  const getSecondaryOptions = (primary: string) => {
    const baseOptions = [{ value: '', label: '請選擇結果' }];
    
    if (primary === 'Picked') {
      return [
        ...baseOptions,
        { value: '(B.T.W)', label: '(B.T.W)' },
        { value: '(D.T.S)', label: '(D.T.S)' },
        { value: '(B.T.W/MP)', label: '(B.T.W/MP)' },
        { value: '(D.T.S/MP)', label: '(D.T.S/MP)' }
      ];
    } else if (primary === 'Failed') {
      return [
        ...baseOptions,
        { value: '(E.S)', label: '(E.S)' },
        { value: '(E.H)', label: '(E.H)' }
      ];
    }
    
    return baseOptions;
  };

  const secondaryOptions = getSecondaryOptions(primaryStatus);

  useEffect(() => {
    if (currentStatus) {
      setPrimaryStatus(currentStatus.primaryStatus);
      setSecondaryStatus(currentStatus.secondaryStatus);
    }
  }, [currentStatus]);

  const handlePrimaryStatusChange = (value: string) => {
    setPrimaryStatus(value);
    // Reset secondary status when primary changes
    setSecondaryStatus('');
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

    if (primaryStatus && !secondaryStatus) {
      setError('請選擇處理結果');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onStatusUpdate({
        primaryStatus,
        secondaryStatus
      });
      // 觸發歷史記錄刷新
      setHistoryRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || '更新狀態時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const isSecondaryEnabled = primaryStatus !== '';
  const hasChanges = 
    primaryStatus !== (currentStatus?.primaryStatus || '') ||
    secondaryStatus !== (currentStatus?.secondaryStatus || '');

  return (
    <div className="status-manager pickup-status-manager">
      <div className="status-manager-header">
        <h3>取貨狀態管理</h3>
        <span className="status-type-badge pickup">PICKUP</span>
      </div>

      <div className="status-form">
        {/* Primary Status Dropdown */}
        <div className="form-group">
          <label htmlFor={`pickup-primary-${projectId}`}>取貨狀態</label>
          <select
            id={`pickup-primary-${projectId}`}
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
          <label htmlFor={`pickup-secondary-${projectId}`}>處理結果</label>
          <select
            id={`pickup-secondary-${projectId}`}
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
              請先選擇取貨狀態以啟用此選項
            </small>
          )}
        </div>

        {/* Current Status Display */}
        {currentStatus && (
          <div className="current-status">
            <h4>目前狀態</h4>
            <div className="status-display">
              <span className="primary-status pickup">
                {currentStatus.primaryStatus || '未設定'}
              </span>
              {currentStatus.secondaryStatus && (
                <>
                  <span className="status-separator"> </span>
                  <span className="secondary-status pickup">
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
          <li>第一個下拉選單可選擇 "Picked" 或 "Failed"</li>
          <li>當選擇 "Picked" 時，第二個下拉選單提供：(B.T.W)、(D.T.S)、(B.T.W/MP)、(D.T.S/MP) 四個選項</li>
          <li>當選擇 "Failed" 時，第二個下拉選單提供：(E.S)、(E.H) 兩個選項</li>
          <li>狀態更新會記錄時間和操作人員</li>
        </ul>
        
        <div className="status-codes-explanation">
          <h5>狀態代碼說明</h5>
          <div className="codes-grid">
            <div className="code-group">
              <strong>成功取貨 (Picked)：</strong>
              <ul>
                <li><code>(B.T.W)</code> - Back To Warehouse</li>
                <li><code>(D.T.S)</code> - Direct To Site</li>
                <li><code>(B.T.W/MP)</code> - Back To Warehouse / Missing Parts</li>
                <li><code>(D.T.S/MP)</code> - Direct To Site / Missing Parts</li>
              </ul>
            </div>
            <div className="code-group">
              <strong>取貨失敗 (Failed)：</strong>
              <ul>
                <li><code>(E.S)</code> - Equipment Shortage</li>
                <li><code>(E.H)</code> - Equipment Hold</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Operation History */}
      <StatusOperationHistory
        projectId={projectId}
        statusType="PICKUP"
        refreshTrigger={historyRefreshTrigger}
      />
    </div>
  );
};

export default PickupStatusManager;