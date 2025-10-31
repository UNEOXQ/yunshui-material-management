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
  const projectsPerPage = 8; // 每頁顯示的專案數量

  useEffect(() => {
    loadProjects();
  }, []);

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
        console.log('✅ 專案列表載入成功:', activeProjects.length, '個專案');
        console.log('📋 專案列表:', activeProjects.map(p => ({ id: p.id, name: p.projectName })));
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
          alert(`刪除失敗: ${response.message}`);
        }
      } catch (error: any) {
        console.error('刪除專案失敗:', error);
        alert(`刪除失敗: ${error.message}`);
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
        
        // 更新本地專案列表
        setProjects(prev => [newProject, ...prev]);
        
        // 重置輸入狀態
        setNewProjectName('');
        setShowCreateInput(false);
        
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

  if (projects.length === 0) {
    return (
      <div className={`project-tags ${className}`}>
        <span className="no-projects-text">尚無專案</span>
      </div>
    );
  }

  return (
    <div className={`project-tags ${className}`}>
      <div className="project-tags-header">
        <button
          className={`project-tag all-tag ${!selectedProjectId ? 'active' : ''}`}
          onClick={handleShowAll}
        >
          全部訂單
        </button>
        
        {showPagination && (
          <div className="pagination-info">
            第 {currentPage + 1} 頁，共 {totalPages} 頁
          </div>
        )}
      </div>
      
      <div className="project-tags-content">
        {currentProjects.map(project => (
          <button
            key={project.id}
            className={`project-tag ${selectedProjectId === project.id ? 'active' : ''}`}
            onClick={() => handleTagClick(project.id)}
            title={`專案：${project.projectName}`}
          >
            📁 {project.projectName}
            {showManagementButtons && (
              <span
                className="project-delete-btn"
                onClick={(e) => handleDeleteProject(e, project.id)}
                title={`刪除專案「${project.projectName}」`}
              >
                ×
              </span>
            )}
          </button>
        ))}
        
        {showManagementButtons && (
          <>
            {showCreateInput ? (
              <div className="project-create-input">
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
                  onClick={handleCancelCreate}
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                className="project-tag create-tag"
                onClick={() => setShowCreateInput(true)}
                title="創建新專案"
              >
                + 新專案
              </button>
            )}
          </>
        )}
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