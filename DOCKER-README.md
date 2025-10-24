# Enhanced GPS Tracking System - Docker Deployment Guide
# Created by Eng. Nawoar Ekkou & Walace Cagnin

## 🚜 Docker Container for GPS Forklift Tracking

This directory contains Docker configuration for the Enhanced GPS Tracking System with animated forklift movement and colorful trails for the Göteborg facility.

### 🐳 Quick Start

#### Option 1: Docker Compose (Recommended)
```bash
# Build and start the GPS tracking system
docker-compose up -d

# View logs
docker-compose logs -f gps-tracker

# Stop the system
docker-compose down
```

#### Option 2: Docker Commands
```bash
# Build the image
docker build -t gps-forklift-tracker:latest .

# Run the container
docker run -d \
  --name gps-tracking-system \
  -p 8000:8000 \
  -v gps_data:/app/data \
  --restart unless-stopped \
  gps-forklift-tracker:latest

# View logs
docker logs -f gps-tracking-system

# Stop the container
docker stop gps-tracking-system
```

### 🌐 Access URLs (After Container Start)

- **🎨 Enhanced Demo**: http://localhost:8000/enhanced_demo.html
- **📊 Dashboard**: http://localhost:8000/dashboard/
- **🚜 Forklift Demo**: http://localhost:8000/test/forklift_demo.html
- **🌐 Static Demo**: http://localhost:8000/static_demo.html

### ✨ Container Features

- **🎯 Animated Movement**: 4 forklifts with realistic movement patterns
- **🌈 Colorful Trails**: Each forklift shows last 25 GPS points
- **📍 Göteborg Location**: Personalvägen 21, 418 78 Göteborg, Sweden
- **🔄 Auto-restart**: Container restarts automatically if it crashes
- **💾 Persistent Data**: GPS logs stored in Docker volumes
- **🛡️ Security**: Runs as non-root user
- **🏥 Health Checks**: Automatic container health monitoring

### 🔧 Container Configuration

- **Base Image**: Python 3.11 slim
- **Port**: 8000
- **User**: Non-root (gpsuser)
- **Volumes**: 
  - `gps_data`: GPS tracking data
  - `gps_logs`: Application logs
- **Network**: Bridge network for communication

### 📊 Monitoring

```bash
# Check container status
docker ps

# View container health
docker inspect gps-tracking-system | grep Health -A 10

# Monitor resource usage
docker stats gps-tracking-system

# Access container shell
docker exec -it gps-tracking-system /bin/bash
```

### 🚀 Production Deployment

For production use with nginx reverse proxy:
```bash
docker-compose --profile production up -d
```

This will start:
- GPS tracking system on port 8000
- Nginx reverse proxy on ports 80/443
- SSL termination (configure certificates in ./ssl/)

### 🛠️ Development

To run in development mode with live code changes:
```bash
docker run -d \
  --name gps-dev \
  -p 8000:8000 \
  -v $(pwd):/app \
  gps-forklift-tracker:latest
```

### 📍 Location Details

The containerized system simulates GPS tracking for:
- **Address**: Personalvägen 21, 418 78 Göteborg, Sweden
- **Coordinates**: 57.6870°N, 11.9755°E
- **Facility**: Industrial warehouse with 4 operational zones

### 👨‍💻 Credits

**Created by**: Eng. Nawoar Ekkou & Walace Cagnin  
**System**: Enhanced GPS Forklift Tracking with Animated Movement  
**Location**: Göteborg, Sweden  
**Version**: 1.0