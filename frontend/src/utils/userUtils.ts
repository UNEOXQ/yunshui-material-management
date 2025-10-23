/**
 * 用戶工具函數
 */

/**
 * 將原始帳號名映射為顯示名稱
 */
export function mapUsernameToDisplayName(username: string): string {
  const displayNameMap: { [key: string]: string } = {
    'pm001': 'Jeffrey',
    'am001': 'Miya', 
    'warehouse001': 'Mark',
    'admin': '系統管理員'
  };
  
  return displayNameMap[username] || username;
}

/**
 * 處理登入後的用戶數據，映射顯示名稱
 */
export function processUserData(userData: any) {
  return {
    ...userData,
    username: mapUsernameToDisplayName(userData.username)
  };
}