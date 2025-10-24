<?php
/**
 * Forklift GPS Test Data Generator
 * Created by Eng. Nawoar Ekkou & Walace Cagnin
 * 
 * This script generates realistic GPS data for 4 forklifts operating in a warehouse facility
 */

// Warehouse facility coordinates at Personalvägen 21, 418 78 Göteborg, Sweden
$warehouseCenter = [
    'lat' => 57.6870, // Göteborg, Sweden coordinates
    'lng' => 11.9755
];

// Define 4 forklifts with different operating zones
$forklifts = [
    'FORKLIFT_001' => [
        'name' => 'Forklift Alpha',
        'zone' => 'Main Building',
        'base_lat' => 57.6870,
        'base_lng' => 11.9755,
        'speed_range' => [5, 15], // km/h
        'pattern' => 'rectangular' // Movement pattern
    ],
    'FORKLIFT_002' => [
        'name' => 'Forklift Beta', 
        'zone' => 'Loading Area',
        'base_lat' => 57.6872,
        'base_lng' => 11.9750,
        'speed_range' => [3, 12],
        'pattern' => 'circular'
    ],
    'FORKLIFT_003' => [
        'name' => 'Forklift Gamma',
        'zone' => 'Storage Area', 
        'base_lat' => 57.6868,
        'base_lng' => 11.9760,
        'speed_range' => [8, 18],
        'pattern' => 'linear'
    ],
    'FORKLIFT_004' => [
        'name' => 'Forklift Delta',
        'zone' => 'Parking Area',
        'base_lat' => 57.6875,
        'base_lng' => 11.9745,
        'speed_range' => [2, 10],
        'pattern' => 'zigzag'
    ]
];

// API configuration
$API_KEY = 'test_forklift_demo_2024'; // Use this key for testing
$API_URL = 'http://localhost/Gps-System/api/gps_ingest.php'; // Adjust to your server

// Function to generate realistic forklift movement
function generateForkliftPosition($forklift, $time_offset = 0) {
    $base_lat = $forklift['base_lat'];
    $base_lng = $forklift['base_lng'];
    
    // Movement radius (in degrees - approximately 50 meters)
    $radius = 0.0005;
    
    // Time-based movement (simulates continuous operation)
    $time_factor = (time() + $time_offset) / 60; // Minutes
    
    switch ($forklift['pattern']) {
        case 'rectangular':
            // Rectangular pattern for loading dock operations
            $cycle = fmod($time_factor, 4);
            if ($cycle < 1) {
                $lat_offset = $radius * $cycle;
                $lng_offset = 0;
            } elseif ($cycle < 2) {
                $lat_offset = $radius;
                $lng_offset = $radius * ($cycle - 1);
            } elseif ($cycle < 3) {
                $lat_offset = $radius * (3 - $cycle);
                $lng_offset = $radius;
            } else {
                $lat_offset = 0;
                $lng_offset = $radius * (4 - $cycle);
            }
            break;
            
        case 'circular':
            // Circular pattern for storage area
            $angle = $time_factor * 0.5; // Slow rotation
            $lat_offset = $radius * cos($angle);
            $lng_offset = $radius * sin($angle);
            break;
            
        case 'linear':
            // Linear back-and-forth for shipping dock
            $cycle = fmod($time_factor, 2);
            $lat_offset = $cycle < 1 ? $radius * $cycle : $radius * (2 - $cycle);
            $lng_offset = 0;
            break;
            
        case 'zigzag':
            // Zigzag pattern for inventory
            $cycle = fmod($time_factor, 2);
            $lat_offset = $radius * sin($time_factor * 2);
            $lng_offset = $radius * ($cycle < 1 ? $cycle : 2 - $cycle);
            break;
    }
    
    return [
        'lat' => $base_lat + $lat_offset,
        'lng' => $base_lng + $lng_offset,
        'speed' => rand($forklift['speed_range'][0], $forklift['speed_range'][1]),
        'altitude' => rand(100, 105), // Indoor warehouse altitude
        'satellites' => rand(6, 12),
        'hdop' => rand(10, 25) / 10 // 1.0 to 2.5
    ];
}

// Function to send GPS data to API
function sendGPSData($device_id, $position) {
    global $API_KEY, $API_URL;
    
    $timestamp = gmdate('Y-m-d\TH:i:s\Z');
    
    $payload = [
        'device_id' => $device_id,
        'timestamp_utc' => $timestamp,
        'lat' => $position['lat'],
        'lng' => $position['lng'],
        'speed_kmh' => $position['speed'],
        'alt_m' => $position['altitude'],
        'sats' => $position['satellites'],
        'hdop' => $position['hdop']
    ];
    
    $json = json_encode($payload);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $API_URL);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-API-Key: ' . $API_KEY
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'success' => $http_code == 200,
        'response' => $response,
        'payload' => $payload
    ];
}

// Main execution
if (php_sapi_name() === 'cli') {
    // Command line execution for continuous testing
    echo "🚜 Forklift GPS Test Data Generator Started\n";
    echo "📡 Generating live GPS data for 4 forklifts...\n\n";
    
    $iteration = 0;
    while (true) {
        $iteration++;
        echo "📊 Iteration #$iteration - " . date('Y-m-d H:i:s') . "\n";
        
        foreach ($forklifts as $device_id => $forklift) {
            $position = generateForkliftPosition($forklift);
            $result = sendGPSData($device_id, $position);
            
            $status = $result['success'] ? '✅' : '❌';
            echo "$status $device_id ({$forklift['name']}) - Lat: {$position['lat']}, Lng: {$position['lng']}, Speed: {$position['speed']} km/h\n";
        }
        
        echo "\n⏳ Waiting 3 seconds...\n\n";
        sleep(3); // Send updates every 3 seconds
    }
} else {
    // Web execution for single test
    echo "<h2>🚜 Forklift GPS Test Data Generator</h2>";
    echo "<p>📡 Sending test GPS data for 4 forklifts...</p>";
    
    foreach ($forklifts as $device_id => $forklift) {
        $position = generateForkliftPosition($forklift);
        $result = sendGPSData($device_id, $position);
        
        $status = $result['success'] ? '✅ Success' : '❌ Failed';
        echo "<div style='padding:10px; margin:5px; border-left:4px solid " . ($result['success'] ? 'green' : 'red') . ";'>";
        echo "<strong>$device_id</strong> ({$forklift['name']}) - $status<br>";
        echo "📍 Position: {$position['lat']}, {$position['lng']}<br>";
        echo "🏃 Speed: {$position['speed']} km/h | 🛰️ Satellites: {$position['satellites']}<br>";
        echo "📡 Response: " . htmlspecialchars($result['response']) . "<br>";
        echo "</div>";
    }
    
    echo "<p><a href='../dashboard/'>🖥️ View Dashboard</a> | <a href='?'>🔄 Refresh Data</a></p>";
}
?>