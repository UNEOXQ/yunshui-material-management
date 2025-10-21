import request from 'supertest';
import app from '../server';
import { pool } from '../config/database';
import { UserModel } from '../models/User';
import { MaterialModel } from '../models/Material';
import { OrderModel } from '../models/Order';
import { ProjectModel } from '../models/Project';
// import { StatusUpdateModel } from '../models/StatusUpdate';
import jwt from 'jsonwebtoken';

describe('Status Update API', () => {
  let warehouseUser: any;
  let pmUser: any;
  // let amUser: any;
  let warehouseToken: string;
  let pmToken: string;
  // let amToken: string;
  let testProject: any;
  let testOrder: any;
  let testMaterial: any;

  beforeAll(async () => {
    // Clean up database
    await pool.query('DELETE FROM status_updates');
    await pool.query('DELETE FROM projects');
    await pool.query('DELETE FROM order_items');
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM materials');
    await pool.query('DELETE FROM users');

    // Create test users
    warehouseUser = await UserModel.create({
      username: 'warehouse_user',
      email: 'warehouse@test.com',
      password: 'password123',
      role: 'WAREHOUSE'
    });

    pmUser = await UserModel.create({
      username: 'pm_user',
      email: 'pm@test.com',
      password: 'password123',
      role: 'PM'
    });

    // amUser = await UserModel.create({
    //   username: 'am_user',
    //   email: 'am@test.com',
    //   password: 'password123',
    //   role: 'AM'
    // });

    // Create JWT tokens
    warehouseToken = jwt.sign(
      { userId: warehouseUser.id, username: warehouseUser.username, role: warehouseUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    pmToken = jwt.sign(
      { userId: pmUser.id, username: pmUser.username, role: pmUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // amToken = jwt.sign(
    //   { userId: amUser.id, username: amUser.username, role: amUser.role },
    //   process.env.JWT_SECRET || 'test-secret',
    //   { expiresIn: '1h' }
    // );

    // Create test material
    testMaterial = await MaterialModel.create({
      name: '測試材料',
      category: '五金',
      price: 100.00,
      quantity: 50,
      type: 'AUXILIARY'
    });

    // Create test order
    testOrder = await OrderModel.create({
      userId: pmUser.id,
      totalAmount: 500.00,
      items: [{
        materialId: testMaterial.id,
        quantity: 5,
        unitPrice: 100.00
      }]
    });

    // Create test project
    testProject = await ProjectModel.create(testOrder.id, '測試專案');
  });

  afterAll(async () => {
    // Clean up
    await pool.query('DELETE FROM status_updates');
    await pool.query('DELETE FROM projects');
    await pool.query('DELETE FROM order_items');
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM materials');
    await pool.query('DELETE FROM users');
  });

  describe('PUT /api/projects/:projectId/status/order', () => {
    it('should update order status for warehouse user', async () => {
      const statusData = {
        primaryStatus: 'Ordered',
        secondaryStatus: 'Processing'
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.id}/status/order`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send(statusData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statusType).toBe('ORDER');
      expect(response.body.data.statusValue).toBe('Ordered - Processing');
    });

    it('should reject non-warehouse user', async () => {
      const statusData = {
        primaryStatus: 'Ordered',
        secondaryStatus: 'Processing'
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.id}/status/order`)
        .set('Authorization', `Bearer ${pmToken}`)
        .send(statusData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only warehouse staff');
    });

    it('should validate order status data', async () => {
      const statusData = {
        primaryStatus: 'Invalid',
        secondaryStatus: 'Processing'
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.id}/status/order`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send(statusData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('PUT /api/projects/:projectId/status/pickup', () => {
    it('should update pickup status for warehouse user', async () => {
      const statusData = {
        primaryStatus: 'Picked',
        secondaryStatus: '(B.T.W)'
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.id}/status/pickup`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send(statusData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statusType).toBe('PICKUP');
      expect(response.body.data.statusValue).toBe('Picked (B.T.W)');
    });

    it('should handle failed pickup status', async () => {
      const statusData = {
        primaryStatus: 'Failed',
        secondaryStatus: '(E.S)'
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.id}/status/pickup`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send(statusData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statusValue).toBe('Failed (E.S)');
    });
  });

  describe('PUT /api/projects/:projectId/status/delivery', () => {
    it('should update delivery status with required fields', async () => {
      const statusData = {
        status: 'Delivered',
        time: '2023-10-11 14:30',
        address: '台北市信義區信義路五段7號',
        po: 'PO-2023-001',
        deliveredBy: '張三'
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.id}/status/delivery`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send(statusData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statusType).toBe('DELIVERY');
      expect(response.body.data.statusValue).toBe('Delivered');
      expect(response.body.data.additionalData).toBeDefined();
      expect(response.body.data.additionalData.time).toBe('2023-10-11 14:30');
    });

    it('should allow empty delivery status', async () => {
      const statusData = {
        status: ''
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.id}/status/delivery`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send(statusData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statusValue).toBe('');
    });

    it('should require delivery details when status is Delivered', async () => {
      const statusData = {
        status: 'Delivered'
        // Missing required fields
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.id}/status/delivery`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send(statusData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('PUT /api/projects/:projectId/status/check', () => {
    it('should update check status and complete project', async () => {
      const statusData = {
        status: 'Check and sign(C.B/PM)'
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.id}/status/check`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send(statusData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statusType).toBe('CHECK');
      expect(response.body.data.statusValue).toBe('Check and sign(C.B/PM)');

      // Verify project is completed
      const updatedProject = await ProjectModel.findById(testProject.id);
      expect(updatedProject?.overallStatus).toBe('COMPLETED');
    });
  });

  describe('GET /api/projects/:projectId/status', () => {
    it('should get project status history', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject.id}/status`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project).toBeDefined();
      expect(response.body.data.statusHistory).toBeDefined();
      expect(response.body.data.latestStatuses).toBeDefined();
      expect(Array.isArray(response.body.data.statusHistory)).toBe(true);
    });

    it('should allow all authenticated users to view status', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject.id}/status`)
        .set('Authorization', `Bearer ${pmToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/status/statistics', () => {
    it('should get status statistics for warehouse user', async () => {
      const response = await request(app)
        .get('/api/status/statistics')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.byType).toBeDefined();
      expect(response.body.data.recentUpdates).toBeDefined();
    });

    it('should reject non-warehouse/admin user', async () => {
      const response = await request(app)
        .get('/api/status/statistics')
        .set('Authorization', `Bearer ${pmToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/status/updates', () => {
    it('should get all status updates with pagination', async () => {
      const response = await request(app)
        .get('/api/status/updates?page=1&limit=10')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updates).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
      expect(Array.isArray(response.body.data.updates)).toBe(true);
    });

    it('should filter by status type', async () => {
      const response = await request(app)
        .get('/api/status/updates?statusType=ORDER')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Status Validation', () => {
    it('should validate status transitions', async () => {
      // Test invalid pickup status
      const invalidStatusData = {
        primaryStatus: 'Picked',
        secondaryStatus: '(E.S)' // This should only be for Failed
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.id}/status/pickup`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send(invalidStatusData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});