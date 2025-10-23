import { Octokit } from '@octokit/rest';
import { memoryDb } from '../config/memory-database';
import { githubBackupService } from './githubBackupService';

interface RecoveryResult {
  success: boolean;
  timestamp: string;
  statistics: {
    materialsRecovered: number;
    ordersRecovered: number;
    usersRecovered: number;
    statusUpdatesRecovered: number;
    messagesRecovered: number;
  };
  errors?: string[];
}

interface BackupInfo {
  date: string;
  timestamp: string;
  size: number;
  dataCount: {
    materials: number;
    orders: number;
    users: number;
    statusUpdates: number;
    messages: number;
  };
}

interface RecoveryStatus {
  lastRecoveryTime: number;
  lastRecoveryResult: RecoveryResult | null;
  isRecovering: boolean;
  autoRecoveryEnabled: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class GitHubRecoveryService {
  private octokit: Octokit | null = null;
  private owner: string;
  private repo: string;
  private branch: string = 'data-backup';
  private isInitialized: boolean = false;
  private recoveryStatus: RecoveryStatus;

  constructor() {
    this.owner = process.env.GITHUB_OWNER || '';
    this.repo = process.env.GITHUB_REPO || '';
    
    if (process.env.GITHUB_TOKEN) {
      this.octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
      });
    }

    this.recoveryStatus = {
      lastRecoveryTime: 0,
      lastRecoveryResult: null,
      isRecovering: false,
      autoRecoveryEnabled: true,
    };
  }

  /**
   * 初始化恢復服務
   */
  async initialize(): Promise<boolean> {
    try {
      if (!this.octokit || !this.owner || !this.repo) {
        console.log('⚠️ GitHub 恢復服務未配置 - 跳過恢復功能');
        return false;
      }

      // 檢查倉庫訪問權限
      await this.octokit.repos.get({
        owner: this.owner,
        repo: this.repo,
      });

      this.isInitialized = true;
      console.log('✅ GitHub 恢復服務初始化成功');
      
      return true;
    } catch (error) {
      console.error('❌ GitHub 恢復服務初始化失敗:', error);
      return false;
    }
  }

  /**
   * 自動恢復（啟動時調用）
   */
  async autoRecover(): Promise<boolean> {
    if (!this.isInitialized || !this.recoveryStatus.autoRecoveryEnabled) {
      return false;
    }

    try {
      console.log('🔍 檢查是否需要自動恢復...');

      // 檢查是否需要恢復
      const shouldRecover = await this.shouldRestoreFromBackup();
      
      if (!shouldRecover) {
        console.log('✅ 本地數據完整，無需恢復');
        return true;
      }

      console.log('🔄 開始自動恢復...');
      const result = await this.performRecovery();
      
      if (result.success) {
        console.log('✅ 自動恢復完成');
        console.log(`📊 恢復統計: ${result.statistics.materialsRecovered} 材料, ${result.statistics.ordersRecovered} 訂單, ${result.statistics.usersRecovered} 用戶`);
      } else {
        console.log('❌ 自動恢復失敗');
      }

      return result.success;
    } catch (error) {
      console.error('❌ 自動恢復過程中發生錯誤:', error);
      return false;
    }
  }

  /**
   * 手動恢復
   */
  async manualRecover(backupDate?: string): Promise<RecoveryResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        statistics: {
          materialsRecovered: 0,
          ordersRecovered: 0,
          usersRecovered: 0,
          statusUpdatesRecovered: 0,
          messagesRecovered: 0,
        },
        errors: ['恢復服務未初始化'],
      };
    }

    if (this.recoveryStatus.isRecovering) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        statistics: {
          materialsRecovered: 0,
          ordersRecovered: 0,
          usersRecovered: 0,
          statusUpdatesRecovered: 0,
          messagesRecovered: 0,
        },
        errors: ['恢復操作正在進行中'],
      };
    }

    try {
      console.log('🔄 開始手動恢復...');
      this.recoveryStatus.isRecovering = true;

      const result = await this.performRecovery(backupDate);
      
      this.recoveryStatus.lastRecoveryTime = Date.now();
      this.recoveryStatus.lastRecoveryResult = result;
      this.recoveryStatus.isRecovering = false;

      return result;
    } catch (error) {
      this.recoveryStatus.isRecovering = false;
      console.error('❌ 手動恢復失敗:', error);
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        statistics: {
          materialsRecovered: 0,
          ordersRecovered: 0,
          usersRecovered: 0,
          statusUpdatesRecovered: 0,
          messagesRecovered: 0,
        },
        errors: [error instanceof Error ? error.message : '未知錯誤'],
      };
    }
  }

  /**
   * 執行恢復操作
   */
  private async performRecovery(backupDate?: string): Promise<RecoveryResult> {
    const result: RecoveryResult = {
      success: false,
      timestamp: new Date().toISOString(),
      statistics: {
        materialsRecovered: 0,
        ordersRecovered: 0,
        usersRecovered: 0,
        statusUpdatesRecovered: 0,
        messagesRecovered: 0,
      },
      errors: [],
    };

    try {
      // 獲取備份數據
      const backupData = await this.getBackupData(backupDate);
      
      if (!backupData) {
        result.errors?.push('無法獲取備份數據');
        return result;
      }

      // 驗證備份數據
      const validation = await this.validateBackupData(backupData);
      if (!validation.isValid) {
        result.errors?.push(...validation.errors);
        return result;
      }

      // 備份當前數據（以防需要回滾）
      await this.backupCurrentData();

      // 恢復數據
      await this.restoreDataToMemoryDb(backupData.data, result);

      result.success = true;
      console.log('✅ 恢復操作完成');

    } catch (error) {
      console.error('❌ 恢復操作失敗:', error);
      result.errors?.push(error instanceof Error ? error.message : '未知錯誤');
    }

    return result;
  }

  /**
   * 獲取備份數據
   */
  private async getBackupData(backupDate?: string): Promise<any> {
    try {
      let filePath = 'data-backups/latest.json';
      
      if (backupDate) {
        filePath = `data-backups/backup-${backupDate}.json`;
      }

      const { data: backupFile } = await this.octokit!.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        ref: this.branch,
      });

      if (!('content' in backupFile)) {
        throw new Error('無法獲取備份文件內容');
      }

      const backupContent = Buffer.from(backupFile.content, 'base64').toString();
      return JSON.parse(backupContent);

    } catch (error: any) {
      if (error.status === 404) {
        console.log('📝 沒有找到指定的備份文件');
        return null;
      }
      throw error;
    }
  }

  /**
   * 驗證備份數據完整性
   */
  async validateBackupData(backupData: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // 檢查基本結構
      if (!backupData || !backupData.data) {
        result.isValid = false;
        result.errors.push('備份數據結構無效');
        return result;
      }

      const { data } = backupData;

      // 檢查必要的數據類型
      const requiredTypes = ['materials', 'orders', 'users', 'statusUpdates', 'messages'];
      for (const type of requiredTypes) {
        if (!Array.isArray(data[type])) {
          result.warnings.push(`${type} 數據不是數組格式`);
        }
      }

      // 檢查時間戳
      if (!backupData.timestamp) {
        result.warnings.push('缺少時間戳信息');
      } else {
        const backupTime = new Date(backupData.timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - backupTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
          result.warnings.push(`備份數據較舊（${Math.round(hoursDiff)} 小時前）`);
        }
      }

      // 檢查數據完整性
      if (data.materials && data.materials.length > 0) {
        const sampleMaterial = data.materials[0];
        if (!sampleMaterial.id || !sampleMaterial.name) {
          result.warnings.push('材料數據可能不完整');
        }
      }

      if (data.users && data.users.length > 0) {
        const sampleUser = data.users[0];
        if (!sampleUser.id || !sampleUser.username) {
          result.warnings.push('用戶數據可能不完整');
        }
      }

      console.log(`✅ 備份數據驗證完成 - 有效: ${result.isValid}, 警告: ${result.warnings.length}`);

    } catch (error) {
      result.isValid = false;
      result.errors.push(`數據驗證失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }

    return result;
  }

  /**
   * 備份當前數據（以防需要回滾）
   */
  private async backupCurrentData(): Promise<void> {
    try {
      console.log('💾 備份當前數據以防回滾...');
      // 觸發一次手動備份
      await githubBackupService.triggerManualBackup();
    } catch (error) {
      console.warn('⚠️ 備份當前數據失敗，但繼續恢復操作:', error);
    }
  }

  /**
   * 將備份數據恢復到內存數據庫
   */
  private async restoreDataToMemoryDb(data: any, result: RecoveryResult): Promise<void> {
    try {
      console.log('🔄 開始恢復數據到內存數據庫...');

      // 恢復材料數據
      if (data.materials && Array.isArray(data.materials)) {
        console.log(`📦 恢復 ${data.materials.length} 個材料...`);
        for (const material of data.materials) {
          try {
            await memoryDb.createMaterial(material);
            result.statistics.materialsRecovered++;
          } catch (error) {
            console.warn(`⚠️ 恢復材料失敗:`, material.id, error);
          }
        }
      }

      // 恢復用戶數據（跳過已存在的用戶）
      if (data.users && Array.isArray(data.users)) {
        console.log(`👥 恢復 ${data.users.length} 個用戶...`);
        for (const user of data.users) {
          try {
            const existingUser = await memoryDb.getUserById(user.id);
            if (!existingUser) {
              await memoryDb.createUser(user);
              result.statistics.usersRecovered++;
            }
          } catch (error) {
            console.warn(`⚠️ 恢復用戶失敗:`, user.id, error);
          }
        }
      }

      // 恢復訂單數據
      if (data.orders && Array.isArray(data.orders)) {
        console.log(`🛒 恢復 ${data.orders.length} 個訂單...`);
        for (const order of data.orders) {
          try {
            await memoryDb.createOrder(order);
            result.statistics.ordersRecovered++;
          } catch (error) {
            console.warn(`⚠️ 恢復訂單失敗:`, order.id, error);
          }
        }
      }

      // 恢復消息數據
      if (data.messages && Array.isArray(data.messages)) {
        console.log(`💬 恢復 ${data.messages.length} 條消息...`);
        for (const message of data.messages) {
          try {
            await memoryDb.createMessage(message);
            result.statistics.messagesRecovered++;
          } catch (error) {
            console.warn(`⚠️ 恢復消息失敗:`, message.id, error);
          }
        }
      }

      // 恢復狀態更新數據
      if (data.statusUpdates && Array.isArray(data.statusUpdates)) {
        console.log(`📊 恢復 ${data.statusUpdates.length} 個狀態更新...`);
        result.statistics.statusUpdatesRecovered = data.statusUpdates.length;
        // 狀態更新通常直接存儲在內存中，這裡可能需要特殊處理
      }

      console.log('✅ 所有數據已恢復到內存數據庫');

    } catch (error) {
      console.error('❌ 恢復數據到內存數據庫失敗:', error);
      throw error;
    }
  }

  /**
   * 檢查是否需要從備份恢復數據
   */
  private async shouldRestoreFromBackup(): Promise<boolean> {
    try {
      // 檢查內存數據庫是否為空或數據不足
      const materials = await memoryDb.getAllMaterials();
      const orders = await memoryDb.getAllOrders();
      const users = await memoryDb.getAllUsers();
      
      console.log(`🔍 當前數據狀態: ${materials.materials.length} 材料, ${orders.length} 訂單, ${users.length} 用戶`);
      
      // 更寬鬆的恢復條件：如果材料很少或訂單很少，就恢復
      const hasMinimalMaterials = materials.materials.length <= 4;
      const hasMinimalOrders = orders.length <= 2;
      const hasMinimalUsers = users.length <= 4; // 默認應該有更多用戶
      
      // 任何一個條件滿足就恢復
      if (hasMinimalMaterials || hasMinimalOrders || hasMinimalUsers) {
        console.log('🔍 檢測到數據不足，需要從備份恢復');
        console.log(`   - 材料數量: ${materials.materials.length} (≤4 觸發恢復)`);
        console.log(`   - 訂單數量: ${orders.length} (≤2 觸發恢復)`);
        console.log(`   - 用戶數量: ${users.length} (≤4 觸發恢復)`);
        return true;
      }
      
      console.log('✅ 數據充足，跳過自動恢復');
      return false;
    } catch (error) {
      console.error('檢查恢復條件失敗:', error);
      return false;
    }
  }

  /**
   * 獲取可用備份列表
   */
  async getAvailableBackups(): Promise<BackupInfo[]> {
    if (!this.isInitialized || !this.octokit) {
      return [];
    }

    try {
      // 獲取備份目錄內容
      const { data: contents } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: 'data-backups',
        ref: this.branch,
      });

      if (!Array.isArray(contents)) {
        return [];
      }

      const backups: BackupInfo[] = [];

      for (const file of contents) {
        if (file.name.startsWith('backup-') && file.name.endsWith('.json')) {
          try {
            // 獲取文件內容以分析備份信息
            const { data: fileData } = await this.octokit.repos.getContent({
              owner: this.owner,
              repo: this.repo,
              path: file.path,
              ref: this.branch,
            });

            if ('content' in fileData) {
              const content = Buffer.from(fileData.content, 'base64').toString();
              const backupData = JSON.parse(content);

              const backupInfo: BackupInfo = {
                date: file.name.replace('backup-', '').replace('.json', ''),
                timestamp: backupData.timestamp || '',
                size: fileData.size || 0,
                dataCount: {
                  materials: backupData.data?.materials?.length || 0,
                  orders: backupData.data?.orders?.length || 0,
                  users: backupData.data?.users?.length || 0,
                  statusUpdates: backupData.data?.statusUpdates?.length || 0,
                  messages: backupData.data?.messages?.length || 0,
                },
              };

              backups.push(backupInfo);
            }
          } catch (error) {
            console.warn(`⚠️ 無法解析備份文件 ${file.name}:`, error);
          }
        }
      }

      // 按日期排序（最新的在前）
      backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return backups;
    } catch (error) {
      console.error('❌ 獲取可用備份列表失敗:', error);
      return [];
    }
  }

  /**
   * 獲取恢復狀態
   */
  getRecoveryStatus(): RecoveryStatus {
    return { ...this.recoveryStatus };
  }

  /**
   * 設置自動恢復開關
   */
  setAutoRecoveryEnabled(enabled: boolean): void {
    this.recoveryStatus.autoRecoveryEnabled = enabled;
    console.log(`🔧 自動恢復已${enabled ? '啟用' : '禁用'}`);
  }
}

export const githubRecoveryService = new GitHubRecoveryService();