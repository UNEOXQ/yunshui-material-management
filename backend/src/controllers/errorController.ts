import { Request, Response } from 'express';
import { ErrorLogger, HealthCheckError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';

interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
}

interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByUser: Record<string, number>;
  recentErrors: ErrorReport[];
}

export class ErrorController {
  private static errorStore: ErrorReport[] = [];
  private static readonly MAX_STORED_ERRORS = 1000;

  /**
   * 接收前端錯誤報告
   */
  static async reportError(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errorReport: ErrorReport = {
        errorId: req.body.errorId,
        message: req.body.message,
        stack: req.body.stack,
        componentStack: req.body.componentStack,
        timestamp: req.body.timestamp || new Date().toISOString(),
        url: req.body.url,
        userAgent: req.body.userAgent,
        userId: (req.user as any)?.id || req.body.userId,
        sessionId: req.body.sessionId
      };

      // 驗證必要欄位
      if (!errorReport.errorId || !errorReport.message) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Error ID and message are required'
        });
        return;
      }

      // 儲存錯誤報告
      this.storeError(errorReport);

      // 記錄錯誤
      await ErrorLogger.logError(new Error(errorReport.message), {
        errorId: errorReport.errorId,
        userId: errorReport.userId,
        sessionId: errorReport.sessionId,
        url: errorReport.url,
        userAgent: errorReport.userAgent,
        componentStack: errorReport.componentStack
      });

      // 檢查是否為關鍵錯誤
      if (this.isCriticalError(errorReport)) {
        await this.handleCriticalError(errorReport);
      }

      res.status(200).json({
        success: true,
        message: 'Error report received',
        errorId: errorReport.errorId
      });
    } catch (error) {
      console.error('Failed to process error report:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process error report'
      });
    }
  }

  /**
   * 接收 beacon 錯誤報告（簡化版）
   */
  static async reportErrorBeacon(_req: Request, res: Response): Promise<void> {
    try {
      const errorData = _req.body;
      
      // 簡化的錯誤記錄
      console.error('Beacon error report:', {
        errorId: errorData.errorId,
        message: errorData.message,
        timestamp: errorData.timestamp,
        url: errorData.url
      });

      res.status(204).send(); // No Content
    } catch (error) {
      console.error('Failed to process beacon error report:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process beacon error report'
      });
    }
  }

  /**
   * 健康檢查端點
   */
  static async healthCheck(_req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      };

      // 檢查各種服務狀態
      const checks = await Promise.allSettled([
        this.checkDatabase(),
        this.checkFileSystem(),
        this.checkMemoryUsage()
      ]);

      const failedChecks = checks
        .map((result, index) => ({ result, index }))
        .filter(({ result }) => result.status === 'rejected')
        .map(({ result, index }) => ({
          service: ['database', 'filesystem', 'memory'][index],
          error: result.status === 'rejected' ? result.reason.message : 'Unknown error'
        }));

      if (failedChecks.length > 0) {
        res.status(503).json({
          ...healthStatus,
          status: 'unhealthy',
          failedChecks
        });
        return;
      }

      res.status(200).json(healthStatus);
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      });
    }
  }

  /**
   * 獲取錯誤統計（僅管理員）
   */
  static async getErrorStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // 檢查管理員權限
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Only administrators can view error statistics'
        });
        return;
      }

      const stats = this.calculateErrorStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Failed to get error stats:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve error statistics'
      });
    }
  }

  /**
   * 儲存錯誤報告
   */
  private static storeError(errorReport: ErrorReport): void {
    this.errorStore.push(errorReport);
    
    // 保持儲存的錯誤數量在限制內
    if (this.errorStore.length > this.MAX_STORED_ERRORS) {
      this.errorStore = this.errorStore.slice(-this.MAX_STORED_ERRORS);
    }
  }

  /**
   * 檢查是否為關鍵錯誤
   */
  private static isCriticalError(errorReport: ErrorReport): boolean {
    const criticalKeywords = [
      'ChunkLoadError',
      'Network Error',
      'Internal Server Error',
      'Database',
      'Authentication',
      'Authorization'
    ];

    return criticalKeywords.some(keyword => 
      errorReport.message.includes(keyword)
    );
  }

  /**
   * 處理關鍵錯誤
   */
  private static async handleCriticalError(errorReport: ErrorReport): Promise<void> {
    console.error('CRITICAL ERROR DETECTED:', errorReport);
    
    // 在這裡可以實作：
    // 1. 發送緊急通知給開發團隊
    // 2. 自動創建 issue 到 bug tracking 系統
    // 3. 觸發自動修復流程
    
    // 範例：記錄到特殊的關鍵錯誤日誌
    await ErrorLogger.logError(new Error(`CRITICAL: ${errorReport.message}`), {
      ...errorReport,
      severity: 'critical'
    });
  }

  /**
   * 計算錯誤統計
   */
  private static calculateErrorStats(): ErrorStats {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentErrors = this.errorStore.filter(
      error => new Date(error.timestamp) > last24Hours
    );

    const errorsByType: Record<string, number> = {};
    const errorsByUser: Record<string, number> = {};

    recentErrors.forEach(error => {
      // 統計錯誤類型
      const errorType = this.categorizeError(error.message);
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;

      // 統計用戶錯誤
      if (error.userId) {
        errorsByUser[error.userId] = (errorsByUser[error.userId] || 0) + 1;
      }
    });

    return {
      totalErrors: recentErrors.length,
      errorsByType,
      errorsByUser,
      recentErrors: recentErrors.slice(-10) // 最近 10 個錯誤
    };
  }

  /**
   * 分類錯誤類型
   */
  private static categorizeError(message: string): string {
    if (message.includes('ChunkLoadError') || message.includes('Loading chunk')) {
      return 'Chunk Load Error';
    }
    if (message.includes('Network') || message.includes('fetch')) {
      return 'Network Error';
    }
    if (message.includes('TypeError')) {
      return 'Type Error';
    }
    if (message.includes('ReferenceError')) {
      return 'Reference Error';
    }
    if (message.includes('SyntaxError')) {
      return 'Syntax Error';
    }
    return 'Other Error';
  }

  /**
   * 檢查資料庫連線
   */
  private static async checkDatabase(): Promise<void> {
    // 這裡應該實作實際的資料庫連線檢查
    // 例如執行一個簡單的查詢
    try {
      // 模擬資料庫檢查
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 如果資料庫連線失敗，拋出錯誤
      // throw new HealthCheckError('database', { message: 'Connection timeout' });
    } catch (error: any) {
      throw new HealthCheckError('database', { error: error.message });
    }
  }

  /**
   * 檢查檔案系統
   */
  private static async checkFileSystem(): Promise<void> {
    try {
      const fs = require('fs').promises;
      await fs.access('./');
    } catch (error: any) {
      throw new HealthCheckError('filesystem', { error: error.message });
    }
  }

  /**
   * 檢查記憶體使用量
   */
  private static async checkMemoryUsage(): Promise<void> {
    const memoryUsage = process.memoryUsage();
    const maxMemory = 1024 * 1024 * 1024; // 1GB
    
    if (memoryUsage.heapUsed > maxMemory) {
      throw new HealthCheckError('memory', { 
        heapUsed: memoryUsage.heapUsed,
        maxMemory 
      });
    }
  }
}