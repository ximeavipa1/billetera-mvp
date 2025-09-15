<?php
declare(strict_types=1);
require __DIR__ . '/_auth.php';
bd_require_admin();

header('Content-Type: application/json; charset=utf-8');

echo json_encode([
  'ok' => true,
  'admin' => $GLOBALS['BD_AUTH'] ?? null,
  'config' => [
    'service_name' => 'Billetera Digital',
    'exchange_rate_bob_usd' => 6.86,
    'fees' => ['paypal_pct' => 8, 'binance_pct' => 2],
    'withdrawal' => ['min_bob' => 5],
    'card' => ['price_usd' => 1, 'validity_days' => 30, 'stock' => 0],
  ],
], JSON_UNESCAPED_SLASHES);
