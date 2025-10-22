import React, { useState, useEffect } from 'react';
import PMDashboard from './PMDashboard';
import AMDashboard from './AMDashboard';
import WarehouseDashboard from './WarehouseDashboard';
import AdminDashboard from './AdminDashboard';
import Dashboard from './Dashboard';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'PM' | 'AM' | 'WAREHOUSE' | 'ADMIN';
}

const DashboardRouter: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user info from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>載入儀表板...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-error">
        <h2>無法載入儀表板</h2>
        <p>請重新登入系統</p>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case 'PM':
      return <PMDashboard />;
    case 'AM':
      return <AMDashboard />;
    case 'WAREHOUSE':
      return <WarehouseDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      // Fallback to generic dashboard
      return <Dashboard />;
  }
};

export default DashboardRouter;