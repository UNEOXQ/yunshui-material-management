import { ImageOptimizationService, ImageMetrics, ImageCacheInfo } from '../imageOptimizationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

// Mock Expo Image Manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
    WEBP: 'webp',
  },
}));

// Mock Expo File System
jest.mock('expo-file-system', () => ({
  cacheDirectory: 'file:///cache/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((options) => options.ios || options.default),
  },
  Image: {
    getSize: jest.fn((uri, success) => success(800, 600)),
  },
}));

describe('ImageOptimizationService', () => {
  let imageOptimizationService: ImageOptimizationService;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  const mockImageManipulator = ImageManipulator as jest.Mocked<typeof ImageManipulator>;
  const mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    
    mockFileSystem.getInfoAsync.mockResolvedValue({
      exists: true,
      uri: 'file:///test',
      size: 1024 * 1024, // 1MB
      isDirectory: false,
      modificationTime: Date.now(),
      md5: 'mock-md5',
    });
    
    mockFileSystem.makeDirectoryAsync.mockResolvedValue();
    mockFileSystem.copyAsync.mockResolvedValue();
    mockFileSystem.deleteAsync.mockResolvedValue();
    
    mockImageManipulator.manipulateAsync.mockResolvedValue({
      uri: 'file:///optimized/image.jpg',
      width: 400,
      height: 300,
    });
    
    // Reset singleton instance
    (ImageOptimizationService as any).instance = undefined;
    imageOptimizationService = ImageOptimizationService.getInstance();
  });

  describe('初始化', () => {
    it('應該成功初始化圖片優化服務', async () => {
      expect(imageOptimizationService).toBeDefined();
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockFileSystem.getInfoAsync).toHaveBeenCalled();
      expect(mockFileSystem.makeDirectoryAsync).toHaveBeenCalled();
    });

    it('應該創建快取目錄如果不存在', async () => {
      mockFileSystem.getInfoAsync.mockResolvedValueOnce({
        exists: false,
        uri: 'file:///cache/images/',
        size: 0,
        isDirectory: true,
        modificationTime: Date.now(),
        md5: '',
      });
      
      const newService = ImageOptimizationService.getInstance();
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockFileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
        'file:///cache/images/',
        { intermediates: true }
      );
    });
  });

  describe('圖片優化', () => {
    const testImageUri = 'file:///test/image.jpg';
    
    it('應該成功優化圖片', async () => {
      const result = await imageOptimizationService.optimizeImage(testImageUri);
      
      expect(result).toBeDefined();
      expect(result.uri).toBe('file:///optimized/image.jpg');
      expect(result.metrics).toBeDefined();
      expect(result.metrics.originalSize).toBeGreaterThan(0);
      expect(result.metrics.compressedSize).toBeGreaterThan(0);
      expect(result.metrics.processingTime).toBeGreaterThan(0);
    });

    it('應該使用自定義優化選項', async () => {
      const options = {
        maxWidth: 400,
        maxHeight: 300,
        quality: 0.7,
        format: ImageManipulator.SaveFormat.PNG,
      };
      
      await imageOptimizationService.optimizeImage(testImageUri, options);
      
      expect(mockImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        testImageUri,
        expect.arrayContaining([
          expect.objectContaining({
            resize: expect.objectContaining({
              width: expect.any(Number),
              height: expect.any(Number),
            }),
          }),
        ]),
        expect.objectContaining({
          compress: 0.7,
          format: ImageManipulator.SaveFormat.PNG,
          base64: false,
        })
      );
    });

    it('應該計算正確的縮放比例', async () => {
      // Mock image with larger dimensions
      const { Image } = require('react-native');
      Image.getSize.mockImplementation((uri, success) => success(1600, 1200));
      
      const options = {
        maxWidth: 800,
        maxHeight: 600,
      };
      
      await imageOptimizationService.optimizeImage(testImageUri, options);
      
      // Should resize to 800x600 (scale ratio 0.5)
      expect(mockImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        testImageUri,
        expect.arrayContaining([
          expect.objectContaining({
            resize: {
              width: 800,
              height: 600,
            },
          }),
        ]),
        expect.any(Object)
      );
    });

    it('應該不縮放小於最大尺寸的圖片', async () => {
      // Mock image with smaller dimensions
      const { Image } = require('react-native');
      Image.getSize.mockImplementation((uri, success) => success(400, 300));
      
      const options = {
        maxWidth: 800,
        maxHeight: 600,
      };
      
      await imageOptimizationService.optimizeImage(testImageUri, options);
      
      // Should not include resize action
      expect(mockImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        testImageUri,
        [],
        expect.any(Object)
      );
    });

    it('應該計算壓縮比例', async () => {
      const originalSize = 2 * 1024 * 1024; // 2MB
      const compressedSize = 500 * 1024; // 500KB
      
      mockFileSystem.getInfoAsync
        .mockResolvedValueOnce({
          exists: true,
          uri: testImageUri,
          size: originalSize,
          isDirectory: false,
          modificationTime: Date.now(),
          md5: 'original-md5',
        })
        .mockResolvedValueOnce({
          exists: true,
          uri: 'file:///optimized/image.jpg',
          size: compressedSize,
          isDirectory: false,
          modificationTime: Date.now(),
          md5: 'compressed-md5',
        });
      
      const result = await imageOptimizationService.optimizeImage(testImageUri, {
        enableCache: false,
      });
      
      expect(result.metrics.originalSize).toBe(originalSize);
      expect(result.metrics.compressedSize).toBe(compressedSize);
      expect(result.metrics.compressionRatio).toBeCloseTo(0.75); // (2MB - 0.5MB) / 2MB
    });
  });

  describe('批量圖片優化', () => {
    it('應該批量優化多張圖片', async () => {
      const imageUris = [
        'file:///test/image1.jpg',
        'file:///test/image2.jpg',
        'file:///test/image3.jpg',
      ];
      
      const results = await imageOptimizationService.optimizeMultipleImages(imageUris);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.uri).toBeDefined();
        expect(result.metrics).toBeDefined();
      });
    });

    it('應該處理部分失敗的批量優化', async () => {
      const imageUris = [
        'file:///test/image1.jpg',
        'file:///test/invalid.jpg',
        'file:///test/image3.jpg',
      ];
      
      mockImageManipulator.manipulateAsync
        .mockResolvedValueOnce({
          uri: 'file:///optimized/image1.jpg',
          width: 400,
          height: 300,
        })
        .mockRejectedValueOnce(new Error('Invalid image'))
        .mockResolvedValueOnce({
          uri: 'file:///optimized/image3.jpg',
          width: 400,
          height: 300,
        });
      
      const results = await imageOptimizationService.optimizeMultipleImages(imageUris);
      
      expect(results).toHaveLength(3);
      expect(results[0].uri).toBe('file:///optimized/image1.jpg');
      expect(results[1].uri).toBe('file:///test/invalid.jpg'); // 失敗時返回原始 URI
      expect(results[2].uri).toBe('file:///optimized/image3.jpg');
    });
  });

  describe('圖片快取', () => {
    const testImageUri = 'file:///test/cached-image.jpg';
    
    it('應該快取優化後的圖片', async () => {
      const options = { enableCache: true };
      
      await imageOptimizationService.optimizeImage(testImageUri, options);
      
      expect(mockFileSystem.copyAsync).toHaveBeenCalled();
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'image_cache_map',
        expect.any(String)
      );
    });

    it('應該從快取返回圖片', async () => {
      const cacheKey = 'test-cache-key';
      const cachedImageInfo: ImageCacheInfo = {
        uri: 'file:///cache/cached-image.jpg',
        originalUri: testImageUri,
        size: 500 * 1024,
        timestamp: Date.now(),
        compressionLevel: 0.8,
      };
      
      // Mock cache map
      const cacheMap = { [cacheKey]: cachedImageInfo };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cacheMap));
      
      const options = {
        enableCache: true,
        cacheKey,
      };
      
      const result = await imageOptimizationService.optimizeImage(testImageUri, options);
      
      expect(result.uri).toBe(cachedImageInfo.uri);
      expect(mockImageManipulator.manipulateAsync).not.toHaveBeenCalled();
    });

    it('應該清理過期的快取', async () => {
      const expiredCacheInfo: ImageCacheInfo = {
        uri: 'file:///cache/expired-image.jpg',
        originalUri: testImageUri,
        size: 500 * 1024,
        timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8天前
        compressionLevel: 0.8,
      };
      
      const cacheMap = { 'expired-key': expiredCacheInfo };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cacheMap));
      
      // Wait for initialization and cleanup
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(mockFileSystem.deleteAsync).toHaveBeenCalledWith(expiredCacheInfo.uri);
    });

    it('應該清空所有快取', async () => {
      await imageOptimizationService.clearCache();
      
      expect(mockFileSystem.deleteAsync).toHaveBeenCalled();
      expect(mockFileSystem.makeDirectoryAsync).toHaveBeenCalled();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('image_cache_map');
    });

    it('應該獲取快取統計信息', async () => {
      const cacheInfo1: ImageCacheInfo = {
        uri: 'file:///cache/image1.jpg',
        originalUri: 'file:///test/image1.jpg',
        size: 500 * 1024,
        timestamp: Date.now() - 1000,
        compressionLevel: 0.8,
      };
      
      const cacheInfo2: ImageCacheInfo = {
        uri: 'file:///cache/image2.jpg',
        originalUri: 'file:///test/image2.jpg',
        size: 300 * 1024,
        timestamp: Date.now(),
        compressionLevel: 0.7,
      };
      
      const cacheMap = {
        'key1': cacheInfo1,
        'key2': cacheInfo2,
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cacheMap));
      
      // Reinitialize to load cache
      (ImageOptimizationService as any).instance = undefined;
      const newService = ImageOptimizationService.getInstance();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stats = await newService.getCacheStats();
      
      expect(stats.totalFiles).toBe(2);
      expect(stats.totalSize).toBe(800 * 1024); // 500KB + 300KB
      expect(stats.oldestFile).toBeLessThan(stats.newestFile);
    });
  });

  describe('圖片預載入', () => {
    it('應該預載入單張圖片', async () => {
      const testImageUri = 'file:///test/preload-image.jpg';
      
      await imageOptimizationService.preloadImage(testImageUri);
      
      expect(mockImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        testImageUri,
        expect.any(Array),
        expect.any(Object)
      );
    });

    it('應該批量預載入圖片', async () => {
      const imageUris = [
        'file:///test/preload1.jpg',
        'file:///test/preload2.jpg',
        'file:///test/preload3.jpg',
      ];
      
      await imageOptimizationService.preloadMultipleImages(imageUris);
      
      expect(mockImageManipulator.manipulateAsync).toHaveBeenCalledTimes(3);
    });

    it('應該處理預載入錯誤', async () => {
      const testImageUri = 'file:///test/invalid-preload.jpg';
      
      mockImageManipulator.manipulateAsync.mockRejectedValue(new Error('Preload error'));
      
      // Should not throw error
      await expect(imageOptimizationService.preloadImage(testImageUri))
        .resolves.not.toThrow();
    });
  });

  describe('快取大小管理', () => {
    it('應該強制執行最大快取大小限制', async () => {
      // Create large cache entries
      const largeCacheInfo: ImageCacheInfo = {
        uri: 'file:///cache/large-image.jpg',
        originalUri: 'file:///test/large-image.jpg',
        size: 80 * 1024 * 1024, // 80MB
        timestamp: Date.now() - 2000,
        compressionLevel: 0.8,
      };
      
      const anotherLargeCacheInfo: ImageCacheInfo = {
        uri: 'file:///cache/another-large-image.jpg',
        originalUri: 'file:///test/another-large-image.jpg',
        size: 50 * 1024 * 1024, // 50MB
        timestamp: Date.now() - 1000,
        compressionLevel: 0.8,
      };
      
      const cacheMap = {
        'large-key': largeCacheInfo,
        'another-large-key': anotherLargeCacheInfo,
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cacheMap));
      
      // Reinitialize to load cache
      (ImageOptimizationService as any).instance = undefined;
      const newService = ImageOptimizationService.getInstance();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Add another image to trigger cache cleanup
      await newService.optimizeImage('file:///test/trigger-cleanup.jpg', {
        enableCache: true,
      });
      
      // Should delete oldest cache entries
      expect(mockFileSystem.deleteAsync).toHaveBeenCalled();
    });
  });

  describe('錯誤處理', () => {
    it('應該處理圖片優化錯誤', async () => {
      mockImageManipulator.manipulateAsync.mockRejectedValue(new Error('Optimization error'));
      
      await expect(imageOptimizationService.optimizeImage('file:///test/error.jpg'))
        .rejects.toThrow('圖片優化失敗');
    });

    it('應該處理圖片尺寸獲取錯誤', async () => {
      const { Image } = require('react-native');
      Image.getSize.mockImplementation((uri, success, error) => error(new Error('Size error')));
      
      await expect(imageOptimizationService.optimizeImage('file:///test/size-error.jpg'))
        .rejects.toThrow('圖片優化失敗');
    });

    it('應該處理檔案系統錯誤', async () => {
      mockFileSystem.getInfoAsync.mockRejectedValue(new Error('File system error'));
      
      await expect(imageOptimizationService.optimizeImage('file:///test/fs-error.jpg'))
        .rejects.toThrow('圖片優化失敗');
    });

    it('應該處理快取錯誤', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Cache error'));
      
      // Should not throw error during initialization
      expect(() => {
        ImageOptimizationService.getInstance();
      }).not.toThrow();
    });

    it('應該處理快取目錄創建錯誤', async () => {
      mockFileSystem.makeDirectoryAsync.mockRejectedValue(new Error('Directory error'));
      
      // Should not throw error during initialization
      expect(() => {
        ImageOptimizationService.getInstance();
      }).not.toThrow();
    });
  });

  describe('Web 平台支援', () => {
    beforeEach(() => {
      // Mock web platform
      const { Platform } = require('react-native');
      Platform.OS = 'web';
    });

    it('應該在 Web 平台上獲取圖片尺寸', async () => {
      // Mock Image constructor for web
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        width: 800,
        height: 600,
        src: '',
      };
      
      (global as any).Image = jest.fn(() => mockImage);
      
      const testImageUri = 'https://example.com/test-image.jpg';
      
      // Trigger image load
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);
      
      const result = await imageOptimizationService.optimizeImage(testImageUri);
      
      expect(result).toBeDefined();
      expect(mockImageManipulator.manipulateAsync).toHaveBeenCalled();
    });
  });
});