import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

// 設定頁面標題
document.title = '雲水基材管理系統';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'PM' | 'AM' | 'WAREHOUSE' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

const LoginPage: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [quickLoginUsers, setQuickLoginUsers] = useState([
    { id: 'user-1', username: '系統管理員', password: 'admin123', role: 'ADMIN' as const, email: 'admin@yunshui.com', originalUsername: 'admin' },
    { id: 'user-2', username: 'Jeffrey', password: 'pm123', role: 'PM' as const, email: 'pm001@yunshui.com', originalUsername: 'pm001' },
    { id: 'user-3', username: 'Miya', password: 'am123', role: 'AM' as const, email: 'am001@yunshui.com', originalUsername: 'am001' },
    { id: 'user-4', username: 'Mark', password: 'wh123', role: 'WAREHOUSE' as const, email: 'warehouse001@yunshui.com', originalUsername: 'warehouse001' },
    { id: 'id-2064', username: 'Erica', password: 'default123', role: 'AM' as const, email: 'Erica@yunshui.com', originalUsername: 'Erica' },
    { id: 'id-2065', username: 'LUKE', password: 'default123', role: 'PM' as const, email: 'LUKE@yunshui.com', originalUsername: 'LUKE' }
  ]);

  // 載入最新的用戶資訊用於快速登入
  useEffect(() => {
    const loadQuickLoginUsers = async () => {
      // 從localStorage載入已更新的用戶名稱
      const savedUsers = localStorage.getItem('quickLoginUsers');
      if (savedUsers) {
        try {
          const parsedUsers = JSON.parse(savedUsers);
          console.log('Loaded quick login users from localStorage:', parsedUsers);
          setQuickLoginUsers(parsedUsers);
          return; // 如果成功載入，就不使用默認值
        } catch (error) {
          console.log('Failed to parse saved users, fetching from backend...');
        }
      }
      
      // 如果沒有保存的數據，從後端獲取所有用戶
      console.log('Fetching all users from backend for quick login...');
      try {
        // 先用admin登入獲取token
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
        const adminResponse = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        
        if (adminResponse.ok) {
          const adminResult = await adminResponse.json();
          if (adminResult.success && adminResult.data) {
            const token = adminResult.data.token;
            
            // 使用token獲取所有用戶
            const usersResponse = await fetch(`${API_URL}/users`, {
              method: 'GET',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (usersResponse.ok) {
              const usersResult = await usersResponse.json();
              console.log('Users API response:', usersResult);
              if (usersResult.success && usersResult.data) {
                const allUsers = usersResult.data.users || usersResult.data;
                
                // 為每個用戶生成快速登入資訊
                const quickLoginUsers = allUsers.map((user: any) => {
                  // 根據用戶ID或角色推斷密碼
                  let password = 'default123';
                  let originalUsername = user.username;
                  
                  if (user.id === 'user-1') {
                    password = 'admin123';
                    originalUsername = 'admin';
                  } else if (user.id === 'user-2') {
                    password = 'pm123';
                    originalUsername = 'pm001';
                  } else if (user.id === 'user-3') {
                    password = 'am123';
                    originalUsername = 'am001';
                  } else if (user.id === 'user-4') {
                    password = 'wh123';
                    originalUsername = 'warehouse001';
                  } else {
                    // 新用戶使用默認密碼
                    password = 'default123';
                    originalUsername = user.username;
                  }
                  
                  return {
                    id: user.id,
                    username: user.username,
                    password: password,
                    role: user.role,
                    email: user.email,
                    originalUsername: originalUsername
                  };
                });
                
                console.log('Generated quick login users from backend:', quickLoginUsers);
                setQuickLoginUsers(quickLoginUsers);
                localStorage.setItem('quickLoginUsers', JSON.stringify(quickLoginUsers));
                return;
              }
            }
          }
        }
      } catch (error) {
        console.log('Failed to fetch users from backend:', error);
        console.error('Detailed error:', error);
      }
      
      // 如果所有方法都失敗，使用靜態默認值
      console.log('Using static defaults as fallback');
      const staticDefaults = [
        { id: 'user-1', username: '系統管理員', password: 'admin123', role: 'ADMIN' as const, email: 'admin@yunshui.com', originalUsername: 'admin' },
        { id: 'user-2', username: 'Jeffrey', password: 'pm123', role: 'PM' as const, email: 'pm001@yunshui.com', originalUsername: 'pm001' },
        { id: 'user-3', username: 'Miya', password: 'am123', role: 'AM' as const, email: 'am001@yunshui.com', originalUsername: 'am001' },
        { id: 'user-4', username: 'Mark', password: 'wh123', role: 'WAREHOUSE' as const, email: 'warehouse001@yunshui.com', originalUsername: 'warehouse001' },
        { id: 'id-2064', username: 'Erica', password: 'default123', role: 'AM' as const, email: 'Erica@yunshui.com', originalUsername: 'Erica' },
        { id: 'id-2065', username: 'LUKE', password: 'default123', role: 'PM' as const, email: 'LUKE@yunshui.com', originalUsername: 'LUKE' }
      ];
      setQuickLoginUsers(staticDefaults);
      localStorage.setItem('quickLoginUsers', JSON.stringify(staticDefaults));
    };

    // 清除舊數據並重新載入所有用戶（修復新用戶快速登入）
    localStorage.removeItem('quickLoginUsers');
    loadQuickLoginUsers();

    // 監聽用戶更新事件
    const handleUsersUpdate = () => {
      loadQuickLoginUsers();
    };

    window.addEventListener('usersUpdated', handleUsersUpdate);

    return () => {
      window.removeEventListener('usersUpdated', handleUsersUpdate);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 調用真正的後端 API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
      console.log('Login attempt - API_URL:', API_URL);
      console.log('Environment VITE_API_URL:', import.meta.env.VITE_API_URL);
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      const result = await response.json();
      console.log('Login response:', result);

      if (result.success && result.data) {
        const user: User = {
          id: result.data.user.id,
          username: result.data.user.username,
          email: result.data.user.email,
          role: result.data.user.role.toUpperCase() as User['role'],
          createdAt: new Date(result.data.user.createdAt),
          updatedAt: new Date(result.data.user.updatedAt)
        };

        // 存儲真正的 JWT token
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authToken', result.data.token);
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('username', user.username);

        // 登入成功後，更新快速登入用戶列表中對應用戶的顯示名稱
        setQuickLoginUsers(prevUsers => 
          prevUsers.map(quickUser => 
            quickUser.id === user.id 
              ? { ...quickUser, username: user.username }
              : quickUser
          )
        );

        onLogin(user);
      } else {
        setError(result.message || '登入失敗');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setError(`無法連接到伺服器: ${error.message}`);
    }
    
    setIsLoading(false);
  };

  const handleDemoLogin = async (account: typeof quickLoginUsers[0]) => {
    setIsLoading(true);
    setError('');
    
    try {
      // 根據用戶ID確定原始用戶名稱和密碼
      const originalCredentials = {
        'user-1': { username: 'admin', password: 'admin123' },
        'user-2': { username: 'pm001', password: 'pm123' },
        'user-3': { username: 'am001', password: 'am123' },
        'user-4': { username: 'warehouse001', password: 'wh123' }
      };
      
      let credentials = originalCredentials[account.id as keyof typeof originalCredentials];
      
      // 如果找不到原始憑證（新用戶），使用用戶名稱和默認密碼
      if (!credentials) {
        credentials = {
          username: account.originalUsername || account.username,
          password: 'default123'
        };
        console.log('Using default credentials for new user:', account.id);
      }
      
      console.log('Quick login attempt:', {
        displayName: account.username,
        loginUsername: credentials.username,
        password: credentials.password
      });
      
      // 調用真正的後端 API（使用原始憑證）
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });

      const result = await response.json();
      console.log('Quick login response from backend:', result);

      if (result.success && result.data) {
        const user: User = {
          id: result.data.user.id,
          username: result.data.user.username,
          email: result.data.user.email,
          role: result.data.user.role.toUpperCase() as User['role'],
          createdAt: new Date(result.data.user.createdAt),
          updatedAt: new Date(result.data.user.updatedAt)
        };

        // 存儲真正的 JWT token
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authToken', result.data.token);
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('username', user.username);

        console.log('Quick login successful with real API:', user);
        console.log('Updating React user state to:', user);
        
        // 登入成功後，更新快速登入用戶列表中對應用戶的顯示名稱
        setQuickLoginUsers(prevUsers => 
          prevUsers.map(quickUser => 
            quickUser.id === user.id 
              ? { ...quickUser, username: user.username }
              : quickUser
          )
        );
        
        onLogin(user);
      } else {
        setError(result.message || '快速登入失敗');
      }
    } catch (error: any) {
      console.error('Quick login error:', error);
      console.error('Quick login error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setError(`快速登入連接失敗: ${error.message}`);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>雲水建設 - 基材管理系統</h1>
          <p>請登入以繼續使用系統</p>
          <div style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
            API URL: {import.meta.env.VITE_API_URL || 'http://localhost:3004/api'}
          </div>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">使用者名稱</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="請輸入使用者名稱"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">密碼</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
            {isLoading ? '登入中...' : '登入'}
          </button>
        </form>
        
        <div className="demo-accounts">
          <h3>快速登入</h3>
          <div className="demo-grid">
            {quickLoginUsers.map((account) => (
              <div 
                key={account.id} 
                className="demo-account"
                onClick={() => !isLoading && handleDemoLogin(account)}
                style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}
              >
                <strong>{account.username}</strong>
                <small>{account.role === 'ADMIN' ? '系統管理員' : 
                       account.role === 'PM' ? '專案經理' :
                       account.role === 'AM' ? '客戶經理' : '倉庫管理員'}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 導入真正的組件
import { UserManagementPage } from './components/UserManagement';
import { MaterialManagementPage } from './components/MaterialManagement';
import { AuxiliaryOrderPage } from './components/OrderManagement';
import { MessageManagement } from './components/MessageManagement/MessageManagement';
import { MessageNotification } from './components/MessageNotification/MessageNotification';

// 包裝組件以添加返回按鈕和錯誤處理
const UserManagementPageWrapper: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <div className="feature-page">
        <div className="feature-header">
          <button onClick={onBack} className="btn btn-secondary">← 返回儀表板</button>
          <h1>👥 使用者管理</h1>
        </div>
        <div className="feature-content">
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>載入錯誤</h2>
            <p style={{ color: 'red' }}>{error}</p>
            <button onClick={() => setError(null)} className="btn btn-primary">重試</button>
          </div>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="feature-page">
        <div className="feature-header">
          <button onClick={onBack} className="btn btn-secondary">← 返回儀表板</button>
        </div>
        <UserManagementPage />
      </div>
    );
  } catch (err) {
    setError(err instanceof Error ? err.message : '未知錯誤');
    return null;
  }
};

const MaterialManagementPageWrapper: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <div className="feature-page">
        <div className="feature-header">
          <button onClick={onBack} className="btn btn-secondary">← 返回儀表板</button>
          <h1>📦 材料資料庫管理</h1>
        </div>
        <div className="feature-content">
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>載入錯誤</h2>
            <p style={{ color: 'red' }}>{error}</p>
            <button onClick={() => setError(null)} className="btn btn-primary">重試</button>
          </div>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="feature-page">
        <div className="feature-header">
          <button onClick={onBack} className="btn btn-secondary">← 返回儀表板</button>
        </div>
        <MaterialManagementPage />
      </div>
    );
  } catch (err) {
    setError(err instanceof Error ? err.message : '未知錯誤');
    return null;
  }
};

const OrderManagementPageWrapper: React.FC<{ onBack: () => void; currentUser: User }> = ({ onBack, currentUser }) => {
  const [error, setError] = useState<string | null>(null);

  // 添加調試信息
  console.log('OrderManagementPageWrapper - currentUser:', currentUser);
  console.log('OrderManagementPageWrapper - currentUser.role:', currentUser?.role);

  if (error) {
    return (
      <div className="feature-page">
        <div className="feature-header">
          <button onClick={onBack} className="btn btn-secondary">← 返回儀表板</button>
          <h1>{currentUser.role === 'AM' ? '🏠 完成材訂單管理' : '🔧 輔材訂單管理'}</h1>
        </div>
        <div className="feature-content">
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>載入錯誤</h2>
            <p style={{ color: 'red' }}>{error}</p>
            <button onClick={() => setError(null)} className="btn btn-primary">重試</button>
          </div>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="feature-page">
        <div className="feature-header">
          <button onClick={onBack} className="btn btn-secondary">← 返回儀表板</button>
        </div>
        <AuxiliaryOrderPage currentUser={currentUser} />
      </div>
    );
  } catch (err) {
    setError(err instanceof Error ? err.message : '未知錯誤');
    return null;
  }
};



// 管理員控制台組件
const AdminDashboard: React.FC<{ 
  onBack: () => void; 
  user: User; 
  onNavigate: (page: string) => void; 
}> = ({ onBack, user, onNavigate }) => {
  
  const adminFeatures = [
    {
      id: 'order-status-management',
      title: '📋 訂單狀態管理',
      description: '管理所有PM和AM訂單的狀態，編輯四大狀態',
      color: '#007bff',
      icon: '📋'
    },
    {
      id: 'material-management',
      title: '📦 材料資料庫管理',
      description: '管理系統中的所有材料資料',
      color: '#ffc107',
      icon: '📦'
    },
    {
      id: 'user-management',
      title: '👥 使用者管理',
      description: '管理系統用戶和權限設置',
      color: '#6f42c1',
      icon: '👥'
    },
    {
      id: 'message-management',
      title: '💬 留言管理',
      description: '發送留言給系統用戶，即時通知重要訊息',
      color: '#28a745',
      icon: '💬'
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button onClick={onBack} className="btn btn-secondary">
          ← 返回主頁
        </button>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>👑 管理員控制台</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            歡迎，{user.username} • 您擁有系統的完整管理權限
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {adminFeatures.map((feature) => (
          <div
            key={feature.id}
            onClick={() => onNavigate(feature.id)}
            style={{
              background: 'white',
              border: `2px solid ${feature.color}`,
              borderRadius: '12px',
              padding: '25px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ 
              fontSize: '2.5rem', 
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              {feature.icon}
            </div>
            <h3 style={{ 
              color: feature.color, 
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              {feature.title}
            </h3>
            <p style={{ 
              color: '#666', 
              lineHeight: '1.5',
              textAlign: 'center',
              margin: 0
            }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #f7e7ce, #f5deb3)',
        padding: '20px',
        borderRadius: '12px',
        border: '2px solid #ddbf94',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#8b6914', marginBottom: '10px' }}>
          🔧 管理員特權
        </h3>
        <p style={{ color: '#8b6914', margin: 0 }}>
          作為管理員，您可以執行所有用戶角色的功能，包括下訂單、編輯狀態、管理材料和用戶
        </p>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [stats, setStats] = useState({
    totalOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    totalMaterials: 0,
    totalUsers: 0,
    pendingItems: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // 載入統計數據
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      
      // 使用與訂單管理頁面相同的邏輯獲取訂單統計
      let allOrders: any[] = [];
      
      // 導入orderService（需要在文件頂部添加import）
      const { orderService } = await import('./services/orderService');
      
      try {
        // 獲取輔材訂單
        const auxiliaryResponse = await orderService.getAuxiliaryOrders();
        if (auxiliaryResponse.success && auxiliaryResponse.data && auxiliaryResponse.data.orders) {
          allOrders = [...allOrders, ...auxiliaryResponse.data.orders];
        }
      } catch (error) {
        console.log('Auxiliary orders not available:', error);
      }

      try {
        // 獲取完成材訂單
        const finishedResponse = await orderService.getFinishedOrders();
        if (finishedResponse.success && finishedResponse.data && finishedResponse.data.orders) {
          allOrders = [...allOrders, ...finishedResponse.data.orders];
        }
      } catch (error) {
        console.log('Finished orders not available:', error);
      }

      // 使用與AuxiliaryOrderPage相同的完成判斷邏輯
      const isOrderCompleted = (order: any): boolean => {
        // 檢查後端狀態
        const backendCheckStatus = order.latestStatuses?.CHECK?.statusValue;
        return backendCheckStatus && backendCheckStatus !== '' && backendCheckStatus !== '未設定';
      };

      // 計算統計數據（與AuxiliaryOrderPage的getOrderStats邏輯一致）
      const totalOrders = allOrders.length;
      const completedOrders = allOrders.filter(order => isOrderCompleted(order)).length;
      const processingOrders = totalOrders - completedOrders;
      
      // 計算待處理項目（未完成訂單中的項目總數）
      const pendingItems = allOrders.reduce((count: number, order: any) => {
        if (!isOrderCompleted(order) && order.items) {
          return count + order.items.length;
        }
        return count;
      }, 0);

      console.log('Dashboard Stats:', {
        totalOrders,
        completedOrders,
        processingOrders,
        pendingItems,
        allOrdersLength: allOrders.length,
        sampleOrder: allOrders[0]
      });

      setStats(prev => ({
        ...prev,
        totalOrders,
        processingOrders,
        completedOrders,
        pendingItems
      }));

      // 設置默認的材料和用戶數量（如果需要真實數據，可以添加相應的service調用）
      setStats(prev => ({
        ...prev,
        totalMaterials: 15, // 暫時使用固定值
        totalUsers: 4 // 暫時使用固定值
      }));

    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const getRoleFeatures = (role: string): string[] => {
    const features: Record<string, string[]> = {
      PM: ['🔧 輔材訂單管理'],
      AM: ['🏠 完成材訂單管理'],
      WAREHOUSE: ['📋 訂單狀態管理'],
      ADMIN: ['👑 管理員控制台']
    };
    return features[role] || [];
  };

  const handleFeatureClick = (feature: string) => {
    if (feature.includes('管理員控制台')) {
      setCurrentPage('admin-dashboard');
    } else if (feature.includes('使用者管理')) {
      setCurrentPage('user-management');
    } else if (feature.includes('材料資料庫管理')) {
      setCurrentPage('material-management');
    } else if (feature.includes('輔材訂單管理')) {
      setCurrentPage('auxiliary-orders');
    } else if (feature.includes('完成材訂單管理')) {
      setCurrentPage('finished-orders');
    } else if (feature.includes('訂單狀態管理')) {
      setCurrentPage('auxiliary-orders'); // 倉庫管理員和管理員使用訂單管理頁面
    }
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
  };

  // 渲染不同的頁面
  if (currentPage === 'admin-dashboard') {
    return <AdminDashboard onBack={handleBackToDashboard} user={user} onNavigate={setCurrentPage} />;
  }
  if (currentPage === 'user-management') {
    return <UserManagementPageWrapper onBack={handleBackToDashboard} />;
  }
  if (currentPage === 'material-management') {
    return <MaterialManagementPageWrapper onBack={handleBackToDashboard} />;
  }
  if (currentPage === 'auxiliary-orders') {
    return <OrderManagementPageWrapper onBack={handleBackToDashboard} currentUser={user} />;
  }
  if (currentPage === 'finished-orders') {
    return <OrderManagementPageWrapper onBack={handleBackToDashboard} currentUser={user} />;
  }
  if (currentPage === 'order-status-management') {
    return <OrderManagementPageWrapper onBack={handleBackToDashboard} currentUser={user} />;
  }
  if (currentPage === 'message-management') {
    return <MessageManagement onBack={handleBackToDashboard} />;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 歡迎區域 */}
      <div style={{
        background: user.role === 'ADMIN' 
          ? 'linear-gradient(135deg, #f7e7ce 0%, #f5deb3 100%)' 
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: user.role === 'ADMIN' ? '#8b6914' : 'white',
        padding: '30px',
        borderRadius: '12px',
        marginBottom: '30px',
        textAlign: 'center',
        border: user.role === 'ADMIN' ? '2px solid #ddbf94' : 'none'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>
          {user.role === 'ADMIN' ? '👑 ' : ''}歡迎回來，{user.username}！
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: '0.9' }}>
          {user.role === 'PM' ? '專案經理' :
           user.role === 'AM' ? '客戶經理' :
           user.role === 'WAREHOUSE' ? '倉庫管理員' : '系統管理員 • 擁有完整系統權限'}
        </p>
      </div>

      {/* 統計卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* 總訂單數 - 所有角色都顯示 */}
        <div className="stat-card">
          <div style={{ fontSize: '2.5rem' }}>📊</div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '2rem', color: '#2c3e50' }}>
              {statsLoading ? '...' : stats.totalOrders}
            </h3>
            <p style={{ margin: '0', color: '#6c757d' }}>總訂單數</p>
          </div>
        </div>
        
        {/* 進行中訂單 - 所有角色都顯示 */}
        <div className="stat-card">
          <div style={{ fontSize: '2.5rem' }}>🔄</div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '2rem', color: '#2c3e50' }}>
              {statsLoading ? '...' : stats.processingOrders}
            </h3>
            <p style={{ margin: '0', color: '#6c757d' }}>進行中訂單</p>
          </div>
        </div>
        
        {/* 已完成訂單 - 所有角色都顯示 */}
        <div className="stat-card">
          <div style={{ fontSize: '2.5rem' }}>✅</div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '2rem', color: '#2c3e50' }}>
              {statsLoading ? '...' : stats.completedOrders}
            </h3>
            <p style={{ margin: '0', color: '#6c757d' }}>已完成訂單</p>
          </div>
        </div>
        
        {/* 根據角色顯示不同的第四個卡片 */}
        {user.role === 'ADMIN' ? (
          <div className="stat-card">
            <div style={{ fontSize: '2.5rem' }}>👥</div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '2rem', color: '#2c3e50' }}>
                {statsLoading ? '...' : stats.totalUsers}
              </h3>
              <p style={{ margin: '0', color: '#6c757d' }}>系統用戶數</p>
            </div>
          </div>
        ) : user.role === 'WAREHOUSE' ? (
          <div className="stat-card">
            <div style={{ fontSize: '2.5rem' }}>⏳</div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '2rem', color: '#2c3e50' }}>
                {statsLoading ? '...' : stats.pendingItems}
              </h3>
              <p style={{ margin: '0', color: '#6c757d' }}>待處理項目</p>
            </div>
          </div>
        ) : (
          <div className="stat-card">
            <div style={{ fontSize: '2.5rem' }}>📦</div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '2rem', color: '#2c3e50' }}>
                {statsLoading ? '...' : stats.totalMaterials}
              </h3>
              <p style={{ margin: '0', color: '#6c757d' }}>材料總數</p>
            </div>
          </div>
        )}
      </div>

      {/* 功能區域 */}
      <div className="dashboard-section">
        <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>系統功能</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {getRoleFeatures(user.role).map((feature, index) => (
            <div 
              key={index} 
              className={`feature-card ${user.role === 'ADMIN' ? 'admin-feature-card' : ''}`}
              onClick={() => handleFeatureClick(feature)}
              style={user.role === 'ADMIN' && feature.includes('管理員控制台') ? {
                background: '#ffffff',
                border: '2px solid #e0e0e0',
                color: '#333',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              } : {}}
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 受保護的路由組件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    
    if (!userStr || !token) {
      navigate('/login', { replace: true, state: { from: location } });
    }
  }, [navigate, location]);

  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('authToken');
  
  if (!userStr || !token) {
    return null;
  }

  return <>{children}</>;
};

// 主應用組件
const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserFromStorage = () => {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('authToken');
      
      if (userStr && token) {
        try {
          const userData = JSON.parse(userStr);
          // 確保日期字段是 Date 對象
          if (userData.createdAt) {
            userData.createdAt = new Date(userData.createdAt);
          }
          if (userData.updatedAt) {
            userData.updatedAt = new Date(userData.updatedAt);
          }
          setUser(userData);
        } catch (error) {
          console.error('Failed to parse user data:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
        }
      }
    };

    // 初始載入
    loadUserFromStorage();
    setIsLoading(false);

    // 監聽storage變化（當其他標籤頁修改localStorage時）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' && e.newValue) {
        loadUserFromStorage();
      }
    };

    // 監聽自定義事件（當同一頁面修改localStorage時）
    const handleUserUpdate = () => {
      loadUserFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  const handleLogin = (userData: User) => {
    console.log('Setting user state in App component:', userData);
    setUser(userData);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>載入系統中...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div className="app-authenticated">
              <header className="app-header">
                <h1>雲水建設 - 基材管理系統</h1>
                <div className="user-info">
                  <span>歡迎，{user?.username} ({user?.role})</span>
                  <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                    登出
                  </button>
                </div>
              </header>
              {/* 留言通知組件 - 只對非管理員用戶顯示 */}
              {user?.role !== 'ADMIN' && <MessageNotification user={user} />}
              <main className="app-main">
                <Dashboard user={user!} />
              </main>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App;