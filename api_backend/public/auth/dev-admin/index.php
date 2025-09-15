<?php
// CORS SIEMPRE PRIMERO
require __DIR__ . '/../../cors.php';
header('Content-Type: application/json; charset=utf-8');

// Helpers JWT HS256 sin libs
function b64url($data){ return rtrim(strtr(base64_encode($data), '+/', '-_'), '='); }
function create_jwt($claims, $secret){
  $header = ['typ'=>'JWT','alg'=>'HS256'];
  $seg = [ b64url(json_encode($header)), b64url(json_encode($claims)) ];
  $sig = hash_hmac('sha256', implode('.', $seg), $secret, true);
  $seg[] = b64url($sig);
  return implode('.', $seg);
}

// SOLO DEV — NO USAR EN PROD
$secret = getenv('JWT_SECRET') ?: 'dev-secret';
$now = time();
$claims = [
  'iss' => 'billetera-mvp',
  'sub' => 'dev-admin',
  'uid' => 'dev-admin',
  'role'=> 'admin',
  'iat' => $now,
  'exp' => $now + 3600,
  'env' => 'dev'
];

$token = create_jwt($claims, $secret);
http_response_code(200);
echo json_encode(['ok'=>true,'token'=>$token,'role'=>'admin','exp'=>$claims['exp']], JSON_UNESCAPED_SLASHES);
