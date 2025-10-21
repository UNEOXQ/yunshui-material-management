// 留言服務
import { Message } from '../types/message';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';

export const messageService = {
  // 發送留言
  async sendMessage(toUserId: string, content: string): Promise<{success: boolean, data?: Message, message?: string}> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toUserId,
          content
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('發送留言失敗:', error);
      return { success: false, message: '發送留言失敗' };
    }
  },

  // 獲取用戶的未讀留言
  async getUnreadMessages(): Promise<{success: boolean, data?: Message[], message?: string}> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/messages/unread`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('獲取未讀留言失敗:', error);
      return { success: false, message: '獲取未讀留言失敗' };
    }
  },

  // 標記留言為已讀
  async markAsRead(messageId: string): Promise<{success: boolean, message?: string}> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('標記已讀失敗:', error);
      return { success: false, message: '標記已讀失敗' };
    }
  },

  // 獲取最新留言（包括已讀的）
  async getLatestMessage(): Promise<{success: boolean, data?: Message, message?: string}> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/messages/latest`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('獲取最新留言失敗:', error);
      return { success: false, message: '獲取最新留言失敗' };
    }
  },

  // 獲取所有用戶（管理員用）
  async getAllUsers(): Promise<{success: boolean, data?: any[], message?: string}> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('獲取用戶列表失敗:', error);
      return { success: false, message: '獲取用戶列表失敗' };
    }
  },

  // 刪除留言（管理員）
  async deleteMessage(messageId: string): Promise<{success: boolean, message?: string}> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('刪除留言失敗:', error);
      return { success: false, message: '刪除留言失敗' };
    }
  },

  // 刪除用戶的所有留言（管理員）
  async deleteAllMessagesForUser(userId: string): Promise<{success: boolean, message?: string}> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/messages/user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('刪除用戶留言失敗:', error);
      return { success: false, message: '刪除用戶留言失敗' };
    }
  }
};