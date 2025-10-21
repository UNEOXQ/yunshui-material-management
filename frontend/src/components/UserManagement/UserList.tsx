import React from 'react';
import { User } from '../../types';

interface UserListProps {
  users: User[];
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  onEditUser,
  onDeleteUser
}) => {
  const getRoleDisplayName = (role: User['role']): string => {
    const roleNames = {
      'PM': 'PM (專案經理)',
      'AM': 'AM (客戶經理)',
      'WAREHOUSE': '倉庫管理員',
      'ADMIN': '系統管理員'
    };
    return roleNames[role];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (users.length === 0) {
    return (
      <div className="user-list-empty">
        <p>目前沒有使用者資料</p>
      </div>
    );
  }

  return (
    <div className="user-list">
      <div className="table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>使用者名稱</th>
              <th>電子郵件</th>
              <th>角色</th>
              <th>建立時間</th>
              <th>最後更新</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users && Array.isArray(users) ? users.map(user => (
              <tr key={user.id}>
                <td className="username-cell">
                  <div className="user-info">
                    <span className="username">{user.username}</span>
                    <span className="user-id">ID: {user.id.slice(0, 8)}...</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge role-${user.role.toLowerCase()}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td>{formatDate(user.updatedAt)}</td>
                <td className="actions-cell">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onEditUser(user)}
                    title="編輯使用者"
                  >
                    編輯
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => onDeleteUser(user.id)}
                    title="刪除使用者"
                  >
                    刪除
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} style={{textAlign: 'center', padding: '20px'}}>
                  沒有使用者資料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};