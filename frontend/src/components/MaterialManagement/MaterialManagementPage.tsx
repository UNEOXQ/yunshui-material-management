import React, { useState, useEffect } from 'react';
import { Material } from '../../types';
import { MaterialList } from './MaterialList';
import { MaterialForm } from './MaterialForm';
import { MaterialFilters } from './MaterialFilters';
import { materialService, MaterialFilters as FilterType } from '../../services/materialService';
import './MaterialManagement.css';

export const MaterialManagementPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  
  // Filter state
  const [filters, setFilters] = useState<FilterType>({});

  useEffect(() => {
    loadMaterials();
  }, [currentPage, filters]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      console.log('Loading materials...');
      const response = await materialService.getAllMaterials(filters, currentPage, itemsPerPage);
      if (response.success && response.data) {
        console.log('Materials loaded:', response.data.materials.length, 'items');
        console.log('Materials with images:', response.data.materials.filter(m => m.imageUrl).map(m => ({ id: m.id, name: m.name, imageUrl: m.imageUrl })));
        setMaterials(response.data.materials);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.total);
      } else {
        setError(response.message || '載入材料失敗');
      }
    } catch (err) {
      setError('載入材料時發生錯誤');
      console.error('Error loading materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = () => {
    setSelectedMaterial(null);
    setIsFormOpen(true);
  };

  const handleEditMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setIsFormOpen(true);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!window.confirm('確定要刪除此材料嗎？')) {
      return;
    }

    try {
      const response = await materialService.deleteMaterial(materialId);
      if (response.success) {
        setMaterials(materials.filter(material => material.id !== materialId));
        // If current page becomes empty and it's not the first page, go to previous page
        if (materials.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          loadMaterials();
        }
      } else {
        setError(response.message || '刪除材料失敗');
      }
    } catch (err) {
      setError('刪除材料時發生錯誤');
      console.error('Error deleting material:', err);
    }
  };

  const handleFormSubmit = async (materialData: any) => {
    try {
      if (selectedMaterial) {
        // Update existing material
        const response = await materialService.updateMaterial(selectedMaterial.id, materialData);
        if (response.success && response.data) {
          setMaterials(materials.map(material => 
            material.id === selectedMaterial.id ? response.data! : material
          ));
          setIsFormOpen(false);
          setSelectedMaterial(null);
        } else {
          setError(response.message || '更新材料失敗');
        }
      } else {
        // Create new material
        const response = await materialService.createMaterial(materialData);
        if (response.success && response.data) {
          // Refresh the list to show the new material
          loadMaterials();
          setIsFormOpen(false);
          setSelectedMaterial(null);
        } else {
          setError(response.message || '建立材料失敗');
        }
      }
    } catch (err) {
      setError('操作時發生錯誤');
      console.error('Error submitting form:', err);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedMaterial(null);
  };

  const handleFiltersChange = (newFilters: FilterType) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleQuantityUpdate = async (materialId: string, newQuantity: number) => {
    try {
      const response = await materialService.updateQuantity(materialId, newQuantity);
      if (response.success && response.data) {
        setMaterials(materials.map(material => 
          material.id === materialId ? response.data! : material
        ));
      } else {
        setError(response.message || '更新數量失敗');
      }
    } catch (err) {
      setError('更新數量時發生錯誤');
      console.error('Error updating quantity:', err);
    }
  };

  if (loading && materials.length === 0) {
    return (
      <div className="material-management-page">
        <div className="loading">載入中...</div>
      </div>
    );
  }

  return (
    <div className="material-management-page">
      <div className="page-header">
        <h1>材料管理</h1>
        <button 
          className="btn btn-primary"
          onClick={handleCreateMaterial}
        >
          新增材料
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button 
            className="btn-close"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      <MaterialFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        loading={loading}
      />

      <div className="materials-summary">
        <span>共 {totalItems} 項材料</span>
        {Object.keys(filters).some(key => filters[key as keyof FilterType]) && (
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => handleFiltersChange({})}
          >
            清除篩選
          </button>
        )}
      </div>

      <MaterialList
        materials={materials}
        onEditMaterial={handleEditMaterial}
        onDeleteMaterial={handleDeleteMaterial}
        onQuantityUpdate={handleQuantityUpdate}
        onRefresh={loadMaterials}
        loading={loading}
      />

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            上一頁
          </button>
          
          <div className="page-info">
            第 {currentPage} 頁，共 {totalPages} 頁
          </div>
          
          <button
            className="btn btn-secondary"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            下一頁
          </button>
        </div>
      )}

      {isFormOpen && (
        <MaterialForm
          material={selectedMaterial}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};