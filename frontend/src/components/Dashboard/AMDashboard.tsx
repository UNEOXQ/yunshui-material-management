import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useWebSocket } from '../../hooks/useWebSocket';
import './Dashboard.css';

interface SupplierInfo {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  activeOrders: number;
  rating: number;
}

interface ProjectOverview {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  supplier: string;
  orderStatus: string;
  pickupStatus: string;
  deliveryStatus: string;
  checkStatus: string;
}

interface DashboardStats {
  totalOrders: number;
  activeProjects: number;
  completedProjects: number;
  activeSuppliers: number;
}

const AMDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    activeProjects: 0,
    completedProjects: 0,
    activeSuppliers: 0
  });
  const [recentProjects, setRecentProjects] = useState<ProjectOverview[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<SupplierInfo[]>([]);
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
        totalOrders: 35,
        activeProjects: 15,
        completedProjects: 20,
        activeSuppliers: 8
      });

      // Mock recent projects data
      setRecentProjects([
        {
          id: 'proj-am-001',
          name: '高端住宅完成材專案',
          status: 'ACTIVE',
          createdAt: '2024-01-16T11:30:00Z',
          supplier: '優質建材供應商',
          orderStatus: 'Ordered - Processing',
          pickupStatus: '',
          deliveryStatus: '',
          checkStatus: ''
        },
        {
          id: 'proj-am-002',
          name: '商業大樓裝修材料',
          status: 'ACTIVE',
          createdAt: '2024-01-15T16:45:00Z',
          supplier: '專業裝修材料行',
          orderStatus: 'Ordered - waiting for pick',
          pickupStatus: '',
          deliveryStatus: '',
          checkStatus: ''
        },
        {
          id: 'proj-am-003',
          name: '辦公室完成材配送',
          status: 'COMPLETED',
          createdAt: '2024-01-12T08:20:00Z',
          supplier: '快速建材配送',
          orderStatus: 'Ordered - Processing',
          pickupStatus: 'Picked (D.T.S)',
          deliveryStatus: 'Delivered',
          checkStatus: '(C.B)'
        }
      ]);

      // Mock supplier data
      setTopSuppliers([
        {
          id: 'sup-001',
          name: '優質建材供應商',
          contactPerson: '張經理',
          phone: '02-1234-5678',
          email: 'zhang@supplier1.com',
          activeOrders: 5,
          rating: 4.8
        },
        {
          id: 'sup-002',
          name: '專業裝修材料行',
          contactPerson: '李主任',
          phone: '02-2345-6789',
          email: 'li@supplier2.com',
          activeOrders: 3,
          rating: 4.6
        },
        {
          id: 'sup-003',
          name: '快速建材配送',
          contactPerson: '王總監',
          phone: '02-3456-7890',
          email: 'wang@supplier3.com',
          activeOrders: 2,
          rating: 4.9
        }
      ]);

    } catch (error) {
      console.error('Failed to load AM dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = () => {
    navigate('/finished-orders');
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const handleViewSupplier = (supplierId: string) => {
    navigate(`/suppliers/${supplierId}`);
  };

  const getStatusColor = (status: string): string => {
    if (!status) return '#6c757d';
    if (status.includes('Processing')) return '#ffc107';
    if (status.includes('Picked')) return '#28a745';
    if (status.includes('Delivered')) return '#17a2b8';
    if (status.includes('Check') || status.includes('C.B')) return '#6f42c1';
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

  const renderStars = (rating: number): string => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(5 - Math.ceil(rating));
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>載入客戶經理儀表板...</p>
      </div>
    );
  }

  return (
    <div className="dashboard am-dashboard">
      {/* Header */}
      <div className="dashboard-header am-header">
        <div className="welcome-section">
          <h1>客戶經理儀表板</h1>
          <p className="dashboard-subtitle">
            完成材訂單管理 | 供應商協調
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className="action-btn primary"
            onClick={handleCreateOrder}
          >
            + 新增完成材訂單
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card am-stat">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.totalOrders}</h3>
            <p>總訂單數</p>
          </div>
        </div>
        
        <div className="stat-card am-stat">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>{stats.activeProjects}</h3>
            <p>進行中專案</p>
          </div>
        </div>
        
        <div className="stat-card am-stat">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedProjects}</h3>
            <p>已完成專案</p>
          </div>
        </div>
        
        <div className="stat-card am-stat">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>{stats.activeSuppliers}</h3>
            <p>合作供應商</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Recent Projects */}
        <div className="dashboard-section recent-projects">
          <div className="section-header">
            <h3>最近完成材專案</h3>
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
                className="project-card am-project"
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
                  <span className="project-supplier">
                    供應商：{project.supplier}
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

        {/* Top Suppliers */}
        <div className="dashboard-section top-suppliers">
          <div className="section-header">
            <h3>主要供應商</h3>
            <button 
              className="view-all-btn"
              onClick={() => navigate('/suppliers')}
            >
              管理供應商
            </button>
          </div>
          
          <div className="suppliers-list">
            {topSuppliers.map((supplier) => (
              <div 
                key={supplier.id} 
                className="supplier-card"
                onClick={() => handleViewSupplier(supplier.id)}
              >
                <div className="supplier-header">
                  <h4>{supplier.name}</h4>
                  <div className="supplier-rating">
                    <span className="rating-stars">
                      {renderStars(supplier.rating)}
                    </span>
                    <span className="rating-value">{supplier.rating}</span>
                  </div>
                </div>
                
                <div className="supplier-info">
                  <div className="info-item">
                    <span className="info-label">聯絡人：</span>
                    <span className="info-value">{supplier.contactPerson}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">電話：</span>
                    <span className="info-value">{supplier.phone}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">進行中訂單：</span>
                    <span className="info-value active-orders">
                      {supplier.activeOrders} 筆
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3>快速操作</h3>
        <div className="quick-actions-grid">
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/finished-orders')}
          >
            <span className="action-icon">🏠</span>
            <span className="action-label">完成材訂單</span>
          </button>
          
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/suppliers')}
          >
            <span className="action-icon">🏢</span>
            <span className="action-label">供應商管理</span>
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
            onClick={() => navigate('/reports')}
          >
            <span className="action-icon">📈</span>
            <span className="action-label">供應商報表</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AMDashboard;