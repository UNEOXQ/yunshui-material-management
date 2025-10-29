import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SystemStatus {
  id: string;
  name: string;
  value: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE';
  category: string;
  description?: string;
  updatedAt: string;
}

interface StatusState {
  statuses: SystemStatus[];
  selectedStatus: SystemStatus | null;
  loading: boolean;
  error: string | null;
  categories: string[];
  filters: {
    category?: string;
    searchTerm?: string;
  };
}

const initialState: StatusState = {
  statuses: [],
  selectedStatus: null,
  loading: false,
  error: null,
  categories: [],
  filters: {},
};

const statusSlice = createSlice({
  name: 'status',
  initialState,
  reducers: {
    setStatuses: (state, action: PayloadAction<SystemStatus[]>) => {
      state.statuses = action.payload;
      // Extract unique categories
      const categories = [...new Set(action.payload.map(s => s.category))];
      state.categories = categories;
    },
    addStatus: (state, action: PayloadAction<SystemStatus>) => {
      state.statuses.push(action.payload);
      // Update categories if new category
      if (!state.categories.includes(action.payload.category)) {
        state.categories.push(action.payload.category);
      }
    },
    updateStatus: (state, action: PayloadAction<SystemStatus>) => {
      const index = state.statuses.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.statuses[index] = action.payload;
      }
      if (state.selectedStatus?.id === action.payload.id) {
        state.selectedStatus = action.payload;
      }
    },
    removeStatus: (state, action: PayloadAction<string>) => {
      state.statuses = state.statuses.filter(s => s.id !== action.payload);
      if (state.selectedStatus?.id === action.payload) {
        state.selectedStatus = null;
      }
    },
    setSelectedStatus: (state, action: PayloadAction<SystemStatus | null>) => {
      state.selectedStatus = action.payload;
    },
    setFilters: (state, action: PayloadAction<StatusState['filters']>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetStatus: (state) => {
      return initialState;
    },
  },
});

export const {
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
} = statusSlice.actions;

export default statusSlice.reducer;

// Selectors
export const selectStatuses = (state: { status: StatusState }) => state.status.statuses;
export const selectSelectedStatus = (state: { status: StatusState }) => state.status.selectedStatus;
export const selectStatusCategories = (state: { status: StatusState }) => state.status.categories;
export const selectStatusFilters = (state: { status: StatusState }) => state.status.filters;
export const selectStatusLoading = (state: { status: StatusState }) => state.status.loading;
export const selectStatusError = (state: { status: StatusState }) => state.status.error;