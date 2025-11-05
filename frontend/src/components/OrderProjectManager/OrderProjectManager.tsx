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
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

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
        // 簡化的過濾邏輯：只過濾明確的自動生成專案
        const activeProjects = response.data.filter(p => {
          if (p.overallStatus !== 'ACTIVE') return false;
          
          // 只過濾完全符合自動生成格式且沒有被修改過的專案
          const isUnmodifiedAutoProject = (
            (p.projectName.startsWith('輔材專案-') || p.projectName.startsWith('成品專案-')) &&
            (!p.description || p.description === '' || p.description === '自動創建的專案')
          );
          
          // 顯示所有非未修改的自動專案
          return !isUnmodifiedAutoProject;
        });
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
      console.log('🔄 開始分配訂單到專案:', { orderId, projectId });
      
      const selectedProject = projects.find(p => p.id === projectId);
      console.log('📋 選中的專案:', selectedProject);
      
      const response = await orderService.assignOrderToProject(orderId, projectId);
      console.log('📡 API 響應:', response);
      
      if (response.success) {
        setShowSelector(false);
        onProjectChange();
        
        const project = projects.find(p => p.id === projectId);
        console.log('✅ 分配成功，專案信息:', project);
        alert(`訂單已歸屬到專案「${project?.projectName}」`);
      } else {
        console.error('❌ 分配失敗:', response.message);
        alert(`歸屬失敗: ${response.message}`);
      }
    } catch (error: any) {
      console.error('❌ 歸屬專案錯誤:', error);
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

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('請輸入專案名稱');
      return;
    }
    
    try {
      const response = await projectService.createProject({
        projectName: newProjectName.trim(),
        description: '從訂單管理創建的專案'
      });
      
      if (response.success && response.data) {
        const newProject = response.data as Project;
        
        // 更新本地專案列表
        setProjects(prev => [newProject, ...prev]);
        
        // 自動將訂單分配到新專案
        await handleProjectAssign(newProject.id);
        
        // 重置狀態
        setNewProjectName('');
        setShowCreateInput(false);
        setShowSelector(false);
        
        // 通知父組件重新載入專案映射
        onProjectChange();
        
        alert(`專案「${newProject.projectName}」創建成功並已分配給此訂單！`);
      } else {
        alert(`創建失敗: ${response.message}`);
      }
    } catch (error: any) {
      console.error('創建專案失敗:', error);
      alert(`創建失敗: ${error.message}`);
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
              <>
                📁 {currentProjectName}
                {currentProjectId && (
                  <span
                    className="remove-project-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProjectRemove();
                    }}
                    title="移除專案歸屬"
                  >
                    ×
                  </span>
                )}
              </>
            ) : (
              <span className="no-project">未歸屬專案</span>
            )}
          </span>
        </div>
      ) : (
        <div className="project-selector">
          {loading ? (
            <div className="loading">載入中...</div>
          ) : showCreateInput ? (
            <div className="create-project-input">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="輸入新專案名稱"
                maxLength={50}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject();
                  if (e.key === 'Escape') {
                    setShowCreateInput(false);
                    setNewProjectName('');
                  }
                }}
              />
              <button
                className="create-confirm-btn"
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
              >
                ✓
              </button>
              <button
                className="create-cancel-btn"
                onClick={() => {
                  setShowCreateInput(false);
                  setNewProjectName('');
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <select
                onChange={(e) => {
                  if (e.target.value === 'CREATE_NEW') {
                    setShowCreateInput(true);
                  } else if (e.target.value) {
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
                <option value="CREATE_NEW">+ 創建新專案</option>
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