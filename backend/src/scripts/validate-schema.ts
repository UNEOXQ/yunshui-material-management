#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { pool, initializeDatabase, closeDatabase } from '../config/database';

// Load environment variables
dotenv.config({ path: '.env.development' });

interface TableInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface IndexInfo {
  indexname: string;
  tablename: string;
  indexdef: string;
}

async function validateSchema() {
  try {
    console.log('🔍 Validating database schema...');
    
    await initializeDatabase();
    
    // Check tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    const tables = tablesResult.rows.map(row => row.table_name);
    
    console.log('📋 Found tables:', tables);
    
    // Expected tables
    const expectedTables = [
      'users',
      'materials',
      'orders', 
      'order_items',
      'projects',
      'status_updates',
      'migrations'
    ];
    
    // Check if all expected tables exist
    const missingTables = expectedTables.filter(table => !tables.includes(table));
    if (missingTables.length > 0) {
      console.error('❌ Missing tables:', missingTables);
      return false;
    }
    
    console.log('✅ All expected tables found');
    
    // Check table structures
    for (const tableName of expectedTables.filter(t => t !== 'migrations')) {
      console.log(`\n🔍 Checking structure of table: ${tableName}`);
      
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position
      `;
      
      const columnsResult = await pool.query(columnsQuery, [tableName]);
      const columns = columnsResult.rows as TableInfo[];
      
      console.log(`   Columns (${columns.length}):`);
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      // Check indexes
      const indexesQuery = `
        SELECT indexname, tablename, indexdef
        FROM pg_indexes 
        WHERE tablename = $1 
        AND schemaname = 'public'
        ORDER BY indexname
      `;
      
      const indexesResult = await pool.query(indexesQuery, [tableName]);
      const indexes = indexesResult.rows as IndexInfo[];
      
      if (indexes.length > 0) {
        console.log(`   Indexes (${indexes.length}):`);
        indexes.forEach(idx => {
          console.log(`   - ${idx.indexname}`);
        });
      }
    }
    
    // Check foreign key constraints
    console.log('\n🔗 Checking foreign key constraints...');
    const fkQuery = `
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `;
    
    const fkResult = await pool.query(fkQuery);
    console.log(`Found ${fkResult.rows.length} foreign key constraints:`);
    fkResult.rows.forEach(fk => {
      console.log(`   ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // Check enum types
    console.log('\n📝 Checking custom enum types...');
    const enumQuery = `
      SELECT t.typname, e.enumlabel
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder
    `;
    
    const enumResult = await pool.query(enumQuery);
    const enums: { [key: string]: string[] } = {};
    
    enumResult.rows.forEach(row => {
      if (!enums[row.typname]) {
        enums[row.typname] = [];
      }
      enums[row.typname].push(row.enumlabel);
    });
    
    Object.entries(enums).forEach(([typeName, values]) => {
      console.log(`   ${typeName}: [${values.join(', ')}]`);
    });
    
    console.log('\n🎉 Database schema validation completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Schema validation failed:', error);
    return false;
  } finally {
    await closeDatabase();
  }
}

validateSchema().then(success => {
  process.exit(success ? 0 : 1);
});