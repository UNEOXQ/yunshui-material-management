import { Project } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';

export interface ProjectResponse {
  success: boolean;
  data?: Project | Project[];
  message?: string;
}

export interface CreateProjectRequest {
  projectName: string;
  description?: string;
}

export interface UpdateProjectRequest {
  projectName?: string;
  description?: string;
  overallStatus?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

class ProjectService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // 獲取所有專案
  async getAllProjects(): Promise<ProjectResponse> {
    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '獲取專案列表失敗');
      }

      return result;
    } catch (error: any) {
      console.error('獲取專案列表失敗:', error);
      return {
        success: false,
        message: error.message || '獲取專案列表失敗'
      };
    }
  }

  // 創建新專案
  async createProject(projectData: CreateProjectRequest): Promise<ProjectResponse> {
    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(projectData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '創建專案失敗');
      }

      return result;
    } catch (error: any) {
      console.error('創建專案失敗:', error);
      return {
        success: false,
        message: error.message || '創建專案失敗'
      };
    }
  }

  // 更新專案
  async updateProject(projectId: string, updateData: UpdateProjectRequest): Promise<ProjectResponse> {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '更新專案失敗');
      }

      return result;
    } catch (error: any) {
      console.error('更新專案失敗:', error);
      return {
        success: false,
        message: error.message || '更新專案失敗'
      };
    }
  }

  // 獲取專案下的所有訂單
  async getProjectOrders(projectId: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/orders`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '獲取專案訂單失敗');
      }

      return result;
    } catch (error: any) {
      console.error('獲取專案訂單失敗:', error);
      return {
        success: false,
        message: error.message || '獲取專案訂單失敗'
      };
    }
  }

  // 刪除專案
  async deleteProject(projectId: string): Promise<ProjectResponse> {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '刪除專案失敗');
      }

      return result;
    } catch (error: any) {
      console.error('刪除專案失敗:', error);
      return {
        success: false,
        message: error.message || '刪除專案失敗'
      };
    }
  }
}

export const projectService = new ProjectService();