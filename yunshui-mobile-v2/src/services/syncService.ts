import { NetworkService } from './networkService';
import { OfflineService } from './offlineService';
import { MaterialService } from './materialService';
import { OrderService } from './orderService';
import { 
  OfflineAction, 
  SyncResult, 
  Material, 
  Order, 
  AppSettings 
} from '../types';
import { StorageService } from '../utils/storage';

export class SyncService {
  private static issyncing = false;
  private static syncInterval: NodeJS.Timeout | null = null;
  private static readonly MAX_RETRY_COUNT = 3;
  private static readonly SYNC_BATCH_SIZE = 10;
  private static readonly DEFAULT_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // 同步狀態監聽器
  private static syncListeners: ((issyncing: boolean, result?: SyncResult) => void)[] = [];

  // 初始化同步服務
  static async initialize(): Promise<void> {
    try {
      // 設置自動同步
      await this.setupAutoSync();
      console.log('Sync service initialized successfully');
    } catch (error) {
      console.error('Error initializing sync service:', error);
      throw error;
    }
  }

  // 設置自動同步
  private static async setupAutoSync(): Promise<void> {
    try {
      const settings = await this.getSyncSettings();
      
      if (settings.autoSync) {
        this.startAutoSync(settings.syncInterval);
      }
    } catch (error) {
      console.error('Error setting up auto sync:', error);
    }
  }

  // 開始自動同步
  static startAutoSync(intervalMinutes: number = 5): void {
    this.stopAutoSync();
    
    const intervalMs = intervalMinutes * 60 * 1000;
    this.syncInterval = setInterval(() => {
      this.triggerAutoSync();
    }, intervalMs);
    
    console.log(`Auto sync started with ${intervalMinutes} minute interval`);
  }

  // 停止自動同步
  static stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto sync stopped');
    }
  }

  // 觸發自動同步
  static async triggerAutoSync(): Promise<void> {
    try {
      const settings = await this.getSyncSettings();
      
      // 檢查是否應該同步
      if (!settings.autoSync || !NetworkService.shouldSync(settings.wifiOnly)) {
        return;
      }

      // 檢查是否已經在同步中
      if (this.issyncing) {
        console.log('Sync already in progress, skipping auto sync');
        return;
      }

      console.log('Triggering auto sync...');
      await this.performFullSync();
    } catch (error) {
      console.error('Error in auto sync:', error);
    }
  }

  // 執行完整同步
  static async performFullSync(): Promise<SyncResult> {
    if (this.issyncing) {
      throw new Error('Sync already in progress');
    }

    if (!NetworkService.isOnline()) {
      throw new Error('No network connection available');
    }

    this.issyncing = true;
    this.notifySyncListeners(true);

    const result: SyncResult = {
      success: false,
      syncedActions: 0,
      failedActions: 0,
      errors: [],
    };

    try {
      console.log('Starting full sync...');

      // 1. 同步離線操作到服務器
      const offlineResult = await this.syncOfflineActions();
      result.syncedActions += offlineResult.syncedActions;
      result.failedActions += offlineResult.failedActions;
      result.errors.push(...offlineResult.errors);

      // 2. 從服務器拉取最新數據
      await this.pullLatestData();

      // 3. 更新最後同步時間
      await OfflineService.setLastSyncTime(Date.now());

      result.success = result.failedActions === 0;
      console.log('Full sync completed:', result);

    } catch (error) {
      console.error('Error in full sync:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    } finally {
      this.issyncing = false;
      this.notifySyncListeners(false, result);
    }

    return result;
  }

  // 同步離線操作到服務器
  private static async syncOfflineActions(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedActions: 0,
      failedActions: 0,
      errors: [],
    };

    try {
      const unsyncedActions = await OfflineService.getUnsyncedActions();
      console.log(`Found ${unsyncedActions.length} unsynced actions`);

      // 按批次處理操作
      for (let i = 0; i < unsyncedActions.length; i += this.SYNC_BATCH_SIZE) {
        const batch = unsyncedActions.slice(i, i + this.SYNC_BATCH_SIZE);
        
        for (const action of batch) {
          try {
            await this.syncSingleAction(action);
            await OfflineService.markActionAsSynced(action.id);
            result.syncedActions++;
            console.log(`Synced action: ${action.type} ${action.entity} ${action.entityId}`);
          } catch (error) {
            console.error(`Failed to sync action ${action.id}:`, error);
            
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await OfflineService.updateActionError(action.id, errorMessage);
            
            result.failedActions++;
            result.errors.push(`${action.type} ${action.entity}: ${errorMessage}`);

            // 如果重試次數超過限制，刪除該操作
            if ((action.retryCount || 0) >= this.MAX_RETRY_COUNT) {
              console.log(`Max retry count reached for action ${action.id}, deleting...`);
              await OfflineService.deleteAction(action.id);
            }
          }
        }

        // 批次間短暫延遲，避免服務器過載
        if (i + this.SYNC_BATCH_SIZE < unsyncedActions.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

    } catch (error) {
      console.error('Error syncing offline actions:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    }

    return result;
  }

  // 同步單個操作
  private static async syncSingleAction(action: OfflineAction): Promise<void> {
    switch (action.entity) {
      case 'MATERIAL':
        await this.syncMaterialAction(action);
        break;
      case 'ORDER':
        await this.syncOrderAction(action);
        break;
      default:
        throw new Error(`Unknown entity type: ${action.entity}`);
    }
  }

  // 同步基材操作
  private static async syncMaterialAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'CREATE':
        await MaterialService.createMaterial(action.data);
        break;
      case 'UPDATE':
        await MaterialService.updateMaterial(action.data.id, action.data);
        break;
      case 'DELETE':
        await MaterialService.deleteMaterial(action.data.id);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // 同步訂單操作
  private static async syncOrderAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'CREATE':
        await OrderService.createOrder(action.data);
        break;
      case 'UPDATE':
        await OrderService.updateOrder(action.data.id, action.data);
        break;
      case 'DELETE':
        await OrderService.deleteOrder(action.data.id);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // 從服務器拉取最新數據
  private static async pullLatestData(): Promise<void> {
    try {
      console.log('Pulling latest data from server...');

      // 獲取最後同步時間
      const lastSyncTime = await OfflineService.getLastSyncTime();
      
      // 拉取基材數據
      const materials = await MaterialService.getMaterials();
      if (materials.length > 0) {
        await OfflineService.saveMaterialsOffline(materials);
        console.log(`Pulled ${materials.length} materials`);
      }

      // 拉取訂單數據
      const orders = await OrderService.getOrders();
      if (orders.length > 0) {
        await OfflineService.saveOrdersOffline(orders);
        console.log(`Pulled ${orders.length} orders`);
      }

    } catch (error) {
      console.error('Error pulling latest data:', error);
      throw error;
    }
  }

  // 檢查同步衝突
  private static async checkForConflicts(): Promise<void> {
    // TODO: 實現衝突檢測邏輯
    // 比較本地修改時間和服務器修改時間
    // 處理衝突解決策略
  }

  // 解決同步衝突
  static async resolveConflict(
    localData: Material | Order,
    serverData: Material | Order,
    resolution: 'local' | 'server' | 'merge'
  ): Promise<Material | Order> {
    switch (resolution) {
      case 'local':
        // 使用本地數據，創建更新操作
        return localData;
      
      case 'server':
        // 使用服務器數據，更新本地
        return serverData;
      
      case 'merge':
        // 合併數據（需要具體的合併邏輯）
        return this.mergeData(localData, serverData);
      
      default:
        throw new Error(`Unknown conflict resolution: ${resolution}`);
    }
  }

  // 合併數據
  private static mergeData(localData: Material | Order, serverData: Material | Order): Material | Order {
    // 簡單的合併策略：使用最新的修改時間
    const localTime = new Date(localData.updatedAt).getTime();
    const serverTime = new Date(serverData.updatedAt).getTime();
    
    return localTime > serverTime ? localData : serverData;
  }

  // 獲取同步設定
  private static async getSyncSettings(): Promise<{
    autoSync: boolean;
    syncInterval: number;
    wifiOnly: boolean;
  }> {
    try {
      const settings = await StorageService.getObject<AppSettings>('app_settings');
      return {
        autoSync: settings?.sync?.autoSync ?? true,
        syncInterval: settings?.sync?.syncInterval ?? 5,
        wifiOnly: settings?.sync?.wifiOnly ?? false,
      };
    } catch (error) {
      console.error('Error getting sync settings:', error);
      return {
        autoSync: true,
        syncInterval: 5,
        wifiOnly: false,
      };
    }
  }

  // 更新同步設定
  static async updateSyncSettings(settings: {
    autoSync?: boolean;
    syncInterval?: number;
    wifiOnly?: boolean;
  }): Promise<void> {
    try {
      const currentSettings = await StorageService.getObject<AppSettings>('app_settings') || {} as AppSettings;
      
      const updatedSettings: AppSettings = {
        ...currentSettings,
        sync: {
          ...currentSettings.sync,
          ...settings,
        },
      };

      await StorageService.setObject('app_settings', updatedSettings);

      // 重新設置自動同步
      if (settings.autoSync !== undefined || settings.syncInterval !== undefined) {
        await this.setupAutoSync();
      }

      console.log('Sync settings updated:', settings);
    } catch (error) {
      console.error('Error updating sync settings:', error);
      throw error;
    }
  }

  // 手動同步
  static async manualSync(): Promise<SyncResult> {
    console.log('Starting manual sync...');
    return await this.performFullSync();
  }

  // 檢查是否正在同步
  static issyncing(): boolean {
    return this.issyncing;
  }

  // 添加同步狀態監聽器
  static addSyncListener(listener: (issyncing: boolean, result?: SyncResult) => void): () => void {
    this.syncListeners.push(listener);
    
    // 立即調用一次，提供當前狀態
    listener(this.issyncing);

    // 返回取消監聽的函數
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  // 通知同步狀態監聽器
  private static notifySyncListeners(issyncing: boolean, result?: SyncResult): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(issyncing, result);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  // 獲取同步統計信息
  static async getSyncStats(): Promise<{
    lastSyncTime: number;
    pendingActions: number;
    isOnline: boolean;
    canSync: boolean;
  }> {
    try {
      const [lastSyncTime, pendingActions, settings] = await Promise.all([
        OfflineService.getLastSyncTime(),
        OfflineService.getPendingActionsCount(),
        this.getSyncSettings(),
      ]);

      return {
        lastSyncTime,
        pendingActions,
        isOnline: NetworkService.isOnline(),
        canSync: NetworkService.shouldSync(settings.wifiOnly),
      };
    } catch (error) {
      console.error('Error getting sync stats:', error);
      return {
        lastSyncTime: 0,
        pendingActions: 0,
        isOnline: false,
        canSync: false,
      };
    }
  }

  // 清理同步服務
  static cleanup(): void {
    this.stopAutoSync();
    this.syncListeners = [];
    console.log('Sync service cleaned up');
  }

  // 強制同步（忽略網路限制）
  static async forceSync(): Promise<SyncResult> {
    if (!NetworkService.isOnline()) {
      throw new Error('No network connection available for force sync');
    }

    console.log('Starting force sync...');
    return await this.performFullSync();
  }

  // 重置同步狀態
  static async resetSyncState(): Promise<void> {
    try {
      await OfflineService.clearSyncedActions();
      await OfflineService.setLastSyncTime(0);
      console.log('Sync state reset successfully');
    } catch (error) {
      console.error('Error resetting sync state:', error);
      throw error;
    }
  }
}