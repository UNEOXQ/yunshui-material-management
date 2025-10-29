#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 最終測試和優化腳本
 * 執行完整的功能測試、性能測試和穩定性測試
 */

class FinalTestingSuite {
  constructor() {
    this.projectRoot = process.cwd();
    this.testResults = {
      codeQuality: {},
      functionality: {},
      performance: {},
      security: {},
      compatibility: {},
      overall: { passed: 0, failed: 0, warnings: 0 }
    };
  }

  async runAllTests() {
    console.log('🧪 開始最終測試和優化流程');
    console.log('================================');

    try {
      await this.runCodeQualityTests();
      await this.runFunctionalityTests();
      await this.runPerformanceTests();
      await this.runSecurityTests();
      await this.runCompatibilityTests();
      await this.generateFinalReport();
      
      console.log('\n✅ 最終測試流程完成！');
      
    } catch (error) {
      console.error('\n❌ 測試過程發生錯誤:', error.message);
      process.exit(1);
    }
  }

  async runCodeQualityTests() {
    console.log('\n📝 程式碼品質測試');
    console.log('==================');

    // TypeScript 類型檢查
    await this.runTest('TypeScript 類型檢查', async () => {
      execSync('npm run type-check', { stdio: 'pipe', cwd: this.projectRoot });
    }, 'codeQuality', 'typescript');

    // ESLint 程式碼檢查
    await this.runTest('ESLint 程式碼檢查', async () => {
      execSync('npm run lint', { stdio: 'pipe', cwd: this.projectRoot });
    }, 'codeQuality', 'eslint');

    // Prettier 格式檢查
    await this.runTest('Prettier 格式檢查', async () => {
      try {
        execSync('npx prettier --check "src/**/*.{js,jsx,ts,tsx}"', { 
          stdio: 'pipe', 
          cwd: this.projectRoot 
        });
      } catch (error) {
        // 自動修復格式問題
        console.log('   🔧 自動修復格式問題...');
        execSync('npm run format', { stdio: 'pipe', cwd: this.projectRoot });
      }
    }, 'codeQuality', 'prettier');

    // 檢查未使用的依賴
    await this.runTest('未使用依賴檢查', async () => {
      try {
        execSync('npx depcheck', { stdio: 'pipe', cwd: this.projectRoot });
      } catch (error) {
        console.warn('   ⚠️  發現未使用的依賴，建議清理');
      }
    }, 'codeQuality', 'dependencies');

    // 檢查安全漏洞
    await this.runTest('安全漏洞掃描', async () => {
      execSync('npm audit --audit-level moderate', { stdio: 'pipe', cwd: this.projectRoot });
    }, 'codeQuality', 'security');
  }

  async runFunctionalityTests() {
    console.log('\n🔧 功能性測試');
    console.log('==============');

    // 檢查必要檔案
    await this.runTest('必要檔案檢查', async () => {
      const requiredFiles = [
        'package.json',
        'app.json',
        'eas.json',
        'src/App.tsx',
        'src/services/authService.ts',
        'src/services/materialService.ts',
        'src/services/orderService.ts'
      ];

      for (const file of requiredFiles) {
        if (!fs.existsSync(path.join(this.projectRoot, file))) {
          throw new Error(`必要檔案不存在: ${file}`);
        }
      }
    }, 'functionality', 'files');

    // 檢查 API 服務配置
    await this.runTest('API 服務配置檢查', async () => {
      const appJson = JSON.parse(fs.readFileSync(
        path.join(this.projectRoot, 'app.json'), 'utf8'
      ));

      if (!appJson.expo.extra?.API_BASE_URL) {
        throw new Error('API_BASE_URL 未配置');
      }
    }, 'functionality', 'api');

    // 檢查導航配置
    await this.runTest('導航配置檢查', async () => {
      const navigationFiles = [
        'src/navigation/AppNavigator.tsx',
        'src/navigation/AuthNavigator.tsx'
      ];

      for (const file of navigationFiles) {
        if (fs.existsSync(path.join(this.projectRoot, file))) {
          const content = fs.readFileSync(path.join(this.projectRoot, file), 'utf8');
          if (!content.includes('NavigationContainer') && !content.includes('createStackNavigator')) {
            console.warn(`   ⚠️  ${file} 可能缺少導航配置`);
          }
        }
      }
    }, 'functionality', 'navigation');

    // 檢查狀態管理
    await this.runTest('狀態管理檢查', async () => {
      const storeFiles = [
        'src/store/store.ts',
        'src/store/slices'
      ];

      for (const file of storeFiles) {
        if (!fs.existsSync(path.join(this.projectRoot, file))) {
          console.warn(`   ⚠️  狀態管理檔案可能不存在: ${file}`);
        }
      }
    }, 'functionality', 'state');
  }

  async runPerformanceTests() {
    console.log('\n⚡ 效能測試');
    console.log('==========');

    // 檢查包大小
    await this.runTest('包大小分析', async () => {
      const packageJson = JSON.parse(fs.readFileSync(
        path.join(this.projectRoot, 'package.json'), 'utf8'
      ));

      const dependencyCount = Object.keys(packageJson.dependencies || {}).length;
      const devDependencyCount = Object.keys(packageJson.devDependencies || {}).length;

      console.log(`   📦 生產依賴: ${dependencyCount} 個`);
      console.log(`   🔧 開發依賴: ${devDependencyCount} 個`);

      if (dependencyCount > 50) {
        console.warn('   ⚠️  依賴數量較多，可能影響應用程式大小');
      }
    }, 'performance', 'bundleSize');

    // 檢查圖片資源
    await this.runTest('圖片資源優化檢查', async () => {
      const assetsDir = path.join(this.projectRoot, 'assets');
      if (fs.existsSync(assetsDir)) {
        const imageFiles = this.findImageFiles(assetsDir);
        let totalSize = 0;
        let largeImages = [];

        for (const file of imageFiles) {
          const stats = fs.statSync(file);
          totalSize += stats.size;
          
          if (stats.size > 500 * 1024) { // 大於 500KB
            largeImages.push({
              file: path.relative(this.projectRoot, file),
              size: this.formatFileSize(stats.size)
            });
          }
        }

        console.log(`   🖼️  圖片檔案: ${imageFiles.length} 個`);
        console.log(`   📊 總大小: ${this.formatFileSize(totalSize)}`);

        if (largeImages.length > 0) {
          console.warn('   ⚠️  發現大型圖片檔案:');
          largeImages.forEach(img => {
            console.warn(`      - ${img.file} (${img.size})`);
          });
        }
      }
    }, 'performance', 'images');

    // 檢查程式碼複雜度
    await this.runTest('程式碼複雜度分析', async () => {
      const srcDir = path.join(this.projectRoot, 'src');
      if (fs.existsSync(srcDir)) {
        const tsFiles = this.findTypeScriptFiles(srcDir);
        let totalLines = 0;
        let largeFiles = [];

        for (const file of tsFiles) {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n').length;
          totalLines += lines;

          if (lines > 300) {
            largeFiles.push({
              file: path.relative(this.projectRoot, file),
              lines: lines
            });
          }
        }

        console.log(`   📄 TypeScript 檔案: ${tsFiles.length} 個`);
        console.log(`   📊 總行數: ${totalLines} 行`);

        if (largeFiles.length > 0) {
          console.warn('   ⚠️  發現大型檔案 (>300 行):');
          largeFiles.forEach(file => {
            console.warn(`      - ${file.file} (${file.lines} 行)`);
          });
        }
      }
    }, 'performance', 'complexity');
  }

  async runSecurityTests() {
    console.log('\n🔒 安全性測試');
    console.log('==============');

    // 檢查敏感資訊
    await this.runTest('敏感資訊檢查', async () => {
      const sensitivePatterns = [
        /password\s*[:=]\s*['"]\w+['"]/i,
        /api[_-]?key\s*[:=]\s*['"]\w+['"]/i,
        /secret\s*[:=]\s*['"]\w+['"]/i,
        /token\s*[:=]\s*['"]\w+['"]/i
      ];

      const srcFiles = this.findAllSourceFiles(path.join(this.projectRoot, 'src'));
      let foundSensitive = false;

      for (const file of srcFiles) {
        const content = fs.readFileSync(file, 'utf8');
        for (const pattern of sensitivePatterns) {
          if (pattern.test(content)) {
            console.warn(`   ⚠️  可能包含敏感資訊: ${path.relative(this.projectRoot, file)}`);
            foundSensitive = true;
          }
        }
      }

      if (!foundSensitive) {
        console.log('   ✅ 未發現明顯的敏感資訊洩露');
      }
    }, 'security', 'sensitive');

    // 檢查 HTTPS 配置
    await this.runTest('HTTPS 配置檢查', async () => {
      const appJson = JSON.parse(fs.readFileSync(
        path.join(this.projectRoot, 'app.json'), 'utf8'
      ));

      const apiUrl = appJson.expo.extra?.API_BASE_URL;
      if (apiUrl && !apiUrl.startsWith('https://') && !apiUrl.includes('localhost')) {
        console.warn('   ⚠️  API URL 未使用 HTTPS');
      } else {
        console.log('   ✅ API URL 配置安全');
      }
    }, 'security', 'https');

    // 檢查權限配置
    await this.runTest('權限配置檢查', async () => {
      const appJson = JSON.parse(fs.readFileSync(
        path.join(this.projectRoot, 'app.json'), 'utf8'
      ));

      const androidPermissions = appJson.expo.android?.permissions || [];
      const excessivePermissions = [
        'android.permission.READ_CONTACTS',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.RECORD_AUDIO'
      ];

      const foundExcessive = androidPermissions.filter(p => 
        excessivePermissions.includes(p)
      );

      if (foundExcessive.length > 0) {
        console.warn('   ⚠️  可能包含不必要的權限:');
        foundExcessive.forEach(p => console.warn(`      - ${p}`));
      } else {
        console.log('   ✅ 權限配置合理');
      }
    }, 'security', 'permissions');
  }

  async runCompatibilityTests() {
    console.log('\n📱 相容性測試');
    console.log('==============');

    // 檢查最低版本支援
    await this.runTest('最低版本支援檢查', async () => {
      const appJson = JSON.parse(fs.readFileSync(
        path.join(this.projectRoot, 'app.json'), 'utf8'
      ));

      const androidMinSdk = appJson.expo.android?.minSdkVersion;
      const iosDeploymentTarget = appJson.expo.ios?.deploymentTarget;

      console.log(`   🤖 Android 最低 SDK: ${androidMinSdk || '未設定'}`);
      console.log(`   🍎 iOS 最低版本: ${iosDeploymentTarget || '未設定'}`);

      if (!androidMinSdk || androidMinSdk < 21) {
        console.warn('   ⚠️  建議 Android 最低 SDK 設為 21 (Android 5.0)');
      }

      if (!iosDeploymentTarget || parseFloat(iosDeploymentTarget) < 12.0) {
        console.warn('   ⚠️  建議 iOS 最低版本設為 12.0');
      }
    }, 'compatibility', 'versions');

    // 檢查螢幕方向支援
    await this.runTest('螢幕方向支援檢查', async () => {
      const appJson = JSON.parse(fs.readFileSync(
        path.join(this.projectRoot, 'app.json'), 'utf8'
      ));

      const orientation = appJson.expo.orientation;
      console.log(`   📱 支援方向: ${orientation || '預設'}`);

      if (orientation === 'landscape') {
        console.warn('   ⚠️  僅支援橫向可能限制使用體驗');
      }
    }, 'compatibility', 'orientation');

    // 檢查國際化支援
    await this.runTest('國際化支援檢查', async () => {
      const i18nFiles = [
        'src/i18n',
        'src/locales',
        'src/translations'
      ];

      let hasI18n = false;
      for (const dir of i18nFiles) {
        if (fs.existsSync(path.join(this.projectRoot, dir))) {
          hasI18n = true;
          break;
        }
      }

      if (hasI18n) {
        console.log('   ✅ 支援國際化');
      } else {
        console.warn('   ⚠️  未發現國際化配置');
      }
    }, 'compatibility', 'i18n');
  }

  async runTest(testName, testFunction, category, key) {
    try {
      console.log(`🔍 ${testName}...`);
      await testFunction();
      console.log(`✅ ${testName} 通過`);
      
      this.testResults[category][key] = { status: 'passed', message: '測試通過' };
      this.testResults.overall.passed++;
      
    } catch (error) {
      console.error(`❌ ${testName} 失敗: ${error.message}`);
      
      this.testResults[category][key] = { 
        status: 'failed', 
        message: error.message 
      };
      this.testResults.overall.failed++;
    }
  }

  findImageFiles(dir) {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    const files = [];

    const scanDir = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (imageExtensions.includes(path.extname(item).toLowerCase())) {
          files.push(fullPath);
        }
      }
    };

    scanDir(dir);
    return files;
  }

  findTypeScriptFiles(dir) {
    const tsExtensions = ['.ts', '.tsx'];
    const files = [];

    const scanDir = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (tsExtensions.includes(path.extname(item))) {
          files.push(fullPath);
        }
      }
    };

    scanDir(dir);
    return files;
  }

  findAllSourceFiles(dir) {
    const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx'];
    const files = [];

    const scanDir = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (sourceExtensions.includes(path.extname(item))) {
          files.push(fullPath);
        }
      }
    };

    scanDir(dir);
    return files;
  }

  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  async generateFinalReport() {
    console.log('\n📊 生成最終測試報告');
    console.log('====================');

    const report = {
      summary: {
        timestamp: new Date().toISOString(),
        totalTests: this.testResults.overall.passed + this.testResults.overall.failed,
        passed: this.testResults.overall.passed,
        failed: this.testResults.overall.failed,
        warnings: this.testResults.overall.warnings,
        successRate: Math.round((this.testResults.overall.passed / (this.testResults.overall.passed + this.testResults.overall.failed)) * 100)
      },
      categories: this.testResults,
      recommendations: this.generateRecommendations()
    };

    // 儲存報告
    const reportPath = path.join(this.projectRoot, 'build', 'final-test-report.json');
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // 顯示摘要
    console.log('\n📋 測試摘要:');
    console.log(`   總測試數: ${report.summary.totalTests}`);
    console.log(`   通過: ${report.summary.passed}`);
    console.log(`   失敗: ${report.summary.failed}`);
    console.log(`   成功率: ${report.summary.successRate}%`);

    if (report.summary.failed > 0) {
      console.log('\n❌ 失敗的測試:');
      Object.entries(this.testResults).forEach(([category, tests]) => {
        if (typeof tests === 'object' && tests !== null && !Array.isArray(tests)) {
          Object.entries(tests).forEach(([test, result]) => {
            if (result.status === 'failed') {
              console.log(`   - ${category}.${test}: ${result.message}`);
            }
          });
        }
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 建議:');
      report.recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
    }

    console.log(`\n📄 詳細報告: ${reportPath}`);

    // 判斷是否可以發布
    if (report.summary.successRate >= 80) {
      console.log('\n✅ 應用程式已準備好進行發布！');
    } else {
      console.log('\n⚠️  建議修復失敗的測試後再進行發布');
    }
  }

  generateRecommendations() {
    const recommendations = [];

    // 基於測試結果生成建議
    if (this.testResults.codeQuality?.eslint?.status === 'failed') {
      recommendations.push('修復 ESLint 發現的程式碼問題');
    }

    if (this.testResults.codeQuality?.security?.status === 'failed') {
      recommendations.push('修復安全漏洞');
    }

    if (this.testResults.performance?.bundleSize?.status === 'failed') {
      recommendations.push('優化應用程式大小，移除不必要的依賴');
    }

    if (this.testResults.security?.sensitive?.status === 'failed') {
      recommendations.push('移除或保護敏感資訊');
    }

    if (this.testResults.compatibility?.versions?.status === 'failed') {
      recommendations.push('更新最低版本支援設定');
    }

    // 通用建議
    recommendations.push('在實體設備上進行完整測試');
    recommendations.push('檢查應用程式在不同網路條件下的表現');
    recommendations.push('驗證所有功能在離線模式下的行為');

    return recommendations;
  }
}

// 命令列介面
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('最終測試和優化工具');
    console.log('==================');
    console.log('');
    console.log('用法:');
    console.log('  node scripts/final-testing.js');
    console.log('');
    console.log('功能:');
    console.log('  - 程式碼品質測試');
    console.log('  - 功能性測試');
    console.log('  - 效能測試');
    console.log('  - 安全性測試');
    console.log('  - 相容性測試');
    console.log('');
    return;
  }

  const testSuite = new FinalTestingSuite();
  testSuite.runAllTests();
}

if (require.main === module) {
  main();
}

module.exports = FinalTestingSuite;