/**
 * 圖片 URL 處理工具
 */

/**
 * 處理圖片 URL，確保在開發環境中使用代理
 */
export function processImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) {
    return null;
  }

  // 如果是完整的 URL，在開發環境中轉換為相對路徑以使用 Vite 代理
  if (imageUrl.startsWith('http://localhost:3004/uploads/')) {
    // 在開發環境中，移除域名部分，使用 Vite 代理
    if (import.meta.env.DEV) {
      return imageUrl.replace('http://localhost:3004', '');
    }
  }

  // 如果已經是相對路徑，直接返回
  if (imageUrl.startsWith('/uploads/')) {
    return imageUrl;
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
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3004';
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