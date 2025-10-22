import { useEffect, useRef, useCallback, useState } from 'react';
import { 
  getWebSocketService, 
  initializeWebSocketConnection, 
  disconnectWebSocket,
  StatusUpdateEvent,
  ProjectUpdateEvent,
  NotificationEvent,
  MaintenanceEvent,
  WebSocketEventHandler
} from '../services/websocketService';

export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  reconnectAttempts: number;
}

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  projectIds?: string[];
  onStatusUpdate?: (data: StatusUpdateEvent) => void;
  onProjectUpdate?: (data: ProjectUpdateEvent) => void;
  onNotification?: (data: NotificationEvent) => void;
  onMaintenance?: (data: MaintenanceEvent) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onReconnect?: (attemptNumber: number) => void;
  onError?: (error: string) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    projectIds = [],
    onStatusUpdate,
    onProjectUpdate,
    onNotification,
    onMaintenance,
    onConnect,
    onDisconnect,
    onReconnect,
    onError
  } = options;

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    reconnectAttempts: 0
  });

  const websocketService = useRef(getWebSocketService());
  const subscribedProjects = useRef<Set<string>>(new Set());
  const handlersRef = useRef<Map<string, WebSocketEventHandler>>(new Map());

  // Update connection state
  const updateConnectionState = useCallback(() => {
    const connectionInfo = websocketService.current.getConnectionInfo();
    setState(prev => ({
      ...prev,
      connected: connectionInfo.connected,
      connecting: connectionInfo.connecting,
      reconnectAttempts: connectionInfo.reconnectAttempts
    }));
  }, []);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      const error = 'No authentication token found';
      setState(prev => ({ ...prev, error, connecting: false }));
      onError?.(error);
      return;
    }

    try {
      setState(prev => ({ ...prev, connecting: true, error: null }));
      await initializeWebSocketConnection(token);
      updateConnectionState();
      onConnect?.();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to connect to WebSocket';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        connecting: false, 
        connected: false 
      }));
      onError?.(errorMessage);
    }
  }, [onConnect, onError, updateConnectionState]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    disconnectWebSocket();
    subscribedProjects.current.clear();
    setState(prev => ({ 
      ...prev, 
      connected: false, 
      connecting: false, 
      error: null,
      reconnectAttempts: 0
    }));
  }, []);

  // Subscribe to project
  const subscribeToProject = useCallback((projectId: string) => {
    if (!subscribedProjects.current.has(projectId)) {
      websocketService.current.subscribeToProject(projectId);
      subscribedProjects.current.add(projectId);
    }
  }, []);

  // Unsubscribe from project
  const unsubscribeFromProject = useCallback((projectId: string) => {
    if (subscribedProjects.current.has(projectId)) {
      websocketService.current.unsubscribeFromProject(projectId);
      subscribedProjects.current.delete(projectId);
    }
  }, []);

  // Acknowledge status update
  const acknowledgeStatusUpdate = useCallback((updateId: string, projectId: string) => {
    websocketService.current.acknowledgeStatusUpdate(updateId, projectId);
  }, []);

  // Setup event handlers
  useEffect(() => {
    const service = websocketService.current;

    // Connection success handler
    const connectionSuccessHandler = () => {
      updateConnectionState();
      onConnect?.();
    };

    // Status update handler
    const statusUpdateHandler = (data: StatusUpdateEvent) => {
      onStatusUpdate?.(data);
    };

    // Project update handler
    const projectUpdateHandler = (data: ProjectUpdateEvent) => {
      onProjectUpdate?.(data);
    };

    // Notification handler
    const notificationHandler = (data: NotificationEvent) => {
      onNotification?.(data);
    };

    // Maintenance handler
    const maintenanceHandler = (data: MaintenanceEvent) => {
      onMaintenance?.(data);
    };

    // Disconnect handler
    const disconnectHandler = (data: { reason: string }) => {
      updateConnectionState();
      onDisconnect?.(data.reason);
    };

    // Reconnect handler
    const reconnectHandler = (data: { attemptNumber: number }) => {
      updateConnectionState();
      onReconnect?.(data.attemptNumber);
    };

    // Reconnect failed handler
    const reconnectFailedHandler = () => {
      updateConnectionState();
      const error = 'Failed to reconnect to WebSocket server';
      setState(prev => ({ ...prev, error }));
      onError?.(error);
    };

    // Register handlers
    service.on('connection:success', connectionSuccessHandler);
    service.on('status:updated', statusUpdateHandler);
    service.on('project:updated', projectUpdateHandler);
    service.on('notification', notificationHandler);
    service.on('system:maintenance', maintenanceHandler);
    service.on('disconnect', disconnectHandler);
    service.on('reconnect', reconnectHandler);
    service.on('reconnect_failed', reconnectFailedHandler);

    // Store handlers for cleanup
    handlersRef.current.set('connection:success', connectionSuccessHandler);
    handlersRef.current.set('status:updated', statusUpdateHandler);
    handlersRef.current.set('project:updated', projectUpdateHandler);
    handlersRef.current.set('notification', notificationHandler);
    handlersRef.current.set('system:maintenance', maintenanceHandler);
    handlersRef.current.set('disconnect', disconnectHandler);
    handlersRef.current.set('reconnect', reconnectHandler);
    handlersRef.current.set('reconnect_failed', reconnectFailedHandler);

    return () => {
      // Cleanup handlers
      handlersRef.current.forEach((handler, event) => {
        service.off(event, handler);
      });
      handlersRef.current.clear();
    };
  }, [
    onConnect,
    onStatusUpdate,
    onProjectUpdate,
    onNotification,
    onMaintenance,
    onDisconnect,
    onReconnect,
    onError,
    updateConnectionState
  ]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      if (autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, connect, disconnect]);

  // Subscribe to initial project IDs
  useEffect(() => {
    if (state.connected && projectIds.length > 0) {
      projectIds.forEach(projectId => {
        subscribeToProject(projectId);
      });
    }
  }, [state.connected, projectIds, subscribeToProject]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscribedProjects.current.clear();
    };
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    connect,
    disconnect,
    subscribeToProject,
    unsubscribeFromProject,
    acknowledgeStatusUpdate,
    
    // Utilities
    isConnected: state.connected,
    isConnecting: state.connecting,
    hasError: !!state.error,
    
    // Connection info
    connectionInfo: websocketService.current.getConnectionInfo()
  };
};

export default useWebSocket;