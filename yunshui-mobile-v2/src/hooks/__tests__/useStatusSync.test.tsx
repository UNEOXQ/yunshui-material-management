import { renderHook, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useStatusSync } from '../useStatusSync';
import { statusService } from '../../services/statusService';
import authSlice from '../../store/slices/authSlice';
import statusSlice from '../../store/slices/statusSlice';

// Mock the status service
jest.mock('../../services/statusService', () => ({
  statusService: {
    initializeRealTimeUpdates: jest.fn(),
    disconnect: jest.fn(),
    isRealTimeConnected: jest.fn(),
    syncStatuses: jest.fn(),
    updateStatusOptimistic: jest.fn(),
    batchUpdateStatuses: jest.fn(),
  },
}));

// Mock the environment config
jest.mock('../../config/env', () => ({
  ENV: {
    API_BASE_URL: 'https://api.example.com',
  },
}));

describe('useStatusSync', () => {
  const mockToken = 'test-token';
  
  const createMockStore = (token: string | null = mockToken) => {
    return configureStore({
      reducer: {
        auth: authSlice,
        status: statusSlice,
      },
      preloadedState: {
        auth: {
          user: token ? { id: '1', username: 'test', email: 'test@example.com', role: 'ADMIN', token } : null,
          token,
          isAuthenticated: !!token,
          loading: false,
          error: null,
        },
        status: {
          statuses: [],
          selectedStatus: null,
          loading: false,
          error: null,
          categories: [],
          filters: {},
        },
      },
    });
  };

  const wrapper = ({ children, store }: { children: React.ReactNode; store: any }) => (
    <Provider store={store}>{children}</Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (statusService.initializeRealTimeUpdates as jest.Mock).mockClear();
    (statusService.disconnect as jest.Mock).mockClear();
    (statusService.isRealTimeConnected as jest.Mock).mockReturnValue(true);
    (statusService.syncStatuses as jest.Mock).mockResolvedValue(true);
    (statusService.updateStatusOptimistic as jest.Mock).mockResolvedValue(true);
    (statusService.batchUpdateStatuses as jest.Mock).mockResolvedValue(true);
  });

  describe('Initialization', () => {
    it('should initialize real-time connection when token is available', () => {
      const store = createMockStore();
      
      renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(statusService.initializeRealTimeUpdates).toHaveBeenCalledWith(
        'https://api.example.com',
        mockToken
      );
    });

    it('should not initialize when token is not available', () => {
      const store = createMockStore(null);
      
      renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(statusService.initializeRealTimeUpdates).not.toHaveBeenCalled();
    });

    it('should not initialize when real-time is disabled', () => {
      const store = createMockStore();
      
      renderHook(() => useStatusSync({ enableRealTime: false }), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(statusService.initializeRealTimeUpdates).not.toHaveBeenCalled();
    });

    it('should disconnect on unmount', () => {
      const store = createMockStore();
      
      const { unmount } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      unmount();

      expect(statusService.disconnect).toHaveBeenCalled();
    });
  });

  describe('Connection Management', () => {
    it('should return connection status', () => {
      const store = createMockStore();
      
      const { result } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(result.current.isConnected()).toBe(true);
      expect(statusService.isRealTimeConnected).toHaveBeenCalled();
    });

    it('should provide disconnect function', () => {
      const store = createMockStore();
      
      const { result } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      act(() => {
        result.current.disconnect();
      });

      expect(statusService.disconnect).toHaveBeenCalled();
    });

    it('should provide initialize connection function', () => {
      const store = createMockStore();
      
      const { result } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      // Disconnect first to reset the initialized state
      act(() => {
        result.current.disconnect();
      });

      // Clear the call count after disconnect
      (statusService.initializeRealTimeUpdates as jest.Mock).mockClear();

      act(() => {
        result.current.initializeConnection();
      });

      // Should be called once manually after disconnect and clearing
      expect(statusService.initializeRealTimeUpdates).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Operations', () => {
    it('should provide sync function', async () => {
      const store = createMockStore();
      
      const { result } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      let syncResult;
      await act(async () => {
        syncResult = await result.current.syncStatuses();
      });

      expect(syncResult).toBe(true);
      expect(statusService.syncStatuses).toHaveBeenCalled();
    });

    it('should provide update status function', async () => {
      const store = createMockStore();
      
      const { result } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateStatus('1', '新值', '測試原因');
      });

      expect(updateResult).toBe(true);
      expect(statusService.updateStatusOptimistic).toHaveBeenCalledWith('1', '新值', '測試原因');
    });

    it('should provide batch update function', async () => {
      const store = createMockStore();
      
      const { result } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      const updates = [
        { id: '1', value: '值1', reason: '原因1' },
        { id: '2', value: '值2', reason: '原因2' },
      ];

      let batchResult;
      await act(async () => {
        batchResult = await result.current.batchUpdateStatuses(updates);
      });

      expect(batchResult).toBe(true);
      expect(statusService.batchUpdateStatuses).toHaveBeenCalledWith(updates);
    });
  });

  describe('Connection Monitoring', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should monitor connection and reconnect when disconnected', () => {
      const store = createMockStore();
      
      // Start with connection working
      (statusService.isRealTimeConnected as jest.Mock).mockReturnValue(true);
      
      const { result } = renderHook(() => useStatusSync({ autoReconnect: true }), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      // Simulate connection loss by disconnecting and mocking as disconnected
      act(() => {
        result.current.disconnect();
      });
      
      (statusService.isRealTimeConnected as jest.Mock).mockReturnValue(false);

      // Clear the call count after disconnect
      (statusService.initializeRealTimeUpdates as jest.Mock).mockClear();

      // Fast-forward time to trigger connection check
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should attempt to reconnect
      expect(statusService.initializeRealTimeUpdates).toHaveBeenCalledTimes(1);
    });

    it('should not reconnect when autoReconnect is disabled', () => {
      const store = createMockStore();
      
      // Mock connection as disconnected
      (statusService.isRealTimeConnected as jest.Mock).mockReturnValue(false);
      
      renderHook(() => useStatusSync({ autoReconnect: false }), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      // Fast-forward time to trigger connection check
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should not attempt to reconnect
      expect(statusService.initializeRealTimeUpdates).toHaveBeenCalledTimes(1);
    });

    it('should not monitor connection when real-time is disabled', () => {
      const store = createMockStore();
      
      renderHook(() => useStatusSync({ enableRealTime: false }), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should not initialize at all
      expect(statusService.initializeRealTimeUpdates).not.toHaveBeenCalled();
    });
  });

  describe('Token Changes', () => {
    it('should reinitialize connection when token changes', () => {
      const store = createMockStore(null);
      
      const { rerender } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      // Initially no token, no connection
      expect(statusService.initializeRealTimeUpdates).not.toHaveBeenCalled();

      // Update store with token
      store.dispatch({
        type: 'auth/loginSuccess',
        payload: {
          user: { id: '1', username: 'test', email: 'test@example.com', role: 'ADMIN', token: mockToken },
          token: mockToken,
        },
      });

      rerender();

      // Should initialize connection with new token
      expect(statusService.initializeRealTimeUpdates).toHaveBeenCalledWith(
        'https://api.example.com',
        mockToken
      );
    });
  });

  describe('Return Values', () => {
    it('should return correct status flags', () => {
      const store = createMockStore();
      
      const { result } = renderHook(() => useStatusSync({ enableRealTime: true }), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(result.current.isRealTimeEnabled).toBe(true);
      expect(typeof result.current.initializeConnection).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
      expect(typeof result.current.isConnected).toBe('function');
      expect(typeof result.current.syncStatuses).toBe('function');
      expect(typeof result.current.updateStatus).toBe('function');
      expect(typeof result.current.batchUpdateStatuses).toBe('function');
    });

    it('should return disabled real-time flag when disabled', () => {
      const store = createMockStore();
      
      const { result } = renderHook(() => useStatusSync({ enableRealTime: false }), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(result.current.isRealTimeEnabled).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle sync errors gracefully', async () => {
      const store = createMockStore();
      
      (statusService.syncStatuses as jest.Mock).mockResolvedValue(false);
      
      const { result } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      let syncResult;
      await act(async () => {
        syncResult = await result.current.syncStatuses();
      });

      // Should handle error and return false
      expect(syncResult).toBe(false);
    });

    it('should handle update errors gracefully', async () => {
      const store = createMockStore();
      
      (statusService.updateStatusOptimistic as jest.Mock).mockResolvedValue(false);
      
      const { result } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateStatus('1', '新值');
      });

      // Should handle error and return false
      expect(updateResult).toBe(false);
    });

    it('should handle batch update errors gracefully', async () => {
      const store = createMockStore();
      
      (statusService.batchUpdateStatuses as jest.Mock).mockResolvedValue(false);
      
      const { result } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      const updates = [{ id: '1', value: '值1' }];

      let batchResult;
      await act(async () => {
        batchResult = await result.current.batchUpdateStatuses(updates);
      });

      // Should handle error and return false
      expect(batchResult).toBe(false);
    });
  });
});