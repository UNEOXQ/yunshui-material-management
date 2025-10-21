import { Pool, PoolConfig } from 'pg';
import { createClient } from 'redis';

// PostgreSQL configuration
const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'yun_shui_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
};

// Create PostgreSQL connection pool
export const pool = new Pool(dbConfig);

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
};

// Create Redis client
const redisOptions: any = {
  socket: {
    host: redisConfig.host,
    port: redisConfig.port,
  },
  database: redisConfig.db,
};

if (redisConfig.password) {
  redisOptions.password = redisConfig.password;
}

export const redisClient = createClient(redisOptions);

// Database connection initialization
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Test PostgreSQL connection
    const client = await pool.connect();
    console.log('PostgreSQL connected successfully');
    client.release();

    // Connect to Redis
    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

// Graceful shutdown
export const closeDatabase = async (): Promise<void> => {
  try {
    await pool.end();
    await redisClient.quit();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
};

// Database health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    await redisClient.ping();
    
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};