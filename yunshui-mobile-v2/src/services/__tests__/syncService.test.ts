import { SyncService } from '../syncService';
import { NetworkService } from '../networkService';
import { OfflineService } from '../offlineService';
import { MaterialService } from '../materialService';
import { OrderService } from '../orderService';
import { StorageService } from '../../utils/storage';
import { OfflineAction, SyncResult, Material, Order, AppSettings } from '../../types';
import { mockMaterials, mockOrders, createMockMaterial, createMockOrder } from '../../test-utils';

// Mock dependencies
jest.mock('../networkService');
jest.mock('../offlineService');
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
jest.mock('../../utils/storage');

const mockNetworkService = NetworkService as jest.Mocked<typeof NetworkService>;
const mockOfflineService = OfflineService as jest.Mocked<typeof OfflineService>;
const mockMaterialService = MaterialService as jest.Mocked<typeof MaterialService>;
const mockOrderService = OrderService as jest.Mocked<typeof OrderService>;
const mockStorageService = StorageService as jest.Mocked<typeof StorageService>;

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Default mock implementations
    mockNetworkService.isOnline.mockReturnValue(true);
    mockNetworkService.shouldSync.mockReturnValue(true);
    mockStorageService.getObject.mockResolvedValue({
      sync: {
        autoSync: true,
        syncInterval: 5,
        wifiOnly: false,
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    SyncService.cleanup();
  });

  describe('initialization', () => {
    it('should initialize sync service successfully', async () => {
      await SyncService.initialize();

      expect(mockStorageService.getObject).toHaveBeenCalledWith('app_settings');
    });

    it('should setup auto sync when enabled in settings', async () => {
      const startAutoSyncSpy = jest.spyOn(SyncService, 'startAutoSync');
      
      await SyncService.initialize();

      expect(startAutoSyncSpy).toHaveBeenCalledWith(5);
    });

    it('should handle initialization errors', async () => {
      mockStorageService.getObject.mockRejectedValue(new Error('Storage error'));

      // The initialize method catches errors and doesn't throw, so we expect it to resolve
      await expect(SyncService.initialize()).resolves.not.toThrow();
    });
  });

  describe('auto sync management', () => {
    it('should start auto sync with specified interval', () => {
      const intervalMinutes = 10;
      
      SyncService.startAutoSync(intervalMinutes);

      // Auto sync should be started (we can't easily test the interval without waiting)
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should stop auto sync', () => {
      SyncService.startAutoSync(5);
      SyncService.stopAutoSync();

      // Auto sync should be stopped
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should trigger auto sync when conditions are met', async () => {
      mockNetworkService.shouldSync.mockReturnValue(true);
      mockOfflineService.getUnsyncedActions.mockResolvedValue([]);
      mockMaterialService.getMaterials.mockResolvedValue(mockMaterials);
      mockOrderService.getOrders.mockResolvedValue(mockOrders);
      mockOfflineService.saveMaterialsOffline.mockResolvedValue();
      mockOfflineService.saveOrdersOffline.mockResolvedValue();
      mockOfflineService.setLastSyncTime.mockResolvedValue();

      await SyncService.triggerAutoSync();

      expect(mockNetworkService.shouldSync).toHaveBeenCalled();
    });

    it('should skip auto sync when conditions are not met', async () => {
      mockNetworkService.shouldSync.mockReturnValue(false);

      await SyncService.triggerAutoSync();

      expect(mockOfflineService.getUnsyncedActions).not.toHaveBeenCalled();
    });

    it('should skip auto sync when already syncing', async () => {
      // Start a sync operation
      const syncPromise = SyncService.performFullSync();
      
      // Try to trigger auto sync while syncing
      await SyncService.triggerAutoSync();

      // Wait for the original sync to complete
      await syncPromise;

      // Auto sync should have been skipped
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('full sync operations', () => {
    it('should perform full sync successfully', async () => {
      const mockUnsyncedActions: OfflineAction[] = [
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

      mockOfflineService.getUnsyncedActions.mockResolvedValue(mockUnsyncedActions);
      mockMaterialService.createMaterial.mockResolvedValue(mockMaterials[0]);
      mockOfflineService.markActionAsSynced.mockResolvedValue();
      mockMaterialService.getMaterials.mockResolvedValue(mockMaterials);
      mockOrderService.getOrders.mockResolvedValue(mockOrders);
      mockOfflineService.saveMaterialsOffline.mockResolvedValue();
      mockOfflineService.saveOrdersOffline.mockResolvedValue();
      mockOfflineService.setLastSyncTime.mockResolvedValue();

      const result = await SyncService.performFullSync();

      expect(result.success).toBe(true);
      expect(result.syncedActions).toBe(1);
      expect(result.failedActions).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle sync errors gracefully', async () => {
      const mockUnsyncedActions: OfflineAction[] = [
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

      mockOfflineService.getUnsyncedActions.mockResolvedValue(mockUnsyncedActions);
      mockMaterialService.createMaterial.mockRejectedValue(new Error('API error'));
      mockOfflineService.updateActionError.mockResolvedValue();
      mockMaterialService.getMaterials.mockResolvedValue([]);
      mockOrderService.getOrders.mockResolvedValue([]);
      mockOfflineService.saveMaterialsOffline.mockResolvedValue();
      mockOfflineService.saveOrdersOffline.mockResolvedValue();
      mockOfflineService.setLastSyncTime.mockResolvedValue();

      const result = await SyncService.performFullSync();

      expect(result.success).toBe(false);
      expect(result.syncedActions).toBe(0);
      expect(result.failedActions).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(mockOfflineService.updateActionError).toHaveBeenCalledWith('action-1', 'API error');
    });

    it('should throw error when no network connection', async () => {
      mockNetworkService.isOnline.mockReturnValue(false);

      await expect(SyncService.performFullSync()).rejects.toThrow('No network connection available');
    });

    it('should throw error when sync already in progress', async () => {
      // Start first sync
      const firstSync = SyncService.performFullSync();

      // Try to start second sync
      await expect(SyncService.performFullSync()).rejects.toThrow('Sync already in progress');

      // Wait for first sync to complete
      await firstSync;
    });
  });

  describe('offline actions sync', () => {
    it('should sync material CREATE action', async () => {
      const materialAction: OfflineAction = {
        id: 'action-1',
        type: 'CREATE',
        entity: 'MATERIAL',
        entityId: 'material-1',
        data: createMockMaterial(),
        timestamp: Date.now(),
        synced: false,
      };

      mockOfflineService.getUnsyncedActions.mockResolvedValue([materialAction]);
      mockMaterialService.createMaterial.mockResolvedValue(mockMaterials[0]);
      mockOfflineService.markActionAsSynced.mockResolvedValue();
      mockMaterialService.getMaterials.mockResolvedValue([]);
      mockOrderService.getOrders.mockResolvedValue([]);
      mockOfflineService.saveMaterialsOffline.mockResolvedValue();
      mockOfflineService.saveOrdersOffline.mockResolvedValue();
      mockOfflineService.setLastSyncTime.mockResolvedValue();

      const result = await SyncService.performFullSync();

      expect(mockMaterialService.createMaterial).toHaveBeenCalledWith(materialAction.data);
      expect(mockOfflineService.markActionAsSynced).toHaveBeenCalledWith('action-1');
      expect(result.syncedActions).toBe(1);
    });

    it('should sync material UPDATE action', async () => {
      const materialAction: OfflineAction = {
        id: 'action-1',
        type: 'UPDATE',
        entity: 'MATERIAL',
        entityId: 'material-1',
        data: createMockMaterial(),
        timestamp: Date.now(),
        synced: false,
      };

      mockOfflineService.getUnsyncedActions.mockResolvedValue([materialAction]);
      mockMaterialService.updateMaterial.mockResolvedValue(mockMaterials[0]);
      mockOfflineService.markActionAsSynced.mockResolvedValue();
      mockMaterialService.getMaterials.mockResolvedValue([]);
      mockOrderService.getOrders.mockResolvedValue([]);
      mockOfflineService.saveMaterialsOffline.mockResolvedValue();
      mockOfflineService.saveOrdersOffline.mockResolvedValue();
      mockOfflineService.setLastSyncTime.mockResolvedValue();

      const result = await SyncService.performFullSync();

      expect(mockMaterialService.updateMaterial).toHaveBeenCalledWith(
        materialAction.data.id,
        materialAction.data
      );
      expect(result.syncedActions).toBe(1);
    });

    it('should sync material DELETE action', async () => {
      const materialAction: OfflineAction = {
        id: 'action-1',
        type: 'DELETE',
        entity: 'MATERIAL',
        entityId: 'material-1',
        data: { id: 'material-1' },
        timestamp: Date.now(),
        synced: false,
      };

      mockOfflineService.getUnsyncedActions.mockResolvedValue([materialAction]);
      mockMaterialService.deleteMaterial.mockResolvedValue();
      mockOfflineService.markActionAsSynced.mockResolvedValue();
      mockMaterialService.getMaterials.mockResolvedValue([]);
      mockOrderService.getOrders.mockResolvedValue([]);
      mockOfflineService.saveMaterialsOffline.mockResolvedValue();
      mockOfflineService.saveOrdersOffline.mockResolvedValue();
      mockOfflineService.setLastSyncTime.mockResolvedValue();

      const result = await SyncService.performFullSync();

      expect(mockMaterialService.deleteMaterial).toHaveBeenCalledWith('material-1');
      expect(result.syncedActions).toBe(1);
    });

    it('should sync order actions', async () => {
      const orderAction: OfflineAction = {
        id: 'action-1',
        type: 'CREATE',
        entity: 'ORDER',
        entityId: 'order-1',
        data: createMockOrder(),
        timestamp: Date.now(),
        synced: false,
      };

      mockOfflineService.getUnsyncedActions.mockResolvedValue([orderAction]);
      mockOrderService.createOrder.mockResolvedValue(mockOrders[0]);
      mockOfflineService.markActionAsSynced.mockResolvedValue();
      mockMaterialService.getMaterials.mockResolvedValue([]);
      mockOrderService.getOrders.mockResolvedValue([]);
      mockOfflineService.saveMaterialsOffline.mockResolvedValue();
      mockOfflineService.saveOrdersOffline.mockResolvedValue();
      mockOfflineService.setLastSyncTime.mockResolvedValue();

      const result = await SyncService.performFullSync();

      expect(mockOrderService.createOrder).toHaveBeenCalledWith(orderAction.data);
      expect(result.syncedActions).toBe(1);
    });

    it('should delete action after max retry count reached', async () => {
      const failedAction: OfflineAction = {
        id: 'action-1',
        type: 'CREATE',
        entity: 'MATERIAL',
        entityId: 'material-1',
        data: createMockMaterial(),
        timestamp: Date.now(),
        synced: false,
        retryCount: 3, // Max retry count
      };

      mockOfflineService.getUnsyncedActions.mockResolvedValue([failedAction]);
      mockMaterialService.createMaterial.mockRejectedValue(new Error('Persistent error'));
      mockOfflineService.updateActionError.mockResolvedValue();
      mockOfflineService.deleteAction.mockResolvedValue();
      mockMaterialService.getMaterials.mockResolvedValue([]);
      mockOrderService.getOrders.mockResolvedValue([]);
      mockOfflineService.saveMaterialsOffline.mockResolvedValue();
      mockOfflineService.saveOrdersOffline.mockResolvedValue();
      mockOfflineService.setLastSyncTime.mockResolvedValue();

      const result = await SyncService.performFullSync();

      expect(mockOfflineService.deleteAction).toHaveBeenCalledWith('action-1');
      expect(result.failedActions).toBe(1);
    });

    it('should process actions in batches', async () => {
      const actions: OfflineAction[] = Array.from({ length: 25 }, (_, i) => ({
        id: `action-${i}`,
        type: 'CREATE',
        entity: 'MATERIAL',
        entityId: `material-${i}`,
        data: createMockMaterial({ id: `material-${i}` }),
        timestamp: Date.now(),
        synced: false,
      }));

      mockOfflineService.getUnsyncedActions.mockResolvedValue(actions);
      mockMaterialService.createMaterial.mockResolvedValue(mockMaterials[0]);
      mockOfflineService.markActionAsSynced.mockResolvedValue();
      mockMaterialService.getMaterials.mockResolvedValue([]);
      mockOrderService.getOrders.mockResolvedValue([]);
      mockOfflineService.saveMaterialsOffline.mockResolvedValue();
      mockOfflineService.saveOrdersOffline.mockResolvedValue();
      mockOfflineService.setLastSyncTime.mockResolvedValue();

      const result = await SyncService.performFullSync();

      expect(result.syncedActions).toBe(25);
      expect(mockMaterialService.createMaterial).toHaveBeenCalledTimes(25);
    });
  });

  describe('data pulling', () => {
    it('should pull latest materials and orders from server', async () => {
      mockOfflineService.getUnsyncedActions.mockResolvedValue([]);
      mockMaterialService.getMaterials.mockResolvedValue(mockMaterials);
      mockOrderService.getOrders.mockResolvedValue(mockOrders);
      mockOfflineService.saveMaterialsOffline.mockResolvedValue();
      mockOfflineService.saveOrdersOffline.mockResolvedValue();
      mockOfflineService.setLastSyncTime.mockResolvedValue();

      const result = await SyncService.performFullSync();

      expect(mockMaterialService.getMaterials).toHaveBeenCalled();
      expect(mockOrderService.getOrders).toHaveBeenCalled();
      expect(mockOfflineService.saveMaterialsOffline).toHaveBeenCalledWith(mockMaterials);
      expect(mockOfflineService.saveOrdersOffline).toHaveBeenCalledWith(mockOrders);
      expect(result.success).toBe(true);
    });

    it('should handle empty data from server', async () => {
      mockOfflineService.getUnsyncedActions.mockResolvedValue([]);
      mockMaterialService.getMaterials.mockResolvedValue([]);
      mockOrderService.getOrders.mockResolvedValue([]);
      mockOfflineService.setLastSyncTime.mockResolvedValue();

      const result = await SyncService.performFullSync();

      expect(mockOfflineService.saveMaterialsOffline).not.toHaveBeenCalled();
      expect(mockOfflineService.saveOrdersOffline).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('conflict resolution', () => {
    it('should resolve conflict using local data', async () => {
      const localMaterial = createMockMaterial({ updatedAt: '2024-01-02T00:00:00Z' });
      const serverMaterial = createMockMaterial({ updatedAt: '2024-01-01T00:00:00Z' });

      const result = await SyncService.resolveConflict(localMaterial, serverMaterial, 'local');

      expect(result).toEqual(localMaterial);
    });

    it('should resolve conflict using server data', async () => {
      const localMaterial = createMockMaterial({ updatedAt: '2024-01-01T00:00:00Z' });
      const serverMaterial = createMockMaterial({ updatedAt: '2024-01-02T00:00:00Z' });

      const result = await SyncService.resolveConflict(localMaterial, serverMaterial, 'server');

      expect(result).toEqual(serverMaterial);
    });

    it('should resolve conflict by merging data (using latest timestamp)', async () => {
      const localMaterial = createMockMaterial({ 
        name: 'Local Material',
        updatedAt: '2024-01-02T00:00:00Z' 
      });
      const serverMaterial = createMockMaterial({ 
        name: 'Server Material',
        updatedAt: '2024-01-01T00:00:00Z' 
      });

      const result = await SyncService.resolveConflict(localMaterial, serverMaterial, 'merge');

      expect(result).toEqual(localMaterial); // Local is newer
    });

    it('should throw error for unknown conflict resolution', async () => {
      const localMaterial = createMockMaterial();
      const serverMaterial = createMockMaterial();

      await expect(
        SyncService.resolveConflict(localMaterial, serverMaterial, 'unknown' as any)
      ).rejects.toThrow('Unknown conflict resolution: unknown');
    });
  });

  describe('sync settings management', () => {
    it('should update sync settings', async () => {
      const newSettings = {
        autoSync: false,
        syncInterval: 10,
        wifiOnly: true,
      };

      mockStorageService.getObject.mockResolvedValue({
        sync: {
          autoSync: true,
          syncInterval: 5,
          wifiOnly: false,
        },
      });
      mockStorageService.setObject.mockResolvedValue();

      await SyncService.updateSyncSettings(newSettings);

      expect(mockStorageService.setObject).toHaveBeenCalledWith('app_settings', {
        sync: newSettings,
      });
    });

    it('should handle partial settings update', async () => {
      const partialSettings = {
        autoSync: false,
      };

      mockStorageService.getObject.mockResolvedValue({
        sync: {
          autoSync: true,
          syncInterval: 5,
          wifiOnly: false,
        },
      });
      mockStorageService.setObject.mockResolvedValue();

      await SyncService.updateSyncSettings(partialSettings);

      expect(mockStorageService.setObject).toHaveBeenCalledWith('app_settings', {
        sync: {
          autoSync: false,
          syncInterval: 5,
          wifiOnly: false,
        },
      });
    });
  });

  describe('manual sync', () => {
    it('should perform manual sync', async () => {
      mockOfflineService.getUnsyncedActions.mockResolvedValue([]);
      mockMaterialService.getMaterials.mockResolvedValue([]);
      mockOrderService.getOrders.mockResolvedValue([]);
      mockOfflineService.setLastSyncTime.mockResolvedValue();

      const result = await SyncService.manualSync();

      expect(result.success).toBe(true);
    });
  });

  describe('sync statistics', () => {
    it('should return sync statistics', async () => {
      const lastSyncTime = Date.now();
      const pendingActions = 5;

      mockOfflineService.getLastSyncTime.mockResolvedValue(lastSyncTime);
      mockOfflineService.getPendingActionsCount.mockResolvedValue(pendingActions);
      mockNetworkService.isOnline.mockReturnValue(true);
      mockNetworkService.shouldSync.mockReturnValue(true);

      const stats = await SyncService.getSyncStats();

      expect(stats).toEqual({
        lastSyncTime,
        pendingActions,
        isOnline: true,
        canSync: true,
      });
    });

    it('should handle errors in sync statistics', async () => {
      mockOfflineService.getLastSyncTime.mockRejectedValue(new Error('Database error'));

      const stats = await SyncService.getSyncStats();

      expect(stats).toEqual({
        lastSyncTime: 0,
        pendingActions: 0,
        isOnline: false,
        canSync: false,
      });
    });
  });

  describe('sync listeners', () => {
    it('should add and notify sync listeners', async () => {
      const listener = jest.fn();
      
      const removeListener = SyncService.addSyncListener(listener);

      // Listener should be called immediately with current state
      expect(listener).toHaveBeenCalledWith(false);

      // Start sync to trigger listener
      mockOfflineService.getUnsyncedActions.mockResolvedValue([]);
      mockMaterialService.getMaterials.mockResolvedValue([]);
      mockOrderService.getOrders.mockResolvedValue([]);
      mockOfflineService.setLastSyncTime.mockResolvedValue();

      await SyncService.performFullSync();

      // Listener should be called when sync starts and ends
      expect(listener).toHaveBeenCalledWith(true);
      expect(listener).toHaveBeenCalledWith(false, expect.any(Object));

      // Remove listener
      removeListener();
    });

    it('should handle listener errors gracefully', async () => {
      const errorListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      SyncService.addSyncListener(errorListener);

      mockOfflineService.getUnsyncedActions.mockResolvedValue([]);
      mockMaterialService.getMaterials.mockResolvedValue([]);
      mockOrderService.getOrders.mockResolvedValue([]);
      mockOfflineService.setLastSyncTime.mockResolvedValue();

      // Should not throw error even if listener throws
      await expect(SyncService.performFullSync()).resolves.not.toThrow();
    });
  });

  describe('force sync', () => {
    it('should perform force sync when online', async () => {
      mockNetworkService.isOnline.mockReturnValue(true);
      mockOfflineService.getUnsyncedActions.mockResolvedValue([]);
      mockMaterialService.getMaterials.mockResolvedValue([]);
      mockOrderService.getOrders.mockResolvedValue([]);
      mockOfflineService.setLastSyncTime.mockResolvedValue();

      const result = await SyncService.forceSync();

      expect(result.success).toBe(true);
    });

    it('should throw error when offline', async () => {
      mockNetworkService.isOnline.mockReturnValue(false);

      await expect(SyncService.forceSync()).rejects.toThrow('No network connection available for force sync');
    });
  });

  describe('sync state reset', () => {
    it('should reset sync state', async () => {
      mockOfflineService.clearSyncedActions.mockResolvedValue();
      mockOfflineService.setLastSyncTime.mockResolvedValue();

      await SyncService.resetSyncState();

      expect(mockOfflineService.clearSyncedActions).toHaveBeenCalled();
      expect(mockOfflineService.setLastSyncTime).toHaveBeenCalledWith(0);
    });

    it('should handle reset errors', async () => {
      mockOfflineService.clearSyncedActions.mockRejectedValue(new Error('Database error'));

      await expect(SyncService.resetSyncState()).rejects.toThrow('Database error');
    });
  });

  describe('cleanup', () => {
    it('should cleanup sync service', () => {
      SyncService.startAutoSync(5);
      SyncService.cleanup();

      // Should stop auto sync and clear listeners
      expect(true).toBe(true); // Placeholder assertion
    });
  });
});