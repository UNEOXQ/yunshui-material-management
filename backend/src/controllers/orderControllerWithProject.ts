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
      console.log('🔍 創建輔材訂單（支持專案）- 開始');
      console.log('📝 請求數據:', JSON.stringify(req.body, null, 2));
      
      const userRole = req.user!.role;
      
      // 只有 PM 用戶和管理員可以創建輔材訂單
      if (userRole !== 'PM' && userRole !== 'ADMIN') {
        console.log('❌ 權限不足:', userRole);
        res.status(403).json({
          success: false,
          message: '只有 PM 用戶和管理員可以創建輔材訂單'
        });
        return;
      }

      // 驗證請求數據
      const { error, value } = createOrderWithProjectSchema.validate(req.body);
      if (error) {
        console.log('❌ 數據驗證失敗:', error.details[0].message);
        res.status(400).json({
          success: false,
          message: error.details[0].message
        });
        return;
      }

      const { items, projectId, newProjectName, orderName } = value;
      const userId = req.user!.userId;
      
      console.log('✅ 驗證通過 - 用戶ID:', userId);
      console.log('📋 訂單項目:', items);
      console.log('🏗️ 專案ID:', projectId);
      console.log('🆕 新專案名稱:', newProjectName);
      console.log('📝 訂單名稱:', orderName);

      // 驗證材料並計算總金額
      let totalAmount = 0;
      const validatedItems: Array<{ materialId: string; quantity: number; unitPrice: number }> = [];

      for (const item of items) {
        const material = await memoryDb.getMaterialById(item.materialId);
        
        if (!material) {
          console.log('❌ 材料不存在:', item.materialId);
          res.status(400).json({
            success: false,
            message: `材料 ${item.materialId} 不存在`
          });
          return;
        }

        // 確保是輔材
        if (material.type !== 'AUXILIARY') {
          console.log('❌ 材料類型錯誤:', material.name, material.type);
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

      console.log('💰 總金額:', totalAmount);

      // 處理專案邏輯
      let finalProjectId = projectId;

      // 如果提供了新專案名稱，創建新專案
      if (newProjectName && newProjectName.trim()) {
        console.log('🏗️ 創建新專案:', newProjectName.trim());
        
        const existingProjects = await memoryDb.getAllProjects();
        console.log('📋 現有專案數量:', existingProjects.length);
        
        const nameExists = existingProjects.some(p => 
          p.projectName.toLowerCase() === newProjectName.trim().toLowerCase()
        );

        if (nameExists) {
          console.log('❌ 專案名稱已存在:', newProjectName.trim());
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
        
        console.log('✅ 新專案創建成功:', newProject.id, newProject.projectName);
        finalProjectId = newProject.id;
      }

      // 創建訂單
      const orderData = {
        userId,
        status: 'PENDING' as const,
        totalAmount,
        name: orderName || `輔材訂單-${new Date().toLocaleDateString()}`,
        ...(finalProjectId && { projectId: finalProjectId })
      };

      console.log('📦 創建訂單數據:', orderData);
      
      const order = await memoryDb.createOrder(orderData);
      console.log('✅ 訂單創建成功:', order.id);

      // 創建訂單項目
      for (const item of validatedItems) {
        await memoryDb.createOrderItem({
          orderId: order.id,
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        });
      }

      console.log('✅ 訂單項目創建完成');

      // 如果有專案ID，將訂單關聯到現有專案
      if (finalProjectId) {
        console.log('📋 將訂單關聯到專案:', finalProjectId);
        // 不自動創建專案，只關聯到現有專案
        await memoryDb.assignOrderToProject(order.id, finalProjectId);
        console.log('✅ 訂單專案關聯完成');
      } else {
        console.log('📝 訂單未選擇專案，保持獨立狀態');
      }

      // 獲取完整的訂單信息
      const enrichedOrder = await memoryDb.enrichOrderWithMaterials(order);

      console.log('🎉 輔材訂單創建流程完成');

      res.status(201).json({
        success: true,
        data: enrichedOrder,
        message: '輔材訂單創建成功'
      });

    } catch (error: any) {
      console.error('❌ 創建輔材訂單失敗:', error);
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
      console.log('🔍 創建完成材訂單（支持專案）- 開始');
      console.log('📝 請求數據:', JSON.stringify(req.body, null, 2));
      
      const userRole = req.user!.role;
      
      // 只有 AM 用戶和管理員可以創建完成材訂單
      if (userRole !== 'AM' && userRole !== 'ADMIN') {
        console.log('❌ 權限不足:', userRole);
        res.status(403).json({
          success: false,
          message: '只有 AM 用戶和管理員可以創建完成材訂單'
        });
        return;
      }

      // 驗證請求數據
      const { error, value } = createOrderWithProjectSchema.validate(req.body);
      if (error) {
        console.log('❌ 數據驗證失敗:', error.details[0].message);
        res.status(400).json({
          success: false,
          message: error.details[0].message
        });
        return;
      }

      const { items, projectId, newProjectName, orderName } = value;
      const userId = req.user!.userId;
      
      console.log('✅ 驗證通過 - 用戶ID:', userId);
      console.log('📋 訂單項目:', items);
      console.log('🏗️ 專案ID:', projectId);
      console.log('🆕 新專案名稱:', newProjectName);
      console.log('📝 訂單名稱:', orderName);

      // 驗證材料並計算總金額
      let totalAmount = 0;
      const validatedItems: Array<{ materialId: string; quantity: number; unitPrice: number }> = [];

      for (const item of items) {
        const material = await memoryDb.getMaterialById(item.materialId);
        
        if (!material) {
          console.log('❌ 材料不存在:', item.materialId);
          res.status(400).json({
            success: false,
            message: `材料 ${item.materialId} 不存在`
          });
          return;
        }

        // 確保是完成材
        if (material.type !== 'FINISHED') {
          console.log('❌ 材料類型錯誤:', material.name, material.type);
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

      console.log('💰 總金額:', totalAmount);

      // 處理專案邏輯
      let finalProjectId = projectId;

      // 如果提供了新專案名稱，創建新專案
      if (newProjectName && newProjectName.trim()) {
        console.log('🏗️ 創建新專案:', newProjectName.trim());
        
        const existingProjects = await memoryDb.getAllProjects();
        console.log('📋 現有專案數量:', existingProjects.length);
        
        const nameExists = existingProjects.some(p => 
          p.projectName.toLowerCase() === newProjectName.trim().toLowerCase()
        );

        if (nameExists) {
          console.log('❌ 專案名稱已存在:', newProjectName.trim());
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
        
        console.log('✅ 新專案創建成功:', newProject.id, newProject.projectName);
        finalProjectId = newProject.id;
      }

      // 創建訂單
      const orderData = {
        userId,
        status: 'PENDING' as const,
        totalAmount,
        name: orderName || `完成材訂單-${new Date().toLocaleDateString()}`,
        ...(finalProjectId && { projectId: finalProjectId })
      };

      console.log('📦 創建訂單數據:', orderData);
      
      const order = await memoryDb.createOrder(orderData);
      console.log('✅ 訂單創建成功:', order.id);

      // 創建訂單項目
      for (const item of validatedItems) {
        await memoryDb.createOrderItem({
          orderId: order.id,
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        });
      }

      console.log('✅ 訂單項目創建完成');

      // 如果有專案ID，創建專案關聯（用於舊的專案系統兼容）
      if (finalProjectId) {
        const existingProject = await memoryDb.findProjectByOrderId(order.id);
        if (!existingProject) {
          await memoryDb.createProject(order.id, `完成材專案-${new Date().toLocaleDateString()}-${order.id}`);
          console.log('✅ 專案關聯創建完成');
        }
      }

      // 獲取完整的訂單信息
      const enrichedOrder = await memoryDb.enrichOrderWithMaterials(order);

      console.log('🎉 完成材訂單創建流程完成');

      res.status(201).json({
        success: true,
        data: enrichedOrder,
        message: '完成材訂單創建成功'
      });

    } catch (error: any) {
      console.error('❌ 創建完成材訂單失敗:', error);
      res.status(500).json({
        success: false,
        message: '創建完成材訂單失敗'
      });
    }
  }
}  // 將訂單分
配到專案
  static async assignOrderToProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: orderId } = req.params;
      const { projectId } = req.body;

      console.log('📋 分配訂單到專案:', { orderId, projectId });

      // 驗證輸入
      if (!orderId || !projectId) {
        return res.status(400).json({
          success: false,
          message: '訂單ID和專案ID都是必需的'
        });
      }

      // 檢查訂單是否存在
      const order = await memoryDb.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '找不到指定的訂單'
        });
      }

      // 檢查專案是否存在
      const project = await memoryDb.findProjectById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: '找不到指定的專案'
        });
      }

      // 分配訂單到專案
      const success = await memoryDb.assignOrderToProject(orderId, projectId);
      
      if (success) {
        console.log('✅ 訂單分配成功');
        res.json({
          success: true,
          message: `訂單已分配到專案「${project.projectName}」`,
          data: {
            orderId,
            projectId,
            projectName: project.projectName
          }
        });
      } else {
        console.error('❌ 訂單分配失敗');
        res.status(500).json({
          success: false,
          message: '分配訂單到專案失敗'
        });
      }

    } catch (error: any) {
      console.error('❌ 分配訂單到專案錯誤:', error);
      res.status(500).json({
        success: false,
        message: '服務器錯誤',
        error: error.message
      });
    }
  }

  // 移除訂單的專案關聯
  static async removeOrderFromProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: orderId } = req.params;

      console.log('🗑️ 移除訂單專案關聯:', orderId);

      // 驗證輸入
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: '訂單ID是必需的'
        });
      }

      // 檢查訂單是否存在
      const order = await memoryDb.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '找不到指定的訂單'
        });
      }

      // 移除訂單的專案關聯
      const success = await memoryDb.removeOrderFromProject(orderId);
      
      if (success) {
        console.log('✅ 訂單專案關聯移除成功');
        res.json({
          success: true,
          message: '訂單已移除專案關聯',
          data: {
            orderId
          }
        });
      } else {
        console.error('❌ 移除訂單專案關聯失敗');
        res.status(500).json({
          success: false,
          message: '移除訂單專案關聯失敗'
        });
      }

    } catch (error: any) {
      console.error('❌ 移除訂單專案關聯錯誤:', error);
      res.status(500).json({
        success: false,
        message: '服務器錯誤',
        error: error.message
      });
    }
  }
}