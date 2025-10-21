import { Request, Response, NextFunction } from 'express';
import { 
  authenticateToken, 
  requireRole, 
  requireAdmin, 
  requirePM, 
  requireAM, 
  requireWarehouse,
  requireMaterialManager,
  requireStatusManager,
  requireOwnership,
  requireMaterialTypeAccess,
  optionalAuth,
  rateLimit
} from '../middleware/auth';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest, UserRole } from '../types';

// Mock AuthService
jest.mock('../services/authService');
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('Authentication Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      params: {},
      query: {},
      body: {},
      ip: '127.0.0.1'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate user with valid token', () => {
      const mockPayload = {
        userId: '123',
        username: 'testuser',
        role: 'PM' as UserRole
      };

      mockReq.headers = { authorization: 'Bearer valid.token.here' };
      mockAuthService.extractTokenFromHeader.mockReturnValue('valid.token.here');
      mockAuthService.isValidTokenFormat.mockReturnValue(true);
      mockAuthService.verifyAccessToken.mockReturnValue(mockPayload);

      authenticateToken(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', () => {
      mockAuthService.extractTokenFromHeader.mockReturnValue(null);

      authenticateToken(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Access token is required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', () => {
      mockReq.headers = { authorization: 'Bearer invalid-format' };
      mockAuthService.extractTokenFromHeader.mockReturnValue('invalid-format');
      mockAuthService.isValidTokenFormat.mockReturnValue(false);

      authenticateToken(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token format'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token expired error', () => {
      mockReq.headers = { authorization: 'Bearer expired.token.here' };
      mockAuthService.extractTokenFromHeader.mockReturnValue('expired.token.here');
      mockAuthService.isValidTokenFormat.mockReturnValue(true);
      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      authenticateToken(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Access token has expired'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle invalid token error', () => {
      mockReq.headers = { authorization: 'Bearer invalid.token.here' };
      mockAuthService.extractTokenFromHeader.mockReturnValue('invalid.token.here');
      mockAuthService.isValidTokenFormat.mockReturnValue(true);
      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticateToken(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid access token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle generic token verification error', () => {
      mockReq.headers = { authorization: 'Bearer error.token.here' };
      mockAuthService.extractTokenFromHeader.mockReturnValue('error.token.here');
      mockAuthService.isValidTokenFormat.mockReturnValue(true);
      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      authenticateToken(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Token verification failed'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access for user with correct role', () => {
      mockReq.user = {
        userId: '123',
        username: 'testuser',
        role: 'PM' as UserRole
      };

      const middleware = requireRole('PM', 'AM');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny access for user with incorrect role', () => {
      mockReq.user = {
        userId: '123',
        username: 'testuser',
        role: 'WAREHOUSE' as UserRole
      };

      const middleware = requireRole('PM', 'AM');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Access denied. Required roles: PM, AM'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access for unauthenticated user', () => {
      delete mockReq.user;

      const middleware = requireRole('PM');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Role-specific middleware', () => {
    it('requireAdmin should allow only ADMIN role', () => {
      mockReq.user = {
        userId: '123',
        username: 'admin',
        role: 'ADMIN' as UserRole
      };

      requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('requirePM should allow only PM role', () => {
      mockReq.user = {
        userId: '123',
        username: 'pm',
        role: 'PM' as UserRole
      };

      requirePM(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('requireAM should allow only AM role', () => {
      mockReq.user = {
        userId: '123',
        username: 'am',
        role: 'AM' as UserRole
      };

      requireAM(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('requireWarehouse should allow only WAREHOUSE role', () => {
      mockReq.user = {
        userId: '123',
        username: 'warehouse',
        role: 'WAREHOUSE' as UserRole
      };

      requireWarehouse(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('requireMaterialManager should allow PM and AM roles', () => {
      // Test PM
      mockReq.user = {
        userId: '123',
        username: 'pm',
        role: 'PM' as UserRole
      };

      requireMaterialManager(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();

      // Reset mocks
      jest.clearAllMocks();

      // Test AM
      mockReq.user = {
        userId: '123',
        username: 'am',
        role: 'AM' as UserRole
      };

      requireMaterialManager(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('requireStatusManager should allow WAREHOUSE and ADMIN roles', () => {
      // Test WAREHOUSE
      mockReq.user = {
        userId: '123',
        username: 'warehouse',
        role: 'WAREHOUSE' as UserRole
      };

      requireStatusManager(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();

      // Reset mocks
      jest.clearAllMocks();

      // Test ADMIN
      mockReq.user = {
        userId: '123',
        username: 'admin',
        role: 'ADMIN' as UserRole
      };

      requireStatusManager(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnership', () => {
    it('should allow access to own resource', () => {
      mockReq.user = {
        userId: '123',
        username: 'testuser',
        role: 'PM' as UserRole
      };
      mockReq.params = { userId: '123' };

      const middleware = requireOwnership();
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow admin access to any resource', () => {
      mockReq.user = {
        userId: '123',
        username: 'admin',
        role: 'ADMIN' as UserRole
      };
      mockReq.params = { userId: '456' };

      const middleware = requireOwnership();
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny access to other user resource', () => {
      mockReq.user = {
        userId: '123',
        username: 'testuser',
        role: 'PM' as UserRole
      };
      mockReq.params = { userId: '456' };

      const middleware = requireOwnership();
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Access denied. You can only access your own resources'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should work with custom field name', () => {
      mockReq.user = {
        userId: '123',
        username: 'testuser',
        role: 'PM' as UserRole
      };
      mockReq.body = { ownerId: '123' };

      const middleware = requireOwnership('ownerId');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('requireMaterialTypeAccess', () => {
    it('should allow admin access to all material types', () => {
      mockReq.user = {
        userId: '123',
        username: 'admin',
        role: 'ADMIN' as UserRole
      };
      mockReq.query = { type: 'AUXILIARY' };

      requireMaterialTypeAccess(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow PM access to auxiliary materials only', () => {
      mockReq.user = {
        userId: '123',
        username: 'pm',
        role: 'PM' as UserRole
      };
      mockReq.query = { type: 'AUXILIARY' };

      requireMaterialTypeAccess(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny PM access to finished materials', () => {
      mockReq.user = {
        userId: '123',
        username: 'pm',
        role: 'PM' as UserRole
      };
      mockReq.query = { type: 'FINISHED' };

      requireMaterialTypeAccess(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'PM users can only access auxiliary materials'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow AM access to finished materials only', () => {
      mockReq.user = {
        userId: '123',
        username: 'am',
        role: 'AM' as UserRole
      };
      mockReq.query = { type: 'FINISHED' };

      requireMaterialTypeAccess(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny AM access to auxiliary materials', () => {
      mockReq.user = {
        userId: '123',
        username: 'am',
        role: 'AM' as UserRole
      };
      mockReq.query = { type: 'AUXILIARY' };

      requireMaterialTypeAccess(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'AM users can only access finished materials'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow warehouse access to all materials', () => {
      mockReq.user = {
        userId: '123',
        username: 'warehouse',
        role: 'WAREHOUSE' as UserRole
      };
      mockReq.query = { type: 'AUXILIARY' };

      requireMaterialTypeAccess(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should work with material type in request body', () => {
      mockReq.user = {
        userId: '123',
        username: 'pm',
        role: 'PM' as UserRole
      };
      mockReq.body = { type: 'AUXILIARY' };

      requireMaterialTypeAccess(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should continue without authentication when no token provided', () => {
      mockAuthService.extractTokenFromHeader.mockReturnValue(null);

      optionalAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should authenticate when valid token provided', () => {
      const mockPayload = {
        userId: '123',
        username: 'testuser',
        role: 'PM' as UserRole
      };

      mockReq.headers = { authorization: 'Bearer valid.token.here' };
      mockAuthService.extractTokenFromHeader.mockReturnValue('valid.token.here');
      mockAuthService.isValidTokenFormat.mockReturnValue(true);
      mockAuthService.verifyAccessToken.mockReturnValue(mockPayload);

      optionalAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual(mockPayload);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should continue without authentication when invalid token provided', () => {
      mockReq.headers = { authorization: 'Bearer invalid.token.here' };
      mockAuthService.extractTokenFromHeader.mockReturnValue('invalid.token.here');
      mockAuthService.isValidTokenFormat.mockReturnValue(true);
      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      optionalAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('rateLimit', () => {
    it('should create rate limiting middleware', () => {
      const middleware = rateLimit(5, 60000);
      expect(typeof middleware).toBe('function');
    });

    it('should allow first request', () => {
      const middleware = rateLimit(5, 60000);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});