import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InspectionStatusManager from './InspectionStatusManager';

describe('InspectionStatusManager', () => {
  const mockOnStatusUpdate = vi.fn();
  const defaultProps = {
    projectId: 'test-project-1',
    onStatusUpdate: mockOnStatusUpdate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders inspection status manager with correct title', () => {
    render(<InspectionStatusManager {...defaultProps} />);
    
    expect(screen.getByText('點收狀態管理')).toBeInTheDocument();
    expect(screen.getByText('CHECK')).toBeInTheDocument();
  });

  it('renders status dropdown with correct options', () => {
    render(<InspectionStatusManager {...defaultProps} />);
    
    const select = screen.getByLabelText('點收狀態');
    expect(select).toBeInTheDocument();
    
    // Check all options are present
    expect(screen.getByText('請選擇點收狀態')).toBeInTheDocument();
    expect(screen.getByText('Check and sign(C.B/PM)')).toBeInTheDocument();
    expect(screen.getByText('(C.B)')).toBeInTheDocument();
    expect(screen.getByText('WH)')).toBeInTheDocument();
  });

  it('displays current status when provided', () => {
    const currentStatus = { status: 'Check and sign(C.B/PM)' };
    render(
      <InspectionStatusManager 
        {...defaultProps} 
        currentStatus={currentStatus}
      />
    );
    
    expect(screen.getByText('目前狀態')).toBeInTheDocument();
    expect(screen.getByText('Check and sign(C.B/PM)')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
  });

  it('shows completion notice when status is selected', () => {
    render(<InspectionStatusManager {...defaultProps} />);
    
    const select = screen.getByLabelText('點收狀態');
    fireEvent.change(select, { target: { value: '(C.B)' } });
    
    expect(screen.getByText('專案完成標記')).toBeInTheDocument();
    expect(screen.getByText('選擇點收狀態後，此專案將被標記為完成狀態')).toBeInTheDocument();
  });

  it('enables update button when status changes', () => {
    render(<InspectionStatusManager {...defaultProps} />);
    
    const updateButton = screen.getByText('更新狀態');
    expect(updateButton).toBeDisabled();
    
    const select = screen.getByLabelText('點收狀態');
    fireEvent.change(select, { target: { value: 'WH)' } });
    
    expect(updateButton).toBeEnabled();
  });

  it('shows error when trying to update without selecting status', async () => {
    render(<InspectionStatusManager {...defaultProps} />);
    
    const updateButton = screen.getByText('更新狀態');
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(screen.getByText('請選擇點收狀態')).toBeInTheDocument();
    });
    
    expect(mockOnStatusUpdate).not.toHaveBeenCalled();
  });

  it('calls onStatusUpdate with correct data when status is updated', async () => {
    mockOnStatusUpdate.mockResolvedValue(undefined);
    render(<InspectionStatusManager {...defaultProps} />);
    
    const select = screen.getByLabelText('點收狀態');
    fireEvent.change(select, { target: { value: 'Check and sign(C.B/PM)' } });
    
    const updateButton = screen.getByText('更新狀態');
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(mockOnStatusUpdate).toHaveBeenCalledWith({
        status: 'Check and sign(C.B/PM)'
      });
    });
  });

  it('shows loading state during update', async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockOnStatusUpdate.mockReturnValue(promise);
    
    render(<InspectionStatusManager {...defaultProps} />);
    
    const select = screen.getByLabelText('點收狀態');
    fireEvent.change(select, { target: { value: '(C.B)' } });
    
    const updateButton = screen.getByText('更新狀態');
    fireEvent.click(updateButton);
    
    expect(screen.getByText('更新中...')).toBeInTheDocument();
    expect(updateButton).toBeDisabled();
    
    resolvePromise!(undefined);
    await waitFor(() => {
      expect(screen.getByText('更新狀態')).toBeInTheDocument();
    });
  });

  it('handles update error correctly', async () => {
    const errorMessage = '網路連線錯誤';
    mockOnStatusUpdate.mockRejectedValue(new Error(errorMessage));
    
    render(<InspectionStatusManager {...defaultProps} />);
    
    const select = screen.getByLabelText('點收狀態');
    fireEvent.change(select, { target: { value: 'WH)' } });
    
    const updateButton = screen.getByText('更新狀態');
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows reset button when there are changes', () => {
    const currentStatus = { status: 'Check and sign(C.B/PM)' };
    render(
      <InspectionStatusManager 
        {...defaultProps} 
        currentStatus={currentStatus}
      />
    );
    
    const select = screen.getByLabelText('點收狀態');
    fireEvent.change(select, { target: { value: '(C.B)' } });
    
    expect(screen.getByText('重置')).toBeInTheDocument();
  });

  it('resets status when reset button is clicked', () => {
    const currentStatus = { status: 'Check and sign(C.B/PM)' };
    render(
      <InspectionStatusManager 
        {...defaultProps} 
        currentStatus={currentStatus}
      />
    );
    
    const select = screen.getByLabelText('點收狀態') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '(C.B)' } });
    
    expect(select.value).toBe('(C.B)');
    
    const resetButton = screen.getByText('重置');
    fireEvent.click(resetButton);
    
    expect(select.value).toBe('Check and sign(C.B/PM)');
  });

  it('disables all controls when disabled prop is true', () => {
    render(<InspectionStatusManager {...defaultProps} disabled={true} />);
    
    const select = screen.getByLabelText('點收狀態');
    const updateButton = screen.getByText('更新狀態');
    
    expect(select).toBeDisabled();
    expect(updateButton).toBeDisabled();
  });

  it('displays status rules information', () => {
    render(<InspectionStatusManager {...defaultProps} />);
    
    expect(screen.getByText('狀態規則說明')).toBeInTheDocument();
    expect(screen.getByText(/點收狀態提供三個選項/)).toBeInTheDocument();
    expect(screen.getByText(/選擇任一點收狀態後，專案將被標記為完成狀態/)).toBeInTheDocument();
    expect(screen.getByText(/狀態更新會記錄時間和操作人員/)).toBeInTheDocument();
    expect(screen.getByText(/點收完成後代表整個物流流程結束/)).toBeInTheDocument();
  });
});