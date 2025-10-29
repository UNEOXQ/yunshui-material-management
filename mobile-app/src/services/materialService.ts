import { apiService, ApiResponse } from './api';
import { OfflineService } from './offlineService';
import { NetworkService } from './networkService';

// 類型定義
export type MaterialType = 'AUXILIARY' | 'FINISHED';

export interface Material {
  id: string;
  name: string;
  category: string;
  specification: string;
  quantity: number;
  imageUrl: string | null;
  supplier?: string;
  type: MaterialType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialRequest {
  name: string;
  category: string;
  specification: string;
  quantity: number;
  supplier?: string;
  type: MaterialType;
}

export interface UpdateMaterialRequest {
  name?: string;
  category?: string;
  specification?: string;
  quantity?: number;
  supplier?: string;
  type?: MaterialType;
}

export interface MaterialFilters {
  type?: MaterialType;
  category?: string;
  supplier?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MaterialListResponse {
  materials: Material[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class MaterialService {
  private static instance: MaterialService;

  private constructor() {}

  public static getInstance(): MaterialService {
    if (!MaterialService.instance) {
      MaterialService.instance = new MaterialService();
    }
    return MaterialService.instance;
  }

  /**
   * 獲取基材列表
   */
  public async getMaterials(filters: MaterialFilters = {}): Promise<MaterialListResponse> {
    try {
      // 如果離線，從本地數據庫獲取
      if (!NetworkService.isOnline()) {
        const offlineMaterials = await OfflineService.getMaterialsOffline();
        return this.filterMaterialsLocally(offlineMaterials, filters);
      }

      const queryParams = new URLSearchParams();
      
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.supplier) queryParams.append('supplier', filters.supplier);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const endpoint = `/api/materials${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response: ApiResponse<MaterialListResponse> = await apiService.get(endpoint);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get materials');
      }

      // 保存到離線存儲
      if (response.data.materials.length > 0) {
        await OfflineService.saveMaterialsOffline(response.data.materials);
      }

      return response.data;
    } catch (error: any) {
      console.error('Get materials error:', error);
      
      // 如果網路請求失敗，嘗試從離線數據獲取
      if (NetworkService.isOnline()) {
        try {
          const offlineMaterials = await OfflineService.getMaterialsOffline();
          if (offlineMaterials.length > 0) {
            console.log('Falling back to offline materials');
            return this.filterMaterialsLocally(offlineMaterials, filters);
          }
        } catch (offlineError) {
          console.error('Offline fallback failed:', offlineError);
        }
      }
      
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 根據類型獲取基材
   */
  public async getMaterialsByType(type: MaterialType): Promise<Material[]> {
    try {
      const response: ApiResponse<Material[]> = await apiService.get(`/api/materials/type/${type}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get materials by type');
      }

      return response.data;
    } catch (error: any) {
      console.error('Get materials by type error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 根據分類獲取基材
   */
  public async getMaterialsByCategory(category: string, type?: MaterialType): Promise<Material[]> {
    try {
      const endpoint = `/api/materials/category/${encodeURIComponent(category)}${type ? `?type=${type}` : ''}`;
      const response: ApiResponse<Material[]> = await apiService.get(endpoint);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get materials by category');
      }

      return response.data;
    } catch (error: any) {
      console.error('Get materials by category error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 根據 ID 獲取基材詳情
   */
  public async getMaterialById(id: string): Promise<Material> {
    try {
      const response: ApiResponse<Material> = await apiService.get(`/api/materials/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get material');
      }

      return response.data;
    } catch (error: any) {
      console.error('Get material by ID error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 創建新基材
   */
  public async createMaterial(materialData: CreateMaterialRequest): Promise<Material> {
    try {
      // 如果離線，保存到離線操作
      if (!NetworkService.isOnline()) {
        return await OfflineService.createMaterialOffline(materialData);
      }

      const response: ApiResponse<Material> = await apiService.post('/api/materials', materialData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create material');
      }

      // 更新本地數據
      const materials = await OfflineService.getMaterialsOffline();
      materials.push(response.data);
      await OfflineService.saveMaterialsOffline(materials);

      return response.data;
    } catch (error: any) {
      console.error('Create material error:', error);
      
      // 如果網路請求失敗，保存為離線操作
      if (NetworkService.isOnline()) {
        try {
          console.log('Network request failed, saving as offline operation');
          return await OfflineService.createMaterialOffline(materialData);
        } catch (offlineError) {
          console.error('Offline creation failed:', offlineError);
        }
      }
      
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 更新基材
   */
  public async updateMaterial(id: string, updateData: UpdateMaterialRequest): Promise<Material> {
    try {
      // 如果離線，先獲取本地數據並更新
      if (!NetworkService.isOnline()) {
        const existingMaterial = await OfflineService.getMaterialsOffline().then(materials => 
          materials.find(m => m.id === id)
        );
        
        if (!existingMaterial) {
          throw new Error('Material not found in offline storage');
        }

        const updatedMaterial = { ...existingMaterial, ...updateData, updatedAt: new Date().toISOString() };
        return await OfflineService.updateMaterialOffline(updatedMaterial);
      }

      const response: ApiResponse<Material> = await apiService.put(`/api/materials/${id}`, updateData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update material');
      }

      // 更新本地數據
      const materials = await OfflineService.getMaterialsOffline();
      const index = materials.findIndex(m => m.id === id);
      if (index !== -1) {
        materials[index] = response.data;
        await OfflineService.saveMaterialsOffline(materials);
      }

      return response.data;
    } catch (error: any) {
      console.error('Update material error:', error);
      
      // 如果網路請求失敗，保存為離線操作
      if (NetworkService.isOnline()) {
        try {
          const existingMaterial = await OfflineService.getMaterialsOffline().then(materials => 
            materials.find(m => m.id === id)
          );
          
          if (existingMaterial) {
            const updatedMaterial = { ...existingMaterial, ...updateData, updatedAt: new Date().toISOString() };
            return await OfflineService.updateMaterialOffline(updatedMaterial);
          }
        } catch (offlineError) {
          console.error('Offline update failed:', offlineError);
        }
      }
      
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 更新基材數量
   */
  public async updateMaterialQuantity(id: string, quantity: number): Promise<Material> {
    try {
      const response: ApiResponse<Material> = await apiService.patch(`/api/materials/${id}/quantity`, { quantity });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update material quantity');
      }

      return response.data;
    } catch (error: any) {
      console.error('Update material quantity error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 刪除基材
   */
  public async deleteMaterial(id: string): Promise<void> {
    try {
      // 如果離線，保存刪除操作
      if (!NetworkService.isOnline()) {
        await OfflineService.deleteMaterialOffline(id);
        return;
      }

      const response: ApiResponse<void> = await apiService.delete(`/api/materials/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete material');
      }

      // 從本地數據中移除
      const materials = await OfflineService.getMaterialsOffline();
      const filteredMaterials = materials.filter(m => m.id !== id);
      await OfflineService.saveMaterialsOffline(filteredMaterials);
    } catch (error: any) {
      console.error('Delete material error:', error);
      
      // 如果網路請求失敗，保存為離線操作
      if (NetworkService.isOnline()) {
        try {
          await OfflineService.deleteMaterialOffline(id);
          return;
        } catch (offlineError) {
          console.error('Offline deletion failed:', offlineError);
        }
      }
      
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 獲取所有分類
   */
  public async getCategories(type?: MaterialType): Promise<string[]> {
    try {
      const endpoint = `/api/materials/categories${type ? `?type=${type}` : ''}`;
      const response: ApiResponse<string[]> = await apiService.get(endpoint);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get categories');
      }

      return response.data;
    } catch (error: any) {
      console.error('Get categories error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 獲取所有供應商
   */
  public async getSuppliers(type?: MaterialType): Promise<string[]> {
    try {
      const endpoint = `/api/materials/suppliers${type ? `?type=${type}` : ''}`;
      const response: ApiResponse<string[]> = await apiService.get(endpoint);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get suppliers');
      }

      return response.data;
    } catch (error: any) {
      console.error('Get suppliers error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 搜尋基材
   */
  public async searchMaterials(
    searchTerm: string, 
    filters: Omit<MaterialFilters, 'search'> = {}
  ): Promise<MaterialListResponse> {
    try {
      return await this.getMaterials({
        ...filters,
        search: searchTerm
      });
    } catch (error: any) {
      console.error('Search materials error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 批量更新基材數量
   */
  public async batchUpdateQuantities(updates: Array<{ id: string; quantity: number }>): Promise<Material[]> {
    try {
      const updatePromises = updates.map(update => 
        this.updateMaterialQuantity(update.id, update.quantity)
      );

      return await Promise.all(updatePromises);
    } catch (error: any) {
      console.error('Batch update quantities error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 獲取低庫存基材
   */
  public async getLowStockMaterials(threshold: number = 10, type?: MaterialType): Promise<Material[]> {
    try {
      const materials = await this.getMaterials({ type });
      return materials.materials.filter(material => material.quantity <= threshold);
    } catch (error: any) {
      console.error('Get low stock materials error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 驗證基材數據
   */
  public validateMaterialData(data: CreateMaterialRequest | UpdateMaterialRequest): string[] {
    const errors: string[] = [];

    if ('name' in data && data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('基材名稱不能為空');
      } else if (data.name.length > 100) {
        errors.push('基材名稱不能超過100個字符');
      }
    }

    if ('category' in data && data.category !== undefined) {
      if (!data.category || data.category.trim().length === 0) {
        errors.push('分類不能為空');
      } else if (data.category.length > 50) {
        errors.push('分類不能超過50個字符');
      }
    }

    if ('specification' in data && data.specification !== undefined) {
      if (!data.specification || data.specification.trim().length === 0) {
        errors.push('規格不能為空');
      } else if (data.specification.length > 200) {
        errors.push('規格不能超過200個字符');
      }
    }

    if ('quantity' in data && data.quantity !== undefined) {
      if (data.quantity < 0) {
        errors.push('數量不能為負數');
      } else if (!Number.isInteger(data.quantity)) {
        errors.push('數量必須為整數');
      }
    }

    if ('type' in data && data.type !== undefined) {
      if (!['AUXILIARY', 'FINISHED'].includes(data.type)) {
        errors.push('基材類型必須為 AUXILIARY 或 FINISHED');
      }
    }

    if ('supplier' in data && data.supplier !== undefined && data.supplier.length > 100) {
      errors.push('供應商名稱不能超過100個字符');
    }

    return errors;
  }

  /**
   * 本地篩選基材
   */
  private filterMaterialsLocally(materials: Material[], filters: MaterialFilters): MaterialListResponse {
    let filteredMaterials = [...materials];

    // 按類型篩選
    if (filters.type) {
      filteredMaterials = filteredMaterials.filter(m => m.type === filters.type);
    }

    // 按分類篩選
    if (filters.category) {
      filteredMaterials = filteredMaterials.filter(m => 
        m.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    // 按供應商篩選
    if (filters.supplier) {
      filteredMaterials = filteredMaterials.filter(m => 
        m.supplier?.toLowerCase().includes(filters.supplier!.toLowerCase())
      );
    }

    // 搜尋篩選
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredMaterials = filteredMaterials.filter(m => 
        m.name.toLowerCase().includes(searchTerm) ||
        m.category.toLowerCase().includes(searchTerm) ||
        m.specification.toLowerCase().includes(searchTerm) ||
        m.supplier?.toLowerCase().includes(searchTerm)
      );
    }

    // 分頁
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMaterials = filteredMaterials.slice(startIndex, endIndex);

    return {
      materials: paginatedMaterials,
      total: filteredMaterials.length,
      page,
      limit,
      totalPages: Math.ceil(filteredMaterials.length / limit),
    };
  }

  /**
   * 錯誤訊息處理
   */
  private getErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.message) {
      switch (error.message) {
        case 'NETWORK_ERROR':
          return '網路連線異常，請檢查網路設定';
        case 'UNAUTHORIZED':
          return '沒有權限執行此操作';
        case 'REQUEST_TIMEOUT':
          return '請求逾時，請稍後再試';
        default:
          return error.message;
      }
    }
    
    return '系統發生錯誤，請稍後再試';
  }
}

// 導出單例實例
export const materialService = MaterialService.getInstance();