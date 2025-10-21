import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import path from 'path';

// 載入環境變數
dotenv.config({ path: '.env.development' });

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3004;

// 安全中間件
app.use(helmet());

// CORS 設定
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.CORS_ORIGIN || 'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 日誌中間件
app.use(morgan('combined'));

// 解析 JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 靜態文件服務 with comprehensive CORS headers
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
}, express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, _path) => {
    // Additional headers for static files
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// 健康檢查端點
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API 路由
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import materialRoutes from './routes/materialRoutes';
import orderRoutes from './routes/orderRoutes';
import uploadRoutes from './routes/uploadRoutes';
import errorRoutes from './routes/errorRoutes';
import statusRoutes from './routes/statusRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/errors', errorRoutes);
app.use('/api/status', statusRoutes);

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// 錯誤處理
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 啟動服務器
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
    console.log(`📦 Materials API: http://localhost:${PORT}/api/materials`);
    console.log(`🛒 Orders API: http://localhost:${PORT}/api/orders`);
    console.log(`📤 Upload API: http://localhost:${PORT}/api/upload`);
    console.log(`❌ Error API: http://localhost:${PORT}/api/errors`);
    console.log(`📊 Status API: http://localhost:${PORT}/api/status`);
    console.log(`🖼️  Static files: http://localhost:${PORT}/uploads`);
    console.log('');
    console.log('✅ 服務器啟動成功！使用內存數據庫模式');
  });
}

export default app;