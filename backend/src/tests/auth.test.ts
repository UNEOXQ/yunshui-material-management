import { AuthService } from '../services/authService';
import { UserModel } from '../models/User';
import { User, UserRole } from '../types';
import jwt from 'jsonwebtoken';

// Mock the UserModel
jest.mock('../models/User');
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;

describe('AuthService', () => {
  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: '$2b$12$hashedpassword',
    role: 'PM' as UserRole,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set test environment variables
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = AuthService.generateAccessToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify token structure
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('should include correct payload in access token', () => {
      const token = AuthService.generateAccessToken(mockUser);
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.role).toBe(mockUser.role);
      expect(decoded.iss).toBe('yun-shui-backend');
      expect(decoded.aud).toBe('yun-shui-frontend');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const token = AuthService.generateRefreshToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify token structure
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = AuthService.generateAccessToken(mockUser);
      const payload = AuthService.verifyAccessToken(token);
      
      expect(payload.userId).toBe(mockUser.id);
      expect(payload.username).toBe(mockUser.username);
      expect(payload.role).toBe(mockUser.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        AuthService.verifyAccessToken('invalid.token.here');
      }).toThrow('Invalid token');
    });

    it('should throw error for expired token', () => {
      // Create an expired token by setting exp claim to past time
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = jwt.sign(
        { 
          userId: mockUser.id, 
          username: mockUser.username, 
          role: mockUser.role,
          exp: pastTime,
          iss: 'yun-shui-backend',
          aud: 'yun-shui-frontend'
        },
        'test-secret'
      );
      
      expect(() => {
        AuthService.verifyAccessToken(expiredToken);
      }).toThrow(); // Just check that it throws, the specific message may vary
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = AuthService.generateRefreshToken(mockUser);
      const payload = AuthService.verifyRefreshToken(token);
      
      expect(payload.userId).toBe(mockUser.id);
      expect(payload.username).toBe(mockUser.username);
      expect(payload.role).toBe(mockUser.role);
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        AuthService.verifyRefreshToken('invalid.token.here');
      }).toThrow('Invalid refresh token');
    });
  });

  describe('authenticate', () => {
    it('should authenticate user with valid username and password', async () => {
      mockUserModel.findByUsername.mockResolvedValue(mockUser);
      mockUserModel.verifyPassword.mockResolvedValue(true);

      const result = await AuthService.authenticate({
        username: 'testuser',
        password: 'password123'
      });

      expect(result.user.username).toBe(mockUser.username);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.role).toBe(mockUser.role);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('should authenticate user with valid email and password', async () => {
      mockUserModel.findByUsername.mockResolvedValue(null);
      mockUserModel.findByEmail.mockResolvedValue(mockUser);
      mockUserModel.verifyPassword.mockResolvedValue(true);

      const result = await AuthService.authenticate({
        username: 'test@example.com',
        password: 'password123'
      });

      expect(result.user.email).toBe(mockUser.email);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error for non-existent user', async () => {
      mockUserModel.findByUsername.mockResolvedValue(null);
      mockUserModel.findByEmail.mockResolvedValue(null);

      await expect(AuthService.authenticate({
        username: 'nonexistent',
        password: 'password123'
      })).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      mockUserModel.findByUsername.mockResolvedValue(mockUser);
      mockUserModel.verifyPassword.mockResolvedValue(false);

      await expect(AuthService.authenticate({
        username: 'testuser',
        password: 'wrongpassword'
      })).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      const refreshToken = AuthService.generateRefreshToken(mockUser);
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await AuthService.refreshAccessToken(refreshToken);

      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(AuthService.refreshAccessToken('invalid.token.here'))
        .rejects.toThrow('Invalid refresh token');
    });

    it('should throw error when user not found', async () => {
      const refreshToken = AuthService.generateRefreshToken(mockUser);
      mockUserModel.findById.mockResolvedValue(null);

      await expect(AuthService.refreshAccessToken(refreshToken))
        .rejects.toThrow('User not found');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const header = `Bearer ${token}`;
      
      const extracted = AuthService.extractTokenFromHeader(header);
      expect(extracted).toBe(token);
    });

    it('should return null for missing header', () => {
      const extracted = AuthService.extractTokenFromHeader(undefined);
      expect(extracted).toBeNull();
    });

    it('should return null for invalid header format', () => {
      const extracted = AuthService.extractTokenFromHeader('InvalidHeader token');
      expect(extracted).toBeNull();
    });

    it('should return null for header without token', () => {
      const extracted = AuthService.extractTokenFromHeader('Bearer');
      expect(extracted).toBeNull();
    });
  });

  describe('isValidTokenFormat', () => {
    it('should return true for valid JWT format', () => {
      const validToken = 'header.payload.signature';
      expect(AuthService.isValidTokenFormat(validToken)).toBe(true);
    });

    it('should return false for invalid JWT format', () => {
      expect(AuthService.isValidTokenFormat('invalid')).toBe(false);
      expect(AuthService.isValidTokenFormat('header.payload')).toBe(false);
      expect(AuthService.isValidTokenFormat('header.payload.signature.extra')).toBe(false);
    });
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'testpassword123';
      const hash = await AuthService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testpassword123';
      const hash = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hash = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });
});