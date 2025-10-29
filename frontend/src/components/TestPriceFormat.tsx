import React from 'react';
import { formatPrice } from '../utils/priceUtils';

export const TestPriceFormat: React.FC = () => {
  const testPrices = [2.2657, 14.3276, 123.45, 100, 0.0001];
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '2px solid red', 
      padding: '10px',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <h4>價格格式化測試</h4>
      {testPrices.map(price => (
        <div key={price}>
          {price} → {formatPrice(price)}
        </div>
      ))}
    </div>
  );
};