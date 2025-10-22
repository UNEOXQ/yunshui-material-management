import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TouchGestureHandler from './TouchGestureHandler';
import './MobileNavigation.css';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'PM' | 'AM' | 'WAREHOUSE' | 'ADMIN';
}

interface MobileNavigationProps {
  user: User;
  isVisible: boolean;
  onClose: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: string[];
  badge?: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  user,
  isVisible,
  onClose
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);

  // Navigation items based on user role
  const navItems: NavItem[] = [
    {
      path: '/dashboard',
      label: '儀表板',
      icon: '📊',
      roles: ['PM', 'AM', 'WAREHOUSE', 'ADMIN']
    },
    {
      path: '/auxiliary-orders',
      label: '輔材訂單',
      icon: '🔧',
      roles: ['PM']
    },
    {
      path: '/finished-orders',
      label: '完成材訂單',
      icon: '🏠',
      roles: ['AM']
    },
    {
      path: '/status-management',
      label: '狀態管理',
      icon: '📋',
      roles: ['WAREHOUSE']
    },
    {
      path: '/materials',
      label: '材料管理',
      icon: '📦',
      roles: ['ADMIN']
    },
    {
      path: '/users',
      label: '使用者管理',
      icon: '👥',
      roles: ['ADMIN']
    }
  ];

  // Filter nav items based on user role
  const availableNavItems = navItems.filter(item => 
    item.roles.includes(user.role)
  );

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible]);

  const handleNavItemClick = (path: string) => {
    setIsAnimating(false);
    setTimeout(() => {
      navigate(path);
      onClose();
    }, 150);
  };

  const handleSwipeDown = () => {
    onClose();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Add visual feedback for touch start
    const target = e.currentTarget as HTMLElement;
    target.style.transform = 'scale(0.98)';
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Remove visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.transform = '';
  };

  const isActiveRoute = (path: string): boolean => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const getRoleColor = (role: string): string => {
    const colors: Record<string, string> = {
      PM: '#007bff',
      AM: '#28a745',
      WAREHOUSE: '#ffc107',
      ADMIN: '#6f42c1'
    };
    return colors[role] || '#6c757d';
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

  if (!isVisible) return null;

  return (
    <div className="mobile-navigation-overlay">
      <TouchGestureHandler onSwipeDown={handleSwipeDown}>
        <div className={`mobile-navigation ${isAnimating ? 'animating' : ''}`}>
          {/* Handle bar for swipe indication */}
          <div className="navigation-handle">
            <div className="handle-bar"></div>
          </div>

          {/* User info section */}
          <div className="mobile-user-section">
            <div className="user-avatar-large">
              <span className="avatar-text">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="user-info-mobile">
              <h3 className="user-name">{user.username}</h3>
              <p className="user-email">{user.email}</p>
              <span 
                className="user-role-badge"
                style={{ backgroundColor: getRoleColor(user.role) }}
              >
                {getRoleDisplayName(user.role)}
              </span>
            </div>
          </div>

          {/* Navigation menu */}
          <nav className="mobile-nav-menu">
            <ul className="mobile-nav-list">
              {availableNavItems.map((item, index) => (
                <li key={item.path} className="mobile-nav-item">
                  <button
                    className={`mobile-nav-link ${isActiveRoute(item.path) ? 'active' : ''}`}
                    onClick={() => handleNavItemClick(item.path)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <span className="nav-icon-mobile">{item.icon}</span>
                    <span className="nav-label-mobile">{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge-mobile">{item.badge}</span>
                    )}
                    {isActiveRoute(item.path) && (
                      <span className="active-indicator">●</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Quick actions */}
          <div className="mobile-quick-actions">
            <h4>快速操作</h4>
            <div className="quick-actions-row">
              {user.role === 'PM' && (
                <button 
                  className="quick-action-mobile"
                  onClick={() => handleNavItemClick('/auxiliary-orders/new')}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <span className="quick-icon">➕</span>
                  <span className="quick-label">新訂單</span>
                </button>
              )}
              
              {user.role === 'AM' && (
                <button 
                  className="quick-action-mobile"
                  onClick={() => handleNavItemClick('/finished-orders/new')}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <span className="quick-icon">➕</span>
                  <span className="quick-label">新訂單</span>
                </button>
              )}
              
              {user.role === 'WAREHOUSE' && (
                <button 
                  className="quick-action-mobile"
                  onClick={() => handleNavItemClick('/status-management')}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <span className="quick-icon">📋</span>
                  <span className="quick-label">狀態更新</span>
                </button>
              )}
              
              {user.role === 'ADMIN' && (
                <>
                  <button 
                    className="quick-action-mobile"
                    onClick={() => handleNavItemClick('/users/new')}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    <span className="quick-icon">👤</span>
                    <span className="quick-label">新使用者</span>
                  </button>
                  <button 
                    className="quick-action-mobile"
                    onClick={() => handleNavItemClick('/materials/new')}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    <span className="quick-icon">📦</span>
                    <span className="quick-label">新材料</span>
                  </button>
                </>
              )}
              
              <button 
                className="quick-action-mobile"
                onClick={() => handleNavItemClick('/search')}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <span className="quick-icon">🔍</span>
                <span className="quick-label">搜尋</span>
              </button>
            </div>
          </div>

          {/* Close button */}
          <div className="mobile-nav-footer">
            <button 
              className="close-navigation-btn"
              onClick={onClose}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <span className="close-icon">✕</span>
              <span className="close-label">關閉選單</span>
            </button>
          </div>
        </div>
      </TouchGestureHandler>
    </div>
  );
};

export default MobileNavigation;