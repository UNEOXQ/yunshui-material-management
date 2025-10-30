import React, { useState, useEffect } from 'react';
import { Project } from '../../types';
import { projectService } from '../../services/projectService';
import './ProjectTags.css';

interface ProjectTagsProps {
  selectedProjectId?: string;
  onProjectSelect: (projectId: string | null) => void;
  className?: string;
}

export const ProjectTags: React.FC<ProjectTagsProps> = ({
  selectedProjectId,
  onProjectSelect,
  className = ''
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

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
      <button
        className={`project-tag all-tag ${!selectedProjectId ? 'active' : ''}`}
        onClick={handleShowAll}
      >
        全部訂單
      </button>
      
      {projects.map(project => (
        <button
          key={project.id}
          className={`project-tag ${selectedProjectId === project.id ? 'active' : ''}`}
          onClick={() => handleTagClick(project.id)}
          title={`專案：${project.projectName}`}
        >
          📁 {project.projectName}
        </button>
      ))}
    </div>
  );
};