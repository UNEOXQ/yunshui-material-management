// Core data model interfaces and types for backend

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'PM' | 'AM' | 'WAREHOUSE' | 'ADMIN';

export interface Material {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  supplier?: string | undefined;
  type: MaterialType;
  createdAt: Date;
  updatedAt: Date;
}

export type MaterialType = 'AUXILIARY' | 'FINISHED';

export interface Order {
  id: string;
  userId: string;
  name?: string; // 可選的訂單名稱，用戶可以自定義
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 'PENDING' | 'APPROVED' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  orderId: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  supplier?: string; // For finished materials
}

export interface Project {
  id: string;
  orderId: string;
  projectName: string;
  overallStatus: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface StatusUpdate {
  id: string;
  projectId: string;
  updatedBy: string;
  statusType: StatusType;
  statusValue: string;
  additionalData?: Record<string, any> | undefined;
  createdAt: Date;
}

export type StatusType = 'ORDER' | 'PICKUP' | 'DELIVERY' | 'CHECK';

// 留言系統類型
export interface Message {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response types
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'passwordHash'>;
  token: string;
  refreshToken: string;
}

export interface CreateMaterialRequest {
  name: string;
  category: string;
  price: number;
  quantity: number;
  supplier?: string;
  type: MaterialType;
}

export interface UpdateMaterialRequest {
  name?: string;
  category?: string;
  price?: number;
  quantity?: number;
  supplier?: string;
}

export interface CreateOrderRequest {
  items: {
    materialId: string;
    quantity: number;
  }[];
}

export interface UpdateStatusRequest {
  statusType: StatusType;
  statusValue: string;
  additionalData?: Record<string, any>;
}

// Database entity types
export interface UserEntity extends Omit<User, 'createdAt' | 'updatedAt' | 'passwordHash'> {
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface MaterialEntity extends Omit<Material, 'createdAt' | 'updatedAt' | 'imageUrl'> {
  image_url: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderEntity extends Omit<Order, 'createdAt' | 'updatedAt' | 'userId' | 'totalAmount'> {
  user_id: string;
  total_amount: number;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemEntity extends Omit<OrderItem, 'orderId' | 'materialId' | 'unitPrice'> {
  order_id: string;
  material_id: string;
  unit_price: number;
}

export interface ProjectEntity extends Omit<Project, 'createdAt' | 'updatedAt' | 'orderId' | 'projectName' | 'overallStatus'> {
  order_id: string;
  project_name: string;
  overall_status: ProjectStatus;
  created_at: Date;
  updated_at: Date;
}

export interface StatusUpdateEntity extends Omit<StatusUpdate, 'createdAt' | 'projectId' | 'updatedBy' | 'statusType' | 'statusValue' | 'additionalData'> {
  project_id: string;
  updated_by: string;
  status_type: StatusType;
  status_value: string;
  additional_data?: Record<string, any>;
  created_at: Date;
}

// Utility types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Express Request extensions
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Socket.io types
export interface SocketUser {
  userId: string;
  username: string;
  role: UserRole;
}

export interface StatusUpdateEvent {
  projectId: string;
  statusUpdate: StatusUpdate;
  updatedBy: string;
}