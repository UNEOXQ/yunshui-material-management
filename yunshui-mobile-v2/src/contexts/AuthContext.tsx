import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User, AuthState } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshToken: () => Promise<void>;
  checkAutoLogin: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const isLoggedIn = await authService.checkAutoLogin();
      
      if (isLoggedIn) {
        const currentAuthState = authService.getAuthState();
        setAuthState(currentAuthState);
      }
    } catch (error) {
      console.error('初始化認證失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const loginResponse = await authService.login({ username, password });
      
      if (loginResponse) {
        const currentAuthState = authService.getAuthState();
        setAuthState(currentAuthState);
        return true;
      }
      return false;
    } catch (error) {
      console.error('登入失敗:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null
      });
    } catch (error) {
      console.error('登出失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      await authService.refreshToken();
      const currentAuthState = authService.getAuthState();
      setAuthState(currentAuthState);
    } catch (error) {
      console.error('Token 刷新失敗:', error);
      // Token 刷新失敗，清除認證狀態
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null
      });
    }
  };

  const checkAutoLogin = async (): Promise<boolean> => {
    try {
      const isLoggedIn = await authService.checkAutoLogin();
      if (isLoggedIn) {
        const currentAuthState = authService.getAuthState();
        setAuthState(currentAuthState);
      }
      return isLoggedIn;
    } catch (error) {
      console.error('自動登入檢查失敗:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user: authState.user,
        token: authState.token,
        isAuthenticated: authState.isAuthenticated,
        login,
        logout,
        refreshToken,
        checkAutoLogin,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};