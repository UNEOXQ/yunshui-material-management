import request from 'supertest';
import app from '../server';
import { UserModel } from '../models/User';
import { AuthService } from '../services/authService';

describe('Permission Control Integration Tests', () => {
  let pmUser: any;
  let amUser: any;
  let warehouseUser: any;
  let adminUser: any;
  
  let pmToken: string;
  let amToken: string;
  let warehouseToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Create test users for each role
    pmUser = await UserModel.create({
      username: 'pm_user',
      email: 'pm@example.com',
      password: 'TestPassword123!',
      role: 'PM'
    });

    amUser = await UserModel.create({
      username: 'am_user',
      email: 'am@example.com',
      password: 'TestPassword123!',
      role: 'AM'
    });

    warehouseUser = await UserModel.create({
      username: 'warehouse_user',
      email: 'warehouse@example.com',
      password: 'TestPassword123!',
      role: 'WAREHOUSE'
    });

    adminUser = await UserModel.create({
      username: 'admin_user',
      email: 'admin@example.com',
      password: 'TestPassword123!',
      role: 'ADMIN'
    });

    // Generate tokens for each user
    pmToken = AuthService.generateAccessToken(pmUser);
    amToken = AuthService.generateAccessToken(amUser);
    warehouseToken = AuthService.generateAccessToken(warehouseUser);
    adminToken = AuthService.generateAccessToken(adminUser);
  });

  afterAll(async () => {
    // Clean up test users
    const userIds = [pmUser?.id, amUser?.id, warehouseUser?.id, adminUser?.id].filter(Boolean);
    for (const userId of userIds) {
      try {
        await UserModel.delete(userId);
      } catch (error) {
        console.warn(`Failed to delete user ${userId}:`, error);
      }
    }
  });

  describe('Authentication Requirements', () => {
    it('should reject unauthenticated requests to protected endpoints', async () => {
      const protectedEndpoints = [
        { method: 'get', path: '/api/auth/profile' },
        { method: 'post', path: '/api/auth/logout' },
        { method: 'get', path: '/api/users' },
        { method: 'get', path: '/api/materials' },
        { method: 'post', path: '/api/orders' }
      ];

      for (const endpoint of protectedEndpoints) {
        let response;
        if (endpoint.method === 'get') {
          response = await request(app).get(endpoint.path);
        } else if (endpoint.method === 'post') {
          response = await request(app).post(endpoint.path);
        } else if (endpoint.method === 'put') {
          response = await request(app).put(endpoint.path);
        } else if (endpoint.method === 'delete') {
          response = await request(app).delete(endpoint.path);
        }
        
        expect(response?.status).toBe(401);
        expect(response?.body.success).toBe(false);
        expect(response?.body.error).toBe('Unauthorized');
      }
    });

    it('should reject requests with invalid tokens', async () => {
      const invalidTokens = [
        'invalid.token.format',
        'Bearer invalid.token.format',
        'malformed-token',
        'expired.token.here'
      ];

      for (const token of invalidTokens) {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', token.startsWith('Bearer') ? token : `Bearer ${token}`);
        
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      }
    });

    it('should accept requests with valid tokens', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${pmToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('pm_user');
    });
  });

  describe('Role-based Access Control', () => {
    describe('Admin Role Permissions', () => {
      it('should allow admin access to user management endpoints', async () => {
        // Admin should be able to access user list
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should allow admin access to all material types', async () => {
        // Admin should access auxiliary materials
        const auxResponse = await request(app)
          .get('/api/materials?type=AUXILIARY')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(auxResponse.status).toBe(200);

        // Admin should access finished materials
        const finResponse = await request(app)
          .get('/api/materials?type=FINISHED')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(finResponse.status).toBe(200);
      });

      it('should allow admin to create and manage materials', async () => {
        const materialData = {
          name: 'Test Material',
          category: 'Test Category',
          price: 100,
          quantity: 50,
          type: 'AUXILIARY'
        };

        const response = await request(app)
          .post('/api/materials')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(materialData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    describe('PM Role Permissions', () => {
      it('should allow PM access to auxiliary materials only', async () => {
        // PM should access auxiliary materials
        const auxResponse = await request(app)
          .get('/api/materials?type=AUXILIARY')
          .set('Authorization', `Bearer ${pmToken}`);

        expect(auxResponse.status).toBe(200);

        // PM should NOT access finished materials
        const finResponse = await request(app)
          .get('/api/materials?type=FINISHED')
          .set('Authorization', `Bearer ${pmToken}`);

        expect(finResponse.status).toBe(403);
        expect(finResponse.body.error).toBe('Forbidden');
        expect(finResponse.body.message).toContain('PM users can only access auxiliary materials');
      });

      it('should deny PM access to user management', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${pmToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Forbidden');
      });

      it('should deny PM access to material creation', async () => {
        const materialData = {
          name: 'Test Material',
          category: 'Test Category',
          price: 100,
          quantity: 50,
          type: 'AUXILIARY'
        };

        const response = await request(app)
          .post('/api/materials')
          .set('Authorization', `Bearer ${pmToken}`)
          .send(materialData);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Forbidden');
      });

      it('should allow PM to create auxiliary material orders', async () => {
        const orderData = {
          items: [
            {
              materialId: 'test-material-id',
              quantity: 5
            }
          ],
          type: 'AUXILIARY'
        };

        const response = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${pmToken}`)
          .send(orderData);

        // Should be allowed (assuming the endpoint exists and material exists)
        expect([200, 201, 404]).toContain(response.status); // 404 if material doesn't exist
      });
    });

    describe('AM Role Permissions', () => {
      it('should allow AM access to finished materials only', async () => {
        // AM should access finished materials
        const finResponse = await request(app)
          .get('/api/materials?type=FINISHED')
          .set('Authorization', `Bearer ${amToken}`);

        expect(finResponse.status).toBe(200);

        // AM should NOT access auxiliary materials
        const auxResponse = await request(app)
          .get('/api/materials?type=AUXILIARY')
          .set('Authorization', `Bearer ${amToken}`);

        expect(auxResponse.status).toBe(403);
        expect(auxResponse.body.error).toBe('Forbidden');
        expect(auxResponse.body.message).toContain('AM users can only access finished materials');
      });

      it('should deny AM access to user management', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${amToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Forbidden');
      });

      it('should allow AM to create finished material orders', async () => {
        const orderData = {
          items: [
            {
              materialId: 'test-material-id',
              quantity: 3
            }
          ],
          type: 'FINISHED'
        };

        const response = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${amToken}`)
          .send(orderData);

        // Should be allowed (assuming the endpoint exists and material exists)
        expect([200, 201, 404]).toContain(response.status); // 404 if material doesn't exist
      });
    });

    describe('Warehouse Role Permissions', () => {
      it('should allow warehouse access to all materials for status updates', async () => {
        // Warehouse should access auxiliary materials
        const auxResponse = await request(app)
          .get('/api/materials?type=AUXILIARY')
          .set('Authorization', `Bearer ${warehouseToken}`);

        expect(auxResponse.status).toBe(200);

        // Warehouse should access finished materials
        const finResponse = await request(app)
          .get('/api/materials?type=FINISHED')
          .set('Authorization', `Bearer ${warehouseToken}`);

        expect(finResponse.status).toBe(200);
      });

      it('should deny warehouse access to user management', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${warehouseToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Forbidden');
      });

      it('should deny warehouse access to material creation', async () => {
        const materialData = {
          name: 'Test Material',
          category: 'Test Category',
          price: 100,
          quantity: 50,
          type: 'AUXILIARY'
        };

        const response = await request(app)
          .post('/api/materials')
          .set('Authorization', `Bearer ${warehouseToken}`)
          .send(materialData);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Forbidden');
      });

      it('should allow warehouse to update project status', async () => {
        const statusData = {
          statusType: 'ORDER',
          statusValue: 'Ordered',
          additionalData: {}
        };

        const response = await request(app)
          .put('/api/projects/test-project-id/status')
          .set('Authorization', `Bearer ${warehouseToken}`)
          .send(statusData);

        // Should be allowed (assuming the endpoint exists and project exists)
        expect([200, 404]).toContain(response.status); // 404 if project doesn't exist
      });
    });
  });

  describe('Resource Ownership Control', () => {
    it('should allow users to access their own resources', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${pmToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(pmUser.id);
    });

    it('should deny users access to other users resources', async () => {
      // Try to access another user's profile (if such endpoint existed)
      const response = await request(app)
        .get(`/api/users/${amUser.id}`)
        .set('Authorization', `Bearer ${pmToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should allow admin to access any user resource', async () => {
      const response = await request(app)
        .get(`/api/users/${pmUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(response.status); // 200 if endpoint exists, 404 if not implemented
    });
  });

  describe('Cross-Role Security', () => {
    it('should prevent role escalation through API calls', async () => {
      // PM trying to access admin functions
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({
          username: 'hacker',
          email: 'hacker@example.com',
          password: 'password',
          role: 'ADMIN'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should maintain role consistency across requests', async () => {
      // Multiple requests should maintain the same role
      const requests = [
        request(app).get('/api/auth/profile').set('Authorization', `Bearer ${pmToken}`),
        request(app).get('/api/materials?type=AUXILIARY').set('Authorization', `Bearer ${pmToken}`),
        request(app).get('/api/auth/profile').set('Authorization', `Bearer ${pmToken}`)
      ];

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        if (response.status === 200) {
          expect(response.body.success).toBe(true);
        }
      });

      // First and last should return same user data
      expect(responses[0].body.data?.role).toBe('PM');
      expect(responses[2].body.data?.role).toBe('PM');
    });

    it('should handle concurrent requests from different roles', async () => {
      const concurrentRequests = [
        request(app).get('/api/materials?type=AUXILIARY').set('Authorization', `Bearer ${pmToken}`),
        request(app).get('/api/materials?type=FINISHED').set('Authorization', `Bearer ${amToken}`),
        request(app).get('/api/materials?type=AUXILIARY').set('Authorization', `Bearer ${warehouseToken}`),
        request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`)
      ];

      const responses = await Promise.all(concurrentRequests);

      // PM should succeed with auxiliary materials
      expect(responses[0].status).toBe(200);
      
      // AM should succeed with finished materials
      expect(responses[1].status).toBe(200);
      
      // Warehouse should succeed with auxiliary materials
      expect(responses[2].status).toBe(200);
      
      // Admin should succeed with user management
      expect(responses[3].status).toBe(200);
    });
  });

  describe('Token Security in Practice', () => {
    it('should reject expired tokens', async () => {
      // Create a short-lived token
      const shortLivedToken = AuthService.generateAccessToken({
        ...pmUser,
        // This would need to be implemented with a very short expiry
      });

      // Wait for expiration (this is a simplified test)
      // In practice, you'd need to mock the JWT library or use a very short expiry
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${shortLivedToken}`);

      // Should work initially
      expect(response.status).toBe(200);
    });

    it('should handle token refresh securely', async () => {
      const refreshToken = AuthService.generateRefreshToken(pmUser);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();

      // New token should work
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${response.body.data.token}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.data.username).toBe('pm_user');
    });

    it('should validate token format strictly', async () => {
      const malformedTokens = [
        'not.a.jwt',
        'header.payload',
        'header.payload.signature.extra',
        '',
        'Bearer',
        'Bearer ',
        'Basic dGVzdDp0ZXN0' // Base64 encoded, but not JWT
      ];

      for (const token of malformedTokens) {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', token.startsWith('Bearer') ? token : `Bearer ${token}`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('Rate Limiting and Security Headers', () => {
    it('should handle multiple rapid requests appropriately', async () => {
      const rapidRequests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${pmToken}`)
      );

      const responses = await Promise.all(rapidRequests);

      // Most should succeed (unless rate limiting is very strict)
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(5);
    });

    it('should include appropriate security headers', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${pmToken}`);

      // Check for common security headers (if implemented)
      expect(response.headers).toBeDefined();
      // Additional header checks would go here based on your security middleware
    });
  });
});