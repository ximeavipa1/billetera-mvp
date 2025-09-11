<?php
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../src/lib/Http.php';
use Lib\Http;

Http\cors();

// Ideal: leer de DB; por ahora literal (migrarlo a tabla "config")
echo json_encode([
  'exchange_date' => '2025-09-02',
  'rates' => ['USD_BOB'=>13.20, 'USD_USDT'=>1.00],
  'fees'  => [
    'paypal->BOB_QR'=>6.0, 'paypal->BINANCE'=>5.0, 'paypal->CARD'=>7.0,
    'binance->BOB_QR'=>3.5, 'binance->BINANCE'=>1.5, 'binance->CARD'=>4.0,
    'facebook->BOB_QR'=>8.0, 'facebook->BINANCE'=>7.5, 'facebook->CARD'=>9.0,
    'tiktok->BOB_QR'=>8.0, 'tiktok->BINANCE'=>7.5, 'tiktok->CARD'=>9.0,
  ],
  'channels' => [
    'paypal'=>['label'=>'Cuenta PayPal'],
    'binance'=>['label'=>'Binance (USDT)'],
    'facebook'=>['label'=>'Facebook Pay'],
    'tiktok'=>['label'=>'TikTok Pay'],
    'BOB_QR'=>['label'=>'QR bancario (Bs)'],
    'BINANCE'=>['label'=>'Wallet USDT (destino)'],
    'CARD'=>['label'=>'Tarjeta virtual']
  ]
]);
