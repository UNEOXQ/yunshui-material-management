#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * APK 測試和驗證腳本
 * 用於檢查生成的 APK 檔案的完整性和功能
 */

class APKTester {
  constructor(apkPath) {
    this.apkPath = apkPath;
    this.testResults = {
      fileExists: false,
      fileSize: 0,
      signature: false,
      permissions: [],
      activities: [],
      services: [],
      metadata: {}
    };
  }

  async runAllTests() {
    console.log('🧪 開始 APK 測試和驗證...');
    console.log(`📱 APK 檔案: ${this.apkPath}`);
    console.log('================================');

    try {
      await this.testFileExists();
      await this.testFileSize();
      await this.testSignature();
      await this.testPermissions();
      await this.testManifest();
      await this.generateReport();
    } catch (error) {
      console.error('❌ 測試過程發生錯誤:', error.message);
      process.exit(1);
    }
  }

  async testFileExists() {
    console.log('📁 檢查檔案存在性...');
    
    if (!fs.existsSync(this.apkPath)) {
      throw new Error(`APK 檔案不存在: ${this.apkPath}`);
    }
    
    this.testResults.fileExists = true;
    console.log('✅ APK 檔案存在');
  }

  async testFileSize() {
    console.log('📏 檢查檔案大小...');
    
    const stats = fs.statSync(this.apkPath);
    this.testResults.fileSize = stats.size;
    
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`📊 APK 大小: ${sizeMB} MB`);
    
    // 檢查檔案大小是否合理
    if (stats.size < 1024 * 1024) { // 小於 1MB
      console.warn('⚠️  警告: APK 檔案可能過小');
    } else if (stats.size > 100 * 1024 * 1024) { // 大於 100MB
      console.warn('⚠️  警告: APK 檔案可能過大');
    } else {
      console.log('✅ APK 大小正常');
    }
  }

  async testSignature() {
    console.log('🔐 檢查 APK 簽名...');
    
    try {
      // 使用 jarsigner 檢查簽名
      const result = execSync(`jarsigner -verify "${this.apkPath}"`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.testResults.signature = true;
      console.log('✅ APK 簽名有效');
      
      // 獲取簽名詳細資訊
      try {
        const certInfo = execSync(`keytool -printcert -jarfile "${this.apkPath}"`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        // 解析證書資訊
        const ownerMatch = certInfo.match(/Owner: (.+)/);
        const validFromMatch = certInfo.match(/Valid from: (.+) until: (.+)/);
        
        if (ownerMatch) {
          this.testResults.metadata.certificateOwner = ownerMatch[1];
        }
        if (validFromMatch) {
          this.testResults.metadata.validFrom = validFromMatch[1];
          this.testResults.metadata.validUntil = validFromMatch[2];
        }
        
      } catch (error) {
        console.warn('⚠️  無法獲取詳細簽名資訊');
      }
      
    } catch (error) {
      console.error('❌ APK 簽名無效或檢查失敗');
      this.testResults.signature = false;
    }
  }

  async testPermissions() {
    console.log('🔒 檢查應用程式權限...');
    
    try {
      // 使用 aapt 檢查權限 (如果可用)
      const result = execSync(`aapt dump permissions "${this.apkPath}"`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const permissions = result.match(/uses-permission: name='([^']+)'/g);
      if (permissions) {
        this.testResults.permissions = permissions.map(p => 
          p.match(/name='([^']+)'/)[1]
        );
        
        console.log(`📋 發現 ${this.testResults.permissions.length} 個權限:`);
        this.testResults.permissions.forEach(permission => {
          console.log(`   - ${permission}`);
        });
      }
      
    } catch (error) {
      console.warn('⚠️  無法檢查權限 (可能需要安裝 Android SDK)');
    }
  }

  async testManifest() {
    console.log('📋 檢查應用程式清單...');
    
    try {
      // 使用 aapt 檢查 manifest
      const result = execSync(`aapt dump badging "${this.apkPath}"`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // 解析應用程式資訊
      const packageMatch = result.match(/package: name='([^']+)'/);
      const versionCodeMatch = result.match(/versionCode='([^']+)'/);
      const versionNameMatch = result.match(/versionName='([^']+)'/);
      const labelMatch = result.match(/application-label:'([^']+)'/);
      
      if (packageMatch) {
        this.testResults.metadata.packageName = packageMatch[1];
        console.log(`📦 套件名稱: ${packageMatch[1]}`);
      }
      
      if (versionCodeMatch && versionNameMatch) {
        this.testResults.metadata.versionCode = versionCodeMatch[1];
        this.testResults.metadata.versionName = versionNameMatch[1];
        console.log(`🏷️  版本: ${versionNameMatch[1]} (${versionCodeMatch[1]})`);
      }
      
      if (labelMatch) {
        this.testResults.metadata.appLabel = labelMatch[1];
        console.log(`🏷️  應用程式名稱: ${labelMatch[1]}`);
      }
      
      // 檢查活動
      const activities = result.match(/launchable-activity: name='([^']+)'/g);
      if (activities) {
        this.testResults.activities = activities.map(a => 
          a.match(/name='([^']+)'/)[1]
        );
        console.log(`🎯 主要活動: ${this.testResults.activities[0]}`);
      }
      
    } catch (error) {
      console.warn('⚠️  無法檢查應用程式清單 (可能需要安裝 Android SDK)');
    }
  }

  async generateReport() {
    console.log('\n📊 測試報告');
    console.log('================================');
    
    // 基本資訊
    console.log('📱 基本資訊:');
    console.log(`   檔案路徑: ${this.apkPath}`);
    console.log(`   檔案大小: ${(this.testResults.fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   檔案存在: ${this.testResults.fileExists ? '✅' : '❌'}`);
    console.log(`   簽名狀態: ${this.testResults.signature ? '✅' : '❌'}`);
    
    // 應用程式資訊
    if (Object.keys(this.testResults.metadata).length > 0) {
      console.log('\n📋 應用程式資訊:');
      if (this.testResults.metadata.packageName) {
        console.log(`   套件名稱: ${this.testResults.metadata.packageName}`);
      }
      if (this.testResults.metadata.versionName) {
        console.log(`   版本號: ${this.testResults.metadata.versionName}`);
      }
      if (this.testResults.metadata.versionCode) {
        console.log(`   版本代碼: ${this.testResults.metadata.versionCode}`);
      }
      if (this.testResults.metadata.appLabel) {
        console.log(`   應用程式名稱: ${this.testResults.metadata.appLabel}`);
      }
    }
    
    // 權限資訊
    if (this.testResults.permissions.length > 0) {
      console.log(`\n🔒 權限 (${this.testResults.permissions.length} 個):`);
      this.testResults.permissions.slice(0, 10).forEach(permission => {
        console.log(`   - ${permission}`);
      });
      if (this.testResults.permissions.length > 10) {
        console.log(`   ... 還有 ${this.testResults.permissions.length - 10} 個權限`);
      }
    }
    
    // 簽名資訊
    if (this.testResults.metadata.certificateOwner) {
      console.log('\n🔐 簽名資訊:');
      console.log(`   證書擁有者: ${this.testResults.metadata.certificateOwner}`);
      if (this.testResults.metadata.validFrom) {
        console.log(`   有效期: ${this.testResults.metadata.validFrom} 至 ${this.testResults.metadata.validUntil}`);
      }
    }
    
    // 總結
    console.log('\n🎯 測試總結:');
    const passedTests = [
      this.testResults.fileExists,
      this.testResults.signature,
      this.testResults.fileSize > 0
    ].filter(Boolean).length;
    
    console.log(`   通過測試: ${passedTests}/3`);
    
    if (passedTests === 3) {
      console.log('✅ APK 檔案通過所有基本測試，可以進行安裝和測試');
    } else {
      console.log('⚠️  APK 檔案存在問題，請檢查建置過程');
    }
    
    // 建議
    console.log('\n💡 建議:');
    if (this.testResults.fileSize > 50 * 1024 * 1024) {
      console.log('   - 考慮優化 APK 大小，移除不必要的資源');
    }
    if (!this.testResults.signature) {
      console.log('   - 檢查簽名設定，確保 APK 已正確簽名');
    }
    console.log('   - 在實際設備上測試所有功能');
    console.log('   - 檢查應用程式在不同 Android 版本上的相容性');
    
    // 儲存報告
    const reportPath = path.join(path.dirname(this.apkPath), 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    console.log(`\n📄 詳細報告已儲存至: ${reportPath}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const apkPath = args[0];
  
  if (!apkPath) {
    console.error('❌ 請提供 APK 檔案路徑');
    console.log('用法: node scripts/test-apk.js <apk-file-path>');
    process.exit(1);
  }
  
  const tester = new APKTester(apkPath);
  tester.runAllTests();
}

if (require.main === module) {
  main();
}

module.exports = APKTester;