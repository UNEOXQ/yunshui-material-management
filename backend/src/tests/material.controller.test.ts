import request from 'supertest';
import app from '../server';
import { MaterialModel } from '../models/Material';
import { Material } from '../types';

// Mock the MaterialModel
jest.mock('../models/Material');

// Mock JWT middleware
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { userId: 'test-user-id', username: 'testuser', role: 'ADMIN' };
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

const mockMaterial: Material = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Material',
  category: 'Test Category',
  price: 100.50,
  quantity: 10,
  imageUrl: 'http://example.com/image.jpg',
  supplier: 'Test Supplier',
  type: 'AUXILIARY',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
};

const mockMaterialSerialized = {
  ...mockMaterial,
  createdAt: mockMaterial.createdAt.toISOString(),
  updatedAt: mockMaterial.updatedAt.toISOString()
};

describe('Material Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/materials', () => {
    test('should create a new material successfully', async () => {
      const createData = {
        name: 'Test Material',
        category: 'Test Category',
        price: 100.50,
        quantity: 10,
        supplier: 'Test Supplier',
        type: 'AUXILIARY'
      };

      (MaterialModel.create as jest.Mock).mockResolvedValue(mockMaterial);

      const response = await request(app)
        .post('/api/materials')
        .send(createData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockMaterialSerialized);
      expect(response.body.message).toBe('Material created successfully');
      expect(MaterialModel.create).toHaveBeenCalledWith(createData);
    });

    test('should return 400 for invalid material data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        category: 'Test Category',
        price: -10, // Invalid: negative price
        quantity: 10,
        type: 'AUXILIARY'
      };

      const response = await request(app)
        .post('/api/materials')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('GET /api/materials', () => {
    test('should get materials with pagination', async () => {
      const mockResult = {
        materials: [mockMaterial],
        total: 1
      };

      (MaterialModel.findAll as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/materials')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.materials).toEqual([mockMaterialSerialized]);
      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      });
    });

    test('should get materials with filters', async () => {
      const mockResult = {
        materials: [mockMaterial],
        total: 1
      };

      (MaterialModel.findAll as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/materials')
        .query({ 
          type: 'AUXILIARY',
          category: 'Test Category',
          search: 'test'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(MaterialModel.findAll).toHaveBeenCalledWith(
        {
          type: 'AUXILIARY',
          category: 'Test Category',
          search: 'test'
        },
        1,
        10
      );
    });
  });

  describe('GET /api/materials/:id', () => {
    test('should get material by ID', async () => {
      (MaterialModel.findById as jest.Mock).mockResolvedValue(mockMaterial);

      const response = await request(app)
        .get(`/api/materials/${mockMaterial.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockMaterialSerialized);
      expect(MaterialModel.findById).toHaveBeenCalledWith(mockMaterial.id);
    });

    test('should return 404 for non-existent material', async () => {
      (MaterialModel.findById as jest.Mock).mockResolvedValue(null);

      const validUuid = '550e8400-e29b-41d4-a716-446655440001';
      const response = await request(app)
        .get(`/api/materials/${validUuid}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Material not found');
    });

    test('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/materials/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Material ID must be a valid UUID');
    });
  });

  describe('PUT /api/materials/:id', () => {
    test('should update material successfully', async () => {
      const updateData = {
        name: 'Updated Material',
        price: 150.75
      };

      const updatedMaterial = { ...mockMaterial, ...updateData };
      (MaterialModel.update as jest.Mock).mockResolvedValue(updatedMaterial);

      const response = await request(app)
        .put(`/api/materials/${mockMaterial.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        ...updatedMaterial,
        createdAt: updatedMaterial.createdAt.toISOString(),
        updatedAt: updatedMaterial.updatedAt.toISOString()
      });
      expect(MaterialModel.update).toHaveBeenCalledWith(mockMaterial.id, updateData);
    });

    test('should return 404 for non-existent material', async () => {
      (MaterialModel.update as jest.Mock).mockResolvedValue(null);

      const validUuid = '550e8400-e29b-41d4-a716-446655440001';
      const response = await request(app)
        .put(`/api/materials/${validUuid}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Material not found');
    });
  });

  describe('DELETE /api/materials/:id', () => {
    test('should delete material successfully', async () => {
      (MaterialModel.exists as jest.Mock).mockResolvedValue(true);
      (MaterialModel.delete as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/materials/${mockMaterial.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Material deleted successfully');
      expect(MaterialModel.delete).toHaveBeenCalledWith(mockMaterial.id);
    });

    test('should return 404 for non-existent material', async () => {
      (MaterialModel.exists as jest.Mock).mockResolvedValue(false);

      const validUuid = '550e8400-e29b-41d4-a716-446655440001';
      const response = await request(app)
        .delete(`/api/materials/${validUuid}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Material not found');
    });
  });

  describe('GET /api/materials/type/:type', () => {
    test('should get materials by type', async () => {
      (MaterialModel.findByType as jest.Mock).mockResolvedValue([mockMaterial]);

      const response = await request(app)
        .get('/api/materials/type/AUXILIARY');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.materials).toEqual([mockMaterialSerialized]);
      expect(response.body.data.type).toBe('AUXILIARY');
      expect(MaterialModel.findByType).toHaveBeenCalledWith('AUXILIARY');
    });

    test('should return 400 for invalid type', async () => {
      const response = await request(app)
        .get('/api/materials/type/INVALID');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Type must be either AUXILIARY or FINISHED');
    });
  });

  describe('GET /api/materials/categories', () => {
    test('should get all categories', async () => {
      const mockCategories = ['Category 1', 'Category 2'];
      (MaterialModel.getCategories as jest.Mock).mockResolvedValue(mockCategories);

      const response = await request(app)
        .get('/api/materials/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toEqual(mockCategories);
      expect(MaterialModel.getCategories).toHaveBeenCalledWith(undefined);
    });

    test('should get categories filtered by type', async () => {
      const mockCategories = ['Category 1'];
      (MaterialModel.getCategories as jest.Mock).mockResolvedValue(mockCategories);

      const response = await request(app)
        .get('/api/materials/categories')
        .query({ type: 'AUXILIARY' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toEqual(mockCategories);
      expect(MaterialModel.getCategories).toHaveBeenCalledWith('AUXILIARY');
    });
  });

  describe('PATCH /api/materials/:id/quantity', () => {
    test('should update material quantity successfully', async () => {
      const updatedMaterial = { ...mockMaterial, quantity: 20 };
      (MaterialModel.updateQuantity as jest.Mock).mockResolvedValue(updatedMaterial);

      const response = await request(app)
        .patch(`/api/materials/${mockMaterial.id}/quantity`)
        .send({ quantity: 20 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        ...updatedMaterial,
        createdAt: updatedMaterial.createdAt.toISOString(),
        updatedAt: updatedMaterial.updatedAt.toISOString()
      });
      expect(MaterialModel.updateQuantity).toHaveBeenCalledWith(mockMaterial.id, 20);
    });

    test('should return 400 for invalid quantity', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440001';
      const response = await request(app)
        .patch(`/api/materials/${validUuid}/quantity`)
        .send({ quantity: -5 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Quantity must be a non-negative integer');
    });
  });
});