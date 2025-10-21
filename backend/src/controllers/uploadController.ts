import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { MaterialModel } from '../models/Material';
import { getFileUrl, deleteUploadedFile } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

// 驗證 ID 格式的輔助函數
function isValidId(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const memoryIdRegex = /^(material|user|order|project)-\w+$/i;
  const simpleMemoryIdRegex = /^id-\d+$/i; // 支持 id-2000 格式
  
  return uuidRegex.test(id) || memoryIdRegex.test(id) || simpleMemoryIdRegex.test(id);
}

export class UploadController {
  /**
   * Upload material image
   * POST /api/upload/material/:id/image
   */
  static async uploadMaterialImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if user has admin privileges
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only administrators can upload material images'
        });
        return;
      }

      // Validate ID format (UUID or memory database format)
      if (!isValidId(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'Material ID must be a valid UUID or memory database ID'
        });
        return;
      }

      // Check if material exists
      const material = await MaterialModel.findById(id);
      if (!material) {
        // Clean up uploaded file if material doesn't exist
        if (req.file) {
          await deleteUploadedFile(req.file.path);
        }
        
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Material not found'
        });
        return;
      }

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
          message: 'Please select an image file to upload'
        });
        return;
      }

      // Generate file URL
      const imageUrl = getFileUrl(req.file.filename, 'material');

      // Delete old image if exists
      if (material.imageUrl) {
        try {
          const oldImagePath = material.imageUrl.replace(
            process.env.BASE_URL || 'http://localhost:3000',
            process.cwd()
          );
          await deleteUploadedFile(oldImagePath);
        } catch (error) {
          console.warn('Failed to delete old image:', error);
        }
      }

      // Update material with new image URL
      const updatedMaterial = await MaterialModel.updateImageUrl(id, imageUrl);

      if (!updatedMaterial) {
        // Clean up uploaded file if update failed
        await deleteUploadedFile(req.file.path);
        
        res.status(500).json({
          success: false,
          error: 'Update failed',
          message: 'Failed to update material image'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          material: updatedMaterial,
          imageUrl: imageUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size
        },
        message: 'Material image uploaded successfully'
      });
    } catch (error: any) {
      console.error('Upload material image error:', error);

      // Clean up uploaded file on error
      if (req.file) {
        try {
          await deleteUploadedFile(req.file.path);
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded file:', cleanupError);
        }
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while uploading the image'
      });
    }
  }

  /**
   * Delete material image
   * DELETE /api/upload/material/:id/image
   */
  static async deleteMaterialImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if user has admin privileges
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only administrators can delete material images'
        });
        return;
      }

      // Validate ID format (UUID or memory database format)
      if (!isValidId(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'Material ID must be a valid UUID or memory database ID'
        });
        return;
      }

      // Check if material exists
      const material = await MaterialModel.findById(id);
      if (!material) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Material not found'
        });
        return;
      }

      // Check if material has an image
      if (!material.imageUrl) {
        res.status(400).json({
          success: false,
          error: 'No image',
          message: 'Material has no image to delete'
        });
        return;
      }

      // Delete image file
      try {
        const imagePath = material.imageUrl.replace(
          process.env.BASE_URL || 'http://localhost:3000',
          process.cwd()
        );
        await deleteUploadedFile(imagePath);
      } catch (error) {
        console.warn('Failed to delete image file:', error);
      }

      // Update material to remove image URL
      const updatedMaterial = await MaterialModel.updateImageUrl(id, '');

      if (!updatedMaterial) {
        res.status(500).json({
          success: false,
          error: 'Update failed',
          message: 'Failed to remove material image'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedMaterial,
        message: 'Material image deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete material image error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while deleting the image'
      });
    }
  }

  /**
   * Get upload info
   * GET /api/upload/info
   */
  static async getUploadInfo(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const uploadInfo = {
        maxFileSize: '5MB',
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        maxFiles: 1,
        uploadPath: '/api/upload/material/:id/image'
      };

      res.status(200).json({
        success: true,
        data: uploadInfo,
        message: 'Upload information retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get upload info error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving upload information'
      });
    }
  }

  /**
   * Serve uploaded files
   * GET /uploads/*
   */
  static serveFile(req: any, res: Response): void {
    const filePath = path.join(process.cwd(), 'uploads', req.params[0]);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: 'File not found',
        message: 'The requested file does not exist'
      });
      return;
    }

    // Set appropriate headers
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'File read error',
          message: 'An error occurred while reading the file'
        });
      }
    });
  }
}