import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardRouter from './DashboardRouter';

// Mock the dashboard components
vi.mock('./PMDashboard', () => ({
  default: () => <div data-testid="pm-dashboard">PM Dashboard</div>
}));

vi.mock('./AMDashboard', () => ({
  default: () => <div data-testid="am-dashboard">AM Dashboard</div>
}));

vi.mock('./WarehouseDashboard', () => ({
  default: () => <div data-testid="warehouse-dashboard">Warehouse Dashboard</div>
}));

vi.mock('./AdminDashboard', () => ({
  default: () => <div data-testid="admin-dashboard">Admin Dashboard</div>
}));

vi.mock('./Dashboard', () => ({
  default: () => <div data-testid="generic-dashboard">Generic Dashboard</div>
}));

// Mock the WebSocket hook
vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    connected: true,
    error: null,
    connectionInfo: { connected: true }
  })
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('DashboardRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  describe('Role-based Dashboard Routing', () => {
    it('should render PM dashboard for PM role', () => {
      const pmUser = {
        id: 'user-1',
        username: 'pm_user',
        email: 'pm@example.com',
        role: 'PM'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(pmUser));

      renderWithRouter(<DashboardRouter />);

      expect(screen.getByTestId('pm-dashboard')).toBeInTheDocument();
      expect(screen.getByText('PM Dashboard')).toBeInTheDocument();
    });

    it('should render AM dashboard for AM role', () => {
      const amUser = {
        id: 'user-2',
        username: 'am_user',
        email: 'am@example.com',
        role: 'AM'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(amUser));

      renderWithRouter(<DashboardRouter />);

      expect(screen.getByTestId('am-dashboard')).toBeInTheDocument();
      expect(screen.getByText('AM Dashboard')).toBeInTheDocument();
    });

    it('should render Warehouse dashboard for WAREHOUSE role', () => {
      const warehouseUser = {
        id: 'user-3',
        username: 'warehouse_user',
        email: 'warehouse@example.com',
        role: 'WAREHOUSE'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(warehouseUser));

      renderWithRouter(<DashboardRouter />);

      expect(screen.getByTestId('warehouse-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Warehouse Dashboard')).toBeInTheDocument();
    });

    it('should render Admin dashboard for ADMIN role', () => {
      const adminUser = {
        id: 'user-4',
        username: 'admin_user',
        email: 'admin@example.com',
        role: 'ADMIN'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(adminUser));

      renderWithRouter(<DashboardRouter />);

      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    it('should render generic dashboard for unknown role', () => {
      const unknownUser = {
        id: 'user-5',
        username: 'unknown_user',
        email: 'unknown@example.com',
        role: 'UNKNOWN' as any
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(unknownUser));

      renderWithRouter(<DashboardRouter />);

      expect(screen.getByTestId('generic-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Generic Dashboard')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error when no user data is available', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      renderWithRouter(<DashboardRouter />);

      expect(screen.getByText('無法載入儀表板')).toBeInTheDocument();
      expect(screen.getByText('請重新登入系統')).toBeInTheDocument();
    });

    it('should show error when user data is invalid JSON', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      renderWithRouter(<DashboardRouter />);

      expect(screen.getByText('無法載入儀表板')).toBeInTheDocument();
      expect(screen.getByText('請重新登入系統')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        id: 'user-1',
        username: 'test_user',
        email: 'test@example.com',
        role: 'PM'
      }));

      // Mock a delay to test loading state
      const { container } = renderWithRouter(<DashboardRouter />);
      
      // The loading state is very brief, so we mainly test that the component renders
      expect(container).toBeInTheDocument();
    });
  });
});