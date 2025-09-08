<?php
declare(strict_types=1);
namespace Lib\Auth;

use Lib\JsonStore;
use Lib\Utils;

function public_user(array $u): array {
  $pub = $u;
  unset($pub['password'], $pub['token']);
  return $pub;
}
function generate_token(): string { return bin2hex(random_bytes(24)); }

function find_user_by_email(array $users, string $email): ?array {
  foreach ($users as $u) if (strtolower($u['email']??'')===strtolower($email)) return $u;
  return null;
}
function save_users(JsonStore $store, array $users): void { $store->saveAll($users); }

function register(JsonStore $store, array $body): array {
  $email = trim($body['email'] ?? '');
  $pass  = (string)($body['password'] ?? '');
  $name  = trim($body['displayName'] ?? '');
  $role  = strtolower(trim($body['role'] ?? 'user'));
  if(!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) return ['ok'=>false,'error'=>'email inválido'];
  if(strlen($pass) < 6) return ['ok'=>false,'error'=>'password muy corta'];

  $users = $store->all();
  if (find_user_by_email($users, $email)) return ['ok'=>false,'error'=>'ya existe'];

  // el primer admin
  $hasAdmin = false;
  foreach ($users as $u) if (($u['role']??'user')==='admin') { $hasAdmin=true; break; }
  if ($role!=='admin' || $hasAdmin) $role='user';

  $user = [
    'id'    => 'U'.time(),
    'email' => $email,
    'displayName' => $name ?: $email,
    'password' => password_hash($pass, PASSWORD_DEFAULT),
    'role'  => $role,
    'createdAt'=> time()
  ];
  $users[] = $user; save_users($store, $users);
  return ['ok'=>true, 'user'=>public_user($user)];
}

function login(JsonStore $store, array $body): array {
  $email = trim($body['email'] ?? '');
  $pass  = (string)($body['password'] ?? '');
  $users = $store->all();
  $idx = -1; $user = null;
  foreach ($users as $i=>$u) {
    if (strtolower($u['email']??'')===strtolower($email)) { $idx=$i; $user=$u; break; }
  }
  if ($idx<0 || !$user) return ['ok'=>false,'error'=>'credenciales'];
  if (!password_verify($pass, $user['password'])) return ['ok'=>false,'error'=>'credenciales'];

  $token = generate_token();
  $users[$idx]['token'] = $token; save_users($store, $users);
  return ['ok'=>true, 'token'=>$token, 'user'=>public_user($users[$idx])];
}

function require_auth(JsonStore $store): array {
  $token = Utils\bearer_token();
  if(!$token) Utils\json(['ok'=>false,'error'=>'auth required'],401);
  $users = $store->all();
  foreach ($users as $u) { if (($u['token']??'')===$token) return $u; }
  Utils\json(['ok'=>false,'error'=>'invalid token'],401);
}

function require_admin(JsonStore $store): array {
  $u = require_auth($store);
  if (($u['role'] ?? 'user') !== 'admin') Utils\json(['ok'=>false,'error'=>'forbidden'],403);
  return $u;
}
