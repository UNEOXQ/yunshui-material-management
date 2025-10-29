// API 服務層導出
export { apiService, ApiService } from './api';
export type { ApiResponse, RequestOptions } from './api';

// 認證服務
export { authService, AuthService } from './authService';
export type { 
  User, 
  LoginRequest, 
  LoginResponse, 
  AuthState 
} from './authService';

// 基材管理服務
export { materialService, MaterialService } from './materialService';
export type { 
  Material, 
  MaterialType, 
  CreateMaterialRequest, 
  UpdateMaterialRequest, 
  MaterialFilters, 
  MaterialListResponse 
} from './materialService';

// 訂單管理服務
export { orderService, OrderService } from './orderService';
export type { 
  Order, 
  OrderItem, 
  OrderWithItems, 
  OrderStatus, 
  CreateOrderRequest, 
  CreateAuxiliaryOrderRequest, 
  CreateFinishedOrderRequest, 
  OrderFilters, 
  OrderListResponse, 
  UpdateOrderStatusRequest, 
  UpdateOrderNameRequest 
} from './orderService';

// 圖片上傳服務
export { uploadService, UploadService } from './uploadService';
export type { 
  UploadResponse, 
  UploadInfo, 
  ImagePickerResult, 
  ImageCompressionOptions 
} from './uploadService';