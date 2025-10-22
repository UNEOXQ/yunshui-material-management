import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidTaiwanPhone,
  isValidUrl,
  validatePasswordStrength,
  isValidTaiwanId,
  isValidTaiwanBusinessId,
  isValidCreditCard,
  isValidDate,
  isValidAge,
  isValidFileType,
  isValidFileSize,
  sanitizeInput,
  isValidJson,
  isValidIpAddress,
  isValidHexColor,
  isInRange,
  isValidLength,
  isAlphabetic,
  isNumeric,
  isAlphanumeric,
  isChinese,
  FormValidator,
  validators
} from './validation';

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test..test@example.com')).toBe(false);
    });
  });

  describe('isValidTaiwanPhone', () => {
    it('should validate Taiwan phone numbers', () => {
      expect(isValidTaiwanPhone('0912345678')).toBe(true);
      expect(isValidTaiwanPhone('+886912345678')).toBe(true);
      expect(isValidTaiwanPhone('0223456789')).toBe(true);
    });

    it('should reject invalid Taiwan phone numbers', () => {
      expect(isValidTaiwanPhone('091234567')).toBe(false);
      expect(isValidTaiwanPhone('0112345678')).toBe(false);
      expect(isValidTaiwanPhone('123456789')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('://example.com')).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong passwords', () => {
      const result = validatePasswordStrength('StrongP@ssw0rd');
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(4);
    });

    it('should reject weak passwords', () => {
      const result = validatePasswordStrength('123');
      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('密碼至少需要6個字元');
    });

    it('should provide feedback for password improvement', () => {
      const result = validatePasswordStrength('password');
      expect(result.feedback).toContain('建議包含大寫字母');
      expect(result.feedback).toContain('建議包含數字');
      expect(result.feedback).toContain('建議包含特殊字元');
    });
  });

  describe('isValidTaiwanId', () => {
    it('should validate correct Taiwan ID numbers', () => {
      expect(isValidTaiwanId('A123456789')).toBe(true);
      expect(isValidTaiwanId('B234567890')).toBe(true);
    });

    it('should reject invalid Taiwan ID numbers', () => {
      expect(isValidTaiwanId('A123456788')).toBe(false);
      expect(isValidTaiwanId('123456789')).toBe(false);
      expect(isValidTaiwanId('A12345678')).toBe(false);
    });
  });

  describe('isValidTaiwanBusinessId', () => {
    it('should validate correct Taiwan business ID numbers', () => {
      expect(isValidTaiwanBusinessId('12345675')).toBe(true);
      expect(isValidTaiwanBusinessId('53212539')).toBe(true);
    });

    it('should reject invalid Taiwan business ID numbers', () => {
      expect(isValidTaiwanBusinessId('12345678')).toBe(false);
      expect(isValidTaiwanBusinessId('1234567')).toBe(false);
      expect(isValidTaiwanBusinessId('abcd1234')).toBe(false);
    });
  });

  describe('isValidCreditCard', () => {
    it('should validate correct credit card numbers', () => {
      expect(isValidCreditCard('4111111111111111')).toBe(true);
      expect(isValidCreditCard('5555555555554444')).toBe(true);
      expect(isValidCreditCard('4111 1111 1111 1111')).toBe(true);
    });

    it('should reject invalid credit card numbers', () => {
      expect(isValidCreditCard('4111111111111112')).toBe(false);
      expect(isValidCreditCard('123')).toBe(false);
      expect(isValidCreditCard('abcd1234')).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should validate correct dates', () => {
      expect(isValidDate('2023-12-25')).toBe(true);
      expect(isValidDate('25/12/2023', 'DD/MM/YYYY')).toBe(true);
      expect(isValidDate('12/25/2023', 'MM/DD/YYYY')).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(isValidDate('2023-13-25')).toBe(false);
      expect(isValidDate('2023-02-30')).toBe(false);
      expect(isValidDate('invalid-date')).toBe(false);
    });
  });

  describe('isValidAge', () => {
    it('should validate correct ages', () => {
      const twentyYearsAgo = new Date();
      twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
      
      expect(isValidAge(twentyYearsAgo, 18, 65)).toBe(true);
    });

    it('should reject invalid ages', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      expect(isValidAge(futureDate)).toBe(false);
      
      const tooYoung = new Date();
      tooYoung.setFullYear(tooYoung.getFullYear() - 10);
      
      expect(isValidAge(tooYoung, 18, 65)).toBe(false);
    });
  });

  describe('isValidFileType', () => {
    it('should validate correct file types', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(isValidFileType(file, ['image/jpeg', 'image/png'])).toBe(true);
    });

    it('should reject invalid file types', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(isValidFileType(file, ['image/jpeg', 'image/png'])).toBe(false);
    });
  });

  describe('isValidFileSize', () => {
    it('should validate correct file sizes', () => {
      const smallFile = new File(['x'.repeat(1024)], 'test.txt');
      expect(isValidFileSize(smallFile, 1)).toBe(true);
    });

    it('should reject oversized files', () => {
      const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'test.txt');
      expect(isValidFileSize(largeFile, 1)).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should clean and format input', () => {
      expect(sanitizeInput('  hello   world  ')).toBe('hello world');
      expect(sanitizeInput('\t\ntest\t\n')).toBe('test');
    });
  });

  describe('isValidJson', () => {
    it('should validate correct JSON', () => {
      expect(isValidJson('{"key": "value"}')).toBe(true);
      expect(isValidJson('[1, 2, 3]')).toBe(true);
    });

    it('should reject invalid JSON', () => {
      expect(isValidJson('{key: value}')).toBe(false);
      expect(isValidJson('invalid json')).toBe(false);
    });
  });

  describe('isValidIpAddress', () => {
    it('should validate IPv4 addresses', () => {
      expect(isValidIpAddress('192.168.1.1')).toBe(true);
      expect(isValidIpAddress('127.0.0.1')).toBe(true);
    });

    it('should validate IPv6 addresses', () => {
      expect(isValidIpAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    });

    it('should reject invalid IP addresses', () => {
      expect(isValidIpAddress('256.256.256.256')).toBe(false);
      expect(isValidIpAddress('not-an-ip')).toBe(false);
    });
  });

  describe('isValidHexColor', () => {
    it('should validate hex colors', () => {
      expect(isValidHexColor('#FF0000')).toBe(true);
      expect(isValidHexColor('#f00')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('FF0000')).toBe(false);
      expect(isValidHexColor('#GG0000')).toBe(false);
    });
  });

  describe('isInRange', () => {
    it('should validate numbers in range', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true);
      expect(isInRange(10, 1, 10)).toBe(true);
    });

    it('should reject numbers out of range', () => {
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
    });
  });

  describe('isValidLength', () => {
    it('should validate string length', () => {
      expect(isValidLength('hello', 3, 10)).toBe(true);
      expect(isValidLength('hi', 2, 5)).toBe(true);
    });

    it('should reject invalid string length', () => {
      expect(isValidLength('hi', 3, 10)).toBe(false);
      expect(isValidLength('very long string', 1, 5)).toBe(false);
    });
  });

  describe('isAlphabetic', () => {
    it('should validate alphabetic strings', () => {
      expect(isAlphabetic('hello')).toBe(true);
      expect(isAlphabetic('ABC')).toBe(true);
    });

    it('should reject non-alphabetic strings', () => {
      expect(isAlphabetic('hello123')).toBe(false);
      expect(isAlphabetic('hello world')).toBe(false);
    });
  });

  describe('isNumeric', () => {
    it('should validate numeric strings', () => {
      expect(isNumeric('123')).toBe(true);
      expect(isNumeric('0')).toBe(true);
    });

    it('should reject non-numeric strings', () => {
      expect(isNumeric('123abc')).toBe(false);
      expect(isNumeric('12.34')).toBe(false);
    });
  });

  describe('isAlphanumeric', () => {
    it('should validate alphanumeric strings', () => {
      expect(isAlphanumeric('hello123')).toBe(true);
      expect(isAlphanumeric('ABC123')).toBe(true);
    });

    it('should reject non-alphanumeric strings', () => {
      expect(isAlphanumeric('hello-123')).toBe(false);
      expect(isAlphanumeric('hello 123')).toBe(false);
    });
  });

  describe('isChinese', () => {
    it('should validate Chinese characters', () => {
      expect(isChinese('你好')).toBe(true);
      expect(isChinese('測試')).toBe(true);
    });

    it('should reject non-Chinese characters', () => {
      expect(isChinese('hello')).toBe(false);
      expect(isChinese('你好hello')).toBe(false);
    });
  });

  describe('FormValidator', () => {
    it('should validate form data', () => {
      const validator = new FormValidator()
        .addRule('username', validators.required())
        .addRule('username', validators.minLength(3))
        .addRule('email', validators.email());

      const validData = {
        username: 'testuser',
        email: 'test@example.com'
      };

      const invalidData = {
        username: 'ab',
        email: 'invalid-email'
      };

      expect(validator.isValid(validData)).toBe(true);
      expect(validator.isValid(invalidData)).toBe(false);

      const errors = validator.validate(invalidData);
      expect(errors.username).toBe('至少需要 3 個字元');
      expect(errors.email).toBe('請輸入有效的電子郵件格式');
    });
  });

  describe('validators', () => {
    it('should create required validator', () => {
      const validator = validators.required('Custom message');
      
      expect(validator('')).toBe('Custom message');
      expect(validator('value')).toBe(null);
    });

    it('should create minLength validator', () => {
      const validator = validators.minLength(5);
      
      expect(validator('abc')).toBe('至少需要 5 個字元');
      expect(validator('abcdef')).toBe(null);
    });

    it('should create maxLength validator', () => {
      const validator = validators.maxLength(5);
      
      expect(validator('abcdef')).toBe('不能超過 5 個字元');
      expect(validator('abc')).toBe(null);
    });

    it('should create email validator', () => {
      const validator = validators.email();
      
      expect(validator('invalid')).toBe('請輸入有效的電子郵件格式');
      expect(validator('test@example.com')).toBe(null);
    });

    it('should create pattern validator', () => {
      const validator = validators.pattern(/^\d+$/, '只能包含數字');
      
      expect(validator('abc')).toBe('只能包含數字');
      expect(validator('123')).toBe(null);
    });

    it('should create min validator', () => {
      const validator = validators.min(10);
      
      expect(validator(5)).toBe('值不能小於 10');
      expect(validator(15)).toBe(null);
    });

    it('should create max validator', () => {
      const validator = validators.max(10);
      
      expect(validator(15)).toBe('值不能大於 10');
      expect(validator(5)).toBe(null);
    });
  });
});