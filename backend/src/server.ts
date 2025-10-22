import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import materialRoutes from './routes/materialRoutes';
import uploadRoutes from './routes/uploadRoutes';
import orderRoutes from './routes/orderRoutes';
import statusRoutes from './routes/statusRoutes';
import errorRoutes from './routes/errorRoutes';
import messageRoutes from './routes/messages';
import { initializeWebSocketService } from './services/websocketService';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initializeDatabase } from './scripts/initDatabase';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.development' });

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://192.168.68.99:3000',
    'http://192.168.68.99:5173',
    'http://192.168.68.104:3000',
    'http://192.168.68.104:5173',
    'http://23.16.254.249:3000',
    'http://23.16.254.249:5173',
    'https://yunshui-material-management.vercel.app',
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads with comprehensive CORS headers
app.use('/uploads', (req, res, next) => {
  // Set comprehensive CORS headers for static files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Last-Modified');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
}, express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res, _path) => {
    // Additional headers for static files
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Root endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: '雲水基材管理系統 API 服務',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      materials: '/api/materials',
      orders: '/api/orders',
      upload: '/api/upload',
      status: '/api/status'
    }
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.1' // 添加版本號來確認部署
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/errors', errorRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/messages', messageRoutes);

// 404 handler - 必須在所有路由之後
app.use(notFoundHandler);

// Global error handler - 必須在最後
app.use(errorHandler);

// Initialize WebSocket service
initializeWebSocketService(httpServer);

// Initialize database and start server
if (process.env.NODE_ENV !== 'test') {
  const startServer = async () => {
    try {
      // 在生產環境中初始化 PostgreSQL 資料庫
      if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
        console.log('🗄️  Initializing PostgreSQL database...');
        await initializeDatabase();
        console.log('✅ Database initialization completed');
      } else {
        console.log('🗄️  Using memory database for development');
      }
      
      httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🔌 WebSocket server initialized`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
        console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
        console.log(`📦 Materials API: http://localhost:${PORT}/api/materials`);
        console.log(`📁 Upload API: http://localhost:${PORT}/api/upload`);
        console.log(`🛒 Orders API: http://localhost:${PORT}/api/orders`);
        console.log(`📊 Status API: http://localhost:${PORT}/api/status`);
        console.log(`🖼️  Static files: http://localhost:${PORT}/uploads`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  };
  
  startServer();
}

export default app;