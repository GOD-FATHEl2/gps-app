class GPSDashboard {
    constructor() {
        this.map = null;
        this.devices = new Map();
        this.deviceMarkers = new Map();
        this.deviceTrails = new Map();
        this.deviceTrailLines = new Map(); // Store polyline objects for trails
        this.isAutoRefresh = true;
        this.refreshInterval = 3000; // 3 seconds for more fluid animation
        this.maxTrailPoints = 25; // Last 25 points for each device
        this.showTrails = true;
        this.currentDeviceFilter = '';
        this.selectedDevice = null;
        this.deviceColors = new Map(); // Store colors for each device
        this.availableColors = ['#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#E74C3C', '#9B59B6', '#F39C12', '#2ECC71'];
        this.colorIndex = 0;
        
        this.init();
    }

    async init() {
        this.showLoading(true);
        this.initMap();
        this.setupEventListeners();
        this.loadDevicesFromStorage();
        await this.refreshAllDevices();
        this.startAutoRefresh();
        this.updateConnectionStatus('online');
        this.showLoading(false);
    }

    initMap() {
        // Initialize Leaflet map
        this.map = L.map('map').setView([57.6870, 11.9755], 16); // Default to Göteborg, Sweden

        // Add tile layers
        this.streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        });

        this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri'
        });

        // Add default layer
        this.streetLayer.addTo(this.map);
        this.currentLayer = 'street';

        // Custom icons
        this.createCustomIcons();
    }

    createCustomIcons() {
        this.deviceIcons = {
            online: L.divIcon({
                className: 'custom-marker online-marker',
                html: '<i class="fas fa-location-arrow"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            }),
            offline: L.divIcon({
                className: 'custom-marker offline-marker',
                html: '<i class="fas fa-location-arrow"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            }),
            selected: L.divIcon({
                className: 'custom-marker selected-marker',
                html: '<i class="fas fa-location-arrow"></i>',
                iconSize: [35, 35],
                iconAnchor: [17.5, 17.5]
            })
        };

        // Add custom marker styles to document
        this.addCustomMarkerStyles();
    }

    addCustomMarkerStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .custom-marker {
                background: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            }
            .online-marker {
                background: #4CAF50;
                color: white;
            }
            .offline-marker {
                background: #F44336;
                color: white;
            }
            .selected-marker {
                background: #2196F3;
                color: white;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(33, 150, 243, 0); }
                100% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Header controls
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refreshAllDevices();
        });

        // Device filter
        document.getElementById('device-filter').addEventListener('input', (e) => {
            this.currentDeviceFilter = e.target.value.toLowerCase();
            this.updateDeviceList();
        });

        // Add device button
        document.getElementById('add-device-btn').addEventListener('click', () => {
            this.showAddDeviceModal();
        });

        // Settings
        document.getElementById('auto-refresh').addEventListener('change', (e) => {
            this.isAutoRefresh = e.target.checked;
            if (this.isAutoRefresh) {
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        });

        document.getElementById('show-trails').addEventListener('change', (e) => {
            this.showTrails = e.target.checked;
            this.toggleTrails();
        });

        document.getElementById('max-points').addEventListener('change', (e) => {
            this.maxTrailPoints = parseInt(e.target.value);
            this.updateAllTrails();
        });

        // Map controls
        document.getElementById('center-all-btn').addEventListener('click', () => {
            this.centerAllDevices();
        });

        document.getElementById('toggle-satellite-btn').addEventListener('click', () => {
            this.toggleMapLayer();
        });

        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Device info panel
        document.getElementById('close-info-btn').addEventListener('click', () => {
            this.hideDeviceInfo();
        });

        // Modal controls
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            this.hideAddDeviceModal();
        });

        document.getElementById('cancel-device-btn').addEventListener('click', () => {
            this.hideAddDeviceModal();
        });

        document.getElementById('add-device-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewDevice();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAddDeviceModal();
                this.hideDeviceInfo();
            } else if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                e.preventDefault();
                this.refreshAllDevices();
            }
        });
    }

    async refreshAllDevices() {
        this.updateConnectionStatus('connecting');
        const deviceIds = Array.from(this.devices.keys());
        
        if (deviceIds.length === 0) {
            this.updateConnectionStatus('online');
            return;
        }

        try {
            const promises = deviceIds.map(deviceId => this.fetchDeviceData(deviceId));
            await Promise.all(promises);
            this.updateConnectionStatus('online');
            this.updateStats();
            this.updateLastUpdateTime();
        } catch (error) {
            console.error('Error refreshing devices:', error);
            this.updateConnectionStatus('offline');
        }
    }

    async fetchDeviceData(deviceId, limit = 10) {
        try {
            const response = await fetch(`api/gps_latest.php?device_id=${encodeURIComponent(deviceId)}&limit=${limit}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.ok && data.data.length > 0) {
                this.updateDeviceLocation(deviceId, data.data);
                return data.data;
            } else {
                console.warn(`No data for device ${deviceId}`);
                return [];
            }
        } catch (error) {
            console.error(`Error fetching data for device ${deviceId}:`, error);
            this.markDeviceOffline(deviceId);
            throw error;
        }
    }

    updateDeviceLocation(deviceId, locationData) {
        const device = this.devices.get(deviceId);
        if (!device) return;

        const latestLocation = locationData[locationData.length - 1];
        
        // Update device data
        device.lastLocation = latestLocation;
        device.lastSeen = new Date(latestLocation.timestamp_server_utc);
        device.isOnline = this.isDeviceOnline(device.lastSeen);
        
        // Update or create marker
        this.updateDeviceMarker(deviceId, latestLocation);
        
        // Update trail
        if (this.showTrails) {
            this.updateDeviceTrail(deviceId, locationData);
        }

        // Update device list
        this.updateDeviceList();

        // Update info panel if this device is selected
        if (this.selectedDevice === deviceId) {
            this.showDeviceInfo(deviceId);
        }
    }

    updateDeviceMarker(deviceId, location) {
        const device = this.devices.get(deviceId);
        const isSelected = this.selectedDevice === deviceId;
        
        // Assign color to device if not already assigned
        if (!this.deviceColors.has(deviceId)) {
            this.deviceColors.set(deviceId, this.availableColors[this.colorIndex % this.availableColors.length]);
            this.colorIndex++;
        }
        
        const deviceColor = this.deviceColors.get(deviceId);
        
        // Create animated forklift icon with device color
        const forkliftIcon = this.createAnimatedForkliftIcon(deviceColor, location.heading || 0, isSelected);
        
        if (this.deviceMarkers.has(deviceId)) {
            // Update existing marker with smooth animation
            const marker = this.deviceMarkers.get(deviceId);
            const currentPos = marker.getLatLng();
            const newPos = [location.lat, location.lng];
            
            // Animate movement if position changed significantly
            const distance = this.map.distance(currentPos, newPos);
            if (distance > 1) { // More than 1 meter
                this.animateMarkerMovement(marker, currentPos, newPos, 2000); // 2 second animation
            }
            
            marker.setIcon(forkliftIcon);
        } else {
            // Create new marker
            const marker = L.marker([location.lat, location.lng], { icon: forkliftIcon })
                .bindPopup(this.createPopupContent(deviceId, location))
                .on('click', () => {
                    this.selectDevice(deviceId);
                });
            
            marker.addTo(this.map);
            this.deviceMarkers.set(deviceId, marker);
        }
        
        // Update device trail
        this.updateDeviceTrail(deviceId, location);
    }

    createAnimatedForkliftIcon(color, heading = 0, isSelected = false) {
        const size = isSelected ? 28 : 24;
        const borderWidth = isSelected ? 4 : 3;
        
        return L.divIcon({
            html: `<div style="
                background: ${color};
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                border: ${borderWidth}px solid white;
                box-shadow: 0 3px 8px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                transform: rotate(${heading}deg);
                transition: all 0.3s ease;
                position: relative;
            ">
                <span style="
                    color: white; 
                    font-size: ${size * 0.5}px; 
                    font-weight: bold;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                    transform: rotate(-${heading}deg);
                ">🚜</span>
                ${isSelected ? `<div style="
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    width: 12px;
                    height: 12px;
                    background: #27ae60;
                    border-radius: 50%;
                    border: 2px solid white;
                    animation: pulse 1.5s infinite;
                "></div>` : ''}
            </div>`,
            className: 'animated-forklift-icon',
            iconSize: [size + borderWidth * 2, size + borderWidth * 2],
            iconAnchor: [(size + borderWidth * 2) / 2, (size + borderWidth * 2) / 2]
        });
    }

    animateMarkerMovement(marker, startPos, endPos, duration) {
        const startTime = Date.now();
        const startLat = startPos.lat;
        const startLng = startPos.lng;
        const endLat = endPos[0];
        const endLng = endPos[1];
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            const currentLat = startLat + (endLat - startLat) * easeProgress;
            const currentLng = startLng + (endLng - startLng) * easeProgress;
            
            marker.setLatLng([currentLat, currentLng]);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    updateDeviceTrail(deviceId, location) {
        const device = this.devices.get(deviceId);
        
        if (!this.showTrails) {
            return;
        }
        
        // Initialize trail array if not exists
        if (!this.deviceTrailLines.has(deviceId)) {
            this.deviceTrailLines.set(deviceId, []);
        }
        
        // Get device color
        const deviceColor = this.deviceColors.get(deviceId) || '#3388ff';
        
        // Add current location to trail
        let trailPoints = this.deviceTrailLines.get(deviceId);
        trailPoints.push([location.lat, location.lng]);
        
        // Keep only last 25 points
        if (trailPoints.length > this.maxTrailPoints) {
            trailPoints = trailPoints.slice(-this.maxTrailPoints);
            this.deviceTrailLines.set(deviceId, trailPoints);
        }
        
        // Remove existing trail
        if (this.deviceTrails.has(deviceId)) {
            this.map.removeLayer(this.deviceTrails.get(deviceId));
        }
        
        // Create new trail if we have enough points
        if (trailPoints.length > 1) {
            const trail = L.polyline(trailPoints, {
                color: deviceColor,
                weight: 4,
                opacity: 0.7,
                dashArray: '8, 4',
                lineCap: 'round',
                lineJoin: 'round'
            });
            
            trail.addTo(this.map);
            this.deviceTrails.set(deviceId, trail);
            
            // Add trail animation effect
            this.animateTrail(trail);
        }
    }

    animateTrail(polyline) {
        let offset = 0;
        const animate = () => {
            offset += 2;
            if (offset > 24) offset = 0;
            
            polyline.setStyle({
                dashOffset: offset
            });
            
            setTimeout(() => requestAnimationFrame(animate), 100);
        };
        animate();
    }

    createPopupContent(deviceId, location) {
        const device = this.devices.get(deviceId);
        const speed = location.speed_kmh ? `${location.speed_kmh.toFixed(1)} km/h` : 'N/A';
        const altitude = location.alt_m ? `${location.alt_m.toFixed(1)} m` : 'N/A';
        const satellites = location.sats || 'N/A';
        
        return `
            <div class="device-popup">
                <div class="popup-header">${device.name}</div>
                <div class="popup-info">
                    <strong>ID:</strong> ${deviceId}<br>
                    <strong>Speed:</strong> ${speed}<br>
                    <strong>Altitude:</strong> ${altitude}<br>
                    <strong>Satellites:</strong> ${satellites}<br>
                    <strong>Last Update:</strong> ${this.formatTime(location.timestamp_server_utc)}
                </div>
            </div>
        `;
    }

    selectDevice(deviceId) {
        // Deselect previous device
        if (this.selectedDevice) {
            this.updateDeviceMarker(this.selectedDevice, this.devices.get(this.selectedDevice).lastLocation);
        }

        this.selectedDevice = deviceId;
        
        // Update marker appearance
        const device = this.devices.get(deviceId);
        if (device.lastLocation) {
            this.updateDeviceMarker(deviceId, device.lastLocation);
        }

        // Show device info
        this.showDeviceInfo(deviceId);

        // Update device list selection
        this.updateDeviceList();
    }

    showDeviceInfo(deviceId) {
        const device = this.devices.get(deviceId);
        if (!device || !device.lastLocation) return;

        const location = device.lastLocation;
        const panel = document.getElementById('device-info-panel');
        const content = document.getElementById('device-info-content');
        
        document.getElementById('info-device-name').textContent = device.name;
        
        content.innerHTML = `
            <div class="info-item">
                <span class="info-label">Device ID:</span>
                <span class="info-value">${deviceId}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Status:</span>
                <span class="info-value" style="color: ${device.isOnline ? '#4CAF50' : '#F44336'}">
                    ${device.isOnline ? 'Online' : 'Offline'}
                </span>
            </div>
            <div class="info-item">
                <span class="info-label">Latitude:</span>
                <span class="info-value">${location.lat.toFixed(6)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Longitude:</span>
                <span class="info-value">${location.lng.toFixed(6)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Speed:</span>
                <span class="info-value">${location.speed_kmh ? location.speed_kmh.toFixed(1) + ' km/h' : 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Altitude:</span>
                <span class="info-value">${location.alt_m ? location.alt_m.toFixed(1) + ' m' : 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Satellites:</span>
                <span class="info-value">${location.sats || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">HDOP:</span>
                <span class="info-value">${location.hdop ? location.hdop.toFixed(2) : 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Last Update:</span>
                <span class="info-value">${this.formatTime(location.timestamp_server_utc)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">GPS Time:</span>
                <span class="info-value">${this.formatTime(location.timestamp_utc)}</span>
            </div>
        `;
        
        panel.classList.remove('hidden');
    }

    hideDeviceInfo() {
        document.getElementById('device-info-panel').classList.add('hidden');
        
        if (this.selectedDevice) {
            const device = this.devices.get(this.selectedDevice);
            if (device.lastLocation) {
                this.updateDeviceMarker(this.selectedDevice, device.lastLocation);
            }
            this.selectedDevice = null;
            this.updateDeviceList();
        }
    }

    updateDeviceList() {
        const container = document.getElementById('device-list');
        const devices = Array.from(this.devices.entries())
            .filter(([deviceId, device]) => {
                if (!this.currentDeviceFilter) return true;
                return deviceId.toLowerCase().includes(this.currentDeviceFilter) ||
                       device.name.toLowerCase().includes(this.currentDeviceFilter);
            })
            .sort(([a], [b]) => a.localeCompare(b));

        container.innerHTML = devices.map(([deviceId, device]) => {
            const isSelected = this.selectedDevice === deviceId;
            const statusClass = device.isOnline ? 'online' : 'offline';
            const selectedClass = isSelected ? 'active' : '';
            const lastSeen = device.lastSeen ? this.formatRelativeTime(device.lastSeen) : 'Never';
            const speed = device.lastLocation?.speed_kmh ? `${device.lastLocation.speed_kmh.toFixed(1)} km/h` : '--';

            return `
                <div class="device-item ${statusClass} ${selectedClass}" data-device-id="${deviceId}">
                    <div class="device-id">${deviceId}</div>
                    <div class="device-name">${device.name}</div>
                    <div class="device-status">
                        <span class="device-last-seen">${lastSeen}</span>
                        <span class="device-speed">${speed}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners
        container.querySelectorAll('.device-item').forEach(item => {
            item.addEventListener('click', () => {
                const deviceId = item.dataset.deviceId;
                this.selectDevice(deviceId);
                
                // Center map on device
                const device = this.devices.get(deviceId);
                if (device.lastLocation) {
                    this.map.setView([device.lastLocation.lat, device.lastLocation.lng], 15);
                }
            });
        });
    }

    showAddDeviceModal() {
        document.getElementById('add-device-modal').classList.remove('hidden');
        document.getElementById('new-device-id').focus();
    }

    hideAddDeviceModal() {
        document.getElementById('add-device-modal').classList.add('hidden');
        document.getElementById('add-device-form').reset();
    }

    addNewDevice() {
        const deviceId = document.getElementById('new-device-id').value.trim();
        const deviceName = document.getElementById('device-name').value.trim();
        const deviceColor = document.getElementById('device-color').value;

        if (!deviceId || !deviceName) {
            alert('Please fill in all required fields');
            return;
        }

        if (this.devices.has(deviceId)) {
            alert('Device with this ID already exists');
            return;
        }

        const device = {
            name: deviceName,
            color: deviceColor,
            isOnline: false,
            lastSeen: null,
            lastLocation: null
        };

        this.devices.set(deviceId, device);
        this.saveDevicesToStorage();
        this.updateDeviceList();
        this.hideAddDeviceModal();

        // Try to fetch data for the new device
        this.fetchDeviceData(deviceId).catch(() => {
            // Device might not have sent data yet
        });
    }

    centerAllDevices() {
        const activeMarkers = Array.from(this.deviceMarkers.values())
            .filter(marker => marker._map); // Only markers that are on the map

        if (activeMarkers.length === 0) {
            return;
        }

        if (activeMarkers.length === 1) {
            this.map.setView(activeMarkers[0].getLatLng(), 15);
        } else {
            const group = new L.featureGroup(activeMarkers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    toggleMapLayer() {
        if (this.currentLayer === 'street') {
            this.map.removeLayer(this.streetLayer);
            this.satelliteLayer.addTo(this.map);
            this.currentLayer = 'satellite';
        } else {
            this.map.removeLayer(this.satelliteLayer);
            this.streetLayer.addTo(this.map);
            this.currentLayer = 'street';
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    toggleTrails() {
        if (this.showTrails) {
            this.deviceTrails.forEach(trail => trail.addTo(this.map));
        } else {
            this.deviceTrails.forEach(trail => this.map.removeLayer(trail));
        }
    }

    updateAllTrails() {
        this.deviceTrails.forEach((trail, deviceId) => {
            this.map.removeLayer(trail);
        });
        this.deviceTrails.clear();

        if (this.showTrails) {
            this.devices.forEach((device, deviceId) => {
                if (device.lastLocation) {
                    this.fetchDeviceData(deviceId, this.maxTrailPoints).then(data => {
                        if (data.length > 1) {
                            this.updateDeviceTrail(deviceId, data);
                        }
                    });
                }
            });
        }
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        if (this.isAutoRefresh) {
            this.refreshTimer = setInterval(() => {
                this.refreshAllDevices();
            }, this.refreshInterval);
        }
    }

    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    updateConnectionStatus(status) {
        const indicator = document.getElementById('connection-indicator');
        const text = document.getElementById('connection-text');
        
        indicator.className = `status-indicator ${status}`;
        
        switch (status) {
            case 'online':
                text.textContent = 'Online';
                break;
            case 'offline':
                text.textContent = 'Offline';
                break;
            case 'connecting':
                text.textContent = 'Connecting...';
                break;
        }
    }

    updateStats() {
        const totalDevices = this.devices.size;
        const activeDevices = Array.from(this.devices.values()).filter(d => d.isOnline).length;
        
        document.getElementById('total-devices').textContent = totalDevices;
        document.getElementById('active-devices').textContent = activeDevices;
    }

    updateLastUpdateTime() {
        document.getElementById('last-update').textContent = this.formatTime(new Date().toISOString());
    }

    markDeviceOffline(deviceId) {
        const device = this.devices.get(deviceId);
        if (device) {
            device.isOnline = false;
            this.updateDeviceList();
            if (device.lastLocation) {
                this.updateDeviceMarker(deviceId, device.lastLocation);
            }
        }
    }

    isDeviceOnline(lastSeen) {
        if (!lastSeen) return false;
        const now = new Date();
        const timeDiff = now - new Date(lastSeen);
        return timeDiff < 60000; // Consider online if last seen within 1 minute
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleString();
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    saveDevicesToStorage() {
        const deviceData = {};
        this.devices.forEach((device, deviceId) => {
            deviceData[deviceId] = {
                name: device.name,
                color: device.color
            };
        });
        localStorage.setItem('gps-dashboard-devices', JSON.stringify(deviceData));
    }

    loadDevicesFromStorage() {
        const stored = localStorage.getItem('gps-dashboard-devices');
        if (stored) {
            try {
                const deviceData = JSON.parse(stored);
                Object.entries(deviceData).forEach(([deviceId, data]) => {
                    this.devices.set(deviceId, {
                        name: data.name,
                        color: data.color,
                        isOnline: false,
                        lastSeen: null,
                        lastLocation: null
                    });
                });
                this.updateDeviceList();
            } catch (error) {
                console.error('Error loading devices from storage:', error);
            }
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new GPSDashboard();
});

// Handle visibility change for auto-refresh
document.addEventListener('visibilitychange', () => {
    if (window.dashboard) {
        if (document.hidden) {
            window.dashboard.stopAutoRefresh();
        } else {
            window.dashboard.startAutoRefresh();
        }
    }
});