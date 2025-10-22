import React, { useState, useEffect } from 'react';
import { messageService } from '../../services/messageService';
import './MessageManagement.css';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface MessageManagementProps {
  onBack: () => void;
}

export const MessageManagement: React.FC<MessageManagementProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [messageContent, setMessageContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [currentMessages, setCurrentMessages] = useState<{[userId: string]: any}>({});
  const [loadingMessages, setLoadingMessages] = useState(false);

  // 載入用戶列表
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await messageService.getAllUsers();
      if (response.success && response.data) {
        // 過濾掉當前管理員自己
        const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;
        const filteredUsers = response.data.users?.filter((user: User) => user.id !== currentUserId) || [];
        setUsers(filteredUsers);
        
        // 載入每個用戶的當前留言
        loadCurrentMessages(filteredUsers);
      } else {
        setError(response.message || '載入用戶列表失敗');
      }
    } catch (err) {
      setError('載入用戶列表失敗');
    } finally {
      setLoading(false);
    }
  };

  // 載入所有用戶的當前留言
  const loadCurrentMessages = async (userList: User[]) => {
    setLoadingMessages(true);
    const messages: {[userId: string]: any} = {};
    
    for (const user of userList) {
      try {
        // 這裡我們需要一個新的 API 來獲取發送給特定用戶的最新留言
        // 暫時使用 getLatestMessage，但需要修改後端
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004/api'}/messages/latest/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            messages[user.id] = result.data;
          }
        }
      } catch (error) {
        console.error(`載入用戶 ${user.username} 的留言失敗:`, error);
      }
    }
    
    setCurrentMessages(messages);
    setLoadingMessages(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      setError('請選擇要發送留言的用戶');
      return;
    }
    
    if (!messageContent.trim()) {
      setError('請輸入留言內容');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const response = await messageService.sendMessage(selectedUserId, messageContent.trim());
      
      if (response.success) {
        setSuccess('留言發送成功！舊留言已被覆蓋');
        setMessageContent('');
        
        // 重新載入該用戶的留言
        loadCurrentMessages(users);
        
        // 3秒後清除成功訊息
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || '發送留言失敗');
      }
    } catch (err) {
      setError('發送留言失敗');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (userId: string, messageId: string) => {
    if (!confirm('確定要刪除這條留言嗎？')) {
      return;
    }

    try {
      const response = await messageService.deleteAllMessagesForUser(userId);
      
      if (response.success) {
        setSuccess('留言已刪除');
        
        // 重新載入留言
        loadCurrentMessages(users);
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || '刪除留言失敗');
      }
    } catch (err) {
      setError('刪除留言失敗');
    }
  };

  const selectedUser = users.find(user => user.id === selectedUserId);

  return (
    <div className="message-management">
      <div className="message-header">
        <button onClick={onBack} className="btn btn-secondary">
          ← 返回管理員控制台
        </button>
        <h1>💬 留言管理</h1>
      </div>

      <div className="message-content">
        <div className="message-form-container">
          <h2>發送留言給用戶</h2>
          
          {loading && (
            <div className="loading-message">
              載入用戶列表中...
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="message-form">
            <div className="form-group">
              <label htmlFor="user-select">選擇用戶：</label>
              <select
                id="user-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="user-select"
                disabled={loading || sending}
              >
                <option value="">-- 請選擇要發送留言的用戶 --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role === 'PM' ? '專案經理' : 
                                    user.role === 'AM' ? '客戶經理' : 
                                    user.role === 'WAREHOUSE' ? '倉庫管理員' : 
                                    user.role}) - {user.email}
                  </option>
                ))}
              </select>
            </div>

            {selectedUser && (
              <div className="selected-user-info">
                <h3>發送給：{selectedUser.username}</h3>
                <p>角色：{selectedUser.role === 'PM' ? '專案經理' : 
                        selectedUser.role === 'AM' ? '客戶經理' : 
                        selectedUser.role === 'WAREHOUSE' ? '倉庫管理員' : 
                        selectedUser.role}</p>
                <p>郵箱：{selectedUser.email}</p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="message-content">留言內容：</label>
              <textarea
                id="message-content"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="請輸入要發送的留言內容..."
                className="message-textarea"
                rows={6}
                disabled={sending}
                maxLength={500}
              />
              <div className="character-count">
                {messageContent.length}/500 字符
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!selectedUserId || !messageContent.trim() || sending}
              >
                {sending ? '發送中...' : '發送留言'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setSelectedUserId('');
                  setMessageContent('');
                  setError('');
                  setSuccess('');
                }}
                className="btn btn-secondary"
                disabled={sending}
              >
                清除
              </button>
            </div>
          </form>
        </div>

        <div className="current-messages-section">
          <h3>📋 當前留言狀態</h3>
          {loadingMessages ? (
            <div className="loading-message">載入留言中...</div>
          ) : (
            <div className="messages-list">
              {users.map(user => (
                <div key={user.id} className="message-item">
                  <div className="message-user-info">
                    <strong>{user.username}</strong>
                    <span className="user-role">
                      ({user.role === 'PM' ? '專案經理' : 
                        user.role === 'AM' ? '客戶經理' : 
                        user.role === 'WAREHOUSE' ? '倉庫管理員' : 
                        user.role})
                    </span>
                  </div>
                  
                  {currentMessages[user.id] ? (
                    <div className="current-message">
                      <div className="message-content">
                        <strong>當前留言：</strong>
                        <p>"{currentMessages[user.id].content}"</p>
                      </div>
                      <div className="message-meta">
                        <span className="message-time">
                          發送時間：{new Date(currentMessages[user.id].createdAt).toLocaleString()}
                        </span>
                        <span className={`message-status ${currentMessages[user.id].isRead ? 'read' : 'unread'}`}>
                          {currentMessages[user.id].isRead ? '已讀' : '未讀'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteMessage(user.id, currentMessages[user.id].id)}
                        className="btn btn-danger btn-small"
                      >
                        🗑️ 刪除留言
                      </button>
                    </div>
                  ) : (
                    <div className="no-message">
                      <span className="no-message-text">暫無留言</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="message-tips">
          <h3>💡 使用提示</h3>
          <ul>
            <li><strong>單一留言制：</strong>每個用戶只能有一條留言，新留言會覆蓋舊留言</li>
            <li><strong>即時通知：</strong>用戶會在右上角看到留言通知</li>
            <li><strong>狀態追蹤：</strong>可以看到留言是否已被用戶讀取</li>
            <li><strong>管理功能：</strong>可以隨時刪除已發送的留言</li>
          </ul>
        </div>
      </div>
    </div>
  );
};