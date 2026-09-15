@echo off
title RailOpt-AI Frontend (Port 5180)
cd /d "%~dp0frontend"
echo =====================================
echo Starting RailOpt-AI Frontend on :5180
echo =====================================
npm run dev
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Frontend exited with error code %ERRORLEVEL%
    pause
)
