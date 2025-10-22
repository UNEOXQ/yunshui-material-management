import express from 'express';
import { triggerBackup, getBackupStatus } from '../controllers/backupController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 手動觸發備份（需要管理員權限）
router.post('/trigger', authenticateToken, async (req: any, res) => {
  // 檢查是否為管理員
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: '只有管理員可以觸發手動備份'
    });
  }
  
  return await triggerBackup(req, res);
});

// 獲取備份狀態（需要登入）
router.get('/status', authenticateToken, getBackupStatus);

export default router;