#!/bin/bash
# Enhanced GPS Tracking System - Docker Build and Deploy Script
# Created by Eng. Nawoar Ekkou & Walace Cagnin

set -e

echo "🚜 Enhanced GPS Tracking System - Docker Deployment"
echo "=" * 60
echo "👨‍💻 Created by Eng. Nawoar Ekkou & Walace Cagnin"
echo "📍 Location: Personalvägen 21, 418 78 Göteborg, Sweden"
echo ""

# Function to print colored output
print_status() {
    echo -e "\033[1;32m✅ $1\033[0m"
}

print_info() {
    echo -e "\033[1;34m🔵 $1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m⚠️  $1\033[0m"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose not found. Using 'docker compose' instead."
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

print_info "Building GPS tracking system Docker image..."
docker build -t gps-forklift-tracker:latest .
print_status "Docker image built successfully"

print_info "Starting GPS tracking system containers..."
$COMPOSE_CMD up -d
print_status "Containers started successfully"

echo ""
echo "🌐 GPS Tracking System is now running!"
echo "📱 Access your animated forklift tracking at:"
echo "   🎨 Enhanced Demo: http://localhost:8000/enhanced_demo.html"
echo "   📊 Dashboard: http://localhost:8000/dashboard/"
echo "   🚜 Forklift Demo: http://localhost:8000/test/forklift_demo.html"
echo ""
echo "🔧 Useful commands:"
echo "   📊 View logs: $COMPOSE_CMD logs -f"
echo "   ⏹️  Stop system: $COMPOSE_CMD down"
echo "   🔄 Restart: $COMPOSE_CMD restart"
echo "   📈 Monitor: docker stats gps-tracking-system"
echo ""
echo "✨ Features included:"
echo "   🎯 Real-time animated forklift movement"
echo "   🌈 Color-coded trails (last 25 GPS points)"
echo "   📍 4 different routes around Göteborg facility"
echo "   🔄 Automatic container restart"
echo "   💾 Persistent data storage"
echo ""

print_status "GPS Tracking System deployment complete! 🎉"