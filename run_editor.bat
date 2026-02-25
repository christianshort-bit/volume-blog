@echo off
setlocal EnableDelayedExpansion

:menu
cls
echo ==========================================
echo      Volume Blog Editor & Uploader
echo ==========================================
echo.
echo  1. Run Editor (Local Server)
echo  2. Upload Blog to GitHub
echo  3. Exit
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" goto run_editor
if "%choice%"=="2" goto upload_blog
if "%choice%"=="3" exit /b

echo Invalid choice. Please try again.
pause
goto menu

:run_editor
cls
echo Starting Volume Blog Editor...

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    goto menu
)

if not exist "node_modules" (
    echo First time run detected. Installing dependencies...
    call npm install
)

echo Starting server...
call npm start
pause
goto menu

:upload_blog
cls
echo.
echo Preparing to upload to GitHub...
echo.

:: Check for Git and find executable
set "GIT_CMD="
where git >nul 2>nul
if %errorlevel% equ 0 (
    set "GIT_CMD=git"
) else if exist "C:\Program Files\Git\cmd\git.exe" (
    set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"
) else if exist "C:\Program Files\Git\bin\git.exe" (
    set "GIT_CMD=C:\Program Files\Git\bin\git.exe"
) else if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" (
    set "GIT_CMD=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
) else if exist "C:\Users\crs\.gemini\antigravity\scratch\mingit\cmd\git.exe" (
    set "GIT_CMD=C:\Users\crs\.gemini\antigravity\scratch\mingit\cmd\git.exe"
) else (
    echo [ERROR] Git is not recognized or not found in common locations!
    echo Please install Git for Windows from https://gitforwindows.org/
    echo.
    pause
    goto menu
)

if not exist ".git" (
    echo Initializing Git repository...
    "!GIT_CMD!" init
    "!GIT_CMD!" branch -M main
    "!GIT_CMD!" remote add origin https://github.com/christianshort-bit/volume-blog.git
)

echo Do you need to set/update GitHub credentials for this repository?
echo [If you have git configured or use GitHub Desktop, press N]
set /p update_creds="Enter credentials? (y/N): "
if /I "!update_creds!"=="y" (
    echo.
    echo WARNING: You will need a GitHub Personal Access Token ^(PAT^).
    echo GitHub no longer supports account passwords for command-line access.
    echo.
    set /p "GIT_USER=Enter GitHub Username: "
    set /p "GIT_TOKEN=Enter GitHub Token: "
    "!GIT_CMD!" remote set-url origin https://!GIT_USER!:!GIT_TOKEN!@github.com/christianshort-bit/volume-blog.git
    
    :: Also configure global identity so git doesn't complain about author info
    "!GIT_CMD!" config --global user.name "!GIT_USER!"
    "!GIT_CMD!" config --global user.email "!GIT_USER!@users.noreply.github.com"
    
    echo Credentials saved for this session.
    echo.
)

echo Pulling remote changes to synchronize...
"!GIT_CMD!" pull origin main --rebase --autostash >nul 2>nul
if !errorlevel! neq 0 (
    echo Note: Remote might be empty or first push, continuing with upload...
)

echo.
echo Adding changes...
"!GIT_CMD!" add .

echo.
echo Committing changes...
:: Get date/time for commit message
set "curTimestamp=%date% %time%"
"!GIT_CMD!" commit -m "Blog update: !curTimestamp!"

echo.
echo Pushing to GitHub...
"!GIT_CMD!" push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Git push failed.
    echo Please check your internet connection and GitHub credentials.
) else (
    echo.
    echo [SUCCESS] Blog uploaded successfully!
)

pause
goto menu
