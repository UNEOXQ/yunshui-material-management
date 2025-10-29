import { statusService } from '../statusService';
import { store } from '../../store/store';
import { setStatuses, updateStatus, setError } from '../../store/slices/statusSlice';

// Mock the store
jest.mock('../../store/store', () => ({
  store: {
    dispatch: jest.fn(),
    getState: jest.fn(),
  },
}));

// Mock EventSource
class MockEventSource {
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public readyState: number = 0;

  constructor(public url: string, public options?: any) {
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  close() {
    this.readyState = 2;
  }

  // Helper method to simulate receiving messages
  simulateMessage(data: any) {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data),
      });
      this.onmessage(event);
    }
  }

  // Helper method to simulate errors
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Mock global EventSource
(global as any).EventSource = MockEventSource;

// Mock fetch
global.fetch = jest.fn();

describe('StatusService', () => {
  const mockBaseUrl = 'https://api.example.com';
  const mockToken = 'test-token';

  const mockStatus = {
    id: '1',
    name: '系統狀態',
    value: '正常',
    type: 'TEXT' as const,
    category: '系統',
    description: '系統運行狀態',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockStatuses = [
    mockStatus,
    {
      id: '2',
      name: '庫存狀態',
      value: '100',
      type: 'NUMBER' as const,
      category: '庫存',
      updatedAt: '2024-01-01T01:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    statusService.disconnect();
    (store.dispatch as jest.Mock).mockClear();
    (store.getState as jest.Mock).mockReturnValue({
      auth: { token: mockToken },
      status: { statuses: mockStatuses },
    });
    // Reset dispatch mock to default behavior
    (store.dispatch as jest.Mock).mockImplementation((action) => action);
  });

  afterEach(() => {
    statusService.disconnect();
  });

  describe('Real-time Updates', () => {
    it('should initialize SSE connection successfully', async () => {
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);

      // Wait for connection to open
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(statusService.isRealTimeConnected()).toBe(true);
    });

    it('should handle STATUS_UPDATED events', async () => {
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);

      // Wait for connection to open
      await new Promise(resolve => setTimeout(resolve, 20));

      const updatedStatus = {
        ...mockStatus,
        value: '異常',
        updatedAt: '2024-01-01T03:00:00Z',
      };

      const updateEvent = {
        type: 'STATUS_UPDATED',
        data: updatedStatus,
        timestamp: Date.now(),
      };

      // Simulate receiving update event
      const eventSource = (statusService as any).eventSource as MockEventSource;
      eventSource.simulateMessage(updateEvent);

      expect(store.dispatch).toHaveBeenCalledWith(updateStatus(updatedStatus));
    });

    it('should handle STATUS_CREATED events', async () => {
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);

      // Wait for connection to open
      await new Promise(resolve => setTimeout(resolve, 20));

      const newStatus = {
        id: '3',
        name: '新狀態',
        value: '測試',
        type: 'TEXT' as const,
        category: '測試',
        updatedAt: '2024-01-01T04:00:00Z',
      };

      const createEvent = {
        type: 'STATUS_CREATED',
        data: newStatus,
        timestamp: Date.now(),
      };

      // Simulate receiving create event
      const eventSource = (statusService as any).eventSource as MockEventSource;
      eventSource.simulateMessage(createEvent);

      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'api/invalidateTags',
        payload: ['Status'],
      });
    });

    it('should handle STATUS_DELETED events', async () => {
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);

      // Wait for connection to open
      await new Promise(resolve => setTimeout(resolve, 20));

      const deleteEvent = {
        type: 'STATUS_DELETED',
        data: { id: '1' },
        timestamp: Date.now(),
      };

      // Simulate receiving delete event
      const eventSource = (statusService as any).eventSource as MockEventSource;
      eventSource.simulateMessage(deleteEvent);

      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'api/invalidateTags',
        payload: ['Status'],
      });
    });

    it('should handle connection errors and attempt reconnection', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);

      // Wait for connection to open
      await new Promise(resolve => setTimeout(resolve, 20));

      // Simulate connection error
      const eventSource = (statusService as any).eventSource as MockEventSource;
      eventSource.simulateError();

      expect(statusService.isRealTimeConnected()).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should disconnect properly', () => {
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);
      statusService.disconnect();

      expect(statusService.isRealTimeConnected()).toBe(false);
    });

    it('should handle malformed event data', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);

      // Wait for connection to open
      await new Promise(resolve => setTimeout(resolve, 20));

      // Simulate malformed message
      const eventSource = (statusService as any).eventSource as MockEventSource;
      if (eventSource.onmessage) {
        const malformedEvent = new MessageEvent('message', {
          data: 'invalid json',
        });
        eventSource.onmessage(malformedEvent);
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error parsing status update event:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Manual Sync', () => {
    it('should sync statuses successfully', async () => {
      const result = await statusService.syncStatuses();

      expect(result).toBe(true);
      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'api/invalidateTags',
        payload: ['Status'],
      });
    });

    it('should handle sync errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Spy on the private refreshStatusList method by mocking it to throw
      const originalRefreshStatusList = (statusService as any).refreshStatusList;
      (statusService as any).refreshStatusList = jest.fn().mockRejectedValue(new Error('Sync failed'));

      const result = await statusService.syncStatuses();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error syncing statuses:',
        expect.any(Error)
      );

      // Restore original method
      (statusService as any).refreshStatusList = originalRefreshStatusList;
      consoleSpy.mockRestore();
    });
  });

  describe('Optimistic Updates', () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockClear();
      // Reset dispatch mock to default behavior for this describe block
      (store.dispatch as jest.Mock).mockImplementation((action) => action);
    });

    it('should perform optimistic update successfully', async () => {
      const mockResponse = {
        ...mockStatus,
        value: '異常',
        updatedAt: '2024-01-01T05:00:00Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await statusService.updateStatusOptimistic('1', '異常', '測試原因');

      expect(result).toBe(true);
      expect(store.dispatch).toHaveBeenCalledWith(
        updateStatus(expect.objectContaining({
          id: '1',
          value: '異常',
        }))
      );
    });

    it('should revert optimistic update on API failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await statusService.updateStatusOptimistic('1', '異常');

      expect(result).toBe(false);
      expect(store.dispatch).toHaveBeenCalledWith(setError('更新狀態失敗'));
    });

    it('should handle status not found error', async () => {
      (store.getState as jest.Mock).mockReturnValue({
        auth: { token: mockToken },
        status: { statuses: [] },
      });

      const result = await statusService.updateStatusOptimistic('999', '測試');

      expect(result).toBe(false);
      expect(store.dispatch).toHaveBeenCalledWith(setError('更新狀態失敗'));
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await statusService.updateStatusOptimistic('1', '異常');

      expect(result).toBe(false);
      expect(store.dispatch).toHaveBeenCalledWith(setError('更新狀態失敗'));
    });
  });

  describe('Batch Updates', () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockClear();
      // Reset dispatch mock to default behavior for this describe block
      (store.dispatch as jest.Mock).mockImplementation((action) => action);
    });

    it('should perform batch update successfully', async () => {
      const updates = [
        { id: '1', value: '異常', reason: '測試1' },
        { id: '2', value: '200', reason: '測試2' },
      ];

      const mockResponse = [
        { ...mockStatus, value: '異常' },
        { ...mockStatuses[1], value: '200' },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await statusService.batchUpdateStatuses(updates);

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/status/batch', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ updates }),
      });

      mockResponse.forEach(status => {
        expect(store.dispatch).toHaveBeenCalledWith(updateStatus(status));
      });
    });

    it('should handle batch update failure', async () => {
      const updates = [
        { id: '1', value: '異常' },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      const result = await statusService.batchUpdateStatuses(updates);

      expect(result).toBe(false);
      expect(store.dispatch).toHaveBeenCalledWith(setError('批量更新狀態失敗'));
    });

    it('should handle batch update network errors', async () => {
      const updates = [
        { id: '1', value: '異常' },
      ];

      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await statusService.batchUpdateStatuses(updates);

      expect(result).toBe(false);
      expect(store.dispatch).toHaveBeenCalledWith(setError('批量更新狀態失敗'));
    });
  });

  describe('Connection Management', () => {
    it('should not create multiple connections', () => {
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);
      const firstEventSource = (statusService as any).eventSource;

      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);
      const secondEventSource = (statusService as any).eventSource;

      expect(firstEventSource).not.toBe(secondEventSource);
    });

    it('should handle initialization errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Reset dispatch mock to default behavior for this test
      (store.dispatch as jest.Mock).mockImplementation((action) => action);

      // Mock EventSource constructor to throw
      const OriginalEventSource = (global as any).EventSource;
      (global as any).EventSource = function() {
        throw new Error('Connection failed');
      };

      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);

      expect(store.dispatch).toHaveBeenCalledWith(setError('無法建立即時更新連線'));

      // Restore
      (global as any).EventSource = OriginalEventSource;
      consoleSpy.mockRestore();
    });
  });
});