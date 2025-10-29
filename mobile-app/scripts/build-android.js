#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Android APK 建置腳本
 * 用於生成可直接安裝的 APK 檔案
 */

const BUILD_PROFILES = {
  debug: 'development',
  preview: 'preview',
  release: 'production'
};

function main() {
  const args = process.argv.slice(2);
  const profile = args[0] || 'preview';
  
  if (!BUILD_PROFILES[profile]) {
    console.error(`❌ 無效的建置設定檔: ${profile}`);
    console.log(`可用的設定檔: ${Object.keys(BUILD_PROFILES).join(', ')}`);
    process.exit(1);
  }

  console.log(`🚀 開始建置 Android APK (${profile} 模式)...`);
  
  try {
    // 檢查 EAS CLI 是否已安裝
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

    // 建置 APK
    const buildCommand = `eas build --platform android --profile ${BUILD_PROFILES[profile]} --local`;
    console.log(`執行命令: ${buildCommand}`);
    
    execSync(buildCommand, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });

    console.log('✅ Android APK 建置完成！');
    console.log('📱 APK 檔案已生成，可以直接安裝到 Android 設備上');
    
  } catch (error) {
    console.error('❌ 建置失敗:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BUILD_PROFILES };