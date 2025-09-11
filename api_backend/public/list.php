<?php
// api_backend/public/list.php
require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/lib/JWT.php';
if (is_file(__DIR__ . '/../config/env.php')) {
  // por compatibilidad si usas APP_SECRET definido ahí
  require_once __DIR__ . '/../config/env.php';
}

use function Lib\JWT\decode as jwt_decode;

header('Content-Type: application/json; charset=utf-8');

// -------- Helper: obtener secreto JWT consistente con /login y /me ----------
function jwt_secret(): string {
  // Prioriza JWT_SECRET si existe, si no APP_SECRET (constante o env), si no fallback.
  $fromEnv = env('JWT_SECRET', '');
  if ($fromEnv !== '') return $fromEnv;
  if (defined('APP_SECRET')) return APP_SECRET;
  $fromApp = env('APP_SECRET', '');
  return $fromApp !== '' ? $fromApp : 'change-me-super-secret';
}

// --------- 1) Email desde el JWT (Authorization: Bearer ...) ---------------
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

// --------- 2) Fallback: ?email= en querystring ------------------------------
if (!$email) {
  $email = $_GET['email'] ?? null;
}

if (!$email) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'missing email'], JSON_UNESCAPED_UNICODE);
  exit;
}

try {
  $pdo = db();

  // Descubrir columnas reales de "requests" para construir SELECT dinámico
  $col = $pdo->prepare("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'requests'");
  $col->execute();
  $cols = array_map(fn($r) => $r['COLUMN_NAME'], $col->fetchAll());

  // ¿Tiene relación por user_id? (lo más común)
  $hasUserId = in_array('user_id', $cols, true);
  $hasEmailCol = in_array('email', $cols, true);

  // Campos opcionales
  $hasFrom = in_array('from_provider', $cols, true);
  $hasTo   = in_array('to_provider', $cols, true);
  $hasAmt  = in_array('amount', $cols, true);
  $hasCur  = in_array('currency', $cols, true);
  $hasSts  = in_array('status', $cols, true);
  $hasCAt  = in_array('created_at', $cols, true);

  // Armar lista de columnas a seleccionar (si existen)
  $fields = ["r.id"];
  if ($hasFrom) $fields[] = "r.from_provider AS `from`";
  if ($hasTo)   $fields[] = "r.to_provider AS `to`";
  if ($hasAmt)  $fields[] = "r.amount";
  if ($hasCur)  $fields[] = "r.currency";
  if ($hasSts)  $fields[] = "r.status";
  if ($hasCAt)  $fields[] = "r.created_at";

  // Incluye email en la salida si existe en requests o por join
  if ($hasEmailCol) {
    $fields[] = "r.email";
  } else {
    $fields[] = "u.email";
  }

  $select = implode(",\n                 ", $fields);

  if ($hasEmailCol) {
    // Filtra directo por columna email en requests
    $sql = "SELECT $select
            FROM requests r
            WHERE r.email = ?
            ORDER BY r.id DESC
            LIMIT 200";
    $st = $pdo->prepare($sql);
    $st->execute([$email]);
  } elseif ($hasUserId) {
    // Join con users si requests tiene user_id
    $sql = "SELECT $select
            FROM requests r
            JOIN users u ON u.id = r.user_id
            WHERE u.email = ?
            ORDER BY r.id DESC
            LIMIT 200";
    $st = $pdo->prepare($sql);
    $st->execute([$email]);
  } else {
    throw new Exception("La tabla 'requests' no tiene ni 'email' ni 'user_id' para filtrar.");
  }

  $items = $st->fetchAll();
  echo json_encode(['ok'=>true, 'items'=>$items], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false, 'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
