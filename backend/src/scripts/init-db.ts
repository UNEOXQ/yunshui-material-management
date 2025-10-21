#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { runMigrations } from '../config/migrations';
import { initializeDatabase, closeDatabase } from '../config/database';

// Load environment variables
dotenv.config({ path: '.env.development' });

async function initializeDB() {
  try {
    console.log('🚀 Initializing database...');
    
    // Initialize database connections
    await initializeDatabase();
    console.log('✅ Database connections established');
    
    // Run migrations
    console.log('📦 Running database migrations...');
    await runMigrations();
    console.log('✅ Database migrations completed');
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

initializeDB();