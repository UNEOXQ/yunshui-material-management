import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { securityService } from '../services/securityService';

export class StorageService {
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error storing data:', error);
      throw error;
    }
  }

  static async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
      throw error;
    }
  }

  static async setObject(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error storing object:', error);
      throw error;
    }
  }

  static async getObject<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error retrieving object:', error);
      return null;
    }
  }

  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // 安全儲存 - 用於敏感資料如 Token
  static async setSecureItem(key: string, value: string, useBiometric = false): Promise<void> {
    try {
      await securityService.setSecureItem(key, value, useBiometric);
    } catch (error) {
      console.error('Error storing secure data:', error);
      throw error;
    }
  }

  static async getSecureItem(key: string, useBiometric = false): Promise<string | null> {
    try {
      return await securityService.getSecureItem(key, useBiometric);
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      return null;
    }
  }

  static async removeSecureItem(key: string): Promise<void> {
    try {
      await securityService.removeSecureItem(key);
    } catch (error) {
      console.error('Error removing secure data:', error);
      throw error;
    }
  }

  // Token 相關的便利方法
  static async setAuthTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await Promise.all([
        this.setSecureItem('access_token', accessToken),
        this.setSecureItem('refresh_token', refreshToken)
      ]);
    } catch (error) {
      console.error('Error storing auth tokens:', error);
      throw error;
    }
  }

  static async getAuthTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.getSecureItem('access_token'),
        this.getSecureItem('refresh_token')
      ]);
      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Error retrieving auth tokens:', error);
      return { accessToken: null, refreshToken: null };
    }
  }

  static async clearAuthTokens(): Promise<void> {
    try {
      await Promise.all([
        this.removeSecureItem('access_token'),
        this.removeSecureItem('refresh_token')
      ]);
    } catch (error) {
      console.error('Error clearing auth tokens:', error);
      throw error;
    }
  }

  // 檢查是否支援生物識別
  static async isBiometricSupported(): Promise<boolean> {
    try {
      return await securityService.isBiometricSupported();
    } catch (error) {
      console.error('Error checking biometric support:', error);
      return false;
    }
  }

  // 使用生物識別儲存
  static async setSecureItemWithBiometric(key: string, value: string): Promise<void> {
    try {
      await this.setSecureItem(key, value, true);
    } catch (error) {
      console.error('Error storing secure data with biometric:', error);
      // 回退到普通安全儲存
      await this.setSecureItem(key, value, false);
    }
  }

  // 加密儲存敏感數據
  static async setEncryptedItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      const encrypted = await securityService.encryptData(jsonValue);
      await AsyncStorage.setItem(`encrypted_${key}`, JSON.stringify(encrypted));
    } catch (error) {
      console.error('Error storing encrypted data:', error);
      throw error;
    }
  }

  // 解密讀取敏感數據
  static async getEncryptedItem<T>(key: string): Promise<T | null> {
    try {
      const encryptedStr = await AsyncStorage.getItem(`encrypted_${key}`);
      if (!encryptedStr) return null;

      const encrypted = JSON.parse(encryptedStr);
      const decrypted = await securityService.decryptData(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error retrieving encrypted data:', error);
      return null;
    }
  }

  // 移除加密數據
  static async removeEncryptedItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`encrypted_${key}`);
    } catch (error) {
      console.error('Error removing encrypted data:', error);
      throw error;
    }
  }

  // 執行安全檢查
  static async performSecurityCheck(): Promise<boolean> {
    try {
      const results = await securityService.performSecurityCheck();
      return results.deviceBinding && results.appIntegrity && results.tamperDetection;
    } catch (error) {
      console.error('Security check failed:', error);
      return false;
    }
  }
}