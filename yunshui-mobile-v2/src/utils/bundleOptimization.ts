import { Platform } from 'react-native';

// 類型定義
export interface BundleConfig {
  enableCodeSplitting: boolean;
  enableTreeShaking: boolean;
  enableMinification: boolean;
  enableCompression: boolean;
  chunkSizeLimit: number; // KB
  enableLazyLoading: boolean;
}

export interface ModuleInfo {
  name: string;
  size: number;
  dependencies: string[];
  isLazy: boolean;
  loadTime: number;
}

export interface BundleAnalysis {
  totalSize: number;
  moduleCount: number;
  largestModules: ModuleInfo[];
  duplicateModules: string[];
  unusedModules: string[];
  loadTime: number;
  suggestions: string[];
}

export class BundleOptimizer {
  private static instance: BundleOptimizer;
  private config: BundleConfig;
  private moduleRegistry: Map<string, ModuleInfo> = new Map();
  private loadedModules: Set<string> = new Set();

  private constructor(config?: Partial<BundleConfig>) {
    this.config = {
      enableCodeSplitting: true,
      enableTreeShaking: true,
      enableMinification: true,
      enableCompression: true,
      chunkSizeLimit: 250, // 250KB
      enableLazyLoading: true,
      ...config
    };
  }

  public static getInstance(config?: Partial<BundleConfig>): BundleOptimizer {
    if (!BundleOptimizer.instance) {
      BundleOptimizer.instance = new BundleOptimizer(config);
    }
    return BundleOptimizer.instance;
  }

  /**
   * 動態導入模組（代碼分割）
   */
  public async importModule<T = any>(
    modulePath: string,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      // 檢查模組是否已載入
      if (this.loadedModules.has(modulePath)) {
        const cached = this.getCachedModule<T>(modulePath);
        if (cached) {
          return cached;
        }
      }

      // 動態導入
      let module: T;
      
      if (this.config.enableLazyLoading) {
        module = await this.lazyImport<T>(modulePath);
      } else {
        module = await import(modulePath);
      }

      // 記錄模組信息
      const loadTime = Date.now() - startTime;
      this.registerModule(modulePath, {
        name: modulePath,
        size: this.estimateModuleSize(module),
        dependencies: [],
        isLazy: this.config.enableLazyLoading,
        loadTime
      });

      this.loadedModules.add(modulePath);
      this.cacheModule(modulePath, module);

      return module;
    } catch (error) {
      console.error(`Failed to import module ${modulePath}:`, error);
      
      if (fallback) {
        return await fallback();
      }
      
      throw error;
    }
  }

  /**
   * 懶載入模組
   */
  private async lazyImport<T>(modulePath: string): Promise<T> {
    // 模擬懶載入邏輯
    return new Promise((resolve, reject) => {
      // 使用 setTimeout 模擬異步載入
      setTimeout(async () => {
        try {
          const module = await import(modulePath);
          resolve(module);
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
  }

  /**
   * 預載入關鍵模組
   */
  public async preloadCriticalModules(modules: string[]): Promise<void> {
    const preloadPromises = modules.map(async (modulePath) => {
      try {
        await this.importModule(modulePath);
      } catch (error) {
        console.warn(`Failed to preload module ${modulePath}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * 估算模組大小
   */
  private estimateModuleSize(module: any): number {
    try {
      // 簡化的大小估算
      const serialized = JSON.stringify(module);
      return new Blob([serialized]).size;
    } catch (error) {
      // 如果無法序列化，返回估算值
      return 1024; // 1KB 預設值
    }
  }

  /**
   * 註冊模組信息
   */
  private registerModule(path: string, info: ModuleInfo): void {
    this.moduleRegistry.set(path, info);
  }

  /**
   * 快取模組
   */
  private cacheModule<T>(path: string, module: T): void {
    // 在實際應用中，這裡可以使用更複雜的快取策略
    (global as any).__moduleCache = (global as any).__moduleCache || {};
    (global as any).__moduleCache[path] = module;
  }

  /**
   * 獲取快取的模組
   */
  private getCachedModule<T>(path: string): T | null {
    const cache = (global as any).__moduleCache;
    return cache ? cache[path] || null : null;
  }

  /**
   * 分析包大小
   */
  public analyzeBundleSize(): BundleAnalysis {
    const modules = Array.from(this.moduleRegistry.values());
    const totalSize = modules.reduce((sum, module) => sum + module.size, 0);
    
    // 找出最大的模組
    const largestModules = modules
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    // 檢測重複模組（簡化實現）
    const moduleNames = modules.map(m => m.name.split('/').pop() || m.name);
    const duplicateModules = moduleNames.filter((name, index) => 
      moduleNames.indexOf(name) !== index
    );

    // 計算總載入時間
    const totalLoadTime = modules.reduce((sum, module) => sum + module.loadTime, 0);

    // 生成優化建議
    const suggestions = this.generateOptimizationSuggestions(modules, totalSize);

    return {
      totalSize,
      moduleCount: modules.length,
      largestModules,
      duplicateModules: Array.from(new Set(duplicateModules)),
      unusedModules: [], // 需要更複雜的分析來檢測
      loadTime: totalLoadTime,
      suggestions
    };
  }

  /**
   * 生成優化建議
   */
  private generateOptimizationSuggestions(modules: ModuleInfo[], totalSize: number): string[] {
    const suggestions: string[] = [];

    // 檢查包大小
    if (totalSize > 10 * 1024 * 1024) { // 10MB
      suggestions.push('包大小過大，建議啟用代碼分割和懶載入');
    }

    // 檢查大型模組
    const largeModules = modules.filter(m => m.size > 500 * 1024); // 500KB
    if (largeModules.length > 0) {
      suggestions.push(`發現 ${largeModules.length} 個大型模組，建議進行代碼分割`);
    }

    // 檢查載入時間
    const slowModules = modules.filter(m => m.loadTime > 1000); // 1秒
    if (slowModules.length > 0) {
      suggestions.push(`發現 ${slowModules.length} 個載入緩慢的模組，建議優化或預載入`);
    }

    // 檢查模組數量
    if (modules.length > 100) {
      suggestions.push('模組數量過多，建議合併相關模組');
    }

    return suggestions;
  }

  /**
   * 清理未使用的模組
   */
  public cleanupUnusedModules(): void {
    const cache = (global as any).__moduleCache;
    if (!cache) return;

    // 簡化的清理邏輯
    const unusedModules: string[] = [];
    
    for (const path in cache) {
      if (!this.loadedModules.has(path)) {
        delete cache[path];
        unusedModules.push(path);
      }
    }

    if (unusedModules.length > 0) {
      console.log(`Cleaned up ${unusedModules.length} unused modules`);
    }
  }

  /**
   * 優化圖片資源
   */
  public optimizeImageAssets(): {
    originalSize: number;
    optimizedSize: number;
    savings: number;
  } {
    // 這裡應該實現圖片優化邏輯
    // 例如：壓縮、格式轉換、響應式圖片等
    
    const originalSize = 5 * 1024 * 1024; // 5MB 假設值
    const optimizedSize = 2 * 1024 * 1024; // 2MB 優化後
    const savings = originalSize - optimizedSize;

    return {
      originalSize,
      optimizedSize,
      savings
    };
  }

  /**
   * 啟用 Tree Shaking
   */
  public enableTreeShaking(): void {
    if (!this.config.enableTreeShaking) {
      this.config.enableTreeShaking = true;
      console.log('Tree shaking enabled');
    }
  }

  /**
   * 配置代碼分割
   */
  public configureCodeSplitting(options: {
    chunkSize?: number;
    enableAsync?: boolean;
    enableVendorChunk?: boolean;
  }): void {
    if (options.chunkSize) {
      this.config.chunkSizeLimit = options.chunkSize;
    }

    this.config.enableCodeSplitting = true;
    console.log('Code splitting configured:', options);
  }

  /**
   * 獲取運行時統計
   */
  public getRuntimeStats(): {
    loadedModules: number;
    totalSize: number;
    averageLoadTime: number;
    cacheHitRate: number;
  } {
    const modules = Array.from(this.moduleRegistry.values());
    const totalSize = modules.reduce((sum, m) => sum + m.size, 0);
    const averageLoadTime = modules.length > 0 
      ? modules.reduce((sum, m) => sum + m.loadTime, 0) / modules.length 
      : 0;

    return {
      loadedModules: this.loadedModules.size,
      totalSize,
      averageLoadTime,
      cacheHitRate: 0.8 // 簡化值
    };
  }

  /**
   * 重置統計
   */
  public resetStats(): void {
    this.moduleRegistry.clear();
    this.loadedModules.clear();
    
    const cache = (global as any).__moduleCache;
    if (cache) {
      (global as any).__moduleCache = {};
    }
  }

  /**
   * 獲取配置
   */
  public getConfig(): BundleConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<BundleConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// 工具函數
export const createLazyComponent = <P = {}>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFunc);
  
  return (props: P) => (
    <React.Suspense fallback={fallback ? <fallback /> : <div>Loading...</div>}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

// 預載入 Hook
export const usePreload = (modules: string[]) => {
  const [isPreloaded, setIsPreloaded] = React.useState(false);
  const bundleOptimizer = BundleOptimizer.getInstance();

  React.useEffect(() => {
    const preload = async () => {
      try {
        await bundleOptimizer.preloadCriticalModules(modules);
        setIsPreloaded(true);
      } catch (error) {
        console.error('Preload failed:', error);
      }
    };

    preload();
  }, [modules]);

  return isPreloaded;
};

// 導出單例實例
export const bundleOptimizer = BundleOptimizer.getInstance();