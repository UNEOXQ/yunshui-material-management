import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from 'http';
import { WebSocketService, initializeWebSocketService } from '../services/websocketService';

describe('WebSocket Service', () => {
  let httpServer: any;
  let websocketService: WebSocketService;

  beforeAll(() => {
    httpServer = createServer();
    websocketService = initializeWebSocketService(httpServer);
  });

  afterAll((done) => {
    if (httpServer.listening) {
      httpServer.close(done);
    } else {
      done();
    }
  });

  describe('Service Initialization', () => {
    it('should initialize WebSocket service successfully', () => {
      expect(websocketService).toBeDefined();
      expect(websocketService.getIO()).toBeDefined();
    });

    it('should provide WebSocket server instance', () => {
      const io = websocketService.getIO();
      expect(io).toBeDefined();
      expect(typeof io.emit).toBe('function');
    });
  });

  describe('Broadcasting Methods', () => {
    it('should have broadcastStatusUpdate method', () => {
      expect(typeof websocketService.broadcastStatusUpdate).toBe('function');
      
      // Test that the method can be called without throwing
      expect(() => {
        websocketService.broadcastStatusUpdate({
          projectId: 'test-project-123',
          statusType: 'ORDER',
          statusValue: 'Ordered - Processing',
          updatedBy: 'test-user-id',
          updatedByUsername: 'testuser',
          updatedByRole: 'WAREHOUSE',
          timestamp: new Date().toISOString()
        });
      }).not.toThrow();
    });

    it('should have broadcastProjectUpdate method', () => {
      expect(typeof websocketService.broadcastProjectUpdate).toBe('function');
      
      // Test that the method can be called without throwing
      expect(() => {
        websocketService.broadcastProjectUpdate({
          projectId: 'test-project-completed',
          projectName: 'Test Project',
          overallStatus: 'COMPLETED',
          updatedBy: 'test-user-id',
          timestamp: new Date().toISOString()
        });
      }).not.toThrow();
    });

    it('should have notification methods', () => {
      expect(typeof websocketService.sendUserNotification).toBe('function');
      expect(typeof websocketService.sendRoleNotification).toBe('function');
      expect(typeof websocketService.broadcastMaintenanceNotification).toBe('function');
      
      // Test that notification methods can be called without throwing
      expect(() => {
        websocketService.sendUserNotification('test-user-id', {
          type: 'success',
          title: 'Test Notification',
          message: 'This is a test notification'
        });
      }).not.toThrow();

      expect(() => {
        websocketService.sendRoleNotification('WAREHOUSE', {
          type: 'info',
          title: 'Role Notification',
          message: 'This is a role-based notification'
        });
      }).not.toThrow();

      expect(() => {
        websocketService.broadcastMaintenanceNotification('System maintenance scheduled');
      }).not.toThrow();
    });
  });

  describe('Server Statistics', () => {
    it('should provide server statistics', () => {
      const stats = websocketService.getServerStats();
      
      expect(stats).toHaveProperty('connectedUsers');
      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('roomsCount');
      expect(stats).toHaveProperty('uptime');
      
      expect(typeof stats.connectedUsers).toBe('number');
      expect(typeof stats.totalConnections).toBe('number');
      expect(typeof stats.roomsCount).toBe('number');
      expect(typeof stats.uptime).toBe('number');
    });

    it('should track connected users', () => {
      expect(typeof websocketService.getConnectedUsersCount()).toBe('number');
      expect(typeof websocketService.isUserConnected('test-user-id')).toBe('boolean');
      expect(websocketService.isUserConnected('non-existent-user')).toBe(false);
    });

    it('should count users by role', () => {
      const warehouseUsers = websocketService.getConnectedUsersByRole('WAREHOUSE');
      expect(typeof warehouseUsers).toBe('number');
      
      const adminUsers = websocketService.getConnectedUsersByRole('ADMIN');
      expect(typeof adminUsers).toBe('number');
    });
  });
});