import React, { useState } from 'react';
import StatusManagementDemo from './StatusManagementDemo';
import './StatusManagement.css';

interface StatusManagementPageWrapperProps {
  title: string;
  onBack: () => void;
  statusType: 'order' | 'pickup' | 'delivery' | 'check';
}

const StatusManagementPageWrapper: React.FC<StatusManagementPageWrapperProps> = ({ 
  title, 
  onBack, 
  statusType 
}) => {
  // 使用一個示例專案 ID，在真實應用中這應該來自路由參數或選擇
  const [selectedProjectId, setSelectedProjectId] = useState<string>('project-1');
  const [availableProjects] = useState([
    { id: 'project-1', name: '雲水基材專案 A', status: '進行中' },
    { id: 'project-2', name: '雲水基材專案 B', status: '進行中' },
    { id: 'project-3', name: '雲水基材專案 C', status: '已完成' }
  ]);

  const getStatusTypeDescription = (type: string) => {
    switch (type) {
      case 'order':
        return '管理專案的叫貨狀態，包含 Ordered 狀態和處理進度';
      case 'pickup':
        return '管理專案的取貨狀態，包含 Picked/Failed 狀態和結果代碼';
      case 'delivery':
        return '管理專案的到案狀態，包含交付時間、地址、P.O 編號等詳細資訊';
      case 'check':
        return '管理專案的點收狀態，完成後專案將標記為完成狀態';
      default:
        return '狀態管理功能';
    }
  };

  return (
    <div className="status-management-page">
      {/* 頁面標題和導航 */}
      <div className="page-header">
        <div className="header-actions">
          <button onClick={onBack} className="btn btn-secondary">
            ← 返回儀表板
          </button>
        </div>
        <div className="header-content">
          <h1>{title}</h1>
          <p className="page-description">
            {getStatusTypeDescription(statusType)}
          </p>
        </div>
      </div>

      {/* 專案選擇器 */}
      <div className="project-selector">
        <div className="selector-header">
          <h3>選擇專案</h3>
          <p>請選擇要管理狀態的專案</p>
        </div>
        <div className="project-list">
          {availableProjects.map(project => (
            <div 
              key={project.id}
              className={`project-card ${selectedProjectId === project.id ? 'selected' : ''}`}
              onClick={() => setSelectedProjectId(project.id)}
            >
              <div className="project-info">
                <h4>{project.name}</h4>
                <span className={`project-status ${project.status === '已完成' ? 'completed' : 'active'}`}>
                  {project.status}
                </span>
              </div>
              <div className="project-id">
                ID: {project.id}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 狀態管理組件 */}
      {selectedProjectId && (
        <div className="status-management-container">
          <div className="container-header">
            <h3>專案狀態管理</h3>
            <p>當前專案：{availableProjects.find(p => p.id === selectedProjectId)?.name}</p>
          </div>
          
          <StatusManagementDemo projectId={selectedProjectId} />
        </div>
      )}

      {/* 使用說明 */}
      <div className="usage-instructions">
        <h3>使用說明</h3>
        <div className="instructions-grid">
          <div className="instruction-card">
            <h4>🔄 即時更新</h4>
            <p>狀態更新會即時同步到所有連接的用戶端，確保資訊一致性</p>
          </div>
          <div className="instruction-card">
            <h4>📝 操作記錄</h4>
            <p>所有狀態變更都會記錄操作時間和操作人員，提供完整的審計軌跡</p>
          </div>
          <div className="instruction-card">
            <h4>🔐 權限控制</h4>
            <p>只有倉庫管理員可以更新狀態，確保資料安全性</p>
          </div>
          <div className="instruction-card">
            <h4>📊 狀態歷史</h4>
            <p>可以查看完整的狀態變更歷史，追蹤專案進度</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusManagementPageWrapper;