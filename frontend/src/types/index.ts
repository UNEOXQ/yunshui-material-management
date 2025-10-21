// Core data model interfaces and types

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'PM' | 'AM' | 'WAREHOUSE' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  imageUrl: string;
  supplier?: string;
  type: 'AUXILIARY' | 'FINISHED';
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  name?: string; // 可選的訂單名稱
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  material?: Material;
  // Extended properties from backend
  materialName?: string;
  materialCategory?: string;
  materialType?: string;
  supplier?: string;
  imageUrl?: string;
}

export interface Project {
  id: string;
  orderId: string;
  projectName: string;
  overallStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  statusHistory: StatusUpdate[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StatusUpdate {
  id: string;
  projectId: string;
  updatedBy: string;
  statusType: 'ORDER' | 'PICKUP' | 'DELIVERY' | 'CHECK';
  statusValue: string;
  additionalData?: {
    time?: string;
    address?: string;
    po?: string;
    deliveredBy?: string;
  };
  createdAt: Date;
}

// Status type definitions
export interface OrderStatus {
  primary: '' | 'Ordered';
  secondary: '' | 'Processing' | 'waiting for pick' | 'pending';
}

export interface PickupStatus {
  primary: '' | 'Picked' | 'Failed';
  secondary: '' | '(B.T.W)' | '(D.T.S)' | '(B.T.W/MP)' | '(D.T.S/MP)' | '(E.S)' | '(E.H)';
}

export interface DeliveryStatus {
  primary: '' | 'Delivered';
  details?: {
    time: string;
    address: string;
    po: string;
    deliveredBy: string;
  };
}

export interface CheckStatus {
  value: '' | 'Check and sign(C.B/PM)' | '(C.B)' | 'WH)';
}

export interface ProjectStatus {
  orderStatus: OrderStatus;
  pickupStatus: PickupStatus;
  deliveryStatus: DeliveryStatus;
  checkStatus: CheckStatus;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Component prop types
export interface MaterialSelectorProps {
  userType: 'PM' | 'AM';
  onOrderCreate: (order: Order) => void;
}

export interface StatusManagerProps {
  projectId: string;
  currentStatus: ProjectStatus;
  onStatusUpdate: (status: StatusUpdate) => void;
}

export interface DatabaseManagerProps {
  onMaterialCreate: (material: Material) => void;
  onMaterialUpdate: (id: string, material: Partial<Material>) => void;
  onMaterialDelete: (id: string) => void;
}

// User Management types
export interface UserManagementProps {
  onUserCreate: (user: User) => void;
  onUserUpdate: (id: string, user: Partial<User>) => void;
  onUserDelete: (id: string) => void;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  role: User['role'];
  password: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: User['role'];
  password?: string;
}