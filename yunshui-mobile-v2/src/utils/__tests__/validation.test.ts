import { ValidationService } from '../validation';

describe('ValidationService', () => {
  describe('validateEmail', () => {
    it('should return true for valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(ValidationService.validateEmail(email)).toBe(true);
      });
    });

    it('should return false for invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        '',
        'user name@example.com',
      ];

      invalidEmails.forEach(email => {
        expect(ValidationService.validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validateRequired', () => {
    it('should return true for non-empty strings', () => {
      expect(ValidationService.validateRequired('test')).toBe(true);
      expect(ValidationService.validateRequired('  test  ')).toBe(true);
      expect(ValidationService.validateRequired('123')).toBe(true);
    });

    it('should return false for empty or whitespace-only strings', () => {
      expect(ValidationService.validateRequired('')).toBe(false);
      expect(ValidationService.validateRequired('   ')).toBe(false);
      expect(ValidationService.validateRequired('\t\n')).toBe(false);
    });
  });

  describe('validateMinLength', () => {
    it('should return true when string meets minimum length', () => {
      expect(ValidationService.validateMinLength('test', 4)).toBe(true);
      expect(ValidationService.validateMinLength('testing', 4)).toBe(true);
      expect(ValidationService.validateMinLength('12345', 3)).toBe(true);
    });

    it('should return false when string is shorter than minimum length', () => {
      expect(ValidationService.validateMinLength('hi', 4)).toBe(false);
      expect(ValidationService.validateMinLength('', 1)).toBe(false);
      expect(ValidationService.validateMinLength('12', 5)).toBe(false);
    });
  });

  describe('validateMaxLength', () => {
    it('should return true when string is within maximum length', () => {
      expect(ValidationService.validateMaxLength('test', 10)).toBe(true);
      expect(ValidationService.validateMaxLength('hi', 5)).toBe(true);
      expect(ValidationService.validateMaxLength('', 10)).toBe(true);
    });

    it('should return false when string exceeds maximum length', () => {
      expect(ValidationService.validateMaxLength('testing', 4)).toBe(false);
      expect(ValidationService.validateMaxLength('12345', 3)).toBe(false);
    });
  });

  describe('validateNumeric', () => {
    it('should return true for valid numbers', () => {
      const validNumbers = ['123', '0', '123.45', '-123', '0.1'];

      validNumbers.forEach(num => {
        expect(ValidationService.validateNumeric(num)).toBe(true);
      });
    });

    it('should return false for non-numeric values', () => {
      const invalidNumbers = ['abc', '12a', '', '  '];

      invalidNumbers.forEach(num => {
        expect(ValidationService.validateNumeric(num)).toBe(false);
      });
    });
  });

  describe('validatePositiveNumber', () => {
    it('should return true for positive numbers', () => {
      const positiveNumbers = ['1', '123', '0.1', '999.99'];

      positiveNumbers.forEach(num => {
        expect(ValidationService.validatePositiveNumber(num)).toBe(true);
      });
    });

    it('should return false for non-positive numbers', () => {
      const nonPositiveNumbers = ['0', '-1', '-123.45', 'abc', ''];

      nonPositiveNumbers.forEach(num => {
        expect(ValidationService.validatePositiveNumber(num)).toBe(false);
      });
    });
  });

  describe('validatePhone', () => {
    it('should return true for valid phone numbers', () => {
      const validPhones = [
        '0912345678',
        '+886-912-345-678',
        '(02) 1234-5678',
        '02-12345678',
        '+1 (555) 123-4567',
      ];

      validPhones.forEach(phone => {
        expect(ValidationService.validatePhone(phone)).toBe(true);
      });
    });

    it('should return false for invalid phone numbers', () => {
      const invalidPhones = [
        'abc',
        '123',
        '1234567', // too short
        '',
        'phone number',
      ];

      invalidPhones.forEach(phone => {
        expect(ValidationService.validatePhone(phone)).toBe(false);
      });
    });
  });

  describe('getErrorMessage', () => {
    it('should return correct error messages for different validation rules', () => {
      expect(ValidationService.getErrorMessage('電子郵件', 'required'))
        .toBe('電子郵件為必填欄位');
      
      expect(ValidationService.getErrorMessage('電子郵件', 'email'))
        .toBe('電子郵件格式不正確');
      
      expect(ValidationService.getErrorMessage('密碼', 'minLength', 8))
        .toBe('密碼至少需要8個字元');
      
      expect(ValidationService.getErrorMessage('姓名', 'maxLength', 50))
        .toBe('姓名不能超過50個字元');
      
      expect(ValidationService.getErrorMessage('價格', 'numeric'))
        .toBe('價格必須為數字');
      
      expect(ValidationService.getErrorMessage('數量', 'positiveNumber'))
        .toBe('數量必須為正數');
      
      expect(ValidationService.getErrorMessage('電話', 'phone'))
        .toBe('電話格式不正確');
    });

    it('should return default error message for unknown rules', () => {
      expect(ValidationService.getErrorMessage('欄位', 'unknownRule'))
        .toBe('欄位驗證失敗');
    });
  });
});