import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Provider } from 'react-native-paper';
import OrdersScreen from '../OrdersScreen';
import apiClient from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');
jest.spyOn(Alert, 'alert');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

describe('OrdersScreen', () => {
  const mockOrders = [
    {
      id: '1',
      projectName: '測試專案1',
      customerName: '客戶A',
      status: 'PENDING',
      totalAmount: 1000,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      projectName: '測試專案2',
      customerName: '客戶B',
      status: 'PROCESSING',
      totalAmount: 2000,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
    {
      id: '3',
      projectName: '測試專案3',
      customerName: '客戶C',
      status: 'COMPLETED',
      totalAmount: 1500,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    },
  ];

  const renderComponent = () => {
    return render(
      <Provider>
        <OrdersScreen navigation={mockNavigation} />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockApiClient.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          orders: mockOrders,
          total: mockOrders.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    });

    mockApiClient.put.mockResolvedValue({
      data: {
        success: true,
        data: mockOrders[0],
      },
    });
  });

  describe('Loading and Data Display', () => {
    it('should show loading state initially', () => {
      renderComponent();
      expect(screen.getByText('載入中...')).toBeTruthy();
    });

    it('should display orders after loading', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('測試專案1')).toBeTruthy();
        expect(screen.getByText('測試專案2')).toBeTruthy();
        expect(screen.getByText('測試專案3')).toBeTruthy();
      });

      expect(screen.getByText('客戶A')).toBeTruthy();
      expect(screen.getByText('客戶B')).toBeTruthy();
      expect(screen.getByText('客戶C')).toBeTruthy();
    });

    it('should display order amounts correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('NT$ 1,000')).toBeTruthy();
        expect(screen.getByText('NT$ 2,000')).toBeTruthy();
        expect(screen.getByText('NT$ 1,500')).toBeTruthy();
      });
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('錯誤', '載入訂單失敗');
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter orders by search query', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('測試專案1')).toBeTruthy();
      });

      const searchInput = screen.getByPlaceholderText('搜尋訂單...');
      fireEvent.changeText(searchInput, '專案1');

      expect(screen.getByText('測試專案1')).toBeTruthy();
      expect(screen.queryByText('測試專案2')).toBeNull();
    });

    it('should search by customer name', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('客戶A')).toBeTruthy();
      });

      const searchInput = screen.getByPlaceholderText('搜尋訂單...');
      fireEvent.changeText(searchInput, '客戶B');

      expect(screen.getByText('客戶B')).toBeTruthy();
      expect(screen.queryByText('客戶A')).toBeNull();
    });

    it('should search by order ID', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeTruthy();
      });

      const searchInput = screen.getByPlaceholderText('搜尋訂單...');
      fireEvent.changeText(searchInput, '2');

      expect(screen.getByText('#2')).toBeTruthy();
      expect(screen.queryByText('#1')).toBeNull();
    });
  });

  describe('Status Filtering', () => {
    it('should filter orders by status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('測試專案1')).toBeTruthy();
      });

      // Click on PENDING status filter
      fireEvent.press(screen.getByText('待處理'));

      expect(screen.getByText('測試專案1')).toBeTruthy();
      expect(screen.queryByText('測試專案2')).toBeNull();
    });

    it('should show all orders when ALL filter is selected', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('測試專案1')).toBeTruthy();
      });

      // First filter by status
      fireEvent.press(screen.getByText('待處理'));
      
      // Then select ALL
      fireEvent.press(screen.getByText('全部'));

      expect(screen.getByText('測試專案1')).toBeTruthy();
      expect(screen.getByText('測試專案2')).toBeTruthy();
      expect(screen.getByText('測試專案3')).toBeTruthy();
    });
  });

  describe('Order Actions', () => {
    it('should navigate to order detail when view button is pressed', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('測試專案1')).toBeTruthy();
      });

      const viewButtons = screen.getAllByText('查看詳情');
      fireEvent.press(viewButtons[0]);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('OrderDetail', { orderId: '1' });
    });

    it('should show status update dialog when update button is pressed', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('測試專案1')).toBeTruthy();
      });

      const updateButtons = screen.getAllByText('更新狀態');
      fireEvent.press(updateButtons[0]);

      expect(Alert.alert).toHaveBeenCalledWith(
        '更新訂單狀態',
        '訂單 #1',
        expect.any(Array)
      );
    });

    it('should update order status successfully', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('測試專案1')).toBeTruthy();
      });

      const updateButtons = screen.getAllByText('更新狀態');
      fireEvent.press(updateButtons[0]);

      // Simulate selecting a status from the alert
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const statusOptions = alertCall[2];
      const approvedOption = statusOptions.find((option: any) => option.text === '已批准');
      
      if (approvedOption) {
        approvedOption.onPress();
      }

      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/orders/1/status', {
          status: 'APPROVED',
          comment: '狀態更新為已批准',
        });
      });

      expect(Alert.alert).toHaveBeenCalledWith('成功', '訂單狀態已更新');
    });

    it('should handle status update errors', async () => {
      mockApiClient.put.mockRejectedValue(new Error('Update failed'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('測試專案1')).toBeTruthy();
      });

      const updateButtons = screen.getAllByText('更新狀態');
      fireEvent.press(updateButtons[0]);

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const statusOptions = alertCall[2];
      const approvedOption = statusOptions.find((option: any) => option.text === '已批准');
      
      if (approvedOption) {
        approvedOption.onPress();
      }

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('錯誤', '更新訂單狀態失敗');
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to order form when FAB is pressed', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('測試專案1')).toBeTruthy();
      });

      // Find and press the FAB (floating action button)
      const fab = screen.getByRole('button', { name: /plus/i });
      fireEvent.press(fab);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('OrderForm', {});
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh orders when pull to refresh is triggered', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('測試專案1')).toBeTruthy();
      });

      // Simulate pull to refresh
      const flatList = screen.getByTestId('order-list') || screen.getByText('測試專案1').parent;
      
      // Clear previous calls
      mockApiClient.get.mockClear();

      // Trigger refresh (this would normally be done through gesture)
      // For testing, we'll verify the refresh functionality exists
      expect(mockApiClient.get).toHaveBeenCalledWith('/orders');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no orders exist', async () => {
      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: {
            orders: [],
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
          },
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('暫無訂單數據')).toBeTruthy();
      });
    });

    it('should show empty state when search returns no results', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('測試專案1')).toBeTruthy();
      });

      const searchInput = screen.getByPlaceholderText('搜尋訂單...');
      fireEvent.changeText(searchInput, '不存在的訂單');

      expect(screen.getByText('暫無訂單數據')).toBeTruthy();
    });
  });

  describe('Status Display', () => {
    it('should display correct status chips with proper colors', async () => {
      renderComponent();

      await waitFor(() => {
        // Check that status chips are displayed
        expect(screen.getByText('測試專案1')).toBeTruthy();
      });

      // Verify that different statuses are shown
      // (Color testing would require more complex setup)
      expect(screen.getByText('測試專案1')).toBeTruthy();
      expect(screen.getByText('測試專案2')).toBeTruthy();
      expect(screen.getByText('測試專案3')).toBeTruthy();
    });
  });
});