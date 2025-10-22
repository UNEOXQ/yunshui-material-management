import axios from 'axios';
import { User, ApiResponse } from '../types';
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

export interface CreateUserRequest {
  username: string;
  email: string;
  role: User['role'];
  password: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: User['role'];
  password?: string;
}

class UserService {
  /**
   * Get all users (Admin only)
   */
  async getAllUsers(): Promise<ApiResponse<{users: User[], pagination: any}>> {
    try {
      const response = await apiClient.get<ApiResponse<{users: User[], pagination: any}>>('/users');
      return response.data;
    } catch (error: any) {
      console.error('獲取使用者列表失敗:', error);
      return {
        success: false,
        message: error.response?.data?.message || '獲取使用者列表失敗',
        error: error.message
      };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user:', error);
      return {
        success: false,
        message: error.response?.data?.message || '獲取使用者資料失敗',
        error: error.message
      };
    }
  }

  /**
   * Create new user (Admin only)
   */
  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.post<ApiResponse<User>>('/users', userData);
      return response.data;
    } catch (error: any) {
      console.error('創建使用者失敗:', error);
      return {
        success: false,
        message: error.response?.data?.message || '創建使用者失敗',
        error: error.message
      };
    }
  }

  /**
   * Update user (Admin only)
   */
  async updateUser(id: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, userData);
      return response.data;
    } catch (error: any) {
      console.error('更新使用者失敗:', error);
      return {
        success: false,
        message: error.response?.data?.message || '更新使用者失敗',
        error: error.message
      };
    }
  }

  /**
   * Delete user (Admin only)
   */
  async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('刪除使用者失敗:', error);
      return {
        success: false,
        message: error.response?.data?.message || '刪除使用者失敗',
        error: error.message
      };
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/auth/profile');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching current user:', error);
      return {
        success: false,
        message: error.response?.data?.message || '獲取使用者資料失敗',
        error: error.message
      };
    }
  }
}

export const userService = new UserService();