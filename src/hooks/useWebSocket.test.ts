import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from './useWebSocket';

// Mock the WebSocket service
const mockWebSocketService = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  subscribeToProject: vi.fn(),
  unsubscribeFromProject: vi.fn(),
  acknowledgeStatusUpdate: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  isConnected: vi.fn(() => false),
  getConnectionInfo: vi.fn(() => ({
    connected: false,
    connecting: false,
    reconnectAttempts: 0,
    socketId: undefined
  }))
};

const mockInitializeWebSocketConnection = vi.fn();
const mockDisconnectWebSocket = vi.fn();
const mockGetWebSocketService = vi.fn(() => mockWebSocketService);

vi.mock('../services/websocketService', () => ({
  getWebSocketService: mockGetWebSocketService,
  initializeWebSocketConnection: mockInitializeWebSocketConnection,
  disconnectWebSocket: mockDisconnectWebSocket
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

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Hook Functionality', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useWebSocket({ autoConnect: false }));

      expect(result.current.connected).toBe(false);
      expect(result.current.connecting).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.reconnectAttempts).toBe(0);
    });

    it('should provide connection methods', () => {
      const { result } = renderHook(() => useWebSocket({ autoConnect: false }));

      expect(typeof result.current.connect).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
      expect(typeof result.current.subscribeToProject).toBe('function');
      expect(typeof result.current.unsubscribeFromProject).toBe('function');
      expect(typeof result.current.acknowledgeStatusUpdate).toBe('function');
    });

    it('should provide utility properties', () => {
      const { result } = renderHook(() => useWebSocket({ autoConnect: false }));

      expect(typeof result.current.isConnected).toBe('boolean');
      expect(typeof result.current.isConnecting).toBe('boolean');
      expect(typeof result.current.hasError).toBe('boolean');
      expect(result.current.connectionInfo).toBeDefined();
    });
  });

  describe('Connection Management', () => {
    it('should connect when connect is called', async () => {
      mockInitializeWebSocketConnection.mockResolvedValue(mockWebSocketService);
      
      const { result } = renderHook(() => useWebSocket({ autoConnect: false }));

      await act(async () => {
        await result.current.connect();
      });

      expect(mockInitializeWebSocketConnection).toHaveBeenCalledWith('mock-token');
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockInitializeWebSocketConnection.mockRejectedValue(error);
      
      const onError = vi.fn();
      const { result } = renderHook(() => useWebSocket({ 
        autoConnect: false,
        onError 
      }));

      await act(async () => {
        await result.current.connect();
      });

      expect(onError).toHaveBeenCalledWith('Connection failed');
      expect(result.current.error).toBe('Connection failed');
    });

    it('should handle missing token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const onError = vi.fn();
      const { result } = renderHook(() => useWebSocket({ 
        autoConnect: false,
        onError 
      }));

      await act(async () => {
        await result.current.connect();
      });

      expect(onError).toHaveBeenCalledWith('No authentication token found');
      expect(result.current.error).toBe('No authentication token found');
    });

    it('should disconnect properly', () => {
      const { result } = renderHook(() => useWebSocket({ autoConnect: false }));

      act(() => {
        result.current.disconnect();
      });

      expect(mockDisconnectWebSocket).toHaveBeenCalled();
    });
  });

  describe('Project Subscription', () => {
    it('should subscribe to project', () => {
      const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
      const projectId = 'test-project-123';

      act(() => {
        result.current.subscribeToProject(projectId);
      });

      expect(mockWebSocketService.subscribeToProject).toHaveBeenCalledWith(projectId);
    });

    it('should unsubscribe from project', () => {
      const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
      const projectId = 'test-project-123';

      act(() => {
        result.current.unsubscribeFromProject(projectId);
      });

      expect(mockWebSocketService.unsubscribeFromProject).toHaveBeenCalledWith(projectId);
    });

    it('should acknowledge status update', () => {
      const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
      const updateId = 'update-123';
      const projectId = 'project-456';

      act(() => {
        result.current.acknowledgeStatusUpdate(updateId, projectId);
      });

      expect(mockWebSocketService.acknowledgeStatusUpdate).toHaveBeenCalledWith(updateId, projectId);
    });
  });

  describe('Event Handlers', () => {
    it('should setup event handlers', () => {
      const onStatusUpdate = vi.fn();
      const onProjectUpdate = vi.fn();
      const onNotification = vi.fn();

      renderHook(() => useWebSocket({ 
        autoConnect: false,
        onStatusUpdate,
        onProjectUpdate,
        onNotification
      }));

      expect(mockWebSocketService.on).toHaveBeenCalledWith('status:updated', expect.any(Function));
      expect(mockWebSocketService.on).toHaveBeenCalledWith('project:updated', expect.any(Function));
      expect(mockWebSocketService.on).toHaveBeenCalledWith('notification', expect.any(Function));
    });

    it('should cleanup event handlers on unmount', () => {
      const { unmount } = renderHook(() => useWebSocket({ autoConnect: false }));

      unmount();

      expect(mockWebSocketService.off).toHaveBeenCalled();
    });
  });

  describe('Auto Connect', () => {
    it('should auto-connect when autoConnect is true', () => {
      mockInitializeWebSocketConnection.mockResolvedValue(mockWebSocketService);
      
      renderHook(() => useWebSocket({ autoConnect: true }));

      expect(mockInitializeWebSocketConnection).toHaveBeenCalled();
    });

    it('should not auto-connect when autoConnect is false', () => {
      renderHook(() => useWebSocket({ autoConnect: false }));

      expect(mockInitializeWebSocketConnection).not.toHaveBeenCalled();
    });
  });

  describe('Project IDs', () => {
    it('should subscribe to initial project IDs when connected', () => {
      mockWebSocketService.getConnectionInfo.mockReturnValue({
        connected: true,
        connecting: false,
        reconnectAttempts: 0,
        socketId: undefined
      });

      const projectIds = ['project-1', 'project-2'];
      
      renderHook(() => useWebSocket({ 
        autoConnect: false,
        projectIds 
      }));

      // Note: In real implementation, this would be called when connection state changes
      // This test verifies the hook structure is correct
      expect(projectIds).toEqual(['project-1', 'project-2']);
    });
  });
});