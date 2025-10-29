import { Material, Order, User, OrderStatus } from '@types/index';

export interface SystemStatus {
  id: string;
  name: string;
  value: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE';
  category: string;
  description?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface StatusHistory {
  id: string;
  statusId: string;
  oldValue: string;
  newValue: string;
  updatedBy: string;
  updatedAt: string;
  reason?: string;
}

export const mockUser: User = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'ADMIN',
  token: 'mock-jwt-token',
};

export const mockMaterial: Material = {
  id: '1',
  name: '測試基材',
  category: '石材',
  specification: '30x30cm',
  unit: '片',
  price: 100,
  stock: 50,
  imageUrl: 'https://example.com/image.jpg',
  description: '測試用基材描述',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockMaterials: Material[] = [
  mockMaterial,
  {
    ...mockMaterial,
    id: '2',
    name: '測試基材2',
    category: '磁磚',
    price: 150,
    stock: 30,
  },
  {
    ...mockMaterial,
    id: '3',
    name: '測試基材3',
    category: '木材',
    price: 200,
    stock: 20,
  },
];

export const mockOrder: Order = {
  id: '1',
  orderNumber: 'ORD-001',
  customerName: '測試客戶',
  materials: [
    {
      materialId: '1',
      material: mockMaterial,
      quantity: 10,
      unitPrice: 100,
      subtotal: 1000,
    },
  ],
  status: 'PENDING' as OrderStatus,
  totalAmount: 1000,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockOrders: Order[] = [
  mockOrder,
  {
    ...mockOrder,
    id: '2',
    orderNumber: 'ORD-002',
    customerName: '測試客戶2',
    status: 'PROCESSING' as OrderStatus,
    totalAmount: 1500,
  },
  {
    ...mockOrder,
    id: '3',
    orderNumber: 'ORD-003',
    customerName: '測試客戶3',
    status: 'DELIVERED' as OrderStatus,
    totalAmount: 2000,
  },
];

export const createMockMaterial = (overrides: Partial<Material> = {}): Material => ({
  ...mockMaterial,
  ...overrides,
});

export const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  ...mockOrder,
  ...overrides,
});

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  ...mockUser,
  ...overrides,
});

export const mockStatus: SystemStatus = {
  id: '1',
  name: '系統狀態',
  value: '正常',
  type: 'TEXT',
  category: '系統',
  description: '系統運行狀態',
  updatedAt: '2024-01-01T00:00:00Z',
  updatedBy: '管理員',
};

export const mockStatuses: SystemStatus[] = [
  mockStatus,
  {
    id: '2',
    name: '庫存狀態',
    value: '100',
    type: 'NUMBER',
    category: '庫存',
    description: '當前庫存數量',
    updatedAt: '2024-01-01T01:00:00Z',
    updatedBy: '系統',
  },
  {
    id: '3',
    name: '維護模式',
    value: 'false',
    type: 'BOOLEAN',
    category: '系統',
    description: '是否處於維護模式',
    updatedAt: '2024-01-01T02:00:00Z',
    updatedBy: '管理員',
  },
  {
    id: '4',
    name: '最後備份時間',
    value: '2024-01-01T00:00:00Z',
    type: 'DATE',
    category: '備份',
    description: '系統最後備份時間',
    updatedAt: '2024-01-01T03:00:00Z',
    updatedBy: '系統',
  },
];

export const mockStatusHistory: StatusHistory[] = [
  {
    id: '1',
    statusId: '1',
    oldValue: '異常',
    newValue: '正常',
    updatedBy: '管理員',
    updatedAt: '2024-01-01T00:00:00Z',
    reason: '系統恢復正常運行',
  },
  {
    id: '2',
    statusId: '1',
    oldValue: '正常',
    newValue: '異常',
    updatedBy: '系統',
    updatedAt: '2023-12-31T23:00:00Z',
    reason: '檢測到系統異常',
  },
];

export const createMockStatus = (overrides: Partial<SystemStatus> = {}): SystemStatus => ({
  ...mockStatus,
  ...overrides,
});

export const createMockStatusHistory = (overrides: Partial<StatusHistory> = {}): StatusHistory => ({
  ...mockStatusHistory[0],
  ...overrides,
});