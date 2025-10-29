import { baseApi } from './baseApi';

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

interface CreateMaterialRequest {
  name: string;
  category: string;
  specification: string;
  unit: string;
  price: number;
  stock: number;
  description?: string;
  imageFile?: File;
}

interface UpdateMaterialRequest extends Partial<CreateMaterialRequest> {
  id: string;
}

interface MaterialsResponse {
  materials: Material[];
  total: number;
  page: number;
  limit: number;
}

interface MaterialQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export const materialApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMaterials: builder.query<MaterialsResponse, MaterialQueryParams>({
      query: (params = {}) => ({
        url: '/materials',
        params,
      }),
      providesTags: ['Material'],
    }),
    getMaterialById: builder.query<Material, string>({
      query: (id) => `/materials/${id}`,
      providesTags: (result, error, id) => [{ type: 'Material', id }],
    }),
    createMaterial: builder.mutation<Material, CreateMaterialRequest>({
      query: (material) => ({
        url: '/materials',
        method: 'POST',
        body: material,
      }),
      invalidatesTags: ['Material'],
    }),
    updateMaterial: builder.mutation<Material, UpdateMaterialRequest>({
      query: ({ id, ...updates }) => ({
        url: `/materials/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Material', id }],
    }),
    deleteMaterial: builder.mutation<void, string>({
      query: (id) => ({
        url: `/materials/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Material', id }],
    }),
    uploadMaterialImage: builder.mutation<{ imageUrl: string }, { materialId: string; imageFile: FormData }>({
      query: ({ materialId, imageFile }) => ({
        url: `/materials/${materialId}/image`,
        method: 'POST',
        body: imageFile,
      }),
      invalidatesTags: (result, error, { materialId }) => [{ type: 'Material', id: materialId }],
    }),
    getMaterialCategories: builder.query<string[], void>({
      query: () => '/materials/categories',
    }),
  }),
});

export const {
  useGetMaterialsQuery,
  useGetMaterialByIdQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
  useUploadMaterialImageMutation,
  useGetMaterialCategoriesQuery,
} = materialApi;