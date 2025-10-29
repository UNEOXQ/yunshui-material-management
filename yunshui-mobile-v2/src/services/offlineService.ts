import { DatabaseService } from './databaseService';
import { StorageService } from '../utils/storage';
import { 
  Material, 
  Order, 
  OfflineAction, 
  SyncResult, 
  NetworkState,
  CachedData 
} from '../types';
import { v4 as uuidv4 } from 'react-native-uuid';

export class OfflineService {
  private static readonly CACHE_KEYS = {
    MATERIALS: 'cached_materials',
    ORDERS: 'cached_orders',
    LAST_SYNC: 'last_sync_time',
    NETWORK_STATE: 'network_state',
  };

  private static readonly CACHE_DURATION = {
    MATERIALS: 30 * 60 * 1000, // 30 minutes
    ORDERS: 15 * 60 * 1000,    // 15 minutes
  };

  // 初始化離線服務
  static async initialize(): Promise<void> {
    try {
      await DatabaseService.initialize();
      console.log('Offline service initialized successfully');
    } catch (error) {
      console.error('Error initializing offline service:', error);
      throw error;
    }
  }

  // 檢查數據是否需要刷新
  private static async isCacheExpired(key: string, duration: number): Promise<boolean> {
    try {
      const cacheData = await StorageService.getObject<CachedData<any>>(key);
      if (!cacheData) return true;
      
      const now = Date.now();
      return (now - cacheData.timestamp) > duration;
    } catch (error) {
      console.error('Error checking cache expiration:', error);
      return true;
    }
  }

  // 保存快取數據
  private static async setCacheData<T>(key: string, data: T): Promise<void> {
    try {
      const cacheData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        ttl: this.CACHE_DURATION.MATERIALS, // 默認使用材料快取時間
      };
      await StorageService.setObject(key, cacheData);
    } catch (error) {
      console.error('Error setting cache data:', error);
    }
  }

  // 獲取快取數據
  private static async getCacheData<T>(key: string): Promise<T | null> {
    try {
      const cacheData = await StorageService.getObject<CachedData<T>>(key);
      return cacheData ? cacheData.data : null;
    } catch (error) {
      console.error('Error getting cache data:', error);
      return null;
    }
  }

  // 基材離線操作
  static async getMaterialsOffline(): Promise<Material[]> {
    try {
      // 首先嘗試從數據庫獲取
      const materials = await DatabaseService.getMaterials();
      
      // 如果數據庫為空，嘗試從快取獲取
      if (materials.length === 0) {
        const cachedMaterials = await this.getCacheData<Material[]>(this.CACHE_KEYS.MATERIALS);
        return cachedMaterials || [];
      }
      
      return materials;
    } catch (error) {
      console.error('Error getting materials offline:', error);
      return [];
    }
  }

  static async saveMaterialsOffline(materials: Material[]): Promise<void> {
    try {
      // 保存到數據庫
      await DatabaseService.saveMaterials(materials);
      
      // 保存到快取
      await this.setCacheData(this.CACHE_KEYS.MATERIALS, materials);
      
      console.log(`Saved ${materials.length} materials offline`);
    } catch (error) {
      console.error('Error saving materials offline:', error);
      throw error;
    }
  }

  static async createMaterialOffline(material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Promise<Material> {
    try {
      const now = new Date().toISOString();
      const newMaterial: Material = {
        ...material,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };

      // 保存離線操作記錄
      const action: OfflineAction = {
        id: uuidv4(),
        type: 'CREATE',
        entity: 'MATERIAL',
        entityId: newMaterial.id,
        data: newMaterial,
        timestamp: Date.now(),
        synced: false,
      };

      await DatabaseService.saveOfflineAction(action);
      
      // 保存到本地數據庫
      await DatabaseService.saveMaterials([newMaterial]);
      
      console.log('Material created offline:', newMaterial.id);
      return newMaterial;
    } catch (error) {
      console.error('Error creating material offline:', error);
      throw error;
    }
  }

  static async updateMaterialOffline(material: Material): Promise<Material> {
    try {
      const updatedMaterial: Material = {
        ...material,
        updatedAt: new Date().toISOString(),
      };

      // 保存離線操作記錄
      const action: OfflineAction = {
        id: uuidv4(),
        type: 'UPDATE',
        entity: 'MATERIAL',
        entityId: material.id,
        data: updatedMaterial,
        timestamp: Date.now(),
        synced: false,
      };

      await DatabaseService.saveOfflineAction(action);
      
      // 更新本地數據庫
      await DatabaseService.saveMaterials([updatedMaterial]);
      
      console.log('Material updated offline:', material.id);
      return updatedMaterial;
    } catch (error) {
      console.error('Error updating material offline:', error);
      throw error;
    }
  }

  static async deleteMaterialOffline(materialId: string): Promise<void> {
    try {
      // 保存離線操作記錄
      const action: OfflineAction = {
        id: uuidv4(),
        type: 'DELETE',
        entity: 'MATERIAL',
        entityId: materialId,
        data: { id: materialId },
        timestamp: Date.now(),
        synced: false,
      };

      await DatabaseService.saveOfflineAction(action);
      
      console.log('Material marked for deletion offline:', materialId);
    } catch (error) {
      console.error('Error deleting material offline:', error);
      throw error;
    }
  }

  // 訂單離線操作
  static async getOrdersOffline(): Promise<Order[]> {
    try {
      // 首先嘗試從數據庫獲取
      const orders = await DatabaseService.getOrders();
      
      // 如果數據庫為空，嘗試從快取獲取
      if (orders.length === 0) {
        const cachedOrders = await this.getCacheData<Order[]>(this.CACHE_KEYS.ORDERS);
        return cachedOrders || [];
      }
      
      return orders;
    } catch (error) {
      console.error('Error getting orders offline:', error);
      return [];
    }
  }

  static async saveOrdersOffline(orders: Order[]): Promise<void> {
    try {
      // 保存到數據庫
      await DatabaseService.saveOrders(orders);
      
      // 保存到快取
      await this.setCacheData(this.CACHE_KEYS.ORDERS, orders);
      
      console.log(`Saved ${orders.length} orders offline`);
    } catch (error) {
      console.error('Error saving orders offline:', error);
      throw error;
    }
  }

  static async createOrderOffline(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    try {
      const now = new Date().toISOString();
      const newOrder: Order = {
        ...order,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };

      // 保存離線操作記錄
      const action: OfflineAction = {
        id: uuidv4(),
        type: 'CREATE',
        entity: 'ORDER',
        entityId: newOrder.id,
        data: newOrder,
        timestamp: Date.now(),
        synced: false,
      };

      await DatabaseService.saveOfflineAction(action);
      
      // 保存到本地數據庫
      await DatabaseService.saveOrders([newOrder]);
      
      console.log('Order created offline:', newOrder.id);
      return newOrder;
    } catch (error) {
      console.error('Error creating order offline:', error);
      throw error;
    }
  }

  static async updateOrderOffline(order: Order): Promise<Order> {
    try {
      const updatedOrder: Order = {
        ...order,
        updatedAt: new Date().toISOString(),
      };

      // 保存離線操作記錄
      const action: OfflineAction = {
        id: uuidv4(),
        type: 'UPDATE',
        entity: 'ORDER',
        entityId: order.id,
        data: updatedOrder,
        timestamp: Date.now(),
        synced: false,
      };

      await DatabaseService.saveOfflineAction(action);
      
      // 更新本地數據庫
      await DatabaseService.saveOrders([updatedOrder]);
      
      console.log('Order updated offline:', order.id);
      return updatedOrder;
    } catch (error) {
      console.error('Error updating order offline:', error);
      throw error;
    }
  }

  static async deleteOrderOffline(orderId: string): Promise<void> {
    try {
      // 保存離線操作記錄
      const action: OfflineAction = {
        id: uuidv4(),
        type: 'DELETE',
        entity: 'ORDER',
        entityId: orderId,
        data: { id: orderId },
        timestamp: Date.now(),
        synced: false,
      };

      await DatabaseService.saveOfflineAction(action);
      
      console.log('Order marked for deletion offline:', orderId);
    } catch (error) {
      console.error('Error deleting order offline:', error);
      throw error;
    }
  }

  // 離線操作管理
  static async getOfflineActions(): Promise<OfflineAction[]> {
    try {
      return await DatabaseService.getOfflineActions();
    } catch (error) {
      console.error('Error getting offline actions:', error);
      return [];
    }
  }

  static async getUnsyncedActions(): Promise<OfflineAction[]> {
    try {
      return await DatabaseService.getUnsyncedActions();
    } catch (error) {
      console.error('Error getting unsynced actions:', error);
      return [];
    }
  }

  static async getPendingActionsCount(): Promise<number> {
    try {
      const actions = await this.getUnsyncedActions();
      return actions.length;
    } catch (error) {
      console.error('Error getting pending actions count:', error);
      return 0;
    }
  }

  static async markActionAsSynced(actionId: string): Promise<void> {
    try {
      await DatabaseService.markActionAsSynced(actionId);
    } catch (error) {
      console.error('Error marking action as synced:', error);
      throw error;
    }
  }

  static async updateActionError(actionId: string, error: string): Promise<void> {
    try {
      const action = await this.getActionById(actionId);
      const retryCount = (action?.retryCount || 0) + 1;
      await DatabaseService.updateActionError(actionId, error, retryCount);
    } catch (err) {
      console.error('Error updating action error:', err);
      throw err;
    }
  }

  static async deleteAction(actionId: string): Promise<void> {
    try {
      await DatabaseService.deleteAction(actionId);
    } catch (error) {
      console.error('Error deleting action:', error);
      throw error;
    }
  }

  private static async getActionById(actionId: string): Promise<OfflineAction | null> {
    try {
      const actions = await this.getOfflineActions();
      return actions.find(action => action.id === actionId) || null;
    } catch (error) {
      console.error('Error getting action by id:', error);
      return null;
    }
  }

  // 同步狀態管理
  static async getLastSyncTime(): Promise<number> {
    try {
      return await DatabaseService.getLastSyncTime();
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return 0;
    }
  }

  static async setLastSyncTime(timestamp: number): Promise<void> {
    try {
      await DatabaseService.setLastSyncTime(timestamp);
      await StorageService.setItem(this.CACHE_KEYS.LAST_SYNC, timestamp.toString());
    } catch (error) {
      console.error('Error setting last sync time:', error);
      throw error;
    }
  }

  // 網路狀態管理
  static async setNetworkState(networkState: NetworkState): Promise<void> {
    try {
      await StorageService.setObject(this.CACHE_KEYS.NETWORK_STATE, networkState);
    } catch (error) {
      console.error('Error setting network state:', error);
    }
  }

  static async getNetworkState(): Promise<NetworkState | null> {
    try {
      return await StorageService.getObject<NetworkState>(this.CACHE_KEYS.NETWORK_STATE);
    } catch (error) {
      console.error('Error getting network state:', error);
      return null;
    }
  }

  // 數據清理
  static async clearOfflineData(): Promise<void> {
    try {
      await DatabaseService.clearAllData();
      await StorageService.removeItem(this.CACHE_KEYS.MATERIALS);
      await StorageService.removeItem(this.CACHE_KEYS.ORDERS);
      await StorageService.removeItem(this.CACHE_KEYS.LAST_SYNC);
      await StorageService.removeItem(this.CACHE_KEYS.NETWORK_STATE);
      
      console.log('Offline data cleared successfully');
    } catch (error) {
      console.error('Error clearing offline data:', error);
      throw error;
    }
  }

  static async clearSyncedActions(): Promise<void> {
    try {
      await DatabaseService.clearSyncedActions();
      console.log('Synced actions cleared successfully');
    } catch (error) {
      console.error('Error clearing synced actions:', error);
      throw error;
    }
  }

  // 數據統計
  static async getOfflineStats(): Promise<{
    materialsCount: number;
    ordersCount: number;
    pendingActionsCount: number;
    lastSyncTime: number;
  }> {
    try {
      const [materials, orders, pendingActions, lastSyncTime] = await Promise.all([
        this.getMaterialsOffline(),
        this.getOrdersOffline(),
        this.getUnsyncedActions(),
        this.getLastSyncTime(),
      ]);

      return {
        materialsCount: materials.length,
        ordersCount: orders.length,
        pendingActionsCount: pendingActions.length,
        lastSyncTime,
      };
    } catch (error) {
      console.error('Error getting offline stats:', error);
      return {
        materialsCount: 0,
        ordersCount: 0,
        pendingActionsCount: 0,
        lastSyncTime: 0,
      };
    }
  }

  // 數據庫維護
  static async performMaintenance(): Promise<void> {
    try {
      // 清理過期的快取
      const now = Date.now();
      
      // 檢查材料快取是否過期
      if (await this.isCacheExpired(this.CACHE_KEYS.MATERIALS, this.CACHE_DURATION.MATERIALS)) {
        await StorageService.removeItem(this.CACHE_KEYS.MATERIALS);
      }
      
      // 檢查訂單快取是否過期
      if (await this.isCacheExpired(this.CACHE_KEYS.ORDERS, this.CACHE_DURATION.ORDERS)) {
        await StorageService.removeItem(this.CACHE_KEYS.ORDERS);
      }
      
      // 清理已同步的舊操作記錄（保留最近7天）
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      const actions = await this.getOfflineActions();
      const oldSyncedActions = actions.filter(
        action => action.synced && action.timestamp < sevenDaysAgo
      );
      
      for (const action of oldSyncedActions) {
        await this.deleteAction(action.id);
      }
      
      // 執行數據庫 VACUUM
      await DatabaseService.vacuum();
      
      console.log('Offline maintenance completed successfully');
    } catch (error) {
      console.error('Error performing offline maintenance:', error);
    }
  }
}