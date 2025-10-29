import { apiService, ApiResponse } from './api';
import { Material, MaterialType } from './materialService';

// 類型定義
export type OrderStatus = 'PENDING' | 'APPROVED' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  orderId: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  materialName?: string;
  materialCategory?: string;
  materialType?: MaterialType;
  imageUrl?: string;
  material?: Material;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CreateOrderRequest {
  customerName: string;
  items: {
    materialId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface CreateAuxiliaryOrderRequest {
  customerName: string;
  items: {
    materialId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface CreateFinishedOrderRequest {
  customerName: string;
  items: {
    materialId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface OrderFilters {
  status?: OrderStatus;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface UpdateOrderNameRequest {
  name: string;
}

export class OrderService {
  private static instance: OrderService;

  private constructor() {}

  public static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  /**
   * 獲取訂單列表
   */
  public async getOrders(filters: OrderFilters = {}): Promise<OrderListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const endpoint = `/api/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response: ApiResponse<OrderListResponse> = await apiService.get(endpoint);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get orders');
      }

      return response.data;
    } catch (error: any) {
      console.error('Get orders error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 獲取輔料訂單列表
   */
  public async getAuxiliaryOrders(filters: OrderFilters = {}): Promise<OrderListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const endpoint = `/api/orders/auxiliary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response: ApiResponse<OrderListResponse> = await apiService.get(endpoint);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get auxiliary orders');
      }

      return response.data;
    } catch (error: any) {
      console.error('Get auxiliary orders error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 獲取成品訂單列表
   */
  public async getFinishedOrders(filters: OrderFilters = {}): Promise<OrderListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const endpoint = `/api/orders/finished${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response: ApiResponse<OrderListResponse> = await apiService.get(endpoint);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get finished orders');
      }

      return response.data;
    } catch (error: any) {
      console.error('Get finished orders error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 根據 ID 獲取訂單詳情
   */
  public async getOrderById(id: string): Promise<OrderWithItems> {
    try {
      const response: ApiResponse<OrderWithItems> = await apiService.get(`/api/orders/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get order');
      }

      return response.data;
    } catch (error: any) {
      console.error('Get order by ID error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 獲取訂單項目
   */
  public async getOrderItems(orderId: string): Promise<OrderItem[]> {
    try {
      const response: ApiResponse<OrderItem[]> = await apiService.get(`/api/orders/${orderId}/items`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get order items');
      }

      return response.data;
    } catch (error: any) {
      console.error('Get order items error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 創建一般訂單
   */
  public async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      const response: ApiResponse<Order> = await apiService.post('/api/orders', orderData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create order');
      }

      return response.data;
    } catch (error: any) {
      console.error('Create order error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 創建輔料訂單
   */
  public async createAuxiliaryOrder(orderData: CreateAuxiliaryOrderRequest): Promise<Order> {
    try {
      const response: ApiResponse<Order> = await apiService.post('/api/orders/auxiliary', orderData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create auxiliary order');
      }

      return response.data;
    } catch (error: any) {
      console.error('Create auxiliary order error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 創建成品訂單
   */
  public async createFinishedOrder(orderData: CreateFinishedOrderRequest): Promise<Order> {
    try {
      const response: ApiResponse<Order> = await apiService.post('/api/orders/finished', orderData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create finished order');
      }

      return response.data;
    } catch (error: any) {
      console.error('Create finished order error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 更新訂單狀態
   */
  public async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    try {
      const response: ApiResponse<Order> = await apiService.put(`/api/orders/${id}/status`, { status });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update order status');
      }

      return response.data;
    } catch (error: any) {
      console.error('Update order status error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 更新訂單名稱
   */
  public async updateOrderName(id: string, name: string): Promise<Order> {
    try {
      const response: ApiResponse<Order> = await apiService.put(`/api/orders/${id}/name`, { name });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update order name');
      }

      return response.data;
    } catch (error: any) {
      console.error('Update order name error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 確認輔料訂單
   */
  public async confirmAuxiliaryOrder(id: string): Promise<Order> {
    try {
      const response: ApiResponse<Order> = await apiService.put(`/api/orders/${id}/confirm`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to confirm auxiliary order');
      }

      return response.data;
    } catch (error: any) {
      console.error('Confirm auxiliary order error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 確認成品訂單
   */
  public async confirmFinishedOrder(id: string): Promise<Order> {
    try {
      const response: ApiResponse<Order> = await apiService.put(`/api/orders/${id}/confirm-finished`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to confirm finished order');
      }

      return response.data;
    } catch (error: any) {
      console.error('Confirm finished order error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 取消訂單
   */
  public async cancelOrder(id: string): Promise<Order> {
    try {
      const response: ApiResponse<Order> = await apiService.delete(`/api/orders/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to cancel order');
      }

      return response.data;
    } catch (error: any) {
      console.error('Cancel order error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 刪除訂單（管理員專用）
   */
  public async deleteOrder(id: string): Promise<void> {
    try {
      const response: ApiResponse<void> = await apiService.delete(`/api/orders/${id}/delete`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete order');
      }
    } catch (error: any) {
      console.error('Delete order error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 根據狀態獲取訂單
   */
  public async getOrdersByStatus(status: OrderStatus, page: number = 1, limit: number = 10): Promise<OrderListResponse> {
    try {
      return await this.getOrders({ status, page, limit });
    } catch (error: any) {
      console.error('Get orders by status error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 搜尋訂單
   */
  public async searchOrders(
    searchTerm: string, 
    filters: Omit<OrderFilters, 'search'> = {}
  ): Promise<OrderListResponse> {
    try {
      // 這裡可以根據後端 API 支援的搜尋參數進行調整
      return await this.getOrders(filters);
    } catch (error: any) {
      console.error('Search orders error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 計算訂單總金額
   */
  public calculateOrderTotal(items: Array<{ quantity: number; unitPrice: number }>): number {
    return items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  }

  /**
   * 驗證訂單數據
   */
  public validateOrderData(data: CreateOrderRequest | CreateAuxiliaryOrderRequest | CreateFinishedOrderRequest): string[] {
    const errors: string[] = [];

    if (!data.customerName || data.customerName.trim().length === 0) {
      errors.push('客戶名稱不能為空');
    } else if (data.customerName.length > 100) {
      errors.push('客戶名稱不能超過100個字符');
    }

    if (!data.items || data.items.length === 0) {
      errors.push('訂單必須包含至少一個項目');
    } else {
      data.items.forEach((item, index) => {
        if (!item.materialId) {
          errors.push(`項目 ${index + 1}: 基材ID不能為空`);
        }
        
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`項目 ${index + 1}: 數量必須大於0`);
        } else if (!Number.isInteger(item.quantity)) {
          errors.push(`項目 ${index + 1}: 數量必須為整數`);
        }
        
        if (!item.unitPrice || item.unitPrice <= 0) {
          errors.push(`項目 ${index + 1}: 單價必須大於0`);
        }
      });
    }

    return errors;
  }

  /**
   * 獲取訂單狀態選項
   */
  public getOrderStatusOptions(): Array<{ label: string; value: OrderStatus }> {
    return [
      { label: '待處理', value: 'PENDING' },
      { label: '已批准', value: 'APPROVED' },
      { label: '已確認', value: 'CONFIRMED' },
      { label: '處理中', value: 'PROCESSING' },
      { label: '已完成', value: 'COMPLETED' },
      { label: '已取消', value: 'CANCELLED' }
    ];
  }

  /**
   * 獲取訂單狀態顯示文字
   */
  public getOrderStatusText(status: OrderStatus): string {
    const statusMap: Record<OrderStatus, string> = {
      'PENDING': '待處理',
      'APPROVED': '已批准',
      'CONFIRMED': '已確認',
      'PROCESSING': '處理中',
      'COMPLETED': '已完成',
      'CANCELLED': '已取消'
    };
    
    return statusMap[status] || status;
  }

  /**
   * 檢查訂單是否可以編輯
   */
  public canEditOrder(status: OrderStatus): boolean {
    return ['PENDING', 'APPROVED'].includes(status);
  }

  /**
   * 檢查訂單是否可以取消
   */
  public canCancelOrder(status: OrderStatus): boolean {
    return ['PENDING', 'APPROVED', 'CONFIRMED'].includes(status);
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
export const orderService = OrderService.getInstance();