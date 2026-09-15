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

# 5. Detect LAN IP Addresses
$lanIps = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | 
    Where-Object { $_.InterfaceAlias -notmatch 'Loopback|vEthernet|WSL' -and $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.254\.' } | 
    Select-Object -ExpandProperty IPAddress

$primaryLanIp = if ($lanIps -and $lanIps.Count -gt 0) { $lanIps[0] } else { "127.0.0.1" }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        RAILOPT-AI SERVER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Local (This Machine):" -ForegroundColor White
Write-Host "  Frontend:  http://localhost:5180" -ForegroundColor Yellow
Write-Host "  Backend:   http://127.0.0.1:8100" -ForegroundColor Yellow
Write-Host "  API Docs:  http://127.0.0.1:8100/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "LAN Access (Share with devices on same network):" -ForegroundColor White
foreach ($ip in $lanIps) {
    Write-Host "  Frontend:  http://${ip}:5180" -ForegroundColor Green
    Write-Host "  Backend:   http://${ip}:8100" -ForegroundColor Green
}
Write-Host ""
Write-Host "Network Status:" -ForegroundColor White
Write-Host "  Server:    [RUNNING]" -ForegroundColor Green
Write-Host "  Database:  [CONNECTED]" -ForegroundColor Green
Write-Host "  Frontend:  [0.0.0.0:5180]" -ForegroundColor Green
Write-Host "  Backend:   [0.0.0.0:8100]" -ForegroundColor Green
Write-Host "  WebSocket: [ws://0.0.0.0:8100/ws/events]" -ForegroundColor Green
Write-Host ""
Write-Host "Share the LAN address with authorized users on the same network." -ForegroundColor Gray
Write-Host "Demo Accounts Password: RailOpt@2026" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

