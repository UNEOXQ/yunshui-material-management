import React, { useState, useEffect } from 'react';
import { processImageUrl, getFullImageUrl, checkImageLoad } from '../utils/imageUtils';

export const TestImageLoad: React.FC = () => {
  const [testResults, setTestResults] = useState<Array<{
    url: string;
    processed: string | null;
    full: string | null;
    canLoad: boolean | null;
  }>>([]);

  const testUrls = [
    'http://localhost:3004/uploads/materials/LOGO-1760471119261-231160952.png',
    '/uploads/materials/LOGO-1760471140490-834598999.png',
    'http://localhost:3004/uploads/materials/LOGO-1760471154442-828313974.png'
  ];

  useEffect(() => {
    const runTests = async () => {
      const results = [];
      
      for (const url of testUrls) {
        const processed = processImageUrl(url);
        const full = getFullImageUrl(url);
        const canLoad = processed ? await checkImageLoad(processed) : false;
        
        results.push({
          url,
          processed,
          full,
          canLoad
        });
      }
      
      setTestResults(results);
    };

    runTests();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>圖片載入測試</h2>
      
      {testResults.map((result, index) => (
        <div key={index} style={{ 
          border: '1px solid #ccc', 
          margin: '10px 0', 
          padding: '10px',
          backgroundColor: result.canLoad ? '#e8f5e8' : '#ffe8e8'
        }}>
          <h3>測試 {index + 1}</h3>
          <p><strong>原始 URL:</strong> {result.url}</p>
          <p><strong>處理後 URL:</strong> {result.processed || 'null'}</p>
          <p><strong>完整 URL:</strong> {result.full || 'null'}</p>
          <p><strong>可以載入:</strong> {result.canLoad ? '✅ 是' : '❌ 否'}</p>
          
          {result.processed && (
            <div>
              <p><strong>測試圖片:</strong></p>
              <img 
                src={result.processed} 
                alt={`Test ${index + 1}`}
                style={{ maxWidth: '200px', maxHeight: '200px' }}
                onLoad={() => console.log(`Image ${index + 1} loaded successfully`)}
                onError={() => console.error(`Image ${index + 1} failed to load`)}
              />
            </div>
          )}
        </div>
      ))}
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h3>環境信息</h3>
        <p><strong>開發模式:</strong> {import.meta.env.DEV ? '是' : '否'}</p>
        <p><strong>API URL:</strong> {import.meta.env.VITE_API_URL}</p>
        <p><strong>當前域名:</strong> {window.location.origin}</p>
      </div>
    </div>
  );
};