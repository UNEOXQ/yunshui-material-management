# 測試工具說明

本目錄包含了雲水基材管理系統 Mobile App 的測試工具和配置。

## 檔案結構

```
test-utils/
├── setupTests.ts          # Jest 測試環境設置
├── renderWithProviders.tsx # 組件測試渲染工具
├── mockData.ts           # 測試用模擬資料
├── apiMocks.ts           # API 模擬工具
├── index.ts              # 統一導出
└── README.md             # 本說明文件
```

## 使用方式

### 1. 組件測試

使用 `renderWithProviders` 來渲染需要 Redux Store 和 Navigation 的組件：

```typescript
import { renderWithProviders } from '../../../test-utils';
import { MyComponent } from '../MyComponent';

test('renders correctly', () => {
  const { getByText } = renderWithProviders(<MyComponent />);
  expect(getByText('Hello')).toBeTruthy();
});
```

### 2. 服務測試

使用 `setupApiMocks` 來模擬 API 呼叫：

```typescript
import { setupApiMocks } from '../../test-utils';
import { myService } from '../myService';

describe('MyService', () => {
  beforeEach(() => {
    setupApiMocks();
  });

  test('should fetch data', async () => {
    const result = await myService.getData();
    expect(result).toBeDefined();
  });
});
```

### 3. Redux Store 測試

使用預設的 mock 資料來測試 Redux slices：

```typescript
import { mockUser, mockMaterial } from '../../test-utils';
import { authSlice } from '../authSlice';

test('should handle login', () => {
  const action = { type: 'auth/loginSuccess', payload: { user: mockUser, token: 'token' } };
  const state = authSlice(undefined, action);
  expect(state.user).toEqual(mockUser);
});
```

## 測試指令

```bash
# 執行所有測試
npm test

# 監視模式執行測試
npm run test:watch

# 生成測試覆蓋率報告
npm run test:coverage
```

## 模擬設置

### React Native 模組

- AsyncStorage
- React Navigation
- Expo 模組 (ImagePicker, SQLite)
- React Native Keychain
- NetInfo
- Vector Icons
- Haptic Feedback

### API 模擬

提供了完整的 API 響應模擬，包括：
- 認證 API (登入/登出)
- 基材管理 API (CRUD 操作)
- 訂單管理 API (CRUD 操作)
- 圖片上傳 API

## 測試資料

### 模擬用戶
```typescript
const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'ADMIN',
  token: 'mock-jwt-token',
};
```

### 模擬基材
```typescript
const mockMaterial = {
  id: '1',
  name: '測試基材',
  category: '石材',
  specification: '30x30cm',
  unit: '片',
  price: 100,
  stock: 50,
  // ...其他屬性
};
```

### 模擬訂單
```typescript
const mockOrder = {
  id: '1',
  orderNumber: 'ORD-001',
  customerName: '測試客戶',
  materials: [...],
  status: OrderStatus.PENDING,
  totalAmount: 1000,
  // ...其他屬性
};
```

## 最佳實踐

1. **測試隔離**: 每個測試都應該是獨立的，使用 `beforeEach` 清理狀態
2. **模擬外部依賴**: 使用 Jest mocks 來模擬外部服務和模組
3. **測試真實行為**: 測試用戶實際會進行的操作，而不是實作細節
4. **清晰的測試名稱**: 使用描述性的測試名稱，說明測試的目的
5. **適當的斷言**: 使用合適的 Jest matchers 來進行斷言

## 故障排除

### 常見問題

1. **模組找不到**: 確保在 `jest.config.js` 中正確配置了 `moduleNameMapping`
2. **React Native 組件錯誤**: 檢查 `setupTests.ts` 中的模組模擬是否正確
3. **異步測試失敗**: 使用 `async/await` 或 `waitFor` 來處理異步操作

### 調試技巧

1. 使用 `screen.debug()` 來查看渲染的組件結構
2. 使用 `console.log` 來檢查測試資料
3. 檢查 Jest 的錯誤訊息，通常會提供有用的調試資訊