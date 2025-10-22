import React, { useState, useRef } from 'react';
import { materialService } from '../../services/materialService';

interface ImageUploadProps {
  materialId: string;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  materialId,
  onClose,
  onUploadSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('只允許上傳 JPEG、PNG、GIF 或 WebP 格式的圖片');
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('檔案大小不能超過 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const response = await materialService.uploadImage(materialId, selectedFile);
      if (response.success) {
        onUploadSuccess();
        onClose();
      } else {
        setError(response.message || '上傳失敗');
      }
    } catch (err) {
      setError('上傳時發生錯誤');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!window.confirm('確定要刪除此圖片嗎？')) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await materialService.deleteImage(materialId);
      if (response.success) {
        onUploadSuccess();
        onClose();
      } else {
        setError(response.message || '刪除失敗');
      }
    } catch (err) {
      setError('刪除時發生錯誤');
      console.error('Delete error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Simulate file input change
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInputRef.current.files = dt.files;
        handleFileSelect({ target: { files: dt.files } } as any);
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content image-upload-modal">
        <div className="modal-header">
          <h2>圖片管理</h2>
          <button 
            className="btn-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="image-upload-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="upload-section">
            <h3>上傳新圖片</h3>
            
            <div 
              className="file-drop-zone"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <div className="preview-container">
                  <img src={previewUrl} alt="預覽" className="preview-image" />
                  <div className="preview-overlay">
                    <span>點擊更換圖片</span>
                  </div>
                </div>
              ) : (
                <div className="drop-zone-content">
                  <div className="upload-icon">📷</div>
                  <p>點擊選擇圖片或拖拽圖片到此處</p>
                  <p className="upload-hint">
                    支援 JPEG、PNG、GIF、WebP 格式，最大 5MB
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {selectedFile && (
              <div className="file-info">
                <p><strong>檔案名稱：</strong>{selectedFile.name}</p>
                <p><strong>檔案大小：</strong>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <p><strong>檔案類型：</strong>{selectedFile.type}</p>
              </div>
            )}
          </div>

          <div className="upload-actions">
            <button
              className="btn btn-danger"
              onClick={handleDeleteImage}
              disabled={uploading}
            >
              刪除現有圖片
            </button>
            
            <div className="upload-buttons">
              <button
                className="btn btn-secondary"
                onClick={onClose}
                disabled={uploading}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? '上傳中...' : '上傳圖片'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};