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
    
    console.log(`🗑️ 開始刪除專案: ${id}`);
    
    // 檢查專案是否存在
    const project = await memoryDb.findProjectById(id);
    if (!project) {
      console.log(`❌ 專案不存在: ${id}`);
      res.status(404).json({
        success: false,
        message: '專案不存在'
      });
      return;
    }
    
    console.log(`📋 找到專案: ${project.projectName}`);
    
    // 移除所有關聯訂單的專案歸屬
    const orders = await memoryDb.getOrdersByProject(id);
    console.log(`📋 找到 ${orders.length} 個關聯訂單`);
    
    for (const order of orders) {
      const removed = await memoryDb.removeOrderFromProject(order.id);
      console.log(`📋 移除訂單 ${order.id} 的專案歸屬: ${removed ? '成功' : '失敗'}`);
    }
    
    console.log(`📋 已移除 ${orders.length} 個訂單的專案歸屬`);
    
    const success = await memoryDb.deleteProject(id);
    console.log(`🗑️ 刪除專案結果: ${success ? '成功' : '失敗'}`);
    
    if (!success) {
      res.status(500).json({
        success: false,
        message: '專案刪除失敗'
      });
      return;
    }
    
    res.json({
      success: true,
      message: '專案刪除成功'
    });
  } catch (error: any) {
    console.error('❌ 刪除專案錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除專案失敗'
    });
  }
});

export default router;