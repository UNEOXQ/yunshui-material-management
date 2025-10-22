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
  severity?: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

interface ErrorServiceConfig {
  endpoint: string;
  maxRetries: number;
  retryDelay: number;
  enableLocalStorage: boolean;
  enableConsoleLog: boolean;
}

class ErrorService {
  private config: ErrorServiceConfig;
  private pendingReports: ErrorReport[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor(config: Partial<ErrorServiceConfig> = {}) {
    this.config = {
      endpoint: '/api/errors',
      maxRetries: 3,
      retryDelay: 1000,
      enableLocalStorage: true,
      enableConsoleLog: true,
      ...config
    };

    this.setupEventListeners();
    this.processPendingReports();
  }

  /**
   * 報告錯誤
   */
  async reportError(error: Error, context?: Record<string, any>): Promise<void> {
    const errorReport: ErrorReport = {
      errorId: this.generateErrorId(),
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      severity: this.determineSeverity(error),
      context
    };

    if (this.config.enableConsoleLog) {
      console.error('Error reported:', errorReport);
    }

    await this.sendErrorReport(errorReport);
  }

  /**
   * 報告 React 錯誤邊界錯誤
   */
  async reportBoundaryError(
    error: Error, 
    errorInfo: { componentStack: string },
    context?: Record<string, any>
  ): Promise<void> {
    const errorReport: ErrorReport = {
      errorId: this.generateErrorId(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      severity: 'high',
      context
    };

    if (this.config.enableConsoleLog) {
      console.error('Boundary error reported:', errorReport);
    }

    await this.sendErrorReport(errorReport);
  }

  /**
   * 報告網路錯誤
   */
  async reportNetworkError(
    url: string, 
    status: number, 
    statusText: string,
    context?: Record<string, any>
  ): Promise<void> {
    const error = new Error(`Network Error: ${status} ${statusText} at ${url}`);
    await this.reportError(error, {
      type: 'network',
      url,
      status,
      statusText,
      ...context
    });
  }

  /**
   * 報告 API 錯誤
   */
  async reportApiError(
    endpoint: string,
    method: string,
    status: number,
    response: any,
    context?: Record<string, any>
  ): Promise<void> {
    const error = new Error(`API Error: ${method} ${endpoint} returned ${status}`);
    await this.reportError(error, {
      type: 'api',
      endpoint,
      method,
      status,
      response,
      ...context
    });
  }

  /**
   * 報告用戶操作錯誤
   */
  async reportUserError(
    action: string,
    error: Error,
    context?: Record<string, any>
  ): Promise<void> {
    await this.reportError(error, {
      type: 'user_action',
      action,
      ...context
    });
  }

  /**
   * 發送錯誤報告
   */
  private async sendErrorReport(errorReport: ErrorReport): Promise<void> {
    if (!this.isOnline) {
      this.storePendingReport(errorReport);
      return;
    }

    try {
      const response = await fetch(`${this.config.endpoint}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(errorReport)
      });

      if (!response.ok) {
        throw new Error(`Failed to send error report: ${response.status}`);
      }

      const result = await response.json();
      if (this.config.enableConsoleLog) {
        console.log('Error report sent successfully:', result);
      }
    } catch (sendError) {
      console.warn('Failed to send error report:', sendError);
      
      // 嘗試使用 beacon API 作為備用
      await this.sendErrorBeacon(errorReport);
      
      // 儲存到本地以便稍後重試
      this.storePendingReport(errorReport);
    }
  }

  /**
   * 使用 Beacon API 發送錯誤報告
   */
  private async sendErrorBeacon(errorReport: ErrorReport): Promise<void> {
    if ('navigator' in window && 'sendBeacon' in navigator) {
      try {
        const success = navigator.sendBeacon(
          `${this.config.endpoint}/beacon`,
          JSON.stringify({
            errorId: errorReport.errorId,
            message: errorReport.message,
            timestamp: errorReport.timestamp,
            url: errorReport.url
          })
        );

        if (this.config.enableConsoleLog) {
          console.log('Error beacon sent:', success);
        }
      } catch (beaconError) {
        console.warn('Failed to send error beacon:', beaconError);
      }
    }
  }

  /**
   * 儲存待處理的錯誤報告
   */
  private storePendingReport(errorReport: ErrorReport): void {
    this.pendingReports.push(errorReport);

    if (this.config.enableLocalStorage) {
      try {
        const stored = localStorage.getItem('pendingErrorReports');
        const reports = stored ? JSON.parse(stored) : [];
        reports.push(errorReport);
        
        // 限制儲存的報告數量
        const maxStored = 50;
        if (reports.length > maxStored) {
          reports.splice(0, reports.length - maxStored);
        }
        
        localStorage.setItem('pendingErrorReports', JSON.stringify(reports));
      } catch (storageError) {
        console.warn('Failed to store pending error report:', storageError);
      }
    }
  }

  /**
   * 處理待處理的錯誤報告
   */
  private async processPendingReports(): Promise<void> {
    if (!this.isOnline) return;

    // 處理記憶體中的待處理報告
    const memoryReports = [...this.pendingReports];
    this.pendingReports = [];

    // 處理本地儲存的待處理報告
    let storageReports: ErrorReport[] = [];
    if (this.config.enableLocalStorage) {
      try {
        const stored = localStorage.getItem('pendingErrorReports');
        if (stored) {
          storageReports = JSON.parse(stored);
          localStorage.removeItem('pendingErrorReports');
        }
      } catch (error) {
        console.warn('Failed to retrieve pending error reports:', error);
      }
    }

    const allPendingReports = [...memoryReports, ...storageReports];

    for (const report of allPendingReports) {
      try {
        await this.sendErrorReport(report);
        // 添加延遲以避免過多的並發請求
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn('Failed to send pending error report:', error);
        // 如果仍然失敗，重新加入待處理列表
        this.storePendingReport(report);
      }
    }
  }

  /**
   * 設定事件監聽器
   */
  private setupEventListeners(): void {
    // 監聽網路狀態變化
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPendingReports();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // 監聽頁面卸載，發送待處理的報告
    window.addEventListener('beforeunload', () => {
      if (this.pendingReports.length > 0) {
        // 使用 beacon API 發送最後的報告
        this.pendingReports.forEach(report => {
          this.sendErrorBeacon(report);
        });
      }
    });

    // 監聽未處理的 Promise 拒絕
    window.addEventListener('unhandledrejection', (event) => {
      const error = new Error(`Unhandled Promise Rejection: ${event.reason}`);
      this.reportError(error, {
        type: 'unhandled_rejection',
        reason: event.reason
      });
    });

    // 監聽全域錯誤
    window.addEventListener('error', (event) => {
      const error = new Error(event.message);
      error.stack = `${event.filename}:${event.lineno}:${event.colno}`;
      
      this.reportError(error, {
        type: 'global_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  }

  /**
   * 生成錯誤 ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 獲取用戶 ID
   */
  private getUserId(): string | undefined {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id;
      }
    } catch (error) {
      console.warn('Failed to get user ID:', error);
    }
    return undefined;
  }

  /**
   * 獲取會話 ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * 判斷錯誤嚴重程度
   */
  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();
    
    if (message.includes('chunkloa') || message.includes('loading chunk')) {
      return 'medium';
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'medium';
    }
    
    if (message.includes('typeerror') || message.includes('referenceerror')) {
      return 'high';
    }
    
    if (message.includes('internal server error') || message.includes('database')) {
      return 'critical';
    }
    
    return 'low';
  }

  /**
   * 清除所有待處理的錯誤報告
   */
  clearPendingReports(): void {
    this.pendingReports = [];
    if (this.config.enableLocalStorage) {
      localStorage.removeItem('pendingErrorReports');
    }
  }

  /**
   * 獲取待處理的錯誤報告數量
   */
  getPendingReportsCount(): number {
    return this.pendingReports.length;
  }
}

// 創建全域錯誤服務實例
export const errorService = new ErrorService();

// 導出類型和服務
export { ErrorService };
export type { ErrorReport };
export default errorService;