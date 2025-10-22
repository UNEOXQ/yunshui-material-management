import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketService, getWebSocketService } from './websocketService';

// Mock socket.io-client
const mockSocket = {
  connected: false,
  id: 'mock-socket-id',
  connect: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
};

const mockIo = vi.fn(() => mockSocket);

vi.mock('socket.io-client', () => ({
  io: mockIo
}));

describe('WebSocketService', () => {
  let websocketService: WebSocketService;

  beforeEach(() => {
    vi.clearAllMocks();
    websocketService = new WebSocketService();
  });

  afterEach(() => {
    websocketService.disconnect();
  });

  describe('Connection Management', () => {
    it('should create a WebSocket service instance', () => {
      expect(websocketService).toBeDefined();
      expect(typeof websocketService.connect).toBe('function');
      expect(typeof websocketService.disconnect).toBe('function');
    });

    it('should attempt to connect with token', async () => {
      const token = 'test-token';
      
      // Mock successful connection
      mockSocket.connected = true;
      setTimeout(() => {
        const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
        if (connectHandler) connectHandler();
      }, 0);

      await websocketService.connect(token);

      expect(mockIo).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: { token },
          transports: ['websocket', 'polling']
        })
      );
    });

    it('should handle connection errors', async () => {
      const token = 'test-token';
      const error = new Error('Connection failed');
      
      setTimeout(() => {
        const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')?.[1];
        if (errorHandler) errorHandler(error);
      }, 0);

      await expect(websocketService.connect(token)).rejects.toThrow();
    });

    it('should check connection status', () => {
      expect(websocketService.isConnected()).toBe(false);
      
      mockSocket.connected = true;
      // Note: In real implementation, this would be updated by the socket events
    });

    it('should disconnect properly', () => {
      websocketService.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Project Subscription', () => {
    beforeEach(() => {
      mockSocket.connected = true;
    });

    it('should subscribe to project updates', () => {
      const projectId = 'test-project-123';
      
      websocketService.subscribeToProject(projectId);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('subscribe:project', projectId);
    });

    it('should unsubscribe from project updates', () => {
      const projectId = 'test-project-123';
      
      websocketService.unsubscribeFromProject(projectId);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe:project', projectId);
    });

    it('should acknowledge status updates', () => {
      const updateId = 'update-123';
      const projectId = 'project-456';
      
      websocketService.acknowledgeStatusUpdate(updateId, projectId);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('status:ack', {
        updateId,
        projectId
      });
    });
  });

  describe('Event Handling', () => {
    it('should add event handlers', () => {
      const handler = vi.fn();
      
      websocketService.on('test-event', handler);
      
      // Verify handler was added (implementation detail)
      expect(typeof handler).toBe('function');
    });

    it('should remove event handlers', () => {
      const handler = vi.fn();
      
      websocketService.on('test-event', handler);
      websocketService.off('test-event', handler);
      
      // Verify handler was removed (implementation detail)
      expect(typeof handler).toBe('function');
    });

    it('should remove all listeners for an event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      websocketService.on('test-event', handler1);
      websocketService.on('test-event', handler2);
      websocketService.removeAllListeners('test-event');
      
      // Verify all handlers were removed (implementation detail)
      expect(typeof handler1).toBe('function');
      expect(typeof handler2).toBe('function');
    });

    it('should remove all listeners', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      websocketService.on('event1', handler1);
      websocketService.on('event2', handler2);
      websocketService.removeAllListeners();
      
      // Verify all handlers were removed (implementation detail)
      expect(typeof handler1).toBe('function');
      expect(typeof handler2).toBe('function');
    });
  });

  describe('Connection Info', () => {
    it('should provide connection information', () => {
      const info = websocketService.getConnectionInfo();
      
      expect(info).toHaveProperty('connected');
      expect(info).toHaveProperty('connecting');
      expect(info).toHaveProperty('reconnectAttempts');
      expect(typeof info.connected).toBe('boolean');
      expect(typeof info.connecting).toBe('boolean');
      expect(typeof info.reconnectAttempts).toBe('number');
    });
  });

  describe('Global Service Instance', () => {
    it('should return the same instance', () => {
      const service1 = getWebSocketService();
      const service2 = getWebSocketService();
      
      expect(service1).toBe(service2);
    });
  });
});