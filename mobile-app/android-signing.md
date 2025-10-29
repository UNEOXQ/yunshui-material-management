# Android 應用程式簽名設定

## 概述

為了發布到 Google Play Store 或進行正式發布，Android 應用程式需要進行數位簽名。本文件說明如何設定和管理應用程式簽名。

## 簽名類型

### 1. Debug 簽名
- **用途**: 開發和測試
- **特點**: 自動生成，不需要手動設定
- **有效期**: 1年
- **安全性**: 低

### 2. Release 簽名
- **用途**: 正式發布
- **特點**: 需要手動生成和管理
- **有效期**: 25年以上
- **安全性**: 高

## 生成 Release Keystore

### 使用 keytool 生成

```bash
# 生成新的 keystore
keytool -genkeypair -v -keystore yunshui-release.keystore -alias yunshui-key -keyalg RSA -keysize 2048 -validity 10000

# 參數說明:
# -keystore: keystore 檔案名稱
# -alias: 金鑰別名
# -keyalg: 加密演算法
# -keysize: 金鑰大小
# -validity: 有效期 (天數)
```

### 填寫資訊範例

```
您的姓名與姓氏是什麼？
  [Unknown]:  YunShui Tech Team

您的組織單位名稱是什麼？
  [Unknown]:  Development

您的組織名稱是什麼？
  [Unknown]:  YunShui Technology

您所在的城市或地區名稱是什麼？
  [Unknown]:  Taipei

您所在的省/市/自治區名稱是什麼？
  [Unknown]:  Taiwan

該單位的雙字母國家/地區代碼是什麼？
  [Unknown]:  TW

CN=YunShui Tech Team, OU=Development, O=YunShui Technology, L=Taipei, ST=Taiwan, C=TW 是否正確？
  [否]:  是

輸入 <yunshui-key> 的金鑰密碼
        (如果和 keystore 密碼相同, 按 ENTER):
```

## EAS Build 簽名設定

### 1. 上傳 Keystore 到 EAS

```bash
# 上傳 keystore
eas credentials

# 選擇:
# ? Select platform › Android
# ? What do you want to do? › Build credentials
# ? Select build credentials › keystore
# ? What do you want to do? › Upload a new keystore
```

### 2. 設定 eas.json

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "aab",
        "gradleCommand": ":app:bundleRelease"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

## 本地簽名設定

### 1. 建立 gradle.properties

在專案根目錄建立 `android/gradle.properties`:

```properties
# 簽名設定
MYAPP_RELEASE_STORE_FILE=yunshui-release.keystore
MYAPP_RELEASE_KEY_ALIAS=yunshui-key
MYAPP_RELEASE_STORE_PASSWORD=your_keystore_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password
```

### 2. 設定 build.gradle

在 `android/app/build.gradle` 中添加:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

## 安全性最佳實踐

### 1. Keystore 管理
- **備份**: 將 keystore 檔案備份到安全位置
- **密碼**: 使用強密碼並妥善保管
- **存取控制**: 限制 keystore 檔案的存取權限
- **版本控制**: 不要將 keystore 檔案提交到版本控制系統

### 2. 密碼管理
- 使用環境變數儲存密碼
- 不要在程式碼中硬編碼密碼
- 定期更換密碼

### 3. 檔案權限
```bash
# 設定 keystore 檔案權限 (僅擁有者可讀寫)
chmod 600 yunshui-release.keystore

# 設定 gradle.properties 權限
chmod 600 gradle.properties
```

## 驗證簽名

### 檢查 APK 簽名

```bash
# 使用 jarsigner 檢查
jarsigner -verify -verbose -certs app-release.apk

# 使用 apksigner 檢查 (Android SDK)
apksigner verify --verbose app-release.apk
```

### 檢查簽名資訊

```bash
# 查看 keystore 資訊
keytool -list -v -keystore yunshui-release.keystore

# 查看 APK 簽名資訊
keytool -printcert -jarfile app-release.apk
```

## 疑難排解

### 常見問題

#### 1. "keystore was tampered with, or password was incorrect"
**原因**: keystore 密碼錯誤或檔案損壞
**解決方案**: 檢查密碼或使用備份的 keystore

#### 2. "Entry not found for alias"
**原因**: 金鑰別名不存在
**解決方案**: 檢查別名是否正確

#### 3. "Failed to read key from keystore"
**原因**: 金鑰密碼錯誤
**解決方案**: 檢查金鑰密碼

### 緊急情況處理

#### 遺失 Keystore
如果遺失了 release keystore：
1. 無法更新現有應用程式
2. 需要以新的 package name 重新發布
3. 用戶需要解除安裝舊版本

#### 忘記密碼
如果忘記 keystore 或金鑰密碼：
1. 無法使用該 keystore
2. 需要生成新的 keystore
3. 按照遺失 keystore 的處理流程

## 自動化腳本

### 簽名檢查腳本

```bash
#!/bin/bash
# check-signing.sh

APK_FILE=$1

if [ -z "$APK_FILE" ]; then
    echo "用法: $0 <apk-file>"
    exit 1
fi

echo "檢查 APK 簽名: $APK_FILE"
echo "================================"

# 檢查簽名
if jarsigner -verify "$APK_FILE"; then
    echo "✅ APK 簽名有效"
else
    echo "❌ APK 簽名無效"
    exit 1
fi

# 顯示簽名資訊
echo ""
echo "簽名詳細資訊:"
keytool -printcert -jarfile "$APK_FILE"
```

### 批量簽名腳本

```bash
#!/bin/bash
# batch-sign.sh

KEYSTORE_FILE="yunshui-release.keystore"
KEY_ALIAS="yunshui-key"

for apk in *.apk; do
    if [ -f "$apk" ]; then
        echo "簽名 APK: $apk"
        jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore "$KEYSTORE_FILE" "$apk" "$KEY_ALIAS"
        
        # 對齊 APK
        zipalign -v 4 "$apk" "${apk%.apk}-aligned.apk"
        
        echo "✅ 完成: ${apk%.apk}-aligned.apk"
    fi
done
```

## 相關資源

- [Android 開發者文件 - 應用程式簽名](https://developer.android.com/studio/publish/app-signing)
- [Expo 文件 - 應用程式簽名](https://docs.expo.dev/app-signing/app-credentials/)
- [Google Play Console 說明](https://support.google.com/googleplay/android-developer/)

---

**重要提醒**: 請務必妥善保管 keystore 檔案和密碼，遺失後將無法更新應用程式！