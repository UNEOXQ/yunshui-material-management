# 開發指南

## 概述

本指南提供雲水基材管理系統 Mobile App 的開發規範、最佳實踐和開發流程。

## 開發環境設置

### 必要工具

1. **Node.js** (v18+)
2. **npm** (v9+) 或 **yarn** (v1.22+)
3. **Git**
4. **VS Code** (推薦) 或其他程式碼編輯器
5. **Expo CLI** 和 **EAS CLI**

### VS Code 擴充套件推薦

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### 專案結構

```
mobile-app/
├── src/
│   ├── components/          # 可重用組件
│   │   ├── common/         # 通用組件
│   │   ├── forms/          # 表單組件
│   │   └── lists/          # 列表組件
│   ├── screens/            # 頁面組件
│   │   ├── auth/           # 認證相關頁面
│   │   ├── materials/      # 基材管理頁面
│   │   ├── orders/         # 訂單管理頁面
│   │   └── profile/        # 個人資料頁面
│   ├── services/           # API 服務
│   ├── store/              # Redux 狀態管理
│   ├── navigation/         # 導航配置
│   ├── utils/              # 工具函數
│   ├── hooks/              # 自定義 Hooks
│   ├── types/              # TypeScript 類型定義
│   └── constants/          # 常數定義
├── assets/                 # 靜態資源
├── docs/                   # 文件
├── scripts/                # 建置腳本
└── __tests__/              # 測試檔案
```

## 程式碼規範

### TypeScript 規範

#### 1. 類型定義
```typescript
// 使用 interface 定義物件類型
interface Material {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

// 使用 type 定義聯合類型或複雜類型
type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};
```

#### 2. 函數定義
```typescript
// 使用箭頭函數和明確的返回類型
const calculateTotal = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
};

// 異步函數
const fetchMaterials = async (params: MaterialParams): Promise<Material[]> => {
  const response = await api.get('/materials', { params });
  return response.data.materials;
};
```

#### 3. 組件定義
```typescript
// React 組件
interface MaterialCardProps {
  material: Material;
  onPress: (material: Material) => void;
  showStock?: boolean;
}

const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onPress,
  showStock = true,
}) => {
  return (
    <TouchableOpacity onPress={() => onPress(material)}>
      {/* 組件內容 */}
    </TouchableOpacity>
  );
};
```

### 命名規範

#### 1. 檔案命名
- **組件檔案**: PascalCase (如 `MaterialCard.tsx`)
- **工具檔案**: camelCase (如 `apiClient.ts`)
- **常數檔案**: camelCase (如 `apiEndpoints.ts`)
- **類型檔案**: camelCase (如 `materialTypes.ts`)

#### 2. 變數命名
```typescript
// 常數使用 UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.yunshui.com/v1';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// 變數使用 camelCase
const materialList = [];
const isLoading = false;
const currentUser = null;

// 布林值使用 is/has/can 前綴
const isVisible = true;
const hasPermission = false;
const canEdit = true;
```

#### 3. 函數命名
```typescript
// 動作函數使用動詞開頭
const createMaterial = () => {};
const updateOrder = () => {};
const deleteMaterial = () => {};

// 取得資料使用 get/fetch 前綴
const getMaterials = () => {};
const fetchOrderDetails = () => {};

// 事件處理函數使用 handle 前綴
const handleSubmit = () => {};
const handlePress = () => {};
const handleChange = () => {};
```

### ESLint 和 Prettier 配置

#### .eslintrc.js
```javascript
module.exports = {
  extends: [
    'expo',
    '@react-native-community',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

#### .prettierrc
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

## 組件開發

### 組件結構

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

// 1. 類型定義
interface MaterialCardProps {
  material: Material;
  onPress: (material: Material) => void;
}

// 2. 組件定義
const MaterialCard: React.FC<MaterialCardProps> = ({ material, onPress }) => {
  // 3. 狀態定義
  const [isPressed, setIsPressed] = useState(false);

  // 4. 副作用
  useEffect(() => {
    // 組件掛載後的邏輯
  }, []);

  // 5. 事件處理函數
  const handlePress = () => {
    setIsPressed(true);
    onPress(material);
    setTimeout(() => setIsPressed(false), 200);
  };

  // 6. 渲染邏輯
  return (
    <View style={[styles.container, isPressed && styles.pressed]}>
      <Text style={styles.name}>{material.name}</Text>
      <Text style={styles.price}>${material.price}</Text>
      <Button onPress={handlePress}>查看詳情</Button>
    </View>
  );
};

// 7. 樣式定義
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 14,
    color: '#666',
  },
});

export default MaterialCard;
```

### 自定義 Hooks

```typescript
// hooks/useMaterials.ts
import { useState, useEffect } from 'react';
import { materialApi } from '../services/materialApi';

interface UseMaterialsOptions {
  autoFetch?: boolean;
  params?: MaterialParams;
}

export const useMaterials = (options: UseMaterialsOptions = {}) => {
  const { autoFetch = true, params = {} } = options;
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = async (fetchParams = params) => {
    try {
      setLoading(true);
      setError(null);
      const response = await materialApi.getMaterials(fetchParams);
      setMaterials(response.data.materials);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchMaterials();
    }
  }, [autoFetch]);

  return {
    materials,
    loading,
    error,
    refetch: fetchMaterials,
  };
};
```

## 狀態管理

### Redux Toolkit 設置

```typescript
// store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { materialApi } from '../services/materialApi';
import authSlice from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    [materialApi.reducerPath]: materialApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(materialApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### RTK Query API 定義

```typescript
// services/materialApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const materialApi = createApi({
  reducerPath: 'materialApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/materials',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Material'],
  endpoints: (builder) => ({
    getMaterials: builder.query<MaterialResponse, MaterialParams>({
      query: (params) => ({
        url: '',
        params,
      }),
      providesTags: ['Material'],
    }),
    createMaterial: builder.mutation<Material, CreateMaterialRequest>({
      query: (material) => ({
        url: '',
        method: 'POST',
        body: material,
      }),
      invalidatesTags: ['Material'],
    }),
  }),
});

export const { useGetMaterialsQuery, useCreateMaterialMutation } = materialApi;
```

## 測試

### 單元測試

```typescript
// __tests__/components/MaterialCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MaterialCard from '../../src/components/MaterialCard';

const mockMaterial: Material = {
  id: '1',
  name: '不鏽鋼板',
  category: '不鏽鋼',
  price: 1500,
  stock: 50,
};

describe('MaterialCard', () => {
  it('renders material information correctly', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <MaterialCard material={mockMaterial} onPress={onPress} />
    );

    expect(getByText('不鏽鋼板')).toBeTruthy();
    expect(getByText('$1500')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <MaterialCard material={mockMaterial} onPress={onPress} />
    );

    fireEvent.press(getByText('查看詳情'));
    expect(onPress).toHaveBeenCalledWith(mockMaterial);
  });
});
```

### 整合測試

```typescript
// __tests__/screens/MaterialListScreen.test.tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '../../src/store/store';
import MaterialListScreen from '../../src/screens/materials/MaterialListScreen';

const renderWithProvider = (component: React.ReactElement) => {
  return render(<Provider store={store}>{component}</Provider>);
};

describe('MaterialListScreen', () => {
  it('displays loading state initially', () => {
    const { getByTestId } = renderWithProvider(<MaterialListScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('displays materials after loading', async () => {
    const { getByText } = renderWithProvider(<MaterialListScreen />);
    
    await waitFor(() => {
      expect(getByText('不鏽鋼板')).toBeTruthy();
    });
  });
});
```

## 效能優化

### 圖片優化

```typescript
// components/OptimizedImage.tsx
import React, { useState } from 'react';
import { Image, View, ActivityIndicator } from 'react-native';

interface OptimizedImageProps {
  source: { uri: string };
  style?: any;
  placeholder?: React.ReactNode;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  placeholder,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => setLoading(false);
  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return placeholder || <View style={[style, { backgroundColor: '#f0f0f0' }]} />;
  }

  return (
    <View style={style}>
      {loading && (
        <View style={[style, { position: 'absolute', justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator />
        </View>
      )}
      <Image
        source={source}
        style={[style, { opacity: loading ? 0 : 1 }]}
        onLoad={handleLoad}
        onError={handleError}
        resizeMode="cover"
      />
    </View>
  );
};
```

### 列表優化

```typescript
// components/OptimizedFlatList.tsx
import React, { useMemo } from 'react';
import { FlatList, ListRenderItem } from 'react-native';

interface OptimizedFlatListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  itemHeight?: number;
}

const OptimizedFlatList = <T,>({
  data,
  renderItem,
  keyExtractor,
  itemHeight = 100,
}: OptimizedFlatListProps<T>) => {
  const getItemLayout = useMemo(
    () =>
      itemHeight
        ? (data: any, index: number) => ({
            length: itemHeight,
            offset: itemHeight * index,
            index,
          })
        : undefined,
    [itemHeight]
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
    />
  );
};
```

## 除錯技巧

### 日誌記錄

```typescript
// utils/logger.ts
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.ERROR;

  debug(message: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: Error, ...args: any[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
  }
}

export const logger = new Logger();
```

### 錯誤邊界

```typescript
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Button } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>發生錯誤</Text>
          <Text>{this.state.error?.message}</Text>
          <Button
            title="重新載入"
            onPress={() => this.setState({ hasError: false })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## 版本控制

### Git 工作流程

1. **主分支**: `main` - 穩定的生產版本
2. **開發分支**: `develop` - 開發中的功能整合
3. **功能分支**: `feature/功能名稱` - 新功能開發
4. **修復分支**: `hotfix/問題描述` - 緊急修復

### 提交訊息規範

```
類型(範圍): 簡短描述

詳細描述 (可選)

相關問題: #123
```

**類型**:
- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文件更新
- `style`: 程式碼格式調整
- `refactor`: 程式碼重構
- `test`: 測試相關
- `chore`: 建置或工具相關

**範例**:
```
feat(materials): 新增基材圖片上傳功能

- 整合 Cloudinary 圖片上傳 API
- 新增圖片壓縮和預覽功能
- 更新基材表單組件

相關問題: #45
```

---

**最後更新**: 2024年10月  
**文件版本**: 1.0.0