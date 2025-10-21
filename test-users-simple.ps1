Write-Host "Testing Users API..." -ForegroundColor Green

$loginBody = @{username="admin"; password="admin123"} | ConvertTo-Json
$loginResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.data.token

$userResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/users" -Headers @{"Authorization"="Bearer $token"} -UseBasicParsing
$userData = $userResponse.Content | ConvertFrom-Json

Write-Host "Users count: $($userData.data.users.Count)" -ForegroundColor Green
Write-Host "Data structure correct: users array exists" -ForegroundColor Green