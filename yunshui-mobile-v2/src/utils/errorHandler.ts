import { ErrorType } from '../components/common/ErrorDisplay';
import { toastManager, ToastType } from '../components/common/Toast';

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: any;
}

export class ErrorHandler {
  // 錯誤碼映射
  private static errorCodeMap: Record<string, { type: ErrorType; message: string }> = {
    // 網路錯誤
    'NETWORK_ERROR': {
      type: ErrorType.NETWORK,
      message: '網路連線異常，請檢查網路設定',
    },
    'TIMEOUT_ERROR': {
      type: ErrorType.NETWORK,
      message: '請求超時，請稍後再試',
    },
    'CONNECTION_ERROR': {
      type: ErrorType.NETWORK,
      message: '無法連接到伺服器',
    },

    // 認證錯誤
    'UNAUTHORIZED': {
      type: ErrorType.AUTHENTICATION,
      message: '登入已過期，請重新登入',
    },
    'INVALID_CREDENTIALS': {
      type: ErrorType.AUTHENTICATION,
      message: '用戶名或密碼錯誤',
    },
    'TOKEN_EXPIRED': {
      type: ErrorType.AUTHENTICATION,
      message: '登入已過期，請重新登入',
    },

    // 權限錯誤
    'FORBIDDEN': {
      type: ErrorType.PERMISSION,
      message: '您沒有執行此操作的權限',
    },
    'ACCESS_DENIED': {
      type: ErrorType.PERMISSION,
      message: '存取被拒絕',
    },

    // 驗證錯誤
    'VALIDATION_ERROR': {
      type: ErrorType.VALIDATION,
      message: '資料格式錯誤，請檢查輸入',
    },
    'INVALID_INPUT': {
      type: ErrorType.VALIDATION,
      message: '輸入的資料無效',
    },
    'REQUIRED_FIELD': {
      type: ErrorType.VALIDATION,
      message: '請填寫必填欄位',
    },

    // 資源錯誤
    'NOT_FOUND': {
      type: ErrorType.NOT_FOUND,
      message: '找不到請求的資源',
    },
    'RESOURCE_NOT_FOUND': {
      type: ErrorType.NOT_FOUND,
      message: '資源不存在或已被刪除',
    },

    // 伺服器錯誤
    'INTERNAL_SERVER_ERROR': {
      type: ErrorType.SERVER,
      message: '伺服器內部錯誤，請稍後再試',
    },
    'SERVICE_UNAVAILABLE': {
      type: ErrorType.SERVER,
      message: '服務暫時無法使用，請稍後再試',
    },
    'DATABASE_ERROR': {
      type: ErrorType.SERVER,
      message: '資料庫錯誤，請稍後再試',
    },
  };

  // HTTP 狀態碼映射
  private static statusCodeMap: Record<number, { type: ErrorType; message: string }> = {
    400: {
      type: ErrorType.VALIDATION,
      message: '請求格式錯誤',
    },
    401: {
      type: ErrorType.AUTHENTICATION,
      message: '未授權，請重新登入',
    },
    403: {
      type: ErrorType.PERMISSION,
      message: '權限不足',
    },
    404: {
      type: ErrorType.NOT_FOUND,
      message: '找不到請求的資源',
    },
    408: {
      type: ErrorType.NETWORK,
      message: '請求超時',
    },
    429: {
      type: ErrorType.SERVER,
      message: '請求過於頻繁，請稍後再試',
    },
    500: {
      type: ErrorType.SERVER,
      message: '伺服器內部錯誤',
    },
    502: {
      type: ErrorType.SERVER,
      message: '伺服器網關錯誤',
    },
    503: {
      type: ErrorType.SERVER,
      message: '服務暫時無法使用',
    },
    504: {
      type: ErrorType.SERVER,
      message: '伺服器網關超時',
    },
  };

  // 處理 API 錯誤
  static handleApiError(error: any): { type: ErrorType; message: string; originalError: any } {
    console.error('API Error:', error);

    // 網路錯誤
    if (!error.response) {
      return {
        type: ErrorType.NETWORK,
        message: this.errorCodeMap.NETWORK_ERROR.message,
        originalError: error,
      };
    }

    const { status, data } = error.response;

    // 檢查錯誤碼
    if (data?.code && this.errorCodeMap[data.code]) {
      const errorInfo = this.errorCodeMap[data.code];
      return {
        type: errorInfo.type,
        message: data.message || errorInfo.message,
        originalError: error,
      };
    }

    // 檢查 HTTP 狀態碼
    if (this.statusCodeMap[status]) {
      const errorInfo = this.statusCodeMap[status];
      return {
        type: errorInfo.type,
        message: data?.message || errorInfo.message,
        originalError: error,
      };
    }

    // 預設錯誤
    return {
      type: ErrorType.UNKNOWN,
      message: data?.message || '發生未知錯誤，請稍後再試',
      originalError: error,
    };
  }

  // 顯示錯誤訊息
  static showError(error: any, showToast: boolean = true): { type: ErrorType; message: string } {
    const errorInfo = this.handleApiError(error);

    if (showToast) {
      toastManager.error(errorInfo.message);
    }

    return errorInfo;
  }

  // 顯示成功訊息
  static showSuccess(message: string) {
    toastManager.success(message);
  }

  // 顯示警告訊息
  static showWarning(message: string) {
    toastManager.warning(message);
  }

  // 顯示資訊訊息
  static showInfo(message: string) {
    toastManager.info(message);
  }

  // 處理表單驗證錯誤
  static handleValidationError(errors: Record<string, string[]>): string {
    const firstError = Object.values(errors)[0];
    return firstError?.[0] || '表單驗證失敗';
  }

  // 檢查是否為網路錯誤
  static isNetworkError(error: any): boolean {
    return !error.response || error.code === 'NETWORK_ERROR';
  }

  // 檢查是否為認證錯誤
  static isAuthError(error: any): boolean {
    const status = error.response?.status;
    return status === 401 || error.code === 'UNAUTHORIZED' || error.code === 'TOKEN_EXPIRED';
  }

  // 檢查是否為權限錯誤
  static isPermissionError(error: any): boolean {
    const status = error.response?.status;
    return status === 403 || error.code === 'FORBIDDEN';
  }

  // 記錄錯誤到外部服務 (如 Crashlytics)
  static logError(error: any, context?: string) {
    const errorInfo = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    };

    console.error('Error logged:', errorInfo);

    // 這裡可以整合外部錯誤追蹤服務
    // 例如: Crashlytics.recordError(error);
  }

  // 創建自定義錯誤
  static createError(code: string, message: string, details?: any): ApiError {
    return {
      code,
      message,
      details,
    };
  }

  // 重試機制
  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // 如果是認證錯誤或權限錯誤，不重試
        if (this.isAuthError(error) || this.isPermissionError(error)) {
          throw error;
        }

        // 最後一次重試失敗
        if (i === maxRetries - 1) {
          throw error;
        }

        // 等待後重試
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }

    throw lastError;
  }
}

// 全域錯誤處理器
export const setupGlobalErrorHandler = () => {
  // 處理未捕獲的 Promise 拒絕
  const originalHandler = global.onunhandledrejection;
  global.onunhandledrejection = (event) => {
    ErrorHandler.logError(event.reason, 'Unhandled Promise Rejection');
    originalHandler?.(event);
  };

  // 處理 JavaScript 錯誤
  const originalErrorHandler = global.ErrorUtils?.setGlobalHandler;
  if (originalErrorHandler) {
    originalErrorHandler((error, isFatal) => {
      ErrorHandler.logError(error, isFatal ? 'Fatal Error' : 'Non-Fatal Error');
    });
  }
};