import { Response } from 'express';
import { UserController } from '../controllers/userController';
import { UserModel } from '../models/User';
import { AuthenticatedRequest } from '../types';

// Mock the UserModel
jest.mock('../models/User');

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;

describe('UserController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  const mockAdminUser = {
    id: '12345678-1234-4234-a234-123456789012',
    username: 'admin',
    email: 'admin@test.com',
    passwordHash: 'hashed-password',
    role: 'ADMIN' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockRegularUser = {
    id: '87654321-4321-4321-b321-210987654321',
    username: 'testuser',
    email: 'user@test.com',
    passwordHash: 'hashed-password',
    role: 'PM' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });
    
    mockResponse = {
      status: responseStatus,
      json: responseJson
    };

    mockRequest = {
      body: {},
      params: {},
      query: {}
    };

    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user when admin authenticated', async () => {
      mockRequest.user = {
        userId: mockAdminUser.id,
        username: mockAdminUser.username,
        role: mockAdminUser.role
      };

      mockRequest.body = {
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'Password123!',
        role: 'PM'
      };

      const createdUser = {
        ...mockRegularUser,
        id: '11111111-1111-4111-a111-111111111111',
        username: 'newuser',
        email: 'newuser@test.com',
        role: 'PM' as const
      };

      mockUserModel.create.mockResolvedValue(createdUser);

      await UserController.createUser(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          username: 'newuser',
          email: 'newuser@test.com',
          role: 'PM'
        }),
        message: 'User created successfully'
      });
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            passwordHash: expect.anything()
          })
        })
      );
    });

    it('should return 403 when non-admin tries to create user', async () => {
      mockRequest.user = {
        userId: mockRegularUser.id,
        username: mockRegularUser.username,
        role: mockRegularUser.role
      };

      mockRequest.body = {
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'Password123!',
        role: 'PM'
      };

      await UserController.createUser(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Only administrators can create users'
      });
    });

    it('should return 400 for invalid user data', async () => {
      mockRequest.user = {
        userId: mockAdminUser.id,
        username: mockAdminUser.username,
        role: mockAdminUser.role
      };

      mockRequest.body = {
        username: 'ab', // Too short
        email: 'invalid-email',
        password: '123', // Too weak
        role: 'INVALID_ROLE'
      };

      await UserController.createUser(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Validation error',
        message: expect.any(String)
      });
    });

    it('should return 409 when username already exists', async () => {
      mockRequest.user = {
        userId: mockAdminUser.id,
        username: mockAdminUser.username,
        role: mockAdminUser.role
      };

      mockRequest.body = {
        username: 'existinguser',
        email: 'newuser@test.com',
        password: 'Password123!',
        role: 'PM'
      };

      mockUserModel.create.mockRejectedValue(new Error('Username already exists'));

      await UserController.createUser(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(409);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Conflict',
        message: 'Username already exists'
      });
    });
  });

  describe('getUsers', () => {
    it('should get all users when admin authenticated', async () => {
      mockRequest.user = {
        userId: mockAdminUser.id,
        username: mockAdminUser.username,
        role: mockAdminUser.role
      };

      mockRequest.query = { page: '1', limit: '10' };

      const mockUsers = [mockAdminUser, mockRegularUser];
      mockUserModel.findAll.mockResolvedValue({
        users: mockUsers,
        total: 2
      });

      await UserController.getUsers(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: {
          users: expect.arrayContaining([
            expect.not.objectContaining({
              passwordHash: expect.anything()
            })
          ]),
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1
          }
        },
        message: 'Users retrieved successfully'
      });
    });

    it('should return 403 when non-admin tries to get all users', async () => {
      mockRequest.user = {
        userId: mockRegularUser.id,
        username: mockRegularUser.username,
        role: mockRegularUser.role
      };

      await UserController.getUsers(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Only administrators can view all users'
      });
    });

    it('should filter users by role', async () => {
      mockRequest.user = {
        userId: mockAdminUser.id,
        username: mockAdminUser.username,
        role: mockAdminUser.role
      };

      mockRequest.query = { role: 'PM' };

      const pmUsers = [mockRegularUser];
      mockUserModel.findByRole.mockResolvedValue(pmUsers);

      await UserController.getUsers(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: {
          users: expect.arrayContaining([
            expect.objectContaining({ role: 'PM' })
          ]),
          pagination: expect.any(Object)
        },
        message: 'Users retrieved successfully'
      });
    });
  });

  describe('getUserById', () => {
    it('should get user by ID when admin authenticated', async () => {
      mockRequest.user = {
        userId: mockAdminUser.id,
        username: mockAdminUser.username,
        role: mockAdminUser.role
      };

      mockRequest.params = { id: mockRegularUser.id };

      mockUserModel.findById.mockResolvedValue(mockRegularUser);

      await UserController.getUserById(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: mockRegularUser.id
        }),
        message: 'User retrieved successfully'
      });
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            passwordHash: expect.anything()
          })
        })
      );
    });

    it('should allow user to get their own profile', async () => {
      mockRequest.user = {
        userId: mockRegularUser.id,
        username: mockRegularUser.username,
        role: mockRegularUser.role
      };

      mockRequest.params = { id: mockRegularUser.id };

      mockUserModel.findById.mockResolvedValue(mockRegularUser);

      await UserController.getUserById(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: mockRegularUser.id
        }),
        message: 'User retrieved successfully'
      });
    });

    it('should return 403 when user tries to get another user profile', async () => {
      mockRequest.user = {
        userId: mockRegularUser.id,
        username: mockRegularUser.username,
        role: mockRegularUser.role
      };

      mockRequest.params = { id: mockAdminUser.id };

      await UserController.getUserById(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'You can only access your own user data'
      });
    });

    it('should return 400 for invalid UUID format', async () => {
      mockRequest.user = {
        userId: mockAdminUser.id,
        username: mockAdminUser.username,
        role: mockAdminUser.role
      };

      mockRequest.params = { id: 'invalid-uuid' };

      await UserController.getUserById(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid ID',
        message: 'User ID must be a valid UUID'
      });
    });

    it('should return 404 when user not found', async () => {
      mockRequest.user = {
        userId: mockAdminUser.id,
        username: mockAdminUser.username,
        role: mockAdminUser.role
      };

      mockRequest.params = { id: '12345678-1234-4234-a234-123456789012' };

      mockUserModel.findById.mockResolvedValue(null);

      await UserController.getUserById(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not found',
        message: 'User not found'
      });
    });
  });

  describe('updateUser', () => {
    it('should update user when admin authenticated', async () => {
      mockRequest.user = {
        userId: mockAdminUser.id,
        username: mockAdminUser.username,
        role: mockAdminUser.role
      };

      mockRequest.params = { id: mockRegularUser.id };
      mockRequest.body = {
        username: 'updateduser',
        email: 'updated@test.com'
      };

      const updatedUser = {
        ...mockRegularUser,
        username: 'updateduser',
        email: 'updated@test.com'
      };

      mockUserModel.update.mockResolvedValue(updatedUser);

      await UserController.updateUser(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          username: 'updateduser',
          email: 'updated@test.com'
        }),
        message: 'User updated successfully'
      });
    });

    it('should allow user to update their own profile', async () => {
      mockRequest.user = {
        userId: mockRegularUser.id,
        username: mockRegularUser.username,
        role: mockRegularUser.role
      };

      mockRequest.params = { id: mockRegularUser.id };
      mockRequest.body = {
        username: 'updateduser',
        email: 'updated@test.com'
      };

      const updatedUser = {
        ...mockRegularUser,
        username: 'updateduser',
        email: 'updated@test.com'
      };

      mockUserModel.update.mockResolvedValue(updatedUser);

      await UserController.updateUser(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
    });

    it('should return 403 when non-admin tries to change role', async () => {
      mockRequest.user = {
        userId: mockRegularUser.id,
        username: mockRegularUser.username,
        role: mockRegularUser.role
      };

      mockRequest.params = { id: mockRegularUser.id };
      mockRequest.body = {
        role: 'ADMIN'
      };

      await UserController.updateUser(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Only administrators can change user roles'
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user when admin authenticated', async () => {
      mockRequest.user = {
        userId: mockAdminUser.id,
        username: mockAdminUser.username,
        role: mockAdminUser.role
      };

      mockRequest.params = { id: mockRegularUser.id };

      mockUserModel.exists.mockResolvedValue(true);
      mockUserModel.delete.mockResolvedValue(true);

      await UserController.deleteUser(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'User deleted successfully'
      });
    });

    it('should return 403 when non-admin tries to delete user', async () => {
      mockRequest.user = {
        userId: mockRegularUser.id,
        username: mockRegularUser.username,
        role: mockRegularUser.role
      };

      mockRequest.params = { id: mockRegularUser.id };

      await UserController.deleteUser(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Only administrators can delete users'
      });
    });

    it('should return 400 when admin tries to delete themselves', async () => {
      mockRequest.user = {
        userId: mockAdminUser.id,
        username: mockAdminUser.username,
        role: mockAdminUser.role
      };

      mockRequest.params = { id: mockAdminUser.id };

      await UserController.deleteUser(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Bad request',
        message: 'You cannot delete your own account'
      });
    });
  });
});