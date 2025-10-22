// 通用驗證工具函數

/**
 * 驗證電子郵件格式
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 驗證台灣手機號碼
 */
export const isValidTaiwanPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+886|0)?[2-9]\d{7,8}$/;
  return phoneRegex.test(phone);
};

/**
 * 驗證 URL 格式
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 驗證密碼強度
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 6) {
    feedback.push('密碼至少需要6個字元');
  } else {
    score += 1;
  }

  if (password.length >= 8) {
    score += 1;
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('建議包含小寫字母');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('建議包含大寫字母');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('建議包含數字');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('建議包含特殊字元');
  }

  const isValid = password.length >= 6;

  return { isValid, score, feedback };
};

/**
 * 驗證身分證字號（台灣）
 */
export const isValidTaiwanId = (id: string): boolean => {
  if (!/^[A-Z][12]\d{8}$/.test(id)) {
    return false;
  }

  const letterMap: { [key: string]: number } = {
    A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 34, J: 18,
    K: 19, L: 20, M: 21, N: 22, O: 35, P: 23, Q: 24, R: 25, S: 26, T: 27,
    U: 28, V: 29, W: 32, X: 30, Y: 31, Z: 33
  };

  const firstLetter = id.charAt(0);
  const letterValue = letterMap[firstLetter];
  
  let sum = Math.floor(letterValue / 10) + (letterValue % 10) * 9;
  
  for (let i = 1; i < 9; i++) {
    sum += parseInt(id.charAt(i)) * (9 - i);
  }
  
  sum += parseInt(id.charAt(9));
  
  return sum % 10 === 0;
};

/**
 * 驗證統一編號（台灣）
 */
export const isValidTaiwanBusinessId = (id: string): boolean => {
  if (!/^\d{8}$/.test(id)) {
    return false;
  }

  const weights = [1, 2, 1, 2, 1, 2, 4, 1];
  let sum = 0;

  for (let i = 0; i < 8; i++) {
    let product = parseInt(id.charAt(i)) * weights[i];
    sum += Math.floor(product / 10) + (product % 10);
  }

  return sum % 10 === 0 || (sum % 10 === 9 && id.charAt(6) === '7');
};

/**
 * 驗證信用卡號碼（Luhn 算法）
 */
export const isValidCreditCard = (cardNumber: string): boolean => {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  if (!/^\d+$/.test(cleanNumber) || cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i));

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * 驗證日期格式和有效性
 */
export const isValidDate = (dateString: string, format: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' = 'YYYY-MM-DD'): boolean => {
  let regex: RegExp;
  let dayIndex: number, monthIndex: number, yearIndex: number;

  switch (format) {
    case 'DD/MM/YYYY':
      regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      dayIndex = 1;
      monthIndex = 2;
      yearIndex = 3;
      break;
    case 'MM/DD/YYYY':
      regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      dayIndex = 2;
      monthIndex = 1;
      yearIndex = 3;
      break;
    default:
      regex = /^(\d{4})-(\d{2})-(\d{2})$/;
      yearIndex = 1;
      monthIndex = 2;
      dayIndex = 3;
  }

  const match = dateString.match(regex);
  if (!match) {
    return false;
  }

  const year = parseInt(match[yearIndex]);
  const month = parseInt(match[monthIndex]);
  const day = parseInt(match[dayIndex]);

  const date = new Date(year, month - 1, day);
  
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day;
};

/**
 * 驗證年齡範圍
 */
export const isValidAge = (birthDate: string | Date, minAge: number = 0, maxAge: number = 150): boolean => {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  
  if (birth > today) {
    return false;
  }

  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) 
    ? age - 1 
    : age;

  return actualAge >= minAge && actualAge <= maxAge;
};

/**
 * 驗證檔案類型
 */
export const isValidFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * 驗證檔案大小
 */
export const isValidFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

/**
 * 驗證圖片尺寸
 */
export const validateImageDimensions = (file: File, maxWidth: number, maxHeight: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.width <= maxWidth && img.height <= maxHeight);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    
    img.src = url;
  });
};

/**
 * 清理和格式化輸入
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

/**
 * 驗證 JSON 格式
 */
export const isValidJson = (jsonString: string): boolean => {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
};

/**
 * 驗證 IP 地址
 */
export const isValidIpAddress = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

/**
 * 驗證顏色代碼（HEX）
 */
export const isValidHexColor = (color: string): boolean => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
};

/**
 * 驗證數字範圍
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * 驗證字串長度
 */
export const isValidLength = (str: string, minLength: number, maxLength: number): boolean => {
  return str.length >= minLength && str.length <= maxLength;
};

/**
 * 驗證是否只包含字母
 */
export const isAlphabetic = (str: string): boolean => {
  return /^[a-zA-Z]+$/.test(str);
};

/**
 * 驗證是否只包含數字
 */
export const isNumeric = (str: string): boolean => {
  return /^\d+$/.test(str);
};

/**
 * 驗證是否只包含字母和數字
 */
export const isAlphanumeric = (str: string): boolean => {
  return /^[a-zA-Z0-9]+$/.test(str);
};

/**
 * 驗證中文字符
 */
export const isChinese = (str: string): boolean => {
  return /^[\u4e00-\u9fa5]+$/.test(str);
};

/**
 * 綜合表單驗證器
 */
export class FormValidator {
  private rules: { [field: string]: Array<(value: any) => string | null> } = {};

  addRule(field: string, validator: (value: any) => string | null): this {
    if (!this.rules[field]) {
      this.rules[field] = [];
    }
    this.rules[field].push(validator);
    return this;
  }

  validate(data: { [field: string]: any }): { [field: string]: string } {
    const errors: { [field: string]: string } = {};

    Object.keys(this.rules).forEach(field => {
      const value = data[field];
      const fieldRules = this.rules[field];

      for (const rule of fieldRules) {
        const error = rule(value);
        if (error) {
          errors[field] = error;
          break; // 只顯示第一個錯誤
        }
      }
    });

    return errors;
  }

  isValid(data: { [field: string]: any }): boolean {
    const errors = this.validate(data);
    return Object.keys(errors).length === 0;
  }
}

// 常用驗證器工廠函數
export const validators = {
  required: (message = '此欄位為必填項目') => (value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message;
    }
    return null;
  },

  minLength: (min: number, message?: string) => (value: string) => {
    if (value && value.length < min) {
      return message || `至少需要 ${min} 個字元`;
    }
    return null;
  },

  maxLength: (max: number, message?: string) => (value: string) => {
    if (value && value.length > max) {
      return message || `不能超過 ${max} 個字元`;
    }
    return null;
  },

  email: (message = '請輸入有效的電子郵件格式') => (value: string) => {
    if (value && !isValidEmail(value)) {
      return message;
    }
    return null;
  },

  pattern: (regex: RegExp, message = '格式不正確') => (value: string) => {
    if (value && !regex.test(value)) {
      return message;
    }
    return null;
  },

  min: (min: number, message?: string) => (value: number) => {
    if (value != null && value < min) {
      return message || `值不能小於 ${min}`;
    }
    return null;
  },

  max: (max: number, message?: string) => (value: number) => {
    if (value != null && value > max) {
      return message || `值不能大於 ${max}`;
    }
    return null;
  }
};