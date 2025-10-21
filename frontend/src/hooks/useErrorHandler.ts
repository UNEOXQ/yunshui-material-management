import { useCallback, useEffect, useState } from 'react';
import { errorService } from '../services/errorService';

interface UseErrorHandlerOptions {
  enableGlobalErrorHandling?: boolean;
  enableNetworkErrorHandling?: boolean;
  onError?: (error: Error, context?: Record<string, any>) => void;
}

interface UseErrorHandlerReturn {
  reportError: (error: Error, context?: Record<string, any>) => Promise<void>;
  reportNetworkError: (url: string, status: number, statusText: string, context?: Record<string, any>) => Promise<void>;
  reportApiError: (endpoint: string, method: string, status: number, response: any, context?: Record<string, any>) => Promise<void>;
  reportUserError: (action: string, error: Error, context?: Record<string, any>) => Promise<void>;
  clearErrors: () => void;
  pendingReportsCount: number;
  hasErrors: boolean;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn => {
  const {
    enableGlobalErrorHandling = true,
    enableNetworkErrorHandling = true,
    onError
  } = options;

  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [hasErrors, setHasErrors] = useState(false);

  // 報告錯誤的回調函數
  const reportError = useCallback(async (error: Error, context?: Record<string, any>) => {
    try {
      await errorService.reportError(error, context);
      onError?.(error, context);
      setHasErrors(true);
      updatePendingCount();
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }, [onError]);

  // 報告網路錯誤
  const reportNetworkError = useCallback(async (
    url: string, 
    status: number, 
    statusText: string, 
    context?: Record<string, any>
  ) => {
    try {
      await errorService.reportNetworkError(url, status, statusText, context);
      setHasErrors(true);
      updatePendingCount();
    } catch (reportingError) {
      console.error('Failed to report network error:', reportingError);
    }
  }, []);

  // 報告 API 錯誤
  const reportApiError = useCallback(async (
    endpoint: string,
    method: string,
    status: number,
    response: any,
    context?: Record<string, any>
  ) => {
    try {
      await errorService.reportApiError(endpoint, method, status, response, context);
      setHasErrors(true);
      updatePendingCount();
    } catch (reportingError) {
      console.error('Failed to report API error:', reportingError);
    }
  }, []);

  // 報告用戶操作錯誤
  const reportUserError = useCallback(async (
    action: string,
    error: Error,
    context?: Record<string, any>
  ) => {
    try {
      await errorService.reportUserError(action, error, context);
      setHasErrors(true);
      updatePendingCount();
    } catch (reportingError) {
      console.error('Failed to report user error:', reportingError);
    }
  }, []);

  // 清除錯誤
  const clearErrors = useCallback(() => {
    errorService.clearPendingReports();
    setHasErrors(false);
    setPendingReportsCount(0);
  }, []);

  // 更新待處理報告數量
  const updatePendingCount = useCallback(() => {
    const count = errorService.getPendingReportsCount();
    setPendingReportsCount(count);
  }, []);

  // 設定全域錯誤處理
  useEffect(() => {
    if (!enableGlobalErrorHandling) return;

    const handleGlobalError = (event: ErrorEvent) => {
      const error = new Error(event.message);
      error.stack = `${event.filename}:${event.lineno}:${event.colno}`;
      
      reportError(error, {
        type: 'global_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(`Unhandled Promise Rejection: ${event.reason}`);
      reportError(error, {
        type: 'unhandled_rejection',
        reason: event.reason
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [enableGlobalErrorHandling, reportError]);

  // 設定網路錯誤處理
  useEffect(() => {
    if (!enableNetworkErrorHandling) return;

    // 攔截 fetch 請求以捕獲網路錯誤
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // 檢查 HTTP 錯誤狀態
        if (!response.ok) {
          const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
          await reportNetworkError(url, response.status, response.statusText, {
            requestArgs: args
          });
        }
        
        return response;
      } catch (error) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
        await reportError(error as Error, {
          type: 'fetch_error',
          url,
          requestArgs: args
        });
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [enableNetworkErrorHandling, reportError, reportNetworkError]);

  // 定期更新待處理報告數量
  useEffect(() => {
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  return {
    reportError,
    reportNetworkError,
    reportApiError,
    reportUserError,
    clearErrors,
    pendingReportsCount,
    hasErrors
  };
};

// 創建一個簡化的錯誤處理 Hook
export const useSimpleErrorHandler = () => {
  const { reportError } = useErrorHandler();
  
  return useCallback((error: Error | string, context?: Record<string, any>) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    reportError(errorObj, context);
  }, [reportError]);
};

// 創建一個用於 API 調用的錯誤處理 Hook
export const useApiErrorHandler = () => {
  const { reportApiError } = useErrorHandler();
  
  return useCallback(async (apiCall: () => Promise<any>, context?: Record<string, any>) => {
    try {
      return await apiCall();
    } catch (error: any) {
      if (error.response) {
        // HTTP 錯誤回應
        await reportApiError(
          error.config?.url || 'unknown',
          error.config?.method || 'unknown',
          error.response.status,
          error.response.data,
          context
        );
      } else if (error.request) {
        // 網路錯誤
        const networkError = new Error(`Network error: ${error.message}`);
        await reportApiError(
          error.config?.url || 'unknown',
          error.config?.method || 'unknown',
          0,
          null,
          { ...context, type: 'network_error' }
        );
      } else {
        // 其他錯誤
        await reportApiError(
          'unknown',
          'unknown',
          0,
          null,
          { ...context, type: 'unknown_error', message: error.message }
        );
      }
      throw error;
    }
  }, [reportApiError]);
};

export default useErrorHandler;