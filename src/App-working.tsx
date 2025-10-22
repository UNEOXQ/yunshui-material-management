import React, { useState, useEffect } from 'react';
import './App.css';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'PM' | 'AM' | 'WAREHOUSE' | 'ADMIN';
}

const LoginPage: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    { username: 'admin', password: 'admin123', role: 'ADMIN' as const, email: 'admin@yunshui.com' },
    { username: 'pm001', password: 'pm123', role: 'PM' as const, email: 'pm001@yunshui.com' },
    { username: 'am001', password: 'am123', role: 'AM' as const, email: 'am001@yunshui.com' },
    { username: 'warehouse001', password: 'wh123', role: 'WAREHOUSE' as const, email: 'warehouse001@yunshui.com' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 調用真正的後端 API
      const response = await fetch('http://localhost:3004/api/auth/login', {
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

      if (result.success && result.data) {
        const user: User = {
          id: result.data.user.id,
          username: result.data.user.username,
          email: result.data.user.email,
          role: result.data.user.role.toUpperCase() as User['role']
        };

        // 存儲真正的 JWT token
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authToken', result.data.token);

        onLogin(user);
      } else {
        setError(result.message || '登入失敗');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // 如果 API 不可用，回退到模擬登入
      console.warn('API 不可用，使用模擬登入');
      const account = demoAccounts.find(acc => acc.username === username && acc.password === password);

      if (account) {
        const user: User = {
          id: `demo-user-${Date.now()}`,
          username: account.username,
          email: account.email,
          role: account.role
        };

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authToken', `demo-token-${Date.now()}`);

        onLogin(user);
      } else {
        setError('使用者名稱或密碼錯誤');
      }
    }

    setIsLoading(false);
  };

  const handleDemoLogin = async (account: typeof demoAccounts[0]) => {
    try {
      // 調用真正的後端 API
      const response = await fetch('http://localhost:3004/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: account.username,
          password: account.password
        })
      });

      const result = await response.json();

      if (result.success && result.data) {
        const user: User = {
          id: result.data.user.id,
          username: result.data.user.username,
          email: result.data.user.email,
          role: result.data.user.role.toUpperCase() as User['role']
        };

        // 存儲真正的 JWT token
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authToken', result.data.token);

        onLogin(user);
      } else {
        setError(result.message || '登入失敗');
      }
    } catch (error: any) {
      console.error('Demo login error:', error);
      
      // 如果 API 不可用，回退到模擬登入
      console.warn('API 不可用，使用模擬登入');
      const user: User = {
        id: `demo-user-${Date.now()}`,
        username: account.username,
        email: account.email,
        role: account.role
      };

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('authToken', `demo-token-${Date.now()}`);

      onLogin(user);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>雲水基材管理系統</h1>
          <p>請登入以繼續使用系統</p>
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
          <h3>演示帳號 (點擊快速登入)</h3>
          <div className="demo-grid">
            {demoAccounts.map((account) => (
              <div
                key={account.username}
                className="demo-account"
                onClick={() => handleDemoLogin(account)}
              >
                <strong>{account.username}</strong>
                <span>{account.password}</span>
                <small>{account.role === 'ADMIN' ? '系統管理員' :
                  account.role === 'PM' ? '專案經理' :
                    account.role === 'AM' ? '區域經理' : '倉庫管理員'}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const getRoleFeatures = (role: string): string[] => {
    const features: Record<string, string[]> = {
      PM: ['🔧 輔材訂單管理'],
      AM: ['🏠 完成材訂單管理'],
      WAREHOUSE: ['📋 叫貨狀態管理', '📋 取貨狀態管理', '📋 到案狀態管理', '📋 點收狀態管理'],
      ADMIN: ['👥 使用者管理', '📦 材料資料庫管理']
    };
    return features[role] || [];
  };

  const handleFeatureClick = (feature: string) => {
    if (feature.includes('使用者管理')) {
      setCurrentPage('user-management');
    } else if (feature.includes('材料資料庫管理')) {
      setCurrentPage('material-management');
    } else if (feature.includes('輔材訂單管理')) {
      setCurrentPage('auxiliary-orders');
    } else if (feature.includes('完成材訂單管理')) {
      setCurrentPage('finished-orders');
    } else if (feature.includes('叫貨狀態管理')) {
      setCurrentPage('order-status');
    } else if (feature.includes('取貨狀態管理')) {
      setCurrentPage('pickup-status');
    } else if (feature.includes('到案狀態管理')) {
      setCurrentPage('delivery-status');
    } else if (feature.includes('點收狀態管理')) {
      setCurrentPage('check-status');
    }
  };

  const TestPage: React.FC<{ title: string }> = ({ title }) => (
    <div className="feature-page">
      <div className="feature-header">
        <button onClick={() => setCurrentPage('dashboard')} className="btn btn-secondary">
          ← 返回儀表板
        </button>
        <h1>{title}</h1>
      </div>
      <div className="feature-content">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>{title} 功能頁面</h2>
          <p>✅ 頁面載入成功</p>
          <p>✅ 導航正常工作</p>
          <p>🔧 功能開發中，即將推出完整功能</p>
        </div>
      </div>
    </div>
  );

  if (currentPage !== 'dashboard') {
    const pageTitle = currentPage === 'user-management' ? '👥 使用者管理' :
      currentPage === 'material-management' ? '📦 材料資料庫管理' :
        currentPage === 'auxiliary-orders' ? '🔧 輔材訂單管理' :
          currentPage === 'finished-orders' ? '🏠 完成材訂單管理' :
            currentPage === 'order-status' ? '📋 叫貨狀態管理' :
              currentPage === 'pickup-status' ? '📋 取貨狀態管理' :
                currentPage === 'delivery-status' ? '📋 到案狀態管理' :
                  currentPage === 'check-status' ? '📋 點收狀態管理' : '功能頁面';

    return <TestPage title={pageTitle} />;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 歡迎區域 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '12px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>
          歡迎回來，{user.username}！
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: '0.9' }}>
          {user.role === 'PM' ? '專案經理' :
            user.role === 'AM' ? '客戶經理' :
              user.role === 'WAREHOUSE' ? '倉庫管理員' : '系統管理員'}
        </p>
      </div>

      {/* 統計卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div className="stat-card">
          <div style={{ fontSize: '2.5rem' }}>📊</div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '2rem', color: '#2c3e50' }}>28</h3>
            <p style={{ margin: '0', color: '#6c757d' }}>總專案數</p>
          </div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '2.5rem' }}>🔄</div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '2rem', color: '#2c3e50' }}>12</h3>
            <p style={{ margin: '0', color: '#6c757d' }}>進行中專案</p>
          </div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '2.5rem' }}>✅</div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '2rem', color: '#2c3e50' }}>16</h3>
            <p style={{ margin: '0', color: '#6c757d' }}>已完成專案</p>
          </div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '2.5rem' }}>⏳</div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '2rem', color: '#2c3e50' }}>3</h3>
            <p style={{ margin: '0', color: '#6c757d' }}>待處理項目</p>
          </div>
        </div>
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
            <div key={index} className="feature-card" onClick={() => handleFeatureClick(feature)}>
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');

    if (userStr && token) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }

    setIsLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
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
      {user ? (
        <div className="app-authenticated">
          <header className="app-header">
            <h1>雲水基材管理系統</h1>
            <div className="user-info">
              <span>歡迎，{user.username} ({user.role})</span>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                登出
              </button>
            </div>
          </header>
          <main className="app-main">
            <Dashboard user={user} />
          </main>
        </div>
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;