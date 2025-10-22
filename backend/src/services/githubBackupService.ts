import { Octokit } from '@octokit/rest';
import { memoryDb } from '../config/memory-database';

interface BackupData {
  timestamp: string;
  version: string;
  data: {
    materials: any[];
    orders: any[];
    users: any[];
    statusUpdates: any[];
    messages: any[];
  };
}

class GitHubBackupService {
  private octokit: Octokit | null = null;
  private owner: string;
  private repo: string;
  private branch: string = 'data-backup';
  private isInitialized: boolean = false;
  private lastBackupTime: number = 0;
  private backupInterval: number = 30 * 60 * 1000; // 30 分鐘

  constructor() {
    this.owner = process.env.GITHUB_OWNER || '';
    this.repo = process.env.GITHUB_REPO || '';
    
    if (process.env.GITHUB_TOKEN) {
      this.octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
      });
    }
  }

  /**
   * 初始化 GitHub 備份服務
   */
  async initialize(): Promise<boolean> {
    try {
      if (!this.octokit || !this.owner || !this.repo) {
        console.log('⚠️ GitHub 備份未配置 - 跳過備份功能');
        return false;
      }

      // 檢查倉庫訪問權限
      await this.octokit.repos.get({
        owner: this.owner,
        repo: this.repo,
      });

      // 檢查或創建備份分支
      await this.ensureBackupBranch();

      this.isInitialized = true;
      console.log('✅ GitHub 備份服務初始化成功');
      
      // 啟動定時備份
      this.startPeriodicBackup();
      
      return true;
    } catch (error) {
      console.error('❌ GitHub 備份服務初始化失敗:', error);
      return false;
    }
  }

  /**
   * 確保備份分支存在
   */
  private async ensureBackupBranch(): Promise<void> {
    try {
      // 嘗試獲取備份分支
      await this.octokit!.repos.getBranch({
        owner: this.owner,
        repo: this.repo,
        branch: this.branch,
      });
      console.log(`✅ 備份分支 '${this.branch}' 已存在`);
    } catch (error: any) {
      if (error.status === 404) {
        // 分支不存在，創建新分支
        console.log(`📝 創建備份分支 '${this.branch}'`);
        
        // 獲取主分支的最新 commit
        const { data: mainBranch } = await this.octokit!.repos.getBranch({
          owner: this.owner,
          repo: this.repo,
          branch: 'main',
        });

        // 創建新分支
        await this.octokit!.git.createRef({
          owner: this.owner,
          repo: this.repo,
          ref: `refs/heads/${this.branch}`,
          sha: mainBranch.commit.sha,
        });
        
        console.log(`✅ 備份分支 '${this.branch}' 創建成功`);
      } else {
        throw error;
      }
    }
  }

  /**
   * 導出當前數據
   */
  private async exportCurrentData(): Promise<BackupData> {
    return {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {
        materials: (await memoryDb.getAllMaterials()).materials,
        orders: await memoryDb.getAllOrders(),
        users: await memoryDb.getAllUsers(),
        statusUpdates: (memoryDb as any).statusUpdates || [], // 直接訪問 statusUpdates 數組
        messages: await memoryDb.getAllMessages(),
      },
    };
  }

  /**
   * 執行備份到 GitHub
   */
  async performBackup(): Promise<boolean> {
    if (!this.isInitialized || !this.octokit) {
      console.log('⚠️ GitHub 備份服務未初始化');
      return false;
    }

    try {
      console.log('🔄 開始執行 GitHub 備份...');

      // 導出數據
      const backupData = await this.exportCurrentData();
      const content = JSON.stringify(backupData, null, 2);
      const fileName = `backup-${new Date().toISOString().split('T')[0]}.json`;

      // 檢查是否有數據變更
      if (await this.isDataUnchanged(content, fileName)) {
        console.log('📊 數據無變更，跳過備份');
        return true;
      }

      // 獲取文件的當前 SHA（如果存在）
      let fileSha: string | undefined;
      try {
        const { data: existingFile } = await this.octokit.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: `data-backups/${fileName}`,
          ref: this.branch,
        });
        
        if ('sha' in existingFile) {
          fileSha = existingFile.sha;
        }
      } catch (error: any) {
        if (error.status !== 404) {
          throw error;
        }
        // 文件不存在，這是正常的
      }

      // 創建或更新文件
      const commitMessage = `自動備份數據 - ${new Date().toLocaleString('zh-TW')}`;
      
      const updateParams: any = {
        owner: this.owner,
        repo: this.repo,
        path: `data-backups/${fileName}`,
        message: commitMessage,
        content: Buffer.from(content).toString('base64'),
        branch: this.branch,
      };
      
      if (fileSha) {
        updateParams.sha = fileSha;
      }
      
      await this.octokit.repos.createOrUpdateFileContents(updateParams);

      // 同時更新 latest.json
      await this.updateLatestBackup(content);

      this.lastBackupTime = Date.now();
      console.log('✅ GitHub 備份完成');
      return true;

    } catch (error) {
      console.error('❌ GitHub 備份失敗:', error);
      return false;
    }
  }

  /**
   * 更新最新備份文件
   */
  private async updateLatestBackup(content: string): Promise<void> {
    try {
      let latestSha: string | undefined;
      
      try {
        const { data: latestFile } = await this.octokit!.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: 'data-backups/latest.json',
          ref: this.branch,
        });
        
        if ('sha' in latestFile) {
          latestSha = latestFile.sha;
        }
      } catch (error: any) {
        if (error.status !== 404) {
          throw error;
        }
      }

      const latestParams: any = {
        owner: this.owner,
        repo: this.repo,
        path: 'data-backups/latest.json',
        message: `更新最新備份 - ${new Date().toLocaleString('zh-TW')}`,
        content: Buffer.from(content).toString('base64'),
        branch: this.branch,
      };
      
      if (latestSha) {
        latestParams.sha = latestSha;
      }
      
      await this.octokit!.repos.createOrUpdateFileContents(latestParams);
    } catch (error) {
      console.error('⚠️ 更新最新備份失敗:', error);
      // 不拋出錯誤，因為主備份已經成功
    }
  }

  /**
   * 檢查數據是否有變更
   */
  private async isDataUnchanged(newContent: string, fileName: string): Promise<boolean> {
    try {
      const { data: existingFile } = await this.octokit!.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: `data-backups/${fileName}`,
        ref: this.branch,
      });

      if ('content' in existingFile) {
        const existingContent = Buffer.from(existingFile.content, 'base64').toString();
        return existingContent === newContent;
      }
    } catch (error: any) {
      if (error.status === 404) {
        return false; // 文件不存在，需要備份
      }
      throw error;
    }
    return false;
  }

  /**
   * 啟動定時備份
   */
  private startPeriodicBackup(): void {
    console.log(`🕐 啟動定時備份，間隔: ${this.backupInterval / 60000} 分鐘`);
    
    setInterval(async () => {
      await this.performBackup();
    }, this.backupInterval);

    // 立即執行一次備份
    setTimeout(() => {
      this.performBackup();
    }, 5000); // 5秒後執行第一次備份
  }

  /**
   * 手動觸發備份
   */
  async triggerManualBackup(): Promise<boolean> {
    console.log('🔄 手動觸發備份...');
    return await this.performBackup();
  }

  /**
   * 從 GitHub 恢復數據
   */
  async restoreFromBackup(): Promise<boolean> {
    if (!this.isInitialized || !this.octokit) {
      console.log('⚠️ GitHub 備份服務未初始化，無法恢復數據');
      return false;
    }

    try {
      console.log('🔄 開始從 GitHub 恢復數據...');

      // 嘗試獲取最新備份
      const { data: latestFile } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: 'data-backups/latest.json',
        ref: this.branch,
      });

      if (!('content' in latestFile)) {
        console.log('❌ 無法獲取備份文件內容');
        return false;
      }

      // 解析備份數據
      const backupContent = Buffer.from(latestFile.content, 'base64').toString();
      const backupData: BackupData = JSON.parse(backupContent);

      console.log(`📊 找到備份數據，時間戳: ${backupData.timestamp}`);
      console.log(`📦 數據統計: ${backupData.data.materials.length} 材料, ${backupData.data.orders.length} 訂單, ${backupData.data.users.length} 用戶`);

      // 恢復數據到內存數據庫
      await this.restoreDataToMemoryDb(backupData.data);

      console.log('✅ 數據恢復完成');
      return true;

    } catch (error: any) {
      if (error.status === 404) {
        console.log('📝 沒有找到備份文件，使用默認數據');
        return false;
      }
      console.error('❌ 恢復數據失敗:', error);
      return false;
    }
  }

  /**
   * 將備份數據恢復到內存數據庫
   */
  private async restoreDataToMemoryDb(data: BackupData['data']): Promise<void> {
    try {
      // 清空現有數據（保留基本用戶）
      console.log('🔄 清空現有數據...');
      
      // 恢復材料數據
      if (data.materials && data.materials.length > 0) {
        console.log(`📦 恢復 ${data.materials.length} 個材料...`);
        for (const material of data.materials) {
          await memoryDb.createMaterial(material);
        }
      }

      // 恢復用戶數據（跳過已存在的用戶）
      if (data.users && data.users.length > 0) {
        console.log(`👥 恢復 ${data.users.length} 個用戶...`);
        for (const user of data.users) {
          const existingUser = await memoryDb.getUserById(user.id);
          if (!existingUser) {
            await memoryDb.createUser(user);
          }
        }
      }

      // 恢復訂單數據
      if (data.orders && data.orders.length > 0) {
        console.log(`🛒 恢復 ${data.orders.length} 個訂單...`);
        for (const order of data.orders) {
          await memoryDb.createOrder(order);
        }
      }

      // 恢復消息數據
      if (data.messages && data.messages.length > 0) {
        console.log(`💬 恢復 ${data.messages.length} 條消息...`);
        for (const message of data.messages) {
          await memoryDb.createMessage(message);
        }
      }

      console.log('✅ 所有數據已恢復到內存數據庫');

    } catch (error) {
      console.error('❌ 恢復數據到內存數據庫失敗:', error);
      throw error;
    }
  }

  /**
   * 檢查是否需要恢復數據
   */
  async shouldRestoreFromBackup(): Promise<boolean> {
    try {
      // 檢查內存數據庫是否為空（除了默認用戶）
      const materials = await memoryDb.getAllMaterials();
      const orders = await memoryDb.getAllOrders();
      
      // 如果材料或訂單數據很少，可能需要恢復
      const hasMinimalData = materials.materials.length <= 4 && orders.length === 0;
      
      if (hasMinimalData) {
        console.log('🔍 檢測到最小數據集，檢查是否有備份可恢復...');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('檢查恢復條件失敗:', error);
      return false;
    }
  }

  /**
   * 獲取備份狀態
   */
  getBackupStatus() {
    return {
      isInitialized: this.isInitialized,
      lastBackupTime: this.lastBackupTime,
      nextBackupTime: this.lastBackupTime + this.backupInterval,
      backupInterval: this.backupInterval,
    };
  }
}

export const githubBackupService = new GitHubBackupService();