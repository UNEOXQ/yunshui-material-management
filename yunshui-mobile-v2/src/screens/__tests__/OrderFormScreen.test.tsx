import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Provider } from 'react-native-paper';
import OrderFormScreen from '../OrderFormScreen';
import { orderService } from '../../services/orderService';
import { materialService } from '../../services/materialService';

// Mock dependencies
jest.mock('../../services/orderService');
jest.mock('../../services/materialService');
jest.spyOn(Alert, 'alert');

const mockOrderService = orderService as jest.Mocked<typeof orderService>;
const mockMaterialService = materialService as jest.Mocked<typeof materialService>;

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

const mockRoute = {
  params: {},
};

describe('OrderFormScreen', () => {
  const mockMaterials = [
    {
      id: '1',
      name: '測試基材1',
      category: '石材',
      specification: '30x30cm',
      unit: '片',
      price: 100,
      stock: 50,
      imageUrl: 'https://example.com/image1.jpg',
      description: '測試基材1描述',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: '測試基材2',
      category: '磁磚',
      specification: '60x60cm',
      unit: '片',
      price: 200,
      stock: 30,
      imageUrl: 'https://example.com/image2.jpg',
      description: '測試基材2描述',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockOrder = {
    id: '1',
    userId: 'user1',
    orderNumber: 'ORD-001',
    customerName: '測試客戶',
    status: 'PENDING' as const,
    totalAmount: 1000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    items: [
      {
        id: '1',
        orderId: '1',
        materialId: '1',
        quantity: 5,
        unitPrice: 100,
        subtotal: 500,
        material: mockMaterials[0],
      },
    ],
  };

  const renderComponent = (routeParams = {}) => {
    return render(
      <Provider>
        <OrderFormScreen 
          navigation={mockNavigation} 
          route={{ params: routeParams }} 
        />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockMaterialService.getMaterials.mockResolvedValue({
      materials: mockMaterials,
      total: mockMaterials.length,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    mockOrderService.createOrder.mockResolvedValue(mockOrder);
    mockOrderService.getOrderById.mockResolvedValue(mockOrder);
  });

  describe('Form Rendering', () => {
    it('should render customer info section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('客戶資訊')).toBeTruthy();
        expect(screen.getByPlaceholderText('請輸入客戶名稱')).toBeTruthy();
      });
    });

    it('should render order items section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('訂單項目')).toBeTruthy();
        expect(screen.getByText('添加基材')).toBeTruthy();
      });
    });

    it('should show empty state when no items added', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('尚未添加任何基材')).toBeTruthy();
        expect(screen.getByText('點擊上方按鈕添加基材')).toBeTruthy();
      });
    });
  });

  describe('Material Selection', () => {
    it('should show material selector when add button is pressed', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('添加基材')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('添加基材'));

      expect(screen.getByText('選擇基材')).toBeTruthy();
      expect(screen.getByText('測試基材1')).toBeTruthy();
      expect(screen.getByText('測試基材2')).toBeTruthy();
    });

    it('should add material to order when selected', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('添加基材')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('添加基材'));
      fireEvent.press(screen.getByText('測試基材1'));

      expect(screen.getByText('測試基材1')).toBeTruthy();
      expect(screen.getByDisplayValue('1')).toBeTruthy(); // quantity
      expect(screen.getByDisplayValue('100')).toBeTruthy(); // price
    });

    it('should close material selector when cancel is pressed', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('添加基材')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('添加基材'));
      fireEvent.press(screen.getByText('取消'));

      expect(screen.queryByText('選擇基材')).toBeNull();
    });

    it('should increase quantity when same material is added again', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('添加基材')).toBeTruthy();
      });

      // Add material first time
      fireEvent.press(screen.getByText('添加基材'));
      fireEvent.press(screen.getByText('測試基材1'));

      // Add same material again
      fireEvent.press(screen.getByText('添加基材'));
      fireEvent.press(screen.getByText('測試基材1'));

      const quantityInputs = screen.getAllByDisplayValue('2');
      expect(quantityInputs.length).toBeGreaterThan(0);
    });
  });

  describe('Order Item Management', () => {
    it('should update item quantity correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('添加基材')).toBeTruthy();
      });

      // Add material
      fireEvent.press(screen.getByText('添加基材'));
      fireEvent.press(screen.getByText('測試基材1'));

      // Update quantity
      const quantityInput = screen.getByDisplayValue('1');
      fireEvent.changeText(quantityInput, '5');

      expect(screen.getByDisplayValue('5')).toBeTruthy();
      expect(screen.getByText('NT$ 500')).toBeTruthy(); // subtotal
    });

    it('should update item price correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('添加基材')).toBeTruthy();
      });

      // Add material
      fireEvent.press(screen.getByText('添加基材'));
      fireEvent.press(screen.getByText('測試基材1'));

      // Update price
      const priceInput = screen.getByDisplayValue('100');
      fireEvent.changeText(priceInput, '150');

      expect(screen.getByDisplayValue('150')).toBeTruthy();
      expect(screen.getByText('NT$ 150')).toBeTruthy(); // subtotal
    });

    it('should remove item when remove button is pressed', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('添加基材')).toBeTruthy();
      });

      // Add material
      fireEvent.press(screen.getByText('添加基材'));
      fireEvent.press(screen.getByText('測試基材1'));

      // Remove item
      fireEvent.press(screen.getByText('移除'));

      expect(screen.queryByText('測試基材1')).toBeNull();
      expect(screen.getByText('尚未添加任何基材')).toBeTruthy();
    });

    it('should remove item when quantity is set to 0', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('添加基材')).toBeTruthy();
      });

      // Add material
      fireEvent.press(screen.getByText('添加基材'));
      fireEvent.press(screen.getByText('測試基材1'));

      // Set quantity to 0
      const quantityInput = screen.getByDisplayValue('1');
      fireEvent.changeText(quantityInput, '0');

      expect(screen.queryByText('測試基材1')).toBeNull();
    });
  });

  describe('Order Summary', () => {
    it('should calculate total amount correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('添加基材')).toBeTruthy();
      });

      // Add first material
      fireEvent.press(screen.getByText('添加基材'));
      fireEvent.press(screen.getByText('測試基材1'));

      // Add second material
      fireEvent.press(screen.getByText('添加基材'));
      fireEvent.press(screen.getByText('測試基材2'));

      expect(screen.getByText('NT$ 300')).toBeTruthy(); // 100 + 200
    });

    it('should show correct item count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('添加基材')).toBeTruthy();
      });

      // Add materials
      fireEvent.press(screen.getByText('添加基材'));
      fireEvent.press(screen.getByText('測試基材1'));
      fireEvent.press(screen.getByText('添加基材'));
      fireEvent.press(screen.getByText('測試基材2'));

      expect(screen.getByText('2')).toBeTruthy(); // item count
    });

    it('should show correct total quantity', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('添加基材')).toBeTruthy();
      });

      // Add material and update quantity
      fireEvent.press(screen.getByText('添加基材'));
      fireEvent.press(screen.getByText('測試基材1'));
      
      const quantityInput = screen.getByDisplayValue('1');
      fireEvent.changeText(quantityInput, '5');

      expect(screen.getByText('5')).toBeTruthy(); // total quantity
    });
  });

  describe('Form Validation', () => {
    it('should show validation error when customer name is empty', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('建立訂單')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('建立訂單'));

      expect(Alert.alert).toHaveBeenCalledWith(
        '表單驗證失敗',
        expect.stringContaining('請輸入客戶名稱')
      );
    });

    it('should show validation error when no items added', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('建立訂單')).toBeTruthy();
      });

      const customerInput = screen.getByPlaceholderText('請輸入客戶名稱');
      fireEvent.changeText(customerInput, '測試客戶');

      fireEvent.press(screen.getByText('建立訂單'));

      expect(Alert.alert).toHaveBeenCalledWith(
        '表單驗證失敗',
        expect.stringContaining('請至少添加一個基材項目')
      );
    });

    it('should show validation error for invalid quantities', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('添加基材')).toBeTruthy();
      });

      const customerInput = screen.getByPlaceholderText('請輸入客戶名稱');
      fireEvent.changeText(customerInput, '測試客戶');

      // Add material with invalid quantity
      fireEvent.press(screen.getByText('添加基材'));
      fireEvent.press(screen.getByText('測試基材1'));
      
      const quantityInput = screen.getByDisplayValue('1');
      fireEvent.changeText(quantityInput, '-1');

      fireEvent.press(screen.getByText('建立訂單'));

      expect(Alert.alert).toHaveBeenCalledWith(
        '表單驗證失敗',
        expect.stringContaining('數量必須大於 0')
      );
    });
  });

  describe('Order Creation', () => {
    it('should create order successfully', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('添加基材')).toBeTruthy();
      });

      // Fill form
      const customerInput = screen.getByPlaceholderText('請輸入客戶名稱');
      fireEvent.changeText(customerInput, '測試客戶');

      fireEvent.press(screen.getByText('添加基材'));
      fireEvent.press(screen.getByText('測試基材1'));

      // Submit form
      fireEvent.press(screen.getByText('建立訂單'));

      await waitFor(() => {
        expect(mockOrderService.createOrder).toHaveBeenCalledWith({
          customerName: '測試客戶',
          items: [
            {
              materialId: '1',
              quantity: 1,
              unitPrice: 100,
            },
          ],
        });
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        '成功',
        '訂單建立成功',
        expect.any(Array)
      );
    });

    it('should handle order creation errors', async () => {
      mockOrderService.createOrder.mockRejectedValue(new Error('Creation failed'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('添加基材')).toBeTruthy();
      });

      // Fill form
      const customerInput = screen.getByPlaceholderText('請輸入客戶名稱');
      fireEvent.changeText(customerInput, '測試客戶');

      fireEvent.press(screen.getByText('添加基材'));
      fireEvent.press(screen.getByText('測試基材1'));

      // Submit form
      fireEvent.press(screen.getByText('建立訂單'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('錯誤', '儲存訂單失敗');
      });
    });

    it('should navigate back after successful creation', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('添加基材')).toBeTruthy();
      });

      // Fill and submit form
      const customerInput = screen.getByPlaceholderText('請輸入客戶名稱');
      fireEvent.changeText(customerInput, '測試客戶');

      fireEvent.press(screen.getByText('添加基材'));
      fireEvent.press(screen.getByText('測試基材1'));
      fireEvent.press(screen.getByText('建立訂單'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '成功',
          '訂單建立成功',
          expect.any(Array)
        );
      });

      // Simulate pressing OK on success alert
      const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
        call => call[0] === '成功'
      );
      if (alertCall && alertCall[2] && alertCall[2][0]) {
        alertCall[2][0].onPress();
      }

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    it('should load existing order data in edit mode', async () => {
      renderComponent({ orderId: '1' });

      await waitFor(() => {
        expect(mockOrderService.getOrderById).toHaveBeenCalledWith('1');
      });

      expect(screen.getByDisplayValue('測試客戶')).toBeTruthy();
      expect(screen.getByText('測試基材1')).toBeTruthy();
    });

    it('should show update button in edit mode', async () => {
      renderComponent({ orderId: '1' });

      await waitFor(() => {
        expect(screen.getByText('更新訂單')).toBeTruthy();
      });
    });

    it('should show loading state when loading order data', () => {
      renderComponent({ orderId: '1' });

      expect(screen.getByText('載入訂單資料...')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate back when cancel button is pressed', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('取消')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('取消'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });
});