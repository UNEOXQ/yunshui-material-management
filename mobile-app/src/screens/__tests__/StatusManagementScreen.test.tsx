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
const mockStatusApi = {
  useGetStatusesQuery: jest.fn(),
  useGetStatusCategoriesQuery: jest.fn(),
  useGetAllStatusHistoryQuery: jest.fn(),
};

jest.mock('../../store/api/statusApi', () => mockStatusApi);

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

describe('StatusManagementScreen', () => {
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
      name: '庫存狀態',
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
  ];

  const mockCategories = ['系統', '庫存'];

  const createMockStore = (initialState = {}) => {
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
          categories: [],
          filters: {},
        },
        ...initialState,
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
    
    // Setup default mock returns
    mockStatusApi.useGetStatusesQuery.mockReturnValue({
      data: mockStatuses,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockStatusApi.useGetStatusCategoriesQuery.mockReturnValue({
      data: mockCategories,
    });

    mockStatusApi.useGetAllStatusHistoryQuery.mockReturnValue({
      data: { history: [] },
      isLoading: false,
    });
  });

  describe('Rendering', () => {
    it('should render status list correctly', () => {
      const { getByText } = renderWithProviders(<StatusManagementScreen />);

      expect(getByText('狀態管理')).toBeTruthy();
      expect(getByText('系統狀態')).toBeTruthy();
      expect(getByText('庫存狀態')).toBeTruthy();
      expect(getByText('維護模式')).toBeTruthy();
    });

    it('should show loading state', () => {
      mockStatusApi.useGetStatusesQuery.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      const { getByText } = renderWithProviders(<StatusManagementScreen />);

      expect(getByText('載入中...')).toBeTruthy();
    });

    it('should show error state', () => {
      mockStatusApi.useGetStatusesQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: '載入失敗' },
        refetch: jest.fn(),
      });

      const { getByText } = renderWithProviders(<StatusManagementScreen />);

      expect(getByText('載入狀態資料失敗')).toBeTruthy();
    });

    it('should show empty state when no statuses', () => {
      mockStatusApi.useGetStatusesQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { getByText } = renderWithProviders(<StatusManagementScreen />);

      expect(getByText('沒有找到狀態資料')).toBeTruthy();
    });
  });

  describe('Status Display', () => {
    it('should format boolean values correctly', () => {
      const { getByText } = renderWithProviders(<StatusManagementScreen />);

      expect(getByText('否')).toBeTruthy(); // false -> 否
    });

    it('should format date values correctly', () => {
      const statusWithDate = [
        {
          id: '4',
          name: '最後更新時間',
          value: '2024-01-01T00:00:00Z',
          type: 'DATE' as const,
          category: '系統',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockStatusApi.useGetStatusesQuery.mockReturnValue({
        data: statusWithDate,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { getByText } = renderWithProviders(<StatusManagementScreen />);

      expect(getByText('2024/1/1')).toBeTruthy();
    });

    it('should show sync status indicator', () => {
      const { getByText } = renderWithProviders(<StatusManagementScreen />);

      expect(getByText('即時同步')).toBeTruthy();
    });
  });

  describe('Filtering', () => {
    it('should open filter modal', () => {
      const { getByTestId, getByText } = renderWithProviders(<StatusManagementScreen />);

      const filterButton = getByTestId('filter-button') || getByText('篩選條件');
      fireEvent.press(filterButton);

      expect(getByText('篩選條件')).toBeTruthy();
    });

    it('should apply search filter', async () => {
      const mockRefetch = jest.fn();
      mockStatusApi.useGetStatusesQuery.mockReturnValue({
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

    it('should apply category filter', async () => {
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

    it('should clear filters', async () => {
      const store = createMockStore({
        status: {
          statuses: [],
          selectedStatus: null,
          loading: false,
          error: null,
          categories: [],
          filters: { category: '系統', searchTerm: '狀態' },
        },
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
  });

  describe('Status Updates', () => {
    it('should open update modal when edit button is pressed', () => {
      const { getAllByTestId, getByText } = renderWithProviders(<StatusManagementScreen />);

      const editButtons = getAllByTestId('edit-button') || getAllByTestId('update-button');
      if (editButtons.length > 0) {
        fireEvent.press(editButtons[0]);
        expect(getByText('更新狀態')).toBeTruthy();
      }
    });

    it('should handle successful status update', async () => {
      const mockRefetch = jest.fn();
      mockStatusApi.useGetStatusesQuery.mockReturnValue({
        data: mockStatuses,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { getAllByTestId, getByTestId, queryByText } = renderWithProviders(<StatusManagementScreen />);

      // Open update modal
      const editButtons = getAllByTestId('edit-button') || getAllByTestId('update-button');
      if (editButtons.length > 0) {
        fireEvent.press(editButtons[0]);

        // Confirm update
        const confirmButton = getByTestId('update-confirm');
        fireEvent.press(confirmButton);

        await waitFor(() => {
          expect(queryByText('更新狀態')).toBeNull();
          expect(mockRefetch).toHaveBeenCalled();
        });
      }
    });

    it('should handle cancelled status update', async () => {
      const { getAllByTestId, getByTestId, queryByText } = renderWithProviders(<StatusManagementScreen />);

      // Open update modal
      const editButtons = getAllByTestId('edit-button') || getAllByTestId('update-button');
      if (editButtons.length > 0) {
        fireEvent.press(editButtons[0]);

        // Cancel update
        const cancelButton = getByTestId('update-cancel');
        fireEvent.press(cancelButton);

        await waitFor(() => {
          expect(queryByText('更新狀態')).toBeNull();
        });
      }
    });
  });

  describe('Status History', () => {
    it('should open history modal when status item is pressed', () => {
      const { getByText } = renderWithProviders(<StatusManagementScreen />);

      const statusItem = getByText('系統狀態');
      fireEvent.press(statusItem);

      expect(getByText('系統狀態 - 歷史記錄')).toBeTruthy();
    });

    it('should display history items', () => {
      const mockHistory = [
        {
          id: '1',
          statusId: '1',
          oldValue: '異常',
          newValue: '正常',
          updatedBy: '管理員',
          updatedAt: '2024-01-01T00:00:00Z',
          reason: '系統恢復正常',
        },
      ];

      mockStatusApi.useGetAllStatusHistoryQuery.mockReturnValue({
        data: { history: mockHistory },
        isLoading: false,
      });

      const { getByText } = renderWithProviders(<StatusManagementScreen />);

      // Open history modal
      const statusItem = getByText('系統狀態');
      fireEvent.press(statusItem);

      expect(getByText('異常 → 正常')).toBeTruthy();
      expect(getByText('原因: 系統恢復正常')).toBeTruthy();
    });

    it('should show empty history state', () => {
      mockStatusApi.useGetAllStatusHistoryQuery.mockReturnValue({
        data: { history: [] },
        isLoading: false,
      });

      const { getByText } = renderWithProviders(<StatusManagementScreen />);

      // Open history modal
      const statusItem = getByText('系統狀態');
      fireEvent.press(statusItem);

      expect(getByText('沒有歷史記錄')).toBeTruthy();
    });
  });

  describe('Pull to Refresh', () => {
    it('should handle pull to refresh', async () => {
      const mockRefetch = jest.fn();
      const mockSyncStatuses = jest.fn(() => Promise.resolve(true));

      mockStatusApi.useGetStatusesQuery.mockReturnValue({
        data: mockStatuses,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      // Mock the useStatusSync hook to return our mock function
      const { useStatusSync } = require('../../hooks/useStatusSync');
      useStatusSync.mockReturnValue({
        syncStatuses: mockSyncStatuses,
        isConnected: jest.fn(() => true),
        isRealTimeEnabled: true,
      });

      const { getByTestId } = renderWithProviders(<StatusManagementScreen />);

      const flatList = getByTestId('status-list') || getByTestId('flatlist');
      if (flatList) {
        // Simulate pull to refresh
        fireEvent(flatList, 'refresh');

        await waitFor(() => {
          expect(mockRefetch).toHaveBeenCalled();
          expect(mockSyncStatuses).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should show retry button on error', () => {
      const mockRefetch = jest.fn();
      mockStatusApi.useGetStatusesQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: '載入失敗' },
        refetch: mockRefetch,
      });

      const { getByText } = renderWithProviders(<StatusManagementScreen />);

      const retryButton = getByText('重試');
      fireEvent.press(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Real-time Sync Status', () => {
    it('should show offline status when disconnected', () => {
      const { useStatusSync } = require('../../hooks/useStatusSync');
      useStatusSync.mockReturnValue({
        syncStatuses: jest.fn(),
        isConnected: jest.fn(() => false),
        isRealTimeEnabled: true,
      });

      const { getByText } = renderWithProviders(<StatusManagementScreen />);

      expect(getByText('離線')).toBeTruthy();
    });

    it('should not show sync status when real-time is disabled', () => {
      const { useStatusSync } = require('../../hooks/useStatusSync');
      useStatusSync.mockReturnValue({
        syncStatuses: jest.fn(),
        isConnected: jest.fn(() => true),
        isRealTimeEnabled: false,
      });

      const { queryByText } = renderWithProviders(<StatusManagementScreen />);

      expect(queryByText('即時同步')).toBeNull();
      expect(queryByText('離線')).toBeNull();
    });
  });
});