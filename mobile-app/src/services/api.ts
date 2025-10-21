import axios from 'axios';

// 使用你的實際後端地址
const API_BASE_URL = 'http://192.168.68.99:3004/api';

// 創建 axios 實例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器 - 添加認證token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('獲取token失敗:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器 - 處理錯誤
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token過期，需要重新登入
      console.log('Token過期，需要重新登入');
    }
    return Promise.reject(error);
  }
);

export default apiClient;