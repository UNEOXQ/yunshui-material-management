import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import DeliveryStatusManager from './DeliveryStatusManager';

// Mock the status service
vi.mock('../../services/statusService', () => ({
  statusService: {
    updateDeliveryStatus: vi.fn(),
  },
}));

describe('DeliveryStatusManager', () => {
  const mockProps = {
    projectId: 'test-project-id',
    onStatusUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default state', () => {
    render(<DeliveryStatusManager {...mockProps} />);
    
    expect(screen.getByText('到案狀態管理')).toBeInTheDocument();
    expect(screen.getByText('DELIVERY')).toBeInTheDocument();
    expect(screen.getByLabelText('到案狀態')).toBeInTheDocument();
  });

  it('renders with current status', () => {
    const propsWithStatus = {
      ...mockProps,
      currentStatus: {
        status: 'Delivered',
        time: '2023-10-11T14:30',
        address: '台北市信義區信義路五段7號',
        po: 'PO-2023-001',
        deliveredBy: '張三',
      },
    };

    render(<DeliveryStatusManager {...propsWithStatus} />);
    
    expect(screen.getByDisplayValue('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('台北市信義區信義路五段7號')).toBeInTheDocument();
    expect(screen.getByText('PO-2023-001')).toBeInTheDocument();
    expect(screen.getByText('張三')).toBeInTheDocument();
  });

  it('shows delivery details form when "Delivered" is selected', () => {
    render(<DeliveryStatusManager {...mockProps} />);
    
    const statusSelect = screen.getByLabelText('到案狀態');
    
    // Initially delivery details should not be visible
    expect(screen.queryByText('交付詳細資訊')).not.toBeInTheDocument();
    
    // Select "Delivered"
    fireEvent.change(statusSelect, { target: { value: 'Delivered' } });
    
    // Delivery details should now be visible
    expect(screen.getByText('交付詳細資訊')).toBeInTheDocument();
    expect(screen.getByLabelText(/交付時間/)).toBeInTheDocument();
    expect(screen.getByLabelText(/交付地址/)).toBeInTheDocument();
    expect(screen.getByLabelText(/P\.O 編號/)).toBeInTheDocument();
    expect(screen.getByLabelText(/交付人員/)).toBeInTheDocument();
  });

  it('hides delivery details when status is changed from "Delivered"', () => {
    const propsWithStatus = {
      ...mockProps,
      currentStatus: {
        status: 'Delivered',
        time: '2023-10-11T14:30',
        address: '台北市信義區信義路五段7號',
        po: 'PO-2023-001',
        deliveredBy: '張三',
      },
    };

    render(<DeliveryStatusManager {...propsWithStatus} />);
    
    const statusSelect = screen.getByLabelText('到案狀態');
    
    // Delivery details should be visible
    expect(screen.getByText('交付詳細資訊')).toBeInTheDocument();
    
    // Change status to empty
    fireEvent.change(statusSelect, { target: { value: '' } });
    
    // Delivery details should be hidden
    expect(screen.queryByText('交付詳細資訊')).not.toBeInTheDocument();
  });

  it('validates required fields when submitting with "Delivered" status', async () => {
    render(<DeliveryStatusManager {...mockProps} />);
    
    const statusSelect = screen.getByLabelText('到案狀態');
    const submitButton = screen.getByText('更新狀態');
    
    // Select "Delivered" but don't fill required fields
    fireEvent.change(statusSelect, { target: { value: 'Delivered' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('請填寫所有必填欄位')).toBeInTheDocument();
      expect(screen.getByText('交付時間為必填項目')).toBeInTheDocument();
      expect(screen.getByText('交付地址為必填項目')).toBeInTheDocument();
      expect(screen.getByText('P.O 編號為必填項目')).toBeInTheDocument();
      expect(screen.getByText('交付人員為必填項目')).toBeInTheDocument();
    });
  });

  it('clears field errors when user starts typing', async () => {
    render(<DeliveryStatusManager {...mockProps} />);
    
    const statusSelect = screen.getByLabelText('到案狀態');
    const submitButton = screen.getByText('更新狀態');
    
    // Select "Delivered" and trigger validation errors
    fireEvent.change(statusSelect, { target: { value: 'Delivered' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('交付時間為必填項目')).toBeInTheDocument();
    });
    
    // Start typing in time field
    const timeInput = screen.getByLabelText(/交付時間/);
    fireEvent.change(timeInput, { target: { value: '2023-10-11T14:30' } });
    
    // Time error should be cleared
    expect(screen.queryByText('交付時間為必填項目')).not.toBeInTheDocument();
  });

  it('calls onStatusUpdate with correct data when submitting valid form', async () => {
    const mockOnStatusUpdate = vi.fn().mockResolvedValue(undefined);
    
    render(<DeliveryStatusManager {...mockProps} onStatusUpdate={mockOnStatusUpdate} />);
    
    const statusSelect = screen.getByLabelText('到案狀態');
    const timeInput = screen.getByLabelText(/交付時間/);
    const addressInput = screen.getByLabelText(/交付地址/);
    const poInput = screen.getByLabelText(/P\.O 編號/);
    const deliveredByInput = screen.getByLabelText(/交付人員/);
    const submitButton = screen.getByText('更新狀態');
    
    // Fill all required fields
    fireEvent.change(statusSelect, { target: { value: 'Delivered' } });
    fireEvent.change(timeInput, { target: { value: '2023-10-11T14:30' } });
    fireEvent.change(addressInput, { target: { value: '台北市信義區信義路五段7號' } });
    fireEvent.change(poInput, { target: { value: 'PO-2023-001' } });
    fireEvent.change(deliveredByInput, { target: { value: '張三' } });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnStatusUpdate).toHaveBeenCalledWith({
        status: 'Delivered',
        time: '2023-10-11T14:30',
        address: '台北市信義區信義路五段7號',
        po: 'PO-2023-001',
        deliveredBy: '張三',
      });
    });
  });

  it('calls onStatusUpdate with only status when submitting empty status', async () => {
    const mockOnStatusUpdate = vi.fn().mockResolvedValue(undefined);
    
    render(<DeliveryStatusManager {...mockProps} onStatusUpdate={mockOnStatusUpdate} />);
    
    const submitButton = screen.getByText('更新狀態');
    
    // Submit with empty status (should be valid)
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnStatusUpdate).toHaveBeenCalledWith({
        status: '',
      });
    });
  });

  it('handles submission error correctly', async () => {
    const mockOnStatusUpdate = vi.fn().mockRejectedValue(new Error('Update failed'));
    
    render(<DeliveryStatusManager {...mockProps} onStatusUpdate={mockOnStatusUpdate} />);
    
    const submitButton = screen.getByText('更新狀態');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });

  it('shows reset button when there are changes', () => {
    const propsWithStatus = {
      ...mockProps,
      currentStatus: {
        status: 'Delivered',
        time: '2023-10-11T14:30',
        address: '台北市信義區信義路五段7號',
        po: 'PO-2023-001',
        deliveredBy: '張三',
      },
    };

    render(<DeliveryStatusManager {...propsWithStatus} />);
    
    const statusSelect = screen.getByLabelText('到案狀態');
    
    // Initially no reset button (no changes)
    expect(screen.queryByText('重置')).not.toBeInTheDocument();
    
    // Make a change
    fireEvent.change(statusSelect, { target: { value: '' } });
    
    // Reset button should appear
    expect(screen.getByText('重置')).toBeInTheDocument();
  });

  it('resets form when reset button is clicked', () => {
    const propsWithStatus = {
      ...mockProps,
      currentStatus: {
        status: 'Delivered',
        time: '2023-10-11T14:30',
        address: '台北市信義區信義路五段7號',
        po: 'PO-2023-001',
        deliveredBy: '張三',
      },
    };

    render(<DeliveryStatusManager {...propsWithStatus} />);
    
    const statusSelect = screen.getByLabelText('到案狀態') as HTMLSelectElement;
    const addressInput = screen.getByLabelText(/交付地址/) as HTMLInputElement;
    
    // Make changes
    fireEvent.change(statusSelect, { target: { value: '' } });
    fireEvent.change(addressInput, { target: { value: '新地址' } });
    
    expect(statusSelect.value).toBe('');
    expect(addressInput.value).toBe('新地址');
    
    // Click reset
    const resetButton = screen.getByText('重置');
    fireEvent.click(resetButton);
    
    // Values should be restored
    expect(statusSelect.value).toBe('Delivered');
    expect(addressInput.value).toBe('台北市信義區信義路五段7號');
  });

  it('disables form when disabled prop is true', () => {
    render(<DeliveryStatusManager {...mockProps} disabled={true} />);
    
    const statusSelect = screen.getByLabelText('到案狀態');
    const submitButton = screen.getByText('更新狀態');
    
    expect(statusSelect).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state during submission', async () => {
    const mockOnStatusUpdate = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<DeliveryStatusManager {...mockProps} onStatusUpdate={mockOnStatusUpdate} />);
    
    const submitButton = screen.getByText('更新狀態');
    fireEvent.click(submitButton);
    
    // Should show loading state
    expect(screen.getByText('更新中...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.getByText('更新狀態')).toBeInTheDocument();
    });
  });

  it('displays status rules information', () => {
    render(<DeliveryStatusManager {...mockProps} />);
    
    expect(screen.getByText('狀態規則說明')).toBeInTheDocument();
    expect(screen.getByText(/下拉選單可選擇 "Delivered" 或保持空白/)).toBeInTheDocument();
    expect(screen.getByText(/當選擇 "Delivered" 時，必須填寫所有交付詳細資訊/)).toBeInTheDocument();
    expect(screen.getByText(/交付詳細資訊包含：時間、地址、P.O 編號、交付人員/)).toBeInTheDocument();
  });

  it('formats datetime correctly in current status display', () => {
    const propsWithStatus = {
      ...mockProps,
      currentStatus: {
        status: 'Delivered',
        time: '2023-10-11T14:30:00',
        address: '台北市信義區信義路五段7號',
        po: 'PO-2023-001',
        deliveredBy: '張三',
      },
    };

    render(<DeliveryStatusManager {...propsWithStatus} />);
    
    // Should format the datetime for display
    expect(screen.getByText(/2023/)).toBeInTheDocument();
    expect(screen.getByText(/14:30/)).toBeInTheDocument();
  });

  it('handles invalid datetime gracefully', () => {
    const propsWithStatus = {
      ...mockProps,
      currentStatus: {
        status: 'Delivered',
        time: 'invalid-date',
        address: '台北市信義區信義路五段7號',
        po: 'PO-2023-001',
        deliveredBy: '張三',
      },
    };

    render(<DeliveryStatusManager {...propsWithStatus} />);
    
    // Should display the original string if parsing fails
    expect(screen.getByText('invalid-date')).toBeInTheDocument();
  });
});