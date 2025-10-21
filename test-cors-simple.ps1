Write-Host "=== 測試 CORS 圖片載入 ===" -ForegroundColor Green

# 檢查上傳目錄
$uploadsDir = "backend/uploads/materials"
if (Test-Path $uploadsDir) {
    $imageFiles = Get-ChildItem -Path $uploadsDir -Include "*.png", "*.jpg", "*.jpeg", "*.gif", "*.webp" -Recurse | Select-Object -First 3
    
    Write-Host "找到 $($imageFiles.Count) 個圖片文件:" -ForegroundColor Yellow
    foreach ($file in $imageFiles) {
        Write-Host "  - $($file.Name)" -ForegroundColor Cyan
        Write-Host "    URL: http://localhost:3004/uploads/materials/$($file.Name)" -ForegroundColor Gray
    }
} else {
    Write-Host "上傳目錄不存在: $uploadsDir" -ForegroundColor Red
}

Write-Host "`n請手動測試以下 URL 是否可以在瀏覽器中正常載入:" -ForegroundColor Yellow
Write-Host "http://localhost:3004/uploads/materials/" -ForegroundColor Cyan