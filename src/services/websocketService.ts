import { io, Socket } from 'socket.io-client';

export interface StatusUpdateEvent {
  projectId: string;
  statusType: 'ORDER' | 'PICKUP' | 'DELIVERY' | 'CHECK';
  statusValue: string;
  updatedBy: string;
  updatedByUsername: string;
  updatedByRole: string;
  timestamp: string;
  additionalData?: Record<string, any>;
}

export interface ProjectUpdateEvent {
  projectId: string;
  projectName: string;
  overallStatus: string;
  updatedBy: string;
  timestamp: string;
}

export interface NotificationEvent {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

export interface MaintenanceEvent {
  message: string;
  scheduledTime?: string;
  timestamp: string;
}

export interface ConnectionSuccessEvent {
  message: string;
  userId: string;
  username: string;
  role: string;
  timestamp: string;
}

export type WebSocketEventHandler<T = any> = (data: T) => void;

export class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();

  constructor() {
    this.setupEventHandlers();
  }

  /**
   * Connect to WebSocket server
   */
  public connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;

      const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3004';

      this.socket = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.isConnecting = false;
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts: ${error.message}`));
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.isConnecting = false;
        
        // Emit disconnect event to handlers
        this.emitToHandlers('disconnect', { reason, timestamp: new Date().toISOString() });
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
        this.reconnectAttempts = 0;
        
        // Emit reconnect event to handlers
        this.emitToHandlers('reconnect', { attemptNumber, timestamp: new Date().toISOString() });
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('WebSocket reconnection error:', error);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('WebSocket reconnection failed');
        this.emitToHandlers('reconnect_failed', { timestamp: new Date().toISOString() });
      });

      // Setup event listeners
      this.setupSocketEventListeners();
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Subscribe to project updates
   */
  public subscribeToProject(projectId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe:project', projectId);
      console.log(`Subscribed to project: ${projectId}`);
    }
  }

  /**
   * Unsubscribe from project updates
   */
  public unsubscribeFromProject(projectId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe:project', projectId);
      console.log(`Unsubscribed from project: ${projectId}`);
    }
  }

  /**
   * Acknowledge status update
   */
  public acknowledgeStatusUpdate(updateId: string, projectId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('status:ack', { updateId, projectId });
    }
  }

  /**
   * Add event handler
   */
  public on<T = any>(event: string, handler: WebSocketEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Remove event handler
   */
  public off<T = any>(event: string, handler: WebSocketEventHandler<T>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  /**
   * Remove all event handlers for an event
   */
  public removeAllListeners(event?: string): void {
    if (event) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.clear();
    }
  }

  /**
   * Get connection status info
   */
  public getConnectionInfo(): {
    connected: boolean;
    connecting: boolean;
    reconnectAttempts: number;
    socketId?: string;
  } {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id
    };
  }

  private setupEventHandlers(): void {
    // Initialize event handler sets for known events
    const events = [
      'connection:success',
      'status:updated',
      'project:updated',
      'notification',
      'system:maintenance',
      'disconnect',
      'reconnect',
      'reconnect_failed'
    ];

    events.forEach(event => {
      this.eventHandlers.set(event, new Set());
    });
  }

  private setupSocketEventListeners(): void {
    if (!this.socket) return;

    // Connection success
    this.socket.on('connection:success', (data: ConnectionSuccessEvent) => {
      console.log('Connection success:', data);
      this.emitToHandlers('connection:success', data);
    });

    // Status updates
    this.socket.on('status:updated', (data: StatusUpdateEvent) => {
      console.log('Status updated:', data);
      this.emitToHandlers('status:updated', data);
    });

    // Project updates
    this.socket.on('project:updated', (data: ProjectUpdateEvent) => {
      console.log('Project updated:', data);
      this.emitToHandlers('project:updated', data);
    });

    // Notifications
    this.socket.on('notification', (data: NotificationEvent) => {
      console.log('Notification received:', data);
      this.emitToHandlers('notification', data);
    });

    // System maintenance
    this.socket.on('system:maintenance', (data: MaintenanceEvent) => {
      console.log('Maintenance notification:', data);
      this.emitToHandlers('system:maintenance', data);
    });
  }

  private emitToHandlers<T = any>(event: string, data: T): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${event}:`, error);
        }
      });
    }
  }
}

// Global WebSocket service instance
let websocketService: WebSocketService | null = null;

export const getWebSocketService = (): WebSocketService => {
  if (!websocketService) {
    websocketService = new WebSocketService();
  }
  return websocketService;
};

export const initializeWebSocketConnection = async (token: string): Promise<WebSocketService> => {
  const service = getWebSocketService();
  await service.connect(token);
  return service;
};

export const disconnectWebSocket = (): void => {
  if (websocketService) {
    websocketService.disconnect();
  }
};