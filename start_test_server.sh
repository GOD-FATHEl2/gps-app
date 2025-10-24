#!/bin/bash

# Forklift GPS System Test Runner
# Created by Eng. Nawoar Ekkou & Walace Cagnin

echo "🚜 Forklift GPS Tracking System - Test Environment"
echo "=================================================="
echo "👨‍💻 Created by Eng. Nawoar Ekkou & Walace Cagnin"
echo ""

# Check if PHP is installed
if ! command -v php &> /dev/null; then
    echo "❌ PHP is required but not installed."
    echo "Please install PHP and try again."
    exit 1
fi

echo "✅ PHP is available"

# Check current directory
if [ ! -f "api/config.php" ]; then
    echo "❌ Please run this script from the Gps-System root directory"
    exit 1
fi

echo "✅ GPS System files found"

# Start PHP built-in server
echo ""
echo "🚀 Starting PHP Development Server..."
echo "📡 Server will be available at: http://localhost:8000"
echo ""
echo "🔗 Available URLs:"
echo "   📊 Dashboard: http://localhost:8000/dashboard/"
echo "   🚜 Forklift Demo: http://localhost:8000/test/forklift_demo.html"
echo "   🧪 Test Generator: http://localhost:8000/test/forklift_test_generator.php"
echo "   📡 API Test: http://localhost:8000/api/dashboard_api.php?action=stats"
echo ""
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

# Start server in the current directory
php -S localhost:8000 -t .