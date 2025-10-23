import { Router } from 'express';
import { MessageController } from '../controllers/messageController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 發送留言
router.post('/', authenticateToken, MessageController.sendMessage);

// 獲取當前用戶的未讀留言
router.get('/unread', authenticateToken, MessageController.getUnreadMessages);

// 獲取當前用戶的最新留言
router.get('/latest', authenticateToken, MessageController.getCurrentUserLatestMessage);

// 獲取發送給特定用戶的最新留言
router.get('/latest/:userId', authenticateToken, MessageController.getLatestUserMessage);

// 獲取專案的最新留言
router.get('/latest/project/:projectId', authenticateToken, MessageController.getLatestProjectMessages);

// 標記留言為已讀
router.put('/:messageId/read', authenticateToken, MessageController.markAsRead);

// 刪除留言（管理員）
router.delete('/:messageId', authenticateToken, MessageController.deleteMessage);

// 刪除用戶的所有留言（管理員）
router.delete('/user/:userId', authenticateToken, MessageController.deleteAllMessagesForUser);

// 獲取所有留言（管理員用）
router.get('/', authenticateToken, MessageController.getAllMessages);

export default router;