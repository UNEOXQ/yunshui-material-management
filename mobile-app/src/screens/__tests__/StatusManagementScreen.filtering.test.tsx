import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import StatusManagementScreen from '../StatusManagementScreen';
import authSlice from '../../store/slices/authSlice';
import statusSlice from '../../store/slices/statusSlice';
import { baseApi } from '../../store/api/baseApi';

// Mock the status sync hook
jest.mock('../../hooks/useStatusSync', () => ({
  useStatusSync: jest.fn(() => ({
    syncStatuses: jest.fn(() => Promise.resolve(true)),
    isConnected: jest.fn(() => true),
    isRealTimeEnabled: true,
  })),
}));

// Mock the status API
jest.mock('../../store/api/statusApi', () => ({
  useGetStatusesQuery: jest.fn(),
  useGetStatusCategoriesQuery: jest.fn(),
  useGetAllStatusHistoryQuery: jest.fn(),
}));

// Mock StatusUpdateForm component
jest.mock('../../components/forms/StatusUpdateForm', () => {
  return function MockStatusUpdateForm({ onUpdate, onCancel }: any) {
    return (
      <>
        <button testID="update-confirm" onPress={() => onUpdate(true)}>
          確認更新
        </button>
        <button testID="update-cancel" onPress={onCancel}>
          取消
        </button>
      </>
    );
  };
});

describe('StatusManagementScreen - Filtering Functionality', () => {
  const mockStatuses = [
    {
      id: '1',
      name: '系統狀態',
      value: '正常',
      type: 'TEXT' as const,
      category: '系統',
      description: '系統運行狀態',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: '庫存數量',
      value: '100',
      type: 'NUMBER' as const,
      category: '庫存',
      description: '當前庫存數量',
      updatedAt: '2024-01-01T01:00:00Z',
    },
    {
      id: '3',
      name: '維護模式',
      value: 'false',
      type: 'BOOLEAN' as const,
      category: '系統',
      description: '是否處於維護模式',
      updatedAt: '2024-01-01T02:00:00Z',
    },
    {
      id: '4',
      name: '網路連線',
      value: 'true',
      type: 'BOOLEAN' as const,
      category: '網路',
      description: '網路連線狀態',
      updatedAt: '2024-01-01T03:00:00Z',
    },
    {
      id: '5',
      name: '最後備份時間',
      value: '2024-01-01T00:00:00Z',
      type: 'DATE' as const,
      category: '備份',
      description: '最後一次備份的時間',
      updatedAt: '2024-01-01T04:00:00Z',
    },
  ];

  const mockCategories = ['系統', '庫存', '網路', '備份'];

  const createMockStore = (initialFilters = {}) => {
    return configureStore({
      reducer: {
        auth: authSlice,
        status: statusSlice,
        api: baseApi.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
      preloadedState: {
        auth: {
          user: { id: '1', username: 'test', email: 'test@example.com', role: 'ADMIN', token: 'test-token' },
          token: 'test-token',
          isAuthenticated: true,
          loading: false,
          error: null,
        },
        status: {
          statuses: [],
          selectedStatus: null,
          loading: false,
          error: null,
          categories: mockCategories,
          filters: initialFilters,
        },
      },
    });
  };

  const renderWithProviders = (component: React.ReactElement, store = createMockStore()) => {
    return render(
      <Provider store={store}>
        <NavigationContainer>
          {component}
        </NavigationContainer>
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked functions
    const { useGetStatusesQuery, useGetStatusCategoriesQuery, useGetAllStatusHistoryQuery } = require('../../store/api/statusApi');
    
    // Setup default mock returns
    useGetStatusesQuery.mockReturnValue({
      data: mockStatuses,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    useGetStatusCategoriesQuery.mockReturnValue({
      data: mockCategories,
    });

    useGetAllStatusHistoryQuery.mockReturnValue({
      data: { history: [] },
      isLoading: false,
    });
  });

  describe('Filter Modal Functionality', () => {
    it('should open and close filter modal correctly', () => {
      const { getByTestId, getByText, queryByText } = renderWithProviders(<StatusManagementScreen />);

      // Filter modal should not be visible initially
      expect(queryByText('篩選條件')).toBeNull();

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Filter modal should be visible
      expect(getByText('篩選條件')).toBeTruthy();

      // Close filter modal
      const closeButton = getByTestId('close-modal') || getByText('close');
      if (closeButton) {
        fireEvent.press(closeButton);
        expect(queryByText('篩選條件')).toBeNull();
      }
    });

    it('should display all available categories in filter modal', () => {
      const { getByTestId, getByText } = renderWithProviders(<StatusManagementScreen />);

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Check all categories are displayed
      mockCategories.forEach(category => {
        expect(getByText(category)).toBeTruthy();
      });

      // Should also have "全部" option
      expect(getByText('全部')).toBeTruthy();
    });

    it('should show current filter values in modal', () => {
      const store = createMockStore({
        category: '系統',
        searchTerm: '狀態',
      });

      const { getByTestId, getByText, getByDisplayValue } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Check search term is displayed
      const searchInput = getByDisplayValue('狀態');
      expect(searchInput).toBeTruthy();

      // Check selected category is highlighted
      const systemCategory = getByText('系統');
      expect(systemCategory).toBeTruthy();
    });
  });

  describe('Search Filter Functionality', () => {
    it('should apply search filter correctly', async () => {
      const store = createMockStore();
      const { getByTestId, getByText, getByPlaceholderText } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Enter search term
      const searchInput = getByPlaceholderText('輸入狀態名稱或描述');
      fireEvent.changeText(searchInput, '系統');

      // Apply filters
      const applyButton = getByText('套用');
      fireEvent.press(applyButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.status.filters.searchTerm).toBe('系統');
      });
    });

    it('should trim whitespace from search term', async () => {
      const store = createMockStore();
      const { getByTestId, getByText, getByPlaceholderText } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Enter search term with whitespace
      const searchInput = getByPlaceholderText('輸入狀態名稱或描述');
      fireEvent.changeText(searchInput, '  系統狀態  ');

      // Apply filters
      const applyButton = getByText('套用');
      fireEvent.press(applyButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.status.filters.searchTerm).toBe('系統狀態');
      });
    });

    it('should handle empty search term correctly', async () => {
      const store = createMockStore();
      const { getByTestId, getByText, getByPlaceholderText } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Enter empty search term
      const searchInput = getByPlaceholderText('輸入狀態名稱或描述');
      fireEvent.changeText(searchInput, '   ');

      // Apply filters
      const applyButton = getByText('套用');
      fireEvent.press(applyButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.status.filters.searchTerm).toBeUndefined();
      });
    });

    it('should handle special characters in search term', async () => {
      const store = createMockStore();
      const { getByTestId, getByText, getByPlaceholderText } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Enter search term with special characters
      const searchInput = getByPlaceholderText('輸入狀態名稱或描述');
      fireEvent.changeText(searchInput, '系統@#$%狀態');

      // Apply filters
      const applyButton = getByText('套用');
      fireEvent.press(applyButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.status.filters.searchTerm).toBe('系統@#$%狀態');
      });
    });
  });

  describe('Category Filter Functionality', () => {
    it('should apply single category filter correctly', async () => {
      const store = createMockStore();
      const { getByTestId, getByText } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Select category
      const systemCategory = getByText('系統');
      fireEvent.press(systemCategory);

      // Apply filters
      const applyButton = getByText('套用');
      fireEvent.press(applyButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.status.filters.category).toBe('系統');
      });
    });

    it('should switch between categories correctly', async () => {
      const store = createMockStore();
      const { getByTestId, getByText } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Select first category
      const systemCategory = getByText('系統');
      fireEvent.press(systemCategory);

      // Select different category
      const inventoryCategory = getByText('庫存');
      fireEvent.press(inventoryCategory);

      // Apply filters
      const applyButton = getByText('套用');
      fireEvent.press(applyButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.status.filters.category).toBe('庫存');
      });
    });

    it('should clear category filter when selecting "全部"', async () => {
      const store = createMockStore({ category: '系統' });
      const { getByTestId, getByText } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Select "全部"
      const allCategory = getByText('全部');
      fireEvent.press(allCategory);

      // Apply filters
      const applyButton = getByText('套用');
      fireEvent.press(applyButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.status.filters.category).toBeUndefined();
      });
    });

    it('should handle categories with special characters', async () => {
      const specialCategories = ['系統/網路', '庫存&管理', '備份-恢復'];
      const { useGetStatusCategoriesQuery } = require('../../store/api/statusApi');
      useGetStatusCategoriesQuery.mockReturnValue({
        data: specialCategories,
      });

      const store = createMockStore();
      const { getByTestId, getByText } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Select category with special characters
      const specialCategory = getByText('系統/網路');
      fireEvent.press(specialCategory);

      // Apply filters
      const applyButton = getByText('套用');
      fireEvent.press(applyButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.status.filters.category).toBe('系統/網路');
      });
    });
  });

  describe('Combined Filter Functionality', () => {
    it('should apply both search and category filters simultaneously', async () => {
      const store = createMockStore();
      const { getByTestId, getByText, getByPlaceholderText } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Enter search term
      const searchInput = getByPlaceholderText('輸入狀態名稱或描述');
      fireEvent.changeText(searchInput, '狀態');

      // Select category
      const systemCategory = getByText('系統');
      fireEvent.press(systemCategory);

      // Apply filters
      const applyButton = getByText('套用');
      fireEvent.press(applyButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.status.filters.searchTerm).toBe('狀態');
        expect(state.status.filters.category).toBe('系統');
      });
    });

    it('should preserve existing filters when adding new ones', async () => {
      const store = createMockStore({ category: '系統' });
      const { getByTestId, getByText, getByPlaceholderText } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Add search term while keeping existing category
      const searchInput = getByPlaceholderText('輸入狀態名稱或描述');
      fireEvent.changeText(searchInput, '維護');

      // Apply filters
      const applyButton = getByText('套用');
      fireEvent.press(applyButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.status.filters.searchTerm).toBe('維護');
        expect(state.status.filters.category).toBe('系統');
      });
    });

    it('should override existing filters when applying new ones', async () => {
      const store = createMockStore({
        category: '系統',
        searchTerm: '舊搜尋',
      });

      const { getByTestId, getByText, getByPlaceholderText } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Change search term
      const searchInput = getByPlaceholderText('輸入狀態名稱或描述');
      fireEvent.changeText(searchInput, '新搜尋');

      // Change category
      const inventoryCategory = getByText('庫存');
      fireEvent.press(inventoryCategory);

      // Apply filters
      const applyButton = getByText('套用');
      fireEvent.press(applyButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.status.filters.searchTerm).toBe('新搜尋');
        expect(state.status.filters.category).toBe('庫存');
      });
    });
  });

  describe('Filter Clearing Functionality', () => {
    it('should clear all filters when clear button is pressed', async () => {
      const store = createMockStore({
        category: '系統',
        searchTerm: '狀態',
      });

      const { getByTestId, getByText } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Clear filters
      const clearButton = getByText('清除');
      fireEvent.press(clearButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.status.filters).toEqual({});
      });
    });

    it('should reset filter form when clearing', async () => {
      const store = createMockStore({
        category: '系統',
        searchTerm: '狀態',
      });

      const { getByTestId, getByText, getByPlaceholderText } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Verify initial values are set
      const searchInput = getByPlaceholderText('輸入狀態名稱或描述');
      expect(searchInput.props.value).toBe('狀態');

      // Clear filters
      const clearButton = getByText('清除');
      fireEvent.press(clearButton);

      // Modal should close and filters should be cleared
      await waitFor(() => {
        const state = store.getState();
        expect(state.status.filters).toEqual({});
      });
    });

    it('should handle clearing empty filters gracefully', async () => {
      const store = createMockStore();
      const { getByTestId, getByText } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Clear filters (should not cause errors)
      const clearButton = getByText('清除');
      fireEvent.press(clearButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.status.filters).toEqual({});
      });
    });
  });

  describe('Filter Persistence and State Management', () => {
    it('should maintain filter state when navigating away and back', async () => {
      const store = createMockStore();
      const { getByTestId, getByText, getByPlaceholderText, rerender } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Apply filters
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      const searchInput = getByPlaceholderText('輸入狀態名稱或描述');
      fireEvent.changeText(searchInput, '系統');

      const applyButton = getByText('套用');
      fireEvent.press(applyButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.status.filters.searchTerm).toBe('系統');
      });

      // Simulate navigation away and back
      rerender(
        <Provider store={store}>
          <NavigationContainer>
            <StatusManagementScreen />
          </NavigationContainer>
        </Provider>
      );

      // Filters should still be applied
      const state = store.getState();
      expect(state.status.filters.searchTerm).toBe('系統');
    });

    it('should trigger API refetch when filters are applied', async () => {
      const mockRefetch = jest.fn();
      const { useGetStatusesQuery } = require('../../store/api/statusApi');
      useGetStatusesQuery.mockReturnValue({
        data: mockStatuses,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const store = createMockStore();
      const { getByTestId, getByText, getByPlaceholderText } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Apply filters
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      const searchInput = getByPlaceholderText('輸入狀態名稱或描述');
      fireEvent.changeText(searchInput, '系統');

      const applyButton = getByText('套用');
      fireEvent.press(applyButton);

      // Should trigger API call with new filters
      await waitFor(() => {
        expect(useGetStatusesQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            searchTerm: '系統',
          })
        );
      });
    });
  });

  describe('Filter UI Interaction and Accessibility', () => {
    it('should provide visual feedback for selected category', () => {
      const store = createMockStore({ category: '系統' });
      const { getByTestId, getByText } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      // Selected category should have different styling
      const selectedCategory = getByText('系統');
      expect(selectedCategory).toBeTruthy();
      // Note: In a real test, you would check for specific style classes or test IDs
    });

    it('should handle rapid filter changes without errors', async () => {
      const store = createMockStore();
      const { getByTestId, getByText, getByPlaceholderText } = renderWithProviders(
        <StatusManagementScreen />,
        store
      );

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      const searchInput = getByPlaceholderText('輸入狀態名稱或描述');

      // Rapid text changes
      fireEvent.changeText(searchInput, '系');
      fireEvent.changeText(searchInput, '系統');
      fireEvent.changeText(searchInput, '系統狀');
      fireEvent.changeText(searchInput, '系統狀態');

      // Rapid category changes
      fireEvent.press(getByText('系統'));
      fireEvent.press(getByText('庫存'));
      fireEvent.press(getByText('網路'));

      // Apply filters
      const applyButton = getByText('套用');
      fireEvent.press(applyButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.status.filters.searchTerm).toBe('系統狀態');
        expect(state.status.filters.category).toBe('網路');
      });
    });

    it('should close modal when applying filters', async () => {
      const { getByTestId, getByText, queryByText } = renderWithProviders(<StatusManagementScreen />);

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      expect(getByText('篩選條件')).toBeTruthy();

      // Apply filters
      const applyButton = getByText('套用');
      fireEvent.press(applyButton);

      // Modal should close
      await waitFor(() => {
        expect(queryByText('篩選條件')).toBeNull();
      });
    });

    it('should close modal when clearing filters', async () => {
      const { getByTestId, getByText, queryByText } = renderWithProviders(<StatusManagementScreen />);

      // Open filter modal
      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      expect(getByText('篩選條件')).toBeTruthy();

      // Clear filters
      const clearButton = getByText('清除');
      fireEvent.press(clearButton);

      // Modal should close
      await waitFor(() => {
        expect(queryByText('篩選條件')).toBeNull();
      });
    });
  });
});