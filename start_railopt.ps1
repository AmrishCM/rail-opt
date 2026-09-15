$ErrorActionPreference = 'Stop'

$root = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (!$root) { $root = (Get-Location).Path }

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "       RAILOPT-AI STARTUP" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# 1. Pre-flight check: Backend port 8100
$port8100Active = Get-NetTCPConnection -LocalPort 8100 -State Listen -ErrorAction SilentlyContinue
if ($port8100Active) {
    Write-Host "[ERROR] RailOpt-AI backend port 8100 is already in use." -ForegroundColor Red
    Write-Host "Stop the existing process or configure another RailOpt-AI port." -ForegroundColor Yellow
    exit 1
}

# 2. Pre-flight check: Frontend port 5180
$port5180Active = Get-NetTCPConnection -LocalPort 5180 -State Listen -ErrorAction SilentlyContinue
if ($port5180Active) {
    Write-Host "[ERROR] RailOpt-AI frontend port 5180 is already in use." -ForegroundColor Red
    Write-Host "Stop the existing process or configure another RailOpt-AI port." -ForegroundColor Yellow
    exit 1
}

Write-Host "Ports 8100 (Backend) and 5180 (Frontend) are available." -ForegroundColor Green

# 3. Start Backend
Write-Host "Starting RailOpt-AI backend on 127.0.0.1:8100..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"$root\run_backend.bat`""

# Wait for backend to be listening on port 8100
Write-Host "Waiting for backend to initialize..." -NoNewline -ForegroundColor Gray
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    $conn = Get-NetTCPConnection -LocalPort 8100 -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        break
    }
    Write-Host "." -NoNewline -ForegroundColor Gray
}
Write-Host " Ready!" -ForegroundColor Green

# 4. Start Frontend
Write-Host "Starting RailOpt-AI frontend on localhost:5180..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"$root\run_frontend.bat`""

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "       RAILOPT-AI" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:" -ForegroundColor White
Write-Host "http://localhost:5180" -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend:" -ForegroundColor White
Write-Host "http://127.0.0.1:8100" -ForegroundColor Yellow
Write-Host ""
Write-Host "API Docs:" -ForegroundColor White
Write-Host "http://127.0.0.1:8100/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Demo Accounts Password: RailOpt@2026" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Green
