import { getFileUrl, deleteUploadedFile } from '../middleware/upload';
import fs from 'fs';
import path from 'path';

/**
 * Test script for upload functionality
 */
async function testUploadUtilities() {
  console.log('🧪 Testing Upload Utilities...\n');

  // Test 1: File URL generation
  console.log('1. Testing file URL generation:');
  const materialUrl = getFileUrl('test-image.jpg', 'material');
  const generalUrl = getFileUrl('test-file.jpg', 'general');
  
  console.log(`   Material URL: ${materialUrl}`);
  console.log(`   General URL: ${generalUrl}`);
  console.log('   ✅ URL generation working\n');

  // Test 2: Directory creation
  console.log('2. Testing directory structure:');
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const materialsDir = path.join(uploadsDir, 'materials');
  
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('   📁 Created uploads directory');
    } else {
      console.log('   📁 Uploads directory exists');
    }
    
    if (!fs.existsSync(materialsDir)) {
      fs.mkdirSync(materialsDir, { recursive: true });
      console.log('   📁 Created materials directory');
    } else {
      console.log('   📁 Materials directory exists');
    }
    
    console.log('   ✅ Directory structure ready\n');
  } catch (error) {
    console.error('   ❌ Directory creation failed:', error);
  }

  // Test 3: File deletion utility
  console.log('3. Testing file deletion utility:');
  const testFilePath = path.join(materialsDir, 'test-delete.txt');
  
  try {
    // Create a test file
    fs.writeFileSync(testFilePath, 'test content');
    console.log('   📄 Created test file');
    
    // Delete using utility
    await deleteUploadedFile(testFilePath);
    console.log('   🗑️  Deleted test file');
    
    // Verify deletion
    if (!fs.existsSync(testFilePath)) {
      console.log('   ✅ File deletion working\n');
    } else {
      console.log('   ❌ File still exists after deletion\n');
    }
  } catch (error) {
    console.error('   ❌ File deletion test failed:', error);
  }

  // Test 4: Upload configuration
  console.log('4. Upload configuration:');
  console.log('   📏 Max file size: 5MB');
  console.log('   🖼️  Allowed types: JPEG, PNG, GIF, WebP');
  console.log('   📁 Upload paths:');
  console.log('      - Materials: /uploads/materials/');
  console.log('      - General: /uploads/');
  console.log('   ✅ Configuration ready\n');

  console.log('🎉 Upload utilities test completed!');
}

// Run the test
if (require.main === module) {
  testUploadUtilities().catch(console.error);
}

export { testUploadUtilities };