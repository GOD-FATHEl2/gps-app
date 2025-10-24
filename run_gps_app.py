#!/usr/bin/env python3
"""
GPS Tracking System - Python Development Server
Created by Eng. Nawoar Ekkou & Walace Cagnin

This server provides a quick way to run the GPS tracking system demo
without needing PHP installation.
"""

import http.server
import socketserver
import webbrowser
import os
import json
from urllib.parse import urlparse, parse_qs
import threading
import time

class GPSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # Handle API requests
        if parsed_path.path.startswith('/api/'):
            self.handle_api_request(parsed_path)
        else:
            # Serve static files
            super().do_GET()
    
    def do_POST(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path.startswith('/api/'):
            self.handle_api_request(parsed_path)
        else:
            self.send_error(404)
    
    def handle_api_request(self, parsed_path):
        """Handle API requests with simulated responses"""
        
        if 'gps_ingest.php' in parsed_path.path:
            # Simulate GPS data ingestion
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"ok": True, "stored": True}
            self.wfile.write(json.dumps(response).encode())
            
        elif 'gps_latest.php' in parsed_path.path:
            # Simulate GPS data retrieval
            self.send_gps_data(parsed_path)
            
        elif 'dashboard_api.php' in parsed_path.path:
            # Simulate dashboard API
            self.send_dashboard_data(parsed_path)
        else:
            self.send_error(404)
    
    def send_gps_data(self, parsed_path):
        """Send simulated GPS data for devices"""
        query_params = parse_qs(parsed_path.query)
        device_id = query_params.get('device_id', [''])[0]
        limit = int(query_params.get('limit', [10])[0])
        
        # Simulated forklift data - Göteborg, Sweden location
        # Personalvägen 21, 418 78 Göteborg coordinates: 57.6870, 11.9755
        forklift_data = {
            'FORKLIFT_001': {'lat': 57.6870, 'lng': 11.9755, 'speed': 8.5},   # Main building
            'FORKLIFT_002': {'lat': 57.6872, 'lng': 11.9750, 'speed': 6.2},   # Loading area
            'FORKLIFT_003': {'lat': 57.6868, 'lng': 11.9760, 'speed': 12.8},  # Storage area
            'FORKLIFT_004': {'lat': 57.6875, 'lng': 11.9745, 'speed': 4.3}    # Parking area
        }
        
        if device_id in forklift_data:
            data = forklift_data[device_id]
            response = {
                "ok": True,
                "count": 1,
                "data": [{
                    "timestamp_server_utc": "2025-10-08T14:30:25Z",
                    "device_id": device_id,
                    "timestamp_utc": "2025-10-08T14:30:23Z",
                    "lat": data['lat'],
                    "lng": data['lng'],
                    "speed_kmh": data['speed'],
                    "alt_m": 102.0,
                    "sats": 8,
                    "hdop": 1.5,
                    "ip": "192.168.1.100"
                }]
            }
        else:
            response = {"ok": False, "error": "device_not_found"}
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def send_dashboard_data(self, parsed_path):
        """Send dashboard API data"""
        query_params = parse_qs(parsed_path.query)
        action = query_params.get('action', ['devices'])[0]
        
        if action == 'devices':
            response = {
                "ok": True,
                "devices": [
                    {
                        "device_id": "FORKLIFT_001",
                        "locations": [{"lat": 57.6870, "lng": 11.9755, "speed_kmh": 8.5}],
                        "last_seen": "2025-10-08T14:30:25Z",
                        "total_points": 25,
                        "is_online": True
                    },
                    {
                        "device_id": "FORKLIFT_002", 
                        "locations": [{"lat": 57.6872, "lng": 11.9750, "speed_kmh": 6.2}],
                        "last_seen": "2025-10-08T14:30:23Z",
                        "total_points": 28,
                        "is_online": True
                    },
                    {
                        "device_id": "FORKLIFT_003",
                        "locations": [{"lat": 57.6868, "lng": 11.9760, "speed_kmh": 12.8}],
                        "last_seen": "2025-10-08T14:30:21Z", 
                        "total_points": 31,
                        "is_online": True
                    },
                    {
                        "device_id": "FORKLIFT_004",
                        "locations": [{"lat": 57.6875, "lng": 11.9745, "speed_kmh": 4.3}],
                        "last_seen": "2025-10-08T14:30:27Z",
                        "total_points": 19,
                        "is_online": True
                    }
                ],
                "count": 4
            }
        elif action == 'stats':
            response = {
                "ok": True,
                "stats": {
                    "total_points": 103,
                    "unique_devices": 4,
                    "active_devices": 4,
                    "devices": {
                        "FORKLIFT_001": {"points": 25, "is_active": True},
                        "FORKLIFT_002": {"points": 28, "is_active": True},
                        "FORKLIFT_003": {"points": 31, "is_active": True},
                        "FORKLIFT_004": {"points": 19, "is_active": True}
                    }
                }
            }
        else:
            response = {"ok": False, "error": "invalid_action"}
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())

def start_server():
    """Start the GPS tracking system server"""
    PORT = 8000
    
    print("🚜 GPS Tracking System - Development Server")
    print("=" * 50)
    print("👨‍💻 Created by Eng. Nawoar Ekkou & Walace Cagnin")
    print("")
    print(f"🚀 Starting server on port {PORT}...")
    
    try:
        with socketserver.TCPServer(("", PORT), GPSRequestHandler) as httpd:
            print(f"✅ Server running at: http://localhost:{PORT}")
            print("")
            print("🔗 Available URLs:")
            print(f"   🚜 Forklift Demo: http://localhost:{PORT}/test/forklift_demo.html")
            print(f"   📊 Dashboard: http://localhost:{PORT}/dashboard/")
            print(f"   🌐 Static Demo: http://localhost:{PORT}/static_demo.html")
            print("")
            print("⏹️  Press Ctrl+C to stop the server")
            print("")
            
            # Auto-open browser after a short delay
            def open_browser():
                time.sleep(2)
                webbrowser.open(f'http://localhost:{PORT}/static_demo.html')
            
            browser_thread = threading.Thread(target=open_browser)
            browser_thread.daemon = True
            browser_thread.start()
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except OSError as e:
        if e.errno == 10048:  # Port already in use
            print(f"❌ Port {PORT} is already in use")
            print("Try using a different port or stop the existing server")
        else:
            print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    # Change to the GPS system directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    start_server()