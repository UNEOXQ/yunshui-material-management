import React, { useState } from 'react';
import { UserManagementPage } from './UserManagement';
import { MaterialManagementPage } from './MaterialManagement';
import { AuxiliaryOrderPage } from './OrderManagement';
import './AdminDashboard.css';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'materials' | 'orders' | 'overview'>('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagementPage />;
      case 'materials':
        return <MaterialManagementPage />;
      case 'orders':
        return <AuxiliaryOrderPage />;
      case 'overview':
      default:
        return (
          <div className="dashboard-overview">
            <h2>系統管理員儀表板</h2>
            <div className="dashboard-cards">
              <div className="dashboard-card">
                <h3>使用者管理</h3>
                <p>管理系統使用者帳戶和權限</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('users')}
                >
                  進入使用者管理
                </button>
              </div>
              <div className="dashboard-card">
                <h3>材料管理</h3>
                <p>管理系統材料資料庫</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('materials')}
                >
                  進入材料管理
                </button>
              </div>
              <div className="dashboard-card">
                <h3>訂單狀態管理</h3>
                <p>管理訂單狀態和追蹤進度</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('orders')}
                >
                  進入狀態管理
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      <nav className="dashboard-nav">
        <button
          className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          總覽
        </button>
        <button
          className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          使用者管理
        </button>
        <button
          className={`nav-btn ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          材料管理
        </button>
        <button
          className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          訂單狀態管理
        </button>
      </nav>
      
      <main className="dashboard-content">
        {renderContent()}
      </main>
    </div>
  );
};