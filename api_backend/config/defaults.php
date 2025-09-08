<?php
return [
  "exchangeDate" => date("d/m/Y"),
  "rates" => [
    "USD_BOB" => 13.20,
    "USD_USDT"=> 1.00
  ],
  "fees" => [
    "paypal->BOB_QR"  => 6.0,
    "paypal->USDT"    => 5.0,
    "binance->BOB_QR" => 5.0,
    "paypal->CARD"    => 7.0,
    "facebook->BOB_QR"=> 6.0,
    "tiktok->BOB_QR"  => 6.0
  ],
  "payout" => [
    "bankName" => "",
    "accountName" => "",
    "accountNumber" => "",
    "iban" => "",
    "note" => ""
  ],
  "channels" => [
    "paypal"  => ["label"=>"Cuenta PayPal del servicio", "receiver"=>"pagos@tuempresa.com", "note"=>"Envía el monto exacto"],
    "binance" => ["label"=>"Cuenta Binance del servicio", "receiver"=>"binance@tuempresa.com", "note"=>"Transferencia USDT (TRC20)"],
    "facebook"=> ["label"=>"Correo retiros Facebook", "receiver"=>"facebook@tuempresa.com", "note"=>"Factura según instrucciones"],
    "tiktok"  => ["label"=>"Correo retiros TikTok",   "receiver"=>"tiktok@tuempresa.com",   "note"=>"Factura según instrucciones"],
    "BOB_QR"  => ["label"=>"QR bancario (Bs)"],
    "BINANCE" => ["label"=>"Wallet USDT en Binance (destino)", "note"=>"Se acredita a tu wallet (perfil)"],
    "CARD"    => ["label"=>"Tarjeta virtual", "note"=>"USD 1 / 30 días (gestión externa)"]
  ],
  "limits" => ["maxUsers"=>100, "cardCap"=>50]
];
