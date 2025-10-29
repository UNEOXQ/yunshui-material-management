#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 版本管理工具
 * 用於自動更新 package.json 和 app.json 中的版本號
 */

class VersionManager {
  constructor() {
    this.packageJsonPath = path.join(process.cwd(), 'package.json');
    this.appJsonPath = path.join(process.cwd(), 'app.json');
  }

  getCurrentVersion() {
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    return packageJson.version;
  }

  getCurrentVersionCode() {
    const appJson = JSON.parse(fs.readFileSync(this.appJsonPath, 'utf8'));
    return appJson.expo.android?.versionCode || 1;
  }

  updateVersion(newVersion, incrementVersionCode = true) {
    // 更新 package.json
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    // 更新 app.json
    const appJson = JSON.parse(fs.readFileSync(this.appJsonPath, 'utf8'));
    appJson.expo.version = newVersion;
    
    if (incrementVersionCode) {
      const currentVersionCode = appJson.expo.android?.versionCode || 1;
      appJson.expo.android = appJson.expo.android || {};
      appJson.expo.android.versionCode = currentVersionCode + 1;
    }

    // 更新 extra 中的版本資訊
    appJson.expo.extra = appJson.expo.extra || {};
    appJson.expo.extra.APP_VERSION = newVersion;

    fs.writeFileSync(this.appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

    console.log(`✅ 版本已更新為: ${newVersion}`);
    console.log(`📱 Android versionCode: ${appJson.expo.android.versionCode}`);
  }

  bumpVersion(type = 'patch') {
    const currentVersion = this.getCurrentVersion();
    const versionParts = currentVersion.split('.').map(Number);
    
    switch (type) {
      case 'major':
        versionParts[0]++;
        versionParts[1] = 0;
        versionParts[2] = 0;
        break;
      case 'minor':
        versionParts[1]++;
        versionParts[2] = 0;
        break;
      case 'patch':
      default:
        versionParts[2]++;
        break;
    }

    const newVersion = versionParts.join('.');
    this.updateVersion(newVersion);
    return newVersion;
  }

  showCurrentVersion() {
    const version = this.getCurrentVersion();
    const versionCode = this.getCurrentVersionCode();
    
    console.log('📋 當前版本資訊:');
    console.log(`   版本號: ${version}`);
    console.log(`   Android versionCode: ${versionCode}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const versionManager = new VersionManager();

  switch (command) {
    case 'show':
    case 'current':
      versionManager.showCurrentVersion();
      break;

    case 'bump':
      const type = args[1] || 'patch';
      if (!['major', 'minor', 'patch'].includes(type)) {
        console.error('❌ 無效的版本類型。請使用: major, minor, patch');
        process.exit(1);
      }
      versionManager.bumpVersion(type);
      break;

    case 'set':
      const newVersion = args[1];
      if (!newVersion) {
        console.error('❌ 請提供新的版本號');
        process.exit(1);
      }
      if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
        console.error('❌ 版本號格式錯誤。請使用 x.y.z 格式');
        process.exit(1);
      }
      versionManager.updateVersion(newVersion);
      break;

    case 'help':
    default:
      console.log('雲水基材管理系統 - 版本管理工具');
      console.log('================================');
      console.log('');
      console.log('用法:');
      console.log('  node scripts/version-manager.js <command> [options]');
      console.log('');
      console.log('命令:');
      console.log('  show              顯示當前版本');
      console.log('  bump [type]       自動增加版本號 (major|minor|patch)');
      console.log('  set <version>     設定特定版本號');
      console.log('  help              顯示此說明');
      console.log('');
      console.log('範例:');
      console.log('  node scripts/version-manager.js show');
      console.log('  node scripts/version-manager.js bump patch');
      console.log('  node scripts/version-manager.js set 1.2.3');
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = VersionManager;