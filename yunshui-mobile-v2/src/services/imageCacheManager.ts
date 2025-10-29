import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// 類型定義
export interface CacheEntry {
  key: string;
  uri: string;
  originalUri: string;
  size: number;
  timestamp: number;
  lastAccessed: number;
  mimeType: string;
  etag?: string;
  expiresAt?: number;
}

export interface CacheConfig {
  maxSize: number; // 最大快取大小（字節）
  maxAge: number; // 最大快取時間（毫秒）
  maxEntries: number; // 最大快取條目數
  cleanupInterval: number; // 清理間隔（毫秒）
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  oldestEntry: number;
  newestEntry: number;
  averageSize: number;
}

export class ImageCacheManager {
  private static instance: ImageCacheManager;
  private cacheDirectory: string;
  private config: CacheConfig;
  private cacheIndex: Map<string, CacheEntry> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  };
  private cleanupTimer?: NodeJS.Timeout;

  private constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSize: 100 * 1024 * 1024, // 100MB
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
      maxEntries: 1000,
      cleanupInterval: 60 * 60 * 1000, // 1小時
      ...config
    };

    this.cacheDirectory = `${FileSystem.cacheDirectory}image_cache/`;
    this.initialize();
  }

  public static getInstance(config?: Partial<CacheConfig>): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager(config);
    }
    return ImageCacheManager.instance;
  }

  /**
   * 初始化快取管理器
   */
  private async initialize(): Promise<void> {
    try {
      // 確保快取目錄存在
      await this.ensureCacheDirectory();
      
      // 載入快取索引
      await this.loadCacheIndex();
      
      // 驗證快取文件
      await this.validateCacheFiles();
      
      // 啟動定期清理
      this.startPeriodicCleanup();
      
      console.log('ImageCacheManager initialized');
    } catch (error) {
      console.error('Failed to initialize ImageCacheManager:', error);
    }
  }

  /**
   * 確保快取目錄存在
   */
  private async ensureCacheDirectory(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
    }
  }

  /**
   * 生成快取鍵
   */
  private generateCacheKey(uri: string, options?: any): string {
    const optionsStr = options ? JSON.stringify(options) : '';
    const combined = `${uri}${optionsStr}`;
    
    // 簡單的哈希函數
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 轉換為32位整數
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * 獲取快取圖片
   */
  public async get(uri: string, options?: any): Promise<string | null> {
    this.stats.totalRequests++;
    
    try {
      const key = this.generateCacheKey(uri, options);
      const entry = this.cacheIndex.get(key);
      
      if (!entry) {
        this.stats.misses++;
        return null;
      }

      // 檢查是否過期
      if (this.isExpired(entry)) {
        await this.remove(key);
        this.stats.misses++;
        return null;
      }

      // 檢查文件是否存在
      const fileInfo = await FileSystem.getInfoAsync(entry.uri);
      if (!fileInfo.exists) {
        await this.remove(key);
        this.stats.misses++;
        return null;
      }

      // 更新最後訪問時間
      entry.lastAccessed = Date.now();
      await this.saveCacheIndex();

      this.stats.hits++;
      return entry.uri;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * 設置快取圖片
   */
  public async set(
    uri: string, 
    imageUri: string, 
    options?: any,
    metadata?: { mimeType?: string; etag?: string; expiresAt?: number }
  ): Promise<void> {
    try {
      const key = this.generateCacheKey(uri, options);
      
      // 生成快取文件名
      const extension = this.getFileExtension(imageUri) || 'jpg';
      const fileName = `${key}.${extension}`;
      const cacheFilePath = `${this.cacheDirectory}${fileName}`;

      // 複製或下載圖片到快取目錄
      if (imageUri.startsWith('file://') || imageUri.startsWith('/')) {
        // 本地文件，直接複製
        await FileSystem.copyAsync({
          from: imageUri,
          to: cacheFilePath
        });
      } else {
        // 遠程文件，下載
        const downloadResult = await FileSystem.downloadAsync(imageUri, cacheFilePath);
        if (downloadResult.status !== 200) {
          throw new Error(`Download failed with status ${downloadResult.status}`);
        }
      }

      // 獲取文件大小
      const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
      const size = fileInfo.size || 0;

      // 創建快取條目
      const entry: CacheEntry = {
        key,
        uri: cacheFilePath,
        originalUri: uri,
        size,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        mimeType: metadata?.mimeType || 'image/jpeg',
        etag: metadata?.etag,
        expiresAt: metadata?.expiresAt
      };

      // 檢查快取限制
      await this.enforceStorageLimits();

      // 添加到索引
      this.cacheIndex.set(key, entry);
      await this.saveCacheIndex();

    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  /**
   * 移除快取條目
   */
  public async remove(key: string): Promise<void> {
    try {
      const entry = this.cacheIndex.get(key);
      if (entry) {
        // 刪除文件
        const fileInfo = await FileSystem.getInfoAsync(entry.uri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(entry.uri);
        }

        // 從索引中移除
        this.cacheIndex.delete(key);
        await this.saveCacheIndex();
      }
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  /**
   * 清空所有快取
   */
  public async clear(): Promise<void> {
    try {
      // 刪除快取目錄
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.cacheDirectory);
      }

      // 重新創建目錄
      await this.ensureCacheDirectory();

      // 清空索引
      this.cacheIndex.clear();
      await AsyncStorage.removeItem('image_cache_index');

      // 重置統計
      this.stats = { hits: 0, misses: 0, totalRequests: 0 };

      console.log('Cache cleared');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * 獲取快取統計信息
   */
  public async getStats(): Promise<CacheStats> {
    let totalSize = 0;
    let oldestEntry = Date.now();
    let newestEntry = 0;

    for (const entry of this.cacheIndex.values()) {
      totalSize += entry.size;
      oldestEntry = Math.min(oldestEntry, entry.timestamp);
      newestEntry = Math.max(newestEntry, entry.timestamp);
    }

    const hitRate = this.stats.totalRequests > 0 
      ? this.stats.hits / this.stats.totalRequests 
      : 0;

    return {
      totalEntries: this.cacheIndex.size,
      totalSize,
      hitRate,
      oldestEntry: this.cacheIndex.size > 0 ? oldestEntry : 0,
      newestEntry: this.cacheIndex.size > 0 ? newestEntry : 0,
      averageSize: this.cacheIndex.size > 0 ? totalSize / this.cacheIndex.size : 0
    };
  }

  /**
   * 預載入圖片
   */
  public async preload(uris: string[], options?: any): Promise<void> {
    const preloadPromises = uris.map(async (uri) => {
      try {
        const cached = await this.get(uri, options);
        if (!cached) {
          await this.set(uri, uri, options);
        }
      } catch (error) {
        console.error(`Failed to preload ${uri}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * 檢查條目是否過期
   */
  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    
    // 檢查自定義過期時間
    if (entry.expiresAt && now > entry.expiresAt) {
      return true;
    }

    // 檢查最大年齡
    if (now - entry.timestamp > this.config.maxAge) {
      return true;
    }

    return false;
  }

  /**
   * 強制執行存儲限制
   */
  private async enforceStorageLimits(): Promise<void> {
    // 檢查條目數量限制
    if (this.cacheIndex.size >= this.config.maxEntries) {
      await this.evictLRU(Math.floor(this.config.maxEntries * 0.1)); // 清理10%
    }

    // 檢查存儲大小限制
    const stats = await this.getStats();
    if (stats.totalSize > this.config.maxSize) {
      const targetSize = this.config.maxSize * 0.8; // 清理到80%
      await this.evictBySize(stats.totalSize - targetSize);
    }
  }

  /**
   * LRU 淘汰策略
   */
  private async evictLRU(count: number): Promise<void> {
    const entries = Array.from(this.cacheIndex.entries());
    
    // 按最後訪問時間排序
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // 移除最少使用的條目
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      await this.remove(entries[i][0]);
    }
  }

  /**
   * 按大小淘汰
   */
  private async evictBySize(targetReduction: number): Promise<void> {
    const entries = Array.from(this.cacheIndex.entries());
    
    // 按最後訪問時間排序
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    let reducedSize = 0;
    for (const [key, entry] of entries) {
      if (reducedSize >= targetReduction) {
        break;
      }
      
      await this.remove(key);
      reducedSize += entry.size;
    }
  }

  /**
   * 載入快取索引
   */
  private async loadCacheIndex(): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem('image_cache_index');
      if (indexData) {
        const entries = JSON.parse(indexData);
        this.cacheIndex = new Map(Object.entries(entries));
      }
    } catch (error) {
      console.error('Load cache index error:', error);
    }
  }

  /**
   * 保存快取索引
   */
  private async saveCacheIndex(): Promise<void> {
    try {
      const indexData = Object.fromEntries(this.cacheIndex);
      await AsyncStorage.setItem('image_cache_index', JSON.stringify(indexData));
    } catch (error) {
      console.error('Save cache index error:', error);
    }
  }

  /**
   * 驗證快取文件
   */
  private async validateCacheFiles(): Promise<void> {
    const invalidKeys: string[] = [];

    for (const [key, entry] of this.cacheIndex) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(entry.uri);
        if (!fileInfo.exists) {
          invalidKeys.push(key);
        }
      } catch (error) {
        invalidKeys.push(key);
      }
    }

    // 移除無效條目
    for (const key of invalidKeys) {
      this.cacheIndex.delete(key);
    }

    if (invalidKeys.length > 0) {
      await this.saveCacheIndex();
      console.log(`Removed ${invalidKeys.length} invalid cache entries`);
    }
  }

  /**
   * 啟動定期清理
   */
  private startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        console.error('Periodic cleanup error:', error);
      }
    }, this.config.cleanupInterval);
  }

  /**
   * 清理過期條目
   */
  private async cleanup(): Promise<void> {
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cacheIndex) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.remove(key);
    }

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }

    // 強制執行存儲限制
    await this.enforceStorageLimits();
  }

  /**
   * 獲取文件擴展名
   */
  private getFileExtension(uri: string): string | null {
    const match = uri.match(/\.([^.?]+)(\?|$)/);
    return match ? match[1] : null;
  }

  /**
   * 銷毀快取管理器
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}

// 導出單例實例
export const imageCacheManager = ImageCacheManager.getInstance();