<?php
// public/index.php

// --- CORS básico para desarrollo ---
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// JSON por defecto
header('Content-Type: application/json; charset=utf-8');

// Normaliza path
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$path = rtrim($uri, '/');

// Permite tanto /api/... como ... sin prefijo
$path = preg_replace('#^/api#', '', $path);

// Rutas de prueba
if ($path === '' || $path === '/') {
  echo json_encode(['ok' => true, 'service' => 'Wallet API', 'ts' => time()]);
  exit;
}

if ($path === '/health') {
  echo json_encode(['status' => 'ok']);
  exit;
}

// LISTAR HISTORIAL (provisorio, solo para comprobar conectividad)
if ($path === '/list' && $_SERVER['REQUEST_METHOD'] === 'GET') {
  $email = $_GET['email'] ?? '';
  // TODO: aquí llamarás a DB real. Por ahora responde estructura válida:
  echo json_encode([
    'email' => $email,
    'items' => [
      ['code'=>'RW-AB12CD', 'provider'=>'paypal',  'amount'=>250,  'currency'=>'USD', 'status'=>'PAID',      'created_at'=>date('c', time()-86400)],
      ['code'=>'RW-XY34ZT', 'provider'=>'binance', 'amount'=>500,  'currency'=>'USD', 'status'=>'PENDING',   'created_at'=>date('c', time()-3600)],
      ['code'=>'RW-QW56ER', 'provider'=>'facebook','amount'=>-75.5,'currency'=>'USD', 'status'=>'REJECTED',  'created_at'=>date('c', time()-172800)],
    ]
  ]);
  exit;
}

// 404
http_response_code(404);
echo json_encode(['error' => 'Not found', 'path' => $path]);
