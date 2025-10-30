import React, { useState, useEffect } from 'react';
import { Project } from '../../types';
import { projectService } from '../../services/projectService';

interface SimpleProjectSelectorProps {
  selectedProjectId?: string;
  onProjectSelect: (projectId: string, projectName: string) => void;
  disabled?: boolean;
}

export const SimpleProjectSelector: React.FC<SimpleProjectSelectorProps> = ({
  selectedProjectId,
  onProjectSelect,
  disabled = false
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      console.log('📋 載入專案列表...');
      
      const response = await projectService.getAllProjects();
      
      if (response.success && Array.isArray(response.data)) {
        const activeProjects = response.data.filter(p => p.overallStatus === 'ACTIVE');
        setProjects(activeProjects);
        console.log('✅ 專案列表載入成功:', activeProjects.length, '個專案');
      } else {
        console.error('❌ 載入專案失敗:', response.message);
      }
    } catch (error: any) {
      console.error('❌ 載入專案錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    console.log('📝 專案選擇變更:', value);
    
    if (value === 'new') {
      setShowNewInput(true);
      setNewName('');
    } else if (value) {
      const project = projects.find(p => p.id === value);
      if (project) {
        console.log('✅ 選擇現有專案:', project.projectName);
        onProjectSelect(value, project.projectName);
      }
    }
  };

  const handleCreateProject = async () => {
    if (!newName.trim() || creating) return;
    
    try {
      setCreating(true);
      console.log('🏗️ 創建新專案:', newName.trim());
      
      const response = await projectService.createProject({
        projectName: newName.trim(),
        description: '由訂單創建的專案'
      });
      
      console.log('📡 專案創建 API 響應:', response);
      
      if (response.success && response.data) {
        const project = response.data as Project;
        console.log('✅ 專案創建成功:', project);
        
        // 添加到列表
        setProjects(prev => [project, ...prev]);
        
        // 選中新專案
        onProjectSelect(project.id, project.projectName);
        
        // 重置狀態
        setShowNewInput(false);
        setNewName('');
        
        alert(`專案「${project.projectName}」創建成功！`);
      } else {
        console.error('❌ 專案創建失敗:', response.message);
        alert(`專案創建失敗: ${response.message}`);
      }
    } catch (error: any) {
      console.error('❌ 專案創建錯誤:', error);
      alert(`專案創建失敗: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    setShowNewInput(false);
    setNewName('');
  };

  if (loading) {
    return <div>載入專案中...</div>;
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
        專案選擇 <span style={{ color: '#666', fontWeight: '400' }}>(可選)</span>
      </label>
      
      {showNewInput ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="輸入新專案名稱"
            maxLength={50}
            disabled={disabled || creating}
            autoFocus
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateProject();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCreateProject}
              disabled={!newName.trim() || disabled || creating}
              style={{
                padding: '6px 12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: creating ? 'not-allowed' : 'pointer'
              }}
            >
              {creating ? '創建中...' : '創建'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={disabled || creating}
              style={{
                padding: '6px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <select
          value={selectedProjectId || ''}
          onChange={handleSelectChange}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="">選擇專案或創建新專案</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              📁 {project.projectName}
            </option>
          ))}
          <option value="new">+ 創建新專案</option>
        </select>
      )}
      
      {selectedProjectId && !showNewInput && (
        <div style={{ 
          marginTop: '8px', 
          padding: '8px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '4px',
          fontSize: '13px',
          color: '#1976d2'
        }}>
          已選擇：{projects.find(p => p.id === selectedProjectId)?.projectName || '未知專案'}
        </div>
      )}
    </div>
  );
};