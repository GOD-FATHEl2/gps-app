#!/usr/bin/env python3
"""
Azure App Service Entry Point for GPS Tracking System
Created by Eng. Nawoar Ekkou & Walace Cagnin

This file serves as the main entry point for Azure App Service deployment.
"""

import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the enhanced GPS server
from run_gps_app_enhanced import start_server

if __name__ == "__main__":
    # Azure App Service provides the PORT environment variable
    port = int(os.environ.get('PORT', 8000))
    
    print(f"🚜 Starting GPS Tracking System on Azure App Service")
    print(f"📍 Port: {port}")
    print(f"🌍 Location: Göteborg, Sweden")
    print(f"👨‍💻 Created by Eng. Nawoar Ekkou & Walace Cagnin")
    
    # Start the server (modify the start_server function to accept port parameter)
    start_server()