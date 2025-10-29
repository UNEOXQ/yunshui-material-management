import { OfflineService } from '../offlineService';
import { DatabaseService } from '../databaseService';
import { StorageService } from '../../utils/storage';
import { Material, Order, OfflineAction } from '../../types';
import { mockMaterials, mockOrders, createMockMaterial, createMockOrder } from '../../test-utils';

// Mock dependencies
jest.mock('../databaseService');
jest.mock('../../utils/storage');
jest.mock('react-native-uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Date.now()),
}));

const mockDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;
const mockStorageService = StorageService as jest.Mocked<typeof StorageService>;

describe('OfflineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize offline service successfully', async () => {
      mockDatabaseService.initialize.mockResolvedValue();

      await OfflineService.initialize();

      expect(mockDatabaseService.initialize).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Database initialization failed');
      mockDatabaseService.initialize.mockRejectedValue(error);

      await expect(OfflineService.initialize()).rejects.toThrow(error);
    });
  });

  describe('material offline operations', () => {
    describe('getMaterialsOffline', () => {
      it('should return materials from database when available', async () => {
        mockDatabaseService.getMaterials.mockResolvedValue(mockMaterials);

        const result = await OfflineService.getMaterialsOffline();

        expect(result).toEqual(mockMaterials);
        expect(mockDatabaseService.getMaterials).toHaveBeenCalled();
      });

      it('should return cached materials when database is empty', async () => {
        mockDatabaseService.getMaterials.mockResolvedValue([]);
        mockStorageService.getObject.mockResolvedValue({
          data: mockMaterials,
          timestamp: Date.now(),
          ttl: 30 * 60 * 1000,
        });

        const result = await OfflineService.getMaterialsOffline();

        expect(result).toEqual(mockMaterials);
      });

      it('should return empty array when no data available', async () => {
        mockDatabaseService.getMaterials.mockResolvedValue([]);
        mockStorageService.getObject.mockResolvedValue(null);

        const result = await OfflineService.getMaterialsOffline();

        expect(result).toEqual([]);
      });

      it('should handle errors gracefully', async () => {
        mockDatabaseService.getMaterials.mockRejectedValue(new Error('Database error'));

        const result = await OfflineService.getMaterialsOffline();

        expect(result).toEqual([]);
      });
    });

    describe('saveMaterialsOffline', () => {
      it('should save materials to database and cache', async () => {
        mockDatabaseService.saveMaterials.mockResolvedValue();
        mockStorageService.setObject.mockResolvedValue();

        await OfflineService.saveMaterialsOffline(mockMaterials);

        expect(mockDatabaseService.saveMaterials).toHaveBeenCalledWith(mockMaterials);
        expect(mockStorageService.setObject).toHaveBeenCalledWith(
          'cached_materials',
          expect.objectContaining({
            data: mockMaterials,
            timestamp: expect.any(Number),
            ttl: expect.any(Number),
          })
        );
      });

      it('should handle save errors', async () => {
        const error = new Error('Save failed');
        mockDatabaseService.saveMaterials.mockRejectedValue(error);

        await expect(OfflineService.saveMaterialsOffline(mockMaterials)).rejects.toThrow(error);
      });
    });

    describe('createMaterialOffline', () => {
      it('should create material with offline action', async () => {
        const materialData = {
          name: '新基材',
          category: '石材',
          specification: '30x30cm',
          unit: '片',
          price: 100,
          stock: 50,
        };

        mockDatabaseService.saveOfflineAction.mockResolvedValue();
        mockDatabaseService.saveMaterials.mockResolvedValue();

        const result = await OfflineService.createMaterialOffline(materialData);

        expect(result).toMatchObject({
          ...materialData,
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });

        expect(mockDatabaseService.saveOfflineAction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'CREATE',
            entity: 'MATERIAL',
            data: result,
            synced: false,
          })
        );

        expect(mockDatabaseService.saveMaterials).toHaveBeenCalledWith([result]);
      });
    });

    describe('updateMaterialOffline', () => {
      it('should update material with offline action', async () => {
        const material = createMockMaterial();
        mockDatabaseService.saveOfflineAction.mockResolvedValue();
        mockDatabaseService.saveMaterials.mockResolvedValue();

        const result = await OfflineService.updateMaterialOffline(material);

        expect(result.updatedAt).not.toBe(material.updatedAt);
        expect(mockDatabaseService.saveOfflineAction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'UPDATE',
            entity: 'MATERIAL',
            entityId: material.id,
            synced: false,
          })
        );
      });
    });

    describe('deleteMaterialOffline', () => {
      it('should mark material for deletion with offline action', async () => {
        const materialId = 'material-1';
        mockDatabaseService.saveOfflineAction.mockResolvedValue();

        await OfflineService.deleteMaterialOffline(materialId);

        expect(mockDatabaseService.saveOfflineAction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'DELETE',
            entity: 'MATERIAL',
            entityId: materialId,
            data: { id: materialId },
            synced: false,
          })
        );
      });
    });
  });

  describe('order offline operations', () => {
    describe('getOrdersOffline', () => {
      it('should return orders from database when available', async () => {
        mockDatabaseService.getOrders.mockResolvedValue(mockOrders);

        const result = await OfflineService.getOrdersOffline();

        expect(result).toEqual(mockOrders);
        expect(mockDatabaseService.getOrders).toHaveBeenCalled();
      });

      it('should return cached orders when database is empty', async () => {
        mockDatabaseService.getOrders.mockResolvedValue([]);
        mockStorageService.getObject.mockResolvedValue({
          data: mockOrders,
          timestamp: Date.now(),
          ttl: 15 * 60 * 1000,
        });

        const result = await OfflineService.getOrdersOffline();

        expect(result).toEqual(mockOrders);
      });
    });

    describe('createOrderOffline', () => {
      it('should create order with offline action', async () => {
        const orderData = {
          orderNumber: 'ORD-TEST',
          customerName: '測試客戶',
          materials: [],
          status: 'PENDING' as const,
          totalAmount: 1000,
        };

        mockDatabaseService.saveOfflineAction.mockResolvedValue();
        mockDatabaseService.saveOrders.mockResolvedValue();

        const result = await OfflineService.createOrderOffline(orderData);

        expect(result).toMatchObject({
          ...orderData,
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });

        expect(mockDatabaseService.saveOfflineAction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'CREATE',
            entity: 'ORDER',
            data: result,
            synced: false,
          })
        );
      });
    });
  });

  describe('offline actions management', () => {
    describe('getOfflineActions', () => {
      it('should return offline actions from database', async () => {
        const mockActions: OfflineAction[] = [
          {
            id: 'action-1',
            type: 'CREATE',
            entity: 'MATERIAL',
            entityId: 'material-1',
            data: mockMaterials[0],
            timestamp: Date.now(),
            synced: false,
          },
        ];

        mockDatabaseService.getOfflineActions.mockResolvedValue(mockActions);

        const result = await OfflineService.getOfflineActions();

        expect(result).toEqual(mockActions);
        expect(mockDatabaseService.getOfflineActions).toHaveBeenCalled();
      });

      it('should handle errors and return empty array', async () => {
        mockDatabaseService.getOfflineActions.mockRejectedValue(new Error('Database error'));

        const result = await OfflineService.getOfflineActions();

        expect(result).toEqual([]);
      });
    });

    describe('getUnsyncedActions', () => {
      it('should return unsynced actions from database', async () => {
        const mockUnsyncedActions: OfflineAction[] = [
          {
            id: 'action-1',
            type: 'CREATE',
            entity: 'MATERIAL',
            entityId: 'material-1',
            data: mockMaterials[0],
            timestamp: Date.now(),
            synced: false,
          },
        ];

        mockDatabaseService.getUnsyncedActions.mockResolvedValue(mockUnsyncedActions);

        const result = await OfflineService.getUnsyncedActions();

        expect(result).toEqual(mockUnsyncedActions);
        expect(mockDatabaseService.getUnsyncedActions).toHaveBeenCalled();
      });
    });

    describe('getPendingActionsCount', () => {
      it('should return count of pending actions', async () => {
        const mockUnsyncedActions: OfflineAction[] = [
          {
            id: 'action-1',
            type: 'CREATE',
            entity: 'MATERIAL',
            entityId: 'material-1',
            data: mockMaterials[0],
            timestamp: Date.now(),
            synced: false,
          },
          {
            id: 'action-2',
            type: 'UPDATE',
            entity: 'ORDER',
            entityId: 'order-1',
            data: mockOrders[0],
            timestamp: Date.now(),
            synced: false,
          },
        ];

        mockDatabaseService.getUnsyncedActions.mockResolvedValue(mockUnsyncedActions);

        const result = await OfflineService.getPendingActionsCount();

        expect(result).toBe(2);
      });

      it('should return 0 when no pending actions', async () => {
        mockDatabaseService.getUnsyncedActions.mockResolvedValue([]);

        const result = await OfflineService.getPendingActionsCount();

        expect(result).toBe(0);
      });
    });

    describe('markActionAsSynced', () => {
      it('should mark action as synced', async () => {
        const actionId = 'action-1';
        mockDatabaseService.markActionAsSynced.mockResolvedValue();

        await OfflineService.markActionAsSynced(actionId);

        expect(mockDatabaseService.markActionAsSynced).toHaveBeenCalledWith(actionId);
      });
    });

    describe('updateActionError', () => {
      it('should update action error and increment retry count', async () => {
        const actionId = 'action-1';
        const error = 'Network error';
        const mockAction: OfflineAction = {
          id: actionId,
          type: 'CREATE',
          entity: 'MATERIAL',
          entityId: 'material-1',
          data: mockMaterials[0],
          timestamp: Date.now(),
          synced: false,
          retryCount: 1,
        };

        mockDatabaseService.getOfflineActions.mockResolvedValue([mockAction]);
        mockDatabaseService.updateActionError.mockResolvedValue();

        await OfflineService.updateActionError(actionId, error);

        expect(mockDatabaseService.updateActionError).toHaveBeenCalledWith(actionId, error, 2);
      });
    });
  });

  describe('sync state management', () => {
    describe('getLastSyncTime', () => {
      it('should return last sync time from database', async () => {
        const timestamp = Date.now();
        mockDatabaseService.getLastSyncTime.mockResolvedValue(timestamp);

        const result = await OfflineService.getLastSyncTime();

        expect(result).toBe(timestamp);
        expect(mockDatabaseService.getLastSyncTime).toHaveBeenCalled();
      });

      it('should return 0 on error', async () => {
        mockDatabaseService.getLastSyncTime.mockRejectedValue(new Error('Database error'));

        const result = await OfflineService.getLastSyncTime();

        expect(result).toBe(0);
      });
    });

    describe('setLastSyncTime', () => {
      it('should set last sync time in database and storage', async () => {
        const timestamp = Date.now();
        mockDatabaseService.setLastSyncTime.mockResolvedValue();
        mockStorageService.setItem.mockResolvedValue();

        await OfflineService.setLastSyncTime(timestamp);

        expect(mockDatabaseService.setLastSyncTime).toHaveBeenCalledWith(timestamp);
        expect(mockStorageService.setItem).toHaveBeenCalledWith('last_sync_time', timestamp.toString());
      });
    });
  });

  describe('data cleanup', () => {
    describe('clearOfflineData', () => {
      it('should clear all offline data', async () => {
        mockDatabaseService.clearAllData.mockResolvedValue();
        mockStorageService.removeItem.mockResolvedValue();

        await OfflineService.clearOfflineData();

        expect(mockDatabaseService.clearAllData).toHaveBeenCalled();
        expect(mockStorageService.removeItem).toHaveBeenCalledTimes(4);
      });
    });

    describe('clearSyncedActions', () => {
      it('should clear synced actions', async () => {
        mockDatabaseService.clearSyncedActions.mockResolvedValue();

        await OfflineService.clearSyncedActions();

        expect(mockDatabaseService.clearSyncedActions).toHaveBeenCalled();
      });
    });
  });

  describe('offline statistics', () => {
    describe('getOfflineStats', () => {
      it('should return offline statistics', async () => {
        const mockUnsyncedActions: OfflineAction[] = [
          {
            id: 'action-1',
            type: 'CREATE',
            entity: 'MATERIAL',
            entityId: 'material-1',
            data: mockMaterials[0],
            timestamp: Date.now(),
            synced: false,
          },
        ];

        mockDatabaseService.getMaterials.mockResolvedValue(mockMaterials);
        mockDatabaseService.getOrders.mockResolvedValue(mockOrders);
        mockDatabaseService.getUnsyncedActions.mockResolvedValue(mockUnsyncedActions);
        mockDatabaseService.getLastSyncTime.mockResolvedValue(Date.now());

        const result = await OfflineService.getOfflineStats();

        expect(result).toEqual({
          materialsCount: mockMaterials.length,
          ordersCount: mockOrders.length,
          pendingActionsCount: 1,
          lastSyncTime: expect.any(Number),
        });
      });

      it('should return default stats on error', async () => {
        mockDatabaseService.getMaterials.mockRejectedValue(new Error('Database error'));
        mockDatabaseService.getOrders.mockRejectedValue(new Error('Database error'));
        mockDatabaseService.getUnsyncedActions.mockRejectedValue(new Error('Database error'));
        mockDatabaseService.getLastSyncTime.mockRejectedValue(new Error('Database error'));

        const result = await OfflineService.getOfflineStats();

        expect(result).toEqual({
          materialsCount: 0,
          ordersCount: 0,
          pendingActionsCount: 0,
          lastSyncTime: 0,
        });
      });
    });
  });

  describe('maintenance operations', () => {
    describe('performMaintenance', () => {
      it('should perform maintenance operations', async () => {
        const now = Date.now();
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        
        const oldSyncedActions: OfflineAction[] = [
          {
            id: 'old-action',
            type: 'CREATE',
            entity: 'MATERIAL',
            entityId: 'material-1',
            data: mockMaterials[0],
            timestamp: sevenDaysAgo - 1000,
            synced: true,
          },
        ];

        mockStorageService.getObject
          .mockResolvedValueOnce(null) // materials cache expired
          .mockResolvedValueOnce(null); // orders cache expired
        
        mockDatabaseService.getOfflineActions.mockResolvedValue(oldSyncedActions);
        mockDatabaseService.deleteAction.mockResolvedValue();
        mockDatabaseService.vacuum.mockResolvedValue();
        mockStorageService.removeItem.mockResolvedValue();

        await OfflineService.performMaintenance();

        expect(mockStorageService.removeItem).toHaveBeenCalledWith('cached_materials');
        expect(mockStorageService.removeItem).toHaveBeenCalledWith('cached_orders');
        expect(mockDatabaseService.deleteAction).toHaveBeenCalledWith('old-action');
        expect(mockDatabaseService.vacuum).toHaveBeenCalled();
      });

      it('should handle maintenance errors gracefully', async () => {
        mockStorageService.getObject.mockRejectedValue(new Error('Storage error'));

        await expect(OfflineService.performMaintenance()).resolves.not.toThrow();
      });
    });
  });
});