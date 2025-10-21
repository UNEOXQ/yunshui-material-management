import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useWebSocket } from '../../hooks/useWebSocket';
import './Dashboard.css';

interface StatusTask {
  id: string;
  projectId: string;
  projectName: string;
  taskType: 'ORDER' | 'PICKUP' | 'DELIVERY' | 'CHECK';
  currentStatus: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  assignedTo?: string;
}

interface DashboardStats {
  pendingTasks: number;
  completedToday: number;
  activeProjects: number;
  overdueItems: number;
}

const WarehouseDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    pendingTasks: 0,
    completedToday: 0,
    activeProjects: 0,
    overdueItems: 0
  });
  const [pendingTasks, setPendingTasks] = useState<StatusTask[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock WebSocket connection for now
  const connected = true;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load mock data for now
      setStats({
        pendingTasks: 15,
        completedToday: 8,
        activeProjects: 23,
        overdueItems: 2
      });

      // Mock pending tasks data
      setPendingTasks([
        {
          id: 'task-001',
          projectId: 'proj-001',
          projectName: '辦公室裝修專案 A',
          taskType: 'ORDER',
          currentStatus: 'Ordered - Processing',
          priority: 'HIGH',
          createdAt: '2024-01-16T09:30:00Z'
        },
        {
          id: 'task-002',
          projectId: 'proj-002',
          projectName: '商業空間改造 B',
          taskType: 'PICKUP',
          currentStatus: 'Picked (B.T.W)',
          priority: 'MEDIUM',
          createdAt: '2024-01-16T10:15:00Z'
        },
        {
          id: 'task-003',
          projectId: 'proj-003',
          projectName: '高端住宅完成材專案',
          taskType: 'DELIVERY',
          currentStatus: 'Delivered',
          priority: 'HIGH',
          createdAt: '2024-01-16T11:00:00Z'
        },
        {
          id: 'task-004',
          projectId: 'proj-004',
          projectName: '商業大樓裝修材料',
          taskType: 'CHECK',
          currentStatus: '',
          priority: 'LOW',
          createdAt: '2024-01-16T14:20:00Z'
        }
      ]);

    } catch (error) {
      console.error('Failed to load warehouse dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusTypeDisplayName = (statusType: string): string => {
    const displayNames: Record<string, string> = {
      ORDER: '叫貨',
      PICKUP: '取貨',
      DELIVERY: '到案',
      CHECK: '點收'
    };
    return displayNames[statusType] || statusType;
  };

  const getTaskTypeIcon = (taskType: string): string => {
    const icons: Record<string, string> = {
      ORDER: '📋',
      PICKUP: '📦',
      DELIVERY: '🚚',
      CHECK: '✅'
    };
    return icons[taskType] || '📄';
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      HIGH: '#dc3545',
      MEDIUM: '#ffc107',
      LOW: '#28a745'
    };
    return colors[priority] || '#6c757d';
  };

  const getPriorityLabel = (priority: string): string => {
    const labels: Record<string, string> = {
      HIGH: '高',
      MEDIUM: '中',
      LOW: '低'
    };
    return labels[priority] || priority;
  };

  const handleTaskClick = (task: StatusTask) => {
    navigate(`/status-management?project=${task.projectId}&type=${task.taskType}`);
  };

  const handleViewAllTasks = () => {
    navigate('/status-management');
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
        <p>載入倉庫管理員儀表板...</p>
      </div>
    );
  }

  return (
    <div className="dashboard warehouse-dashboard">
      {/* Header */}
      <div className="dashboard-header warehouse-header">
        <div className="welcome-section">
          <h1>倉庫管理員儀表板</h1>
          <p className="dashboard-subtitle">
            狀態管理 | 物流追蹤 | 作業監控
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className="action-btn primary"
            onClick={handleViewAllTasks}
          >
            狀態管理中心
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card warehouse-stat">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingTasks}</h3>
            <p>待處理任務</p>
          </div>
        </div>
        
        <div className="stat-card warehouse-stat">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedToday}</h3>
            <p>今日完成</p>
          </div>
        </div>
        
        <div className="stat-card warehouse-stat">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.activeProjects}</h3>
            <p>進行中專案</p>
          </div>
        </div>
        
        <div className="stat-card warehouse-stat urgent">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <h3>{stats.overdueItems}</h3>
            <p>逾期項目</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Pending Tasks */}
        <div className="dashboard-section pending-tasks">
          <div className="section-header">
            <h3>待處理任務</h3>
            <button 
              className="view-all-btn"
              onClick={handleViewAllTasks}
            >
              查看全部
            </button>
          </div>
          
          <div className="tasks-list">
            {pendingTasks.map((task) => (
              <div 
                key={task.id} 
                className="task-card"
                onClick={() => handleTaskClick(task)}
              >
                <div className="task-header">
                  <div className="task-type">
                    <span className="task-icon">
                      {getTaskTypeIcon(task.taskType)}
                    </span>
                    <span className="task-type-label">
                      {getStatusTypeDisplayName(task.taskType)}
                    </span>
                  </div>
                  
                  <div className="task-priority">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {getPriorityLabel(task.priority)}
                    </span>
                  </div>
                </div>
                
                <div className="task-content">
                  <h4 className="task-project">{task.projectName}</h4>
                  <div className="task-status">
                    <span className="status-label">目前狀態：</span>
                    <span className="status-value">
                      {task.currentStatus || '待處理'}
                    </span>
                  </div>
                  <div className="task-meta">
                    <span className="task-date">
                      {formatDate(task.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="dashboard-section recent-activities">
          <div className="section-header">
            <h3>即時動態</h3>
            <div className="connection-status">
              {connected ? (
                <span className="status-connected">● 即時更新中</span>
              ) : (
                <span className="status-disconnected">● 連線中斷</span>
              )}
            </div>
          </div>
          
          {recentActivities.length === 0 ? (
            <div className="no-activities">
              <p>暫無最新動態</p>
              {connected && <small>等待即時更新...</small>}
            </div>
          ) : (
            <div className="activities-list">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="activity-item warehouse-activity">
                  <div className="activity-icon">
                    {activity.type === 'status_update' ? '📋' : '📊'}
                  </div>
                  <div className="activity-content">
                    <p>{activity.message}</p>
                    {activity.statusType && activity.statusValue && (
                      <div className="activity-details">
                        <span className="detail-label">
                          {getStatusTypeDisplayName(activity.statusType)}:
                        </span>
                        <span className="detail-value">
                          {activity.statusValue}
                        </span>
                      </div>
                    )}
                    <small>{formatTimestamp(activity.timestamp)}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <div className="dashboard-section status-overview">
        <div className="section-header">
          <h3>狀態總覽</h3>
        </div>
        
        <div className="status-grid">
          <div className="status-item">
            <div className="status-icon">📋</div>
            <div className="status-info">
              <h4>叫貨狀態</h4>
              <p>5 個專案待處理</p>
            </div>
          </div>
          
          <div className="status-item">
            <div className="status-icon">📦</div>
            <div className="status-info">
              <h4>取貨狀態</h4>
              <p>3 個專案待處理</p>
            </div>
          </div>
          
          <div className="status-item">
            <div className="status-icon">🚚</div>
            <div className="status-info">
              <h4>到案狀態</h4>
              <p>4 個專案待處理</p>
            </div>
          </div>
          
          <div className="status-item">
            <div className="status-icon">✅</div>
            <div className="status-info">
              <h4>點收狀態</h4>
              <p>3 個專案待處理</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3>快速操作</h3>
        <div className="quick-actions-grid">
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/status-management?type=ORDER')}
          >
            <span className="action-icon">📋</span>
            <span className="action-label">叫貨管理</span>
          </button>
          
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/status-management?type=PICKUP')}
          >
            <span className="action-icon">📦</span>
            <span className="action-label">取貨管理</span>
          </button>
          
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/status-management?type=DELIVERY')}
          >
            <span className="action-icon">🚚</span>
            <span className="action-label">到案管理</span>
          </button>
          
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/status-management?type=CHECK')}
          >
            <span className="action-icon">✅</span>
            <span className="action-label">點收管理</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarehouseDashboard;