#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { runMigrations, rollbackMigration } from '../config/migrations';
import { initializeDatabase, closeDatabase } from '../config/database';

// Load environment variables
dotenv.config();

const command = process.argv[2];

async function main() {
  try {
    await initializeDatabase();
    
    switch (command) {
      case 'up':
        await runMigrations();
        break;
      case 'down':
        await rollbackMigration();
        break;
      default:
        console.log('Usage: npm run migrate [up|down]');
        console.log('  up   - Run pending migrations');
        console.log('  down - Rollback last migration');
        process.exit(1);
    }
    
  } catch (error) {
    console.error('Migration script failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

main();