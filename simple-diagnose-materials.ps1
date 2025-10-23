# 簡單診斷材料圖片問題
Write-Host "診斷材料圖片載入問題..." -ForegroundColor Yellow

# 檢查後端材料 API
Write-Host "檢查材料 API..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://yunshui-backend1.onrender.com/api/materials" -Method GET
    if ($response.success) {
        Write-Host "材料 API 正常" -ForegroundColor Green
        Write-Host "材料數量: $($response.data.materials.Count)" -ForegroundColor White
        
        # 檢查每個材料的圖片狀態
        foreach ($material in $response.data.materials) {
            $name = $material.name
            $id = $material.id
            $imageUrl = $material.imageUrl
            
            if ($imageUrl -and $imageUrl -ne "" -and $imageUrl -ne "null") {
                Write-Host "  - $name ($id): 有圖片 $imageUrl" -ForegroundColor Green
            } else {
                Write-Host "  - $name ($id): 無圖片" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "材料 API 失敗" -ForegroundColor Red
    }
} catch {
    Write-Host "無法連接材料 API" -ForegroundColor Red
}

Write-Host "診斷完成！" -ForegroundColor Yellow