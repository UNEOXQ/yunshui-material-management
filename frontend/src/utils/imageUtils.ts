/**
 * 圖片 URL 處理工具
 */

/**
 * 處理圖片 URL，確保在不同環境中使用正確的 URL
 */
export function processImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) {
    return null;
  }

  // 在開發環境中，將完整 URL 轉換為相對路徑以使用 Vite 代理
  if (import.meta.env.DEV) {
    if (imageUrl.startsWith('http://localhost:3004/uploads/') || 
        imageUrl.startsWith('https://yunshui-backend1.onrender.com/uploads/')) {
      return imageUrl.replace(/^https?:\/\/[^\/]+/, '');
    }
  } else {
    // 在生產環境中，確保使用正確的 HTTPS URL
    if (imageUrl.startsWith('http://localhost:3004/uploads/')) {
      return imageUrl.replace('http://localhost:3004', 'https://yunshui-backend1.onrender.com');
    }
    // 如果已經是正確的 Render URL，直接返回
    if (imageUrl.startsWith('https://yunshui-backend1.onrender.com/uploads/')) {
      return imageUrl;
    }
    // 處理任何其他 localhost URL
    if (imageUrl.includes('localhost:3004')) {
      return imageUrl.replace(/https?:\/\/localhost:3004/, 'https://yunshui-backend1.onrender.com');
    }
  }

  // 如果是相對路徑，根據環境轉換
  if (imageUrl.startsWith('/uploads/')) {
    if (import.meta.env.DEV) {
      return imageUrl; // 開發環境使用代理
    } else {
      return `https://yunshui-backend1.onrender.com${imageUrl}`;
    }
  }

  // 如果是其他格式的 URL，直接返回
  return imageUrl;
}

/**
 * 獲取圖片的完整 URL（用於上傳等需要完整 URL 的場景）
 */
export function getFullImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) {
    return null;
  }

  // 如果已經是完整 URL，直接返回
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // 如果是相對路徑，添加基礎 URL
  if (imageUrl.startsWith('/uploads/')) {
    // 優先使用環境變量，如果沒有則根據環境判斷
    let baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '');
    
    if (!baseUrl) {
      // 如果環境變量沒有設置，根據當前環境判斷
      if (import.meta.env.DEV) {
        baseUrl = 'http://localhost:3004';
      } else {
        // 生產環境默認使用 Render URL
        baseUrl = 'https://yunshui-backend1.onrender.com';
      }
    }
    
    return `${baseUrl}${imageUrl}`;
  }

  return imageUrl;
}

/**
 * 檢查圖片是否可以載入
 */
export function checkImageLoad(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imageUrl;
  });
}