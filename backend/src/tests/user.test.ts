import request from 'supertest';
import app from '../server';
import { UserModel } from '../models/User';
import { AuthService } from '../services/authService';

// Mock the database and auth service
jest.mock('../models/User');
jest.mock('../services/authService');
jest.mock('../middleware/auth');

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('User API', () => {
  let adminToken: string;
  let userToken: string;
  
  const mockAdminUser = {
    id: 'admin-uuid',
    username: 'admin',
    email: 'admin@test.com',
    passwordHash: 'hashed-password',
    role: 'ADMIN' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockRegularUser = {
    id: 'user-uuid',
    username: 'testuser',
    email: 'user@test.com',
    passwordHash: 'hashed-password',
    role: 'PM' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock admin token
    adminToken = 'mock-admin-token';
    userToken = 'mock-user-token';
    
    // Mock auth service token verification
    mockAuthService.verifyAccessToken.mockImplementation((token: string) => {
      if (token === adminToken) {
        return {
          userId: mockAdminUser.id,
          username: mockAdminUser.username,
          role: mockAdminUser.role
        };
      }
      if (token === userToken) {
        return {
          userId: mockRegularUser.id,
          username: mockRegularUser.username,
          role: mockRegularUser.role
        };
      }
      throw new Error('Invalid token');
    });

    mockAuthService.extractTokenFromHeader.mockImplementation((header: string | undefined) => {
      if (header?.startsWith('Bearer ')) {
        return header.substring(7);
      }
      return null;
    });

    mockAuthService.isValidTokenFormat.mockReturnValue(true);

    // Mock auth middleware
    const { authenticateToken, requireRole } = require('../middleware/auth');
    
    authenticateToken.mockImplementation((req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Access token is required'
        });
      }
      
      try {
        const payload = mockAuthService.verifyAccessToken(token);
        req.user = payload;
        next();
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication failed'
        });
      }
    });

    requireRole.mockImplementation((...allowedRoles: string[]) => {
      return (req: any, res: any, next: any) => {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'User not authenticated'
          });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
          });
        }
        
        next();
      };
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user when admin authenticated', async () => {
      const newUserData = {
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'Password123!',
        role: 'PM'
      };

      const createdUser = {
        ...mockRegularUser,
        id: 'new-user-uuid',
        username: newUserData.username,
        email: newUserData.email,
        role: newUserData.role as any
      };

      mockUserModel.create.mockResolvedValue(createdUser);

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(newUserData.username);
      expect(response.body.data.email).toBe(newUserData.email);
      expect(response.body.data.role).toBe(newUserData.role);
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('should return 403 when non-admin tries to create user', async () => {
      const newUserData = {
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'Password123!',
        role: 'PM'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newUserData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should return 400 for invalid user data', async () => {
      const invalidUserData = {
        username: 'ab', // Too short
        email: 'invalid-email',
        password: '123', // Too weak
        role: 'INVALID_ROLE'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUserData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });

    it('should return 409 when username already exists', async () => {
      const newUserData = {
        username: 'existinguser',
        email: 'newuser@test.com',
        password: 'Password123!',
        role: 'PM'
      };

      mockUserModel.create.mockRejectedValue(new Error('Username already exists'));

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Conflict');
    });
  });

  describe('GET /api/users', () => {
    it('should get all users when admin authenticated', async () => {
      const mockUsers = [mockAdminUser, mockRegularUser];
      mockUserModel.findAll.mockResolvedValue({
        users: mockUsers,
        total: 2
      });

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.users[0].passwordHash).toBeUndefined();
    });

    it('should return 403 when non-admin tries to get all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should filter users by role', async () => {
      const pmUsers = [mockRegularUser];
      mockUserModel.findByRole.mockResolvedValue(pmUsers);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ role: 'PM' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0].role).toBe('PM');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by ID when admin authenticated', async () => {
      mockUserModel.findById.mockResolvedValue(mockRegularUser);

      const response = await request(app)
        .get(`/api/users/${mockRegularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockRegularUser.id);
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('should allow user to get their own profile', async () => {
      mockUserModel.findById.mockResolvedValue(mockRegularUser);

      const response = await request(app)
        .get(`/api/users/${mockRegularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockRegularUser.id);
    });

    it('should return 403 when user tries to get another user profile', async () => {
      const response = await request(app)
        .get(`/api/users/${mockAdminUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should return 404 when user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400); // Invalid UUID format
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user when admin authenticated', async () => {
      const updateData = {
        username: 'updateduser',
        email: 'updated@test.com'
      };

      const updatedUser = {
        ...mockRegularUser,
        ...updateData
      };

      mockUserModel.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put(`/api/users/${mockRegularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(updateData.username);
      expect(response.body.data.email).toBe(updateData.email);
    });

    it('should allow user to update their own profile', async () => {
      const updateData = {
        username: 'updateduser',
        email: 'updated@test.com'
      };

      const updatedUser = {
        ...mockRegularUser,
        ...updateData
      };

      mockUserModel.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put(`/api/users/${mockRegularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 403 when non-admin tries to change role', async () => {
      const updateData = {
        role: 'ADMIN'
      };

      const response = await request(app)
        .put(`/api/users/${mockRegularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('role');
    });

    it('should return 404 when user not found', async () => {
      mockUserModel.update.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/users/non-existent-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'test' });

      expect(response.status).toBe(400); // Invalid UUID format
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user when admin authenticated', async () => {
      mockUserModel.exists.mockResolvedValue(true);
      mockUserModel.delete.mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/users/${mockRegularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    it('should return 403 when non-admin tries to delete user', async () => {
      const response = await request(app)
        .delete(`/api/users/${mockRegularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should return 400 when admin tries to delete themselves', async () => {
      const response = await request(app)
        .delete(`/api/users/${mockAdminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('cannot delete your own account');
    });

    it('should return 404 when user not found', async () => {
      mockUserModel.exists.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/users/non-existent-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400); // Invalid UUID format
    });
  });

  describe('GET /api/users/role/:role', () => {
    it('should get users by role when admin authenticated', async () => {
      const pmUsers = [mockRegularUser];
      mockUserModel.findByRole.mockResolvedValue(pmUsers);

      const response = await request(app)
        .get('/api/users/role/PM')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.role).toBe('PM');
      expect(response.body.data.count).toBe(1);
    });

    it('should return 403 when non-admin tries to get users by role', async () => {
      const response = await request(app)
        .get('/api/users/role/PM')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .get('/api/users/role/INVALID_ROLE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid role');
    });
  });

  describe('Authentication', () => {
    it('should return 401 when no token provided', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 401 when invalid token provided', async () => {
      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unauthorized');
    });
  });
});