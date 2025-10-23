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
      const { projectId, content } = req.body;
      const userId = req.user!.userId;
      const username = req.user!.username;

      if (!projectId || !content) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Project ID and content are required'
        });
        return;
      }

      // 創建留言
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
        message: 'Message sent successfully'
      });
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
   * GET /api/messages/latest/:projectId
   */
  static async getLatestMessages(req: Request, res: Response): Promise<void> {
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