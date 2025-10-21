import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useWebSocket } from '../../hooks/useWebSocket';
// import { orderService } from '../../services/orderService';
// import { statusService } from '../../services/statusService';
import './Dashboard.css';

interface ProjectOverview {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  orderStatus: string;
  pickupStatus: string;
  deliveryStatus: string;
  checkStatus: string;
}

interface DashboardStats {
  totalOrders: number;
  activeProjects: number;
  completedProjects: number;
  pendingApprovals: number;
}

const PMDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingApprovals: 0
  });
  const [recentProjects, setRecentProjects] = useState<ProjectOverview[]>([]);
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
      
      // Load mock data for now (in real app, these would be API calls)
      setStats({
        totalOrders: 28,
        activeProjects: 12,
        completedProjects: 16,
        pendingApprovals: 3
      });

      // Mock recent projects data
      setRecentProjects([
        {
          id: 'proj-001',
          name: '辦公室裝修專案 A',
          status: 'ACTIVE',
          createdAt: '2024-01-15T10:30:00Z',
          orderStatus: 'Ordered - Processing',
          pickupStatus: 'Picked (B.T.W)',
          deliveryStatus: '',
          checkStatus: ''
        },
        {
          id: 'proj-002',
          name: '商業空間改造 B',
          status: 'ACTIVE',
          createdAt: '2024-01-14T14:20:00Z',
          orderStatus: 'Ordered - waiting for pick',
          pickupStatus: '',
          deliveryStatus: '',
          checkStatus: ''
        },
        {
          id: 'proj-003',
          name: '住宅翻新專案 C',
          status: 'COMPLETED',
          createdAt: '2024-01-10T09:15:00Z',
          orderStatus: 'Ordered - Processing',
          pickupStatus: 'Picked (D.T.S)',
          deliveryStatus: 'Delivered',
          checkStatus: 'Check and sign(C.B/PM)'
        }
      ]);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = () => {
    navigate('/auxiliary-orders');
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const getStatusColor = (status: string): string => {
    if (!status) return '#6c757d';
    if (status.includes('Processing')) return '#ffc107';
    if (status.includes('Picked')) return '#28a745';
    if (status.includes('Delivered')) return '#17a2b8';
    if (status.includes('Check')) return '#6f42c1';
    return '#007bff';
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
        <p>載入專案經理儀表板...</p>
      </div>
    );
  }

  return (
    <div className="dashboard pm-dashboard">
      {/* Header */}
      <div className="dashboard-header pm-header">
        <div className="welcome-section">
          <h1>專案經理儀表板</h1>
          <p className="dashboard-subtitle">
            輔材訂單管理 | 專案進度追蹤
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className="action-btn primary"
            onClick={handleCreateOrder}
          >
            + 新增輔材訂單
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card pm-stat">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.totalOrders}</h3>
            <p>總訂單數</p>
          </div>
        </div>
        
        <div className="stat-card pm-stat">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>{stats.activeProjects}</h3>
            <p>進行中專案</p>
          </div>
        </div>
        
        <div className="stat-card pm-stat">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedProjects}</h3>
            <p>已完成專案</p>
          </div>
        </div>
        
        <div className="stat-card pm-stat">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingApprovals}</h3>
            <p>待確認項目</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Recent Projects */}
        <div className="dashboard-section recent-projects">
          <div className="section-header">
            <h3>最近專案</h3>
            <button 
              className="view-all-btn"
              onClick={() => navigate('/projects')}
            >
              查看全部
            </button>
          </div>
          
          <div className="projects-list">
            {recentProjects.map((project) => (
              <div 
                key={project.id} 
                className="project-card"
                onClick={() => handleViewProject(project.id)}
              >
                <div className="project-header">
                  <h4>{project.name}</h4>
                  <span className={`project-status ${project.status.toLowerCase()}`}>
                    {project.status === 'ACTIVE' ? '進行中' : '已完成'}
                  </span>
                </div>
                
                <div className="project-meta">
                  <span className="project-date">
                    建立於 {formatDate(project.createdAt)}
                  </span>
                </div>
                
                <div className="project-progress">
                  <div className="progress-item">
                    <span className="progress-label">叫貨</span>
                    <span 
                      className="progress-status"
                      style={{ color: getStatusColor(project.orderStatus) }}
                    >
                      {project.orderStatus || '未開始'}
                    </span>
                  </div>
                  
                  <div className="progress-item">
                    <span className="progress-label">取貨</span>
                    <span 
                      className="progress-status"
                      style={{ color: getStatusColor(project.pickupStatus) }}
                    >
                      {project.pickupStatus || '未開始'}
                    </span>
                  </div>
                  
                  <div className="progress-item">
                    <span className="progress-label">到案</span>
                    <span 
                      className="progress-status"
                      style={{ color: getStatusColor(project.deliveryStatus) }}
                    >
                      {project.deliveryStatus || '未開始'}
                    </span>
                  </div>
                  
                  <div className="progress-item">
                    <span className="progress-label">點收</span>
                    <span 
                      className="progress-status"
                      style={{ color: getStatusColor(project.checkStatus) }}
                    >
                      {project.checkStatus || '未開始'}
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
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3>快速操作</h3>
        <div className="quick-actions-grid">
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/auxiliary-orders')}
          >
            <span className="action-icon">🔧</span>
            <span className="action-label">輔材訂單</span>
          </button>
          
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/projects')}
          >
            <span className="action-icon">📊</span>
            <span className="action-label">專案管理</span>
          </button>
          
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/materials')}
          >
            <span className="action-icon">📦</span>
            <span className="action-label">材料查詢</span>
          </button>
          
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/reports')}
          >
            <span className="action-icon">📈</span>
            <span className="action-label">報表分析</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PMDashboard;