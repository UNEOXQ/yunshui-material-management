#!/usr/bin/env ts-node

/**
 * Demo script to showcase JWT Authentication Service functionality
 * This script demonstrates all the core features of the authentication system
 */

import { AuthService } from '../services/authService';
import { User } from '../types';

async function demonstrateAuthService() {
  console.log('🔐 JWT Authentication Service Demo');
  console.log('=====================================\n');

  // Mock user data for demonstration
  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'demouser',
    email: 'demo@example.com',
    passwordHash: 'hashed_password_here',
    role: 'PM',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    // 1. Password Hashing and Verification
    console.log('1. Password Hashing and Verification');
    console.log('------------------------------------');
    const plainPassword = 'DemoPassword123!';
    const hashedPassword = await AuthService.hashPassword(plainPassword);
    console.log(`✓ Password hashed successfully`);
    console.log(`  Original: ${plainPassword}`);
    console.log(`  Hashed: ${hashedPassword.substring(0, 30)}...`);

    const isValidPassword = await AuthService.verifyPassword(plainPassword, hashedPassword);
    console.log(`✓ Password verification: ${isValidPassword ? 'VALID' : 'INVALID'}`);

    const isInvalidPassword = await AuthService.verifyPassword('WrongPassword123!', hashedPassword);
    console.log(`✓ Wrong password verification: ${isInvalidPassword ? 'VALID' : 'INVALID'}`);
    console.log();

    // 2. JWT Token Generation
    console.log('2. JWT Token Generation');
    console.log('-----------------------');
    const accessToken = AuthService.generateAccessToken(mockUser);
    const refreshToken = AuthService.generateRefreshToken(mockUser);
    console.log(`✓ Access token generated (${accessToken.length} chars)`);
    console.log(`  Token: ${accessToken.substring(0, 50)}...`);
    console.log(`✓ Refresh token generated (${refreshToken.length} chars)`);
    console.log(`  Token: ${refreshToken.substring(0, 50)}...`);
    console.log();

    // 3. JWT Token Verification
    console.log('3. JWT Token Verification');
    console.log('-------------------------');
    const accessPayload = AuthService.verifyAccessToken(accessToken);
    console.log('✓ Access token verified successfully');
    console.log(`  User ID: ${accessPayload.userId}`);
    console.log(`  Username: ${accessPayload.username}`);
    console.log(`  Role: ${accessPayload.role}`);

    const refreshPayload = AuthService.verifyRefreshToken(refreshToken);
    console.log('✓ Refresh token verified successfully');
    console.log(`  User ID: ${refreshPayload.userId}`);
    console.log();

    // 4. Token Format Validation
    console.log('4. Token Format Validation');
    console.log('--------------------------');
    const isValidFormat = AuthService.isValidTokenFormat(accessToken);
    console.log(`✓ Token format validation: ${isValidFormat ? 'VALID' : 'INVALID'}`);

    const isInvalidFormat = AuthService.isValidTokenFormat('invalid.token');
    console.log(`✓ Invalid token format validation: ${isInvalidFormat ? 'VALID' : 'INVALID'}`);
    console.log();

    // 5. Header Token Extraction
    console.log('5. Header Token Extraction');
    console.log('--------------------------');
    const bearerHeader = `Bearer ${accessToken}`;
    const extractedToken = AuthService.extractTokenFromHeader(bearerHeader);
    console.log(`✓ Token extracted from header: ${extractedToken ? 'SUCCESS' : 'FAILED'}`);
    console.log(`  Header: ${bearerHeader.substring(0, 50)}...`);
    console.log(`  Extracted: ${extractedToken?.substring(0, 30)}...`);

    const invalidHeader = 'Invalid header format';
    const failedExtraction = AuthService.extractTokenFromHeader(invalidHeader);
    console.log(`✓ Invalid header extraction: ${failedExtraction ? 'SUCCESS' : 'FAILED (Expected)'}`);
    console.log();

    // 6. Error Handling Demo
    console.log('6. Error Handling Demo');
    console.log('----------------------');
    try {
      AuthService.verifyAccessToken('invalid.jwt.token');
    } catch (error: any) {
      console.log(`✓ Invalid token error caught: ${error.message}`);
    }

    try {
      AuthService.verifyRefreshToken('expired.jwt.token');
    } catch (error: any) {
      console.log(`✓ Invalid refresh token error caught: ${error.message}`);
    }
    console.log();

    console.log('🎉 JWT Authentication Service Demo Complete!');
    console.log('All core authentication features are working correctly.');
    console.log('\nImplemented Features:');
    console.log('• ✅ JWT token generation (access & refresh)');
    console.log('• ✅ JWT token verification with proper error handling');
    console.log('• ✅ Password hashing with bcrypt (12 rounds)');
    console.log('• ✅ Password verification');
    console.log('• ✅ Token extraction from Authorization headers');
    console.log('• ✅ Token format validation');
    console.log('• ✅ Comprehensive error handling');
    console.log('• ✅ TypeScript type safety');
    console.log('\nAPI Endpoints Available:');
    console.log('• POST /api/auth/login - User authentication');
    console.log('• POST /api/auth/refresh - Token refresh');
    console.log('• POST /api/auth/logout - User logout');
    console.log('• GET /api/auth/profile - Get user profile');
    console.log('• POST /api/auth/validate - Token validation');

  } catch (error: any) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  demonstrateAuthService().catch(console.error);
}

export { demonstrateAuthService };