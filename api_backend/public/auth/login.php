<?php
require_once __DIR__ . '/../../src/lib/DB.php';
require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../src/lib/Http.php';
require_once __DIR__ . '/../../src/lib/JWT.php';

use Lib\DB;
use Lib\Http;
use Lib\JWT;

Http\cors();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'method not allowed']); exit; }

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$email = trim($body['email'] ?? '');
$pass  = (string)($body['password'] ?? '');

$pdo = DB::pdo();
$stmt = $pdo->prepare('SELECT id, email, password_hash, display_name, role FROM users WHERE email=? LIMIT 1');
$stmt->execute([$email]);
$u = $stmt->fetch();
if (!$u || !password_verify($pass, $u['password_hash'])) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'credenciales inválidas']); exit; }

$payload = ['uid'=>(int)$u['id'], 'email'=>$u['email'], 'role'=>$u['role'], 'exp'=> time()+86400];
$token = JWT\encode($payload, APP_SECRET);

echo json_encode(['ok'=>true, 'token'=>$token, 'user'=>['email'=>$u['email'], 'display_name'=>$u['display_name'], 'role'=>$u['role']]]);
