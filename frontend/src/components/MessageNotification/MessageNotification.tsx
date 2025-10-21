import React, { useState, useEffect } from 'react';
import { messageService } from '../../services/messageService';
import { Message } from '../../types/message';
import './MessageNotification.css';

interface MessageNotificationProps {
  user: any;
}

export const MessageNotification: React.FC<MessageNotificationProps> = ({ user }) => {
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 定期檢查未讀留言
  useEffect(() => {
    if (!user) return;

    const checkMessages = async () => {
      try {
        console.log('🔍 MessageNotification: 開始檢查留言...');
        
        // 先檢查未讀留言
        const unreadResponse = await messageService.getUnreadMessages();
        console.log('📬 未讀留言響應:', unreadResponse);
        
        if (unreadResponse.success && unreadResponse.data && unreadResponse.data.length > 0) {
          // 如果有未讀留言，顯示最新的未讀留言
          const latestUnreadMessage = unreadResponse.data[0];
          console.log('✅ 顯示未讀留言:', latestUnreadMessage);
          setCurrentMessage(latestUnreadMessage);
        } else {
          console.log('📭 沒有未讀留言，檢查最新留言...');
          
          // 如果沒有未讀留言，獲取最新的留言（包括已讀的）
          const allMessagesResponse = await messageService.getLatestMessage();
          console.log('📨 最新留言響應:', allMessagesResponse);
          
          if (allMessagesResponse.success && allMessagesResponse.data) {
            console.log('✅ 顯示最新留言:', allMessagesResponse.data);
            setCurrentMessage(allMessagesResponse.data);
          } else {
            console.log('❌ 完全沒有留言，隱藏組件');
            // 完全沒有留言時清除顯示
            setCurrentMessage(null);
          }
        }
      } catch (error) {
        console.error('❌ 檢查留言失敗:', error);
      }
    };

    // 立即檢查一次
    checkMessages();

    // 每30秒檢查一次新留言
    const interval = setInterval(checkMessages, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // 移除標記已讀功能，留言將持續顯示直到新留言覆蓋

  // 如果沒有留言，不顯示任何內容
  if (!currentMessage) {
    console.log('🚫 MessageNotification: 沒有留言，不渲染組件');
    return null;
  }

  console.log('🎨 MessageNotification: 渲染留言組件:', currentMessage);

  return (
    <div 
      className="message-widget"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="message-widget-content">
        <div className="message-widget-header">
          <span className="message-widget-icon">💬</span>
          <span className="message-widget-title">管理員留言</span>
        </div>
        
        <div className={`message-widget-body ${isHovered ? 'expanded' : ''}`}>
          <div className="message-widget-text">
            {currentMessage.content}
          </div>
          <div className="message-widget-time">
            {new Date(currentMessage.createdAt).toLocaleString('zh-TW', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </div>
  );
};