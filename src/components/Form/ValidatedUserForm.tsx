import React from 'react';
import { useFormValidation, commonValidationRules } from '../../hooks/useFormValidation';
import { InputField, SelectField } from './FormField';
import { User } from '../../types';
import './Form.css';

interface ValidatedUserFormProps {
  user: User | null;
  onSubmit: (userData: Partial<User> & { password?: string }) => Promise<void>;
  onCancel: () => void;
}

interface UserFormData {
  username: string;
  email: string;
  role: User['role'];
  password: string;
  confirmPassword: string;
}

export const ValidatedUserForm: React.FC<ValidatedUserFormProps> = ({
  user,
  onSubmit,
  onCancel
}) => {
  const initialValues: UserFormData = {
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || 'PM',
    password: '',
    confirmPassword: ''
  };

  const validationRules = {
    username: {
      required: true,
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_-]+$/,
      custom: (value: string) => {
        if (value && !/^[a-zA-Z]/.test(value)) {
          return '使用者名稱必須以字母開頭';
        }
        return null;
      }
    },
    email: commonValidationRules.email,
    role: { required: true },
    password: user ? {} : commonValidationRules.password, // 編輯時密碼可選
    confirmPassword: {
      ...(user ? {} : { required: true }),
      match: 'password',
      custom: (value: string, allValues: UserFormData) => {
        if ((!user || allValues.password) && value !== allValues.password) {
          return '密碼確認不符';
        }
        return null;
      }
    }
  };

  const {
    values,
    errors,
    isValid,
    isSubmitting,
    getFieldProps,
    getFieldError,
    handleSubmit,
    setValue
  } = useFormValidation({
    initialValues,
    validationRules,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (formData) => {
      const submitData: Partial<User> & { password?: string } = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        role: formData.role
      };

      // 只在有密碼時才包含密碼
      if (formData.password) {
        submitData.password = formData.password;
      }

      await onSubmit(submitData);
    }
  });

  const roleOptions = [
    { value: 'PM', label: 'PM (專案經理)' },
    { value: 'AM', label: 'AM (客戶經理)' },
    { value: 'WAREHOUSE', label: '倉庫管理員' },
    { value: 'ADMIN', label: '系統管理員' }
  ];

  // 當密碼欄位變更時，清除確認密碼的錯誤
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('password', e.target.value);
    if (values.confirmPassword && errors.confirmPassword) {
      // 重新驗證確認密碼
      setTimeout(() => {
        setValue('confirmPassword', values.confirmPassword);
      }, 0);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{user ? '編輯使用者' : '新增使用者'}</h2>
          <button 
            className="btn-close"
            onClick={onCancel}
            type="button"
            aria-label="關閉"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-form" noValidate>
          <InputField
            label="使用者名稱"
            required
            type="text"
            id="username"
            placeholder="請輸入使用者名稱"
            error={getFieldError('username')}
            helpText="3-50個字元，只能包含字母、數字、底線和連字號，必須以字母開頭"
            {...getFieldProps('username')}
          />

          <InputField
            label="電子郵件"
            required
            type="email"
            id="email"
            placeholder="請輸入電子郵件"
            error={getFieldError('email')}
            {...getFieldProps('email')}
          />

          <SelectField
            label="使用者角色"
            required
            id="role"
            options={roleOptions}
            error={getFieldError('role')}
            {...getFieldProps('role')}
          />

          <InputField
            label={user ? '密碼 (留空表示不更改)' : '密碼'}
            required={!user}
            type="password"
            id="password"
            placeholder={user ? '留空表示不更改密碼' : '請輸入密碼'}
            error={getFieldError('password')}
            helpText="至少6個字元"
            value={values.password}
            onChange={handlePasswordChange}
            onBlur={getFieldProps('password').onBlur}
            className={getFieldProps('password').className}
          />

          {(!user || values.password) && (
            <InputField
              label="確認密碼"
              required
              type="password"
              id="confirmPassword"
              placeholder="請再次輸入密碼"
              error={getFieldError('confirmPassword')}
              {...getFieldProps('confirmPassword')}
            />
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
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? '處理中...' : (user ? '更新' : '建立')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};