<?php
// Use App Service "Application settings" for the API key if possible
$envKey = getenv('API_KEY');
define('API_KEY', $envKey !== false ? $envKey : 'test_forklift_demo_2024');

// CSV lives under /home/site/wwwroot/data on Azure App Service (Linux)
define('CSV_PATH', __DIR__ . '/../data/gps_log.csv');

// Enable GZIP compression for bandwidth optimization
if (!ob_get_level() && extension_loaded('zlib') && !headers_sent()) {
    if (strpos($_SERVER['HTTP_ACCEPT_ENCODING'] ?? '', 'gzip') !== false) {
        ob_start('ob_gzhandler');
    }
}

// Create CSV with header if missing
if (!file_exists(CSV_PATH)) {
  $header = "timestamp_server_utc,device_id,timestamp_utc,lat,lng,speed_kmh,alt_m,sats,hdop,ip\n";
  @mkdir(dirname(CSV_PATH), 0775, true);
  file_put_contents(CSV_PATH, $header);
}
