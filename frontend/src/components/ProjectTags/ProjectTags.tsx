import React, { useState, useEffect } from 'react';
import { Project } from '../../types';
import { projectService } from '../../services/projectService';
import './ProjectTags.css';

interface ProjectTagsProps {
  selectedProjectId?: string;
  onProjectSelect: (projectId: string | null) => void;
  onProjectDelete?: (projectId: string) => void;
  onProjectCreate?: (projectName: string) => void;
  showManagementButtons?: boolean;
  className?: string;
}

export const ProjectTags: React.FC<ProjectTagsProps> = ({
  selectedProjectId,
  onProjectSelect,
  onProjectDelete,
  onProjectCreate,
  showManagementButtons = false,
  className = ''
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editingProjects, setEditingProjects] = useState<{[key: string]: string}>({});
  const projectsPerPage = 10; // 每頁顯示的專案數量 (2x5 網格)

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getAllProjects();
      
      if (response.success && Array.isArray(response.data)) {
        // 修復過濾邏輯：處理 overallStatus 為 undefined 的情況
        const activeProjects = response.data.filter(p => {
          console.log('🔍 專案檢查:', {
            id: p.id,
            name: p.projectName,
            description: p.description,
            status: p.overallStatus,
            hasDescription: !!p.description,
            descriptionLength: p.description ? p.description.length : 0
          });
          
          // 顯示活躍專案或狀態未定義/空字符串的專案（視為活躍）
          const isActive = p.overallStatus === 'ACTIVE' || !p.overallStatus;
          
          if (!isActive) {
            console.log('❌ 專案被過濾（非活躍）:', p.id, p.overallStatus);
            return false;
          }
          
          // 簡化的過濾邏輯：只過濾明確的自動生成專案
          const isUnmodifiedAutoProject = (
            (p.projectName && (p.projectName.startsWith('輔材專案-') || p.projectName.startsWith('成品專案-'))) &&
            (!p.description || p.description === '' || p.description === '自動創建的專案')
          );
          
          const willShow = !isUnmodifiedAutoProject;
          console.log('🎯 專案過濾結果:', {
            id: p.id,
            isUnmodifiedAutoProject,
            willShow
          });
          
          return willShow;
        });
        
        setProjects(activeProjects);
        console.log('✅ 專案列表載入成功:', activeProjects.length, '個專案');
        console.log('📋 專案列表:', activeProjects.map(p => ({ id: p.id, name: p.projectName, desc: p.description })));
        console.log('🔧 showManagementButtons:', showManagementButtons);
      }
    } catch (error) {
      console.error('載入專案失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = (projectId: string) => {
    if (selectedProjectId === projectId) {
      // 如果點擊已選中的標籤，取消選擇
      onProjectSelect(null);
    } else {
      // 選擇新的專案
      onProjectSelect(projectId);
    }
  };

  const handleShowAll = () => {
    onProjectSelect(null);
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation(); // 防止觸發標籤點擊
    
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    // 檢查是否為未修改的系統自動創建專案
    const isUnmodifiedAutoProject = (
      (project.projectName.startsWith('輔材專案-') || project.projectName.startsWith('成品專案-')) &&
      (!project.description || project.description === '' || project.description === '自動創建的專案')
    );
    
    if (isUnmodifiedAutoProject) {
      alert('系統自動創建的專案無法刪除\n\n提示：如果您已經重命名此專案，請重新整理頁面後再試。');
      return;
    }
    
    if (confirm(`確定要刪除專案「${project.projectName}」嗎？\n\n注意：這不會刪除訂單，只會將訂單從專案中移除。`)) {
      try {
        const response = await projectService.deleteProject(projectId);
        if (response.success) {
          // 更新本地專案列表
          setProjects(prev => prev.filter(p => p.id !== projectId));
          
          // 如果刪除的是當前選中的專案，切換到全部訂單
          if (selectedProjectId === projectId) {
            onProjectSelect(null);
          }
          
          // 通知父組件
          if (onProjectDelete) {
            onProjectDelete(projectId);
          }
          
          alert('專案已刪除，相關訂單已移除專案歸屬');
        } else {
          // 更詳細的錯誤處理
          let errorMessage = response.message || '刪除失敗';
          if (errorMessage.includes('404')) {
            errorMessage = '專案不存在或已被刪除';
          } else if (errorMessage.includes('403')) {
            errorMessage = '沒有權限刪除此專案';
          } else if (errorMessage.includes('400')) {
            errorMessage = '專案可能有關聯的訂單，無法刪除';
          }
          alert(`刪除失敗: ${errorMessage}`);
        }
      } catch (error: any) {
        console.error('刪除專案失敗:', error);
        let errorMessage = error.message || '網路錯誤';
        if (errorMessage.includes('404')) {
          errorMessage = '專案不存在或已被刪除';
        } else if (errorMessage.includes('403')) {
          errorMessage = '沒有權限刪除此專案';
        }
        alert(`刪除失敗: ${errorMessage}`);
      }
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
        description: '手動創建的專案'
      });
      
      if (response.success && response.data) {
        const newProject = response.data as Project;
        
        // 重置輸入狀態
        setNewProjectName('');
        setShowCreateInput(false);
        
        // 重新載入專案列表以確保數據同步
        await loadProjects();
        
        // 通知父組件
        if (onProjectCreate) {
          onProjectCreate(newProject.projectName);
        }
        
        alert(`專案「${newProject.projectName}」創建成功！`);
      } else {
        alert(`創建失敗: ${response.message}`);
      }
    } catch (error: any) {
      console.error('創建專案失敗:', error);
      alert(`創建失敗: ${error.message}`);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateInput(false);
    setNewProjectName('');
  };

  // 編輯模式相關函數
  const handleEditMode = () => {
    if (editMode) {
      // 退出編輯模式，重置編輯狀態
      setEditingProjects({});
    } else {
      // 進入編輯模式，初始化編輯狀態
      const editState: {[key: string]: string} = {};
      currentProjects.forEach(project => {
        editState[project.id] = project.projectName;
      });
      setEditingProjects(editState);
    }
    setEditMode(!editMode);
  };

  const handleProjectNameChange = (projectId: string, newName: string) => {
    setEditingProjects(prev => ({
      ...prev,
      [projectId]: newName
    }));
  };

  const handleSaveProjectName = async (projectId: string) => {
    const newName = editingProjects[projectId]?.trim();
    if (!newName) {
      alert('專案名稱不能為空');
      return;
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    if (newName === project.projectName) {
      // 名稱沒有變化，直接返回
      return;
    }

    try {
      // 確保重命名的專案有描述標記，以便正確顯示
      const updatedDescription = project.description || '用戶重命名的專案';
      
      const response = await projectService.updateProject(projectId, {
        projectName: newName,
        description: updatedDescription
      });

      if (response.success) {
        // 重新載入專案列表以確保數據同步
        await loadProjects();
        
        // 通知父組件專案已更新（但不是創建）
        if (onProjectCreate) {
          onProjectCreate(newName);
        }
        
        alert(`專案名稱已更新為「${newName}」`);
      } else {
        alert(`更新失敗: ${response.message}`);
        // 恢復原始名稱
        setEditingProjects(prev => ({
          ...prev,
          [projectId]: project.projectName
        }));
      }
    } catch (error: any) {
      console.error('更新專案名稱失敗:', error);
      alert(`更新失敗: ${error.message}`);
      // 恢復原始名稱
      setEditingProjects(prev => ({
        ...prev,
        [projectId]: project.projectName
      }));
    }
  };

  // 分頁邏輯
  const totalPages = Math.ceil(projects.length / projectsPerPage);
  const startIndex = currentPage * projectsPerPage;
  const endIndex = startIndex + projectsPerPage;
  const currentProjects = projects.slice(startIndex, endIndex);
  const showPagination = projects.length > projectsPerPage;

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className={`project-tags ${className}`}>
        <span className="loading-text">載入專案中...</span>
      </div>
    );
  }

  if (projects.length === 0 && !loading) {
    return (
      <div className={`project-tags ${className}`}>
        <span className="no-projects-text">尚無專案</span>
      </div>
    );
  }

  return (
    <div className={`project-tags ${className}`}>
      <div className="project-tags-header">
        <div className="header-left">
          <button
            className={`project-tag all-tag ${!selectedProjectId ? 'active' : ''}`}
            onClick={handleShowAll}
          >
            📋 全部
          </button>
          
          {showPagination && (
            <div className="pagination-info">
              第 {currentPage + 1} 頁，共 {totalPages} 頁
            </div>
          )}
        </div>
        
        <div className="header-controls">
          {showManagementButtons && (
            <>
              {showCreateInput ? (
                <div className="header-create-input">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="輸入專案名稱"
                    maxLength={50}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateProject();
                      if (e.key === 'Escape') handleCancelCreate();
                    }}
                    className="header-project-input"
                  />
                  <button
                    className="header-confirm-btn"
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim()}
                  >
                    ✓
                  </button>
                  <button
                    className="header-cancel-btn"
                    onClick={handleCancelCreate}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className="create-project-btn"
                    onClick={() => setShowCreateInput(true)}
                    title="創建新專案"
                  >
                    + 新專案
                  </button>
                  <button
                    className={`edit-mode-btn ${editMode ? 'active' : ''}`}
                    onClick={handleEditMode}
                    title={editMode ? '退出編輯模式' : '編輯專案名稱'}
                  >
                    {editMode ? '✓ 完成' : '✏️ 編輯'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="project-tags-grid">
        {currentProjects.map(project => (
          <div key={project.id} className="project-tag-wrapper">
            {editMode ? (
              <div className="project-edit-item">
                <input
                  type="text"
                  value={editingProjects[project.id] || project.projectName}
                  onChange={(e) => handleProjectNameChange(project.id, e.target.value)}
                  onBlur={() => handleSaveProjectName(project.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveProjectName(project.id);
                    }
                  }}
                  className="project-name-input"
                  maxLength={50}
                />
                {showManagementButtons && (
                  <button
                    className="project-delete-btn-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(e, project.id);
                    }}
                    title={`刪除專案「${project.projectName}」`}
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              <button
                className={`project-tag ${selectedProjectId === project.id ? 'active' : ''}`}
                onClick={() => handleTagClick(project.id)}
                title={`專案：${project.projectName}`}
              >
                <span className="project-icon">📁</span>
                <span className="project-name">{project.projectName}</span>
              </button>
            )}
          </div>
        ))}

      </div>
      
      {showPagination && (
        <div className="project-tags-pagination">
          <button
            className="pagination-btn"
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            title="上一頁"
          >
            ‹
          </button>
          <button
            className="pagination-btn"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            title="下一頁"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};