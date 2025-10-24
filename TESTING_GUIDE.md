# 🚜 Forklift GPS System - Live Demo Testing

## 👨‍💻 Created by Eng. Nawoar Ekkou & Walace Cagnin

### 🚀 Quick Start Testing Guide

## **Option 1: Windows Users**
1. Open Command Prompt or PowerShell
2. Navigate to the GPS System folder:
   ```cmd
   cd c:\Users\NEKKOU\Downloads\Gps-System
   ```
3. Run the test server:
   ```cmd
   start_test_server.bat
   ```

## **Option 2: Linux/Mac Users**
1. Open Terminal
2. Navigate to the GPS System folder
3. Make script executable and run:
   ```bash
   chmod +x start_test_server.sh
   ./start_test_server.sh
   ```

## **Option 3: Manual PHP Server**
```bash
cd /path/to/Gps-System
php -S localhost:8000 -t .
```

---

## 🔗 **Test URLs (after server starts)**

### 🚜 **Main Forklift Demo**
**http://localhost:8000/test/forklift_demo.html**
- Live dashboard with 4 forklifts
- Real-time map visualization
- Fleet management interface

### 📊 **Standard Dashboard**
**http://localhost:8000/dashboard/**
- Original GPS dashboard
- Device management
- Real-time tracking

### 🧪 **Test Data Generator**
**http://localhost:8000/test/forklift_test_generator.php**
- Generates realistic forklift GPS data
- Click to send test coordinates
- Simulates warehouse operations

### 📡 **API Testing**
**http://localhost:8000/api/dashboard_api.php?action=stats**
- View system statistics
- API health check
- Data verification

---

## 🎯 **Testing Scenarios**

### **Scenario 1: View Existing Data**
1. Open **http://localhost:8000/test/forklift_demo.html**
2. You should see 4 forklifts on the map (from sample CSV data)
3. Click on any forklift marker to see details
4. Check the sidebar for device list and statistics

### **Scenario 2: Generate Live Data**
1. Open **http://localhost:8000/test/forklift_test_generator.php**
2. Click "Refresh Data" to generate new GPS coordinates
3. Switch to the dashboard and see updated positions
4. Enable auto-refresh to see real-time updates

### **Scenario 3: Continuous Testing**
1. Run the PHP generator in command line:
   ```bash
   cd test
   php forklift_test_generator.php
   ```
2. This will continuously send GPS data every 3 seconds
3. Watch the dashboard for live movement simulation

---

## 🚜 **Forklift Fleet Details**

| Device ID | Name | Zone | Movement Pattern |
|-----------|------|------|------------------|
| FORKLIFT_001 | Alpha | Loading Dock A | Rectangular loops |
| FORKLIFT_002 | Beta | Storage Area B | Circular patterns |
| FORKLIFT_003 | Gamma | Shipping Dock C | Linear back-and-forth |
| FORKLIFT_004 | Delta | Inventory Zone D | Zigzag movements |

---

## 🔧 **Troubleshooting**

### **No data showing:**
- Check if `data/gps_log.csv` exists with sample data
- Verify API key in `api/config.php` is set to `test_forklift_demo_2024`
- Check browser console for JavaScript errors

### **Server won't start:**
- Ensure PHP is installed and in PATH
- Check if port 8000 is available
- Try a different port: `php -S localhost:8080 -t .`

### **Map not loading:**
- Check internet connection (required for map tiles)
- Disable ad blockers
- Check browser console for errors

---

## 📊 **Expected Results**

✅ **Working Dashboard**: Interactive map with 4 forklift markers  
✅ **Real-time Updates**: Positions update every 3-5 seconds  
✅ **Device Details**: Click markers to see speed, GPS info  
✅ **Fleet Statistics**: Sidebar shows active devices and stats  
✅ **Responsive Design**: Works on desktop, tablet, mobile  

---

## 🏆 **Demo Success Criteria**

1. **Visual Confirmation**: 4 forklifts visible on map
2. **Interactive Features**: Clickable markers with details
3. **Real-time Updates**: Auto-refresh working
4. **Professional UI**: Clean, responsive interface
5. **Data Accuracy**: Correct GPS coordinates and metadata

---

**🛰️ Live GPS Tracking System - Revolutionizing forklift fleet management!**
**Proudly Created by Eng. Nawoar Ekkou & Walace Cagnin** 🚜