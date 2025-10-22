import React, { useState, useEffect } from 'react';
import StatusOperationHistory from './StatusOperationHistory';
import './StatusManagement.css';

interface DeliveryStatusManagerProps {
  projectId: string;
  currentStatus?: {
    status: string;
    time?: string;
    address?: string;
    po?: string;
    deliveredBy?: string;
  };
  onStatusUpdate: (status: {
    status: string;
    time?: string;
    address?: string;
    po?: string;
    deliveredBy?: string;
  }) => Promise<void>;
  disabled?: boolean;
}

const DeliveryStatusManager: React.FC<DeliveryStatusManagerProps> = ({
  projectId,
  currentStatus,
  onStatusUpdate,
  disabled = false
}) => {
  const [status, setStatus] = useState<string>(currentStatus?.status || '');
  const [time, setTime] = useState<string>(currentStatus?.time || '');
  const [address, setAddress] = useState<string>(currentStatus?.address || '');
  const [po, setPo] = useState<string>(currentStatus?.po || '');
  const [deliveredBy, setDeliveredBy] = useState<string>(currentStatus?.deliveredBy || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  // Status options
  const statusOptions = [
    { value: '', label: '請選擇狀態' },
    { value: 'CLEAR', label: '　' },
    { value: 'Delivered', label: 'Delivered' }
  ];

  useEffect(() => {
    if (currentStatus) {
      setStatus(currentStatus.status);
      setTime(currentStatus.time || '');
      setAddress(currentStatus.address || '');
      setPo(currentStatus.po || '');
      setDeliveredBy(currentStatus.deliveredBy || '');
    }
  }, [currentStatus]);

  const handleStatusChange = (value: string) => {
    // Handle CLEAR option
    if (value === 'CLEAR') {
      setStatus('');
      setTime('');
      setAddress('');
      setPo('');
      setDeliveredBy('');
    } else {
      setStatus(value);
      // Clear delivery details if status is not "Delivered"
      if (value !== 'Delivered') {
        setTime('');
        setAddress('');
        setPo('');
        setDeliveredBy('');
      }
    }
    setError(null);
    setFieldErrors({});
  };

  const validateDeliveryDetails = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (status === 'Delivered') {
      if (!time.trim()) {
        errors.time = '交付時間為必填項目';
      }
      if (!address.trim()) {
        errors.address = '交付地址為必填項目';
      }
      if (!po.trim()) {
        errors.po = 'P.O 編號為必填項目';
      }
      if (!deliveredBy.trim()) {
        errors.deliveredBy = '交付人員為必填項目';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setError(null);
    
    if (!validateDeliveryDetails()) {
      setError('請填寫所有必填欄位');
      return;
    }

    setIsLoading(true);

    try {
      const updateData: any = { status };
      
      if (status === 'Delivered') {
        updateData.time = time;
        updateData.address = address;
        updateData.po = po;
        updateData.deliveredBy = deliveredBy;
      }
      
      await onStatusUpdate(updateData);
      // 觸發歷史記錄刷新
      setHistoryRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || '更新狀態時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const isDeliveryDetailsEnabled = status === 'Delivered';
  const hasChanges = 
    status !== (currentStatus?.status || '') ||
    time !== (currentStatus?.time || '') ||
    address !== (currentStatus?.address || '') ||
    po !== (currentStatus?.po || '') ||
    deliveredBy !== (currentStatus?.deliveredBy || '');

  const formatDateTime = (dateTimeString: string): string => {
    if (!dateTimeString) return '';
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTimeString;
    }
  };

  return (
    <div className="status-manager delivery-status-manager">
      <div className="status-manager-header">
        <h3>到案狀態管理</h3>
        <span className="status-type-badge delivery">DELIVERY</span>
      </div>

      <div className="status-form">
        {/* Status Dropdown */}
        <div className="form-group delivery">
          <label htmlFor={`delivery-status-${projectId}`}>到案狀態</label>
          <select
            id={`delivery-status-${projectId}`}
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={disabled || isLoading}
            className="status-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>



        {/* Delivery Details Form */}
        {isDeliveryDetailsEnabled && (
          <div className="delivery-details">
            <h4>交付詳細資訊</h4>
            
            <div className="delivery-form-grid">
              {/* Time Field */}
              <div className="form-group">
                <label htmlFor={`delivery-time-${projectId}`}>
                  交付時間 <span className="required">*</span>
                </label>
                <input
                  type="datetime-local"
                  id={`delivery-time-${projectId}`}
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    setFieldErrors(prev => ({ ...prev, time: '' }));
                  }}
                  disabled={disabled || isLoading}
                  className={`form-input ${fieldErrors.time ? 'error' : ''}`}
                  placeholder="選擇交付時間"
                />
                {fieldErrors.time && (
                  <span className="field-error">{fieldErrors.time}</span>
                )}
              </div>

              {/* Address Field */}
              <div className="form-group">
                <label htmlFor={`delivery-address-${projectId}`}>
                  交付地址 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id={`delivery-address-${projectId}`}
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setFieldErrors(prev => ({ ...prev, address: '' }));
                  }}
                  disabled={disabled || isLoading}
                  className={`form-input ${fieldErrors.address ? 'error' : ''}`}
                  placeholder="輸入交付地址"
                />
                {fieldErrors.address && (
                  <span className="field-error">{fieldErrors.address}</span>
                )}
              </div>

              {/* P.O Field */}
              <div className="form-group">
                <label htmlFor={`delivery-po-${projectId}`}>
                  P.O 編號 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id={`delivery-po-${projectId}`}
                  value={po}
                  onChange={(e) => {
                    setPo(e.target.value);
                    setFieldErrors(prev => ({ ...prev, po: '' }));
                  }}
                  disabled={disabled || isLoading}
                  className={`form-input ${fieldErrors.po ? 'error' : ''}`}
                  placeholder="輸入 P.O 編號"
                />
                {fieldErrors.po && (
                  <span className="field-error">{fieldErrors.po}</span>
                )}
              </div>

              {/* Delivered By Field */}
              <div className="form-group">
                <label htmlFor={`delivery-by-${projectId}`}>
                  交付人員 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id={`delivery-by-${projectId}`}
                  value={deliveredBy}
                  onChange={(e) => {
                    setDeliveredBy(e.target.value);
                    setFieldErrors(prev => ({ ...prev, deliveredBy: '' }));
                  }}
                  disabled={disabled || isLoading}
                  className={`form-input ${fieldErrors.deliveredBy ? 'error' : ''}`}
                  placeholder="輸入交付人員姓名"
                />
                {fieldErrors.deliveredBy && (
                  <span className="field-error">{fieldErrors.deliveredBy}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Current Status Display */}
        {currentStatus && currentStatus.status && (
          <div className="current-status">
            <h4>目前狀態</h4>
            <div className="status-display">
              <span className="primary-status delivery">
                {currentStatus.status}
              </span>
              {currentStatus.status === 'Delivered' && (
                <div className="delivery-info">
                  <div className="delivery-info-grid">
                    <div className="info-item">
                      <strong>時間：</strong>
                      <span>{formatDateTime(currentStatus.time || '')}</span>
                    </div>
                    <div className="info-item">
                      <strong>地址：</strong>
                      <span>{currentStatus.address || '未設定'}</span>
                    </div>
                    <div className="info-item">
                      <strong>P.O：</strong>
                      <span>{currentStatus.po || '未設定'}</span>
                    </div>
                    <div className="info-item">
                      <strong>交付人員：</strong>
                      <span>{currentStatus.deliveredBy || '未設定'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-message delivery">
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
                setTime(currentStatus?.time || '');
                setAddress(currentStatus?.address || '');
                setPo(currentStatus?.po || '');
                setDeliveredBy(currentStatus?.deliveredBy || '');
                setError(null);
                setFieldErrors({});
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
          <li>下拉選單可選擇 "Delivered" 或保持空白</li>
          <li>當選擇 "Delivered" 時，必須填寫所有交付詳細資訊</li>
          <li>交付詳細資訊包含：時間、地址、P.O 編號、交付人員</li>
          <li>所有欄位都是必填項目，確保交付記錄的完整性</li>
          <li>狀態更新會記錄所有交付詳情</li>
        </ul>
      </div>

      {/* Operation History */}
      <StatusOperationHistory
        projectId={projectId}
        statusType="DELIVERY"
        refreshTrigger={historyRefreshTrigger}
      />
    </div>
  );
};

export default DeliveryStatusManager;