/**
 * 價格格式化工具函數
 * 支援最多4位小數的價格顯示
 */

export const formatPrice = (price: number): string => {
  // 確保價格是數字
  if (typeof price !== 'number' || isNaN(price)) {
    return 'CAD $0.00';
  }

  // 將價格轉換為字符串，保留4位小數，然後移除尾隨的零
  const formattedNumber = price.toFixed(4).replace(/\.?0+$/, '');
  
  // 如果沒有小數部分，至少顯示 .00
  const finalNumber = formattedNumber.includes('.') ? formattedNumber : `${formattedNumber}.00`;
  
  return `CAD $${finalNumber}`;
};

export const formatPriceWithoutCurrency = (price: number): string => {
  if (typeof price !== 'number' || isNaN(price)) {
    return '0.00';
  }

  const formattedNumber = price.toFixed(4).replace(/\.?0+$/, '');
  return formattedNumber.includes('.') ? formattedNumber : `${formattedNumber}.00`;
};

/**
 * 解析價格字符串為數字
 * 支援最多4位小數
 */
export const parsePrice = (priceString: string): number => {
  const cleaned = priceString.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 10000) / 10000; // 確保最多4位小數
};

/**
 * 驗證價格格式
 */
export const validatePriceFormat = (priceString: string): { isValid: boolean; error?: string } => {
  if (!priceString || priceString.trim() === '') {
    return { isValid: false, error: '價格為必填項目' };
  }

  const price = parseFloat(priceString);
  
  if (isNaN(price) || price <= 0) {
    return { isValid: false, error: '價格必須為正數' };
  }

  if (price > 999999.9999) {
    return { isValid: false, error: '價格不能超過999,999.9999' };
  }

  // 檢查小數位數
  const decimalPlaces = (priceString.split('.')[1] || '').length;
  if (decimalPlaces > 4) {
    return { isValid: false, error: '價格最多只能有4位小數' };
  }

  return { isValid: true };
};