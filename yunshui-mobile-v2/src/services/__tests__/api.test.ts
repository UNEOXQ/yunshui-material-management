import { ApiService, apiService } from '../api';
import { StorageService } from '../../utils/storage';
import NetInfo from '@react-native-community/netinfo';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native-keychain');
jest.mock('@react-native-community/netinfo');
jest.mock('../../utils/storage');

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock AbortSignal.timeout
global.AbortSignal = {
  timeout: jest.fn().mockReturnValue({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    aborted: false,
  }),
} as any;

// Mock AbortController for proper error handling
global.AbortController = jest.fn().mockImplementation(() => ({
  signal: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    aborted: false,
  },
  abort: jest.fn(),
})) as any;

describe('ApiService', () => {
  let apiServiceInstance: ApiService;
  const mockStorageService = StorageService as jest.Mocked<typeof StorageService>;
  const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

  beforeEach(() => {
    jest.clearAllMocks();
    apiServiceInstance = ApiService.getInstance();
    
    // Mock network connection as online by default
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    } as any);

    // Mock storage service
    mockStorageService.getAuthTokens.mockResolvedValue({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    });
  });

  describe('Token Management', () => {
    it('should set auth tokens correctly', () => {
      const accessToken = 'new-access-token';
      const refreshToken = 'new-refresh-token';

      apiServiceInstance.setAuthTokens(accessToken, refreshToken);

      expect(mockStorageService.setAuthTokens).toHaveBeenCalledWith(accessToken, refreshToken);
      expect(apiServiceInstance.getAuthToken()).toBe(accessToken);
    });

    it('should clear auth tokens correctly', async () => {
      await apiServiceInstance.clearAuthTokens();

      expect(mockStorageService.clearAuthTokens).toHaveBeenCalled();
      expect(apiServiceInstance.getAuthToken()).toBeNull();
    });

    it('should refresh access token when 401 error occurs', async () => {
      // Set initial tokens
      apiServiceInstance.setAuthTokens('expired-token', 'valid-refresh-token');

      // Mock 401 response for first request
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({ message: 'Token expired' }),
        })
        // Mock successful refresh token response
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: { token: 'new-access-token' },
          }),
        })
        // Mock successful retry with new token
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: { message: 'Success' },
          }),
        });

      const result = await apiServiceInstance.request('/api/test');

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(mockStorageService.setSecureItem).toHaveBeenCalledWith('access_token', 'new-access-token');
    });

    it('should clear tokens when refresh token fails', async () => {
      apiServiceInstance.setAuthTokens('expired-token', 'invalid-refresh-token');

      // Mock 401 response for first request
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({ message: 'Token expired' }),
        })
        // Mock failed refresh token response
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({ message: 'Invalid refresh token' }),
        });

      await expect(apiServiceInstance.request('/api/test')).rejects.toThrow('UNAUTHORIZED');
      expect(mockStorageService.clearAuthTokens).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors correctly', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      } as any);

      await expect(apiServiceInstance.request('/api/test')).rejects.toThrow('NETWORK_ERROR');
    });

    it('should handle request timeout errors', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      await expect(apiServiceInstance.request('/api/test')).rejects.toThrow('REQUEST_TIMEOUT');
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      await expect(apiServiceInstance.request('/api/test')).rejects.toThrow('Server error');
    });

    it('should handle network request failed errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network request failed'));

      await expect(apiServiceInstance.request('/api/test')).rejects.toThrow('NETWORK_ERROR');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(apiServiceInstance.request('/api/test')).rejects.toThrow('HTTP 400: Bad Request');
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests up to maxRetries times', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network request failed'))
        .mockRejectedValueOnce(new Error('Network request failed'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: { message: 'Success on third try' },
          }),
        });

      const result = await apiServiceInstance.requestWithRetry('/api/test', {}, 2, 100);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
    });

    it('should not retry unauthorized errors', async () => {
      const unauthorizedError = new Error('UNAUTHORIZED');
      unauthorizedError.message = 'UNAUTHORIZED';
      mockFetch.mockRejectedValue(unauthorizedError);

      await expect(apiServiceInstance.requestWithRetry('/api/test', {}, 3)).rejects.toThrow('UNAUTHORIZED');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry validation errors', async () => {
      const validationError = new Error('VALIDATION_ERROR');
      validationError.message = 'VALIDATION_ERROR';
      mockFetch.mockRejectedValue(validationError);

      await expect(apiServiceInstance.requestWithRetry('/api/test', {}, 3)).rejects.toThrow('VALIDATION_ERROR');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw last error after max retries exceeded', async () => {
      const networkError = new Error('Network request failed');
      mockFetch.mockRejectedValue(networkError);

      await expect(apiServiceInstance.requestWithRetry('/api/test', {}, 2)).rejects.toThrow('Network request failed');
      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should apply exponential backoff delay between retries', async () => {
      const startTime = Date.now();
      mockFetch.mockRejectedValue(new Error('Network request failed'));

      try {
        await apiServiceInstance.requestWithRetry('/api/test', {}, 2, 100);
      } catch (error) {
        // Expected to fail
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should have waited at least 100ms + 200ms = 300ms for delays
      expect(duration).toBeGreaterThan(250);
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { message: 'Success' },
        }),
      });
    });

    it('should make GET requests correctly', async () => {
      await apiServiceInstance.get('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should make POST requests correctly', async () => {
      const testData = { name: 'test' };
      await apiServiceInstance.post('/api/test', testData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(testData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should make PUT requests correctly', async () => {
      const testData = { name: 'updated' };
      await apiServiceInstance.put('/api/test', testData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(testData),
        })
      );
    });

    it('should make DELETE requests correctly', async () => {
      await apiServiceInstance.delete('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should make PATCH requests correctly', async () => {
      const testData = { quantity: 10 };
      await apiServiceInstance.patch('/api/test', testData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(testData),
        })
      );
    });
  });

  describe('Request Headers', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: {} }),
      });
    });

    it('should include authorization header when token is set', async () => {
      apiServiceInstance.setAuthTokens('test-token', 'refresh-token');
      
      await apiServiceInstance.get('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('should include custom headers', async () => {
      const customHeaders = { 'X-Custom-Header': 'custom-value' };
      
      await apiServiceInstance.get('/api/test', customHeaders);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });

    it('should not include body for GET requests', async () => {
      await apiServiceInstance.get('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({
          body: expect.anything(),
        })
      );
    });
  });

  describe('Concurrent Token Refresh', () => {
    it('should handle concurrent requests during token refresh', async () => {
      apiServiceInstance.setAuthTokens('expired-token', 'valid-refresh-token');

      // Mock 401 responses for concurrent requests
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        })
        // Mock successful refresh
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: { token: 'new-token' },
          }),
        })
        // Mock successful retries
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: { message: 'Success' },
          }),
        });

      // Make concurrent requests
      const promises = [
        apiServiceInstance.request('/api/test1'),
        apiServiceInstance.request('/api/test2'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      
      // Should only refresh token once
      expect(mockFetch).toHaveBeenCalledTimes(5); // 2 failed + 1 refresh + 2 retries
    });
  });

  describe('Request Timeout', () => {
    it('should apply custom timeout to requests', async () => {
      const customTimeout = 5000;
      
      await apiServiceInstance.request('/api/test', { timeout: customTimeout });

      expect(global.AbortSignal.timeout).toHaveBeenCalledWith(customTimeout);
    });

    it('should use default timeout when not specified', async () => {
      await apiServiceInstance.request('/api/test');

      expect(global.AbortSignal.timeout).toHaveBeenCalledWith(10000);
    });
  });
});