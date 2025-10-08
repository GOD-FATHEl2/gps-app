<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

require_once __DIR__ . '/config.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$action = $_GET['action'] ?? 'devices';

switch ($action) {
    case 'devices':
        getAllDevices();
        break;
    case 'device':
        getDeviceData();
        break;
    case 'stats':
        getSystemStats();
        break;
    default:
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'invalid_action']);
}

function getAllDevices() {
    $fh = fopen(CSV_PATH, 'r');
    if (!$fh) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'cannot_open_csv']);
        return;
    }

    $header = fgetcsv($fh); // skip header
    $devices = [];
    $deviceLastSeen = [];
    
    while (($r = fgetcsv($fh)) !== false) {
        $device_id = $r[1];
        $timestamp = $r[0];
        
        if (!isset($devices[$device_id])) {
            $devices[$device_id] = [
                'device_id' => $device_id,
                'locations' => [],
                'last_seen' => $timestamp,
                'total_points' => 0
            ];
        }
        
        $devices[$device_id]['locations'][] = [
            'timestamp_server_utc' => $r[0],
            'timestamp_utc' => $r[2],
            'lat' => floatval($r[3]),
            'lng' => floatval($r[4]),
            'speed_kmh' => ($r[5] !== '' ? floatval($r[5]) : null),
            'alt_m' => ($r[6] !== '' ? floatval($r[6]) : null),
            'sats' => ($r[7] !== '' ? intval($r[7]) : null),
            'hdop' => ($r[8] !== '' ? floatval($r[8]) : null),
            'ip' => $r[9]
        ];
        
        $devices[$device_id]['last_seen'] = $timestamp;
        $devices[$device_id]['total_points']++;
    }
    fclose($fh);

    // Limit locations to last 10 per device for overview
    foreach ($devices as &$device) {
        $device['locations'] = array_slice($device['locations'], -10);
        
        // Determine if device is online (last seen within 5 minutes)
        $lastSeenTime = strtotime($device['last_seen']);
        $device['is_online'] = (time() - $lastSeenTime) < 300;
    }

    echo json_encode([
        'ok' => true,
        'devices' => array_values($devices),
        'count' => count($devices)
    ]);
}

function getDeviceData() {
    $device_id = $_GET['device_id'] ?? '';
    $limit = isset($_GET['limit']) ? max(1, min(1000, intval($_GET['limit']))) : 50;
    
    if ($device_id === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'missing_device_id']);
        return;
    }

    $fh = fopen(CSV_PATH, 'r');
    if (!$fh) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'cannot_open_csv']);
        return;
    }

    $header = fgetcsv($fh); // skip header
    $rows = [];
    
    while (($r = fgetcsv($fh)) !== false) {
        if ($r[1] === $device_id) {
            $rows[] = [
                'timestamp_server_utc' => $r[0],
                'device_id' => $r[1],
                'timestamp_utc' => $r[2],
                'lat' => floatval($r[3]),
                'lng' => floatval($r[4]),
                'speed_kmh' => ($r[5] !== '' ? floatval($r[5]) : null),
                'alt_m' => ($r[6] !== '' ? floatval($r[6]) : null),
                'sats' => ($r[7] !== '' ? intval($r[7]) : null),
                'hdop' => ($r[8] !== '' ? floatval($r[8]) : null),
                'ip' => $r[9]
            ];
        }
    }
    fclose($fh);

    $result = array_slice($rows, max(0, count($rows) - $limit), $limit);
    
    // Calculate additional metrics
    $metrics = calculateDeviceMetrics($result);
    
    echo json_encode([
        'ok' => true,
        'device_id' => $device_id,
        'count' => count($result),
        'data' => $result,
        'metrics' => $metrics
    ]);
}

function getSystemStats() {
    $fh = fopen(CSV_PATH, 'r');
    if (!$fh) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'cannot_open_csv']);
        return;
    }

    $header = fgetcsv($fh); // skip header
    $stats = [
        'total_points' => 0,
        'unique_devices' => 0,
        'active_devices' => 0,
        'date_range' => [
            'start' => null,
            'end' => null
        ],
        'devices' => []
    ];
    
    $deviceStats = [];
    $currentTime = time();
    
    while (($r = fgetcsv($fh)) !== false) {
        $stats['total_points']++;
        $device_id = $r[1];
        $timestamp = $r[0];
        
        if (!isset($deviceStats[$device_id])) {
            $deviceStats[$device_id] = [
                'points' => 0,
                'last_seen' => $timestamp,
                'first_seen' => $timestamp
            ];
        }
        
        $deviceStats[$device_id]['points']++;
        $deviceStats[$device_id]['last_seen'] = $timestamp;
        
        // Update date range
        if ($stats['date_range']['start'] === null || $timestamp < $stats['date_range']['start']) {
            $stats['date_range']['start'] = $timestamp;
        }
        if ($stats['date_range']['end'] === null || $timestamp > $stats['date_range']['end']) {
            $stats['date_range']['end'] = $timestamp;
        }
    }
    fclose($fh);

    $stats['unique_devices'] = count($deviceStats);
    
    // Count active devices (last seen within 5 minutes)
    foreach ($deviceStats as $device_id => $data) {
        $lastSeenTime = strtotime($data['last_seen']);
        $isActive = ($currentTime - $lastSeenTime) < 300;
        
        if ($isActive) {
            $stats['active_devices']++;
        }
        
        $stats['devices'][$device_id] = [
            'points' => $data['points'],
            'last_seen' => $data['last_seen'],
            'first_seen' => $data['first_seen'],
            'is_active' => $isActive
        ];
    }

    echo json_encode([
        'ok' => true,
        'stats' => $stats
    ]);
}

function calculateDeviceMetrics($locations) {
    if (count($locations) < 2) {
        return [
            'total_distance' => 0,
            'max_speed' => 0,
            'avg_speed' => 0,
            'duration' => 0
        ];
    }

    $totalDistance = 0;
    $speeds = [];
    
    for ($i = 1; $i < count($locations); $i++) {
        $prev = $locations[$i - 1];
        $curr = $locations[$i];
        
        // Calculate distance using Haversine formula
        $distance = calculateDistance(
            $prev['lat'], $prev['lng'],
            $curr['lat'], $curr['lng']
        );
        $totalDistance += $distance;
        
        if ($curr['speed_kmh'] !== null) {
            $speeds[] = $curr['speed_kmh'];
        }
    }
    
    $startTime = strtotime($locations[0]['timestamp_server_utc']);
    $endTime = strtotime($locations[count($locations) - 1]['timestamp_server_utc']);
    $duration = $endTime - $startTime;
    
    return [
        'total_distance' => round($totalDistance, 2), // km
        'max_speed' => count($speeds) > 0 ? max($speeds) : 0,
        'avg_speed' => count($speeds) > 0 ? round(array_sum($speeds) / count($speeds), 2) : 0,
        'duration' => $duration // seconds
    ];
}

function calculateDistance($lat1, $lon1, $lat2, $lon2) {
    $earthRadius = 6371; // km
    
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    
    $a = sin($dLat/2) * sin($dLat/2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon/2) * sin($dLon/2);
    
    $c = 2 * atan2(sqrt($a), sqrt(1-$a));
    
    return $earthRadius * $c;
}
?>