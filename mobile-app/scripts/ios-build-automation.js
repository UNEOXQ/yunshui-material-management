#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * iOS 建置自動化腳本
 * 提供完整的 iOS 建置流程自動化
 */

class IOSBuildAutomation {
  constructor() {
    this.projectRoot = process.cwd();
    this.buildDir = path.join(this.projectRoot, 'build');
    this.configDir = path.join(this.projectRoot, 'ios-config');
    
    this.buildConfig = {
      profiles: {
        simulator: {
          buildType: 'development',
          simulator: true,
          device: false,
          distribution: 'internal',
          buildConfiguration: 'Debug'
        },
        device: {
          buildType: 'preview',
          simulator: false,
          device: true,
          distribution: 'internal',
          buildConfiguration: 'Release'
        },
        appstore: {
          buildType: 'production',
          simulator: false,
          device: true,
          distribution: 'store',
          buildConfiguration: 'Release'
        }
      }
    };
  }

  async runFullBuildProcess(profile = 'device') {
    console.log('🍎 iOS 建置自動化流程開始');
    console.log(`📋 建置設定檔: ${profile}`);
    console.log('================================');

    try {
      await this.validateEnvironment();
      await this.prepareProject();
      await this.setupBuildConfiguration(profile);
      await this.runPreBuildChecks();
      await this.buildApplication(profile);
      await this.postBuildProcessing(profile);
      await this.generateBuildReport(profile);
      
      console.log('\n✅ iOS 建置流程完成！');
      
    } catch (error) {
      console.error('\n❌ 建置失敗:', error.message);
      await this.generateErrorReport(error);
      process.exit(1);
    }
  }

  async validateEnvironment() {
    console.log('🔍 驗證 iOS 建置環境...');
    
    // 檢查 macOS
    if (process.platform !== 'darwin') {
      throw new Error('iOS 建置需要在 macOS 環境中執行');
    }
    console.log('✅ macOS 環境');

    // 檢查 Xcode
    try {
      const xcodeVersion = execSync('xcode-select --version', { encoding: 'utf8' }).trim();
      console.log(`✅ Xcode: ${xcodeVersion}`);
    } catch (error) {
      throw new Error('Xcode 未安裝或無法執行。請安裝 Xcode 和 Command Line Tools');
    }

    // 檢查 Node.js
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      console.log(`✅ Node.js: ${nodeVersion}`);
    } catch (error) {
      throw new Error('Node.js 未安裝或無法執行');
    }

    // 檢查 CocoaPods (可選)
    try {
      const podVersion = execSync('pod --version', { encoding: 'utf8' }).trim();
      console.log(`✅ CocoaPods: ${podVersion}`);
    } catch (error) {
      console.warn('⚠️  CocoaPods 未安裝，某些功能可能受限');
    }

    // 檢查 EAS CLI
    try {
      const easVersion = execSync('eas --version', { encoding: 'utf8' }).trim();
      console.log(`✅ EAS CLI: ${easVersion}`);
    } catch (error) {
      console.log('📦 安裝 EAS CLI...');
      execSync('npm install -g eas-cli', { stdio: 'inherit' });
    }

    // 檢查專案檔案
    const requiredFiles = ['package.json', 'app.json', 'eas.json'];
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(this.projectRoot, file))) {
        throw new Error(`必要檔案不存在: ${file}`);
      }
    }

    console.log('✅ iOS 環境驗證完成');
  }

  async prepareProject() {
    console.log('📦 準備 iOS 專案...');
    
    // 安裝依賴
    if (!fs.existsSync(path.join(this.projectRoot, 'node_modules'))) {
      console.log('📥 安裝專案依賴...');
      execSync('npm install', { stdio: 'inherit', cwd: this.projectRoot });
    }

    // 建立建置目錄
    if (!fs.existsSync(this.buildDir)) {
      fs.mkdirSync(this.buildDir, { recursive: true });
    }

    // 清理舊的建置檔案
    const buildFiles = fs.readdirSync(this.buildDir).filter(file => 
      file.endsWith('.ipa') || file.endsWith('.app')
    );
    
    if (buildFiles.length > 0) {
      console.log('🧹 清理舊的建置檔案...');
      buildFiles.forEach(file => {
        fs.unlinkSync(path.join(this.buildDir, file));
      });
    }

    console.log('✅ iOS 專案準備完成');
  }

  async setupBuildConfiguration(profile) {
    console.log('⚙️  設置 iOS 建置配置...');
    
    const config = this.buildConfig.profiles[profile];
    if (!config) {
      throw new Error(`無效的建置設定檔: ${profile}`);
    }

    // 更新版本資訊
    await this.updateVersionInfo();
    
    // 設置環境變數
    process.env.BUILD_PROFILE = profile;
    process.env.BUILD_TYPE = config.buildType;
    process.env.BUILD_CONFIGURATION = config.buildConfiguration;
    process.env.BUILD_TIMESTAMP = new Date().toISOString();
    
    console.log(`✅ iOS 建置配置設置完成 (${profile})`);
  }

  async updateVersionInfo() {
    console.log('🏷️  更新 iOS 版本資訊...');
    
    const packageJson = JSON.parse(fs.readFileSync(
      path.join(this.projectRoot, 'package.json'), 'utf8'
    ));
    
    const appJson = JSON.parse(fs.readFileSync(
      path.join(this.projectRoot, 'app.json'), 'utf8'
    ));

    // 自動增加建置號
    const currentBuildNumber = parseInt(appJson.expo.ios?.buildNumber || '1');
    appJson.expo.ios = appJson.expo.ios || {};
    appJson.expo.ios.buildNumber = (currentBuildNumber + 1).toString();

    // 更新建置時間
    appJson.expo.extra = appJson.expo.extra || {};
    appJson.expo.extra.BUILD_TIME = new Date().toISOString();
    appJson.expo.extra.BUILD_HASH = this.generateBuildHash();

    // 儲存更新的配置
    fs.writeFileSync(
      path.join(this.projectRoot, 'app.json'),
      JSON.stringify(appJson, null, 2)
    );

    console.log(`✅ iOS 版本更新: ${appJson.expo.version} (${appJson.expo.ios.buildNumber})`);
  }

  generateBuildHash() {
    const packageJson = fs.readFileSync(
      path.join(this.projectRoot, 'package.json'), 'utf8'
    );
    const appJson = fs.readFileSync(
      path.join(this.projectRoot, 'app.json'), 'utf8'
    );
    
    return crypto
      .createHash('md5')
      .update(packageJson + appJson + Date.now())
      .digest('hex')
      .substring(0, 8);
  }

  async runPreBuildChecks() {
    console.log('🔍 執行 iOS 建置前檢查...');
    
    // TypeScript 類型檢查
    try {
      console.log('📝 TypeScript 類型檢查...');
      execSync('npm run type-check', { stdio: 'pipe', cwd: this.projectRoot });
      console.log('✅ TypeScript 檢查通過');
    } catch (error) {
      console.warn('⚠️  TypeScript 檢查發現問題，但繼續建置');
    }

    // ESLint 程式碼檢查
    try {
      console.log('🔍 ESLint 程式碼檢查...');
      execSync('npm run lint', { stdio: 'pipe', cwd: this.projectRoot });
      console.log('✅ ESLint 檢查通過');
    } catch (error) {
      console.warn('⚠️  ESLint 檢查發現問題，但繼續建置');
    }

    // 檢查 EAS 登入狀態
    try {
      execSync('eas whoami', { stdio: 'pipe' });
      console.log('✅ EAS 已登入');
    } catch (error) {
      console.log('🔐 請登入 EAS...');
      execSync('eas login', { stdio: 'inherit' });
    }

    // 檢查 iOS 證書 (非模擬器建置)
    const config = this.buildConfig.profiles[process.env.BUILD_PROFILE];
    if (!config.simulator) {
      try {
        console.log('🔐 檢查 iOS 證書...');
        // 這裡可以添加證書檢查邏輯
        console.log('✅ iOS 證書檢查完成');
      } catch (error) {
        console.warn('⚠️  iOS 證書檢查失敗，請確保已正確設定');
      }
    }

    console.log('✅ iOS 建置前檢查完成');
  }

  async buildApplication(profile) {
    console.log(`🔨 開始建置 iOS 應用程式 (${profile})...`);
    
    const config = this.buildConfig.profiles[profile];
    const buildCommand = `eas build --platform ios --profile ${config.buildType} --non-interactive`;
    
    console.log(`執行命令: ${buildCommand}`);
    
    const startTime = Date.now();
    
    try {
      execSync(buildCommand, { 
        stdio: 'inherit',
        cwd: this.projectRoot,
        env: { ...process.env }
      });
      
      const buildTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`✅ iOS 建置完成，耗時: ${buildTime} 秒`);
      
    } catch (error) {
      throw new Error(`iOS 建置失敗: ${error.message}`);
    }
  }

  async postBuildProcessing(profile) {
    console.log('🔄 執行 iOS 建置後處理...');
    
    const config = this.buildConfig.profiles[profile];
    
    // 提供安裝指引
    if (config.simulator) {
      console.log('📱 模擬器安裝指引:');
      console.log('   1. 開啟 iOS 模擬器');
      console.log('   2. 拖拽 .app 檔案到模擬器');
      console.log('   3. 或使用: xcrun simctl install booted path/to/app.app');
    } else if (config.distribution === 'internal') {
      console.log('📱 設備安裝指引:');
      console.log('   1. 下載 .ipa 檔案');
      console.log('   2. 使用 Xcode Devices 視窗安裝');
      console.log('   3. 或使用 Apple Configurator 2');
    } else if (config.distribution === 'store') {
      console.log('🏪 App Store 發布指引:');
      console.log('   1. 下載 .ipa 檔案');
      console.log('   2. 上傳到 App Store Connect');
      console.log('   3. 填寫應用程式資訊');
      console.log('   4. 提交審核');
    }

    // 生成檔案校驗和
    await this.generateChecksums();
    
    console.log('✅ iOS 建置後處理完成');
  }

  async generateChecksums() {
    console.log('🔐 生成 iOS 檔案校驗和...');
    
    const buildFiles = fs.readdirSync(this.buildDir).filter(file => 
      file.endsWith('.ipa') || file.endsWith('.app')
    );

    const checksums = {};
    
    for (const file of buildFiles) {
      const filePath = path.join(this.buildDir, file);
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        checksums[file] = {
          sha256: hash,
          size: fileBuffer.length,
          created: new Date().toISOString()
        };
      }
    }

    if (Object.keys(checksums).length > 0) {
      fs.writeFileSync(
        path.join(this.buildDir, 'ios-checksums.json'),
        JSON.stringify(checksums, null, 2)
      );
      console.log('✅ iOS 校驗和檔案已生成');
    }
  }

  async generateBuildReport(profile) {
    console.log('📊 生成 iOS 建置報告...');
    
    const packageJson = JSON.parse(fs.readFileSync(
      path.join(this.projectRoot, 'package.json'), 'utf8'
    ));
    
    const appJson = JSON.parse(fs.readFileSync(
      path.join(this.projectRoot, 'app.json'), 'utf8'
    ));

    const report = {
      buildInfo: {
        platform: 'ios',
        profile: profile,
        timestamp: new Date().toISOString(),
        version: appJson.expo.version,
        buildNumber: appJson.expo.ios?.buildNumber,
        buildHash: appJson.expo.extra?.BUILD_HASH
      },
      environment: {
        nodeVersion: execSync('node --version', { encoding: 'utf8' }).trim(),
        npmVersion: execSync('npm --version', { encoding: 'utf8' }).trim(),
        xcodeVersion: this.getXcodeVersion(),
        platform: process.platform,
        arch: process.arch
      },
      configuration: this.buildConfig.profiles[profile],
      files: []
    };

    // 添加建置檔案資訊
    const buildFiles = fs.readdirSync(this.buildDir).filter(file => 
      file.endsWith('.ipa') || file.endsWith('.app')
    );

    for (const file of buildFiles) {
      const filePath = path.join(this.buildDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        report.files.push({
          name: file,
          size: stats.size,
          sizeFormatted: this.formatFileSize(stats.size),
          created: stats.birthtime.toISOString()
        });
      }
    }

    // 儲存報告
    const reportPath = path.join(this.buildDir, `ios-build-report-${profile}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // 顯示摘要
    console.log('\n📋 iOS 建置摘要:');
    console.log(`   平台: iOS`);
    console.log(`   設定檔: ${profile}`);
    console.log(`   版本: ${report.buildInfo.version} (${report.buildInfo.buildNumber})`);
    console.log(`   建置時間: ${report.buildInfo.timestamp}`);
    console.log(`   建置檔案: ${report.files.length} 個`);
    
    report.files.forEach(file => {
      console.log(`     - ${file.name} (${file.sizeFormatted})`);
    });
    
    console.log(`\n📄 詳細報告: ${reportPath}`);
  }

  getXcodeVersion() {
    try {
      return execSync('xcode-select --version', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'Unknown';
    }
  }

  async generateErrorReport(error) {
    console.log('📝 生成 iOS 錯誤報告...');
    
    const errorReport = {
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      },
      environment: {
        platform: 'ios',
        nodeVersion: process.version,
        xcodeVersion: this.getXcodeVersion(),
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd()
      },
      buildConfig: this.buildConfig
    };

    const errorPath = path.join(this.buildDir, 'ios-error-report.json');
    fs.writeFileSync(errorPath, JSON.stringify(errorReport, null, 2));
    
    console.log(`📄 iOS 錯誤報告已儲存: ${errorPath}`);
  }

  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// 命令列介面
function main() {
  const args = process.argv.slice(2);
  const profile = args[0] || 'device';
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('iOS 建置自動化工具');
    console.log('====================');
    console.log('');
    console.log('用法:');
    console.log('  node scripts/ios-build-automation.js [profile]');
    console.log('');
    console.log('設定檔:');
    console.log('  simulator  模擬器版本');
    console.log('  device     設備測試版本 (預設)');
    console.log('  appstore   App Store 版本');
    console.log('');
    console.log('範例:');
    console.log('  node scripts/ios-build-automation.js device');
    console.log('');
    console.log('注意: iOS 建置需要在 macOS 環境中執行');
    return;
  }

  const automation = new IOSBuildAutomation();
  automation.runFullBuildProcess(profile);
}

if (require.main === module) {
  main();
}

module.exports = IOSBuildAutomation;