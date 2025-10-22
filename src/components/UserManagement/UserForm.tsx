import React, { useState, useEffect } from 'react';
import { User } from '../../types';

interface UserFormProps {
  user: User | null;
  onSubmit: (userData: Partial<User> & { password?: string }) => void;
  onCancel: () => void;
}

interface FormData {
  username: string;
  role: User['role'];
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  username?: string;
  role?: string;
  password?: string;
  confirmPassword?: string;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    role: 'PM',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        role: user.role,
        password: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation - 只檢查是否為空
    if (!formData.username.trim()) {
      newErrors.username = '使用者名稱為必填項目';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = '請選擇使用者角色';
    }

    // Password validation (only for new users or when password is provided)
    if (!user || formData.password) {
      if (!formData.password) {
        newErrors.password = '密碼為必填項目';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '密碼確認不符';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData: Partial<User> & { password?: string } = {
        username: formData.username.trim(),
        role: formData.role
      };

      // Only include email for new users
      if (!user) {
        submitData.email = `${formData.username.trim()}@yunshui.com`;
      }

      // Only include password if it's provided
      if (formData.password) {
        submitData.password = formData.password;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleOptions = () => [
    { value: 'PM', label: 'PM (專案經理)' },
    { value: 'AM', label: 'AM (客戶經理)' },
    { value: 'WAREHOUSE', label: '倉庫管理員' },
    { value: 'ADMIN', label: '系統管理員' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{user ? '編輯使用者' : '新增使用者'}</h2>
          <button 
            className="btn-close"
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-group">
            <label htmlFor="username">使用者名稱 *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={errors.username ? 'error' : ''}
              placeholder="請輸入使用者名稱"
            />
            {errors.username && (
              <span className="error-text">{errors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="role">使用者角色 *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className={errors.role ? 'error' : ''}
            >
              {getRoleOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <span className="error-text">{errors.role}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              密碼 {user ? '(留空表示不更改)' : '*'}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={errors.password ? 'error' : ''}
              placeholder={user ? '留空表示不更改密碼' : '請輸入密碼'}
            />
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          {(!user || formData.password) && (
            <div className="form-group">
              <label htmlFor="confirmPassword">確認密碼 *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder="請再次輸入密碼"
              />
              {errors.confirmPassword && (
                <span className="error-text">{errors.confirmPassword}</span>
              )}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '處理中...' : (user ? '更新' : '建立')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};