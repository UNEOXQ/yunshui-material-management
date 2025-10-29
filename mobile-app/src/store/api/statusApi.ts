import { baseApi } from './baseApi';

export interface SystemStatus {
  id: string;
  name: string;
  value: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE';
  category: string;
  description?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface StatusHistory {
  id: string;
  statusId: string;
  oldValue: string;
  newValue: string;
  updatedBy: string;
  updatedAt: string;
  reason?: string;
}

export interface CreateStatusRequest {
  name: string;
  value: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE';
  category: string;
  description?: string;
}

export interface UpdateStatusRequest {
  id: string;
  value: string;
  reason?: string;
}

export interface StatusFilters {
  category?: string;
  searchTerm?: string;
  type?: string;
}

export const statusApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all statuses with optional filters
    getStatuses: builder.query<SystemStatus[], StatusFilters | void>({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.searchTerm) params.append('search', filters.searchTerm);
        if (filters.type) params.append('type', filters.type);
        
        return {
          url: `status${params.toString() ? `?${params.toString()}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['Status'],
    }),

    // Get status by ID
    getStatusById: builder.query<SystemStatus, string>({
      query: (id) => ({
        url: `status/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Status', id }],
    }),

    // Get status categories
    getStatusCategories: builder.query<string[], void>({
      query: () => ({
        url: 'status/categories',
        method: 'GET',
      }),
      providesTags: ['Status'],
    }),

    // Create new status
    createStatus: builder.mutation<SystemStatus, CreateStatusRequest>({
      query: (statusData) => ({
        url: 'status',
        method: 'POST',
        body: statusData,
      }),
      invalidatesTags: ['Status'],
    }),

    // Update status value
    updateStatus: builder.mutation<SystemStatus, UpdateStatusRequest>({
      query: ({ id, ...updateData }) => ({
        url: `status/${id}`,
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Status', id },
        'Status',
        'StatusHistory',
      ],
    }),

    // Delete status
    deleteStatus: builder.mutation<void, string>({
      query: (id) => ({
        url: `status/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Status'],
    }),

    // Get status history
    getStatusHistory: builder.query<StatusHistory[], string>({
      query: (statusId) => ({
        url: `status/${statusId}/history`,
        method: 'GET',
      }),
      providesTags: (result, error, statusId) => [
        { type: 'StatusHistory', id: statusId },
      ],
    }),

    // Get all status history with pagination
    getAllStatusHistory: builder.query<
      { history: StatusHistory[]; total: number; page: number; limit: number },
      { page?: number; limit?: number; statusId?: string }
    >({
      query: ({ page = 1, limit = 20, statusId } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (statusId) params.append('statusId', statusId);
        
        return {
          url: `status/history?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['StatusHistory'],
    }),
  }),
});

export const {
  useGetStatusesQuery,
  useGetStatusByIdQuery,
  useGetStatusCategoriesQuery,
  useCreateStatusMutation,
  useUpdateStatusMutation,
  useDeleteStatusMutation,
  useGetStatusHistoryQuery,
  useGetAllStatusHistoryQuery,
} = statusApi;