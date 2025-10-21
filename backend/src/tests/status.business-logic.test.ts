import { StatusUpdateModel } from '../models/StatusUpdate';
import { ProjectModel } from '../models/Project';
import { OrderModel } from '../models/Order';
import { UserModel } from '../models/User';
import { MaterialModel } from '../models/Material';
import { pool } from '../config/database';

describe('Status Update Business Logic', () => {
  let testUser: any;
  let testMaterial: any;
  let testOrder: any;
  let testProject: any;

  beforeAll(async () => {
    // Clean up database
    await pool.query('DELETE FROM status_updates');
    await pool.query('DELETE FROM projects');
    await pool.query('DELETE FROM order_items');
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM materials');
    await pool.query('DELETE FROM users');

    // Create test data
    testUser = await UserModel.create({
      username: 'test_warehouse',
      email: 'warehouse@test.com',
      password: 'password123',
      role: 'WAREHOUSE'
    });

    testMaterial = await MaterialModel.create({
      name: '測試材料',
      category: '五金',
      price: 100.00,
      quantity: 50,
      type: 'AUXILIARY'
    });

    testOrder = await OrderModel.create({
      userId: testUser.id,
      totalAmount: 500.00,
      items: [{
        materialId: testMaterial.id,
        quantity: 5,
        unitPrice: 100.00
      }]
    });

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

  describe('Status Transition Validation', () => {
    it('should validate ORDER status transitions', () => {
      const validation1 = StatusUpdateModel.validateStatusTransition('ORDER', null, 'Ordered');
      expect(validation1.valid).toBe(true);

      const validation2 = StatusUpdateModel.validateStatusTransition('ORDER', 'Ordered', 'Processing');
      expect(validation2.valid).toBe(true);
    });

    it('should validate PICKUP status transitions', () => {
      const validation1 = StatusUpdateModel.validateStatusTransition('PICKUP', null, 'Picked');
      expect(validation1.valid).toBe(true);

      const validation2 = StatusUpdateModel.validateStatusTransition('PICKUP', null, 'Failed');
      expect(validation2.valid).toBe(true);

      const validation3 = StatusUpdateModel.validateStatusTransition('PICKUP', null, 'Invalid');
      expect(validation3.valid).toBe(false);
      expect(validation3.message).toContain('Invalid pickup status value');
    });

    it('should validate DELIVERY status transitions', () => {
      const validation1 = StatusUpdateModel.validateStatusTransition('DELIVERY', null, 'Delivered');
      expect(validation1.valid).toBe(true);

      const validation2 = StatusUpdateModel.validateStatusTransition('DELIVERY', null, 'Invalid');
      expect(validation2.valid).toBe(false);
      expect(validation2.message).toContain('Invalid delivery status value');
    });

    it('should validate CHECK status transitions', () => {
      const validation1 = StatusUpdateModel.validateStatusTransition('CHECK', null, 'Check and sign(C.B/PM)');
      expect(validation1.valid).toBe(true);

      const validation2 = StatusUpdateModel.validateStatusTransition('CHECK', null, '(C.B)');
      expect(validation2.valid).toBe(true);

      const validation3 = StatusUpdateModel.validateStatusTransition('CHECK', null, 'WH)');
      expect(validation3.valid).toBe(true);

      const validation4 = StatusUpdateModel.validateStatusTransition('CHECK', null, 'Invalid');
      expect(validation4.valid).toBe(false);
      expect(validation4.message).toContain('Invalid check status value');
    });
  });

  describe('Status Update Creation', () => {
    it('should create ORDER status update', async () => {
      const statusUpdate = await StatusUpdateModel.create({
        projectId: testProject.id,
        updatedBy: testUser.id,
        statusType: 'ORDER',
        statusValue: 'Ordered - Processing',
        additionalData: {
          primaryStatus: 'Ordered',
          secondaryStatus: 'Processing'
        }
      });

      expect(statusUpdate.id).toBeDefined();
      expect(statusUpdate.statusType).toBe('ORDER');
      expect(statusUpdate.statusValue).toBe('Ordered - Processing');
      expect(statusUpdate.additionalData).toBeDefined();
    });

    it('should create PICKUP status update', async () => {
      const statusUpdate = await StatusUpdateModel.create({
        projectId: testProject.id,
        updatedBy: testUser.id,
        statusType: 'PICKUP',
        statusValue: 'Picked (B.T.W)',
        additionalData: {
          primaryStatus: 'Picked',
          secondaryStatus: '(B.T.W)'
        }
      });

      expect(statusUpdate.statusType).toBe('PICKUP');
      expect(statusUpdate.statusValue).toBe('Picked (B.T.W)');
    });

    it('should create DELIVERY status update with additional data', async () => {
      const deliveryData = {
        time: '2023-10-11 14:30',
        address: '台北市信義區信義路五段7號',
        po: 'PO-2023-001',
        deliveredBy: '張三'
      };

      const statusUpdate = await StatusUpdateModel.create({
        projectId: testProject.id,
        updatedBy: testUser.id,
        statusType: 'DELIVERY',
        statusValue: 'Delivered',
        additionalData: deliveryData
      });

      expect(statusUpdate.statusType).toBe('DELIVERY');
      expect(statusUpdate.statusValue).toBe('Delivered');
      expect(statusUpdate.additionalData).toEqual(deliveryData);
    });

    it('should create CHECK status update', async () => {
      const statusUpdate = await StatusUpdateModel.create({
        projectId: testProject.id,
        updatedBy: testUser.id,
        statusType: 'CHECK',
        statusValue: 'Check and sign(C.B/PM)'
      });

      expect(statusUpdate.statusType).toBe('CHECK');
      expect(statusUpdate.statusValue).toBe('Check and sign(C.B/PM)');
    });
  });

  describe('Status History and Retrieval', () => {
    it('should get latest statuses by project', async () => {
      const latestStatuses = await StatusUpdateModel.getLatestStatusesByProject(testProject.id);

      expect(latestStatuses.ORDER).toBeDefined();
      expect(latestStatuses.PICKUP).toBeDefined();
      expect(latestStatuses.DELIVERY).toBeDefined();
      expect(latestStatuses.CHECK).toBeDefined();

      expect(latestStatuses.ORDER?.statusValue).toBe('Ordered - Processing');
      expect(latestStatuses.PICKUP?.statusValue).toBe('Picked (B.T.W)');
      expect(latestStatuses.DELIVERY?.statusValue).toBe('Delivered');
      expect(latestStatuses.CHECK?.statusValue).toBe('Check and sign(C.B/PM)');
    });

    it('should get status history for project', async () => {
      const statusHistory = await StatusUpdateModel.findByProjectId(testProject.id);

      expect(Array.isArray(statusHistory)).toBe(true);
      expect(statusHistory.length).toBeGreaterThan(0);

      // Should be ordered by creation time
      for (let i = 1; i < statusHistory.length; i++) {
        expect(statusHistory[i].createdAt >= statusHistory[i - 1].createdAt).toBe(true);
      }
    });

    it('should get status history with user details', async () => {
      const statusHistoryWithUsers = await StatusUpdateModel.findWithUserDetails(testProject.id);

      expect(Array.isArray(statusHistoryWithUsers)).toBe(true);
      expect(statusHistoryWithUsers.length).toBeGreaterThan(0);

      statusHistoryWithUsers.forEach(status => {
        expect(status.user).toBeDefined();
        expect(status.user.username).toBeDefined();
        expect(status.user.role).toBeDefined();
      });
    });
  });

  describe('Status Statistics', () => {
    it('should get status statistics', async () => {
      const statistics = await StatusUpdateModel.getStatistics();

      expect(statistics.total).toBeGreaterThan(0);
      expect(statistics.byType).toBeDefined();
      expect(statistics.byType.ORDER).toBeGreaterThan(0);
      expect(statistics.byType.PICKUP).toBeGreaterThan(0);
      expect(statistics.byType.DELIVERY).toBeGreaterThan(0);
      expect(statistics.byType.CHECK).toBeGreaterThan(0);
      expect(statistics.recentUpdates).toBeDefined();
    });
  });

  describe('Status Filtering and Pagination', () => {
    it('should filter status updates by type', async () => {
      const orderUpdates = await StatusUpdateModel.findByStatusType('ORDER', 1, 10);

      expect(orderUpdates.updates).toBeDefined();
      expect(orderUpdates.total).toBeGreaterThan(0);
      orderUpdates.updates.forEach(update => {
        expect(update.statusType).toBe('ORDER');
      });
    });

    it('should filter status updates by user', async () => {
      const userUpdates = await StatusUpdateModel.findByUserId(testUser.id, 1, 10);

      expect(userUpdates.updates).toBeDefined();
      expect(userUpdates.total).toBeGreaterThan(0);
      userUpdates.updates.forEach(update => {
        expect(update.updatedBy).toBe(testUser.id);
      });
    });

    it('should get all status updates with filters', async () => {
      const allUpdates = await StatusUpdateModel.findAll({
        projectId: testProject.id,
        statusType: 'ORDER'
      }, 1, 10);

      expect(allUpdates.updates).toBeDefined();
      expect(allUpdates.total).toBeGreaterThan(0);
      allUpdates.updates.forEach(update => {
        expect(update.projectId).toBe(testProject.id);
        expect(update.statusType).toBe('ORDER');
      });
    });
  });

  describe('Project Status Completion', () => {
    it('should complete project when check status is updated', async () => {
      // Create a new project for this test
      const newOrder = await OrderModel.create({
        userId: testUser.id,
        totalAmount: 300.00,
        items: [{
          materialId: testMaterial.id,
          quantity: 3,
          unitPrice: 100.00
        }]
      });

      const newProject = await ProjectModel.create(newOrder.id, '完成測試專案');

      // Initially should be ACTIVE
      expect(newProject.overallStatus).toBe('ACTIVE');

      // Update check status
      await StatusUpdateModel.create({
        projectId: newProject.id,
        updatedBy: testUser.id,
        statusType: 'CHECK',
        statusValue: '(C.B)'
      });

      // Manually update project status (this would be done by the controller)
      const completedProject = await ProjectModel.updateStatus(newProject.id, 'COMPLETED');

      expect(completedProject?.overallStatus).toBe('COMPLETED');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid project ID', async () => {
      await expect(StatusUpdateModel.create({
        projectId: '00000000-0000-0000-0000-000000000000',
        updatedBy: testUser.id,
        statusType: 'ORDER',
        statusValue: 'Ordered'
      })).rejects.toThrow('Project not found');
    });

    it('should handle invalid user ID', async () => {
      await expect(StatusUpdateModel.create({
        projectId: testProject.id,
        updatedBy: '00000000-0000-0000-0000-000000000000',
        statusType: 'ORDER',
        statusValue: 'Ordered'
      })).rejects.toThrow('User not found');
    });

    it('should validate delivery additional data', async () => {
      await expect(StatusUpdateModel.create({
        projectId: testProject.id,
        updatedBy: testUser.id,
        statusType: 'DELIVERY',
        statusValue: 'Delivered',
        additionalData: {
          time: '2023-10-11 14:30'
          // Missing required fields
        }
      })).rejects.toThrow('Delivery data validation error');
    });
  });
});