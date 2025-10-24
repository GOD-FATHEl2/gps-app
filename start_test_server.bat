@echo off
REM Forklift GPS System Test Runner for Windows
REM Created by Eng. Nawoar Ekkou & Walace Cagnin

echo.
echo 🚜 Forklift GPS Tracking System - Test Environment
echo ==================================================
echo 👨‍💻 Created by Eng. Nawoar Ekkou ^& Walace Cagnin
echo.

REM Check if PHP is installed
php --version >nul 2>&1
if errorlevel 1 (
    echo ❌ PHP is required but not installed.
    echo Please install PHP and add it to your PATH.
    pause
    exit /b 1
)

echo ✅ PHP is available

REM Check current directory
if not exist "api\config.php" (
    echo ❌ Please run this script from the Gps-System root directory
    pause
    exit /b 1
)

echo ✅ GPS System files found

REM Start PHP built-in server
echo.
echo 🚀 Starting PHP Development Server...
echo 📡 Server will be available at: http://localhost:8000
echo.
echo 🔗 Available URLs:
echo    📊 Dashboard: http://localhost:8000/dashboard/
echo    🚜 Forklift Demo: http://localhost:8000/test/forklift_demo.html
echo    🧪 Test Generator: http://localhost:8000/test/forklift_test_generator.php
echo    📡 API Test: http://localhost:8000/api/dashboard_api.php?action=stats
echo.
echo ⏹️  Press Ctrl+C to stop the server
echo.

REM Start server in the current directory
php -S localhost:8000 -t .