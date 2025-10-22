import React, { useState, useEffect } from 'react';
import { materialService, MaterialFilters as FilterType } from '../../services/materialService';

interface MaterialFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  loading: boolean;
}

export const MaterialFilters: React.FC<MaterialFiltersProps> = ({
  filters,
  onFiltersChange,
  loading
}) => {
  const [localFilters, setLocalFilters] = useState<FilterType>(filters);
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const [categoriesResponse, suppliersResponse] = await Promise.all([
        materialService.getCategories(),
        materialService.getSuppliers()
      ]);

      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data.categories);
      }

      if (suppliersResponse.success && suppliersResponse.data) {
        setSuppliers(suppliersResponse.data.suppliers);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const handleFilterChange = (key: keyof FilterType, value: string) => {
    const newFilters = {
      ...localFilters,
      [key]: value || undefined
    };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters: FilterType = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value);

  const getTypeOptions = () => [
    { value: '', label: '全部類型' },
    { value: 'AUXILIARY', label: '輔材' },
    { value: 'FINISHED', label: '完成材' }
  ];

  return (
    <div className="material-filters">
      <div className="filters-header">
        <button
          className="filters-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>篩選條件</span>
          <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
        </button>
        
        {hasActiveFilters && (
          <span className="active-filters-indicator">
            已套用篩選
          </span>
        )}
      </div>

      {isExpanded && (
        <div className="filters-content">
          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="search">搜尋</label>
              <input
                type="text"
                id="search"
                value={localFilters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="搜尋材料名稱或分類"
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="type">材料類型</label>
              <select
                id="type"
                value={localFilters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="filter-select"
              >
                {getTypeOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="category">分類</label>
              <select
                id="category"
                value={localFilters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-select"
              >
                <option value="">全部分類</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="supplier">供應商</label>
              <select
                id="supplier"
                value={localFilters.supplier || ''}
                onChange={(e) => handleFilterChange('supplier', e.target.value)}
                className="filter-select"
              >
                <option value="">全部供應商</option>
                {suppliers.map(supplier => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filters-actions">
            <button
              className="btn btn-secondary"
              onClick={handleClearFilters}
              disabled={loading || !hasActiveFilters}
            >
              清除篩選
            </button>
            <button
              className="btn btn-primary"
              onClick={handleApplyFilters}
              disabled={loading}
            >
              {loading ? '載入中...' : '套用篩選'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};