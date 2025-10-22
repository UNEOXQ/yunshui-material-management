import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import OrderStatusManager from './OrderStatusManager';

// Mock the status service
vi.mock('../../services/statusService', () => ({
  statusService: {
    updateOrderStatus: vi.fn(),
  },
}));

describe('OrderStatusManager', () => {
  const mockProps = {
    projectId: 'test-project-id',
    onStatusUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default state', () => {
    render(<OrderStatusManager {...mockProps} />);
    
    expect(screen.getByText('叫貨狀態管理')).toBeInTheDocument();
    expect(screen.getByText('ORDER')).toBeInTheDocument();
    expect(screen.getByLabelText('主要狀態')).toBeInTheDocument();
    expect(screen.getByLabelText('處理狀態')).toBeInTheDocument();
  });

  it('renders with current status', () => {
    const propsWithStatus = {
      ...mockProps,
      currentStatus: {
        primaryStatus: 'Ordered',
        secondaryStatus: 'Processing',
      },
    };

    render(<OrderStatusManager {...propsWithStatus} />);
    
    expect(screen.getByDisplayValue('Ordered')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Processing')).toBeInTheDocument();
    expect(screen.getByText('Ordered')).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('enables secondary dropdown when primary is "Ordered"', () => {
    render(<OrderStatusManager {...mockProps} />);
    
    const primarySelect = screen.getByLabelText('主要狀態');
    const secondarySelect = screen.getByLabelText('處理狀態');
    
    // Initially secondary should be disabled
    expect(secondarySelect).toBeDisabled();
    
    // Select "Ordered" in primary
    fireEvent.change(primarySelect, { target: { value: 'Ordered' } });
    
    // Secondary should now be enabled
    expect(secondarySelect).not.toBeDisabled();
  });

  it('resets secondary status when primary changes from "Ordered"', () => {
    render(<OrderStatusManager {...mockProps} />);
    
    const primarySelect = screen.getByLabelText('主要狀態');
    const secondarySelect = screen.getByLabelText('處理狀態');
    
    // Set primary to "Ordered" and secondary to "Processing"
    fireEvent.change(primarySelect, { target: { value: 'Ordered' } });
    fireEvent.change(secondarySelect, { target: { value: 'Processing' } });
    
    expect((secondarySelect as HTMLSelectElement).value).toBe('Processing');
    
    // Change primary back to empty
    fireEvent.change(primarySelect, { target: { value: '' } });
    
    // Secondary should be reset
    expect((secondarySelect as HTMLSelectElement).value).toBe('');
    expect(secondarySelect).toBeDisabled();
  });

  it('shows validation error when submitting without primary status', async () => {
    render(<OrderStatusManager {...mockProps} />);
    
    const submitButton = screen.getByText('更新狀態');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('請選擇主要狀態')).toBeInTheDocument();
    });
  });

  it('shows validation error when primary is "Ordered" but no secondary status', async () => {
    render(<OrderStatusManager {...mockProps} />);
    
    const primarySelect = screen.getByLabelText('主要狀態');
    const submitButton = screen.getByText('更新狀態');
    
    fireEvent.change(primarySelect, { target: { value: 'Ordered' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('當狀態為 Ordered 時，請選擇處理狀態')).toBeInTheDocument();
    });
  });

  it('calls onStatusUpdate with correct data when submitting valid form', async () => {
    const mockOnStatusUpdate = vi.fn().mockResolvedValue(undefined);
    
    render(<OrderStatusManager {...mockProps} onStatusUpdate={mockOnStatusUpdate} />);
    
    const primarySelect = screen.getByLabelText('主要狀態');
    const secondarySelect = screen.getByLabelText('處理狀態');
    const submitButton = screen.getByText('更新狀態');
    
    fireEvent.change(primarySelect, { target: { value: 'Ordered' } });
    fireEvent.change(secondarySelect, { target: { value: 'Processing' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnStatusUpdate).toHaveBeenCalledWith({
        primaryStatus: 'Ordered',
        secondaryStatus: 'Processing',
      });
    });
  });

  it('handles submission error correctly', async () => {
    const mockOnStatusUpdate = vi.fn().mockRejectedValue(new Error('Update failed'));
    
    render(<OrderStatusManager {...mockProps} onStatusUpdate={mockOnStatusUpdate} />);
    
    const primarySelect = screen.getByLabelText('主要狀態');
    const submitButton = screen.getByText('更新狀態');
    
    fireEvent.change(primarySelect, { target: { value: 'Ordered' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('當狀態為 Ordered 時，請選擇處理狀態')).toBeInTheDocument();
    });
  });

  it('shows reset button when there are changes', () => {
    const propsWithStatus = {
      ...mockProps,
      currentStatus: {
        primaryStatus: 'Ordered',
        secondaryStatus: 'Processing',
      },
    };

    render(<OrderStatusManager {...propsWithStatus} />);
    
    const primarySelect = screen.getByLabelText('主要狀態');
    
    // Initially no reset button (no changes)
    expect(screen.queryByText('重置')).not.toBeInTheDocument();
    
    // Make a change
    fireEvent.change(primarySelect, { target: { value: '' } });
    
    // Reset button should appear
    expect(screen.getByText('重置')).toBeInTheDocument();
  });

  it('resets form when reset button is clicked', () => {
    const propsWithStatus = {
      ...mockProps,
      currentStatus: {
        primaryStatus: 'Ordered',
        secondaryStatus: 'Processing',
      },
    };

    render(<OrderStatusManager {...propsWithStatus} />);
    
    const primarySelect = screen.getByLabelText('主要狀態') as HTMLSelectElement;
    const secondarySelect = screen.getByLabelText('處理狀態') as HTMLSelectElement;
    
    // Make changes
    fireEvent.change(primarySelect, { target: { value: '' } });
    fireEvent.change(secondarySelect, { target: { value: '' } });
    
    expect((primarySelect as HTMLSelectElement).value).toBe('');
    expect((secondarySelect as HTMLSelectElement).value).toBe('');
    
    // Click reset
    const resetButton = screen.getByText('重置');
    fireEvent.click(resetButton);
    
    // Values should be restored
    expect((primarySelect as HTMLSelectElement).value).toBe('Ordered');
    expect((secondarySelect as HTMLSelectElement).value).toBe('Processing');
  });

  it('disables form when disabled prop is true', () => {
    render(<OrderStatusManager {...mockProps} disabled={true} />);
    
    const primarySelect = screen.getByLabelText('主要狀態');
    const secondarySelect = screen.getByLabelText('處理狀態');
    const submitButton = screen.getByText('更新狀態');
    
    expect(primarySelect).toBeDisabled();
    expect(secondarySelect).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state during submission', async () => {
    const mockOnStatusUpdate = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<OrderStatusManager {...mockProps} onStatusUpdate={mockOnStatusUpdate} />);
    
    const primarySelect = screen.getByLabelText('主要狀態');
    const secondarySelect = screen.getByLabelText('處理狀態');
    const submitButton = screen.getByText('更新狀態');
    
    fireEvent.change(primarySelect, { target: { value: 'Ordered' } });
    fireEvent.change(secondarySelect, { target: { value: 'Processing' } });
    fireEvent.click(submitButton);
    
    // Should show loading state
    expect(screen.getByText('更新中...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.getByText('更新狀態')).toBeInTheDocument();
    });
  });

  it('displays status rules information', () => {
    render(<OrderStatusManager {...mockProps} />);
    
    expect(screen.getByText('狀態規則說明')).toBeInTheDocument();
    expect(screen.getByText(/第一個下拉選單可選擇/)).toBeInTheDocument();
    expect(screen.getByText(/當選擇 "Ordered" 時/)).toBeInTheDocument();
    expect(screen.getByText(/第二個下拉選單提供/)).toBeInTheDocument();
  });
});