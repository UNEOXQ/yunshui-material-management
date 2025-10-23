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
    'https://yunshui-material-management.vercel.app',
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
import backupRoutes from './routes/backup';
import messageRoutes from './routes/messageRoutes';
import { githubBackupService } from './services/githubBackupService';
import { githubRecoveryService } from './services/githubRecoveryService';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/errors', errorRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/messages', messageRoutes);

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
  httpServer.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
    console.log(`📦 Materials API: http://localhost:${PORT}/api/materials`);
    console.log(`🛒 Orders API: http://localhost:${PORT}/api/orders`);
    console.log(`📤 Upload API: http://localhost:${PORT}/api/upload`);
    console.log(`❌ Error API: http://localhost:${PORT}/api/errors`);
    console.log(`📊 Status API: http://localhost:${PORT}/api/status`);
    console.log(`💾 Backup API: http://localhost:${PORT}/api/backup`);
    console.log(`💬 Messages API: http://localhost:${PORT}/api/messages`);
    console.log(`🖼️  Static files: http://localhost:${PORT}/uploads`);
    console.log('');
    console.log('✅ 服務器啟動成功！使用內存數據庫模式 - 測試自動恢復功能');
    
    // 初始化 GitHub 備份和恢復服務
    console.log('');
    console.log('🔄 初始化 GitHub 備份和恢復服務...');
    
    // 初始化備份服務
    const backupInitialized = await githubBackupService.initialize();
    
    // 初始化恢復服務
    const recoveryInitialized = await githubRecoveryService.initialize();
    
    if (backupInitialized && recoveryInitialized) {
      console.log('✅ GitHub 自動備份和恢復已啟用');
      console.log('📅 備份頻率: 每 30 分鐘');
      console.log('📂 備份位置: GitHub data-backup 分支');
      console.log('🔄 自動恢復: 啟動時檢查');
      
      // 執行自動恢復
      console.log('');
      console.log('🔍 執行啟動時自動恢復檢查...');
      const autoRecoverySuccess = await githubRecoveryService.autoRecover();
      
      if (autoRecoverySuccess) {
        console.log('✅ 自動恢復檢查完成');
      } else {
        console.log('⚠️  自動恢復跳過或失敗');
      }
    } else if (backupInitialized) {
      console.log('✅ GitHub 自動備份已啟用（僅備份功能）');
      console.log('⚠️  恢復服務初始化失敗');
    } else {
      console.log('⚠️  GitHub 備份和恢復未配置，數據僅存儲在內存中');
      console.log('💡 要啟用自動備份和恢復，請設置以下環境變數:');
      console.log('   - GITHUB_TOKEN: GitHub Personal Access Token');
      console.log('   - GITHUB_OWNER: GitHub 用戶名或組織名');
      console.log('   - GITHUB_REPO: 倉庫名稱');
    }
  });
}

export default app;