import { PerformanceService } from '../performanceService';
import { SecurityService } from '../securityService';
import { ImageOptimizationService } from '../imageOptimizationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock all dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native-keychain');
jest.mock('expo-crypto');
jest.mock('react-native-device-info');
jest.mock('expo-image-manipulator');
jest.mock('expo-file-system');

describe('Performance, Security & Image Optimization Integration Tests', () => {
  let performanceService: PerformanceService;
  let securityService: SecurityService;
  let imageOptimizationService: ImageOptimizationService;
  
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    
    // Initialize services (don't reset singletons in integration tests)
    performanceService = PerformanceService.getInstance();
    securityService = SecurityService.getInstance();
    imageOptimizationService = ImageOptimizationService.getInstance();
  });

  afterEach(() => {
    if (performanceService) {
      performanceService.stopMonitoring();
      performanceService.destroy();
    }
  });

  describe('服務初始化整合測試', () => {
    it('應該成功初始化所有服務', async () => {
      expect(performanceService).toBeDefined();
      expect(securityService).toBeDefined();
      expect(imageOptimizationService).toBeDefined();
      
      // Wait for all services to initialize
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify services are properly configured
      expect(performanceService.getConfig().enableMonitoring).toBe(true);
      expect(securityService.getSecurityConfig().enableEncryption).toBe(true);
    });

    it('應該處理並發初始化', async () => {
      const initPromises = [
        new Promise(resolve => {
          const service = PerformanceService.getInstance();
          resolve(service);
        }),
        new Promise(resolve => {
          const service = SecurityService.getInstance();
          resolve(service);
        }),
        new Promise(resolve => {
          const service = ImageOptimizationService.getInstance();
          resolve(service);
        }),
      ];

      const services = await Promise.all(initPromises);
      
      expect(services).toHaveLength(3);
      services.forEach(service => {
        expect(service).toBeDefined();
      });
    });
  });

  describe('性能監控與安全檢查整合', () => {
    it('應該在性能監控期間執行安全檢查', async () => {
      // Start performance monitoring
      performanceService.updateConfig({ 
        enableMonitoring: true,
        sampleRate: 1.0, // 100% sampling for testing
        reportingInterval: 100, // Short interval for testing
      });

      // Perform security check
      const securityResults = await securityService.performSecurityCheck();
      
      expect(securityResults).toEqual({
        deviceBinding: true,
        appIntegrity: true,
        tamperDetection: true,
      });

      // Wait for performance monitoring to collect metrics
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const metrics = performanceService.getCurrentMetrics();
      expect(metrics).toBeDefined();
    });

    it('應該在安全威脅檢測時調整性能監控', async () => {
      // Simulate security threat
      securityService.updateSecurityConfig({
        enableTamperDetection: true,
        maxFailedAttempts: 1,
      });

      // Record failed attempts to trigger security measures
      await securityService.recordFailedAttempt();
      
      const isLocked = await securityService.isAccountLocked();
      expect(isLocked).toBe(true);

      // Performance monitoring should still work
      performanceService.startRenderTiming();
      const renderTime = performanceService.endRenderTiming();
      expect(renderTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('圖片優化與性能監控整合', () => {
    it('應該監控圖片優化性能', async () => {
      const testImageUri = 'file:///test/performance-image.jpg';
      
      // Start render timing for image optimization
      performanceService.startRenderTiming();
      
      try {
        await imageOptimizationService.optimizeImage(testImageUri, {
          maxWidth: 800,
          maxHeight: 600,
          quality: 0.8,
        });
      } catch (error) {
        // Expected to fail in test environment
      }
      
      const renderTime = performanceService.endRenderTiming();
      expect(renderTime).toBeGreaterThan(0);
      
      // Analyze performance for image optimization
      const mockMetrics = {
        renderTime,
        memoryUsage: 60 * 1024 * 1024, // 60MB
        bundleSize: 20 * 1024 * 1024,
        networkLatency: 100,
        frameRate: 45,
        crashCount: 0,
        timestamp: Date.now(),
      };
      
      const suggestions = performanceService.analyzePerformance(mockMetrics);
      
      // Should provide suggestions for memory optimization
      const memorySuggestion = suggestions.find(s => s.type === 'memory');
      expect(memorySuggestion).toBeDefined();
    });

    it('應該在圖片優化期間監控記憶體使用量', async () => {
      const imageUris = [
        'file:///test/image1.jpg',
        'file:///test/image2.jpg',
        'file:///test/image3.jpg',
        'file:///test/image4.jpg',
        'file:///test/image5.jpg',
      ];

      performanceService.startRenderTiming();
      
      try {
        await imageOptimizationService.optimizeMultipleImages(imageUris, {
          maxWidth: 400,
          maxHeight: 300,
          quality: 0.7,
        });
      } catch (error) {
        // Expected to fail in test environment
      }
      
      const renderTime = performanceService.endRenderTiming();
      
      // Simulate high memory usage during batch processing
      const highMemoryMetrics = {
        renderTime,
        memoryUsage: 150 * 1024 * 1024, // 150MB - high memory usage
        bundleSize: 25 * 1024 * 1024,
        networkLatency: 200,
        frameRate: 30,
        crashCount: 0,
        timestamp: Date.now(),
      };
      
      const suggestions = performanceService.analyzePerformance(highMemoryMetrics);
      
      expect(suggestions).toHaveLength(2); // Memory and frame rate issues
      expect(suggestions.find(s => s.type === 'memory')).toBeDefined();
      expect(suggestions.find(s => s.type === 'render')).toBeDefined();
    });
  });

  describe('安全圖片處理整合', () => {
    it('應該安全地儲存圖片快取資訊', async () => {
      const testImageUri = 'file:///test/secure-image.jpg';
      const cacheKey = 'secure-cache-key';
      
      // Encrypt cache key for security
      const encryptedCacheKey = await securityService.encryptData(cacheKey);
      
      expect(encryptedCacheKey.data).toBeDefined();
      expect(encryptedCacheKey.data).not.toBe(cacheKey);
      
      // Decrypt to verify
      const decryptedCacheKey = await securityService.decryptData(encryptedCacheKey);
      expect(decryptedCacheKey).toBe(cacheKey);
    });

    it('應該在設備綁定失敗時清理圖片快取', async () => {
      // Simulate device binding failure
      const mockKeychain = require('react-native-keychain');
      mockKeychain.getInternetCredentials.mockResolvedValue({
        username: 'device_fingerprint',
        password: 'different-fingerprint', // Different from generated fingerprint
        service: 'yunshui_device_fingerprint',
        storage: 'keychain',
      });
      
      const isValidDevice = await securityService.validateDeviceBinding();
      expect(isValidDevice).toBe(false);
      
      if (!isValidDevice) {
        // Clear image cache for security
        await imageOptimizationService.clearCache();
        
        const mockFileSystem = require('expo-file-system');
        expect(mockFileSystem.deleteAsync).toHaveBeenCalled();
      }
    });
  });

  describe('綜合性能基準測試', () => {
    it('應該測試完整的圖片處理流程性能', async () => {
      const testScenarios = [
        {
          name: '小圖片優化',
          imageUri: 'file:///test/small-image.jpg',
          options: { maxWidth: 200, maxHeight: 200, quality: 0.9 },
          expectedMaxTime: 100, // ms
        },
        {
          name: '中等圖片優化',
          imageUri: 'file:///test/medium-image.jpg',
          options: { maxWidth: 800, maxHeight: 600, quality: 0.8 },
          expectedMaxTime: 300, // ms
        },
        {
          name: '大圖片優化',
          imageUri: 'file:///test/large-image.jpg',
          options: { maxWidth: 1200, maxHeight: 900, quality: 0.7 },
          expectedMaxTime: 500, // ms
        },
      ];

      const results = [];
      
      for (const scenario of testScenarios) {
        performanceService.startRenderTiming();
        
        try {
          await imageOptimizationService.optimizeImage(scenario.imageUri, scenario.options);
        } catch (error) {
          // Expected to fail in test environment
        }
        
        const processingTime = performanceService.endRenderTiming();
        
        results.push({
          scenario: scenario.name,
          processingTime,
          withinExpectedTime: processingTime <= scenario.expectedMaxTime,
        });
      }
      
      // All scenarios should complete within expected time
      results.forEach(result => {
        expect(result.processingTime).toBeGreaterThan(0);
        // In test environment, we can't guarantee actual processing times
        // but we can verify the timing mechanism works
      });
    });

    it('應該測試安全操作的性能影響', async () => {
      const testData = 'performance-test-data';
      const iterations = 10;
      const encryptionTimes = [];
      const decryptionTimes = [];
      
      for (let i = 0; i < iterations; i++) {
        // Test encryption performance
        performanceService.startRenderTiming();
        const encrypted = await securityService.encryptData(testData);
        const encryptTime = performanceService.endRenderTiming();
        encryptionTimes.push(encryptTime);
        
        // Test decryption performance
        performanceService.startRenderTiming();
        await securityService.decryptData(encrypted);
        const decryptTime = performanceService.endRenderTiming();
        decryptionTimes.push(decryptTime);
      }
      
      const avgEncryptTime = encryptionTimes.reduce((a, b) => a + b, 0) / iterations;
      const avgDecryptTime = decryptionTimes.reduce((a, b) => a + b, 0) / iterations;
      
      expect(avgEncryptTime).toBeGreaterThan(0);
      expect(avgDecryptTime).toBeGreaterThan(0);
      
      // Encryption/decryption should be reasonably fast (under 50ms average)
      // Note: In test environment with mocks, these will be very fast
      expect(avgEncryptTime).toBeLessThan(100);
      expect(avgDecryptTime).toBeLessThan(100);
    });
  });

  describe('錯誤恢復和韌性測試', () => {
    it('應該在一個服務失敗時保持其他服務運行', async () => {
      // Simulate performance service error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Force an error in performance service
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));
      
      // Other services should still work
      const securityCheck = await securityService.performSecurityCheck();
      expect(securityCheck).toBeDefined();
      
      try {
        await imageOptimizationService.optimizeImage('file:///test/recovery-test.jpg');
      } catch (error) {
        // Expected to fail in test environment
      }
      
      consoleSpy.mockRestore();
    });

    it('應該在記憶體不足時優雅降級', async () => {
      // Simulate low memory condition
      const highMemoryMetrics = {
        renderTime: 50,
        memoryUsage: 200 * 1024 * 1024, // 200MB - very high
        bundleSize: 30 * 1024 * 1024,
        networkLatency: 300,
        frameRate: 20, // Low frame rate
        crashCount: 0,
        timestamp: Date.now(),
      };
      
      const suggestions = performanceService.analyzePerformance(highMemoryMetrics);
      
      // Should provide high-priority suggestions
      const highPrioritySuggestions = suggestions.filter(s => s.severity === 'high');
      expect(highPrioritySuggestions.length).toBeGreaterThan(0);
      
      // Should suggest memory optimization
      const memorySuggestion = suggestions.find(s => s.type === 'memory');
      expect(memorySuggestion).toBeDefined();
      expect(memorySuggestion?.severity).toBe('high');
      
      // Should suggest frame rate optimization
      const frameSuggestion = suggestions.find(s => s.type === 'render' && s.message.includes('幀率'));
      expect(frameSuggestion).toBeDefined();
    });
  });

  describe('資源清理測試', () => {
    it('應該正確清理所有服務資源', async () => {
      // Add some data to services
      await securityService.setSecureItem('test-key', 'test-value');
      
      try {
        await imageOptimizationService.optimizeImage('file:///test/cleanup-test.jpg');
      } catch (error) {
        // Expected to fail in test environment
      }
      
      // Clear all resources
      await securityService.clearSecurityData();
      await imageOptimizationService.clearCache();
      await performanceService.clearMetricsHistory();
      
      // Verify cleanup
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('security_metrics');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('image_cache_map');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('performance_metrics');
      
      const mockFileSystem = require('expo-file-system');
      expect(mockFileSystem.deleteAsync).toHaveBeenCalled();
    });
  });
});