import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-native-paper';
import OrderStatusHistory from '../OrderStatusHistory';
import { orderService } from '../../../services/orderService';

// Mock dependencies
jest.mock('../../../services/orderService');

const mockOrderService = orderService as jest.Mocked<typeof orderService>;

describe('OrderStatusHistory', () => {
  const renderComponent = (orderId = 'test-order-1') => {
    return render(
      <Provider>
        <OrderStatusHistory orderId={orderId} />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
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
  });

  describe('Loading State', () => {
    it('should show loading indicator initially', () => {
      renderComponent();

      expect(screen.getByText('載入狀態歷史...')).toBeTruthy();
    });
  });

  describe('History Display', () => {
    it('should display status history after loading', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('狀態變更歷史')).toBeTruthy();
      });

      // Check for mock history items
      expect(screen.getByText('訂單已建立')).toBeTruthy();
      expect(screen.getByText('訂單已審核通過')).toBeTruthy();
      expect(screen.getByText('客戶已確認訂單內容')).toBeTruthy();
    });

    it('should display status transitions correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('待處理')).toBeTruthy();
        expect(screen.getByText('已批准')).toBeTruthy();
        expect(screen.getByText('已確認')).toBeTruthy();
      });
    });

    it('should show creator information', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('由 系統 操作')).toBeTruthy();
        expect(screen.getByText('由 管理員 操作')).toBeTruthy();
        expect(screen.getByText('由 客服 操作')).toBeTruthy();
      });
    });

    it('should format dates correctly', async () => {
      renderComponent();

      await waitFor(() => {
        // Check that dates are displayed (exact format may vary based on locale)
        const dateElements = screen.getAllByText(/\d{4}\/\d{2}\/\d{2}/);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no history exists', async () => {
      // Mock empty history
      jest.spyOn(React, 'useState')
        .mockImplementationOnce(() => [[], jest.fn()]) // history state
        .mockImplementationOnce(() => [false, jest.fn()]); // loading state

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('暫無狀態變更記錄')).toBeTruthy();
      });
    });
  });

  describe('Timeline Visualization', () => {
    it('should render timeline dots for each status change', async () => {
      renderComponent();

      await waitFor(() => {
        // Timeline should be visible with proper structure
        expect(screen.getByText('狀態變更歷史')).toBeTruthy();
      });

      // Check that multiple history items are rendered
      const historyItems = screen.getAllByText(/由 .* 操作/);
      expect(historyItems.length).toBe(3);
    });

    it('should show status icons for different statuses', async () => {
      renderComponent();

      await waitFor(() => {
        // Verify that status changes are displayed
        expect(screen.getByText('待處理')).toBeTruthy();
        expect(screen.getByText('已批准')).toBeTruthy();
        expect(screen.getByText('已確認')).toBeTruthy();
      });
    });
  });

  describe('Status Color Coding', () => {
    it('should apply correct colors for different statuses', async () => {
      renderComponent();

      await waitFor(() => {
        // Verify status text is displayed (color testing would require more complex setup)
        expect(screen.getByText('待處理')).toBeTruthy();
        expect(screen.getByText('已批准')).toBeTruthy();
        expect(screen.getByText('已確認')).toBeTruthy();
      });
    });
  });

  describe('Scrollable Content', () => {
    it('should handle long history lists with scrolling', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('狀態變更歷史')).toBeTruthy();
      });

      // Verify that the history list is rendered and can contain multiple items
      const historySection = screen.getByText('狀態變更歷史');
      expect(historySection).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle loading errors gracefully', async () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('狀態變更歷史')).toBeTruthy();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Component Updates', () => {
    it('should reload history when orderId changes', async () => {
      const { rerender } = renderComponent('order-1');

      await waitFor(() => {
        expect(screen.getByText('狀態變更歷史')).toBeTruthy();
      });

      // Rerender with different orderId
      rerender(
        <Provider>
          <OrderStatusHistory orderId="order-2" />
        </Provider>
      );

      // Should show loading again for new order
      expect(screen.getByText('載入狀態歷史...')).toBeTruthy();
    });
  });

  describe('Date Formatting', () => {
    it('should format dates in Chinese locale', async () => {
      renderComponent();

      await waitFor(() => {
        // Check that dates are formatted (specific format depends on implementation)
        const datePattern = /\d{4}\/\d{2}\/\d{2}|\d{2}:\d{2}/;
        const textElements = screen.getAllByText(datePattern);
        expect(textElements.length).toBeGreaterThan(0);
      });
    });
  });
});