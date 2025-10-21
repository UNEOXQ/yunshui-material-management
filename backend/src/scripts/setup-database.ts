#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { runMigrations } from '../config/migrations';
import { initializeDatabase, closeDatabase } from '../config/database';

// Load environment variables
dotenv.config({ path: '.env.development' });

async function setupDatabase() {
  console.log('🚀 Setting up Yun Shui Material Management Database...');
  
  try {
    // First, try to connect to the database
    console.log('📡 Testing database connection...');
    await initializeDatabase();
    console.log('✅ Database connection successful');
    
    // Run migrations
    console.log('📦 Running database migrations...');
    await runMigrations();
    console.log('✅ Database migrations completed');
    
    // Verify schema
    console.log('🔍 Verifying database schema...');
    await verifySchema();
    console.log('✅ Database schema verified');
    
    // Create initial admin user if needed
    console.log('👤 Checking for admin user...');
    await createInitialAdminUser();
    
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('📋 Database Summary:');
    console.log('   - PostgreSQL database: yun_shui_db');
    console.log('   - Redis cache: Connected');
    console.log('   - Tables: users, materials, orders, order_items, projects, status_updates');
    console.log('   - Admin user: admin@yunshui.com (if created)');
    console.log('');
    console.log('🚀 You can now start the backend server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    
    if (error instanceof Error && 'code' in error) {
      switch (error.code) {
        case 'ECONNREFUSED':
          console.log('');
          console.log('💡 Troubleshooting:');
          console.log('   1. Make sure PostgreSQL is running on port 5432');
          console.log('   2. Make sure Redis is running on port 6379');
          console.log('   3. Start services with: docker compose up -d postgres redis');
          console.log('   4. Or install PostgreSQL and Redis locally');
          break;
        case 'ENOTFOUND':
          console.log('');
          console.log('💡 Troubleshooting:');
          console.log('   1. Check your database host configuration');
          console.log('   2. Verify network connectivity');
          break;
        default:
          console.log('');
          console.log('💡 Check the error message above for more details');
      }
    }
    
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

async function verifySchema() {
  const { pool } = require('../config/database');
  
  // Check if all required tables exist
  const requiredTables = [
    'users',
    'materials', 
    'orders',
    'order_items',
    'projects',
    'status_updates'
  ];
  
  for (const tableName of requiredTables) {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);
    
    if (!result.rows[0].exists) {
      throw new Error(`Required table '${tableName}' does not exist`);
    }
  }
  
  // Check if required enums exist
  const requiredEnums = [
    'user_role',
    'material_type',
    'order_status',
    'project_status',
    'status_type'
  ];
  
  for (const enumName of requiredEnums) {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = $1
      );
    `, [enumName]);
    
    if (!result.rows[0].exists) {
      throw new Error(`Required enum type '${enumName}' does not exist`);
    }
  }
}

async function createInitialAdminUser() {
  const { pool } = require('../config/database');
  const bcrypt = require('bcrypt');
  
  // Check if admin user already exists
  const existingAdmin = await pool.query(
    'SELECT id FROM users WHERE role = $1 LIMIT 1',
    ['ADMIN']
  );
  
  if (existingAdmin.rows.length > 0) {
    console.log('   ℹ️  Admin user already exists, skipping creation');
    return;
  }
  
  // Create initial admin user
  const adminPassword = 'admin123'; // Change this in production!
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  
  await pool.query(`
    INSERT INTO users (username, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
  `, ['admin', 'admin@yunshui.com', hashedPassword, 'ADMIN']);
  
  console.log('   ✅ Initial admin user created');
  console.log('   📧 Email: admin@yunshui.com');
  console.log('   🔑 Password: admin123 (CHANGE THIS IN PRODUCTION!)');
}

// Run the setup
setupDatabase();