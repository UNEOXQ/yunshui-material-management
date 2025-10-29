import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// 類型定義
export interface ImageCacheInfo {
  uri: string;
  originalUri: string;
  size: number;
  timestamp: number;
  compressionLevel: number;
}

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: ImageManipulator.SaveFormat;
  enableCache?: boolean;
  cacheKey?: string;
}

export interface LazyLoadOptions {
  placeholder?: string;
  fadeInDuration?: number;
  threshold?: number;
}

export interface ImageMetrics {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  processingTime: number;
}

export class ImageOptimizationService {
  private static instance: ImageOptimizationService;
  private cacheDirectory: string;
  private maxCacheSize: number = 100 * 1024 * 1024; // 100MB
  private cacheMap: Map<string, ImageCacheInfo> = new Map();

  private constructor() {
    this.cacheDirectory = `${FileSystem.cacheDirectory}images/`;
    this.initializeCache();
  }

  public static getInstance(): ImageOptimizationService {
    if (!ImageOptimizationService.instance) {
      ImageOptimizationService.instance = new ImageOptimizationService();
    }
    return ImageOptimizationService.instance;
  }

  /**
   * 初始化圖片快取系統
   */
  private async initializeCache(): Promise<void> {
    try {
      // 確保快取目錄存在
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
      }

      // 載入快取映射
      await this.loadCacheMap();
      
      // 清理過期快取
      await this.cleanupExpiredCache();
    } catch (error) {
      console.error('Initialize cache error:', error);
    }
  }

  /**
   * 優化圖片（主要方法）
   */
  public async optimizeImage(
    imageUri: string,
    options: ImageOptimizationOptions = {}
  ): Promise<{ uri: string; metrics: ImageMetrics }> {
    const startTime = Date.now();
    
    try {
      const {
        maxWidth = 800,
        maxHeight = 600,
        quality = 0.8,
        format = ImageManipulator.SaveFormat.JPEG,
        enableCache = true,
        cacheKey
      } = options;

      // 生成快取鍵
      const key = cacheKey || this.generateCacheKey(imageUri, options);
      
      // 檢查快取
      if (enableCache) {
        const cachedImage = await this.getCachedImage(key);
        if (cachedImage) {
          return {
            uri: cachedImage.uri,
            metrics: {
              originalSize: 0,
              compressedSize: cachedImage.size,
              compressionRatio: 0,
              processingTime: Date.now() - startTime
            }
          };
        }
      }

      // 獲取原始圖片信息
      const originalInfo = await FileSystem.getInfoAsync(imageUri);
      const originalSize = originalInfo.size || 0;

      // 執行圖片優化
      const optimizedResult = await this.performOptimization(imageUri, {
        maxWidth,
        maxHeight,
        quality,
        format
      });

      // 獲取優化後的圖片信息
      const optimizedInfo = await FileSystem.getInfoAsync(optimizedResult.uri);
      const compressedSize = optimizedInfo.size || 0;

      // 快取優化後的圖片
      if (enableCache) {
        await this.cacheImage(key, optimizedResult.uri, imageUri, compressedSize, quality);
      }

      const metrics: ImageMetrics = {
        originalSize,
        compressedSize,
        compressionRatio: originalSize > 0 ? (originalSize - compressedSize) / originalSize : 0,
        processingTime: Date.now() - startTime
      };

      return {
        uri: optimizedResult.uri,
        metrics
      };
    } catch (error) {
      console.error('Optimize image error:', error);
      throw new Error('圖片優化失敗');
    }
  }

  /**
   * 執行圖片優化處理
   */
  private async performOptimization(
    imageUri: string,
    options: {
      maxWidth: number;
      maxHeight: number;
      quality: number;
      format: ImageManipulator.SaveFormat;
    }
  ): Promise<ImageManipulator.ImageResult> {
    const { maxWidth, maxHeight, quality, format } = options;

    // 獲取圖片尺寸
    const imageInfo = await this.getImageDimensions(imageUri);
    
    // 計算縮放比例
    const scaleRatio = this.calculateScaleRatio(
      imageInfo.width,
      imageInfo.height,
      maxWidth,
      maxHeight
    );

    const actions: ImageManipulator.Action[] = [];

    // 如果需要縮放
    if (scaleRatio < 1) {
      actions.push({
        resize: {
          width: Math.round(imageInfo.width * scaleRatio),
          height: Math.round(imageInfo.height * scaleRatio)
        }
      });
    }

    // 執行圖片處理
    return await ImageManipulator.manipulateAsync(
      imageUri,
      actions,
      {
        compress: quality,
        format,
        base64: false
      }
    );
  }

  /**
   * 獲取圖片尺寸
   */
  private async getImageDimensions(imageUri: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'web') {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = reject;
        img.src = imageUri;
      } else {
        const { Image } = require('react-native');
        Image.getSize(
          imageUri,
          (width: number, height: number) => resolve({ width, height }),
          reject
        );
      }
    });
  }

  /**
   * 計算縮放比例
   */
  private calculateScaleRatio(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): number {
    const widthRatio = maxWidth / originalWidth;
    const heightRatio = maxHeight / originalHeight;
    
    // 使用較小的比例以確保圖片不超過最大尺寸
    return Math.min(widthRatio, heightRatio, 1);
  }

  /**
   * 批量優化圖片
   */
  public async optimizeMultipleImages(
    imageUris: string[],
    options: ImageOptimizationOptions = {}
  ): Promise<Array<{ uri: string; metrics: ImageMetrics }>> {
    const results = await Promise.allSettled(
      imageUris.map(uri => this.optimizeImage(uri, options))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Failed to optimize image ${index}:`, result.reason);
        return {
          uri: imageUris[index],
          metrics: {
            originalSize: 0,
            compressedSize: 0,
            compressionRatio: 0,
            processingTime: 0
          }
        };
      }
    });
  }

  /**
   * 生成快取鍵
   */
  private generateCacheKey(imageUri: string, options: ImageOptimizationOptions): string {
    const optionsStr = JSON.stringify({
      maxWidth: options.maxWidth || 800,
      maxHeight: options.maxHeight || 600,
      quality: options.quality || 0.8,
      format: options.format || ImageManipulator.SaveFormat.JPEG
    });
    
    return `${imageUri}_${Buffer.from(optionsStr).toString('base64')}`;
  }

  /**
   * 快取圖片
   */
  private async cacheImage(
    key: string,
    optimizedUri: string,
    originalUri: string,
    size: number,
    compressionLevel: number
  ): Promise<void> {
    try {
      const cacheFileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const cacheFilePath = `${this.cacheDirectory}${cacheFileName}`;

      // 複製優化後的圖片到快取目錄
      await FileSystem.copyAsync({
        from: optimizedUri,
        to: cacheFilePath
      });

      // 更新快取映射
      const cacheInfo: ImageCacheInfo = {
        uri: cacheFilePath,
        originalUri,
        size,
        timestamp: Date.now(),
        compressionLevel
      };

      this.cacheMap.set(key, cacheInfo);
      await this.saveCacheMap();

      // 檢查快取大小限制
      await this.enforceMaxCacheSize();
    } catch (error) {
      console.error('Cache image error:', error);
    }
  }

  /**
   * 獲取快取圖片
   */
  private async getCachedImage(key: string): Promise<ImageCacheInfo | null> {
    try {
      const cacheInfo = this.cacheMap.get(key);
      if (!cacheInfo) {
        return null;
      }

      // 檢查快取文件是否存在
      const fileInfo = await FileSystem.getInfoAsync(cacheInfo.uri);
      if (!fileInfo.exists) {
        this.cacheMap.delete(key);
        await this.saveCacheMap();
        return null;
      }

      // 檢查快取是否過期（7天）
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
      if (Date.now() - cacheInfo.timestamp > maxAge) {
        await this.removeCachedImage(key);
        return null;
      }

      return cacheInfo;
    } catch (error) {
      console.error('Get cached image error:', error);
      return null;
    }
  }

  /**
   * 載入快取映射
   */
  private async loadCacheMap(): Promise<void> {
    try {
      const cacheMapStr = await AsyncStorage.getItem('image_cache_map');
      if (cacheMapStr) {
        const cacheMapData = JSON.parse(cacheMapStr);
        this.cacheMap = new Map(Object.entries(cacheMapData));
      }
    } catch (error) {
      console.error('Load cache map error:', error);
    }
  }

  /**
   * 保存快取映射
   */
  private async saveCacheMap(): Promise<void> {
    try {
      const cacheMapData = Object.fromEntries(this.cacheMap);
      await AsyncStorage.setItem('image_cache_map', JSON.stringify(cacheMapData));
    } catch (error) {
      console.error('Save cache map error:', error);
    }
  }

  /**
   * 清理過期快取
   */
  private async cleanupExpiredCache(): Promise<void> {
    try {
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
      const now = Date.now();
      const expiredKeys: string[] = [];

      for (const [key, cacheInfo] of this.cacheMap) {
        if (now - cacheInfo.timestamp > maxAge) {
          expiredKeys.push(key);
        }
      }

      for (const key of expiredKeys) {
        await this.removeCachedImage(key);
      }
    } catch (error) {
      console.error('Cleanup expired cache error:', error);
    }
  }

  /**
   * 強制執行最大快取大小限制
   */
  private async enforceMaxCacheSize(): Promise<void> {
    try {
      let totalSize = 0;
      const cacheEntries = Array.from(this.cacheMap.entries());

      // 計算總快取大小
      for (const [, cacheInfo] of cacheEntries) {
        totalSize += cacheInfo.size;
      }

      // 如果超過限制，刪除最舊的快取
      if (totalSize > this.maxCacheSize) {
        // 按時間戳排序（最舊的在前）
        cacheEntries.sort((a, b) => a[1].timestamp - b[1].timestamp);

        for (const [key, cacheInfo] of cacheEntries) {
          if (totalSize <= this.maxCacheSize * 0.8) { // 清理到80%
            break;
          }
          
          await this.removeCachedImage(key);
          totalSize -= cacheInfo.size;
        }
      }
    } catch (error) {
      console.error('Enforce max cache size error:', error);
    }
  }

  /**
   * 移除快取圖片
   */
  private async removeCachedImage(key: string): Promise<void> {
    try {
      const cacheInfo = this.cacheMap.get(key);
      if (cacheInfo) {
        // 刪除快取文件
        const fileInfo = await FileSystem.getInfoAsync(cacheInfo.uri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(cacheInfo.uri);
        }

        // 從映射中移除
        this.cacheMap.delete(key);
        await this.saveCacheMap();
      }
    } catch (error) {
      console.error('Remove cached image error:', error);
    }
  }

  /**
   * 清空所有快取
   */
  public async clearCache(): Promise<void> {
    try {
      // 刪除快取目錄
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.cacheDirectory);
        await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
      }

      // 清空快取映射
      this.cacheMap.clear();
      await AsyncStorage.removeItem('image_cache_map');
    } catch (error) {
      console.error('Clear cache error:', error);
    }
  }

  /**
   * 獲取快取統計信息
   */
  public async getCacheStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestFile: number;
    newestFile: number;
  }> {
    try {
      let totalSize = 0;
      let oldestFile = Date.now();
      let newestFile = 0;

      for (const cacheInfo of this.cacheMap.values()) {
        totalSize += cacheInfo.size;
        oldestFile = Math.min(oldestFile, cacheInfo.timestamp);
        newestFile = Math.max(newestFile, cacheInfo.timestamp);
      }

      return {
        totalFiles: this.cacheMap.size,
        totalSize,
        oldestFile: this.cacheMap.size > 0 ? oldestFile : 0,
        newestFile: this.cacheMap.size > 0 ? newestFile : 0
      };
    } catch (error) {
      console.error('Get cache stats error:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        oldestFile: 0,
        newestFile: 0
      };
    }
  }

  /**
   * 預載入圖片
   */
  public async preloadImage(imageUri: string, options: ImageOptimizationOptions = {}): Promise<void> {
    try {
      await this.optimizeImage(imageUri, { ...options, enableCache: true });
    } catch (error) {
      console.error('Preload image error:', error);
    }
  }

  /**
   * 批量預載入圖片
   */
  public async preloadMultipleImages(
    imageUris: string[],
    options: ImageOptimizationOptions = {}
  ): Promise<void> {
    try {
      const preloadPromises = imageUris.map(uri => 
        this.preloadImage(uri, options).catch(error => {
          console.error(`Failed to preload image ${uri}:`, error);
        })
      );

      await Promise.all(preloadPromises);
    } catch (error) {
      console.error('Preload multiple images error:', error);
    }
  }
}

// 導出單例實例
export const imageOptimizationService = ImageOptimizationService.getInstance();