import React, { useState, useEffect } from 'react';
import { Project } from '../../types';
import { projectService } from '../../services/projectService';
import './ProjectSelector.css';

interface ProjectSelectorProps {
  selectedProjectId?: string;
  onProjectSelect: (projectId: string, projectName: string) => void;
  onNewProject: (projectName: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  selectedProjectId,
  onProjectSelect,
  onNewProject,
  disabled = false,
  placeholder = "選擇專案或創建新專案"
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getAllProjects();
      
      if (response.success && Array.isArray(response.data)) {
        // 只顯示活躍的專案
        const activeProjects = response.data.filter(p => p.overallStatus === 'ACTIVE');
        setProjects(activeProjects);
      } else {
        setError(response.message || '載入專案失敗');
      }
    } catch (error: any) {
      console.error('載入專案失敗:', error);
      setError('載入專案失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (value === 'new') {
      setShowNewProjectInput(true);
      setNewProjectName('');
    } else if (value) {
      const project = projects.find(p => p.id === value);
      if (project) {
        onProjectSelect(value, project.projectName);
      }
    }
  };

  const handleCreateNewProject = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      console.log('🏗️ ProjectSelector 創建新專案:', newProjectName.trim());
      
      const response = await projectService.createProject({
        projectName: newProjectName.trim(),
        description: `由專案選擇器創建的專案`
      });
      
      if (response.success && response.data) {
        console.log('✅ ProjectSelector 專案創建成功:', response.data);
        
        const project = response.data as Project;
        
        // 添加到專案列表
        setProjects(prev => [project, ...prev]);
        
        // 選中新創建的專案
        onProjectSelect(project.id, project.projectName);
        
        // 重置輸入狀態
        setShowNewProjectInput(false);
        setNewProjectName('');
        
        console.log('✅ 專案選擇器狀態已更新');
      } else {
        console.error('❌ ProjectSelector 專案創建失敗:', response.message);
        alert(`專案創建失敗: ${response.message}`);
      }
    } catch (error: any) {
      console.error('❌ ProjectSelector 專案創建錯誤:', error);
      alert(`專案創建失敗: ${error.message}`);
    }
  };

  const handleCancelNewProject = () => {
    setShowNewProjectInput(false);
    setNewProjectName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateNewProject();
    } else if (e.key === 'Escape') {
      handleCancelNewProject();
    }
  };

  if (loading) {
    return (
      <div className="project-selector loading">
        <div className="loading-spinner"></div>
        <span>載入專案中...</span>
      </div>
    );
  }

  return (
    <div className="project-selector">
      <label className="project-selector-label">
        專案選擇 <span className="optional">(可選)</span>
      </label>
      
      {error && (
        <div className="error-message">
          {error}
          <button 
            className="retry-btn"
            onClick={loadProjects}
          >
            重試
          </button>
        </div>
      )}

      {showNewProjectInput ? (
        <div className="new-project-input">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="輸入新專案名稱"
            maxLength={50}
            autoFocus
            disabled={disabled}
            className="project-name-input"
          />
          <div className="new-project-actions">
            <button
              type="button"
              onClick={handleCreateNewProject}
              disabled={!newProjectName.trim() || disabled}
              className="btn btn-primary btn-sm"
            >
              創建
            </button>
            <button
              type="button"
              onClick={handleCancelNewProject}
              disabled={disabled}
              className="btn btn-secondary btn-sm"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <select
          value={selectedProjectId || ''}
          onChange={handleProjectChange}
          disabled={disabled}
          className="project-select"
        >
          <option value="">{placeholder}</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              📁 {project.projectName}
            </option>
          ))}
          <option value="new">+ 創建新專案</option>
        </select>
      )}

      {selectedProjectId && (
        <div className="selected-project-info">
          <span className="selected-project-label">已選擇專案：</span>
          <span className="selected-project-name">
            {projects.find(p => p.id === selectedProjectId)?.projectName || '未知專案'}
          </span>
        </div>
      )}
    </div>
  );
};