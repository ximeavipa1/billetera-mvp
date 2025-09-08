<?php
require_once __DIR__ . '/../src/lib/DB.php';
require_once __DIR__ . '/../config/env.php';

use Lib\DB;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
header('Access-Control-Allow-Methods: GET,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$email = isset($_GET['email']) ? trim($_GET['email']) : '';
if ($email === '') {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'missing email']); exit;
}

try {
  $pdo = DB::pdo();

  $sql = "SELECT w.id, w.src, w.dst, w.amount_usd, w.status, w.created_at
          FROM withdrawals w
          INNER JOIN users u ON u.id = w.user_id
          WHERE u.email = ?
          ORDER BY w.created_at DESC
          LIMIT 200";
  $st = $pdo->prepare($sql);
  $st->execute([$email]);
  $rows = $st->fetchAll();

  // Adaptamos al shape que espera tu frontend
  $items = array_map(function($r){
    // map status BD -> UI
    $status = $r['status'];
    if ($status === 'pending')   $statusUI = 'EN_PROCESO';
    elseif ($status === 'released') $statusUI = 'PAGADO';
    else                          $statusUI = 'RECHAZADO';

    // provider “bonito”
    $dst = strtoupper($r['dst']); // USDT | BOB_QR | CARD
    $src = strtolower($r['src']); // paypal | binance | usdt

    return [
      'id'              => (int)$r['id'],
      'wallet_provider' => $src . '->' . $dst,           // ej: paypal->BOB_QR
      'amount'          => (float)$r['amount_usd'],
      'currency'        => 'USD',
      'status'          => $statusUI,
      'created_at'      => $r['created_at'],
    ];
  }, $rows);

  echo json_encode(['ok'=>true, 'items'=>$items]);
} catch (\Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false, 'error'=>$e->getMessage()]);
}
