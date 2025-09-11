<?php
require_once __DIR__ . '/../../src/lib/DB.php';
require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../src/lib/Http.php';

use Lib\DB;
use Lib\Http;

Http\cors();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'method not allowed']); exit; }

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$email = trim($body['email'] ?? '');
$pass  = (string)($body['password'] ?? '');
$name  = trim($body['display_name'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(422); echo json_encode(['ok'=>false,'error'=>'email inválido']); exit; }
if (strlen($pass) < 8) { http_response_code(422); echo json_encode(['ok'=>false,'error'=>'password muy corta']); exit; }

$pdo = DB::pdo();
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
if ($stmt->fetch()) { http_response_code(409); echo json_encode(['ok'=>false,'error'=>'email ya registrado']); exit; }

$hash = password_hash($pass, PASSWORD_DEFAULT);
$ins = $pdo->prepare('INSERT INTO users (email, password_hash, display_name, role) VALUES (?,?,?, "user")');
$ins->execute([$email, $hash, $name ?: null]);

echo json_encode(['ok'=>true]);
