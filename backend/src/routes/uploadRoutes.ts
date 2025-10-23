import { Router } from 'express';
import { UploadController } from '../controllers/uploadController';
import { authenticateToken, requireRole } from '../middleware/auth';
// import { uploadSingle, handleUploadError } from '../middleware/upload'; // 保留作為備用
import { uploadSingleToCloudinary, handleCloudinaryUploadError } from '../middleware/cloudinaryUpload';

const router = Router();

/**
 * @route   POST /api/upload/material/:id/image
 * @desc    Upload image for a material (Admin only)
 * @access  Private (Admin)
 * @param   id - Material UUID
 */
router.post(
  '/material/:id/image',
  authenticateToken,
  requireRole('ADMIN'),
  uploadSingleToCloudinary,
  handleCloudinaryUploadError,
  UploadController.uploadMaterialImage
);

/**
 * @route   DELETE /api/upload/material/:id/image
 * @desc    Delete image for a material (Admin only)
 * @access  Private (Admin)
 * @param   id - Material UUID
 */
router.delete(
  '/material/:id/image',
  authenticateToken,
  requireRole('ADMIN'),
  UploadController.deleteMaterialImage
);

/**
 * @route   GET /api/upload/info
 * @desc    Get upload configuration information
 * @access  Private (All authenticated users)
 */
router.get('/info', authenticateToken, UploadController.getUploadInfo);

/**
 * @route   GET /uploads/*
 * @desc    Serve uploaded files
 * @access  Public
 */
router.get('/files/*', UploadController.serveFile);

export default router;