import { uploadService, UploadService } from '../uploadService';
import { apiService } from '../api';

// Mock dependencies
jest.mock('../api');

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

// Mock react-native Image
jest.mock('react-native', () => ({
  Image: {
    getSize: jest.fn(),
  },
}));

describe('UploadService', () => {
  const mockApiService = apiService as jest.Mocked<typeof apiService>;

  const mockImageUri = 'file:///path/to/image.jpg';
  const mockUploadResponse = {
    imageUrl: 'https://cloudinary.com/uploaded-image.jpg',
    publicId: 'uploaded-image',
  };

  const mockApiResponse = {
    success: true,
    data: mockUploadResponse,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch for FormData uploads
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockApiResponse),
    });
    
    // Mock expo-image-manipulator
    const mockManipulateAsync = require('expo-image-manipulator').manipulateAsync;
    mockManipulateAsync.mockResolvedValue({
      uri: 'file:///path/to/compressed-image.jpg',
    });
    
    // Default successful API responses
    mockApiService.get.mockResolvedValue({
      success: true,
      data: {
        maxFileSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png'],
        maxFiles: 10,
        uploadPath: '/uploads',
      },
    });
    
    mockApiService.delete.mockResolvedValue({
      success: true,
      data: undefined,
    });
  });

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      // Mock fetch response for blob creation
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          blob: () => Promise.resolve(new Blob(['mock-image-data'], { type: 'image/jpeg' })),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockApiResponse),
        });

      const result = await uploadService.uploadImage(mockImageUri);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockUploadResponse);
    });

    it('should handle upload errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          blob: () => Promise.resolve(new Blob(['mock-image-data'], { type: 'image/jpeg' })),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: () => Promise.resolve({ message: 'Upload failed' }),
        });

      await expect(uploadService.uploadImage(mockImageUri)).rejects.toThrow('Upload failed');
    });

    it('should compress image before upload', async () => {
      const mockManipulateAsync = require('expo-image-manipulator').manipulateAsync;
      
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          blob: () => Promise.resolve(new Blob(['mock-image-data'], { type: 'image/jpeg' })),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockApiResponse),
        });

      await uploadService.uploadImage(mockImageUri);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        mockImageUri,
        expect.any(Array),
        expect.objectContaining({
          compress: expect.any(Number),
        })
      );
    });
  });

  describe('uploadMultipleImages', () => {
    const materialId = 'material-123';
    const mockImageUris = [
      'file:///path/to/image1.jpg',
      'file:///path/to/image2.jpg',
    ];

    it('should upload multiple images successfully', async () => {
      global.fetch = jest.fn()
        .mockResolvedValue({
          blob: () => Promise.resolve(new Blob(['mock-image-data'], { type: 'image/jpeg' })),
        })
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockApiResponse),
        });

      const results = await uploadService.uploadMultipleImages(materialId, mockImageUris);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockUploadResponse);
      expect(results[1]).toEqual(mockUploadResponse);
    });

    it('should handle upload failures', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          blob: () => Promise.resolve(new Blob(['mock-image-data'], { type: 'image/jpeg' })),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockApiResponse),
        })
        .mockResolvedValueOnce({
          blob: () => Promise.resolve(new Blob(['mock-image-data'], { type: 'image/jpeg' })),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'Upload failed' }),
        });

      await expect(uploadService.uploadMultipleImages(materialId, mockImageUris))
        .rejects.toThrow();
    });
  });

  describe('deleteMaterialImage', () => {
    const materialId = 'material-123';

    it('should delete material image successfully', async () => {
      await uploadService.deleteMaterialImage(materialId);

      expect(mockApiService.delete).toHaveBeenCalledWith(`/api/upload/material/${materialId}/image`);
    });

    it('should handle delete errors', async () => {
      mockApiService.delete.mockResolvedValue({
        success: false,
        error: 'Delete failed',
      });

      await expect(uploadService.deleteMaterialImage(materialId)).rejects.toThrow('Delete failed');
    });
  });

  describe('getUploadInfo', () => {
    it('should get upload info successfully', async () => {
      const result = await uploadService.getUploadInfo();

      expect(mockApiService.get).toHaveBeenCalledWith('/api/upload/info');
      expect(result).toEqual({
        maxFileSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png'],
        maxFiles: 10,
        uploadPath: '/uploads',
      });
    });

    it('should handle get upload info errors', async () => {
      mockApiService.get.mockResolvedValue({
        success: false,
        error: 'Failed to get upload info',
      });

      await expect(uploadService.getUploadInfo()).rejects.toThrow('Failed to get upload info');
    });
  });

  describe('validateImage', () => {
    it('should validate image successfully', () => {
      const validImage = {
        uri: mockImageUri,
        type: 'image/jpeg',
        name: 'test-image.jpg',
        size: 1024 * 1024, // 1MB
      };

      const errors = uploadService.validateImage(validImage);

      expect(errors).toHaveLength(0);
    });

    it('should reject files that are too large', () => {
      const largeImage = {
        uri: mockImageUri,
        type: 'image/jpeg',
        name: 'large-image.jpg',
        size: 10 * 1024 * 1024, // 10MB
      };

      const errors = uploadService.validateImage(largeImage);

      expect(errors).toContain('圖片大小不能超過 5MB');
    });

    it('should reject invalid file types', () => {
      const invalidImage = {
        uri: 'file:///path/to/document.pdf',
        type: 'application/pdf',
        name: 'document.pdf',
      };

      const errors = uploadService.validateImage(invalidImage);

      expect(errors).toContain('不支援的圖片格式，請選擇 JPEG、PNG、GIF 或 WebP 格式');
    });

    it('should reject files with empty names', () => {
      const noNameImage = {
        uri: mockImageUri,
        type: 'image/jpeg',
        name: '',
      };

      const errors = uploadService.validateImage(noNameImage);

      expect(errors).toContain('圖片文件名不能為空');
    });
  });

  describe('compressImage', () => {
    it('should compress image successfully', async () => {
      const mockManipulateAsync = require('expo-image-manipulator').manipulateAsync;
      mockManipulateAsync.mockResolvedValue({
        uri: 'file:///path/to/compressed-image.jpg',
      });

      const result = await uploadService.compressImage(mockImageUri);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        mockImageUri,
        expect.arrayContaining([
          expect.objectContaining({
            resize: expect.objectContaining({
              width: expect.any(Number),
              height: expect.any(Number),
            }),
          }),
        ]),
        expect.objectContaining({
          compress: expect.any(Number),
          format: expect.any(String),
        })
      );
      expect(result).toBe('file:///path/to/compressed-image.jpg');
    });

    it('should handle compression errors gracefully', async () => {
      const mockManipulateAsync = require('expo-image-manipulator').manipulateAsync;
      mockManipulateAsync.mockRejectedValue(new Error('Compression failed'));

      // Should return original URI if compression fails
      const result = await uploadService.compressImage(mockImageUri);

      expect(result).toBe(mockImageUri);
    });

    it('should use custom compression options', async () => {
      const mockManipulateAsync = require('expo-image-manipulator').manipulateAsync;
      mockManipulateAsync.mockResolvedValue({
        uri: 'file:///path/to/compressed-image.jpg',
      });

      const options = {
        maxWidth: 1024,
        maxHeight: 768,
        quality: 0.9,
        format: 'PNG' as const,
      };

      await uploadService.compressImage(mockImageUri, options);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        mockImageUri,
        expect.arrayContaining([
          expect.objectContaining({
            resize: expect.objectContaining({
              width: 1024,
              height: 768,
            }),
          }),
        ]),
        expect.objectContaining({
          compress: 0.9,
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors with proper error messages', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          blob: () => Promise.resolve(new Blob(['mock-image-data'], { type: 'image/jpeg' })),
        })
        .mockRejectedValueOnce(new Error('NETWORK_ERROR'));

      await expect(uploadService.uploadImage(mockImageUri)).rejects.toThrow('網路連線異常，請檢查網路設定');
    });

    it('should handle unauthorized errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          blob: () => Promise.resolve(new Blob(['mock-image-data'], { type: 'image/jpeg' })),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({ message: 'UNAUTHORIZED' }),
        });

      await expect(uploadService.uploadImage(mockImageUri)).rejects.toThrow('沒有權限上傳圖片');
    });

    it('should handle timeout errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          blob: () => Promise.resolve(new Blob(['mock-image-data'], { type: 'image/jpeg' })),
        })
        .mockRejectedValueOnce(new Error('REQUEST_TIMEOUT'));

      await expect(uploadService.uploadImage(mockImageUri)).rejects.toThrow('上傳逾時，請稍後再試');
    });

    it('should handle generic errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          blob: () => Promise.resolve(new Blob(['mock-image-data'], { type: 'image/jpeg' })),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({ message: 'Some other error' }),
        });

      await expect(uploadService.uploadImage(mockImageUri)).rejects.toThrow('Some other error');
    });
  });

  describe('getImageMetadata', () => {
    it('should get image metadata successfully', async () => {
      const mockGetSize = require('react-native').Image.getSize;
      mockGetSize.mockImplementation((uri, successCallback) => {
        successCallback(800, 600);
      });

      const result = await uploadService.getImageMetadata(mockImageUri);

      expect(result).toEqual({
        width: 800,
        height: 600,
        size: 0,
        type: 'image/jpeg',
      });
    });

    it('should handle metadata errors', async () => {
      const mockGetSize = require('react-native').Image.getSize;
      mockGetSize.mockImplementation((uri, successCallback, errorCallback) => {
        errorCallback(new Error('Failed to get size'));
      });

      await expect(uploadService.getImageMetadata(mockImageUri)).rejects.toThrow('無法獲取圖片信息');
    });
  });

  describe('uploadWithNetworkCheck', () => {
    const materialId = 'material-123';

    beforeEach(() => {
      // Mock NetInfo
      const mockNetInfo = {
        fetch: jest.fn().mockResolvedValue({
          isConnected: true,
          type: 'wifi',
        }),
      };
      jest.doMock('@react-native-community/netinfo', () => mockNetInfo);
    });

    it('should upload with network check successfully', async () => {
      global.fetch = jest.fn()
        .mockResolvedValue({
          blob: () => Promise.resolve(new Blob(['mock-image-data'], { type: 'image/jpeg' })),
        })
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockApiResponse),
        });

      const result = await uploadService.uploadWithNetworkCheck(materialId, mockImageUri);

      expect(result).toEqual(mockUploadResponse);
    });

    it('should handle network disconnection', async () => {
      const mockNetInfo = require('@react-native-community/netinfo');
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
      });

      await expect(uploadService.uploadWithNetworkCheck(materialId, mockImageUri))
        .rejects.toThrow('網路連線異常，請檢查網路設定');
    });
  });
});