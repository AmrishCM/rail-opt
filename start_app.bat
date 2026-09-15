@echo off
title RailOpt-AI Launcher
echo =====================================
echo        RAILOPT-AI LAUNCHER
echo =====================================
echo.
echo Starting Backend on http://127.0.0.1:8100 ...
start "RailOpt-AI Backend" cmd /k "%~dp0run_backend.bat"

echo Starting Frontend on http://localhost:5180 ...
start "RailOpt-AI Frontend" cmd /k "%~dp0run_frontend.bat"

echo.
echo =====================================
echo        RAILOPT-AI IS STARTING
echo =====================================
echo Frontend:  http://localhost:5180
echo Backend:   http://127.0.0.1:8100
echo API Docs:  http://127.0.0.1:8100/docs
echo Demo Pass: RailOpt@2026
echo =====================================
