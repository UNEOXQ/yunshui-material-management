import { SecurityService, EncryptedData, SecurityMetrics } from '../securityService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

// Mock Keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(),
  getInternetCredentials: jest.fn(),
  resetInternetCredentials: jest.fn(),
  getSupportedBiometryType: jest.fn(),
  ACCESS_CONTROL: {
    BIOMETRY_ANY: 'BIOMETRY_ANY',
  },
  BIOMETRY_TYPE: {
    FACE_ID: 'FACE_ID',
    TOUCH_ID: 'TOUCH_ID',
    NONE: 'NONE',
  },
}));

// Mock Expo Crypto
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(() => Promise.resolve('mocked-hash-value')),
  getRandomBytesAsync: jest.fn(() => Promise.resolve(new Uint8Array(32).fill(1))),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
}));

// Mock Device Info
jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn(() => Promise.resolve('mock-device-id')),
  getSystemName: jest.fn(() => 'iOS'),
  getSystemVersion: jest.fn(() => '14.0'),
  getBrand: jest.fn(() => 'Apple'),
  getModel: jest.fn(() => 'iPhone'),
  getBundleId: jest.fn(() => 'com.yunshui.mobile'),
  getBuildNumber: jest.fn(() => '1'),
  getVersion: jest.fn(() => '1.0.0'),
  isEmulator: jest.fn(() => Promise.resolve(false)),
}));

describe('SecurityService', () => {
  let securityService: SecurityService;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  const mockKeychain = require('react-native-keychain');

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    
    mockKeychain.setInternetCredentials.mockResolvedValue();
    mockKeychain.getInternetCredentials.mockResolvedValue({
      username: 'test',
      password: 'test-value',
      service: 'test-service',
      storage: 'keychain',
    });
    mockKeychain.resetInternetCredentials.mockResolvedValue();
    mockKeychain.getSupportedBiometryType.mockResolvedValue(Keychain.BIOMETRY_TYPE.FACE_ID);
    
    // Reset singleton instance
    (SecurityService as any).instance = undefined;
    securityService = SecurityService.getInstance();
  });

  describe('初始化', () => {
    it('應該成功初始化安全服務', async () => {
      expect(securityService).toBeDefined();
      
      const config = securityService.getSecurityConfig();
      expect(config).toEqual({
        enableEncryption: true,
        enableBiometric: true,
        enableDeviceBinding: true,
        enableTamperDetection: true,
        sessionTimeout: 30 * 60 * 1000,
        maxFailedAttempts: 5,
      });
    });

    it('應該載入現有的安全指標', async () => {
      const mockMetrics: SecurityMetrics = {
        failedLoginAttempts: 2,
        lastFailedAttempt: Date.now() - 1000,
        deviceFingerprint: 'mock-fingerprint',
        appIntegrityHash: 'mock-hash',
        lastSecurityCheck: Date.now() - 5000,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockMetrics));
      
      const newService = SecurityService.getInstance();
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const metrics = newService.getSecurityMetrics();
      expect(metrics?.failedLoginAttempts).toBe(2);
      expect(metrics?.deviceFingerprint).toBe('mock-fingerprint');
    });
  });

  describe('數據加密和解密', () => {
    it('應該成功加密數據', async () => {
      const testData = 'sensitive-data-to-encrypt';
      
      const encryptedData = await securityService.encryptData(testData);
      
      expect(encryptedData).toBeDefined();
      expect(encryptedData.data).toBeDefined();
      expect(encryptedData.iv).toBeDefined();
      expect(encryptedData.salt).toBeDefined();
      expect(encryptedData.timestamp).toBeGreaterThan(0);
      expect(encryptedData.data).not.toBe(testData); // 確保數據已加密
    });

    it('應該成功解密數據', async () => {
      const testData = 'sensitive-data-to-decrypt';
      
      const encryptedData = await securityService.encryptData(testData);
      const decryptedData = await securityService.decryptData(encryptedData);
      
      expect(decryptedData).toBe(testData);
    });

    it('應該在禁用加密時返回原始數據', async () => {
      securityService.updateSecurityConfig({ enableEncryption: false });
      
      const testData = 'unencrypted-data';
      const encryptedData = await securityService.encryptData(testData);
      
      expect(encryptedData.data).toBe(testData);
      expect(encryptedData.iv).toBe('');
      expect(encryptedData.salt).toBe('');
    });

    it('應該處理解密錯誤', async () => {
      const invalidEncryptedData: EncryptedData = {
        data: 'invalid-encrypted-data',
        iv: 'invalid-iv',
        salt: 'invalid-salt',
        timestamp: Date.now(),
      };

      await expect(securityService.decryptData(invalidEncryptedData))
        .rejects.toThrow('數據解密失敗');
    });
  });

  describe('安全儲存', () => {
    it('應該使用 Keychain 安全儲存數據', async () => {
      const key = 'test-key';
      const value = 'test-value';
      
      await securityService.setSecureItem(key, value);
      
      expect(mockKeychain.setInternetCredentials).toHaveBeenCalledWith(
        key,
        key,
        value,
        expect.objectContaining({
          service: `yunshui_${key}`,
        })
      );
    });

    it('應該使用生物識別儲存數據', async () => {
      const key = 'biometric-key';
      const value = 'biometric-value';
      
      await securityService.setSecureItem(key, value, true);
      
      expect(mockKeychain.setInternetCredentials).toHaveBeenCalledWith(
        key,
        key,
        value,
        expect.objectContaining({
          service: `yunshui_${key}`,
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
          authenticatePrompt: '請使用生物識別驗證',
        })
      );
    });

    it('應該回退到 AsyncStorage 當 Keychain 失敗時', async () => {
      mockKeychain.setInternetCredentials.mockRejectedValue(new Error('Keychain error'));
      
      const key = 'fallback-key';
      const value = 'fallback-value';
      
      await securityService.setSecureItem(key, value);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        `secure_${key}`,
        expect.any(String)
      );
    });

    it('應該從 Keychain 讀取安全數據', async () => {
      const key = 'read-key';
      const expectedValue = 'read-value';
      
      mockKeychain.getInternetCredentials.mockResolvedValue({
        username: key,
        password: expectedValue,
        service: `yunshui_${key}`,
        storage: 'keychain',
      });
      
      const value = await securityService.getSecureItem(key);
      
      expect(value).toBe(expectedValue);
      expect(mockKeychain.getInternetCredentials).toHaveBeenCalledWith(
        key,
        expect.objectContaining({
          service: `yunshui_${key}`,
        })
      );
    });

    it('應該從 AsyncStorage 回退讀取數據', async () => {
      mockKeychain.getInternetCredentials.mockRejectedValue(new Error('Keychain error'));
      
      const key = 'fallback-read-key';
      const testData = 'fallback-read-value';
      
      // Mock encrypted data in AsyncStorage
      const encryptedData = await securityService.encryptData(testData);
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(encryptedData));
      
      const value = await securityService.getSecureItem(key);
      
      expect(value).toBe(testData);
    });

    it('應該移除安全數據', async () => {
      const key = 'remove-key';
      
      await securityService.removeSecureItem(key);
      
      expect(mockKeychain.resetInternetCredentials).toHaveBeenCalledWith(key);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(`secure_${key}`);
    });
  });

  describe('生物識別認證', () => {
    it('應該檢查生物識別支援', async () => {
      const isSupported = await securityService.isBiometricSupported();
      
      expect(isSupported).toBe(true);
      expect(mockKeychain.getSupportedBiometryType).toHaveBeenCalled();
    });

    it('應該在不支援生物識別時返回 false', async () => {
      mockKeychain.getSupportedBiometryType.mockResolvedValue(Keychain.BIOMETRY_TYPE.NONE);
      
      const isSupported = await securityService.isBiometricSupported();
      
      expect(isSupported).toBe(false);
    });

    it('應該執行生物識別認證', async () => {
      const isAuthenticated = await securityService.authenticateWithBiometric();
      
      expect(isAuthenticated).toBe(true);
      expect(mockKeychain.setInternetCredentials).toHaveBeenCalled();
      expect(mockKeychain.getInternetCredentials).toHaveBeenCalled();
      expect(mockKeychain.resetInternetCredentials).toHaveBeenCalled();
    });

    it('應該在生物識別不支援時拋出錯誤', async () => {
      mockKeychain.getSupportedBiometryType.mockResolvedValue(Keychain.BIOMETRY_TYPE.NONE);
      
      const isAuthenticated = await securityService.authenticateWithBiometric();
      
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('設備指紋和綁定', () => {
    it('應該生成設備指紋', async () => {
      const fingerprint = await securityService.generateDeviceFingerprint();
      
      expect(fingerprint).toBe('mocked-hash-value');
      expect(fingerprint).not.toBe('unknown_device');
    });

    it('應該驗證設備綁定', async () => {
      // First call should store fingerprint
      const isValid1 = await securityService.validateDeviceBinding();
      expect(isValid1).toBe(true);
      
      // Second call should validate against stored fingerprint
      mockKeychain.getInternetCredentials.mockResolvedValue({
        username: 'device_fingerprint',
        password: 'mocked-hash-value',
        service: 'yunshui_device_fingerprint',
        storage: 'keychain',
      });
      
      const isValid2 = await securityService.validateDeviceBinding();
      expect(isValid2).toBe(true);
    });

    it('應該在設備指紋不匹配時返回 false', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValue({
        username: 'device_fingerprint',
        password: 'different-fingerprint',
        service: 'yunshui_device_fingerprint',
        storage: 'keychain',
      });
      
      const isValid = await securityService.validateDeviceBinding();
      expect(isValid).toBe(false);
    });

    it('應該在禁用設備綁定時返回 true', async () => {
      securityService.updateSecurityConfig({ enableDeviceBinding: false });
      
      const isValid = await securityService.validateDeviceBinding();
      expect(isValid).toBe(true);
    });
  });

  describe('失敗嘗試管理', () => {
    it('應該記錄失敗嘗試', async () => {
      await securityService.recordFailedAttempt();
      
      const metrics = securityService.getSecurityMetrics();
      expect(metrics?.failedLoginAttempts).toBe(1);
      expect(metrics?.lastFailedAttempt).toBeGreaterThan(0);
    });

    it('應該重置失敗嘗試計數', async () => {
      // Record some failed attempts first
      await securityService.recordFailedAttempt();
      await securityService.recordFailedAttempt();
      
      let metrics = securityService.getSecurityMetrics();
      expect(metrics?.failedLoginAttempts).toBe(2);
      
      await securityService.resetFailedAttempts();
      
      metrics = securityService.getSecurityMetrics();
      expect(metrics?.failedLoginAttempts).toBe(0);
      expect(metrics?.lastFailedAttempt).toBe(0);
    });

    it('應該檢查帳戶是否被鎖定', async () => {
      // Record maximum failed attempts
      for (let i = 0; i < 5; i++) {
        await securityService.recordFailedAttempt();
      }
      
      const isLocked = await securityService.isAccountLocked();
      expect(isLocked).toBe(true);
    });

    it('應該在失敗嘗試未達上限時返回未鎖定', async () => {
      await securityService.recordFailedAttempt();
      await securityService.recordFailedAttempt();
      
      const isLocked = await securityService.isAccountLocked();
      expect(isLocked).toBe(false);
    });
  });

  describe('安全檢查', () => {
    it('應該執行完整的安全檢查', async () => {
      const results = await securityService.performSecurityCheck();
      
      expect(results).toEqual({
        deviceBinding: true,
        appIntegrity: true,
        tamperDetection: true,
      });
    });

    it('應該在禁用相關功能時跳過檢查', async () => {
      securityService.updateSecurityConfig({
        enableDeviceBinding: false,
        enableTamperDetection: false,
      });
      
      const results = await securityService.performSecurityCheck();
      
      expect(results.deviceBinding).toBe(true); // 跳過檢查時返回 true
      expect(results.appIntegrity).toBe(true);
      expect(results.tamperDetection).toBe(true); // 跳過檢查時返回 true
    });
  });

  describe('配置管理', () => {
    it('應該更新安全配置', () => {
      const newConfig = {
        enableEncryption: false,
        enableBiometric: false,
        sessionTimeout: 15 * 60 * 1000, // 15分鐘
        maxFailedAttempts: 3,
      };
      
      securityService.updateSecurityConfig(newConfig);
      
      const config = securityService.getSecurityConfig();
      expect(config.enableEncryption).toBe(false);
      expect(config.enableBiometric).toBe(false);
      expect(config.sessionTimeout).toBe(15 * 60 * 1000);
      expect(config.maxFailedAttempts).toBe(3);
      expect(config.enableDeviceBinding).toBe(true); // 保持原值
    });
  });

  describe('數據清理', () => {
    it('應該清除所有安全數據', async () => {
      await securityService.clearSecurityData();
      
      // Check that all security keys are removed
      const expectedKeys = ['encryption_key', 'device_fingerprint', 'access_token', 'refresh_token'];
      expect(mockKeychain.resetInternetCredentials).toHaveBeenCalledTimes(expectedKeys.length);
      
      expectedKeys.forEach(key => {
        expect(mockKeychain.resetInternetCredentials).toHaveBeenCalledWith(key);
      });
      
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('security_metrics');
    });
  });

  describe('錯誤處理', () => {
    it('應該處理加密錯誤', async () => {
      // Mock crypto to fail
      const mockCrypto = require('expo-crypto');
      mockCrypto.getRandomBytesAsync.mockRejectedValue(new Error('Crypto error'));
      
      await expect(securityService.encryptData('test'))
        .rejects.toThrow('數據加密失敗');
    });

    it('應該處理設備指紋生成錯誤', async () => {
      const mockDeviceInfo = require('react-native-device-info');
      mockDeviceInfo.getUniqueId.mockRejectedValue(new Error('Device info error'));
      
      const fingerprint = await securityService.generateDeviceFingerprint();
      expect(fingerprint).toBe('unknown_device');
    });

    it('應該處理 AsyncStorage 錯誤', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      
      // Should not throw during initialization
      expect(() => {
        SecurityService.getInstance();
      }).not.toThrow();
    });

    it('應該處理生物識別錯誤', async () => {
      mockKeychain.getSupportedBiometryType.mockRejectedValue(new Error('Biometric error'));
      
      const isSupported = await securityService.isBiometricSupported();
      expect(isSupported).toBe(false);
    });
  });

  describe('應用完整性檢查', () => {
    it('應該在非模擬器環境中通過完整性檢查', async () => {
      const mockDeviceInfo = require('react-native-device-info');
      mockDeviceInfo.isEmulator.mockResolvedValue(false);
      
      const results = await securityService.performSecurityCheck();
      expect(results.appIntegrity).toBe(true);
    });

    it('應該在開發模式下允許模擬器', async () => {
      const mockDeviceInfo = require('react-native-device-info');
      mockDeviceInfo.isEmulator.mockResolvedValue(true);
      
      // In development mode (__DEV__ is true), emulator should be allowed
      const results = await securityService.performSecurityCheck();
      expect(results.appIntegrity).toBe(true);
    });
  });
});