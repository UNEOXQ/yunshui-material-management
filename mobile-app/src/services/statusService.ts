import { store } from '../store/store';
import { setStatuses, updateStatus, setError } from '../store/slices/statusSlice';
import { SystemStatus } from '../store/api/statusApi';

export interface StatusUpdateEvent {
  type: 'STATUS_UPDATED' | 'STATUS_CREATED' | 'STATUS_DELETED';
  data: SystemStatus | { id: string };
  timestamp: number;
}

class StatusService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnected = false;

  /**
   * Initialize real-time status updates using Server-Sent Events (SSE)
   */
  initializeRealTimeUpdates(baseUrl: string, token: string) {
    if (this.eventSource) {
      this.disconnect();
    }

    try {
      const url = `${baseUrl}/status/events`;
      this.eventSource = new EventSource(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      this.eventSource.onopen = () => {
        console.log('Status SSE connection opened');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const updateEvent: StatusUpdateEvent = JSON.parse(event.data);
          this.handleStatusUpdate(updateEvent);
        } catch (error) {
          console.error('Error parsing status update event:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('Status SSE connection error:', error);
        this.isConnected = false;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.reconnectDelay *= 2; // Exponential backoff
            console.log(`Attempting to reconnect SSE (attempt ${this.reconnectAttempts})`);
            this.initializeRealTimeUpdates(baseUrl, token);
          }, this.reconnectDelay);
        } else {
          console.error('Max reconnection attempts reached for status SSE');
          store.dispatch(setError('即時更新連線中斷，請重新整理頁面'));
        }
      };

    } catch (error) {
      console.error('Error initializing status SSE:', error);
      store.dispatch(setError('無法建立即時更新連線'));
    }
  }

  /**
   * Handle incoming status update events
   */
  private handleStatusUpdate(event: StatusUpdateEvent) {
    const { type, data } = event;

    switch (type) {
      case 'STATUS_UPDATED':
        if ('id' in data && 'name' in data) {
          store.dispatch(updateStatus(data as SystemStatus));
          console.log('Status updated via SSE:', data);
        }
        break;

      case 'STATUS_CREATED':
        if ('id' in data && 'name' in data) {
          // Refresh the entire list to include the new status
          this.refreshStatusList();
          console.log('Status created via SSE:', data);
        }
        break;

      case 'STATUS_DELETED':
        if ('id' in data) {
          // Refresh the entire list to remove the deleted status
          this.refreshStatusList();
          console.log('Status deleted via SSE:', data);
        }
        break;

      default:
        console.warn('Unknown status update event type:', type);
    }
  }

  /**
   * Refresh the status list from the API
   */
  private async refreshStatusList() {
    try {
      // This will trigger a refetch of the status list
      // The component will automatically update when the query cache is invalidated
      store.dispatch({ type: 'api/invalidateTags', payload: ['Status'] });
    } catch (error) {
      console.error('Error refreshing status list:', error);
    }
  }

  /**
   * Disconnect from real-time updates
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      console.log('Status SSE connection closed');
    }
  }

  /**
   * Check if real-time connection is active
   */
  isRealTimeConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Manually trigger a status sync
   */
  async syncStatuses() {
    try {
      await this.refreshStatusList();
      return true;
    } catch (error) {
      console.error('Error syncing statuses:', error);
      return false;
    }
  }

  /**
   * Update status with optimistic updates
   */
  async updateStatusOptimistic(
    statusId: string,
    newValue: string,
    reason?: string
  ): Promise<boolean> {
    try {
      // Get current status from store
      const state = store.getState();
      const currentStatus = state.status.statuses.find(s => s.id === statusId);
      
      if (!currentStatus) {
        throw new Error('Status not found');
      }

      // Create optimistic update
      const optimisticStatus: SystemStatus = {
        ...currentStatus,
        value: newValue,
        updatedAt: new Date().toISOString(),
      };

      // Apply optimistic update
      store.dispatch(updateStatus(optimisticStatus));

      // Make API call
      // Note: This would typically use the RTK Query mutation
      // but for demonstration, we'll simulate the API call
      const response = await fetch(`/api/status/${statusId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.auth.token}`,
        },
        body: JSON.stringify({ value: newValue, reason }),
      });

      if (!response.ok) {
        // Revert optimistic update on failure
        store.dispatch(updateStatus(currentStatus));
        throw new Error('Failed to update status');
      }

      const updatedStatus = await response.json();
      
      // Apply the actual server response
      store.dispatch(updateStatus(updatedStatus));
      
      return true;
    } catch (error) {
      console.error('Error updating status:', error);
      store.dispatch(setError('更新狀態失敗'));
      return false;
    }
  }

  /**
   * Batch update multiple statuses
   */
  async batchUpdateStatuses(
    updates: Array<{ id: string; value: string; reason?: string }>
  ): Promise<boolean> {
    try {
      const state = store.getState();
      
      const response = await fetch('/api/status/batch', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.auth.token}`,
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to batch update statuses');
      }

      const updatedStatuses = await response.json();
      
      // Update all statuses in the store
      updatedStatuses.forEach((status: SystemStatus) => {
        store.dispatch(updateStatus(status));
      });
      
      return true;
    } catch (error) {
      console.error('Error batch updating statuses:', error);
      store.dispatch(setError('批量更新狀態失敗'));
      return false;
    }
  }
}

// Create singleton instance
export const statusService = new StatusService();

// Export for use in components
export default statusService;