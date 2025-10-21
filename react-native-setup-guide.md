# 📱 React Native APP 開發指南

## 🎯 **為什麼選擇 React Native + Expo？**

### **✅ 完美符合你的需求**
- **一套代碼**: iOS + Android 同時搞定
- **共用後端**: 直接使用現有的 Node.js API
- **快速開發**: 你已經熟悉 React，學習成本低
- **熱更新**: 不用重新上架就能更新功能

### **✅ 與現有系統完美整合**
```
現有系統架構:
PC網頁 ←→ Node.js後端 ←→ 資料庫
                ↕
         手機APP (新增)
```

---

## 🛠 **開發環境設定**

### **安裝必要工具**
```bash
# 1. 安裝 Node.js (已有)
# 2. 安裝 Expo CLI
npm install -g @expo/cli

# 3. 安裝 EAS CLI (用於打包APP)
npm install -g eas-cli

# 4. 創建 Expo 帳號
expo register
```

### **創建APP專案**
```bash
# 在你的專案根目錄
npx create-expo-app yunshui-mobile --template blank-typescript

cd yunshui-mobile
```

---

## 📱 **APP架構設計**

### **專案結構**
```
yunshui-mobile/
├── 📱 App.tsx                 # 主入口
├── 📂 src/
│   ├── 🧭 navigation/         # 導航配置
│   ├── 📄 screens/            # 頁面組件
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── OrdersScreen.tsx
│   │   └── InventoryScreen.tsx
│   ├── 🧩 components/         # 共用組件
│   │   ├── OrderCard.tsx
│   │   ├── MaterialCard.tsx
│   │   └── CustomButton.tsx
│   ├── 🔧 services/           # API服務 (重用現有)
│   │   ├── authService.ts
│   │   ├── orderService.ts
│   │   └── materialService.ts
│   ├── 🎨 styles/             # 樣式文件
│   └── 📊 types/              # TypeScript類型
└── 📦 package.json
```

### **核心依賴包**
```json
{
  "dependencies": {
    "expo": "~49.0.0",
    "react-native": "0.72.0",
    "@react-navigation/native": "^6.0.0",
    "@react-navigation/bottom-tabs": "^6.0.0",
    "@react-navigation/stack": "^6.0.0",
    "expo-camera": "~13.0.0",
    "expo-barcode-scanner": "~12.0.0",
    "expo-notifications": "~0.20.0",
    "expo-image-picker": "~14.0.0",
    "axios": "^1.0.0",
    "@tanstack/react-query": "^4.0.0",
    "react-native-paper": "^5.0.0"
  }
}
```

---

## 🎨 **手機UI設計**

### **底部導航設計**
```typescript
// src/navigation/BottomTabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: '首頁',
          tabBarIcon: ({ color }) => <Icon name="home" color={color} />
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersScreen}
        options={{
          title: '訂單',
          tabBarIcon: ({ color }) => <Icon name="list" color={color} />
        }}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen}
        options={{
          title: '庫存',
          tabBarIcon: ({ color }) => <Icon name="package" color={color} />
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => <Icon name="user" color={color} />
        }}
      />
    </Tab.Navigator>
  );
}
```

### **訂單卡片組件**
```typescript
// src/components/OrderCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Chip, Button } from 'react-native-paper';

interface OrderCardProps {
  order: {
    id: string;
    projectName: string;
    customerName: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  };
  onPress: () => void;
  onUpdateStatus: () => void;
}

export default function OrderCard({ order, onPress, onUpdateStatus }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#ffc107';
      case 'PROCESSING': return '#17a2b8';
      case 'COMPLETED': return '#28a745';
      default: return '#6c757d';
    }
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.orderId}>#{order.id}</Text>
          <Chip 
            mode="outlined" 
            textStyle={{ color: getStatusColor(order.status) }}
            style={{ borderColor: getStatusColor(order.status) }}
          >
            {order.status}
          </Chip>
        </View>
        
        <Text style={styles.projectName}>{order.projectName}</Text>
        <Text style={styles.customerName}>{order.customerName}</Text>
        
        <View style={styles.footer}>
          <Text style={styles.amount}>NT$ {order.totalAmount.toLocaleString()}</Text>
          <Text style={styles.date}>{new Date(order.createdAt).toLocaleDateString()}</Text>
        </View>
        
        <View style={styles.actions}>
          <Button mode="outlined" onPress={onPress} style={styles.button}>
            查看詳情
          </Button>
          <Button mode="contained" onPress={onUpdateStatus} style={styles.button}>
            更新狀態
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});
```

---

## 📷 **手機專用功能**

### **掃碼功能**
```typescript
// src/screens/BarcodeScannerScreen.tsx
import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

export default function BarcodeScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    
    // 查找材料
    searchMaterialByBarcode(data);
    
    // 返回上一頁並傳遞結果
    navigation.goBack();
  };

  const searchMaterialByBarcode = async (barcode: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/materials/search?barcode=${barcode}`);
      const material = await response.json();
      
      if (material) {
        // 顯示材料資訊
        // 可以直接進入庫存更新頁面
      }
    } catch (error) {
      console.error('搜尋材料失敗:', error);
    }
  };

  if (hasPermission === null) {
    return <Text>請求相機權限中...</Text>;
  }
  if (hasPermission === false) {
    return <Text>無法訪問相機</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && (
        <Button title={'再次掃描'} onPress={() => setScanned(false)} />
      )}
    </View>
  );
}
```

### **拍照上傳功能**
```typescript
// src/components/ImagePicker.tsx
import React from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export const useImagePicker = () => {
  const pickImage = async () => {
    // 請求權限
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要相機權限才能上傳照片');
      return;
    }

    // 顯示選項
    Alert.alert(
      '選擇照片',
      '請選擇照片來源',
      [
        { text: '相機', onPress: () => openCamera() },
        { text: '相簿', onPress: () => openGallery() },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0]);
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0]);
    }
  };

  const uploadImage = async (imageAsset) => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageAsset.uri,
      type: 'image/jpeg',
      name: 'material-photo.jpg',
    } as any);

    try {
      const response = await fetch(`${API_BASE_URL}/upload/material-image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const result = await response.json();
      return result.imageUrl;
    } catch (error) {
      console.error('上傳圖片失敗:', error);
      Alert.alert('上傳失敗', '請稍後再試');
    }
  };

  return { pickImage };
};
```

---

## 🔔 **推送通知**

### **通知設定**
```typescript
// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 設定通知處理方式
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotifications = async () => {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    alert('需要通知權限才能接收重要訊息！');
    return;
  }
  
  token = (await Notifications.getExpoPushTokenAsync()).data;
  
  // 將token發送到後端
  await registerTokenWithBackend(token);
  
  return token;
};

const registerTokenWithBackend = async (token: string) => {
  try {
    await fetch(`${API_BASE_URL}/notifications/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ pushToken: token }),
    });
  } catch (error) {
    console.error('註冊推送token失敗:', error);
  }
};
```

---

## 📦 **APP打包和發布**

### **開發測試**
```bash
# 在手機上測試 (需要安裝 Expo Go APP)
expo start

# 掃描QR碼在手機上預覽
```

### **打包APP**
```bash
# 配置 EAS
eas build:configure

# 打包 Android APK (測試用)
eas build --platform android --profile preview

# 打包正式版 (上架用)
eas build --platform all --profile production
```

### **上架流程**
```bash
# 提交到 App Store 和 Google Play
eas submit --platform all
```

---

## 🎯 **開發時程**

### **第1週: 基礎架構**
- [x] 設定 React Native + Expo 環境
- [x] 創建導航結構
- [x] 實現登入功能
- [x] 連接現有API

### **第2週: 核心功能**
- [ ] 訂單管理頁面 (手機優化)
- [ ] 庫存管理頁面 (手機優化)  
- [ ] 儀表板頁面
- [ ] 基本通知功能

### **第3週: 手機專用功能**
- [ ] 掃碼功能
- [ ] 拍照上傳
- [ ] 推送通知
- [ ] 手勢操作

### **第4週: 測試和優化**
- [ ] 功能測試
- [ ] 性能優化
- [ ] UI/UX 調整
- [ ] 準備上架

---

## 💡 **開發建議**

### **優先開發順序**
1. **登入功能** (復用現有API)
2. **訂單列表** (手機優化UI)
3. **訂單詳情** (觸控友好)
4. **掃碼功能** (手機專用)
5. **推送通知** (提升用戶體驗)

### **UI/UX 重點**
- **大按鈕**: 適合手指觸控
- **卡片設計**: 清晰的資訊層次
- **滑動操作**: 快速執行常用動作
- **載入狀態**: 良好的用戶反饋

**你想要我開始創建APP的基礎架構嗎？** 我可以先建立一個簡單的MVP版本！🚀