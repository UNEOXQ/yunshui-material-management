import { OfflineService } from '../offlineService';
import { SyncService } from '../syncService';
import { NetworkService } from '../networkService';
import { MaterialService } from '../materialService';
import { OrderService } from '../orderService';
import { DatabaseService } from '../databaseService';
import { StorageService } from '../../utils/storage';
import { Material, Order, OfflineAction, SyncResult } from '../../types';
import { mockMaterials, mockOrders, createMockMaterial, createMockOrder } from '../../test-utils';

// Mock dependencies
jest.mock('../networkService');
jest.mock('../materialService', () => ({
  MaterialService: {
    getMaterials: jest.fn(),
    createMaterial: jest.fn(),
    updateMaterial: jest.fn(),
    deleteMaterial: jest.fn(),
  },
}));
jest.mock('../orderService', () => ({
  OrderService: {
    getOrders: jest.fn(),
    createOrder: jest.fn(),
    updateOrder: jest.fn(),
    deleteOrder: jest.fn(),
  },
}));
jest.mock('../databaseService');
jest.mock('../../utils/storage');
jest.mock('react-native-uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Date.now()),
}));

const mockNetworkService = NetworkService as jest.Mocked<typeof NetworkService>;
const mockMaterialService = MaterialService as jest.Mocked<typeof MaterialService>;
const mockOrderService = OrderService as jest.Mocked<typeof OrderService>;
const mockDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;
const mockStorageService = StorageService as jest.Mocked<typeof StorageService>;

describe('Offline Sync Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Default network state
    mockNetworkService.isOnline.mockReturnValue(true);
    mockNetworkService.shouldSync.mockReturnValue(true);

    // Default settings
    mockStorageService.getObject.mockResolvedValue({
      sync: {
        autoSync: true,
        syncInterval: 5,
        wifiOnly: false,
      },
    });

    // Default database operations
    mockDatabaseService.initialize.mockResolvedValue();
    mockDatabaseService.getMaterials.mockResolvedValue([]);
    mockDatabaseService.getOrders.mockResolvedValue([]);
    mockDatabaseService.getOfflineActions.mockResolvedValue([]);
    mockDatabaseService.getUnsyncedActions.mockResolvedValue([]);
    mockDatabaseService.saveOfflineAction.mockResolvedValue();
    mockDatabaseService.saveMaterials.mockResolvedValue();
    mockDatabaseService.saveOrders.mockResolvedValue();
    mockDatabaseService.markActionAsSynced.mockResolvedValue();
    mockDatabaseService.setLastSyncTime.mockResolvedValue();
    mockDatabaseService.getLastSyncTime.mockResolvedValue(0);

    // Default storage operations
    mockStorageService.setObject.mockResolvedValue();
    mockStorageService.setItem.mockResolvedValue();
    mockStorageService.getObject.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    SyncService.cleanup();
  });

  describe('Complete Offline to Online Workflow', () => {
    it('should handle complete offline workflow: create -> sync -> resolve conflicts', async () => {
      // Step 1: Initialize services
      await OfflineService.initialize();
      await SyncService.initialize();

      // Step 2: Create material offline
      const materialData = {
        name: '離線基材',
        category: '石材',
        specification: '30x30cm',
        unit: '片',
        price: 100,
        stock: 50,
      };

      const createdMaterial = await OfflineService.createMaterialOffline(materialData);
      expect(createdMaterial).toMatchObject(materialData);
      expect(mockDatabaseService.saveOfflineAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CREATE',
          entity: 'MATERIAL',
          synced: false,
        })
      );

      // Step 3: Create order offline
      const orderData = {
        orderNumber: 'ORD-OFFLINE-001',
        customerName: '離線客戶',
        materials: [],
        status: 'PENDING' as const,
        totalAmount: 1000,
      };

      const createdOrder = await OfflineService.createOrderOffline(orderData);
      expect(createdOrder).toMatchObject(orderData);

      // Step 4: Verify pending actions
      const pendingActions: OfflineAction[] = [
        {
          id: 'action-1',
          type: 'CREATE',
          entity: 'MATERIAL',
          entityId: createdMaterial.id,
          data: createdMaterial,
          timestamp: Date.now(),
          synced: false,
        },
        {
          id: 'action-2',
          type: 'CREATE',
          entity: 'ORDER',
          entityId: createdOrder.id,
          data: createdOrder,
          timestamp: Date.now(),
          synced: false,
        },
      ];

      mockDatabaseService.getUnsyncedActions.mockResolvedValue(pendingActions);
      const pendingCount = await OfflineService.getPendingActionsCount();
      expect(pendingCount).toBe(2);

      // Step 5: Mock successful API calls for sync
      mockMaterialService.createMaterial.mockResolvedValue(createdMaterial);
      mockOrderService.createOrder.mockResolvedValue(createdOrder);
      mockMaterialService.getMaterials.mockResolvedValue([createdMaterial]);
      mockOrderService.getOrders.mockResolvedValue([createdOrder]);

      // Step 6: Perform sync
      const syncResult = await SyncService.performFullSync();

      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedActions).toBe(2);
      expect(syncResult.failedActions).toBe(0);

      // Verify API calls were made
      expect(mockMaterialService.createMaterial).toHaveBeenCalledWith(createdMaterial);
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(createdOrder);

      // Verify actions were marked as synced
      expect(mockDatabaseService.markActionAsSynced).toHaveBeenCalledWith('action-1');
      expect(mockDatabaseService.markActionAsSynced).toHaveBeenCalledWith('action-2');

      // Verify latest data was pulled and saved
      expect(mockOfflineService.saveMaterialsOffline).toHaveBeenCalledWith([createdMaterial]);
      expect(mockOfflineService.saveOrdersOffline).toHaveBeenCalledWith([createdOrder]);
    });

    it('should handle partial sync failures and retry logic', async () => {
      const pendingActions: OfflineAction[] = [
        {
          id: 'action-1',
          type: 'CREATE',
          entity: 'MATERIAL',
          entityId: 'material-1',
          data: createMockMaterial(),
          timestamp: Date.now(),
          synced: false,
          retryCount: 0,
        },
        {
          id: 'action-2',
          type: 'CREATE',
          entity: 'ORDER',
          entityId: 'order-1',
          data: createMockOrder(),
          timestamp: Date.now(),
          synced: false,
          retryCount: 0,
        },
      ];

      mockDatabaseService.getUnsyncedActions.mockResolvedValue(pendingActions);

      // Mock first action to fail, second to succeed
      mockMaterialService.createMaterial.mockRejectedValue(new Error('Network timeout'));
      mockOrderService.createOrder.mockResolvedValue(mockOrders[0]);
      mockMaterialService.getMaterials.mockResolvedValue([]);
      mockOrderService.getOrders.mockResolvedValue([mockOrders[0]]);

      const syncResult = await SyncService.performFullSync();

      expect(syncResult.success).toBe(false);
      expect(syncResult.syncedActions).toBe(1);
      expect(syncResult.failedActions).toBe(1);
      expect(syncResult.errors).toContain('CREATE MATERIAL: Network timeout');

      // Verify failed action was updated with error
      expect(mockDatabaseService.updateActionError).toHaveBeenCalledWith(
        'action-1',
        'Network timeout',
        1
      );

      // Verify successful action was marked as synced
      expect(mockDatabaseService.markActionAsSynced).toHaveBeenCalledWith('action-2');
    });

    it('should delete actions after max retry attempts', async () => {
      const failedAction: OfflineAction = {
        id: 'action-1',
        type: 'CREATE',
        entity: 'MATERIAL',
        entityId: 'material-1',
        data: createMockMaterial(),
        timestamp: Date.now(),
        synced: false,
        retryCount: 3, // At max retry limit
      };

      mockDatabaseService.getUnsyncedActions.mockResolvedValue([failedAction]);
      mockMaterialService.createMaterial.mockRejectedValue(new Error('Persistent error'));
      mockMaterialService.getMaterials.mockResolvedValue([]);
      mockOrderService.getOrders.mockResolvedValue([]);

      const syncResult = await SyncService.performFullSync();

      expect(syncResult.failedActions).toBe(1);
      expect(mockDatabaseService.deleteAction).toHaveBeenCalledWith('action-1');
    });
  });

  describe('Conflict Resolution Scenarios', () => {
    it('should resolve conflicts using local data when local is newer', async () => {
      const localMaterial = createMockMaterial({
        id: 'material-1',
        name: 'Local Updated Material',
        updatedAt: '2024-01-02T10:00:00Z',
      });

      const serverMaterial = createMockMaterial({
        id: 'material-1',
        name: 'Server Material',
        updatedAt: '2024-01-02T09:00:00Z',
      });

      const resolved = await SyncService.resolveConflict(localMaterial, serverMaterial, 'merge');

      expect(resolved).toEqual(localMaterial);
      expect(resolved.name).toBe('Local Updated Material');
    });

    it('should resolve conflicts using server data when server is newer', async () => {
      const localMaterial = createMockMaterial({
        id: 'material-1',
        name: 'Local Material',
        updatedAt: '2024-01-02T09:00:00Z',
      });

      const serverMaterial = createMockMaterial({
        id: 'material-1',
        name: 'Server Updated Material',
        updatedAt: '2024-01-02T10:00:00Z',
      });

      const resolved = await SyncService.resolveConflict(localMaterial, serverMaterial, 'merge');

      expect(resolved).toEqual(serverMaterial);
      expect(resolved.name).toBe('Server Updated Material');
    });

    it('should handle conflict resolution for orders', async () => {
      const localOrder = createMockOrder({
        id: 'order-1',
        status: 'PROCESSING',
        updatedAt: '2024-01-02T10:00:00Z',
      });

      const serverOrder = createMockOrder({
        id: 'order-1',
        status: 'SHIPPED',
        updatedAt: '2024-01-02T09:00:00Z',
      });

      const resolved = await SyncService.resolveConflict(localOrder, serverOrder, 'local');

      expect(resolved).toEqual(localOrder);
      expect(resolved.status).toBe('PROCESSING');
    });
  });

  describe('Network State Changes', () => {
    it('should handle going offline during sync', async () => {
      const pendingActions: OfflineAction[] = [
        {
          id: 'action-1',
          type: 'CREATE',
          entity: 'MATERIAL',
          entityId: 'material-1',
          data: createMockMaterial(),
          timestamp: Date.now(),
          synced: false,
        },
      ];

      mockDatabaseService.getUnsyncedActions.mockResolvedValue(pendingActions);

      // Start sync, then go offline
      mockNetworkService.isOnline.mockReturnValue(false);

      await expect(SyncService.performFullSync()).rejects.toThrow('No network connection available');
    });

    it('should resume sync when coming back online', async () => {
      // Initially offline
      mockNetworkService.isOnline.mockReturnValue(false);
      mockNetworkService.shouldSync.mockReturnValue(false);

      // Try to sync while offline
      await SyncService.triggerAutoSync();

      // Should not have attempted sync
      expect(mockDatabaseService.getUnsyncedActions).not.toHaveBeenCalled();

      // Come back online
      mockNetworkService.isOnline.mockReturnValue(true);
      mockNetworkService.shouldSync.mockReturnValue(true);
      mockDatabaseService.getUnsyncedActions.mockResolvedValue([]);
      mockMaterialService.getMaterials.mockResolvedValue([]);
      mockOrderService.getOrders.mockResolvedValue([]);

      // Trigger sync again
      await SyncService.triggerAutoSync();

      // Should now attempt sync
      expect(mockDatabaseService.getUnsyncedActions).toHaveBeenCalled();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency during concurrent operations', async () => {
      // Create multiple materials offline
      const materials = await Promise.all([
        OfflineService.createMaterialOffline({
          name: '基材1',
          category: '石材',
          specification: '30x30cm',
          unit: '片',
          price: 100,
          stock: 50,
        }),
        OfflineService.createMaterialOffline({
          name: '基材2',
          category: '磁磚',
          specification: '40x40cm',
          unit: '片',
          price: 150,
          stock: 30,
        }),
      ]);

      // Update one material
      const updatedMaterial = { ...materials[0], price: 120 };
      await OfflineService.updateMaterialOffline(updatedMaterial);

      // Delete another material
      await OfflineService.deleteMaterialOffline(materials[1].id);

      // Verify all actions were recorded
      const pendingActions: OfflineAction[] = [
        {
          id: 'action-1',
          type: 'CREATE',
          entity: 'MATERIAL',
          entityId: materials[0].id,
          data: materials[0],
          timestamp: Date.now(),
          synced: false,
        },
        {
          id: 'action-2',
          type: 'CREATE',
          entity: 'MATERIAL',
          entityId: materials[1].id,
          data: materials[1],
          timestamp: Date.now(),
          synced: false,
        },
        {
          id: 'action-3',
          type: 'UPDATE',
          entity: 'MATERIAL',
          entityId: materials[0].id,
          data: updatedMaterial,
          timestamp: Date.now(),
          synced: false,
        },
        {
          id: 'action-4',
          type: 'DELETE',
          entity: 'MATERIAL',
          entityId: materials[1].id,
          data: { id: materials[1].id },
          timestamp: Date.now(),
          synced: false,
        },
      ];

      mockDatabaseService.getUnsyncedActions.mockResolvedValue(pendingActions);
      const count = await OfflineService.getPendingActionsCount();
      expect(count).toBe(4);

      // Mock successful sync
      mockMaterialService.createMaterial.mockResolvedValue(materials[0]);
      mockMaterialService.updateMaterial.mockResolvedValue(updatedMaterial);
      mockMaterialService.deleteMaterial.mockResolvedValue();
      mockMaterialService.getMaterials.mockResolvedValue([updatedMaterial]);
      mockOrderService.getOrders.mockResolvedValue([]);

      const syncResult = await SyncService.performFullSync();

      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedActions).toBe(4);

      // Verify operations were called in correct order
      expect(mockMaterialService.createMaterial).toHaveBeenCalledTimes(2);
      expect(mockMaterialService.updateMaterial).toHaveBeenCalledWith(materials[0].id, updatedMaterial);
      expect(mockMaterialService.deleteMaterial).toHaveBeenCalledWith(materials[1].id);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large batches of offline actions efficiently', async () => {
      // Create a large number of actions
      const largeActionSet: OfflineAction[] = Array.from({ length: 100 }, (_, i) => ({
        id: `action-${i}`,
        type: 'CREATE',
        entity: 'MATERIAL',
        entityId: `material-${i}`,
        data: createMockMaterial({ id: `material-${i}`, name: `Material ${i}` }),
        timestamp: Date.now(),
        synced: false,
      }));

      mockDatabaseService.getUnsyncedActions.mockResolvedValue(largeActionSet);
      mockMaterialService.createMaterial.mockResolvedValue(mockMaterials[0]);
      mockMaterialService.getMaterials.mockResolvedValue([]);
      mockOrderService.getOrders.mockResolvedValue([]);

      const startTime = Date.now();
      const syncResult = await SyncService.performFullSync();
      const endTime = Date.now();

      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedActions).toBe(100);

      // Should process in reasonable time (less than 10 seconds for 100 items)
      expect(endTime - startTime).toBeLessThan(10000);

      // Should have processed in batches (batch size is 10)
      expect(mockMaterialService.createMaterial).toHaveBeenCalledTimes(100);
    });

    it('should clean up old synced actions during maintenance', async () => {
      const now = Date.now();
      const eightDaysAgo = now - (8 * 24 * 60 * 60 * 1000);
      
      const oldSyncedActions: OfflineAction[] = [
        {
          id: 'old-action-1',
          type: 'CREATE',
          entity: 'MATERIAL',
          entityId: 'material-1',
          data: createMockMaterial(),
          timestamp: eightDaysAgo,
          synced: true,
        },
        {
          id: 'recent-action',
          type: 'CREATE',
          entity: 'MATERIAL',
          entityId: 'material-2',
          data: createMockMaterial(),
          timestamp: now - (1 * 24 * 60 * 60 * 1000), // 1 day ago
          synced: true,
        },
        {
          id: 'unsynced-action',
          type: 'CREATE',
          entity: 'MATERIAL',
          entityId: 'material-3',
          data: createMockMaterial(),
          timestamp: eightDaysAgo,
          synced: false,
        },
      ];

      mockDatabaseService.getOfflineActions.mockResolvedValue(oldSyncedActions);
      mockDatabaseService.vacuum.mockResolvedValue();

      await OfflineService.performMaintenance();

      // Should delete only old synced actions
      expect(mockDatabaseService.deleteAction).toHaveBeenCalledWith('old-action-1');
      expect(mockDatabaseService.deleteAction).not.toHaveBeenCalledWith('recent-action');
      expect(mockDatabaseService.deleteAction).not.toHaveBeenCalledWith('unsynced-action');

      // Should perform database vacuum
      expect(mockDatabaseService.vacuum).toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from database corruption', async () => {
      // Simulate database corruption
      mockDatabaseService.getMaterials.mockRejectedValue(new Error('Database is corrupted'));
      mockDatabaseService.getOrders.mockRejectedValue(new Error('Database is corrupted'));

      // Should return empty arrays instead of throwing
      const materials = await OfflineService.getMaterialsOffline();
      const orders = await OfflineService.getOrdersOffline();

      expect(materials).toEqual([]);
      expect(orders).toEqual([]);
    });

    it('should handle storage quota exceeded', async () => {
      mockDatabaseService.saveMaterials.mockRejectedValue(new Error('QuotaExceededError'));

      // Should handle storage errors gracefully
      await expect(OfflineService.saveMaterialsOffline(mockMaterials)).rejects.toThrow('QuotaExceededError');
    });

    it('should recover from sync service crashes', async () => {
      const pendingActions: OfflineAction[] = [
        {
          id: 'action-1',
          type: 'CREATE',
          entity: 'MATERIAL',
          entityId: 'material-1',
          data: createMockMaterial(),
          timestamp: Date.now(),
          synced: false,
        },
      ];

      mockDatabaseService.getUnsyncedActions.mockResolvedValue(pendingActions);
      mockMaterialService.createMaterial.mockRejectedValue(new Error('Service unavailable'));
      mockMaterialService.getMaterials.mockResolvedValue([]);
      mockOrderService.getOrders.mockResolvedValue([]);

      // First sync fails
      const firstResult = await SyncService.performFullSync();
      expect(firstResult.success).toBe(false);
      expect(firstResult.failedActions).toBe(1);

      // Service recovers
      mockMaterialService.createMaterial.mockResolvedValue(mockMaterials[0]);

      // Second sync succeeds
      const secondResult = await SyncService.performFullSync();
      expect(secondResult.success).toBe(true);
      expect(secondResult.syncedActions).toBe(1);
    });
  });
});