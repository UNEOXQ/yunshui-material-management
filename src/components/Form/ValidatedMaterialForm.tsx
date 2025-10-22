import React, { useState, useEffect } from 'react';
import { useFormValidation } from '../../hooks/useFormValidation';
import { InputField, SelectField } from './FormField';
import { Material } from '../../types';
import { materialService } from '../../services/materialService';
import './Form.css';

interface ValidatedMaterialFormProps {
  material: Material | null;
  onSubmit: (materialData: any) => Promise<void>;
  onCancel: () => void;
}

interface MaterialFormData {
  name: string;
  category: string;
  price: string;
  quantity: string;
  supplier: string;
  type: Material['type'];
  description: string;
}

export const ValidatedMaterialForm: React.FC<ValidatedMaterialFormProps> = ({
  material,
  onSubmit,
  onCancel
}) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const initialValues: MaterialFormData = {
    name: material?.name || '',
    category: material?.category || '',
    price: material?.price?.toString() || '',
    quantity: material?.quantity?.toString() || '',
    supplier: material?.supplier || '',
    type: material?.type || 'AUXILIARY',
    description: (material as any)?.description || ''
  };

  const validationRules = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 255,
      custom: (value: string) => {
        if (value && /^\s/.test(value)) {
          return '材料名稱不能以空格開頭';
        }
        if (value && /\s{2,}/.test(value)) {
          return '材料名稱不能包含連續空格';
        }
        return null;
      }
    },
    category: {
      required: true,
      minLength: 1,
      maxLength: 100
    },
    price: {
      required: true,
      custom: (value: string) => {
        const num = parseFloat(value);
        if (isNaN(num)) {
          return '請輸入有效的數字';
        }
        if (num <= 0) {
          return '價格必須大於0';
        }
        if (num > 999999.99) {
          return '價格不能超過999,999.99';
        }
        if (!/^\d+(\.\d{1,2})?$/.test(value)) {
          return '價格最多只能有兩位小數';
        }
        return null;
      }
    },
    quantity: {
      required: true,
      custom: (value: string) => {
        const num = parseInt(value, 10);
        if (isNaN(num)) {
          return '請輸入有效的整數';
        }
        if (num < 0) {
          return '數量不能為負數';
        }
        if (num > 999999) {
          return '數量不能超過999,999';
        }
        if (!/^\d+$/.test(value)) {
          return '數量必須為整數';
        }
        return null;
      }
    },
    supplier: {
      maxLength: 255
    },
    type: {
      required: true,
      custom: (value: string) => {
        if (!['AUXILIARY', 'FINISHED'].includes(value)) {
          return '請選擇有效的材料類型';
        }
        return null;
      }
    },
    description: {
      maxLength: 1000
    }
  };

  const {
    values,
    isValid,
    isSubmitting,
    getFieldProps,
    getFieldError,
    handleSubmit,
    setValue
  } = useFormValidation({
    initialValues,
    validationRules,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (formData) => {
      const submitData = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity, 10),
        supplier: formData.supplier.trim() || undefined,
        type: formData.type,
        description: formData.description.trim() || undefined
      };

      await onSubmit(submitData);
    }
  });

  // 載入分類和供應商資料
  useEffect(() => {
    const loadCategoriesAndSuppliers = async () => {
      try {
        setLoadingData(true);
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
      } finally {
        setLoadingData(false);
      }
    };

    loadCategoriesAndSuppliers();
  }, []);

  const typeOptions = [
    { value: 'AUXILIARY', label: '輔材' },
    { value: 'FINISHED', label: '完成材' }
  ];

  // 格式化價格輸入
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // 只允許數字和一個小數點
    value = value.replace(/[^\d.]/g, '');
    
    // 確保只有一個小數點
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // 限制小數位數
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }

    setValue('price', value);
  };

  // 格式化數量輸入
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // 只允許數字
    value = value.replace(/[^\d]/g, '');
    
    setValue('quantity', value);
  };

  if (loadingData) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>載入資料中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{material ? '編輯材料' : '新增材料'}</h2>
          <button 
            className="btn-close"
            onClick={onCancel}
            type="button"
            aria-label="關閉"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="material-form" noValidate>
          <div className="form-row">
            <InputField
              label="材料名稱"
              required
              type="text"
              id="name"
              placeholder="請輸入材料名稱"
              error={getFieldError('name')}
              helpText="2-255個字元，不能以空格開頭"
              {...getFieldProps('name')}
            />

            <SelectField
              label="材料類型"
              required
              id="type"
              options={typeOptions}
              error={getFieldError('type')}
              {...getFieldProps('type')}
            />
          </div>

          <div className="form-row">
            <InputField
              label="分類"
              required
              type="text"
              id="category"
              placeholder="請輸入分類"
              error={getFieldError('category')}
              list="categories-list"
              {...getFieldProps('category')}
            />
            <datalist id="categories-list">
              {categories.map(category => (
                <option key={category} value={category} />
              ))}
            </datalist>

            <InputField
              label="供應商"
              type="text"
              id="supplier"
              placeholder="請輸入供應商名稱"
              error={getFieldError('supplier')}
              helpText="選填，最多255個字元"
              list="suppliers-list"
              {...getFieldProps('supplier')}
            />
            <datalist id="suppliers-list">
              {suppliers.map(supplier => (
                <option key={supplier} value={supplier} />
              ))}
            </datalist>
          </div>

          <div className="form-row">
            <InputField
              label="價格 (TWD)"
              required
              type="text"
              id="price"
              placeholder="0.00"
              error={getFieldError('price')}
              helpText="最多兩位小數，最大999,999.99"
              value={values.price}
              onChange={handlePriceChange}
              onBlur={getFieldProps('price').onBlur}
              className={getFieldProps('price').className}
            />

            <InputField
              label="庫存數量"
              required
              type="text"
              id="quantity"
              placeholder="0"
              error={getFieldError('quantity')}
              helpText="整數，最大999,999"
              value={values.quantity}
              onChange={handleQuantityChange}
              onBlur={getFieldProps('quantity').onBlur}
              className={getFieldProps('quantity').className}
            />
          </div>

          <InputField
            label="描述"
            type="text"
            id="description"
            placeholder="請輸入材料描述（選填）"
            error={getFieldError('description')}
            helpText="選填，最多1000個字元"
            {...getFieldProps('description')}
          />

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
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? '處理中...' : (material ? '更新' : '建立')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};