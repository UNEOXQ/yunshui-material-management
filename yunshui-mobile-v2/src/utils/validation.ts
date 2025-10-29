export class ValidationService {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateRequired(value: string): boolean {
    return value.trim().length > 0;
  }

  static validateMinLength(value: string, minLength: number): boolean {
    return value.length >= minLength;
  }

  static validateMaxLength(value: string, maxLength: number): boolean {
    return value.length <= maxLength;
  }

  static validateNumeric(value: string): boolean {
    return !isNaN(Number(value)) && value.trim() !== '';
  }

  static validatePositiveNumber(value: string): boolean {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  }

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^[\d\-\+\(\)\s]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
  }

  static getErrorMessage(field: string, rule: string, params?: any): string {
    const messages: { [key: string]: string } = {
      required: `${field}為必填欄位`,
      email: `${field}格式不正確`,
      minLength: `${field}至少需要${params}個字元`,
      maxLength: `${field}不能超過${params}個字元`,
      numeric: `${field}必須為數字`,
      positiveNumber: `${field}必須為正數`,
      phone: `${field}格式不正確`,
    };
    
    return messages[rule] || `${field}驗證失敗`;
  }
}