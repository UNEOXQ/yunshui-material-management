import multer from 'multer';
import { Request } from 'express';
import { cloudinaryStorage } from '../config/cloudinary';

// File filter function
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    // Allowed image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支援的圖片格式: ${file.mimetype}. 支援的格式: JPEG, PNG, GIF, WebP`));
    }
  } else {
    cb(new Error('只能上傳圖片文件'));
  }
};

// Configure multer with Cloudinary storage
const upload = multer({
  storage: cloudinaryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only allow single file upload
  }
});

// Single file upload middleware
export const uploadSingleToCloudinary = upload.single('image');

// Error handling middleware
export const handleCloudinaryUploadError = (error: any, _req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: '圖片大小不能超過 5MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        message: '一次只能上傳一個圖片'
      });
    }
  }
  
  if (error.message) {
    return res.status(400).json({
      success: false,
      error: 'Upload error',
      message: error.message
    });
  }
  
  next(error);
};

// Get file URL helper (for Cloudinary, the URL is directly available)
export const getCloudinaryFileUrl = (filename: string): string => {
  // For Cloudinary, the filename is actually the full URL
  return filename;
};

// Delete file helper (for Cloudinary)
export const deleteCloudinaryFile = async (publicId: string): Promise<boolean> => {
  try {
    const cloudinary = require('cloudinary').v2;
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    return false;
  }
};