import React, { useState, useEffect } from 'react';
import { Material } from '../../types';
import { FinishedMaterialCard } from './FinishedMaterialCard';
import { MaterialFilters } from './MaterialFilters';
import { ShoppingCart } from './ShoppingCart';
import { materialService, MaterialFilters as FilterType } from '../../services/materialService';
import './MaterialSelection.css';

interface FinishedMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreate: (orderItems: CartItem[]) => void;
}

export interface CartItem {
  materialId: string;
  material: Material;
  quantity: number;
  unitPrice: number;
}

export const FinishedMaterialModal: React.FC<FinishedMaterialModalProps> = ({
  isOpen,
  onClose,
  onOrderCreate
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterType>({ type: 'FINISHED' });
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [availableSuppliers, setAvailableSuppliers] = useState<string[]>([]);
  const itemsPerPage = 12;

  useEffect(() => {
    if (isOpen) {
      loadMaterials();
      loadSuppliers();
    }
  }, [isOpen, filters, currentPage, supplierFilter]);

  useEffect(() => {
    // Reset filters when modal opens
    if (isOpen) {
      setFilters({ type: 'FINISHED' });
      setCurrentPage(1);
      setCartItems([]);
      setSupplierFilter('');
    }
  }, [isOpen]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const searchFilters = { ...filters };
      if (supplierFilter) {
        searchFilters.supplier = supplierFilter;
      }
      
      const response = await materialService.getAllMaterials(searchFilters, currentPage, itemsPerPage);
      if (response.success && response.data) {
        setMaterials(response.data.materials);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.total);
      } else {
        setError(response.message || '載入完成材失敗');
      }
    } catch (err) {
      setError('載入完成材時發生錯誤');
      console.error('Error loading finished materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await materialService.getSuppliers('FINISHED');
      if (response.success && response.data) {
        setAvailableSuppliers(response.data.suppliers);
      }
    } catch (err) {
      console.error('Error loading suppliers:', err);
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
      setError('購物車是空的，請先選擇完成材');
      return;
    }
    
    onOrderCreate(cartItems);
    setCartItems([]);
    onClose();
  };

  const handleFiltersChange = (newFilters: FilterType) => {
    setFilters({ ...newFilters, type: 'FINISHED' });
    setCurrentPage(1);
  };

  const handleSupplierFilterChange = (supplier: string) => {
    setSupplierFilter(supplier);
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

  const clearAllFilters = () => {
    setFilters({ type: 'FINISHED' });
    setSupplierFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = () => {
    return Object.keys(filters).some(key => key !== 'type' && filters[key as keyof FilterType]) || supplierFilter;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay material-selection-overlay">
      <div className="modal-content material-selection-modal finished-material-modal">
        <div className="modal-header">
          <h2>選擇完成材</h2>
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
              <div className="filters-section">
                <MaterialFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  materialType="FINISHED"
                  loading={loading}
                />
                
                <div className="supplier-filter">
                  <label htmlFor="supplier-select">供應商篩選:</label>
                  <select
                    id="supplier-select"
                    value={supplierFilter}
                    onChange={(e) => handleSupplierFilterChange(e.target.value)}
                    className="supplier-select"
                  >
                    <option value="">所有供應商</option>
                    {availableSuppliers.map(supplier => (
                      <option key={supplier} value={supplier}>
                        {supplier}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="materials-summary">
                <span>共 {totalItems} 項完成材</span>
                {hasActiveFilters() && (
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={clearAllFilters}
                  >
                    清除所有篩選
                  </button>
                )}
              </div>

              {loading ? (
                <div className="materials-loading">
                  <div className="loading-spinner"></div>
                  <p>載入完成材中...</p>
                </div>
              ) : (
                <div className="materials-grid finished-materials-grid">
                  {materials.map(material => (
                    <FinishedMaterialCard
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
                  <p>沒有找到符合條件的完成材</p>
                  {hasActiveFilters() && (
                    <button 
                      className="btn btn-secondary"
                      onClick={clearAllFilters}
                    >
                      清除篩選條件
                    </button>
                  )}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};