// 測試記憶體資料庫的數據結構
const { memoryDb } = require('./backend/src/config/memory-database.ts');

async function testMemoryDb() {
  try {
    console.log('🔍 測試記憶體資料庫...');
    
    // 測試材料數據
    console.log('\n📦 材料數據:');
    const materials = await memoryDb.getAllMaterials();
    console.log(`找到 ${materials.length} 個材料`);
    if (materials.length > 0) {
      console.log('第一個材料:', JSON.stringify(materials[0], null, 2));
    }
    
    // 測試訂單數據
    console.log('\n📋 訂單數據:');
    const orders = await memoryDb.getAllOrders();
    console.log(`找到 ${orders.length} 個訂單`);
    if (orders.length > 0) {
      console.log('第一個訂單:', JSON.stringify(orders[0], null, 2));
      if (orders[0].items && orders[0].items.length > 0) {
        console.log('第一個訂單項目:', JSON.stringify(orders[0].items[0], null, 2));
      }
    }
    
    // 測試創建材料
    console.log('\n➕ 測試創建材料:');
    const newMaterial = await memoryDb.createMaterial({
      name: '測試材料',
      category: '測試分類',
      price: 100,
      quantity: 10,
      supplier: '測試供應商',
      type: 'AUXILIARY',
      imageUrl: ''
    });
    console.log('創建的材料:', JSON.stringify(newMaterial, null, 2));
    
  } catch (error) {
    console.error('❌ 錯誤:', error);
  }
}

testMemoryDb();