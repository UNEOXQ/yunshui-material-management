import axios from 'axios';
import { Material, ApiResponse } from '../types';
// Mock data imports removed - using real API only

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface CreateMaterialRequest {
  name: string;
  category: string;
  price: number;
  quantity: number;
  supplier?: string;
  type: Material['type'];
}

export interface UpdateMaterialRequest {
  name?: string;
  category?: string;
  price?: number;
  quantity?: number;
  supplier?: string;
}

export interface MaterialFilters {
  type?: Material['type'];
  category?: string;
  supplier?: string;
  search?: string;
}

export interface PaginatedMaterialsResponse {
  materials: Material[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class MaterialService {
  /**
   * Get all materials with filtering and pagination
   */
  async getAllMaterials(
    filters: MaterialFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginatedMaterialsResponse>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        )
      });

      const response = await apiClient.get<ApiResponse<PaginatedMaterialsResponse>>(`/materials?${params}`);
      return response.data;
    } catch (error: any) {
      console.error('API 調用失敗:', error);
      return {
        success: false,
        message: error.response?.data?.message || '無法連接到後端服務器',
        error: error.message
      };
    }
  }

  /**
   * Get material by ID
   */
  async getMaterialById(id: string): Promise<ApiResponse<Material>> {
    try {
      const response = await apiClient.get<ApiResponse<Material>>(`/materials/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching material:', error);
      return {
        success: false,
        message: error.response?.data?.message || '獲取材料資料失敗',
        error: error.message
      };
    }
  }

  /**
   * Create new material (Admin only)
   */
  async createMaterial(materialData: CreateMaterialRequest): Promise<ApiResponse<Material>> {
    try {
      const response = await apiClient.post<ApiResponse<Material>>('/materials', materialData);
      return response.data;
    } catch (error: any) {
      console.error('創建材料失敗:', error);
      return {
        success: false,
        message: error.response?.data?.message || '創建材料失敗',
        error: error.message
      };
    }
  }

  /**
   * Update material (Admin only)
   */
  async updateMaterial(id: string, materialData: UpdateMaterialRequest): Promise<ApiResponse<Material>> {
    try {
      const response = await apiClient.put<ApiResponse<Material>>(`/materials/${id}`, materialData);
      return response.data;
    } catch (error: any) {
      console.error('更新材料失敗:', error);
      return {
        success: false,
        message: error.response?.data?.message || '更新材料失敗',
        error: error.message
      };
    }
  }

  /**
   * Delete material (Admin only)
   */
  async deleteMaterial(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/materials/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('刪除材料失敗:', error);
      return {
        success: false,
        message: error.response?.data?.message || '刪除材料失敗',
        error: error.message
      };
    }
  }

  /**
   * Get materials by type
   */
  async getMaterialsByType(type: Material['type']): Promise<ApiResponse<{ materials: Material[]; type: string; count: number }>> {
    try {
      const response = await apiClient.get<ApiResponse<{ materials: Material[]; type: string; count: number }>>(`/materials/type/${type}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching materials by type:', error);
      return {
        success: false,
        message: error.response?.data?.message || '獲取材料類型失敗',
        error: error.message
      };
    }
  }

  /**
   * Get all categories
   */
  async getCategories(type?: Material['type']): Promise<ApiResponse<{ categories: string[]; type: string; count: number }>> {
    try {
      const params = type ? `?type=${type}` : '';
      const response = await apiClient.get<ApiResponse<{ categories: string[]; type: string; count: number }>>(`/materials/categories${params}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      return {
        success: false,
        message: error.response?.data?.message || '獲取分類失敗',
        error: error.message
      };
    }
  }

  /**
   * Get all suppliers
   */
  async getSuppliers(type?: Material['type']): Promise<ApiResponse<{ suppliers: string[]; type: string; count: number }>> {
    try {
      const params = type ? `?type=${type}` : '';
      const response = await apiClient.get<ApiResponse<{ suppliers: string[]; type: string; count: number }>>(`/materials/suppliers${params}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
      return {
        success: false,
        message: error.response?.data?.message || '獲取供應商失敗',
        error: error.message
      };
    }
  }

  /**
   * Update material quantity (Warehouse and Admin)
   */
  async updateQuantity(id: string, quantity: number): Promise<ApiResponse<Material>> {
    try {
      const response = await apiClient.patch<ApiResponse<Material>>(`/materials/${id}/quantity`, { quantity });
      return response.data;
    } catch (error: any) {
      console.error('更新數量失敗:', error);
      return {
        success: false,
        message: error.response?.data?.message || '更新數量失敗',
        error: error.message
      };
    }
  }

  /**
   * Upload material image (Admin only)
   */
  async uploadImage(id: string, imageFile: File): Promise<ApiResponse<any>> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await apiClient.post<ApiResponse<any>>(`/upload/material/${id}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        message: error.response?.data?.message || '上傳圖片失敗',
        error: error.message
      };
    }
  }

  /**
   * Delete material image (Admin only)
   */
  async deleteImage(id: string): Promise<ApiResponse<Material>> {
    try {
      const response = await apiClient.delete<ApiResponse<Material>>(`/upload/material/${id}/image`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting image:', error);
      return {
        success: false,
        message: error.response?.data?.message || '刪除圖片失敗',
        error: error.message
      };
    }
  }

  /**
   * Get upload info
   */
  async getUploadInfo(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/upload/info');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching upload info:', error);
      return {
        success: false,
        message: error.response?.data?.message || '獲取上傳資訊失敗',
        error: error.message
      };
    }
  }
}

export const materialService = new MaterialService();