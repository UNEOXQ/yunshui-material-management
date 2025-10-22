import request from 'supertest';
import app from '../server';

// Mock all models to avoid database dependencies
jest.mock('../models/Order');
jest.mock('../models/Material', () => ({
  MaterialModel: {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    updateImageUrl: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    hasQuantity: jest.fn(),
    updateQuantity: jest.fn(),
    getCategories: jest.fn(),
    findByType: jest.fn(),
    findByCategory: jest.fn(),
    getSuppliers: jest.fn()
  }
}));
jest.mock('../models/Project');
jest.mock('../models/StatusUpdate');
jest.mock('../models/User');

// Mock JWT middleware for AM user
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { userId: 'test-am-user-id', username: 'testam', role: 'AM' };
    next();
  },
  requireRole: (role: string) => (req: any, res: any, next: any) => {
    if (req.user?.role === role || req.user?.role === 'ADMIN') {
      next();
    } else {
      res.status(403).json({ success: false, error: 'Forbidden' });
    }
  }
}));

import { OrderModel } from '../models/Order';
import { MaterialModel } from '../models/Material';
import { ProjectModel } from '../models/Project';
import { StatusUpdateModel } from '../models/StatusUpdate';

const mockFinishedMaterial = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: '完成材測試',
  category: '地板',
  price: 150.00,
  quantity: 50,
  imageUrl: 'http://example.com/finished-material.jpg',
  supplier: '供應商A',
  type: 'FINISHED',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
};

const mockAuxiliaryMaterial = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: '輔材測試',
  category: '五金',
  price: 25.00,
  quantity: 100,
  imageUrl: 'http://example.com/auxiliary-material.jpg',
  type: 'AUXILIARY',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
};

const mockFinishedOrder = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  userId: 'test-am-user-id',
  totalAmount: 750.00,
  status: 'PENDING',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
};

const mockFinishedProject = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  orderId: '550e8400-e29b-41d4-a716-446655440002',
  projectName: '完成材專案-2023-01-01-550e8400',
  overallStatus: 'ACTIVE',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
};

describe('Finished Material Order Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Core Finished Material Order Flow', () => {
    test('should create finished material order with supplier information', async () => {
      // Mock material lookup
      (MaterialModel.findById as jest.Mock).mockResolvedValue(mockFinishedMaterial);
      (MaterialModel.updateQuantity as jest.Mock).mockResolvedValue(mockFinishedMaterial);
      
      // Mock order creation
      (OrderModel.create as jest.Mock).mockResolvedValue(mockFinishedOrder);
      
      // Mock project creation
      (ProjectModel.create as jest.Mock).mockResolvedValue(mockFinishedProject);
      
      // Mock status initialization
      (StatusUpdateModel.create as jest.Mock).mockResolvedValue({});

      const orderData = {
        items: [
          {
            materialId: mockFinishedMaterial.id,
            quantity: 5
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders/finished')
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.supplierInfo).toBeDefined();
      expect(response.body.data.supplierInfo[0].supplier).toBe('供應商A');
    });

    test('should validate finished material type', async () => {
      // Mock auxiliary material lookup
      (MaterialModel.findById as jest.Mock).mockResolvedValue(mockAuxiliaryMaterial);

      const orderData = {
        items: [
          {
            materialId: mockAuxiliaryMaterial.id,
            quantity: 2
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders/finished')
        .send(orderData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle supplier information correctly', async () => {
      // Mock material lookup
      (MaterialModel.findById as jest.Mock).mockResolvedValue(mockFinishedMaterial);
      (MaterialModel.updateQuantity as jest.Mock).mockResolvedValue(mockFinishedMaterial);
      (OrderModel.create as jest.Mock).mockResolvedValue(mockFinishedOrder);
      (ProjectModel.create as jest.Mock).mockResolvedValue(mockFinishedProject);
      (StatusUpdateModel.create as jest.Mock).mockResolvedValue({});

      const orderData = {
        items: [
          {
            materialId: mockFinishedMaterial.id,
            quantity: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders/finished')
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.data.supplierInfo).toBeDefined();
      expect(response.body.data.supplierInfo[0].supplier).toBe('供應商A');
    });
  });
});