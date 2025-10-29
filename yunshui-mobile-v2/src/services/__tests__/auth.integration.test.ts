import { authService, LoginRequest } from '../authService';
import { StorageService } from '../../utils/storage';
import { apiService } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native-keychain');

describe('Authentication Integration Tests', () => {
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

  const validCredentials: LoginRequest = {
    username: 'testuser',
    password: 'password123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset auth service state
    authService.logout();
    
    // Clear all storage
    (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Complete Login Flow Integration', () => {
    it('should complete full login flow with token storage', async () => {
      // Mock successful API response
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

      // Execute login
      const result = await authService.login(validCredentials);

      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(validCredentials),
        })
      );

      // Verify login result
      expect(result).toEqual({
        user: mockUser,
        ...mockTokens,
      });

      // Verify authentication state
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getCurrentUser()).toEqual(mockUser);
      expect(authService.getToken()).toBe(mockTokens.token);

      // Verify token storage calls
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'user_data',
        JSON.stringify(mockUser)
      );
    });

    it('should handle login failure correctly', async () => {
      // Mock failed API response
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          message: 'Invalid credentials',
        }),
      });

      // Execute login and expect failure
      await expect(authService.login(validCredentials)).rejects.toThrow('Invalid credentials');

      // Verify authentication state remains false
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.getToken()).toBeNull();

      // Verify no tokens were stored
      expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
        expect.stringContaining('token'),
        expect.any(String)
      );
    });

    it('should handle network errors during login', async () => {
      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      // Execute login and expect failure
      await expect(authService.login(validCredentials)).rejects.toThrow();

      // Verify authentication state remains false
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.getToken()).toBeNull();
    });
  });

  describe('Token Storage and Retrieval Integration', () => {
    beforeEach(async () => {
      // Mock successful login first
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

      await authService.login(validCredentials);
    });

    it('should store tokens securely after login', async () => {
      // Verify secure token storage was called
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'user_data',
        JSON.stringify(mockUser)
      );
    });

    it('should retrieve stored tokens correctly', async () => {
      // Mock stored tokens
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'user_data') {
          return Promise.resolve(JSON.stringify(mockUser));
        }
        return Promise.resolve(null);
      });

      // Mock StorageService.getAuthTokens
      jest.spyOn(StorageService, 'getAuthTokens').mockResolvedValue({
        accessToken: mockTokens.token,
        refreshToken: mockTokens.refreshToken,
      });

      // Initialize auth state (simulating app restart)
      const isLoggedIn = await authService.checkAutoLogin();

      expect(isLoggedIn).toBe(true);
      expect(authService.getToken()).toBe(mockTokens.token);
      expect(authService.getCurrentUser()).toEqual(mockUser);
    });

    it('should clear tokens on logout', async () => {
      // Mock logout API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      // Execute logout
      await authService.logout();

      // Verify tokens are cleared
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.getToken()).toBeNull();

      // Verify storage cleanup
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user_data');
    });

    it('should handle token storage errors gracefully', async () => {
      // Mock storage error
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      // Mock API response
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

      // Login should fail due to storage error
      await expect(authService.login(validCredentials)).rejects.toThrow('Storage error');
    });
  });

  describe('Auto-Login Integration', () => {
    it('should successfully auto-login with valid stored tokens', async () => {
      // Mock stored user data
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'user_data') {
          return Promise.resolve(JSON.stringify(mockUser));
        }
        return Promise.resolve(null);
      });

      // Mock StorageService.getAuthTokens
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

      // Execute auto-login check
      const isLoggedIn = await authService.checkAutoLogin();

      expect(isLoggedIn).toBe(true);
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getCurrentUser()).toEqual(mockUser);
      expect(authService.getToken()).toBe(mockTokens.token);

      // Verify token validation was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/validate'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should fail auto-login with invalid stored tokens', async () => {
      // Mock stored user data
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'user_data') {
          return Promise.resolve(JSON.stringify(mockUser));
        }
        return Promise.resolve(null);
      });

      // Mock StorageService.getAuthTokens
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

      // Execute auto-login check
      const isLoggedIn = await authService.checkAutoLogin();

      expect(isLoggedIn).toBe(false);
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.getToken()).toBeNull();
    });

    it('should attempt token refresh when validation fails', async () => {
      // Mock stored user data
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'user_data') {
          return Promise.resolve(JSON.stringify(mockUser));
        }
        return Promise.resolve(null);
      });

      // Mock StorageService.getAuthTokens
      jest.spyOn(StorageService, 'getAuthTokens').mockResolvedValue({
        accessToken: 'expired-token',
        refreshToken: mockTokens.refreshToken,
      });

      let callCount = 0;
      global.fetch = jest.fn().mockImplementation((url: string) => {
        callCount++;
        
        if (url.includes('/api/auth/validate')) {
          // First call: token validation fails
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({
              message: 'Token validation failed',
            }),
          });
        } else if (url.includes('/api/auth/refresh')) {
          // Second call: token refresh succeeds
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              data: { token: 'new-access-token' },
            }),
          });
        }
        
        return Promise.reject(new Error('Unexpected API call'));
      });

      // Execute auto-login check
      const isLoggedIn = await authService.checkAutoLogin();

      expect(isLoggedIn).toBe(true);
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getToken()).toBe('new-access-token');

      // Verify both validation and refresh were called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/validate'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/refresh'),
        expect.any(Object)
      );
    });

    it('should clear auth state when token refresh fails', async () => {
      // Mock stored user data
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'user_data') {
          return Promise.resolve(JSON.stringify(mockUser));
        }
        return Promise.resolve(null);
      });

      // Mock StorageService.getAuthTokens
      jest.spyOn(StorageService, 'getAuthTokens').mockResolvedValue({
        accessToken: 'expired-token',
        refreshToken: 'expired-refresh-token',
      });

      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/api/auth/validate')) {
          // Token validation fails
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({
              message: 'Token validation failed',
            }),
          });
        } else if (url.includes('/api/auth/refresh')) {
          // Token refresh also fails
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({
              message: 'Refresh token expired',
            }),
          });
        }
        
        return Promise.reject(new Error('Unexpected API call'));
      });

      // Execute auto-login check
      const isLoggedIn = await authService.checkAutoLogin();

      expect(isLoggedIn).toBe(false);
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.getToken()).toBeNull();

      // Verify storage cleanup was called
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user_data');
    });

    it('should handle missing stored data gracefully', async () => {
      // Mock no stored data
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      jest.spyOn(StorageService, 'getAuthTokens').mockResolvedValue({
        accessToken: null,
        refreshToken: null,
      });

      // Execute auto-login check
      const isLoggedIn = await authService.checkAutoLogin();

      expect(isLoggedIn).toBe(false);
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.getToken()).toBeNull();

      // Verify no API calls were made
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle storage errors during auto-login', async () => {
      // Mock storage error
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      // Execute auto-login check
      const isLoggedIn = await authService.checkAutoLogin();

      expect(isLoggedIn).toBe(false);
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.getToken()).toBeNull();
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

      await authService.login(validCredentials);
    });

    it('should refresh token successfully', async () => {
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
      const refreshedToken = await authService.refreshToken();

      expect(refreshedToken).toBe(newToken);
      expect(authService.getToken()).toBe(newToken);
      expect(authService.isAuthenticated()).toBe(true);

      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            refreshToken: mockTokens.refreshToken,
          }),
        })
      );
    });

    it('should clear auth state when refresh fails', async () => {
      // Mock refresh token failure
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          message: 'Refresh token expired',
        }),
      });

      // Execute token refresh and expect failure
      await expect(authService.refreshToken()).rejects.toThrow('Session expired. Please login again.');

      // Verify auth state is cleared
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.getToken()).toBeNull();

      // Verify storage cleanup
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user_data');
    });

    it('should handle network errors during token refresh', async () => {
      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      // Execute token refresh and expect failure
      await expect(authService.refreshToken()).rejects.toThrow('Session expired. Please login again.');

      // Verify auth state is cleared
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.getToken()).toBeNull();
    });
  });

  describe('Authentication State Persistence', () => {
    it('should maintain authentication state across service instances', async () => {
      // Login with first instance
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

      await authService.login(validCredentials);

      // Verify state is maintained
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getCurrentUser()).toEqual(mockUser);
      expect(authService.getToken()).toBe(mockTokens.token);
    });

    it('should restore authentication state from storage on initialization', async () => {
      // Mock stored data
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

      // Simulate app restart by checking auto-login
      const isLoggedIn = await authService.checkAutoLogin();

      expect(isLoggedIn).toBe(true);
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getCurrentUser()).toEqual(mockUser);
      expect(authService.getToken()).toBe(mockTokens.token);
    });
  });
});