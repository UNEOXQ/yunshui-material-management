import { Request, Response } from 'express';
import { githubBackupService } from '../services/githubBackupService';
import { githubRecoveryService } from '../services/githubRecoveryService';

/**
 * 手動觸發備份
 */
export const triggerBackup = async (_req: Request, res: Response) => {
  try {
    console.log('📝 收到手動備份請求');
    
    const success = await githubBackupService.triggerManualBackup();
    
    if (success) {
      res.json({
        success: true,
        message: '備份已成功完成',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: '備份失敗，請檢查配置和網絡連接'
      });
    }
  } catch (error: any) {
    console.error('手動備份失敗:', error);
    res.status(500).json({
      success: false,
      message: '備份過程中發生錯誤',
      error: error.message
    });
  }
};

/**
 * 獲取備份狀態
 */
export const getBackupStatus = async (_req: Request, res: Response) => {
  try {
    const status = githubBackupService.getBackupStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        lastBackupTimeFormatted: status.lastBackupTime ? 
          new Date(status.lastBackupTime).toLocaleString('zh-TW') : '尚未備份',
        nextBackupTimeFormatted: status.nextBackupTime ? 
          new Date(status.nextBackupTime).toLocaleString('zh-TW') : '未知',
      }
    });
  } catch (error: any) {
    console.error('獲取備份狀態失敗:', error);
    res.status(500).json({
      success: false,
      message: '無法獲取備份狀態',
      error: error.message
    });
  }
};

/**
 * 手動恢復數據（使用新的恢復服務）
 */
export const restoreFromBackup = async (req: Request, res: Response) => {
  try {
    console.log('📝 收到手動恢復請求');
    
    const { backupDate } = req.body;
    
    const result = await githubRecoveryService.manualRecover(backupDate);
    
    if (result.success) {
      res.json({
        success: true,
        message: '數據已成功從備份恢復',
        data: {
          timestamp: result.timestamp,
          statistics: result.statistics,
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: '數據恢復失敗',
        errors: result.errors
      });
    }
  } catch (error: any) {
    console.error('手動恢復失敗:', error);
    res.status(500).json({
      success: false,
      message: '恢復過程中發生錯誤',
      error: error.message
    });
  }
};

/**
 * 獲取可用備份列表
 */
export const getAvailableBackups = async (_req: Request, res: Response) => {
  try {
    const backups = await githubRecoveryService.getAvailableBackups();
    
    res.json({
      success: true,
      data: backups
    });
  } catch (error: any) {
    console.error('獲取可用備份列表失敗:', error);
    res.status(500).json({
      success: false,
      message: '無法獲取可用備份列表',
      error: error.message
    });
  }
};

/**
 * 獲取恢復狀態
 */
export const getRecoveryStatus = async (_req: Request, res: Response) => {
  try {
    const status = githubRecoveryService.getRecoveryStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        lastRecoveryTimeFormatted: status.lastRecoveryTime ? 
          new Date(status.lastRecoveryTime).toLocaleString('zh-TW') : '尚未恢復',
      }
    });
  } catch (error: any) {
    console.error('獲取恢復狀態失敗:', error);
    res.status(500).json({
      success: false,
      message: '無法獲取恢復狀態',
      error: error.message
    });
  }
};