import { pool } from '../config/database';
import { memoryDb } from '../config/memory-database';
import { StatusUpdate, StatusUpdateEntity, StatusType } from '../types';
import Joi from 'joi';

// Helper function to validate UUID or memory database ID format
const isValidId = (id: string): boolean => {
    // UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // Memory database ID format (e.g., user-1, project-1, material-1)
    const memoryIdRegex = /^(user|project|material|order|item|id)-\d+$/;
    // Demo user ID format (e.g., demo-warehouse001, demo-admin)
    const demoIdRegex = /^demo-\w+$/;
    
    return uuidRegex.test(id) || memoryIdRegex.test(id) || demoIdRegex.test(id);
};

// Validation schemas
export const createStatusUpdateSchema = Joi.object({
    projectId: Joi.string()
        .custom((value, helpers) => {
            if (!isValidId(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        })
        .required()
        .messages({
            'any.invalid': 'Project ID must be a valid UUID or memory database ID',
            'any.required': 'Project ID is required'
        }),
    updatedBy: Joi.string()
        .custom((value, helpers) => {
            if (!isValidId(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        })
        .required()
        .messages({
            'any.invalid': 'Updated by must be a valid UUID or memory database ID',
            'any.required': 'Updated by is required'
        }),
    statusType: Joi.string()
        .valid('ORDER', 'PICKUP', 'DELIVERY', 'CHECK')
        .required()
        .messages({
            'any.only': 'Status type must be one of: ORDER, PICKUP, DELIVERY, CHECK',
            'any.required': 'Status type is required'
        }),
    statusValue: Joi.string()
        .max(100)
        .allow('')
        .required()
        .messages({
            'string.max': 'Status value cannot exceed 100 characters',
            'any.required': 'Status value is required'
        }),
    additionalData: Joi.object()
        .pattern(Joi.string(), Joi.any())
        .messages({
            'object.base': 'Additional data must be an object'
        })
});

// Specific validation for delivery status additional data
export const deliveryAdditionalDataSchema = Joi.object({
    time: Joi.string()
        .required()
        .messages({
            'any.required': 'Delivery time is required'
        }),
    address: Joi.string()
        .required()
        .messages({
            'any.required': 'Delivery address is required'
        }),
    po: Joi.string()
        .required()
        .messages({
            'any.required': 'P.O is required'
        }),
    deliveredBy: Joi.string()
        .required()
        .messages({
            'any.required': 'Delivered by is required'
        })
});

export class StatusUpdateModel {
    // Convert database entity to domain model
    private static entityToModel(entity: StatusUpdateEntity): StatusUpdate {
        return {
            id: entity.id,
            projectId: entity.project_id,
            updatedBy: entity.updated_by,
            statusType: entity.status_type,
            statusValue: entity.status_value,
            additionalData: entity.additional_data || undefined,
            createdAt: entity.created_at
        };
    }

    // Create a new status update
    static async create(statusUpdateData: {
        projectId: string;
        updatedBy: string;
        statusType: StatusType;
        statusValue: string;
        additionalData?: Record<string, any>;
    }): Promise<StatusUpdate> {
        // Validate input
        const { error, value } = createStatusUpdateSchema.validate(statusUpdateData);
        if (error) {
            throw new Error(`Validation error: ${error.details[0].message}`);
        }

        const { projectId, updatedBy, statusType, statusValue, additionalData } = value;

        // Additional validation for delivery status
        if (statusType === 'DELIVERY' && statusValue === 'Delivered' && additionalData) {
            const { error: deliveryError } = deliveryAdditionalDataSchema.validate(additionalData);
            if (deliveryError) {
                throw new Error(`Delivery data validation error: ${deliveryError.details[0].message}`);
            }
        }

        try {
            // 嘗試使用內存數據庫
            return await memoryDb.createStatusUpdate({
                projectId,
                updatedBy,
                statusType,
                statusValue,
                additionalData
            });
        } catch (error) {
            console.warn('Memory database failed, trying PostgreSQL:', error);
            
            // 回退到 PostgreSQL
            const query = `
              INSERT INTO status_updates (project_id, updated_by, status_type, status_value, additional_data)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING *
            `;

            const result = await pool.query(query, [
                projectId,
                updatedBy,
                statusType,
                statusValue,
                additionalData ? JSON.stringify(additionalData) : null
            ]);

            return this.entityToModel(result.rows[0]);
        }
    }

    // Find status update by ID
    static async findById(id: string): Promise<StatusUpdate | null> {
        const query = 'SELECT * FROM status_updates WHERE id = $1';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return null;
        }

        return this.entityToModel(result.rows[0]);
    }

    // Get all status updates for a project
    static async findByProjectId(projectId: string): Promise<StatusUpdate[]> {
        const query = `
      SELECT * FROM status_updates 
      WHERE project_id = $1 
      ORDER BY created_at ASC
    `;

        const result = await pool.query(query, [projectId]);
        return result.rows.map((row: any) => this.entityToModel(row));
    }

    // Get latest status update for each type for a project
    static async getLatestStatusesByProject(projectId: string): Promise<Record<StatusType, StatusUpdate | null>> {
        try {
            // 嘗試使用內存數據庫
            const statusUpdates = await memoryDb.getStatusUpdatesByProject(projectId);
            
            const statuses: Record<StatusType, StatusUpdate | null> = {
                ORDER: null,
                PICKUP: null,
                DELIVERY: null,
                CHECK: null
            };

            // 為每種狀態類型找到最新的更新
            statusUpdates.forEach(update => {
                if (!statuses[update.statusType] || 
                    new Date(update.createdAt) > new Date(statuses[update.statusType]!.createdAt)) {
                    statuses[update.statusType] = update;
                }
            });

            return statuses;
        } catch (error) {
            console.warn('Memory database failed, trying PostgreSQL:', error);
            
            // 回退到 PostgreSQL
            const query = `
              SELECT DISTINCT ON (status_type) *
              FROM status_updates 
              WHERE project_id = $1 
              ORDER BY status_type, created_at DESC
            `;

            const result = await pool.query(query, [projectId]);

            const statuses: Record<StatusType, StatusUpdate | null> = {
                ORDER: null,
                PICKUP: null,
                DELIVERY: null,
                CHECK: null
            };

            result.rows.forEach((row: any) => {
                statuses[row.status_type as StatusType] = this.entityToModel(row);
            });

            return statuses;
        }
    }

    // Get status updates by type
    static async findByStatusType(
        statusType: StatusType,
        page: number = 1,
        limit: number = 10
    ): Promise<{ updates: StatusUpdate[], total: number }> {
        const offset = (page - 1) * limit;

        const countQuery = 'SELECT COUNT(*) FROM status_updates WHERE status_type = $1';
        const dataQuery = `
      SELECT * FROM status_updates 
      WHERE status_type = $1
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;

        const [countResult, dataResult] = await Promise.all([
            pool.query(countQuery, [statusType]),
            pool.query(dataQuery, [statusType, limit, offset])
        ]);

        return {
            updates: dataResult.rows.map((row: any) => this.entityToModel(row)),
            total: parseInt(countResult.rows[0].count)
        };
    }

    // Get status updates by user
    static async findByUserId(
        userId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{ updates: StatusUpdate[], total: number }> {
        const offset = (page - 1) * limit;

        const countQuery = 'SELECT COUNT(*) FROM status_updates WHERE updated_by = $1';
        const dataQuery = `
      SELECT * FROM status_updates 
      WHERE updated_by = $1
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;

        const [countResult, dataResult] = await Promise.all([
            pool.query(countQuery, [userId]),
            pool.query(dataQuery, [userId, limit, offset])
        ]);

        return {
            updates: dataResult.rows.map((row: any) => this.entityToModel(row)),
            total: parseInt(countResult.rows[0].count)
        };
    }

    // Get all status updates with filtering and pagination
    static async findAll(
        filters: {
            projectId?: string;
            statusType?: StatusType;
            updatedBy?: string;
            dateFrom?: Date;
            dateTo?: Date;
        } = {},
        page: number = 1,
        limit: number = 10
    ): Promise<{ updates: StatusUpdate[], total: number }> {
        const offset = (page - 1) * limit;

        // Build WHERE clause dynamically
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (filters.projectId) {
            conditions.push(`project_id = $${paramIndex++}`);
            values.push(filters.projectId);
        }

        if (filters.statusType) {
            conditions.push(`status_type = $${paramIndex++}`);
            values.push(filters.statusType);
        }

        if (filters.updatedBy) {
            conditions.push(`updated_by = $${paramIndex++}`);
            values.push(filters.updatedBy);
        }

        if (filters.dateFrom) {
            conditions.push(`created_at >= $${paramIndex++}`);
            values.push(filters.dateFrom);
        }

        if (filters.dateTo) {
            conditions.push(`created_at <= $${paramIndex++}`);
            values.push(filters.dateTo);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const countQuery = `SELECT COUNT(*) FROM status_updates ${whereClause}`;
        const dataQuery = `
      SELECT * FROM status_updates 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

        const [countResult, dataResult] = await Promise.all([
            pool.query(countQuery, values),
            pool.query(dataQuery, [...values, limit, offset])
        ]);

        return {
            updates: dataResult.rows.map((row: any) => this.entityToModel(row)),
            total: parseInt(countResult.rows[0].count)
        };
    }

    // Get status updates with user details
    static async findWithUserDetails(
        projectId: string
    ): Promise<(StatusUpdate & { user: { username: string; role: string } })[]> {
        const query = `
      SELECT 
        su.*,
        u.username,
        u.role
      FROM status_updates su
      JOIN users u ON su.updated_by = u.id
      WHERE su.project_id = $1
      ORDER BY su.created_at ASC
    `;

        const result = await pool.query(query, [projectId]);

        return result.rows.map((row: any) => ({
            ...this.entityToModel({
                id: row.id,
                project_id: row.project_id,
                updated_by: row.updated_by,
                status_type: row.status_type,
                status_value: row.status_value,
                additional_data: row.additional_data,
                created_at: row.created_at
            }),
            user: {
                username: row.username,
                role: row.role
            }
        }));
    }

    // Delete status update
    static async delete(id: string): Promise<boolean> {
        const query = 'DELETE FROM status_updates WHERE id = $1';
        const result = await pool.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    }

    // Check if status update exists
    static async exists(id: string): Promise<boolean> {
        const query = 'SELECT 1 FROM status_updates WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows.length > 0;
    }

    // Get status update statistics
    static async getStatistics(): Promise<{
        total: number;
        byType: Record<StatusType, number>;
        recentUpdates: number;
    }> {
        const totalQuery = 'SELECT COUNT(*) as total FROM status_updates';
        const byTypeQuery = `
      SELECT 
        status_type,
        COUNT(*) as count
      FROM status_updates 
      GROUP BY status_type
    `;
        const recentQuery = `
      SELECT COUNT(*) as recent 
      FROM status_updates 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `;

        const [totalResult, byTypeResult, recentResult] = await Promise.all([
            pool.query(totalQuery),
            pool.query(byTypeQuery),
            pool.query(recentQuery)
        ]);

        const byType: Record<StatusType, number> = {
            ORDER: 0,
            PICKUP: 0,
            DELIVERY: 0,
            CHECK: 0
        };

        byTypeResult.rows.forEach((row: any) => {
            byType[row.status_type as StatusType] = parseInt(row.count);
        });

        return {
            total: parseInt(totalResult.rows[0].total),
            byType,
            recentUpdates: parseInt(recentResult.rows[0].recent)
        };
    }

    // Validate status transition rules
    static validateStatusTransition(
        statusType: StatusType,
        _currentValue: string | null,
        newValue: string
    ): { valid: boolean; message?: string } {
        switch (statusType) {
            case 'ORDER':
                // Order status can be updated freely
                return { valid: true };

            case 'PICKUP':
                // Pickup status validation
                const validPickupValues = ['Picked', 'Failed'];
                if (!validPickupValues.includes(newValue)) {
                    return { valid: false, message: 'Invalid pickup status value' };
                }
                return { valid: true };

            case 'DELIVERY':
                // Delivery status validation
                if (newValue === 'Delivered' || newValue === '') {
                    return { valid: true };
                }
                return { valid: false, message: 'Invalid delivery status value' };

            case 'CHECK':
                // Check status validation
                const validCheckValues = ['Check and sign(C.B/PM)', '(C.B)', 'WH)', ''];
                if (!validCheckValues.includes(newValue)) {
                    return { valid: false, message: 'Invalid check status value' };
                }
                return { valid: true };

            default:
                return { valid: false, message: 'Invalid status type' };
        }
    }
}