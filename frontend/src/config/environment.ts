/**
 * 前端環境配置管理
 */

/**
 * 環境配置介面
 */
interface EnvironmentConfig {
  // 應用程式設定
  NODE_ENV: string;
  
  // API 設定
  API_BASE_URL: string;
  WS_URL: string;
  
  // 功能開關
  ENABLE_MOCK_DATA: boolean;
  ENABLE_DEBUG_MODE: boolean;
  ENABLE_ANALYTICS: boolean;
  
  // UI 設定
  DEFAULT_LANGUAGE: string;
  THEME: string;
  
  // 檔案上傳設定
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string[];
  
  // 快取設定
  CACHE_DURATION: number;
  
  // 效能設定
  PAGINATION_SIZE: number;
  DEBOUNCE_DELAY: number;
  
  // 安全設定
  SESSION_TIMEOUT: number;
  AUTO_LOGOUT_WARNING: number;
}

/**
 * 取得環境變數值
 */
function getEnvVar(key: string, defaultValue: string = ''): string {
  // Vite 環境變數以 VITE_ 開頭
  const viteKey = `VITE_${key}`;
  return import.meta.env[viteKey] || defaultValue;
}

/**
 * 解析布林值
 */
function parseBoolean(value: string, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * 解析數字
 */
function parseNumber(value: string, defaultValue: number): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 解析陣列
 */
function parseArray(value: string, defaultValue: string[] = []): string[] {
  if (!value) return defaultValue;
  return value.split(',').map(item => item.trim());
}

/**
 * 取得環境配置
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const nodeEnv = import.meta.env.MODE || 'development';
  
  const config: EnvironmentConfig = {
    // 應用程式設定
    NODE_ENV: nodeEnv,
    
    // API 設定
    API_BASE_URL: getEnvVar('API_URL', 
      nodeEnv === 'production' ? '/api' : 'http://192.168.68.99:3004/api'
    ),
    WS_URL: getEnvVar('WS_URL', 
      nodeEnv === 'production' ? '' : 'http://192.168.68.99:3004'
    ),
    
    // 功能開關
    ENABLE_MOCK_DATA: parseBoolean(getEnvVar('ENABLE_MOCK_DATA'), nodeEnv === 'development'),
    ENABLE_DEBUG_MODE: parseBoolean(getEnvVar('ENABLE_DEBUG_MODE'), nodeEnv !== 'production'),
    ENABLE_ANALYTICS: parseBoolean(getEnvVar('ENABLE_ANALYTICS'), nodeEnv === 'production'),
    
    // UI 設定
    DEFAULT_LANGUAGE: getEnvVar('DEFAULT_LANGUAGE', 'zh-TW'),
    THEME: getEnvVar('THEME', 'light'),
    
    // 檔案上傳設定
    MAX_FILE_SIZE: parseNumber(getEnvVar('MAX_FILE_SIZE'), 5 * 1024 * 1024), // 5MB
    ALLOWED_FILE_TYPES: parseArray(getEnvVar('ALLOWED_FILE_TYPES'), ['image/jpeg', 'image/png', 'image/webp']),
    
    // 快取設定
    CACHE_DURATION: parseNumber(getEnvVar('CACHE_DURATION'), 5 * 60 * 1000), // 5分鐘
    
    // 效能設定
    PAGINATION_SIZE: parseNumber(getEnvVar('PAGINATION_SIZE'), 20),
    DEBOUNCE_DELAY: parseNumber(getEnvVar('DEBOUNCE_DELAY'), 300),
    
    // 安全設定
    SESSION_TIMEOUT: parseNumber(getEnvVar('SESSION_TIMEOUT'), 24 * 60 * 60 * 1000), // 24小時
    AUTO_LOGOUT_WARNING: parseNumber(getEnvVar('AUTO_LOGOUT_WARNING'), 5 * 60 * 1000) // 5分鐘
  };

  return config;
}

/**
 * 檢查是否為開發環境
 */
export function isDevelopment(): boolean {
  return getEnvironmentConfig().NODE_ENV === 'development';
}

/**
 * 檢查是否為測試環境
 */
export function isTest(): boolean {
  return getEnvironmentConfig().NODE_ENV === 'test';
}

/**
 * 檢查是否為生產環境
 */
export function isProduction(): boolean {
  return getEnvironmentConfig().NODE_ENV === 'production';
}

/**
 * 匯出配置實例
 */
export const config = getEnvironmentConfig();

/**
 * 顯示配置摘要
 */
export function getConfigSummary(): Record<string, any> {
  const cfg = getEnvironmentConfig();
  
  return {
    NODE_ENV: cfg.NODE_ENV,
    API_BASE_URL: cfg.API_BASE_URL,
    WS_URL: cfg.WS_URL,
    ENABLE_MOCK_DATA: cfg.ENABLE_MOCK_DATA,
    ENABLE_DEBUG_MODE: cfg.ENABLE_DEBUG_MODE,
    DEFAULT_LANGUAGE: cfg.DEFAULT_LANGUAGE,
    THEME: cfg.THEME,
    MAX_FILE_SIZE: cfg.MAX_FILE_SIZE,
    PAGINATION_SIZE: cfg.PAGINATION_SIZE
  };
}

/**
 * 環境配置驗證
 */
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const cfg = getEnvironmentConfig();

  // 驗證 API URL
  if (!cfg.API_BASE_URL) {
    errors.push('API_BASE_URL is required');
  }

  // 驗證檔案大小限制
  if (cfg.MAX_FILE_SIZE <= 0) {
    errors.push('MAX_FILE_SIZE must be greater than 0');
  }

  // 驗證分頁大小
  if (cfg.PAGINATION_SIZE <= 0 || cfg.PAGINATION_SIZE > 100) {
    errors.push('PAGINATION_SIZE must be between 1 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 開發工具：顯示環境資訊
 */
export function logEnvironmentInfo(): void {
  if (!isDevelopment()) return;
  
  console.group('🔧 Environment Configuration');
  console.table(getConfigSummary());
  console.groupEnd();
  
  const validation = validateConfig();
  if (!validation.isValid) {
    console.warn('⚠️ Configuration validation failed:', validation.errors);
  }
}