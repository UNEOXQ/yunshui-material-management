import { Router } from 'express';
import { ErrorController } from '../controllers/errorController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 錯誤報告端點
router.post('/report', asyncHandler(ErrorController.reportError));
router.post('/beacon', asyncHandler(ErrorController.reportErrorBeacon));

// 健康檢查端點
router.get('/health', asyncHandler(ErrorController.healthCheck));

// 錯誤統計端點（僅管理員）
router.get('/stats', asyncHandler(ErrorController.getErrorStats));

export default router;