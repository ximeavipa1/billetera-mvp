<?php
// api_backend/public/create.php
require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/lib/JWT.php';
if (is_file(__DIR__ . '/../config/env.php')) {
  require_once __DIR__ . '/../config/env.php';
}

use function Lib\JWT\decode as jwt_decode;

header('Content-Type: application/json; charset=utf-8');

function jwt_secret(): string {
  $fromEnv = env('JWT_SECRET', '');
  if ($fromEnv !== '') return $fromEnv;
  if (defined('APP_SECRET')) return APP_SECRET;
  $fromApp = env('APP_SECRET', '');
  return $fromApp !== '' ? $fromApp : 'change-me-super-secret';
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok'=>false,'error'=>'method not allowed'], JSON_UNESCAPED_UNICODE);
  exit;
}

$body = json_input();
$from = trim((string)($body['from'] ?? ''));
$to   = trim((string)($body['to'] ?? ''));
$amt  = (float)($body['amount'] ?? 0);
$cur  = strtoupper(trim((string)($body['currency'] ?? 'USD')));
$tqr  = isset($body['target_qr']) ? trim((string)$body['target_qr']) : null;

if ($from === '' || $to === '' || $amt <= 0 || $cur === '') {
  http_response_code(422);
  echo json_encode(['ok'=>false,'error'=>'missing fields (from, to, amount, currency)'], JSON_UNESCAPED_UNICODE);
  exit;
}

// Email desde JWT, fallback a body.email
$email = null;
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if ($auth && stripos($auth, 'Bearer ') === 0) {
  $token = trim(substr($auth, 7));
  if ($token !== '') {
    $payload = jwt_decode($token, jwt_secret());
    if (is_array($payload) && !empty($payload['email'])) {
      $email = $payload['email'];
    }
  }
}
if (!$email) {
  $email = isset($body['email']) ? trim((string)$body['email']) : null;
}
if (!$email) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'missing email (token or body)'], JSON_UNESCAPED_UNICODE);
  exit;
}

try {
  $pdo = db();

  // Descubrir columnas reales de "requests"
  $col = $pdo->prepare("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'requests'");
  $col->execute();
  $cols = array_map(fn($r) => $r['COLUMN_NAME'], $col->fetchAll());

  $hasUserId = in_array('user_id', $cols, true);
  $hasEmail  = in_array('email', $cols, true);
  $hasFrom   = in_array('from_provider', $cols, true);
  $hasTo     = in_array('to_provider', $cols, true);
  $hasAmt    = in_array('amount', $cols, true);
  $hasCur    = in_array('currency', $cols, true);
  $hasSts    = in_array('status', $cols, true);
  $hasCat    = in_array('created_at', $cols, true);
  $hasTqr    = in_array('target_qr', $cols, true);

  $fields = [];
  $params = [];

  if ($hasEmail) {
    $fields[] = 'email';
    $params[] = $email;
  } elseif ($hasUserId) {
    // Buscar id del usuario por email
    $u = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $u->execute([$email]);
    $row = $u->fetch();
    if (!$row) {
      http_response_code(404);
      echo json_encode(['ok'=>false,'error'=>'user not found for email'], JSON_UNESCAPED_UNICODE);
      exit;
    }
    $fields[] = 'user_id';
    $params[] = (int)$row['id'];
  } else {
    throw new Exception("La tabla 'requests' no tiene ni 'email' ni 'user_id'.");
  }

  if ($hasFrom) { $fields[] = 'from_provider'; $params[] = $from; }
  if ($hasTo)   { $fields[] = 'to_provider';   $params[] = $to; }
  if ($hasAmt)  { $fields[] = 'amount';        $params[] = $amt; }
  if ($hasCur)  { $fields[] = 'currency';      $params[] = $cur; }
  if ($hasSts)  { $fields[] = 'status';        $params[] = 'pending'; }
  if ($hasCat)  { $fields[] = 'created_at';    $params[] = date('Y-m-d H:i:s'); }
  if ($hasTqr && $tqr !== null) { $fields[] = 'target_qr'; $params[] = $tqr; }

  $placeholders = implode(',', array_fill(0, count($fields), '?'));
  $columns = implode(',', $fields);
  $sql = "INSERT INTO requests ($columns) VALUES ($placeholders)";
  $st = $pdo->prepare($sql);
  $st->execute($params);

  $id = (int)$pdo->lastInsertId();
  echo json_encode(['ok'=>true, 'id'=>$id, 'status'=>'pending'], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false, 'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
