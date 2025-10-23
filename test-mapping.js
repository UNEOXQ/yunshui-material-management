// 測試用戶名稱映射邏輯

function mapUsernameToDisplayName(username) {
  const displayNameMap = {
    'pm001': 'Jeffrey',
    'am001': 'Miya', 
    'warehouse001': 'Mark',
    'admin': '系統管理員'
  };
  
  return displayNameMap[username] || username;
}

function processUserData(userData) {
  return {
    ...userData,
    username: mapUsernameToDisplayName(userData.username)
  };
}

// 測試
const testUsers = [
  { id: 'user-2', username: 'pm001', role: 'PM' },
  { id: 'user-3', username: 'am001', role: 'AM' },
  { id: 'user-4', username: 'warehouse001', role: 'WAREHOUSE' },
  { id: 'user-1', username: 'admin', role: 'ADMIN' }
];

console.log('用戶名稱映射測試：');
testUsers.forEach(user => {
  const processed = processUserData(user);
  console.log(`${user.username} → ${processed.username}`);
});