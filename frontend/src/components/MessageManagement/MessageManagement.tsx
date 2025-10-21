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
      } else {
        setError(response.message || '載入用戶列表失敗');
      }
    } catch (err) {
      setError('載入用戶列表失敗');
    } finally {
      setLoading(false);
    }
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
        setSuccess('留言發送成功！');
        setMessageContent('');
        setSelectedUserId('');
        
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

        <div className="message-tips">
          <h3>💡 使用提示</h3>
          <ul>
            <li>選擇要發送留言的用戶</li>
            <li>輸入留言內容（最多500字符）</li>
            <li>點擊發送後，用戶會在右上角看到留言通知</li>
            <li>留言會即時顯示給對應用戶</li>
            <li>用戶點擊通知後留言會標記為已讀</li>
          </ul>
        </div>
      </div>
    </div>
  );
};