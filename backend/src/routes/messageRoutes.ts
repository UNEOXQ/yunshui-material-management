import { Router } from 'express';
import { MessageController } from '../controllers/messageController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 發送留言
router.post('/', authenticateToken, MessageController.sendMessage);

// 獲取專案的最新留言
router.get('/latest/:projectId', authenticateToken, MessageController.getLatestMessages);

// 獲取所有留言（管理員用）
router.get('/', authenticateToken, MessageController.getAllMessages);

export default router;