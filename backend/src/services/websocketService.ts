import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  username?: string;
}

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

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await UserModel.findById(decoded.userId);

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.id;
        socket.userRole = user.role;
        socket.username = user.username;

        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User connected: ${socket.username} (${socket.userId}) - Socket: ${socket.id}`);

      // Track connected user
      this.addConnectedUser(socket.userId!, socket.id);

      // Join user to their role-based room
      socket.join(`role:${socket.userRole}`);
      
      // Join user to their personal room
      socket.join(`user:${socket.userId}`);

      // Handle project subscription
      socket.on('subscribe:project', (projectId: string) => {
        socket.join(`project:${projectId}`);
        console.log(`User ${socket.username} subscribed to project: ${projectId}`);
      });

      // Handle project unsubscription
      socket.on('unsubscribe:project', (projectId: string) => {
        socket.leave(`project:${projectId}`);
        console.log(`User ${socket.username} unsubscribed from project: ${projectId}`);
      });

      // Handle status update acknowledgment
      socket.on('status:ack', (data: { updateId: string; projectId: string }) => {
        console.log(`Status update acknowledged by ${socket.username}: ${data.updateId}`);
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${socket.username} - Reason: ${reason}`);
        this.removeConnectedUser(socket.userId!, socket.id);
      });

      // Send welcome message
      socket.emit('connection:success', {
        message: 'Connected to real-time updates',
        userId: socket.userId,
        username: socket.username,
        role: socket.userRole,
        timestamp: new Date().toISOString()
      });
    });
  }

  private addConnectedUser(userId: string, socketId: string): void {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socketId);
  }

  private removeConnectedUser(userId: string, socketId: string): void {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  // Public methods for broadcasting events

  /**
   * Broadcast status update to all relevant users
   */
  public broadcastStatusUpdate(event: StatusUpdateEvent): void {
    // Broadcast to project subscribers
    this.io.to(`project:${event.projectId}`).emit('status:updated', event);

    // Broadcast to warehouse staff (they can see all status updates)
    this.io.to('role:WAREHOUSE').emit('status:updated', event);

    // Broadcast to admins
    this.io.to('role:ADMIN').emit('status:updated', event);

    console.log(`Status update broadcasted for project ${event.projectId}: ${event.statusType} -> ${event.statusValue}`);
  }

  /**
   * Broadcast project update to relevant users
   */
  public broadcastProjectUpdate(event: ProjectUpdateEvent): void {
    // Broadcast to project subscribers
    this.io.to(`project:${event.projectId}`).emit('project:updated', event);

    // Broadcast to all staff
    this.io.emit('project:updated', event);

    console.log(`Project update broadcasted: ${event.projectId} -> ${event.overallStatus}`);
  }

  /**
   * Send notification to specific user
   */
  public sendUserNotification(userId: string, notification: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    data?: any;
  }): void {
    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });

    console.log(`Notification sent to user ${userId}: ${notification.title}`);
  }

  /**
   * Send notification to users with specific role
   */
  public sendRoleNotification(role: string, notification: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    data?: any;
  }): void {
    this.io.to(`role:${role}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });

    console.log(`Notification sent to role ${role}: ${notification.title}`);
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users by role
   */
  public getConnectedUsersByRole(role: string): number {
    return this.io.sockets.adapter.rooms.get(`role:${role}`)?.size || 0;
  }

  /**
   * Check if user is connected
   */
  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get WebSocket server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Broadcast system maintenance notification
   */
  public broadcastMaintenanceNotification(message: string, scheduledTime?: string): void {
    this.io.emit('system:maintenance', {
      message,
      scheduledTime,
      timestamp: new Date().toISOString()
    });

    console.log(`Maintenance notification broadcasted: ${message}`);
  }

  /**
   * Get server statistics
   */
  public getServerStats(): {
    connectedUsers: number;
    totalConnections: number;
    roomsCount: number;
    uptime: number;
  } {
    return {
      connectedUsers: this.connectedUsers.size,
      totalConnections: this.io.sockets.sockets.size,
      roomsCount: this.io.sockets.adapter.rooms.size,
      uptime: process.uptime()
    };
  }
}

// Global WebSocket service instance
let websocketService: WebSocketService | null = null;

export const initializeWebSocketService = (httpServer: HTTPServer): WebSocketService => {
  if (!websocketService) {
    websocketService = new WebSocketService(httpServer);
  }
  return websocketService;
};

export const getWebSocketService = (): WebSocketService => {
  if (!websocketService) {
    throw new Error('WebSocket service not initialized. Call initializeWebSocketService first.');
  }
  return websocketService;
};