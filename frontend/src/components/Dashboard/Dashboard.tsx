import React, { useState, useEffect } from 'react';
// import { useWebSocket } from '../../hooks/useWebSocket';
// import WebSocketIndicator from '../WebSocket/WebSocketIndicator';
import './Dashboard.css';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'PM' | 'AM' | 'WAREHOUSE' | 'ADMIN';
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pendingOrders: number;
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingOrders: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Mock WebSocket state for now
  const connected = true;
  const error = null;

  useEffect(() => {
    // Get user info
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }

    // Load dashboard stats (mock data for now)
    setStats({
      totalProjects: 45,
      activeProjects: 12,
      completedProjects: 33,
      pendingOrders: 8
    });
  }, []);

  const getRoleDisplayName = (role: string): string => {
    const roleNames: Record<string, string> = {
      PM: '專案經理',
      AM: '客戶經理',
      WAREHOUSE: '倉庫管理員',
      ADMIN: '系統管理員'
    };
    return roleNames[role] || role;
  };

  const getRoleSpecificContent = () => {
    if (!user) return null;

    switch (user.role) {
      case 'PM':
        return (
          <div className="role-specific-section">
            <h3>輔材管理</h3>
            <div className="quick-actions">
              <button className="action-btn primary">新增輔材訂單</button>
              <button className="action-btn secondary">查看訂單狀態</button>
            </div>
          </div>
        );
      case 'AM':
        return (
          <div className="role-specific-section">
            <h3>完成材管理</h3>
            <div className="quick-actions">
              <button className="action-btn primary">新增完成材訂單</button>
              <button className="action-btn secondary">供應商管理</button>
            </div>
          </div>
        );
      case 'WAREHOUSE':
        return (
          <div className="role-specific-section">
            <h3>倉庫作業</h3>
            <div className="quick-actions">
              <button className="action-btn primary">狀態更新</button>
              <button className="action-btn secondary">庫存查詢</button>
            </div>
          </div>
        );
      case 'ADMIN':
        return (
          <div className="role-specific-section">
            <h3>系統管理</h3>
            <div className="quick-actions">
              <button className="action-btn primary">使用者管理</button>
              <button className="action-btn secondary">材料管理</button>
              <button className="action-btn secondary">系統設定</button>
            </div>
          </div>
        );
      default:
        return null;
    }
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

  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>載入儀表板...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>歡迎回來，{user.username}！</h1>
          <p className="user-role-display">
            {getRoleDisplayName(user.role)} | 雲水基材管理系統
          </p>
        </div>
        
        <div className="header-status">
          <div className="connection-status">
            <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
              {connected ? '🟢 已連線' : '🔴 未連線'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalProjects}</h3>
            <p>總專案數</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>{stats.activeProjects}</h3>
            <p>進行中專案</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedProjects}</h3>
            <p>已完成專案</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.pendingOrders}</h3>
            <p>待處理訂單</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Role-specific content */}
        {getRoleSpecificContent()}

        {/* Recent Activities */}
        <div className="recent-activities">
          <h3>即時動態</h3>
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
    </div>
  );
};

export default Dashboard;