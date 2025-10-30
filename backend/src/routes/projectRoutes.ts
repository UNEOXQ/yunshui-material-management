import express from 'express';
import { memoryDb } from '../config/memory-database';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// 獲取所有專案
router.get('/', authenticateToken, async (_req: AuthenticatedRequest, res) => {
  try {
    const projects = await memoryDb.getAllProjects();
    
    res.json({
      success: true,
      data: projects
    });
  } catch (error: any) {
    console.error('獲取專案列表失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取專案列表失敗'
    });
  }
});

// 創建新專案
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { projectName, description } = req.body;
    
    if (!projectName || projectName.trim() === '') {
      res.status(400).json({
        success: false,
        message: '專案名稱不能為空'
      });
      return;
    }

    // 檢查專案名稱是否已存在
    const existingProjects = await memoryDb.getAllProjects();
    const nameExists = existingProjects.some(p => 
      p.projectName.toLowerCase() === projectName.trim().toLowerCase()
    );

    if (nameExists) {
      res.status(400).json({
        success: false,
        message: '專案名稱已存在'
      });
      return;
    }

    const project = await memoryDb.createStandaloneProject({
      projectName: projectName.trim(),
      description: description?.trim() || '',
      createdBy: req.user!.userId
    });
    
    res.json({
      success: true,
      data: project,
      message: '專案創建成功'
    });
  } catch (error: any) {
    console.error('創建專案失敗:', error);
    res.status(500).json({
      success: false,
      message: '創建專案失敗'
    });
  }
});

// 更新專案
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { projectName, description, overallStatus } = req.body;
    
    const project = await memoryDb.updateProject(id, {
      projectName,
      description,
      overallStatus
    });
    
    if (!project) {
      res.status(404).json({
        success: false,
        message: '專案不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      data: project,
      message: '專案更新成功'
    });
  } catch (error: any) {
    console.error('更新專案失敗:', error);
    res.status(500).json({
      success: false,
      message: '更新專案失敗'
    });
  }
});

// 獲取專案下的所有訂單
router.get('/:id/orders', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const orders = await memoryDb.getOrdersByProject(id);
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error: any) {
    console.error('獲取專案訂單失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取專案訂單失敗'
    });
  }
});

// 刪除專案
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    
    // 檢查是否有訂單關聯到此專案
    const orders = await memoryDb.getOrdersByProject(id);
    if (orders.length > 0) {
      res.status(400).json({
        success: false,
        message: '無法刪除有關聯訂單的專案'
      });
      return;
    }
    
    const success = await memoryDb.deleteProject(id);
    
    if (!success) {
      res.status(404).json({
        success: false,
        message: '專案不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      message: '專案刪除成功'
    });
  } catch (error: any) {
    console.error('刪除專案失敗:', error);
    res.status(500).json({
      success: false,
      message: '刪除專案失敗'
    });
  }
});

export default router;