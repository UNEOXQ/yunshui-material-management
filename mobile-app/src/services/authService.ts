import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, ApiResponse } from './api';
import { StorageService } from '../utils/storage';

// 類型定義
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'PM' | 'AM' | 'WAREHOUSE';
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
}

export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null
  };

  private constructor() {
    this.initializeAuthState();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * 初始化認證狀態
   */
  private async initializeAuthState(): Promise<void> {
    try {
      const { accessToken, refreshToken } = await StorageService.getAuthTokens();
      const userJson = await StorageService.getItem('user_data');

      if (accessToken && refreshToken && userJson) {
        const user = JSON.parse(userJson);
        this.authState = {
          isAuthenticated: true,
          user,
          token: accessToken,
          refreshToken
        };
        
        // 設置 API 服務的認證 token
        apiService.setAuthTokens(accessToken, refreshToken);
      }
    } catch (error) {
      console.error('Failed to initialize auth state:', error);
      await this.clearAuthState();
    }
  }

  /**
   * 用戶登入
   */
  public async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response: ApiResponse<LoginResponse> = await apiService.post('/api/auth/login', credentials);
      
      if (!response.success) {
        throw new Error(response.error || 'Login failed');
      }

      const { user, token, refreshToken } = response.data;

      // 更新認證狀態
      this.authState = {
        isAuthenticated: true,
        user,
        token,
        refreshToken
      };

      // 儲存認證資訊 - 使用安全儲存
      await Promise.all([
        StorageService.setAuthTokens(token, refreshToken),
        StorageService.setObject('user_data', user)
      ]);

      // 設置 API 服務的認證 token
      apiService.setAuthTokens(token, refreshToken);

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 用戶登出
   */
  public async logout(): Promise<void> {
    try {
      // 嘗試呼叫後端登出 API
      if (this.authState.token) {
        await apiService.post('/api/auth/logout');
      }
    } catch (error) {
      // 即使後端登出失敗，也要清除本地狀態
      console.warn('Backend logout failed:', error);
    } finally {
      await this.clearAuthState();
    }
  }

  /**
   * 清除認證狀態
   */
  private async clearAuthState(): Promise<void> {
    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null
    };

    await Promise.all([
      StorageService.clearAuthTokens(),
      StorageService.removeItem('user_data')
    ]);

    await apiService.clearAuthTokens();
  }

  /**
   * 刷新 Access Token
   */
  public async refreshToken(): Promise<string> {
    try {
      if (!this.authState.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response: ApiResponse<{ token: string }> = await apiService.post('/api/auth/refresh', {
        refreshToken: this.authState.refreshToken
      });

      if (!response.success) {
        throw new Error(response.error || 'Token refresh failed');
      }

      const { token } = response.data;

      // 更新認證狀態
      this.authState.token = token;
      await StorageService.setSecureItem('access_token', token);

      return token;
    } catch (error: any) {
      console.error('Token refresh error:', error);
      // Token 刷新失敗，清除認證狀態
      await this.clearAuthState();
      throw new Error('Session expired. Please login again.');
    }
  }

  /**
   * 獲取用戶資料
   */
  public async getProfile(): Promise<User> {
    try {
      const response: ApiResponse<User> = await apiService.get('/api/auth/profile');
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to get profile');
      }

      // 更新本地用戶資料
      this.authState.user = response.data;
      await StorageService.setObject('user_data', response.data);

      return response.data;
    } catch (error: any) {
      console.error('Get profile error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 驗證 Token
   */
  public async validateToken(): Promise<boolean> {
    try {
      if (!this.authState.token) {
        return false;
      }

      const response: ApiResponse<{ valid: boolean }> = await apiService.post('/api/auth/validate');
      return response.success && response.data.valid;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * 檢查是否已登入
   */
  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated && !!this.authState.token;
  }

  /**
   * 獲取當前用戶
   */
  public getCurrentUser(): User | null {
    return this.authState.user;
  }

  /**
   * 獲取當前 Token
   */
  public getToken(): string | null {
    return this.authState.token;
  }

  /**
   * 獲取認證狀態
   */
  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * 檢查用戶權限
   */
  public hasRole(role: string): boolean {
    return this.authState.user?.role === role;
  }

  /**
   * 檢查是否為管理員
   */
  public isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * 自動登入檢查
   */
  public async checkAutoLogin(): Promise<boolean> {
    try {
      await this.initializeAuthState();
      
      if (this.isAuthenticated()) {
        // 驗證 token 是否仍然有效
        const isValid = await this.validateToken();
        if (isValid) {
          return true;
        } else {
          // Token 無效，嘗試刷新
          try {
            await this.refreshToken();
            return true;
          } catch (error) {
            // 刷新失敗，清除狀態
            await this.clearAuthState();
            return false;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Auto login check failed:', error);
      await this.clearAuthState();
      return false;
    }
  }

  /**
   * 錯誤訊息處理
   */
  private getErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.message) {
      switch (error.message) {
        case 'NETWORK_ERROR':
          return '網路連線異常，請檢查網路設定';
        case 'UNAUTHORIZED':
          return '登入已過期，請重新登入';
        case 'REQUEST_TIMEOUT':
          return '請求逾時，請稍後再試';
        default:
          return error.message;
      }
    }
    
    return '系統發生錯誤，請稍後再試';
  }

  /**
   * 監聽認證狀態變化
   */
  public onAuthStateChanged(callback: (authState: AuthState) => void): () => void {
    // 這裡可以實作狀態變化監聽器
    // 返回取消監聽的函數
    return () => {};
  }
}

// 導出單例實例
export const authService = AuthService.getInstance();