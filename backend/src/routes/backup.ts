import express from 'express';
import { 
  triggerBackup, 
  getBackupStatus, 
  restoreFromBackup,
  getAvailableBackups,
  getRecoveryStatus
} from '../controllers/backupController';
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

// 手動恢復數據（需要管理員權限）
router.post('/recover', authenticateToken, async (req: any, res) => {
  // 檢查是否為管理員
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: '只有管理員可以執行數據恢復'
    });
  }
  
  return await restoreFromBackup(req, res);
});

// 舊的恢復端點（保持向後兼容）
router.post('/restore', authenticateToken, async (req: any, res) => {
  // 檢查是否為管理員
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: '只有管理員可以執行數據恢復'
    });
  }
  
  return await restoreFromBackup(req, res);
});

// 獲取可用備份列表（需要登入）
router.get('/available', authenticateToken, getAvailableBackups);

// 獲取恢復狀態（需要登入）
router.get('/recovery-status', authenticateToken, getRecoveryStatus);

// 獲取備份狀態（需要登入）
router.get('/status', authenticateToken, getBackupStatus);

export default router;