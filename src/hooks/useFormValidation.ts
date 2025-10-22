import { useState, useCallback, useEffect } from 'react';

// 驗證規則類型
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  custom?: (value: any, allValues?: any) => string | null;
  match?: string; // 用於密碼確認等場景
}

// 驗證規則集合
export interface ValidationRules {
  [fieldName: string]: ValidationRule;
}

// 表單錯誤
export interface FormErrors {
  [fieldName: string]: string;
}

// 表單狀態
export interface FormState<T> {
  values: T;
  errors: FormErrors;
  touched: { [K in keyof T]?: boolean };
  isValid: boolean;
  isSubmitting: boolean;
}

// Hook 選項
export interface UseFormValidationOptions<T> {
  initialValues: T;
  validationRules: ValidationRules;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit?: (values: T) => Promise<void> | void;
}

// 預定義的驗證規則
export const commonValidationRules = {
  required: { required: true },
  email: { required: true, email: true },
  password: { required: true, minLength: 6 },
  username: { required: true, minLength: 3, maxLength: 50 },
  phone: { 
    required: true, 
    pattern: /^(\+886|0)?[2-9]\d{7,8}$/ 
  },
  url: { url: true },
  positiveNumber: { min: 0 },
  price: { min: 0, max: 999999.99 },
  quantity: { min: 0, max: 999999 }
};

// 內建驗證函數
const validateField = (value: any, rule: ValidationRule, allValues?: any): string | null => {
  // 必填驗證
  if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return '此欄位為必填項目';
  }

  // 如果值為空且不是必填，跳過其他驗證
  if (!value || (typeof value === 'string' && !value.trim())) {
    return null;
  }

  const stringValue = String(value);

  // 最小長度驗證
  if (rule.minLength && stringValue.length < rule.minLength) {
    return `至少需要 ${rule.minLength} 個字元`;
  }

  // 最大長度驗證
  if (rule.maxLength && stringValue.length > rule.maxLength) {
    return `不能超過 ${rule.maxLength} 個字元`;
  }

  // 數值範圍驗證
  if (typeof value === 'number' || !isNaN(Number(value))) {
    const numValue = Number(value);
    
    if (rule.min !== undefined && numValue < rule.min) {
      return `值不能小於 ${rule.min}`;
    }
    
    if (rule.max !== undefined && numValue > rule.max) {
      return `值不能大於 ${rule.max}`;
    }
  }

  // 正則表達式驗證
  if (rule.pattern && !rule.pattern.test(stringValue)) {
    return '格式不正確';
  }

  // 電子郵件驗證
  if (rule.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(stringValue)) {
      return '請輸入有效的電子郵件格式';
    }
  }

  // URL 驗證
  if (rule.url) {
    try {
      new URL(stringValue);
    } catch {
      return '請輸入有效的 URL 格式';
    }
  }

  // 匹配驗證（如密碼確認）
  if (rule.match && allValues && stringValue !== allValues[rule.match]) {
    return '輸入不匹配';
  }

  // 自定義驗證
  if (rule.custom) {
    return rule.custom(value, allValues);
  }

  return null;
};

export const useFormValidation = <T extends Record<string, any>>({
  initialValues,
  validationRules,
  validateOnChange = true,
  validateOnBlur = true,
  onSubmit
}: UseFormValidationOptions<T>) => {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isValid: false,
    isSubmitting: false
  });

  // 驗證單個欄位
  const validateSingleField = useCallback((fieldName: keyof T, value: any, allValues: T): string | null => {
    const rule = validationRules[fieldName as string];
    if (!rule) return null;

    return validateField(value, rule, allValues);
  }, [validationRules]);

  // 驗證所有欄位
  const validateAllFields = useCallback((values: T): FormErrors => {
    const errors: FormErrors = {};

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateSingleField(fieldName, values[fieldName], values);
      if (error) {
        errors[fieldName] = error;
      }
    });

    return errors;
  }, [validationRules, validateSingleField]);

  // 更新表單狀態
  const updateState = useCallback((updates: Partial<FormState<T>>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      
      // 計算是否有效
      if (updates.errors !== undefined) {
        newState.isValid = Object.keys(updates.errors).length === 0;
      }
      
      return newState;
    });
  }, []);

  // 設置欄位值
  const setValue = useCallback((fieldName: keyof T, value: any) => {
    const newValues = { ...state.values, [fieldName]: value };
    const newTouched = { ...state.touched, [fieldName]: true };
    
    let newErrors = { ...state.errors };
    
    if (validateOnChange) {
      const error = validateSingleField(fieldName, value, newValues);
      if (error) {
        newErrors[fieldName as string] = error;
      } else {
        delete newErrors[fieldName as string];
      }
    }

    updateState({
      values: newValues,
      touched: newTouched,
      errors: newErrors
    });
  }, [state.values, state.touched, state.errors, validateOnChange, validateSingleField, updateState]);

  // 設置欄位錯誤
  const setFieldError = useCallback((fieldName: keyof T, error: string | null) => {
    const newErrors = { ...state.errors };
    
    if (error) {
      newErrors[fieldName as string] = error;
    } else {
      delete newErrors[fieldName as string];
    }

    updateState({ errors: newErrors });
  }, [state.errors, updateState]);

  // 清除欄位錯誤
  const clearFieldError = useCallback((fieldName: keyof T) => {
    setFieldError(fieldName, null);
  }, [setFieldError]);

  // 處理欄位失焦
  const handleBlur = useCallback((fieldName: keyof T) => {
    const newTouched = { ...state.touched, [fieldName]: true };
    
    let newErrors = { ...state.errors };
    
    if (validateOnBlur) {
      const error = validateSingleField(fieldName, state.values[fieldName], state.values);
      if (error) {
        newErrors[fieldName as string] = error;
      } else {
        delete newErrors[fieldName as string];
      }
    }

    updateState({
      touched: newTouched,
      errors: newErrors
    });
  }, [state.touched, state.errors, state.values, validateOnBlur, validateSingleField, updateState]);

  // 重置表單
  const reset = useCallback((newInitialValues?: T) => {
    const values = newInitialValues || initialValues;
    setState({
      values,
      errors: {},
      touched: {},
      isValid: Object.keys(validateAllFields(values)).length === 0,
      isSubmitting: false
    });
  }, [initialValues, validateAllFields]);

  // 提交表單
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // 驗證所有欄位
    const errors = validateAllFields(state.values);
    const isValid = Object.keys(errors).length === 0;

    // 標記所有欄位為已觸碰
    const allTouched = Object.keys(state.values).reduce((acc, key) => {
      (acc as any)[key] = true;
      return acc;
    }, {} as { [K in keyof T]?: boolean });

    updateState({
      errors,
      touched: allTouched,
      isValid,
      isSubmitting: isValid
    });

    if (isValid && onSubmit) {
      try {
        await onSubmit(state.values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        updateState({ isSubmitting: false });
      }
    }

    return isValid;
  }, [state.values, validateAllFields, updateState, onSubmit]);

  // 獲取欄位屬性
  const getFieldProps = useCallback((fieldName: keyof T) => ({
    value: state.values[fieldName] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setValue(fieldName, e.target.value);
    },
    onBlur: () => handleBlur(fieldName),
    className: state.errors[fieldName as string] ? 'error' : '',
    'aria-invalid': !!state.errors[fieldName as string],
    'aria-describedby': state.errors[fieldName as string] ? `${String(fieldName)}-error` : undefined
  }), [state.values, state.errors, setValue, handleBlur]);

  // 獲取欄位錯誤屬性
  const getFieldErrorProps = useCallback((fieldName: keyof T) => ({
    id: `${String(fieldName)}-error`,
    className: 'error-text',
    role: 'alert'
  }), []);

  // 檢查欄位是否有錯誤
  const hasFieldError = useCallback((fieldName: keyof T): boolean => {
    return !!state.errors[fieldName as string] && !!state.touched[fieldName];
  }, [state.errors, state.touched]);

  // 獲取欄位錯誤訊息
  const getFieldError = useCallback((fieldName: keyof T): string | undefined => {
    return hasFieldError(fieldName) ? state.errors[fieldName as string] : undefined;
  }, [hasFieldError, state.errors]);

  // 初始驗證
  useEffect(() => {
    const errors = validateAllFields(state.values);
    const isValid = Object.keys(errors).length === 0;
    
    if (state.isValid !== isValid) {
      updateState({ isValid });
    }
  }, [state.values, state.isValid, validateAllFields, updateState]);

  return {
    // 狀態
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isValid: state.isValid,
    isSubmitting: state.isSubmitting,

    // 方法
    setValue,
    setFieldError,
    clearFieldError,
    handleBlur,
    handleSubmit,
    reset,

    // 輔助方法
    getFieldProps,
    getFieldErrorProps,
    hasFieldError,
    getFieldError,

    // 驗證方法
    validateField: (fieldName: keyof T) => {
      const error = validateSingleField(fieldName, state.values[fieldName], state.values);
      if (error) {
        setFieldError(fieldName, error);
      } else {
        clearFieldError(fieldName);
      }
      return !error;
    },
    
    validateForm: () => {
      const errors = validateAllFields(state.values);
      updateState({ errors });
      return Object.keys(errors).length === 0;
    }
  };
};