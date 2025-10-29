import { authService, LoginRequest } from '../authService';
import { setupApiMocks, mockApiResponses, mockUser } from '../../test-utils';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native-keychain');

describe('AuthService', () => {
  beforeEach(() => {
    setupApiMocks();
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginCredentials: LoginRequest = {
      username: 'testuser',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      const result = await authService.login(loginCredentials);

      expect(result).toEqual(mockApiResponses.auth.login.success);
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getCurrentUser()).toEqual(mockUser);
    });

    it('should throw error with invalid credentials', async () => {
      // Mock failed login
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve(mockApiResponses.auth.login.error),
      });

      await expect(authService.login(loginCredentials)).rejects.toThrow();
    });

    it('should store auth tokens after successful login', async () => {
      await authService.login(loginCredentials);

      expect(authService.getToken()).toBe(mockUser.token);
    });
  });

  describe('logout', () => {
    beforeEach(async () => {
      // Login first
      await authService.login({
        username: 'testuser',
        password: 'password123',
      });
    });

    it('should logout successfully', async () => {
      await authService.logout();

      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.getToken()).toBeNull();
    });

    it('should clear auth state even if backend logout fails', async () => {
      // Mock backend logout failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await authService.logout();

      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when not logged in', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true when logged in', async () => {
      await authService.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when not logged in', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should return user data when logged in', async () => {
      await authService.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(authService.getCurrentUser()).toEqual(mockUser);
    });
  });

  describe('hasRole', () => {
    beforeEach(async () => {
      await authService.login({
        username: 'testuser',
        password: 'password123',
      });
    });

    it('should return true for matching role', () => {
      expect(authService.hasRole('ADMIN')).toBe(true);
    });

    it('should return false for non-matching role', () => {
      expect(authService.hasRole('USER')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', async () => {
      await authService.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(authService.isAdmin()).toBe(true);
    });

    it('should return false for non-admin user', async () => {
      // Mock non-admin user
      const nonAdminUser = { ...mockUser, role: 'USER' as const };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          user: nonAdminUser,
          token: 'token',
          refreshToken: 'refreshToken',
        }),
      });

      await authService.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(authService.isAdmin()).toBe(false);
    });
  });

  describe('getAuthState', () => {
    it('should return current auth state', async () => {
      const authState = authService.getAuthState();

      expect(authState).toHaveProperty('isAuthenticated');
      expect(authState).toHaveProperty('user');
      expect(authState).toHaveProperty('token');
      expect(authState).toHaveProperty('refreshToken');
    });

    it('should return updated auth state after login', async () => {
      await authService.login({
        username: 'testuser',
        password: 'password123',
      });

      const authState = authService.getAuthState();

      expect(authState.isAuthenticated).toBe(true);
      expect(authState.user).toEqual(mockUser);
      expect(authState.token).toBe(mockUser.token);
    });
  });
});