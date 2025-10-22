import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { UserList } from './UserList';
import { UserForm } from './UserForm';
import { userService } from '../../services/userService';
import './UserManagement.css';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      if (response.success && response.data) {
        // 後端返回的數據結構是 { users: [...], pagination: {...} }
        const loadedUsers = response.data.users || response.data;
        setUsers(loadedUsers);
        
        // 同時更新快速登入用戶列表
        const passwordMap = {
          'user-1': 'admin123',
          'user-2': 'pm123', 
          'user-3': 'am123',
          'user-4': 'wh123'
        };
        
        // 原始用戶名稱映射（用於登入認證）
        const originalUsernameMap = {
          'user-1': 'admin',
          'user-2': 'pm001',
          'user-3': 'am001', 
          'user-4': 'warehouse001'
        };
        
        // 完全重新生成快速登入用戶列表，包含所有用戶
        const quickLoginUsers = loadedUsers.map((user: any) => {
          // 為每個用戶生成快速登入資訊
          let password = 'default123';
          let originalUsername = user.username;
          
          if (user.id === 'user-1') {
            password = 'admin123';
            originalUsername = 'admin';
          } else if (user.id === 'user-2') {
            password = 'pm123';
            originalUsername = 'pm001';
          } else if (user.id === 'user-3') {
            password = 'am123';
            originalUsername = 'am001';
          } else if (user.id === 'user-4') {
            password = 'wh123';
            originalUsername = 'warehouse001';
          } else {
            // 新用戶使用默認密碼，原始用戶名稱就是當前用戶名稱
            password = 'default123';
            originalUsername = user.username;
          }
          
          return {
            id: user.id,
            username: user.username, // 使用最新的用戶名稱
            password: password,
            role: user.role,
            email: user.email,
            originalUsername: originalUsername
          };
        });
        
        console.log('Regenerated complete quick login users list:', quickLoginUsers);
        localStorage.setItem('quickLoginUsers', JSON.stringify(quickLoginUsers));
      } else {
        setError(response.message || '載入使用者失敗');
      }
    } catch (err) {
      setError('載入使用者時發生錯誤');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('確定要刪除此使用者嗎？')) {
      return;
    }

    try {
      const response = await userService.deleteUser(userId);
      if (response.success) {
        setUsers(users.filter(user => user.id !== userId));
      } else {
        setError(response.message || '刪除使用者失敗');
      }
    } catch (err) {
      setError('刪除使用者時發生錯誤');
      console.error('Error deleting user:', err);
    }
  };

  const handleFormSubmit = async (userData: Partial<User> & { password?: string }) => {
    try {
      if (selectedUser) {
        // Update existing user
        const response = await userService.updateUser(selectedUser.id, userData);
        if (response.success && response.data) {
          const updatedUsers = users.map(user => 
            user.id === selectedUser.id ? response.data! : user
          );
          setUsers(updatedUsers);
          
          // 完全重新生成快速登入用戶列表
          const quickLoginUsers = updatedUsers.map((user: any) => {
            let password = 'default123';
            let originalUsername = user.username;
            
            if (user.id === 'user-1') {
              password = 'admin123';
              originalUsername = 'admin';
            } else if (user.id === 'user-2') {
              password = 'pm123';
              originalUsername = 'pm001';
            } else if (user.id === 'user-3') {
              password = 'am123';
              originalUsername = 'am001';
            } else if (user.id === 'user-4') {
              password = 'wh123';
              originalUsername = 'warehouse001';
            } else {
              password = 'default123';
              originalUsername = user.username;
            }
            
            return {
              id: user.id,
              username: user.username,
              password: password,
              role: user.role,
              email: user.email,
              originalUsername: originalUsername
            };
          });
          
          console.log('Updated quick login users after user update:', quickLoginUsers);
          localStorage.setItem('quickLoginUsers', JSON.stringify(quickLoginUsers));
          
          // 檢查是否更新的是當前登入的用戶
          const currentUserStr = localStorage.getItem('user');
          if (currentUserStr) {
            try {
              const currentUser = JSON.parse(currentUserStr);
              
              // 檢查ID是否匹配（現在都是真實用戶，直接比較ID）
              if (currentUser.id === selectedUser.id) {
                // 更新localStorage中的用戶資訊
                const updatedUser = { ...currentUser, ...response.data };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                localStorage.setItem('username', updatedUser.username);
                
                // 觸發自定義事件通知App.tsx更新用戶狀態
                window.dispatchEvent(new Event('userUpdated'));
              }
            } catch (parseError) {
              console.error('Failed to parse current user data:', parseError);
            }
          }
          
          setIsFormOpen(false);
          setSelectedUser(null);
          
          // 觸發事件通知登入頁面更新快速登入用戶列表
          window.dispatchEvent(new Event('usersUpdated'));
        } else {
          setError(response.message || '更新使用者失敗');
        }
      } else {
        // Create new user
        const response = await userService.createUser(userData as User & { password: string });
        if (response.success && response.data) {
          const newUsers = [...users, response.data];
          setUsers(newUsers);
          
          // 重新生成快速登入用戶列表，包含新用戶
          const quickLoginUsers = newUsers.map((user: any) => {
            let password = 'default123';
            let originalUsername = user.username;
            
            if (user.id === 'user-1') {
              password = 'admin123';
              originalUsername = 'admin';
            } else if (user.id === 'user-2') {
              password = 'pm123';
              originalUsername = 'pm001';
            } else if (user.id === 'user-3') {
              password = 'am123';
              originalUsername = 'am001';
            } else if (user.id === 'user-4') {
              password = 'wh123';
              originalUsername = 'warehouse001';
            } else {
              password = 'default123';
              originalUsername = user.username;
            }
            
            return {
              id: user.id,
              username: user.username,
              password: password,
              role: user.role,
              email: user.email,
              originalUsername: originalUsername
            };
          });
          
          console.log('Added new user to quick login list:', quickLoginUsers);
          localStorage.setItem('quickLoginUsers', JSON.stringify(quickLoginUsers));
          
          setIsFormOpen(false);
          setSelectedUser(null);
          
          // 觸發事件通知登入頁面更新快速登入用戶列表
          window.dispatchEvent(new Event('usersUpdated'));
        } else {
          setError(response.message || '建立使用者失敗');
        }
      }
    } catch (err) {
      setError('操作時發生錯誤');
      console.error('Error submitting form:', err);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="user-management-page">
        <div className="loading">載入中...</div>
      </div>
    );
  }

  return (
    <div className="user-management-page">
      <div className="page-header">
        <h1>使用者管理</h1>
        <button 
          className="btn btn-primary"
          onClick={handleCreateUser}
        >
          新增使用者
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button 
            className="btn-close"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      <UserList
        users={users}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
      />

      {isFormOpen && (
        <UserForm
          user={selectedUser}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};