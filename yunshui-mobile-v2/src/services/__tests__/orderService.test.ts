import { orderService, OrderService } from '../orderService';
import { apiService } from '../api';

// Mock dependencies
jest.mock('../api');

describe('OrderService', () => {
  const mockApiService = apiService as jest.Mocked<typeof apiService>;

  const mockOrder = {
    id: '1',
    userId: 'user1',
    orderNumber: 'ORD-001',
    customerName: 'Test Customer',
    status: 'PENDING' as const,
    totalAmount: 1000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockOrderItem = {
    id: '1',
    orderId: '1',
    materialId: 'mat1',
    quantity: 10,
    unitPrice: 100,
    subtotal: 1000,
    materialName: 'Test Material',
    materialCategory: 'Test Category',
  };

  const mockOrderWithItems = {
    ...mockOrder,
    items: [mockOrderItem],
  };

  const mockOrderListResponse = {
    orders: [mockOrder],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful API responses
    mockApiService.get.mockResolvedValue({
      success: true,
      data: mockOrderListResponse,
    });
    
    mockApiService.post.mockResolvedValue({
      success: true,
      data: mockOrder,
    });
    
    mockApiService.put.mockResolvedValue({
      success: true,
      data: mockOrder,
    });
    
    mockApiService.delete.mockResolvedValue({
      success: true,
      data: mockOrder,
    });
  });

  describe('getOrders', () => {
    it('should fetch orders successfully', async () => {
      const result = await orderService.getOrders();

      expect(mockApiService.get).toHaveBeenCalledWith('/api/orders');
      expect(result).toEqual(mockOrderListResponse);
    });

    it('should apply filters correctly in query params', async () => {
      const filters = {
        status: 'PENDING' as const,
        page: 2,
        limit: 20,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      await orderService.getOrders(filters);

      expect(mockApiService.get).toHaveBeenCalledWith(
        '/api/orders?status=PENDING&page=2&limit=20&startDate=2024-01-01&endDate=2024-12-31'
      );
    });

    it('should handle API errors correctly', async () => {
      mockApiService.get.mockResolvedValue({
        success: false,
        error: 'Failed to fetch orders',
      });

      await expect(orderService.getOrders()).rejects.toThrow('Failed to fetch orders');
    });
  });

  describe('getAuxiliaryOrders', () => {
    it('should fetch auxiliary orders successfully', async () => {
      const result = await orderService.getAuxiliaryOrders();

      expect(mockApiService.get).toHaveBeenCalledWith('/api/orders/auxiliary');
      expect(result).toEqual(mockOrderListResponse);
    });

    it('should apply filters to auxiliary orders', async () => {
      const filters = { status: 'CONFIRMED' as const, page: 1, limit: 5 };

      await orderService.getAuxiliaryOrders(filters);

      expect(mockApiService.get).toHaveBeenCalledWith('/api/orders/auxiliary?status=CONFIRMED&page=1&limit=5');
    });
  });

  describe('getFinishedOrders', () => {
    it('should fetch finished orders successfully', async () => {
      const result = await orderService.getFinishedOrders();

      expect(mockApiService.get).toHaveBeenCalledWith('/api/orders/finished');
      expect(result).toEqual(mockOrderListResponse);
    });
  });

  describe('getOrderById', () => {
    it('should fetch order by ID successfully', async () => {
      mockApiService.get.mockResolvedValue({
        success: true,
        data: mockOrderWithItems,
      });

      const result = await orderService.getOrderById('1');

      expect(mockApiService.get).toHaveBeenCalledWith('/api/orders/1');
      expect(result).toEqual(mockOrderWithItems);
    });
  });

  describe('getOrderItems', () => {
    it('should fetch order items successfully', async () => {
      mockApiService.get.mockResolvedValue({
        success: true,
        data: [mockOrderItem],
      });

      const result = await orderService.getOrderItems('1');

      expect(mockApiService.get).toHaveBeenCalledWith('/api/orders/1/items');
      expect(result).toEqual([mockOrderItem]);
    });
  });

  describe('createOrder', () => {
    const createRequest = {
      customerName: 'New Customer',
      items: [
        {
          materialId: 'mat1',
          quantity: 5,
          unitPrice: 200,
        },
      ],
    };

    it('should create order successfully', async () => {
      const result = await orderService.createOrder(createRequest);

      expect(mockApiService.post).toHaveBeenCalledWith('/api/orders', createRequest);
      expect(result).toEqual(mockOrder);
    });

    it('should handle creation errors', async () => {
      mockApiService.post.mockResolvedValue({
        success: false,
        error: 'Creation failed',
      });

      await expect(orderService.createOrder(createRequest)).rejects.toThrow('Creation failed');
    });
  });

  describe('createAuxiliaryOrder', () => {
    const createRequest = {
      customerName: 'Auxiliary Customer',
      items: [
        {
          materialId: 'aux1',
          quantity: 10,
          unitPrice: 50,
        },
      ],
    };

    it('should create auxiliary order successfully', async () => {
      const result = await orderService.createAuxiliaryOrder(createRequest);

      expect(mockApiService.post).toHaveBeenCalledWith('/api/orders/auxiliary', createRequest);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('createFinishedOrder', () => {
    const createRequest = {
      customerName: 'Finished Customer',
      items: [
        {
          materialId: 'fin1',
          quantity: 3,
          unitPrice: 500,
        },
      ],
    };

    it('should create finished order successfully', async () => {
      const result = await orderService.createFinishedOrder(createRequest);

      expect(mockApiService.post).toHaveBeenCalledWith('/api/orders/finished', createRequest);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const result = await orderService.updateOrderStatus('1', 'CONFIRMED');

      expect(mockApiService.put).toHaveBeenCalledWith('/api/orders/1/status', { status: 'CONFIRMED' });
      expect(result).toEqual(mockOrder);
    });
  });

  describe('updateOrderName', () => {
    it('should update order name successfully', async () => {
      const result = await orderService.updateOrderName('1', 'Updated Name');

      expect(mockApiService.put).toHaveBeenCalledWith('/api/orders/1/name', { name: 'Updated Name' });
      expect(result).toEqual(mockOrder);
    });
  });

  describe('confirmAuxiliaryOrder', () => {
    it('should confirm auxiliary order successfully', async () => {
      const result = await orderService.confirmAuxiliaryOrder('1');

      expect(mockApiService.put).toHaveBeenCalledWith('/api/orders/1/confirm');
      expect(result).toEqual(mockOrder);
    });
  });

  describe('confirmFinishedOrder', () => {
    it('should confirm finished order successfully', async () => {
      const result = await orderService.confirmFinishedOrder('1');

      expect(mockApiService.put).toHaveBeenCalledWith('/api/orders/1/confirm-finished');
      expect(result).toEqual(mockOrder);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order successfully', async () => {
      const result = await orderService.cancelOrder('1');

      expect(mockApiService.delete).toHaveBeenCalledWith('/api/orders/1');
      expect(result).toEqual(mockOrder);
    });
  });

  describe('deleteOrder', () => {
    it('should delete order successfully', async () => {
      mockApiService.delete.mockResolvedValue({
        success: true,
        data: undefined,
      });

      await orderService.deleteOrder('1');

      expect(mockApiService.delete).toHaveBeenCalledWith('/api/orders/1/delete');
    });
  });

  describe('validateOrderData', () => {
    it('should return no errors for valid data', () => {
      const validData = {
        customerName: 'Valid Customer',
        items: [
          {
            materialId: 'mat1',
            quantity: 5,
            unitPrice: 100,
          },
        ],
      };

      const errors = orderService.validateOrderData(validData);

      expect(errors).toHaveLength(0);
    });

    it('should return errors for empty customer name', () => {
      const invalidData = {
        customerName: '',
        items: [
          {
            materialId: 'mat1',
            quantity: 5,
            unitPrice: 100,
          },
        ],
      };

      const errors = orderService.validateOrderData(invalidData);

      expect(errors).toContain('客戶名稱不能為空');
    });

    it('should return errors for too long customer name', () => {
      const invalidData = {
        customerName: 'a'.repeat(101),
        items: [
          {
            materialId: 'mat1',
            quantity: 5,
            unitPrice: 100,
          },
        ],
      };

      const errors = orderService.validateOrderData(invalidData);

      expect(errors).toContain('客戶名稱不能超過100個字符');
    });

    it('should return errors for empty items', () => {
      const invalidData = {
        customerName: 'Valid Customer',
        items: [],
      };

      const errors = orderService.validateOrderData(invalidData);

      expect(errors).toContain('訂單必須包含至少一個項目');
    });

    it('should return errors for invalid item data', () => {
      const invalidData = {
        customerName: 'Valid Customer',
        items: [
          {
            materialId: '',
            quantity: 0,
            unitPrice: -10,
          },
          {
            materialId: 'mat2',
            quantity: 5.5,
            unitPrice: 100,
          },
        ],
      };

      const errors = orderService.validateOrderData(invalidData);

      expect(errors).toContain('項目 1: 基材ID不能為空');
      expect(errors).toContain('項目 1: 數量必須大於0');
      expect(errors).toContain('項目 1: 單價必須大於0');
      expect(errors).toContain('項目 2: 數量必須為整數');
    });
  });

  describe('Utility Methods', () => {
    it('should calculate order total correctly', () => {
      const items = [
        { quantity: 5, unitPrice: 100 },
        { quantity: 3, unitPrice: 200 },
        { quantity: 2, unitPrice: 150 },
      ];

      const total = orderService.calculateOrderTotal(items);

      expect(total).toBe(1400); // 500 + 600 + 300
    });

    it('should get order status options', () => {
      const options = orderService.getOrderStatusOptions();

      expect(options).toHaveLength(6);
      expect(options[0]).toEqual({ label: '待處理', value: 'PENDING' });
      expect(options[5]).toEqual({ label: '已取消', value: 'CANCELLED' });
    });

    it('should get order status text', () => {
      expect(orderService.getOrderStatusText('PENDING')).toBe('待處理');
      expect(orderService.getOrderStatusText('CONFIRMED')).toBe('已確認');
      expect(orderService.getOrderStatusText('COMPLETED')).toBe('已完成');
    });

    it('should check if order can be edited', () => {
      expect(orderService.canEditOrder('PENDING')).toBe(true);
      expect(orderService.canEditOrder('APPROVED')).toBe(true);
      expect(orderService.canEditOrder('CONFIRMED')).toBe(false);
      expect(orderService.canEditOrder('COMPLETED')).toBe(false);
    });

    it('should check if order can be cancelled', () => {
      expect(orderService.canCancelOrder('PENDING')).toBe(true);
      expect(orderService.canCancelOrder('APPROVED')).toBe(true);
      expect(orderService.canCancelOrder('CONFIRMED')).toBe(true);
      expect(orderService.canCancelOrder('PROCESSING')).toBe(false);
      expect(orderService.canCancelOrder('COMPLETED')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors with proper error messages', async () => {
      mockApiService.get.mockRejectedValue(new Error('NETWORK_ERROR'));

      await expect(orderService.getOrders()).rejects.toThrow('網路連線異常，請檢查網路設定');
    });

    it('should handle unauthorized errors', async () => {
      mockApiService.get.mockRejectedValue(new Error('UNAUTHORIZED'));

      await expect(orderService.getOrders()).rejects.toThrow('沒有權限執行此操作');
    });

    it('should handle timeout errors', async () => {
      mockApiService.get.mockRejectedValue(new Error('REQUEST_TIMEOUT'));

      await expect(orderService.getOrders()).rejects.toThrow('請求逾時，請稍後再試');
    });

    it('should handle generic errors', async () => {
      mockApiService.get.mockRejectedValue(new Error('Some other error'));

      await expect(orderService.getOrders()).rejects.toThrow('Some other error');
    });

    it('should handle string errors', async () => {
      mockApiService.get.mockRejectedValue('String error');

      await expect(orderService.getOrders()).rejects.toThrow('String error');
    });
  });

  describe('Search and Filter', () => {
    it('should get orders by status', async () => {
      await orderService.getOrdersByStatus('PENDING', 2, 20);

      expect(mockApiService.get).toHaveBeenCalledWith('/api/orders?status=PENDING&page=2&limit=20');
    });

    it('should search orders', async () => {
      const filters = { status: 'CONFIRMED' as const };
      
      await orderService.searchOrders('test search', filters);

      expect(mockApiService.get).toHaveBeenCalledWith('/api/orders?status=CONFIRMED');
    });
  });

  describe('Order Calculation Logic', () => {
    it('should calculate order total with multiple items', () => {
      const items = [
        { quantity: 10, unitPrice: 100 },
        { quantity: 5, unitPrice: 200 },
        { quantity: 3, unitPrice: 150 },
      ];

      const total = orderService.calculateOrderTotal(items);

      expect(total).toBe(2450); // 1000 + 1000 + 450
    });

    it('should calculate order total with zero quantities', () => {
      const items = [
        { quantity: 0, unitPrice: 100 },
        { quantity: 5, unitPrice: 0 },
      ];

      const total = orderService.calculateOrderTotal(items);

      expect(total).toBe(0);
    });

    it('should calculate order total with decimal prices', () => {
      const items = [
        { quantity: 2, unitPrice: 99.99 },
        { quantity: 1, unitPrice: 150.50 },
      ];

      const total = orderService.calculateOrderTotal(items);

      expect(total).toBe(350.48); // 199.98 + 150.50
    });

    it('should handle empty items array', () => {
      const items: Array<{ quantity: number; unitPrice: number }> = [];

      const total = orderService.calculateOrderTotal(items);

      expect(total).toBe(0);
    });
  });

  describe('Order Status Management', () => {
    it('should update order status with proper API call', async () => {
      const orderId = '123';
      const newStatus = 'PROCESSING';

      const result = await orderService.updateOrderStatus(orderId, newStatus);

      expect(mockApiService.put).toHaveBeenCalledWith(`/api/orders/${orderId}/status`, { status: newStatus });
      expect(result).toEqual(mockOrder);
    });

    it('should handle status update errors', async () => {
      mockApiService.put.mockResolvedValue({
        success: false,
        error: 'Status update failed',
      });

      await expect(orderService.updateOrderStatus('123', 'PROCESSING')).rejects.toThrow('Status update failed');
    });

    it('should validate status transitions', () => {
      expect(orderService.canEditOrder('PENDING')).toBe(true);
      expect(orderService.canEditOrder('APPROVED')).toBe(true);
      expect(orderService.canEditOrder('PROCESSING')).toBe(false);
      expect(orderService.canEditOrder('COMPLETED')).toBe(false);
      expect(orderService.canEditOrder('CANCELLED')).toBe(false);
    });

    it('should validate cancellation permissions', () => {
      expect(orderService.canCancelOrder('PENDING')).toBe(true);
      expect(orderService.canCancelOrder('APPROVED')).toBe(true);
      expect(orderService.canCancelOrder('CONFIRMED')).toBe(true);
      expect(orderService.canCancelOrder('PROCESSING')).toBe(false);
      expect(orderService.canCancelOrder('COMPLETED')).toBe(false);
      expect(orderService.canCancelOrder('CANCELLED')).toBe(false);
    });
  });

  describe('Order CRUD Operations Integration', () => {
    it('should create order and return proper response', async () => {
      const orderData = {
        customerName: 'Integration Test Customer',
        items: [
          { materialId: 'mat1', quantity: 5, unitPrice: 100 },
          { materialId: 'mat2', quantity: 3, unitPrice: 200 },
        ],
      };

      const result = await orderService.createOrder(orderData);

      expect(mockApiService.post).toHaveBeenCalledWith('/api/orders', orderData);
      expect(result).toEqual(mockOrder);
    });

    it('should fetch order with items and validate structure', async () => {
      mockApiService.get.mockResolvedValue({
        success: true,
        data: mockOrderWithItems,
      });

      const result = await orderService.getOrderById('1');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('items');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items[0]).toHaveProperty('materialId');
      expect(result.items[0]).toHaveProperty('quantity');
      expect(result.items[0]).toHaveProperty('unitPrice');
      expect(result.items[0]).toHaveProperty('subtotal');
    });

    it('should update order name successfully', async () => {
      const orderId = '123';
      const newName = 'Updated Order Name';

      const result = await orderService.updateOrderName(orderId, newName);

      expect(mockApiService.put).toHaveBeenCalledWith(`/api/orders/${orderId}/name`, { name: newName });
      expect(result).toEqual(mockOrder);
    });

    it('should delete order with proper confirmation', async () => {
      mockApiService.delete.mockResolvedValue({
        success: true,
        data: undefined,
      });

      await orderService.deleteOrder('123');

      expect(mockApiService.delete).toHaveBeenCalledWith('/api/orders/123/delete');
    });
  });

  describe('Order Type Specific Operations', () => {
    it('should create auxiliary order with correct endpoint', async () => {
      const auxiliaryOrderData = {
        customerName: 'Auxiliary Customer',
        items: [{ materialId: 'aux1', quantity: 10, unitPrice: 50 }],
      };

      await orderService.createAuxiliaryOrder(auxiliaryOrderData);

      expect(mockApiService.post).toHaveBeenCalledWith('/api/orders/auxiliary', auxiliaryOrderData);
    });

    it('should create finished order with correct endpoint', async () => {
      const finishedOrderData = {
        customerName: 'Finished Customer',
        items: [{ materialId: 'fin1', quantity: 3, unitPrice: 500 }],
      };

      await orderService.createFinishedOrder(finishedOrderData);

      expect(mockApiService.post).toHaveBeenCalledWith('/api/orders/finished', finishedOrderData);
    });

    it('should confirm auxiliary order', async () => {
      const result = await orderService.confirmAuxiliaryOrder('123');

      expect(mockApiService.put).toHaveBeenCalledWith('/api/orders/123/confirm');
      expect(result).toEqual(mockOrder);
    });

    it('should confirm finished order', async () => {
      const result = await orderService.confirmFinishedOrder('123');

      expect(mockApiService.put).toHaveBeenCalledWith('/api/orders/123/confirm-finished');
      expect(result).toEqual(mockOrder);
    });
  });

  describe('Advanced Validation Tests', () => {
    it('should validate complex order data with multiple validation errors', () => {
      const invalidData = {
        customerName: '', // Empty name
        items: [
          {
            materialId: '', // Empty material ID
            quantity: -5, // Negative quantity
            unitPrice: 0, // Zero price
          },
          {
            materialId: 'valid-id',
            quantity: 2.5, // Non-integer quantity
            unitPrice: -100, // Negative price
          },
        ],
      };

      const errors = orderService.validateOrderData(invalidData);

      expect(errors).toContain('客戶名稱不能為空');
      expect(errors).toContain('項目 1: 基材ID不能為空');
      expect(errors).toContain('項目 1: 數量必須大於0');
      expect(errors).toContain('項目 1: 單價必須大於0');
      expect(errors).toContain('項目 2: 數量必須為整數');
      expect(errors).toContain('項目 2: 單價必須大於0');
    });

    it('should validate customer name length limits', () => {
      const longNameData = {
        customerName: 'a'.repeat(101), // Exceeds 100 character limit
        items: [{ materialId: 'mat1', quantity: 1, unitPrice: 100 }],
      };

      const errors = orderService.validateOrderData(longNameData);

      expect(errors).toContain('客戶名稱不能超過100個字符');
    });

    it('should pass validation for valid order data', () => {
      const validData = {
        customerName: 'Valid Customer Name',
        items: [
          { materialId: 'mat1', quantity: 5, unitPrice: 100 },
          { materialId: 'mat2', quantity: 10, unitPrice: 50 },
        ],
      };

      const errors = orderService.validateOrderData(validData);

      expect(errors).toHaveLength(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network timeout during order creation', async () => {
      mockApiService.post.mockRejectedValue(new Error('REQUEST_TIMEOUT'));

      await expect(orderService.createOrder({
        customerName: 'Test',
        items: [{ materialId: 'mat1', quantity: 1, unitPrice: 100 }],
      })).rejects.toThrow('請求逾時，請稍後再試');
    });

    it('should handle unauthorized access during status update', async () => {
      mockApiService.put.mockRejectedValue(new Error('UNAUTHORIZED'));

      await expect(orderService.updateOrderStatus('123', 'PROCESSING')).rejects.toThrow('沒有權限執行此操作');
    });

    it('should handle malformed API responses', async () => {
      mockApiService.get.mockResolvedValue({
        success: false,
        error: undefined, // No error message
      });

      await expect(orderService.getOrders()).rejects.toThrow('Failed to get orders');
    });

    it('should handle empty order list response', async () => {
      mockApiService.get.mockResolvedValue({
        success: true,
        data: {
          orders: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      });

      const result = await orderService.getOrders();

      expect(result.orders).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});