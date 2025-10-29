import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { StorageService } from '../utils/storage';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export class ApiService {
  private static instance: ApiService;
  private baseURL: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];

  private constructor() {
    // 使用環境變數或預設值
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3004';
    this.initializeTokens();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async initializeTokens(): Promise<void> {
    try {
      const { accessToken, refreshToken } = await StorageService.getAuthTokens();
      this.token = accessToken;
      this.refreshToken = refreshToken;
    } catch (error) {
      console.error('Failed to initialize tokens:', error);
    }
  }

  public setAuthTokens(accessToken: string, refreshToken: string): void {
    this.token = accessToken;
    this.refreshToken = refreshToken;
    
    // 儲存到安全儲存
    StorageService.setAuthTokens(accessToken, refreshToken);
  }

  public async clearAuthTokens(): Promise<void> {
    this.token = null;
    this.refreshToken = null;
    
    await StorageService.clearAuthTokens();
  }

  public getAuthToken(): string | null {
    return this.token;
  }

  private async checkNetworkConnection(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }

  private async processFailedQueue(error: any, token: string | null = null): Promise<void> {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.isRefreshing) {
      // 如果正在刷新，等待刷新完成
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.isRefreshing = true;

    try {
      const response = await this.request('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: this.refreshToken }
      }, false); // 不自動重試，避免無限循環

      const { token } = response.data;
      this.token = token;
      await StorageService.setSecureItem('access_token', token);

      this.processFailedQueue(null, token);
      return token;
    } catch (error) {
      this.processFailedQueue(error, null);
      await this.clearAuthTokens();
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  public async request<T = any>(
    endpoint: string, 
    options: RequestOptions = {},
    shouldRetry: boolean = true
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 10000
    } = options;

    // 檢查網路連線
    const isConnected = await this.checkNetworkConnection();
    if (!isConnected) {
      throw new Error('NETWORK_ERROR');
    }

    const url = `${this.baseURL}${endpoint}`;
    
    // 準備請求標頭
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    // 添加認證標頭
    if (this.token) {
      requestHeaders.Authorization = `Bearer ${this.token}`;
    }

    // 準備請求選項
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(timeout)
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchOptions);
      
      // 處理 401 錯誤（Token 過期）
      if (response.status === 401 && shouldRetry && this.refreshToken) {
        try {
          await this.refreshAccessToken();
          // 重新發送請求
          requestHeaders.Authorization = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers: requestHeaders
          });
          
          if (!retryResponse.ok) {
            throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
          }
          
          return await retryResponse.json();
        } catch (refreshError) {
          // Token 刷新失敗，清除認證資訊
          await this.clearAuthTokens();
          throw new Error('UNAUTHORIZED');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('REQUEST_TIMEOUT');
      }
      
      if (error.message === 'Network request failed') {
        throw new Error('NETWORK_ERROR');
      }
      
      throw error;
    }
  }

  // 重試機制
  public async requestWithRetry<T = any>(
    endpoint: string,
    options: RequestOptions = {},
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<ApiResponse<T>> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.request<T>(endpoint, options);
      } catch (error: any) {
        lastError = error;
        
        // 不重試的錯誤類型
        if (error.message === 'UNAUTHORIZED' || error.message === 'VALIDATION_ERROR') {
          throw error;
        }
        
        // 最後一次嘗試
        if (attempt === maxRetries) {
          break;
        }
        
        // 等待後重試
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }

    throw lastError!;
  }

  // GET 請求
  public async get<T = any>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, { method: 'GET', headers });
  }

  // POST 請求
  public async post<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, { method: 'POST', body, headers });
  }

  // PUT 請求
  public async put<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, { method: 'PUT', body, headers });
  }

  // DELETE 請求
  public async delete<T = any>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, { method: 'DELETE', headers });
  }

  // PATCH 請求
  public async patch<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, { method: 'PATCH', body, headers });
  }
}

// 導出單例實例
export const apiService = ApiService.getInstance();