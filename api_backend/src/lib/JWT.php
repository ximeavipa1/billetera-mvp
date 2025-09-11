<?php
declare(strict_types=1);

namespace Lib\JWT;

/** Base64 URL-safe */
function b64url(string $data): string {
  return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function b64url_decode(string $data): string {
  return base64_decode(strtr($data, '-_', '+/'));
}

/** HS256 JWT encode */
function encode(array $payload, string $secret): string {
  $header = ['alg' => 'HS256', 'typ' => 'JWT'];
  $h = b64url(json_encode($header, JSON_UNESCAPED_UNICODE));
  $p = b64url(json_encode($payload, JSON_UNESCAPED_UNICODE));
  $sig = b64url(hash_hmac('sha256', "$h.$p", $secret, true));
  return "$h.$p.$sig";
}

/** HS256 JWT decode (devuelve payload o null si firma/exp inválida) */
function decode(string $jwt, string $secret): ?array {
  $parts = explode('.', $jwt);
  if (count($parts) !== 3) return null;
  [$h, $p, $s] = $parts;
  $calc = b64url(hash_hmac('sha256', "$h.$p", $secret, true));
  if (!hash_equals($calc, $s)) return null;

  $payload = json_decode(b64url_decode($p), true);
  if (!is_array($payload)) return null;
  if (isset($payload['exp']) && time() >= (int)$payload['exp']) return null;

  return $payload;
}
