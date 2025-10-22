import { Request, Response } from 'express';
import { githubBackupService } from '../services/githubBackupService';

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