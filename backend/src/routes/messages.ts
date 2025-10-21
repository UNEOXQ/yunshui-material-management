import express from 'express';
import { memoryDb } from '../config/memory-database';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// 發送留言
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { toUserId, content } = req.body;
    const fromUserId = req.user?.userId;
    const fromUsername = req.user?.username;

    if (!toUserId || !content) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數'
      });
    }

    if (!fromUserId || !fromUsername) {
      return res.status(401).json({
        success: false,
        message: '用戶身份驗證失敗'
      });
    }

    // 檢查目標用戶是否存在
    const toUser = await memoryDb.getUserById(toUserId);
    if (!toUser) {
      return res.status(404).json({
        success: false,
        message: '目標用戶不存在'
      });
    }

    // 創建留言
    const message = await memoryDb.createMessage({
      fromUserId,
      fromUsername,
      toUserId,
      toUsername: toUser.username,
      content: content.trim(),
      isRead: false
    });

    return res.json({
      success: true,
      data: message,
      message: '留言發送成功'
    });

  } catch (error) {
    console.error('發送留言失敗:', error);
    return res.status(500).json({
      success: false,
      message: '發送留言失敗'
    });
  }
});

// 獲取用戶的未讀留言
router.get('/unread', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用戶身份驗證失敗'
      });
    }

    const messages = await memoryDb.getUnreadMessages(userId);

    return res.json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('獲取未讀留言失敗:', error);
    return res.status(500).json({
      success: false,
      message: '獲取未讀留言失敗'
    });
  }
});

// 獲取用戶的最新留言（包括已讀的）
router.get('/latest', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用戶身份驗證失敗'
      });
    }

    const latestMessage = await memoryDb.getLatestMessage(userId);

    return res.json({
      success: true,
      data: latestMessage
    });

  } catch (error) {
    console.error('獲取最新留言失敗:', error);
    return res.status(500).json({
      success: false,
      message: '獲取最新留言失敗'
    });
  }
});

// 獲取發送給特定用戶的最新留言（管理員用）
router.get('/latest/:userId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const userRole = req.user?.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '只有管理員可以查看其他用戶的留言'
      });
    }

    const latestMessage = await memoryDb.getLatestMessage(userId);

    return res.json({
      success: true,
      data: latestMessage
    });

  } catch (error) {
    console.error('獲取最新留言失敗:', error);
    return res.status(500).json({
      success: false,
      message: '獲取最新留言失敗'
    });
  }
});

// 標記留言為已讀
router.put('/:messageId/read', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用戶身份驗證失敗'
      });
    }

    const success = await memoryDb.markMessageAsRead(messageId, userId);

    if (success) {
      return res.json({
        success: true,
        message: '留言已標記為已讀'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: '留言不存在或無權限'
      });
    }

  } catch (error) {
    console.error('標記已讀失敗:', error);
    return res.status(500).json({
      success: false,
      message: '標記已讀失敗'
    });
  }
});

// 刪除留言（管理員）
router.delete('/:messageId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用戶身份驗證失敗'
      });
    }

    // 檢查是否為管理員
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '只有管理員可以刪除留言'
      });
    }

    const success = await memoryDb.deleteMessage(messageId, userId);

    if (success) {
      return res.json({
        success: true,
        message: '留言已刪除'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: '留言不存在或無權限'
      });
    }

  } catch (error) {
    console.error('刪除留言失敗:', error);
    return res.status(500).json({
      success: false,
      message: '刪除留言失敗'
    });
  }
});

// 刪除用戶的所有留言（管理員）
router.delete('/user/:userId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const userRole = req.user?.role;

    if (!userRole || userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '只有管理員可以刪除留言'
      });
    }

    const success = await memoryDb.deleteAllMessagesForUser(targetUserId);

    if (success) {
      return res.json({
        success: true,
        message: '用戶的所有留言已刪除'
      });
    } else {
      return res.json({
        success: true,
        message: '該用戶沒有留言'
      });
    }

  } catch (error) {
    console.error('刪除用戶留言失敗:', error);
    return res.status(500).json({
      success: false,
      message: '刪除用戶留言失敗'
    });
  }
});

export default router;