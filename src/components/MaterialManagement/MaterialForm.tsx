import React, { useState, useEffect } from 'react';
import { Material } from '../../types';
import { materialService } from '../../services/materialService';

interface MaterialFormProps {
  material: Material | null;
  onSubmit: (materialData: any) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  category: string;
  price: string;
  quantity: string;
  supplier: string;
  type: Material['type'];
}

interface FormErrors {
  name?: string;
  category?: string;
  price?: string;
  quantity?: string;
  supplier?: string;
  type?: string;
}

export const MaterialForm: React.FC<MaterialFormProps> = ({
  material,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '',
    price: '',
    quantity: '',
    supplier: '',
    type: 'AUXILIARY'
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        category: material.category,
        price: material.price.toString(),
        quantity: material.quantity.toString(),
        supplier: material.supplier || '',
        type: material.type
      });
    }
    
    // Load categories and suppliers for autocomplete
    loadCategoriesAndSuppliers();
  }, [material]);

  const loadCategoriesAndSuppliers = async () => {
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
      console.error('Error loading categories and suppliers:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = '材料名稱為必填項目';
    } else if (formData.name.length < 2) {
      newErrors.name = '材料名稱至少需要2個字元';
    } else if (formData.name.length > 255) {
      newErrors.name = '材料名稱不能超過255個字元';
    }

    // Category validation
    if (!formData.category.trim()) {
      newErrors.category = '分類為必填項目';
    } else if (formData.category.length > 100) {
      newErrors.category = '分類不能超過100個字元';
    }

    // Price validation
    const price = parseFloat(formData.price);
    if (!formData.price.trim()) {
      newErrors.price = '價格為必填項目';
    } else if (isNaN(price) || price <= 0) {
      newErrors.price = '價格必須為正數';
    } else if (price > 999999.99) {
      newErrors.price = '價格不能超過999,999.99';
    }

    // Quantity validation
    const quantity = parseInt(formData.quantity, 10);
    if (!formData.quantity.trim()) {
      newErrors.quantity = '數量為必填項目';
    } else if (isNaN(quantity) || quantity < 0) {
      newErrors.quantity = '數量必須為非負整數';
    } else if (quantity > 999999) {
      newErrors.quantity = '數量不能超過999,999';
    }

    // Supplier validation (optional)
    if (formData.supplier && formData.supplier.length > 255) {
      newErrors.supplier = '供應商名稱不能超過255個字元';
    }

    // Type validation
    if (!['AUXILIARY', 'FINISHED'].includes(formData.type)) {
      newErrors.type = '請選擇有效的材料類型';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity, 10),
        supplier: formData.supplier.trim() || undefined,
        type: formData.type
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeOptions = () => [
    { value: 'AUXILIARY', label: '輔材' },
    { value: 'FINISHED', label: '完成材' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{material ? '編輯材料' : '新增材料'}</h2>
          <button 
            className="btn-close"
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="material-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">材料名稱 *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={errors.name ? 'error' : ''}
                placeholder="請輸入材料名稱"
              />
              {errors.name && (
                <span className="error-text">{errors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="type">材料類型 *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={errors.type ? 'error' : ''}
              >
                {getTypeOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <span className="error-text">{errors.type}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">分類 *</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={errors.category ? 'error' : ''}
                placeholder="請輸入分類"
                list="categories-list"
              />
              <datalist id="categories-list">
                {categories.map(category => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              {errors.category && (
                <span className="error-text">{errors.category}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="supplier">供應商</label>
              <input
                type="text"
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                className={errors.supplier ? 'error' : ''}
                placeholder="請輸入供應商名稱"
                list="suppliers-list"
              />
              <datalist id="suppliers-list">
                {suppliers.map(supplier => (
                  <option key={supplier} value={supplier} />
                ))}
              </datalist>
              {errors.supplier && (
                <span className="error-text">{errors.supplier}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">價格 (TWD) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className={errors.price ? 'error' : ''}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {errors.price && (
                <span className="error-text">{errors.price}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="quantity">庫存數量 *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className={errors.quantity ? 'error' : ''}
                placeholder="0"
                min="0"
                step="1"
              />
              {errors.quantity && (
                <span className="error-text">{errors.quantity}</span>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '處理中...' : (material ? '更新' : '建立')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};