import React from 'react';
import { CartItem } from './MaterialSelectionModal';

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateItem: (materialId: string, quantity: number) => void;
  onRemoveItem: (materialId: string) => void;
  onClearCart: () => void;
  onCreateOrder: () => void;
  totalAmount: number;
  loading: boolean;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
  items,
  onUpdateItem,
  onRemoveItem,
  onClearCart,
  onCreateOrder,
  totalAmount,
  loading
}) => {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  const handleQuantityChange = (materialId: string, newQuantity: string) => {
    const quantity = parseInt(newQuantity, 10);
    if (!isNaN(quantity) && quantity >= 0) {
      onUpdateItem(materialId, quantity);
    }
  };

  const getTotalQuantity = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  if (items.length === 0) {
    return (
      <div className="shopping-cart empty">
        <div className="cart-header">
          <h3>購物車</h3>
        </div>
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <p>購物車是空的</p>
          <p className="empty-cart-hint">選擇材料加入購物車</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shopping-cart">
      <div className="cart-header">
        <h3>購物車 ({getTotalQuantity()} 項)</h3>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onClearCart}
          disabled={loading}
        >
          清空
        </button>
      </div>

      <div className="cart-items">
        {items.map(item => (
          <div key={item.materialId} className="cart-item">
            <div className="item-image">
              {item.material.imageUrl ? (
                <img 
                  src={item.material.imageUrl} 
                  alt={item.material.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`no-image ${item.material.imageUrl ? 'hidden' : ''}`}>
                <span>無圖</span>
              </div>
            </div>

            <div className="item-details">
              <div className="item-name" title={item.material.name}>
                {item.material.name}
              </div>
              <div className="item-category">
                {item.material.category}
              </div>
              <div className="item-price">
                {formatPrice(item.unitPrice)} / 單位
              </div>
            </div>

            <div className="item-controls">
              <div className="quantity-control">
                <button
                  type="button"
                  className="quantity-btn"
                  onClick={() => onUpdateItem(item.materialId, item.quantity - 1)}
                  disabled={loading || item.quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={item.material.quantity}
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.materialId, e.target.value)}
                  className="quantity-input"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="quantity-btn"
                  onClick={() => onUpdateItem(item.materialId, item.quantity + 1)}
                  disabled={loading || item.quantity >= item.material.quantity}
                >
                  +
                </button>
              </div>

              <div className="item-total">
                {formatPrice(item.quantity * item.unitPrice)}
              </div>

              <button
                className="remove-btn"
                onClick={() => onRemoveItem(item.materialId)}
                disabled={loading}
                title="移除項目"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>總數量:</span>
          <span>{getTotalQuantity()} 項</span>
        </div>
        <div className="summary-row total">
          <span>總金額:</span>
          <span className="total-amount">{formatPrice(totalAmount)}</span>
        </div>
      </div>

      <div className="cart-actions">
        <button
          className="btn btn-primary btn-large"
          onClick={onCreateOrder}
          disabled={loading || items.length === 0}
        >
          {loading ? '建立中...' : '建立訂單'}
        </button>
      </div>

      <div className="cart-notes">
        <p className="note">
          ⚠️ 請確認數量和材料規格正確
        </p>
        <p className="note">
          💡 建立訂單後將進入專案管理流程
        </p>
      </div>
    </div>
  );
};