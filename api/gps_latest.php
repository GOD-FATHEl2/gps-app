<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');
header('Expires: 0');

// Enable compression for large responses
if (!headers_sent() && extension_loaded('zlib')) {
    if (strpos($_SERVER['HTTP_ACCEPT_ENCODING'] ?? '', 'gzip') !== false) {
        header('Content-Encoding: gzip');
    }
}

require_once __DIR__ . '/config.php';

$device_id = $_GET['device_id'] ?? '';
$limit     = isset($_GET['limit']) ? max(1, min(1000, intval($_GET['limit']))) : 1;
if ($device_id === '') {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'missing_device_id']);
  exit;
}

$fh = fopen(CSV_PATH, 'r');
if (!$fh) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'cannot_open_csv']);
  exit;
}
$header = fgetcsv($fh); // skip header
$rows = [];
while (($r = fgetcsv($fh)) !== false) {
  if ($r[1] === $device_id) {
    $rows[] = [
      'timestamp_server_utc'=>$r[0],
      'device_id'=>$r[1],
      'timestamp_utc'=>$r[2],
      'lat'=>floatval($r[3]),
      'lng'=>floatval($r[4]),
      'speed_kmh'=>($r[5]!==''?floatval($r[5]):null),
      'alt_m'=>($r[6]!==''?floatval($r[6]):null),
      'sats'=>($r[7]!==''?intval($r[7]):null),
      'hdop'=>($r[8]!==''?floatval($r[8]):null),
      'ip'=>$r[9]
    ];
  }
}
fclose($fh);

$result = array_slice($rows, max(0, count($rows)-$limit), $limit);
echo json_encode(['ok'=>true,'count'=>count($result),'data'=>$result]);
