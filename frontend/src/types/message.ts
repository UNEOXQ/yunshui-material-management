// 留言系統類型定義
export interface Message {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageNotification {
  id: string;
  userId: string;
  message: Message;
  isVisible: boolean;
  createdAt: Date;
}