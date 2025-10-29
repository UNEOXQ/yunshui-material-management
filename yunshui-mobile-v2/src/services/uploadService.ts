import { apiService, ApiResponse } from './api';

// 類型定義
export interface UploadResponse {
  imageUrl: string;
  publicId?: string;
  message?: string;
}

export interface UploadInfo {
  maxFileSize: number;
  allowedTypes: string[];
  maxFiles: number;
  uploadPath: string;
}

export interface ImagePickerResult {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'JPEG' | 'PNG' | 'WEBP';
}

export class UploadService {
  private static instance: UploadService;

  private constructor() {}

  public static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  /**
   * 獲取上傳配置資訊
   */
  public async getUploadInfo(): Promise<UploadInfo> {
    try {
      const response: ApiResponse<UploadInfo> = await apiService.get('/api/upload/info');

      if (!response.success) {
        throw new Error(response.error || 'Failed to get upload info');
      }

      return response.data;
    } catch (error: any) {
      console.error('Get upload info error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 上傳圖片（通用方法）
   */
  public async uploadImage(imageUri: string, category: string = 'materials'): Promise<UploadResponse> {
    try {
      // 先壓縮圖片
      const compressedUri = await this.compressImage(imageUri);
      
      // 創建 FormData
      const formData = new FormData();
      
      // 從 URI 創建文件對象
      const imageFile = await this.createFileFromUri(compressedUri);
      formData.append('image', imageFile);
      formData.append('category', category);

      // 使用原生 fetch 進行文件上傳
      const response = await this.uploadWithFormData('/api/upload/image', formData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to upload image');
      }

      return response.data;
    } catch (error: any) {
      console.error('Upload image error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 上傳基材圖片
   */
  public async uploadMaterialImage(materialId: string, imageUri: string): Promise<UploadResponse> {
    try {
      // 創建 FormData
      const formData = new FormData();
      
      // 從 URI 創建文件對象
      const imageFile = await this.createFileFromUri(imageUri);
      formData.append('image', imageFile);

      // 使用原生 fetch 進行文件上傳
      const response = await this.uploadWithFormData(
        `/api/upload/material/${materialId}/image`,
        formData
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to upload image');
      }

      return response.data;
    } catch (error: any) {
      console.error('Upload material image error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 刪除基材圖片
   */
  public async deleteMaterialImage(materialId: string): Promise<void> {
    try {
      const response: ApiResponse<void> = await apiService.delete(`/api/upload/material/${materialId}/image`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete image');
      }
    } catch (error: any) {
      console.error('Delete material image error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 壓縮圖片
   */
  public async compressImage(
    imageUri: string, 
    options: ImageCompressionOptions = {}
  ): Promise<string> {
    try {
      const {
        maxWidth = 800,
        maxHeight = 600,
        quality = 0.8,
        format = 'JPEG'
      } = options;

      // 使用 expo-image-manipulator 進行壓縮
      const ImageManipulator = require('expo-image-manipulator');
      
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: maxWidth,
              height: maxHeight,
            },
          },
        ],
        {
          compress: quality,
          format: format === 'JPEG' ? ImageManipulator.SaveFormat.JPEG : 
                  format === 'PNG' ? ImageManipulator.SaveFormat.PNG :
                  ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipulatedImage.uri;
    } catch (error: any) {
      console.error('Compress image error:', error);
      // 如果壓縮失敗，返回原始 URI
      return imageUri;
    }
  }

  /**
   * 驗證圖片文件
   */
  public validateImage(imageResult: ImagePickerResult): string[] {
    const errors: string[] = [];

    // 檢查文件類型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageResult.type)) {
      errors.push('不支援的圖片格式，請選擇 JPEG、PNG、GIF 或 WebP 格式');
    }

    // 檢查文件大小（5MB 限制）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageResult.size && imageResult.size > maxSize) {
      errors.push('圖片大小不能超過 5MB');
    }

    // 檢查文件名
    if (!imageResult.name || imageResult.name.trim().length === 0) {
      errors.push('圖片文件名不能為空');
    }

    return errors;
  }

  /**
   * 從 URI 創建文件對象
   */
  private async createFileFromUri(uri: string): Promise<File> {
    try {
      // 獲取文件信息
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // 從 URI 提取文件名
      const filename = uri.split('/').pop() || 'image.jpg';
      
      // 創建 File 對象
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      console.error('Create file from URI error:', error);
      throw new Error('無法處理圖片文件');
    }
  }

  /**
   * 使用 FormData 上傳文件
   */
  private async uploadWithFormData(endpoint: string, formData: FormData): Promise<ApiResponse<UploadResponse>> {
    try {
      const token = apiService.getAuthToken();
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3004';
      
      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          // 不設置 Content-Type，讓瀏覽器自動設置 multipart/form-data
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Upload with FormData error:', error);
      throw error;
    }
  }

  /**
   * 批量上傳圖片
   */
  public async uploadMultipleImages(
    materialId: string, 
    imageUris: string[]
  ): Promise<UploadResponse[]> {
    try {
      const uploadPromises = imageUris.map(uri => 
        this.uploadMaterialImage(materialId, uri)
      );

      return await Promise.all(uploadPromises);
    } catch (error: any) {
      console.error('Upload multiple images error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 上傳前預處理圖片
   */
  public async preprocessImage(
    imageUri: string,
    options: ImageCompressionOptions = {}
  ): Promise<string> {
    try {
      // 1. 壓縮圖片
      const compressedUri = await this.compressImage(imageUri, options);
      
      // 2. 可以在這裡添加其他預處理步驟
      // 例如：添加浮水印、調整方向等
      
      return compressedUri;
    } catch (error: any) {
      console.error('Preprocess image error:', error);
      // 如果預處理失敗，返回原始 URI
      return imageUri;
    }
  }

  /**
   * 獲取圖片元數據
   */
  public async getImageMetadata(imageUri: string): Promise<{
    width: number;
    height: number;
    size: number;
    type: string;
  }> {
    try {
      // 這裡可以使用 React Native 的圖片處理庫獲取元數據
      // 例如 react-native-image-size 或 expo-image-manipulator
      
      return new Promise((resolve, reject) => {
        const Image = require('react-native').Image;
        
        Image.getSize(
          imageUri,
          (width: number, height: number) => {
            resolve({
              width,
              height,
              size: 0, // 需要其他方法獲取文件大小
              type: 'image/jpeg' // 需要其他方法獲取文件類型
            });
          },
          (error: any) => {
            reject(error);
          }
        );
      });
    } catch (error: any) {
      console.error('Get image metadata error:', error);
      throw new Error('無法獲取圖片信息');
    }
  }

  /**
   * 檢查網路狀態並決定上傳策略
   */
  public async uploadWithNetworkCheck(
    materialId: string, 
    imageUri: string
  ): Promise<UploadResponse> {
    try {
      // 檢查網路連線
      const NetInfo = require('@react-native-community/netinfo');
      const netInfo = await NetInfo.fetch();
      
      if (!netInfo.isConnected) {
        throw new Error('NETWORK_ERROR');
      }

      // 根據網路類型調整上傳策略
      let compressionOptions: ImageCompressionOptions = {};
      
      if (netInfo.type === 'cellular') {
        // 行動網路：使用更高的壓縮率
        compressionOptions = {
          maxWidth: 600,
          maxHeight: 450,
          quality: 0.6
        };
      } else if (netInfo.type === 'wifi') {
        // WiFi：使用較低的壓縮率
        compressionOptions = {
          maxWidth: 800,
          maxHeight: 600,
          quality: 0.8
        };
      }

      // 預處理圖片
      const processedUri = await this.preprocessImage(imageUri, compressionOptions);
      
      // 上傳圖片
      return await this.uploadMaterialImage(materialId, processedUri);
    } catch (error: any) {
      console.error('Upload with network check error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 錯誤訊息處理
   */
  private getErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.message) {
      switch (error.message) {
        case 'NETWORK_ERROR':
          return '網路連線異常，請檢查網路設定';
        case 'UNAUTHORIZED':
          return '沒有權限上傳圖片';
        case 'REQUEST_TIMEOUT':
          return '上傳逾時，請稍後再試';
        default:
          return error.message;
      }
    }
    
    return '圖片上傳失敗，請稍後再試';
  }
}

// 導出單例實例
export const uploadService = UploadService.getInstance();