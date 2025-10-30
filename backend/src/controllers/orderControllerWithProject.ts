import { Response } from 'express';
import { memoryDb } from '../config/memory-database';
import { AuthenticatedRequest } from '../types';
import Joi from 'joi';

// 訂單創建請求的驗證模式
const createOrderWithProjectSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        materialId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required()
      })
    )
    .min(1)
    .required(),
  projectId: Joi.string().optional().allow(''),
  newProjectName: Joi.string().optional().allow(''),
  orderName: Joi.string().optional().allow('')
});

export class OrderControllerWithProject {
  /**
   * 創建輔材訂單（支持專案選擇）
   */
  static async createAuxiliaryOrderWithProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = req.user!.role;
      
      // 只有 PM 用戶和管理員可以創建輔材訂單
      if (userRole !== 'PM' && userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: '只有 PM 用戶和管理員可以創建輔材訂單'
        });
        return;
      }

      // 驗證請求數據
      const { error, value } = createOrderWithProjectSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: error.details[0].message
        });
        return;
      }

      const { items, projectId, newProjectName, orderName } = value;
      const userId = req.user!.userId;

      // 驗證材料並計算總金額
      let totalAmount = 0;
      const validatedItems: Array<{ materialId: string; quantity: number; unitPrice: number }> = [];

      for (const item of items) {
        const material = await memoryDb.getMaterialById(item.materialId);
        
        if (!material) {
          res.status(400).json({
            success: false,
            message: `材料 ${item.materialId} 不存在`
          });
          return;
        }

        // 確保是輔材
        if (material.type !== 'AUXILIARY') {
          res.status(400).json({
            success: false,
            message: `材料 ${material.name} 不是輔材`
          });
          return;
        }

        const itemTotal = material.price * item.quantity;
        totalAmount += itemTotal;

        validatedItems.push({
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: material.price
        });
      }

      // 處理專案邏輯
      let finalProjectId = projectId;

      // 如果提供了新專案名稱，創建新專案
      if (newProjectName && newProjectName.trim()) {
        const existingProjects = await memoryDb.getAllProjects();
        const nameExists = existingProjects.some(p => 
          p.projectName.toLowerCase() === newProjectName.trim().toLowerCase()
        );

        if (nameExists) {
          res.status(400).json({
            success: false,
            message: '專案名稱已存在'
          });
          return;
        }

        const newProject = await memoryDb.createStandaloneProject({
          projectName: newProjectName.trim(),
          createdBy: userId
        });
        finalProjectId = newProject.id;
      }

      // 創建訂單
      const order = await memoryDb.createOrder({
        userId,
        status: 'PENDING',
        totalAmount,
        name: orderName || `輔材訂單-${new Date().toLocaleDateString()}`,
        projectId: finalProjectId
      });

      // 創建訂單項目
      for (const item of validatedItems) {
        await memoryDb.createOrderItem({
          orderId: order.id,
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        });
      }

      // 如果有專案ID，創建專案關聯（用於舊的專案系統兼容）
      if (finalProjectId) {
        const existingProject = await memoryDb.findProjectByOrderId(order.id);
        if (!existingProject) {
          await memoryDb.createProject(order.id, `輔材專案-${new Date().toLocaleDateString()}-${order.id}`);
        }
      }

      // 獲取完整的訂單信息
      const enrichedOrder = await memoryDb.enrichOrderWithMaterials(order);

      res.status(201).json({
        success: true,
        data: enrichedOrder,
        message: '輔材訂單創建成功'
      });

    } catch (error: any) {
      console.error('創建輔材訂單失敗:', error);
      res.status(500).json({
        success: false,
        message: '創建輔材訂單失敗'
      });
    }
  }

  /**
   * 創建完成材訂單（支持專案選擇）
   */
  static async createFinishedOrderWithProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = req.user!.role;
      
      // 只有 AM 用戶和管理員可以創建完成材訂單
      if (userRole !== 'AM' && userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: '只有 AM 用戶和管理員可以創建完成材訂單'
        });
        return;
      }

      // 驗證請求數據
      const { error, value } = createOrderWithProjectSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: error.details[0].message
        });
        return;
      }

      const { items, projectId, newProjectName, orderName } = value;
      const userId = req.user!.userId;

      // 驗證材料並計算總金額
      let totalAmount = 0;
      const validatedItems: Array<{ materialId: string; quantity: number; unitPrice: number }> = [];

      for (const item of items) {
        const material = await memoryDb.getMaterialById(item.materialId);
        
        if (!material) {
          res.status(400).json({
            success: false,
            message: `材料 ${item.materialId} 不存在`
          });
          return;
        }

        // 確保是完成材
        if (material.type !== 'FINISHED') {
          res.status(400).json({
            success: false,
            message: `材料 ${material.name} 不是完成材`
          });
          return;
        }

        const itemTotal = material.price * item.quantity;
        totalAmount += itemTotal;

        validatedItems.push({
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: material.price
        });
      }

      // 處理專案邏輯
      let finalProjectId = projectId;

      // 如果提供了新專案名稱，創建新專案
      if (newProjectName && newProjectName.trim()) {
        const existingProjects = await memoryDb.getAllProjects();
        const nameExists = existingProjects.some(p => 
          p.projectName.toLowerCase() === newProjectName.trim().toLowerCase()
        );

        if (nameExists) {
          res.status(400).json({
            success: false,
            message: '專案名稱已存在'
          });
          return;
        }

        const newProject = await memoryDb.createStandaloneProject({
          projectName: newProjectName.trim(),
          createdBy: userId
        });
        finalProjectId = newProject.id;
      }

      // 創建訂單
      const order = await memoryDb.createOrder({
        userId,
        status: 'PENDING',
        totalAmount,
        name: orderName || `完成材訂單-${new Date().toLocaleDateString()}`,
        projectId: finalProjectId
      });

      // 創建訂單項目
      for (const item of validatedItems) {
        await memoryDb.createOrderItem({
          orderId: order.id,
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        });
      }

      // 如果有專案ID，創建專案關聯（用於舊的專案系統兼容）
      if (finalProjectId) {
        const existingProject = await memoryDb.findProjectByOrderId(order.id);
        if (!existingProject) {
          await memoryDb.createProject(order.id, `完成材專案-${new Date().toLocaleDateString()}-${order.id}`);
        }
      }

      // 獲取完整的訂單信息
      const enrichedOrder = await memoryDb.enrichOrderWithMaterials(order);

      res.status(201).json({
        success: true,
        data: enrichedOrder,
        message: '完成材訂單創建成功'
      });

    } catch (error: any) {
      console.error('創建完成材訂單失敗:', error);
      res.status(500).json({
        success: false,
        message: '創建完成材訂單失敗'
      });
    }
  }
}