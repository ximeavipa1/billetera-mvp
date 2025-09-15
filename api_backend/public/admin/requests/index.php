<?php
// CORS y auth (bypass dev en _auth.php)
require __DIR__ . '/../../cors.php';
require __DIR__ . '/../_auth.php';
bd_require_admin();

header('Content-Type: application/json; charset=utf-8');

echo json_encode([
  'ok' => true,
  'admin' => $GLOBALS['BD_AUTH'] ?? null,
  'requests' => [
    [
      'id' => 1,
      'user' => 'demo',
      'source' => 'paypal',
      'amount_usd' => 10,
      'to' => 'BOB',
      'status' => 'pending',
      'created_at' => date('c'),
    ],
  ],
], JSON_UNESCAPED_SLASHES);
