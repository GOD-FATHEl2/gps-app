# Enhanced GPS Tracking System - Docker Image
# Created by Eng. Nawoar Ekkou & Walace Cagnin
# 
# This Dockerfile creates a containerized version of the animated GPS forklift tracking system
# with real-time movement simulation and colorful trails for Göteborg facility.

FROM python:3.11-slim

# Set metadata
LABEL maintainer="Eng. Nawoar Ekkou & Walace Cagnin"
LABEL description="Enhanced GPS Forklift Tracking System with Animated Movement"
LABEL version="1.0"
LABEL location="Göteborg, Sweden"

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8000

# Create non-root user for security
RUN groupadd -r gpsuser && useradd -r -g gpsuser gpsuser

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create data directory for GPS logs
RUN mkdir -p data && chown -R gpsuser:gpsuser /app

# Switch to non-root user
USER gpsuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/enhanced_demo.html || exit 1

# Start the enhanced GPS tracking server
CMD ["python", "run_gps_app_enhanced.py"]