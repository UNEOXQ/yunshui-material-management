import { baseApi } from './baseApi';

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

interface CreateOrderRequest {
  customerName: string;
  materials: {
    materialId: string;
    quantity: number;
  }[];
}

interface UpdateOrderRequest extends Partial<CreateOrderRequest> {
  id: string;
  status?: Order['status'];
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  customerName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<OrdersResponse, OrderQueryParams>({
      query: (params = {}) => ({
        url: '/orders',
        params,
      }),
      providesTags: ['Order'],
    }),
    getOrderById: builder.query<Order, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    createOrder: builder.mutation<Order, CreateOrderRequest>({
      query: (order) => ({
        url: '/orders',
        method: 'POST',
        body: order,
      }),
      invalidatesTags: ['Order'],
    }),
    updateOrder: builder.mutation<Order, UpdateOrderRequest>({
      query: ({ id, ...updates }) => ({
        url: `/orders/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Order', id }],
    }),
    updateOrderStatus: builder.mutation<Order, { id: string; status: Order['status'] }>({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Order', id }],
    }),
    deleteOrder: builder.mutation<void, string>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    getOrderStatuses: builder.query<Order['status'][], void>({
      query: () => '/orders/statuses',
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
  useGetOrderStatusesQuery,
} = orderApi;