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

describe('useStatusSync - Integration Tests', () => {
  const mockToken = 'test-token';
  
  const createMockStore = (token: string | null = mockToken, statuses: any[] = []) => {
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
          statuses,
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

  describe('Real-time Sync Integration', () => {
    it('should integrate with status service for real-time updates', () => {
      const store = createMockStore();
      
      renderHook(() => useStatusSync({ enableRealTime: true }), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(statusService.initializeRealTimeUpdates).toHaveBeenCalledWith(
        'https://api.example.com',
        mockToken
      );
    });

    it('should handle connection state changes in real-time', async () => {
      const store = createMockStore();
      
      // Start with connected state
      (statusService.isRealTimeConnected as jest.Mock).mockReturnValue(true);
      
      const { result } = renderHook(() => useStatusSync({ enableRealTime: true }), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(result.current.isConnected()).toBe(true);

      // Simulate connection loss
      (statusService.isRealTimeConnected as jest.Mock).mockReturnValue(false);
      
      expect(result.current.isConnected()).toBe(false);
    });

    it('should handle multiple status updates in sequence', async () => {
      const store = createMockStore();
      
      const { result } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      // Perform multiple updates
      const updates = [
        { id: '1', value: '狀態1', reason: '原因1' },
        { id: '2', value: '狀態2', reason: '原因2' },
        { id: '3', value: '狀態3', reason: '原因3' },
      ];

      const results = [];
      for (const update of updates) {
        await act(async () => {
          const updateResult = await result.current.updateStatus(
            update.id,
            update.value,
            update.reason
          );
          results.push(updateResult);
        });
      }

      // All updates should succeed
      expect(results).toEqual([true, true, true]);
      expect(statusService.updateStatusOptimistic).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent batch updates', async () => {
      const store = createMockStore();
      
      const { result } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      const batch1 = [
        { id: '1', value: '批次1-1' },
        { id: '2', value: '批次1-2' },
      ];

      const batch2 = [
        { id: '3', value: '批次2-1' },
        { id: '4', value: '批次2-2' },
      ];

      // Execute concurrent batch updates
      const [result1, result2] = await Promise.all([
        act(async () => result.current.batchUpdateStatuses(batch1)),
        act(async () => result.current.batchUpdateStatuses(batch2)),
      ]);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(statusService.batchUpdateStatuses).toHaveBeenCalledTimes(2);
    });
  });

  describe('Connection Monitoring Integration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should monitor connection and auto-reconnect when enabled', () => {
      const store = createMockStore();
      
      // Start with connection working
      (statusService.isRealTimeConnected as jest.Mock).mockReturnValue(true);
      
      const { result } = renderHook(() => useStatusSync({ 
        enableRealTime: true,
        autoReconnect: true 
      }), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      // Simulate connection loss
      act(() => {
        result.current.disconnect();
      });
      
      (statusService.isRealTimeConnected as jest.Mock).mockReturnValue(false);
      (statusService.initializeRealTimeUpdates as jest.Mock).mockClear();

      // Fast-forward time to trigger connection check
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should attempt to reconnect
      expect(statusService.initializeRealTimeUpdates).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid connection state changes', () => {
      const store = createMockStore();
      
      const { result } = renderHook(() => useStatusSync({ 
        enableRealTime: true,
        autoReconnect: true 
      }), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      // Simulate rapid connection state changes
      (statusService.isRealTimeConnected as jest.Mock)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      // Check connection multiple times rapidly
      expect(result.current.isConnected()).toBe(true);
      expect(result.current.isConnected()).toBe(false);
      expect(result.current.isConnected()).toBe(true);
      expect(result.current.isConnected()).toBe(false);

      // Should handle all state changes without errors
      expect(statusService.isRealTimeConnected).toHaveBeenCalledTimes(4);
    });

    it('should stop monitoring when component unmounts', () => {
      const store = createMockStore();
      
      const { unmount } = renderHook(() => useStatusSync({ 
        enableRealTime: true,
        autoReconnect: true 
      }), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      // Clear call count
      (statusService.initializeRealTimeUpdates as jest.Mock).mockClear();

      // Unmount component
      unmount();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should not attempt to reconnect after unmount
      expect(statusService.initializeRealTimeUpdates).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle service errors gracefully during sync', async () => {
      const store = createMockStore();
      
      // Mock service to throw error
      (statusService.syncStatuses as jest.Mock).mockRejectedValue(new Error('Sync failed'));
      
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

    it('should handle service errors during status updates', async () => {
      const store = createMockStore();
      
      // Mock service to throw error
      (statusService.updateStatusOptimistic as jest.Mock).mockRejectedValue(new Error('Update failed'));
      
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

    it('should handle service errors during batch updates', async () => {
      const store = createMockStore();
      
      // Mock service to throw error
      (statusService.batchUpdateStatuses as jest.Mock).mockRejectedValue(new Error('Batch update failed'));
      
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

    it('should recover from temporary service failures', async () => {
      const store = createMockStore();
      
      // Mock service to fail first, then succeed
      (statusService.syncStatuses as jest.Mock)
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(true);
      
      const { result } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      // First sync should fail
      let firstResult;
      await act(async () => {
        firstResult = await result.current.syncStatuses();
      });
      expect(firstResult).toBe(false);

      // Second sync should succeed
      let secondResult;
      await act(async () => {
        secondResult = await result.current.syncStatuses();
      });
      expect(secondResult).toBe(true);
    });
  });

  describe('Performance Integration', () => {
    it('should handle high-frequency sync operations efficiently', async () => {
      const store = createMockStore();
      
      const { result } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      // Perform 50 rapid sync operations
      const syncPromises = [];
      for (let i = 0; i < 50; i++) {
        syncPromises.push(
          act(async () => result.current.syncStatuses())
        );
      }

      const results = await Promise.all(syncPromises);

      // All operations should complete successfully
      expect(results.every(result => result === true)).toBe(true);
      expect(statusService.syncStatuses).toHaveBeenCalledTimes(50);
    });

    it('should handle large batch updates efficiently', async () => {
      const store = createMockStore();
      
      const { result } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      // Create large batch update
      const largeBatch = Array.from({ length: 100 }, (_, i) => ({
        id: `status-${i}`,
        value: `值-${i}`,
        reason: `原因-${i}`,
      }));

      let batchResult;
      await act(async () => {
        batchResult = await result.current.batchUpdateStatuses(largeBatch);
      });

      expect(batchResult).toBe(true);
      expect(statusService.batchUpdateStatuses).toHaveBeenCalledWith(largeBatch);
    });

    it('should maintain performance with frequent connection checks', () => {
      const store = createMockStore();
      
      const { result } = renderHook(() => useStatusSync({ 
        enableRealTime: true,
        autoReconnect: true 
      }), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      // Perform 100 rapid connection checks
      for (let i = 0; i < 100; i++) {
        result.current.isConnected();
      }

      // Should handle all checks efficiently
      expect(statusService.isRealTimeConnected).toHaveBeenCalledTimes(100);
    });
  });

  describe('State Synchronization Integration', () => {
    it('should maintain sync state across token changes', () => {
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

    it('should handle authentication state changes during active sync', async () => {
      const store = createMockStore();
      
      const { result, rerender } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      // Start with authenticated state and perform sync
      let syncResult;
      await act(async () => {
        syncResult = await result.current.syncStatuses();
      });
      expect(syncResult).toBe(true);

      // Simulate logout
      store.dispatch({
        type: 'auth/logout',
      });

      rerender();

      // Should disconnect
      expect(statusService.disconnect).toHaveBeenCalled();
    });

    it('should handle store state changes during batch operations', async () => {
      const initialStatuses = [
        { id: '1', name: '狀態1', value: '值1', type: 'TEXT' as const, category: '測試', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '2', name: '狀態2', value: '值2', type: 'TEXT' as const, category: '測試', updatedAt: '2024-01-01T01:00:00Z' },
      ];

      const store = createMockStore(mockToken, initialStatuses);
      
      const { result } = renderHook(() => useStatusSync(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      // Start batch update
      const updates = [
        { id: '1', value: '新值1' },
        { id: '2', value: '新值2' },
      ];

      // Simulate store state change during batch operation
      const batchPromise = act(async () => 
        result.current.batchUpdateStatuses(updates)
      );

      // Update store state while batch is in progress
      store.dispatch({
        type: 'status/updateStatus',
        payload: { ...initialStatuses[0], value: '中間值' },
      });

      const batchResult = await batchPromise;

      expect(batchResult).toBe(true);
      expect(statusService.batchUpdateStatuses).toHaveBeenCalledWith(updates);
    });
  });
});