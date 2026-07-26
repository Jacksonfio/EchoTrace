@echo off
title EchoTrace AI
echo ============================================
echo   EchoTrace AI - Starting Servers
echo ============================================
echo.

:: Set the project root
set PROJECT_DIR=%~dp0

:: Open Terminal 1 - Backend
echo [1/2] Starting Backend Server (port 3001)...
start "EchoTrace Backend" cmd /c "cd /d "%PROJECT_DIR%" && set PORT=3001 && npx tsx server\src\index.ts"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

:: Open Terminal 2 - Frontend
echo [2/2] Starting Frontend Server (port 3000)...
start "EchoTrace Frontend" cmd /c "cd /d "%PROJECT_DIR%apps\frontend" && npx next dev --port 3000"

echo.
echo ============================================
echo   Both servers starting...
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:3000
echo ============================================
echo.
echo   Open your browser to http://localhost:3000
echo.
pause
