import { Request, Response } from 'express';
import { memoryDb } from '../config/memory-database';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: string;
  };
}

export class MessageController {
  /**
   * 發送留言
   * POST /api/messages
   */
  static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { projectId, toUserId, content } = req.body;
      const userId = req.user!.userId;
      const username = req.user!.username;

      if (!content) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Content is required'
        });
        return;
      }

      // 檢查是專案留言還是用戶留言
      if (projectId) {
        // 專案留言
        const message = await memoryDb.createMessage({
          fromUserId: userId,
          fromUsername: username,
          toProjectId: projectId,
          content: content.trim(),
          messageType: 'PROJECT_MESSAGE'
        });

        res.json({
          success: true,
          data: { message },
          message: 'Project message sent successfully'
        });
      } else if (toUserId) {
        // 用戶留言
        // 獲取目標用戶信息
        const targetUser = await memoryDb.getUserById(toUserId);
        if (!targetUser) {
          res.status(404).json({
            success: false,
            error: 'User not found',
            message: 'Target user does not exist'
          });
          return;
        }

        // 刪除該用戶的所有舊留言（只保留一條最新的）
        await memoryDb.deleteAllMessagesForUser(toUserId);

        const message = await memoryDb.createMessage({
          fromUserId: userId,
          fromUsername: username,
          toUserId: toUserId,
          toUsername: targetUser.username,
          content: content.trim(),
          messageType: 'USER_MESSAGE'
        });

        res.json({
          success: true,
          data: { message },
          message: 'User message sent successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Either projectId or toUserId is required'
        });
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to send message'
      });
    }
  }

  /**
   * 獲取專案的最新留言
   * GET /api/messages/latest/project/:projectId
   */
  static async getLatestProjectMessages(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!projectId) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Project ID is required'
        });
        return;
      }

      // 獲取專案的留言
      const messages = await memoryDb.getMessagesByProjectId(projectId, limit);

      res.json({
        success: true,
        data: { messages },
        message: 'Messages retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get messages error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve messages'
      });
    }
  }

  /**
   * 獲取發送給特定用戶的最新留言
   * GET /api/messages/latest/:userId
   */
  static async getLatestUserMessage(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'User ID is required'
        });
        return;
      }

      // 獲取發送給該用戶的最新留言
      const message = await memoryDb.getLatestMessageForUser(userId);

      res.json({
        success: true,
        data: message,
        message: 'Latest message retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get latest user message error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve latest message'
      });
    }
  }

  /**
   * 獲取當前用戶的未讀留言
   * GET /api/messages/unread
   */
  static async getUnreadMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      // 獲取發送給該用戶的未讀留言
      const message = await memoryDb.getLatestMessageForUser(userId);

      if (message && !message.isRead) {
        res.json({
          success: true,
          data: [message],
          message: 'Unread messages retrieved successfully'
        });
      } else {
        res.json({
          success: true,
          data: [],
          message: 'No unread messages'
        });
      }
    } catch (error: any) {
      console.error('Get unread messages error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve unread messages'
      });
    }
  }

  /**
   * 獲取當前用戶的最新留言
   * GET /api/messages/latest
   */
  static async getCurrentUserLatestMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      // 獲取發送給該用戶的最新留言
      const message = await memoryDb.getLatestMessageForUser(userId);

      res.json({
        success: true,
        data: message,
        message: 'Latest message retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get current user latest message error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve latest message'
      });
    }
  }

  /**
   * 標記留言為已讀
   * PUT /api/messages/:messageId/read
   */
  static async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const userId = req.user!.userId;

      if (!messageId) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Message ID is required'
        });
        return;
      }

      // 標記留言為已讀
      const success = await memoryDb.markMessageAsRead(messageId, userId);

      if (success) {
        res.json({
          success: true,
          message: 'Message marked as read successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Message not found or access denied'
        });
      }
    } catch (error: any) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to mark message as read'
      });
    }
  }

  /**
   * 刪除留言（管理員）
   * DELETE /api/messages/:messageId
   */
  static async deleteMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const userRole = req.user!.role;

      // 只有管理員可以刪除留言
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only administrators can delete messages'
        });
        return;
      }

      if (!messageId) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Message ID is required'
        });
        return;
      }

      const success = await memoryDb.deleteMessage(messageId);

      if (success) {
        res.json({
          success: true,
          message: 'Message deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Message not found'
        });
      }
    } catch (error: any) {
      console.error('Delete message error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete message'
      });
    }
  }

  /**
   * 刪除用戶的所有留言（管理員）
   * DELETE /api/messages/user/:userId
   */
  static async deleteAllMessagesForUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const userRole = req.user!.role;

      // 只有管理員可以刪除用戶留言
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only administrators can delete user messages'
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'User ID is required'
        });
        return;
      }

      await memoryDb.deleteAllMessagesForUser(userId);

      res.json({
        success: true,
        message: 'All messages for user deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete all messages for user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete user messages'
      });
    }
  }

  /**
   * 獲取所有留言（管理員用）
   * GET /api/messages
   */
  static async getAllMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = req.user!.role;

      // 只有管理員可以查看所有留言
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only administrators can view all messages'
        });
        return;
      }

      const messages = await memoryDb.getAllMessages();

      res.json({
        success: true,
        data: { messages },
        message: 'All messages retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get all messages error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve messages'
      });
    }
  }
}