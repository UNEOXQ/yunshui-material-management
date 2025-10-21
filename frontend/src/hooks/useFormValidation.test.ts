import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useFormValidation, commonValidationRules } from './useFormValidation';

describe('useFormValidation', () => {
  interface TestFormData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    age: string;
  }

  const initialValues: TestFormData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: ''
  };

  const validationRules = {
    username: { required: true, minLength: 3, maxLength: 20 },
    email: commonValidationRules.email,
    password: commonValidationRules.password,
    confirmPassword: { required: true, match: 'password' },
    age: { min: 18, max: 100 }
  };

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validationRules,
        validateOnChange: false,
        validateOnBlur: false
      })
    );

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isValid).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should validate required fields', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validationRules,
        validateOnChange: true
      })
    );

    act(() => {
      result.current.setValue('username', '');
    });

    expect(result.current.errors.username).toBe('此欄位為必填項目');
    expect(result.current.isValid).toBe(false);
  });

  it('should validate minimum length', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validationRules,
        validateOnChange: true
      })
    );

    act(() => {
      result.current.setValue('username', 'ab');
    });

    expect(result.current.errors.username).toBe('至少需要 3 個字元');
  });

  it('should validate maximum length', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validationRules,
        validateOnChange: true
      })
    );

    act(() => {
      result.current.setValue('username', 'a'.repeat(21));
    });

    expect(result.current.errors.username).toBe('不能超過 20 個字元');
  });

  it('should validate email format', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validationRules,
        validateOnChange: true
      })
    );

    act(() => {
      result.current.setValue('email', 'invalid-email');
    });

    expect(result.current.errors.email).toBe('請輸入有效的電子郵件格式');

    act(() => {
      result.current.setValue('email', 'valid@example.com');
    });

    expect(result.current.errors.email).toBeUndefined();
  });

  it('should validate password confirmation match', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validationRules,
        validateOnChange: true
      })
    );

    act(() => {
      result.current.setValue('password', 'password123');
      result.current.setValue('confirmPassword', 'different');
    });

    expect(result.current.errors.confirmPassword).toBe('輸入不匹配');

    act(() => {
      result.current.setValue('confirmPassword', 'password123');
    });

    expect(result.current.errors.confirmPassword).toBeUndefined();
  });

  it('should validate numeric ranges', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validationRules,
        validateOnChange: true
      })
    );

    act(() => {
      result.current.setValue('age', '17');
    });

    expect(result.current.errors.age).toBe('值不能小於 18');

    act(() => {
      result.current.setValue('age', '101');
    });

    expect(result.current.errors.age).toBe('值不能大於 100');

    act(() => {
      result.current.setValue('age', '25');
    });

    expect(result.current.errors.age).toBeUndefined();
  });

  it('should clear errors when field becomes valid', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validationRules,
        validateOnChange: true
      })
    );

    act(() => {
      result.current.setValue('username', 'ab');
    });

    expect(result.current.errors.username).toBe('至少需要 3 個字元');

    act(() => {
      result.current.setValue('username', 'validusername');
    });

    expect(result.current.errors.username).toBeUndefined();
  });

  it('should handle form submission', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validationRules,
        onSubmit
      })
    );

    // Fill form with valid data
    act(() => {
      result.current.setValue('username', 'testuser');
      result.current.setValue('email', 'test@example.com');
      result.current.setValue('password', 'password123');
      result.current.setValue('confirmPassword', 'password123');
      result.current.setValue('age', '25');
    });

    await act(async () => {
      const isValid = await result.current.handleSubmit();
      expect(isValid).toBe(true);
    });

    expect(onSubmit).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      age: '25'
    });
  });

  it('should not submit invalid form', async () => {
    const onSubmit = vi.fn();
    
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validationRules,
        onSubmit
      })
    );

    await act(async () => {
      const isValid = await result.current.handleSubmit();
      expect(isValid).toBe(false);
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
  });

  it('should handle blur validation', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validationRules,
        validateOnChange: false,
        validateOnBlur: true
      })
    );

    act(() => {
      result.current.setValue('username', 'ab');
    });

    // No error yet because validateOnChange is false
    expect(result.current.errors.username).toBeUndefined();

    act(() => {
      result.current.handleBlur('username');
    });

    // Error appears after blur
    expect(result.current.errors.username).toBe('至少需要 3 個字元');
  });

  it('should reset form', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validationRules
      })
    );

    act(() => {
      result.current.setValue('username', 'testuser');
      result.current.setValue('email', 'invalid-email');
    });

    expect(result.current.values.username).toBe('testuser');
    expect(result.current.errors.email).toBeDefined();

    act(() => {
      result.current.reset();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  it('should provide field props', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validationRules
      })
    );

    const fieldProps = result.current.getFieldProps('username');

    expect(fieldProps).toHaveProperty('value');
    expect(fieldProps).toHaveProperty('onChange');
    expect(fieldProps).toHaveProperty('onBlur');
    expect(fieldProps).toHaveProperty('className');
    expect(fieldProps).toHaveProperty('aria-invalid');
  });

  it('should handle custom validation', () => {
    const customRules = {
      username: {
        required: true,
        custom: (value: string) => {
          if (value && value.includes('admin')) {
            return '使用者名稱不能包含 "admin"';
          }
          return null;
        }
      }
    };

    const { result } = renderHook(() =>
      useFormValidation({
        initialValues: { username: '' },
        validationRules: customRules,
        validateOnChange: true
      })
    );

    act(() => {
      result.current.setValue('username', 'adminuser');
    });

    expect(result.current.errors.username).toBe('使用者名稱不能包含 "admin"');
  });

  it('should validate all fields on form submission', async () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validationRules,
        validateOnChange: false
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    // All required fields should have errors
    expect(result.current.errors.username).toBeDefined();
    expect(result.current.errors.email).toBeDefined();
    expect(result.current.errors.password).toBeDefined();
    expect(result.current.errors.confirmPassword).toBeDefined();

    // All fields should be marked as touched
    expect(result.current.touched.username).toBe(true);
    expect(result.current.touched.email).toBe(true);
    expect(result.current.touched.password).toBe(true);
    expect(result.current.touched.confirmPassword).toBe(true);
  });

  it('should handle async submission errors', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
    
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validationRules,
        onSubmit
      })
    );

    // Fill form with valid data
    act(() => {
      result.current.setValue('username', 'testuser');
      result.current.setValue('email', 'test@example.com');
      result.current.setValue('password', 'password123');
      result.current.setValue('confirmPassword', 'password123');
      result.current.setValue('age', '25');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.isSubmitting).toBe(false);
  });
});