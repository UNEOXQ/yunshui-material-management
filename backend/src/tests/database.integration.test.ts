import { pool, initializeDatabase, closeDatabase } from '../config/database';
import { runMigrations } from '../config/migrations';

// Integration tests that require a running database
// These tests will be skipped if no database is available
describe('Database Integration Tests', () => {
  let databaseAvailable = false;

  beforeAll(async () => {
    try {
      // Try to connect to database
      await initializeDatabase();
      databaseAvailable = true;
    } catch (error) {
      console.log('Database not available for integration tests, skipping...');
      databaseAvailable = false;
    }
  });

  afterAll(async () => {
    if (databaseAvailable) {
      await closeDatabase();
    }
  });

  test('should connect to PostgreSQL when database is available', async () => {
    if (!databaseAvailable) {
      console.log('Skipping test - database not available');
      return;
    }

    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test');
    expect(result.rows[0].test).toBe(1);
    client.release();
  });

  test('should run migrations successfully when database is available', async () => {
    if (!databaseAvailable) {
      console.log('Skipping test - database not available');
      return;
    }

    // This will run migrations if database is available
    await expect(runMigrations()).resolves.not.toThrow();
  });

  test('should have all required tables after migration', async () => {
    if (!databaseAvailable) {
      console.log('Skipping test - database not available');
      return;
    }

    // Test that all tables exist
    const tableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const result = await pool.query(tableQuery);
    const tableNames = result.rows.map((row: any) => row.table_name);
    
    // Expected tables from our migrations
    const expectedTables = [
      'users',
      'materials', 
      'orders',
      'order_items',
      'projects',
      'status_updates',
      'migrations'
    ];
    
    // Check that all expected tables exist
    expectedTables.forEach(tableName => {
      expect(tableNames).toContain(tableName);
    });
  });

  test('should have proper enum types created', async () => {
    if (!databaseAvailable) {
      console.log('Skipping test - database not available');
      return;
    }

    const enumQuery = `
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ORDER BY typname
    `;
    
    const result = await pool.query(enumQuery);
    const enumNames = result.rows.map((row: any) => row.typname);
    
    const expectedEnums = [
      'user_role',
      'material_type',
      'order_status',
      'project_status',
      'status_type'
    ];
    
    expectedEnums.forEach(enumName => {
      expect(enumNames).toContain(enumName);
    });
  });
});