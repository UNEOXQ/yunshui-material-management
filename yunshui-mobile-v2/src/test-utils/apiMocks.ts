import { mockMaterials, mockOrders, mockUser } from './mockData';

// Mock API responses
export const mockApiResponses = {
  auth: {
    login: {
      success: {
        user: mockUser,
        token: mockUser.token,
      },
      error: {
        message: '帳號或密碼錯誤',
      },
    },
  },
  materials: {
    getAll: {
      success: mockMaterials,
      error: {
        message: '獲取基材列表失敗',
      },
    },
    create: {
      success: mockMaterials[0],
      error: {
        message: '新增基材失敗',
      },
    },
    update: {
      success: mockMaterials[0],
      error: {
        message: '更新基材失敗',
      },
    },
    delete: {
      success: { message: '刪除成功' },
      error: {
        message: '刪除基材失敗',
      },
    },
  },
  orders: {
    getAll: {
      success: mockOrders,
      error: {
        message: '獲取訂單列表失敗',
      },
    },
    create: {
      success: mockOrders[0],
      error: {
        message: '新增訂單失敗',
      },
    },
    update: {
      success: mockOrders[0],
      error: {
        message: '更新訂單失敗',
      },
    },
  },
  upload: {
    image: {
      success: {
        url: 'https://example.com/uploaded-image.jpg',
      },
      error: {
        message: '圖片上傳失敗',
      },
    },
  },
};

// Mock fetch function
export const mockFetch = (url: string, options?: RequestInit) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let response;
      
      if (url.includes('/auth/login')) {
        response = mockApiResponses.auth.login.success;
      } else if (url.includes('/materials')) {
        if (options?.method === 'POST') {
          response = mockApiResponses.materials.create.success;
        } else if (options?.method === 'PUT') {
          response = mockApiResponses.materials.update.success;
        } else if (options?.method === 'DELETE') {
          response = mockApiResponses.materials.delete.success;
        } else {
          response = mockApiResponses.materials.getAll.success;
        }
      } else if (url.includes('/orders')) {
        if (options?.method === 'POST') {
          response = mockApiResponses.orders.create.success;
        } else if (options?.method === 'PUT') {
          response = mockApiResponses.orders.update.success;
        } else {
          response = mockApiResponses.orders.getAll.success;
        }
      } else if (url.includes('/upload')) {
        response = mockApiResponses.upload.image.success;
      } else {
        response = { error: 'Not found' };
      }

      resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(response),
      });
    }, 100);
  });
};

// Setup global fetch mock
export const setupApiMocks = () => {
  global.fetch = jest.fn().mockImplementation(mockFetch);
};