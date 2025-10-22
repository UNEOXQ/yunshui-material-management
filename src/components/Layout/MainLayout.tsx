import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import WebSocketIndicator from '../WebSocket/WebSocketIndicator';
import NotificationContainer from '../WebSocket/NotificationContainer';
import MobileOptimizations from '../Mobile/MobileOptimizations';
import MobileNavigation from '../Mobile/MobileNavigation';
import MobileLayoutOptimizer from '../Mobile/MobileLayoutOptimizer';
import MobileErrorBoundary from '../Mobile/MobileErrorBoundary';
import MobileGestureNavigation from '../Mobile/MobileGestureNavigation';
import { useWebSocket } from '../../hooks/useWebSocket';
import './MainLayout.css';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'PM' | 'AM' | 'WAREHOUSE' | 'ADMIN';
}

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Setup WebSocket connection
  const { error } = useWebSocket({
    autoConnect: true,
    onConnect: () => console.log('WebSocket connected in layout'),
    onDisconnect: (reason) => console.log('WebSocket disconnected in layout:', reason),
    onError: (error) => console.error('WebSocket error in layout:', error)
  });

  // Check if user is authenticated and get user info
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [navigate]);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width <= 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      // Auto-close sidebar on mobile when navigating
      if (mobile) {
        setSidebarOpen(false);
        setMobileNavOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Close sidebar and mobile nav when location changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
      setMobileNavOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileNavOpen(!mobileNavOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  if (!user) {
    return (
      <div className="loading-layout">
        <div className="loading-spinner"></div>
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <MobileErrorBoundary>
      <MobileOptimizations>
        <MobileLayoutOptimizer>
          <div className={`main-layout ${isMobile ? 'mobile-layout' : ''} ${isTablet ? 'tablet-layout' : ''}`}>
        {/* Header */}
        <Header
          user={user}
          onToggleSidebar={toggleSidebar}
          onLogout={handleLogout}
          isMobile={isMobile}
        />

        <div className="layout-body">
          {/* Desktop/Tablet Sidebar */}
          {!isMobile && (
            <Sidebar
              user={user}
              isOpen={sidebarOpen}
              isMobile={false}
              onClose={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <main className={`main-content ${!isMobile && sidebarOpen ? 'sidebar-open' : ''}`}>
            <div className="content-wrapper">
              {/* WebSocket Status */}
              <div className="websocket-status">
                <WebSocketIndicator showDetails={!isMobile} />
                {error && (
                  <div className="connection-error-banner">
                    即時更新連線異常，部分功能可能受影響
                  </div>
                )}
              </div>

              {/* Page Content with Mobile Gesture Navigation */}
              <div className="page-content">
                {isMobile ? (
                  <MobileGestureNavigation
                    enableSwipeNavigation={true}
                    enablePullToRefresh={true}
                    onRefresh={async () => {
                      // Refresh current page data
                      window.location.reload();
                    }}
                  >
                    {children || <Outlet />}
                  </MobileGestureNavigation>
                ) : (
                  children || <Outlet />
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Mobile Navigation */}
        {isMobile && (
          <MobileNavigation
            user={user}
            isVisible={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
          />
        )}

        {/* Desktop Sidebar Overlay */}
        {!isMobile && sidebarOpen && (
          <div 
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Notification Container */}
        <NotificationContainer 
          position={isMobile ? "top-right" : "top-right"}
          maxNotifications={isMobile ? 3 : 5}
          autoClose={true}
          autoCloseDelay={isMobile ? 4000 : 5000}
        />
          </div>
        </MobileLayoutOptimizer>
      </MobileOptimizations>
    </MobileErrorBoundary>
  );
};

export default MainLayout;