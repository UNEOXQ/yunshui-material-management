import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import { statusService } from '../../services/statusService';
import { Order, OrderItem } from '../../types';
import { MaterialSelectionModal, CartItem } from '../MaterialSelection/MaterialSelectionModal';
import { FinishedMaterialModal } from '../MaterialSelection/FinishedMaterialModal';
import OperationHistory from './OperationHistory';
import { processImageUrl } from '../../utils/imageUtils';

import './OrderManagement.css';

// 訂單名稱編輯器組件
interface OrderNameEditorProps {
  order: Order;
  onNameUpdate: () => void;
  canEdit: boolean;
}

const OrderNameEditor: React.FC<OrderNameEditorProps> = ({ order, onNameUpdate, canEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(order.name || '');
  const [saving, setSaving] = useState(false);

  const handleStartEdit = () => {
    setEditingName(order.name || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editingName.trim()) {
      alert('訂單名稱不能為空');
      return;
    }

    if (editingName.trim() === order.name) {
      setIsEditing(false);
      return;
    }

    try {
      setSaving(true);
      const response = await orderService.updateOrderName(order.id, editingName.trim());
      
      if (response.success) {
        setIsEditing(false);
        onNameUpdate(); // 重新載入訂單列表
      } else {
        alert(response.message || '更新訂單名稱失敗');
      }
    } catch (error: any) {
      console.error('更新訂單名稱失敗:', error);
      alert('更新訂單名稱失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingName(order.name || '');
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="order-name-editor">
      {isEditing ? (
        <div className="name-edit-mode">
          <input
            type="text"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="輸入訂單名稱"
            maxLength={100}
            disabled={saving}
            autoFocus
            className="name-input"
          />
          <div className="edit-actions">
            <button 
              onClick={handleSave} 
              disabled={saving || !editingName.trim()}
              className="btn btn-sm btn-primary"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button 
              onClick={handleCancel} 
              disabled={saving}
              className="btn btn-sm btn-secondary"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className="name-display-mode">
          <span className="order-name">
            {order.name || '未命名訂單'}
          </span>
          {canEdit && (
            <button 
              onClick={handleStartEdit}
              className="btn btn-sm btn-ghost edit-name-btn"
              title="編輯訂單名稱"
            >
              ✏️
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface AuxiliaryOrderPageProps {
  currentUser?: {
    role: string;
    username: string;
  };
}

export const AuxiliaryOrderPage: React.FC<AuxiliaryOrderPageProps> = ({ currentUser }) => {
  // 基本狀態
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});

  // 材料選擇模態框狀態
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isFinishedMaterialModalOpen, setIsFinishedMaterialModalOpen] = useState(false);

  // 倉管用戶的訂單類型選擇狀態
  const [selectedOrderType, setSelectedOrderType] = useState<'PM' | 'AM'>('PM');
  
  // 訂單過濾狀態
  const [orderFilter, setOrderFilter] = useState<'all' | 'processing' | 'completed'>('all');
  const [allOrders, setAllOrders] = useState<Order[]>([]); // 存儲所有訂單
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]); // 顯示的過濾後訂單

  // 圖片查看狀態
  const [selectedImage, setSelectedImage] = useState<{url: string, name: string} | null>(null);

  // 刪除訂單狀態
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{orderId: string, orderName: string} | null>(null);


  // 如果沒有傳入 currentUser，從 localStorage 獲取
  const user = currentUser || {
    role: localStorage.getItem('userRole') || 'PM',
    username: localStorage.getItem('username') || 'user'
  };

  // 檢查是否為倉管用戶或管理員（可以編輯狀態）
  const isWarehouseUser = user.role === 'WAREHOUSE' || user.role === 'ADMIN';
  
  // 檢查是否可以查看狀態（PM、AM、倉管、管理員都可以查看）
  const canViewStatus = ['PM', 'AM', 'WAREHOUSE', 'ADMIN'].includes(user.role);
  
  // 檢查是否為管理員（擁有所有權限）
  const isAdmin = user.role === 'ADMIN';
  
  // 獲取狀態選擇框的樣式
  const getSelectStyle = (isEditable: boolean = isWarehouseUser) => ({
    width: '100%',
    padding: '8px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '8px',
    backgroundColor: isEditable ? 'white' : '#f8f9fa',
    cursor: isEditable ? 'pointer' : 'default',
    color: isEditable ? '#495057' : '#6c757d'
  });

  // 獲取輸入框的樣式
  const getInputStyle = (isEditable: boolean = isWarehouseUser, fontSize: string = '13px') => ({
    width: '100%',
    padding: '8px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: fontSize,
    backgroundColor: isEditable ? 'white' : '#f8f9fa',
    cursor: isEditable ? 'text' : 'default',
    color: isEditable ? '#495057' : '#6c757d'
  });

  // 判斷訂單是否已完成（點收狀態非空白）
  const isOrderCompleted = (order: Order): boolean => {
    // 檢查前端狀態
    if (orderStatuses[order.id]?.checkStatus && orderStatuses[order.id]?.checkStatus !== '') {
      return true;
    }
    
    // 檢查後端狀態
    const backendCheckStatus = (order as any).latestStatuses?.CHECK?.statusValue;
    return backendCheckStatus && backendCheckStatus !== '' && backendCheckStatus !== '未設定';
  };

  // 過濾訂單
  const filterOrders = (orders: Order[], filter: 'all' | 'processing' | 'completed'): Order[] => {
    let filtered: Order[];
    
    switch (filter) {
      case 'completed':
        filtered = orders.filter(order => isOrderCompleted(order));
        break;
      case 'processing':
        filtered = orders.filter(order => !isOrderCompleted(order));
        break;
      case 'all':
      default:
        filtered = orders;
        break;
    }
    
    // 按創建時間排序，最新的在最上面
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // 降序排列（最新的在前）
    });
  };

  // 計算統計信息
  const getOrderStats = (orders: Order[]) => {
    const total = orders.length;
    const completed = orders.filter(order => isOrderCompleted(order)).length;
    const processing = total - completed;
    
    return { total, processing, completed };
  };

  // 刪除訂單處理函數
  const handleDeleteOrder = async (orderId: string) => {
    if (!isAdmin) return;

    try {
      setDeletingOrderId(orderId);
      const response = await orderService.deleteOrder(orderId);
      
      if (response.success) {
        // 重新載入訂單列表
        await loadOrders();
        setShowDeleteConfirm(null);
        alert('訂單已成功刪除');
      } else {
        alert(response.message || '刪除訂單失敗');
      }
    } catch (error: any) {
      console.error('刪除訂單失敗:', error);
      alert('刪除訂單失敗');
    } finally {
      setDeletingOrderId(null);
    }
  };

  // 狀態管理
  const [orderStatuses, setOrderStatuses] = useState<Record<string, {
    orderStatus: string;
    orderSecondaryStatus: string;
    pickupStatus: string;
    pickupSecondaryStatus: string;
    deliveryStatus: string;
    checkStatus: string;
    deliveryDetails: {
      time: string;
      address: string;
      po: string;
      deliveredBy: string;
    };
  }>>({});

  // 追蹤用戶是否有進行過任何操作
  const [userInteractions, setUserInteractions] = useState<Record<string, boolean>>({});

  // 從 localStorage 載入重置狀態
  const loadResetStates = () => {
    try {
      const saved = localStorage.getItem('orderResetStates');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  // 保存重置狀態到 localStorage
  const saveResetStates = (resetStates: Record<string, any>) => {
    try {
      localStorage.setItem('orderResetStates', JSON.stringify(resetStates));
    } catch (error) {
      console.error('Failed to save reset states:', error);
    }
  };

  // 重置狀態管理
  const [resetStates, setResetStates] = useState<Record<string, {
    orderStatus?: boolean;
    pickupStatus?: boolean;
    deliveryStatus?: boolean;
    checkStatus?: boolean;
  }>>(loadResetStates);

  // 調試用戶信息
  console.log('AuxiliaryOrderPage - 用戶信息:', {
    currentUser,
    user,
    token: localStorage.getItem('authToken'),
    role: localStorage.getItem('userRole'),
    username: localStorage.getItem('username')
  });

  useEffect(() => {
    // 切換訂單類型時重置過濾器
    setOrderFilter('all');
    loadOrders();
    preloadUserRoles(); // 預載入用戶角色信息
  }, [selectedOrderType]); // 當選擇的訂單類型改變時重新載入

  // 當過濾器或訂單狀態改變時重新過濾
  useEffect(() => {
    const filtered = filterOrders(allOrders, orderFilter);
    setFilteredOrders(filtered);
    setOrders(filtered); // 保持向後兼容
  }, [orderFilter, allOrders, orderStatuses]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('開始載入訂單...');
      
      // 根據用戶角色載入不同類型的訂單
      let response;
      if (user.role === 'AM') {
        response = await orderService.getFinishedOrders();
      } else if (user.role === 'WAREHOUSE' || user.role === 'ADMIN') {
        // 倉管用戶和管理員根據選擇的類型載入訂單
        if (selectedOrderType === 'AM') {
          response = await orderService.getFinishedOrders();
        } else {
          response = await orderService.getAuxiliaryOrders();
        }
      } else {
        response = await orderService.getAuxiliaryOrders();
      }
      
      console.log('API 回應:', response);
      
      if (response.success && response.data) {
        console.log('成功載入訂單:', response.data.orders);
        const loadedOrders = response.data.orders;
        setAllOrders(loadedOrders);
        
        // 應用當前過濾器
        const filtered = filterOrders(loadedOrders, orderFilter);
        setFilteredOrders(filtered);
        setOrders(filtered); // 保持向後兼容
      } else {
        console.log('載入訂單失敗:', response.message);
        setError(response.message || '載入訂單失敗');
      }
    } catch (err) {
      console.error('載入訂單時發生錯誤:', err);
      setError('載入訂單時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 移除輔材選擇相關函數，倉管只需要管理狀態

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUsernameFromId = (userId: string): string => {
    // 映射真實用戶ID到用戶名（使用最新的名稱）
    const userMap = {
      'user-1': 'admin000000',
      'user-2': 'pm001',
      'user-3': 'am001', 
      'user-4': '馬克'
    };
    
    // 嘗試從localStorage獲取最新的用戶名稱
    try {
      const quickLoginUsers = localStorage.getItem('quickLoginUsers');
      if (quickLoginUsers) {
        const users = JSON.parse(quickLoginUsers);
        const user = users.find((u: any) => u.id === userId);
        if (user) {
          return user.username;
        }
      }
    } catch (error) {
      console.log('Failed to get username from localStorage');
    }
    
    // 回退到映射表
    return userMap[userId as keyof typeof userMap] || userId;
  };

  // 用戶角色緩存
  const [userRoleCache, setUserRoleCache] = useState<{ [key: string]: string }>({});

  const getRoleFromUserId = (userId: string): string => {
    // 檢查緩存
    if (userRoleCache[userId]) {
      return userRoleCache[userId];
    }

    // 靜態映射表（作為後備）
    const staticRoleMap: { [key: string]: string } = {
      'user-1': 'ADMIN',
      'user-2': 'PM',
      'user-3': 'AM', 
      'user-4': 'WAREHOUSE',
      'id-2064': 'AM',
      'id-2065': 'PM'
    };
    
    if (staticRoleMap[userId]) {
      return staticRoleMap[userId];
    }

    // 如果找不到映射，記錄日誌並返回默認值
    console.log(`⚠️ 未找到用戶 ID ${userId} 的角色映射，返回 USER`);
    return 'USER';
  };

  // 預載入用戶角色信息
  const preloadUserRoles = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const roleCache: { [key: string]: string } = {};
          result.data.forEach((user: any) => {
            roleCache[user.id] = user.role;
          });
          setUserRoleCache(roleCache);
          console.log('✅ 用戶角色信息預載入完成:', roleCache);
        }
      }
    } catch (error) {
      console.warn('預載入用戶角色失敗:', error);
    }
  };

  // 處理輔材訂單創建
  const handleCreateAuxiliaryOrder = async (cartItems: CartItem[]) => {
    try {
      setLoading(true);
      const orderItems = cartItems.map(item => ({
        materialId: item.materialId,
        quantity: item.quantity
      }));

      const response = await orderService.createAuxiliaryOrder({ items: orderItems });
      
      if (response.success) {
        setIsMaterialModalOpen(false);
        await loadOrders(); // 重新載入訂單列表
        alert('輔材訂單創建成功！');
      } else {
        throw new Error(response.message || '創建訂單失敗');
      }
    } catch (error: any) {
      console.error('創建輔材訂單失敗:', error);
      alert(`創建訂單失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 處理完成材訂單創建
  const handleCreateFinishedOrder = async (cartItems: CartItem[]) => {
    try {
      setLoading(true);
      const orderItems = cartItems.map(item => ({
        materialId: item.materialId,
        quantity: item.quantity
      }));

      const response = await orderService.createFinishedOrder({ items: orderItems });
      
      if (response.success) {
        setIsFinishedMaterialModalOpen(false);
        await loadOrders(); // 重新載入訂單列表
        alert('完成材訂單創建成功！');
      } else {
        throw new Error(response.message || '創建訂單失敗');
      }
    } catch (error: any) {
      console.error('創建完成材訂單失敗:', error);
      alert(`創建訂單失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auxiliary-order-page">

      <div className="page-header">
        <div className="header-content">
          <h1>
            {user.role === 'AM' ? '完成材訂單狀態管理' : 
             user.role === 'PM' ? '輔材訂單狀態管理' : 
             (user.role === 'WAREHOUSE' || user.role === 'ADMIN') ? '訂單狀態管理' :
             '訂單狀態管理'}
          </h1>
          <p>
            {user.role === 'AM' ? '管理完成材訂單狀態和追蹤進度' : 
             user.role === 'PM' ? '管理輔材訂單狀態和追蹤進度' : 
             (user.role === 'WAREHOUSE' || user.role === 'ADMIN') ? '管理所有訂單狀態和追蹤進度' :
             '管理訂單狀態和追蹤進度'}
          </p>
        </div>
        <div className="header-actions">
          {/* 倉管用戶和管理員的訂單類型選擇器 */}
          {(user.role === 'WAREHOUSE' || user.role === 'ADMIN') && (
            <div className="order-type-selector">
              <label style={{ marginRight: '10px', fontWeight: '600', color: '#ffffff' }}>
                訂單類型：
              </label>
              <div className="type-toggle-buttons">
                <button
                  className={`toggle-btn ${selectedOrderType === 'PM' ? 'active' : ''}`}
                  onClick={() => setSelectedOrderType('PM')}
                >
                  📦 PM輔材
                </button>
                <button
                  className={`toggle-btn ${selectedOrderType === 'AM' ? 'active' : ''}`}
                  onClick={() => setSelectedOrderType('AM')}
                >
                  🏗️ AM完成材
                </button>
              </div>
            </div>
          )}
          
          {/* 根據用戶角色顯示不同的材料選擇按鈕 */}
          {user.role === 'PM' && (
            <button 
              className="btn btn-primary"
              onClick={() => setIsMaterialModalOpen(true)}
            >
              + 選擇輔材
            </button>
          )}
          {user.role === 'AM' && (
            <button 
              className="btn btn-primary"
              onClick={() => setIsFinishedMaterialModalOpen(true)}
            >
              + 選擇完成材
            </button>
          )}
          {/* 管理員可以使用所有下訂單功能 */}
          {user.role === 'ADMIN' && (
            <div className="admin-order-buttons">
              <button 
                className="btn btn-primary"
                onClick={() => setIsMaterialModalOpen(true)}
                title="以管理員身份下輔材訂單"
              >
                + 選擇輔材
              </button>
              <button 
                className="btn btn-success"
                onClick={() => setIsFinishedMaterialModalOpen(true)}
                title="以管理員身份下完成材訂單"
              >
                + 選擇完成材
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="page-content">
        {error && (
          <div className="error-message">
            {error}
            <button 
              className="btn-close"
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        )}

        <div className="orders-section">
          <div className="section-header">
            <div className="section-title-group">
              <h2>
                {user.role === 'WAREHOUSE' ? 
                  `${selectedOrderType === 'PM' ? 'PM輔材' : 'AM完成材'}訂單記錄` : 
                  user.role === 'ADMIN' ?
                  `${selectedOrderType === 'PM' ? 'PM輔材' : 'AM完成材'}訂單記錄` :
                  user.role === 'PM' ? '輔材訂單記錄' :
                  user.role === 'AM' ? '完成材訂單記錄' :
                  '訂單記錄'}
              </h2>
              {canViewStatus && orderFilter !== 'all' && (
                <span className="filter-indicator">
                  {orderFilter === 'processing' ? 
                    (user.role === 'WAREHOUSE' || user.role === 'ADMIN' ? '🔄 顯示處理中' : '🔄 顯示倉管處理中') : 
                    (user.role === 'WAREHOUSE' || user.role === 'ADMIN' ? '✅ 顯示已完成' : '✅ 顯示倉管已完成')}
                </span>
              )}
            </div>
            {canViewStatus && allOrders.length > 0 && (
              <div className="order-stats-container">
                {user.role !== 'WAREHOUSE' && user.role !== 'ADMIN' && (
                  <div className="stats-description">
                    <span className="stats-hint">
                      💡 點擊統計按鈕可快速篩選訂單 • 已完成 = 倉管已點收 • 狀態即時更新
                    </span>
                  </div>
                )}
                {user.role === 'ADMIN' && (
                  <div className="stats-description">
                    <span className="stats-hint admin-hint">
                      🔧 管理員模式 • 可編輯所有狀態 • 可下所有類型訂單 • 點擊統計按鈕篩選訂單
                    </span>
                  </div>
                )}
                <div className="order-stats">
                  {(() => {
                    const stats = getOrderStats(allOrders);
                    return (
                      <>
                        <button
                          className={`stat-button ${orderFilter === 'all' ? 'active' : ''}`}
                          onClick={() => setOrderFilter('all')}
                          title="顯示所有訂單"
                        >
                          📊 共 {stats.total} 筆訂單
                        </button>
                        <button
                          className={`stat-button ${orderFilter === 'processing' ? 'active' : ''}`}
                          onClick={() => setOrderFilter('processing')}
                          title={user.role === 'WAREHOUSE' || user.role === 'ADMIN' ? '顯示處理中的訂單' : '顯示倉管處理中的訂單'}
                        >
                          🔄 {stats.processing} 筆處理中
                        </button>
                        <button
                          className={`stat-button ${orderFilter === 'completed' ? 'active' : ''}`}
                          onClick={() => setOrderFilter('completed')}
                          title={user.role === 'WAREHOUSE' || user.role === 'ADMIN' ? '顯示已完成的訂單' : '顯示倉管已完成的訂單'}
                        >
                          ✅ {stats.completed} 筆已完成
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
          



          
          {loading && orders.length === 0 ? (
            <div className="loading-orders">
              <div className="loading-spinner"></div>
              <p>載入訂單中...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-orders">
              <div className="empty-icon">📋</div>
              {allOrders.length === 0 ? (
                <>
                  <p>尚無訂單記錄</p>
                  <p className="empty-hint">暫無訂單需要管理狀態</p>
                </>
              ) : (
                <>
                  <p>沒有符合條件的訂單</p>
                  <p className="empty-hint">
                    {orderFilter === 'processing' ? '目前沒有處理中的訂單' : 
                     orderFilter === 'completed' ? '目前沒有已完成的訂單' : 
                     '請檢查過濾條件'}
                  </p>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setOrderFilter('all')}
                  >
                    顯示所有訂單
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order.id} className="order-card with-status">
                  {/* 右上角狀態顯示 */}
                  <div className="order-status-indicator">
                    {(() => {
                      // 獲取當前狀態（前端優先，後端備用）
                      const checkStatus = orderStatuses[order.id]?.checkStatus !== undefined ? 
                                        orderStatuses[order.id]?.checkStatus : 
                                        (order as any).latestStatuses?.CHECK?.statusValue;
                      const deliveryStatus = orderStatuses[order.id]?.deliveryStatus !== undefined ? 
                                           orderStatuses[order.id]?.deliveryStatus : 
                                           (order as any).latestStatuses?.DELIVERY?.statusValue;
                      const pickupStatus = orderStatuses[order.id]?.pickupStatus !== undefined ? 
                                         orderStatuses[order.id]?.pickupStatus : 
                                         (order as any).latestStatuses?.PICKUP?.statusValue;
                      const orderStatus = orderStatuses[order.id]?.orderStatus !== undefined ? 
                                        orderStatuses[order.id]?.orderStatus : 
                                        (order as any).latestStatuses?.ORDER?.statusValue;
                      
                      // 優先級：點收 > 到案 > 取貨 > 叫貨
                      if (checkStatus && checkStatus !== '' && checkStatus !== '未設定') {
                        return (
                          <span className="status-badge check-status" title="點收狀態">
                            📋 {checkStatus}
                          </span>
                        );
                      } else if (deliveryStatus && deliveryStatus !== '' && deliveryStatus !== '未設定') {
                        return (
                          <span className="status-badge delivery-status" title="到案狀態">
                            🚚 {deliveryStatus}
                          </span>
                        );
                      } else if (pickupStatus && pickupStatus !== '' && pickupStatus !== '未設定') {
                        const secondaryStatus = orderStatuses[order.id]?.pickupSecondaryStatus || '';
                        return (
                          <span className="status-badge pickup-status" title="取貨狀態">
                            📦 {pickupStatus} {secondaryStatus}
                          </span>
                        );
                      } else if (orderStatus && orderStatus !== '' && orderStatus !== '未設定') {
                        const secondaryStatus = orderStatuses[order.id]?.orderSecondaryStatus || '';
                        return (
                          <span className="status-badge order-status" title="叫貨狀態">
                            📞 {orderStatus} {secondaryStatus}
                          </span>
                        );
                      }
                      
                      return (
                        <span className="status-badge no-status" title="尚無狀態">
                          ⏳ 待處理
                        </span>
                      );
                    })()}
                  </div>
                  
                  <div className="order-header">
                    <div className="order-info">
                      <div className="order-title-section">
                        <div className="order-title-row">
                          <span className="order-id">訂單 #{order.id}</span>
                          
                          {/* 管理員刪除按鈕 */}
                          {isAdmin && (
                            <button
                              className="btn btn-danger btn-sm delete-order-btn"
                              onDoubleClick={() => setShowDeleteConfirm({
                                orderId: order.id,
                                orderName: order.name || `訂單 #${order.id}`
                              })}
                              disabled={deletingOrderId === order.id}
                              title="雙擊刪除訂單（管理員專用）"
                            >
                              {deletingOrderId === order.id ? '刪除中...' : '刪除'}
                            </button>
                          )}
                        </div>
                        {/* 可編輯的訂單名稱 */}
                        <OrderNameEditor 
                          order={order}
                          onNameUpdate={loadOrders}
                          canEdit={user.role === 'PM' || user.role === 'AM' || user.role === 'ADMIN'}
                        />
                      </div>
                      <span className="order-date">{formatDate(order.createdAt)}</span>
                      <span className="order-creator">
                        創建者: {getUsernameFromId(order.userId)} 
                        <span className={`role-badge role-${getRoleFromUserId(order.userId)?.toLowerCase()}`}>
                          {getRoleFromUserId(order.userId) === 'PM' ? 'PM-輔材' : 
                           getRoleFromUserId(order.userId) === 'AM' ? 'AM-完成材' : 
                           getRoleFromUserId(order.userId)}
                        </span>
                      </span>
                    </div>

                  </div>
                  
                  <div className="order-items-grid">
                    {order.items.map((item: OrderItem, index: number) => (
                      <div key={`${order.id}-item-${index}`} className="order-item-compact">
                        {/* 材料圖片 */}
                        <div className="item-image-small">
                          {(() => {
                            const rawImageUrl = item.imageUrl || item.material?.imageUrl;
                            const processedImageUrl = processImageUrl(rawImageUrl);
                            return processedImageUrl ? (
                              <img 
                                src={processedImageUrl} 
                                alt={item.materialName || item.material?.name || '材料圖片'}
                                className="material-image-small"
                                onClick={() => setSelectedImage({
                                  url: processedImageUrl,
                                  name: item.materialName || item.material?.name || '材料圖片'
                                })}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const placeholder = target.nextElementSibling as HTMLElement;
                                  if (placeholder) placeholder.style.display = 'flex';
                                }}
                                title="點擊查看大圖"
                              />
                            ) : null;
                          })()}
                          <div 
                            className="image-placeholder-small"
                            style={{ 
                              display: processImageUrl(item.imageUrl || item.material?.imageUrl) ? 'none' : 'flex' 
                            }}
                          >
                            <span className="placeholder-icon-small">
                              {item.materialType === 'FINISHED' ? '🏗️' : '🔧'}
                            </span>
                          </div>
                        </div>
                        
                        {/* 緊湊的材料信息 */}
                        <div className="item-content-compact">
                          <div className="item-name-compact" title={item.materialName || item.material?.name || '未知材料'}>
                            {item.materialName || item.material?.name || '未知材料'}
                          </div>
                          <div className="item-quantity-compact">x{item.quantity}</div>
                          <div className="item-price-compact">{formatPrice(item.quantity * item.unitPrice)}</div>
                          {/* 供應商信息 */}
                          {(item.supplier || item.material?.supplier) && (
                            <div className="item-supplier-compact" title={`供應商: ${item.supplier || item.material?.supplier}`}>
                              🏢 {item.supplier || item.material?.supplier}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="order-total">
                    <span>總金額: {formatPrice(order.totalAmount)}</span>
                  </div>

                  {/* 狀態管理欄位 - 所有用戶都可以查看 */}
                  {canViewStatus && (
                    <div className="status-management-section" style={{
                      backgroundColor: '#f8f9fa',
                      padding: '20px',
                      margin: '15px 0',
                      borderRadius: '8px',
                      border: '1px solid #dee2e6'
                    }}>
                      <h4 style={{ 
                        color: '#495057', 
                        textAlign: 'center', 
                        marginBottom: '20px',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}>
                        {isWarehouseUser ? '訂單狀態管理' : '訂單狀態查看'}
                      </h4>
                      
                      {/* 非倉管用戶的提示 */}
                      {!isWarehouseUser && (
                        <div style={{
                          textAlign: 'center',
                          color: '#6c757d',
                          fontSize: '14px',
                          marginBottom: '15px',
                          padding: '8px',
                          backgroundColor: '#e9ecef',
                          borderRadius: '4px'
                        }}>
                          📋 您可以查看訂單狀態，狀態更新由倉管人員負責
                        </div>
                      )}


                    
                    <div className="status-columns" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '15px'
                    }}>
                      {/* 叫貨狀態 */}
                      <div className="status-column" style={{
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        padding: '15px',
                        backgroundColor: orderStatuses[order.id]?.orderStatus ? '#e8f5e8' : 'white',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          color: '#495057',
                          padding: '0 0 10px 0',
                          textAlign: 'center',
                          fontWeight: '600',
                          fontSize: '14px',
                          borderBottom: '1px solid #dee2e6',
                          marginBottom: '10px'
                        }}>
                          叫貨狀態
                        </div>

                        {/* 顯示當前叫貨狀態 */}
                        {(() => {
                          // 如果前端狀態存在且不為空，使用前端狀態
                          if (orderStatuses[order.id]?.orderStatus) {
                            return orderStatuses[order.id].orderStatus;
                          }
                          // 如果前端狀態明確設置為空字符串（重置狀態），不顯示任何狀態
                          if (orderStatuses[order.id] && orderStatuses[order.id].orderStatus === '') {
                            return null;
                          }
                          // 檢查是否有持久化的重置狀態
                          if (resetStates[order.id]?.orderStatus) {
                            return null;
                          }
                          // 否則使用後端狀態
                          return (order as any).latestStatuses?.ORDER?.statusValue;
                        })() && (
                          <div style={{
                            backgroundColor: '#e8f5e8',
                            border: '1px solid #c3e6cb',
                            borderRadius: '4px',
                            padding: '8px',
                            marginBottom: '10px',
                            fontSize: '12px',
                            color: '#155724',
                            textAlign: 'center'
                          }}>
                            <strong>目前狀態:</strong><br/>
                            {(() => {
                              if (orderStatuses[order.id]?.orderStatus) {
                                return orderStatuses[order.id].orderStatus;
                              }
                              return (order as any).latestStatuses?.ORDER?.statusValue;
                            })()}
                            {orderStatuses[order.id]?.orderSecondaryStatus && ` - ${orderStatuses[order.id]?.orderSecondaryStatus}`}
                          </div>
                        )}
                        <select 
                          className="status-select"
                          style={getSelectStyle()}
                          value={orderStatuses[order.id]?.orderStatus || ''}
                          disabled={!isWarehouseUser}
                          onChange={(e) => {
                            if (!isWarehouseUser) return;
                            
                            // 標記用戶有進行過操作
                            setUserInteractions(prev => ({
                              ...prev,
                              [order.id]: true
                            }));
                            
                            // 如果用戶選擇了實際狀態，清除重置標記
                            if (e.target.value && e.target.value !== '' && resetStates[order.id]?.orderStatus) {
                              const newResetStates = { ...resetStates };
                              delete newResetStates[order.id].orderStatus;
                              if (Object.keys(newResetStates[order.id]).length === 0) {
                                delete newResetStates[order.id];
                              }
                              setResetStates(newResetStates);
                              saveResetStates(newResetStates);
                            }
                            
                            setOrderStatuses(prev => ({
                              ...prev,
                              [order.id]: {
                                ...prev[order.id],
                                orderStatus: e.target.value,
                                orderSecondaryStatus: e.target.value === '' ? '' : 
                                  e.target.value === 'Ordered' ? 
                                  (prev[order.id]?.orderSecondaryStatus || 'Processing') : ''
                              }
                            }));
                          }}
                        >
                          <option value="" style={{ color: '#6c757d', fontStyle: 'italic' }}>-- 請選擇叫貨狀態 --</option>
                          <option value="Ordered">Ordered</option>
                        </select>

                        {/* 當選擇 Ordered 時顯示次要狀態 */}
                        {orderStatuses[order.id]?.orderStatus === 'Ordered' && (
                          <select 
                            className="status-select secondary"
                            style={getSelectStyle()}
                            value={orderStatuses[order.id]?.orderSecondaryStatus || ''}
                            disabled={!isWarehouseUser}
                            onChange={(e) => {
                              if (!isWarehouseUser) return;
                              
                              // 標記用戶有進行過操作
                              setUserInteractions(prev => ({
                                ...prev,
                                [order.id]: true
                              }));
                              
                              setOrderStatuses(prev => ({
                                ...prev,
                                [order.id]: {
                                  ...prev[order.id],
                                  orderSecondaryStatus: e.target.value
                                }
                              }));
                            }}
                          >
                            <option value="" style={{ color: '#6c757d', fontStyle: 'italic' }}>-- 請選擇處理狀態 --</option>
                            <option value="Processing">Processing</option>
                            <option value="waiting for pick">waiting for pick</option>
                            <option value="pending">pending</option>
                          </select>
                        )}

                      </div>

                      {/* 取貨狀態 */}
                      <div className="status-column" style={{
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        padding: '15px',
                        backgroundColor: orderStatuses[order.id]?.pickupStatus ? '#e8f5e8' : 'white',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          color: '#495057',
                          padding: '0 0 10px 0',
                          textAlign: 'center',
                          fontWeight: '600',
                          fontSize: '14px',
                          borderBottom: '1px solid #dee2e6',
                          marginBottom: '10px'
                        }}>
                          取貨狀態
                        </div>

                        {/* 顯示當前取貨狀態 */}
                        {(() => {
                          // 如果前端狀態存在且不為空，使用前端狀態
                          if (orderStatuses[order.id]?.pickupStatus) {
                            return orderStatuses[order.id].pickupStatus;
                          }
                          // 如果前端狀態明確設置為空字符串（重置狀態），不顯示任何狀態
                          if (orderStatuses[order.id] && orderStatuses[order.id].pickupStatus === '') {
                            return null;
                          }
                          // 檢查是否有持久化的重置狀態
                          if (resetStates[order.id]?.pickupStatus) {
                            return null;
                          }
                          // 否則使用後端狀態
                          return (order as any).latestStatuses?.PICKUP?.statusValue;
                        })() && (
                          <div style={{
                            backgroundColor: '#e8f5e8',
                            border: '1px solid #c3e6cb',
                            borderRadius: '4px',
                            padding: '8px',
                            marginBottom: '10px',
                            fontSize: '12px',
                            color: '#155724',
                            textAlign: 'center'
                          }}>
                            <strong>目前狀態:</strong><br/>
                            {(() => {
                              if (orderStatuses[order.id]?.pickupStatus) {
                                return orderStatuses[order.id].pickupStatus;
                              }
                              return (order as any).latestStatuses?.PICKUP?.statusValue;
                            })()}
                            {orderStatuses[order.id]?.pickupSecondaryStatus && ` ${orderStatuses[order.id]?.pickupSecondaryStatus}`}
                          </div>
                        )}
                        <select 
                          className="status-select"
                          style={getSelectStyle()}
                          value={orderStatuses[order.id]?.pickupStatus || ''}
                          disabled={!isWarehouseUser}
                          onChange={(e) => {
                            if (!isWarehouseUser) return;
                            
                            // 標記用戶有進行過操作
                            setUserInteractions(prev => ({
                              ...prev,
                              [order.id]: true
                            }));
                            
                            // 如果用戶選擇了實際狀態，清除重置標記
                            if (e.target.value && e.target.value !== '' && resetStates[order.id]?.pickupStatus) {
                              const newResetStates = { ...resetStates };
                              delete newResetStates[order.id].pickupStatus;
                              if (Object.keys(newResetStates[order.id]).length === 0) {
                                delete newResetStates[order.id];
                              }
                              setResetStates(newResetStates);
                              saveResetStates(newResetStates);
                            }
                            
                            setOrderStatuses(prev => ({
                              ...prev,
                              [order.id]: {
                                ...prev[order.id],
                                pickupStatus: e.target.value,
                                pickupSecondaryStatus: e.target.value === '' ? '' :
                                  e.target.value === 'Picked' ? 
                                  (prev[order.id]?.pickupSecondaryStatus || '(B.T.W)') : 
                                  e.target.value === 'Failed' ? 
                                  (prev[order.id]?.pickupSecondaryStatus || '(E.S)') : ''
                              }
                            }));
                          }}
                        >
                          <option value="" style={{ color: '#6c757d', fontStyle: 'italic' }}>-- 請選擇取貨狀態 --</option>
                          <option value="Picked">Picked</option>
                          <option value="Failed">Failed</option>
                        </select>

                        {/* 當選擇 Picked 或 Failed 時顯示次要狀態 */}
                        {orderStatuses[order.id]?.pickupStatus && (
                          <select 
                            className="status-select secondary"
                            style={getSelectStyle()}
                            value={orderStatuses[order.id]?.pickupSecondaryStatus || ''}
                            disabled={!isWarehouseUser}
                            onChange={(e) => {
                              if (!isWarehouseUser) return;
                              
                              // 標記用戶有進行過操作
                              setUserInteractions(prev => ({
                                ...prev,
                                [order.id]: true
                              }));
                              
                              setOrderStatuses(prev => ({
                                ...prev,
                                [order.id]: {
                                  ...prev[order.id],
                                  pickupSecondaryStatus: e.target.value
                                }
                              }));
                            }}
                          >
                            <option value="" style={{ color: '#6c757d', fontStyle: 'italic' }}>-- 請選擇取貨結果 --</option>
                            {orderStatuses[order.id]?.pickupStatus === 'Picked' ? (
                              <>
                                <option value="(B.T.W)">(B.T.W)</option>
                                <option value="(D.T.S)">(D.T.S)</option>
                                <option value="(B.T.W/MP)">(B.T.W/MP)</option>
                                <option value="(D.T.S/MP)">(D.T.S/MP)</option>
                              </>
                            ) : (
                              <>
                                <option value="(E.S)">(E.S)</option>
                                <option value="(E.H)">(E.H)</option>
                              </>
                            )}
                          </select>
                        )}

                      </div>

                      {/* 到案狀態 */}
                      <div className="status-column" style={{
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        padding: '15px',
                        backgroundColor: orderStatuses[order.id]?.deliveryStatus ? '#e8f5e8' : 'white',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          color: '#495057',
                          padding: '0 0 10px 0',
                          textAlign: 'center',
                          fontWeight: '600',
                          fontSize: '14px',
                          borderBottom: '1px solid #dee2e6',
                          marginBottom: '10px'
                        }}>
                          到案狀態
                        </div>

                        {/* 顯示當前到案狀態 */}
                        {(() => {
                          // 如果前端狀態存在且不為空，使用前端狀態
                          if (orderStatuses[order.id]?.deliveryStatus) {
                            return orderStatuses[order.id].deliveryStatus;
                          }
                          // 如果前端狀態明確設置為空字符串（重置狀態），不顯示任何狀態
                          if (orderStatuses[order.id] && orderStatuses[order.id].deliveryStatus === '') {
                            return null;
                          }
                          // 檢查是否有持久化的重置狀態
                          if (resetStates[order.id]?.deliveryStatus) {
                            return null;
                          }
                          // 否則使用後端狀態
                          return (order as any).latestStatuses?.DELIVERY?.statusValue;
                        })() && (
                          <div style={{
                            backgroundColor: '#e8f5e8',
                            border: '1px solid #c3e6cb',
                            borderRadius: '4px',
                            padding: '8px',
                            marginBottom: '10px',
                            fontSize: '12px',
                            color: '#155724',
                            textAlign: 'center'
                          }}>
                            <strong>目前狀態:</strong><br/>
                            {(() => {
                              if (orderStatuses[order.id]?.deliveryStatus) {
                                return orderStatuses[order.id].deliveryStatus;
                              }
                              return (order as any).latestStatuses?.DELIVERY?.statusValue;
                            })()}
                          </div>
                        )}

                        {/* 顯示 Delivered 詳細資訊 */}
                        {(orderStatuses[order.id]?.deliveryStatus === 'Delivered' || (order as any).latestStatuses?.DELIVERY?.statusValue === 'Delivered') && 
                         (orderStatuses[order.id]?.deliveryDetails || (order as any).latestStatuses?.DELIVERY?.additionalData) && (
                          <div style={{
                            backgroundColor: '#f8fff9',
                            border: '1px solid #c3e6cb',
                            borderRadius: '4px',
                            padding: '10px',
                            marginBottom: '10px',
                            fontSize: '11px',
                            color: '#155724'
                          }}>
                            <div style={{ fontWeight: '600', marginBottom: '6px', textAlign: 'center' }}>
                              到案詳細資訊
                            </div>
                            {(orderStatuses[order.id]?.deliveryDetails?.time || (order as any).latestStatuses?.DELIVERY?.additionalData?.time) && (
                              <div><strong>時間:</strong> {orderStatuses[order.id]?.deliveryDetails?.time || (order as any).latestStatuses?.DELIVERY?.additionalData?.time}</div>
                            )}
                            {(orderStatuses[order.id]?.deliveryDetails?.address || (order as any).latestStatuses?.DELIVERY?.additionalData?.address) && (
                              <div><strong>地址:</strong> {orderStatuses[order.id]?.deliveryDetails?.address || (order as any).latestStatuses?.DELIVERY?.additionalData?.address}</div>
                            )}
                            {(orderStatuses[order.id]?.deliveryDetails?.po || (order as any).latestStatuses?.DELIVERY?.additionalData?.po) && (
                              <div><strong>P.O:</strong> {orderStatuses[order.id]?.deliveryDetails?.po || (order as any).latestStatuses?.DELIVERY?.additionalData?.po}</div>
                            )}
                            {(orderStatuses[order.id]?.deliveryDetails?.deliveredBy || (order as any).latestStatuses?.DELIVERY?.additionalData?.deliveredBy) && (
                              <div><strong>送貨人員:</strong> {orderStatuses[order.id]?.deliveryDetails?.deliveredBy || (order as any).latestStatuses?.DELIVERY?.additionalData?.deliveredBy}</div>
                            )}
                          </div>
                        )}
                        <select 
                          className="status-select"
                          style={{...getSelectStyle(), marginBottom: '10px'}}
                          value={orderStatuses[order.id]?.deliveryStatus || ''}
                          disabled={!isWarehouseUser}
                          onChange={(e) => {
                            if (!isWarehouseUser) return;
                            
                            // 標記用戶有進行過操作
                            setUserInteractions(prev => ({
                              ...prev,
                              [order.id]: true
                            }));
                            
                            const value = e.target.value;
                            
                            // 如果用戶選擇了實際狀態，清除重置標記
                            if (value && value !== '' && resetStates[order.id]?.deliveryStatus) {
                              const newResetStates = { ...resetStates };
                              delete newResetStates[order.id].deliveryStatus;
                              if (Object.keys(newResetStates[order.id]).length === 0) {
                                delete newResetStates[order.id];
                              }
                              setResetStates(newResetStates);
                              saveResetStates(newResetStates);
                            }
                            
                            setOrderStatuses(prev => ({
                              ...prev,
                              [order.id]: {
                                ...prev[order.id],
                                deliveryStatus: value,
                                deliveryDetails: value === 'Delivered' ? (prev[order.id]?.deliveryDetails || {
                                  time: '',
                                  address: '',
                                  po: '',
                                  deliveredBy: ''
                                }) : prev[order.id]?.deliveryDetails
                              }
                            }));
                          }}
                        >
                          <option value="" style={{ color: '#6c757d', fontStyle: 'italic' }}>-- 請選擇到案狀態 --</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                        


                        {/* 當選擇 Delivered 時顯示詳細資訊輸入 */}
                        {orderStatuses[order.id]?.deliveryStatus === 'Delivered' && isWarehouseUser && (
                          <div style={{
                            border: '1px solid #c3e6cb',
                            padding: '15px',
                            backgroundColor: '#f8fff9',
                            borderRadius: '6px',
                            marginTop: '10px'
                          }}>
                            <div style={{ 
                              color: '#155724', 
                              fontWeight: '600', 
                              marginBottom: '15px',
                              textAlign: 'center',
                              fontSize: '14px'
                            }}>
                              填寫到案詳細資訊
                            </div>
                            
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ 
                                display: 'block', 
                                fontWeight: '600', 
                                marginBottom: '5px',
                                fontSize: '13px',
                                color: '#495057'
                              }}>
                                Time:
                              </label>
                              <input
                                type="text"
                                value={orderStatuses[order.id]?.deliveryDetails?.time || ''}
                                readOnly={!isWarehouseUser}
                                onChange={(e) => {
                                  if (!isWarehouseUser) return;
                                  setOrderStatuses(prev => ({
                                    ...prev,
                                    [order.id]: {
                                      ...prev[order.id],
                                      deliveryDetails: {
                                        ...prev[order.id]?.deliveryDetails,
                                        time: e.target.value,
                                        address: prev[order.id]?.deliveryDetails?.address || '',
                                        po: prev[order.id]?.deliveryDetails?.po || '',
                                        deliveredBy: prev[order.id]?.deliveryDetails?.deliveredBy || ''
                                      }
                                    }
                                  }));
                                }}
                                placeholder="請輸入時間"
                                style={{ 
                                  width: '100%', 
                                  padding: '8px', 
                                  border: '1px solid #ced4da', 
                                  borderRadius: '4px',
                                  fontSize: '13px'
                                }}
                              />
                            </div>
                            
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ 
                                display: 'block', 
                                fontWeight: '600', 
                                marginBottom: '5px',
                                fontSize: '13px',
                                color: '#495057'
                              }}>
                                Address:
                              </label>
                              <input
                                type="text"
                                value={orderStatuses[order.id]?.deliveryDetails?.address || ''}
                                onChange={(e) => {
                                  setOrderStatuses(prev => ({
                                    ...prev,
                                    [order.id]: {
                                      ...prev[order.id],
                                      deliveryDetails: {
                                        ...prev[order.id]?.deliveryDetails,
                                        address: e.target.value,
                                        time: prev[order.id]?.deliveryDetails?.time || '',
                                        po: prev[order.id]?.deliveryDetails?.po || '',
                                        deliveredBy: prev[order.id]?.deliveryDetails?.deliveredBy || ''
                                      }
                                    }
                                  }));
                                }}
                                placeholder="請輸入送貨地址"
                                style={{ 
                                  width: '100%', 
                                  padding: '8px', 
                                  border: '1px solid #ced4da', 
                                  borderRadius: '4px',
                                  fontSize: '13px'
                                }}
                              />
                            </div>
                            
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ 
                                display: 'block', 
                                fontWeight: '600', 
                                marginBottom: '5px',
                                fontSize: '13px',
                                color: '#495057'
                              }}>
                                P.O:
                              </label>
                              <input
                                type="text"
                                value={orderStatuses[order.id]?.deliveryDetails?.po || ''}
                                onChange={(e) => {
                                  setOrderStatuses(prev => ({
                                    ...prev,
                                    [order.id]: {
                                      ...prev[order.id],
                                      deliveryDetails: {
                                        ...prev[order.id]?.deliveryDetails,
                                        po: e.target.value,
                                        time: prev[order.id]?.deliveryDetails?.time || '',
                                        address: prev[order.id]?.deliveryDetails?.address || '',
                                        deliveredBy: prev[order.id]?.deliveryDetails?.deliveredBy || ''
                                      }
                                    }
                                  }));
                                }}
                                placeholder="請輸入 P.O 編號"
                                style={{ 
                                  width: '100%', 
                                  padding: '8px', 
                                  border: '1px solid #ced4da', 
                                  borderRadius: '4px',
                                  fontSize: '13px'
                                }}
                              />
                            </div>
                            
                            <div style={{ marginBottom: '10px' }}>
                              <label style={{ 
                                display: 'block', 
                                fontWeight: '600', 
                                marginBottom: '5px',
                                fontSize: '13px',
                                color: '#495057'
                              }}>
                                Delivered By:
                              </label>
                              <input
                                type="text"
                                value={orderStatuses[order.id]?.deliveryDetails?.deliveredBy || ''}
                                onChange={(e) => {
                                  setOrderStatuses(prev => ({
                                    ...prev,
                                    [order.id]: {
                                      ...prev[order.id],
                                      deliveryDetails: {
                                        ...prev[order.id]?.deliveryDetails,
                                        deliveredBy: e.target.value,
                                        time: prev[order.id]?.deliveryDetails?.time || '',
                                        address: prev[order.id]?.deliveryDetails?.address || '',
                                        po: prev[order.id]?.deliveryDetails?.po || ''
                                      }
                                    }
                                  }));
                                }}
                                placeholder="請輸入送貨人員姓名"
                                style={{ 
                                  width: '100%', 
                                  padding: '8px', 
                                  border: '1px solid #ced4da', 
                                  borderRadius: '4px',
                                  fontSize: '13px'
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 點收狀態 */}
                      <div className="status-column" style={{
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        padding: '15px',
                        backgroundColor: orderStatuses[order.id]?.checkStatus ? '#e8f5e8' : 'white',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          color: '#495057',
                          padding: '0 0 10px 0',
                          textAlign: 'center',
                          fontWeight: '600',
                          fontSize: '14px',
                          borderBottom: '1px solid #dee2e6',
                          marginBottom: '10px'
                        }}>
                          點收狀態
                        </div>

                        {/* 顯示當前點收狀態 */}
                        {(() => {
                          // 如果前端狀態存在且不為空，使用前端狀態
                          if (orderStatuses[order.id]?.checkStatus) {
                            return orderStatuses[order.id].checkStatus;
                          }
                          // 如果前端狀態明確設置為空字符串（重置狀態），不顯示任何狀態
                          if (orderStatuses[order.id] && orderStatuses[order.id].checkStatus === '') {
                            return null;
                          }
                          // 檢查是否有持久化的重置狀態
                          if (resetStates[order.id]?.checkStatus) {
                            return null;
                          }
                          // 否則使用後端狀態
                          return (order as any).latestStatuses?.CHECK?.statusValue;
                        })() && (
                          <div style={{
                            backgroundColor: '#e8f5e8',
                            border: '1px solid #c3e6cb',
                            borderRadius: '4px',
                            padding: '8px',
                            marginBottom: '10px',
                            fontSize: '12px',
                            color: '#155724',
                            textAlign: 'center'
                          }}>
                            <strong>目前狀態:</strong><br/>
                            {(() => {
                              if (orderStatuses[order.id]?.checkStatus) {
                                return orderStatuses[order.id].checkStatus;
                              }
                              return (order as any).latestStatuses?.CHECK?.statusValue;
                            })()}
                          </div>
                        )}
                        <select 
                          className="status-select"
                          style={getSelectStyle()}
                          value={orderStatuses[order.id]?.checkStatus || ''}
                          disabled={!isWarehouseUser}
                          onChange={(e) => {
                            if (!isWarehouseUser) return;
                            
                            // 標記用戶有進行過操作
                            setUserInteractions(prev => ({
                              ...prev,
                              [order.id]: true
                            }));
                            
                            // 如果用戶選擇了實際狀態，清除重置標記
                            if (e.target.value && e.target.value !== '' && resetStates[order.id]?.checkStatus) {
                              const newResetStates = { ...resetStates };
                              delete newResetStates[order.id].checkStatus;
                              if (Object.keys(newResetStates[order.id]).length === 0) {
                                delete newResetStates[order.id];
                              }
                              setResetStates(newResetStates);
                              saveResetStates(newResetStates);
                            }
                            
                            setOrderStatuses(prev => ({
                              ...prev,
                              [order.id]: {
                                ...prev[order.id],
                                checkStatus: e.target.value
                              }
                            }));
                          }}
                        >
                          <option value="" style={{ color: '#6c757d', fontStyle: 'italic' }}>-- 請選擇點收狀態 --</option>
                          <option value="Check and sign(C.B/PM)">Check and sign(C.B/PM)</option>
                          <option value="(C.B)">(C.B)</option>
                          <option value="(W.H)">(W.H)</option>
                        </select>

                      </div>
                    </div>

                    {/* 保存按鈕 - 只有倉管且用戶有進行過操作時才顯示 */}
                    {isWarehouseUser && userInteractions[order.id] && (
                      <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <button
                        onClick={async () => {
                          const orderId = order.id;
                          const statusData = orderStatuses[orderId];
                          
                          if (!statusData) {
                            alert('沒有狀態變更需要保存');
                            return;
                          }

                          setSavingStatus(prev => ({ ...prev, [orderId]: true }));
                          
                          try {
                            const promises = [];

                            // 檢查是否有狀態需要重置（選擇了空白選項）
                            const hasResetActions = 
                              statusData.orderStatus === '' ||
                              statusData.pickupStatus === '' ||
                              statusData.deliveryStatus === '' ||
                              statusData.checkStatus === '';
                            
                            console.log('保存狀態數據:', statusData);
                            console.log('是否有重置動作:', hasResetActions);
                            console.log('當前前端狀態:', orderStatuses[orderId]);

                            // 保存叫貨狀態
                            if (statusData.orderStatus !== undefined) {
                              if (statusData.orderStatus === '') {
                                // 重置叫貨狀態 - 不發送到後端，只在前端標記為重置
                                console.log('重置叫貨狀態');
                              } else if (statusData.orderSecondaryStatus) {
                                promises.push(
                                  statusService.updateOrderStatus(orderId, {
                                    primaryStatus: statusData.orderStatus,
                                    secondaryStatus: statusData.orderSecondaryStatus
                                  })
                                );
                              }
                            }

                            // 保存取貨狀態
                            if (statusData.pickupStatus !== undefined) {
                              if (statusData.pickupStatus === '') {
                                // 重置取貨狀態 - 不發送到後端，只在前端標記為重置
                                console.log('重置取貨狀態');
                              } else if (statusData.pickupSecondaryStatus) {
                                promises.push(
                                  statusService.updatePickupStatus(orderId, {
                                    primaryStatus: statusData.pickupStatus as 'Picked' | 'Failed',
                                    secondaryStatus: statusData.pickupSecondaryStatus
                                  })
                                );
                              }
                            }

                            // 保存到案狀態
                            if (statusData.deliveryStatus !== undefined) {
                              if (statusData.deliveryStatus === '') {
                                // 重置到案狀態 - 不發送到後端，只在前端標記為重置
                                console.log('重置到案狀態');
                              } else {
                                promises.push(
                                  statusService.updateDeliveryStatus(orderId, {
                                    status: statusData.deliveryStatus,
                                    time: statusData.deliveryDetails?.time,
                                    address: statusData.deliveryDetails?.address,
                                    po: statusData.deliveryDetails?.po,
                                    deliveredBy: statusData.deliveryDetails?.deliveredBy
                                  })
                                );
                              }
                            }

                            // 保存點收狀態
                            if (statusData.checkStatus !== undefined) {
                              if (statusData.checkStatus === '') {
                                // 重置點收狀態 - 不發送到後端，只在前端標記為重置
                                console.log('重置點收狀態');
                              } else {
                                promises.push(
                                  statusService.updateCheckStatus(orderId, {
                                    status: statusData.checkStatus
                                  })
                                );
                              }
                            }

                            await Promise.all(promises);
                            
                            // 處理重置狀態 - 保存到 localStorage
                            if (hasResetActions) {
                              const newResetStates = { ...resetStates };
                              
                              if (statusData.orderStatus === '') {
                                if (!newResetStates[orderId]) newResetStates[orderId] = {};
                                newResetStates[orderId].orderStatus = true;
                              }
                              if (statusData.pickupStatus === '') {
                                if (!newResetStates[orderId]) newResetStates[orderId] = {};
                                newResetStates[orderId].pickupStatus = true;
                              }
                              if (statusData.deliveryStatus === '') {
                                if (!newResetStates[orderId]) newResetStates[orderId] = {};
                                newResetStates[orderId].deliveryStatus = true;
                              }
                              if (statusData.checkStatus === '') {
                                if (!newResetStates[orderId]) newResetStates[orderId] = {};
                                newResetStates[orderId].checkStatus = true;
                              }
                              
                              setResetStates(newResetStates);
                              saveResetStates(newResetStates);
                            }
                            
                            // 處理非重置狀態 - 清除對應的重置標記
                            const newResetStates = { ...resetStates };
                            let hasChanges = false;
                            
                            if (statusData.orderStatus && statusData.orderStatus !== '' && newResetStates[orderId]?.orderStatus) {
                              delete newResetStates[orderId].orderStatus;
                              hasChanges = true;
                            }
                            if (statusData.pickupStatus && statusData.pickupStatus !== '' && newResetStates[orderId]?.pickupStatus) {
                              delete newResetStates[orderId].pickupStatus;
                              hasChanges = true;
                            }
                            if (statusData.deliveryStatus && statusData.deliveryStatus !== '' && newResetStates[orderId]?.deliveryStatus) {
                              delete newResetStates[orderId].deliveryStatus;
                              hasChanges = true;
                            }
                            if (statusData.checkStatus && statusData.checkStatus !== '' && newResetStates[orderId]?.checkStatus) {
                              delete newResetStates[orderId].checkStatus;
                              hasChanges = true;
                            }
                            
                            if (hasChanges) {
                              // 清理空的訂單重置狀態
                              if (newResetStates[orderId] && Object.keys(newResetStates[orderId]).length === 0) {
                                delete newResetStates[orderId];
                              }
                              setResetStates(newResetStates);
                              saveResetStates(newResetStates);
                            }
                            
                            // 重新載入訂單數據以獲取最新狀態
                            await loadOrders();
                            
                            alert('狀態已成功保存！');
                          } catch (error: any) {
                            console.error('保存狀態失敗:', error);
                            alert(`保存失敗: ${error.message || '未知錯誤'}`);
                          } finally {
                            setSavingStatus(prev => ({ ...prev, [orderId]: false }));
                          }
                        }}
                        disabled={savingStatus[order.id]}
                        style={{
                          backgroundColor: savingStatus[order.id] ? '#6c757d' : '#28a745',
                          color: 'white',
                          padding: '10px 20px',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: savingStatus[order.id] ? 'not-allowed' : 'pointer',
                          transition: 'background-color 0.2s ease',
                          opacity: savingStatus[order.id] ? 0.7 : 1
                        }}
                        onMouseOver={(e) => {
                          if (!savingStatus[order.id]) {
                            (e.target as HTMLButtonElement).style.backgroundColor = '#218838';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!savingStatus[order.id]) {
                            (e.target as HTMLButtonElement).style.backgroundColor = '#28a745';
                          }
                        }}
                      >
                        {savingStatus[order.id] ? '儲存中...' : '儲存變更'}
                        </button>

                      </div>
                    )}
                    </div>
                  )}

                  {/* 操作歷史記錄 */}
                  {canViewStatus && (
                    <OperationHistory order={order} />
                  )}
                  {/* 狀態管理欄位結束 */}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 輔材選擇模態框 - PM 用戶和管理員 */}
      {(user.role === 'PM' || user.role === 'ADMIN') && (
        <MaterialSelectionModal
          isOpen={isMaterialModalOpen}
          onClose={() => setIsMaterialModalOpen(false)}
          onOrderCreate={handleCreateAuxiliaryOrder}
          materialType="AUXILIARY"
          title="選擇輔材"
        />
      )}

      {/* 完成材選擇模態框 - AM 用戶和管理員 */}
      {(user.role === 'AM' || user.role === 'ADMIN') && (
        <FinishedMaterialModal
          isOpen={isFinishedMaterialModalOpen}
          onClose={() => setIsFinishedMaterialModalOpen(false)}
          onOrderCreate={handleCreateFinishedOrder}
        />
      )}

      {/* 圖片查看模態框 */}
      {selectedImage && (
        <div 
          className="image-modal-overlay"
          onClick={() => setSelectedImage(null)}
        >
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h3>{selectedImage.name}</h3>
              <button 
                className="image-modal-close"
                onClick={() => setSelectedImage(null)}
              >
                ×
              </button>
            </div>
            <div className="image-modal-body">
              <img 
                src={selectedImage.url} 
                alt={selectedImage.name}
                className="modal-image"
              />
            </div>
          </div>
        </div>
      )}

      {/* 刪除確認模態框 */}
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-header">
              <h3>⚠️ 確認刪除訂單</h3>
            </div>
            <div className="delete-confirm-body">
              <p>您確定要永久刪除以下訂單嗎？</p>
              <div className="delete-order-info">
                <strong>{showDeleteConfirm.orderName}</strong>
                <span>訂單編號: #{showDeleteConfirm.orderId}</span>
              </div>
              <div className="delete-warning">
                <p>⚠️ 此操作將會：</p>
                <ul>
                  <li>永久刪除訂單及所有項目</li>
                  <li>刪除相關的項目記錄</li>
                  <li>刪除所有狀態更新記錄</li>
                  <li>此操作無法復原</li>
                </ul>
              </div>
            </div>
            <div className="delete-confirm-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deletingOrderId !== null}
              >
                取消
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteOrder(showDeleteConfirm.orderId)}
                disabled={deletingOrderId !== null}
              >
                {deletingOrderId === showDeleteConfirm.orderId ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuxiliaryOrderPage;