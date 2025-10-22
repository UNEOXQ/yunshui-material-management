import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import PickupStatusManager from './PickupStatusManager';

// Mock the status service
vi.mock('../../services/statusService', () => ({
  statusService: {
    updatePickupStatus: vi.fn(),
  },
}));

describe('PickupStatusManager', () => {
  const mockProps = {
    projectId: 'test-project-id',
    onStatusUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default state', () => {
    render(<PickupStatusManager {...mockProps} />);
    
    expect(screen.getByText('取貨狀態管理')).toBeInTheDocument();
    expect(screen.getByText('PICKUP')).toBeInTheDocument();
    expect(screen.getByLabelText('取貨狀態')).toBeInTheDocument();
    expect(screen.getByLabelText('處理結果')).toBeInTheDocument();
  });

  it('renders with current status', () => {
    const propsWithStatus = {
      ...mockProps,
      currentStatus: {
        primaryStatus: 'Picked',
        secondaryStatus: '(B.T.W)',
      },
    };

    render(<PickupStatusManager {...propsWithStatus} />);
    
    expect(screen.getByDisplayValue('Picked')).toBeInTheDocument();
    expect(screen.getByDisplayValue('(B.T.W)')).toBeInTheDocument();
    expect(screen.getByText('Picked')).toBeInTheDocument();
    expect(screen.getByText('(B.T.W)')).toBeInTheDocument();
  });

  it('shows correct secondary options when "Picked" is selected', () => {
    render(<PickupStatusManager {...mockProps} />);
    
    const primarySelect = screen.getByLabelText('取貨狀態');
    const secondarySelect = screen.getByLabelText('處理結果');
    
    // Initially secondary should be disabled
    expect(secondarySelect).toBeDisabled();
    
    // Select "Picked" in primary
    fireEvent.change(primarySelect, { target: { value: 'Picked' } });
    
    // Secondary should now be enabled with correct options
    expect(secondarySelect).not.toBeDisabled();
    
    // Check if Picked options are available
    expect(screen.getByText('(B.T.W)')).toBeInTheDocument();
    expect(screen.getByText('(D.T.S)')).toBeInTheDocument();
    expect(screen.getByText('(B.T.W/MP)')).toBeInTheDocument();
    expect(screen.getByText('(D.T.S/MP)')).toBeInTheDocument();
  });

  it('shows correct secondary options when "Failed" is selected', () => {
    render(<PickupStatusManager {...mockProps} />);
    
    const primarySelect = screen.getByLabelText('取貨狀態');
    const secondarySelect = screen.getByLabelText('處理結果');
    
    // Select "Failed" in primary
    fireEvent.change(primarySelect, { target: { value: 'Failed' } });
    
    // Secondary should be enabled with Failed options
    expect(secondarySelect).not.toBeDisabled();
    
    // Check if Failed options are available
    expect(screen.getByText('(E.S)')).toBeInTheDocument();
    expect(screen.getByText('(E.H)')).toBeInTheDocument();
    
    // Picked options should not be available
    expect(screen.queryByText('(B.T.W)')).not.toBeInTheDocument();
    expect(screen.queryByText('(D.T.S)')).not.toBeInTheDocument();
  });

  it('resets secondary status when primary changes', () => {
    render(<PickupStatusManager {...mockProps} />);
    
    const primarySelect = screen.getByLabelText('取貨狀態');
    const secondarySelect = screen.getByLabelText('處理結果') as HTMLSelectElement;
    
    // Set primary to "Picked" and secondary to "(B.T.W)"
    fireEvent.change(primarySelect, { target: { value: 'Picked' } });
    fireEvent.change(secondarySelect, { target: { value: '(B.T.W)' } });
    
    expect(secondarySelect.value).toBe('(B.T.W)');
    
    // Change primary to "Failed"
    fireEvent.change(primarySelect, { target: { value: 'Failed' } });
    
    // Secondary should be reset
    expect(secondarySelect.value).toBe('');
  });

  it('shows validation error when submitting without primary status', async () => {
    render(<PickupStatusManager {...mockProps} />);
    
    const submitButton = screen.getByText('更新狀態');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('請選擇主要狀態')).toBeInTheDocument();
    });
  });

  it('shows validation error when primary is selected but no secondary status', async () => {
    render(<PickupStatusManager {...mockProps} />);
    
    const primarySelect = screen.getByLabelText('取貨狀態');
    const submitButton = screen.getByText('更新狀態');
    
    fireEvent.change(primarySelect, { target: { value: 'Picked' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('請選擇處理結果')).toBeInTheDocument();
    });
  });

  it('calls onStatusUpdate with correct data when submitting valid form', async () => {
    const mockOnStatusUpdate = vi.fn().mockResolvedValue(undefined);
    
    render(<PickupStatusManager {...mockProps} onStatusUpdate={mockOnStatusUpdate} />);
    
    const primarySelect = screen.getByLabelText('取貨狀態');
    const secondarySelect = screen.getByLabelText('處理結果');
    const submitButton = screen.getByText('更新狀態');
    
    fireEvent.change(primarySelect, { target: { value: 'Picked' } });
    fireEvent.change(secondarySelect, { target: { value: '(B.T.W)' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnStatusUpdate).toHaveBeenCalledWith({
        primaryStatus: 'Picked',
        secondaryStatus: '(B.T.W)',
      });
    });
  });

  it('handles Failed status correctly', async () => {
    const mockOnStatusUpdate = vi.fn().mockResolvedValue(undefined);
    
    render(<PickupStatusManager {...mockProps} onStatusUpdate={mockOnStatusUpdate} />);
    
    const primarySelect = screen.getByLabelText('取貨狀態');
    const secondarySelect = screen.getByLabelText('處理結果');
    const submitButton = screen.getByText('更新狀態');
    
    fireEvent.change(primarySelect, { target: { value: 'Failed' } });
    fireEvent.change(secondarySelect, { target: { value: '(E.S)' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnStatusUpdate).toHaveBeenCalledWith({
        primaryStatus: 'Failed',
        secondaryStatus: '(E.S)',
      });
    });
  });

  it('handles submission error correctly', async () => {
    const mockOnStatusUpdate = vi.fn().mockRejectedValue(new Error('Update failed'));
    
    render(<PickupStatusManager {...mockProps} onStatusUpdate={mockOnStatusUpdate} />);
    
    const primarySelect = screen.getByLabelText('取貨狀態');
    const secondarySelect = screen.getByLabelText('處理結果');
    const submitButton = screen.getByText('更新狀態');
    
    fireEvent.change(primarySelect, { target: { value: 'Picked' } });
    fireEvent.change(secondarySelect, { target: { value: '(B.T.W)' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });

  it('shows reset button when there are changes', () => {
    const propsWithStatus = {
      ...mockProps,
      currentStatus: {
        primaryStatus: 'Picked',
        secondaryStatus: '(B.T.W)',
      },
    };

    render(<PickupStatusManager {...propsWithStatus} />);
    
    const primarySelect = screen.getByLabelText('取貨狀態');
    
    // Initially no reset button (no changes)
    expect(screen.queryByText('重置')).not.toBeInTheDocument();
    
    // Make a change
    fireEvent.change(primarySelect, { target: { value: 'Failed' } });
    
    // Reset button should appear
    expect(screen.getByText('重置')).toBeInTheDocument();
  });

  it('resets form when reset button is clicked', () => {
    const propsWithStatus = {
      ...mockProps,
      currentStatus: {
        primaryStatus: 'Picked',
        secondaryStatus: '(B.T.W)',
      },
    };

    render(<PickupStatusManager {...propsWithStatus} />);
    
    const primarySelect = screen.getByLabelText('取貨狀態') as HTMLSelectElement;
    const secondarySelect = screen.getByLabelText('處理結果') as HTMLSelectElement;
    
    // Make changes
    fireEvent.change(primarySelect, { target: { value: 'Failed' } });
    fireEvent.change(secondarySelect, { target: { value: '(E.S)' } });
    
    expect(primarySelect.value).toBe('Failed');
    expect(secondarySelect.value).toBe('(E.S)');
    
    // Click reset
    const resetButton = screen.getByText('重置');
    fireEvent.click(resetButton);
    
    // Values should be restored
    expect(primarySelect.value).toBe('Picked');
    expect(secondarySelect.value).toBe('(B.T.W)');
  });

  it('disables form when disabled prop is true', () => {
    render(<PickupStatusManager {...mockProps} disabled={true} />);
    
    const primarySelect = screen.getByLabelText('取貨狀態');
    const secondarySelect = screen.getByLabelText('處理結果');
    const submitButton = screen.getByText('更新狀態');
    
    expect(primarySelect).toBeDisabled();
    expect(secondarySelect).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state during submission', async () => {
    const mockOnStatusUpdate = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<PickupStatusManager {...mockProps} onStatusUpdate={mockOnStatusUpdate} />);
    
    const primarySelect = screen.getByLabelText('取貨狀態');
    const secondarySelect = screen.getByLabelText('處理結果');
    const submitButton = screen.getByText('更新狀態');
    
    fireEvent.change(primarySelect, { target: { value: 'Picked' } });
    fireEvent.change(secondarySelect, { target: { value: '(B.T.W)' } });
    fireEvent.click(submitButton);
    
    // Should show loading state
    expect(screen.getByText('更新中...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.getByText('更新狀態')).toBeInTheDocument();
    });
  });

  it('displays status rules and code explanations', () => {
    render(<PickupStatusManager {...mockProps} />);
    
    expect(screen.getByText('狀態規則說明')).toBeInTheDocument();
    expect(screen.getByText('狀態代碼說明')).toBeInTheDocument();
    
    // Check for Picked options explanation
    expect(screen.getByText('成功取貨 (Picked)：')).toBeInTheDocument();
    expect(screen.getByText('Back To Warehouse')).toBeInTheDocument();
    expect(screen.getByText('Direct To Site')).toBeInTheDocument();
    
    // Check for Failed options explanation
    expect(screen.getByText('取貨失敗 (Failed)：')).toBeInTheDocument();
    expect(screen.getByText('Equipment Shortage')).toBeInTheDocument();
    expect(screen.getByText('Equipment Hold')).toBeInTheDocument();
  });

  it('validates that both primary and secondary are required', async () => {
    render(<PickupStatusManager {...mockProps} />);
    
    const primarySelect = screen.getByLabelText('取貨狀態');
    const submitButton = screen.getByText('更新狀態');
    
    // Try to submit with only primary status
    fireEvent.change(primarySelect, { target: { value: 'Picked' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('請選擇處理結果')).toBeInTheDocument();
    });
  });
});