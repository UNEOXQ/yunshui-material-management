import axios from 'axios';
import { Order, OrderItem, ApiResponse } from '../types';
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

export interface CreateOrderRequest {
  items: Array<{
    materialId: string;
    quantity: number;
  }>;
  projectId?: string;
  newProjectName?: string;
  orderName?: string;
}

export interface OrderFilters {
  status?: Order['status'];
}

export interface PaginatedOrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class OrderService {
  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderRequest): Promise<ApiResponse<Order>> {
    try {
      const response = await apiClient.post<ApiResponse<Order>>('/orders', orderData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating order:', error);
      return {
        success: false,
        message: error.response?.data?.message || '建立訂單失敗',
        error: error.message
      };
    }
  }

  /**
   * Get all orders with filtering and pagination
   */
  async getAllOrders(
    filters: OrderFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginatedOrdersResponse>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        )
      });

      const response = await apiClient.get<ApiResponse<PaginatedOrdersResponse>>(`/orders?${params}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      return {
        success: false,
        message: error.response?.data?.message || '獲取訂單列表失敗',
        error: error.message
      };
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    try {
      const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching order:', error);
      return {
        success: false,
        message: error.response?.data?.message || '獲取訂單資料失敗',
        error: error.message
      };
    }
  }

  /**
   * Get order items by order ID
   */
  async getOrderItems(orderId: string): Promise<ApiResponse<OrderItem[]>> {
    try {
      const response = await apiClient.get<ApiResponse<OrderItem[]>>(`/orders/${orderId}/items`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching order items:', error);
      return {
        success: false,
        message: error.response?.data?.message || '獲取訂單項目失敗',
        error: error.message
      };
    }
  }

  /**
   * Update order status (Admin and Warehouse only)
   */
  async updateOrderStatus(id: string, status: Order['status']): Promise<ApiResponse<Order>> {
    try {
      const response = await apiClient.put<ApiResponse<Order>>(`/orders/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error('Error updating order status:', error);
      return {
        success: false,
        message: error.response?.data?.message || '更新訂單狀態失敗',
        error: error.message
      };
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(id: string): Promise<ApiResponse<Order>> {
    try {
      const response = await apiClient.delete<ApiResponse<Order>>(`/orders/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      return {
        success: false,
        message: error.response?.data?.message || '取消訂單失敗',
        error: error.message
      };
    }
  }

  /**
   * Get order status display name
   */
  getStatusDisplayName(status: Order['status']): string {
    const statusNames = {
      'PENDING': '待處理',
      'CONFIRMED': '已確認',
      'PROCESSING': '處理中',
      'COMPLETED': '已完成',
      'CANCELLED': '已取消'
    };
    return statusNames[status];
  }

  /**
   * Get order status class name for styling
   */
  getStatusClassName(status: Order['status']): string {
    return status.toLowerCase();
  }

  /**
   * Check if order can be cancelled
   */
  canCancelOrder(order: Order): boolean {
    return ['PENDING', 'CONFIRMED'].includes(order.status);
  }

  /**
   * Check if order status can be updated
   */
  canUpdateStatus(order: Order): boolean {
    return order.status !== 'CANCELLED' && order.status !== 'COMPLETED';
  }

  /**
   * Get next possible statuses for an order
   */
  getNextStatuses(currentStatus: Order['status']): Order['status'][] {
    const statusFlow: Record<Order['status'], Order['status'][]> = {
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['PROCESSING', 'CANCELLED'],
      'PROCESSING': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [],
      'CANCELLED': []
    };
    return statusFlow[currentStatus] || [];
  }

  // Auxiliary Material Order Methods (PM only)

  /**
   * Create auxiliary material order (PM only)
   */
  async createAuxiliaryOrder(orderData: CreateOrderRequest): Promise<ApiResponse<{ order: Order; project: any }>> {
    try {
      // 如果有專案相關數據，使用支持專案的 API
      const endpoint = (orderData.projectId || orderData.newProjectName) 
        ? '/orders/auxiliary-with-project' 
        : '/orders/auxiliary';
      
      const response = await apiClient.post<ApiResponse<{ order: Order; project: any }>>(endpoint, orderData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating auxiliary order:', error);
      return {
        success: false,
        message: error.response?.data?.message || '建立輔材訂單失敗',
        error: error.message
      };
    }
  }

  /**
   * Get auxiliary material orders (PM only)
   */
  async getAuxiliaryOrders(queryString?: string): Promise<ApiResponse<PaginatedOrdersResponse>> {
    try {
      const url = queryString ? `/orders/auxiliary?${queryString}` : '/orders/auxiliary';
      const response = await apiClient.get<ApiResponse<PaginatedOrdersResponse>>(url);
      return response.data;
    } catch (error: any) {
      console.error('獲取輔材訂單失敗:', error);
      return {
        success: false,
        message: error.response?.data?.message || '獲取輔材訂單失敗',
        error: error.message
      };
    }
  }

  /**
   * Confirm auxiliary material order (PM only)
   */
  async confirmAuxiliaryOrder(orderId: string): Promise<ApiResponse<{ order: Order; project: any }>> {
    try {
      const response = await apiClient.put<ApiResponse<{ order: Order; project: any }>>(`/orders/${orderId}/confirm`);
      return response.data;
    } catch (error: any) {
      console.error('Error confirming auxiliary order:', error);
      return {
        success: false,
        message: error.response?.data?.message || '確認輔材訂單失敗',
        error: error.message
      };
    }
  }

  // Finished Material Order Methods (AM only)

  /**
   * Create finished material order (AM only)
   */
  async createFinishedOrder(orderData: CreateOrderRequest): Promise<ApiResponse<{ order: Order; project: any }>> {
    try {
      // 如果有專案相關數據，使用支持專案的 API
      const endpoint = (orderData.projectId || orderData.newProjectName) 
        ? '/orders/finished-with-project' 
        : '/orders/finished';
      
      const response = await apiClient.post<ApiResponse<{ order: Order; project: any }>>(endpoint, orderData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating finished order:', error);
      return {
        success: false,
        message: error.response?.data?.message || '建立完成材訂單失敗',
        error: error.message
      };
    }
  }

  /**
   * Get finished material orders (AM only)
   */
  async getFinishedOrders(queryString?: string): Promise<ApiResponse<PaginatedOrdersResponse>> {
    try {
      const url = queryString ? `/orders/finished?${queryString}` : '/orders/finished';
      const response = await apiClient.get<ApiResponse<PaginatedOrdersResponse>>(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching finished orders:', error);
      return {
        success: false,
        message: error.response?.data?.message || '獲取完成材訂單列表失敗',
        error: error.message
      };
    }
  }

  /**
   * Confirm finished material order (AM only)
   */
  async confirmFinishedOrder(orderId: string): Promise<ApiResponse<{ order: Order; project: any }>> {
    try {
      const response = await apiClient.put<ApiResponse<{ order: Order; project: any }>>(`/orders/${orderId}/confirm-finished`);
      return response.data;
    } catch (error: any) {
      console.error('Error confirming finished order:', error);
      return {
        success: false,
        message: error.response?.data?.message || '確認完成材訂單失敗',
        error: error.message
      };
    }
  }

  // Update order name
  async updateOrderName(orderId: string, name: string): Promise<ApiResponse<{ order: Order }>> {
    try {
      console.log(`更新訂單名稱: ${orderId} -> ${name}`);
      
      const response = await apiClient.put(`/orders/${orderId}/name`, { name });
      
      console.log('更新訂單名稱成功:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('更新訂單名稱失敗:', error);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: '更新訂單名稱失敗',
        error: error.message
      };
    }
  }

  // Delete order (Admin only)
  async deleteOrder(orderId: string): Promise<ApiResponse<{ deletedOrderId: string }>> {
    try {
      console.log(`刪除訂單: ${orderId}`);
      
      const response = await apiClient.delete(`/orders/${orderId}/delete`);
      
      console.log('刪除訂單成功:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('刪除訂單失敗:', error);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: '刪除訂單失敗',
        error: error.message
      };
    }
  }
  // 將訂單分配到專案
  async assignOrderToProject(orderId: string, projectId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put(`/orders/${orderId}/project`, {
        projectId
      });
      return response.data;
    } catch (error: any) {
      console.error('分配訂單到專案失敗:', error);
      return {
        success: false,
        message: error.response?.data?.message || '分配訂單到專案失敗',
        data: null
      };
    }
  }

  // 移除訂單的專案關聯
  async removeOrderFromProject(orderId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete(`/orders/${orderId}/project`);
      return response.data;
    } catch (error: any) {
      console.error('移除訂單專案關聯失敗:', error);
      return {
        success: false,
        message: error.response?.data?.message || '移除訂單專案關聯失敗',
        data: null
      };
    }
  }
}

export const orderService = new OrderService();