@echo off
title Lets-Do-It-Windows Launcher

:: Ask if Gemini API key is in the .env file
echo Did you insert your Gemini API key into the .env file? (Y/N)
set /p answer="> "

if /i "%answer%"=="Y" (
    echo Great! Continuing...
) else (
    echo Please add your Gemini API key to the .env file first.
    pause
    exit /b
)

echo ------------------------------------------------------
echo   🚀 Launching Lets-Do-It-Windows (Vite Dev Server)
echo ------------------------------------------------------
echo.

:: Check Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed.
    echo Download it from: https://nodejs.org
    pause
    exit /b
)

:: Install dependencies if needed
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ npm install failed. Fix the errors above.
        pause
        exit /b
    )
) else (
    echo 📦 Dependencies already installed.
)

echo.
echo ▶️ Starting Vite dev server...
echo (Leave this window OPEN to keep the server running)
echo.

:: Run vite dev server
start "" http://localhost:5173

call npm run dev

echo.
echo ❌ Dev server stopped or crashed.
echo Check the error above.
pause
