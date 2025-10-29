import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';

// API 配置
const API_BASE_URL = 'http://192.168.68.95:3004/api';

// API 服務
const apiService = {
  login: async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getMaterials: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/materials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        return Array.isArray(data.data) ? data.data : data.data.materials || [];
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  getAllOrders: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        return Array.isArray(data.data) ? data.data : data.data.orders || [];
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  createAuxiliaryOrder: async (token, orderData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/auxiliary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData),
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createFinishedOrder: async (token, orderData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/finished`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData),
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export default function App() {
  // 狀態
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [materials, setMaterials] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMaterialSelection, setShowMaterialSelection] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [materialType, setMaterialType] = useState('AUXILIARY');

  // 快速登入用戶
  const quickLoginUsers = [
    { id: 'user-1', username: '系統管理員', password: 'admin123', role: 'ADMIN', originalUsername: 'admin' },
    { id: 'user-2', username: 'Jeffrey', password: 'pm123', role: 'PM', originalUsername: 'pm001' },
    { id: 'user-3', username: 'Miya', password: 'am123', role: 'AM', originalUsername: 'am001' },
    { id: 'user-4', username: 'Mark', password: 'wh123', role: 'WAREHOUSE', originalUsername: 'warehouse001' },
    { id: 'id-2064', username: 'Erica', password: 'default123', role: 'AM', originalUsername: 'Erica' },
    { id: 'id-2065', username: 'LUKE', password: 'default123', role: 'PM', originalUsername: 'LUKE' }
  ];

  // 載入資料
  useEffect(() => {
    if (isLoggedIn && authToken && currentUser) {
      loadData();
    }
  }, [isLoggedIn, authToken, currentUser]);

  const loadData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const [materialsData, ordersData] = await Promise.all([
        apiService.getMaterials(authToken),
        apiService.getAllOrders(authToken)
      ]);
      
      setMaterials(materialsData);
      
      // 根據角色過濾訂單
      let filteredOrders = ordersData;
      if (currentUser.role === 'PM') {
        filteredOrders = ordersData.filter(order => !order.type || order.type === 'AUXILIARY');
      } else if (currentUser.role === 'AM') {
        filteredOrders = ordersData.filter(order => order.type === 'FINISHED');
      }
      
      setOrders(filteredOrders);
    } catch (error) {
      Alert.alert('錯誤', '載入資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 登入處理
  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      Alert.alert('錯誤', '請輸入帳號和密碼');
      return;
    }

    setLoginLoading(true);
    const result = await apiService.login(loginForm.username, loginForm.password);
    
    if (result.success) {
      setAuthToken(result.data.token);
      setCurrentUser(result.data.user);
      setIsLoggedIn(true);
    } else {
      Alert.alert('登入失敗', result.message || '帳號或密碼錯誤');
    }
    setLoginLoading(false);
  };

  // 快速登入
  const handleQuickLogin = async (account) => {
    setLoginLoading(true);
    const result = await apiService.login(account.originalUsername, account.password);
    
    if (result.success) {
      setAuthToken(result.data.token);
      setCurrentUser(result.data.user);
      setIsLoggedIn(true);
    } else {
      Alert.alert('快速登入失敗', result.message || '登入失敗');
    }
    setLoginLoading(false);
  };

  // 登出
  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthToken('');
    setCurrentUser(null);
    setCurrentPage('dashboard');
    setOrders([]);
    setMaterials([]);
  };

  // 選擇材料
  const handleSelectMaterial = (material) => {
    const existingIndex = selectedMaterials.findIndex(item => item.materialId === material.id);
    
    if (existingIndex >= 0) {
      const updated = [...selectedMaterials];
      updated[existingIndex].quantity += 1;
      setSelectedMaterials(updated);
    } else {
      setSelectedMaterials(prev => [...prev, {
        materialId: material.id,
        materialName: material.name,
        price: material.price,
        quantity: 1
      }]);
    }
  };

  // 更新數量
  const handleUpdateQuantity = (materialId, quantity) => {
    if (quantity <= 0) {
      setSelectedMaterials(prev => prev.filter(item => item.materialId !== materialId));
      return;
    }
    
    setSelectedMaterials(prev => 
      prev.map(item => 
        item.materialId === materialId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  // 建立訂單
  const handleCreateOrder = async () => {
    if (selectedMaterials.length === 0) {
      Alert.alert('錯誤', '請選擇材料');
      return;
    }

    setLoading(true);
    
    const orderData = {
      items: selectedMaterials.map(item => ({
        materialId: item.materialId,
        quantity: item.quantity
      }))
    };

    let result;
    if (materialType === 'AUXILIARY') {
      result = await apiService.createAuxiliaryOrder(authToken, orderData);
    } else {
      result = await apiService.createFinishedOrder(authToken, orderData);
    }

    if (result.success) {
      Alert.alert('成功', '訂單建立成功');
      setShowMaterialSelection(false);
      setSelectedMaterials([]);
      await loadData();
    } else {
      Alert.alert('錯誤', result.error || '建立訂單失敗');
    }
    setLoading(false);
  };

  // 獲取角色功能
  const getRoleFeatures = (role) => {
    const features = {
      PM: ['🔧 輔材訂單管理'],
      AM: ['🏠 完成材訂單管理'],
      WAREHOUSE: ['📋 訂單狀態管理'],
      ADMIN: ['🔧 輔材訂單管理', '🏠 完成材訂單管理', '📋 訂單狀態管理']
    };
    return features[role] || [];
  };

  // 獲取角色顯示文字
  const getRoleDisplayText = (role) => {
    const roleMap = {
      'ADMIN': '系統管理員',
      'PM': '專案經理',
      'AM': '區域經理',
      'WAREHOUSE': '倉管人員'
    };
    return roleMap[role] || role;
  };

  // 獲取角色顏色
  const getRoleColor = (role) => {
    const colorMap = {
      'ADMIN': '#dc3545',
      'PM': '#007bff',
      'AM': '#28a745',
      'WAREHOUSE': '#ffc107'
    };
    return colorMap[role] || '#6c757d';
  };

  // 登入畫面
  if (!isLoggedIn) {
    return (
      <View style={styles.loginContainer}>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
          <View style={styles.loginForm}>
            <Text style={styles.loginTitle}>🏗️ 雲水基材管理系統</Text>
            <Text style={styles.loginSubtitle}>手機版登入</Text>
            
            <View style={styles.quickLoginSection}>
              <Text style={styles.quickLoginTitle}>快速登入</Text>
              <View style={styles.quickLoginGrid}>
                {quickLoginUsers.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[styles.quickLoginButton, { borderColor: getRoleColor(account.role) }]}
                    onPress={() => handleQuickLogin(account)}
                    disabled={loginLoading}
                  >
                    <Text style={[styles.quickLoginName, { color: getRoleColor(account.role) }]}>
                      {account.username}
                    </Text>
                    <Text style={styles.quickLoginRole}>
                      {getRoleDisplayText(account.role)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>或</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <View style={styles.manualLoginSection}>
              <Text style={styles.manualLoginTitle}>手動登入</Text>
              <TextInput
                style={styles.loginInput}
                placeholder="帳號"
                value={loginForm.username}
                onChangeText={(text) => setLoginForm(prev => ({ ...prev, username: text }))}
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.loginInput}
                placeholder="密碼"
                value={loginForm.password}
                onChangeText={(text) => setLoginForm(prev => ({ ...prev, password: text }))}
                secureTextEntry
              />
              
              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={handleLogin}
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>登入</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 儀表板
  if (currentPage === 'dashboard') {
    return (
      <View style={styles.app}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>🏗️ 雲水基材管理系統</Text>
              <Text style={styles.subtitle}>歡迎，{currentUser?.username}</Text>
              <Text style={styles.userRole}>角色：{getRoleDisplayText(currentUser?.role)}</Text>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>登出</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{orders.length}</Text>
                <Text style={styles.statLabel}>總訂單數</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{materials.length}</Text>
                <Text style={styles.statLabel}>基材種類</Text>
              </View>
            </View>

            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>系統功能</Text>
              <View style={styles.featuresGrid}>
                {getRoleFeatures(currentUser?.role).map((feature, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.featureCard}
                    onPress={() => {
                      if (feature.includes('輔材訂單管理')) {
                        setCurrentPage('auxiliary-orders');
                      } else if (feature.includes('完成材訂單管理')) {
                        setCurrentPage('finished-orders');
                      } else if (feature.includes('訂單狀態管理')) {
                        setCurrentPage('order-status');
                      }
                    }}
                  >
                    <Text style={styles.featureText}>{feature}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 輔材訂單管理
  if (currentPage === 'auxiliary-orders') {
    return (
      <View style={styles.app}>
        <View style={styles.pageHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentPage('dashboard')}>
            <Text style={styles.backText}>← 返回</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>🔧 輔材訂單管理</Text>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => {
              setMaterialType('AUXILIARY');
              setSelectedMaterials([]);
              setShowMaterialSelection(true);
            }}
          >
            <Text style={styles.addButtonText}>+ 選擇輔材</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.pageContent} contentContainerStyle={{ paddingBottom: 100 }}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>載入中...</Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暫無輔材訂單</Text>
              <Text style={styles.emptyHint}>點擊上方「+ 選擇輔材」建立新訂單</Text>
            </View>
          ) : (
            orders.map((order, index) => (
              <View key={order.id || index} style={styles.orderCard}>
                <Text style={styles.orderNumber}>訂單 #{order.orderNumber || order.id}</Text>
                <Text style={styles.orderDate}>日期: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '未知'}</Text>
                <Text style={styles.orderStatus}>狀態: {order.status || '待處理'}</Text>
                
                {order.items && order.items.length > 0 && (
                  <View style={styles.orderItems}>
                    <Text style={styles.orderItemsTitle}>訂單項目:</Text>
                    {order.items.map((item, itemIndex) => (
                      <Text key={itemIndex} style={styles.orderItem}>
                        • {item.materialName || item.name} x {item.quantity}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  // 完成材訂單管理
  if (currentPage === 'finished-orders') {
    return (
      <View style={styles.app}>
        <View style={styles.pageHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentPage('dashboard')}>
            <Text style={styles.backText}>← 返回</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>🏠 完成材訂單管理</Text>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => {
              setMaterialType('FINISHED');
              setSelectedMaterials([]);
              setShowMaterialSelection(true);
            }}
          >
            <Text style={styles.addButtonText}>+ 選擇完成材</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.pageContent} contentContainerStyle={{ paddingBottom: 100 }}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>載入中...</Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暫無完成材訂單</Text>
              <Text style={styles.emptyHint}>點擊上方「+ 選擇完成材」建立新訂單</Text>
            </View>
          ) : (
            orders.map((order, index) => (
              <View key={order.id || index} style={styles.orderCard}>
                <Text style={styles.orderNumber}>訂單 #{order.orderNumber || order.id}</Text>
                <Text style={styles.orderDate}>日期: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '未知'}</Text>
                <Text style={styles.orderStatus}>狀態: {order.status || '待處理'}</Text>
                
                {order.items && order.items.length > 0 && (
                  <View style={styles.orderItems}>
                    <Text style={styles.orderItemsTitle}>訂單項目:</Text>
                    {order.items.map((item, itemIndex) => (
                      <Text key={itemIndex} style={styles.orderItem}>
                        • {item.materialName || item.name} x {item.quantity}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  // 訂單狀態管理
  if (currentPage === 'order-status') {
    return (
      <View style={styles.app}>
        <View style={styles.pageHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentPage('dashboard')}>
            <Text style={styles.backText}>← 返回</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>📋 訂單狀態管理</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <ScrollView style={styles.pageContent} contentContainerStyle={{ paddingBottom: 100 }}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>載入中...</Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暫無訂單需要管理</Text>
            </View>
          ) : (
            orders.map((order, index) => (
              <View key={order.id || index} style={styles.statusCard}>
                <Text style={styles.orderNumber}>訂單 #{order.orderNumber || order.id}</Text>
                <Text style={styles.orderType}>類型: {order.type === 'FINISHED' ? '完成材' : '輔材'}</Text>
                <Text style={styles.orderDate}>日期: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '未知'}</Text>
                
                <View style={styles.statusSection}>
                  <Text style={styles.statusTitle}>訂單狀態:</Text>
                  <Text style={styles.statusValue}>{order.status || '待處理'}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.app}>
      {/* 材料選擇 Modal */}
      <Modal visible={showMaterialSelection} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                選擇{materialType === 'AUXILIARY' ? '輔材' : '完成材'}
              </Text>
              <TouchableOpacity onPress={() => setShowMaterialSelection(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.materialsList}>
              {materials
                .filter(material => material.type === materialType)
                .map((material, index) => (
                <TouchableOpacity
                  key={material.id || index}
                  style={styles.materialSelectCard}
                  onPress={() => handleSelectMaterial(material)}
                >
                  <Text style={styles.materialSelectName}>{material.name}</Text>
                  <Text style={styles.materialSelectPrice}>CAD ${material.price}</Text>
                  <Text style={styles.materialSelectStock}>庫存: {material.quantity}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.cart}>
              <Text style={styles.cartTitle}>已選擇的材料 ({selectedMaterials.length})</Text>
              {selectedMaterials.map((item, index) => (
                <View key={index} style={styles.cartItem}>
                  <Text style={styles.cartItemName}>{item.materialName}</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => handleUpdateQuantity(item.materialId, item.quantity - 1)}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => handleUpdateQuantity(item.materialId, item.quantity + 1)}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowMaterialSelection(false)}
              >
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.createOrderButton, selectedMaterials.length === 0 && styles.disabledButton]} 
                onPress={handleCreateOrder}
                disabled={selectedMaterials.length === 0}
              >
                <Text style={styles.createOrderText}>建立訂單</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>處理中...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // 登入相關樣式
  loginContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loginForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#007bff',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  
  // 快速登入
  quickLoginSection: {
    marginBottom: 20,
  },
  quickLoginTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  quickLoginGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickLoginButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  quickLoginName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickLoginRole: {
    fontSize: 12,
    color: '#666',
  },
  
  // 分隔線
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 14,
  },
  
  // 手動登入
  manualLoginSection: {
    marginTop: 10,
  },
  manualLoginTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  loginInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  loginButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // 主要內容
  container: {
    padding: 20,
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // 統計卡片
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flex: 0.48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  
  // 功能區域
  featuresSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  featuresGrid: {
    gap: 10,
  },
  featureCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  
  // 頁面標題
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#007bff',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#28a745',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 80,
  },
  
  // 頁面內容
  pageContent: {
    flex: 1,
    padding: 15,
  },
  
  // 載入狀態
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  
  // 空狀態
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  
  // 訂單卡片
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderStatus: {
    fontSize: 14,
    color: '#28a745',
    marginBottom: 8,
  },
  orderItems: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  orderItemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  
  // 狀態卡片
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderType: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 4,
  },
  statusSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    color: '#28a745',
  },
  
  // Modal 樣式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    padding: 5,
  },
  
  // 材料列表
  materialsList: {
    maxHeight: 200,
    marginBottom: 15,
  },
  materialSelectCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  materialSelectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  materialSelectPrice: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 2,
  },
  materialSelectStock: {
    fontSize: 12,
    color: '#666',
  },
  
  // 購物車
  cart: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  cartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cartItemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#007bff',
    borderRadius: 4,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quantityText: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  
  // Modal 按鈕
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 0.45,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  createOrderButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 0.45,
  },
  createOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  
  // 載入覆蓋層
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});