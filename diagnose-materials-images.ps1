# 診斷材料圖片問題
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
            if ($material.imageUrl -and $material.imageUrl -ne "" -and $material.imageUrl -ne "null") {
                $imageStatus = "有圖片: $($material.imageUrl)"
                Write-Host "  - $($material.name) ID $($material.id): $imageStatus" -ForegroundColor Green
            } else {
                $imageStatus = "無圖片"
                Write-Host "  - $($material.name) ID $($material.id): $imageStatus" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "材料 API 失敗: $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "無法連接材料 API: $($_.Exception.Message)" -ForegroundColor Red
}

# 檢查圖片文件是否存在
Write-Host "檢查圖片文件..." -ForegroundColor Cyan
$imageUrls = @(
    "https://yunshui-backend1.onrender.com/uploads/materials/1729779326806-螺絲釘.jpg",
    "https://yunshui-backend1.onrender.com/uploads/materials/1729779346789-木板.jpg",
    "https://yunshui-backend1.onrender.com/uploads/materials/1729779366123-電線.jpg",
    "https://yunshui-backend1.onrender.com/uploads/materials/1729779386456-水泥.jpg"
)

foreach ($url in $imageUrls) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method HEAD -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "圖片可訪問: $url" -ForegroundColor Green
        } else {
            Write-Host "圖片不可訪問: $url 狀態碼: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "圖片不可訪問: $url 錯誤: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 檢查備份狀態
Write-Host "檢查備份狀態..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://yunshui-backend1.onrender.com/api/backup/status" -Method GET
    if ($response.success) {
        Write-Host "備份服務正常" -ForegroundColor Green
        Write-Host "最後備份時間: $($response.data.lastBackupTime)" -ForegroundColor White
        if ($response.data.lastBackupResult.statistics) {
            Write-Host "備份統計: $($response.data.lastBackupResult.statistics | ConvertTo-Json -Compress)" -ForegroundColor White
        }
    } else {
        Write-Host "備份服務失敗: $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "無法連接備份 API: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "診斷完成！" -ForegroundColor Yellow