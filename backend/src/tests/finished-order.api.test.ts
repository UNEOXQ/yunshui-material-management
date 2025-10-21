import request from 'supertest';
import app from '../server';
import { pool } from '../config/database';
import { UserModel } from '../models/User';
import { MaterialModel } from '../models/Material';
import { StatusUpdateModel } from '../models/StatusUpdate';
import jwt from 'jsonwebtoken';

describe('Finished Material Order API', () => {
  let amUser: any;
  let pmUser: any;
  let finishedMaterial: any;
  let auxiliaryMaterial: any;
  let amToken: string;
  let pmToken: string;

  beforeAll(async () => {
    // Clean up database
    await pool.query('DELETE FROM status_updates');
    await pool.query('DELETE FROM projects');
    await pool.query('DELETE FROM order_items');
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM materials');
    await pool.query('DELETE FROM users');

    // Create test users
    amUser = await UserModel.create({
      username: 'am_user',
      email: 'am@test.com',
      password: 'password123',
      role: 'AM'
    });

    pmUser = await UserModel.create({
      username: 'pm_user',
      email: 'pm@test.com',
      password: 'password123',
      role: 'PM'
    });

    // Create JWT tokens
    amToken = jwt.sign(
      { userId: amUser.id, username: amUser.username, role: amUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    pmToken = jwt.sign(
      { userId: pmUser.id, username: pmUser.username, role: pmUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test materials
    finishedMaterial = await MaterialModel.create({
      name: '完成材測試',
      category: '地板',
      price: 150.00,
      quantity: 50,
      supplier: '供應商A',
      type: 'FINISHED'
    });

    auxiliaryMaterial = await MaterialModel.create({
      name: '輔材測試',
      category: '五金',
      price: 25.00,
      quantity: 100,
      type: 'AUXILIARY'
    });
  });

  afterAll(async () => {
    // Clean up
    await pool.query('DELETE FROM status_updates');
    await pool.query('DELETE FROM projects');
    await pool.query('DELETE FROM order_items');
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM materials');
    await pool.query('DELETE FROM users');
    // Don't call pool.end() in tests as it can cause hanging
  });

  describe('POST /api/orders/finished', () => {
    it('should create finished material order for AM user', async () => {
      const orderData = {
        items: [
          {
            materialId: finishedMaterial.id,
            quantity: 5
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders/finished')
        .set('Authorization', `Bearer ${amToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order).toBeDefined();
      expect(response.body.data.project).toBeDefined();
      expect(response.body.data.supplierInfo).toBeDefined();
      expect(response.body.data.order.totalAmount).toBe(750); // 150 * 5
      expect(response.body.data.supplierInfo[0].supplier).toBe('供應商A');
    });

    it('should reject PM user trying to create finished material order', async () => {
      const orderData = {
        items: [
          {
            materialId: finishedMaterial.id,
            quantity: 2
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders/finished')
        .set('Authorization', `Bearer ${pmToken}`)
        .send(orderData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only AM users can create finished material orders');
    });

    it('should reject auxiliary material in finished order', async () => {
      const orderData = {
        items: [
          {
            materialId: auxiliaryMaterial.id,
            quantity: 3
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders/finished')
        .set('Authorization', `Bearer ${amToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a finished material');
    });

    it('should reject insufficient stock', async () => {
      const orderData = {
        items: [
          {
            materialId: finishedMaterial.id,
            quantity: 100 // More than available (50 - 5 from previous test = 45)
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders/finished')
        .set('Authorization', `Bearer ${amToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient stock');
    });
  });

  describe('GET /api/orders/finished', () => {
    it('should get finished material orders for AM user', async () => {
      const response = await request(app)
        .get('/api/orders/finished')
        .set('Authorization', `Bearer ${amToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toBeDefined();
      expect(Array.isArray(response.body.data.orders)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should reject PM user trying to access finished material orders', async () => {
      const response = await request(app)
        .get('/api/orders/finished')
        .set('Authorization', `Bearer ${pmToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only AM users can access finished material orders');
    });
  });

  describe('PUT /api/orders/:id/confirm-finished', () => {
    let testOrder: any;

    beforeEach(async () => {
      // Create a test order
      const orderData = {
        items: [
          {
            materialId: finishedMaterial.id,
            quantity: 2
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders/finished')
        .set('Authorization', `Bearer ${amToken}`)
        .send(orderData);

      testOrder = response.body.data.order;
    });

    it('should confirm finished material order for AM user', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.id}/confirm-finished`)
        .set('Authorization', `Bearer ${amToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('CONFIRMED');
      expect(response.body.data.project).toBeDefined();
      expect(response.body.data.supplierInfo).toBeDefined();
    });

    it('should reject PM user trying to confirm finished material order', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.id}/confirm-finished`)
        .set('Authorization', `Bearer ${pmToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only AM users can confirm finished material orders');
    });
  });

  describe('Project and Status Initialization', () => {
    it('should create project and initialize status columns when creating finished order', async () => {
      const orderData = {
        items: [
          {
            materialId: finishedMaterial.id,
            quantity: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders/finished')
        .set('Authorization', `Bearer ${amToken}`)
        .send(orderData);

      const order = response.body.data.order;
      const project = response.body.data.project;

      // Verify project was created
      expect(project).toBeDefined();
      expect(project.orderId).toBe(order.id);
      expect(project.projectName).toContain('完成材專案');

      // Verify status columns were initialized
      const statusUpdates = await StatusUpdateModel.getLatestStatusesByProject(project.id);
      expect(Object.keys(statusUpdates)).toHaveLength(4);

      expect(statusUpdates.ORDER).toBeDefined();
      expect(statusUpdates.PICKUP).toBeDefined();
      expect(statusUpdates.DELIVERY).toBeDefined();
      expect(statusUpdates.CHECK).toBeDefined();
    });
  });

  describe('Supplier Information Handling', () => {
    it('should include supplier information in order response', async () => {
      const orderData = {
        items: [
          {
            materialId: finishedMaterial.id,
            quantity: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders/finished')
        .set('Authorization', `Bearer ${amToken}`)
        .send(orderData);

      expect(response.body.data.supplierInfo).toBeDefined();
      expect(response.body.data.supplierInfo[0].supplier).toBe('供應商A');
      expect(response.body.data.supplierInfo[0].materialId).toBe(finishedMaterial.id);
    });

    it('should include supplier information in order list', async () => {
      const response = await request(app)
        .get('/api/orders/finished')
        .set('Authorization', `Bearer ${amToken}`);

      expect(response.body.success).toBe(true);
      const orders = response.body.data.orders;
      expect(orders.length).toBeGreaterThan(0);
      
      const orderWithItems = orders.find((order: any) => order.items && order.items.length > 0);
      if (orderWithItems) {
        expect(orderWithItems.items[0].supplier).toBeDefined();
      }
    });
  });
});