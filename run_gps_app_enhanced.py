#!/usr/bin/env python3
"""
Enhanced GPS Tracking System - Python Development Server with Animated Movement
Created by Eng. Nawoar Ekkou & Walace Cagnin

This server provides animated forklift movement with trails and realistic GPS simulation.
"""

import http.server
import socketserver
import webbrowser
import os
import json
from urllib.parse import urlparse, parse_qs
import threading
import time
import math
import random
from datetime import datetime, timezone

# Enhanced Forklift configurations with movement patterns and colors
FORKLIFT_CONFIG = {
    'FORKLIFT_001': {
        'name': 'Alpha',
        'color': '#FF6B35',
        'zone': 'Main Building',
        'destinations': [
            {'lat': 57.6870, 'lng': 11.9755, 'name': 'Main Building'},
            {'lat': 57.6872, 'lng': 11.9750, 'name': 'Loading Dock'},
            {'lat': 57.6875, 'lng': 11.9745, 'name': 'Parking Area'},
            {'lat': 57.6873, 'lng': 11.9753, 'name': 'Service Bay'}
        ],
        'speed': 0.8,
        'pattern': 'patrol'
    },
    'FORKLIFT_002': {
        'name': 'Beta',
        'color': '#4ECDC4',
        'zone': 'Loading Area',
        'destinations': [
            {'lat': 57.6872, 'lng': 11.9750, 'name': 'Loading Area'},
            {'lat': 57.6868, 'lng': 11.9760, 'name': 'Storage Area'},
            {'lat': 57.6870, 'lng': 11.9755, 'name': 'Main Building'},
            {'lat': 57.6874, 'lng': 11.9748, 'name': 'Dock Exit'}
        ],
        'speed': 1.2,
        'pattern': 'circular'
    },
    'FORKLIFT_003': {
        'name': 'Gamma',
        'color': '#45B7D1',
        'zone': 'Storage Area',
        'destinations': [
            {'lat': 57.6868, 'lng': 11.9760, 'name': 'Storage Area'},
            {'lat': 57.6870, 'lng': 11.9757, 'name': 'Inventory Check'},
            {'lat': 57.6872, 'lng': 11.9762, 'name': 'Warehouse Exit'},
            {'lat': 57.6866, 'lng': 11.9758, 'name': 'Cold Storage'}
        ],
        'speed': 0.6,
        'pattern': 'route'
    },
    'FORKLIFT_004': {
        'name': 'Delta',
        'color': '#96CEB4',
        'zone': 'Parking Area',
        'destinations': [
            {'lat': 57.6875, 'lng': 11.9745, 'name': 'Parking Area'},
            {'lat': 57.6873, 'lng': 11.9748, 'name': 'Service Bay'},
            {'lat': 57.6877, 'lng': 11.9742, 'name': 'Fuel Station'},
            {'lat': 57.6876, 'lng': 11.9747, 'name': 'Charging Station'}
        ],
        'speed': 1.0,
        'pattern': 'maintenance'
    }
}

# Global state for forklift positions and trails
forklift_states = {}
forklift_trails = {}
movement_thread = None
running = True

def initialize_forklifts():
    """Initialize forklift positions and trails"""
    global forklift_states, forklift_trails
    
    for device_id, config in FORKLIFT_CONFIG.items():
        forklift_states[device_id] = {
            'current_lat': config['destinations'][0]['lat'],
            'current_lng': config['destinations'][0]['lng'],
            'target_destination': 0,
            'progress': 0.0,
            'last_update': time.time(),
            'speed_kmh': random.uniform(5, 15),
            'heading': random.uniform(0, 360),
            'status': 'moving'
        }
        forklift_trails[device_id] = []

def update_forklift_position(device_id):
    """Update forklift position based on movement pattern"""
    if device_id not in FORKLIFT_CONFIG:
        return
    
    config = FORKLIFT_CONFIG[device_id]
    state = forklift_states[device_id]
    
    # Get current and target destinations
    destinations = config['destinations']
    current_dest = destinations[state['target_destination']]
    
    # Calculate movement towards destination
    lat_diff = current_dest['lat'] - state['current_lat']
    lng_diff = current_dest['lng'] - state['current_lng']
    distance = math.sqrt(lat_diff**2 + lng_diff**2)
    
    # If close to destination, pick next destination
    if distance < 0.0001:  # About 10 meters
        state['target_destination'] = (state['target_destination'] + 1) % len(destinations)
        current_dest = destinations[state['target_destination']]
        lat_diff = current_dest['lat'] - state['current_lat']
        lng_diff = current_dest['lng'] - state['current_lng']
        distance = math.sqrt(lat_diff**2 + lng_diff**2)
        
        # Pause briefly at destination
        time.sleep(0.5)
    
    # Move towards destination
    if distance > 0:
        move_speed = config['speed'] * 0.00008  # Adjust movement speed
        move_ratio = min(move_speed / distance, 1.0)
        
        new_lat = state['current_lat'] + (lat_diff * move_ratio)
        new_lng = state['current_lng'] + (lng_diff * move_ratio)
        
        # Add some realistic movement variation
        variation = 0.00002
        new_lat += random.uniform(-variation, variation)
        new_lng += random.uniform(-variation, variation)
        
        state['current_lat'] = new_lat
        state['current_lng'] = new_lng
        
        # Calculate heading
        if lat_diff != 0 or lng_diff != 0:
            state['heading'] = (math.degrees(math.atan2(lng_diff, lat_diff)) + 90) % 360
        
        # Update speed based on movement
        base_speed = 8 + (config['speed'] * 5)
        state['speed_kmh'] = base_speed + random.uniform(-3, 3)
        state['status'] = 'moving'
    else:
        state['status'] = 'idle'
        state['speed_kmh'] = 0
    
    # Add to trail (keep last 25 points)
    current_time = datetime.now(timezone.utc)
    trail_point = {
        'lat': state['current_lat'],
        'lng': state['current_lng'],
        'timestamp': current_time.isoformat(),
        'speed': state['speed_kmh'],
        'heading': state['heading']
    }
    
    if device_id not in forklift_trails:
        forklift_trails[device_id] = []
    
    forklift_trails[device_id].append(trail_point)
    if len(forklift_trails[device_id]) > 25:
        forklift_trails[device_id].pop(0)

def movement_simulator():
    """Background thread to continuously update forklift positions"""
    global running
    while running:
        for device_id in FORKLIFT_CONFIG.keys():
            update_forklift_position(device_id)
        time.sleep(2)  # Update every 2 seconds

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
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"ok": True, "stored": True}
            self.wfile.write(json.dumps(response).encode())
            
        elif 'gps_latest.php' in parsed_path.path:
            # Simulate GPS data retrieval
            self.send_gps_data(parsed_path)
            
        elif 'dashboard_api.php' in parsed_path.path:
            # Simulate dashboard API
            self.send_dashboard_data(parsed_path)
            
        elif 'forklift_trails.php' in parsed_path.path:
            # New endpoint for forklift trails
            self.send_forklift_trails(parsed_path)
        else:
            self.send_error(404)
    
    def send_forklift_trails(self, parsed_path):
        """Send forklift trail data"""
        query_params = parse_qs(parsed_path.query)
        device_id = query_params.get('device_id', [''])[0]
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if device_id and device_id in forklift_trails:
            trails = forklift_trails[device_id]
        else:
            # Return all trails
            trails = forklift_trails
        
        response = {
            "ok": True,
            "trails": trails,
            "config": FORKLIFT_CONFIG
        }
        
        self.wfile.write(json.dumps(response).encode())
    
    def send_gps_data(self, parsed_path):
        """Send simulated GPS data for devices"""
        query_params = parse_qs(parsed_path.query)
        device_id = query_params.get('device_id', [''])[0]
        limit = int(query_params.get('limit', [10])[0])
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if device_id in forklift_states:
            state = forklift_states[device_id]
            config = FORKLIFT_CONFIG[device_id]
            
            # Get current destination info
            dest = config['destinations'][state['target_destination']]
            
            response = {
                "ok": True,
                "count": 1,
                "data": [{
                    "timestamp_server_utc": datetime.now(timezone.utc).isoformat(),
                    "device_id": device_id,
                    "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                    "lat": round(state['current_lat'], 6),
                    "lng": round(state['current_lng'], 6),
                    "speed_kmh": round(state['speed_kmh'], 1),
                    "alt_m": round(102 + random.uniform(-2, 2), 1),
                    "sats": random.randint(6, 12),
                    "hdop": round(random.uniform(0.8, 2.0), 1),
                    "ip": f"192.168.1.{101 + int(device_id[-1]) - 1}",
                    "heading": round(state['heading'], 1),
                    "status": state['status'],
                    "destination": dest['name'],
                    "zone": config['zone']
                }]
            }
        else:
            # Return all devices
            all_data = []
            for dev_id, state in forklift_states.items():
                config = FORKLIFT_CONFIG[dev_id]
                dest = config['destinations'][state['target_destination']]
                
                all_data.append({
                    "timestamp_server_utc": datetime.now(timezone.utc).isoformat(),
                    "device_id": dev_id,
                    "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                    "lat": round(state['current_lat'], 6),
                    "lng": round(state['current_lng'], 6),
                    "speed_kmh": round(state['speed_kmh'], 1),
                    "alt_m": round(102 + random.uniform(-2, 2), 1),
                    "sats": random.randint(6, 12),
                    "hdop": round(random.uniform(0.8, 2.0), 1),
                    "ip": f"192.168.1.{101 + int(dev_id[-1]) - 1}",
                    "heading": round(state['heading'], 1),
                    "status": state['status'],
                    "destination": dest['name'],
                    "zone": config['zone']
                })
            
            response = {
                "ok": True,
                "count": len(all_data),
                "data": all_data
            }
        
        self.wfile.write(json.dumps(response).encode())
    
    def send_dashboard_data(self, parsed_path):
        """Send dashboard API data"""
        query_params = parse_qs(parsed_path.query)
        action = query_params.get('action', [''])[0]
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if action == 'get_devices':
            devices = []
            for device_id, state in forklift_states.items():
                config = FORKLIFT_CONFIG[device_id]
                dest = config['destinations'][state['target_destination']]
                
                devices.append({
                    "device_id": device_id,
                    "name": config['name'],
                    "zone": config['zone'],
                    "color": config['color'],
                    "status": state['status'],
                    "last_seen": datetime.now(timezone.utc).isoformat(),
                    "lastLocation": {
                        "lat": round(state['current_lat'], 6),
                        "lng": round(state['current_lng'], 6),
                        "speed_kmh": round(state['speed_kmh'], 1),
                        "heading": round(state['heading'], 1)
                    },
                    "destination": dest['name'],
                    "trail": forklift_trails.get(device_id, [])
                })
            
            response = {
                "ok": True,
                "devices": devices
            }
        else:
            response = {"ok": False, "error": "Unknown action"}
        
        self.wfile.write(json.dumps(response).encode())

def start_server(port=None):
    """Start the enhanced GPS tracking server"""
    global movement_thread, running
    
    # Initialize forklifts
    initialize_forklifts()
    
    # Start movement simulation in background
    movement_thread = threading.Thread(target=movement_simulator, daemon=True)
    movement_thread.start()
    
    # Use provided port or default to 8000, but prefer environment variable for Azure
    if port is None:
        port = int(os.environ.get('PORT', 8000))
    
    try:
        with socketserver.TCPServer(("", port), GPSRequestHandler) as httpd:
            print("🚜 Enhanced GPS Tracking System - Development Server")
            print("=" * 55)
            print("👨‍💻 Created by Eng. Nawoar Ekkou & Walace Cagnin")
            print()
            print(f"🚀 Starting enhanced server on port {port}...")
            
            # Different messages for local vs Azure deployment
            if os.environ.get('WEBSITE_HOSTNAME'):
                # Running on Azure App Service
                hostname = os.environ.get('WEBSITE_HOSTNAME')
                print(f"✅ Server running on Azure: https://{hostname}")
                print()
                print("🔗 Available URLs:")
                print(f"   🚜 Forklift Demo: https://{hostname}/test/forklift_demo.html")
                print(f"   📊 Dashboard: https://{hostname}/dashboard/")
                print(f"   🌐 Static Demo: https://{hostname}/static_demo.html")
                print(f"   🎨 Enhanced Demo: https://{hostname}/enhanced_demo.html")
            else:
                # Running locally
                print(f"✅ Server running at: http://localhost:{port}")
                print()
                print("🔗 Available URLs:")
                print(f"   🚜 Forklift Demo: http://localhost:{port}/test/forklift_demo.html")
                print(f"   📊 Dashboard: http://localhost:{port}/dashboard/")
                print(f"   🌐 Static Demo: http://localhost:{port}/static_demo.html")
                print(f"   🎨 Enhanced Demo: http://localhost:{port}/enhanced_demo.html")
            
            print()
            print("✨ NEW FEATURES:")
            print("   🎯 Animated forklift movement")
            print("   🌈 Color-coded forklift trails (last 25 points)")
            print("   🗺️  Different destinations and routes")
            print("   📍 Real-time position updates")
            print()
            print("⏹️  Press Ctrl+C to stop the server")
            print()
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down server...")
        running = False
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Port {port} is already in use")
            print("Try using a different port or stop the existing server")
        else:
            print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    start_server()