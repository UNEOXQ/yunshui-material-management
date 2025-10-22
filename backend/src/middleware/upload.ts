import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
const materialsDir = path.join(uploadsDir, 'materials');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(materialsDir)) {
  fs.mkdirSync(materialsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    // Determine upload directory based on file type or request path
    let uploadPath = uploadsDir;
    
    if (req.path.includes('/material/')) {
      uploadPath = materialsDir;
    }
    
    cb(null, uploadPath);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    
    // Sanitize filename
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9\-_]/g, '');
    const filename = `${sanitizedBaseName}-${uniqueSuffix}${extension}`;
    
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    // Allowed image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  } else {
    cb(new Error('Only image files are allowed.'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only allow single file upload
  }
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string = 'image') => {
  return upload.single(fieldName);
};

// Middleware for multiple file upload
export const uploadMultiple = (fieldName: string = 'images', maxCount: number = 5) => {
  return upload.array(fieldName, maxCount);
};

// Error handling middleware for multer errors
export const handleUploadError = (error: any, _req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: 'File too large',
          message: 'File size cannot exceed 5MB'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many files',
          message: 'Maximum 5 files allowed'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Unexpected file',
          message: 'Unexpected file field'
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'Upload error',
          message: error.message
        });
    }
  }
  
  if (error.message.includes('Invalid file type') || error.message.includes('Only image files')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: error.message
    });
  }
  
  next(error);
};

// Utility function to delete uploaded file
export const deleteUploadedFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Utility function to get file URL
export const getFileUrl = (filename: string, type: 'material' | 'general' = 'general'): string => {
  // 在生產環境中使用正確的 Render URL，開發環境使用 localhost
  const baseUrl = process.env.BASE_URL || 
                  (process.env.NODE_ENV === 'production' ? 'https://yunshui-backend1.onrender.com' : 'http://localhost:3004');
  
  if (type === 'material') {
    return `${baseUrl}/uploads/materials/${filename}`;
  }
  
  return `${baseUrl}/uploads/${filename}`;
};

// Utility function to validate image dimensions (optional)
export const validateImageDimensions = (_filePath: string, _maxWidth: number = 2000, _maxHeight: number = 2000): Promise<boolean> => {
  return new Promise((resolve) => {
    // This would require a library like 'sharp' or 'jimp' to check image dimensions
    // For now, we'll just return true as a placeholder
    resolve(true);
  });
};