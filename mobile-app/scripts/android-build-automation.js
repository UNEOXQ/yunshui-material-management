#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Android 建置自動化腳本
 * 提供完整的 Android 建置流程自動化
 */

class AndroidBuildAutomation {
  constructor() {
    this.projectRoot = process.cwd();
    this.androidDir = path.join(this.projectRoot, 'android');
    this.buildDir = path.join(this.projectRoot, 'build');
    this.configDir = path.join(this.projectRoot, 'android-config');
    
    this.buildConfig = {
      profiles: {
        debug: {
          buildType: 'debug',
          minify: false,
          shrinkResources: false,
          debuggable: true,
          signingConfig: 'debug'
        },
        preview: {
          buildType: 'release',
          minify: true,
          shrinkResources: true,
          debuggable: false,
          signingConfig: 'release',
          outputType: 'apk'
        },
        production: {
          buildType: 'release',
          minify: true,
          shrinkResources: true,
          debuggable: false,
          signingConfig: 'release',
          outputType: 'aab'
        }
      }
    };
  }

  async runFullBuildProcess(profile = 'preview') {
    console.log('🚀 Android 建置自動化流程開始');
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
      
      console.log('\n✅ 建置流程完成！');
      
    } catch (error) {
      console.error('\n❌ 建置失敗:', error.message);
      await this.generateErrorReport(error);
      process.exit(1);
    }
  }

  async validateEnvironment() {
    console.log('🔍 驗證建置環境...');
    
    // 檢查 Node.js
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      console.log(`✅ Node.js: ${nodeVersion}`);
    } catch (error) {
      throw new Error('Node.js 未安裝或無法執行');
    }

    // 檢查 npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`✅ npm: ${npmVersion}`);
    } catch (error) {
      throw new Error('npm 未安裝或無法執行');
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

    console.log('✅ 環境驗證完成');
  }

  async prepareProject() {
    console.log('📦 準備專案...');
    
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
      file.endsWith('.apk') || file.endsWith('.aab')
    );
    
    if (buildFiles.length > 0) {
      console.log('🧹 清理舊的建置檔案...');
      buildFiles.forEach(file => {
        fs.unlinkSync(path.join(this.buildDir, file));
      });
    }

    console.log('✅ 專案準備完成');
  }

  async setupBuildConfiguration(profile) {
    console.log('⚙️  設置建置配置...');
    
    const config = this.buildConfig.profiles[profile];
    if (!config) {
      throw new Error(`無效的建置設定檔: ${profile}`);
    }

    // 更新版本資訊
    await this.updateVersionInfo();
    
    // 設置環境變數
    process.env.BUILD_PROFILE = profile;
    process.env.BUILD_TYPE = config.buildType;
    process.env.BUILD_TIMESTAMP = new Date().toISOString();
    
    console.log(`✅ 建置配置設置完成 (${profile})`);
  }

  async updateVersionInfo() {
    console.log('🏷️  更新版本資訊...');
    
    const packageJson = JSON.parse(fs.readFileSync(
      path.join(this.projectRoot, 'package.json'), 'utf8'
    ));
    
    const appJson = JSON.parse(fs.readFileSync(
      path.join(this.projectRoot, 'app.json'), 'utf8'
    ));

    // 自動增加版本代碼
    const currentVersionCode = appJson.expo.android?.versionCode || 1;
    appJson.expo.android = appJson.expo.android || {};
    appJson.expo.android.versionCode = currentVersionCode + 1;

    // 更新建置時間
    appJson.expo.extra = appJson.expo.extra || {};
    appJson.expo.extra.BUILD_TIME = new Date().toISOString();
    appJson.expo.extra.BUILD_HASH = this.generateBuildHash();

    // 儲存更新的配置
    fs.writeFileSync(
      path.join(this.projectRoot, 'app.json'),
      JSON.stringify(appJson, null, 2)
    );

    console.log(`✅ 版本更新: ${appJson.expo.version} (${appJson.expo.android.versionCode})`);
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
    console.log('🔍 執行建置前檢查...');
    
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

    console.log('✅ 建置前檢查完成');
  }

  async buildApplication(profile) {
    console.log(`🔨 開始建置應用程式 (${profile})...`);
    
    const config = this.buildConfig.profiles[profile];
    const buildCommand = `eas build --platform android --profile ${profile} --non-interactive`;
    
    console.log(`執行命令: ${buildCommand}`);
    
    const startTime = Date.now();
    
    try {
      execSync(buildCommand, { 
        stdio: 'inherit',
        cwd: this.projectRoot,
        env: { ...process.env }
      });
      
      const buildTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`✅ 建置完成，耗時: ${buildTime} 秒`);
      
    } catch (error) {
      throw new Error(`建置失敗: ${error.message}`);
    }
  }

  async postBuildProcessing(profile) {
    console.log('🔄 執行建置後處理...');
    
    // 下載建置檔案 (如果是雲端建置)
    try {
      console.log('📥 檢查建置輸出...');
      
      // 這裡可以添加下載邏輯
      // 或者檢查本地建置輸出
      
    } catch (error) {
      console.warn('⚠️  無法下載建置檔案:', error.message);
    }

    // 生成檔案校驗和
    await this.generateChecksums();
    
    console.log('✅ 建置後處理完成');
  }

  async generateChecksums() {
    console.log('🔐 生成檔案校驗和...');
    
    const buildFiles = fs.readdirSync(this.buildDir).filter(file => 
      file.endsWith('.apk') || file.endsWith('.aab')
    );

    const checksums = {};
    
    for (const file of buildFiles) {
      const filePath = path.join(this.buildDir, file);
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      checksums[file] = {
        sha256: hash,
        size: fileBuffer.length,
        created: new Date().toISOString()
      };
    }

    if (Object.keys(checksums).length > 0) {
      fs.writeFileSync(
        path.join(this.buildDir, 'checksums.json'),
        JSON.stringify(checksums, null, 2)
      );
      console.log('✅ 校驗和檔案已生成');
    }
  }

  async generateBuildReport(profile) {
    console.log('📊 生成建置報告...');
    
    const packageJson = JSON.parse(fs.readFileSync(
      path.join(this.projectRoot, 'package.json'), 'utf8'
    ));
    
    const appJson = JSON.parse(fs.readFileSync(
      path.join(this.projectRoot, 'app.json'), 'utf8'
    ));

    const report = {
      buildInfo: {
        profile: profile,
        timestamp: new Date().toISOString(),
        version: appJson.expo.version,
        versionCode: appJson.expo.android?.versionCode,
        buildHash: appJson.expo.extra?.BUILD_HASH
      },
      environment: {
        nodeVersion: execSync('node --version', { encoding: 'utf8' }).trim(),
        npmVersion: execSync('npm --version', { encoding: 'utf8' }).trim(),
        platform: process.platform,
        arch: process.arch
      },
      configuration: this.buildConfig.profiles[profile],
      files: []
    };

    // 添加建置檔案資訊
    const buildFiles = fs.readdirSync(this.buildDir).filter(file => 
      file.endsWith('.apk') || file.endsWith('.aab')
    );

    for (const file of buildFiles) {
      const filePath = path.join(this.buildDir, file);
      const stats = fs.statSync(filePath);
      report.files.push({
        name: file,
        size: stats.size,
        sizeFormatted: this.formatFileSize(stats.size),
        created: stats.birthtime.toISOString()
      });
    }

    // 儲存報告
    const reportPath = path.join(this.buildDir, `build-report-${profile}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // 顯示摘要
    console.log('\n📋 建置摘要:');
    console.log(`   設定檔: ${profile}`);
    console.log(`   版本: ${report.buildInfo.version} (${report.buildInfo.versionCode})`);
    console.log(`   建置時間: ${report.buildInfo.timestamp}`);
    console.log(`   建置檔案: ${report.files.length} 個`);
    
    report.files.forEach(file => {
      console.log(`     - ${file.name} (${file.sizeFormatted})`);
    });
    
    console.log(`\n📄 詳細報告: ${reportPath}`);
  }

  async generateErrorReport(error) {
    console.log('📝 生成錯誤報告...');
    
    const errorReport = {
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd()
      },
      buildConfig: this.buildConfig
    };

    const errorPath = path.join(this.buildDir, 'error-report.json');
    fs.writeFileSync(errorPath, JSON.stringify(errorReport, null, 2));
    
    console.log(`📄 錯誤報告已儲存: ${errorPath}`);
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
  const profile = args[0] || 'preview';
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Android 建置自動化工具');
    console.log('========================');
    console.log('');
    console.log('用法:');
    console.log('  node scripts/android-build-automation.js [profile]');
    console.log('');
    console.log('設定檔:');
    console.log('  debug      除錯版本');
    console.log('  preview    預覽版本 (預設)');
    console.log('  production 正式版本');
    console.log('');
    console.log('範例:');
    console.log('  node scripts/android-build-automation.js preview');
    return;
  }

  const automation = new AndroidBuildAutomation();
  automation.runFullBuildProcess(profile);
}

if (require.main === module) {
  main();
}

module.exports = AndroidBuildAutomation;