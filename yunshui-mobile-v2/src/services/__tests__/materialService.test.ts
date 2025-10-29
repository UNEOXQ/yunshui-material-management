import { materialService, MaterialService } from '../materialService';
import { apiService } from '../api';
import { OfflineService } from '../offlineService';
import { NetworkService } from '../networkService';

// Mock dependencies
jest.mock('../api');
jest.mock('../offlineService');
jest.mock('../networkService');

describe('MaterialService', () => {
  const mockApiService = apiService as jest.Mocked<typeof apiService>;
  const mockOfflineService = OfflineService as jest.Mocked<typeof OfflineService>;
  const mockNetworkService = NetworkService as jest.Mocked<typeof NetworkService>;

  const mockMaterial = {
    id: '1',
    name: 'Test Material',
    category: 'Test Category',
    specification: 'Test Spec',
    quantity: 100,
    imageUrl: 'https://example.com/image.jpg',
    supplier: 'Test Supplier',
    type: 'AUXILIARY' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockMaterialListResponse = {
    materials: [mockMaterial],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default to online
    mockNetworkService.isOnline.mockReturnValue(true);
    
    // Default successful API responses
    mockApiService.get.mockResolvedValue({
      success: true,
      data: mockMaterialListResponse,
    });
    
    mockApiService.post.mockResolvedValue({
      success: true,
      data: mockMaterial,
    });
    
    mockApiService.put.mockResolvedValue({
      success: true,
      data: mockMaterial,
    });
    
    mockApiService.delete.mockResolvedValue({
      success: true,
      data: undefined,
    });

    // Default offline service responses
    mockOfflineService.getMaterialsOffline.mockResolvedValue([mockMaterial]);
    mockOfflineService.saveMaterialsOffline.mockResolvedValue();
  });

  describe('getMaterials', () => {
    it('should fetch materials successfully when online', async () => {
      const result = await materialService.getMaterials();

      expect(mockApiService.get).toHaveBeenCalledWith('/api/materials');
      expect(mockOfflineService.saveMaterialsOffline).toHaveBeenCalledWith([mockMaterial]);
      expect(result).toEqual(mockMaterialListResponse);
    });

    it('should fetch materials from offline storage when offline', async () => {
      mockNetworkService.isOnline.mockReturnValue(false);

      const result = await materialService.getMaterials();

      expect(mockApiService.get).not.toHaveBeenCalled();
      expect(mockOfflineService.getMaterialsOffline).toHaveBeenCalled();
      expect(result.materials).toEqual([mockMaterial]);
    });

    it('should apply filters correctly in query params', async () => {
      const filters = {
        type: 'AUXILIARY' as const,
        category: 'Test Category',
        supplier: 'Test Supplier',
        search: 'test',
        page: 2,
        limit: 10,
      };

      await materialService.getMaterials(filters);

      expect(mockApiService.get).toHaveBeenCalledWith(
        '/api/materials?type=AUXILIARY&category=Test%20Category&supplier=Test%20Supplier&search=test&page=2&limit=10'
      );
    });

    it('should fallback to offline data when API request fails', async () => {
      mockApiService.get.mockRejectedValue(new Error('Network error'));

      const result = await materialService.getMaterials();

      expect(mockOfflineService.getMaterialsOffline).toHaveBeenCalled();
      expect(result.materials).toEqual([mockMaterial]);
    });

    it('should throw error when both API and offline fail', async () => {
      mockApiService.get.mockRejectedValue(new Error('Network error'));
      mockOfflineService.getMaterialsOffline.mockRejectedValue(new Error('Offline error'));

      await expect(materialService.getMaterials()).rejects.toThrow();
    });
  });

  describe('createMaterial', () => {
    const createRequest = {
      name: 'New Material',
      category: 'New Category',
      specification: 'New Spec',
      quantity: 50,
      type: 'AUXILIARY' as const,
    };

    it('should create material successfully when online', async () => {
      const result = await materialService.createMaterial(createRequest);

      expect(mockApiService.post).toHaveBeenCalledWith('/api/materials', createRequest);
      expect(mockOfflineService.saveMaterialsOffline).toHaveBeenCalled();
      expect(result).toEqual(mockMaterial);
    });

    it('should create material offline when offline', async () => {
      mockNetworkService.isOnline.mockReturnValue(false);
      mockOfflineService.createMaterialOffline.mockResolvedValue(mockMaterial);

      const result = await materialService.createMaterial(createRequest);

      expect(mockApiService.post).not.toHaveBeenCalled();
      expect(mockOfflineService.createMaterialOffline).toHaveBeenCalledWith(createRequest);
      expect(result).toEqual(mockMaterial);
    });

    it('should fallback to offline creation when API fails', async () => {
      mockApiService.post.mockRejectedValue(new Error('Network error'));
      mockOfflineService.createMaterialOffline.mockResolvedValue(mockMaterial);

      const result = await materialService.createMaterial(createRequest);

      expect(mockOfflineService.createMaterialOffline).toHaveBeenCalledWith(createRequest);
      expect(result).toEqual(mockMaterial);
    });
  });

  describe('updateMaterial', () => {
    const updateRequest = {
      name: 'Updated Material',
      quantity: 75,
    };

    it('should update material successfully when online', async () => {
      const result = await materialService.updateMaterial('1', updateRequest);

      expect(mockApiService.put).toHaveBeenCalledWith('/api/materials/1', updateRequest);
      expect(result).toEqual(mockMaterial);
    });

    it('should update material offline when offline', async () => {
      mockNetworkService.isOnline.mockReturnValue(false);
      mockOfflineService.updateMaterialOffline.mockResolvedValue(mockMaterial);

      const result = await materialService.updateMaterial('1', updateRequest);

      expect(mockApiService.put).not.toHaveBeenCalled();
      expect(mockOfflineService.updateMaterialOffline).toHaveBeenCalled();
      expect(result).toEqual(mockMaterial);
    });

    it('should throw error when material not found offline', async () => {
      mockNetworkService.isOnline.mockReturnValue(false);
      mockOfflineService.getMaterialsOffline.mockResolvedValue([]);

      await expect(materialService.updateMaterial('1', updateRequest)).rejects.toThrow('Material not found in offline storage');
    });
  });

  describe('deleteMaterial', () => {
    it('should delete material successfully when online', async () => {
      await materialService.deleteMaterial('1');

      expect(mockApiService.delete).toHaveBeenCalledWith('/api/materials/1');
      expect(mockOfflineService.saveMaterialsOffline).toHaveBeenCalled();
    });

    it('should delete material offline when offline', async () => {
      mockNetworkService.isOnline.mockReturnValue(false);

      await materialService.deleteMaterial('1');

      expect(mockApiService.delete).not.toHaveBeenCalled();
      expect(mockOfflineService.deleteMaterialOffline).toHaveBeenCalledWith('1');
    });

    it('should fallback to offline deletion when API fails', async () => {
      mockApiService.delete.mockRejectedValue(new Error('Network error'));

      await materialService.deleteMaterial('1');

      expect(mockOfflineService.deleteMaterialOffline).toHaveBeenCalledWith('1');
    });
  });

  describe('getMaterialById', () => {
    it('should fetch material by ID successfully', async () => {
      mockApiService.get.mockResolvedValue({
        success: true,
        data: mockMaterial,
      });

      const result = await materialService.getMaterialById('1');

      expect(mockApiService.get).toHaveBeenCalledWith('/api/materials/1');
      expect(result).toEqual(mockMaterial);
    });

    it('should handle API errors correctly', async () => {
      mockApiService.get.mockResolvedValue({
        success: false,
        error: 'Material not found',
      });

      await expect(materialService.getMaterialById('1')).rejects.toThrow('Material not found');
    });
  });

  describe('validateMaterialData', () => {
    it('should return no errors for valid data', () => {
      const validData = {
        name: 'Valid Material',
        category: 'Valid Category',
        specification: 'Valid Spec',
        quantity: 10,
        type: 'AUXILIARY' as const,
      };

      const errors = materialService.validateMaterialData(validData);

      expect(errors).toHaveLength(0);
    });

    it('should return no errors for valid update data with partial fields', () => {
      const validUpdateData = {
        name: 'Updated Material',
        quantity: 25,
      };

      const errors = materialService.validateMaterialData(validUpdateData);

      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid name', () => {
      const invalidData = {
        name: '',
        category: 'Valid Category',
        specification: 'Valid Spec',
        quantity: 10,
        type: 'AUXILIARY' as const,
      };

      const errors = materialService.validateMaterialData(invalidData);

      expect(errors).toContain('基材名稱不能為空');
    });

    it('should return errors for whitespace-only name', () => {
      const invalidData = {
        name: '   ',
        category: 'Valid Category',
        specification: 'Valid Spec',
        quantity: 10,
        type: 'AUXILIARY' as const,
      };

      const errors = materialService.validateMaterialData(invalidData);

      expect(errors).toContain('基材名稱不能為空');
    });

    it('should return errors for negative quantity', () => {
      const invalidData = {
        name: 'Valid Material',
        category: 'Valid Category',
        specification: 'Valid Spec',
        quantity: -5,
        type: 'AUXILIARY' as const,
      };

      const errors = materialService.validateMaterialData(invalidData);

      expect(errors).toContain('數量不能為負數');
    });

    it('should return errors for non-integer quantity', () => {
      const invalidData = {
        name: 'Valid Material',
        category: 'Valid Category',
        specification: 'Valid Spec',
        quantity: 10.5,
        type: 'AUXILIARY' as const,
      };

      const errors = materialService.validateMaterialData(invalidData);

      expect(errors).toContain('數量必須為整數');
    });

    it('should return errors for invalid type', () => {
      const invalidData = {
        name: 'Valid Material',
        category: 'Valid Category',
        specification: 'Valid Spec',
        quantity: 10,
        type: 'INVALID' as any,
      };

      const errors = materialService.validateMaterialData(invalidData);

      expect(errors).toContain('基材類型必須為 AUXILIARY 或 FINISHED');
    });

    it('should return errors for too long strings', () => {
      const invalidData = {
        name: 'a'.repeat(101),
        category: 'b'.repeat(51),
        specification: 'c'.repeat(201),
        supplier: 'd'.repeat(101),
        quantity: 10,
        type: 'AUXILIARY' as const,
      };

      const errors = materialService.validateMaterialData(invalidData);

      expect(errors).toContain('基材名稱不能超過100個字符');
      expect(errors).toContain('分類不能超過50個字符');
      expect(errors).toContain('規格不能超過200個字符');
      expect(errors).toContain('供應商名稱不能超過100個字符');
    });

    it('should validate empty category', () => {
      const invalidData = {
        name: 'Valid Material',
        category: '',
        specification: 'Valid Spec',
        quantity: 10,
        type: 'AUXILIARY' as const,
      };

      const errors = materialService.validateMaterialData(invalidData);

      expect(errors).toContain('分類不能為空');
    });

    it('should validate empty specification', () => {
      const invalidData = {
        name: 'Valid Material',
        category: 'Valid Category',
        specification: '',
        quantity: 10,
        type: 'AUXILIARY' as const,
      };

      const errors = materialService.validateMaterialData(invalidData);

      expect(errors).toContain('規格不能為空');
    });

    it('should validate whitespace-only category and specification', () => {
      const invalidData = {
        name: 'Valid Material',
        category: '   ',
        specification: '   ',
        quantity: 10,
        type: 'AUXILIARY' as const,
      };

      const errors = materialService.validateMaterialData(invalidData);

      expect(errors).toContain('分類不能為空');
      expect(errors).toContain('規格不能為空');
    });

    it('should allow empty supplier', () => {
      const validData = {
        name: 'Valid Material',
        category: 'Valid Category',
        specification: 'Valid Spec',
        quantity: 10,
        supplier: '',
        type: 'AUXILIARY' as const,
      };

      const errors = materialService.validateMaterialData(validData);

      expect(errors).toHaveLength(0);
    });

    it('should validate FINISHED type', () => {
      const validData = {
        name: 'Valid Material',
        category: 'Valid Category',
        specification: 'Valid Spec',
        quantity: 10,
        type: 'FINISHED' as const,
      };

      const errors = materialService.validateMaterialData(validData);

      expect(errors).toHaveLength(0);
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const invalidData = {
        name: '',
        category: '',
        specification: '',
        quantity: -1,
        type: 'INVALID' as any,
      };

      const errors = materialService.validateMaterialData(invalidData);

      expect(errors.length).toBeGreaterThan(1);
      expect(errors).toContain('基材名稱不能為空');
      expect(errors).toContain('分類不能為空');
      expect(errors).toContain('規格不能為空');
      expect(errors).toContain('數量不能為負數');
      expect(errors).toContain('基材類型必須為 AUXILIARY 或 FINISHED');
    });

    it('should validate zero quantity as valid', () => {
      const validData = {
        name: 'Valid Material',
        category: 'Valid Category',
        specification: 'Valid Spec',
        quantity: 0,
        type: 'AUXILIARY' as const,
      };

      const errors = materialService.validateMaterialData(validData);

      expect(errors).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors with proper error messages', async () => {
      mockApiService.get.mockRejectedValue(new Error('NETWORK_ERROR'));

      // Mock offline fallback to fail as well
      mockOfflineService.getMaterialsOffline.mockRejectedValue(new Error('Offline error'));

      await expect(materialService.getMaterials()).rejects.toThrow('網路連線異常，請檢查網路設定');
    });

    it('should handle unauthorized errors', async () => {
      mockApiService.get.mockRejectedValue(new Error('UNAUTHORIZED'));
      mockOfflineService.getMaterialsOffline.mockRejectedValue(new Error('Offline error'));

      await expect(materialService.getMaterials()).rejects.toThrow('沒有權限執行此操作');
    });

    it('should handle timeout errors', async () => {
      mockApiService.get.mockRejectedValue(new Error('REQUEST_TIMEOUT'));
      mockOfflineService.getMaterialsOffline.mockRejectedValue(new Error('Offline error'));

      await expect(materialService.getMaterials()).rejects.toThrow('請求逾時，請稍後再試');
    });

    it('should handle generic errors', async () => {
      mockApiService.get.mockRejectedValue(new Error('Some other error'));
      mockOfflineService.getMaterialsOffline.mockRejectedValue(new Error('Offline error'));

      await expect(materialService.getMaterials()).rejects.toThrow('Some other error');
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch quantity updates', async () => {
      const updates = [
        { id: '1', quantity: 50 },
        { id: '2', quantity: 75 },
      ];

      mockApiService.patch.mockResolvedValue({
        success: true,
        data: mockMaterial,
      });

      const results = await materialService.batchUpdateQuantities(updates);

      expect(mockApiService.patch).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
    });
  });

  describe('Search and Filter', () => {
    it('should search materials with correct parameters', async () => {
      await materialService.searchMaterials('test search', { type: 'AUXILIARY' });

      expect(mockApiService.get).toHaveBeenCalledWith('/api/materials?type=AUXILIARY&search=test%20search');
    });

    it('should get low stock materials', async () => {
      const lowStockMaterial = { ...mockMaterial, quantity: 5 };
      mockApiService.get.mockResolvedValue({
        success: true,
        data: { ...mockMaterialListResponse, materials: [lowStockMaterial] },
      });

      const result = await materialService.getLowStockMaterials(10);

      expect(result).toEqual([lowStockMaterial]);
    });

    it('should filter materials by category', async () => {
      const categoryMaterials = [mockMaterial];
      mockApiService.get.mockResolvedValue({
        success: true,
        data: categoryMaterials,
      });

      const result = await materialService.getMaterialsByCategory('Test Category');

      expect(mockApiService.get).toHaveBeenCalledWith('/api/materials/category/Test%20Category');
      expect(result).toEqual(categoryMaterials);
    });

    it('should filter materials by type', async () => {
      const typeMaterials = [mockMaterial];
      mockApiService.get.mockResolvedValue({
        success: true,
        data: typeMaterials,
      });

      const result = await materialService.getMaterialsByType('AUXILIARY');

      expect(mockApiService.get).toHaveBeenCalledWith('/api/materials/type/AUXILIARY');
      expect(result).toEqual(typeMaterials);
    });

    it('should get categories successfully', async () => {
      const categories = ['Category 1', 'Category 2'];
      mockApiService.get.mockResolvedValue({
        success: true,
        data: categories,
      });

      const result = await materialService.getCategories();

      expect(mockApiService.get).toHaveBeenCalledWith('/api/materials/categories');
      expect(result).toEqual(categories);
    });

    it('should get suppliers successfully', async () => {
      const suppliers = ['Supplier 1', 'Supplier 2'];
      mockApiService.get.mockResolvedValue({
        success: true,
        data: suppliers,
      });

      const result = await materialService.getSuppliers();

      expect(mockApiService.get).toHaveBeenCalledWith('/api/materials/suppliers');
      expect(result).toEqual(suppliers);
    });
  });

  describe('Complete CRUD Operations', () => {
    it('should perform complete create-read-update-delete cycle', async () => {
      const createRequest = {
        name: 'Test Material',
        category: 'Test Category',
        specification: 'Test Spec',
        quantity: 100,
        type: 'AUXILIARY' as const,
      };

      // Create
      const createdMaterial = await materialService.createMaterial(createRequest);
      expect(mockApiService.post).toHaveBeenCalledWith('/api/materials', createRequest);
      expect(createdMaterial).toEqual(mockMaterial);

      // Read
      const fetchedMaterial = await materialService.getMaterialById('1');
      expect(mockApiService.get).toHaveBeenCalledWith('/api/materials/1');
      expect(fetchedMaterial).toEqual(mockMaterial);

      // Update
      const updateRequest = { name: 'Updated Material', quantity: 150 };
      const updatedMaterial = await materialService.updateMaterial('1', updateRequest);
      expect(mockApiService.put).toHaveBeenCalledWith('/api/materials/1', updateRequest);
      expect(updatedMaterial).toEqual(mockMaterial);

      // Delete
      await materialService.deleteMaterial('1');
      expect(mockApiService.delete).toHaveBeenCalledWith('/api/materials/1');
    });

    it('should handle concurrent operations correctly', async () => {
      const createRequests = [
        { name: 'Material 1', category: 'Cat 1', specification: 'Spec 1', quantity: 10, type: 'AUXILIARY' as const },
        { name: 'Material 2', category: 'Cat 2', specification: 'Spec 2', quantity: 20, type: 'FINISHED' as const },
      ];

      const createPromises = createRequests.map(req => materialService.createMaterial(req));
      const results = await Promise.all(createPromises);

      expect(results).toHaveLength(2);
      expect(mockApiService.post).toHaveBeenCalledTimes(2);
    });

    it('should maintain data consistency during offline-online transitions', async () => {
      const createRequest = {
        name: 'Offline Material',
        category: 'Offline Category',
        specification: 'Offline Spec',
        quantity: 50,
        type: 'AUXILIARY' as const,
      };

      // Start offline
      mockNetworkService.isOnline.mockReturnValue(false);
      mockOfflineService.createMaterialOffline.mockResolvedValue(mockMaterial);

      const offlineResult = await materialService.createMaterial(createRequest);
      expect(mockOfflineService.createMaterialOffline).toHaveBeenCalledWith(createRequest);
      expect(offlineResult).toEqual(mockMaterial);

      // Go online and fetch
      mockNetworkService.isOnline.mockReturnValue(true);
      const onlineResult = await materialService.getMaterials();
      expect(mockApiService.get).toHaveBeenCalled();
      expect(onlineResult).toEqual(mockMaterialListResponse);
    });
  });

  describe('Image Upload Integration', () => {
    const mockUploadService = {
      uploadMaterialImage: jest.fn(),
      deleteMaterialImage: jest.fn(),
    };

    beforeEach(() => {
      jest.doMock('../uploadService', () => ({
        uploadService: mockUploadService,
      }));
    });

    it('should create material with image upload', async () => {
      const createRequest = {
        name: 'Material with Image',
        category: 'Test Category',
        specification: 'Test Spec',
        quantity: 10,
        type: 'AUXILIARY' as const,
      };

      const materialWithImage = { ...mockMaterial, imageUrl: 'https://example.com/image.jpg' };
      mockApiService.post.mockResolvedValue({
        success: true,
        data: materialWithImage,
      });

      const result = await materialService.createMaterial(createRequest);

      expect(result.imageUrl).toBe('https://example.com/image.jpg');
      expect(mockOfflineService.saveMaterialsOffline).toHaveBeenCalled();
    });

    it('should update material and handle image changes', async () => {
      const updateRequest = {
        name: 'Updated Material',
        imageUrl: 'https://example.com/new-image.jpg',
      };

      const updatedMaterial = { ...mockMaterial, ...updateRequest };
      mockApiService.put.mockResolvedValue({
        success: true,
        data: updatedMaterial,
      });

      const result = await materialService.updateMaterial('1', updateRequest);

      expect(result.imageUrl).toBe('https://example.com/new-image.jpg');
      expect(mockOfflineService.saveMaterialsOffline).toHaveBeenCalled();
    });

    it('should handle image upload failures gracefully', async () => {
      const createRequest = {
        name: 'Material',
        category: 'Category',
        specification: 'Spec',
        quantity: 10,
        type: 'AUXILIARY' as const,
      };

      // Material creation succeeds but without image
      const materialWithoutImage = { ...mockMaterial, imageUrl: null };
      mockApiService.post.mockResolvedValue({
        success: true,
        data: materialWithoutImage,
      });

      const result = await materialService.createMaterial(createRequest);

      expect(result.imageUrl).toBeNull();
    });
  });
});