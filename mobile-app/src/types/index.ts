// 用戶相關類型
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
  token?: string;
  refreshToken?: string;
  createdAt: string;
  updatedAt: string;
}

// 基材相關類型
export interface Material {
  id: string;
  name: string;
  category: string;
  specification: string;
  unit: string;
  price: number;
  stock: number;
  imageUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialRequest {
  name: string;
  category: string;
  specification: string;
  unit: string;
  price: number;
  stock: number;
  imageUrl?: string;
  description?: string;
}

export interface UpdateMaterialRequest extends Partial<CreateMaterialRequest> {
  id: string;
}

// 訂單相關類型
export interface OrderMaterial {
  materialId: string;
  material: Material;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  materials: OrderMaterial[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 
  | 'PENDING'     // 待處理
  | 'CONFIRMED'   // 已確認
  | 'PROCESSING'  // 處理中
  | 'SHIPPED'     // 已出貨
  | 'DELIVERED'   // 已送達
  | 'CANCELLED';  // 已取消

export interface CreateOrderRequest {
  customerName: string;
  materials: {
    materialId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface UpdateOrderRequest {
  id: string;
  customerName?: string;
  status?: OrderStatus;
  materials?: {
    materialId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

// 系統狀態相關類型
export interface SystemStatus {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  description?: string;
  lastUpdated: string;
}

// 離線功能相關類型
export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'MATERIAL' | 'ORDER' | 'STATUS';
  entityId?: string;
  data: any;
  timestamp: number;
  synced: boolean;
  retryCount?: number;
  lastError?: string;
}

export interface SyncResult {
  success: boolean;
  syncedActions: number;
  failedActions: number;
  errors: string[];
}

// API 響應類型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 認證相關類型
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// 圖片上傳相關類型
export interface ImageUploadResponse {
  url: string;
  publicId: string;
}

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

// 網路狀態類型
export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

// 應用狀態類型
export interface AppState {
  isLoading: boolean;
  isOffline: boolean;
  lastSyncTime: number | null;
  pendingActions: number;
}

// 錯誤類型
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// 表單驗證類型
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  values: T;
  errors: ValidationError[];
  isValid: boolean;
  isSubmitting: boolean;
}

// 搜尋和篩選類型
export interface MaterialFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  searchQuery?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  dateRange?: {
    start: string;
    end: string;
  };
  customerName?: string;
  searchQuery?: string;
}

// 排序類型
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  order: SortOrder;
}

// 快取相關類型
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// 設定相關類型
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-TW' | 'zh-CN' | 'en';
  notifications: {
    enabled: boolean;
    orderUpdates: boolean;
    stockAlerts: boolean;
  };
  sync: {
    autoSync: boolean;
    syncInterval: number; // in minutes
    wifiOnly: boolean;
  };
  cache: {
    imageCache: boolean;
    dataCacheDuration: number; // in hours
  };
}

// 統計相關類型
export interface MaterialStats {
  totalMaterials: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryCounts: Record<string, number>;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  statusCounts: Record<OrderStatus, number>;
  monthlyTrends: {
    month: string;
    orders: number;
    revenue: number;
  }[];
}

// 導出所有類型
export * from '../navigation/types';