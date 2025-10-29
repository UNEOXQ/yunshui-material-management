import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface OrderMaterial {
  materialId: string;
  material: {
    id: string;
    name: string;
    unit: string;
    price: number;
  };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  materials: OrderMaterial[];
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderFilters {
  status?: string;
  customerName?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  filters: OrderFilters;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const initialState: OrderState = {
  orders: [],
  selectedOrder: null,
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

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.orders = action.payload;
    },
    addOrder: (state, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload);
    },
    updateOrder: (state, action: PayloadAction<Order>) => {
      const index = state.orders.findIndex(o => o.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
      if (state.selectedOrder?.id === action.payload.id) {
        state.selectedOrder = action.payload;
      }
    },
    removeOrder: (state, action: PayloadAction<string>) => {
      state.orders = state.orders.filter(o => o.id !== action.payload);
      if (state.selectedOrder?.id === action.payload) {
        state.selectedOrder = null;
      }
    },
    setSelectedOrder: (state, action: PayloadAction<Order | null>) => {
      state.selectedOrder = action.payload;
    },
    setFilters: (state, action: PayloadAction<OrderFilters>) => {
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
    setPagination: (state, action: PayloadAction<Partial<OrderState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetOrders: (state) => {
      state.orders = [];
      state.pagination = initialState.pagination;
    },
  },
});

export const {
  setOrders,
  addOrder,
  updateOrder,
  removeOrder,
  setSelectedOrder,
  setFilters,
  clearFilters,
  setLoading,
  setError,
  setPagination,
  resetOrders,
} = orderSlice.actions;

export default orderSlice.reducer;

// Selectors
export const selectOrders = (state: { orders: OrderState }) => state.orders.orders;
export const selectSelectedOrder = (state: { orders: OrderState }) => state.orders.selectedOrder;
export const selectOrderFilters = (state: { orders: OrderState }) => state.orders.filters;
export const selectOrderLoading = (state: { orders: OrderState }) => state.orders.loading;
export const selectOrderError = (state: { orders: OrderState }) => state.orders.error;