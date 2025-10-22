import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useWebSocket } from '../../hooks/useWebSocket';
import './Dashboard.css';

interface SystemStats {
  totalUsers: number;
  totalMaterials: number;
  totalProjects: number;
  systemUptime: string;
}

interface UserActivity {
  id: string;
  username: string;
  role: string;
  action: string;
  timestamp: string;
  details?: string;
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  websocket: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalMaterials: 0,
    totalProjects: 0,
    systemUptime: '0 days'
  });
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    websocket: 'healthy',
    storage: 'healthy',
    api: 'healthy'
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Setup WebSocket for real-time updates
  const { connected, connectionInfo } = useWebSocket({
    autoConnect: false,
    onStatusUpdate: (data) => {
      console.log('Admin Dashboard received status update:', data);
      setRecentActivities(prev => [
        {
          id: Date.now(),
          type: 'status_update',
          message: `系統狀態更新：${data.updatedByUsername} (${data.updatedByRole}) 更新了 ${data.statusType}`,
          timestamp: data.timestamp,
          projectId: data.projectId
        },
        ...prev.slice(0, 9)
      ]);
    },
    onProjectUpdate: (data) => {
      console.log('Admin Dashboard received project update:', data);
      setRecentActivities(prev => [
        {
          id: Date.now(),
          type: 'project_update',
          message: `專案狀態變更：${data.projectName} -> ${data.overallStatus}`,
          timestamp: data.timestamp,
          projectId: data.projectId
        },
        ...prev.slice(0, 9)
      ]);
    }
  });

  useEffect(() => {
    loadDashboardData();
    
    // Update WebSocket health status
    setSystemHealth(prev => ({
      ...prev,
      websocket: connected ? 'healthy' : 'warning'
    }));
  }, [connected]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load mock data for now
      setSystemStats({
        totalUsers: 24,
        totalMaterials: 156,
        totalProjects: 89,
        systemUptime: '15 days 8 hours'
      });

      // Mock user activities
      setUserActivities([
        {
          id: 'activity-001',
          username: 'pm_user1',
          role: 'PM',
          action: '創建輔材訂單',
          timestamp: '2024-01-16T10:30:00Z',
          details: '辦公室裝修專案 A'
        },
        {
          id: 'activity-002',
          username: 'am_user2',
          role: 'AM',
          action: '更新供應商資訊',
          timestamp: '2024-01-16T11:15:00Z',
          details: '優質建材供應商'
        },
        {
          id: 'activity-003',
          username: 'warehouse_user1',
          role: 'WAREHOUSE',
          action: '更新取貨狀態',
          timestamp: '2024-01-16T12:00:00Z',
          details: 'Picked (B.T.W)'
        },
        {
          id: 'activity-004',
          username: 'admin_user',
          role: 'ADMIN',
          action: '新增材料項目',
          timestamp: '2024-01-16T13:45:00Z',
          details: '高級木材 - 橡木'
        }
      ]);

      // Mock system health (in real app, this would come from health check APIs)
      setSystemHealth({
        database: 'healthy',
        websocket: connected ? 'healthy' : 'warning',
        storage: 'healthy',
        api: 'healthy'
      });

    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      healthy: '#28a745',
      warning: '#ffc107',
      error: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getHealthStatusIcon = (status: string): string => {
    const icons: Record<string, string> = {
      healthy: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[status] || '❓';
  };

  const getHealthStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      healthy: '正常',
      warning: '警告',
      error: '錯誤'
    };
    return labels[status] || '未知';
  };

  const getRoleDisplayName = (role: string): string => {
    const roleNames: Record<string, string> = {
      PM: '專案經理',
      AM: '客戶經理',
      WAREHOUSE: '倉庫管理員',
      ADMIN: '系統管理員'
    };
    return roleNames[role] || role;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} 小時前`;
    return date.toLocaleDateString('zh-TW');
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>載入系統管理員儀表板...</p>
      </div>
    );
  }

  return (
    <div className="dashboard admin-dashboard">
      {/* Header */}
      <div className="dashboard-header admin-header">
        <div className="welcome-section">
          <h1>系統管理員儀表板</h1>
          <p className="dashboard-subtitle">
            系統監控 | 使用者管理 | 資料維護
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className="action-btn primary"
            onClick={() => navigate('/users')}
          >
            使用者管理
          </button>
          <button 
            className="action-btn secondary"
            onClick={() => navigate('/materials')}
          >
            材料管理
          </button>
        </div>
      </div>

      {/* System Stats */}
      <div className="stats-grid">
        <div className="stat-card admin-stat">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{systemStats.totalUsers}</h3>
            <p>系統使用者</p>
          </div>
        </div>
        
        <div className="stat-card admin-stat">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{systemStats.totalMaterials}</h3>
            <p>材料項目</p>
          </div>
        </div>
        
        <div className="stat-card admin-stat">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{systemStats.totalProjects}</h3>
            <p>總專案數</p>
          </div>
        </div>
        
        <div className="stat-card admin-stat">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>{systemStats.systemUptime}</h3>
            <p>系統運行時間</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* System Health */}
        <div className="dashboard-section system-health">
          <div className="section-header">
            <h3>系統健康狀態</h3>
            <button 
              className="view-all-btn"
              onClick={() => navigate('/system-monitor')}
            >
              詳細監控
            </button>
          </div>
          
          <div className="health-grid">
            <div className="health-item">
              <div className="health-icon">
                {getHealthStatusIcon(systemHealth.database)}
              </div>
              <div className="health-info">
                <h4>資料庫</h4>
                <span 
                  className="health-status"
                  style={{ color: getHealthStatusColor(systemHealth.database) }}
                >
                  {getHealthStatusLabel(systemHealth.database)}
                </span>
              </div>
            </div>
            
            <div className="health-item">
              <div className="health-icon">
                {getHealthStatusIcon(systemHealth.websocket)}
              </div>
              <div className="health-info">
                <h4>即時通訊</h4>
                <span 
                  className="health-status"
                  style={{ color: getHealthStatusColor(systemHealth.websocket) }}
                >
                  {getHealthStatusLabel(systemHealth.websocket)}
                </span>
                <small>連線數: {connectionInfo.connected ? 1 : 0}</small>
              </div>
            </div>
            
            <div className="health-item">
              <div className="health-icon">
                {getHealthStatusIcon(systemHealth.storage)}
              </div>
              <div className="health-info">
                <h4>檔案儲存</h4>
                <span 
                  className="health-status"
                  style={{ color: getHealthStatusColor(systemHealth.storage) }}
                >
                  {getHealthStatusLabel(systemHealth.storage)}
                </span>
              </div>
            </div>
            
            <div className="health-item">
              <div className="health-icon">
                {getHealthStatusIcon(systemHealth.api)}
              </div>
              <div className="health-info">
                <h4>API 服務</h4>
                <span 
                  className="health-status"
                  style={{ color: getHealthStatusColor(systemHealth.api) }}
                >
                  {getHealthStatusLabel(systemHealth.api)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Activities */}
        <div className="dashboard-section user-activities">
          <div className="section-header">
            <h3>使用者活動</h3>
            <button 
              className="view-all-btn"
              onClick={() => navigate('/audit-logs')}
            >
              查看日誌
            </button>
          </div>
          
          <div className="activities-list">
            {userActivities.map((activity) => (
              <div key={activity.id} className="activity-item admin-activity">
                <div className="activity-icon">
                  {activity.role === 'PM' ? '👨‍💼' : 
                   activity.role === 'AM' ? '👩‍💼' : 
                   activity.role === 'WAREHOUSE' ? '👷' : '👨‍💻'}
                </div>
                <div className="activity-content">
                  <div className="activity-header">
                    <span className="activity-user">{activity.username}</span>
                    <span className="activity-role">
                      ({getRoleDisplayName(activity.role)})
                    </span>
                    <span className="activity-time">
                      {formatDate(activity.timestamp)}
                    </span>
                  </div>
                  <p className="activity-action">{activity.action}</p>
                  {activity.details && (
                    <small className="activity-details">{activity.details}</small>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Activities */}
      <div className="dashboard-section recent-activities">
        <div className="section-header">
          <h3>系統即時動態</h3>
          <div className="connection-status">
            {connected ? (
              <span className="status-connected">● 即時監控中</span>
            ) : (
              <span className="status-disconnected">● 連線中斷</span>
            )}
          </div>
        </div>
        
        {recentActivities.length === 0 ? (
          <div className="no-activities">
            <p>暫無系統動態</p>
            {connected && <small>等待即時更新...</small>}
          </div>
        ) : (
          <div className="activities-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'status_update' ? '📋' : '📊'}
                </div>
                <div className="activity-content">
                  <p>{activity.message}</p>
                  <small>{formatTimestamp(activity.timestamp)}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3>管理功能</h3>
        <div className="quick-actions-grid admin-actions">
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/users')}
          >
            <span className="action-icon">👥</span>
            <span className="action-label">使用者管理</span>
          </button>
          
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/materials')}
          >
            <span className="action-icon">📦</span>
            <span className="action-label">材料管理</span>
          </button>
          
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/system-settings')}
          >
            <span className="action-icon">⚙️</span>
            <span className="action-label">系統設定</span>
          </button>
          
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/reports')}
          >
            <span className="action-icon">📈</span>
            <span className="action-label">系統報表</span>
          </button>
          
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/audit-logs')}
          >
            <span className="action-icon">📋</span>
            <span className="action-label">操作日誌</span>
          </button>
          
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/backup')}
          >
            <span className="action-icon">💾</span>
            <span className="action-label">資料備份</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;