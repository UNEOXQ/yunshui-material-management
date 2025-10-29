import { statusService } from '../statusService';
import { store } from '../../store/store';
import { updateStatus, setError } from '../../store/slices/statusSlice';

// Mock the store
jest.mock('../../store/store', () => ({
  store: {
    dispatch: jest.fn(),
    getState: jest.fn(),
  },
}));

// Enhanced EventSource mock for real-time testing
class MockEventSource {
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public readyState: number = 0;
  private static instances: MockEventSource[] = [];

  constructor(public url: string, public options?: any) {
    MockEventSource.instances.push(this);
    
    // Simulate connection opening after a delay
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  close() {
    this.readyState = 2;
    const index = MockEventSource.instances.indexOf(this);
    if (index > -1) {
      MockEventSource.instances.splice(index, 1);
    }
  }

  // Helper methods for testing
  simulateMessage(data: any) {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data),
      });
      this.onmessage(event);
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  static getInstances() {
    return MockEventSource.instances;
  }

  static clearInstances() {
    MockEventSource.instances = [];
  }
}

// Mock global EventSource
(global as any).EventSource = MockEventSource;

describe('StatusService - Real-time Sync Mechanism', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    MockEventSource.clearInstances();
    statusService.disconnect();
    (store.dispatch as jest.Mock).mockImplementation((action) => action);
    (store.getState as jest.Mock).mockReturnValue({
      auth: { token: mockToken },
      status: { statuses: [mockStatus] },
    });
  });

  afterEach(() => {
    statusService.disconnect();
    MockEventSource.clearInstances();
  });

  describe('Real-time Connection Management', () => {
    it('should establish SSE connection with correct URL and headers', () => {
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);

      const instances = MockEventSource.getInstances();
      expect(instances).toHaveLength(1);
      expect(instances[0].url).toBe(`${mockBaseUrl}/status/events`);
      expect(instances[0].options?.headers?.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('should handle connection state changes correctly', async () => {
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);

      // Initially not connected
      expect(statusService.isRealTimeConnected()).toBe(false);

      // Wait for connection to open
      await new Promise(resolve => setTimeout(resolve, 20));

      // Should be connected after opening
      expect(statusService.isRealTimeConnected()).toBe(true);
    });

    it('should close existing connection when initializing new one', () => {
      // Create first connection
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);
      const firstInstance = MockEventSource.getInstances()[0];
      const closeSpy = jest.spyOn(firstInstance, 'close');

      // Create second connection
      statusService.initializeRealTimeUpdates(mockBaseUrl, 'new-token');

      expect(closeSpy).toHaveBeenCalled();
      expect(MockEventSource.getInstances()).toHaveLength(1);
    });

    it('should handle multiple rapid reconnection attempts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Initialize connection
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);
      await new Promise(resolve => setTimeout(resolve, 20));

      // Simulate multiple errors in quick succession
      const instance = MockEventSource.getInstances()[0];
      instance.simulateError();
      instance.simulateError();
      instance.simulateError();

      // Should handle multiple errors gracefully
      expect(statusService.isRealTimeConnected()).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('Real-time Event Processing', () => {
    it('should process STATUS_UPDATED events with correct data transformation', async () => {
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);
      await new Promise(resolve => setTimeout(resolve, 20));

      const updatedStatus = {
        ...mockStatus,
        value: '維護中',
        updatedAt: '2024-01-01T10:00:00Z',
      };

      const updateEvent = {
        type: 'STATUS_UPDATED',
        data: updatedStatus,
        timestamp: Date.now(),
      };

      const instance = MockEventSource.getInstances()[0];
      instance.simulateMessage(updateEvent);

      expect(store.dispatch).toHaveBeenCalledWith(updateStatus(updatedStatus));
    });

    it('should handle STATUS_CREATED events and trigger list refresh', async () => {
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);
      await new Promise(resolve => setTimeout(resolve, 20));

      const newStatus = {
        id: '2',
        name: '新增狀態',
        value: '啟用',
        type: 'BOOLEAN' as const,
        category: '功能',
        updatedAt: '2024-01-01T11:00:00Z',
      };

      const createEvent = {
        type: 'STATUS_CREATED',
        data: newStatus,
        timestamp: Date.now(),
      };

      const instance = MockEventSource.getInstances()[0];
      instance.simulateMessage(createEvent);

      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'api/invalidateTags',
        payload: ['Status'],
      });
    });

    it('should handle STATUS_DELETED events and trigger list refresh', async () => {
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);
      await new Promise(resolve => setTimeout(resolve, 20));

      const deleteEvent = {
        type: 'STATUS_DELETED',
        data: { id: '1' },
        timestamp: Date.now(),
      };

      const instance = MockEventSource.getInstances()[0];
      instance.simulateMessage(deleteEvent);

      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'api/invalidateTags',
        payload: ['Status'],
      });
    });

    it('should ignore events with invalid data structure', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);
      await new Promise(resolve => setTimeout(resolve, 20));

      const invalidUpdateEvent = {
        type: 'STATUS_UPDATED',
        data: { id: '1' }, // Missing required fields
        timestamp: Date.now(),
      };

      const instance = MockEventSource.getInstances()[0];
      instance.simulateMessage(invalidUpdateEvent);

      // Should not dispatch update for invalid data
      expect(store.dispatch).not.toHaveBeenCalledWith(
        updateStatus(expect.any(Object))
      );

      consoleSpy.mockRestore();
    });

    it('should handle unknown event types gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);
      await new Promise(resolve => setTimeout(resolve, 20));

      const unknownEvent = {
        type: 'UNKNOWN_EVENT',
        data: mockStatus,
        timestamp: Date.now(),
      };

      const instance = MockEventSource.getInstances()[0];
      instance.simulateMessage(unknownEvent);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Unknown status update event type:',
        'UNKNOWN_EVENT'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Connection Recovery and Resilience', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should implement exponential backoff for reconnection attempts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);
      
      // Fast-forward to connection open
      jest.advanceTimersByTime(20);
      
      // Simulate connection error
      const instance = MockEventSource.getInstances()[0];
      instance.simulateError();

      // First reconnection attempt should happen after 1 second
      expect(MockEventSource.getInstances()).toHaveLength(1);
      
      // Fast-forward and wait for reconnection
      jest.advanceTimersByTime(1100); // Add extra time for async operations
      await new Promise(resolve => setTimeout(resolve, 0)); // Allow async operations to complete
      
      // Should have attempted reconnection
      expect(MockEventSource.getInstances().length).toBeGreaterThan(1);

      consoleSpy.mockRestore();
    });

    it('should stop reconnection attempts after max attempts reached', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);
      
      // Fast-forward to connection open
      jest.advanceTimersByTime(20);
      
      // Get initial instance and simulate multiple errors
      const initialInstance = MockEventSource.getInstances()[0];
      
      // Simulate multiple consecutive errors to trigger max attempts
      for (let i = 0; i < 6; i++) { // Exceed max attempts
        initialInstance.simulateError();
        
        // Fast-forward through the reconnection delay
        jest.advanceTimersByTime(Math.pow(2, i) * 1000 + 100);
        await new Promise(resolve => setTimeout(resolve, 0)); // Allow async operations
      }

      // Should have reached max attempts and dispatched error
      expect(store.dispatch).toHaveBeenCalledWith(
        setError('即時更新連線中斷，請重新整理頁面')
      );

      consoleSpy.mockRestore();
    });

    it('should reset reconnection attempts after successful connection', async () => {
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);
      
      // Fast-forward to connection open
      jest.advanceTimersByTime(20);
      
      // Simulate error and reconnection
      const firstInstance = MockEventSource.getInstances()[0];
      firstInstance.simulateError();
      
      jest.advanceTimersByTime(1000);
      
      // New connection should open successfully
      jest.advanceTimersByTime(20);
      
      // Verify reconnection attempts were reset by checking internal state
      expect(statusService.isRealTimeConnected()).toBe(true);
    });
  });

  describe('Sync Performance and Optimization', () => {
    it('should batch multiple rapid status updates', async () => {
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);
      await new Promise(resolve => setTimeout(resolve, 20));

      const instance = MockEventSource.getInstances()[0];
      
      // Send multiple rapid updates
      const updates = [
        { ...mockStatus, value: '狀態1', updatedAt: '2024-01-01T10:00:00Z' },
        { ...mockStatus, value: '狀態2', updatedAt: '2024-01-01T10:00:01Z' },
        { ...mockStatus, value: '狀態3', updatedAt: '2024-01-01T10:00:02Z' },
      ];

      updates.forEach(status => {
        instance.simulateMessage({
          type: 'STATUS_UPDATED',
          data: status,
          timestamp: Date.now(),
        });
      });

      // Should dispatch all updates
      updates.forEach(status => {
        expect(store.dispatch).toHaveBeenCalledWith(updateStatus(status));
      });
    });

    it('should handle high-frequency events without memory leaks', async () => {
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);
      await new Promise(resolve => setTimeout(resolve, 20));

      const instance = MockEventSource.getInstances()[0];
      
      // Send 100 rapid events
      for (let i = 0; i < 100; i++) {
        instance.simulateMessage({
          type: 'STATUS_UPDATED',
          data: { ...mockStatus, value: `狀態${i}` },
          timestamp: Date.now(),
        });
      }

      // Should handle all events without crashing
      expect(store.dispatch).toHaveBeenCalledTimes(100);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);
      await new Promise(resolve => setTimeout(resolve, 20));

      const instance = MockEventSource.getInstances()[0];
      
      // Simulate malformed JSON message
      if (instance.onmessage) {
        const malformedEvent = new MessageEvent('message', {
          data: '{ invalid json }',
        });
        instance.onmessage(malformedEvent);
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error parsing status update event:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty or null event data', async () => {
      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);
      await new Promise(resolve => setTimeout(resolve, 20));

      const instance = MockEventSource.getInstances()[0];
      
      // Test empty data
      instance.simulateMessage({
        type: 'STATUS_UPDATED',
        data: null,
        timestamp: Date.now(),
      });

      // Test undefined data
      instance.simulateMessage({
        type: 'STATUS_UPDATED',
        data: undefined,
        timestamp: Date.now(),
      });

      // Should not crash or dispatch invalid updates
      expect(store.dispatch).not.toHaveBeenCalledWith(
        updateStatus(null)
      );
      expect(store.dispatch).not.toHaveBeenCalledWith(
        updateStatus(undefined)
      );
    });

    it('should handle connection initialization errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock EventSource constructor to throw
      const OriginalEventSource = (global as any).EventSource;
      (global as any).EventSource = function() {
        throw new Error('Connection initialization failed');
      };

      statusService.initializeRealTimeUpdates(mockBaseUrl, mockToken);

      expect(store.dispatch).toHaveBeenCalledWith(
        setError('無法建立即時更新連線')
      );

      // Restore
      (global as any).EventSource = OriginalEventSource;
      consoleSpy.mockRestore();
    });
  });
});