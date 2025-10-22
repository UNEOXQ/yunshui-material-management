import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { MaterialList } from './MaterialList';
import { MaterialForm } from './MaterialForm';
import { Material } from '../../types';

// Mock the material service
vi.mock('../../services/materialService', () => ({
  materialService: {
    getCategories: vi.fn().mockResolvedValue({ success: true, data: { categories: ['Category 1', 'Category 2'] } }),
    getSuppliers: vi.fn().mockResolvedValue({ success: true, data: { suppliers: ['Supplier 1', 'Supplier 2'] } }),
    uploadImage: vi.fn().mockResolvedValue({ success: true }),
    deleteImage: vi.fn().mockResolvedValue({ success: true })
  }
}));

// Mock users data
const mockMaterials: Material[] = [
  {
    id: '1',
    name: 'Test Material 1',
    category: 'Test Category',
    price: 100.50,
    quantity: 10,
    imageUrl: 'http://example.com/image1.jpg',
    supplier: 'Test Supplier',
    type: 'AUXILIARY',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: '2',
    name: 'Test Material 2',
    category: 'Test Category 2',
    price: 200.75,
    quantity: 5,
    imageUrl: '',
    supplier: undefined,
    type: 'FINISHED',
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02')
  }
];

describe('MaterialList Component', () => {
  const mockOnEditMaterial = vi.fn();
  const mockOnDeleteMaterial = vi.fn();
  const mockOnQuantityUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders material list correctly', () => {
    render(
      <MaterialList
        materials={mockMaterials}
        onEditMaterial={mockOnEditMaterial}
        onDeleteMaterial={mockOnDeleteMaterial}
        onQuantityUpdate={mockOnQuantityUpdate}
        loading={false}
      />
    );

    expect(screen.getByText('Test Material 1')).toBeInTheDocument();
    expect(screen.getByText('Test Material 2')).toBeInTheDocument();
    expect(screen.getByText('輔材')).toBeInTheDocument();
    expect(screen.getByText('完成材')).toBeInTheDocument();
  });

  test('shows empty state when no materials', () => {
    render(
      <MaterialList
        materials={[]}
        onEditMaterial={mockOnEditMaterial}
        onDeleteMaterial={mockOnDeleteMaterial}
        onQuantityUpdate={mockOnQuantityUpdate}
        loading={false}
      />
    );

    expect(screen.getByText('目前沒有材料資料')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    render(
      <MaterialList
        materials={[]}
        onEditMaterial={mockOnEditMaterial}
        onDeleteMaterial={mockOnDeleteMaterial}
        onQuantityUpdate={mockOnQuantityUpdate}
        loading={true}
      />
    );

    expect(screen.getByText('載入材料中...')).toBeInTheDocument();
  });

  test('calls onEditMaterial when edit button is clicked', () => {
    render(
      <MaterialList
        materials={mockMaterials}
        onEditMaterial={mockOnEditMaterial}
        onDeleteMaterial={mockOnDeleteMaterial}
        onQuantityUpdate={mockOnQuantityUpdate}
        loading={false}
      />
    );

    const editButtons = screen.getAllByText('編輯');
    fireEvent.click(editButtons[0]);

    expect(mockOnEditMaterial).toHaveBeenCalledWith(mockMaterials[0]);
  });

  test('calls onDeleteMaterial when delete button is clicked', () => {
    // Mock window.confirm
    window.confirm = vi.fn(() => true);

    render(
      <MaterialList
        materials={mockMaterials}
        onEditMaterial={mockOnEditMaterial}
        onDeleteMaterial={mockOnDeleteMaterial}
        onQuantityUpdate={mockOnQuantityUpdate}
        loading={false}
      />
    );

    const deleteButtons = screen.getAllByText('刪除');
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDeleteMaterial).toHaveBeenCalledWith(mockMaterials[0].id);
  });
});

describe('MaterialForm Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders create material form correctly', () => {
    render(
      <MaterialForm
        material={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('新增材料')).toBeInTheDocument();
    expect(screen.getByLabelText(/材料名稱/)).toBeInTheDocument();
    expect(screen.getByLabelText(/分類/)).toBeInTheDocument();
    expect(screen.getByLabelText(/價格/)).toBeInTheDocument();
    expect(screen.getByLabelText(/庫存數量/)).toBeInTheDocument();
  });

  test('renders edit material form correctly', () => {
    render(
      <MaterialForm
        material={mockMaterials[0]}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('編輯材料')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Material 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(
      <MaterialForm
        material={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByText('建立');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('材料名稱為必填項目')).toBeInTheDocument();
      expect(screen.getByText('分類為必填項目')).toBeInTheDocument();
      expect(screen.getByText('價格為必填項目')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('submits form with valid data', async () => {
    render(
      <MaterialForm
        material={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.change(screen.getByLabelText(/材料名稱/), {
      target: { value: 'New Material' }
    });
    fireEvent.change(screen.getByLabelText(/分類/), {
      target: { value: 'New Category' }
    });
    fireEvent.change(screen.getByLabelText(/價格/), {
      target: { value: '150.00' }
    });
    fireEvent.change(screen.getByLabelText(/庫存數量/), {
      target: { value: '20' }
    });

    const submitButton = screen.getByText('建立');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Material',
        category: 'New Category',
        price: 150,
        quantity: 20,
        supplier: undefined,
        type: 'AUXILIARY'
      });
    });
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(
      <MaterialForm
        material={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});