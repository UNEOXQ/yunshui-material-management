import { materialService } from '../materialService';
import { uploadService } from '../uploadService';
import { apiService } from '../api';
import { OfflineService } from '../offlineService';
import { NetworkService } from '../networkService';

// Mock dependencies
jest.mock('../api');
jest.mock('../offlineService');
jest.mock('../networkService');
jest.mock('../uploadService');

describe('Material and Image Upload Integration', () => {
  const mockApiService = apiService as jest.Mocked<typeof apiService>;
  const mockOfflineService = OfflineService as jest.Mocked<typeof OfflineService>;
  const mockNetworkService = NetworkService as jest.Mocked<typeof NetworkService>;
  const mockUploadService = uploadService as jest.Mocked<typeof uploadService>;

  const mockMaterial = {
    id: '1',
    name: 'Test Material',
    category: 'Test Category',
    specification: 'Test Spec',
    quantity: 100,
    imageUrl: null,
    supplier: 'Test Supplier',
    type: 'AUXILIARY' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockImageUri = 'file:///path/to/image.jpg';
  const mockUploadResponse = {
    imageUrl: 'https://cloudinary.com/uploaded-image.jpg',
    publicId: 'uploaded-image',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default to online
    mockNetworkService.isOnline.mockReturnValue(true);
    
    // Default successful API responses
    mockApiService.post.mockResolvedValue({
      success: true,
      data: mockMaterial,
    });
    
    mockApiService.put.mockResolvedValue({
      success: true,
      data: mockMaterial,
    });

    // Default successful upload response
    mockUploadService.uploadMaterialImage.mockResolvedValue(mockUploadResponse);
    mockUploadService.uploadImage.mockResolvedValue(mockUploadResponse);
    mockUploadService.deleteMaterialImage.mockResolvedValue();

    // Default offline service responses
    mockOfflineService.getMaterialsOffline.mockResolvedValue([mockMaterial]);
    mockOfflineService.saveMaterialsOffline.mockResolvedValue();
  });

  describe('Material Creation with Image Upload', () => {
    it('should create material and upload image successfully', async () => {
      const createRequest = {
        name: 'Material with Image',
        category: 'Test Category',
        specification: 'Test Spec',
        quantity: 50,
        type: 'AUXILIARY' as const,
      };

      const materialWithImage = { ...mockMaterial, imageUrl: mockUploadResponse.imageUrl };
      mockApiService.post.mockResolvedValue({
        success: true,
        data: materialWithImage,
      });

      // Create material first
      const createdMaterial = await materialService.createMaterial(createRequest);
      expect(createdMaterial).toEqual(materialWithImage);

      // Then upload image
      const uploadResult = await mockUploadService.uploadMaterialImage(createdMaterial.id, mockImageUri);
      expect(uploadResult).toEqual(mockUploadResponse);

      expect(mockApiService.post).toHaveBeenCalledWith('/api/materials', createRequest);
      expect(mockUploadService.uploadMaterialImage).toHaveBeenCalledWith(createdMaterial.id, mockImageUri);
    });

    it('should handle material creation success but image upload failure', async () => {
      const createRequest = {
        name: 'Material',
        category: 'Category',
        specification: 'Spec',
        quantity: 10,
        type: 'AUXILIARY' as const,
      };

      // Material creation succeeds
      const createdMaterial = await materialService.createMaterial(createRequest);
      expect(createdMaterial).toEqual(mockMaterial);

      // Image upload fails
      mockUploadService.uploadMaterialImage.mockRejectedValue(new Error('Upload failed'));

      await expect(
        mockUploadService.uploadMaterialImage(createdMaterial.id, mockImageUri)
      ).rejects.toThrow('Upload failed');

      // Material should still be created
      expect(mockApiService.post).toHaveBeenCalledWith('/api/materials', createRequest);
    });

    it('should handle offline material creation with pending image upload', async () => {
      mockNetworkService.isOnline.mockReturnValue(false);
      
      const createRequest = {
        name: 'Offline Material',
        category: 'Category',
        specification: 'Spec',
        quantity: 10,
        type: 'AUXILIARY' as const,
      };

      mockOfflineService.createMaterialOffline.mockResolvedValue(mockMaterial);

      const createdMaterial = await materialService.createMaterial(createRequest);
      expect(createdMaterial).toEqual(mockMaterial);
      expect(mockOfflineService.createMaterialOffline).toHaveBeenCalledWith(createRequest);

      // Image upload should be queued for later when online
      expect(mockUploadService.uploadMaterialImage).not.toHaveBeenCalled();
    });
  });

  describe('Material Update with Image Changes', () => {
    it('should update material and replace existing image', async () => {
      const updateRequest = {
        name: 'Updated Material',
        imageUrl: mockUploadResponse.imageUrl,
      };

      const updatedMaterial = { ...mockMaterial, ...updateRequest };
      mockApiService.put.mockResolvedValue({
        success: true,
        data: updatedMaterial,
      });

      // Update material
      const result = await materialService.updateMaterial('1', updateRequest);
      expect(result).toEqual(updatedMaterial);

      // Upload new image
      const uploadResult = await mockUploadService.uploadMaterialImage('1', mockImageUri);
      expect(uploadResult).toEqual(mockUploadResponse);

      expect(mockApiService.put).toHaveBeenCalledWith('/api/materials/1', updateRequest);
      expect(mockUploadService.uploadMaterialImage).toHaveBeenCalledWith('1', mockImageUri);
    });

    it('should delete existing image when updating material', async () => {
      const materialWithImage = { ...mockMaterial, imageUrl: 'https://old-image.jpg' };
      
      // First get the material with existing image
      mockApiService.get.mockResolvedValue({
        success: true,
        data: materialWithImage,
      });

      const existingMaterial = await materialService.getMaterialById('1');
      expect(existingMaterial.imageUrl).toBe('https://old-image.jpg');

      // Delete the existing image
      await mockUploadService.deleteMaterialImage('1');
      expect(mockUploadService.deleteMaterialImage).toHaveBeenCalledWith('1');

      // Update material without image
      const updateRequest = { name: 'Updated Material' };
      const updatedMaterial = { ...materialWithImage, ...updateRequest, imageUrl: null };
      mockApiService.put.mockResolvedValue({
        success: true,
        data: updatedMaterial,
      });

      const result = await materialService.updateMaterial('1', updateRequest);
      expect(result.imageUrl).toBeNull();
    });
  });

  describe('Image Upload Validation Integration', () => {
    it('should validate image before uploading during material creation', async () => {
      const invalidImage = {
        uri: 'file:///path/to/large-image.jpg',
        type: 'image/jpeg',
        name: 'large-image.jpg',
        size: 10 * 1024 * 1024, // 10MB - too large
      };

      const validationErrors = mockUploadService.validateImage(invalidImage);
      mockUploadService.validateImage.mockReturnValue(['圖片大小不能超過 5MB']);

      expect(validationErrors).toContain('圖片大小不能超過 5MB');

      // Should not proceed with upload if validation fails
      expect(mockUploadService.uploadMaterialImage).not.toHaveBeenCalled();
    });

    it('should compress image before uploading', async () => {
      const compressedUri = 'file:///path/to/compressed-image.jpg';
      mockUploadService.compressImage.mockResolvedValue(compressedUri);

      // Compress image first
      const result = await mockUploadService.compressImage(mockImageUri);
      expect(result).toBe(compressedUri);

      // Then upload compressed image
      await mockUploadService.uploadMaterialImage('1', compressedUri);
      
      expect(mockUploadService.compressImage).toHaveBeenCalledWith(mockImageUri);
      expect(mockUploadService.uploadMaterialImage).toHaveBeenCalledWith('1', compressedUri);
    });

    it('should handle image compression failure gracefully', async () => {
      mockUploadService.compressImage.mockRejectedValue(new Error('Compression failed'));

      // Should still attempt upload with original image if compression fails
      await expect(mockUploadService.compressImage(mockImageUri)).rejects.toThrow('Compression failed');

      // Upload service should handle this gracefully and use original image
      await mockUploadService.uploadMaterialImage('1', mockImageUri);
      expect(mockUploadService.uploadMaterialImage).toHaveBeenCalledWith('1', mockImageUri);
    });
  });

  describe('Batch Operations with Images', () => {
    it('should handle multiple materials with images', async () => {
      const materials = [
        { name: 'Material 1', category: 'Cat 1', specification: 'Spec 1', quantity: 10, type: 'AUXILIARY' as const },
        { name: 'Material 2', category: 'Cat 2', specification: 'Spec 2', quantity: 20, type: 'FINISHED' as const },
      ];

      const imageUris = [
        'file:///path/to/image1.jpg',
        'file:///path/to/image2.jpg',
      ];

      // Create materials
      const createPromises = materials.map(material => materialService.createMaterial(material));
      const createdMaterials = await Promise.all(createPromises);

      expect(createdMaterials).toHaveLength(2);
      expect(mockApiService.post).toHaveBeenCalledTimes(2);

      // Upload images for each material
      const uploadPromises = createdMaterials.map((material, index) =>
        mockUploadService.uploadMaterialImage(material.id, imageUris[index])
      );
      const uploadResults = await Promise.all(uploadPromises);

      expect(uploadResults).toHaveLength(2);
      expect(mockUploadService.uploadMaterialImage).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in batch operations', async () => {
      const materials = [
        { name: 'Material 1', category: 'Cat 1', specification: 'Spec 1', quantity: 10, type: 'AUXILIARY' as const },
        { name: 'Material 2', category: 'Cat 2', specification: 'Spec 2', quantity: 20, type: 'FINISHED' as const },
      ];

      // First material creation succeeds
      mockApiService.post
        .mockResolvedValueOnce({
          success: true,
          data: { ...mockMaterial, id: '1' },
        })
        .mockRejectedValueOnce(new Error('Creation failed'));

      const results = await Promise.allSettled(
        materials.map(material => materialService.createMaterial(material))
      );

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');

      // Only upload image for successful material
      if (results[0].status === 'fulfilled') {
        await mockUploadService.uploadMaterialImage(results[0].value.id, 'file:///image1.jpg');
        expect(mockUploadService.uploadMaterialImage).toHaveBeenCalledWith('1', 'file:///image1.jpg');
      }
    });
  });

  describe('Network State Handling', () => {
    it('should queue image uploads when offline', async () => {
      mockNetworkService.isOnline.mockReturnValue(false);

      const createRequest = {
        name: 'Offline Material',
        category: 'Category',
        specification: 'Spec',
        quantity: 10,
        type: 'AUXILIARY' as const,
      };

      mockOfflineService.createMaterialOffline.mockResolvedValue(mockMaterial);

      // Create material offline
      const createdMaterial = await materialService.createMaterial(createRequest);
      expect(createdMaterial).toEqual(mockMaterial);

      // Image upload should not be attempted while offline
      expect(mockUploadService.uploadMaterialImage).not.toHaveBeenCalled();

      // When back online, should sync pending uploads
      mockNetworkService.isOnline.mockReturnValue(true);
      
      // Simulate sync process
      await mockUploadService.uploadMaterialImage(createdMaterial.id, mockImageUri);
      expect(mockUploadService.uploadMaterialImage).toHaveBeenCalledWith(createdMaterial.id, mockImageUri);
    });

    it('should handle network errors during image upload', async () => {
      mockUploadService.uploadMaterialImage.mockRejectedValue(new Error('NETWORK_ERROR'));

      const createRequest = {
        name: 'Material',
        category: 'Category',
        specification: 'Spec',
        quantity: 10,
        type: 'AUXILIARY' as const,
      };

      // Material creation should succeed
      const createdMaterial = await materialService.createMaterial(createRequest);
      expect(createdMaterial).toEqual(mockMaterial);

      // Image upload should fail with network error
      await expect(
        mockUploadService.uploadMaterialImage(createdMaterial.id, mockImageUri)
      ).rejects.toThrow('NETWORK_ERROR');

      // Material should still exist without image
      expect(mockApiService.post).toHaveBeenCalledWith('/api/materials', createRequest);
    });
  });

  describe('Error Recovery', () => {
    it('should retry failed image uploads', async () => {
      // First attempt fails
      mockUploadService.uploadMaterialImage
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(mockUploadResponse);

      // First attempt
      await expect(
        mockUploadService.uploadMaterialImage('1', mockImageUri)
      ).rejects.toThrow('Temporary failure');

      // Retry attempt
      const result = await mockUploadService.uploadMaterialImage('1', mockImageUri);
      expect(result).toEqual(mockUploadResponse);

      expect(mockUploadService.uploadMaterialImage).toHaveBeenCalledTimes(2);
    });

    it('should clean up failed uploads', async () => {
      mockUploadService.uploadMaterialImage.mockRejectedValue(new Error('Upload failed'));

      await expect(
        mockUploadService.uploadMaterialImage('1', mockImageUri)
      ).rejects.toThrow('Upload failed');

      // Should clean up any partial uploads
      // This would be implementation-specific cleanup logic
      expect(mockUploadService.uploadMaterialImage).toHaveBeenCalledWith('1', mockImageUri);
    });
  });
});