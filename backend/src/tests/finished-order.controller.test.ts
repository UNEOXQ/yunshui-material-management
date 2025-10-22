import request from 'supertest';
import app from '../server';
import { MaterialModel } from '../models/Material';
import { OrderModel } from '../models/Order';
import { ProjectModel } from '../models/Project';
import { StatusUpdateModel } from '../models/StatusUpdate';
import jwt from 'jsonwebtoken';

// Mock the models
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
jest.mock('../models/Order');
jest.mock('../models/Project');
jest.mock('../models/StatusUpdate');

const MockedMaterialModel = MaterialModel as jest.Mocked<typeof MaterialModel>;
const MockedOrderModel = OrderModel as jest.Mocked<typeof OrderModel>;
const MockedProjectModel = ProjectModel as jest.Mocked<typeof ProjectModel>;
const MockedStatusUpdateModel = StatusUpdateModel as jest.Mocked<typeof StatusUpdateModel>;

describe('Finished Material Order Controller', () => {
  let amToken: string;
  let pmToken: string;

  const mockFinishedMaterial = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: '完成材測試',
    category: '地板',
    price: 150.00,
    quantity: 50,
    imageUrl: '',
    supplier: '供應商A',
    type: 'FINISHED' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockAuxiliaryMaterial = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: '輔材測試',
    category: '五金',
    price: 25.00,
    quantity: 100,
    imageUrl: '',
    type: 'AUXILIARY' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockOrder = {
    id: '550e8400-e29b-41d4-a716-446655440003',
    userId: '550e8400-e29b-41d4-a716-446655440004',
    totalAmount: 750,
    status: 'PENDING' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockProject = {
    id: '550e8400-e29b-41d4-a716-446655440005',
    orderId: mockOrder.id,
    projectName: '完成材專案-2024-10-11-550e8400',
    overallStatus: 'ACTIVE' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeAll(() => {
    // Create JWT tokens
    amToken = jwt.sign(
      { userId: '550e8400-e29b-41d4-a716-446655440004', username: 'am_user', role: 'AM' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    pmToken = jwt.sign(
      { userId: '550e8400-e29b-41d4-a716-446655440006', username: 'pm_user', role: 'PM' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/orders/finished', () => {
    it('should create finished material order for AM user', async () => {
      // Mock material lookup
      MockedMaterialModel.findById.mockResolvedValue(mockFinishedMaterial);
      MockedMaterialModel.updateQuantity.mockResolvedValue(mockFinishedMaterial);
      
      // Mock order creation
      MockedOrderModel.create.mockResolvedValue(mockOrder);
      
      // Mock project creation
      MockedProjectModel.create.mockResolvedValue(mockProject);
      
      // Mock status update creation
      MockedStatusUpdateModel.create.mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440007',
        projectId: mockProject.id,
        updatedBy: '550e8400-e29b-41d4-a716-446655440004',
        statusType: 'ORDER',
        statusValue: '',
        createdAt: new Date()
      });

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
        .set('Authorization', `Bearer ${amToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order).toBeDefined();
      expect(response.body.data.project).toBeDefined();
      expect(response.body.data.supplierInfo).toBeDefined();
      expect(response.body.data.supplierInfo[0].supplier).toBe('供應商A');
      
      // Verify the correct models were called
      expect(MockedMaterialModel.findById).toHaveBeenCalledWith(mockFinishedMaterial.id);
      expect(MockedOrderModel.create).toHaveBeenCalled();
      expect(MockedProjectModel.create).toHaveBeenCalled();
      expect(MockedStatusUpdateModel.create).toHaveBeenCalledTimes(4); // Four status columns
    });

    it('should reject PM user trying to create finished material order', async () => {
      const orderData = {
        items: [
          {
            materialId: mockFinishedMaterial.id,
            quantity: 2
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders/finished')
        .set('Authorization', `Bearer ${pmToken}`)
        .send(orderData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only AM users can create finished material orders');
    });

    it('should reject auxiliary material in finished order', async () => {
      // Mock material lookup to return auxiliary material
      MockedMaterialModel.findById.mockResolvedValue(mockAuxiliaryMaterial);

      const orderData = {
        items: [
          {
            materialId: mockAuxiliaryMaterial.id,
            quantity: 3
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders/finished')
        .set('Authorization', `Bearer ${amToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a finished material');
    });

    it('should reject insufficient stock', async () => {
      // Mock material with insufficient stock
      const lowStockMaterial = { ...mockFinishedMaterial, quantity: 2 };
      MockedMaterialModel.findById.mockResolvedValue(lowStockMaterial);

      const orderData = {
        items: [
          {
            materialId: mockFinishedMaterial.id,
            quantity: 5 // More than available
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders/finished')
        .set('Authorization', `Bearer ${amToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient stock');
    });
  });

  describe('GET /api/orders/finished', () => {
    it('should get finished material orders for AM user', async () => {
      // Mock order retrieval
      MockedOrderModel.findByUserId.mockResolvedValue({
        orders: [mockOrder],
        total: 1
      });
      
      // Mock project lookup
      MockedProjectModel.findByOrderId.mockResolvedValue(mockProject);
      
      // Mock status updates
      MockedStatusUpdateModel.getLatestStatusesByProject.mockResolvedValue({
        ORDER: null,
        PICKUP: null,
        DELIVERY: null,
        CHECK: null
      });
      
      // Mock order items
      MockedOrderModel.getOrderItems.mockResolvedValue([
        {
          id: '550e8400-e29b-41d4-a716-446655440008',
          orderId: mockOrder.id,
          materialId: mockFinishedMaterial.id,
          quantity: 5,
          unitPrice: 150
        }
      ]);
      
      // Mock material lookup for supplier info
      MockedMaterialModel.findById.mockResolvedValue(mockFinishedMaterial);

      const response = await request(app)
        .get('/api/orders/finished')
        .set('Authorization', `Bearer ${amToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toBeDefined();
      expect(Array.isArray(response.body.data.orders)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should reject PM user trying to access finished material orders', async () => {
      const response = await request(app)
        .get('/api/orders/finished')
        .set('Authorization', `Bearer ${pmToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only AM users can access finished material orders');
    });
  });

  describe('PUT /api/orders/:id/confirm-finished', () => {
    it('should confirm finished material order for AM user', async () => {
      // Mock order lookup
      MockedOrderModel.findById.mockResolvedValue(mockOrder);
      
      // Mock order status update
      const confirmedOrder = { ...mockOrder, status: 'CONFIRMED' as const };
      MockedOrderModel.updateStatus.mockResolvedValue(confirmedOrder);
      
      // Mock project lookup (already exists)
      MockedProjectModel.findByOrderId.mockResolvedValue(mockProject);
      
      // Mock order items for supplier info
      MockedOrderModel.getOrderItems.mockResolvedValue([
        {
          id: '550e8400-e29b-41d4-a716-446655440008',
          orderId: mockOrder.id,
          materialId: mockFinishedMaterial.id,
          quantity: 5,
          unitPrice: 150
        }
      ]);
      
      // Mock material lookup for supplier info
      MockedMaterialModel.findById.mockResolvedValue(mockFinishedMaterial);

      const response = await request(app)
        .put(`/api/orders/${mockOrder.id}/confirm-finished`)
        .set('Authorization', `Bearer ${amToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('CONFIRMED');
      expect(response.body.data.project).toBeDefined();
      expect(response.body.data.supplierInfo).toBeDefined();
      expect(response.body.data.supplierInfo[0].supplier).toBe('供應商A');
    });

    it('should reject PM user trying to confirm finished material order', async () => {
      const response = await request(app)
        .put(`/api/orders/${mockOrder.id}/confirm-finished`)
        .set('Authorization', `Bearer ${pmToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only AM users can confirm finished material orders');
    });

    it('should reject confirming non-existent order', async () => {
      // Mock order not found
      MockedOrderModel.findById.mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/orders/${mockOrder.id}/confirm-finished`)
        .set('Authorization', `Bearer ${amToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Order not found');
    });

    it('should reject confirming already confirmed order', async () => {
      // Mock already confirmed order
      const confirmedOrder = { ...mockOrder, status: 'CONFIRMED' as const };
      MockedOrderModel.findById.mockResolvedValue(confirmedOrder);

      const response = await request(app)
        .put(`/api/orders/${mockOrder.id}/confirm-finished`)
        .set('Authorization', `Bearer ${amToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only pending orders can be confirmed');
    });
  });

  describe('Supplier Information Handling', () => {
    it('should handle materials without supplier information', async () => {
      // Mock material without supplier
      const materialWithoutSupplier = { ...mockFinishedMaterial, supplier: undefined };
      MockedMaterialModel.findById.mockResolvedValue(materialWithoutSupplier);
      MockedMaterialModel.updateQuantity.mockResolvedValue(materialWithoutSupplier);
      MockedOrderModel.create.mockResolvedValue(mockOrder);
      MockedProjectModel.create.mockResolvedValue(mockProject);
      MockedStatusUpdateModel.create.mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440007',
        projectId: mockProject.id,
        updatedBy: '550e8400-e29b-41d4-a716-446655440004',
        statusType: 'ORDER',
        statusValue: '',
        createdAt: new Date()
      });

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
        .set('Authorization', `Bearer ${amToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.supplierInfo).toBeDefined();
      expect(response.body.data.supplierInfo[0].supplier).toBeUndefined();
    });
  });
});