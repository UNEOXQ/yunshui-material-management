import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Provider } from 'react-native-paper';
import OrderStatusManager from '../OrderStatusManager';
import { orderService } from '../../../services/orderService';

// Mock dependencies
jest.mock('../../../services/orderService');
jest.spyOn(Alert, 'alert');

const mockOrderService = orderService as jest.Mocked<typeof orderService>;

describe('OrderStatusManager', () => {
  const defaultProps = {
    orderId: 'test-order-1',
    currentStatus: 'PENDING' as const,
    onStatusUpdate: jest.fn(),
    disabled: false,
  };

  const renderComponent = (props = {}) => {
    return render(
      <Provider>
        <OrderStatusManager {...defaultProps} {...props} />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock orderService methods
    mockOrderService.getOrderStatusOptions.mockReturnValue([
      { label: '待處理', value: 'PENDING' },
      { label: '已批准', value: 'APPROVED' },
      { label: '已確認', value: 'CONFIRMED' },
      { label: '處理中', value: 'PROCESSING' },
      { label: '已完成', value: 'COMPLETED' },
      { label: '已取消', value: 'CANCELLED' },
    ]);

    mockOrderService.getOrderStatusText.mockImplementation((status) => {
      const statusMap = {
        'PENDING': '待處理',
        'APPROVED': '已批准',
        'CONFIRMED': '已確認',
        'PROCESSING': '處理中',
        'COMPLETED': '已完成',
        'CANCELLED': '已取消',
      };
      return statusMap[status] || status;
    });

    mockOrderService.updateOrderStatus.mockResolvedValue({
      id: 'test-order-1',
      userId: 'user1',
      orderNumber: 'ORD-001',
      customerName: 'Test Customer',
      status: 'APPROVED',
      totalAmount: 1000,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });
  });

  describe('Rendering', () => {
    it('should render current status correctly', () => {
      renderComponent();

      expect(screen.getByText('當前狀態')).toBeTruthy();
      expect(screen.getByText('待處理')).toBeTruthy();
      expect(screen.getByText('更新狀態')).toBeTruthy();
    });

    it('should disable update button when disabled prop is true', () => {
      renderComponent({ disabled: true });

      const updateButton = screen.getByText('更新狀態');
      expect(updateButton).toBeDisabled();
    });

    it('should hide update button for completed orders', () => {
      renderComponent({ currentStatus: 'COMPLETED' });

      expect(screen.queryByText('更新狀態')).toBeNull();
      expect(screen.getByText('訂單已完成，無法更改狀態')).toBeTruthy();
    });

    it('should hide update button for cancelled orders', () => {
      renderComponent({ currentStatus: 'CANCELLED' });

      expect(screen.queryByText('更新狀態')).toBeNull();
      expect(screen.getByText('訂單已取消，無法更改狀態')).toBeTruthy();
    });
  });

  describe('Status Update Dialog', () => {
    it('should open status update dialog when update button is pressed', () => {
      renderComponent();

      fireEvent.press(screen.getByText('更新狀態'));

      expect(screen.getByText('更新訂單狀態')).toBeTruthy();
      expect(screen.getByText('選擇新的訂單狀態：')).toBeTruthy();
    });

    it('should show all available status options in dialog', () => {
      renderComponent();

      fireEvent.press(screen.getByText('更新狀態'));

      expect(screen.getByText('已批准')).toBeTruthy();
      expect(screen.getByText('已確認')).toBeTruthy();
      expect(screen.getByText('處理中')).toBeTruthy();
      expect(screen.getByText('已完成')).toBeTruthy();
      expect(screen.getByText('已取消')).toBeTruthy();
    });

    it('should close dialog when cancel button is pressed', () => {
      renderComponent();

      fireEvent.press(screen.getByText('更新狀態'));
      fireEvent.press(screen.getByText('取消'));

      expect(screen.queryByText('更新訂單狀態')).toBeNull();
    });
  });

  describe('Status Update Logic', () => {
    it('should update status successfully', async () => {
      const onStatusUpdate = jest.fn();
      renderComponent({ onStatusUpdate });

      // Open dialog
      fireEvent.press(screen.getByText('更新狀態'));

      // Select new status
      fireEvent.press(screen.getByText('已批准'));

      // Confirm update
      fireEvent.press(screen.getByText('確認更新'));

      await waitFor(() => {
        expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith('test-order-1', 'APPROVED');
      });

      expect(onStatusUpdate).toHaveBeenCalledWith('APPROVED');
      expect(Alert.alert).toHaveBeenCalledWith('成功', '訂單狀態已更新為「已批准」');
    });

    it('should show confirmation dialog for cancellation', async () => {
      renderComponent();

      fireEvent.press(screen.getByText('更新狀態'));
      fireEvent.press(screen.getByText('已取消'));
      fireEvent.press(screen.getByText('確認更新'));

      expect(Alert.alert).toHaveBeenCalledWith(
        '確認取消',
        '確定要取消這個訂單嗎？此操作無法撤銷。',
        expect.any(Array)
      );
    });

    it('should show confirmation dialog for completion', async () => {
      renderComponent();

      fireEvent.press(screen.getByText('更新狀態'));
      fireEvent.press(screen.getByText('已完成'));
      fireEvent.press(screen.getByText('確認更新'));

      expect(Alert.alert).toHaveBeenCalledWith(
        '確認完成',
        '確定要將訂單標記為已完成嗎？',
        expect.any(Array)
      );
    });

    it('should handle status update errors', async () => {
      mockOrderService.updateOrderStatus.mockRejectedValue(new Error('Update failed'));

      renderComponent();

      fireEvent.press(screen.getByText('更新狀態'));
      fireEvent.press(screen.getByText('已批准'));
      fireEvent.press(screen.getByText('確認更新'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('錯誤', '更新訂單狀態失敗，請稍後再試');
      });
    });

    it('should not update if same status is selected', () => {
      renderComponent();

      fireEvent.press(screen.getByText('更新狀態'));
      fireEvent.press(screen.getByText('確認更新'));

      expect(mockOrderService.updateOrderStatus).not.toHaveBeenCalled();
    });
  });

  describe('Status Display', () => {
    it('should display correct status colors and icons', () => {
      const { rerender } = renderComponent({ currentStatus: 'PENDING' });
      expect(screen.getByText('待處理')).toBeTruthy();

      rerender(
        <Provider>
          <OrderStatusManager {...defaultProps} currentStatus="COMPLETED" />
        </Provider>
      );
      expect(screen.getByText('已完成')).toBeTruthy();

      rerender(
        <Provider>
          <OrderStatusManager {...defaultProps} currentStatus="CANCELLED" />
        </Provider>
      );
      expect(screen.getByText('已取消')).toBeTruthy();
    });
  });

  describe('Comment Input', () => {
    it('should allow entering comments for status updates', () => {
      renderComponent();

      fireEvent.press(screen.getByText('更新狀態'));

      const commentInput = screen.getByPlaceholderText('請輸入狀態變更的備註說明...');
      fireEvent.changeText(commentInput, '測試備註');

      expect(commentInput.props.value).toBe('測試備註');
    });

    it('should clear comment when dialog is closed', () => {
      renderComponent();

      fireEvent.press(screen.getByText('更新狀態'));
      
      const commentInput = screen.getByPlaceholderText('請輸入狀態變更的備註說明...');
      fireEvent.changeText(commentInput, '測試備註');
      
      fireEvent.press(screen.getByText('取消'));
      fireEvent.press(screen.getByText('更新狀態'));

      const newCommentInput = screen.getByPlaceholderText('請輸入狀態變更的備註說明...');
      expect(newCommentInput.props.value).toBe('');
    });
  });
});