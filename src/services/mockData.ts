// 模擬數據，用於測試組件功能
import { User, Material, Order } from '../types';

export let mockUsers: User[] = [
  {
    id: 'user-1',
    username: 'admin',
    email: 'admin@yunshui.com',
    role: 'ADMIN',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'user-2',
    username: 'pm001',
    email: 'pm001@yunshui.com',
    role: 'PM',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  },
  {
    id: 'user-3',
    username: 'am001',
    email: 'am001@yunshui.com',
    role: 'AM',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03')
  },
  {
    id: 'user-4',
    username: 'warehouse001',
    email: 'warehouse001@yunshui.com',
    role: 'WAREHOUSE',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04')
  }
];

export let mockMaterials: Material[] = [
  {
    id: 'material-1',
    name: '螺絲釘 M6x20',
    category: '五金配件',
    price: 2.5,
    quantity: 1000,
    imageUrl: null,
    supplier: '五金供應商A',
    type: 'AUXILIARY',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'material-2',
    name: '木板 2x4x8',
    category: '木材',
    price: 45.0,
    quantity: 200,
    imageUrl: null,
    supplier: '木材供應商B',
    type: 'FINISHED',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  },
  {
    id: 'material-3',
    name: '電線 2.5mm²',
    category: '電氣材料',
    price: 8.5,
    quantity: 500,
    imageUrl: null,
    supplier: '電氣供應商C',
    type: 'AUXILIARY',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03')
  },
  {
    id: 'material-4',
    name: '水泥 50kg',
    category: '建材',
    price: 180.0,
    quantity: 100,
    imageUrl: null,
    supplier: '建材供應商D',
    type: 'FINISHED',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04')
  },
  {
    id: 'material-5',
    name: '油漆 白色 5L',
    category: '塗料',
    price: 120.0,
    quantity: 80,
    imageUrl: null,
    supplier: '塗料供應商E',
    type: 'AUXILIARY',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  }
];

export let mockOrders: Order[] = [
  {
    id: 'order-1',
    userId: 'user-2',
    totalAmount: 250.0,
    status: 'PENDING',
    items: [
      {
        id: 'item-1',
        orderId: 'order-1',
        materialId: 'material-1',
        quantity: 100,
        unitPrice: 2.5,
        material: mockMaterials[0]
      }
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'order-2',
    userId: 'user-3',
    totalAmount: 360.0,
    status: 'CONFIRMED',
    items: [
      {
        id: 'item-2',
        orderId: 'order-2',
        materialId: 'material-2',
        quantity: 8,
        unitPrice: 45.0,
        material: mockMaterials[1]
      }
    ],
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11')
  }
];

// 模擬 API 延遲
export const mockDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));

// 模擬 API 響應
export const createMockResponse = <T>(data: T, success: boolean = true, message?: string) => ({
  success,
  data: success ? data : undefined,
  message: message || (success ? 'Success' : 'Error')
});