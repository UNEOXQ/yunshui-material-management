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

export const BackupManagement: React.FC = () => {
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 獲取備份狀態
  const fetchBackupStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/backup/status', {
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

  // 手動觸發備份
  const triggerManualBackup = async () => {
    try {
      setTriggering(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/backup/trigger', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ 備份已成功完成！');
        // 重新獲取狀態
        await fetchBackupStatus();
      } else {
        setError(result.message || '備份失敗');
      }
    } catch (err: any) {
      setError('備份過程中發生錯誤：' + err.message);
    } finally {
      setTriggering(false);
    }
  };

  // 組件載入時獲取狀態
  useEffect(() => {
    fetchBackupStatus();
    
    // 每分鐘更新一次狀態
    const interval = setInterval(fetchBackupStatus, 60000);
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

          {/* 手動備份 */}
          {backupStatus.isInitialized && (
            <div className="manual-backup-card">
              <h3>🚀 手動備份</h3>
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