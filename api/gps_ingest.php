<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');

require_once __DIR__ . '/config.php';

// Simple header auth
$hdrKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if ($hdrKey !== API_KEY) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'error'=>'unauthorized']);
  exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!$data) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'invalid_json']);
  exit;
}

foreach (['device_id','timestamp_utc','lat','lng'] as $k) {
  if (!isset($data[$k])) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>"missing_$k"]);
    exit;
  }
}

$nowUTC        = gmdate('Y-m-d\TH:i:s\Z');
$device_id     = preg_replace('/[^A-Za-z0-9_\-\.]/','',$data['device_id']);
$timestamp_utc = $data['timestamp_utc'];
$lat           = floatval($data['lat']);
$lng           = floatval($data['lng']);
$speed_kmh     = isset($data['speed_kmh']) ? floatval($data['speed_kmh']) : null;
$alt_m         = isset($data['alt_m'])     ? floatval($data['alt_m'])     : null;
$sats          = isset($data['sats'])      ? intval($data['sats'])        : null;
$hdop          = isset($data['hdop'])      ? floatval($data['hdop'])      : null;
$ip            = $_SERVER['REMOTE_ADDR'] ?? '';

$fh = fopen(CSV_PATH, 'a');
if (!$fh) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'cannot_open_csv']);
  exit;
}
flock($fh, LOCK_EX);
fputcsv($fh, [$nowUTC,$device_id,$timestamp_utc,$lat,$lng,$speed_kmh,$alt_m,$sats,$hdop,$ip]);
flock($fh, LOCK_UN);
fclose($fh);

echo json_encode(['ok'=>true,'stored'=>true]);
