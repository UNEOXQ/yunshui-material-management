import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { MaterialCard } from './MaterialCard';
import { ShoppingCart } from './ShoppingCart';
import { Material } from '../../types';
import { CartItem } from './MaterialSelectionModal';

// Mock the material service
vi.mock('../../services/materialService', () => ({
  materialService: {
    getCategories: vi.fn().mockResolvedValue({ success: true, data: { categories: ['Category 1'] } }),
    getSuppliers: vi.fn().mockResolvedValue({ success: true, data: { suppliers: ['Supplier 1'] } })
  }
}));

const mockMaterial: Material = {
  id: '1',
  name: 'Test Auxiliary Material',
  category: 'Test Category',
  price: 50.00,
  quantity: 20,
  imageUrl: 'http://example.com/image.jpg',
  supplier: 'Test Supplier',
  type: 'AUXILIARY',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
};

const mockOrderItem: CartItem = {
  materialId: '1',
  material: mockMaterial,
  quantity: 2,
  unitPrice: 50.00
};

describe('MaterialCard Component', () => {
  const mockOnAddToCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders material card correctly', () => {
    render(
      <MaterialCard
        material={mockMaterial}
        onAddToCart={mockOnAddToCart}
        cartQuantity={0}
      />
    );

    expect(screen.getByText('Test Auxiliary Material')).toBeInTheDocument();
    expect(screen.getByText('Test Category')).toBeInTheDocument();
    expect(screen.getByText('輔材')).toBeInTheDocument();
    expect(screen.getByText('庫存: 20')).toBeInTheDocument();
    expect(screen.getByText('加入購物車')).toBeInTheDocument();
  });

  test('shows out of stock when quantity is 0', () => {
    const outOfStockMaterial = { ...mockMaterial, quantity: 0 };
    
    render(
      <MaterialCard
        material={outOfStockMaterial}
        onAddToCart={mockOnAddToCart}
        cartQuantity={0}
      />
    );

    expect(screen.getByText('缺貨中')).toBeInTheDocument();
    expect(screen.queryByText('加入購物車')).not.toBeInTheDocument();
  });

  test('shows cart badge when item is in cart', () => {
    render(
      <MaterialCard
        material={mockMaterial}
        onAddToCart={mockOnAddToCart}
        cartQuantity={3}
      />
    );

    expect(screen.getByText('已選 3')).toBeInTheDocument();
  });

  test('calls onAddToCart when add button is clicked', async () => {
    render(
      <MaterialCard
        material={mockMaterial}
        onAddToCart={mockOnAddToCart}
        cartQuantity={0}
      />
    );

    const addButton = screen.getByText('加入購物車');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnAddToCart).toHaveBeenCalledWith(mockMaterial, 1);
    });
  });

  test('allows quantity adjustment', () => {
    render(
      <MaterialCard
        material={mockMaterial}
        onAddToCart={mockOnAddToCart}
        cartQuantity={0}
      />
    );

    const quantityInput = screen.getByDisplayValue('1');
    fireEvent.change(quantityInput, { target: { value: '5' } });

    expect(quantityInput).toHaveValue(5);
  });
});

describe('ShoppingCart Component', () => {
  const mockOnUpdateItem = vi.fn();
  const mockOnRemoveItem = vi.fn();
  const mockOnClearCart = vi.fn();
  const mockOnCreateOrder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows empty cart message when no items', () => {
    render(
      <ShoppingCart
        items={[]}
        onUpdateItem={mockOnUpdateItem}
        onRemoveItem={mockOnRemoveItem}
        onClearCart={mockOnClearCart}
        onCreateOrder={mockOnCreateOrder}
        totalAmount={0}
        loading={false}
      />
    );

    expect(screen.getByText('購物車是空的')).toBeInTheDocument();
    expect(screen.getByText('選擇材料加入購物車')).toBeInTheDocument();
  });

  test('displays cart items correctly', () => {
    render(
      <ShoppingCart
        items={[mockOrderItem]}
        onUpdateItem={mockOnUpdateItem}
        onRemoveItem={mockOnRemoveItem}
        onClearCart={mockOnClearCart}
        onCreateOrder={mockOnCreateOrder}
        totalAmount={100}
        loading={false}
      />
    );

    expect(screen.getByText('購物車 (2 項)')).toBeInTheDocument();
    expect(screen.getByText('Test Auxiliary Material')).toBeInTheDocument();
    expect(screen.getAllByText('$100')).toHaveLength(2); // Item total and cart total
    expect(screen.getByText('建立訂單')).toBeInTheDocument();
  });

  test('calls onCreateOrder when create order button is clicked', () => {
    render(
      <ShoppingCart
        items={[mockOrderItem]}
        onUpdateItem={mockOnUpdateItem}
        onRemoveItem={mockOnRemoveItem}
        onClearCart={mockOnClearCart}
        onCreateOrder={mockOnCreateOrder}
        totalAmount={100}
        loading={false}
      />
    );

    const createOrderButton = screen.getByText('建立訂單');
    fireEvent.click(createOrderButton);

    expect(mockOnCreateOrder).toHaveBeenCalled();
  });

  test('calls onRemoveItem when remove button is clicked', () => {
    render(
      <ShoppingCart
        items={[mockOrderItem]}
        onUpdateItem={mockOnUpdateItem}
        onRemoveItem={mockOnRemoveItem}
        onClearCart={mockOnClearCart}
        onCreateOrder={mockOnCreateOrder}
        totalAmount={100}
        loading={false}
      />
    );

    const removeButton = screen.getByTitle('移除項目');
    fireEvent.click(removeButton);

    expect(mockOnRemoveItem).toHaveBeenCalledWith('1');
  });

  test('calls onClearCart when clear button is clicked', () => {
    render(
      <ShoppingCart
        items={[mockOrderItem]}
        onUpdateItem={mockOnUpdateItem}
        onRemoveItem={mockOnRemoveItem}
        onClearCart={mockOnClearCart}
        onCreateOrder={mockOnCreateOrder}
        totalAmount={100}
        loading={false}
      />
    );

    const clearButton = screen.getByText('清空');
    fireEvent.click(clearButton);

    expect(mockOnClearCart).toHaveBeenCalled();
  });
});