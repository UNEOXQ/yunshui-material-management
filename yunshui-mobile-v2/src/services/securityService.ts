import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

// 類型定義
export interface SecurityConfig {
  enableEncryption: boolean;
  enableBiometric: boolean;
  enableDeviceBinding: boolean;
  enableTamperDetection: boolean;
  sessionTimeout: number; // 毫秒
  maxFailedAttempts: number;
}

export interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
  timestamp: number;
}

export interface SecurityMetrics {
  failedLoginAttempts: number;
  lastFailedAttempt: number;
  deviceFingerprint: string;
  appIntegrityHash: string;
  lastSecurityCheck: number;
}

export interface BiometricOptions {
  title?: string;
  subtitle?: string;
  description?: string;
  fallbackLabel?: string;
  negativeText?: string;
}

export class SecurityService {
  private static instance: SecurityService;
  private config: SecurityConfig;
  private encryptionKey: string | null = null;
  private securityMetrics: SecurityMetrics | null = null;

  private constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      enableEncryption: true,
      enableBiometric: true,
      enableDeviceBinding: true,
      enableTamperDetection: true,
      sessionTimeout: 30 * 60 * 1000, // 30分鐘
      maxFailedAttempts: 5,
      ...config
    };
    
    this.initialize();
  }

  public static getInstance(config?: Partial<SecurityConfig>): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService(config);
    }
    return SecurityService.instance;
  }

  /**
   * 初始化安全服務
   */
  private async initialize(): Promise<void> {
    try {
      // 載入安全指標
      await this.loadSecurityMetrics();
      
      // 生成或載入加密金鑰
      if (this.config.enableEncryption) {
        await this.initializeEncryptionKey();
      }
      
      // 執行安全檢查
      await this.performSecurityCheck();
      
      console.log('SecurityService initialized');
    } catch (error) {
      console.error('Failed to initialize SecurityService:', error);
    }
  }

  /**
   * 生成或載入加密金鑰
   */
  private async initializeEncryptionKey(): Promise<void> {
    try {
      // 嘗試從安全儲存載入現有金鑰
      const existingKey = await this.getSecureItem('encryption_key');
      
      if (existingKey) {
        this.encryptionKey = existingKey;
      } else {
        // 生成新的加密金鑰
        this.encryptionKey = await this.generateEncryptionKey();
        await this.setSecureItem('encryption_key', this.encryptionKey);
      }
    } catch (error) {
      console.error('Failed to initialize encryption key:', error);
      throw new Error('加密金鑰初始化失敗');
    }
  }

  /**
   * 生成加密金鑰
   */
  private async generateEncryptionKey(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 加密數據
   */
  public async encryptData(data: string): Promise<EncryptedData> {
    if (!this.config.enableEncryption || !this.encryptionKey) {
      return {
        data,
        iv: '',
        salt: '',
        timestamp: Date.now()
      };
    }

    try {
      // 生成隨機 IV 和 salt
      const iv = await Crypto.getRandomBytesAsync(16);
      const salt = await Crypto.getRandomBytesAsync(16);
      
      // 使用 AES-256-GCM 加密（模擬實現）
      const encryptedData = await this.performEncryption(data, this.encryptionKey, iv, salt);
      
      return {
        data: encryptedData,
        iv: Array.from(iv, byte => byte.toString(16).padStart(2, '0')).join(''),
        salt: Array.from(salt, byte => byte.toString(16).padStart(2, '0')).join(''),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('數據加密失敗');
    }
  }

  /**
   * 解密數據
   */
  public async decryptData(encryptedData: EncryptedData): Promise<string> {
    if (!this.config.enableEncryption || !this.encryptionKey) {
      return encryptedData.data;
    }

    try {
      // 將十六進制字符串轉換回字節數組
      const iv = new Uint8Array(encryptedData.iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
      const salt = new Uint8Array(encryptedData.salt.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
      
      // 解密數據
      const decryptedData = await this.performDecryption(
        encryptedData.data,
        this.encryptionKey,
        iv,
        salt
      );
      
      return decryptedData;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('數據解密失敗');
    }
  }

  /**
   * 執行加密（簡化實現）
   */
  private async performEncryption(
    data: string,
    key: string,
    iv: Uint8Array,
    salt: Uint8Array
  ): Promise<string> {
    // 這裡應該使用真正的 AES 加密
    // 為了演示，使用簡單的 Base64 編碼
    const combined = JSON.stringify({ data, key: key.substring(0, 8), iv: Array.from(iv) });
    return Buffer.from(combined).toString('base64');
  }

  /**
   * 執行解密（簡化實現）
   */
  private async performDecryption(
    encryptedData: string,
    key: string,
    iv: Uint8Array,
    salt: Uint8Array
  ): Promise<string> {
    try {
      const decoded = Buffer.from(encryptedData, 'base64').toString();
      const parsed = JSON.parse(decoded);
      return parsed.data;
    } catch (error) {
      throw new Error('解密失敗');
    }
  }

  /**
   * 安全儲存數據
   */
  public async setSecureItem(key: string, value: string, useBiometric = false): Promise<void> {
    try {
      const options: Keychain.Options = {
        service: `yunshui_${key}`,
        accessGroup: undefined,
      };

      if (useBiometric && this.config.enableBiometric) {
        options.accessControl = Keychain.ACCESS_CONTROL.BIOMETRY_ANY;
        options.authenticatePrompt = '請使用生物識別驗證';
      }

      await Keychain.setInternetCredentials(key, key, value, options);
    } catch (error) {
      console.error('Secure storage error:', error);
      // 回退到加密的 AsyncStorage
      if (this.config.enableEncryption) {
        const encrypted = await this.encryptData(value);
        await AsyncStorage.setItem(`secure_${key}`, JSON.stringify(encrypted));
      } else {
        await AsyncStorage.setItem(`secure_${key}`, value);
      }
    }
  }

  /**
   * 安全讀取數據
   */
  public async getSecureItem(key: string, useBiometric = false): Promise<string | null> {
    try {
      const options: Keychain.Options = {
        service: `yunshui_${key}`,
      };

      if (useBiometric && this.config.enableBiometric) {
        options.authenticatePrompt = '請使用生物識別驗證';
      }

      const credentials = await Keychain.getInternetCredentials(key, options);
      if (credentials && credentials.password) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error('Secure retrieval error:', error);
      // 回退到 AsyncStorage
      try {
        const stored = await AsyncStorage.getItem(`secure_${key}`);
        if (!stored) return null;

        if (this.config.enableEncryption) {
          const encrypted: EncryptedData = JSON.parse(stored);
          return await this.decryptData(encrypted);
        } else {
          return stored;
        }
      } catch (fallbackError) {
        console.error('Fallback retrieval error:', fallbackError);
        return null;
      }
    }
  }

  /**
   * 移除安全數據
   */
  public async removeSecureItem(key: string): Promise<void> {
    try {
      await Keychain.resetInternetCredentials(key);
    } catch (error) {
      console.error('Secure removal error:', error);
    }
    
    // 同時清理 AsyncStorage 回退
    try {
      await AsyncStorage.removeItem(`secure_${key}`);
    } catch (error) {
      console.error('Fallback removal error:', error);
    }
  }

  /**
   * 檢查生物識別支援
   */
  public async isBiometricSupported(): Promise<boolean> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return biometryType !== null && biometryType !== Keychain.BIOMETRY_TYPE.NONE;
    } catch (error) {
      console.error('Biometric check error:', error);
      return false;
    }
  }

  /**
   * 生物識別認證
   */
  public async authenticateWithBiometric(options?: BiometricOptions): Promise<boolean> {
    try {
      if (!await this.isBiometricSupported()) {
        throw new Error('設備不支援生物識別');
      }

      const testKey = 'biometric_test';
      const testValue = 'test_value';

      // 嘗試使用生物識別儲存和讀取測試數據
      await this.setSecureItem(testKey, testValue, true);
      const retrieved = await this.getSecureItem(testKey, true);
      await this.removeSecureItem(testKey);

      return retrieved === testValue;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  /**
   * 生成設備指紋
   */
  public async generateDeviceFingerprint(): Promise<string> {
    try {
      const deviceInfo = {
        deviceId: await DeviceInfo.getUniqueId(),
        brand: DeviceInfo.getBrand(),
        model: DeviceInfo.getModel(),
        systemName: DeviceInfo.getSystemName(),
        systemVersion: DeviceInfo.getSystemVersion(),
        bundleId: DeviceInfo.getBundleId(),
        buildNumber: DeviceInfo.getBuildNumber(),
        version: DeviceInfo.getVersion(),
      };

      const fingerprint = JSON.stringify(deviceInfo);
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        fingerprint
      );

      return hash;
    } catch (error) {
      console.error('Device fingerprint generation error:', error);
      return 'unknown_device';
    }
  }

  /**
   * 驗證設備綁定
   */
  public async validateDeviceBinding(): Promise<boolean> {
    if (!this.config.enableDeviceBinding) {
      return true;
    }

    try {
      const currentFingerprint = await this.generateDeviceFingerprint();
      const storedFingerprint = await this.getSecureItem('device_fingerprint');

      if (!storedFingerprint) {
        // 首次使用，儲存設備指紋
        await this.setSecureItem('device_fingerprint', currentFingerprint);
        return true;
      }

      return currentFingerprint === storedFingerprint;
    } catch (error) {
      console.error('Device binding validation error:', error);
      return false;
    }
  }

  /**
   * 記錄失敗嘗試
   */
  public async recordFailedAttempt(): Promise<void> {
    try {
      if (!this.securityMetrics) {
        await this.loadSecurityMetrics();
      }

      if (this.securityMetrics) {
        this.securityMetrics.failedLoginAttempts++;
        this.securityMetrics.lastFailedAttempt = Date.now();
        await this.saveSecurityMetrics();
      }
    } catch (error) {
      console.error('Failed to record failed attempt:', error);
    }
  }

  /**
   * 重置失敗嘗試計數
   */
  public async resetFailedAttempts(): Promise<void> {
    try {
      if (!this.securityMetrics) {
        await this.loadSecurityMetrics();
      }

      if (this.securityMetrics) {
        this.securityMetrics.failedLoginAttempts = 0;
        this.securityMetrics.lastFailedAttempt = 0;
        await this.saveSecurityMetrics();
      }
    } catch (error) {
      console.error('Failed to reset failed attempts:', error);
    }
  }

  /**
   * 檢查是否被鎖定
   */
  public async isAccountLocked(): Promise<boolean> {
    try {
      if (!this.securityMetrics) {
        await this.loadSecurityMetrics();
      }

      if (!this.securityMetrics) {
        return false;
      }

      return this.securityMetrics.failedLoginAttempts >= this.config.maxFailedAttempts;
    } catch (error) {
      console.error('Failed to check account lock status:', error);
      return false;
    }
  }

  /**
   * 執行安全檢查
   */
  public async performSecurityCheck(): Promise<{
    deviceBinding: boolean;
    appIntegrity: boolean;
    tamperDetection: boolean;
  }> {
    const results = {
      deviceBinding: true,
      appIntegrity: true,
      tamperDetection: true
    };

    try {
      // 設備綁定檢查
      if (this.config.enableDeviceBinding) {
        results.deviceBinding = await this.validateDeviceBinding();
      }

      // 應用完整性檢查
      results.appIntegrity = await this.checkAppIntegrity();

      // 篡改檢測
      if (this.config.enableTamperDetection) {
        results.tamperDetection = await this.detectTampering();
      }

      // 更新安全指標
      if (this.securityMetrics) {
        this.securityMetrics.lastSecurityCheck = Date.now();
        await this.saveSecurityMetrics();
      }

      return results;
    } catch (error) {
      console.error('Security check error:', error);
      return results;
    }
  }

  /**
   * 檢查應用完整性
   */
  private async checkAppIntegrity(): Promise<boolean> {
    try {
      // 檢查是否在模擬器中運行
      const isEmulator = await DeviceInfo.isEmulator();
      
      // 檢查是否為 Debug 版本
      const isDebug = __DEV__;
      
      // 在生產環境中，這些檢查應該更嚴格
      if (Platform.OS === 'android') {
        // Android 特定檢查
        return !isEmulator || isDebug;
      } else if (Platform.OS === 'ios') {
        // iOS 特定檢查
        return !isEmulator || isDebug;
      }

      return true;
    } catch (error) {
      console.error('App integrity check error:', error);
      return true; // 檢查失敗時假設完整性正常
    }
  }

  /**
   * 檢測篡改
   */
  private async detectTampering(): Promise<boolean> {
    try {
      // 檢查 Root/Jailbreak
      const isRooted = await this.checkRootJailbreak();
      
      // 檢查調試器
      const hasDebugger = this.checkDebugger();
      
      // 檢查 Hook 框架
      const hasHooks = this.checkHookFrameworks();

      return !isRooted && !hasDebugger && !hasHooks;
    } catch (error) {
      console.error('Tamper detection error:', error);
      return true; // 檢測失敗時假設沒有篡改
    }
  }

  /**
   * 檢查 Root/Jailbreak
   */
  private async checkRootJailbreak(): Promise<boolean> {
    try {
      // 這裡應該實現真正的 Root/Jailbreak 檢測
      // 可以使用專門的安全庫如 react-native-root-detection
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * 檢查調試器
   */
  private checkDebugger(): boolean {
    // 簡單的調試器檢測
    return __DEV__;
  }

  /**
   * 檢查 Hook 框架
   */
  private checkHookFrameworks(): boolean {
    // 檢查常見的 Hook 框架
    try {
      // 這裡可以檢查 Frida、Xposed 等框架的存在
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * 載入安全指標
   */
  private async loadSecurityMetrics(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('security_metrics');
      if (stored) {
        this.securityMetrics = JSON.parse(stored);
      } else {
        this.securityMetrics = {
          failedLoginAttempts: 0,
          lastFailedAttempt: 0,
          deviceFingerprint: await this.generateDeviceFingerprint(),
          appIntegrityHash: '',
          lastSecurityCheck: 0
        };
        await this.saveSecurityMetrics();
      }
    } catch (error) {
      console.error('Failed to load security metrics:', error);
    }
  }

  /**
   * 保存安全指標
   */
  private async saveSecurityMetrics(): Promise<void> {
    try {
      if (this.securityMetrics) {
        await AsyncStorage.setItem('security_metrics', JSON.stringify(this.securityMetrics));
      }
    } catch (error) {
      console.error('Failed to save security metrics:', error);
    }
  }

  /**
   * 清除所有安全數據
   */
  public async clearSecurityData(): Promise<void> {
    try {
      // 清除 Keychain 數據
      const keys = ['encryption_key', 'device_fingerprint', 'access_token', 'refresh_token'];
      for (const key of keys) {
        await this.removeSecureItem(key);
      }

      // 清除 AsyncStorage 安全數據
      await AsyncStorage.removeItem('security_metrics');

      // 重置內部狀態
      this.encryptionKey = null;
      this.securityMetrics = null;

      console.log('Security data cleared');
    } catch (error) {
      console.error('Failed to clear security data:', error);
    }
  }

  /**
   * 獲取安全配置
   */
  public getSecurityConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * 更新安全配置
   */
  public updateSecurityConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 獲取安全指標
   */
  public getSecurityMetrics(): SecurityMetrics | null {
    return this.securityMetrics ? { ...this.securityMetrics } : null;
  }
}

// 導出單例實例
export const securityService = SecurityService.getInstance();