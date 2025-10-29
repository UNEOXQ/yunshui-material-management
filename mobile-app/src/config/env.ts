import Constants from 'expo-constants';

interface EnvConfig {
  API_BASE_URL: string;
  API_TIMEOUT: number;
  NODE_ENV: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_UPLOAD_PRESET: string;
  APP_NAME: string;
  APP_VERSION: string;
}

// Default configuration
const defaultConfig: EnvConfig = {
  API_BASE_URL: 'http://localhost:3004',
  API_TIMEOUT: 10000,
  NODE_ENV: 'development',
  CLOUDINARY_CLOUD_NAME: '',
  CLOUDINARY_UPLOAD_PRESET: '',
  APP_NAME: '雲水基材管理系統',
  APP_VERSION: '1.0.0',
};

// Get configuration from Expo Constants or environment variables
const getEnvConfig = (): EnvConfig => {
  const extra = Constants.expoConfig?.extra || {};
  
  return {
    API_BASE_URL: extra.API_BASE_URL || process.env.API_BASE_URL || defaultConfig.API_BASE_URL,
    API_TIMEOUT: parseInt(extra.API_TIMEOUT || process.env.API_TIMEOUT || defaultConfig.API_TIMEOUT.toString()),
    NODE_ENV: extra.NODE_ENV || process.env.NODE_ENV || defaultConfig.NODE_ENV,
    CLOUDINARY_CLOUD_NAME: extra.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || defaultConfig.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_UPLOAD_PRESET: extra.CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET || defaultConfig.CLOUDINARY_UPLOAD_PRESET,
    APP_NAME: extra.APP_NAME || process.env.APP_NAME || defaultConfig.APP_NAME,
    APP_VERSION: extra.APP_VERSION || process.env.APP_VERSION || defaultConfig.APP_VERSION,
  };
};

export const ENV = getEnvConfig();

export const isDevelopment = ENV.NODE_ENV === 'development';
export const isProduction = ENV.NODE_ENV === 'production';