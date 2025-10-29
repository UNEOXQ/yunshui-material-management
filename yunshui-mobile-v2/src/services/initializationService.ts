import { OfflineService } from './offlineService';
import { NetworkService } from './networkService';
import { SyncService } from './syncService';

export class InitializationService {
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Services already initialized');
      return;
    }

    try {
      console.log('Initializing app services...');

      // 1. 初始化離線服務（包含數據庫）
      await OfflineService.initialize();
      console.log('✓ Offline service initialized');

      // 2. 初始化網路監控服務
      await NetworkService.initialize();
      console.log('✓ Network service initialized');

      // 3. 初始化同步服務
      await SyncService.initialize();
      console.log('✓ Sync service initialized');

      // 4. 執行數據庫維護
      await OfflineService.performMaintenance();
      console.log('✓ Database maintenance completed');

      this.isInitialized = true;
      console.log('All services initialized successfully');

    } catch (error) {
      console.error('Error initializing services:', error);
      throw error;
    }
  }

  static async cleanup(): Promise<void> {
    try {
      console.log('Cleaning up app services...');

      // 清理同步服務
      SyncService.cleanup();
      console.log('✓ Sync service cleaned up');

      // 清理網路服務
      NetworkService.cleanup();
      console.log('✓ Network service cleaned up');

      this.isInitialized = false;
      console.log('All services cleaned up successfully');

    } catch (error) {
      console.error('Error cleaning up services:', error);
    }
  }

  static isServicesInitialized(): boolean {
    return this.isInitialized;
  }
}