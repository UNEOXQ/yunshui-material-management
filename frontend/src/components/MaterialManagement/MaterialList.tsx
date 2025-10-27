import React, { useState } from 'react';
import { Material } from '../../types';
import { ImageUpload } from './ImageUpload';
import { processImageUrl } from '../../utils/imageUtils';
import { formatPrice } from '../../utils/priceUtils';

interface MaterialListProps {
  materials: Material[];
  onEditMaterial: (material: Material) => void;
  onDeleteMaterial: (materialId: string) => void;
  onQuantityUpdate: (materialId: string, quantity: number) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const MaterialList: React.FC<MaterialListProps> = ({
  materials,
  onEditMaterial,
  onDeleteMaterial,
  onQuantityUpdate,
  onRefresh,
  loading
}) => {
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
  const [quantityValues, setQuantityValues] = useState<{ [key: string]: number }>({});
  const [imageUploadOpen, setImageUploadOpen] = useState<string | null>(null);

  const getTypeDisplayName = (type: Material['type']): string => {
    return type === 'AUXILIARY' ? '輔材' : '完成材';
  };

  const getTypeClassName = (type: Material['type']): string => {
    return type === 'AUXILIARY' ? 'auxiliary' : 'finished';
  };

  // 修復：直接在組件中定義格式化函數（支援4位小數）
  const formatPriceFixed = (price: number): string => {
    console.log('MaterialList formatPriceFixed called with:', price);
    if (typeof price !== 'number' || isNaN(price)) {
      return 'CAD $0.00';
    }
    const formattedNumber = price.toFixed(4).replace(/\.?0+$/, '');
    const finalNumber = formattedNumber.includes('.') ? formattedNumber : `${formattedNumber}.00`;
    const result = `CAD $${finalNumber}`;
    console.log('MaterialList formatPriceFixed result:', result);
    return result;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleQuantityEdit = (materialId: string, currentQuantity: number) => {
    setEditingQuantity(materialId);
    setQuantityValues({ ...quantityValues, [materialId]: currentQuantity });
  };

  const handleQuantitySave = (materialId: string) => {
    const newQuantity = quantityValues[materialId];
    if (newQuantity !== undefined && newQuantity >= 0) {
      onQuantityUpdate(materialId, newQuantity);
    }
    setEditingQuantity(null);
  };

  const handleQuantityCancel = () => {
    setEditingQuantity(null);
  };

  const handleQuantityChange = (materialId: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setQuantityValues({ ...quantityValues, [materialId]: numValue });
    }
  };

  const handleImageUpload = (materialId: string) => {
    setImageUploadOpen(materialId);
  };

  const handleImageUploadClose = () => {
    setImageUploadOpen(null);
  };

  if (loading && materials.length === 0) {
    return (
      <div className="material-list-loading">
        <div className="loading-spinner"></div>
        <p>載入材料中...</p>
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="material-list-empty">
        <p>目前沒有材料資料</p>
      </div>
    );
  }

  return (
    <div className="material-list">
      <div className="table-container">
        <table className="material-table">
          <thead>
            <tr>
              <th>圖片</th>
              <th>材料名稱</th>
              <th>分類</th>
              <th>類型</th>
              <th>價格</th>
              <th>庫存數量</th>
              <th>供應商</th>
              <th>建立時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {materials.map(material => (
              <tr key={material.id} className={loading ? 'loading' : ''}>
                <td className="image-cell">
                  <div className="material-image-container">
                    {material.imageUrl ? (
                      <img 
                        src={processImageUrl(material.imageUrl) || ''} 
                        alt={material.name}
                        className="material-image"
                        onLoad={(e) => {
                          console.log('Image loaded successfully:', processImageUrl(material.imageUrl));
                          // 確保圖片顯示
                          (e.target as HTMLImageElement).style.display = 'block';
                        }}
                        onError={(e) => {
                          console.error('Image load error:', material.imageUrl);
                          console.error('Processed URL:', processImageUrl(material.imageUrl));
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="no-image">
                        <span>無圖片</span>
                      </div>
                    )}
                    <button
                      className="btn btn-sm btn-secondary image-upload-btn"
                      onClick={() => handleImageUpload(material.id)}
                      title="上傳/更換圖片"
                    >
                      📷
                    </button>
                  </div>
                </td>
                <td className="name-cell">
                  <div className="material-info">
                    <span className="material-name">{material.name}</span>
                    <span className="material-id">ID: {material.id.slice(0, 8)}...</span>
                  </div>
                </td>
                <td>{material.category}</td>
                <td>
                  <span className={`type-badge type-${getTypeClassName(material.type)}`}>
                    {getTypeDisplayName(material.type)}
                  </span>
                </td>
                <td className="price-cell">{formatPriceFixed(material.price)}</td>
                <td className="quantity-cell">
                  {editingQuantity === material.id ? (
                    <div className="quantity-edit">
                      <input
                        type="number"
                        min="0"
                        value={quantityValues[material.id] || 0}
                        onChange={(e) => handleQuantityChange(material.id, e.target.value)}
                        className="quantity-input"
                      />
                      <div className="quantity-actions">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleQuantitySave(material.id)}
                        >
                          ✓
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={handleQuantityCancel}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="quantity-display">
                      <span className={`quantity ${material.quantity === 0 ? 'out-of-stock' : ''}`}>
                        {material.quantity}
                      </span>
                      <button
                        className="btn btn-sm btn-secondary quantity-edit-btn"
                        onClick={() => handleQuantityEdit(material.id, material.quantity)}
                        title="編輯數量"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </td>
                <td>{material.supplier || '-'}</td>
                <td>{formatDate(material.createdAt)}</td>
                <td className="actions-cell">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onEditMaterial(material)}
                    title="編輯材料"
                  >
                    編輯
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => onDeleteMaterial(material.id)}
                    title="刪除材料"
                  >
                    刪除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {imageUploadOpen && (
        <ImageUpload
          materialId={imageUploadOpen}
          onClose={handleImageUploadClose}
          onUploadSuccess={() => {
            // Refresh the materials list without reloading the page
            console.log('Image upload successful, refreshing materials list...');
            onRefresh();
          }}
        />
      )}
    </div>
  );
};