# Test order creation API
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer test-token"
}

$bodyData = @{
    items = @(
        @{
            materialId = "1"
            quantity = 10
            unitPrice = 100
            supplier = "Test Supplier"
        }
    )
}

$body = $bodyData | ConvertTo-Json -Depth 3

Write-Host "Testing order creation API..."
Write-Host "URL: https://yunshui-material-management.onrender.com/api/orders/auxiliary"
Write-Host "Body: $body"

try {
    $response = Invoke-RestMethod -Uri "https://yunshui-material-management.onrender.com/api/orders/auxiliary" -Method POST -Headers $headers -Body $body
    Write-Host "Success Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error Response:" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
    Write-Host "Status Description: $($_.Exception.Response.StatusDescription)"
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}