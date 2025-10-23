// 用戶角色工具函數

interface UserRoleCache {
  [userId: string]: string;
}

// 緩存用戶角色信息
const userRoleCache: UserRoleCache = {};

// 靜態映射表（作為後備）
const staticRoleMap: { [key: string]: string } = {
  'user-1': 'ADMIN',
  'user-2': 'PM',
  'user-3': 'AM', 
  'user-4': 'WAREHOUSE',
  'id-2064': 'AM',
  'id-2065': 'PM'
};

/**
 * 從用戶 ID 獲取角色
 * @param userId 用戶 ID
 * @returns 用戶角色
 */
export const getRoleFromUserId = async (userId: string): Promise<string> => {
  // 首先檢查緩存
  if (userRoleCache[userId]) {
    return userRoleCache[userId];
  }

  // 檢查靜態映射表
  if (staticRoleMap[userId]) {
    userRoleCache[userId] = staticRoleMap[userId];
    return staticRoleMap[userId];
  }

  // 嘗試從後端 API 獲取用戶信息
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.warn('沒有認證 token，無法獲取用戶信息');
      return 'USER';
    }

    const response = await fetch(`${API_URL}/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        const role = result.data.role;
        userRoleCache[userId] = role;
        return role;
      }
    }
  } catch (error) {
    console.warn(`獲取用戶 ${userId} 角色失敗:`, error);
  }

  // 如果所有方法都失敗，返回默認值
  console.log(`⚠️ 未找到用戶 ID ${userId} 的角色映射，返回 USER`);
  return 'USER';
};

/**
 * 同步版本的角色獲取函數（用於現有代碼）
 * @param userId 用戶 ID
 * @returns 用戶角色
 */
export const getRoleFromUserIdSync = (userId: string): string => {
  // 檢查緩存
  if (userRoleCache[userId]) {
    return userRoleCache[userId];
  }

  // 檢查靜態映射表
  if (staticRoleMap[userId]) {
    userRoleCache[userId] = staticRoleMap[userId];
    return staticRoleMap[userId];
  }

  // 如果找不到，記錄日誌並返回默認值
  console.log(`⚠️ 未找到用戶 ID ${userId} 的角色映射，返回 USER`);
  return 'USER';
};

/**
 * 預載入用戶角色信息
 */
export const preloadUserRoles = async (): Promise<void> => {
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
        // 將所有用戶的角色信息加載到緩存中
        result.data.forEach((user: any) => {
          userRoleCache[user.id] = user.role;
        });
        console.log('✅ 用戶角色信息預載入完成');
      }
    }
  } catch (error) {
    console.warn('預載入用戶角色失敗:', error);
  }
};