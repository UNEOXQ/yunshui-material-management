import { useEffect, useCallback, useRef } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectAuthToken } from '../store/slices/authSlice';
import { statusService } from '../services/statusService';
import { ENV } from '../config/env';

interface UseStatusSyncOptions {
  enableRealTime?: boolean;
  autoReconnect?: boolean;
}

export const useStatusSync = (options: UseStatusSyncOptions = {}) => {
  const { enableRealTime = true, autoReconnect = true } = options;
  
  const token = useAppSelector(selectAuthToken);
  const isInitialized = useRef(false);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize real-time connection
  const initializeConnection = useCallback(() => {
    if (token && enableRealTime && !isInitialized.current) {
      statusService.initializeRealTimeUpdates(ENV.API_BASE_URL, token);
      isInitialized.current = true;
    }
  }, [token, enableRealTime]);

  // Disconnect and cleanup
  const disconnect = useCallback(() => {
    statusService.disconnect();
    isInitialized.current = false;
    
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  }, []);

  // Manual sync function
  const syncStatuses = useCallback(async () => {
    return await statusService.syncStatuses();
  }, []);

  // Check connection status
  const isConnected = useCallback(() => {
    return statusService.isRealTimeConnected();
  }, []);

  // Update status with optimistic updates
  const updateStatus = useCallback(async (
    statusId: string,
    newValue: string,
    reason?: string
  ) => {
    return await statusService.updateStatusOptimistic(statusId, newValue, reason);
  }, []);

  // Batch update statuses
  const batchUpdateStatuses = useCallback(async (
    updates: Array<{ id: string; value: string; reason?: string }>
  ) => {
    return await statusService.batchUpdateStatuses(updates);
  }, []);

  // Setup connection monitoring
  useEffect(() => {
    if (!enableRealTime) return;

    const checkConnection = () => {
      if (token && !isConnected() && autoReconnect) {
        console.log('Status connection lost, attempting to reconnect...');
        initializeConnection();
      }
    };

    // Check connection every 30 seconds
    const connectionCheckInterval = setInterval(checkConnection, 30000);

    return () => {
      clearInterval(connectionCheckInterval);
    };
  }, [token, enableRealTime, autoReconnect, initializeConnection, isConnected]);

  // Initialize connection when component mounts
  useEffect(() => {
    initializeConnection();

    return () => {
      disconnect();
    };
  }, [initializeConnection, disconnect]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App came to foreground, ensure connection is active
        if (enableRealTime && token && !isConnected()) {
          initializeConnection();
        }
      } else if (nextAppState === 'background') {
        // App went to background, optionally disconnect to save resources
        // For now, we'll keep the connection active
      }
    };

    // Note: In a real React Native app, you would use AppState from 'react-native'
    // AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // AppState.removeEventListener('change', handleAppStateChange);
    };
  }, [enableRealTime, token, initializeConnection, isConnected]);

  return {
    // Connection management
    initializeConnection,
    disconnect,
    isConnected,
    
    // Data operations
    syncStatuses,
    updateStatus,
    batchUpdateStatuses,
    
    // Status
    isRealTimeEnabled: enableRealTime,
  };
};