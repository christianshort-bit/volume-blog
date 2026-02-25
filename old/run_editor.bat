@echo off
echo Starting Volume Blog Editor...

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b
)

if not exist "node_modules" (
    echo First time run detected. Installing dependencies...
    call npm install
)

echo Starting server...
call npm start
pause

