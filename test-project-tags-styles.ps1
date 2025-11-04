# Project Tags Style Fix Test Script
Write-Host "Project Tags Style Fix Test" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check modified files
Write-Host "`nChecking modified files..." -ForegroundColor Yellow

$projectTagsCSS = "frontend/src/components/ProjectTags/ProjectTags.css"
$orderManagementCSS = "frontend/src/components/OrderManagement/OrderManagement.css"

if (Test-Path $projectTagsCSS) {
    Write-Host "OK: $projectTagsCSS exists" -ForegroundColor Green
} else {
    Write-Host "ERROR: $projectTagsCSS not found" -ForegroundColor Red
}

if (Test-Path $orderManagementCSS) {
    Write-Host "OK: $orderManagementCSS exists" -ForegroundColor Green
} else {
    Write-Host "ERROR: $orderManagementCSS not found" -ForegroundColor Red
}

# Check key style changes
Write-Host "`nChecking key style changes..." -ForegroundColor Yellow

# Check ProjectTags.css changes
$projectTagsContent = Get-Content $projectTagsCSS -Raw
if ($projectTagsContent -match "justify-content: center") {
    Write-Host "OK: ProjectTags.css - justify-content: center found" -ForegroundColor Green
} else {
    Write-Host "ERROR: ProjectTags.css - justify-content: center not found" -ForegroundColor Red
}

if ($projectTagsContent -match "padding: 9px 10px 9px 10px") {
    Write-Host "OK: ProjectTags.css - symmetric padding found" -ForegroundColor Green
} else {
    Write-Host "ERROR: ProjectTags.css - symmetric padding not found" -ForegroundColor Red
}

if ($projectTagsContent -match "text-align: center") {
    Write-Host "OK: ProjectTags.css - text-align: center found" -ForegroundColor Green
} else {
    Write-Host "ERROR: ProjectTags.css - text-align: center not found" -ForegroundColor Red
}

# Check OrderManagement.css changes
$orderManagementContent = Get-Content $orderManagementCSS -Raw
if ($orderManagementContent -match "padding: 7px 10px 7px 10px") {
    Write-Host "OK: OrderManagement.css - order page symmetric padding found" -ForegroundColor Green
} else {
    Write-Host "ERROR: OrderManagement.css - order page symmetric padding not found" -ForegroundColor Red
}

if ($orderManagementContent -match "justify-content: center !important") {
    Write-Host "OK: OrderManagement.css - justify-content: center !important found" -ForegroundColor Green
} else {
    Write-Host "ERROR: OrderManagement.css - justify-content: center !important not found" -ForegroundColor Red
}

# Open test page
Write-Host "`nOpening test page..." -ForegroundColor Yellow
if (Test-Path "test-project-tags-fix.html") {
    Write-Host "OK: Test page created" -ForegroundColor Green
    Write-Host "Opening test page..." -ForegroundColor Cyan
    Start-Process "test-project-tags-fix.html"
} else {
    Write-Host "ERROR: Test page not found" -ForegroundColor Red
}

Write-Host "`nFix Summary:" -ForegroundColor Yellow
Write-Host "1. Fixed project tag text vertical alignment (symmetric padding)" -ForegroundColor White
Write-Host "2. Fixed project tag text horizontal alignment (center alignment)" -ForegroundColor White
Write-Host "3. Applied fixes to both general and order management page styles" -ForegroundColor White

Write-Host "`nTest Steps:" -ForegroundColor Yellow
Write-Host "1. Restart frontend development server" -ForegroundColor White
Write-Host "2. Login with any user account" -ForegroundColor White
Write-Host "3. Go to Order Management page" -ForegroundColor White
Write-Host "4. Check the project tags bar at the top of the page" -ForegroundColor White
Write-Host "5. Confirm text is vertically and horizontally centered" -ForegroundColor White

Write-Host "`nFix Complete!" -ForegroundColor Green