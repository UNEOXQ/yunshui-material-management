import { Platform, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 類型定義
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  networkLatency: number;
  frameRate: number;
  crashCount: number;
  timestamp: number;
}

export interface PerformanceConfig {
  enableMonitoring: boolean;
  sampleRate: number; // 0-1 之間的採樣率
  maxMetricsHistory: number;
  reportingInterval: number; // 毫秒
  enableAutomaticOptimization: boolean;
}

export interface OptimizationSuggestion {
  type: 'memory' | 'render' | 'network' | 'bundle';
  severity: 'low' | 'medium' | 'high';
  message: string;
  action?: () => void;
}

export interface DeviceCapabilities {
  totalMemory: number;
  availableMemory: number;
  cpuCores: number;
  screenDensity: number;
  networkType: string;
  batteryLevel: number;
  isLowEndDevice: boolean;
}

export class PerformanceService {
  private static instance: PerformanceService;
  private config: PerformanceConfig;
  private metricsHistory: PerformanceMetrics[] = [];
  private renderStartTime: number = 0;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private monitoringTimer?: NodeJS.Timeout;
  private deviceCapabilities?: DeviceCapabilities;

  private constructor(config?: Partial<PerformanceConfig>) {
    this.config = {
      enableMonitoring: true,
      sampleRate: 0.1, // 10% 採樣率
      maxMetricsHistory: 100,
      reportingInterval: 60000, // 1分鐘
      enableAutomaticOptimization: true,
      ...config
    };

    this.initialize();
  }

  public static getInstance(config?: Partial<PerformanceConfig>): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService(config);
    }
    return PerformanceService.instance;
  }

  /**
   * 初始化性能服務
   */
  private async initialize(): Promise<void> {
    try {
      // 載入歷史指標
      await this.loadMetricsHistory();
      
      // 檢測設備能力
      await this.detectDeviceCapabilities();
      
      // 啟動監控
      if (this.config.enableMonitoring) {
        this.startMonitoring();
      }
      
      console.log('PerformanceService initialized');
    } catch (error) {
      console.error('Failed to initialize PerformanceService:', error);
    }
  }

  /**
   * 檢測設備能力
   */
  private async detectDeviceCapabilities(): Promise<void> {
    try {
      const { width, height } = Dimensions.get('window');
      const screenDensity = Platform.select({
        ios: 2, // 簡化處理
        android: 2,
        default: 1
      });

      // 基於螢幕尺寸和平台判斷是否為低端設備
      const screenArea = width * height;
      const isLowEndDevice = screenArea < 800 * 600 || Platform.OS === 'android';

      this.deviceCapabilities = {
        totalMemory: this.estimateMemory(),
        availableMemory: this.estimateMemory() * 0.7, // 估算可用記憶體
        cpuCores: this.estimateCpuCores(),
        screenDensity,
        networkType: 'unknown',
        batteryLevel: 1.0,
        isLowEndDevice
      };
    } catch (error) {
      console.error('Failed to detect device capabilities:', error);
    }
  }

  /**
   * 估算設備記憶體
   */
  private estimateMemory(): number {
    // 基於平台和螢幕尺寸估算記憶體
    const { width, height } = Dimensions.get('window');
    const screenArea = width * height;
    
    if (Platform.OS === 'ios') {
      if (screenArea > 1000 * 1000) return 4096; // 4GB
      if (screenArea > 800 * 600) return 2048; // 2GB
      return 1024; // 1GB
    } else {
      if (screenArea > 1000 * 1000) return 6144; // 6GB
      if (screenArea > 800 * 600) return 3072; // 3GB
      return 2048; // 2GB
    }
  }

  /**
   * 估算 CPU 核心數
   */
  private estimateCpuCores(): number {
    // 基於平台估算 CPU 核心數
    return Platform.OS === 'ios' ? 6 : 8;
  }

  /**
   * 開始性能監控
   */
  private startMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    this.monitoringTimer = setInterval(() => {
      if (Math.random() < this.config.sampleRate) {
        this.collectMetrics();
      }
    }, this.config.reportingInterval);
  }

  /**
   * 停止性能監控
   */
  public stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }
  }

  /**
   * 收集性能指標
   */
  private async collectMetrics(): Promise<void> {
    try {
      const metrics: PerformanceMetrics = {
        renderTime: this.measureRenderTime(),
        memoryUsage: this.measureMemoryUsage(),
        bundleSize: this.measureBundleSize(),
        networkLatency: await this.measureNetworkLatency(),
        frameRate: this.measureFrameRate(),
        crashCount: 0, // 需要外部報告
        timestamp: Date.now()
      };

      this.addMetrics(metrics);

      // 自動優化
      if (this.config.enableAutomaticOptimization) {
        await this.performAutomaticOptimization(metrics);
      }
    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }
  }

  /**
   * 測量渲染時間
   */
  private measureRenderTime(): number {
    if (this.renderStartTime === 0) {
      return 0;
    }
    return Date.now() - this.renderStartTime;
  }

  /**
   * 測量記憶體使用量
   */
  private measureMemoryUsage(): number {
    // React Native 沒有直接的記憶體 API，使用估算
    if (global.performance && global.performance.memory) {
      return (global.performance.memory as any).usedJSHeapSize || 0;
    }
    
    // 基於組件數量和數據大小估算
    return this.estimateMemoryUsage();
  }

  /**
   * 估算記憶體使用量
   */
  private estimateMemoryUsage(): number {
    // 簡化的記憶體使用量估算
    const baseUsage = 50 * 1024 * 1024; // 50MB 基礎使用量
    const variableUsage = Math.random() * 20 * 1024 * 1024; // 0-20MB 變動使用量
    return baseUsage + variableUsage;
  }

  /**
   * 測量包大小
   */
  private measureBundleSize(): number {
    // React Native 沒有直接的包大小 API，返回估算值
    return Platform.OS === 'ios' ? 15 * 1024 * 1024 : 20 * 1024 * 1024; // 15MB (iOS) / 20MB (Android)
  }

  /**
   * 測量網路延遲
   */
  private async measureNetworkLatency(): Promise<number> {
    try {
      const startTime = Date.now();
      
      // 發送簡單的網路請求測量延遲
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        return Date.now() - startTime;
      }
      
      return -1; // 網路錯誤
    } catch (error) {
      return -1; // 網路錯誤
    }
  }

  /**
   * 測量幀率
   */
  private measureFrameRate(): number {
    const now = Date.now();
    
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = now;
      return 60; // 預設值
    }
    
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    if (deltaTime > 0) {
      return Math.min(1000 / deltaTime, 60); // 最大 60 FPS
    }
    
    return 60;
  }

  /**
   * 添加性能指標
   */
  private addMetrics(metrics: PerformanceMetrics): void {
    this.metricsHistory.push(metrics);
    
    // 限制歷史記錄數量
    if (this.metricsHistory.length > this.config.maxMetricsHistory) {
      this.metricsHistory = this.metricsHistory.slice(-this.config.maxMetricsHistory);
    }
    
    // 保存到本地存儲
    this.saveMetricsHistory();
  }

  /**
   * 執行自動優化
   */
  private async performAutomaticOptimization(metrics: PerformanceMetrics): Promise<void> {
    try {
      const suggestions = this.analyzePerformance(metrics);
      
      for (const suggestion of suggestions) {
        if (suggestion.severity === 'high' && suggestion.action) {
          suggestion.action();
        }
      }
    } catch (error) {
      console.error('Automatic optimization failed:', error);
    }
  }

  /**
   * 分析性能並提供建議
   */
  public analyzePerformance(metrics?: PerformanceMetrics): OptimizationSuggestion[] {
    const currentMetrics = metrics || this.getCurrentMetrics();
    const suggestions: OptimizationSuggestion[] = [];

    if (!currentMetrics) {
      return suggestions;
    }

    // 記憶體使用量分析
    if (currentMetrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      suggestions.push({
        type: 'memory',
        severity: 'high',
        message: '記憶體使用量過高，建議清理快取或減少同時載入的數據',
        action: () => this.optimizeMemory()
      });
    } else if (currentMetrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      suggestions.push({
        type: 'memory',
        severity: 'medium',
        message: '記憶體使用量較高，建議監控記憶體使用情況'
      });
    }

    // 渲染時間分析
    if (currentMetrics.renderTime > 100) { // 100ms
      suggestions.push({
        type: 'render',
        severity: 'high',
        message: '渲染時間過長，建議優化組件結構或使用虛擬化',
        action: () => this.optimizeRendering()
      });
    } else if (currentMetrics.renderTime > 50) { // 50ms
      suggestions.push({
        type: 'render',
        severity: 'medium',
        message: '渲染時間較長，建議檢查組件性能'
      });
    }

    // 網路延遲分析
    if (currentMetrics.networkLatency > 2000) { // 2秒
      suggestions.push({
        type: 'network',
        severity: 'high',
        message: '網路延遲過高，建議啟用離線模式或優化網路請求',
        action: () => this.optimizeNetwork()
      });
    } else if (currentMetrics.networkLatency > 1000) { // 1秒
      suggestions.push({
        type: 'network',
        severity: 'medium',
        message: '網路延遲較高，建議檢查網路連接'
      });
    }

    // 幀率分析
    if (currentMetrics.frameRate < 30) {
      suggestions.push({
        type: 'render',
        severity: 'high',
        message: '幀率過低，建議減少動畫或優化渲染邏輯',
        action: () => this.optimizeFrameRate()
      });
    } else if (currentMetrics.frameRate < 45) {
      suggestions.push({
        type: 'render',
        severity: 'medium',
        message: '幀率較低，建議檢查動畫性能'
      });
    }

    return suggestions;
  }

  /**
   * 記憶體優化
   */
  private optimizeMemory(): void {
    try {
      // 清理圖片快取
      if (global.gc) {
        global.gc();
      }
      
      console.log('Memory optimization performed');
    } catch (error) {
      console.error('Memory optimization failed:', error);
    }
  }

  /**
   * 渲染優化
   */
  private optimizeRendering(): void {
    try {
      // 這裡可以實現渲染優化邏輯
      // 例如：減少重新渲染、使用 memo 等
      console.log('Rendering optimization performed');
    } catch (error) {
      console.error('Rendering optimization failed:', error);
    }
  }

  /**
   * 網路優化
   */
  private optimizeNetwork(): void {
    try {
      // 這裡可以實現網路優化邏輯
      // 例如：啟用快取、減少請求頻率等
      console.log('Network optimization performed');
    } catch (error) {
      console.error('Network optimization failed:', error);
    }
  }

  /**
   * 幀率優化
   */
  private optimizeFrameRate(): void {
    try {
      // 這裡可以實現幀率優化邏輯
      // 例如：減少動畫、優化列表渲染等
      console.log('Frame rate optimization performed');
    } catch (error) {
      console.error('Frame rate optimization failed:', error);
    }
  }

  /**
   * 開始渲染計時
   */
  public startRenderTiming(): void {
    this.renderStartTime = Date.now();
  }

  /**
   * 結束渲染計時
   */
  public endRenderTiming(): number {
    if (this.renderStartTime === 0) {
      return 0;
    }
    
    const renderTime = Date.now() - this.renderStartTime;
    this.renderStartTime = 0;
    return renderTime;
  }

  /**
   * 記錄幀
   */
  public recordFrame(): void {
    this.frameCount++;
  }

  /**
   * 獲取當前性能指標
   */
  public getCurrentMetrics(): PerformanceMetrics | null {
    if (this.metricsHistory.length === 0) {
      return null;
    }
    return this.metricsHistory[this.metricsHistory.length - 1];
  }

  /**
   * 獲取性能歷史
   */
  public getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * 獲取平均性能指標
   */
  public getAverageMetrics(count = 10): PerformanceMetrics | null {
    if (this.metricsHistory.length === 0) {
      return null;
    }

    const recentMetrics = this.metricsHistory.slice(-count);
    const sum = recentMetrics.reduce(
      (acc, metrics) => ({
        renderTime: acc.renderTime + metrics.renderTime,
        memoryUsage: acc.memoryUsage + metrics.memoryUsage,
        bundleSize: acc.bundleSize + metrics.bundleSize,
        networkLatency: acc.networkLatency + metrics.networkLatency,
        frameRate: acc.frameRate + metrics.frameRate,
        crashCount: acc.crashCount + metrics.crashCount,
        timestamp: acc.timestamp
      }),
      {
        renderTime: 0,
        memoryUsage: 0,
        bundleSize: 0,
        networkLatency: 0,
        frameRate: 0,
        crashCount: 0,
        timestamp: Date.now()
      }
    );

    const length = recentMetrics.length;
    return {
      renderTime: sum.renderTime / length,
      memoryUsage: sum.memoryUsage / length,
      bundleSize: sum.bundleSize / length,
      networkLatency: sum.networkLatency / length,
      frameRate: sum.frameRate / length,
      crashCount: sum.crashCount / length,
      timestamp: Date.now()
    };
  }

  /**
   * 獲取設備能力
   */
  public getDeviceCapabilities(): DeviceCapabilities | undefined {
    return this.deviceCapabilities;
  }

  /**
   * 載入性能歷史
   */
  private async loadMetricsHistory(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('performance_metrics');
      if (stored) {
        this.metricsHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load metrics history:', error);
    }
  }

  /**
   * 保存性能歷史
   */
  private async saveMetricsHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem('performance_metrics', JSON.stringify(this.metricsHistory));
    } catch (error) {
      console.error('Failed to save metrics history:', error);
    }
  }

  /**
   * 清除性能歷史
   */
  public async clearMetricsHistory(): Promise<void> {
    try {
      this.metricsHistory = [];
      await AsyncStorage.removeItem('performance_metrics');
    } catch (error) {
      console.error('Failed to clear metrics history:', error);
    }
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 重新啟動監控
    if (this.config.enableMonitoring) {
      this.startMonitoring();
    } else {
      this.stopMonitoring();
    }
  }

  /**
   * 獲取配置
   */
  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * 銷毀服務
   */
  public destroy(): void {
    this.stopMonitoring();
  }
}

// 導出單例實例
export const performanceService = PerformanceService.getInstance();