@echo off
title RailOpt-AI Backend (Port 8100)
cd /d "%~dp0backend"
echo =====================================
echo  Starting RailOpt-AI Backend on :8100
echo =====================================
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8100
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Backend exited with error code %ERRORLEVEL%
    pause
)
