#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * iOS 建置腳本
 * 用於生成 iOS 應用程式
 */

const BUILD_PROFILES = {
  simulator: 'development',
  device: 'preview',
  appstore: 'production'
};

const IOS_CONFIGURATIONS = {
  development: {
    simulator: true,
    device: false,
    distribution: 'internal',
    buildConfiguration: 'Debug'
  },
  preview: {
    simulator: false,
    device: true,
    distribution: 'internal',
    buildConfiguration: 'Release'
  },
  production: {
    simulator: false,
    device: true,
    distribution: 'store',
    buildConfiguration: 'Release'
  }
};

function main() {
  const args = process.argv.slice(2);
  const profile = args[0] || 'device';
  
  if (!BUILD_PROFILES[profile]) {
    console.error(`❌ 無效的建置設定檔: ${profile}`);
    console.log(`可用的設定檔: ${Object.keys(BUILD_PROFILES).join(', ')}`);
    process.exit(1);
  }

  console.log(`🍎 開始建置 iOS 應用程式 (${profile} 模式)...`);
  
  try {
    // 檢查 macOS 環境
    if (process.platform !== 'darwin') {
      throw new Error('iOS 建置需要在 macOS 環境中執行');
    }

    // 檢查 Xcode
    try {
      execSync('xcode-select --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('未安裝 Xcode 或 Xcode Command Line Tools');
    }

    // 檢查 EAS CLI
    try {
      execSync('eas --version', { stdio: 'pipe' });
    } catch (error) {
      console.log('📦 安裝 EAS CLI...');
      execSync('npm install -g eas-cli', { stdio: 'inherit' });
    }

    // 檢查是否已登入 Expo
    try {
      execSync('eas whoami', { stdio: 'pipe' });
    } catch (error) {
      console.log('🔐 請先登入 Expo 帳號:');
      execSync('eas login', { stdio: 'inherit' });
    }

    // 檢查 iOS 證書和配置檔案
    if (profile !== 'simulator') {
      console.log('🔐 檢查 iOS 證書和配置檔案...');
      try {
        execSync('eas credentials', { stdio: 'inherit' });
      } catch (error) {
        console.warn('⚠️  證書檢查失敗，請確保已正確設定 iOS 證書');
      }
    }

    // 建置應用程式
    const buildCommand = `eas build --platform ios --profile ${BUILD_PROFILES[profile]}`;
    console.log(`執行命令: ${buildCommand}`);
    
    execSync(buildCommand, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });

    console.log('✅ iOS 建置完成！');
    
    if (profile === 'simulator') {
      console.log('📱 可以在 iOS 模擬器中安裝和測試');
    } else if (profile === 'device') {
      console.log('📱 可以在實體 iOS 設備上安裝和測試');
    } else if (profile === 'appstore') {
      console.log('🏪 可以上傳到 App Store Connect');
    }
    
  } catch (error) {
    console.error('❌ 建置失敗:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BUILD_PROFILES, IOS_CONFIGURATIONS };