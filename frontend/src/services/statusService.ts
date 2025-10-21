import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';

export interface StatusUpdate {
  id: string;
  projectId: string;
  updatedBy: string;
  statusType: 'ORDER' | 'PICKUP' | 'DELIVERY' | 'CHECK';
  statusValue: string;
  additionalData?: Record<string, any>;
  createdAt: string;
}

export interface ProjectStatusHistory {
  project: {
    id: string;
    orderId: string;
    projectName: string;
    overallStatus: string;
    createdAt: string;
    updatedAt: string;
  };
  statusHistory: Array<StatusUpdate & {
    user: {
      username: string;
      role: string;
    };
  }>;
  latestStatuses: {
    ORDER: StatusUpdate | null;
    PICKUP: StatusUpdate | null;
    DELIVERY: StatusUpdate | null;
    CHECK: StatusUpdate | null;
  };
}

export interface OrderStatusData {
  primaryStatus: string;
  secondaryStatus: string;
}

export interface PickupStatusData {
  primaryStatus: 'Picked' | 'Failed';
  secondaryStatus: string;
}

export interface DeliveryStatusData {
  status: string;
  time?: string;
  address?: string;
  po?: string;
  deliveredBy?: string;
}

export interface CheckStatusData {
  status: string;
}

class StatusService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Update order status (叫貨)
  async updateOrderStatus(orderId: string, statusData: OrderStatusData): Promise<StatusUpdate> {
    const response = await this.makeRequest<StatusUpdate>(
      `/status/orders/${orderId}/status/order`,
      {
        method: 'PUT',
        body: JSON.stringify(statusData),
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to update order status');
    }

    return response.data!;
  }

  // Update pickup status (取貨)
  async updatePickupStatus(orderId: string, statusData: PickupStatusData): Promise<StatusUpdate> {
    const response = await this.makeRequest<StatusUpdate>(
      `/status/orders/${orderId}/status/pickup`,
      {
        method: 'PUT',
        body: JSON.stringify(statusData),
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to update pickup status');
    }

    return response.data!;
  }

  // Update delivery status (到案)
  async updateDeliveryStatus(orderId: string, statusData: DeliveryStatusData): Promise<StatusUpdate> {
    const response = await this.makeRequest<StatusUpdate>(
      `/status/orders/${orderId}/status/delivery`,
      {
        method: 'PUT',
        body: JSON.stringify(statusData),
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to update delivery status');
    }

    return response.data!;
  }

  // Update check status (點收)
  async updateCheckStatus(orderId: string, statusData: CheckStatusData): Promise<StatusUpdate> {
    const response = await this.makeRequest<StatusUpdate>(
      `/status/orders/${orderId}/status/check`,
      {
        method: 'PUT',
        body: JSON.stringify(statusData),
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to update check status');
    }

    return response.data!;
  }

  // Get project status history
  async getProjectStatusHistory(projectId: string): Promise<ProjectStatusHistory> {
    const response = await this.makeRequest<ProjectStatusHistory>(
      `/status/projects/${projectId}/status`
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to get project status history');
    }

    return response.data!;
  }

  // Get status statistics
  async getStatusStatistics(): Promise<{
    total: number;
    byType: Record<string, number>;
    recentUpdates: number;
  }> {
    const response = await this.makeRequest<{
      total: number;
      byType: Record<string, number>;
      recentUpdates: number;
    }>('/status/statistics');

    if (!response.success) {
      throw new Error(response.message || 'Failed to get status statistics');
    }

    return response.data!;
  }

  // Get all status updates with filtering
  async getStatusUpdates(params: {
    page?: number;
    limit?: number;
    statusType?: string;
    projectId?: string;
    updatedBy?: string;
  } = {}): Promise<{
    updates: StatusUpdate[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await this.makeRequest<{
      updates: StatusUpdate[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/status/updates?${queryParams.toString()}`);

    if (!response.success) {
      throw new Error(response.message || 'Failed to get status updates');
    }

    return response.data!;
  }

  // Generic status update method
  async updateProjectStatus(
    projectId: string,
    statusType: 'ORDER' | 'PICKUP' | 'DELIVERY' | 'CHECK',
    statusValue: string,
    additionalData?: Record<string, any>
  ): Promise<StatusUpdate> {
    const response = await this.makeRequest<StatusUpdate>(
      `/projects/${projectId}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({
          statusType,
          statusValue,
          additionalData,
        }),
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to update project status');
    }

    return response.data!;
  }

  // Parse status value for display
  parseStatusValue(statusType: string, statusValue: string): {
    primary: string;
    secondary?: string;
  } {
    switch (statusType) {
      case 'ORDER':
        if (statusValue.includes(' - ')) {
          const [primary, secondary] = statusValue.split(' - ');
          return { primary, secondary };
        }
        return { primary: statusValue };

      case 'PICKUP':
        if (statusValue.includes(' ')) {
          const parts = statusValue.split(' ');
          const primary = parts[0];
          const secondary = parts.slice(1).join(' ');
          return { primary, secondary };
        }
        return { primary: statusValue };

      case 'DELIVERY':
      case 'CHECK':
      default:
        return { primary: statusValue };
    }
  }

  // Format status for display
  formatStatusDisplay(statusType: string, statusValue: string): string {
    if (!statusValue) return '未設定';

    const parsed = this.parseStatusValue(statusType, statusValue);
    
    if (parsed.secondary) {
      return `${parsed.primary} - ${parsed.secondary}`;
    }
    
    return parsed.primary;
  }

  // Get status type display name
  getStatusTypeDisplayName(statusType: string): string {
    const displayNames: Record<string, string> = {
      ORDER: '叫貨',
      PICKUP: '取貨',
      DELIVERY: '到案',
      CHECK: '點收',
    };

    return displayNames[statusType] || statusType;
  }

  // Get status color based on type
  getStatusTypeColor(statusType: string): string {
    const colors: Record<string, string> = {
      ORDER: '#3498db',
      PICKUP: '#e67e22',
      DELIVERY: '#27ae60',
      CHECK: '#9b59b6',
    };

    return colors[statusType] || '#95a5a6';
  }
}

export const statusService = new StatusService();