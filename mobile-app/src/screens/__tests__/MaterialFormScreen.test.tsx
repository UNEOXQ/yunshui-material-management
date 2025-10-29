import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MaterialFormScreen from '../MaterialFormScreen';
import { materialService } from '../../services/materialService';
import { uploadService } from '../../services/uploadService';
import { renderWithProviders } from '../../test-utils';

// Mock services
jest.mock('../../services/materialService');
jest.mock('../../services/uploadService');

// Mock navigation
const mockNavigation = {
  setOptions: jest.fn(),
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const mockRoute = {
  params: {},
};

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('MaterialFormScreen', () => {
  const mockMaterialService = materialService as jest.Mocked<typeof materialService>;
  const mockUploadService = uploadService as jest.Mocked<typeof uploadService>;

  const mockMaterial = {
    id: '1',
    name: 'Test Material',
    category: 'Test Category',
    specification: 'Test Specification',
    quantity: 100,
    imageUrl: 'https://example.com/image.jpg',
    supplier: 'Test Supplier',
    type: 'AUXILIARY' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful responses
    mockMaterialService.getCategories.mockResolvedValue(['Category 1', 'Category 2']);
    mockMaterialService.getSuppliers.mockResolvedValue(['Supplier 1', 'Supplier 2']);
    mockMaterialService.createMaterial.mockResolvedValue(mockMaterial);
    mockMaterialService.updateMaterial.mockResolvedValue(mockMaterial);
    mockMaterialService.getMaterialById.mockResolvedValue(mockMaterial);
    mockUploadService.uploadImage.mockResolvedValue({
      imageUrl: 'https://example.com/uploaded-image.jpg',
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const { getByText, getByLabelText } = renderWithProviders(
        <MaterialFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      await waitFor(() => {
        expect(getByText('新增基材')).toBeTruthy();
      });

      // Try to save without filling required fields
      const saveButton = getByText('新增');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('驗證失敗', '請檢查表單中的錯誤');
      });
    });

    it('should validate material name', async () => {
      const { getByLabelText, getByText } = renderWithProviders(
        <MaterialFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      await waitFor(() => {
        expect(getByText('新增基材')).toBeTruthy();
      });

      // Test empty name
      const nameInput = getByLabelText('材料名稱 *');
      fireEvent.changeText(nameInput, '');
      
      const saveButton = getByText('新增');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('材料名稱不能為空')).toBeTruthy();
      });

      // Test name too long
      fireEvent.changeText(nameInput, 'a'.repeat(101));
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('材料名稱不能超過100個字符')).toBeTruthy();
      });
    });

    it('should validate category', async () => {
      const { getByLabelText, getByText } = renderWithProviders(
        <MaterialFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      await waitFor(() => {
        expect(getByText('新增基材')).toBeTruthy();
      });

      // Fill required name first
      const nameInput = getByLabelText('材料名稱 *');
      fireEvent.changeText(nameInput, 'Valid Name');

      // Test empty category
      const categoryInput = getByLabelText('分類 *');
      fireEvent.changeText(categoryInput, '');
      
      const saveButton = getByText('新增');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('分類不能為空')).toBeTruthy();
      });

      // Test category too long
      fireEvent.changeText(categoryInput, 'b'.repeat(51));
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('分類不能超過50個字符')).toBeTruthy();
      });
    });

    it('should validate specification', async () => {
      const { getByLabelText, getByText } = renderWithProviders(
        <MaterialFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      await waitFor(() => {
        expect(getByText('新增基材')).toBeTruthy();
      });

      // Fill required fields first
      const nameInput = getByLabelText('材料名稱 *');
      fireEvent.changeText(nameInput, 'Valid Name');
      
      const categoryInput = getByLabelText('分類 *');
      fireEvent.changeText(categoryInput, 'Valid Category');

      // Test empty specification
      const specInput = getByLabelText('規格說明 *');
      fireEvent.changeText(specInput, '');
      
      const saveButton = getByText('新增');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('規格說明不能為空')).toBeTruthy();
      });

      // Test specification too long
      fireEvent.changeText(specInput, 'c'.repeat(201));
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('規格說明不能超過200個字符')).toBeTruthy();
      });
    });

    it('should validate quantity', async () => {
      const { getByLabelText, getByText } = renderWithProviders(
        <MaterialFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      await waitFor(() => {
        expect(getByText('新增基材')).toBeTruthy();
      });

      // Fill required fields first
      const nameInput = getByLabelText('材料名稱 *');
      fireEvent.changeText(nameInput, 'Valid Name');
      
      const categoryInput = getByLabelText('分類 *');
      fireEvent.changeText(categoryInput, 'Valid Category');
      
      const specInput = getByLabelText('規格說明 *');
      fireEvent.changeText(specInput, 'Valid Specification');

      // Test negative quantity
      const quantityInput = getByLabelText('初始數量 *');
      fireEvent.changeText(quantityInput, '-5');
      
      const saveButton = getByText('新增');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('數量必須為非負整數')).toBeTruthy();
      });

      // Test non-numeric quantity
      fireEvent.changeText(quantityInput, 'abc');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('數量必須為非負整數')).toBeTruthy();
      });

      // Test valid quantity
      fireEvent.changeText(quantityInput, '10');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockMaterialService.createMaterial).toHaveBeenCalled();
      });
    });

    it('should validate supplier field', async () => {
      const { getByLabelText, getByText } = renderWithProviders(
        <MaterialFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      await waitFor(() => {
        expect(getByText('新增基材')).toBeTruthy();
      });

      // Fill required fields first
      const nameInput = getByLabelText('材料名稱 *');
      fireEvent.changeText(nameInput, 'Valid Name');
      
      const categoryInput = getByLabelText('分類 *');
      fireEvent.changeText(categoryInput, 'Valid Category');
      
      const specInput = getByLabelText('規格說明 *');
      fireEvent.changeText(specInput, 'Valid Specification');
      
      const quantityInput = getByLabelText('初始數量 *');
      fireEvent.changeText(quantityInput, '10');

      // Test supplier too long
      const supplierInput = getByLabelText('供應商');
      fireEvent.changeText(supplierInput, 'd'.repeat(101));
      
      const saveButton = getByText('新增');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('供應商名稱不能超過100個字符')).toBeTruthy();
      });

      // Test valid supplier
      fireEvent.changeText(supplierInput, 'Valid Supplier');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockMaterialService.createMaterial).toHaveBeenCalled();
      });
    });

    it('should clear validation errors when user starts typing', async () => {
      const { getByLabelText, getByText, queryByText } = renderWithProviders(
        <MaterialFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      await waitFor(() => {
        expect(getByText('新增基材')).toBeTruthy();
      });

      // Trigger validation error
      const nameInput = getByLabelText('材料名稱 *');
      fireEvent.changeText(nameInput, '');
      
      const saveButton = getByText('新增');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('材料名稱不能為空')).toBeTruthy();
      });

      // Start typing to clear error
      fireEvent.changeText(nameInput, 'Valid Name');

      await waitFor(() => {
        expect(queryByText('材料名稱不能為空')).toBeNull();
      });
    });
  });

  describe('Form Submission', () => {
    it('should create material successfully with valid data', async () => {
      const { getByLabelText, getByText } = renderWithProviders(
        <MaterialFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      await waitFor(() => {
        expect(getByText('新增基材')).toBeTruthy();
      });

      // Fill all required fields
      fireEvent.changeText(getByLabelText('材料名稱 *'), 'Test Material');
      fireEvent.changeText(getByLabelText('分類 *'), 'Test Category');
      fireEvent.changeText(getByLabelText('規格說明 *'), 'Test Specification');
      fireEvent.changeText(getByLabelText('初始數量 *'), '100');
      fireEvent.changeText(getByLabelText('供應商'), 'Test Supplier');

      // Submit form
      const saveButton = getByText('新增');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockMaterialService.createMaterial).toHaveBeenCalledWith({
          name: 'Test Material',
          category: 'Test Category',
          specification: 'Test Specification',
          quantity: 100,
          supplier: 'Test Supplier',
          type: 'AUXILIARY',
        });
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('成功', '材料已新增', expect.any(Array));
      });
    });

    it('should update material successfully in edit mode', async () => {
      const editRoute = {
        params: { materialId: '1' },
      };

      const { getByLabelText, getByText } = renderWithProviders(
        <MaterialFormScreen navigation={mockNavigation as any} route={editRoute as any} />
      );

      await waitFor(() => {
        expect(getByText('編輯基材')).toBeTruthy();
      });

      // Wait for material data to load
      await waitFor(() => {
        expect(mockMaterialService.getMaterialById).toHaveBeenCalledWith('1');
      });

      // Update material name
      const nameInput = getByLabelText('材料名稱 *');
      fireEvent.changeText(nameInput, 'Updated Material');

      // Submit form
      const saveButton = getByText('更新');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockMaterialService.updateMaterial).toHaveBeenCalledWith('1', expect.objectContaining({
          name: 'Updated Material',
        }));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('成功', '材料已更新', expect.any(Array));
      });
    });

    it('should handle material type selection', async () => {
      const { getByText, getByLabelText } = renderWithProviders(
        <MaterialFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      await waitFor(() => {
        expect(getByText('新增基材')).toBeTruthy();
      });

      // Fill required fields
      fireEvent.changeText(getByLabelText('材料名稱 *'), 'Test Material');
      fireEvent.changeText(getByLabelText('分類 *'), 'Test Category');
      fireEvent.changeText(getByLabelText('規格說明 *'), 'Test Specification');
      fireEvent.changeText(getByLabelText('初始數量 *'), '100');

      // Select FINISHED type
      const finishedButton = getByText('成品材料');
      fireEvent.press(finishedButton);

      // Submit form
      const saveButton = getByText('新增');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockMaterialService.createMaterial).toHaveBeenCalledWith(expect.objectContaining({
          type: 'FINISHED',
        }));
      });
    });

    it('should handle form submission errors', async () => {
      mockMaterialService.createMaterial.mockRejectedValue(new Error('Creation failed'));

      const { getByLabelText, getByText } = renderWithProviders(
        <MaterialFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      await waitFor(() => {
        expect(getByText('新增基材')).toBeTruthy();
      });

      // Fill required fields
      fireEvent.changeText(getByLabelText('材料名稱 *'), 'Test Material');
      fireEvent.changeText(getByLabelText('分類 *'), 'Test Category');
      fireEvent.changeText(getByLabelText('規格說明 *'), 'Test Specification');
      fireEvent.changeText(getByLabelText('初始數量 *'), '100');

      // Submit form
      const saveButton = getByText('新增');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('錯誤', '保存材料失敗，請稍後再試');
      });
    });
  });

  describe('Image Upload Integration', () => {
    it('should handle image selection and upload', async () => {
      const { getByText, getByLabelText } = renderWithProviders(
        <MaterialFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      await waitFor(() => {
        expect(getByText('新增基材')).toBeTruthy();
      });

      // Fill required fields
      fireEvent.changeText(getByLabelText('材料名稱 *'), 'Test Material');
      fireEvent.changeText(getByLabelText('分類 *'), 'Test Category');
      fireEvent.changeText(getByLabelText('規格說明 *'), 'Test Specification');
      fireEvent.changeText(getByLabelText('初始數量 *'), '100');

      // Mock image selection (this would normally be handled by ImagePicker component)
      // For testing purposes, we'll simulate the image selection callback
      
      // Submit form
      const saveButton = getByText('新增');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockMaterialService.createMaterial).toHaveBeenCalled();
      });
    });

    it('should handle image upload failure gracefully', async () => {
      mockUploadService.uploadImage.mockRejectedValue(new Error('Upload failed'));

      const { getByText, getByLabelText } = renderWithProviders(
        <MaterialFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      await waitFor(() => {
        expect(getByText('新增基材')).toBeTruthy();
      });

      // Fill required fields
      fireEvent.changeText(getByLabelText('材料名稱 *'), 'Test Material');
      fireEvent.changeText(getByLabelText('分類 *'), 'Test Category');
      fireEvent.changeText(getByLabelText('規格說明 *'), 'Test Specification');
      fireEvent.changeText(getByLabelText('初始數量 *'), '100');

      // Submit form
      const saveButton = getByText('新增');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('警告', '圖片上傳失敗，但材料資料將繼續保存');
      });

      await waitFor(() => {
        expect(mockMaterialService.createMaterial).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching initial data', async () => {
      // Delay the resolution of getCategories to test loading state
      mockMaterialService.getCategories.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(['Category 1']), 100))
      );

      const { getByText } = renderWithProviders(
        <MaterialFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText('載入中...')).toBeTruthy();

      await waitFor(() => {
        expect(getByText('新增基材')).toBeTruthy();
      });
    });

    it('should show saving state during form submission', async () => {
      // Delay the resolution of createMaterial to test saving state
      mockMaterialService.createMaterial.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockMaterial), 100))
      );

      const { getByLabelText, getByText } = renderWithProviders(
        <MaterialFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      await waitFor(() => {
        expect(getByText('新增基材')).toBeTruthy();
      });

      // Fill required fields
      fireEvent.changeText(getByLabelText('材料名稱 *'), 'Test Material');
      fireEvent.changeText(getByLabelText('分類 *'), 'Test Category');
      fireEvent.changeText(getByLabelText('規格說明 *'), 'Test Specification');
      fireEvent.changeText(getByLabelText('初始數量 *'), '100');

      // Submit form
      const saveButton = getByText('新增');
      fireEvent.press(saveButton);

      // Check that button shows loading state
      await waitFor(() => {
        expect(saveButton.props.loading).toBe(true);
      });

      await waitFor(() => {
        expect(mockMaterialService.createMaterial).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back on cancel', async () => {
      const { getByText } = renderWithProviders(
        <MaterialFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      await waitFor(() => {
        expect(getByText('新增基材')).toBeTruthy();
      });

      const cancelButton = getByText('取消');
      fireEvent.press(cancelButton);

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('should navigate back after successful creation', async () => {
      const { getByLabelText, getByText } = renderWithProviders(
        <MaterialFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      await waitFor(() => {
        expect(getByText('新增基材')).toBeTruthy();
      });

      // Fill and submit form
      fireEvent.changeText(getByLabelText('材料名稱 *'), 'Test Material');
      fireEvent.changeText(getByLabelText('分類 *'), 'Test Category');
      fireEvent.changeText(getByLabelText('規格說明 *'), 'Test Specification');
      fireEvent.changeText(getByLabelText('初始數量 *'), '100');

      const saveButton = getByText('新增');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('成功', '材料已新增', expect.any(Array));
      });

      // Simulate pressing OK on the alert
      const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
        call => call[0] === '成功' && call[1] === '材料已新增'
      );
      if (alertCall && alertCall[2] && alertCall[2][0] && alertCall[2][0].onPress) {
        alertCall[2][0].onPress();
      }

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });
});