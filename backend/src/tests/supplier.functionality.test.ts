import request from 'supertest';
import app from '../server';
import { MaterialModel } from '../models/Material';
import { OrderModel } from '../models/Order';
import { ProjectModel } from '../models/Project';
import jwt from 'jsonwebtoken';

// Mock the models
jest.mock('../models/Material');
jest.mock('../models/Order');
jest.mock('../models/Project');
jest.mock('../models/StatusUpdate');

const MockedMaterialModel = MaterialModel as jest.Mocked<typeof MaterialModel>;
const MockedOrderModel = OrderModel as jest.Mocked<typeof OrderModel>;
const MockedProjectModel = ProjectModel as jest.Mocked<typeof ProjectModel>;

describe('Supplier Functionality Tests', () => {
  let amToken: string;

  const mockFinishedMaterialWithSupplier = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: '高級地板',
    category: '地板',
    price: 200.00,
    quantity: 30,
    imageUrl: 'http://example.com/floor.jpg',
    supplier: '台灣地板供應商',
    type: 'FINISHED' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockFinishedMaterialWithoutSupplier = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: '標準地板',
    category: '地板',
    price: 150.00,
    quantity: 25,
    imageUrl: 'http://example.com/standard-floor.jpg',
    type: 'FINISHED' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockMultipleSupplierMaterials = [
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: '供應商A地板',
      category: '地板',
      price: 180.00,
      quantity: 20,
      imageUrl: 'http://example.com/supplier-a-floor.jpg',
      supplier: '供應商A',
      type: 'FINISHED' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      name: '供應商B地板',
      category: '地板',
      price: 190.00,
      quantity: 15,
      imageUrl: 'http://example.com/supplier-b-floor.jpg',
      supplier: '供應商B',
      type: 'FINISHED' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      name: '供應商A瓷磚',
      category: '瓷磚',
      price: 120.00,
      quantity: 40,
      imageUrl: 'http://example.com/supplier-a-tile.jpg',
      supplier: '供應商A',
      type: 'FINISHED' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeAll(() => {
    amToken = jwt.sign(
      { userId: '550e8400-e29b-41d4-a716-446655440006', username: 'am_user', role: 'AM' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Supplier Information Display - Requirement 3.1', () => {
    test('should display supplier information when viewing finished materials', async () => {
      MockedMaterialModel.findAll.mockResolvedValue({
        materials: [
          mockFinishedMaterialWithSupplier,
          mockFinishedMaterialWithoutSupplier
        ],
        total: 2
      });

      const response = await request(app)
        .get('/api/materials?type=FINISHED')
        .set('Authorization', `Bearer ${amToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.materials).toHaveLength(2);
      
      // Material with supplier should display supplier info
      const materialWithSupplier = response.body.data.materials.find((m: any) => m.id === mockFinishedMaterialWithSupplier.id);
      expect(materialWithSupplier.supplier).toBe('台灣地板供應商');
      
      // Material without supplier should not have supplier field or be undefined
      const materialWithoutSupplier = response.body.data.materials.find((m: any) => m.id === mockFinishedMaterialWithoutSupplier.id);
      expect(materialWithoutSupplier.supplier).toBeUndefined();
    });

    test('should include supplier information in material selection modal data', async () => {
      MockedMaterialModel.findByCategory.mockResolvedValue([
        mockFinishedMaterialWithSupplier
      ]);

      const response = await request(app)
        .get('/api/materials/category/地板?type=FINISHED')
        .set('Authorization', `Bearer ${amToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].supplier).toBe('台灣地板供應商');
      expect(response.body.data[0].name).toBe('高級地板');
      expect(response.body.data[0].price).toBe(200.00);
    });
  });

  describe('Supplier Filtering - Requirement 3.2', () => {
    test('should filter materials by supplier', async () => {
      MockedMaterialModel.findAll.mockResolvedValue({
        materials: [
          mockMultipleSupplierMaterials[0], // 供應商A地板
          mockMultipleSupplierMaterials[2]  // 供應商A瓷磚
        ],
        total: 2
      });

      const response = await request(app)
        .get('/api/materials?supplier=供應商A&type=FINISHED')
        .set('Authorization', `Bearer ${amToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.materials).toHaveLength(2);
      expect(response.body.data.materials.every((m: any) => m.supplier === '供應商A')).toBe(true);
      
      // Verify different categories from same supplier
      const categories = response.body.data.materials.map((m: any) => m.category);
      expect(categories).toContain('地板');
      expect(categories).toContain('瓷磚');
    });

    test('should return empty array when filtering by non-existent supplier', async () => {
      MockedMaterialModel.findAll.mockResolvedValue({
        materials: [],
        total: 0
      });

      const response = await request(app)
        .get('/api/materials?supplier=不存在的供應商&type=FINISHED')
        .set('Authorization', `Bearer ${amToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.materials).toHaveLength(0);
    });

    test('should get list of all suppliers for filtering options', async () => {
      MockedMaterialModel.getSuppliers.mockResolvedValue([
        '供應商A',
        '供應商B',
        '台灣地板供應商'
      ]);

      const response = await request(app)
        .get('/api/materials/suppliers?type=FINISHED')
        .set('Authorization', `Bearer ${amToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data).toContain('供應商A');
      expect(response.body.data).toContain('供應商B');
      expect(response.body.data).toContain('台灣地板供應商');
    });
  });

  describe('Supplier Information in Orders - Requirement 3.3', () => {
    test('should include supplier information when creating finished material order', async () => {
      const mockOrder = {
        id: '550e8400-e29b-41d4-a716-446655440007',
        userId: '550e8400-e29b-41d4-a716-446655440006',
        totalAmount: 400.00,
        status: 'PENDING' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockProject = {
        id: '550e8400-e29b-41d4-a716-446655440008',
        orderId: mockOrder.id,
        projectName: '完成材專案-2024-10-11-550e8400',
        overallStatus: 'ACTIVE' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      MockedMaterialModel.findById.mockResolvedValue(mockFinishedMaterialWithSupplier);
      MockedMaterialModel.updateQuantity.mockResolvedValue(mockFinishedMaterialWithSupplier);
      MockedOrderModel.create.mockResolvedValue(mockOrder);
      MockedProjectModel.create.mockResolvedValue(mockProject);

      const orderData = {
        items: [
          {
            materialId: mockFinishedMaterialWithSupplier.id,
            quantity: 2
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
      expect(response.body.data.supplierInfo).toHaveLength(1);
      expect(response.body.data.supplierInfo[0]).toMatchObject({
        materialId: mockFinishedMaterialWithSupplier.id,
        materialName: '高級地板',
        supplier: '台灣地板供應商',
        quantity: 2
      });
    });

    test('should handle mixed supplier information in single order', async () => {
      const mockOrder = {
        id: '550e8400-e29b-41d4-a716-446655440009',
        userId: '550e8400-e29b-41d4-a716-446655440006',
        totalAmount: 550.00,
        status: 'PENDING' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockProject = {
        id: '550e8400-e29b-41d4-a716-446655440010',
        orderId: mockOrder.id,
        projectName: '完成材專案-2024-10-11-550e8400',
        overallStatus: 'ACTIVE' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock multiple material lookups
      MockedMaterialModel.findById
        .mockResolvedValueOnce(mockFinishedMaterialWithSupplier)
        .mockResolvedValueOnce(mockFinishedMaterialWithoutSupplier);
      
      MockedMaterialModel.updateQuantity
        .mockResolvedValueOnce(mockFinishedMaterialWithSupplier)
        .mockResolvedValueOnce(mockFinishedMaterialWithoutSupplier);
      
      MockedOrderModel.create.mockResolvedValue(mockOrder);
      MockedProjectModel.create.mockResolvedValue(mockProject);

      const orderData = {
        items: [
          {
            materialId: mockFinishedMaterialWithSupplier.id,
            quantity: 1
          },
          {
            materialId: mockFinishedMaterialWithoutSupplier.id,
            quantity: 2
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
      expect(response.body.data.supplierInfo).toHaveLength(2);
      
      // Find supplier info for each material
      const supplierInfoWithSupplier = response.body.data.supplierInfo.find(
        (info: any) => info.materialId === mockFinishedMaterialWithSupplier.id
      );
      const supplierInfoWithoutSupplier = response.body.data.supplierInfo.find(
        (info: any) => info.materialId === mockFinishedMaterialWithoutSupplier.id
      );

      expect(supplierInfoWithSupplier.supplier).toBe('台灣地板供應商');
      expect(supplierInfoWithoutSupplier.supplier).toBeUndefined();
    });
  });

  describe('Supplier Information in Order History', () => {
    test('should include supplier information when retrieving order history', async () => {
      const mockOrder = {
        id: '550e8400-e29b-41d4-a716-446655440011',
        userId: '550e8400-e29b-41d4-a716-446655440006',
        totalAmount: 400.00,
        status: 'CONFIRMED' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockProject = {
        id: '550e8400-e29b-41d4-a716-446655440012',
        orderId: mockOrder.id,
        projectName: '完成材專案-2024-10-11-550e8400',
        overallStatus: 'ACTIVE' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockOrderItems = [
        {
          id: '550e8400-e29b-41d4-a716-446655440013',
          orderId: mockOrder.id,
          materialId: mockFinishedMaterialWithSupplier.id,
          quantity: 2,
          unitPrice: 200.00
        }
      ];

      MockedOrderModel.findByUserId.mockResolvedValue({
        orders: [mockOrder],
        total: 1
      });
      MockedProjectModel.findByOrderId.mockResolvedValue(mockProject);
      MockedOrderModel.getOrderItems.mockResolvedValue(mockOrderItems);
      MockedMaterialModel.findById.mockResolvedValue(mockFinishedMaterialWithSupplier);

      const response = await request(app)
        .get('/api/orders/finished')
        .set('Authorization', `Bearer ${amToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].items).toBeDefined();
      expect(response.body.data.orders[0].items[0].supplier).toBe('台灣地板供應商');
      expect(response.body.data.orders[0].items[0].materialName).toBe('高級地板');
    });
  });

  describe('Supplier Data Validation', () => {
    test('should handle null supplier values gracefully', async () => {
      const materialWithNullSupplier = {
        ...mockFinishedMaterialWithSupplier,
        supplier: undefined
      };

      MockedMaterialModel.findById.mockResolvedValue(materialWithNullSupplier);

      const response = await request(app)
        .get(`/api/materials/${materialWithNullSupplier.id}`)
        .set('Authorization', `Bearer ${amToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.supplier).toBeUndefined();
    });

    test('should handle empty string supplier values', async () => {
      const materialWithEmptySupplier = {
        ...mockFinishedMaterialWithSupplier,
        supplier: ''
      };

      MockedMaterialModel.findById.mockResolvedValue(materialWithEmptySupplier);

      const response = await request(app)
        .get(`/api/materials/${materialWithEmptySupplier.id}`)
        .set('Authorization', `Bearer ${amToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.supplier).toBe('');
    });

    test('should validate supplier name length and format', async () => {
      const longSupplierName = 'A'.repeat(256); // Assuming max length is 255
      const materialWithLongSupplier = {
        ...mockFinishedMaterialWithSupplier,
        supplier: longSupplierName
      };

      MockedMaterialModel.create.mockRejectedValue(new Error('Supplier name too long'));

      const response = await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${amToken}`)
        .send(materialWithLongSupplier)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Supplier name too long');
    });
  });

  describe('Supplier Search and Filtering Performance', () => {
    test('should efficiently filter by supplier with large dataset', async () => {
      // Mock large dataset
      const largeMaterialSet = Array.from({ length: 100 }, (_, i) => ({
        id: `550e8400-e29b-41d4-a716-44665544${i.toString().padStart(4, '0')}`,
        name: `材料${i}`,
        category: '地板',
        price: 100 + i,
        quantity: 10,
        imageUrl: `http://example.com/material-${i}.jpg`,
        supplier: i % 3 === 0 ? '供應商A' : i % 3 === 1 ? '供應商B' : '供應商C',
        type: 'FINISHED' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const supplierAMaterials = largeMaterialSet.filter(m => m.supplier === '供應商A');
      MockedMaterialModel.findAll.mockResolvedValue({
        materials: supplierAMaterials,
        total: supplierAMaterials.length
      });

      const response = await request(app)
        .get('/api/materials?supplier=供應商A&type=FINISHED')
        .set('Authorization', `Bearer ${amToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.materials).toHaveLength(supplierAMaterials.length);
      expect(response.body.data.materials.every((m: any) => m.supplier === '供應商A')).toBe(true);
    });
  });

  describe('Supplier Information Export', () => {
    test('should include supplier information in order export data', async () => {
      const mockOrders = [
        {
          id: '550e8400-e29b-41d4-a716-446655440014',
          userId: '550e8400-e29b-41d4-a716-446655440006',
          totalAmount: 600.00,
          status: 'CONFIRMED' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockOrderItems = [
        {
          id: '550e8400-e29b-41d4-a716-446655440015',
          orderId: mockOrders[0].id,
          materialId: mockFinishedMaterialWithSupplier.id,
          quantity: 3,
          unitPrice: 200.00
        }
      ];

      MockedOrderModel.findByUserId.mockResolvedValue({
        orders: mockOrders,
        total: 1
      });
      MockedOrderModel.getOrderItems.mockResolvedValue(mockOrderItems);
      MockedMaterialModel.findById.mockResolvedValue(mockFinishedMaterialWithSupplier);

      const response = await request(app)
        .get('/api/orders/finished/export')
        .set('Authorization', `Bearer ${amToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].items[0]).toMatchObject({
        materialName: '高級地板',
        supplier: '台灣地板供應商',
        quantity: 3,
        unitPrice: 200.00
      });
    });
  });
});