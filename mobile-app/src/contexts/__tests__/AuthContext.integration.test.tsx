import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../../utils/storage';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native-keychain');

describe('AuthContext Integration Tests', () => {
  const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    role: 'ADMIN' as const,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockTokens = {
    token: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset storage mocks
    (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    
    // Reset auth service
    authService.logout();
  });

  describe('AuthProvider Initialization', () => {
    it('should initialize with unauthenticated state when no stored data', async () => {
      // Mock no stored data
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      jest.spyOn(StorageService, 'getAuthTokens').mockResolvedValue({
        accessToken: null,
        refreshToken: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);

      // Wait for initialization to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it('should initialize with authenticated state when valid stored data exists', async () => {
      // Mock stored user data
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'user_data') {
          return Promise.resolve(JSON.stringify(mockUser));
        }
        return Promise.resolve(null);
      });

      jest.spyOn(StorageService, 'getAuthTokens').mockResolvedValue({
        accessToken: mockTokens.token,
        refreshToken: mockTokens.refreshToken,
      });

      // Mock token validation
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { valid: true },
        }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for initialization to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockTokens.token);
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock storage error
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initialization to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });

  describe('Login Integration', () => {
    it('should successfully login and update context state', async () => {
      // Mock successful login API
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: mockUser,
            ...mockTokens,
          },
        }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Execute login
      let loginResult: boolean;
      await act(async () => {
        loginResult = await result.current.login('testuser', 'password123');
      });

      expect(loginResult!).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockTokens.token);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle login failure and maintain unauthenticated state', async () => {
      // Mock failed login API
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          message: 'Invalid credentials',
        }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Execute login
      let loginResult: boolean;
      await act(async () => {
        loginResult = await result.current.login('testuser', 'wrongpassword');
      });

      expect(loginResult!).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should show loading state during login', async () => {
      // Mock delayed login API
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              data: {
                user: mockUser,
                ...mockTokens,
              },
            }),
          }), 100)
        )
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start login
      act(() => {
        result.current.login('testuser', 'password123');
      });

      // Should show loading state
      expect(result.current.isLoading).toBe(true);

      // Wait for login to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Logout Integration', () => {
    beforeEach(async () => {
      // Setup authenticated state
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: mockUser,
            ...mockTokens,
          },
        }),
      });
    });

    it('should successfully logout and clear context state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Login first
      await act(async () => {
        await result.current.login('testuser', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Mock logout API
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      // Execute logout
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle logout errors gracefully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Login first
      await act(async () => {
        await result.current.login('testuser', 'password123');
      });

      // Mock logout API error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      // Execute logout
      await act(async () => {
        await result.current.logout();
      });

      // Should still clear local state even if backend logout fails
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });

  describe('Token Refresh Integration', () => {
    beforeEach(async () => {
      // Setup authenticated state
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: mockUser,
            ...mockTokens,
          },
        }),
      });
    });

    it('should successfully refresh token and update context state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Login first
      await act(async () => {
        await result.current.login('testuser', 'password123');
      });

      const newToken = 'new-access-token';

      // Mock refresh token API
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { token: newToken },
        }),
      });

      // Execute token refresh
      await act(async () => {
        await result.current.refreshToken();
      });

      expect(result.current.token).toBe(newToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should clear context state when token refresh fails', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Login first
      await act(async () => {
        await result.current.login('testuser', 'password123');
      });

      // Mock refresh token failure
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          message: 'Refresh token expired',
        }),
      });

      // Execute token refresh
      await act(async () => {
        await result.current.refreshToken();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });

  describe('Auto-Login Integration', () => {
    it('should successfully perform auto-login check', async () => {
      // Mock stored user data
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'user_data') {
          return Promise.resolve(JSON.stringify(mockUser));
        }
        return Promise.resolve(null);
      });

      jest.spyOn(StorageService, 'getAuthTokens').mockResolvedValue({
        accessToken: mockTokens.token,
        refreshToken: mockTokens.refreshToken,
      });

      // Mock token validation
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { valid: true },
        }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Execute manual auto-login check
      let autoLoginResult: boolean;
      await act(async () => {
        autoLoginResult = await result.current.checkAutoLogin();
      });

      expect(autoLoginResult!).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockTokens.token);
    });

    it('should fail auto-login with invalid tokens', async () => {
      // Mock stored user data
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'user_data') {
          return Promise.resolve(JSON.stringify(mockUser));
        }
        return Promise.resolve(null);
      });

      jest.spyOn(StorageService, 'getAuthTokens').mockResolvedValue({
        accessToken: 'invalid-token',
        refreshToken: 'invalid-refresh-token',
      });

      // Mock token validation failure
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          message: 'Token validation failed',
        }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Execute manual auto-login check
      let autoLoginResult: boolean;
      await act(async () => {
        autoLoginResult = await result.current.checkAutoLogin();
      });

      expect(autoLoginResult!).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });

  describe('Context State Synchronization', () => {
    it('should keep context state synchronized with auth service', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock successful login
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: mockUser,
            ...mockTokens,
          },
        }),
      });

      // Login through context
      await act(async () => {
        await result.current.login('testuser', 'password123');
      });

      // Verify context state matches auth service state
      const authState = authService.getAuthState();
      expect(result.current.isAuthenticated).toBe(authState.isAuthenticated);
      expect(result.current.user).toEqual(authState.user);
      expect(result.current.token).toBe(authState.token);

      // Logout through context
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      await act(async () => {
        await result.current.logout();
      });

      // Verify context state still matches auth service state
      const loggedOutAuthState = authService.getAuthState();
      expect(result.current.isAuthenticated).toBe(loggedOutAuthState.isAuthenticated);
      expect(result.current.user).toEqual(loggedOutAuthState.user);
      expect(result.current.token).toBe(loggedOutAuthState.token);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle context errors without crashing', async () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock auth service error
      jest.spyOn(authService, 'login').mockRejectedValue(new Error('Service error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Execute login that will fail
      let loginResult: boolean;
      await act(async () => {
        loginResult = await result.current.login('testuser', 'password123');
      });

      expect(loginResult!).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});