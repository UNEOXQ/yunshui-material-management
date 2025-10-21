import { Pool } from 'pg';
import { pool } from './database';
import fs from 'fs';
import path from 'path';

export interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
}

// Create migrations table if it doesn't exist
const createMigrationsTable = async (client: Pool): Promise<void> => {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await client.query(query);
};

// Get executed migrations
const getExecutedMigrations = async (client: Pool): Promise<string[]> => {
  const result = await client.query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map(row => row.name);
};

// Mark migration as executed
const markMigrationExecuted = async (client: Pool, name: string): Promise<void> => {
  await client.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
};

// Load migration files
const loadMigrations = (): Migration[] => {
  const migrationsDir = path.join(__dirname, '../migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  return files.map(file => {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Split up and down migrations
    const [up, down] = content.split('-- DOWN');
    
    return {
      id: file.replace('.sql', ''),
      name: file,
      up: up.replace('-- UP', '').trim(),
      down: down ? down.trim() : ''
    };
  });
};

// Run migrations
export const runMigrations = async (): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create migrations table
    await createMigrationsTable(pool);
    
    // Get executed migrations
    const executedMigrations = await getExecutedMigrations(pool);
    
    // Load all migrations
    const migrations = loadMigrations();
    
    // Run pending migrations
    for (const migration of migrations) {
      if (!executedMigrations.includes(migration.name)) {
        console.log(`Running migration: ${migration.name}`);
        
        // Execute migration
        await client.query(migration.up);
        
        // Mark as executed
        await markMigrationExecuted(pool, migration.name);
        
        console.log(`Migration completed: ${migration.name}`);
      }
    }
    
    await client.query('COMMIT');
    console.log('All migrations completed successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Rollback last migration
export const rollbackMigration = async (): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get last executed migration
    const result = await client.query(
      'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      console.log('No migrations to rollback');
      return;
    }
    
    const lastMigration = result.rows[0].name;
    const migrations = loadMigrations();
    const migration = migrations.find(m => m.name === lastMigration);
    
    if (!migration || !migration.down) {
      throw new Error(`No rollback script found for migration: ${lastMigration}`);
    }
    
    console.log(`Rolling back migration: ${lastMigration}`);
    
    // Execute rollback
    await client.query(migration.down);
    
    // Remove from migrations table
    await client.query('DELETE FROM migrations WHERE name = $1', [lastMigration]);
    
    await client.query('COMMIT');
    console.log(`Migration rolled back: ${lastMigration}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};