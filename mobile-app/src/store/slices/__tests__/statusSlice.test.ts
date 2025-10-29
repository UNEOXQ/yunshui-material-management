import statusReducer, {
  setStatuses,
  addStatus,
  updateStatus,
  removeStatus,
  setSelectedStatus,
  setFilters,
  clearFilters,
  setLoading,
  setError,
  resetStatus,
  selectStatuses,
  selectSelectedStatus,
  selectStatusCategories,
  selectStatusFilters,
  selectStatusLoading,
  selectStatusError,
} from '../statusSlice';

describe('statusSlice', () => {
  const initialState = {
    statuses: [],
    selectedStatus: null,
    loading: false,
    error: null,
    categories: [],
    filters: {},
  };

  const mockStatus = {
    id: '1',
    name: '系統狀態',
    value: '正常',
    type: 'TEXT' as const,
    category: '系統',
    description: '系統運行狀態',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockStatuses = [
    mockStatus,
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

  it('should return the initial state', () => {
    expect(statusReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setStatuses', () => {
    it('should set statuses and extract categories', () => {
      const newState = statusReducer(initialState, setStatuses(mockStatuses));

      expect(newState.statuses).toEqual(mockStatuses);
      expect(newState.categories).toEqual(['系統', '庫存']);
    });

    it('should handle empty statuses array', () => {
      const newState = statusReducer(initialState, setStatuses([]));

      expect(newState.statuses).toEqual([]);
      expect(newState.categories).toEqual([]);
    });

    it('should handle duplicate categories', () => {
      const statusesWithDuplicates = [
        mockStatus,
        { ...mockStatus, id: '2', category: '系統' },
        { ...mockStatus, id: '3', category: '庫存' },
      ];

      const newState = statusReducer(initialState, setStatuses(statusesWithDuplicates));

      expect(newState.categories).toEqual(['系統', '庫存']);
    });
  });

  describe('addStatus', () => {
    it('should add a new status', () => {
      const previousState = {
        ...initialState,
        statuses: [mockStatus],
        categories: ['系統'],
      };

      const newStatus = {
        id: '2',
        name: '新狀態',
        value: '測試',
        type: 'TEXT' as const,
        category: '測試',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const newState = statusReducer(previousState, addStatus(newStatus));

      expect(newState.statuses).toHaveLength(2);
      expect(newState.statuses[1]).toEqual(newStatus);
      expect(newState.categories).toContain('測試');
    });

    it('should not duplicate categories when adding status with existing category', () => {
      const previousState = {
        ...initialState,
        statuses: [mockStatus],
        categories: ['系統'],
      };

      const newStatus = {
        ...mockStatus,
        id: '2',
        name: '另一個系統狀態',
      };

      const newState = statusReducer(previousState, addStatus(newStatus));

      expect(newState.categories).toEqual(['系統']);
    });
  });

  describe('updateStatus', () => {
    it('should update existing status', () => {
      const previousState = {
        ...initialState,
        statuses: mockStatuses,
      };

      const updatedStatus = {
        ...mockStatus,
        value: '異常',
        updatedAt: '2024-01-01T03:00:00Z',
      };

      const newState = statusReducer(previousState, updateStatus(updatedStatus));

      expect(newState.statuses[0]).toEqual(updatedStatus);
    });

    it('should update selected status if it matches', () => {
      const previousState = {
        ...initialState,
        statuses: mockStatuses,
        selectedStatus: mockStatus,
      };

      const updatedStatus = {
        ...mockStatus,
        value: '異常',
        updatedAt: '2024-01-01T03:00:00Z',
      };

      const newState = statusReducer(previousState, updateStatus(updatedStatus));

      expect(newState.selectedStatus).toEqual(updatedStatus);
    });

    it('should not update if status not found', () => {
      const previousState = {
        ...initialState,
        statuses: mockStatuses,
      };

      const nonExistentStatus = {
        id: '999',
        name: '不存在的狀態',
        value: '測試',
        type: 'TEXT' as const,
        category: '測試',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const newState = statusReducer(previousState, updateStatus(nonExistentStatus));

      expect(newState.statuses).toEqual(mockStatuses);
    });
  });

  describe('removeStatus', () => {
    it('should remove status by id', () => {
      const previousState = {
        ...initialState,
        statuses: mockStatuses,
      };

      const newState = statusReducer(previousState, removeStatus('1'));

      expect(newState.statuses).toHaveLength(2);
      expect(newState.statuses.find(s => s.id === '1')).toBeUndefined();
    });

    it('should clear selected status if it matches removed status', () => {
      const previousState = {
        ...initialState,
        statuses: mockStatuses,
        selectedStatus: mockStatus,
      };

      const newState = statusReducer(previousState, removeStatus('1'));

      expect(newState.selectedStatus).toBeNull();
    });

    it('should not affect selected status if different status is removed', () => {
      const previousState = {
        ...initialState,
        statuses: mockStatuses,
        selectedStatus: mockStatus,
      };

      const newState = statusReducer(previousState, removeStatus('2'));

      expect(newState.selectedStatus).toEqual(mockStatus);
    });
  });

  describe('setSelectedStatus', () => {
    it('should set selected status', () => {
      const newState = statusReducer(initialState, setSelectedStatus(mockStatus));

      expect(newState.selectedStatus).toEqual(mockStatus);
    });

    it('should clear selected status when set to null', () => {
      const previousState = {
        ...initialState,
        selectedStatus: mockStatus,
      };

      const newState = statusReducer(previousState, setSelectedStatus(null));

      expect(newState.selectedStatus).toBeNull();
    });
  });

  describe('filters', () => {
    it('should set filters', () => {
      const filters = {
        category: '系統',
        searchTerm: '狀態',
      };

      const newState = statusReducer(initialState, setFilters(filters));

      expect(newState.filters).toEqual(filters);
    });

    it('should merge filters with existing ones', () => {
      const previousState = {
        ...initialState,
        filters: { category: '系統' },
      };

      const newFilters = { searchTerm: '狀態' };

      const newState = statusReducer(previousState, setFilters(newFilters));

      expect(newState.filters).toEqual({
        category: '系統',
        searchTerm: '狀態',
      });
    });

    it('should clear all filters', () => {
      const previousState = {
        ...initialState,
        filters: {
          category: '系統',
          searchTerm: '狀態',
        },
      };

      const newState = statusReducer(previousState, clearFilters());

      expect(newState.filters).toEqual({});
    });
  });

  describe('loading and error states', () => {
    it('should set loading state', () => {
      const newState = statusReducer(initialState, setLoading(true));

      expect(newState.loading).toBe(true);
    });

    it('should set error state', () => {
      const errorMessage = '載入失敗';
      const newState = statusReducer(initialState, setError(errorMessage));

      expect(newState.error).toBe(errorMessage);
    });

    it('should clear error state', () => {
      const previousState = {
        ...initialState,
        error: '載入失敗',
      };

      const newState = statusReducer(previousState, setError(null));

      expect(newState.error).toBeNull();
    });
  });

  describe('resetStatus', () => {
    it('should reset to initial state', () => {
      const previousState = {
        statuses: mockStatuses,
        selectedStatus: mockStatus,
        loading: true,
        error: '錯誤',
        categories: ['系統', '庫存'],
        filters: { category: '系統' },
      };

      const newState = statusReducer(previousState, resetStatus());

      expect(newState).toEqual(initialState);
    });
  });

  describe('selectors', () => {
    const mockState = {
      status: {
        statuses: mockStatuses,
        selectedStatus: mockStatus,
        loading: true,
        error: '測試錯誤',
        categories: ['系統', '庫存'],
        filters: { category: '系統' },
      },
    };

    it('should select statuses', () => {
      expect(selectStatuses(mockState)).toEqual(mockStatuses);
    });

    it('should select selected status', () => {
      expect(selectSelectedStatus(mockState)).toEqual(mockStatus);
    });

    it('should select categories', () => {
      expect(selectStatusCategories(mockState)).toEqual(['系統', '庫存']);
    });

    it('should select filters', () => {
      expect(selectStatusFilters(mockState)).toEqual({ category: '系統' });
    });

    it('should select loading state', () => {
      expect(selectStatusLoading(mockState)).toBe(true);
    });

    it('should select error state', () => {
      expect(selectStatusError(mockState)).toBe('測試錯誤');
    });
  });
});