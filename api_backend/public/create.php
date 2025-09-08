<?php
require_once __DIR__ . '/../src/lib/DB.php';
require_once __DIR__ . '/../config/env.php';

use Lib\DB;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
header('Access-Control-Allow-Methods: POST,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'method not allowed']); exit; }

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$email  = trim($body['email']  ?? '');
$from   = trim($body['from']   ?? '');   // paypal | binance | usdt
$to     = trim($body['to']     ?? '');   // BINANCE | BOB_QR | CARD (del front)
$amount = (float)($body['amount'] ?? 0);
$proof  = trim($body['proof']  ?? '');

if ($email==='' || $from==='' || $to==='' || $amount<=0) {
  http_response_code(400);
  echo json_encode(['ok'=>false, 'error'=>'missing fields']); exit;
}

// Normalizamos destino: en BD dst es USDT/BOB_QR/CARD
$dst = strtoupper($to);
if ($dst === 'BINANCE') $dst = 'USDT';

try {
  $pdo = DB::pdo();
  $pdo->beginTransaction();

  // 1) Resolver user_id por email
  $st = $pdo->prepare("SELECT id FROM users WHERE email=? LIMIT 1");
  $st->execute([$email]);
  $user = $st->fetch();
  if (!$user) {
    // Debe existir el usuario; si quieres auto-crear en pruebas, descomenta:
    // $st = $pdo->prepare("INSERT INTO users (email, password_hash, display_name, role) VALUES (?, 'dev', ?, 'user')");
    // $name = explode('@',$email)[0];
    // $st->execute([$email, $name]);
    // $userId = (int)$pdo->lastInsertId();
    // (recomendado) Si no existe, devolver error:
    throw new \Exception('user not found: registra primero ese correo');
  }
  $userId = (int)$user['id'];

  // 2) Traer config del día
  $conf = $pdo->query("SELECT usd_bob, usd_usdt, fees_json FROM config WHERE id=1")->fetch();
  if (!$conf) throw new \Exception('config not found');

  $usd_bob = (float)$conf['usd_bob'];
  $usd_usdt = (float)$conf['usd_usdt'];
  $fees = json_decode($conf['fees_json'], true) ?: [];

  // Clave de fee, ej: "paypal->BOB_QR" o "paypal->USDT"
  $feeKey = strtolower($from) . '->' . $dst;
  $feePct = isset($fees[$feeKey]) ? (float)$fees[$feeKey] : 5.0;

  // Rate según destino
  $rate = ($dst === 'BOB_QR') ? $usd_bob : $usd_usdt;

  // 3) calcular "receive_text"
  $afterFee = $amount - ($amount * ($feePct/100));
  if ($dst === 'BOB_QR') {
    $recv = $afterFee * $rate;
    $receiveText = number_format($recv, 2, '.', '') . ' Bs';
  } else {
    $recv = $afterFee * $rate;
    $receiveText = number_format($recv, 2, '.', '') . ' USDT';
  }

  // 4) Insertar
  $sql = "INSERT INTO withdrawals
          (user_id, src, dst, amount_usd, fee_pct, rate, receive_text, proof_url, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')";
  $st = $pdo->prepare($sql);
  $st->execute([$userId, strtolower($from), $dst, $amount, $feePct, $rate, $receiveText, $proof]);
  $id = (int)$pdo->lastInsertId();

  $pdo->commit();

  echo json_encode([
    'ok'=>true,
    'id'=>$id,
    'receive_text'=>$receiveText,
    'status'=>'pending'
  ]);
} catch (\Throwable $e) {
  if ($pdo?->inTransaction()) $pdo->rollBack();
  http_response_code(500);
  echo json_encode(['ok'=>false, 'error'=>$e->getMessage()]);
}
