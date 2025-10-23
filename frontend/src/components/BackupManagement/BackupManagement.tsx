import React, { useState, useEffect } from 'react';
import './BackupManagement.css';

interface BackupStatus {
  isInitialized: boolean;
  lastBackupTime: number;
  nextBackupTime: number;
  backupInterval: number;
  lastBackupTimeFormatted: string;
  nextBackupTimeFormatted: string;
}

interface RecoveryStatus {
  lastRecoveryTime: number;
  lastRecoveryResult: RecoveryResult | null;
  isRecovering: boolean;
  autoRecoveryEnabled: boolean;
  lastRecoveryTimeFormatted: string;
}

interface RecoveryResult {
  success: boolean;
  timestamp: string;
  statistics: {
    materialsRecovered: number;
    ordersRecovered: number;
    usersRecovered: number;
    statusUpdatesRecovered: number;
    messagesRecovered: number;
  };
  errors?: string[];
}

interface BackupInfo {
  date: string;
  timestamp: string;
  size: number;
  dataCount: {
    materials: number;
    orders: number;
    users: number;
    statusUpdates: number;
    messages: number;
  };
}

export const BackupManagement: React.FC = () => {
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus | null>(null);
  const [availableBackups, setAvailableBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBackupDate, setSelectedBackupDate] = useState<string>('');

  // 獲取備份狀態
  const fetchBackupStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
      const response = await fetch(`${API_URL}/backup/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setBackupStatus(result.data);
      } else {
        setError(result.message || '獲取備份狀態失敗');
      }
    } catch (err: any) {
      setError('網絡錯誤：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 獲取恢復狀態
  const fetchRecoveryStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
      const response = await fetch(`${API_URL}/backup/recovery-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setRecoveryStatus(result.data);
      }
    } catch (err: any) {
      console.warn('獲取恢復狀態失敗:', err.message);
    }
  };

  // 獲取可用備份列表
  const fetchAvailableBackups = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
      const response = await fetch(`${API_URL}/backup/available`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setAvailableBackups(result.data);
      }
    } catch (err: any) {
      console.warn('獲取可用備份列表失敗:', err.message);
    }
  };

  // 手動觸發備份
  const triggerManualBackup = async () => {
    try {
      setTriggering(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
      const response = await fetch(`${API_URL}/backup/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ 備份已成功完成！');
        // 重新獲取狀態和備份列表
        await fetchBackupStatus();
        await fetchAvailableBackups(); // 重新獲取備份列表
      } else {
        setError(result.message || '備份失敗');
      }
    } catch (err: any) {
      setError('備份過程中發生錯誤：' + err.message);
    } finally {
      setTriggering(false);
    }
  };

  // 手動恢復數據（使用新的恢復 API）
  const triggerManualRecover = async (backupDate?: string) => {
    const dateText = backupDate ? `指定日期 (${backupDate})` : '最新';
    
    if (!confirm(`⚠️ 確定要從${dateText}備份恢復數據嗎？\n\n這將會：\n• 備份當前數據\n• 從${dateText}備份恢復數據\n• 此操作可能覆蓋當前數據\n\n請確認是否繼續？`)) {
      return;
    }

    try {
      setTriggering(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const body = backupDate ? JSON.stringify({ backupDate }) : '{}';
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
      
      const response = await fetch(`${API_URL}/backup/recover`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body,
      });

      const result = await response.json();
      
      if (result.success) {
        const stats = result.data?.statistics;
        let message = '✅ 數據已成功從備份恢復！\n\n';
        
        if (stats) {
          message += `恢復統計：\n`;
          message += `• 材料: ${stats.materialsRecovered} 個\n`;
          message += `• 訂單: ${stats.ordersRecovered} 個\n`;
          message += `• 用戶: ${stats.usersRecovered} 個\n`;
          message += `• 狀態更新: ${stats.statusUpdatesRecovered} 個\n`;
          message += `• 消息: ${stats.messagesRecovered} 條\n\n`;
        }
        
        message += '建議刷新頁面以查看最新數據。';
        alert(message);
        
        // 重新獲取狀態
        await fetchBackupStatus();
        await fetchRecoveryStatus();
        await fetchAvailableBackups(); // 重新獲取備份列表
        
        // 建議用戶刷新頁面
        if (confirm('是否要刷新頁面以查看恢復的數據？')) {
          window.location.reload();
        }
      } else {
        const errorMsg = result.errors ? result.errors.join('\n') : result.message || '數據恢復失敗';
        setError(errorMsg);
      }
    } catch (err: any) {
      setError('恢復過程中發生錯誤：' + err.message);
    } finally {
      setTriggering(false);
    }
  };

  // 組件載入時獲取狀態
  useEffect(() => {
    fetchBackupStatus();
    fetchRecoveryStatus();
    fetchAvailableBackups();
    
    // 每分鐘更新一次狀態
    const interval = setInterval(() => {
      fetchBackupStatus();
      fetchRecoveryStatus();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // 計算下次備份倒計時
  const getCountdown = () => {
    if (!backupStatus?.nextBackupTime) return null;
    
    const now = Date.now();
    const timeLeft = backupStatus.nextBackupTime - now;
    
    if (timeLeft <= 0) return '即將備份...';
    
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    
    return `${minutes}分${seconds}秒`;
  };

  return (
    <div className="backup-management">
      <div className="backup-header">
        <h2>📂 GitHub 自動備份</h2>
        <p>數據自動備份到 GitHub，確保永不丟失</p>
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>載入備份狀態中...</p>
        </div>
      ) : backupStatus ? (
        <div className="backup-content">
          {/* 備份狀態卡片 */}
          <div className="status-card">
            <div className="status-header">
              <h3>🔄 備份狀態</h3>
              <div className={`status-indicator ${backupStatus.isInitialized ? 'active' : 'inactive'}`}>
                {backupStatus.isInitialized ? '✅ 已啟用' : '❌ 未配置'}
              </div>
            </div>
            
            {backupStatus.isInitialized ? (
              <div className="status-details">
                <div className="status-item">
                  <span className="label">📅 上次備份:</span>
                  <span className="value">{backupStatus.lastBackupTimeFormatted}</span>
                </div>
                <div className="status-item">
                  <span className="label">⏰ 下次備份:</span>
                  <span className="value">{backupStatus.nextBackupTimeFormatted}</span>
                </div>
                <div className="status-item">
                  <span className="label">⏱️ 倒計時:</span>
                  <span className="value countdown">{getCountdown()}</span>
                </div>
                <div className="status-item">
                  <span className="label">🔄 備份間隔:</span>
                  <span className="value">{Math.floor(backupStatus.backupInterval / 60000)} 分鐘</span>
                </div>
              </div>
            ) : (
              <div className="not-configured">
                <p>⚠️ GitHub 備份尚未配置</p>
                <p>請聯繫管理員設置 GitHub Token 和倉庫信息</p>
              </div>
            )}
          </div>

          {/* 恢復狀態卡片 */}
          {recoveryStatus && (
            <div className="status-card recovery-status">
              <div className="status-header">
                <h3>📥 恢復狀態</h3>
                <div className={`status-indicator ${recoveryStatus.autoRecoveryEnabled ? 'active' : 'inactive'}`}>
                  {recoveryStatus.autoRecoveryEnabled ? '🔄 自動恢復已啟用' : '⏸️ 自動恢復已禁用'}
                </div>
              </div>
              
              <div className="status-details">
                <div className="status-item">
                  <span className="label">📅 上次恢復:</span>
                  <span className="value">{recoveryStatus.lastRecoveryTimeFormatted}</span>
                </div>
                
                {recoveryStatus.isRecovering && (
                  <div className="status-item">
                    <span className="label">🔄 當前狀態:</span>
                    <span className="value recovering">
                      <div className="inline-spinner"></div>
                      恢復進行中...
                    </span>
                  </div>
                )}
                
                {recoveryStatus.lastRecoveryResult && (
                  <div className="recovery-result">
                    <div className="status-item">
                      <span className="label">📊 上次恢復結果:</span>
                      <span className={`value ${recoveryStatus.lastRecoveryResult.success ? 'success' : 'error'}`}>
                        {recoveryStatus.lastRecoveryResult.success ? '✅ 成功' : '❌ 失敗'}
                      </span>
                    </div>
                    
                    {recoveryStatus.lastRecoveryResult.success && recoveryStatus.lastRecoveryResult.statistics && (
                      <div className="recovery-statistics">
                        <h5>恢復統計:</h5>
                        <div className="stats-grid">
                          <div className="stat-item">
                            <span className="stat-number">{recoveryStatus.lastRecoveryResult.statistics.materialsRecovered}</span>
                            <span className="stat-label">材料</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-number">{recoveryStatus.lastRecoveryResult.statistics.ordersRecovered}</span>
                            <span className="stat-label">訂單</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-number">{recoveryStatus.lastRecoveryResult.statistics.usersRecovered}</span>
                            <span className="stat-label">用戶</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-number">{recoveryStatus.lastRecoveryResult.statistics.messagesRecovered}</span>
                            <span className="stat-label">消息</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {recoveryStatus.lastRecoveryResult.errors && recoveryStatus.lastRecoveryResult.errors.length > 0 && (
                      <div className="recovery-errors">
                        <h5>錯誤信息:</h5>
                        <ul>
                          {recoveryStatus.lastRecoveryResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 手動備份和恢復 */}
          {backupStatus.isInitialized && (
            <div className="manual-operations-card">
              <h3>🚀 手動操作</h3>
              
              <div className="operation-section">
                <h4>💾 手動備份</h4>
                <p>立即執行一次備份，無需等待定時備份</p>
                <button
                  className="backup-button"
                  onClick={triggerManualBackup}
                  disabled={triggering}
                >
                  {triggering ? (
                    <>
                      <div className="button-spinner"></div>
                      備份中...
                    </>
                  ) : (
                    <>
                      💾 立即備份
                    </>
                  )}
                </button>
              </div>

              <div className="operation-section">
                <h4>📥 數據恢復</h4>
                <p>從備份恢復數據（⚠️ 會備份當前數據後再恢復）</p>
                
                {/* 快速恢復 */}
                <div className="recovery-option">
                  <h5>🚀 快速恢復（最新備份）</h5>
                  <button
                    className="restore-button"
                    onClick={() => triggerManualRecover()}
                    disabled={triggering}
                  >
                    {triggering ? (
                      <>
                        <div className="button-spinner"></div>
                        恢復中...
                      </>
                    ) : (
                      <>
                        📥 從最新備份恢復
                      </>
                    )}
                  </button>
                </div>

                {/* 選擇性恢復 */}
                {availableBackups.length > 0 && (
                  <div className="recovery-option">
                    <h5>🎯 選擇性恢復</h5>
                    <div className="backup-selector">
                      <select
                        value={selectedBackupDate}
                        onChange={(e) => setSelectedBackupDate(e.target.value)}
                        disabled={triggering}
                      >
                        <option value="">選擇備份日期...</option>
                        {availableBackups.map((backup) => (
                          <option key={backup.date} value={backup.date}>
                            {backup.date} - {new Date(backup.timestamp).toLocaleString('zh-TW')}
                            {' '}({backup.dataCount.materials}材料, {backup.dataCount.orders}訂單)
                          </option>
                        ))}
                      </select>
                      <button
                        className="restore-button secondary"
                        onClick={() => triggerManualRecover(selectedBackupDate)}
                        disabled={triggering || !selectedBackupDate}
                      >
                        📥 恢復選定備份
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 備份說明 */}
          <div className="backup-info-card">
            <h3>ℹ️ 備份說明</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="icon">🔒</span>
                <div>
                  <strong>數據安全</strong>
                  <p>所有數據加密存儲在 GitHub 私有倉庫</p>
                </div>
              </div>
              <div className="info-item">
                <span className="icon">⏰</span>
                <div>
                  <strong>自動備份</strong>
                  <p>每 30 分鐘自動備份一次，無需手動操作</p>
                </div>
              </div>
              <div className="info-item">
                <span className="icon">📚</span>
                <div>
                  <strong>版本歷史</strong>
                  <p>保留完整的備份歷史，可追溯任何時間點</p>
                </div>
              </div>
              <div className="info-item">
                <span className="icon">🔄</span>
                <div>
                  <strong>自動恢復</strong>
                  <p>服務重啟時自動從最新備份恢復數據</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-data">
          <p>無法載入備份狀態</p>
          <button onClick={fetchBackupStatus}>重試</button>
        </div>
      )}
    </div>
  );
};