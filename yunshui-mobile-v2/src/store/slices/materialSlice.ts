import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Material {
  id: string;
  name: string;
  category: string;
  specification: string;
  unit: string;
  price: number;
  stock: number;
  imageUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface MaterialFilters {
  category?: string;
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

interface MaterialState {
  materials: Material[];
  selectedMaterial: Material | null;
  filters: MaterialFilters;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const initialState: MaterialState = {
  materials: [],
  selectedMaterial: null,
  filters: {},
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  },
};

const materialSlice = createSlice({
  name: 'materials',
  initialState,
  reducers: {
    setMaterials: (state, action: PayloadAction<Material[]>) => {
      state.materials = action.payload;
    },
    addMaterial: (state, action: PayloadAction<Material>) => {
      state.materials.unshift(action.payload);
    },
    updateMaterial: (state, action: PayloadAction<Material>) => {
      const index = state.materials.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.materials[index] = action.payload;
      }
      if (state.selectedMaterial?.id === action.payload.id) {
        state.selectedMaterial = action.payload;
      }
    },
    removeMaterial: (state, action: PayloadAction<string>) => {
      state.materials = state.materials.filter(m => m.id !== action.payload);
      if (state.selectedMaterial?.id === action.payload) {
        state.selectedMaterial = null;
      }
    },
    setSelectedMaterial: (state, action: PayloadAction<Material | null>) => {
      state.selectedMaterial = action.payload;
    },
    setFilters: (state, action: PayloadAction<MaterialFilters>) => {
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
    setPagination: (state, action: PayloadAction<Partial<MaterialState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetMaterials: (state) => {
      state.materials = [];
      state.pagination = initialState.pagination;
    },
  },
});

export const {
  setMaterials,
  addMaterial,
  updateMaterial,
  removeMaterial,
  setSelectedMaterial,
  setFilters,
  clearFilters,
  setLoading,
  setError,
  setPagination,
  resetMaterials,
} = materialSlice.actions;

export default materialSlice.reducer;

// Selectors
export const selectMaterials = (state: { materials: MaterialState }) => state.materials.materials;
export const selectSelectedMaterial = (state: { materials: MaterialState }) => state.materials.selectedMaterial;
export const selectMaterialFilters = (state: { materials: MaterialState }) => state.materials.filters;
export const selectMaterialLoading = (state: { materials: MaterialState }) => state.materials.loading;
export const selectMaterialError = (state: { materials: MaterialState }) => state.materials.error;