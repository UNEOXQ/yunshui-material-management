import React, { useState, useEffect } from 'react';
import { Project } from '../../types';
import { projectService } from '../../services/projectService';
import { orderService } from '../../services/orderService';
import './OrderProjectManager.css';

interface OrderProjectManagerProps {
  orderId: string;
  currentProjectId?: string;
  currentProjectName?: string;
  onProjectChange: () => void;
  disabled?: boolean;
}

export const OrderProjectManager: React.FC<OrderProjectManagerProps> = ({
  orderId,
  currentProjectId,
  currentProjectName,
  onProjectChange,
  disabled = false
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showSelector, setShowSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showSelector) {
      loadProjects();
    }
  }, [showSelector]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getAllProjects();
      
      if (response.success && Array.isArray(response.data)) {
        // 只顯示活躍的專案，並排除自動創建的專案
        const activeProjects = response.data.filter(p => 
          p.overallStatus === 'ACTIVE' && 
          !p.projectName.includes('輔材專案-') &&
          !p.projectName.includes('成品專案-')
        );
        setProjects(activeProjects);
      }
    } catch (error) {
      console.error('載入專案失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectAssign = async (projectId: string) => {
    try {
      const response = await orderService.assignOrderToProject(orderId, projectId);
      
      if (response.success) {
        setShowSelector(false);
        onProjectChange();
        
        const project = projects.find(p => p.id === projectId);
        alert(`訂單已歸屬到專案「${project?.projectName}」`);
      } else {
        alert(`歸屬失敗: ${response.message}`);
      }
    } catch (error: any) {
      console.error('歸屬專案失敗:', error);
      alert(`歸屬失敗: ${error.message}`);
    }
  };

  const handleProjectRemove = async () => {
    if (!confirm('確定要移除此訂單的專案歸屬嗎？')) return;
    
    try {
      const response = await orderService.removeOrderFromProject(orderId);
      
      if (response.success) {
        onProjectChange();
        alert('訂單已移除專案歸屬');
      } else {
        alert(`移除失敗: ${response.message}`);
      }
    } catch (error: any) {
      console.error('移除專案歸屬失敗:', error);
      alert(`移除失敗: ${error.message}`);
    }
  };

  if (disabled) {
    return (
      <div className="order-project-manager disabled">
        <span className="project-info">
          {currentProjectName ? (
            <>📁 {currentProjectName}</>
          ) : (
            <span className="no-project">未歸屬專案</span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="order-project-manager">
      {!showSelector ? (
        <div className="project-display">
          <span 
            className="project-info clickable"
            onClick={() => setShowSelector(true)}
            title="點擊更改專案歸屬"
          >
            {currentProjectName ? (
              <>📁 {currentProjectName}</>
            ) : (
              <span className="no-project">未歸屬專案</span>
            )}
          </span>
          
          {currentProjectId && (
            <button
              className="remove-project-btn"
              onClick={handleProjectRemove}
              title="移除專案歸屬"
            >
              ×
            </button>
          )}
        </div>
      ) : (
        <div className="project-selector">
          {loading ? (
            <div className="loading">載入中...</div>
          ) : (
            <>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleProjectAssign(e.target.value);
                  }
                }}
                defaultValue=""
              >
                <option value="">選擇專案...</option>
                {projects.map(project => (
                  <option 
                    key={project.id} 
                    value={project.id}
                    disabled={project.id === currentProjectId}
                  >
                    {project.projectName}
                    {project.id === currentProjectId ? ' (當前)' : ''}
                  </option>
                ))}
              </select>
              <button
                className="cancel-btn"
                onClick={() => setShowSelector(false)}
              >
                取消
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};