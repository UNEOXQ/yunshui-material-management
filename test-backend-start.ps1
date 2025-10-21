Write-Host "Testing backend startup..." -ForegroundColor Green

# Test TypeScript compilation
Write-Host "Checking TypeScript compilation..." -ForegroundColor Yellow
try {
    $result = & npx tsc --noEmit --project backend/tsconfig.json 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ TypeScript compilation successful" -ForegroundColor Green
    } else {
        Write-Host "❌ TypeScript compilation failed:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error checking TypeScript: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend should now start without TypeScript errors" -ForegroundColor Green
Write-Host "You can now run: cd backend && npm run dev" -ForegroundColor Cyan