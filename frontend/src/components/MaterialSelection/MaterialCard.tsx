import React, { useState } from 'react';
import { Material } from '../../types';

interface MaterialCardProps {
  material: Material;
  onAddToCart: (material: Material, quantity: number) => void;
  cartQuantity: number;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onAddToCart,
  cartQuantity
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const formatPrice = (price: number): string => {
    // 自定義格式化以確保顯示完整的4位小數（如果有的話）
    const formattedNumber = price.toFixed(4).replace(/\.?0+$/, '');
    const finalNumber = formattedNumber.includes('.') ? formattedNumber : `${formattedNumber}.00`;
    return `CAD $${finalNumber}`;
  };

  const getTypeDisplayName = (type: Material['type']): string => {
    return type === 'AUXILIARY' ? '輔材' : '完成材';
  };

  const getTypeClassName = (type: Material['type']): string => {
    return type === 'AUXILIARY' ? 'auxiliary' : 'finished';
  };

  const handleAddToCart = async () => {
    if (quantity <= 0 || quantity > material.quantity) {
      return;
    }

    setIsAdding(true);
    try {
      onAddToCart(material, quantity);
      // Reset quantity to 1 after adding
      setQuantity(1);
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuantityChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= material.quantity) {
      setQuantity(numValue);
    }
  };

  const isOutOfStock = material.quantity === 0;
  const isInsufficientStock = quantity > material.quantity;

  return (
    <div className={`material-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
      <div className="card-image">
        {material.imageUrl ? (
          <img 
            src={material.imageUrl} 
            alt={material.name}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`no-image ${material.imageUrl ? 'hidden' : ''}`}>
          <span>無圖片</span>
        </div>
        
        {cartQuantity > 0 && (
          <div className="cart-badge">
            已選 {cartQuantity}
          </div>
        )}
        
        <div className={`type-badge type-${getTypeClassName(material.type)}`}>
          {getTypeDisplayName(material.type)}
        </div>
      </div>

      <div className="card-content">
        <div className="card-header">
          <h3 className="material-name" title={material.name}>
            {material.name}
          </h3>
          <div className="material-category">
            {material.category}
          </div>
        </div>

        <div className="card-details">
          <div className="price-info">
            <span className="price">{formatPrice(material.price)}</span>
            <span className="price-unit">/ 單位</span>
          </div>
          
          <div className="stock-info">
            <span className={`stock ${isOutOfStock ? 'out-of-stock' : ''}`}>
              庫存: {material.quantity}
            </span>
          </div>

          {material.supplier && (
            <div className="supplier-info">
              <span className="supplier">供應商: {material.supplier}</span>
            </div>
          )}
        </div>

        <div className="card-actions">
          {!isOutOfStock ? (
            <>
              <div className="quantity-selector">
                <label htmlFor={`quantity-${material.id}`}>數量:</label>
                <div className="quantity-input-group">
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => handleQuantityChange((quantity - 1).toString())}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    id={`quantity-${material.id}`}
                    type="number"
                    min="1"
                    max={material.quantity}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className={`quantity-input ${isInsufficientStock ? 'error' : ''}`}
                  />
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => handleQuantityChange((quantity + 1).toString())}
                    disabled={quantity >= material.quantity}
                  >
                    +
                  </button>
                </div>
              </div>

              {isInsufficientStock && (
                <div className="error-text">
                  數量不能超過庫存
                </div>
              )}

              <button
                className="btn btn-primary add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={isAdding || isInsufficientStock || quantity <= 0}
              >
                {isAdding ? '加入中...' : '加入購物車'}
              </button>
            </>
          ) : (
            <div className="out-of-stock-message">
              <span>缺貨中</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};