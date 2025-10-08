@echo off
REM Enhanced GPS Tracking System - Docker Build and Deploy Script (Windows)
REM Created by Eng. Nawoar Ekkou & Walace Cagnin

echo.
echo 🚜 Enhanced GPS Tracking System - Docker Deployment
echo ============================================================
echo 👨‍💻 Created by Eng. Nawoar Ekkou ^& Walace Cagnin
echo 📍 Location: Personalvägen 21, 418 78 Göteborg, Sweden
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

echo 🔵 Building GPS tracking system Docker image...
docker build -t gps-forklift-tracker:latest .
if %errorlevel% neq 0 (
    echo ❌ Docker build failed
    pause
    exit /b 1
)
echo ✅ Docker image built successfully

echo.
echo 🔵 Starting GPS tracking system containers...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ Failed to start containers
    pause
    exit /b 1
)
echo ✅ Containers started successfully

echo.
echo 🌐 GPS Tracking System is now running!
echo 📱 Access your animated forklift tracking at:
echo    🎨 Enhanced Demo: http://localhost:8000/enhanced_demo.html
echo    📊 Dashboard: http://localhost:8000/dashboard/
echo    🚜 Forklift Demo: http://localhost:8000/test/forklift_demo.html
echo.
echo 🔧 Useful commands:
echo    📊 View logs: docker-compose logs -f
echo    ⏹️  Stop system: docker-compose down
echo    🔄 Restart: docker-compose restart
echo    📈 Monitor: docker stats gps-tracking-system
echo.
echo ✨ Features included:
echo    🎯 Real-time animated forklift movement
echo    🌈 Color-coded trails (last 25 GPS points)
echo    📍 4 different routes around Göteborg facility
echo    🔄 Automatic container restart
echo    💾 Persistent data storage
echo.
echo ✅ GPS Tracking System deployment complete! 🎉
echo.
pause