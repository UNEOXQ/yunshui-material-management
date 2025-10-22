import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'PM' | 'AM' | 'WAREHOUSE' | 'ADMIN';
}

interface SidebarProps {
  user: User;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  roles: string[];
  badge?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  isOpen,
  isMobile,
  onClose
}) => {
  const location = useLocation();

  // Define menu items based on user roles
  const menuItems: MenuItem[] = [
    // Dashboard - All roles
    {
      path: '/dashboard',
      label: '儀表板',
      icon: '📊',
      roles: ['PM', 'AM', 'WAREHOUSE', 'ADMIN']
    },
    
    // Material Management - Admin only
    {
      path: '/materials',
      label: '材料管理',
      icon: '📦',
      roles: ['ADMIN']
    },
    
    // Auxiliary Materials - PM only
    {
      path: '/auxiliary-orders',
      label: '輔材訂單',
      icon: '🔧',
      roles: ['PM']
    },
    
    // Finished Materials - AM only
    {
      path: '/finished-orders',
      label: '完成材訂單',
      icon: '🏠',
      roles: ['AM']
    },
    
    // Status Management - Warehouse only
    {
      path: '/status-management',
      label: '狀態管理',
      icon: '📋',
      roles: ['WAREHOUSE']
    },
    
    // User Management - Admin only
    {
      path: '/users',
      label: '使用者管理',
      icon: '👥',
      roles: ['ADMIN']
    },
    
    // Reports - Admin and Warehouse
    {
      path: '/reports',
      label: '報表分析',
      icon: '📈',
      roles: ['ADMIN', 'WAREHOUSE'],
      badge: '即將推出'
    },
    
    // Settings - Admin only
    {
      path: '/settings',
      label: '系統設定',
      icon: '⚙️',
      roles: ['ADMIN'],
      badge: '即將推出'
    }
  ];

  // Filter menu items based on user role
  const availableMenuItems = menuItems.filter(item => 
    item.roles.includes(user.role)
  );

  const handleItemClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  const isActiveRoute = (path: string): boolean => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''} ${isMobile ? 'mobile' : 'desktop'}`}>
        <div className="sidebar-content">
          {/* Sidebar Header */}
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <span className="brand-icon">🏗️</span>
              <span className="brand-text">雲水基材</span>
            </div>
            
            {isMobile && (
              <button 
                className="sidebar-close-btn"
                onClick={onClose}
                aria-label="關閉選單"
              >
                ✕
              </button>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="sidebar-nav">
            <ul className="nav-list">
              {availableMenuItems.map((item) => (
                <li key={item.path} className="nav-item">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => 
                      `nav-link ${isActive || isActiveRoute(item.path) ? 'active' : ''}`
                    }
                    onClick={handleItemClick}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="sidebar-footer">
            <div className="user-info-compact">
              <div className="user-avatar-small">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="user-details-small">
                <span className="username-small">{user.username}</span>
                <span className="role-small">{user.role}</span>
              </div>
            </div>
            
            <div className="sidebar-version">
              <small>v1.0.0</small>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;