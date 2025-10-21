import { UploadController } from '../controllers/uploadController';
import { MaterialModel } from '../models/Material';
import { Material } from '../types';

// Mock the MaterialModel
jest.mock('../models/Material');

const mockMaterial: Material = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Material',
  category: 'Test Category',
  price: 100.50,
  quantity: 10,
  imageUrl: '',
  supplier: 'Test Supplier',
  type: 'AUXILIARY',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
};

describe('Upload Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUploadInfo', () => {
    test('should return upload configuration', async () => {
      const mockReq = {
        user: { userId: 'test-user', username: 'testuser', role: 'ADMIN' }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await UploadController.getUploadInfo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          maxFileSize: '5MB',
          allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
          maxFiles: 1,
          uploadPath: '/api/upload/material/:id/image'
        },
        message: 'Upload information retrieved successfully'
      });
    });
  });

  describe('deleteMaterialImage', () => {
    test('should delete material image successfully', async () => {
      const materialWithImage = { 
        ...mockMaterial, 
        imageUrl: 'http://localhost:3000/uploads/materials/test-image.jpg' 
      };
      const updatedMaterial = { ...mockMaterial, imageUrl: '' };

      (MaterialModel.findById as jest.Mock).mockResolvedValue(materialWithImage);
      (MaterialModel.updateImageUrl as jest.Mock).mockResolvedValue(updatedMaterial);

      const mockReq = {
        params: { id: mockMaterial.id },
        user: { userId: 'test-user', username: 'testuser', role: 'ADMIN' }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await UploadController.deleteMaterialImage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: updatedMaterial,
        message: 'Material image deleted successfully'
      });
      expect(MaterialModel.updateImageUrl).toHaveBeenCalledWith(mockMaterial.id, '');
    });

    test('should return 403 for non-admin users', async () => {
      const mockReq = {
        params: { id: mockMaterial.id },
        user: { userId: 'test-user', username: 'testuser', role: 'PM' }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await UploadController.deleteMaterialImage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Only administrators can delete material images'
      });
    });

    test('should return 400 for invalid UUID', async () => {
      const mockReq = {
        params: { id: 'invalid-uuid' },
        user: { userId: 'test-user', username: 'testuser', role: 'ADMIN' }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await UploadController.deleteMaterialImage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid ID',
        message: 'Material ID must be a valid UUID'
      });
    });

    test('should return 404 for non-existent material', async () => {
      (MaterialModel.findById as jest.Mock).mockResolvedValue(null);

      const mockReq = {
        params: { id: '550e8400-e29b-41d4-a716-446655440001' },
        user: { userId: 'test-user', username: 'testuser', role: 'ADMIN' }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await UploadController.deleteMaterialImage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not found',
        message: 'Material not found'
      });
    });

    test('should return 400 when material has no image', async () => {
      (MaterialModel.findById as jest.Mock).mockResolvedValue(mockMaterial);

      const mockReq = {
        params: { id: mockMaterial.id },
        user: { userId: 'test-user', username: 'testuser', role: 'ADMIN' }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await UploadController.deleteMaterialImage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'No image',
        message: 'Material has no image to delete'
      });
    });
  });
});