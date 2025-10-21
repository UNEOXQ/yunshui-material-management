import {
  createUserSchema,
  updateUserSchema,
  createMaterialSchema,
  updateMaterialSchema,
  createOrderSchema,
  createProjectSchema,
  updateProjectSchema,
  createStatusUpdateSchema,
  deliveryAdditionalDataSchema
} from '../models';
import { UserRole, MaterialType, StatusType } from '../types';

describe('Model Validation Tests', () => {
  describe('User Validation', () => {
    test('should validate correct user creation data', () => {
      const validUserData = {
        username: 'testuser123',
        email: 'test@example.com',
        password: 'SecurePass123!',
        role: 'PM'
      };

      const { error } = createUserSchema.validate(validUserData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid user data', () => {
      const invalidUserData = {
        username: 'ab', // Too short
        email: 'invalid-email',
        password: '123', // Too weak
        role: 'INVALID_ROLE'
      };

      const { error } = createUserSchema.validate(invalidUserData);
      expect(error).toBeDefined();
    });

    test('should validate user update data', () => {
      const validUpdateData = {
        username: 'newusername',
        role: 'AM'
      };

      const { error } = updateUserSchema.validate(validUpdateData);
      expect(error).toBeUndefined();
    });
  });

  describe('Material Validation', () => {
    test('should validate correct material creation data', () => {
      const validMaterialData = {
        name: 'Test Material',
        category: 'Category A',
        price: 99.99,
        quantity: 100,
        supplier: 'Test Supplier',
        type: 'AUXILIARY'
      };

      const { error } = createMaterialSchema.validate(validMaterialData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid material data', () => {
      const invalidMaterialData = {
        name: '', // Empty name
        category: 'Category A',
        price: -10, // Negative price
        quantity: -5, // Negative quantity
        type: 'INVALID_TYPE'
      };

      const { error } = createMaterialSchema.validate(invalidMaterialData);
      expect(error).toBeDefined();
    });

    test('should validate material update data', () => {
      const validUpdateData = {
        price: 149.99,
        quantity: 50
      };

      const { error } = updateMaterialSchema.validate(validUpdateData);
      expect(error).toBeUndefined();
    });
  });

  describe('Order Validation', () => {
    test('should validate correct order creation data', () => {
      const validOrderData = {
        items: [
          {
            materialId: '123e4567-e89b-12d3-a456-426614174000',
            quantity: 5
          },
          {
            materialId: '123e4567-e89b-12d3-a456-426614174001',
            quantity: 3
          }
        ]
      };

      const { error } = createOrderSchema.validate(validOrderData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid order data', () => {
      const invalidOrderData = {
        items: [] // Empty items array
      };

      const { error } = createOrderSchema.validate(invalidOrderData);
      expect(error).toBeDefined();
    });

    test('should reject order with invalid item data', () => {
      const invalidOrderData = {
        items: [
          {
            materialId: 'invalid-uuid',
            quantity: -1 // Negative quantity
          }
        ]
      };

      const { error } = createOrderSchema.validate(invalidOrderData);
      expect(error).toBeDefined();
    });
  });

  describe('Project Validation', () => {
    test('should validate correct project creation data', () => {
      const validProjectData = {
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        projectName: 'Test Project'
      };

      const { error } = createProjectSchema.validate(validProjectData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid project data', () => {
      const invalidProjectData = {
        orderId: 'invalid-uuid',
        projectName: '' // Empty project name
      };

      const { error } = createProjectSchema.validate(invalidProjectData);
      expect(error).toBeDefined();
    });

    test('should validate project update data', () => {
      const validUpdateData = {
        projectName: 'Updated Project Name',
        overallStatus: 'COMPLETED'
      };

      const { error } = updateProjectSchema.validate(validUpdateData);
      expect(error).toBeUndefined();
    });
  });

  describe('Status Update Validation', () => {
    test('should validate correct status update data', () => {
      const validStatusUpdateData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        updatedBy: '123e4567-e89b-12d3-a456-426614174001',
        statusType: 'ORDER',
        statusValue: 'Ordered',
        additionalData: {
          notes: 'Order placed successfully'
        }
      };

      const { error } = createStatusUpdateSchema.validate(validStatusUpdateData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid status update data', () => {
      const invalidStatusUpdateData = {
        projectId: 'invalid-uuid',
        updatedBy: 'invalid-uuid',
        statusType: 'INVALID_TYPE',
        statusValue: '' // Empty status value
      };

      const { error } = createStatusUpdateSchema.validate(invalidStatusUpdateData);
      expect(error).toBeDefined();
    });

    test('should validate delivery additional data', () => {
      const validDeliveryData = {
        time: '2024-01-15 14:30:00',
        address: '123 Main St, City, State',
        po: 'PO-2024-001',
        deliveredBy: 'John Doe'
      };

      const { error } = deliveryAdditionalDataSchema.validate(validDeliveryData);
      expect(error).toBeUndefined();
    });

    test('should reject incomplete delivery data', () => {
      const incompleteDeliveryData = {
        time: '2024-01-15 14:30:00',
        address: '123 Main St, City, State'
        // Missing po and deliveredBy
      };

      const { error } = deliveryAdditionalDataSchema.validate(incompleteDeliveryData);
      expect(error).toBeDefined();
    });
  });

  describe('Status Transition Validation', () => {
    test('should validate pickup status values', () => {
      const validPickupValues = ['Picked', 'Failed'];
      
      validPickupValues.forEach(value => {
        const statusData = {
          projectId: '123e4567-e89b-12d3-a456-426614174000',
          updatedBy: '123e4567-e89b-12d3-a456-426614174001',
          statusType: 'PICKUP',
          statusValue: value
        };

        const { error } = createStatusUpdateSchema.validate(statusData);
        expect(error).toBeUndefined();
      });
    });

    test('should validate check status values', () => {
      const validCheckValues = ['Check and sign(C.B/PM)', '(C.B)', 'WH)'];
      
      validCheckValues.forEach(value => {
        const statusData = {
          projectId: '123e4567-e89b-12d3-a456-426614174000',
          updatedBy: '123e4567-e89b-12d3-a456-426614174001',
          statusType: 'CHECK',
          statusValue: value
        };

        const { error } = createStatusUpdateSchema.validate(statusData);
        expect(error).toBeUndefined();
      });
    });
  });

  describe('Data Constraints', () => {
    test('should enforce string length limits', () => {
      const longString = 'a'.repeat(300);
      
      const invalidUserData = {
        username: longString, // Exceeds 50 character limit
        email: 'test@example.com',
        password: 'SecurePass123!',
        role: 'PM'
      };

      const { error } = createUserSchema.validate(invalidUserData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('cannot exceed 50 characters');
    });

    test('should enforce numeric constraints', () => {
      const invalidMaterialData = {
        name: 'Test Material',
        category: 'Category A',
        price: -10, // Negative price should be invalid
        quantity: 100,
        type: 'AUXILIARY'
      };

      const { error } = createMaterialSchema.validate(invalidMaterialData);
      expect(error).toBeDefined();
    });

    test('should enforce required fields', () => {
      const incompleteData = {
        username: 'testuser',
        // Missing required fields: email, password, role
      };

      const { error } = createUserSchema.validate(incompleteData);
      expect(error).toBeDefined();
      expect(error?.details.length).toBeGreaterThan(0);
    });

    test('should validate all user roles', () => {
      const validRoles: UserRole[] = ['PM', 'AM', 'WAREHOUSE', 'ADMIN'];
      
      validRoles.forEach(role => {
        const userData = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!',
          role
        };

        const { error } = createUserSchema.validate(userData);
        expect(error).toBeUndefined();
      });
    });

    test('should validate all material types', () => {
      const validTypes: MaterialType[] = ['AUXILIARY', 'FINISHED'];
      
      validTypes.forEach(type => {
        const materialData = {
          name: 'Test Material',
          category: 'Category A',
          price: 99.99,
          quantity: 100,
          type
        };

        const { error } = createMaterialSchema.validate(materialData);
        expect(error).toBeUndefined();
      });
    });

    test('should validate all status types', () => {
      const validStatusTypes: StatusType[] = ['ORDER', 'PICKUP', 'DELIVERY', 'CHECK'];
      
      validStatusTypes.forEach(statusType => {
        const statusData = {
          projectId: '123e4567-e89b-12d3-a456-426614174000',
          updatedBy: '123e4567-e89b-12d3-a456-426614174001',
          statusType,
          statusValue: 'Test Status'
        };

        const { error } = createStatusUpdateSchema.validate(statusData);
        expect(error).toBeUndefined();
      });
    });

    test('should validate decimal precision for prices', () => {
      const validPrices = [99.99, 100.00, 0.01, 1234.56];

      validPrices.forEach(price => {
        const materialData = {
          name: 'Test Material',
          category: 'Category A',
          price,
          quantity: 100,
          type: 'AUXILIARY'
        };

        const { error } = createMaterialSchema.validate(materialData);
        expect(error).toBeUndefined();
      });

      // Test that prices with more than 2 decimal places are handled
      // Note: Joi's precision() method rounds values rather than rejecting them
      const precisionTestData = {
        name: 'Test Material',
        category: 'Category A',
        price: 99.999, // This will be rounded to 100.00
        quantity: 100,
        type: 'AUXILIARY'
      };

      const { error, value } = createMaterialSchema.validate(precisionTestData);
      expect(error).toBeUndefined();
      // Joi rounds the value to the specified precision
      expect(value.price).toBe(100.00);
    });

    test('should allow empty supplier field', () => {
      const materialData = {
        name: 'Test Material',
        category: 'Category A',
        price: 99.99,
        quantity: 100,
        supplier: '', // Empty supplier should be allowed
        type: 'AUXILIARY'
      };

      const { error } = createMaterialSchema.validate(materialData);
      expect(error).toBeUndefined();
    });

    test('should validate UUID format in schemas', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      const invalidUUIDs = ['not-a-uuid', '123-456-789', ''];

      // Test valid UUID
      const validOrderData = {
        items: [{
          materialId: validUUID,
          quantity: 5
        }]
      };

      const { error: validError } = createOrderSchema.validate(validOrderData);
      expect(validError).toBeUndefined();

      // Test invalid UUIDs
      invalidUUIDs.forEach(invalidUUID => {
        const invalidOrderData = {
          items: [{
            materialId: invalidUUID,
            quantity: 5
          }]
        };

        const { error } = createOrderSchema.validate(invalidOrderData);
        expect(error).toBeDefined();
      });
    });
  });
});