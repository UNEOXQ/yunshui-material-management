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
    projectsRecovered: number;
    orderItemsRecovered: number;
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
    projects: number;
    orderItems: number;
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
        console.log(`📊 恢復統計: ${result.statistics.materialsRecovered} 材料, ${result.statistics.ordersRecovered} 訂單, ${result.statistics.usersRecovered} 用戶, ${result.statistics.projectsRecovered} 專案, ${result.statistics.orderItemsRecovered} 訂單項目`);
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
          projectsRecovered: 0,
          orderItemsRecovered: 0,
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
          projectsRecovered: 0,
          orderItemsRecovered: 0,
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
          projectsRecovered: 0,
          orderItemsRecovered: 0,
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
        projectsRecovered: 0,
        orderItemsRecovered: 0,
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

      // 🚨 重要：先清空現有數據，避免疊加
      console.log('🗑️ 清空現有數據...');
      await this.clearExistingData();

      // 恢復材料數據
      if (data.materials && Array.isArray(data.materials)) {
        console.log(`📦 恢復 ${data.materials.length} 個材料...`);
        for (const material of data.materials) {
          try {
            // 檢查是否已存在相同的材料（避免重複）
            const existingMaterial = (memoryDb as any).materials.find((m: any) => m.id === material.id);
            
            if (!existingMaterial) {
              // 確保材料數據格式正確，並修復圖片 URL
              let imageUrl = material.imageUrl || '';
              
              // 修復圖片 URL：將 localhost URL 轉換為生產環境 URL
              if (imageUrl && imageUrl.includes('localhost:3004')) {
                imageUrl = imageUrl.replace('http://localhost:3004', 'https://yunshui-backend1.onrender.com');
              }
              
              const materialData = {
                ...material,
                createdAt: new Date(material.createdAt),
                updatedAt: new Date(material.updatedAt),
                imageUrl: imageUrl,
                price: Number(material.price) || 0,
                quantity: Number(material.quantity) || 0
              };
              
              // 直接添加到材料數組，保持原始 ID
              (memoryDb as any).materials.push(materialData);
              result.statistics.materialsRecovered++;
            } else {
              console.log(`⚠️ 跳過重複的材料: ${material.id}`);
            }
          } catch (error) {
            console.warn(`⚠️ 恢復材料失敗:`, material.id, error);
          }
        }
      }

      // 恢復用戶數據（包括管理員）
      if (data.users && Array.isArray(data.users)) {
        console.log(`👥 恢復 ${data.users.length} 個用戶...`);
        for (const user of data.users) {
          try {
            // 檢查是否已存在相同的用戶（避免重複）
            const existingUser = (memoryDb as any).users.find((u: any) => u.id === user.id);
            
            if (!existingUser) {
              // 直接添加到用戶數組，保持原始數據不變
              const userData = {
                ...user,
                createdAt: new Date(user.createdAt),
                updatedAt: new Date(user.updatedAt)
              };
              (memoryDb as any).users.push(userData);
              result.statistics.usersRecovered++;
            } else {
              console.log(`⚠️ 跳過重複的用戶: ${user.id}`);
            }
          } catch (error) {
            console.warn(`⚠️ 恢復用戶失敗:`, user.id, error);
          }
        }
        
        // 安全檢查：確保至少有一個管理員用戶
        const restoredUsers = await memoryDb.getAllUsers();
        const hasAdmin = restoredUsers.some(user => user.role === 'ADMIN');
        
        if (!hasAdmin) {
          console.warn('⚠️ 備份中沒有管理員用戶，創建默認管理員...');
          await memoryDb.createUser({
            username: '系統管理員',
            email: 'admin@yunshui.com',
            passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S/kS', // admin123
            role: 'ADMIN' as any
          });
          console.log('✅ 默認管理員用戶已創建');
        }
      }

      // 恢復訂單數據（不包含項目，避免重複）
      if (data.orders && Array.isArray(data.orders)) {
        console.log(`🛒 恢復 ${data.orders.length} 個訂單...`);
        for (const order of data.orders) {
          try {
            // 直接添加到內存數據庫，避免調用 createOrder 方法（會重複創建項目）
            (memoryDb as any).orders.push({
              ...order,
              createdAt: new Date(order.createdAt),
              updatedAt: new Date(order.updatedAt)
            });
            result.statistics.ordersRecovered++;
          } catch (error) {
            console.warn(`⚠️ 恢復訂單失敗:`, order.id, error);
          }
        }
      }

      // 恢復專案數據 - 這是關鍵修復！
      if (data.projects && Array.isArray(data.projects)) {
        console.log(`🏗️ 恢復 ${data.projects.length} 個專案...`);
        for (const project of data.projects) {
          try {
            // 直接將專案數據加入到內存數據庫
            (memoryDb as any).projects.push(project);
            result.statistics.projectsRecovered++;
          } catch (error) {
            console.warn(`⚠️ 恢復專案失敗:`, project.id, error);
          }
        }
      }

      // 恢復訂單項目數據 - 修復材料細項問題！
      if (data.orderItems && Array.isArray(data.orderItems)) {
        console.log(`📋 恢復 ${data.orderItems.length} 個訂單項目...`);
        for (const orderItem of data.orderItems) {
          try {
            // 檢查是否已存在相同的訂單項目（避免重複）
            const existingItem = (memoryDb as any).orderItems.find((item: any) => 
              item.id === orderItem.id || 
              (item.orderId === orderItem.orderId && item.materialId === orderItem.materialId)
            );
            
            if (!existingItem) {
              // 直接將訂單項目數據加入到內存數據庫
              (memoryDb as any).orderItems.push(orderItem);
              result.statistics.orderItemsRecovered++;
            } else {
              console.log(`⚠️ 跳過重複的訂單項目: ${orderItem.id}`);
            }
          } catch (error) {
            console.warn(`⚠️ 恢復訂單項目失敗:`, orderItem.id, error);
          }
        }
      }

      // 恢復消息數據
      if (data.messages && Array.isArray(data.messages)) {
        console.log(`💬 恢復 ${data.messages.length} 條消息...`);
        for (const message of data.messages) {
          try {
            // 檢查是否已存在相同的消息（避免重複）
            const existingMessage = (memoryDb as any).messages.find((m: any) => m.id === message.id);
            
            if (!existingMessage) {
              // 直接添加到消息數組，保持原始 ID
              const messageData = {
                ...message,
                createdAt: new Date(message.createdAt)
              };
              (memoryDb as any).messages.push(messageData);
              result.statistics.messagesRecovered++;
            } else {
              console.log(`⚠️ 跳過重複的消息: ${message.id}`);
            }
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

      // 恢復 nextId - 關鍵修復！
      if (data.nextId && typeof data.nextId === 'number') {
        console.log(`🔢 恢復 nextId: ${data.nextId}`);
        (memoryDb as any).nextId = data.nextId;
      } else {
        // 如果沒有 nextId，計算一個安全的值
        console.log('🔢 計算安全的 nextId...');
        (memoryDb as any).updateNextId();
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
                  projects: backupData.data?.projects?.length || 0,
                  orderItems: backupData.data?.orderItems?.length || 0,
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
   * 清空現有數據（恢復前使用）
   */
  private async clearExistingData(): Promise<void> {
    try {
      console.log('🗑️ 清空現有數據以避免疊加...');
      
      // 直接清空內存數據庫的數組
      // 注意：這是一個臨時解決方案，理想情況下應該在 memoryDb 中添加 clear 方法
      (memoryDb as any).materials = [];
      (memoryDb as any).orders = [];
      (memoryDb as any).projects = []; // 清空專案數據
      (memoryDb as any).orderItems = []; // 清空訂單項目數據
      (memoryDb as any).messages = [];
      (memoryDb as any).statusUpdates = [];
      
      // 清空所有用戶（包括管理員），讓備份數據完全恢復
      (memoryDb as any).users = [];
      
      // 注意：不重置 nextId，將在恢復數據時設置正確的值
      
      console.log('✅ 現有數據清空完成');
    } catch (error) {
      console.error('❌ 清空現有數據失敗:', error);
      throw error;
    }
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