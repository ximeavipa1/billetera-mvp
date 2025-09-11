<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../src/lib/Http.php';

use Lib\Http;

// --- CORS (asegúrate de tener CORS_ORIGIN bien seteado, ver sección 3) ---
Http\cors();

// Responder rápido a preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

header('Content-Type: application/json; charset=utf-8');

// ------------------------
// Helpers de conexión PDO
// ------------------------
function pdo_connect(): PDO {
  // Soporta DSN directo o variables sueltas
  $dsn  = getenv('DB_DSN');
  $host = getenv('DB_HOST');
  $name = getenv('DB_NAME');
  $user = getenv('DB_USER');
  $pass = getenv('DB_PASS');

  if (!$dsn) {
    $charset = 'utf8mb4';
    if (!$host || !$name) {
      throw new RuntimeException('DB_DSN o (DB_HOST/DB_NAME) no configurados.');
    }
    $dsn = "mysql:host={$host};dbname={$name};charset={$charset}";
  }

  $pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  return $pdo;
}

function table_exists(PDO $pdo, string $table): bool {
  try {
    $pdo->query("SELECT 1 FROM `{$table}` LIMIT 1");
    return true;
  } catch (Throwable $e) {
    return false;
  }
}

// ------------------------
// Defaults (como el mock)
// ------------------------
$default = [
  'exchange_date' => '2025-09-02',
  'rates' => ['USD_BOB' => 13.20, 'USD_USDT' => 1.00],
  'fees'  => [
    'paypal->BOB_QR'=>6.0,  'paypal->BINANCE'=>5.0,  'paypal->CARD'=>7.0,
    'binance->BOB_QR'=>3.5, 'binance->BINANCE'=>1.5, 'binance->CARD'=>4.0,
    'facebook->BOB_QR'=>8.0,'facebook->BINANCE'=>7.5,'facebook->CARD'=>9.0,
    'tiktok->BOB_QR'=>8.0,  'tiktok->BINANCE'=>7.5,  'tiktok->CARD'=>9.0,
  ],
  'channels' => [
    'paypal'  => ['label'=>'Cuenta PayPal'],
    'binance' => ['label'=>'Binance (USDT)'],
    'facebook'=> ['label'=>'Facebook Pay'],
    'tiktok'  => ['label'=>'TikTok Pay'],
    'BOB_QR'  => ['label'=>'QR bancario (Bs)'],
    'BINANCE' => ['label'=>'Wallet USDT (destino)'],
    'CARD'    => ['label'=>'Tarjeta virtual'],
  ],
  // Campos que tu mock también exponía y que usa el Admin
  'limits' => [ 'maxUsers' => 100, 'cardCap' => 50 ],
  'payout' => [
    'bankName'     => '',
    'accountName'  => '',
    'accountNumber'=> '',
    'iban'         => '',
    'note'         => '',
  ],
];

// ------------------------
// Lectura desde la BD
// ------------------------
$out = $default;

try {
  $db = pdo_connect();

  // 1) exchange_date: app_settings(key,value) o config equivalente
  if (table_exists($db, 'app_settings')) {
    $stmt = $db->prepare("SELECT `value` FROM app_settings WHERE `key` = 'exchange_date' LIMIT 1");
    $stmt->execute();
    if ($row = $stmt->fetch()) {
      $out['exchange_date'] = (string)$row['value'];
    }
  }

  // 2) rates: rates(key,value)
  if (table_exists($db, 'rates')) {
    $rates = [];
    $stmt = $db->query("SELECT `key`, `value` FROM rates");
    foreach ($stmt as $r) {
      $k = (string)$r['key'];
      $v = is_numeric($r['value']) ? (float)$r['value'] : null;
      if ($v !== null) $rates[$k] = $v;
    }
    if ($rates) {
      // merge sobre defaults
      $out['rates'] = array_replace($out['rates'], $rates);
    }
  }

  // 3) fees: fees(from_id,to_id,pct)
  if (table_exists($db, 'fees')) {
    $fees = [];
    $stmt = $db->query("SELECT `from_id`, `to_id`, `pct` FROM fees");
    foreach ($stmt as $f) {
      $from = (string)$f['from_id'];
      $to   = (string)$f['to_id'];
      $pct  = is_numeric($f['pct']) ? (float)$f['pct'] : null;
      if ($pct !== null) {
        $fees["{$from}->{$to}"] = $pct;
      }
    }
    if ($fees) {
      $out['fees'] = array_replace($out['fees'], $fees);
    }
  }

  // 4) channels: channels(id,label,active)
  if (table_exists($db, 'channels')) {
    $channels = [];
    $stmt = $db->query("SELECT `id`, `label`, COALESCE(`active`,1) AS active FROM channels");
    foreach ($stmt as $c) {
      if ((int)$c['active'] === 1) {
        $channels[(string)$c['id']] = ['label' => (string)$c['label']];
      }
    }
    if ($channels) {
      // merge para no perder claves que aún no tengas cargadas
      $out['channels'] = array_replace($out['channels'], $channels);
    }
  }

  // 5) limits: limits(key, value_number)
  if (table_exists($db, 'limits')) {
    $limits = [];
    $stmt = $db->query("SELECT `key`, `value_number` FROM limits");
    foreach ($stmt as $l) {
      $k = (string)$l['key'];
      $v = is_numeric($l['value_number']) ? (int)$l['value_number'] : null;
      if ($v !== null) $limits[$k] = $v;
    }
    if ($limits) {
      $out['limits'] = array_replace($out['limits'], $limits);
    }
  }

  // 6) payout: payout_settings (1 fila)
  if (table_exists($db, 'payout_settings')) {
    $stmt = $db->query("SELECT bank_name, account_name, account_number, iban, note FROM payout_settings LIMIT 1");
    if ($row = $stmt->fetch()) {
      $out['payout'] = array_replace($out['payout'], [
        'bankName'      => (string)($row['bank_name'] ?? ''),
        'accountName'   => (string)($row['account_name'] ?? ''),
        'accountNumber' => (string)($row['account_number'] ?? ''),
        'iban'          => (string)($row['iban'] ?? ''),
        'note'          => (string)($row['note'] ?? ''),
      ]);
    }
  }

} catch (Throwable $e) {
  // Si la BD está caída o faltan tablas, devolvemos defaults (no rompemos la UI)
  // Log opcional:
  error_log('CONFIG_DB_ERROR: ' . $e->getMessage());
}

// Salida final
echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
