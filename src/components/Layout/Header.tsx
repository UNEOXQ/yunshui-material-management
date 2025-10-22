import React, { useState } from 'react';
import WebSocketIndicator from '../WebSocket/WebSocketIndicator';
import './Header.css';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'PM' | 'AM' | 'WAREHOUSE' | 'ADMIN';
}

interface HeaderProps {
  user: User;
  onToggleSidebar: () => void;
  onLogout: () => void;
  isMobile: boolean;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onToggleSidebar,
  onLogout,
  isMobile
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const getRoleDisplayName = (role: string): string => {
    const roleNames: Record<string, string> = {
      PM: '專案經理',
      AM: '客戶經理',
      WAREHOUSE: '倉庫管理員',
      ADMIN: '系統管理員'
    };
    return roleNames[role] || role;
  };

  const getRoleBadgeClass = (role: string): string => {
    const roleClasses: Record<string, string> = {
      PM: 'role-pm',
      AM: 'role-am',
      WAREHOUSE: 'role-warehouse',
      ADMIN: 'role-admin'
    };
    return roleClasses[role] || 'role-default';
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    onLogout();
  };

  return (
    <header className="main-header">
      <div className="header-left">
        {/* Menu Toggle Button */}
        <button 
          className={`menu-toggle-btn ${isMobile ? 'mobile-menu-btn' : ''}`}
          onClick={onToggleSidebar}
          aria-label="切換選單"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* Logo and Title */}
        <div className="header-brand">
          <div className="brand-logo">
            <span className="logo-icon">🏗️</span>
          </div>
          <div className="brand-text">
            <h1 className="brand-title">雲水基材管理</h1>
            {!isMobile && (
              <span className="brand-subtitle">Material Management System</span>
            )}
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* WebSocket Status */}
        <div className="header-websocket">
          <WebSocketIndicator showDetails={!isMobile} />
        </div>

        {/* User Menu */}
        <div className="user-menu">
          <button 
            className="user-menu-trigger"
            onClick={toggleUserMenu}
            aria-label="使用者選單"
          >
            <div className="user-avatar">
              <span className="avatar-text">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="user-info">
              <span className="user-name">{user.username}</span>
              <span className={`user-role ${getRoleBadgeClass(user.role)}`}>
                {getRoleDisplayName(user.role)}
              </span>
            </div>
            <span className={`dropdown-arrow ${userMenuOpen ? 'open' : ''}`}>
              ▼
            </span>
          </button>

          {/* User Dropdown Menu */}
          {userMenuOpen && (
            <div className={`user-dropdown ${isMobile ? 'mobile-dropdown' : ''}`}>
              <div className="dropdown-header">
                <div className="user-details">
                  <strong>{user.username}</strong>
                  <small>{user.email}</small>
                  <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
              </div>
              
              <div className="dropdown-divider"></div>
              
              <div className="dropdown-menu">
                <button className={`dropdown-item ${isMobile ? 'mobile-dropdown-item' : ''}`} disabled>
                  <span className="item-icon">👤</span>
                  個人資料
                  <small className="item-note">即將推出</small>
                </button>
                
                <button className={`dropdown-item ${isMobile ? 'mobile-dropdown-item' : ''}`} disabled>
                  <span className="item-icon">⚙️</span>
                  設定
                  <small className="item-note">即將推出</small>
                </button>
                
                <div className="dropdown-divider"></div>
                
                <button 
                  className={`dropdown-item logout-item ${isMobile ? 'mobile-dropdown-item' : ''}`}
                  onClick={handleLogout}
                >
                  <span className="item-icon">🚪</span>
                  登出
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div 
          className="user-menu-overlay"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;