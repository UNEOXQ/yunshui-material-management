import React, { useState, useEffect } from 'react';
import { Material } from '../../types';
import { MaterialCard } from './MaterialCard';
import { MaterialFilters } from './MaterialFilters';
import { ShoppingCart } from './ShoppingCart';
import { SimpleProjectSelector } from '../ProjectSelection/SimpleProjectSelector';
import { materialService, MaterialFilters as FilterType } from '../../services/materialService';
import './MaterialSelection.css';

interface MaterialSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreate: (orderItems: CartItem[], projectData?: { projectId?: string; newProjectName?: string; orderName?: string }) => void;
  materialType: 'AUXILIARY' | 'FINISHED';
  title: string;
}

export interface CartItem {
  materialId: string;
  material: Material;
  quantity: number;
  unitPrice: number;
}

export const MaterialSelectionModal: React.FC<MaterialSelectionModalProps> = ({
  isOpen,
  onClose,
  onOrderCreate,
  materialType,
  title
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterType>({ type: materialType });
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const [orderName, setOrderName] = useState<string>('');
  const itemsPerPage = 12;

  useEffect(() => {
    if (isOpen) {
      loadMaterials();
    }
  }, [isOpen, filters, currentPage]);

  useEffect(() => {
    // Reset filters when material type changes
    setFilters({ type: materialType });
    setCurrentPage(1);
    setCartItems([]);
  }, [materialType]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await materialService.getAllMaterials(filters, currentPage, itemsPerPage);
      if (response.success && response.data) {
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

  const handleAddToCart = (material: Material, quantity: number) => {
    const existingItemIndex = cartItems.findIndex(item => item.materialId === material.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setCartItems(updatedItems);
    } else {
      // Add new item
      const newItem: CartItem = {
        materialId: material.id,
        material,
        quantity,
        unitPrice: material.price
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const handleUpdateCartItem = (materialId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(cartItems.filter(item => item.materialId !== materialId));
    } else {
      setCartItems(cartItems.map(item => 
        item.materialId === materialId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const handleRemoveFromCart = (materialId: string) => {
    setCartItems(cartItems.filter(item => item.materialId !== materialId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleCreateOrder = () => {
    if (cartItems.length === 0) {
      setError('購物車是空的，請先選擇材料');
      return;
    }
    
    // 準備專案數據
    const projectData = {
      projectId: selectedProjectId || undefined,
      orderName: orderName || undefined
    };
    
    onOrderCreate(cartItems, projectData);
    
    // 重置狀態
    setCartItems([]);
    setSelectedProjectId('');
    setOrderName('');
    onClose();
  };

  const handleProjectSelect = (projectId: string, projectName: string) => {
    setSelectedProjectId(projectId);
  };



  const handleFiltersChange = (newFilters: FilterType) => {
    setFilters({ ...newFilters, type: materialType });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

  const getTotalQuantity = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay material-selection-overlay">
      <div className="modal-content material-selection-modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <div className="header-actions">
            <button
              className={`cart-toggle-btn ${cartItems.length > 0 ? 'has-items' : ''}`}
              onClick={() => setIsCartOpen(!isCartOpen)}
            >
              🛒 購物車 ({getTotalQuantity()})
            </button>
            <button 
              className="btn-close"
              onClick={onClose}
              type="button"
            >
              ×
            </button>
          </div>
        </div>

        <div className="material-selection-content">
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

          <div className="selection-layout">
            <div className={`materials-section ${isCartOpen ? 'with-cart' : ''}`}>
              <MaterialFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                materialType={materialType}
                loading={loading}
              />

              <div className="materials-summary">
                <span>共 {totalItems} 項{materialType === 'AUXILIARY' ? '輔材' : '完成材'}</span>
                {Object.keys(filters).some(key => key !== 'type' && filters[key as keyof FilterType]) && (
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleFiltersChange({ type: materialType })}
                  >
                    清除篩選
                  </button>
                )}
              </div>

              {loading ? (
                <div className="materials-loading">
                  <div className="loading-spinner"></div>
                  <p>載入材料中...</p>
                </div>
              ) : (
                <div className="materials-grid">
                  {materials.map(material => (
                    <MaterialCard
                      key={material.id}
                      material={material}
                      onAddToCart={handleAddToCart}
                      cartQuantity={cartItems.find(item => item.materialId === material.id)?.quantity || 0}
                    />
                  ))}
                </div>
              )}

              {materials.length === 0 && !loading && (
                <div className="no-materials">
                  <p>沒有找到符合條件的材料</p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    上一頁
                  </button>
                  
                  <div className="page-info">
                    第 {currentPage} 頁，共 {totalPages} 頁
                  </div>
                  
                  <button
                    className="btn btn-secondary"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                  >
                    下一頁
                  </button>
                </div>
              )}
            </div>

            {isCartOpen && (
              <div className="cart-section">
                <div className="cart-with-project">
                  <div className="project-selection-section">
                    <SimpleProjectSelector
                      selectedProjectId={selectedProjectId}
                      onProjectSelect={handleProjectSelect}
                    />
                    
                    <div className="order-name-section">
                      <label className="order-name-label">
                        訂單名稱 <span className="optional">(可選)</span>
                      </label>
                      <input
                        type="text"
                        value={orderName}
                        onChange={(e) => setOrderName(e.target.value)}
                        placeholder={`${materialType === 'AUXILIARY' ? '輔材' : '完成材'}訂單-${new Date().toLocaleDateString()}`}
                        maxLength={100}
                        className="order-name-input"
                      />
                    </div>
                  </div>
                  
                  <ShoppingCart
                    items={cartItems}
                    onUpdateItem={handleUpdateCartItem}
                    onRemoveItem={handleRemoveFromCart}
                    onClearCart={handleClearCart}
                    onCreateOrder={handleCreateOrder}
                    totalAmount={getTotalAmount()}
                    loading={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};