<?php
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../src/lib/Http.php';
require_once __DIR__ . '/../src/lib/JWT.php';

use Lib\Http;
use Lib\JWT;

Http\cors();
$bearer = Http\bearer();
if (!$bearer) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'auth required']); exit; }

$payload = JWT\decode($bearer, APP_SECRET);
if (!$payload) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'invalid token']); exit; }

echo json_encode(['ok'=>true, 'user'=>['id'=>$payload['uid'], 'email'=>$payload['email'], 'role'=>$payload['role']]]);
